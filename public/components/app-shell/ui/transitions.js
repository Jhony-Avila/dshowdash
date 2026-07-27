const VERSION = "4.0.2-ES6";
const MODULE_ID = "app-shell-transitions";
const TRANSITION_CLASSES = Object.freeze({
  BOOTING: "app-shell--booting",
  BOOTED: "app-shell--booted",
  READY: "app-shell--ready",
  LOADING: "app-shell--loading",
  ERROR: "app-shell--error",
  REDUCED_MOTION: "app-shell--reduced-motion"
});
let _reducedMotion = false;
let _mediaQueryListener = null;
function _detectReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  _reducedMotion = mq.matches;
  if (!_mediaQueryListener) {
    const handler = (e) => {
      _reducedMotion = e.matches;
      const shell = document.getElementById("app-shell");
      if (shell) {
        if (_reducedMotion) {
          shell.classList.add(TRANSITION_CLASSES.REDUCED_MOTION);
        } else {
          shell.classList.remove(TRANSITION_CLASSES.REDUCED_MOTION);
        }
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
    }
    _mediaQueryListener = handler;
  }
  return _reducedMotion;
}
function applyInitialEffects() {
  if (typeof document === "undefined") return;
  _detectReducedMotion();
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  shell.classList.add(TRANSITION_CLASSES.BOOTING);
  if (_reducedMotion) {
    shell.classList.add(TRANSITION_CLASSES.REDUCED_MOTION);
  }
  shell.style.setProperty("will-change", "opacity, transform");
  requestAnimationFrame(() => {
    shell.classList.remove(TRANSITION_CLASSES.BOOTING);
    shell.classList.add(TRANSITION_CLASSES.BOOTED);
    setTimeout(() => {
      shell.style.removeProperty("will-change");
    }, 500);
  });
}
function markShellReady() {
  if (typeof document === "undefined") return;
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  shell.classList.add(TRANSITION_CLASSES.READY);
  shell.setAttribute("data-ready", "true");
}
function setLoadingState(isLoading) {
  if (typeof document === "undefined") return;
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  if (isLoading) {
    shell.classList.add(TRANSITION_CLASSES.LOADING);
  } else {
    shell.classList.remove(TRANSITION_CLASSES.LOADING);
  }
}
function setErrorState(hasError) {
  if (typeof document === "undefined") return;
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  if (hasError) {
    shell.classList.add(TRANSITION_CLASSES.ERROR);
  } else {
    shell.classList.remove(TRANSITION_CLASSES.ERROR);
  }
}
function fadeOutPreloader(duration) {
  duration = duration || 500;
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    const preloader = document.getElementById("preloader") || document.querySelector('[data-region="preloader"]');
    if (!preloader) {
      resolve();
      return;
    }
    if (_reducedMotion) {
      preloader.style.display = "none";
      preloader.setAttribute("aria-hidden", "true");
      resolve();
      return;
    }
    preloader.style.transition = `opacity ${duration}ms ease-out`;
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
      preloader.setAttribute("aria-hidden", "true");
      resolve();
    }, duration);
  });
}
function resetTransitions() {
  if (typeof document === "undefined") return;
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  const classes = Object.values(TRANSITION_CLASSES);
  for (let i = 0; i < classes.length; i++) {
    shell.classList.remove(classes[i]);
  }
  shell.removeAttribute("data-ready");
}
function isReducedMotion() {
  return _reducedMotion;
}
function prefersReducedMotion() {
  return _reducedMotion;
}
function getTransitionState() {
  if (typeof document === "undefined") {
    return { classes: [], ready: false, reducedMotion: _reducedMotion };
  }
  const shell = document.getElementById("app-shell");
  if (!shell) {
    return { classes: [], ready: false, reducedMotion: _reducedMotion };
  }
  const activeClasses = [];
  const classValues = Object.keys(TRANSITION_CLASSES);
  for (let i = 0; i < classValues.length; i++) {
    const cls = TRANSITION_CLASSES[classValues[i]];
    if (shell.classList.contains(cls)) {
      activeClasses.push(cls);
    }
  }
  return {
    classes: activeClasses,
    ready: shell.classList.contains(TRANSITION_CLASSES.READY),
    loading: shell.classList.contains(TRANSITION_CLASSES.LOADING),
    error: shell.classList.contains(TRANSITION_CLASSES.ERROR),
    reducedMotion: _reducedMotion
  };
}
var transitions_default = {
  VERSION,
  MODULE_ID,
  TRANSITION_CLASSES,
  applyInitialEffects,
  markShellReady,
  setLoadingState,
  setErrorState,
  fadeOutPreloader,
  resetTransitions,
  isReducedMotion,
  prefersReducedMotion,
  getTransitionState
};
export {
  MODULE_ID,
  TRANSITION_CLASSES,
  VERSION,
  applyInitialEffects,
  transitions_default as default,
  fadeOutPreloader,
  getTransitionState,
  isReducedMotion,
  markShellReady,
  prefersReducedMotion,
  resetTransitions,
  setErrorState,
  setLoadingState
};
