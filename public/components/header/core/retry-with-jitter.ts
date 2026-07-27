// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/retry-with-jitter
// PURPOSE: Retry com backoff exponencial e jitter para resiliencia
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   retryWithJitter(fn, opts) — executa funcao com retry e jitter
//   retryFetch(url, fetchOpts, retryOpts) — fetch com retry
//   retryJSON(url, fetchOpts, retryOpts) — fetch JSON com retry
//   retryWithCircuitBreaker(fn, breaker, opts) — retry integrado com circuit breaker
//   retryAll(operations, opts) — retry em lote com concorrencia
//   calculateDelay(attempt, base, max, expBase, jitter) — calcula delay
//   calculateJitter(delay, factor) — aplica jitter ao delay
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// EVENTS EMITTED:
//   header:retry:attempt — quando retry e executado
// ═══════════════════════════════════════════════════════════════
// Header - Retry With Jitter
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.1.0 - Ports auto-init no healthCheck
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/retry-with-jitter';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

let _metrics = { totalAttempts: 0, totalSuccesses: 0, totalFailures: 0, totalRetries: 0, totalAborted: 0, averageAttempts: 0 };
const DEFAULT_OPTIONS = { maxRetries: 3, baseDelay: 1000, maxDelay: 30000, jitterFactor: 0.3, exponentialBase: 2, retryOn: (null as unknown|null), onRetry: (null as unknown|null), signal: (null as string|null) };

// @ts-expect-error TS migration - TS2363
function calculateJitter(delay: number, jitterFactor: unknown) { const jitterRange = delay * jitterFactor; const jitter = (Math.random() * 2 - 1) * jitterRange; return Math.max(0, delay + jitter); }
// @ts-expect-error TS migration - TS2345
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, exponentialBase: unknown, jitterFactor: unknown) { const exponentialDelay = baseDelay * Math.pow(exponentialBase, attempt); const cappedDelay = Math.min(exponentialDelay, maxDelay); return Math.round(calculateJitter(cappedDelay, jitterFactor)); }

function shouldRetry(error: unknown, attempt: number, maxRetries: number, retryOn: unknown) {
  if (attempt >= maxRetries) return false;
  if (typeof retryOn === 'function') return retryOn(error, attempt);
  // @ts-expect-error TS migration - TS2339
  if (error.name === 'AbortError') return false;
  // @ts-expect-error TS migration - TS2339
  if (error.status && error.status >= 400 && error.status < 500) return false;
  return true;
}

