const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell-region-metrics";
const METRIC_TYPES = Object.freeze({
  RENDER: "render",
  UPDATE: "update",
  VISIBILITY: "visibility",
  RESIZE: "resize",
  INTERACTION: "interaction",
  ERROR: "error",
  LOAD: "load"
});
const REGIONS = ["header", "nav-rail", "sidebar", "main", "footer", "overlay"];
function createEmptyRegionData() {
  return {
    renders: [],
    updates: [],
    visibility: [],
    interactions: [],
    errors: [],
    loads: [],
    aggregated: {
      renderCount: 0,
      updateCount: 0,
      visibilityChanges: 0,
      interactionCount: 0,
      errorCount: 0,
      loadCount: 0,
      avgRenderTime: 0,
      avgUpdateTime: 0,
      totalRenderTime: 0,
      totalUpdateTime: 0,
      lastActivity: null
    }
  };
}
export {
  METRIC_TYPES,
  MODULE_ID,
  REGIONS,
  VERSION,
  createEmptyRegionData
};
