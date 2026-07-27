import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header/utils/html-helpers";
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
let _debug = false;
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return _debug || cfg && cfg.app && cfg.app.debug;
};
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
let _metrics = { escapeHtmlCalls: 0, sanitizeStringCalls: 0, createElementCalls: 0 };
function escapeHtml(text) {
  _metrics.escapeHtmlCalls++;
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
function sanitizeString(str, maxLength) {
  maxLength = maxLength || 200;
  _metrics.sanitizeStringCalls++;
  if (!str || typeof str !== "string") return "";
  return escapeHtml(str.substring(0, maxLength));
}
function createElementFromHTML(htmlString) {
  _metrics.createElementCalls++;
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { escapeHtmlCalls: 0, sanitizeStringCalls: 0, createElementCalls: 0 };
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { documentExists: !!document, loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
var html_helpers_default = { escapeHtml, sanitizeString, createElementFromHTML, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createElementFromHTML,
  html_helpers_default as default,
  escapeHtml,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  sanitizeString,
  setDebug
};
