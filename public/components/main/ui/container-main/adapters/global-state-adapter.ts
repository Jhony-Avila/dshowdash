// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:global-state-adapter
// PURPOSE: Container-Main GlobalState Adapter
// ───────────────────────────────────────────────────────────────
// @contract ADAPTER_AUTHORIZED - Este é um adapter autorizado
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
// @contract P2_POLICY - Integrado com GlobalStateAccessPolicy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   recordAccess, ACCESS_TYPES, ACCESS_SOURCES from /core/policies/globalstate-access-policy.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   init() — exported function
//   isAvailable() — exported function
//   isInitialized() — exported function
//   get() — exported function
//   set() — exported function
//   subscribe() — exported function
//   selectors — exported value
//   getMany() — exported function
//   setMany() — exported function
//   setSyncEnabled() — exported function
//   cleanup() — exported function
//   reset() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   Core.windowAdapter.get('GlobalState') - único canal autorizado
//   window.* fallback removido em modo strict
// @changelog v1.4.0-FASE-B: Fase B Enterprise — fallbacks window.* eliminados, Core.windowAdapter único canal
// @changelog v1.3.0-STRICT-MODE: Migração completa para strict mode, sem fallbacks (NR-FULL)
// @changelog v1.2.0-P2-ENTERPRISE: Integrado GlobalStateAccessPolicy.recordAccess (NR-FULL roadmap P2)
// @changelog v1.1.0-PORTS-FIRST: Migração para Core.windowAdapter (NR-FULL)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from '/core/policies/globalstate-access-policy.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.5.0-FASE-B';
export const MODULE_ID = 'container-main:global-state-adapter';

let _globalState: Record<string, unknown> | null = null;
let _eventBus: Record<string, unknown> | null = null;
let _subscriptions = new Map();
let _localCache = new Map();
let _initialized = false;
let _syncEnabled = true;
let _resolutionMethod = 'none';

let _metrics = { getCount: 0, setCount: 0, subscribeCount: 0, syncCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0, lastSyncAt: null as number | null };

const STATE_MAPPINGS = Object.freeze({
  'container:activePanel': 'ui.container.activePanel',
  'container:layout': 'ui.container.layout',
  'container:fullscreen': 'ui.container.fullscreen',
  'container:theme': 'ui.theme',
  'kernel:state': 'ui.container.kernelState'
});

const REVERSE_MAPPINGS = Object.freeze({
  'user': 'context:user',
  'session': 'context:session',
  'auth.isAuthenticated': 'context:authenticated',
  'config': 'context:config',
  'ui.theme': 'container:theme',
  'ui.locale': 'context:locale'
});

/**
 * P2: Record access via GlobalStateAccessPolicy
 * @param {string} type - ACCESS_TYPES (get, set, subscribe)
 * @param {string} key - State key accessed
 */
function _recordAccess(type: string, key: string) {
  try {
    const source = _resolutionMethod === 'Core.windowAdapter'
      ? ACCESS_SOURCES.CORE_WINDOW_ADAPTER
      : _resolutionMethod.startsWith('window.')
        ? ACCESS_SOURCES.WINDOW_DIRECT
        : ACCESS_SOURCES.ADAPTER_AUTHORIZED;

    recordAccess({
      type,
      source,
      key,
      caller: MODULE_ID,
      moduleId: MODULE_ID
    });
  } catch (e) {
    // Policy not initialized yet - silent fail
  }
}

