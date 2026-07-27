import { VERSION, MODULE_ID, PRESETS } from "./constants.js";
import { getPresetConfig } from "./presets-config.js";
import { enable, disable, toggle, enableMultiple, reset, isEnabled, getActivePresets } from "./presets/manager.js";
import { setSetting, getSetting, getAllSettings, removeSetting } from "./settings/manager.js";
import { detectSystemPreferences, applySystemPreferences } from "./system/detection.js";
import { listPresets, configure, getConfig, subscribe, healthCheck, info, getMetrics } from "./api.js";
import { activePresets, config } from "./state.js";
import { loadFromStorage } from "./storage/persistence.js";
import { enable as enable2 } from "./presets/manager.js";
import { applySystemPreferences as applySystemPreferences2 } from "./system/detection.js";
if (typeof window !== "undefined") {
  loadFromStorage();
  const toApply = Array.from(activePresets);
  activePresets.clear();
  for (let i = 0; i < toApply.length; i++) {
    enable2(toApply[i]);
  }
  if (config.autoDetectSystem && activePresets.size === 0) {
    applySystemPreferences2();
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, PRESETS as PRESETS2 } from "./constants.js";
import { getActivePresets as getActivePresets2, isEnabled as isEnabled2, toggle as toggle2, enableMultiple as enableMultiple2, reset as reset2, disable as disable2 } from "./presets/manager.js";
import { setSetting as setSetting2, getSetting as getSetting2, getAllSettings as getAllSettings2, removeSetting as removeSetting2 } from "./settings/manager.js";
import { detectSystemPreferences as detectSystemPreferences2 } from "./system/detection.js";
import { listPresets as listPresets2, configure as configure2, getConfig as getConfig2, subscribe as subscribe2, healthCheck as healthCheck2, info as info2, getMetrics as getMetrics2, getPresetConfig as getPresetConfig2 } from "./api.js";
var accessibility_presets_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  PRESETS: PRESETS2,
  enable: enable2,
  disable: disable2,
  toggle: toggle2,
  enableMultiple: enableMultiple2,
  reset: reset2,
  isEnabled: isEnabled2,
  getActivePresets: getActivePresets2,
  listPresets: listPresets2,
  getPresetConfig: getPresetConfig2,
  setSetting: setSetting2,
  getSetting: getSetting2,
  getAllSettings: getAllSettings2,
  removeSetting: removeSetting2,
  detectSystemPreferences: detectSystemPreferences2,
  applySystemPreferences: applySystemPreferences2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  applySystemPreferences,
  configure,
  accessibility_presets_default as default,
  detectSystemPreferences,
  disable,
  enable,
  enableMultiple,
  getActivePresets,
  getAllSettings,
  getConfig,
  getMetrics,
  getPresetConfig,
  getSetting,
  healthCheck,
  info,
  isEnabled,
  listPresets,
  removeSetting,
  reset,
  setSetting,
  subscribe,
  toggle
};
