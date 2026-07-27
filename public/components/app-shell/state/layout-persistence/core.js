import { createEarlyLogger } from "/core/runtime/early-boot-logger.js";
import { STORAGE_KEY, STORAGE_VERSION } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.state.layout-persistence.core";
const logger = createEarlyLogger("layout-persistence");
let _data = null;
const _metrics = { loads: 0, saves: 0, resets: 0, errors: 0 };
function load(_proxy) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
      _metrics.loads++;
      return _data;
    }
    const parsed = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) {
      logger.warn("Schema version mismatch, resetting");
      _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
    } else {
      _data = parsed;
    }
    _metrics.loads++;
    return _data;
  } catch (e) {
    _metrics.errors++;
    logger.error(`Load failed: ${e.message}`);
    _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
    return _data;
  }
}
function save(_proxy) {
  if (!_data) load();
  try {
    _data.timestamp = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    _metrics.saves++;
    return true;
  } catch (e) {
    _metrics.errors++;
    logger.error(`Save failed: ${e.message}`);
    return false;
  }
}
function get(path, _proxy) {
  if (!_data) load();
  if (!path) return _data;
  const parts = path.split(".");
  let current = _data;
  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === void 0) return void 0;
    current = current[parts[i]];
  }
  return current;
}
function getPreference(path, defaultValue, _proxy) {
  if (!_data) load();
  const parts = path.split(".");
  let current = _data.preferences;
  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === void 0) return defaultValue;
    current = current[parts[i]];
  }
  return current !== void 0 ? current : defaultValue;
}
function setPreference(path, value, options, _proxy) {
  options = options || {};
  if (!_data) load();
  const parts = path.split(".");
  let current = _data.preferences;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  if (options.persist !== false) {
    save();
  }
  return true;
}
function setPreferences(preferences, options, _proxy) {
  options = options || {};
  if (!_data) load();
  const keys = Object.keys(preferences);
  for (let i = 0; i < keys.length; i++) {
    setPreference(keys[i], preferences[keys[i]], { persist: false });
  }
  if (options.persist !== false) {
    save();
  }
  return true;
}
function reset(_opts, _proxy) {
  _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
  _metrics.resets++;
  save();
  return true;
}
function clear(_proxy) {
  try {
    localStorage.removeItem(STORAGE_KEY);
    _data = null;
    return true;
  } catch (e) {
    _metrics.errors++;
    return false;
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
var core_default = {
  load,
  save,
  get,
  getPreference,
  setPreference,
  setPreferences,
  reset,
  clear,
  getMetrics
};
export {
  MODULE_ID,
  VERSION,
  clear,
  core_default as default,
  get,
  getMetrics,
  getPreference,
  load,
  reset,
  save,
  setPreference,
  setPreferences
};
