import { VERSION, MODULE_ID, RESIZE_CONFIGS } from "./constants.js";
import { initialized, listeners, metrics, dragState } from "./state.js";
import { getSizes, getResizableRegions } from "./core.js";
import { isDragging, getDraggingRegion } from "./drag.js";
function getMetrics() {
  return {
    resizes: metrics.resizes,
    dragResizes: metrics.dragResizes,
    errors: metrics.errors
  };
}
function healthCheck() {
  const checks = {
    initialized: initialized.value,
    hasConfigs: Object.keys(RESIZE_CONFIGS).length > 0,
    notDragging: !dragState.active,
    noErrors: metrics.errors === 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    currentSizes: getSizes(),
    isDragging: isDragging(),
    draggingRegion: getDraggingRegion(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: initialized.value,
    sizes: getSizes(),
    configs: RESIZE_CONFIGS,
    resizableRegions: getResizableRegions(),
    isDragging: isDragging(),
    draggingRegion: getDraggingRegion(),
    listenerCount: listeners.length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
