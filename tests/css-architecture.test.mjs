import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => readFileSync(path.join(root, file), 'utf8');

const cssFiles = ['src/styles/tokens.css','src/styles/base.css','src/styles/patterns.css','src/styles/components.css','src/styles/sections.css','src/styles/responsive.css','src/styles/pages.css'];

test('entry point declares predictable cascade order and imports exactly one copy of each layer', () => {
  const entry = read('src/app/globals.css');
  assert.match(entry, /@layer theme, base, layouts, components, utilities;/);
  assert.doesNotMatch(entry, /@import ["']tailwindcss["'];/);
  for (const file of cssFiles) {
    assert.equal(entry.split(`../${file.replace('src/', '')}`).length - 1, 1, file);
  }
});

test('layout primitives are reusable and decoupled from components', () => {
  const patterns = read('src/styles/patterns.css');
  for (const cls of ['wrapper','stack','cluster','split','auto-grid','prose','pile']) {
    assert.match(patterns, new RegExp(`\\.${cls}(?:\\s*>)?[^{}]*\\{`), cls);
  }
  assert.match(patterns, /--stack-space/);
  assert.match(patterns, /--split-min/);
  assert.match(patterns, /--auto-grid-min/);
  assert.match(patterns, /margin-block-start:\s*var\(--prose-flow,\s*1em\)/);
});

test('components use intrinsic layout and retain accessible user-preference changes', () => {
  const frontend = read('src/components/Storefront.tsx');
  const catalog = read('src/app/catalog/page.tsx');
  const card = read('src/components/ProductCard.tsx');
  assert.match(catalog, /className="auto-grid product-grid"/);
  assert.match(card, /className="product-visual pile"/);
  assert.match(frontend, /className="about-copy prose"/);
  const combined = cssFiles.map(read).join('\n');
  assert.match(combined, /@media\s*\(width\s*<=\s*56rem\)/);
  assert.match(combined, /@container\s*\(width\s*<\s*18rem\)/);
  assert.match(combined, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(combined, /!important/);
});

test('theme uses a black and white palette only', () => {
  const tokens = read('src/styles/tokens.css');
  assert.match(tokens, /--ink:\s*#000000;/);
  assert.match(tokens, /--paper:\s*#ffffff;/);
  const others = [...tokens.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(x => x[0].toLowerCase());
  assert.deepEqual(new Set(others), new Set(['#000000', '#ffffff']));
});
