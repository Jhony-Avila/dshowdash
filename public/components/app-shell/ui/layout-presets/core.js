import { PRESETS, PRESET_CONFIGS, applyRegionConfig, applyCssVars, clearCssVars } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.layout-presets.core";
function getPresetConfig(name, customPresets) {
  if (PRESET_CONFIGS[name]) return PRESET_CONFIGS[name];
  if (customPresets.has(name)) return customPresets.get(name);
  return null;
}
function applyPreset(presetName, options, state) {
  options = options || {};
  const config = getPresetConfig(presetName, state.customPresets);
  if (!config) return { ok: false, error: `Unknown preset: ${presetName}` };
  const oldPreset = state.currentPreset;
  const oldConfig = getPresetConfig(oldPreset, state.customPresets);
  if (oldConfig && oldConfig.cssVars) {
    clearCssVars(oldConfig.cssVars);
  }
  if (typeof document !== "undefined" && options.animate !== false) {
    document.body.classList.add("shell-layout-transitioning");
    document.body.style.setProperty("--shell-transition-duration", `${state.transitionDuration}ms`);
  }
  const regionNames = Object.keys(config.regions);
  for (let i = 0; i < regionNames.length; i++) {
    applyRegionConfig(regionNames[i], config.regions[regionNames[i]]);
  }
  if (config.cssVars) {
    applyCssVars(config.cssVars);
  }
  state.previousPreset = oldPreset;
  state.currentPreset = presetName;
  state.metrics.presetChanges++;
  if (typeof document !== "undefined") {
    document.body.setAttribute("data-layout-preset", presetName);
    const duration = state.transitionDuration;
    setTimeout(() => {
      document.body.classList.remove("shell-layout-transitioning");
    }, duration);
  }
  state.notify({
    type: "preset-changed",
    from: oldPreset,
    to: presetName,
    config,
    timestamp: Date.now()
  });
  return { ok: true, preset: presetName, previous: oldPreset };
}
function createPreset(name, config, state) {
  if (PRESET_CONFIGS[name]) return { ok: false, error: "Cannot override built-in preset" };
  if (!config.regions) return { ok: false, error: "Preset must have regions config" };
  state.customPresets.set(name, {
    name: config.name || name,
    description: config.description || "",
    regions: config.regions,
    cssVars: config.cssVars || {}
  });
  state.metrics.customPresetsCreated++;
  return { ok: true, preset: name };
}
function deletePreset(name, state, applyFn) {
  if (PRESET_CONFIGS[name]) return { ok: false, error: "Cannot delete built-in preset" };
  if (state.currentPreset === name) {
    applyFn(PRESETS.DEFAULT);
  }
  return { ok: state.customPresets.delete(name) };
}
function clonePreset(sourceName, newName, overrides, state) {
  const source = getPresetConfig(sourceName, state.customPresets);
  if (!source) return { ok: false, error: "Source preset not found" };
  const newConfig = {
    name: overrides?.name || newName,
    description: overrides?.description || source.description,
    regions: Object.assign({}, source.regions, overrides?.regions || {}),
    cssVars: Object.assign({}, source.cssVars, overrides?.cssVars || {})
  };
  return createPreset(newName, newConfig, state);
}
export {
  MODULE_ID,
  VERSION,
  applyPreset,
  clonePreset,
  createPreset,
  deletePreset,
  getPresetConfig
};
