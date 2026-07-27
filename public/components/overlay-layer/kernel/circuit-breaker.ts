
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel-circuit-breaker
// PURPOSE: Overlay Kernel - Circuit Breaker v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CIRCUIT_STATES — exported value
//   inject() — exported function
//   getState() — exported function
//   isAllowed() — exported function
//   recordSuccess() — exported function
//   recordFailure() — exported function
//   reset() — exported function
//   forceOpen() — exported function
//   forceClose() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   isOpen() — exported function
//   isClosed() — exported function
//   getMetrics() — exported function
//   getStateHistory() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-kernel-circuit-breaker';

// Estados do Circuit Breaker
const STATES = {
  CLOSED: 'CLOSED',     // Normal - permite operações
  OPEN: 'OPEN',         // Falhas detectadas - bloqueia operações
  HALF_OPEN: 'HALF_OPEN' // Testando recuperação
};

// Configuração padrão
const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  monitoredOperations: ['open', 'render', 'close'],
  enabled: true,
  resetOnSuccess: true,
  halfOpenMaxAttempts: 3
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _state = {
  current: STATES.CLOSED,
  failures: 0,
  successes: 0,
  lastFailure: null as DynObj,
  lastSuccess: null as DynObj,
  lastStateChange: Date.now(),
  openedAt: null as DynObj,
  halfOpenAttempts: 0,
  totalFailures: 0,
  totalSuccesses: 0,
  totalBlocked: 0,
  stateHistory: [] as DynObj
};

// EventBus reference
let _eventBus: DynObj = null;

/**
 * Injeta dependências
 */
export function inject(dependencies: DynObj) {
  if (dependencies.eventBus) _eventBus = dependencies.eventBus;
}

/**
 * Emite evento se eventBus disponível
 */
function emit(event: string, data: DynObj) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}

/**
 * Registra mudança de estado no histórico
 */
function recordStateChange(from: DynObj, to: DynObj, reason: DynObj) {
  _state.stateHistory.push({
    from,
    to,
    reason,
    timestamp: Date.now(),
    failures: _state.failures,
    successes: _state.successes
  });
  
  // Manter apenas últimas 20 mudanças
  if (_state.stateHistory.length > 20) {
    _state.stateHistory.shift();
  }
  
  emit('circuit-breaker:state-change', { from, to, reason });
}

/**
 * Transição para estado OPEN
 */
function transitionToOpen(reason: DynObj) {
  if (_state.current === STATES.OPEN) return;
  
  const from = _state.current;
  _state.current = STATES.OPEN;
  _state.openedAt = Date.now();
  _state.lastStateChange = Date.now();
  _state.halfOpenAttempts = 0;
  
  recordStateChange(from, STATES.OPEN, reason);
  
  // Agendar transição para HALF_OPEN
  setTimeout(() => {
    if (_state.current === STATES.OPEN) {
      transitionToHalfOpen('timeout-expired');
    }
  }, _config.timeout);
}

/**
 * Transição para estado HALF_OPEN
 */
function transitionToHalfOpen(reason: DynObj) {
  if (_state.current === STATES.HALF_OPEN) return;
  
  const from = _state.current;
  _state.current = STATES.HALF_OPEN;
  _state.lastStateChange = Date.now();
  _state.successes = 0;
  _state.halfOpenAttempts = 0;
  
  recordStateChange(from, STATES.HALF_OPEN, reason);
}

/**
 * Transição para estado CLOSED
 */
function transitionToClosed(reason: DynObj) {
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

/**
 * Retorna estado atual
 */
export function getState() {
  return _state.current;
}

/**
 * Verifica se operação é permitida
 */
export function isAllowed(operation?: DynObj) {
  if (!_config.enabled) {
    return { allowed: true, reason: 'circuit-breaker-disabled' };
  }
  
  // Verificar se operação é monitorada
  if (operation && !_config.monitoredOperations.includes(operation)) {
    return { allowed: true, reason: 'operation-not-monitored' };
  }
  
  switch (_state.current) {
    case STATES.CLOSED:
      return { allowed: true, reason: 'circuit-closed', state: STATES.CLOSED };
    
    case STATES.OPEN:
      _state.totalBlocked++;
      const timeInOpen = Date.now() - _state.openedAt;
      return { 
        allowed: false, 
        reason: 'circuit-open', 
        state: STATES.OPEN,
        retryAfter: Math.max(0, _config.timeout - timeInOpen),
        blockedCount: _state.totalBlocked
      };
    
    case STATES.HALF_OPEN:
      // Permitir tentativas limitadas em HALF_OPEN
      if (_state.halfOpenAttempts < _config.halfOpenMaxAttempts) {
        _state.halfOpenAttempts++;
        return { 
          allowed: true, 
          reason: 'circuit-half-open-testing', 
          state: STATES.HALF_OPEN,
          attempt: _state.halfOpenAttempts,
          maxAttempts: _config.halfOpenMaxAttempts
        };
      }
      _state.totalBlocked++;
      return { 
        allowed: false, 
        reason: 'circuit-half-open-limit-reached', 
        state: STATES.HALF_OPEN
      };
    
    default:
      return { allowed: true, reason: 'unknown-state' };
  }
}

/**
 * Registra sucesso de operação
 */
export function recordSuccess(operation?: DynObj) {
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
        transitionToClosed('success-threshold-reached');
      }
      break;
    
    case STATES.OPEN:
      // Sucesso em OPEN não deveria acontecer, mas se acontecer, transicionar
      transitionToHalfOpen('unexpected-success-in-open');
      break;
  }
  
  emit('circuit-breaker:success', { operation, state: _state.current });
}

