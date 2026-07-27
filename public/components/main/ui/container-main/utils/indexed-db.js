const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-indexed-db";
const DB_NAME = "dsd-container-storage";
const DB_VERSION = 1;
const DEFAULT_STORE = "data";
let _db = null;
let _dbPromise = null;
function _openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      _db = request.result;
      resolve(_db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
        db.createObjectStore(DEFAULT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("state")) {
        db.createObjectStore("state", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("cache")) {
        const store = db.createObjectStore("cache", { keyPath: "key" });
        store.createIndex("expires", "expires", { unique: false });
      }
    };
  });
  return _dbPromise;
}
function _getStore(storeName, mode = "readonly") {
  return _openDB().then((db) => {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  });
}
async function set(key, value, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.put({ id: key, value, updatedAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
async function get(key, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, "readonly");
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}
async function remove(key, storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
async function getAll(storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, "readonly");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.map((r) => ({ key: r.id, value: r.value })));
    request.onerror = () => reject(request.error);
  });
}
async function clear(storeName = DEFAULT_STORE) {
  const store = await _getStore(storeName, "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
async function setWithTTL(key, value, ttlMs = 36e5) {
  const store = await _getStore("cache", "readwrite");
  const expires = Date.now() + ttlMs;
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value, expires, createdAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
async function getFromCache(key) {
  const store = await _getStore("cache", "readonly");
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      if (!result) return resolve(void 0);
      if (result.expires && Date.now() > result.expires) {
        remove(key, "cache");
        return resolve(void 0);
      }
      resolve(result.value);
    };
    request.onerror = () => reject(request.error);
  });
}
async function cleanExpiredCache() {
  const store = await _getStore("cache", "readwrite");
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    let deleted = 0;
    request.onsuccess = (event) => {
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
async function saveState(key, state) {
  const store = await _getStore("state", "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.put({ key, state, savedAt: Date.now() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
async function loadState(key) {
  const store = await _getStore("state", "readonly");
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.state);
    request.onerror = () => reject(request.error);
  });
}
function isAvailable() {
  return typeof indexedDB !== "undefined";
}
function close() {
  if (_db) {
    _db.close();
    _db = null;
    _dbPromise = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, dbName: DB_NAME, isAvailable: isAvailable(), isOpen: !!_db };
}
function healthCheck() {
  return { status: isAvailable() ? "HEALTHY" : "UNAVAILABLE", version: VERSION, moduleId: MODULE_ID, isAvailable: isAvailable(), isOpen: !!_db };
}
var indexed_db_default = {
  set,
  get,
  remove,
  getAll,
  clear,
  setWithTTL,
  getFromCache,
  cleanExpiredCache,
  saveState,
  loadState,
  isAvailable,
  close,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cleanExpiredCache,
  clear,
  close,
  indexed_db_default as default,
  get,
  getAll,
  getFromCache,
  healthCheck,
  info,
  isAvailable,
  loadState,
  remove,
  saveState,
  set,
  setWithTTL
};
