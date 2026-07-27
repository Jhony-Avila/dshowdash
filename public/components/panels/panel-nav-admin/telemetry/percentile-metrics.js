import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.3.0-MIGRATION-PHASE7";
const MODULE_ID = "panel-nav-admin.telemetry.percentile-metrics";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function calculatePercentile(sorted, p) {
  if (!sorted || sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = p / 100 * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const fraction = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}
function PercentileMetrics(options = {}) {
  const {
    maxSamples = 1e3,
    percentiles = [50, 95, 99]
  } = options;
  const _samples = /* @__PURE__ */ new Map();
  const _timers = /* @__PURE__ */ new Map();
  function record(metricName, durationMs) {
    if (!_samples.has(metricName)) {
      _samples.set(metricName, []);
    }
    const samples = _samples.get(metricName);
    samples.push(durationMs);
    if (samples.length > Number(maxSamples)) {
      samples.splice(0, samples.length - Number(maxSamples));
    }
  }
  function startTimer(metricName) {
    const start = performance.now();
    const timerId = `${metricName}_${start}`;
    _timers.set(timerId, { metricName, start });
    return () => {
      const duration = performance.now() - start;
      _timers.delete(timerId);
      record(metricName, duration);
      return duration;
    };
  }
  function getPercentiles(metricName) {
    const samples = _samples.get(metricName);
    if (!samples || samples.length === 0) {
      const result2 = { count: 0, min: 0, max: 0, avg: 0 };
      for (const p of percentiles) result2[`p${p}`] = 0;
      return result2;
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    const result = {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / sorted.length * 100) / 100
    };
    for (const p of percentiles) {
      result[`p${p}`] = Math.round(calculatePercentile(sorted, p) * 100) / 100;
    }
    return result;
  }
  function getAllPercentiles() {
    const result = {};
    for (const metricName of _samples.keys()) {
      result[metricName] = getPercentiles(metricName);
    }
    return result;
  }
  function getMetricNames() {
    return [..._samples.keys()];
  }
  function getSummary() {
    const all = getAllPercentiles();
    const totalSamples = [..._samples.values()].reduce((sum, s) => sum + s.length, 0);
    return {
      metrics: all,
      totalMetrics: _samples.size,
      totalSamples,
      activeTimers: _timers.size,
      percentileConfig: percentiles
    };
  }
  function reset(metricName) {
    if (metricName) {
      _samples.delete(metricName);
    } else {
      _samples.clear();
      _timers.clear();
    }
  }
  return {
    record,
    startTimer,
    getPercentiles,
    getAllPercentiles,
    getMetricNames,
    getSummary,
    reset
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  const testData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const p50 = calculatePercentile(testData, 50);
  const selfTestPassed = Math.abs(p50 - 55) < 0.01;
  return {
    status: selfTestPassed ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    selfTestPassed
  };
}
var percentile_metrics_default = { PercentileMetrics, calculatePercentile, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PercentileMetrics,
  VERSION,
  calculatePercentile,
  percentile_metrics_default as default,
  healthCheck,
  info,
  injectPorts
};
