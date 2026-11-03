'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import DiceViewer from './DiceViewer';
import HeroScroll from './HeroScroll';
import ProductCard from './ProductCard';
import { diceShapes, initialConfig, presets } from '@/lib/catalog';

export default function Storefront() {
  const heroRef = useRef<HTMLElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const scrollAngle = useRef(0);
  const [shapeIndex, setShapeIndex] = useState(5);
  const [spinning, setSpinning] = useState(true);
  const heroShape = diceShapes[shapeIndex];
  const heroConfig = { ...initialConfig, shape: heroShape };

  return <>
    <HeroScroll hero={heroRef} model={modelRef} scrollAngle={scrollAngle} />
    <section ref={heroRef} className="wrapper hero split" aria-labelledby="hero-title">
      <div className="hero-object" ref={modelRef}>
        <DiceViewer config={heroConfig} scrollAngleRef={scrollAngle} autoRotate={spinning} onSelect={() => setShapeIndex(i => (i + 1) % 7)} />
        <span className="object-label">3D / {heroShape.toUpperCase()}</span>
        <button className="object-pause" type="button" aria-pressed={!spinning} onClick={() => setSpinning(value => !value)}>{spinning ? 'Пауза' : 'Вращать'}</button>
        <button className="object-action" onClick={() => setShapeIndex(i => (i + 1) % 7)}>Следующая форма <span aria-hidden="true">↗</span></button>
      </div>
      <div className="hero-copy stack">
        <span className="kicker">ROLLFORM / ИГРАЛЬНЫЕ КОСТИ</span>
        <h1 id="hero-title">КУБИКИ.<br/>ПО-СВОЕМУ.</h1>
        <p>Варианты под заказ или свой кубик в конструкторе. Дизайн и параметры пока тестируются.</p>
        <div className="cluster hero-ctas"><Link className="button button-black" href="/configure">Собрать свой <span aria-hidden="true">↗</span></Link><Link className="button button-outline" href="/catalog">Каталог <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
    <section className="wrapper section" id="catalog" aria-labelledby="catalog-title">
      <div className="section-head cluster"><h2 id="catalog-title">Варианты</h2><Link href="/catalog">Весь каталог ↗</Link></div>
      <p className="section-intro">Демонстрационные варианты по предзаказу. Цены, сроки и наличие не указаны.</p>
      <div className="product-strip">{presets.map((product, i) => <ProductCard product={product} key={product.id} index={i} />)}</div>
    </section>
    <section className="wrapper section builder-invite split" aria-labelledby="build-title">
      <div className="stack"><span className="kicker">ДРУГОЙ ПУТЬ</span><h2 id="build-title">Собрать свой</h2><p>Форма, цвет и шрифт. Минимальный конструктор с живым 3D-превью.</p><Link href="/configure" className="button button-black">Открыть конструктор ↗</Link></div>
      <div className="builder-visual" aria-hidden="true"><span>D4</span><span>D6</span><span>D8</span><span>D10</span><span>D12</span><span>D20</span><span>D%</span></div>
    </section>
    <section className="wrapper about section split" id="about" aria-labelledby="about-title">
      <h2 id="about-title">О проекте</h2><div className="about-copy prose"><p className="about-lead">Прототип витрины кубиков.</p><p>Здесь будет информация о продукте, изготовлении и способе заказа. Сейчас сайт предназначен только для разработки и просмотра.</p></div>
    </section>
  </>;
}
