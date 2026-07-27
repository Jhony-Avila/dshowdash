import { getRegion } from "../../../core/dom-regions/index.js";
import { isEnabled, getTabTrapRegion, incrementMetric, notifyListeners } from "../state.js";
import { focusFirstInRegion } from "../helpers/focus.js";
import { releaseTabTrap } from "../trap/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.handlers.escape";
function handleEscape(event) {
  if (!isEnabled()) return;
  if (getTabTrapRegion()) {
    releaseTabTrap();
    incrementMetric("escapeActions");
    event.preventDefault();
    return;
  }
  const mainRegion = getRegion("main");
  if (mainRegion && !mainRegion.contains(document.activeElement)) {
    focusFirstInRegion("main");
    incrementMetric("escapeActions");
    notifyListeners("escape-to-main", { from: document.activeElement });
  }
}
export {
  MODULE_ID,
  VERSION,
  handleEscape
};
