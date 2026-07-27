import { VERSION, MODULE_ID, FOCUSABLE_SELECTORS } from "./constants.js";
import { getConfig as _getConfig, setConfig, getStateSnapshot } from "./state.js";
import {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable
} from "./core/queries.js";
import {
  focusElement,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious
} from "./core/actions.js";
import {
  trap,
  release,
  isTrapped,
  getTrapElement
} from "./core/trap.js";
import {
  saveFocus,
  restoreFocus,
  getSavedFocus,
  getFocusHistory,
  clearHistory
} from "./persistence/save-restore.js";
import {
  healthCheck,
  getMetrics,
  info
} from "./diagnostics/health.js";
function configure(config) {
  if (!config || typeof config !== "object") return false;
  setConfig(config);
  return true;
}
function getConfig() {
  return Object.assign({}, _getConfig());
}
function getState() {
  return getStateSnapshot();
}
var focus_manager_default = {
  // Queries
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  // Actions
  focusFirst,
  focusLast,
  focusElement,
  focusNext,
  focusPrevious,
  // Save/Restore
  saveFocus,
  restoreFocus,
  getSavedFocus,
  getFocusHistory,
  clearHistory,
  // Trap
  trap,
  release,
  isTrapped,
  getTrapElement,
  // Config/State
  getState,
  configure,
  getConfig,
  getMetrics,
  // Diagnostics
  healthCheck,
  info,
  // Constants
  FOCUSABLE_SELECTORS,
  VERSION,
  MODULE_ID
};
export {
  FOCUSABLE_SELECTORS,
  MODULE_ID,
  VERSION,
  clearHistory,
  configure,
  focus_manager_default as default,
  focusElement,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  getConfig,
  getFirstFocusable,
  getFocusHistory,
  getFocusableElements,
  getLastFocusable,
  getMetrics,
  getSavedFocus,
  getState,
  getTrapElement,
  healthCheck,
  info,
  isTrapped,
  release,
  restoreFocus,
  saveFocus,
  trap
};
