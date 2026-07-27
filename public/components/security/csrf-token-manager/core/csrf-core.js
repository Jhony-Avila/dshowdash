const VERSION = "2.1.0-ENTERPRISE-FIX";
const MODULE_ID = "csrf-token-manager-core";
let _token = null;
let _expiresAt = null;
let _lastRefresh = null;
let _metrics = { refreshes: 0, renewals: 0, errors: 0 };
const DEFAULT_MAX_AGE = 36e5;
let _maxAge = DEFAULT_MAX_AGE;
function setMaxAge(ms) {
  _maxAge = ms || DEFAULT_MAX_AGE;
}
function getToken() {
  return _token;
}
function setToken(token, expiresAt = null) {
  _token = token;
  _lastRefresh = Date.now();
  _expiresAt = expiresAt || _lastRefresh + _maxAge;
  _metrics.refreshes++;
  if (typeof window !== "undefined") {
    window.CSRF_TOKEN = token;
  }
}
function renewToken(newToken = null) {
  if (newToken) {
    setToken(newToken);
    _metrics.renewals++;
    return true;
  }
  if (_token) {
    _lastRefresh = Date.now();
    _expiresAt = _lastRefresh + _maxAge;
    _metrics.renewals++;
    return true;
  }
  return false;
}
function clearToken() {
  _token = null;
  _expiresAt = null;
  _lastRefresh = null;
  if (typeof window !== "undefined") {
    window.CSRF_TOKEN = null;
  }
}
function hasToken() {
  return !!_token;
}
function isFresh() {
  if (!_token) return false;
  if (!_expiresAt) return true;
  return Date.now() < _expiresAt;
}
function isStale() {
  if (!_token) return true;
  if (!_expiresAt) return false;
  const remaining = _expiresAt - Date.now();
  return remaining < _maxAge * 0.1;
}
function getStatus() {
  const now = Date.now();
  const age = _lastRefresh ? now - _lastRefresh : null;
  return {
    hasToken: !!_token,
    tokenPreview: _token ? `${_token.substring(0, 8)}...` : null,
    isFresh: isFresh(),
    isStale: isStale(),
    expiresAt: _expiresAt,
    lastRefresh: _lastRefresh,
    age,
    ageFormatted: age ? `${Math.round(age / 1e3)}s` : "N/A",
    remainingMs: _expiresAt ? Math.max(0, _expiresAt - now) : null
  };
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = {
    hasToken: !!_token,
    tokenFresh: isFresh(),
    notStale: !isStale()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: getStatus(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var csrf_core_default = {
  getToken,
  setToken,
  renewToken,
  clearToken,
  hasToken,
  isFresh,
  isStale,
  getStatus,
  setMaxAge,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearToken,
  csrf_core_default as default,
  getMetrics,
  getStatus,
  getToken,
  hasToken,
  healthCheck,
  info,
  isFresh,
  isStale,
  renewToken,
  setMaxAge,
  setToken
};
