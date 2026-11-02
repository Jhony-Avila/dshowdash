// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.ports.storage
// PURPOSE: Abstração centralizada para localStorage/sessionStorage
// ───────────────────────────────────────────────────────────────
// @contract STORAGE_PORT - Único acesso autorizado a Storage APIs
// @contract TTL_NAMESPACE - Suporte a TTL, namespace e versionamento
// @contract SSR_SAFE - Fallback em memória quando indisponível
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone port)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   StoragePort — API principal
//     → local.get/set/remove/has/clear — localStorage
//     → session.get/set/remove/has/clear — sessionStorage
//     → isAvailable/isUsingFallback — checks
//     → getMetrics/resetMetrics — métricas
//     → healthCheck() — status de saúde
//     → info() — informações
//
// WINDOW ACCESS:
//   - window.localStorage.* → BROWSER API LEGITIMA
//   - window.sessionStorage.* → BROWSER API LEGITIMA
//
// @changelog v1.2.0-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.0.0-P05-ENTERPRISE: Versão inicial com TTL e namespace
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION: string = '1.2.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.ports.storage';

// Prefixo global para namespace
const STORAGE_PREFIX: string = 'dsd_';
const STORAGE_VERSION: string = '1';

// Injeção de dependência
let _localStorage: Storage | null = null;
let _sessionStorage: Storage | null = null;

// Fallback em memória
interface MemoryStorageInterface {
  _data: Map<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  readonly length: number;
  key: (index: number) => string | null;
}

const memoryStorage: MemoryStorageInterface = {
  _data: new Map(),
  getItem(key: string): string | null { return this._data.has(key) ? this._data.get(key)! : null; },
  setItem(key: string, value: string): void { this._data.set(key, value); },
  removeItem(key: string): void { this._data.delete(key); },
  clear(): void { this._data.clear(); },
  get length(): number { return this._data.size; },
  key(index: number): string | null { const keys: string[] = Array.from(this._data.keys()); return keys[index] || null; }
};

// Métricas
interface StorageMetrics {
  reads: number;
  writes: number;
  deletes: number;
  fallbackUsed: number;
  versionMismatches: number;
  ttlExpired: number;
  errors: number;
}

const _metrics: StorageMetrics = {
  reads: 0,
  writes: 0,
  deletes: 0,
  fallbackUsed: 0,
  versionMismatches: 0,
  ttlExpired: 0,
  errors: 0
};

interface WrappedValue {
  v: string;
  t: number;
  ttl: number | null;
  d: unknown;
}

interface StorageSetOptions {
  ttl?: number;
}

// Helpers internos
function _getLocal(): Storage | MemoryStorageInterface {
  if (_localStorage) return _localStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const test: string = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return window.localStorage;
    } catch (e: unknown) {
      _metrics.fallbackUsed++;
      return memoryStorage;
    }
  }
  _metrics.fallbackUsed++;
  return memoryStorage;
}

function _getSession(): Storage | MemoryStorageInterface {
  if (_sessionStorage) return _sessionStorage;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const test: string = '__storage_test__';
      window.sessionStorage.setItem(test, test);
      window.sessionStorage.removeItem(test);
      return window.sessionStorage;
    } catch (e: unknown) {
      _metrics.fallbackUsed++;
      return memoryStorage;
    }
  }
  _metrics.fallbackUsed++;
  return memoryStorage;
}

function _buildKey(namespace: string | undefined, key: string): string {
  return STORAGE_PREFIX + (namespace ? `${namespace}_` : '') + key;
}

function _wrap(value: unknown, options?: StorageSetOptions): WrappedValue {
  options = options || {};
  return {
    v: STORAGE_VERSION,
    t: Date.now(),
    ttl: options.ttl || null,
    d: value
  };
}

function _unwrap(wrapped: WrappedValue | null, key: string): unknown {
  if (!wrapped || typeof wrapped !== 'object') return null;
  if (wrapped.v !== STORAGE_VERSION) {
    _metrics.versionMismatches++;
    return null;
  }
  if (wrapped.ttl && (Date.now() - wrapped.t) > wrapped.ttl) {
    _metrics.ttlExpired++;
    return null;
  }
  return wrapped.d;
}

// Interfaces para o StoragePort
interface StorageNamespace {
  get: (key: string, namespace?: string) => unknown;
  set: (key: string, value: unknown, namespace?: string, options?: StorageSetOptions) => boolean;
  remove: (key: string, namespace?: string) => boolean;
  has: (key: string, namespace?: string) => boolean;
  clear: (namespace?: string) => boolean;
}

interface StoragePortInterface {
  inject: (localStorage: Storage, sessionStorage: Storage) => void;
  reset: () => void;
  local: StorageNamespace;
  session: StorageNamespace;
  isAvailable: () => boolean;
  isUsingFallback: () => boolean;
  getMetrics: () => StorageMetrics;
  resetMetrics: () => void;
  info: () => Record<string, unknown>;
  healthCheck: () => Record<string, unknown>;
}

