const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api";
import { createLifecycleAPI } from "./lifecycle-api.js";
import { createStateAPI } from "./state-api.js";
import { createActionsAPI } from "./actions-api.js";
import { createContentAPI } from "./content-api.js";
import { createLoadingAPI } from "./loading-api.js";
import { createToastAPI } from "./toast-api.js";
import { createUIAPI } from "./ui-api.js";
import { createAccessibilityAPI } from "./accessibility-api.js";
import { createEventsAPI } from "./events-api.js";
import { createDebugAPI } from "./debug-api.js";
import { createGettersAPI } from "./getters-api.js";
export {
  MODULE_ID,
  VERSION,
  createAccessibilityAPI,
  createActionsAPI,
  createContentAPI,
  createDebugAPI,
  createEventsAPI,
  createGettersAPI,
  createLifecycleAPI,
  createLoadingAPI,
  createStateAPI,
  createToastAPI,
  createUIAPI
};
