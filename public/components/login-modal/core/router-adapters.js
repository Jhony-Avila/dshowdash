import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "login-modal-router-adapters";
const VERSION = "2.4.0-FIX-PROTOTYPE";
const isBrowser = typeof window !== "undefined";
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
const _log = function(level, ...rest) {
  var args = rest;
  var logger = _getPort("logger");
  if (!logger) return;
  if (level === "info") {
    if (logger.info) logger.info.apply(logger, ["[login-router-adapters]"].concat(args));
  }
};
function RouterAdapter() {
}
RouterAdapter.prototype.getCurrentRoute = function() {
  throw new Error("Not implemented");
};
RouterAdapter.prototype.setRoute = function(route) {
  throw new Error("Not implemented");
};
RouterAdapter.prototype.onRouteChange = function(callback) {
  throw new Error("Not implemented");
};
RouterAdapter.prototype.cleanup = function() {
  throw new Error("Not implemented");
};
function HashRouterAdapter() {
  this._listeners = [];
  this._handler = this._onHashChange.bind(this);
  this._bound = false;
  if (isBrowser) {
    window.addEventListener("hashchange", this._handler);
    this._bound = true;
  }
}
HashRouterAdapter.prototype = Object.create(RouterAdapter.prototype);
HashRouterAdapter.prototype.constructor = HashRouterAdapter;
HashRouterAdapter.prototype.getCurrentRoute = function() {
  if (!isBrowser) return "/";
  _initPorts();
  let routerGlobal = _getPort("routerGlobal");
  if (routerGlobal && routerGlobal.getCurrentRoute) {
    let route = routerGlobal.getCurrentRoute();
    return route && route.path || "/";
  }
  _log("info", "RouterGlobal nao disponivel - leitura fallback");
  return "/";
};
HashRouterAdapter.prototype.setRoute = function(route) {
  if (!isBrowser) return;
  _initPorts();
  const routerGlobal = _getPort("routerGlobal");
  if (routerGlobal && routerGlobal.navigate) {
    routerGlobal.navigate(route, { replace: true, source: "login-modal" });
  } else {
    _log("info", "RouterGlobal nao disponivel - navegacao ignorada");
  }
};
HashRouterAdapter.prototype.onRouteChange = function(callback) {
  this._listeners.push(callback);
};
HashRouterAdapter.prototype._onHashChange = function() {
  const route = this.getCurrentRoute();
  for (var i = 0; i < this._listeners.length; i++) {
    this._listeners[i](route);
  }
};
HashRouterAdapter.prototype.cleanup = function() {
  if (isBrowser && this._bound) {
    window.removeEventListener("hashchange", this._handler);
    this._bound = false;
  }
  this._listeners = [];
};
function MemoryRouterAdapter() {
  this._currentRoute = "/";
  this._listeners = [];
}
MemoryRouterAdapter.prototype = Object.create(RouterAdapter.prototype);
MemoryRouterAdapter.prototype.constructor = MemoryRouterAdapter;
MemoryRouterAdapter.prototype.getCurrentRoute = function() {
  return this._currentRoute;
};
MemoryRouterAdapter.prototype.setRoute = function(route) {
  this._currentRoute = route;
  for (var i = 0; i < this._listeners.length; i++) {
    this._listeners[i](route);
  }
};
MemoryRouterAdapter.prototype.onRouteChange = function(callback) {
  this._listeners.push(callback);
};
MemoryRouterAdapter.prototype.cleanup = function() {
  this._listeners = [];
};
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    hasRouterGlobal: !!_getPort("routerGlobal")
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: { hasRouterGlobal: !!_getPort("routerGlobal") }
  };
}
var router_adapters_default = { HashRouterAdapter, MemoryRouterAdapter, injectPorts, getPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  HashRouterAdapter,
  MODULE_ID,
  MemoryRouterAdapter,
  VERSION,
  router_adapters_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
