import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/route-based-loader";
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
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
const ROUTE_PRIORITIES = {
  "#/dashboard": ["notifications", "real-time-clock", "weather-sp"],
  "#/integrations": ["panel-pipedrive", "panel-asaas", "panel-bling"],
  "#/integrations/pipedrive": ["panel-pipedrive"],
  "#/integrations/asaas": ["panel-asaas"],
  "#/integrations/bling": ["panel-bling"],
  "#/integrations/mercado-livre": ["panel-mercado-livre"],
  "#/integrations/loja-integrada": ["panel-loja-integrada"],
  "#/integrations/google-drive": ["panel-google-drive"],
  "#/integrations/chatgpt": ["panel-chatgpt"],
  "#/integrations/adwords": ["panel-adwords"],
  "#/integrations/calendar": ["panel-calendar"],
  "#/location": ["panel-maps"],
  "#/financial": ["currency-rotator"],
  "#/communications": ["whatsapp-integration", "wechat-integration", "instagram-messenger-integration", "email-integration"],
  "default": ["user-menu", "notifications", "logo"]
};
const PRELOAD_MAP = {
  "#/dashboard": ["panel-pipedrive", "panel-asaas"],
  "#/integrations": ["panel-calendar", "panel-maps"],
  "#/financial": ["panel-asaas", "panel-bling"],
  "#/communications": ["email-integration"]
};
let _initialized = false;
let _currentRoute = null;
let _componentsLoader = null;
let _routeChangeCleanup = null;
const _metrics = {
  routeChanges: 0,
  preloadsTriggered: 0,
  priorityLoads: 0,
  lastRouteAt: null
};
function init(componentsLoader) {
  if (_initialized) return;
  _initPorts();
  _componentsLoader = componentsLoader;
  _currentRoute = _getCurrentRoute();
  _setupRouteListener();
  _initialized = true;
  _log("info", "RouteBasedLoader inicializado na rota:", _currentRoute);
}
function _getCurrentRoute() {
  return window.location.hash || "#/dashboard";
}
function _setupRouteListener() {
  const handler = () => {
    const newRoute = _getCurrentRoute();
    if (newRoute !== _currentRoute) {
      _metrics.routeChanges++;
      _metrics.lastRouteAt = Date.now();
      _log("info", "Rota alterada:", _currentRoute, "->", newRoute);
      _currentRoute = newRoute;
      _onRouteChange(newRoute);
    }
  };
  window.addEventListener("hashchange", handler);
  _routeChangeCleanup = () => {
    window.removeEventListener("hashchange", handler);
  };
}
function _onRouteChange(route) {
  const preloadList = _getPreloadList(route);
  if (preloadList.length > 0) {
    _preloadComponents(preloadList);
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit("header:route:changed", {
      route,
      preloadList,
      timestamp: Date.now()
    });
  }
}
function getPriorityComponents(route) {
  route = route || _currentRoute;
  if (ROUTE_PRIORITIES[route]) {
    return ROUTE_PRIORITIES[route].slice();
  }
  const routePrefix = Object.keys(ROUTE_PRIORITIES).find((key) => route.startsWith(key) && key !== "default");
  if (routePrefix) {
    return ROUTE_PRIORITIES[routePrefix].slice();
  }
  return ROUTE_PRIORITIES["default"].slice();
}
function _getPreloadList(route) {
  if (PRELOAD_MAP[route]) {
    return PRELOAD_MAP[route].slice();
  }
  const routePrefix = Object.keys(PRELOAD_MAP).find((key) => route.startsWith(key));
  if (routePrefix) {
    return PRELOAD_MAP[routePrefix].slice();
  }
  return [];
}
function _preloadComponents(componentNames) {
  if (!_componentsLoader) return;
  _metrics.preloadsTriggered++;
  _log("debug", "Preloading componentes:", componentNames.join(", "));
  componentNames.forEach((name) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        _preloadSingle(name);
      }, { timeout: 2e3 });
    } else {
      setTimeout(() => {
        _preloadSingle(name);
      }, 100);
    }
  });
}
function _preloadSingle(componentName) {
  if (!_componentsLoader) return;
  if (_componentsLoader.isLoaded && _componentsLoader.isLoaded(componentName)) {
    return;
  }
  let config = null;
  if (_componentsLoader.componentsList) {
    config = _componentsLoader.componentsList.find((c) => c.name === componentName);
  }
  if (config && _componentsLoader.loadComponent) {
    _componentsLoader.loadComponent(config).catch((error) => {
      _log("warn", "Falha ao preload:", componentName, error.message);
    });
  }
}
function loadWithPriority(route) {
  route = route || _currentRoute;
  const priorityList = getPriorityComponents(route);
  _metrics.priorityLoads++;
  _log("info", "Carregando com prioridade para", `${route}:`, priorityList.join(", "));
  return priorityList.reduce((promise, componentName) => promise.then(() => _preloadSingle(componentName)), Promise.resolve());
}
function registerRouteComponents(route, componentNames) {
  ROUTE_PRIORITIES[route] = componentNames;
  _log("debug", "Rota registrada:", route);
}
function registerPreload(route, componentNames) {
  PRELOAD_MAP[route] = componentNames;
  _log("debug", "Preload registrado:", route);
}
function getCurrentRoute() {
  return _currentRoute;
}
function destroy() {
  if (_routeChangeCleanup) {
    _routeChangeCleanup();
    _routeChangeCleanup = null;
  }
  _initialized = false;
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    currentRoute: _currentRoute,
    // @ts-expect-error TS migration - TS2554
    priorityComponents: getPriorityComponents()
  });
}
function resetMetrics() {
  _metrics.routeChanges = 0;
  _metrics.preloadsTriggered = 0;
  _metrics.priorityLoads = 0;
  _metrics.lastRouteAt = null;
}
function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasComponentsLoader: !!_componentsLoader,
    hasCurrentRoute: !!_currentRoute,
    hasRouteListener: !!_routeChangeCleanup,
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
    currentRoute: _currentRoute,
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
    currentRoute: _currentRoute,
    routePriorities: Object.keys(ROUTE_PRIORITIES),
    preloadRoutes: Object.keys(PRELOAD_MAP),
    // @ts-expect-error TS migration - TS2554
    priorityComponents: getPriorityComponents(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
var route_based_loader_default = {
  VERSION,
  MODULE_ID,
  init,
  getPriorityComponents,
  loadWithPriority,
  registerRouteComponents,
  registerPreload,
  getCurrentRoute,
  destroy,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  PRELOAD_MAP,
  ROUTE_PRIORITIES,
  VERSION,
  route_based_loader_default as default,
  destroy,
  getCurrentRoute,
  getMetrics,
  getPorts,
  getPriorityComponents,
  healthCheck,
  info,
  init,
  injectPorts,
  loadWithPriority,
  registerPreload,
  registerRouteComponents,
  resetMetrics
};
