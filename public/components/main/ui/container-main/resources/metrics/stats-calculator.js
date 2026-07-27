const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.metrics.stats-calculator";
function calculateStats(values) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  return {
    min: sorted[0],
    max: sorted[count - 1],
    avg: sum / count,
    sum,
    count,
    p50: sorted[Math.floor(count * 0.5)],
    p95: sorted[Math.floor(count * 0.95)],
    p99: sorted[Math.floor(count * 0.99)]
  };
}
function aggregateByPeriod(entries, period) {
  const buckets = /* @__PURE__ */ new Map();
  entries.forEach((entry) => {
    const bucketTime = Math.floor(entry.timestamp / period) * period;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime).push(entry.value);
  });
  const aggregated = [];
  buckets.forEach((values, time) => {
    aggregated.push({
      timestamp: time,
      stats: calculateStats(values)
    });
  });
  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
}
function calculateRate(entries, windowMs = 6e4) {
  if (!entries || entries.length < 2) return 0;
  const now = Date.now();
  const windowStart = now - windowMs;
  const inWindow = entries.filter((e) => e.timestamp >= windowStart);
  if (inWindow.length < 2) return 0;
  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];
  const timeDiff = (last.timestamp - first.timestamp) / 1e3;
  if (timeDiff === 0) return 0;
  return (last.value - first.value) / timeDiff;
}
function movingAverage(entries, windowSize = 5) {
  if (!entries || entries.length === 0) return [];
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = entries.slice(start, i + 1);
    const avg = windowSlice.reduce((sum, e) => sum + e.value, 0) / windowSlice.length;
    result.push({
      timestamp: entries[i].timestamp,
      value: avg,
      originalValue: entries[i].value
    });
  }
  return result;
}
var stats_calculator_default = {
  calculateStats,
  aggregateByPeriod,
  calculateRate,
  movingAverage
};
export {
  MODULE_ID,
  VERSION,
  aggregateByPeriod,
  calculateRate,
  calculateStats,
  stats_calculator_default as default,
  movingAverage
};
