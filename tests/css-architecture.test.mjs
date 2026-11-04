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

test('all documented layout primitives have real CSS algorithms', () => {
  const css = read('src/styles/patterns.css');
  const names = ['wrapper', 'stack', 'prose', 'pile', 'cluster', 'split',
    'grid', 'reel', 'scroller', 'frame', 'sidebar', 'switcher', 'cover',
    'imposter', 'center', 'box'];
  for (const name of names) {
    assert.ok(css.includes('.' + name + ' '), name);
  }
  assert.match(css, /\.prose\s*>\s*\*\s*\+\s*\*/);
  assert.match(css, /margin-block-start:\s*var\(--prose-gap,\s*1em\)/);
  assert.match(css, /grid-template-areas:\s*["']pile["']/);
  assert.match(css, /\.pile\s*>\s*\*\s*\{\s*grid-area:\s*pile;/);
  assert.match(css, /flex-wrap:\s*wrap/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /--sidebar-width/);
  assert.match(css, /--switcher-threshold/);
  assert.match(css, /--cover-min-height/);
  assert.match(css, /transform:\s*translate\(-50%,\s*-50%\)/);
});

test('layout composition reuses primitives with a deliberate mobile split exception', () => {
  const home = read('src/components/Storefront.tsx');
  const card = read('src/components/ProductCard.tsx');
  const catalog = read('src/app/catalog/page.tsx');
  const cart = read('src/components/CartView.tsx');
  const contacts = read('src/app/contacts/page.tsx');
  const shell = read('src/components/SiteShell.tsx');
  const pages = read('src/styles/pages.css');
  assert.match(home, /className="product-scroller reel"/);
  assert.match(home, /id="about"/);
  assert.match(home, /className="wrapper section prose"/);
  assert.match(card, /className="product-visual pile frame"/);
  assert.match(catalog, /className="product-grid grid"/);
  assert.match(cart, /className="empty-state box cover stack"/);
  assert.match(contacts, /center prose/);
  assert.match(shell, /className="wrapper footer-inner switcher"/);
  assert.match(pages, /\.hero\.split\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.05fr\)\s+minmax\(0,\s*0\.95fr\)/);
});

test('bento follows a five-cell two-row named-area layout', () => {
  const home = read('src/components/Storefront.tsx');
  const css = read('src/styles/pages.css');
  assert.match(home, /className="bento-grid"/);
  assert.match(home, /className="bento-viewport"/);
  assert.match(home, /tabIndex=\{0\}/);
  assert.match(home, /Array\.from\(\{ length: 5 \}/);
  assert.equal((home.match(/className="bento-card prose"/g) || []).length, 1);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"one one one one two two two three three three three three"/);
  assert.match(css, /"four four four four four four four five five five five five"/);
  assert.match(css, /grid-template-rows:\s*repeat\(2,/);
  assert.match(css, /min-inline-size:\s*max\(100%,/);
  assert.match(css, /\.bento-viewport\s*\{[^}]*overflow-x:\s*auto/);
  assert.doesNotMatch(home, /<img|<Image|<AsyncImage/);
  assert.ok(home.indexOf('className="hero-copy') < home.indexOf('className="bento-grid"'));
  assert.ok(home.indexOf('className="bento-grid"') < home.indexOf('id="catalog"'));
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

test('storefront restores catalog, product cards, about, and contacts', () => {
  const home = read('src/components/Storefront.tsx');
  const chrome = read('src/components/SiteShell.tsx');
  const catalog = read('src/app/catalog/page.tsx');
  const contact = read('src/app/contacts/page.tsx');
  const card = read('src/components/ProductCard.tsx');
  assert.match(home, /id="about"/);
  assert.match(home, /id="contacts"/);
  assert.match(home, /ProductCard/);
  assert.match(catalog, /ProductCard/);
  assert.match(contact, /Текст/);
  assert.match(chrome, /Юридическая информация/);
  assert.match(chrome, /Контакты/);
  assert.match(card, /В корзину/);
});

test('content stays generic, with no draft, copy action, or demo notice', () => {
  const home = read('src/components/Storefront.tsx');
  const cart = read('src/components/CartView.tsx');
  const builder = read('src/components/Configurator.tsx');
  const content = home + cart + builder + read('src/components/SiteShell.tsx') +
    read('src/components/ProductCard.tsx') + read('src/app/catalog/page.tsx') +
    read('src/app/contacts/page.tsx');
  assert.match(home, />Заголовок<\/h1>/);
  assert.match(home, />Текст<\/p>/);
  assert.match(home, />Кнопка<\/Link>/);
  assert.match(builder, />В корзину<\/button>/);
  assert.doesNotMatch(cart, /makeOrderText|clipboard|textarea|order-draft/);
  assert.doesNotMatch(content, /демо|прототип|черновик|не отправляется|предзаказ/i);
});

test('brand placeholder is not a fabricated brand name', () => {
  const shell = read('src/components/SiteShell.tsx');
  const layout = read('src/app/layout.tsx');
  assert.match(shell, />Логотип<\/Link>/);
  assert.match(shell, /aria-label="Логотип, на главную"/);
  assert.doesNotMatch(shell + layout, /ROLLFORM/);
  assert.match(layout, /title: 'Логотип'/);
});

test('mobile header has hamburger navigation and always-visible cart shortcut', () => {
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/pages.css');
  assert.match(shell, /<details className="mobile-menu"/);
  assert.match(shell, /<summary aria-label="Меню"/);
  assert.match(shell, /className="cart-shortcut"/);
  assert.match(shell, /<svg[^>]*aria-hidden="true"/);
  assert.match(css, /\.mobile-menu\s*\{/);
  assert.match(css, /\.cart-shortcut\s*\{/);
});

test('homepage offers keyboard-accessible horizontal catalog and mobile split', () => {
  const home = read('src/components/Storefront.tsx');
  const css = read('src/styles/pages.css') + read('src/styles/responsive.css') + read('src/styles/patterns.css');
  assert.match(home, /className="product-scroller reel"/);
  assert.match(home, /tabIndex=\{0\}/);
  assert.match(css, /grid-auto-flow:\s*column/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /\.hero\.split\s*\{/);
});

test('about section uses the requested placeholder paragraph', () => {
  const home = read('src/components/Storefront.tsx');
  assert.match(home, /Внимание, этот текст является рыбой/);
});

test('theme uses a black and white palette only', () => {
  const tokens = read('src/styles/tokens.css');
  assert.match(tokens, /--ink:\s*#000000;/);
  assert.match(tokens, /--paper:\s*#ffffff;/);
  const others = [...tokens.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(x => x[0].toLowerCase());
  assert.deepEqual(new Set(others), new Set(['#000000', '#ffffff']));
});
