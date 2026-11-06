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
        for (const theme of ['', 'dark/']) {
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
              destination: document.querySelector('.hero-copy .button').href,
            };
          })()`);
          assert.ok(layout.contentWidth <= layout.viewport + 1, 'Hero never causes page overflow');
          assert.ok(layout.destination.endsWith('/configure/'), 'Hero CTA opens the configurator');
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
              document.querySelector('h1')?.textContent === 'Собери сам'`);
          }
        }
      });
    }
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
    });
    await t.test('all published navigation URLs respond without errors', async () => {
      for (const theme of ['', 'dark/']) {
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
    for (const theme of ['', 'dark/']) {
      await t.test(`${theme || 'light/'} full-width manual reel`, async () => {
        exceptions.length = 0;
        await send('Page.navigate', { url: new URL(theme, base).href });
        await until(`!!document.querySelector('.product-scroller .product') && document.readyState === 'complete'`);
        await delay(800);
        const geometry = await evaluate(`(() => {
          const reel = document.querySelector('.product-scroller'), first = reel.firstElementChild;
          const style = getComputedStyle(reel), rect = reel.getBoundingClientRect();
          return { width: rect.width, viewport: document.documentElement.clientWidth, left: rect.left,
            first: first.getBoundingClientRect().left, scrollbar: style.scrollbarWidth,
            webkitScrollbar: getComputedStyle(reel, '::-webkit-scrollbar').display,
            arrows: !!document.querySelector('.reel-controls'), mask: style.maskImage,
            linkBelow: document.querySelector('#catalog .catalog-link').getBoundingClientRect().top >= rect.bottom };
        })()`);
        assert.ok(Math.abs(geometry.width - geometry.viewport) <= 1, 'Reel fills the viewport');
        assert.ok(geometry.first >= 0 && geometry.first < geometry.viewport * 0.12, 'First card has no centering hole');
        assert.equal(geometry.scrollbar, 'none');
        assert.equal(geometry.webkitScrollbar, 'none');
        assert.equal(geometry.arrows, false);
        assert.notEqual(geometry.mask, 'none', 'Overflow has an edge fade');
        assert.equal(geometry.linkBelow, true, 'Catalog link is below the reel');
        await evaluate(`document.querySelector('.product-scroller').scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(150);
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
        const scales = await evaluate(`Array.from(document.querySelectorAll('.product-scroller > .product')).map(card => {
          const style = getComputedStyle(card); return Number(style.scale === 'none' ? new DOMMatrix(style.transform).a : style.scale);
        })`);
        assert.ok(Math.max(...scales) - Math.min(...scales) > 0.06, 'Center and side cards have different scales');
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'Vertical scrolling does not pin or drive the reel');
        const chosenPosition = await evaluate(`document.querySelector('.product-scroller').scrollLeft`);
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await until(`Array.from(document.querySelectorAll('.product-scroller > .product')).every(card => ['none','1'].includes(getComputedStyle(card).scale))`);
        assert.equal(await evaluate(`document.querySelector('.product-scroller').scrollLeft`), chosenPosition, 'Changing motion preference preserves the chosen card');
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await evaluate(`document.querySelector('.product-scroller').scrollTo({left:0,behavior:'instant'})`);
        await delay(300);
        const button = await evaluate(`(() => { const r = document.querySelector('.product-scroller button').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
        await send('Input.dispatchMouseEvent', {type:'mousePressed',...button,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent', {type:'mouseReleased',...button,button:'left',clickCount:1});
        await until(`Number(document.querySelector('.cart-count')?.textContent) > 0`);
        assert.equal(await evaluate('location.href'), url, 'Add-to-cart remains a separate button');
        const card = await evaluate(`(() => { const r = document.querySelector('.product-scroller .product-open').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/3}; })()`);
        await send('Input.dispatchMouseEvent', {type:'mousePressed',...card,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent', {type:'mouseReleased',...card,button:'left',clickCount:1});
        await until(`location.pathname.endsWith('/product/') && !!document.querySelector('h1')`);
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
        await until(`location.href === ${JSON.stringify(destination)} && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'No stale pin after navigation');
        await send('Page.reload');
        await until(`document.readyState === 'complete' && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
      });
      await t.test(`${theme || 'light/'} one-shot reveals and reduced motion`, async () => {
        exceptions.length = 0;
        const home = new URL(theme, base).href;
        await send('Page.navigate', { url: home });
        await until(`document.readyState === 'complete' && !!document.querySelector('.dice-canvas canvas')`);
        const title = '#production > .section-title';
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
        await until(`['#production > .section-title', '#faq .section-title'].every(selector => {
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
