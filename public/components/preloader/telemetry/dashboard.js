import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "boot-telemetry-dashboard";
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const _bootHistory = [];
const _MAX_HISTORY = 100;
const _metrics = { totalBoots: 0, successfulBoots: 0, failedBoots: 0, degradedBoots: 0, totalDuration: 0, minDuration: Infinity, maxDuration: 0, avgDuration: 0, p50Duration: 0, p90Duration: 0, p99Duration: 0, lastBootAt: null, phases: {} };
function recordBoot(bootData) {
  const record = { bootId: bootData.bootId || `boot_${Date.now()}`, startTime: bootData.startTime || Date.now(), endTime: bootData.endTime || Date.now(), duration: bootData.duration || bootData.endTime - bootData.startTime, result: bootData.result || "success", exitCode: bootData.exitCode || "boot:complete", phases: bootData.phases || {}, trace: bootData.trace || [], errors: bootData.errors || [], metadata: bootData.metadata || {}, recordedAt: Date.now() };
  _bootHistory.push(record);
  if (_bootHistory.length > _MAX_HISTORY) _bootHistory.shift();
  _updateMetrics(record);
  log.info("Boot recorded", { bootId: record.bootId, duration: record.duration, result: record.result });
  return record;
}
function _updateMetrics(record) {
  _metrics.totalBoots++;
  _metrics.lastBootAt = record.recordedAt;
  _metrics.totalDuration += record.duration;
  if (record.result === "success") _metrics.successfulBoots++;
  else if (record.result === "failed") _metrics.failedBoots++;
  else if (record.result === "degraded") _metrics.degradedBoots++;
  if (record.duration < _metrics.minDuration) _metrics.minDuration = record.duration;
  if (record.duration > _metrics.maxDuration) _metrics.maxDuration = record.duration;
  _metrics.avgDuration = _metrics.totalDuration / _metrics.totalBoots;
  const durations = _bootHistory.map((b) => b.duration).sort((a, b) => a - b);
  _metrics.p50Duration = _percentile(durations, 50);
  _metrics.p90Duration = _percentile(durations, 90);
  _metrics.p99Duration = _percentile(durations, 99);
  if (record.phases) {
    for (const phase in record.phases) {
      if (record.phases.hasOwnProperty(phase)) {
        const data = record.phases[phase];
        if (!_metrics.phases[phase]) _metrics.phases[phase] = { count: 0, totalDuration: 0, avgDuration: 0, errors: 0 };
        _metrics.phases[phase].count++;
        _metrics.phases[phase].totalDuration += data.duration || 0;
        _metrics.phases[phase].avgDuration = _metrics.phases[phase].totalDuration / _metrics.phases[phase].count;
        if (data.error) _metrics.phases[phase].errors++;
      }
    }
  }
}
function _percentile(arr, p) {
  if (arr.length === 0) return 0;
  const index = Math.ceil(p / 100 * arr.length) - 1;
  return arr[Math.max(0, index)];
}
function getMetrics() {
  return Object.assign({}, _metrics, { successRate: _metrics.totalBoots > 0 ? `${(_metrics.successfulBoots / _metrics.totalBoots * 100).toFixed(2)}%` : "0%", failureRate: _metrics.totalBoots > 0 ? `${(_metrics.failedBoots / _metrics.totalBoots * 100).toFixed(2)}%` : "0%" });
}
function getHistory(limit) {
  return _bootHistory.slice(-(limit || 10));
}
function getBootById(bootId) {
  for (let i = 0; i < _bootHistory.length; i++) {
    if (_bootHistory[i].bootId === bootId) return _bootHistory[i];
  }
  return null;
}
function getLastBoot() {
  return _bootHistory.length > 0 ? _bootHistory[_bootHistory.length - 1] : null;
}
function getFailedBoots(limit) {
  return _bootHistory.filter((b) => b.result === "failed").slice(-(limit || 10));
}
function getDegradedBoots(limit) {
  return _bootHistory.filter((b) => b.result === "degraded").slice(-(limit || 10));
}
function getSlowBoots(thresholdMs, limit) {
  const t = thresholdMs || 5e3;
  return _bootHistory.filter((b) => b.duration > t).slice(-(limit || 10));
}
function getPhaseStats(phaseName) {
  return _metrics.phases[phaseName] || null;
}
function analyzePerformance() {
  const analysis = { overall: { status: "healthy", issues: [], recommendations: [] }, phases: {}, trends: {} };
  if (_metrics.avgDuration > 5e3) {
    analysis.overall.status = "warning";
    analysis.overall.issues.push("High average boot time");
    analysis.overall.recommendations.push("Consider lazy loading non-critical components");
  }
  if (_metrics.failedBoots / _metrics.totalBoots > 0.05) {
    analysis.overall.status = "critical";
    analysis.overall.issues.push("High failure rate (>5%)");
  }
  if (_metrics.degradedBoots / _metrics.totalBoots > 0.1) {
    if (analysis.overall.status !== "critical") analysis.overall.status = "warning";
    analysis.overall.issues.push("High degraded boot rate (>10%)");
  }
  for (const phase in _metrics.phases) {
    if (_metrics.phases.hasOwnProperty(phase)) {
      const stats = _metrics.phases[phase];
      analysis.phases[phase] = { avgDuration: stats.avgDuration, errorRate: stats.count > 0 ? `${(stats.errors / stats.count * 100).toFixed(2)}%` : "0%", status: stats.errors / stats.count > 0.1 ? "warning" : "healthy" };
    }
  }
  return analysis;
}
function exportData() {
  return { version: VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), metrics: getMetrics(), history: _bootHistory, analysis: analyzePerformance() };
}
function clearHistory() {
  _bootHistory.length = 0;
  Object.assign(_metrics, { totalBoots: 0, successfulBoots: 0, failedBoots: 0, degradedBoots: 0, totalDuration: 0, minDuration: Infinity, maxDuration: 0, avgDuration: 0, p50Duration: 0, p90Duration: 0, p99Duration: 0, lastBootAt: null, phases: {} });
  log.info("History cleared");
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, historySize: _bootHistory.length, metrics: getMetrics() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized, checks: { metricsTracking: true, historyEnabled: true }, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, features: ["boot-recording", "percentiles", "phase-analysis", "trend-analysis", "export"], status: getStatus() };
}
var dashboard_default = { VERSION, MODULE_ID, recordBoot, getMetrics, getHistory, getBootById, getLastBoot, getFailedBoots, getDegradedBoots, getSlowBoots, getPhaseStats, analyzePerformance, exportData, clearHistory, getStatus, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  analyzePerformance,
  clearHistory,
  dashboard_default as default,
  exportData,
  getBootById,
  getDegradedBoots,
  getFailedBoots,
  getHistory,
  getLastBoot,
  getMetrics,
  getPhaseStats,
  getPorts,
  getSlowBoots,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  recordBoot
};
