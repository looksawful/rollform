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

test('roll is deliberately slow and includes a visible pause on mobile', () => {
  const rollMs = Number(css.match(/--dice-roll-duration:\s*(\d+)ms/)?.[1]);
  const holdMs = Number(css.match(/--dice-hold-duration:\s*(\d+)ms/)?.[1]);
  assert.ok(rollMs >= 4500, 'roll should last at least 4.5 seconds');
  assert.ok(holdMs >= 2000, 'pause should last at least 2 seconds');
  assert.match(viewer, /Math\.PI \* 2 \* phase\.roll/);
  assert.doesNotMatch(viewer, /Math\.floor\(Math\.random\(\) \* 2\)/);
  assert.match(viewer, /ease: 'sine\.inOut', onStart: \(\) => \{ host\.dataset\.motion = 'rolling'/);
});


test('hero has a passive seamless loop, without click controls', () => {
  const storefront = readFileSync('src/components/Storefront.tsx', 'utf8');
  assert.match(storefront, /<DiceViewer config=\{initialConfig\} continuous \/>/);
  assert.match(viewer, /if \(continuous\) \{/);
  assert.match(viewer, /gsap\.timeline\(\{ repeat: -1 \}\)\.to\(dice\.rotation/);
  assert.match(viewer, /duration: 12, ease: 'none'/);
  assert.match(viewer, /pointer-events:none/);
});
