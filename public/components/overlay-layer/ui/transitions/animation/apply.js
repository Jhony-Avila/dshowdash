import { _transitions, getConfig, incrementTotalApplied, getActiveTransitions } from "../state.js";
import { prefersReducedMotion } from "../helpers/motion.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.animation.apply";
function apply(element, transitionName, direction, options = {}) {
  if (!element || typeof element !== "object") {
    return Promise.reject(new Error("Invalid element"));
  }
  const config = getConfig();
  if (config.useReducedMotion && prefersReducedMotion()) {
    transitionName = "none";
  }
  const transition = _transitions[transitionName] || _transitions[config.defaultTransition];
  if (!transition) {
    return Promise.reject(new Error(`Transition not found: ${transitionName}`));
  }
  const keyframes = direction === "enter" ? transition.enter : transition.exit;
  const duration = options.duration || transition.duration;
  const easing = options.easing || transition.easing;
  if (!keyframes) {
    return Promise.resolve({ ok: true, skipped: true });
  }
  incrementTotalApplied();
  if (typeof element.animate === "function") {
    return new Promise((resolve) => {
      const animation = element.animate(
        [keyframes.from, keyframes.to],
        {
          duration,
          easing,
          fill: "forwards"
        }
      );
      const transitionId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const activeTransitions = getActiveTransitions();
      activeTransitions.set(transitionId, animation);
      animation.onfinish = () => {
        activeTransitions.delete(transitionId);
        resolve({ ok: true, duration, transitionId });
      };
      animation.oncancel = () => {
        activeTransitions.delete(transitionId);
        resolve({ ok: false, cancelled: true, transitionId });
      };
    });
  }
  return new Promise((resolve) => {
    Object.assign(element.style, keyframes.from);
    element.style.transition = `all ${duration}ms ${easing}`;
    element.offsetHeight;
    requestAnimationFrame(() => {
      Object.assign(element.style, keyframes.to);
      setTimeout(() => {
        element.style.transition = "";
        resolve({ ok: true, duration, fallback: true });
      }, duration);
    });
  });
}
function enter(element, transitionName, options) {
  return apply(element, transitionName, "enter", options);
}
function exit(element, transitionName, options) {
  return apply(element, transitionName, "exit", options);
}
export {
  MODULE_ID,
  VERSION,
  apply,
  enter,
  exit
};
