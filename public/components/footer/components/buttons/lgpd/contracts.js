import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "footer-button-lgpd-contracts";
const VERSION = "1.2.0-P18EC";
const BUTTON_CONFIG = { id: "lgpd", area: "footer", label: "lgpd", icon: "lgpd", kind: "navigation" };
const EMITTED_EVENTS = [UI_EVENTS.ACTION];
const ACTION_PAYLOAD = { actionId: "footer:lgpd", meta: {} };
function getMetrics() {
  return { configLoaded: true };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: BUTTON_CONFIG, events: EMITTED_EVENTS, p18Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { configValid: !!BUTTON_CONFIG.id, p18Events: true }, metrics: getMetrics() };
}
var contracts_default = { VERSION, MODULE_ID, BUTTON_CONFIG, EMITTED_EVENTS, ACTION_PAYLOAD, getMetrics, info, healthCheck };
export {
  ACTION_PAYLOAD,
  BUTTON_CONFIG,
  EMITTED_EVENTS,
  MODULE_ID,
  VERSION,
  contracts_default as default,
  getMetrics,
  healthCheck,
  info
};
