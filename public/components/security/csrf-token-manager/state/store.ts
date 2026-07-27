// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager-store
// PURPOSE: CSRF Token Manager - Store v2.1.0-ENTERPRISE-FIX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   csrfStore — exported value
//   init() — exported function
//   isInitialized() — exported function
//   getState() — exported function
//   getToken() — exported function
//   getConfig() — exported function
//   getDeps() — exported function
//   getStats() — exported function
//   setToken() — exported function
//   setRefreshing() — exported function
//   clearToken() — exported function
//   isValid() — exported function
//   subscribe() — exported function
//   addHandler() — exported function
//   removeHandler() — exported function
//   getHandlers() — exported function
//   reset() — exported function
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

export const VERSION = '2.1.0-ENTERPRISE-FIX';
export const MODULE_ID = 'csrf-token-manager-store';

// Estado interno
let _state: { token: string | null; expiresAt: number | null; refreshing: boolean; lastRefresh: number | null; initialized: boolean } = { token: null, expiresAt: null, refreshing: false, lastRefresh: null, initialized: false };
let _config: Record<string, unknown> = {};
let _deps: Record<string, unknown> = {};
let _subscribers: Array<(state: typeof _state) => void> = [];
let _handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
let _stats: { refreshCount: number; errorCount: number; lastError: string | null } = { refreshCount: 0, errorCount: 0, lastError: null };

// Inicialização
export function init(config = {}, deps = {}) {
  _config = { ...config };
  _deps = { ...deps };
  _state.initialized = true;
}

export function isInitialized() { return _state.initialized; }

// Getters
export function getState() { return { ..._state }; }
export function getToken() { return _state.token; }
export function getConfig() { return { ..._config }; }
export function getDeps() { return { ..._deps }; }
export function getStats() { return { ..._stats, state: getState() }; }

// Setters
export function setToken(token: string | null, expiresAt: number | null = null) {
  _state.token = token;
  _state.expiresAt = expiresAt;
  _state.lastRefresh = Date.now();
  _stats.refreshCount++;
  _notify();
}

export function setRefreshing(val: boolean) { _state.refreshing = val; _notify(); }

export function clearToken() {
  _state.token = null;
  _state.expiresAt = null;
  _notify();
}

// Validação
export function isValid() { return _state.token && (!_state.expiresAt || _state.expiresAt > Date.now()); }

// Subscribers
export function subscribe(fn: (state: typeof _state) => void) {
  if (typeof fn === 'function') _subscribers.push(fn);
  return () => { _subscribers = _subscribers.filter(s => s !== fn); };
}

function _notify() { _subscribers.forEach(fn => { try { fn(_state); } catch (e) {} }); }

// Handlers
export function addHandler(eventName: string, handler: (...args: unknown[]) => void) {
  if (!_handlers[eventName]) _handlers[eventName] = [];
  if (typeof handler === 'function') _handlers[eventName].push(handler);
}

export function removeHandler(eventName: string, handler: (...args: unknown[]) => void) {
  if (_handlers[eventName]) {
    _handlers[eventName] = _handlers[eventName].filter(h => h !== handler);
  }
}

export function getHandlers(eventName: string) { return _handlers[eventName] || []; }

// Reset
export function reset() {
  _state = { token: null, expiresAt: null, refreshing: false, lastRefresh: null, initialized: false };
  _config = {};
  _deps = {};
  _subscribers = [];
  _handlers = {};
  _stats = { refreshCount: 0, errorCount: 0, lastError: null };
}

// Enterprise methods
export function healthCheck() {
  const checks = { hasState: true, initialized: _state.initialized, hasToken: !!_state.token, tokenValid: isValid() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, refreshing: _state.refreshing, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasToken: !!_state.token, isValid: isValid(), refreshing: _state.refreshing, timestamp: Date.now() };
}

// Objeto csrfStore exportado
export const csrfStore = {
  init,
  isInitialized,
  getState,
  getToken,
  getConfig,
  getDeps,
  getStats,
  setToken,
  setRefreshing,
  clearToken,
  isValid,
  subscribe,
  addHandler,
  removeHandler,
  getHandlers,
  reset,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};

export default csrfStore;
