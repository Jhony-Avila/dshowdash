// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID, STORAGE_KEY, MAX_STORED_SLOTS, getStorage from ./constants.js
//   saveSlotState (as _saveSlotState), getSlotState (as _getSlotState),
//     removeSlotState (as _removeSlotState), getRegionSlots (as _getRegionSlots),
//     saveMultiple (as _saveMultiple), persist (as _persist), load (as _load),
//     restore (as _restore), clear (as _clear) from ./core.js
//
// PROVIDES: saveSlotState/getSlotState/removeSlotState/getRegionSlots/
//   saveMultiple (slot ops), persist/load/restore/clear (storage ops),
//   configure/getConfig/enable/disable/isEnabled (config), subscribe,
//   getMetrics/healthCheck/info (diagnostics), VERSION, MODULE_ID
//
// RECEIVES (via configure):
//   options — { enabled, autoSave, autoSaveDelay, persistContent, storageType }
//
// WINDOW ACCESS (legítimo — auto-init):
//   window (typeof check for auto-load on init)
//
// BROWSER APIs (legítimo — storage + timers):
//   localStorage/sessionStorage (via getStorage), setTimeout/clearTimeout
// ═══════════════════════════════════════════════════════════════
/**
 * Slot Persistence — Orquestrador
 * @module app-shell/state/slot-persistence
 * @version 1.1.0-P2-ENTERPRISE
 * @description Sprint 4 Fase 2: Melhoria #8 - Persistência de Slots (modularizado v1.1.0)
 */
'use strict';

import { VERSION, MODULE_ID, STORAGE_KEY, MAX_STORED_SLOTS, getStorage } from './constants.js';
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
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── State ───────────────────────────────────────────────────────────

let _slots = {};
let _metadata = {};
let _lastSaved: DynObj = null;
let _saveTimeout: DynObj = null;
const _subscribers: DynObj[] = [];

const _config = {
  enabled: true,
  autoSave: true,
  autoSaveDelay: 1000,
  persistContent: false,
  storageType: 'localStorage'
};

const _metrics = {
  saves: 0,
  loads: 0,
  restores: 0,
  errors: 0
};

function _notifySubscribers(event: DynObj) {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](event); } catch (e) { /* silent */ }
  }
}

function _scheduleSave() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => { persist(); }, _config.autoSaveDelay);
}

const _stateProxy = {
  get slots() { return _slots; },
  set slots(v) { _slots = v; },
  get metadata() { return _metadata; },
  set metadata(v) { _metadata = v; },
  get lastSaved() { return _lastSaved; },
  set lastSaved(v) { _lastSaved = v; },
  get config() { return _config; },
  get metrics() { return _metrics; },
  notify: _notifySubscribers,
  scheduleSave: _scheduleSave
};

// ── Public API ──────────────────────────────────────────────────────

function saveSlotState(slotId: string, state: DynObj) { return _saveSlotState(slotId, state, _stateProxy); }
function getSlotState(slotId: string) { return _getSlotState(slotId, _stateProxy as DynObj); }
function removeSlotState(slotId: string) { return _removeSlotState(slotId, _stateProxy as DynObj); }
function getRegionSlots(regionName: string) { return _getRegionSlots(regionName, _stateProxy); }
function saveMultiple(slots: DynObj) { return _saveMultiple(slots, _stateProxy); }

function persist() { return _persist(_stateProxy); }
function load() { return _load(_stateProxy); }
function restore(restoreCallback: DynObj) { return _restore(restoreCallback, _stateProxy); }
function clear() { return _clear(_stateProxy); }

// ── Config ──────────────────────────────────────────────────────────

function configure(options: DynObj) {
  if (options.enabled !== undefined) _config.enabled = !!options.enabled;
  if (options.autoSave !== undefined) _config.autoSave = !!options.autoSave;
  if (options.autoSaveDelay !== undefined) _config.autoSaveDelay = Math.max(100, options.autoSaveDelay);
  if (options.persistContent !== undefined) _config.persistContent = !!options.persistContent;
  if (options.storageType !== undefined) {
    if (options.storageType === 'sessionStorage' || options.storageType === 'localStorage') {
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

function enable() { _config.enabled = true; load(); }
function disable() { _config.enabled = false; }
function isEnabled() { return _config.enabled; }

// ── Subscribe ───────────────────────────────────────────────────────

function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

// ── Health & Info ───────────────────────────────────────────────────

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
    lowErrorRate: _metrics.saves === 0 || (_metrics.errors / _metrics.saves) < 0.1
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
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

// ── Auto-init ───────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  load();
}

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID };
export { saveSlotState, getSlotState, removeSlotState, getRegionSlots, saveMultiple };
export { persist, load, restore, clear };
export { configure, getConfig, enable, disable, isEnabled, subscribe };
export { getMetrics, healthCheck, info };

export default {
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
