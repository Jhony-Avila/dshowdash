import { VERSION, MODULE_ID } from "./constants.js";
import {
  init,
  destroy,
  enable,
  disable,
  isEnabled,
  navigateToRegion,
  navigateNext,
  navigatePrevious,
  navigateToMain,
  getCurrentRegion,
  getNavigationOrder,
  setNavigationOrder,
  setTabTrap,
  releaseTabTrap,
  isTabTrapped,
  getTabTrapRegion,
  subscribe,
  getMetrics,
  healthCheck,
  info
} from "./api.js";
import { init as _autoInit } from "./api.js";
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      _autoInit();
    });
  } else {
    _autoInit();
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import {
  init as init2,
  destroy as destroy2,
  enable as enable2,
  disable as disable2,
  isEnabled as isEnabled2,
  navigateToRegion as navigateToRegion2,
  navigateNext as navigateNext2,
  navigatePrevious as navigatePrevious2,
  navigateToMain as navigateToMain2,
  getCurrentRegion as getCurrentRegion2,
  getNavigationOrder as getNavigationOrder2,
  setNavigationOrder as setNavigationOrder2,
  setTabTrap as setTabTrap2,
  releaseTabTrap as releaseTabTrap2,
  isTabTrapped as isTabTrapped2,
  getTabTrapRegion as getTabTrapRegion2,
  subscribe as subscribe2,
  getMetrics as getMetrics2,
  healthCheck as healthCheck2,
  info as info2
} from "./api.js";
var keyboard_navigation_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  init: init2,
  destroy: destroy2,
  enable: enable2,
  disable: disable2,
  isEnabled: isEnabled2,
  navigateToRegion: navigateToRegion2,
  navigateNext: navigateNext2,
  navigatePrevious: navigatePrevious2,
  navigateToMain: navigateToMain2,
  getCurrentRegion: getCurrentRegion2,
  getNavigationOrder: getNavigationOrder2,
  setNavigationOrder: setNavigationOrder2,
  setTabTrap: setTabTrap2,
  releaseTabTrap: releaseTabTrap2,
  isTabTrapped: isTabTrapped2,
  getTabTrapRegion: getTabTrapRegion2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  VERSION,
  keyboard_navigation_default as default,
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
