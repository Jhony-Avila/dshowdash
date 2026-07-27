import { VERSION, MODULE_ID, NAVIGATION_ORDER } from "./constants.js";
import {
  isInitialized,
  setInitialized,
  isEnabled as _isEnabled,
  setEnabled,
  _listeners,
  getMetrics,
  notifyListeners
} from "./state.js";
import { globalKeyHandler } from "./handlers/global.js";
import { getCurrentRegion, getVisibleRegions } from "./helpers/regions.js";
import { navigateToRegion, navigateNext, navigatePrevious, navigateToMain } from "./navigation/core.js";
import { setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion } from "./trap/manager.js";
function init() {
  if (isInitialized()) return true;
  if (typeof document === "undefined") return false;
  document.addEventListener("keydown", globalKeyHandler);
  setInitialized(true);
  notifyListeners("initialized", null);
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  document.removeEventListener("keydown", globalKeyHandler);
  setInitialized(false);
  notifyListeners("destroyed", null);
  return true;
}
function enable() {
  setEnabled(true);
  notifyListeners("enabled", null);
}
function disable() {
  setEnabled(false);
  notifyListeners("disabled", null);
}
function isEnabled() {
  return _isEnabled();
}
function getNavigationOrder() {
  return NAVIGATION_ORDER.slice();
}
function setNavigationOrder(order) {
  if (Array.isArray(order) && order.length > 0) {
    NAVIGATION_ORDER.length = 0;
    for (let i = 0; i < order.length; i++) {
      NAVIGATION_ORDER.push(order[i]);
    }
    notifyListeners("navigation-order-changed", { order });
  }
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const checks = {
    initialized: isInitialized(),
    enabled: _isEnabled(),
    noErrors: getMetrics().errors === 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    currentRegion: getCurrentRegion(),
    tabTrapActive: isTabTrapped(),
    tabTrapRegion: getTabTrapRegion(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized(),
    enabled: _isEnabled(),
    currentRegion: getCurrentRegion(),
    navigationOrder: getNavigationOrder(),
    visibleRegions: getVisibleRegions(),
    tabTrapActive: isTabTrapped(),
    tabTrapRegion: getTabTrapRegion(),
    listenerCount: _listeners.length,
    metrics: getMetrics(),
    shortcuts: {
      "F6": "Navigate to next region",
      "Shift+F6": "Navigate to previous region",
      "Escape": "Return to main region / release tab trap"
    },
    timestamp: Date.now()
  };
}
export {
  destroy,
  disable,
  enable,
  getCurrentRegion,
  getMetrics,
  getNavigationOrder,
  getTabTrapRegion,
  healthCheck,
  info,
  init,
  isEnabled,
  isTabTrapped,
  navigateNext,
  navigatePrevious,
  navigateToMain,
  navigateToRegion,
  releaseTabTrap,
  setNavigationOrder,
  setTabTrap,
  subscribe
};
