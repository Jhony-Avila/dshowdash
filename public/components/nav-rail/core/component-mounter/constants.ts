// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail/core/component-mounter
// PURPOSE: NavRail Component Mounter - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MOUNTER_EVENTS — exported value
//   loadedModules — exported value
//   mountedInstances — exported value
//   componentState — exported value
//   metrics — exported value
//   resetState() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.1.0-ES6';
export const MODULE_ID = 'navrail/core/component-mounter';

export const MOUNTER_EVENTS = {
    COMPONENTS_MOUNTED: 'navrail:components:mounted',
    COMPONENT_ERROR: 'navrail:component:error',
    COMPONENT_RETRY: 'navrail:component:retry',
    LAZY_LOAD_START: 'navrail:lazy:start',
    LAZY_LOAD_COMPLETE: 'navrail:lazy:complete'
};

// State containers (shared across modules)
export const loadedModules = new Map();
export const mountedInstances = new Map();

export const componentState = {
    mounted: new Set(),
    failed: new Map(),
    pending: new Set(),
    loading: new Set()
};

export const metrics = {
    totalMounts: 0,
    totalFails: 0,
    totalRetries: 0,
    lazyLoaded: 0,
    eagerLoaded: 0
};

export function resetState() {
    loadedModules.clear();
    mountedInstances.clear();
    componentState.mounted.clear();
    componentState.failed.clear();
    componentState.pending.clear();
    componentState.loading.clear();
}

export default {
    VERSION,
    MODULE_ID,
    MOUNTER_EVENTS,
    loadedModules,
    mountedInstances,
    componentState,
    metrics,
    resetState
};
