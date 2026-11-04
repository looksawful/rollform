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
  assert.match(shell, />логотип<\/Link>/);
  assert.match(shell, /aria-label="логотип, на главную"/);
  assert.doesNotMatch(shell + layout, /ROLLFORM/);
  assert.match(layout, /title: 'логотип'/);
});

test('theme uses a black and white palette only', () => {
  const tokens = read('src/styles/tokens.css');
  assert.match(tokens, /--ink:\s*#000000;/);
  assert.match(tokens, /--paper:\s*#ffffff;/);
  const others = [...tokens.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(x => x[0].toLowerCase());
  assert.deepEqual(new Set(others), new Set(['#000000', '#ffffff']));
});
