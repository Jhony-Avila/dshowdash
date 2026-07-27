import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "ticker.utils.dom";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
function createElement(tag, className, content = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.textContent = content;
  return el;
}
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { documentReady: hasDocument && !!document.body, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var dom_default = { createElement, clearElement, healthCheck, info, getVersion, injectPorts, getPorts, VERSION };
export {
  MODULE_ID,
  VERSION,
  clearElement,
  createElement,
  dom_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
