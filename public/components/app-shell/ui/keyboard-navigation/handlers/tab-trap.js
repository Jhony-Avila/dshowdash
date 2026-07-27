import { getRegion } from "../../../core/dom-regions/index.js";
import { isEnabled, getTabTrapRegion } from "../state.js";
import { getFocusableElements } from "../helpers/focus.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.handlers.tab-trap";
function handleTabTrap(event) {
  const tabTrapRegion = getTabTrapRegion();
  if (!tabTrapRegion || !isEnabled()) return;
  const region = getRegion(tabTrapRegion);
  if (!region) return;
  const focusable = getFocusableElements(region);
  if (focusable.length === 0) return;
  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  handleTabTrap
};
