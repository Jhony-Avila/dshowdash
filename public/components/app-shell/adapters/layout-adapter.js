import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "1.3.0-P18EC-AAA";
const MODULE_ID = "app-shell-layout-adapter";
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
const LAYOUT_EVENTS = Object.freeze({
  REQUEST: "layout:request",
  FULLSCREEN_REQUEST: "layout:fullscreen:request"
});
let _cleanup = null;
let _connected = false;
const _metrics = {
  connects: 0,
  disconnects: 0,
  layoutChanges: 0,
  requestsEmitted: 0,
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
function _emitLayoutRequest(mode, options) {
  if (!options) options = {};
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) {
    _trackEvent("emit-failed-no-eventbus", { mode });
    return false;
  }
  eventBus.emit(LAYOUT_EVENTS.REQUEST, Object.assign({
    mode,
    source: MODULE_ID,
    timestamp: Date.now()
  }, options));
  _metrics.requestsEmitted++;
  _trackEvent("request-emitted", { mode, options });
  return true;
}
function _getRegionElement(selectors) {
  for (let i = 0; i < selectors.length; i++) {
    const el = document.querySelector(selectors[i]);
    if (el) return el;
  }
  return null;
}
function connect(callbacks) {
  if (!callbacks) callbacks = {};
  if (_connected) return true;
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _trackEvent("no-eventbus");
    return false;
  }
  try {
    const handler = (data) => {
      const hideNav = data && data.hideNav === true;
      const route = data ? data.route : null;
      const sidebar = _getRegionElement([
        ".dsd-sidebar",
        ".app-sidebar",
        "#sidebar",
        "#shell-sidebar-region",
        '[data-region="sidebar"]',
        '[data-shell-region="sidebar"]'
      ]);
      const header = _getRegionElement([
        ".dsd-header",
        ".app-header",
        "#shell-header-region",
        '[data-region="header"]',
        '[data-shell-region="header"]'
      ]);
      const main = _getRegionElement([
        ".dsd-main",
        ".app-main",
        "#shell-main-region",
        '[data-region="main"]',
        '[data-shell-region="main"]'
      ]);
      _metrics.layoutChanges++;
      if (hideNav) {
        if (sidebar) sidebar.classList.add("hidden");
        if (header) header.classList.add("hidden");
        if (main) main.classList.add("full-screen-mode");
        _emitLayoutRequest("fullscreen", { route, hideNav: true });
        if (callbacks.onFullscreen) callbacks.onFullscreen(route, main);
      } else {
        if (sidebar) sidebar.classList.remove("hidden");
        if (header) header.classList.remove("hidden");
        if (main) main.classList.remove("full-screen-mode");
        _emitLayoutRequest("default", { route, hideNav: false });
        if (callbacks.onDefault) callbacks.onDefault(route, main);
      }
    };
    eventBus.on(ROUTER_EVENTS.LAYOUT_CHANGED, handler);
    _cleanup = () => {
      eventBus.off(ROUTER_EVENTS.LAYOUT_CHANGED, handler);
    };
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected");
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
function disconnect() {
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _connected = false;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function requestLayout(mode, options) {
  return _emitLayoutRequest(mode, options);
}
function isConnected() {
  return _connected;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function getLayoutEvents() {
  return Object.assign({}, LAYOUT_EVENTS);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const eventBus = _getPort("eventBus");
  const layoutManager = _getPort("layoutManager");
  const checks = {
    eventBusExists: !!eventBus,
    connected: _connected,
    layoutManagerExists: !!layoutManager,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 4 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/4`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  const layoutManager = _getPort("layoutManager");
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    connected: _connected,
    hasLayoutManager: !!layoutManager,
    layoutEvents: LAYOUT_EVENTS,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var layout_adapter_default = {
  connect,
  disconnect,
  requestLayout,
  isConnected,
  getMetrics,
  getLayoutEvents,
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
  layout_adapter_default as default,
  disconnect,
  getLayoutEvents,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isConnected,
  requestLayout
};