// API Pública
export const StoragePort: StoragePortInterface = {
  // Injeção de dependência para testes
  inject(localStorage: Storage, sessionStorage: Storage): void {
    _localStorage = localStorage;
    _sessionStorage = sessionStorage;
  },

  // Reset injeção
  reset(): void {
    _localStorage = null;
    _sessionStorage = null;
  },

  // localStorage com namespace, versão e TTL
  local: {
    get(key: string, namespace?: string): unknown {
      _metrics.reads++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        const raw: string | null = _getLocal().getItem(fullKey);
        if (!raw) return null;
        const parsed: WrappedValue = JSON.parse(raw);
        const value: unknown = _unwrap(parsed, fullKey);
        if (value === null && raw) {
          _getLocal().removeItem(fullKey);
        }
        return value;
      } catch (e: unknown) {
        _metrics.errors++;
        return null;
      }
    },

    set(key: string, value: unknown, namespace?: string, options?: StorageSetOptions): boolean {
      _metrics.writes++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        const wrapped: WrappedValue = _wrap(value, options);
        _getLocal().setItem(fullKey, JSON.stringify(wrapped));
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    },

    remove(key: string, namespace?: string): boolean {
      _metrics.deletes++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        _getLocal().removeItem(fullKey);
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    },

    has(key: string, namespace?: string): boolean {
      return this.get(key, namespace) !== null;
    },

    clear(namespace?: string): boolean {
      try {
        const storage = _getLocal();
        const prefix: string = _buildKey(namespace, '');
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k: string | null = storage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k: string) => { storage.removeItem(k); _metrics.deletes++; });
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    }
  },

  // sessionStorage com namespace, versão e TTL
  session: {
    get(key: string, namespace?: string): unknown {
      _metrics.reads++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        const raw: string | null = _getSession().getItem(fullKey);
        if (!raw) return null;
        const parsed: WrappedValue = JSON.parse(raw);
        const value: unknown = _unwrap(parsed, fullKey);
        if (value === null && raw) {
          _getSession().removeItem(fullKey);
        }
        return value;
      } catch (e: unknown) {
        _metrics.errors++;
        return null;
      }
    },

    set(key: string, value: unknown, namespace?: string, options?: StorageSetOptions): boolean {
      _metrics.writes++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        const wrapped: WrappedValue = _wrap(value, options);
        _getSession().setItem(fullKey, JSON.stringify(wrapped));
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    },

    remove(key: string, namespace?: string): boolean {
      _metrics.deletes++;
      try {
        const fullKey: string = _buildKey(namespace, key);
        _getSession().removeItem(fullKey);
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    },

    has(key: string, namespace?: string): boolean {
      return this.get(key, namespace) !== null;
    },

    clear(namespace?: string): boolean {
      try {
        const storage = _getSession();
        const prefix: string = _buildKey(namespace, '');
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k: string | null = storage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k: string) => { storage.removeItem(k); _metrics.deletes++; });
        return true;
      } catch (e: unknown) {
        _metrics.errors++;
        return false;
      }
    }
  },

  // Utilitários
  isAvailable(): boolean {
    return _getLocal() !== memoryStorage || _getSession() !== memoryStorage;
  },

  isUsingFallback(): boolean {
    return _getLocal() === memoryStorage || _getSession() === memoryStorage;
  },

  getMetrics(): StorageMetrics {
    return Object.assign({}, _metrics);
  },

  resetMetrics(): void {
    _metrics.reads = 0;
    _metrics.writes = 0;
    _metrics.deletes = 0;
    _metrics.fallbackUsed = 0;
    _metrics.versionMismatches = 0;
    _metrics.ttlExpired = 0;
    _metrics.errors = 0;
  },

  info(): Record<string, unknown> {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      strictMode: isStrict(),
      p05Compliant: true,
      storageVersion: STORAGE_VERSION,
      prefix: STORAGE_PREFIX,
      available: this.isAvailable(),
      usingFallback: this.isUsingFallback(),
      metrics: this.getMetrics()
    };
  },

  healthCheck(): Record<string, unknown> {
    const available: boolean = this.isAvailable();
    const usingFallback: boolean = this.isUsingFallback();
    const noErrors: boolean = _metrics.errors === 0;
    return {
      status: available && noErrors ? 'HEALTHY' : (available ? 'DEGRADED' : 'UNHEALTHY'),
      version: VERSION,
      moduleId: MODULE_ID,
      strictMode: isStrict(),
      p05Compliant: true,
      checks: {
        available,
        usingFallback,
        noErrors
      },
      metrics: this.getMetrics(),
      timestamp: Date.now()
    };
  }
};

export default StoragePort;
