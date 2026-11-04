import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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

test('layout primitives stay simple', () => {
  const patterns = read('src/styles/patterns.css');
  for (const cls of ['wrapper', 'stack', 'cluster', 'split']) {
    assert.ok(patterns.includes('.' + cls + ' {'), cls);
  }
  assert.match(patterns, /--stack-space/);
  assert.match(patterns, /--split-min/);
});

test('prototype keeps responsive layout and reduced motion', () => {
  const frontend = read('src/components/Storefront.tsx');
  const builder = read('src/components/Configurator.tsx');
  assert.match(frontend, /className="wrapper hero split"/);
  assert.match(builder, /className="configure-layout"/);
  const combined = cssFiles.map(read).join('\n');
  assert.match(combined, /@media\s*\(width\s*<=\s*56rem\)/);
  assert.match(combined, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(combined, /!important/);
});

test('wireframe keeps a single prototype path and placeholder copy', () => {
  const home = read('src/components/Storefront.tsx');
  const chrome = read('src/components/SiteShell.tsx');
  assert.match(home, />Заголовок<\/h1>/);
  assert.match(home, />Текст<\/p>/);
  assert.doesNotMatch(home, /product-strip|Следующая форма|object-pause|builder-invite/);
  assert.doesNotMatch(chrome, /Каталог|О проекте|mobile-navigation/);
  assert.equal(existsSync(path.join(root, 'src/app/catalog/page.tsx')), false);
});

test('theme uses a black and white palette only', () => {
  const tokens = read('src/styles/tokens.css');
  assert.match(tokens, /--ink:\s*#000000;/);
  assert.match(tokens, /--paper:\s*#ffffff;/);
  const others = [...tokens.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(x => x[0].toLowerCase());
  assert.deepEqual(new Set(others), new Set(['#000000', '#ffffff']));
});
