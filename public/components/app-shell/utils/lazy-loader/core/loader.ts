/**
 * @file Lazy Loader — Core Loader
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/lazy-loader/core/loader
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (cache, pending, incrementMetric, getConfig)
 * @requires ../constants.js (LOAD_STATES)
 * 
 * @provides loadWithTimeout, loadWithRetry, load
 * 
 * @browserAPI dynamic import(), Promise
 * 
 * @description
 * Core lazy loading functionality with timeout, retry, and caching support.
 * Handles module deduplication and tracks loading metrics.
 * 
 * @example
 * import { load, loadWithRetry } from './loader.js';
 * const module = await load('/path/to/module.js');
 * const retried = await loadWithRetry('/path/to/module.js', { retries: 3 });
 * ============================================================================
 */
'use strict';

import { cache, pending, incrementMetric, getConfig } from '../state.js';
import { LOAD_STATES } from '../constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.lazy-loader.core.loader';

export function loadWithTimeout(url: string, timeout: number) {
  return new Promise((resolve, reject) => {
    let timeoutId: DynObj = null;
    let settled = false;
    
    function settle(result: DynObj, isError: boolean) {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (isError) reject(result);
      else resolve(result);
    }
    
    timeoutId = setTimeout(() => {
      settle(new Error(`Load timeout: ${url}`), true);
    }, timeout);
    
    import(url).then(module => {
      settle(module, false);
    }).catch(error => {
      settle(error, true);
    });
  });
}

export function loadWithRetry(url: string, options: DynObj) {
  options = options || {};
  const maxRetries = options.retries || getConfig().retryCount;
  const retryDelay = options.retryDelay || getConfig().retryDelay;
  const timeout = options.timeout || getConfig().timeout;
  
  let attempt = 0;
  
  function tryLoad() {
    attempt++;
    
    return loadWithTimeout(url, timeout).catch(error => {
      if (attempt < maxRetries) {
        return new Promise(resolve => {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          setTimeout(() => {
            resolve(tryLoad());
          }, delay);
        });
      }
      throw error;
    });
  }
  
  return tryLoad();
}

export function load(url: string, options?: DynObj) {
  options = options || {};
  const useCache = options.cache !== false;
  const forceReload = options.force === true;
  
  if (useCache && !forceReload && cache.has(url)) {
    const cached = cache.get(url);
    if (cached.state === LOAD_STATES.LOADED) {
      incrementMetric('cachedHits');
      return Promise.resolve(cached.module);
    }
  }
  
  if (pending.has(url)) {
    return pending.get(url);
  }
  
  const startTime = Date.now();
  incrementMetric('totalLoads');
  
  cache.set(url, { state: LOAD_STATES.LOADING, module: null, error: null });
  
  const loadPromise = loadWithRetry(url, options)
    .then(module => {
      const duration = Date.now() - startTime;
      
      cache.set(url, {
        state: LOAD_STATES.LOADED,
        module,
        error: null,
        loadedAt: Date.now(),
        duration
      });
      
      pending.delete(url);
      incrementMetric('successfulLoads');
      incrementMetric('totalLoadTime', duration);
      
      return module;
    })
    .catch(error => {
      cache.set(url, {
        state: LOAD_STATES.ERROR,
        module: null,
        error: error.message,
        failedAt: Date.now()
      });
      
      pending.delete(url);
      incrementMetric('failedLoads');
      
      throw error;
    });
  
  pending.set(url, loadPromise);
  
  return loadPromise;
}

export default {
  loadWithTimeout,
  loadWithRetry,
  load
};
