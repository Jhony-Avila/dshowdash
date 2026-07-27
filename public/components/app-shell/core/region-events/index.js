import { VERSION, MODULE_ID, REGION_EVENTS } from "./constants.js";
import { emit, on, off } from "./core.js";
import { onAny, onGlobal, once, waitFor } from "./subscription.js";
import { init, destroy } from "./lifecycle.js";
import { getHistory, clearHistory, setHistoryLimit, getListenerCounts } from "./history.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { init as init2 } from "./lifecycle.js";
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init2();
    });
  } else {
    init2();
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, REGION_EVENTS as REGION_EVENTS2 } from "./constants.js";
import { emit as emit2, on as on2, off as off2 } from "./core.js";
import { onAny as onAny2, onGlobal as onGlobal2, once as once2, waitFor as waitFor2 } from "./subscription.js";
import { destroy as destroy2 } from "./lifecycle.js";
import { getHistory as getHistory2, clearHistory as clearHistory2, setHistoryLimit as setHistoryLimit2, getListenerCounts as getListenerCounts2 } from "./history.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var region_events_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  EVENTS: REGION_EVENTS2,
  emit: emit2,
  on: on2,
  off: off2,
  onAny: onAny2,
  onGlobal: onGlobal2,
  once: once2,
  waitFor: waitFor2,
  init: init2,
  destroy: destroy2,
  getHistory: getHistory2,
  clearHistory: clearHistory2,
  setHistoryLimit: setHistoryLimit2,
  getListenerCounts: getListenerCounts2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  REGION_EVENTS,
  VERSION,
  clearHistory,
  region_events_default as default,
  destroy,
  emit,
  getHistory,
  getListenerCounts,
  getMetrics,
  healthCheck,
  info,
  init,
  off,
  on,
  onAny,
  onGlobal,
  once,
  setHistoryLimit,
  waitFor
};
