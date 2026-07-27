export * from "./constants.js";
const MODULE_ID = "panels-panel-cards-core-index";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info
};
