import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "main-kernel";
const VERSION = "1.2.0-ENTERPRISE";
const STATUS = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  DEGRADED: "degraded",
  SHUTDOWN: "shutdown",
  ERROR: "error"
});
const FEATURE_STATUS = Object.freeze({
  REGISTERED: "registered",
  ENABLED: "enabled",
  DISABLED: "disabled",
  DEGRADED: "degraded",
  ERROR: "error"
});
const KERNEL_EVENTS = Object.freeze({
  READY: "main-kernel:ready",
  SHUTDOWN: "main-kernel:shutdown",
  FEATURE_REGISTERED: "main-kernel:feature:registered",
  FEATURE_ENABLED: "main-kernel:feature:enabled",
  FEATURE_DISABLED: "main-kernel:feature:disabled",
  FEATURE_ERROR: "main-kernel:feature:error",
  HEALTH_DEGRADED: "main-kernel:health:degraded"
});
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
const _state = {
  status: STATUS.IDLE,
  features: /* @__PURE__ */ new Map(),
  initTime: null,
  shutdownTime: null,
  metrics: {
    inits: 0,
    featureRegistrations: 0,
    featureEnables: 0,
    featureDisables: 0,
    featureErrors: 0,
    totalInitTimeMs: 0
  }
};
function _envelope(ok, data, errors) {
  return {
    ok,
    data,
    meta: {
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: _state.status
    },
    errors: errors || []
  };
}
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk?.track) tk.track(eventName, { moduleId: MODULE_ID, ...payload });
  } catch (e) {
  }
}
function _emit(eventName, data) {
  try {
    const eb = _getPort("eventBus");
    if (eb?.emit) eb.emit(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data });
  } catch (e) {
  }
}
function init(ctx = {}) {
  if (_state.status !== STATUS.IDLE) {
    return _envelope(true, { alreadyInitialized: true });
  }
  try {
    _state.status = STATUS.INITIALIZING;
    _state.initTime = Date.now();
    _state.metrics.inits++;
    _initPorts();
    if (ctx.ports) Ports.inject(ctx.ports);
    _state.status = STATUS.READY;
    _emit(KERNEL_EVENTS.READY, { version: VERSION });
    _track("main-kernel:init", { version: VERSION });
    if (typeof window !== "undefined") {
      if (!isStrict()) {
        window.MainKernel = exports;
      } else {
        recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, property: "window.MainKernel" });
      }
    }
    return _envelope(true, { initialized: true, version: VERSION });
  } catch (e) {
    _state.status = STATUS.ERROR;
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
}
function shutdown(reason = "manual") {
  if (_state.status === STATUS.SHUTDOWN) {
    return _envelope(true, { alreadyShutdown: true });
  }
  _state.features.forEach((f, id) => {
    if (f.status === FEATURE_STATUS.ENABLED) {
      disableFeature(id);
    }
  });
  _state.status = STATUS.SHUTDOWN;
  _state.shutdownTime = Date.now();
  _emit(KERNEL_EVENTS.SHUTDOWN, { reason });
  if (typeof window !== "undefined" && window.MainKernel) {
    delete window.MainKernel;
  }
  return _envelope(true, { shutdown: true, reason });
}
function registerFeature(def) {
  if (!def?.id) {
    return _envelope(false, null, [{ code: "INVALID", message: "Feature id required" }]);
  }
  if (_state.features.has(def.id)) {
    return _envelope(false, null, [{ code: "EXISTS", message: "Already registered" }]);
  }
  _state.features.set(def.id, {
    id: def.id,
    version: def.version || "0.0.0",
    category: def.category || "general",
    priority: def.priority ?? 2,
    dependencies: def.dependencies || [],
    status: FEATURE_STATUS.REGISTERED,
    registeredAt: Date.now(),
    enabledAt: null,
    disabledAt: null,
    initDurationMs: null,
    // SUGESTÃO 14
    init: def.init,
    cleanup: def.cleanup || def.destroy,
    healthCheck: def.healthCheck,
    info: def.info,
    getMetrics: def.getMetrics
  });
  _state.metrics.featureRegistrations++;
  _emit(KERNEL_EVENTS.FEATURE_REGISTERED, { featureId: def.id, version: def.version });
  return _envelope(true, { featureId: def.id, registered: true });
}
function enableFeature(id, opts = {}) {
  const f = _state.features.get(id);
  if (!f) {
    return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  }
  if (f.status === FEATURE_STATUS.ENABLED) {
    return _envelope(true, { alreadyEnabled: true });
  }
  for (const dep of f.dependencies) {
    const d = _state.features.get(dep);
    if (!d || d.status !== FEATURE_STATUS.ENABLED) {
      return _envelope(false, null, [{ code: "DEP_NOT_MET", message: dep }]);
    }
  }
  try {
    const startTime = Date.now();
    if (typeof f.init === "function") {
      f.init(opts);
    }
    f.status = FEATURE_STATUS.ENABLED;
    f.enabledAt = Date.now();
    f.initDurationMs = Date.now() - startTime;
    _state.metrics.featureEnables++;
    _state.metrics.totalInitTimeMs += f.initDurationMs;
    _emit(KERNEL_EVENTS.FEATURE_ENABLED, {
      featureId: id,
      initDurationMs: f.initDurationMs
    });
    return _envelope(true, { featureId: id, enabled: true, initDurationMs: f.initDurationMs });
  } catch (e) {
    f.status = FEATURE_STATUS.ERROR;
    _state.metrics.featureErrors++;
    _emit(KERNEL_EVENTS.FEATURE_ERROR, { featureId: id, error: e.message });
    return _envelope(false, null, [{ code: "ENABLE_ERROR", message: e.message }]);
  }
}
function disableFeature(id, reason = "manual") {
  const f = _state.features.get(id);
  if (!f) {
    return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  }
  if (f.status !== FEATURE_STATUS.ENABLED) {
    return _envelope(true, { alreadyDisabled: true });
  }
  try {
    if (typeof f.cleanup === "function") {
      f.cleanup();
    }
    f.status = FEATURE_STATUS.DISABLED;
    f.disabledAt = Date.now();
    _state.metrics.featureDisables++;
    _emit(KERNEL_EVENTS.FEATURE_DISABLED, { featureId: id, reason });
    return _envelope(true, { featureId: id, disabled: true });
  } catch (e) {
    return _envelope(false, null, [{ code: "DISABLE_ERROR", message: e.message }]);
  }
}
function listFeatures() {
  const list = [];
  _state.features.forEach((f, id) => {
    list.push({
      id,
      version: f.version,
      status: f.status,
      category: f.category,
      priority: f.priority,
      initDurationMs: f.initDurationMs
    });
  });
  return _envelope(true, { features: list, count: list.length });
}
function getFeaturesByStatus(status) {
  const list = [];
  _state.features.forEach((f, id) => {
    if (f.status === status) {
      list.push({
        id,
        version: f.version,
        category: f.category,
        enabledAt: f.enabledAt,
        initDurationMs: f.initDurationMs
      });
    }
  });
  return _envelope(true, { status, features: list, count: list.length });
}
function getFeature(id) {
  const f = _state.features.get(id);
  if (!f) {
    return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  }
  return _envelope(true, {
    id: f.id,
    version: f.version,
    status: f.status,
    category: f.category,
    priority: f.priority,
    registeredAt: f.registeredAt,
    enabledAt: f.enabledAt,
    disabledAt: f.disabledAt,
    initDurationMs: f.initDurationMs
  });
}
function getFeatureMetrics() {
  const metrics = {
    kernel: { ..._state.metrics },
    features: {},
    totals: {
      registered: 0,
      enabled: 0,
      disabled: 0,
      error: 0
    }
  };
  _state.features.forEach((f, id) => {
    if (f.status === FEATURE_STATUS.REGISTERED) metrics.totals.registered++;
    else if (f.status === FEATURE_STATUS.ENABLED) metrics.totals.enabled++;
    else if (f.status === FEATURE_STATUS.DISABLED) metrics.totals.disabled++;
    else if (f.status === FEATURE_STATUS.ERROR) metrics.totals.error++;
    if (typeof f.getMetrics === "function") {
      try {
        metrics.features[id] = f.getMetrics();
      } catch (e) {
        metrics.features[id] = { error: e.message };
      }
    } else {
      metrics.features[id] = { initDurationMs: f.initDurationMs };
    }
  });
  return _envelope(true, metrics);
}
function healthCheck() {
  const checks = {
    initialized: _state.status === STATUS.READY,
    notInError: _state.status !== STATUS.ERROR,
    hasFeatures: _state.features.size > 0
  };
  const featureHealth = {};
  let degradedCount = 0;
  _state.features.forEach((f, id) => {
    if (typeof f.healthCheck === "function") {
      try {
        featureHealth[id] = f.healthCheck();
        if (featureHealth[id].status === "DEGRADED") degradedCount++;
      } catch (e) {
        featureHealth[id] = { status: "ERROR", error: e.message };
        degradedCount++;
      }
    } else {
      featureHealth[id] = {
        status: f.status === FEATURE_STATUS.ERROR ? "UNHEALTHY" : "UNKNOWN"
      };
    }
  });
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (_state.status === STATUS.ERROR) status = "UNHEALTHY";
  else if (passed < total || degradedCount > 0) {
    status = "DEGRADED";
    _emit(KERNEL_EVENTS.HEALTH_DEGRADED, { degradedFeatures: degradedCount });
  }
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    features: featureHealth,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    timestamp: Date.now()
  };
}
function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.status,
    featuresCount: _state.features.size,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    metrics: _state.metrics
  });
}
function exportDiagnostics() {
  const features = {};
  _state.features.forEach((f, id) => {
    features[id] = {
      id: f.id,
      version: f.version,
      status: f.status,
      category: f.category,
      priority: f.priority,
      registeredAt: f.registeredAt,
      enabledAt: f.enabledAt,
      disabledAt: f.disabledAt,
      initDurationMs: f.initDurationMs,
      healthCheck: typeof f.healthCheck === "function" ? (() => {
        try {
          return f.healthCheck();
        } catch (e) {
          return { error: e.message };
        }
      })() : null,
      metrics: typeof f.getMetrics === "function" ? (() => {
        try {
          return f.getMetrics();
        } catch (e) {
          return { error: e.message };
        }
      })() : null
    };
  });
  return {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    kernel: {
      moduleId: MODULE_ID,
      version: VERSION,
      status: _state.status,
      initTime: _state.initTime ? new Date(_state.initTime).toISOString() : null,
      uptime: _state.initTime ? Date.now() - _state.initTime : 0,
      metrics: { ..._state.metrics }
    },
    features,
    healthCheck: healthCheck()
  };
}
const exports = {
  MODULE_ID,
  VERSION,
  STATUS,
  FEATURE_STATUS,
  KERNEL_EVENTS,
  init,
  shutdown,
  registerFeature,
  enableFeature,
  disableFeature,
  listFeatures,
  getFeaturesByStatus,
  getFeature,
  getFeatureMetrics,
  healthCheck,
  info,
  exportDiagnostics,
  injectPorts,
  getPorts
};
var kernel_default = exports;
export {
  FEATURE_STATUS,
  KERNEL_EVENTS,
  MODULE_ID,
  STATUS,
  VERSION,
  kernel_default as default,
  disableFeature,
  enableFeature,
  exportDiagnostics,
  getFeature,
  getFeatureMetrics,
  getFeaturesByStatus,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  listFeatures,
  registerFeature,
  shutdown
};
