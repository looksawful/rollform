'use client';

import { useEffect, useRef, useState } from 'react';
import type { DiceConfig } from '@/lib/catalog';
import type { Vector3, Mesh } from 'three';
import { buildGeometry, faceLabel, facePlacements } from '@/lib/diceGeometry';
import { cssTimeSeconds } from '@/lib/cssTime';

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
        const [THREE, { gsap }, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('gsap'),
          import('three/addons/loaders/GLTFLoader.js'),
          import('three/addons/environments/RoomEnvironment.js'),
        ]);
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
        const spin = new THREE.Quaternion();
        const loader = new GLTFLoader();
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let visible = true, lost = false, request = 0, lastFace = -1;
        let timeline: ReturnType<typeof gsap.timeline> | null = null;

        const clearShape = () => {
          timeline?.kill();
          timeline = null;
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

        const buildShape = async (next: DiceConfig) => {
          const id = ++request;
          const key = next.shape === 'd%' ? 'd10' : next.shape;
          const asset = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/models/' + key + '.glb';
          try {
            const gltf = await loader.loadAsync(asset);
            if (closed || id !== request) return;
            const model = gltf.scene.getObjectByProperty('isMesh', true) as Mesh | undefined;
            if (!model) throw Error('Missing GLB mesh');
            gltf.scene.updateMatrixWorld(true);
            const geometry = model.geometry.clone().applyMatrix4(model.matrixWorld);
            const original = buildGeometry(next.shape);
            const faces = facePlacements(original, next.shape);
            original.dispose();
            clearShape();
            normals = faces.map(face => face.normal.clone());
            dice.add(new THREE.Mesh(geometry, surface));
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
            renderedShape = next.shape;
            renderedFont = next.font;
            lastFace = -1;
            setFallback(false);
            play();
          } catch (error) {
            if (!closed && id === request) {
              console.warn('3D model unavailable', error);
              setFallback(true);
            }
          }
        };

        const duration = (name: string, fallback: number) =>
          cssTimeSeconds(getComputedStyle(host).getPropertyValue(name), fallback);
        const render = () => {
          if (!closed && !lost && visible && !document.hidden) renderer.render(scene, camera);
        };
        const play = () => {
          timeline?.kill();
          if (!normals.length) return;
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
        const update = (next: DiceConfig) => {
          surface.color.set(next.shell === '#000000' ? '#191919' : next.shell);
          if (next.shape !== renderedShape || next.font !== renderedFont) void buildShape(next);
          else render();
        };
        viewerRef.current = { update };
        update(configRef.current);

        const onMotion = () => {
          if (motion.matches) { timeline?.pause(); host.dataset.motion = 'paused'; }
          else if (visible && !document.hidden) timeline?.resume();
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
          render();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !document.hidden && !motion.matches) timeline?.resume();
          else timeline?.pause();
          if (visible) render();
        });
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
          observer.disconnect();
          visibility.disconnect();
          motion.removeEventListener('change', onMotion);
          document.removeEventListener('visibilitychange', onVisibility);
          canvas.removeEventListener('webglcontextlost', onLost);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          if (viewerRef.current?.update === update) viewerRef.current = null;
          clearShape();
          surface.dispose();
          envTarget.dispose();
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

  return <div ref={hostRef} className="dice-canvas" role="img" data-motion="paused"
    aria-label={'3D-модель ' + config.shape.toUpperCase()}>
    {fallback && <div className="canvas-fallback" style={{ backgroundColor: config.shell }}>{config.shape.toUpperCase()}</div>}
  </div>;
}
