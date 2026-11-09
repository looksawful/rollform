'use client';

import { useEffect, useRef, useState } from 'react';
import { Orbit } from 'lucide-react';
import CubeOutline from './CubeOutline';
import type { DiceConfig } from '@/lib/catalog';
import type { Vector3 } from 'three';
import { cssTimeSeconds } from '@/lib/cssTime';
import type { loadCastDie } from '@/lib/castDice';
import type { createConfigureMotion } from '@/lib/configureMotion';

export default function DiceViewer({ config, continuous = false, animateConfig = false }: { config: DiceConfig; continuous?: boolean; animateConfig?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const viewerRef = useRef<{ update: (config: DiceConfig) => void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  configRef.current = config;

  useEffect(() => { viewerRef.current?.update(config); }, [config]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let closed = false;
    setStatus('loading');
    setProgress(0);
    const slowLoad = window.setTimeout(() => { if (!closed) setStatus(current => current === 'loading' ? 'error' : current); }, 15000);
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [THREE, { gsap }, { loadCastDie }, { HDRLoader }, { OrbitControls }, { colorRimLight }, transitionModule] = await Promise.all([
          import('three'), import('gsap'),
          import('@/lib/castDice'),
          import('three/addons/loaders/HDRLoader.js'),
          import('three/addons/controls/OrbitControls.js'),
          import('@/lib/rimLight'),
          animateConfig ? import('@/lib/configureMotion') : null,
        ]);
        if (closed) return;
        setProgress(25);
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const environment = await new HDRLoader().loadAsync(`${basePath}/environments/catalog-rim.hdr`)
          .catch(() => null);
        if (closed) { environment?.dispose(); return; }

        setProgress(50);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
        camera.position.set(0, 0, continuous ? 10 : 6.6);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, continuous ? 1.25 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = environment ? 0.76 : 1;
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

        let litShell: DiceConfig['shell'] | undefined;

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
        let lastPaint = 0, needsFirstFrame = false;
        const frameInterval = continuous ? 33 : 0;
        let timeline: ReturnType<typeof gsap.timeline> | null = null;
        let interacted = false;

        let configMotion: ReturnType<typeof createConfigureMotion> | undefined;
        const stopRoll = () => {
          timeline?.kill();
          timeline = null;
        };
        const clearShape = () => {
          stopRoll();
          cast?.dispose();
          cast = undefined;
          dice.clear();
        };

        const install = (model: Awaited<ReturnType<typeof loadCastDie>>) => {
          clearShape();
          cast = model;
          normals = model.normals;
          dice.add(model.scene);
          lastFace = -1;
          needsFirstFrame = true;
        };
        const light = (shell: DiceConfig['shell']) => {
          if (!environment || litShell === shell) return;
          const previous = scene.environment;
          scene.environment = colorRimLight(environment, shell);
          previous?.dispose();
          litShell = shell;
        };

        const buildShape = async (next: DiceConfig, shapeKey: string) => {
          const id = ++request;
          pendingKey = shapeKey;
          const firstModel = !cast;
          if (firstModel) {
            setStatus('loading');
            setProgress(50);
          }
          try {
            let completed = 0;
            const model = await loadCastDie(next, basePath, () => {
              if (firstModel && !closed && id === request) setProgress(50 + ++completed * 20);
            }, animateConfig);
            if (closed || id !== request) { model.dispose(); return; }
            model.setShell(configRef.current.shell);
            install(model);
            renderedKey = shapeKey;
            pendingKey = undefined;
            play();
            configMotion?.initialize(model, { ...next, shell: configRef.current.shell });
            configMotion?.update(configRef.current);
          } catch (error) {
            if (!closed && id === request) {
              pendingKey = undefined;
              console.warn('3D model unavailable', error);
              setStatus('error');
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
          if (needsFirstFrame) {
            needsFirstFrame = false;
            setStatus('ready');
          }
        };
        const play = (keepPose = false) => {
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
              render(true);
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
          timeline.fromTo(phase, { windup: 0 }, { windup: 1, immediateRender: false,
            duration: duration('--dice-anticipate-duration', 0.18),
            ease: 'sine.inOut', onStart: () => { host.dataset.motion = 'anticipating'; },
            onUpdate: () => {
              dice.quaternion.copy(start).multiply(spin.setFromAxisAngle(axis, -0.075 * phase.windup));
              render();
            },
          });
          timeline.fromTo(phase, { roll: 0 }, { roll: 1, immediateRender: false,
            duration: duration('--dice-roll-duration', 4.5),
            ease: 'sine.inOut', onStart: () => { host.dataset.motion = 'rolling'; },
            onUpdate: () => {
              dice.quaternion.copy(start).slerp(target, phase.roll);
              dice.quaternion.premultiply(spin.setFromAxisAngle(axis, Math.PI * 2 * phase.roll));
              dice.position.y = 0.06 * Math.sin(Math.PI * phase.roll);
              render();
            },
          });
          timeline.fromTo(phase, { wobble: 0.045 }, { wobble: 0, immediateRender: false,
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
            if (!keepPose) dice.quaternion.copy(target);
            host.dataset.motion = 'paused';
            render();
          } else if (!visible || document.hidden) timeline.pause();
        };
        const stopAuto = () => {
          if (!controls) return;
          controls.enabled = true;
          canvas.style.touchAction = 'none';
          if (interacted) {
            configMotion?.finishThrow();
            return;
          }
          interacted = true;
          stopRoll();
          configMotion?.finishThrow();
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
        configMotion = transitionModule?.createConfigureMotion({
          dice, basePath, install, light, stop: stopRoll, resume: () => play(true), render,
          prepareTexture: texture => { if (!lost && visible && !document.hidden) renderer.initTexture(texture); },
          reduced: () => motion.matches,
          canRender: () => !closed && !lost && visible && !document.hidden,
          ready: () => { if (!needsFirstFrame && !lost) setStatus('ready'); },
          unavailable: error => { console.warn('3D option unavailable', error); },
        });
        const update = (next: DiceConfig) => {
          if (configMotion && cast) { configMotion.update(next); return; }
          light(next.shell);
          const shapeKey = `${next.shape}/${next.font}`;
          if (shapeKey !== renderedKey) {
            if (shapeKey !== pendingKey) void buildShape(next, shapeKey);
            return;
          }
          if (pendingKey) { request++; pendingKey = undefined; }
          cast?.setShell(next.shell);
          if (!needsFirstFrame) setStatus(lost ? 'error' : 'ready');
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
          configMotion?.playback();
          render();
        };
        motion.addEventListener('change', onMotion);
        const onLost = (event: Event) => {
          event.preventDefault();
          lost = true;
          timeline?.pause();
          configMotion?.playback();
          canvas.style.visibility = 'hidden';
          setStatus('error');
        };
        const onRestored = () => {
          lost = false;
          canvas.style.visibility = '';
          setStatus(cast && !needsFirstFrame ? 'ready' : 'loading');
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
          configMotion?.playback();
          if (visible) render(true);
        }, { threshold: [0, 0.12] });
        visibility.observe(host);
        const onVisibility = () => {
          if (document.hidden) timeline?.pause();
          else if (visible) {
            if (!motion.matches) timeline?.resume();
            if (needsFirstFrame) render(true);
          }
          configMotion?.playback();
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
          configMotion?.dispose();
          clearShape();
          scene.environment?.dispose();
          environment?.dispose();
          renderer.dispose();
          canvas.remove();
        };
        if (closed) cleanup();
      } catch (error) {
        if (!closed) { console.warn('3D preview unavailable', error); setStatus('error'); }
      }
    })();
    return () => { closed = true; window.clearTimeout(slowLoad); cleanup?.(); };
  }, []);

  return <div ref={hostRef} className="dice-canvas" role={continuous && status !== 'loading' ? 'img' : 'group'} tabIndex={continuous ? undefined : 0} data-motion="paused"
    aria-label={'3D-модель ' + config.shape.toUpperCase() + (continuous ? '' : '. Вращение перетаскиванием или стрелками, масштаб колёсиком.')}>
    {!continuous && status !== 'loading' && <span className="dice-preview-badge" aria-hidden="true">
      <Orbit className="icon" />3D-превью
    </span>}
    {status === 'loading' && <div className="dice-loader" role="progressbar" aria-label="Загрузка 3D-модели" aria-valuenow={progress}>
      <CubeOutline />
      <span aria-hidden="true">{progress}%</span>
    </div>}
    {status === 'error' && <div className="canvas-fallback" style={{ backgroundColor: config.shell }} aria-hidden="true">{config.shape.toUpperCase()}</div>}
    {!continuous && <span className="dice-preview-status" role="status" aria-live="polite">{status === 'error' ? '3D недоступно. Показан упрощённый вид кубика.' : ''}</span>}
  </div>;
}
