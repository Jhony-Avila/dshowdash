export * from "./dashboard-utils.js";
import { exportManager } from "./export-manager.js";
import { themeManager } from "./theme-manager.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:utils";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  exportManager,
  healthCheck,
  info,
  themeManager
};
