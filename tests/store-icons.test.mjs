import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = name => readFileSync(path.resolve(process.cwd(), name), 'utf8');
const shell = read('src/components/SiteShell.tsx');
const cart = read('src/components/CartView.tsx');
const config = read('src/components/Configurator.tsx');
const patterns = read('src/styles/patterns.css');
const pages = read('src/styles/pages.css');
const pkg = JSON.parse(read('package.json'));

test('one free tree-shaken Lucide pack, with specific imports only', () => {
  assert.ok(pkg.dependencies?.['lucide-react'], 'Install lucide-react');
  assert.match(shell, /import\s*\{\s*Menu,\s*ShoppingBag\s*\}\s*from\s*'lucide-react'/);
  assert.match(cart, /import\s*\{\s*Minus,\s*Plus,\s*ShoppingBag,\s*Trash2\s*\}\s*from\s*'lucide-react'/);
  assert.match(config, /import\s*\{\s*ShoppingBag\s*\}\s*from\s*'lucide-react'/);
  assert.doesNotMatch(shell + cart + config, /import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react/);
});

test('mobile menu and basket use consistent accessible outline glyphs', () => {
  assert.match(shell, /<summary aria-label="Меню">\s*<Menu\s+className="icon"\s+aria-hidden="true"\s*\/>/);
  assert.match(shell, /<ShoppingBag\s+className="icon"\s+aria-hidden="true"\s*\/>/);
  assert.match(shell, /aria-label=\{'Корзина, товаров: '/);
  assert.doesNotMatch(shell, /hamburger-lines|<svg/);
  assert.doesNotMatch(pages, /\.hamburger-lines/);
});

test('quantity icons keep native buttons with descriptive labels and numeric live region', () => {
  assert.match(cart, /aria-label=\{'Уменьшить количество: ' \+ describe\(item\)\}/);
  assert.match(cart, /aria-label=\{'Увеличить количество: ' \+ describe\(item\)\}/);
  assert.match(cart, /<Minus\s+className="icon"\s+aria-hidden="true"\s*\/>/);
  assert.match(cart, /<Plus\s+className="icon"\s+aria-hidden="true"\s*\/>/);
  assert.match(cart, /<span aria-live="polite">\{item\.quantity\}<\/span>/);
});

test('add to cart maintains visible text plus a decorative bag symbol', () => {
  assert.match(config, /className="button button-black button-fill"[^>]*>\s*<span>В корзину<\/span>\s*<ShoppingBag className="icon" aria-hidden="true"\s*\/>/);
  assert.match(patterns, /\.icon\s*\{[^}]*stroke-width:\s*1\.8/);
  assert.doesNotMatch([shell, cart, config].join('\n'), /<img[^>]*icon/);
});
