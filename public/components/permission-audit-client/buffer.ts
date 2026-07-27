// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.permission-audit-client.buffer
// PURPOSE: PermissionAuditClient Buffer - Batch buffer for audit entries
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract GET_BUFFER - getBuffer() returns current buffer
// @contract CLEAR_BUFFER - clearBuffer() clears buffer
// @contract GET_BUFFER_SIZE - getBufferSize() returns buffer size
// @contract ADD_TO_BUFFER - addToBuffer() adds entry to buffer
// @contract START_FLUSH_TIMER - startFlushTimer() starts auto-flush
// @contract STOP_FLUSH_TIMER - stopFlushTimer() stops auto-flush
// @contract IS_FLUSH_TIMER_ACTIVE - isFlushTimerActive() checks timer
// @contract FLUSH_BEFORE_UNLOAD - flushBeforeUnload() sends via beacon
// @contract EXTRACT_BATCH - extractBatch() extracts and clears buffer
// @contract RESTORE_BATCH - restoreBatch() restores failed batch
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ./config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getBuffer() — exported function
//   clearBuffer() — exported function
//   getBufferSize() — exported function
//   addToBuffer() — exported function
//   startFlushTimer() — exported function
//   stopFlushTimer() — exported function
//   isFlushTimerActive() — exported function
//   flushBeforeUnload() — exported function
//   extractBatch() — exported function
//   restoreBatch() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: navigator.sendBeacon
// ───────────────────────────────────────────────────────────────
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-ENTERPRISE: Previous enterprise version
// @changelog v2.0.0-MODULAR-ES6: Original modular ES6 version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from './config.js';

export const MODULE_ID = 'components-permission-audit-client-buffer';
export const VERSION = '1.2.0-P2-ENTERPRISE';

let _buffer: Record<string, unknown>[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;

export function getBuffer(): Record<string, unknown>[] { return _buffer; }
export function clearBuffer(): void { _buffer = []; }
export function getBufferSize(): number { return _buffer.length; }

export function addToBuffer(entry: Record<string, unknown>, metrics: Record<string, number>, flushFn: () => void): void {
  _buffer.push(entry);
  metrics.batchCount++;
  if (entry.action === 'allowed') metrics.allowedCount++;
  if (entry.action === 'denied') metrics.deniedCount++;
  if (_buffer.length >= CONFIG.batchSize) flushFn();
}

export function startFlushTimer(flushFn: () => void): void {
  if (_flushTimer) return;
  _flushTimer = setInterval(() => { if (_buffer.length > 0) flushFn(); }, CONFIG.flushInterval);
}

export function stopFlushTimer(): void { if (_flushTimer) { clearInterval(_flushTimer); _flushTimer = null; } }
export function isFlushTimerActive(): boolean { return _flushTimer !== null; }

export function flushBeforeUnload(): void {
  if (_buffer.length > 0) navigator.sendBeacon((CONFIG as any).endpoints.batch, JSON.stringify({ entries: _buffer }));
}

export function extractBatch(): Record<string, unknown>[] { const batch = _buffer.slice(); _buffer = []; return batch; }
export function restoreBatch(batch: Record<string, unknown>[]): void { _buffer = batch.concat(_buffer); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, bufferSize: getBufferSize(), timerActive: isFlushTimerActive() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, bufferSize: getBufferSize(), timerActive: isFlushTimerActive() } }; }

export default { getBuffer, clearBuffer, getBufferSize, addToBuffer, startFlushTimer, stopFlushTimer, isFlushTimerActive, flushBeforeUnload, extractBatch, restoreBatch, info, healthCheck, MODULE_ID, VERSION };
