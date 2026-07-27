import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const MODULE_ID = "sidebar-resize-handler";
const VERSION = "7.1.0-ES6";
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
const _state = { initialized: false, ctx: null, container: null, isResizing: false, startX: 0, startWidth: 0, resizes: 0, errors: 0, cleanups: [] };
const CONFIG = { minWidth: 200, maxWidth: 400, defaultWidth: 260, storageKey: "dsd-sidebar-width" };
function _envelope(ok, data, errors) {
  return { ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: errors || [] };
}
function getSavedWidth() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey);
    return saved ? parseInt(saved, 10) : CONFIG.defaultWidth;
  } catch (e) {
    return CONFIG.defaultWidth;
  }
}
function saveWidth(width) {
  try {
    localStorage.setItem(CONFIG.storageKey, String(width));
  } catch (e) {
  }
}
function getWidth() {
  if (_state.container) return _state.container.offsetWidth;
  return getSavedWidth();
}
function setWidth(width) {
  const newWidth = Math.max(CONFIG.minWidth, Math.min(CONFIG.maxWidth, width));
  if (_state.container) _state.container.style.width = `${newWidth}px`;
  saveWidth(newWidth);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.RESIZE, { width: newWidth });
  return newWidth;
}
function resetWidth() {
  if (_state.container) _state.container.style.width = `${CONFIG.defaultWidth}px`;
  saveWidth(CONFIG.defaultWidth);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.RESIZE_RESET, { width: CONFIG.defaultWidth });
  return CONFIG.defaultWidth;
}
function setupResizeHandle(dependencies) {
  const container = dependencies.container;
  const eventBus = dependencies.eventBus;
  if (!container) return () => {
  };
  if (eventBus) Ports.inject({ eventBus });
  _state.container = container;
  let handle = container.querySelector(`.${C.RESIZE_HANDLE}`);
  if (!handle) {
    handle = document.createElement("div");
    handle.className = C.RESIZE_HANDLE;
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", "Redimensionar sidebar");
    handle.setAttribute("tabindex", "0");
    container.appendChild(handle);
  }
  container.style.width = `${getSavedWidth()}px`;
  let onMouseMove = null;
  let onMouseUp = null;
  const onMouseDown = (e) => {
    e.preventDefault();
    _state.isResizing = true;
    _state.startX = e.clientX;
    _state.startWidth = container.offsetWidth;
    container.classList.add(C.MOD_RESIZING);
    handle.classList.add(C.RESIZE_HANDLE_ACTIVE);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    onMouseMove = (e2) => {
      if (!_state.isResizing) return;
      const deltaX = e2.clientX - _state.startX;
      const newWidth = Math.max(CONFIG.minWidth, Math.min(CONFIG.maxWidth, _state.startWidth + deltaX));
      container.style.width = `${newWidth}px`;
      const eb = _getPort("eventBus");
      if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.RESIZE, { width: newWidth });
    };
    onMouseUp = () => {
      if (!_state.isResizing) return;
      _state.isResizing = false;
      _state.resizes++;
      const finalWidth = container.offsetWidth;
      saveWidth(finalWidth);
      container.classList.remove(C.MOD_RESIZING);
      handle.classList.remove(C.RESIZE_HANDLE_ACTIVE);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const eb = _getPort("eventBus");
      if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.RESIZE_END, { width: finalWidth });
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  handle.addEventListener("mousedown", onMouseDown);
  _state.cleanups.push(() => {
    handle.removeEventListener("mousedown", onMouseDown);
  });
  return () => {
    cleanup();
  };
}
function init(ctx) {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _state.ctx = ctx;
    if (ctx && ctx.ports) Ports.inject(ctx.ports);
    _initPorts();
    _state.initialized = true;
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.RESIZE_INITIALIZED, { version: VERSION });
    return _envelope(true, { initialized: true });
  } catch (e) {
    _state.errors++;
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
}
function cleanup() {
  for (let i = 0; i < _state.cleanups.length; i++) {
    try {
      _state.cleanups[i]();
    } catch (e) {
    }
  }
  _state.cleanups = [];
  _state.initialized = false;
  _state.container = null;
  return _envelope(true, { cleanedUp: true });
}
function destroy() {
  return cleanup();
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    notResizing: !_state.isResizing,
    lowErrorRate: _state.resizes === 0 || _state.errors < _state.resizes * 0.2
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_state.initialized) status = "NOT_INITIALIZED";
  else if (passed < total) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    checks,
    metrics: { resizes: _state.resizes, errors: _state.errors, currentWidth: getWidth() },
    timestamp: Date.now()
  };
}
function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    initialized: _state.initialized,
    resizes: _state.resizes,
    currentWidth: getWidth()
  });
}
const capabilities = { singleton: true, critical: false, rendersUI: true, category: "layout", priority: "normal" };
function getMetrics() {
  return { resizes: _state.resizes, errors: _state.errors };
}
var resize_handler_default = { id: MODULE_ID, version: VERSION, capabilities, init, cleanup, destroy, healthCheck, info, getMetrics, setupResizeHandle, getWidth, setWidth, resetWidth };
export {
  MODULE_ID,
  VERSION,
  capabilities,
  cleanup,
  resize_handler_default as default,
  destroy,
  getMetrics,
  getPorts,
  getSavedWidth,
  getWidth,
  healthCheck,
  info,
  init,
  injectPorts,
  resetWidth,
  saveWidth,
  setWidth,
  setupResizeHandle
};
