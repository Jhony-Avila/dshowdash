import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "components.main.adapters.router";
const VERSION = "2.4.0-P18EC";
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
let _metrics = { navigations: 0, routeChanges: 0 };
let _cleanups = [];
function navigate(path, options = {}) {
  _metrics.navigations++;
  const router = _getPort("router");
  if (router && router.navigate) return router.navigate(path, options);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(ROUTER_EVENTS.NAVIGATE, { path, options, source: MODULE_ID });
    return { ok: true, via: "eventBus" };
  }
  return { ok: false, error: "No router available" };
}
function getCurrentRoute() {
  const router = _getPort("router");
  if (router && router.getCurrentRoute) return router.getCurrentRoute();
  if (typeof window !== "undefined") return window.location.hash || "#/";
  return "#/";
}
function _routeChangeHandler(data, handler) {
  _metrics.routeChanges++;
  handler(data);
}
function onRouteChange(handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const wrappedHandler = (data) => {
      _routeChangeHandler(data, handler);
    };
    const cleanup = eb.on(ROUTER_EVENTS.ROUTE_CHANGED, wrappedHandler);
    if (typeof cleanup === "function") {
      _cleanups.push(cleanup);
      return cleanup;
    } else {
      const manualCleanup = () => {
        if (eb.off) eb.off(ROUTER_EVENTS.ROUTE_CHANGED, wrappedHandler);
      };
      _cleanups.push(manualCleanup);
      return manualCleanup;
    }
  }
  return () => {
  };
}
function back() {
  if (typeof window !== "undefined" && window.history) {
    window.history.back();
    return { ok: true };
  }
  return { ok: false };
}
function forward() {
  if (typeof window !== "undefined" && window.history) {
    window.history.forward();
    return { ok: true };
  }
  return { ok: false };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _metrics = { navigations: 0, routeChanges: 0 };
}
function healthCheck() {
  const hasRouter = !!_getPort("router");
  return { status: hasRouter ? "HEALTHY" : "DEGRADED", score: hasRouter ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasRouter: { ok: hasRouter, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics, p21Compliant: true, cleanups: _cleanups.length };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentRoute: getCurrentRoute(), metrics: _metrics, portsInitialized: Ports.isInitialized(), p21Compliant: true };
}
function createRouterAdapter(options) {
  options = options || {};
  init(options);
  return { navigate, getCurrentRoute, onRouteChange, back, forward, destroy, healthCheck, info, VERSION, MODULE_ID };
}
var RouterAdapter_default = { MODULE_ID, VERSION, createRouterAdapter, init, destroy, navigate, getCurrentRoute, onRouteChange, back, forward, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  back,
  createRouterAdapter,
  RouterAdapter_default as default,
  destroy,
  forward,
  getCurrentRoute,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  navigate,
  onRouteChange
};
