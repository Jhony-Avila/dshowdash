// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/indexed-db
// PURPOSE: Panel-01 - IndexedDB Cache
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getCache() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/performance/indexed-db';

const DB_NAME = 'panel01_cache';
const DB_VERSION = 1;
const STORE_NAME = 'requisicoes';

export class IndexedDBCache {
  [key: string]: any;
  constructor() {
    this.db = null;
    this._ready = false;
  }

  async init() {
    if (this._ready) return true;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; this._ready = true; resolve(true); };
      request.onupgradeneeded = (e) => {

        // @ts-expect-error TS migration - TS2339
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async set(key: string, data: unknown, type = 'data', ttl = 300000) {
    if (!this._ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = { cacheKey: key, data, type, timestamp: Date.now(), expires: Date.now() + ttl };
      const request = store.put(entry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string) {
    if (!this._ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) { resolve(null); return; }
        if (Date.now() > entry.expires) { this.delete(key); resolve(null); return; }
        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string) {
    if (!this._ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this._ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpired() {
    if (!this._ready) await this.init();
    const now = Date.now();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();
      let deleted = 0;
      request.onsuccess = (e: Event) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.expires < now) { cursor.delete(); deleted++; }
          cursor.continue();
        } else { resolve(deleted); }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStats() {
    if (!this._ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve({ count: request.result, dbName: DB_NAME, storeName: STORE_NAME });
      request.onerror = () => reject(request.error);
    });
  }
}

let instance: InstanceType<typeof IndexedDBCache> | null = null;
export function getCache() { if (!instance) instance = new IndexedDBCache(); return instance; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { IndexedDBCache, getCache };
