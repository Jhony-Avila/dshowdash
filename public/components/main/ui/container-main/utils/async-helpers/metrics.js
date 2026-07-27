const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:metrics";
let _metrics = {
  totalOperations: 0,
  completedOperations: 0,
  timedOutOperations: 0,
  abortedOperations: 0,
  retriedOperations: 0,
  avgDuration: 0,
  durations: []
};
function updateDurationMetrics(duration) {
  _metrics.durations.push(duration);
  if (_metrics.durations.length > 100) _metrics.durations.shift();
  _metrics.avgDuration = _metrics.durations.reduce((a, b) => a + b, 0) / _metrics.durations.length;
}
function incrementTotal() {
  _metrics.totalOperations++;
}
function incrementCompleted() {
  _metrics.completedOperations++;
}
function incrementTimedOut() {
  _metrics.timedOutOperations++;
}
function incrementAborted() {
  _metrics.abortedOperations++;
}
function incrementRetried() {
  _metrics.retriedOperations++;
}
function getMetrics(activeControllers = 0) {
  return {
    ..._metrics,
    activeControllers,
    successRate: _metrics.totalOperations > 0 ? `${(_metrics.completedOperations / _metrics.totalOperations * 100).toFixed(2)}%` : "0%"
  };
}
function resetMetrics() {
  _metrics = {
    totalOperations: 0,
    completedOperations: 0,
    timedOutOperations: 0,
    abortedOperations: 0,
    retriedOperations: 0,
    avgDuration: 0,
    durations: []
  };
}
function healthCheck(activeControllers = 0) {
  const timeoutRate = _metrics.totalOperations > 0 ? _metrics.timedOutOperations / _metrics.totalOperations : 0;
  let status = "HEALTHY";
  if (timeoutRate > 0.3) status = "DEGRADED";
  if (timeoutRate > 0.5) status = "UNHEALTHY";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    activeControllers,
    metrics: getMetrics(activeControllers),
    timeoutRate: `${(timeoutRate * 100).toFixed(2)}%`
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["getMetrics", "resetMetrics", "healthCheck"]
  };
}
var metrics_default = {
  VERSION,
  MODULE_ID,
  updateDurationMetrics,
  incrementTotal,
  incrementCompleted,
  incrementTimedOut,
  incrementAborted,
  incrementRetried,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  metrics_default as default,
  getMetrics,
  healthCheck,
  incrementAborted,
  incrementCompleted,
  incrementRetried,
  incrementTimedOut,
  incrementTotal,
  info,
  resetMetrics,
  updateDurationMetrics
};
