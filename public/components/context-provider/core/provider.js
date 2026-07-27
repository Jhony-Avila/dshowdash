import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ContextRegistry } from "./registry.js";
import { contextStore } from "../state/store.js";
import { trackContextEvent } from "../telemetry/tracker.js";
import { validateContextValue, isEqual } from "../utils/helpers.js";
const VERSION = "5.3.1-ENTERPRISE";
const MODULE_ID = "context-provider-core";
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
function getVersion() {
  return VERSION;
}
const subscribers = /* @__PURE__ */ new Map();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
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
let metrics = { totalSets: 0, totalGets: 0, setsByContext: {}, subscriberErrors: 0, skippedUpdates: 0, blockedSets: 0, autoRegisters: 0, uiAutoRegisters: 0, validationFailures: 0, lastSetAt: null, lastGetAt: null };
const AUTHORIZED_OWNERS = Object.freeze(["AppShell", "RouterGlobal", "Main", "Orchestrator", "LoginModal", "Preloader", "GlobalState", "SessionManager", "ContextLifecycle", "ContextProvider", "LayoutManager", "PermissionsGuard", "ThemeManager", "ModalManager", "OverlayLayer"]);
const ContextProviderCore = {
  setDebug(debug) {
    if (ContextRegistry.setDebug) ContextRegistry.setDebug(debug);
    if (contextStore.setDebug) contextStore.setDebug(debug);
  },
  set(key, value, strict, options) {
    if (strict === void 0) strict = false;
    if (!options) options = {};
    try {
      const isCoreCtx = ContextRegistry.isCoreContext(key);
      const isUICtx = ContextRegistry.isUIContext ? ContextRegistry.isUIContext(key) : false;
      const owner = options.owner || "unknown";
      if (isCoreCtx && strict) {
        if (AUTHORIZED_OWNERS.indexOf(owner) === -1) {
          _log("warn", `Blocked: unauthorized set on core context "${key}" by "${owner}"`);
          metrics.blockedSets++;
          try {
            trackContextEvent("context:core:blocked", { key, owner, reason: "unauthorized", authorizedOwners: AUTHORIZED_OWNERS });
          } catch (e) {
          }
          return false;
        }
      }
      if (!ContextRegistry.has(key)) {
        if (ContextRegistry.isReservedPrefix(key)) {
          _log("warn", `Blocked: reserved prefix in context name "${key}"`);
          metrics.blockedSets++;
          return false;
        }
        if (isUICtx) {
          _log("warn", `UI Context "${key}" not pre-registered. Auto-registering...`);
          metrics.uiAutoRegisters++;
          if (ContextRegistry.trackUIAutoRegister) ContextRegistry.trackUIAutoRegister();
          try {
            trackContextEvent("context:ui:auto-register", { key, owner });
          } catch (e) {
          }
        } else {
          _log("warn", `Context "${key}" not registered. Auto-registering...`);
        }
        metrics.autoRegisters++;
        ContextRegistry.register(key, null, { owner, type: isUICtx ? "ui" : "custom" });
      }
      if (strict) {
        const schema = ContextRegistry.getSchema(key);
        if (schema) {
          const validation = validateContextValue(value, schema);
          if (!validation.valid) {
            metrics.validationFailures++;
            const meta = ContextRegistry.getContextMeta(key);
            const errorDetail = { key, error: validation.error, owner: meta ? meta.owner : null, lifetime: meta ? meta.lifetime : null, expectedType: schema.type, receivedType: Array.isArray(value) ? "array" : typeof value };
            try {
              trackContextEvent("context:value:invalid", errorDetail);
            } catch (e) {
            }
            _log("warn", `Value for "${key}" failed validation:`, errorDetail);
            return false;
          }
        }
      }
      const oldValue = contextStore.get(key);
      if (isEqual(oldValue, value)) {
        metrics.skippedUpdates++;
        return true;
      }
      contextStore.set(key, value);
      metrics.totalSets++;
      metrics.setsByContext[key] = (metrics.setsByContext[key] || 0) + 1;
      metrics.lastSetAt = Date.now();
      try {
        trackContextEvent("context:value:set", { key, hasOldValue: oldValue !== void 0, owner, isUI: isUICtx });
      } catch (e) {
      }
      this._notifySubscribers(key, value, oldValue);
      _log("info", "Set:", key, "(owner:", `${owner})`);
      return true;
    } catch (error) {
      _log("error", "set error:", error.message);
      return false;
    }
  },
  get(key) {
    try {
      metrics.totalGets++;
      metrics.lastGetAt = Date.now();
      if (!ContextRegistry.has(key)) {
        _log("warn", `Context "${key}" not registered`);
        return void 0;
      }
      return contextStore.get(key);
    } catch (error) {
      _log("error", "get error:", error.message);
      return void 0;
    }
  },
  getAll() {
    try {
      const result = {};
      ContextRegistry.list().forEach((key) => {
        result[key] = contextStore.get(key);
      });
      return result;
    } catch (error) {
      _log("error", "getAll error:", error.message);
      return {};
    }
  },
  inspectAll() {
    const self = this;
    try {
      const result = [];
      ContextRegistry.list().forEach((key) => {
        const meta = ContextRegistry.getContextMeta(key);
        result.push({ name: key, value: contextStore.get(key), meta: meta ? { owner: meta.owner, type: meta.type, lifetime: meta.lifetime, description: meta.description, registeredAt: meta.registeredAt } : null, subscribers: self.getSubscriberCount(key), setCount: metrics.setsByContext[key] || 0 });
      });
      return result;
    } catch (error) {
      _log("error", "inspectAll error:", error.message);
      return [];
    }
  },
  subscribe(key, handler, options) {
    const self = this;
    if (!options) options = {};
    try {
      if (typeof handler !== "function") {
        _log("error", "Handler must be a function");
        return () => {
        };
      }
      if (options.strict && !ContextRegistry.has(key)) {
        _log("warn", `Cannot subscribe to unregistered context "${key}" in strict mode`);
        return () => {
        };
      }
      if (!subscribers.has(key)) subscribers.set(key, /* @__PURE__ */ new Set());
      subscribers.get(key).add(handler);
      _log("info", "Subscriber added for:", key);
      try {
        trackContextEvent("context:subscriber:added", { key, totalForKey: subscribers.get(key).size });
      } catch (e) {
      }
      return () => {
        self.unsubscribe(key, handler);
      };
    } catch (error) {
      _log("error", "subscribe error:", error.message);
      return () => {
      };
    }
  },
  unsubscribe(key, handler) {
    try {
      if (!subscribers.has(key)) return false;
      const removed = subscribers.get(key).delete(handler);
      if (removed) {
        _log("info", "Subscriber removed for:", key);
        try {
          trackContextEvent("context:subscriber:removed", { key });
        } catch (e) {
        }
      }
      if (subscribers.get(key).size === 0) subscribers.delete(key);
      return removed;
    } catch (error) {
      _log("error", "unsubscribe error:", error.message);
      return false;
    }
  },
  _notifySubscribers(key, newValue, oldValue) {
    if (!subscribers.has(key)) return;
    const handlers = subscribers.get(key);
    handlers.forEach((handler) => {
      try {
        handler(newValue, oldValue, key);
      } catch (error) {
        metrics.subscriberErrors++;
        const errorInfo = { key, error: error.message || "Unknown error", handlerName: handler.name || "anonymous" };
        _log("error", `Error in subscriber for "${key}":`, errorInfo);
        try {
          trackContextEvent("context:subscriber:error", errorInfo);
        } catch (e) {
        }
      }
    });
  },
  hasSubscribers(key) {
    return subscribers.has(key) && subscribers.get(key).size > 0;
  },
  getSubscriberCount(key) {
    if (!subscribers.has(key)) return 0;
    return subscribers.get(key).size;
  },
  getSubscriberStats() {
    let total = 0;
    const byContext = {};
    subscribers.forEach((handlers, key) => {
      const count = handlers.size;
      total += count;
      byContext[key] = count;
    });
    return { version: VERSION, moduleId: MODULE_ID, total, contextCount: subscribers.size, byContext, metrics: Object.assign({}, metrics) };
  },
  clearSubscribers(key) {
    try {
      if (subscribers.has(key)) {
        subscribers.delete(key);
        _log("info", "Subscribers cleared for:", key);
        try {
          trackContextEvent("context:subscribers:cleared", { key });
        } catch (e) {
        }
        return true;
      }
      return false;
    } catch (error) {
      _log("error", "clearSubscribers error:", error.message);
      return false;
    }
  },
  clearAllSubscribers() {
    try {
      subscribers.clear();
      _log("info", "All subscribers cleared");
      try {
        trackContextEvent("context:subscribers:all-cleared");
      } catch (e) {
      }
    } catch (error) {
      _log("error", "clearAllSubscribers error:", error.message);
    }
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = { subscribersInitialized: subscribers instanceof Map, registryAvailable: typeof ContextRegistry.has === "function", storeAvailable: typeof contextStore.get === "function", lowBlockedSets: metrics.blockedSets < 10, lowSubscriberErrors: metrics.subscriberErrors < 5, lowValidationFailures: metrics.validationFailures < 10, lowUIAutoRegisters: metrics.uiAutoRegisters < 5, loggerAvailable: !!_getPort("logger"), portsInitialized: portsSnapshot._initialized };
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
      if (checks[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    let status = "HEALTHY";
    if (passed < total * 0.5) status = "UNHEALTHY";
    else if (passed < total) status = "DEGRADED";
    const issues = [];
    if (!checks.subscribersInitialized) issues.push("Subscribers not initialized");
    if (!checks.registryAvailable) issues.push("Registry not available");
    if (!checks.storeAvailable) issues.push("Store not available");
    if (!checks.lowBlockedSets) issues.push(`${metrics.blockedSets} blocked set attempts`);
    if (!checks.lowSubscriberErrors) issues.push(`${metrics.subscriberErrors} subscriber errors`);
    if (!checks.lowValidationFailures) issues.push(`${metrics.validationFailures} validation failures`);
    if (!checks.lowUIAutoRegisters) issues.push(`${metrics.uiAutoRegisters} UI auto-registers`);
    return { status, score: `${passed}/${total}`, healthy: passed >= 6, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, subscriberCount: subscribers.size, totalSubscribers: this.getSubscriberStats().total, metrics: Object.assign({}, metrics), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), authorizedOwners: AUTHORIZED_OWNERS, timestamp: Date.now() };
  },
  resetMetrics() {
    metrics = { totalSets: 0, totalGets: 0, setsByContext: {}, subscriberErrors: 0, skippedUpdates: 0, blockedSets: 0, autoRegisters: 0, uiAutoRegisters: 0, validationFailures: 0, lastSetAt: null, lastGetAt: null };
  },
  getVersion() {
    return VERSION;
  }
};
var provider_default = ContextProviderCore;
export {
  AUTHORIZED_OWNERS,
  ContextProviderCore,
  MODULE_ID,
  VERSION,
  provider_default as default,
  getPorts,
  getVersion,
  injectPorts
};
