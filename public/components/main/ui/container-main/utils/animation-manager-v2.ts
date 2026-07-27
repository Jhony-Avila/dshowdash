// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:animation-manager-v2
// PURPOSE: Animation Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EASINGS — exported value
//   PRESETS — exported value
//   createAnimationManager() — exported function
//   getAnimationManager() — exported function
//   resetAnimationManager() — exported function
//   animate() — exported function
//   fadeIn() — exported function
//   fadeOut() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:animation-manager-v2';

export const EASINGS = Object.freeze({
  LINEAR: 'linear', EASE: 'ease', EASE_IN: 'ease-in', EASE_OUT: 'ease-out', EASE_IN_OUT: 'ease-in-out',
  EASE_IN_CUBIC: 'cubic-bezier(0.32, 0, 0.67, 0)', EASE_OUT_CUBIC: 'cubic-bezier(0.33, 1, 0.68, 1)',
  EASE_IN_OUT_CUBIC: 'cubic-bezier(0.65, 0, 0.35, 1)', SPRING: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
});

export const PRESETS = Object.freeze({
  FADE_IN: { opacity: [0, 1], duration: 300, easing: EASINGS.EASE_OUT },
  FADE_OUT: { opacity: [1, 0], duration: 300, easing: EASINGS.EASE_IN },
  SLIDE_IN_LEFT: { transform: ['translateX(-100%)', 'translateX(0)'], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_RIGHT: { transform: ['translateX(100%)', 'translateX(0)'], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_UP: { transform: ['translateY(100%)', 'translateY(0)'], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SLIDE_IN_DOWN: { transform: ['translateY(-100%)', 'translateY(0)'], duration: 400, easing: EASINGS.EASE_OUT_CUBIC },
  SCALE_IN: { transform: ['scale(0)', 'scale(1)'], opacity: [0, 1], duration: 300, easing: EASINGS.SPRING },
  SCALE_OUT: { transform: ['scale(1)', 'scale(0)'], opacity: [1, 0], duration: 200, easing: EASINGS.EASE_IN },
  BOUNCE_IN: { transform: ['scale(0.3)', 'scale(1.05)', 'scale(0.9)', 'scale(1)'], duration: 500, easing: EASINGS.EASE_OUT },
  SHAKE: { transform: ['translateX(0)', 'translateX(-10px)', 'translateX(10px)', 'translateX(-10px)', 'translateX(10px)', 'translateX(0)'], duration: 400, easing: EASINGS.EASE_IN_OUT },
  PULSE: { transform: ['scale(1)', 'scale(1.05)', 'scale(1)'], duration: 300, easing: EASINGS.EASE_IN_OUT },
  ROTATE_IN: { transform: ['rotate(-180deg) scale(0)', 'rotate(0) scale(1)'], opacity: [0, 1], duration: 400, easing: EASINGS.SPRING }
});

export function createAnimationManager(options: Record<string, unknown> = {}) {
  const { defaultDuration = 300, defaultEasing = EASINGS.EASE_OUT, respectReducedMotion = true } = options;

  const _logger = createLogger(MODULE_ID);
  const _animations = new Map();
  let _counter = 0;
  let _reducedMotion = false;
  let _metrics = { started: 0, completed: 0, cancelled: 0 };

  if (respectReducedMotion) {
    _reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      _reducedMotion = e.matches;
    });
  }

  function _buildKeyframes(props: Record<string, unknown>) {
    const keyframes = [];
    const propNames = Object.keys(props).filter(k => k !== 'duration' && k !== 'easing' && k !== 'delay');
    const steps = Math.max(...propNames.map(p => Array.isArray(props[p]) ? props[p].length : 1));
    
    for (let i = 0; i < steps; i++) {
      const frame: Record<string, unknown> = {};
      for (const prop of propNames) {
        const values = Array.isArray(props[prop]) ? props[prop] : [props[prop]];
        frame[prop] = values[Math.min(i, values.length - 1)];
      }
      keyframes.push(frame);
    }
    return keyframes;
  }

  const manager = {
    animate(element: HTMLElement, props: Record<string, unknown>, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return Promise.reject(new Error('Element not found'));

      if (_reducedMotion && !options.ignoreReducedMotion) {
        const keyframes = _buildKeyframes(props);
        const lastFrame = keyframes[keyframes.length - 1];
        Object.assign(element.style, lastFrame);
        return Promise.resolve({ id: null, cancelled: false, reducedMotion: true });
      }

      const id = `anim-${++_counter}`;
      const duration = props.duration || options.duration || defaultDuration;
      const easing = props.easing || options.easing || defaultEasing;
      const delay = props.delay || options.delay || 0;

      const keyframes = _buildKeyframes(props);

      // @ts-expect-error TS migration - TS2345
      const animation = element.animate(keyframes, { duration, easing, delay, fill: options.fill || 'forwards' });

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

    preset(element: HTMLElement, presetName: unknown, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS7053
      const preset = PRESETS[presetName as string];
      if (!preset) return Promise.reject(new Error(`Unknown preset: ${presetName}`));
      return this.animate(element, preset, options);
    },

    fadeIn(element: HTMLElement, duration = 300) { return this.preset(element, 'FADE_IN', { duration }); },
    fadeOut(element: HTMLElement, duration = 300) { return this.preset(element, 'FADE_OUT', { duration }); },
    slideInLeft(element: HTMLElement, duration = 400) { return this.preset(element, 'SLIDE_IN_LEFT', { duration }); },
    slideInRight(element: HTMLElement, duration = 400) { return this.preset(element, 'SLIDE_IN_RIGHT', { duration }); },
    scaleIn(element: HTMLElement, duration = 300) { return this.preset(element, 'SCALE_IN', { duration }); },
    shake(element: HTMLElement) { return this.preset(element, 'SHAKE'); },
    pulse(element: HTMLElement) { return this.preset(element, 'PULSE'); },

    async sequence(animations: unknown) {
      const results = [];
      for (const anim of (animations as unknown[])) {
        // @ts-expect-error TS migration - TS2339
        const result = await this.animate((anim as Record<string, unknown>).element, anim.props, anim.options);
        results.push(result);
        // @ts-expect-error TS migration - TS2339
        if ((anim as Record<string, unknown>).delay) await new Promise(r => setTimeout(r, anim.delay));
      }
      return results;
    },

    parallel(animations: unknown) {
      // @ts-expect-error TS migration - TS2339
      return Promise.all((animations as unknown[]).map((anim: unknown) => this.animate((anim as Record<string, unknown>).element, anim.props, anim.options)));
    },

    stagger(elements: unknown, props: Record<string, unknown>, staggerMs = 50, options: Record<string, unknown> = {}) {
      if (typeof elements === 'string') elements = Array.from(document.querySelectorAll(elements));
      // @ts-expect-error strict migration — TS2345
      return Promise.all((elements as unknown[]).map((el: HTMLElement, i: number) => this.animate(el, props, { ...options, delay: (Number(options.delay) || 0) + i * staggerMs })));
    },

    cancel(id: string) {
      const anim = _animations.get(id);
      if (anim) { anim.animation.cancel(); return true; }
      return false;
    },

    cancelAll() {
      _animations.forEach(anim => anim.animation.cancel());
      _animations.clear();
    },

    pause(id: string) { const anim = _animations.get(id); if (anim) anim.animation.pause(); },
    resume(id: string) { const anim = _animations.get(id); if (anim) anim.animation.play(); },
    pauseAll() { _animations.forEach(anim => anim.animation.pause()); },
    resumeAll() { _animations.forEach(anim => anim.animation.play()); },

    isReducedMotion() { return _reducedMotion; },
    getActiveCount() { return _animations.size; },
    getMetrics() { return { ..._metrics, active: _animations.size, reducedMotion: _reducedMotion }; },
    resetMetrics() { _metrics = { started: 0, completed: 0, cancelled: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, activeAnimations: _animations.size, reducedMotion: _reducedMotion, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, activeAnimations: _animations.size, presets: Object.keys(PRESETS), easings: Object.keys(EASINGS) }; },

    destroy() { this.cancelAll(); }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getAnimationManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createAnimationManager(options); return _instance; }
export function resetAnimationManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function animate(element: HTMLElement, props: Record<string, unknown>, options: Record<string, unknown>) { return (getAnimationManager().animate as (...args: unknown[]) => unknown)(element, props, options); }
export function fadeIn(element: HTMLElement, duration: number) { return (getAnimationManager().fadeIn as (...args: unknown[]) => unknown)(element, duration); }
export function fadeOut(element: HTMLElement, duration: number) { return (getAnimationManager().fadeOut as (...args: unknown[]) => unknown)(element, duration); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, presets: Object.keys(PRESETS), easings: Object.keys(EASINGS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, EASINGS, PRESETS, createAnimationManager, getAnimationManager, resetAnimationManager, animate, fadeIn, fadeOut, info, healthCheck };
