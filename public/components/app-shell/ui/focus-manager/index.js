import { VERSION, MODULE_ID, FOCUS_STRATEGIES } from "./constants.js";
import { focusElement, focusRegion, focusNext, focusPrevious, getCurrentFocus, isFocused, getFocusableIn } from "./core.js";
import { saveFocus, restoreFocus, clearSavedFocus, getSavedFocusKeys } from "./persistence.js";
import { createTrap, releaseTrap, hasTrap, getActiveTraps } from "./trap.js";
import { createGuard, removeGuard } from "./guard.js";
import { getHistory, goBack, clearHistory } from "./history.js";
import { announce } from "./announce.js";
import { configure, getConfig } from "./config.js";
import { subscribe } from "./subscription.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, FOCUS_STRATEGIES as FOCUS_STRATEGIES2 } from "./constants.js";
import { focusElement as focusElement2, focusRegion as focusRegion2, focusNext as focusNext2, focusPrevious as focusPrevious2, getCurrentFocus as getCurrentFocus2, isFocused as isFocused2, getFocusableIn as getFocusableIn2 } from "./core.js";
import { saveFocus as saveFocus2, restoreFocus as restoreFocus2, clearSavedFocus as clearSavedFocus2, getSavedFocusKeys as getSavedFocusKeys2 } from "./persistence.js";
import { createTrap as createTrap2, releaseTrap as releaseTrap2, hasTrap as hasTrap2, getActiveTraps as getActiveTraps2 } from "./trap.js";
import { createGuard as createGuard2, removeGuard as removeGuard2 } from "./guard.js";
import { getHistory as getHistory2, goBack as goBack2, clearHistory as clearHistory2 } from "./history.js";
import { announce as announce2 } from "./announce.js";
import { configure as configure2, getConfig as getConfig2 } from "./config.js";
import { subscribe as subscribe2 } from "./subscription.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var focus_manager_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  FOCUS_STRATEGIES: FOCUS_STRATEGIES2,
  focusElement: focusElement2,
  focusRegion: focusRegion2,
  focusNext: focusNext2,
  focusPrevious: focusPrevious2,
  saveFocus: saveFocus2,
  restoreFocus: restoreFocus2,
  clearSavedFocus: clearSavedFocus2,
  getSavedFocusKeys: getSavedFocusKeys2,
  createTrap: createTrap2,
  releaseTrap: releaseTrap2,
  hasTrap: hasTrap2,
  getActiveTraps: getActiveTraps2,
  createGuard: createGuard2,
  removeGuard: removeGuard2,
  getHistory: getHistory2,
  goBack: goBack2,
  clearHistory: clearHistory2,
  getCurrentFocus: getCurrentFocus2,
  isFocused: isFocused2,
  getFocusableIn: getFocusableIn2,
  announce: announce2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  FOCUS_STRATEGIES,
  MODULE_ID,
  VERSION,
  announce,
  clearHistory,
  clearSavedFocus,
  configure,
  createGuard,
  createTrap,
  focus_manager_default as default,
  focusElement,
  focusNext,
  focusPrevious,
  focusRegion,
  getActiveTraps,
  getConfig,
  getCurrentFocus,
  getFocusableIn,
  getHistory,
  getMetrics,
  getSavedFocusKeys,
  goBack,
  hasTrap,
  healthCheck,
  info,
  isFocused,
  releaseTrap,
  removeGuard,
  restoreFocus,
  saveFocus,
  subscribe
};
