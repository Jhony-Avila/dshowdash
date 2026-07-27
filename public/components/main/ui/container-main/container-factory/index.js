import { VERSION, MODULE_ID } from "./constants.js";
import { DEFAULT_OPTIONS } from "./default-options.js";
import { ICONS } from "./icons.js";
import { createContainerDOM } from "./dom/index.js";
import { initializeComponents, destroyComponents, LIFECYCLE_HOOKS } from "./components/index.js";
import {
  createLifecycleAPI,
  createStateAPI,
  createActionsAPI,
  createContentAPI,
  createLoadingAPI,
  createToastAPI,
  createUIAPI,
  createAccessibilityAPI,
  createEventsAPI,
  createDebugAPI,
  createGettersAPI
} from "./api/index.js";
import { info, healthCheck } from "./diagnostics/index.js";
export {
  DEFAULT_OPTIONS,
  ICONS,
  LIFECYCLE_HOOKS,
  MODULE_ID,
  VERSION,
  createAccessibilityAPI,
  createActionsAPI,
  createContainerDOM,
  createContentAPI,
  createDebugAPI,
  createEventsAPI,
  createGettersAPI,
  createLifecycleAPI,
  createLoadingAPI,
  createStateAPI,
  createToastAPI,
  createUIAPI,
  destroyComponents,
  healthCheck,
  info,
  initializeComponents
};
