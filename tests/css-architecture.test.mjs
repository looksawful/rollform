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
  const names = ['wrapper', 'stack', 'prose', 'cluster', 'split',
    'grid', 'reel', 'scroller', 'frame', 'sidebar', 'switcher', 'cover',
    'center', 'box'];
  for (const name of names) {
    assert.ok(css.includes('.' + name + ' '), name);
  }
  assert.match(css, /\.prose\s*>\s*\*\s*\+\s*\*/);
  assert.match(css, /margin-block-start:\s*var\(--prose-gap,\s*1\.25rem\)/);
  assert.match(css, /flex-wrap:\s*wrap/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /--sidebar-width/);
  assert.match(css, /--switcher-threshold/);
  assert.match(css, /--cover-min-height/);
});

test('layout composition reuses primitives with a deliberate mobile split exception', () => {
  const home = read('src/components/Storefront.tsx');
  const card = read('src/components/ProductCard.tsx');
  const catalog = read('src/app/catalog/page.tsx');
  const cart = read('src/components/CartView.tsx');
  const contacts = read('src/app/contacts/page.tsx');
  const shell = read('src/components/SiteShell.tsx');
  const pages = read('src/styles/pages.css');
  assert.match(read('src/components/ProductGallery.tsx'), /product-scroller reel/);
  assert.match(home, /id="about"/);
  assert.match(home, /className="wrapper section prose"/);
  assert.match(card, /className="product-visual frame"/);
  assert.match(read('src/components/ProductGallery.tsx'), /product-grid grid/);
  assert.match(cart, /className="empty-state box cover stack"/);
  assert.match(contacts, /page-section stack/);
  assert.match(contacts, /<ContactContent/);
  assert.match(shell, /className="wrapper footer-inner switcher"/);
  assert.match(pages, /\.hero\.split\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.05fr\)\s+minmax\(0,\s*0\.95fr\)/);
});

test('Bento layout is preserved but disconnected until the copy is validated', () => {
  const home = read('src/components/Storefront.tsx');
  const bento = read('src/components/BentoSection.tsx');
  const css = read('src/styles/pages.css');
  assert.doesNotMatch(home, /bento-section|BentoSection|bento-grid/);
  assert.match(bento, /className="bento-grid"/);
  assert.match(bento, /className="bento-viewport scroller"/);
  assert.match(bento, /tabIndex=\{0\}/);
  assert.equal((bento.match(/className="bento-card box"/g) || []).length, 1);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"one one one one two two two three three three three three"/);
  assert.match(css, /"four four four four four four four five five five five five"/);
});

test('prototype keeps responsive layout and reduced motion', () => {
  const frontend = read('src/components/Storefront.tsx');
  const builder = read('src/components/Configurator.tsx');
  assert.match(frontend, /className="wrapper hero split"/);
  assert.match(builder, /className="configure-layout sidebar"/);
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
  assert.match(home, /ProductGallery/);
  assert.match(catalog, /ProductGallery/);
  assert.match(contact, /ContactContent/);
  assert.match(chrome, /Юридическая информация/);
  assert.match(chrome, /Контакты/);
  assert.match(card, /В корзину/);
});

test('copy stays generic while contact form is clearly marked as non-sending', () => {
  const home = read('src/components/Storefront.tsx');
  const cart = read('src/components/CartView.tsx');
  const builder = read('src/components/Configurator.tsx');
  const content = home + cart + builder + read('src/components/SiteShell.tsx') +
    read('src/components/ProductCard.tsx') + read('src/app/catalog/page.tsx') +
    read('src/app/contacts/page.tsx');
  assert.match(home, />Заголовок<\/h1>/);
  assert.match(home, />Текст<\/p>/);
  assert.match(home, />Собрать кубик<\/Link>/);
  assert.match(builder, /<span>В корзину<\/span><ShoppingBag/);
  assert.doesNotMatch(cart, /makeOrderText|clipboard|textarea|order-draft/);
  assert.doesNotMatch(content, /демо|прототип|черновик|не отправляется|предзаказ/i);
});

test('brand placeholder is not a fabricated brand name', () => {
  const shell = read('src/components/SiteShell.tsx');
  const layout = read('src/app/layout.tsx');
  assert.match(shell, />Лого<\/Link>/);
  assert.match(shell, /aria-label="На главную"/);
  assert.doesNotMatch(shell + layout, /ROLLFORM/);
  assert.match(layout, /title: 'Лого'/);
});

