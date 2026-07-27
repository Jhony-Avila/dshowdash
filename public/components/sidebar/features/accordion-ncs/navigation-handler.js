import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { ACCORDION_INTENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { state, log } from "./constants.js";
const MODULE_ID = "accordion-ncs-navigation-handler";
const VERSION = "3.6.0-ES6";
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
let _metrics = { navigations: 0, fallbacks: 0, errors: 0 };
function setupNavigationHandler(accordionResult) {
  _initPorts();
  const eventBus = accordionResult?.view?._eventBus || state.eventBus || _getPort("eventBus");
  if (!eventBus) {
    log("warn", "No eventBus available for navigation handler");
    return;
  }
  const handleItemSelected = (payload) => {
    const item = payload.item;
    if (!item || !item.target) {
      log("warn", "Item selected without target:", payload);
      return;
    }
    const target = item.target;
    if (target.route || target.path) {
      const route = target.route || target.path;
      const router = _getPort("routerGlobal");
      if (router && router.navigate) {
        router.navigate(route, { source: MODULE_ID });
        _metrics.navigations++;
        log("info", `Navigating via Ports router: ${route}`);
        return;
      }
      const eb = _getPort("eventBus") || eventBus;
      if (eb && eb.emit) {
        eb.emit(ROUTER_EVENTS.NAVIGATE, {
          path: route,
          options: { source: MODULE_ID },
          source: MODULE_ID,
          timestamp: Date.now()
        });
        _metrics.navigations++;
        log("info", `Navigating via EventBus NAVIGATE: ${route}`);
        return;
      }
      if (eventBus && eventBus.emit) {
        eventBus.emit(UI_EVENTS.HARD_NAV, {
          path: route,
          reason: "No router or EventBus via Ports",
          source: MODULE_ID,
          timestamp: Date.now()
        });
      }
      _metrics.fallbacks++;
      window.location.hash = route;
      log("info", `Fallback navigation to: ${route}`);
    }
  };
  const eventName = ACCORDION_INTENTS.SELECT_ITEM;
  eventBus.on(eventName, handleItemSelected);
  log("info", `Navigation handler listening to: ${eventName}`);
  state.cleanups.push(() => {
    eventBus.off(eventName, handleItemSelected);
  });
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03Compliant: true,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics()
  };
}
function healthCheck() {
  const hasRouter = !!_getPort("routerGlobal");
  const hasEventBus = !!_getPort("eventBus");
  return {
    status: hasRouter || hasEventBus ? "HEALTHY" : "DEGRADED",
    score: (hasRouter ? 1 : 0) + (hasEventBus ? 1 : 0),
    maxScore: 2,
    checks: { hasRouter, hasEventBus },
    version: VERSION,
    moduleId: MODULE_ID,
    p03Compliant: true
  };
}
var navigation_handler_default = { setupNavigationHandler, info, healthCheck, getMetrics, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  navigation_handler_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setupNavigationHandler
};
