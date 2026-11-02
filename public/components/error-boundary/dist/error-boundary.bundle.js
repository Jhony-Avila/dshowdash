import { createCorePorts as z } from "/core/runtime/ports-profiles.js";
import { isStrict as qe, recordViolation as Je } from "/core/runtime/enterprise/strict-mode.js";
import { ERROR_EVENTS as ce, TELEMETRY_EVENTS as Ze } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { ERROR_EVENTS as xt } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const ye = "2.6.0-P2-ENTERPRISE", ue = "components.error-boundary.state.store", X = z({ moduleId: ue }), Xe = (e) => X.get(e), et = (e) => X.inject(e), tt = () => X.snapshot(), rt = (e, ...t) => {
  var r;
  const n = Xe("logger");
  n && ((r = n.error) == null || r.call(n, `[${ue}]`, ...t));
}, i = {
  errors: [],
  lastError: null,
  errorCount: 0,
  fatalError: !1,
  recoveryAttempts: 0,
  maxErrors: 100,
  lastUpdatedAt: null
}, ie = /* @__PURE__ */ new Set(), nt = () => `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, c = {
  get(e) {
    return e ? i[e] : { ...i };
  },
  set(e, t) {
    const r = i[e];
    return i[e] = t, i.lastUpdatedAt = Date.now(), this._notify("set", e, t, r), !0;
  },
  addError(e) {
    const t = {
      id: e.id || nt(),
      timestamp: Date.now(),
      message: e.message || String(e),
      stack: e.stack || null,
      type: e.type || e.name || "Error",
      source: e.source || "unknown",
      category: e.category || "general",
      fingerprint: e.fingerprint || null,
      componentStack: e.componentStack || null,
      metadata: e.metadata || {},
      recovered: !1
    };
    return i.errors.push(t), i.lastError = t, i.errorCount++, i.lastUpdatedAt = Date.now(), i.errors.length > i.maxErrors && i.errors.shift(), this._notify("error-added", "errors", t, null), t;
  },
  updateError(e) {
    const t = typeof e == "string" ? e : e == null ? void 0 : e.id;
    if (!t) return null;
    const r = i.errors.findIndex((n) => n.id === t);
    return r === -1 ? null : (typeof e == "object" && (i.errors[r] = { ...i.errors[r], ...e }), i.lastUpdatedAt = Date.now(), this._notify("error-updated", "errors", i.errors[r], null), i.errors[r]);
  },
  getErrors() {
    return i.errors.slice();
  },
  getLastError() {
    return i.lastError;
  },
  getErrorCount() {
    return i.errorCount;
  },
  hasError() {
    return i.errorCount > 0 || i.fatalError;
  },
  clearErrors() {
    return i.errors = [], i.lastError = null, i.errorCount = 0, i.fatalError = !1, i.recoveryAttempts = 0, i.lastUpdatedAt = Date.now(), this._notify("errors-cleared", null, null, null), !0;
  },
  setFatalError(e) {
    return i.fatalError = e, i.lastUpdatedAt = Date.now(), this._notify("fatal-error", "fatalError", e, null), !0;
  },
  isFatal() {
    return i.fatalError;
  },
  incrementRecoveryAttempts() {
    return i.recoveryAttempts++, i.recoveryAttempts;
  },
  getRecoveryAttempts() {
    return i.recoveryAttempts;
  },
  subscribe(e) {
    return typeof e != "function" ? () => {
    } : (ie.add(e), () => ie.delete(e));
  },
  _notify(e, t, r, n) {
    for (const s of ie)
      try {
        s({ action: e, key: t, newValue: r, oldValue: n, state: this.get(), error: r });
      } catch (o) {
        rt("error", "Listener error:", o);
      }
  },
  reset() {
    return this.clearErrors();
  },
  toJSON() {
    return { ...i };
  },
  getStatus() {
    return {
      errorCount: i.errorCount,
      hasError: this.hasError(),
      isFatal: i.fatalError,
      recoveryAttempts: i.recoveryAttempts,
      lastUpdatedAt: i.lastUpdatedAt
    };
  },
  getMetrics() {
    return {
      errorCount: i.errorCount,
      fatalError: i.fatalError,
      recoveryAttempts: i.recoveryAttempts,
      listenerCount: ie.size,
      lastUpdatedAt: i.lastUpdatedAt
    };
  },
  healthCheck() {
    const e = X.snapshot(), t = {
      notOverflowing: i.errors.length < i.maxErrors,
      notFatal: !i.fatalError,
      lowErrorCount: i.errorCount < 50,
      portsInitialized: e._initialized
    }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length, s = Object.entries(t).filter(([, o]) => !o).map(([o]) => o);
    return {
      status: r === n ? "HEALTHY" : r >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: r,
      maxScore: n,
      scoreDisplay: `${r}/${n}`,
      checks: t,
      issues: s.length > 0 ? s : null,
      errorCount: i.errorCount,
      version: ye,
      moduleId: ue,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = X.snapshot();
    return {
      moduleId: ue,
      version: ye,
      status: this.getStatus(),
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts: et,
  getPorts: tt
}, Ue = "2.4.0-P2-ENTERPRISE", Me = "components.error-boundary.telemetry.tracker", ge = "error-boundary", He = z({ moduleId: Me }), x = (e) => He.get(e), ve = {
  enabled: !0,
  maxLogSize: 500
}, $ = [], v = {
  eventsTracked: 0,
  errorEvents: 0,
  lifecycleEvents: 0,
  lastEventAt: null,
  lastEventLocalTime: null
}, st = () => {
  const e = x("telemetry");
  return e && typeof e.track == "function";
}, ot = () => {
  const e = x("eventBus");
  return e && typeof e.emit == "function";
}, Fe = () => {
  const e = x("telemetry");
  if (e != null && e.buildTimestamp) return e.buildTimestamp();
  const t = Date.now();
  return {
    timestampUtc: t,
    isoUtc: new Date(t).toISOString(),
    localTime: new Date(t).toLocaleString("pt-BR"),
    timeZone: "America/Sao_Paulo",
    locale: "pt-BR"
  };
};
function l(e, t = {}) {
  const r = Fe(), n = {
    timestampUtc: r.timestampUtc,
    localTime: r.localTime,
    timeZone: r.timeZone,
    namespace: ge,
    event: e,
    data: t
  };
  $.push(n), $.length > ve.maxLogSize && $.shift(), v.eventsTracked++, v.lastEventAt = r.timestampUtc, v.lastEventLocalTime = r.localTime, (e.includes("error") || e.includes("caught")) && v.errorEvents++, (e.includes("lifecycle") || e.includes("init") || e.includes("shutdown")) && v.lifecycleEvents++;
  const s = x("telemetry");
  if (s != null && s.track)
    try {
      s.track(`${ge}:${e}`, {
        component: ge,
        timestampUtc: r.timestampUtc,
        localTime: r.localTime,
        ...t
      });
    } catch {
    }
  const o = x("eventBus");
  if (o != null && o.emit)
    try {
      o.emit(Ze.EVENT, n);
    } catch {
    }
  return !0;
}
function Be() {
  return $.slice();
}
function it(e = 10) {
  return $.slice(-e);
}
function we() {
  return {
    eventsTracked: v.eventsTracked,
    errorEvents: v.errorEvents,
    lifecycleEvents: v.lifecycleEvents,
    lastEventAt: v.lastEventAt,
    lastEventLocalTime: v.lastEventLocalTime,
    eventLogSize: $.length,
    telemetryCoreAvailable: st(),
    eventBusAvailable: ot()
  };
}
function Oe() {
  const e = He.snapshot(), t = Fe(), r = we(), n = x("telemetry"), s = n && typeof n.buildTimestamp == "function", o = {
    enabled: ve.enabled,
    bufferNotOverflowing: $.length < ve.maxLogSize,
    telemetryCoreAvailable: r.telemetryCoreAvailable,
    eventBusAvailable: r.eventBusAvailable,
    buildTimestampAvailable: s,
    portsInitialized: e._initialized
  }, a = Object.values(o).filter(Boolean).length, h = Object.keys(o).length, b = Object.entries(o).filter(([, A]) => !A).map(([A]) => A);
  return {
    status: a >= 5 ? "HEALTHY" : a >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: a,
    maxScore: h,
    scoreDisplay: `${a}/${h}`,
    checks: o,
    issues: b.length > 0 ? b : null,
    portsInitialized: e._initialized,
    metrics: r,
    version: Ue,
    moduleId: Me,
    timestampUtc: t.timestampUtc,
    localTime: t.localTime,
    timeZone: t.timeZone
  };
}
const q = "2.2.0-P2-ENTERPRISE", Ee = "components.error-boundary.utils.helpers";
function V(e) {
  return e ? {
    message: e.message || String(e),
    stack: e.stack || "",
    name: e.name || "Error",
    code: e.code || e.statusCode || null,
    source: e.source || "unknown",
    severity: e.severity || (e.name === "TypeError" ? "critical" : "error"),
    route: e.route || null,
    panel: e.panel || null,
    timestamp: Date.now()
  } : {
    message: "Unknown error",
    stack: "",
    name: "Error",
    code: null,
    source: "unknown",
    severity: "error",
    timestamp: Date.now()
  };
}
function xe(e) {
  const t = V(e);
  return {
    title: t.name || "Application Error",
    message: t.message || "Something went wrong. Please try refreshing the page.",
    timestamp: (/* @__PURE__ */ new Date()).toLocaleString(),
    code: t.code,
    severity: t.severity,
    route: t.route,
    panel: t.panel,
    actionable: se(e)
  };
}
function he() {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function se(e) {
  return !["SyntaxError", "ReferenceError", "TypeError", "RangeError"].includes(e == null ? void 0 : e.name);
}
function ee(e) {
  if (!e) return { message: "Unknown error", name: "Error", stack: null };
  const t = {
    message: String(e.message || e).substring(0, 1e3),
    name: e.name || "Error",
    stack: e.stack ? String(e.stack).substring(0, 2e3) : null,
    code: e.code || e.statusCode || null,
    source: e.source || null
  };
  return t.message && (t.message = t.message.replace(/password[=:]\s*\S+/gi, "password=[REDACTED]"), t.message = t.message.replace(/token[=:]\s*\S+/gi, "token=[REDACTED]"), t.message = t.message.replace(/api[_-]?key[=:]\s*\S+/gi, "apikey=[REDACTED]")), t;
}
function Ve(e) {
  if (!e) return "unknown";
  const t = e.name || "", r = (e.message || "").toLowerCase();
  return t === "NetworkError" || r.includes("network") || r.includes("fetch") ? "network" : t === "TypeError" || t === "ReferenceError" ? "runtime" : t === "SyntaxError" ? "syntax" : e.statusCode >= 400 && e.statusCode < 500 ? "client" : e.statusCode >= 500 ? "server" : r.includes("timeout") ? "timeout" : r.includes("permission") || r.includes("unauthorized") ? "auth" : "general";
}
function Se(e, t = {}) {
  if (!e) return !1;
  const r = t.ignoredMessages || ["ResizeObserver loop", "Script error", "Loading chunk"], n = e.message || "";
  for (const s of r)
    if (n.includes(s)) return !1;
  return !(t.ignoredTypes && t.ignoredTypes.includes(e.name));
}
function Ge(e) {
  if (!e) return "unknown";
  const t = [e.name || "Error", (e.message || "").substring(0, 100)];
  if (e.stack) {
    const n = (e.stack.split(`
