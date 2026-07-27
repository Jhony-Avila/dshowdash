import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { SECURITY_EVENTS } from "/core/runtime/events/catalog/security.events.js";
const VERSION = "2.8.0-P2-ENTERPRISE";
const MODULE_ID = "security-events-client";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (ports) => Ports.inject(ports);
const getPorts = () => Ports.snapshot();
const _isDebugEnabled = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug;
};
const _log = (level, msg, ctx) => {
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
};
const SecurityEventsClient = /* @__PURE__ */ (() => {
  const CONFIG = {
    endpoints: { list: "/api/security-events/?action=list", stats: "/api/security-events/?action=stats", types: "/api/security-events/?action=types", log: "/api/security-events/?action=log", batch: "/api/security-events/?action=batch" },
    batchSize: 10,
    flushInterval: 1e4,
    retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 },
    timeout: 1e4
  };
  let eventBuffer = [];
  let flushTimer = null;
  let isInitialized = false;
  let abortController = null;
  const listeners = /* @__PURE__ */ new Map();
  const _metrics = { logCount: 0, batchCount: 0, flushCount: 0, errorCount: 0, lastActivity: null };
  const emit = (event, data) => {
    const shortName = typeof event === "string" && event.indexOf("security:") === 0 ? event.replace("security:", "") : event;
    if (listeners.has(shortName)) {
      for (const fn of listeners.get(shortName)) {
        try {
          fn(data);
        } catch (e) {
          _log("error", `Listener error: ${e.message}`);
        }
      }
    }
    const eb = _getPort("eventBus");
    if (eb?.emit) {
      const fullEvent = typeof event === "string" && event.indexOf("security:") === 0 ? event : `security:${event}`;
      eb.emit(fullEvent, data);
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
    const tt = _getPort("telemetryTracker");
    tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
  };
  const list = (options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit);
    if (options.offset) params.append("offset", options.offset);
    if (options.severity) params.append("severity", options.severity);
    if (options.event_type) params.append("event_type", options.event_type);
    const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : "");
    return fetchWithRetry(url).then((r) => r.json()).then((data) => {
      if (data.ok) {
        trackTelemetry("list", { count: data.events?.length || 0 });
        emit(SECURITY_EVENTS.LIST, { events: data.events, total: data.total });
        return data;
      }
      throw new Error(data.error || "FETCH_ERROR");
    }).catch((error) => {
      _metrics.errorCount++;
      trackTelemetry("error", { action: "list", error: error.message });
      emit(SECURITY_EVENTS.ERROR, { action: "list", error: error.message });
      throw error;
    });
  };
  const getStats = (days = 30) => fetchWithRetry(`${CONFIG.endpoints.stats}&days=${days}`).then((r) => r.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("stats", { days });
      emit(SECURITY_EVENTS.STATS, data);
      return data;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "stats", error: error.message });
    emit(SECURITY_EVENTS.ERROR, { action: "stats", error: error.message });
    throw error;
  });
  const getTypes = () => fetchWithRetry(CONFIG.endpoints.types).then((r) => r.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("types", { count: data.types?.length || 0 });
      return data.types;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "types", error: error.message });
    emit(SECURITY_EVENTS.ERROR, { action: "types", error: error.message });
    throw error;
  });
  const logEvent = (eventType, severity = "info", context = null) => fetchWithRetry(CONFIG.endpoints.log, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, severity, context })
  }).then((r) => r.json()).then((data) => {
    if (data.ok) {
      _metrics.logCount++;
      trackTelemetry("logged", { eventType, severity });
      emit(SECURITY_EVENTS.LOGGED, { event_id: data.event_id, event_type: eventType });
      return data;
    }
    throw new Error(data.error || "LOG_ERROR");
  }).catch((error) => {
    _metrics.errorCount++;
    trackTelemetry("error", { action: "log", error: error.message });
    emit(SECURITY_EVENTS.ERROR, { action: "log", error: error.message });
    throw error;
  });
  const buffer = (eventType, severity = "info", context = null) => {
    eventBuffer.push({ event_type: eventType, severity, context, timestamp: Date.now() });
    _metrics.batchCount++;
    if (eventBuffer.length >= CONFIG.batchSize) flush();
  };
  const flush = () => {
    if (eventBuffer.length === 0) return Promise.resolve();
    const events = eventBuffer.slice();
    eventBuffer = [];
    return fetchWithRetry(CONFIG.endpoints.batch, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }) }).then((r) => r.json()).then((data) => {
      if (data.ok) {
        _metrics.flushCount++;
        trackTelemetry("flushed", { count: events.length });
        emit(SECURITY_EVENTS.FLUSHED, { inserted: data.inserted, errors: data.errors });
        return data;
      }
      throw new Error(data.error || "BATCH_ERROR");
    }).catch((error) => {
      eventBuffer = events.concat(eventBuffer);
      _metrics.errorCount++;
      trackTelemetry("error", { action: "flush", error: error.message });
      emit(SECURITY_EVENTS.ERROR, { action: "flush", error: error.message });
      throw error;
    });
  };
  const logLogin = (context) => logEvent("user.login", "info", context || {});
  const logLogout = (context) => logEvent("user.logout", "info", context || {});
  const logFailedLogin = (context) => logEvent("security.failed_login", "warning", context || {});
  const logPasswordChange = (context) => logEvent("user.password_change", "info", context || {});
  const logSuspiciousActivity = (context) => logEvent("security.suspicious_activity", "critical", context || {});
  const logSessionExpired = (context) => logEvent("session.expired", "info", context || {});
  const logNewDevice = (context) => logEvent("session.new_device", "warning", context || {});
  const logPermissionDenied = (context) => logEvent("permission.denied", "warning", context || {});
  const startFlushTimer = () => {
    if (flushTimer) return;
    flushTimer = setInterval(() => {
      if (eventBuffer.length > 0) flush();
    }, CONFIG.flushInterval);
  };
  const stopFlushTimer = () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  };
  const init = () => {
    if (isInitialized) return true;
    _initPorts();
    abortController = new AbortController();
    startFlushTimer();
    if (hasWindow) {
      window.addEventListener("beforeunload", () => {
        if (eventBuffer.length > 0) navigator.sendBeacon(CONFIG.endpoints.batch, JSON.stringify({ events: eventBuffer }));
      });
    }
    isInitialized = true;
    trackTelemetry("ready", { initialized: true });
    emit(SECURITY_EVENTS.READY, { initialized: true });
    _log("info", `${VERSION} initialized`);
    return true;
  };
  const destroy = () => {
    stopFlushTimer();
    if (eventBuffer.length > 0) {
      try {
        navigator.sendBeacon(CONFIG.endpoints.batch, JSON.stringify({ events: eventBuffer }));
      } catch (e) {
      }
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    listeners.clear();
    eventBuffer = [];
    isInitialized = false;
    _log("info", "Destroyed");
  };
  const reset = () => {
    destroy();
    _metrics.logCount = 0;
    _metrics.batchCount = 0;
    _metrics.flushCount = 0;
    _metrics.errorCount = 0;
    _metrics.lastActivity = null;
    _log("info", "Reset complete");
  };
  const healthCheck = () => {
    const checks = { initialized: isInitialized, flushTimerActive: !!flushTimer, bufferHealthy: eventBuffer.length < CONFIG.batchSize * 2, abortControllerActive: !!abortController && !abortController.signal.aborted, lowErrorRate: _metrics.errorCount < (_metrics.logCount + _metrics.flushCount) * 0.1 || _metrics.logCount === 0, portsInitialized: Ports.isInitialized() };
    let passed = 0, total = 0;
    for (const key of Object.keys(checks)) {
      total++;
      if (checks[key]) passed++;
    }
    const status = passed < total * 0.5 ? "UNHEALTHY" : passed < total ? "DEGRADED" : "HEALTHY";
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  };
  const getStatus = () => ({ name: MODULE_ID, version: VERSION, initialized: isInitialized, bufferSize: eventBuffer.length, flushTimerActive: !!flushTimer, metrics: { ..._metrics }, healthCheck: healthCheck() });
  const info = () => ({ version: VERSION, moduleId: MODULE_ID, initialized: isInitialized, portsInitialized: Ports.isInitialized(), bufferSize: eventBuffer.length, config: { batchSize: CONFIG.batchSize, flushInterval: CONFIG.flushInterval }, metrics: { ..._metrics } });
  const getMetrics = () => ({ ..._metrics });
  return {
    init,
    destroy,
    reset,
    list,
    getStats,
    getTypes,
    log: logEvent,
    buffer,
    flush,
    on,
    off,
    logLogin,
    logLogout,
    logFailedLogin,
    logPasswordChange,
    logSuspiciousActivity,
    logSessionExpired,
    logNewDevice,
    logPermissionDenied,
    startFlushTimer,
    stopFlushTimer,
    getBufferSize: () => eventBuffer.length,
    isInitialized: () => isInitialized,
    healthCheck,
    getStatus,
    info,
    getMetrics,
    getVersion: () => VERSION,
    injectPorts,
    getPorts,
    SEVERITIES: ["info", "warning", "critical"],
    EVENT_TYPES: { LOGIN: "user.login", LOGOUT: "user.logout", FAILED_LOGIN: "security.failed_login", PASSWORD_CHANGE: "user.password_change", SUSPICIOUS_ACTIVITY: "security.suspicious_activity", SESSION_EXPIRED: "session.expired", NEW_DEVICE: "session.new_device", PERMISSION_DENIED: "permission.denied" },
    VERSION,
    MODULE_ID
  };
})();
if (hasWindow) {
  window.__dev = window.__dev || {};
  window.__dev.securityEventsClient = SecurityEventsClient;
  if (!isStrict()) {
    window.SecurityEventsClient = SecurityEventsClient;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.SecurityEventsClient" });
  }
}
var security_events_client_default = SecurityEventsClient;
export {
  MODULE_ID,
  SecurityEventsClient,
  VERSION,
  security_events_client_default as default,
  getPorts,
  injectPorts
};
