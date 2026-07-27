import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "cache-warming";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, warn(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const _config = { enabled: true, maxConcurrent: 4, timeout: 1e4, retries: 2, retryDelay: 1e3, respectDataSaver: true, cacheName: "preloader-cache-v1", priorityLevels: ["critical", "high", "normal", "low"] };
const _resources = /* @__PURE__ */ new Map();
const _warmedResources = /* @__PURE__ */ new Set();
const _pendingWarm = /* @__PURE__ */ new Set();
let _cacheInstance = null;
const _metrics = { totalResources: 0, warmedResources: 0, failedResources: 0, totalBytes: 0, warmingTime: 0, lastWarmAt: null };
function _inferType(url) {
  let ext = url.split(".").pop();
  if (ext) ext = ext.toLowerCase();
  const typeMap = { js: "script", mjs: "script", css: "style", png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", woff: "font", woff2: "font", ttf: "font", otf: "font", json: "data", html: "document" };
  return typeMap[ext] || "fetch";
}
function _inferAs(url) {
  const type = _inferType(url);
  const asMap = { script: "script", style: "style", image: "image", font: "font", data: "fetch", document: "document" };
  return asMap[type] || "fetch";
}
function _isDataSaverEnabled() {
  return hasWindow && typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData === true;
}
function registerResource(url, options) {
  if (!options) options = {};
  const resource = { url, type: options.type || _inferType(url), priority: options.priority || "normal", preload: options.preload !== void 0 ? options.preload : true, cache: options.cache !== void 0 ? options.cache : true, integrity: options.integrity || null, crossOrigin: options.crossOrigin || null, as: options.as || _inferAs(url), dependencies: options.dependencies || [], metadata: options.metadata || {} };
  _resources.set(url, resource);
  _metrics.totalResources = _resources.size;
  return resource;
}
function registerResources(resources) {
  resources.forEach((r) => {
    if (typeof r === "string") {
      registerResource(r);
    } else {
      registerResource(r.url, r);
    }
  });
  return _resources.size;
}
function unregisterResource(url) {
  return _resources.delete(url);
}
function getResource(url) {
  return _resources.get(url) || null;
}
function getAllResources() {
  return Array.from(_resources.values());
}
function _warmResource(resource, retryCount) {
  if (!retryCount) retryCount = 0;
  if (_warmedResources.has(resource.url)) {
    return Promise.resolve({ url: resource.url, success: true, cached: true });
  }
  if (_pendingWarm.has(resource.url)) {
    return Promise.resolve({ url: resource.url, success: false, reason: "pending" });
  }
  _pendingWarm.add(resource.url);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, _config.timeout);
  return fetch(resource.url, { signal: controller.signal, credentials: resource.crossOrigin ? "include" : "same-origin", cache: "force-cache" }).then((response) => {
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (resource.cache && _cacheInstance) {
      return _cacheInstance.put(resource.url, response.clone()).then(() => response);
    }
    return response;
  }).then((response) => {
    const size = parseInt(response.headers.get("content-length") || "0", 10);
    _metrics.totalBytes += size;
    _warmedResources.add(resource.url);
    _metrics.warmedResources = _warmedResources.size;
    log.debug("Resource warmed", { url: resource.url, size });
    return { url: resource.url, success: true, size };
  }).catch((error) => {
    clearTimeout(timeout);
    if (retryCount < _config.retries) {
      return new Promise((resolve) => {
        setTimeout(resolve, _config.retryDelay);
      }).then(() => _warmResource(resource, (retryCount || 0) + 1));
    }
    _metrics.failedResources++;
    log.warn("Failed to warm resource", { url: resource.url, error: error.message });
    return { url: resource.url, success: false, error: error.message };
  }).then((result) => {
    _pendingWarm.delete(resource.url);
    return result;
  });
}
function warmAll(options) {
  if (!options) options = {};
  _initPorts();
  if (!_config.enabled) return Promise.resolve({ success: false, reason: "disabled" });
  if (_config.respectDataSaver && _isDataSaverEnabled()) {
    return Promise.resolve({ success: false, reason: "data-saver" });
  }
  const startTime = Date.now();
  const priority = options.priority || null;
  let resourcesToWarm = Array.from(_resources.values());
  if (priority) {
    const priorityIndex = _config.priorityLevels.indexOf(priority);
    resourcesToWarm = resourcesToWarm.filter((r) => _config.priorityLevels.indexOf(r.priority) <= priorityIndex);
  }
  resourcesToWarm.sort((a, b) => _config.priorityLevels.indexOf(a.priority) - _config.priorityLevels.indexOf(b.priority));
  let results = [];
  let i = 0;
  function processBatch() {
    if (i >= resourcesToWarm.length) {
      _metrics.warmingTime = Date.now() - startTime;
      _metrics.lastWarmAt = Date.now();
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      log.info("Cache warming complete", { successful, failed, time: _metrics.warmingTime });
      return { success: true, total: results.length, successful, failed, duration: _metrics.warmingTime, results };
    }
    const batch = resourcesToWarm.slice(i, i + _config.maxConcurrent);
    return Promise.all(batch.map((r) => _warmResource(r))).then((batchResults) => {
      results = results.concat(batchResults);
      if (options.onProgress) {
        options.onProgress({ completed: Math.min(i + _config.maxConcurrent, resourcesToWarm.length), total: resourcesToWarm.length, percent: Math.round((i + _config.maxConcurrent) / resourcesToWarm.length * 100) });
      }
      i += _config.maxConcurrent;
      return processBatch();
    });
  }
  return Promise.resolve().then(processBatch);
}
function warmByPriority(priority) {
  return warmAll({ priority });
}
function warmCritical() {
  return warmByPriority("critical");
}
function injectPreloadLinks(priority) {
  if (!priority) priority = "critical";
  if (typeof document === "undefined") return 0;
  const priorityIndex = _config.priorityLevels.indexOf(priority);
  let count = 0;
  _resources.forEach((resource) => {
    if (_config.priorityLevels.indexOf(resource.priority) > priorityIndex) return;
    if (!resource.preload) return;
    const existing = document.querySelector(`link[href="${resource.url}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = resource.url;
    link.as = resource.as;
    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin;
    }
    if (resource.integrity) {
      link.integrity = resource.integrity;
    }
    document.head.appendChild(link);
    count++;
  });
  log.debug("Preload links injected", { count });
  return count;
}
function initCache() {
  if (typeof caches === "undefined") return Promise.resolve(false);
  return caches.open(_config.cacheName).then((cache) => {
    _cacheInstance = cache;
    log.debug("Cache initialized", { name: _config.cacheName });
    return true;
  }).catch((e) => {
    log.warn("Failed to init cache", { error: e.message });
    return false;
  });
}
function clearCache() {
  if (typeof caches === "undefined") return Promise.resolve(false);
  return caches.delete(_config.cacheName).then(() => {
    _warmedResources.clear();
    _metrics.warmedResources = 0;
    _metrics.totalBytes = 0;
    log.info("Cache cleared");
    return true;
  }).catch(() => false);
}
function getCacheSize() {
  if (!_cacheInstance) return Promise.resolve(0);
  return _cacheInstance.keys().then((keys) => keys.length).catch(() => 0);
}
function isWarmed(url) {
  return _warmedResources.has(url);
}
function getMetrics() {
  return Object.assign({}, _metrics, { warmRate: _metrics.totalResources > 0 ? `${(_metrics.warmedResources / _metrics.totalResources * 100).toFixed(2)}%` : "0%" });
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _config.enabled, cacheReady: !!_cacheInstance, resources: _resources.size, warmed: _warmedResources.size, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, features: ["resource-registration", "priority-warming", "preload-injection", "cache-api", "data-saver-respect"], portsInitialized: Ports.isInitialized(), status: getStatus() };
}
var cache_warming_default = { VERSION, MODULE_ID, registerResource, registerResources, unregisterResource, getResource, getAllResources, warmAll, warmByPriority, warmCritical, isWarmed, injectPreloadLinks, initCache, clearCache, getCacheSize, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clearCache,
  cache_warming_default as default,
  getAllResources,
  getCacheSize,
  getMetrics,
  getPorts,
  getResource,
  getStatus,
  healthCheck,
  info,
  initCache,
  injectPorts,
  injectPreloadLinks,
  isWarmed,
  registerResource,
  registerResources,
  unregisterResource,
  warmAll,
  warmByPriority,
  warmCritical
};
