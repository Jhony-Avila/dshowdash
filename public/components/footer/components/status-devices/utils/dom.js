const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-devices/utils/dom";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class DOMUtils {
  // @ts-expect-error TS migration - TS2322, TS2345
  static createElement(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") el.className = v;
      else el.setAttribute(k, v);
    });
    return el;
  }
  static healthCheck() {
    const checks = { documentReady: !!document.body };
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
var dom_default = DOMUtils;
export {
  DOMUtils,
  MODULE_ID,
  VERSION,
  dom_default as default,
  getLogs,
  getVersion,
  setDebug
};
