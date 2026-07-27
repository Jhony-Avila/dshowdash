// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-storage-utils
// PURPOSE: Storage Utils - Utilitários de armazenamento para Sidebar
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getItem() — exported function
//   setItem() — exported function
//   removeItem() — exported function
//   hasItem() — exported function
//   getAllKeys() — exported function
//   clearAll() — exported function
//   getUsedSize() — exported function
//   exportAll() — exported function
//   importAll() — exported function
//   getCached() — exported function
//   setCached() — exported function
//   createLRUCache() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-storage-utils';

const STORAGE_PREFIX = 'dsd-sidebar-';
let _metrics = { gets: 0, sets: 0, removes: 0 };

export function getItem(key: string, defaultValue : DynObj = null) {
  _metrics.gets++;
  try { const item = localStorage.getItem(STORAGE_PREFIX + key); if (item === null) return defaultValue; return JSON.parse(item); }
  catch { return defaultValue; }
}

export function setItem(key: string, value: DynObj) {
  _metrics.sets++;
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function removeItem(key: string) {
  _metrics.removes++;
  try { localStorage.removeItem(STORAGE_PREFIX + key); return true; }
  catch { return false; }
}

export function hasItem(key: string) { return localStorage.getItem(STORAGE_PREFIX + key) !== null; }

export function getAllKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith(STORAGE_PREFIX)) keys.push(key.slice(STORAGE_PREFIX.length)); }
  return keys;
}

export function clearAll() { getAllKeys().forEach(key => removeItem(key)); }

export function getUsedSize() {
  let size = 0;
  getAllKeys().forEach(key => { const item = localStorage.getItem(STORAGE_PREFIX + key); if (item) size += item.length * 2; });
  return size;
}

export function exportAll() { const data = {}; getAllKeys().forEach(key => { (data as Record<string, DynObj>)[key] = getItem(key); }); return data; }
export function importAll(data: DynObj) { Object.entries(data).forEach(([key, value]) => { setItem(key, (value as DynObj)); }); }

export function getCached(key: string, maxAge = 300000) {
  const cached = getItem(key);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > maxAge) { removeItem(key); return null; }
  return cached.value;
}

export function setCached(key: string, value: string, ttl = 300000) { setItem(key, { value, cachedAt: Date.now(), ttl } as DynObj); }

class LRUCache {
  [key: string]: any;
  constructor(maxSize = 50, storageKey = 'lru-cache') {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.cache = getItem(storageKey) || { entries: {}, order: [] };
  }
  get(key: string) { if (!(key in this.cache.entries)) return null; this.cache.order = this.cache.order.filter((k: DynObj) => k !== key); this.cache.order.push(key); this._save(); return this.cache.entries[key]; }
  set(key: string, value: string) { if (key in this.cache.entries) this.cache.order = this.cache.order.filter((k: DynObj) => k !== key); else if (this.cache.order.length >= this.maxSize) { const oldest = this.cache.order.shift(); delete this.cache.entries[oldest]; } this.cache.entries[key] = value; this.cache.order.push(key); this._save(); }
  has(key: string) { return key in this.cache.entries; }
  delete(key: string) { if (key in this.cache.entries) { delete this.cache.entries[key]; this.cache.order = this.cache.order.filter((k: DynObj) => k !== key); this._save(); } }
  clear() { this.cache = { entries: {}, order: [] }; this._save(); }
  size() { return this.cache.order.length; }
  _save() { setItem(this.storageKey, this.cache); }
}

export function createLRUCache(maxSize: number, storageKey: string) { return new LRUCache(maxSize, storageKey); }

export function getMetrics() { return { ..._metrics, keysCount: getAllKeys().length, usedSize: getUsedSize() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, keysCount: getAllKeys().length, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { localStorageAvailable: typeof localStorage !== 'undefined', keysCount: getAllKeys().length, usedSize: getUsedSize() }, metrics: getMetrics() }; }

export default { getItem, setItem, removeItem, hasItem, getAllKeys, clearAll, getUsedSize, exportAll, importAll, getCached, setCached, createLRUCache, healthCheck, info, getMetrics, VERSION, MODULE_ID };
