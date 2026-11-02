// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-backend-sync
// PURPOSE: Logger Global - Backend Sync v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   sendLogBatch from ./send.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initBackendSync() — exported function
//   queueForSync() — exported function
//   syncNow() — exported function
//   setBackendSyncEnabled() — exported function
//   isBackendSyncEnabled() — exported function
//   getBackendSyncConfig() — exported function
//   getBackendSyncStats() — exported function
//   resetBackendSyncStats() — exported function
//   flushSync() — exported function
//   shutdownBackendSync() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { sendLogBatch } from './send.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-backend-sync';

var _config = {
  enabled: false,
  endpoint: '/api/logs',
  syncIntervalMs: 30000, // 30 segundos
  batchSize: 50,
  maxRetries: 3,
  sendOnUnload: true
};

var _buffer: unknown[] = [];
var _syncTimer: ReturnType<typeof setInterval> | null = null;
var _stats = {
  syncsAttempted: 0,
  syncsSucceeded: 0,
  syncsFailed: 0,
  logsSent: 0,
  logsDropped: 0,
  lastSyncAt: null as number | null,
  lastError: null as string | null
};

// Inicializa sync
export function initBackendSync(config: Record<string, unknown>) {
  config = config || {};
  
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.endpoint) _config.endpoint = config.endpoint as string;
  if (config.syncIntervalMs) _config.syncIntervalMs = config.syncIntervalMs as number;
  if (config.batchSize) _config.batchSize = config.batchSize as number;
  if (config.maxRetries) _config.maxRetries = config.maxRetries as number;
  if (config.sendOnUnload !== undefined) _config.sendOnUnload = config.sendOnUnload as boolean;
  
  if (_config.enabled) {
    startSyncTimer();
    setupUnloadHandler();
  }
  
  return { ok: true, config: getBackendSyncConfig() };
}

// Adiciona log ao buffer de sync
export function queueForSync(entry: Record<string, unknown>) {
  if (!_config.enabled) return false;
  
  _buffer.push({
    ...entry,
    queuedAt: Date.now()
  });
  
  // Sync imediato se buffer cheio
  if (_buffer.length >= _config.batchSize) {
    syncNow();
  }
  
  return true;
}

// Sync imediato
export async function syncNow() {
  if (_buffer.length === 0) {
    return { ok: true, sent: 0 };
  }
  
  var toSend = _buffer.splice(0, _config.batchSize);
  _stats.syncsAttempted++;
  
  try {
    var result = await sendLogBatch(toSend, _config.endpoint);
    
    if (result.ok) {
      _stats.syncsSucceeded++;
      _stats.logsSent += toSend.length;
      _stats.lastSyncAt = Date.now();
      return { ok: true, sent: toSend.length };
    } else {
      // Falha - devolve ao buffer ou descarta
      if (_buffer.length < _config.batchSize * 3) {
        _buffer = toSend.concat(_buffer);
      } else {
        _stats.logsDropped += toSend.length;
      }
      
      _stats.syncsFailed++;
      _stats.lastError = result.error ? (result.error as Error).message : 'Unknown error';
      return { ok: false, error: result.error };
    }
  } catch (error) {
    _stats.syncsFailed++;
    _stats.lastError = (error as Error).message;
    _stats.logsDropped += toSend.length;
    return { ok: false, error: error };
  }
}

// Timer de sync periódico
function startSyncTimer() {
  if (_syncTimer) clearInterval(_syncTimer as ReturnType<typeof setInterval>);

  _syncTimer = setInterval(function() {
    if (_buffer.length > 0) {
      syncNow();
    }
  }, _config.syncIntervalMs);
}

function stopSyncTimer() {
  if (_syncTimer) {
    clearInterval(_syncTimer as ReturnType<typeof setInterval>);
    _syncTimer = null;
  }
}

// Handler para unload (envia logs pendentes)
function setupUnloadHandler() {
  if (typeof window === 'undefined') return;
  
  var handler = function() {
    if (_buffer.length > 0 && _config.sendOnUnload) {
      // Usa sendBeacon para envio garantido
      try {
        var payload = JSON.stringify({ logs: _buffer, timestamp: Date.now() });
        navigator.sendBeacon(_config.endpoint, new Blob([payload], { type: 'application/json' }));
      } catch (e) {}
    }
  };
  
  window.addEventListener('beforeunload', handler);
  window.addEventListener('unload', handler);
  window.addEventListener('pagehide', handler);
}

// Enable/disable
export function setBackendSyncEnabled(enabled: boolean) {
  _config.enabled = enabled;
  
  if (enabled) {
    startSyncTimer();
  } else {
    stopSyncTimer();
  }
}

export function isBackendSyncEnabled() {
  return _config.enabled;
}

export function getBackendSyncConfig() {
  return { ..._config };
}

export function getBackendSyncStats() {
  return {
    enabled: _config.enabled,
    bufferSize: _buffer.length,
    ..._stats
  };
}

export function resetBackendSyncStats() {
  _stats = {
    syncsAttempted: 0,
    syncsSucceeded: 0,
    syncsFailed: 0,
    logsSent: 0,
    logsDropped: 0,
    lastSyncAt: null,
    lastError: null
  };
}

// Flush todos os logs pendentes
export async function flushSync() {
  var results = [];
  
  while (_buffer.length > 0) {
    var result = await syncNow();
    results.push(result);
    if (!result.ok) break;
  }
  
  return {
    ok: results.every(function(r) { return r.ok; }),
    batches: results.length,
    totalSent: results.reduce(function(sum, r) { return sum + (r.sent || 0); }, 0)
  };
}

// Shutdown
export function shutdownBackendSync() {
  stopSyncTimer();
  
  // Tenta enviar pendentes
  if (_buffer.length > 0 && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      var payload = JSON.stringify({ logs: _buffer, timestamp: Date.now() });
      navigator.sendBeacon(_config.endpoint, new Blob([payload], { type: 'application/json' }));
    } catch (e) {}
  }
  
  var pending = _buffer.length;
  _buffer = [];
  
  return { ok: true, pendingFlushed: pending };
}

export function healthCheck() {
  var bufferUtilization = Math.round((_buffer.length / (_config.batchSize * 3)) * 100);
  
  return {
    status: !_config.enabled ? 'DISABLED' : (bufferUtilization > 80 ? 'WARNING' : 'HEALTHY'),
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    bufferSize: _buffer.length,
    bufferUtilization: bufferUtilization + '%',
    lastSyncAt: _stats.lastSyncAt,
    lastError: _stats.lastError
  };
}
