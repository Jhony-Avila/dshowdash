// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.persistence
// PURPOSE: Persistence adapters for Accordion state via LocalStorage
// ───────────────────────────────────────────────────────────────
// @contract LOCAL_STORAGE_ADAPTER - LocalStoragePersistenceAdapter class
// @contract NULL_ADAPTER - NullPersistenceAdapter for testing/disabled persistence
// @contract SAVE - save(serializedState) persists state
// @contract LOAD - load() restores state
// @contract DELETE - delete() removes persisted state
// @contract EXISTS - exists() checks if state exists
// @contract SET_SCOPE - setScope(scope) updates storage key scope
// @contract CLEAR_ALL - clearAll() removes all accordion persistence data
// @contract HEALTH - healthCheck() and info() for observability
// @contract FACTORY - createLocalStoragePersistence(options), createNullPersistence()
// ───────────────────────────────────────────────────────────────
// IMPORTS: PersistenceContract, SCHEMA_VERSION from ../domain/accordion.contracts.js
// PROVIDES: LocalStoragePersistenceAdapter, NullPersistenceAdapter, createLocalStoragePersistence, createNullPersistence, buildStorageKey, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PersistenceContract, SCHEMA_VERSION } from '../domain/accordion.contracts.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.persistence';

// ═══════════════════════════════════════════════════════════════
// STORAGE KEY BUILDER
// ═══════════════════════════════════════════════════════════════

function buildStorageKey(scope: { userId?: string; tenantId?: string; layoutId?: string } = {}) {
  const { userId, tenantId, layoutId } = scope;
  const parts = [PersistenceContract.namespace as string];
  if (tenantId) parts.push(tenantId);
  if (userId) parts.push(userId);
  if (layoutId) parts.push(layoutId);
  return parts.join(':');
}

// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE ADAPTER
// ═══════════════════════════════════════════════════════════════

export class LocalStoragePersistenceAdapter {
  _scope: { userId: string; tenantId: string; layoutId: string };
  _storageKey: string;
  _metrics: { saves: number; loads: number; deletes: number; errors: number; migrations: number };
  _initialized: boolean;

