import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from "/core/policies/globalstate-access-policy.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.6.0-FASE-B";
const MODULE_ID = "header/state/global-state-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _log = function(level, ...rest) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
let _globalState = null;
let _subscriptions = [];
let _initialized = false;
let _localCache = {};
let _resolutionMethod = "none";
const _metrics = {
  getCount: 0,
  setCount: 0,
  subscribeCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastAccessAt: null
};
const _recordAccess = (type, key) => {
  try {
    const source = _resolutionMethod === "Ports.globalState" ? ACCESS_SOURCES.ADAPTER_AUTHORIZED : _resolutionMethod.startsWith("window.") ? ACCESS_SOURCES.WINDOW_DIRECT : ACCESS_SOURCES.ADAPTER_AUTHORIZED;
    recordAccess({
      type,
      source,
      key,
      caller: MODULE_ID,
      moduleId: MODULE_ID
    });
  } catch (e) {
  }
};
function _detectGlobalState() {
  if (typeof window === "undefined") return null;
  const gsPort = _getPort("globalState");
  if (gsPort) {
    _resolutionMethod = "Ports.globalState";
    return gsPort;
  }
  _resolutionMethod = "none";
  return null;
}
function init() {
  if (_initialized) return true;
  _initPorts();
  _globalState = _detectGlobalState();
  if (_globalState) {
    _initialized = true;
    _log("info", `GlobalState detectado via ${_resolutionMethod}`);
    return true;
  }
  _log("warn", "GlobalState nao disponivel - usando cache local");
  _initialized = true;
  return false;
}
function isAvailable() {
  return !!_globalState;
}
function getResolutionMethod() {
  return _resolutionMethod;
}
function get(key, defaultValue) {
  _metrics.getCount++;
  _metrics.lastAccessAt = Date.now();
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.GET, key);
  if (_globalState) {
    try {
      let value = null;
      if (typeof _globalState.get === "function") {
        value = _globalState.get(key);
      } else if (typeof _globalState.getState === "function") {
        const state = _globalState.getState();
        value = _getNestedValue(state, key);
      } else if (typeof _globalState[key] !== "undefined") {
        value = _globalState[key];
      }
      if (value !== void 0 && value !== null) {
        _metrics.cacheHits++;
        _localCache[key] = value;
        return value;
      }
    } catch (e) {
      _log("warn", "Erro ao acessar GlobalState:", e.message);
    }
  }
  _metrics.cacheMisses++;
  if (_localCache.hasOwnProperty(key)) {
    return _localCache[key];
  }
  return defaultValue;
}
function set(key, value) {
  _metrics.setCount++;
  _metrics.lastAccessAt = Date.now();
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.SET, key);
  _localCache[key] = value;
  if (_globalState) {
    try {
      if (typeof _globalState.set === "function") {
        _globalState.set(key, value);
        return true;
      } else if (typeof _globalState.dispatch === "function") {
        _globalState.dispatch({ type: "SET_VALUE", key, value });
        return true;
      } else if (typeof _globalState.setState === "function") {
        const update = {};
        update[key] = value;
        _globalState.setState(update);
        return true;
      }
    } catch (e) {
      _log("warn", "Erro ao definir GlobalState:", e.message);
    }
  }
  return false;
}
function subscribe(key, callback) {
  _metrics.subscribeCount++;
  if (!_initialized) init();
  _recordAccess(ACCESS_TYPES.SUBSCRIBE, key);
  const subscription = { key, callback, unsubscribe: null };
  if (_globalState) {
    try {
      if (typeof _globalState.subscribe === "function") {
        subscription.unsubscribe = _globalState.subscribe((state) => {
          const value = key ? _getNestedValue(state, key) : state;
          callback(value);
        });
      } else if (typeof _globalState.on === "function") {
        _globalState.on(`change:${key}`, callback);
        subscription.unsubscribe = () => {
          if (_globalState.off) _globalState.off(`change:${key}`, callback);
        };
      }
    } catch (e) {
      _log("warn", "Erro ao subscrever GlobalState:", e.message);
    }
  }
  _subscriptions.push(subscription);
  return () => {
    const idx = _subscriptions.indexOf(subscription);
    if (idx > -1) _subscriptions.splice(idx, 1);
    if (subscription.unsubscribe) subscription.unsubscribe();
  };
}
function _getNestedValue(obj, path) {
  if (!path) return obj;
  const keys = path.split(".");
  let value = obj;
  for (let i = 0; i < keys.length; i++) {
    if (value === null || value === void 0) return void 0;
    value = value[keys[i]];
  }
  return value;
}
const selectors = {
  // @ts-expect-error TS migration - TS2554
  getUser() {
    return get("user");
  },
  // @ts-expect-error TS migration - TS2554
  getSession() {
    return get("session");
  },
  // @ts-expect-error TS migration - TS2554
  getAuth() {
    return get("auth");
  },
  // @ts-expect-error TS migration - TS2554
  getConfig() {
    return get("config");
  },
  // @ts-expect-error TS migration - TS2554
  getTheme() {
    return get("theme");
  },
  // @ts-expect-error TS migration - TS2554
  getLocale() {
    return get("locale");
  },
  isAuthenticated() {
    const session = get("session");
    return session && session.isAuthenticated === true;
  },
  getUserId() {
    const user = get("user");
    return user ? user.id : null;
  },
  getUserLevel() {
    const user = get("user");
    return user ? user.level || 0 : 0;
  }
};
function cleanup() {
  _subscriptions.forEach((sub) => {
    if (sub.unsubscribe) sub.unsubscribe();
  });
  _subscriptions = [];
  _log("info", "Subscricoes limpas");
}
function reset() {
  cleanup();
  _localCache = {};
  _initialized = false;
  _globalState = null;
  _resolutionMethod = "none";
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    subscriptionCount: _subscriptions.length,
    cacheSize: Object.keys(_localCache).length,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod
  });
}
function resetMetrics() {
  _metrics.getCount = 0;
  _metrics.setCount = 0;
  _metrics.subscribeCount = 0;
  _metrics.cacheHits = 0;
  _metrics.cacheMisses = 0;
  _metrics.lastAccessAt = null;
}
function healthCheck() {
  const cacheHitRate = _metrics.cacheHits + _metrics.cacheMisses > 0 ? _metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) : 0;
  const strictMode = isStrict();
  const checks = {
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    usingPorts: _resolutionMethod === "Ports.globalState",
    strictModeCompliant: !strictMode || _resolutionMethod === "Ports.globalState" || _resolutionMethod === "none",
    hasSelectors: Object.keys(selectors).length > 0,
    goodCacheHitRate: cacheHitRate >= 0.5 || _metrics.cacheHits + _metrics.cacheMisses < 10,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= total - 1 ? "HEALTHY" : passed >= total - 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    cacheHitRate,
    resolutionMethod: _resolutionMethod,
    strictMode,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    globalStateAvailable: !!_globalState,
    resolutionMethod: _resolutionMethod,
    subscriptionCount: _subscriptions.length,
    cacheSize: Object.keys(_localCache).length,
    selectorsAvailable: Object.keys(selectors),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
var global_state_adapter_default = {
  VERSION,
  MODULE_ID,
  init,
  isAvailable,
  getResolutionMethod,
  get,
  set,
  subscribe,
  selectors,
  cleanup,
  reset,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  global_state_adapter_default as default,
  get,
  getMetrics,
  getPorts,
  getResolutionMethod,
  healthCheck,
  info,
  init,
  injectPorts,
  isAvailable,
  reset,
  resetMetrics,
  selectors,
  set,
  subscribe
};
