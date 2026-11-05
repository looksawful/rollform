export default function ProductionInfo() {
  return <section className="wrapper section page-section production-info stack">
    <h1 className="page-title">Изготовление и доставка</h1>
    <div className="production-intro editorial-grid">
      <div className="stack">
        <p className="eyebrow">Процесс и получение</p>
        <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
      </div>
      <figure className="editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/process-example.webp`}
          alt="Референсный кадр работы с эпоксидной смолой, не производство ROLLFORM"
          width={760} height={1000} loading="lazy" />
        <figcaption>Референсный кадр. Не производство ROLLFORM</figcaption>
      </figure>
    </div>
    <div className="production-options stack">
      <section className="stack">
        <h2>Кубики в наличии</h2>
        <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
        <p>Фактическое наличие, адрес самовывоза и окончательные условия получения уточняются.</p>
      </section>
      <section className="stack">
        <h2>Кубики на заказ</h2>
        <p>Изготовление начинается после согласования формы, цвета и шрифта. Точный срок пока уточняется.</p>
        <p>Способ получения и дату согласуют перед оформлением заказа.</p>
      </section>
    </div>
  </section>;
}
