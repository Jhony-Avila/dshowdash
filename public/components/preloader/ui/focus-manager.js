import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "preloader.ui.focus-manager";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _lastFocusedElement = null;
function saveFocusState() {
  if (typeof document !== "undefined") {
    _lastFocusedElement = document.activeElement;
  }
}
function restoreFocusState(screenElement = null) {
  if (_lastFocusedElement?.focus) {
    try {
      _lastFocusedElement.focus();
    } catch {
      const main = typeof document !== "undefined" ? document.querySelector('main[tabindex="-1"]') : null;
      if (main) main.focus();
    }
  }
  if (screenElement) {
    screenElement.removeAttribute("tabindex");
  }
  _lastFocusedElement = null;
}
function getLastFocusedElement() {
  return _lastFocusedElement;
}
function setFocusToElement(element) {
  if (element?.focus) {
    try {
      element.focus();
    } catch {
    }
  }
}
function reset() {
  _lastFocusedElement = null;
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, hasSavedFocus: !!_lastFocusedElement, portsInitialized: Ports.isInitialized() };
}
var focus_manager_default = { VERSION, MODULE_ID, saveFocusState, restoreFocusState, getLastFocusedElement, setFocusToElement, reset, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  focus_manager_default as default,
  getLastFocusedElement,
  getPorts,
  healthCheck,
  injectPorts,
  reset,
  restoreFocusState,
  saveFocusState,
  setFocusToElement
};
