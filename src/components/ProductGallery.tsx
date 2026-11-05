'use client';

import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      const cards = scroller.querySelectorAll<HTMLElement>('.product');
      const previewDistance = () => cards.length < 3 ? 0 : Math.max(0, Math.min(
        scroller.scrollWidth - scroller.clientWidth,
        cards[2].offsetLeft - cards[0].offsetLeft,
      ));
      if (!previewDistance()) return;

      const markScrubbing = () => section.classList.add('catalog-scrubbing');
      const unmarkScrubbing = () => section.classList.remove('catalog-scrubbing');
      animation = gsap.to(scroller, {
        scrollLeft: () => previewDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: scroller,
          pin: section,
          start: 'center center',
          end: () => '+=' + Math.max(1, Math.min(previewDistance(), window.innerHeight * 0.7)),
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onEnter: markScrubbing,
          onEnterBack: markScrubbing,
          onLeave: unmarkScrubbing,
          onLeaveBack: unmarkScrubbing,
        },
      });
    })();
    return () => {
      cancelled = true;
      animation?.scrollTrigger?.kill();
      animation?.kill();
      section.classList.remove('catalog-scrubbing');
    };
  }, [mode]);

  const scrollCards = (direction: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>('.product');
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    scroller.scrollBy({ left: direction * ((card?.offsetWidth || scroller.clientWidth) + gap), behavior: 'smooth' });
  };

  return <>
    <div ref={scrollerRef} className={mode === 'reel' ? 'product-scroller reel' : 'product-grid grid'}
      {...(mode === 'reel' ? { role: 'region', 'aria-label': 'В наличии', tabIndex: 0 } : {})}>
      {presets.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} onPreview={() => setActive(index)} />)}
    </div>
    {mode === 'reel' && <div className="reel-controls" aria-label="Листать карточки">
      <button type="button" onClick={() => scrollCards(-1)} aria-label="Предыдущие карточки">
        <ChevronLeft className="icon" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => scrollCards(1)} aria-label="Следующие карточки">
        <ChevronRight className="icon" aria-hidden="true" />
      </button>
    </div>}
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
