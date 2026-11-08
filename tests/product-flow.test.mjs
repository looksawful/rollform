import test from 'node:test';
import assert from 'node:assert/strict';
import { configFromParams, diceShapes, fontNames, fontStyles, initialConfig, presets } from '../src/lib/catalog.ts';
import { addCartItem, changeQuantity, readCart } from '../src/lib/orders.ts';

test('prototype product configuration contains only the three selectable parameters', () => {
  assert.deepEqual(Object.keys(initialConfig), ['shape', 'shell', 'font']);
});

test('every offered font is accepted by URL and cart validation', () => {
  assert.deepEqual(fontStyles, Object.keys(fontNames));
  for (const font of fontStyles) {
    const config = { ...initialConfig, font };
    assert.deepEqual(configFromParams(new URLSearchParams('font=' + font)), config);
    assert.deepEqual(readCart(JSON.stringify([{ id: font, quantity: 1,
      origin: { kind: 'preorder_custom' }, config }] ))[0].config, config);
  }
});

test('config URL restores valid choices and ignores malformed values', () => {
  const selected = configFromParams(new URLSearchParams('shape=d10&shell=%23A62D35&font=mono'));
  assert.deepEqual(selected, { shape: 'd10', shell: '#A62D35', font: 'simply-mono' });
  assert.deepEqual(configFromParams(new URLSearchParams('shape=invalid&shell=red&font=bad')), initialConfig);
  assert.deepEqual(configFromParams(new URLSearchParams()), initialConfig);
});

test('preset link restores every offered variant without breaking explicit overrides', () => {
  for (const preset of presets) {
    assert.deepEqual(configFromParams(new URLSearchParams('preset=' + preset.id)), preset.config);
  }
  const first = presets[0];
  assert.deepEqual(configFromParams(new URLSearchParams('preset=' + first.id + '&shape=d8')), { ...first.config, shape: 'd8' });
  assert.deepEqual(configFromParams(new URLSearchParams('preset=missing&shape=d6')), { ...initialConfig, shape: 'd6' });
});

test('seven geometries, demonstration presets are not presented as stock', () => {
  assert.deepEqual(diceShapes, ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd%']);
  assert.ok(presets.length > 0);
  assert.ok(presets.every(p => p.fulfillment.kind === 'preorder'));
});

test('preset and custom selection remain distinct cart lines', () => {
  const preset = presets[0];
  const a = addCartItem([], { origin: { kind: 'preorder_preset', presetId: preset.id }, config: preset.config });
  const b = addCartItem(a, { origin: { kind: 'preorder_custom' }, config: preset.config });
  assert.equal(b.length, 2);
  assert.equal(b[0].origin.kind, 'preorder_preset');
  assert.equal(b[1].origin.kind, 'preorder_custom');
  const c = addCartItem(b, { origin: { kind: 'preorder_custom' }, config: preset.config });
  assert.equal(c.length, 2);
  assert.equal(c[1].quantity, 2);
  assert.equal(c[0].quantity, 1);
});

test('stock requires a known positive inventory', () => {
  assert.throws(() => addCartItem([], { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig, available: 0 }));
  assert.throws(() => addCartItem([], { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig }));
  const items = addCartItem([], { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig, available: 2 });
  assert.equal(items[0].quantity, 1);
  assert.equal(addCartItem(items, { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig, available: 2 })[0].quantity, 2);
  assert.throws(() => addCartItem(addCartItem(items, { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig, available: 2 }), { origin: { kind: 'in_stock', presetId: 'x' }, config: initialConfig, available: 2 }));
});

test('cart hydration rejects malformed and legacy entries instead of crashing', () => {
  assert.deepEqual(readCart('invalid-json'), []);
  assert.deepEqual(readCart(JSON.stringify([{ id: 'legacy', quantity: 1, config: initialConfig }])), []);
  const saved = addCartItem([], { origin: { kind: 'preorder_custom' }, config: initialConfig });
  assert.deepEqual(readCart(JSON.stringify(saved)), saved);
});

test('quantity changes keep selections and have bounds', () => {
  const saved = addCartItem([], { origin: { kind: 'preorder_custom' }, config: initialConfig });
  assert.deepEqual(changeQuantity(saved, saved[0].id, -1), []);
  assert.equal(changeQuantity(saved, saved[0].id, +1)[0].quantity, 2);
  assert.equal(changeQuantity(saved, saved[0].id, +200)[0].quantity, 99);
  assert.deepEqual(changeQuantity(saved, saved[0].id, -200), []);
  assert.deepEqual(changeQuantity(saved, saved[0].id, 0.5), saved);
  const other = addCartItem(saved, { origin: { kind: 'preorder_custom' }, config: { ...initialConfig, shape: 'd6' } });
  assert.deepEqual(changeQuantity(other, saved[0].id, -1), [other[1]]);
});

test('repeated adds never exceed the persisted cart limit', () => {
  for (const origin of [{ kind: 'preorder_custom' }, { kind: 'in_stock', presetId: 'x' }]) {
    const input = { origin, config: initialConfig, available: 101 };
    const added = addCartItem([], input);
    const full = changeQuantity(added, added[0].id, 98);
    const next = addCartItem(full, input);
    assert.strictEqual(next, full, 'Adding at the limit must report no state change');
    assert.equal(next[0].quantity, 99);
    assert.deepEqual(readCart(JSON.stringify(next)), next);
  }
});

test('legacy cart fonts migrate without losing quantities or line IDs', () => {
  const [line] = readCart(JSON.stringify([{
    id: 'old-font', quantity: 3, origin: { kind: 'preorder_custom' },
    config: { ...initialConfig, font: 'serif' },
  }]));
  assert.equal(line.id, 'old-font');
  assert.equal(line.quantity, 3);
  assert.equal(line.config.font, 'simply-serif');
});
