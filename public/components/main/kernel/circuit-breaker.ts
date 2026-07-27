

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGING-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-circuit-breaker
// PURPOSE: MainKernel Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATES — exported value
//   setLogLevel() — exported function
//   canExecute() — exported function
//   recordSuccess() — exported function
//   recordFailure() — exported function
//   reset() — exported function
//   configure() — exported function
//   getStatus() — exported function
//   getAllStatus() — exported function
//   execute() — exported function
//   getMetrics() — exported function
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
declare const _config: any;
import { createLogger } from '/assets/js/core/logger-global/index.js';

export const MODULE_ID = 'main-kernel-circuit-breaker';
const _logger = createLogger(MODULE_ID);
export const VERSION = '1.1.0-LOGGING';

export const STATES = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
});

const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  halfOpenMaxAttempts: 3,
  logLevel: 1
};

const _breakers = new Map<string, BreakerInstance>();
let _logLevel = 1;

const _metrics = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL LOGGING
// ═══════════════════════════════════════════════════════════════

type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface BreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  halfOpenMaxAttempts: number;
  logLevel: number;
}

interface BreakerInstance {
  state: string;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  openedAt: number | null;
  lastError?: string;
  config: BreakerConfig;
}

interface CanExecuteResult {
  allowed: boolean;
  state: string;
  reason?: string;
}

interface ExecuteResult {
  ok: boolean;
  blocked?: boolean;
  reason?: string;
  state?: string;
  result?: unknown;
  error?: string;
}

const LOG_LEVELS: Record<LogLevelName, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: LogLevelName, msg: string, data?: unknown) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold = (typeof _logLevel !== 'undefined' ? _logLevel : (typeof _config !== 'undefined' && _config && _config.logLevel ? _config.logLevel : 1));
  if (levelNum < threshold) return;
  const context = data !== undefined ? { data } : {};
  if (level === 'error') _logger.error(msg, context);
  else if (level === 'warn') _logger.warn(msg, context);
  else if (level === 'debug') _logger.debug(msg, context);
  else _logger.info(msg, context);
}

