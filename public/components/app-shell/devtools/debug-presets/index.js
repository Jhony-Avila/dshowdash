import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS } from "./constants.js";
import {
  applyPreset,
  applyCustomPreset,
  disablePreset,
  loadFromStorage
} from "./core.js";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return _Ports.get(name);
}
function injectPorts(p) {
  return _Ports.inject(p);
}
function getPortsSnapshot() {
  return _Ports.snapshot();
}
let _currentPreset = null;
let _customConfig = null;
let _previousPreset = null;
const _subscribers = [];
const _history = [];
let _enabled = false;
const _config = {
  maxHistory: 20,
  persistToStorage: true,
  storageKey: "app-shell-debug-preset",
  autoApplyOnLoad: true
};
const _metrics = {
  presetsApplied: 0,
  customConfigsCreated: 0,
  presetChanges: 0
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
  get customConfig() {
    return _customConfig;
  },
  set customConfig(v) {
    _customConfig = v;
  },
  get previousPreset() {
    return _previousPreset;
  },
  set previousPreset(v) {
    _previousPreset = v;
  },
  get enabled() {
    return _enabled;
  },
  set enabled(v) {
    _enabled = v;
  },
  get config() {
    return _config;
  },
  get metrics() {
    return _metrics;
  },
  get history() {
    return _history;
  },
  getPort: _getPort,
  notify: _notifySubscribers
};
function apply(presetName) {
  return applyPreset(presetName, _stateProxy);
}
function applyCustom(customConfig) {
  return applyCustomPreset(customConfig, _stateProxy);
}
function disable() {
  disablePreset(_stateProxy);
}
function revert() {
  if (!_previousPreset) return false;
  return apply(_previousPreset);
}
function getCurrent() {
  return _currentPreset;
}
function getCurrentConfig() {
  if (_currentPreset === PRESETS.CUSTOM) return _customConfig;
  return _currentPreset ? PRESET_CONFIGS[_currentPreset] : null;
}
function getPrevious() {
  return _previousPreset;
}
function isEnabled() {
  return _enabled;
}
function getPresetConfig(presetName) {
  return PRESET_CONFIGS[presetName] ? Object.assign({}, PRESET_CONFIGS[presetName]) : null;
}
function listPresets() {
  return Object.keys(PRESET_CONFIGS).map((key) => {
    const presetCfg = PRESET_CONFIGS[key];
    return { id: key, name: presetCfg.name, description: presetCfg.description, logLevel: presetCfg.logLevel, isCurrent: key === _currentPreset };
  });
}
function getHistory() {
  return _history.slice();
}
function configure(options) {
  if (options.maxHistory !== void 0) _config.maxHistory = options.maxHistory;
  if (options.persistToStorage !== void 0) _config.persistToStorage = !!options.persistToStorage;
  if (options.storageKey !== void 0) _config.storageKey = options.storageKey;
  if (options.autoApplyOnLoad !== void 0) _config.autoApplyOnLoad = !!options.autoApplyOnLoad;
}
function getConfig() {
  return Object.assign({}, _config);
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
function minimal() {
  return apply(PRESETS.MINIMAL);
}
function standard() {
  return apply(PRESETS.STANDARD);
}
function verbose() {
  return apply(PRESETS.VERBOSE);
}
function performance() {
  return apply(PRESETS.PERFORMANCE);
}
function network() {
  return apply(PRESETS.NETWORK);
}
function memory() {
  return apply(PRESETS.MEMORY);
}
function events() {
  return apply(PRESETS.EVENTS);
}
function regions() {
  return apply(PRESETS.REGIONS);
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const checks = {
    configValid: !!PRESET_CONFIGS,
    presetsAvailable: Object.keys(PRESET_CONFIGS).length > 0,
    storageAccessible: _config.persistToStorage ? !!loadFromStorage : true,
    noExcessiveChanges: _metrics.presetChanges < 100
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
    enabled: _enabled,
    portsInitialized: _Ports.isInitialized(),
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
    portsInitialized: _Ports.isInitialized(),
    currentPreset: _currentPreset,
    currentConfig: getCurrentConfig(),
    previousPreset: _previousPreset,
    enabled: _enabled,
    availablePresets: Object.keys(PRESET_CONFIGS),
    customConfig: _customConfig,
    config: getConfig(),
    metrics: getMetrics(),
    historyCount: _history.length,
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
function _init() {
  if (_config.autoApplyOnLoad) {
    const saved = loadFromStorage(_config);
    if (saved && saved.currentPreset && saved.enabled) {
      if (saved.currentPreset === PRESETS.CUSTOM && saved.customConfig) {
        _customConfig = saved.customConfig;
        applyCustom(saved.customConfig);
      } else {
        apply(saved.currentPreset);
      }
    }
  }
}
if (typeof window !== "undefined") {
  _init();
}
var debug_presets_default = {
  VERSION,
  MODULE_ID,
  PRESETS,
  apply,
  applyCustom,
  disable,
  revert,
  getCurrent,
  getCurrentConfig,
  getPrevious,
  isEnabled,
  getPresetConfig,
  listPresets,
  getHistory,
  configure,
  getConfig,
  subscribe,
  minimal,
  standard,
  verbose,
  performance,
  network,
  memory,
  events,
  regions,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts: getPortsSnapshot
};
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  apply,
  applyCustom,
  configure,
  debug_presets_default as default,
  disable,
  events,
  getConfig,
  getCurrent,
  getCurrentConfig,
  getHistory,
  getMetrics,
  getPortsSnapshot,
  getPresetConfig,
  getPrevious,
  healthCheck,
  info,
  injectPorts,
  isEnabled,
  listPresets,
  memory,
  minimal,
  network,
  performance,
  regions,
  revert,
  standard,
  subscribe,
  verbose
};
