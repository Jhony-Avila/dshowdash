import * as state from "./singleton-state.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.accessors";
function getAccordion() {
  return state.getInstance();
}
function getAccordionView() {
  return state.getView();
}
function getAccordionTelemetry() {
  return state.getTelemetry();
}
function destroyAccordion() {
  const telemetry = state.getTelemetry();
  if (telemetry) {
    telemetry.destroy();
  }
  const view = state.getView();
  if (view) {
    view.destroy();
  }
  const instance = state.getInstance();
  if (instance) {
    instance.destroy();
  }
  state.clearAll();
  return { success: true };
}
function healthCheck() {
  const checks = {
    accessorsAvailable: true,
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 1 ? "HEALTHY" : "DEGRADED",
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
    hasAccordion: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var accessors_default = {
  getAccordion,
  getAccordionView,
  getAccordionTelemetry,
  destroyAccordion,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  accessors_default as default,
  destroyAccordion,
  getAccordion,
  getAccordionTelemetry,
  getAccordionView,
  healthCheck,
  info
};
