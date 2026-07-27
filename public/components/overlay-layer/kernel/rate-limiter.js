const VERSION = "1.0.0";
const MODULE_ID = "overlay-kernel-rate-limiter";
const DEFAULT_CONFIG = {
  maxPerSecond: 5,
  maxPerMinute: 30,
  burstAllowance: 3,
  windowMs: 1e3,
  minuteWindowMs: 6e4,
  bypassTypes: ["system-modal", "error-modal", "login-modal"],
  enabled: true
};
let _config = { ...DEFAULT_CONFIG };
let _state = {
  secondWindow: [],
  minuteWindow: [],
  blocked: 0,
  allowed: 0,
  lastReset: Date.now(),
  burstUsed: 0
};
function cleanupWindows() {
  const now = Date.now();
  _state.secondWindow = _state.secondWindow.filter(
    (ts) => now - ts < _config.windowMs
  );
  _state.minuteWindow = _state.minuteWindow.filter(
    (ts) => now - ts < _config.minuteWindowMs
  );
}
function isAllowed(typeId, options = {}) {
  if (!_config.enabled) {
    return { allowed: true, reason: "rate-limiter-disabled" };
  }
  if (typeId && _config.bypassTypes.includes(typeId)) {
    return { allowed: true, reason: "bypass-type", typeId };
  }
  if (options.bypassRateLimit) {
    return { allowed: true, reason: "bypass-forced" };
  }
  cleanupWindows();
  const now = Date.now();
  const secondCount = _state.secondWindow.length;
  const minuteCount = _state.minuteWindow.length;
  if (secondCount >= _config.maxPerSecond) {
    if (_state.burstUsed < _config.burstAllowance) {
      _state.burstUsed++;
      return {
        allowed: true,
        reason: "burst-allowance",
        burstRemaining: _config.burstAllowance - _state.burstUsed
      };
    }
    _state.blocked++;
    return {
      allowed: false,
      reason: "second-limit-exceeded",
      limit: _config.maxPerSecond,
      current: secondCount,
      retryAfter: _config.windowMs - (now - _state.secondWindow[0])
    };
  }
  if (minuteCount >= _config.maxPerMinute) {
    _state.blocked++;
    return {
      allowed: false,
      reason: "minute-limit-exceeded",
      limit: _config.maxPerMinute,
      current: minuteCount,
      retryAfter: _config.minuteWindowMs - (now - _state.minuteWindow[0])
    };
  }
  return {
    allowed: true,
    reason: "within-limits",
    secondRemaining: _config.maxPerSecond - secondCount,
    minuteRemaining: _config.maxPerMinute - minuteCount
  };
}
function record(typeId) {
  if (typeId && _config.bypassTypes.includes(typeId)) {
    return;
  }
  const now = Date.now();
  _state.secondWindow.push(now);
  _state.minuteWindow.push(now);
  _state.allowed++;
  if (_state.secondWindow.length === 1) {
    _state.burstUsed = 0;
  }
}
function checkAndRecord(typeId, options = {}) {
  const result = isAllowed(typeId, options);
  if (result.allowed) {
    record(typeId);
  }
  return result;
}
function getRemaining() {
  cleanupWindows();
  return {
    perSecond: Math.max(0, _config.maxPerSecond - _state.secondWindow.length),
    perMinute: Math.max(0, _config.maxPerMinute - _state.minuteWindow.length),
    burstRemaining: Math.max(0, _config.burstAllowance - _state.burstUsed)
  };
}
function getUsage() {
  cleanupWindows();
  return {
    secondWindow: _state.secondWindow.length,
    minuteWindow: _state.minuteWindow.length,
    secondLimit: _config.maxPerSecond,
    minuteLimit: _config.maxPerMinute,
    secondUsagePercent: _state.secondWindow.length / _config.maxPerSecond * 100,
    minuteUsagePercent: _state.minuteWindow.length / _config.maxPerMinute * 100
  };
}
function reset() {
  _state = {
    secondWindow: [],
    minuteWindow: [],
    blocked: 0,
    allowed: 0,
    lastReset: Date.now(),
    burstUsed: 0
  };
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  _config = { ..._config, ...config };
  if (_config.maxPerSecond < 1) _config.maxPerSecond = 1;
  if (_config.maxPerMinute < 1) _config.maxPerMinute = 1;
  if (_config.burstAllowance < 0) _config.burstAllowance = 0;
  return true;
}
function getConfig() {
  return { ..._config };
}
function enable() {
  _config.enabled = true;
}
function disable() {
  _config.enabled = false;
}
function isEnabled() {
  return _config.enabled;
}
function addBypassType(typeId) {
  if (!_config.bypassTypes.includes(typeId)) {
    _config.bypassTypes.push(typeId);
  }
}
function removeBypassType(typeId) {
  _config.bypassTypes = _config.bypassTypes.filter((t) => t !== typeId);
}
function getMetrics() {
  cleanupWindows();
  const total = _state.allowed + _state.blocked;
  const blockRate = total > 0 ? _state.blocked / total * 100 : 0;
  return {
    allowed: _state.allowed,
    blocked: _state.blocked,
    total,
    blockRate: `${blockRate.toFixed(1)}%`,
    currentSecondUsage: _state.secondWindow.length,
    currentMinuteUsage: _state.minuteWindow.length,
    burstUsed: _state.burstUsed,
    lastReset: _state.lastReset,
    uptime: Date.now() - _state.lastReset
  };
}
function healthCheck() {
  cleanupWindows();
  const usage = getUsage();
  const checks = {
    enabled: _config.enabled,
    configValid: _config.maxPerSecond > 0 && _config.maxPerMinute > 0,
    notOverloaded: usage.secondUsagePercent < 90,
    minuteHealthy: usage.minuteUsagePercent < 80
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!checks.enabled) status = "DEGRADED";
  else if (!checks.notOverloaded || !checks.minuteHealthy) status = "DEGRADED";
  else if (passed < total * 0.5) status = "UNHEALTHY";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    usage: {
      secondPercent: `${usage.secondUsagePercent.toFixed(0)}%`,
      minutePercent: `${usage.minuteUsagePercent.toFixed(0)}%`
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    config: getConfig(),
    usage: getUsage(),
    remaining: getRemaining(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var rate_limiter_default = {
  isAllowed,
  record,
  checkAndRecord,
  getRemaining,
  getUsage,
  reset,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  addBypassType,
  removeBypassType,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  addBypassType,
  checkAndRecord,
  configure,
  rate_limiter_default as default,
  disable,
  enable,
  getConfig,
  getMetrics,
  getRemaining,
  getUsage,
  healthCheck,
  info,
  isAllowed,
  isEnabled,
  record,
  removeBypassType,
  reset
};
