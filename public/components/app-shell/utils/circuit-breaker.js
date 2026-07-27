const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-circuit-breaker";
const STATES = Object.freeze({ CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" });
const _circuits = /* @__PURE__ */ new Map();
const _config = { failureThreshold: 5, successThreshold: 2, timeout: 3e4, resetTimeout: 6e4, monitorInterval: 1e4 };
const _metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, circuitsCreated: 0 };
const _subscribers = [];
function Circuit(name, options) {
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
Circuit.prototype.recordRejection = () => {
  _metrics.rejectedCalls++;
};
Circuit.prototype.reset = function() {
  this.state = STATES.CLOSED;
  this.failures = 0;
  this.successes = 0;
  this.openedAt = null;
};
function create(name, options) {
  options = options || {};
  if (_circuits.has(name)) return _circuits.get(name);
  const circuit = new Circuit(name, options);
  _circuits.set(name, circuit);
  _metrics.circuitsCreated++;
  return circuit;
}
function execute(name, fn, fallback) {
  _metrics.totalCalls++;
  let circuit = _circuits.get(name);
  if (!circuit) circuit = create(name, {});
  if (!circuit.canExecute()) {
    circuit.recordRejection();
    if (fallback) return Promise.resolve(fallback());
    return Promise.reject(new Error(`Circuit ${name} is OPEN`));
  }
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Circuit timeout"));
    }, circuit.timeout);
  });
  const executionPromise = Promise.resolve().then(fn);
  return Promise.race([executionPromise, timeoutPromise]).then((result) => {
    circuit.recordSuccess();
    _metrics.successfulCalls++;
    return result;
  }).catch((error) => {
    circuit.recordFailure();
    _metrics.failedCalls++;
    if (fallback) return fallback(error);
    throw error;
  });
}
function wrap(name, fn) {
  return function() {
    const args = arguments;
    const self = this;
    return execute(name, () => fn.apply(self, args));
  };
}
function wrapWithFallback(name, fn, fallback) {
  return function() {
    const args = arguments;
    const self = this;
    return execute(name, () => fn.apply(self, args), (err) => fallback.call(self, err, args));
  };
}
function get(name) {
  const c = _circuits.get(name);
  return c ? { name: c.name, state: c.state, failures: c.failures, successes: c.successes, lastFailure: c.lastFailure, lastSuccess: c.lastSuccess, openedAt: c.openedAt } : null;
}
function remove(name) {
  const c = _circuits.get(name);
  if (c) {
    _circuits.delete(name);
    _notifySubscribers("removed", { name });
    return true;
  }
  return false;
}
function getState(name) {
  const c = _circuits.get(name);
  return c ? c.state : null;
}
function isOpen(name) {
  return getState(name) === STATES.OPEN;
}
function isClosed(name) {
  return getState(name) === STATES.CLOSED;
}
function getAll() {
  const result = [];
  _circuits.forEach((circuit, name) => {
    result.push({ name, state: circuit.state, failures: circuit.failures, successes: circuit.successes, lastFailure: circuit.lastFailure, lastSuccess: circuit.lastSuccess, openedAt: circuit.openedAt });
  });
  return result;
}
function getOpenCircuits() {
  return getAll().filter((c) => c.state === STATES.OPEN);
}
function reset(name) {
  const c = _circuits.get(name);
  if (c) {
    c.reset();
    return true;
  }
  return false;
}
function resetAll() {
  _circuits.forEach((c) => {
    c.reset();
  });
}
function configure(options) {
  if (options.failureThreshold !== void 0) _config.failureThreshold = options.failureThreshold;
  if (options.successThreshold !== void 0) _config.successThreshold = options.successThreshold;
  if (options.timeout !== void 0) _config.timeout = options.timeout;
  if (options.resetTimeout !== void 0) _config.resetTimeout = options.resetTimeout;
}
function setDefaultConfig(options) {
  configure(options);
}
function getConfig() {
  return Object.assign({}, _config);
}
function getDefaultConfig() {
  return getConfig();
}
function subscribe(callback) {
  if (typeof callback === "function") _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function _notifySubscribers(event, data) {
  _subscribers.forEach((cb) => {
    try {
      cb(event, data);
    } catch (e) {
    }
  });
}
function getMetrics() {
  return Object.assign({}, _metrics, { activeCircuits: _circuits.size, openCircuits: getOpenCircuits().length });
}
function healthCheck() {
  const openCount = getOpenCircuits().length;
  const checks = { noOpenCircuits: openCount === 0, lowFailureRate: _metrics.totalCalls === 0 || _metrics.failedCalls / _metrics.totalCalls < 0.3, lowRejectionRate: _metrics.totalCalls === 0 || _metrics.rejectedCalls / _metrics.totalCalls < 0.1 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/3`, checks, openCircuits: getOpenCircuits(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), circuits: getAll(), metrics: getMetrics(), timestamp: Date.now() };
}
function destroy() {
  resetAll();
  _circuits.clear();
  _subscribers.length = 0;
}
var circuit_breaker_default = { VERSION, MODULE_ID, STATES, create, get, remove, execute, wrap, wrapWithFallback, getState, isOpen, isClosed, getAll, getOpenCircuits, reset, resetAll, configure, setDefaultConfig, getConfig, getDefaultConfig, subscribe, getMetrics, healthCheck, info, destroy };
export {
  MODULE_ID,
  STATES,
  VERSION,
  configure,
  create,
  circuit_breaker_default as default,
  destroy,
  execute,
  get,
  getAll,
  getConfig,
  getDefaultConfig,
  getMetrics,
  getOpenCircuits,
  getState,
  healthCheck,
  info,
  isClosed,
  isOpen,
  remove,
  reset,
  resetAll,
  setDefaultConfig,
  subscribe,
  wrap,
  wrapWithFallback
};
