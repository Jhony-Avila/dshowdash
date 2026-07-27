// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS from ./constants.js
//   applyPreset, applyCustomPreset, disablePreset, loadFromStorage from ./core.js
//
// PROVIDES: apply(), applyCustom(), disable(), revert(), getCurrent(),
//   getCurrentConfig(), getPrevious(), isEnabled(), getPresetConfig(),
//   listPresets(), getHistory(), configure(), getConfig(), subscribe(),
//   minimal/standard/verbose/performance/network/memory/events/regions(),
//   getMetrics(), healthCheck(), info(), VERSION, MODULE_ID, PRESETS,
//   injectPorts(), getPortsSnapshot()
//
// BROWSER APIs (legítimo — storage persistence):
//   localStorage (via loadFromStorage, auto-apply on load)
// ═══════════════════════════════════════════════════════════════
/**
 * Debug Presets — Orquestrador
 * @module app-shell/devtools/debug-presets
 * @version 1.2.0-P2-ENTERPRISE
 * @description Sprint 8 Fase 2: Melhoria #23 - Presets de Debugging (modularizado v1.2.0)
 */
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS } from './constants.js';
import {

  applyPreset,
  applyCustomPreset,
  disablePreset,
  loadFromStorage
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── Ports ───────────────────────────────────────────────────────────

const _Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: DynObj) { return _Ports.inject(p); }
export function getPortsSnapshot() { return _Ports.snapshot(); }

// ── State ───────────────────────────────────────────────────────────

let _currentPreset: DynObj = null;
let _customConfig: DynObj = null;
let _previousPreset: DynObj = null;
const _subscribers: DynObj[] = [];
const _history: DynObj[] = [];
let _enabled = false;

const _config = {
  maxHistory: 20,
  persistToStorage: true,
  storageKey: 'app-shell-debug-preset',
  autoApplyOnLoad: true
};

const _metrics = {
  presetsApplied: 0,
  customConfigsCreated: 0,
  presetChanges: 0
};

function _notifySubscribers(event: string) {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](event); } catch (e) { /* silent */ }
  }
}

const _stateProxy = {
  get currentPreset() { return _currentPreset; },
  set currentPreset(v) { _currentPreset = v; },
  get customConfig() { return _customConfig; },
  set customConfig(v) { _customConfig = v; },
  get previousPreset() { return _previousPreset; },
  set previousPreset(v) { _previousPreset = v; },
  get enabled() { return _enabled; },
  set enabled(v) { _enabled = v; },
  get config() { return _config; },
  get metrics() { return _metrics; },
  get history() { return _history; },
  getPort: _getPort,
  notify: _notifySubscribers
};

// ── Public API ──────────────────────────────────────────────────────

function apply(presetName: string) { return applyPreset(presetName, _stateProxy); }
function applyCustom(customConfig: DynObj) { return applyCustomPreset(customConfig, _stateProxy); }
function disable() { disablePreset(_stateProxy); }

function revert() {
  if (!_previousPreset) return false;
  return apply(_previousPreset);
}

function getCurrent() { return _currentPreset; }

function getCurrentConfig() {
  if (_currentPreset === PRESETS.CUSTOM) return _customConfig;
  return _currentPreset ? (PRESET_CONFIGS as DynObj)[_currentPreset] : null;
}

function getPrevious() { return _previousPreset; }
function isEnabled() { return _enabled; }

function getPresetConfig(presetName: string) {
  return (PRESET_CONFIGS as DynObj)[presetName] ? Object.assign({}, (PRESET_CONFIGS as DynObj)[presetName]) : null;
}

function listPresets() {
  return Object.keys(PRESET_CONFIGS).map(key => {
    const presetCfg = (PRESET_CONFIGS as DynObj)[key];
    return { id: key, name: presetCfg.name, description: presetCfg.description, logLevel: presetCfg.logLevel, isCurrent: key === _currentPreset };
  });
}

function getHistory() { return _history.slice(); }

function configure(options: DynObj) {
  if (options.maxHistory !== undefined) _config.maxHistory = options.maxHistory;
  if (options.persistToStorage !== undefined) _config.persistToStorage = !!options.persistToStorage;
  if (options.storageKey !== undefined) _config.storageKey = options.storageKey;
  if (options.autoApplyOnLoad !== undefined) _config.autoApplyOnLoad = !!options.autoApplyOnLoad;
}

function getConfig() { return Object.assign({}, _config); }

function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

// ── Convenience ─────────────────────────────────────────────────────

function minimal() { return apply(PRESETS.MINIMAL); }
function standard() { return apply(PRESETS.STANDARD); }
function verbose() { return apply(PRESETS.VERBOSE); }
function performance() { return apply(PRESETS.PERFORMANCE); }
function network() { return apply(PRESETS.NETWORK); }
function memory() { return apply(PRESETS.MEMORY); }
function events() { return apply(PRESETS.EVENTS); }
function regions() { return apply(PRESETS.REGIONS); }

// ── Health & Info ───────────────────────────────────────────────────

function getMetrics() { return Object.assign({}, _metrics); }

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
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
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

// ── Init ────────────────────────────────────────────────────────────

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

if (typeof window !== 'undefined') {
  _init();
}

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID, PRESETS };
export { apply, applyCustom, disable, revert };
export { getCurrent, getCurrentConfig, getPrevious, isEnabled, getPresetConfig, listPresets, getHistory };
export { configure, getConfig, subscribe };
export { minimal, standard, verbose, performance, network, memory, events, regions };
export { getMetrics, healthCheck, info };

export default {
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
