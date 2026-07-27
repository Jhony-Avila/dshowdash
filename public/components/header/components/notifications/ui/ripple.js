const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/notifications/ui/ripple";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class RippleEffect {
  constructor(options = {}) {
    this.duration = options.duration || 600;
    this._debug = false;
    this._metrics = { rippleCount: 0, lastRippleAt: null };
  }
  attach(el) {
    if (el) {
      el.addEventListener("click", () => {
        this._metrics.rippleCount++;
        this._metrics.lastRippleAt = Date.now();
      });
    }
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
    this._debug = !!enabled;
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { rippleCount: 0, lastRippleAt: null };
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
var ripple_default = RippleEffect;
export {
  MODULE_ID,
  RippleEffect,
  VERSION,
  ripple_default as default,
  getLogs,
  setDebug
};
