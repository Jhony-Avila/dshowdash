/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — layout-persistence/index.js
 * @version 1.1.0-P2-ENTERPRISE
 * @batch Batch Z (Contract #206 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   ./constants.js → { VERSION, MODULE_ID, STORAGE_KEY, STORAGE_VERSION, DEFAULT_PREFERENCES, getStorage, deepClone }
 *   ./core.js      → { load, save, get, getPreference, setPreference, setPreferences, reset, clear }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID
 *   Core: load, save, get, getPreference, setPreference, setPreferences, reset, clear, subscribe
 *   Sidebar: isSidebarCollapsed, setSidebarCollapsed, toggleSidebar, getSidebarWidth, setSidebarWidth
 *   Layout: getLayoutMode, setLayoutMode, isFullscreen
 *   Theme: getThemeMode, setThemeMode
 *   Observability: getMetrics, healthCheck, info
 *   default: { all exports }
 *
 * BROWSER APIs:
 *   localStorage/sessionStorage (via getStorage), Date.now()
 *
 * PATTERNS:
 *   State proxy pattern with _stateProxy object
 *   Subscriber notification system (listener array)
 *   Auto-init on module load (load() called at bottom)
 *   Convenience methods for sidebar/layout/theme preferences
 * ═══════════════════════════════════════════════════════════════ */
/**
 * Layout Persistence — Orquestrador
 * @module app-shell/state/layout-persistence
 * @version 1.1.0-P2-ENTERPRISE
 * @description Sprint 1: Melhoria #3 - Layout Persistence (modularizado v1.1.0)
 */
'use strict';

import { VERSION, MODULE_ID, STORAGE_KEY, STORAGE_VERSION, DEFAULT_PREFERENCES, getStorage, deepClone } from './constants.js';
import {
  load as _load,
  save as _save,
  get as _get,
  getPreference as _getPreference,
  setPreference as _setPreference,
  setPreferences as _setPreferences,
  reset as _reset,
  clear as _clear
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── State ───────────────────────────────────────────────────────────

let _preferences: DynObj = null;
let _initialized = false;
const _listeners: DynObj[] = [];

const _metrics = {
  loads: 0,
  saves: 0,
  resets: 0,
  errors: 0,
  lastSaveAt: null as DynObj,
  lastLoadAt: null as DynObj
};

function _notifyListeners(event: string, data: DynObj) {
  for (let i = 0; i < _listeners.length; i++) {
    try { _listeners[i]({ type: event, data, timestamp: Date.now() }); } catch (e) { /* silent */ }
  }
}

const _stateProxy = {
  get preferences() { return _preferences; },
  set preferences(v) { _preferences = v; },
  get initialized() { return _initialized; },
  set initialized(v) { _initialized = v; },
  get metrics() { return _metrics; },
  notify: _notifyListeners
};

// ── Public API — Core ───────────────────────────────────────────────

function load() { return _load(_stateProxy); }
function save() { return _save(_stateProxy); }
function get() { return _get(_stateProxy); }
function getPreference(path: DynObj) { return _getPreference(path, _stateProxy); }
function setPreference(path: DynObj, value: DynObj, options?: DynObj) { return _setPreference(path, value, options, _stateProxy); }
function setPreferences(preferences: DynObj, options?: DynObj) { return _setPreferences(preferences, options, _stateProxy); }
function reset(options?: DynObj) { return _reset(options, _stateProxy); }
function clear() { return _clear(_stateProxy); }

// ── Subscribe ───────────────────────────────────────────────────────

function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

// ── Convenience — Sidebar ───────────────────────────────────────────

function isSidebarCollapsed() { return getPreference('sidebar.collapsed') === true; }
function setSidebarCollapsed(collapsed: boolean) { return setPreference('sidebar.collapsed', !!collapsed); }
function toggleSidebar() { return setSidebarCollapsed(!isSidebarCollapsed()); }
function getSidebarWidth() { return getPreference('sidebar.width') || 280; }
function setSidebarWidth(width: number) { return setPreference('sidebar.width', Math.max(200, Math.min(500, width))); }

// ── Convenience — Layout ────────────────────────────────────────────

function getLayoutMode() { return getPreference('layout.mode') || 'normal'; }

function setLayoutMode(mode: DynObj) {
  const validModes = ['normal', 'fullscreen', 'compact'];
  if (validModes.indexOf(mode) === -1) mode = 'normal';
  return setPreference('layout.mode', mode);
}

function isFullscreen() { return getLayoutMode() === 'fullscreen'; }

// ── Convenience — Theme ─────────────────────────────────────────────

function getThemeMode() { return getPreference('theme.mode') || 'system'; }

function setThemeMode(mode: DynObj) {
  const validModes = ['light', 'dark', 'system'];
  if (validModes.indexOf(mode) === -1) mode = 'system';
  return setPreference('theme.mode', mode);
}

// ── Health & Info ───────────────────────────────────────────────────

function getMetrics() { return Object.assign({}, _metrics); }

function healthCheck() {
  const storage = getStorage();
  const checks = {
    initialized: _initialized,
    storageAvailable: !!storage,
    preferencesLoaded: !!_preferences,
    noErrors: _metrics.errors === 0
  };

  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if ((checks as DynObj)[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;

  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    storageKey: STORAGE_KEY,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    storageKey: STORAGE_KEY,
    storageVersion: STORAGE_VERSION,
    defaultPreferences: DEFAULT_PREFERENCES,
    currentPreferences: get(),
    listenerCount: _listeners.length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

// ── Auto-init ───────────────────────────────────────────────────────

load();

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID };
export { load, save, get, getPreference, setPreference, setPreferences, reset, clear, subscribe };
export { isSidebarCollapsed, setSidebarCollapsed, toggleSidebar, getSidebarWidth, setSidebarWidth };
export { getLayoutMode, setLayoutMode, isFullscreen };
export { getThemeMode, setThemeMode };
export { getMetrics, healthCheck, info };


export default {
  VERSION,
  MODULE_ID,
  load,
  save,
  get,
  getPreference,
  setPreference,
  setPreferences,
  reset,
  clear,
  subscribe,
  isSidebarCollapsed,
  setSidebarCollapsed,
  toggleSidebar,
  getSidebarWidth,
  setSidebarWidth,
  getLayoutMode,
  setLayoutMode,
  isFullscreen,
  getThemeMode,
  setThemeMode,
  getMetrics,
  healthCheck,
  info
};
