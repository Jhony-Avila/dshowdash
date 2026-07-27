// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.state.store
// PURPOSE: In-memory cache store with stats and subscriptions
// ───────────────────────────────────────────────────────────────
// @contract STORE_OPS - get/set/getEntry/setEntry/deleteEntry/clear
// @contract STATS - hits/misses/sets/deletes/evictions tracking
// @contract SUBSCRIPTIONS - subscribe/notify pattern for listeners
// @contract PORTS - Integration via PortsFactory/PortsProfiles
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: cacheStore.get(), set(), getEntry(), setEntry(),
//   deleteEntry(), clear(), getStats(), subscribe(), healthCheck(),
//   info(), injectPorts(), getPorts()
// @changelog v3.4.1-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.3.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.state.store';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

type LoggerPort = { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void };

function _initPorts() { Ports.init(); }
function _getPort(name: string): unknown { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as LoggerPort | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL = 300000;

const createInitialData = () => ({ entries: new Map(), stats: { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0, cleanedExpired: 0 }, maxSize: DEFAULT_MAX_SIZE, defaultTTL: DEFAULT_TTL });

let cacheData = createInitialData();
const storeListeners: Set<Function> = new Set();
let destroyed = false;
let _metrics: { notifyCount: number; notifyErrors: number; lastNotifyAt: number | null } = { notifyCount: 0, notifyErrors: 0, lastNotifyAt: null };

const cacheStore = {
  setDebug(debug: boolean) { _debug = debug; },
  getVersion() { return VERSION; },
  isInitialized() { return !destroyed; },
  get(key: string): unknown { if (key === 'stats') return { ...cacheData.stats }; return (cacheData as Record<string, unknown>)[key]; },
  set(key: string, value: unknown) {
    if (key === 'maxSize') cacheData.maxSize = (typeof value === 'number' && value > 0) ? value : DEFAULT_MAX_SIZE;
    else if (key === 'defaultTTL') cacheData.defaultTTL = (typeof value === 'number' && value > 0) ? value : DEFAULT_TTL;
    else (cacheData as Record<string, unknown>)[key] = value;
    this._notify('set', key, value, null);
    return true;
  },
  getEntry(key: string) { return cacheData.entries.get(key) || null; },
  setEntry(key: string, value: unknown, ttl: number | null = null) {
    const actualTTL = ttl ?? cacheData.defaultTTL;
    const entry = { key, value, createdAt: Date.now(), expiresAt: Date.now() + actualTTL, accessCount: 0, lastAccess: Date.now() };
    cacheData.entries.set(key, entry);
    cacheData.stats.sets++;
    this._notify('entry-set', key, entry, null);
    return entry;
  },
  deleteEntry(key: string) { const existed = cacheData.entries.delete(key); if (existed) cacheData.stats.deletes++; this._notify('entry-deleted', key, null, null); return existed; },
  hasEntry(key: string) { return cacheData.entries.has(key); },
  getSize() { return cacheData.entries.size; },
  clear() { const previousSize = cacheData.entries.size; cacheData.entries.clear(); this._notify('cleared', null, { previousSize }, null); return true; },
  getAllKeys() { return Array.from(cacheData.entries.keys()); },
  getStats() {
    const total = cacheData.stats.hits + cacheData.stats.misses;
    return { version: VERSION, moduleId: MODULE_ID, ...cacheData.stats, size: cacheData.entries.size, maxSize: cacheData.maxSize, defaultTTL: cacheData.defaultTTL, hitRate: total > 0 ? (cacheData.stats.hits / total) : 0, missRate: total > 0 ? (cacheData.stats.misses / total) : 0, listenerCount: storeListeners.size };
  },
  incrementHits() { cacheData.stats.hits++; this._notify('cache-hit', null, null, null); },
  incrementMisses() { cacheData.stats.misses++; this._notify('cache-miss', null, null, null); },
  incrementEvictions() { cacheData.stats.evictions++; },
  incrementCleanedExpired() { cacheData.stats.cleanedExpired++; },
  addCleanedExpired(count: number) { cacheData.stats.cleanedExpired += count; },
  getListenerCount() { return storeListeners.size; },
  subscribe(listener: (...args: unknown[]) => void) {
    if (typeof listener !== 'function') return () => {};
    storeListeners.add(listener);
    _log('info', 'Listener added, total:', storeListeners.size);
    return () => { storeListeners.delete(listener); _log('info', 'Listener removed, total:', storeListeners.size); };
  },
  _notify(action: string, key: string | null, newValue: unknown, oldValue: unknown) {
    _metrics.notifyCount++; _metrics.lastNotifyAt = Date.now();
    storeListeners.forEach(l => { try { l({ action, key, newValue, oldValue }); } catch (e: any) { _metrics.notifyErrors++; _log('error', 'Listener error:', e.message); } });
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const logger = _getPort('logger') as LoggerPort | null;
    const checks = { entriesInitialized: cacheData.entries instanceof Map, listenersInitialized: storeListeners instanceof Set, notDestroyed: !destroyed, lowNotifyErrors: _metrics.notifyErrors < 10, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  info() { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, debug: _debug, destroyed, size: cacheData.entries.size, maxSize: cacheData.maxSize, defaultTTL: cacheData.defaultTTL, listenerCount: storeListeners.size, metrics: { ..._metrics }, healthCheck: this.healthCheck(), portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() }; },
  reset() { cacheData = createInitialData(); destroyed = false; _metrics = { notifyCount: 0, notifyErrors: 0, lastNotifyAt: null as number | null }; this._notify('reset', null, null, null); _log('info', 'Store reset'); },
  destroy() { this.clear(); storeListeners.clear(); destroyed = true; _log('info', 'Store destroyed'); },
  toJSON() {
    const entries: Record<string, unknown> = {};
    cacheData.entries.forEach((v, k) => { entries[k] = { createdAt: v.createdAt, expiresAt: v.expiresAt, accessCount: v.accessCount, lastAccess: v.lastAccess, hasValue: v.value !== null && v.value !== undefined, isExpired: Date.now() > v.expiresAt }; });
    return { version: VERSION, moduleId: MODULE_ID, entries, stats: this.getStats(), maxSize: cacheData.maxSize, defaultTTL: cacheData.defaultTTL };
  },
  injectPorts,
  getPorts
};

export function healthCheck() {
  return cacheStore.healthCheck();
}

export function info() {
  return cacheStore.info();
}

export { cacheStore };
export default cacheStore;
