// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   config — exported value
//   queue — exported value
//   state — exported value
//   refs — exported value
//   setQueue() — exported function
//   getQueue() — exported function
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

import { DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.state';

export const config = { ...DEFAULT_CONFIG };
export let queue: DynObj[] = [];
export const state = {
  processIntervalId: null as DynObj,
  totalEnqueued: 0,
  totalProcessed: 0,
  totalExpired: 0,
  totalFailed: 0,
  lastProcess: null as DynObj
};

export const refs = {
  openOverlay: null as DynObj,
  canOpenOverlay: null as DynObj,
  eventBus: null as DynObj
};

export function setQueue(newQueue: DynObj) {
  queue = newQueue;
}

export function getQueue() {
  return queue;
}
