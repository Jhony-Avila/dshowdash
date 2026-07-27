import { FOCUS_WRAP } from "../constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.navigation.linear";
function _navigateLinear(items, currentIndex, direction, wrap) {
  let newIndex = currentIndex + direction;
  if (wrap === FOCUS_WRAP.WRAP) {
    if (newIndex < 0) newIndex = items.length - 1;
    else if (newIndex >= items.length) newIndex = 0;
  } else if (wrap === FOCUS_WRAP.STOP) {
    newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
  } else {
    if (newIndex < 0 || newIndex >= items.length) return currentIndex;
  }
  return newIndex;
}
export {
  MODULE_ID,
  VERSION,
  _navigateLinear
};
