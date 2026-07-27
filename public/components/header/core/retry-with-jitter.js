import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/retry-with-jitter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
let _metrics = { totalAttempts: 0, totalSuccesses: 0, totalFailures: 0, totalRetries: 0, totalAborted: 0, averageAttempts: 0 };
const DEFAULT_OPTIONS = { maxRetries: 3, baseDelay: 1e3, maxDelay: 3e4, jitterFactor: 0.3, exponentialBase: 2, retryOn: null, onRetry: null, signal: null };
function calculateJitter(delay, jitterFactor) {
  const jitterRange = delay * jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  return Math.max(0, delay + jitter);
}
function calculateDelay(attempt, baseDelay, maxDelay, exponentialBase, jitterFactor) {
  const exponentialDelay = baseDelay * Math.pow(exponentialBase, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  return Math.round(calculateJitter(cappedDelay, jitterFactor));
}
function shouldRetry(error, attempt, maxRetries, retryOn) {
  if (attempt >= maxRetries) return false;
  if (typeof retryOn === "function") return retryOn(error, attempt);
  if (error.name === "AbortError") return false;
  if (error.status && error.status >= 400 && error.status < 500) return false;
  return true;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    }
  });
}
function retryWithJitter(fn, options) {
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
  const operationName = options.operationName || "operation";
  let attempt = 0;
  const startTime = Date.now();
  function executeAttempt() {
    if (signal && signal.aborted) {
      _metrics.totalAborted++;
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }
    attempt++;
    _metrics.totalAttempts++;
    return Promise.resolve(fn()).then((result) => {
      _metrics.totalSuccesses++;
      _updateAverageAttempts(attempt);
      if (attempt > 1) {
        _log("info", operationName, "sucesso ap\xF3s", attempt, "tentativas");
      }
      return { result, attempts: attempt, duration: Date.now() - startTime };
    }).catch((error) => {
      if (!shouldRetry(error, attempt, maxRetries, retryOn)) {
        _metrics.totalFailures++;
        _log("error", operationName, "falhou definitivamente ap\xF3s", attempt, "tentativas:", error.message);
        throw error;
      }
      _metrics.totalRetries++;
      const delay = calculateDelay(attempt - 1, baseDelay, maxDelay, exponentialBase, jitterFactor);
      _log("warn", operationName, "tentativa", attempt, "falhou, retry em", `${delay}ms:`, error.message);
      if (typeof onRetry === "function") {
        try {
          onRetry({ attempt, error, delay, operationName });
        } catch (e) {
          _log("error", "onRetry callback error:", e.message);
        }
      }
      const eventBus = _getPort("eventBus");
      if (eventBus && eventBus.emit) {
        eventBus.emit("header:retry:attempt", { operationName, attempt, error: error.message, delay, timestamp: Date.now() });
      }
      return sleep(delay, signal).then(executeAttempt);
    });
  }
  return executeAttempt();
}
function _updateAverageAttempts(attempts) {
  const total = _metrics.totalSuccesses + _metrics.totalFailures;
  if (total === 0) {
    _metrics.averageAttempts = attempts;
  } else {
    _metrics.averageAttempts = (_metrics.averageAttempts * (total - 1) + attempts) / total;
  }
}
function retryFetch(url, fetchOptions, retryOptions) {
  fetchOptions = fetchOptions || {};
  retryOptions = retryOptions || {};
  retryOptions.operationName = retryOptions.operationName || `fetch:${url.substring(0, 50)}`;
  return retryWithJitter(() => fetch(url, fetchOptions).then((response) => {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    return response;
  }), retryOptions);
}
function retryJSON(url, fetchOptions, retryOptions) {
  return retryFetch(url, fetchOptions, retryOptions).then((result) => result.result.json().then((data) => ({
    data,
    // @ts-expect-error TS migration - TS2339
    attempts: result.attempts,
    // @ts-expect-error TS migration - TS2339
    duration: result.duration
  })));
}
function retryWithCircuitBreaker(fn, circuitBreaker, options) {
  options = options || {};
  return circuitBreaker.execute(() => retryWithJitter(fn, options).then((result) => result.result), options.fallback);
}
function retryAll(operations, options) {
  options = options || {};
  const concurrency = options.concurrency || 3;
  const results = [];
  const queue = operations.slice();
  let inFlight = 0;
  return new Promise((resolve) => {
    function processNext() {
      while (inFlight < concurrency && queue.length > 0) {
        const op = queue.shift();
        inFlight++;
        retryWithJitter(op.fn, Object.assign({}, options, op.options)).then((result) => {
          results.push({ success: true, result });
        }).catch((error) => {
          results.push({ success: false, error });
        }).finally(() => {
          inFlight--;
          if (queue.length > 0) {
            processNext();
          } else if (inFlight === 0) {
            resolve(results);
          }
        });
      }
    }
    processNext();
  });
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { totalAttempts: 0, totalSuccesses: 0, totalFailures: 0, totalRetries: 0, totalAborted: 0, averageAttempts: 0 };
}
function healthCheck() {
  _initPorts();
  const successRate = _metrics.totalAttempts > 0 ? _metrics.totalSuccesses / _metrics.totalAttempts : 1;
  const checks = { goodSuccessRate: successRate >= 0.7 || _metrics.totalAttempts === 0, lowRetryRate: _metrics.totalAttempts === 0 || _metrics.totalRetries / _metrics.totalAttempts < 0.5, lowAbortRate: _metrics.totalAttempts === 0 || _metrics.totalAborted / _metrics.totalAttempts < 0.1, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate: `${(successRate * 100).toFixed(1)}%`, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), defaultOptions: DEFAULT_OPTIONS, portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var retry_with_jitter_default = { VERSION, MODULE_ID, retryWithJitter, retryFetch, retryJSON, retryWithCircuitBreaker, retryAll, calculateDelay, calculateJitter, getMetrics, resetMetrics, healthCheck, info };
export {
  DEFAULT_OPTIONS,
  MODULE_ID,
  VERSION,
  calculateDelay,
  calculateJitter,
  retry_with_jitter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  retryAll,
  retryFetch,
  retryJSON,
  retryWithCircuitBreaker,
  retryWithJitter
};
