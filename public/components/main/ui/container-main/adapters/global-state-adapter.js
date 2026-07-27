import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from "/core/policies/globalstate-access-policy.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.5.0-FASE-B";
const MODULE_ID = "container-main:global-state-adapter";
let _globalState = null;
let _eventBus = null;
let _subscriptions = /* @__PURE__ */ new Map();
let _localCache = /* @__PURE__ */ new Map();
let _initialized = false;
let _syncEnabled = true;
let _resolutionMethod = "none";
let _metrics = { getCount: 0, setCount: 0, subscribeCount: 0, syncCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0, lastSyncAt: null };
const STATE_MAPPINGS = Object.freeze({
  "container:activePanel": "ui.container.activePanel",
  "container:layout": "ui.container.layout",
  "container:fullscreen": "ui.container.fullscreen",
  "container:theme": "ui.theme",
  "kernel:state": "ui.container.kernelState"
});
const REVERSE_MAPPINGS = Object.freeze({
  "user": "context:user",
  "session": "context:session",
  "auth.isAuthenticated": "context:authenticated",
  "config": "context:config",
  "ui.theme": "container:theme",
  "ui.locale": "context:locale"
});
function _recordAccess(type, key) {
  try {
    const source = _resolutionMethod === "Core.windowAdapter" ? ACCESS_SOURCES.CORE_WINDOW_ADAPTER : _resolutionMethod.startsWith("window.") ? ACCESS_SOURCES.WINDOW_DIRECT : ACCESS_SOURCES.ADAPTER_AUTHORIZED;
    recordAccess({
      type,
      source,
      key,
      caller: MODULE_ID,
      moduleId: MODULE_ID
    });
  } catch (e) {
  }
}
function _detectGlobalState() {
  if (typeof window === "undefined") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const gs = window.Core.windowAdapter.get("GlobalState");
    if (gs) {
      _resolutionMethod = "Core.windowAdapter";
      return gs;
    }
  }
  _resolutionMethod = "none";
  return null;
}
function _getNestedValue(obj, path) {
  if (!obj || !path) return void 0;
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value === null || value === void 0) return void 0;
    value = value[key];
  }
  return value;
}
function _emit(event, data) {
  if (_eventBus && typeof _eventBus.emit === "function") {
    _eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
function injectEventBus(eventBus) {
  _eventBus = eventBus;
}
function init(options = {}) {
  if (_initialized) return { ok: true, cached: true };
  const { eventBus, syncOnInit = true } = options;
  if (eventBus) _eventBus = eventBus;
  _globalState = _detectGlobalState();
  if (_globalState) {
    if (syncOnInit) _syncFromGlobalState();
    _initialized = true;
    _emit("globalstate:connected", { available: true, resolutionMethod: _resolutionMethod });
    return { ok: true, available: true, resolutionMethod: _resolutionMethod };
  }
  _initialized = true;
  _emit("globalstate:unavailable", {});
  return { ok: true, available: false };
}
function isAvailable() {
  return !!_globalState;
}
function isInitialized() {
  return _initialized;
}
function getResolutionMethod() {
  return _resolutionMethod;
}
function get(key, defaultValue = void 0) {
  _metrics.getCount++;
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.GET, key);
  if (_globalState) {
    try {
      let value = null;
      const globalKey = STATE_MAPPINGS[key] || key;
      if (typeof _globalState.get === "function") {
        value = _globalState.get(globalKey);
      } else if (typeof _globalState.getState === "function") {
        value = _getNestedValue(_globalState.getState(), globalKey);
      }
      if (value !== void 0 && value !== null) {
        _metrics.cacheHits++;
        _localCache.set(key, value);
        return value;
      }
    } catch (e) {
      _metrics.errors++;
    }
  }
  _metrics.cacheMisses++;
  return _localCache.has(key) ? _localCache.get(key) : defaultValue;
}
function set(key, value, options = {}) {
  _metrics.setCount++;
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.SET, key);
  const { syncToGlobal = true, silent = false } = options;
  const oldValue = _localCache.get(key);
  _localCache.set(key, value);
  if (!silent && oldValue !== value) _emit("localstate:changed", { key, value, oldValue });
  if (syncToGlobal && _syncEnabled && _globalState) {
    try {
      const globalKey = STATE_MAPPINGS[key] || key;
      if (typeof _globalState.set === "function") {
        _globalState.set(globalKey, value);
        _metrics.syncCount++;
        return true;
      }
      if (typeof _globalState.dispatch === "function") {
        _globalState.dispatch({ type: "CONTAINER_STATE_UPDATE", payload: { key: globalKey, value } });
        _metrics.syncCount++;
        return true;
      }
    } catch (e) {
      _metrics.errors++;
    }
  }
  return false;
}
function subscribe(key, callback, options = {}) {
  _metrics.subscribeCount++;
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.SUBSCRIBE, key);
  const { immediate = false } = options;
  const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const sub = { id: subId, key, callback, globalUnsubscribe: null };
  if (_globalState && typeof _globalState.subscribe === "function") {
    try {
      const globalKey = STATE_MAPPINGS[key] || key;
      sub.globalUnsubscribe = _globalState.subscribe((state) => {
        const value = _getNestedValue(state, globalKey);
        const oldValue = _localCache.get(key);
        if (value !== oldValue) {
          _localCache.set(key, value);
          callback(value, oldValue, key);
        }
      });
    } catch (e) {
      _metrics.errors++;
    }
  }
  _subscriptions.set(subId, sub);
  if (immediate) {
    const v = get(key);
    if (v !== void 0) callback(v, void 0, key);
  }
  return () => {
    const s = _subscriptions.get(subId);
    if (s) {
      s.globalUnsubscribe?.();
      _subscriptions.delete(subId);
    }
  };
}
function _syncFromGlobalState() {
  if (!_globalState) return { synced: 0 };
  let synced = 0;
  for (const [globalKey, containerKey] of Object.entries(REVERSE_MAPPINGS)) {
    try {
      let value = typeof _globalState.get === "function" ? _globalState.get(globalKey) : typeof _globalState.getState === "function" ? _getNestedValue(_globalState.getState(), globalKey) : null;
      if (value !== void 0 && value !== null) {
        _localCache.set(containerKey, value);
        synced++;
      }
    } catch (e) {
    }
  }
  _metrics.lastSyncAt = Date.now();
  return { synced };
}
const selectors = {
  getUser: () => get("context:user"),
  getSession: () => get("context:session"),
  isAuthenticated: () => get("context:authenticated", false),
  getTheme: () => get("container:theme", "light"),
  getActivePanel: () => get("container:activePanel"),
  getUserId: () => get("context:user")?.id || null,
  getUserLevel: () => get("context:user")?.level || 0
};
function getMany(keys) {
  const r = {};
  for (const k of keys) r[k] = get(k);
  return r;
}
function setMany(values, opts = {}) {
  let s = 0;
  for (const [k, v] of Object.entries(values)) if (set(k, v, opts)) s++;
  return { success: s, total: Object.keys(values).length };
}
function setSyncEnabled(enabled) {
  _syncEnabled = enabled;
}
function cleanup() {
  _subscriptions.forEach((s) => s.globalUnsubscribe?.());
  _subscriptions.clear();
}
function reset() {
  cleanup();
  _localCache.clear();
  _initialized = false;
  _globalState = null;
  _syncEnabled = true;
  _resolutionMethod = "none";
}
function getMetrics() {
  return { ..._metrics, subscriptionCount: _subscriptions.size, cacheSize: _localCache.size, globalStateAvailable: !!_globalState, resolutionMethod: _resolutionMethod };
}
function resetMetrics() {
  _metrics = { getCount: 0, setCount: 0, subscribeCount: 0, syncCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0, lastSyncAt: null };
}
function healthCheck() {
  const hitRate = _metrics.cacheHits + _metrics.cacheMisses > 0 ? _metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) : 0;
  const strictMode = isStrict();
  const checks = {
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    usingCoreWindowAdapter: _resolutionMethod === "Core.windowAdapter",
    strictModeCompliant: !strictMode || _resolutionMethod === "Core.windowAdapter" || _resolutionMethod === "none",
    syncEnabled: _syncEnabled,
    goodCacheHitRate: hitRate >= 0.5 || _metrics.cacheHits + _metrics.cacheMisses < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return {
    status: passed < 2 ? "UNHEALTHY" : passed < maxScore - 1 ? "DEGRADED" : "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    score: `${passed}/${maxScore}`,
    resolutionMethod: _resolutionMethod,
    strictMode,
    checks,
    metrics: getMetrics()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod,
    subscriptionCount: _subscriptions.size,
    cacheSize: _localCache.size,
    selectors: Object.keys(selectors)
  };
}
var global_state_adapter_default = {
  VERSION,
  MODULE_ID,
  init,
  isAvailable,
  isInitialized,
  getResolutionMethod,
  injectEventBus,
  get,
  set,
  subscribe,
  getMany,
  setMany,
  selectors,
  setSyncEnabled,
  cleanup,
  reset,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  global_state_adapter_default as default,
  get,
  getMany,
  getMetrics,
  getResolutionMethod,
  healthCheck,
  info,
  init,
  injectEventBus,
  isAvailable,
  isInitialized,
  reset,
  resetMetrics,
  selectors,
  set,
  setMany,
  setSyncEnabled,
  subscribe
};
