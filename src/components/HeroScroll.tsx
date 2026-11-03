'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';

type Props = {
  hero: RefObject<HTMLElement | null>;
  model: RefObject<HTMLDivElement | null>;
  scrollAngle: MutableRefObject<number>;
};

/** Only the hero is pinned/snapped. Scrolling the long catalog stays free. */
export default function HeroScroll({ hero, model, scrollAngle }: Props) {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !hero.current || !model.current) return;
    initialized.current = true;
    let destroyed = false;
    let dispose: (() => void) | undefined;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'), import('gsap/ScrollTrigger'),
      ]);
      if (destroyed || !hero.current || !model.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const state = { angle: 0 };
      const media = gsap.matchMedia();
      const context = gsap.context(() => {
        media.add('(min-width: 850px) and (prefers-reduced-motion: no-preference)', () => {
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: hero.current,
              start: 'top top',
              end: () => `+=${Math.round(window.innerHeight * 0.9)}`,
              pin: true,
              scrub: 0.75,
              anticipatePin: 1,
              snap: { snapTo: [0, 0.5, 1], duration: 0.24, delay: 0.12, inertia: false },
              invalidateOnRefresh: true,
            },
          });
          timeline.to(state, { angle: Math.PI * 1.4, ease: 'none', duration: 0.5,
            onUpdate: () => { scrollAngle.current = state.angle; } }, 0);
          timeline.to(model.current, { x: () => window.innerWidth * 0.16, y: -52, scale: 0.78, ease: 'none', duration: 0.5 }, 0);
          timeline.to(state, { angle: Math.PI * 3.0, ease: 'none', duration: 0.5,
            onUpdate: () => { scrollAngle.current = state.angle; } }, 0.5);
          timeline.to(model.current, { x: () => window.innerWidth * 0.04, y: 20, scale: 0.96, ease: 'none', duration: 0.5 }, 0.5);
          return () => { scrollAngle.current = 0; };
        });
        media.add('(max-width: 849px) and (prefers-reduced-motion: no-preference)', () => {
          gsap.to(state, {
            angle: Math.PI * 1.35, ease: 'none',
            onUpdate: () => { scrollAngle.current = state.angle; },
            scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom top', scrub: true },
          });
          return () => { scrollAngle.current = 0; };
        });
      }, hero.current);
      dispose = () => { media.revert(); context.revert(); };
    })().catch(error => console.warn('GSAP unavailable', error));
    return () => { destroyed = true; dispose?.(); initialized.current = false; };
  }, [hero, model, scrollAngle]);
  return null;
}
