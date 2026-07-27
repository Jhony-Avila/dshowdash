// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.animations
// PURPOSE: Overlay Layer Animations - Standardized transitions with reduce-motion
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract INIT - init() initializes animations
// @contract PREFERS_REDUCED - prefersReducedMotion() checks motion preference
// @contract GET_PRESET - getPreset() returns animation preset
// @contract GET_DEFAULT - getDefaultAnimation() returns default for type
// @contract ANIMATE_IN - animateIn() animates overlay entrance
// @contract ANIMATE_OUT - animateOut() animates overlay exit
// @contract ANIMATE_BACKDROP - animateBackdrop() animates backdrop
// @contract REGISTER_PRESET - registerPreset() adds custom preset
// @contract MAP_TYPE - mapTypeToAnimation() maps type to animation
// @contract GET_PRESETS - getPresets() returns all preset names
// @contract GET_MAPPINGS - getTypeMappings() returns type mappings
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   prefersReducedMotion() — exported function
//   getPreset() — exported function
//   getDefaultAnimation() — exported function
//   animateIn() — exported function
//   animateOut() — exported function
//   animateBackdrop() — exported function
//   registerPreset() — exported function
//   mapTypeToAnimation() — exported function
//   getPresets() — exported function
//   getTypeMappings() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): overlay:reduced-motion-change
// LISTENS (eventos): (none)
// WINDOW ACCESS: window.matchMedia, Element.prototype.animate
// ───────────────────────────────────────────────────────────────
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.1-ENTERPRISE: ES5 Object.values fix in healthCheck
// @changelog P17WI: PortsFactory/PortsProfiles pattern
// @changelog P18EC: Events Contracts Migration - Agente 04
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-animations';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _prefersReducedMotion = false;
let _mediaQuery: DynObj = null;

