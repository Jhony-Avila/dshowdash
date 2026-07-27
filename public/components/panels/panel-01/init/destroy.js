import { safeExecute } from "./feature-loader.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:destroy";
const DESTROY_LIST = [
  "table",
  "drawer",
  "pagination",
  "selection",
  "keyboard",
  "contextMenu",
  "filters",
  "actions",
  "search",
  "toolbar",
  "columns",
  "searchSuggestions",
  "searchHistory",
  "filterPresets",
  "dateRangePicker",
  "numericRangeFilter",
  "multiSelectFilter",
  "importPreview",
  "quickFilters",
  "activityLog",
  "userAssignments",
  "mentions",
  "rowHoverMenu",
  "deltaUpdates",
  "smartCache",
  "pushNotifications",
  "soundNotifications",
  "excelExporter",
  "cardView",
  "kanbanView",
  "splitView",
  "timelineView",
  "highlightingRules",
  "dataComparison",
  "dataTrends",
  "anomalyDetection",
  "summaryRow",
  "skeletonCustom",
  "infiniteScroll",
  "savedViews",
  "bulkEdit",
  "tags",
  "preview",
  "badgeNew",
  "animations",
  "duplicateManager",
  "circuitBreaker"
];
const destroyComponents = (comps) => {
  if (!comps) return;
  DESTROY_LIST.forEach((name) => {
    if (comps[name]?.destroy) {
      safeExecute(`${name}.destroy`, () => {
        comps[name].destroy();
      });
    }
  });
  if (comps.websocket?.disconnect) {
    safeExecute("websocket.disconnect", () => {
      comps.websocket.disconnect();
    });
  }
  if (comps.serviceWorker?.unregister) {
    safeExecute("serviceWorker.unregister", () => {
      comps.serviceWorker.unregister();
    });
  }
};
const getDestroyList = () => DESTROY_LIST.slice();
const info = () => ({ moduleId: MODULE_ID, version: VERSION, destroyableCount: DESTROY_LIST.length });
var destroy_default = { destroyComponents, getDestroyList, info };
export {
  MODULE_ID,
  VERSION,
  destroy_default as default,
  destroyComponents,
  getDestroyList,
  info
};
