const VERSION = "1.1.0-ADAPTIVE";
const MODULE_ID = "container-main:circuit-breaker";
const CIRCUIT_STATES = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
});
const _breakers = /* @__PURE__ */ new Map();
function createCircuitBreaker(options = {}) {
  const {
    name = "default",
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 3e4,
    onStateChange,
    onFailure,
    onSuccess,
    onRejected
  } = options;
  let _state = CIRCUIT_STATES.CLOSED;
  let _failures = 0;
  let _successes = 0;
  let _lastFailure = null;
  let _nextAttempt = 0;
  let _totalCalls = 0;
  let _totalFailures = 0;
  let _totalSuccesses = 0;
  let _totalRejected = 0;
  function _setState(newState) {
    if (_state === newState) return;
    const oldState = _state;
    _state = newState;
    onStateChange?.(newState, oldState, name);
  }
  function _recordFailure(error) {
    _failures++;
    _totalFailures++;
    _lastFailure = { error: error?.message || error, timestamp: Date.now() };
    onFailure?.(error, name);
    if (_state === CIRCUIT_STATES.HALF_OPEN) {
      _setState(CIRCUIT_STATES.OPEN);
      _nextAttempt = Date.now() + timeout;
      _failures = 0;
      _successes = 0;
    } else if (_failures >= failureThreshold) {
      _setState(CIRCUIT_STATES.OPEN);
      _nextAttempt = Date.now() + timeout;
    }
  }
  function _recordSuccess() {
    _successes++;
    _totalSuccesses++;
    onSuccess?.(name);
    if (_state === CIRCUIT_STATES.HALF_OPEN) {
      if (_successes >= successThreshold) {
        _setState(CIRCUIT_STATES.CLOSED);
        _failures = 0;
        _successes = 0;
      }
    } else {
      _failures = Math.max(0, _failures - 1);
    }
  }
  return {
    getName: () => name,
    getState: () => ({
      name,
      state: _state,
      failures: _failures,
      successes: _successes,
      lastFailure: _lastFailure,
      nextAttempt: _state === CIRCUIT_STATES.OPEN ? _nextAttempt : null,
      canAttempt: _state !== CIRCUIT_STATES.OPEN || Date.now() >= _nextAttempt
    }),
    // Verifica se pode executar
    canExecute() {
      if (_state === CIRCUIT_STATES.CLOSED) return true;
      if (_state === CIRCUIT_STATES.OPEN) {
        if (Date.now() >= _nextAttempt) {
          _setState(CIRCUIT_STATES.HALF_OPEN);
          return true;
        }
        return false;
      }
      return true;
    },
    // Executa função protegida pelo circuit breaker
    async execute(fn, fallback) {
      _totalCalls++;
      if (!this.canExecute()) {
        _totalRejected++;
        const error = new Error(`Circuit breaker "${name}" is OPEN`);
        error.circuitBreakerRejected = true;
        onRejected?.(error, name);
        throw error;
      }
      try {
        const result = await fn();
        _recordSuccess();
        return result;
      } catch (error) {
        _recordFailure(error);
        throw error;
      }
    },
    // Wrapper para função com retry
    async executeWithRetry(fn, retries = 3, delay = 1e3) {
      let lastError;
      for (let i = 0; i <= retries; i++) {
        try {
          return await this.execute(fn);
        } catch (error) {
          lastError = error;
          if (error.circuitBreakerRejected || i === retries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
      throw lastError;
    },
    // Reset manual
    reset() {
      _setState(CIRCUIT_STATES.CLOSED);
      _failures = 0;
      _successes = 0;
      _lastFailure = null;
      _nextAttempt = 0;
    },
    // Força abertura
    trip() {
      _setState(CIRCUIT_STATES.OPEN);
      _nextAttempt = Date.now() + timeout;
    },
    // Estatísticas
    getStats() {
      return {
        name,
        state: _state,
        totalCalls: _totalCalls,
        totalSuccesses: _totalSuccesses,
        totalFailures: _totalFailures,
        totalRejected: _totalRejected,
        successRate: _totalCalls > 0 ? `${(_totalSuccesses / _totalCalls * 100).toFixed(2)}%` : "N/A",
        failureThreshold,
        successThreshold,
        timeout
      };
    },
    // Health check
    healthCheck() {
      return {
        status: _state === CIRCUIT_STATES.OPEN ? "DEGRADED" : "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        circuitName: name,
        circuitState: _state,
        stats: this.getStats()
      };
    }
  };
}
function getCircuitBreaker(name, options = {}) {
  if (!_breakers.has(name)) {
    _breakers.set(name, createCircuitBreaker({ ...options, name }));
  }
  return _breakers.get(name);
}
function resetCircuitBreaker(name) {
  const breaker = _breakers.get(name);
  if (breaker) {
    breaker.reset();
    return true;
  }
  return false;
}
function listCircuitBreakers() {
  return Array.from(_breakers.keys());
}
function circuitBreakersHealthCheck() {
  const results = {};
  let openCount = 0;
  _breakers.forEach((breaker, name) => {
    const health = breaker.healthCheck();
    results[name] = health;
    if (health.circuitState === CIRCUIT_STATES.OPEN) openCount++;
  });
  return {
    status: openCount > 0 ? "DEGRADED" : "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    totalBreakers: _breakers.size,
    openBreakers: openCount,
    breakers: results
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalBreakers: _breakers.size,
    states: Object.keys(CIRCUIT_STATES)
  };
}
function healthCheck() {
  return circuitBreakersHealthCheck();
}
function destroy() {
}
var circuit_breaker_default = {
  VERSION,
  MODULE_ID,
  CIRCUIT_STATES,
  createCircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreaker,
  listCircuitBreakers,
  circuitBreakersHealthCheck,
  info,
  healthCheck
};
export {
  CIRCUIT_STATES,
  MODULE_ID,
  VERSION,
  circuitBreakersHealthCheck,
  createCircuitBreaker,
  circuit_breaker_default as default,
  getCircuitBreaker,
  healthCheck,
  info,
  listCircuitBreakers,
  resetCircuitBreaker
};
