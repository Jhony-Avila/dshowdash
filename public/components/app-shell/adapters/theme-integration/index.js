import { VERSION, MODULE_ID, THEMES } from "./constants.js";
import { addListener, removeListener } from "./state.js";
import { init, destroy } from "./core/theme-engine.js";
import {
  getTheme,
  getResolved as getResolvedTheme,
  setTheme,
  toggleTheme,
  useSystemTheme,
  isDarkMode,
  isLightMode,
  isSystemTheme,
  getSystemPref as getSystemPreference
} from "./core/theme-api.js";
import {
  setRegionTheme,
  clearRegionTheme,
  getRegionTheme,
  getRegionThemes
} from "./regions/region-themes.js";
import {
  getThemeVariable,
  setThemeVariable,
  getThemeVariables
} from "./variables/css-variables.js";
import { getMetrics, healthCheck, info } from "./diagnostics/health.js";
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  addListener(callback);
  return () => {
    removeListener(callback);
  };
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }
}
var theme_integration_default = {
  VERSION,
  MODULE_ID,
  THEMES,
  init,
  destroy,
  getTheme,
  getResolvedTheme,
  setTheme,
  toggleTheme,
  useSystemTheme,
  isDarkMode,
  isLightMode,
  isSystemTheme,
  getSystemPreference,
  setRegionTheme,
  clearRegionTheme,
  getRegionTheme,
  getRegionThemes,
  getThemeVariable,
  setThemeVariable,
  getThemeVariables,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  THEMES,
  VERSION,
  clearRegionTheme,
  theme_integration_default as default,
  destroy,
  getMetrics,
  getRegionTheme,
  getRegionThemes,
  getResolvedTheme,
  getSystemPreference,
  getTheme,
  getThemeVariable,
  getThemeVariables,
  healthCheck,
  info,
  init,
  isDarkMode,
  isLightMode,
  isSystemTheme,
  setRegionTheme,
  setTheme,
  setThemeVariable,
  subscribe,
  toggleTheme,
  useSystemTheme
};
