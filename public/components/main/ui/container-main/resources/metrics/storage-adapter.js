const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.resources.metrics.storage-adapter";
function createStorageAdapter(options = {}) {
  const { enableCompression = false } = options;
  let _storage = null;
  function serialize(data) {
    const json = JSON.stringify(data);
    if (enableCompression && typeof btoa === "function") {
      return btoa(json);
    }
    return json;
  }
  function deserialize(data) {
    if (!data) return null;
    try {
      if (enableCompression && typeof atob === "function") {
        return JSON.parse(atob(data));
      }
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return {
    init(customStorage = null) {
      if (customStorage) {
        _storage = customStorage;
        return this;
      }
      if (typeof localStorage !== "undefined") {
        _storage = {
          getItem: (key) => localStorage.getItem(key),
          setItem: (key, value) => localStorage.setItem(key, value),
          removeItem: (key) => localStorage.removeItem(key)
        };
      } else {
        const memStore = {};
        _storage = {
          getItem: (key) => memStore[key] || null,
          setItem: (key, value) => {
            memStore[key] = value;
          },
          removeItem: (key) => {
            delete memStore[key];
          }
        };
      }
      return this;
    },
    isAvailable() {
      return _storage !== null;
    },
    get(key) {
      if (!_storage) return null;
      const raw = _storage.getItem(key);
      return deserialize(raw);
    },
    set(key, data) {
      if (!_storage) return { success: false, size: 0 };
      const serialized = serialize(data);
      _storage.setItem(key, serialized);
      return { success: true, size: serialized.length };
    },
    remove(key) {
      if (!_storage) return false;
      _storage.removeItem(key);
      return true;
    },
    serialize,
    deserialize
  };
}
var storage_adapter_default = { createStorageAdapter };
export {
  MODULE_ID,
  VERSION,
  createStorageAdapter,
  storage_adapter_default as default
};
