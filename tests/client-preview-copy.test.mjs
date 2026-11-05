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
  assert.match(s,/<LegalDialogs\s*\/>/);
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
test('stock cards use existing preset data, fact badges and one actual action',()=>{
  const card=read('src/components/ProductCard.tsx');
  const catalog=read('src/app/catalog/page.tsx');
  assert.match(card,/<h3>\{product\.title\}<\/h3>/);
  assert.match(card,/className="product-badges/);
  assert.match(card,/<span>\{product\.config\.shape\.toUpperCase\(\)\}<\/span>/);
  assert.match(card,/<button[^>]*>В корзину<\/button>/);
  assert.doesNotMatch(card,/>Настроить<\/Link>|>Кнопка<\/Link>/);
  assert.match(card,/alt=""/);
  assert.match(catalog,/>Кубики в наличии<\/h1>/);
});
test('builder, cart and production pages honor accepted copy decisions',()=>{
  const builder=read('src/components/Configurator.tsx');
  const cart=read('src/components/CartView.tsx');
  const data=read('src/lib/catalog.ts');
  assert.match(builder,/>Собери сам<\/h1>/);
  assert.match(builder,/<h2>Количество граней<\/h2>/);
  assert.match(builder,/href=\{themeHref\(pathname, '\/production'\)\}/);
  assert.match(cart,/Корзина пока пуста/);
  assert.match(cart,/>В каталог<\/Link>/);
  assert.match(cart,/>Удалить<\/button>/);
  assert.match(data,/name: 'Цвет 1'/);
  assert.match(data,/grotesk: 'Шрифт 1'/);
  assert.ok(existsSync('src/app/production/page.tsx'));
  assert.ok(existsSync('src/app/dark/production/page.tsx'));
  assert.match(read('src/components/ProductionInfo.tsx'),/Сроки изготовления/);
});
test('contact channels and a truthful demo contact form appear on both screens',()=>{
 const ui=read('src/components/ContactContent.tsx');
 const home=read('src/components/Storefront.tsx');
 const page=read('src/app/contacts/page.tsx');
 for(const s of ['Телефон','Telegram','Instagram','Почта','Имя','Контакт для ответа','Сообщение','Отправить'])assert.ok(ui.includes(s),s);
 assert.match(ui,/<form/);assert.match(ui,/onSubmit=\{onSubmit\}/);
 assert.match(ui,/Сообщения не отправляются/);
 assert.match(ui,/role="status"/);
 assert.doesNotMatch(ui, /https:\/\/t\.me\/|mailto:|tel:\+\d/);
 assert.match(home,/<ContactContent\s*\/>/);
 assert.match(page,/<ContactContent\s*\/>/);
});
test('legal prototype text is not represented as accepted terms or real cookies',()=>{
 const legal=read('src/components/LegalDialogs.tsx');
 assert.match(legal,/>Принять все<\/button>/);
 assert.match(legal,/>Файлы cookie<\/h2>/);
 assert.match(legal,/Демонстрационный сайт|демонстрационный сайт/);
 assert.match(legal,/заказ не оформляется|не оформляет заказ|не оформляют заказ/);
 assert.match(legal,/>Закрыть<\/button>/);
 assert.doesNotMatch(legal,/document\.cookie|gtag\(/);
});
