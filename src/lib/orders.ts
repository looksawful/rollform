import { diceShapes, resolveFont, shellColors } from './catalog.ts';
import type { DiceConfig } from './catalog.ts';

export type CartOrigin =
  | { kind: 'in_stock'; presetId: string }
  | { kind: 'preorder_preset'; presetId: string }
  | { kind: 'preorder_custom' };

export type CartItem = { id: string; origin: CartOrigin; config: DiceConfig; quantity: number };
export const CART_KEY = 'rollform:demo-cart:v3';

export function sameConfig(a: DiceConfig, b: DiceConfig) {
  return a.shape === b.shape && a.shell === b.shell && a.font === b.font;
}

function sameOrigin(a: CartOrigin, b: CartOrigin) {
  return a.kind === b.kind && ('presetId' in a ? a.presetId : null) === ('presetId' in b ? b.presetId : null);
}

type AddInput = { config: DiceConfig; origin: CartOrigin; available?: number };
export function addCartItem(items: CartItem[], input: AddInput): CartItem[] {
  const existing = items.find(item => sameOrigin(item.origin, input.origin) && sameConfig(item.config, input.config));
  if (input.origin.kind === 'in_stock') {
    if (!Number.isInteger(input.available) || (input.available ?? 0) <= 0) throw Error('Наличие не подтверждено');
    if ((existing?.quantity ?? 0) >= input.available!) throw Error('Количество превышает остаток');
  }
  if (existing?.quantity === 99) return items;
  if (existing) return items.map(item => item.id === existing.id ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item);
  return [...items, { id: crypto.randomUUID(), origin: input.origin, config: { ...input.config }, quantity: 1 }];
}

export function changeQuantity(items: CartItem[], id: string, delta: number) {
  if (!Number.isInteger(delta)) return items;
  return items.flatMap(item => item.id !== id ? [item]
    : item.quantity + delta <= 0 ? []
    : [{ ...item, quantity: Math.min(99, item.quantity + delta) }]);
}

function readConfig(value: unknown): DiceConfig | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const shape = diceShapes.find(shape => shape === raw.shape);
  const shell = shellColors.find(color => color.value === raw.shell)?.value;
  const font = resolveFont(raw.font);
  return shape && shell && font ? { shape, shell, font } : null;
}

function validOrigin(value: unknown): value is CartOrigin {
  if (!value || typeof value !== 'object') return false;
  const x = value as Partial<CartOrigin>;
  return x.kind === 'preorder_custom' ||
    ((x.kind === 'preorder_preset' || x.kind === 'in_stock') && typeof x.presetId === 'string' && x.presetId.length > 0);
}

export function readCart(raw: string | null): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap(value => {
      if (!value || typeof value !== 'object') return [];
      const { id, origin, quantity } = value;
      const config = readConfig(value.config);
      return typeof id === 'string' && id.length > 0 && validOrigin(origin) && config &&
        Number.isInteger(quantity) && quantity > 0 && quantity <= 99
        ? [{ id, origin, quantity, config }] : [];
    });
  } catch { return []; }
}
