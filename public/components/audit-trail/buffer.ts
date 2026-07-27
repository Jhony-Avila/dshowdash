// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.audit-trail.buffer
// PURPOSE: Entry buffer management with flush timer for audit trail batching
// ───────────────────────────────────────────────────────────────
// @contract ADD_TO_BUFFER - addToBuffer(entry, config, flushFn) adds entry to buffer
// @contract EXTRACT_BATCH - extractBatch() extracts and clears buffer entries
// @contract GET_BUFFER_SIZE - getBufferSize() returns current buffer size
// @contract RESTORE_BATCH - restoreBatch(entries) restores entries to buffer front
// @contract START_FLUSH_TIMER - startFlushTimer(config, flushFn) starts periodic flush
// @contract STOP_FLUSH_TIMER - stopFlushTimer() stops periodic flush timer
// @contract FLUSH_BEFORE_UNLOAD - flushBeforeUnload() synchronous flush on unload
// @contract IS_FLUSH_TIMER_ACTIVE - isFlushTimerActive() returns timer status
// @contract CLEAR_BUFFER - clearBuffer() clears all buffer entries
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: addToBuffer, extractBatch, getBufferSize, restoreBatch,
//           startFlushTimer, stopFlushTimer, flushBeforeUnload,
//           isFlushTimerActive, clearBuffer, healthCheck, info,
//           VERSION, MODULE_ID, MAX_SIZE
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header,
//            expanded to full buffer management with flush timer
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.audit-trail.buffer';
export const MAX_SIZE = 1000;

let _buffer: Record<string, unknown>[] = [];
let _flushTimerId: ReturnType<typeof setInterval> | null = null;
let _pendingFlushFn: (() => void) | null = null;

export function addToBuffer(entry: Record<string, unknown>, config: { batchSize?: number } | null, flushFn: (() => void) | null): void {
  _buffer.push({ ...entry, timestamp: Date.now() });
  _pendingFlushFn = flushFn;

  if (_buffer.length > MAX_SIZE) {
    _buffer.shift();
  }

  if (config && config.batchSize && _buffer.length >= config.batchSize && flushFn) {
    flushFn();
  }
}

export function extractBatch(): Record<string, unknown>[] {
  const entries = [..._buffer];
  _buffer = [];
  return entries;
}

export function getBufferSize(): number {
  return _buffer.length;
}

export function restoreBatch(entries: Record<string, unknown>[]): void {
  if (Array.isArray(entries)) {
    _buffer = [...entries, ..._buffer];
    if (_buffer.length > MAX_SIZE) {
      _buffer = _buffer.slice(-MAX_SIZE);
    }
  }
}

export function startFlushTimer(config: { flushInterval?: number } | null, flushFn: () => void): void {
  stopFlushTimer();
  _pendingFlushFn = flushFn;

  // @ts-expect-error strict migration — TS18048
  if (config && config.flushInterval > 0) {
    _flushTimerId = setInterval(() => {
      if (_buffer.length > 0 && flushFn) {
        flushFn();
      }
    }, config.flushInterval);
  }
}

export function stopFlushTimer(): void {
  if (_flushTimerId) {
    clearInterval(_flushTimerId);
    _flushTimerId = null;
  }
}

export function flushBeforeUnload(): void {
  if (_buffer.length > 0 && _pendingFlushFn) {
    try {
      _pendingFlushFn();
    } catch (e) {
      // Silent fail on unload
    }
  }
}

export function isFlushTimerActive(): boolean {
  return _flushTimerId !== null;
}

export function clearBuffer(): void {
  _buffer = [];
}

// Legacy aliases for backward compatibility
export const add = (entry: Record<string, unknown>): void => addToBuffer(entry, null, null);
export const get = (): Record<string, unknown>[] => [..._buffer];
export const flush = extractBatch;
export const size = getBufferSize;
export const clear = clearBuffer;

export function healthCheck() {
  const checks = {
    bufferHealthy: _buffer.length < MAX_SIZE * 0.9,
    withinLimits: _buffer.length <= MAX_SIZE,
    timerConfigured: true
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    bufferSize: _buffer.length,
    maxSize: MAX_SIZE,
    flushTimerActive: isFlushTimerActive(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    bufferSize: getBufferSize(),
    maxSize: MAX_SIZE,
    flushTimerActive: isFlushTimerActive(),
    timestamp: Date.now()
  };
}

export default {
  addToBuffer,
  extractBatch,
  getBufferSize,
  restoreBatch,
  startFlushTimer,
  stopFlushTimer,
  flushBeforeUnload,
  isFlushTimerActive,
  clearBuffer,
  add,
  get,
  flush,
  size,
  clear,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  MAX_SIZE
};
