import test from 'node:test';
import assert from 'node:assert/strict';
import { diceShapes } from '../src/lib/catalog.ts';
import { buildGeometry, buildRoundedGeometry, faceLabel, facePlacements } from '../src/lib/diceGeometry.ts';

const counts = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, 'd%': 10 };

test('all dice have distinct labels on the expected number of planar faces', () => {
  for (const shape of diceShapes) {
    const geometry = buildGeometry(shape);
    const faces = facePlacements(geometry, shape);
    assert.equal(faces.length, counts[shape], shape);
    assert.equal(new Set(faces.map((_, i) => faceLabel(shape, i))).size, counts[shape], shape);
    for (const face of faces) {
      assert.ok(Math.abs(face.normal.length() - 1) < 1e-6, shape);
      assert.ok(Number.isFinite(face.center.x + face.center.y + face.center.z), shape);
    }
    geometry.dispose();
  }
});

test('opposite D6 faces add to seven', () => {
  for (let i = 0; i < 6; i += 2) {
    assert.equal(Number(faceLabel('d6', i)) + Number(faceLabel('d6', i + 1)), 7);
  }
});

test('percentile D10 uses 00 to 90 in tens', () => {
  assert.deepEqual(Array.from({length: 10}, (_, i) => faceLabel('d%', i)).sort(),
    ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']);
});

test('rounded preview geometries have real additional topology and valid outward normals', () => {
  for (const shape of diceShapes) {
    const original = buildGeometry(shape);
    const rounded = buildRoundedGeometry(shape, 0.065, 3);
    const p = rounded.getAttribute('position');
    const n = rounded.getAttribute('normal');
    assert.ok(p.count > original.getAttribute('position').count * 2, shape);
    assert.equal(p.count, n.count, shape);
    assert.equal(p.count % 3, 0, shape);
    for (let i = 0; i < p.count; i += 3) {
      const a = new Array(3).fill(0).map((_, j) => p.getX(i + j));
      const b = new Array(3).fill(0).map((_, j) => p.getY(i + j));
      const c = new Array(3).fill(0).map((_, j) => p.getZ(i + j));
      for (const v of [...a, ...b, ...c]) assert.ok(Number.isFinite(v), shape);
      for (let j = 0; j < 3; j++) {
        const len = Math.hypot(n.getX(i + j), n.getY(i + j), n.getZ(i + j));
        assert.ok(Math.abs(len - 1) < 1e-4, shape);
      }
    }
    rounded.dispose();
    original.dispose();
  }
});

test('rounded D6, D12 and D20 are closed watertight triangle meshes', () => {
  for (const shape of ['d6','d12','d20']) {
    const geom = buildRoundedGeometry(shape, 0.065, 3);
    const p = geom.getAttribute('position');
    const key = i => [p.getX(i),p.getY(i),p.getZ(i)].map(n=>n.toFixed(5)).join(',');
    const edgeCounts = new Map();
    for (let i = 0; i < p.count; i += 3) {
      for (const [a,b] of [[0,1],[1,2],[2,0]]) {
        const x=key(i+a),y=key(i+b);
        const edge=[x,y].sort().join('/');
        edgeCounts.set(edge,(edgeCounts.get(edge)||0)+1);
      }
    }
    const bad=[...edgeCounts.values()].filter(n=>n!==2);
    assert.deepEqual(bad, [], shape+' open or non-manifold edges');
    geom.dispose();
  }
});
