const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "theme-manager-detector";
let _listener = null;
function getSystemTheme() {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  return mq?.matches ? "dark" : "light";
}
function watch(callback) {
  if (_listener) unwatch();
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  _listener = (e) => callback(e.matches ? "dark" : "light");
  mq.addEventListener("change", _listener);
  return true;
}
function unwatch() {
  if (!_listener) return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.removeEventListener("change", _listener);
  _listener = null;
}
function healthCheck() {
  const checks = { mediaQuerySupported: !!window.matchMedia };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: `${passed}/1`, checks, systemTheme: getSystemTheme(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, systemTheme: getSystemTheme(), watching: !!_listener, timestamp: Date.now() };
}
const ThemeDetector = { getSystemTheme, watch, unwatch, healthCheck, info };
var detector_default = { getSystemTheme, watch, unwatch, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ThemeDetector,
  VERSION,
  detector_default as default,
  getSystemTheme,
  healthCheck,
  info,
  unwatch,
  watch
};
