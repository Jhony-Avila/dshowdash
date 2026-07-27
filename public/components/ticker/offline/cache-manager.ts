// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.offline.cache-manager
// PURPOSE: Offline Cache Manager - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'offline'
//   'online'
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'ticker.offline.cache-manager';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function _log(level: string, ...args: unknown[]) { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); }
const CACHE_NAME = 'ticker-offline-v1';
const STORAGE_KEY = 'ticker_offline_data';
const MAX_ITEMS = 100;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
export class OfflineCacheManager {
  [key: string]: any;
  constructor(options: { maxItems?: number; maxAgeMs?: number; storageKey?: string } = {}) { this.maxItems = options.maxItems || MAX_ITEMS; this.maxAgeMs = options.maxAgeMs || MAX_AGE_MS; this.storageKey = options.storageKey || STORAGE_KEY; this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true; this._subscribers = new Set(); this._metrics = { saves: 0, loads: 0, hits: 0, misses: 0, cleanups: 0 }; this._boundOnlineHandler = this._onOnline.bind(this); this._boundOfflineHandler = this._onOffline.bind(this); }
  init() { if (hasWindow) { window.addEventListener('online', this._boundOnlineHandler); window.addEventListener('offline', this._boundOfflineHandler); } _log('debug', 'OfflineCacheManager initialized', { isOnline: this._isOnline }); return this; }
  async save(items: unknown[]) { if (!Array.isArray(items) || items.length === 0) return false; try { const trimmed = items.slice(0, this.maxItems); const data = { items: trimmed, timestamp: Date.now(), version: VERSION }; localStorage.setItem(this.storageKey, JSON.stringify(data)); this._metrics.saves++; _log('debug', `Saved ${trimmed.length} items to offline cache`); return true; } catch (e: any) { _log('warn', 'Failed to save to offline cache', { error: e.message }); return false; } }
  async load() { this._metrics.loads++; try { const stored = localStorage.getItem(this.storageKey); if (!stored) { this._metrics.misses++; return null; } const data = JSON.parse(stored); if (Date.now() - data.timestamp > this.maxAgeMs) { _log('debug', 'Cached data expired'); this._metrics.misses++; return null; } this._metrics.hits++; _log('debug', `Loaded ${data.items.length} items from offline cache`); return data.items; } catch (e: any) { _log('warn', 'Failed to load from offline cache', { error: e.message }); this._metrics.misses++; return null; } }
  async getWithFallback(fetchFn: () => unknown) { if (this._isOnline) { try { const freshData = await fetchFn(); await this.save(freshData as unknown[]); return { data: freshData, source: 'network', cached: false }; } catch (e: any) { _log('warn', 'Network fetch failed, trying cache', { error: e.message }); } } const cachedData = await this.load(); if (cachedData) { return { data: cachedData, source: 'cache', cached: true }; } throw new Error('No data available (network and cache failed)'); }
  clear() { try { localStorage.removeItem(this.storageKey); _log('debug', 'Offline cache cleared'); return true; } catch (e: any) { return false; } }
  cleanup() { try { const stored = localStorage.getItem(this.storageKey); if (!stored) return 0; const data = JSON.parse(stored); const now = Date.now(); const validItems = data.items.filter((item: Record<string, any>) => { const itemAge = now - new Date(item.published_at || item.timestamp || 0).getTime(); return itemAge < this.maxAgeMs; }); if (validItems.length !== data.items.length) { data.items = validItems.slice(0, this.maxItems); data.timestamp = Date.now(); localStorage.setItem(this.storageKey, JSON.stringify(data)); this._metrics.cleanups++; const removed = data.items.length - validItems.length; _log('debug', `Cleanup: removed ${removed} expired items`); return removed; } return 0; } catch (e: any) { return 0; } }
  getCacheInfo() { try { const stored = localStorage.getItem(this.storageKey); if (!stored) return null; const data = JSON.parse(stored); return { itemCount: data.items.length, timestamp: data.timestamp, age: Date.now() - data.timestamp, version: data.version, sizeBytes: stored.length }; } catch (e: any) { return null; } }
  isOnline() { return this._isOnline; }
  _onOnline() { this._isOnline = true; this._notifySubscribers({ online: true }); _log('debug', 'Network: online'); }
  _onOffline() { this._isOnline = false; this._notifySubscribers({ online: false }); _log('debug', 'Network: offline'); }
  subscribe(callback: (...args: unknown[]) => void) { this._subscribers.add(callback); return () => this._subscribers.delete(callback); }
  _notifySubscribers(data: unknown) { this._subscribers.forEach((cb: (...args: unknown[]) => void) => { try { cb(data); } catch (e: any) {} }); }
  destroy() { if (hasWindow) { window.removeEventListener('online', this._boundOnlineHandler); window.removeEventListener('offline', this._boundOfflineHandler); } this._subscribers.clear(); }
  healthCheck() { const cacheInfo = this.getCacheInfo(); const checks = { isOnline: this._isOnline, hasCache: !!cacheInfo, cacheValid: cacheInfo ? (Date.now() - cacheInfo.timestamp < this.maxAgeMs) : false, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/4`, isOnline: this._isOnline, cacheInfo, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, isOnline: this._isOnline, cacheInfo: this.getCacheInfo(), maxItems: this.maxItems, maxAgeMs: this.maxAgeMs, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default OfflineCacheManager;
