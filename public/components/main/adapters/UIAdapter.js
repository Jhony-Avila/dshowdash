import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "components.main.adapters.ui";
const VERSION = "2.3.0-P18EC";
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
const _metrics = { toasts: 0, modals: 0, confirms: 0 };
function showToast(message, options = {}) {
  _metrics.toasts++;
  options = options || {};
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.showToast) return overlay.showToast(message, options);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_EVENTS.TOAST, { message, options });
    return { ok: true, via: "eventBus" };
  }
  return { ok: false, reason: "No UI handler" };
}
function showModal(config) {
  _metrics.modals++;
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.showModal) return overlay.showModal(config);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_EVENTS.MODAL, config);
    return { ok: true, via: "eventBus" };
  }
  return { ok: false, reason: "No modal handler" };
}
function showConfirm(message, options = {}) {
  _metrics.confirms++;
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.showConfirm) return overlay.showConfirm(message, options);
  return Promise.resolve(confirm(message));
}
function showLoading(message) {
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.showLoading) return overlay.showLoading(message);
  return { ok: false, reason: "No loading handler" };
}
function hideLoading() {
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.close) return overlay.close("loading");
  return { ok: false };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const hasOverlay = !!(_getPort("overlayKernel") || _getPort("overlayBridge"));
  return { status: hasOverlay ? "HEALTHY" : "DEGRADED", score: hasOverlay ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasOverlay: { ok: hasOverlay, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createUIAdapter(options) {
  options = options || {};
  init(options);
  return { showToast, showModal, showConfirm, showLoading, hideLoading, healthCheck, info, VERSION, MODULE_ID };
}
var UIAdapter_default = { MODULE_ID, VERSION, createUIAdapter, init, showToast, showModal, showConfirm, showLoading, hideLoading, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createUIAdapter,
  UIAdapter_default as default,
  getPorts,
  healthCheck,
  hideLoading,
  info,
  init,
  injectPorts,
  showConfirm,
  showLoading,
  showModal,
  showToast
};
