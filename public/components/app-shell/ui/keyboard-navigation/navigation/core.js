import { notifyListeners } from "../state.js";
import { focusFirstInRegion } from "../helpers/focus.js";
import { handleF6 } from "../handlers/f6.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.navigation.core";
function navigateToRegion(regionName) {
  const result = focusFirstInRegion(regionName);
  if (result) {
    notifyListeners("navigate-to", { region: regionName });
  }
  return result;
}
function navigateNext() {
  const fakeEvent = { preventDefault() {
  }, shiftKey: false, key: "F6" };
  handleF6(fakeEvent, false);
  return true;
}
function navigatePrevious() {
  const fakeEvent = { preventDefault() {
  }, shiftKey: true, key: "F6" };
  handleF6(fakeEvent, true);
  return true;
}
function navigateToMain() {
  return navigateToRegion("main");
}
export {
  MODULE_ID,
  VERSION,
  navigateNext,
  navigatePrevious,
  navigateToMain,
  navigateToRegion
};
