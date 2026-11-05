import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viewer = readFileSync('src/components/DiceViewer.tsx', 'utf8');
const css = readFileSync('src/styles/sections.css', 'utf8');

test('uses GSAP timeline, Three.js quaternion and motion CSS tokens', () => {
  assert.match(viewer, /import\('gsap'\)/);
  assert.match(viewer, /gsap\.timeline\(/);
  assert.match(viewer, /\.slerp\(/);
  assert.match(viewer, /prefers-reduced-motion/);
  assert.match(css, /--dice-roll-duration/);
  assert.match(css, /--dice-hold-duration/);
});
test('no bespoke frame loop, physics engine or pointer controls', () => {
  assert.doesNotMatch(viewer, /requestAnimationFrame|setTimeout|pointerdown|pointermove|onKeyDown/);
});
