import {
  getRegionThemes as _getRegionThemes,
  setRegionTheme as _setRegionTheme,
  deleteRegionTheme,
  hasRegionTheme,
  getResolvedTheme,
  getListeners,
  incrementMetric
} from "../state.js";
import { applyThemeToElement } from "../core/theme-engine.js";
import { getRegion } from "../../../core/dom-regions/index.js";
const VERSION = "1.3.0-FIX-MISSING-EXPORTS";
const MODULE_ID = "app-shell.adapters.theme-integration.regions.region-themes";
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
function setRegionTheme(regionName, theme) {
  if (theme !== "light" && theme !== "dark") {
    incrementMetric("errors");
    return false;
  }
  const region = getRegion(regionName);
  if (!region) return false;
  _setRegionTheme(regionName, theme);
  applyThemeToElement(region, theme);
  _notifyListeners("region-theme-change", { region: regionName, theme });
  return true;
}
function clearRegionTheme(regionName) {
  if (!hasRegionTheme(regionName)) return false;
  deleteRegionTheme(regionName);
  const region = getRegion(regionName);
  if (region) {
    applyThemeToElement(region, getResolvedTheme());
  }
  _notifyListeners("region-theme-cleared", { region: regionName });
  return true;
}
function getRegionTheme(regionName) {
  const regionThemes = _getRegionThemes();
  return regionThemes[regionName] || getResolvedTheme();
}
function getRegionThemes() {
  const themes = _getRegionThemes();
  const result = {};
  const keys = Object.keys(themes);
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = themes[keys[i]];
  }
  return result;
}
var region_themes_default = {
  setRegionTheme,
  clearRegionTheme,
  getRegionTheme,
  getRegionThemes
};
export {
  MODULE_ID,
  VERSION,
  clearRegionTheme,
  region_themes_default as default,
  getRegionTheme,
  getRegionThemes,
  setRegionTheme
};
