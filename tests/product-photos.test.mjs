import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = readFileSync(path.join(root, 'src/components/ProductCard.tsx'), 'utf8');

test('product covers use photographs rather than SVG sketches', () => {
  assert.match(source, /<img\b/);
  assert.match(source, /photoPath\(index\)/);
  assert.match(source, /Фото-пример/);
  assert.doesNotMatch(source, /DiceGlyph/);
});

test('every preset has a valid local WebP cover', () => {
  for (let i = 1; i <= 9; i++) {
    const file = path.join(root, 'public', 'products', 'demo-' + i + '.webp');
    assert.ok(existsSync(file), file);
    assert.ok(statSync(file).size > 1024, file);
    assert.equal(readFileSync(file).toString('ascii', 8, 12), 'WEBP', file);
  }
});
