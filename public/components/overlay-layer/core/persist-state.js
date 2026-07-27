const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-persist-state";
const STORAGE_KEY = "dshowdash_overlay_state";
const MAX_PERSISTED = 10;
let _enabled = true;
const _metrics = { saves: 0, restores: 0, failures: 0 };
function _isStorageAvailable() {
  try {
    const test = "__storage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
function save(overlays) {
  if (!_enabled || !_isStorageAvailable()) {
    return { ok: false, reason: "storage-unavailable" };
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
  } catch (error) {
    _metrics.failures++;
    return { ok: false, error: error.message };
  }
}
function saveOne(overlay) {
  if (!overlay || !overlay.id) return { ok: false, reason: "invalid-overlay" };
  const current = load();
  const overlays = current.ok ? current.overlays : [];
  let index = -1;
  for (let i = 0; i < overlays.length; i++) {
    if (overlays[i].id === overlay.id) {
      index = i;
      break;
    }
  }
  if (index >= 0) {
    overlays[index] = overlay;
  } else {
    overlays.push(overlay);
  }
  return save(overlays);
}
function removeOne(overlayId) {
  const current = load();
  if (!current.ok) return current;
  const filtered = [];
  for (let i = 0; i < current.overlays.length; i++) {
    if (current.overlays[i].id !== overlayId) filtered.push(current.overlays[i]);
  }
  return save(filtered);
}
function load() {
  if (!_isStorageAvailable()) return { ok: false, reason: "storage-unavailable", overlays: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ok: true, overlays: [], empty: true };
    const state = JSON.parse(raw);
    if (!state.overlays || !Array.isArray(state.overlays)) return { ok: false, reason: "invalid-structure", overlays: [] };
    const maxAge = 60 * 60 * 1e3;
    const valid = [];
    for (let i = 0; i < state.overlays.length; i++) {
      const o = state.overlays[i];
      if (Date.now() - o.savedAt < maxAge) valid.push(o);
    }
    return { ok: true, overlays: valid, savedAt: state.savedAt, originalCount: state.overlays.length, validCount: valid.length };
  } catch (error) {
    _metrics.failures++;
    return { ok: false, error: error.message, overlays: [] };
  }
}
function restore(showCallback) {
  const loaded = load();
  if (!loaded.ok || loaded.overlays.length === 0) return Promise.resolve({ ok: true, restored: 0, reason: loaded.empty ? "no-saved-state" : loaded.reason });
  let restored = 0;
  const errors = [];
  const overlays = loaded.overlays;
  function restoreNext(index) {
    if (index >= overlays.length) {
      _metrics.restores += restored;
      clear();
      return Promise.resolve({ ok: true, restored, total: overlays.length, errors });
    }
    const overlay = overlays[index];
    if (!showCallback) return restoreNext(index + 1);
    return Promise.resolve().then(() => showCallback(overlay)).then(() => {
      restored++;
      return restoreNext(index + 1);
    }).catch((error) => {
      errors.push({ id: overlay.id, error: error.message });
      return restoreNext(index + 1);
    });
  }
  return restoreNext(0);
}
function clear() {
  if (!_isStorageAvailable()) return { ok: false, reason: "storage-unavailable" };
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function hasSavedState() {
  if (!_isStorageAvailable()) return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.overlays && state.overlays.length > 0;
  } catch (e) {
    return false;
  }
}
function setEnabled(enabled) {
  _enabled = enabled;
  return { ok: true, enabled: _enabled };
}
function isEnabled() {
  return _enabled;
}
function installBeforeUnloadHandler(getOverlaysCallback) {
  if (typeof window === "undefined") return { ok: false };
  const handler = () => {
    if (_enabled && getOverlaysCallback) {
      const overlays = getOverlaysCallback();
      if (overlays.length > 0) save(overlays);
    }
  };
  window.addEventListener("beforeunload", handler);
  return { ok: true, cleanup() {
    window.removeEventListener("beforeunload", handler);
  } };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const storageAvailable = _isStorageAvailable();
  const checks = { storageAvailable, enabled: _enabled, lowFailureRate: _metrics.saves === 0 || _metrics.failures / _metrics.saves < 0.1 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, hasSavedState: hasSavedState(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, storageAvailable: _isStorageAvailable(), hasSavedState: hasSavedState(), metrics: getMetrics(), timestamp: Date.now() };
}
var persist_state_default = { save, saveOne, removeOne, load, restore, clear, hasSavedState, setEnabled, isEnabled, installBeforeUnloadHandler, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  persist_state_default as default,
  getMetrics,
  hasSavedState,
  healthCheck,
  info,
  installBeforeUnloadHandler,
  isEnabled,
  load,
  removeOne,
  restore,
  save,
  saveOne,
  setEnabled
};
