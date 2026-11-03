import test from 'node:test';
import assert from 'node:assert/strict';
import { diceShapes, initialConfig, presets } from '../src/lib/catalog.ts';
import { addCartItem, changeQuantity, makeOrderText, readCart } from '../src/lib/orders.ts';

test('prototype product configuration contains only the three selectable parameters', () => {
  assert.deepEqual(Object.keys(initialConfig), ['shape', 'shell', 'font']);
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

test('quantity updates and draft order do not imply payment or delivery', () => {
  const saved = addCartItem([], { origin: { kind: 'preorder_custom' }, config: initialConfig });
  assert.equal(changeQuantity(saved, saved[0].id, -1).length, 0);
  assert.equal(changeQuantity(saved, saved[0].id, +1)[0].quantity, 2);
  const text = makeOrderText(saved);
  assert.match(text, /Свой вариант/);
  assert.doesNotMatch(text, /Оплачено|Заказ получен|₽/);
});
