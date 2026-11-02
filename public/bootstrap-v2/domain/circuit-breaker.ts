
// Circuit Breaker for External Modules
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @description QW#05 - Protege módulos externos com circuit breaker pattern
// @changelog v1.1.0-KERNEL: #3 Integração com Kernel, eventos de estado
// @changelog v1.0.0: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: createCircuitBreaker(), getBreaker(), getAllBreakers(),
//   resetAll(), getOpenCount(), getOpenBreakers(), subscribe()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

const MODULE_ID = 'circuit-breaker';
const VERSION = '1.2.0-HEALTH-CONTRACT';

// Estados do circuit breaker
const STATES = {
  CLOSED: 'closed',     // Normal - permite requisições
  OPEN: 'open',         // Falha - bloqueia requisições
  HALF_OPEN: 'half-open' // Teste - permite uma requisição de teste
};

// Eventos do Circuit Breaker
const BREAKER_EVENTS = {
  STATE_CHANGE: 'circuit-breaker:state-change',
  OPENED: 'circuit-breaker:opened',
  CLOSED: 'circuit-breaker:closed',
  HALF_OPEN: 'circuit-breaker:half-open',
  FAILURE: 'circuit-breaker:failure',
  SUCCESS: 'circuit-breaker:success'
};

// Configuração padrão
const DEFAULT_CONFIG = {
  failureThreshold: 3,      // Falhas antes de abrir
  successThreshold: 2,      // Sucessos para fechar
  timeout: 30000,           // Tempo em OPEN antes de HALF_OPEN (30s)
  resetTimeout: 60000       // Tempo para reset completo (60s)
};

// Types
interface BreakerEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

type BreakerInstance = ReturnType<typeof createCircuitBreaker>;

interface BreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

// Registry de circuit breakers por módulo
const _breakers: Record<string, BreakerInstance> = {};

// #3: Listeners globais para integração com Kernel
const _globalListeners: Array<(event: BreakerEvent) => void> = [];

function _notifyListeners(event: string, data: Record<string, unknown>) {
  for (let i = 0; i < _globalListeners.length; i++) {
    try {
      _globalListeners[i]({ event: event, data: data, timestamp: Date.now() });
    } catch (e) {}
  }
}

function createCircuitBreaker(moduleId: string, config: BreakerConfig) {
  if (config === undefined) config = {};
  
  const cfg = {
    failureThreshold: config.failureThreshold || DEFAULT_CONFIG.failureThreshold,
    successThreshold: config.successThreshold || DEFAULT_CONFIG.successThreshold,
    timeout: config.timeout || DEFAULT_CONFIG.timeout,
    resetTimeout: config.resetTimeout || DEFAULT_CONFIG.resetTimeout
  };
  
  let state = STATES.CLOSED;
  let failures = 0;
  let successes = 0;
  let lastFailureTime: number | null = null;
  let lastSuccessTime: number | null = null;
  let openedAt: number | null = null;
  
  function _emitStateChange(fromState: string, toState: string, reason: string) {
    const data = {
      moduleId: moduleId,
      from: fromState,
      to: toState,
      reason: reason,
      failures: failures,
      successes: successes
    };
    
    _notifyListeners(BREAKER_EVENTS.STATE_CHANGE, data);
    
    if (toState === STATES.OPEN) {
      _notifyListeners(BREAKER_EVENTS.OPENED, data);
    } else if (toState === STATES.CLOSED) {
      _notifyListeners(BREAKER_EVENTS.CLOSED, data);
    } else if (toState === STATES.HALF_OPEN) {
      _notifyListeners(BREAKER_EVENTS.HALF_OPEN, data);
    }
  }
  
  function _checkTimeout() {
    if (state === STATES.OPEN && openedAt) {
      const elapsed = Date.now() - openedAt;
      if (elapsed >= cfg.timeout) {
        const oldState = state;
        state = STATES.HALF_OPEN;
        _emitStateChange(oldState, state, 'Timeout elapsed, testing');
        return true;
      }
    }
    return false;
  }
  
  function canExecute() {
    _checkTimeout();
    
    if (state === STATES.CLOSED) return true;
    if (state === STATES.HALF_OPEN) return true;
    return false;
  }
  
  function recordSuccess() {
    lastSuccessTime = Date.now();
    const oldState = state;
    
    if (state === STATES.HALF_OPEN) {
      successes++;
      if (successes >= cfg.successThreshold) {
        state = STATES.CLOSED;
        failures = 0;
        successes = 0;
        openedAt = null;
        _emitStateChange(oldState, state, 'Success threshold reached');
      }
    } else if (state === STATES.CLOSED) {
      failures = Math.max(0, failures - 1);
    }
    
    _notifyListeners(BREAKER_EVENTS.SUCCESS, { moduleId: moduleId, state: state });
    
    return { state: state, failures: failures, successes: successes };
  }
  
  function recordFailure(error: Error | null) {
    failures++;
    lastFailureTime = Date.now();
    const oldState = state;
    
    if (state === STATES.HALF_OPEN) {
      state = STATES.OPEN;
      openedAt = Date.now();
      successes = 0;
      _emitStateChange(oldState, state, 'Failure during half-open test');
    } else if (state === STATES.CLOSED && failures >= cfg.failureThreshold) {
      state = STATES.OPEN;
      openedAt = Date.now();
      _emitStateChange(oldState, state, 'Failure threshold reached');
    }
    
    _notifyListeners(BREAKER_EVENTS.FAILURE, { 
      moduleId: moduleId, 
      state: state, 
      error: error ? error.message : 'unknown',
      failures: failures
    });
    
    return { state: state, failures: failures, error: error ? error.message : 'unknown' };
  }
  
  function reset() {
    const oldState = state;
    state = STATES.CLOSED;
    failures = 0;
    successes = 0;
    lastFailureTime = null;
    lastSuccessTime = null;
    openedAt = null;
    
    if (oldState !== STATES.CLOSED) {
      _emitStateChange(oldState, state, 'Manual reset');
    }
  }
  
  function getState() {
    _checkTimeout();
    return state;
  }
  
  function isOpen() {
    return getState() === STATES.OPEN;
  }
  
  function isClosed() {
    return getState() === STATES.CLOSED;
  }
  
  function isHalfOpen() {
    return getState() === STATES.HALF_OPEN;
  }
  
  function getStats() {
    return {
      moduleId: moduleId,
      state: getState(),
      failures: failures,
      successes: successes,
      lastFailureTime: lastFailureTime,
      lastSuccessTime: lastSuccessTime,
      openedAt: openedAt,
      config: cfg
    };
  }
  
  function execute<T>(fn: () => T | Promise<T>): Promise<T> {
    if (!canExecute()) {
      return Promise.reject(new Error('Circuit breaker OPEN for ' + moduleId));
    }
    
    return Promise.resolve().then(function() {
      return fn();
    }).then(function(result) {
      recordSuccess();
      return result;
    }).catch(function(error) {
      recordFailure(error);
      throw error;
    });
  }
  
  return {
    canExecute: canExecute,
    recordSuccess: recordSuccess,
    recordFailure: recordFailure,
    reset: reset,
    getState: getState,
    isOpen: isOpen,
    isClosed: isClosed,
    isHalfOpen: isHalfOpen,
    getStats: getStats,
    execute: execute,
    STATES: STATES
  };
}

