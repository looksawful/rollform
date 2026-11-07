'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildGeometry, faceLabel, facePlacements } from '@/lib/diceGeometry';
import { configFromParams, diceShapes, fontNames, fontStyles, initialConfig, shellColors } from '@/lib/catalog';
import type { DiceConfig } from '@/lib/catalog';

type Finish = 'original' | 'polished' | 'pbr' | 'translucent' | 'clear' | 'frosted' | 'scratched' | 'epoxy-ruby' | 'epoxy-cherry' | 'epoxy-bubbles';
type Engraving = 'classic' | 'nova-flat' | 'square-antiqua' | 'simply-serif' | 'simply-mono';
type Variant = DiceConfig & { finish: Finish; engraving: Engraving };
const engravings: { id: Engraving; title: string }[] = [
  { id: 'classic', title: 'Базовый' },
  { id: 'nova-flat', title: 'Nova Flat' },
  { id: 'square-antiqua', title: 'Square Antiqua' },
  { id: 'simply-serif', title: 'Simply Serif' },
  { id: 'simply-mono', title: 'Simply Mono' },
];

const finishes: { id: Finish; name: string; detail: string }[] = [
  { id: 'original', name: 'Исходный', detail: 'Существующий сатиновый материал сайта для сравнения.' },
  { id: 'polished', name: 'Полированный', detail: 'Непрозрачный литой акрил с чёткими отражениями и защитным блеском.' },
  { id: 'pbr', name: 'PBR-пластик', detail: 'Реальные CC0-карты roughness / normal от ambientCG, перекрашенные в цвет кубика.' },
  { id: 'translucent', name: 'Полупрозрачный', detail: 'Окрашенный акрил с частичным светопропусканием и поглощением в объёме.' },
  { id: 'clear', name: 'Прозрачный', detail: 'Глянцевый акрил с преломлением и объёмным цветом.' },
  { id: 'frosted', name: 'Матированный', detail: 'Светорассеивающий полупрозрачный акрил.' },
  { id: 'scratched', name: 'Микроцарапины', detail: 'Тонкие следы эксплуатации по карте нормалей Scratches005, ambientCG.' },
  { id: 'epoxy-ruby', name: 'Смола · рубин', detail: 'Прозрачная тёпло-красная эпоксидная смола; реальные углублённые цифры и оптическая глубина. По фото образца D8.' },
  { id: 'epoxy-cherry', name: 'Смола · чёрная вишня', detail: 'Чёрный пигмент и красный просвет, неоднородная окраска, золотые цифры. По фото образца D20.' },
  { id: 'epoxy-bubbles', name: 'Смола · пузырьки', detail: 'Прозрачная красная смола с небольшим количеством пузырьков и включений внутри объёма.' },
];
const DEFAULT: Variant = { ...initialConfig, finish: 'polished', engraving: 'classic' };
const epoxyFinishes = finishes.filter(finish => finish.id.startsWith('epoxy-'));
const acrylicFinishes = finishes.filter(finish => !finish.id.startsWith('epoxy-'));
const pigmentFor = (finish: Finish): DiceConfig['shell'] =>
  finish === 'epoxy-cherry' ? '#000000' : '#A62D35';
