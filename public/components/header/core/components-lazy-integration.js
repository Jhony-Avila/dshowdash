import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as LazyLoader from "./lazy-loader.js";
import * as FeatureFlags from "./feature-flags.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/components-lazy-integration";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
let _componentsLoader = null;
let _initialized = false;
let _lazyEnabled = false;
const _metrics = {
  lazyLoadedCount: 0,
  eagerLoadedCount: 0,
  failedLoads: 0,
  lastLoadAt: null
};
function init(componentsLoader, config) {
  if (_initialized) return;
  _initPorts();
  _componentsLoader = componentsLoader;
  _lazyEnabled = FeatureFlags.isEnabled("lazyLoadingEnabled");
  if (!_lazyEnabled) {
    _log("info", "Lazy loading desabilitado via feature flag");
    _initialized = true;
    return;
  }
  LazyLoader.init(componentsLoader, {
    eagerLoadCritical: true,
    lazyLoadThreshold: 0.1,
    loadTimeout: 1e4,
    parallelLoads: 3,
    priorityOrder: ["right", "left", "center"]
  });
  _initialized = true;
  _log("info", "Lazy integration inicializada");
}
function loadComponent(componentName) {
  if (!_initialized || !_lazyEnabled) {
    return _loadDirect(componentName);
  }
  _metrics.lastLoadAt = Date.now();
  return LazyLoader.lazyLoad(componentName).then((result) => {
    if (result.success) {
      _metrics.lazyLoadedCount++;
      _log("info", "Componente lazy-loaded:", componentName);
    }
    return result;
  }).catch((error) => {
    _metrics.failedLoads++;
    _log("error", "Falha ao lazy-load:", componentName, error.message);
    return _loadDirect(componentName);
  });
}
function _loadDirect(componentName) {
  if (!_componentsLoader) {
    return Promise.reject(new Error("ComponentsLoader nao disponivel"));
  }
  let config = null;
  if (_componentsLoader.componentsList) {
    config = _componentsLoader.componentsList.find((c) => c.name === componentName);
  }
  if (!config) {
    return Promise.reject(new Error(`Componente nao encontrado: ${componentName}`));
  }
  _metrics.eagerLoadedCount++;
  return _componentsLoader.loadComponent(config).then((instance) => ({
    name: componentName,
    success: !!instance,
    instance
  }));
}
function loadRegion(regionName) {
  if (!_lazyEnabled) {
    _log("warn", "Lazy loading desabilitado");
    return Promise.resolve([]);
  }
  return LazyLoader.loadRegion(regionName);
}
function loadAllRegions() {
  if (!_lazyEnabled) {
    _log("warn", "Lazy loading desabilitado");
    return Promise.resolve({ regions: [], totalComponents: 0 });
  }
  return LazyLoader.loadAll();
}
function startObserving() {
  if (!_lazyEnabled) return;
  LazyLoader.observeRegions();
  _log("info", "Observacao de regioes iniciada");
}
function stopObserving() {
  LazyLoader.unobserveRegions();
}
function isLoaded(componentName) {
  return LazyLoader.isComponentLoaded(componentName);
}
function preload(componentName) {
  if (!_lazyEnabled) return Promise.resolve();
  return loadComponent(componentName);
}
function preloadMultiple(componentNames) {
  return Promise.all(componentNames.map((name) => preload(name).catch(() => null)));
}
function getMetrics() {
  const lazyMetrics = _lazyEnabled ? LazyLoader.getMetrics() : {};
  return Object.assign({}, _metrics, { lazy: lazyMetrics, enabled: _lazyEnabled });
}
function resetMetrics() {
  _metrics.lazyLoadedCount = 0;
  _metrics.eagerLoadedCount = 0;
  _metrics.failedLoads = 0;
  _metrics.lastLoadAt = null;
}
function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasComponentsLoader: !!_componentsLoader,
    lazyLoaderHealthy: _lazyEnabled ? LazyLoader.healthCheck().status !== "UNHEALTHY" : true,
    lowFailureRate: _metrics.lazyLoadedCount + _metrics.eagerLoadedCount === 0 || _metrics.failedLoads / (_metrics.lazyLoadedCount + _metrics.eagerLoadedCount + _metrics.failedLoads) < 0.2,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    lazyEnabled: _lazyEnabled,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    lazyEnabled: _lazyEnabled,
    metrics: getMetrics(),
    lazyLoaderStatus: _lazyEnabled ? LazyLoader.getAllRegionsStatus() : null,
    healthCheck: healthCheck()
  };
}
var components_lazy_integration_default = {
  VERSION,
  MODULE_ID,
  init,
  loadComponent,
  loadRegion,
  loadAllRegions,
  startObserving,
  stopObserving,
  isLoaded,
  preload,
  preloadMultiple,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  components_lazy_integration_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isLoaded,
  loadAllRegions,
  loadComponent,
  loadRegion,
  preload,
  preloadMultiple,
  resetMetrics,
  startObserving,
  stopObserving
};