test('mobile header has hamburger navigation and always-visible cart shortcut', () => {
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/pages.css');
  assert.match(shell, /<details className="mobile-menu"/);
  assert.match(shell, /<summary aria-label="Меню"/);
  assert.match(shell, /className="cart-shortcut"/);
  assert.match(shell, /<ShoppingBag className="icon" aria-hidden="true"\s*\/>/);
  assert.match(css, /\.mobile-menu\s*\{/);
  assert.match(css, /\.cart-shortcut\s*\{/);
});

test('homepage offers keyboard-accessible horizontal catalog and mobile split', () => {
  const home = read('src/components/Storefront.tsx');
  const css = read('src/styles/pages.css') + read('src/styles/responsive.css') + read('src/styles/patterns.css');
  assert.match(read('src/components/ProductGallery.tsx'), /product-scroller reel/);
  assert.match(read('src/components/ProductGallery.tsx'), /tabIndex: 0/);
  assert.match(css, /grid-auto-flow:\s*column/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /\.hero\.split\s*\{/);
});

test('about section uses the requested placeholder paragraph', () => {
  const home = read('src/components/Storefront.tsx');
  assert.match(home, /Внимание, этот текст является рыбой/);
});

test('monochrome design tokens separate primitive colors from semantic roles', () => {
  const tokens = read('src/styles/tokens.css');
  assert.match(tokens, /--color-black:\s*#000000;/);
  assert.match(tokens, /--color-white:\s*#ffffff;/);
  for (const role of ['background', 'surface', 'text', 'border', 'action', 'on-action', 'focus', 'preview']) {
    assert.match(tokens, new RegExp('--color-' + role + ':'));
  }
  assert.match(tokens, /\.site\s*\{[^}]*--color-background:\s*var\(--color-white\)/);
  assert.match(tokens, /\.site\s*\{[^}]*--color-text:\s*var\(--color-black\)/);
  const hexes = [...tokens.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(x => x[0].toLowerCase());
  assert.deepEqual(new Set(hexes), new Set(['#000000', '#ffffff']));
});

test('fixed light and dark route scopes control related variables without OS preference', () => {
  const tokens = read('src/styles/tokens.css');
  const shell = read('src/components/SiteShell.tsx');
  assert.match(tokens, /:root\s*\{[^}]*color-scheme:\s*light;/);
  assert.match(tokens, /\.site\s*\{[^}]*color-scheme:\s*light;/);
  assert.match(tokens, /\.site\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;/);
  assert.match(tokens, /\.site\[data-theme="dark"\]\s*\{[^}]*--color-background:\s*var\(--color-black\)/);
  assert.match(tokens, /\.site\[data-theme="dark"\]\s*\{[^}]*--color-text:\s*var\(--color-white\)/);
  assert.match(shell, /data-theme=\{dark \? 'dark' : 'light'\}/);
  assert.doesNotMatch(shell, /theme-toggle|Тёмная тема|Светлая тема/i);
});

test('site CSS uses semantic theme roles, not raw colors or legacy ink-paper tokens', () => {
  const combined = cssFiles.map(read).join('\n');
  const rest = cssFiles.filter(x => !x.endsWith('/tokens.css')).map(read).join('\n');
  assert.doesNotMatch(combined, /--ink\b|--paper\b|var\(--line\)/);
  assert.doesNotMatch(rest, /#[a-f0-9]{3,8}\b/i);
  assert.match(read('src/styles/components.css'), /--button-background:\s*var\(--color-action\)/);
  assert.match(read('src/styles/components.css'), /--button-text:\s*var\(--color-on-action\)/);
  assert.match(read('src/styles/sections.css'), /background:\s*var\(--color-preview\)/);
  assert.match(read('src/styles/base.css'), /outline:\s*2px solid var\(--color-focus\)/);
  assert.match(read('src/styles/pages.css'), /\.topbar\s*\{[^}]*background:\s*var\(--color-surface\)/);
});


test('horizontal product reel centers and gently scales cards as they scroll', () => {
  const pages = read('src/styles/pages.css');
  const gallery = read('src/components/ProductGallery.tsx');
  assert.match(gallery, /product-scroller reel/);
  assert.match(pages, /--reel-card-size:\s*clamp\(17rem,\s*30vw,\s*24rem\)/);
  assert.match(pages, /padding-inline:\s*max\(0px,\s*calc\(\(100% - var\(--reel-card-size\)\) \/ 2\)\)/);
  assert.match(pages, /scroll-snap-type:\s*x mandatory/);
  assert.match(pages, /scroll-snap-align:\s*center/);
  assert.match(pages, /@keyframes reel-center-focus/);
  assert.match(pages, /35%, 65%\s*\{\s*opacity:\s*1;\s*scale:\s*1;/);
  assert.match(pages, /animation-timeline:\s*view\(inline\)/);
  assert.match(pages, /prefers-reduced-motion:\s*no-preference/);
  assert.match(gallery, /product-grid grid/);
});
