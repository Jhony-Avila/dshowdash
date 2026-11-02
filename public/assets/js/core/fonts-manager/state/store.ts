// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-store
// PURPOSE: Fonts Manager - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   setStatus() — exported function
//   setSources() — exported function
//   addLoadedSource() — exported function
//   addFailedSource() — exported function
//   setRoles() — exported function
//   setTypography() — exported function
//   setMetrics() — exported function
//   setInitialized() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 8.3.0-STRICT-MODE
// @changelog v8.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v8.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v8.1.1-P17WI - Logger via ports pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export var MODULE_ID = 'fonts-manager-store';
export var VERSION = '8.3.0-STRICT-MODE';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  var portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

var _log = function(level: string, ...rest: any[]) {
  var logger = _getLogger();
  if (!logger) return;
  var args = Array.prototype.slice.call(arguments, 1);
  var prefix = '[FontsStore]';
  if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; }
  if (level === 'debug') { if (logger.debug) logger.debug.apply(logger, [prefix].concat(args)); return; }
};

var initialState = { initialized: false, status: 'idle', lastUpdated: null as unknown | null, error: null as unknown | null, sources: [] as unknown[], loadedSources: [] as unknown[], failedSources: [] as unknown[], roles: { heading: { family: null as unknown | null, weight: 700 }, body: { family: null as unknown | null, weight: 400 }, mono: { family: null as unknown | null, weight: 400 }, label: { family: null as unknown | null, weight: 500 }, caption: { family: null as unknown | null, weight: 400 } }, typography: { htmlFontSize: 16, baseFontSize: 14, variants: {} }, metrics: { loadTime: 0, sourcesCount: 0, loadedCount: 0, failedCount: 0 } };

var state = JSON.parse(JSON.stringify(initialState));
var listeners = new Set<any>();

function notify() { listeners.forEach(function(fn) { try { fn(getState()); } catch (e) { _log('error', 'Listener error:', e); } }); }
export function getState() { return JSON.parse(JSON.stringify(state)); }
export function get(key: string) { var value = state[key]; return typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value; }
export function set(partial: unknown) { if (!partial || typeof partial !== 'object') return; Object.assign(state, partial); state.lastUpdated = Date.now(); notify(); }
export function setStatus(status: string, error?: string) { state.status = status; state.error = error || null; state.lastUpdated = Date.now(); notify(); }
export function setSources(sources: unknown) { state.sources = Array.isArray(sources) ? sources.slice() : []; state.metrics.sourcesCount = state.sources.length; state.lastUpdated = Date.now(); notify(); }
export function addLoadedSource(sourceId: unknown) { if (state.loadedSources.indexOf(sourceId) === -1) { state.loadedSources.push(sourceId); state.metrics.loadedCount = state.loadedSources.length; state.lastUpdated = Date.now(); notify(); } }
export function addFailedSource(sourceId: unknown, error: string | Error) { var exists = state.failedSources.find(function(s: unknown) { return (s as Record<string, unknown>).id === sourceId; }); if (!exists) { state.failedSources.push({ id: sourceId, error: typeof error === 'string' ? error : (error && error.message ? error.message : String(error)) }); state.metrics.failedCount = state.failedSources.length; state.lastUpdated = Date.now(); notify(); } }
export function setRoles(roles: Record<string, unknown>) { if (roles && typeof roles === 'object') { state.roles = Object.assign({}, state.roles, roles); state.lastUpdated = Date.now(); notify(); } }
export function setTypography(typography: unknown) { if (typography && typeof typography === 'object') { state.typography = Object.assign({}, state.typography, typography); state.lastUpdated = Date.now(); notify(); } }
export function setMetrics(partial: unknown) { if (partial && typeof partial === 'object') { state.metrics = Object.assign({}, state.metrics, partial); state.lastUpdated = Date.now(); } }
export function setInitialized(value: unknown) { state.initialized = Boolean(value); state.lastUpdated = Date.now(); notify(); }
export function subscribe(listener: (...args: unknown[]) => void) { if (typeof listener === 'function') { listeners.add(listener); return function() { listeners.delete(listener); }; } return function() {}; }
export function reset() { state = JSON.parse(JSON.stringify(initialState)); notify(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, strictMode: isStrict() }; }
export function healthCheck() { return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, storeStatus: state.status, portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, getState: getState, get: get, set: set, setStatus: setStatus, setSources: setSources, addLoadedSource: addLoadedSource, addFailedSource: addFailedSource, setRoles: setRoles, setTypography: setTypography, setMetrics: setMetrics, setInitialized: setInitialized, subscribe: subscribe, reset: reset, info: info, healthCheck: healthCheck, injectPorts: injectPorts, getPorts: getPorts };
