import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.table-engine.utils.performance";
const VERSION = "2.1.1-P17WI";
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
const _metrics = { measurements: 0, avgRenderTime: 0, peakRenderTime: 0 };
let _timings = [];
const MAX_TIMINGS = 100;
function startMeasure(label) {
  return { label, start: performance.now() };
}
function endMeasure(measure) {
  if (!measure || !measure.start) return null;
  const duration = performance.now() - measure.start;
  _metrics.measurements++;
  _timings.push({ label: measure.label, duration, timestamp: Date.now() });
  if (_timings.length > MAX_TIMINGS) _timings.shift();
  if (duration > _metrics.peakRenderTime) _metrics.peakRenderTime = duration;
  const total = _timings.reduce((sum, t) => sum + t.duration, 0);
  _metrics.avgRenderTime = Math.round(total / _timings.length);
  return { label: measure.label, duration };
}
function measureAsync(label, fn) {
  const measure = startMeasure(label);
  return Promise.resolve().then(fn).then((result) => {
    endMeasure(measure);
    return result;
  });
}
function getTimings(limit) {
  return _timings.slice(-(limit || 20));
}
function clearTimings() {
  _timings = [];
  _metrics.peakRenderTime = 0;
  _metrics.avgRenderTime = 0;
  return { ok: true };
}
function debounce(fn, delay) {
  let timer = null;
  return function() {
    const args = arguments;
    const ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(ctx, args);
    }, delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return function() {
    const args = arguments;
    const ctx = this;
    if (!inThrottle) {
      fn.apply(ctx, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timingsCount: _timings.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var performance_default = { MODULE_ID, VERSION, init, startMeasure, endMeasure, measureAsync, getTimings, clearTimings, debounce, throttle, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clearTimings,
  debounce,
  performance_default as default,
  endMeasure,
  getPorts,
  getTimings,
  healthCheck,
  info,
  init,
  injectPorts,
  measureAsync,
  startMeasure,
  throttle
};
