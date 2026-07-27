import { VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS } from "./constants.js";
import {
  getPresetConfig,
  applyPreset,
  createPreset as _createPreset,
  deletePreset as _deletePreset,
  clonePreset as _clonePreset
} from "./core.js";
let _currentPreset = PRESETS.DEFAULT;
let _previousPreset = null;
const _customPresets = /* @__PURE__ */ new Map();
const _subscribers = [];
let _transitionDuration = 300;
const _metrics = {
  presetChanges: 0,
  customPresetsCreated: 0
};
function _notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
const _stateProxy = {
  get currentPreset() {
    return _currentPreset;
  },
  set currentPreset(v) {
    _currentPreset = v;
  },
  get previousPreset() {
    return _previousPreset;
  },
  set previousPreset(v) {
    _previousPreset = v;
  },
  get customPresets() {
    return _customPresets;
  },
  get transitionDuration() {
    return _transitionDuration;
  },
  get metrics() {
    return _metrics;
  },
  notify: _notifySubscribers
};
function apply(presetName, options) {
  return applyPreset(presetName, options, _stateProxy);
}
function getCurrent() {
  return _currentPreset;
}
function getPrevious() {
  return _previousPreset;
}
function revert() {
  if (_previousPreset) return apply(_previousPreset);
  return { ok: false, error: "No previous preset" };
}
function getConfig(presetName) {
  presetName = presetName || _currentPreset;
  const config = getPresetConfig(presetName, _customPresets);
  return config ? Object.assign({}, config) : null;
}
function listPresets() {
  const result = [];
  const keys = Object.keys(PRESET_CONFIGS);
  for (let i = 0; i < keys.length; i++) {
    result.push({
      name: keys[i],
      displayName: PRESET_CONFIGS[keys[i]].name,
      description: PRESET_CONFIGS[keys[i]].description,
      isBuiltIn: true,
      isCurrent: keys[i] === _currentPreset
    });
  }
  _customPresets.forEach((config, name) => {
    result.push({
      name,
      displayName: config.name,
      description: config.description,
      isBuiltIn: false,
      isCurrent: name === _currentPreset
    });
  });
  return result;
}
function createPreset(name, config) {
  return _createPreset(name, config, _stateProxy);
}
function deletePreset(name) {
  return _deletePreset(name, _stateProxy, apply);
}
function clonePreset(sourceName, newName, overrides) {
  return _clonePreset(sourceName, newName, overrides, _stateProxy);
}
function setTransitionDuration(ms) {
  _transitionDuration = Math.max(0, Math.min(1e3, ms));
}
function getTransitionDuration() {
  return _transitionDuration;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return {
    presetChanges: _metrics.presetChanges,
    customPresetsCreated: _metrics.customPresetsCreated,
    builtInPresets: Object.keys(PRESET_CONFIGS).length,
    customPresets: _customPresets.size,
    currentPreset: _currentPreset
  };
}
function healthCheck() {
  const config = getPresetConfig(_currentPreset, _customPresets);
  const checks = {
    hasCurrentPreset: !!config,
    presetValid: config && config.regions && Object.keys(config.regions).length > 0,
    notTooManyCustom: _customPresets.size <= 20
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
    currentPreset: _currentPreset,
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
    currentPreset: _currentPreset,
    previousPreset: _previousPreset,
    presets: listPresets(),
    transitionDuration: _transitionDuration,
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
var layout_presets_default = {
  VERSION,
  MODULE_ID,
  PRESETS,
  apply,
  getCurrent,
  getPrevious,
  revert,
  getConfig,
  listPresets,
  createPreset,
  deletePreset,
  clonePreset,
  setTransitionDuration,
  getTransitionDuration,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  apply,
  clonePreset,
  createPreset,
  layout_presets_default as default,
  deletePreset,
  getConfig,
  getCurrent,
  getMetrics,
  getPrevious,
  getTransitionDuration,
  healthCheck,
  info,
  listPresets,
  revert,
  setTransitionDuration,
  subscribe
};
