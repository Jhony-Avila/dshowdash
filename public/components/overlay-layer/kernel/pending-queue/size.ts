// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Size
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, queue from ./state.js
//
// PROVIDES:
//   size() — exported function
//   isEmpty() — exported function
//   isFull() — exported function
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

import { config, queue } from './state.js';

export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.size';

export function size() {
  return queue.length;
}

export function isEmpty() {
  return queue.length === 0;
}

export function isFull() {
  return queue.length >= config.maxSize;
}
