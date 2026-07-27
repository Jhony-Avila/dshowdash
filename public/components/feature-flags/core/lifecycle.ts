// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-FORMAL-STATES)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.core.lifecycle
// PURPOSE: Feature flags lifecycle management (init, shutdown, reset)
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes lifecycle
// @contract MOUNT - mount() mounts the module
// @contract UNMOUNT - unmount() unmounts the module
// @contract SET_READY - setReady(val) sets ready state
// @contract IS_INITIALIZED - isInitialized() returns init status
// @contract IS_MOUNTED - isMounted() returns mount status
// @contract IS_READY - isReady() returns ready status
// @contract IS_SHUTTING_DOWN - isShuttingDown() returns shutdown status
// @contract GET_STATE - getState() returns internal state
// @contract GET_STATUS - getStatus() returns formatted status
// @contract SHUTDOWN - shutdown() shuts down lifecycle
// @contract RESET - reset() resets lifecycle to initial state
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: FeatureFlagsLifecycle, init, mount, unmount, setReady,
//           isInitialized, isMounted, isReady, isShuttingDown,
//           getState, getStatus, shutdown, reset, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.3.0-FORMAL-STATES: Estados formais (FEATURE_FLAGS_STATES), setDegraded(), check notDegraded
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-ENTERPRISE: Added shutdown, reset, getStatus (NR-FULL P0)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.3.0-FORMAL-STATES';
export const MODULE_ID = 'components.feature-flags.core.lifecycle';

// v2.3.0: Estados formais exportáveis como constantes
export const FEATURE_FLAGS_STATES = {
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  DEGRADED: 'DEGRADED',
  SHUTTING_DOWN: 'SHUTTING_DOWN'
};

const _state: {
  initialized: boolean;
  mounted: boolean;
  ready: boolean;
  degraded: boolean;
  shuttingDown: boolean;
  lastInitAt: number | null;
  lastShutdownAt: number | null;
  lastResetAt: number | null;
} = {
  initialized: false,
  mounted: false,
  ready: false,
  degraded: false,
  shuttingDown: false,
  lastInitAt: null,
  lastShutdownAt: null,
  lastResetAt: null
};

function _getPhase() {
  if (_state.shuttingDown) return FEATURE_FLAGS_STATES.SHUTTING_DOWN;
  if (_state.degraded) return FEATURE_FLAGS_STATES.DEGRADED;
  if (_state.ready) return FEATURE_FLAGS_STATES.READY;
  if (_state.initialized) return FEATURE_FLAGS_STATES.INITIALIZING;
  return FEATURE_FLAGS_STATES.NOT_INITIALIZED;
}

export function init(options: Record<string, unknown> = {}): Promise<boolean> {
  _state.initialized = true;
  _state.shuttingDown = false;
  _state.lastInitAt = Date.now();
  return Promise.resolve(true);
}

export function mount() {
  _state.mounted = true;
  return true;
}

export function unmount() {
  _state.mounted = false;
  return true;
}

export function setReady(val: boolean): void {
  _state.ready = val;
}

export function isInitialized() {
  return _state.initialized;
}

export function isMounted() {
  return _state.mounted;
}

export function isReady() {
  return _state.ready;
}

export function isShuttingDown() {
  return _state.shuttingDown;
}

// v2.3.0: Marca como degradado (erro em fetch, store, etc.)
export function setDegraded(val: boolean): void {
  _state.degraded = val;
}

export function getState() {
  return { ..._state };
}

export function getStatus() {
  return {
    phase: _getPhase(),
    initialized: _state.initialized,
    mounted: _state.mounted,
    ready: _state.ready,
    shuttingDown: _state.shuttingDown,
    lastInitAt: _state.lastInitAt,
    lastShutdownAt: _state.lastShutdownAt,
    lastResetAt: _state.lastResetAt,
    uptime: _state.lastInitAt ? Date.now() - _state.lastInitAt : 0
  };
}

export function shutdown() {
  _state.shuttingDown = true;
  _state.ready = false;
  _state.mounted = false;
  _state.lastShutdownAt = Date.now();
  return Promise.resolve(true);
}

export function reset() {
  _state.initialized = false;
  _state.mounted = false;
  _state.ready = false;
  _state.degraded = false;
  _state.shuttingDown = false;
  _state.lastResetAt = Date.now();
  return Promise.resolve(true);
}

export function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    notShuttingDown: !_state.shuttingDown,
    notDegraded: !_state.degraded,
    stateConsistent: !(_state.ready && !_state.initialized)
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    phase: _getPhase(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: getState(),
    status: getStatus(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

const FeatureFlagsLifecycle = {
  init,
  mount,
  unmount,
  setReady,
  setDegraded,
  isInitialized,
  isMounted,
  isReady,
  isShuttingDown,
  getState,
  getStatus,
  shutdown,
  reset,
  healthCheck,
  info,
  STATES: FEATURE_FLAGS_STATES,
  VERSION,
  MODULE_ID
};

export { FeatureFlagsLifecycle };
export default FeatureFlagsLifecycle;
