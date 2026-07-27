import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.4.0-MIGRATION-PHASE8";
const MODULE_ID = "panel-nav-admin.performance.indexed-db-cache";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[IDBCache]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const DB_NAME = "pna_cache";
const DB_VERSION = 1;
const STORE_NAME = "cache_entries";
function IndexedDBCache(options = {}) {
  const dbName = options.dbName || DB_NAME;
  const defaultTTLMs = options.defaultTTLMs || 36e5;
  const maxEntries = options.maxEntries || 100;
  let _db = null;
  let _ready = false;
  function _openDB() {
    if (_db && _ready) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB not available"));
        return;
      }
      const request = indexedDB.open(String(dbName), DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("expiresAt", "expiresAt", { unique: false });
        }
      };
      request.onsuccess = (e) => {
        _db = e.target.result;
        _ready = true;
        resolve(_db);
      };
      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };
    });
  }
  async function get(key) {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result;
          if (!entry) {
            resolve(null);
            return;
          }
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            _delete(key);
            resolve(null);
            return;
          }
          resolve(entry.value);
        };
        request.onerror = () => resolve(null);
      });
    } catch (err) {
      _log("error", "Get failed:", err);
      return null;
    }
  }
  async function set(key, value, ttlMs) {
    try {
      const db = await _openDB();
      const ttl = ttlMs ?? defaultTTLMs;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
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
      _log("error", "Set failed:", err);
      return false;
    }
  }
  async function _delete(key) {
    try {
      const db = await _openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
    } catch (err) {
      _log("error", "Delete failed:", err);
    }
  }
  async function remove(key) {
    return _delete(key);
  }
  async function cleanup() {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("expiresAt");
        const now = Date.now();
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);
        let removed = 0;
        request.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            cursor.delete();
            removed++;
            cursor.continue();
          } else {
            _log("debug", `Cleanup: removed ${removed} expired entries`);
            resolve(removed);
          }
        };
        request.onerror = () => resolve(0);
      });
    } catch (err) {
      _log("error", "Cleanup failed:", err);
      return 0;
    }
  }
  async function clear() {
    try {
      const db = await _openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      _log("info", "Cache cleared");
    } catch (err) {
      _log("error", "Clear failed:", err);
    }
  }
  async function getStats() {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
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
  function destroy() {
    if (_db) {
      _db.close();
      _db = null;
      _ready = false;
    }
  }
  return {
    get,
    set,
    remove,
    cleanup,
    clear,
    getStats,
    destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, dbName: DB_NAME };
}
function healthCheck() {
  const idbAvailable = typeof indexedDB !== "undefined";
  return {
    status: idbAvailable ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    indexedDBAvailable: idbAvailable
  };
}
var indexed_db_cache_default = { IndexedDBCache, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  IndexedDBCache,
  MODULE_ID,
  VERSION,
  indexed_db_cache_default as default,
  healthCheck,
  info,
  injectPorts
};
