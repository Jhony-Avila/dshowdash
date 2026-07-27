export * from "./main-engine/index.js";
import { default as default2 } from "./main-engine/index.js";
import { createMainEngine } from "./main-engine/index.js";
const MODULE_ID = "main-engine-redirect";
const VERSION = "8.0.0-UNIFIED";
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { redirectActive: true } };
}
export {
  MODULE_ID,
  VERSION,
  createMainEngine,
  default2 as default,
  healthCheck
};
