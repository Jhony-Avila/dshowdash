// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ABORT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-controller-queue
// PURPOSE: NavigationController - Queue Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   queueNavigation() — exported function
//   processQueue() — exported function
//   clearQueue() — exported function
//   getQueueSize() — exported function
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

export const MODULE_ID = 'navigation-controller-queue';
export const VERSION = '8.1.0-ABORT-FIX';

export function queueNavigation(state: Record<string, unknown>, telemetry: Record<string, unknown>, route: string, options: Record<string, unknown>) {
  (state.metrics as Record<string, number>).navigationsQueued++;

  return new Promise((resolve, reject) => {
    (state.navigationQueue as unknown[]).push({
      route,
      options,
      resolve,
      reject
    });
    
    if (telemetry && telemetry.track) {
      (telemetry as Record<string, (...args: unknown[]) => unknown>).track('navigation:queued', {
        route,
        queueSize: (state.navigationQueue as unknown[]).length
      });
    }
  });
}

export function processQueue(state: Record<string, unknown>, navigateFn: (...args: unknown[]) => Promise<unknown>) {
  const queue = state.navigationQueue as Array<Record<string, unknown>>;
  if (queue.length === 0) return;

  const next = queue.shift() as Record<string, unknown>;

  navigateFn(next.route, next.options).then((result: unknown) => {
    (next.resolve as (v: unknown) => void)(result);
  }).catch((err: Error) => {
    (next.reject as (r: Error) => void)(err);
  });
}

export function clearQueue(state: Record<string, unknown>) {
  const queue = state.navigationQueue as Array<{ route: string; options: Record<string, unknown>; resolve: (value: unknown) => void; reject: (reason: Error) => void }>;
  const cleared = queue.length;

  for (let i = 0; i < queue.length; i++) {
    queue[i].reject(new Error('Navigation queue cleared'));
  }

  state.navigationQueue = [];
  return cleared;
}

export function getQueueSize(state: Record<string, unknown>) {
  return (state.navigationQueue as unknown[]).length;
}

export default {
  queueNavigation,
  processQueue,
  clearQueue,
  getQueueSize
};
