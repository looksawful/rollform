import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.MATERIAL_LAB_URL || 'http://127.0.0.1:4173/material-lab/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
assert.ok(existsSync(chrome), 'Chrome missing');
const profile = mkdtempSync(join(tmpdir(), 'rollform-lab-'));
const processChrome = spawn(chrome, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--disable-extensions', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 120 && !existsSync(portFile); i++) await pause(100);
  assert.ok(existsSync(portFile), 'Chrome did not start');
  const port = Number(readFileSync(portFile, 'utf8').split('\n')[0]);
  const target = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  const errors = [], responses = [];
  socket.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const job = pending.get(msg.id);
      if (!job) return;
      pending.delete(msg.id);
      msg.error ? job.reject(new Error(JSON.stringify(msg.error))) : job.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    } else if (msg.method === 'Network.responseReceived') {
      if (/material-lab\/.*\.glb|material-lab-textures\/.*\.webp/.test(msg.params.response.url)) {
        responses.push({ status: msg.params.response.status, url: msg.params.response.url });
      }
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evalJS = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const until = async expression => {
    for (let n = 0; n < 80; n++) {
      if (await evalJS(expression)) return;
      if (errors.length) throw new Error(errors.join('\n'));
      await pause(100);
    }
    throw new Error('Timeout ' + expression);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  for (const width of [390, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 800 });
    await send('Page.navigate', { url: base });
    await until('document.readyState === "complete" && !!document.querySelector(".ml-stage canvas")');
    await until('Array.from(performance.getEntriesByType("resource")).some(x=>x.name.includes("/models/material-lab/d20.glb"))');
    await pause(1400);
    let data = await evalJS('({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,total:document.querySelector(".ml-pager strong")?.textContent,canvas:!!document.querySelector(".ml-stage canvas"),stage:document.querySelector(".ml-stage")?.getBoundingClientRect().width})');
    assert.ok(data.scroll <= data.w + 1, 'Page horizontal overflow ' + width + ' ' + JSON.stringify(data));
    assert.match(data.total, /\/ 693$/);
    assert.equal(data.canvas, true);
    if (width === 1440) {
      for (let n = 0; n < 7; n++) {
        await evalJS('document.querySelectorAll(".ml-set")[0].querySelectorAll("button")[' + n + '].click()');
        await pause(350);
      }
      for (let n = 0; n < 7; n++) {
        await evalJS('document.querySelectorAll(".ml-finish")[' + n + '].click()');
        await pause(220);
      }
      for (let n = 0; n < 4; n++) {
        await evalJS('document.querySelectorAll(".ml-set")[1].querySelectorAll("button")[' + n + '].click()');
        await pause(140);
      }
      for (let n = 0; n < 3; n++) {
        await evalJS('document.querySelectorAll(".ml-set")[2].querySelectorAll("button")[' + n + '].click()');
        await pause(150);
      }
      await evalJS('document.querySelectorAll(".ml-set")[0].querySelectorAll("button")[5].click()');
      await evalJS('document.querySelectorAll(".ml-finish")[2].click()');
      await pause(1200);
    }
    const epoxyShape = width === 390 ? 'd8' : 'd20';
    const epoxyFinishIndex = width === 390 ? 7 : 8;
    await evalJS('document.querySelectorAll(".ml-set")[0].querySelectorAll("button")[' + (width === 390 ? 2 : 5) + '].click()');
    await evalJS('document.querySelectorAll(".ml-finish")[' + epoxyFinishIndex + '].click()');
    await until(`Array.from(performance.getEntriesByType("resource")).some(x => x.name.includes("/models/epoxy-font/nova-flat/${epoxyShape}.glb"))`);
    if (width === 1440) {
      for (const [i, name] of ['nova-flat', 'square-antiqua', 'simply-serif', 'simply-mono'].entries()) {
        await evalJS('document.querySelectorAll(".ml-set")[2].querySelectorAll("button")[' + (i + 1) + '].click()');
        await until(`Array.from(performance.getEntriesByType("resource")).some(x => x.name.includes("/models/epoxy-font/${name}/d20.glb"))`);
      }
      await evalJS('document.querySelectorAll(".ml-set")[2].querySelectorAll("button")[1].click()');
    }
    await pause(1000);
    assert.equal(errors.length, 0, 'JS errors: ' + errors.join(' | '));
    const file = 'A:/AgentWork/artifacts/rollform-epoxy-' + width + '.png';
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    data = await evalJS('({state:location.search,canvasWidth:document.querySelector(".ml-stage canvas").width,stageHeight:document.querySelector(".ml-stage").clientHeight, selected:Array.from(document.querySelectorAll(".ml-finish")).find(x=>x.getAttribute("aria-pressed")==="true")?.textContent})');
    assert.equal(data.selected, width === 390 ? 'Смола · рубин' : 'Смола · чёрная вишня');
    await evalJS('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text => {window.__lastCopied=text}}});document.querySelector(".ml-copy").click()');
    await until('!!window.__lastCopied');
    const copied = await evalJS('window.__lastCopied');
    assert.equal(new URL(copied).searchParams.get('finish'), width === 390 ? 'epoxy-ruby' : 'epoxy-cherry');
    assert.equal(new URL(copied).searchParams.get('engraving'), 'nova-flat');
    console.log('PASS', width, JSON.stringify(data), file);
  }
  const failed = responses.filter(response => response.status !== 200);
  assert.deepEqual(failed, [], 'Asset request failed');
  const countModels = new Set(responses.filter(r => r.url.includes('.glb')).map(r => r.url.split('/').at(-1))).size;
  assert.equal(countModels, 6, 'Expected all 6 GLB geometries loaded');
  assert.ok(responses.some(r => r.url.includes('_Roughness.webp')), 'No real PBR roughness loaded');
  console.log('PASS', countModels, 'UV models, asset requests', responses.length, 'JS exceptions', errors.length);
} finally {
  socket?.close();
  processChrome.kill();
  await pause(300);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