/**
 * Detecta GlobalState usando Core.windowAdapter (único canal autorizado)
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function _detectGlobalState() {
  if (typeof window === 'undefined') return null;

  // Primary e único: Core.windowAdapter — Fase B
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const gs = window.Core.windowAdapter.get('GlobalState');
    if (gs) {
      _resolutionMethod = 'Core.windowAdapter';
      return gs;
    }
  }

  _resolutionMethod = 'none';
  return null;
}

function _getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function _emit(event: string, data: Record<string, unknown>) {
  if (_eventBus && typeof _eventBus.emit === 'function') {
    (_eventBus.emit as (event: string, data: Record<string, unknown>) => void)(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}

export function injectEventBus(eventBus: Record<string, unknown>) { _eventBus = eventBus; }

export function init(options: Record<string, unknown> = {}) {
  if (_initialized) return { ok: true, cached: true };
  const { eventBus, syncOnInit = true } = options;
  if (eventBus) _eventBus = eventBus as Record<string, unknown>;
  _globalState = _detectGlobalState();
  if (_globalState) {
    if (syncOnInit) _syncFromGlobalState();
    _initialized = true;
    _emit('globalstate:connected', { available: true, resolutionMethod: _resolutionMethod });
    return { ok: true, available: true, resolutionMethod: _resolutionMethod };
  }
  _initialized = true;
  _emit('globalstate:unavailable', {});
  return { ok: true, available: false };
}

export function isAvailable() { return !!_globalState; }
export function isInitialized() { return _initialized; }
export function getResolutionMethod() { return _resolutionMethod; }

export function get(key: string, defaultValue: unknown = undefined) {
  _metrics.getCount++;
  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.GET, key);

  if (_globalState) {
    try {
      let value = null;
      const globalKey = ((STATE_MAPPINGS as Record<string, string>)[key] || key) as string;
      if (typeof _globalState.get === 'function') {
        value = _globalState.get(globalKey);
      } else if (typeof _globalState.getState === 'function') {
        value = _getNestedValue(_globalState.getState() as Record<string, unknown>, globalKey);
      }
      if (value !== undefined && value !== null) {
        _metrics.cacheHits++;
        _localCache.set(key, value);
        return value;
      }
    } catch (e) { _metrics.errors++; }
  }
  _metrics.cacheMisses++;
  return _localCache.has(key) ? _localCache.get(key) : defaultValue;
}

export function set(key: string, value: unknown, options: Record<string, unknown> = {}) {
  _metrics.setCount++;
  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.SET, key);

  const { syncToGlobal = true, silent = false } = options;
  const oldValue = _localCache.get(key);
  _localCache.set(key, value);
  if (!silent && oldValue !== value) _emit('localstate:changed', { key, value, oldValue });
  if (syncToGlobal && _syncEnabled && _globalState) {
    try {
      const globalKey = ((STATE_MAPPINGS as Record<string, string>)[key] || key) as string;
      if (typeof _globalState.set === 'function') { _globalState.set(globalKey, value); _metrics.syncCount++; return true; }
      if (typeof _globalState.dispatch === 'function') { _globalState.dispatch({ type: 'CONTAINER_STATE_UPDATE', payload: { key: globalKey, value } }); _metrics.syncCount++; return true; }
    } catch (e) { _metrics.errors++; }
  }
  return false;
}

export function subscribe(key: string, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  _metrics.subscribeCount++;
  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.SUBSCRIBE, key);

  const { immediate = false } = options;
  const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const sub = { id: subId, key, callback, globalUnsubscribe: null as (() => void) | null };
  if (_globalState && typeof _globalState.subscribe === 'function') {
    try {
      const globalKey = ((STATE_MAPPINGS as Record<string, string>)[key] || key) as string;
      sub.globalUnsubscribe = (_globalState.subscribe as (cb: (state: Record<string, unknown>) => void) => () => void)((state: Record<string, unknown>) => {
        const value = _getNestedValue(state, globalKey);
        const oldValue = _localCache.get(key);
        if (value !== oldValue) { _localCache.set(key, value); callback(value, oldValue, key); }
      });
    } catch (e) { _metrics.errors++; }
  }
  _subscriptions.set(subId, sub);
  if (immediate) { const v = get(key); if (v !== undefined) callback(v, undefined, key); }
  return () => { const s = _subscriptions.get(subId); if (s) { s.globalUnsubscribe?.(); _subscriptions.delete(subId); } };
}

function _syncFromGlobalState() {
  if (!_globalState) return { synced: 0 };
  let synced = 0;
  for (const [globalKey, containerKey] of Object.entries(REVERSE_MAPPINGS)) {
    try {
      let value = typeof _globalState.get === 'function' ? _globalState.get(globalKey) : typeof _globalState.getState === 'function' ? _getNestedValue(_globalState.getState() as Record<string, unknown>, globalKey) : null;
      if (value !== undefined && value !== null) { _localCache.set(containerKey, value); synced++; }
    } catch (e) {}
  }
  _metrics.lastSyncAt = Date.now();
  return { synced };
}

export const selectors = {
  getUser: () => get('context:user'),
  getSession: () => get('context:session'),
  isAuthenticated: () => get('context:authenticated', false),
  getTheme: () => get('container:theme', 'light'),
  getActivePanel: () => get('container:activePanel'),
  getUserId: () => get('context:user')?.id || null,
  getUserLevel: () => get('context:user')?.level || 0
};

export function getMany(keys: string[]) { const r: Record<string, unknown> = {}; for (const k of keys) r[k] = get(k); return r; }
export function setMany(values: Record<string, unknown>, opts: Record<string, unknown> = {}) { let s = 0; for (const [k, v] of Object.entries(values)) if (set(k, v, opts)) s++; return { success: s, total: Object.keys(values).length }; }
export function setSyncEnabled(enabled: boolean) { _syncEnabled = enabled; }
export function cleanup() { _subscriptions.forEach(s => s.globalUnsubscribe?.()); _subscriptions.clear(); }
export function reset() { cleanup(); _localCache.clear(); _initialized = false; _globalState = null; _syncEnabled = true; _resolutionMethod = 'none'; }
export function getMetrics() { return { ..._metrics, subscriptionCount: _subscriptions.size, cacheSize: _localCache.size, globalStateAvailable: !!_globalState, resolutionMethod: _resolutionMethod }; }
export function resetMetrics() { _metrics = { getCount: 0, setCount: 0, subscribeCount: 0, syncCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0, lastSyncAt: null }; }

export function healthCheck() {
  const hitRate = (_metrics.cacheHits + _metrics.cacheMisses) > 0 ? _metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) : 0;
  const strictMode = isStrict();
  const checks = {
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    usingCoreWindowAdapter: _resolutionMethod === 'Core.windowAdapter',
    strictModeCompliant: !strictMode || _resolutionMethod === 'Core.windowAdapter' || _resolutionMethod === 'none',
    syncEnabled: _syncEnabled,
    goodCacheHitRate: hitRate >= 0.5 || (_metrics.cacheHits + _metrics.cacheMisses) < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return {
    status: passed < 2 ? 'UNHEALTHY' : passed < maxScore - 1 ? 'DEGRADED' : 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    score: `${passed}/${maxScore}`,
    resolutionMethod: _resolutionMethod,
    strictMode,
    checks,
    metrics: getMetrics()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod,
    subscriptionCount: _subscriptions.size,
    cacheSize: _localCache.size,
    selectors: Object.keys(selectors)
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  isAvailable,
  isInitialized,
  getResolutionMethod,
  injectEventBus,
  get,
  set,
  subscribe,
  getMany,
  setMany,
  selectors,
  setSyncEnabled,
  cleanup,
  reset,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
