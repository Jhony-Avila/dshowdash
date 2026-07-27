const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:port:storage";
let _localStorage = null;
let _sessionStorage = null;
const memoryStorage = { _data: /* @__PURE__ */ new Map(), getItem(key) {
  return this._data.get(key) ?? null;
}, setItem(key, value) {
  this._data.set(key, value);
}, removeItem(key) {
  this._data.delete(key);
}, clear() {
  this._data.clear();
}, get length() {
  return this._data.size;
}, key(index) {
  return [...this._data.keys()][index] ?? null;
} };
const StoragePort = {
  inject(localStorage, sessionStorage) {
    _localStorage = localStorage;
    _sessionStorage = sessionStorage;
  },
  _getLocal() {
    if (_localStorage) return _localStorage;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("__test__", "1");
        window.localStorage.removeItem("__test__");
        return window.localStorage;
      } catch {
        return memoryStorage;
      }
    }
    return memoryStorage;
  },
  _getSession() {
    if (_sessionStorage) return _sessionStorage;
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem("__test__", "1");
        window.sessionStorage.removeItem("__test__");
        return window.sessionStorage;
      } catch {
        return memoryStorage;
      }
    }
    return memoryStorage;
  },
  local: {
    get(key) {
      try {
        const value = StoragePort._getLocal().getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        StoragePort._getLocal().setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        StoragePort._getLocal().removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        StoragePort._getLocal().clear();
        return true;
      } catch {
        return false;
      }
    }
  },
  session: {
    get(key) {
      try {
        const value = StoragePort._getSession().getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        StoragePort._getSession().setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        StoragePort._getSession().removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        StoragePort._getSession().clear();
        return true;
      } catch {
        return false;
      }
    }
  },
  isAvailable() {
    return !!(this._getLocal() && this._getSession());
  },
  isUsingFallback() {
    return this._getLocal() === memoryStorage || this._getSession() === memoryStorage;
  },
  reset() {
    _localStorage = null;
    _sessionStorage = null;
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, injected: !!(_localStorage || _sessionStorage), available: this.isAvailable(), usingFallback: this.isUsingFallback() };
  },
  healthCheck() {
    return { status: this.isAvailable() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, available: this.isAvailable(), usingFallback: this.isUsingFallback(), timestamp: Date.now() };
  }
};
var storage_port_default = StoragePort;
export {
  MODULE_ID,
  StoragePort,
  VERSION,
  storage_port_default as default
};
