import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.8.0-P2-ENTERPRISE";
const MODULE_ID = "footer.core.circuit-breaker";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
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
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const STATES = { CLOSED: "closed", OPEN: "open", HALF_OPEN: "half-open" };
const _metrics = { successCount: 0, failureCount: 0, tripCount: 0, resetCount: 0 };
function FooterCircuitBreaker(options) {
  options = options || {};
  this._failureThreshold = options.failureThreshold || 3;
  this._resetTimeout = options.resetTimeout || 3e4;
  this._state = STATES.CLOSED;
  this._failureCount = 0;
  this._lastFailureTime = null;
  this._resetTimer = null;
}
FooterCircuitBreaker.prototype.execute = function(fn, fallback) {
  const self = this;
  if (this._state === STATES.OPEN) {
    const elapsed = Date.now() - this._lastFailureTime;
    if (elapsed >= this._resetTimeout) {
      this._state = STATES.HALF_OPEN;
      _log("info", "Transi\xE7\xE3o para HALF_OPEN");
    } else {
      _log("warn", "Circuit OPEN - rejeitando chamada");
      if (fallback) return Promise.resolve().then(() => fallback());
      return Promise.reject(new Error("Circuit breaker is OPEN"));
    }
  }
  return Promise.resolve().then(() => fn()).then((result) => {
    self._onSuccess();
    return result;
  }).catch((error) => {
    self._onFailure(error);
    if (fallback) return fallback();
    throw error;
  });
};
FooterCircuitBreaker.prototype._onSuccess = function() {
  _metrics.successCount++;
  if (this._state === STATES.HALF_OPEN) {
    this._state = STATES.CLOSED;
    this._failureCount = 0;
    _metrics.resetCount++;
    _log("info", "Circuit CLOSED ap\xF3s sucesso");
  }
};
FooterCircuitBreaker.prototype._onFailure = function(error) {
  _metrics.failureCount++;
  this._failureCount++;
  this._lastFailureTime = Date.now();
  _log("warn", `Falha ${this._failureCount}/${this._failureThreshold}:`, error.message);
  if (this._failureCount >= this._failureThreshold && this._state !== STATES.OPEN) {
    this._state = STATES.OPEN;
    _metrics.tripCount++;
    _log("error", "Circuit OPEN - threshold atingido");
  }
};
FooterCircuitBreaker.prototype.reset = function() {
  this._state = STATES.CLOSED;
  this._failureCount = 0;
  this._lastFailureTime = null;
  _metrics.resetCount++;
  _log("info", "Circuit resetado manualmente");
};
FooterCircuitBreaker.prototype.destroy = function() {
  this.reset();
};
FooterCircuitBreaker.prototype.getState = function() {
  return this._state;
};
FooterCircuitBreaker.prototype.isOpen = function() {
  return this._state === STATES.OPEN;
};
FooterCircuitBreaker.prototype.isClosed = function() {
  return this._state === STATES.CLOSED;
};
FooterCircuitBreaker.prototype.getMetrics = function() {
  return Object.assign({}, _metrics, { state: this._state, failureCount: this._failureCount });
};
FooterCircuitBreaker.prototype.setDebug = (enabled) => {
};
FooterCircuitBreaker.prototype.info = function() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, state: this._state, failureCount: this._failureCount, threshold: this._failureThreshold, metrics: Object.assign({}, _metrics), healthCheck: this.healthCheck(), portsInitialized: ps._initialized, timestamp: Date.now() };
};
FooterCircuitBreaker.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { notOpen: this._state !== STATES.OPEN, lowFailures: this._failureCount < this._failureThreshold, recentSuccess: _metrics.successCount > 0 || _metrics.failureCount === 0, portsInitialized: ps._initialized };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return { status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
function setDebug(enabled) {
}
function getVersion() {
  return VERSION;
}
const circuitBreaker = new FooterCircuitBreaker();
var circuit_breaker_default = FooterCircuitBreaker;
export {
  FooterCircuitBreaker,
  MODULE_ID,
  STATES,
  VERSION,
  circuitBreaker,
  circuit_breaker_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
