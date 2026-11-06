'use client';

import { useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { presets } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function ProductGallery({ mode }: { mode: 'grid' | 'reel' }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Revert ScrollTrigger's pin wrapper before React removes the section on navigation.
  useLayoutEffect(() => {
    if (mode !== 'reel') return;
    const scroller = scrollerRef.current;
    const section = scroller?.closest('#catalog');
    if (!scroller || !section) return;

    let cancelled = false;
    let media: { revert: () => void } | undefined;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'), import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      media = mm;
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference) and (not (pointer: coarse))', () => {
        const cards = scroller.querySelectorAll<HTMLElement>('.product');
        const previewDistance = () => cards.length < 3 ? 0 : Math.max(0, Math.min(
          scroller.scrollWidth - scroller.clientWidth,
          cards[2].offsetLeft - cards[0].offsetLeft,
        ));
        if (!previewDistance()) return;

        let lastScrollLeft = scroller.scrollLeft;
        const rememberPosition = () => { lastScrollLeft = scroller.scrollLeft; };
        scroller.addEventListener('scroll', rememberPosition, { passive: true });
        const markScrubbing = () => section.classList.add('catalog-scrubbing');
        const unmarkScrubbing = () => section.classList.remove('catalog-scrubbing');
        gsap.to(scroller, {
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
        return () => {
          scroller.removeEventListener('scroll', rememberPosition);
          unmarkScrubbing();
          scroller.scrollLeft = lastScrollLeft;
        };
      });
    })();
    return () => {
      cancelled = true;
      media?.revert();
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
        <ProductCard key={product.id} product={product} index={index} />)}
    </div>
    {mode === 'reel' && <div className="reel-controls" aria-label="Листать карточки">
      <button type="button" onClick={() => scrollCards(-1)} aria-label="Предыдущие карточки">
        <ChevronLeft className="icon" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => scrollCards(1)} aria-label="Следующие карточки">
        <ChevronRight className="icon" aria-hidden="true" />
      </button>
    </div>}
  </>;
}
