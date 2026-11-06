'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { presets } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function ProductGallery({ mode }: { mode: 'grid' | 'reel' }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    if (mode !== 'reel') return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      const scroller = scrollerRef.current;
      if (scroller) {
        const first = scroller.querySelector<HTMLElement>('[data-copy="0"] .product');
        const middle = scroller.querySelector<HTMLElement>('[data-copy="1"] .product');
        positionRef.current = first && middle
          ? scroller.scrollLeft - (middle.offsetLeft - first.offsetLeft) : scroller.scrollLeft;
      }
      setLooping(!preference.matches);
    };
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, [mode]);

  useLayoutEffect(() => {
    if (mode !== 'reel') return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>('.product'));
    const nativeTimeline = CSS.supports('animation-timeline: view(inline)');
    let frame = 0;
    let autoFrame = 0;
    let lastTime = 0;
    let cycleWidth = 0;
    let visible = false;
    let userPauseUntil = 0;
    let autoPosition = 0;
    let hoverCard: Element | null = null;
    let hoverPaused = false;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let drag: { pointer: number; x: number; left: number; moved: boolean } | undefined;
    let suppressClick = false;
    let clickReset: ReturnType<typeof setTimeout> | undefined;

    // Each of the three equal copies has the same width and gap.
    // Keep the viewport in the middle copy; wrapping by one copy is imperceptible.
    const measure = () => {
      const first = scroller.querySelector<HTMLElement>('.product-strip[data-copy="0"] .product');
      const middle = scroller.querySelector<HTMLElement>('.product-strip[data-copy="1"] .product');
      return first && middle ? middle.offsetLeft - first.offsetLeft : 0;
    };
    const wrap = () => {
      if (!looping || cycleWidth <= 0) return;
      const previous = scroller.scrollLeft;
      const next = cycleWidth + (((previous - cycleWidth) % cycleWidth) + cycleWidth) % cycleWidth;
      if (Math.abs(previous - next) < 0.5) return;
      scroller.scrollLeft = next;
      autoPosition += next - previous;
      if (drag) drag.left += next - previous;
    };
    const update = () => {
      frame = 0;
      wrap();
      positionRef.current = looping ? scroller.scrollLeft - cycleWidth : scroller.scrollLeft;
      const remaining = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;
      scroller.dataset.canScrollStart = String(looping || scroller.scrollLeft > 1);
      scroller.dataset.canScrollEnd = String(looping || remaining > 1);
      if (!nativeTimeline) {
        const viewportCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
        const positions = cards.map(card => {
          const box = card.getBoundingClientRect();
          return { card, distance: Math.min(1, Math.abs(box.left + box.width / 2 - viewportCenter) /
            ((scroller.clientWidth + box.width) / 2)) };
        });
        for (const { card, distance } of positions) {
          card.style.scale = looping ? String(1 - distance * 0.28) : '1';
        }
      }
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(() => {
      if (looping) {
        const progress = cycleWidth > 0 ? (scroller.scrollLeft - cycleWidth) / cycleWidth : 0;
        const next = measure();
        if (next > 0) {
          cycleWidth = next;
          scroller.scrollLeft = cycleWidth * (1 + (((progress % 1) + 1) % 1));
          autoPosition = scroller.scrollLeft;
        }
      }
      scheduleUpdate();
    });
    resize.observe(scroller);

    const animate = (time: number) => {
      const delta = lastTime ? Math.min(64, time - lastTime) : 0;
      lastTime = time;
      if (looping && visible && !document.hidden && !drag &&
        time >= userPauseUntil && !hoverPaused &&
        !scroller.contains(document.activeElement)) {
        // Preserve subpixel progress, including at 120/144Hz and browser zoom.
        autoPosition += delta * 0.03;
        scroller.scrollLeft = autoPosition;
      } else autoPosition = scroller.scrollLeft;
      autoFrame = requestAnimationFrame(animate);
    };
    let observer: IntersectionObserver | undefined;
    if (looping) {
      cycleWidth = measure();
      if (cycleWidth > 0) scroller.scrollLeft = cycleWidth + positionRef.current;
      autoPosition = scroller.scrollLeft;
      observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        lastTime = 0;
      }, { rootMargin: '160px' });
      observer.observe(scroller);
      autoFrame = requestAnimationFrame(animate);
    } else scroller.scrollLeft = positionRef.current;

    const down = (event: PointerEvent) => {
      userPauseUntil = performance.now() + 1600;
      drag = undefined;
      if (event.pointerType !== 'mouse' || event.button !== 0 ||
        (event.target as Element).closest('button, input, select, textarea')) return;
      drag = { pointer: event.pointerId, x: event.clientX, left: scroller.scrollLeft, moved: false };
    };
    const move = (event: PointerEvent) => {
      // A stationary cursor exposed by scrolling into the reel is not intent.
      // Pause only after the mouse moves over a card and dwells there.
      if (event.pointerType === 'mouse' && !drag && matchMedia('(hover: hover)').matches) {
        const card = (event.target as Element).closest('.product');
        if (card !== hoverCard) {
          clearTimeout(hoverTimer);
          hoverCard = card;
          hoverPaused = false;
          if (card) hoverTimer = setTimeout(() => { hoverPaused = true; }, 180);
        }
      }
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
    const leave = () => {
      clearTimeout(hoverTimer);
      hoverCard = null;
      hoverPaused = false;
    };
    const finish = (event: PointerEvent) => {
      userPauseUntil = performance.now() + 1600;
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
      if (event.ctrlKey || scroller.scrollWidth <= scroller.clientWidth) return;
      if (!event.shiftKey) {
        // Let trackpads scroll horizontally, but do not fight them with auto-motion.
        if (Math.abs(event.deltaX) > 0) userPauseUntil = performance.now() + 1600;
        return;
      }
      event.preventDefault();
      userPauseUntil = performance.now() + 1600;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      scroller.scrollLeft += delta * unit;
    };
    const preventNativeDrag = (event: DragEvent) => event.preventDefault();
    scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
    scroller.addEventListener('pointerdown', down);
    scroller.addEventListener('pointermove', move);
    scroller.addEventListener('pointerleave', leave);
    scroller.addEventListener('pointerup', finish);
    scroller.addEventListener('pointercancel', finish);
    scroller.addEventListener('lostpointercapture', finish);
    scroller.addEventListener('click', click, true);
    scroller.addEventListener('dragstart', preventNativeDrag);
    scroller.addEventListener('wheel', wheel, { passive: false });
    update();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(autoFrame);
      clearTimeout(clickReset);
      clearTimeout(hoverTimer);
      observer?.disconnect();
      resize.disconnect();
      scroller.removeEventListener('scroll', scheduleUpdate);
      scroller.removeEventListener('pointerdown', down);
      scroller.removeEventListener('pointermove', move);
      scroller.removeEventListener('pointerleave', leave);
      scroller.removeEventListener('pointerup', finish);
      scroller.removeEventListener('pointercancel', finish);
      scroller.removeEventListener('lostpointercapture', finish);
      scroller.removeEventListener('click', click, true);
      scroller.removeEventListener('dragstart', preventNativeDrag);
      scroller.removeEventListener('wheel', wheel);
      scroller.classList.remove('is-dragging');
      if (!nativeTimeline) cards.forEach(card => card.style.removeProperty('scale'));
    };
  }, [mode, looping]);

  return (
    <div ref={scrollerRef} className={mode === 'reel' ? 'product-scroller reel' : 'product-grid grid'}
      {...(mode === 'reel' ? { role: 'region', 'aria-label': 'В наличии', tabIndex: 0,
        'data-looping': looping ? 'true' : 'false',
        'data-can-scroll-start': 'false', 'data-can-scroll-end': 'true' } : {})}>
      {(mode === 'reel' && looping ? [0, 1, 2] : [1]).map(copy =>
        <div className="product-strip" data-copy={copy} key={copy} aria-hidden={copy !== 1 || undefined}>
          {presets.map((product, index) =>
            <ProductCard key={product.id} product={product} index={index} duplicate={copy !== 1} />)}
        </div>)}
    </div>
  );
}
