// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   isInitialized() — exported function
//   setInitialized() — exported function
//   getRuntimeContext() — exported function
//   setRuntimeContext() — exported function
//   getApplicationKernel() — exported function
//   setApplicationKernel() — exported function
//   getEventBus() — exported function
//   setEventBus() — exported function
//   getPermissionsGuard() — exported function
//   setPermissionsGuard() — exported function
//   getHealthAggregator() — exported function
//   setHealthAggregator() — exported function
//   getCurrentMode() — exported function
//   setCurrentMode() — exported function
//   getLastModeChange() — exported function
//   setLastModeChange() — exported function
//   getSubscriptions() — exported function
//   addSubscription() — exported function
//   clearSubscriptions() — exported function
//   getMetrics() — exported function
//   incrementMetric() — exported function
//   resetState() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.runtime-integration.state';

// ============================================================================
// STATE STORE
// ============================================================================

const state = {
  initialized: false,
  runtimeContext: null as DynObj,
  applicationKernel: null as DynObj,
  eventBus: null as DynObj,
  permissionsGuard: null as DynObj,
  healthAggregator: null as DynObj,
  currentMode: 'INITIALIZING',
  lastModeChange: null as DynObj,
  subscriptions: [] as DynObj,
  metrics: {
    modeChanges: 0,
    healthReports: 0,
    degradationEvents: 0
  }
};

// ============================================================================
// ACCESSORS
// ============================================================================

export function isInitialized() {
  return state.initialized;
}

export function setInitialized(val: DynObj) {
  state.initialized = !!val;
}

export function getRuntimeContext() {
  return state.runtimeContext;
}

export function setRuntimeContext(ctx: DynObj) {
  state.runtimeContext = ctx;
}

export function getApplicationKernel() {
  return state.applicationKernel;
}

export function setApplicationKernel(kernel: DynObj) {
  state.applicationKernel = kernel;
}

export function getEventBus() {
  return state.eventBus;
}

export function setEventBus(bus: DynObj) {
  state.eventBus = bus;
}

export function getPermissionsGuard() {
  return state.permissionsGuard;
}

export function setPermissionsGuard(guard: DynObj) {
  state.permissionsGuard = guard;
}

export function getHealthAggregator() {
  return state.healthAggregator;
}

export function setHealthAggregator(aggregator: DynObj) {
  state.healthAggregator = aggregator;
}

export function getCurrentMode() {
  return state.currentMode;
}

export function setCurrentMode(mode: DynObj) {
  state.currentMode = mode;
}

export function getLastModeChange() {
  return state.lastModeChange;
}

export function setLastModeChange(ts: DynObj) {
  state.lastModeChange = ts;
}

export function getSubscriptions() {
  return state.subscriptions;
}

export function addSubscription(unsub: DynObj) {
  state.subscriptions.push(unsub);
}

export function clearSubscriptions() {
  state.subscriptions = [];
}

// ============================================================================
// METRICS
// ============================================================================

export function getMetrics() {
  return Object.assign({}, state.metrics);
}

export function incrementMetric(name: string) {
  if ((state.metrics as DynObj)[name] !== undefined) {
    (state.metrics as DynObj)[name]++;
  }
}

// ============================================================================
// RESET
// ============================================================================

export function resetState() {
  state.initialized = false;
  state.runtimeContext = null;
  state.applicationKernel = null;
  state.eventBus = null;
  state.permissionsGuard = null;
  state.healthAggregator = null;
  state.currentMode = 'INITIALIZING';
  state.lastModeChange = null;
  state.subscriptions = [];
}

export default state;
