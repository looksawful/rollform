import * as THREE from 'three';
import type { DiceShape } from './catalog';

export type FacePlacement = { normal: THREE.Vector3; center: THREE.Vector3 };

/** Regular / equilateral solids and a ten-faced pentagonal trapezohedron. */
export function buildGeometry(shape: DiceShape): THREE.BufferGeometry {
  switch (shape) {
    case 'd4': return new THREE.TetrahedronGeometry(1.65, 0);
    case 'd6': return new THREE.BoxGeometry(2, 2, 2);
    case 'd8': return new THREE.OctahedronGeometry(1.55, 0);
    case 'd10': case 'd%': return tenSidedGeometry();
    case 'd12': return new THREE.DodecahedronGeometry(1.55, 0);
    case 'd20': return new THREE.IcosahedronGeometry(1.6, 0);
  }
}

/** Ten coplanar kite faces, each split into two triangles without an internal edge. */
function tenSidedGeometry(): THREE.BufferGeometry {
  const radius = 1.12;
  const height = 1.62;
  const k = Math.cos(Math.PI / 5);
  const ringHeight = height * (1 - k) / (1 + k);
  const top = new THREE.Vector3(0, 0, height);
  const bottom = new THREE.Vector3(0, 0, -height);
  const upper = Array.from({ length: 5 }, (_, i) => {
    const angle = i * Math.PI * 2 / 5 - Math.PI / 5;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, ringHeight);
  });
  const lower = Array.from({ length: 5 }, (_, i) => {
    const angle = i * Math.PI * 2 / 5;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -ringHeight);
  });
  const positions: number[] = [];
  const append = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) => {
    const center = a.clone().add(b).add(c).add(d).multiplyScalar(0.25);
    const outward = b.clone().sub(a).cross(c.clone().sub(a)).dot(center) >= 0;
    const corners = outward ? [a, b, c, d] : [a, d, c, b];
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const p = corners[index];
      positions.push(p.x, p.y, p.z);
    }
  };
  for (let i = 0; i < 5; i += 1) {
    const next = (i + 1) % 5;
    append(top, upper[i], lower[i], upper[next]);
    append(bottom, lower[next], upper[next], lower[i]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Area-weighted centers of coplanar triangles so D10/D12 get one label per face. */
export function facePlacements(geometry: THREE.BufferGeometry, shape: DiceShape): FacePlacement[] {
  if (shape === 'd6') {
    return [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ].map(x => {
      const normal = new THREE.Vector3(...(x as [number, number, number]));
      return { normal, center: normal.clone() };
    });
  }
  const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = expanded.getAttribute('position');
  const groups: { normal: THREE.Vector3; weighted: THREE.Vector3; area: number }[] = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const cross = b.clone().sub(a).cross(c.clone().sub(a));
    const area = cross.length() * 0.5;
    if (area === 0) continue;
    const normal = cross.normalize();
    const centroid = a.add(b).add(c).multiplyScalar(1 / 3);
    // Float rounding near a boundary must not split one planar face into two.
    const group = groups.find(face => face.normal.dot(normal) > 1 - 1e-5);
    if (group) { group.weighted.addScaledVector(centroid, area); group.area += area; }
    else groups.push({ normal, weighted: centroid.multiplyScalar(area), area });
  }
  if (expanded !== geometry) expanded.dispose();
  return groups.map(({ normal, weighted, area }) => ({
    normal, center: weighted.divideScalar(area),
  }));
}

export function faceLabel(shape: DiceShape, index: number): string {
  if (shape === 'd6') return ['1', '6', '2', '5', '3', '4'][index];
  if (shape === 'd%') return String(index * 10).padStart(2, '0');
  return String(index + 1);
}

/** Small real bevels for the preview: flat face centers, curved edge strips and vertex caps. */
export function buildRoundedGeometry(shape: DiceShape, amount = 0.065, segments = 3): THREE.BufferGeometry {
  const base = buildGeometry(shape);
  const faces = facePlacements(base, shape);
  const attr = base.getAttribute('position');
  const verts = new Map<string, THREE.Vector3>();
  const key = (v: THREE.Vector3) => [v.x, v.y, v.z].map(n => n.toFixed(5)).join(',');
  for (let i = 0; i < attr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(attr, i);
    verts.set(key(v), v);
  }
  const positions: number[] = [], normals: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    na: THREE.Vector3, nb: THREE.Vector3, nc: THREE.Vector3) => {
    if (b.clone().sub(a).cross(c.clone().sub(a)).dot(a.clone().add(b).add(c)) < 0) {
      [b, c] = [c, b]; [nb, nc] = [nc, nb];
    }
    for (const [v, n] of [[a, na], [b, nb], [c, nc]] as const) {
      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
    }
  };
  type Rim = { normal: THREE.Vector3; a: THREE.Vector3; b: THREE.Vector3; aKey: string; bKey: string };
  const edges = new Map<string, Rim[]>();
  for (const { normal, center } of faces) {
    const distance = center.dot(normal);
    const u = (Math.abs(normal.z) < 0.8 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0))
      .cross(normal).normalize();
    const v = normal.clone().cross(u);
    const outline = [...verts.values()].filter(point =>
      Math.abs(point.dot(normal) - distance) < 1e-4)
      .sort((a, b) => Math.atan2(a.clone().sub(center).dot(v), a.clone().sub(center).dot(u))
        - Math.atan2(b.clone().sub(center).dot(v), b.clone().sub(center).dot(u)));
    if (outline.length < 3) throw new Error('Invalid face topology for ' + shape);
    const inset = outline.map(point => point.clone().lerp(center, amount));
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      tri(center, inset[i], inset[j], normal, normal, normal);
      const aKey = key(outline[i]), bKey = key(outline[j]);
      const id = [aKey, bKey].sort().join('/');
      const rim = { normal, a: inset[i], b: inset[j], aKey, bKey };
      if (!edges.has(id)) edges.set(id, []);
      edges.get(id)!.push(rim);
    }
  }
  const caps = new Map<string, { original: THREE.Vector3; points: Map<string, { p: THREE.Vector3; n: THREE.Vector3 }> }>();
  const curve = (a: THREE.Vector3, original: THREE.Vector3, b: THREE.Vector3, t: number) =>
    a.clone().multiplyScalar((1 - t) ** 2)
      .addScaledVector(original, 2 * t * (1 - t)).addScaledVector(b, t * t);
  for (const [id, rims] of edges) {
    if (rims.length !== 2) throw new Error('Non-manifold edge for ' + shape);
    const [aKey, bKey] = id.split('/');
    const [left, right] = rims;
    const forKey = (rim: Rim, vertexKey: string) => rim.aKey === vertexKey ? rim.a : rim.b;
    const rows = Array.from({ length: segments + 1 }, (_, i) => {
      const t = i / segments;
      const normal = left.normal.clone().lerp(right.normal, t).normalize();
      return [aKey, bKey].map(k => {
        const position = curve(forKey(left, k), verts.get(k)!, forKey(right, k), t);
        if (!caps.has(k)) caps.set(k, { original: verts.get(k)!, points: new Map() });
        caps.get(k)!.points.set(key(position), { p: position, n: normal });
        return { p: position, n: normal };
      });
    });
    for (let i = 0; i < segments; i++) {
      const [a, b] = rows[i], [c, d] = rows[i + 1];
      tri(a.p, b.p, d.p, a.n, b.n, d.n);
      tri(a.p, d.p, c.p, a.n, d.n, c.n);
    }
  }
  for (const { original, points } of caps.values()) {
    const normal = original.clone().normalize();
    const center = original.clone().multiplyScalar(1 - amount * 0.16);
    const u = (Math.abs(normal.z) < 0.8 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0))
      .cross(normal).normalize();
    const v = normal.clone().cross(u);
    const border = [...points.values()].sort((a, b) =>
      Math.atan2(a.p.clone().sub(center).dot(v), a.p.clone().sub(center).dot(u))
      - Math.atan2(b.p.clone().sub(center).dot(v), b.p.clone().sub(center).dot(u)));
    for (let i = 0; i < border.length; i++) {
      const a = border[i], b = border[(i + 1) % border.length];
      tri(center, a.p, b.p, normal, a.n, b.n);
    }
  }
  base.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}
