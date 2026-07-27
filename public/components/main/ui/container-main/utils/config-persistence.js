import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE4";
const MODULE_ID = "container-main:config-persistence";
const STORAGE_KEYS = Object.freeze({
  CONFIG: "cm-config",
  USER_PREFS: "cm-user-prefs",
  THEME: "cm-theme",
  LAYOUT: "cm-layout",
  PANELS: "cm-panels",
  CACHE: "cm-cache",
  SESSION: "cm-session"
});
function createConfigPersistence(options = {}) {
  const {
    prefix = "container-main",
    version = "1.0",
    defaultTTL = 864e5,
    maxSize = 5 * 1024 * 1024,
    enableCompression = false,
    onError = null
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _cache = /* @__PURE__ */ new Map();
  let _dirty = /* @__PURE__ */ new Set();
  let _saveTimer = null;
  function _key(namespace) {
    return `${prefix}:${namespace}`;
  }
  function _isAvailable() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  function _serialize(value, metadata = {}) {
    const wrapper = {
      v: version,
      t: Date.now(),
      ttl: metadata.ttl || defaultTTL,
      d: value
    };
    let json = JSON.stringify(wrapper);
    if (enableCompression && json.length > 1e3) {
      try {
        json = btoa(json);
        wrapper._compressed = true;
      } catch (e) {
      }
    }
    return JSON.stringify(wrapper);
  }
  function _deserialize(stored) {
    try {
      let wrapper = JSON.parse(stored);
      if (wrapper._compressed) {
        wrapper = JSON.parse(atob(wrapper.d));
      }
      if (wrapper.v !== version) {
        _logger.warn("Config version mismatch, migrating...");
      }
      if (wrapper.ttl > 0 && Date.now() - wrapper.t > wrapper.ttl) {
        return { expired: true, data: null };
      }
      return { expired: false, data: wrapper.d, timestamp: wrapper.t };
    } catch (e) {
      _logger.error("Deserialize error:", e);
      return { expired: true, data: null, error: e.message };
    }
  }
  function _getUsedSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }
  function _cleanExpired() {
    let cleaned = 0;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        const result = _deserialize(stored);
        if (result.expired) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      cleaned++;
    });
    if (cleaned > 0) {
      _logger.debug(`Cleaned ${cleaned} expired items`);
    }
    return cleaned;
  }
  const persistence = {
    // Verifica disponibilidade
    isAvailable: _isAvailable,
    // Salva valor
    set(namespace, value, options2 = {}) {
      if (!_isAvailable()) {
        _logger.warn("localStorage not available");
        return false;
      }
      const key = _key(namespace);
      const { ttl = defaultTTL, immediate = false } = options2;
      try {
        const serialized = _serialize(value, { ttl });
        if (_getUsedSize() + serialized.length > maxSize) {
          _cleanExpired();
          if (_getUsedSize() + serialized.length > maxSize) {
            _logger.error("Storage quota exceeded");
            onError?.({ type: "quota", namespace });
            return false;
          }
        }
        localStorage.setItem(key, serialized);
        _cache.set(namespace, value);
        _dirty.delete(namespace);
        return true;
      } catch (e) {
        _logger.error(`Set error for ${namespace}:`, e);
        onError?.({ type: "set", namespace, error: e });
        return false;
      }
    },
    // Obtém valor
    get(namespace, defaultValue = null) {
      if (_cache.has(namespace)) {
        return _cache.get(namespace);
      }
      if (!_isAvailable()) {
        return defaultValue;
      }
      const key = _key(namespace);
      const stored = localStorage.getItem(key);
      if (!stored) {
        return defaultValue;
      }
      const result = _deserialize(stored);
      if (result.expired) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      _cache.set(namespace, result.data);
      return result.data;
    },
    // Remove valor
    remove(namespace) {
      const key = _key(namespace);
      localStorage.removeItem(key);
      _cache.delete(namespace);
      _dirty.delete(namespace);
      return true;
    },
    // Verifica se existe
    has(namespace) {
      if (_cache.has(namespace)) return true;
      const key = _key(namespace);
      return localStorage.getItem(key) !== null;
    },
    // Atualiza valor parcialmente (merge)
    update(namespace, updates) {
      const current = this.get(namespace, {});
      const merged = { ...current, ...updates };
      return this.set(namespace, merged);
    },
    // Obtém múltiplos valores
    getMany(namespaces) {
      const result = {};
      for (const ns of namespaces) {
        result[ns] = this.get(ns);
      }
      return result;
    },
    // Salva múltiplos valores
    setMany(items) {
      const results = {};
      for (const [namespace, value] of Object.entries(items)) {
        results[namespace] = this.set(namespace, value);
      }
      return results;
    },
    // Lista todas as chaves
    keys() {
      const result = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          result.push(key.replace(`${prefix}:`, ""));
        }
      }
      return result;
    },
    // Limpa namespace específico
    clearNamespace(namespace) {
      const pattern = `${prefix}:${namespace}`;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(pattern)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return keysToRemove.length;
    },
    // Limpa tudo do prefixo
    clearAll() {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      _cache.clear();
      _dirty.clear();
      _logger.debug(`Cleared ${keysToRemove.length} items`);
      return keysToRemove.length;
    },
    // Limpa itens expirados
    cleanExpired: _cleanExpired,
    // Exporta dados
    export() {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          data[key] = localStorage.getItem(key);
        }
      }
      return JSON.stringify(data, null, 2);
    },
    // Importa dados
    import(jsonData, overwrite = false) {
      try {
        const data = JSON.parse(jsonData);
        let imported = 0;
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(prefix)) {
            if (overwrite || !localStorage.getItem(key)) {
              localStorage.setItem(key, value);
              imported++;
            }
          }
        }
        _cache.clear();
        _logger.debug(`Imported ${imported} items`);
        return { success: true, imported };
      } catch (e) {
        _logger.error("Import error:", e);
        return { success: false, error: e.message };
      }
    },
    // Estatísticas
    getStats() {
      const usedSize = _getUsedSize();
      const keys = this.keys();
      return {
        available: _isAvailable(),
        usedSize,
        usedSizeFormatted: `${(usedSize / 1024).toFixed(2)} KB`,
        maxSize,
        maxSizeFormatted: `${(maxSize / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: `${(usedSize / maxSize * 100).toFixed(1)}%`,
        totalKeys: keys.length,
        cacheSize: _cache.size,
        version
      };
    },
    // Health check
    healthCheck() {
      const stats = this.getStats();
      const usagePercent = parseFloat(stats.usagePercent);
      let status = "HEALTHY";
      if (!stats.available) status = "UNAVAILABLE";
      else if (usagePercent > 90) status = "CRITICAL";
      else if (usagePercent > 70) status = "WARNING";
      return {
        status,
        // @ts-expect-error strict migration — TS2783
        version: VERSION,
        moduleId: MODULE_ID,
        ...stats
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        prefix,
        storageKeys: Object.keys(STORAGE_KEYS),
        available: _isAvailable()
      };
    },
    // Destroy
    destroy() {
      if (_saveTimer) clearInterval(_saveTimer);
      _cache.clear();
      _dirty.clear();
    }
  };
  return persistence;
}
let _instance = null;
function getConfigPersistence(options = {}) {
  if (!_instance) {
    _instance = createConfigPersistence(options);
  }
  return _instance;
}
function resetConfigPersistence() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, storageKeys: Object.keys(STORAGE_KEYS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var config_persistence_default = {
  VERSION,
  MODULE_ID,
  STORAGE_KEYS,
  createConfigPersistence,
  getConfigPersistence,
  resetConfigPersistence,
  info,
  healthCheck
};
export {
  MODULE_ID,
  STORAGE_KEYS,
  VERSION,
  createConfigPersistence,
  config_persistence_default as default,
  getConfigPersistence,
  healthCheck,
  info,
  resetConfigPersistence
};
