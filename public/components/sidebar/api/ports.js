import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.0.0";
const MODULE_ID = "sidebar-api-ports";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function init() {
  Ports.init();
}
function get(name) {
  return Ports.get(name);
}
function inject(p) {
  return Ports.inject(p);
}
function snapshot() {
  return Ports.snapshot();
}
function isInitialized() {
  return Ports.isInitialized();
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized()
  };
}
function healthCheck() {
  return {
    status: isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { portsInitialized: isInitialized() }
  };
}
var ports_default = { init, get, inject, snapshot, isInitialized, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  get,
  healthCheck,
  info,
  init,
  inject,
  isInitialized,
  snapshot
};
