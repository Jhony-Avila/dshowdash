

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.persistence-sync
// PURPOSE: MainFeature: Persistence Sync
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   forceSync() — exported function
//   save() — exported function
//   load() — exported function
//   remove() — exported function
//   getNavigationHistory() — exported function
//   getLastRoute() — exported function
//   hasPendingChanges() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   MAIN_EVENTS.NAVIGATION_COMPLETE
//   ROUTER_EVENTS.ROUTE_CHANGED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MODULE_ID = 'main.feature.persistence-sync';
export const VERSION = '1.1.0-ENTERPRISE';

const STORAGE_KEYS = Object.freeze({
  NAVIGATION_STATE: 'dsd:main:navigation',
  CONTAINER_STATE: 'dsd:main:containers',
  USER_PREFERENCES: 'dsd:main:preferences'
});

const SYNC_DEBOUNCE_MS = 500;
const MAX_HISTORY_SIZE = 20;

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _enabled = false;
let _cleanups: Array<() => void> = [];
let _syncTimeoutId: string | null = null;
let _pendingChanges = new Map();

let _metrics = {
  inits: 0,
  saves: 0,
  loads: 0,
  syncs: 0,
  errors: 0,
  navigationsTracked: 0
};

// ═══════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════

function _getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e: any) { /* storage unavailable */ }
  return null;
}

function _save(key: string, data: Record<string, unknown>) {
  const storage = _getStorage();
  if (!storage) return false;
  
  try {
    storage.setItem(key, JSON.stringify(data));
    _metrics.saves++;
    return true;
  } catch (e: any) {
    _metrics.errors++;
    return false;
  }
}

function _load(key: string) {
  const storage = _getStorage();
  if (!storage) return null;
  
  try {
    const json = storage.getItem(key);
    if (json) {
      _metrics.loads++;
      return JSON.parse(json);
    }
  } catch (e: any) {
    _metrics.errors++;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SYNC LOGIC
// ═══════════════════════════════════════════════════════════════

function _flushPending() {
  if (_pendingChanges.size === 0) return;
  
  _pendingChanges.forEach((data, key) => _save(key, data));
  _metrics.syncs++;
  _pendingChanges.clear();
}

function _scheduleSync() {
  // @ts-expect-error strict migration — TS2769
  clearTimeout(_syncTimeoutId);
// @ts-expect-error TS migration - TS2322
  _syncTimeoutId = setTimeout(() => {
    _flushPending();
    _syncTimeoutId = null;
  }, SYNC_DEBOUNCE_MS);
}

function _trackNavigation(path: string) {
  const navState = _load(STORAGE_KEYS.NAVIGATION_STATE) || { history: [], current: null };
  
  navState.current = path;
  navState.history.push({
    path,
    timestamp: Date.now()
  });
  
  // Limitar histórico
  if (navState.history.length > MAX_HISTORY_SIZE) {
    navState.history.shift();
  }
  
  _pendingChanges.set(STORAGE_KEYS.NAVIGATION_STATE, navState);
  _metrics.navigationsTracked++;
  _scheduleSync();
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options = {}) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    const eb = _getPort('eventBus');
    
    if (eb?.on) {
      // Escutar navegação completa (evento que EXISTE)
      const navCompleteHandler = (data: Record<string, unknown>) => {
        const path = data?.path || data?.route || data?.panelId || 'unknown';
// @ts-expect-error TS migration - TS2345
        _trackNavigation(path);
      };
      
      // MAIN_EVENTS.NAVIGATION_COMPLETE existe
      if (MAIN_EVENTS?.NAVIGATION_COMPLETE) {
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler));
      }
      
      // ROUTER_EVENTS.ROUTE_CHANGED também pode ser útil
      if (ROUTER_EVENTS?.ROUTE_CHANGED) {
        eb.on(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler);
        _cleanups.push(() => eb.off?.(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler));
      }
    }
    
    _enabled = true;
    
    return { ok: true, version: VERSION };
    
  } catch (e: any) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  // Flush pending antes de destruir
  _flushPending();
  
  // @ts-expect-error strict migration — TS2769
  clearTimeout(_syncTimeoutId);
  _syncTimeoutId = null;
  
  for (const fn of _cleanups) {
    try { fn(); } catch (e: any) { _metrics.errors++; }
  }
  _cleanups = [];
  
  _pendingChanges.clear();
  _enabled = false;
  
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function forceSync() {
  _flushPending();
  return { ok: true, synced: true };
}

export function save(key: string, data: Record<string, unknown>) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  return { ok: _save(key, data) };
}

export function load(key: string) {
  if (!_enabled) return { ok: false, error: 'Not initialized', data: null as string | null };
  return { ok: true, data: _load(key) };
}

export function remove(key: string) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  
  const storage = _getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch (e: any) {
      _metrics.errors++;
    }
  }
  return { ok: false, error: 'Storage unavailable' };
}

export function getNavigationHistory() {
  return _load(STORAGE_KEYS.NAVIGATION_STATE)?.history || [];
}

export function getLastRoute() {
  return _load(STORAGE_KEYS.NAVIGATION_STATE)?.current || null;
}

export function hasPendingChanges() {
  return _pendingChanges.size > 0;
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return {
    ..._metrics,
    pendingChanges: _pendingChanges.size
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    storageAvailable: !!_getStorage(),
    pendingChanges: _pendingChanges.size,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const storage = _getStorage();
  
  const checks = {
    enabled: _enabled,
    storageAvailable: !!storage
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  else if (!storage) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  STORAGE_KEYS,
  init,
  destroy,
  cleanup,
  forceSync,
  save,
  load,
  remove,
  getNavigationHistory,
  getLastRoute,
  hasPendingChanges,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
