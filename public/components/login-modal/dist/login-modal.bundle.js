import { createUiPorts as T, createCorePorts as Eo } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS as D, LIFECYCLE_EVENTS as _o, AUTH_INTENTS as Wt, UI_INTENTS as ge, ROUTER_EVENTS as vo } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { AUTH_EVENTS as nr, AUTH_INTENTS as ar } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import "/core/runtime/dist/runtime.bundle.js";
import { isStrict as bo, recordViolation as Io } from "/core/runtime/enterprise/strict-mode.js";
import { SecurityCSRF as g } from "/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js";
const Ao = "login-modal-router-adapters", se = typeof window < "u", Ri = T({ moduleId: Ao });
function Si() {
  Ri.init();
}
function Re(t) {
  return Ri.get(t);
}
const Oi = function(t) {
  var e = Array.prototype.slice.call(arguments, 1), i = Re("logger");
  i && i.info && i.info.apply(i, ["[login-router-adapters]"].concat(e));
};
function wt() {
}
wt.prototype.getCurrentRoute = function() {
  throw new Error("Not implemented");
};
wt.prototype.setRoute = function(t) {
  throw new Error("Not implemented");
};
wt.prototype.onRouteChange = function(t) {
  throw new Error("Not implemented");
};
wt.prototype.cleanup = function() {
  throw new Error("Not implemented");
};
function ot() {
  this._listeners = [], this._handler = this._onHashChange.bind(this), this._bound = !1, se && (window.addEventListener("hashchange", this._handler), this._bound = !0);
}
ot.prototype = Object.create(wt.prototype);
ot.prototype.constructor = ot;
ot.prototype.getCurrentRoute = function() {
  if (!se) return "/";
  Si();
  let t = Re("routerGlobal");
  if (t && t.getCurrentRoute) {
    let e = t.getCurrentRoute();
    return e && e.path || "/";
  }
  return Oi("info", "RouterGlobal nao disponivel - leitura fallback"), "/";
};
ot.prototype.setRoute = function(t) {
  if (!se) return;
  Si();
  const e = Re("routerGlobal");
  e && e.navigate ? e.navigate(t, { replace: !0, source: "login-modal" }) : Oi("info", "RouterGlobal nao disponivel - navegacao ignorada");
};
ot.prototype.onRouteChange = function(t) {
  this._listeners.push(t);
};
ot.prototype._onHashChange = function() {
  const t = this.getCurrentRoute();
  for (var e = 0; e < this._listeners.length; e++)
    this._listeners[e](t);
};
ot.prototype.cleanup = function() {
  se && this._bound && (window.removeEventListener("hashchange", this._handler), this._bound = !1), this._listeners = [];
};
function ut() {
  this._currentRoute = "/", this._listeners = [];
}
ut.prototype = Object.create(wt.prototype);
ut.prototype.constructor = ut;
ut.prototype.getCurrentRoute = function() {
  return this._currentRoute;
};
ut.prototype.setRoute = function(t) {
  this._currentRoute = t;
  for (var e = 0; e < this._listeners.length; e++)
    this._listeners[e](t);
};
ut.prototype.onRouteChange = function(t) {
  this._listeners.push(t);
};
ut.prototype.cleanup = function() {
  this._listeners = [];
};
const Se = "5.8.0-P17WI", Oe = "login-modal-eventbus", Ot = T({ moduleId: Oe });
function Do() {
  Ot.init();
}
function Ce(t) {
  return Ot.get(t);
}
const wo = () => {
  const t = Ce("config");
  return !!(t && t.app && t.app.debug);
}, ye = function(t) {
  const e = Ce("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-eventbus]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-eventbus]"].concat(i));
    return;
  }
  wo() && e.debug && e.debug(...["[login-eventbus]"].concat(i));
};
function $(t) {
  t || (t = {}), this.namespace = t.namespace || "login-modal", this.debug = t.debug || !1, this.listeners = /* @__PURE__ */ new Map(), this.history = [], this.maxHistory = t.maxHistory || 50, this._metrics = { emits: 0, subscriptions: 0, unsubscriptions: 0 }, Do();
}
$.prototype.on = function(t, e) {
  this._metrics.subscriptions++;
  const i = this._getKey(t);
  this.listeners.has(i) || this.listeners.set(i, /* @__PURE__ */ new Set()), this.listeners.get(i).add(e);
  const o = this;
  return () => {
    o.off(t, e);
  };
};
$.prototype.off = function(t, e) {
  this._metrics.unsubscriptions++;
  const i = this._getKey(t), o = this.listeners.get(i);
  o && o.delete(e);
};
$.prototype.emit = function(t, e) {
  e || (e = {}), this._metrics.emits++;
  const i = this._getKey(t), o = { event: t, data: e, timestamp: Date.now(), namespace: this.namespace };
  this._recordHistory(o);
  const s = this.listeners.get(i);
  s && s.forEach((n) => {
    try {
      n(o);
    } catch (r) {
      ye("error", `Erro em listener ${t}:`, r);
    }
  }), this.debug && ye("info", `Evento emitido: ${t}`, e);
};
$.prototype.once = function(t, e) {
  const i = this, o = (s) => {
    i.off(t, o), e(s);
  };
  return this.on(t, o);
};
$.prototype.clear = function() {
  this.listeners.clear(), this.history = [], ye("info", "EventBus limpo");
};
$.prototype._getKey = function(t) {
  return `${this.namespace}:${t}`;
};
$.prototype._recordHistory = function(t) {
  this.history.push(t), this.history.length > this.maxHistory && this.history.shift();
};
$.prototype.getHistory = function() {
  return this.history.slice();
};
$.prototype.getListenerCount = function(t) {
  if (t) {
    const i = this._getKey(t), o = this.listeners.get(i);
    return o ? o.size : 0;
  }
  let e = 0;
  return this.listeners.forEach((i) => {
    e += i.size;
  }), e;
};
$.prototype.getEventNames = function() {
  const t = [];
  return this.listeners.forEach((e, i) => {
    t.push(i);
  }), t;
};
$.prototype.getStatus = function() {
  return { namespace: this.namespace, debug: this.debug, totalListeners: this.getListenerCount(), historySize: this.history.length, metrics: Object.assign({}, this._metrics) };
};
$.prototype.info = function() {
  return { moduleId: Oe, version: Se, namespace: this.namespace, portsInitialized: Ot.isInitialized(), status: this.getStatus(), timestamp: Date.now() };
};
$.prototype.healthCheck = function() {
  const t = Ce("logger"), e = { hasNamespace: !!this.namespace, lowHistorySize: this.history.length <= this.maxHistory, noMemoryLeak: this.getListenerCount() < 1e3, loggerAvailable: !!t, portsInitialized: Ot.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 5 ? "HEALTHY" : "DEGRADED", score: `${i}/5`, checks: e, version: Se, moduleId: Oe, portsInitialized: Ot.isInitialized(), timestamp: Date.now() };
};
const Te = "login-modal-logger", Ci = "5.7.1-ENTERPRISE", Ct = T({ moduleId: Te }), Ro = () => {
  Ct.init();
}, So = (t) => Ct.get(t), Kt = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
function M(t = {}) {
  this.logLevel = this._parseLogLevel(t.logLevel || "info"), this.silent = t.silent || !1, this.traceId = this._generateTraceId(), this.context = t.context || {}, this._metrics = { logs: 0, errors: 0 }, Ro();
}
M.prototype._getLogger = () => So("logger");
M.prototype._generateTraceId = () => `login-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
M.prototype._parseLogLevel = (t) => {
  const e = t.toUpperCase();
  return Kt[e] !== void 0 ? Kt[e] : Kt.INFO;
};
M.prototype.log = function(t, e, i, o) {
  if (Kt[t.toUpperCase()] > this.logLevel || this.silent && t !== "error") return null;
  this._metrics.logs++, t === "error" && this._metrics.errors++;
  const n = this._getLogger();
  if (!n) return { level: t, message: e, data: i };
  const r = { ...this.context, traceId: this.traceId, data: i }, l = n[t] || n.info;
  return typeof l == "function" && l.call(n, "[login-modal]", e, r), { level: t, message: e, data: i };
};
M.prototype.error = function(t, e, i) {
  return this.log("error", t, e, i);
};
M.prototype.warn = function(t, e, i) {
  return this.log("warn", t, e, i);
};
M.prototype.info = function(t, e, i) {
  return this.log("info", t, e, i);
};
M.prototype.debug = function(t, e, i) {
  return this.log("debug", t, e, i);
};
M.prototype.getTraceId = function() {
  return this.traceId;
};
M.prototype.renewTraceId = function() {
  return this.traceId = this._generateTraceId(), this.traceId;
};
M.prototype.setContext = function(t, e) {
  this.context[t] = e;
};
M.prototype.clearContext = function() {
  this.context = {};
};
M.prototype.setLogLevel = function(t) {
  this.logLevel = this._parseLogLevel(t);
};
M.prototype.setSilent = function(t) {
  this.silent = t;
};
M.prototype.info_module = function() {
  return { moduleId: Te, version: Ci, logLevel: this.logLevel, silent: this.silent, traceId: this.traceId, portsInitialized: Ct.isInitialized(), metrics: { ...this._metrics }, timestamp: Date.now() };
};
M.prototype.healthCheck = function() {
  const e = { hasLogger: !!this._getLogger(), hasTraceId: !!this.traceId, portsInitialized: Ct.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 3 ? "HEALTHY" : "DEGRADED", score: `${i}/3`, checks: e, version: Ci, moduleId: Te, portsInitialized: Ct.isInitialized(), timestamp: Date.now() };
};
const ke = "login-modal.telemetry.tracker", Ti = "5.6.0-P24", at = "login-modal", zt = { INFO: "info", WARN: "warn" }, re = T({ moduleId: ke });
function Oo() {
  re.init();
}
function Co(t) {
  return re.get(t);
}
function F(t, e) {
  t = t || {}, e = e || {}, Oo(), this.config = t, this.logger = e.logger || Co("logger") || console, this.enabled = t.telemetry && t.telemetry.enabled !== !1, this.namespace = t.telemetry && t.telemetry.namespace || "auth", this.version = t.version || "1.0.0", this.telemetryCoreAvailable = !1, this.Telemetry = null, this.metadata = { version: this.version, deviceId: e.deviceId || null }, this._metrics = { events: 0, errors: 0 }, this._initTelemetryCore();
}
F.prototype._initTelemetryCore = function() {
  const t = this;
  import("/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js").then((e) => {
    t.Telemetry = e.Telemetry, t.Telemetry && typeof t.Telemetry.isReady == "function" && (t.Telemetry.isReady() || t.Telemetry.init({ endpoint: "/api/telemetry", debug: !1, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 }), t.Telemetry.setContext(Object.assign({ module: at }, t.metadata)), t.telemetryCoreAvailable = !0);
  }).catch(() => {
    t.telemetryCoreAvailable = !1;
  });
};
F.prototype.emit = function(t, e, i) {
  if (e = e || {}, i = i || zt.INFO, !this.enabled) return;
  this._metrics.events++;
  const o = this.logger.getTraceId && this.logger.getTraceId() || null, s = Object.assign({}, e, { traceId: o, module: at }, this.metadata);
  if (this.telemetryCoreAvailable && this.Telemetry)
    try {
      this.Telemetry.event(`${at}:${t}`, s, { component: at, severity: i });
    } catch {
    }
};
F.prototype.trackOpen = function(t) {
  t = t || "manual", this.emit(`${this.namespace}:open`, { reason: t }, zt.INFO);
};
F.prototype.trackBusy = function() {
  this.emit(`${this.namespace}:busy`, { state: "loading" }, zt.INFO);
};
F.prototype.trackSuccess = function(t, e) {
  if (this.telemetryCoreAvailable && this.Telemetry)
    try {
      this.Telemetry.metric(`${at}:${this.namespace}:success`, { userId: t && t.id || null, duration: e, unit: "ms" }, { component: at });
    } catch {
    }
};
F.prototype.trackError = function(t, e, i) {
  if (this._metrics.errors++, this.telemetryCoreAvailable && this.Telemetry)
    try {
      this.Telemetry.error(`${at}:${this.namespace}:error`, { errorCode: t, errorMessage: e, latencyMs: i }, { component: at });
    } catch {
    }
};
F.prototype.trackLocked = function(t, e) {
  this.emit(`${this.namespace}:locked`, { cooldownMs: t, attempts: e }, zt.WARN);
};
F.prototype.trackClose = function(t) {
  t = t || "manual", this.emit(`${this.namespace}:close`, { reason: t }, zt.INFO);
};
F.prototype.setMetadata = function(t, e) {
  if (this.metadata[t] = e, this.telemetryCoreAvailable && this.Telemetry) {
    const i = {};
    i[t] = e;
    try {
      this.Telemetry.setContext(i);
    } catch {
    }
  }
};
F.prototype.flushBatch = function() {
  if (this.telemetryCoreAvailable && this.Telemetry)
    try {
      return this.Telemetry.flush("login-modal-manual");
    } catch {
    }
  return Promise.resolve();
};
F.prototype.info = function() {
  return { moduleId: ke, version: Ti, enabled: this.enabled, namespace: this.namespace, telemetryCoreAvailable: this.telemetryCoreAvailable, portsInitialized: re.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
F.prototype.healthCheck = function() {
  const t = { enabled: this.enabled, hasLogger: !!this.logger, telemetryCoreAvailable: this.telemetryCoreAvailable, portsInitialized: re.isInitialized() }, e = Object.values(t).filter(Boolean).length, i = Object.keys(t).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: `${e}/${i}`, checks: t, version: Ti, moduleId: ke, p24Instrumented: !0, p24DynamicEventsAllowed: 4, timestamp: Date.now() };
};
const ri = "5.5.0-ENTERPRISE", ni = "login-modal-utils-timers", To = typeof window < "u";
class ko {
  constructor(e = {}) {
    this.config = e, this.namespace = e.namespace || "login-modal", this.telemetry = e.telemetry || null, this.ignorePagehide = e.ignorePagehide || !1, this.timers = /* @__PURE__ */ new Map(), this.intervals = /* @__PURE__ */ new Map(), this.abortController = new AbortController(), this.abortSignal = this.abortController.signal, this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 }, this.ignorePagehide || this._bindPagehide();
  }
  set(e, i, o) {
    const s = this._namespaceKey(e);
    this.clear(s, { skipNamespace: !0 });
    const r = setTimeout(() => {
      i(), this.timers.delete(s), this.metrics.expired++, this._track("timer:expired", { name: s, delay: o });
    }, o);
    return this.timers.set(s, { id: r, type: "timeout", startedAt: Date.now(), delay: o, callback: i }), this.metrics.created++, r;
  }
  interval(e, i, o, s = {}) {
    const n = this._namespaceKey(e);
    this.clearInterval(n, { skipNamespace: !0 });
    const r = s.driftCorrection !== !1, l = o;
    let d = Date.now() + l;
    const c = () => {
      if (i(), r) {
        const h = Date.now() - d;
        d += l;
        const p = Math.max(0, l - h), I = setTimeout(c, p), L = this.intervals.get(n);
        L && (L.id = I);
      }
    }, u = r ? setTimeout(c, o) : setInterval(i, o);
    return this.intervals.set(n, { id: u, type: "interval", startedAt: Date.now(), delay: o, driftCorrection: r, callback: i }), this.metrics.created++, u;
  }
  wait(e, i) {
    const o = this._namespaceKey(e);
    return new Promise((s, n) => {
      const r = () => {
        s({ name: o, elapsed: i });
      };
      this._setInternal(o, r, i), this.abortSignal.addEventListener("abort", () => {
        this.clear(o, { skipNamespace: !0 }), n(new Error(`Timer ${o} aborted`));
      }, { once: !0 });
    });
  }
  _setInternal(e, i, o) {
    this.clear(e, { skipNamespace: !0 });
    const n = setTimeout(() => {
      i(), this.timers.delete(e), this.metrics.expired++, this._track("timer:expired", { name: e, delay: o });
    }, o);
    return this.timers.set(e, { id: n, type: "timeout", startedAt: Date.now(), delay: o, callback: i }), this.metrics.created++, n;
  }
  clear(e, i = {}) {
    const o = i.skipNamespace ? e : this._namespaceKey(e), s = this.timers.get(o);
    s && (clearTimeout(s.id), this.timers.delete(o), this.metrics.cancelled++, this._track("timer:cancelled", { name: o }));
  }
  clearInterval(e, i = {}) {
    const o = i.skipNamespace ? e : this._namespaceKey(e), s = this.intervals.get(o);
    s && (s.driftCorrection ? clearTimeout(s.id) : clearInterval(s.id), this.intervals.delete(o), this.metrics.cancelled++, this._track("interval:cancelled", { name: o }));
  }
  clearAll() {
    this.timers.forEach((e) => clearTimeout(e.id)), this.timers.clear(), this.intervals.forEach((e) => {
      e.driftCorrection ? clearTimeout(e.id) : clearInterval(e.id);
    }), this.intervals.clear(), this._track("timers:cleared-all", { count: this.metrics.created });
  }
  abort() {
    this.abortController.abort(), this.clearAll(), this.metrics.aborted++, this._track("timers:aborted", { totalAborted: this.metrics.aborted });
  }
  has(e) {
    const i = this._namespaceKey(e);
    return this.timers.has(i) || this.intervals.has(i);
  }
  getMetadata(e) {
    const i = this._namespaceKey(e), o = this.timers.get(i) || this.intervals.get(i);
    return o ? { type: o.type, startedAt: o.startedAt, delay: o.delay, elapsed: Date.now() - o.startedAt, driftCorrection: o.driftCorrection || !1 } : null;
  }
  getMetrics() {
    return { ...this.metrics, active: this.timers.size + this.intervals.size };
  }
  resetMetrics() {
    this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 };
  }
  _namespaceKey(e) {
    return e.startsWith(`${this.namespace}:`) ? e : e.includes(":") ? `${this.namespace}:${e}` : `${this.namespace}:${e}`;
  }
  _bindPagehide() {
    To && window.addEventListener("pagehide", () => {
      this.clearAll();
    }, { once: !0 });
  }
  _track(e, i = {}) {
    this.telemetry && typeof this.telemetry == "function" && this.telemetry(e, { ...i, timestamp: Date.now(), source: "timers-manager" });
  }
  info() {
    return { moduleId: ni, version: ri, metrics: this.getMetrics(), activeTimers: this.timers.size, activeIntervals: this.intervals.size, namespace: this.namespace, timestamp: Date.now() };
  }
  healthCheck() {
    const e = { notAborted: !this.abortSignal.aborted, reasonableActiveCount: this.timers.size + this.intervals.size < 50, lowCancelRate: this.metrics.created === 0 || this.metrics.cancelled / this.metrics.created < 0.9 }, i = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
    return { status: i === o ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${o}`, healthy: i >= 2, checks: e, version: ri, moduleId: ni, timestamp: Date.now() };
  }
}
const Le = "login-csrf-wrapper", ki = "5.8.0-P17WI", Qt = T({ moduleId: Le });
function Me(t) {
  return Qt.get(t);
}
const Lo = () => {
  const t = Me("config");
  return !!(t && t.app && t.app.debug);
}, ai = function(t) {
  const e = Me("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-csrf]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-csrf]"].concat(i));
    return;
  }
  Lo() && e.debug && e.debug(...["[login-csrf]"].concat(i));
};
function Z(t) {
  t || (t = {}), this.config = t, this._initialized = !1, this._initSecurityCSRF(t);
}
Z.prototype._initSecurityCSRF = function(t) {
  try {
    g && g.init && g.init(t, {}), this._initialized = !0, ai("info", "CSRFManager delegando para SecurityCSRF", { version: g.version });
  } catch (e) {
    ai("error", "Erro ao inicializar SecurityCSRF", e);
  }
};
Z.prototype.get = () => g && g.getToken ? g.getToken() : null;
Z.prototype.set = (t) => g && g.setToken ? g.setToken(t) : null;
Z.prototype.renew = (t) => g && g.renewToken ? g.renewToken(t) : null;
Z.prototype.clear = () => {
  g && g.clearToken && g.clearToken();
};
Z.prototype.getHeaders = () => g && g.getHeaders ? g.getHeaders() : {};
Z.prototype.getStatus = () => g && g.getStatus ? g.getStatus() : null;
Z.prototype.info = function() {
  const t = { moduleId: Le, version: ki, delegateTo: "SecurityCSRF", delegateVersion: g && g.version || "unknown", initialized: this._initialized, hasToken: !!this.get(), portsInitialized: Qt.isInitialized(), timestamp: Date.now() }, e = g && g.info ? g.info() : {};
  return Object.assign(t, e);
};
Z.prototype.healthCheck = function() {
  const t = Me("logger"), e = { initialized: this._initialized, securityCSRFAvailable: typeof g < "u", hasGetToken: typeof g.getToken == "function", hasSetToken: typeof g.setToken == "function", loggerAvailable: !!t, portsInitialized: Qt.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 6 ? "HEALTHY" : i >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${i}/6`, checks: e, version: ki, moduleId: Le, portsInitialized: Qt.isInitialized(), timestamp: Date.now() };
};
const m = { NETWORK_ERROR: "NETWORK_ERROR", REQUEST_TIMEOUT: "REQUEST_TIMEOUT", REQUEST_ABORTED: "REQUEST_ABORTED", INVALID_CREDENTIALS: "INVALID_CREDENTIALS", FORBIDDEN: "FORBIDDEN", NOT_FOUND: "NOT_FOUND", RATE_LIMITED: "RATE_LIMITED", VALIDATION_ERROR: "VALIDATION_ERROR", SERVER_ERROR: "SERVER_ERROR", BAD_GATEWAY: "BAD_GATEWAY", SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE", GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT", MAX_RETRIES_EXCEEDED: "MAX_RETRIES_EXCEEDED", INVALID_CONFIG: "INVALID_CONFIG", UNKNOWN_ERROR: "UNKNOWN_ERROR" }, Mo = /* @__PURE__ */ new Set([500, 502, 503, 504]), P = (t, e = {}) => {
  var i;
  return { ok: t, success: t, status: e.status || null, code: e.code || (t ? "SUCCESS" : m.UNKNOWN_ERROR), message: e.message || "", data: e.data || null, retryAfter: e.retryAfter || ((i = e.data) == null ? void 0 : i.retryAfter) || null, latency: e.latency || 0, traceId: e.traceId || null, timestamp: Date.now(), error: e.error || null };
}, No = { [m.REQUEST_TIMEOUT]: "Tempo esgotado", [m.REQUEST_ABORTED]: "Requisição cancelada", [m.NETWORK_ERROR]: "Erro de conexão", [m.INVALID_CREDENTIALS]: "Credenciais inválidas", [m.RATE_LIMITED]: "Muitas tentativas", [m.SERVER_ERROR]: "Erro no servidor", [m.SERVICE_UNAVAILABLE]: "Serviço indisponível", [m.MAX_RETRIES_EXCEEDED]: "Máximo de tentativas atingido", [m.INVALID_CONFIG]: "Configuração inválida" }, Po = { 400: m.VALIDATION_ERROR, 401: m.INVALID_CREDENTIALS, 403: m.FORBIDDEN, 404: m.NOT_FOUND, 429: m.RATE_LIMITED, 500: m.SERVER_ERROR, 502: m.BAD_GATEWAY, 503: m.SERVICE_UNAVAILABLE, 504: m.GATEWAY_TIMEOUT };
function Ne(t, e, i) {
  const o = { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-Trace-Id": t };
  return e && Object.assign(o, e.getHeaders()), i && (o["X-Device-Id"] = i.get()), o;
}
function Li(t) {
  return (t.headers.get("content-type") || "").includes("application/json") ? t.json() : t.text().then((i) => ({
    ok: !1,
    error: `Resposta não-JSON (${t.status})`,
    message: i.slice(0, 100)
  }));
}
function Mi(t) {
  return Po[t] || m.UNKNOWN_ERROR;
}
function $o(t, e, i) {
  return Mo.has(t) && e < i;
}
function Bo(t, e, i) {
  return t.name === "TypeError" && e < i;
}
function li(t) {
  return Math.min(1e3 * Math.pow(2, t - 1), 5e3);
}
function Tt(t) {
  return new Promise((e) => {
    setTimeout(e, t);
  });
}
function Pe(t, e) {
  if (!t) return e;
  const i = new AbortController();
  return t.addEventListener("abort", () => {
    i.abort();
  }, { once: !0 }), e.addEventListener("abort", () => {
    i.abort();
  }, { once: !0 }), i.signal;
}
function $e() {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function yt(t) {
  return No[t] || "Erro desconhecido";
}
function Gt(t, e, i, o) {
  if (t)
    try {
      const s = D[`${e.toUpperCase()}_${i.toUpperCase()}`] || `auth.${e}.${i}`;
      t.track(s, Object.assign({ method: e, event: i, timestamp: Date.now() }, o || {}));
    } catch {
    }
}
async function Uo(t, e, i) {
  return await Tt(500), t === "admin" && e === "admin" ? P(!0, { code: "LOGIN_SUCCESS", message: "Mock login success", data: { user: { id: 1, username: "admin" }, csrf: "mock-csrf-token" }, latency: 500, traceId: i.traceId }) : P(!1, { status: 401, code: m.INVALID_CREDENTIALS, message: "Mock login failed", latency: 500, traceId: i.traceId, error: m.INVALID_CREDENTIALS });
}
async function zo(t) {
  return await Tt(200), P(!0, { code: "SESSION_VALID", message: "Mock session valid", data: { authenticated: !0, user: { id: 1, username: "mock" } }, latency: 200, traceId: t.traceId });
}
async function xo(t) {
  return await Tt(200), P(!0, { code: "LOGOUT_SUCCESS", message: "Mock logout success", latency: 200, traceId: t.traceId });
}
const Be = "login-modal-auth-api", Ni = "5.7.0-P17WI", kt = T({ moduleId: Be });
function Ho() {
  kt.init();
}
function Fo(t) {
  return kt.get(t);
}
function Vo(t) {
  if (t && t.debug !== void 0) return t.debug;
  const e = Fo("config");
  return !!(e && e.app && e.app.debug);
}
function dt(t, e) {
  t || (t = {}), e || (e = {}), this.config = t, this.debug = Vo(t), this.csrfManager = e.csrfManager || null, this.deviceIDManager = e.deviceIDManager || null, this.telemetry = e.telemetry || null, this.timeout = t.api && t.api.timeout ? t.api.timeout : 1e4, this.maxRetries = t.api && t.api.maxRetries ? t.api.maxRetries : 1, this.endpoints = t.api && t.api.endpoints ? t.api.endpoints : {}, this.mockMode = t.api && t.api.mockMode ? t.api.mockMode : !1, this.activeControllers = /* @__PURE__ */ new Map(), this._metrics = { logins: 0, checks: 0, logouts: 0, errors: 0 }, this._applyDefaultEndpoints(), Ho();
}
dt.prototype._applyDefaultEndpoints = function() {
  this.endpoints.login || (this.endpoints.login = "/api/auth/login.php"), this.endpoints.check || (this.endpoints.check = "/api/auth/check.php"), this.endpoints.logout || (this.endpoints.logout = "/api/auth/logout.php");
};
dt.prototype.login = function(t, e, i) {
  const o = this;
  i || (i = {}), o._metrics.logins++;
  const s = $e(), n = i.signal;
  if (!o.endpoints.login)
    return Promise.resolve(P(!1, { code: m.INVALID_CONFIG, message: "Endpoint de login não configurado", traceId: s, error: m.INVALID_CONFIG }));
  if (o.mockMode) return Promise.resolve(Uo(t, e, { traceId: s }));
  let r = 0;
  const l = o.maxRetries + 1;
  function d() {
    r++;
    const c = Date.now();
    let u = !1;
    const h = new AbortController(), p = `${s}-attempt-${r}`;
    o.activeControllers.set(p, h);
    const I = setTimeout(() => {
      u = !0, h.abort();
    }, o.timeout), L = Pe(n, h.signal);
    return fetch(o.endpoints.login, { method: "POST", credentials: "include", cache: "no-store", signal: L, headers: Ne(s, o.csrfManager, o.deviceIDManager), body: JSON.stringify({ username: t, password: e }) }).then((A) => {
      clearTimeout(I), o.activeControllers.delete(p);
      const v = Date.now() - c;
      return Li(A).then((E) => {
        if (A.ok && E && E.ok === !0)
          return E.csrf && o.csrfManager && o.csrfManager.set(E.csrf), Gt(o.telemetry, "login", "success", { latency: v, attempt: r }), P(!0, { code: "LOGIN_SUCCESS", message: "Login realizado com sucesso", data: { user: E.user, csrf: E.csrf, expiresIn: E.expires_in }, latency: v, traceId: s });
        const j = Mi(A.status);
        if ($o(A.status, r, l))
          return Tt(li(r)).then(d);
        o._metrics.errors++, Gt(o.telemetry, "login", "error", { errorCode: j, status: A.status, latency: v, attempt: r });
        const R = E && E.retry_after ? E.retry_after : A.headers.get ? A.headers.get("Retry-After") : null;
        return P(!1, { status: A.status, code: j, message: E && (E.error || E.message) || yt(j), data: { retryAfter: R }, retryAfter: R, latency: v, traceId: s, error: j });
      });
    }).catch((A) => {
      clearTimeout(I), o.activeControllers.delete(p);
      const v = Date.now() - c;
      if (A.name === "AbortError") {
        const E = u ? m.REQUEST_TIMEOUT : m.REQUEST_ABORTED;
        return Gt(o.telemetry, "login", "aborted", { errorCode: E, latency: v, attempt: r, timeoutFired: u }), P(!1, { code: E, message: yt(E), latency: v, traceId: s, error: E });
      }
      return Bo(A, r, l) ? Tt(li(r)).then(d) : (o._metrics.errors++, Gt(o.telemetry, "login", "network_error", { error: A.message, latency: v, attempt: r }), P(!1, { code: m.NETWORK_ERROR, message: A.message || yt(m.NETWORK_ERROR), latency: v, traceId: s, error: m.NETWORK_ERROR }));
    });
  }
  return d();
};
dt.prototype.checkSession = function(t) {
  const e = this;
  t || (t = {}), e._metrics.checks++;
  const i = $e(), o = t.timeout || 5e3;
  if (!e.endpoints.check)
    return Promise.resolve(P(!1, { code: m.INVALID_CONFIG, message: "Endpoint de check não configurado", data: { authenticated: !1 }, traceId: i, error: m.INVALID_CONFIG }));
  if (e.mockMode) return Promise.resolve(zo({ traceId: i }));
  const s = new AbortController(), n = `${i}-check`;
  e.activeControllers.set(n, s);
  const r = setTimeout(() => {
    s.abort();
  }, o), l = Pe(t.signal, s.signal), d = Date.now();
  return fetch(e.endpoints.check, { method: "GET", credentials: "include", cache: "no-store", signal: l, headers: Ne(i, e.csrfManager, e.deviceIDManager) }).then((c) => {
    clearTimeout(r), e.activeControllers.delete(n);
    const u = Date.now() - d;
    if (!c.ok) {
      const h = Mi(c.status);
      return P(!1, { status: c.status, code: h, message: h === m.INVALID_CREDENTIALS ? "Sessão inválida" : yt(h), data: { authenticated: !1 }, latency: u, traceId: i, error: h });
    }
    return Li(c).then((h) => P(!0, { code: "SESSION_VALID", message: "Sessão válida", data: { authenticated: h.authenticated === !0, user: h.user || null }, latency: u, traceId: i }));
  }).catch((c) => {
    clearTimeout(r), e.activeControllers.delete(n), e._metrics.errors++;
    const u = c.name === "AbortError" ? m.REQUEST_TIMEOUT : m.NETWORK_ERROR;
    return P(!1, { code: u, message: yt(u), data: { authenticated: !1 }, latency: o, traceId: i, error: u });
  });
};
dt.prototype.logout = function(t) {
  const e = this;
  t || (t = {}), e._metrics.logouts++;
  const i = $e(), o = t.timeout || 5e3;
  if (!e.endpoints.logout)
    return Promise.resolve(P(!1, { code: m.INVALID_CONFIG, message: "Endpoint de logout não configurado", traceId: i, error: m.INVALID_CONFIG }));
  if (e.mockMode) return Promise.resolve(xo({ traceId: i }));
  const s = new AbortController(), n = `${i}-logout`;
  e.activeControllers.set(n, s);
  const r = setTimeout(() => {
    s.abort();
  }, o), l = Pe(t.signal, s.signal), d = Date.now();
  return fetch(e.endpoints.logout, { method: "POST", credentials: "include", cache: "no-store", signal: l, headers: Ne(i, e.csrfManager, e.deviceIDManager) }).then((c) => {
    clearTimeout(r), e.activeControllers.delete(n);
    const u = Date.now() - d;
    return e.csrfManager && e.csrfManager.clear(), P(c.ok, { status: c.status, code: c.ok ? "LOGOUT_SUCCESS" : "LOGOUT_FAILED", message: c.ok ? "Logout realizado" : "Falha no logout", latency: u, traceId: i });
  }).catch((c) => {
    clearTimeout(r), e.activeControllers.delete(n), e._metrics.errors++;
    const u = c.name === "AbortError" ? m.REQUEST_TIMEOUT : m.NETWORK_ERROR;
    return P(!1, { code: u, message: yt(u), latency: o, traceId: i, error: u });
  });
};
dt.prototype.cancel = function() {
  this.activeControllers.forEach((t) => {
    t.abort();
  }), this.activeControllers.clear();
};
dt.prototype.info = function() {
  return { moduleId: Be, version: Ni, endpoints: Object.assign({}, this.endpoints), mockMode: this.mockMode, timeout: this.timeout, maxRetries: this.maxRetries, activeRequests: this.activeControllers.size, portsInitialized: kt.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
dt.prototype.healthCheck = function() {
  const t = { hasLoginEndpoint: !!this.endpoints.login, hasCheckEndpoint: !!this.endpoints.check, hasLogoutEndpoint: !!this.endpoints.logout, noActiveRequests: this.activeControllers.size === 0, portsInitialized: kt.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 5 ? "HEALTHY" : e >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${e}/5`, checks: t, version: Ni, moduleId: Be, portsInitialized: kt.isInitialized(), timestamp: Date.now() };
};
const Pi = "5.8.0-P17WI", Ue = "login-modal-device-id", ze = "dshow_device_id", Lt = T({ moduleId: Ue });
function jo() {
  Lt.init();
}
function xe(t) {
  return Lt.get(t);
}
const Go = () => {
  const t = xe("config");
  return !!(t && t.app && t.app.debug);
}, vt = function(t) {
  const e = xe("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-device-id]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-device-id]"].concat(i));
    return;
  }
  Go() && e.debug && e.debug(...["[login-device-id]"].concat(i));
};
function ht(t) {
  t || (t = {}), this.config = t, this.deviceId = null, this._metrics = { generates: 0, retrieves: 0, clears: 0 }, jo();
}
ht.prototype.generate = function() {
  this._metrics.generates++;
  try {
    const t = new Uint8Array(16);
    crypto.getRandomValues(t);
    const e = Array.from(t, (i) => i.toString(16).padStart(2, "0")).join("");
    return this.deviceId = e, this._persist(e), vt("info", "Device ID gerado"), e;
  } catch (t) {
    vt("error", "Erro ao gerar device ID", t);
    const e = `fb-${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
    return this.deviceId = e, e;
  }
};
ht.prototype.get = function() {
  if (this._metrics.retrieves++, this.deviceId) return this.deviceId;
  try {
    const t = localStorage.getItem(ze);
    if (t)
      return this.deviceId = t, t;
  } catch (t) {
    vt("warn", "Erro ao recuperar device ID", t);
  }
  return this.generate();
};
ht.prototype.clear = function() {
  this._metrics.clears++;
  try {
    localStorage.removeItem(ze), this.deviceId = null, vt("info", "Device ID limpo");
  } catch (t) {
    vt("error", "Erro ao limpar device ID", t);
  }
};
ht.prototype._persist = (t) => {
  try {
    localStorage.setItem(ze, t);
  } catch (e) {
    vt("warn", "Erro ao persistir device ID", e);
  }
};
ht.prototype.getStatus = function() {
  return { hasDeviceId: !!this.deviceId, deviceIdLength: this.deviceId ? this.deviceId.length : 0, metrics: Object.assign({}, this._metrics) };
};
ht.prototype.info = function() {
  return { moduleId: Ue, version: Pi, hasDeviceId: !!this.deviceId, portsInitialized: Lt.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
ht.prototype.healthCheck = () => {
  const t = xe("logger"), e = { canGenerateId: typeof crypto < "u", hasStorage: typeof localStorage < "u", loggerAvailable: !!t, portsInitialized: Lt.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, checks: e, version: Pi, moduleId: Ue, portsInitialized: Lt.isInitialized(), timestamp: Date.now() };
};
const ci = "5.5.0-ENTERPRISE", ui = "login-modal-security-validator", di = { REQUIRED: "Campo obrigatório", EMPTY: "Campo não pode estar vazio", TOO_SHORT: "Valor muito curto", TOO_LONG: "Valor muito longo", INVALID_EMAIL: "E-mail inválido", INVALID_CHARACTERS: "Contém caracteres inválidos", NO_UPPERCASE: "Deve conter letras maiúsculas", NO_LOWERCASE: "Deve conter letras minúsculas", NO_NUMBER: "Deve conter números", NO_SPECIAL: "Deve conter caracteres especiais", COMMON_PASSWORD: "Senha muito comum", UNKNOWN_ERROR: "Erro desconhecido" }, Yo = /* @__PURE__ */ new Set(["password", "123456", "12345678", "qwerty", "abc123", "password123", "admin", "letmein", "welcome", "monkey"]);
class Ko {
  constructor(e = {}) {
    var i;
    const o = e.security || {};
    this.maxUsernameLength = o.maxUsernameLength || 128, this.maxPasswordLength = Math.min(o.maxPasswordLength || 256, 256), this.minPasswordLength = o.minPasswordLength || 4, this.usernameNormalize = o.usernameNormalize ?? !0, this.passwordNormalize = o.passwordNormalize ?? !1, this.passwordTrim = o.passwordTrim ?? !1, this.usernameEmailValidation = o.usernameEmailValidation ?? !0, this.passwordComplexity = o.passwordComplexity || { requireUppercase: !1, requireLowercase: !1, requireNumber: !1, requireSpecial: !1, blacklistCommon: !1 }, this.failFast = o.failFast ?? !1, this.profile = o.profile || "default", this.errorMessages = { ...di, ...((i = e.i18n) == null ? void 0 : i.errors) || {} }, this.emailRegex = o.emailRegex || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, this.invalidCharsRegex = o.invalidCharsRegex || /[<>"'`]/, this._metrics = { usernameValidations: 0, passwordValidations: 0, credentialValidations: 0, errors: 0 };
  }
  _normalize(e, i) {
    if (!i || !e || typeof e != "string") return e || "";
    let o = e.normalize("NFKC");
    return o = o.replace(/[\u200B-\u200D\uFEFF]/g, ""), o = o.replace(/[\x00-\x1F\x7F-\x9F]/g, ""), o;
  }
  _createError(e, i = {}) {
    this._metrics.errors++;
    let o = this.errorMessages[e] || this.errorMessages.UNKNOWN_ERROR;
    return Object.keys(i).forEach((s) => {
      o = o.replace(`{${s}}`, i[s]);
    }), { code: e, message: o, params: i };
  }
  validateUsername(e) {
    this._metrics.usernameValidations++;
    const i = [];
    if (!e || typeof e != "string") return { valid: !1, errors: [this._createError("REQUIRED")], value: "" };
    let o = this._normalize(e, this.usernameNormalize);
    return o = o.trim(), o.length === 0 && (i.push(this._createError("EMPTY")), this.failFast) ? { valid: !1, errors: i, value: "" } : (o.length > this.maxUsernameLength && i.push(this._createError("TOO_LONG", { max: this.maxUsernameLength })), this.invalidCharsRegex.test(o) && i.push(this._createError("INVALID_CHARACTERS")), this.usernameEmailValidation && o.includes("@") && (this.emailRegex.test(o) || i.push(this._createError("INVALID_EMAIL"))), { valid: i.length === 0, errors: i, value: o });
  }
  validatePassword(e) {
    this._metrics.passwordValidations++;
    const i = [];
    if (!e || typeof e != "string") return { valid: !1, errors: [this._createError("REQUIRED")], value: "" };
    let o = this._normalize(e, this.passwordNormalize);
    if (this.passwordTrim && (o = o.trim()), o.length === 0 && (i.push(this._createError("EMPTY")), this.failFast))
      return { valid: !1, errors: i, value: "" };
    o.length < this.minPasswordLength && i.push(this._createError("TOO_SHORT", { min: this.minPasswordLength })), o.length > this.maxPasswordLength && i.push(this._createError("TOO_LONG", { max: this.maxPasswordLength }));
    const s = this.passwordComplexity;
    return s.requireUppercase && !/[A-Z]/.test(o) && i.push(this._createError("NO_UPPERCASE")), s.requireLowercase && !/[a-z]/.test(o) && i.push(this._createError("NO_LOWERCASE")), s.requireNumber && !/[0-9]/.test(o) && i.push(this._createError("NO_NUMBER")), s.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(o) && i.push(this._createError("NO_SPECIAL")), s.blacklistCommon && Yo.has(o.toLowerCase()) && i.push(this._createError("COMMON_PASSWORD")), { valid: i.length === 0, errors: i, value: o };
  }
  validateCredentials(e, i) {
    this._metrics.credentialValidations++;
    const o = this.validateUsername(e), s = this.validatePassword(i);
    return { valid: o.valid && s.valid, errors: [...o.errors, ...s.errors], username: o.value, password: s.value };
  }
  info() {
    return { moduleId: ui, version: ci, metrics: { ...this._metrics }, config: { maxUsernameLength: this.maxUsernameLength, maxPasswordLength: this.maxPasswordLength, minPasswordLength: this.minPasswordLength, profile: this.profile }, timestamp: Date.now() };
  }
  healthCheck() {
    const e = { configValid: this.minPasswordLength > 0 && this.maxPasswordLength > this.minPasswordLength, regexValid: this.emailRegex instanceof RegExp && this.invalidCharsRegex instanceof RegExp, messagesComplete: Object.keys(di).every((s) => this.errorMessages[s]) }, i = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
    return { status: i === o ? "HEALTHY" : "DEGRADED", score: `${i}/${o}`, healthy: i >= 2, checks: e, version: ci, moduleId: ui, timestamp: Date.now() };
  }
}
const $i = "6.0.0-P17WI", He = "login-modal-rate-limiter", Bi = "dshow_rate_limit_ip", Mt = T({ moduleId: He });
function qo() {
  Mt.init();
}
function Fe(t) {
  return Mt.get(t);
}
const Wo = () => {
  const t = Fe("config");
  return !!(t && t.app && t.app.debug);
}, tt = function(t) {
  const e = Fe("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-rate-limiter]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-rate-limiter]"].concat(i));
    return;
  }
  Wo() && e.debug && e.debug(...["[login-rate-limiter]"].concat(i));
};
function N(t) {
  t || (t = {});
  const e = t.security || {};
  this.maxAttempts = e.rateLimitAttempts || 5, this.windowMs = e.rateLimitWindow || 3e5, this.lockoutMs = e.lockoutDuration || 9e5, this.attempts = [], this.lockedUntil = null, this.backendRetryAfter = null, this.ipTrackingEnabled = e.ipTracking !== !1, this.ipMaxAttempts = e.ipMaxAttempts || 10, this.ipWindowMs = e.ipWindow || 6e5, this.ipLockoutMs = e.ipLockout || 18e5, this._ipData = this._loadIPData(), this._metrics = { totalAttempts: 0, lockouts: 0, syncs: 0, ipLockouts: 0, ipAttempts: 0 }, qo(), tt("info", "RateLimiter inicializado", { ipTracking: this.ipTrackingEnabled });
}
N.prototype.recordAttempt = function(t) {
  this._metrics.totalAttempts++;
  const e = Date.now(), i = this;
  this.attempts = this.attempts.filter((o) => e - o < i.windowMs), this.attempts.push(e), this.attempts.length >= this.maxAttempts && (this.lockedUntil = e + this.lockoutMs, this._metrics.lockouts++, tt("warn", "Session rate limit atingido", { until: new Date(this.lockedUntil) })), this.ipTrackingEnabled && t && this._recordIPAttempt(t, e);
};
N.prototype._recordIPAttempt = function(t, e) {
  this._metrics.ipAttempts++;
  const i = this._normalizeIP(t), o = this;
  this._ipData.attempts[i] || (this._ipData.attempts[i] = []), this._ipData.attempts[i] = this._ipData.attempts[i].filter((s) => e - s < o.ipWindowMs), this._ipData.attempts[i].push(e), this._ipData.attempts[i].length >= this.ipMaxAttempts && (this._ipData.locked[i] = e + this.ipLockoutMs, this._metrics.ipLockouts++, tt("warn", "IP rate limit atingido", { ip: this._maskIP(i), until: new Date(this._ipData.locked[i]) })), this._persistIPData();
};
N.prototype._normalizeIP = (t) => t ? t.split(",")[0].trim() : "unknown";
N.prototype._maskIP = (t) => {
  const e = t.split(".");
  return e.length === 4 ? `${e[0]}.${e[1]}.xxx.xxx` : `${t.substring(0, 8)}***`;
};
N.prototype.isLocked = function(t) {
  const e = Date.now();
  if (this.backendRetryAfter && e < this.backendRetryAfter || this.lockedUntil && e < this.lockedUntil) return !0;
  if (this.lockedUntil && e >= this.lockedUntil && (this.lockedUntil = null, this.attempts = []), this.ipTrackingEnabled && t) {
    const i = this._normalizeIP(t);
    if (this._ipData.locked[i] && e < this._ipData.locked[i])
      return tt("warn", "IP bloqueado", { ip: this._maskIP(i) }), !0;
    this._ipData.locked[i] && e >= this._ipData.locked[i] && (delete this._ipData.locked[i], delete this._ipData.attempts[i], this._persistIPData());
  }
  return !1;
};
N.prototype.isIPLocked = function(t) {
  if (!this.ipTrackingEnabled || !t) return !1;
  const e = this._normalizeIP(t), i = Date.now();
  return this._ipData.locked[e] && i < this._ipData.locked[e];
};
N.prototype.getRemainingLockTime = function(t) {
  const e = Date.now();
  if (this.backendRetryAfter && e < this.backendRetryAfter) return this.backendRetryAfter - e;
  if (this.lockedUntil && e < this.lockedUntil) return this.lockedUntil - e;
  if (this.ipTrackingEnabled && t) {
    const i = this._normalizeIP(t);
    if (this._ipData.locked[i] && e < this._ipData.locked[i]) return this._ipData.locked[i] - e;
  }
  return 0;
};
N.prototype.syncBackendRetryAfter = function(t, e) {
  e || (e = "unknown"), this._metrics.syncs++, this.backendRetryAfter = Date.now() + t, tt("info", `Backend retry-after sincronizado: ${t}ms (source: ${e})`);
};
N.prototype.syncIPFromBackend = function(t) {
  if (!t) return;
  const e = t.get ? t.get("X-RateLimit-Remaining") : null, i = t.get ? t.get("X-RateLimit-Reset") : null, o = (t.get ? t.get("X-Client-IP") : null) || (t.get ? t.get("X-Forwarded-For") : null);
  if (e !== null && parseInt(e, 10) === 0 && i) {
    const s = parseInt(i, 10) * 1e3 - Date.now();
    if (s > 0 && o) {
      const n = this._normalizeIP(o);
      this._ipData.locked[n] = Date.now() + s, this._persistIPData(), tt("info", "IP sync from backend", { ip: this._maskIP(n), resetMs: s });
    }
  }
};
N.prototype.reset = function(t) {
  if (this.attempts = [], this.lockedUntil = null, this.backendRetryAfter = null, t) {
    const e = this._normalizeIP(t);
    delete this._ipData.attempts[e], delete this._ipData.locked[e], this._persistIPData();
  }
  tt("info", "Rate limiter resetado");
};
N.prototype.resetAll = function() {
  this.attempts = [], this.lockedUntil = null, this.backendRetryAfter = null, this._ipData = { attempts: {}, locked: {} }, this._persistIPData(), tt("info", "Rate limiter completamente resetado");
};
N.prototype._loadIPData = () => {
  try {
    const t = localStorage.getItem(Bi);
    if (t) {
      const e = JSON.parse(t), i = Date.now();
      return Object.keys(e.locked || {}).forEach((o) => {
        e.locked[o] < i && delete e.locked[o];
      }), { attempts: e.attempts || {}, locked: e.locked || {} };
    }
  } catch (t) {
    tt("warn", "Erro ao carregar IP data", t);
  }
  return { attempts: {}, locked: {} };
};
N.prototype._persistIPData = function() {
  try {
    localStorage.setItem(Bi, JSON.stringify(this._ipData));
  } catch (t) {
    tt("warn", "Erro ao persistir IP data", t);
  }
};
N.prototype.getStatus = function(t) {
  const e = t ? this._normalizeIP(t) : null;
  return { isLocked: this.isLocked(t), remainingLockTime: this.getRemainingLockTime(t), attempts: this.attempts.length, maxAttempts: this.maxAttempts, lockedUntil: this.lockedUntil, backendRetryAfter: this.backendRetryAfter, ipTracking: this.ipTrackingEnabled, ipLocked: e ? this.isIPLocked(e) : !1, ipAttempts: e && this._ipData.attempts[e] && this._ipData.attempts[e].length || 0, metrics: Object.assign({}, this._metrics) };
};
N.prototype.info = function() {
  return { moduleId: He, version: $i, portsInitialized: Mt.isInitialized(), config: { maxAttempts: this.maxAttempts, windowMs: this.windowMs, lockoutMs: this.lockoutMs, ipTracking: this.ipTrackingEnabled, ipMaxAttempts: this.ipMaxAttempts }, status: this.getStatus(), trackedIPs: Object.keys(this._ipData.attempts).length, lockedIPs: Object.keys(this._ipData.locked).length, timestamp: Date.now() };
};
N.prototype.healthCheck = function() {
  const t = Fe("logger"), e = { notPermanentlyLocked: !this.lockedUntil || Date.now() >= this.lockedUntil, lowAttemptCount: this.attempts.length < this.maxAttempts, noBackendBlock: !this.backendRetryAfter || Date.now() >= this.backendRetryAfter, ipTrackingHealthy: Object.keys(this._ipData.locked).length < 100, loggerAvailable: !!t, portsInitialized: Mt.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 6 ? "HEALTHY" : i >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${i}/6`, checks: e, version: $i, moduleId: He, portsInitialized: Mt.isInitialized(), timestamp: Date.now() };
};
const Ui = "5.8.0-P17WI", Ve = "login-modal-accessibility-focus-trap", Nt = T({ moduleId: Ve });
function Qo() {
  Nt.init();
}
function je(t) {
  return Nt.get(t);
}
const Xo = () => {
  const t = je("config");
  return !!(t && t.app && t.app.debug);
}, nt = function(t) {
  const e = je("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-focus-trap]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-focus-trap]"].concat(i));
    return;
  }
  Xo() && e.debug && e.debug(...["[login-focus-trap]"].concat(i));
}, W = { IDLE: "IDLE", ACTIVE: "ACTIVE", RESTORING_FOCUS: "RESTORING_FOCUS", DESTROYED: "DESTROYED" }, mt = typeof document < "u" && typeof window < "u";
function k(t, e) {
  e || (e = {});
  const i = e.accessibility || {};
  this.container = t, this.config = e, this.state = W.IDLE, this.lastFocusedElement = null, this.circularRotation = i.circularFocusTrap !== !1, this.fallbackSelector = i.focusFallbackSelector || null, this.telemetry = e.telemetry || null, this.handleShiftEscape = i.focusTrapShiftEscape || !1, this._handleKeyDown = this.handleKeyDown.bind(this), this._handleFocusIn = this.handleFocusIn.bind(this), this.abortController = null, this.mutationObserver = null, this.focusableCache = null, this._metrics = { activations: 0, deactivations: 0, circularForward: 0, circularBackward: 0, escapePrevented: 0, focusRestored: 0 }, Qo();
}
k.prototype.activate = function() {
  if (!mt) {
    nt("info", "activate() ignorado SSR");
    return;
  }
  if (!this.container) {
    nt("info", "Container não definido");
    return;
  }
  if (this.state === W.ACTIVE) {
    nt("info", "Já ativo");
    return;
  }
  if (this._getFocusableElements().length === 0) {
    nt("info", "Nenhum elemento focável");
    return;
  }
  this._metrics.activations++, this.lastFocusedElement = document.activeElement, this._setState(W.ACTIVE), this.abortController = new AbortController(), this.container.addEventListener("keydown", this._handleKeyDown, { capture: !0, signal: this.abortController.signal }), document.addEventListener("focusin", this._handleFocusIn, { signal: this.abortController.signal }), this._setupMutationObserver(), this.focusFirstElement(), this._emitTelemetry("focus_trap_activated"), nt("info", "Focus trap ativado");
};
k.prototype.deactivate = function() {
  this.state === W.ACTIVE && (this._metrics.deactivations++, this._setState(W.RESTORING_FOCUS), this.abortController && (this.abortController.abort(), this.abortController = null), this.mutationObserver && (this.mutationObserver.disconnect(), this.mutationObserver = null), this._restoreFocus(), this._setState(W.IDLE), this._emitTelemetry("focus_trap_deactivated"), nt("info", "Focus trap desativado"));
};
k.prototype.handleKeyDown = function(t) {
  if (this.handleShiftEscape && t.shiftKey && t.key === "Escape") {
    this._emitTelemetry("focus_trap_shift_escape"), this._emitEvent("escape");
    return;
  }
  if (t.key !== "Tab") return;
  const e = this._getFocusableElements();
  if (e.length === 0) {
    t.preventDefault();
    return;
  }
  const i = e[0], o = e[e.length - 1];
  this.circularRotation ? t.shiftKey ? document.activeElement === i && (t.preventDefault(), o.focus(), this._metrics.circularBackward++) : document.activeElement === o && (t.preventDefault(), i.focus(), this._metrics.circularForward++) : (t.shiftKey && document.activeElement === i || !t.shiftKey && document.activeElement === o) && t.preventDefault();
};
k.prototype.handleFocusIn = function(t) {
  this.state !== W.ACTIVE || !this.container || this.container.contains(t.target) || (t.preventDefault(), t.stopPropagation(), this.focusFirstElement(), this._metrics.escapePrevented++);
};
k.prototype.focusFirstElement = function() {
  if (!mt) return;
  const t = this;
  t.focusableCache = null;
  const e = t._getFocusableElements();
  e.length > 0 ? requestAnimationFrame(() => {
    const i = e[0];
    i && i.offsetParent !== null && i.focus({ preventScroll: !0 });
  }) : t.fallbackSelector && t._focusFallback();
};
k.prototype.refresh = function() {
  this.focusableCache = null;
};
k.prototype._restoreFocus = function() {
  if (mt) {
    if (this._metrics.focusRestored++, this.lastFocusedElement && typeof this.lastFocusedElement.focus == "function")
      try {
        document.body.contains(this.lastFocusedElement) ? this.lastFocusedElement.focus({ preventScroll: !0 }) : this._focusFallback();
      } catch (t) {
        nt("error", "Erro ao restaurar foco", t), this._focusFallback();
      }
    else
      this._focusFallback();
    this.lastFocusedElement = null;
  }
};
k.prototype._focusFallback = function() {
  if (!mt) return;
  let t = null;
  this.fallbackSelector && (t = document.querySelector(this.fallbackSelector)), t || (t = document.querySelector('main[tabindex="-1"]')), t || (t = document.querySelector("h1, h2"), t && t.setAttribute("tabindex", "-1")), t || (t = document.body), t && t.focus({ preventScroll: !0 });
};
k.prototype._getFocusableElements = function() {
  if (!mt || !this.container) return [];
  if (this.focusableCache) return this.focusableCache;
  const t = ["a[href]:not([disabled]):not([data-ft-ignore])", "button:not([disabled]):not([data-ft-ignore])", "textarea:not([disabled]):not([data-ft-ignore])", 'input:not([type="hidden"]):not([disabled]):not([data-ft-ignore])', "select:not([disabled]):not([data-ft-ignore])", '[tabindex]:not([tabindex="-1"]):not([data-ft-ignore])'].join(","), e = Array.from(this.container.querySelectorAll(t)).filter((i) => i.offsetParent !== null);
  return this.focusableCache = e, e;
};
k.prototype._setupMutationObserver = function() {
  const t = this;
  !mt || typeof MutationObserver > "u" || (t.mutationObserver = new MutationObserver(() => {
    t.focusableCache = null;
  }), t.mutationObserver.observe(t.container, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ["disabled", "tabindex", "data-ft-ignore"] }));
};
k.prototype._emitEvent = function(t) {
  if (!mt || typeof CustomEvent > "u") return;
  const e = new CustomEvent(`focus-trap:${t}`, { bubbles: !0, cancelable: !0, detail: { state: this.state } });
  this.container.dispatchEvent(e);
};
k.prototype._setState = function(t) {
  const e = this.state;
  this.state = t, nt("info", `Estado: ${e} -> ${t}`);
};
k.prototype._emitTelemetry = function(t, e) {
  if (e || (e = {}), !!this.telemetry)
    try {
      this.telemetry.track(`focus-trap:${t}`, Object.assign({ event: t, state: this.state, timestamp: Date.now() }, e));
    } catch {
    }
};
k.prototype.getStatus = function() {
  return { state: this.state, isActive: this.state === W.ACTIVE, hasFocusableElements: this._getFocusableElements().length > 0, lastFocusedElement: this.lastFocusedElement ? this.lastFocusedElement.tagName : null };
};
k.prototype.unbind = function() {
  this.deactivate(), this._setState(W.DESTROYED), this.focusableCache = null;
};
k.prototype.info = function() {
  return { moduleId: Ve, version: Ui, portsInitialized: Nt.isInitialized(), metrics: Object.assign({}, this._metrics), state: this.state, status: this.getStatus(), timestamp: Date.now() };
};
k.prototype.healthCheck = function() {
  const t = je("logger"), e = { isBrowserEnvironment: mt, hasContainer: !!this.container, notDestroyed: this.state !== W.DESTROYED, canFindFocusables: this._getFocusableElements().length >= 0, loggerAvailable: !!t, portsInitialized: Nt.isInitialized() }, i = Object.values(e).filter(Boolean).length;
  return { status: i === 6 ? "HEALTHY" : i >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${i}/6`, healthy: i >= 4, checks: e, version: Ui, moduleId: Ve, portsInitialized: Nt.isInitialized(), timestamp: Date.now() };
};
const ne = typeof document < "u";
function ae(t, e) {
  e = e || {}, this.modal = t, this.config = e, this.telemetry = e.telemetry || null, this.idPrefix = e.idPrefix || "login";
}
ae.prototype.setOpen = function() {
  if (!this.modal) return;
  this.modal.removeAttribute("hidden"), this.modal.setAttribute("aria-hidden", "false"), this.modal.setAttribute("role", "dialog"), this.modal.setAttribute("aria-modal", "true");
  const t = `${this.idPrefix}-title`;
  this.modal.querySelector(`#${t}`) && this.modal.setAttribute("aria-labelledby", t), this._track("modal:opened");
};
ae.prototype.setClosed = function() {
  this.modal && (this.modal.setAttribute("hidden", ""), this.modal.setAttribute("aria-hidden", "true"), this.modal.removeAttribute("role"), this.modal.removeAttribute("aria-modal"), this.modal.removeAttribute("aria-labelledby"), this._track("modal:closed"));
};
ae.prototype._track = function(t) {
  this.telemetry && typeof this.telemetry == "function" && this.telemetry(t, { timestamp: Date.now() });
};
function ft(t) {
  t = t || {}, this.config = t, this.telemetry = t.telemetry || null, this.onRenderError = t.onRenderError || this._defaultRenderError.bind(this), this.onClearError = t.onClearError || this._defaultClearError.bind(this), this.errorElements = /* @__PURE__ */ new Set();
}
ft.prototype.setError = function(t, e, i) {
  if (!t || !ne) return;
  t.setAttribute("aria-invalid", "true");
  const o = `${t.id}-error`;
  this.onRenderError(t, o, e, i), t.setAttribute("aria-describedby", o), this.errorElements.add(o), this._track("field:error", { field: t.id, code: i });
};
ft.prototype.clearError = function(t) {
  if (!t) return;
  t.removeAttribute("aria-invalid");
  const e = t.getAttribute("aria-describedby");
  e && (this.onClearError(t, e), t.removeAttribute("aria-describedby"), this.errorElements.delete(e)), this._track("field:cleared", { field: t.id });
};
ft.prototype._defaultRenderError = function(t, e, i, o) {
  if (!ne) return;
  let s = document.getElementById(e);
  s || (s = document.createElement("div"), s.id = e, s.className = this.config.errorClass || "input-error-message", s.setAttribute("role", "alert"), s.setAttribute("aria-live", "polite"), o && s.setAttribute("data-error-code", o), t.parentElement ? t.parentElement.appendChild(s) : t.insertAdjacentElement("afterend", s)), s.textContent = i, o && !s.hasAttribute("data-error-code") && s.setAttribute("data-error-code", o);
};
ft.prototype._defaultClearError = (t, e) => {
  if (!ne) return;
  const i = document.getElementById(e);
  i && i.remove();
};
ft.prototype.cleanup = function() {
  const t = this;
  ne && (t.errorElements.forEach((e) => {
    const i = document.getElementById(e);
    i && i.remove();
  }), t.errorElements.clear());
};
ft.prototype._track = function(t, e) {
  e = e || {}, this.telemetry && typeof this.telemetry == "function" && this.telemetry(t, Object.assign({ timestamp: Date.now() }, e));
};
function le(t) {
  t = t || {}, this.config = t, this.telemetry = t.telemetry || null, this.autoFocus = t.autoFocus !== !1, this.temporaryTabIndex = /* @__PURE__ */ new WeakMap();
}
le.prototype.setStatus = function(t, e, i, o, s) {
  s === void 0 && (s = this.autoFocus), t && (t.setAttribute("role", e), t.setAttribute("aria-live", i), t.textContent = o, s && (t.hasAttribute("tabindex") || (t.tabIndex = -1, this.temporaryTabIndex.set(t, !0)), t.focus({ preventScroll: !0 })), this._track("alert:shown", { role: e, live: i, length: o.length }));
};
le.prototype.clearStatus = function(t) {
  t && (t.removeAttribute("role"), t.removeAttribute("aria-live"), t.textContent = "", this.temporaryTabIndex.has(t) && (t.removeAttribute("tabindex"), this.temporaryTabIndex.delete(t)), this._track("alert:cleared"));
};
le.prototype._track = function(t, e) {
  e = e || {}, this.telemetry && typeof this.telemetry == "function" && this.telemetry(t, Object.assign({ timestamp: Date.now() }, e));
};
function et(t, e, i) {
  e = e || {}, i = i || {}, this.modal = t, this.logger = i.logger || console;
  const o = e.ui || {}, s = { idPrefix: e.idPrefix || "login", errorClass: o.errorClass || e.errorClass, telemetry: i.telemetry || e.telemetry || null };
  this._modalManager = new ae(t, s), this._fieldManager = new ft(s), this._alertManager = new le(s);
}
et.prototype.setModalOpen = function() {
  this._modalManager.setOpen();
};
et.prototype.setModalClosed = function() {
  this._modalManager.setClosed();
};
et.prototype.setInputError = function(t, e) {
  this._fieldManager.setError(t, e);
};
et.prototype.clearInputError = function(t) {
  this._fieldManager.clearError(t);
};
et.prototype.setErrorAlert = function(t, e) {
  this._alertManager.setStatus(t, "alert", "assertive", e);
};
et.prototype.clearErrorAlert = function(t) {
  this._alertManager.clearStatus(t);
};
et.prototype.setButtonBusy = (t, e) => {
  t && (e ? t.setAttribute("aria-busy", "true") : t.removeAttribute("aria-busy"));
};
et.prototype.setTogglePressed = (t, e) => {
  t && (t.setAttribute("aria-pressed", e ? "true" : "false"), t.setAttribute("aria-label", e ? "Ocultar senha" : "Mostrar senha"));
};
et.prototype.cleanup = function() {
  this._fieldManager.cleanup();
};
const hi = "5.5.0-ENTERPRISE", mi = "login-modal-accessibility-keyboard", Jo = { Escape: { enabled: !0, blockedWhenBusy: !0 } }, he = typeof document < "u" && typeof window < "u";
class Zo {
  constructor(e = {}, i = {}) {
    var o;
    this.config = e, this.logger = i.logger || console, this.telemetry = i.telemetry || null, this.scope = he ? e.scope || document : null, this.scopeElementId = this.scope === document ? "document" : ((o = this.scope) == null ? void 0 : o.id) || "custom", this.isActive = !1, this.isBusy = !1, this.isModalOpen = !1, this.keymapLocked = !1, this.keymap = { ...Jo, ...e.keymap || {} }, this.escapePolicy = e.escapePolicy || { alwaysEnabled: !0, requireConfirmWhenBusy: !1, messageWhenBlocked: "Aguarde a operação terminar" }, this.callbacks = /* @__PURE__ */ new Map(), this._handleKeyDown = this.handleKeyDown.bind(this), this.abortController = null, this._metrics = { activations: 0, deactivations: 0, keyTriggered: 0, keyBlocked: 0, errors: 0 };
  }
  activate(e = {}) {
    var i;
    if (!he || !this.scope) {
      (i = this.logger) == null || i.warn("KeyboardHandler: ambiente não-browser ou scope não definido");
      return;
    }
    if (this.isActive) {
      this.logger.warn("KeyboardHandler já ativo");
      return;
    }
    this._metrics.activations++, this.isActive = !0, this.isModalOpen = !0, this.callbacks = new Map(Object.entries(e)), this.abortController = new AbortController(), this.scope.addEventListener("keydown", this._handleKeyDown, { signal: this.abortController.signal }), this._track("keyboard:activated", { scope: this.scopeElementId }), this.logger.info("Keyboard handler ativado", { keys: Object.keys(this.keymap), scope: this.scopeElementId });
  }
  deactivate() {
    this.isActive && (this._metrics.deactivations++, this.isActive = !1, this.isModalOpen = !1, this.callbacks.clear(), this.abortController && (this.abortController.abort(), this.abortController = null), this._track("keyboard:deactivated"), this.logger.info("Keyboard handler desativado"));
  }
  handleKeyDown(e) {
    const { key: i } = e, o = this.keymap[i];
    if (!o || !o.enabled || !this.isModalOpen) return;
    if (i === "Escape" && this.escapePolicy.alwaysEnabled) {
      if (this.isBusy && this.escapePolicy.requireConfirmWhenBusy) {
        this._metrics.keyBlocked++, this._track("key:blocked", { key: i, reason: "busy_requires_confirm" }), this.logger.info("ESC bloqueado (busy + requireConfirm)", { message: this.escapePolicy.messageWhenBlocked });
        return;
      }
      const n = this.callbacks.get(i);
      n && typeof n == "function" && (e.preventDefault(), this._metrics.keyTriggered++, this._track("key:triggered", { key: i }), this.logger.info(`${i} pressionado - executando callback (policy: alwaysEnabled)`), n(e));
      return;
    }
    if (o.blockedWhenBusy && this.isBusy) {
      this._metrics.keyBlocked++, this._track("key:blocked", { key: i, reason: "busy" }), this.logger.info(`${i} bloqueado (busy state)`);
      return;
    }
    const s = this.callbacks.get(i);
    s && typeof s == "function" && (e.preventDefault(), this._metrics.keyTriggered++, this._track("key:triggered", { key: i }), this.logger.info(`${i} pressionado - executando callback`), s(e));
  }
  registerKey(e, i = {}, o) {
    return this.keymapLocked ? (this.logger.warn(`Keymap locked - não pode registrar ${e}`), !1) : (this.keymap[e] = { enabled: i.enabled !== !1, blockedWhenBusy: i.blockedWhenBusy !== !1 }, o && this.callbacks.set(e, o), this.logger.info(`Tecla ${e} registrada`, i), !0);
  }
  unregisterKey(e) {
    return this.keymapLocked ? (this.logger.warn(`Keymap locked - não pode remover ${e}`), !1) : (delete this.keymap[e], this.callbacks.delete(e), this.logger.info(`Tecla ${e} removida`), !0);
  }
  lockKeymap() {
    this.keymapLocked = !0, this.logger.info("Keymap locked");
  }
  unlockKeymap() {
    this.keymapLocked = !1, this.logger.info("Keymap unlocked");
  }
  setBusy(e) {
    this.isBusy = e;
  }
  setModalOpen(e) {
    this.isModalOpen = e;
  }
  getState() {
    return { isActive: this.isActive, isBusy: this.isBusy, isModalOpen: this.isModalOpen, keymapLocked: this.keymapLocked, registeredKeys: Object.keys(this.keymap), scope: this.scopeElementId, escapePolicy: this.escapePolicy };
  }
  _track(e, i = {}) {
    this.telemetry && typeof this.telemetry == "function" && this.telemetry(e, { ...i, timestamp: Date.now(), source: "keyboard-handler" });
  }
  info() {
    return { moduleId: mi, version: hi, metrics: { ...this._metrics }, state: this.getState(), timestamp: Date.now() };
  }
  healthCheck() {
    const e = { isBrowserEnvironment: he, scopeDefined: !!this.scope, keymapValid: Object.keys(this.keymap).length > 0, lowErrorRate: this._metrics.keyTriggered === 0 || this._metrics.errors / this._metrics.keyTriggered < 0.1 }, i = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
    return { status: i === o ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${o}`, healthy: i >= 2, checks: e, version: hi, moduleId: mi, timestamp: Date.now() };
  }
}
const zi = "login-modal-error-display", xi = "5.5.0-ENTERPRISE", Ge = { AUTO_HIDE: "error-auto-hide", COUNTDOWN: "error-countdown" };
function U(t, e, i, o) {
  o = o || {}, this.errorElement = t, this.ariaManager = e, this.timersManager = i, this.autoHideEnabled = o.autoHide !== !1, this.autoHideDelay = o.autoHideDelay || 5e3, this.telemetry = o.telemetry || null, this.currentCountdownKey = null, this.errorCounts = /* @__PURE__ */ new Map(), this.lastAriaMessage = "", this.lastAriaUpdate = 0, this.ariaDebounceMs = 2e3, this._mounted = !1;
}
U.prototype.mount = function() {
  this._mounted = !0;
};
U.prototype.show = function(t) {
  const e = this;
  t = t || {};
  const i = t.message, o = t.code || null, s = t.countdownMs || null, n = t.focusTarget || null, r = t.autoHide !== void 0 ? t.autoHide : this.autoHideEnabled;
  !this.errorElement || !i || (this._clearAllTimers(), this.errorElement.textContent = i, this.errorElement.classList.add("show"), o && this.errorElement.setAttribute("data-error-code", o), this._updateAria(i), this._trackError(o), s && s > 0 ? this._startCountdown(s, n, i) : r && this.timersManager && this.timersManager.set(Ge.AUTO_HIDE, () => {
    e.hide(n);
  }, this.autoHideDelay));
};
U.prototype.showWithCountdown = function(t, e, i) {
  const o = e > 1e3 ? e : e * 1e3;
  this.show({ message: t, countdownMs: o, focusTarget: i });
};
U.prototype._startCountdown = function(t, e, i) {
  const o = this;
  let s = Math.ceil(t / 1e3);
  const n = `${Ge.COUNTDOWN}-${Date.now()}`;
  this.currentCountdownKey = n;
  const r = () => {
    if (s <= 0) {
      o.hide(e);
      return;
    }
    const l = Math.floor(s / 60), d = s % 60, c = `${l}:${String(d).padStart(2, "0")}`, u = `${i} ${c}`;
    o.errorElement.textContent = u, o.errorElement.classList.add("show"), (s % 10 === 0 || s <= 5) && o._updateAria(u, !0), s--, o.timersManager && o.timersManager.set(n, r, 1e3);
  };
  r();
};
U.prototype._updateAria = function(t, e) {
  const i = Date.now(), o = i - this.lastAriaUpdate;
  (e || this.lastAriaMessage !== t || o > this.ariaDebounceMs) && this.ariaManager && this.ariaManager.setErrorAlert && (this.ariaManager.setErrorAlert(this.errorElement, t), this.lastAriaMessage = t, this.lastAriaUpdate = i);
};
U.prototype.hide = function(t) {
  this.errorElement && (this.errorElement.classList.remove("show"), this.errorElement.removeAttribute("data-error-code"), this.ariaManager && this.ariaManager.clearErrorAlert && this.ariaManager.clearErrorAlert(this.errorElement), this._clearAllTimers(), this.lastAriaMessage = "", this.lastAriaUpdate = 0, t && (typeof t == "function" ? t() : t instanceof HTMLElement && t.focus()));
};
U.prototype.clear = function() {
  this.hide();
};
U.prototype.unmount = function() {
  this._clearAllTimers(), this._mounted = !1;
};
U.prototype._clearAllTimers = function() {
  this.timersManager && this.timersManager.clear && (this.timersManager.clear(Ge.AUTO_HIDE), this.currentCountdownKey && (this.timersManager.clear(this.currentCountdownKey), this.currentCountdownKey = null));
};
U.prototype._trackError = function(t) {
  if (!t) return;
  const e = (this.errorCounts.get(t) || 0) + 1;
  this.errorCounts.set(t, e), this.telemetry && typeof this.telemetry == "function" && this.telemetry("error:shown", { code: t, count: e, timestamp: Date.now() });
};
U.prototype.getErrorStats = function() {
  return Object.fromEntries(this.errorCounts);
};
U.prototype.resetStats = function() {
  this.errorCounts.clear();
};
U.prototype.info = function() {
  return { moduleId: zi, version: xi, mounted: this._mounted, hasErrorElement: !!this.errorElement, hasAriaManager: !!this.ariaManager, hasTimersManager: !!this.timersManager, autoHideEnabled: this.autoHideEnabled, autoHideDelay: this.autoHideDelay, errorStats: this.getErrorStats(), timestamp: Date.now() };
};
U.prototype.healthCheck = function() {
  const t = { hasErrorElement: !!this.errorElement, hasAriaManager: !!this.ariaManager, hasTimersManager: !!this.timersManager, isMounted: this._mounted }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 4 ? "HEALTHY" : e >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${e}/4`, checks: t, version: xi, moduleId: zi, timestamp: Date.now() };
};
const Ye = "login-modal-toggle-password", Hi = "5.5.0-ENTERPRISE", ts = { show: "Mostrar senha", hide: "Ocultar senha" };
function G(t, e, i, o) {
  i = i || {}, o = o || {}, this.passwordInput = t, this.toggleButton = e, this.config = i, this.enabled = i.enabled !== !1, this.labels = Object.assign({}, ts, i.labels || {}), this.logger = o.logger || console, this.telemetry = o.telemetry || null, this.onToggle = i.onToggle || null, this.isVisible = !1, this.toggleCount = 0, this._mounted = !1, this._handleClick = this.handleClick.bind(this);
}
G.prototype.mount = function() {
  if (!this.passwordInput || !this.toggleButton) {
    this.logger && this.logger.warn && this.logger.warn("[toggle-password] Password input ou toggle button não encontrado");
    return;
  }
  if (!this.enabled) {
    this.toggleButton.style.display = "none", this.logger && this.logger.info && this.logger.info("[toggle-password] Toggle password DESABILITADO por política");
    return;
  }
  this.unmount(), this.toggleButton.addEventListener("click", this._handleClick), this._updateAriaState(!1), this._mounted = !0, this.logger && this.logger.info && this.logger.info("[toggle-password] Toggle password montado");
};
G.prototype.handleClick = function(t) {
  if (t.preventDefault(), t.stopPropagation(), !this.enabled) {
    this.logger && this.logger.warn && this.logger.warn("[toggle-password] Toggle bloqueado por política");
    return;
  }
  this.isVisible = !this.isVisible, this.toggleCount++, this.passwordInput.type = this.isVisible ? "text" : "password", this._updateAriaState(this.isVisible), this.onToggle && typeof this.onToggle == "function" && this.onToggle(this.isVisible), this._track(this.isVisible ? "password:view:enabled" : "password:view:disabled"), this.logger && this.logger.info && this.logger.info(`[toggle-password] Senha ${this.isVisible ? "VISÍVEL" : "OCULTA"}`, { toggleCount: this.toggleCount });
};
G.prototype._updateAriaState = function(t) {
  this.toggleButton && (this.toggleButton.setAttribute("aria-pressed", t ? "true" : "false"), this.toggleButton.setAttribute("aria-label", t ? this.labels.hide : this.labels.show));
};
G.prototype.setEnabled = function(t) {
  this.enabled = t, this.toggleButton && (this.toggleButton.style.display = t ? "" : "none", this.toggleButton.disabled = !t), this.logger && this.logger.info && this.logger.info(`[toggle-password] Toggle password ${t ? "HABILITADO" : "DESABILITADO"}`);
};
G.prototype.getStats = function() {
  return { toggleCount: this.toggleCount, currentlyVisible: this.isVisible };
};
G.prototype.resetStats = function() {
  this.toggleCount = 0;
};
G.prototype.unmount = function() {
  this.toggleButton && this.toggleButton.removeEventListener("click", this._handleClick), this.passwordInput && (this.passwordInput.type = "password"), this.isVisible = !1, this._mounted = !1;
};
G.prototype._track = function(t) {
  this.telemetry && typeof this.telemetry == "function" && this.telemetry(t, { toggleCount: this.toggleCount, timestamp: Date.now(), source: Ye });
};
G.prototype.info = function() {
  return { moduleId: Ye, version: Hi, mounted: this._mounted, enabled: this.enabled, isVisible: this.isVisible, stats: this.getStats(), hasPasswordInput: !!this.passwordInput, hasToggleButton: !!this.toggleButton, timestamp: Date.now() };
};
G.prototype.healthCheck = function() {
  const t = { hasPasswordInput: !!this.passwordInput, hasToggleButton: !!this.toggleButton, isMounted: this._mounted, isEnabled: this.enabled }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 4 ? "HEALTHY" : e >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${e}/4`, checks: t, version: Hi, moduleId: Ye, timestamp: Date.now() };
};
const Fi = "login-modal-form", Vi = "5.6.0-ENTERPRISE";
function V(t, e, i) {
  e = e || {}, i = i || {}, this.form = t, this.config = e, this.idPrefix = e.idPrefix || "login", this.ariaManager = i.ariaManager, this.logger = i.logger || console, this.onSubmitCallback = null, this._handleSubmit = this.handleSubmit.bind(this), this._handleButtonClick = this.handleButtonClick.bind(this), this.mounted = !1, this.isBusy = !1, this.submitLock = !1, this._metrics = { submits: 0, errors: 0, rememberMeChecked: 0 };
}
V.prototype.mount = function(t) {
  if (this.mounted && this.unmount(), !this.form) {
    this.logger && this.logger.warn && this.logger.warn("[FormComponent] Form não encontrado");
    return;
  }
  this.onSubmitCallback = t, this.form.addEventListener("submit", this._handleSubmit);
  const e = this.form.querySelector('button[type="submit"]');
  e && e.addEventListener("click", this._handleButtonClick), this.mounted = !0, this.logger && this.logger.info && this.logger.info("[FormComponent] Montado com event delegation");
};
V.prototype.handleButtonClick = function(t) {
  t.preventDefault(), this._processSubmit();
};
V.prototype.handleSubmit = function(t) {
  t.preventDefault(), this._processSubmit();
};
V.prototype._processSubmit = function() {
  const t = this;
  if (this.isBusy || this.submitLock) {
    this.logger && this.logger.warn && this.logger.warn("[FormComponent] Já processando, ignorando submit");
    return;
  }
  this.submitLock = !0, setTimeout(() => {
    t.submitLock = !1;
  }, 300);
  const e = this.form.querySelector(`#${this.idPrefix}-email`), i = this.form.querySelector(`#${this.idPrefix}-password`), o = this.form.querySelector(`#${this.idPrefix}-remember`);
  if (!e || !i) {
    this._metrics.errors++, this.logger && this.logger.error && this.logger.error("[FormComponent] Inputs não encontrados");
    return;
  }
  const s = (e.value || "").trim(), n = i.value || "", r = o ? o.checked : !1;
  r && this._metrics.rememberMeChecked++, this._metrics.submits++, this.logger && this.logger.info && this.logger.info("[FormComponent] Submit processado", { username: s, rememberMe: r }), this.onSubmitCallback && this.onSubmitCallback(s, n, r);
};
V.prototype.getRememberMe = function() {
  const t = this.form ? this.form.querySelector(`#${this.idPrefix}-remember`) : null;
  return t ? t.checked : !1;
};
V.prototype.setRememberMe = function(t) {
  const e = this.form ? this.form.querySelector(`#${this.idPrefix}-remember`) : null;
  e && (e.checked = t);
};
V.prototype.setBusy = function(t) {
  if (this.isBusy = t, (this.form ? this.form.querySelectorAll('input:not([type="checkbox"]), button') : []).forEach((i) => {
    i.disabled = t;
  }), this.form && this.form.setAttribute("aria-busy", t.toString()), this.ariaManager && typeof this.ariaManager.setButtonBusy == "function") {
    const i = this.form ? this.form.querySelector('button[type="submit"]') : null;
    i && this.ariaManager.setButtonBusy(i, t);
  }
};
V.prototype.focus = function() {
  const t = this.form ? this.form.querySelector('input:not([disabled]):not([type="checkbox"])') : null;
  t && t.focus();
};
V.prototype.clear = function() {
  const t = this.form ? this.form.querySelector(`#${this.idPrefix}-email`) : null, e = this.form ? this.form.querySelector(`#${this.idPrefix}-password`) : null;
  t && (t.value = ""), e && (e.value = ""), this.setBusy(!1);
};
V.prototype.unmount = function() {
  this.form && this._handleSubmit && this.form.removeEventListener("submit", this._handleSubmit);
  const t = this.form ? this.form.querySelector('button[type="submit"]') : null;
  t && this._handleButtonClick && t.removeEventListener("click", this._handleButtonClick), this.clear(), this.mounted = !1, this.logger && this.logger.info && this.logger.info("[FormComponent] Desmontado");
};
V.prototype.info = function() {
  return { moduleId: Fi, version: Vi, mounted: this.mounted, isBusy: this.isBusy, hasForm: !!this.form, idPrefix: this.idPrefix, rememberMe: this.getRememberMe(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
V.prototype.healthCheck = function() {
  const t = { hasForm: !!this.form, isMounted: this.mounted, notBusy: !this.isBusy, hasCallback: !!this.onSubmitCallback }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 4 ? "HEALTHY" : e >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${e}/4`, checks: t, version: Vi, moduleId: Fi, timestamp: Date.now() };
};
const pi = "5.5.0-ENTERPRISE", me = "login-modal-ui-capslock-detector", es = typeof document < "u";
class is {
  constructor(e, i, o = {}) {
    this.passwordInput = e, this.warningElement = i, this.config = o, this.telemetry = o.telemetry || null, this.logger = o.logger || console, this._mounted = !1, this._capsLockOn = !1, this._metrics = { detections: 0, shows: 0, hides: 0 }, this._handleKeyDown = this._onKeyDown.bind(this), this._handleKeyUp = this._onKeyUp.bind(this), this._handleBlur = this._onBlur.bind(this);
  }
  mount() {
    !es || !this.passwordInput || this._mounted || (this.passwordInput.addEventListener("keydown", this._handleKeyDown), this.passwordInput.addEventListener("keyup", this._handleKeyUp), this.passwordInput.addEventListener("blur", this._handleBlur), this._mounted = !0, this._track("capslock:mounted"));
  }
  unmount() {
    var e, i, o;
    this._mounted && ((e = this.passwordInput) == null || e.removeEventListener("keydown", this._handleKeyDown), (i = this.passwordInput) == null || i.removeEventListener("keyup", this._handleKeyUp), (o = this.passwordInput) == null || o.removeEventListener("blur", this._handleBlur), this._mounted = !1, this.hide(), this._track("capslock:unmounted"));
  }
  _onKeyDown(e) {
    this._detectCapsLock(e);
  }
  _onKeyUp(e) {
    this._detectCapsLock(e);
  }
  _onBlur() {
    this.hide();
  }
  _detectCapsLock(e) {
    if (typeof e.getModifierState != "function") return;
    const i = e.getModifierState("CapsLock");
    this._metrics.detections++, i !== this._capsLockOn && (this._capsLockOn = i, i ? this.show() : this.hide());
  }
  show() {
    this.warningElement && (this._metrics.shows++, this.warningElement.removeAttribute("hidden"), this._track("capslock:shown"));
  }
  hide() {
    this.warningElement && (this._metrics.hides++, this.warningElement.setAttribute("hidden", ""), this._track("capslock:hidden"));
  }
  isCapsLockOn() {
    return this._capsLockOn;
  }
  isMounted() {
    return this._mounted;
  }
  _track(e, i = {}) {
    this.telemetry && typeof this.telemetry == "function" && this.telemetry(e, { ...i, timestamp: Date.now(), source: me });
  }
  info() {
    return { moduleId: me, version: pi, mounted: this._mounted, capsLockOn: this._capsLockOn, metrics: { ...this._metrics }, timestamp: Date.now() };
  }
  healthCheck() {
    const e = { hasPasswordInput: !!this.passwordInput, hasWarningElement: !!this.warningElement, isMounted: this._mounted }, i = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
    return { status: i === o ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${o}`, checks: e, version: pi, moduleId: me, timestamp: Date.now() };
  }
}
const fi = "login-modal-error-handler", gi = "5.5.0-ENTERPRISE", _ = { NETWORK: { category: "NETWORK", codes: { TIMEOUT: { code: "REQUEST_TIMEOUT", severity: "warning" }, ABORTED: { code: "REQUEST_ABORTED", severity: "info" }, OFFLINE: { code: "NETWORK_ERROR", severity: "error" } } }, AUTH: { category: "AUTH", codes: { INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", severity: "warning" }, FORBIDDEN: { code: "ACCESS_DENIED", severity: "error" } } }, VALIDATION: { category: "VALIDATION", codes: { INVALID_INPUT: { code: "VALIDATION_ERROR", severity: "warning" }, NOT_FOUND: { code: "NOT_FOUND", severity: "warning" } } }, RATE_LIMIT: { category: "RATE_LIMIT", codes: { TOO_MANY_REQUESTS: { code: "RATE_LIMITED", severity: "warning" }, LOCKED: { code: "ACCOUNT_LOCKED", severity: "error" } } }, SERVER: { category: "SERVER", codes: { INTERNAL: { code: "SERVER_ERROR", severity: "error" }, UNAVAILABLE: { code: "SERVICE_UNAVAILABLE", severity: "error" } } }, UNKNOWN: { category: "UNKNOWN", codes: { GENERIC: { code: "UNKNOWN_ERROR", severity: "error" } } } }, os = { 0: _.NETWORK.codes.OFFLINE, 400: _.VALIDATION.codes.INVALID_INPUT, 401: _.AUTH.codes.INVALID_CREDENTIALS, 403: _.AUTH.codes.FORBIDDEN, 404: _.VALIDATION.codes.NOT_FOUND, 429: _.RATE_LIMIT.codes.TOO_MANY_REQUESTS, 500: _.SERVER.codes.INTERNAL, 503: _.SERVER.codes.UNAVAILABLE };
class ss {
  constructor(e = {}) {
    var i;
    typeof e.info == "function" || typeof e.error == "function" ? (this.logger = e, this.config = {}, this.secureMode = !1, this.verbose = !1) : (this.config = e, this.logger = e.logger || console, this.secureMode = ((i = e.security) == null ? void 0 : i.secureMode) || !1, this.verbose = e.debug || !1), this._metrics = { classifications: 0, errors: 0 };
  }
  classify(e, i = {}) {
    var o;
    if (this._metrics.classifications++, (o = i.rateLimiter) != null && o.isLocked())
      return { root: _.RATE_LIMIT.category, code: _.RATE_LIMIT.codes.LOCKED.code, severity: _.RATE_LIMIT.codes.LOCKED.severity, source: "rate-limiter", data: { remainingTime: i.rateLimiter.getRemainingTime() } };
    if (e.status !== void 0 && e.status !== null) {
      const s = os[e.status] || _.UNKNOWN.codes.GENERIC;
      return { root: this._getRootFromTaxonomy(s), code: s.code, severity: s.severity, source: "http", httpStatus: e.status, data: this._extractErrorData(e) };
    }
    return e.name === "AbortError" || e.code === "REQUEST_ABORTED" ? { root: _.NETWORK.category, code: _.NETWORK.codes.ABORTED.code, severity: _.NETWORK.codes.ABORTED.severity, source: "network" } : e.code === "REQUEST_TIMEOUT" ? { root: _.NETWORK.category, code: _.NETWORK.codes.TIMEOUT.code, severity: _.NETWORK.codes.TIMEOUT.severity, source: "network" } : { root: _.UNKNOWN.category, code: _.UNKNOWN.codes.GENERIC.code, severity: _.UNKNOWN.codes.GENERIC.severity, source: "unknown" };
  }
  format(e, i, o = "pt-BR") {
    return { REQUEST_TIMEOUT: "Tempo esgotado", NETWORK_ERROR: "Erro de conexão", INVALID_CREDENTIALS: "Usuário ou senha incorretos", RATE_LIMITED: "Muitas tentativas", SERVER_ERROR: "Erro no servidor", UNKNOWN_ERROR: "Erro inesperado" }[e.code] || e.code;
  }
  handleLoginError(e, i, o, s = 0) {
    var n;
    this._metrics.errors++;
    const r = this.classify(e, { rateLimiter: i }), l = this.format(r, e);
    return o && ((n = o.trackError) == null || n.call(o, r.code, l, s)), { errorCode: r.code, errorMessage: l, data: r.data || {} };
  }
  _getRootFromTaxonomy(e) {
    for (const [i, o] of Object.entries(_))
      if (Object.values(o.codes || {}).includes(e))
        return i;
    return _.UNKNOWN.category;
  }
  _extractErrorData(e) {
    const i = {};
    return e.retryAfter && (i.retryAfter = e.retryAfter > 1e4 ? e.retryAfter : e.retryAfter * 1e3), i;
  }
  info() {
    return { moduleId: fi, version: gi, metrics: { ...this._metrics }, timestamp: Date.now() };
  }
  healthCheck() {
    const e = { hasLogger: !!this.logger, taxonomyLoaded: Object.keys(_).length > 0 }, i = Object.values(e).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: e, version: gi, moduleId: fi, timestamp: Date.now() };
  }
}
const ji = "6.0.1-P18EC", Ke = "login-modal-video-manager", qe = T({ moduleId: Ke });
function We(t) {
  return qe.get(t);
}
const rs = () => {
  const t = We("config");
  return !!(t && t.app && t.app.debug);
}, z = function(t) {
  const e = We("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-video-manager]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-video-manager]"].concat(i));
    return;
  }
  rs() && e.debug && e.debug(...["[login-video-manager]"].concat(i));
}, f = { IDLE: "IDLE", PENDING: "PENDING", LOADING: "LOADING", LOADED: "LOADED", PLAYING: "PLAYING", PAUSED: "PAUSED", ERROR: "ERROR", DESTROYED: "DESTROYED" };
function O(t, e) {
  e || (e = {});
  const i = e.video || {};
  this.video = t, this.config = e, this.logger = e.logger || null, this.state = f.IDLE, this.playPromise = null, this.retryCount = 0, this.maxRetries = i.maxRetries || 3, this.liteMode = i.liteMode || !1, this.cleanupOnClose = i.cleanupOnClose !== !1, this.listeners = /* @__PURE__ */ new Map(), this.lazyLoad = i.lazyLoad !== !1, this.preloadOnMount = i.preloadOnMount || !1, this._videoSrc = i.src || "/assets/videos/video_background_site_web.mp4", this._srcLoaded = !1, this._intersectionObserver = null, this._metrics = { mounts: 0, loads: 0, plays: 0, pauses: 0, errors: 0, retries: 0, cleanups: 0, lazyLoads: 0 }, z("info", "VideoManager inicializado", { liteMode: this.liteMode, lazyLoad: this.lazyLoad, state: this.state });
}
O.prototype.mount = function() {
  return this._metrics.mounts++, this.video ? this.liteMode ? (z("info", "Lite mode ativo - vídeo desabilitado"), this._emit("video:lite_mode"), !1) : (this.video.muted = !0, this.video.playsInline = !0, this.video.loop = !0, this.lazyLoad && !this.preloadOnMount ? (this._setState(f.PENDING), this._setupIntersectionObserver(), z("info", "Video em modo lazy - aguardando trigger"), !0) : (this._loadVideoSrc(), z("info", "Video montado com preload"), !0)) : (this._setState(f.ERROR, { reason: "no_video_element" }), this._emit("video:error:missing_element"), !1);
};
O.prototype.triggerLazyLoad = function() {
  !this.lazyLoad || this._srcLoaded || this.state === f.DESTROYED || (this._metrics.lazyLoads++, z("info", "Lazy load triggered"), this._loadVideoSrc(), this.play());
};
O.prototype._loadVideoSrc = function() {
  if (this._srcLoaded || !this.video) return;
  this.video.querySelectorAll("source").forEach((i) => {
    i.remove();
  });
  const e = document.createElement("source");
  e.src = this._videoSrc, e.type = "video/mp4", this.video.appendChild(e), this.video.src = this._videoSrc, this._srcLoaded = !0, this.load();
};
O.prototype._setupIntersectionObserver = function() {
  const t = this;
  !t.video || typeof IntersectionObserver > "u" || (t._intersectionObserver = new IntersectionObserver((e) => {
    e.forEach((i) => {
      i.isIntersecting && !t._srcLoaded && (t.triggerLazyLoad(), t._intersectionObserver && t._intersectionObserver.disconnect());
    });
  }, { threshold: 0.1 }), t._intersectionObserver.observe(t.video));
};
O.prototype.load = function() {
  if (this._metrics.loads++, !(this.state === f.LOADED || this.state === f.LOADING)) {
    if (!this.video || this.state === f.DESTROYED) {
      this._setState(f.ERROR, { reason: "no_video_element" }), this._emit("video:error:missing_element");
      return;
    }
    try {
      this._setState(f.LOADING), this.video.load(), this._setState(f.LOADED), this._emit("loaded");
    } catch (t) {
      this._metrics.errors++, this._setState(f.ERROR, { error: t.message }), this._emit("video:error:network", { error: t });
    }
  }
};
O.prototype.play = function() {
  const t = this;
  if (t._metrics.plays++, !t.video || t.liteMode || t.state === f.DESTROYED) return Promise.resolve();
  if (t.lazyLoad && !t._srcLoaded && t._loadVideoSrc(), t.state === f.PLAYING)
    return z("info", "Já está reproduzindo"), Promise.resolve();
  if (t.state === f.ERROR)
    return z("info", "Estado inválido para play", { state: t.state }), Promise.resolve();
  (t.state === f.IDLE || t.state === f.PENDING) && t.load();
  function e() {
    return !t.video || t.state === f.DESTROYED ? (z("info", "Video removido antes de play"), Promise.resolve()) : (t.playPromise = t.video.play(), t.playPromise.then(() => {
      t._setState(f.PLAYING), t._emit("playing"), t.retryCount = 0, t.playPromise = null;
    }).catch((o) => {
      if (z("info", "Erro ao reproduzir", o), o.name === "NotAllowedError" && t._emit("video:error:autoplay", { error: o, retryCount: t.retryCount }), o.name === "NotAllowedError" && t.retryCount < t.maxRetries)
        return t._metrics.retries++, t.retryCount++, t.video && (t.video.muted = !0), new Promise((s) => {
          setTimeout(() => {
            t.state !== f.DESTROYED ? s(t.play()) : s();
          }, 500);
        });
      t._metrics.errors++, t._setState(f.ERROR, { error: o.message }), t._emit("video:error:playback", { error: o }), t.playPromise = null;
    }));
  }
  return t.state === f.LOADING ? t._waitForState(f.LOADED, 5e3).then(e).catch(() => e()) : (t.playPromise ? t.playPromise.catch(() => {
  }) : Promise.resolve()).then(e);
};
O.prototype.pause = function() {
  const t = this;
  return t._metrics.pauses++, !t.video || t.state === f.DESTROYED || t.state !== f.PLAYING ? Promise.resolve() : (t.playPromise ? t.playPromise.catch(() => {
  }) : Promise.resolve()).then(() => {
    !t.video || t.state === f.DESTROYED || (t.video.pause(), t._setState(f.PAUSED), t._emit("paused"), t.playPromise = null);
  }).catch((i) => {
    t._metrics.errors++, z("error", "Erro ao pausar", i), t.playPromise = null;
  });
};
O.prototype.cleanup = function() {
  const t = this;
  return t._metrics.cleanups++, !t.video || t.state === f.DESTROYED ? Promise.resolve() : (t.playPromise ? t.playPromise.catch(() => {
  }) : Promise.resolve()).then(() => {
    if (!t.video || t.state === f.DESTROYED) return;
    t.video.pause(), t.video.removeAttribute("src"), t.video.querySelectorAll("source").forEach((o) => {
      o.remove();
    }), t.video.load(), t._srcLoaded = !1, t._setState(f.IDLE), t._emit("cleaned");
  }).catch((i) => {
    t._metrics.errors++, z("error", "Erro no cleanup", i);
  });
};
O.prototype.unmount = function() {
  const t = this;
  return t.state === f.DESTROYED ? Promise.resolve() : (t._intersectionObserver && (t._intersectionObserver.disconnect(), t._intersectionObserver = null), (t.cleanupOnClose ? t.cleanup() : t.pause()).then(() => {
    t._setState(f.DESTROYED), t.listeners.clear(), t.playPromise = null;
  }));
};
O.prototype.recreate = function() {
  return this.state !== f.DESTROYED ? (z("info", "recreate() só pode ser chamado no estado DESTROYED"), !1) : (this._setState(f.IDLE), this.retryCount = 0, this.playPromise = null, this._srcLoaded = !1, this.listeners.clear(), this.mount());
};
O.prototype.on = function(t, e) {
  this.listeners.has(t) || this.listeners.set(t, /* @__PURE__ */ new Set()), this.listeners.get(t).add(e);
  const i = this;
  return () => {
    i.off(t, e);
  };
};
O.prototype.off = function(t, e) {
  const i = this.listeners.get(t);
  i && i.delete(e);
};
O.prototype._emit = function(t, e) {
  e || (e = {});
  const i = this.listeners.get(t), o = this;
  i && i.forEach((s) => {
    try {
      s(Object.assign({ event: t, state: o.state }, e));
    } catch (n) {
      z("error", "Erro em listener", n);
    }
  });
};
O.prototype._setState = function(t, e) {
  e || (e = {});
  const i = this.state;
  this.state = t, z("info", `Estado: ${i} -> ${t}`, e), this._emit("state:change", { from: i, to: t, context: e });
};
O.prototype._waitForState = function(t, e) {
  const i = this;
  return e || (e = 5e3), new Promise((o, s) => {
    if (i.state === t) {
      o();
      return;
    }
    const n = setTimeout(() => {
      r(), s(new Error(`Timeout aguardando estado ${t}`));
    }, e), r = i.on("state:change", (l) => {
      l.to === t && (clearTimeout(n), r(), o());
    });
  });
};
O.prototype.getStatus = function() {
  return { state: this.state, liteMode: this.liteMode, lazyLoad: this.lazyLoad, srcLoaded: this._srcLoaded, retryCount: this.retryCount, hasVideo: !!this.video };
};
O.prototype.info = function() {
  return { moduleId: Ke, version: ji, portsInitialized: qe.isInitialized(), metrics: Object.assign({}, this._metrics), state: this.state, config: { liteMode: this.liteMode, lazyLoad: this.lazyLoad, maxRetries: this.maxRetries, cleanupOnClose: this.cleanupOnClose }, srcLoaded: this._srcLoaded, hasVideo: !!this.video, timestamp: Date.now() };
};
O.prototype.healthCheck = function() {
  const t = We("logger"), e = { notDestroyed: this.state !== f.DESTROYED, notInError: this.state !== f.ERROR, lowErrorRate: this._metrics.plays === 0 || this._metrics.errors / this._metrics.plays < 0.3, hasVideoElement: !!this.video || this.liteMode, loggerAvailable: !!t };
  let i = 0;
  return e.notDestroyed && i++, e.notInError && i++, e.lowErrorRate && i++, e.hasVideoElement && i++, e.loggerAvailable && i++, { status: i === 5 ? "HEALTHY" : i >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${i}/5`, healthy: i >= 3, checks: e, version: ji, moduleId: Ke, portsInitialized: qe.isInitialized(), timestamp: Date.now() };
};
const yi = "5.9.0-ENTERPRISE", Ee = "login-modal.state.store", ns = { CHANGE: "store:change" }, Xt = T({ moduleId: Ee });
function as() {
  Xt.init();
}
function St(t) {
  return Xt.get(t);
}
const ls = () => {
  var t, e;
  return ((e = (t = St("config")) == null ? void 0 : t.app) == null ? void 0 : e.debug) || !1;
}, Yt = (t, ...e) => {
  var i, o, s, n;
  const r = St("logger");
  if (!r) return;
  const l = "[login-store]";
  if (t === "error") {
    (i = r.error) == null || i.call(r, l, ...e);
    return;
  }
  if (t === "warn") {
    (o = r.warn) == null || o.call(r, l, ...e);
    return;
  }
  if (t === "info") {
    (s = r.info) == null || s.call(r, l, ...e);
    return;
  }
  ls() && ((n = r.debug) == null || n.call(r, l, ...e));
}, B = { CLOSED: "CLOSED", OPENING: "OPENING", OPEN: "OPEN", CLOSING: "CLOSING", BUSY: "BUSY", ERROR: "ERROR" };
class cs {
  constructor(e = {}) {
    as(), this.config = e, this.eventBus = e.eventBus || St("eventBus"), this.state = { status: B.CLOSED, busy: !1, error: null, user: null, lastAction: null, lastActionAt: null }, this.listeners = /* @__PURE__ */ new Set(), this._mounted = !1, this._metrics = { stateChanges: 0, busyToggles: 0, errors: 0 };
  }
  mount() {
    this._mounted || (this._mounted = !0, Yt("info", "Store montado"));
  }
  unmount() {
    this._mounted && (this.listeners.clear(), this._mounted = !1, Yt("info", "Store desmontado"));
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    this._metrics.stateChanges++;
    const i = { ...this.state };
    this.state = { ...this.state, ...e, lastActionAt: Date.now() }, this._notify(i, this.state);
  }
  setStatus(e) {
    this.setState({ status: e, lastAction: `status:${e}` });
  }
  setBusy(e) {
    this._metrics.busyToggles++;
    const i = e ? B.BUSY : this.state.status === B.BUSY ? B.OPEN : this.state.status;
    this.setState({ busy: e, status: i, lastAction: `busy:${e}` });
  }
  setError(e) {
    this._metrics.errors++, this.setState({ error: e, status: B.ERROR, lastAction: "error" });
  }
  clearError() {
    const e = this.state.busy ? B.BUSY : B.OPEN;
    this.setState({ error: null, status: e, lastAction: "clear-error" });
  }
  setUser(e) {
    this.setState({ user: e, lastAction: "set-user" });
  }
  open() {
    this.setState({ status: B.OPEN, error: null, lastAction: "open" });
  }
  close() {
    this.setState({ status: B.CLOSED, busy: !1, error: null, lastAction: "close" });
  }
  reset() {
    this.state = { status: B.CLOSED, busy: !1, error: null, user: null, lastAction: "reset", lastActionAt: Date.now() }, this._notify({}, this.state), Yt("info", "Store resetado");
  }
  isOpen() {
    return this.state.status === B.OPEN || this.state.status === B.BUSY;
  }
  isBusy() {
    return this.state.busy || this.state.status === B.BUSY;
  }
  hasError() {
    return !!this.state.error || this.state.status === B.ERROR;
  }
  subscribe(e) {
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  _notify(e, i) {
    var o, s;
    this.listeners.forEach((n) => {
      try {
        n(i, e);
      } catch (r) {
        Yt("error", "Erro em subscriber:", r);
      }
    }), (s = (o = this.eventBus) == null ? void 0 : o.emit) == null || s.call(o, ns.CHANGE, { prev: e, next: i });
  }
  getStatus() {
    return { mounted: this._mounted, state: this.getState(), subscriberCount: this.listeners.size, metrics: { ...this._metrics } };
  }
  info() {
    return { moduleId: Ee, version: yi, mounted: this._mounted, portsInitialized: Xt.isInitialized(), loggerAvailable: !!St("logger"), state: this.getState(), subscriberCount: this.listeners.size, metrics: { ...this._metrics }, timestamp: Date.now() };
  }
  healthCheck() {
    const e = { isMounted: this._mounted, validStatus: Object.values(B).includes(this.state.status), noStuckBusy: !this.state.busy || Date.now() - (this.state.lastActionAt || 0) < 6e4, lowErrorCount: this._metrics.errors < 100, loggerAvailable: !!St("logger"), portsInitialized: Xt.isInitialized() }, i = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
    return { status: i >= 5 ? "HEALTHY" : i >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${o}`, checks: e, version: yi, moduleId: Ee, timestamp: Date.now() };
  }
}
const Ei = "login-system-initializer", _i = "6.1.0-FIX-STORE-IMPORT", us = typeof document < "u" && typeof window < "u", ds = "login-modal-contracts", pe = "login-modal";
class hs {
  constructor(e) {
    this.modal = e, this._stateUnsubscribers = [], this._initialized = { core: !1, api: !1, accessibility: !1, ui: !1, managers: !1, css: !1, events: !1 };
  }
  initCoreSystems() {
    let e = this.modal.config, i = this.modal.eventBus;
    this.modal.logger = new M({ logLevel: e.debug && e.debug.logLevel ? e.debug.logLevel : "info", silent: e.debug && e.debug.silent ? e.debug.silent : !1 }), this.modal.telemetry = new F(e, { logger: this.modal.logger, eventBus: i }), this.modal.timers = new ko({ namespace: ds, telemetry: (function(o, s) {
      this.modal.telemetry && this.modal.telemetry.emit && this.modal.telemetry.emit(o, s);
    }).bind(this) }), this.modal.store = new cs({ debug: !!(e.debug && e.debug.enabled), persistCriticalStates: !1 }), this._initialized.core = !0, this.modal.logger && this.modal.logger.info && this.modal.logger.info("Core systems inicializados");
  }
  initAPISecurity() {
    let e = this.modal.config, i = this.modal.telemetry;
    const o = this.modal.eventBus;
    g && g.init && g.init(e, { eventBus: o }), this.modal.csrfManager = new Z(e), this.modal.deviceIDManager = new ht(e), this.modal.authAPI = new dt(e, { csrfManager: this.modal.csrfManager, deviceIDManager: this.modal.deviceIDManager, telemetry: i }), this.modal.validator = new Ko(e), this.modal.rateLimiter = new N(e), this.modal.securityCSRF = g, this._initialized.api = !0, this.modal.logger && this.modal.logger.info && this.modal.logger.info("API & Security inicializados");
  }
  initAccessibility() {
    const e = this.modal.modal;
    let i = this.modal.config, o = this.modal.logger, s = this.modal.telemetry;
    this.modal.focusTrap = new k(e, { accessibility: i.accessibility, telemetry: s }), this.modal.ariaManager = new et(e, i, { logger: o, telemetry: function(n, r) {
      s && s.emit && s.emit(n, r);
    } }), this.modal.keyboardHandler = new Zo(i, { logger: o, telemetry: s }), this._initialized.accessibility = !0, o && o.info && o.info("Accessibility inicializado");
  }
  initUIComponents() {
    const e = this.modal.errorElement, i = this.modal.passwordInput, o = this.modal.toggleButton, s = this.modal.form;
    let n = this.modal.config, r = this.modal.logger;
    const l = this.modal.ariaManager, d = this.modal.timers, c = this.modal.telemetry;
    this.modal.errorDisplay = new U(e, l, d, { telemetry: function(h, p) {
      c && c.emit && c.emit(h, p);
    } }), this.modal.togglePassword = new G(i, o, n, { logger: r, telemetry: function(h, p) {
      c && c.emit && c.emit(h, p);
    } }), this.modal.formComponent = new V(s, n, { ariaManager: l, logger: r });
    let u = null;
    this.modal.modal && this.modal.modal.querySelector && (u = this.modal.modal.querySelector('[data-testid="capslock-warning"]') || this.modal.modal.querySelector("#login-capslock")), i && u && (this.modal.capsLockDetector = new is(i, u, { logger: r, telemetry: function(h, p) {
      c && c.emit && c.emit(h, p);
    } })), this._initialized.ui = !0, r && r.info && r.info("UI Components inicializados");
  }
  initCoreManagers() {
    const e = this.modal.video, i = this.modal.config;
    let o = this.modal.logger;
    this.modal.errorHandler = new ss({ logger: o, security: i.security, debug: !!(i.debug && i.debug.enabled) }), this.modal.videoManager = new O(e, { video: i.video, logger: o }), this._initialized.managers = !0, o && o.info && o.info("Core Managers inicializados");
  }
  loadCSS() {
    if (!us) return;
    let e = this.modal.logger;
    if (document.querySelector('link[href*="' + pe + '/styles.css"]')) {
      this._initialized.css = !0;
      return;
    }
    const i = document.createElement("link");
    i.rel = "stylesheet", i.href = "/components/" + pe + "/styles.css", i.setAttribute("data-module", pe), document.head.appendChild(i), this._initialized.css = !0, e && e.info && e.info("CSS carregado");
  }
  setupEventListeners() {
    const e = this.modal.formComponent, i = this.modal.togglePassword, o = this.modal.keyboardHandler, s = this.modal.videoManager, n = this.modal.capsLockDetector, r = this.modal.store, l = this.modal.logger, d = this.modal.loginHandler, c = this.modal.modalController, u = this;
    if (e && e.mount && e.mount(function(h, p) {
      d && d.handle && d.handle(h, p);
    }), i && i.mount && i.mount(), n && n.mount && n.mount(), o && o.activate && o.activate({
      Escape: function() {
        u.modal.store && u.modal.store.isBusy && u.modal.store.isBusy() || c && c.close && c.close("escape");
      }
    }), s && s.mount && s.mount(), r && r.subscribe) {
      const h = function(I) {
        I.to === "BUSY" && o && o.setBusy ? o.setBusy(!0) : (I.to === "OPEN" || I.to === "ERROR") && o && o.setBusy && o.setBusy(!1);
      }, p = r.subscribe(h);
      u._stateUnsubscribers.push(p);
    }
    c && c.setupLoginRequiredListener && c.setupLoginRequiredListener(), this._initialized.events = !0, l && l.info && l.info("Event listeners configurados");
  }
  cleanup() {
    this._stateUnsubscribers.forEach(function(e) {
      typeof e == "function" && e();
    }), this._stateUnsubscribers = [], this.modal.capsLockDetector && this.modal.capsLockDetector.unmount && this.modal.capsLockDetector.unmount(), this.modal.modalController && this.modal.modalController.cleanup && this.modal.modalController.cleanup();
  }
  info() {
    return {
      moduleId: Ei,
      version: _i,
      hasModal: !!this.modal,
      initialized: Object.assign({}, this._initialized),
      stateUnsubscribersCount: this._stateUnsubscribers.length,
      hasCapsLockDetector: !!this.modal.capsLockDetector,
      timestamp: Date.now()
    };
  }
  healthCheck() {
    let e = {
      hasModal: !!this.modal,
      coreInitialized: this._initialized.core,
      apiInitialized: this._initialized.api,
      accessibilityInitialized: this._initialized.accessibility,
      uiInitialized: this._initialized.ui,
      managersInitialized: this._initialized.managers
    }, i = Object.values(e).filter(Boolean).length;
    return {
      status: i === 6 ? "HEALTHY" : i >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: i + "/6",
      checks: e,
      version: _i,
      moduleId: Ei,
      timestamp: Date.now()
    };
  }
}
const xt = "login-handler", Gi = "5.12.0-P22", Qe = T({ moduleId: xt });
function Xe(t) {
  return Qe.get(t);
}
const ms = () => {
  const t = Xe("config");
  return !!(t && t.app && t.app.debug);
}, Jt = function(t) {
  const e = Xe("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1);
  if (t === "error") {
    e.error && e.error(...["[login-handler]"].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...["[login-handler]"].concat(i));
    return;
  }
  ms() && e.debug && e.debug(...["[login-handler]"].concat(i));
}, Ht = typeof window < "u" && typeof document < "u", ps = "dshowdash_session", _e = "dshowdash_remember_me", fs = 30 * 60 * 1e3, gs = 30 * 24 * 60 * 60 * 1e3;
function Zt(t) {
  t && (t.classList.add("lm-shake"), setTimeout(() => {
    t.classList.remove("lm-shake");
  }, 500));
}
function ys(t) {
  if (!t) return;
  t.querySelectorAll(".lm-input").forEach((i) => {
    i.classList.add("lm-success"), setTimeout(() => {
      i.classList.remove("lm-success");
    }, 400);
  });
}
function Es(t) {
  if (Ht)
    try {
      t ? localStorage.setItem(_e, "true") : localStorage.removeItem(_e);
    } catch (e) {
      Jt("warn", "Erro ao salvar preferência remember-me:", e.message);
    }
}
function Yi() {
  if (!Ht) return !1;
  try {
    return localStorage.getItem(_e) === "true";
  } catch {
    return !1;
  }
}
function _s(t, e, i) {
  if (i || (i = !1), !(!Ht || !t))
    try {
      const o = i ? gs : fs, s = { isAuthenticated: !0, userId: t.id || t.user_id, username: t.username || t.login || t.name, email: t.email || null, roles: t.roles || ["user"], level: t.level || t.nivel || 2, expiresAt: Date.now() + o, createdAt: Date.now(), rememberMe: i };
      localStorage.setItem(ps, JSON.stringify(s)), Es(i), Jt("info", "Sessão persistida", { rememberMe: i, expiresIn: i ? "30 dias" : "30 min" });
      const n = e ? e.sessionManager : null;
      n && n._injectSession && n._injectSession(s);
    } catch (o) {
      Jt("warn", "Erro ao persistir sessão:", o.message);
    }
}
function vs(t, e) {
  if (!Ht) return;
  const i = "authenticated", o = e ? e.globalState : null;
  if (o && o.dispatch)
    try {
      o.dispatch({ type: "SET_AUTH_STATE", payload: { isAuthenticated: t, state: i } });
    } catch {
    }
  document.body && (document.body.dataset.authReady = "true", document.body.dataset.state = i);
}
function st(t) {
  this.modal = t, this._metrics = { attempts: 0, successes: 0, failures: 0, errors: 0, rememberMeUsed: 0 };
}
st.prototype._getPorts = function() {
  return this.modal ? this.modal._ports : {};
};
st.prototype.loadRememberMePreference = () => Yi();
st.prototype.handle = function(t, e, i) {
  const o = this;
  i || (i = !1);
  const s = o.modal, n = s.rateLimiter, r = s.errorHandler, l = s.errorDisplay, d = s.validator, c = s.eventBus, u = s.telemetry, h = s.store, p = s.formComponent, I = s.authAPI, L = s.config, A = s.form;
  if (o._metrics.attempts++, i && o._metrics.rememberMeUsed++, !n || !r || !l || !d || !c || !h || !p || !I)
    return Jt("error", "Dependências críticas não inicializadas"), o._metrics.errors++, Promise.resolve();
  if (n.isLocked()) {
    const R = r.handleLoginError({ status: null }, n, u);
    return l.show({ message: R.errorMessage }), Zt(A), Promise.resolve();
  }
  const v = d.validateCredentials(t, e);
  if (!v.valid) {
    const R = v.errors[0];
    return l.show({ message: R ? R.message : "Erro de validação", code: R ? R.code : "VALIDATION_ERROR" }), Zt(A), Promise.resolve();
  }
  c.emit(D.LOGIN_ATTEMPT, { username: v.username, rememberMe: i, timestamp: Date.now(), source: xt }), h.setBusy(!0), p.setBusy(!0), l.clear(), s.loginAbortController = new AbortController();
  const E = L && L.api && L.api.timeout ? L.api.timeout : 1e4, j = setTimeout(() => {
    s.loginAbortController && s.loginAbortController.abort();
  }, E);
  return I.login(v.username, v.password, { signal: s.loginAbortController.signal, rememberMe: i }).then((R) => (clearTimeout(j), R.success ? o._handleSuccess(R, v, i) : o._handleFailure(R, v))).catch((R) => (clearTimeout(j), o._handleError(R, v))).finally(() => {
    clearTimeout(j), s.loginAbortController = null, h.setBusy(!1), p.setBusy(!1);
  });
};
st.prototype._handleSuccess = function(t, e, i) {
  const o = this;
  i || (i = !1);
  const s = o.modal, n = s.eventBus, r = s.telemetry, l = s.modalController, d = s.form, c = o._getPorts(), u = t.data && t.data.user ? t.data.user : null, h = t.data && t.data.csrf ? t.data.csrf : null;
  o._metrics.successes++, ys(d), _s(u, c, i);
  const p = { user: u, username: e.username, rememberMe: i, timestamp: Date.now(), latency: t.latency, csrf: h, source: "login-modal-interactive", interactive: !0 };
  n.emit(D.LOGIN_SUCCESS, p), r && r.trackSuccess && r.trackSuccess(u, t.latency), vs(!0, c), n.emit(D.SESSION_VALIDATED, { authenticated: !0, user: u, username: e.username, rememberMe: i, timestamp: Date.now(), source: "login-modal-interactive" });
  const I = c ? c.eventBus : null;
  if (Ht && I && I.emit && I.emit(D.SESSION_STARTED, { authenticated: !0, user: u, rememberMe: i, source: "login-modal-interactive", interactive: !0 }), s.onAuthSuccess && typeof s.onAuthSuccess == "function")
    try {
      s.onAuthSuccess(p);
    } catch {
    }
  return new Promise((L) => {
    setTimeout(L, 400);
  }).then(() => {
    l.close("success");
  });
};
st.prototype._handleFailure = function(t, e) {
  const i = this, o = i.modal, s = o.rateLimiter, n = o.eventBus, r = o.errorHandler, l = o.telemetry, d = o.errorDisplay, c = o.formComponent, u = o.store, h = o.form;
  if (i._metrics.failures++, Zt(h), s.recordAttempt(), t.status === 429 && t.data && t.data.retryAfter && s.syncBackendRetryAfter(t.data.retryAfter, "auth_api"), n.emit(D.LOGIN_FAILURE, { status: t.status, message: t.message, timestamp: Date.now(), latency: t.latency, source: xt }), o.onAuthFailure && typeof o.onAuthFailure == "function")
    try {
      o.onAuthFailure({ status: t.status });
    } catch {
    }
  const p = r.handleLoginError(t, s, l, t.latency);
  d.show({ message: p.errorMessage, code: p.errorCode }), c.clear(), c.focus(), t.status === 429 && t.data && t.data.retryAfter && (d.show({ message: "Muitas tentativas. Aguarde", code: "RATE_LIMITED", countdownMs: t.data.retryAfter, focusTarget() {
    c.setBusy(!1), u.setBusy(!1), c.focus();
  } }), c.setBusy(!0));
};
st.prototype._handleError = function(t, e) {
  const i = this, o = i.modal, s = o.errorDisplay, n = o.telemetry, r = o.rateLimiter, l = o.errorHandler, d = o.formComponent, c = o.config, u = o.form;
  if (i._metrics.errors++, Zt(u), t.name === "AbortError")
    s.show({ message: "Tempo esgotado. Tente novamente.", code: "REQUEST_TIMEOUT" }), n && n.track && n.track("login:timeout", { username: e.username, timeout: c && c.api && c.api.timeout ? c.api.timeout : 1e4 });
  else {
    r.recordAttempt();
    const h = l.handleLoginError(t, r, n);
    s.show({ message: h.errorMessage, code: h.errorCode });
  }
  d.clear(), d.focus();
};
st.prototype.info = function() {
  return { moduleId: xt, version: Gi, hasModal: !!this.modal, hasPorts: !!(this.modal && this.modal._ports), portsInitialized: Qe.isInitialized(), savedRememberMe: Yi(), metrics: Object.assign({}, this._metrics), p22Compliant: !0, timestamp: Date.now() };
};
st.prototype.healthCheck = function() {
  const t = this.modal, e = Xe("logger"), i = { hasModal: !!t, hasAuthAPI: !!(t && t.authAPI), hasValidator: !!(t && t.validator), hasRateLimiter: !!(t && t.rateLimiter), hasPorts: !!(t && t._ports), loggerAvailable: !!e };
  let o = 0;
  return i.hasModal && o++, i.hasAuthAPI && o++, i.hasValidator && o++, i.hasRateLimiter && o++, i.hasPorts && o++, i.loggerAvailable && o++, { status: o === 6 ? "HEALTHY" : o >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${o}/6`, checks: i, version: Gi, moduleId: xt, portsInitialized: Qe.isInitialized(), p22Compliant: !0, timestamp: Date.now() };
};
const te = "login-modal-controller", Ki = T({ moduleId: te });
function qi() {
  Ki.init();
}
function Wi(t) {
  return Ki.get(t);
}
function ve(t, e) {
  qi();
  const i = Wi("eventBus");
  return i && i.emit ? (i.emit(t, Object.assign({ source: te, timestamp: Date.now() }, e || {})), !0) : !1;
}
function vi(t, e) {
  e === void 0 && (e = "login-modal-controller"), qi();
  const i = Wi("layoutManager");
  if (i && i.setScrollLocked) {
    const o = t === "scroll-lock";
    return i.setScrollLocked(o), !0;
  }
  return ve(ge.REQUEST_LAYOUT, { mode: t, source: e }), !0;
}
class bs {
  constructor(e) {
    this.modal = e, this._loginRequiredCleanup = null;
  }
  async open(e) {
    e === void 0 && (e = "manual");
    const i = this.modal, o = i.store, s = i.logger, n = i.modal, r = i.ariaManager, l = i.focusTrap, d = i.formComponent, c = i.telemetry, u = i.config;
    if (i.eventBus, o && o.isOpen()) {
      s && s.debug("Modal ja esta aberto");
      return;
    }
    s && s.info(`Abrindo modal (reason: ${e})`), o && o.open(), n.removeAttribute("hidden"), n.setAttribute("aria-hidden", "false"), n.setAttribute("role", "dialog"), n.setAttribute("aria-modal", "true"), vi("scroll-lock"), r && r.setModalOpen(), u && u.accessibility && u.accessibility.focusTrapEnabled && l && l.activate(), d && d.focus(), c && c.trackOpen(e), ve(ge.OPEN_MODAL, { reason: e, modalId: te });
  }
  close(e) {
    e === void 0 && (e = "manual");
    const i = this.modal, o = i.store, s = i.logger, n = i.modal, r = i.ariaManager, l = i.focusTrap, d = i.formComponent, c = i.errorDisplay, u = i.telemetry, h = i.config;
    if (i.eventBus, !o || !o.isOpen()) {
      s && s.debug("Modal ja esta fechado");
      return;
    }
    s && s.info(`Fechando modal (reason: ${e})`), o && o.close(), n.setAttribute("hidden", ""), n.setAttribute("aria-hidden", "true"), vi("scroll-unlock"), r && r.setModalClosed(), h && h.accessibility && h.accessibility.focusTrapEnabled && l && l.deactivate(), d && d.clear(), c && c.clear(), u && u.trackClose(e), ve(ge.CLOSE_MODAL, { reason: e, modalId: te });
  }
  setupLoginRequiredListener() {
    const e = this, i = this.modal.eventBus, o = this.modal.logger;
    if (!i) {
      o && o.info("EventBus nao disponivel para setupLoginRequiredListener - funcionando standalone");
      return;
    }
    this._loginRequiredCleanup && (this._loginRequiredCleanup(), this._loginRequiredCleanup = null);
    const s = (n) => {
      o && o.info("AUTH_INTENTS.LOGIN recebido - abrindo modal", n), e.open("auth-required");
    };
    this._loginRequiredCleanup = i.on(Wt.LOGIN, s), this.modal._handlers || (this.modal._handlers = /* @__PURE__ */ new Map()), this.modal._handlers.set(Wt.LOGIN, s), o && o.info("Listener AUTH_INTENTS.LOGIN configurado");
  }
  triggerLoginRequired(e) {
    this.open("auth-required");
  }
  cleanup() {
    this._loginRequiredCleanup && (this._loginRequiredCleanup(), this._loginRequiredCleanup = null);
  }
}
const rt = "6.1.0-P18EC", qt = "login-modal-class", fe = "login-modal", bi = "login-modal-container", gt = T({ moduleId: qt });
function Is() {
  gt.init();
}
function Je(t) {
  return gt.get(t);
}
const As = () => {
  var t;
  const e = Je("config");
  return ((t = e == null ? void 0 : e.app) == null ? void 0 : t.debug) ?? !1;
}, C = (t, ...e) => {
  var i, o, s;
  const n = Je("logger");
  if (n) {
    if (t === "error") {
      (i = n.error) == null || i.call(n, "[login-modal-class]", ...e);
      return;
    }
    if (t === "warn") {
      (o = n.warn) == null || o.call(n, "[login-modal-class]", ...e);
      return;
    }
    As() && ((s = n.debug) == null || s.call(n, "[login-modal-class]", ...e));
  }
};
class Ze {
  constructor(e = {}) {
    var i, o;
    this.config = e, this.eventBus = e.eventBus || new $({ namespace: fe, debug: ((i = e.debug) == null ? void 0 : i.enabled) || !1 }), this.eventBusExternal = !!e.eventBus;
    const s = e.routerMode || "memory";
    this.router = e.router || (s === "hash" ? new ot() : new ut()), this.container = null, this.modal = null, this.form = null, this.usernameInput = null, this.passwordInput = null, this.submitButton = null, this.errorElement = null, this.toggleButton = null, this.video = null, this.logger = null, this.telemetry = null, this.timers = null, this.store = null, this.csrfManager = null, this.authAPI = null, this.deviceIDManager = null, this.validator = null, this.rateLimiter = null, this.focusTrap = null, this.ariaManager = null, this.keyboardHandler = null, this.errorDisplay = null, this.togglePassword = null, this.formComponent = null, this.errorHandler = null, this.videoManager = null, this.mounted = !1, this.destroyed = !1, this.loginAbortController = null, this._handlers = /* @__PURE__ */ new Map(), this._cleanupFunctions = [], this.canActivate = e.canActivate || (() => !0), this.containerTarget = e.container || null, this.onAuthSuccess = e.onAuthSuccess || null, this.onAuthFailure = e.onAuthFailure || null, this.onReady = e.onReady || null, this.systemInitializer = new hs(this), this.loginHandler = new st(this), this.modalController = new bs(this), this._debug = ((o = e.debug) == null ? void 0 : o.enabled) || !1, this._metrics = { mountCount: 0, openCount: 0, closeCount: 0, loginAttemptCount: 0, loginSuccessCount: 0, loginFailCount: 0, lastMountAt: null, lastOpenAt: null, lastLoginAt: null };
  }
  async mount() {
    if (this.mounted) {
      C("warn", "Já montado");
      return;
    }
    if (this.destroyed) {
      C("warn", "Instância destruída");
      return;
    }
    if (!this.canActivate()) {
      C("warn", "Bloqueado por canActivate()");
      return;
    }
    this._metrics.mountCount++, this._metrics.lastMountAt = Date.now();
    try {
      if (await this.loadConfig(), this.systemInitializer.initCoreSystems(), this.store.mount(), this.createContainer(), await this.injectTemplate(), this.queryElements(), !this.validateElements()) throw new Error("Falha na validação de elementos DOM");
      this.systemInitializer.initAPISecurity(), this.systemInitializer.initAccessibility(), this.systemInitializer.initUIComponents(), this.systemInitializer.initCoreManagers(), this.systemInitializer.loadCSS(), this.systemInitializer.setupEventListeners(), Is(), this.mounted = !0, C("info", `Login Modal montado (${rt})`), this.checkInitialState(), this._emitReady();
    } catch (e) {
      throw C("error", "Erro ao montar:", e), this._renderErrorUI("Falha ao inicializar modal de login", e), this.cleanup(), e;
    }
  }
  _emitReady() {
    const e = { module: fe, version: rt, timestamp: Date.now(), ttfbMs: performance.now(), status: this.getStatus() };
    if (this.eventBus.emit(D.READY, e), this.eventBus.emit(_o.READY, e), this.onReady && typeof this.onReady == "function")
      try {
        this.onReady(e);
      } catch (i) {
        C("warn", "Erro em onReady callback:", i);
      }
    C("info", "Evento auth:ready emitido");
  }
  _escapeHtml(e) {
    return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  _renderErrorUI(e, i) {
    if (!this.container) return;
    const o = this._escapeHtml(e), s = i ? this._escapeHtml(i.stack || i.message) : "";
    this.container.innerHTML = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(239,68,68,0.95);color:white;padding:2rem;border-radius:8px;text-align:center;max-width:400px;z-index:10000;pointer-events:auto;"><h3 style="margin:0 0 1rem 0;">Erro no Login</h3><p style="margin:0 0 1rem 0;">${o}</p><button onclick="location.reload()" style="background:white;color:#DC2626;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer;font-weight:600;">Recarregar Página</button>${i ? `<details style="margin-top:1rem;text-align:left;font-size:0.875rem;"><summary style="cursor:pointer;">Detalhes técnicos</summary><pre style="margin-top:0.5rem;overflow:auto;">${s}</pre></details>` : ""}</div>`;
  }
  createContainer() {
    const e = document.getElementById(bi);
    e && e.remove(), this.container = document.createElement("div"), this.container.id = bi, this.container.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;";
    let i = null, o = "none";
    this.containerTarget && (typeof this.containerTarget == "string" ? i = document.querySelector(this.containerTarget) : this.containerTarget instanceof HTMLElement && (i = this.containerTarget), i && (o = "config-injected", C("info", "Container via config.container"))), i || (i = document.body, o = "body-fallback", C("info", "Container via document.body")), i.appendChild(this.container), C("info", `Container criado (source: ${o})`);
  }
  async injectTemplate() {
    const { getLoginModalTemplate: e } = await Promise.resolve().then(() => Xs), i = e(this.config);
    this.container.innerHTML = i, C("info", "Template injetado");
  }
  queryElements() {
    const e = this.config.idPrefix || "login";
    this.modal = document.getElementById(`${e}-modal`), this.form = document.getElementById(`${e}-form`), this.usernameInput = document.getElementById(`${e}-email`), this.passwordInput = document.getElementById(`${e}-password`), this.submitButton = document.getElementById(`${e}-button`), this.errorElement = document.getElementById(`${e}-error`), this.toggleButton = document.getElementById("toggle-password"), this.video = document.getElementById(`${e}-video`);
  }
  validateElements() {
    const e = { modal: this.modal, form: this.form, username: this.usernameInput, password: this.passwordInput, button: this.submitButton }, i = Object.entries(e).filter((o) => !o[1]).map((o) => o[0]);
    return i.length > 0 ? (C("error", "Elementos faltando:", i), !1) : !0;
  }
  async loadConfig() {
    if (this.config && Object.keys(this.config).length > 5) {
      C("info", "Config fornecida via construtor");
      return;
    }
    try {
      const e = new AbortController(), i = setTimeout(() => e.abort(), 5e3), o = await fetch("/components/login-modal/config.json", { signal: e.signal });
      clearTimeout(i);
      const s = await o.json();
      this.config = Object.assign({}, s, this.config);
    } catch {
      C("warn", "Erro ao carregar config, usando defaults"), this.config = Object.assign({}, this.getDefaultConfig(), this.config);
    }
  }
  getDefaultConfig() {
    return { module: fe, version: rt, zIndex: 9999, idPrefix: "login", security: { rateLimitAttempts: 5, rateLimitWindow: 3e5, lockoutDuration: 9e5, maxUsernameLength: 128, maxPasswordLength: 1024, secureMode: !0 }, api: { timeout: 1e4, maxRetries: 1, endpoints: { login: "/api/auth/login.php", check: "/api/auth/check.php", logout: "/api/auth/logout.php" } }, video: { cleanupOnClose: !0 }, accessibility: { focusTrapEnabled: !0, escapeToClose: !0, escapeBlockedWhenBusy: !0 }, telemetry: { enabled: !0 }, debug: { enabled: !1 } };
  }
  checkInitialState() {
    C("info", "Componente pronto, aguardando interação");
  }
  async open(e) {
    return e === void 0 && (e = "manual"), this._metrics.openCount++, this._metrics.lastOpenAt = Date.now(), this.modalController.open(e);
  }
  close(e) {
    return e === void 0 && (e = "manual"), this._metrics.closeCount++, this.modalController.close(e);
  }
  async handleLogin(e, i) {
    this._metrics.loginAttemptCount++, this._metrics.lastLoginAt = Date.now();
    try {
      const o = await this.loginHandler.handle(e, i);
      return o && o.success ? this._metrics.loginSuccessCount++ : this._metrics.loginFailCount++, o;
    } catch (o) {
      throw this._metrics.loginFailCount++, o;
    }
  }
  async unmount() {
    if (this.destroyed) return;
    C("info", "Desmontando login modal"), this.store && this.store.isOpen() && this.close("unmount"), this.loginAbortController && (this.loginAbortController.abort(), this.loginAbortController = null);
    const e = this;
    this._handlers.forEach((i, o) => {
      e.eventBus.off(o, i);
    }), this._handlers.clear(), this._cleanupFunctions.forEach((i) => {
      try {
        i();
      } catch {
      }
    }), this._cleanupFunctions = [], this.timers && this.timers.clearAll(), this.keyboardHandler && this.keyboardHandler.deactivate(), this.focusTrap && this.focusTrap.deactivate(), this.videoManager && this.videoManager.cleanup(), this.formComponent && this.formComponent.unmount(), this.togglePassword && this.togglePassword.unmount(), this.authAPI && this.authAPI.cancel(), this.store && this.store.reset(), this.router && typeof this.router.cleanup == "function" && this.router.cleanup(), this.container && this.container.parentNode && this.container.remove(), this.eventBusExternal || this.eventBus.clear(), this.destroyed = !0, this.mounted = !1, C("info", "Login modal desmontado");
  }
  cleanup() {
    try {
      this.container && this.container.parentNode && this.container.remove(), this.timers && this.timers.clearAll();
    } catch (e) {
      C("error", "Erro no cleanup:", e);
    }
  }
  registerCleanup(e) {
    typeof e == "function" && this._cleanupFunctions.push(e);
  }
  getVersion() {
    return rt;
  }
  isInitialized() {
    return this.mounted && !this.destroyed;
  }
  setDebug(e) {
    this._debug = !!e, this.logger && this.logger.setDebug && this.logger.setDebug(e), this.telemetry && this.telemetry.setDebug && this.telemetry.setDebug(e);
  }
  healthCheck() {
    const e = Je("logger"), i = { mounted: this.mounted, notDestroyed: !this.destroyed, hasContainer: !!this.container, hasModal: !!this.modal, hasForm: !!this.form, hasStore: !!this.store, hasEventBus: !!this.eventBus, storeReady: this.store && this.store.getState && this.store.getState().status !== "error", portsInitialized: gt.isInitialized(), loggerAvailable: !!e }, o = Object.values(i).filter(Boolean).length, s = Object.keys(i).length;
    let n = "HEALTHY";
    o < s * 0.5 ? n = "UNHEALTHY" : o < s && (n = "DEGRADED");
    const r = [];
    return i.mounted || r.push("Not mounted"), i.notDestroyed === !1 && r.push("Destroyed"), i.hasContainer || r.push("No container"), i.hasModal || r.push("No modal element"), i.hasForm || r.push("No form element"), i.hasStore || r.push("No store"), i.hasEventBus || r.push("No EventBus"), i.storeReady || r.push("Store in error state"), { status: n, score: `${o}/${s}`, checks: i, issues: r.length > 0 ? r : null, version: rt, moduleId: qt, portsInitialized: gt.isInitialized(), timestamp: Date.now() };
  }
  info() {
    return { version: rt, moduleId: qt, mounted: this.mounted, destroyed: this.destroyed, isOpen: this.isOpen(), isBusy: this.isBusy(), metrics: this.getMetrics(), healthCheck: this.healthCheck(), portsInitialized: gt.isInitialized(), config: { debug: this._debug, idPrefix: this.config ? this.config.idPrefix : void 0, routerMode: this.config && this.config.routerMode || "memory", eventBusExternal: this.eventBusExternal }, subsystems: { store: !!this.store, authAPI: !!this.authAPI, rateLimiter: !!this.rateLimiter, focusTrap: !!this.focusTrap, videoManager: !!this.videoManager }, timestamp: Date.now() };
  }
  getMetrics() {
    return Object.assign({}, this._metrics);
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, openCount: 0, closeCount: 0, loginAttemptCount: 0, loginSuccessCount: 0, loginFailCount: 0, lastMountAt: null, lastOpenAt: null, lastLoginAt: null };
  }
  isOpen() {
    return this.store && this.store.isOpen() || !1;
  }
  isBusy() {
    return this.store && this.store.isBusy() || !1;
  }
  getStatus() {
    return { version: rt, moduleId: qt, mounted: this.mounted, destroyed: this.destroyed, state: this.store && this.store.getState() || null, rateLimiter: this.rateLimiter && this.rateLimiter.getStatus() || null, handlers: this._handlers.size, eventBusExternal: this.eventBusExternal, router: this.router && this.router.getCurrentRoute ? this.router.getCurrentRoute() : null, metrics: this.getMetrics(), portsInitialized: gt.isInitialized() };
  }
  getEventBus() {
    return this.eventBus;
  }
}
const Qi = "5.8.0-P17WI", ti = "login-modal-appshell-adapter", Pt = T({ moduleId: ti });
function Ds() {
  Pt.init();
}
function Ft(t) {
  return Pt.get(t);
}
const ws = () => {
  const t = Ft("config");
  return !!(t && t.app && t.app.debug);
}, lt = function(t) {
  const e = Ft("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1), o = "[login-appshell-adapter]";
  if (t === "error") {
    e.error && e.error(...[o].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...[o].concat(i));
    return;
  }
  if (t === "info") {
    e.info && e.info(...[o].concat(i));
    return;
  }
  ws() && e.debug && e.debug(...[o].concat(i));
};
function Y(t) {
  t || (t = {}), this.config = t, this.appShell = null, this._connected = !1, this._metrics = { connections: 0, disconnections: 0, signals: 0 };
}
Y.prototype.connect = function() {
  if (this._connected) return !0;
  try {
    return Ds(), this.appShell = Ft("appShell"), this.appShell ? (this._connected = !0, this._metrics.connections++, lt("info", "Conectado ao AppShell"), !0) : (lt("info", "AppShell nao disponivel - funcionando standalone"), !1);
  } catch (t) {
    return lt("error", "Erro ao conectar AppShell", t), !1;
  }
};
Y.prototype.disconnect = function() {
  this._connected && (this.appShell = null, this._connected = !1, this._metrics.disconnections++, lt("debug", "Desconectado do AppShell"));
};
Y.prototype.signalReady = function() {
  if (!this._connected || !this.appShell) return !1;
  try {
    return typeof this.appShell.componentReady == "function" ? (this.appShell.componentReady("login-modal"), this._metrics.signals++, lt("debug", "Signal ready enviado ao AppShell"), !0) : !1;
  } catch (t) {
    return lt("error", "Erro ao sinalizar ready", t), !1;
  }
};
Y.prototype.signalError = function(t) {
  if (!this._connected || !this.appShell) return !1;
  try {
    return typeof this.appShell.componentError == "function" ? (this.appShell.componentError("login-modal", t), this._metrics.signals++, !0) : !1;
  } catch (e) {
    return lt("error", "Erro ao sinalizar error", e), !1;
  }
};
Y.prototype.getContainer = function() {
  if (!this._connected || !this.appShell) return null;
  try {
    return typeof this.appShell.getOverlayContainer == "function" ? this.appShell.getOverlayContainer() : null;
  } catch (t) {
    return lt("error", "Erro ao obter container", t), null;
  }
};
Y.prototype.isAvailable = () => typeof window < "u";
Y.prototype.isConnected = function() {
  return this._connected;
};
Y.prototype.getStatus = function() {
  return { connected: this._connected, hasAppShell: !!this.appShell, metrics: Object.assign({}, this._metrics) };
};
Y.prototype.info = function() {
  return { moduleId: ti, version: Qi, connected: this._connected, hasAppShell: !!this.appShell, portsInitialized: Pt.isInitialized(), loggerAvailable: !!Ft("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
Y.prototype.healthCheck = () => {
  const t = { notInErrorState: !0, canConnect: typeof window < "u", loggerAvailable: !!Ft("logger"), portsInitialized: Pt.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: `${e}/4`, checks: t, version: Qi, moduleId: ti, portsInitialized: Pt.isInitialized(), timestamp: Date.now() };
};
function Rs(t, e) {
  return new Y(e);
}
const Xi = "5.9.0-P18EC", ei = "login-modal-router-adapter", $t = T({ moduleId: ei });
function Ss() {
  $t.init();
}
function Vt(t) {
  return $t.get(t);
}
const Os = () => {
  const t = Vt("config");
  return !!(t && t.app && t.app.debug);
}, ct = function(t) {
  const e = Vt("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1), o = "[login-router-adapter]";
  if (t === "error") {
    e.error && e.error(...[o].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...[o].concat(i));
    return;
  }
  if (t === "info") {
    e.info && e.info(...[o].concat(i));
    return;
  }
  Os() && e.debug && e.debug(...[o].concat(i));
};
function K(t) {
  t || (t = {}), this.config = t, this.router = null, this._connected = !1, this._listeners = [], this._metrics = { connections: 0, navigations: 0, routeChanges: 0 };
}
K.prototype.connect = function() {
  if (this._connected) return !0;
  try {
    return Ss(), this.router = Vt("routerGlobal"), this.router ? (this._connected = !0, this._metrics.connections++, ct("info", "Conectado ao RouterGlobal"), !0) : (ct("info", "RouterGlobal nao disponivel - funcionando standalone"), !1);
  } catch (t) {
    return ct("error", "Erro ao conectar RouterGlobal", t), !1;
  }
};
K.prototype.disconnect = function() {
  if (this._connected) {
    for (let t = 0; t < this._listeners.length; t++)
      try {
        this._listeners[t]();
      } catch {
      }
    this._listeners = [], this.router = null, this._connected = !1, ct("debug", "Desconectado do RouterGlobal");
  }
};
K.prototype.getCurrentRoute = function() {
  if (!this._connected || !this.router) return null;
  try {
    return typeof this.router.getCurrentRoute == "function" ? this.router.getCurrentRoute() : null;
  } catch (t) {
    return ct("error", "Erro ao obter rota atual", t), null;
  }
};
K.prototype.navigate = function(t, e) {
  if (e || (e = {}), this._metrics.navigations++, !this._connected || !this.router)
    return ct("debug", "Router nao conectado - navegacao ignorada"), !1;
  try {
    return typeof this.router.navigate == "function" ? (this.router.navigate(t, Object.assign({}, e, { source: "login-modal" })), !0) : !1;
  } catch (i) {
    return ct("error", "Erro ao navegar", i), !1;
  }
};
K.prototype.onRouteChange = function(t) {
  const e = this;
  if (!this._connected || !this.router) return () => {
  };
  try {
    if (typeof this.router.on == "function") {
      const i = this.router.on(vo.ROUTE_CHANGED, (o) => {
        e._metrics.routeChanges++, t(o);
      });
      return this._listeners.push(i), i;
    }
    return () => {
    };
  } catch (i) {
    return ct("error", "Erro ao registrar listener", i), () => {
    };
  }
};
K.prototype.isAvailable = () => typeof window < "u";
K.prototype.isConnected = function() {
  return this._connected;
};
K.prototype.getStatus = function() {
  return { connected: this._connected, hasRouter: !!this.router, currentRoute: this.getCurrentRoute(), metrics: Object.assign({}, this._metrics) };
};
K.prototype.info = function() {
  return { moduleId: ei, version: Xi, connected: this._connected, hasRouter: !!this.router, currentRoute: this.getCurrentRoute(), portsInitialized: $t.isInitialized(), loggerAvailable: !!Vt("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
K.prototype.healthCheck = function() {
  const t = { notInErrorState: !0, canConnect: typeof window < "u", hasRouter: this._connected && !!this.router, loggerAvailable: !!Vt("logger"), portsInitialized: $t.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 4 ? "HEALTHY" : e >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${e}/5`, checks: t, version: Xi, moduleId: ei, portsInitialized: $t.isInitialized(), timestamp: Date.now() };
};
function Cs(t, e) {
  return new K(e);
}
const Ji = "5.8.0-P17WI", ii = "login-modal-permissions-adapter", Bt = T({ moduleId: ii });
function Ts() {
  Bt.init();
}
function jt(t) {
  return Bt.get(t);
}
const ks = () => {
  const t = jt("config");
  return !!(t && t.app && t.app.debug);
}, Et = function(t) {
  const e = jt("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1), o = "[login-permissions-adapter]";
  if (t === "error") {
    e.error && e.error(...[o].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...[o].concat(i));
    return;
  }
  if (t === "info") {
    e.info && e.info(...[o].concat(i));
    return;
  }
  ks() && e.debug && e.debug(...[o].concat(i));
};
function it(t) {
  t || (t = {}), this.config = t, this.permissionsManager = null, this._connected = !1, this._metrics = { connections: 0, checks: 0, grants: 0 };
}
it.prototype.connect = function() {
  if (this._connected) return !0;
  try {
    return Ts(), this.permissionsManager = jt("permissionsManager"), this.permissionsManager ? (this._connected = !0, this._metrics.connections++, Et("info", "Conectado ao PermissionsManager"), !0) : (Et("info", "PermissionsManager nao disponivel - funcionando standalone"), !1);
  } catch (t) {
    return Et("error", "Erro ao conectar PermissionsManager", t), !1;
  }
};
it.prototype.disconnect = function() {
  this._connected && (this.permissionsManager = null, this._connected = !1, Et("debug", "Desconectado do PermissionsManager"));
};
it.prototype.hasPermission = function(t) {
  if (this._metrics.checks++, !this._connected || !this.permissionsManager) return !0;
  try {
    return typeof this.permissionsManager.check == "function" ? this.permissionsManager.check(t) : !0;
  } catch (e) {
    return Et("error", "Erro ao verificar permissao", e), !0;
  }
};
it.prototype.grantTemporary = function(t, e) {
  if (e || (e = 6e4), this._metrics.grants++, !this._connected || !this.permissionsManager) return !1;
  try {
    return typeof this.permissionsManager.grantTemporary == "function" ? (this.permissionsManager.grantTemporary(t, e), !0) : !1;
  } catch (i) {
    return Et("error", "Erro ao conceder permissao", i), !1;
  }
};
it.prototype.isAvailable = () => typeof window < "u";
it.prototype.isConnected = function() {
  return this._connected;
};
it.prototype.getStatus = function() {
  return { connected: this._connected, hasPermissionsManager: !!this.permissionsManager, metrics: Object.assign({}, this._metrics) };
};
it.prototype.info = function() {
  return { moduleId: ii, version: Ji, connected: this._connected, hasPermissionsManager: !!this.permissionsManager, portsInitialized: Bt.isInitialized(), loggerAvailable: !!jt("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
it.prototype.healthCheck = () => {
  const t = { notInErrorState: !0, canConnect: typeof window < "u", loggerAvailable: !!jt("logger"), portsInitialized: Bt.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: `${e}/4`, checks: t, version: Ji, moduleId: ii, portsInitialized: Bt.isInitialized(), timestamp: Date.now() };
};
function Ls(t, e) {
  return new it(e);
}
const Zi = "5.8.0-P17WI", oi = "login-modal-preloader-adapter", Ut = T({ moduleId: oi });
function Ms() {
  Ut.init();
}
function bt(t) {
  return Ut.get(t);
}
const Ns = () => {
  const t = bt("config");
  return !!(t && t.app && t.app.debug);
}, _t = function(t) {
  const e = bt("logger");
  if (!e) return;
  const i = Array.prototype.slice.call(arguments, 1), o = "[login-preloader-adapter]";
  if (t === "error") {
    e.error && e.error(...[o].concat(i));
    return;
  }
  if (t === "warn") {
    e.warn && e.warn(...[o].concat(i));
    return;
  }
  if (t === "info") {
    e.info && e.info(...[o].concat(i));
    return;
  }
  Ns() && e.debug && e.debug(...[o].concat(i));
};
function q(t) {
  t || (t = {}), this.config = t, this.preloader = null, this._connected = !1, this._metrics = { connections: 0, shows: 0, hides: 0 };
}
q.prototype.connect = function() {
  if (this._connected) return !0;
  try {
    return Ms(), this.preloader = bt("preloader") || bt("preloaderManager"), this.preloader ? (this._connected = !0, this._metrics.connections++, _t("info", "Conectado ao Preloader"), !0) : (_t("info", "Preloader nao disponivel - funcionando standalone"), !1);
  } catch (t) {
    return _t("error", "Erro ao conectar Preloader", t), !1;
  }
};
q.prototype.disconnect = function() {
  this._connected && (this.preloader = null, this._connected = !1, _t("debug", "Desconectado do Preloader"));
};
q.prototype.show = function(t) {
  if (t || (t = ""), this._metrics.shows++, !this._connected || !this.preloader) return !1;
  try {
    return typeof this.preloader.show == "function" ? (this.preloader.show(t), !0) : !1;
  } catch (e) {
    return _t("error", "Erro ao mostrar preloader", e), !1;
  }
};
q.prototype.hide = function() {
  if (this._metrics.hides++, !this._connected || !this.preloader) return !1;
  try {
    return typeof this.preloader.hide == "function" ? (this.preloader.hide(), !0) : !1;
  } catch (t) {
    return _t("error", "Erro ao esconder preloader", t), !1;
  }
};
q.prototype.setProgress = function(t) {
  if (!this._connected || !this.preloader) return !1;
  try {
    return typeof this.preloader.setProgress == "function" ? (this.preloader.setProgress(t), !0) : !1;
  } catch {
    return !1;
  }
};
q.prototype.isAvailable = () => typeof window < "u";
q.prototype.isConnected = function() {
  return this._connected;
};
q.prototype.getStatus = function() {
  return { connected: this._connected, hasPreloader: !!this.preloader, metrics: Object.assign({}, this._metrics) };
};
q.prototype.info = function() {
  return { moduleId: oi, version: Zi, connected: this._connected, hasPreloader: !!this.preloader, portsInitialized: Ut.isInitialized(), loggerAvailable: !!bt("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
q.prototype.healthCheck = () => {
  const t = { notInErrorState: !0, canConnect: typeof window < "u", loggerAvailable: !!bt("logger"), portsInitialized: Ut.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: `${e}/4`, checks: t, version: Zi, moduleId: oi, portsInitialized: Ut.isInitialized(), timestamp: Date.now() };
};
function Ps(t, e) {
  return new q(e);
}
const Ii = "5.5.0-ENTERPRISE", Ai = "login-modal-integrations";
class $s {
  constructor(e, i = {}) {
    this.loginModal = e, this.config = i, this.adapters = {
      appShell: Rs(e, i.appShell || {}),
      router: Cs(e, i.router || {}),
      permissions: Ls(e, i.permissions || {}),
      preloader: Ps(e, i.preloader || {})
    }, this._metrics = { connectAlls: 0, disconnectAlls: 0, individualConnects: 0, individualDisconnects: 0 };
  }
  connectAll() {
    this._metrics.connectAlls++;
    const e = [];
    return Object.entries(this.adapters).forEach(([i, o]) => {
      o.isAvailable() && o.connect() && e.push(i);
    }), e;
  }
  disconnectAll() {
    this._metrics.disconnectAlls++, Object.values(this.adapters).forEach((e) => {
      try {
        e.disconnect();
      } catch {
      }
    });
  }
  connect(e) {
    this._metrics.individualConnects++;
    const i = this.adapters[e];
    return i ? i.connect() : !1;
  }
  disconnect(e) {
    this._metrics.individualDisconnects++;
    const i = this.adapters[e];
    i && i.disconnect();
  }
  getStatus() {
    const e = {};
    return Object.entries(this.adapters).forEach(([i, o]) => {
      e[i] = o.getStatus();
    }), e;
  }
  checkAvailability() {
    const e = {};
    return Object.entries(this.adapters).forEach(([i, o]) => {
      e[i] = o.isAvailable();
    }), e;
  }
  getAdapter(e) {
    return this.adapters[e] || null;
  }
  info() {
    return { moduleId: Ai, version: Ii, metrics: { ...this._metrics }, adapters: Object.keys(this.adapters), status: this.getStatus(), availability: this.checkAvailability(), timestamp: Date.now() };
  }
  healthCheck() {
    const e = this.checkAvailability(), i = Object.values(e).filter(Boolean).length, o = { hasAdapters: Object.keys(this.adapters).length === 4, atLeastOneAvailable: i > 0, managerOperational: typeof this.connectAll == "function" }, s = Object.values(o).filter(Boolean).length, n = Object.keys(o).length;
    return { status: s === n ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${s}/${n}`, healthy: s >= 2, checks: o, version: Ii, moduleId: Ai, timestamp: Date.now() };
  }
}
function Bs(t, e = {}) {
  return new $s(t, e);
}
const X = "7.3.0-P2-ENTERPRISE", H = "login-modal", si = "7.2.0-P18EC", to = "login-modal-contracts", ee = Object.freeze({
  MODAL_OPEN: "login:modal:open",
  MODAL_CLOSE: "login:modal:close",
  FORM_SUBMIT: "login:form:submit",
  FORM_VALID: "login:form:valid",
  FORM_INVALID: "login:form:invalid",
  PASSWORD_TOGGLE: "login:password:toggle",
  CAPSLOCK_ON: "login:capslock:on",
  CAPSLOCK_OFF: "login:capslock:off"
}), eo = Object.freeze({
  MOUNTING: "login:lifecycle:mounting",
  MOUNTED: "login:lifecycle:mounted",
  READY: "login:lifecycle:ready",
  UNMOUNTING: "login:lifecycle:unmounting",
  UNMOUNTED: "login:lifecycle:unmounted",
  ERROR: "login:lifecycle:error"
}), Us = () => ({ status: "HEALTHY", moduleId: to, version: si }), zs = () => ({ moduleId: to, version: si, uiEvents: Object.keys(ee), lifecycleEvents: Object.keys(eo) }), It = "login-modal", At = { type: "modal", reorderable: !1, hideable: !1, critical: !0, rendersUI: !0, requiresAuth: !1, singleton: !0, category: "auth", priority: "critical" };
let a = null, b = null, pt = [], Dt = null, Q = !1, ce = !1;
const x = { mounts: 0, unmounts: 0, opens: 0, closes: 0, loginAttempts: 0, loginSuccess: 0, loginFailures: 0, errors: 0, navigations: 0 }, S = { globalEventBusConnected: !1, sessionManagerConnected: !1, securityCSRFConnected: !1, preloaderConnected: !1, routerGlobalConnected: !1, permissionsGuardConnected: !1, adaptersConnected: [] }, J = Eo({ moduleId: H }), xs = () => J.init(), w = (t) => J.get(t), io = (t) => J.inject(t), be = () => J.snapshot(), Di = () => {
  const t = w("router");
  if (t != null && t.getCurrentRoute)
    try {
      const e = t.getCurrentRoute();
      if (e != null && e.path) return e.path;
      if (e != null && e.pathname) return e.pathname;
    } catch {
    }
  return typeof window < "u" && window.location && window.location.pathname || "/";
}, oo = () => {
  var t, e;
  return ((e = (t = w("config")) == null ? void 0 : t.app) == null ? void 0 : e.debug) || !1;
}, y = (t, ...e) => {
  const i = w("logger");
  if (!i || !oo() && t === "debug") return;
  const o = i[t] || i.info;
  typeof o == "function" && o(`[${H}]`, ...e);
}, wi = (t) => {
  const e = t ? "authenticated" : "unauthenticated", i = t ? "true" : "false", o = w("globalState");
  if (o != null && o.dispatch)
    try {
      o.dispatch({ type: "SET_AUTH_STATE", payload: { isAuthenticated: t, state: e } }), y("info", "GlobalState.dispatch SET_AUTH_STATE:", e);
    } catch (s) {
      y("debug", "GlobalState dispatch failed:", s.message);
    }
  typeof document < "u" && document.body && (document.body.dataset.authReady = i, document.body.dataset.state = e, y("debug", "body.dataset legacy sync:", e));
}, Hs = (t = "/") => {
  var e;
  x.navigations++;
  const i = w("router");
  if (i != null && i.navigate)
    try {
      const n = Di();
      return n === "/login" || n === "/logout" ? (y("info", "[P0] Navegando para rota default apos login", { from: n, to: t }), i.navigate(t, { source: "login-modal-post-auth", replace: !0 }), !0) : (y("info", "[P0] Ja em rota valida, navegacao nao necessaria", { currentRoute: n }), !1);
    } catch (n) {
      y("debug", "[P0] RouterGlobal.navigate falhou", { error: n.message });
    }
  const o = (e = b == null ? void 0 : b.getAdapter) == null ? void 0 : e.call(b, "router");
  if (o != null && o.navigate)
    try {
      return o.navigate(t, { source: "login-modal-post-auth", replace: !0 }), y("info", "[P0] Navegacao via adapter para", t), !0;
    } catch (n) {
      y("debug", "[P0] Router adapter navigate falhou", { error: n.message });
    }
  y("info", "[P0] Nenhum router disponivel - fallback location.href");
  const s = Di();
  return s === "/login" || s === "/logout" ? (typeof window < "u" && window.location && (window.location.href = t), !0) : !1;
}, so = () => X, ue = () => a !== null && !Q, ie = () => {
  var t, e, i, o, s, n, r, l;
  const d = ((t = a == null ? void 0 : a.healthCheck) == null ? void 0 : t.call(a)) || { status: "UNHEALTHY", score: "0/8" }, c = Us(), u = ((o = (i = (e = a == null ? void 0 : a.getEventBus) == null ? void 0 : e.call(a)) == null ? void 0 : i.healthCheck) == null ? void 0 : o.call(i)) || { status: "UNHEALTHY", score: "0/3" }, h = ((s = b == null ? void 0 : b.healthCheck) == null ? void 0 : s.call(b)) || { status: "UNHEALTHY", score: "0/3" }, p = [];
  a || p.push("LoginModal instance not mounted"), Q && p.push("Instance is destroyed");
  const I = (n = a == null ? void 0 : a.getEventBus) == null ? void 0 : n.call(a);
  I || p.push("Internal EventBus not available"), b || p.push("IntegrationsManager not initialized");
  const L = w("eventBus"), A = w("sessionManager"), v = w("securityCSRF"), E = w("logger");
  L || p.push("Global EventBus not available"), A || p.push("SessionManager not available"), v || p.push("SecurityCSRF not available globally");
  const j = { instanceMounted: !!a, notDestroyed: !Q, internalEventBus: !!I, integrationsReady: !!b, globalEventBus: !!L, sessionManager: !!A, securityCSRF: !!v, classHealthy: d.status !== "UNHEALTHY", contractsHealthy: c.status !== "UNHEALTHY", eventBusHealthy: u.status !== "UNHEALTHY", loggerAvailable: !!E, portsInitialized: J.isInitialized() }, R = Object.values(j).filter(Boolean).length, yo = Object.keys(j).length;
  return { status: R >= 10 ? "HEALTHY" : R >= 7 ? "DEGRADED" : "UNHEALTHY", score: `${R}/${yo}`, checks: j, compliance: "ENTERPRISE-AAA-P18EC", version: X, moduleId: H, id: It, capabilities: At, initialized: ue(), destroyed: Q, isOpen: ((r = a == null ? void 0 : a.isOpen) == null ? void 0 : r.call(a)) || !1, isBusy: ((l = a == null ? void 0 : a.isBusy) == null ? void 0 : l.call(a)) || !1, integrations: { ...S }, submoduleHealth: { class: d, contracts: c, eventBus: u, integrations: h }, metrics: { ...x }, issues: p.length > 0 ? p : null, portsInitialized: J.isInitialized(), timestamp: Date.now() };
}, Ie = () => {
  var t, e, i, o, s, n, r;
  const l = (t = a == null ? void 0 : a.getEventBus) == null ? void 0 : t.call(a), d = w("eventBus");
  return { moduleId: H, id: It, capabilities: At, version: X, compliance: "ENTERPRISE-AAA-P18EC", status: oe(), healthCheck: ie(), config: { debug: oo(), authEventsSource: "/core/runtime/events/index.js", globalStateManagement: "delegated-to-session-manager" }, eventBus: { internal: l ? { listenerCount: ((e = l.getListenerCount) == null ? void 0 : e.call(l)) || "unknown", eventNames: ((i = l.getEventNames) == null ? void 0 : i.call(l)) || [] } : null, global: d ? { version: ((o = d.getVersion) == null ? void 0 : o.call(d)) || "unknown" } : null }, integrations: { ...S, manager: ((s = b == null ? void 0 : b.info) == null ? void 0 : s.call(b)) || null }, metrics: { ...x }, submodules: { class: ((n = a == null ? void 0 : a.info) == null ? void 0 : n.call(a)) || null, contracts: zs(), eventBus: ((r = l == null ? void 0 : l.info) == null ? void 0 : r.call(l)) || null }, versions: { self: X, class: rt, contracts: si, eventBus: Se }, uptime: Dt ? Date.now() - Dt : 0, bootPhaseComplete: ce, portsInitialized: J.isInitialized(), timestamp: Date.now() };
}, ro = () => ({ ...x }), no = () => ({ ...S }), ao = () => {
  var t, e, i;
  return y("info", "reset() called"), (t = a == null ? void 0 : a.isOpen) != null && t.call(a) && a.close("reset"), (i = (e = a == null ? void 0 : a.stateStore) == null ? void 0 : e.clearError) == null || i.call(e), Q = !1, y("info", "Reset complete"), !0;
}, lo = (t = {}) => a ? (y("debug", "Instancia ja existe"), Promise.resolve(a)) : (x.mounts++, xs(), a = new Ze(t), a.mount().then(() => (Dt = Date.now(), Q = !1, Gs(t), Ks(t), Ys(), Vs(), js(), Fs(), y("info", `Modulo inicializado (${X})`), a))), Fs = () => {
  typeof window > "u" || (window.__dev = window.__dev || {}, window.__dev.loginModal = { getVersion: () => X, info: () => Ie(), healthCheck: () => ie(), getMetrics: () => ({ ...x }), getIntegrationsStatus: () => ({ ...S }), getStatus: oe, getInstance: Ae, getEventBus: De, getIntegrations: () => {
    var t;
    return ((t = b == null ? void 0 : b.getStatus) == null ? void 0 : t.call(b)) || null;
  }, getPorts: () => be(), forceOpen: (t) => {
    var e;
    return (e = a == null ? void 0 : a.open) == null ? void 0 : e.call(a, t || "debug-force");
  }, forceClose: (t) => {
    var e;
    return (e = a == null ? void 0 : a.close) == null ? void 0 : e.call(a, t || "debug-force");
  }, triggerLoginRequired: (t) => we(t) }, bo() ? (Io("GLOBAL_EXPOSURE_BLOCKED", { module: H, target: "window.LoginModal" }), y("info", "API global bloqueada (strict mode ativo)")) : (window.LoginModal = { getVersion: so, getStatus: oe, healthCheck: ie, info: Ie, isInitialized: ue, reset: ao, mount: lo, unmount: de, shutdown: co, destroy: uo, getInstance: Ae, show: ho, hide: mo, isOpen: po, isBusy: fo, getMetrics: ro, getIntegrationsStatus: no, open: (t) => {
    var e;
    return (e = a == null ? void 0 : a.open) == null ? void 0 : e.call(a, t || "global-api");
  }, close: (t) => {
    var e;
    return (e = a == null ? void 0 : a.close) == null ? void 0 : e.call(a, t || "global-api");
  }, requireLogin: we, getEventBus: De, injectPorts: io, getPorts: be, LoginModal: Ze, EventBus: $, AUTH_EVENTS: D, UI_EVENTS: ee, LIFECYCLE_EVENTS: eo, id: It, capabilities: At, version: X, moduleId: H }, y("info", "API global exposta (LoginModal)")));
}, Vs = () => {
  if (w("securityCSRF")) {
    y("debug", "SecurityCSRF disponivel via port"), S.securityCSRFConnected = !0;
    return;
  }
  const e = a == null ? void 0 : a.securityCSRF;
  e ? (J.inject({ securityCSRF: e }), S.securityCSRFConnected = !0, y("debug", "SecurityCSRF atualizado no port (interno)")) : y("info", "SecurityCSRF nao disponivel - funcionando standalone");
}, js = () => {
  S.globalEventBusConnected = !!w("eventBus"), S.sessionManagerConnected = !!w("sessionManager"), S.securityCSRFConnected = !!w("securityCSRF"), S.preloaderConnected = !!w("preloader"), S.routerGlobalConnected = !!w("router"), S.permissionsGuardConnected = !!w("permissionsGuard"), S.adaptersConnected = b != null && b.getStatus ? Object.entries(b.getStatus()).filter(([, t]) => t == null ? void 0 : t.connected).map(([t]) => t) : [];
}, de = () => (x.unmounts++, b && (b.disconnectAll(), b = null), pt.forEach((t) => {
  try {
    t();
  } catch {
  }
}), pt = [], a ? a.unmount().then(() => {
  a = null, Q = !0, Dt = null, ce = !1;
  for (const t of Object.keys(S))
    t === "adaptersConnected" ? S[t] = [] : S[t] = !1;
  y("info", "Modulo desmontado");
}) : (Q = !0, Promise.resolve())), co = () => de(), uo = () => de(), Ae = () => a, ho = (t = "external-call") => {
  var e;
  x.opens++, (e = a == null ? void 0 : a.open) == null || e.call(a, t);
}, mo = (t = "external-call") => {
  var e;
  x.closes++, (e = a == null ? void 0 : a.close) == null || e.call(a, t);
}, po = () => {
  var t;
  return ((t = a == null ? void 0 : a.isOpen) == null ? void 0 : t.call(a)) || !1;
}, fo = () => {
  var t;
  return ((t = a == null ? void 0 : a.isBusy) == null ? void 0 : t.call(a)) || !1;
}, oe = () => a ? { ...a.getStatus(), version: X, moduleId: H, id: It, capabilities: At, initialized: ue(), destroyed: Q, integrations: { ...S }, metrics: { ...x }, uptime: Dt ? Date.now() - Dt : 0, bootPhaseComplete: ce, portsInitialized: J.isInitialized() } : { version: X, moduleId: H, id: It, capabilities: At, initialized: !1, destroyed: Q, mounted: !1, portsInitialized: J.isInitialized() }, De = () => {
  var t;
  return ((t = a == null ? void 0 : a.getEventBus) == null ? void 0 : t.call(a)) || null;
}, we = (t = {}) => {
  var e, i;
  return (i = (e = a == null ? void 0 : a.modalController) == null ? void 0 : e.triggerLoginRequired) == null ? void 0 : i.call(e, t);
}, Gs = (t) => {
  if (!a) return;
  b = Bs(a, { appShell: { enabled: t.enableAppShellAdapter !== !1 }, router: { enabled: t.enableRouterAdapter !== !1, defaultRoute: t.defaultRoute || "/", loginRoute: t.loginRoute || "/login" }, permissions: { enabled: t.enablePermissionsAdapter !== !1 }, preloader: { enabled: t.enablePreloaderAdapter !== !1 } });
  const e = b.connectAll();
  e.length > 0 && (y("info", "Adapters conectados:", e.join(", ")), S.adaptersConnected = e);
}, Ys = () => {
  var t;
  if (!a) return;
  const e = (t = a.getEventBus) == null ? void 0 : t.call(a);
  if (!e) return;
  const i = w("eventBus"), o = e.on(ee.MODAL_OPEN, () => {
    var n;
    const r = document.getElementById("shell-login-region");
    r && r.classList.add("login-active"), (n = i == null ? void 0 : i.emit) == null || n.call(i, D.MODAL_OPEN, { moduleId: H, timestamp: Date.now() });
  });
  pt.push(o);
  const s = e.on(ee.MODAL_CLOSE, () => {
    var n;
    const r = document.getElementById("shell-login-region");
    r && r.classList.remove("login-active"), (n = i == null ? void 0 : i.emit) == null || n.call(i, D.MODAL_CLOSE, { moduleId: H, timestamp: Date.now() });
  });
  pt.push(s);
}, Ks = (t) => {
  const e = w("eventBus");
  t.integrateWithGlobalEventBus !== !1 && e && qs();
}, qs = () => {
  var t;
  const e = w("eventBus");
  if (!e || !a) return;
  const i = (t = a.getEventBus) == null ? void 0 : t.call(a);
  if (!i) return;
  [D.LOGIN_SUCCESS, D.LOGIN_FAILURE, D.READY, D.SESSION_CHECKED, D.LOGOUT].forEach((r) => {
    if (!r) {
      y("debug", "Evento undefined no forwardEvents");
      return;
    }
    const l = i.on(r, (d) => {
      try {
        e.emit(r, { ...d, source: H, forwardedFrom: H }), r === D.LOGIN_SUCCESS && (x.loginSuccess++, wi(!0), y("info", "Auth gate liberado (login interativo)"), setTimeout(() => {
          y("info", "[P0] Iniciando navegacao pos-login..."), Hs("/");
        }, 500)), r === D.LOGIN_FAILURE && x.loginFailures++, r === D.LOGOUT && (wi(!1), y("info", "Auth gate fechado"));
      } catch (c) {
        x.errors++, y("debug", `Erro ao forward ${r}:`, c);
      }
    });
    pt.push(l);
  });
  const s = (r) => {
    var l, d;
    x.loginAttempts++, y("info", "AUTH_INTENTS.LOGIN recebido", r), (d = (l = a == null ? void 0 : a.modalController) == null ? void 0 : l.triggerLoginRequired) == null || d.call(l, r);
  };
  e.on && (e.on(Wt.LOGIN, s), pt.push(() => {
    var r;
    return (r = e.off) == null ? void 0 : r.call(e, Wt.LOGIN, s);
  }));
  const n = (r) => {
    var l;
    r && ["bootstrap-v2", "bootstrap-v2-restore", "bootstrap-v2-recovery", "bootstrap-v2-post-login", "auth-boot", "auth-boot-restore"].includes(r.source) && (ce = !0, y("info", `Boot phase marcado como completo (source: ${r == null ? void 0 : r.source})`)), (r == null ? void 0 : r.source) !== H && ((l = a == null ? void 0 : a.isOpen) != null && l.call(a)) && (y("info", "AUTH_EVENTS.READY recebido de fonte externa - fechando modal", { source: r == null ? void 0 : r.source }), a.close("auth-ready-external"));
  };
  e.on && (e.on(D.READY, n), pt.push(() => {
    var r;
    return (r = e.off) == null ? void 0 : r.call(e, D.READY, n);
  })), S.globalEventBusConnected = !0, y("info", "Integracao com EventBus global ativada");
}, or = { getVersion: so, getStatus: oe, healthCheck: ie, info: Ie, isInitialized: ue, reset: ao, mount: lo, unmount: de, shutdown: co, destroy: uo, getInstance: Ae, show: ho, hide: mo, isOpen: po, isBusy: fo, requireLogin: we, getEventBus: De, getMetrics: ro, getIntegrationsStatus: no, injectPorts: io, getPorts: be, LoginModal: Ze, EventBus: $, AUTH_EVENTS: D, id: It, capabilities: At, VERSION: X, MODULE_ID: H }, Rt = {
  user: '<svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  lock: '<svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  eye: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" role="img" class="eye-icon lm-eye-icon"><title>Mostrar senha</title><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  warning: '<svg class="lm-caps-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
}, go = [
  { url: "/api/auth", crossorigin: !1 },
  { url: "/api/csrf", crossorigin: !1 },
  { url: "https://api.pwnedpasswords.com", crossorigin: !0 }
];
function Ws() {
  if (typeof document > "u") return;
  const t = document.head;
  go.forEach(({ url: e, crossorigin: i }) => {
    if (t.querySelector(`link[rel="preconnect"][href="${e}"]`)) return;
    const o = document.createElement("link");
    o.rel = "preconnect", o.href = e, i && (o.crossOrigin = "anonymous"), t.appendChild(o);
  });
}
function Qs(t = {}) {
  var e, i, o, s, n, r, l, d;
  Ws();
  const c = ((e = t.video) == null ? void 0 : e.src) || t.videoSrc || "/assets/videos/video_background_site_web.mp4", u = t.idPrefix || "login", h = ((i = t.ui) == null ? void 0 : i.showRememberMe) !== !1, p = ((o = t.ui) == null ? void 0 : o.showForgotPassword) !== !1, I = ((s = t.ui) == null ? void 0 : s.forgotPasswordUrl) || "#forgot-password", L = ((n = t.security) == null ? void 0 : n.honeypot) !== !1, A = ((r = t.i18n) == null ? void 0 : r.enabled) !== !1, v = ((l = t.avatar) == null ? void 0 : l.enabled) !== !1, E = ((d = t.video) == null ? void 0 : d.lazyLoad) !== !1;
  return `
    <div
      id="${u}-modal"
      class="login-modal lm-modal lm-root"
      hidden
      data-component="login-modal">

      <div class="login-backdrop lm-backdrop" data-backdrop></div>

      <video
        id="${u}-video"
        class="login-video lm-video"
        autoplay
        loop
        muted
        playsinline
        ${E ? 'preload="none"' : 'preload="metadata"'}
        ${E ? "" : `src="${c}"`}
        loading="lazy"
        aria-hidden="true"
        data-testid="login-video"
        data-video-src="${c}">
        ${E ? "" : `<source src="${c}" type="video/mp4">`}
      </video>

      <div class="login-container-wrapper lm-wrapper">
        ${A ? '<div class="lm-language-container" data-language-container></div>' : ""}

        <div class="login-container lm-container">
          <div class="login-container-inner lm-inner">

            <div class="login-brand lm-brand" aria-hidden="true">
              <img src="/assets/icons/logo-horizontal.png" alt="DSHOW DASH" class="lm-logo" loading="lazy" decoding="async" width="120" height="40">
              <h2 id="${u}-title" class="visually-hidden lm-visually-hidden">Login DSHOW DASH</h2>
            </div>

            <form
              id="${u}-form"
              class="login-form lm-form"
              novalidate
              aria-describedby="${u}-error"
              data-testid="login-form">

              ${L ? `
              <div class="lm-honeypot" aria-hidden="true" inert style="position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;height:0;width:0;overflow:hidden;">
                <label for="${u}-website">Website (deixe em branco)</label>
                <input type="text" id="${u}-website" name="website_url" tabindex="-1" autocomplete="off" data-honeypot="true">
              </div>
              ` : ""}

              <div class="lm-floating-group">
                <div class="lm-input-wrapper">
                  ${Rt.user}
                  <input
                    type="text"
                    id="${u}-email"
                    class="login-input lm-input lm-floating-input"
                    name="username"
                    placeholder=" "
                    autocomplete="username email"
                    required
                    aria-required="true"
                    data-testid="login-username">
                  <label for="${u}-email" class="lm-floating-label">Usuário ou E-mail</label>
                </div>
                ${v ? '<div class="lm-avatar-container" data-avatar-container></div>' : ""}
              </div>

              <div class="password-wrapper lm-password-wrapper">
                <div class="lm-floating-group">
                  <div class="lm-input-wrapper">
                    ${Rt.lock}
                    <input
                      type="password"
                      id="${u}-password"
                      class="login-input lm-input lm-floating-input"
                      name="password"
                      placeholder=" "
                      autocomplete="current-password"
                      required
                      aria-required="true"
                      data-testid="login-password">
                    <label for="${u}-password" class="lm-floating-label">Senha</label>
                  </div>
                </div>

                <button
                  type="button"
                  id="toggle-password"
                  class="toggle-password lm-toggle-password"
                  aria-label="Mostrar senha"
                  aria-pressed="false"
                  tabindex="0"
                  data-testid="toggle-password">
                  ${Rt.eye}
                </button>
              </div>

              <div
                id="${u}-capslock"
                class="lm-capslock-warning"
                role="status"
                aria-live="polite"
                hidden
                data-testid="capslock-warning">
                ${Rt.warning}
                <span>Caps Lock está ativado</span>
              </div>

              <div
                id="${u}-breach-warning"
                class="lm-breach-warning"
                role="alert"
                aria-live="polite"
                hidden
                data-testid="breach-warning">
                <svg class="lm-breach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span data-breach-message>Esta senha foi encontrada em vazamentos de dados.</span>
              </div>

              <div class="lm-form-options">
                ${h ? `
                <label class="lm-remember-me">
                  <input
                    type="checkbox"
                    id="${u}-remember"
                    name="remember"
                    class="lm-checkbox"
                    data-testid="remember-me">
                  <span class="lm-checkbox-custom"></span>
                  <span class="lm-checkbox-label">Lembrar-me</span>
                </label>
                ` : ""}
                ${p ? `<a href="${I}" class="lm-forgot-password" id="${u}-forgot" data-testid="forgot-password">Esqueci minha senha</a>` : ""}
              </div>

              <div
                id="${u}-error"
                class="login-error lm-error"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                data-testid="login-error"></div>

              <div
                class="lm-sr-live"
                aria-live="polite"
                aria-atomic="true"
                data-sr-live></div>

              <button
                type="submit"
                id="${u}-button"
                class="login-button lm-button"
                data-testid="login-submit">
                Entrar
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  `;
}
const Xs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ICONS: Rt,
  PRECONNECT_URLS: go,
  getLoginModalTemplate: Qs
}, Symbol.toStringTag, { value: "Module" }));
export {
  nr as AUTH_EVENTS,
  ar as AUTH_INTENTS,
  $ as EventBus,
  eo as LIFECYCLE_EVENTS,
  Ze as LoginModal,
  H as MODULE_ID,
  ee as UI_EVENTS,
  X as VERSION,
  At as capabilities,
  or as default,
  uo as destroy,
  De as getEventBusInstance,
  Ae as getInstance,
  no as getIntegrationsStatus,
  ro as getMetrics,
  be as getPorts,
  oe as getStatus,
  so as getVersion,
  ie as healthCheck,
  mo as hide,
  It as id,
  Ie as info,
  io as injectPorts,
  fo as isBusy,
  ue as isInitialized,
  po as isOpen,
  lo as mount,
  we as requireLogin,
  ao as reset,
  ho as show,
  co as shutdown,
  de as unmount
};
