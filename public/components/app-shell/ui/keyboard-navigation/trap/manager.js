import { getRegion } from "../../../core/dom-regions/index.js";
import {
  getTabTrapRegion as _getTabTrapRegion,
  setTabTrapRegion,
  getPreviousFocus,
  setPreviousFocus,
  incrementMetric,
  notifyListeners
} from "../state.js";
import { focusFirstInRegion } from "../helpers/focus.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.trap.manager";
function setTabTrap(regionName) {
  const region = getRegion(regionName);
  if (!region) return false;
  setPreviousFocus(document.activeElement);
  setTabTrapRegion(regionName);
  incrementMetric("tabTraps");
  focusFirstInRegion(regionName);
  notifyListeners("tab-trap-set", { region: regionName });
  return true;
}
function releaseTabTrap() {
  const tabTrapRegion = _getTabTrapRegion();
  if (!tabTrapRegion) return false;
  const regionName = tabTrapRegion;
  setTabTrapRegion(null);
  const previousFocus = getPreviousFocus();
  if (previousFocus && document.contains(previousFocus)) {
    previousFocus.focus();
  }
  setPreviousFocus(null);
  notifyListeners("tab-trap-released", { region: regionName });
  return true;
}
function isTabTrapped() {
  return _getTabTrapRegion() !== null;
}
function getTabTrapRegion() {
  return _getTabTrapRegion();
}
export {
  MODULE_ID,
  VERSION,
  getTabTrapRegion,
  isTabTrapped,
  releaseTabTrap,
  setTabTrap
};
