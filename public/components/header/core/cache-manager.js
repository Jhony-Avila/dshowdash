import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/cache-manager";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _caches = /* @__PURE__ */ new Map();
const DEFAULT_TTLS = { registry: 3e5, permissions: 6e5, health: 6e4, alerts: 3e4, components: 3e5, default: 6e4 };
let _metrics = { hits: 0, misses: 0, sets: 0, deletes: 0, expires: 0, refreshes: 0 };
function CacheEntry(key, value, ttl, category) {
  this.key = key;
  this.value = value;
  this.ttl = ttl;
  this.category = category || "default";
  this.createdAt = Date.now();
  this.expiresAt = Date.now() + ttl;
  this.lastAccessedAt = Date.now();
  this.accessCount = 0;
  this.refreshTimer = null;
  this.onExpire = null;
  this.onRefresh = null;
}
CacheEntry.prototype.isExpired = function() {
  return Date.now() > this.expiresAt;
};
CacheEntry.prototype.touch = function() {
  this.lastAccessedAt = Date.now();
  this.accessCount++;
};
CacheEntry.prototype.refresh = function(newValue) {
  this.value = newValue;
  this.expiresAt = Date.now() + this.ttl;
  this.lastAccessedAt = Date.now();
};
function init(config) {
  _initPorts();
  if (config && config.ttls) {
    Object.keys(config.ttls).forEach((key) => {
      DEFAULT_TTLS[key] = config.ttls[key];
    });
  }
  _log("info", "CacheManager inicializado");
}
function get(key) {
  const entry = _caches.get(key);
  if (!entry) {
    _metrics.misses++;
    return null;
  }
  if (entry.isExpired()) {
    _metrics.expires++;
    _metrics.misses++;
    _handleExpire(entry);
    return null;
  }
  entry.touch();
  _metrics.hits++;
  return entry.value;
}
function set(key, value, options) {
  options = options || {};
  const category = options.category || "default";
  const ttl = options.ttl || DEFAULT_TTLS[category] || DEFAULT_TTLS.default;
  const autoRefresh = options.autoRefresh || false;
  const onExpire = options.onExpire || null;
  const onRefresh = options.onRefresh || null;
  if (_caches.has(key)) {
    const existing = _caches.get(key);
    if (existing.refreshTimer) {
      clearTimeout(existing.refreshTimer);
    }
  }
  const entry = new CacheEntry(key, value, ttl, category);
  entry.onExpire = onExpire;
  entry.onRefresh = onRefresh;
  if (autoRefresh && onRefresh) {
    const refreshTime = ttl * 0.8;
    entry.refreshTimer = setTimeout(() => {
      _handleAutoRefresh(entry);
    }, refreshTime);
  }
  _caches.set(key, entry);
  _metrics.sets++;
  return entry;
}
function del(key) {
  const entry = _caches.get(key);
  if (entry) {
    if (entry.refreshTimer) {
      clearTimeout(entry.refreshTimer);
    }
    _caches.delete(key);
    _metrics.deletes++;
    return true;
  }
  return false;
}
function has(key) {
  const entry = _caches.get(key);
  return entry && !entry.isExpired();
}
function _handleExpire(entry) {
  if (entry.refreshTimer) {
    clearTimeout(entry.refreshTimer);
  }
  if (typeof entry.onExpire === "function") {
    try {
      entry.onExpire(entry.key, entry.value);
    } catch (e) {
      _log("error", "onExpire error:", entry.key, e.message);
    }
  }
  _caches.delete(entry.key);
  _emitEvent("expired", { key: entry.key, category: entry.category });
}
function _handleAutoRefresh(entry) {
  _metrics.refreshes++;
  if (typeof entry.onRefresh !== "function") return;
  try {
    const result = entry.onRefresh(entry.key, entry.value);
    if (result && typeof result.then === "function") {
      result.then((newValue) => {
        if (newValue !== void 0) {
          entry.refresh(newValue);
          entry.refreshTimer = setTimeout(() => {
            _handleAutoRefresh(entry);
          }, entry.ttl * 0.8);
        }
      }).catch((e) => {
        _log("error", "Auto-refresh error:", entry.key, e.message);
      });
    } else if (result !== void 0) {
      entry.refresh(result);
      entry.refreshTimer = setTimeout(() => {
        _handleAutoRefresh(entry);
      }, entry.ttl * 0.8);
    }
  } catch (e) {
    _log("error", "Auto-refresh error:", entry.key, e.message);
  }
}
function getMultiple(keys) {
  const result = {};
  keys.forEach((key) => {
    result[key] = get(key);
  });
  return result;
}
function setMultiple(items, options) {
  Object.keys(items).forEach((key) => {
    set(key, items[key], options);
  });
}
function deleteMultiple(keys) {
  keys.forEach((key) => {
    del(key);
  });
}
function clearCategory(category) {
  let deleted = 0;
  _caches.forEach((entry, key) => {
    if (entry.category === category) {
      del(key);
      deleted++;
    }
  });
  _log("info", "Cleared category:", category, `(${deleted} entries)`);
  return deleted;
}
function getByCategory(category) {
  const result = {};
  _caches.forEach((entry, key) => {
    if (entry.category === category && !entry.isExpired()) {
      result[key] = entry.value;
    }
  });
  return result;
}
function setTTL(key, newTTL) {
  const entry = _caches.get(key);
  if (entry) {
    entry.ttl = newTTL;
    entry.expiresAt = Date.now() + newTTL;
    return true;
  }
  return false;
}
function getTTL(key) {
  const entry = _caches.get(key);
  if (entry && !entry.isExpired()) {
    return entry.expiresAt - Date.now();
  }
  return -1;
}
function extendTTL(key, additionalTime) {
  const entry = _caches.get(key);
  if (entry) {
    entry.expiresAt += additionalTime;
    return entry.expiresAt - Date.now();
  }
  return -1;
}
function cleanup() {
  let expired = 0;
  _caches.forEach((entry, key) => {
    if (entry.isExpired()) {
      _handleExpire(entry);
      expired++;
    }
  });
  if (expired > 0) {
    _log("info", "Cleanup removed", expired, "expired entries");
  }
  return expired;
}
function clear() {
  _caches.forEach((entry) => {
    if (entry.refreshTimer) {
      clearTimeout(entry.refreshTimer);
    }
  });
  _caches.clear();
  _log("info", "Cache cleared");
}
function getStats() {
  const stats = { total: 0, byCategory: {}, expired: 0 };
  _caches.forEach((entry) => {
    if (entry.isExpired()) {
      stats.expired++;
    } else {
      stats.total++;
      if (!stats.byCategory[entry.category]) {
        stats.byCategory[entry.category] = 0;
      }
      stats.byCategory[entry.category]++;
    }
  });
  return stats;
}
function getMetrics() {
  const hitRate = _metrics.hits + _metrics.misses > 0 ? (_metrics.hits / (_metrics.hits + _metrics.misses) * 100).toFixed(1) : 0;
  return Object.assign({}, _metrics, { hitRate: `${hitRate}%`, size: _caches.size });
}
function resetMetrics() {
  _metrics = { hits: 0, misses: 0, sets: 0, deletes: 0, expires: 0, refreshes: 0 };
}
function _emitEvent(type, data) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:cache:${type}`, Object.assign({ timestamp: Date.now() }, data));
  }
}
function healthCheck() {
  _initPorts();
  const stats = getStats();
  const hitRate = _metrics.hits + _metrics.misses > 0 ? _metrics.hits / (_metrics.hits + _metrics.misses) : 1;
  const checks = { hasEntries: stats.total > 0 || _metrics.sets === 0, goodHitRate: hitRate >= 0.5 || _metrics.hits + _metrics.misses < 5, lowExpireRate: _metrics.sets === 0 || _metrics.expires / _metrics.sets < 0.3, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, hitRate: `${(hitRate * 100).toFixed(1)}%`, size: _caches.size, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, stats: getStats(), metrics: getMetrics(), defaultTTLs: Object.assign({}, DEFAULT_TTLS), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var cache_manager_default = { VERSION, MODULE_ID, init, get, set, del, has, clearCategory, cleanup, clear, getStats, getMetrics, healthCheck, info };
export {
  DEFAULT_TTLS,
  MODULE_ID,
  VERSION,
  cleanup,
  clear,
  clearCategory,
  cache_manager_default as default,
  del,
  deleteMultiple,
  extendTTL,
  get,
  getByCategory,
  getMetrics,
  getMultiple,
  getPorts,
  getStats,
  getTTL,
  has,
  healthCheck,
  info,
  init,
  injectPorts,
  resetMetrics,
  set,
  setMultiple,
  setTTL
};