function sleep(ms: unknown, signal: string) {
  return new Promise((resolve, reject) => {
    // @ts-expect-error TS migration - TS2769
    const timeoutId = setTimeout(resolve, ms);
    if (signal) {
      // @ts-expect-error TS migration - TS2339
      if (signal.aborted) { clearTimeout(timeoutId); reject(new DOMException('Aborted', 'AbortError')); return; }
      // @ts-expect-error TS migration - TS2339
      signal.addEventListener('abort', () => { clearTimeout(timeoutId); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    }
  });
}

function retryWithJitter(fn: Function, options: Record<string,unknown>) {
  _initPorts();
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const maxRetries = options.maxRetries;
  const baseDelay = options.baseDelay;
  const maxDelay = options.maxDelay;
  const jitterFactor = options.jitterFactor;
  const exponentialBase = options.exponentialBase;
  const retryOn = options.retryOn;
  const onRetry = options.onRetry;
  const signal = options.signal;
  const operationName = options.operationName || 'operation';
  let attempt = 0;
  const startTime = Date.now();
  
  function executeAttempt(): unknown {
    // @ts-expect-error TS migration - TS2339
    if (signal && signal.aborted) { _metrics.totalAborted++; return Promise.reject(new DOMException('Aborted', 'AbortError')); }
    attempt++;
    _metrics.totalAttempts++;
    return Promise.resolve(fn()).then(result => {
      _metrics.totalSuccesses++;
      _updateAverageAttempts(attempt);
      if (attempt > 1) { _log('info', operationName, 'sucesso após', attempt, 'tentativas'); }
      return { result, attempts: attempt, duration: Date.now() - startTime };
    }).catch(error => {
      // @ts-expect-error TS migration - TS2345
      if (!shouldRetry(error, attempt, maxRetries, retryOn)) { _metrics.totalFailures++; _log('error', operationName, 'falhou definitivamente após', attempt, 'tentativas:', error.message); throw error; }
      _metrics.totalRetries++;
      // @ts-expect-error TS migration - TS2345
      const delay = calculateDelay(attempt - 1, baseDelay, maxDelay, exponentialBase, jitterFactor);
      _log('warn', operationName, 'tentativa', attempt, 'falhou, retry em', `${delay}ms:`, error.message);
      if (typeof onRetry === 'function') { try { onRetry({ attempt, error, delay, operationName }); } catch (e: any) { _log('error', 'onRetry callback error:', e.message); } }
      const eventBus = _getPort('eventBus');
      if (eventBus && eventBus.emit) { eventBus.emit('header:retry:attempt', { operationName, attempt, error: error.message, delay, timestamp: Date.now() }); }
      // @ts-expect-error TS migration - TS2345
      return sleep(delay, signal).then(executeAttempt);
    });
  }
  return executeAttempt();
}

// @ts-expect-error TS migration - TS2322, TS2365
function _updateAverageAttempts(attempts: unknown) { const total = _metrics.totalSuccesses + _metrics.totalFailures; if (total === 0) { _metrics.averageAttempts = attempts; } else { _metrics.averageAttempts = ((_metrics.averageAttempts * (total - 1)) + attempts) / total; } }

function retryFetch(url: string, fetchOptions: Record<string,unknown>, retryOptions: Record<string,unknown>) {
  fetchOptions = fetchOptions || {};
  retryOptions = retryOptions || {};
  retryOptions.operationName = retryOptions.operationName || `fetch:${url.substring(0, 50)}`;
  return retryWithJitter(() => fetch(url, fetchOptions).then(response => { if (!response.ok) { const error = new Error(`HTTP ${response.status}`); (error as any).status = response.status; (error as any).response = response; throw error; } return response; }), retryOptions);
}

function retryJSON(url: string, fetchOptions: Record<string,unknown>, retryOptions: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  return retryFetch(url, fetchOptions, retryOptions).then((result: unknown) => result.result.json().then((data: Record<string,unknown>) => ({
    data,
    // @ts-expect-error TS migration - TS2339
    attempts: result.attempts,
    // @ts-expect-error TS migration - TS2339
    duration: result.duration
  })));
}

// @ts-expect-error TS migration - TS2349, TS2339
function retryWithCircuitBreaker(fn: Function, circuitBreaker: Record<string,unknown>, options: Record<string,unknown>) { options = options || {}; return circuitBreaker.execute(() => retryWithJitter(fn, options).then((result: unknown) => result.result), options.fallback); }

function retryAll(operations: unknown, options: Record<string,unknown>) {
  options = options || {};
  const concurrency = options.concurrency || 3;
  // @ts-expect-error strict migration — TS7034
  const results = [];
  // @ts-expect-error TS migration - TS2339
  const queue = operations.slice();
  let inFlight = 0;
  return new Promise(resolve => {
    function processNext() {
      // @ts-expect-error TS migration - TS2365
      while (inFlight < concurrency && queue.length > 0) {
        const op = queue.shift();
        inFlight++;
        // @ts-expect-error TS migration - TS2339, TS7005
        retryWithJitter(op.fn, Object.assign({}, options, op.options)).then((result: unknown) => { results.push({ success: true, result }); }).catch((error: unknown) => { results.push({ success: false, error }); }).finally(() => { inFlight--; if (queue.length > 0) { processNext(); } else if (inFlight === 0) { resolve(results); } });
      }
    }
    processNext();
  });
}

function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { totalAttempts: 0, totalSuccesses: 0, totalFailures: 0, totalRetries: 0, totalAborted: 0, averageAttempts: 0 }; }

function healthCheck() {
  _initPorts();
  const successRate = _metrics.totalAttempts > 0 ? _metrics.totalSuccesses / _metrics.totalAttempts : 1;
  const checks = { goodSuccessRate: successRate >= 0.7 || _metrics.totalAttempts === 0, lowRetryRate: _metrics.totalAttempts === 0 || (_metrics.totalRetries / _metrics.totalAttempts) < 0.5, lowAbortRate: _metrics.totalAttempts === 0 || (_metrics.totalAborted / _metrics.totalAttempts) < 0.1, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate: `${(successRate * 100).toFixed(1)}%`, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), defaultOptions: DEFAULT_OPTIONS, portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { retryWithJitter, retryFetch, retryJSON, retryWithCircuitBreaker, retryAll, calculateDelay, calculateJitter, getMetrics, resetMetrics, healthCheck, info, DEFAULT_OPTIONS };

export default { VERSION, MODULE_ID, retryWithJitter, retryFetch, retryJSON, retryWithCircuitBreaker, retryAll, calculateDelay, calculateJitter, getMetrics, resetMetrics, healthCheck, info };
