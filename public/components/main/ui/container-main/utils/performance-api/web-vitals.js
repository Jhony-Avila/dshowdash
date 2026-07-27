const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.web-vitals";
function observeWebVitals(state, logger) {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      state.webVitals.LCP = lastEntry.startTime;
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];
      if (firstInput) {
        state.webVitals.FID = firstInput.processingStart - firstInput.startTime;
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          state.webVitals.CLS = clsValue;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          state.webVitals.FCP = entry.startTime;
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });
  } catch (e) {
    if (logger) logger.warn("Web Vitals observation failed:", e);
  }
}
function getWebVitals(state) {
  if (performance.getEntriesByType) {
    const navEntry = performance.getEntriesByType("navigation")[0];
    if (navEntry) {
      state.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
    }
  }
  return { ...state.webVitals };
}
function getWebVitalsRating(state) {
  const vitals = getWebVitals(state);
  const ratings = {};
  if (vitals.LCP !== null) {
    ratings.LCP = vitals.LCP < 2500 ? "good" : vitals.LCP < 4e3 ? "needs-improvement" : "poor";
  }
  if (vitals.FID !== null) {
    ratings.FID = vitals.FID < 100 ? "good" : vitals.FID < 300 ? "needs-improvement" : "poor";
  }
  if (vitals.CLS !== null) {
    ratings.CLS = vitals.CLS < 0.1 ? "good" : vitals.CLS < 0.25 ? "needs-improvement" : "poor";
  }
  return { vitals, ratings };
}
export {
  MODULE_ID,
  VERSION,
  getWebVitals,
  getWebVitalsRating,
  observeWebVitals
};
