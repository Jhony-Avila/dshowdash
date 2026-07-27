import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:animation-manager-v2";
const EASINGS = Object.freeze({
  LINEAR: "linear",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  EASE_IN_CUBIC: "cubic-bezier(0.32, 0, 0.67, 0)",
  EASE_OUT_CUBIC: "cubic-bezier(0.33, 1, 0.68, 1)",
  EASE_IN_OUT_CUBIC: "cubic-bezier(0.65, 0, 0.35, 1)",
  SPRING: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
});
const PRESETS = Object.freeze({
  FADE_IN: { opacity: [0, 1], duration: 300, easing: EASINGS.EASE_OUT },
  FADE_OUT: { opacity: [1, 0], duration: 300, easing: EASINGS.EASE_IN },
  SLIDE_IN_LEFT: { transform: ["translateX(-100%)", "translateX(0)"], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_RIGHT: { transform: ["translateX(100%)", "translateX(0)"], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_UP: { transform: ["translateY(100%)", "translateY(0)"], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_DOWN: { transform: ["translateY(-100%)", "translateY(0)"], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SCALE_IN: { transform: ["scale(0)", "scale(1)"], opacity: [0, 1], duration: 300, easing: EASINGS.SPRING },
  SCALE_OUT: { transform: ["scale(1)", "scale(0)"], opacity: [1, 0], duration: 200, easing: EASINGS.EASE_IN },
  BOUNCE_IN: { transform: ["scale(0.3)", "scale(1.05)", "scale(0.9)", "scale(1)"], duration: 500, easing: EASINGS.EASE_OUT },
  SHAKE: { transform: ["translateX(0)", "translateX(-10px)", "translateX(10px)", "translateX(-10px)", "translateX(10px)", "translateX(0)"], duration: 400, easing: EASINGS.EASE_IN_OUT },
  PULSE: { transform: ["scale(1)", "scale(1.05)", "scale(1)"], duration: 300, easing: EASINGS.EASE_IN_OUT },
  ROTATE_IN: { transform: ["rotate(-180deg) scale(0)", "rotate(0) scale(1)"], opacity: [0, 1], duration: 400, easing: EASINGS.SPRING }
});
function createAnimationManager(options = {}) {
  const { defaultDuration = 300, defaultEasing = EASINGS.EASE_OUT, respectReducedMotion = true } = options;
  const _logger = createLogger(MODULE_ID);
  const _animations = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _reducedMotion = false;
  let _metrics = { started: 0, completed: 0, cancelled: 0 };
  if (respectReducedMotion) {
    _reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      _reducedMotion = e.matches;
    });
  }
  function _buildKeyframes(props) {
    const keyframes = [];
    const propNames = Object.keys(props).filter((k) => k !== "duration" && k !== "easing" && k !== "delay");
    const steps = Math.max(...propNames.map((p) => Array.isArray(props[p]) ? props[p].length : 1));
    for (let i = 0; i < steps; i++) {
      const frame = {};
      for (const prop of propNames) {
        const values = Array.isArray(props[prop]) ? props[prop] : [props[prop]];
        frame[prop] = values[Math.min(i, values.length - 1)];
      }
      keyframes.push(frame);
    }
    return keyframes;
  }
  const manager = {
    animate(element, props, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return Promise.reject(new Error("Element not found"));
      if (_reducedMotion && !options2.ignoreReducedMotion) {
        const keyframes2 = _buildKeyframes(props);
        const lastFrame = keyframes2[keyframes2.length - 1];
        Object.assign(element.style, lastFrame);
        return Promise.resolve({ id: null, cancelled: false, reducedMotion: true });
      }
      const id = `anim-${++_counter}`;
      const duration = props.duration || options2.duration || defaultDuration;
      const easing = props.easing || options2.easing || defaultEasing;
      const delay = props.delay || options2.delay || 0;
      const keyframes = _buildKeyframes(props);
      const animation = element.animate(keyframes, { duration, easing, delay, fill: options2.fill || "forwards" });
      _animations.set(id, { animation, element, props });
      _metrics.started++;
      return new Promise((resolve) => {
        animation.onfinish = () => {
          _animations.delete(id);
          _metrics.completed++;
          resolve({ id, cancelled: false });
        };
        animation.oncancel = () => {
          _animations.delete(id);
          _metrics.cancelled++;
          resolve({ id, cancelled: true });
        };
      });
    },
    preset(element, presetName, options2 = {}) {
      const preset = PRESETS[presetName];
      if (!preset) return Promise.reject(new Error(`Unknown preset: ${presetName}`));
      return this.animate(element, preset, options2);
    },
    fadeIn(element, duration = 300) {
      return this.preset(element, "FADE_IN", { duration });
    },
    fadeOut(element, duration = 300) {
      return this.preset(element, "FADE_OUT", { duration });
    },
    slideInLeft(element, duration = 400) {
      return this.preset(element, "SLIDE_IN_LEFT", { duration });
    },
    slideInRight(element, duration = 400) {
      return this.preset(element, "SLIDE_IN_RIGHT", { duration });
    },
    scaleIn(element, duration = 300) {
      return this.preset(element, "SCALE_IN", { duration });
    },
    shake(element) {
      return this.preset(element, "SHAKE");
    },
    pulse(element) {
      return this.preset(element, "PULSE");
    },
    async sequence(animations) {
      const results = [];
      for (const anim of animations) {
        const result = await this.animate(anim.element, anim.props, anim.options);
        results.push(result);
        if (anim.delay) await new Promise((r) => setTimeout(r, anim.delay));
      }
      return results;
    },
    parallel(animations) {
      return Promise.all(animations.map((anim) => this.animate(anim.element, anim.props, anim.options)));
    },
    stagger(elements, props, staggerMs = 50, options2 = {}) {
      if (typeof elements === "string") elements = Array.from(document.querySelectorAll(elements));
      return Promise.all(elements.map((el, i) => this.animate(el, props, { ...options2, delay: (Number(options2.delay) || 0) + i * staggerMs })));
    },
    cancel(id) {
      const anim = _animations.get(id);
      if (anim) {
        anim.animation.cancel();
        return true;
      }
      return false;
    },
    cancelAll() {
      _animations.forEach((anim) => anim.animation.cancel());
      _animations.clear();
    },
    pause(id) {
      const anim = _animations.get(id);
      if (anim) anim.animation.pause();
    },
    resume(id) {
      const anim = _animations.get(id);
      if (anim) anim.animation.play();
    },
    pauseAll() {
      _animations.forEach((anim) => anim.animation.pause());
    },
    resumeAll() {
      _animations.forEach((anim) => anim.animation.play());
    },
    isReducedMotion() {
      return _reducedMotion;
    },
    getActiveCount() {
      return _animations.size;
    },
    getMetrics() {
      return { ..._metrics, active: _animations.size, reducedMotion: _reducedMotion };
    },
    resetMetrics() {
      _metrics = { started: 0, completed: 0, cancelled: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, activeAnimations: _animations.size, reducedMotion: _reducedMotion, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, activeAnimations: _animations.size, presets: Object.keys(PRESETS), easings: Object.keys(EASINGS) };
    },
    destroy() {
      this.cancelAll();
    }
  };
  return manager;
}
let _instance = null;
function getAnimationManager(options = {}) {
  if (!_instance) _instance = createAnimationManager(options);
  return _instance;
}
function resetAnimationManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function animate(element, props, options) {
  return getAnimationManager().animate(element, props, options);
}
function fadeIn(element, duration) {
  return getAnimationManager().fadeIn(element, duration);
}
function fadeOut(element, duration) {
  return getAnimationManager().fadeOut(element, duration);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, presets: Object.keys(PRESETS), easings: Object.keys(EASINGS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var animation_manager_v2_default = { VERSION, MODULE_ID, EASINGS, PRESETS, createAnimationManager, getAnimationManager, resetAnimationManager, animate, fadeIn, fadeOut, info, healthCheck };
export {
  EASINGS,
  MODULE_ID,
  PRESETS,
  VERSION,
  animate,
  createAnimationManager,
  animation_manager_v2_default as default,
  fadeIn,
  fadeOut,
  getAnimationManager,
  healthCheck,
  info,
  resetAnimationManager
};
