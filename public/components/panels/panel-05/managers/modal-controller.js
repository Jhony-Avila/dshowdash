import { modalsManager } from "../ui/modals.js";
import * as Telemetry from "../telemetry/tracker.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:managers:modal-controller";
let _activeModal = null;
function show(type, options = {}) {
  options = options || {};
  close();
  let html = "";
  if (type === "keyboard-help") {
    html = modalsManager.renderKeyboardHelp();
  } else if (type === "settings") {
    html = modalsManager.renderSettings();
  } else if (type === "date-picker") {
    html = modalsManager.renderDateRangePicker(options);
  } else {
    return null;
  }
  const modalContainer = document.createElement("div");
  modalContainer.className = "p05-modal-wrapper";
  modalContainer.innerHTML = html;
  document.body.appendChild(modalContainer);
  _activeModal = modalContainer;
  const firstFocusable = modalContainer.querySelector("button, input, select");
  if (firstFocusable) firstFocusable.focus();
  Telemetry.trackAction("modal-open", { type });
  return modalContainer;
}
function close() {
  if (_activeModal) {
    _activeModal.remove();
    _activeModal = null;
  }
}
function isOpen() {
  return !!_activeModal;
}
function getActive() {
  return _activeModal;
}
function healthCheck() {
  const checks = { modalsManagerAvailable: !!modalsManager, telemetryAvailable: !!Telemetry };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, isOpen: !!_activeModal, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isOpen: !!_activeModal, p25Compliant: true };
}
var modal_controller_default = { show, close, isOpen, getActive, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  close,
  modal_controller_default as default,
  getActive,
  healthCheck,
  info,
  isOpen,
  show
};
