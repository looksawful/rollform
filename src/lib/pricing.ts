import { diceShapes, presets } from './catalog';
import type { DiceConfig } from './catalog';
import type { CartItem } from './orders';

const presetPrices = [990, 1290, 1490, 1190, 1790, 1990, 1090, 2190, 1390];

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount) + ' ₽';

export function priceForPreset(id: string) {
  const index = presets.findIndex(preset => preset.id === id);
  return presetPrices[index] ?? 1490;
}

export function priceForConfig(config: DiceConfig) {
  return 990 + diceShapes.indexOf(config.shape) * 180;
}

export function priceForCartItem(item: CartItem) {
  return 'presetId' in item.origin
    ? priceForPreset(item.origin.presetId)
    : priceForConfig(item.config);
}
