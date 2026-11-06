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

test('navigation unpins the homepage before React removes its DOM', { timeout: 120000 }, async t => {
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
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    for (const theme of ['', 'dark/']) {
      await t.test(theme ? 'dark' : 'light', async () => {
        exceptions.length = 0;
        const home = new URL(theme, base).href;
        await send('Page.navigate', { url: home });
        // The pin must really exist; otherwise this test misses the original bug.
        await until(`!!document.querySelector('.pin-spacer')`);
        await evaluate(`(() => {
          const reel = document.querySelector('.product-scroller');
          scrollTo(0, scrollY + reel.getBoundingClientRect().top + reel.clientHeight / 2 - innerHeight / 2 + 100);
        })()`);
        await until(`getComputedStyle(document.querySelector('#catalog')).position === 'fixed'`);
        const destination = new URL('configure/', home).href;
        await evaluate(`document.querySelector('.desktop-nav a[href$="/configure/"]').click()`);
        await until(`location.href === ${JSON.stringify(destination)} && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
        assert.equal(await evaluate(`!!document.querySelector('.pin-spacer')`), false, 'No stale pin after navigation');
        await send('Page.reload');
        await until(`document.readyState === 'complete' && document.querySelector('h1')?.textContent === 'Собери сам'`);
        assert.deepEqual(exceptions, []);
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
