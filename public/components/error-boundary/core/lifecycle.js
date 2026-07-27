import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { errorStore } from "../state/store.js";
import { trackErrorEvent } from "../telemetry/tracker.js";
import { ErrorCatcher } from "./catcher.js";
const VERSION = "2.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.core.lifecycle";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug || false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled() && logger.debug) {
    logger.debug(`[${MODULE_ID}]`, ...args);
  }
};
const _state = {
  initialized: false,
  initializing: false,
  initCount: 0,
  lastInitAt: null,
  lastShutdownAt: null,
  lastResetAt: null,
  lastError: null,
  options: {}
};
const ErrorLifecycle = {
  init(options = {}) {
    if (_state.initialized && !options.force) {
      _log("warn", "Already initialized, use force:true to reinit");
      trackErrorEvent("error:lifecycle:already-initialized", { initCount: _state.initCount });
      return Promise.resolve({ success: true, alreadyInitialized: true, initCount: _state.initCount });
    }
    if (_state.initializing) {
      _log("warn", "Init already in progress");
      return Promise.resolve({ success: false, reason: "initializing" });
    }
    _state.initializing = true;
    trackErrorEvent("error:lifecycle:init:start");
    return new Promise((resolve) => {
      try {
        if (options.force && _state.initialized) {
          this.shutdown();
        }
        _state.options = { ...options };
        errorStore.reset();
        ErrorCatcher.startGlobalCapture(options);
        _state.initialized = true;
        _state.initializing = false;
        _state.initCount++;
        _state.lastInitAt = Date.now();
        _state.lastError = null;
        trackErrorEvent("error:lifecycle:init:complete", { initCount: _state.initCount });
        resolve({ success: true, initCount: _state.initCount });
      } catch (error) {
        _state.initializing = false;
        _state.lastError = error.message;
        _log("error", "Init failed:", error);
        trackErrorEvent("error:lifecycle:init:failed", { error: error.message });
        resolve({ success: false, error: error.message });
      }
    });
  },
  shutdown() {
    if (!_state.initialized) {
      _log("warn", "Not initialized, nothing to shutdown");
      return { success: true, wasInitialized: false };
    }
    trackErrorEvent("error:lifecycle:shutdown:start");
    try {
      ErrorCatcher.stopGlobalCapture();
      errorStore.reset();
      _state.initialized = false;
      _state.lastShutdownAt = Date.now();
      trackErrorEvent("error:lifecycle:shutdown:complete");
      return { success: true, wasInitialized: true };
    } catch (error) {
      _state.lastError = error.message;
      _log("error", "Shutdown failed:", error);
      trackErrorEvent("error:lifecycle:shutdown:failed", { error: error.message });
      return { success: false, error: error.message };
    }
  },
  reset() {
    trackErrorEvent("error:lifecycle:reset:start");
    try {
      errorStore.reset();
      ErrorCatcher.clearFingerprints();
      _state.lastResetAt = Date.now();
      _state.lastError = null;
      trackErrorEvent("error:lifecycle:reset:complete");
      return { success: true };
    } catch (error) {
      _state.lastError = error.message;
      _log("error", "Reset failed:", error);
      trackErrorEvent("error:lifecycle:reset:failed", { error: error.message });
      return { success: false, error: error.message };
    }
  },
  destroy() {
    return this.shutdown();
  },
  isInitialized() {
    return _state.initialized;
  },
  isInitializing() {
    return _state.initializing;
  },
  getStatus() {
    return {
      initialized: _state.initialized,
      initializing: _state.initializing,
      initCount: _state.initCount,
      lastInitAt: _state.lastInitAt,
      lastShutdownAt: _state.lastShutdownAt,
      lastResetAt: _state.lastResetAt,
      lastError: _state.lastError,
      errorCount: errorStore.getErrorCount(),
      hasError: errorStore.hasError ? errorStore.hasError() : errorStore.getErrorCount() > 0
    };
  },
  getOptions() {
    return { ..._state.options };
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const status = this.getStatus();
    const checks = {
      initialized: status.initialized,
      noInitError: !status.lastError,
      storeAvailable: !!errorStore,
      catcherAvailable: !!ErrorCatcher,
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
      initCount: status.initCount,
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
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts,
  getPorts
};
function healthCheck() {
  return ErrorLifecycle.healthCheck();
}
function info() {
  return ErrorLifecycle.info();
}
var lifecycle_default = ErrorLifecycle;
export {
  ErrorLifecycle,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
