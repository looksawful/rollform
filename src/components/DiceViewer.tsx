'use client';

import { useEffect, useRef, useState } from 'react';
import type { DiceConfig } from '@/lib/catalog';
import type { Vector3 } from 'three';
import { buildGeometry, buildRoundedGeometry, faceLabel, facePlacements } from '@/lib/diceGeometry';

export default function DiceViewer({ config }: { config: DiceConfig }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const viewerRef = useRef<{ update: (config: DiceConfig) => void } | null>(null);
  const [fallback, setFallback] = useState(false);
  configRef.current = config;

  useEffect(() => { viewerRef.current?.update(config); }, [config]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let closed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const THREE = await import('three');
        const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
        if (closed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
        camera.position.set(0, 0, 6.6);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        renderer.setClearColor(0xffffff, 0);
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
        host.append(canvas);

        const environment = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTarget = pmrem.fromScene(environment);
        scene.environment = envTarget.texture;
        pmrem.dispose();
        environment.dispose();

        const dice = new THREE.Group();
        dice.rotation.set(-0.38, 0.4, 0.12);
        scene.add(dice);
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(4, 6, 7);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.7);
        fill.position.set(-5, -3, -2);
        scene.add(fill);

        // One already-supported PBR material; no maps or physics engine needed for this prototype.
        const surface = new THREE.MeshStandardMaterial({
          color: '#191919', roughness: 0.37, metalness: 0.06,
        });
        let renderedShape: DiceConfig['shape'] | undefined;
        let renderedFont: DiceConfig['font'] | undefined;
        let normals: Vector3[] = [];
        const front = new THREE.Vector3(0, 0, 1);

        const clearShape = () => {
          dice.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
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
          clearShape();
          const original = buildGeometry(next.shape);
          const faces = facePlacements(original, next.shape);
          normals = faces.map(face => face.normal.clone());
          const rounded = buildRoundedGeometry(next.shape);
          dice.add(new THREE.Mesh(rounded, surface));
          const family = next.font === 'mono' ? 'monospace'
            : next.font === 'serif' ? 'Georgia, serif' : 'Inter, Arial, sans-serif';
          const width = ({ d4: 0.83, d6: 0.92, d8: 0.77, d10: 0.74,
            d12: 0.82, d20: 0.72, 'd%': 0.74 } as const)[next.shape];
          faces.forEach((face, index) => {
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
            const text = new THREE.Mesh(new THREE.PlaneGeometry(width, width), material);
            text.position.copy(face.center).addScaledVector(face.normal, 0.034);
            text.quaternion.setFromUnitVectors(front, face.normal);
            dice.add(text);
          });
          original.dispose();
          renderedShape = next.shape;
          renderedFont = next.font;
        };

        const duration = (token: string, fallback: number) => {
          const milliseconds = parseFloat(getComputedStyle(host).getPropertyValue(token));
          return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds / 1000 : fallback;
        };
        const lengths = [
          duration('--dice-anticipate-duration', 0.18),
          duration('--dice-roll-duration', 2.1),
          duration('--dice-settle-duration', 0.38),
          duration('--dice-hold-duration', 1.1),
        ];
        const states = ['anticipating', 'rolling', 'settling', 'resting'] as const;
        let state = 0, elapsed = 0, lastTime: number | null = null, lastFace = -1;
        const start = new THREE.Quaternion(), windup = new THREE.Quaternion();
        const target = new THREE.Quaternion(), mixed = new THREE.Quaternion();
        const spinA = new THREE.Quaternion(), spinB = new THREE.Quaternion();
        const axisA = new THREE.Vector3(), axisB = new THREE.Vector3();
        let turnsA = 1, turnsB = 1;
        const smooth = (t: number) => t * t * (3 - 2 * t);
        const easeOut = (t: number) => 1 - (1 - t) ** 3;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reduced = motion.matches, visible = true, lost = false, frame = 0;

        const prepare = () => {
          start.copy(dice.quaternion);
          const face = (lastFace + 1 + Math.floor(Math.random() * Math.max(1, normals.length - 1))) % normals.length;
          lastFace = face;
          axisA.set(1, Math.random() * 0.4, 0.3).normalize();
          axisB.set(0.2, 1, Math.random() * 0.4).normalize();
          turnsA = 1 + Math.floor(Math.random() * 2);
          turnsB = 1;
          target.setFromUnitVectors(normals[face], front);
          target.premultiply(new THREE.Quaternion().setFromAxisAngle(front, (Math.random() - 0.5) * 0.6));
          windup.copy(start).multiply(new THREE.Quaternion().setFromAxisAngle(axisA, -0.08));
        };

        const render = () => {
          if (!closed && !lost && visible && !document.hidden) renderer.render(scene, camera);
        };
        const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = null; };
        const tick = (time: number) => {
          frame = 0;
          if (closed || lost || !visible || document.hidden || reduced) return;
          elapsed += lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
          lastTime = time;
          const t = Math.min(1, elapsed / lengths[state]);
          if (state === 0) {
            dice.quaternion.copy(mixed.copy(start).slerp(windup, easeOut(t)));
          } else if (state === 1) {
            const progress = smooth(t);
            mixed.copy(windup).slerp(target, progress);
            spinA.setFromAxisAngle(axisA, 2 * Math.PI * turnsA * progress);
            spinB.setFromAxisAngle(axisB, 2 * Math.PI * turnsB * progress);
            dice.quaternion.copy(spinA).multiply(spinB).multiply(mixed);
            dice.position.y = 0.065 * Math.sin(Math.PI * t);
          } else if (state === 2) {
            const wobble = Math.sin(t * Math.PI * 2) * Math.exp(-5 * t) * 0.045;
            dice.quaternion.copy(target).multiply(spinA.setFromAxisAngle(axisB, wobble));
            dice.position.y = 0;
          } else {
            dice.quaternion.copy(target);
          }
          render();
          if (t >= 1) {
            elapsed = 0;
            state = (state + 1) % states.length;
            if (state === 0) prepare();
            host.dataset.motion = states[state];
          }
          frame = requestAnimationFrame(tick);
        };
        const wake = () => {
          if (closed || lost || !visible || document.hidden) return;
          if (reduced) { host.dataset.motion = 'paused'; dice.quaternion.copy(target); render(); return; }
          if (!frame) frame = requestAnimationFrame(tick);
        };
        const update = (next: DiceConfig) => {
          if (next.shape !== renderedShape || next.font !== renderedFont) {
            buildShape(next);
            state = 0; elapsed = 0;
            prepare();
            host.dataset.motion = states[state];
          }
          surface.color.set(next.shell === '#000000' ? '#191919' : next.shell);
          wake();
        };
        viewerRef.current = { update };
        update(configRef.current);

        const onMotion = () => {
          reduced = motion.matches;
          stop();
          if (!reduced) { state = 0; elapsed = 0; prepare(); host.dataset.motion = states[state]; }
          wake();
        };
        motion.addEventListener('change', onMotion);
        const onLost = (event: Event) => {
          event.preventDefault(); lost = true; stop();
          canvas.style.visibility = 'hidden'; setFallback(true);
        };
        const onRestored = () => {
          lost = false; canvas.style.visibility = ''; setFallback(false);
          resize(); wake();
        };
        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);
        const resize = () => {
          if (lost) return;
          const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
          renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
          render();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) wake(); else stop();
        });
        visibility.observe(host);
        const onVisibility = () => { if (document.hidden) stop(); else wake(); };
        document.addEventListener('visibilitychange', onVisibility);
        resize();
        wake();

        cleanup = () => {
          stop(); observer.disconnect(); visibility.disconnect();
          motion.removeEventListener('change', onMotion);
          document.removeEventListener('visibilitychange', onVisibility);
          canvas.removeEventListener('webglcontextlost', onLost);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          if (viewerRef.current?.update === update) viewerRef.current = null;
          clearShape(); surface.dispose(); envTarget.dispose(); renderer.dispose(); canvas.remove();
        };
        if (closed) cleanup();
        else setFallback(false);
      } catch (error) {
        if (!closed) { console.warn('3D preview unavailable', error); setFallback(true); }
      }
    })();
    return () => { closed = true; cleanup?.(); };
  }, []);

  return <div ref={hostRef} className="dice-canvas" role="img" data-motion="paused"
    aria-label={'3D модель ' + config.shape.toUpperCase() + ', автоматически перекатывается и останавливается гранью к зрителю'}>
    {fallback && <div className="canvas-fallback" style={{ backgroundColor: config.shell }}>{config.shape.toUpperCase()}</div>}
  </div>;
}
