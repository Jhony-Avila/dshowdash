import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { NAV_EVENTS } from "/core/runtime/events/catalog/nav.events.js";
import { NavRailRegistry } from "../../registry/index.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "navrail-shared-events";
const NAVRAIL_EVENTS = {
  OPEN: "navrail:open",
  CLOSE: "navrail:close",
  TOGGLE: "navrail:toggle",
  NAVIGATE: "navrail:navigate",
  ITEM_CLICK: "navrail:item-click",
  SECTION_TOGGLE: "navrail:section-toggle",
  READY: "navrail:ready",
  ERROR: "navrail:error"
};
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
const _metrics = { navIntents: 0, navigations: 0, fallbacks: 0, actions: 0 };
function getEventBus() {
  return _getPort("eventBus");
}
function _getPanelIdFromRegistry(itemId) {
  if (!itemId) return null;
  const item = NavRailRegistry.getItem(itemId);
  if (item && item.panelId) return item.panelId;
  return `panel-${itemId}`;
}
function _getRouteFromRegistry(itemId) {
  if (!itemId) return null;
  const item = NavRailRegistry.getItem(itemId);
  if (item && item.route) return item.route;
  return `#/${itemId}`;
}
function emitNavIntent(itemId, route, panelId, source) {
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return false;
  _metrics.navIntents++;
  const resolvedPanelId = panelId || _getPanelIdFromRegistry(itemId);
  const resolvedRoute = route || _getRouteFromRegistry(itemId);
  const payload = {
    type: NAV_EVENTS.NAVIGATE_PATH,
    itemId,
    path: resolvedRoute,
    panelId: resolvedPanelId,
    source: source || "navrail",
    timestamp: Date.now()
  };
  eventBus.emit(NAV_EVENTS.NAVIGATE_PATH, payload);
  return true;
}
function navigateToRoute(route, source, itemId, panelId) {
  if (!route) return false;
  const eventBus = _getPort("eventBus");
  const resolvedPanelId = panelId || _getPanelIdFromRegistry(itemId);
  if (itemId) {
    emitNavIntent(itemId, route, resolvedPanelId, source);
  }
  if (eventBus && eventBus.emit) {
    _metrics.navigations++;
    eventBus.emit(ROUTER_EVENTS.NAVIGATE, {
      path: route,
      options: {
        itemId: itemId || null,
        panelId: resolvedPanelId,
        source: source || MODULE_ID
      },
      source: source || MODULE_ID,
      timestamp: Date.now()
    });
    return true;
  }
  if (typeof window !== "undefined" && window.location) {
    _metrics.fallbacks++;
    window.location.hash = route.indexOf("#") === 0 ? route : `#${route}`;
    return true;
  }
  return false;
}
function emitUIAction(actionId, source, meta) {
  if (!meta) meta = {};
  const eventBus = _getPort("eventBus");
  let itemId = null;
  if (actionId && actionId.indexOf("navrail:") === 0) {
    itemId = actionId.replace("navrail:", "");
  }
  const panelId = meta.panelId || _getPanelIdFromRegistry(itemId);
  const route = meta.route || _getRouteFromRegistry(itemId);
  if (route || meta.route) {
    _metrics.actions++;
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.ACTION, {
        actionId,
        source,
        timestamp: Date.now(),
        meta: Object.assign({}, meta, { panelId })
      });
    }
    return navigateToRoute(route, source, itemId, panelId);
  }
  if (itemId && itemId !== "toggle-sidebar") {
    _metrics.actions++;
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.ACTION, {
        actionId,
        source,
        timestamp: Date.now(),
        meta: Object.assign({}, meta, { panelId, route })
      });
    }
    return navigateToRoute(route, source, itemId, panelId);
  }
  if (!eventBus || !eventBus.emit) return false;
  _metrics.actions++;
  const payload = { actionId, source, timestamp: Date.now(), meta };
  eventBus.emit(UI_EVENTS.ACTION, payload);
  return true;
}
function emitNavRailEvent(eventKey, data) {
  if (!data) data = {};
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return false;
  eventBus.emit(eventKey, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  return true;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    p04RegistrySSoT: true,
    portsInitialized: Ports.isInitialized(),
    registryLoaded: NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const hasEventBus = !!_getPort("eventBus");
  const registryLoaded = NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false;
  return {
    status: hasEventBus && registryLoaded ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p03PortsOnly: true,
    p04RegistrySSoT: true,
    checks: {
      hasEventBus,
      portsInitialized: Ports.isInitialized(),
      registryLoaded
    },
    metrics: getMetrics()
  };
}
var event_helpers_default = { getEventBus, emitUIAction, navigateToRoute, emitNavIntent, emitNavRailEvent, NAVRAIL_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  NAVRAIL_EVENTS,
  VERSION,
  event_helpers_default as default,
  emitNavIntent,
  emitNavRailEvent,
  emitUIAction,
  getEventBus,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  navigateToRoute
};
