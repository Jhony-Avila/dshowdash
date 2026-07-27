import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-header-admin.core.lifecycle";
const PANEL_ID = "panel-header-admin";
const PANEL_NAME = "Header Admin";
const MIN_ACCESS_LEVEL = 100;
const hasDocument = typeof document !== "undefined";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
const metrics = { mountCount: 0, unmountCount: 0, loadCount: 0, saveCount: 0, errorCount: 0, lastActivity: null };
function loadCSS() {
  if (!hasDocument) return;
  const cssId = `${MODULE_ID}-styles`;
  if (document.getElementById(cssId)) return;
  const link = document.createElement("link");
  link.id = cssId;
  link.rel = "stylesheet";
  link.href = `/components/panels/${PANEL_ID}/styles/main.css`;
  document.head.appendChild(link);
}
function isAuthenticated() {
  const auth = _getPort("auth");
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
}
function ensureAuth(action) {
  if (isAuthenticated()) return true;
  _log("warn", `Auth required for ${action}`);
  return false;
}
function checkPanelAccess() {
  const auth = _getPort("auth");
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) return false;
  if (auth.canAccessPanel) return auth.canAccessPanel(PANEL_ID);
  if (auth.can) return auth.can("header:admin") || auth.can("admin:full");
  return getUserLevel() >= MIN_ACCESS_LEVEL;
}
function getUserLevel() {
  const auth = _getPort("auth");
  return auth && auth.getLevel ? auth.getLevel() : 0;
}
function healthCheck(isInitialized, container, stateHealth, adapterHealth) {
  _initPorts();
  const logger = _getPort("logger");
  const checks = { initialized: isInitialized, hasContainer: !!container, authenticated: isAuthenticated(), stateHealthy: stateHealth && stateHealth.status === "HEALTHY", adapterHealthy: adapterHealth && adapterHealth.status === "HEALTHY", noExcessiveErrors: metrics.errorCount < 10, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: Object.assign({}, metrics), version: VERSION, moduleId: MODULE_ID };
}
function info(isInitialized, container, health) {
  return { version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, panelName: PANEL_NAME, isInitialized, hasContainer: !!container, metrics: Object.assign({}, metrics), healthCheck: health, portsInitialized: Ports.isInitialized() };
}
export {
  MIN_ACCESS_LEVEL,
  MODULE_ID,
  PANEL_ID,
  PANEL_NAME,
  VERSION,
  checkPanelAccess,
  ensureAuth,
  getPorts,
  getUserLevel,
  healthCheck,
  info,
  injectPorts,
  isAuthenticated,
  loadCSS,
  metrics
};
