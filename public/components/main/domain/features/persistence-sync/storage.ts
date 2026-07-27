// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   metrics from ./state.js
//
// PROVIDES:
//   getStorage() — exported function
//   saveRaw() — exported function
//   loadRaw() — exported function
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
 * Persistence Sync - Storage Helpers
 * @module persistence-sync/storage
 */
'use strict';

import { metrics } from './state.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'main.domain.features.persistence-sync.storage';

export function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) { }
  return null;
}

export function saveRaw(key: string, data: Record<string, unknown>) {
  const storage = getStorage();
  if (!storage) return false;
  
  try {
    storage.setItem(key, JSON.stringify(data));
    metrics.saves++;
    return true;
  } catch (e) {
    metrics.errors++;
    return false;
  }
}

export function loadRaw(key: string) {
  const storage = getStorage();
  if (!storage) return null;
  
  try {
    const json = storage.getItem(key);
    if (json) {
      metrics.loads++;
      return JSON.parse(json);
    }
  } catch (e) {
    metrics.errors++;
  }
  return null;
}
