import { STATE_VERSION, STORAGE_KEYS } from "./constants.js";
import { enabled, pendingChanges, metrics } from "./state.js";
import { getStorage, loadRaw } from "./storage.js";
import { validateSchema, getSchemaForKey } from "./validation.js";
import { save as coreSave, load as coreLoad, flushPending } from "./sync.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "main.domain.features.persistence-sync.api";
function forceSync() {
  flushPending();
  return { ok: true, synced: true };
}
function save(key, data) {
  if (!enabled.value) return { ok: false, error: "Not initialized" };
  const schemaName = getSchemaForKey(key);
  if (schemaName) {
    const validation = validateSchema(data, schemaName);
    if (!validation.valid) {
      return { ok: false, error: "Validation failed", errors: validation.errors };
    }
  }
  return { ok: coreSave(key, data) };
}
function load(key) {
  if (!enabled.value) return { ok: false, error: "Not initialized", data: null };
  return { ok: true, data: coreLoad(key) };
}
function remove(key) {
  if (!enabled.value) return { ok: false, error: "Not initialized" };
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch (e) {
      metrics.errors++;
    }
  }
  return { ok: false, error: "Storage unavailable" };
}
function validate(key, data) {
  const schemaName = getSchemaForKey(key);
  if (!schemaName) return { ok: true, valid: true };
  return validateSchema(data, schemaName);
}
function getStateVersion() {
  return STATE_VERSION;
}
function getStorageMeta(key) {
  const raw = loadRaw(key);
  if (!raw) return null;
  return {
    version: raw._version || 0,
    savedAt: raw._savedAt ? new Date(raw._savedAt).toISOString() : null,
    moduleVersion: raw._moduleVersion || "unknown"
  };
}
function getNavigationHistory() {
  const data = coreLoad(STORAGE_KEYS.NAVIGATION_STATE);
  return data && data.history || [];
}
function getLastRoute() {
  const data = coreLoad(STORAGE_KEYS.NAVIGATION_STATE);
  return data && data.current || null;
}
function hasPendingChanges() {
  return pendingChanges.size > 0;
}
function clearAll() {
  const storage = getStorage();
  if (!storage) return { ok: false, error: "Storage unavailable" };
  const keys = Object.values(STORAGE_KEYS);
  for (let i = 0; i < keys.length; i++) {
    try {
      storage.removeItem(keys[i]);
    } catch (e) {
    }
  }
  return { ok: true, cleared: keys.length };
}
export {
  MODULE_ID,
  VERSION,
  clearAll,
  forceSync,
  getLastRoute,
  getNavigationHistory,
  getStateVersion,
  getStorageMeta,
  hasPendingChanges,
  load,
  remove,
  save,
  validate
};
