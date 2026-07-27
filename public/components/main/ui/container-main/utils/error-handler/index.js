import { VERSION, MODULE_ID, ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS, MAX_ERROR_LOG } from "./constants.js";
import { classifyCategory, classifySeverity, suggestRecovery } from "./classifier.js";
import { createErrorStore } from "./error-store.js";
import { createMetricsTracker } from "./metrics-tracker.js";
import { createGlobalInstaller } from "./global-installer.js";
import { createWrappers } from "./wrappers.js";
import { createComponentBoundaryFactory } from "./component-boundary.js";
export {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  MAX_ERROR_LOG,
  MODULE_ID,
  RECOVERY_ACTIONS,
  VERSION,
  classifyCategory,
  classifySeverity,
  createComponentBoundaryFactory,
  createErrorStore,
  createGlobalInstaller,
  createMetricsTracker,
  createWrappers,
  suggestRecovery
};
