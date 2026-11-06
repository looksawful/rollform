/* Видимый макет: окончательные тексты добавим после согласования. */
const cards = [
  { title: 'Форма', text: 'Текст' },
  { title: 'Цвет', text: 'Текст' },
  { title: 'Шрифт', text: 'Текст' },
  { title: 'Заголовок', text: 'Текст' },
  { title: 'Заголовок', text: 'Текст' },
];

export default function BentoSection() {
  return <section className="wrapper section bento-section" aria-labelledby="benefits-title">
    <h2 id="benefits-title" className="section-title">Возможности</h2>
    <div className="bento-viewport scroller" role="region" aria-label="Возможности" tabIndex={0}>
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
