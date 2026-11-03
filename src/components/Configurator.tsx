'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DiceViewer from './DiceViewer';
import { useCart } from './CartState';
import { diceShapes, fontNames, initialConfig, shellColors } from '@/lib/catalog';
import type { DiceConfig, DiceShape, FontStyle } from '@/lib/catalog';

const fonts: FontStyle[] = ['grotesk', 'mono', 'serif'];

export default function Configurator() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get('shape');
  const initialShape: DiceShape = diceShapes.find(shape => shape === requested) ?? initialConfig.shape;
  const [config, setConfig] = useState<DiceConfig>({ ...initialConfig, shape: initialShape });
  const { add } = useCart();
  const change = <K extends keyof DiceConfig>(key: K, value: DiceConfig[K]) => setConfig(prev => ({ ...prev, [key]: value }));
  const addCustom = () => { if (add(config, { kind: 'preorder_custom' })) router.push('/cart'); };

  return <section className="wrapper section page-section">
    <div className="stack page-heading"><span className="kicker">КОНСТРУКТОР / ДЕМО</span><h1 className="page-title">Свой кубик</h1><p className="page-intro">Выберите форму, цвет и начертание. Превью иллюстративное, не производственная спецификация.</p></div>
    <div className="configure-layout">
      <div className="configure-preview"><DiceViewer config={config} interactive /><div className="preview-label cluster"><span>3D / {config.shape.toUpperCase()}</span><span>Перетащите / стрелки</span></div></div>
      <div className="configure-controls stack">
        <div className="field stack"><h2>Форма</h2><div className="pill-list">{diceShapes.map(shape => <button key={shape} type="button" aria-pressed={config.shape === shape} className={config.shape === shape ? 'is-active' : ''} onClick={() => change('shape', shape)}>{shape.toUpperCase()}</button>)}</div></div>
        <div className="field stack"><h2>Цвет</h2><div className="pill-list">{shellColors.map(color => <button key={color.value} type="button" aria-pressed={config.shell === color.value} className={config.shell === color.value ? 'is-active' : ''} onClick={() => change('shell', color.value)}><span className="swatch" style={{ background: color.value }}/> {color.name}</button>)}</div></div>
        <div className="field stack"><h2>Шрифт</h2><div className="pill-list">{fonts.map(font => <button key={font} type="button" aria-pressed={config.font === font} className={config.font === font ? 'is-active' : ''} onClick={() => change('font', font)}>{fontNames[font]}</button>)}</div></div>
        <p className="panel-note">Параметры экспериментальные. Заказ здесь не отправляется.</p>
        <button type="button" className="button button-black button-fill" onClick={addCustom}>В корзину <span aria-hidden="true">↗</span></button>
      </div>
    </div>
  </section>;
}
