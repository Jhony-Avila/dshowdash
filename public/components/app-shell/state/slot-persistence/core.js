import { STORAGE_KEY, MAX_STORED_SLOTS, MAX_CONTENT_SIZE } from "./constants.js";
import { _state, incrementMetric } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.state.slot-persistence.core";
function saveSlotState(regionName, slotId, state, options) {
  options = options || {};
  if (!_state.slots[regionName]) {
    _state.slots[regionName] = {};
  }
  const slotState = {
    visible: state.visible !== false,
    position: state.position || null,
    order: state.order || 0,
    collapsed: state.collapsed || false,
    customData: state.customData || null,
    updatedAt: Date.now()
  };
  if (options.saveContent && state.content && state.content.length < MAX_CONTENT_SIZE) {
    slotState.content = state.content;
  }
  _state.slots[regionName][slotId] = slotState;
  incrementMetric("saves");
  _trimSlots();
  return true;
}
function getSlotState(regionName, slotId) {
  if (!_state.slots[regionName]) return null;
  return _state.slots[regionName][slotId] || null;
}
function removeSlotState(regionName, slotId) {
  if (!_state.slots[regionName]) return false;
  if (!_state.slots[regionName][slotId]) return false;
  delete _state.slots[regionName][slotId];
  return true;
}
function getRegionSlots(regionName, _proxy) {
  if (!_state.slots[regionName]) return {};
  return Object.assign({}, _state.slots[regionName]);
}
function saveMultiple(slots, _proxy) {
  const keys = Object.keys(slots);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const regionSlots = slots[regionName];
    const slotIds = Object.keys(regionSlots);
    for (let j = 0; j < slotIds.length; j++) {
      saveSlotState(regionName, slotIds[j], regionSlots[slotIds[j]]);
    }
  }
  return true;
}
function _trimSlots() {
  let totalSlots = 0;
  const regionNames = Object.keys(_state.slots);
  for (let i = 0; i < regionNames.length; i++) {
    totalSlots += Object.keys(_state.slots[regionNames[i]]).length;
  }
  if (totalSlots > MAX_STORED_SLOTS) {
    const allSlots = [];
    for (let i = 0; i < regionNames.length; i++) {
      const region = regionNames[i];
      const slotIds = Object.keys(_state.slots[region]);
      for (let j = 0; j < slotIds.length; j++) {
        allSlots.push({
          region,
          slotId: slotIds[j],
          updatedAt: _state.slots[region][slotIds[j]].updatedAt || 0
        });
      }
    }
    allSlots.sort((a, b) => a.updatedAt - b.updatedAt);
    const toRemove = allSlots.slice(0, totalSlots - MAX_STORED_SLOTS);
    for (let k = 0; k < toRemove.length; k++) {
      removeSlotState(toRemove[k].region, toRemove[k].slotId);
    }
  }
}
function persist(_proxy) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      slots: _state.slots,
      timestamp: Date.now()
    }));
    return true;
  } catch (e) {
    incrementMetric("errors");
    return false;
  }
}
function load(_proxy) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored);
    _state.slots = data.slots || {};
    incrementMetric("loads");
    return true;
  } catch (e) {
    incrementMetric("errors");
    return false;
  }
}
function restore(callback, _proxy) {
  if (typeof callback !== "function") return false;
  const regionNames = Object.keys(_state.slots);
  for (let i = 0; i < regionNames.length; i++) {
    const region = regionNames[i];
    const slotIds = Object.keys(_state.slots[region]);
    for (let j = 0; j < slotIds.length; j++) {
      const slotId = slotIds[j];
      const slotState = _state.slots[region][slotId];
      callback(region, slotId, slotState);
    }
  }
  incrementMetric("restores");
  return true;
}
function clear(_proxy) {
  _state.slots = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
function getMetrics() {
  let totalSlots = 0;
  const regionNames = Object.keys(_state.slots);
  for (let i = 0; i < regionNames.length; i++) {
    totalSlots += Object.keys(_state.slots[regionNames[i]]).length;
  }
  return {
    saves: _state.metrics.saves,
    loads: _state.metrics.loads,
    restores: _state.metrics.restores,
    errors: _state.metrics.errors,
    totalSlots,
    regions: regionNames.length
  };
}
export {
  MODULE_ID,
  VERSION,
  clear,
  getMetrics,
  getRegionSlots,
  getSlotState,
  load,
  persist,
  removeSlotState,
  restore,
  saveMultiple,
  saveSlotState
};
