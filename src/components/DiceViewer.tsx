'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MutableRefObject } from 'react';
import type { DiceConfig } from '@/lib/catalog';
import { buildGeometry, faceLabel, facePlacements } from '@/lib/diceGeometry';

type Props = {
  config: DiceConfig;
  onSelect?: () => void;
  scrollAngleRef?: MutableRefObject<number>;
  autoRotate?: boolean;
  interactive?: boolean;
};

export default function DiceViewer({
  config, onSelect, scrollAngleRef, autoRotate = false, interactive = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ config, onSelect, autoRotate });
  const viewerRef = useRef<{
    update: (config: DiceConfig) => void;
    rotate: (x: number, y: number, reset?: boolean) => void;
  } | null>(null);
  const [fallback, setFallback] = useState(false);
  propsRef.current = { config, onSelect, autoRotate };

  useEffect(() => { viewerRef.current?.update(config); }, [config, autoRotate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let closed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const THREE = await import('three');
        if (closed) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
        camera.position.set(0, 0, 6.6);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0xffffff, 0);
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
        host.append(canvas);

        const dice = new THREE.Group();
        dice.rotation.set(-0.38, 0.4, 0.12);
        scene.add(dice);
        scene.add(new THREE.AmbientLight(0xffffff, 1.6));
        const key = new THREE.DirectionalLight(0xffffff, 2.1);
        key.position.set(4, 6, 7);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.65);
        fill.position.set(-5, -3, -2);
        scene.add(fill);

        const surface = new THREE.MeshStandardMaterial({
          color: '#191919', roughness: 0.72, metalness: 0.03,
          flatShading: true, side: THREE.DoubleSide,
        });
        const edgeMaterial = new THREE.LineBasicMaterial({ color: '#dddddd' });
        let renderedShape: DiceConfig['shape'] | undefined;
        let renderedFont: DiceConfig['font'] | undefined;

        const clearShape = () => {
          // Keep shared surface/edge materials; release only geometry and label textures.
          dice.children.forEach(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
              child.geometry.dispose();
              if (child.material instanceof THREE.MeshBasicMaterial) {
                child.material.map?.dispose();
                child.material.dispose();
              }
            }
          });
          dice.clear();
        };

        const buildShape = (next: DiceConfig) => {
          const shapeChanged = renderedShape !== next.shape;
          clearShape();
          const geometry = buildGeometry(next.shape);
          dice.add(new THREE.Mesh(geometry, surface));
          dice.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 22), edgeMaterial));
          const family = next.font === 'mono' ? 'monospace'
            : next.font === 'serif' ? 'Georgia, serif' : 'Inter, Arial, sans-serif';
          const width = ({ d4: 0.83, d6: 0.92, d8: 0.77, d10: 0.74,
            d12: 0.82, d20: 0.72, 'd%': 0.74 } as const)[next.shape];
          const front = new THREE.Vector3(0, 0, 1);
          facePlacements(geometry, next.shape).forEach((face, index) => {
            const image = document.createElement('canvas');
            image.width = image.height = 256;
            const ctx = image.getContext('2d');
            if (!ctx) return;
            const label = faceLabel(next.shape, index);
            ctx.font = '700 ' + (label.length > 1 ? 120 : 156) + 'px ' + family;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, 128, 135);
            const texture = new THREE.CanvasTexture(image);
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.MeshBasicMaterial({
              map: texture, transparent: true, depthWrite: false,
              side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
            });
            const plane = new THREE.PlaneGeometry(width, width);
            const text = new THREE.Mesh(plane, material);
            text.position.copy(face.center).addScaledVector(face.normal, 0.034);
            text.quaternion.setFromUnitVectors(front, face.normal);
            dice.add(text);
          });
          if (shapeChanged && renderedShape !== undefined) dice.rotation.set(-0.38, 0.4, 0.12);
          renderedShape = next.shape;
          renderedFont = next.font;
        };

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        let lastRender = -Infinity;
        let visible = true;
        let lost = false;
        let dirty = true;
        let previousScrollAngle = scrollAngleRef?.current ?? 0;
        let lastScroll = -Infinity;
        let lastTouch = 0;
        let pointerId: number | null = null;
        let moved = false;
        let startX = 0, startY = 0, lastX = 0, lastY = 0;

        const draw = (now: number) => {
          frame = 0;
          if (closed || lost || document.hidden || !visible) return;
          const angle = scrollAngleRef?.current ?? 0;
          const delta = angle - previousScrollAngle;
          previousScrollAngle = angle;
          if (!motion.matches && Math.abs(delta) > 0.00001) {
            dice.rotation.y += delta;
            dice.rotation.x += delta * 0.38;
            dirty = true;
          }
          if (propsRef.current.autoRotate && !motion.matches && pointerId === null &&
            performance.now() - lastTouch > 1400) {
            dice.rotation.y += 0.0026;
            dice.rotation.x += 0.00025;
            dirty = true;
          }
          if (dirty && (!propsRef.current.autoRotate || now - lastRender >= 1000 / 60)) {
            renderer.render(scene, camera);
            lastRender = now;
            dirty = false;
          }
          if ((!motion.matches && propsRef.current.autoRotate) ||
            (scrollAngleRef && !motion.matches && performance.now() - lastScroll < 1200)) {
            frame = requestAnimationFrame(draw);
          }
        };
        const wake = () => {
          dirty = true;
          if (!frame && !closed && !lost && !document.hidden && visible) frame = requestAnimationFrame(draw);
        };
        const stop = () => { cancelAnimationFrame(frame); frame = 0; };

        const update = (next: DiceConfig) => {
          if (next.shape !== renderedShape || next.font !== renderedFont) buildShape(next);
          surface.color.set(next.shell === '#000000' ? '#191919' : next.shell);
          wake();
        };
        update(propsRef.current.config);

        const rotate = (x: number, y: number, reset = false) => {
          if (reset) dice.rotation.set(-0.38, 0.4, 0.12);
          else { dice.rotation.y += x; dice.rotation.x += y; }
          lastTouch = performance.now();
          wake();
        };
        viewerRef.current = { update, rotate };

        const onPointerDown = (event: PointerEvent) => {
          if (pointerId !== null || event.button !== 0) return;
          pointerId = event.pointerId;
          moved = false;
          startX = lastX = event.clientX;
          startY = lastY = event.clientY;
          canvas.setPointerCapture(event.pointerId);
          canvas.style.cursor = 'grabbing';
        };
        const onPointerMove = (event: PointerEvent) => {
          if (pointerId !== event.pointerId) return;
          const dx = event.clientX - lastX, dy = event.clientY - lastY;
          if (Math.hypot(event.clientX - startX, event.clientY - startY) > 6) moved = true;
          rotate(dx * 0.011, dy * 0.011);
          lastX = event.clientX;
          lastY = event.clientY;
        };
        const endPointer = (event: PointerEvent, cancelled: boolean) => {
          if (pointerId !== event.pointerId) return;
          pointerId = null;
          lastTouch = performance.now();
          if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
          canvas.style.cursor = 'grab';
          if (!cancelled && !moved) propsRef.current.onSelect?.();
        };
        const onPointerUp = (event: PointerEvent) => endPointer(event, false);
        const onPointerCancel = (event: PointerEvent) => endPointer(event, true);
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerCancel);

        const onLost = (event: Event) => {
          event.preventDefault();
          lost = true;
          stop();
          canvas.style.visibility = 'hidden';
          setFallback(true);
        };
        const onRestored = () => {
          lost = false;
          canvas.style.visibility = '';
          setFallback(false);
          resize();
          wake();
        };
        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);

        const resize = () => {
          if (lost) return;
          const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          wake();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) wake();
          else stop();
        });
        visibility.observe(host);
        const onVisibility = () => { if (document.hidden) stop(); else wake(); };
        const onScroll = () => { lastScroll = performance.now(); wake(); };
        document.addEventListener('visibilitychange', onVisibility);
        if (scrollAngleRef) window.addEventListener('scroll', onScroll, { passive: true });
        motion.addEventListener('change', wake);
        resize();

        cleanup = () => {
          stop();
          observer.disconnect();
          visibility.disconnect();
          document.removeEventListener('visibilitychange', onVisibility);
          if (scrollAngleRef) window.removeEventListener('scroll', onScroll);
          motion.removeEventListener('change', wake);
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerCancel);
          canvas.removeEventListener('webglcontextlost', onLost);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          if (viewerRef.current?.update === update) viewerRef.current = null;
          clearShape();
          surface.dispose();
          edgeMaterial.dispose();
          renderer.dispose();
          canvas.remove();
        };
        if (closed) cleanup();
        else setFallback(false);
      } catch (error) {
        if (!closed) { console.warn('3D preview unavailable', error); setFallback(true); }
      }
    })();
    return () => { closed = true; cleanup?.(); };
  }, [scrollAngleRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const turn = 0.2;
    switch (event.key) {
      case 'ArrowLeft': viewerRef.current?.rotate(-turn, 0); break;
      case 'ArrowRight': viewerRef.current?.rotate(turn, 0); break;
      case 'ArrowUp': viewerRef.current?.rotate(0, -turn); break;
      case 'ArrowDown': viewerRef.current?.rotate(0, turn); break;
      case 'Home': viewerRef.current?.rotate(0, 0, true); break;
      default: return;
    }
    event.preventDefault();
  };

  return <div ref={hostRef} className="dice-canvas"
    role={interactive ? 'group' : 'img'} tabIndex={interactive ? 0 : undefined}
    aria-label={'3D модель ' + config.shape.toUpperCase() +
      (interactive ? '. Стрелки поворачивают, Home сбрасывает поворот' : '')}
    onKeyDown={onKeyDown}>
    {fallback && <div className="canvas-fallback" style={{ backgroundColor: config.shell }}>{config.shape.toUpperCase()}</div>}
  </div>;
}
