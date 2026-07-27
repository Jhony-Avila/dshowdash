// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: strategies
// PURPOSE: Offline Mode Manager - Fetch Strategies
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CACHE_STRATEGIES, OFFLINE_STATES from ../constants.js
//   getConfig, getState, incrementMetric from ../state.js
//   _cacheResponse, _getCachedResponse from ../cache/manager.js
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

import { CACHE_STRATEGIES, OFFLINE_STATES } from '../constants.js';
import { getConfig, getState, incrementMetric } from '../state.js';
import { _cacheResponse, _getCachedResponse } from '../cache/manager.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.network.strategies';

export async function cachedFetch(url: string, options: Record<string, unknown> = {}) {
  const config = getConfig();
  const strategy = options.strategy || config.strategy;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return _cacheFirstFetch(url, options);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return _cacheOnlyFetch(url);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return _networkOnlyFetch(url, options);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return _staleWhileRevalidateFetch(url, options);
    case CACHE_STRATEGIES.NETWORK_FIRST:
    default:
      return _networkFirstFetch(url, options);
  }
}

async function _networkFirstFetch(url: string, options: Record<string, unknown>) {
  if (getState() === OFFLINE_STATES.OFFLINE) {
    const cached = await _getCachedResponse(url);
    if (cached) {
      incrementMetric('offlineServes');
      return cached;
    }
    throw new Error('Offline and no cached response available');
  }
  
  try {
    incrementMetric('networkRequests');
    const response = await fetch(url, options);
    if (response.ok) {
      // @ts-expect-error TS migration - TS2345
      await _cacheResponse(url, response);
    }
    return response;
  } catch (error) {
    const cached = await _getCachedResponse(url);
    if (cached) {
      incrementMetric('offlineServes');
      return cached;
    }
    throw error;
  }
}

async function _cacheFirstFetch(url: string, options: Record<string, unknown>) {
  const cached = await _getCachedResponse(url);
  if (cached) return cached;
  
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error('Offline and no cached response available');
  }
  
  incrementMetric('networkRequests');
  const response = await fetch(url, options);
  if (response.ok) {
    // @ts-expect-error TS migration - TS2345
    await _cacheResponse(url, response);
  }
  return response;
}

async function _cacheOnlyFetch(url: string) {
  const cached = await _getCachedResponse(url);
  if (cached) return cached;
  throw new Error('No cached response available');
}

async function _networkOnlyFetch(url: string, options: Record<string, unknown>) {
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error('Offline');
  }
  incrementMetric('networkRequests');
  return fetch(url, options);
}

async function _staleWhileRevalidateFetch(url: string, options: Record<string, unknown>) {
  const cached = await _getCachedResponse(url);
  
  if (getState() === OFFLINE_STATES.ONLINE) {
    incrementMetric('networkRequests');
    fetch(url, options)
      .then(response => {
        // @ts-expect-error TS migration - TS2345
        if (response.ok) _cacheResponse(url, response);
      })
      .catch(() => { incrementMetric('revalidationFailed'); });
  }
  
  if (cached) return cached;
  
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error('Offline and no cached response available');
  }
  
  return fetch(url, options);
}
