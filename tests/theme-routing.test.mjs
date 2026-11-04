import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDarkPath, themeHref } from '../src/lib/themeRoutes.ts';

const root = process.cwd();
const read = file => readFileSync(path.join(root, file), 'utf8');

test('light and dark URLs use the same five screens', () => {
  for (const route of ['page.tsx', 'catalog/page.tsx', 'configure/page.tsx', 'cart/page.tsx', 'contacts/page.tsx']) {
    assert.ok(existsSync(path.join(root, 'src/app', route)), route);
    assert.ok(existsSync(path.join(root, 'src/app/dark', route)), 'dark/' + route);
  }
});

test('theme is selected by URL, not OS preference or similar-looking path', () => {
  for (const pathname of ['/dark', '/dark/', '/dark/catalog/', '/dark/cart/']) {
    assert.equal(isDarkPath(pathname), true, pathname);
  }
  for (const pathname of ['/', '/catalog/', '/cart/', '/darkness', '/dark-mode/']) {
    assert.equal(isDarkPath(pathname), false, pathname);
  }
});

test('all internal links remain inside their selected theme', () => {
  for (const href of ['/', '/#about', '/catalog', '/configure', '/cart', '/contacts', '/configure?preset=demo-1']) {
    assert.equal(themeHref('/catalog/', href), href);
    assert.equal(themeHref('/dark/catalog/', href), '/dark' + href);
  }
});

test('theme applies on first render without a JS theme switcher', () => {
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/tokens.css');
  const pages = read('src/styles/pages.css');
  assert.match(shell, /data-theme=\{dark \? 'dark' : 'light'\}/);
  assert.match(css, /color-scheme:\s*light;/);
  assert.match(css, /\.site\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;/);
  assert.match(css, /\.site\[data-theme="dark"\]\s*\{[^}]*--color-background:\s*var\(--color-black\)/);
  assert.match(pages, /\.site\s*\{[^}]*background:\s*var\(--color-background\)/);
  assert.match(pages, /\.site\s*\{[^}]*color:\s*var\(--color-text\)/);
  assert.doesNotMatch(shell, /theme-toggle/);
});

test('catalog, configurator and cart links remain on the theme URL', () => {
  for (const file of ['src/components/Storefront.tsx', 'src/components/ProductCard.tsx',
    'src/components/Configurator.tsx', 'src/components/CartView.tsx', 'src/components/SiteShell.tsx']) {
    assert.match(read(file), /themeHref|useThemeHref/, file);
  }
});
