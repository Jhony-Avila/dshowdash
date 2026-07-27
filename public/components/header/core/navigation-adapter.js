import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
const VERSION = "1.3.0-ES6";
const MODULE_ID = "header/core/navigation-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _initialized = false;
const _metrics = {
  requestCount: 0,
  lastRequestAt: null,
  successCount: 0,
  fallbackCount: 0
};
function _initPorts() {
  if (_initialized) return;
  Ports.init();
  _initialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error && logger.error(prefix, msg, data || "");
  } else if (level === "warn") {
    logger.warn && logger.warn(prefix, msg, data || "");
  } else {
    const config = _getPort("config");
    if (config && config.app && config.app.debug) {
      logger.debug && logger.debug(prefix, msg, data || "");
    }
  }
}
function _emitTelemetry(action, data) {
  const telemetry = _getPort("telemetry");
  if (telemetry && telemetry.track) {
    telemetry.track(`${MODULE_ID}:${action}`, data);
  }
}
function _normalizeRoute(route) {
  if (!route) return null;
  const normalized = route.toString().trim();
  if (normalized.indexOf("#") === 0) {
    return normalized;
  }
  if (normalized.indexOf("/") === 0) {
    return `#${normalized}`;
  }
  return `#/${normalized}`;
}
function requestNavigation(options) {
  if (!options || !options.route) {
    _log("warn", "requestNavigation called without route");
    return false;
  }
  _initPorts();
  _metrics.requestCount++;
  _metrics.lastRequestAt = Date.now();
  const route = _normalizeRoute(options.route);
  const payload = {
    route,
    path: route,
    hash: route,
    panelId: options.panelId || null,
    source: options.source || MODULE_ID,
    componentId: options.componentId || null,
    timestamp: Date.now(),
    intent: true
  };
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(NAV_INTENTS.NAVIGATE, payload);
    _log("info", "Navigation intent emitted via NAV_INTENTS.NAVIGATE", { route, source: payload.source });
    _emitTelemetry("intent-emitted", { route });
    _metrics.successCount++;
    return true;
  }
  const router = _getPort("router");
  if (router && router.navigate) {
    router.navigate(route);
    _log("info", "Navigation via router fallback", { route });
    _emitTelemetry("fallback-router", { route });
    _metrics.fallbackCount++;
    return true;
  }
  if (typeof window !== "undefined" && window.location) {
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.HARD_NAV, {
        path: route,
        reason: "No EventBus pipeline or Router",
        source: MODULE_ID,
        timestamp: Date.now()
      });
    }
    window.location.hash = route;
    _log("warn", "Navigation via hash fallback", { route });
    _emitTelemetry("fallback-hash", { route });
    _metrics.fallbackCount++;
    return true;
  }
  _log("error", "Navigation failed - no available method", { route });
  return false;
}
function requestPanelNavigation(panelId, source) {
  if (!panelId) return false;
  let route;
  if (panelId.match(/^panel-\d+$/)) {
    route = `#/${panelId}`;
  } else if (panelId.indexOf("panel-") === 0) {
    route = `#/${panelId.replace("panel-", "")}`;
  } else {
    route = `#/${panelId}`;
  }
  return requestNavigation({
    route,
    panelId,
    source: source || MODULE_ID,
    componentId: panelId
  });
}
function requestIntegrationNavigation(integrationId, source) {
  if (!integrationId) return false;
  const route = `#/integrations/${integrationId}`;
  return requestNavigation({
    route,
    panelId: `integration-${integrationId}`,
    source: source || MODULE_ID,
    componentId: integrationId
  });
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p2Compliant: true,
    eventFix: true,
    portsInitialized: Ports.isInitialized(),
    metrics: Object.assign({}, _metrics),
    intents: Object.keys(NAV_INTENTS),
    emitsEvent: "NAV_INTENTS.NAVIGATE (nav.intent)"
  };
}
function healthCheck() {
  const hasEventBus = !!_getPort("eventBus");
  const hasRouter = !!_getPort("router");
  return {
    status: hasEventBus ? "HEALTHY" : hasRouter ? "DEGRADED" : "UNHEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    p2Compliant: true,
    eventFix: true,
    checks: {
      hasEventBus,
      hasRouter,
      hasFallback: typeof window !== "undefined",
      usesOfficialEvents: true
    },
    metrics: Object.assign({}, _metrics),
    portsInitialized: Ports.isInitialized()
  };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.requestCount = 0;
  _metrics.lastRequestAt = null;
  _metrics.successCount = 0;
  _metrics.fallbackCount = 0;
}
var navigation_adapter_default = {
  VERSION,
  MODULE_ID,
  NAV_INTENTS,
  requestNavigation,
  requestPanelNavigation,
  requestIntegrationNavigation,
  info,
  healthCheck,
  getMetrics,
  resetMetrics,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  NAV_INTENTS,
  VERSION,
  navigation_adapter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  requestIntegrationNavigation,
  requestNavigation,
  requestPanelNavigation,
  resetMetrics
};
