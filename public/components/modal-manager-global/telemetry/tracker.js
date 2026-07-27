import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.modal-manager-global.telemetry.tracker";
const VERSION = "2.2.0-P18EC";
const MODAL_TELEMETRY = {
  OPENED: "modal:opened",
  CLOSED: "modal:closed",
  ERROR: "modal:error",
  INTERACTION: "modal:interaction"
};
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
const _metrics = { tracked: 0, opens: 0, closes: 0, errors: 0 };
function _track(eventKey, payload) {
  _metrics.tracked++;
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID, timestamp: Date.now() }, payload || {}));
  } catch (e) {
    _metrics.errors++;
  }
}
function trackOpen(modalId, config, owner) {
  _metrics.opens++;
  _track(MODAL_TELEMETRY.OPENED, { modalId, type: config && config.type, title: config && config.title, owner: owner || null });
}
function trackClose(modalId, reason) {
  _metrics.closes++;
  _track(MODAL_TELEMETRY.CLOSED, { modalId, reason });
}
function trackError(modalId, error) {
  _metrics.errors++;
  _track(MODAL_TELEMETRY.ERROR, { modalId, error: error instanceof Error ? error.message : String(error) });
}
function trackInteraction(modalId, action) {
  _track(MODAL_TELEMETRY.INTERACTION, { modalId, action });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: !!_getPort("telemetry"), severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var tracker_default = { MODULE_ID, VERSION, MODAL_TELEMETRY, init, trackOpen, trackClose, trackError, trackInteraction, healthCheck, info, injectPorts, getPorts };
export {
  MODAL_TELEMETRY,
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  trackClose,
  trackError,
  trackInteraction,
  trackOpen
};
