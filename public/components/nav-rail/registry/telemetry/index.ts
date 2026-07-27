// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-registry-telemetry
// PURPOSE: NavRail Registry - Telemetry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IndexedDBCache from ../cache/indexeddb.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setPortsInfo() — exported function
//   getManifest() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as Store from '../state/store.js';
import { IndexedDBCache } from '../cache/indexeddb.js';

export const MODULE_ID = 'navrail-registry-telemetry';
export const VERSION = '4.2.0-ES6';

let _portsSnapshot: Record<string, unknown> | null = null;
let _portsInitialized = false;

export function setPortsInfo(snapshot: Record<string, unknown>, initialized: boolean) {
  _portsSnapshot = snapshot;
  _portsInitialized = initialized;
}

export function getManifest() {
  const metrics = Store.getMetrics();
  return {
    registryId: 'navrail-registry',
    version: VERSION,
    loadedAt: Store.getLoadedAt(),
    itemCount: Store.getRawGroups().length + Store.getRawItems().length,
    items: Store.getRawItems().map(i => i.id),
    groups: Store.getRawGroups().map(g => g.id),
    mobileItems: Store.getMobileItemIds(),
    errors: Store.getErrors(),
    metrics,
    source: metrics.source,
    offlineMode: metrics.offlineMode,
    indexedDB: IndexedDBCache.getStatus(),
    p23Governance: true,
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const metrics = Store.getMetrics();
  const checks = {
    loaded: Store.isLoaded(),
    hasGroups: Store.getRawGroups().length > 0,
    hasItems: Store.getRawItems().length > 0,
    hasMobileItems: Store.getRawMobileItems().length > 0,
    apiHealthy: metrics.apiFails < 3,
    cacheValid: (Date.now() - Store.getLastLoad()) < Store.CACHE_TTL,
    loggerAvailable: true,
    portsInitialized: _portsInitialized,
    indexedDBReady: IndexedDBCache._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let activePorts: string[] = [];
  if (_portsSnapshot) {
    activePorts = Object.keys(_portsSnapshot).filter(k => _portsSnapshot![k] !== null);
  }

  return {
    status: passed === total ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    checks,
    portsInitialized: _portsInitialized,
    source: metrics.source,
    offlineMode: metrics.offlineMode,
    indexedDB: IndexedDBCache.getStatus(),
    ports: activePorts,
    version: VERSION,
    p23Governance: true
  };
}

export function info() {
  const metrics = Store.getMetrics();
  let activePorts: string[] = [];
  if (_portsSnapshot) {
    activePorts = Object.keys(_portsSnapshot).filter(k => _portsSnapshot![k] !== null);
  }

  return {
    version: VERSION,
    moduleId: 'navrail-registry',
    portsInitialized: _portsInitialized,
    loaded: Store.isLoaded(),
    source: metrics.source,
    offlineMode: metrics.offlineMode,
    groups: Store.getRawGroups().length,
    items: Store.getRawItems().length,
    mobileItems: Store.getRawMobileItems().length,
    userLevel: Store.getUserLevel(),
    config: Store.getConfig(),
    metrics,
    indexedDB: IndexedDBCache.getStatus(),
    ports: activePorts,
    healthCheck: healthCheck(),
    p23Governance: true,
    features: ['api-load', 'indexeddb-cache', 'offline-support', 'memory-cache', 'fallback']
  };
}

export default {
  setPortsInfo,
  getManifest,
  healthCheck,
  info
};