const ANIMATION_PRESETS = {
  fade: { enter: { opacity: [0, 1], transform: ['scale(0.95)', 'scale(1)'] }, exit: { opacity: [1, 0], transform: ['scale(1)', 'scale(0.95)'] }, duration: 200, easing: 'ease-out' },
  slideUp: { enter: { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] }, exit: { opacity: [1, 0], transform: ['translateY(0)', 'translateY(20px)'] }, duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slideDown: { enter: { opacity: [0, 1], transform: ['translateY(-20px)', 'translateY(0)'] }, exit: { opacity: [1, 0], transform: ['translateY(0)', 'translateY(-20px)'] }, duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slideLeft: { enter: { opacity: [0, 1], transform: ['translateX(100%)', 'translateX(0)'] }, exit: { opacity: [1, 0], transform: ['translateX(0)', 'translateX(100%)'] }, duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slideRight: { enter: { opacity: [0, 1], transform: ['translateX(-100%)', 'translateX(0)'] }, exit: { opacity: [1, 0], transform: ['translateX(0)', 'translateX(-100%)'] }, duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  zoom: { enter: { opacity: [0, 1], transform: ['scale(0.8)', 'scale(1)'] }, exit: { opacity: [1, 0], transform: ['scale(1)', 'scale(0.8)'] }, duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  backdrop: { enter: { opacity: [0, 1] }, exit: { opacity: [1, 0] }, duration: 150, easing: 'ease-out' },
  none: { enter: { opacity: [1, 1] }, exit: { opacity: [1, 1] }, duration: 0, easing: 'linear' }
};

const TYPE_ANIMATION_MAP = { modal: 'fade', dialog: 'fade', alertdialog: 'zoom', drawer: 'slideLeft', 'drawer-left': 'slideRight', 'drawer-right': 'slideLeft', 'drawer-bottom': 'slideUp', toast: 'slideDown', loading: 'fade', preloader: 'fade', menu: 'slideDown', dropdown: 'slideDown', tooltip: 'fade' };

export function init() {
  if (typeof window === 'undefined') return { ok: false };
  _mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  _prefersReducedMotion = _mediaQuery.matches;
  _mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
    _prefersReducedMotion = e.matches;
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.REDUCED_MOTION_CHANGE, { reduced: _prefersReducedMotion });
  });
  return { ok: true, reducedMotion: _prefersReducedMotion };
}

export function prefersReducedMotion() { return _prefersReducedMotion; }
export function getPreset(name: string) { return (ANIMATION_PRESETS as DynObj)[name] || ANIMATION_PRESETS.fade; }
export function getDefaultAnimation(overlayType: DynObj) { return (TYPE_ANIMATION_MAP as DynObj)[overlayType] || 'fade'; }

export function animateIn(element: HTMLElement, options: DynObj) {
  if (!options) options = {};
  if (!element) return Promise.resolve({ ok: false, reason: 'no-element' });
  const animationType = options.animation || 'fade';
  const preset = getPreset(animationType);
  if (_prefersReducedMotion && !options.forceAnimation) {
    element.style.opacity = '1';
    element.style.transform = 'none';
    return Promise.resolve({ ok: true, reduced: true, duration: 0 });
  }
  const duration = options.duration || preset.duration;
  const easing = options.easing || preset.easing;
  try {
    const animation = element.animate(preset.enter, { duration, easing, fill: 'forwards' });
    return animation.finished.then(() => ({
      ok: true,
      duration,
      animation: animationType
    }));
  } catch (error) {
    element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
    element.style.opacity = '1';
    element.style.transform = 'none';
    return new Promise(resolve => {
      setTimeout(() => { resolve({ ok: true, duration, fallback: true }); }, duration);
    });
  }
}

export function animateOut(element: HTMLElement, options: DynObj) {
  if (!options) options = {};
  if (!element) return Promise.resolve({ ok: false, reason: 'no-element' });
  const animationType = options.animation || 'fade';
  const preset = getPreset(animationType);
  if (_prefersReducedMotion && !options.forceAnimation) {
    element.style.opacity = '0';
    return Promise.resolve({ ok: true, reduced: true, duration: 0 });
  }
  const duration = options.duration || preset.duration;
  const easing = options.easing || preset.easing;
  try {
    const animation = element.animate(preset.exit, { duration, easing, fill: 'forwards' });
    return animation.finished.then(() => ({
      ok: true,
      duration,
      animation: animationType
    }));
  } catch (error) {
    element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
    element.style.opacity = '0';
    return new Promise(resolve => {
      setTimeout(() => { resolve({ ok: true, duration, fallback: true }); }, duration);
    });
  }
}

export function animateBackdrop(element: HTMLElement, show: DynObj, options: DynObj) {
  if (!options) options = {};
  if (!element) return Promise.resolve({ ok: false, reason: 'no-element' });
  const preset = getPreset('backdrop');
  const duration = _prefersReducedMotion ? 0 : (options.duration || preset.duration);
  if (_prefersReducedMotion) {
    element.style.opacity = show ? '1' : '0';
    return Promise.resolve({ ok: true, reduced: true });
  }
  const keyframes = show ? preset.enter : preset.exit;
  try {
    const animation = element.animate(keyframes, { duration, easing: preset.easing, fill: 'forwards' });
    return animation.finished.then(() => ({
      ok: true,
      duration
    }));
  } catch (error) {
    element.style.opacity = show ? '1' : '0';
    return Promise.resolve({ ok: true, fallback: true });
  }
}

export function registerPreset(name: string, config: DynObj) {
  if (!name || !config) return { ok: false };
  (ANIMATION_PRESETS as DynObj)[name] = { enter: config.enter || ANIMATION_PRESETS.fade.enter, exit: config.exit || ANIMATION_PRESETS.fade.exit, duration: config.duration || 200, easing: config.easing || 'ease-out' };
  return { ok: true, preset: name };
}

export function mapTypeToAnimation(overlayType: DynObj, animationName: string) { (TYPE_ANIMATION_MAP as DynObj)[overlayType] = animationName; return { ok: true }; }
export function getPresets() { return Object.keys(ANIMATION_PRESETS); }
export function getTypeMappings() { return Object.assign({}, TYPE_ANIMATION_MAP); }

export function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { webAnimationsAPI: typeof Element.prototype.animate === 'function', mediaQuerySupport: !!_mediaQuery, presetsAvailable: Object.keys(ANIMATION_PRESETS).length > 0, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, prefersReducedMotion: _prefersReducedMotion, presetsCount: Object.keys(ANIMATION_PRESETS).length, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, prefersReducedMotion: _prefersReducedMotion, presets: getPresets(), typeMappings: getTypeMappings(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export default { init, prefersReducedMotion, getPreset, getDefaultAnimation, animateIn, animateOut, animateBackdrop, registerPreset, mapTypeToAnimation, getPresets, getTypeMappings, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
