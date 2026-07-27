

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.4.0-MIGRATION-PHASE8)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.performance.indexed-db-cache
// PURPOSE: IndexedDB Cache — Cache persistente no browser para loading instantâneo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   IndexedDBCache — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01 IDB cache for nav-admin domain
// @changelog
//   10.4.0-MIGRATION-PHASE8: Initial creation — FASE 8 H.4
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.4.0-MIGRATION-PHASE8';
export const MODULE_ID = 'panel-nav-admin.performance.indexed-db-cache';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[IDBCache]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @private DB constants */
const DB_NAME = 'pna_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache_entries';

/**
 * Factory: creates an IndexedDB-based cache.
 * Provides persistent, offline-capable caching of navigation data.
 *
 * @param {Object} [options]
 * @param {string} [options.dbName] — Custom DB name
 * @param {number} [options.defaultTTLMs=3600000] — Default TTL (1 hour)
 * @param {number} [options.maxEntries=100] — Max cached entries
 * @returns {Object} IndexedDBCache instance
 */
export function IndexedDBCache(options: Record<string, unknown> = {}) {
  const dbName = options.dbName || DB_NAME;
  const defaultTTLMs = (options.defaultTTLMs as number) || 3600000;
  const maxEntries = (options.maxEntries as number) || 100;

  /** @private */
  let _db: IDBDatabase | null = null;
  let _ready = false;

  /**
   * Open the IndexedDB database.
   * @private
   * @returns {Promise<IDBDatabase>}
   */
  function _openDB(): Promise<IDBDatabase> {
    if (_db && _ready) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(String(dbName), DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = ((e.target as any) as any).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        _db = ((e.target as any) as any).result;
        _ready = true;
        // @ts-expect-error strict migration — TS2345
        resolve(_db);
      };

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }

  /**
   * Get a value from cache.
   *
   * @param {string} key — Cache key
   * @returns {Promise<*|null>} Cached value or null if expired/missing
   */
  async function get(key: string) {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result;
          if (!entry) {
            resolve(null);
            return;
          }

          // Check TTL
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            // Expired — remove asynchronously
            _delete(key);
            resolve(null);
            return;
          }

          resolve(entry.value);
        };

        request.onerror = () => resolve(null);
      });
    } catch (err) {
      _log('error', 'Get failed:', err);
      return null;
    }
  }

  /**
   * Set a value in cache.
   *
   * @param {string} key — Cache key
   * @param {*} value — Value to cache (must be cloneable)
   * @param {number} [ttlMs] — TTL in ms (overrides default)
   * @returns {Promise<boolean>} Success
   */
  async function set(key: string, value: unknown, ttlMs?: number) {
    try {
      const db = await _openDB();
      const ttl = ttlMs ?? defaultTTLMs;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const entry = {
          key,
          value,
          createdAt: Date.now(),
          expiresAt: Date.now() + ttl
        };

        const request = store.put(entry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (err) {
      _log('error', 'Set failed:', err);
      return false;
    }
  }

  /**
   * Delete a cache entry.
   * @private
   * @param {string} key
   * @returns {Promise<void>}
   */
  async function _delete(key: string) {
    try {
      const db = await _openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch (err) {
      _log('error', 'Delete failed:', err);
    }
  }

  /**
   * Remove a cache entry.
   *
   * @param {string} key
   * @returns {Promise<void>}
   */
  async function remove(key: string) {
    return _delete(key);
  }

  /**
   * Clear all expired entries.
   * @returns {Promise<number>} Number of entries removed
   */
  async function cleanup() {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('expiresAt');
        const now = Date.now();
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);
        let removed = 0;

        request.onsuccess = (e: Event) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            removed++;
            cursor.continue();
          } else {
            _log('debug', `Cleanup: removed ${removed} expired entries`);
            resolve(removed);
          }
        };

        request.onerror = () => resolve(0);
      });
    } catch (err) {
      _log('error', 'Cleanup failed:', err);
      return 0;
    }
  }

  /**
   * Clear all cache entries.
   * @returns {Promise<void>}
   */
  async function clear() {
    try {
      const db = await _openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      _log('info', 'Cache cleared');
    } catch (err) {
      _log('error', 'Clear failed:', err);
    }
  }

  /**
   * Get cache stats.
   * @returns {Promise<Object>}
   */
  async function getStats() {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const countReq = store.count();

        countReq.onsuccess = () => {
          resolve({
            entryCount: countReq.result,
            maxEntries,
            dbName,
            ready: _ready
          });
        };

        countReq.onerror = () => resolve({ entryCount: 0, maxEntries, dbName, ready: _ready });
      });
    } catch {
      return { entryCount: 0, maxEntries, dbName, ready: false };
    }
  }

  /**
   * Close the database connection.
   */
  function destroy() {
    if (_db) {
      _db.close();
      _db = null;
      _ready = false;
    }
  }

  return {
    get, set, remove, cleanup, clear,
    getStats, destroy
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, dbName: DB_NAME };
}

export function healthCheck() {
  const idbAvailable = typeof indexedDB !== 'undefined';
  return {
    status: idbAvailable ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    indexedDBAvailable: idbAvailable
  };
}

export default { IndexedDBCache, injectPorts, info, healthCheck, VERSION, MODULE_ID };
