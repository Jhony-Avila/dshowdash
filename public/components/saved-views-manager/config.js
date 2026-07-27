import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-P17WI";
const MODULE_ID = "saved-views-manager.config";
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
const CONFIG = { endpoints: { list: "/api/saved-views/?action=list", get: "/api/saved-views/?action=get", types: "/api/saved-views/?action=types", create: "/api/saved-views/?action=create", update: "/api/saved-views/?action=update", setDefault: "/api/saved-views/?action=set-default", delete: "/api/saved-views/" }, retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 }, timeout: 1e4 };
const VIEW_TYPES = { DASHBOARD: "dashboard", PANEL: "panel", REPORT: "report", FILTER: "filter", LAYOUT: "layout", CUSTOM: "custom" };
function createMetrics() {
  return { listCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, applyCount: 0, errorCount: 0, lastActivity: null };
}
const logger = { info: (msg, ctx = {}) => {
  const L = _getPort("logger");
  if (L && typeof L.info === "function") L.info(msg, { component: MODULE_ID, ...ctx });
}, warn: (msg, ctx = {}) => {
  const L = _getPort("logger");
  if (L && typeof L.warn === "function") L.warn(msg, { component: MODULE_ID, ...ctx });
}, error: (msg, ctx = {}) => {
  const L = _getPort("logger");
  if (L && typeof L.error === "function") L.error(msg, { component: MODULE_ID, ...ctx });
}, debug: (msg, ctx = {}) => {
  const L = _getPort("logger");
  if (L && typeof L.debug === "function") L.debug(msg, { component: MODULE_ID, ...ctx });
} };
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  VIEW_TYPES,
  createMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  logger
};
