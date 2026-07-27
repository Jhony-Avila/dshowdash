import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS, UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import * as Manager from "../core/manager.js";
import * as MobileGestures from "../core/mobile-gestures.js";
const VERSION = "1.5.0-P21";
const MODULE_ID = "overlay-layer.adapters.drawer-adapter";
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
const DRAWER_PRIORITY = 7e3;
const _activeDrawers = /* @__PURE__ */ new Map();
const _config = { defaultPosition: "right", defaultWidth: "400px", enableSwipeClose: true, enableBackdrop: true, closeOnEscape: true, closeOnBackdropClick: true };
let _metrics = { opened: 0, closed: 0, swipeClosed: 0 };
let _cleanups = [];
function _setScrollLock(locked) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? "scroll-lock" : "scroll-unlock", source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  return false;
}
function open(drawerId, options) {
  if (!options) options = {};
  if (_activeDrawers.has(drawerId)) return { ok: false, reason: "already-open" };
  const position = options.position || _config.defaultPosition;
  const width = options.width || _config.defaultWidth;
  const animationMap = { right: "slideLeft", left: "slideRight", bottom: "slideUp", top: "slideDown" };
  const result = Manager.open({ id: drawerId, type: `drawer-${position}`, priority: options.priority || DRAWER_PRIORITY, blocking: options.blocking !== false, content: options.content || null, config: { position, width, closable: options.closable !== false, escapable: options.escapable !== void 0 ? options.escapable : _config.closeOnEscape, animation: animationMap[position] || "slideLeft", onClose: options.onClose || null } });
  if (result.ok) {
    _activeDrawers.set(drawerId, { position, width, openedAt: Date.now(), options });
    _metrics.opened++;
    if (options.blocking !== false) _setScrollLock(true);
    if (_config.enableSwipeClose && options.element) {
      const swipeDirection = position === "right" ? "right" : position === "left" ? "left" : position === "bottom" ? "down" : "up";
      MobileGestures.attach(options.element, drawerId, { direction: swipeDirection, onSwipeClose() {
        _metrics.swipeClosed++;
        close(drawerId, "swipe");
      } });
    }
  }
  return result;
}
function close(drawerId, reason) {
  if (!reason) reason = "explicit";
  const drawer = _activeDrawers.get(drawerId);
  if (!drawer) return { ok: false, reason: "not-found" };
  MobileGestures.detach(drawerId);
  const result = Manager.close(drawerId, reason);
  if (result.ok) {
    _activeDrawers.delete(drawerId);
    _metrics.closed++;
    if (drawer.options && drawer.options.onClose) drawer.options.onClose(reason);
    let hasBlockingDrawer = false;
    _activeDrawers.forEach((d) => {
      if (d.options && d.options.blocking !== false) hasBlockingDrawer = true;
    });
    if (!hasBlockingDrawer) _setScrollLock(false);
  }
  return result;
}
function closeAll(reason) {
  if (!reason) reason = "close-all";
  const count = _activeDrawers.size;
  _activeDrawers.forEach((_, id) => {
    close(id, reason);
  });
  return { ok: true, closed: count };
}
function toggle(drawerId, options) {
  if (!options) options = {};
  if (_activeDrawers.has(drawerId)) return close(drawerId, "toggle");
  return open(drawerId, options);
}
function isOpen(drawerId) {
  return _activeDrawers.has(drawerId);
}
function getDrawer(drawerId) {
  return _activeDrawers.get(drawerId) || null;
}
function getActiveDrawers() {
  const list = [];
  _activeDrawers.forEach((data, id) => {
    list.push(Object.assign({ id, age: Date.now() - data.openedAt }, data));
  });
  return list;
}
function updateContent(drawerId, content) {
  if (!_activeDrawers.has(drawerId)) return { ok: false, reason: "not-found" };
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(UI_EVENTS.DRAWER_UPDATE_CONTENT, { id: drawerId, content });
  return { ok: true, drawerId };
}
function _openHandler(data) {
  open(data.id, data.options);
}
function _closeHandler(data) {
  close(data.id, data.reason);
}
function _toggleHandler(data) {
  toggle(data.id, data.options);
}
function connectToDrawerEvents() {
  const eb = _getPort("eventBus");
  if (!eb || !eb.on) return { ok: false, reason: "EventBus not available" };
  return { ok: true, connected: true };
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  MobileGestures.detachAll();
  return { ok: true };
}
function destroy() {
  disconnect();
  closeAll("destroy");
  _metrics = { opened: 0, closed: 0, swipeClosed: 0 };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.defaultPosition) _config.defaultPosition = newConfig.defaultPosition;
  if (newConfig.defaultWidth) _config.defaultWidth = newConfig.defaultWidth;
  if (newConfig.enableSwipeClose !== void 0) _config.enableSwipeClose = newConfig.enableSwipeClose;
  if (newConfig.enableBackdrop !== void 0) _config.enableBackdrop = newConfig.enableBackdrop;
  if (newConfig.closeOnEscape !== void 0) _config.closeOnEscape = newConfig.closeOnEscape;
  if (newConfig.closeOnBackdropClick !== void 0) _config.closeOnBackdropClick = newConfig.closeOnBackdropClick;
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, { active: _activeDrawers.size });
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const checks = { managerAvailable: !!Manager, gesturesAvailable: !!MobileGestures, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k) && checks[k]) passed++;
  }
  return { status: passed >= 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/${Object.keys(checks).length}`, checks, metrics: getMetrics(), activeDrawers: getActiveDrawers(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), activeDrawers: getActiveDrawers(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() };
}
var drawer_adapter_default = { open, close, closeAll, toggle, isOpen, getDrawer, getActiveDrawers, updateContent, connectToDrawerEvents, disconnect, destroy, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  close,
  closeAll,
  connectToDrawerEvents,
  drawer_adapter_default as default,
  destroy,
  disconnect,
  getActiveDrawers,
  getConfig,
  getDrawer,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isOpen,
  open,
  setConfig,
  toggle,
  updateContent
};
