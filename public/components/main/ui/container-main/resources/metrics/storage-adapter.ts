// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage-adapter
// PURPOSE: Metrics Storage Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createStorageAdapter() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.resources.metrics.storage-adapter';

export function createStorageAdapter(options: Record<string, unknown> = {}) {
  const { enableCompression = false } = options;
  
  let _storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void } | null = null;

  // Serializa dados para storage
  function serialize(data: Record<string, unknown>) {
    const json = JSON.stringify(data);
    if (enableCompression && typeof btoa === 'function') {
      return btoa(json);
    }
    return json;
  }

  // Deserializa dados do storage
  function deserialize(data: string) {
    if (!data) return null;
    try {
      if (enableCompression && typeof atob === 'function') {
        return JSON.parse(atob(data));
      }
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  return {
    init(customStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void } | null = null) {
      if (customStorage) {
        _storage = customStorage;
        return this;
      }

      // Tenta localStorage
      if (typeof localStorage !== 'undefined') {
        _storage = {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => localStorage.setItem(key, value),
          removeItem: (key: string) => localStorage.removeItem(key)
        };
      } else {
        // Fallback para memória
        const memStore: Record<string, string> = {};
        _storage = {
          getItem: (key: string) => memStore[key] || null,
          setItem: (key: string, value: string) => { memStore[key] = value; },
          removeItem: (key: string) => { delete memStore[key]; }
        };
      }

      return this;
    },

    isAvailable() {
      return _storage !== null;
    },

    get(key: string) {
      if (!_storage) return null;
      const raw = _storage.getItem(key);
      // @ts-expect-error strict migration — TS2345
      return deserialize(raw);
    },

    set(key: string, data: Record<string, unknown>) {
      if (!_storage) return { success: false, size: 0 };
      const serialized = serialize(data);
      _storage.setItem(key, serialized);
      return { success: true, size: serialized.length };
    },

    remove(key: string) {
      if (!_storage) return false;
      _storage.removeItem(key);
      return true;
    },

    serialize,
    deserialize
  };
}

export default { createStorageAdapter };
