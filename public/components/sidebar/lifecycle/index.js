const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.lifecycle";
import { createInitializer } from "./initializer.js";
import { createSetupCoordinator } from "./setup-coordinator.js";
import { createDestroyer } from "./destroyer.js";
export {
  MODULE_ID,
  VERSION,
  createDestroyer,
  createInitializer,
  createSetupCoordinator
};
