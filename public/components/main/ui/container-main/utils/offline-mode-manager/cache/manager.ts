// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Offline Mode Manager - Cache Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getCache, setCache, getCacheMetadata, updateCacheMetadata, increme...
//   _log from ../helpers/logger.js
//   _saveCacheMetadata from ../helpers/storage.js
//   _isExpired, _createCacheKey from ./utils.js
//   _cleanupCache from ./cleanup.js
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

import { getConfig, getCache, setCache, getCacheMetadata, updateCacheMetadata, incrementMetric } from '../state.js';
import { _log } from '../helpers/logger.js';
import { _saveCacheMetadata } from '../helpers/storage.js';
import { _isExpired, _createCacheKey } from './utils.js';
import { _cleanupCache } from './cleanup.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.cache.manager';

export async function _openCache() {
  if (getCache()) return getCache();
  
  const config = getConfig();
  if ('caches' in window) {
    try {
      const cache = await caches.open(config.cacheName);
      setCache(cache);
      return cache;
    } catch (e: any) {
      _log('warn', 'Cache API not available:', e.message);
    }
  }
  return null;
}

export async function _cacheResponse(url: string, response: Record<string, unknown>) {
  const cache = await _openCache();
  if (!cache) return false;
  
  try {
    const key = _createCacheKey(url);
    await ((cache as Record<string, unknown>).put as (...args: unknown[]) => unknown)(key, (response.clone as (...args: unknown[]) => unknown)());
    
    updateCacheMetadata(key, {
      timestamp: Date.now(),
      size: ((response.headers as Record<string, unknown>).get as (...args: unknown[]) => unknown)('content-length') || 0,
      contentType: ((response.headers as Record<string, unknown>).get as (...args: unknown[]) => unknown)('content-type') || 'unknown'
    });
    _saveCacheMetadata();
    
    await _cleanupCache();
    
    return true;
  } catch (e: any) {
    _log('warn', 'Failed to cache response:', e.message);
    return false;
  }
}

export async function _getCachedResponse(url: string) {
  const cache = await _openCache();
  if (!cache) return null;
  
  try {
    const key = _createCacheKey(url);
    const response = await (cache as string).match(key);
    const metadata = getCacheMetadata();
    
    if (response) {
      // @ts-expect-error TS migration - TS2345
      if (!_isExpired((metadata as Record<string, unknown>)[key])) {
        incrementMetric('cacheHits');
        return response;
      }
    }
    
    incrementMetric('cacheMisses');
    return null;
  } catch (e: any) {
    _log('warn', 'Failed to get cached response:', e.message);
    return null;
  }
}
