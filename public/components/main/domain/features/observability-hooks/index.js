import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const MODULE_ID = "main.feature.observability-hooks";
const VERSION = "1.0.0-ENTERPRISE";
const HOOK_TYPES = Object.freeze({
  BEFORE: "before",
  AFTER: "after",
  ERROR: "error"
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
let _enabled = false;
let _cleanups = [];
const _hooks = {
  before: /* @__PURE__ */ new Map(),
  // operation -> [handlers]
  after: /* @__PURE__ */ new Map(),
  error: /* @__PURE__ */ new Map()
};
let _traces = [];
const MAX_TRACES = 100;
const _metrics = {
  inits: 0,
  hooksRegistered: 0,
  hooksExecuted: 0,
  tracesRecorded: 0,
  errors: 0
};
function _createTrace(operation, phase, data) {
  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    operation,
    phase,
    timestamp: Date.now(),
    data
  };
}
function _recordTrace(trace) {
  _traces.unshift(trace);
  if (_traces.length > MAX_TRACES) {
    _traces.pop();
  }
  _metrics.tracesRecorded++;
}
function _executeHooks(type, operation, context) {
  const hookMap = _hooks[type];
  if (!hookMap) return;
  const handlers = hookMap.get(operation) || [];
  const globalHandlers = hookMap.get("*") || [];
  const allHandlers = handlers.concat(globalHandlers);
  for (let i = 0; i < allHandlers.length; i++) {
    try {
      allHandlers[i](context);
      _metrics.hooksExecuted++;
    } catch (e) {
      _metrics.errors++;
      console.debug("%c[ERROR]%c [ObservabilityHooks] Hook error:", "color:#ef4444;font-weight:bold", "color:inherit", e.message || e);
    }
  }
}
function init(options) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  try {
    _initPorts();
    _metrics.inits++;
    const eb = _getPort("eventBus");
    if (eb && eb.on) {
      const navStartHandler = (data) => {
        const ctx = { event: "navigation:start", data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.BEFORE, "navigation", ctx);
        _recordTrace(_createTrace("navigation", "start", data));
      };
      const navCompleteHandler = (data) => {
        const ctx = { event: "navigation:complete", data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.AFTER, "navigation", ctx);
        _recordTrace(_createTrace("navigation", "complete", data));
      };
      const navErrorHandler = (data) => {
        const ctx = { event: "navigation:error", data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.ERROR, "navigation", ctx);
        _recordTrace(_createTrace("navigation", "error", data));
      };
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_START) {
        eb.on(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        });
      }
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        });
      }
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        });
      }
      const panelMountHandler = (data) => {
        const ctx = { event: "panel:mounted", data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.AFTER, "panel", ctx);
        _recordTrace(_createTrace("panel", "mounted", data));
      };
      if (MAIN_EVENTS && MAIN_EVENTS.PANEL_MOUNTED) {
        eb.on(MAIN_EVENTS.PANEL_MOUNTED, panelMountHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.PANEL_MOUNTED, panelMountHandler);
        });
      }
    }
    _enabled = true;
    return { ok: true, version: VERSION };
  } catch (e) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}
function destroy() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _hooks.before.clear();
  _hooks.after.clear();
  _hooks.error.clear();
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function registerHook(type, operation, handler) {
  if (!_hooks[type]) {
    return () => {
    };
  }
  if (typeof handler !== "function") {
    return () => {
    };
  }
  const hookMap = _hooks[type];
  if (!hookMap.has(operation)) {
    hookMap.set(operation, []);
  }
  hookMap.get(operation).push(handler);
  _metrics.hooksRegistered++;
  return () => {
    const handlers = hookMap.get(operation);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  };
}
function before(operation, handler) {
  return registerHook(HOOK_TYPES.BEFORE, operation, handler);
}
function after(operation, handler) {
  return registerHook(HOOK_TYPES.AFTER, operation, handler);
}
function onError(operation, handler) {
  return registerHook(HOOK_TYPES.ERROR, operation, handler);
}
function trigger(type, operation, context) {
  _executeHooks(type, operation, context || {});
  return { ok: true };
}
function getTraces(limit) {
  return limit ? _traces.slice(0, limit) : _traces.slice();
}
function clearTraces() {
  _traces = [];
  return { ok: true };
}
function getHookCounts() {
  const counts = {};
  for (const type in _hooks) {
    if (_hooks.hasOwnProperty(type)) {
      counts[type] = {};
      _hooks[type].forEach((handlers, operation) => {
        counts[type][operation] = handlers.length;
      });
    }
  }
  return counts;
}
function getMetrics() {
  return Object.assign({}, _metrics, { tracesCount: _traces.length });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    hookTypes: HOOK_TYPES,
    hookCounts: getHookCounts(),
    metrics: getMetrics()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasEventBus: !!_getPort("eventBus"),
    lowErrorRate: _metrics.errors < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  else if (_metrics.errors >= 10) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var observability_hooks_default = {
  MODULE_ID,
  VERSION,
  HOOK_TYPES,
  init,
  destroy,
  cleanup,
  registerHook,
  before,
  after,
  onError,
  trigger,
  getTraces,
  clearTraces,
  getHookCounts,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  after,
  before,
  cleanup,
  clearTraces,
  observability_hooks_default as default,
  destroy,
  getHookCounts,
  getMetrics,
  getPorts,
  getTraces,
  healthCheck,
  info,
  init,
  injectPorts,
  onError,
  registerHook,
  trigger
};
