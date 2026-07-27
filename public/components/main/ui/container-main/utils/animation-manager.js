const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-animation-manager";
const ANIMATIONS = {
  FADE_IN: "fadeIn",
  FADE_OUT: "fadeOut",
  SLIDE_IN: "slideIn",
  SLIDE_OUT: "slideOut",
  SCALE_IN: "scaleIn",
  SCALE_OUT: "scaleOut",
  BOUNCE: "bounce",
  SHAKE: "shake",
  PULSE: "pulse"
};
const EASINGS = {
  LINEAR: "linear",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  SPRING: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
};
let _prefersReducedMotion = false;
let _mediaQuery = null;
let _activeAnimations = /* @__PURE__ */ new Map();
function _checkReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
}
function init() {
  _prefersReducedMotion = _checkReducedMotion();
  if (typeof window !== "undefined") {
    _mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    _mediaQuery.addEventListener?.("change", (e) => {
      _prefersReducedMotion = e.matches;
    });
  }
}
function prefersReducedMotion() {
  return _prefersReducedMotion;
}
function animate(element, animation, options = {}) {
  if (!element || _prefersReducedMotion) {
    return Promise.resolve();
  }
  const { duration = 300, easing = EASINGS.EASE_OUT, delay = 0, fill = "forwards", onComplete } = options;
  const keyframes = _getKeyframes(animation, options);
  if (!keyframes) return Promise.resolve();
  return new Promise((resolve) => {
    const anim = element.animate(keyframes, { duration, easing, delay, fill });
    const id = `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    _activeAnimations.set(id, anim);
    anim.onfinish = () => {
      _activeAnimations.delete(id);
      onComplete?.();
      resolve();
    };
    anim.oncancel = () => {
      _activeAnimations.delete(id);
      resolve();
    };
  });
}
function _getKeyframes(animation, options = {}) {
  const { direction = "left" } = options;
  switch (animation) {
    case ANIMATIONS.FADE_IN:
      return [{ opacity: 0 }, { opacity: 1 }];
    case ANIMATIONS.FADE_OUT:
      return [{ opacity: 1 }, { opacity: 0 }];
    case ANIMATIONS.SLIDE_IN:
      const slideInStart = direction === "left" ? "-100%" : direction === "right" ? "100%" : direction === "up" ? "-100%" : "100%";
      const prop = direction === "left" || direction === "right" ? "translateX" : "translateY";
      return [{ transform: `${prop}(${slideInStart})`, opacity: 0 }, { transform: `${prop}(0)`, opacity: 1 }];
    case ANIMATIONS.SLIDE_OUT:
      const slideOutEnd = direction === "left" ? "-100%" : direction === "right" ? "100%" : direction === "up" ? "-100%" : "100%";
      const propOut = direction === "left" || direction === "right" ? "translateX" : "translateY";
      return [{ transform: `${propOut}(0)`, opacity: 1 }, { transform: `${propOut}(${slideOutEnd})`, opacity: 0 }];
    case ANIMATIONS.SCALE_IN:
      return [{ transform: "scale(0.8)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }];
    case ANIMATIONS.SCALE_OUT:
      return [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.8)", opacity: 0 }];
    case ANIMATIONS.BOUNCE:
      return [
        { transform: "translateY(0)" },
        { transform: "translateY(-20px)" },
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0)" }
      ];
    case ANIMATIONS.SHAKE:
      return [
        { transform: "translateX(0)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(0)" }
      ];
    case ANIMATIONS.PULSE:
      return [
        { transform: "scale(1)" },
        { transform: "scale(1.05)" },
        { transform: "scale(1)" }
      ];
    default:
      return null;
  }
}
function fadeIn(element, options = {}) {
  return animate(element, ANIMATIONS.FADE_IN, options);
}
function fadeOut(element, options = {}) {
  return animate(element, ANIMATIONS.FADE_OUT, options);
}
function slideIn(element, direction = "left", options = {}) {
  return animate(element, ANIMATIONS.SLIDE_IN, { ...options, direction });
}
function slideOut(element, direction = "left", options = {}) {
  return animate(element, ANIMATIONS.SLIDE_OUT, { ...options, direction });
}
function scaleIn(element, options = {}) {
  return animate(element, ANIMATIONS.SCALE_IN, options);
}
function scaleOut(element, options = {}) {
  return animate(element, ANIMATIONS.SCALE_OUT, options);
}
function bounce(element, options = {}) {
  return animate(element, ANIMATIONS.BOUNCE, { duration: 500, ...options });
}
function shake(element, options = {}) {
  return animate(element, ANIMATIONS.SHAKE, { duration: 400, ...options });
}
function pulse(element, options = {}) {
  return animate(element, ANIMATIONS.PULSE, { duration: 300, ...options });
}
function cancelAll() {
  _activeAnimations.forEach((anim) => anim.cancel());
  _activeAnimations.clear();
}
function getActiveCount() {
  return _activeAnimations.size;
}
function destroy() {
  cancelAll();
  if (_mediaQuery) {
    _mediaQuery.removeEventListener?.("change", () => {
    });
    _mediaQuery = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, prefersReducedMotion: _prefersReducedMotion, activeAnimations: _activeAnimations.size };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, prefersReducedMotion: _prefersReducedMotion, activeAnimations: _activeAnimations.size };
}
var animation_manager_default = {
  init,
  animate,
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scaleIn,
  scaleOut,
  bounce,
  shake,
  pulse,
  cancelAll,
  getActiveCount,
  prefersReducedMotion,
  destroy,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  ANIMATIONS,
  EASINGS
};
export {
  ANIMATIONS,
  EASINGS,
  MODULE_ID,
  VERSION,
  animate,
  bounce,
  cancelAll,
  animation_manager_default as default,
  destroy,
  fadeIn,
  fadeOut,
  getActiveCount,
  healthCheck,
  info,
  init,
  prefersReducedMotion,
  pulse,
  scaleIn,
  scaleOut,
  shake,
  slideIn,
  slideOut
};
