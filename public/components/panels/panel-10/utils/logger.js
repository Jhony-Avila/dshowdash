import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-10.utils.logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
function Logger(panelId, version) {
  this.panelId = panelId;
  this.version = version || "1.0.0";
  this.traceId = `${panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this._debugEnabled = null;
  this._buffer = [];
  this._maxBuffer = 50;
  _initPorts();
}
Logger.prototype._isDebugEnabled = function() {
  if (this._debugEnabled !== null) return this._debugEnabled;
  try {
    const cfg = _getPort("config");
    if (cfg?.app?.debug === true) {
      this._debugEnabled = true;
      return true;
    }
    if (typeof localStorage !== "undefined" && localStorage.getItem("debug") === "true") {
      this._debugEnabled = true;
      return true;
    }
    if (cfg?.debugMode === true) {
      this._debugEnabled = true;
      return true;
    }
  } catch (e) {
  }
  this._debugEnabled = false;
  return false;
};
Logger.prototype._log = function(level, event, data = {}) {
  const entry = { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...data };
  this._buffer.push(entry);
  if (this._buffer.length > this._maxBuffer) this._buffer.shift();
  if (level === "debug" && !this._isDebugEnabled()) return;
  const globalLogger = _getPort("logger");
  if (globalLogger?.[level]) globalLogger[level](`[${this.panelId}]`, event, data);
};
Logger.prototype.debug = function(event, data) {
  this._log("debug", event, data);
};
Logger.prototype.info = function(event, data) {
  this._log("info", event, data);
};
Logger.prototype.warn = function(event, data) {
  this._log("warn", event, data);
};
Logger.prototype.error = function(event, data) {
  this._log("error", event, data);
};
Logger.prototype.getBuffer = function() {
  return this._buffer.slice();
};
Logger.prototype.clearBuffer = function() {
  this._buffer = [];
};
Logger.prototype.getLastEntries = function(count) {
  return this._buffer.slice(-(count || 10));
};
Logger.prototype.setTraceId = function(traceId) {
  this.traceId = traceId;
};
Logger.prototype.getTraceId = function() {
  return this.traceId;
};
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
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
