'use client';

import Link from 'next/link';
import DiceViewer from './DiceViewer';
import { initialConfig } from '@/lib/catalog';

export default function Storefront() {
  return <section className="wrapper hero split" aria-labelledby="hero-title">
    <div className="hero-object"><DiceViewer config={initialConfig} interactive /></div>
    <div className="hero-copy stack">
      <h1 id="hero-title">Заголовок</h1>
      <p>Текст</p>
      <Link className="button button-black" href="/configure">Собрать кубик</Link>
    </div>
  </section>;
}
