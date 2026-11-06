import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
const read = f => readFileSync(path.resolve(process.cwd(),f),'utf8');

test('approved Russian header labels and icon-only cart',()=>{
  const s=read('src/components/SiteShell.tsx');
  for(const label of ['Кубики','Собери сам','О нас','Контакты'])assert.ok(s.includes("label: '"+label+"'"));
  assert.match(s,/className="logo-mark"/);
  assert.match(s,/<ShoppingBag className="icon" aria-hidden="true"\s*\/>/);
  assert.doesNotMatch(s,/cart-shortcut-label/);
  assert.doesNotMatch(s, /LegalDialogs|photoCredits|photo-credits/);
  assert.doesNotMatch(s,/<p>Текст<\/p>/);
});
test('Bento retained as a disconnected draft component',()=>{
  const s=read('src/components/Storefront.tsx');
  const b=read('src/components/BentoSection.tsx');
  assert.doesNotMatch(s,/BentoSection|bento-section|bento-grid/);
  for(const t of ['Любая форма','Семь вариантов кубика','Любой цвет','Три варианта цвета','Разные шрифты','Шесть вариантов на выбор','Качественные материалы','Приятные на ощупь'])assert.ok(b.includes(t),t);
  assert.match(b,/className="bento-grid"/);
  assert.match(s,/>В наличии<\/h2>/);
  assert.doesNotMatch(s,/>Весь каталог<\/Link>/);
  assert.match(s,/<ContactContent\s*\/>/);
});
test('stock cards show a photo, a prominent price and a secondary add-to-cart action',()=>{
  const card=read('src/components/ProductCard.tsx');
  const catalog=read('src/app/catalog/page.tsx');
  assert.match(card,/<h3>\{product\.title\}<\/h3>/);
  assert.match(card,/className="product-price"/);
  assert.match(card,/className="product-open"/);
  assert.match(card,/href=\{detailsUrl\}/);
  assert.doesNotMatch(card,/className="product-description"|onPreview|product-zoom/);
  assert.match(card,/className="button button-secondary"/);
  assert.match(card,/>Добавить в корзину<\/button>/);
  assert.match(card,/photoPath\(index\)/);
  assert.match(catalog,/>Кубики в наличии<\/h1>/);
});
test('builder, cart and production pages honor accepted copy decisions',()=>{
  const builder=read('src/components/Configurator.tsx');
  const cart=read('src/components/CartView.tsx');
  const data=read('src/lib/catalog.ts');
  assert.match(builder,/>Собери сам<\/h1>/);
  assert.match(builder,/<h2>Количество граней<\/h2>/);
  assert.match(builder,/href=\{themeHref\(pathname, '\/production'\)\}/);
  assert.match(cart,/Пока ничего нет/);
  assert.match(cart,/>Смотреть кубики<\/Link>/);
  assert.match(cart,/>Удалить<\/button>/);
  assert.match(data,/name: 'Цвет 1'/);
  assert.match(data,/grotesk: 'Шрифт 1'/);
  assert.ok(existsSync('src/app/production/page.tsx'));
  assert.ok(existsSync('src/app/dark/production/page.tsx'));
  assert.match(read('src/components/ProductionInfo.tsx'),/Изготовление и доставка/);
});
test('prototype contact details are fictitious, without mail, phone or Telegram destinations', () => {
  const ui = read('src/components/ContactContent.tsx');
  const shell = read('src/components/SiteShell.tsx');
  const home = read('src/components/Storefront.tsx');
  const page = read('src/app/contacts/page.tsx');
  for (const value of ['kubiki.example', 'hello@kubiki.example', '+7 (000) 000-00-00']) {
    assert.ok(ui.includes(value), value);
  }
  assert.match(shell, /hello@kubiki\.example/);
  assert.match(shell, /\+7 \(000\) 000-00-00/);
  assert.doesNotMatch(ui + shell, /lookawful\.ru|@looksawful|t\.me\/looksawful/i);
  assert.doesNotMatch(ui + shell, /mailto:|tel:|window\.location\.href/i);
  assert.match(ui, /event\.preventDefault\(\)/);
  assert.match(ui, /setSubmitted\(true\)/);
  assert.match(ui, /Сообщения не отправляются и не сохраняются/);
  assert.match(ui, /role="status"/);
  assert.match(home, /<ContactContent\s*\/>/);
  assert.match(page, /<ContactContent\s*\/>/);
});

test('there is no bogus cookie consent or draft legal agreement', () => {
  const shell = read('src/components/SiteShell.tsx');
  assert.doesNotMatch(shell, /LegalDialogs|cookie-choice|photo-credits/);
  assert.ok(!existsSync('src/components/LegalDialogs.tsx'));
});

test('in-stock delivery copy matches the agreed week timeframe, not an unspecified period', () => {
  const catalog = read('src/app/catalog/page.tsx');
  const production = read('src/components/ProductionInfo.tsx');
  assert.match(catalog, /в течение недели/);
  assert.match(production, /в течение недели/);
});

test('contact icons remain semantic but demo details are not links', () => {
  const contacts = read('src/components/ContactContent.tsx');
  const css = read('src/styles/pages.css');
  assert.match(contacts, /import \{ Globe, Mail, Phone \} from 'lucide-react'/);
  assert.match(contacts, /className="contact-method"/);
  assert.match(css, /\.contact-method > \.cluster/);
  assert.doesNotMatch(contacts, /href:|<a |mailto:|tel:/);
});

test('Hero, About and FAQ placeholders use full paragraphs', () => {
  const home = read('src/components/Storefront.tsx');
  assert.doesNotMatch(home, /Внимание! Этот текст является рыбой!/);
  assert.match(home, /<h1 id="hero-title">[^<]+<\/h1>\s*<p>[^<]+\.[^<]+\.[^<]+\.<\/p>/);
  assert.match(home, /<h2 className="section-title">О нас<\/h2>\s*<p>[^<]+\.[^<]+\.[^<]+\.<\/p>/);
  assert.match(home, /<summary>\{question\}<\/summary>\s*<p>[^<]+\.[^<]+\.[^<]+\.<\/p>/);
});
