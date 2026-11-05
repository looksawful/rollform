/* Скрытая секция-концепт. Тексты о материалах и количестве вариантов требуют подтверждения. */
const cards = [
  { title: 'Любая форма', text: 'Семь вариантов кубика' },
  { title: 'Любой цвет', text: 'Три варианта цвета' },
  { title: 'Разные шрифты', text: 'Шесть вариантов на выбор' },
  { title: 'Качественные материалы', text: 'Производим сами из качественной эпоксидной смолы' },
  { title: 'Приятные на ощупь', text: 'Качественный баланс и приятная текстура' },
];

export default function BentoSection() {
  return <section className="wrapper section bento-section" aria-labelledby="benefits-title">
    <h2 id="benefits-title" className="section-title">Возможности</h2>
    <div className="bento-viewport scroller" role="region" aria-label="Возможности" tabIndex={0}>
      <div className="bento-grid">
        {cards.map(({ title, text }) =>
          <article className="bento-card box" key={title}>
            <h3>{title}</h3><p>{text}</p>
          </article>
        )}
      </div>
    </div>
  </section>;
}
