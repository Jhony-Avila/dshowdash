import { PRESETS } from "../constants.js";
import { activePresets } from "../state.js";
import { enable } from "../presets/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.system.detection";
function detectSystemPreferences() {
  const prefs = {
    reducedMotion: false,
    highContrast: false,
    darkMode: false
  };
  if (typeof window === "undefined") return prefs;
  if (window.matchMedia) {
    prefs.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    prefs.highContrast = window.matchMedia("(prefers-contrast: more)").matches;
    prefs.darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return prefs;
}
function applySystemPreferences() {
  const prefs = detectSystemPreferences();
  const applied = [];
  if (prefs.reducedMotion && !activePresets.has(PRESETS.REDUCED_MOTION)) {
    enable(PRESETS.REDUCED_MOTION);
    applied.push(PRESETS.REDUCED_MOTION);
  }
  if (prefs.highContrast && !activePresets.has(PRESETS.HIGH_CONTRAST)) {
    enable(PRESETS.HIGH_CONTRAST);
    applied.push(PRESETS.HIGH_CONTRAST);
  }
  return { ok: true, applied, systemPrefs: prefs };
}
export {
  MODULE_ID,
  VERSION,
  applySystemPreferences,
  detectSystemPreferences
};
