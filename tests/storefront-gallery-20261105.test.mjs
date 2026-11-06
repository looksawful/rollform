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
  assert.doesNotMatch(production, /срок.*уточняется/i);
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
  assert.doesNotMatch(source('src/components/SiteShell.tsx'), /photoCredits|Источники фотографий/);
});

test('homepage reel briefly previews cards then releases to native horizontal scrolling', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const css = source('src/styles/pages.css');
  assert.match(gallery, /import\('gsap\/ScrollTrigger'\)/);
  assert.match(gallery, /gsap\.registerPlugin\(ScrollTrigger\)/);
  assert.match(gallery, /mode !== 'reel'/);
  assert.match(gallery, /scroller\?\.closest\('#catalog'\)/);
  assert.match(gallery, /scrollLeft:\s*\(\) => previewDistance\(\)/);
  assert.match(gallery, /start:\s*'center center'/);
  assert.match(gallery, /pin:\s*section/);
  assert.match(gallery, /end:\s*\(\) => ['"]\+=['"] \+ Math\.max/);
  assert.match(gallery, /scrub:\s*true/);
  assert.match(gallery, /prefers-reduced-motion: no-preference/);
  assert.match(gallery, /media\?\.revert\(\)/);
  assert.match(css, /\.catalog-scrubbing \.product-scroller\s*\{\s*scroll-snap-type:\s*none/);
  assert.match(gallery, /<Lightbox/);
});

test('new photo-first product layout keeps purchase honest and supplies a shared detail route', () => {
  const card = source('src/components/ProductCard.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  const css = source('src/styles/pages.css');
  assert.match(card, /formatPrice\(priceForPreset\(product.id\)\)/);
  assert.match(card, /<h3><Link/);
  assert.match(card, /Купить/);
  assert.doesNotMatch(card, /product-badges/);
  assert.match(detail, /3D-вариант/);
  assert.match(detail, /formatPrice\(priceForPreset\(product.id\)\)/);
  assert.match(detail, /add\(product.config/);
  assert.ok(existsSync('src/app/product/page.tsx'));
  assert.ok(existsSync('src/app/dark/product/page.tsx'));
  assert.match(css, /\.product\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
});

test('header is hidden until scroll but contains a visible logo when revealed, cart only after selection', () => {
  const shell = source('src/components/SiteShell.tsx');
  const css = source('src/styles/pages.css');
  const orders = source('src/lib/orders.ts');
  assert.match(shell, /window\.scrollY > 24/);
  assert.match(shell, /revealed \? "topbar topbar-visible" : "topbar"/);
  assert.match(shell, /count > 0 && <Link/);
  assert.match(source('src/styles/components.css'), /\.logo\s*\{[^}]*font-weight:\s*800/);
  assert.match(css, /transform:\s*translateY\(-110%\)/);
  assert.match(css, /\.topbar:focus-within/);
  assert.match(orders, /rollform:demo-cart:v3/);
});

test('no-credit-needed photos and prices are consistent across all screens', () => {
  const assets = source('src/lib/photoAssets.ts');
  const pricing = source('src/lib/pricing.ts');
  const home = source('src/components/Storefront.tsx');
  const production = source('src/components/ProductionInfo.tsx');
  const cart = source('src/components/CartView.tsx');
  assert.ok(existsSync('public/photos/process-example.webp'));
  assert.ok(existsSync('public/photos/process-workshop.webp'));
  assert.match(assets, /Pexels/);
  assert.match(assets, /attribution not required/);
  assert.match(pricing, /const presetPrices = \[/);
  assert.match(pricing, /Intl\.NumberFormat\('ru-RU'/);
  assert.match(cart, /priceForCartItem\(item\) \* item\.quantity/);
  assert.match(cart, /formatPrice\(total\)/);
  assert.match(source('src/components/Configurator.tsx'), /formatPrice\(priceForConfig\(config\)\)/);
  assert.doesNotMatch(home + production, /Фото-пример|Референс|Не производство|иллюстративные/);
  assert.doesNotMatch(source('src/components/ProductDetail.tsx'), /Цена уточняется|фотография приведена/i);
});

test('homepage and cart are free from prototype disclaimers', () => {
  const components = ['SiteShell', 'Storefront', 'ProductCard', 'ProductDetail', 'CartView', 'ContactContent', 'ProductionInfo'];
  for(const component of components) {
    const file = source(`src/components/${component}.tsx`);
    assert.doesNotMatch(file, /демонстрацион|демо[- ]сайт|Фото-пример|референс|Не производство|Источники фотографий/i, component);
  }
  assert.ok(!existsSync('src/lib/photoCredits.ts'));
  assert.ok(!existsSync('src/components/LegalDialogs.tsx'));
});

test('vertical scrolling only previews the first three cards; the rest remain natively scrollable', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const css = source('src/styles/pages.css');
  assert.match(gallery, /const previewDistance = \(\) =>/);
  assert.match(gallery, /cards\[2\]\.offsetLeft - cards\[0\]\.offsetLeft/);
  assert.match(gallery, /scrollLeft: \(\) => previewDistance\(\)/);
  assert.match(gallery, /Math\.min\(previewDistance\(\), window\.innerHeight \* 0\.7\)/);
  assert.match(gallery, /onEnter: markScrubbing/);
  assert.match(gallery, /onLeave: unmarkScrubbing/);
  assert.match(gallery, /section\.classList\.remove\('catalog-scrubbing'\)/);
  assert.doesNotMatch(gallery, /scrollLeft: \(\) => distance\(\)/);
  assert.match(css, /\.catalog-scrubbing \.product-scroller\s*\{\s*scroll-snap-type: none/);
  assert.match(css, /\.product-scroller\s*\{[^}]*scroll-snap-type: x mandatory/);
});

test('homepage has an explicit catalog link and restored logo', () => {
  const home = source('src/components/Storefront.tsx');
  const shell = source('src/components/SiteShell.tsx');
  const css = source('src/styles/pages.css');
  assert.match(home, /className="catalog-heading"/);
  assert.match(home, />Весь каталог/);
  assert.match(home, /themeHref\(pathname, '\/catalog'\)/);
  assert.match(shell, /className="logo"/);
  assert.doesNotMatch(shell, /logo-hidden/);
  assert.doesNotMatch(css, /\.logo-hidden/);
});

test('neutral surface palette and translucent dividers are central CSS tokens', () => {
  const tokens = source('src/styles/tokens.css');
  const pages = source('src/styles/pages.css');
  assert.match(tokens, /--color-background: #fafafa/);
  assert.match(tokens, /--color-surface: #ffffff/);
  assert.match(tokens, /--color-border: rgb\(0 0 0 \/ 0\.1[24]\)/);
  assert.match(tokens, /--shadow-card:/);
  assert.match(tokens, /\.site\[data-theme="dark"\][^}]*--color-border: rgb\(255 255 255 \/ 0\.1[46]\)/);
  assert.match(pages, /\.product\s*\{[^}]*box-shadow: var\(--shadow-card\)/);
});

test('manual carousel buttons scroll horizontally without capturing the page', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  assert.match(gallery, /scroller\.scrollBy\(\{ left: direction/);
  assert.match(gallery, /aria-label="Предыдущие карточки"/);
  assert.match(gallery, /aria-label="Следующие карточки"/);
  assert.match(gallery, /mode === 'reel' && <div className="reel-controls"/);
});

test('short pin respects pointer type and live reduced-motion preference without a stale trigger', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const pages = source('src/styles/pages.css');
  assert.match(gallery, /gsap\.matchMedia\(\)/);
  assert.match(gallery, /not \(pointer: coarse\)/);
  assert.match(gallery, /prefers-reduced-motion: no-preference/);
  assert.match(gallery, /min-width: 768px/);
  assert.match(gallery, /media\?\.revert\(\)/);
  assert.doesNotMatch(pages, /@keyframes reel-center-focus|animation-timeline: view\(inline\)/);
});

test('header reveal stops listening after the first downward scroll', () => {
  const shell = source('src/components/SiteShell.tsx');
  assert.match(shell, /if \(window\.scrollY > 24\) \{\s*setRevealed\(true\);\s*window\.removeEventListener\('scroll', reveal\);/);
});
