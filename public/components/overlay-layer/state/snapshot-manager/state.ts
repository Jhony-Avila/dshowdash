// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   inject() — exported function
//   getStore() — exported function
//   getOpenOverlay() — exported function
//   getCloseOverlay() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMaxSnapshots() — exported function
//   shouldIncludeMetrics() — exported function
//   getSnapshots() — exported function
//   addSnapshot() — exported function
//   removeSnapshotAtIndex() — exported function
//   clearAllSnapshots() — exported function
//   getSnapshotsCount() — exported function
//   getLastSnapshot() — exported function
//   setLastSnapshot() — exported function
//   getSnapshotsCreated() — exported function
//   incrementSnapshotsCreated() — exported function
//   getRestoresPerformed() — exported function
//   incrementRestoresPerformed() — exported function
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


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.state';

// ============================================================================
// STATE STORE
// ============================================================================

let _config = Object.assign({}, DEFAULT_CONFIG);

const _state = {
  snapshots: [] as DynObj,
  lastSnapshot: null as DynObj,
  snapshotsCreated: 0,
  restoresPerformed: 0
};

const _dependencies = {
  store: null as DynObj,
  openOverlay: null as DynObj,
  closeOverlay: null as DynObj
};

// ============================================================================
// DEPENDENCY INJECTION
// ============================================================================

export function inject(dependencies: DynObj) {
  if (dependencies.store) _dependencies.store = dependencies.store;
  if (dependencies.openOverlay) _dependencies.openOverlay = dependencies.openOverlay;
  if (dependencies.closeOverlay) _dependencies.closeOverlay = dependencies.closeOverlay;
}

export function getStore() {
  return _dependencies.store;
}

export function getOpenOverlay() {
  return _dependencies.openOverlay;
}

export function getCloseOverlay() {
  return _dependencies.closeOverlay;
}

// ============================================================================
// CONFIG ACCESSORS
// ============================================================================

export function getConfig() {
  return Object.assign({}, _config);
}

export function setConfig(newConfig: DynObj) {
  _config = Object.assign({}, _config, newConfig);
  if ((_config as any).maxSnapshots < 1) (_config as any).maxSnapshots = 1;
}

export function getMaxSnapshots() {
  return _config.maxSnapshots;
}

export function shouldIncludeMetrics() {
  return _config.includeMetrics;
}

// ============================================================================
// SNAPSHOTS ACCESSORS
// ============================================================================

export function getSnapshots() {
  return _state.snapshots;
}

export function addSnapshot(snapshot: DynObj) {
  _state.snapshots.push(snapshot);
}

export function removeSnapshotAtIndex(index: number) {
  _state.snapshots.splice(index, 1);
}

export function clearAllSnapshots() {
  const count = _state.snapshots.length;
  _state.snapshots = [];
  return count;
}

export function getSnapshotsCount() {
  return _state.snapshots.length;
}

// ============================================================================
// LAST SNAPSHOT
// ============================================================================

export function getLastSnapshot() {
  return _state.lastSnapshot;
}

export function setLastSnapshot(snapshot: DynObj) {
  _state.lastSnapshot = snapshot;
}

// ============================================================================
// METRICS
// ============================================================================

export function getSnapshotsCreated() {
  return _state.snapshotsCreated;
}

export function incrementSnapshotsCreated() {
  _state.snapshotsCreated++;
}

export function getRestoresPerformed() {
  return _state.restoresPerformed;
}

export function incrementRestoresPerformed() {
  _state.restoresPerformed++;
}

export default {
  inject,
  getStore,
  getOpenOverlay,
  getCloseOverlay,
  getConfig,
  setConfig,
  getMaxSnapshots,
  shouldIncludeMetrics,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  clearAllSnapshots,
  getSnapshotsCount,
  getLastSnapshot,
  setLastSnapshot,
  getSnapshotsCreated,
  incrementSnapshotsCreated,
  getRestoresPerformed,
  incrementRestoresPerformed
};
