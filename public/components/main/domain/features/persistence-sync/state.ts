// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   enabled — exported value
//   cleanups — exported value
//   syncTimeoutId — exported value
//   pendingChanges — exported value
//   metrics — exported value
//   resetCleanups() — exported function
//   addCleanup() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - State
 * @module persistence-sync/state
 */
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'main.domain.features.persistence-sync.state';

export const enabled = { value: false };
export const cleanups: Array<() => void> = [];
export const syncTimeoutId = { value: null as string | null };
export const pendingChanges = new Map();

export const metrics = {
  inits: 0,
  saves: 0,
  loads: 0,
  syncs: 0,
  errors: 0,
  validationErrors: 0,
  migrations: 0,
  navigationsTracked: 0
};

export function resetCleanups() {
  cleanups.length = 0;
}

export function addCleanup(fn: (...args: unknown[]) => unknown) {
  cleanups.push(fn);
}
