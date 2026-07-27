import { activePresets, subscribers, incrementMetric, resetCustomSettings } from "../state.js";
import { presetConfigs } from "../presets-config.js";
import { saveToStorage } from "../storage/persistence.js";
import { applyCssVars, removeCssVars, applyBodyClasses } from "../css/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.presets.manager";
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function getActivePresets() {
  return Array.from(activePresets);
}
function enable(presetName) {
  const config = presetConfigs[presetName];
  if (!config) {
    return { ok: false, error: `Unknown preset: ${presetName}` };
  }
  if (activePresets.has(presetName)) {
    return { ok: true, alreadyActive: true };
  }
  if (config.cssVars) {
    applyCssVars(config.cssVars);
  }
  if (config.bodyClasses) {
    applyBodyClasses(config.bodyClasses, true);
  }
  activePresets.add(presetName);
  incrementMetric("presetChanges");
  saveToStorage();
  notifySubscribers({
    type: "preset-enabled",
    preset: presetName,
    activePresets: getActivePresets(),
    timestamp: Date.now()
  });
  return { ok: true, preset: presetName };
}
function disable(presetName) {
  const config = presetConfigs[presetName];
  if (!config) {
    return { ok: false, error: `Unknown preset: ${presetName}` };
  }
  if (!activePresets.has(presetName)) {
    return { ok: true, notActive: true };
  }
  if (config.cssVars) {
    removeCssVars(config.cssVars);
  }
  if (config.bodyClasses) {
    applyBodyClasses(config.bodyClasses, false);
  }
  activePresets.delete(presetName);
  incrementMetric("presetChanges");
  saveToStorage();
  notifySubscribers({
    type: "preset-disabled",
    preset: presetName,
    activePresets: getActivePresets(),
    timestamp: Date.now()
  });
  return { ok: true, preset: presetName };
}
function toggle(presetName) {
  if (activePresets.has(presetName)) {
    return disable(presetName);
  }
  return enable(presetName);
}
function enableMultiple(presetNames) {
  const results = [];
  for (let i = 0; i < presetNames.length; i++) {
    results.push(enable(presetNames[i]));
  }
  return results;
}
function reset() {
  const active = Array.from(activePresets);
  for (let i = 0; i < active.length; i++) {
    disable(active[i]);
  }
  resetCustomSettings();
  saveToStorage();
  notifySubscribers({
    type: "reset",
    timestamp: Date.now()
  });
  return { ok: true };
}
function isEnabled(presetName) {
  return activePresets.has(presetName);
}
export {
  MODULE_ID,
  VERSION,
  disable,
  enable,
  enableMultiple,
  getActivePresets,
  isEnabled,
  reset,
  toggle
};
