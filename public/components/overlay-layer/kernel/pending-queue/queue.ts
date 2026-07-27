// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Queue Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, queue, state, setQueue from ./state.js
//   emit from ./events.js
//   generateQueueId from ./utils.js
//
// PROVIDES:
//   enqueue() — exported function
//   dequeue() — exported function
//   peek() — exported function
//   getAll() — exported function
//   remove() — exported function
//   clear() — exported function
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

import { config, queue, state, setQueue } from './state.js';
import { emit } from './events.js';
import { generateQueueId } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.queue';

export function enqueue(descriptor: DynObj, reason: DynObj, options: { evictOldest?: boolean; maxAge?: number; retryLimit?: number; priority?: number; openOptions?: Record<string, any> } = {}) {
  if (!config.enabled) {
    return { ok: false, error: 'queue-disabled' };
  }
  
  if (queue.length >= config.maxSize) {
    if (options.evictOldest) {
      const evicted = queue.shift();
      emit('overlay:queue-evicted', { id: evicted.queueId, reason: 'max-size' });
    } else {
      return { ok: false, error: 'queue-full', maxSize: config.maxSize };
    }
  }
  
  const queueItem = {
    queueId: generateQueueId(),
    descriptor: { ...descriptor },
    reason,
    enqueuedAt: Date.now(),
    expiresAt: Date.now() + (options.maxAge || config.maxAge),
    retries: 0,
    maxRetries: options.retryLimit || config.retryLimit,
    priority: descriptor.config?.priority || options.priority || 50,
    options: options.openOptions || {}
  };
  
  let inserted = false;
  for (let i = 0; i < queue.length; i++) {
    if (queueItem.priority > queue[i].priority) {
      queue.splice(i, 0, queueItem);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    queue.push(queueItem);
  }
  
  state.totalEnqueued++;
  
  emit('overlay:queued', {
    queueId: queueItem.queueId,
    type: descriptor.type,
    reason,
    priority: queueItem.priority,
    queueSize: queue.length
  });
  
  return {
    ok: true,
    queueId: queueItem.queueId,
    position: queue.findIndex(q => q.queueId === queueItem.queueId) + 1,
    queueSize: queue.length
  };
}

export function dequeue() {
  if (queue.length === 0) {
    return null;
  }
  
  const item = queue.shift();
  
  emit('overlay:dequeued', {
    queueId: item.queueId,
    type: item.descriptor.type,
    waitTime: Date.now() - item.enqueuedAt
  });
  
  return item;
}

export function peek() {
  return queue.length > 0 ? { ...queue[0] } : null;
}

export function getAll() {
  return queue.map(item => ({
    queueId: item.queueId,
    type: item.descriptor.type,
    reason: item.reason,
    priority: item.priority,
    enqueuedAt: item.enqueuedAt,
    expiresAt: item.expiresAt,
    retries: item.retries,
    age: Date.now() - item.enqueuedAt
  }));
}

export function remove(queueId: string) {
  const index = queue.findIndex(q => q.queueId === queueId);
  if (index === -1) {
    return { ok: false, error: 'not-found' };
  }
  
  const removed = queue.splice(index, 1)[0];
  
  emit('overlay:queue-removed', {
    queueId: removed.queueId,
    type: removed.descriptor.type
  });
  
  return { ok: true, removed: removed.queueId };
}

export function clear() {
  const count = queue.length;
  setQueue([]);
  
  emit('overlay:queue-cleared', { count });
  
  return { ok: true, cleared: count };
}
