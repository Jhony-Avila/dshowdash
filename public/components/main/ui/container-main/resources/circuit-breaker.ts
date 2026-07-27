// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:circuit-breaker
// PURPOSE: Circuit Breaker - Proteção contra falhas em cascata
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CIRCUIT_STATES — exported value
//   createCircuitBreaker() — exported function
//   getCircuitBreaker() — exported function
//   resetCircuitBreaker() — exported function
//   listCircuitBreakers() — exported function
//   circuitBreakersHealthCheck() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.1.0-ADAPTIVE';
export const MODULE_ID = 'container-main:circuit-breaker';

// Estados do circuit breaker
export const CIRCUIT_STATES = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
});

// Registry de circuit breakers
const _breakers = new Map();

// Cria instância de Circuit Breaker
export function createCircuitBreaker(options: Record<string, any> = {}) {
  const {
    name = 'default',
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 30000,
    onStateChange,
    onFailure,
    onSuccess,
    onRejected
  } = options;

  let _state: string = CIRCUIT_STATES.CLOSED;
  let _failures = 0;
  let _successes = 0;
  let _lastFailure: unknown = null;
  let _nextAttempt = 0;
  let _totalCalls = 0;
  let _totalFailures = 0;
  let _totalSuccesses = 0;
  let _totalRejected = 0;

  function _setState(newState: string) {
    if (_state === newState) return;
    const oldState = _state;
    _state = newState;
    onStateChange?.(newState, oldState, name);
  }

  function _recordFailure(error: Record<string, unknown>) {
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
    async execute(fn: (...args: unknown[]) => void, fallback: Record<string, unknown>) {
      _totalCalls++;

      if (!this.canExecute()) {
        _totalRejected++;
        const error = new Error(`Circuit breaker "${name}" is OPEN`);

        // @ts-expect-error TS migration - TS2339
        error.circuitBreakerRejected = true;
        onRejected?.(error, name);
        throw error;
      }

      try {
        const result = await fn();
        _recordSuccess();
        return result;
      } catch (error: any) {
        _recordFailure(error);
        throw error;
      }
    },

    // Wrapper para função com retry
    async executeWithRetry(fn: (...args: unknown[]) => void, retries = 3, delay = 1000) {
      let lastError;
      
      for (let i = 0; i <= retries; i++) {
        try {
          // @ts-expect-error strict migration — TS2554
          return await this.execute(fn);
        } catch (error: any) {
          lastError = error;
          if (error.circuitBreakerRejected || i === retries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
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
        successRate: _totalCalls > 0 ? `${(_totalSuccesses / _totalCalls * 100).toFixed(2)}%` : 'N/A',
        failureThreshold,
        successThreshold,
        timeout
      };
    },

    // Health check
    healthCheck() {
      return {

    
        status: _state === CIRCUIT_STATES.OPEN ? 'DEGRADED' : 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        circuitName: name,
        circuitState: _state,
        stats: this.getStats()
      };
    }
  };
}

// Obtém ou cria circuit breaker
export function getCircuitBreaker(name: string, options: Record<string, any> = {}) {
  if (!_breakers.has(name)) {
    _breakers.set(name, createCircuitBreaker({ ...options, name }));
  }
  return _breakers.get(name);
}

// Reset um circuit breaker específico pelo nome
export function resetCircuitBreaker(name: string) {
  const breaker = _breakers.get(name);
  if (breaker) {
    breaker.reset();
    return true;
  }
  return false;
}

// Lista todos os breakers
export function listCircuitBreakers() {
  return Array.from(_breakers.keys());
}

// Health check agregado
export function circuitBreakersHealthCheck() {
  const results: Record<string, any> = {};
  let openCount = 0;
  
  _breakers.forEach((breaker, name) => {
    const health = breaker.healthCheck();
    results[name] = health;
    if (health.circuitState === CIRCUIT_STATES.OPEN) openCount++;
  });

  return {
    status: openCount > 0 ? 'DEGRADED' : 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    totalBreakers: _breakers.size,
    openBreakers: openCount,
    breakers: results
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalBreakers: _breakers.size,
    states: Object.keys(CIRCUIT_STATES)
  };
}

export function healthCheck() {
  return circuitBreakersHealthCheck();
}


function destroy() { }
export default {
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
