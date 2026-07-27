const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "theme-manager-store";
let _state = { currentTheme: "light", availableThemes: ["light", "dark"], preferences: {} };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function getCurrentTheme() {
  return _state.currentTheme;
}
function setTheme(theme) {
  if (!_state.availableThemes.includes(theme)) return false;
  _state.currentTheme = theme;
  _notify();
  return true;
}
function getAvailableThemes() {
  return [..._state.availableThemes];
}
function subscribe(fn) {
  if (typeof fn === "function") _subscribers.push(fn);
  return () => {
    _subscribers = _subscribers.filter((s) => s !== fn);
  };
}
function _notify() {
  _subscribers.forEach((s) => {
    try {
      s(_state);
    } catch (e) {
    }
  });
}
function healthCheck() {
  const checks = { hasState: true, validTheme: _state.availableThemes.includes(_state.currentTheme) };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, currentTheme: _state.currentTheme, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentTheme: _state.currentTheme, availableThemes: _state.availableThemes, timestamp: Date.now() };
}
const themeStore = { getState, getCurrentTheme, setTheme, getAvailableThemes, subscribe, healthCheck, info };
var store_default = { getState, getCurrentTheme, setTheme, getAvailableThemes, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getAvailableThemes,
  getCurrentTheme,
  getState,
  healthCheck,
  info,
  setTheme,
  subscribe,
  themeStore
};
