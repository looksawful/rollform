'use client';

import { useEffect, useRef, useState } from 'react';
import { Orbit } from 'lucide-react';
import type { DiceConfig } from '@/lib/catalog';
import type { Vector3 } from 'three';
import { cssTimeSeconds } from '@/lib/cssTime';
import type { loadCastDie } from '@/lib/castDice';

export default function DiceViewer({ config, continuous = false }: { config: DiceConfig; continuous?: boolean }) {
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
        const [THREE, { gsap }, { loadCastDie }, { HDRLoader }, { OrbitControls }] = await Promise.all([
          import('three'), import('gsap'),
          import('@/lib/castDice'),
          import('three/addons/loaders/HDRLoader.js'),
          import('three/addons/controls/OrbitControls.js'),
        ]);
        if (closed) return;
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const environment = await new HDRLoader().loadAsync(`${basePath}/environments/studio-small-08-soft.hdr`)
          .catch(() => null);
        if (closed) { environment?.dispose(); return; }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
        camera.position.set(0, 0, continuous ? 10 : 6.6);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, continuous ? 1.25 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.setClearColor(0xffffff, 0);
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
        host.append(canvas);
        const controls = continuous ? null : new OrbitControls(camera, canvas);
        if (controls) {
          controls.enablePan = false;
          controls.enableDamping = false;
          controls.minDistance = 5.2;
          controls.maxDistance = 8.2;
          controls.zoomSpeed = 0.6;
          controls.enabled = false;
        }
        canvas.style.touchAction = 'pan-y';

        if (environment) {
          environment.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = environment;
        }

        const dice = new THREE.Group();
        dice.rotation.set(-0.38, 0.4, 0.12);
        scene.add(dice);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2ad, environment ? 0.95 : 1.6));

        let renderedKey: string | undefined, pendingKey: string | undefined;
        let cast: Awaited<ReturnType<typeof loadCastDie>> | undefined;
        let normals: Vector3[] = [];
        const front = new THREE.Vector3(0, 0, 1);
        const spin = new THREE.Quaternion();
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let visible = true, lost = false, request = 0, lastFace = -1;
        let lastPaint = 0;
        const frameInterval = continuous ? 33 : 0;
        let timeline: ReturnType<typeof gsap.timeline> | null = null;
        let interacted = false;

        const clearShape = () => {
          timeline?.kill();
          timeline = null;
          cast?.dispose();
          cast = undefined;
          dice.clear();
        };

        const buildShape = async (next: DiceConfig, shapeKey: string) => {
          const id = ++request;
          pendingKey = shapeKey;
          try {
            const model = await loadCastDie(next, basePath);
            if (closed || id !== request) { model.dispose(); return; }
            clearShape();
            cast = model;
            model.setShell(configRef.current.shell);
            normals = model.normals;
            dice.add(model.scene);
            renderedKey = shapeKey;
            pendingKey = undefined;
            lastFace = -1;
            setFallback(lost);
            play();
          } catch (error) {
            if (!closed && id === request) {
              pendingKey = undefined;
              console.warn('3D model unavailable', error);
              setFallback(true);
            }
          }
        };

        const duration = (name: string, fallback: number) =>
          cssTimeSeconds(getComputedStyle(host).getPropertyValue(name), fallback);
        const render = (force = false) => {
          const now = performance.now();
          if (closed || lost || !visible || document.hidden ||
            (continuous && !force && now - lastPaint < frameInterval)) return;
          lastPaint = now;
          renderer.render(scene, camera);
        };
        const play = () => {
          timeline?.kill();
          if (!normals.length) return;
          if (interacted) { host.dataset.motion = 'manual'; render(true); return; }
          if (continuous) {
            dice.rotation.set(-0.38, 0.4, 0.12);
            timeline = gsap.timeline({ repeat: -1 }).to(dice.rotation, {
              y: Math.PI * 2 + 0.4, duration: 12, ease: 'none',
              onStart: () => { host.dataset.motion = 'rolling'; },
              onUpdate: render,
            });
            if (motion.matches || !visible || document.hidden) {
              timeline.pause();
              if (motion.matches) host.dataset.motion = 'paused';
              render();
            }
            return;
          }
          const phase = { windup: 0, roll: 0, wobble: 0 };
          const start = new THREE.Quaternion(), target = new THREE.Quaternion();
          const axis = new THREE.Vector3(0.7, 1, 0.3).normalize();
          const choose = () => {
            start.copy(dice.quaternion);
            lastFace = (lastFace + 1 + Math.floor(Math.random() * Math.max(1, normals.length - 1))) % normals.length;
            target.setFromUnitVectors(normals[lastFace], front);
            target.premultiply(spin.setFromAxisAngle(front, (Math.random() - 0.5) * 0.6));
            axis.set(0.3 + Math.random(), 0.4 + Math.random(), 0.2 + Math.random()).normalize();
          };
          choose();
          timeline = gsap.timeline({
            repeat: -1,
            repeatDelay: duration('--dice-hold-duration', 2.2),
            onRepeat: choose,
          });
          timeline.fromTo(phase, { windup: 0 }, { windup: 1,
            duration: duration('--dice-anticipate-duration', 0.18),
            ease: 'sine.inOut', onStart: () => { host.dataset.motion = 'anticipating'; },
            onUpdate: () => {
              dice.quaternion.copy(start).multiply(spin.setFromAxisAngle(axis, -0.075 * phase.windup));
              render();
            },
          });
          timeline.fromTo(phase, { roll: 0 }, { roll: 1,
            duration: duration('--dice-roll-duration', 4.5),
            ease: 'sine.inOut', onStart: () => { host.dataset.motion = 'rolling'; },
            onUpdate: () => {
              dice.quaternion.copy(start).slerp(target, phase.roll);
              dice.quaternion.premultiply(spin.setFromAxisAngle(axis, Math.PI * 2 * phase.roll));
              dice.position.y = 0.06 * Math.sin(Math.PI * phase.roll);
              render();
            },
          });
          timeline.fromTo(phase, { wobble: 0.045 }, { wobble: 0,
            duration: duration('--dice-settle-duration', 0.38),
            ease: 'elastic.out(1, 0.3)',
            onStart: () => { host.dataset.motion = 'settling'; },
            onUpdate: () => {
              dice.quaternion.copy(target).multiply(spin.setFromAxisAngle(axis, phase.wobble));
              dice.position.y = 0;
              render();
            },
          });
          timeline.call(() => {
            dice.quaternion.copy(target);
            dice.position.y = 0;
            host.dataset.motion = 'resting';
            render();
          });
          if (motion.matches) {
            timeline.pause();
            dice.quaternion.copy(target);
            host.dataset.motion = 'paused';
            render();
          } else if (!visible || document.hidden) timeline.pause();
        };
        const stopAuto = () => {
          if (!controls) return;
          controls.enabled = true;
          canvas.style.touchAction = 'none';
          if (interacted) return;
          interacted = true;
          timeline?.kill();
          timeline = null;
          host.dataset.motion = 'manual';
          render(true);
        };
        const activate = (event: PointerEvent) => { if (event.pointerType === 'mouse') stopAuto(); };
        const tap = () => stopAuto();
        if (controls) {
          canvas.addEventListener('pointerdown', activate, true);
          canvas.addEventListener('click', tap);
        }
        const onKeyDown = (event: KeyboardEvent) => {
          if (!controls) return;
          const step = 0.15;
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          stopAuto();
          if (event.key === 'ArrowLeft') dice.rotation.y -= step;
          if (event.key === 'ArrowRight') dice.rotation.y += step;
          if (event.key === 'ArrowUp') dice.rotation.x -= step;
          if (event.key === 'ArrowDown') dice.rotation.x += step;
          render(true);
        };
        controls?.addEventListener('start', stopAuto);
        controls?.addEventListener('change', () => render(true));
        if (controls) host.addEventListener('keydown', onKeyDown);
        const update = (next: DiceConfig) => {
          const shapeKey = `${next.shape}/${next.font}`;
          if (shapeKey !== renderedKey) {
            if (shapeKey !== pendingKey) void buildShape(next, shapeKey);
            return;
          }
          if (pendingKey) { request++; pendingKey = undefined; }
          cast?.setShell(next.shell);
          setFallback(lost);
          render();
        };
        viewerRef.current = { update };
        update(configRef.current);

        const onMotion = () => {
          if (motion.matches) { timeline?.pause(); host.dataset.motion = 'paused'; }
          else if (visible && !document.hidden) {
            timeline?.resume();
            if (continuous) host.dataset.motion = 'rolling';
          }
          render();
        };
        motion.addEventListener('change', onMotion);
        const onLost = (event: Event) => {
          event.preventDefault();
          lost = true;
          timeline?.pause();
          canvas.style.visibility = 'hidden';
          setFallback(true);
        };
        const onRestored = () => {
          lost = false;
          canvas.style.visibility = '';
          setFallback(false);
          resize();
          onMotion();
        };
        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);
        const resize = () => {
          if (lost) return;
          const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
          renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
          render(true);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.intersectionRatio > 0.12;
          if (visible && !document.hidden && !motion.matches) timeline?.resume();
          else timeline?.pause();
          if (visible) render(true);
        }, { threshold: [0, 0.12] });
        visibility.observe(host);
        const onVisibility = () => {
          if (document.hidden) timeline?.pause();
          else if (visible && !motion.matches) timeline?.resume();
        };
        document.addEventListener('visibilitychange', onVisibility);
        resize();

        cleanup = () => {
          request++;
          timeline?.kill();
          controls?.dispose();
          canvas.removeEventListener('pointerdown', activate, true);
          canvas.removeEventListener('click', tap);
          host.removeEventListener('keydown', onKeyDown);
          observer.disconnect();
          visibility.disconnect();
          motion.removeEventListener('change', onMotion);
          document.removeEventListener('visibilitychange', onVisibility);
          canvas.removeEventListener('webglcontextlost', onLost);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          if (viewerRef.current?.update === update) viewerRef.current = null;
          clearShape();
          environment?.dispose();
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
  }, []);

  return <div ref={hostRef} className="dice-canvas" role={continuous ? 'img' : 'group'} tabIndex={continuous ? undefined : 0} data-motion="paused"
    aria-label={'3D-модель ' + config.shape.toUpperCase() + (continuous ? '' : '. Вращение перетаскиванием или стрелками, масштаб колёсиком.')}>
    {!continuous && <span className="dice-preview-badge" aria-hidden="true">
      <Orbit className="icon" />3D-превью
    </span>}
    {fallback && <div className="canvas-fallback" style={{ backgroundColor: config.shell }}>{config.shape.toUpperCase()}</div>}
  </div>;
}
