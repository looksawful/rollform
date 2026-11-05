import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = file => readFileSync(path.resolve(process.cwd(), file), 'utf8');

test('both legal overlays use native accessible modal dialogs and footer triggers', () => {
  const modal = read('src/components/LegalDialogs.tsx');
  const shell = read('src/components/SiteShell.tsx');
  assert.match(modal, /<dialog[^>]*className="legal-dialog stack"/);
  assert.equal((modal.match(/<dialog\b/g) || []).length, 2);
  assert.match(modal, /aria-labelledby="cookie-dialog-title"/);
  assert.match(modal, /aria-labelledby="agreement-dialog-title"/);
  assert.match(modal, /ref=\{agreementDialog\} tabIndex=\{-1\}/);
  assert.match(modal, /dialog\.focus\(\)/);
  assert.match(modal, /dialog\.scrollTop = 0/);

  assert.match(modal, /showModal\(\)/);
  assert.match(modal, /method="dialog"/);
  assert.match(shell, /<LegalDialogs\s*\/>/);
  assert.equal((shell.match(/import LegalDialogs from/g) || []).length, 1);
  assert.doesNotMatch(modal, /role="dialog"|aria-modal|document\.addEventListener\('keydown'/);
});

test('cookie preferences allow rejection, acceptance, reopening and persistence without trackers', () => {
  const modal = read('src/components/LegalDialogs.tsx');
  assert.match(modal, /rollform:cookie-choice/);
  assert.match(modal, /localStorage\.getItem/);
  assert.match(modal, /localStorage\.setItem/);
  assert.match(modal, /'rejected'/);
  assert.match(modal, /'accepted'/);
  assert.match(modal, /Отклонить/);
  assert.match(modal, /Принять/);
  assert.match(modal, /Файлы cookie/);
  assert.match(modal, /Пользовательское соглашение/);
  assert.doesNotMatch(modal, /document\.cookie|analytics|gtag|facebook|pixel/);
});

test('dialog surface is hidden when closed and tokenized in both themes', () => {
  const css = read('src/styles/pages.css');
  assert.match(css, /\.legal-dialog:not\(\[open\]\)\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.legal-dialog\[open\]\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.legal-dialog::backdrop/);
  assert.match(css, /\.legal-dialog\s*\{[^}]*margin:\s*auto/);
  assert.match(css, /\.legal-dialog\s*\{[^}]*var\(--color-background\)/);
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
  assert.match(css, /container-type:\s*inline-size/);
  assert.match(css, /@container\s*\(width\s*<\s*18rem\)/);
  assert.match(patterns, /\.prose\s*>\s*:is\(p,\s*ul,\s*ol\)/);
  assert.match(patterns, /--measure/);
});
