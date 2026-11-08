'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from 'lucide-react';
import DiceViewer from './DiceViewer';
import ProductGallery from './ProductGallery';
import ProductionInfo from './ProductionInfo';
import ContactContent from './ContactContent';
import BentoSection from './BentoSection';
import DeliveryInfo from './DeliveryInfo';
import ScrollProgress from './ScrollProgress';
import { diceQuery, randomDiceConfig, randomHeroDiceConfig } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';

export default function Storefront() {
  const router = useRouter();
  const [heroConfig, setHeroConfig] = useState<DiceConfig | null>(null);
  useEffect(() => { setHeroConfig(randomHeroDiceConfig()); }, []);
  const createRandomDice = () => router.push(`/configure?${diceQuery(randomDiceConfig())}`);
  return <>
    <section className="wrapper hero hero-centered" aria-labelledby="hero-title">
      <div className="hero-object">{heroConfig && <DiceViewer config={heroConfig} continuous />}</div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Здесь появится рассказ о кубиках и возможностях конструктора. Пока этот текст помогает оценить длину строк, отступы и композицию первого экрана рядом с 3D-моделью. Окончательное описание добавим после согласования содержания.</p>
        <button type="button" className="button button-black" onClick={createRandomDice}><span>Создать случайный кубик</span><Box className="icon" aria-hidden="true" /></button>
      </div>
    </section>
    <BentoSection />
    <section className="section stack catalog-section" id="catalog">
      <div className="wrapper catalog-heading prose">
        <h2 className="section-title">В наличии</h2>
        <p>Готовые варианты доставляем по Москве и регионам в течение 3 дней. Самовывоз бесплатный.</p>
      </div>
      <ProductGallery mode="reel" />
      <div className="wrapper catalog-footer">
        <Link className="catalog-link" href="/catalog">Весь каталог <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
    <ProductionInfo onHome />
    <DeliveryInfo />
    <section className="wrapper section stack" id="faq">
      <h2 className="section-title">Частые вопросы</h2>
      <div className="faq-list">
        {[
          'Как выбрать кубик?',
          'Какие формы доступны?',
          'Можно изменить цвет?',
          'Что с материалами?',
          'Можно заказать свой вариант?',
          'Как узнать стоимость?',
          'Когда будет готов заказ?',
          'Как получить кубики?',
          'Как связаться с вами?',
        ].map(question => <details key={question}>
          <summary>{question}</summary>
          <p>Подробная информация по этому вопросу появится после согласования содержания. Этот временный абзац помогает проверить читаемость текста и поведение раскрывающегося блока на разных экранах. Окончательные условия и формулировки добавим перед выпуском сайта.</p>
        </details>)}
      </div>
    </section>
    <section className="wrapper section about-section" id="about">
      <figure className="about-panorama editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/casting-vacuum-chamber.jpg`}
          alt="Вакуумная камера с манометром для удаления пузырьков из смолы"
          width={1065} height={1181} loading="lazy" decoding="async" />
        <figcaption>
          Иллюстрация оборудования: <a href="https://commons.wikimedia.org/wiki/File:Studio_vacuum_chamber.jpg" target="_blank" rel="noopener noreferrer">Emccorm / Wikimedia Commons</a>,
          {' '}<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a> (кадрировано).
        </figcaption>
      </figure>
      <div className="editorial-copy prose">
        <h2 className="section-title">О нас</h2>
        <p>В этом разделе будет история проекта: как появилась идея и что определяет характер коллекции. Пока мы используем временный текст, чтобы проверить ритм длинного абзаца и сочетание с фотографиями. После утверждения содержания он будет заменён полноценным описанием.</p>
      </div>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <ContactContent />
    </section>
    <ScrollProgress />
  </>;
}
