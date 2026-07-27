import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID as PANEL_MODULE_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05.index.logger";
let _debug = false;
let _logBuffer = [];
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
function log(level, ...args) {
  const prefix = `[${PANEL_MODULE_ID}]`;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
  const logger = _getPort("logger");
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (level === "error") {
    console.log(`%c[ERROR]%c ${prefix}`, "color:#ef4444;font-weight:bold", "color:inherit", ...args);
  } else if (level === "warn") {
    console.log(`%c[WARN]%c ${prefix}`, "color:#f59e0b;font-weight:bold", "color:inherit", ...args);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() };
}
var logger_default = { log, info, healthCheck, injectPorts, getPorts, setDebug, getLogs, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  logger_default as default,
  getLogs,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  log,
  setDebug
};
