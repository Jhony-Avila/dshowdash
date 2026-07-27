
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: app-shell-api-usage-metrics
// PURPOSE: App Shell API Usage Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   trackCall() — exported function
//   wrapMethod() — exported function
//   getMetrics() — exported function
//   getAllMetrics() — exported function
//   getTopAPIs() — exported function
//   getUnusedAPIs() — exported function
//   getAPIsWithErrors() — exported function
//   getSummaryByNamespace() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   reset() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-api-usage-metrics';

// ============================================================================
// STATE
// ============================================================================

const _apiCalls = new Map();
let _enabled = true;
let _startTime = Date.now();

const _config = {
  trackAll: true,
  sampleRate: 1.0,
  maxEntries: 1000,
  persistToStorage: false
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _shouldTrack() {
  if (!_enabled) return false;
  if (_config.sampleRate < 1.0) {
    return Math.random() < _config.sampleRate;
  }
  return true;
}

function _getOrCreateEntry(namespace: DynObj, method: string) {
  const key = `${namespace}.${method}`;
  if (!_apiCalls.has(key)) {
    _apiCalls.set(key, {
      namespace,
      method,
      calls: 0,
      errors: 0,
      firstCall: null,
      lastCall: null,
      totalDuration: 0,
      avgDuration: 0
    });
  }
  return _apiCalls.get(key);
}

// ============================================================================
// CORE API
// ============================================================================

/**
 * Registra chamada de API
 * @param {string} namespace - Namespace (ex: 'theme', 'visibility')
 * @param {string} method - Nome do metodo
 * @param {number} [duration] - Duracao em ms (opcional)
 * @param {boolean} [hadError] - Se houve erro
 */
export function trackCall(namespace: DynObj, method: string, duration: number, hadError: DynObj) {
  if (!_shouldTrack()) return;
  
  const entry = _getOrCreateEntry(namespace, method);
  const now = Date.now();
  
  entry.calls++;
  entry.lastCall = now;
  if (!entry.firstCall) entry.firstCall = now;
  
  if (hadError) entry.errors++;
  
  if (typeof duration === 'number' && duration >= 0) {
    entry.totalDuration += duration;
    entry.avgDuration = Math.round(entry.totalDuration / entry.calls);
  }
  
  // Limitar tamanho
  if (_apiCalls.size > _config.maxEntries) {
    let oldest = null;
    let oldestTime = Infinity;
    _apiCalls.forEach((val, key) => {
      if (val.lastCall < oldestTime) {
        oldestTime = val.lastCall;
        oldest = key;
      }
    });
    if (oldest) _apiCalls.delete(oldest);
  }
}

/**
 * Cria wrapper que rastreia chamadas automaticamente
 * @param {string} namespace
 * @param {string} method
 * @param {function} fn
 * @returns {function}
 */
export function wrapMethod(this: any, namespace: DynObj, method: string, fn: DynObj) {
  return function() {
    const start = performance.now();
    let hadError = false;
    let result;
    
    try {
      // @ts-expect-error strict migration — TS2683
      result = fn.apply(this, arguments);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.then((res: DynObj) => {
          trackCall(namespace, method, performance.now() - start, false);
          return res;
        }).catch((err: DynObj) => {
          trackCall(namespace, method, performance.now() - start, true);
          throw err;
        });
      }
    } catch (e) {
      hadError = true;
      throw e;
    } finally {
      if (!result || typeof result.then !== 'function') {
        trackCall(namespace, method, performance.now() - start, hadError);
      }
    }
    
    return result;
  };
}

/**
 * Retorna metricas de uma API especifica
 * @param {string} namespace
 * @param {string} [method]
 * @returns {Object|Array}
 */
export function getMetrics(namespace: DynObj, method: string) {
  if (method) {
    const key = `${namespace}.${method}`;
    return _apiCalls.get(key) || null;
  }
  
  const results: DynObj[] = [];
  _apiCalls.forEach(entry => {
    if (entry.namespace === namespace) {
      results.push(Object.assign({}, entry));
    }
  });
  return results;
}

/**
 * Retorna todas as metricas
 * @returns {Array}
 */
