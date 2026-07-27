const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/weather-sp/core/polling";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class PollingCoordinator {
  constructor(options = {}) {
    this.interval = options.interval || 3e5;
    this.timerId = null;
    this.callbacks = [];
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    if (this.timerId) return;
    this.timerId = setInterval(() => this._execute(), this.interval);
  }
  stop() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }
  async _execute() {
    if (document.hidden) return;
    this._metrics.pollCount++;
    this._metrics.lastPollAt = Date.now();
    for (const cb of this.callbacks) {
      try {
        await cb();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++;
        _log("error", "Poll error:", e);
      }
    }
  }
  onPoll(cb) {
    this.callbacks.push(cb);
  }
  offPoll(cb) {
    const i = this.callbacks.indexOf(cb);
    if (i > -1) this.callbacks.splice(i, 1);
  }
  healthCheck() {
    const checks = { isRunning: !!this.timerId, hasCallbacks: this.callbacks.length > 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : passed === 1 ? "DEGRADED" : "STOPPED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, isRunning: !!this.timerId, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var polling_default = PollingCoordinator;
export {
  MODULE_ID,
  PollingCoordinator,
  VERSION,
  polling_default as default,
  getLogs,
  setDebug
};
