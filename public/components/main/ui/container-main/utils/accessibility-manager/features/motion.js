import { A11Y_FEATURES } from "../constants.js";
import { getMediaQueries, updateUserPreferences } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { setContrastMode } from "./contrast.js";
import { CONTRAST_MODES } from "../constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.features.motion";
function _applyReducedMotion(enabled) {
  const root = document.documentElement;
  if (enabled) {
    root.style.setProperty("--cm-transition-normal", "0.01ms");
    root.style.setProperty("--cm-transition-fast", "0.01ms");
    root.style.setProperty("--cm-transition-slow", "0.01ms");
    root.classList.add("dsd-reduced-motion");
  } else {
    root.style.removeProperty("--cm-transition-normal");
    root.style.removeProperty("--cm-transition-fast");
    root.style.removeProperty("--cm-transition-slow");
    root.classList.remove("dsd-reduced-motion");
  }
}
function _setupMediaQueries() {
  const mediaQueries = getMediaQueries();
  mediaQueries.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQueries.reducedMotion.addEventListener("change", (e) => {
    updateUserPreferences({ reducedMotion: e.matches });
    _applyReducedMotion(e.matches);
    _emit("preferenceChanged", { feature: A11Y_FEATURES.REDUCED_MOTION, value: e.matches });
  });
  updateUserPreferences({ reducedMotion: mediaQueries.reducedMotion.matches });
  mediaQueries.highContrast = window.matchMedia("(prefers-contrast: more)");
  mediaQueries.highContrast.addEventListener("change", (e) => {
    updateUserPreferences({ highContrast: e.matches });
    if (e.matches) setContrastMode(CONTRAST_MODES.HIGH);
    _emit("preferenceChanged", { feature: A11Y_FEATURES.HIGH_CONTRAST, value: e.matches });
  });
  updateUserPreferences({ highContrast: mediaQueries.highContrast.matches });
}
export {
  MODULE_ID,
  VERSION,
  _applyReducedMotion,
  _setupMediaQueries
};
