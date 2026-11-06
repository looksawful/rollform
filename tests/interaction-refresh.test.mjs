import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { randomDiceConfig, shellColors } from '../src/lib/catalog.ts';

const read = path => readFileSync(path, 'utf8');

test('configurator can randomize all dice properties and never repeats the current shell color', () => {
  const configurator = read('src/components/Configurator.tsx');
  assert.match(configurator, /Создать случайный кубик/);
  assert.match(configurator, /randomDiceConfig\(Math\.random, config\.shell\)/);
  for (const current of shellColors) {
    for (const n of [0, 0.1, 0.3, 0.5, 0.7, 0.99]) {
      const config = randomDiceConfig(() => n, current.value);
      assert.notEqual(config.shell, current.value);
      assert.ok(shellColors.some(x => x.value === config.shell));
    }
  }
});

test('dark theme and its header control are temporarily disabled for client review', () => {
  const shell = read('src/components/SiteShell.tsx');
  assert.doesNotMatch(shell, /theme-toggle|rollform:theme/);
  assert.match(shell, /data-theme="light"/);
  assert.ok(!existsSync('src/app/dark/page.tsx'));
});

test('all actual 3D previews support click-to-stop and orbit rotation/limited wheel zoom', () => {
  const viewer = read('src/components/DiceViewer.tsx');
  assert.match(viewer, /OrbitControls/);
  assert.match(viewer, /controls\.enablePan = false/);
  assert.match(viewer, /controls\.minDistance/);
  assert.match(viewer, /controls\.maxDistance/);
  assert.match(viewer, /timeline\?\.kill\(\)/);
  assert.match(viewer, /3D-превью/);
  assert.match(read('src/components/ProductDetail.tsx'), /<DiceViewer config=\{product\.config\}/);
});

test('nine catalog cards use three equal fluid desktop tracks and two on narrow screens', () => {
  const css = read('src/styles/pages.css');
  assert.match(css, /\.product-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.product-grid\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test('add-to-cart cards have a plus, a live quantity, and reduced-motion-safe interaction states', () => {
  const card = read('src/components/ProductCard.tsx');
  const css = read('src/styles/pages.css') + read('src/styles/components.css');
  assert.match(card, /<Plus className="icon"/);
  assert.match(card, /item\.origin\.presetId === product\.id/);
  assert.match(card, /key=\{quantity\}/);
  assert.match(css, /@keyframes add-count-pop/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:active/);
});
