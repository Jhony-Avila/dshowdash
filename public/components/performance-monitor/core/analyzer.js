const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "performance-monitor-analyzer";
function analyze(entries) {
  const metrics = { fcp: null, lcp: null, cls: 0 };
  for (const entry of entries) {
    if (entry.entryType === "paint" && entry.name === "first-contentful-paint") metrics.fcp = entry.startTime;
    if (entry.entryType === "largest-contentful-paint") metrics.lcp = entry.startTime;
    if (entry.entryType === "layout-shift" && !entry.hadRecentInput) metrics.cls += entry.value;
  }
  return metrics;
}
function getScore(metrics) {
  let score = 100;
  if (metrics.fcp !== null && metrics.fcp > 2500) score -= 20;
  if (metrics.lcp !== null && metrics.lcp > 4e3) score -= 30;
  if (metrics.cls > 0.25) score -= 25;
  return Math.max(0, score);
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, functions: ["analyze", "getScore"], timestamp: Date.now() };
}
const PerformanceAnalyzer = { analyze, getScore, healthCheck, info };
var analyzer_default = { analyze, getScore, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PerformanceAnalyzer,
  VERSION,
  analyze,
  analyzer_default as default,
  getScore,
  healthCheck,
  info
};
