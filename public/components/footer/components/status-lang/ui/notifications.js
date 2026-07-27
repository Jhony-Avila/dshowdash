const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-lang/ui/notifications";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class NotificationManager {
  constructor() {
    this._metrics = { showCount: 0, lastShowAt: null };
  }
  show(msg) {
    _log("info", "Notification:", msg);
    this._metrics.showCount++;
    this._metrics.lastShowAt = Date.now();
  }
  healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { showCount: 0, lastShowAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var notifications_default = NotificationManager;
export {
  MODULE_ID,
  NotificationManager,
  VERSION,
  notifications_default as default,
  getLogs,
  getVersion,
  setDebug
};
