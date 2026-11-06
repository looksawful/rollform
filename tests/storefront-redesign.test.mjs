import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(file, 'utf8');

test('About uses one responsive split photo instead of a collage', () => {
  const home = read('src/components/Storefront.tsx');
  const about = home.split('id="about"')[1].split('id="faq"')[0];
  assert.equal((about.match(/<figure\b/g) || []).length, 1);
  assert.match(about, /className="about-panorama/);
  assert.doesNotMatch(about, /editorial-mini-grid/);
  const css = read('src/styles/pages.css');
  assert.match(css, /\.about-panorama img\s*\{[^}]*aspect-ratio:/);
});

test('Production displays a split interactive map without photo or blocked tile requests', () => {
  const production = read('src/components/ProductionInfo.tsx');
  const css = read('src/styles/pages.css');
  assert.doesNotMatch(production, /production-photo|photos\/process-example\.webp|<img\b/);
  assert.match(production, /<iframe/);
  assert.match(production, /openstreetmap\.org\/export\/embed\.html/);
  assert.match(production, /marker=55\.752/);
  assert.match(production, /title="Интерактивная карта Москвы"/);
  assert.doesNotMatch(production, /Это не адрес самовывоза/);
  assert.doesNotMatch(production, /sandbox=|referrerPolicy="no-referrer"/);
  assert.match(production, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.doesNotMatch(css, /\.production-visuals|\.production-photo/);
  assert.match(css, /\.production-map\s*\{[^}]*inline-size:\s*100%/);
  assert.match(css, /\.production-map-frame iframe\s*\{[^}]*inline-size:\s*100%/);
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

test('stock and custom-production copy lives where customers choose their cube', () => {
  const home = read('src/components/Storefront.tsx');
  const catalog = read('src/app/catalog/page.tsx');
  const detail = read('src/components/ProductDetail.tsx');
  const configurator = read('src/components/Configurator.tsx');
  const production = read('src/components/ProductionInfo.tsx');
  const pages = read('src/styles/pages.css');
  const stock = 'Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.';
  const made = 'Изготовление начинается после согласования формы, цвета и шрифта.';
  const pickup = 'Способ получения и дату согласуют перед оформлением заказа.';

  const homeStock = home.split('className="wrapper catalog-heading"')[1]?.split('<ProductGallery')[0] || '';
  assert.ok(homeStock.includes('В наличии'));
  assert.ok(homeStock.includes(stock), 'stock description beside the homepage stock heading');
  assert.ok(catalog.includes(stock), 'stock description in catalog introduction');
  assert.ok(detail.includes(stock), 'stock description on product detail');
  assert.match(configurator, /<h2>Кубики на заказ<\/h2>/);
  assert.ok(configurator.includes(made) && configurator.includes(pickup), 'production terms beside configurator controls');
  assert.doesNotMatch(production, /Кубики в наличии|Кубики на заказ|production-options|Готовые варианты можно забрать|Изготовление начинается после согласования|Способ получения и дату/);
  assert.doesNotMatch(pages, /\.production-options/);
  assert.match(production, /className="production-map"/);
});