export function getAllMetrics() {
  const results: DynObj[] = [];
  _apiCalls.forEach(entry => {
    results.push(Object.assign({}, entry));
  });
  return results;
}

/**
 * Retorna top N APIs mais usadas
 * @param {number} [n=10]
 * @returns {Array}
 */
export function getTopAPIs(n: number) {
  n = n || 10;
  const all = getAllMetrics();
  all.sort((a, b) => b.calls - a.calls);
  return all.slice(0, n);
}

/**
 * Retorna APIs nunca usadas (para deprecacao)
 * @param {Array} expectedAPIs - Lista de APIs esperadas
 * @returns {Array}
 */
export function getUnusedAPIs(expectedAPIs: DynObj) {
  const used = new Set();
  _apiCalls.forEach((entry, key) => {
    used.add(key);
  });
  
  const unused = [];
  for (let i = 0; i < expectedAPIs.length; i++) {
    if (!used.has(expectedAPIs[i])) {
      unused.push(expectedAPIs[i]);
    }
  }
  return unused;
}

/**
 * Retorna APIs com erros
 * @returns {Array}
 */
export function getAPIsWithErrors() {
  const results: DynObj[] = [];
  _apiCalls.forEach(entry => {
    if (entry.errors > 0) {
      results.push(Object.assign({}, entry, {
        errorRate: `${Math.round((entry.errors / entry.calls) * 100)}%`
      }));
    }
  });
  return results;
}

/**
 * Retorna resumo por namespace
 * @returns {Object}
 */
export function getSummaryByNamespace() {
  const summary = {};
  _apiCalls.forEach(entry => {
    if (!(summary as DynObj)[entry.namespace]) {
      (summary as DynObj)[entry.namespace] = { calls: 0, errors: 0, methods: 0 };
    }
    (summary as DynObj)[entry.namespace].calls += entry.calls;
    (summary as DynObj)[entry.namespace].errors += entry.errors;
    (summary as DynObj)[entry.namespace].methods++;
  });
  return summary;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }

export function configure(options: DynObj) {
  if (options.trackAll !== undefined) _config.trackAll = !!options.trackAll;
  if (options.sampleRate !== undefined) _config.sampleRate = Math.max(0, Math.min(1, options.sampleRate));
  if (options.maxEntries !== undefined) _config.maxEntries = Math.max(100, options.maxEntries);
  if (options.persistToStorage !== undefined) _config.persistToStorage = !!options.persistToStorage;
}

export function getConfig() {
  return {
    enabled: _enabled,
    trackAll: _config.trackAll,
    sampleRate: _config.sampleRate,
    maxEntries: _config.maxEntries,
    persistToStorage: _config.persistToStorage
  };
}

export function reset() {
  _apiCalls.clear();
  _startTime = Date.now();
}

// ============================================================================
// HEALTH CHECK & INFO
// ============================================================================

export function healthCheck() {
  let totalCalls = 0;
  let totalErrors = 0;
  _apiCalls.forEach(entry => {
    totalCalls += entry.calls;
    totalErrors += entry.errors;
  });
  
  const checks = {
    enabled: _enabled,
    notOverloaded: _apiCalls.size < _config.maxEntries * 0.9,
    lowErrorRate: totalCalls === 0 || (totalErrors / totalCalls) < 0.1
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed === keys.length ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${keys.length}`,
    checks,
    totalAPIs: _apiCalls.size,
    totalCalls,
    totalErrors,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  let totalCalls = 0;
  let totalErrors = 0;
  _apiCalls.forEach(entry => {
    totalCalls += entry.calls;
    totalErrors += entry.errors;
  });
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    config: getConfig(),
    totalAPIs: _apiCalls.size,
    totalCalls,
    totalErrors,
    uptime: Date.now() - _startTime,
    topAPIs: getTopAPIs(5),
    summaryByNamespace: getSummaryByNamespace(),
    timestamp: Date.now()
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  // Core
  trackCall,
  wrapMethod,
  // Queries
  getMetrics,
  getAllMetrics,
  getTopAPIs,
  getUnusedAPIs,
  getAPIsWithErrors,
  getSummaryByNamespace,
  // Config
  enable,
  disable,
  isEnabled,
  configure,
  getConfig,
  reset,
  // Health
  healthCheck,
  info
};
