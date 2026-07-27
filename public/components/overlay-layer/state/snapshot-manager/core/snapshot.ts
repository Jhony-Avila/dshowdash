// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Snapshot Creation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SNAPSHOT_FORMAT_VERSION from ../constants.js
//   serializeOverlays from ./serializer.js
//
// PROVIDES:
//   snapshot() — exported function
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

import { SNAPSHOT_FORMAT_VERSION } from '../constants.js';
import {
  getStore,
  getMaxSnapshots,
  shouldIncludeMetrics,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  setLastSnapshot,
  incrementSnapshotsCreated
} from '../state.js';
import { serializeOverlays } from './serializer.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.core.snapshot';

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

/**
 * Cria um snapshot do estado atual
 * @param {Object} options
 * @returns {Object}
 */
export function snapshot(options: DynObj) {
  options = options || {};
  const store = getStore();
  
  if (!store) {
    return { ok: false, error: 'store-not-injected', snapshot: null as DynObj };
  }
  
  const stack = store.getStack ? store.getStack() : [];
  const overlays = store.getOverlays ? store.getOverlays() : {};
  const now = Date.now();
  
  const serializedOverlays = serializeOverlays(stack, overlays);
  
  const snapshotData = {
    version: SNAPSHOT_FORMAT_VERSION,
    timestamp: now,
    id: `snapshot-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: options.name || null,
    description: options.description || null,
    stack: stack.slice(),
    overlays: serializedOverlays,
    metadata: {
      source: options.source || 'manual',
      overlayCount: stack.length,
      hasBlocking: stack.some((id: DynObj) => {
        const o = overlays[id];
        return (o && o.config && o.config.blocking) || (o && o.type === 'modal');
      })
    }
  };
  
  if (shouldIncludeMetrics() && store.getMetrics) {
    (snapshotData as any).storeMetrics = store.getMetrics();
  }
  
  addSnapshot({
    id: snapshotData.id,
    timestamp: now,
    name: snapshotData.name,
    overlayCount: stack.length,
    data: snapshotData
  });
  
  const snapshots = getSnapshots();
  const maxSnapshots = getMaxSnapshots();
  while (snapshots.length > maxSnapshots) {
    removeSnapshotAtIndex(0);
  }
  
  setLastSnapshot(snapshotData);
  incrementSnapshotsCreated();
  
  return {
    ok: true,
    snapshot: snapshotData,
    id: snapshotData.id
  };
}

export default {
  snapshot
};
