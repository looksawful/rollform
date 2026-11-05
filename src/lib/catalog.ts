export const diceShapes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd%'] as const;
export type DiceShape = (typeof diceShapes)[number];
export const fontStyles = ['grotesk', 'mono', 'serif'] as const;
export type FontStyle = (typeof fontStyles)[number];

/** Values describe the on-screen prototype, not confirmed manufacturing options. */
export type DiceConfig = {
  shape: DiceShape;
  shell: '#000000' | '#196641' | '#A62D35' | '#215BA8';
  font: FontStyle;
};

export type Fulfillment = { kind: 'preorder' } | { kind: 'in_stock'; available: number };
export type Preset = { id: string; title: string; config: DiceConfig; fulfillment: Fulfillment };

export const initialConfig: DiceConfig = {
  shape: 'd20', shell: '#000000', font: 'grotesk',
};

export const shellColors: { name: string; value: DiceConfig['shell'] }[] = [
  { name: 'Цвет 1', value: '#000000' },
  { name: 'Цвет 2', value: '#196641' },
  { name: 'Цвет 3', value: '#A62D35' },
  { name: 'Цвет 4', value: '#215BA8' },
];

export const fontNames: Record<FontStyle, string> = {
  grotesk: 'Шрифт 1', mono: 'Шрифт 2', serif: 'Шрифт 3',
};

export function configFromParams(params: Pick<URLSearchParams, 'get'>): DiceConfig {
  const base = presets.find(item => item.id === params.get('preset'))?.config ?? initialConfig;
  const shape = params.get('shape');
  const shell = params.get('shell');
  const font = params.get('font');
  return {
    shape: diceShapes.find(x => x === shape) ?? base.shape,
    shell: shellColors.find(x => x.value === shell)?.value ?? base.shell,
    font: fontStyles.find(x => x === font) ?? base.font,
  };
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
