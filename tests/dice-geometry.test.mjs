import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { diceShapes, fontStyles } from '../src/lib/catalog.ts';

const counts = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, 'd%': 10 };

test('the seven cast GLBs have unique markings placed over the actual facets', async () => {
  const loader = new GLTFLoader();
  for (const shape of diceShapes) {
    const bytes = readFileSync(`public/models/cast/${shape === 'd%' ? 'd00' : shape}.glb`);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', shape);
    const { scene } = await loader.parseAsync(Uint8Array.from(bytes).buffer, '');
    const { markings } = scene.children[0].userData;
    assert.equal(markings.length, counts[shape], shape);
    assert.equal(new Set(markings.map(face => face.label)).size, counts[shape], shape);
    const expected = Array.from({ length: counts[shape] }, (_, i) =>
      shape === 'd%' ? String(i * 10).padStart(2, '0') : String(i + (shape === 'd10' ? 0 : 1)));
    assert.deepEqual(markings.map(face => face.label).sort(), expected.sort(), shape);
    const geometry = scene.getObjectByProperty('isMesh', true).geometry;
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }));
    for (const face of markings) {
      const normal = new Vector3(...face.normal);
      const center = new Vector3(...face.center);
      const up = new Vector3(...face.up);
      assert.ok(Math.abs(normal.length() - 1) < 1e-6, shape);
      assert.ok(Math.abs(normal.dot(up)) < 1e-6, shape);
      assert.ok(face.size > 0, shape);
      const hits = new Raycaster(center, normal.clone().negate(), 0, 0.025).intersectObject(mesh);
      assert.ok(hits.length, shape + ': marking is off the facet');
      assert.ok(hits[0].face.normal.dot(normal) > 0.99, shape + ': facet must be planar');
    }
    if (shape === 'd6') {
      for (let i = 0; i < markings.length; i += 2) {
        assert.equal(Number(markings[i].label) + Number(markings[i + 1].label), 7);
      }
    }
    geometry.dispose();
    mesh.material.dispose();
  }
});

test('each selectable font has a numeral atlas and matching specimen', () => {
  for (const font of fontStyles) {
    for (const suffix of ['', '-sample']) {
      const bytes = readFileSync(`public/numerals/${font}${suffix}.webp`);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', font);
    }
  }
});
