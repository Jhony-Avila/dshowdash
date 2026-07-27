const VERSION = "2.3.0-FORMAL-STATES";
const MODULE_ID = "components.feature-flags.core.lifecycle";
const FEATURE_FLAGS_STATES = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  DEGRADED: "DEGRADED",
  SHUTTING_DOWN: "SHUTTING_DOWN"
};
const _state = {
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
function init(options = {}) {
  _state.initialized = true;
  _state.shuttingDown = false;
  _state.lastInitAt = Date.now();
  return Promise.resolve(true);
}
function mount() {
  _state.mounted = true;
  return true;
}
function unmount() {
  _state.mounted = false;
  return true;
}
function setReady(val) {
  _state.ready = val;
}
function isInitialized() {
  return _state.initialized;
}
function isMounted() {
  return _state.mounted;
}
function isReady() {
  return _state.ready;
}
function isShuttingDown() {
  return _state.shuttingDown;
}
function setDegraded(val) {
  _state.degraded = val;
}
function getState() {
  return { ..._state };
}
function getStatus() {
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
function shutdown() {
  _state.shuttingDown = true;
  _state.ready = false;
  _state.mounted = false;
  _state.lastShutdownAt = Date.now();
  return Promise.resolve(true);
}
function reset() {
  _state.initialized = false;
  _state.mounted = false;
  _state.ready = false;
  _state.degraded = false;
  _state.shuttingDown = false;
  _state.lastResetAt = Date.now();
  return Promise.resolve(true);
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    notShuttingDown: !_state.shuttingDown,
    notDegraded: !_state.degraded,
    stateConsistent: !(_state.ready && !_state.initialized)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
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
function info() {
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
var lifecycle_default = FeatureFlagsLifecycle;
export {
  FEATURE_FLAGS_STATES,
  FeatureFlagsLifecycle,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getState,
  getStatus,
  healthCheck,
  info,
  init,
  isInitialized,
  isMounted,
  isReady,
  isShuttingDown,
  mount,
  reset,
  setDegraded,
  setReady,
  shutdown,
  unmount
};
