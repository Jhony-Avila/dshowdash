import { VERSION, MODULE_ID, METRIC_TYPES, METRIC_CATEGORIES } from "./constants.js";
import { createPerformanceAPI } from "./factory.js";
import { getPerformanceAPI, resetPerformanceAPI } from "./singleton.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import { getPerformanceAPI as getPerformanceAPI2 } from "./singleton.js";
function startTiming(name, category) {
  return getPerformanceAPI2().startTiming(name, category);
}
function endTiming(name) {
  return getPerformanceAPI2().endTiming(name);
}
function recordRender(duration, panelId) {
  return getPerformanceAPI2().recordRender(duration, panelId);
}
function recordLoad(duration, resourceId, success) {
  return getPerformanceAPI2().recordLoad(duration, resourceId, success);
}
function getAllMetrics() {
  return getPerformanceAPI2().getAllMetrics();
}
function info() {
  return { moduleId: MODULE_ID2, version: VERSION2 };
}
function healthCheck() {
  try {
    return getPerformanceAPI2().healthCheck();
  } catch (e) {
    return { status: "NOT_INITIALIZED", version: VERSION2, moduleId: MODULE_ID2 };
  }
}
import { createPerformanceAPI as createPerformanceAPI2 } from "./factory.js";
import { resetPerformanceAPI as resetPerformanceAPI2 } from "./singleton.js";
import { METRIC_TYPES as METRIC_TYPES2, METRIC_CATEGORIES as METRIC_CATEGORIES2 } from "./constants.js";
var performance_api_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  METRIC_TYPES: METRIC_TYPES2,
  METRIC_CATEGORIES: METRIC_CATEGORIES2,
  createPerformanceAPI: createPerformanceAPI2,
  getPerformanceAPI: getPerformanceAPI2,
  resetPerformanceAPI: resetPerformanceAPI2,
  startTiming,
  endTiming,
  recordRender,
  recordLoad,
  getAllMetrics,
  info,
  healthCheck
};
export {
  METRIC_CATEGORIES,
  METRIC_TYPES,
  MODULE_ID,
  VERSION,
  createPerformanceAPI,
  performance_api_default as default,
  endTiming,
  getAllMetrics,
  getPerformanceAPI,
  healthCheck,
  info,
  recordLoad,
  recordRender,
  resetPerformanceAPI,
  startTiming
};
