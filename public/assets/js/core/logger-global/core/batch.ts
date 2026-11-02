// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-batch
// PURPOSE: Logger Global - Batch Writing v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initBatch() — exported function
//   addToBatch() — exported function
//   flushBatch() — exported function
//   onFlush() — exported function
//   offFlush() — exported function
//   setBatchEnabled() — exported function
//   isBatchEnabled() — exported function
//   getBatchConfig() — exported function
//   getBatchStats() — exported function
//   resetBatchStats() — exported function
//   shutdownBatch() — exported function
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
export const MODULE_ID = 'logger-global-batch';

// Configuração
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL_MS = 500;
const MAX_BATCH_SIZE = 50;

let _config = {
  enabled: true,
  batchSize: DEFAULT_BATCH_SIZE,
  flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
  destinations: [] as unknown[] // callbacks para flush
};

let _batch: unknown[] = [];
let _flushTimer: unknown | null = null;
let _stats = {
  batchesCreated: 0,
  batchesFlushed: 0,
  logsQueued: 0,
  logsFlushed: 0,
  flushErrors: 0,
  lastFlushAt: null as unknown | null
};

// Inicializa batch system
export function initBatch(config: { enabled?: boolean; batchSize?: number; flushIntervalMs?: number } = {}) {
  _config.enabled = config.enabled !== false;
  _config.batchSize = Math.min(config.batchSize || DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE);
  _config.flushIntervalMs = config.flushIntervalMs || DEFAULT_FLUSH_INTERVAL_MS;
  
  if (_config.enabled) {
    startFlushTimer();
  }
  
  return { ok: true, config: getBatchConfig() };
}

// Adiciona log ao batch
export function addToBatch(entry: Record<string, unknown>, destination = 'default') {
  if (!_config.enabled) {
    return { ok: false, reason: 'batch-disabled' };
  }
  
  _batch.push({ entry, destination, queuedAt: Date.now() });
  _stats.logsQueued++;
  
  // Flush se atingiu tamanho máximo
  if (_batch.length >= _config.batchSize) {
    flushBatch();
  }
  
  return { ok: true, queueSize: _batch.length };
}

// Flush manual do batch
export function flushBatch() {
  if (_batch.length === 0) {
    return { ok: true, flushed: 0 };
  }
  
  const toFlush = [..._batch];
  _batch = [];
  _stats.batchesFlushed++;
  _stats.lastFlushAt = Date.now();
  
  // Agrupa por destination
  const byDestination = {};
  toFlush.forEach(item => {
    // @ts-expect-error TS migration - TS7053
    if (!byDestination[item.destination]) {
      // @ts-expect-error TS migration - TS7053
      byDestination[item.destination] = [];
    }
    // @ts-expect-error TS migration - TS7053
    byDestination[item.destination].push(item.entry);
  });
  
  // Executa callbacks de flush
  let flushed = 0;
  let errors = 0;
  
  for (var dest in byDestination) {
    // @ts-expect-error strict migration — TS7053
    var entries = byDestination[dest];
    try {
      // Notifica listeners
      // @ts-expect-error strict migration — TS2345
      _config.destinations.forEach(function(callback: (entries: unknown[], dest: string) => void) {
        try {
          callback(entries, dest);
        } catch (e) {
          errors++;
        }
      });
      flushed += entries.length;
    } catch (e) {
      errors++;
      _stats.flushErrors++;
    }
  }
  
  _stats.logsFlushed += flushed;
  
  return { ok: errors === 0, flushed: flushed, errors: errors };
}

// Timer de flush automático
function startFlushTimer() {
  if (_flushTimer) clearInterval(_flushTimer as ReturnType<typeof setInterval>);
  
  _flushTimer = setInterval(function() {
    if (_batch.length > 0) {
      flushBatch();
    }
  }, _config.flushIntervalMs);
}

function stopFlushTimer() {
  if (_flushTimer) {
    clearInterval(_flushTimer as ReturnType<typeof setInterval>);
    _flushTimer = null;
  }
}

// Registra callback para flush
export function onFlush(callback: (...args: unknown[]) => void) {
  if (typeof callback === 'function') {
    _config.destinations.push(callback);
  }
}

// Remove callback
export function offFlush(callback: (...args: unknown[]) => void) {
  _config.destinations = _config.destinations.filter(function(cb) {
    return cb !== callback;
  });
}

// Enable/disable
export function setBatchEnabled(enabled: boolean) {
  _config.enabled = enabled;
  if (enabled) {
    startFlushTimer();
  } else {
    stopFlushTimer();
    flushBatch(); // Flush pendentes
  }
}

export function isBatchEnabled() {
  return _config.enabled;
}

export function getBatchConfig() {
  return {
    enabled: _config.enabled,
    batchSize: _config.batchSize,
    flushIntervalMs: _config.flushIntervalMs,
    destinationCount: _config.destinations.length
  };
}

export function getBatchStats() {
  return {
    ..._stats,
    currentQueueSize: _batch.length,
    config: getBatchConfig()
  };
}

export function resetBatchStats() {
  _stats = {
    batchesCreated: 0,
    batchesFlushed: 0,
    logsQueued: 0,
    logsFlushed: 0,
    flushErrors: 0,
    lastFlushAt: null
  };
}

// Cleanup
export function shutdownBatch() {
  stopFlushTimer();
  var result = flushBatch();
  _config.destinations = [];
  return result;
}

export function healthCheck() {
  var queueUtilization = Math.round((_batch.length / _config.batchSize) * 100);
  return {
    status: _config.enabled ? 'HEALTHY' : 'DISABLED',
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    queueSize: _batch.length,
    queueUtilization: queueUtilization + '%',
    stats: _stats
  };
}
