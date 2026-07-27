// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Expiration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   queue, state, setQueue from ./state.js
//   emit from ./events.js
//
// PROVIDES:
//   cleanExpired() — exported function
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

import { queue, state, setQueue } from './state.js';
import { emit } from './events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.expiration';

export function cleanExpired() {
  const now = Date.now();
  const expired: DynObj[] = [];
  
  const newQueue = queue.filter(item => {
    if (item.expiresAt <= now) {
      expired.push(item);
      state.totalExpired++;
      return false;
    }
    return true;
  });
  
  setQueue(newQueue);
  
  if (expired.length > 0) {
    emit('overlay:queue-expired', {
      count: expired.length,
      items: expired.map(e => ({ queueId: e.queueId, type: e.descriptor.type }))
    });
  }
  
  return { ok: true, expired: expired.length };
}
