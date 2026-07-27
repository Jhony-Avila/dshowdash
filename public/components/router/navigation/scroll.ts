// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.navigation.scroll
// PURPOSE: Router Navigation - Scroll Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   SCROLL_TELEMETRY — exported value
//   init() — exported function
//   savePosition() — exported function
//   restorePosition() — exported function
//   scrollToTop() — exported function
//   scrollToElement() — exported function
//   scrollToFragment() — exported function
//   clearPositions() — exported function
//   setEnabled() — exported function
//   setBehavior() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.pageXOffset
//   window.pageYOffset
//   window.scrollTo
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.navigation.scroll';
const VERSION = '2.2.0-P18EC';

const SCROLL_TELEMETRY = {
  RESTORE: 'router:scroll:restore'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; positions: Record<string, { x: number; y: number; timestamp: number }>; behavior: ScrollBehavior; enabled: boolean } = { initialized: false, positions: {}, behavior: 'smooth', enabled: true };
const _metrics = { saves: 0, restores: 0, scrollsToTop: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function savePosition(key: string) { if (!_state.enabled || typeof window === 'undefined') return { ok: false }; key = key || window.location.hash || '/'; _state.positions[key] = { x: window.scrollX || window.pageXOffset || 0, y: window.scrollY || window.pageYOffset || 0, timestamp: Date.now() }; _metrics.saves++; return { ok: true, position: _state.positions[key] }; }

function restorePosition(key: string, options: Record<string, unknown>) { if (!_state.enabled || typeof window === 'undefined') return { ok: false }; key = key || window.location.hash || '/'; const pos = _state.positions[key]; if (!pos) return { ok: false, reason: 'No saved position' }; options = options || {}; const behavior = (options.behavior || _state.behavior) as ScrollBehavior; window.scrollTo({ left: pos.x, top: pos.y, behavior }); _metrics.restores++; _track(SCROLL_TELEMETRY.RESTORE, { key, y: pos.y }); return { ok: true, position: pos }; }

function scrollToTop(options: Record<string, unknown>) { if (typeof window === 'undefined') return { ok: false }; options = options || {}; const behavior = (options.behavior || _state.behavior) as ScrollBehavior; window.scrollTo({ left: 0, top: 0, behavior }); _metrics.scrollsToTop++; return { ok: true }; }

function scrollToElement(selector: string | HTMLElement, options: Record<string, unknown>) { if (typeof document === 'undefined') return { ok: false }; const element = typeof selector === 'string' ? document.querySelector(selector) : selector; if (!element) return { ok: false, reason: 'Element not found' }; options = options || {}; const behavior = (options.behavior || _state.behavior) as ScrollBehavior; const offset = (options.offset || 0) as number; const top = element.getBoundingClientRect().top + window.scrollY - offset; window.scrollTo({ left: 0, top, behavior }); return { ok: true }; }


// @ts-expect-error TS migration - TS2554
function scrollToFragment(fragment: string) { if (!fragment || typeof document === 'undefined') return { ok: false }; const cleanFragment = fragment.charAt(0) === '#' ? fragment.substring(1) : fragment; const element = document.getElementById(cleanFragment) || document.querySelector(`[name="${cleanFragment}"]`); if (element) return scrollToElement(element); return { ok: false, reason: 'Fragment not found' }; }

function clearPositions() { _state.positions = {}; return { ok: true }; }
function setEnabled(enabled: boolean) { _state.enabled = enabled; }
function setBehavior(behavior: ScrollBehavior) { _state.behavior = behavior; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.behavior) _state.behavior = ctx.behavior as ScrollBehavior; if (ctx && ctx.enabled !== undefined) _state.enabled = ctx.enabled as boolean; _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, enabled: { ok: _state.enabled, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, enabled: _state.enabled, behavior: _state.behavior, savedPositions: Object.keys(_state.positions).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, SCROLL_TELEMETRY, init, savePosition, restorePosition, scrollToTop, scrollToElement, scrollToFragment, clearPositions, setEnabled, setBehavior, healthCheck, info };
export default { MODULE_ID, VERSION, SCROLL_TELEMETRY, init, savePosition, restorePosition, scrollToTop, scrollToElement, scrollToFragment, clearPositions, setEnabled, setBehavior, healthCheck, info, injectPorts, getPorts };
