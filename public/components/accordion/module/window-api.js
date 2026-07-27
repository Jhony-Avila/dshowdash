import { VERSION as CONST_VERSION, MODULE_ID as CONST_MODULE_ID } from "./constants.js";
import { injectStyles } from "./style-injector.js";
import { injectPorts, getPorts } from "./ports-manager.js";
import { createAccordion, createAccordionWithMock, mountAccordion, mountAccordionWithMock } from "./factory.js";
import { getAccordion, getAccordionView, getAccordionTelemetry, destroyAccordion } from "./accessors.js";
import { healthCheck as diagHealthCheck, info as diagInfo, audit, getMetrics } from "./diagnostics.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.window-api";
let _windowApiSetup = false;
function setupWindowAPI() {
  if (typeof window === "undefined") return { success: false, reason: "no_window" };
  if (_windowApiSetup) return { success: true, cached: true };
  window.Accordion = {
    VERSION: CONST_VERSION,
    MODULE_ID: CONST_MODULE_ID,
    create: createAccordion,
    createWithMock: createAccordionWithMock,
    mount: mountAccordion,
    mountWithMock: mountAccordionWithMock,
    get: getAccordion,
    getView: getAccordionView,
    getTelemetry: getAccordionTelemetry,
    destroy: destroyAccordion,
    healthCheck: diagHealthCheck,
    info: diagInfo,
    audit,
    getMetrics,
    injectPorts,
    getPorts,
    injectStyles
  };
  _windowApiSetup = true;
  return { success: true };
}
function healthCheck() {
  const checks = {
    windowApiAvailable: typeof setupWindowAPI === "function",
    windowApiSetup: _windowApiSetup,
    windowAccordionExists: typeof window !== "undefined" && !!window.Accordion
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    windowApiSetup: _windowApiSetup,
    exposedMethods: [
      "create",
      "createWithMock",
      "mount",
      "mountWithMock",
      "get",
      "getView",
      "getTelemetry",
      "destroy",
      "healthCheck",
      "info",
      "audit",
      "getMetrics",
      "injectPorts",
      "getPorts",
      "injectStyles"
    ],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var window_api_default = {
  setupWindowAPI,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  window_api_default as default,
  healthCheck,
  info,
  setupWindowAPI
};