  constructor(options: { userId?: string; tenantId?: string; layoutId?: string } = {}) {
    this._scope = {
      userId: options.userId ?? 'anonymous',
      tenantId: options.tenantId ?? 'default',
      layoutId: options.layoutId ?? 'default'
    };
    this._storageKey = buildStorageKey(this._scope);
    this._metrics = {
      saves: 0,
      loads: 0,
      deletes: 0,
      errors: 0,
      migrations: 0
    };
    this._initialized = false;
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  init() {
    if (this._initialized) {
      return { success: true, message: 'Already initialized' };
    }
    if (!this._isLocalStorageAvailable()) {
      return { success: false, error: 'LocalStorage not available' };
    }
    this._initialized = true;
    return { success: true, storageKey: this._storageKey };
  }

  _isLocalStorageAvailable() {
    try {
      const testKey = '__accordion_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CORE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async save(serializedState: string) {
    this._metrics.saves++;
    try {
      if (!this._initialized) {
        const initResult = this.init();
        if (!initResult.success) {
          this._metrics.errors++;
          return initResult;
        }
      }
      const wrapper = {
        v: SCHEMA_VERSION,
        data: serializedState,
        savedAt: Date.now()
      };
      localStorage.setItem(this._storageKey, JSON.stringify(wrapper));
      return { success: true, key: this._storageKey, timestamp: wrapper.savedAt };
    } catch (error: any) {
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  async load(): Promise<string | null> {
    this._metrics.loads++;
    try {
      if (!this._initialized) {
        const initResult = this.init();
        if (!initResult.success) {
          return null;
        }
      }
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) {
        return null;
      }
      const wrapper = JSON.parse(raw);
      if (wrapper.v !== SCHEMA_VERSION) {
        const migrated = this._migrate(wrapper);
        if (migrated) {
          return migrated.data as string;
        }
        return null;
      }
      if (this._isExpired(wrapper.savedAt)) {
        this.delete();
        return null;
      }
      return wrapper.data;
    } catch (error: any) {
      this._metrics.errors++;
      return null;
    }
  }

  async delete() {
    this._metrics.deletes++;
    try {
      localStorage.removeItem(this._storageKey);
      return { success: true };
    } catch (error: any) {
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPIRATION CHECK
  // ─────────────────────────────────────────────────────────────

  _isExpired(savedAt: number) {
    if (!savedAt) return false;
    const age = Date.now() - savedAt;
    return age > PersistenceContract.ttl;
  }

  // ─────────────────────────────────────────────────────────────
  // MIGRATION (Schema Version Changes)
  // ─────────────────────────────────────────────────────────────

  _migrate(wrapper: Record<string, unknown>) {
    this._metrics.migrations++;
    try {
      if (!wrapper.data) return null;
      return { v: SCHEMA_VERSION, data: wrapper.data, savedAt: Date.now() };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SCOPE MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  setScope(scope: { userId?: string; tenantId?: string; layoutId?: string }) {
    this._scope = { ...this._scope, ...scope };
    this._storageKey = buildStorageKey(this._scope);
    return { success: true, storageKey: this._storageKey };
  }

  getScope() {
    return { ...this._scope };
  }

  getStorageKey() {
    return this._storageKey;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────

  async exists() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      return raw !== null;
    } catch {
      return false;
    }
  }

  async getMetadata() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return null;
      const wrapper = JSON.parse(raw);
      return {
        version: wrapper.v,
        savedAt: wrapper.savedAt,
        age: Date.now() - wrapper.savedAt,
        expired: this._isExpired(wrapper.savedAt)
      };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CLEAR ALL (Admin operation)
  // ─────────────────────────────────────────────────────────────

  async clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PersistenceContract.namespace)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return { success: true, removed: keysToRemove.length };
    } catch (error: any) {
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DESTROY
  // ─────────────────────────────────────────────────────────────

  destroy() {
    this._initialized = false;
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH & INFO
  // ─────────────────────────────────────────────────────────────

  getMetrics() {
    return { ...this._metrics };
  }

  healthCheck() {
    const localStorageAvailable = this._isLocalStorageAvailable();
    const checks = {
      initialized: this._initialized,
      localStorageAvailable,
      noErrors: this._metrics.errors === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
      score: `${passed}/${total}`,
      checks,
      storageKey: this._storageKey,
      metrics: this.getMetrics(),
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      scope: this.getScope(),
      storageKey: this._storageKey,
      schemaVersion: SCHEMA_VERSION,
      ttl: PersistenceContract.ttl,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck()
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

export function createLocalStoragePersistence(options: { userId?: string; tenantId?: string; layoutId?: string } = {}) {
  const adapter = new LocalStoragePersistenceAdapter(options);
  adapter.init();
  return adapter;
}

// ═══════════════════════════════════════════════════════════════
// NULL ADAPTER (for testing / disabled persistence)
// ═══════════════════════════════════════════════════════════════

export class NullPersistenceAdapter {
  async save() { return { success: true, noop: true }; }
  async load(): Promise<string | null> { return null; }
  async delete() { return { success: true }; }
  async exists() { return false; }
  init() { return { success: true }; }
  destroy() { return { success: true }; }
  getMetrics() { return { saves: 0, loads: 0, deletes: 0, errors: 0 }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, checks: { nullAdapter: true } }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, type: 'null' }; }
}

export function createNullPersistence() {
  return new NullPersistenceAdapter();
}

// ═══════════════════════════════════════════════════════════════
// MODULE LEVEL HEALTH & INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    adapters: ['LocalStoragePersistenceAdapter', 'NullPersistenceAdapter'],
    schemaVersion: SCHEMA_VERSION,
    namespace: PersistenceContract.namespace
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      adaptersAvailable: true,
      factoriesAvailable: true
    },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  LocalStoragePersistenceAdapter,
  NullPersistenceAdapter,
  createLocalStoragePersistence,
  createNullPersistence,
  buildStorageKey,
  info,
  healthCheck
};
