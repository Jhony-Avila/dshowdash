// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-manager
// PURPOSE: Sidebar Metrics Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createMetricsManager() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.metrics.metrics-manager';

export function createMetricsManager() {
  const _metrics = {
    inits: 0,
    toggles: 0,
    navigations: 0,
    errors: 0,
    externalCollapses: 0,
    modelLoaderCalls: 0,
    safeModeBoots: 0
  };

  return {
    increment(key: string) {
      if (_metrics.hasOwnProperty(key)) {
        (_metrics as DynObj)[key]++;
      }
    },

    get(key: string) {
      return (_metrics as DynObj)[key];
    },

    getAll() {
      return Object.assign({}, _metrics);
    },

    set(key: string, value: string) {
      if (_metrics.hasOwnProperty(key)) {
        (_metrics as DynObj)[key] = value;
      }
    },

    reset() {
      _metrics.inits = 0;
      _metrics.toggles = 0;
      _metrics.navigations = 0;
      _metrics.errors = 0;
      _metrics.externalCollapses = 0;
      _metrics.modelLoaderCalls = 0;
      _metrics.safeModeBoots = 0;
    },

    incrementInits() { _metrics.inits++; },
    incrementToggles() { _metrics.toggles++; },
    incrementNavigations() { _metrics.navigations++; },
    incrementErrors() { _metrics.errors++; },
    incrementExternalCollapses() { _metrics.externalCollapses++; },
    incrementModelLoaderCalls() { _metrics.modelLoaderCalls++; },
    incrementSafeModeBoots() { _metrics.safeModeBoots++; }
  };
}

export default { createMetricsManager };
