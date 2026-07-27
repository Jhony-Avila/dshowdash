const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "footer-shared-listeners";
let _metrics = { listenersAdded: 0, cleanups: 0 };
function addListener(element, event, handler, cleanups = []) {
  if (!element || !event || !handler) return null;
  _metrics.listenersAdded++;
  element.addEventListener(event, handler);
  const cleanup = () => {
    element.removeEventListener(event, handler);
  };
  cleanups.push(cleanup);
  return cleanup;
}
function addKeyboardListener(element, handler, cleanups = []) {
  if (!element || !handler) return null;
  const keyHandler = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler(e);
    }
  };
  return addListener(element, "keydown", keyHandler, cleanups);
}
function runCleanups(cleanups) {
  if (!Array.isArray(cleanups)) return;
  _metrics.cleanups++;
  cleanups.forEach((fn) => {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
    }
  });
  cleanups.length = 0;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() };
}
var listener_helpers_default = { addListener, addKeyboardListener, runCleanups, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addKeyboardListener,
  addListener,
  listener_helpers_default as default,
  getMetrics,
  healthCheck,
  info,
  runCleanups
};
