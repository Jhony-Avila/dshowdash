import { A11Y_FEATURES, CONTRAST_MODES } from "../constants.js";
import { getConfig, getUserPreferences, updateUserPreferences } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { _savePreferences } from "../helpers/storage.js";
import { _applyReducedMotion } from "./motion.js";
import { setContrastMode } from "./contrast.js";
import { setTextScale } from "./text-scale.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.features.toggle";
function enableFeature(feature) {
  const root = document.documentElement;
  switch (feature) {
    case A11Y_FEATURES.REDUCED_MOTION:
      _applyReducedMotion(true);
      updateUserPreferences({ reducedMotion: true });
      break;
    case A11Y_FEATURES.HIGH_CONTRAST:
      setContrastMode(CONTRAST_MODES.HIGH);
      break;
    case A11Y_FEATURES.LARGE_TEXT:
      setTextScale(1.2);
      break;
    case A11Y_FEATURES.FOCUS_INDICATORS:
      root.classList.add("dsd-focus-visible");
      updateUserPreferences({ focusIndicators: true });
      break;
    case A11Y_FEATURES.KEYBOARD_ONLY:
      root.classList.add("dsd-keyboard-only");
      updateUserPreferences({ keyboardOnly: true });
      break;
    default:
      return false;
  }
  _savePreferences();
  _emit("featureEnabled", { feature });
  return true;
}
function disableFeature(feature) {
  const root = document.documentElement;
  switch (feature) {
    case A11Y_FEATURES.REDUCED_MOTION:
      _applyReducedMotion(false);
      updateUserPreferences({ reducedMotion: false });
      break;
    case A11Y_FEATURES.HIGH_CONTRAST:
      setContrastMode(CONTRAST_MODES.NORMAL);
      break;
    case A11Y_FEATURES.LARGE_TEXT:
      setTextScale(1);
      break;
    case A11Y_FEATURES.FOCUS_INDICATORS:
      root.classList.remove("dsd-focus-visible");
      updateUserPreferences({ focusIndicators: false });
      break;
    case A11Y_FEATURES.KEYBOARD_ONLY:
      root.classList.remove("dsd-keyboard-only");
      updateUserPreferences({ keyboardOnly: false });
      break;
    default:
      return false;
  }
  _savePreferences();
  _emit("featureDisabled", { feature });
  return true;
}
function isFeatureEnabled(feature) {
  const config = getConfig();
  const prefs = getUserPreferences();
  switch (feature) {
    case A11Y_FEATURES.REDUCED_MOTION:
      return prefs.reducedMotion === true;
    case A11Y_FEATURES.HIGH_CONTRAST:
      return config.contrastMode !== CONTRAST_MODES.NORMAL;
    case A11Y_FEATURES.LARGE_TEXT:
      return config.textScale > 1.1;
    case A11Y_FEATURES.FOCUS_INDICATORS:
      return prefs.focusIndicators === true;
    case A11Y_FEATURES.KEYBOARD_ONLY:
      return prefs.keyboardOnly === true;
    default:
      return false;
  }
}
export {
  MODULE_ID,
  VERSION,
  disableFeature,
  enableFeature,
  isFeatureEnabled
};
