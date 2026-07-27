import { activeAnimations, incrementMetric, config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.core";
function _prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function animate(element, keyframes, options) {
  options = options || {};
  if (_prefersReducedMotion() && !options.ignoreReducedMotion) {
    return Promise.resolve({ cancelled: false, reducedMotion: true });
  }
  if (!element || !element.animate) {
    return Promise.resolve({ cancelled: false, error: "Invalid element" });
  }
  const duration = options.duration || config.defaultDuration;
  const easing = options.easing || config.defaultEasing;
  const fill = options.fill || "forwards";
  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill,
    delay: options.delay || 0,
    iterations: options.iterations || 1
  });
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  activeAnimations.set(id, animation);
  incrementMetric("animationsStarted");
  return new Promise((resolve) => {
    const timeout = options.timeout || duration + 1e3;
    let timeoutId = null;
    function cleanup(result) {
      if (timeoutId) clearTimeout(timeoutId);
      activeAnimations.delete(id);
      resolve(result);
    }
    animation.onfinish = () => {
      incrementMetric("animationsCompleted");
      cleanup({ cancelled: false, id });
    };
    animation.oncancel = () => {
      incrementMetric("animationsCancelled");
      cleanup({ cancelled: true, id });
    };
    timeoutId = setTimeout(() => {
      animation.cancel();
      cleanup({ cancelled: true, timeout: true, id });
    }, timeout);
  });
}
function sequence(elements, keyframes, options) {
  options = options || {};
  const staggerDelay = options.stagger || 0;
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  let chain = Promise.resolve();
  const results = [];
  for (let i = 0; i < elements.length; i++) {
    ((index) => {
      chain = chain.then(() => new Promise((resolve) => {
        setTimeout(() => {
          animate(elements[index], keyframes, options).then((result) => {
            results.push(result);
            resolve();
          });
        }, index > 0 ? staggerDelay : 0);
      }));
    })(i);
  }
  return chain.then(() => results);
}
function parallel(elements, keyframes, options) {
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  const promises = elements.map((el) => animate(el, keyframes, options));
  return Promise.all(promises);
}
function stagger(elements, keyframes, options) {
  options = options || {};
  const delay = options.staggerDelay || 50;
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  const promises = elements.map((el, index) => {
    const itemOptions = Object.assign({}, options, {
      delay: (options.delay || 0) + index * delay
    });
    return animate(el, keyframes, itemOptions);
  });
  return Promise.all(promises);
}
var core_default = {
  animate,
  sequence,
  parallel,
  stagger
};
export {
  MODULE_ID,
  VERSION,
  animate,
  core_default as default,
  parallel,
  sequence,
  stagger
};