export function setLogLevel(level: string | number): number {
  if (typeof level === 'string') {
    _logLevel = LOG_LEVELS[level as LogLevelName] !== undefined ? LOG_LEVELS[level as LogLevelName] : 1;
  } else if (typeof level === 'number') {
    _logLevel = level;
  }
  return _logLevel;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function _getBreaker(featureId: string): BreakerInstance {
  if (!_breakers.has(featureId)) {
    _breakers.set(featureId, {
      state: STATES.CLOSED,
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
      config: Object.assign({}, DEFAULT_CONFIG)
    });
  }
  // @ts-expect-error strict migration — TS2322
  return _breakers.get(featureId);
}

function _transitionTo(breaker: BreakerInstance, featureId: string, newState: string): void {
  const oldState = breaker.state;
  breaker.state = newState;
  
  if (newState === STATES.OPEN) {
    breaker.openedAt = Date.now();
    _metrics.circuitsOpened++;
    _log('warn', `OPENED for feature: ${featureId}`, undefined);
  } else if (newState === STATES.CLOSED && oldState !== STATES.CLOSED) {
    _metrics.circuitsClosed++;
    breaker.failures = 0;
    breaker.successes = 0;
    _log('info', `CLOSED for feature: ${featureId}`, undefined);
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function canExecute(featureId: string): CanExecuteResult {
  const breaker = _getBreaker(featureId);
  
  if (breaker.state === STATES.CLOSED) {
    return { allowed: true, state: breaker.state };
  }
  
  if (breaker.state === STATES.OPEN) {
    // @ts-expect-error strict migration — TS18047
    const elapsed = Date.now() - breaker.openedAt;
    
    if (elapsed >= breaker.config.timeout) {
      _transitionTo(breaker, featureId, STATES.HALF_OPEN);
      breaker.successes = 0;
      return { allowed: true, state: breaker.state };
    }
    
    _metrics.blockedCalls++;
    return { 
      allowed: false, 
      state: breaker.state, 
      reason: `Circuit open, retry in ${Math.round((breaker.config.timeout - elapsed) / 1000)}s`
    };
  }
  
  if (breaker.state === STATES.HALF_OPEN) {
    if (breaker.successes + breaker.failures < breaker.config.halfOpenMaxAttempts) {
      return { allowed: true, state: breaker.state };
    }
    
    _metrics.blockedCalls++;
    return { allowed: false, state: breaker.state, reason: 'Half-open limit reached' };
  }
  
  return { allowed: true, state: breaker.state };
}

export function recordSuccess(featureId: string) {
  const breaker = _getBreaker(featureId);
  
  breaker.successes++;
  breaker.lastSuccess = Date.now();
  _metrics.totalSuccesses++;
  
  if (breaker.state === STATES.HALF_OPEN) {
    if (breaker.successes >= breaker.config.successThreshold) {
      _transitionTo(breaker, featureId, STATES.CLOSED);
    }
  }
  
  if (breaker.state === STATES.CLOSED) {
    breaker.failures = 0;
  }
  
  return { ok: true, state: breaker.state };
}

export function recordFailure(featureId: string, error?: string | Error) {
  const breaker = _getBreaker(featureId);
  
  breaker.failures++;
  breaker.lastFailure = Date.now();
  breaker.lastError = typeof error === 'string' ? error : (error instanceof Error ? error.message : undefined);
  _metrics.totalFailures++;
  
  if (breaker.state === STATES.HALF_OPEN) {
    _transitionTo(breaker, featureId, STATES.OPEN);
    return { ok: true, state: breaker.state, opened: true };
  }
  
  if (breaker.state === STATES.CLOSED) {
    if (breaker.failures >= breaker.config.failureThreshold) {
      _transitionTo(breaker, featureId, STATES.OPEN);
      return { ok: true, state: breaker.state, opened: true };
    }
  }
  
  return { ok: true, state: breaker.state };
}

export function reset(featureId: string) {
  if (_breakers.has(featureId)) {
    const breaker = _breakers.get(featureId);
    breaker!.state = STATES.CLOSED;
    breaker!.failures = 0;
    breaker!.successes = 0;
    breaker!.openedAt = null;
    return { ok: true, reset: true };
  }
  return { ok: false, error: 'Breaker not found' };
}

export function configure(featureId: string, config: Partial<BreakerConfig>) {
  const breaker = _getBreaker(featureId);
  breaker.config = Object.assign({}, DEFAULT_CONFIG, breaker.config, config);
  return { ok: true, config: breaker.config };
}

export function getStatus(featureId: string) {
  const breaker = _getBreaker(featureId);
  
  return {
    featureId,
    state: breaker.state,
    failures: breaker.failures,
    successes: breaker.successes,
    lastFailure: breaker.lastFailure,
    lastSuccess: breaker.lastSuccess,
    lastError: breaker.lastError,
    openedAt: breaker.openedAt,
    config: breaker.config
  };
}

export function getAllStatus() {
  const result: Record<string, { state: string; failures: number; successes: number }> = {};
  _breakers.forEach((breaker: BreakerInstance, featureId: string) => {
    result[featureId] = {
      state: breaker.state,
      failures: breaker.failures,
      successes: breaker.successes
    };
  });
  return result;
}

export function execute(featureId: string, fn: (...fnArgs: unknown[]) => unknown, args?: unknown[]): ExecuteResult {
  const check = canExecute(featureId);
  
  if (!check.allowed) {
    return { ok: false, blocked: true, reason: check.reason, state: check.state };
  }
  
  try {
    const result = fn(...(args || []));
    recordSuccess(featureId);
    return { ok: true, result, state: _getBreaker(featureId).state };
  } catch (e: any) {
    recordFailure(featureId, e.message);
    return { ok: false, error: e.message, state: _getBreaker(featureId).state };
  }
}

export async function executeAsync(featureId: string, fn: (...fnArgs: unknown[]) => Promise<unknown>, args?: unknown[]): Promise<ExecuteResult> {
  const check = canExecute(featureId);
  
  if (!check.allowed) {
    return { ok: false, blocked: true, reason: check.reason, state: check.state };
  }
  
  try {
    const result = await fn(...(args || []));
    recordSuccess(featureId);
    return { ok: true, result, state: _getBreaker(featureId).state };
  } catch (e: any) {
    recordFailure(featureId, e.message);
    return { ok: false, error: e.message, state: _getBreaker(featureId).state };
  }
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, {
    activeBreakers: _breakers.size,
    openCircuits: Array.from(_breakers.values()).filter(b => b.state === STATES.OPEN).length
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeBreakers: _breakers.size,
    metrics: getMetrics(),
    defaultConfig: DEFAULT_CONFIG
  };
}

export function healthCheck() {
  let openCount = 0;
  _breakers.forEach(b => {
    if (b.state === STATES.OPEN) openCount++;
  });
  
  let status = 'HEALTHY';
  if (openCount > 0) status = 'DEGRADED';
  if (openCount > _breakers.size / 2) status = 'UNHEALTHY';
  
  return {
    status,
    moduleId: MODULE_ID,
    version: VERSION,
    openCircuits: openCount,
    totalCircuits: _breakers.size,
    metrics: _metrics,
    timestamp: Date.now()
  };
}


function destroy() { }
export default {
  MODULE_ID,
  VERSION,
  STATES,
  canExecute,
  recordSuccess,
  recordFailure,
  reset,
  configure,
  getStatus,
  getAllStatus,
  execute,
  executeAsync,
  getMetrics,
  setLogLevel,
  info,
  healthCheck
};
