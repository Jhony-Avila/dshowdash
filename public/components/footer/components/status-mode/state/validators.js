const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-mode/state/validators";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class StateValidators {
  static validateState(state) {
    if (!state || typeof state !== "object") throw new Error("Invalid state");
    return true;
  }
  static validateMode(mode) {
    const validModes = ["normal", "maintenance", "p0", "incident", "degraded"];
    if (!validModes.includes(mode)) throw new Error("Invalid mode");
    return true;
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
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var validators_default = StateValidators;
export {
  MODULE_ID,
  StateValidators,
  VERSION,
  validators_default as default,
  getLogs,
  getVersion,
  setDebug
};
