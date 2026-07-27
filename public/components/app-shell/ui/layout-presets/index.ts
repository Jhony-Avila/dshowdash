/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — layout-presets/index.js
 * @version 1.1.0-P2-ENTERPRISE
 * @batch Batch Z (Contract #215 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   ./constants.js → { VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS }
 *   ./core.js      → { getPresetConfig, applyPreset, createPreset, deletePreset, clonePreset }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID, PRESETS
 *   getCurrentPreset, setPreset, getPresetConfig, getAvailablePresets
 *   createPreset, deletePreset, clonePreset
 *   revertToPrevious, setTransitionDuration
 *   subscribe, getMetrics, healthCheck, info
 *   default: { all exports }
 *
 * BROWSER APIs:
 *   Date.now(), Map
 *
 * PATTERNS:
 *   State proxy pattern (_stateProxy) with subscriber notifications
 *   Preset management (current, previous, custom presets via Map)
 *   Sprint 4 Fase 2: Melhoria #6 — Layouts Predefinidos
 *   Transition duration control, metrics tracking
 * ═══════════════════════════════════════════════════════════════ */
/**
 * Layout Presets — Orquestrador
 * @module app-shell/ui/layout-presets
 * @version 1.1.0-P2-ENTERPRISE
 * @description Sprint 4 Fase 2: Melhoria #6 - Layouts Predefinidos (modularizado v1.1.0)
 */
'use strict';

import { VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS } from './constants.js';
import {
  getPresetConfig,
  applyPreset,
  createPreset as _createPreset,
  deletePreset as _deletePreset,
  clonePreset as _clonePreset
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── State ───────────────────────────────────────────────────────────

let _currentPreset = PRESETS.DEFAULT;
let _previousPreset: DynObj = null;
const _customPresets = new Map();
const _subscribers: DynObj[] = [];
let _transitionDuration = 300;

const _metrics = {
  presetChanges: 0,
  customPresetsCreated: 0
};

function _notifySubscribers(event: string) {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](event); } catch (e) { /* silent */ }
  }
}

const _stateProxy = {
  get currentPreset() { return _currentPreset; },
  set currentPreset(v) { _currentPreset = v; },
  get previousPreset() { return _previousPreset; },
  set previousPreset(v) { _previousPreset = v; },
  get customPresets() { return _customPresets; },
  get transitionDuration() { return _transitionDuration; },
  get metrics() { return _metrics; },
  notify: _notifySubscribers
};

// ── Public API ──────────────────────────────────────────────────────

function apply(presetName: string, options?: DynObj) { return applyPreset(presetName, options, _stateProxy); }
function getCurrent() { return _currentPreset; }
function getPrevious() { return _previousPreset; }

function revert() {
  if (_previousPreset) return apply(_previousPreset);
  return { ok: false, error: 'No previous preset' };
}

function getConfig(presetName: string) {
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
      displayName: (PRESET_CONFIGS as DynObj)[keys[i]].name,
      description: (PRESET_CONFIGS as DynObj)[keys[i]].description,
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

function createPreset(name: string, config: DynObj) { return _createPreset(name, config, _stateProxy); }
function deletePreset(name: string) { return _deletePreset(name, _stateProxy, apply); }
function clonePreset(sourceName: string, newName: string, overrides: DynObj) { return _clonePreset(sourceName, newName, overrides, _stateProxy); }

function setTransitionDuration(ms: number) { _transitionDuration = Math.max(0, Math.min(1000, ms)); }
function getTransitionDuration() { return _transitionDuration; }

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
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
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

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID, PRESETS };
export { apply, getCurrent, getPrevious, revert, getConfig, listPresets };
export { createPreset, deletePreset, clonePreset };
export { setTransitionDuration, getTransitionDuration, subscribe };
export { getMetrics, healthCheck, info };


export default {
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
