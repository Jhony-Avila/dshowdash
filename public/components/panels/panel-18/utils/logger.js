import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-18.utils.logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
function Logger(panelId, version, options = {}) {
  this.panelId = panelId;
  this.version = version;
  this.minLevel = options.minLevel || "debug";
  this.traceId = this.generateTraceId();
  this.buffer = [];
  this.maxBuffer = 100;
  _initPorts();
}
Logger.prototype.generateTraceId = function() {
  return `${this.panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
Logger.prototype.shouldLog = function(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
};
Logger.prototype.formatEntry = function(level, event, data = {}) {
  return { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...data };
};
Logger.prototype.log = function(level, event, data) {
  if (!this.shouldLog(level)) return;
  const entry = this.formatEntry(level, event, data);
  this.buffer.push(entry);
  if (this.buffer.length > this.maxBuffer) this.buffer.shift();
  const globalLogger = _getPort("logger");
  if (globalLogger) {
    const fn = globalLogger[level];
    if (typeof fn === "function") fn.call(globalLogger, `[${this.panelId}] ${event}`, entry);
  }
};
Logger.prototype.debug = function(event, data) {
  this.log("debug", event, data);
};
Logger.prototype.info = function(event, data) {
  this.log("info", event, data);
};
Logger.prototype.warn = function(event, data) {
  this.log("warn", event, data);
};
Logger.prototype.error = function(event, data) {
  this.log("error", event, data);
};
Logger.prototype.getRecentLogs = function(count = 20) {
  return this.buffer.slice(-count);
};
Logger.prototype.clearBuffer = function() {
  this.buffer = [];
};
Logger.prototype.renewTraceId = function() {
  this.traceId = this.generateTraceId();
  return this.traceId;
};
Logger.prototype.getInfo = function() {
  return { panelId: this.panelId, version: this.version, traceId: this.traceId, minLevel: this.minLevel, bufferSize: this.buffer.length };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
