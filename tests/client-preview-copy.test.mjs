import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
const read = f => readFileSync(path.resolve(process.cwd(),f),'utf8');

test('approved Russian header labels and icon-only cart',()=>{
  const s=read('src/components/SiteShell.tsx');
  for(const label of ['Кубики','Собери сам','О нас','Контакты'])assert.ok(s.includes("label: '"+label+"'"));
  assert.match(s,/>Лого<\/Link>/);
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
test('stock cards show photographic references, readable metadata, price placeholder and buy action',()=>{
  const card=read('src/components/ProductCard.tsx');
  const catalog=read('src/app/catalog/page.tsx');
  assert.match(card,/<h3><Link href=\{detailsUrl\}>\{product\.title\}<\/Link><\/h3>/);
  assert.match(card,/className="product-description"/);
  assert.match(card,/className="product-price"/);
  assert.match(card,/product\.config\.shape\.toUpperCase\(\)/);
  assert.match(card,/>Купить<\/button>/);
  assert.doesNotMatch(card,/>Настроить<\/Link>|>Кнопка<\/Link>/);
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
test('contacts expose working email and Telegram links and a mail composer', () => {
  const ui = read('src/components/ContactContent.tsx');
  const home = read('src/components/Storefront.tsx');
  const page = read('src/app/contacts/page.tsx');
  for(const s of ['Telegram', 'Электронная почта', 'Имя', 'Сообщение', 'Написать']) {
    assert.ok(ui.includes(s), s);
  }
  assert.match(ui, /mailto:i@lookawful\.ru/);
  assert.match(ui, /https:\/\/t\.me\/looksawful/);
  assert.match(ui, /window\.location\.href/);
  assert.match(ui, /onSubmit=\{onSubmit\}/);
  assert.doesNotMatch(ui, /Демонстрационная|не отправляются|уточняются/);
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

test('contact icons are paired with actual reachable destinations', () => {
  const contacts = read('src/components/ContactContent.tsx');
  assert.match(contacts, /Mail, Send/);
  assert.match(contacts, /href: 'mailto:i@lookawful\.ru'/);
  assert.match(contacts, /href: 'https:\/\/t\.me\/looksawful'/);
  assert.doesNotMatch(contacts, /Instagram|Телефон|данные для связи уточняются/i);
});
