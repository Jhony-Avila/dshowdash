import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "1.8.0-P18EC-AAA";
const MODULE_ID = "app-shell-router-adapter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _cleanups = [];
let _connected = false;
let _currentRoute = null;
const _metrics = {
  connects: 0,
  disconnects: 0,
  navigations: 0,
  errors: 0
};
function _trackEvent(event, data) {
  if (!data) data = {};
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
  }
}
function _getPathname() {
  if (typeof window !== "undefined" && window.location) {
    return window.location.pathname;
  }
  return "/";
}
function connect(callbacks) {
  if (!callbacks) callbacks = {};
  if (_connected) return true;
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _metrics.errors++;
    _trackEvent("no-eventbus");
    return false;
  }
  try {
    const navHandler = (data) => {
      _currentRoute = data && (data.route || data.path) ? data.route || data.path : _getPathname();
      _metrics.navigations++;
      _trackEvent("navigation", { route: _currentRoute });
      if (callbacks.onNavigate) callbacks.onNavigate(_currentRoute, data);
    };
    const readyHandler = (data) => {
      _trackEvent("router-ready", { router: !!(data && data.router) });
      if (callbacks.onReady) callbacks.onReady(data);
    };
    eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, navHandler);
    eventBus.on(ROUTER_EVENTS.READY, readyHandler);
    _cleanups = [
      () => {
        eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, navHandler);
      },
      () => {
        eventBus.off(ROUTER_EVENTS.READY, readyHandler);
      }
    ];
    _currentRoute = _getPathname();
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected", { initialRoute: _currentRoute });
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _connected = false;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function navigate(path, options) {
  if (!options) options = {};
  const routerGlobal = _getPort("router");
  if (routerGlobal && routerGlobal.navigate) {
    routerGlobal.navigate(path, options);
    return true;
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(ROUTER_EVENTS.NAVIGATE, Object.assign({
      path,
      source: MODULE_ID
    }, options));
    return true;
  }
  return false;
}
function getCurrentRoute() {
  return _currentRoute || _getPathname();
}
function isConnected() {
  return _connected;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const routerGlobal = _getPort("router");
  const checks = {
    connected: _connected,
    hasRoute: !!_currentRoute,
    routerExists: !!routerGlobal,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/4`,
    checks,
    currentRoute: _currentRoute,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    connected: _connected,
    currentRoute: _currentRoute,
    routerEvents: Object.keys(ROUTER_EVENTS),
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var router_adapter_default = {
  connect,
  disconnect,
  navigate,
  getCurrentRoute,
  isConnected,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  connect,
  router_adapter_default as default,
  disconnect,
  getCurrentRoute,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isConnected,
  navigate
};
