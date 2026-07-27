/**
 * @file Circuit Breaker
 * @version 1.0.0
 * @module app-shell/utils/circuit-breaker
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone utility)
 * 
 * @provides VERSION, MODULE_ID, STATES
 * @provides create, execute, wrap, wrapWithFallback
 * @provides getState, isOpen, isClosed, getAll, getOpenCircuits
 * @provides reset, resetAll, configure, getConfig
 * @provides getMetrics, healthCheck, info
 * 
 * @description
 * Circuit breaker pattern implementation for fault tolerance.
 * Prevents cascading failures by temporarily disabling failing operations.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing).
 * 
 * @example
 * import { create, execute, wrap } from './circuit-breaker.js';
 * create('api', { failureThreshold: 5, timeout: 30000 });
 * const result = await execute('api', fetchData);
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-circuit-breaker';

export const STATES = Object.freeze({ CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' });

const _circuits = new Map();
const _config = { failureThreshold: 5, successThreshold: 2, timeout: 30000, resetTimeout: 60000, monitorInterval: 10000 };
const _metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, circuitsCreated: 0 };
const _subscribers: DynObj[] = [];

function Circuit(this: any, name: string, options: DynObj) {
  this.name = name;
  this.state = STATES.CLOSED;
  this.failures = 0;
  this.successes = 0;
  this.lastFailure = null;
  this.lastSuccess = null;
  this.openedAt = null;
  this.failureThreshold = options.failureThreshold || _config.failureThreshold;
  this.successThreshold = options.successThreshold || _config.successThreshold;
  this.timeout = options.timeout || _config.timeout;
  this.resetTimeout = options.resetTimeout || _config.resetTimeout;
}

Circuit.prototype.canExecute = function() {
  if (this.state === STATES.CLOSED) return true;
  if (this.state === STATES.OPEN) {
    if (Date.now() - this.openedAt >= this.resetTimeout) {
      this.state = STATES.HALF_OPEN;
      return true;
    }
    return false;
  }
  return true;
};

Circuit.prototype.recordSuccess = function() {
  this.lastSuccess = Date.now();
  this.successes++;
  if (this.state === STATES.HALF_OPEN) {
    if (this.successes >= this.successThreshold) {
      this.state = STATES.CLOSED;
      this.failures = 0;
      this.successes = 0;
    }
  } else {
    this.failures = 0;
  }
};

Circuit.prototype.recordFailure = function() {
  this.lastFailure = Date.now();
  this.failures++;
  this.successes = 0;
  if (this.state === STATES.HALF_OPEN) {
    this.state = STATES.OPEN;
    this.openedAt = Date.now();
  } else if (this.failures >= this.failureThreshold) {
    this.state = STATES.OPEN;
    this.openedAt = Date.now();
  }
};

Circuit.prototype.recordRejection = () => { _metrics.rejectedCalls++; };
Circuit.prototype.reset = function() { this.state = STATES.CLOSED; this.failures = 0; this.successes = 0; this.openedAt = null; };

export function create(name: string, options: DynObj) {
  options = options || {};
  if (_circuits.has(name)) return _circuits.get(name);
  const circuit = new (Circuit as DynObj)(name, options);
  _circuits.set(name, circuit);
  _metrics.circuitsCreated++;
  return circuit;
}

export function execute(name: string, fn: DynObj, fallback?: DynObj) {
  _metrics.totalCalls++;
  let circuit = _circuits.get(name);
  if (!circuit) circuit = create(name, {});

  if (!circuit.canExecute()) {
    circuit.recordRejection();
    if (fallback) return Promise.resolve(fallback());
    return Promise.reject(new Error(`Circuit ${name} is OPEN`));
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => { reject(new Error('Circuit timeout')); }, circuit.timeout);
  });

  const executionPromise = Promise.resolve().then(fn);

  return Promise.race([executionPromise, timeoutPromise])
    .then(result => {
      circuit.recordSuccess();
      _metrics.successfulCalls++;
      return result;
    })
    .catch(error => {
      circuit.recordFailure();
      _metrics.failedCalls++;
      if (fallback) return fallback(error);
      throw error;
    });
}

export function wrap(this: any, name: string, fn: DynObj) {
  return function() {
    const args = arguments;
    // @ts-expect-error strict migration — TS2683
    const self = this;
    return execute(name, () => fn.apply(self, args));
  };
}

export function wrapWithFallback(this: any, name: string, fn: DynObj, fallback: DynObj) {
  return function() {
    const args = arguments;
    // @ts-expect-error strict migration — TS2683
    const self = this;
    return execute(name, () => fn.apply(self, args), (err: DynObj) => fallback.call(self, err, args));
  };
}

export function get(name: string) { const c = _circuits.get(name); return c ? { name: c.name, state: c.state, failures: c.failures, successes: c.successes, lastFailure: c.lastFailure, lastSuccess: c.lastSuccess, openedAt: c.openedAt } : null; }

export function remove(name: string) {
  const c = _circuits.get(name);
  if (c) { _circuits.delete(name); _notifySubscribers('removed', { name }); return true; }
  return false;
}

export function getState(name: string) { const c = _circuits.get(name); return c ? c.state : null; }
export function isOpen(name: string) { return getState(name) === STATES.OPEN; }
export function isClosed(name: string) { return getState(name) === STATES.CLOSED; }

export function getAll() {
  const result: DynObj[] = [];
  _circuits.forEach((circuit, name) => {
    result.push({ name, state: circuit.state, failures: circuit.failures, successes: circuit.successes, lastFailure: circuit.lastFailure, lastSuccess: circuit.lastSuccess, openedAt: circuit.openedAt });
  });
  return result;
}

export function getOpenCircuits() { return getAll().filter(c => c.state === STATES.OPEN); }

export function reset(name: string) { const c = _circuits.get(name); if (c) { c.reset(); return true; } return false; }
export function resetAll() { _circuits.forEach(c => { c.reset(); }); }

export function configure(options: DynObj) {
  if (options.failureThreshold !== undefined) _config.failureThreshold = options.failureThreshold;
  if (options.successThreshold !== undefined) _config.successThreshold = options.successThreshold;
  if (options.timeout !== undefined) _config.timeout = options.timeout;
  if (options.resetTimeout !== undefined) _config.resetTimeout = options.resetTimeout;
}

export function setDefaultConfig(options: DynObj) { configure(options); }

export function getConfig() { return Object.assign({}, _config); }
export function getDefaultConfig() { return getConfig(); }

export function subscribe(callback: DynObj) {
  if (typeof callback === 'function') _subscribers.push(callback);
  return () => { const idx = _subscribers.indexOf(callback); if (idx >= 0) _subscribers.splice(idx, 1); };
}

function _notifySubscribers(event: string, data: DynObj) {
  _subscribers.forEach(cb => { try { cb(event, data); } catch (e) {} });
}

export function getMetrics() {
  return Object.assign({}, _metrics, { activeCircuits: _circuits.size, openCircuits: getOpenCircuits().length });
}

export function healthCheck() {
  const openCount = getOpenCircuits().length;
  const checks = { noOpenCircuits: openCount === 0, lowFailureRate: _metrics.totalCalls === 0 || (_metrics.failedCalls / _metrics.totalCalls) < 0.3, lowRejectionRate: _metrics.totalCalls === 0 || (_metrics.rejectedCalls / _metrics.totalCalls) < 0.1 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/3`, checks, openCircuits: getOpenCircuits(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), circuits: getAll(), metrics: getMetrics(), timestamp: Date.now() };
}


export function destroy() { resetAll(); _circuits.clear(); _subscribers.length = 0; }
export default { VERSION, MODULE_ID, STATES, create, get, remove, execute, wrap, wrapWithFallback, getState, isOpen, isClosed, getAll, getOpenCircuits, reset, resetAll, configure, setDefaultConfig, getConfig, getDefaultConfig, subscribe, getMetrics, healthCheck, info, destroy };
