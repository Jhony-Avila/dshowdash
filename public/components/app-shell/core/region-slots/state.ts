// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Region Slots — State Management
 * @version 1.1.0-FIX-EXPORTS
 * @module app-shell/core/region-slots/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../dom-regions/index.js (REGION_MAP)
 * 
 * @provides slots (Map), getSlots, getRegionSlots, getSlot, setSlot, deleteSlot, hasSlot
 * @provides getSlotContents, getSlotContent, setSlotContent, deleteSlotContent
 * @provides getListeners, addListener, removeListener
 * @provides getMetrics, incrementMetric, notifySubscribers
 * 
 * @description
 * Centralized state for region slots system.
 * v1.1.0: Added slots Map and notifySubscribers for content.js compatibility.
 * ============================================================================
 */
'use strict';

import { REGION_MAP } from '../dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-slots.state';

// Slots as Map (for content.js compatibility)
export const slots = new Map();

const state = {
  slots: {},
  slotContents: {},
  listeners: [] as DynObj,
  subscribers: [] as DynObj,
  metrics: {
    slotsRegistered: 0,
    slotsUnregistered: 0,
    contentInjections: 0,
    contentClears: 0,
    errors: 0
  }
};

// Initialize slot buckets for each region
const regionNames = Object.keys(REGION_MAP);
for (let i = 0; i < regionNames.length; i++) {
  (state.slots as DynObj)[regionNames[i]] = {};
}

// Slots accessors
export function getSlots() {
  return state.slots;
}

export function getRegionSlots(regionName: string) {
  return (state.slots as DynObj)[regionName] || null;
}

export function getSlot(regionName: string, slotId: string) {
  if (!(state.slots as DynObj)[regionName]) return null;
  return (state.slots as DynObj)[regionName][slotId] || null;
}

export function setSlot(regionName: string, slotId: string, config: DynObj) {
  if (!(state.slots as DynObj)[regionName]) {
    (state.slots as DynObj)[regionName] = {};
  }
  (state.slots as DynObj)[regionName][slotId] = config;
}

export function deleteSlot(regionName: string, slotId: string) {
  if ((state.slots as DynObj)[regionName]) {
    delete (state.slots as DynObj)[regionName][slotId];
  }
}

export function hasSlot(regionName: string, slotId: string) {
  return !!((state.slots as DynObj)[regionName] && (state.slots as DynObj)[regionName][slotId]);
}

// Slot contents accessors
export function getSlotContents() {
  return state.slotContents;
}

export function getSlotContent(slotId: string) {
  return (state.slotContents as DynObj)[slotId] || null;
}

export function setSlotContent(slotId: string, content: DynObj) {
  (state.slotContents as DynObj)[slotId] = content;
}

export function deleteSlotContent(slotId: string) {
  delete (state.slotContents as DynObj)[slotId];
}

// Listeners
export function getListeners() {
  return state.listeners;
}

export function addListener(listener: DynObj) {
  state.listeners.push(listener);
}

export function removeListener(listener: DynObj) {
  const idx = state.listeners.indexOf(listener);
  if (idx >= 0) state.listeners.splice(idx, 1);
}

// Subscribers (for content.js compatibility)
export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < state.subscribers.length; i++) {
    try {
      state.subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
  // Also notify listeners
  for (let j = 0; j < state.listeners.length; j++) {
    try {
      state.listeners[j](event, data);
    } catch (e) {
      // Ignore listener errors
    }
  }
}

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  state.subscribers.push(callback);
  return () => {
    const idx = state.subscribers.indexOf(callback);
    if (idx >= 0) state.subscribers.splice(idx, 1);
  };
}

// Metrics
export function getMetrics() {
  return {
    slotsRegistered: state.metrics.slotsRegistered,
    slotsUnregistered: state.metrics.slotsUnregistered,
    contentInjections: state.metrics.contentInjections,
    contentClears: state.metrics.contentClears,
    errors: state.metrics.errors
  };
}

export function incrementMetric(name: string) {
  if ((state.metrics as DynObj)[name] !== undefined) {
    (state.metrics as DynObj)[name]++;
  }
}

export default state;