// Factory para obter/criar circuit breaker por módulo
function getBreaker(moduleId: string, config?: BreakerConfig) {
  if (!_breakers[moduleId]) {
    // @ts-expect-error strict migration — TS2345
    _breakers[moduleId] = createCircuitBreaker(moduleId, config);
  }
  return _breakers[moduleId];
}

function getAllBreakers() {
  const result: Record<string, ReturnType<BreakerInstance['getStats']>> = {};
  for (const id in _breakers) {
    if (_breakers.hasOwnProperty(id)) {
      result[id] = _breakers[id].getStats();
    }
  }
  return result;
}

function resetAll() {
  for (const id in _breakers) {
    if (_breakers.hasOwnProperty(id)) {
      _breakers[id].reset();
    }
  }
}

// #3: Contar breakers em estado OPEN
function getOpenCount() {
  let count = 0;
  for (const id in _breakers) {
    if (_breakers.hasOwnProperty(id) && _breakers[id].getState() === STATES.OPEN) {
      count++;
    }
  }
  return count;
}

// #3: Obter lista de breakers OPEN
function getOpenBreakers() {
  const result = [];
  for (const id in _breakers) {
    if (_breakers.hasOwnProperty(id) && _breakers[id].getState() === STATES.OPEN) {
      result.push(_breakers[id].getStats());
    }
  }
  return result;
}

// #3: Subscrever para eventos globais (usado pelo Kernel)
function subscribe(callback: (event: BreakerEvent) => void) {
  if (typeof callback === 'function') {
    _globalListeners.push(callback);
    return function unsubscribe() {
      const idx = _globalListeners.indexOf(callback);
      if (idx !== -1) _globalListeners.splice(idx, 1);
    };
  }
  return function() {};
}

// #3: Verificar saúde geral dos circuit breakers
function healthCheck() {
  const total = Object.keys(_breakers).length;
  const openCount = getOpenCount();
  let status: string = HEALTH_STATUS.HEALTHY;

  if (total > 0) {
    const openRatio = openCount / total;
    if (openRatio >= 0.5) {
      status = HEALTH_STATUS.FAILED;
    } else if (openCount > 0) {
      status = HEALTH_STATUS.DEGRADED;
    }
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      total: total,
      open: openCount,
      closed: total - openCount,
      openBreakers: getOpenBreakers()
    }
  });
}

function info() {
  const breakerCount = Object.keys(_breakers).length;
  const openCount = getOpenCount();
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    breakerCount: breakerCount,
    openCount: openCount,
    listenerCount: _globalListeners.length,
    breakers: getAllBreakers(),
    health: healthCheck()
  };
}

export {
  createCircuitBreaker,
  getBreaker,
  getAllBreakers,
  resetAll,
  getOpenCount,
  getOpenBreakers,
  subscribe,
  healthCheck,
  info,
  STATES,
  BREAKER_EVENTS,
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION
};


function destroy() { }
export default {
  createCircuitBreaker: createCircuitBreaker,
  getBreaker: getBreaker,
  getAllBreakers: getAllBreakers,
  resetAll: resetAll,
  getOpenCount: getOpenCount,
  getOpenBreakers: getOpenBreakers,
  subscribe: subscribe,
  healthCheck: healthCheck,
  info: info,
  STATES: STATES,
  BREAKER_EVENTS: BREAKER_EVENTS
};
