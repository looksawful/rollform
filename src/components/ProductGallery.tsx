'use client';

import { useLayoutEffect, useRef } from 'react';
import { presets } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function ProductGallery({ mode }: { mode: 'grid' | 'reel' }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (mode !== 'reel') return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>('.product'));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const nativeTimeline = CSS.supports('animation-timeline: view(inline)');
    let frame = 0;
    let drag: { pointer: number; x: number; left: number; moved: boolean } | undefined;
    let suppressClick = false;
    let clickReset: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      frame = 0;
      const remaining = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;
      scroller.dataset.canScrollStart = String(scroller.scrollLeft > 1);
      scroller.dataset.canScrollEnd = String(remaining > 1);
      // Match the CSS view-timeline effect in browsers without scroll animations.
      if (!nativeTimeline) for (const card of cards) {
        const center = card.offsetLeft - scroller.offsetLeft + card.offsetWidth / 2 - scroller.scrollLeft;
        const distance = Math.min(1, Math.abs(center - scroller.clientWidth / 2) / ((scroller.clientWidth + card.offsetWidth) / 2));
        card.style.scale = reducedMotion.matches ? '1' : String(1 - distance * 0.28);
      }
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    const down = (event: PointerEvent) => {
      drag = undefined;
      if (event.pointerType !== 'mouse' || event.button !== 0 ||
        (event.target as Element).closest('button, input, select, textarea')) return;
      drag = { pointer: event.pointerId, x: event.clientX, left: scroller.scrollLeft, moved: false };
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      if (!(event.buttons & 1)) { drag = undefined; return; }
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        scroller.classList.add('is-dragging');
        scroller.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      scroller.scrollLeft = drag.left - distance;
    };
    const finish = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const moved = drag.moved;
      drag = undefined;
      scroller.classList.remove('is-dragging');
      if (scroller.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
      if (moved && event.type === 'pointerup') {
        suppressClick = true;
        clearTimeout(clickReset);
        clickReset = setTimeout(() => { suppressClick = false; }, 0);
      }
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };
    const wheel = (event: WheelEvent) => {
      if (!event.shiftKey || event.ctrlKey || scroller.scrollWidth <= scroller.clientWidth) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      scroller.scrollLeft += delta * unit;
    };
    const preventNativeDrag = (event: DragEvent) => event.preventDefault();
    const resize = new ResizeObserver(scheduleUpdate);
    resize.observe(scroller);
    scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
    scroller.addEventListener('pointerdown', down);
    scroller.addEventListener('pointermove', move);
    scroller.addEventListener('pointerup', finish);
    scroller.addEventListener('pointercancel', finish);
    scroller.addEventListener('lostpointercapture', finish);
    scroller.addEventListener('click', click, true);
    scroller.addEventListener('dragstart', preventNativeDrag);
    scroller.addEventListener('wheel', wheel, { passive: false });
    reducedMotion.addEventListener('change', scheduleUpdate);
    update();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clickReset);
      resize.disconnect();
      scroller.removeEventListener('scroll', scheduleUpdate);
      scroller.removeEventListener('pointerdown', down);
      scroller.removeEventListener('pointermove', move);
      scroller.removeEventListener('pointerup', finish);
      scroller.removeEventListener('pointercancel', finish);
      scroller.removeEventListener('lostpointercapture', finish);
      scroller.removeEventListener('click', click, true);
      scroller.removeEventListener('dragstart', preventNativeDrag);
      scroller.removeEventListener('wheel', wheel);
      reducedMotion.removeEventListener('change', scheduleUpdate);
      scroller.classList.remove('is-dragging');
      if (!nativeTimeline) cards.forEach(card => card.style.removeProperty('scale'));
    };
  }, [mode]);

  return (
    <div ref={scrollerRef} className={mode === 'reel' ? 'product-scroller reel' : 'product-grid grid'}
      {...(mode === 'reel' ? { role: 'region', 'aria-label': 'В наличии', tabIndex: 0,
        'data-can-scroll-start': 'false', 'data-can-scroll-end': 'true' } : {})}>
      {presets.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} />)}
    </div>
  );
}
