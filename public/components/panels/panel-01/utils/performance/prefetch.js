import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.utils.performance.prefetch";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[prefetch]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "info") logger.info?.(prefix, ...args);
  else logger.debug?.(prefix, ...args);
};
class PrefetchManager {
  constructor(options = {}) {
    this.cache = /* @__PURE__ */ new Map();
    this.pending = /* @__PURE__ */ new Map();
    this.maxCached = options.maxCached || 5;
    this.ttl = options.ttl || 6e4;
    this.fetchFn = options.fetchFn || null;
  }
  setFetchFunction(fn) {
    this.fetchFn = fn;
  }
  async prefetch(key, params) {
    if (!this.fetchFn) return null;
    if (this.cache.has(key) && !this._isExpired(key)) return this.cache.get(key).data;
    if (this.pending.has(key)) return this.pending.get(key);
    const promise = this._fetch(key, params);
    this.pending.set(key, promise);
    try {
      const result = await promise;
      this._store(key, result);
      return result;
    } finally {
      this.pending.delete(key);
    }
  }
  async _fetch(key, params) {
    try {
      return await this.fetchFn(params);
    } catch (error) {
      _log("info", "Error:", error.message);
      return null;
    }
  }
  _store(key, data) {
    if (this.cache.size >= this.maxCached) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  _isExpired(key) {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > this.ttl;
  }
  get(key) {
    if (!this.cache.has(key) || this._isExpired(key)) return null;
    return this.cache.get(key).data;
  }
  has(key) {
    return this.cache.has(key) && !this._isExpired(key);
  }
  invalidate(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
    this.pending.clear();
  }
  prefetchNextPage(currentPage, totalPages, params) {
    if (currentPage < totalPages) {
      const nextKey = `page_${currentPage + 1}`;
      const nextParams = { ...params, page: currentPage + 1 };
      requestIdleCallback(() => this.prefetch(nextKey, nextParams), { timeout: 2e3 });
    }
  }
  prefetchAdjacentPages(currentPage, totalPages, params) {
    if (currentPage > 1) {
      const prevKey = `page_${currentPage - 1}`;
      requestIdleCallback(() => this.prefetch(prevKey, { ...params, page: currentPage - 1 }), { timeout: 3e3 });
    }
    if (currentPage < totalPages) {
      const nextKey = `page_${currentPage + 1}`;
      requestIdleCallback(() => this.prefetch(nextKey, { ...params, page: currentPage + 1 }), { timeout: 2e3 });
    }
  }
}
function createPrefetchManager(options = {}) {
  return new PrefetchManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var prefetch_default = { PrefetchManager, createPrefetchManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PrefetchManager,
  VERSION,
  createPrefetchManager,
  prefetch_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
