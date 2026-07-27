// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getSnapshots, getLastSnapshot as _getLastSnapshot from ../state.js
//
// PROVIDES:
//   getSnapshotById() — exported function
//   getLastSnapshot() — exported function
//   listSnapshots() — exported function
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

import { getSnapshots, getLastSnapshot as _getLastSnapshot } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.queries.snapshot-queries';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Retorna snapshot por ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getSnapshotById(id: DynObj) {
  const snapshots = getSnapshots();
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].id === id) {
      return snapshots[i].data;
    }
  }
  return null;
}

/**
 * Retorna último snapshot
 * @returns {Object|null}
 */
export function getLastSnapshot() {
  return _getLastSnapshot();
}

/**
 * Lista todos os snapshots armazenados
 * @returns {Array}
 */
export function listSnapshots() {
  const snapshots = getSnapshots();
  return snapshots.map((s: DynObj) => ({
    id: s.id,
    timestamp: s.timestamp,
    name: s.name,
    overlayCount: s.overlayCount,
    imported: s.imported || false
  }));
}

export default {
  getSnapshotById,
  getLastSnapshot,
  listSnapshots
};
