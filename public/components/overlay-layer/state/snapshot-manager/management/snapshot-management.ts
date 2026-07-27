// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   removeSnapshot() — exported function
//   clearSnapshots() — exported function
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

import {

  getSnapshots,
  removeSnapshotAtIndex,
  clearAllSnapshots,
  getLastSnapshot,
  setLastSnapshot
} from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.management.snapshot-management';

// ============================================================================
// MANAGEMENT
// ============================================================================

/**
 * Remove snapshot por ID
 * @param {string} id
 * @returns {Object}
 */
export function removeSnapshot(id: DynObj) {
  const snapshots = getSnapshots();
  let index = -1;
  
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].id === id) {
      index = i;
      break;
    }
  }
  
  if (index === -1) {
    return { ok: false, error: 'snapshot-not-found' };
  }
  
  removeSnapshotAtIndex(index);
  
  const lastSnapshot = getLastSnapshot();
  if (lastSnapshot && lastSnapshot.id === id) {
    setLastSnapshot(null);
  }
  
  return { ok: true, removed: id };
}

/**
 * Limpa todos os snapshots
 * @returns {Object}
 */
export function clearSnapshots() {
  const count = clearAllSnapshots();
  setLastSnapshot(null);
  return { ok: true, cleared: count };
}

export default {
  removeSnapshot,
  clearSnapshots
};
