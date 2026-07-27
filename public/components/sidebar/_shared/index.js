export * from "./base-feature.js";
import * as DomUtils from "./dom-utils.js";
import * as StorageUtils from "./storage-utils.js";
import * as EventUtils from "./event-utils.js";
const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-shared";
import * as DomUtils2 from "./dom-utils.js";
import * as StorageUtils2 from "./storage-utils.js";
import * as EventUtils2 from "./event-utils.js";
function getMetrics() {
  return {
    domUtils: DomUtils2.getMetrics?.() || {},
    storageUtils: StorageUtils2.getMetrics?.() || {},
    eventUtils: EventUtils2.getMetrics?.() || {}
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      domUtils: DomUtils2.healthCheck?.()?.status || "UNKNOWN",
      storageUtils: StorageUtils2.healthCheck?.()?.status || "UNKNOWN",
      eventUtils: EventUtils2.healthCheck?.()?.status || "UNKNOWN"
    },
    metrics: getMetrics()
  };
}
var shared_default = { VERSION, MODULE_ID, info, getMetrics, healthCheck };
export {
  DomUtils,
  EventUtils,
  MODULE_ID,
  StorageUtils,
  VERSION,
  shared_default as default,
  getMetrics,
  healthCheck,
  info
};
