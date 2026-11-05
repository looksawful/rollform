import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viewer = readFileSync('src/components/DiceViewer.tsx', 'utf8');
const css = readFileSync('src/styles/sections.css', 'utf8');

test('single 3D scene uses tokenized automatic roll / settle / rest without pointer controls', () => {
  assert.match(viewer, /data-motion/);
  assert.match(viewer, /Quaternion/);
  assert.match(viewer, /prefers-reduced-motion/);
  assert.doesNotMatch(viewer, /pointerdown|pointermove|onKeyDown/);
  assert.match(css, /--dice-roll-duration/);
  assert.match(css, /--dice-hold-duration/);
});
