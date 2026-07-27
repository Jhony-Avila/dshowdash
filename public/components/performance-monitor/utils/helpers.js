const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "performance-monitor-helpers";
function now() {
  return performance?.now?.() ?? Date.now();
}
function measure(name, fn) {
  const start = now();
  const result = fn();
  return { result, duration: now() - start, name };
}
function formatDuration(ms) {
  return ms < 1e3 ? `${ms.toFixed(2)}ms` : `${(ms / 1e3).toFixed(2)}s`;
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, helpers: ["now", "measure", "formatDuration"], timestamp: Date.now() };
}
function calculatePercentile(values, p) {
  if (!values || !values.length) return 0;
  const sorted = values.slice().sort(function(a, b) {
    return a - b;
  });
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
function getMemoryUsage() {
  const perf = performance;
  return perf.memory ? { usedJSHeapSize: perf.memory.usedJSHeapSize, totalJSHeapSize: perf.memory.totalJSHeapSize } : null;
}
let _fpsValue = 0;
let _fpsFrameCount = 0;
let _fpsLastTime = 0;
let _fpsRafId = null;
function _fpsLoop(timestamp) {
  _fpsFrameCount++;
  if (!_fpsLastTime) _fpsLastTime = timestamp;
  const elapsed = timestamp - _fpsLastTime;
  if (elapsed >= 1e3) {
    _fpsValue = Math.round(_fpsFrameCount * 1e3 / elapsed);
    _fpsFrameCount = 0;
    _fpsLastTime = timestamp;
  }
  _fpsRafId = requestAnimationFrame(_fpsLoop);
}
function startFPSMonitor() {
  if (_fpsRafId !== null) return;
  _fpsLastTime = 0;
  _fpsFrameCount = 0;
  _fpsRafId = requestAnimationFrame(_fpsLoop);
}
function stopFPSMonitor() {
  if (_fpsRafId !== null) {
    cancelAnimationFrame(_fpsRafId);
    _fpsRafId = null;
  }
}
function getFPS() {
  return _fpsValue;
}
if (typeof requestAnimationFrame !== "undefined") {
  startFPSMonitor();
}
var helpers_default = { now, measure, formatDuration, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  calculatePercentile,
  helpers_default as default,
  formatDuration,
  getFPS,
  getMemoryUsage,
  healthCheck,
  info,
  measure,
  now,
  startFPSMonitor,
  stopFPSMonitor
};
