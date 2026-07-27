// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATE_VERSION, STORAGE_KEYS from ./constants.js
//   enabled, pendingChanges, metrics from ./state.js
//   getStorage, loadRaw from ./storage.js
//   validateSchema, getSchemaForKey from ./validation.js
//   save as coreSave, load as coreLoad, flushPending from ./sync.js
//
// PROVIDES:
//   forceSync() — exported function
//   save() — exported function
//   load() — exported function
//   remove() — exported function
//   validate() — exported function
//   getStateVersion() — exported function
//   getStorageMeta() — exported function
//   getNavigationHistory() — exported function
//   getLastRoute() — exported function
//   hasPendingChanges() — exported function
//   clearAll() — exported function
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
 * Persistence Sync - Public API
 * @module persistence-sync/api
 */
'use strict';

import { STATE_VERSION, STORAGE_KEYS } from './constants.js';
import { enabled, pendingChanges, metrics } from './state.js';
import { getStorage, loadRaw } from './storage.js';
import { validateSchema, getSchemaForKey } from './validation.js';
import { save as coreSave, load as coreLoad, flushPending } from './sync.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'main.domain.features.persistence-sync.api';

export function forceSync() {
  flushPending();
  return { ok: true, synced: true };
}

export function save(key: string, data: Record<string, unknown>) {
  if (!enabled.value) return { ok: false, error: 'Not initialized' };
  
  const schemaName = getSchemaForKey(key);
  if (schemaName) {
    const validation = validateSchema(data, schemaName);
    if (!validation.valid) {
      return { ok: false, error: 'Validation failed', errors: validation.errors };
    }
  }
  
  return { ok: coreSave(key, data) };
}

export function load(key: string) {
  if (!enabled.value) return { ok: false, error: 'Not initialized', data: null as string | null };
  return { ok: true, data: coreLoad(key) };
}

export function remove(key: string) {
  if (!enabled.value) return { ok: false, error: 'Not initialized' };
  
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch (e) {
      metrics.errors++;
    }
  }
  return { ok: false, error: 'Storage unavailable' };
}

export function validate(key: string, data: Record<string, unknown>) {
  const schemaName = getSchemaForKey(key);
  if (!schemaName) return { ok: true, valid: true };
  return validateSchema(data, schemaName);
}

export function getStateVersion() {
  return STATE_VERSION;
}

export function getStorageMeta(key: string) {
  const raw = loadRaw(key);
  if (!raw) return null;
  
  return {
    version: raw._version || 0,
    savedAt: raw._savedAt ? new Date(raw._savedAt).toISOString() : null,
    moduleVersion: raw._moduleVersion || 'unknown'
  };
}

export function getNavigationHistory() {
  const data = coreLoad(STORAGE_KEYS.NAVIGATION_STATE);
  return (data && data.history) || [];
}

export function getLastRoute() {
  const data = coreLoad(STORAGE_KEYS.NAVIGATION_STATE);
  return (data && data.current) || null;
}

export function hasPendingChanges() {
  return pendingChanges.size > 0;
}

export function clearAll() {
  const storage = getStorage();
  if (!storage) return { ok: false, error: 'Storage unavailable' };
  
  const keys = Object.values(STORAGE_KEYS);
  for (let i = 0; i < keys.length; i++) {
    try { storage.removeItem(keys[i]); } catch (e) { }
  }
  
  return { ok: true, cleared: keys.length };
}
