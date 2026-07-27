import { KEYS } from "../constants.js";
import { isEnabled, getTabTrapRegion } from "../state.js";
import { handleF6 } from "./f6.js";
import { handleEscape } from "./escape.js";
import { handleTabTrap } from "./tab-trap.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.handlers.global";
function globalKeyHandler(event) {
  if (!isEnabled()) return;
  switch (event.key) {
    case KEYS.F6:
      handleF6(event, event.shiftKey);
      break;
    case KEYS.ESCAPE:
      handleEscape(event);
      break;
    case KEYS.TAB:
      if (getTabTrapRegion()) {
        handleTabTrap(event);
      }
      break;
  }
}
export {
  MODULE_ID,
  VERSION,
  globalKeyHandler
};
