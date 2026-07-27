
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:config-persistence
// PURPOSE: Config Persistence - Cache persistente de configurações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORAGE_KEYS — exported value
//   createConfigPersistence() — exported function
//   getConfigPersistence() — exported function
//   resetConfigPersistence() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE4';
export const MODULE_ID = 'container-main:config-persistence';

// Namespaces de storage
export const STORAGE_KEYS = Object.freeze({
  CONFIG: 'cm-config',
  USER_PREFS: 'cm-user-prefs',
  THEME: 'cm-theme',
  LAYOUT: 'cm-layout',
  PANELS: 'cm-panels',
  CACHE: 'cm-cache',
  SESSION: 'cm-session'
});

// Cria o sistema de persistência
export function createConfigPersistence(options: Record<string, any> = {}) {
  const {
    prefix = 'container-main',
    version = '1.0',
    defaultTTL = 86400000,
    maxSize = 5 * 1024 * 1024,
    enableCompression = false,
    onError = null
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _cache = new Map();
  let _dirty = new Set();
  let _saveTimer = null;

  // Gera chave com prefixo
  function _key(namespace: string) {
    return `${prefix}:${namespace}`;
  }

  // Verifica se localStorage está disponível
  function _isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e: any) {
      return false;
    }
  }

  // Serializa valor
  function _serialize(value: unknown, metadata: Record<string, any> = {}) {
    const wrapper: Record<string, any> = {
      v: version,
      t: Date.now(),
      ttl: metadata.ttl || defaultTTL,
      d: value
    };

    let json = JSON.stringify(wrapper);

    if (enableCompression && json.length > 1000) {
      try {
        json = btoa(json);
        wrapper._compressed = true;
      } catch (e: any) { }
    }

    return JSON.stringify(wrapper);
  }

  // Deserializa valor
  function _deserialize(stored: unknown) {
    try {
      let wrapper = JSON.parse((stored as string));

      if (wrapper._compressed) {
        wrapper = JSON.parse(atob(wrapper.d));
      }

      // Verifica versão
      if (wrapper.v !== version) {
        _logger.warn('Config version mismatch, migrating...');
      }

      // Verifica TTL
      if (wrapper.ttl > 0 && Date.now() - wrapper.t > wrapper.ttl) {
        return { expired: true, data: null as Record<string, unknown> | null };
      }

      return { expired: false, data: wrapper.d, timestamp: wrapper.t };
    } catch (e: any) {
      _logger.error('Deserialize error:', e);
      return { expired: true, data: null as Record<string, unknown> | null, error: e.message };
    }
  }

  // Calcula tamanho usado
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

  // Limpa itens expirados
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

    keysToRemove.forEach(key => {
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
    set(namespace: string, value: unknown, options: Record<string, any> = {}) {
      if (!_isAvailable()) {
        _logger.warn('localStorage not available');
        return false;
      }

      const key = _key(namespace);
      const { ttl = defaultTTL, immediate = false } = options;

      try {
        const serialized = _serialize(value, { ttl });

        // Verifica tamanho
        if (_getUsedSize() + serialized.length > maxSize) {
          _cleanExpired();
          if (_getUsedSize() + serialized.length > maxSize) {
            _logger.error('Storage quota exceeded');
            onError?.({ type: 'quota', namespace });
            return false;
          }
        }

        localStorage.setItem(key, serialized);
        _cache.set(namespace, value);
        _dirty.delete(namespace);

        return true;
      } catch (e: any) {
        _logger.error(`Set error for ${namespace}:`, e);
        onError?.({ type: 'set', namespace, error: e });
        return false;
      }
    },

    // Obtém valor
    get(namespace: string, defaultValue: string | null = null) {
      // Verifica cache em memória primeiro
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
    remove(namespace: string) {
      const key = _key(namespace);
      localStorage.removeItem(key);
      _cache.delete(namespace);
      _dirty.delete(namespace);
      return true;
    },

    // Verifica se existe
    has(namespace: string) {
      if (_cache.has(namespace)) return true;
      const key = _key(namespace);
      return localStorage.getItem(key) !== null;
    },

    // Atualiza valor parcialmente (merge)
    update(namespace: string, updates: Record<string, unknown>) {
      // @ts-expect-error strict migration — TS2345
      const current = this.get(namespace, {});
      const merged = { ...current, ...updates };
      return this.set(namespace, merged);
    },

    // Obtém múltiplos valores
    getMany(namespaces: unknown) {
      const result = {};
      for (const ns of (namespaces as unknown[])) {
        // @ts-expect-error strict migration — TS2345
        (result as Record<string, unknown>)[ns as string] = this.get(ns);
      }
      return result;
    },

    // Salva múltiplos valores
    setMany(items: unknown) {
      const results = {};
      // @ts-expect-error strict migration — TS2769
      for (const [namespace, value] of Object.entries(items)) {
        (results as Record<string, unknown>)[namespace] = this.set(namespace, value);
      }
      return results;
    },

    // Lista todas as chaves
    keys() {
      const result = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          result.push(key.replace(`${prefix}:`, ''));
        }
      }
      return result;
    },

    // Limpa namespace específico
    clearNamespace(namespace: string) {
      const pattern = `${prefix}:${namespace}`;
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(pattern)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
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

      keysToRemove.forEach(key => localStorage.removeItem(key));
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
          (data as Record<string, unknown>)[key] = localStorage.getItem(key);
        }
      }
      return JSON.stringify(data, null, 2);
    },

    // Importa dados
    import(jsonData: unknown, overwrite = false) {
      try {
        const data = JSON.parse((jsonData as string));
        let imported = 0;

        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(prefix)) {
            if (overwrite || !localStorage.getItem(key)) {
              localStorage.setItem(key, value as string);
              imported++;
            }
          }
        }

        _cache.clear();
        _logger.debug(`Imported ${imported} items`);
        return { success: true, imported };
      } catch (e: any) {
        _logger.error('Import error:', e);
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
        usagePercent: `${((usedSize / maxSize) * 100).toFixed(1)}%`,
        totalKeys: keys.length,
        cacheSize: _cache.size,
        version
      };
    },

    // Health check
    healthCheck() {
      const stats = this.getStats();
      const usagePercent = parseFloat(stats.usagePercent);

      let status = 'HEALTHY';
      if (!stats.available) status = 'UNAVAILABLE';
      else if (usagePercent > 90) status = 'CRITICAL';
      else if (usagePercent > 70) status = 'WARNING';

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

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getConfigPersistence(options: Record<string, any> = {}) {
  if (!_instance) {
    _instance = createConfigPersistence(options);
  }
  return _instance;
}

export function resetConfigPersistence() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, storageKeys: Object.keys(STORAGE_KEYS) };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  STORAGE_KEYS,
  createConfigPersistence, getConfigPersistence, resetConfigPersistence,
  info, healthCheck
};
