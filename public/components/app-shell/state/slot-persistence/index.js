import { VERSION, MODULE_ID, MAX_STORED_SLOTS, getStorage } from "./constants.js";
import {
  saveSlotState as _saveSlotState,
  getSlotState as _getSlotState,
  removeSlotState as _removeSlotState,
  getRegionSlots as _getRegionSlots,
  saveMultiple as _saveMultiple,
  persist as _persist,
  load as _load,
  restore as _restore,
  clear as _clear
} from "./core.js";
let _slots = {};
let _metadata = {};
let _lastSaved = null;
let _saveTimeout = null;
const _subscribers = [];
const _config = {
  enabled: true,
  autoSave: true,
  autoSaveDelay: 1e3,
  persistContent: false,
  storageType: "localStorage"
};
const _metrics = {
  saves: 0,
  loads: 0,
  restores: 0,
  errors: 0
};
function _notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
function _scheduleSave() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    persist();
  }, _config.autoSaveDelay);
}
const _stateProxy = {
  get slots() {
    return _slots;
  },
  set slots(v) {
    _slots = v;
  },
  get metadata() {
    return _metadata;
  },
  set metadata(v) {
    _metadata = v;
  },
  get lastSaved() {
    return _lastSaved;
  },
  set lastSaved(v) {
    _lastSaved = v;
  },
  get config() {
    return _config;
  },
  get metrics() {
    return _metrics;
  },
  notify: _notifySubscribers,
  scheduleSave: _scheduleSave
};
function saveSlotState(slotId, state) {
  return _saveSlotState(slotId, state, _stateProxy);
}
function getSlotState(slotId) {
  return _getSlotState(slotId, _stateProxy);
}
function removeSlotState(slotId) {
  return _removeSlotState(slotId, _stateProxy);
}
function getRegionSlots(regionName) {
  return _getRegionSlots(regionName, _stateProxy);
}
function saveMultiple(slots) {
  return _saveMultiple(slots, _stateProxy);
}
function persist() {
  return _persist(_stateProxy);
}
function load() {
  return _load(_stateProxy);
}
function restore(restoreCallback) {
  return _restore(restoreCallback, _stateProxy);
}
function clear() {
  return _clear(_stateProxy);
}
function configure(options) {
  if (options.enabled !== void 0) _config.enabled = !!options.enabled;
  if (options.autoSave !== void 0) _config.autoSave = !!options.autoSave;
  if (options.autoSaveDelay !== void 0) _config.autoSaveDelay = Math.max(100, options.autoSaveDelay);
  if (options.persistContent !== void 0) _config.persistContent = !!options.persistContent;
  if (options.storageType !== void 0) {
    if (options.storageType === "sessionStorage" || options.storageType === "localStorage") {
      _config.storageType = options.storageType;
    }
  }
}
function getConfig() {
  return {
    enabled: _config.enabled,
    autoSave: _config.autoSave,
    autoSaveDelay: _config.autoSaveDelay,
    persistContent: _config.persistContent,
    storageType: _config.storageType
  };
}
function enable() {
  _config.enabled = true;
  load();
}
function disable() {
  _config.enabled = false;
}
function isEnabled() {
  return _config.enabled;
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
    saves: _metrics.saves,
    loads: _metrics.loads,
    restores: _metrics.restores,
    errors: _metrics.errors,
    storedSlots: Object.keys(_slots).length,
    lastSaved: _lastSaved
  };
}
function healthCheck() {
  const storage = getStorage(_config.storageType);
  const checks = {
    enabled: _config.enabled,
    storageAvailable: !!storage,
    notTooManySlots: Object.keys(_slots).length <= MAX_STORED_SLOTS,
    lowErrorRate: _metrics.saves === 0 || _metrics.errors / _metrics.saves < 0.1
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    config: getConfig(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    storedSlots: Object.keys(_slots).length,
    slotIds: Object.keys(_slots),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
if (typeof window !== "undefined") {
  load();
}
var slot_persistence_default = {
  VERSION,
  MODULE_ID,
  saveSlotState,
  getSlotState,
  removeSlotState,
  getRegionSlots,
  saveMultiple,
  persist,
  load,
  restore,
  clear,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  clear,
  configure,
  slot_persistence_default as default,
  disable,
  enable,
  getConfig,
  getMetrics,
  getRegionSlots,
  getSlotState,
  healthCheck,
  info,
  isEnabled,
  load,
  persist,
  removeSlotState,
  restore,
  saveMultiple,
  saveSlotState,
  subscribe
};
