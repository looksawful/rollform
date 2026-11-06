'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Send, Clock, Truck } from 'lucide-react';
import { themeHref } from '@/lib/themeRoutes';

export default function ProductionInfo({ onHome = false }: { onHome?: boolean }) {
  const pathname = usePathname();
  const href = (path: string) => themeHref(pathname, path);
  return <section id={onHome ? 'production' : undefined}
    className={`wrapper section order-process stack${onHome ? '' : ' page-section'}`}>
    <div className="production-intro prose">
      {onHome ? <h2 className="section-title">Как оформить заказ</h2> : <h1 className="page-title">Как оформить заказ</h1>}
      <p>Выберите готовый кубик или соберите свой вариант. Затем согласуйте детали, готовность и удобный способ получения через контактную форму.</p>
    </div>
    <ol className="order-steps" aria-label="Шаги оформления заказа">
      <li className="order-step stack">
        <span className="step-number" aria-hidden="true">1</span>
        <Box className="icon" aria-hidden="true" />
        <div className="prose"><h3>Выберите кубик</h3>
          <p>Найдите вариант в <Link href={href('/catalog')}>каталоге</Link> или <Link href={href('/configure')}>создайте свой</Link> в конструкторе.</p></div>
      </li>
      <li className="order-step stack">
        <span className="step-number" aria-hidden="true">2</span>
        <Send className="icon" aria-hidden="true" />
        <div className="prose"><h3>Оформите заказ</h3>
          <p>Укажите выбранный вариант и способ связи в <Link href={href('/contacts#contact-form')}>контактной форме</Link>. Пока форма демонстрационная и не отправляет заявки.</p></div>
      </li>
      <li className="order-step stack">
        <span className="step-number" aria-hidden="true">3</span>
        <Clock className="icon" aria-hidden="true" />
        <div className="prose"><h3>Дождитесь готовности</h3>
          <p>Детали изготовления и дату готовности необходимо согласовать с командой перед подтверждением заказа.</p></div>
      </li>
      <li className="order-step stack">
        <span className="step-number" aria-hidden="true">4</span>
        <Truck className="icon" aria-hidden="true" />
        <div className="prose"><h3>Заберите заказ</h3>
          <p>Выберите самовывоз или доставку. <Link href={href('/contacts#delivery')}>Адрес и условия получения</Link> уточняются при согласовании.</p></div>
      </li>
    </ol>
  </section>;
}
