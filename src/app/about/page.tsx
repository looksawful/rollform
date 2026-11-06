import BentoSection from '@/components/BentoSection';

export default function AboutPage() {
  return <>
    <BentoSection />
    <section className="wrapper section page-section about-section" id="about">
      <figure className="about-panorama editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-02.webp`}
          alt="Игральные кубики, панорамное изображение"
          width={1600} height={640} loading="lazy" decoding="async" />
      </figure>
      <div className="editorial-copy prose">
        <h1 className="page-title">О нас</h1>
        <p>В этом разделе будет история проекта: как появилась идея и что определяет характер коллекции. Пока мы используем временный текст, чтобы проверить ритм длинного абзаца и сочетание с фотографиями. После утверждения содержания он будет заменён полноценным описанием.</p>
      </div>
    </section>
  </>;
}
