import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { layoutStore } from "../state/store.js";
import { LayoutLifecycle } from "../core/lifecycle.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
import { handleLegacyRequest, transition as smTransition } from "../core/state-machine.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "layout-manager.handlers.request-handlers";
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
const LAYOUT_EVENTS = { REQUEST: "layout:request", TRANSITION: "layout:transition", FULLSCREEN_REQUEST: "layout:fullscreen:request", SCROLL_LOCK: "layout:scroll:lock", PRELOADER: "layout:preloader", MODAL: "layout:modal", GLOBAL_LOADING: "layout:global-loading" };
let _debug = false;
let layoutRequestCleanup = null;
let transitionListenerCleanup = null;
let _metrics = { layoutRequestsReceived: 0, transitionRequests: 0, lastActivity: null };
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, msg, data || "");
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, msg, data || "");
    return;
  }
  if (_debug && logger.debug) logger.debug(prefix, msg, data || "");
};
function setDebug(debug) {
  _debug = debug;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { layoutRequestsReceived: 0, transitionRequests: 0, lastActivity: null };
}
function getLayoutEvents() {
  return LAYOUT_EVENTS;
}
function handleLayoutRequest(data, syncCallback) {
  if (!data || !data.mode) {
    _log("warn", "layout:request received without mode");
    return;
  }
  _metrics.layoutRequestsReceived++;
  _metrics.lastActivity = Date.now();
  const mode = data.mode;
  const source = data.source;
  _log("info", `layout:request from ${source || "unknown"}:`, mode);
  trackLayoutEvent("layout:request:received", { mode, source });
  const stateMachineModes = ["default", "compact", "expanded", "fullscreen", "admin", "dashboard", "monitor", "kiosk"];
  if (stateMachineModes.indexOf(mode) !== -1) {
    const result = handleLegacyRequest(mode, { source });
    _log("info", "State Machine result:", result);
    if (syncCallback) syncCallback();
    return result;
  }
  switch (mode) {
    case "sidebar-collapsed":
      layoutStore.setSidebarCollapsed(true);
      if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
      break;
    case "sidebar-expanded":
      layoutStore.setSidebarCollapsed(false);
      if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
      break;
    case "sidebar-mobile-open":
      LayoutLifecycle.setSidebarMobileOpen(true);
      break;
    case "sidebar-mobile-closed":
      LayoutLifecycle.setSidebarMobileOpen(false);
      break;
    case "global-loading-on":
      LayoutLifecycle.setGlobalLoading(true);
      break;
    case "global-loading-off":
      LayoutLifecycle.setGlobalLoading(false);
      break;
    case "preloader-active":
      LayoutLifecycle.setPreloaderActive(true);
      break;
    case "preloader-inactive":
      LayoutLifecycle.setPreloaderActive(false);
      break;
    case "modal-open":
      LayoutLifecycle.setModalOpen(true);
      break;
    case "modal-closed":
      LayoutLifecycle.setModalOpen(false);
      break;
    case "scroll-lock":
      LayoutLifecycle.setScrollLocked(true);
      break;
    case "scroll-unlock":
      LayoutLifecycle.setScrollLocked(false);
      break;
    default:
      _log("warn", "Unknown mode:", mode);
  }
  if (syncCallback) syncCallback();
  trackLayoutEvent("layout:request:applied", { mode, source });
}
function handleTransitionRequest(data, syncCallback) {
  if (!data || !data.action) {
    _log("warn", "layout:transition received without action");
    return { accepted: false, reason: "no-action" };
  }
  _metrics.transitionRequests++;
  _metrics.lastActivity = Date.now();
  const action = data.action;
  const source = data.source;
  const result = smTransition(action, { source });
  if (result.accepted && syncCallback) syncCallback();
  return result;
}
function setupLayoutRequestListener(syncCallback) {
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _log("warn", "EventBus not available for layout:request listener");
    return false;
  }
  if (layoutRequestCleanup) return true;
  const requestHandler = (data) => {
    handleLayoutRequest(data, syncCallback);
  };
  const transitionHandler = (data) => {
    handleTransitionRequest(data, syncCallback);
  };
  eventBus.on(LAYOUT_EVENTS.REQUEST, requestHandler);
  layoutRequestCleanup = () => {
    const eb = _getPort("eventBus");
    if (eb && eb.off) eb.off(LAYOUT_EVENTS.REQUEST, requestHandler);
  };
  eventBus.on(LAYOUT_EVENTS.TRANSITION, transitionHandler);
  transitionListenerCleanup = () => {
    const eb = _getPort("eventBus");
    if (eb && eb.off) eb.off(LAYOUT_EVENTS.TRANSITION, transitionHandler);
  };
  trackLayoutEvent("layout:listeners:connected");
  _log("info", "Layout listeners connected (State Machine AAA)");
  return true;
}
function cleanupLayoutRequestListener() {
  if (layoutRequestCleanup) {
    layoutRequestCleanup();
    layoutRequestCleanup = null;
  }
  if (transitionListenerCleanup) {
    transitionListenerCleanup();
    transitionListenerCleanup = null;
  }
}
function isLayoutRequestListenerActive() {
  return !!layoutRequestCleanup;
}
function isTransitionListenerActive() {
  return !!transitionListenerCleanup;
}
export {
  LAYOUT_EVENTS,
  MODULE_ID,
  VERSION,
  cleanupLayoutRequestListener,
  getLayoutEvents,
  getMetrics,
  getPorts,
  handleLayoutRequest,
  handleTransitionRequest,
  injectPorts,
  isLayoutRequestListenerActive,
  isTransitionListenerActive,
  resetMetrics,
  setDebug,
  setupLayoutRequestListener
};
