// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-BULLETPROOF)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-storage-port
// PURPOSE: Session Manager - Storage Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   StoragePort — exported value
//   get() — exported function
//   set() — exported function
//   remove() — exported function
//   clear() — exported function
//   has() — exported function
//   useMemoryAdapter() — exported function
//   useLocalStorageAdapter() — exported function
//   getAdapterType() — exported function
//   getVersion() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.0.0-BULLETPROOF';
export const MODULE_ID = 'session-storage-port';

const _metrics = { gets: 0, sets: 0, removes: 0, clears: 0, errors: 0 };

function _isStorageAvailable() { if (typeof localStorage === 'undefined') return false; try { const test = '__storage_test__'; localStorage.setItem(test, test); localStorage.removeItem(test); return true; } catch { return false; } }

const _memoryStorage = new Map();

const _localStorageAdapter = {
  get(key: string) { _metrics.gets++; try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; } catch (e) { _metrics.errors++; return null; } },
  set(key: string, value: unknown) { _metrics.sets++; try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { _metrics.errors++; return false; } },
  remove(key: string) { _metrics.removes++; try { localStorage.removeItem(key); return true; } catch (e) { _metrics.errors++; return false; } },
  clear() { _metrics.clears++; try { localStorage.clear(); return true; } catch (e) { _metrics.errors++; return false; } },
  has(key: string) { try { return localStorage.getItem(key) !== null; } catch { return false; } }
};

const _memoryAdapter = {
  get(key: string) { _metrics.gets++; return _memoryStorage.get(key) ?? null; },
  set(key: string, value: unknown) { _metrics.sets++; _memoryStorage.set(key, value); return true; },
  remove(key: string) { _metrics.removes++; _memoryStorage.delete(key); return true; },
  clear() { _metrics.clears++; _memoryStorage.clear(); return true; },
  has(key: string) { return _memoryStorage.has(key); }
};

type StorageAdapter = typeof _localStorageAdapter | typeof _memoryAdapter;
let _activeAdapter: StorageAdapter = _isStorageAvailable() ? _localStorageAdapter : _memoryAdapter;
let _adapterType = _isStorageAvailable() ? 'localStorage' : 'memory';

function get(key: string) { return _activeAdapter.get(key); }
function set(key: string, value: unknown) { return _activeAdapter.set(key, value); }
function remove(key: string) { return _activeAdapter.remove(key); }
function clear() { return _activeAdapter.clear(); }
function has(key: string) { return _activeAdapter.has(key); }
function useMemoryAdapter() { _activeAdapter = _memoryAdapter; _adapterType = 'memory'; }
function useLocalStorageAdapter() { if (_isStorageAvailable()) { _activeAdapter = _localStorageAdapter; _adapterType = 'localStorage'; return true; } return false; }
function getAdapterType() { return _adapterType; }
function getVersion() { return VERSION; }
function getMetrics() { return { ..._metrics, adapterType: _adapterType }; }

function info() { return { moduleId: MODULE_ID, version: VERSION, adapterType: _adapterType, storageAvailable: _isStorageAvailable(), memoryStorageSize: _memoryStorage.size, metrics: getMetrics(), timestamp: Date.now() }; }

function healthCheck() { const checks = { adapterActive: !!_activeAdapter, lowErrorRate: _metrics.gets + _metrics.sets === 0 || (_metrics.errors / (_metrics.gets + _metrics.sets)) < 0.1 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, adapterType: _adapterType, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export const StoragePort = { get, set, remove, clear, has, useMemoryAdapter, useLocalStorageAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
export { get, set, remove, clear, has, useMemoryAdapter, useLocalStorageAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
export default StoragePort;
