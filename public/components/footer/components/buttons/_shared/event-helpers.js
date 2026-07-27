import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { FOOTER_EVENTS } from "/core/runtime/events/catalog/footer.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { createLogger } from "../../../core/logger.js";
const VERSION = "3.2.0-NAVIGATE-FALLBACK";
const MODULE_ID = "footer-buttons-shared-events";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = createLogger(MODULE_ID);
const _metrics = { uiActions: 0, buttonClicks: 0, buttonEvents: 0, navigations: 0, navigationFallbacks: 0, eventBusMissing: 0 };
function getEventBus() {
  _initPorts();
  const portEventBus = _getPort("eventBus");
  if (portEventBus) return portEventBus;
  if (typeof window !== "undefined" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  _metrics.eventBusMissing++;
  _log.error("EventBus not available via Ports or Core.windowAdapter");
  return null;
}
function emitFooterButtonClick(buttonId, trigger, meta) {
  if (meta === void 0) meta = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error("Cannot emit FOOTER_BUTTON_CLICK - EventBus unavailable");
    return false;
  }
  _metrics.buttonClicks++;
  let payload = {
    buttonId,
    trigger: trigger || "trigger:footer:" + buttonId,
    timestamp: Date.now(),
    meta: Object.assign({ source: "footer" }, meta)
  };
  eventBus.emit(UI_EVENTS.FOOTER_BUTTON_CLICK, payload);
  _log.debug("FOOTER_BUTTON_CLICK emitted: " + buttonId);
  return true;
}
function navigateToRoute(route, source) {
  let eventBus = getEventBus();
  _metrics.navigations++;
  if (eventBus && eventBus.emit) {
    eventBus.emit(ROUTER_EVENTS.NAVIGATE, {
      path: route,
      options: { replace: false },
      source: source || MODULE_ID,
      meta: { origin: "footer", reason: "footer-action" },
      timestamp: Date.now()
    });
  }
  if (typeof window !== "undefined" && route) {
    const targetHash = route.charAt(0) === "#" ? route : "#" + route;
    if (window.location.hash !== targetHash) {
      _metrics.navigationFallbacks++;
      window.location.hash = targetHash;
      _log.debug("Navigation fallback applied: " + targetHash);
    }
  }
  return true;
}
function extractRouteFromActionId(actionId) {
  if (!actionId || actionId.indexOf("footer:") !== 0) return null;
  let buttonId = actionId.replace("footer:", "");
  if (buttonId === "logout") return null;
  if (buttonId === "settings") return "#/configuracoes";
  if (buttonId === "dashboard") return "#/home";
  if (buttonId === "search") return "#/busca";
  if (buttonId === "bell") return "#/notificacoes";
  if (buttonId === "users") return "#/rh-pessoas";
  if (buttonId === "analytics") return "#/relatorios";
  if (buttonId === "lgpd") return "#/lgpd";
  if (buttonId === "privacidade") return "#/privacidade";
  if (buttonId === "termos") return "#/termos";
  if (buttonId === "language") return "#/status-language";
  if (buttonId === "trending-up") return "#/status-trending";
  return "#/status-" + buttonId;
}
function emitUIAction(actionId, source, meta) {
  if (meta === void 0) meta = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error("Cannot emit ui:action - EventBus unavailable");
    const fallbackRoute = extractRouteFromActionId(actionId);
    if (fallbackRoute && typeof window !== "undefined") {
      const fallbackHash = fallbackRoute.charAt(0) === "#" ? fallbackRoute : "#" + fallbackRoute;
      _metrics.navigationFallbacks++;
      window.location.hash = fallbackHash;
      _log.debug("Direct navigation fallback (no EventBus): " + fallbackHash);
      return true;
    }
    return false;
  }
  _metrics.uiActions++;
  const buttonId = actionId.indexOf("footer:") === 0 ? actionId.replace("footer:", "") : actionId;
  emitFooterButtonClick(buttonId, "trigger:footer:" + buttonId, meta);
  const route = extractRouteFromActionId(actionId);
  if (route) {
    navigateToRoute(route, source);
    return true;
  }
  const payload = { actionId, source, timestamp: Date.now(), meta };
  eventBus.emit(UI_EVENTS.ACTION, payload);
  return true;
}
const BUTTON_EVENT_MAP = {
  MOUNTED: FOOTER_EVENTS.BUTTON_MOUNTED,
  CLICKED: FOOTER_EVENTS.BUTTON_CLICKED,
  UNMOUNTED: FOOTER_EVENTS.BUTTON_UNMOUNTED
};
function emitButtonEvent(eventName, data) {
  if (data === void 0) data = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error("Cannot emit button event - EventBus unavailable");
    return false;
  }
  _metrics.buttonEvents++;
  const fullEventName = BUTTON_EVENT_MAP[eventName.toUpperCase()] || FOOTER_EVENTS.BUTTON_CLICKED;
  eventBus.emit(fullEventName, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  return true;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  let ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    p0Compliant: true,
    noWindowFallback: isStrict(),
    strictMode: isStrict(),
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    catalogVersion: "FOOTER_EVENTS"
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const eventBus = _getPort("eventBus");
  const eventBusAvailable = !!eventBus;
  const noFallbackErrors = _metrics.eventBusMissing === 0;
  return {
    status: eventBusAvailable && noFallbackErrors ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p0Enterprise: true,
    p0Compliant: true,
    strictMode: isStrict(),
    checks: {
      eventBusAvailable,
      noFallbackErrors,
      portsInitialized: ps._initialized
    },
    metrics: getMetrics()
  };
}
var event_helpers_default = {
  getEventBus,
  emitUIAction,
  emitFooterButtonClick,
  emitButtonEvent,
  navigateToRoute,
  BUTTON_EVENTS: BUTTON_EVENT_MAP,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  BUTTON_EVENT_MAP as BUTTON_EVENTS,
  MODULE_ID,
  VERSION,
  event_helpers_default as default,
  emitButtonEvent,
  emitFooterButtonClick,
  emitUIAction,
  getEventBus,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  navigateToRoute
};
