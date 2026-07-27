import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-06.state";
const PANEL_ID = "panel-06";
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
function _debug() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
}
function _log(level, ...rest) {
  const args = rest;
  const logger2 = _getPort("logger");
  if (!logger2) return;
  if (level === "error") {
    if (logger2.error) logger2.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger2.warn) logger2.warn(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debug() && logger2.debug) logger2.debug(...[`[${MODULE_ID}]`].concat(args));
}
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({}, data || {}, { source: MODULE_ID, timestamp: Date.now() }));
}
function _showToast(message, type) {
  type = type || "info";
  let toast = _getPort("toast");
  if (toast && toast.show) {
    toast.show(message, type);
    return;
  }
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    toast = window.Core.windowAdapter.get("Toast");
    if (toast && toast.show) {
      toast.show(message, type);
      return;
    }
  }
  const strictMode = isStrict();
  if (strictMode) {
    _log(type === "error" ? "error" : "info", `[Toast ${type}]`, message);
    return;
  }
  if (typeof window !== "undefined" && window.Toast) {
    recordViolation("WINDOW_TOAST_FALLBACK", { module: MODULE_ID, method: "_showToast" });
    if (window.Toast.show) {
      window.Toast.show(message, type);
      return;
    }
  }
  _log(type === "error" ? "error" : "info", `[Toast ${type}]`, message);
}
function _trackTelemetry(action, data) {
  data = data || {};
  const tt = _getPort("telemetry");
  if (tt && tt.track) tt.track(`${MODULE_ID}:${action}`, Object.assign({ moduleId: MODULE_ID, action, timestamp: Date.now() }, data));
}
const CATEGORIES = [
  { key: "general", label: "Geral", icon: "settings" },
  { key: "ui", label: "Interface", icon: "palette" },
  { key: "navigation", label: "Navega\xE7\xE3o", icon: "compass" },
  { key: "panels", label: "Pain\xE9is", icon: "layout-dashboard" },
  { key: "security", label: "Seguran\xE7a", icon: "lock" },
  { key: "notifications", label: "Notifica\xE7\xF5es", icon: "bell" },
  { key: "accessibility", label: "Acessibilidade", icon: "accessibility" },
  { key: "shortcuts", label: "Atalhos", icon: "keyboard" },
  { key: "integrations", label: "Integra\xE7\xF5es", icon: "link" },
  { key: "telemetry", label: "Telemetria", icon: "trending-up" },
  { key: "logs", label: "Logs", icon: "file-text" },
  { key: "health", label: "Health Check", icon: "heart-pulse" },
  { key: "privacy", label: "Privacidade", icon: "shield" },
  { key: "realtime", label: "Tempo Real", icon: "zap" },
  { key: "footer", label: "Footer", icon: "pin" },
  { key: "performance", label: "Performance", icon: "rocket" }
];
function createInitialState() {
  return { settings: [], categories: [], activeCategory: "general", loading: false, saving: false, error: null, changes: {}, searchTerm: "" };
}
function createMetrics() {
  return { mountCount: 0, unmountCount: 0, loadCount: 0, saveCount: 0, errorCount: 0, authFailCount: 0, lastActivity: null };
}
const logger = { info(...args) {
  _log(...["info"].concat(Array.prototype.slice.call(args)));
}, warn(...args) {
  _log(...["warn"].concat(Array.prototype.slice.call(args)));
}, error(...args) {
  _log(...["error"].concat(Array.prototype.slice.call(args)));
} };
function isAuthenticated() {
  const auth = _getPort("auth");
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
}
function ensureAuth(metrics, action) {
  _initPorts();
  action = action || "operation";
  if (isAuthenticated()) return true;
  metrics.authFailCount++;
  metrics.lastActivity = Date.now();
  _trackTelemetry("auth:failed", { action, count: metrics.authFailCount });
  _log("warn", "Auth required for:", action);
  return false;
}
function getUser() {
  const auth = _getPort("auth");
  return auth && auth.getUser ? auth.getUser() : null;
}
function getRoles() {
  const auth = _getPort("auth");
  return auth && auth.getRoles ? auth.getRoles() : [];
}
function hasRole(role) {
  const auth = _getPort("auth");
  return auth && auth.hasRole ? auth.hasRole(role) : false;
}
function hasPermission(permission) {
  const auth = _getPort("auth");
  return auth && auth.hasPermission ? auth.hasPermission(permission) : false;
}
export {
  CATEGORIES,
  MODULE_ID,
  PANEL_ID,
  VERSION,
  createInitialState,
  createMetrics,
  _emit as emit,
  ensureAuth,
  getPorts,
  getRoles,
  getUser,
  hasPermission,
  hasRole,
  injectPorts,
  isAuthenticated,
  logger,
  _showToast as showToast,
  _trackTelemetry as trackTelemetry
};
