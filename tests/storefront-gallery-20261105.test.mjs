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
  assert.match(home, /<BentoSection \/>/);
});

test('production remains a map route while stock and custom terms move to shopping pages', () => {
  const production = source('src/components/ProductionInfo.tsx');
  const home = source('src/components/Storefront.tsx');
  const catalog = source('src/app/catalog/page.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  const config = source('src/components/Configurator.tsx');
  assert.match(production, /Как оформить заказ/);
  assert.match(source('src/components/DeliveryInfo.tsx'), /className="production-map"/);
  assert.doesNotMatch(production, /Кубики на заказ|Кубики в наличии|production-options/);
  assert.match(home, /в течение 3 дней/);
  assert.match(catalog, /в течение 3 дней/);
  assert.match(detail, /в течение 3 дней/);
  assert.match(config, /Кубики на заказ/);
  assert.match(config, /Изготовление начинается после согласования/);
  assert.ok(existsSync('src/app/production/page.tsx'));
  assert.ok(!existsSync('src/app/dark/production/page.tsx'));
});

test('product detail owns the photo lightbox; catalog and homepage use clickable cards', () => {
  const gallery = source('src/components/ProductGallery.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  const home = source('src/components/Storefront.tsx');
  const catalog = source('src/app/catalog/page.tsx');
  assert.doesNotMatch(gallery, /yet-another-react-lightbox|<Lightbox/);
  assert.match(detail, /yet-another-react-lightbox/);
  assert.match(detail, /<Lightbox/);
  assert.match(gallery, /<ProductCard/);
  assert.match(home, /<ProductGallery/);
  assert.match(catalog, /<ProductGallery/);
  assert.match(gallery, /mode === 'reel'/);
});

test('cards navigate to product detail and expose a separate secondary add action', () => {
  const card = source('src/components/ProductCard.tsx');
  assert.match(card, /className="product-visual frame"/);
  assert.match(card, /className="product-open"/);
  assert.match(card, /href=\{detailsUrl\}/);
  assert.match(card, /button button-secondary/);
  assert.match(card, /<span>Добавить в корзину<\/span>/);
  assert.doesNotMatch(card, /onPreview|product-zoom/);
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
  assert.match(source('src/components/ProductDetail.tsx'), /photoPath\(index\)/);
  assert.match(source('src/components/ProductCard.tsx'), /photoPath\(index\)/);
  assert.doesNotMatch(source('src/components/SiteShell.tsx'), /photoCredits|Источники фотографий/);
});

test('new photo-first product layout keeps purchase honest and supplies a shared detail route', () => {
  const card = source('src/components/ProductCard.tsx');
  const detail = source('src/components/ProductDetail.tsx');
  const css = source('src/styles/pages.css');
  assert.match(card, /formatPrice\(priceForPreset\(product.id\)\)/);
  assert.match(card, /<h3>\{product\.title\}<\/h3>/);
  assert.match(card, /Добавить в корзину/);
  assert.doesNotMatch(card, /product-badges/);
  assert.match(detail, /3D-вариант/);
  assert.match(detail, /formatPrice\(priceForPreset\(product.id\)\)/);
  assert.match(detail, /add\(product.config/);
  assert.ok(existsSync('src/app/product/page.tsx'));
  assert.ok(!existsSync('src/app/dark/product/page.tsx'));
  assert.match(css, /\.product\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/);
});

test('header appears after scroll and keeps its cart link before and after selection', () => {
  const shell = source('src/components/SiteShell.tsx');
  const css = source('src/styles/pages.css');
  const orders = source('src/lib/orders.ts');
  assert.match(shell, /window\.scrollY > 24/);
  assert.match(shell, /revealed \? "topbar topbar-visible" : "topbar"/);
  assert.ok(shell.includes('<Link href={link("/cart")} className="cart-shortcut"'));
  assert.ok(!shell.includes('{count > 0 && <Link'));
  assert.ok(shell.includes('{count > 0 && <span className="cart-count"'));
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

test('form and temporary legal details are honest without unrelated photo disclaimers', () => {
  const components = ['Storefront', 'ProductCard', 'ProductDetail', 'CartView'];
  for(const component of components) {
    const file = source(`src/components/${component}.tsx`);
    assert.doesNotMatch(file, /демонстрацион|демо[- ]сайт|Фото-пример|референс|Не производство|Источники фотографий/i, component);
  }
  const contacts = source('src/components/ContactContent.tsx');
  assert.match(contacts, /Это демонстрационная форма\. Сообщения не отправляются/);
  assert.ok(!existsSync('src/lib/photoCredits.ts'));
  assert.ok(!existsSync('src/components/LegalDialogs.tsx'));
});

test('homepage has an explicit catalog link and restored logo', () => {
  const home = source('src/components/Storefront.tsx');
  const shell = source('src/components/SiteShell.tsx');
  const css = source('src/styles/pages.css');
  assert.match(home, /className="wrapper catalog-heading prose"/);
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

test('header reveal stops listening after the first downward scroll', () => {
  const shell = source('src/components/SiteShell.tsx');
  assert.match(shell, /if \(window\.scrollY > 24\) \{\s*setRevealed\(true\);\s*window\.removeEventListener\('scroll', reveal\);/);
});

test('home shows manufacturing and collection after stock, separate from About Us', () => {
  const home = source('src/components/Storefront.tsx');
  const production = source('src/components/ProductionInfo.tsx');
  const css = source('src/styles/pages.css');
  assert.match(home, /import ProductionInfo from/);
  assert.match(home, /<ProductGallery mode="reel" \/>[\s\S]*?<\/section>\s*<ProductionInfo onHome \/>\s*<BentoSection \/>\s*<section className="wrapper section about-section"/);
  assert.doesNotMatch(home, /<p className="eyebrow">О проекте<\/p>/);
  assert.doesNotMatch(home, /<Link[^>]+\/production[^>]*>Изготовление и получение<\/Link>/);
  assert.match(production, /<h2 className="section-title">Как оформить заказ<\/h2>/);
  assert.match(production, /<h1 className="page-title">Как оформить заказ<\/h1>/);
  assert.doesNotMatch(css, /\.production-options/);
});
