// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file App Shell — Transitions
 * @version 4.0.2-ES6
 * @changelog v4.0.2-ES6 - var → const/let migration
 * @module app-shell/ui/transitions
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone module)
 *
 * @provides applyInitialEffects, markShellReady, setLoadingState, setErrorState
 * @provides fadeOutPreloader, resetTransitions, isReducedMotion
 * @provides getTransitionState, prefersReducedMotion
 * @provides TRANSITION_CLASSES
 *
 * @browserAPI classList, matchMedia, setTimeout, CSS transitions
 *
 * @description
 * Shell transition effects and CSS state management. Handles boot sequence
 * animations, preloader fade-out, and reduced-motion preference detection.
 * v4.0.1: Added getTransitionState and prefersReducedMotion for index.js compatibility.
 *
 * @example
 * import { applyInitialEffects, markShellReady, fadeOutPreloader } from './transitions.js';
 * applyInitialEffects();
 * await fadeOutPreloader(500);
 * markShellReady();
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.2-ES6';
export const MODULE_ID = 'app-shell-transitions';

export const TRANSITION_CLASSES = Object.freeze({
  BOOTING: 'app-shell--booting',
  BOOTED: 'app-shell--booted',
  READY: 'app-shell--ready',
  LOADING: 'app-shell--loading',
  ERROR: 'app-shell--error',
  REDUCED_MOTION: 'app-shell--reduced-motion'
});

let _reducedMotion = false;
let _mediaQueryListener: DynObj = null;

function _detectReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  _reducedMotion = mq.matches;

  if (!_mediaQueryListener) {
    const handler = (e: DynObj) => {
      _reducedMotion = e.matches;
      const shell = document.getElementById('app-shell');
      if (shell) {
        if (_reducedMotion) {
          shell.classList.add(TRANSITION_CLASSES.REDUCED_MOTION);
        } else {
          shell.classList.remove(TRANSITION_CLASSES.REDUCED_MOTION);
        }
      }
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
    }

    _mediaQueryListener = handler;
  }

  return _reducedMotion;
}

export function applyInitialEffects() {
  if (typeof document === 'undefined') return;

  _detectReducedMotion();

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  shell.classList.add(TRANSITION_CLASSES.BOOTING);

  if (_reducedMotion) {
    shell.classList.add(TRANSITION_CLASSES.REDUCED_MOTION);
  }

  shell.style.setProperty('will-change', 'opacity, transform');

  requestAnimationFrame(() => {
    shell.classList.remove(TRANSITION_CLASSES.BOOTING);
    shell.classList.add(TRANSITION_CLASSES.BOOTED);

    setTimeout(() => {
      shell.style.removeProperty('will-change');
    }, 500);
  });
}

export function markShellReady() {
  if (typeof document === 'undefined') return;

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  shell.classList.add(TRANSITION_CLASSES.READY);
  shell.setAttribute('data-ready', 'true');
}

export function setLoadingState(isLoading: boolean) {
  if (typeof document === 'undefined') return;

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  if (isLoading) {
    shell.classList.add(TRANSITION_CLASSES.LOADING);
  } else {
    shell.classList.remove(TRANSITION_CLASSES.LOADING);
  }
}

export function setErrorState(hasError: boolean) {
  if (typeof document === 'undefined') return;

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  if (hasError) {
    shell.classList.add(TRANSITION_CLASSES.ERROR);
  } else {
    shell.classList.remove(TRANSITION_CLASSES.ERROR);
  }
}

export function fadeOutPreloader(duration: number) {
  duration = duration || 500;

  return new Promise<void>(resolve => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const preloader = document.getElementById('preloader') ||
                      document.querySelector('[data-region="preloader"]');

    if (!preloader) {
      resolve();
      return;
    }

    if (_reducedMotion) {
      preloader.style.display = 'none';
      preloader.setAttribute('aria-hidden', 'true');
      resolve();
      return;
    }

    preloader.style.transition = `opacity ${duration}ms ease-out`;
    preloader.style.opacity = '0';

    setTimeout(() => {
      preloader.style.display = 'none';
      preloader.setAttribute('aria-hidden', 'true');
      resolve();
    }, duration);
  });
}

export function resetTransitions() {
  if (typeof document === 'undefined') return;

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  const classes = Object.values(TRANSITION_CLASSES);
  for (let i = 0; i < classes.length; i++) {
    shell.classList.remove(classes[i]);
  }

  shell.removeAttribute('data-ready');
}

export function isReducedMotion() {
  return _reducedMotion;
}

// Alias: prefersReducedMotion delegates to isReducedMotion for index.js compatibility
export function prefersReducedMotion() {
  return _reducedMotion;
}

// Returns current transition state of the shell for index.js AppShell.info()
export function getTransitionState() {
  if (typeof document === 'undefined') {
    return { classes: [] as DynObj, ready: false, reducedMotion: _reducedMotion };
  }

  const shell = document.getElementById('app-shell');
  if (!shell) {
    return { classes: [], ready: false, reducedMotion: _reducedMotion };
  }

  const activeClasses = [];
  const classValues = Object.keys(TRANSITION_CLASSES);
  for (let i = 0; i < classValues.length; i++) {
    const cls = (TRANSITION_CLASSES as DynObj)[classValues[i]];
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

export default {
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
