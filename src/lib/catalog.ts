export const diceShapes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd%'] as const;
export type DiceShape = (typeof diceShapes)[number];
export const fontNames = {
  'nova-flat': 'Nova Flat',
  avqest: 'AvQest',
  'renata-cat': 'Renata CAT',
  dihjau: 'Dihjau Regular',
  'chrysanthemum-bold': 'Chrysanthemum Bold',
  'dystopian-canticle': 'Dystopian Canticle Regular',
  'simply-serif': 'Simply Serif',
  'square-antiqua': 'Square Antiqua',
  'simply-mono': 'Simply Mono',
} as const;
export type FontStyle = keyof typeof fontNames;
export const fontStyles = Object.keys(fontNames) as FontStyle[];

const legacyFonts: Partial<Record<string, FontStyle>> = {
  grotesk: 'nova-flat', mono: 'simply-mono', serif: 'simply-serif',
};

export function resolveFont(value: unknown): FontStyle | undefined {
  if (typeof value !== 'string') return;
  if (Object.hasOwn(fontNames, value)) return value as FontStyle;
  if (Object.hasOwn(legacyFonts, value)) return legacyFonts[value];
}

/** Values describe the on-screen prototype, not confirmed manufacturing options. */
export type DiceConfig = {
  shape: DiceShape;
  shell: '#000000' | '#196641' | '#A62D35' | '#215BA8';
  font: FontStyle;
};

export type Fulfillment = { kind: 'preorder' } | { kind: 'in_stock'; available: number };
export type Preset = { id: string; title: string; config: DiceConfig; fulfillment: Fulfillment };

export const initialConfig: DiceConfig = {
  shape: 'd20', shell: '#000000', font: 'nova-flat',
};

export const shellColors: { name: string; value: DiceConfig['shell'] }[] = [
  { name: 'Чёрный', value: '#000000' },
  { name: 'Зелёный', value: '#196641' },
  { name: 'Красный', value: '#A62D35' },
  { name: 'Синий', value: '#215BA8' },
];

export function configFromParams(params: Pick<URLSearchParams, 'get'>): DiceConfig {
  const base = presets.find(item => item.id === params.get('preset'))?.config ?? initialConfig;
  const shape = params.get('shape');
  const shell = params.get('shell');
  const font = params.get('font');
  return {
    shape: diceShapes.find(x => x === shape) ?? base.shape,
    shell: shellColors.find(x => x.value === shell)?.value ?? base.shell,
    font: resolveFont(font) ?? base.font,
  };
}

export const LAST_DICE_KEY = 'rollform:last-config:v1';

export function diceQuery(config: DiceConfig): string {
  return new URLSearchParams({
    shape: config.shape, shell: config.shell, font: config.font,
  }).toString();
}

export function readSavedDice(raw: string | null): DiceConfig | null {
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const font = resolveFont(params.get('font'));
  if (!font) return null;
  params.set('font', font);
  const config = configFromParams(params);
  return diceQuery(config) === params.toString() ? config : null;
}

function pickDiceConfig(
  shapes: readonly DiceShape[],
  random: () => number,
  previousShell?: DiceConfig['shell'],
): DiceConfig {
  const pick = <T,>(values: readonly T[]): T => values[Math.floor(random() * values.length)];
  return {
    shape: pick(shapes),
    shell: pick(previousShell ? shellColors.filter(color => color.value !== previousShell) : shellColors).value,
    font: pick(fontStyles),
  };
}

export function randomDiceConfig(random = Math.random, previousShell?: DiceConfig['shell']): DiceConfig {
  return pickDiceConfig(diceShapes, random, previousShell);
}

export function randomHeroDiceConfig(random = Math.random): DiceConfig {
  return pickDiceConfig(['d12', 'd20'], random);
}

// Placeholder presets only. No confirmed stock, price, lead time or production claims.
const shapes: DiceShape[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd%', 'd20', 'd6'];
export const presets: Preset[] = shapes.map((shape, index) => ({
  id: `demo-${index + 1}`,
  title: `Вариант ${String(index + 1).padStart(2, '0')}`,
  config: {
    ...initialConfig,
    shape,
    shell: shellColors[index % shellColors.length].value,
    font: fontStyles[index % fontStyles.length],
  },
  fulfillment: { kind: 'preorder' },
}));
