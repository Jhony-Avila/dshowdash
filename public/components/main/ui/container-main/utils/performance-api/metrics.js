import { calculatePercentile } from "./utils.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.metrics";
function increment(state, name, value = 1) {
  const current = state.metrics.counters.get(name) || 0;
  state.metrics.counters.set(name, current + value);
  return state.metrics.counters.get(name);
}
function decrement(state, name, value = 1) {
  return increment(state, name, -value);
}
function getCounter(state, name) {
  return state.metrics.counters.get(name) || 0;
}
function setGauge(state, name, value) {
  state.metrics.gauges.set(name, { value, timestamp: Date.now() });
}
function getGauge(state, name) {
  return state.metrics.gauges.get(name)?.value ?? null;
}
function recordHistogram(state, name, value) {
  if (!state.metrics.histograms.has(name)) {
    state.metrics.histograms.set(name, []);
  }
  state.metrics.histograms.get(name).push(value);
}
function getHistogramStats(state, name) {
  const values = state.metrics.histograms.get(name) || [];
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    sum,
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    p50: calculatePercentile(values, 50),
    p90: calculatePercentile(values, 90),
    p99: calculatePercentile(values, 99)
  };
}
export {
  MODULE_ID,
  VERSION,
  decrement,
  getCounter,
  getGauge,
  getHistogramStats,
  increment,
  recordHistogram,
  setGauge
};
