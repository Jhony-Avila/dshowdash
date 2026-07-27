const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-storage-utils";
const STORAGE_PREFIX = "dsd-sidebar-";
let _metrics = { gets: 0, sets: 0, removes: 0 };
function getItem(key, defaultValue = null) {
  _metrics.gets++;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}
function setItem(key, value) {
  _metrics.sets++;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeItem(key) {
  _metrics.removes++;
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch {
    return false;
  }
}
function hasItem(key) {
  return localStorage.getItem(STORAGE_PREFIX + key) !== null;
}
function getAllKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key.slice(STORAGE_PREFIX.length));
  }
  return keys;
}
function clearAll() {
  getAllKeys().forEach((key) => removeItem(key));
}
function getUsedSize() {
  let size = 0;
  getAllKeys().forEach((key) => {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item) size += item.length * 2;
  });
  return size;
}
function exportAll() {
  const data = {};
  getAllKeys().forEach((key) => {
    data[key] = getItem(key);
  });
  return data;
}
function importAll(data) {
  Object.entries(data).forEach(([key, value]) => {
    setItem(key, value);
  });
}
function getCached(key, maxAge = 3e5) {
  const cached = getItem(key);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > maxAge) {
    removeItem(key);
    return null;
  }
  return cached.value;
}
function setCached(key, value, ttl = 3e5) {
  setItem(key, { value, cachedAt: Date.now(), ttl });
}
class LRUCache {
  constructor(maxSize = 50, storageKey = "lru-cache") {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.cache = getItem(storageKey) || { entries: {}, order: [] };
  }
  get(key) {
    if (!(key in this.cache.entries)) return null;
    this.cache.order = this.cache.order.filter((k) => k !== key);
    this.cache.order.push(key);
    this._save();
    return this.cache.entries[key];
  }
  set(key, value) {
    if (key in this.cache.entries) this.cache.order = this.cache.order.filter((k) => k !== key);
    else if (this.cache.order.length >= this.maxSize) {
      const oldest = this.cache.order.shift();
      delete this.cache.entries[oldest];
    }
    this.cache.entries[key] = value;
    this.cache.order.push(key);
    this._save();
  }
  has(key) {
    return key in this.cache.entries;
  }
  delete(key) {
    if (key in this.cache.entries) {
      delete this.cache.entries[key];
      this.cache.order = this.cache.order.filter((k) => k !== key);
      this._save();
    }
  }
  clear() {
    this.cache = { entries: {}, order: [] };
    this._save();
  }
  size() {
    return this.cache.order.length;
  }
  _save() {
    setItem(this.storageKey, this.cache);
  }
}
function createLRUCache(maxSize, storageKey) {
  return new LRUCache(maxSize, storageKey);
}
function getMetrics() {
  return { ..._metrics, keysCount: getAllKeys().length, usedSize: getUsedSize() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, keysCount: getAllKeys().length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { localStorageAvailable: typeof localStorage !== "undefined", keysCount: getAllKeys().length, usedSize: getUsedSize() }, metrics: getMetrics() };
}
var storage_utils_default = { getItem, setItem, removeItem, hasItem, getAllKeys, clearAll, getUsedSize, exportAll, importAll, getCached, setCached, createLRUCache, healthCheck, info, getMetrics, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearAll,
  createLRUCache,
  storage_utils_default as default,
  exportAll,
  getAllKeys,
  getCached,
  getItem,
  getMetrics,
  getUsedSize,
  hasItem,
  healthCheck,
  importAll,
  info,
  removeItem,
  setCached,
  setItem
};
