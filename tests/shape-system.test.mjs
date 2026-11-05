import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = file => readFileSync(path.resolve(process.cwd(), file), 'utf8');
const tokens = read('src/styles/tokens.css');
const components = read('src/styles/components.css');
const pages = read('src/styles/pages.css');
const patterns = read('src/styles/patterns.css');
const sections = read('src/styles/sections.css');

test('shape design uses just four reusable Material-inspired tokens', () => {
  assert.match(tokens, /--radius-sm:\s*0\.75rem;/);
  assert.match(tokens, /--radius-md:\s*1rem;/);
  assert.match(tokens, /--radius-lg:\s*1\.75rem;/);
  assert.match(tokens, /--radius-full:\s*999px;/);
  const names = [...tokens.matchAll(/--radius-[a-z-]+\s*:/g)].map(m => m[0]);
  assert.equal(names.length, 4);
});

test('primary, choice, quantity, catalog and dialog action buttons have capsule shapes', () => {
  assert.match(components, /\.button\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  assert.match(components, /\.pill-list button\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  assert.match(pages, /\.quantity button\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
  assert.match(pages, /\.product-actions \.button\s*\{[^}]*inline-size:\s*100%/);
  assert.match(pages, /\.dialog-actions button, \.legal-dialog form button\s*\{[^}]*border-radius:\s*var\(--radius-full\)/);
});

test('cards and previews round moderately, while dialogs are distinctly more rounded', () => {
  assert.match(patterns, /\.box\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  assert.match(pages, /\.product-visual\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  assert.match(pages, /\.configure-preview\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  assert.match(sections, /\.hero-object\s*\{[^}]*border-radius:\s*var\(--radius-md\)/);
  assert.match(pages, /\.legal-dialog\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
  assert.match(pages, /\.mobile-nav\s*\{[^}]*border-radius:\s*var\(--radius-sm\)/);
});

test('text-only actions and physical dice stay independent of site shape scale', () => {
  assert.doesNotMatch(pages.match(/\.legal-links button\s*\{[^}]*\}/)?.[0] ?? '', /border-radius/);
  assert.doesNotMatch(pages.match(/\.text-action\s*\{[^}]*\}/)?.[0] ?? '', /border-radius/);
  assert.match(pages, /\.swatch\s*\{[^}]*border-radius:\s*50%/);
  assert.doesNotMatch(read('src/lib/diceGeometry.ts'), /--radius-/);
});

test('no per-component literal corner radii are introduced', () => {
  const external = [components, pages, patterns, sections, read('src/styles/responsive.css')].join('\n');
  const cssWithSwatchesRemoved = external.replace(/\.swatch\s*\{[^}]*\}/g,'');
  assert.doesNotMatch(cssWithSwatchesRemoved, /border-radius:\s*(?:\d+(?:\.\d+)?(?:px|rem|em)|50%|999px)/);
});
