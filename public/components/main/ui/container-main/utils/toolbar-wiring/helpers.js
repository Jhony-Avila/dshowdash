import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "toolbar-wiring.helpers";
const VERSION = "1.4.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getEventBus() {
  _initPorts();
  const portEventBus = Ports.get("eventBus");
  if (portEventBus) return portEventBus;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
function getActivePanelId() {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(".panel-active");
  return el ? el.id : null;
}
function getActivePanelElement() {
  if (typeof document === "undefined") return null;
  return document.querySelector(".panel-active") || document.getElementById("container-main");
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    strictMode: isStrict()
  };
}
var helpers_default = { getEventBus, getActivePanelId, getActivePanelElement, injectPorts, getPorts, info, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  getActivePanelElement,
  getActivePanelId,
  getEventBus,
  getPorts,
  info,
  injectPorts
};
