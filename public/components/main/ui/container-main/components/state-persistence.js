import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-state-persistence";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.storageType !== void 0 && !["local", "session", "memory"].includes(options.storageType)) errors.push("storageType must be local|session|memory");
  if (options.storageKey !== void 0 && typeof options.storageKey !== "string") errors.push("storageKey must be a string");
  if (options.autoSave !== void 0 && typeof options.autoSave !== "boolean") errors.push("autoSave must be a boolean");
  if (options.autoSaveDelay !== void 0 && (typeof options.autoSaveDelay !== "number" || options.autoSaveDelay < 0)) errors.push("autoSaveDelay must be a positive number");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const STORAGE_TYPE = { LOCAL: "local", SESSION: "session", MEMORY: "memory" };
function createStatePersistence(container, options = {}) {
  _validateOptions(options);
  const { storageType = STORAGE_TYPE.LOCAL, storageKey, autoSave = true, autoSaveDelay = 500, persistedFields = ["position", "size", "minimized", "fullscreen", "tabs", "splitSizes"], onSave, onRestore, onError, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _storage = null;
  let _state = {};
  let _saveTimeout = null;
  let _isRestoring = false;
  let _eventUnsubscribers = [];
  let _memoryStore = {};
  function _getKey() {
    return storageKey || `dsd-container-${container.id}`;
  }
  function _getStorage() {
    if (storageType === STORAGE_TYPE.MEMORY) return { getItem: (k) => _memoryStore[k] || null, setItem: (k, v) => {
      _memoryStore[k] = v;
    }, removeItem: (k) => {
      delete _memoryStore[k];
    } };
    if (storageType === STORAGE_TYPE.SESSION) return typeof sessionStorage !== "undefined" ? sessionStorage : null;
    return typeof localStorage !== "undefined" ? localStorage : null;
  }
  function _collectState() {
    const state = { timestamp: Date.now(), containerId: container.id };
    if (persistedFields.includes("position")) {
      const rect = container.getBoundingClientRect();
      state.position = { x: rect.left, y: rect.top };
    }
    if (persistedFields.includes("size")) {
      state.size = { width: container.offsetWidth, height: container.offsetHeight };
    }
    if (persistedFields.includes("minimized")) {
      state.minimized = container.classList.contains("dsd-container--minimized");
    }
    if (persistedFields.includes("fullscreen")) {
      state.fullscreen = container.classList.contains("dsd-container--fullscreen");
    }
    if (persistedFields.includes("tabs")) {
      const tabManager = container._tabManagerComponent;
      if (tabManager) state.tabs = { activeTabId: tabManager.getActiveTab()?.id };
    }
    if (persistedFields.includes("splitSizes")) {
      const splitView = container._splitViewComponent;
      if (splitView) state.splitSizes = splitView.getSizes();
    }
    return state;
  }
  function _applyState(state) {
    if (!state) return false;
    _isRestoring = true;
    try {
      if (state.position && persistedFields.includes("position")) {
        const drag = container._dragComponent;
        if (drag) drag.setPosition(state.position.x, state.position.y);
      }
      if (state.size && persistedFields.includes("size")) {
        const resize = container._resizeComponent;
        if (resize) resize.setSize(state.size.width, state.size.height);
      }
      if (state.minimized !== void 0 && persistedFields.includes("minimized")) {
        const controls = container._controlsComponent;
        if (controls && state.minimized !== controls.isMinimized()) controls.minimize();
      }
      if (state.fullscreen !== void 0 && persistedFields.includes("fullscreen")) {
        const controls = container._controlsComponent;
        if (controls && state.fullscreen !== controls.isFullscreen()) controls.maximize();
      }
      if (state.tabs && persistedFields.includes("tabs")) {
        const tabManager = container._tabManagerComponent;
        if (tabManager && state.tabs?.activeTabId) tabManager.activateTab(state.tabs.activeTabId);
      }
      if (state.splitSizes && persistedFields.includes("splitSizes")) {
        const splitView = container._splitViewComponent;
        if (splitView) splitView.setSizes(state.splitSizes);
      }
      _state = state;
      onRestore?.(state);
      return true;
    } catch (e) {
      onError?.("apply_state_failed", e);
      return false;
    } finally {
      Promise.resolve().then(() => {
        _isRestoring = false;
      });
    }
  }
  function _scheduleSave() {
    if (!autoSave || _isRestoring) return;
    if (_saveTimeout) clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => persistence.save(), autoSaveDelay);
  }
  function _setupAutoSave() {
    if (!autoSave) return;
    const eb = _getEventBus();
    if (!eb?.on) return;
    const containerId = container.id;
    const filterByContainer = (data) => !containerId || !data.containerId || data.containerId === containerId;
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.RESIZE_END, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.DRAG_END, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.COLLAPSED, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.FULLSCREEN, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.TAB_CHANGED, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.TAB_CLOSED, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.SPLIT_RESIZE, (data) => {
      if (filterByContainer(data)) _scheduleSave();
    }));
  }
  function _removeAutoSave() {
    _eventUnsubscribers.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    _eventUnsubscribers = [];
  }
  const persistence = {
    init() {
      if (_initialized) return this;
      _storage = _getStorage();
      _setupAutoSave();
      _initialized = true;
      return this;
    },
    save() {
      if (!_storage || _isRestoring) return false;
      try {
        const state = _collectState();
        const json = JSON.stringify(state);
        _storage.setItem(_getKey(), json);
        _state = state;
        onSave?.(state);
        _emitEvent(MAIN_EVENTS.STATE_SAVE, { state, containerId: container.id });
        return true;
      } catch (e) {
        onError?.("save_failed", e);
        return false;
      }
    },
    restore() {
      if (!_storage) return false;
      try {
        const json = _storage.getItem(_getKey());
        if (!json) return false;
        const state = JSON.parse(json);
        const success = _applyState(state);
        if (success) _emitEvent(MAIN_EVENTS.STATE_RESTORE, { state, containerId: container.id });
        return success;
      } catch (e) {
        onError?.("restore_failed", e);
        return false;
      }
    },
    clear() {
      if (!_storage) return false;
      try {
        _storage.removeItem(_getKey());
        _state = {};
        return true;
      } catch (e) {
        onError?.("clear_failed", e);
        return false;
      }
    },
    getState() {
      return { ..._state };
    },
    setState(partialState) {
      _state = { ..._state, ...partialState };
      _scheduleSave();
      return this;
    },
    hasState() {
      return _storage ? _storage.getItem(_getKey()) !== null : false;
    },
    getTimestamp() {
      return _state.timestamp || null;
    },
    isInitialized() {
      return _initialized;
    },
    isRestoring() {
      return _isRestoring;
    },
    destroy() {
      _removeAutoSave();
      if (_saveTimeout) {
        clearTimeout(_saveTimeout);
        _saveTimeout = null;
      }
      _state = {};
      _initialized = false;
      _isRestoring = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, storageType, hasState: persistence.hasState(), timestamp: _state.timestamp, hasInjectedEventBus: !!_injectedEventBus, isRestoring: _isRestoring, listenersViaEventBus: _eventUnsubscribers.length, hasValidation: true };
    }
  };
  return persistence;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var state_persistence_default = { createStatePersistence, injectEventBus, info, healthCheck, VERSION, MODULE_ID, STORAGE_TYPE };
export {
  MODULE_ID,
  STORAGE_TYPE,
  VERSION,
  createStatePersistence,
  state_persistence_default as default,
  healthCheck,
  info,
  injectEventBus
};
