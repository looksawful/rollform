import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editor = readFileSync('src/components/Configurator.tsx', 'utf8');
const viewer = readFileSync('src/components/DiceViewer.tsx', 'utf8');
const responsive = readFileSync('src/styles/responsive.css', 'utf8');

test('mobile configurator summary reuses the current config and price', () => {
  assert.match(editor, /const price = formatPrice\(priceForConfig\(config\)\)/);
  assert.match(editor, /const summary = .*config\.shape.*config\.shell.*config\.font/);
  assert.match(editor, /className="configure-mobile-buy"/);
  assert.match(editor, /className="configure-mobile-buy-price">\{price\}/);
  assert.match(responsive, /\.configure-mobile-buy\s*\{\s*display:\s*none/);
  assert.doesNotMatch(responsive, /\.configure-mobile-buy\s*\{[^}]*position:\s*(sticky|fixed)/);
  assert.match(responsive, /safe-area-inset-bottom/);
  assert.match(responsive, /\.configure-controls > \.button\.button-fill,\s*\.configure-controls > \.configure-price\s*\{\s*display:\s*none/);
  assert.equal((editor.match(/<DiceViewer\b/g) || []).length, 1);
});

test('3D preview exposes loading, ready, error and a bounded loading fallback', () => {
  assert.match(viewer, /'loading' \| 'ready' \| 'error'/);
  assert.match(viewer, /setStatus\(lost \? 'error' : 'ready'\)/);
  assert.match(viewer, /setStatus\('error'\)/);
  assert.match(viewer, /window\.setTimeout\(/);
  assert.match(viewer, /window\.clearTimeout\(slowLoad\)/);
  assert.match(viewer, /aria-live="polite"/);
  assert.match(viewer, /status === 'loading' && <div className="dice-loader" role="progressbar"/);
  assert.match(viewer, /aria-valuenow=\{progress\}/);
  assert.match(viewer, /status === 'error' && <div className="canvas-fallback"/);
  assert.match(viewer, /webglcontextlost/);
  assert.match(viewer, /webglcontextrestored/);
});
