const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/email-integration/core/polling";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class PollingCoordinator {
  constructor(options = {}) {
    this.interval = options.interval || 6e4;
    this.immediate = options.immediate !== false;
    this.timerId = null;
    this.isRunning = false;
    this.callbacks = [];
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.immediate) this._execute();
    this.timerId = setInterval(() => this._execute(), this.interval);
  }
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  async _execute() {
    if (document.hidden) return;
    if (this.callbacks.length === 0) return;
    this._metrics.pollCount++;
    this._metrics.lastPollAt = Date.now();
    try {
      for (const callback of this.callbacks) {
        await callback();
      }
      this._metrics.successCount++;
    } catch (error) {
      this._metrics.errorCount++;
      _log("error", "Execution error:", error);
    }
  }
  onPoll(callback) {
    this.callbacks.push(callback);
  }
  offPoll(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) this.callbacks.splice(index, 1);
  }
  healthCheck() {
    const checks = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : passed === 1 ? "DEGRADED" : "STOPPED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