/**
 * Registra falha de operação
 */
export function recordFailure(operation: DynObj, error: DynObj) {
  _state.lastFailure = Date.now();
  _state.totalFailures++;
  
  if (!_config.enabled) return;
  if (operation && !_config.monitoredOperations.includes(operation)) return;
  
  switch (_state.current) {
    case STATES.CLOSED:
      _state.failures++;
      if (_state.failures >= _config.failureThreshold) {
        transitionToOpen('failure-threshold-reached');
      }
      break;
    
    case STATES.HALF_OPEN:
      // Falha em HALF_OPEN volta para OPEN
      transitionToOpen('failure-in-half-open');
      break;
    
    case STATES.OPEN:
      // Já está aberto, apenas registrar
      break;
  }
  
  emit('circuit-breaker:failure', { operation, error: error?.message, state: _state.current });
}

/**
 * Reseta o circuit breaker para estado inicial
 */
export function reset() {
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
    recordStateChange(from, STATES.CLOSED, 'manual-reset');
  }
  
  return { ok: true, previousState: from };
}

/**
 * Força abertura do circuit
 */
export function forceOpen(reason = 'manual') {
  transitionToOpen(`forced:${reason}`);
  return { ok: true, state: STATES.OPEN };
}

/**
 * Força fechamento do circuit
 */
export function forceClose(reason = 'manual') {
  transitionToClosed(`forced:${reason}`);
  return { ok: true, state: STATES.CLOSED };
}

/**
 * Atualiza configuração
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  
  _config = { ..._config, ...config };
  
  // Validar limites
  if (_config.failureThreshold < 1) _config.failureThreshold = 1;
  if (_config.successThreshold < 1) _config.successThreshold = 1;
  if (_config.timeout < 1000) _config.timeout = 1000;
  if (_config.halfOpenMaxAttempts < 1) _config.halfOpenMaxAttempts = 1;
  
  return true;
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return { ..._config };
}

/**
 * Habilita o circuit breaker
 */
export function enable() {
  _config.enabled = true;
}

/**
 * Desabilita o circuit breaker
 */
export function disable() {
  _config.enabled = false;
}

/**
 * Verifica se está habilitado
 */
export function isEnabled() {
  return _config.enabled;
}

/**
 * Verifica se o circuito está aberto (bloqueando)
 */
export function isOpen() {
  return _state.current === STATES.OPEN;
}

/**
 * Verifica se o circuito está fechado (permitindo)
 */
export function isClosed() {
  return _state.current === STATES.CLOSED;
}

/**
 * Retorna métricas
 */
export function getMetrics() {
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

/**
 * Retorna histórico de estados
 */
export function getStateHistory() {
  return [..._state.stateHistory];
}

/**
 * Health check
 */
export function healthCheck() {
  const metrics = getMetrics();
  
  const checks = {
    enabled: _config.enabled,
    configValid: _config.failureThreshold > 0 && _config.timeout > 0,
    notOpen: _state.current !== STATES.OPEN,
    lowFailureRate: metrics.totalSuccesses === 0 || 
      (metrics.totalFailures / (metrics.totalSuccesses + metrics.totalFailures)) < 0.3
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (_state.current === STATES.OPEN) status = 'UNHEALTHY';
  else if (_state.current === STATES.HALF_OPEN) status = 'DEGRADED';
  else if (!checks.lowFailureRate) status = 'DEGRADED';
  
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

/**
 * Info do módulo
 */
export function info() {
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

/**
 * Execute a function through the circuit breaker with optional fallback
 */
export async function execute(fn: DynObj, fallback?: DynObj) {
  const check = isAllowed();
  if (!check.allowed) {
    if (fallback) return fallback();
    throw new Error('Circuit breaker is open: ' + check.reason);
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

// Export estados para uso externo
export const CIRCUIT_STATES = STATES;

// Export default

function destroy() { }
export default {
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
