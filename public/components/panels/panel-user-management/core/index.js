export * from "./constants.js";
export * from "./contracts.js";
import { default as default2 } from "./contracts.js";
const MODULE_ID = "panels-panel-user-management-core-index";
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
  default2 as contracts,
  healthCheck,
  info
};
