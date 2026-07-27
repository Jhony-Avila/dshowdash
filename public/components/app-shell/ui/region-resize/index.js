import { VERSION, MODULE_ID } from "./constants.js";
import {
  init,
  getSize,
  getSizes,
  setSize,
  resetSize,
  resetAllSizes,
  getConfig,
  isResizable,
  getResizableRegions
} from "./core.js";
import { startDragResize, isDragging, getDraggingRegion } from "./drag.js";
import { subscribe } from "./subscription.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import { init as init2, getSize as getSize2, getSizes as getSizes2, setSize as setSize2, resetSize as resetSize2, resetAllSizes as resetAllSizes2, getConfig as getConfig2, isResizable as isResizable2, getResizableRegions as getResizableRegions2 } from "./core.js";
import { startDragResize as startDragResize2, isDragging as isDragging2, getDraggingRegion as getDraggingRegion2 } from "./drag.js";
import { subscribe as subscribe2 } from "./subscription.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init2();
    });
  } else {
    init2();
  }
}
var region_resize_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  init: init2,
  getSize: getSize2,
  getSizes: getSizes2,
  setSize: setSize2,
  resetSize: resetSize2,
  resetAllSizes: resetAllSizes2,
  getConfig: getConfig2,
  isResizable: isResizable2,
  getResizableRegions: getResizableRegions2,
  startDragResize: startDragResize2,
  isDragging: isDragging2,
  getDraggingRegion: getDraggingRegion2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  VERSION,
  region_resize_default as default,
  getConfig,
  getDraggingRegion,
  getMetrics,
  getResizableRegions,
  getSize,
  getSizes,
  healthCheck,
  info,
  init,
  isDragging,
  isResizable,
  resetAllSizes,
  resetSize,
  setSize,
  startDragResize,
  subscribe
};
