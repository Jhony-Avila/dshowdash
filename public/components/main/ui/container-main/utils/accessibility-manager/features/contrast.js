import { CONTRAST_MODES } from "../constants.js";
import { updateConfig, updateUserPreferences, incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { _savePreferences } from "../helpers/storage.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.features.contrast";
function setContrastMode(mode) {
  if (!Object.values(CONTRAST_MODES).includes(mode)) return false;
  const root = document.documentElement;
  root.classList.remove("dsd-high-contrast", "dsd-highest-contrast");
  if (mode === CONTRAST_MODES.HIGH) {
    root.classList.add("dsd-high-contrast");
  } else if (mode === CONTRAST_MODES.HIGHEST) {
    root.classList.add("dsd-high-contrast", "dsd-highest-contrast");
  }
  updateConfig({ contrastMode: mode });
  updateUserPreferences({ contrastMode: mode });
  incrementMetric("preferencesChanged");
  _savePreferences();
  _emit("contrastModeChanged", { mode });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  setContrastMode
};
