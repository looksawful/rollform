import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diceShapes } from '../src/lib/catalog.ts';
import { buildGeometry, faceLabel, facePlacements } from '../src/lib/diceGeometry.ts';

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


test('Blender bevel models exist and contain normals and more vertices than flat shapes', () => {
  for (const shape of ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']) {
    const bytes = readFileSync('public/models/' + shape + '.glb');
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', shape);
    assert.equal(bytes.readUInt32LE(4), 2, shape);
    const length = bytes.readUInt32LE(12);
    const document = JSON.parse(bytes.toString('utf8', 20, 20 + length));
    const attrs = document.meshes[0].primitives[0].attributes;
    assert.ok(Number.isInteger(attrs.NORMAL), shape);
    const beveledCount = document.accessors[attrs.POSITION].count;
    const flat = buildGeometry(shape);
    assert.ok(beveledCount > flat.getAttribute('position').count, shape);
    flat.dispose();
  }
});
