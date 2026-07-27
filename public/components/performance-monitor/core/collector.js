const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "performance-monitor-collector";
let _entries = [];
let _observer = null;
function start() {
  if (_observer) return;
  if (!window.PerformanceObserver) return false;
  _observer = new PerformanceObserver((list) => {
    _entries.push(...list.getEntries());
    if (_entries.length > 200) _entries = _entries.slice(-200);
  });
  _observer.observe({ entryTypes: ["paint", "largest-contentful-paint", "layout-shift"] });
  return true;
}
function stop() {
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }
}
function getEntries() {
  return [..._entries];
}
function clear() {
  _entries = [];
}
function healthCheck() {
  const checks = { observerSupported: !!window.PerformanceObserver, collecting: !!_observer };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, entryCount: _entries.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, collecting: !!_observer, entryCount: _entries.length, timestamp: Date.now() };
}
const MetricsCollector = { start, stop, getEntries, clear, healthCheck, info, enableDetailedTracking: function() {
} };
var collector_default = { start, stop, getEntries, clear, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  MetricsCollector,
  VERSION,
  clear,
  collector_default as default,
  getEntries,
  healthCheck,
  info,
  start,
  stop
};
