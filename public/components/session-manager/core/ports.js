import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "session-manager.core.ports";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function initPorts() {
  Ports.init();
}
function getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function isInitialized() {
  return Ports.isInitialized();
}
function getTracker() {
  const sessionManager = getPort("sessionManager");
  if (sessionManager && sessionManager.debug && sessionManager.debug.tracker) {
    return sessionManager.debug.tracker;
  }
  return { track() {
  } };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized() };
}
var ports_default = { initPorts, getPort, injectPorts, getPorts, isInitialized, getTracker };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  getTracker,
  info,
  initPorts,
  injectPorts,
  isInitialized
};
