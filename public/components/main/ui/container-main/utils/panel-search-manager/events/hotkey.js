import { getConfig } from "../state.js";
import { toggle } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.events.hotkey";
function _setupGlobalHotkey() {
  const config = getConfig();
  const [modifier, key] = config.hotkey.split("+");
  document.addEventListener("keydown", (e) => {
    const modifierPressed = {
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    }[modifier];
    if (modifierPressed && e.key.toLowerCase() === key.toLowerCase()) {
      e.preventDefault();
      toggle();
    }
  });
}
export {
  MODULE_ID,
  VERSION,
  _setupGlobalHotkey
};
