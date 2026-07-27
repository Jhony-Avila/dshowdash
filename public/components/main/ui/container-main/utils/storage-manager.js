import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:storage-manager";
const STORAGE_TYPES = Object.freeze({
  LOCAL: "local",
  SESSION: "session",
  INDEXED_DB: "indexedDB",
  MEMORY: "memory"
});
function createStorageManager(options = {}) {
  const { defaultStorage = STORAGE_TYPES.LOCAL, prefix = "cm_", encrypt = false, encryptKey = null, compression = false, dbName = "ContainerMainDB", dbVersion = 1 } = options;
  const _logger = createLogger(MODULE_ID);
  let _db = null;
  const _memoryStore = /* @__PURE__ */ new Map();
  let _metrics = { reads: 0, writes: 0, deletes: 0, hits: 0, misses: 0 };
  function _getNativeStorage(type) {
    switch (type) {
      case STORAGE_TYPES.LOCAL:
        return localStorage;
      case STORAGE_TYPES.SESSION:
        return sessionStorage;
      default:
        return null;
    }
  }
  function _serialize(value) {
    const data = { v: value, t: Date.now() };
    let str = JSON.stringify(data);
    if (compression) str = _compress(str);
    if (encrypt && encryptKey) str = _encrypt(str);
    return str;
  }
  function _deserialize(str) {
    if (!str) return null;
    try {
      if (encrypt && encryptKey) str = _decrypt(str);
      if (compression) str = _decompress(str);
      return JSON.parse(str);
    } catch (e) {
      _logger.warn("Deserialize error:", e);
      return null;
    }
  }
  function _compress(str) {
    try {
      return btoa(encodeURIComponent(str));
    } catch {
      return str;
    }
  }
  function _decompress(str) {
    try {
      return decodeURIComponent(atob(str));
    } catch {
      return str;
    }
  }
  function _encrypt(str) {
    if (!encryptKey) return str;
    return str.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ encryptKey.charCodeAt(i % encryptKey.length))).join("");
  }
  function _decrypt(str) {
    return _encrypt(str);
  }
  function _key(key) {
    return `${prefix}${key}`;
  }
  async function _initIndexedDB() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        _db = request.result;
        resolve(_db);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("storage")) {
          db.createObjectStore("storage", { keyPath: "key" });
        }
      };
    });
  }
  async function _idbGet(key) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("storage", "readonly");
      const store = tx.objectStore("storage");
      const request = store.get(_key(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }
  async function _idbSet(key, value) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("storage", "readwrite");
      const store = tx.objectStore("storage");
      const request = store.put({ key: _key(key), value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  async function _idbDelete(key) {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("storage", "readwrite");
      const store = tx.objectStore("storage");
      const request = store.delete(_key(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  async function _idbClear() {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("storage", "readwrite");
      const store = tx.objectStore("storage");
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  async function _idbKeys() {
    const db = await _initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("storage", "readonly");
      const store = tx.objectStore("storage");
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.map((k) => k.replace(prefix, "")));
    });
  }
  const manager = {
    // Get
    async get(key, options2 = {}) {
      const storage2 = options2.storage || defaultStorage;
      _metrics.reads++;
      try {
        let data;
        switch (storage2) {
          case STORAGE_TYPES.MEMORY:
            data = _memoryStore.get(_key(key));
            break;
          case STORAGE_TYPES.INDEXED_DB:
            data = await _idbGet(key);
            break;
          default:
            const native = _getNativeStorage(storage2);
            const raw = native?.getItem(_key(key));
            data = _deserialize(raw);
        }
        if (data) {
          if (options2.maxAge && Date.now() - data.t > options2.maxAge) {
            await this.delete(key, { storage: storage2 });
            _metrics.misses++;
            return options2.defaultValue ?? null;
          }
          _metrics.hits++;
          return data.v;
        }
        _metrics.misses++;
        return options2.defaultValue ?? null;
      } catch (e) {
        _logger.error("Get error:", e);
        _metrics.misses++;
        return options2.defaultValue ?? null;
      }
    },
    // Set
    async set(key, value, options2 = {}) {
      const storage2 = options2.storage || defaultStorage;
      _metrics.writes++;
      try {
        const data = { v: value, t: Date.now() };
        switch (storage2) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.set(_key(key), data);
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbSet(key, data);
            break;
          default:
            const native = _getNativeStorage(storage2);
            native?.setItem(_key(key), _serialize(value));
        }
        if (options2.ttl) {
          setTimeout(() => this.delete(key, { storage: storage2 }), options2.ttl);
        }
        return true;
      } catch (e) {
        _logger.error("Set error:", e);
        return false;
      }
    },
    // Delete
    async delete(key, options2 = {}) {
      const storage2 = options2.storage || defaultStorage;
      _metrics.deletes++;
      try {
        switch (storage2) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.delete(_key(key));
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbDelete(key);
            break;
          default:
            const native = _getNativeStorage(storage2);
            native?.removeItem(_key(key));
        }
        return true;
      } catch (e) {
        _logger.error("Delete error:", e);
        return false;
      }
    },
    // Has
    async has(key, options2 = {}) {
      const value = await this.get(key, { ...options2, defaultValue: void 0 });
      return value !== void 0;
    },
    // Clear
    async clear(options2 = {}) {
      const storage2 = options2.storage || defaultStorage;
      try {
        switch (storage2) {
          case STORAGE_TYPES.MEMORY:
            _memoryStore.clear();
            break;
          case STORAGE_TYPES.INDEXED_DB:
            await _idbClear();
            break;
          default:
            const native = _getNativeStorage(storage2);
            if (native) {
              const keys = [];
              for (let i = 0; i < native.length; i++) {
                const k = native.key(i);
                if (k?.startsWith(prefix)) keys.push(k);
              }
              keys.forEach((k) => native.removeItem(k));
            }
        }
        return true;
      } catch (e) {
        _logger.error("Clear error:", e);
        return false;
      }
    },
    // Keys
    async keys(options2 = {}) {
      const storage2 = options2.storage || defaultStorage;
      try {
        switch (storage2) {
          case STORAGE_TYPES.MEMORY:
            return Array.from(_memoryStore.keys()).map((k) => k.replace(prefix, ""));
          case STORAGE_TYPES.INDEXED_DB:
            return await _idbKeys();
          default:
            const native = _getNativeStorage(storage2);
            const keys = [];
            if (native) {
              for (let i = 0; i < native.length; i++) {
                const k = native.key(i);
                if (k?.startsWith(prefix)) keys.push(k.replace(prefix, ""));
              }
            }
            return keys;
        }
      } catch (e) {
        _logger.error("Keys error:", e);
        return [];
      }
    },
    // Size
    async size(options2 = {}) {
      const keys = await this.keys(options2);
      return keys.length;
    },
    // GetOrSet
    async getOrSet(key, factory, options2 = {}) {
      const value = await this.get(key, options2);
      if (value !== null && value !== void 0) return value;
      const newValue = typeof factory === "function" ? await factory() : factory;
      await this.set(key, newValue, options2);
      return newValue;
    },
    // GetMany
    async getMany(keys, options2 = {}) {
      const results = {};
      for (const key of keys) {
        results[key] = await this.get(key, options2);
      }
      return results;
    },
    // SetMany
    async setMany(entries, options2 = {}) {
      for (const [key, value] of Object.entries(entries)) {
        await this.set(key, value, options2);
      }
      return true;
    },
    // Namespace helper
    namespace(ns) {
      const self = this;
      return {
        get: (key, opts) => self.get(`${ns}:${key}`, opts),
        set: (key, value, opts) => self.set(`${ns}:${key}`, value, opts),
        delete: (key, opts) => self.delete(`${ns}:${key}`, opts),
        has: (key, opts) => self.has(`${ns}:${key}`, opts),
        clear: async (opts) => {
          const keys = await self.keys(opts);
          for (const k of keys.filter((k2) => k2.startsWith(`${ns}:`))) {
            await self.delete(k, opts);
          }
        }
      };
    },
    // Quota info
    async getQuotaInfo() {
      if (navigator.storage?.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        return { usage, quota, percentage: Math.round(usage / quota * 100) };
      }
      return { usage: 0, quota: 0, percentage: 0 };
    },
    // Metrics
    getMetrics() {
      return { ..._metrics };
    },
    resetMetrics() {
      _metrics = { reads: 0, writes: 0, deletes: 0, hits: 0, misses: 0 };
    },
    healthCheck() {
      const localAvailable = typeof localStorage !== "undefined";
      const sessionAvailable = typeof sessionStorage !== "undefined";
      const idbAvailable = typeof indexedDB !== "undefined";
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, available: { local: localAvailable, session: sessionAvailable, indexedDB: idbAvailable, memory: true }, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, defaultStorage, prefix, types: Object.keys(STORAGE_TYPES) };
    },
    destroy() {
      _memoryStore.clear();
      if (_db) {
        _db.close();
        _db = null;
      }
    }
  };
  return manager;
}
let _instance = null;
function getStorageManager(options = {}) {
  if (!_instance) _instance = createStorageManager(options);
  return _instance;
}
function resetStorageManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
async function storage(key, value, options = {}) {
  const mgr = getStorageManager();
  if (value === void 0) return mgr.get(key, options);
  return mgr.set(key, value, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(STORAGE_TYPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var storage_manager_default = { VERSION, MODULE_ID, STORAGE_TYPES, createStorageManager, getStorageManager, resetStorageManager, storage, info, healthCheck };
export {
  MODULE_ID,
  STORAGE_TYPES,
  VERSION,
  createStorageManager,
  storage_manager_default as default,
  getStorageManager,
  healthCheck,
  info,
  resetStorageManager,
  storage
};
