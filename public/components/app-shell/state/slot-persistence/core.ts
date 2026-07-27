/**
 * @file Slot Persistence — Core Operations
 * @version 1.1.0-P2-ENTERPRISE
 * @module app-shell/state/slot-persistence/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (STORAGE_KEY, MAX_STORED_SLOTS, MAX_CONTENT_SIZE)
 * @requires ./state.js (_state, incrementMetric)
 * 
 * @provides saveSlotState, getSlotState, removeSlotState, getRegionSlots
 * @provides saveMultiple, persist, load, restore, clear, getMetrics
 * 
 * @browserAPI localStorage
 * 
 * @description
 * Core CRUD operations for slot persistence. Saves slot visibility,
 * position, order, and optionally content to localStorage.
 * 
 * @example
 * import { saveSlotState, load, restore } from './core.js';
 * saveSlotState('main', 'widget-1', { visible: true, position: 0 });
 * load();
 * restore(callback);
 * ============================================================================
 */
'use strict';

import { STORAGE_KEY, MAX_STORED_SLOTS, MAX_CONTENT_SIZE } from './constants.js';
import { _state, incrementMetric } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.state.slot-persistence.core';

export function saveSlotState(regionName: string, slotId: string, state?: DynObj, options?: DynObj) {
  options = options || {};
  
  if (!(_state.slots as DynObj)[regionName]) {
    (_state.slots as DynObj)[regionName] = {};
  }
  
  const slotState: Record<string, any> = {
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
  
  (_state.slots as DynObj)[regionName][slotId] = slotState;
  incrementMetric('saves');
  
  _trimSlots();
  
  return true;
}

export function getSlotState(regionName: string, slotId: string) {
  if (!(_state.slots as DynObj)[regionName]) return null;
  return (_state.slots as DynObj)[regionName][slotId] || null;
}

export function removeSlotState(regionName: string, slotId: string) {
  if (!(_state.slots as DynObj)[regionName]) return false;
  if (!(_state.slots as DynObj)[regionName][slotId]) return false;
  
  delete (_state.slots as DynObj)[regionName][slotId];
  return true;
}

export function getRegionSlots(regionName: string, _proxy?: DynObj) {
  if (!(_state.slots as DynObj)[regionName]) return {};
  return Object.assign({}, (_state.slots as DynObj)[regionName]);
}

export function saveMultiple(slots: DynObj, _proxy?: DynObj) {
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
    totalSlots += Object.keys((_state.slots as DynObj)[regionNames[i]]).length;
  }
  
  if (totalSlots > MAX_STORED_SLOTS) {
    const allSlots = [];
    
    for (let i = 0; i < regionNames.length; i++) {
      const region = regionNames[i];
      const slotIds = Object.keys((_state.slots as DynObj)[region]);
      
      for (let j = 0; j < slotIds.length; j++) {
        allSlots.push({
          region,
          slotId: slotIds[j],
          updatedAt: (_state.slots as DynObj)[region][slotIds[j]].updatedAt || 0
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

export function persist(_proxy?: DynObj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      slots: _state.slots,
      timestamp: Date.now()
    }));
    return true;
  } catch (e) {
    incrementMetric('errors');
    return false;
  }
}

export function load(_proxy?: DynObj) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    _state.slots = data.slots || {};
    incrementMetric('loads');
    return true;
  } catch (e) {
    incrementMetric('errors');
    return false;
  }
}

export function restore(callback: DynObj, _proxy?: DynObj) {
  if (typeof callback !== 'function') return false;
  
  const regionNames = Object.keys(_state.slots);
  
  for (let i = 0; i < regionNames.length; i++) {
    const region = regionNames[i];
    const slotIds = Object.keys((_state.slots as DynObj)[region]);
    
    for (let j = 0; j < slotIds.length; j++) {
      const slotId = slotIds[j];
      const slotState = (_state.slots as DynObj)[region][slotId];
      
      callback(region, slotId, slotState);
    }
  }
  
  incrementMetric('restores');
  return true;
}

export function clear(_proxy?: DynObj) {
  _state.slots = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

export function getMetrics() {
  let totalSlots = 0;
  const regionNames = Object.keys(_state.slots);
  
  for (let i = 0; i < regionNames.length; i++) {
    totalSlots += Object.keys((_state.slots as DynObj)[regionNames[i]]).length;
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
