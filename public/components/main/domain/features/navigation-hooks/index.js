import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "main.feature.navigation-hooks";
const VERSION = "1.0.0-ENTERPRISE";
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
let _enabled = false;
let _cleanups = [];
let _hooks = { beforeNavigate: [], afterNavigate: [], onRouteChanged: [] };
let _metrics = { inits: 0, navigations: 0, hooksTriggered: 0, blockedNavigations: 0 };
async function _runHooks(type, ctx) {
  for (const h of _hooks[type] || []) {
    try {
      _metrics.hooksTriggered++;
      const r = await Promise.resolve(h(ctx));
      if (type === "beforeNavigate" && r === false) {
        _metrics.blockedNavigations++;
        return { blocked: true };
      }
    } catch (e) {
    }
  }
  return { blocked: false };
}
function init(options = {}) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _metrics.inits++;
  const eb = _getPort("eventBus");
  if (eb?.on) {
    const navHandler = async (data) => {
      _metrics.navigations++;
      await _runHooks("beforeNavigate", data);
    };
    eb.on(ROUTER_EVENTS.NAVIGATE, navHandler);
    _cleanups.push(() => eb.off?.(ROUTER_EVENTS.NAVIGATE, navHandler));
    const routeHandler = async (data) => {
      await _runHooks("afterNavigate", data);
      await _runHooks("onRouteChanged", data);
    };
    eb.on(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler);
    _cleanups.push(() => eb.off?.(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler));
  }
  _enabled = true;
  return { ok: true, version: VERSION };
}
function destroy() {
  for (const fn of _cleanups) {
    try {
      fn();
    } catch (e) {
    }
  }
  _cleanups = [];
  _hooks = { beforeNavigate: [], afterNavigate: [], onRouteChanged: [] };
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function onBeforeNavigate(hook) {
  if (typeof hook === "function") {
    _hooks.beforeNavigate.push(hook);
    return () => {
      const i = _hooks.beforeNavigate.indexOf(hook);
      if (i > -1) _hooks.beforeNavigate.splice(i, 1);
    };
  }
  return () => {
  };
}
function onAfterNavigate(hook) {
  if (typeof hook === "function") {
    _hooks.afterNavigate.push(hook);
    return () => {
      const i = _hooks.afterNavigate.indexOf(hook);
      if (i > -1) _hooks.afterNavigate.splice(i, 1);
    };
  }
  return () => {
  };
}
function onRouteChanged(hook) {
  if (typeof hook === "function") {
    _hooks.onRouteChanged.push(hook);
    return () => {
      const i = _hooks.onRouteChanged.indexOf(hook);
      if (i > -1) _hooks.onRouteChanged.splice(i, 1);
    };
  }
  return () => {
  };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics() };
}
function healthCheck() {
  const checks = { enabled: _enabled, hasEventBus: !!_getPort("eventBus") };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: _enabled ? "HEALTHY" : "NOT_INITIALIZED", score: { passed, total: 2, percentage: passed * 50 }, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}
var navigation_hooks_default = { MODULE_ID, VERSION, init, destroy, cleanup, onBeforeNavigate, onAfterNavigate, onRouteChanged, getMetrics, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  navigation_hooks_default as default,
  destroy,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  onAfterNavigate,
  onBeforeNavigate,
  onRouteChanged
};
