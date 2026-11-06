'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import { useCart } from './CartState';
import { LAST_DICE_KEY, configFromParams, diceQuery, readSavedDice, diceShapes, fontNames, fontStyles, shellColors } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';
import { formatPrice, priceForConfig } from '@/lib/pricing';

export default function Configurator() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const config = configFromParams(params);
  useEffect(() => {
    try {
      if (!query) {
        const saved = readSavedDice(localStorage.getItem(LAST_DICE_KEY));
        if (saved) window.history.replaceState(null, '', `?${diceQuery(saved)}`);
      } else {
        localStorage.setItem(LAST_DICE_KEY, diceQuery(configFromParams(new URLSearchParams(query))));
      }
    } catch { /* Storage may be unavailable; default and URL links still work. */ }
  }, [query]);
  const { add } = useCart();
  const change = <K extends keyof DiceConfig>(key: K, value: DiceConfig[K]) => {
    const next = new URLSearchParams(window.location.search);
    next.set(key, value);
    window.history.replaceState(null, '', `?${next}`);
  };
  const addCustom = () => { if (add(config, { kind: 'preorder_custom' })) router.push(themeHref(pathname, '/cart')); };

  return <section className="wrapper section page-section">
    <div className="page-heading"><h1 className="page-title">Собери сам</h1></div>
    <div className="configure-layout sidebar">
      <div className="configure-preview"><DiceViewer config={config} /></div>
      <div className="configure-controls stack">
        <div className="field stack"><h2>Количество граней</h2><div className="pill-list cluster">{diceShapes.map(shape => <button key={shape} type="button" aria-pressed={config.shape === shape} className={config.shape === shape ? 'is-active' : ''} onClick={() => change('shape', shape)}>{shape.toUpperCase()}</button>)}</div></div>
        <div className="field stack"><h2>Цвет</h2><div className="pill-list cluster">{shellColors.map(color => <button key={color.value} type="button" aria-pressed={config.shell === color.value} className={config.shell === color.value ? 'is-active' : ''} onClick={() => change('shell', color.value)}><span className="swatch" style={{ background: color.value }}/> {color.name}</button>)}</div></div>
        <div className="field stack"><h2>Шрифт</h2><div className="pill-list cluster">{fontStyles.map(font => <button key={font} type="button" aria-pressed={config.font === font} className={config.font === font ? 'is-active' : ''} onClick={() => change('font', font)}>{fontNames[font]}</button>)}</div></div>
        <div className="production-note stack">
          <h2>Кубики на заказ</h2>
          <p>Изготовление начинается после согласования формы, цвета и шрифта.</p>
          <p>Способ получения и дату согласуют перед оформлением заказа.</p>
          <Link href={themeHref(pathname, '/production')}>Изготовление и доставка</Link>
        </div>
        <p className="configure-price">{formatPrice(priceForConfig(config))}</p>
        <button type="button" className="button button-black button-fill" onClick={addCustom}><span>В корзину</span><ShoppingBag className="icon" aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}
