import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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


test('Blender GLB surfaces keep all number planes in their original positions', async () => {
  const loader = new GLTFLoader();
  for (const shape of ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']) {
    const bytes = readFileSync('public/models/' + shape + '.glb');
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const gltf = await new Promise((resolve, reject) => loader.parse(data, '', resolve, reject));
    gltf.scene.updateMatrixWorld(true);
    const model = gltf.scene.getObjectByProperty('isMesh', true);
    assert.ok(model, shape);
    const geometry = model.geometry.clone().applyMatrix4(model.matrixWorld);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const original = buildGeometry(shape);
    for (const { normal, center } of facePlacements(original, shape)) {
      const ray = new THREE.Raycaster(center.clone().addScaledVector(normal, 0.6),
        normal.clone().negate(), 0, 1.5);
      const hits = ray.intersectObject(mesh);
      assert.ok(hits.length, shape + ': missing front face');
      assert.ok(hits[0].point.distanceTo(center) < 0.001, shape + ': number plane displaced');
    }
    original.dispose();
    geometry.dispose();
    mesh.material.dispose();
  }
});
