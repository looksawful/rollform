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
test('uses OrbitControls rather than a bespoke pointer/physics engine', () => {
  assert.match(viewer, /OrbitControls/);
  assert.doesNotMatch(viewer, /requestAnimationFrame|setTimeout|pointermove/);
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
  assert.match(viewer, /touch-action:none/);
  assert.match(viewer, /if \(continuous\) host\.dataset\.motion = 'rolling'/);
});

test('Hero camera is farther away while configurator camera stays unchanged', () => {
  assert.match(viewer, /camera\.position\.set\(0,\s*0,\s*continuous\s*\?\s*10\s*:\s*6\.6\)/);
});

test('continuous hero rendering stays cheap while scrolling and when barely visible', () => {
  assert.match(viewer, /continuous \? 1\.25 : 2/);
  assert.match(viewer, /scrollPauseUntil/);
  assert.match(viewer, /window\.addEventListener\('scroll', onScroll, \{ passive: true \}\)/);
  assert.match(viewer, /window\.removeEventListener\('scroll', onScroll\)/);
  assert.match(viewer, /frameInterval = continuous \? 33 : 0/);
  assert.match(viewer, /entry\.intersectionRatio > 0\.12/);
  assert.match(viewer, /threshold: \[0, 0\.12\]/);
});
