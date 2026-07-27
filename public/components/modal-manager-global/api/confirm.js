import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.modal-manager-global.api.confirm";
const VERSION = "2.1.1-P17WI";
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
const _metrics = { confirms: 0, accepted: 0, rejected: 0 };
function confirm(title, message, options) {
  _metrics.confirms++;
  options = options || {};
  return new Promise((resolve) => {
    const overlay = _getPort("overlayKernel") || _getPort("overlayBridge");
    if (overlay && overlay.showConfirm) {
      overlay.showConfirm(message, options).then((result2) => {
        if (result2) _metrics.accepted++;
        else _metrics.rejected++;
        resolve(result2);
      });
      return;
    }
    const result = window.confirm(message);
    if (result) _metrics.accepted++;
    else _metrics.rejected++;
    resolve(result);
  });
}
function confirmDanger(message, options) {
  return confirm(null, message, Object.assign({ type: "danger", confirmText: options && options.confirmText || "Excluir", cancelText: options && options.cancelText || "Cancelar" }, options));
}
function confirmWarning(message, options) {
  return confirm(null, message, Object.assign({ type: "warning", confirmText: options && options.confirmText || "Confirmar" }, options));
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasOverlay: { ok: !!(_getPort("overlayKernel") || _getPort("overlayBridge")), severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var confirm_default = { MODULE_ID, VERSION, init, confirm, confirmDanger, confirmWarning, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  confirm,
  confirmDanger,
  confirmWarning,
  confirm_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
