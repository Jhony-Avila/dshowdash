import { THEMES } from "../constants.js";
import {
  getCurrentTheme,
  setCurrentTheme,
  getResolvedTheme,
  setResolvedTheme,
  getSystemPreference,
  getListeners,
  incrementMetric
} from "../state.js";
import { resolveTheme, applyTheme } from "./theme-engine.js";
import LayoutPersistence from "../../../state/layout-persistence.js";
const VERSION = "1.3.0-FIX-MISSING-EXPORTS";
const MODULE_ID = "app-shell.adapters.theme-integration.core.theme-api";
function _notifyListeners(event, data) {
  const listeners = getListeners();
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      incrementMetric("errors");
    }
  }
}
function getTheme() {
  return getCurrentTheme();
}
function getResolved() {
  return getResolvedTheme();
}
function setTheme(theme, options) {
  options = options || {};
  const persist = options.persist !== false;
  if (theme !== THEMES.LIGHT && theme !== THEMES.DARK && theme !== THEMES.SYSTEM) {
    incrementMetric("errors");
    return false;
  }
  const oldTheme = getCurrentTheme();
  const oldResolved = getResolvedTheme();
  setCurrentTheme(theme);
  const newResolved = resolveTheme(theme);
  setResolvedTheme(newResolved);
  applyTheme(newResolved);
  if (persist) {
    LayoutPersistence.setThemeMode(theme);
  }
  incrementMetric("themeChanges");
  _notifyListeners("theme-change", {
    oldTheme,
    newTheme: theme,
    oldResolved,
    newResolved
  });
  return true;
}
function toggleTheme() {
  const resolved = getResolvedTheme();
  const newTheme = resolved === "light" ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
  return newTheme;
}
function useSystemTheme() {
  return setTheme(THEMES.SYSTEM);
}
function isDarkMode() {
  return getResolvedTheme() === "dark";
}
function isLightMode() {
  return getResolvedTheme() === "light";
}
function isSystemTheme() {
  return getCurrentTheme() === THEMES.SYSTEM;
}
function getSystemPref() {
  return getSystemPreference();
}
var theme_api_default = {
  getTheme,
  getResolved,
  setTheme,
  toggleTheme,
  useSystemTheme,
  isDarkMode,
  isLightMode,
  isSystemTheme,
  getSystemPref
};
export {
  MODULE_ID,
  VERSION,
  theme_api_default as default,
  getResolved,
  getSystemPref,
  getTheme,
  isDarkMode,
  isLightMode,
  isSystemTheme,
  setTheme,
  toggleTheme,
  useSystemTheme
};
