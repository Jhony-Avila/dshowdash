const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "header/components/logo/state/store";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class StateStore {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = [];
    this._debug = false;
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  // @ts-expect-error TS migration - TS2349
  setState(updates) {
    const prev = this.getState();
    this.state = { ...this.state, ...updates };
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.subscribers.forEach((s) => {
      try {
        s(this.state, prev);
        this._metrics.notifyCount++;
      } catch (e) {
        _log("error", "Subscriber error:", e);
      }
    });
  }
  subscribe(s) {
    this.subscribers.push(s);
    return () => {
      const i = this.subscribers.indexOf(s);
      if (i > -1) this.subscribers.splice(i, 1);
    };
  }
  reset() {
    this.state = {};
    this.subscribers = [];
  }
  healthCheck() {
    const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
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
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getLogs,
  setDebug
};
