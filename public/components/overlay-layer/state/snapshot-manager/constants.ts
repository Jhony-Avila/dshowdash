// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-snapshot-manager
// PURPOSE: Snapshot Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SNAPSHOT_FORMAT_VERSION — exported value
//   DEFAULT_CONFIG — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-snapshot-manager';
export const SNAPSHOT_FORMAT_VERSION = '1.0.0';

export const DEFAULT_CONFIG = Object.freeze({
  maxSnapshots: 10,
  includeMetrics: true,
  includeTimestamps: true,
  compressData: false
});

export default {
  VERSION,
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION,
  DEFAULT_CONFIG
};
