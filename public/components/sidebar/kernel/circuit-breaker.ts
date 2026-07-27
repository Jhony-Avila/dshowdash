// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-kernel-circuit-breaker
// PURPOSE: SidebarKernel Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   configure() — exported function
//   canExecute() — exported function
//   recordSuccess() — exported function
//   recordFailure() — exported function
//   reset() — exported function
//   getStatus() — exported function
//   getAllStatus() — exported function
//   getMetrics() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-kernel-circuit-breaker';
export const VERSION = '1.1.0-ES6';

const STATES = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
});

const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  halfOpenMaxAttempts: 3
};

const _circuits = new Map();

let _metrics = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};

function _getCircuit(featureId: string) {
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

export function configure(featureId: string, config: DynObj) {
  const circuit = _getCircuit(featureId);
  circuit.config = Object.assign({}, DEFAULT_CONFIG, config || {});
  return { ok: true, featureId };
}

export function canExecute(featureId: string) {
  const circuit = _getCircuit(featureId);
  
  if (circuit.state === STATES.CLOSED) {
    return { allowed: true, state: circuit.state };
  }
  
  if (circuit.state === STATES.OPEN) {
    const elapsed = Date.now() - circuit.openedAt;
    if (elapsed >= circuit.config.timeout) {
      circuit.state = STATES.HALF_OPEN;
      circuit.halfOpenAttempts = 0;
      return { allowed: true, state: circuit.state, reason: 'timeout-expired' };
    }
    _metrics.blockedCalls++;
    return { allowed: false, state: circuit.state, reason: 'circuit-open', retryAfter: circuit.config.timeout - elapsed };
  }
  
  if (circuit.state === STATES.HALF_OPEN) {
    if (circuit.halfOpenAttempts < circuit.config.halfOpenMaxAttempts) {
      circuit.halfOpenAttempts++;
      return { allowed: true, state: circuit.state, attempt: circuit.halfOpenAttempts };
    }
    _metrics.blockedCalls++;
    return { allowed: false, state: circuit.state, reason: 'half-open-limit' };
  }
  
  return { allowed: true, state: circuit.state };
}

export function recordSuccess(featureId: string) {
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

export function recordFailure(featureId: string, error: Error) {
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

export function reset(featureId: string) {
  const circuit = _getCircuit(featureId);
  circuit.state = STATES.CLOSED;
  circuit.failures = 0;
  circuit.successes = 0;
  circuit.halfOpenAttempts = 0;
  return { ok: true };
}

export function getStatus(featureId: string) {
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

export function getAllStatus() {
  const status = {};
  _circuits.forEach((circuit, id) => {
    (status as DynObj)[id] = {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes
    };
  });
  return status;
}

export function getMetrics() {
  return Object.assign({}, _metrics, { circuitsCount: _circuits.size });
}

export function healthCheck() {
  let openCircuits = 0;
  _circuits.forEach(c => { if (c.state === STATES.OPEN) openCircuits++; });
  
  return {
    status: openCircuits === 0 ? 'HEALTHY' : openCircuits < 3 ? 'DEGRADED' : 'UNHEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    openCircuits,
    totalCircuits: _circuits.size,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export async function execute(featureId: string, fn: DynObj, fallback: DynObj) {
  const check = canExecute(featureId);
  if (!check.allowed) {
    if (fallback) return fallback();
    throw new Error('Circuit breaker is open for: ' + featureId);
  }
  try {
    const result = await fn();
    recordSuccess(featureId);
    return result;
  } catch (error) {
    // @ts-expect-error strict migration — TS2345
    recordFailure(featureId, error);
    if (fallback) return fallback();
    throw error;
  }
}


function destroy() { }
export default {
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
