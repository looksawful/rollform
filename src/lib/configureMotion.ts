import { gsap } from 'gsap';
import { Color, Euler, Group, Mesh, PlaneGeometry, Quaternion, Scene, ShaderMaterial } from 'three';
import { castTints, loadCastDie, loadNumerals } from './castDice';
import { diceShapes, type DiceConfig } from './catalog';
import { streakFragment, streakVertex } from './diceTransitionShaders';

type Cast = Awaited<ReturnType<typeof loadCastDie>>;
type Timeline = ReturnType<typeof gsap.timeline>;

type Options = {
  dice: Group;
  scene: Scene;
  basePath: string;
  reduced: () => boolean;
  canRender: () => boolean;
  render: () => void;
  install: (cast: Cast) => void;
  light: (shell: DiceConfig['shell']) => void;
  stop: () => void;
  resume: () => void;
  ready: () => void;
  unavailable: (error: unknown) => void;
};

const turn = 2 * Math.PI;
const home = new Quaternion().setFromEuler(new Euler(-.38, .4, .12));

export function createConfigureMotion(options: Options) {
  const { dice, scene, basePath, render } = options;
  const uniforms = {
    uTint: { value: new Color() }, uStrength: { value: 0 },
    uAngle: { value: 0 }, uDirection: { value: 1 },
  };
  const trail = new Mesh(new PlaneGeometry(4.65, 4.65), new ShaderMaterial({
    uniforms, vertexShader: streakVertex, fragmentShader: streakFragment,
    transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
  }));
  trail.renderOrder = 2;
  trail.visible = false;
  trail.frustumCulled = false;
  scene.add(trail);

  let cast: Cast;
  let shown: DiceConfig;
  let desired: DiceConfig;
  let active: Timeline | undefined;
  let throwing = false;
  let loading = false;
  let disposed = false;
  let discard: (() => void) | undefined;

  function playback() {
    if (!active) return;
    if (options.reduced()) active.progress(1);
    else active.paused(!options.canRender());
  }

  function animate(build: (timeline: Timeline) => void, draw = render) {
    options.stop();
    active = gsap.timeline({
      paused: true,
      onUpdate: draw,
      onComplete: () => {
        active = undefined;
        throwing = false;
        render();
        sync();
        if (!active) options.resume();
      },
    });
    build(active);
    playback();
  }

  function setShell(shell: DiceConfig['shell']) {
    cast.setShell(shell);
    options.light(shell);
    shown = { ...shown, shell };
  }

  function install(next: Cast, config: DiceConfig, fade = 1) {
    discard = undefined;
    cast = next;
    shown = config;
    cast.setFade(fade);
    setShell(config.shell);
    options.install(cast);
  }

  function throwShape(next: Cast, config: DiceConfig) {
    if (options.reduced()) {
      install(next, { ...config, shell: desired.shell });
      render();
      sync();
      options.resume();
      return;
    }
    const distance = (diceShapes.indexOf(config.shape) - diceShapes.indexOf(shown.shape)
      + diceShapes.length) % diceShapes.length;
    const direction = distance > diceShapes.length / 2 ? -1 : 1;
    const from = dice.quaternion.clone();
    const startY = dice.position.y;
    const local = new Quaternion();
    const angles = new Euler();
    const state = { reset: 0, angle: 0, bank: 0, pitch: 0, x: 0, y: 0, size: 1, speed: 0, fade: 1 };
    const draw = () => {
      angles.set(state.pitch, state.angle, state.bank + Math.sin(state.angle) * .16);
      dice.quaternion.copy(from).slerp(home, state.reset).multiply(local.setFromEuler(angles));
      dice.position.set(state.x, state.y + startY * (1 - state.reset), 0);
      dice.scale.setScalar(state.size);
      cast.setFade(state.fade);
      uniforms.uAngle.value = state.angle;
      uniforms.uStrength.value = state.speed * state.fade;
      trail.visible = uniforms.uStrength.value > .001;
      trail.position.copy(dice.position);
      render();
    };
    throwing = true;
    discard = () => next.dispose();
    uniforms.uDirection.value = direction;
    uniforms.uTint.value.set(castTints[shown.shell]);
    animate(timeline => timeline
      .to(state, { reset: 1, duration: .16, ease: 'power3.out' }, 0)
      .to(state, {
        angle: -.31 * direction, bank: -.25 * direction, pitch: -.19,
        x: -.13 * direction, y: -.13, duration: .13, ease: 'power2.out',
      }, .16)
      .to(state, {
        angle: turn * 1.12 * direction, bank: .34 * direction, pitch: .25,
        x: .14 * direction, y: .28, size: .87, duration: .43, ease: 'power1.in',
      }, .29)
      .to(state, { speed: 1, duration: .43, ease: 'power1.out' }, .29)
      .to(state, { fade: 0, duration: .20, ease: 'power1.in' }, .52)
      .call(() => {
        install(next, { ...config, shell: desired.shell }, 0);
        uniforms.uTint.value.set(castTints[shown.shell]);
      }, [], .72)
      .to(state, { angle: turn * 2 * direction, duration: .53, ease: 'power2.out' }, .72)
      .to(state, { x: 0, size: 1, bank: 0, pitch: 0, duration: .62, ease: 'power2.out' }, .72)
      .to(state, { y: .43, duration: .18, ease: 'power2.out' }, .72)
      .to(state, { y: -.065, duration: .30, ease: 'power2.in' }, .90)
      .to(state, { y: 0, duration: .18, ease: 'power2.out' }, 1.20)
      .to(state, { speed: 0, duration: .39, ease: 'power2.out' }, .72)
      .to(state, { fade: 1, duration: .25, ease: 'power2.out' }, .72), draw);
  }

  async function loadShape(config: DiceConfig) {
    loading = true;
    try {
      const next = await loadCastDie(config, basePath, undefined, true);
      loading = false;
      if (disposed || desired.shape !== config.shape) { next.dispose(); sync(); return; }
      throwShape(next, config);
    } catch (error) {
      loading = false;
      if (disposed) return;
      if (desired.shape === config.shape) options.unavailable(error);
      else sync();
    }
  }

  async function changeFont(font: DiceConfig['font']) {
    loading = true;
    try {
      const texture = await loadNumerals(font, basePath);
      loading = false;
      if (disposed || desired.font !== font || desired.shape !== shown.shape) {
        texture.dispose();
        sync();
        return;
      }
      const replace = () => {
        discard = undefined;
        cast.setFont(texture);
        shown = { ...shown, font };
      };
      if (options.reduced()) { replace(); render(); sync(); return; }
      discard = () => texture.dispose();
      const { ink, glint } = cast.effects;
      animate(timeline => timeline
        .to(ink, { value: 0, duration: .49, ease: 'sine.inOut' })
        .call(replace, [], '+=.14')
        .set(glint, { value: -.49 })
        .to(ink, { value: 1, duration: .49, ease: 'sine.out' })
        .to(glint, { value: 1.7, duration: 1.02, ease: 'sine.inOut' }, '<+=.28'));
    } catch (error) {
      loading = false;
      if (disposed) return;
      if (desired.font === font && desired.shape === shown.shape) options.unavailable(error);
      else sync();
    }
  }

  function sync() {
    if (disposed || !cast || loading || active) return;
    if (desired.shape !== shown.shape) { void loadShape(desired); return; }
    if (desired.shell !== shown.shell) {
      const shell = desired.shell;
      if (!options.reduced()) {
        cast.preparePaint(shell);
        animate(timeline => timeline
          .to(cast.paintProgress, { value: 1, duration: .86, ease: 'sine.inOut' })
          .call(() => setShell(shell)));
        return;
      }
      setShell(shell);
      render();
    }
    if (desired.font !== shown.font) { void changeFont(desired.font); return; }
    options.ready();
  }

  return {
    initialize(model: Cast, config: DiceConfig) { cast = model; shown = config; desired = config; },
    update(config: DiceConfig) { desired = config; sync(); },
    playback,
    finishThrow() { if (throwing) active?.progress(1); },
    dispose() {
      disposed = true;
      active?.kill();
      discard?.();
      trail.removeFromParent();
      trail.geometry.dispose();
      trail.material.dispose();
    },
  };
}
