const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/state";
import { StateStore } from "./store.js";
import { StateUpdaters } from "./updaters.js";
import { StateSnapshots } from "./snapshots.js";
import { default as default2 } from "./validators.js";
const modules = ["store", "updaters", "snapshots", "validators"];
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}
var state_default = { VERSION, MODULE_ID, modules, info };
export {
  MODULE_ID,
  StateSnapshots,
  StateStore,
  StateUpdaters,
  default2 as StateValidators,
  VERSION,
  state_default as default,
  info,
  modules
};
