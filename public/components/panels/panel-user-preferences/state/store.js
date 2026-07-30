const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences/state/store";
let _listeners = [];
let _store = {
  theme: "system",
  density: "comfortable",
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
  notifications: { email: true, push: true, sound: false },
  accessibility: { highContrast: false, reducedMotion: false, fontSize: "medium" },
  dashboard: { layout: "default", widgets: [], sidebarCollapsed: false },
  _initialized: false,
  _dirty: false
};
function getState() {
  return Object.assign({}, _store);
}
function get(key) {
  return key ? _store[key] : getState();
}
function set(key, value) {
  if (typeof key === "object") {
    Object.assign(_store, key);
  } else {
    _store[key] = value;
  }
  _store._dirty = true;
  _notify();
}
function reset() {
  _store = { theme: "system", density: "comfortable", language: "pt-BR", timezone: "America/Sao_Paulo", notifications: { email: true, push: true, sound: false }, accessibility: { highContrast: false, reducedMotion: false, fontSize: "medium" }, dashboard: { layout: "default", widgets: [], sidebarCollapsed: false }, _initialized: false, _dirty: false };
  _notify();
}
function setState(patch) {
  set(patch);
}
function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}
function _notify() {
  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
    }
  });
}
function isDirty() {
  return _store._dirty;
}
function markClean() {
  _store._dirty = false;
}
function isInitialized() {
  return _store._initialized;
}
function setInitialized(val) {
  _store._initialized = val;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, dirty: _store._dirty, initialized: _store._initialized };
}
var store_default = { getState, get, set, setState, reset, subscribe, isDirty, markClean, isInitialized, setInitialized };
const StateStore = { getState, get, set, reset, subscribe, isDirty, markClean, isInitialized, setInitialized, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  get,
  getState,
  healthCheck,
  info,
  isDirty,
  isInitialized,
  markClean,
  reset,
  set,
  setInitialized,
  setState,
  subscribe
};
