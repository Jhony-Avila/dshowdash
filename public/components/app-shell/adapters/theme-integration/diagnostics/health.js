import { VERSION, MODULE_ID, THEMES } from "../constants.js";
import {
  isInitialized,
  getCurrentTheme,
  getResolvedTheme,
  getSystemPreference,
  getRegionThemes,
  getListeners,
  getMetrics as _getMetrics
} from "../state.js";
import { getThemeVariables } from "../variables/css-variables.js";
function getMetrics() {
  return _getMetrics();
}
function healthCheck() {
  const currentTheme = getCurrentTheme();
  const resolvedTheme = getResolvedTheme();
  const metrics = getMetrics();
  const regionThemes = getRegionThemes();
  const checks = {
    initialized: isInitialized(),
    hasTheme: !!currentTheme,
    hasResolved: !!resolvedTheme,
    noErrors: metrics.errors === 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  let status = "UNHEALTHY";
  if (passed === total) status = "HEALTHY";
  else if (passed >= 2) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    currentTheme,
    resolvedTheme,
    systemPreference: getSystemPreference(),
    isDarkMode: resolvedTheme === "dark",
    regionOverrides: Object.keys(regionThemes).length,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const currentTheme = getCurrentTheme();
  const resolvedTheme = getResolvedTheme();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized(),
    currentTheme,
    resolvedTheme,
    systemPreference: getSystemPreference(),
    isDarkMode: resolvedTheme === "dark",
    isLightMode: resolvedTheme === "light",
    isSystemTheme: currentTheme === THEMES.SYSTEM,
    regionThemes: getRegionThemes(),
    availableThemes: THEMES,
    themeVariables: getThemeVariables(),
    listenerCount: getListeners().length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var health_default = {
  getMetrics,
  healthCheck,
  info
};
export {
  health_default as default,
  getMetrics,
  healthCheck,
  info
};
