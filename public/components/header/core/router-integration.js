import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "5.9.0-ES6";
const MODULE_ID = "header/core/router-integration";
const hasWindow = typeof window !== "undefined";
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
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
};
const PATH_TITLE_MAP = { "/": "Dashboard Principal", "/geral": "Dashboard Geral", "/clientes": "Gest\xE3o de Clientes", "/financeiro": "Painel Financeiro", "/servidores": "Monitoramento de Servidores", "/relatorios": "Relat\xF3rios", "/configuracoes": "Configura\xE7\xF5es", "/login": "", "/404": "P\xE1gina N\xE3o Encontrada", "/forbidden": "Acesso Negado" };
const RouterIntegration = function(header) {
  this.header = header;
  this.currentRoute = null;
  this.cleanup = null;
  this._debug = false;
  this._metrics = { routeChangeCount: 0, breadcrumbUpdateCount: 0, lastRouteAt: null };
};
RouterIntegration.prototype.setup = function() {
  const self = this;
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _log("warn", "EventBus not available, Router integration skipped");
    self._updateFromPath();
    return;
  }
  const handleRouteChange = (data) => {
    _log("info", "Router route changed", { route: data ? data.route : null });
    self._metrics.routeChangeCount++;
    self._metrics.lastRouteAt = Date.now();
    if (data && data.route) {
      self.currentRoute = data.route;
      self._updateBreadcrumb(data.route);
    }
  };
  eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, handleRouteChange);
  self.cleanup = () => {
    eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, handleRouteChange);
  };
  const router = _getPort("routerGlobal");
  if (router && router.current) {
    const route = router.getCurrentRoute ? router.getCurrentRoute() : null;
    if (route) {
      self.currentRoute = route;
      self._updateBreadcrumb(route);
      _log("info", "Initial route synced from RouterGlobal", { path: route.path });
    }
  } else {
    self._updateFromPath();
  }
  _log("info", "Router Global integration setup complete");
};
RouterIntegration.prototype._updateBreadcrumb = function(route) {
  const title = route.title || this._getTitleFromPath(route.path);
  const path = route.path || "/";
  this._metrics.breadcrumbUpdateCount++;
  if (this.header.telemetry && this.header.telemetry.track) this.header.telemetry.track(HEADER_EVENTS.ROUTE_UPDATED, { path, title, instanceId: this.header.instanceId });
};
RouterIntegration.prototype._updateFromPath = function() {
  const router = _getPort("routerGlobal");
  let path = router && router.getCurrentRoute ? router.getCurrentRoute().path : "/";
  if (!path) path = "/";
  const title = this._getTitleFromPath(path);
  this._updateBreadcrumb({ path, title });
};
RouterIntegration.prototype._getTitleFromPath = (path) => {
  if (path === "/login") return "";
  return PATH_TITLE_MAP[path] || "DshowDash";
};
RouterIntegration.prototype.getCurrentRoute = function() {
  return this.currentRoute;
};
RouterIntegration.prototype.healthCheck = function() {
  const eventBus = _getPort("eventBus");
  const checks = { headerAvailable: !!this.header, eventBusAvailable: !!eventBus, cleanupReady: typeof this.cleanup === "function" || this.cleanup === null, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, currentRoute: this.currentRoute ? this.currentRoute.path : null, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
RouterIntegration.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), currentRoute: this.currentRoute, metrics: this._metrics, healthCheck: this.healthCheck() };
};
RouterIntegration.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
RouterIntegration.prototype.resetMetrics = function() {
  this._metrics = { routeChangeCount: 0, breadcrumbUpdateCount: 0, lastRouteAt: null };
};
RouterIntegration.prototype.destroy = function() {
  if (this.cleanup) {
    this.cleanup();
    this.cleanup = null;
  }
  this.currentRoute = null;
};
function getVersion() {
  return VERSION;
}
var router_integration_default = RouterIntegration;
export {
  MODULE_ID,
  RouterIntegration,
  VERSION,
  router_integration_default as default,
  getPorts,
  getVersion,
  injectPorts
};
