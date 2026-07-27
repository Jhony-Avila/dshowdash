import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE5";
const MODULE_ID = "panel-nav-admin.state.saved-views";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[SavedViews]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const STORAGE_KEY = "pna_saved_views";
const MAX_VIEWS = 10;
const MAX_NAME_LENGTH = 50;
function SavedViews(options = {}) {
  const onApply = options.onApply;
  let _views = [];
  _loadFromStorage();
  function _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _views = raw ? JSON.parse(raw) : [];
    } catch (e) {
      _log("error", "Failed to load saved views:", e.message);
      _views = [];
    }
  }
  function _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_views));
    } catch (e) {
      _log("error", "Failed to save views:", e.message);
    }
  }
  function create(name, config) {
    if (!name || typeof name !== "string") throw new Error("View name is required");
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
      throw new Error(`Name must be 1-${MAX_NAME_LENGTH} characters`);
    }
    if (_views.length >= MAX_VIEWS) {
      throw new Error(`Maximum of ${MAX_VIEWS} views reached`);
    }
    const view = {
      id: "view_" + Date.now(),
      name: trimmed,
      config: { ...config },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    _views.unshift(view);
    _saveToStorage();
    _log("info", "View created:", trimmed);
    return view;
  }
  function update(id, updates) {
    const view = _views.find((v) => v.id === id);
    if (!view) return null;
    if (updates.name !== void 0) {
      const trimmed = String(updates.name).trim();
      if (trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH) {
        view.name = trimmed;
      }
    }
    if (updates.config !== void 0) {
      view.config = { ...updates.config };
    }
    view.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    _saveToStorage();
    _log("info", "View updated:", view.name);
    return view;
  }
  function remove(id) {
    const idx = _views.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const removed = _views.splice(idx, 1)[0];
    _saveToStorage();
    _log("info", "View deleted:", removed.name);
    return true;
  }
  function apply(id) {
    const view = _views.find((v) => v.id === id);
    if (!view) return null;
    if (typeof onApply === "function") {
      onApply(view.config);
    }
    _log("info", "View applied:", view.name);
    return view.config;
  }
  function duplicate(id) {
    const view = _views.find((v) => v.id === id);
    if (!view) return null;
    const newName = (view.name + " (c\xF3pia)").substring(0, MAX_NAME_LENGTH);
    return create(newName, { ...view.config });
  }
  function getAll() {
    return [..._views];
  }
  function getById(id) {
    return _views.find((v) => v.id === id) || null;
  }
  function exportView(id) {
    const view = _views.find((v) => v.id === id);
    return view ? JSON.stringify(view, null, 2) : null;
  }
  function importView(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.name || !data.config) throw new Error("Invalid view format");
      return create(data.name, data.config);
    } catch (e) {
      _log("error", "Import failed:", e.message);
      return null;
    }
  }
  function clear() {
    _views = [];
    _saveToStorage();
    _log("info", "All views cleared");
  }
  function count() {
    return _views.length;
  }
  return {
    create,
    update,
    remove,
    apply,
    duplicate,
    getAll,
    getById,
    exportView,
    importView,
    clear,
    count
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, maxViews: MAX_VIEWS, storageKey: STORAGE_KEY };
}
function healthCheck() {
  let viewCount = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    viewCount = raw ? JSON.parse(raw).length : 0;
  } catch {
  }
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, viewCount };
}
var saved_views_default = { SavedViews, STORAGE_KEY, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  STORAGE_KEY,
  SavedViews,
  VERSION,
  saved_views_default as default,
  healthCheck,
  info,
  injectPorts
};
