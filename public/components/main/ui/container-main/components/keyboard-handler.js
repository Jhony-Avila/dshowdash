import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-keyboard-handler";
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
  if (options.shortcuts !== void 0 && typeof options.shortcuts !== "object") errors.push("shortcuts must be an object");
  if (options.enabled !== void 0 && typeof options.enabled !== "boolean") errors.push("enabled must be a boolean");
  if (options.preventDefaults !== void 0 && typeof options.preventDefaults !== "boolean") errors.push("preventDefaults must be a boolean");
  if (options.onAction !== void 0 && typeof options.onAction !== "function") errors.push("onAction must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const DEFAULT_SHORTCUTS = {
  "Escape": "escape",
  "F5": "refresh",
  "F11": "fullscreen",
  "Ctrl+M": "minimize",
  "Ctrl+Shift+M": "maximize",
  "Ctrl+W": "close",
  "Ctrl+R": "refresh",
  "Alt+Enter": "fullscreen"
};
function createKeyboardHandler(container, options = {}) {
  _validateOptions(options);
  const { shortcuts = DEFAULT_SHORTCUTS, onAction, enabled = true, preventDefaults = true, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _enabled = enabled;
  let _boundHandler = null;
  let _shortcuts = { ...shortcuts };
  function _normalizeKey(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    let key = e.key;
    if (key === " ") key = "Space";
    if (key.length === 1) key = key.toUpperCase();
    parts.push(key);
    return parts.join("+");
  }
  function _handleKeydown(e) {
    if (!_enabled) return;
    const target = e.target;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    const combo = _normalizeKey(e);
    const action = _shortcuts[combo];
    if (action) {
      if (preventDefaults) {
        e.preventDefault();
        e.stopPropagation();
      }
      onAction?.(action, e);
      _emitEvent(CONTAINER_EVENTS.KEYBOARD_ACTION, { action, combo, containerId: container.id });
    }
  }
  const keyboard = {
    init() {
      if (_initialized) return this;
      _boundHandler = _handleKeydown.bind(this);
      if (_enabled) {
        container.addEventListener("keydown", _boundHandler);
        document.addEventListener("keydown", _boundHandler);
      }
      container.setAttribute("data-keyboard-enabled", String(_enabled));
      _initialized = true;
      return this;
    },
    enable() {
      _enabled = true;
      container.setAttribute("data-keyboard-enabled", "true");
      if (_initialized && _boundHandler) {
        container.addEventListener("keydown", _boundHandler);
        document.addEventListener("keydown", _boundHandler);
      }
      return this;
    },
    disable() {
      _enabled = false;
      container.setAttribute("data-keyboard-enabled", "false");
      if (_boundHandler) {
        container.removeEventListener("keydown", _boundHandler);
        document.removeEventListener("keydown", _boundHandler);
      }
      return this;
    },
    isEnabled() {
      return _enabled;
    },
    isInitialized() {
      return _initialized;
    },
    addShortcut(combo, action) {
      if (typeof combo !== "string" || !action) return this;
      _shortcuts[combo] = action;
      return this;
    },
    removeShortcut(combo) {
      delete _shortcuts[combo];
      return this;
    },
    getShortcuts() {
      return { ..._shortcuts };
    },
    destroy() {
      this.disable();
      container.removeAttribute("data-keyboard-enabled");
      _boundHandler = null;
      _shortcuts = {};
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcutCount: Object.keys(_shortcuts).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return keyboard;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var keyboard_handler_default = { createKeyboardHandler, injectEventBus, info, healthCheck, VERSION, MODULE_ID, DEFAULT_SHORTCUTS };
export {
  DEFAULT_SHORTCUTS,
  MODULE_ID,
  VERSION,
  createKeyboardHandler,
  keyboard_handler_default as default,
  healthCheck,
  info,
  injectEventBus
};
