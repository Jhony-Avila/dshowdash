import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "session-manager.ports";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function initPorts() {
  Ports.init();
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPort(name) {
  return Ports.get(name);
}
function getPorts() {
  return Ports.snapshot();
}
function isInitialized() {
  return Ports.isInitialized();
}
const log = { info(msg, ctx) {
  if (!ctx) ctx = {};
  const logger = getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx));
}, warn(msg, ctx) {
  if (!ctx) ctx = {};
  const logger = getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx));
}, error(msg, ctx) {
  if (!ctx) ctx = {};
  const logger = getPort("logger");
  if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx));
}, debug(msg, ctx) {
  if (!ctx) ctx = {};
  const logger = getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx));
} };
function isLoggerAvailable() {
  return !!getPort("logger");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized(), loggerAvailable: isLoggerAvailable() };
}
var ports_default = { initPorts, injectPorts, getPort, getPorts, isInitialized, log, isLoggerAvailable };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  info,
  initPorts,
  injectPorts,
  isInitialized,
  isLoggerAvailable,
  log
};
