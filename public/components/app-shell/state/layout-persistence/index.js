import { VERSION, MODULE_ID, STORAGE_KEY, STORAGE_VERSION, DEFAULT_PREFERENCES, getStorage } from "./constants.js";
import {
  load as _load,
  save as _save,
  get as _get,
  getPreference as _getPreference,
  setPreference as _setPreference,
  setPreferences as _setPreferences,
  reset as _reset,
  clear as _clear
} from "./core.js";
let _preferences = null;
let _initialized = false;
const _listeners = [];
const _metrics = {
  loads: 0,
  saves: 0,
  resets: 0,
  errors: 0,
  lastSaveAt: null,
  lastLoadAt: null
};
function _notifyListeners(event, data) {
  for (let i = 0; i < _listeners.length; i++) {
    try {
      _listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
    }
  }
}
const _stateProxy = {
  get preferences() {
    return _preferences;
  },
  set preferences(v) {
    _preferences = v;
  },
  get initialized() {
    return _initialized;
  },
  set initialized(v) {
    _initialized = v;
  },
  get metrics() {
    return _metrics;
  },
  notify: _notifyListeners
};
function load() {
  return _load(_stateProxy);
}
function save() {
  return _save(_stateProxy);
}
function get() {
  return _get(_stateProxy);
}
function getPreference(path) {
  return _getPreference(path, _stateProxy);
}
function setPreference(path, value, options) {
  return _setPreference(path, value, options, _stateProxy);
}
function setPreferences(preferences, options) {
  return _setPreferences(preferences, options, _stateProxy);
}
function reset(options) {
  return _reset(options, _stateProxy);
}
function clear() {
  return _clear(_stateProxy);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function isSidebarCollapsed() {
  return getPreference("sidebar.collapsed") === true;
}
function setSidebarCollapsed(collapsed) {
  return setPreference("sidebar.collapsed", !!collapsed);
}
function toggleSidebar() {
  return setSidebarCollapsed(!isSidebarCollapsed());
}
function getSidebarWidth() {
  return getPreference("sidebar.width") || 280;
}
function setSidebarWidth(width) {
  return setPreference("sidebar.width", Math.max(200, Math.min(500, width)));
}
function getLayoutMode() {
  return getPreference("layout.mode") || "normal";
}
function setLayoutMode(mode) {
  const validModes = ["normal", "fullscreen", "compact"];
  if (validModes.indexOf(mode) === -1) mode = "normal";
  return setPreference("layout.mode", mode);
}
function isFullscreen() {
  return getLayoutMode() === "fullscreen";
}
function getThemeMode() {
  return getPreference("theme.mode") || "system";
}
function setThemeMode(mode) {
  const validModes = ["light", "dark", "system"];
  if (validModes.indexOf(mode) === -1) mode = "system";
  return setPreference("theme.mode", mode);
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const storage = getStorage();
  const checks = {
    initialized: _initialized,
    storageAvailable: !!storage,
    preferencesLoaded: !!_preferences,
    noErrors: _metrics.errors === 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    storageKey: STORAGE_KEY,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    storageKey: STORAGE_KEY,
    storageVersion: STORAGE_VERSION,
    defaultPreferences: DEFAULT_PREFERENCES,
    currentPreferences: get(),
    listenerCount: _listeners.length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
load();
var layout_persistence_default = {
  VERSION,
  MODULE_ID,
  load,
  save,
  get,
  getPreference,
  setPreference,
  setPreferences,
  reset,
  clear,
  subscribe,
  isSidebarCollapsed,
  setSidebarCollapsed,
  toggleSidebar,
  getSidebarWidth,
  setSidebarWidth,
  getLayoutMode,
  setLayoutMode,
  isFullscreen,
  getThemeMode,
  setThemeMode,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  clear,
  layout_persistence_default as default,
  get,
  getLayoutMode,
  getMetrics,
  getPreference,
  getSidebarWidth,
  getThemeMode,
  healthCheck,
  info,
  isFullscreen,
  isSidebarCollapsed,
  load,
  reset,
  save,
  setLayoutMode,
  setPreference,
  setPreferences,
  setSidebarCollapsed,
  setSidebarWidth,
  setThemeMode,
  subscribe,
  toggleSidebar
};
