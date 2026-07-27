import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { tracker } from "../telemetry/tracker.js";
const VERSION = "9.4.0-P18EC-ENTERPRISE";
const MODULE_ID = "panel-nav-admin.core.lifecycle";
const PANEL_ID = "panel-nav-admin";
const PANEL_NAME = "Administra\xE7\xE3o de Navega\xE7\xE3o";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
var _initPorts = function() {
  Ports.init();
};
var _getPort = function(name) {
  return Ports.get(name);
};
var injectPorts = function(p) {
  return Ports.inject(p);
};
var getPorts = function() {
  return Ports.snapshot();
};
var metrics = { mountCount: 0, unmountCount: 0, loadCount: 0, errorCount: 0, itemsCreated: 0, itemsUpdated: 0, itemsDeleted: 0, sectionsCreated: 0, lastActivity: null };
var _emit = function(event, data = {}) {
  data = data || {};
  var eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
};
var loadCSS = function() {
  var cssPath = "/components/panels/panel-nav-admin/styles.css";
  var al = _getPort("assetLoader");
  if (al && al.loadCSS) {
    al.loadCSS(cssPath);
  } else if (typeof document !== "undefined" && !document.querySelector('link[href="' + cssPath + '"]')) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
};
var isAuthenticated = function() {
  var auth = _getPort("auth");
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
};
var ensureAuth = function(action) {
  action = action || "operation";
  if (isAuthenticated()) return true;
  tracker.trackAuthRequired(action);
  _emit(AUTH_INTENTS.LOGIN, { reason: "session-expired", action });
  return false;
};
var checkPanelAccess = function() {
  var auth = _getPort("auth");
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) return false;
  if (auth.canAccessPanel) return auth.canAccessPanel(PANEL_ID);
  if (auth.can) return auth.can("nav:admin") || auth.can("admin:full");
  return getUserLevel() >= 100;
};
var getUserLevel = function() {
  var auth = _getPort("auth");
  return auth && auth.getLevel ? auth.getLevel() : 0;
};
async function initLifecycle(container, options = {}) {
  options = options || {};
  try {
    _initPorts();
    loadCSS();
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    if (options.ports) {
      injectPorts(options.ports);
    }
    _emit("panel:lifecycle:init", { panelId: PANEL_ID, container: !!container });
    return { ok: true, panelId: PANEL_ID, version: VERSION };
  } catch (err) {
    metrics.errorCount++;
    if (typeof console !== "undefined") console.error("[" + MODULE_ID + "] initLifecycle failed:", err);
    throw err;
  }
}
var healthCheck = function(isInitialized, container, stateHealth, adapterHealth) {
  var ps = Ports.snapshot();
  var checks = {
    initialized: isInitialized,
    mounted: !!container,
    authenticated: isAuthenticated(),
    stateHealthy: stateHealth ? stateHealth.status === "HEALTHY" : false,
    adapterHealthy: adapterHealth ? adapterHealth.status === "HEALTHY" : false,
    portsInitialized: ps._initialized
  };
  var passed = 0, total = 0;
  for (var k in checks) {
    total++;
    if (checks[k]) passed++;
  }
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed + "/" + total,
    checks,
    state: stateHealth,
    adapter: adapterHealth,
    metrics: Object.assign({}, metrics),
    version: VERSION,
    p22Compliant: true,
    timestamp: Date.now()
  };
};
var info = function(isInitialized, container, healthCheckResult) {
  var ps = Ports.snapshot();
  return {
    id: PANEL_ID,
    name: PANEL_NAME,
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: isInitialized,
    mounted: !!container,
    portsInitialized: ps._initialized,
    metrics: Object.assign({}, metrics),
    healthCheck: healthCheckResult,
    p22Compliant: true,
    timestamp: Date.now()
  };
};
export {
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
  initLifecycle,
  injectPorts,
  isAuthenticated,
  loadCSS,
  metrics
};
