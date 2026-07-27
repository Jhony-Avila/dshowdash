const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/notifications/ui/tooltips";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class TooltipManager {
  constructor(options = {}) {
    this.delay = options.delay || 300;
    this._debug = false;
    this._metrics = { showCount: 0, lastShowAt: null };
  }
  attach(el) {
    if (el) {
      el.title = el.getAttribute("data-tooltip") || "";
      this._metrics.showCount++;
      this._metrics.lastShowAt = Date.now();
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
    this._metrics = { showCount: 0, lastShowAt: null };
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
var tooltips_default = TooltipManager;
export {
  MODULE_ID,
  TooltipManager,
  VERSION,
  tooltips_default as default,
  getLogs,
  setDebug
};
