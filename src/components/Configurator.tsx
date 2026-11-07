'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import DiceViewer from './DiceViewer';
import type { DicePreview } from './DiceViewer';
import { useCart } from './CartState';
import { LAST_DICE_KEY, configFromParams, diceQuery, randomDiceConfig, readSavedDice, diceShapes, fontNames, fontStyles, shellColors } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';
import { formatPrice, priceForConfig } from '@/lib/pricing';

const previews = [
  { id: 'classic', label: 'Классика' },
  { id: 'epoxy', label: 'Эпоксидка' },
  { id: 'resin', label: 'Resin' },
] as const satisfies readonly { id: DicePreview; label: string }[];

export default function Configurator() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const config = configFromParams(params);
  const preview = previews.find(({ id }) => id === params.get('preview'))?.id ?? 'classic';
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
  const changePreview = (value: DicePreview) => {
    const url = new URL(window.location.href);
    if (value === 'classic') url.searchParams.delete('preview');
    else url.searchParams.set('preview', value);
    window.history.replaceState(null, '', url);
  };
  const createRandomDice = () => {
    const next = new URLSearchParams(diceQuery(randomDiceConfig(Math.random, config.shell)));
    if (preview !== 'classic') next.set('preview', preview);
    router.replace(`/configure?${next}`);
  };
  const addCustom = () => { if (add(config, { kind: 'preorder_custom' })) router.push('/cart'); };

  return <section className="wrapper section page-section">
    <div className="page-heading"><h1 className="page-title">Собери сам</h1></div>
    <div className="configure-layout sidebar">
      <div className="configure-preview"><DiceViewer config={config} preview={preview} /></div>
      <div className="configure-controls stack">
        <button type="button" className="button button-secondary random-dice-button" onClick={createRandomDice}>
          <span>Создать случайный кубик</span><Box className="icon" aria-hidden="true" />
        </button>
        <div className="field stack"><h2 id="preview-heading">3D-превью</h2><div className="pill-list cluster" role="group" aria-labelledby="preview-heading">{previews.map(({ id, label }) => <button key={id} type="button" aria-pressed={preview === id} className={preview === id ? 'is-active' : ''} onClick={() => changePreview(id)}>{label}</button>)}</div></div>
        <div className="field stack"><h2>Количество граней</h2><div className="pill-list cluster">{diceShapes.map(shape => <button key={shape} type="button" aria-pressed={config.shape === shape} className={config.shape === shape ? 'is-active' : ''} onClick={() => change('shape', shape)}>{shape.toUpperCase()}</button>)}</div></div>
        <div className="field stack"><h2>Цвет</h2><div className="pill-list cluster">{shellColors.map(color => <button key={color.value} type="button" aria-pressed={config.shell === color.value} className={config.shell === color.value ? 'is-active' : ''} onClick={() => change('shell', color.value)}><span className="swatch" style={{ background: color.value }}/> {color.name}</button>)}</div></div>
        {preview === 'classic' ? <div className="field stack"><h2>Шрифт</h2><div className="pill-list cluster">{fontStyles.map(font => <button key={font} type="button" aria-pressed={config.font === font} className={config.font === font ? 'is-active' : ''} onClick={() => change('font', font)}>{fontNames[font]}</button>)}</div></div> :
          <p>Гравировка встроена в модель. Шрифт заказа можно выбрать в «Классике».</p>}
        <div className="production-note stack">
          <h2>Кубики на заказ</h2>
          <p>Изготовление начинается после согласования формы, цвета и шрифта.</p>
          <p>Доставка кубиков под заказ по Москве и регионам — до 5 дней. Самовывоз бесплатный.</p>
          <Link href={'/production'}>Изготовление и доставка</Link>
        </div>
        <p className="configure-price">{formatPrice(priceForConfig(config))}</p>
        <button type="button" className="button button-black button-fill" onClick={addCustom}><span>В корзину</span><ShoppingBag className="icon" aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}
