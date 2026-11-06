import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { themeHref } from '../src/lib/themeRoutes.ts';
const read = path => readFileSync(path, 'utf8');

test('one route for each screen, no separate dark pages', () => {
  for (const path of ['page.tsx', 'catalog/page.tsx', 'configure/page.tsx', 'cart/page.tsx', 'contacts/page.tsx', 'production/page.tsx', 'product/page.tsx']) {
    assert.ok(existsSync('src/app/' + path), path);
    assert.ok(!existsSync('src/app/dark/' + path), 'no dark ' + path);
  }
});
test('links do not depend on the selected theme', () => {
  for (const href of ['/', '/#about', '/catalog', '/configure', '/cart', '/contacts', '/production', '/product?item=demo-1']) {
    assert.equal(themeHref('/catalog/', href), href);
    assert.equal(themeHref('/dark/catalog/', href), href);
  }
});
test('theme persists in the shell and CSS uses the same semantic colors', () => {
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/tokens.css');
  const pages = read('src/styles/pages.css');
  assert.match(shell, /className="theme-toggle"/);
  assert.match(shell, /localStorage\.getItem\('rollform:theme'\)/);
  assert.match(shell, /localStorage\.setItem\('rollform:theme'/);
  assert.match(shell, /data-theme=\{dark \? 'dark' : 'light'\}/);
  assert.match(css, /\.site\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;/);
  assert.match(pages, /\.site\s*\{[^}]*background:\s*var\(--color-background\)/);
});
