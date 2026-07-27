export * from "../state.js";
import { default as default2 } from "../state.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences/state";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  default2 as default,
  healthCheck,
  info
};
