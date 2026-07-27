import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.0-P17WI";
const MODULE_ID = "ticker.ui.template-enterprise";
const hasWindow = typeof window !== "undefined";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
function createTickerTemplateEnterprise() {
  return `<div class="ticker-wrapper ticker-wrapper--full"><div class="ticker-content-container"><div class="ticker-track" role="marquee" aria-live="polite"></div></div></div>`;
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var template_enterprise_default = createTickerTemplateEnterprise;
export {
  MODULE_ID,
  VERSION,
  createTickerTemplateEnterprise,
  template_enterprise_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
