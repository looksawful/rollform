import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const home = readFileSync('src/components/Storefront.tsx','utf8');

test('homepage sections follow approved reading and shopping flow', () => {
  const markers = [
    'className="wrapper hero hero-centered"',
    '<BentoSection />',
    'className="section stack catalog-section"',
    '<ProductionInfo onHome />',
    '<DeliveryInfo />',
    'id="faq"',
    'id="about"',
    'id="contacts"',
  ];
  let previous = -1;
  for (const marker of markers) {
    const offset = home.indexOf(marker);
    assert.ok(offset > previous, `Expected ${marker} after previous section`);
    previous = offset;
  }
  assert.match(home, /<BentoSection\s*\/>\s*<section className="section stack catalog-section"/);
  assert.match(home, /<ProductionInfo onHome\s*\/>\s*<DeliveryInfo\s*\/>/);
  assert.match(home, /id="contacts"[\s\S]*?<ScrollProgress\s*\/>/);
});

test('About uses locally served licensed photo of resin casting equipment', () => {
  assert.match(home, /photos\/casting-vacuum-chamber\.jpg/);
  assert.ok(existsSync('public/photos/casting-vacuum-chamber.jpg'));
  assert.match(home, /Вакуумная камера/);
  assert.match(home, /Emccorm/);
  assert.match(home, /creativecommons\.org\/licenses\/by\/3\.0/);
});
