const VERSION = "1.0.0";
const MODULE_ID = "overlay-kernel-circuit-breaker";
const STATES = {
  CLOSED: "CLOSED",
  // Normal - permite operações
  OPEN: "OPEN",
  // Falhas detectadas - bloqueia operações
  HALF_OPEN: "HALF_OPEN"
  // Testando recuperação
};
const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  monitoredOperations: ["open", "render", "close"],
  enabled: true,
  resetOnSuccess: true,
  halfOpenMaxAttempts: 3
};
let _config = { ...DEFAULT_CONFIG };
let _state = {
  current: STATES.CLOSED,
  failures: 0,
  successes: 0,
  lastFailure: null,
  lastSuccess: null,
  lastStateChange: Date.now(),
  openedAt: null,
  halfOpenAttempts: 0,
  totalFailures: 0,
  totalSuccesses: 0,
  totalBlocked: 0,
  stateHistory: []
};
let _eventBus = null;
function inject(dependencies) {
  if (dependencies.eventBus) _eventBus = dependencies.eventBus;
}
function emit(event, data) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}
function recordStateChange(from, to, reason) {
  _state.stateHistory.push({
    from,
    to,
    reason,
    timestamp: Date.now(),
    failures: _state.failures,
    successes: _state.successes
  });
  if (_state.stateHistory.length > 20) {
    _state.stateHistory.shift();
  }
  emit("circuit-breaker:state-change", { from, to, reason });
}
function transitionToOpen(reason) {
  if (_state.current === STATES.OPEN) return;
  const from = _state.current;
  _state.current = STATES.OPEN;
  _state.openedAt = Date.now();
  _state.lastStateChange = Date.now();
  _state.halfOpenAttempts = 0;
  recordStateChange(from, STATES.OPEN, reason);
  setTimeout(() => {
    if (_state.current === STATES.OPEN) {
      transitionToHalfOpen("timeout-expired");
    }
  }, _config.timeout);
}
function transitionToHalfOpen(reason) {
  if (_state.current === STATES.HALF_OPEN) return;
  const from = _state.current;
  _state.current = STATES.HALF_OPEN;
  _state.lastStateChange = Date.now();
  _state.successes = 0;
  _state.halfOpenAttempts = 0;
  recordStateChange(from, STATES.HALF_OPEN, reason);
}
function transitionToClosed(reason) {
  if (_state.current === STATES.CLOSED) return;
  const from = _state.current;
  _state.current = STATES.CLOSED;
  _state.lastStateChange = Date.now();
  _state.failures = 0;
  _state.successes = 0;
  _state.openedAt = null;
  _state.halfOpenAttempts = 0;
  recordStateChange(from, STATES.CLOSED, reason);
}
function getState() {
  return _state.current;
}
function isAllowed(operation) {
  if (!_config.enabled) {
    return { allowed: true, reason: "circuit-breaker-disabled" };
  }
  if (operation && !_config.monitoredOperations.includes(operation)) {
    return { allowed: true, reason: "operation-not-monitored" };
  }
  switch (_state.current) {
    case STATES.CLOSED:
      return { allowed: true, reason: "circuit-closed", state: STATES.CLOSED };
    case STATES.OPEN:
      _state.totalBlocked++;
      const timeInOpen = Date.now() - _state.openedAt;
      return {
        allowed: false,
        reason: "circuit-open",
        state: STATES.OPEN,
        retryAfter: Math.max(0, _config.timeout - timeInOpen),
        blockedCount: _state.totalBlocked
      };
    case STATES.HALF_OPEN:
      if (_state.halfOpenAttempts < _config.halfOpenMaxAttempts) {
        _state.halfOpenAttempts++;
        return {
          allowed: true,
          reason: "circuit-half-open-testing",
          state: STATES.HALF_OPEN,
          attempt: _state.halfOpenAttempts,
          maxAttempts: _config.halfOpenMaxAttempts
        };
      }
      _state.totalBlocked++;
      return {
        allowed: false,
        reason: "circuit-half-open-limit-reached",
        state: STATES.HALF_OPEN
      };
    default:
      return { allowed: true, reason: "unknown-state" };
  }
}
function recordSuccess(operation) {
  _state.lastSuccess = Date.now();
  _state.totalSuccesses++;
  if (!_config.enabled) return;
  if (operation && !_config.monitoredOperations.includes(operation)) return;
  switch (_state.current) {
    case STATES.CLOSED:
      if (_config.resetOnSuccess) {
        _state.failures = 0;
      }
      break;
    case STATES.HALF_OPEN:
      _state.successes++;
      if (_state.successes >= _config.successThreshold) {
        transitionToClosed("success-threshold-reached");
      }
      break;
    case STATES.OPEN:
      transitionToHalfOpen("unexpected-success-in-open");
      break;
  }
  emit("circuit-breaker:success", { operation, state: _state.current });
}
function recordFailure(operation, error) {
  _state.lastFailure = Date.now();
  _state.totalFailures++;
  if (!_config.enabled) return;
  if (operation && !_config.monitoredOperations.includes(operation)) return;
  switch (_state.current) {
    case STATES.CLOSED:
      _state.failures++;
      if (_state.failures >= _config.failureThreshold) {
        transitionToOpen("failure-threshold-reached");
      }
      break;
    case STATES.HALF_OPEN:
      transitionToOpen("failure-in-half-open");
      break;
    case STATES.OPEN:
      break;
  }
  emit("circuit-breaker:failure", { operation, error: error?.message, state: _state.current });
}
function reset() {
  const from = _state.current;
  _state = {
    current: STATES.CLOSED,
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    lastStateChange: Date.now(),
    openedAt: null,
    halfOpenAttempts: 0,
    totalFailures: _state.totalFailures,
    totalSuccesses: _state.totalSuccesses,
    totalBlocked: _state.totalBlocked,
    stateHistory: _state.stateHistory
  };
  if (from !== STATES.CLOSED) {
    recordStateChange(from, STATES.CLOSED, "manual-reset");
  }
  return { ok: true, previousState: from };
}
function forceOpen(reason = "manual") {
  transitionToOpen(`forced:${reason}`);
  return { ok: true, state: STATES.OPEN };
}
function forceClose(reason = "manual") {
  transitionToClosed(`forced:${reason}`);
  return { ok: true, state: STATES.CLOSED };
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  _config = { ..._config, ...config };
  if (_config.failureThreshold < 1) _config.failureThreshold = 1;
  if (_config.successThreshold < 1) _config.successThreshold = 1;
  if (_config.timeout < 1e3) _config.timeout = 1e3;
  if (_config.halfOpenMaxAttempts < 1) _config.halfOpenMaxAttempts = 1;
  return true;
}
function getConfig() {
  return { ..._config };
}
function enable() {
  _config.enabled = true;
}
function disable() {
  _config.enabled = false;
}
function isEnabled() {
  return _config.enabled;
}
function isOpen() {
  return _state.current === STATES.OPEN;
}
function isClosed() {
  return _state.current === STATES.CLOSED;
}
function getMetrics() {
  const now = Date.now();
  return {
    state: _state.current,
    enabled: _config.enabled,
    currentFailures: _state.failures,
    currentSuccesses: _state.successes,
    totalFailures: _state.totalFailures,
    totalSuccesses: _state.totalSuccesses,
    totalBlocked: _state.totalBlocked,
    lastFailure: _state.lastFailure,
    lastSuccess: _state.lastSuccess,
    lastStateChange: _state.lastStateChange,
    timeInCurrentState: now - _state.lastStateChange,
    openedAt: _state.openedAt,
    timeOpen: _state.openedAt ? now - _state.openedAt : 0,
    stateChanges: _state.stateHistory.length
  };
}
function getStateHistory() {
  return [..._state.stateHistory];
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    enabled: _config.enabled,
    configValid: _config.failureThreshold > 0 && _config.timeout > 0,
    notOpen: _state.current !== STATES.OPEN,
    lowFailureRate: metrics.totalSuccesses === 0 || metrics.totalFailures / (metrics.totalSuccesses + metrics.totalFailures) < 0.3
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (_state.current === STATES.OPEN) status = "UNHEALTHY";
  else if (_state.current === STATES.HALF_OPEN) status = "DEGRADED";
  else if (!checks.lowFailureRate) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    state: _state.current,
    metrics: {
      failures: _state.failures,
      threshold: _config.failureThreshold,
      totalBlocked: _state.totalBlocked
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    state: _state.current,
    config: getConfig(),
    metrics: getMetrics(),
    recentHistory: _state.stateHistory.slice(-5),
    timestamp: Date.now()
  };
}
async function execute(fn, fallback) {
  const check = isAllowed();
  if (!check.allowed) {
    if (fallback) return fallback();
    throw new Error("Circuit breaker is open: " + check.reason);
  }
  try {
    const result = await fn();
    recordSuccess();
    return result;
  } catch (error) {
    recordFailure(null, error);
    if (fallback) return fallback();
    throw error;
  }
}
const CIRCUIT_STATES = STATES;
function destroy() {
}
var circuit_breaker_default = {
  inject,
  getState,
  isAllowed,
  recordSuccess,
  recordFailure,
  reset,
  forceOpen,
  forceClose,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  isOpen,
  isClosed,
  getMetrics,
  getStateHistory,
  healthCheck,
  info,
  execute,
  CIRCUIT_STATES,
  VERSION,
  MODULE_ID
};
export {
  CIRCUIT_STATES,
  MODULE_ID,
  VERSION,
  configure,
  circuit_breaker_default as default,
  disable,
  enable,
  execute,
  forceClose,
  forceOpen,
  getConfig,
  getMetrics,
  getState,
  getStateHistory,
  healthCheck,
  info,
  inject,
  isAllowed,
  isClosed,
  isEnabled,
  isOpen,
  recordFailure,
  recordSuccess,
  reset
};
