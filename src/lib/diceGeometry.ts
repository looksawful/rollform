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
