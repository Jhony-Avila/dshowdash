const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.state";
function createState(maxHistorySize) {
  return {
    metrics: {
      timings: /* @__PURE__ */ new Map(),
      counters: /* @__PURE__ */ new Map(),
      gauges: /* @__PURE__ */ new Map(),
      histograms: /* @__PURE__ */ new Map(),
      history: [],
      marks: /* @__PURE__ */ new Map(),
      measures: /* @__PURE__ */ new Map()
    },
    renderStats: {
      totalRenders: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      minRenderTime: Infinity,
      maxRenderTime: 0,
      renderHistory: []
    },
    loadStats: {
      totalLoads: 0,
      totalLoadTime: 0,
      lastLoadTime: 0,
      avgLoadTime: 0,
      failedLoads: 0,
      loadHistory: []
    },
    webVitals: {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTFB: null,
      INP: null
    },
    maxHistorySize
  };
}
function resetState(state) {
  state.metrics.timings.clear();
  state.metrics.counters.clear();
  state.metrics.gauges.clear();
  state.metrics.histograms.clear();
  state.metrics.history.length = 0;
  state.metrics.marks.clear();
  state.metrics.measures.clear();
  Object.assign(state.renderStats, {
    totalRenders: 0,
    totalRenderTime: 0,
    lastRenderTime: 0,
    avgRenderTime: 0,
    minRenderTime: Infinity,
    maxRenderTime: 0,
    renderHistory: []
  });
  Object.assign(state.loadStats, {
    totalLoads: 0,
    totalLoadTime: 0,
    lastLoadTime: 0,
    avgLoadTime: 0,
    failedLoads: 0,
    loadHistory: []
  });
}
export {
  MODULE_ID,
  VERSION,
  createState,
  resetState
};