const variants: Variant[] = diceShapes.flatMap(shape => [
  ...shellColors.flatMap(color =>
    fontStyles.flatMap(font =>
      acrylicFinishes.map(finish => ({ shape, shell: color.value, font, finish: finish.id, engraving: 'classic' as const }))
    )
  ),
  ...epoxyFinishes.flatMap(finish => engravings.map(engraving => ({
    shape, shell: pigmentFor(finish.id), font: 'grotesk' as const,
    finish: finish.id, engraving: engraving.id,
  }))),
]);
const textureByColor: Record<DiceConfig['shell'], string> = {
  '#000000': 'Plastic006', '#196641': 'Plastic009',
  '#A62D35': 'Plastic007', '#215BA8': 'Plastic008',
};
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function DieStage({ config }: { config: Variant }) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<{ update: (next: Variant) => void } | null>(null);
  const latest = useRef(config);
  const [failed, setFailed] = useState(false);
  latest.current = config;
  useEffect(() => { viewer.current?.update(config); }, [config]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor('#e8e9e7', 1);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8e9e7');
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
    camera.position.set(0, 0.45, 8.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 4.7;
    controls.maxDistance = 11;
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.75;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(4, 7, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdde9ff, 1.7);
    rim.position.set(-5, -1, -5);
    scene.add(rim);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(environment);
    scene.environment = envTarget.texture;
    pmrem.dispose();
    environment.dispose();

    // Real scene geometry behind the dice is required for Three.js transmission.
    const bg = document.createElement('canvas');
    bg.width = 512; bg.height = 512;
    const bgctx = bg.getContext('2d');
    if (bgctx) {
      bgctx.fillStyle = '#eceeed'; bgctx.fillRect(0, 0, 512, 512);
      bgctx.fillStyle = '#d1d6d8'; bgctx.fillRect(0, 0, 125, 512);
      bgctx.fillStyle = '#bfc9cc'; bgctx.fillRect(392, 0, 120, 512);
      bgctx.fillStyle = '#e2e4e0'; bgctx.fillRect(235, 0, 40, 512);
    }
    const bgTexture = new THREE.CanvasTexture(bg);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    const backing = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: bgTexture }));
    backing.position.z = -4.4;
    scene.add(backing);

    const dice = new THREE.Group();
    dice.rotation.set(-0.22, 0.25, 0.08);
    scene.add(dice);
    const inclusions = new THREE.Group();
    dice.add(inclusions);
    const bubbleGeometry = new THREE.SphereGeometry(1, 12, 8);
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: '#fff1ed', roughness: 0.03, metalness: 0,
      transmission: 0.88, ior: 1.02, thickness: 0.07, clearcoat: 0.9,
    });
    const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 18);
    const fleckGeometry = new THREE.TetrahedronGeometry(1);
    const fleckMaterial = new THREE.MeshStandardMaterial({ color: '#dcae55', roughness: 0.28, metalness: 0.68 });
    const flecks = new THREE.InstancedMesh(fleckGeometry, fleckMaterial, 24);
    inclusions.add(bubbles, flecks);
    const dummy = new THREE.Object3D();
    // Deterministic particles, kept well inside the minimum inscribed sphere of every shape.
    let randomState = 17303;
    const random = () => ((randomState = (1664525 * randomState + 1013904223) >>> 0) / 4294967296);
    for (const [mesh, count, minSize, maxSize] of [[bubbles, 18, 0.012, 0.055], [flecks, 24, 0.006, 0.025]] as const) {
      for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2;
        const z = (random() * 2 - 1) * 0.52;
        const r = Math.sqrt(Math.max(0, 1 - z * z)) * random() * 0.57;
        dummy.position.set(Math.cos(angle) * r, Math.sin(angle) * r, z);
        const size = minSize + random() * (maxSize - minSize);
        dummy.scale.setScalar(size);
        dummy.rotation.set(random() * 3, random() * 3, random() * 3);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    const surface = new THREE.MeshPhysicalMaterial({ color: 0x181818, roughness: 0.1, metalness: 0, ior: 1.49 });
    const goldMaterial = new THREE.MeshStandardMaterial({ color: '#c89a4a', metalness: 0.72, roughness: 0.25 });
    // Opaque internal pigment mass provides real volumetric-looking red/black swirls
    // behind the transmitting epoxy shell (rather than a flat surface texture).
    const pigmentMaterial = new THREE.ShaderMaterial({
      vertexShader: [
        'varying vec3 vPigmentPos;',
        'void main() {',
        '  vPigmentPos = position;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vPigmentPos;',
        'void main() {',
        '  vec3 p = vPigmentPos;',
        '  float wave = sin(11.0*p.x + 8.0*p.y + sin(8.0*p.z + p.x*3.0)*3.0);',
        '  float filament = sin(19.0*p.y + 7.0*p.z + sin(6.0*p.x)*4.0);',
        '  float ink = smoothstep(-0.38, 0.46, 0.74*wave + 0.26*filament);',
        '  float glow = smoothstep(0.13, 0.98, sin(5.0*p.y-3.0*p.z+2.1*p.x));',
        '  vec3 nearBlack = vec3(0.012,0.004,0.008);',
        '  vec3 red = vec3(0.58,0.008,0.026);',
        '  vec3 color = mix(red, nearBlack, ink);',
        '  color += vec3(0.20,0.002,0.007)*glow*(1.0-ink);',
        '  gl_FragColor = vec4(color, 1.0);',
        '}',
      ].join('\n'),
      side: THREE.FrontSide,
      depthWrite: true,
    });
    const glbLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    type LoadedShape = { body: THREE.BufferGeometry; inlay: THREE.BufferGeometry | null };
    const shapes = new Map<string, Promise<LoadedShape>>();
    const textures = new Map<string, Promise<THREE.Texture>>();
    let built = '';
    let shapeRevision = 0;
    let finishRevision = 0;
    let alive = true;
    let frame = 0;
    let visible = true;

    function geometryFor(shape: DiceConfig['shape'], epoxy: boolean, engraving: Engraving) {
      const name = shape === 'd%' ? (epoxy ? 'd00' : 'd10') : shape;
      const folder = epoxy
        ? (engraving === 'classic' ? 'epoxy' : 'epoxy-font/' + engraving)
        : 'material-lab';
      const key = folder + '/' + name;
      if (!shapes.has(key)) {
        shapes.set(key, glbLoader.loadAsync(basePath + '/models/' + folder + '/' + name + '.glb').then(gltf => {
          gltf.scene.updateMatrixWorld(true);
          const meshes: THREE.Mesh[] = [];
          gltf.scene.traverse(obj => { if (obj instanceof THREE.Mesh) meshes.push(obj); });
          const main = meshes.find(obj => obj.name.toLowerCase().startsWith('d')) ?? meshes[0];
          if (!main) throw new Error('Missing mesh: ' + name);
          const inlay = meshes.find(obj => obj !== main) ?? null;
          return {
            body: main.geometry.clone().applyMatrix4(main.matrixWorld),
            inlay: inlay ? inlay.geometry.clone().applyMatrix4(inlay.matrixWorld) : null,
          };
        }));
      }
      return shapes.get(key)!;
    }

    function textureFor(name: string) {
      if (!textures.has(name)) {
        textures.set(name, textureLoader.loadAsync(basePath + '/material-lab-textures/' + name + '.webp').then(t => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
          return t;
        }));
      }
      return textures.get(name)!;
    }

    function clearDice() {
      for (const child of dice.children) {
        if (!(child instanceof THREE.Mesh)) continue;
        child.geometry.dispose();
        if (child.material !== surface && child.material !== goldMaterial && child.material !== pigmentMaterial) {
          const m = child.material as THREE.MeshBasicMaterial;
          m.map?.dispose();
          m.dispose();
        }
      }
      dice.clear();
      dice.add(inclusions);
    }

    async function build(next: Variant) {
      const revision = ++shapeRevision;
      const epoxy = next.finish.startsWith('epoxy-');
      const key = next.shape + '/' + next.font + '/' + (epoxy ? 'epoxy-' + next.engraving : 'acrylic');
      try {
        const model = await geometryFor(next.shape, epoxy, next.engraving);
        const geometry = model.body.clone();
        const inlayGeometry = model.inlay?.clone() ?? null;
        if (!alive || revision !== shapeRevision) {
          geometry.dispose();
          inlayGeometry?.dispose();
          return;
        }
        const canonical = buildGeometry(next.shape);
        const faces = facePlacements(canonical, next.shape);
        canonical.dispose();
        clearDice();
        dice.add(new THREE.Mesh(geometry, surface));
        if (epoxy) {
          const pigment = new THREE.Mesh(geometry.clone(), pigmentMaterial);
          pigment.name = 'PigmentCore';
          pigment.scale.setScalar(0.86);
          pigment.visible = next.finish === 'epoxy-cherry';
          dice.add(pigment);
        }
        if (epoxy && inlayGeometry) {
          const gold = new THREE.Mesh(inlayGeometry, goldMaterial);
          gold.name = 'GoldInlay';
          gold.visible = next.finish !== 'epoxy-ruby';
          dice.add(gold);
        } else inlayGeometry?.dispose();
        // Number geometry and gold inlay carry the actual licensed font outlines.
        if (epoxy && (inlayGeometry || next.finish !== 'epoxy-cherry')) {
          built = key;
          setFailed(false);
          return;
        }
        const family = next.font === 'mono' ? 'monospace'
          : next.font === 'serif' ? 'Georgia, serif' : 'Inter, Arial, sans-serif';
        const width = ({ d4: 0.83, d6: 0.92, d8: 0.77, d10: 0.74, d12: 0.82, d20: 0.72, 'd%': 0.74 } as const)[next.shape];
        for (const [index, face] of faces.entries()) {
          const textCanvas = document.createElement('canvas');
          textCanvas.width = textCanvas.height = 256;
          const context = textCanvas.getContext('2d');
          if (!context) continue;
          const label = faceLabel(next.shape, index);
          context.font = '700 ' + (label.length > 1 ? 120 : 156) + 'px ' + family;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = epoxy ? '#dfad65' : '#ffffff';
          context.fillText(label, 128, 135);
          const map = new THREE.CanvasTexture(textCanvas);
          map.colorSpace = THREE.SRGBColorSpace;
          const mat = new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
          const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width), mat);
          labelMesh.position.copy(face.center).addScaledVector(face.normal, epoxy ? 0.018 : 0.04);
          labelMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
          dice.add(labelMesh);
        }
        built = key;
        setFailed(false);
      } catch (error) {
        if (alive && revision === shapeRevision) {
          console.warn('Acrylic UV geometry unavailable:', error);
          setFailed(true);
        }
      }
    }

    async function applyFinish(next: Variant) {
      const revision = ++finishRevision;
      const color = next.shell === '#000000' ? '#1b1c1e' : next.shell;
      surface.color.set(color);
      surface.roughness = 0.11;
      surface.metalness = 0;
      surface.clearcoat = 0.5;
      surface.clearcoatRoughness = 0.1;
      surface.transmission = 0;
      surface.thickness = 0;
      surface.ior = 1.49;
      surface.attenuationColor.set('#ffffff');
      surface.attenuationDistance = Infinity;
      surface.roughnessMap = null;
      surface.normalMap = null;
      surface.normalScale.set(0.06, 0.06);
      surface.onBeforeCompile = () => {};
      surface.customProgramCacheKey = () => 'epoxy-standard';
      bubbles.visible = next.finish === 'epoxy-bubbles';
      flecks.visible = next.finish === 'epoxy-cherry';
      const inlay = dice.getObjectByName('GoldInlay');
      if (inlay) inlay.visible = next.finish !== 'epoxy-ruby';
      const core = dice.getObjectByName('PigmentCore');
      if (core) core.visible = next.finish === 'epoxy-cherry';
      if (next.finish === 'epoxy-ruby' || next.finish === 'epoxy-bubbles') {
        surface.color.set('#a80012');
        surface.metalness = 0;
        surface.transmission = 0.84;
        surface.ior = 1.54;
        surface.roughness = 0.045;
        surface.thickness = 2.45;
        surface.attenuationColor.set('#bd0016');
        surface.attenuationDistance = 1.1;
        surface.clearcoat = 0.9;
        surface.clearcoatRoughness = 0.02;
      } else if (next.finish === 'epoxy-cherry') {
        surface.color.set('#38060d');
        surface.metalness = 0;
        surface.transmission = 0.58;
        surface.ior = 1.54;
        surface.roughness = 0.075;
        surface.thickness = 2.25;
        surface.attenuationColor.set('#790013');
        surface.attenuationDistance = 0.7;
        surface.clearcoat = 0.8;
        surface.clearcoatRoughness = 0.03;
        surface.onBeforeCompile = shader => {
          shader.vertexShader = shader.vertexShader.replace('#include <common>',
            '#include <common>\nvarying vec3 vInkPosition;');
          shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvInkPosition = position;');
          shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
            '#include <common>\nvarying vec3 vInkPosition;');
          shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
            float wave = sin(vInkPosition.x * 4.7 + sin(vInkPosition.z * 5.2) * 1.8 + vInkPosition.y * 7.6);
            float wave2 = sin(vInkPosition.z * 12.0 + vInkPosition.y * 3.9);
            float blackInk = 1.0 - smoothstep(-0.1, 0.52, wave * 0.78 + wave2 * 0.22);
            diffuseColor.rgb *= mix(vec3(1.0, 0.65, 0.65), vec3(0.08, 0.14, 0.16), blackInk * 0.95);`);
        };
        surface.customProgramCacheKey = () => 'epoxy-cherry-ink-v1';
      } else if (next.finish === 'original') {
        surface.roughness = 0.37; surface.metalness = 0.06; surface.clearcoat = 0;
      } else if (next.finish === 'polished') {
        surface.roughness = 0.07; surface.clearcoat = 0.85;
      } else if (next.finish === 'pbr') {
        surface.roughness = 0.48; surface.clearcoat = 0.65;
      } else if (next.finish === 'scratched') {
        surface.roughness = 0.12; surface.clearcoat = 0.7;
        surface.normalScale.set(0.025, 0.025);
      } else {
        surface.color.set('#ffffff');
        surface.transmission = next.finish === 'clear' ? 0.96 : next.finish === 'frosted' ? 0.72 : 0.62;
        surface.roughness = next.finish === 'frosted' ? 0.42 : next.finish === 'clear' ? 0.045 : 0.17;
        surface.thickness = 2.4;
        surface.clearcoat = 0.25;
        surface.attenuationColor.set(next.shell === '#000000' ? '#51545b' : next.shell);
        surface.attenuationDistance = next.finish === 'clear' ? 3.2 : 2.4;
      }
      surface.needsUpdate = true;
      const asset = textureByColor[next.shell];
      try {
        if (next.finish === 'pbr') {
          const [rough, normal] = await Promise.all([
            textureFor(asset + '_Roughness'), textureFor(asset + '_NormalGL'),
          ]);
          if (!alive || revision !== finishRevision) return;
          surface.roughnessMap = rough;
          surface.normalMap = normal;
        } else if (next.finish === 'scratched') {
          const normal = await textureFor('Scratches005_NormalGL');
          if (!alive || revision !== finishRevision) return;
          surface.normalMap = normal;
        }
        if (revision === finishRevision) surface.needsUpdate = true;
      } catch (error) {
        console.warn('PBR map unavailable, showing untextured finish:', error);
      }
    }

    viewer.current = {
      update(next) {
        void applyFinish(next);
        const epoxy = next.finish.startsWith('epoxy-');
        const geometryKey = next.shape + '/' + next.font + '/' + (epoxy ? 'epoxy-' + next.engraving : 'acrylic');
        if (built !== geometryKey) void build(next);
      },
    };
    viewer.current.update(latest.current);

    const resize = () => {
      if (!alive) return;
      const w = Math.max(1, element.clientWidth);
      const h = Math.max(1, element.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 });
    intersection.observe(element);
    const draw = () => {
      if (!alive) return;
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    };
    draw();
    const onContextLost = (event: Event) => { event.preventDefault(); setFailed(true); };
    const onContextRestored = () => { setFailed(false); resize(); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    return () => {
      alive = false;
      shapeRevision++;
      finishRevision++;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      clearDice();
      for (const result of shapes.values()) void result.then(geo => {
        geo.body.dispose(); geo.inlay?.dispose();
      }).catch(() => {});
      for (const result of textures.values()) void result.then(tex => tex.dispose()).catch(() => {});
      surface.dispose();
      goldMaterial.dispose();
      pigmentMaterial.dispose();
      bubbleGeometry.dispose();
      bubbleMaterial.dispose();
      fleckGeometry.dispose();
      fleckMaterial.dispose();
      backing.geometry.dispose();
      (backing.material as THREE.Material).dispose();
      bgTexture.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      viewer.current = null;
    };
  }, []);

  return <div className="ml-stage" ref={host} aria-label={'Интерактивный 3D-кубик ' + config.shape.toUpperCase()} role="group">
    <span className="ml-stage-hint">3D · вращай мышью или пальцем · масштабируй колёсиком</span>
    {failed && <p className="ml-stage-error">Не удалось загрузить WebGL или модель.</p>}
  </div>;
}

export default function MaterialLab() {
  const [config, setConfig] = useState<Variant>(DEFAULT);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = configFromParams(params);
    const finish = finishes.find(f => f.id === params.get('finish'))?.id ?? DEFAULT.finish;
    const engraving = engravings.find(f => f.id === params.get('engraving'))?.id ?? DEFAULT.engraving;
    setConfig(finish.startsWith('epoxy-')
      ? { ...parsed, shell: pigmentFor(finish), font: 'grotesk', finish, engraving }
      : { ...parsed, finish, engraving: 'classic' });
  }, []);

  const change = (update: Partial<Variant>) => {
    const finish = update.finish ?? config.finish;
    const next: Variant = { ...config, ...update };
    if (finish.startsWith('epoxy-')) {
      next.shell = pigmentFor(finish);
      next.font = 'grotesk';
      if (!config.finish.startsWith('epoxy-') && update.engraving === undefined)
        next.engraving = 'nova-flat';
    } else next.engraving = 'classic';
    setConfig(next);
    setCopied(false);
  };
  const index = variants.findIndex(value =>
    value.shape === config.shape && value.shell === config.shell &&
    value.font === config.font && value.finish === config.finish &&
    value.engraving === config.engraving);
  const move = (by: number) => change(variants[(index + by + variants.length) % variants.length]);
  const selected = finishes.find(f => f.id === config.finish)!;
  const source = config.finish === 'pbr' ? 'https://ambientcg.com/view?id=' + textureByColor[config.shell]
    : config.finish === 'scratched' ? 'https://ambientcg.com/view?id=Scratches005' : null;
  const copy = () => {
    const params = new URLSearchParams({
      shape: config.shape, shell: config.shell, font: config.font,
      finish: config.finish, engraving: config.engraving,
    });
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    void navigator.clipboard.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  return <section className="ml wrapper" aria-label="Лаборатория акриловых материалов">
    <header className="ml-heading">
      <div className="ml-eyebrow">ROLLFORM / MATERIAL STUDY / ПРОТОТИП</div>
      <h1>Лаборатория материалов</h1>
      <p>Акрил и эпоксидная смола. 7 форм, 7 акриловых отделок и 3 эпоксидных образца. Все {variants.length} различных сочетаний в одном 3D-просмотрщике.</p>
    </header>
    <div className="ml-layout">
      <div className="ml-left">
        <DieStage config={config} />
        <div className="ml-pager">
          <button type="button" onClick={() => move(-1)} aria-label="Предыдущее сочетание">←</button>
          <span>Сочетание <strong>{index + 1} / {variants.length}</strong></span>
          <button type="button" onClick={() => move(1)} aria-label="Следующее сочетание">→</button>
          <button type="button" className="ml-copy" onClick={copy}>{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button>
        </div>
      </div>
      <div className="ml-controls">
        <div className="ml-set">
          <h2>01 / Форма</h2>
          <div className="ml-options">
            {diceShapes.map(shape => <button key={shape} className="ml-option" aria-pressed={config.shape === shape} type="button" onClick={() => change({ shape })}>{shape.toUpperCase()}</button>)}
          </div>
        </div>
        <div className="ml-set">
          <h2>02 / Цвет</h2>
          <div className="ml-options">
            {shellColors.map(color => <button key={color.value} className="ml-option ml-color" aria-pressed={config.shell === color.value} disabled={config.finish.startsWith('epoxy-')} type="button" onClick={() => change({ shell: color.value })}><span style={{ background: color.value }} className="ml-swatch"/>{color.name}</button>)}
          </div>
        </div>
        <div className="ml-set">
          <h2>03 / Нумерация</h2>
          <div className="ml-options">
            {config.finish.startsWith('epoxy-')
              ? engravings.map(engraving => <button key={engraving.id} type="button"
                  className="ml-option" aria-pressed={config.engraving === engraving.id}
                  onClick={() => change({ engraving: engraving.id })}>{engraving.title}</button>)
              : fontStyles.map(font => <button key={font} className="ml-option"
                  aria-pressed={config.font === font} type="button"
                  onClick={() => change({ font })}>{fontNames[font]}</button>)}
          </div>
        </div>
        <div className="ml-set">
          <h2>04 / Отделка</h2>
          <div className="ml-finishes">
            {finishes.map(finish => <button key={finish.id} type="button" className="ml-finish" aria-pressed={config.finish === finish.id} onClick={() => change({ finish: finish.id })}>{finish.name}</button>)}
          </div>
          <p className="ml-finish-note">{selected.detail}{config.finish.startsWith('epoxy-')
            ? ' Цвет и шрифт гравировки зафиксированы по физическим образцам.' : ''}</p>
          {source && <a className="ml-source" href={source} target="_blank" rel="noreferrer">Источник текстуры: ambientCG · CC0 ↗</a>}
        </div>
        <div className="ml-meta">
          <div><span>Модель</span><strong>{config.shape.toUpperCase()}</strong></div>
          <div><span>Материал</span><strong>{selected.name}</strong></div>
          <div><span>Гравировка</span><strong>{config.finish.startsWith('epoxy-')
            ? engravings.find(item => item.id === config.engraving)?.title : fontNames[config.font]}</strong></div>
          <div><span>UV</span><strong>Blender Smart UV</strong></div>
          <div><span>Рендер</span><strong>Three.js / WebGL / PBR</strong></div>
        </div>
      </div>
    </div>
    <p className="ml-disclaimer">Эпоксидные модели экспериментальные: отдельные UV-GLB с реальной гравировкой, построенные по форме существующих кубиков. Фото и производственные STL использованы как визуальный и размерный эталон, но геометрия STL напрямую ещё не импортирована в сайт. Это визуальная лаборатория, а не подтверждение физической технологии изготовления. Оттенки и светопропускание приблизительные. Страница не добавлена в меню и доступна по прямому URL, но не защищена паролем. Новые шрифтовые GLB содержат геометрию гравировки, а не файлы шрифтов.</p>
  </section>;
}
