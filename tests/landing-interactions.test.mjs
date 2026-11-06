import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = f => readFileSync(f,'utf8');
test('responsive split production, map activation and no placeholder',()=>{
 const p=read('src/components/DeliveryInfo.tsx'),c=read('src/styles/pages.css');
 assert.match(p,/production-copy stack/);
 assert.match(p,/production-map-frame/);
 assert.doesNotMatch(p,/На карте временно указан Кремль\. Это не адрес самовывоза/);
 assert.match(c,/\.production-info\s*\{[^}]*grid-template-columns:\s*minmax/);
 assert.match(c,/@media \(width <= 56rem\)[\s\S]*\.production-info\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
 assert.match(p,/useState\(false\)/);
 assert.match(p,/onPointerLeave=\{\(\) => setMapActive\(false\)\}/);
 assert.match(p,/setMapActive\(true\)/);
 assert.match(p,/aria-label="Включить управление картой"/);
 assert.match(c,/\.production-map-frame iframe\s*\{[^}]*pointer-events:\s*none/);
 assert.match(c,/\.production-map-frame\[data-active="true"\] iframe\s*\{[^}]*pointer-events:\s*auto/);
});
test('about photo before text, split desktop and mobile stacked',()=>{
 const home=read('src/components/Storefront.tsx'),c=read('src/styles/pages.css'),a=home.split('id="about"')[1]?.split('id="faq"')[0]||'';
 assert.ok(a.indexOf('about-panorama')>=0&&a.indexOf('about-panorama')<a.indexOf('editorial-copy'));
 assert.match(c,/\.about-section\s*\{[^}]*grid-template-columns:\s*minmax/);
 assert.match(c,/@media \(width <= 56rem\)[\s\S]*\.about-section\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
test('FAQ uses all available width',()=>{
 const c=read('src/styles/pages.css');
 assert.match(c,/\.faq-list\s*\{[^}]*inline-size:\s*100%/);
 assert.doesNotMatch(c,/\.faq-list\s*\{[^}]*max-inline-size:\s*var\(--measure\)/);
});
test('Telegram and Instagram replace site and submit label changes',()=>{
 const s=read('src/components/ContactContent.tsx');
 assert.doesNotMatch(s,/title:\s*'Сайт'/);
 assert.match(s,/title:\s*'Telegram'/);
 assert.match(s,/title:\s*'Instagram'/);
 assert.match(s,/detail:\s*'@kubiki'/);
 assert.match(s,/type="submit">Отправить сообщение<\/button>/);
 assert.match(s,/Сообщения не отправляются и не сохраняются/);
});
test('automatic seamless reel with accessible reduced motion fallback and hover stop',()=>{
 const s=read('src/components/ProductGallery.tsx'),c=read('src/styles/pages.css');
 assert.match(s,/prefers-reduced-motion: reduce/);
 assert.match(s,/requestAnimationFrame/);
 assert.match(s,/cycleWidth/);
 assert.match(s,/looping \? \[0, 1, 2\]/);
 assert.match(s,/aria-hidden=\{copy !== 1/);
 assert.match(s,/!hoverPaused/);
 assert.match(s,/autoPosition \+= delta \* 0\.03/);
 assert.match(c,/\.product-scroller\[data-looping="true"\]/);
 assert.match(c,/\.product\s*\{[^}]*transition:/);
 assert.match(c,/prefers-reduced-motion:\s*reduce/);
});
