import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.4.0-MIGRATION-PHASE8";
const MODULE_ID = "panel-nav-admin.performance.monitor";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[PerfMonitor]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function PerformanceMonitor(options = {}) {
  const {
    slowThresholdMs = 500,
    autoReport = false,
    reportIntervalMs = 6e4
  } = options;
  const _marks = /* @__PURE__ */ new Map();
  const _timings = {};
  const _interactions = {
    clicks: 0,
    keystrokes: 0,
    dragDrops: 0,
    formSubmits: 0,
    searches: 0,
    total: 0
  };
  const _slow = [];
  let _mountStart = null;
  let _mountEnd = null;
  let _reportTimer = null;
  if (autoReport) {
    _reportTimer = setInterval(() => {
      _log("info", "Auto-report:", getReport());
    }, Number(reportIntervalMs));
  }
  function markMountStart() {
    _mountStart = performance.now();
  }
  function markMountEnd() {
    _mountEnd = performance.now();
    const duration = _mountStart ? _mountEnd - _mountStart : 0;
    _record("mount", duration);
    return duration;
  }
  function mark(name) {
    const start = performance.now();
    _marks.set(name, start);
    return () => {
      const duration = performance.now() - start;
      _marks.delete(name);
      _record(name, duration);
      if (duration > Number(slowThresholdMs)) {
        _slow.push({ name, duration, timestamp: Date.now() });
        _log("debug", `Slow operation: ${name} took ${duration.toFixed(1)}ms`);
      }
      return duration;
    };
  }
  function _record(name, duration) {
    const timings = _timings;
    if (!timings[name]) {
      timings[name] = { count: 0, total: 0, min: Infinity, max: 0, last: 0 };
    }
    const t = timings[name];
    t.count++;
    t.total += duration;
    t.last = duration;
    if (duration < t.min) t.min = duration;
    if (duration > t.max) t.max = duration;
  }
  function recordInteraction(type) {
    _interactions.total++;
    switch (type) {
      case "click":
        _interactions.clicks++;
        break;
      case "keystroke":
        _interactions.keystrokes++;
        break;
      case "dragDrop":
        _interactions.dragDrops++;
        break;
      case "formSubmit":
        _interactions.formSubmits++;
        break;
      case "search":
        _interactions.searches++;
        break;
    }
  }
  function getTiming(name) {
    const t = _timings[name];
    if (!t) return null;
    return {
      ...t,
      avg: t.count > 0 ? Math.round(t.total / t.count * 100) / 100 : 0
    };
  }
  function getAllTimings() {
    const result = {};
    for (const [name, t] of Object.entries(_timings)) {
      result[name] = {
        ...t,
        avg: t.count > 0 ? Math.round(t.total / t.count * 100) / 100 : 0
      };
    }
    return result;
  }
  function getInteractions() {
    return { ..._interactions };
  }
  function getSlowOperations() {
    return [..._slow];
  }
  function getReport() {
    return {
      mountDuration: _mountStart && _mountEnd ? Math.round(_mountEnd - _mountStart) : null,
      timings: getAllTimings(),
      interactions: getInteractions(),
      slowOperations: _slow.length,
      activeMeasurements: _marks.size
    };
  }
  function reset() {
    _marks.clear();
    for (const key of Object.keys(_timings)) delete _timings[key];
    for (const key of Object.keys(_interactions)) _interactions[key] = 0;
    _slow.length = 0;
    _mountStart = null;
    _mountEnd = null;
  }
  function destroy() {
    if (_reportTimer) {
      clearInterval(_reportTimer);
      _reportTimer = null;
    }
    reset();
  }
  return {
    markMountStart,
    markMountEnd,
    mark,
    recordInteraction,
    getTiming,
    getAllTimings,
    getInteractions,
    getSlowOperations,
    getReport,
    reset,
    destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var monitor_default = { PerformanceMonitor, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PerformanceMonitor,
  VERSION,
  monitor_default as default,
  healthCheck,
  info,
  injectPorts
};
