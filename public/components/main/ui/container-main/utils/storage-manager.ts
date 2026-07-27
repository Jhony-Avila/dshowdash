
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:storage-manager
// PURPOSE: Storage Manager - Abstração de armazenamento
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORAGE_TYPES — exported value
//   createStorageManager() — exported function
//   getStorageManager() — exported function
//   resetStorageManager() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:storage-manager';

// Tipos de storage
export const STORAGE_TYPES = Object.freeze({
  LOCAL: 'local',
  SESSION: 'session',
  INDEXED_DB: 'indexedDB',
  MEMORY: 'memory'
});

// Cria o Storage Manager
export function createStorageManager(options: Record<string, any> = {}) {
  const { defaultStorage = STORAGE_TYPES.LOCAL, prefix = 'cm_', encrypt = false, encryptKey = null, compression = false, dbName = 'ContainerMainDB', dbVersion = 1 } = options;

  const _logger = createLogger(MODULE_ID);
  let _db: Record<string, unknown> | null = null;
  const _memoryStore = new Map();
  let _metrics = { reads: 0, writes: 0, deletes: 0, hits: 0, misses: 0 };

  // Obtém storage nativo
  function _getNativeStorage(type: string) {
    switch (type) {
      case STORAGE_TYPES.LOCAL: return localStorage;
      case STORAGE_TYPES.SESSION: return sessionStorage;
      default: return null;
    }
  }

  // Serializa valor
  function _serialize(value: unknown) {
    const data = { v: value, t: Date.now() };
    let str = JSON.stringify(data);
    if (compression) str = _compress(str);
    if (encrypt && encryptKey) str = _encrypt(str);
    return str;
  }

  // Deserializa valor
  function _deserialize(str: string) {
    if (!str) return null;
    try {
      if (encrypt && encryptKey) str = _decrypt(str);
      if (compression) str = _decompress(str);
      return JSON.parse(str);
    } catch (e) {
      // @ts-expect-error strict migration — TS2345
      _logger.warn('Deserialize error:', e);
      return null;
    }
  }

  // Compressão simples (LZW básico)
  function _compress(str: string) {
    try { return btoa(encodeURIComponent(str)); }
    catch { return str; }
  }

  function _decompress(str: string) {
    try { return decodeURIComponent(atob(str)); }
    catch { return str; }
  }

  // Criptografia simples (XOR)
  function _encrypt(str: string) {
    if (!encryptKey) return str;
    return str.split('').map((c: unknown, i: number) => String.fromCharCode((c as string).charCodeAt(0) ^ encryptKey.charCodeAt(i % encryptKey.length))).join('');
  }

  function _decrypt(str: string) {
    return _encrypt(str);
  }

  // Chave com prefixo
  function _key(key: string) {
    return `${prefix}${key}`;
  }

  // Inicializa IndexedDB
  async function _initIndexedDB() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = () => reject(request.error);
      // @ts-expect-error TS migration - TS2352
      request.onsuccess = () => { _db = request.result as Record<string, unknown>; resolve(_db); };
      request.onupgradeneeded = (e) => {
        const db = (e.target as any).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  // IndexedDB operations
  async function _idbGet(key: string) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)('storage', 'readonly');
      // @ts-expect-error TS migration - TS2349
      const store = (tx as Record<string, unknown>).objectStore('storage');
      const request = store.get(_key(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  async function _idbSet(key: string, value: unknown) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)('storage', 'readwrite');
      // @ts-expect-error TS migration - TS2349
      const store = (tx as Record<string, unknown>).objectStore('storage');
      const request = store.put({ key: _key(key), value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async function _idbDelete(key: string) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)('storage', 'readwrite');
      // @ts-expect-error TS migration - TS2349
      const store = (tx as Record<string, unknown>).objectStore('storage');
      const request = store.delete(_key(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async function _idbClear() {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)('storage', 'readwrite');
      // @ts-expect-error TS migration - TS2349
      const store = (tx as Record<string, unknown>).objectStore('storage');
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async function _idbKeys() {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = ((db as Record<string, unknown>).transaction as (...args: unknown[]) => unknown)('storage', 'readonly');
      // @ts-expect-error TS migration - TS2349
      const store = (tx as Record<string, unknown>).objectStore('storage');
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      // @ts-expect-error TS migration - TS2339
      request.onsuccess = () => resolve(request.result.map((k: number) => k.replace(prefix, '')));
    });
  }

  const manager = {
    // Get
    async get(key: string, options: Record<string, any> = {}) {
      const storage = options.storage || defaultStorage;
      _metrics.reads++;

      try {
        let data;

        switch (storage) {
          case STORAGE_TYPES.MEMORY:
            data = _memoryStore.get(_key(key));
            break;
          case STORAGE_TYPES.INDEXED_DB:
            data = await _idbGet(key);
            break;
          default:
            const native = _getNativeStorage(storage);
            const raw = native?.getItem(_key(key));
            // @ts-expect-error strict migration — TS2345
            data = _deserialize(raw);
        }

        if (data) {
          if (options.maxAge && Date.now() - data.t > options.maxAge) {
            await this.delete(key, { storage });
            _metrics.misses++;
            return options.defaultValue ?? null;
          }
          _metrics.hits++;
          return data.v;
        }

        _metrics.misses++;
        return options.defaultValue ?? null;
      } catch (e) {
        _logger.error('Get error:', e);
        _metrics.misses++;
        return options.defaultValue ?? null;
      }
    },

    // Set
    async set(key: string, value: unknown, options: Record<string, any> = {}) {
      const storage = options.storage || defaultStorage;
      _metrics.writes++;

      try {
        const data = { v: value, t: Date.now() };

        switch (storage) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.set(_key(key), data);
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbSet(key, data);
            break;
          default:
            const native = _getNativeStorage(storage);
            native?.setItem(_key(key), _serialize(value));
        }

        if (options.ttl) {
          setTimeout(() => this.delete(key, { storage }), options.ttl);
        }

        return true;
      } catch (e) {
        _logger.error('Set error:', e);
        return false;
      }
    },

    // Delete
    async delete(key: string, options: Record<string, any> = {}) {
      const storage = options.storage || defaultStorage;
      _metrics.deletes++;

      try {
        switch (storage) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.delete(_key(key));
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbDelete(key);
            break;
          default:
            const native = _getNativeStorage(storage);
            native?.removeItem(_key(key));
        }
        return true;
      } catch (e) {
        _logger.error('Delete error:', e);
        return false;
      }
    },

    // Has
    async has(key: string, options: Record<string, any> = {}) {
      const value = await this.get(key, { ...options, defaultValue: undefined });
      return value !== undefined;
    },

    // Clear
    async clear(options: Record<string, any> = {}) {
      const storage = options.storage || defaultStorage;

      try {
        switch (storage) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.clear();
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbClear();
            break;
          default:
            const native = _getNativeStorage(storage);
            if (native) {
              const keys = [];
              for (let i = 0; i < native.length; i++) {
                const k = native.key(i);
                if (k?.startsWith(prefix)) keys.push(k);
              }
              keys.forEach(k => native.removeItem(k));
            }
        }
        return true;
      } catch (e) {
        _logger.error('Clear error:', e);
        return false;
      }
    },

    // Keys
    async keys(options: Record<string, any> = {}) {
      const storage = options.storage || defaultStorage;

      try {
        switch (storage) {
          case STORAGE_TYPES.MEMORY:
            return Array.from(_memoryStore.keys()).map(k => k.replace(prefix, ''));
          case STORAGE_TYPES.INDEXED_DB:
            return await _idbKeys();
          default:
            const native = _getNativeStorage(storage);
            const keys = [];
            if (native) {
              for (let i = 0; i < native.length; i++) {
                const k = native.key(i);
                if (k?.startsWith(prefix)) keys.push(k.replace(prefix, ''));
              }
            }
            return keys;
        }
      } catch (e) {
        _logger.error('Keys error:', e);
        return [];
      }
    },

    // Size
    async size(options: Record<string, any> = {}) {
      const keys = await this.keys(options);
      // @ts-expect-error strict migration — TS18046
      return keys.length;
    },

    // GetOrSet
    async getOrSet(key: string, factory: (...args: unknown[]) => void, options: Record<string, any> = {}) {
      const value = await this.get(key, options);
      if (value !== null && value !== undefined) return value;
      const newValue = typeof factory === 'function' ? await factory() : factory;
      await this.set(key, newValue, options);
      return newValue;
    },

    // GetMany
    async getMany(keys: unknown, options: Record<string, any> = {}) {
      const results = {};
      for (const key of (keys as unknown[])) {
        // @ts-expect-error strict migration — TS2345
        (results as Record<string, unknown>)[key as string] = await this.get(key, options);
      }
      return results;
    },

    // SetMany
    async setMany(entries: unknown, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2769
      for (const [key, value] of Object.entries(entries)) {
        await this.set(key, value, options);
      }
      return true;
    },

    // Namespace helper
    namespace(ns: unknown) {
      const self = this;
      return {
        get: (key: string, opts: Record<string, unknown>) => self.get(`${ns}:${key}`, opts),
        set: (key: string, value: unknown, opts: Record<string, unknown>) => self.set(`${ns}:${key}`, value, opts),
        delete: (key: string, opts: Record<string, unknown>) => self.delete(`${ns}:${key}`, opts),
        has: (key: string, opts: Record<string, unknown>) => self.has(`${ns}:${key}`, opts),
        clear: async (opts: Record<string, unknown>) => {
          const keys = await self.keys(opts);
          // @ts-expect-error TS migration - TS2339
          for (const k of keys.filter((k: number) => k.startsWith(`${ns}:`))) {
            await self.delete(k, opts);
          }
        }
      };
    },

    // Quota info
    async getQuotaInfo() {
      if (navigator.storage?.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        return { usage, quota, percentage: Math.round((usage! / quota!) * 100) };
      }
      return { usage: 0, quota: 0, percentage: 0 };
    },

    // Metrics
    getMetrics() { return { ..._metrics }; },
    resetMetrics() { _metrics = { reads: 0, writes: 0, deletes: 0, hits: 0, misses: 0 }; },

    healthCheck() {
      const localAvailable = typeof localStorage !== 'undefined';
      const sessionAvailable = typeof sessionStorage !== 'undefined';
      const idbAvailable = typeof indexedDB !== 'undefined';
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, available: { local: localAvailable, session: sessionAvailable, indexedDB: idbAvailable, memory: true }, metrics: _metrics };
    },

    info() {
      return { moduleId: MODULE_ID, version: VERSION, defaultStorage, prefix, types: Object.keys(STORAGE_TYPES) };
    },

    destroy() {
      _memoryStore.clear();
      if (_db) { (_db.close as (...args: unknown[]) => unknown)(); _db = null; }
    }
  };

  return manager;
}

// Singleton
let _instance: Record<string, unknown> | null = null;
export function getStorageManager(options: Record<string, any> = {}) { if (!_instance) _instance = createStorageManager(options); return _instance; }
export function resetStorageManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

// Shortcuts
export async function storage(key: string, value: unknown, options: Record<string, any> = {}) {
  const mgr = getStorageManager();
  if (value === undefined) return (mgr.get as (...args: unknown[]) => unknown)(key, options);
  return (mgr.set as (...args: unknown[]) => unknown)(key, value, options);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(STORAGE_TYPES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, STORAGE_TYPES, createStorageManager, getStorageManager, resetStorageManager, storage, info, healthCheck };
