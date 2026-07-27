// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel-pending-queue
// PURPOSE: Pending Queue - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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
export const MODULE_ID = 'overlay-kernel-pending-queue';

export const DEFAULT_CONFIG = {
  enabled: true,
  maxSize: 20,
  maxAge: 60000,
  autoProcess: true,
  processInterval: 5000,
  processOnModeChange: true,
  retryLimit: 3
};
