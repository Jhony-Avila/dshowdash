const MODULE_ID = "panels-panel-06-utils-logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _debug = false;
let _logBuffer = [];
class Logger {
  constructor(panelId, version) {
    this.panelId = panelId;
    this.version = version;
    this.traceId = `${panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  log(level, event, data) {
    data = data || {};
    const entry = { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    Object.keys(data).forEach((k) => {
      entry[k] = data[k];
    });
    _logBuffer.push(entry);
    if (_logBuffer.length > 50) _logBuffer.shift();
    if (_debug || level === "error" || level === "warn") {
      const msg = `[${this.panelId}] ${event}`;
      if (level === "error") console.log(`%c[ERROR]%c ${msg}`, "color:#ef4444;font-weight:bold", "color:inherit", entry);
      else if (level === "warn") console.log(`%c[WARN]%c ${msg}`, "color:#f59e0b;font-weight:bold", "color:inherit", entry);
    }
  }
  debug(event, data) {
    this.log("debug", event, data || {});
  }
  info(event, data) {
    this.log("info", event, data || {});
  }
  warn(event, data) {
    this.log("warn", event, data || {});
  }
  error(event, data) {
    this.log("error", event, data || {});
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true }, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getLogs,
  healthCheck,
  info,
  setDebug
};
