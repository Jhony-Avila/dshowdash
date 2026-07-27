const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/real-time-clock/utils/timers";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class TimerUtils {
  static setTimeout(cb, delay) {
    const id = setTimeout(cb, delay);
    return () => clearTimeout(id);
  }
  static setInterval(cb, interval) {
    const id = setInterval(cb, interval);
    return () => clearInterval(id);
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
var timers_default = TimerUtils;
export {
  MODULE_ID,
  TimerUtils,
  VERSION,
  timers_default as default,
  setDebug
};
