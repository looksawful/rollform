'use client';

import Link from 'next/link';
import DiceViewer from './DiceViewer';
import ProductCard from './ProductCard';
import { initialConfig, presets } from '@/lib/catalog';

export default function Storefront() {
  return <>
    <section className="wrapper hero split" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} interactive /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Текст</p>
        <Link className="button button-black" href="/configure">Кнопка</Link>
      </div>
    </section>
    <section className="wrapper section stack" id="catalog">
      <h2 className="section-title">Заголовок</h2>
      <div className="product-scroller" role="region" aria-label="Товары" tabIndex={0}>{presets.map(p => <ProductCard key={p.id} product={p} />)}</div>
      <Link className="button button-black section-button" href="/catalog">Кнопка</Link>
    </section>
    <section className="wrapper section stack" id="about">
      <h2 className="section-title">О проекте</h2>
      <p>Внимание, этот текст является рыбой.</p>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <p>Текст</p>
      <Link className="button button-black section-button" href="/contacts">Кнопка</Link>
    </section>
  </>;
}
