// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences/state/store
// PURPOSE: Panel User Preferences - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   reset() — exported function
//   subscribe() — exported function
//   isDirty() — exported function
//   markClean() — exported function
//   isInitialized() — exported function
//   setInitialized() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences/state/store';

let _listeners: Array<(state: Record<string, unknown>) => void> = [];
let _store = {
  theme: 'system',
  density: 'comfortable',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  notifications: { email: true, push: true, sound: false },
  accessibility: { highContrast: false, reducedMotion: false, fontSize: 'medium' },
  dashboard: { layout: 'default', widgets: [] as unknown[], sidebarCollapsed: false },
  _initialized: false,
  _dirty: false
};

export function getState() { return Object.assign({}, _store); }
export function get(key: string) { return key ? (_store as Record<string, unknown>)[key] : getState(); }

export function set(key: string | Record<string, unknown>, value?: unknown) {
  if (typeof key === 'object') { Object.assign(_store, key); }
  else { (_store as Record<string, unknown>)[key] = value; }
  _store._dirty = true;
  _notify();
}

export function reset() {
  _store = { theme: 'system', density: 'comfortable', language: 'pt-BR', timezone: 'America/Sao_Paulo', notifications: { email: true, push: true, sound: false }, accessibility: { highContrast: false, reducedMotion: false, fontSize: 'medium' }, dashboard: { layout: 'default', widgets: [], sidebarCollapsed: false }, _initialized: false, _dirty: false };
  _notify();
}

export function subscribe(fn: (state: Record<string, unknown>) => void) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
function _notify() { _listeners.forEach(fn => { try { fn(getState()); } catch (e) {} }); }

export function isDirty() { return _store._dirty; }
export function markClean() { _store._dirty = false; }
export function isInitialized() { return _store._initialized; }
export function setInitialized(val: boolean) { _store._initialized = val; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, dirty: _store._dirty, initialized: _store._initialized }; }

export default { getState, get, set, reset, subscribe, isDirty, markClean, isInitialized, setInitialized };

// Alias export: consumers import { StateStore } from this module
export const StateStore = { getState, get, set, reset, subscribe, isDirty, markClean, isInitialized, setInitialized, info, healthCheck, VERSION, MODULE_ID };
