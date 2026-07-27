import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.modal-manager-global.shim.legacy-adapter";
const VERSION = "2.2.0-P18EC";
const MODAL_EVENTS = { SHOW: "modal:show", HIDE: "modal:hide" };
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
const _metrics = { legacyCalls: 0, adaptations: 0 };
function adaptLegacyConfig(legacyConfig) {
  _metrics.adaptations++;
  return { id: legacyConfig.id || `modal-${Date.now()}`, title: legacyConfig.title || legacyConfig.header, content: legacyConfig.content || legacyConfig.body, type: legacyConfig.type || "default", closable: legacyConfig.closable !== false, backdrop: legacyConfig.backdrop !== false, onClose: legacyConfig.onClose || legacyConfig.callback };
}
function showLegacy(config) {
  _metrics.legacyCalls++;
  const adapted = adaptLegacyConfig(config);
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.showModal) return overlay.showModal(adapted);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(MODAL_EVENTS.SHOW, adapted);
    return { ok: true, via: "eventBus" };
  }
  return { ok: false, reason: "No modal handler" };
}
function hideLegacy(id) {
  _metrics.legacyCalls++;
  const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
  if (overlay && overlay.close) return overlay.close(id);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(MODAL_EVENTS.HIDE, { id });
    return { ok: true };
  }
  return { ok: false };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var legacy_adapter_default = { MODULE_ID, VERSION, MODAL_EVENTS, init, adaptLegacyConfig, showLegacy, hideLegacy, healthCheck, info, injectPorts, getPorts };
export {
  MODAL_EVENTS,
  MODULE_ID,
  VERSION,
  adaptLegacyConfig,
  legacy_adapter_default as default,
  getPorts,
  healthCheck,
  hideLegacy,
  info,
  init,
  injectPorts,
  showLegacy
};
