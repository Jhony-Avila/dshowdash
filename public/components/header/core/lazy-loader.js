import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SELECTORS, CRITICALITY } from "./constants.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/lazy-loader";
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
const _regions = { left: { loaded: false, loading: false, components: [], priority: 2 }, center: { loaded: false, loading: false, components: [], priority: 3 }, right: { loaded: false, loading: false, components: [], priority: 1 } };
let _componentsLoader = null;
let _intersectionObserver = null;
const _loadedComponents = /* @__PURE__ */ new Set();
const _pendingComponents = /* @__PURE__ */ new Map();
let _metrics = { regionsLoaded: 0, componentsLoaded: 0, lazyLoaded: 0, eagerLoaded: 0, loadTime: {}, lastLoadAt: null };
const _config = { eagerLoadCritical: true, lazyLoadThreshold: 0.1, loadTimeout: 1e4, parallelLoads: 3, priorityOrder: ["right", "left", "center"] };
function init(componentsLoader, config) {
  _initPorts();
  _componentsLoader = componentsLoader;
  if (config) {
    Object.assign(_config, config);
  }
  _setupIntersectionObserver();
  _log("info", "LazyLoader inicializado");
}
function _setupIntersectionObserver() {
  if (!window.IntersectionObserver) {
    _log("warn", "IntersectionObserver nao suportado, usando eager loading");
    return;
  }
  _intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const region = entry.target.getAttribute("data-lazy-region");
        if (region && !_regions[region].loaded && !_regions[region].loading) {
          _log("debug", "Regiao visivel, carregando:", region);
          loadRegion(region);
        }
      }
    });
  }, { threshold: _config.lazyLoadThreshold, rootMargin: "50px" });
}
function loadRegion(regionName) {
  if (!_regions[regionName]) {
    _log("error", "Regiao invalida:", regionName);
    return Promise.reject(new Error(`Regiao invalida: ${regionName}`));
  }
  const region = _regions[regionName];
  if (region.loaded) {
    _log("debug", "Regiao ja carregada:", regionName);
    return Promise.resolve({ region: regionName, components: region.components });
  }
  if (region.loading) {
    _log("debug", "Regiao ja em carregamento:", regionName);
    return _pendingComponents.get(regionName) || Promise.resolve();
  }
  region.loading = true;
  const startTime = performance.now();
  _log("info", "Carregando regiao:", regionName);
  const promise = _loadRegionComponents(regionName).then((results) => {
    region.loaded = true;
    region.loading = false;
    region.components = results;
    _metrics.regionsLoaded++;
    _metrics.loadTime[regionName] = performance.now() - startTime;
    _metrics.lastLoadAt = Date.now();
    _pendingComponents.delete(regionName);
    _log("info", "Regiao carregada:", regionName, `(${results.length} componentes,${_metrics.loadTime[regionName].toFixed(0)}ms)`);
    _emitEvent("region:loaded", { region: regionName, components: results.length, time: _metrics.loadTime[regionName] });
    return { region: regionName, components: results };
  }).catch((error) => {
    region.loading = false;
    _pendingComponents.delete(regionName);
    _log("error", "Erro ao carregar regiao:", regionName, error.message);
    throw error;
  });
  _pendingComponents.set(regionName, promise);
  return promise;
}
function _loadRegionComponents(regionName) {
  if (!_componentsLoader) {
    return Promise.reject(new Error("ComponentsLoader nao configurado"));
  }
  const componentsList = _componentsLoader.componentsList || [];
  const regionComponents = componentsList.filter((comp) => comp.region === regionName);
  if (regionComponents.length === 0) {
    return Promise.resolve([]);
  }
  regionComponents.sort((a, b) => {
    const critOrder = { critical: 0, important: 1, optional: 2 };
    return (critOrder[a.criticality] || 2) - (critOrder[b.criticality] || 2);
  });
  return _loadComponentsBatch(regionComponents, 0, []);
}
function _loadComponentsBatch(components, startIndex, results) {
  if (startIndex >= components.length) {
    return Promise.resolve(results);
  }
  const batch = components.slice(startIndex, startIndex + _config.parallelLoads);
  const promises = batch.map((comp) => _loadSingleComponent(comp).then((result) => {
    results.push(result);
    return result;
  }).catch((error) => {
    results.push({ name: comp.name, success: false, error: error.message });
    return null;
  }));
  return Promise.all(promises).then(() => _loadComponentsBatch(components, startIndex + _config.parallelLoads, results));
}
function _loadSingleComponent(config) {
  if (_loadedComponents.has(config.name)) {
    return Promise.resolve({ name: config.name, success: true, cached: true });
  }
  _metrics.componentsLoaded++;
  return _componentsLoader.loadComponent(config).then((instance) => {
    _loadedComponents.add(config.name);
    return { name: config.name, success: !!instance, instance };
  });
}
function loadAll(options) {
  options = options || {};
  const priorityOrder = options.priorityOrder || _config.priorityOrder;
  _log("info", "Carregando todas as regioes, ordem:", priorityOrder.join(" -> "));
  const criticalPromise = _config.eagerLoadCritical ? _loadCriticalComponents() : Promise.resolve();
  return criticalPromise.then(() => priorityOrder.reduce((promise, region) => promise.then(() => loadRegion(region)), Promise.resolve())).then(() => {
    _log("info", "Todas as regioes carregadas");
    _emitEvent("all:loaded", { regions: Object.keys(_regions), totalComponents: _loadedComponents.size });
    return { regions: Object.keys(_regions), totalComponents: _loadedComponents.size };
  });
}
function _loadCriticalComponents() {
  if (!_componentsLoader || !_componentsLoader.componentsList) {
    return Promise.resolve();
  }
  const criticalComponents = _componentsLoader.componentsList.filter((comp) => comp.criticality === CRITICALITY.CRITICAL);
  if (criticalComponents.length === 0) {
    return Promise.resolve();
  }
  _log("info", "Carregando", criticalComponents.length, "componentes criticos (eager)");
  const promises = criticalComponents.map((comp) => {
    _metrics.eagerLoaded++;
    return _loadSingleComponent(comp).catch((error) => {
      _log("error", "Falha ao carregar componente critico:", comp.name, error.message);
      return null;
    });
  });
  return Promise.all(promises);
}
function lazyLoad(componentName) {
  if (_loadedComponents.has(componentName)) {
    return Promise.resolve({ name: componentName, success: true, cached: true });
  }
  if (!_componentsLoader || !_componentsLoader.componentsList) {
    return Promise.reject(new Error("ComponentsLoader nao configurado"));
  }
  const config = _componentsLoader.componentsList.find((c) => c.name === componentName);
  if (!config) {
    return Promise.reject(new Error(`Componente nao encontrado: ${componentName}`));
  }
  _metrics.lazyLoaded++;
  _log("debug", "Lazy loading:", componentName);
  return _loadSingleComponent(config);
}
function observeRegions() {
  if (!_intersectionObserver) {
    _log("warn", "IntersectionObserver nao disponivel");
    return;
  }
  Object.keys(_regions).forEach((regionName) => {
    const selector = SELECTORS[`HEADER_${regionName.toUpperCase()}`] || `.header-${regionName}`;
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute("data-lazy-region", regionName);
      _intersectionObserver.observe(element);
      _log("debug", "Observando regiao:", regionName);
    }
  });
}
function unobserveRegions() {
  if (_intersectionObserver) {
    _intersectionObserver.disconnect();
  }
}
function preloadRegion(regionName) {
  _log("debug", "Preloading regiao:", regionName);
  return loadRegion(regionName);
}
function getRegionStatus(regionName) {
  const region = _regions[regionName];
  if (!region) return null;
  return { name: regionName, loaded: region.loaded, loading: region.loading, componentsCount: region.components.length, priority: region.priority };
}
function getAllRegionsStatus() {
  const result = {};
  Object.keys(_regions).forEach((name) => {
    result[name] = getRegionStatus(name);
  });
  return result;
}
function isComponentLoaded(componentName) {
  return _loadedComponents.has(componentName);
}
function getLoadedComponents() {
  return Array.from(_loadedComponents);
}
function reset() {
  Object.keys(_regions).forEach((name) => {
    _regions[name].loaded = false;
    _regions[name].loading = false;
    _regions[name].components = [];
  });
  _loadedComponents.clear();
  _pendingComponents.clear();
  _log("info", "LazyLoader resetado");
}
function _emitEvent(eventName, data) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:lazy-loader:${eventName}`, Object.assign({ timestamp: Date.now() }, data));
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  _initPorts();
  const checks = { hasComponentsLoader: !!_componentsLoader, hasObserver: !!_intersectionObserver || !window.IntersectionObserver, someRegionsLoaded: _metrics.regionsLoaded > 0 || _metrics.componentsLoaded === 0, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, regionsLoaded: `${_metrics.regionsLoaded}/3`, componentsLoaded: _loadedComponents.size, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, config: Object.assign({}, _config), regions: getAllRegionsStatus(), loadedComponents: getLoadedComponents(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var lazy_loader_default = { VERSION, MODULE_ID, init, loadRegion, loadAll, lazyLoad, preloadRegion, observeRegions, getAllRegionsStatus, isComponentLoaded, reset, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  lazy_loader_default as default,
  getAllRegionsStatus,
  getLoadedComponents,
  getMetrics,
  getPorts,
  getRegionStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  isComponentLoaded,
  lazyLoad,
  loadAll,
  loadRegion,
  observeRegions,
  preloadRegion,
  reset,
  unobserveRegions
};
