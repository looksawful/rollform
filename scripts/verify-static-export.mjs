import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'out';
const routes = ['', 'catalog', 'configure', 'cart', 'product', 'production', 'contacts', 'material-lab'];
for (const path of routes) {
  const html = join(root, path, 'index.html');
  assert.ok(existsSync(html), 'Exported route is missing: ' + html);
  assert.ok(statSync(html).size > 1000, 'Empty route: ' + html);
}
const labHTML = readFileSync(join(root, 'material-lab', 'index.html'), 'utf8');
assert.match(labHTML, /noindex/i, 'Unlisted material lab must not be indexed');

function validateGLB(path, expectedMeshes) {
  assert.ok(existsSync(path), 'Missing model: ' + path);
  const binary = readFileSync(path);
  assert.equal(binary.toString('ascii', 0, 4), 'glTF', 'Not a GLB: ' + path);
  const jsonSize = binary.readUInt32LE(12);
  const meta = JSON.parse(binary.toString('utf8', 20, 20 + jsonSize));
  assert.ok(meta.meshes?.length >= expectedMeshes, 'Missing required geometry: ' + path);
  for (const mesh of meta.meshes) {
    assert.ok(mesh.primitives.every(item => 'TEXCOORD_0' in item.attributes),
      'Mesh lacks UVs: ' + path);
  }
}
const shapes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
for (const shape of shapes) {
  validateGLB(join(root, 'models', 'material-lab', shape + '.glb'), 1);
}
for (const shape of [...shapes, 'd00']) {
  validateGLB(join(root, 'models', 'epoxy', shape + '.glb'), 1);
  for (const font of ['nova-flat', 'square-antiqua', 'simply-serif', 'simply-mono']) {
    validateGLB(join(root, 'models', 'epoxy-font', font, shape + '.glb'), 2);
  }
}
for (const name of ['Plastic006', 'Plastic007', 'Plastic008', 'Plastic009']) {
  for (const suffix of ['Roughness', 'NormalGL']) {
    assert.ok(existsSync(join(root, 'material-lab-textures', name + '_' + suffix + '.webp')));
  }
}
assert.ok(existsSync(join(root, 'material-lab-textures', 'Scratches005_NormalGL.webp')));
console.log('Static export verified: 8 routes, 41 UV GLBs, 9 CC0 maps; noindex material-lab');
