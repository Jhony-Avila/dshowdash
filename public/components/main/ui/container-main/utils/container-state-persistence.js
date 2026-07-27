import { getStorageManager, STORAGE_TYPES } from "./storage-manager.js";
import { createLogger } from "./logger.js";
const VERSION = "1.0.0";
const MODULE_ID = "container-main:state-persistence";
const STORAGE_KEYS = Object.freeze({
  CONTAINER_STATE: "container_state",
  LAYOUT_PREFS: "layout_preferences",
  PANEL_HISTORY: "panel_history",
  USER_SETTINGS: "user_settings"
});
const DEFAULT_STATE = Object.freeze({
  collapsed: false,
  fullscreen: false,
  width: null,
  height: null,
  position: { x: null, y: null },
  zoomLevel: 100,
  splitView: null,
  lastPanel: null,
  panelHistory: [],
  customSettings: {}
});
function createContainerStatePersistence(options = {}) {
  const {
    containerId = "container-main",
    autoSave = true,
    debounceMs = 500,
    maxHistorySize = 20,
    storageType = STORAGE_TYPES.LOCAL
  } = options;
  const _logger = createLogger(MODULE_ID);
  const _storage = getStorageManager({ prefix: "dsd_" });
  const _namespace = _storage.namespace(`container:${containerId}`);
  let _state = { ...DEFAULT_STATE };
  let _initialized = false;
  let _saveTimeout = null;
  let _listeners = /* @__PURE__ */ new Set();
  function _debouncedSave() {
    if (_saveTimeout) clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => _save(), Number(debounceMs));
  }
  async function _save() {
    try {
      await _namespace.set(STORAGE_KEYS.CONTAINER_STATE, _state, { storage: storageType });
      _notifyListeners("saved", _state);
      _logger.debug("State saved:", _state);
    } catch (error) {
      _logger.error("Failed to save state:", error);
    }
  }
  function _notifyListeners(event, data) {
    _listeners.forEach((listener) => {
      try {
        listener({ event, data, timestamp: Date.now() });
      } catch (e) {
        _logger.warn("Listener error:", e);
      }
    });
  }
  const persistence = {
    // Inicializa e restaura estado
    async init() {
      if (_initialized) return _state;
      try {
        const saved = await _namespace.get(STORAGE_KEYS.CONTAINER_STATE, {
          storage: storageType,
          defaultValue: null
        });
        if (saved) {
          _state = { ...DEFAULT_STATE, ...saved };
          _logger.debug("State restored:", _state);
          _notifyListeners("restored", _state);
        } else {
          _state = { ...DEFAULT_STATE };
          _logger.debug("No saved state, using defaults", {});
        }
        _initialized = true;
        return _state;
      } catch (error) {
        _logger.error("Failed to restore state:", error);
        _state = { ...DEFAULT_STATE };
        _initialized = true;
        return _state;
      }
    },
    // Getters
    getState() {
      return { ..._state };
    },
    get(key) {
      return _state[key];
    },
    isCollapsed() {
      return _state.collapsed;
    },
    isFullscreen() {
      return _state.fullscreen;
    },
    getZoomLevel() {
      return _state.zoomLevel;
    },
    getLastPanel() {
      return _state.lastPanel;
    },
    getPanelHistory() {
      return [..._state.panelHistory];
    },
    getSplitView() {
      return _state.splitView ? { ..._state.splitView } : null;
    },
    // Setters
    set(key, value) {
      if (_state[key] !== value) {
        _state[key] = value;
        _notifyListeners("changed", { key, value });
        if (autoSave) _debouncedSave();
      }
      return this;
    },
    setCollapsed(collapsed) {
      return this.set("collapsed", Boolean(collapsed));
    },
    setFullscreen(fullscreen) {
      return this.set("fullscreen", Boolean(fullscreen));
    },
    setZoomLevel(level) {
      const clamped = Math.max(50, Math.min(200, level));
      return this.set("zoomLevel", clamped);
    },
    setSize(width, height) {
      _state.width = width;
      _state.height = height;
      _notifyListeners("changed", { key: "size", value: { width, height } });
      if (autoSave) _debouncedSave();
      return this;
    },
    setPosition(x, y) {
      _state.position = { x, y };
      _notifyListeners("changed", { key: "position", value: { x, y } });
      if (autoSave) _debouncedSave();
      return this;
    },
    setSplitView(config) {
      _state.splitView = config;
      _notifyListeners("changed", { key: "splitView", value: config });
      if (autoSave) _debouncedSave();
      return this;
    },
    // Panel navigation history
    recordPanelVisit(panelId, metadata = {}) {
      if (!panelId) return this;
      _state.lastPanel = panelId;
      _state.panelHistory = _state.panelHistory.filter((p) => p.panelId !== panelId);
      _state.panelHistory.unshift({
        panelId,
        timestamp: Date.now(),
        ...metadata
      });
      if (_state.panelHistory.length > Number(maxHistorySize)) {
        _state.panelHistory = _state.panelHistory.slice(0, Number(maxHistorySize));
      }
      _notifyListeners("panelVisited", { panelId, history: _state.panelHistory });
      if (autoSave) _debouncedSave();
      return this;
    },
    clearPanelHistory() {
      _state.panelHistory = [];
      _state.lastPanel = null;
      if (autoSave) _debouncedSave();
      return this;
    },
    // Custom settings
    setCustomSetting(key, value) {
      _state.customSettings[key] = value;
      _notifyListeners("customSettingChanged", { key, value });
      if (autoSave) _debouncedSave();
      return this;
    },
    getCustomSetting(key, defaultValue = null) {
      return _state.customSettings[key] ?? defaultValue;
    },
    // Bulk operations
    async setState(newState) {
      _state = { ...DEFAULT_STATE, ..._state, ...newState };
      _notifyListeners("stateUpdated", _state);
      if (autoSave) await _save();
      return this;
    },
    async merge(partialState) {
      Object.assign(_state, partialState);
      _notifyListeners("stateMerged", partialState);
      if (autoSave) await _save();
      return this;
    },
    // Save/Reset
    async save() {
      if (_saveTimeout) clearTimeout(_saveTimeout);
      await _save();
      return this;
    },
    async reset() {
      _state = { ...DEFAULT_STATE };
      await _save();
      _notifyListeners("reset", _state);
      return this;
    },
    async clear() {
      await _namespace.clear({ storage: storageType });
      _state = { ...DEFAULT_STATE };
      _notifyListeners("cleared", null);
      return this;
    },
    // Event listeners
    subscribe(listener) {
      if (typeof listener === "function") {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {
      };
    },
    unsubscribe(listener) {
      _listeners.delete(listener);
    },
    // Apply state to DOM element
    applyToElement(element) {
      if (!element) return;
      element.classList.toggle("dsd-container--collapsed", _state.collapsed);
      element.setAttribute("data-collapsed", String(_state.collapsed));
      element.classList.toggle("dsd-container--fullscreen", _state.fullscreen);
      element.setAttribute("data-fullscreen", String(_state.fullscreen));
      if (_state.zoomLevel !== 100) {
        element.style.setProperty("--cm-zoom-level", _state.zoomLevel / 100);
      }
      if (_state.width) element.style.width = typeof _state.width === "number" ? `${_state.width}px` : _state.width;
      if (_state.height) element.style.height = typeof _state.height === "number" ? `${_state.height}px` : _state.height;
      _logger.debug("State applied to element", {});
    },
    // Capture state from DOM element
    captureFromElement(element) {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      this.merge({
        collapsed: element.classList.contains("dsd-container--collapsed"),
        fullscreen: element.classList.contains("dsd-container--fullscreen"),
        width: rect.width,
        height: rect.height,
        position: { x: rect.left, y: rect.top }
      });
      _logger.debug("State captured from element", {});
    },
    // Utilities
    isInitialized() {
      return _initialized;
    },
    hasChanges() {
      return JSON.stringify(_state) !== JSON.stringify(DEFAULT_STATE);
    },
    // Health check
    healthCheck() {
      return {
        status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID,
        containerId,
        initialized: _initialized,
        hasChanges: this.hasChanges(),
        historySize: _state.panelHistory.length,
        listenersCount: _listeners.size
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        containerId,
        autoSave,
        debounceMs,
        maxHistorySize,
        storageType,
        keys: Object.keys(STORAGE_KEYS)
      };
    },
    // Destroy
    destroy() {
      if (_saveTimeout) clearTimeout(_saveTimeout);
      _listeners.clear();
      _initialized = false;
    }
  };
  return persistence;
}
const _instances = /* @__PURE__ */ new Map();
function getContainerStatePersistence(containerId = "container-main", options = {}) {
  if (!_instances.has(containerId)) {
    _instances.set(containerId, createContainerStatePersistence({ ...options, containerId }));
  }
  return _instances.get(containerId);
}
function resetContainerStatePersistence(containerId = "container-main") {
  const instance = _instances.get(containerId);
  if (instance) {
    instance.destroy();
    _instances.delete(containerId);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, instances: _instances.size };
}
function healthCheck() {
  const results = {};
  for (const [id, instance] of _instances) {
    results[id] = instance.healthCheck();
  }
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, instances: results };
}
var container_state_persistence_default = {
  VERSION,
  MODULE_ID,
  STORAGE_KEYS,
  createContainerStatePersistence,
  getContainerStatePersistence,
  resetContainerStatePersistence,
  info,
  healthCheck
};
export {
  MODULE_ID,
  STORAGE_KEYS,
  VERSION,
  createContainerStatePersistence,
  container_state_persistence_default as default,
  getContainerStatePersistence,
  healthCheck,
  info,
  resetContainerStatePersistence
};
