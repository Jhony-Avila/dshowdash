// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sync
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEYS, SYNC_DEBOUNCE_MS, MAX_HISTORY_SIZE from ./constants.js
//   metrics, pendingChanges, syncTimeoutId from ./state.js
//   saveRaw, loadRaw from ./storage.js
//   wrapWithVersion, unwrapVersioned, migrateData from ./versioning.js
//   validateSchema, getSchemaForKey from ./validation.js
//
// PROVIDES:
//   save() — exported function
//   load() — exported function
//   flushPending() — exported function
//   scheduleSync() — exported function
//   trackNavigation() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - Sync Logic
 * @module persistence-sync/sync
 */
'use strict';

import { STORAGE_KEYS, SYNC_DEBOUNCE_MS, MAX_HISTORY_SIZE } from './constants.js';
import { metrics, pendingChanges, syncTimeoutId } from './state.js';
import { saveRaw, loadRaw } from './storage.js';
import { wrapWithVersion, unwrapVersioned, migrateData } from './versioning.js';
import { validateSchema, getSchemaForKey } from './validation.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'main.domain.features.persistence-sync.sync';

export function save(key: string, data: Record<string, unknown>) {
  const schemaName = getSchemaForKey(key);
  if (schemaName) {
    const validation = validateSchema(data, schemaName);
    if (!validation.valid) {
      console.debug('[PersistenceSync] Validation errors:', validation.errors);
    }
  }
  
  const wrapped = wrapWithVersion(data);
  return saveRaw(key, wrapped);
}

export function load(key: string) {
  const raw = loadRaw(key);
  if (!raw) return null;
  
  const unwrapped = unwrapVersioned(raw);
  
  if (unwrapped.needsMigration) {
    unwrapped.data = migrateData(unwrapped.data, unwrapped.fromVersion, key);
    save(key, unwrapped.data);
  }
  
  return unwrapped.data;
}

export function flushPending() {
  if (pendingChanges.size === 0) return;
  
  pendingChanges.forEach((data, key) => {
    save(key, data);
  });
  metrics.syncs++;
  pendingChanges.clear();
}

export function scheduleSync() {
  // @ts-expect-error strict migration — TS2769
  clearTimeout(syncTimeoutId.value);
// @ts-expect-error TS migration - TS2322
  syncTimeoutId.value = setTimeout(() => {
    flushPending();
    syncTimeoutId.value = null;
  }, SYNC_DEBOUNCE_MS);
}

export function trackNavigation(path: string) {
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
