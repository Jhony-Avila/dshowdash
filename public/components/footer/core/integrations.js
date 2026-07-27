import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "7.3.0-P18EC";
const MODULE_ID = "footer.core.integrations";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest.length ? rest : Array.prototype.slice.call(arguments, 1);
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
const _metrics = { eventBusConnections: 0, globalStateConnections: 0, routerConnections: 0, appShellConnections: 0, eventsReceived: 0, routeReads: 0, routeFallbacks: 0, errors: 0 };
function FooterIntegrations() {
  this._eventBus = null;
  this._globalState = null;
  this._router = null;
  this._appShell = null;
  this._cleanupFns = [];
  this._initialized = false;
  this._cachedRoute = null;
}
FooterIntegrations.prototype.init = function(config) {
  if (this._initialized) {
    _log("debug", "Already initialized");
    return;
  }
  this._connectEventBus();
  this._connectGlobalState();
  this._connectRouter();
  this._connectAppShell();
  this._setupRouteListener();
  this._initialized = true;
  _log("info", "Integrations initialized (P18EC compliant)");
};
FooterIntegrations.prototype._connectEventBus = function() {
  try {
    this._eventBus = _getPort("eventBus");
    if (this._eventBus) {
      _metrics.eventBusConnections++;
      _log("debug", "EventBus conectado");
    }
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao conectar EventBus:", e);
  }
};
FooterIntegrations.prototype._connectGlobalState = function() {
  try {
    this._globalState = _getPort("globalState");
    if (this._globalState) {
      _metrics.globalStateConnections++;
      _log("debug", "GlobalState conectado");
    }
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao conectar GlobalState:", e);
  }
};
FooterIntegrations.prototype._connectRouter = function() {
  try {
    this._router = _getPort("router");
    if (this._router) {
      _metrics.routerConnections++;
      _log("debug", "RouterGlobal conectado");
    }
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao conectar Router:", e);
  }
};
FooterIntegrations.prototype._connectAppShell = function() {
  try {
    this._appShell = _getPort("appShell");
    if (this._appShell) {
      _metrics.appShellConnections++;
      _log("debug", "AppShell conectado");
    }
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao conectar AppShell:", e);
  }
};
FooterIntegrations.prototype._setupRouteListener = function() {
  const self = this;
  if (!this._eventBus) return;
  const updateCache = (data) => {
    if (data && data.path) self._cachedRoute = data.path;
    else if (data && data.route) self._cachedRoute = data.route;
  };
  try {
    this._eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, updateCache);
    this._eventBus.on(ROUTER_EVENTS.NAVIGATED, updateCache);
    this._cleanupFns.push(() => {
      if (self._eventBus && self._eventBus.off) {
        self._eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, updateCache);
        self._eventBus.off(ROUTER_EVENTS.NAVIGATED, updateCache);
      }
    });
  } catch (e) {
    _log("debug", "Could not setup route listener:", e);
  }
};
FooterIntegrations.prototype.on = function(eventName, callback) {
  const self = this;
  if (!this._eventBus) {
    _log("info", "EventBus nao disponivel para on() - funcionando standalone");
    return () => {
    };
  }
  try {
    const unsubscribe = this._eventBus.on(eventName, (data) => {
      _metrics.eventsReceived++;
      callback(data);
    });
    this._cleanupFns.push(unsubscribe);
    return unsubscribe;
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao registrar listener:", e);
    return () => {
    };
  }
};
FooterIntegrations.prototype.getCurrentRoute = function() {
  _metrics.routeReads++;
  try {
    if (this._router) {
      if (this._router.getCurrentRoute) {
        const route = this._router.getCurrentRoute();
        if (route && (route.path || route.hash)) return route.path || route.hash;
      }
      if (this._router.current) {
        const current = this._router.current;
        if (typeof current === "string") return current;
        if (current && current.path) return current.path;
      }
    }
    if (this._cachedRoute) return this._cachedRoute;
    _metrics.routeFallbacks++;
    if (typeof window !== "undefined" && window.location) {
      const hash = window.location.hash ? window.location.hash.replace("#", "") : "";
      return hash || window.location.pathname || "/";
    }
    return "/";
  } catch (e) {
    _metrics.errors++;
    _log("error", "Erro ao obter rota atual:", e);
    return "/";
  }
};
FooterIntegrations.prototype.getEventBus = function() {
  return this._eventBus;
};
FooterIntegrations.prototype.getGlobalState = function() {
  return this._globalState;
};
FooterIntegrations.prototype.getRouter = function() {
  return this._router;
};
FooterIntegrations.prototype.getAppShell = function() {
  return this._appShell;
};
FooterIntegrations.prototype.registerCleanup = function(fn) {
  if (typeof fn === "function") this._cleanupFns.push(fn);
};
FooterIntegrations.prototype.cleanup = function() {
  for (let i = 0; i < this._cleanupFns.length; i++) {
    try {
      this._cleanupFns[i]();
    } catch (e) {
    }
  }
  this._cleanupFns = [];
  this._initialized = false;
  this._cachedRoute = null;
  _log("debug", "Integrations cleanup");
};
FooterIntegrations.prototype.destroy = function() {
  this.cleanup();
  this._eventBus = null;
  this._globalState = null;
  this._router = null;
  this._appShell = null;
  _log("debug", "Integrations destroyed");
};
FooterIntegrations.prototype.setDebug = (enabled) => {
};
FooterIntegrations.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterIntegrations.prototype.info = function() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, connections: { eventBus: !!this._eventBus, globalState: !!this._globalState, router: !!this._router, appShell: !!this._appShell }, cachedRoute: this._cachedRoute, metrics: this.getMetrics(), healthCheck: this.healthCheck(), portsInitialized: ps._initialized, timestamp: Date.now() };
};
FooterIntegrations.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { initialized: this._initialized, hasEventBus: !!this._eventBus, hasRouter: !!this._router, hasGlobalState: !!this._globalState, lowErrors: _metrics.errors < 10, lowFallbacks: _metrics.routeFallbacks < _metrics.routeReads * 0.2, portsInitialized: ps._initialized };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  const total = 7;
  return { status: passed >= 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const integrations = new FooterIntegrations();
var integrations_default = FooterIntegrations;
export {
  FooterIntegrations,
  MODULE_ID,
  VERSION,
  integrations_default as default,
  getPorts,
  injectPorts,
  integrations
};
