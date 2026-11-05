'use client';

import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { presets } from '@/lib/catalog';
import { photoPath } from '@/lib/photoAssets';
import ProductCard from './ProductCard';

const slides = presets.map((product, index) => ({
  src: photoPath(index),
  alt: `Игральные кубики, ${product.title}.`,
}));

export default function ProductGallery({ mode }: { mode: 'grid' | 'reel' }) {
  const [active, setActive] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'reel' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scroller = scrollerRef.current;
    const section = scroller?.closest('#catalog');
    if (!scroller || !section) return;

    let cancelled = false;
    let animation: { kill: () => void; scrollTrigger?: { kill: () => void } } | undefined;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'), import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const distance = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      if (!distance()) return;

      section.classList.add('catalog-pinned');
      animation = gsap.to(scroller, {
        scrollLeft: () => distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: scroller,
          pin: section,
          start: 'center center',
          end: () => '+=' + distance(),
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    })();
    return () => {
      cancelled = true;
      animation?.scrollTrigger?.kill();
      animation?.kill();
      section.classList.remove('catalog-pinned');
    };
  }, [mode]);

  return <>
    <div ref={scrollerRef} className={mode === 'reel' ? 'product-scroller reel' : 'product-grid grid'}
      {...(mode === 'reel' ? { role: 'region', 'aria-label': 'В наличии', tabIndex: 0 } : {})}>
      {presets.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} onPreview={() => setActive(index)} />)}
    </div>
    <Lightbox
      open={active !== null}
      close={() => setActive(null)}
      index={active ?? 0}
      slides={slides}
      carousel={{ finite: true }}
      labels={{ Close: 'Закрыть', Previous: 'Предыдущее изображение', Next: 'Следующее изображение' }}
    />
  </>;
}
