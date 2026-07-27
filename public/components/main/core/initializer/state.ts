// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Initializer - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getMetrics() — exported function
//   incrementInitializations() — exported function
//   incrementBootstraps() — exported function
//   incrementErrors() — exported function
//   incrementPanelHomeLoads() — exported function
//   incrementPanelHomeErrors() — exported function
//   updateInitTime() — exported function
//   getInitializationsCount() — exported function
//   getErrorsCount() — exported function
//   getPanelHomeInstance() — exported function
//   setPanelHomeInstance() — exported function
//   clearPanelHomeInstance() — exported function
//   isPanelHomeMounted() — exported function
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

export const VERSION = '5.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer.state';

// ============================================================================
// METRICS
// ============================================================================

const _metrics = {
  initializations: 0,
  bootstraps: 0,
  errors: 0,
  lastInitTime: 0,
  avgInitTime: 0,
  totalInitTime: 0,
  panelHomeLoads: 0,
  panelHomeErrors: 0
};

// Panel Home instance reference
interface PanelHomeInstance { unmount?(): void; [key: string]: unknown; }
let _panelHomeInstance: PanelHomeInstance | null = null;

// ============================================================================
// METRICS ACCESSORS
// ============================================================================

export function getMetrics() {
  return {
    initializations: _metrics.initializations,
    bootstraps: _metrics.bootstraps,
    errors: _metrics.errors,
    lastInitTime: _metrics.lastInitTime,
    avgInitTime: _metrics.avgInitTime,
    totalInitTime: _metrics.totalInitTime,
    panelHomeLoads: _metrics.panelHomeLoads,
    panelHomeErrors: _metrics.panelHomeErrors
  };
}

export function incrementInitializations() {
  _metrics.initializations++;
}

export function incrementBootstraps() {
  _metrics.bootstraps++;
}

export function incrementErrors() {
  _metrics.errors++;
}

export function incrementPanelHomeLoads() {
  _metrics.panelHomeLoads++;
}

export function incrementPanelHomeErrors() {
  _metrics.panelHomeErrors++;
}

export function updateInitTime(initTime: number) {
  _metrics.lastInitTime = initTime;
  _metrics.totalInitTime += initTime;
  _metrics.avgInitTime = Math.round(_metrics.totalInitTime / _metrics.initializations);
}

export function getInitializationsCount() {
  return _metrics.initializations;
}

export function getErrorsCount() {
  return _metrics.errors;
}

// ============================================================================
// PANEL HOME INSTANCE
// ============================================================================

export function getPanelHomeInstance() {
  return _panelHomeInstance;
}

export function setPanelHomeInstance(instance: PanelHomeInstance) {
  _panelHomeInstance = instance;
}

export function clearPanelHomeInstance() {
  _panelHomeInstance = null;
}

export function isPanelHomeMounted() {
  return _panelHomeInstance !== null;
}

export default {
  getMetrics,
  incrementInitializations,
  incrementBootstraps,
  incrementErrors,
  incrementPanelHomeLoads,
  incrementPanelHomeErrors,
  updateInitTime,
  getInitializationsCount,
  getErrorsCount,
  getPanelHomeInstance,
  setPanelHomeInstance,
  clearPanelHomeInstance,
  isPanelHomeMounted
};
