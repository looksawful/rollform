'use client';

import { useEffect, useRef } from 'react';
import CubeOutline from './CubeOutline';

export default function ScrollProgress() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const media = matchMedia('(min-width: 64rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let closed = false;
    let context: { revert: () => void } | undefined;
    const setup = async () => {
      if (!media.matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      const track = trackRef.current, cube = cubeRef.current;
      if (closed || !media.matches || !track || !cube) return;
      context?.revert();
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const resize = new ResizeObserver(() => ScrollTrigger.refresh());
        resize.observe(document.body);
        gsap.to(cube, {
          x: () => track.clientWidth - cube.clientWidth,
          rotation: 720, transformOrigin: '50% 50%', ease: 'none',
          scrollTrigger: {
            id: 'rollform-scroll-progress', start: 0, end: 'max',
            scrub: 0.25, invalidateOnRefresh: true,
          },
        });
        return () => resize.disconnect();
      });
    };
    const change = () => { context?.revert(); context = undefined; void setup().catch(() => {}); };
    media.addEventListener('change', change);
    void setup().catch(() => { /* The indicator is optional; native scrolling stays available. */ });
    return () => { closed = true; media.removeEventListener('change', change); context?.revert(); };
  }, []);

  return <div ref={trackRef} className="scroll-progress" aria-hidden="true">
    <CubeOutline ref={cubeRef} />
  </div>;
}
