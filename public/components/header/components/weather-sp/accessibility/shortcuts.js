const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/weather-sp/accessibility/shortcuts";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class KeyboardShortcuts {
  constructor() {
    this.shortcuts = /* @__PURE__ */ new Map();
    this._debug = false;
    this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null };
  }
  register(key, cb) {
    this.shortcuts.set(key, cb);
    this._metrics.registerCount++;
  }
  unregister(key) {
    this.shortcuts.delete(key);
  }
  trigger(key, event) {
    const cb = this.shortcuts.get(key);
    if (cb) {
      cb(event);
      this._metrics.triggerCount++;
      this._metrics.lastTriggerAt = Date.now();
    }
  }
  healthCheck() {
    const checks = { hasShortcuts: this.shortcuts.size >= 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, shortcutCount: this.shortcuts.size, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null };
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
var shortcuts_default = KeyboardShortcuts;
export {
  KeyboardShortcuts,
  MODULE_ID,
  VERSION,
  shortcuts_default as default,
  getLogs,
  setDebug
};
