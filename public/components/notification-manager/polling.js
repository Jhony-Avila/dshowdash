const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "notification-manager-polling";
let _interval = null;
let _metrics = { pollCount: 0 };
function start(callback, intervalMs = 3e4) {
  if (_interval) stop();
  _interval = setInterval(() => {
    if (document.hidden) return;
    _metrics.pollCount++;
    callback?.();
  }, intervalMs);
  return true;
}
function stop() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}
function isRunning() {
  return !!_interval;
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = { running: !!_interval };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, running: isRunning(), metrics: getMetrics(), timestamp: Date.now() };
}
const startPolling = start;
const stopPolling = stop;
function restartPolling() {
  stop();
}
const isPollingActive = isRunning;
function setPollingInterval(ms) {
  return;
}
function forcePoll() {
  return;
}
var polling_default = { start, stop, isRunning, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  polling_default as default,
  forcePoll,
  getMetrics,
  healthCheck,
  info,
  isPollingActive,
  isRunning,
  restartPolling,
  setPollingInterval,
  start,
  startPolling,
  stop,
  stopPolling
};
