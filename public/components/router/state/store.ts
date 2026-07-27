// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.state.store
// PURPOSE: Router State - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   routerStore — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   createVirtualRoute() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   getState() — exported function
//   setRoute() — exported function
//   setCurrentRoute() — exported function
//   setNavigating() — exported function
//   setVirtualRoute() — exported function
//   getVirtualRoute() — exported function
//   setAttemptedRoute() — exported function
//   getAttemptedRoute() — exported function
//   clearAttemptedRoute() — exported function
//   setError() — exported function
//   getError() — exported function
//   clearError() — exported function
//   getParams() — exported function
//   getQuery() — exported function
//   getMeta() — exported function
//   getCurrentRoute() — exported function
//   getPreviousRoute() — exported function
//   getHistory() — exported function
//   isNavigating() — exported function
//   subscribe() — exported function
//   reset() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// @changelog v2.4.0-P18EC: Fix createVirtualRoute to include view, tab, section, entity, id, sort, filters, page fields consumed by syncNavigation
// @changelog v2.3.0-P18EC: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

const MODULE_ID = 'components.router.state.store';
const VERSION = '2.4.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; currentRoute: Record<string, unknown> | null; previousRoute: Record<string, unknown> | null; params: Record<string, unknown>; query: Record<string, unknown>; meta: Record<string, unknown>; isNavigating: boolean; history: Record<string, unknown>[]; virtualRoute: unknown; attemptedRoute: string | null; attemptedOptions: Record<string, unknown> | null; error: unknown } = {
  initialized: false,
  currentRoute: null,
  previousRoute: null,
  params: {},
  query: {},
  meta: {},
  isNavigating: false,
  history: [],
  virtualRoute: null,
  attemptedRoute: null,
  attemptedOptions: null,
  error: null
};
let _subscribers: ((snapshot: Record<string, unknown>) => void)[] = [];
const _metrics = { updates: 0, notifications: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _notify() { _metrics.notifications++; const snapshot = getState(); for (let i = 0; i < _subscribers.length; i++) { try { _subscribers[i](snapshot); } catch (e) { } } }

function getState() { return { currentRoute: _state.currentRoute, previousRoute: _state.previousRoute, params: Object.assign({}, _state.params), query: Object.assign({}, _state.query), meta: Object.assign({}, _state.meta), isNavigating: _state.isNavigating, virtualRoute: _state.virtualRoute, error: _state.error }; }

function setRoute(route: Record<string, unknown>, params: Record<string, unknown>, query: Record<string, unknown>, meta: Record<string, unknown>) { _metrics.updates++; _state.previousRoute = _state.currentRoute; _state.currentRoute = route; _state.params = params || {}; _state.query = query || {}; _state.meta = meta || {}; _state.history.push({ route, params, query, timestamp: Date.now() }); if (_state.history.length > 50) _state.history.shift(); _emit(ROUTER_EVENTS.STATE_CHANGED, getState()); _notify(); return { ok: true }; }

function setCurrentRoute(route: Record<string, unknown>) { return setRoute(route, route ? route.params as Record<string, unknown> : {}, route ? route.query as Record<string, unknown> : {}, route ? route.meta as Record<string, unknown> : {}); }

function setNavigating(isNavigating: boolean) { _state.isNavigating = isNavigating; _emit(ROUTER_EVENTS.STATE_NAVIGATING, { isNavigating }); return { ok: true }; }

function setVirtualRoute(virtualRoute: unknown) { _state.virtualRoute = virtualRoute; _emit(ROUTER_EVENTS.VIRTUAL_ROUTE_CHANGED, { virtualRoute }); return { ok: true }; }
function getVirtualRoute() { return _state.virtualRoute; }

function setAttemptedRoute(path: string, options: Record<string, unknown>) { _state.attemptedRoute = path; _state.attemptedOptions = options || null; return { ok: true }; }
function getAttemptedRoute() { return _state.attemptedRoute ? { path: _state.attemptedRoute, options: _state.attemptedOptions } : null; }
function clearAttemptedRoute() { _state.attemptedRoute = null; _state.attemptedOptions = null; return { ok: true }; }

function setError(error: unknown) { _state.error = error; return { ok: true }; }
function getError() { return _state.error; }
function clearError() { _state.error = null; return { ok: true }; }

function getParams() { return Object.assign({}, _state.params); }
function getQuery() { return Object.assign({}, _state.query); }
function getMeta() { return Object.assign({}, _state.meta); }
function getCurrentRoute() { return _state.currentRoute; }
function getPreviousRoute() { return _state.previousRoute; }
function getHistory() { return _state.history.slice(); }
function isNavigating() { return _state.isNavigating; }

function subscribe(callback: (event: Record<string, unknown>) => void) { if (typeof callback !== 'function') return () => {}; _subscribers.push(callback); return () => { const idx = _subscribers.indexOf(callback); if (idx >= 0) _subscribers.splice(idx, 1); }; }

function reset() { _state.currentRoute = null; _state.previousRoute = null; _state.params = {}; _state.query = {}; _state.meta = {}; _state.isNavigating = false; _state.history = []; _state.virtualRoute = null; _state.attemptedRoute = null; _state.attemptedOptions = null; _state.error = null; _notify(); return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _subscribers = []; reset(); _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasRoute: { ok: !!_state.currentRoute, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, currentRoute: _state.currentRoute, isNavigating: _state.isNavigating, historyLength: _state.history.length, subscribersCount: _subscribers.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }
function getMetrics() { return Object.assign({}, _metrics); }

// v2.4.0: createVirtualRoute - factory for virtual route objects
// Now includes view, tab, section, entity, id, sort, filters, page fields consumed by syncNavigation in integrations.js
export function createVirtualRoute(config?: Record<string, unknown>) {
  if (!config) return null;
  return {
    view: config.view || null,
    tab: config.tab || null,
    section: config.section || null,
    entity: config.entity || null,
    id: config.id || null,
    mode: config.mode || 'default',
    page: config.page || null,
    sort: config.sort || null,
    filters: config.filters || null,
    panelId: config.panelId || null,
    panelIds: config.panelIds || [],
    params: config.params || {},
    timestamp: Date.now()
  };
}

// routerStore named export for router-global compatibility
export const routerStore = {
  MODULE_ID,
  VERSION,
  init,
  cleanup,
  getState,
  setRoute,
  setCurrentRoute,
  setNavigating,
  setVirtualRoute,
  getVirtualRoute,
  setAttemptedRoute,
  getAttemptedRoute,
  clearAttemptedRoute,
  setError,
  getError,
  clearError,
  getParams,
  getQuery,
  getMeta,
  getCurrentRoute,
  getPreviousRoute,
  getHistory,
  isNavigating,
  subscribe,
  reset,
  healthCheck,
  info,
  getMetrics,
  injectPorts,
  getPorts
};

export { MODULE_ID, VERSION, init, cleanup, getState, setRoute, setCurrentRoute, setNavigating, setVirtualRoute, getVirtualRoute, setAttemptedRoute, getAttemptedRoute, clearAttemptedRoute, setError, getError, clearError, getParams, getQuery, getMeta, getCurrentRoute, getPreviousRoute, getHistory, isNavigating, subscribe, reset, healthCheck, info, getMetrics };
export default routerStore;
