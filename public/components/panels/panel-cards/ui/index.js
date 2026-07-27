export * from "./renderer.js";
import { default as default2 } from "./renderer.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/ui";
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
