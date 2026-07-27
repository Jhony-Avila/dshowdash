import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CAPABILITIES } from "./core/constants.js";
const VERSION = "5.8.0-ES6";
const MODULE_ID = "sidebar-factory";
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
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[sidebar-factory]";
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (logger.debug) logger.debug(prefix, args.join(" "));
};
let _instance = null;
const _metrics = { creates: 0, destroys: 0, gets: 0, errors: 0 };
function createSidebar() {
  _metrics.creates++;
  if (_instance) return Promise.resolve(_instance);
  return import("./sidebar.js").then((module) => {
    const Sidebar = module.default || module.Sidebar;
    _instance = new Sidebar();
    return _instance;
  }).catch((error) => {
    _metrics.errors++;
    _log("error", "Failed to load sidebar:", error.message || error);
    throw error;
  });
}
function createSidebarSync(SidebarClass) {
  _metrics.creates++;
  if (!_instance) _instance = new SidebarClass();
  return _instance;
}
function getSidebar() {
  _metrics.gets++;
  if (!_instance) throw new Error("Sidebar not initialized. Call createSidebar() first.");
  return _instance;
}
function destroySidebar() {
  _metrics.destroys++;
  if (_instance) {
    if (_instance.destroy) _instance.destroy();
    _instance = null;
  }
}
function hasSidebarInstance() {
  return _instance !== null;
}
function getSidebarOrNull() {
  _metrics.gets++;
  return _instance;
}
function setInstance(instance) {
  _instance = instance;
}
function getMetrics() {
  return Object.assign({ hasInstance: !!_instance }, _metrics);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasInstance: !!_instance, capabilities: CAPABILITIES, metrics: getMetrics() };
}
function healthCheck() {
  const checks = { hasInstance: !!_instance, noErrors: _metrics.errors === 0, capabilitiesLoaded: !!CAPABILITIES, hasLogger: !!_getPort("logger") };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 3 ? "HEALTHY" : _instance ? "DEGRADED" : "NOT_INITIALIZED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var factory_default = { createSidebar, createSidebarSync, getSidebar, destroySidebar, hasSidebarInstance, getSidebarOrNull, setInstance, info, getMetrics, healthCheck, VERSION, MODULE_ID, CAPABILITIES };
export {
  MODULE_ID,
  VERSION,
  createSidebar,
  createSidebarSync,
  factory_default as default,
  destroySidebar,
  getMetrics,
  getPorts,
  getSidebar,
  getSidebarOrNull,
  hasSidebarInstance,
  healthCheck,
  info,
  injectPorts,
  setInstance
};
