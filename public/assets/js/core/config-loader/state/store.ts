// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-store
// PURPOSE: Configuration Store - State management for config-loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   safeGet, deepFreeze, getApiProfileConfig from ../utils/helpers.js
//   cloneValue from ../utils/deepmerge.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setFinalConfig() — exported function
//   freezeStore() — exported function
//   get() — exported function
//   getAll() — exported function
//   isLoaded() — exported function
//   isFrozen() — exported function
//   getApiProfile() — exported function
//   getLoadedAt() — exported function
//   subscribe() — exported function
//   getListenerCount() — exported function
//   hasOverrides() — exported function
//   getOverridesMeta() — exported function
//   getStoreInfo() — exported function
//   destroy() — exported function
//   _reset() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 2.4.0-STRICT-MODE
// @changelog v2.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v2.3.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v2.2.0-P17WI - Added healthCheck export
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { safeGet, deepFreeze, getApiProfileConfig } from '../utils/helpers.js';
import { cloneValue } from '../utils/deepmerge.js';

export const VERSION = '2.4.0-STRICT-MODE';
export const MODULE_ID = 'config-loader-store';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: APP_CONFIG
// ═══════════════════════════════════════════════════════════════
function _getAppConfig() {
  // 1. Try Ports first
  const portConfig = _getPort('appConfig');
  if (portConfig) return portConfig;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waConfig = window.Core.windowAdapter.get('APP_CONFIG');
    if (waConfig) return waConfig;
  }

  // 3. In strict mode, return null (no fallback)
  if (isStrict()) return null;

  // 4. Non-strict: use window.APP_CONFIG with violation recording
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    recordViolation('WINDOW_APP_CONFIG_FALLBACK', { module: MODULE_ID });
    return window.APP_CONFIG;
  }

  return null;
}

const _debug = () => _getAppConfig()?.app?.debug ?? false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.('[ConfigStore]', ...args); return; } if (level === 'warn') { logger.warn?.('[ConfigStore]', ...args); return; } if (_debug()) logger.debug?.('[ConfigStore]', ...args); };

export function getVersion() { return VERSION; }

let _config: Record<string, unknown> = {};
let _frozen = false;
let _loadedAt: number | null = null;
let _destroyed = false;
let _overridesMeta: Record<string, unknown> | null = null;
const _listeners = new Set<(newConfig: Record<string, unknown>, oldConfig: Record<string, unknown>) => void>();

export function setFinalConfig(config: Record<string, unknown>, overridesMeta: Record<string, unknown> | null = null) { if (_frozen) { _log('warn', 'Tentativa de modificar config congelada ignorada'); return false; } const oldConfig = _config; _config = cloneValue(config) as Record<string, unknown>; _loadedAt = Date.now(); _overridesMeta = overridesMeta; _destroyed = false; _listeners.forEach(listener => { try { listener(_config, oldConfig); } catch (err) { _log('warn', 'Config listener threw', (err as Error).message || err); } }); return true; }
export function freezeStore() { _frozen = true; deepFreeze(_config); }
export function get(path: string | undefined = undefined, fallback: unknown = undefined) { if (!isLoaded()) return fallback; if (!path) return cloneValue(_config); return safeGet(_config, path, fallback); }
export function getAll() { return cloneValue(_config); }
export function isLoaded() { return Object.keys(_config).length > 0 && !_destroyed; }
export function isFrozen() { return _frozen; }
export function getApiProfile(profile = 'default') { const fromConfig = get(`api.profiles.${profile}`); if (fromConfig && typeof fromConfig === 'object') return fromConfig; return getApiProfileConfig(profile); }
export function getLoadedAt() { return _loadedAt; }
export function subscribe(listener: (newConfig: Record<string, unknown>, oldConfig: Record<string, unknown>) => void) { if (typeof listener !== 'function') throw new Error('[ConfigStore] Listener deve ser uma função'); _listeners.add(listener); return () => { _listeners.delete(listener); }; }
export function getListenerCount() { return _listeners.size; }
export function hasOverrides() { return _overridesMeta?.hasOverrides === true; }
export function getOverridesMeta() { return _overridesMeta; }
export function _reset() { _config = {}; _frozen = false; _loadedAt = null; _overridesMeta = null; _destroyed = false; _listeners.clear(); }
export function destroy() { _reset(); _destroyed = true; }

export function healthCheck() {
  var checks = { loaded: isLoaded(), frozen: _frozen, portsInitialized: _Ports.isInitialized(), notDestroyed: !_destroyed };
  var passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed >= 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: 4,
    checks: checks,
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}

export function getStoreInfo() { return { version: VERSION, moduleId: MODULE_ID, loaded: isLoaded(), frozen: _frozen, destroyed: _destroyed, loadedAt: _loadedAt, keyCount: Object.keys(_config).length, listenerCount: _listeners.size, hasOverrides: hasOverrides(), overridesMeta: _overridesMeta, strictMode: isStrict(), healthCheck: healthCheck() }; }

export const ConfigStore = { get, getAll, setFinalConfig, freezeStore, isLoaded, isFrozen, getApiProfile, getLoadedAt, subscribe, getListenerCount, hasOverrides, getOverridesMeta, getStoreInfo, destroy, _reset, getVersion, healthCheck, injectPorts, getPorts };
