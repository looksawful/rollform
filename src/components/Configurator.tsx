'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs, { catalogCrumb } from './Breadcrumbs';
import DiceViewer from './DiceViewer';
import { useCart } from './CartState';
import { LAST_DICE_KEY, configFromParams, diceQuery, randomDiceConfig, readSavedDice, diceShapes, fontNames, fontStyles, presets, shellColors } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';
import { formatPrice, priceForConfig } from '@/lib/pricing';

export default function Configurator() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const config = configFromParams(params);
  const preset = presets.find(item => item.id === params.get('preset'));
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview')) {
        url.searchParams.delete('preview');
        window.history.replaceState(null, '', url);
        return;
      }
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
  const stepFont = (direction: -1 | 1) => {
    const { font } = configFromParams(new URLSearchParams(window.location.search));
    const index = fontStyles.indexOf(font);
    change('font', fontStyles[(index + direction + fontStyles.length) % fontStyles.length]);
  };
  const createRandomDice = () => {
    const next = new URLSearchParams(diceQuery(randomDiceConfig(Math.random, config.shell)));
    if (preset) next.set('preset', preset.id);
    router.replace(`/configure?${next}`);
  };
  const addCustom = () => { if (add(config, { kind: 'preorder_custom' })) router.push('/cart'); };

  const price = formatPrice(priceForConfig(config));
  const summary = `${config.shape.toUpperCase()} · ${shellColors.find(color => color.value === config.shell)?.name ?? ""}`;

  return <section className="wrapper section page-section configure-page">
    <Breadcrumbs current="Собери сам" ancestors={preset ? [catalogCrumb, {
      href: `/product?item=${preset.id}`, label: preset.title,
    }] : undefined} />
    <div className="page-heading"><h1 className="page-title">Собери сам</h1></div>
    <div className="configure-layout sidebar">
      <div className="configure-stage stack">
        <div className="configure-preview"><DiceViewer config={config} animateConfig /></div>
        <button type="button" className="button button-secondary random-dice-button" onClick={createRandomDice}>
          <span>Создать случайный кубик</span><Box className="icon" aria-hidden="true" />
        </button>
      </div>
      <div className="configure-controls stack">
        <div className="field stack">
          <h2 id="dice-shape">Количество граней</h2>
          <div className="option-list shape-options" role="group" aria-labelledby="dice-shape">
            {diceShapes.map(shape => (
              <button key={shape} type="button" aria-pressed={config.shape === shape} onClick={() => change('shape', shape)}>
                <img className="shape-thumbnail" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/shape-thumbnails/${shape === 'd%' ? 'd00' : shape}.svg`} alt="" width={48} height={48} />
                <span>{shape.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field stack">
          <h2 id="dice-color">Цвет</h2>
          <div className="option-list color-options" role="group" aria-labelledby="dice-color">
            {shellColors.map(color => (
              <button key={color.value} type="button" aria-pressed={config.shell === color.value} onClick={() => change('shell', color.value)}>
                <span className="swatch" style={{ background: color.value }} />
                {color.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field stack">
          <h2 id="dice-font">Шрифт</h2>
          <div className="font-picker" role="group" aria-labelledby="dice-font">
            <button type="button" aria-label="Предыдущий шрифт" onClick={() => stepFont(-1)}>
              <ChevronLeft className="icon" aria-hidden="true" />
            </button>
            <img className="numeral-sample" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/numerals/${config.font}-sample.webp`} alt="" width={400} height={76} />
            <button type="button" aria-label="Следующий шрифт" onClick={() => stepFont(1)}>
              <ChevronRight className="icon" aria-hidden="true" />
            </button>
            <span className="visually-hidden" role="status">{fontNames[config.font]}</span>
          </div>
        </div>
        <p className="configure-price">{price}</p>
        <button type="button" className="button button-black button-fill" onClick={addCustom}><span>В корзину</span><ShoppingBag className="icon" aria-hidden="true" /></button>
        <div className="production-note stack">
          <h2>Кубики на заказ</h2>
          <p>Изготовление начинается после согласования формы, цвета и шрифта.</p>
          <p>Доставка кубиков под заказ по Москве и регионам — до 5 дней. Самовывоз бесплатный.</p>
          <Link href={'/production'}>Изготовление и доставка</Link>
        </div>
      </div>
    </div>
    <div className="configure-mobile-buy" aria-label="Выбранный кубик и добавление в корзину">
      <img className="configure-buy-thumbnail" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/shape-thumbnails/${config.shape === 'd%' ? 'd00' : config.shape}.svg`} alt="" width={44} height={44} />
      <div className="configure-mobile-buy-copy">
        <span className="configure-mobile-buy-summary" title={summary}>{summary}</span>
        <strong className="configure-mobile-buy-price">{price}</strong>
      </div>
      <button type="button" className="button button-black" onClick={addCustom}><span>В корзину</span><ShoppingBag className="icon" aria-hidden="true" /></button>
    </div>
  </section>;
}
