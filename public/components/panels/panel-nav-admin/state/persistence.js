import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE5";
const MODULE_ID = "panel-nav-admin.state.persistence";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[StatePersistence]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const STORAGE_PREFIX = "pna_";
const PERSISTED_KEYS = [
  "filters",
  "sort",
  "density",
  "activeTab",
  "lastSearch",
  "pageSize",
  "viewMode",
  "splitSize",
  "expandedSections",
  "columnWidths"
];
function StatePersistence(options = {}) {
  const _prefix = String(options.prefix || STORAGE_PREFIX);
  function _key(key) {
    return _prefix + key;
  }
  function get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(_key(key));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      _log("error", "Failed to get", key, e.message);
      return defaultValue;
    }
  }
  function set(key, value) {
    try {
      localStorage.setItem(_key(key), JSON.stringify(value));
    } catch (e) {
      _log("error", "Failed to set", key, e.message);
    }
  }
  function remove(key) {
    try {
      localStorage.removeItem(_key(key));
    } catch (e) {
      _log("error", "Failed to remove", key, e.message);
    }
  }
  function clear() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(_prefix)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      _log("info", "Cleared", keys.length, "keys");
    } catch (e) {
      _log("error", "Failed to clear:", e.message);
    }
  }
  function getFilters() {
    return get("filters", {});
  }
  function setFilters(filters) {
    set("filters", filters);
  }
  function getSort() {
    return get("sort", { field: "order", direction: "asc" });
  }
  function setSort(sort) {
    set("sort", sort);
  }
  function getDensity() {
    return get("density", "normal");
  }
  function setDensity(density) {
    set("density", density);
  }
  function getActiveTab() {
    return get("activeTab", "items");
  }
  function setActiveTab(tab) {
    set("activeTab", tab);
  }
  function getLastSearch() {
    return get("lastSearch", "");
  }
  function setLastSearch(query) {
    set("lastSearch", query);
  }
  function getPageSize() {
    return get("pageSize", 50);
  }
  function setPageSize(size) {
    set("pageSize", size);
  }
  function getViewMode() {
    return get("viewMode", "table");
  }
  function setViewMode(mode) {
    set("viewMode", mode);
  }
  function getSplitSize() {
    return get("splitSize", 50);
  }
  function setSplitSize(percent) {
    set("splitSize", percent);
  }
  function getExpandedSections() {
    return get("expandedSections", []);
  }
  function setExpandedSections(sections) {
    set("expandedSections", sections);
  }
  function getColumnWidths() {
    return get("columnWidths", {});
  }
  function setColumnWidths(widths) {
    set("columnWidths", widths);
  }
  function saveState(state) {
    for (const key of PERSISTED_KEYS) {
      if (state[key] !== void 0) {
        set(key, state[key]);
      }
    }
    _log("debug", "State saved");
  }
  function restoreState() {
    const state = {};
    for (const key of PERSISTED_KEYS) {
      const val = get(key);
      if (val !== null) state[key] = val;
    }
    _log("debug", "State restored");
    return state;
  }
  return {
    get,
    set,
    remove,
    clear,
    getFilters,
    setFilters,
    getSort,
    setSort,
    getDensity,
    setDensity,
    getActiveTab,
    setActiveTab,
    getLastSearch,
    setLastSearch,
    getPageSize,
    setPageSize,
    getViewMode,
    setViewMode,
    getSplitSize,
    setSplitSize,
    getExpandedSections,
    setExpandedSections,
    getColumnWidths,
    setColumnWidths,
    saveState,
    restoreState
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, prefix: STORAGE_PREFIX, persistedKeys: PERSISTED_KEYS };
}
function healthCheck() {
  let storageAvailable = false;
  try {
    localStorage.setItem("_pna_test", "1");
    localStorage.removeItem("_pna_test");
    storageAvailable = true;
  } catch {
  }
  return { status: storageAvailable ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, storageAvailable };
}
var persistence_default = { StatePersistence, STORAGE_PREFIX, PERSISTED_KEYS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PERSISTED_KEYS,
  STORAGE_PREFIX,
  StatePersistence,
  VERSION,
  persistence_default as default,
  healthCheck,
  info,
  injectPorts
};
