// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: cleanup
// PURPOSE: Offline Mode Manager - Cache Cleanup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getCacheMetadata, deleteCacheMetadata from ../state.js
//   _log from ../helpers/logger.js
//   _saveCacheMetadata from ../helpers/storage.js
//   _isExpired from ./utils.js
//   _openCache from ./manager.js
//
// PROVIDES:
//   (none)
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

import { getConfig, getCacheMetadata, deleteCacheMetadata } from '../state.js';
import { _log } from '../helpers/logger.js';
import { _saveCacheMetadata } from '../helpers/storage.js';
import { _isExpired } from './utils.js';
import { _openCache } from './manager.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.cache.cleanup';

export async function _cleanupCache() {
  const cache = await _openCache();
  if (!cache) return;
  
  const config = getConfig();
  const metadata = getCacheMetadata();
  
  try {
    const keys = Object.keys(metadata);
    
    // @ts-expect-error TS migration - TS2345
    const expiredKeys = keys.filter(key => _isExpired((metadata as Record<string, unknown>)[key]));
    for (const key of expiredKeys) {
      await ((cache as Record<string, unknown>).delete as (...args: unknown[]) => unknown)(key);
      deleteCacheMetadata(key);
    }
    
    const remainingKeys = Object.keys(getCacheMetadata());
    if (remainingKeys.length > config.maxItems) {
      const sorted = remainingKeys.sort((a, b) => 
        // @ts-expect-error TS migration - TS2339
        ((metadata as Record<string, unknown>)[b]?.timestamp || 0) - ((metadata as Record<string, unknown>)[a]?.timestamp || 0)
      );
      const toRemove = sorted.slice(config.maxItems);
      for (const key of toRemove) {
        await ((cache as Record<string, unknown>).delete as (...args: unknown[]) => unknown)(key);
        deleteCacheMetadata(key);
      }
    }
    
    _saveCacheMetadata();
  } catch (e: any) {
    _log('warn', 'Cache cleanup failed:', e.message);
  }
}
