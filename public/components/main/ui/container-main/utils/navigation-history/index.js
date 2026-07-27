import { VERSION, MODULE_ID, NAVIGATION_TYPES } from "./constants.js";
import { createNavigationHistory } from "./manager.js";
import {
  getNavigationHistory,
  resetNavigationHistory,
  pushNavigation,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  info,
  healthCheck
} from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, NAVIGATION_TYPES as NAVIGATION_TYPES2 } from "./constants.js";
import { createNavigationHistory as createNavigationHistory2 } from "./manager.js";
import {
  getNavigationHistory as getNavigationHistory2,
  resetNavigationHistory as resetNavigationHistory2,
  pushNavigation as pushNavigation2,
  goBack as goBack2,
  goForward as goForward2,
  canGoBack as canGoBack2,
  canGoForward as canGoForward2,
  info as info2,
  healthCheck as healthCheck2
} from "./api.js";
var navigation_history_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  NAVIGATION_TYPES: NAVIGATION_TYPES2,
  createNavigationHistory: createNavigationHistory2,
  getNavigationHistory: getNavigationHistory2,
  resetNavigationHistory: resetNavigationHistory2,
  pushNavigation: pushNavigation2,
  goBack: goBack2,
  goForward: goForward2,
  canGoBack: canGoBack2,
  canGoForward: canGoForward2,
  info: info2,
  healthCheck: healthCheck2
};
export {
  MODULE_ID,
  NAVIGATION_TYPES,
  VERSION,
  canGoBack,
  canGoForward,
  createNavigationHistory,
  navigation_history_default as default,
  getNavigationHistory,
  goBack,
  goForward,
  healthCheck,
  info,
  pushNavigation,
  resetNavigationHistory
};
