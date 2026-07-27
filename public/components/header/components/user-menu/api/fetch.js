import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "7.7.0-ES6";
const MODULE_ID = "header.user-menu.api.fetch";
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger && logger[level]) logger[level].apply(logger, [`[${MODULE_ID}]`].concat(args));
}
function _debug() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function FetchAdapter(options) {
  if (!options) options = {};
  this.baseURL = options.baseURL || "/api";
  this.timeout = options.timeout || 1e4;
  this._csrfToken = null;
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
FetchAdapter.prototype.fetchCurrentUser = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  return fetch("/api/auth/check.php", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((result) => {
    const data = result.data || result;
    const session = data.session || result.session;
    if (!result.ok || !data.authenticated || !data.user) {
      _log("debug", "User not authenticated");
      self._metrics.errorCount++;
      return null;
    }
    if (session && session.csrf_token) {
      self._csrfToken = session.csrf_token;
      _log("debug", "CSRF token stored");
    }
    const user = data.user;
    self._metrics.successCount++;
    _log("debug", "User loaded:", user.name);
    return {
      id: user.id || user.user_id,
      name: user.name || user.full_name || "Usu\xE1rio",
      fullName: user.full_name || user.name,
      email: user.email,
      avatar: user.avatar_url || user.avatar,
      avatar_url: user.avatar_url || user.avatar,
      role: user.role || user.roles && user.roles[0] || "user",
      level: user.level,
      funcao: user.funcao,
      departamento: user.departamento
    };
  }).catch((error) => {
    self._metrics.errorCount++;
    _log("error", "fetchCurrentUser error:", error.message);
    return null;
  });
};
FetchAdapter.prototype.logout = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const getToken = self._csrfToken ? Promise.resolve() : fetch("/api/auth/check.php", { method: "GET", credentials: "include" }).then((resp) => {
    if (resp.ok) return resp.json();
    return {};
  }).then((data) => {
    if (data.data && data.data.session && data.data.session.csrf_token) self._csrfToken = data.data.session.csrf_token;
    else if (data.session && data.session.csrf_token) self._csrfToken = data.session.csrf_token;
  });
  return getToken.then(() => {
    const headers = { "Content-Type": "application/json" };
    if (self._csrfToken) headers["X-CSRF-Token"] = self._csrfToken;
    return fetch("/api/auth/logout.php", { method: "POST", credentials: "include", headers });
  }).then((response) => {
    self._metrics.successCount++;
    return response.ok;
  }).catch((error) => {
    self._metrics.errorCount++;
    _log("warn", "Logout error:", error.message);
    return false;
  });
};
FetchAdapter.prototype.get = function(endpoint) {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  return fetch(self.baseURL + endpoint, { signal: controller.signal, credentials: "include", headers: { "Content-Type": "application/json" } }).then((response) => {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    self._metrics.successCount++;
    _log("debug", "GET success:", endpoint);
    return response.json();
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    _log("warn", "GET failed (non-fatal)", { endpoint, error: error.message });
    return null;
  });
};
FetchAdapter.prototype.post = function(endpoint, body) {
  const self = this;
  if (!body) body = {};
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  return fetch(self.baseURL + endpoint, { method: "POST", signal: controller.signal, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((response) => {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    self._metrics.successCount++;
    _log("debug", "POST success:", endpoint);
    return response.json();
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    _log("warn", "POST failed (non-fatal)", { endpoint, error: error.message });
    return null;
  });
};
FetchAdapter.prototype.healthCheck = function() {
  const checks = { hasEndpoint: !!this.baseURL, hasCsrf: !!this._csrfToken, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 4, scoreDisplay: `${passed}/4`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
FetchAdapter.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, baseURL: this.baseURL, hasCsrf: !!this._csrfToken, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
FetchAdapter.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
FetchAdapter.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
function getVersion() {
  return VERSION;
}
function destroy() {
}
var fetch_default = FetchAdapter;
export {
  FetchAdapter,
  MODULE_ID,
  VERSION,
  fetch_default as default,
  getPorts,
  getVersion,
  injectPorts
};
