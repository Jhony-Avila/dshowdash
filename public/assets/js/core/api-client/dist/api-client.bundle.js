import { isStrict as Q, recordViolation as ht } from "/core/runtime/enterprise/strict-mode.js";
var H = "api-client", dt = Object.freeze({ baseURL: "", timeout: 1e4, retries: 2, retryDelay: 1e3, backoffMultiplier: 2, maxRetryDelay: 8e3, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } }), U = Object.freeze({
  auth: { timeout: 5e3, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0, description: "Authentication operations" },
  default: { timeout: 1e4, retries: 2, retryDelay: 1e3, backoffMultiplier: 2, maxRetryDelay: 8e3, description: "Standard API operations" },
  longRun: { timeout: 3e4, retries: 1, retryDelay: 2e3, backoffMultiplier: 2, maxRetryDelay: 1e4, description: "Long running operations" },
  realtime: { timeout: 3e3, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0, description: "Real-time polling" }
}), J = /* @__PURE__ */ new Set([500, 502, 503, 504, 408, 429]), pt = /* @__PURE__ */ new Set([401, 403]), y = Object.freeze({ NETWORK_ERROR: "NETWORK_ERROR", REQUEST_TIMEOUT: "REQUEST_TIMEOUT", REQUEST_ABORTED: "REQUEST_ABORTED", HTTP_ERROR: "HTTP_ERROR", PARSE_ERROR: "PARSE_ERROR", AUTH_REQUIRED: "AUTH_REQUIRED", ACCESS_DENIED: "ACCESS_DENIED", VALIDATION_ERROR: "VALIDATION_ERROR", SERVER_ERROR: "SERVER_ERROR", UNKNOWN_ERROR: "UNKNOWN_ERROR" }), tt = Object.freeze({ 400: "Requisição inválida", 401: "Autenticação necessária", 403: "Acesso negado", 404: "Recurso não encontrado", 405: "Método não permitido", 408: "Timeout da requisição", 409: "Conflito de dados", 422: "Dados inválidos", 429: "Muitas requisições", 500: "Erro interno do servidor", 502: "Gateway inválido", 503: "Serviço indisponível", 504: "Gateway timeout" });
function n(r, t, e) {
  e || (e = {}), Error.call(this, t), this.name = "APIError", this.message = t, this.code = r, this.status = e.status || null, this.url = e.url || null, this.method = e.method || null, this.retryable = e.retryable || !1, this.timestamp = Date.now(), this.traceId = e.traceId || null, this.context = e.context || {};
}
n.prototype = Object.create(Error.prototype);
n.prototype.constructor = n;
n.prototype.toJSON = function() {
  return { name: this.name, code: this.code, message: this.message, status: this.status, url: this.url, method: this.method, retryable: this.retryable, timestamp: this.timestamp, traceId: this.traceId };
};
function D(r, t) {
  t || (t = {}), t.retryable = !0, n.call(this, y.NETWORK_ERROR, r || "Erro de conexão", t), this.name = "NetworkError";
}
D.prototype = Object.create(n.prototype);
D.prototype.constructor = D;
function b(r, t) {
  t || (t = {}), t.retryable = !0, n.call(this, y.REQUEST_TIMEOUT, "Timeout após " + r + "ms", t), this.name = "TimeoutError", this.timeout = r;
}
b.prototype = Object.create(n.prototype);
b.prototype.constructor = b;
function L(r, t, e) {
  e || (e = {});
  var i = tt[r] || t || "HTTP " + r, s = e.retryable !== void 0 ? e.retryable : !1;
  e.status = r, e.retryable = s, n.call(this, y.HTTP_ERROR, i, e), this.name = "HTTPError", this.statusText = t;
}
L.prototype = Object.create(n.prototype);
L.prototype.constructor = L;
function F(r) {
  r || (r = {}), r.retryable = !1, n.call(this, y.REQUEST_ABORTED, "Requisição cancelada", r), this.name = "AbortError";
}
F.prototype = Object.create(n.prototype);
F.prototype.constructor = F;
function z(r, t) {
  t || (t = {}), t.retryable = !1, n.call(this, y.PARSE_ERROR, r || "Erro ao processar resposta", t), this.name = "ParseError";
}
z.prototype = Object.create(n.prototype);
z.prototype.constructor = z;
function I(r) {
  r || (r = {}), r.status = 401, r.retryable = !1, n.call(this, y.AUTH_REQUIRED, "Autenticação necessária", r), this.name = "AuthRequiredError";
}
I.prototype = Object.create(n.prototype);
I.prototype.constructor = I;
function M(r) {
  r || (r = {}), r.status = 403, r.retryable = !1, n.call(this, y.ACCESS_DENIED, "Acesso negado", r), this.name = "AccessDeniedError";
}
M.prototype = Object.create(n.prototype);
M.prototype.constructor = M;
function N(r, t) {
  r || (r = []), t || (t = {}), t.status = 422, t.retryable = !1, n.call(this, y.VALIDATION_ERROR, "Dados inválidos", t), this.name = "ValidationError", this.validationErrors = r;
}
N.prototype = Object.create(n.prototype);
N.prototype.constructor = N;
function x(r, t, e) {
  e || (e = {}), e.status = r, e.retryable = !0, n.call(this, y.SERVER_ERROR, t || tt[r] || "Erro do servidor", e), this.name = "ServerError";
}
x.prototype = Object.create(n.prototype);
x.prototype.constructor = x;
function ft(r, t, e) {
  return e || (e = {}), r === 401 ? new I(e) : r === 403 ? new M(e) : r === 422 ? new N(e.errors || [], e) : r >= 500 ? new x(r, t, e) : new L(r, t, e);
}
var W = "4.0.0-FASE-B", B = "api-client-auth-adapter";
function mt() {
  return W;
}
function k() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("SecurityCSRF");
    if (r) return r;
  }
  return null;
}
function P() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("GlobalState");
    if (r) return r;
  }
  return null;
}
function et() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("RouterGlobal");
    if (r) return r;
  }
  return null;
}
function K() {
  var r = P();
  return r && r.isAuthenticated && r.isAuthenticated() ? "GlobalState" : typeof document < "u" && document.body && document.body.dataset.authReady === "true" ? "DOM" : "none";
}
function rt() {
  var r = P();
  if (!r) return null;
  try {
    if (r.getAuthContext) return r.getAuthContext();
    if (r.getSession) return r.getSession();
  } catch {
  }
  return null;
}
function j() {
  var r = P();
  return r && r.isAuthenticated ? r.isAuthenticated() : typeof document < "u" ? document.body && document.body.dataset.authReady === "true" : !1;
}
function $() {
  var r = rt();
  return r && (r.userId || (r.user ? r.user.id : null)) || null;
}
function G() {
  var r = et();
  if (r && r.current)
    try {
      var t = r.current();
      return { currentRoute: t && t.path || "/", activePanel: t && t.panel || null };
    } catch {
    }
  var e = P();
  if (e && e.getState)
    try {
      var i = e.getState();
      return { currentRoute: i && i.navigation && i.navigation.currentRoute || "/", activePanel: i && i.navigation && i.navigation.activePanel || null };
    } catch {
    }
  return { currentRoute: "/", activePanel: null };
}
function it() {
  var r = k();
  if (r && r.getAuthHeaders)
    try {
      return r.getAuthHeaders();
    } catch {
    }
  return {};
}
function ot() {
  var r = k();
  return r && r.getToken ? r.getToken() : null;
}
function yt(r, t) {
  t || (t = {});
  var e = k();
  if (!e || !e.emitLoginRequired) return !1;
  var i = G(), s = Object.assign({}, t, i, { userId: $(), timestamp: Date.now() });
  return r === 401 ? (e.emitLoginRequired("api-401", s), !0) : r === 403 && !j() ? (e.emitLoginRequired("api-403-unauthenticated", s), !0) : !1;
}
function Et(r, t) {
  t || (t = {});
  var e = k();
  if (e && e.emitLoginRequired) {
    var i = G();
    return e.emitLoginRequired(r, Object.assign({}, t, i, { source: B, timestamp: Date.now() }));
  }
  return !1;
}
function Rt() {
  var r = k(), t = P(), e = et(), i = Q();
  return {
    version: W,
    moduleId: B,
    authSource: K(),
    isAuthenticated: j(),
    userId: $(),
    hasCSRF: !!ot(),
    hasSecurityCSRF: !!r,
    hasGlobalState: !!t,
    hasRouter: !!e,
    navigation: G(),
    strictMode: i,
    // v3.3.0: Indica se está usando Core.windowAdapter (único em strict)
    resolutionMethod: typeof window < "u" && window.Core && window.Core.windowAdapter ? "Core.windowAdapter" : i ? "none (strict)" : "window.fallback"
  };
}
function wt() {
  var r = Q(), t = !!(typeof window < "u" && window.Core && window.Core.windowAdapter);
  return {
    status: t ? "HEALTHY" : r ? "DEGRADED" : "HEALTHY",
    moduleId: B,
    version: W,
    strictMode: r,
    checks: {
      getAuthSourceReady: typeof K == "function",
      isAuthenticatedReady: typeof j == "function",
      getAuthHeadersReady: typeof it == "function",
      coreWindowAdapterAvailable: t,
      strictModeCompliant: !r || t
    }
  };
}
var O = {
  getVersion: mt,
  getAuthSource: K,
  getSessionData: rt,
  isAuthenticated: j,
  getUserId: $,
  getNavigationContext: G,
  getAuthHeaders: it,
  getCSRFToken: ot,
  handleAuthError: yt,
  emitLoginRequired: Et,
  info: Rt,
  healthCheck: wt
};
const X = "api-client-http", Y = "3.0.2-P13-COMPLIANT";
function Z() {
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function gt() {
  return typeof window < "u" && window.TelemetryCore ? window.TelemetryCore : null;
}
class Tt {
  constructor(t = {}) {
    this.config = { ...dt, ...t }, this.authProvider = t.authProvider || O, this.activeControllers = /* @__PURE__ */ new Map(), this.metrics = { total: 0, success: 0, errors: 0, retries: 0, authErrors: 0, networkErrors: 0, timeoutErrors: 0, totalTime: 0, avgTime: 0, byEndpoint: {} }, this.isInitialized = !0, this.destroyed = !1, this.initTimestamp = Date.now();
  }
  getVersion() {
    return Y;
  }
  _createResponse(t, e, i = null, s = {}, o = []) {
    return { ok: t, success: t && e >= 200 && e < 300, status: e, data: i, meta: { ...s, timestamp: Date.now() }, errors: Array.isArray(o) ? o : [o].filter(Boolean) };
  }
  _updateEndpointMetrics(t, e, i, s) {
    this.metrics.byEndpoint[t] || (this.metrics.byEndpoint[t] = { total: 0, success: 0, errors: 0, lastStatus: null, lastDuration: null, avgTime: 0, totalTime: 0 });
    const o = this.metrics.byEndpoint[t];
    o.total++, o.totalTime += i, o.avgTime = Math.round(o.totalTime / o.total), o.lastStatus = s, o.lastDuration = i, e ? o.success++ : o.errors++;
  }
  _updateGlobalMetrics(t, e) {
    this.metrics.total++, this.metrics.totalTime += e, this.metrics.avgTime = Math.round(this.metrics.totalTime / this.metrics.total), t ? this.metrics.success++ : this.metrics.errors++;
  }
  _track(t, e = {}) {
    const i = gt();
    if (i != null && i.track)
      try {
        i.track(`${X}:${t}`, e);
      } catch {
      }
  }
  _getProfileConfig(t = "default") {
    return U[t] || U.default;
  }
  async _fetchWithTimeout(t, e, i) {
    const s = new AbortController(), o = Z();
    this.activeControllers.set(o, s);
    const E = setTimeout(() => {
      s.abort();
    }, i);
    try {
      const p = await fetch(t, { ...e, signal: s.signal });
      return clearTimeout(E), p;
    } catch (p) {
      throw clearTimeout(E), p.name === "AbortError" ? new b(i, { url: t, method: e.method }) : p;
    } finally {
      this.activeControllers.delete(o);
    }
  }
  async request(t, e = {}) {
    var i, s, o, E;
    if (this.destroyed) return this._createResponse(!1, 0, null, {}, ["Client destroyed"]);
    const p = Date.now(), c = Z(), l = e.method || "GET", R = e.profile || "default", u = this._getProfileConfig(R), v = e.timeout || u.timeout, d = e.retries ?? u.retries, w = e.retryDelay || u.retryDelay, S = e.backoffMultiplier || u.backoffMultiplier, nt = e.maxRetryDelay || u.maxRetryDelay, at = ((s = (i = this.authProvider) == null ? void 0 : i.getAuthHeaders) == null ? void 0 : s.call(i)) || {}, ct = { ...this.config.headers, ...at, ...e.headers };
    let A = e.body;
    A && typeof A == "object" && !(A instanceof FormData) && (A = JSON.stringify(A));
    const ut = { method: l, headers: ct, body: ["GET", "HEAD"].includes(l) ? void 0 : A, credentials: e.credentials || this.config.credentials, cache: e.cache || this.config.cache }, f = new URL(t, window.location.origin).pathname;
    let a = null, m = 0, q = w;
    for (; m <= d; )
      try {
        this._track("request:start", { url: f, method: l, attempt: m, profile: R, traceId: c });
        const h = await this._fetchWithTimeout(t, ut, v), g = Date.now() - p, T = await this._processResponse(h, { url: t, endpoint: f, method: l, traceId: c, latency: g, attempt: m, profile: R });
        return this._updateEndpointMetrics(f, T.ok, g, T.status), this._updateGlobalMetrics(T.ok, g), this._track("request:complete", { url: f, method: l, status: T.status, ok: T.ok, latency: g, attempt: m, traceId: c }), T;
      } catch (h) {
        a = h;
        const g = Date.now() - p;
        if (h instanceof b ? (this.metrics.timeoutErrors++, this._track("request:timeout", { url: f, method: l, timeout: v, attempt: m, traceId: c })) : (h.name === "TypeError" || (o = h.message) != null && o.includes("fetch")) && (this.metrics.networkErrors++, this._track("request:network-error", { url: f, method: l, error: h.message, attempt: m, traceId: c }), a = new D(h.message, { url: t, method: l, traceId: c })), m < d && (h instanceof b || h instanceof D || h.status && J.has(h.status))) {
          this.metrics.retries++, this._track("request:retry", { url: f, method: l, attempt: m, delay: q, traceId: c }), await new Promise((lt) => setTimeout(lt, q)), q = Math.min(q * S, nt), m++;
          continue;
        }
        return this._updateEndpointMetrics(f, !1, g, a.status || 0), this._updateGlobalMetrics(!1, g), this._track("request:error", { url: f, method: l, error: a.message, code: a.code, status: a.status, attempt: m, traceId: c }), this._createResponse(!1, a.status || 0, null, { traceId: c, latency: g, error: ((E = a.toJSON) == null ? void 0 : E.call(a)) || { message: a.message } }, [a.message]);
      }
    const V = Date.now() - p;
    return this._updateEndpointMetrics(f, !1, V, (a == null ? void 0 : a.status) || 0), this._updateGlobalMetrics(!1, V), this._createResponse(!1, (a == null ? void 0 : a.status) || 0, null, { traceId: c, latency: V, retriesExhausted: !0 }, [(a == null ? void 0 : a.message) || "Max retries exceeded"]);
  }
  async _processResponse(t, e) {
    var i, s;
    const { status: o, statusText: E, ok: p } = t, { url: c, endpoint: l, method: R, traceId: u, latency: v } = e;
    if (pt.has(o)) {
      this.metrics.authErrors++, (s = (i = this.authProvider) == null ? void 0 : i.handleAuthError) == null || s.call(i, o, { url: c, endpoint: l, method: R, traceId: u });
      const w = o === 401 ? new I({ url: c, method: R, traceId: u }) : new M({ url: c, method: R, traceId: u });
      return this._createResponse(!1, o, null, { traceId: u, latency: v }, [w.message]);
    }
    let d = null;
    try {
      (t.headers.get("content-type") || "").includes("application/json") ? d = await t.json() : d = await t.text();
    } catch (w) {
      this._track("response:parse-error", { url: l, error: w.message, traceId: u });
    }
    if (!p) {
      const w = ft(o, E, { url: c, method: R, traceId: u, retryable: J.has(o) }), S = (d == null ? void 0 : d.errors) || (d == null ? void 0 : d.error) || [w.message];
      return this._createResponse(!1, o, d, { traceId: u, latency: v, statusText: E }, Array.isArray(S) ? S : [S]);
    }
    return this._createResponse(!0, o, d, { traceId: u, latency: v }, []);
  }
  cancelAll() {
    this.activeControllers.forEach((t, e) => {
      try {
        t.abort();
      } catch {
      }
    }), this.activeControllers.clear(), this._track("requests:cancelled-all", { count: this.activeControllers.size });
  }
  getMetrics() {
    const t = this.metrics.total > 0 ? (this.metrics.success / this.metrics.total * 100).toFixed(2) : "0.00", e = this.metrics.total > 0 ? (this.metrics.authErrors / this.metrics.total * 100).toFixed(2) : "0.00";
    return { total: this.metrics.total, success: this.metrics.success, errors: this.metrics.errors, successRate: parseFloat(t), authErrors: this.metrics.authErrors, authErrorRate: parseFloat(e), networkErrors: this.metrics.networkErrors, timeoutErrors: this.metrics.timeoutErrors, retries: this.metrics.retries, avgTime: this.metrics.avgTime, endpointsTracked: Object.keys(this.metrics.byEndpoint).length, uptime: Date.now() - this.initTimestamp };
  }
  getEndpointMetrics(t = null) {
    return t ? this.metrics.byEndpoint[t] || null : { ...this.metrics.byEndpoint };
  }
  resetMetrics() {
    this.metrics = { total: 0, success: 0, errors: 0, retries: 0, authErrors: 0, networkErrors: 0, timeoutErrors: 0, totalTime: 0, avgTime: 0, byEndpoint: {} }, this._track("metrics:reset");
  }
  healthCheck() {
    const t = this.getMetrics(), e = [];
    return t.authErrorRate > 30 && e.push("High auth error rate"), t.networkErrors > 10 && e.push("Multiple network errors"), t.avgTime > 5e3 && e.push("High average response time"), { healthy: e.length === 0 && !this.destroyed, version: Y, moduleId: X, isInitialized: this.isInitialized, destroyed: this.destroyed, activeRequests: this.activeControllers.size, successRate: t.successRate, authErrorRate: t.authErrorRate, networkErrors: t.networkErrors, retries: t.retries, avgTime: t.avgTime, endpointsTracked: t.endpointsTracked, issues: e.length > 0 ? e : null, uptime: t.uptime };
  }
  destroy() {
    this.cancelAll(), this.destroyed = !0, this._track("client:destroyed");
  }
}
const C = "3.1.0-STRICT";
class st {
  constructor(t = {}) {
    this.http = new Tt({
      ...t,
      authProvider: t.authProvider || O
    }), this.instanceId = t.instanceId || "api-client-default", this.config = t, this.destroyed = !1;
  }
  getVersion() {
    return C;
  }
  // === HTTP METHODS ===
  async get(t, e = {}) {
    return this.http.request(t, { ...e, method: "GET" });
  }
  async post(t, e = {}, i = {}) {
    return this.http.request(t, { ...i, method: "POST", body: e });
  }
  async put(t, e = {}, i = {}) {
    return this.http.request(t, { ...i, method: "PUT", body: e });
  }
  async patch(t, e = {}, i = {}) {
    return this.http.request(t, { ...i, method: "PATCH", body: e });
  }
  async delete(t, e = {}) {
    return this.http.request(t, { ...e, method: "DELETE" });
  }
  // === PROFILES SHORTCUTS ===
  // Profile: auth (login, logout, refresh)
  get auth() {
    const t = this;
    return {
      async get(e, i = {}) {
        return t.http.request(e, { ...i, method: "GET", profile: "auth" });
      },
      async post(e, i = {}, s = {}) {
        return t.http.request(e, { ...s, method: "POST", body: i, profile: "auth" });
      }
    };
  }
  // Profile: longRun (relatórios, exports)
  get longRun() {
    const t = this;
    return {
      async get(e, i = {}) {
        return t.http.request(e, { ...i, method: "GET", profile: "longRun" });
      },
      async post(e, i = {}, s = {}) {
        return t.http.request(e, { ...s, method: "POST", body: i, profile: "longRun" });
      }
    };
  }
  // Profile: realtime (polling)
  get realtime() {
    const t = this;
    return {
      async get(e, i = {}) {
        return t.http.request(e, { ...i, method: "GET", profile: "realtime" });
      }
    };
  }
  // === CONTROLE ===
  cancelAll() {
    this.http.cancelAll();
  }
  getMetrics() {
    return this.http.getMetrics();
  }
  getEndpointMetrics(t = null) {
    return this.http.getEndpointMetrics(t);
  }
  resetMetrics() {
    this.http.resetMetrics();
  }
  // === HEALTH CHECK ===
  healthCheck() {
    const t = this.http.healthCheck(), e = O.info(), i = [];
    return t.healthy || i.push("HTTP client unhealthy"), e.hasCSRF || i.push("CSRF token missing"), t.authErrorRate > 30 && i.push("High auth error rate"), {
      healthy: i.length === 0 && !this.destroyed,
      version: C,
      moduleId: H,
      instanceId: this.instanceId,
      destroyed: this.destroyed,
      http: t,
      auth: e,
      issues: i.length > 0 ? i : null,
      timestamp: Date.now()
    };
  }
  // === INFO ===
  info() {
    return {
      name: H,
      version: C,
      moduleId: H,
      instanceId: this.instanceId,
      isInitialized: this.http.isInitialized,
      destroyed: this.destroyed,
      profiles: Object.keys(U),
      authAdapter: O.info(),
      metrics: this.getMetrics(),
      uptime: this.http.initTimestamp ? Date.now() - this.http.initTimestamp : 0,
      timestamp: Date.now()
    };
  }
  status() {
    var t;
    return {
      initialized: this.http.isInitialized,
      destroyed: this.destroyed,
      activeRequests: ((t = this.http.activeControllers) == null ? void 0 : t.size) || 0,
      ...this.getMetrics()
    };
  }
  // === DEBUG ===
  get debug() {
    const t = this;
    return {
      getMetrics: () => t.getMetrics(),
      getEndpointMetrics: (e) => t.getEndpointMetrics(e),
      byEndpoint: () => t.http.metrics.byEndpoint,
      getAuthInfo: () => O.info(),
      getConfig: () => ({ ...t.config, profiles: U }),
      healthCheck: () => t.healthCheck(),
      resetMetrics: () => t.resetMetrics()
    };
  }
  // === DESTROY ===
  destroy() {
    this.http.destroy(), this.destroyed = !0;
  }
}
const _ = new st({ instanceId: "api-client-singleton" });
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.apiClient = {
  getVersion: () => C,
  info: () => _.info(),
  healthCheck: () => _.healthCheck(),
  getMetrics: () => _.getMetrics(),
  getEndpointMetrics: (r) => _.getEndpointMetrics(r),
  status: () => _.status()
}, Q() ? ht("GLOBAL_EXPOSURE_BLOCKED", {
  moduleId: H,
  globals: ["API", "APIClient", "APIVersion"],
  reason: "Strict mode active - use ES modules import"
}) : (window.API = _, window.APIClient = st, window.APIVersion = C));
export {
  _ as API,
  st as APIClient,
  O as AuthAdapter,
  H as MODULE_ID,
  U as REQUEST_PROFILES,
  C as VERSION,
  _ as default
};
