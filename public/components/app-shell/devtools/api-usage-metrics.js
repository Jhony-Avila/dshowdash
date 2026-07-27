const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-api-usage-metrics";
const _apiCalls = /* @__PURE__ */ new Map();
let _enabled = true;
let _startTime = Date.now();
const _config = {
  trackAll: true,
  sampleRate: 1,
  maxEntries: 1e3,
  persistToStorage: false
};
function _shouldTrack() {
  if (!_enabled) return false;
  if (_config.sampleRate < 1) {
    return Math.random() < _config.sampleRate;
  }
  return true;
}
function _getOrCreateEntry(namespace, method) {
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
function trackCall(namespace, method, duration, hadError) {
  if (!_shouldTrack()) return;
  const entry = _getOrCreateEntry(namespace, method);
  const now = Date.now();
  entry.calls++;
  entry.lastCall = now;
  if (!entry.firstCall) entry.firstCall = now;
  if (hadError) entry.errors++;
  if (typeof duration === "number" && duration >= 0) {
    entry.totalDuration += duration;
    entry.avgDuration = Math.round(entry.totalDuration / entry.calls);
  }
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
function wrapMethod(namespace, method, fn) {
  return function() {
    const start = performance.now();
    let hadError = false;
    let result;
    try {
      result = fn.apply(this, arguments);
      if (result && typeof result.then === "function") {
        return result.then((res) => {
          trackCall(namespace, method, performance.now() - start, false);
          return res;
        }).catch((err) => {
          trackCall(namespace, method, performance.now() - start, true);
          throw err;
        });
      }
    } catch (e) {
      hadError = true;
      throw e;
    } finally {
      if (!result || typeof result.then !== "function") {
        trackCall(namespace, method, performance.now() - start, hadError);
      }
    }
    return result;
  };
}
function getMetrics(namespace, method) {
  if (method) {
    const key = `${namespace}.${method}`;
    return _apiCalls.get(key) || null;
  }
  const results = [];
  _apiCalls.forEach((entry) => {
    if (entry.namespace === namespace) {
      results.push(Object.assign({}, entry));
    }
  });
  return results;
}
function getAllMetrics() {
  const results = [];
  _apiCalls.forEach((entry) => {
    results.push(Object.assign({}, entry));
  });
  return results;
}
function getTopAPIs(n) {
  n = n || 10;
  const all = getAllMetrics();
  all.sort((a, b) => b.calls - a.calls);
  return all.slice(0, n);
}
function getUnusedAPIs(expectedAPIs) {
  const used = /* @__PURE__ */ new Set();
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
function getAPIsWithErrors() {
  const results = [];
  _apiCalls.forEach((entry) => {
    if (entry.errors > 0) {
      results.push(Object.assign({}, entry, {
        errorRate: `${Math.round(entry.errors / entry.calls * 100)}%`
      }));
    }
  });
  return results;
}
function getSummaryByNamespace() {
  const summary = {};
  _apiCalls.forEach((entry) => {
    if (!summary[entry.namespace]) {
      summary[entry.namespace] = { calls: 0, errors: 0, methods: 0 };
    }
    summary[entry.namespace].calls += entry.calls;
    summary[entry.namespace].errors += entry.errors;
    summary[entry.namespace].methods++;
  });
  return summary;
}
function enable() {
  _enabled = true;
}
function disable() {
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function configure(options) {
  if (options.trackAll !== void 0) _config.trackAll = !!options.trackAll;
  if (options.sampleRate !== void 0) _config.sampleRate = Math.max(0, Math.min(1, options.sampleRate));
  if (options.maxEntries !== void 0) _config.maxEntries = Math.max(100, options.maxEntries);
  if (options.persistToStorage !== void 0) _config.persistToStorage = !!options.persistToStorage;
}
function getConfig() {
  return {
    enabled: _enabled,
    trackAll: _config.trackAll,
    sampleRate: _config.sampleRate,
    maxEntries: _config.maxEntries,
    persistToStorage: _config.persistToStorage
  };
}
function reset() {
  _apiCalls.clear();
  _startTime = Date.now();
}
function healthCheck() {
  let totalCalls = 0;
  let totalErrors = 0;
  _apiCalls.forEach((entry) => {
    totalCalls += entry.calls;
    totalErrors += entry.errors;
  });
  const checks = {
    enabled: _enabled,
    notOverloaded: _apiCalls.size < _config.maxEntries * 0.9,
    lowErrorRate: totalCalls === 0 || totalErrors / totalCalls < 0.1
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
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
function info() {
  let totalCalls = 0;
  let totalErrors = 0;
  _apiCalls.forEach((entry) => {
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
var api_usage_metrics_default = {
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
export {
  MODULE_ID,
  VERSION,
  configure,
  api_usage_metrics_default as default,
  disable,
  enable,
  getAPIsWithErrors,
  getAllMetrics,
  getConfig,
  getMetrics,
  getSummaryByNamespace,
  getTopAPIs,
  getUnusedAPIs,
  healthCheck,
  info,
  isEnabled,
  reset,
  trackCall,
  wrapMethod
};
