import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-P17WI";
const MODULE_ID = "layout-helpers";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _debug = false;
let _metrics = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 };
const GRID_COLUMNS_MAP = { xs: { max: 575, columns: 4 }, sm: { max: 767, columns: 6 }, md: { max: 991, columns: 8 }, lg: { max: 1199, columns: 10 }, xl: { max: Infinity, columns: 12 } };
const _log = function(level, ...extraArgs) {
  const args = Array.prototype.slice.call(arguments, 1);
  _initPorts();
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (!_debug) return;
  if (logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};
function setDebug(debug) {
  _debug = debug;
}
function getViewportSize() {
  _metrics.viewportCalls++;
  if (typeof window === "undefined") return { width: 1920, height: 1080 };
  return { width: window.innerWidth || document.documentElement.clientWidth, height: window.innerHeight || document.documentElement.clientHeight };
}
function getOrientation() {
  const size = getViewportSize();
  return size.width >= size.height ? "landscape" : "portrait";
}
function debounce(fn, delay) {
  delay = delay || 100;
  _metrics.debouncesCreated++;
  let timeoutId;
  return function() {
    const args = arguments;
    const self = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(self, args);
    }, delay);
  };
}
function throttle(fn, limit) {
  limit = limit || 100;
  _metrics.throttlesCreated++;
  let inThrottle;
  return function() {
    const args = arguments;
    const self = this;
    if (!inThrottle) {
      fn.apply(self, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function saveLayoutPreference(key, value) {
  if (typeof localStorage === "undefined") return false;
  const storageKey = `dshowdash-layout-${key}`;
  try {
    const newJson = JSON.stringify(value);
    const currentJson = localStorage.getItem(storageKey);
    if (currentJson === newJson) {
      _metrics.preferenceSkipped++;
      _log("info", "Preference unchanged, skipped:", key);
      return true;
    }
    localStorage.setItem(storageKey, newJson);
    _metrics.preferenceSaves++;
    _log("info", "Preference saved:", key);
    return true;
  } catch (err) {
    _log("error", "Save preference error:", err.message);
    return false;
  }
}
function loadLayoutPreference(key) {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(`dshowdash-layout-${key}`);
    _metrics.preferenceLoads++;
    return value ? JSON.parse(value) : null;
  } catch (err) {
    _log("error", "Load preference error:", err.message);
    return null;
  }
}
function calculateGridColumns(width) {
  const keys = Object.keys(GRID_COLUMNS_MAP);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const item = GRID_COLUMNS_MAP[key];
    if (width <= item.max) return item.columns;
  }
  return 12;
}
function getGridColumnsMap() {
  return Object.assign({}, GRID_COLUMNS_MAP);
}
function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
function getDevicePixelRatio() {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}
function healthCheck() {
  _initPorts();
  const logger = _getPort("logger");
  const checks = { windowAvailable: typeof window !== "undefined", localStorageAvailable: typeof localStorage !== "undefined", gridMapValid: Object.keys(GRID_COLUMNS_MAP).length >= 4, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, debug: _debug, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, _metrics), gridColumnsMap: Object.assign({}, GRID_COLUMNS_MAP), healthCheck: healthCheck(), environment: { windowAvailable: typeof window !== "undefined", localStorageAvailable: typeof localStorage !== "undefined", isTouch: isTouchDevice(), pixelRatio: getDevicePixelRatio() } };
}
function resetMetrics() {
  _metrics = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 };
}
function getVersion() {
  return VERSION;
}
export {
  MODULE_ID,
  VERSION,
  calculateGridColumns,
  debounce,
  getDevicePixelRatio,
  getGridColumnsMap,
  getOrientation,
  getPorts,
  getVersion,
  getViewportSize,
  healthCheck,
  info,
  injectPorts,
  isTouchDevice,
  loadLayoutPreference,
  resetMetrics,
  saveLayoutPreference,
  setDebug,
  throttle
};
