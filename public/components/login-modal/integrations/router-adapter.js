import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "5.9.0-P18EC";
const MODULE_ID = "login-modal-router-adapter";
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
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest;
  const prefix = "[login-router-adapter]";
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
function RouterAdapter(config) {
  if (!config) config = {};
  this.config = config;
  this.router = null;
  this._connected = false;
  this._listeners = [];
  this._metrics = { connections: 0, navigations: 0, routeChanges: 0 };
}
RouterAdapter.prototype.connect = function() {
  if (this._connected) return true;
  try {
    _initPorts();
    this.router = _getPort("routerGlobal");
    if (this.router) {
      this._connected = true;
      this._metrics.connections++;
      _log("info", "Conectado ao RouterGlobal");
      return true;
    }
    _log("info", "RouterGlobal nao disponivel - funcionando standalone");
    return false;
  } catch (error) {
    _log("error", "Erro ao conectar RouterGlobal", error);
    return false;
  }
};
RouterAdapter.prototype.disconnect = function() {
  if (!this._connected) return;
  for (let i = 0; i < this._listeners.length; i++) {
    try {
      this._listeners[i]();
    } catch (e) {
    }
  }
  this._listeners = [];
  this.router = null;
  this._connected = false;
  _log("debug", "Desconectado do RouterGlobal");
};
RouterAdapter.prototype.getCurrentRoute = function() {
  if (!this._connected || !this.router) return null;
  try {
    if (typeof this.router.getCurrentRoute === "function") return this.router.getCurrentRoute();
    return null;
  } catch (error) {
    _log("error", "Erro ao obter rota atual", error);
    return null;
  }
};
RouterAdapter.prototype.navigate = function(path, options) {
  if (!options) options = {};
  this._metrics.navigations++;
  if (!this._connected || !this.router) {
    _log("debug", "Router nao conectado - navegacao ignorada");
    return false;
  }
  try {
    if (typeof this.router.navigate === "function") {
      this.router.navigate(path, Object.assign({}, options, { source: "login-modal" }));
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Erro ao navegar", error);
    return false;
  }
};
RouterAdapter.prototype.onRouteChange = function(callback) {
  const self = this;
  if (!this._connected || !this.router) return () => {
  };
  try {
    if (typeof this.router.on === "function") {
      const unsub = this.router.on(ROUTER_EVENTS.ROUTE_CHANGED, (data) => {
        self._metrics.routeChanges++;
        callback(data);
      });
      this._listeners.push(unsub);
      return unsub;
    }
    return () => {
    };
  } catch (error) {
    _log("error", "Erro ao registrar listener", error);
    return () => {
    };
  }
};
RouterAdapter.prototype.isAvailable = () => typeof window !== "undefined";
RouterAdapter.prototype.isConnected = function() {
  return this._connected;
};
RouterAdapter.prototype.getStatus = function() {
  return { connected: this._connected, hasRouter: !!this.router, currentRoute: this.getCurrentRoute(), metrics: Object.assign({}, this._metrics) };
};
RouterAdapter.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, connected: this._connected, hasRouter: !!this.router, currentRoute: this.getCurrentRoute(), portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
RouterAdapter.prototype.healthCheck = function() {
  const checks = { notInErrorState: true, canConnect: typeof window !== "undefined", hasRouter: this._connected && !!this.router, loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed >= 4 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var router_adapter_default = RouterAdapter;
function createRouterAdapter(loginModal, config) {
  return new RouterAdapter(config);
}
export {
  MODULE_ID,
  RouterAdapter,
  VERSION,
  createRouterAdapter,
  router_adapter_default as default,
  getPorts,
  injectPorts
};
