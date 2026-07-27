const VERSION = "5.0.0-BULLETPROOF";
const MODULE_ID = "session-storage-port";
const _metrics = { gets: 0, sets: 0, removes: 0, clears: 0, errors: 0 };
function _isStorageAvailable() {
  if (typeof localStorage === "undefined") return false;
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
const _memoryStorage = /* @__PURE__ */ new Map();
const _localStorageAdapter = {
  get(key) {
    _metrics.gets++;
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      _metrics.errors++;
      return null;
    }
  },
  set(key, value) {
    _metrics.sets++;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  remove(key) {
    _metrics.removes++;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  clear() {
    _metrics.clears++;
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
};
const _memoryAdapter = {
  get(key) {
    _metrics.gets++;
    return _memoryStorage.get(key) ?? null;
  },
  set(key, value) {
    _metrics.sets++;
    _memoryStorage.set(key, value);
    return true;
  },
  remove(key) {
    _metrics.removes++;
    _memoryStorage.delete(key);
    return true;
  },
  clear() {
    _metrics.clears++;
    _memoryStorage.clear();
    return true;
  },
  has(key) {
    return _memoryStorage.has(key);
  }
};
let _activeAdapter = _isStorageAvailable() ? _localStorageAdapter : _memoryAdapter;
let _adapterType = _isStorageAvailable() ? "localStorage" : "memory";
function get(key) {
  return _activeAdapter.get(key);
}
function set(key, value) {
  return _activeAdapter.set(key, value);
}
function remove(key) {
  return _activeAdapter.remove(key);
}
function clear() {
  return _activeAdapter.clear();
}
function has(key) {
  return _activeAdapter.has(key);
}
function useMemoryAdapter() {
  _activeAdapter = _memoryAdapter;
  _adapterType = "memory";
}
function useLocalStorageAdapter() {
  if (_isStorageAvailable()) {
    _activeAdapter = _localStorageAdapter;
    _adapterType = "localStorage";
    return true;
  }
  return false;
}
function getAdapterType() {
  return _adapterType;
}
function getVersion() {
  return VERSION;
}
function getMetrics() {
  return { ..._metrics, adapterType: _adapterType };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, adapterType: _adapterType, storageAvailable: _isStorageAvailable(), memoryStorageSize: _memoryStorage.size, metrics: getMetrics(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { adapterActive: !!_activeAdapter, lowErrorRate: _metrics.gets + _metrics.sets === 0 || _metrics.errors / (_metrics.gets + _metrics.sets) < 0.1 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, adapterType: _adapterType, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const StoragePort = { get, set, remove, clear, has, useMemoryAdapter, useLocalStorageAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
var storage_port_default = StoragePort;
export {
  MODULE_ID,
  StoragePort,
  VERSION,
  clear,
  storage_port_default as default,
  get,
  getAdapterType,
  getMetrics,
  getVersion,
  has,
  healthCheck,
  info,
  remove,
  set,
  useLocalStorageAdapter,
  useMemoryAdapter
};
