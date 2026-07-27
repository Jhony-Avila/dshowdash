// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-idle-scheduler
// PURPOSE: Container-Main Idle Scheduler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   schedule() — exported function
//   cancel() — exported function
//   cancelAll() — exported function
//   getStatus() — exported function
//   getQueueLength() — exported function
//   runWhenIdle() — exported function
//   batchSchedule() — exported function
//   defer() — exported function
//   urgent() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-idle-scheduler';

// Polyfill for browsers without requestIdleCallback
const _requestIdleCallback = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : (cb: (...args: unknown[]) => void) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

const _cancelIdleCallback = typeof cancelIdleCallback !== 'undefined'
  ? cancelIdleCallback
  : clearTimeout;

const _queue: Record<string, unknown>[] = [];
const _pendingIds = new Map();
let _isProcessing = false;
let _nextId = 0;

// Schedule a task to run when browser is idle
export function schedule(task: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { priority = 'normal', timeout = 0, onComplete, onError } = options;
  const id = ++_nextId;
  
  const entry = { id, task, priority, timeout, onComplete, onError, status: 'pending' };
  
  // Insert based on priority
  if (priority === 'high') {
    const insertIndex = _queue.findIndex(e => e.priority !== 'high');
    if (insertIndex === -1) _queue.push(entry);
    else _queue.splice(insertIndex, 0, entry);
  } else if (priority === 'low') {
    _queue.push(entry);
  } else {
    const insertIndex = _queue.findIndex(e => e.priority === 'low');
    if (insertIndex === -1) _queue.push(entry);
    else _queue.splice(insertIndex, 0, entry);
  }
  
  _pendingIds.set(id, entry);
  _processQueue();
  
  return id;
}

function _processQueue() {
  if (_isProcessing || _queue.length === 0) return;
  _isProcessing = true;
  
  const idleId = _requestIdleCallback((deadline) => {
    // @ts-expect-error strict migration — TS18046
    while (_queue.length > 0 && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
      const entry = _queue.shift();
      if (!entry || entry.status === 'cancelled') continue;
      
      entry.status = 'running';
      try {
        const result = (entry.task as (...args: unknown[]) => unknown)();
        entry.status = 'completed';
        // @ts-expect-error TS migration - TS2349
        entry.onComplete?.(result);
      } catch (error) {
        entry.status = 'error';
        // @ts-expect-error TS migration - TS2349
        entry.onError?.(error);
      }
      _pendingIds.delete(entry.id);
    }
    
    _isProcessing = false;
    if (_queue.length > 0) _processQueue();
  // @ts-expect-error TS migration - TS2322
  }, { timeout: _queue[0]?.timeout || 0 });
  
  return idleId;
}

// Cancel a scheduled task
export function cancel(id: string) {
  const entry = _pendingIds.get(id);
  if (entry && entry.status === 'pending') {
    entry.status = 'cancelled';
    _pendingIds.delete(id);
    const index = _queue.findIndex(e => e.id === id);
    if (index !== -1) _queue.splice(index, 1);
    return true;
  }
  return false;
}

// Cancel all pending tasks
export function cancelAll() {
  const count = _queue.length;
  _queue.forEach(entry => { entry.status = 'cancelled'; });
  _queue.length = 0;
  _pendingIds.clear();
  return count;
}

// Get status of a task
export function getStatus(id: string) {
  const entry = _pendingIds.get(id);
  return entry?.status || 'unknown';
}

// Get queue length
export function getQueueLength() {
  return _queue.length;
}

// Run task immediately if idle, otherwise schedule
export function runWhenIdle(task: Record<string, unknown>, fallbackMs = 100) {
  return new Promise((resolve, reject) => {
    const id = schedule(task, {
      timeout: fallbackMs,
      onComplete: resolve,
      onError: reject
    });
  });
}

// Batch multiple tasks to run during idle
export function batchSchedule(tasks: unknown[], options: Record<string, unknown> = {}) {
  const { priority = 'normal', timeout = 0 } = options;
  const ids = [];
  const results: unknown[] = [];
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasError = false;
    
    // @ts-expect-error strict migration — TS2345
    tasks.forEach((task: Record<string, unknown>, index: number) => {
      const id = schedule(task, {
        priority,
        timeout,
        onComplete: (result: Record<string, unknown>) => {
          results[index] = { status: 'fulfilled', value: result };
          completed++;
          if (completed === tasks.length) resolve(results);
        },
        onError: (error: Record<string, unknown>) => {
          results[index] = { status: 'rejected', reason: error };
          completed++;
          if (completed === tasks.length) resolve(results);
        }
      });
      ids.push(id);
    });
  });
}

// Defer execution until next idle period
export function defer(fn: (...args: unknown[]) => void) {
  // @ts-expect-error TS migration - TS2345
  return schedule(fn, { priority: 'low' });
}

// Schedule with high priority
export function urgent(fn: (...args: unknown[]) => void, timeoutMs = 100) {
  // @ts-expect-error TS migration - TS2345
  return schedule(fn, { priority: 'high', timeout: timeoutMs });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, queueLength: _queue.length, isProcessing: _isProcessing, hasNativeSupport: typeof requestIdleCallback !== 'undefined' };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, queueLength: _queue.length, isProcessing: _isProcessing, hasNativeSupport: typeof requestIdleCallback !== 'undefined' };
}

export default {
  schedule, cancel, cancelAll, getStatus, getQueueLength,
  runWhenIdle, batchSchedule, defer, urgent,
  info, healthCheck, VERSION, MODULE_ID
};
