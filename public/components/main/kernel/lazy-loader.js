import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "main-kernel-lazy-loader";
const VERSION = "1.4.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
let _kernel = null;
let _enabled = false;
const _routeFeatureMap = /* @__PURE__ */ new Map();
const _loadedFeatures = /* @__PURE__ */ new Set();
const _pendingLoads = /* @__PURE__ */ new Map();
let _config = {
  preloadOnHover: true,
  hoverDelayMs: 200,
  loadTimeoutMs: 1e4
};
const _metrics = {
  lazyLoadsTriggered: 0,
  lazyLoadsCompleted: 0,
  lazyLoadsFailed: 0,
  preloadsTriggered: 0,
  cacheHits: 0,
  totalLoadTimeMs: 0
};
const DEFAULT_ROUTE_MAP = {
  "panel-1": [],
  "panel-2": [],
  "panel-3": [],
  "panel-4": [],
  "panel-5": [],
  "panel-6": [],
  "panel-7": [],
  "panel-8": [],
  "panel-9": [],
  "panel-10": [],
  "panel-11": [],
  "panel-12": ["analytics-tracker"],
  "panel-13": [],
  "panel-14": [],
  "panel-15": [],
  "settings": ["ux-feedback"],
  "admin": ["analytics-tracker", "session-sync"]
};
function init(kernel, options) {
  if (!kernel) return { ok: false, error: "Kernel required" };
  _kernel = kernel;
  if (options) {
    if (options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    if (options.routeMap) {
      for (const route in options.routeMap) {
        if (options.routeMap.hasOwnProperty(route)) {
          _routeFeatureMap.set(route, options.routeMap[route]);
        }
      }
    }
  }
  for (const r in DEFAULT_ROUTE_MAP) {
    if (DEFAULT_ROUTE_MAP.hasOwnProperty(r) && !_routeFeatureMap.has(r)) {
      _routeFeatureMap.set(r, DEFAULT_ROUTE_MAP[r]);
    }
  }
  _enabled = true;
  if (typeof window !== "undefined") {
    window.lazyLoader = {
      loadForRoute: loadFeaturesForRoute,
      preload: preloadFeature,
      isLoaded: isFeatureLoaded,
      getMap: getRouteMap,
      status: getStatus
    };
  }
  return { ok: true, version: VERSION, routesMapped: _routeFeatureMap.size };
}
function destroy() {
  _kernel = null;
  _enabled = false;
  _routeFeatureMap.clear();
  _loadedFeatures.clear();
  _pendingLoads.clear();
  if (typeof window !== "undefined") {
    delete window.lazyLoader;
  }
  return { ok: true };
}
async function loadFeaturesForRoute(route, options) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: "Lazy loader not initialized" };
  }
  const featureIds = _routeFeatureMap.get(route) || [];
  if (featureIds.length === 0) {
    return { ok: true, route, features: [], message: "No features mapped" };
  }
  const results = [];
  for (let i = 0; i < featureIds.length; i++) {
    const featureId = featureIds[i];
    const result = await loadFeature(featureId, options);
    results.push(result);
  }
  const succeeded = results.filter((r) => r.ok).length;
  return {
    ok: succeeded === results.length,
    route,
    features: featureIds,
    results,
    succeeded,
    failed: results.length - succeeded
  };
}
async function loadFeature(featureId, options) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: "Lazy loader not initialized" };
  }
  if (_loadedFeatures.has(featureId)) {
    _metrics.cacheHits++;
    return { ok: true, featureId, cached: true };
  }
  if (_pendingLoads.has(featureId)) {
    return _pendingLoads.get(featureId);
  }
  _metrics.lazyLoadsTriggered++;
  const startTime = performance.now();
  const loadPromise = _doLoadFeature(featureId, options, startTime);
  _pendingLoads.set(featureId, loadPromise);
  try {
    const result = await loadPromise;
    return result;
  } finally {
    _pendingLoads.delete(featureId);
  }
}
async function _doLoadFeature(featureId, options, startTime) {
  const opts = options || {};
  const logger = _getLogger();
  try {
    const featureStatus = _kernel.getFeature ? _kernel.getFeature(featureId) : null;
    if (featureStatus && featureStatus.ok && featureStatus.data) {
      if (featureStatus.data.status !== "enabled") {
        const enableResult = _kernel.enableFeature(featureId, opts.context || {});
        if (!enableResult.ok) {
          throw new Error(`Failed to enable: ${JSON.stringify(enableResult.errors)}`);
        }
      }
    } else {
      const featurePath = opts.path || `../features/${featureId}/index.js`;
      const featureModule = await _loadWithTimeout(
        import(featurePath),
        _config.loadTimeoutMs,
        featureId
      );
      const registerResult = _kernel.registerFeature({
        id: featureId,
        version: featureModule.VERSION || featureModule.default && featureModule.default.VERSION || "1.0.0",
        init: featureModule.init || featureModule.default && featureModule.default.init,
        cleanup: featureModule.destroy || featureModule.cleanup || featureModule.default && featureModule.default.destroy,
        healthCheck: featureModule.healthCheck || featureModule.default && featureModule.default.healthCheck
      });
      if (!registerResult.ok) {
        throw new Error(`Failed to register: ${JSON.stringify(registerResult.errors)}`);
      }
      const enableResult = _kernel.enableFeature(featureId, opts.context || {});
      if (!enableResult.ok) {
        throw new Error(`Failed to enable: ${JSON.stringify(enableResult.errors)}`);
      }
    }
    const duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsCompleted++;
    _metrics.totalLoadTimeMs += duration;
    _loadedFeatures.add(featureId);
    if (logger?.info) logger.info("[LazyLoader] Loaded:", featureId, `(${duration}ms)`);
    return { ok: true, featureId, duration };
  } catch (e) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsFailed++;
    if (logger?.error) {
      logger.error("[LazyLoader] Failed to load:", featureId, e);
    } else if (!isStrict()) {
      console.error("[LazyLoader] Failed to load:", featureId, e);
    }
    return { ok: false, featureId, error: e.message, duration };
  }
}
function _loadWithTimeout(promise, timeoutMs, featureId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Load timeout for ${featureId} after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
function preloadFeature(featureId) {
  if (!_enabled) return;
  _metrics.preloadsTriggered++;
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/components/main/domain/features/${featureId}/index.js`;
    link.as = "script";
    document.head.appendChild(link);
  }
}
function preloadForRoute(route) {
  const featureIds = _routeFeatureMap.get(route) || [];
  for (let i = 0; i < featureIds.length; i++) {
    if (!_loadedFeatures.has(featureIds[i])) {
      preloadFeature(featureIds[i]);
    }
  }
  return { ok: true, preloaded: featureIds.length };
}
function setRouteFeatures(route, featureIds) {
  _routeFeatureMap.set(route, featureIds);
  return { ok: true };
}
function addRouteFeature(route, featureId) {
  const features = _routeFeatureMap.get(route) || [];
  if (features.indexOf(featureId) === -1) {
    features.push(featureId);
    _routeFeatureMap.set(route, features);
  }
  return { ok: true };
}
function getRouteMap() {
  const map = {};
  _routeFeatureMap.forEach((features, route) => {
    map[route] = features.slice();
  });
  return map;
}
function isFeatureLoaded(featureId) {
  return _loadedFeatures.has(featureId);
}
function getLoadedFeatures() {
  return Array.from(_loadedFeatures);
}
function getStatus() {
  return {
    enabled: _enabled,
    routesMapped: _routeFeatureMap.size,
    featuresLoaded: _loadedFeatures.size,
    pendingLoads: _pendingLoads.size
  };
}
function getMetrics() {
  const avgLoadTime = _metrics.lazyLoadsCompleted > 0 ? Math.round(_metrics.totalLoadTimeMs / _metrics.lazyLoadsCompleted) : 0;
  return Object.assign({}, _metrics, {
    averageLoadTimeMs: avgLoadTime,
    loadedFeatures: _loadedFeatures.size,
    successRate: _metrics.lazyLoadsTriggered > 0 ? `${Math.round(_metrics.lazyLoadsCompleted / _metrics.lazyLoadsTriggered * 100)}%` : "N/A"
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    config: Object.assign({}, _config),
    routeMap: getRouteMap(),
    loadedFeatures: getLoadedFeatures(),
    metrics: getMetrics(),
    strictMode: isStrict()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    lowFailureRate: _metrics.lazyLoadsFailed < _metrics.lazyLoadsTriggered * 0.2
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: _enabled ? "HEALTHY" : "NOT_INITIALIZED",
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    strictMode: isStrict(),
    portsInitialized: _portsInitialized,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var lazy_loader_default = {
  MODULE_ID,
  VERSION,
  init,
  destroy,
  loadFeaturesForRoute,
  loadFeature,
  preloadFeature,
  preloadForRoute,
  setRouteFeatures,
  addRouteFeature,
  getRouteMap,
  isFeatureLoaded,
  getLoadedFeatures,
  getStatus,
  getMetrics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  addRouteFeature,
  lazy_loader_default as default,
  destroy,
  getLoadedFeatures,
  getMetrics,
  getPorts,
  getRouteMap,
  getStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  isFeatureLoaded,
  loadFeature,
  loadFeaturesForRoute,
  preloadFeature,
  preloadForRoute,
  setRouteFeatures
};
