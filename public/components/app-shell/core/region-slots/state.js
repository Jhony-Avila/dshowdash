import { REGION_MAP } from "../dom-regions/index.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-slots.state";
const slots = /* @__PURE__ */ new Map();
const state = {
  slots: {},
  slotContents: {},
  listeners: [],
  subscribers: [],
  metrics: {
    slotsRegistered: 0,
    slotsUnregistered: 0,
    contentInjections: 0,
    contentClears: 0,
    errors: 0
  }
};
const regionNames = Object.keys(REGION_MAP);
for (let i = 0; i < regionNames.length; i++) {
  state.slots[regionNames[i]] = {};
}
function getSlots() {
  return state.slots;
}
function getRegionSlots(regionName) {
  return state.slots[regionName] || null;
}
function getSlot(regionName, slotId) {
  if (!state.slots[regionName]) return null;
  return state.slots[regionName][slotId] || null;
}
function setSlot(regionName, slotId, config) {
  if (!state.slots[regionName]) {
    state.slots[regionName] = {};
  }
  state.slots[regionName][slotId] = config;
}
function deleteSlot(regionName, slotId) {
  if (state.slots[regionName]) {
    delete state.slots[regionName][slotId];
  }
}
function hasSlot(regionName, slotId) {
  return !!(state.slots[regionName] && state.slots[regionName][slotId]);
}
function getSlotContents() {
  return state.slotContents;
}
function getSlotContent(slotId) {
  return state.slotContents[slotId] || null;
}
function setSlotContent(slotId, content) {
  state.slotContents[slotId] = content;
}
function deleteSlotContent(slotId) {
  delete state.slotContents[slotId];
}
function getListeners() {
  return state.listeners;
}
function addListener(listener) {
  state.listeners.push(listener);
}
function removeListener(listener) {
  const idx = state.listeners.indexOf(listener);
  if (idx >= 0) state.listeners.splice(idx, 1);
}
function notifySubscribers(event, data) {
  for (let i = 0; i < state.subscribers.length; i++) {
    try {
      state.subscribers[i](event, data);
    } catch (e) {
    }
  }
  for (let j = 0; j < state.listeners.length; j++) {
    try {
      state.listeners[j](event, data);
    } catch (e) {
    }
  }
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  state.subscribers.push(callback);
  return () => {
    const idx = state.subscribers.indexOf(callback);
    if (idx >= 0) state.subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return {
    slotsRegistered: state.metrics.slotsRegistered,
    slotsUnregistered: state.metrics.slotsUnregistered,
    contentInjections: state.metrics.contentInjections,
    contentClears: state.metrics.contentClears,
    errors: state.metrics.errors
  };
}
function incrementMetric(name) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name]++;
  }
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  addListener,
  state_default as default,
  deleteSlot,
  deleteSlotContent,
  getListeners,
  getMetrics,
  getRegionSlots,
  getSlot,
  getSlotContent,
  getSlotContents,
  getSlots,
  hasSlot,
  incrementMetric,
  notifySubscribers,
  removeListener,
  setSlot,
  setSlotContent,
  slots,
  subscribe
};
