import { diceShapes, fontNames, fontStyles, shellColors } from '@/lib/catalog';

// Карточки сохраняют текущую сетку; изображения добавим отдельным проходом.
const cards = [
  { title: 'Выбирайте любую форму', text: `Мы выпускаем кубики в форм-факторах ${diceShapes.map(shape => shape.toUpperCase()).join(', ')}.` },
  { title: `Выбирайте из ${shellColors.length} цветов`, text: `Доступные цвета: ${shellColors.map(color => color.name.toLowerCase()).join(', ')}.` },
  { title: 'Выбирайте шрифт', text: `Мы предлагаем на выбор шрифты: ${fontStyles.map(font => fontNames[font]).join(', ')}.` },
  { title: 'Качественные материалы', text: 'Тщательно подбираем материалы и уделяем внимание каждой детали: от чёткости граней до аккуратной финишной обработки.' },
  { title: 'Доставка по Москве и регионам', text: 'Заказы в наличии доставляем в течение 3 дней, кубики под заказ — до 5 дней. Самовывоз бесплатный.' },
];

export default function BentoSection() {
  return <section className="wrapper section bento-section" aria-labelledby="benefits-title">
    <h2 id="benefits-title" className="section-title">О кубиках</h2>
    <div className="bento-viewport scroller" role="region" aria-label="О кубиках" tabIndex={0}>
      <div className="bento-grid">
        {cards.map(({ title, text }, index) =>
          <article className="bento-card box" key={index}>
            <h3>{title}</h3><p>{text}</p>
          </article>
        )}
      </div>
    </div>
  </section>;
}
