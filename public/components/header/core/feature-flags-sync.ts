// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/feature-flags-sync
// PURPOSE: Sincronizacao periodica de feature flags com backend
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   FeatureFlags (namespace) from ./feature-flags.js
// PROVIDES:
//   init(config) — inicializa com configuracao de sync
//   start() — inicia sync periodico
//   stop() — para sync periodico
//   sync() — executa sync imediato
//   forceSync() — alias para sync()
//   isRunning() — verifica se sync esta ativo
//   getLastSync() — timestamp do ultimo sync
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// FETCH:
//   GET /api/config/feature-flags.php
// ═══════════════════════════════════════════════════════════════
// Header - Feature Flags Sync
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B11: var → const/let
// @description Sincroniza feature flags com backend
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import * as FeatureFlagsModule from './feature-flags.js';
const FeatureFlags: typeof FeatureFlagsModule = FeatureFlagsModule;

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/feature-flags-sync';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

const _config = {
  endpoint: '/api/config/feature-flags.php',
  syncInterval: 300000,
  timeout: 5000,
  retryCount: 2,
  enabled: true
};

let _initialized = false;
let _syncTimer: ReturnType<typeof setInterval>|null = null;
let _lastSync: unknown = null;
let _isSyncing = false;

const _metrics = {
  syncCount: 0,
  syncSuccesses: 0,
  syncFailures: 0,
  flagsUpdated: 0,
  lastSyncAt: (null as unknown|null),
  lastSyncDuration: (null as number|null)
};

export function init(config: Record<string,unknown>) {
  if (_initialized) return;
  
  _initPorts();
  
  if (config) {
    Object.assign(_config, config);
  }
  
  _initialized = true;
  _log('info', 'Feature Flags Sync inicializado');
}

export function start() {
  if (!_config.enabled) {
    _log('info', 'Sync desabilitado');
    return;
  }
  
  sync();
  
  if (_syncTimer) clearInterval(_syncTimer);
  _syncTimer = setInterval(() => {
    sync();
  }, _config.syncInterval);
  
  _log('info', 'Sync periodico iniciado (intervalo:', `${_config.syncInterval}ms)`);
}

export function stop() {
  if (_syncTimer) {
    clearInterval(_syncTimer);
    _syncTimer = null;
  }
  _log('info', 'Sync periodico parado');
}

export function sync() {
  if (_isSyncing) {
    _log('debug', 'Sync ja em andamento');
    return Promise.resolve({ skipped: true });
  }
  
  _isSyncing = true;
  _metrics.syncCount++;
  const startTime = Date.now();
  
  return _fetchFlags().then(serverFlags => {
    const duration = Date.now() - startTime;
    _metrics.lastSyncDuration = duration;
    _metrics.lastSyncAt = Date.now();
    _lastSync = Date.now();
    
    const updated = _applyServerFlags(serverFlags);
    
    _metrics.syncSuccesses++;
    _metrics.flagsUpdated += updated;
    _isSyncing = false;
    
    _log('info', 'Sync concluido:', updated, 'flags atualizadas em', `${duration}ms`);
    
    return {
      success: true,
      updated,
      duration
    };
  }).catch(error => {
    _metrics.syncFailures++;
    _isSyncing = false;
    
    _log('error', 'Sync falhou:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  });
}

function _fetchFlags() {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, _config.timeout);
    
    fetch(_config.endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: controller.signal,
      credentials: 'same-origin'
    }).then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    }).then(data => {
      if (data && data.flags) {
        resolve(data.flags);
      } else if (data && typeof data === 'object') {
        resolve(data);
      } else {
        reject(new Error('Resposta invalida'));
      }
    }).catch(error => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

function _applyServerFlags(serverFlags: unknown) {
  if (!serverFlags || typeof serverFlags !== 'object') {
    return 0;
  }
  
  const currentFlags = FeatureFlags.getAll();
  let updated = 0;
  
  Object.keys(serverFlags).forEach(key => {
    const serverValue = (serverFlags as Record<string,unknown>)[key];
    const currentValue = (currentFlags as Record<string,unknown>)[key];
    
    if (typeof serverValue === 'boolean' && serverValue !== currentValue) {
      FeatureFlags.setFlag(key, serverValue);
      updated++;
      _log('debug', 'Flag atualizada:', key, '=', serverValue);
    }
  });
  
  return updated;
}

export function forceSync() {
  return sync();
}

export function getLastSync() {
  return _lastSync;
}

export function isRunning() {
  return !!_syncTimer;
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    isRunning: isRunning(),
    isSyncing: _isSyncing,
    lastSync: _lastSync
  });
}

export function resetMetrics() {
  _metrics.syncCount = 0;
  _metrics.syncSuccesses = 0;
  _metrics.syncFailures = 0;
  _metrics.flagsUpdated = 0;
  _metrics.lastSyncAt = null;
  _metrics.lastSyncDuration = null;
}

export function healthCheck() {
  const successRate = _metrics.syncCount > 0 ? _metrics.syncSuccesses / _metrics.syncCount : 1;
  // @ts-expect-error TS migration - TS2363
  const recentSync = _lastSync && (Date.now() - _lastSync) < (_config.syncInterval * 2);
  
  const checks = {
    initialized: _initialized,
    hasEndpoint: !!_config.endpoint,
    goodSuccessRate: successRate >= 0.7,
    recentSync: recentSync || _metrics.syncCount === 0,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    successRate: `${(successRate * 100).toFixed(1)}%`,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    config: Object.assign({}, _config),
    isRunning: isRunning(),
    isSyncing: _isSyncing,
    lastSync: _lastSync,
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  start,
  stop,
  sync,
  forceSync,
  getLastSync,
  isRunning,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
