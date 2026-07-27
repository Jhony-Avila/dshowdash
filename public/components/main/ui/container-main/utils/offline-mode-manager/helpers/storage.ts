// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Offline Mode Manager - Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY, CACHE_METADATA_KEY from ../constants.js
//   getConfig, getOfflineQueue, getCacheMetadata from ../state.js
//   _log from ./logger.js
//
// PROVIDES:
//   _saveState() — exported function
//   _loadState() — exported function
//   _saveCacheMetadata() — exported function
//   _loadCacheMetadata() — exported function
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

import { STORAGE_KEY, CACHE_METADATA_KEY } from '../constants.js';
import { getConfig, getOfflineQueue, getCacheMetadata } from '../state.js';
import { _log } from './logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.helpers.storage';

export function _saveState() {
  const config = getConfig();
  if (!config.persistState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      offlineQueue: getOfflineQueue(),
      lastSync: Date.now()
    }));
  } catch (e: any) {
    _log('warn', 'Failed to save state:', e.message);
  }
}

export function _loadState() {
  const config = getConfig();
  if (!config.persistState) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e: any) {
    return null;
  }
}

export function _saveCacheMetadata() {
  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(getCacheMetadata()));
  } catch (e: any) {
    _log('warn', 'Failed to save cache metadata:', e.message);
  }
}

export function _loadCacheMetadata() {
  try {
    const raw = localStorage.getItem(CACHE_METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e: any) {
    return {};
  }
}
