const VERSION = "2.0.0-PHASE4";
const MODULE_ID = "container-main:slots";
export * from "./slot-manager.js";
import { default as default2 } from "./slot-manager.js";
export * from "./slot-presets.js";
import { default as default3 } from "./slot-presets.js";
const SLOT_MODULES = Object.freeze(["slot-manager", "slot-presets"]);
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: SLOT_MODULES };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var slots_default = { VERSION, MODULE_ID, SLOT_MODULES, info, healthCheck };
export {
  MODULE_ID,
  SLOT_MODULES,
  default2 as SlotManager,
  default3 as SlotPresets,
  VERSION,
  slots_default as default,
  healthCheck,
  info
};
