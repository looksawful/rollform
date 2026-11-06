import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(file, 'utf8');

test('About uses a single full-width panorama instead of a three-photo collage', () => {
  const home = read('src/components/Storefront.tsx');
  const about = home.split('id="about"')[1].split('id="faq"')[0];
  assert.equal((about.match(/<figure\b/g) || []).length, 1);
  assert.match(about, /className="about-panorama/);
  assert.doesNotMatch(about, /editorial-mini-grid/);
  const css = read('src/styles/pages.css');
  assert.match(css, /\.about-panorama img\s*\{[^}]*aspect-ratio:/);
});

test('Production displays one full-width interactive map without a photo or blocked tile requests', () => {
  const production = read('src/components/ProductionInfo.tsx');
  const css = read('src/styles/pages.css');
  assert.doesNotMatch(production, /production-photo|photos\/process-example\.webp|<img\b/);
  assert.match(production, /<iframe/);
  assert.match(production, /openstreetmap\.org\/export\/embed\.html/);
  assert.match(production, /marker=55\.752/);
  assert.match(production, /title="[^"]*Кремл/);
  assert.match(production, /Это не адрес самовывоза/);
  assert.doesNotMatch(production, /sandbox=|referrerPolicy="no-referrer"/);
  assert.match(production, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.doesNotMatch(css, /\.production-visuals|\.production-photo/);
  assert.match(css, /\.production-map\s*\{[^}]*inline-size:\s*100%/);
  assert.match(css, /\.production-map iframe\s*\{[^}]*inline-size:\s*100%/);
});

test('whole catalog cards open detail pages; add action is secondary and no photo lightbox appears', () => {
  const card = read('src/components/ProductCard.tsx');
  const gallery = read('src/components/ProductGallery.tsx');
  const css = read('src/styles/pages.css');
  assert.match(card, /className="product-open"/);
  assert.match(card, /href=\{detailsUrl\}/);
  assert.match(css, /\.product-open\s*\{[^}]*position:\s*absolute/);
  assert.match(css, /\.product-actions\s*\{[^}]*z-index:\s*2/);
  assert.match(card, /Добавить в корзину/);
  assert.match(card, /button-secondary/);
  assert.doesNotMatch(card, /product-zoom|onPreview|product-description|ZoomIn/);
  assert.doesNotMatch(gallery, /<Lightbox|yet-another-react-lightbox|setActive/);
  assert.match(css, /\.product-price\s*\{[^}]*font-size:\s*clamp/);
});

test('product detail photo opens a lightbox while shape, color and font stay visible', () => {
  const detail = read('src/components/ProductDetail.tsx');
  assert.match(detail, /yet-another-react-lightbox/);
  assert.match(detail, /<Lightbox/);
  assert.match(detail, /onClick=\{\(\) => setLightboxOpen\(true\)\}/);
  assert.match(detail, /aria-label=\{.*Увеличить/);
  for (const label of ['Форма', 'Цвет', 'Шрифт']) {
    assert.match(detail, new RegExp('<dt>' + label + '</dt>'));
  }
});
