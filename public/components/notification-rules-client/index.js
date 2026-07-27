import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "2.8.0-P2-ENTERPRISE";
const MODULE_ID = "notification-rules-client";
const NOTIFICATION_RULES_EVENTS = {
  READY: "notification-rules:ready",
  LIST: "notification-rules:list",
  CREATED: "notification-rules:created",
  UPDATED: "notification-rules:updated",
  TOGGLED: "notification-rules:toggled",
  REMOVED: "notification-rules:removed",
  ERROR: "notification-rules:error"
};
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isDebugEnabled = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug;
};
const _log = (level, msg, extra) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (_isDebugEnabled()) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};
const NotificationRulesClient = /* @__PURE__ */ (() => {
  const CONFIG = { endpoints: { list: "/api/notification-rules/?action=list", get: "/api/notification-rules/?action=get", triggers: "/api/notification-rules/?action=triggers", create: "/api/notification-rules/?action=create", update: "/api/notification-rules/?action=update", toggle: "/api/notification-rules/?action=toggle", delete: "/api/notification-rules/" }, retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 }, timeout: 1e4 };
  let rules = [];
  let triggers = {};
  let isInitialized = false;
  let abortController = null;
  const listeners = /* @__PURE__ */ new Map();
  const _metrics = { listCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, errorCount: 0, lastActivity: null };
  const emit = (event, data) => {
    if (listeners.has(event)) {
      for (const fn of listeners.get(event)) {
        try {
          fn(data);
        } catch (e) {
          _log("error", "Listener error:", e);
        }
      }
    }
    const eb = _getPort("eventBus");
    if (eb?.emit) {
      const eventKey = NOTIFICATION_RULES_EVENTS[event.toUpperCase()] || `notification-rules:${event}`;
      eb.emit(eventKey, data);
    }
  };
  const on = (event, callback) => {
    if (!listeners.has(event)) listeners.set(event, /* @__PURE__ */ new Set());
    listeners.get(event).add(callback);
    return () => {
      listeners.get(event).delete(callback);
    };
  };
  const off = (event, callback) => {
    if (listeners.has(event)) {
      if (callback) listeners.get(event).delete(callback);
      else listeners.delete(event);
    }
  };
  const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
  const fetchWithRetry = (url, options = {}, attempt = 1) => {
    const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;
    if (!abortController || abortController.signal.aborted) abortController = new AbortController();
    const fetchOptions = { ...options, credentials: "include", signal: abortController.signal };
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, CONFIG.timeout);
      fetch(url, fetchOptions).then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok && attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          _log("warn", `Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
          return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1)).then(resolve);
        }
        resolve(response);
      }).catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          reject(new Error("REQUEST_TIMEOUT"));
          return;
        }
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          _log("warn", `Request error, retry ${attempt}/${maxAttempts} in ${delay}ms: ${error.message}`);
          sleep(delay).then(() => {
            abortController = new AbortController();
            return fetchWithRetry(url, options, attempt + 1);
          }).then(resolve).catch(reject);
        } else reject(error);
      });
    });
  };
  const trackTelemetry = (action, data = {}) => {
    _metrics.lastActivity = Date.now();
    const tt = _getPort("telemetry");
    tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
  };
  const list = (options = {}) => {
    const params = new URLSearchParams();
    if (options.enabled !== void 0) params.append("enabled", options.enabled);
    if (options.trigger) params.append("trigger", options.trigger);
    const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : "");
    return fetchWithRetry(url).then((r) => r.json()).then((data) => {
      if (data.ok) {
        rules = data.rules || [];
        _metrics.listCount++;
        trackTelemetry("list", { count: rules.length });
        emit("list", { rules, total: data.total });
        return rules;
      }
      throw new Error(data.error || "FETCH_ERROR");
    }).catch((error) => {
      _metrics.errorCount++;
      trackTelemetry("error", { action: "list", error: error.message });
      emit("error", { action: "list", error: error.message });
      throw error;
    });
  };
  const get = (idOrKey) => {
    const param = typeof idOrKey === "number" ? `id=${idOrKey}` : `key=${idOrKey}`;
    return fetchWithRetry(`${CONFIG.endpoints.get}&${param}`).then((r) => r.json()).then((data) => {
      if (data.ok) {
        trackTelemetry("get", { idOrKey });
        return data.rule;
      }
      throw new Error(data.error || "FETCH_ERROR");
    }).catch((error) => {
      _metrics.errorCount++;
      trackTelemetry("error", { action: "get", error: error.message });
      emit("error", { action: "get", error: error.message });
      throw error;
    });
  };
  const getTriggers = () => fetchWithRetry(CONFIG.endpoints.triggers).then((r) => r.json()).then((data) => {
    if (data.ok) {
      triggers = data.triggers || {};
      trackTelemetry("triggers", { count: Object.keys(triggers).length });
      return triggers;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "triggers", error: error.message });
    emit("error", { action: "triggers", error: error.message });
    throw error;
  });
  const create = (ruleData) => fetchWithRetry(CONFIG.endpoints.create, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ruleData) }).then((r) => r.json()).then((data) => {
    if (data.ok) {
      _metrics.createCount++;
      trackTelemetry("created", { ruleId: data.rule_id });
      emit("created", { rule_id: data.rule_id });
      return list().then(() => data);
    }
    throw new Error(data.error || "CREATE_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "create", error: error.message });
    emit("error", { action: "create", error: error.message });
    throw error;
  });
  const update = (ruleId, updates) => fetchWithRetry(CONFIG.endpoints.update, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ruleId, ...updates }) }).then((r) => r.json()).then((data) => {
    if (data.ok) {
      _metrics.updateCount++;
      trackTelemetry("updated", { ruleId });
      emit("updated", { rule_id: ruleId });
      return list().then(() => data);
    }
    throw new Error(data.error || "UPDATE_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "update", error: error.message });
    emit("error", { action: "update", error: error.message });
    throw error;
  });
  const toggle = (ruleId) => fetchWithRetry(`${CONFIG.endpoints.toggle}&id=${ruleId}`, { method: "PATCH" }).then((r) => r.json()).then((data) => {
    if (data.ok) {
      const rule = rules.find((r) => r.id == ruleId);
      if (rule) rule.is_enabled = data.is_enabled;
      trackTelemetry("toggled", { ruleId, enabled: data.is_enabled });
      emit("toggled", { rule_id: ruleId, is_enabled: data.is_enabled });
      return data;
    }
    throw new Error(data.error || "TOGGLE_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "toggle", error: error.message });
    emit("error", { action: "toggle", error: error.message });
    throw error;
  });
  const remove = (ruleId) => fetchWithRetry(`${CONFIG.endpoints.delete}?id=${ruleId}`, { method: "DELETE" }).then((r) => r.json()).then((data) => {
    if (data.ok) {
      rules = rules.filter((r) => r.id != ruleId);
      _metrics.deleteCount++;
      trackTelemetry("removed", { ruleId });
      emit("removed", { rule_id: ruleId });
      return data;
    }
    throw new Error(data.error || "DELETE_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "remove", error: error.message });
    emit("error", { action: "remove", error: error.message });
    throw error;
  });
  const getRulesByTrigger = (triggerEvent) => rules.filter((r) => r.trigger_event === triggerEvent && r.is_enabled);
  const getEnabledRules = () => rules.filter((r) => r.is_enabled);
  const getDisabledRules = () => rules.filter((r) => !r.is_enabled);
  const getRuleById = (ruleId) => rules.find((r) => r.id == ruleId) || null;
  const init = () => {
    if (isInitialized) return Promise.resolve(true);
    _initPorts();
    abortController = new AbortController();
    return Promise.all([list(), getTriggers()]).then(() => {
      isInitialized = true;
      trackTelemetry("ready", { rulesCount: rules.length });
      emit("ready", { initialized: true, rulesCount: rules.length });
      _log("info", `${VERSION} initialized with ${rules.length} rules`);
      return true;
    }).catch((error) => {
      _log("error", "Init error:", error);
      emit("error", { action: "init", error: error.message });
      return false;
    });
  };
  const destroy = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    listeners.clear();
    rules = [];
    triggers = {};
    isInitialized = false;
    _log("info", "Destroyed");
  };
  const reset = () => {
    destroy();
    _metrics.listCount = 0;
    _metrics.createCount = 0;
    _metrics.updateCount = 0;
    _metrics.deleteCount = 0;
    _metrics.errorCount = 0;
    _metrics.lastActivity = null;
    _log("info", "Reset complete");
  };
  const healthCheck = () => {
    const logger = _getPort("logger");
    const checks = { initialized: isInitialized, hasRules: rules.length > 0, hasTriggers: Object.keys(triggers).length > 0, abortControllerActive: !!abortController && !abortController.signal.aborted, lowErrorRate: _metrics.errorCount < (_metrics.listCount + _metrics.createCount) * 0.1 || _metrics.listCount === 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
    let passed = 0, total = 0;
    for (const key of Object.keys(checks)) {
      total++;
      if (checks[key]) passed++;
    }
    const status = passed < total * 0.5 ? "UNHEALTHY" : passed < total ? "DEGRADED" : "HEALTHY";
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  };
  const getStatus = () => ({ name: MODULE_ID, version: VERSION, initialized: isInitialized, rulesCount: rules.length, enabledRulesCount: getEnabledRules().length, triggersCount: Object.keys(triggers).length, metrics: { ..._metrics }, healthCheck: healthCheck() });
  const info = () => ({ version: VERSION, moduleId: MODULE_ID, initialized: isInitialized, portsInitialized: Ports.isInitialized(), rulesCount: rules.length, enabledRulesCount: getEnabledRules().length, triggersCount: Object.keys(triggers).length, metrics: { ..._metrics } });
  const getMetrics = () => ({ ..._metrics });
  return { init, destroy, reset, list, get, getTriggers, create, update, toggle, remove, on, off, getRulesByTrigger, getEnabledRules, getDisabledRules, getRuleById, getRules: () => rules.slice(), getTriggersList: () => ({ ...triggers }), isInitialized: () => isInitialized, healthCheck, getStatus, info, getMetrics, getVersion: () => VERSION, injectPorts, getPorts, PRIORITIES: ["low", "normal", "high", "urgent"], TARGET_TYPES: ["all", "role", "user", "custom"], NOTIFICATION_RULES_EVENTS, VERSION, MODULE_ID };
})();
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.notificationRulesClient = NotificationRulesClient;
  if (!isStrict()) {
    window.NotificationRulesClient = NotificationRulesClient;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.NotificationRulesClient" });
  }
}
var notification_rules_client_default = NotificationRulesClient;
export {
  MODULE_ID,
  NOTIFICATION_RULES_EVENTS,
  NotificationRulesClient,
  VERSION,
  notification_rules_client_default as default,
  getPorts,
  injectPorts
};
