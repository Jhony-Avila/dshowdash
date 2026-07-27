import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { OVERLAY_EVENTS } from "/core/runtime/events/catalog/overlay.events.js";
import * as RuntimeIntegration from "./runtime-integration.js";
import * as PermissionGate from "./overlay-permission-gate.js";
import * as DegradationPolicy from "./degradation-policy.js";
import * as OverlayManifest from "./overlay-manifest.js";
const MODULE_ID = "overlay-kernel";
const VERSION = "3.0.0-ELEVATION";
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
const STATUS = { IDLE: "idle", INITIALIZING: "initializing", READY: "ready", DEGRADED: "degraded", SHUTDOWN: "shutdown", ERROR: "error" };
const ADAPTER_STATUS = { REGISTERED: "registered", ENABLED: "enabled", DISABLED: "disabled", DEGRADED: "degraded", ERROR: "error" };
const PRIORITY = { critical: 100, high: 75, normal: 50, low: 25 };
const _state = {
  status: STATUS.IDLE,
  adapters: /* @__PURE__ */ new Map(),
  stack: [],
  idCounter: 0,
  initTime: null,
  shutdownTime: null,
  errors: [],
  runtimeIntegrated: false,
  currentMode: "INITIALIZING",
  metrics: {
    inits: 0,
    shutdowns: 0,
    adapterRegistrations: 0,
    opens: 0,
    closes: 0,
    adapterErrors: 0,
    permissionDenials: 0,
    policyBlocks: 0
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
      status: _state.status,
      mode: _state.currentMode
    },
    errors: errors || []
  };
}
function _health(status, score, checks, issues) {
  return {
    status,
    score,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: checks || {},
    issues: issues || [],
    metrics: metrics().data,
    mode: _state.currentMode,
    runtimeIntegrated: _state.runtimeIntegrated,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
    if (tk && tk.register) {
      tk.register({ id: MODULE_ID, version: VERSION, healthCheck, info });
    }
    if (ctx && (ctx.applicationKernel || ctx.runtimeContext)) {
      const runtimeCtx = ctx.runtimeContext || {
        applicationKernel: ctx.applicationKernel,
        eventBus: ctx.eventBus || _getPort("eventBus"),
        permissionsGuard: ctx.permissionsGuard,
        healthAggregator: ctx.healthAggregator
      };
      const integrationResult = RuntimeIntegration.init(runtimeCtx);
      if (integrationResult.ok) {
        _state.runtimeIntegrated = true;
        _state.currentMode = RuntimeIntegration.getMode();
      }
    } else {
      PermissionGate.init({
        eventBus: _getPort("eventBus")
      });
    }
    _state.status = STATUS.READY;
    _track("kernel:init", {
      version: VERSION,
      runtimeIntegrated: _state.runtimeIntegrated,
      mode: _state.currentMode
    });
    _emit(OVERLAY_EVENTS.KERNEL_READY, {
      version: VERSION,
      runtimeIntegrated: _state.runtimeIntegrated,
      mode: _state.currentMode
    });
    return _envelope(true, {
      initialized: true,
      version: VERSION,
      status: _state.status,
      runtimeIntegrated: _state.runtimeIntegrated,
      mode: _state.currentMode
    });
  } catch (e) {
    _state.status = STATUS.ERROR;
    _state.errors.push({ code: "INIT_ERROR", message: e.message, timestamp: Date.now() });
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
}
function shutdown(reason) {
  if (_state.status === STATUS.SHUTDOWN) return _envelope(true, { alreadyShutdown: true });
  try {
    closeAll();
    _state.adapters.forEach((a, id) => {
      if (a.status === ADAPTER_STATUS.ENABLED) disableAdapter(id, "kernel_shutdown");
    });
    if (_state.runtimeIntegrated) {
      RuntimeIntegration.shutdown(reason);
    }
    _state.shutdownTime = Date.now();
    _state.metrics.shutdowns++;
    _state.status = STATUS.SHUTDOWN;
    _state.runtimeIntegrated = false;
    _track("kernel:shutdown", {
      reason: reason || "manual",
      uptime: _state.shutdownTime - _state.initTime
    });
    _emit(OVERLAY_EVENTS.KERNEL_SHUTDOWN, { reason });
    return _envelope(true, { shutdown: true, reason });
  } catch (e) {
    _state.errors.push({ code: "SHUTDOWN_ERROR", message: e.message, timestamp: Date.now() });
    return _envelope(false, null, [{ code: "SHUTDOWN_ERROR", message: e.message }]);
  }
}
function registerAdapter(adapterDef) {
  if (!adapterDef || !adapterDef.id) {
    return _envelope(false, null, [{ code: "INVALID_ADAPTER", message: "Adapter must have id" }]);
  }
  const id = adapterDef.id;
  const existing = _state.adapters.get(id);
  const adapter = {
    id,
    version: adapterDef.version || "0.0.0",
    type: adapterDef.type || "custom",
    priority: adapterDef.priority || "normal",
    instance: adapterDef,
    status: ADAPTER_STATUS.REGISTERED,
    registeredAt: existing ? existing.registeredAt : Date.now(),
    enabledAt: null,
    lastError: null,
    errorCount: 0,
    openCount: 0,
    closeCount: 0
  };
  _state.adapters.set(id, adapter);
  _state.metrics.adapterRegistrations++;
  _track("adapter:registered", { adapterId: id, type: adapter.type });
  _emit(OVERLAY_EVENTS.ADAPTER_REGISTERED, { adapterId: id });
  return _envelope(true, { adapterId: id, registered: true });
}
function enableAdapter(adapterId, opts) {
  const adapter = _state.adapters.get(adapterId);
  if (!adapter) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${adapterId}` }]);
  if (adapter.status === ADAPTER_STATUS.ENABLED) return _envelope(true, { adapterId, alreadyEnabled: true });
  try {
    if (adapter.instance && typeof adapter.instance.init === "function") {
      const ctx = Object.assign({ ports: Ports.snapshot() }, opts || {});
      const result = adapter.instance.init(ctx);
      if (result && !result.ok) {
        adapter.status = ADAPTER_STATUS.ERROR;
        adapter.lastError = result.errors[0];
        adapter.errorCount++;
        return result;
      }
    }
    adapter.status = ADAPTER_STATUS.ENABLED;
    adapter.enabledAt = Date.now();
    _track("adapter:enabled", { adapterId });
    _emit(OVERLAY_EVENTS.ADAPTER_ENABLED, { adapterId });
    return _envelope(true, { adapterId, enabled: true });
  } catch (e) {
    adapter.status = ADAPTER_STATUS.ERROR;
    adapter.lastError = { code: "ENABLE_ERROR", message: e.message };
    adapter.errorCount++;
    _state.metrics.adapterErrors++;
    return _envelope(false, null, [{ code: "ENABLE_ERROR", message: e.message }]);
  }
}
function disableAdapter(adapterId, reason) {
  const adapter = _state.adapters.get(adapterId);
  if (!adapter) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${adapterId}` }]);
  if (adapter.status === ADAPTER_STATUS.DISABLED) return _envelope(true, { adapterId, alreadyDisabled: true });
  _state.stack = _state.stack.filter((item) => {
    if (item.adapterId === adapterId) {
      try {
        if (adapter.instance && adapter.instance.close) adapter.instance.close(item.handle);
      } catch (e) {
      }
      return false;
    }
    return true;
  });
  if (adapter.instance && typeof adapter.instance.cleanup === "function") {
    try {
      adapter.instance.cleanup();
    } catch (e) {
    }
  }
  adapter.status = ADAPTER_STATUS.DISABLED;
  _emit(OVERLAY_EVENTS.ADAPTER_DISABLED, { adapterId, reason });
  return _envelope(true, { adapterId, disabled: true });
}
function open(adapterId, payload, options) {
  options = options || {};
  const adapter = _state.adapters.get(adapterId);
  if (!adapter) {
    return _envelope(false, null, [{ code: "ADAPTER_NOT_FOUND", message: `Adapter not found: ${adapterId}` }]);
  }
  if (adapter.status !== ADAPTER_STATUS.ENABLED && adapter.status !== ADAPTER_STATUS.REGISTERED) {
    return _envelope(false, null, [{ code: "ADAPTER_NOT_READY", message: `Adapter not enabled: ${adapterId}` }]);
  }
  if (!options.bypassPermission) {
    const permissionResult = PermissionGate.check({
      typeId: adapterId,
      scope: options.scope || "global",
      capability: options.capability
    });
    if (!permissionResult.allowed) {
      _state.metrics.permissionDenials++;
      _track("overlay:permission-denied", {
        adapterId,
        reason: permissionResult.reason
      });
      return _envelope(false, null, [{
        code: "PERMISSION_DENIED",
        message: `Permission denied: ${permissionResult.reason}`,
        details: permissionResult
      }]);
    }
  }
  if (!options.bypassPolicy) {
    const policyResult = DegradationPolicy.evaluatePolicy(_state.currentMode, adapterId);
    if (policyResult.action === DegradationPolicy.POLICY_ACTIONS.BLOCK) {
      _state.metrics.policyBlocks++;
      _track("overlay:policy-blocked", {
        adapterId,
        mode: _state.currentMode,
        reason: policyResult.reason
      });
      return _envelope(false, null, [{
        code: "POLICY_BLOCKED",
        message: `Blocked by degradation policy in mode: ${_state.currentMode}`,
        details: policyResult
      }]);
    }
  }
  try {
    const handle = `${MODULE_ID}-${++_state.idCounter}`;
    const priority = PRIORITY[adapter.priority] || PRIORITY.normal;
    const stackItem = {
      handle,
      adapterId,
      priority,
      payload,
      openedAt: Date.now(),
      mode: _state.currentMode
    };
    _state.stack.push(stackItem);
    _state.stack.sort((a, b) => b.priority - a.priority);
    if (adapter.instance && typeof adapter.instance.open === "function") {
      const result = adapter.instance.open(payload, handle);
      if (result && !result.ok) {
        _state.stack = _state.stack.filter((i) => i.handle !== handle);
        return result;
      }
    }
    adapter.openCount++;
    _state.metrics.opens++;
    _track("overlay:opened", { handle, adapterId, mode: _state.currentMode });
    _emit(OVERLAY_EVENTS.KERNEL_OPENED, {
      handle,
      adapterId,
      stackDepth: _state.stack.length,
      mode: _state.currentMode
    });
    return _envelope(true, {
      handle,
      adapterId,
      stackDepth: _state.stack.length,
      mode: _state.currentMode
    });
  } catch (e) {
    adapter.errorCount++;
    _state.metrics.adapterErrors++;
    return _envelope(false, null, [{ code: "OPEN_ERROR", message: e.message }]);
  }
}
function close(handle) {
  const idx = _state.stack.findIndex((item) => item.handle === handle);
  if (idx === -1) return _envelope(false, null, [{ code: "HANDLE_NOT_FOUND", message: `Handle not found: ${handle}` }]);
  try {
    const stackItem = _state.stack[idx];
    const adapter = _state.adapters.get(stackItem.adapterId);
    if (adapter && adapter.instance && typeof adapter.instance.close === "function") {
      adapter.instance.close(handle);
    }
    _state.stack.splice(idx, 1);
    if (adapter) adapter.closeCount++;
    _state.metrics.closes++;
    _track("overlay:closed", { handle, adapterId: stackItem.adapterId });
    _emit(OVERLAY_EVENTS.KERNEL_CLOSED, {
      handle,
      adapterId: stackItem.adapterId,
      stackDepth: _state.stack.length
    });
    return _envelope(true, { handle, closed: true, stackDepth: _state.stack.length });
  } catch (e) {
    return _envelope(false, null, [{ code: "CLOSE_ERROR", message: e.message }]);
  }
}
function closeAll() {
  const closed = [];
  while (_state.stack.length > 0) {
    const item = _state.stack.pop();
    const adapter = _state.adapters.get(item.adapterId);
    if (adapter && adapter.instance && typeof adapter.instance.close === "function") {
      try {
        adapter.instance.close(item.handle);
      } catch (e) {
      }
    }
    closed.push(item.handle);
    _state.metrics.closes++;
  }
  return _envelope(true, { closed, count: closed.length });
}
function listStack() {
  const list = _state.stack.map((item) => ({
    handle: item.handle,
    adapterId: item.adapterId,
    priority: item.priority,
    openedAt: item.openedAt,
    mode: item.mode
  }));
  return _envelope(true, { stack: list, depth: list.length });
}
function listAdapters() {
  const list = [];
  _state.adapters.forEach((a) => {
    list.push({
      id: a.id,
      version: a.version,
      type: a.type,
      status: a.status,
      openCount: a.openCount,
      errorCount: a.errorCount
    });
  });
  return _envelope(true, { adapters: list, count: list.length });
}
function getAdapterStatus(adapterId) {
  const adapter = _state.adapters.get(adapterId);
  if (!adapter) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${adapterId}` }]);
  let health = null;
  if (adapter.instance && typeof adapter.instance.healthCheck === "function") {
    try {
      health = adapter.instance.healthCheck();
    } catch (e) {
      health = { status: "error", error: e.message };
    }
  }
  return _envelope(true, {
    id: adapter.id,
    version: adapter.version,
    type: adapter.type,
    status: adapter.status,
    openCount: adapter.openCount,
    closeCount: adapter.closeCount,
    errorCount: adapter.errorCount,
    lastError: adapter.lastError,
    health
  });
}
function getMode() {
  return _state.currentMode;
}
function isRuntimeIntegrated() {
  return _state.runtimeIntegrated;
}
function canOpenOverlay(typeId, options) {
  if (_state.runtimeIntegrated) {
    return RuntimeIntegration.canOpenOverlay(typeId, options);
  }
  return PermissionGate.check(Object.assign({ typeId }, options || {}));
}
function getManifestInfo() {
  return OverlayManifest.info();
}
function getPolicyInfo() {
  return DegradationPolicy.info();
}
function getPermissionGateInfo() {
  return PermissionGate.info();
}
function metrics() {
  let enabledCount = 0, errorCount = 0;
  _state.adapters.forEach((a) => {
    if (a.status === ADAPTER_STATUS.ENABLED) enabledCount++;
    else if (a.status === ADAPTER_STATUS.ERROR) errorCount++;
  });
  return _envelope(true, {
    kernelStatus: _state.status,
    mode: _state.currentMode,
    runtimeIntegrated: _state.runtimeIntegrated,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    adaptersTotal: _state.adapters.size,
    adaptersEnabled: enabledCount,
    adaptersError: errorCount,
    stackDepth: _state.stack.length,
    counters: _state.metrics,
    errorsRecorded: _state.errors.length
  });
}
function healthCheck() {
  const m = metrics().data;
  const checks = {
    initialized: { ok: _state.status === STATUS.READY, severity: "crit" },
    adaptersLoaded: { ok: _state.adapters.size > 0, severity: "warn" },
    stackHealthy: { ok: _state.stack.length < 10, severity: "warn" },
    noAdapterErrors: { ok: m.adaptersError === 0, severity: "warn" },
    runtimeIntegrated: { ok: _state.runtimeIntegrated, severity: "info" },
    permissionGateReady: { ok: PermissionGate.isInitialized(), severity: "warn" }
  };
  const issues = [];
  let score = 100;
  if (_state.status !== STATUS.READY) {
    issues.push({ code: "NOT_READY", severity: "crit", message: `Kernel status: ${_state.status}` });
    score -= 50;
  }
  if (_state.adapters.size === 0) {
    issues.push({ code: "NO_ADAPTERS", severity: "warn", message: "No adapters registered" });
    score -= 10;
  }
  if (_state.stack.length >= 10) {
    issues.push({ code: "STACK_OVERFLOW", severity: "warn", message: "Stack depth >= 10" });
    score -= 20;
  }
  if (m.adaptersError > 0) {
    issues.push({ code: "ADAPTERS_ERROR", severity: "warn", message: `${m.adaptersError} adapters in error state` });
    score -= 15;
  }
  if (!_state.runtimeIntegrated) {
    issues.push({ code: "NOT_RUNTIME_INTEGRATED", severity: "info", message: "Running in standalone mode" });
  }
  const status = score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY";
  let subModulesHealth = null;
  if (_state.runtimeIntegrated) {
    subModulesHealth = RuntimeIntegration.getAggregatedHealth();
  }
  return _health(status, Math.max(0, score), checks, issues);
}
function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.status,
    mode: _state.currentMode,
    runtimeIntegrated: _state.runtimeIntegrated,
    capabilities: {
      supportsFeatures: false,
      supportsAdapters: true,
      supportsDegradedMode: true,
      supportsHotReload: true,
      supportsRuntimeIntegration: true,
      supportsUARPS: true,
      supportsDegradationPolicies: true
    },
    adaptersCount: _state.adapters.size,
    stackDepth: _state.stack.length,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    portsInitialized: Ports.isInitialized(),
    subModules: {
      manifest: OverlayManifest.VERSION,
      permissionGate: PermissionGate.VERSION,
      degradationPolicy: DegradationPolicy.VERSION,
      runtimeIntegration: RuntimeIntegration.VERSION
    }
  });
}
function cleanup() {
  return shutdown("cleanup");
}
if (typeof window !== "undefined") {
  window.OverlayKernel = {
    // Identity
    MODULE_ID,
    VERSION,
    STATUS,
    PRIORITY,
    // Lifecycle
    init,
    shutdown,
    cleanup,
    // Adapter management
    registerAdapter,
    enableAdapter,
    disableAdapter,
    listAdapters,
    getAdapterStatus,
    // Stack operations
    open,
    close,
    closeAll,
    listStack,
    // Runtime integration (NOVO)
    getMode,
    isRuntimeIntegrated,
    canOpenOverlay,
    getManifestInfo,
    getPolicyInfo,
    getPermissionGateInfo,
    // Diagnostics
    healthCheck,
    info,
    metrics,
    // Ports
    injectPorts,
    getPorts
  };
}
var kernel_default = {
  MODULE_ID,
  VERSION,
  init,
  shutdown,
  cleanup,
  registerAdapter,
  enableAdapter,
  disableAdapter,
  listAdapters,
  getAdapterStatus,
  open,
  close,
  closeAll,
  listStack,
  getMode,
  isRuntimeIntegrated,
  canOpenOverlay,
  getManifestInfo,
  getPolicyInfo,
  getPermissionGateInfo,
  healthCheck,
  info,
  metrics,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  PRIORITY,
  STATUS,
  VERSION,
  canOpenOverlay,
  cleanup,
  close,
  closeAll,
  kernel_default as default,
  disableAdapter,
  enableAdapter,
  getAdapterStatus,
  getManifestInfo,
  getMode,
  getPermissionGateInfo,
  getPolicyInfo,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isRuntimeIntegrated,
  listAdapters,
  listStack,
  metrics,
  open,
  registerAdapter,
  shutdown
};
