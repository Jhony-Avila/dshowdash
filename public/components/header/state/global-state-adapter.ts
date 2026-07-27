
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/state/global-state-adapter
// PURPOSE: Adapter for communication with system GlobalState
// ───────────────────────────────────────────────────────────────
// @contract ADAPTER_AUTHORIZED - Este é um adapter autorizado
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
// @contract P2_POLICY - Integrado com GlobalStateAccessPolicy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   recordAccess, ACCESS_TYPES, ACCESS_SOURCES from /core/policies/globalstate-access-policy.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// PROVIDES:
//   init() — initialize and detect global state
//   get(key, default) — read from global state
//   set(key, value) — write to global state
//   subscribe(key, cb) — subscribe to state changes
//   selectors — predefined state selectors
//   cleanup() — remove subscriptions
//   reset() — full reset
//   healthCheck() — module health status
//   info() — module info
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
// WINDOW ACCESS:
//   Ports.get('globalState') - único canal autorizado
//   window.* fallback removido em modo strict
// @changelog v1.5.0-FASE-B: Fase B Enterprise — fallbacks window.* eliminados, Ports único canal
// @changelog v1.4.0-STRICT-MODE: Migração completa para strict mode (NR-FULL)
// @changelog v1.3.0-P2-ENTERPRISE: Integrado GlobalStateAccessPolicy.recordAccess (NR-FULL roadmap P2)
// @changelog v1.2.0-PORTS-FIRST: Documentação contrato NR-FULL
// @changelog v1.1.0-ES6 - Task 10.1 B12: var → const/let
// ═══════════════════════════════════════════════════════════════
// Header - Global State Adapter
// @version 1.4.0-STRICT-MODE
// @description Adapter para comunicacao com GlobalState do sistema
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from '/core/policies/globalstate-access-policy.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.6.0-FASE-B';
export const MODULE_ID = 'header/state/global-state-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...rest: any[]) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

let _globalState: unknown = null;
// @ts-expect-error strict migration — TS7034
let _subscriptions = [];
let _initialized = false;
let _localCache = {};
let _resolutionMethod = 'none';

const _metrics = {
  getCount: 0,
  setCount: 0,
  subscribeCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastAccessAt: (null as unknown|null)
};

/**
 * P2: Record access via GlobalStateAccessPolicy
 * @param {string} type - ACCESS_TYPES (get, set, subscribe)
 * @param {string} key - State key accessed
 */
const _recordAccess = (type: string, key: string) => {
  try {
    const source = _resolutionMethod === 'Ports.globalState'
      ? ACCESS_SOURCES.ADAPTER_AUTHORIZED
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
  } catch (e: any) {
    // Policy not initialized yet - silent fail
  }
};

