import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "8.2.0-P17WI";
const MODULE_ID = "components/permissions-guard/core/logger";
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
function debug(...args) {
  _getPort("logger")?.debug(`[${MODULE_ID}]`, ...args);
}
function info(...args) {
  _getPort("logger")?.info(`[${MODULE_ID}]`, ...args);
}
function warn(...args) {
  _getPort("logger")?.warn(`[${MODULE_ID}]`, ...args);
}
function error(...args) {
  _getPort("logger")?.error(`[${MODULE_ID}]`, ...args);
}
function healthCheck() {
  return { status: "healthy", portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
}
function getInfo() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
const _metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0 };
var logger_default = { debug, info, warn, error, healthCheck, getInfo, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  _metrics,
  debug,
  logger_default as default,
  error,
  getInfo,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  warn
};
