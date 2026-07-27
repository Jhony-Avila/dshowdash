import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "8.2.0-P17WI";
const MODULE_ID = "components/permission-audit-client/config";
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
const CONFIG = { enabled: true, logLevel: "info", auditEndpoint: "/api/audit", batchSize: 100, flushInterval: 3e4 };
function getConfig() {
  return { ...CONFIG };
}
function setConfig(updates) {
  Object.assign(CONFIG, updates);
  _getPort("logger")?.info(`[${MODULE_ID}] Config updated`);
}
function healthCheck() {
  return { status: "healthy", config: CONFIG, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, config: CONFIG, portsInitialized: Ports.isInitialized() };
}
const ACTIONS = Object.freeze({ CHECK: "check", GRANT: "grant", DENY: "deny", ELEVATE: "elevate", REVOKE: "revoke" });
function createMetrics() {
  return { checks: 0, grants: 0, denials: 0, errors: 0, lastActivity: null, errorCount: 0, logCount: 0, flushCount: 0 };
}
const logger = { info: function(...args) {
}, warn: function(...args) {
}, error: function(...args) {
}, debug: function(...args) {
} };
var config_default = { CONFIG, getConfig, setConfig, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  ACTIONS,
  CONFIG,
  MODULE_ID,
  VERSION,
  createMetrics,
  config_default as default,
  getConfig,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  logger,
  setConfig
};
