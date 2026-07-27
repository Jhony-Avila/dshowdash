import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "4.4.0-P17WI";
const MODULE_ID = "context-store";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const INTERNAL_USE_ONLY = true;
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...restArgs) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = restArgs;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (_debug() && logger.debug) logger.debug(...[prefix].concat(args));
};
function getVersion() {
  return VERSION;
}
const store = /* @__PURE__ */ new Map();
const storeListeners = /* @__PURE__ */ new Set();
let _metrics = { setCount: 0, getCount: 0, deleteCount: 0, clearCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, listenerNotifyCount: 0, listenerErrorCount: 0, lastSetAt: null, lastGetAt: null, lastClearAt: null };
function _trackEvent(eventName, data) {
  if (!data) data = {};
  try {
    const t = _getPort("telemetry");
    if (t && t.track) {
      t.track(eventName, Object.assign({ component: MODULE_ID }, data));
    }
  } catch (e) {
  }
}
const contextStore = {
  set(key, value) {
    try {
      const oldValue = store.get(key);
      store.set(key, value);
      _metrics.setCount++;
      _metrics.lastSetAt = Date.now();
      this._notifyListeners("set", key, value, oldValue);
      _log("info", "Set:", key);
      return true;
    } catch (error) {
      _log("error", "set error:", error.message);
      return false;
    }
  },
  get(key) {
    try {
      _metrics.getCount++;
      _metrics.lastGetAt = Date.now();
      return store.get(key);
    } catch (error) {
      _log("error", "get error:", error.message);
      return void 0;
    }
  },
  has(key) {
    return store.has(key);
  },
  delete(key) {
    try {
      const existed = store.has(key);
      if (existed) {
        const oldValue = store.get(key);
        store.delete(key);
        _metrics.deleteCount++;
        this._notifyListeners("delete", key, void 0, oldValue);
        _log("info", "Deleted:", key);
      }
      return existed;
    } catch (error) {
      _log("error", "delete error:", error.message);
      return false;
    }
  },
  clear() {
    try {
      const previousSize = store.size;
      store.clear();
      _metrics.clearCount++;
      _metrics.lastClearAt = Date.now();
      this._notifyListeners("clear", null, null, null);
      _log("info", "Store cleared");
      _trackEvent("context:store:cleared", { previousSize, clearCount: _metrics.clearCount });
    } catch (error) {
      _log("error", "clear error:", error.message);
    }
  },
  keys() {
    try {
      return Array.from(store.keys());
    } catch (error) {
      return [];
    }
  },
  values() {
    try {
      return Array.from(store.values());
    } catch (error) {
      return [];
    }
  },
  entries() {
    try {
      return Array.from(store.entries());
    } catch (error) {
      return [];
    }
  },
  size() {
    return store.size;
  },
  toObject() {
    try {
      const obj = {};
      store.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    } catch (error) {
      _log("error", "toObject error:", error.message);
      return {};
    }
  },
  subscribe(listener) {
    const self = this;
    if (typeof listener !== "function") {
      _log("error", "Listener must be a function");
      return () => {
      };
    }
    storeListeners.add(listener);
    _metrics.listenerAddCount++;
    _log("info", "Listener added, total:", storeListeners.size);
    return () => {
      storeListeners.delete(listener);
      _metrics.listenerRemoveCount++;
      _log("info", "Listener removed, total:", storeListeners.size);
    };
  },
  _notifyListeners(action, key, newValue, oldValue) {
    _metrics.listenerNotifyCount++;
    storeListeners.forEach((listener) => {
      try {
        listener({ action, key, newValue, oldValue });
      } catch (error) {
        _metrics.listenerErrorCount++;
        _log("error", "Error in listener:", error.message);
      }
    });
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = { storeInitialized: store instanceof Map, listenersInitialized: storeListeners instanceof Set, noListenerErrors: _metrics.listenerErrorCount === 0, hasData: store.size > 0, lowClearCount: _metrics.clearCount < 10, loggerAvailable: !!_getPort("logger"), telemetryAvailable: !!_getPort("telemetry"), portsInitialized: portsSnapshot._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = "HEALTHY";
    if (passed < total * 0.5) status = "UNHEALTHY";
    else if (passed < total) status = "DEGRADED";
    const issues = [];
    if (!checks.storeInitialized) issues.push("Store not initialized");
    if (!checks.listenersInitialized) issues.push("Listeners not initialized");
    if (!checks.noListenerErrors) issues.push(`${_metrics.listenerErrorCount} listener errors`);
    if (!checks.hasData) issues.push("Store is empty");
    if (!checks.lowClearCount) issues.push(`High clear count: ${_metrics.clearCount}`);
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
  },
  getStats() {
    return { version: VERSION, moduleId: MODULE_ID, size: store.size, keys: Array.from(store.keys()), listenerCount: storeListeners.size };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, internalUseOnly: INTERNAL_USE_ONLY, size: store.size, listenerCount: storeListeners.size, metrics: Object.assign({}, _metrics), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), note: "Este modulo e interno. Use ContextProvider.set/get." };
  },
  resetMetrics() {
    _metrics = { setCount: 0, getCount: 0, deleteCount: 0, clearCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, listenerNotifyCount: 0, listenerErrorCount: 0, lastSetAt: null, lastGetAt: null, lastClearAt: null };
  },
  getVersion() {
    return VERSION;
  }
};
var store_default = contextStore;
export {
  MODULE_ID,
  VERSION,
  contextStore,
  store_default as default,
  getPorts,
  getVersion,
  injectPorts
};
