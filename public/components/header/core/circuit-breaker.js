import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.6.0-ES6";
const MODULE_ID = "header/core/circuit-breaker";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
MountCircuitBreaker.prototype.execute = async function(fn, fallback) {
  try {
    this.check();
  } catch (e) {
    if (fallback) return fallback();
    throw e;
  }
  try {
    var result = await fn();
    this.recordSuccess();
    return result;
  } catch (error) {
    this.recordFailure(error);
    if (fallback) return fallback();
    throw error;
  }
};
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
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
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
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
function MountCircuitBreaker(options) {
  options = options || {};
  this.failures = 0;
  this.maxFailures = options.maxFailures || 3;
  this.isOpen = false;
  this.lastFailureTime = null;
  this.resetTimeout = options.resetTimeout || 6e4;
  this._metrics = { checkCount: 0, failureCount: 0, resetCount: 0, lastCheckAt: null };
  _initPorts();
  _log("info", "MountCircuitBreaker created");
}
MountCircuitBreaker.prototype.check = function() {
  this._metrics.checkCount++;
  this._metrics.lastCheckAt = Date.now();
  if (this.isOpen) {
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    if (timeSinceFailure > this.resetTimeout) {
      this.reset();
      return true;
    }
    throw new Error("Circuit breaker aberto - muitas falhas de mount recentes");
  }
  return true;
};
MountCircuitBreaker.prototype.recordFailure = function() {
  this.failures++;
  this._metrics.failureCount++;
  this.lastFailureTime = Date.now();
  if (this.failures >= this.maxFailures) {
    this.isOpen = true;
    _log("warn", "Circuit breaker OPENED");
    return true;
  }
  return false;
};
MountCircuitBreaker.prototype.reset = function() {
  this.isOpen = false;
  this.failures = 0;
  this.lastFailureTime = null;
  this._metrics.resetCount++;
  _log("info", "Circuit breaker reset");
};
MountCircuitBreaker.prototype.getStatus = function() {
  return { isOpen: this.isOpen, failures: this.failures, maxFailures: this.maxFailures, lastFailureTime: this.lastFailureTime };
};
MountCircuitBreaker.prototype.setDebug = (enabled) => {
};
MountCircuitBreaker.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, this.getStatus());
};
MountCircuitBreaker.prototype.resetMetrics = function() {
  const self = this;
  const keys = Object.keys(this._metrics);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    self._metrics[k] = typeof self._metrics[k] === "number" ? 0 : null;
  }
};
MountCircuitBreaker.prototype.healthCheck = function() {
  const checks = { notOpen: !this.isOpen, belowMaxFailures: this.failures < this.maxFailures, hasResetTimeout: this.resetTimeout > 0, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  const issues = [];
  for (let j = 0; j < checkKeys.length; j++) {
    if (!checks[checkKeys[j]]) issues.push(checkKeys[j]);
  }
  return { status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
MountCircuitBreaker.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
MountCircuitBreaker.prototype.getVersion = () => VERSION;
function getVersion() {
  return VERSION;
}
function destroy() {
}
var circuit_breaker_default = MountCircuitBreaker;
export {
  MODULE_ID,
  MountCircuitBreaker,
  VERSION,
  circuit_breaker_default as default,
  getPorts,
  getVersion,
  injectPorts
};