`)[1] || "").match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
    n && t.push(n[1], n[2], n[3]);
  }
  return t.join("|").replace(/\s+/g, "_").substring(0, 200);
}
function at(...e) {
  const t = {};
  for (const r of e)
    r && typeof r == "object" && Object.assign(t, r);
  return t;
}
function lt(e, t = null) {
  try {
    return typeof e != "function" ? t : e();
  } catch {
    return t;
  }
}
const le = {
  formatError: V,
  formatErrorForDisplay: xe,
  createErrorId: he,
  isRecoverable: se,
  sanitizeError: ee,
  categorizeError: Ve,
  shouldReportError: Se,
  createErrorFingerprint: Ge,
  mergeContext: at,
  safeExecute: lt,
  VERSION: q,
  MODULE_ID: Ee,
  healthCheck() {
    const e = {
      functionsAvailable: typeof V == "function" && typeof ee == "function",
      versionValid: q.length > 0
    }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
    return {
      status: t === r ? "HEALTHY" : "DEGRADED",
      score: t,
      maxScore: r,
      scoreDisplay: `${t}/${r}`,
      checks: e,
      issues: t === r ? null : Object.entries(e).filter(([, n]) => !n).map(([n]) => n),
      version: q,
      moduleId: Ee,
      timestamp: Date.now()
    };
  },
  info() {
    return {
      moduleId: Ee,
      version: q,
      functions: [
        "formatError",
        "formatErrorForDisplay",
        "createErrorId",
        "isRecoverable",
        "sanitizeError",
        "categorizeError",
        "shouldReportError",
        "createErrorFingerprint",
        "mergeContext",
        "safeExecute"
      ],
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  }
}, ke = "2.5.0-P2-ENTERPRISE", M = "components.error-boundary.core.handler", te = z({ moduleId: M }), We = (e) => te.get(e), ct = (e) => te.inject(e), ut = () => te.snapshot();
let J = !1;
const dt = () => {
  const e = We("config");
  return e && e.app && e.app.debug ? !0 : J;
}, Te = (e, ...t) => {
  var r, n;
  const s = We("logger");
  if (s) {
    if (e === "error") {
      (r = s.error) == null || r.call(s, `[${M}]`, ...t);
      return;
    }
    if (e === "warn") {
      (n = s.warn) == null || n.call(s, `[${M}]`, ...t);
      return;
    }
    dt() && s.debug && s.debug(`[${M}]`, ...t);
  }
}, m = {
  caught: 0,
  recovered: 0,
  retries: 0,
  wraps: 0,
  lastCaughtAt: null
}, E = {
  setDebugMode(e) {
    return J = !!e, J;
  },
  getDebugMode() {
    return J;
  },
  catch(e, t = {}) {
    const r = ee(e), n = {
      id: he(),
      ...r,
      context: t,
      timestamp: Date.now(),
      recovered: !1,
      recoverable: se(e)
    };
    return c.addError(n), m.caught++, m.lastCaughtAt = Date.now(), l("error:caught", {
      errorId: n.id,
      message: r.message,
      recoverable: n.recoverable
    }), Te("error", "Caught:", r.message, t), n;
  },
  recover(e = null) {
    const t = e ? c.getErrors().find((n) => n.id === e) : c.getLastError();
    if (!t)
      return Te("warn", "No error to recover"), null;
    const r = c.updateError({
      ...t,
      recovered: !0,
      recoveredAt: Date.now()
    });
    return r && (m.recovered++, l("error:recovered", { errorId: t.id })), r;
  },
  retry(e, t = 3, r = {}) {
    const n = r.delay || 100, s = r.backoff || 2, o = r.onRetry || null;
    let a = 0, h = null;
    return new Promise((b, A) => {
      const Q = () => {
        a++, Promise.resolve().then(() => e()).then(b).catch((oe) => {
          if (h = oe, m.retries++, a < t) {
            const D = n * Math.pow(s, a - 1);
            if (l("error:retry", { attempt: a, maxAttempts: t, waitTime: D }), typeof o == "function")
              try {
                o({ attempt: a, error: oe, waitTime: D });
              } catch {
              }
            setTimeout(Q, D);
          } else
            l("error:retry:exhausted", { attempts: a, maxAttempts: t }), A(h);
        });
      };
      Q();
    });
  },
  wrap(e, t = {}) {
    m.wraps++;
    const r = this;
    return function(...n) {
      try {
        return e.apply(this, n);
      } catch (s) {
        throw r.catch(s, { ...t, args: n, type: "sync-wrap" }), s;
      }
    };
  },
  wrapAsync(e, t = {}) {
    m.wraps++;
    const r = this;
    return function(...n) {
      return Promise.resolve().then(() => e.apply(this, n)).catch((s) => {
        throw r.catch(s, { ...t, args: n, type: "async-wrap" }), s;
      });
    };
  },
  getMetrics() {
    return { ...m };
  },
  resetMetrics() {
    return m.caught = 0, m.recovered = 0, m.retries = 0, m.wraps = 0, m.lastCaughtAt = null, !0;
  },
  healthCheck() {
    const e = te.snapshot(), t = this.getMetrics(), r = c.healthCheck ? c.healthCheck() : { status: "UNKNOWN" }, n = {
      storeHealthy: r.status === "HEALTHY" || r.status === "DEGRADED",
      lowCaughtRate: t.caught < 100,
      hasRecoveries: t.caught === 0 || t.recovered > 0 || t.caught < 5,
      portsInitialized: e._initialized
    }, s = Object.values(n).filter(Boolean).length, o = Object.keys(n).length, a = Object.entries(n).filter(([, h]) => !h).map(([h]) => h);
    return {
      status: s === o ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: s,
      maxScore: o,
      scoreDisplay: `${s}/${o}`,
      checks: n,
      issues: a.length > 0 ? a : null,
      metrics: t,
      version: ke,
      moduleId: M,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = te.snapshot();
    return {
      moduleId: M,
      version: ke,
      debugMode: J,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts: ct,
  getPorts: ut
}, Ie = "2.6.0-P2-ENTERPRISE", Ce = "components.error-boundary.core.reporter", G = z({ moduleId: Ce }), ht = () => G.init(), ft = (e) => G.get(e), pt = (e) => G.inject(e), mt = () => G.snapshot(), gt = () => {
  ht();
  const e = ft("router");
  if (e && e.getCurrentRoute)
    try {
      const t = e.getCurrentRoute();
      if (t && (t.url || t.href)) return t.url || t.href;
    } catch {
    }
  return typeof window < "u" && window.location ? window.location.href : "unknown";
}, d = {
  endpoint: null,
  batchSize: 10,
  flushInterval: 3e4,
  maxQueueSize: 100
}, p = [];
let P = null;
const y = {
  reported: 0,
  flushed: 0,
  failed: 0,
  lastFlushAt: null
}, _ = {
  configure(e = {}) {
    return e.endpoint && (d.endpoint = e.endpoint), typeof e.batchSize == "number" && (d.batchSize = e.batchSize), typeof e.flushInterval == "number" && (d.flushInterval = e.flushInterval), typeof e.maxQueueSize == "number" && (d.maxQueueSize = e.maxQueueSize), l("error:reporter:configured", {
      hasEndpoint: !!d.endpoint,
      batchSize: d.batchSize
    }), { ...d };
  },
  getConfig() {
    return { ...d };
  },
  isConfigured() {
    return !!d.endpoint;
  },
  report(e, t = {}) {
    return d.endpoint ? (p.length >= d.maxQueueSize && (l("error:reporter:queue-full", { queueSize: p.length }), p.shift()), p.push({
      ...e,
      metadata: t,
      reportedAt: Date.now(),
      userAgent: typeof navigator < "u" ? navigator.userAgent : "unknown",
      url: gt()
    }), y.reported++, p.length >= d.batchSize && this.flush(), !0) : (l("error:reporter:no-endpoint"), !1);
  },
  flush() {
    if (p.length === 0)
      return Promise.resolve({ success: !0, count: 0 });
    if (!d.endpoint)
      return Promise.resolve({ success: !1, reason: "no-endpoint" });
    const e = p.splice(0, d.batchSize);
    return l("error:reporter:flush:start", { count: e.length }), fetch(d.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors: e, timestamp: Date.now() })
    }).then((t) => t.ok ? (y.flushed += e.length, y.lastFlushAt = Date.now(), l("error:reporter:flush:success", { count: e.length }), { success: !0, count: e.length }) : (p.unshift(...e), y.failed += e.length, l("error:reporter:flush:failed", { status: t.status }), { success: !1, status: t.status })).catch((t) => (p.unshift(...e), y.failed += e.length, l("error:reporter:flush:error", { error: t.message }), { success: !1, error: t.message }));
  },
  startAutoFlush() {
    return P ? !1 : (P = setInterval(() => {
      this.flush();
    }, d.flushInterval), l("error:reporter:auto-flush:started"), !0);
  },
  stopAutoFlush() {
    return P ? (clearInterval(P), P = null, l("error:reporter:auto-flush:stopped"), !0) : !1;
  },
  isAutoFlushing() {
    return !!P;
  },
  getQueueSize() {
    return p.length;
  },
  clearQueue() {
    const e = p.length;
    return p.length = 0, e;
  },
  getMetrics() {
    return {
      ...y,
      queueSize: p.length
    };
  },
  resetMetrics() {
    return y.reported = 0, y.flushed = 0, y.failed = 0, y.lastFlushAt = null, !0;
  },
  healthCheck() {
    const e = G.snapshot(), t = this.getMetrics(), r = {
      endpointConfigured: !!d.endpoint,
      queueNotFull: t.queueSize < d.maxQueueSize * 0.8,
      lowFailureRate: t.reported === 0 || t.failed / t.reported < 0.3,
      portsInitialized: e._initialized
    }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length, o = Object.entries(r).filter(([, a]) => !a).map(([a]) => a);
    return {
      status: n === s ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: n,
      maxScore: s,
      scoreDisplay: `${n}/${s}`,
      checks: r,
      issues: o.length > 0 ? o : null,
      metrics: t,
      autoFlushing: this.isAutoFlushing(),
      configured: this.isConfigured(),
      version: Ie,
      moduleId: Ce,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = G.snapshot();
    return {
      moduleId: Ce,
      version: Ie,
      configured: this.isConfigured(),
      config: {
        endpoint: d.endpoint ? "[configured]" : null,
        batchSize: d.batchSize,
        flushInterval: d.flushInterval,
        maxQueueSize: d.maxQueueSize
      },
      metrics: this.getMetrics(),
      autoFlushing: this.isAutoFlushing(),
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts: pt,
  getPorts: mt
}, Ae = "2.4.0-P2-ENTERPRISE", De = "components.error-boundary.core.catcher", Ye = Object.freeze({
  CAPTURED: "error:captured"
}), re = z({ moduleId: De }), Et = (e) => re.get(e), bt = (e) => re.inject(e), yt = () => re.snapshot();
let O = null, T = null;
const C = {
  rateLimitWindow: 6e4,
  rateLimitMax: 5,
  dedupeWindow: 6e4
}, w = /* @__PURE__ */ new Map(), I = {
  captured: 0,
  deduplicated: 0,
  rateLimited: 0,
  lastCapturedAt: null
};
function vt(e) {
  const t = Date.now(), r = w.get(e);
  return r ? t - r.firstAt < C.rateLimitWindow ? r.count >= C.rateLimitMax : (w.delete(e), !1) : !1;
}
function wt(e) {
  const t = Date.now(), r = w.get(e) || { count: 0, firstAt: t, lastAt: 0 };
  if (t - r.firstAt >= C.rateLimitWindow ? (r.count = 1, r.firstAt = t) : r.count++, r.lastAt = t, w.set(e, r), w.size > 500) {
    const n = Array.from(w.entries());
    n.sort((s, o) => s[1].lastAt - o[1].lastAt), n[0] && w.delete(n[0][0]);
  }
  return r;
}
function St(e) {
  const t = Et("eventBus");
  if (!(!t || !t.emit))
    try {
      const r = V(e);
      t.emit(Ye.CAPTURED, {
        id: e.id,
        message: r.message,
        code: r.code || null,
        source: r.source || "unknown",
        severity: r.severity || "error",
        category: e.category,
        route: r.route || null,
        panel: r.panel || null,
        fingerprint: e.fingerprint,
        timestamp: Date.now()
      });
    } catch {
    }
}
const S = {
  startGlobalCapture(e = {}) {
    typeof window > "u" || (e.rateLimitWindow && (C.rateLimitWindow = e.rateLimitWindow), e.rateLimitMax && (C.rateLimitMax = e.rateLimitMax), O = (t) => {
      this._handleGlobalError(t, e);
    }, T = (t) => {
      this._handleUnhandledRejection(t, e);
    }, window.addEventListener("error", O), window.addEventListener("unhandledrejection", T), l("error:catcher:started"));
  },
  stopGlobalCapture() {
    typeof window > "u" || (O && (window.removeEventListener("error", O), O = null), T && (window.removeEventListener("unhandledrejection", T), T = null), l("error:catcher:stopped"));
  },
  captureError(e, t = {}) {
    const r = ee(e), n = Ve(e), s = Ge(e);
    if (vt(s)) {
      I.rateLimited++;
      const h = w.get(s);
      return l("error:catcher:rate-limited", { fingerprint: s, count: h ? h.count : 0 }), null;
    }
    const o = wt(s);
    if (o.count > 1)
      return I.deduplicated++, l("error:catcher:duplicate", { fingerprint: s, count: o.count }), null;
    const a = c.addError({
      ...r,
      source: t.source || "manual",
      category: n,
      fingerprint: s,
      metadata: t.metadata || {}
    });
    return I.captured++, I.lastCapturedAt = Date.now(), l("error:catcher:captured", { type: r.name, category: n, fingerprint: s }), St(a), a;
  },
  _handleGlobalError(e, t) {
    const r = e.error || new Error(e.message || "Unknown error");
    r.source = "global", Se(r, t) && this.captureError(r, {
      source: "window.onerror",
      metadata: {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      }
    });
  },
  _handleUnhandledRejection(e, t) {
    const r = e.reason || new Error("Unhandled Promise Rejection"), n = r instanceof Error ? r : new Error(String(r));
    n.source = "promise", Se(n, t) && this.captureError(n, {
      source: "unhandledrejection",
      metadata: { promiseRejection: !0 }
    });
  },
  clearFingerprints() {
    return w.clear(), !0;
  },
  getMetrics() {
    return {
      fingerprintCount: w.size,
      ...I
    };
  },
  resetMetrics() {
    return I.captured = 0, I.deduplicated = 0, I.rateLimited = 0, I.lastCapturedAt = null, !0;
  },
  configure(e = {}) {
    return typeof e.rateLimitWindow == "number" && (C.rateLimitWindow = e.rateLimitWindow), typeof e.rateLimitMax == "number" && (C.rateLimitMax = e.rateLimitMax), { ...C };
  },
  isCapturing() {
    return !!O || !!T;
  },
  healthCheck() {
    const e = re.snapshot(), t = this.getMetrics(), r = {
      capturing: this.isCapturing(),
      lowRateLimitHits: t.captured === 0 || t.rateLimited / t.captured < 0.3,
      fingerprintsNotOverflowing: t.fingerprintCount < 400,
      portsInitialized: e._initialized
    }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length, o = Object.entries(r).filter(([, a]) => !a).map(([a]) => a);
    return {
      status: n === s ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: n,
      maxScore: s,
      scoreDisplay: `${n}/${s}`,
      checks: r,
      issues: o.length > 0 ? o : null,
      portsInitialized: e._initialized,
      metrics: t,
      version: Ae,
      moduleId: De,
      timestamp: Date.now()
    };
  },
  info() {
    const e = re.snapshot();
    return {
      moduleId: De,
      version: Ae,
      capturing: this.isCapturing(),
      portsInitialized: e._initialized,
      config: { ...C },
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  },
  ERROR_EVENTS: Ye,
  injectPorts: bt,
  getPorts: yt
}, _e = "2.5.0-P2-ENTERPRISE", H = "components.error-boundary.core.lifecycle", ne = z({ moduleId: H }), Ke = (e) => ne.get(e), kt = (e) => ne.inject(e), It = () => ne.snapshot(), Ct = () => {
  var e;
  const t = Ke("config");
  return ((e = t == null ? void 0 : t.app) == null ? void 0 : e.debug) || !1;
}, N = (e, ...t) => {
  var r, n;
  const s = Ke("logger");
  if (s) {
    if (e === "error") {
      (r = s.error) == null || r.call(s, `[${H}]`, ...t);
      return;
    }
    if (e === "warn") {
      (n = s.warn) == null || n.call(s, `[${H}]`, ...t);
      return;
    }
    Ct() && s.debug && s.debug(`[${H}]`, ...t);
  }
}, u = {
  initialized: !1,
  initializing: !1,
  initCount: 0,
  lastInitAt: null,
  lastShutdownAt: null,
  lastResetAt: null,
  lastError: null,
  options: {}
}, g = {
  init(e = {}) {
    return u.initialized && !e.force ? (N("warn", "Already initialized, use force:true to reinit"), l("error:lifecycle:already-initialized", { initCount: u.initCount }), Promise.resolve({ success: !0, alreadyInitialized: !0, initCount: u.initCount })) : u.initializing ? (N("warn", "Init already in progress"), Promise.resolve({ success: !1, reason: "initializing" })) : (u.initializing = !0, l("error:lifecycle:init:start"), new Promise((t) => {
      try {
        e.force && u.initialized && this.shutdown(), u.options = { ...e }, c.reset(), S.startGlobalCapture(e), u.initialized = !0, u.initializing = !1, u.initCount++, u.lastInitAt = Date.now(), u.lastError = null, l("error:lifecycle:init:complete", { initCount: u.initCount }), t({ success: !0, initCount: u.initCount });
      } catch (r) {
        u.initializing = !1, u.lastError = r.message, N("error", "Init failed:", r), l("error:lifecycle:init:failed", { error: r.message }), t({ success: !1, error: r.message });
      }
    }));
  },
  shutdown() {
    if (!u.initialized)
      return N("warn", "Not initialized, nothing to shutdown"), { success: !0, wasInitialized: !1 };
    l("error:lifecycle:shutdown:start");
    try {
      return S.stopGlobalCapture(), c.reset(), u.initialized = !1, u.lastShutdownAt = Date.now(), l("error:lifecycle:shutdown:complete"), { success: !0, wasInitialized: !0 };
    } catch (e) {
      return u.lastError = e.message, N("error", "Shutdown failed:", e), l("error:lifecycle:shutdown:failed", { error: e.message }), { success: !1, error: e.message };
    }
  },
  reset() {
    l("error:lifecycle:reset:start");
    try {
      return c.reset(), S.clearFingerprints(), u.lastResetAt = Date.now(), u.lastError = null, l("error:lifecycle:reset:complete"), { success: !0 };
    } catch (e) {
      return u.lastError = e.message, N("error", "Reset failed:", e), l("error:lifecycle:reset:failed", { error: e.message }), { success: !1, error: e.message };
    }
  },
  destroy() {
    return this.shutdown();
  },
  isInitialized() {
    return u.initialized;
  },
  isInitializing() {
    return u.initializing;
  },
  getStatus() {
    return {
      initialized: u.initialized,
      initializing: u.initializing,
      initCount: u.initCount,
      lastInitAt: u.lastInitAt,
      lastShutdownAt: u.lastShutdownAt,
      lastResetAt: u.lastResetAt,
      lastError: u.lastError,
      errorCount: c.getErrorCount(),
      hasError: c.hasError ? c.hasError() : c.getErrorCount() > 0
    };
  },
  getOptions() {
    return { ...u.options };
  },
  healthCheck() {
    const e = ne.snapshot(), t = this.getStatus(), r = {
      initialized: t.initialized,
      noInitError: !t.lastError,
      storeAvailable: !!c,
      catcherAvailable: !!S,
      portsInitialized: e._initialized
    }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length, o = Object.entries(r).filter(([, a]) => !a).map(([a]) => a);
    return {
      status: n === s ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: n,
      maxScore: s,
      scoreDisplay: `${n}/${s}`,
      checks: r,
      issues: o.length > 0 ? o : null,
      initCount: t.initCount,
      version: _e,
      moduleId: H,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = ne.snapshot();
    return {
      moduleId: H,
      version: _e,
      status: this.getStatus(),
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts: kt,
  getPorts: It
}, ze = "3.4.0-P2-ENTERPRISE", Re = "components.error-boundary.ui.fallback", de = z({ moduleId: Re }), At = (e) => de.inject(e), Dt = () => de.snapshot(), _t = {
  warning: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
}, f = {
  containerId: "error-boundary-fallback",
  showStackInProduction: !1,
  stylesInjected: !1
};
let j = !1, ae = null;
function zt() {
  if (f.stylesInjected || typeof document > "u") return;
  const e = "error-boundary-styles";
  if (document.getElementById(e)) {
    f.stylesInjected = !0;
    return;
  }
  const t = document.createElement("link");
  t.id = e, t.rel = "stylesheet", t.href = "/components/error-boundary/styles.css", document.head.appendChild(t), f.stylesInjected = !0;
}
const R = {
  show(e = {}) {
    if (typeof document > "u") return !1;
    if (zt(), e.error && se(e.error) && e.skipIfRecoverable)
      return l("error:fallback:skipped-recoverable"), !1;
    let t = document.getElementById(f.containerId);
    t || (t = this._createContainer());
    const r = e.error ? xe(e.error) : {
      title: e.title || "Application Error",
      message: e.message || "Something went wrong. Please try refreshing the page.",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString(),
      code: e.code || null,
      severity: e.severity || "error",
      route: e.route || null,
      panel: e.panel || null,
      actionable: e.canReload !== !1
    };
    return ae = {
      title: r.title,
      message: r.message,
      timestamp: r.timestamp,
      code: r.code,
      severity: r.severity,
      route: r.route,
      panel: r.panel,
      canReload: e.canReload !== !1,
      canShowDetails: e.canShowDetails !== !1,
      canDismiss: e.canDismiss !== !1
    }, t.innerHTML = this._getTemplate(ae), t.setAttribute("data-visible", "true"), t.style.display = "flex", j = !0, this._attachEventListeners(t), l("error:fallback:shown", {
      severity: r.severity,
      route: r.route,
      panel: r.panel
    }), !0;
  },
  hide() {
    if (typeof document > "u") return !1;
    const e = document.getElementById(f.containerId);
    return e ? (e.setAttribute("data-visible", "false"), e.style.display = "none", j = !1, ae = null, l("error:fallback:hidden"), !0) : !1;
  },
  isVisible() {
    return j;
  },
  _createContainer() {
    const e = document.createElement("div");
    return e.id = f.containerId, e.className = "error-boundary-fallback", e.setAttribute("role", "alertdialog"), e.setAttribute("aria-modal", "true"), e.setAttribute("aria-labelledby", "eb-fallback-title"), e.setAttribute("aria-describedby", "eb-fallback-message"), document.body.appendChild(e), e;
  },
  _getTemplate(e) {
    const t = c.getLastError(), r = t ? JSON.stringify(t, null, 2) : "{}";
    return `<div class="error-fallback-content">
      <div class="error-fallback-icon" aria-hidden="true">${_t.warning}</div>
      <h2 id="eb-fallback-title" class="error-fallback-title">${this._escapeHtml(e.title)}</h2>
      <p id="eb-fallback-message" class="error-fallback-message">${this._escapeHtml(e.message)}</p>
      ${e.code ? `<p class="error-fallback-code">Code: ${this._escapeHtml(e.code)}</p>` : ""}
      ${e.route ? `<p class="error-fallback-route">Route: ${this._escapeHtml(e.route)}</p>` : ""}
      ${e.panel ? `<p class="error-fallback-panel">Panel: ${this._escapeHtml(e.panel)}</p>` : ""}
      <p class="error-fallback-timestamp">${e.timestamp}</p>
      <div class="error-fallback-actions">
        ${e.canReload ? '<button class="error-fallback-btn primary" data-action="reload">Recarregar Página</button>' : ""}
        ${e.canShowDetails ? '<button class="error-fallback-btn secondary" data-action="details">Ver Detalhes</button>' : ""}
        ${e.canDismiss ? '<button class="error-fallback-btn tertiary" data-action="dismiss">Continuar</button>' : ""}
      </div>
      <div class="error-fallback-details" data-expanded="false">
        <pre>${this._escapeHtml(r)}</pre>
      </div>
    </div>`;
  },
  _escapeHtml(e) {
    if (!e) return "";
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML;
  },
  _attachEventListeners(e) {
    const t = this, r = (n) => {
      const s = n.target.dataset ? n.target.dataset.action : null;
      if (s)
        if (s === "reload")
          l("error:fallback:action:reload"), window.location.reload();
        else if (s === "details") {
          const o = e.querySelector(".error-fallback-details");
          if (o) {
            const a = o.getAttribute("data-expanded") === "true";
            o.setAttribute("data-expanded", String(!a)), l("error:fallback:action:details", { shown: !a });
          }
        } else s === "dismiss" && (t.hide(), c.setFatalError(!1), l("error:fallback:action:dismiss"));
    };
    e.onclick = r;
  },
  configure(e = {}) {
    return e.containerId && (f.containerId = e.containerId), typeof e.showStackInProduction == "boolean" && (f.showStackInProduction = e.showStackInProduction), {
      containerId: f.containerId,
      showStackInProduction: f.showStackInProduction,
      stylesInjected: f.stylesInjected
    };
  },
  healthCheck() {
    const e = de.snapshot(), t = {
      documentAvailable: typeof document < "u",
      stylesInjected: f.stylesInjected,
      notVisible: !j,
      portsInitialized: e._initialized
    }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length, s = Object.entries(t).filter(([, o]) => !o).map(([o]) => o);
    return {
      status: r === n ? "HEALTHY" : "DEGRADED",
      score: r,
      maxScore: n,
      scoreDisplay: `${r}/${n}`,
      checks: t,
      issues: s.length > 0 ? s : null,
      visible: j,
      version: ze,
      moduleId: Re,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = de.snapshot();
    return {
      moduleId: Re,
      version: ze,
      visible: j,
      currentContext: ae,
      config: {
        containerId: f.containerId,
        showStackInProduction: f.showStackInProduction,
        stylesInjected: f.stylesInjected
      },
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts: At,
  getPorts: Dt
}, U = "3.4.0-P2-ENTERPRISE", Z = "components.error-boundary", Rt = "3.4.0-P2-ENTERPRISE", Qe = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
  FATAL: "fatal"
}), W = z({ moduleId: Z }), $t = () => W.init(), F = (e) => W.get(e), Lt = (e) => W.inject(e), Pt = () => W.snapshot();
let Y = [], K = [], be = !1;
const Ot = () => {
  const e = F("globalState");
  if (!e) return !1;
  if (K.length > 0) return !0;
  try {
    const t = e.subscribe((r) => {
      E.setDebugMode(r), l("error:global-state:debug-mode", { debugMode: r });
    }, "flags.debugMode");
    return typeof t == "function" && K.push(t), l("error:global-state:connected"), !0;
  } catch (t) {
    return l("error:global-state:connection-failed", { error: t.message }), !1;
  }
}, Ne = () => {
  K.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), K = [];
}, Tt = () => {
  if (!F("eventBus")) return !1;
  if (Y.length > 0) return !0;
  try {
    const t = c.subscribe(({ action: r, error: n, newValue: s }) => {
      const o = F("eventBus");
      if (o != null && o.emit)
        if (r === "error-added") {
          const a = V(s || n);
          o.emit(ce.CAPTURED, {
            id: (s == null ? void 0 : s.id) || he(),
            message: a.message,
            code: a.code || null,
            source: a.source || "unknown",
            severity: a.severity || "error",
            route: a.route || null,
            panel: a.panel || null,
            timestamp: Date.now()
          });
        } else r === "error-updated" && (s != null && s.recovered) && o.emit(ce.RECOVER, {
          errorId: s.id,
          timestamp: Date.now()
        });
    });
    return typeof t == "function" && Y.push(t), l("error:orchestrator:connected"), !0;
  } catch (t) {
    return l("error:orchestrator:connection-failed", { error: t.message }), !1;
  }
}, je = () => {
  Y.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), Y = [];
}, B = {
  version: U,
  name: Z,
  EVENTS: ce,
  LEVELS: Qe,
  init: (e = {}) => ($t(), l("error:api:init:called"), g.init(e).then((t) => ((!t.alreadyInitialized || e.force) && (Ne(), je(), Ot(), Tt(), be = !0), t))),
  shutdown: () => (l("error:api:shutdown:called"), Ne(), je(), be = !1, g.shutdown()),
  reset: () => (l("error:api:reset:called"), g.reset()),
  catch: (e, t = {}) => E.catch(e, t),
  recover: (e) => E.recover(e),
  retry: (e, t, r) => E.retry(e, t, r),
  wrap: (e, t = {}) => E.wrap(e, t),
  wrapAsync: (e, t = {}) => E.wrapAsync(e, t),
  report: (e, t = {}) => _.report(e, t),
  configureReporter: (e) => _.configure(e),
  showFallback: (e) => R.show(e),
  hideFallback: () => R.hide(),
  isFallbackVisible: () => R.isVisible(),
  getErrors: () => c.getErrors(),
  getLastError: () => c.getLastError(),
  clearErrors: () => c.clearErrors(),
  hasError: () => c.hasError(),
  getErrorCount: () => c.getErrorCount(),
  subscribe: (e) => c.subscribe(e),
  status: () => g.getStatus(),
  isInitialized: () => g.isInitialized(),
  getVersion: () => U,
  injectPorts: Lt,
  getPorts: Pt,
  info: () => {
    const e = W.snapshot(), t = {};
    try {
      t.store = c.info();
    } catch {
      t.store = { error: "unavailable" };
    }
    try {
      t.handler = E.info();
    } catch {
      t.handler = { error: "unavailable" };
    }
    try {
      t.catcher = S.info();
    } catch {
      t.catcher = { error: "unavailable" };
    }
    try {
      t.reporter = _.info();
    } catch {
      t.reporter = { error: "unavailable" };
    }
    try {
      t.lifecycle = g.info();
    } catch {
      t.lifecycle = { error: "unavailable" };
    }
    try {
      t.fallback = R.info();
    } catch {
      t.fallback = { error: "unavailable" };
    }
    try {
      t.helpers = le.info();
    } catch {
      t.helpers = { error: "unavailable" };
    }
    const r = c.getLastError();
    return {
      name: Z,
      version: U,
      portsInitialized: e._initialized,
      versions: {
        main: U,
        store: ye,
        handler: ke,
        catcher: Ae,
        reporter: Ie,
        lifecycle: _e,
        fallback: ze,
        telemetry: Ue,
        helpers: q,
        events: Rt
      },
      status: g.getStatus(),
      integrations: {
        globalState: {
          available: !!F("globalState"),
          connected: K.length > 0
        },
        eventBus: {
          available: !!F("eventBus"),
          forwarding: Y.length > 0
        },
        telemetry: {
          available: !!F("telemetry"),
          metrics: we()
        }
      },
      errors: {
        count: c.getErrorCount(),
        hasError: c.hasError(),
        lastError: r ? { id: r.id, message: r.message } : null
      },
      submodules: t,
      healthCheck: B.healthCheck(),
      timestamp: Date.now()
    };
  },
  healthCheck: () => {
    var e, t, r, n, s, o, a;
    const h = W.snapshot(), b = {
      store: ((e = c.healthCheck) == null ? void 0 : e.call(c)) || { status: "UNKNOWN" },
      handler: ((t = E.healthCheck) == null ? void 0 : t.call(E)) || { status: "UNKNOWN" },
      catcher: ((r = S.healthCheck) == null ? void 0 : r.call(S)) || { status: "UNKNOWN" },
      reporter: ((n = _.healthCheck) == null ? void 0 : n.call(_)) || { status: "UNKNOWN" },
      lifecycle: ((s = g.healthCheck) == null ? void 0 : s.call(g)) || { status: "UNKNOWN" },
      fallback: ((o = R.healthCheck) == null ? void 0 : o.call(R)) || { status: "UNKNOWN" },
      telemetry: (Oe == null ? void 0 : Oe()) || { status: "UNKNOWN" },
      helpers: ((a = le.healthCheck) == null ? void 0 : a.call(le)) || { status: "UNKNOWN" }
    }, A = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2, UNKNOWN: 3 }, Q = Object.values(b).map((k) => k.status || "UNKNOWN"), oe = Q.reduce(
      (k, L) => A[L] > A[k] ? L : k,
      "HEALTHY"
    );
    let D = 0, fe = 0, $e = 0;
    Q.forEach((k) => {
      k === "HEALTHY" ? D++ : k === "DEGRADED" ? fe++ : $e++;
    });
    const pe = [];
    for (const [k, L] of Object.entries(b))
      L.status !== "HEALTHY" && L.issues && pe.push(`${k}: ${L.issues.join(", ")}`);
    const me = {
      initialized: g.isInitialized(),
      storeAvailable: !!c,
      handlerAvailable: !!E,
      reporterAvailable: !!_,
      lifecycleAvailable: !!g,
      catcherAvailable: !!S,
      globalStateConnected: K.length > 0,
      orchestratorConnected: Y.length > 0,
      noActiveErrors: !c.hasError(),
      portsInitialized: h._initialized
    }, Le = Object.values(me).filter(Boolean).length, Pe = Object.keys(me).length;
    return {
      status: oe,
      score: D,
      maxScore: Object.keys(b).length,
      scoreDisplay: `${D}/${Object.keys(b).length}`,
      summary: { healthy: D, degraded: fe, unhealthy: $e },
      checks: me,
      checksScore: Le,
      checksMax: Pe,
      checksDisplay: `${Le}/${Pe}`,
      portsInitialized: h._initialized,
      submodules: b,
      issues: pe.length > 0 ? pe : null,
      errorCount: c.getErrorCount(),
      integrationsSetup: be,
      version: U,
      moduleId: Z,
      timestamp: Date.now()
    };
  },
  utils: { formatError: V, createErrorId: he, isRecoverable: se, sanitizeError: ee },
  debug: {
    getEventLog: Be,
    getRecentEvents: it,
    getStore: () => c.toJSON(),
    getMetrics: () => {
      var e;
      return {
        store: ((e = c.getMetrics) == null ? void 0 : e.call(c)) || null,
        handler: E.getMetrics(),
        catcher: S.getMetrics(),
        reporter: _.getMetrics(),
        telemetry: we()
      };
    }
  }
};
function Mt() {
  return B.healthCheck();
}
function Ht() {
  return B.info();
}
typeof window < "u" && (qe() ? Je("MODULE_STRICT_BLOCK", { module: Z }) : (window.ErrorBoundary = B, l("error:global:exposed")), window.__dev = window.__dev || {}, window.__dev.errorBoundary = {
  getVersion: () => U,
  info: () => B.info(),
  healthCheck: () => B.healthCheck(),
  getEventLog: Be,
  getStore: () => c.toJSON(),
  store: c,
  handler: E,
  catcher: S,
  reporter: _,
  lifecycle: g,
  fallback: R,
  helpers: le,
  EVENTS: ce,
  LEVELS: Qe
});
export {
  xt as ERROR_EVENTS,
  Qe as ERROR_LEVELS,
  B as ErrorBoundary,
  S as ErrorCatcher,
  E as ErrorHandler,
  g as ErrorLifecycle,
  _ as ErrorReporter,
  R as FallbackUI,
  Z as MODULE_ID,
  U as VERSION,
  B as default,
  c as errorStore,
  Pt as getPorts,
  Mt as healthCheck,
  Ht as info,
  Lt as injectPorts
};
