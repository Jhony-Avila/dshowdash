// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-worker-manager
// PURPOSE: Logger Global - Worker Manager v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initWorker() — exported function
//   serialize() — exported function
//   batchSerialize() — exported function
//   format() — exported function
//   sanitize() — exported function
//   isWorkerAvailable() — exported function
//   terminateWorker() — exported function
//   getWorkerConfig() — exported function
//   getWorkerStats() — exported function
//   resetWorkerStats() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-worker-manager';

var _worker: Worker | null = null;
var _pendingRequests = new Map();
var _requestId = 0;
var _config = {
  enabled: true,
  workerPath: '/assets/js/core/logger-global/workers/serializer.worker.js',
  timeout: 5000,
  fallbackToSync: true
};

var _stats = {
  requestsSent: 0,
  requestsCompleted: 0,
  requestsFailed: 0,
  requestsTimedOut: 0,
  fallbacksUsed: 0
};

// Inicializa worker
export function initWorker(config: Record<string, unknown>) {
  config = config || {};
  
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.workerPath) _config.workerPath = config.workerPath as string;
  if (config.timeout) _config.timeout = config.timeout as number;
  if (config.fallbackToSync !== undefined) _config.fallbackToSync = config.fallbackToSync as boolean;
  
  if (!_config.enabled) {
    return { ok: true, status: 'disabled' };
  }
  
  if (typeof Worker === 'undefined') {
    _config.enabled = false;
    return { ok: false, reason: 'workers-not-supported' };
  }
  
  try {
    _worker = new Worker(_config.workerPath);
    
    _worker.onmessage = function(event: MessageEvent) {
      handleWorkerMessage(event.data);
    };

    _worker.onerror = function(error: ErrorEvent) {
      handleWorkerError(error as unknown as Error);
    };
    
    return { ok: true, status: 'initialized' };
  } catch (error) {
    _config.enabled = false;
    return { ok: false, error: (error as Error).message };
  }
}

// Envia request ao worker
function sendToWorker(type: string, payload: unknown) {
  return new Promise(function(resolve, reject) {
    if (!_worker || !_config.enabled) {
      if (_config.fallbackToSync) {
        _stats.fallbacksUsed++;
        resolve({ ok: true, result: payload, fallback: true });
      } else {
        reject(new Error('Worker not available'));
      }
      return;
    }
    
    var id = ++_requestId;
    
    var timer = setTimeout(function() {
      _pendingRequests.delete(id);
      _stats.requestsTimedOut++;
      
      if (_config.fallbackToSync) {
        _stats.fallbacksUsed++;
        resolve({ ok: true, result: payload, fallback: true });
      } else {
        reject(new Error('Worker timeout'));
      }
    }, _config.timeout);
    
    _pendingRequests.set(id, {
      resolve: resolve,
      reject: reject,
      timer: timer
    });
    
    _stats.requestsSent++;
    
    _worker.postMessage({
      id: id,
      type: type,
      payload: payload
    });
  });
}

// Processa resposta do worker
function handleWorkerMessage(data: Record<string, unknown>) {
  var request = _pendingRequests.get(data.id);
  if (!request) return;
  
  clearTimeout(request.timer);
  _pendingRequests.delete(data.id);
  
  if (data.ok) {
    _stats.requestsCompleted++;
    request.resolve({ ok: true, result: data.result });
  } else {
    _stats.requestsFailed++;
    request.reject(new Error(data.error as string));
  }
}

// Processa erro do worker
function handleWorkerError(error: Error) {
  console.error('[Worker Manager] Worker error:', error);
  
  // Rejeita todas as requests pendentes
  _pendingRequests.forEach(function(request) {
    clearTimeout(request.timer);
    _stats.requestsFailed++;
    request.reject(error);
  });
  
  _pendingRequests.clear();
}

// API Pública
export async function serialize(entry: Record<string, unknown>) {
  return sendToWorker('serialize', entry);
}

export async function batchSerialize(entries: unknown) {
  return sendToWorker('batch-serialize', entries);
}

export async function format(entry: Record<string, unknown>) {
  return sendToWorker('format', entry);
}

export async function sanitize(data: Record<string, unknown>) {
  return sendToWorker('sanitize', data);
}

// Verifica se worker está disponível
export function isWorkerAvailable() {
  return _config.enabled && _worker !== null;
}

// Termina worker
export function terminateWorker() {
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
  
  _pendingRequests.forEach(function(request) {
    clearTimeout(request.timer);
  });
  _pendingRequests.clear();
  
  return { ok: true };
}

export function getWorkerConfig() {
  return { ..._config };
}

export function getWorkerStats() {
  return {
    enabled: _config.enabled,
    available: isWorkerAvailable(),
    pendingRequests: _pendingRequests.size,
    ..._stats
  };
}

export function resetWorkerStats() {
  _stats = {
    requestsSent: 0,
    requestsCompleted: 0,
    requestsFailed: 0,
    requestsTimedOut: 0,
    fallbacksUsed: 0
  };
}

export function healthCheck() {
  return {
    status: !_config.enabled ? 'DISABLED' : (isWorkerAvailable() ? 'HEALTHY' : 'DEGRADED'),
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    available: isWorkerAvailable(),
    pendingRequests: _pendingRequests.size,
    fallbacksUsed: _stats.fallbacksUsed
  };
}
