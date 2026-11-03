'use client';

import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Texture, Material, BufferGeometry } from 'three';
import type { DiceConfig } from '@/lib/catalog';
import { buildGeometry, faceLabel, facePlacements } from '@/lib/diceGeometry';

type Props = {
  config: DiceConfig;
  onSelect?: () => void;
  scrollAngleRef?: MutableRefObject<number>;
};

export default function DiceViewer({ config, onSelect, scrollAngleRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [fallback, setFallback] = useState(false);

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
        camera.position.set(0, 0, 7.7);
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
        const geometry = buildGeometry(config.shape);
        const surface = new THREE.MeshBasicMaterial({ color: config.shell, side: THREE.DoubleSide });
        dice.add(new THREE.Mesh(geometry, surface));
        const edges = new THREE.EdgesGeometry(geometry, 22);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: '#ffffff' });
        dice.add(new THREE.LineSegments(edges, edgeMaterial));

        const textureSet: Texture[] = [];
        const materialSet: Material[] = [];
        const labelGeometries: BufferGeometry[] = [];
        facePlacements(geometry, config.shape).forEach((face, index) => {
          const labelCanvas = document.createElement('canvas');
          labelCanvas.width = labelCanvas.height = 256;
          const ctx = labelCanvas.getContext('2d');
          if (!ctx) return;
          const label = faceLabel(config.shape, index);
          const family = config.font === 'mono' ? 'monospace'
            : config.font === 'serif' ? 'Georgia, serif' : 'Inter, Arial, sans-serif';
          ctx.font = `700 ${label.length > 1 ? 110 : 150}px ${family}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, 128, 135);
          const texture = new THREE.CanvasTexture(labelCanvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          const material = new THREE.MeshBasicMaterial({
            map: texture, transparent: true, depthWrite: false,
            side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
          });
          const width = ({ d4: 0.66, d6: 0.92, d8: 0.74, d10: 0.72,
            d12: 0.82, d20: 0.7, 'd%': 0.72 } as const)[config.shape];
          const plane = new THREE.PlaneGeometry(width, width);
          const text = new THREE.Mesh(plane, material);
          text.position.copy(face.center).addScaledVector(face.normal, 0.032);
          text.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
          dice.add(text);
          textureSet.push(texture);
          materialSet.push(material);
          labelGeometries.push(plane);
        });

        let activePointer = false;
        let moved = false;
        let lastX = 0;
        let lastY = 0;
        let lastTouch = 0;
        let previousScrollAngle = 0;
        let frame = 0;
        const onPointerDown = (event: PointerEvent) => {
          activePointer = true; moved = false; lastX = event.clientX; lastY = event.clientY;
          canvas.setPointerCapture(event.pointerId);
          canvas.style.cursor = 'grabbing';
        };
        const onPointerMove = (event: PointerEvent) => {
          if (!activePointer) return;
          const dx = event.clientX - lastX, dy = event.clientY - lastY;
          if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
          dice.rotation.y += dx * 0.011;
          dice.rotation.x += dy * 0.011;
          lastX = event.clientX; lastY = event.clientY;
          lastTouch = performance.now();
        };
        const onPointerUp = () => {
          if (!activePointer) return;
          activePointer = false; canvas.style.cursor = 'grab'; lastTouch = performance.now();
          if (!moved) selectRef.current?.();
        };
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const resize = () => {
          const w = host.clientWidth || 250, h = host.clientHeight || 250;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host); resize();
        const draw = () => {
          const angle = scrollAngleRef?.current ?? 0;
          const delta = angle - previousScrollAngle;
          dice.rotation.y += delta;
          dice.rotation.x += delta * 0.38;
          previousScrollAngle = angle;
          if (!activePointer && !motion.matches && performance.now() - lastTouch > 1400) {
            dice.rotation.y += 0.0026;
            dice.rotation.x += 0.00025;
          }
          renderer.render(scene, camera);
          frame = requestAnimationFrame(draw);
        };
        draw();
        cleanup = () => {
          cancelAnimationFrame(frame); observer.disconnect();
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerUp);
          textureSet.forEach(t => t.dispose());
          materialSet.forEach(m => m.dispose());
          labelGeometries.forEach(g => g.dispose());
          edges.dispose(); edgeMaterial.dispose(); geometry.dispose(); surface.dispose();
          renderer.dispose(); canvas.remove();
        };
        if (closed) cleanup();
        setFallback(false);
      } catch (error) {
        if (!closed) { console.warn('3D preview unavailable', error); setFallback(true); }
      }
    })();
    return () => { closed = true; cleanup?.(); };
  }, [config, scrollAngleRef]);

  return <div ref={hostRef} className="dice-canvas"
    role="img" aria-label={`3D модель ${config.shape.toUpperCase()}, `}>
    {fallback && <div className="canvas-fallback">{config.shape.toUpperCase()}</div>}
  </div>;
}
