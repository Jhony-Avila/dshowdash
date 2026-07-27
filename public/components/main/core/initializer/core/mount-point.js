import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P2-ENTERPRISE";
const MODULE_ID = "initializer-mount-point";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
function getSafeMountPoint() {
  const existing = document.getElementById("container-main");
  if (existing) return { element: existing, mode: "existing" };
  const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (shellMain) return { element: shellMain, mode: "shell-region" };
  const dataRegion = document.querySelector('[data-region="main"]');
  if (dataRegion) return { element: dataRegion, mode: "data-region" };
  const shellRegion = document.querySelector('[data-shell-region="main"]');
  if (shellRegion) return { element: shellRegion, mode: "shell-data-region" };
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn("[initializer] No safe mount point found - container will not be mounted to DOM");
  }
  return null;
}
var mount_point_default = {
  getSafeMountPoint,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  mount_point_default as default,
  getPorts,
  getSafeMountPoint,
  injectPorts
};
