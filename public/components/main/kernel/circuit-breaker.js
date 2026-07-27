import { createLogger } from "/assets/js/core/logger-global/index.js";
const MODULE_ID = "main-kernel-circuit-breaker";
const _logger = createLogger(MODULE_ID);
const VERSION = "1.1.0-LOGGING";
const STATES = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
});
const DEFAULT_CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  halfOpenMaxAttempts: 3,
  logLevel: 1
};
const _breakers = /* @__PURE__ */ new Map();
let _logLevel = 1;
const _metrics = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function _log(level, msg, data) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold = typeof _logLevel !== "undefined" ? _logLevel : typeof _config !== "undefined" && _config && _config.logLevel ? _config.logLevel : 1;
  if (levelNum < threshold) return;
  const context = data !== void 0 ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else if (level === "debug") _logger.debug(msg, context);
  else _logger.info(msg, context);
}
function setLogLevel(level) {
  if (typeof level === "string") {
    _logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  } else if (typeof level === "number") {
    _logLevel = level;
  }
  return _logLevel;
}
function _getBreaker(featureId) {
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
  return _breakers.get(featureId);
}
function _transitionTo(breaker, featureId, newState) {
  const oldState = breaker.state;
  breaker.state = newState;
  if (newState === STATES.OPEN) {
    breaker.openedAt = Date.now();
    _metrics.circuitsOpened++;
    _log("warn", `OPENED for feature: ${featureId}`, void 0);
  } else if (newState === STATES.CLOSED && oldState !== STATES.CLOSED) {
    _metrics.circuitsClosed++;
    breaker.failures = 0;
    breaker.successes = 0;
    _log("info", `CLOSED for feature: ${featureId}`, void 0);
  }
}
function canExecute(featureId) {
  const breaker = _getBreaker(featureId);
  if (breaker.state === STATES.CLOSED) {
    return { allowed: true, state: breaker.state };
  }
  if (breaker.state === STATES.OPEN) {
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
      reason: `Circuit open, retry in ${Math.round((breaker.config.timeout - elapsed) / 1e3)}s`
    };
  }
  if (breaker.state === STATES.HALF_OPEN) {
    if (breaker.successes + breaker.failures < breaker.config.halfOpenMaxAttempts) {
      return { allowed: true, state: breaker.state };
    }
    _metrics.blockedCalls++;
    return { allowed: false, state: breaker.state, reason: "Half-open limit reached" };
  }
  return { allowed: true, state: breaker.state };
}
function recordSuccess(featureId) {
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
function recordFailure(featureId, error) {
  const breaker = _getBreaker(featureId);
  breaker.failures++;
  breaker.lastFailure = Date.now();
  breaker.lastError = typeof error === "string" ? error : error instanceof Error ? error.message : void 0;
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
function reset(featureId) {
  if (_breakers.has(featureId)) {
    const breaker = _breakers.get(featureId);
    breaker.state = STATES.CLOSED;
    breaker.failures = 0;
    breaker.successes = 0;
    breaker.openedAt = null;
    return { ok: true, reset: true };
  }
  return { ok: false, error: "Breaker not found" };
}
function configure(featureId, config) {
  const breaker = _getBreaker(featureId);
  breaker.config = Object.assign({}, DEFAULT_CONFIG, breaker.config, config);
  return { ok: true, config: breaker.config };
}
function getStatus(featureId) {
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
function getAllStatus() {
  const result = {};
  _breakers.forEach((breaker, featureId) => {
    result[featureId] = {
      state: breaker.state,
      failures: breaker.failures,
      successes: breaker.successes
    };
  });
  return result;
}
function execute(featureId, fn, args) {
  const check = canExecute(featureId);
  if (!check.allowed) {
    return { ok: false, blocked: true, reason: check.reason, state: check.state };
  }
  try {
    const result = fn(...args || []);
    recordSuccess(featureId);
    return { ok: true, result, state: _getBreaker(featureId).state };
  } catch (e) {
    recordFailure(featureId, e.message);
    return { ok: false, error: e.message, state: _getBreaker(featureId).state };
  }
}
async function executeAsync(featureId, fn, args) {
  const check = canExecute(featureId);
  if (!check.allowed) {
    return { ok: false, blocked: true, reason: check.reason, state: check.state };
  }
  try {
    const result = await fn(...args || []);
    recordSuccess(featureId);
    return { ok: true, result, state: _getBreaker(featureId).state };
  } catch (e) {
    recordFailure(featureId, e.message);
    return { ok: false, error: e.message, state: _getBreaker(featureId).state };
  }
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    activeBreakers: _breakers.size,
    openCircuits: Array.from(_breakers.values()).filter((b) => b.state === STATES.OPEN).length
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeBreakers: _breakers.size,
    metrics: getMetrics(),
    defaultConfig: DEFAULT_CONFIG
  };
}
function healthCheck() {
  let openCount = 0;
  _breakers.forEach((b) => {
    if (b.state === STATES.OPEN) openCount++;
  });
  let status = "HEALTHY";
  if (openCount > 0) status = "DEGRADED";
  if (openCount > _breakers.size / 2) status = "UNHEALTHY";
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
function destroy() {
}
var circuit_breaker_default = {
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
export {
  MODULE_ID,
  STATES,
  VERSION,
  canExecute,
  configure,
  circuit_breaker_default as default,
  execute,
  executeAsync,
  getAllStatus,
  getMetrics,
  getStatus,
  healthCheck,
  info,
  recordFailure,
  recordSuccess,
  reset,
  setLogLevel
};
