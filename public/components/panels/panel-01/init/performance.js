const MODULE_ID = "panel-01.init.performance";
const VERSION = "9.3.0-P2-ENTERPRISE";
function initPerformanceMonitor(panelId) {
  const metrics = {
    renderTime: 0,
    dataLoadTime: 0,
    interactionCount: 0,
    lastUpdate: null
  };
  return {
    startTimer(name) {
      metrics[`${name}Start`] = performance.now();
    },
    endTimer(name) {
      const start = metrics[`${name}Start`];
      if (start) {
        metrics[`${name}Time`] = performance.now() - start;
        delete metrics[`${name}Start`];
      }
    },
    trackInteraction() {
      metrics.interactionCount = metrics.interactionCount + 1;
      metrics.lastUpdate = Date.now();
    },
    getMetrics() {
      return { ...metrics };
    },
    reset() {
      metrics.renderTime = 0;
      metrics.dataLoadTime = 0;
      metrics.interactionCount = 0;
    }
  };
}
const initPerformance = initPerformanceMonitor;
function destroyPerformance(perf) {
  if (perf && typeof perf.reset === "function") perf.reset();
}
var performance_default = { initPerformanceMonitor, initPerformance, destroyPerformance };
export {
  MODULE_ID,
  VERSION,
  performance_default as default,
  destroyPerformance,
  initPerformance,
  initPerformanceMonitor
};
