const MODULE_ID = "navrail-registry-cache";
const VERSION = "4.2.0-ES6";
let _logger = null;
function setLogger(logger) {
  _logger = logger;
}
const _log = function(level, ...args) {
  if (!_logger) return;
  const fn = _logger[level] || _logger.info;
  if (typeof fn === "function") fn.apply(_logger, [`[${MODULE_ID}]`].concat(args));
};
const IndexedDBCache = {
  DB_NAME: "NavRailDB",
  STORE_NAME: "registry",
  DB_VERSION: 1,
  _db: null,
  _initialized: false,
  init() {
    const self = this;
    if (this._initialized) return Promise.resolve(this._db);
    if (typeof indexedDB === "undefined") {
      _log("warn", "IndexedDB not available");
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(self.DB_NAME, self.DB_VERSION);
      request.onerror = () => {
        _log("error", "IndexedDB open failed", { error: request.error });
        resolve(null);
      };
      request.onsuccess = () => {
        self._db = request.result;
        self._initialized = true;
        _log("debug", "IndexedDB initialized");
        resolve(self._db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(self.STORE_NAME)) {
          db.createObjectStore(self.STORE_NAME, { keyPath: "id" });
          _log("info", "IndexedDB store created");
        }
      };
    });
  },
  save(data, version) {
    const self = this;
    if (!this._db) return this.init().then(() => self._doSave(data, version));
    return this._doSave(data, version);
  },
  _doSave(data, version) {
    const self = this;
    if (!this._db) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        const tx = self._db.transaction(self.STORE_NAME, "readwrite");
        const store = tx.objectStore(self.STORE_NAME);
        const record = {
          id: "navrail-registry",
          data,
          timestamp: Date.now(),
          version: version || VERSION
        };
        const request = store.put(record);
        request.onsuccess = () => {
          _log("debug", "Registry saved to IndexedDB");
          resolve(true);
        };
        request.onerror = () => {
          _log("warn", "IndexedDB save failed", { error: request.error });
          resolve(false);
        };
      } catch (e) {
        _log("warn", "IndexedDB save exception", { error: e.message });
        resolve(false);
      }
    });
  },
  load() {
    const self = this;
    if (!this._db) return this.init().then(() => self._doLoad());
    return this._doLoad();
  },
  _doLoad() {
    const self = this;
    if (!this._db) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const tx = self._db.transaction(self.STORE_NAME, "readonly");
        const store = tx.objectStore(self.STORE_NAME);
        const request = store.get("navrail-registry");
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.data) {
            _log("debug", "Registry loaded from IndexedDB", { age: `${Date.now() - result.timestamp}ms` });
            resolve(result);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          _log("warn", "IndexedDB load failed", { error: request.error });
          resolve(null);
        };
      } catch (e) {
        _log("warn", "IndexedDB load exception", { error: e.message });
        resolve(null);
      }
    });
  },
  clear() {
    const self = this;
    if (!this._db) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        const tx = self._db.transaction(self.STORE_NAME, "readwrite");
        const store = tx.objectStore(self.STORE_NAME);
        const request = store.delete("navrail-registry");
        request.onsuccess = () => {
          resolve(true);
        };
        request.onerror = () => {
          resolve(false);
        };
      } catch (e) {
        resolve(false);
      }
    });
  },
  getStatus() {
    return {
      initialized: this._initialized,
      hasDB: !!this._db,
      dbName: this.DB_NAME,
      storeName: this.STORE_NAME
    };
  }
};
var indexeddb_default = IndexedDBCache;
export {
  IndexedDBCache,
  MODULE_ID,
  VERSION,
  indexeddb_default as default,
  setLogger
};
