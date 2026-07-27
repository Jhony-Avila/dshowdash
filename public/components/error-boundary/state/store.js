import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.6.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.state.store";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug || false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (_debug()) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
};
const errorData = {
  errors: [],
  lastError: null,
  errorCount: 0,
  fatalError: false,
  recoveryAttempts: 0,
  maxErrors: 100,
  lastUpdatedAt: null
};
const storeListeners = /* @__PURE__ */ new Set();
const _generateErrorId = () => {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};
const errorStore = {
  get(key) {
    if (key) return errorData[key];
    return { ...errorData };
  },
  set(key, value) {
    const oldValue = errorData[key];
    errorData[key] = value;
    errorData.lastUpdatedAt = Date.now();
    this._notify("set", key, value, oldValue);
    return true;
  },
  addError(error) {
    const errorEntry = {
      id: error.id || _generateErrorId(),
      timestamp: Date.now(),
      message: error.message || String(error),
      stack: error.stack || null,
      type: error.type || error.name || "Error",
      source: error.source || "unknown",
      category: error.category || "general",
      fingerprint: error.fingerprint || null,
      componentStack: error.componentStack || null,
      metadata: error.metadata || {},
      recovered: false
    };
    errorData.errors.push(errorEntry);
    errorData.lastError = errorEntry;
    errorData.errorCount++;
    errorData.lastUpdatedAt = Date.now();
    if (errorData.errors.length > errorData.maxErrors) {
      errorData.errors.shift();
    }
    this._notify("error-added", "errors", errorEntry, null);
    return errorEntry;
  },
  updateError(errorOrId) {
    const id = typeof errorOrId === "string" ? errorOrId : errorOrId?.id;
    if (!id) return null;
    const index = errorData.errors.findIndex((e) => e.id === id);
    if (index === -1) return null;
    if (typeof errorOrId === "object") {
      errorData.errors[index] = { ...errorData.errors[index], ...errorOrId };
    }
    errorData.lastUpdatedAt = Date.now();
    this._notify("error-updated", "errors", errorData.errors[index], null);
    return errorData.errors[index];
  },
  getErrors() {
    return errorData.errors.slice();
  },
  getLastError() {
    return errorData.lastError;
  },
  getErrorCount() {
    return errorData.errorCount;
  },
  hasError() {
    return errorData.errorCount > 0 || errorData.fatalError;
  },
  clearErrors() {
    errorData.errors = [];
    errorData.lastError = null;
    errorData.errorCount = 0;
    errorData.fatalError = false;
    errorData.recoveryAttempts = 0;
    errorData.lastUpdatedAt = Date.now();
    this._notify("errors-cleared", null, null, null);
    return true;
  },
  setFatalError(isFatal) {
    errorData.fatalError = isFatal;
    errorData.lastUpdatedAt = Date.now();
    this._notify("fatal-error", "fatalError", isFatal, null);
    return true;
  },
  isFatal() {
    return errorData.fatalError;
  },
  incrementRecoveryAttempts() {
    errorData.recoveryAttempts++;
    return errorData.recoveryAttempts;
  },
  getRecoveryAttempts() {
    return errorData.recoveryAttempts;
  },
  subscribe(listener) {
    if (typeof listener !== "function") return () => false;
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  },
  _notify(action, key, newValue, oldValue) {
    for (const listener of storeListeners) {
      try {
        listener({ action, key, newValue, oldValue, state: this.get(null), error: newValue });
      } catch (err) {
        _log("error", "Listener error:", err);
      }
    }
  },
  reset() {
    return this.clearErrors();
  },
  toJSON() {
    return { ...errorData };
  },
  getStatus() {
    return {
      errorCount: errorData.errorCount,
      hasError: this.hasError(),
      isFatal: errorData.fatalError,
      recoveryAttempts: errorData.recoveryAttempts,
      lastUpdatedAt: errorData.lastUpdatedAt
    };
  },
  getMetrics() {
    return {
      errorCount: errorData.errorCount,
      fatalError: errorData.fatalError,
      recoveryAttempts: errorData.recoveryAttempts,
      listenerCount: storeListeners.size,
      lastUpdatedAt: errorData.lastUpdatedAt
    };
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = {
      notOverflowing: errorData.errors.length < errorData.maxErrors,
      notFatal: !errorData.fatalError,
      lowErrorCount: errorData.errorCount < 50,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    return {
      status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      errorCount: errorData.errorCount,
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      status: this.getStatus(),
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts,
  getPorts
};
function healthCheck() {
  return errorStore.healthCheck();
}
function info() {
  return errorStore.info();
}
var store_default = errorStore;
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  errorStore,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
