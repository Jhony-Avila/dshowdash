import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.collaboration.activity-log";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[ActivityLog]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const ACTION_TYPES = Object.freeze({
  ITEM_CREATED: "item_created",
  ITEM_UPDATED: "item_updated",
  ITEM_DELETED: "item_deleted",
  ITEM_REORDERED: "item_reordered",
  ITEM_DUPLICATED: "item_duplicated",
  ITEM_TOGGLED: "item_toggled",
  SECTION_CREATED: "section_created",
  SECTION_UPDATED: "section_updated",
  SECTION_DELETED: "section_deleted",
  BULK_UPDATE: "bulk_update",
  BULK_DELETE: "bulk_delete",
  IMPORT: "import",
  EXPORT: "export",
  SETTINGS_CHANGED: "settings_changed",
  VIEW_CHANGED: "view_changed"
});
function ActivityLog(options = {}) {
  const {
    maxEntries = 500,
    persistToStorage = true,
    storageKey = "pna_activity_log"
  } = options;
  let _entries = [];
  let _listeners = [];
  if (persistToStorage) {
    try {
      const stored = localStorage.getItem(String(storageKey));
      if (stored) _entries = JSON.parse(stored);
    } catch {
    }
  }
  function _getActor() {
    const auth = Ports.get("auth");
    if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
      return { id: null, name: "anonymous" };
    }
    const user = auth.getUser ? auth.getUser() : null;
    return {
      id: user?.id || null,
      name: user?.name || user?.username || "admin"
    };
  }
  function log(action, details = {}) {
    if (!isEnabled("activityLog")) return;
    const entry = {
      id: _generateId(),
      action,
      actor: _getActor(),
      timestamp: Date.now(),
      ...details
    };
    _entries.push(entry);
    if (_entries.length > Number(maxEntries)) {
      _entries.splice(0, _entries.length - Number(maxEntries));
    }
    if (persistToStorage) {
      try {
        localStorage.setItem(String(storageKey), JSON.stringify(_entries));
      } catch {
      }
    }
    for (const listener of _listeners) {
      try {
        listener(entry);
      } catch {
      }
    }
    _log("debug", `Activity: ${action}`, details.itemLabel || details.itemId || "");
  }
  function getAll() {
    return [..._entries];
  }
  function getRecent(limit = 20) {
    return _entries.slice(-limit).reverse();
  }
  function query(filter = {}) {
    let result = _entries;
    if (filter.action) {
      result = result.filter((e) => e.action === filter.action);
    }
    if (filter.itemId) {
      result = result.filter((e) => e.itemId === filter.itemId);
    }
    if (filter.actorId) {
      result = result.filter((e) => e.actor?.id === filter.actorId);
    }
    if (filter.since) {
      result = result.filter((e) => e.timestamp >= filter.since);
    }
    if (filter.until) {
      result = result.filter((e) => e.timestamp <= filter.until);
    }
    return result;
  }
  function getSummary() {
    const counts = {};
    for (const entry of _entries) {
      const action = String(entry.action);
      counts[action] = (counts[action] || 0) + 1;
    }
    return counts;
  }
  function subscribe(listener) {
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }
  function clear() {
    _entries = [];
    if (persistToStorage) {
      try {
        localStorage.removeItem(String(storageKey));
      } catch {
      }
    }
    _log("info", "Activity log cleared");
  }
  function _generateId() {
    return `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  return {
    log,
    getAll,
    getRecent,
    query,
    getSummary,
    subscribe,
    clear,
    ACTION_TYPES
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, actionTypes: Object.keys(ACTION_TYPES).length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var activity_log_default = { ActivityLog, ACTION_TYPES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  ACTION_TYPES,
  ActivityLog,
  MODULE_ID,
  VERSION,
  activity_log_default as default,
  healthCheck,
  info,
  injectPorts
};
