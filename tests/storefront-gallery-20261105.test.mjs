import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = file => readFileSync(file, 'utf8');

test('one FAQ on the existing homepage, with accessible native disclosures', () => {
  const home = source('src/components/Storefront.tsx');
  assert.match(home, /id="faq"/);
  assert.match(home, /<h2[^>]*>Частые вопросы<\/h2>/);
  assert.ok((home.match(/<details\b/g) || []).length >= 4);
  assert.match(home, /<summary>/);
  assert.match(home, /id="about"/); // existing informational section remains
  assert.doesNotMatch(home, /BentoSection/);
});

test('production and receiving conditions share the existing route', () => {
  const production = source('src/components/ProductionInfo.tsx');
  assert.match(production, /Изготовление и доставка/);
  assert.match(production, /Кубики на заказ/);
  assert.match(production, /Кубики в наличии/);
  assert.match(production, /самовывоз|самостоятельно/);
  assert.match(production, /курьерск/);
  assert.match(production, /в течение недели/);
  assert.match(production, /срок.*уточняется/i);
  assert.ok(existsSync('src/app/production/page.tsx'));
  assert.ok(existsSync('src/app/dark/production/page.tsx'));
});

test('one shared lightbox handles all nine preset images across both routes', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const home = source('src/components/Storefront.tsx');
  const catalog = source('src/app/catalog/page.tsx');
  assert.match(gallery, /yet-another-react-lightbox/);
  assert.match(gallery, /<Lightbox/);
  assert.match(gallery, /slides=\{slides\}/);
  assert.match(gallery, /<ProductCard/);
  assert.match(home, /<ProductGallery/);
  assert.match(catalog, /<ProductGallery/);
  assert.match(gallery, /mode === 'reel'/);
});

test('cards keep builder link and add a separate keyboard-operable photo preview', () => {
  const card = source('src/components/ProductCard.tsx');
  assert.match(card, /className="product-visual frame"/);
  assert.match(card, /href=\{url\}/);
  assert.match(card, /onPreview/);
  assert.match(card, /aria-label=\{['"]Увеличить изображение/);
  assert.match(card, />В корзину<\/button>/);
});

test('cart links to the shared preparation and delivery information without checkout promises', () => {
  const cart = source('src/components/CartView.tsx');
  assert.match(cart, /items.length > 0 && <p className="cart-delivery">/);
  assert.match(cart, /href=\{themeHref\(pathname, '\/production'\)\}/);
  assert.doesNotMatch(cart, /<button[^>]*>Оплатить/);
});
