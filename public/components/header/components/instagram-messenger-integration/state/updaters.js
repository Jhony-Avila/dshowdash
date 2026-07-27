const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/instagram-messenger-integration/state/updaters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class StateUpdaters {
  // @ts-expect-error TS migration - TS2698
  static update(currentState, updates) {
    return { ...currentState, ...updates, lastUpdate: Date.now() };
  }
  // @ts-expect-error TS migration - TS2698
  static updateUnreadCount(currentState, count) {
    return { ...currentState, unreadCount: count, lastUpdate: Date.now() };
  }
  static healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
var updaters_default = StateUpdaters;
export {
  MODULE_ID,
  StateUpdaters,
  VERSION,
  updaters_default as default,
  setDebug
};
