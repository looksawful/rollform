import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
test('About has light and dark pages with Bento before the project description', () => {
  assert.ok(existsSync('src/app/about/page.tsx'));
  assert.ok(existsSync('src/app/dark/about/page.tsx'));
  const page = readFileSync('src/app/about/page.tsx', 'utf8');
  assert.match(page, /<BentoSection\s*\/>/);
  assert.ok(page.indexOf('<BentoSection') < page.indexOf('className="wrapper section page-section about-section"'));
  assert.match(page, /<h1 className="page-title">О нас<\/h1>/);
  const shell = readFileSync('src/components/SiteShell.tsx', 'utf8');
  assert.match(shell, /href:\s*'\/about',\s*label:\s*'О нас'/);
});
