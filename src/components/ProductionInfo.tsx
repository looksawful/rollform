export default function ProductionInfo({ onHome = false }: { onHome?: boolean }) {
  return <section id={onHome ? 'production' : undefined}
    className={`wrapper section production-info stack${onHome ? '' : ' page-section'}`}>
    {onHome ? <h2 className="section-title">Изготовление и получение</h2> : <h1 className="page-title">Изготовление и доставка</h1>}
    <div className="production-intro editorial-grid">
      <div className="stack">
        {!onHome && <p className="eyebrow">Процесс и получение</p>}
        <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
      </div>
      <figure className="editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/process-example.webp`}
          alt="Работа с эпоксидной смолой"
          width={760} height={1000} loading="lazy" />
      </figure>
    </div>
    <div className="production-options stack">
      <section className="stack">
        <h2>Кубики в наличии</h2>
        <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
      </section>
      <section className="stack">
        <h2>Кубики на заказ</h2>
        <p>Изготовление начинается после согласования формы, цвета и шрифта.</p>
        <p>Способ получения и дату согласуют перед оформлением заказа.</p>
      </section>
    </div>
  </section>;
}
