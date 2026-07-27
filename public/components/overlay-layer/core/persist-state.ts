// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.persist-state
// PURPOSE: Overlay Layer Persist State - Session storage for refresh recovery
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract SAVE - save() saves overlays to storage
// @contract SAVE_ONE - saveOne() saves single overlay
// @contract REMOVE_ONE - removeOne() removes single overlay
// @contract LOAD - load() loads overlays from storage
// @contract RESTORE - restore() restores overlays via callback
// @contract CLEAR - clear() clears storage
// @contract HAS_SAVED_STATE - hasSavedState() checks for saved state
// @contract SET_ENABLED - setEnabled() enables/disables persistence
// @contract IS_ENABLED - isEnabled() checks if enabled
// @contract INSTALL_HANDLER - installBeforeUnloadHandler() installs unload handler
// @contract GET_METRICS - getMetrics() returns persistence metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   save() — exported function
//   saveOne() — exported function
//   removeOne() — exported function
//   load() — exported function
//   restore() — exported function
//   clear() — exported function
//   hasSavedState() — exported function
//   setEnabled() — exported function
//   isEnabled() — exported function
//   installBeforeUnloadHandler() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: sessionStorage, window.addEventListener
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-persist-state';

const STORAGE_KEY = 'dshowdash_overlay_state';
const MAX_PERSISTED = 10;

let _enabled = true;
const _metrics = { saves: 0, restores: 0, failures: 0 };

function _isStorageAvailable() {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

export function save(overlays: DynObj) {
  if (!_enabled || !_isStorageAvailable()) {
    return { ok: false, reason: 'storage-unavailable' };
  }
  try {
    const persistable = [];
    for (let i = 0; i < overlays.length && persistable.length < MAX_PERSISTED; i++) {
      const o = overlays[i];
      if (o.persist !== false) {
        persistable.push({ id: o.id, type: o.type, priority: o.priority, content: o.content, config: o.config, savedAt: Date.now() });
      }
    }
    const state = { version: VERSION, savedAt: Date.now(), overlays: persistable };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    _metrics.saves++;
    return { ok: true, saved: persistable.length };
  } catch (error: any) {
    _metrics.failures++;
    return { ok: false, error: error.message };
  }
}

export function saveOne(overlay: DynObj) {
  if (!overlay || !overlay.id) return { ok: false, reason: 'invalid-overlay' };
  const current = load();
  const overlays = current.ok ? current.overlays : [];
  let index = -1;
  for (let i = 0; i < overlays.length; i++) { if (overlays[i].id === overlay.id) { index = i; break; } }
  if (index >= 0) { overlays[index] = overlay; } else { overlays.push(overlay); }
  return save(overlays);
}

export function removeOne(overlayId: string) {
  const current = load();
  if (!current.ok) return current;
  const filtered = [];
  for (let i = 0; i < current.overlays.length; i++) { if (current.overlays[i].id !== overlayId) filtered.push(current.overlays[i]); }
  return save(filtered);
}

export function load() {
  if (!_isStorageAvailable()) return { ok: false, reason: 'storage-unavailable', overlays: [] as DynObj };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ok: true, overlays: [] as DynObj, empty: true };
    const state = JSON.parse(raw);
    if (!state.overlays || !Array.isArray(state.overlays)) return { ok: false, reason: 'invalid-structure', overlays: [] };
    const maxAge = 60 * 60 * 1000;
    const valid = [];
    for (let i = 0; i < state.overlays.length; i++) { const o = state.overlays[i]; if ((Date.now() - o.savedAt) < maxAge) valid.push(o); }
    return { ok: true, overlays: valid, savedAt: state.savedAt, originalCount: state.overlays.length, validCount: valid.length };
  } catch (error: any) {
    _metrics.failures++;
    return { ok: false, error: error.message, overlays: [] as DynObj };
  }
}

export function restore(showCallback: DynObj) {
  const loaded = load();
  if (!loaded.ok || loaded.overlays.length === 0) return Promise.resolve({ ok: true, restored: 0, reason: loaded.empty ? 'no-saved-state' : loaded.reason });
  let restored = 0;
  const errors: DynObj[] = [];
  const overlays = loaded.overlays;
  function restoreNext(index: number): DynObj  {
    if (index >= overlays.length) { _metrics.restores += restored; clear(); return Promise.resolve({ ok: true, restored, total: overlays.length, errors }); }
    const overlay = overlays[index];
    if (!showCallback) return restoreNext(index + 1);
    return Promise.resolve().then((): DynObj  => showCallback(overlay)).then(() => { restored++; return restoreNext(index + 1); }).catch(error => { errors.push({ id: overlay.id, error: error.message }); return restoreNext(index + 1); });
  }
  return restoreNext(0);
}

export function clear() {
  if (!_isStorageAvailable()) return { ok: false, reason: 'storage-unavailable' };
  try { sessionStorage.removeItem(STORAGE_KEY); return { ok: true }; } catch (error: any) { return { ok: false, error: error.message }; }
}

export function hasSavedState() {
  if (!_isStorageAvailable()) return false;
  try { const raw = sessionStorage.getItem(STORAGE_KEY); if (!raw) return false; const state = JSON.parse(raw); return state.overlays && state.overlays.length > 0; } catch (e) { return false; }
}

export function setEnabled(enabled: boolean) { _enabled = enabled; return { ok: true, enabled: _enabled }; }
export function isEnabled() { return _enabled; }

export function installBeforeUnloadHandler(getOverlaysCallback: DynObj) {
  if (typeof window === 'undefined') return { ok: false };
  const handler = () => { if (_enabled && getOverlaysCallback) { const overlays = getOverlaysCallback(); if (overlays.length > 0) save(overlays); } };
  window.addEventListener('beforeunload', handler);
  return { ok: true, cleanup() { window.removeEventListener('beforeunload', handler); } };
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function healthCheck() {
  const storageAvailable = _isStorageAvailable();
  const checks = { storageAvailable, enabled: _enabled, lowFailureRate: _metrics.saves === 0 || (_metrics.failures / _metrics.saves) < 0.1 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, hasSavedState: hasSavedState(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, storageAvailable: _isStorageAvailable(), hasSavedState: hasSavedState(), metrics: getMetrics(), timestamp: Date.now() }; }

export default { save, saveOne, removeOne, load, restore, clear, hasSavedState, setEnabled, isEnabled, installBeforeUnloadHandler, getMetrics, healthCheck, info, VERSION, MODULE_ID };
