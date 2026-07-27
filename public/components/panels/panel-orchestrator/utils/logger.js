import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator.utils.logger";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ? true : false;
};
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4 };
const LOG_COLORS = { DEBUG: "#6c757d", INFO: "#0d6efd", WARN: "#ffc107", ERROR: "#dc3545", CRITICAL: "#721c24" };
function OrchestratorLogger() {
  this.namespace = "Orchestrator";
  this.level = LOG_LEVELS.DEBUG;
  this.history = [];
  this.maxHistory = 500;
  this.enabled = true;
}
OrchestratorLogger.prototype.getVersion = () => VERSION;
OrchestratorLogger.prototype.setLevel = function(level) {
  if (LOG_LEVELS[level] !== void 0) this.level = LOG_LEVELS[level];
};
OrchestratorLogger.prototype.setEnabled = function(enabled) {
  this.enabled = !!enabled;
};
OrchestratorLogger.prototype.setDebug = function(enabled) {
  this.setEnabled(enabled);
};
OrchestratorLogger.prototype._shouldLog = function(level) {
  return this.enabled && LOG_LEVELS[level] >= this.level;
};
OrchestratorLogger.prototype._addToHistory = function(level, message, data) {
  const entry = { level, message, data, timestamp: Date.now(), time: (/* @__PURE__ */ new Date()).toISOString() };
  this.history.push(entry);
  if (this.history.length > this.maxHistory) this.history.shift();
  return entry;
};
OrchestratorLogger.prototype._formatMessage = function(level, message) {
  return `[${this.namespace}][${level}] ${message}`;
};
OrchestratorLogger.prototype._log = function(level, message, data = null) {
  this._addToHistory(level, message, data);
  if (!this._shouldLog(level)) return;
  _initPorts();
  if (!_debugEnabled() && level !== "ERROR" && level !== "CRITICAL" && level !== "WARN") return;
  const formattedMessage = this._formatMessage(level, message);
  const logger2 = _getPort("logger");
  if (logger2) {
    if (level === "ERROR" || level === "CRITICAL") {
      if (logger2.error) logger2.error(`[${MODULE_ID}]`, formattedMessage, data || "");
    } else if (level === "WARN") {
      if (logger2.warn) logger2.warn(`[${MODULE_ID}]`, formattedMessage, data || "");
    } else {
      if (logger2.debug) logger2.debug(`[${MODULE_ID}]`, formattedMessage, data || "");
    }
  }
};
OrchestratorLogger.prototype.debug = function(message, data) {
  this._log("DEBUG", message, data);
};
OrchestratorLogger.prototype.info = function(message, data) {
  this._log("INFO", message, data);
};
OrchestratorLogger.prototype.warn = function(message, data) {
  this._log("WARN", message, data);
};
OrchestratorLogger.prototype.error = function(message, data) {
  this._log("ERROR", message, data);
};
OrchestratorLogger.prototype.critical = function(message, data) {
  this._log("CRITICAL", message, data);
};
OrchestratorLogger.prototype.getHistory = function() {
  return this.history.slice();
};
OrchestratorLogger.prototype.getRecentLogs = function(count = 50) {
  return this.history.slice(-count);
};
OrchestratorLogger.prototype.getLogsByLevel = function(level) {
  return this.history.filter((entry) => entry.level === level);
};
OrchestratorLogger.prototype.clearHistory = function() {
  this.history = [];
};
OrchestratorLogger.prototype.getStats = function() {
  const counts = {};
  Object.keys(LOG_LEVELS).forEach((level) => {
    counts[level] = this.history.filter((e) => e.level === level).length;
  });
  return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: Object.keys(LOG_LEVELS).find((k) => LOG_LEVELS[k] === this.level), historySize: this.history.length, counts, portsInitialized: Ports.isInitialized() };
};
const logger = new OrchestratorLogger();
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
const healthCheck = () => {
  const loggerPort = _getPort("logger");
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: !!loggerPort, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() };
};
var logger_default = logger;
export {
  LOG_COLORS,
  LOG_LEVELS,
  MODULE_ID,
  OrchestratorLogger,
  VERSION,
  logger_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  logger
};
