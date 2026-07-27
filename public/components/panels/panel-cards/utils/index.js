export * from "./formatters.js";
export * from "./helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/utils";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info
};
