'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import { useCart } from './CartState';
import { configFromParams, diceShapes, fontNames, fontStyles, shellColors } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';

export default function Configurator() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const config = configFromParams(params);
  const { add } = useCart();
  const change = <K extends keyof DiceConfig>(key: K, value: DiceConfig[K]) => {
    const next = new URLSearchParams(window.location.search);
    next.set(key, value);
    window.history.replaceState(null, '', `?${next}`);
  };
  const addCustom = () => { if (add(config, { kind: 'preorder_custom' })) router.push(themeHref(pathname, '/cart')); };

  return <section className="wrapper section page-section">
    <div className="page-heading"><h1 className="page-title">Заголовок</h1></div>
    <div className="configure-layout sidebar">
      <div className="configure-preview"><DiceViewer config={config} interactive /></div>
      <div className="configure-controls stack">
        <div className="field stack"><h2>Форма</h2><div className="pill-list cluster">{diceShapes.map(shape => <button key={shape} type="button" aria-pressed={config.shape === shape} className={config.shape === shape ? 'is-active' : ''} onClick={() => change('shape', shape)}>{shape.toUpperCase()}</button>)}</div></div>
        <div className="field stack"><h2>Цвет</h2><div className="pill-list cluster">{shellColors.map(color => <button key={color.value} type="button" aria-pressed={config.shell === color.value} className={config.shell === color.value ? 'is-active' : ''} onClick={() => change('shell', color.value)}><span className="swatch" style={{ background: color.value }}/> {color.name}</button>)}</div></div>
        <div className="field stack"><h2>Шрифт</h2><div className="pill-list cluster">{fontStyles.map(font => <button key={font} type="button" aria-pressed={config.font === font} className={config.font === font ? 'is-active' : ''} onClick={() => change('font', font)}>{fontNames[font]}</button>)}</div></div>
        <button type="button" className="button button-black button-fill" onClick={addCustom}>В корзину</button>
      </div>
    </div>
  </section>;
}
