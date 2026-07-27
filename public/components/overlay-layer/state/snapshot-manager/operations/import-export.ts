// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Import/Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   exportSnapshot() — exported function
//   importSnapshot() — exported function
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

  getLastSnapshot,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  getMaxSnapshots
} from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.operations.import-export';

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Exporta snapshot como JSON string
 * @param {Object} snapshotData
 * @returns {Object}
 */
export function exportSnapshot(snapshotData: DynObj) {
  if (!snapshotData) {
    snapshotData = getLastSnapshot();
  }
  
  if (!snapshotData) {
    return { ok: false, error: 'no-snapshot', json: null };
  }
  
  try {
    const json = JSON.stringify(snapshotData, null, 2);
    return { ok: true, json, size: json.length };
  } catch (e: any) {
    return { ok: false, error: e.message, json: null as DynObj };
  }
}

// ============================================================================
// IMPORT
// ============================================================================

/**
 * Importa snapshot de JSON string
 * @param {string} json
 * @returns {Object}
 */
export function importSnapshot(json: DynObj) {
  if (!json || typeof json !== 'string') {
    return { ok: false, error: 'invalid-json', snapshot: null as DynObj };
  }
  
  try {
    const snapshotData = JSON.parse(json);
    
    if (!snapshotData.version || !snapshotData.stack || !snapshotData.overlays) {
      return { ok: false, error: 'invalid-snapshot-structure', snapshot: null };
    }
    
    addSnapshot({
      id: snapshotData.id,
      timestamp: snapshotData.timestamp,
      name: snapshotData.name || 'imported',
      overlayCount: snapshotData.stack.length,
      data: snapshotData,
      imported: true
    });
    
    const snapshots = getSnapshots();
    const maxSnapshots = getMaxSnapshots();
    while (snapshots.length > maxSnapshots) {
      removeSnapshotAtIndex(0);
    }
    
    return { ok: true, snapshot: snapshotData, id: snapshotData.id };
  } catch (e: any) {
    return { ok: false, error: `parse-error: ${e.message}`, snapshot: null };
  }
}

export default {
  exportSnapshot,
  importSnapshot
};
