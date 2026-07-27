import { STORAGE_KEYS, SYNC_DEBOUNCE_MS, MAX_HISTORY_SIZE } from "./constants.js";
import { metrics, pendingChanges, syncTimeoutId } from "./state.js";
import { saveRaw, loadRaw } from "./storage.js";
import { wrapWithVersion, unwrapVersioned, migrateData } from "./versioning.js";
import { validateSchema, getSchemaForKey } from "./validation.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "main.domain.features.persistence-sync.sync";
function save(key, data) {
  const schemaName = getSchemaForKey(key);
  if (schemaName) {
    const validation = validateSchema(data, schemaName);
    if (!validation.valid) {
      console.debug("[PersistenceSync] Validation errors:", validation.errors);
    }
  }
  const wrapped = wrapWithVersion(data);
  return saveRaw(key, wrapped);
}
function load(key) {
  const raw = loadRaw(key);
  if (!raw) return null;
  const unwrapped = unwrapVersioned(raw);
  if (unwrapped.needsMigration) {
    unwrapped.data = migrateData(unwrapped.data, unwrapped.fromVersion, key);
    save(key, unwrapped.data);
  }
  return unwrapped.data;
}
function flushPending() {
  if (pendingChanges.size === 0) return;
  pendingChanges.forEach((data, key) => {
    save(key, data);
  });
  metrics.syncs++;
  pendingChanges.clear();
}
function scheduleSync() {
  clearTimeout(syncTimeoutId.value);
  syncTimeoutId.value = setTimeout(() => {
    flushPending();
    syncTimeoutId.value = null;
  }, SYNC_DEBOUNCE_MS);
}
function trackNavigation(path) {
  const navState = load(STORAGE_KEYS.NAVIGATION_STATE) || { history: [], current: null };
  navState.current = path;
  navState.history.push({
    path,
    timestamp: Date.now()
  });
  if (navState.history.length > MAX_HISTORY_SIZE) {
    navState.history.shift();
  }
  pendingChanges.set(STORAGE_KEYS.NAVIGATION_STATE, navState);
  metrics.navigationsTracked++;
  scheduleSync();
}
export {
  MODULE_ID,
  VERSION,
  flushPending,
  load,
  save,
  scheduleSync,
  trackNavigation
};
