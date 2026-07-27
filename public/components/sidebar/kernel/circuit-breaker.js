const MODULE_ID = "sidebar-kernel-circuit-breaker";
const VERSION = "1.1.0-ES6";
const STATES = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
});
const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  halfOpenMaxAttempts: 3
};
const _circuits = /* @__PURE__ */ new Map();
let _metrics = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};
function _getCircuit(featureId) {
  if (!_circuits.has(featureId)) {
    _circuits.set(featureId, {
      state: STATES.CLOSED,
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
      halfOpenAttempts: 0,
      config: Object.assign({}, DEFAULT_CONFIG)
    });
  }
  return _circuits.get(featureId);
}
function configure(featureId, config) {
  const circuit = _getCircuit(featureId);
  circuit.config = Object.assign({}, DEFAULT_CONFIG, config || {});
  return { ok: true, featureId };
}
function canExecute(featureId) {
  const circuit = _getCircuit(featureId);
  if (circuit.state === STATES.CLOSED) {
    return { allowed: true, state: circuit.state };
  }
  if (circuit.state === STATES.OPEN) {
    const elapsed = Date.now() - circuit.openedAt;
    if (elapsed >= circuit.config.timeout) {
      circuit.state = STATES.HALF_OPEN;
      circuit.halfOpenAttempts = 0;
      return { allowed: true, state: circuit.state, reason: "timeout-expired" };
    }
    _metrics.blockedCalls++;
    return { allowed: false, state: circuit.state, reason: "circuit-open", retryAfter: circuit.config.timeout - elapsed };
  }
  if (circuit.state === STATES.HALF_OPEN) {
    if (circuit.halfOpenAttempts < circuit.config.halfOpenMaxAttempts) {
      circuit.halfOpenAttempts++;
      return { allowed: true, state: circuit.state, attempt: circuit.halfOpenAttempts };
    }
    _metrics.blockedCalls++;
    return { allowed: false, state: circuit.state, reason: "half-open-limit" };
  }
  return { allowed: true, state: circuit.state };
}
function recordSuccess(featureId) {
  const circuit = _getCircuit(featureId);
  circuit.successes++;
  circuit.lastSuccess = Date.now();
  _metrics.totalSuccesses++;
  if (circuit.state === STATES.HALF_OPEN) {
    if (circuit.successes >= circuit.config.successThreshold) {
      circuit.state = STATES.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      _metrics.circuitsClosed++;
    }
  } else if (circuit.state === STATES.CLOSED) {
    circuit.failures = 0;
  }
  return { ok: true, state: circuit.state };
}
function recordFailure(featureId, error) {
  const circuit = _getCircuit(featureId);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  circuit.lastError = error;
  _metrics.totalFailures++;
  if (circuit.state === STATES.HALF_OPEN) {
    circuit.state = STATES.OPEN;
    circuit.openedAt = Date.now();
    _metrics.circuitsOpened++;
  } else if (circuit.state === STATES.CLOSED) {
    if (circuit.failures >= circuit.config.failureThreshold) {
      circuit.state = STATES.OPEN;
      circuit.openedAt = Date.now();
      _metrics.circuitsOpened++;
    }
  }
  return { ok: true, state: circuit.state };
}
function reset(featureId) {
  const circuit = _getCircuit(featureId);
  circuit.state = STATES.CLOSED;
  circuit.failures = 0;
  circuit.successes = 0;
  circuit.halfOpenAttempts = 0;
  return { ok: true };
}
function getStatus(featureId) {
  const circuit = _getCircuit(featureId);
  return {
    featureId,
    state: circuit.state,
    failures: circuit.failures,
    successes: circuit.successes,
    lastFailure: circuit.lastFailure,
    lastSuccess: circuit.lastSuccess,
    config: circuit.config
  };
}
function getAllStatus() {
  const status = {};
  _circuits.forEach((circuit, id) => {
    status[id] = {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes
    };
  });
  return status;
}
function getMetrics() {
  return Object.assign({}, _metrics, { circuitsCount: _circuits.size });
}
function healthCheck() {
  let openCircuits = 0;
  _circuits.forEach((c) => {
    if (c.state === STATES.OPEN) openCircuits++;
  });
  return {
    status: openCircuits === 0 ? "HEALTHY" : openCircuits < 3 ? "DEGRADED" : "UNHEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    openCircuits,
    totalCircuits: _circuits.size,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
async function execute(featureId, fn, fallback) {
  const check = canExecute(featureId);
  if (!check.allowed) {
    if (fallback) return fallback();
    throw new Error("Circuit breaker is open for: " + featureId);
  }
  try {
    const result = await fn();
    recordSuccess(featureId);
    return result;
  } catch (error) {
    recordFailure(featureId, error);
    if (fallback) return fallback();
    throw error;
  }
}
function destroy() {
}
var circuit_breaker_default = {
  MODULE_ID,
  VERSION,
  STATES,
  configure,
  canExecute,
  execute,
  recordSuccess,
  recordFailure,
  reset,
  getStatus,
  getAllStatus,
  getMetrics,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  canExecute,
  configure,
  circuit_breaker_default as default,
  execute,
  getAllStatus,
  getMetrics,
  getStatus,
  healthCheck,
  recordFailure,
  recordSuccess,
  reset
};
