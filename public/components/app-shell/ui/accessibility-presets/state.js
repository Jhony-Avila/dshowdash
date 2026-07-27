const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.state";
const activePresets = /* @__PURE__ */ new Set();
const customSettings = {};
const appliedCssVars = {};
const subscribers = [];
const config = {
  persistPresets: true,
  autoDetectSystem: true,
  storageKey: "app-shell-a11y-presets"
};
const metrics = {
  presetChanges: 0,
  customizations: 0
};
function incrementMetric(key) {
  if (metrics.hasOwnProperty(key)) metrics[key]++;
}
function getMetrics() {
  return {
    presetChanges: metrics.presetChanges,
    customizations: metrics.customizations,
    activePresets: activePresets.size,
    customSettings: Object.keys(customSettings).length,
    appliedCssVars: Object.keys(appliedCssVars).length
  };
}
function resetCustomSettings() {
  for (let key in customSettings) {
    delete customSettings[key];
  }
}
export {
  MODULE_ID,
  VERSION,
  activePresets,
  appliedCssVars,
  config,
  customSettings,
  getMetrics,
  incrementMetric,
  metrics,
  resetCustomSettings,
  subscribers
};
