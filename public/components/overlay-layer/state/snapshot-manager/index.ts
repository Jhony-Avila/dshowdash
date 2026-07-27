// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer - Snapshot Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION from ./constants.js
//   inject from ./state.js
//   snapshot from ./core/snapshot.js
//   restore from ./core/restore.js
//   compare from ./operations/compare.js
//   exportSnapshot, importSnapshot from ./operations/import-export.js
//   getSnapshotById, getLastSnapshot, listSnapshots from ./queries/snapshot-queries.js
//   removeSnapshot, clearSnapshots from ./management/snapshot-management.js
//   configure, getConfig, getMetrics, healthCheck, info from ./diagnostics/health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SNAPSHOT_FORMAT_VERSION — exported value
//   inject — exported value
//   snapshot — exported value
//   restore — exported value
//   compare — exported value
//   exportSnapshot — exported value
//   importSnapshot — exported value
//   getSnapshotById — exported value
//   getLastSnapshot — exported value
//   listSnapshots — exported value
//   removeSnapshot — exported value
//   clearSnapshots — exported value
//   configure — exported value
//   getConfig — exported value
//   getMetrics — exported value
//   healthCheck — exported value
//   info — exported value
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

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION } from './constants.js';
import { inject } from './state.js';
import { snapshot } from './core/snapshot.js';
import { restore } from './core/restore.js';
import { compare } from './operations/compare.js';
import { exportSnapshot, importSnapshot } from './operations/import-export.js';
import { getSnapshotById, getLastSnapshot, listSnapshots } from './queries/snapshot-queries.js';
import { removeSnapshot, clearSnapshots } from './management/snapshot-management.js';
import { configure, getConfig, getMetrics, healthCheck, info } from './diagnostics/health.js';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION };

// Injection
export { inject };

// Core
export { snapshot, restore };

// Operations
export { compare, exportSnapshot, importSnapshot };

// Queries
export { getSnapshotById, getLastSnapshot, listSnapshots };

// Management
export { removeSnapshot, clearSnapshots };

// Diagnostics
export { configure, getConfig, getMetrics, healthCheck, info };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  inject,
  snapshot,
  restore,
  compare,
  exportSnapshot,
  importSnapshot,
  getSnapshotById,
  getLastSnapshot,
  listSnapshots,
  removeSnapshot,
  clearSnapshots,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION
};
