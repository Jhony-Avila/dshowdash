import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-asaas/utils/timers";
const _timers = /* @__PURE__ */ new Map();
const _intervals = /* @__PURE__ */ new Map();
const _metrics = { timersCreated: 0, intervalsCreated: 0, cleared: 0 };
function setTimeout(fn, delay, id = null) {
  const timerId = window.setTimeout(fn, delay);
  const key = id || `timer-${timerId}`;
  _timers.set(key, timerId);
  _metrics.timersCreated++;
  return key;
}
function clearTimeout(id) {
  if (_timers.has(id)) {
    window.clearTimeout(_timers.get(id));
    _timers.delete(id);
    _metrics.cleared++;
    return true;
  }
  return false;
}
function setInterval(fn, delay, id = null) {
  const intervalId = window.setInterval(fn, delay);
  const key = id || `interval-${intervalId}`;
  _intervals.set(key, intervalId);
  _metrics.intervalsCreated++;
  return key;
}
function clearInterval(id) {
  if (_intervals.has(id)) {
    window.clearInterval(_intervals.get(id));
    _intervals.delete(id);
    _metrics.cleared++;
    return true;
  }
  return false;
}
function clearAll() {
  _timers.forEach((id) => window.clearTimeout(id));
  _timers.clear();
  _intervals.forEach((id) => window.clearInterval(id));
  _intervals.clear();
}
function getActiveCount() {
  return { timers: _timers.size, intervals: _intervals.size };
}
function getMetrics() {
  return { ..._metrics, active: _timers.size + _intervals.size };
}
function resetMetrics() {
  _metrics.timersCreated = 0;
  _metrics.intervalsCreated = 0;
  _metrics.cleared = 0;
}
function healthCheck() {
  const checks = { ready: true, noLeaks: _timers.size + _intervals.size < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, active: getActiveCount(), metrics: getMetrics() };
}
var timers_default = { setTimeout, clearTimeout, setInterval, clearInterval, clearAll, getActiveCount };
export {
  MODULE_ID,
  VERSION,
  clearAll,
  clearInterval,
  clearTimeout,
  timers_default as default,
  getActiveCount,
  getMetrics,
  healthCheck,
  info,
  resetMetrics,
  setInterval,
  setTimeout
};
