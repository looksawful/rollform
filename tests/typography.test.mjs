import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const src = (pathName) => readFileSync(path.resolve(process.cwd(), pathName), 'utf8');
const token = src('src/styles/tokens.css');
const base = src('src/styles/base.css');
const component = src('src/styles/components.css');
const pages = src('src/styles/pages.css');
const section = src('src/styles/sections.css');
const patterns = src('src/styles/patterns.css');

test('Russian typography uses semantic type sizes, line heights and a readable measure', () => {
  for (const name of ['--fs-body','--fs-small','--fs-title','--fs-heading','--fs-display',
    '--lh-body','--lh-small','--lh-title','--lh-heading','--lh-display','--tracking-display',
    '--tracking-heading','--measure']) {
    assert.ok(token.includes(name + ':'), 'Missing '+name);
  }
  assert.match(token, /--fs-body:\s*1rem;/);
  assert.match(token, /--fs-small:\s*0\.875rem;/);
  assert.match(token, /--lh-body:\s*1\.55;/);
  assert.match(token, /--measure:\s*62ch;/);
  assert.match(base, /line-height:\s*var\(--lh-body\)/);
  assert.match(base, /font-kerning:\s*normal/);
  assert.match(base, /letter-spacing:\s*normal/);
  assert.match(src('src/app/layout.tsx'), /<html lang="ru">/);
});

test('display, headings, cards and interactive text reuse their semantic roles', () => {
  assert.match(section, /\.hero h1\s*\{[^}]*font-size:\s*var\(--fs-display\)/);
  assert.match(section, /\.hero h1\s*\{[^}]*line-height:\s*var\(--lh-display\)/);
  assert.match(pages, /\.page-title\s*\{[^}]*font-size:\s*var\(--fs-heading\)/);
  assert.match(pages, /\.section-title\s*\{[^}]*font-size:\s*var\(--fs-heading\)/);
  assert.match(pages, /\.bento-card h3\s*\{[^}]*font-size:\s*var\(--fs-title\)/);
  assert.match(pages, /\.product-copy h3\s*\{[^}]*font-size:\s*var\(--fs-title\)/);
  assert.match(component, /\.nav\s*\{[^}]*font-size:\s*var\(--fs-small\)/);
  assert.match(component, /\.button\s*\{[^}]*font-size:\s*var\(--fs-small\)/);
  assert.match(pages, /\.pill-list/);
});

test('body text and Prose preserve vertical rhythm without overriding Stack', () => {
  assert.match(patterns, /\.prose\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-block-start:\s*var\(--prose-gap,/);
  assert.match(patterns, /\.prose\s*>\s*:is\(p,\s*ul,\s*ol\)\s*\{[^}]*max-inline-size:\s*var\(--measure,/);
  assert.match(patterns, /\.prose\s*>\s*:is\(h1,\s*h2,\s*h3\)\s*\+\s*\*/);
  assert.match(base, /overflow-wrap:\s*break-word/);
  assert.match(base, /hyphens:\s*auto/);
  assert.doesNotMatch(base, /text-transform:\s*uppercase/);
});

test('Cyrillic headings avoid aggressive tracking and mobile Hero remains responsive', () => {
  assert.match(token, /--tracking-display:\s*-0\.03em;/);
  assert.match(token, /--tracking-heading:\s*-0\.02em;/);
  assert.match(section, /\.hero\.hero-centered\s*\{/);
  assert.match(pages, /\.hero h1\s*\{[^}]*font-size:\s*clamp\(/);
  assert.match(section, /\.hero\.hero-centered h1\s*\{[^}]*font-size:\s*clamp\(2\.75rem,\s*12\.5vw,\s*4\.7rem\)/);
  assert.doesNotMatch([base,component,section,pages].join('\n'), /letter-spacing:\s*-0\.0[5-9]/);
  assert.doesNotMatch([base,component,section,pages].join('\n'), /text-transform:\s*uppercase/);
});


test('wide editorial layouts cap catalog cards through shared composition limits', () => {
  const contentMax = Number(token.match(/--content-max:\s*([\d.]+)rem;/)?.[1]);
  const collectionMax = Number(token.match(/--collection-max:\s*([\d.]+)rem;/)?.[1]);
  assert.ok(contentMax >= 72 && contentMax <= 82, 'Site content is bounded on ultrawide displays');
  assert.ok(collectionMax >= 64 && collectionMax <= 72 && collectionMax < contentMax,
    'Product collection has a narrower layout measure than the site wrapper');
  assert.match(pages, /\.product-grid\s*\{[^}]*max-inline-size:\s*var\(--collection-max\)/);
  assert.match(pages, /\.product-grid\s*\{[^}]*margin-inline:\s*auto/);
  assert.match(pages, /--reel-card-size:\s*clamp\(17rem,\s*25vw,\s*20rem\)/);
});
