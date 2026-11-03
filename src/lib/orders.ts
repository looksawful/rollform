import { diceShapes, shellColors } from './catalog.ts';
import type { DiceConfig, FontStyle } from './catalog.ts';

export type CartOrigin =
  | { kind: 'in_stock'; presetId: string }
  | { kind: 'preorder_preset'; presetId: string }
  | { kind: 'preorder_custom' };

export type CartItem = { id: string; origin: CartOrigin; config: DiceConfig; quantity: number };
export const CART_KEY = 'rollform:demo-cart:v2';

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
  if (existing) return items.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
  return [...items, { id: crypto.randomUUID(), origin: input.origin, config: { ...input.config }, quantity: 1 }];
}

export function changeQuantity(items: CartItem[], id: string, delta: number) {
  if (!Number.isInteger(delta)) return items;
  return items.map(item => item.id === id ? { ...item, quantity: Math.max(0, Math.min(99, item.quantity + delta)) } : item)
    .filter(item => item.quantity > 0);
}

function validConfig(value: unknown): value is DiceConfig {
  if (!value || typeof value !== 'object') return false;
  const x = value as Partial<DiceConfig>;
  return diceShapes.includes(x.shape as DiceConfig['shape']) &&
    shellColors.some(c => c.value === x.shell) &&
    ['grotesk', 'mono', 'serif'].includes(x.font as FontStyle);
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
    return parsed.filter((v): v is CartItem => !!v && typeof v === 'object' &&
      typeof v.id === 'string' && v.id.length > 0 && validOrigin(v.origin) && validConfig(v.config) &&
      Number.isInteger(v.quantity) && v.quantity > 0 && v.quantity <= 99);
  } catch { return []; }
}

export function makeOrderText(items: CartItem[]) {
  const name = (origin: CartOrigin) => origin.kind === 'in_stock' ? 'Готовый товар'
    : origin.kind === 'preorder_preset' ? 'Предзаказ варианта' : 'Свой вариант';
  return [
    'ROLLFORM / ЧЕРНОВИК ЗАЯВКИ',
    'Прототип: заявка не отправлена.',
    '',
    ...items.map((item, i) => `${i + 1}. ${name(item.origin)}${'presetId' in item.origin ? ` (${item.origin.presetId})` : ''}\n${item.config.shape.toUpperCase()} · ${shellColors.find(c => c.value === item.config.shell)?.name} · ${item.config.font}\nКоличество: ${item.quantity}`),
    '',
    `Всего: ${items.reduce((total, item) => total + item.quantity, 0)}`,
    'Цена и сроки не указаны.',
  ].join('\n');
}