/**
 * Detecta GlobalState usando Ports (único canal autorizado)
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function _detectGlobalState() {
  if (typeof window === 'undefined') return null;

  // Primary e único: Ports (globalState) — Fase B
  const gsPort = _getPort('globalState');
  if (gsPort) {
    _resolutionMethod = 'Ports.globalState';
    return gsPort;
  }

  _resolutionMethod = 'none';
  return null;
}

export function init() {
  if (_initialized) return true;

  _initPorts();
  _globalState = _detectGlobalState();

  if (_globalState) {
    _initialized = true;
    _log('info', `GlobalState detectado via ${_resolutionMethod}`);
    return true;
  }

  _log('warn', 'GlobalState nao disponivel - usando cache local');
  _initialized = true;
  return false;
}

export function isAvailable() {
  return !!_globalState;
}

export function getResolutionMethod() {
  return _resolutionMethod;
}

// @ts-expect-error TS migration - TS17019
export function get(key: string, defaultValue?: unknown) {
  _metrics.getCount++;
  _metrics.lastAccessAt = Date.now();

  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.GET, key);

  if (_globalState) {
    try {
      let value = null;

      // @ts-expect-error TS migration - TS2339
      if (typeof _globalState.get === 'function') {
        // @ts-expect-error TS migration - TS2339
        value = _globalState.get(key);
      // @ts-expect-error TS migration - TS2339
      } else if (typeof _globalState.getState === 'function') {
        // @ts-expect-error TS migration - TS2339
        const state = _globalState.getState();
        value = _getNestedValue(state, key);
      } else if (typeof (_globalState as Record<string,unknown>)[key] !== 'undefined') {
        value = (_globalState as Record<string,unknown>)[key];
      }

      if (value !== undefined && value !== null) {
        _metrics.cacheHits++;
        (_localCache as Record<string,unknown>)[key as string] = value;
        return value;
      }
    } catch (e: any) {
      _log('warn', 'Erro ao acessar GlobalState:', e.message);
    }
  }

  _metrics.cacheMisses++;
  if (_localCache.hasOwnProperty(key)) {
    return (_localCache as Record<string,unknown>)[key as string];
  }

  return defaultValue;
}

export function set(key: string, value: unknown) {
  _metrics.setCount++;
  _metrics.lastAccessAt = Date.now();

  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.SET, key);

  (_localCache as Record<string,unknown>)[key as string] = value;

  if (_globalState) {
    try {
      // @ts-expect-error TS migration - TS2339
      if (typeof _globalState.set === 'function') {
        // @ts-expect-error TS migration - TS2339
        _globalState.set(key, value);
        return true;
      // @ts-expect-error TS migration - TS2339
      } else if (typeof _globalState.dispatch === 'function') {
        // @ts-expect-error TS migration - TS2339
        _globalState.dispatch({ type: 'SET_VALUE', key, value });
        return true;
      // @ts-expect-error TS migration - TS2339
      } else if (typeof _globalState.setState === 'function') {
        const update = {};
        (update as Record<string,unknown>)[key as string] = value;
        // @ts-expect-error TS migration - TS2339
        _globalState.setState(update);
        return true;
      }
    } catch (e: any) {
      _log('warn', 'Erro ao definir GlobalState:', e.message);
    }
  }

  return false;
}

export function subscribe(key: string, callback: Function) {
  _metrics.subscribeCount++;

  if (!_initialized) init();

  // P2: Record access
  _recordAccess(ACCESS_TYPES.SUBSCRIBE, key);

  const subscription = { key, callback, unsubscribe: (null as unknown|null) };

  if (_globalState) {
    try {
      // @ts-expect-error TS migration - TS2339
      if (typeof _globalState.subscribe === 'function') {
        // @ts-expect-error TS migration - TS2339
        subscription.unsubscribe = _globalState.subscribe((state: Record<string,unknown>) => {
          const value = key ? _getNestedValue(state, key) : state;
          callback(value);
        });
      // @ts-expect-error TS migration - TS2339
      } else if (typeof _globalState.on === 'function') {
        // @ts-expect-error TS migration - TS2339
        _globalState.on(`change:${key}`, callback);
        subscription.unsubscribe = () => {
          // @ts-expect-error TS migration - TS2339
          if (_globalState.off) _globalState.off(`change:${key}`, callback);
        };
      }
    } catch (e: any) {
      _log('warn', 'Erro ao subscrever GlobalState:', e.message);
    }
  }

  _subscriptions.push(subscription);

  return () => {
    // @ts-expect-error strict migration — TS7005
    const idx = _subscriptions.indexOf(subscription);
    // @ts-expect-error strict migration — TS7005
    if (idx > -1) _subscriptions.splice(idx, 1);
    // @ts-expect-error TS migration - TS2349
    if (subscription.unsubscribe) subscription.unsubscribe();
  };
}

function _getNestedValue(obj: Record<string,unknown>, path: string) {
  if (!path) return obj;
  const keys = path.split('.');
  let value = obj;
  for (let i = 0; i < keys.length; i++) {
    if (value === null || value === undefined) return undefined;
    // @ts-expect-error TS migration - TS2322
    value = value[keys[i]];
  }
  return value;
}

export const selectors = {
  // @ts-expect-error TS migration - TS2554
  getUser() { return get('user'); },
  // @ts-expect-error TS migration - TS2554
  getSession() { return get('session'); },
  // @ts-expect-error TS migration - TS2554
  getAuth() { return get('auth'); },
  // @ts-expect-error TS migration - TS2554
  getConfig() { return get('config'); },
  // @ts-expect-error TS migration - TS2554
  getTheme() { return get('theme'); },
  // @ts-expect-error TS migration - TS2554
  getLocale() { return get('locale'); },
  isAuthenticated() {
    // @ts-expect-error TS migration - TS2554
    const session = get('session');
    return session && session.isAuthenticated === true;
  },
  getUserId() {
    // @ts-expect-error TS migration - TS2554
    const user = get('user');
    return user ? user.id : null;
  },
  getUserLevel() {
    // @ts-expect-error TS migration - TS2554
    const user = get('user');
    return user ? (user.level || 0) : 0;
  }
};

export function cleanup() {
  // @ts-expect-error strict migration — TS7005
  _subscriptions.forEach(sub => {
    if (sub.unsubscribe) sub.unsubscribe();
  });
  _subscriptions = [];
  _log('info', 'Subscricoes limpas');
}

export function reset() {
  cleanup();
  _localCache = {};
  _initialized = false;
  _globalState = null;
  _resolutionMethod = 'none';
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    subscriptionCount: _subscriptions.length,
    cacheSize: Object.keys(_localCache).length,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod
  });
}

export function resetMetrics() {
  _metrics.getCount = 0;
  _metrics.setCount = 0;
  _metrics.subscribeCount = 0;
  _metrics.cacheHits = 0;
  _metrics.cacheMisses = 0;
  _metrics.lastAccessAt = null;
}

export function healthCheck() {
  const cacheHitRate = (_metrics.cacheHits + _metrics.cacheMisses) > 0
    ? _metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses)
    : 0;

  const strictMode = isStrict();
  const checks = {
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    usingPorts: _resolutionMethod === 'Ports.globalState',
    strictModeCompliant: !strictMode || _resolutionMethod === 'Ports.globalState' || _resolutionMethod === 'none',
    hasSelectors: Object.keys(selectors).length > 0,
    goodCacheHitRate: cacheHitRate >= 0.5 || (_metrics.cacheHits + _metrics.cacheMisses) < 10,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= total - 1 ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    cacheHitRate,
    resolutionMethod: _resolutionMethod,
    strictMode,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod,
    subscriptionCount: _subscriptions.length,
    cacheSize: Object.keys(_localCache).length,
    selectorsAvailable: Object.keys(selectors),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  isAvailable,
  getResolutionMethod,
  get,
  set,
  subscribe,
  selectors,
  cleanup,
  reset,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
