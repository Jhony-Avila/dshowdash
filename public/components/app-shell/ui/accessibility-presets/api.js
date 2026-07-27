import { VERSION, MODULE_ID, PRESETS } from "./constants.js";
import { activePresets, config, subscribers, getMetrics } from "./state.js";
import { presetConfigs, getPresetConfig } from "./presets-config.js";
import { getActivePresets } from "./presets/manager.js";
import { getAllSettings } from "./settings/manager.js";
import { detectSystemPreferences } from "./system/detection.js";
function listPresets() {
  return Object.keys(presetConfigs).map((name) => {
    const cfg = presetConfigs[name];
    return {
      name,
      displayName: cfg.name,
      description: cfg.description,
      isActive: activePresets.has(name)
    };
  });
}
function configure(options) {
  if (options.persistPresets !== void 0) config.persistPresets = !!options.persistPresets;
  if (options.autoDetectSystem !== void 0) config.autoDetectSystem = !!options.autoDetectSystem;
  if (options.storageKey !== void 0) config.storageKey = options.storageKey;
}
function getConfig() {
  return Object.assign({}, config);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}
function healthCheck() {
  const checks = {
    noExcessivePresets: activePresets.size <= 5,
    noConflicts: !(activePresets.has(PRESETS.HIGH_CONTRAST) && activePresets.has(PRESETS.LOW_VISION) && activePresets.size > 3),
    configValid: typeof config.persistPresets === "boolean"
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    activePresets: getActivePresets(),
    systemPrefs: detectSystemPreferences(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    activePresets: getActivePresets(),
    customSettings: getAllSettings(),
    availablePresets: listPresets(),
    systemPrefs: detectSystemPreferences(),
    metrics: getMetrics(),
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
export {
  configure,
  getConfig,
  getMetrics,
  getPresetConfig,
  healthCheck,
  info,
  listPresets,
  subscribe
};
