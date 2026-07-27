import { createLogger } from "../utils/logger.js";
const VERSION = "8.3.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-event-hooks";
const logger = createLogger(MODULE_ID);
function _validateOptions(options) {
  const errors = [];
  if (options.debugMode !== void 0 && typeof options.debugMode !== "boolean") errors.push("debugMode must be a boolean");
  if (options.maxListeners !== void 0 && (typeof options.maxListeners !== "number" || options.maxListeners < 1)) errors.push("maxListeners must be a positive number");
  if (options.onHookError !== void 0 && typeof options.onHookError !== "function") errors.push("onHookError must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const LIFECYCLE_HOOKS = {
  BEFORE_MOUNT: "beforeMount",
  MOUNTED: "mounted",
  BEFORE_UPDATE: "beforeUpdate",
  UPDATED: "updated",
  BEFORE_UNMOUNT: "beforeUnmount",
  UNMOUNTED: "unmounted",
  ERROR: "error",
  STATE_CHANGE: "stateChange",
  RESIZE: "resize",
  FOCUS: "focus",
  BLUR: "blur"
};
function createEventHooks(container, options = {}) {
  _validateOptions(options);
  const { debugMode = false, maxListeners = 100, onHookError } = options;
  let _initialized = false;
  let _hooks = /* @__PURE__ */ new Map();
  let _onceHooks = /* @__PURE__ */ new Map();
  let _wildcardListeners = [];
  let _resizeObserver = null;
  let _mutationObserver = null;
  let _boundFocusIn = null;
  let _boundFocusOut = null;
  function _log(...args) {
    if (debugMode) logger.debug(args[0], args[1]);
  }
  function _emit(hookName, data, isInternal = false) {
    const results = [];
    _wildcardListeners.forEach(({ callback, context }) => {
      try {
        results.push({ hook: "*", result: callback.call(context, hookName, data) });
      } catch (e) {
        onHookError?.(hookName, e);
      }
    });
    if (_hooks.has(hookName)) {
      _hooks.get(hookName).forEach(({ callback, context, priority }) => {
        try {
          results.push({ hook: hookName, priority, result: callback.call(context, data) });
        } catch (e) {
          onHookError?.(hookName, e);
        }
      });
    }
    if (_onceHooks.has(hookName)) {
      _onceHooks.get(hookName).forEach(({ callback, context }) => {
        try {
          results.push({ hook: hookName, once: true, result: callback.call(context, data) });
        } catch (e) {
          onHookError?.(hookName, e);
        }
      });
      _onceHooks.delete(hookName);
    }
    if (!isInternal) container.dispatchEvent(new CustomEvent(`hook:${hookName}`, { bubbles: true, detail: data }));
    _log(`Emitted "${hookName}"`, data, `(${results.length} listeners)`);
    return results;
  }
  const hooks = {
    init() {
      if (_initialized) return this;
      _resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) _emit(LIFECYCLE_HOOKS.RESIZE, { width: entry.contentRect.width, height: entry.contentRect.height }, true);
      });
      _resizeObserver.observe(container);
      _boundFocusIn = (e) => _emit(LIFECYCLE_HOOKS.FOCUS, { target: e.target }, true);
      _boundFocusOut = (e) => _emit(LIFECYCLE_HOOKS.BLUR, { target: e.target }, true);
      container.addEventListener("focusin", _boundFocusIn);
      container.addEventListener("focusout", _boundFocusOut);
      _mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") _emit(LIFECYCLE_HOOKS.UPDATED, { mutation }, true);
          if (mutation.type === "attributes") _emit(LIFECYCLE_HOOKS.STATE_CHANGE, { attribute: mutation.attributeName, oldValue: mutation.oldValue }, true);
        });
      });
      _mutationObserver.observe(container, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
      _initialized = true;
      _emit(LIFECYCLE_HOOKS.MOUNTED, { containerId: container.id });
      return this;
    },
    on(hookName, callback, context = null, priority = 100) {
      if (typeof callback !== "function") return this;
      if (hookName === "*") {
        _wildcardListeners.push({ callback, context });
        return this;
      }
      if (!_hooks.has(hookName)) _hooks.set(hookName, []);
      const listeners = _hooks.get(hookName);
      if (listeners.length >= maxListeners) {
        logger.warn(`Max listeners (${maxListeners}) reached for hook "${hookName}"`);
        return this;
      }
      listeners.push({ callback, context, priority });
      listeners.sort((a, b) => a.priority - b.priority);
      return this;
    },
    once(hookName, callback, context = null) {
      if (typeof callback !== "function") return this;
      if (!_onceHooks.has(hookName)) _onceHooks.set(hookName, []);
      _onceHooks.get(hookName).push({ callback, context });
      return this;
    },
    off(hookName, callback) {
      if (hookName === "*") {
        _wildcardListeners = _wildcardListeners.filter((l) => l.callback !== callback);
        return this;
      }
      if (_hooks.has(hookName)) {
        _hooks.set(hookName, _hooks.get(hookName).filter((l) => l.callback !== callback));
      }
      if (_onceHooks.has(hookName)) {
        _onceHooks.set(hookName, _onceHooks.get(hookName).filter((l) => l.callback !== callback));
      }
      return this;
    },
    emit(hookName, data) {
      return _emit(hookName, data, false);
    },
    clear(hookName) {
      if (hookName) {
        _hooks.delete(hookName);
        _onceHooks.delete(hookName);
      } else {
        _hooks.clear();
        _onceHooks.clear();
        _wildcardListeners = [];
      }
      return this;
    },
    getListeners(hookName) {
      if (hookName === "*") return [..._wildcardListeners];
      return [..._hooks.get(hookName) || [], ..._onceHooks.get(hookName) || []];
    },
    hasListeners(hookName) {
      return this.getListeners(hookName).length > 0;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _emit(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { containerId: container.id });
      _resizeObserver?.disconnect();
      _resizeObserver = null;
      _mutationObserver?.disconnect();
      _mutationObserver = null;
      if (_boundFocusIn) container.removeEventListener("focusin", _boundFocusIn);
      if (_boundFocusOut) container.removeEventListener("focusout", _boundFocusOut);
      _boundFocusIn = null;
      _boundFocusOut = null;
      _hooks.clear();
      _onceHooks.clear();
      _wildcardListeners = [];
      _initialized = false;
      _emit(LIFECYCLE_HOOKS.UNMOUNTED, { containerId: container.id });
    },
    healthCheck() {
      const totalListeners = Array.from(_hooks.values()).reduce((sum, arr) => sum + arr.length, 0) + Array.from(_onceHooks.values()).reduce((sum, arr) => sum + arr.length, 0) + _wildcardListeners.length;
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, hookCount: _hooks.size, totalListeners, maxListeners, domOnly: true, hasValidation: true };
    }
  };
  return hooks;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, domOnly: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, domOnly: true, hasValidation: true };
}
var event_hooks_default = { createEventHooks, info, healthCheck, VERSION, MODULE_ID, LIFECYCLE_HOOKS };
export {
  LIFECYCLE_HOOKS,
  MODULE_ID,
  VERSION,
  createEventHooks,
  event_hooks_default as default,
  healthCheck,
  info
};
