import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-FIX";
const MODULE_ID = "session-api-client";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const config = { endpoints: { check: "/api/auth/check.php", login: "/api/auth/login.php", logout: "/api/auth/logout.php", refresh: "/api/auth/refresh.php" }, timeout: 1e4 };
const _metrics = { requests: 0, checkRequests: 0, loginRequests: 0, logoutRequests: 0, refreshRequests: 0, successfulRequests: 0, failedRequests: 0, timeouts: 0, errors: 0 };
function getTracker() {
  _initPorts();
  const sm = _getPort("sessionManager");
  if (sm && sm.debug && sm.debug.tracker) return sm.debug.tracker;
  return { track() {
  } };
}
function configure(options) {
  if (!options) options = {};
  if (options.endpoints) Object.assign(config.endpoints, options.endpoints);
  if (options.timeout) config.timeout = options.timeout;
}
function fetchWithTimeout(url, options, timeout) {
  _metrics.requests++;
  const controller = new AbortController();
  const timeoutMs = timeout || config.timeout;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return fetch(url, Object.assign({}, options, { signal: controller.signal, credentials: "include" })).then((response) => {
    clearTimeout(timeoutId);
    return response;
  }).catch((error) => {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      _metrics.timeouts++;
      throw new Error("Timeout");
    }
    _metrics.errors++;
    throw error;
  });
}
function unwrapApiResponse(data) {
  if (data && data.ok === true && data.data && typeof data.data === "object") {
    return data.data;
  }
  return data;
}
function checkSession(options) {
  if (!options) options = {};
  _metrics.checkRequests++;
  const tracker = getTracker();
  if (tracker.track) tracker.track("session:api:check:start");
  return fetchWithTimeout(config.endpoints.check, { method: "GET", headers: { "Accept": "application/json" }, cache: "no-store" }, options.timeout).then((response) => {
    if (response.status === 401) {
      _metrics.successfulRequests++;
      if (tracker.track) tracker.track("session:api:check:unauthorized");
      return { ok: true, authenticated: false, user: null };
    }
    if (!response.ok) {
      _metrics.failedRequests++;
      if (tracker.track) tracker.track("session:api:check:error", { status: response.status });
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return response.json().then((rawData) => {
      const data = unwrapApiResponse(rawData);
      const authenticated = data.authenticated === true;
      _metrics.successfulRequests++;
      if (tracker.track) tracker.track("session:api:check:complete", { authenticated });
      return {
        ok: true,
        authenticated,
        user: data.user || null,
        csrf: data.session && data.session.csrf_token || data.csrf || data.csrfToken || null,
        token: data.session && data.session.token || data.token || null,
        expiresIn: data.session && data.session.expires_in || data.expires_in || data.expiresIn || null
      };
    });
  }).catch((error) => {
    _metrics.failedRequests++;
    if (tracker.track) tracker.track("session:api:check:error", { error: error.message });
    return { ok: false, error: error.message };
  });
}
function login(username, password, options) {
  if (!options) options = {};
  _metrics.loginRequests++;
  const tracker = getTracker();
  if (tracker.track) tracker.track("session:api:login:start");
  const body = { username, password };
  if (options.extra) Object.assign(body, options.extra);
  return fetchWithTimeout(config.endpoints.login, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(body) }, options.timeout).then((response) => {
    if (!response.ok) {
      _metrics.failedRequests++;
      return response.json().catch(() => ({})).then((errorData) => {
        if (tracker.track) tracker.track("session:api:login:failed", { status: response.status });
        return { ok: false, error: errorData.error || errorData.message || `HTTP ${response.status}` };
      });
    }
    return response.json().then((rawData) => {
      const data = unwrapApiResponse(rawData);
      if (rawData.ok === false || data.success === false) {
        _metrics.failedRequests++;
        if (tracker.track) tracker.track("session:api:login:failed", { error: data.error || rawData.error });
        return { ok: false, error: data.error || rawData.error || data.message || "Login failed" };
      }
      _metrics.successfulRequests++;
      if (tracker.track) tracker.track("session:api:login:success");
      return {
        ok: true,
        user: data.user || null,
        token: data.session && data.session.token || data.token || null,
        csrf: data.session && data.session.csrf_token || data.csrf || data.csrfToken || null,
        expiresIn: data.session && data.session.expires_in || data.expires_in || data.expiresIn || 604800
      };
    });
  }).catch((error) => {
    _metrics.failedRequests++;
    if (tracker.track) tracker.track("session:api:login:error", { error: error.message });
    return { ok: false, error: error.message };
  });
}
function logout(options) {
  if (!options) options = {};
  _metrics.logoutRequests++;
  const tracker = getTracker();
  if (tracker.track) tracker.track("session:api:logout:start");
  return fetchWithTimeout(config.endpoints.logout, { method: "POST", headers: { "Accept": "application/json" } }, options.timeout).then(() => {
    _metrics.successfulRequests++;
    if (tracker.track) tracker.track("session:api:logout:complete");
    return { ok: true };
  }).catch((error) => {
    _metrics.failedRequests++;
    if (tracker.track) tracker.track("session:api:logout:error", { error: error.message });
    return { ok: true, serverError: error.message };
  });
}
function refresh(options) {
  if (!options) options = {};
  _metrics.refreshRequests++;
  const tracker = getTracker();
  if (tracker.track) tracker.track("session:api:refresh:start");
  return fetchWithTimeout(config.endpoints.refresh, { method: "POST", headers: { "Accept": "application/json" } }, options.timeout).then((response) => {
    if (!response.ok) {
      _metrics.failedRequests++;
      if (tracker.track) tracker.track("session:api:refresh:failed", { status: response.status });
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return response.json().then((rawData) => {
      const data = unwrapApiResponse(rawData);
      _metrics.successfulRequests++;
      if (tracker.track) tracker.track("session:api:refresh:success");
      return {
        ok: true,
        token: data.session && data.session.token || data.token || null,
        csrf: data.session && data.session.csrf_token || data.csrf || null,
        expiresIn: data.session && data.session.expires_in || data.expires_in || data.expiresIn || null
      };
    });
  }).catch((error) => {
    _metrics.failedRequests++;
    if (tracker.track) tracker.track("session:api:refresh:error", { error: error.message });
    return { ok: false, error: error.message };
  });
}
function getVersion() {
  return VERSION;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, config: { endpoints: Object.assign({}, config.endpoints), timeout: config.timeout }, metrics: Object.assign({}, _metrics), successRate: _metrics.requests > 0 ? `${(_metrics.successfulRequests / _metrics.requests * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const checks = { endpointsDefined: Object.keys(config.endpoints).length >= 4, timeoutValid: config.timeout > 0 && config.timeout <= 6e4, lowTimeoutRate: _metrics.requests === 0 || _metrics.timeouts / _metrics.requests < 0.1, lowErrorRate: _metrics.requests === 0 || _metrics.errors / _metrics.requests < 0.2, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed === total, checks, portsInitialized: ps._initialized, totalRequests: _metrics.requests, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const SessionAPIClient = { configure, checkSession, login, logout, refresh, getVersion, info, healthCheck, injectPorts, getPorts };
var client_default = SessionAPIClient;
export {
  MODULE_ID,
  SessionAPIClient,
  VERSION,
  client_default as default,
  getPorts,
  injectPorts
};
