// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   config — exported value
//   cache — exported value
//   loaders — exported value
//   prefetchQueue — exported value
//   metrics — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   getCache() — exported function
//   getLoaders() — exported function
//   getPrefetchQueue() — exported function
//   setPrefetchQueue() — exported function
//   incrementMetric() — exported function
//   resetMetrics() — exported function
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

import { DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.state';

export let config = { ...DEFAULT_CONFIG };
export let cache = new Map();
export let loaders = new Map();
export let prefetchQueue: DynObj[] = [];

export const metrics = {
  totalLoads: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  prefetched: 0
};

export function getConfig() { return config; }
export function setConfig(c: DynObj) { config = c; }
export function getCache() { return cache; }
export function getLoaders() { return loaders; }
export function getPrefetchQueue() { return prefetchQueue; }
export function setPrefetchQueue(q: DynObj) { prefetchQueue = q; }

export function incrementMetric(key: string) {
  if (metrics.hasOwnProperty(key)) (metrics as DynObj)[key]++;
}

export function resetMetrics() {
  metrics.totalLoads = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.errors = 0;
  metrics.prefetched = 0;
}
