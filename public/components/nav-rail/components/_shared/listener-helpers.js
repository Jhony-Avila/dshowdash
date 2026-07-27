const VERSION = "1.0.0-ENTERPRISE-AAA";
const MODULE_ID = "navrail-shared-listeners";
function addListener(element, event, handler, cleanups = []) {
  if (!element || !event || !handler) return null;
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
  cleanups.forEach((fn) => {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
    }
  });
  cleanups.length = 0;
}
var listener_helpers_default = { addListener, addKeyboardListener, runCleanups, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addKeyboardListener,
  addListener,
  listener_helpers_default as default,
  runCleanups
};
