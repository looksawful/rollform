'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box } from 'lucide-react';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import ProductGallery from './ProductGallery';
import ProductionInfo from './ProductionInfo';
import ContactContent from './ContactContent';
import BentoSection from './BentoSection';
import { diceQuery, initialConfig, randomDiceConfig } from '@/lib/catalog';

export default function Storefront() {
  const pathname = usePathname();
  const router = useRouter();
  const createRandomDice = () => router.push(`${themeHref(pathname, '/configure')}?${diceQuery(randomDiceConfig())}`);
  return <>
    <section className="wrapper hero hero-centered" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} continuous /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Здесь появится рассказ о кубиках и возможностях конструктора. Пока этот текст помогает оценить длину строк, отступы и композицию первого экрана рядом с 3D-моделью. Окончательное описание добавим после согласования содержания.</p>
        <button type="button" className="button button-black" onClick={createRandomDice}><span>Создать случайный кубик</span><Box className="icon" aria-hidden="true" /></button>
      </div>
    </section>
    <section className="section stack catalog-section" id="catalog">
      <div className="wrapper catalog-heading prose">
        <h2 className="section-title">В наличии</h2>
        <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
      </div>
      <ProductGallery mode="reel" />
      <div className="wrapper catalog-footer">
        <Link className="catalog-link" href={themeHref(pathname, '/catalog')}>Весь каталог <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
    <ProductionInfo onHome />
    <BentoSection />
    <section className="wrapper section about-section" id="about">
      <figure className="about-panorama editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-02.webp`}
          alt="Игральные кубики, панорамное изображение"
          width={1600} height={640} loading="lazy" decoding="async" />
      </figure>
      <div className="editorial-copy prose">
        <h2 className="section-title">О нас</h2>
        <p>В этом разделе будет история проекта: как появилась идея и что определяет характер коллекции. Пока мы используем временный текст, чтобы проверить ритм длинного абзаца и сочетание с фотографиями. После утверждения содержания он будет заменён полноценным описанием.</p>
      </div>
    </section>
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
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <ContactContent />
    </section>
  </>;
}
