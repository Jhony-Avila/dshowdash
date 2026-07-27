import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "2.0.0-P2-HARDNAV";
const MODULE_ID = "components.main.ui.navigation-fallback";
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
const _metrics = {
  fallbacks: 0,
  hashChanges: 0,
  routerNavigations: 0,
  errors: 0,
  lastNavigation: null
};
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, msg, data || "");
  else if (level === "warn" && logger.warn) logger.warn(prefix, msg, data || "");
  else if (level === "info" && logger.info) logger.info(prefix, msg, data || "");
}
function _emitHardNav(path, reason) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_EVENTS.HARD_NAV, {
      path,
      reason: reason || "navigation-fallback",
      source: MODULE_ID,
      timestamp: Date.now()
    });
  }
  _metrics.fallbacks++;
}
function navigateFallback(path, options) {
  _metrics.fallbacks++;
  options = options || {};
  if (typeof window === "undefined") {
    return { ok: false, reason: "No window" };
  }
  const router = _getPort("routerGlobal");
  if (router && router.navigate) {
    router.navigate(path, { source: MODULE_ID });
    _metrics.routerNavigations++;
    _metrics.lastNavigation = { path, method: "router", timestamp: Date.now() };
    _log("info", "Navigation via RouterGlobal", { path });
    return { ok: true, method: "router" };
  }
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(ROUTER_EVENTS.NAVIGATE, {
      path,
      options: { source: MODULE_ID },
      source: MODULE_ID,
      timestamp: Date.now()
    });
    _metrics.routerNavigations++;
    _metrics.lastNavigation = { path, method: "eventBus", timestamp: Date.now() };
    _log("info", "Navigation via EventBus NAVIGATE", { path });
    return { ok: true, method: "eventBus" };
  }
  const hash = path.charAt(0) === "#" ? path : `#${path.charAt(0) === "/" ? path : `/${path}`}`;
  _emitHardNav(path, "No RouterGlobal or EventBus available");
  if (options.replace) {
    window.location.replace(hash);
  } else {
    window.location.hash = hash;
  }
  _metrics.hashChanges++;
  _metrics.lastNavigation = { path, method: "hash", timestamp: Date.now() };
  _log("warn", "Navigation via hash fallback", { path, hash });
  return { ok: true, hash, method: "hash-fallback" };
}
function getCurrentHash() {
  if (typeof window !== "undefined" && window.location) {
    return window.location.hash || "#/";
  }
  return "#/";
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _log("info", "NavigationFallback initialized");
  return { ok: true, version: VERSION };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.fallbacks = 0;
  _metrics.hashChanges = 0;
  _metrics.routerNavigations = 0;
  _metrics.errors = 0;
  _metrics.lastNavigation = null;
}
function healthCheck() {
  const hasRouter = !!_getPort("routerGlobal");
  const hasEventBus = !!_getPort("eventBus");
  const hasWindow = typeof window !== "undefined";
  const checks = {
    hasRouter,
    hasEventBus,
    hasWindow,
    lowErrorRate: _metrics.errors < 5,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!hasRouter && !hasEventBus) status = "DEGRADED";
  if (!hasWindow) status = "UNHEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: _metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    p2Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p2Compliant: true,
    currentHash: getCurrentHash(),
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized()
  };
}
var navigation_fallback_default = {
  VERSION,
  MODULE_ID,
  init,
  navigateFallback,
  getCurrentHash,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  navigation_fallback_default as default,
  getCurrentHash,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  navigateFallback,
  resetMetrics
};
