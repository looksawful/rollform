import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const read = file => readFileSync(path.resolve(process.cwd(), file), 'utf8');

test('no fabricated cookie-consent/legal UI blocks the storefront', () => {
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/pages.css');
  assert.ok(!existsSync('src/components/LegalDialogs.tsx'));
  assert.doesNotMatch(shell, /LegalDialogs|photoCredits|photo-credits/);
  assert.doesNotMatch(css, /\.legal-dialog|\.legal-links/);
  assert.match(shell, /<footer className="footer">/);
});

test('the cart persists only after user selection, without tracking scripts', () => {
  const state = read('src/components/CartState.tsx');
  const shell = read('src/components/SiteShell.tsx');
  assert.match(state, /localStorage\.getItem/);
  assert.match(state, /localStorage\.setItem/);
  assert.ok(shell.includes('<Link href={"/cart"} className="cart-shortcut"'));
  assert.ok(shell.includes('{count > 0 && <span className="cart-count"'));
  assert.ok(!shell.includes('{count > 0 && <Link'));
  assert.doesNotMatch(state + shell, /gtag\(|fbq\(|analytics\./);
});

test('all existing layout algorithms are reused where appropriate', () => {
  const patterns = read('src/styles/patterns.css');
  const home = read('src/components/BentoSection.tsx');
  const builder = read('src/components/Configurator.tsx');
  const shell = read('src/components/SiteShell.tsx');
  const css = read('src/styles/pages.css');
  assert.match(patterns, /\.icon\s*\{/);
  assert.match(shell, /className="icon"/);
  assert.match(builder, /className="configure-layout sidebar"/);
  assert.match(builder, /className="pill-list cluster"/);
  assert.match(home, /className="bento-viewport scroller"/);
  assert.match(home, /className="bento-card box"/);
  assert.match(css, /\.product\s*\{[^}]*border:\s*var\(--border-default\)/);
  assert.match(css, /\.product-detail\s*\{[^}]*display:\s*grid/);
  assert.match(patterns, /\.prose\s*>\s*:is\(p,\s*ul,\s*ol\)/);
  assert.match(patterns, /--measure/);
});
