import { PRESETS, PRESET_CONFIGS, LOG_LEVEL_MAP } from "./constants.js";
import { _state, addToHistory, notifySubscribers } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.debug-presets.core";
const STORAGE_KEY = "app-shell-debug-preset";
function saveToStorage(presetName, customConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preset: presetName,
      custom: customConfig || null,
      savedAt: Date.now()
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function loadFromStorage(_config2) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
  }
  return null;
}
function applyConfig(config) {
  if (!config) return false;
  try {
    const appShell = typeof window !== "undefined" ? window.AppShell : null;
    if (appShell && appShell.logger && appShell.logger.setLevel) {
      const level = LOG_LEVEL_MAP[config.logLevel] !== void 0 ? LOG_LEVEL_MAP[config.logLevel] : 1;
      appShell.logger.setLevel(level);
    }
    if (config.features) {
      if (config.features.memoryTracking && appShell && appShell.memoryLeaks) {
        if (typeof appShell.memoryLeaks.startTracking === "function") {
          appShell.memoryLeaks.startTracking();
        }
      }
      if (config.features.performanceMarks && appShell && appShell.autoHealthCheck) {
        if (typeof appShell.autoHealthCheck.start === "function") {
          appShell.autoHealthCheck.start({ interval: 1e4 });
        }
      }
    }
    if (typeof window !== "undefined") {
      window.__debugPreset = {
        name: _state.current,
        config,
        appliedAt: Date.now()
      };
    }
    return true;
  } catch (e) {
    return false;
  }
}
function applyPreset(presetName, _proxy) {
  const config = PRESET_CONFIGS[presetName];
  if (!config) {
    return { ok: false, error: `Unknown preset: ${presetName}` };
  }
  if (_state.current) {
    _state.previous = _state.current;
  }
  _state.current = presetName;
  _state.currentConfig = Object.assign({}, config);
  _state.enabled = true;
  applyConfig(config);
  saveToStorage(presetName);
  addToHistory(presetName);
  notifySubscribers("preset-applied", { preset: presetName, config });
  return { ok: true, preset: presetName };
}
function applyCustomPreset(customConfig, _proxy) {
  if (!customConfig) {
    return { ok: false, error: "No config provided" };
  }
  const merged = Object.assign({}, PRESET_CONFIGS.standard, customConfig);
  if (_state.current) {
    _state.previous = _state.current;
  }
  _state.current = PRESETS.CUSTOM;
  _state.currentConfig = merged;
  _state.enabled = true;
  applyConfig(merged);
  saveToStorage(PRESETS.CUSTOM, customConfig);
  addToHistory(PRESETS.CUSTOM);
  notifySubscribers("preset-applied", { preset: PRESETS.CUSTOM, config: merged });
  return { ok: true, preset: PRESETS.CUSTOM, config: merged };
}
function disablePreset(_proxy) {
  if (!_state.enabled) {
    return { ok: false, error: "No preset active" };
  }
  _state.previous = _state.current;
  _state.current = null;
  _state.currentConfig = null;
  _state.enabled = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
  }
  if (typeof window !== "undefined") {
    delete window.__debugPreset;
  }
  notifySubscribers("preset-disabled", { previous: _state.previous });
  return { ok: true, previous: _state.previous };
}
var core_default = {
  saveToStorage,
  loadFromStorage,
  applyConfig,
  applyPreset,
  applyCustomPreset,
  disablePreset
};
export {
  MODULE_ID,
  VERSION,
  applyConfig,
  applyCustomPreset,
  applyPreset,
  core_default as default,
  disablePreset,
  loadFromStorage,
  saveToStorage
};
