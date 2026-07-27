const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-keyboard";
let _handler = null;
let _enabled = false;
const _metrics = { escapeCount: 0, tabCount: 0 };
function init(onEscape, onTab) {
  if (_handler) destroy();
  _handler = (e) => {
    if (e.key === "Escape") {
      _metrics.escapeCount++;
      if (onEscape) onEscape(e);
    }
    if (e.key === "Tab") {
      _metrics.tabCount++;
      if (onTab) onTab(e);
    }
  };
  document.addEventListener("keydown", _handler);
  _enabled = true;
  return true;
}
function destroy() {
  if (_handler) document.removeEventListener("keydown", _handler);
  _handler = null;
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const checks = { enabled: _enabled, hasHandler: !!_handler };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return { status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics(), timestamp: Date.now() };
}
var keyboard_default = { init, destroy, isEnabled, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  keyboard_default as default,
  destroy,
  getMetrics,
  healthCheck,
  info,
  init,
  isEnabled
};
