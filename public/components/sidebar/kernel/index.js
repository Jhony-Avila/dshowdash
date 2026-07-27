import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "sidebar-kernel";
const VERSION = "3.1.0-ES6";
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
  READY: "sidebar-kernel:ready",
  SHUTDOWN: "sidebar-kernel:shutdown",
  FEATURE_REGISTERED: "sidebar-kernel:feature:registered",
  FEATURE_ENABLED: "sidebar-kernel:feature:enabled",
  FEATURE_DISABLED: "sidebar-kernel:feature:disabled",
  FEATURE_ERROR: "sidebar-kernel:feature:error",
  HEALTH_DEGRADED: "sidebar-kernel:health:degraded"
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
  errors: [],
  metrics: {
    inits: 0,
    shutdowns: 0,
    featureRegistrations: 0,
    featureEnables: 0,
    featureDisables: 0,
    featureErrors: 0,
    dependencyChecks: 0,
    cascadeDisables: 0,
    totalInitTimeMs: 0
  }
};
function _envelope(ok, data, errors) {
  return {
    ok,
    data: data || null,
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
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _emit(eventName, data) {
  try {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
  } catch (e) {
  }
}
function _getDependents(featureId) {
  const dependents = [];
  _state.features.forEach((f, id) => {
    if (f.dependencies && f.dependencies.indexOf(featureId) > -1) {
      dependents.push(id);
    }
  });
  return dependents;
}
function _validateDependenciesRecursive(featureId, visited) {
  if (!visited) visited = /* @__PURE__ */ new Set();
  if (visited.has(featureId)) return { ok: true, missing: [] };
  visited.add(featureId);
  const f = _state.features.get(featureId);
  if (!f) return { ok: false, missing: [featureId] };
  let missing = [];
  const deps = f.dependencies || [];
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const d = _state.features.get(dep);
    if (!d) {
      missing.push(`${dep} (not registered)`);
    } else if (d.status !== FEATURE_STATUS.ENABLED) {
      missing.push(`${dep} (not enabled)`);
    } else {
      const subResult = _validateDependenciesRecursive(dep, visited);
      if (!subResult.ok) {
        missing = missing.concat(subResult.missing);
      }
    }
  }
  _state.metrics.dependencyChecks++;
  return { ok: missing.length === 0, missing };
}
function _getCascadeAffected(featureId, visited) {
  if (!visited) visited = /* @__PURE__ */ new Set();
  if (visited.has(featureId)) return [];
  visited.add(featureId);
  let affected = [];
  const dependents = _getDependents(featureId);
  for (let i = 0; i < dependents.length; i++) {
    const depId = dependents[i];
    const depFeature = _state.features.get(depId);
    if (depFeature && depFeature.status === FEATURE_STATUS.ENABLED) {
      affected.push(depId);
      const subAffected = _getCascadeAffected(depId, visited);
      affected = affected.concat(subAffected);
    }
  }
  return affected;
}
function init(ctx) {
  if (_state.status === STATUS.READY) return _envelope(true, { alreadyInitialized: true });
  if (_state.status === STATUS.INITIALIZING) return _envelope(false, null, [{ code: "INIT_IN_PROGRESS", message: "Initialization in progress" }]);
  _state.status = STATUS.INITIALIZING;
  try {
    _initPorts();
    if (ctx && ctx.ports) Ports.inject(ctx.ports);
    _state.initTime = Date.now();
    _state.shutdownTime = null;
    _state.metrics.inits++;
    const tk = _getPort("telemetry");
    if (tk && tk.register) tk.register({ id: MODULE_ID, version: VERSION, healthCheck, info });
    _state.status = STATUS.READY;
    _track("kernel:init", { version: VERSION });
    _emit(KERNEL_EVENTS.READY, { version: VERSION, featuresCount: _state.features.size });
    _emit(SIDEBAR_EVENTS.KERNEL_READY, { version: VERSION, featuresCount: _state.features.size });
    if (typeof window !== "undefined") {
      window.SidebarKernel = moduleExports;
    }
    return _envelope(true, { initialized: true, version: VERSION, status: _state.status });
  } catch (e) {
    _state.status = STATUS.ERROR;
    _state.errors.push({ code: "INIT_ERROR", message: e.message, timestamp: Date.now() });
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
}
function shutdown(reason) {
  if (_state.status === STATUS.SHUTDOWN) return _envelope(true, { alreadyShutdown: true });
  try {
    _state.features.forEach((f, id) => {
      if (f.status === FEATURE_STATUS.ENABLED) {
        try {
          disableFeature(id, "kernel_shutdown");
        } catch (e) {
        }
      }
    });
    _state.shutdownTime = Date.now();
    _state.metrics.shutdowns++;
    _state.status = STATUS.SHUTDOWN;
    _track("kernel:shutdown", { reason: reason || "manual", uptime: _state.shutdownTime - _state.initTime });
    _emit(KERNEL_EVENTS.SHUTDOWN, { reason: reason || "manual" });
    _emit(SIDEBAR_EVENTS.KERNEL_SHUTDOWN, { reason });
    if (typeof window !== "undefined" && window.SidebarKernel) {
      delete window.SidebarKernel;
    }
    return _envelope(true, { shutdown: true, reason: reason || "manual", uptime: _state.shutdownTime - _state.initTime });
  } catch (e) {
    _state.errors.push({ code: "SHUTDOWN_ERROR", message: e.message, timestamp: Date.now() });
    return _envelope(false, null, [{ code: "SHUTDOWN_ERROR", message: e.message }]);
  }
}
function cleanup() {
  return shutdown("cleanup");
}
function registerFeature(featureDef) {
  if (!featureDef || !featureDef.id) return _envelope(false, null, [{ code: "INVALID_FEATURE", message: "Feature must have id" }]);
  const id = featureDef.id;
  const existing = _state.features.get(id);
  const feature = {
    id,
    version: featureDef.version || "0.0.0",
    category: featureDef.category || "general",
    priority: featureDef.priority !== void 0 ? featureDef.priority : 2,
    dependencies: featureDef.dependencies || [],
    capabilities: featureDef.capabilities || {},
    instance: featureDef,
    status: FEATURE_STATUS.REGISTERED,
    registeredAt: existing ? existing.registeredAt : Date.now(),
    enabledAt: null,
    disabledAt: null,
    initDurationMs: null,
    lastError: null,
    errorCount: 0,
    initCount: 0
  };
  _state.features.set(id, feature);
  _state.metrics.featureRegistrations++;
  _track("feature:registered", { featureId: id, version: feature.version });
  _emit(KERNEL_EVENTS.FEATURE_REGISTERED, { featureId: id, version: feature.version });
  return _envelope(true, { featureId: id, registered: true, status: feature.status });
}
function enableFeature(featureId, opts) {
  const feature = _state.features.get(featureId);
  if (!feature) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Feature not found: ${featureId}` }]);
  if (feature.status === FEATURE_STATUS.ENABLED) return _envelope(true, { featureId, alreadyEnabled: true });
  const depValidation = _validateDependenciesRecursive(featureId);
  if (!depValidation.ok) {
    return _envelope(false, null, [{
      code: "DEPENDENCY_NOT_MET",
      message: `Dependencies not satisfied: ${depValidation.missing.join(", ")}`
    }]);
  }
  try {
    const startTime = Date.now();
    const ctx = Object.assign({ ports: Ports.snapshot() }, opts || {});
    if (feature.instance && typeof feature.instance.init === "function") {
      const result = feature.instance.init(ctx);
      if (result && !result.ok) {
        feature.status = FEATURE_STATUS.ERROR;
        feature.lastError = result.errors && result.errors[0] || { code: "INIT_FAILED", message: "Unknown error" };
        feature.errorCount++;
        _state.metrics.featureErrors++;
        _emit(KERNEL_EVENTS.FEATURE_ERROR, { featureId, error: feature.lastError });
        return result;
      }
    }
    feature.status = FEATURE_STATUS.ENABLED;
    feature.enabledAt = Date.now();
    feature.initDurationMs = Date.now() - startTime;
    feature.initCount++;
    _state.metrics.featureEnables++;
    _state.metrics.totalInitTimeMs += feature.initDurationMs;
    _track("feature:enabled", { featureId, initDurationMs: feature.initDurationMs });
    _emit(KERNEL_EVENTS.FEATURE_ENABLED, { featureId, initDurationMs: feature.initDurationMs });
    return _envelope(true, { featureId, enabled: true, initDurationMs: feature.initDurationMs });
  } catch (e) {
    feature.status = FEATURE_STATUS.ERROR;
    feature.lastError = { code: "ENABLE_ERROR", message: e.message };
    feature.errorCount++;
    _state.metrics.featureErrors++;
    _state.status = STATUS.DEGRADED;
    _emit(KERNEL_EVENTS.FEATURE_ERROR, { featureId, error: e.message });
    return _envelope(false, null, [{ code: "ENABLE_ERROR", message: e.message }]);
  }
}
function disableFeature(featureId, reason, options) {
  const feature = _state.features.get(featureId);
  if (!feature) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Feature not found: ${featureId}` }]);
  if (feature.status === FEATURE_STATUS.DISABLED) return _envelope(true, { featureId, alreadyDisabled: true });
  const opts = options || {};
  const cascadeDisabled = [];
  const affected = _getCascadeAffected(featureId);
  if (affected.length > 0) {
    if (opts.cascade) {
      for (let i = affected.length - 1; i >= 0; i--) {
        const affectedId = affected[i];
        const affectedFeature = _state.features.get(affectedId);
        if (affectedFeature && affectedFeature.status === FEATURE_STATUS.ENABLED) {
          try {
            if (affectedFeature.instance && typeof affectedFeature.instance.cleanup === "function") {
              affectedFeature.instance.cleanup();
            }
            affectedFeature.status = FEATURE_STATUS.DISABLED;
            affectedFeature.disabledAt = Date.now();
            cascadeDisabled.push(affectedId);
            _state.metrics.cascadeDisables++;
            _emit(KERNEL_EVENTS.FEATURE_DISABLED, { featureId: affectedId, reason: `cascade:${featureId}` });
          } catch (e) {
          }
        }
      }
    } else {
      return _envelope(false, null, [{
        code: "HAS_DEPENDENTS",
        message: `Features depend on this: ${affected.join(", ")}`,
        dependents: affected
      }]);
    }
  }
  try {
    if (feature.instance && typeof feature.instance.cleanup === "function") {
      feature.instance.cleanup();
    }
    feature.status = FEATURE_STATUS.DISABLED;
    feature.disabledAt = Date.now();
    _state.metrics.featureDisables++;
    _track("feature:disabled", { featureId, reason });
    _emit(KERNEL_EVENTS.FEATURE_DISABLED, { featureId, reason: reason || "manual" });
    return _envelope(true, { featureId, disabled: true, reason, cascadeDisabled });
  } catch (e) {
    feature.lastError = { code: "DISABLE_ERROR", message: e.message };
    return _envelope(false, null, [{ code: "DISABLE_ERROR", message: e.message }]);
  }
}
function unregisterFeature(featureId) {
  const feature = _state.features.get(featureId);
  if (!feature) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Feature not found: ${featureId}` }]);
  if (feature.status === FEATURE_STATUS.ENABLED) {
    disableFeature(featureId, "unregister", { cascade: true });
  }
  _state.features.delete(featureId);
  _emit(SIDEBAR_EVENTS.KERNEL_FEATURE_UNREGISTERED, { featureId });
  return _envelope(true, { featureId, unregistered: true });
}
function canDisable(featureId) {
  const f = _state.features.get(featureId);
  if (!f) return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  const affected = _getCascadeAffected(featureId);
  return _envelope(true, { featureId, canDisable: affected.length === 0, dependents: affected });
}
function getDependents(featureId) {
  const f = _state.features.get(featureId);
  if (!f) return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  const all = _getDependents(featureId);
  const enabled = all.filter((depId) => {
    const dep = _state.features.get(depId);
    return dep && dep.status === FEATURE_STATUS.ENABLED;
  });
  return _envelope(true, { featureId, dependents: all, enabledDependents: enabled });
}
function validateDependencies(featureId) {
  const f = _state.features.get(featureId);
  if (!f) return _envelope(false, null, [{ code: "NOT_FOUND" }]);
  const result = _validateDependenciesRecursive(featureId);
  return _envelope(true, { featureId, valid: result.ok, missing: result.missing, dependencies: f.dependencies });
}
function listFeatures() {
  const list = [];
  _state.features.forEach((f) => {
    list.push({
      id: f.id,
      version: f.version,
      category: f.category,
      priority: f.priority,
      status: f.status,
      errorCount: f.errorCount,
      enabledAt: f.enabledAt,
      initDurationMs: f.initDurationMs
    });
  });
  return _envelope(true, { features: list, count: list.length });
}
function getFeaturesByStatus(status) {
  const list = [];
  _state.features.forEach((f) => {
    if (f.status === status) {
      list.push({
        id: f.id,
        version: f.version,
        category: f.category,
        enabledAt: f.enabledAt,
        initDurationMs: f.initDurationMs
      });
    }
  });
  return _envelope(true, { status, features: list, count: list.length });
}
function getFeatureStatus(featureId) {
  const feature = _state.features.get(featureId);
  if (!feature) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Feature not found: ${featureId}` }]);
  let health = null;
  if (feature.instance && typeof feature.instance.healthCheck === "function") {
    try {
      health = feature.instance.healthCheck();
    } catch (e) {
      health = { status: "error", error: e.message };
    }
  }
  return _envelope(true, {
    id: feature.id,
    version: feature.version,
    status: feature.status,
    category: feature.category,
    priority: feature.priority,
    dependencies: feature.dependencies,
    errorCount: feature.errorCount,
    lastError: feature.lastError,
    enabledAt: feature.enabledAt,
    disabledAt: feature.disabledAt,
    initDurationMs: feature.initDurationMs,
    health
  });
}
function getFeature(featureId) {
  return getFeatureStatus(featureId);
}
function getFeatureMetrics() {
  const featureMetrics = {};
  const totals = { registered: 0, enabled: 0, disabled: 0, error: 0 };
  _state.features.forEach((f, id) => {
    if (f.status === FEATURE_STATUS.REGISTERED) totals.registered++;
    else if (f.status === FEATURE_STATUS.ENABLED) totals.enabled++;
    else if (f.status === FEATURE_STATUS.DISABLED) totals.disabled++;
    else if (f.status === FEATURE_STATUS.ERROR) totals.error++;
    if (f.instance && typeof f.instance.getMetrics === "function") {
      try {
        featureMetrics[id] = f.instance.getMetrics();
      } catch (e) {
        featureMetrics[id] = { error: e.message };
      }
    } else {
      featureMetrics[id] = { initDurationMs: f.initDurationMs };
    }
  });
  return _envelope(true, { kernel: Object.assign({}, _state.metrics), features: featureMetrics, totals });
}
function metrics() {
  let enabledCount = 0, disabledCount = 0, errorCount = 0;
  _state.features.forEach((f) => {
    if (f.status === FEATURE_STATUS.ENABLED) enabledCount++;
    else if (f.status === FEATURE_STATUS.DISABLED) disabledCount++;
    else if (f.status === FEATURE_STATUS.ERROR) errorCount++;
  });
  return _envelope(true, {
    kernelStatus: _state.status,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    featuresTotal: _state.features.size,
    featuresEnabled: enabledCount,
    featuresDisabled: disabledCount,
    featuresError: errorCount,
    counters: _state.metrics,
    errorsRecorded: _state.errors.length
  });
}
function healthCheck() {
  const m = metrics().data;
  const checks = {
    initialized: _state.status === STATUS.READY,
    notInError: _state.status !== STATUS.ERROR,
    hasFeatures: _state.features.size > 0,
    portsInitialized: Ports.isInitialized()
  };
  const featureHealth = {};
  let degradedCount = 0;
  _state.features.forEach((f, id) => {
    if (f.instance && typeof f.instance.healthCheck === "function") {
      try {
        featureHealth[id] = f.instance.healthCheck();
        if (featureHealth[id].status === "DEGRADED") degradedCount++;
      } catch (e) {
        featureHealth[id] = { status: "ERROR", error: e.message };
        degradedCount++;
      }
    } else {
      featureHealth[id] = { status: f.status === FEATURE_STATUS.ERROR ? "UNHEALTHY" : "UNKNOWN" };
    }
  });
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const score = Math.round(passed / total * 100);
  let status = "HEALTHY";
  if (_state.status === STATUS.ERROR) status = "UNHEALTHY";
  else if (passed < total || degradedCount > 0 || m.featuresError > 0) {
    status = "DEGRADED";
    _emit(KERNEL_EVENTS.HEALTH_DEGRADED, { degradedFeatures: degradedCount });
  }
  return {
    status,
    score,
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    features: featureHealth,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    portsInitialized: Ports.isInitialized(),
    issues: m.featuresError > 0 ? [{ code: "FEATURES_ERROR", message: `${m.featuresError} features in error state` }] : [],
    timestamp: Date.now()
  };
}
function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.status,
    portsInitialized: Ports.isInitialized(),
    capabilities: {
      supportsFeatures: true,
      supportsAdapters: false,
      supportsDegradedMode: true,
      supportsHotReload: true,
      supportsDependencyCascade: true,
      supportsCircuitBreaker: true
    },
    featuresCount: _state.features.size,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0
  });
}
function exportDiagnostics() {
  const features = {};
  _state.features.forEach((f, id) => {
    let hc = null;
    let m = null;
    if (f.instance && typeof f.instance.healthCheck === "function") {
      try {
        hc = f.instance.healthCheck();
      } catch (e) {
        hc = { error: e.message };
      }
    }
    if (f.instance && typeof f.instance.getMetrics === "function") {
      try {
        m = f.instance.getMetrics();
      } catch (e) {
        m = { error: e.message };
      }
    }
    features[id] = {
      id: f.id,
      version: f.version,
      status: f.status,
      category: f.category,
      priority: f.priority,
      dependencies: f.dependencies,
      registeredAt: f.registeredAt,
      enabledAt: f.enabledAt,
      disabledAt: f.disabledAt,
      initDurationMs: f.initDurationMs,
      errorCount: f.errorCount,
      lastError: f.lastError,
      healthCheck: hc,
      metrics: m
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
      metrics: Object.assign({}, _state.metrics),
      errors: _state.errors.slice()
    },
    features,
    healthCheck: healthCheck()
  };
}
const moduleExports = {
  MODULE_ID,
  VERSION,
  STATUS,
  FEATURE_STATUS,
  KERNEL_EVENTS,
  init,
  shutdown,
  cleanup,
  registerFeature,
  unregisterFeature,
  enableFeature,
  disableFeature,
  canDisable,
  getDependents,
  validateDependencies,
  listFeatures,
  getFeaturesByStatus,
  getFeatureStatus,
  getFeature,
  getFeatureMetrics,
  metrics,
  healthCheck,
  info,
  exportDiagnostics,
  injectPorts,
  getPorts
};
var kernel_default = moduleExports;
export {
  FEATURE_STATUS,
  KERNEL_EVENTS,
  MODULE_ID,
  STATUS,
  VERSION,
  canDisable,
  cleanup,
  kernel_default as default,
  disableFeature,
  enableFeature,
  exportDiagnostics,
  getDependents,
  getFeature,
  getFeatureMetrics,
  getFeatureStatus,
  getFeaturesByStatus,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  listFeatures,
  metrics,
  registerFeature,
  shutdown,
  unregisterFeature,
  validateDependencies
};
