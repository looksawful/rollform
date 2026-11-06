import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diceShapes, shellColors, fontStyles, initialConfig, configFromParams,
  randomDiceConfig, diceQuery, readSavedDice } from '../src/lib/catalog.ts';

test('random Hero config covers all 84 valid combinations without coupling parameters', () => {
  const combinations = new Set();
  for (let shape = 0; shape < diceShapes.length; shape++) {
    for (let shell = 0; shell < shellColors.length; shell++) {
      for (let font = 0; font < fontStyles.length; font++) {
        const draws = [(shape + 0.5) / diceShapes.length,
          (shell + 0.5) / shellColors.length,
          (font + 0.5) / fontStyles.length];
        const config = randomDiceConfig(() => draws.shift());
        assert.deepEqual(config, { shape: diceShapes[shape], shell: shellColors[shell].value, font: fontStyles[font] });
        combinations.add(JSON.stringify(config));
      }
    }
  }
  assert.equal(combinations.size, 84);
});

test('random dice is shareable in URL; direct entry without saved dice stays on default', () => {
  const generated = { shape: 'd%', shell: '#215BA8', font: 'serif' };
  const query = diceQuery(generated);
  assert.deepEqual(configFromParams(new URLSearchParams(query)), generated);
  assert.equal(readSavedDice(null), null);
  assert.deepEqual(configFromParams(new URLSearchParams()), initialConfig);
});

test('saved dice restores only complete valid query strings', () => {
  const generated = { shape: 'd8', shell: '#196641', font: 'mono' };
  assert.deepEqual(readSavedDice(diceQuery(generated)), generated);
  assert.equal(readSavedDice('shape=d20'), null);
  assert.equal(readSavedDice('shape=d20&shell=not-a-color&font=mono'), null);
  assert.equal(readSavedDice('preset=demo-5'), null);
});

test('Hero creates a random dice, while menu remains a regular configurator link', () => {
  const hero = readFileSync('src/components/Storefront.tsx', 'utf8');
  const shell = readFileSync('src/components/SiteShell.tsx', 'utf8');
  const editor = readFileSync('src/components/Configurator.tsx', 'utf8');
  assert.match(hero, />Создать случайный кубик<\/span>/);
  assert.match(hero, /randomDiceConfig\(/);
  assert.match(hero, /<Box className="icon" aria-hidden="true"\s*\/>/);
  assert.match(shell, /href: '\/configure', label: 'Собери сам'/);
  assert.match(editor, /readSavedDice\(/);
  assert.match(editor, /localStorage\.setItem\(/);
});
