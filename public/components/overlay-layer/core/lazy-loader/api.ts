// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LOAD_STATUS from ./constants.js
//   config, cache, loaders, prefetchQueue, metrics, setConfig, resetMetrics as resetState from ./state.js
//   getCacheInfo from ./cache/management.js
//   getRegisteredLoaders from ./loaders/registry.js
//   getPrefetchQueueInfo from ./prefetch/manager.js
//
// PROVIDES:
//   configure() — exported function
//   getConfig() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, LOAD_STATUS } from './constants.js';
import { config, cache, loaders, prefetchQueue, metrics, setConfig, resetMetrics as resetState } from './state.js';
import { getCacheInfo } from './cache/management.js';
import { getRegisteredLoaders } from './loaders/registry.js';
import { getPrefetchQueueInfo } from './prefetch/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function configure(newConfig: DynObj) {
  if (!newConfig || typeof newConfig !== 'object') return false;
  setConfig({ ...config, ...newConfig });
  return true;
}

export function getConfig() {
  return { ...config };
}

export function getMetrics() {
  const hitRate = (metrics.cacheHits + metrics.cacheMisses) > 0
    ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
    : 0;
  
  return {
    enabled: config.enabled,
    totalLoads: metrics.totalLoads,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    hitRate: `${hitRate.toFixed(1)}%`,
    errors: metrics.errors,
    prefetched: metrics.prefetched,
    currentCacheSize: cache.size,
    prefetchQueueSize: prefetchQueue.length,
    registeredLoaders: loaders.size
  };
}

export function resetMetrics() {
  resetState();
  return { ok: true };
}

export function healthCheck() {
  const metricsData = getMetrics();
  const hitRate = parseFloat(metricsData.hitRate) || 0;
  
  const checks = {
    enabled: config.enabled,
    hasLoaders: loaders.size > 0,
    goodHitRate: hitRate > 30 || metrics.totalLoads < 10,
    lowErrorRate: metrics.errors < metrics.totalLoads * 0.1 || metrics.totalLoads < 10,
    cacheNotFull: cache.size < config.maxCacheSize
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    metrics: {
      loads: metrics.totalLoads,
      hitRate: metricsData.hitRate,
      errors: metrics.errors
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    cache: getCacheInfo(),
    loaders: getRegisteredLoaders(),
    prefetchQueue: getPrefetchQueueInfo(),
    loadStatuses: LOAD_STATUS,
    timestamp: Date.now()
  };
}
