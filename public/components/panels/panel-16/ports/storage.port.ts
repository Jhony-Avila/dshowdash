// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:port:storage
// PURPOSE: Storage Port - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   StoragePort — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.localStorage
//   window.sessionStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:port:storage';

interface StorageLike {
  getItem(key: string): unknown;
  setItem(key: string, value: unknown): void;
  removeItem(key: string): void;
  clear(): void;
  [key: string]: unknown;
}

let _localStorage: StorageLike | null = null;
let _sessionStorage: StorageLike | null = null;

const memoryStorage = { _data: new Map<string, unknown>(), getItem(key: string) { return this._data.get(key) ?? null; }, setItem(key: string, value: unknown) { this._data.set(key, value); }, removeItem(key: string) { this._data.delete(key); }, clear() { this._data.clear(); }, get length() { return this._data.size; }, key(index: number) { return [...this._data.keys()][index] ?? null; } };

export const StoragePort = {
  inject(localStorage: StorageLike | Storage | Record<string, unknown>, sessionStorage: StorageLike | Storage | Record<string, unknown>) { _localStorage = localStorage as StorageLike; _sessionStorage = sessionStorage as StorageLike; },
  _getLocal(): StorageLike { if (_localStorage) return _localStorage; if (typeof window !== 'undefined' && window.localStorage) { try { window.localStorage.setItem('__test__', '1'); window.localStorage.removeItem('__test__'); return window.localStorage; } catch { return memoryStorage; } } return memoryStorage; },
  _getSession(): StorageLike { if (_sessionStorage) return _sessionStorage; if (typeof window !== 'undefined' && window.sessionStorage) { try { window.sessionStorage.setItem('__test__', '1'); window.sessionStorage.removeItem('__test__'); return window.sessionStorage; } catch { return memoryStorage; } } return memoryStorage; },
  local: {
    get(key: string) { try { const value = StoragePort._getLocal().getItem(key); return value ? JSON.parse(value as string) : null; } catch { return null; } },
    set(key: string, value: unknown) { try { StoragePort._getLocal().setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key: string) { try { StoragePort._getLocal().removeItem(key); return true; } catch { return false; } },
    clear() { try { StoragePort._getLocal().clear(); return true; } catch { return false; } }
  },
  session: {
    get(key: string) { try { const value = StoragePort._getSession().getItem(key); return value ? JSON.parse(value as string) : null; } catch { return null; } },
    set(key: string, value: unknown) { try { StoragePort._getSession().setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key: string) { try { StoragePort._getSession().removeItem(key); return true; } catch { return false; } },
    clear() { try { StoragePort._getSession().clear(); return true; } catch { return false; } }
  },
  isAvailable() { return !!(this._getLocal() && this._getSession()); },
  isUsingFallback() { return this._getLocal() === memoryStorage || this._getSession() === memoryStorage; },
  reset() { _localStorage = null; _sessionStorage = null; },
  info() { return { moduleId: MODULE_ID, version: VERSION, injected: !!(_localStorage || _sessionStorage), available: this.isAvailable(), usingFallback: this.isUsingFallback() }; },
  healthCheck() { return { status: this.isAvailable() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, available: this.isAvailable(), usingFallback: this.isUsingFallback(), timestamp: Date.now() }; }
};

export default StoragePort;
