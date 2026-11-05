import test from 'node:test';
import assert from 'node:assert/strict';
import { cssTimeSeconds } from '../src/lib/cssTime.ts';

test('CSS times in ms and s produce identical GSAP seconds', () => {
  assert.equal(cssTimeSeconds('4500ms', 1), 4.5);
  assert.equal(cssTimeSeconds('4.5s', 1), 4.5);
  assert.equal(cssTimeSeconds('2200ms', 1), 2.2);
  assert.equal(cssTimeSeconds('2.2s', 1), 2.2);
  assert.equal(cssTimeSeconds('180ms', 1), 0.18);
  assert.equal(cssTimeSeconds('0.18s', 1), 0.18);
  assert.equal(cssTimeSeconds(' .38s ', 1), 0.38);
});

test('missing, invalid and nonpositive CSS time values use fallback', () => {
  for (const input of ['', '0ms', '-4s', 'bogus', '4', 'Infinitys']) {
    assert.equal(cssTimeSeconds(input, 3), 3, input);
  }
});
