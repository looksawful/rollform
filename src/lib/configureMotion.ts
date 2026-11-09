import { gsap } from 'gsap';
import { Group, Quaternion, Vector3, type Texture } from 'three';
import { loadCastDie, loadNumerals } from './castDice';
import { diceShapes, type DiceConfig } from './catalog';

type Cast = Awaited<ReturnType<typeof loadCastDie>>;
type Timeline = ReturnType<typeof gsap.timeline>;

type Options = {
  dice: Group;
  prepareTexture: (texture: Texture) => void;
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
const axis = new Vector3(.18, 1, .13).normalize();

export function createConfigureMotion(options: Options) {
  const { dice, basePath, render } = options;

  let cast: Cast;
  let shown: DiceConfig;
  let desired: DiceConfig;
  let active: Timeline | undefined;
  let throwOrigin: Quaternion | undefined;
  let loading = false;
  let disposed = false;
  let discard: (() => void) | undefined;

  function playback() {
    if (!active) return;
    if (options.reduced()) finish();
    else active.paused(!options.canRender());
  }

  function finish() {
    throwOrigin?.copy(dice.quaternion);
    active?.progress(1);
  }

  function animate(build: (timeline: Timeline) => void, draw = render) {
    options.stop();
    active = gsap.timeline({
      paused: true,
      onUpdate: draw,
      onComplete: () => {
        active = undefined;
        throwOrigin = undefined;
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

  function install(next: Cast, config: DiceConfig) {
    discard = undefined;
    cast = next;
    shown = config;
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
    const rotation = new Quaternion();
    const state = { progress: 0 };
    throwOrigin = from;
    discard = () => next.dispose();
    animate(timeline => timeline
      .to(state, { progress: 1, duration: .64, ease: 'sine.inOut' }, 0)
      .call(() => {
        if (desired.shape === config.shape) {
          install(next, { ...config, shell: desired.shell });
        } else {
          discard?.();
          discard = undefined;
        }
      }, [], .32), () => {
      // Turn around the visible pose. At the end, keep its exact quaternion.
      if (state.progress === 1) dice.quaternion.copy(from);
      else dice.quaternion.copy(from).premultiply(rotation.setFromAxisAngle(axis, turn * direction * state.progress));
      render();
    });
  }

  async function loadShape(config: DiceConfig) {
    loading = true;
    try {
      const next = await loadCastDie(config, basePath, undefined, true);
      loading = false;
      if (disposed || desired.shape !== config.shape) { next.dispose(); sync(); return; }
      options.prepareTexture(next.texture);
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
      options.prepareTexture(texture);
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
    finishThrow() { if (throwOrigin) finish(); },
    dispose() {
      disposed = true;
      active?.kill();
      discard?.();
    },
  };
}
