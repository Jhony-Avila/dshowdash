// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.core.transitions
// PURPOSE: Router Core - View Transitions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   RouteTransitions — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   TRANSITIONS — exported value
//   TRANSITIONS_TELEMETRY — exported value
//   init() — exported function
//   transitionOut() — exported function
//   transitionIn() — exported function
//   transition() — exported function
//   setEnabled() — exported function
//   isEnabled() — exported function
//   setDefaultDuration() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.core.transitions';
const VERSION = '2.3.0-P18EC';

const TRANSITIONS_TELEMETRY = { START: 'router:transition:start', COMPLETE: 'router:transition:complete' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _config = { enabled: true, defaultDuration: 300, defaultEasing: 'ease-in-out' };
const _metrics = { started: 0, completed: 0, skipped: 0, errors: 0 };

const TRANSITIONS = { FADE: 'fade', SLIDE_LEFT: 'slide-left', SLIDE_RIGHT: 'slide-right', SLIDE_UP: 'slide-up', SLIDE_DOWN: 'slide-down', NONE: 'none' };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function _applyTransition(element: HTMLElement, type: string, direction: string, duration: number) {
  if (!element || type === TRANSITIONS.NONE) { _metrics.skipped++; return Promise.resolve({ ok: true, skipped: true }); }
  _metrics.started++;
  return new Promise(resolve => {
    const originalTransition = element.style.transition; const originalOpacity = element.style.opacity; const originalTransform = element.style.transform;
    element.style.transition = `opacity ${duration}ms ${_config.defaultEasing}, transform ${duration}ms ${_config.defaultEasing}`;
    if (direction === 'out') { element.style.opacity = '0'; if (type === TRANSITIONS.SLIDE_LEFT) element.style.transform = 'translateX(-20px)'; else if (type === TRANSITIONS.SLIDE_RIGHT) element.style.transform = 'translateX(20px)'; else if (type === TRANSITIONS.SLIDE_UP) element.style.transform = 'translateY(-20px)'; else if (type === TRANSITIONS.SLIDE_DOWN) element.style.transform = 'translateY(20px)'; }
    else { element.style.opacity = '1'; element.style.transform = 'translateX(0) translateY(0)'; }
    setTimeout(() => { (element as HTMLElement).style.transition = originalTransition; if (direction === 'in') { (element as HTMLElement).style.opacity = originalOpacity; (element as HTMLElement).style.transform = originalTransform; } _metrics.completed++; resolve({ ok: true }); }, duration);
  });
}

function transitionOut(element: HTMLElement, type: string, options: Record<string, unknown> = {}) {
  const duration = (options.duration || _config.defaultDuration) as number;return _applyTransition(element, type || TRANSITIONS.FADE, 'out', duration);
}
function transitionIn(element: HTMLElement, type: string, options: Record<string, unknown> = {}) {
  const duration = (options.duration || _config.defaultDuration) as number;if (type !== TRANSITIONS.NONE) { element.style.opacity = '0'; if (type === TRANSITIONS.SLIDE_LEFT) element.style.transform = 'translateX(20px)'; else if (type === TRANSITIONS.SLIDE_RIGHT) element.style.transform = 'translateX(-20px)'; else if (type === TRANSITIONS.SLIDE_UP) element.style.transform = 'translateY(20px)'; else if (type === TRANSITIONS.SLIDE_DOWN) element.style.transform = 'translateY(-20px)'; }return _applyTransition(element, type || TRANSITIONS.FADE, 'in', duration);
}

function transition(outElement: HTMLElement, inElement: HTMLElement, type: string, options: Record<string, unknown> = {}) {
  _track(TRANSITIONS_TELEMETRY.START, { type });return transitionOut(outElement, type, options).then(() => transitionIn(inElement, type, options)).then(() => { _track(TRANSITIONS_TELEMETRY.COMPLETE, { type }); return { ok: true }; }).catch(err => { _metrics.errors++; return { ok: false, error: err && err.message || 'transition_error' }; });
}

function setEnabled(enabled: boolean) { _config.enabled = enabled; }
function isEnabled() { return _config.enabled; }
function setDefaultDuration(duration: number) { _config.defaultDuration = duration; }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { enabled: { ok: _config.enabled, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: _config.enabled, defaultDuration: _config.defaultDuration, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export const RouteTransitions = {
  MODULE_ID, VERSION, TRANSITIONS, TRANSITIONS_TELEMETRY,
  init, transitionOut, transitionIn, transition,
  setEnabled, isEnabled, setDefaultDuration,
  healthCheck, info, injectPorts, getPorts
};

export { MODULE_ID, VERSION, TRANSITIONS, TRANSITIONS_TELEMETRY, init, transitionOut, transitionIn, transition, setEnabled, isEnabled, setDefaultDuration, healthCheck, info };
export default RouteTransitions;
