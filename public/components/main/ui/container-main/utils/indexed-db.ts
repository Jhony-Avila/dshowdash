// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-indexed-db
// PURPOSE: Container-Main IndexedDB Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isAvailable() — exported function
//   close() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-indexed-db';

const DB_NAME = 'dsd-container-storage';
const DB_VERSION = 1;
const DEFAULT_STORE = 'data';

let _db: Record<string, unknown> | null = null;
let _dbPromise: unknown = null;

function _openDB() {
  if (_dbPromise) return _dbPromise;
  
  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // @ts-expect-error TS migration - TS2352
      _db = request.result as Record<string, unknown>;
      resolve(_db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as any).result;
      if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
        db.createObjectStore(DEFAULT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'key' });
        store.createIndex('expires', 'expires', { unique: false });
      }
    };
  });
  
  return _dbPromise;
}

function _getStore(storeName: unknown, mode = 'readonly') {
  // @ts-expect-error TS migration - TS2339
  return _openDB().then((db: unknown) => {
    const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)(storeName, mode);
    // @ts-expect-error TS migration - TS2349
    return (tx as Record<string, unknown>).objectStore(storeName);
  });
}

// Set item
export async function set(key: string, value: unknown, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({ id: key, value, updatedAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Get item
export async function get(key: string, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

// Delete item
export async function remove(key: string, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Get all items
export async function getAll(storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    // @ts-expect-error TS migration - TS2339
    request.onsuccess = () => resolve(request.result.map((r: unknown) => ({ key: (r as Record<string, unknown>).id, value: r.value })));
    request.onerror = () => reject(request.error);
  });
}

// Clear store
export async function clear(storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Set with TTL (cache store)
export async function setWithTTL(key: string, value: unknown, ttlMs = 3600000) {
  const store = await _getStore('cache', 'readwrite');
  const expires = Date.now() + ttlMs;
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value, expires, createdAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Get from cache (respects TTL)
export async function getFromCache(key: string) {
  const store = await _getStore('cache', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      if (!result) return resolve(undefined);
      if (result.expires && Date.now() > result.expires) {
        remove(key, 'cache');
        return resolve(undefined);
      }
      resolve(result.value);
    };
    request.onerror = () => reject(request.error);
  });
}

// Clean expired cache entries
export async function cleanExpiredCache() {
  const store = await _getStore('cache', 'readwrite');
  const now = Date.now();
  
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    let deleted = 0;
    
    request.onsuccess = (event: string) => {
      // @ts-expect-error TS migration - TS2339
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.expires && cursor.value.expires < now) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Save state
export async function saveState(key: string, state: Record<string, unknown>) {
  const store = await _getStore('state', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({ key, state, savedAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Load state
export async function loadState(key: string) {
  const store = await _getStore('state', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.state);
    request.onerror = () => reject(request.error);
  });
}

// Check if DB is available
export function isAvailable() {
  return typeof indexedDB !== 'undefined';
}

// Close DB connection
export function close() {
  if (_db) {
    (_db.close as (...args: unknown[]) => unknown)();
    _db = null;
    _dbPromise = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, dbName: DB_NAME, isAvailable: isAvailable(), isOpen: !!_db };
}

export function healthCheck() {
  return { status: isAvailable() ? 'HEALTHY' : 'UNAVAILABLE', version: VERSION, moduleId: MODULE_ID, isAvailable: isAvailable(), isOpen: !!_db };
}

export default {
  set, get, remove, getAll, clear,
  setWithTTL, getFromCache, cleanExpiredCache,
  saveState, loadState, isAvailable, close,
  info, healthCheck, VERSION, MODULE_ID
};
