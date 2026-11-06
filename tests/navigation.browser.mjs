import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

// Run against a running dev server, static preview, or deployed project site.
// ROLLFORM_TEST_URL=http://localhost:3000/ npm run test:navigation
const base = process.env.ROLLFORM_TEST_URL;
assert.ok(base, 'Set ROLLFORM_TEST_URL to the site being tested');
const executable = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert.ok(executable, 'Set CHROME_PATH to an installed Chrome/Chromium executable');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('page motion and navigation', { timeout: 180000 }, async t => {
  const profile = mkdtempSync(join(tmpdir(), 'rollform-navigation-'));
  const browser = spawn(executable, [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  let socket, send;
  try {
    const activePort = join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !existsSync(activePort); i++) await delay(100);
    const port = Number(readFileSync(activePort, 'utf8').split('\n')[0]);
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let sequence = 0;
    const pending = new Map(), exceptions = [];
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const call = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) call.reject(new Error(JSON.stringify(message.error)));
        else call.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        const error = message.params.exceptionDetails;
        exceptions.push(error.exception?.description || error.text);
      }
    };
    send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => (await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    })).result?.value;
    const until = async expression => {
      for (let i = 0; i < 150; i++) {
        const value = await evaluate(expression);
        if (value) return value;
        if (exceptions.length) assert.fail(exceptions.join('\n'));
        await delay(100);
      }
      assert.fail('Timed out: ' + expression);
    };
    const sampleEntry = selector => evaluate(`new Promise(resolve => {
      const element = document.querySelector(${JSON.stringify(selector)});
      const samples = [], started = performance.now();
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      const sample = () => {
        samples.push(Number(getComputedStyle(element).opacity));
        if (performance.now() - started < 1000) requestAnimationFrame(sample);
        else resolve(samples);
      };
      requestAnimationFrame(sample);
    })`);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    // Protect the responsive Hero and real, directly loadable links.
    for (const [width, mobile] of [[320, true], [390, true], [430, true], [768, true], [900, false], [1024, false], [1440, false]]) {
      await t.test(`Hero at ${width}px`, async () => {
        await send('Emulation.setDeviceMetricsOverride', {
          width, height: 900, deviceScaleFactor: 1, mobile,
        });
        for (const theme of ['']) {
          await send('Page.navigate', { url: new URL(theme, base).href });
          await until(`document.readyState === 'complete' && !!document.querySelector('.hero-copy .button')`);
          const layout = await evaluate(`(() => {
            const rect = selector => {
              const r = document.querySelector(selector).getBoundingClientRect();
              return { left: r.left, right: r.right, width: r.width };
            };
            return {
              object: rect('.hero-object'), copy: rect('.hero-copy'),
              button: rect('.hero-copy .button'),
              viewport: document.documentElement.clientWidth,
              contentWidth: document.documentElement.scrollWidth,
              label: document.querySelector('.hero-copy .button').textContent.trim(),
              tag: document.querySelector('.hero-copy .button').tagName,
              icon: !!document.querySelector('.hero-copy .button svg'),
            };
          })()`);
          assert.ok(layout.contentWidth <= layout.viewport + 1, 'Hero never causes page overflow');
          assert.equal(layout.label, 'Создать случайный кубик');
          assert.equal(layout.tag, 'BUTTON');
          assert.equal(layout.icon, true);
          if (mobile) {
            assert.ok(Math.abs(layout.button.width - layout.copy.width) < 2,
              'Mobile primary CTA fills the content width');
          } else {
            assert.ok(layout.object.right < layout.copy.left,
              'Desktop 3D dice stays to the left of the copy');
            assert.ok(layout.button.width < layout.copy.width - 20,
              'Desktop CTA keeps its compact width');
          }
          if (width === 390 || width === 1440) {
            const target = await evaluate(`(() => {
              const r = document.querySelector('.hero-copy .button').getBoundingClientRect();
              return {x:r.left+r.width/2, y:r.top+r.height/2};
            })()`);
            await send('Input.dispatchMouseEvent', {type:'mousePressed', ...target,
              button:'left', buttons:1, clickCount:1});
            await send('Input.dispatchMouseEvent', {type:'mouseReleased', ...target,
              button:'left', buttons:0, clickCount:1});
            await until(`location.pathname.endsWith('/configure/') &&
              document.querySelector('h1')?.textContent === 'Собери сам' &&
              ['shape','shell','font'].every(key => new URLSearchParams(location.search).has(key))`);
          }
        }
      });
    }
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
    });
    for (const theme of ['']) {
      await t.test(`${theme || 'light/'} Hero random + menu restores last dice`, async () => {
        const home = new URL(theme, base).href;
        await send('Page.navigate', { url: home });
        await until(`document.readyState === 'complete' && !!document.querySelector('.hero-copy .button')`);
        await evaluate(`localStorage.removeItem('rollform:last-config:v1')`);
        await evaluate(`document.querySelector('.hero-copy .button').click()`);
        await until(`location.pathname.endsWith('/configure/') &&
          ['shape', 'shell', 'font'].every(k => new URLSearchParams(location.search).has(k))`);
        const created = await evaluate('location.search');
        await until(`document.querySelectorAll('.pill-list [aria-pressed="true"]').length === 3`);
        await send('Page.navigate', { url: home });
        await until(`document.readyState === 'complete' && !!document.querySelector('.desktop-nav a[href$="/configure/"]')`);
        await evaluate(`document.querySelector('.desktop-nav a[href$="/configure/"]').click()`);
        await until(`location.pathname.endsWith('/configure/') && location.search === ${JSON.stringify(created)}`);
        assert.equal(await evaluate('location.search'), created, 'Menu restores, never rerolls');
        await send('Page.reload');
        await until(`document.readyState === 'complete' && location.search === ${JSON.stringify(created)}`);
      });
    }
    await t.test('all published navigation URLs respond without errors', async () => {
      for (const theme of ['']) {
        await send('Page.navigate', { url: new URL(theme, base).href });
        await until(`document.readyState === 'complete' && !!document.querySelector('.hero-copy .button')`);
        const links = await evaluate(`Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href).filter(href => href.startsWith(location.origin) && !href.includes('#'))`);
        for (const href of new Set([...links, ...[
          'catalog/', 'configure/', 'contacts/', 'production/', 'product/', 'cart/'
        ].map(path => new URL(path, new URL(theme, base)).href)])) {
          const result = await evaluate(`fetch(${JSON.stringify(href)}, {cache: 'no-store'})
            .then(response => ({status: response.status, ok: response.ok, url: response.url}))
            .catch(error => ({error: String(error)}))`);
          assert.equal(result?.status, 200, `Broken route: ${href}: ${JSON.stringify(result)}`);
        }
      }
    });
    for (const theme of ['']) {
      await t.test('theme, catalog count, random color and 3D interaction', async () => {
        await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1100,deviceScaleFactor:1,mobile:false});
        await send('Page.navigate', {url:new URL('catalog/',base).href});
        await until(`document.readyState === 'complete' && !!document.querySelector('.theme-toggle')`);
        await delay(150);
        await evaluate(`scrollTo(0,100)`);
        await evaluate(`document.querySelector('.theme-toggle').click()`);
        const selectedTheme = await evaluate(`document.querySelector('.site').dataset.theme`);
        await send('Page.reload');
        await until(`document.readyState === 'complete' && document.querySelector('.site').dataset.theme === ${JSON.stringify(selectedTheme)}`);
        assert.equal(await evaluate(`location.pathname.includes('/dark')`),false);
        for (const width of [320,390,768,1024,1440]) {
          await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
          const columns=await evaluate(`getComputedStyle(document.querySelector('.product-grid')).gridTemplateColumns.split(' ').length`);
          assert.equal(columns,width<=960?2:3,`Catalog columns at ${width}`);
          assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
        }
        await evaluate(`document.querySelector('.product-grid button').click()`);
        await until(`Number(document.querySelector('.product-add-count')?.textContent)>0`);
        const firstCount=await evaluate(`Number(document.querySelector('.product-add-count').textContent)`);
        await evaluate(`document.querySelector('.product-grid button').click()`);
        await until(`Number(document.querySelector('.product-add-count').textContent) === ${firstCount+1}`);
        await send('Page.navigate',{url:new URL('configure/',base).href});
        await until(`document.readyState === 'complete' && !!document.querySelector('.random-dice-button')`);
        await delay(100);
        for(let n=0;n<4;n++) {
          const color=await evaluate(`document.querySelectorAll('.field')[1].querySelector('[aria-pressed="true"]').textContent`);
          await evaluate(`document.querySelector('.random-dice-button').click()`);
          await until(`document.querySelectorAll('.field')[1].querySelector('[aria-pressed="true"]').textContent !== ${JSON.stringify(color)}`);
        }
        for (const path of ['configure/','product/?item=demo-1']) {
          await send('Page.navigate',{url:new URL(path,base).href});
          if (path.startsWith('product')) {
            await until(`!!document.querySelector('.product-detail-thumbs button:last-child')`);
            await delay(150);
            await evaluate(`document.querySelector('.product-detail-thumbs button:last-child').click()`);
          }
          await until(`document.readyState === 'complete' && !!document.querySelector('.dice-canvas canvas') && !document.querySelector('.canvas-fallback')`);
          await delay(300);
          const point=await evaluate(`(() => {const r=document.querySelector('.dice-canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
          await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});
          await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
          await until(`document.querySelector('.dice-canvas').dataset.motion === 'manual'`);
          await delay(200);
          const before=(await send('Page.captureScreenshot',{format:'png'})).data;
          await delay(400);
          assert.equal((await send('Page.captureScreenshot',{format:'png'})).data,before,`${path} stops auto motion`);
          await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x+85,y:point.y+35,buttons:1,button:'left'});
          await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x+85,y:point.y+35,button:'left',buttons:0,clickCount:1});
          assert.notEqual((await send('Page.captureScreenshot',{format:'png'})).data,before,`${path} drag rotates`);
          const rotated=(await send('Page.captureScreenshot',{format:'png'})).data;
          await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:-180});
          await delay(100);
          assert.notEqual((await send('Page.captureScreenshot',{format:'png'})).data,rotated,`${path} wheel zooms`);
          assert.equal(await evaluate(`!!document.querySelector('.dice-preview-badge')`),!!path);
        }
        await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
        await send('Emulation.setTouchEmulationEnabled',{enabled:true});
        await send('Page.navigate',{url:new URL('',base).href});
        await until(`document.readyState === 'complete' && !!document.querySelector('.dice-canvas canvas')`);
        await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:25,y:650}]});
        for(let y=620;y>250;y-=40) { await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:25,y}]}); await delay(20); }
        await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await delay(200);
        assert.ok(await evaluate('scrollY>100'),'Mobile Hero allows initial page swipe');
        await send('Emulation.setTouchEmulationEnabled',{enabled:false});
        await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
        assert.deepEqual(exceptions,[]);
      });
      await t.test('passive Hero, desktop snap and scroll cube adapt to content and viewport', async () => {
        await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
        await send('Page.navigate',{url:new URL('',base).href});
        await until(`document.querySelector('.dice-canvas')?.dataset.motion === 'rolling' && !!document.querySelector('.scroll-progress svg')?.style.transform`);
        await evaluate(`scrollTo(0,0)`);
        await delay(400);
        const hero = await evaluate(`(() => { const h=document.querySelector('.hero-object'); const r=h.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,clip:{x:r.left,y:r.top,width:r.width,height:r.height,scale:1}}; })()`);
        await send('Input.dispatchMouseEvent',{type:'mousePressed',x:hero.x,y:hero.y,button:'left',buttons:1,clickCount:1});
        await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:hero.x,y:hero.y,button:'left',buttons:0,clickCount:1});
        assert.equal(await evaluate(`document.querySelector('.dice-canvas').dataset.motion`),'rolling','Hero click never takes over the animation');
        assert.equal(await evaluate(`document.querySelector('.dice-canvas').tabIndex`),-1,'Passive model is not keyboard focusable');
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('.hero-object')).pointerEvents`),'none');
        const frame=(await send('Page.captureScreenshot',{format:'png',clip:hero.clip})).data;
        await delay(450);
        assert.notEqual((await send('Page.captureScreenshot',{format:'png',clip:hero.clip})).data,frame,'Hero keeps rotating after a click');
        assert.match(await evaluate(`getComputedStyle(document.documentElement).scrollSnapType`),/^y(?: proximity)?$/);
        const cube = () => evaluate(`(() => {const s=document.querySelector('.scroll-progress svg');const m=new DOMMatrix(getComputedStyle(s).transform);return {x:m.e,a:m.a,b:m.b,travel:s.parentElement.clientWidth-s.clientWidth};})()`);
        const start=await cube();
        assert.ok(start.x < 2,'Cube starts at the left edge');
        await evaluate(`scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*0.2)`);
        await delay(650);
        const middle=await cube();
        assert.ok(middle.x>start.x+20 && middle.x<middle.travel-20,'Cube advances with page progress');
        assert.ok(Math.abs(middle.a-1)>0.05 || Math.abs(middle.b)>0.05,'SVG cube rotates with progress');
        const height=await evaluate('document.documentElement.scrollHeight');
        await evaluate(`document.querySelectorAll('#faq details').forEach(d=>d.open=true)`);
        await delay(250);
        assert.ok(await evaluate(`document.documentElement.scrollHeight > ${height}`),'Expanded FAQ changes document height');
        await evaluate(`scrollTo(0,document.documentElement.scrollHeight)`);
        await delay(650);
        const end=await cube();
        assert.ok(Math.abs(end.x-end.travel)<3,'Indicator recalculates after content expands and reaches the right edge');
        await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
        await until(`getComputedStyle(document.querySelector('.scroll-progress')).display === 'none'`);
        assert.equal(await evaluate(`getComputedStyle(document.documentElement).scrollSnapType`),'none','Mobile keeps native free scrolling');
        await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
        await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('.scroll-progress')).display`),'none');
        assert.equal(await evaluate(`getComputedStyle(document.documentElement).scrollSnapType`),'none','Reduced motion disables snapping');
        await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
        await send('Page.navigate',{url:new URL('catalog/',base).href});
        await until(`!!document.querySelector('.product-grid')`);
        assert.equal(await evaluate(`!!document.querySelector('.scroll-progress')`),false);
        assert.equal(await evaluate(`getComputedStyle(document.documentElement).scrollSnapType`),'none','Snapping is scoped to the homepage');
        assert.deepEqual(exceptions,[]);
      });
      await t.test(`${theme || 'light/'} seamless automatic reel and manual controls`, async () => {
        exceptions.length = 0;
        await send('Page.navigate', { url: new URL(theme, base).href });
        await until(`!!document.querySelector('.product-scroller .product') && document.readyState === 'complete'`);
        await delay(800);
        const geometry = await evaluate(`(() => {
          const reel = document.querySelector('.product-scroller');
          const first = Array.from(reel.querySelectorAll('.product')).find(card => card.getBoundingClientRect().right > 0);
          const style = getComputedStyle(reel), rect = reel.getBoundingClientRect();
          return { width: rect.width, viewport: document.documentElement.clientWidth, left: rect.left,
            first: first.getBoundingClientRect().left, scrollbar: style.scrollbarWidth,
            webkitScrollbar: getComputedStyle(reel, '::-webkit-scrollbar').display,
            arrows: !!document.querySelector('.reel-controls'), mask: style.maskImage,
            linkBelow: document.querySelector('#catalog .catalog-link').getBoundingClientRect().top >= rect.bottom };
        })()`);
        assert.ok(Math.abs(geometry.width - geometry.viewport) <= 1, 'Reel fills the viewport');
        assert.ok(geometry.first < geometry.viewport * 0.12, 'Visible cards have no centering hole');
        assert.equal(geometry.scrollbar, 'none');
        assert.equal(geometry.webkitScrollbar, 'none');
        assert.equal(geometry.arrows, false);
        assert.notEqual(geometry.mask, 'none', 'Overflow has an edge fade');
        assert.equal(geometry.linkBelow, true, 'Catalog link is below the reel');
        await evaluate(`document.querySelector('.product-scroller').scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(150);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
        const autoBefore = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        await delay(1200);
        const autoDelta = await evaluate(`document.querySelector('.product-scroller').scrollLeft - ${autoBefore}`);
        assert.ok(autoDelta > 15 && autoDelta < 65, 'Reel advances smoothly at roughly 30px/sec');
        const hoverPoint = await evaluate(`(() => {
          const cards = Array.from(document.querySelectorAll('.product-scroller .product'));
          const r = cards.find(card => { const b = card.getBoundingClientRect(); return b.left > 0 && b.right < innerWidth; }).getBoundingClientRect();
          return { x:r.left+r.width/2, y:r.top+r.height/2 };
        })()`);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...hoverPoint });
        await delay(350);
        const paused = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        await delay(400);
        assert.equal(await evaluate(`document.querySelector('.product-scroller').scrollLeft`), paused, 'Intentional hover pauses');
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
        await delay(400);
        assert.ok(await evaluate(`document.querySelector('.product-scroller').scrollLeft > ${paused+4}`), 'Leaving resumes');
        const point = await evaluate(`(() => { const r = document.querySelector('.product-scroller').getBoundingClientRect(); return {x:r.width*0.65,y:r.top+r.height*0.3}; })()`);
        const url = await evaluate('location.href');
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
        for (let i=1; i<=10; i++) {
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x-i*25, y: point.y, button: 'left', buttons: 1 });
          await delay(16);
        }
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x-250, y: point.y, button: 'left', buttons: 0, clickCount: 1 });
        await until(`document.querySelector('.product-scroller').scrollLeft > 100`);
        assert.equal(await evaluate('location.href'), url, 'Dragging a product never opens it');
        const beforeWheel = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...point, deltaY: 240, deltaX: 0, modifiers: 8 });
        await until(`document.querySelector('.product-scroller').scrollLeft > ${beforeWheel+50}`);
        const scales = await evaluate(`Array.from(document.querySelectorAll('.product-scroller .product')).map(card => {
          const style = getComputedStyle(card); return Number(style.scale === 'none' ? new DOMMatrix(style.transform).a : style.scale);
        })`);
        assert.ok(Math.max(...scales) - Math.min(...scales) > 0.06, 'Center and side cards have different scales');
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'Vertical scrolling does not pin or drive the reel');
        const chosenPosition = await evaluate(`(() => {
          const s = document.querySelector('.product-scroller');
          return s.scrollLeft - (s.querySelector('[data-copy="1"] .product').offsetLeft - s.querySelector('[data-copy="0"] .product').offsetLeft);
        })()`);
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await until(`document.querySelectorAll('.product-scroller .product').length === 9 && Array.from(document.querySelectorAll('.product-scroller .product')).every(card => ['none','1'].includes(getComputedStyle(card).scale))`);
        const reducedPosition = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        assert.ok(Math.abs(reducedPosition - chosenPosition) < 200, `Changing motion preference preserves the chosen card: ${chosenPosition} -> ${reducedPosition}`);
        const still = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        await delay(400);
        assert.equal(await evaluate(`document.querySelector('.product-scroller').scrollLeft`), still, 'Reduced motion disables automatic travel');
        await evaluate(`document.querySelector('.product-scroller').scrollLeft += 400`);
        await until(`document.querySelector('.product-scroller').scrollLeft > ${still+100}`);
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await until(`document.querySelectorAll('.product-scroller .product').length === 27`);
        await delay(300);
        const button = await evaluate(`(() => { const r = Array.from(document.querySelectorAll('.product-scroller button')).find(b => { const r=b.getBoundingClientRect(); return r.left>0 && r.right<innerWidth; }).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
        await send('Input.dispatchMouseEvent', {type:'mousePressed',...button,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent', {type:'mouseReleased',...button,button:'left',clickCount:1});
        await until(`Number(document.querySelector('.cart-count')?.textContent) > 0`);
        assert.equal(await evaluate('location.href'), url, 'Add-to-cart remains a separate button');
        const card = await evaluate(`(() => { const r = Array.from(document.querySelectorAll('.product-scroller .product-open')).find(b => { const r=b.getBoundingClientRect(); return r.left>0 && r.right<innerWidth; }).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/3}; })()`);
        await send('Input.dispatchMouseEvent', {type:'mousePressed',...card,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent', {type:'mouseReleased',...card,button:'left',clickCount:1});
        await until(`location.pathname.endsWith('/product/') && !!document.querySelector('h1')`);
        assert.deepEqual(exceptions, []);
      });
      await t.test(`${theme || 'light/'} cart, checkout, delivery and content layout`, async () => {
        for (const width of [320, 390, 768, 1440]) {
          await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
          await send('Page.navigate', { url: new URL(theme, base).href });
          await until(`document.readyState === 'complete' && !!document.querySelector('.order-steps')`);
          assert.equal(await evaluate(`document.querySelectorAll('.order-steps > li').length`), 4);
          assert.equal(await evaluate(`!!(document.querySelector('.bento-section').compareDocumentPosition(document.querySelector('#about')) & Node.DOCUMENT_POSITION_FOLLOWING)`), true);
          assert.equal(await evaluate(`document.querySelectorAll('.bento-card').length`), 5);
          assert.equal(await evaluate(`document.querySelector('#benefits-title').textContent`), 'О кубиках');
          assert.ok(await evaluate(`document.querySelector('.bento-grid').textContent.includes('Выбирайте из 4 цветов')`));
          assert.ok(await evaluate(`document.querySelector('#delivery iframe')?.src.includes('openstreetmap.org')`), 'Homepage retains the actual map below contacts');
          assert.ok(await evaluate(`!!(document.querySelector('#contacts').compareDocumentPosition(document.querySelector('#delivery')) & Node.DOCUMENT_POSITION_FOLLOWING)`));
          assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), `Home fits ${width}px`);

          await send('Page.navigate', { url: new URL(theme + 'configure/', base).href });
          await until(`document.readyState === 'complete' && !!document.querySelector('.configure-controls')`);
          await delay(150);
          await evaluate(`localStorage.removeItem('rollform:demo-cart:v3')`);
          await send('Page.reload');
          await until(`document.readyState === 'complete' && !!document.querySelector('.configure-controls')`);
          await delay(150);
          await evaluate(`Array.from(document.querySelectorAll('.configure-controls button')).find(b => b.textContent.includes('В корзину')).click()`);
          await until(`Number(document.querySelector('.cart-count')?.textContent) === 1`);
          await send('Page.navigate', { url: new URL(theme + 'cart/', base).href });
          await until(`!!document.querySelector('.cart-entry')`);
          assert.equal(await evaluate(`document.querySelector('.quantity button').disabled`), false);
          assert.ok(await evaluate(`!!document.querySelector('.cart-entry-actions .cart-remove svg')`));
          assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), `Cart fits ${width}px`);
          assert.equal(await evaluate(`document.querySelector('.cart-summary .button').textContent`), 'Оформить заказ');
          await evaluate(`document.querySelector('.quantity button:last-child').click()`);
          await until(`document.querySelector('.quantity span').textContent === '2'`);
          await evaluate(`document.querySelector('.quantity button').click()`);
          await until(`document.querySelector('.quantity span').textContent === '1'`);
          await send('Page.reload');
          await until(`document.querySelector('.quantity span')?.textContent === '1'`);
          await evaluate(`document.querySelector('.cart-summary .button').click()`);
          await until(`location.hash === '#contact-form' && !!document.querySelector('#contact-form')`);
          assert.ok((await evaluate('location.pathname')).endsWith(theme + 'contacts/'), 'Checkout retains theme');
          await until(`!!document.querySelector('#delivery iframe')`);
          assert.ok(await evaluate(`document.querySelector('#delivery').textContent.includes('Адрес самовывоза пока не подтверждён')`));
          assert.ok(await evaluate(`!document.querySelector('#delivery iframe').src.includes('marker=')`));
          assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), `Contacts fit ${width}px`);
          await evaluate(`document.querySelector('#delivery').scrollIntoView({block:'center',behavior:'instant'})`);
          await delay(200);
          const mapPoint = await evaluate(`(() => {const r=document.querySelector('.production-map-frame').getBoundingClientRect(); return {x:r.left+r.width/2,y:Math.max(100,Math.min(innerHeight-100,r.top+r.height/2))};})()`);
          const pageBefore = await evaluate('scrollY');
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...mapPoint, deltaX: 0, deltaY: 100 });
          await delay(150);
          assert.ok(await evaluate(`scrollY > ${pageBefore+20}`), 'Inactive map lets the page scroll');
          await evaluate(`document.querySelector('.production-map-activate').focus()`);
          await send('Input.dispatchKeyEvent', { type:'rawKeyDown', key:'Enter', code:'Enter', windowsVirtualKeyCode:13 });
          await send('Input.dispatchKeyEvent', { type:'char', text:'\r', unmodifiedText:'\r', key:'Enter', code:'Enter', windowsVirtualKeyCode:13 });
          await send('Input.dispatchKeyEvent', { type:'keyUp', key:'Enter', code:'Enter', windowsVirtualKeyCode:13 });
          await until(`document.querySelector('.production-map-frame').dataset.active === 'true'`);
          assert.equal(await evaluate(`document.querySelector('.production-map-frame iframe').tabIndex`), 0);
          await evaluate(`Array.from(document.querySelectorAll('.production-map button')).find(b=>b.textContent.includes('Выключить')).click()`);
          await until(`document.querySelector('.production-map-frame').dataset.active === 'false'`);
          await send('Page.navigate', { url: new URL(theme + 'cart/', base).href });
          await until(`!!document.querySelector('.cart-entry')`);
          await evaluate(`document.querySelector('.quantity button').click()`);
          await until(`!!document.querySelector('.empty-state')`);
          await send('Page.reload');
          await until(`document.readyState === 'complete' && !!document.querySelector('.empty-state')`);
          assert.equal(await evaluate(`JSON.parse(localStorage.getItem('rollform:demo-cart:v3')).length`), 0, 'Deletion persists');
        }
        await send('Emulation.setDeviceMetricsOverride', { width:1440, height:1100, deviceScaleFactor:1, mobile:false });
        assert.deepEqual(exceptions, []);
      });
      await t.test(theme ? 'dark' : 'light', async () => {
        exceptions.length = 0;
        const home = new URL(theme, base).href;
        await send('Page.navigate', { url: home });
        await until(`document.readyState === 'complete' && !!document.querySelector('.dice-canvas canvas')`);
        await evaluate(`(() => {
          const reel = document.querySelector('.product-scroller');
          scrollTo(0, scrollY + reel.getBoundingClientRect().top + reel.clientHeight / 2 - innerHeight / 2 + 100);
        })()`);
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'The former pin is removed');
        const destination = new URL('configure/', home).href;
        await evaluate(`document.querySelector('.desktop-nav a[href$="/configure/"]').click()`);
        await until(`location.pathname === new URL(${JSON.stringify(destination)}).pathname && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'No stale pin after navigation');
        await send('Page.reload');
        await until(`document.readyState === 'complete' && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
      });
      await t.test(`${theme || 'light/'} one-shot reveals and reduced motion`, async () => {
        await send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'no-preference'}] });
        exceptions.length = 0;
        const home = new URL(theme, base).href;
        await send('Page.navigate', { url: home });
        await until(`document.readyState === 'complete' && !!document.querySelector('.dice-canvas canvas')`);
        const title = '#production .production-intro';
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('${title}')).opacity`), '1', 'Offscreen content starts visible');
        const firstEntry = await sampleEntry(title);
        assert.ok(firstEntry.some(opacity => opacity < 0.99), 'Copy reveals on its first entry');
        assert.equal(firstEntry.at(-1), 1, 'Copy finishes fully visible');
        assert.equal(await evaluate(`document.querySelector('${title}').style.transform`), '', 'Finished motion leaves no transform');
        await evaluate(`scrollTo({ top: 0, behavior: 'instant' })`);
        await delay(100);
        assert.ok((await sampleEntry(title)).every(opacity => opacity === 1), 'Copy does not replay on re-entry');

        await evaluate(`document.querySelector('#faq .section-title').scrollIntoView({ block: 'center', behavior: 'instant' })`);
        await until(`Number(getComputedStyle(document.querySelector('#faq .section-title')).opacity) < 0.99`);
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await until(`['#production .production-intro', '#faq .section-title'].every(selector => {
          const element = document.querySelector(selector);
          return getComputedStyle(element).opacity === '1' && !element.style.transform && !element.style.opacity;
        })`);
        await send('Page.reload');
        await until(`document.readyState === 'complete' && !!document.querySelector('#faq .section-title')`);
        assert.ok((await sampleEntry('#faq .section-title')).every(opacity => opacity === 1), 'Reduced motion is visible without a reveal');
        assert.deepEqual(exceptions, []);
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
      });
    }
  } finally {
    if (socket) {
      try { await send('Browser.close'); } catch { /* Browser may have exited. */ }
      socket.close();
    }
    browser.kill();
    await delay(1000);
    // This directory was created uniquely by this test, never supplied by callers.
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Windows may still hold a profile lock. */ }
  }
});
