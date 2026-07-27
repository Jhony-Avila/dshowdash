// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Offline Mode Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG, OFFLINE_STATES from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   setInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   _state — exported value
//   getState() — exported function
//   setState() — exported function
//   _isInitialized — exported value
//   isInitialized() — exported function
//   setIsInitialized() — exported function
//   _cache — exported value
//   getCache() — exported function
//   setCache() — exported function
//   _syncTimer — exported value
//   getSyncTimer() — exported function
//   setSyncTimer() — exported function
//   _offlineQueue — exported value
//   getOfflineQueue() — exported function
//   setOfflineQueue() — exported function
//   ... and 10 more exports
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

import { DEFAULT_CONFIG, OFFLINE_STATES } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }

export let _state: string = OFFLINE_STATES.ONLINE;
export function getState() { return _state; }
export function setState(s: string) { _state = s; }

export let _isInitialized = false;
export function isInitialized() { return _isInitialized; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

export let _cache: unknown | null = null;
export function getCache() { return _cache; }
export function setCache(c: unknown | null) { _cache = c; }

export let _syncTimer: unknown | null = null;
export function getSyncTimer() { return _syncTimer; }
export function setSyncTimer(t: unknown | null) { _syncTimer = t; }

export let _offlineQueue: unknown[] = [];
export function getOfflineQueue() { return _offlineQueue; }
export function setOfflineQueue(q: unknown[]) { _offlineQueue = q; }
export function addToQueue(item: Record<string, unknown>) { _offlineQueue.push(item); }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export let _cacheMetadata = {};
export function getCacheMetadata() { return _cacheMetadata; }
// @ts-expect-error strict migration — TS2322
export function setCacheMetadata(m: unknown) { _cacheMetadata = m; }
export function updateCacheMetadata(key: string, value: unknown) { (_cacheMetadata as Record<string, unknown>)[key] = value; }
export function deleteCacheMetadata(key: string) { delete (_cacheMetadata as Record<string, unknown>)[key]; }

export const _metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineServes: 0,
  syncAttempts: 0,
  syncSuccesses: 0,
  queuedRequests: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }
