export * from "./store.js";
import { default as default2 } from "./store.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/state";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
let _state = null;
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  default2 as default,
  healthCheck,
  info
};
