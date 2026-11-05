import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = file => readFileSync(file, 'utf8');

test('one FAQ on the existing homepage, with accessible native disclosures', () => {
  const home = source('src/components/Storefront.tsx');
  assert.match(home, /id="faq"/);
  assert.match(home, /<h2[^>]*>Частые вопросы<\/h2>/);
  assert.match(home, /\[\s*'Как выбрать кубик\?'/);
  assert.match(home, /'Как связаться с вами\?'/);
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
  assert.match(card, /href=\{detailsUrl\}/);
  assert.match(card, /onPreview/);
  assert.match(card, /aria-label=\{['"]Увеличить изображение/);
  assert.match(card, />Купить<\/button>/);
});

test('cart links to the shared preparation and delivery information without checkout promises', () => {
  const cart = source('src/components/CartView.tsx');
  assert.match(cart, /items.length === 0/);
  assert.match(cart, /className="cart-summary stack"/);
  assert.match(cart, /href=\{themeHref\(pathname, '\/production'\)\}/);
  assert.doesNotMatch(cart, /<button[^>]*>Оплатить/);
});


test('nine licensed photographic examples are available without losing accurate 3D variants', () => {
  for (let index = 1; index <= 9; index++) {
    const photo = readFileSync(`public/photos/dice-${String(index).padStart(2, '0')}.webp`);
    assert.equal(photo.toString('ascii', 0, 4), 'RIFF');
    assert.equal(photo.toString('ascii', 8, 12), 'WEBP');
    assert.ok(photo.length > 9000);
    assert.ok(existsSync(`public/products/demo-${index}.webp`));
  }
  assert.match(source('src/components/ProductGallery.tsx'), /photoPath\(index\)/);
  assert.match(source('src/components/ProductCard.tsx'), /photoPath\(index\)/);
  assert.match(source('src/components/SiteShell.tsx'), /photoCredits\.map/);
});

test('homepage reel pins at card center while vertical scroll scrubs horizontal position', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const css = source('src/styles/pages.css');
  assert.match(gallery, /import\('gsap\/ScrollTrigger'\)/);
  assert.match(gallery, /gsap\.registerPlugin\(ScrollTrigger\)/);
  assert.match(gallery, /mode !== 'reel'/);
  assert.match(gallery, /scroller\?\.closest\('#catalog'\)/);
  assert.match(gallery, /scrollLeft:\s*\(\) => distance\(\)/);
  assert.match(gallery, /start:\s*'center center'/);
  assert.match(gallery, /pin:\s*section/);
  assert.match(gallery, /end:\s*\(\) => ['"]\+=['"] \+ distance\(\)/);
  assert.match(gallery, /scrub:\s*true/);
  assert.match(gallery, /prefers-reduced-motion: reduce/);
  assert.match(gallery, /animation\?\.scrollTrigger\?\.kill\(\)/);
  assert.match(css, /\.catalog-pinned \.product-scroller\s*\{\s*scroll-snap-type:\s*none/);
  assert.match(gallery, /<Lightbox/);
});

test('new photo-first product layout keeps purchase honest and supplies a shared detail route', () => {
  const card = source('src/components/ProductCard.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  const css = source('src/styles/pages.css');
  assert.match(card, /Цена уточняется/);
  assert.match(card, /<h3><Link/);
  assert.match(card, /Купить/);
  assert.doesNotMatch(card, /product-badges/);
  assert.match(detail, /3D-вариант/);
  assert.match(detail, /Цена уточняется/);
  assert.match(detail, /add\(product.config/);
  assert.ok(existsSync('src/app/product/page.tsx'));
  assert.ok(existsSync('src/app/dark/product/page.tsx'));
  assert.match(css, /\.product\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
});

test('header is hidden until scroll, logo is invisible, cart only exists after selection', () => {
  const shell = source('src/components/SiteShell.tsx');
  const css = source('src/styles/pages.css');
  const orders = source('src/lib/orders.ts');
  assert.match(shell, /window\.scrollY > 24/);
  assert.match(shell, /revealed \? "topbar topbar-visible" : "topbar"/);
  assert.match(shell, /count > 0 && <Link/);
  assert.match(css, /\.logo-hidden\s*\{\s*display:\s*none/);
  assert.match(css, /transform:\s*translateY\(-110%\)/);
  assert.match(css, /\.topbar:focus-within/);
  assert.match(orders, /rollform:demo-cart:v3/);
});

test('licensed photographic sources are available and no fake prices or claims appear', () => {
  const credits = source('src/lib/photoCredits.ts');
  const about = source('src/components/Storefront.tsx');
  const production = source('src/components/ProductionInfo.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  assert.ok(existsSync('public/photos/process-example.webp'));
  assert.match(credits, /CC BY-SA/);
  assert.match(credits, /Stephan Sprinz/);
  assert.match(about, /Не производство ROLLFORM/);
  assert.match(production, /Не производство ROLLFORM/);
  assert.doesNotMatch(detail, /\d+\s?₽/);
});
