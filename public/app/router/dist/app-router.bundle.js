import { createUiPorts as te, createCorePorts as G, createPanelPorts as Ci } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS as x } from "/app/events/index.js";
import { AUTH_EVENTS as br, ROUTER_EVENTS as Ar } from "/app/events/index.js";
import { ROUTER_EVENTS as Me } from "/core/runtime/events/catalog/router.events.js";
import { PERMISSIONS_EVENTS as at } from "/core/runtime/events/catalog/permissions.events.js";
import { AUTH_EVENTS as E, AUTH_INTENTS as Rt } from "/core/runtime/events/catalog/auth.events.js";
const ki = "app.router.ports", $e = te({ moduleId: ki });
let Te = null;
function Ni() {
  $e.init(), typeof window < "u" && !Te && (Te = { location: window.location, history: window.history, addEventListener: window.addEventListener.bind(window) });
}
function Li(e) {
  $e.inject(e), e && e.runtime && (Te = e.runtime);
}
function D(e) {
  return e === "runtime" ? Te : $e.get(e);
}
function Mi() {
  const e = $e.snapshot();
  return e.runtime = Te, e;
}
function _t() {
  return $e.isInitialized();
}
function Ti() {
  const e = D("config");
  return !!(e && e.app && e.app.debug);
}
function P(e, ...t) {
  const i = D("logger");
  if (!i) return;
  const a = "[router-global]";
  if (e === "error") {
    i.error && i.error(...[a].concat(t));
    return;
  }
  if (e === "warn") {
    i.warn && i.warn(...[a].concat(t));
    return;
  }
  if (e === "info") {
    i.info && i.info(...[a].concat(t));
    return;
  }
  Ti() && i.debug && i.debug(...[a].concat(t));
}
const N = {
  state: "CLOSED",
  failures: 0,
  threshold: 5,
  resetTimeout: 3e4,
  lastFailure: null,
  recentPaths: [],
  maxRecentPaths: 10,
  loopThreshold: 3,
  loopTimeWindow: 2e3,
  recordFailure(e, t) {
    if (this.failures++, this.lastFailure = Date.now(), t && t.circuitBreakerTrips++, this.failures >= this.threshold) {
      this.state = "OPEN", P("error", "Circuit breaker OPEN - too many failures", { failures: this.failures });
      const i = this;
      setTimeout(() => {
        i.halfOpen();
      }, this.resetTimeout);
    }
  },
  recordSuccess() {
    this.state === "HALF_OPEN" && (this.state = "CLOSED", this.failures = 0, P("info", "Circuit breaker CLOSED - recovered"));
  },
  halfOpen() {
    this.state === "OPEN" && (this.state = "HALF_OPEN", P("info", "Circuit breaker HALF_OPEN - testing"));
  },
  isOpen() {
    return this.state === "OPEN";
  },
  canNavigate(e, t) {
    return this.isOpen() ? (P("warn", "Navigation blocked - circuit breaker OPEN"), !1) : this.detectLoop(e, t) ? (P("warn", "Navigation blocked - loop detected", { path: e }), !1) : !0;
  },
  detectLoop(e, t) {
    const i = Date.now(), a = this;
    this.recentPaths = this.recentPaths.filter((r) => i - r.timestamp < a.loopTimeWindow);
    const s = this.recentPaths.filter((r) => r.path === e).length;
    return this.recentPaths.push({ path: e, timestamp: i }), this.recentPaths.length > this.maxRecentPaths && this.recentPaths.shift(), s >= this.loopThreshold ? (t && t.loopsDetected++, !0) : !1;
  },
  reset() {
    this.state = "CLOSED", this.failures = 0, this.lastFailure = null, this.recentPaths = [];
  },
  getStatus() {
    return { state: this.state, failures: this.failures, threshold: this.threshold, lastFailure: this.lastFailure, recentPathsCount: this.recentPaths.length };
  },
  destroy() {
    this.reset();
  }
}, Ft = {
  maxRetries: 3,
  baseDelay: 300,
  maxDelay: 5e3,
  withRetry(e, t, i) {
    t || (t = "operation");
    const a = this;
    let s = null, r = 1;
    function o() {
      return Promise.resolve().then(() => e()).then((n) => (r > 1 && (P("info", `${t} succeeded on attempt ${r}`), i && i.retriesSucceeded++), { success: !0, result: n, attempts: r })).catch((n) => {
        if (s = n, i && i.retriesAttempted++, r < a.maxRetries) {
          const p = Math.min(a.baseDelay * Math.pow(2, r - 1), a.maxDelay);
          return P("warn", `${t} failed, retry ${r}/${a.maxRetries} in ${p}ms`, { error: n.message }), r++, new Promise((v) => {
            setTimeout(v, p);
          }).then(o);
        }
        return i && i.retriesFailed++, { success: !1, error: s, attempts: a.maxRetries };
      });
    }
    return o();
  },
  getStatus() {
    return { maxRetries: this.maxRetries, baseDelay: this.baseDelay, maxDelay: this.maxDelay };
  }
};
let $ = null;
const y = {
  navigationsTotal: 0,
  navigationsSucceeded: 0,
  navigationsFailed: 0,
  navigationsAborted: 0,
  navigationsBlocked: 0,
  guardBlocks: 0,
  circuitBreakerTrips: 0,
  loopsDetected: 0,
  retriesAttempted: 0,
  retriesSucceeded: 0,
  retriesFailed: 0,
  avgNavigationTime: 0,
  totalNavigationTime: 0,
  lastNavigationTime: null,
  lastNavigationDuration: null,
  lastError: null,
  errorCount: 0
};
function _i() {
  return $ && ($.abort(), y.navigationsAborted++), $ = new AbortController(), $;
}
function Fi() {
  return !!($ && $.signal && $.signal.aborted);
}
function Re() {
  $ = null;
}
function Ui() {
  return !!$;
}
function $i() {
  return $ ? ($.abort(), y.navigationsAborted++, P("info", "Navigation aborted by user"), !0) : !1;
}
function Gi(e) {
  y.totalNavigationTime += e, y.avgNavigationTime = Math.round(y.totalNavigationTime / y.navigationsSucceeded);
}
function Ut(e, t, i) {
  t || (t = {});
  const a = i || { path: e, timestamp: Date.now() };
  return { route: a, path: a.path || e, options: t, timestamp: Date.now() };
}
function Bi() {
  const e = Object.keys(y);
  for (let t = 0; t < e.length; t++) {
    const i = e[t];
    y[i] = typeof y[i] == "number" ? 0 : null;
  }
  P("info", "Metrics reset");
}
function xi() {
  return Object.assign({}, y);
}
const Ge = "components.router.state.store", ct = "2.4.0-P18EC", oe = G({ moduleId: Ge });
function Hi() {
  oe.init();
}
function Vi(e) {
  return oe.get(e);
}
function Kt(e) {
  return oe.inject(e);
}
function zi() {
  return oe.snapshot();
}
const f = {
  initialized: !1,
  currentRoute: null,
  previousRoute: null,
  params: {},
  query: {},
  meta: {},
  isNavigating: !1,
  history: [],
  virtualRoute: null,
  attemptedRoute: null,
  attemptedOptions: null,
  error: null
};
let ne = [];
const Be = { updates: 0, notifications: 0 };
function Nt(e, t) {
  const i = Vi("eventBus");
  i && i.emit && i.emit(e, Object.assign({ source: Ge }, t || {}));
}
function Xt() {
  Be.notifications++;
  const e = Lt();
  for (let t = 0; t < ne.length; t++)
    try {
      ne[t](e);
    } catch {
    }
}
function Lt() {
  return { currentRoute: f.currentRoute, previousRoute: f.previousRoute, params: Object.assign({}, f.params), query: Object.assign({}, f.query), meta: Object.assign({}, f.meta), isNavigating: f.isNavigating, virtualRoute: f.virtualRoute, error: f.error };
}
function Jt(e, t, i, a) {
  return Be.updates++, f.previousRoute = f.currentRoute, f.currentRoute = e, f.params = t || {}, f.query = i || {}, f.meta = a || {}, f.history.push({ route: e, params: t, query: i, timestamp: Date.now() }), f.history.length > 50 && f.history.shift(), Nt(Me.STATE_CHANGED, Lt()), Xt(), { ok: !0 };
}
function ji(e) {
  return Jt(e, e ? e.params : {}, e ? e.query : {}, e ? e.meta : {});
}
function Yi(e) {
  return f.isNavigating = e, Nt(Me.STATE_NAVIGATING, { isNavigating: e }), { ok: !0 };
}
function qi(e) {
  return f.virtualRoute = e, Nt(Me.VIRTUAL_ROUTE_CHANGED, { virtualRoute: e }), { ok: !0 };
}
function Wi() {
  return f.virtualRoute;
}
function Ki(e, t) {
  return f.attemptedRoute = e, f.attemptedOptions = t || null, { ok: !0 };
}
function Xi() {
  return f.attemptedRoute ? { path: f.attemptedRoute, options: f.attemptedOptions } : null;
}
function Ji() {
  return f.attemptedRoute = null, f.attemptedOptions = null, { ok: !0 };
}
function Qi(e) {
  return f.error = e, { ok: !0 };
}
function Zi() {
  return f.error;
}
function ea() {
  return f.error = null, { ok: !0 };
}
function ta() {
  return Object.assign({}, f.params);
}
function ia() {
  return Object.assign({}, f.query);
}
function aa() {
  return Object.assign({}, f.meta);
}
function sa() {
  return f.currentRoute;
}
function ra() {
  return f.previousRoute;
}
function na() {
  return f.history.slice();
}
function oa() {
  return f.isNavigating;
}
function la(e) {
  return typeof e != "function" ? () => {
  } : (ne.push(e), () => {
    const t = ne.indexOf(e);
    t >= 0 && ne.splice(t, 1);
  });
}
function Qt() {
  return f.currentRoute = null, f.previousRoute = null, f.params = {}, f.query = {}, f.meta = {}, f.isNavigating = !1, f.history = [], f.virtualRoute = null, f.attemptedRoute = null, f.attemptedOptions = null, f.error = null, Xt(), { ok: !0 };
}
function ua(e) {
  return f.initialized ? { ok: !0, alreadyInitialized: !0 } : (Hi(), e && e.ports && Kt(e.ports), f.initialized = !0, { ok: !0, version: ct });
}
function ca() {
  return ne = [], Qt(), f.initialized = !1, { ok: !0 };
}
function da() {
  return { status: oe.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: Ge, version: ct, checks: { initialized: { ok: f.initialized, severity: "info" }, hasRoute: { ok: !!f.currentRoute, severity: "info" }, portsInitialized: { ok: oe.isInitialized(), severity: "info" } }, metrics: Be };
}
function fa() {
  return { moduleId: Ge, version: ct, initialized: f.initialized, currentRoute: f.currentRoute, isNavigating: f.isNavigating, historyLength: f.history.length, subscribersCount: ne.length, metrics: Be, portsInitialized: oe.isInitialized() };
}
function pa() {
  return Object.assign({}, Be);
}
function $t(e) {
  return e ? {
    view: e.view || null,
    tab: e.tab || null,
    section: e.section || null,
    entity: e.entity || null,
    id: e.id || null,
    mode: e.mode || "default",
    page: e.page || null,
    sort: e.sort || null,
    filters: e.filters || null,
    panelId: e.panelId || null,
    panelIds: e.panelIds || [],
    params: e.params || {},
    timestamp: Date.now()
  } : null;
}
const q = {
  MODULE_ID: Ge,
  VERSION: ct,
  init: ua,
  cleanup: ca,
  getState: Lt,
  setRoute: Jt,
  setCurrentRoute: ji,
  setNavigating: Yi,
  setVirtualRoute: qi,
  getVirtualRoute: Wi,
  setAttemptedRoute: Ki,
  getAttemptedRoute: Xi,
  clearAttemptedRoute: Ji,
  setError: Qi,
  getError: Zi,
  clearError: ea,
  getParams: ta,
  getQuery: ia,
  getMeta: aa,
  getCurrentRoute: sa,
  getPreviousRoute: ra,
  getHistory: na,
  isNavigating: oa,
  subscribe: la,
  reset: Qt,
  healthCheck: da,
  info: fa,
  getMetrics: pa,
  injectPorts: Kt,
  getPorts: zi
}, wt = "4.3.0-P18EC", Ot = "router.telemetry.tracker", _e = te({ moduleId: Ot });
function ue(e) {
  return _e.get(e);
}
function ga(e) {
  return _e.inject(e);
}
function ma() {
  return _e.snapshot();
}
function ha() {
  return wt;
}
const ya = () => {
  const e = "router-global", t = Object.freeze({
    NAVIGATION_START: "router:navigation:start",
    NAVIGATION_SUCCESS: "router:navigation:success",
    NAVIGATION_ERROR: "router:navigation:error",
    GUARD_BLOCKED: "router:guard:blocked",
    ROUTE_RESOLVED: "router:route:resolved",
    HISTORY_CHANGE: "router:history:change",
    LIFECYCLE_INIT: "router:lifecycle:init",
    LIFECYCLE_READY: "router:lifecycle:ready",
    LIFECYCLE_DESTROY: "router:lifecycle:destroy",
    HEALTH_CHECK: "router:health:check"
  }), i = [], a = 500, s = () => {
    const d = ue("config");
    return d && d.app && d.app.debug ? d.app.debug : !1;
  };
  let r = { totalNavigations: 0, successfulNavigations: 0, failedNavigations: 0, guardBlocks: 0, averageNavigationTime: 0, navigationTimes: [], lastEvent: null, byRoute: {} };
  const o = {
    info(d, l) {
      if (l || (l = {}), !!s())
        try {
          const m = ue("logger");
          m && m.info && (l.component = e, m.info(d, l));
        } catch {
        }
    },
    warn(d, l) {
      if (l || (l = {}), !!s())
        try {
          const m = ue("logger");
          m && m.warn && (l.component = e, m.warn(d, l));
        } catch {
        }
    },
    error(d, l) {
      l || (l = {});
      try {
        const m = ue("logger");
        m && m.error && (l.component = e, m.error(d, l));
      } catch {
      }
    },
    debug(d, l) {
      if (l || (l = {}), !!s())
        try {
          const m = ue("logger");
          m && m.debug && (l.component = e, m.debug(d, l));
        } catch {
        }
    }
  }, n = (d, l) => {
    l || (l = {});
    try {
      const m = Object.assign({ event: d, timestamp: Date.now(), component: e }, l);
      r.lastEvent = m, i.push(m), i.length > a && i.shift(), o.debug(`Event: ${d}`, m);
      try {
        const k = ue("eventBus");
        k && k.emit && k.emit(d, m);
      } catch {
      }
      return m;
    } catch {
      return null;
    }
  }, p = (d, l, m) => {
    m || (m = {}), r.totalNavigations++;
    const k = typeof l == "string" ? l : l ? l.path : null;
    return k && (r.byRoute[k] = (r.byRoute[k] || 0) + 1), n(t.NAVIGATION_START, { from: d && (d.path || d.page) || null, to: k, params: m, navigationId: `nav-${Date.now()}` });
  }, v = (d, l) => {
    try {
      r.successfulNavigations++, r.navigationTimes.push(l), r.navigationTimes.length > 100 && r.navigationTimes.shift();
      let m = 0;
      for (let k = 0; k < r.navigationTimes.length; k++)
        m += r.navigationTimes[k];
      return r.averageNavigationTime = m / r.navigationTimes.length, n(t.NAVIGATION_SUCCESS, { route: d ? d.path || d : null, page: d ? d.page : null, durationMs: l, avgTime: r.averageNavigationTime.toFixed(2) });
    } catch {
      return n(t.NAVIGATION_SUCCESS, { route: d, durationMs: l });
    }
  }, B = (d, l) => (r.failedNavigations++, n(t.NAVIGATION_ERROR, { route: d ? d.path || d : null, error: l ? l.message || String(l) : null, stack: l ? l.stack : null })), A = (d, l) => (r.guardBlocks++, n(t.GUARD_BLOCKED, { route: d ? d.path || d : null, page: d ? d.page : null, reason: l })), ie = (d, l) => n(t.ROUTE_RESOLVED, { path: d, page: l ? l.page : null, matchType: l && l.matchType || "unknown", isPublic: l && l.public || !1, matched: l && l.matched !== void 0 ? l.matched : !0 }), Se = (d, l) => n(t.HISTORY_CHANGE, { action: d, path: l }), Oi = (d, l) => {
    l || (l = {});
    const m = d === "init" ? t.LIFECYCLE_INIT : d === "ready" ? t.LIFECYCLE_READY : d === "destroy" ? t.LIFECYCLE_DESTROY : `router:lifecycle:${d}`;
    return n(m, l);
  }, Di = (d) => n(t.HEALTH_CHECK, { healthy: d.healthy, score: d.score, issues: d.issues ? d.issues.length : 0 }), mt = () => {
    try {
      const d = [], l = Object.entries(r.byRoute);
      l.sort((m, k) => k[1] - m[1]);
      for (let m = 0; m < Math.min(5, l.length); m++)
        d.push({ path: l[m][0], count: l[m][1] });
      return { totalNavigations: r.totalNavigations, successfulNavigations: r.successfulNavigations, failedNavigations: r.failedNavigations, guardBlocks: r.guardBlocks, averageNavigationTime: r.averageNavigationTime, lastEvent: r.lastEvent, successRate: r.totalNavigations > 0 ? `${(r.successfulNavigations / r.totalNavigations * 100).toFixed(2)}%` : "0%", topRoutes: d };
    } catch {
      return Object.assign({}, r, { successRate: "0%", topRoutes: [] });
    }
  };
  return { track: n, trackNavigation: p, trackNavigationSuccess: v, trackNavigationError: B, trackGuardBlock: A, trackRouteResolved: ie, trackHistoryChange: Se, trackLifecycle: Oi, trackHealthCheck: Di, getMetrics: mt, resetMetrics: () => {
    r = { totalNavigations: 0, successfulNavigations: 0, failedNavigations: 0, guardBlocks: 0, averageNavigationTime: 0, navigationTimes: [], lastEvent: null, byRoute: {} };
  }, getEventLog: () => {
    try {
      return i.slice();
    } catch {
      return [];
    }
  }, getRecentEvents: (d) => {
    d || (d = 10);
    try {
      const l = Math.min(Math.max(1, d), i.length);
      return i.slice(-l);
    } catch {
      return [];
    }
  }, clearEventLog: () => (i.length = 0, !0), getTrackerStats: () => ({
    version: wt,
    moduleId: Ot,
    totalEvents: i.length,
    maxSize: a,
    oldestEvent: i[0] ? i[0].timestamp : null,
    newestEvent: i[i.length - 1] ? i[i.length - 1].timestamp : null,
    metrics: mt(),
    portsStatus: { initialized: _e.isInitialized() }
  }), getStatus: () => ({
    version: wt,
    moduleId: Ot,
    eventLogSize: i.length,
    maxLogSize: a,
    debugMode: s(),
    metrics: mt(),
    portsStatus: { initialized: _e.isInitialized() }
  }), logger: o, injectPorts: ga, getPorts: ma, getVersion: ha, TRACKER_EVENTS: t };
}, W = ya(), va = "router.registry.definitions.constants";
G({ moduleId: va });
const c = Object.freeze({ UARPS: "uarps", PERMISSIONS: "permissions", HYBRID: "hybrid", LEGACY: "legacy", PUBLIC: "public" }), ce = Object.freeze({ CAPABILITY_PREFIX: "cap:", ROLE_PREFIX: "role:", LEVEL_PREFIX: "level:" }), u = Object.freeze({ DASHBOARD: "dashboard", CLIENTES: "clientes", FINANCEIRO: "financeiro", COMERCIAL: "comercial", RH: "rh", SUPRIMENTOS: "suprimentos", JURIDICO: "juridico", INTEGRACOES: "integracoes", IMPORTACAO: "importacao", OPERACIONAL: "operacional", ADMIN: "admin", SYSTEM: null }), h = Object.freeze({ DEFAULT: "default", LOGIN_ONLY: "login-only", FULL_SCREEN: "full-screen" }), I = (e, t, i = {}) => ({ id: e, name: t, page: e, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: i.permissions || [], featureFlags: i.featureFlags || [], layout: h.DEFAULT, defaultView: i.panel || e, defaultHash: `#/${e}`, mountMain: !0, domain: i.domain || u.DASHBOARD, virtualDefaults: { view: i.panel || e, tab: null, section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: i.description || t }, aliases: i.aliases || [], tags: ["dashboard", "panel", ...i.tags || []] }), w = (e, t, i, a = {}) => ({ id: `footer-${e}`, name: t.replace(/\s+/g, ""), page: `footer-${e}`, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/footer/${e}`, mountMain: !0, domain: a.domain || u.DASHBOARD, virtualDefaults: { view: i, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: ["footer", e, ...a.tags || []] }), T = (e, t, i, a = {}) => ({ id: e, name: t.replace(/\s+/g, ""), page: e, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/${e}`, mountMain: !0, domain: a.domain || u.DASHBOARD, virtualDefaults: { view: i, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: [e, ...a.tags || []] }), S = (e, t, i = {}) => ({ id: `status-${e}`, name: t.replace(/\s+/g, ""), page: `status-${e}`, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: i.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-status", defaultHash: `#/status-${e}`, mountMain: !0, domain: i.domain || u.OPERACIONAL, virtualDefaults: { view: "panel-status", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: i.description || t }, aliases: [`#/status-${e}`], tags: ["status", "footer", e, ...i.tags || []] }), Ea = Object.freeze({
  "/": { id: "home", name: "Home", page: "geral", title: "DshowDash - Visão Geral", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: [], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-cards", defaultHash: "#/panel-cards", mountMain: !0, domain: u.DASHBOARD, virtualDefaults: { view: "panel-cards", tab: "overview", section: "summary", entity: null, mode: "view" }, seo: { title: "DshowDash - Painéis de Monitoramento", description: "Visão consolidada de jobs, servidores, integrações e KPIs." }, aliases: ["/home", "/dashboard", "#/", "#/home", "#/dashboard"], tags: ["dashboard", "default", "home"] },
  "/geral": { id: "geral", name: "Geral", page: "geral", title: "Dashboard Geral", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: [], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-cards", defaultHash: "#/panel-cards", mountMain: !0, domain: u.DASHBOARD, virtualDefaults: { view: "panel-cards", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: "Dashboard Geral", description: "Visão geral do sistema" }, aliases: [], tags: ["dashboard"] },
  "/panel-cards": I("panel-cards", "Dashboard Principal", { aliases: ["/painel-cards", "#/panel-cards", "#/painel-cards"], tags: ["main", "default"], description: "Dashboard principal com cards de monitoramento" }),
  "/panel-01": I("panel-01", "Painel 01", { aliases: ["#/panel-01"] }),
  "/panel-02": I("panel-02", "Painel 02", { aliases: ["#/panel-02"] }),
  "/panel-03": I("panel-03", "Painel 03", { aliases: ["#/panel-03"] }),
  "/panel-04": I("panel-04", "Painel 04", { aliases: ["#/panel-04"] }),
  "/panel-05": I("panel-05", "Relatórios", { aliases: ["#/panel-05"], tags: ["reports"] }),
  "/panel-06": I("panel-06", "Painel 06", { aliases: ["#/panel-06"] }),
  "/panel-07": I("panel-07", "Painel 07", { aliases: ["#/panel-07"] }),
  "/panel-08": I("panel-08", "Painel 08", { aliases: ["#/panel-08"] }),
  "/panel-09": I("panel-09", "Painel 09", { aliases: ["#/panel-09"] }),
  "/panel-10": I("panel-10", "Painel 10", { aliases: ["#/panel-10"] }),
  "/panel-11": I("panel-11", "Painel 11", { aliases: ["#/panel-11"] }),
  "/panel-12": I("panel-12", "Monitoramento de Jobs", { aliases: ["#/panel-12"], tags: ["monitoring"] }),
  "/panel-13": I("panel-13", "Painel 13", { aliases: ["#/panel-13"] }),
  "/panel-14": I("panel-14", "Painel 14", { aliases: ["#/panel-14"] }),
  "/panel-15": I("panel-15", "Painel 15", { aliases: ["#/panel-15"], permissions: ["level:60"] }),
  "/panel-16": I("panel-16", "Painel 16", { aliases: ["#/panel-16"], permissions: ["level:60"] }),
  "/panel-17": I("panel-17", "Painel 17", { aliases: ["#/panel-17"], permissions: ["level:80"] }),
  "/panel-18": I("panel-18", "Painel 18", { aliases: ["#/panel-18"], permissions: ["level:80"] }),
  "/panel-19": I("panel-19", "Painel 19", { aliases: ["#/panel-19"], permissions: ["level:100"] }),
  "/panel-dashboard": I("panel-dashboard", "Produtos Dashboard", { aliases: ["#/panel-dashboard"], tags: ["products"] }),
  "/panel-health-dashboard": I("panel-health-dashboard", "System Health", { aliases: ["#/panel-health-dashboard"], tags: ["admin", "health"], permissions: ["level:80"] }),
  "/panel-orchestrator": I("panel-orchestrator", "Core Orchestrator", { aliases: ["#/panel-orchestrator"], tags: ["system", "admin"], permissions: ["level:100"] }),
  "/panel-enterprise": I("panel-enterprise", "Enterprise Panel", { aliases: ["#/panel-enterprise"], tags: ["system"], permissions: ["level:100"] }),
  "/analytics": T("analytics", "Analytics", "panel-analytics", { tags: ["analytics", "charts"] }),
  "/charts": T("charts", "Charts", "panel-charts", { tags: ["charts", "visualization"] }),
  "/code": T("code", "Code Editor", "panel-code", { domain: u.OPERACIONAL, tags: ["code", "developer"] }),
  "/folder": T("folder", "Arquivos", "panel-files", { tags: ["folder", "files"] }),
  "/location": T("location", "Localização", "panel-location", { tags: ["location", "map"] }),
  "/database": T("database", "DataHub", "panel-datahub", { domain: u.OPERACIONAL, tags: ["database", "data"] }),
  "/relatorios": T("relatorios", "Relatórios", "panel-05", { tags: ["relatorios", "reports"] }),
  "/api": T("api", "API Status", "panel-footer-api", { domain: u.INTEGRACOES, tags: ["api", "status"] }),
  "/docs": T("docs", "Documentação", "panel-footer-docs", { tags: ["docs", "documentation"] }),
  "/footer/activity": w("activity", "Atividades", "panel-footer-activity", { tags: ["activity", "monitoring"] }),
  "/footer/status": w("status", "Status do Sistema", "panel-footer-status", { tags: ["status", "monitoring"] }),
  "/footer/file": w("file", "Arquivos", "panel-footer-file", { tags: ["file", "files"] }),
  "/footer/registry": w("registry", "Registro", "panel-footer-registry", { tags: ["registry", "clipboard"] }),
  "/footer/cpu": w("cpu", "CPU Monitor", "panel-footer-cpu", { domain: u.OPERACIONAL, tags: ["cpu", "monitoring", "server"] }),
  "/footer/financial": w("financial", "Financeiro", "panel-footer-financial", { domain: u.FINANCEIRO, tags: ["financial", "money"] }),
  "/footer/database": w("database", "Database", "panel-footer-database", { domain: u.OPERACIONAL, tags: ["database", "data"] }),
  "/footer/disk": w("disk", "Disk Monitor", "panel-footer-disk", { domain: u.OPERACIONAL, tags: ["disk", "monitoring", "storage"] }),
  "/footer/globe": w("globe", "Global", "panel-footer-globe", { tags: ["globe", "global"] }),
  "/footer/api": w("api", "API Status", "panel-footer-api", { domain: u.INTEGRACOES, tags: ["api", "status"] }),
  "/footer/shield": w("shield", "Segurança", "panel-footer-shield", { domain: u.ADMIN, tags: ["shield", "security"] }),
  "/footer/memory": w("memory", "Memory Monitor", "panel-footer-memory", { domain: u.OPERACIONAL, tags: ["memory", "monitoring", "ram"] }),
  "/footer/server": w("server", "Server Status", "panel-footer-server", { domain: u.OPERACIONAL, tags: ["server", "monitoring"] }),
  "/footer/docs": w("docs", "Documentação", "panel-footer-docs", { tags: ["docs", "documentation"] }),
  "/footer/settings": w("settings", "Configurações", "panel-footer-settings", { domain: u.ADMIN, tags: ["settings", "config"] }),
  "/footer/support": w("support", "Suporte", "panel-footer-support", { tags: ["support", "help"] }),
  "/footer/wifi": w("wifi", "WiFi Status", "panel-footer-wifi", { domain: u.OPERACIONAL, tags: ["wifi", "monitoring", "network"] }),
  "/status-activity": S("activity", "Atividade do Sistema", { tags: ["activity", "monitoring"] }),
  "/status-bookmark": S("bookmark", "Favoritos", { tags: ["bookmark", "favorites"] }),
  "/status-calendar": S("calendar", "Agenda", { tags: ["calendar", "schedule"] }),
  "/status-clipboard": S("clipboard", "Logs do Sistema", { tags: ["clipboard", "logs"] }),
  "/status-cloud": S("cloud", "Status Cloud", { tags: ["cloud", "storage"] }),
  "/status-cpu": S("cpu", "CPU Monitor", { domain: u.OPERACIONAL, tags: ["cpu", "monitoring"] }),
  "/status-credit-card": S("credit-card", "Pagamentos", { domain: u.FINANCEIRO, tags: ["credit-card", "payments"] }),
  "/status-database": S("database", "Status Database", { domain: u.OPERACIONAL, tags: ["database", "data"] }),
  "/status-disk": S("disk", "Disco", { domain: u.OPERACIONAL, tags: ["disk", "storage"] }),
  "/status-folder": S("folder", "Arquivos", { tags: ["folder", "files"] }),
  "/status-globe": S("globe", "Status Web", { tags: ["globe", "web"] }),
  "/status-hard-drive": S("hard-drive", "Storage", { domain: u.OPERACIONAL, tags: ["hard-drive", "storage"] }),
  "/status-language": S("language", "Idioma", { tags: ["language", "i18n"] }),
  "/status-link": S("link", "Links", { tags: ["link", "connections"] }),
  "/status-mail": S("mail", "E-mail", { tags: ["mail", "email"] }),
  "/status-memory": S("memory", "Memória", { domain: u.OPERACIONAL, tags: ["memory", "ram"] }),
  "/status-monitor": S("monitor", "Monitor", { tags: ["monitor", "display"] }),
  "/status-pie-chart": S("pie-chart", "Métricas", { tags: ["pie-chart", "metrics"] }),
  "/status-server": S("server", "Status Servidor", { domain: u.OPERACIONAL, tags: ["server", "monitoring"] }),
  "/status-target": S("target", "Metas", { tags: ["target", "goals"] }),
  "/status-trending": S("trending", "Performance", { tags: ["trending", "performance"] }),
  "/status-wifi": S("wifi", "Rede", { domain: u.OPERACIONAL, tags: ["wifi", "network"] }),
  "/status-zap": S("zap", "Integrações", { domain: u.INTEGRACOES, tags: ["zap", "integrations"] }),
  "/meu-perfil": T("meu-perfil", "Meu Perfil", "panel-profile", { tags: ["profile", "user"], aliases: ["#/meu-perfil"] }),
  "/preferencias": T("preferencias", "Preferências", "panel-preferences", { tags: ["preferences", "settings"], aliases: ["#/preferencias"] }),
  "/seguranca": T("seguranca", "Segurança", "panel-security", { tags: ["security", "user"], aliases: ["#/seguranca"] }),
  "/sessoes": T("sessoes", "Sessões", "panel-sessions", { tags: ["sessions", "user"], aliases: ["#/sessoes"] }),
  "/termos": { id: "termos", name: "Termos", page: "termos", title: "Termos de Uso", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-termos", defaultHash: "#/termos", mountMain: !0, domain: u.SYSTEM, virtualDefaults: { view: "panel-termos", tab: null, section: null, entity: null, mode: "view" }, seo: { title: "DshowDash - Termos de Uso", description: "Termos de uso da plataforma DshowDash" }, aliases: ["#/termos"], tags: ["termos", "legal", "public"] }
}), ba = Object.freeze({
  "/clientes": { id: "clientes", name: "Clientes", page: "clientes", title: "Gestão de Clientes", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:clientes:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-02", defaultHash: "#/panel-02", mountMain: !0, domain: u.CLIENTES, virtualDefaults: { view: "panel-02", tab: "list", section: null, entity: "cliente", mode: "view" }, seo: { title: "Clientes", description: "Gerenciamento de clientes" }, aliases: [], tags: ["clientes", "crm"] },
  "/colaboradores": { id: "colaboradores", name: "Colaboradores", page: "colaboradores", title: "Colaboradores", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:colaboradores:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-09", defaultHash: "#/panel-09", mountMain: !0, domain: u.RH, virtualDefaults: { view: "panel-09", tab: "list", section: null, entity: "colaborador", mode: "view" }, seo: { title: "Colaboradores", description: "Gestão de colaboradores" }, aliases: [], tags: ["colaboradores", "rh"] },
  "/comercial": { id: "comercial", name: "Comercial", page: "comercial", title: "Comercial", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:comercial:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-10", defaultHash: "#/panel-10", mountMain: !0, domain: u.COMERCIAL, virtualDefaults: { view: "panel-10", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: "Comercial", description: "Dados comerciais e vendas" }, aliases: [], tags: ["comercial", "vendas"] },
  "/compras": { id: "compras", name: "Compras", page: "compras", title: "Compras", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:compras:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-11", defaultHash: "#/panel-11", mountMain: !0, domain: u.SUPRIMENTOS, virtualDefaults: { view: "panel-11", tab: "list", section: null, entity: "compra", mode: "view" }, seo: { title: "Compras", description: "Gestão de compras" }, aliases: [], tags: ["compras", "suprimentos"] },
  "/contratos": { id: "contratos", name: "Contratos", page: "contratos", title: "Contratos", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:contratos:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-13", defaultHash: "#/panel-13", mountMain: !0, domain: u.JURIDICO, virtualDefaults: { view: "panel-13", tab: "list", section: null, entity: "contrato", mode: "view" }, seo: { title: "Contratos", description: "Gestão de contratos" }, aliases: [], tags: ["contratos", "juridico"] },
  "/financeiro": { id: "financeiro", name: "Financeiro", page: "financeiro", title: "Painel Financeiro", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:financeiro:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-03", defaultHash: "#/panel-03", mountMain: !0, domain: u.FINANCEIRO, virtualDefaults: { view: "panel-03", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: "Financeiro", description: "Dados financeiros e relatórios" }, aliases: [], tags: ["financeiro", "reports"] },
  "/fornecedores": { id: "fornecedores", name: "Fornecedores", page: "fornecedores", title: "Fornecedores", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:fornecedores:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-14", defaultHash: "#/panel-14", mountMain: !0, domain: u.SUPRIMENTOS, virtualDefaults: { view: "panel-14", tab: "list", section: null, entity: "fornecedor", mode: "view" }, seo: { title: "Fornecedores", description: "Gestão de fornecedores" }, aliases: [], tags: ["fornecedores", "suprimentos"] },
  "/importacao": { id: "importacao", name: "Importacao", page: "importacao", title: "Importação", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:importacao:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-17", defaultHash: "#/panel-17", mountMain: !0, domain: u.IMPORTACAO, virtualDefaults: { view: "panel-17", tab: "list", section: null, entity: "importacao", mode: "view" }, seo: { title: "Importação", description: "Processos de importação" }, aliases: [], tags: ["importacao", "comercio-exterior"] },
  "/operacional": { id: "operacional", name: "Operacional", page: "operacional", title: "Operacional", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:operacional:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-05", defaultHash: "#/panel-05", mountMain: !0, domain: u.OPERACIONAL, virtualDefaults: { view: "panel-05", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: "Operacional", description: "Dados operacionais" }, aliases: [], tags: ["operacional"] },
  "/orcamento-clientes": { id: "orcamento-clientes", name: "OrcamentoClientes", page: "orcamento-clientes", title: "Orçamento de Clientes", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:orcamento:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-19", defaultHash: "#/panel-19", mountMain: !0, domain: u.COMERCIAL, virtualDefaults: { view: "panel-19", tab: "list", section: null, entity: "orcamento", mode: "view" }, seo: { title: "Orçamentos", description: "Orçamentos de clientes" }, aliases: [], tags: ["orcamento", "comercial"] },
  "/produtos": { id: "produtos", name: "Produtos", page: "produtos", title: "Produtos", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:produtos:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-04", defaultHash: "#/panel-04", mountMain: !0, domain: u.COMERCIAL, virtualDefaults: { view: "panel-04", tab: "list", section: null, entity: "produto", mode: "view" }, seo: { title: "Produtos", description: "Catálogo de produtos" }, aliases: [], tags: ["produtos", "catalogo"] },
  "/rh-pessoas": { id: "rh-pessoas", name: "RHPessoas", page: "rh-pessoas", title: "RH - Pessoas", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:rh:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-09", defaultHash: "#/panel-09", mountMain: !0, domain: u.RH, virtualDefaults: { view: "panel-09", tab: "list", section: null, entity: "pessoa", mode: "view" }, seo: { title: "RH Pessoas", description: "Gestão de pessoas" }, aliases: [], tags: ["rh", "pessoas"] },
  "/servidores": { id: "servidores", name: "Servidores", page: "servidores", title: "Servidores", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["cap:servidores:view"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-06", defaultHash: "#/panel-06", mountMain: !0, domain: u.OPERACIONAL, virtualDefaults: { view: "panel-06", tab: "list", section: null, entity: "servidor", mode: "view" }, seo: { title: "Servidores", description: "Monitoramento de servidores" }, aliases: [], tags: ["servidores", "infra"] }
}), O = (e, t, i, a = {}) => ({ id: e, name: t.replace(/\s+/g, ""), page: e, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/${e}`, mountMain: !0, domain: u.INTEGRACOES, virtualDefaults: { view: i, tab: a.tab || "overview", section: null, entity: a.entity || null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: ["integracoes", ...a.tags || []] }), Aa = Object.freeze({
  "/automacoes": O("automacoes", "Automações", "panel-07", { permissions: ["cap:automacoes:view"], entity: "automacao", tab: "list", tags: ["automacoes"] }),
  "/bling": O("bling", "Bling ERP", "panel-08", { permissions: ["cap:bling:view"], tags: ["bling", "erp"] }),
  "/google-ads": O("google-ads", "Google Ads", "panel-15", { permissions: ["cap:google-ads:view"], tags: ["google-ads", "marketing"] }),
  "/google-drive": O("google-drive", "Google Drive", "panel-16", { permissions: ["cap:google-drive:view"], entity: "file", tab: "files", tags: ["google-drive", "storage"] }),
  "/instagram": O("instagram", "Instagram", "panel-18", { permissions: ["cap:instagram:view"], tab: "feed", tags: ["instagram", "social"] }),
  "/pipedrive": O("pipedrive", "Pipedrive CRM", "panel-12", { permissions: ["cap:pipedrive:view"], entity: "deal", tab: "deals", tags: ["pipedrive", "crm"] }),
  "/integrations/adwords": O("integration-adwords", "Google Ads", "panel-integration-adwords", { tags: ["adwords", "google", "marketing"] }),
  "/integrations/alfinete": O("integration-alfinete", "Alfinete", "panel-integration-alfinete", { tags: ["alfinete"] }),
  "/integrations/asaas": O("integration-asaas", "Asaas", "panel-integration-asaas", { tags: ["asaas", "payments"] }),
  "/integrations/bling": O("integration-bling", "Bling ERP", "panel-integration-bling", { tags: ["bling", "erp"] }),
  "/integrations/calendar": O("integration-calendar", "Calendário", "panel-integration-calendar", { tags: ["calendar", "google"] }),
  "/integrations/chatgpt": O("integration-chatgpt", "ChatGPT", "panel-integration-chatgpt", { tags: ["chatgpt", "ai"] }),
  "/integrations/google-drive": O("integration-google-drive", "Google Drive", "panel-integration-google-drive", { tags: ["google-drive", "storage"] }),
  "/integrations/loja-integrada": O("integration-loja-integrada", "Loja Integrada", "panel-integration-loja-integrada", { tags: ["loja-integrada", "ecommerce"] }),
  "/integrations/mercado-livre": O("integration-mercado-livre", "Mercado Livre", "panel-integration-mercado-livre", { tags: ["mercado-livre", "marketplace"] }),
  "/integrations/pipedrive": O("integration-pipedrive", "Pipedrive CRM", "panel-integration-pipedrive", { tags: ["pipedrive", "crm"] })
}), je = (e, t, i, a = {}) => ({ id: e, name: t.replace(/\s+/g, ""), page: e, title: t, public: !1, requiresAuth: !0, guardPolicy: a.guardPolicy || c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/${e}`, panel: i, mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: i, tab: a.tab || "overview", section: null, entity: a.entity || null, mode: a.mode || "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: ["admin", ...a.tags || []] }), Ye = (e, t, i, a = {}) => ({ id: e, name: t.replace(/\s+/g, ""), page: e, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/${e}`, panel: i, mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: i, tab: a.tab || "overview", section: null, entity: a.entity || null, mode: a.mode || "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: ["user", ...a.tags || []] }), Ia = Object.freeze({
  "/admin/usuarios": { id: "admin-usuarios", name: "AdminUsuarios", page: "admin-usuarios", title: "Gestão de Usuários", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:admin", "role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-user-management", defaultHash: "#/panel-user-management", panel: "panel-user-management", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-user-management", tab: "list", section: null, entity: "user", mode: "view" }, seo: { title: "Gestão de Usuários", description: "Gerenciamento de usuários do sistema" }, aliases: ["/admin/users", "/usuarios", "/user-management"], tags: ["admin", "users", "enterprise"] },
  "/admin/permissoes": { id: "admin-permissoes", name: "AdminPermissoes", page: "admin-permissoes", title: "Roles e Permissões", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-permissions-admin", defaultHash: "#/panel-permissions-admin", panel: "panel-permissions-admin", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-permissions-admin", tab: "roles", section: null, entity: "role", mode: "view" }, seo: { title: "Roles e Permissões", description: "Administração de roles e permissões" }, aliases: ["/admin/permissions", "/admin/roles", "/permissions-admin"], tags: ["admin", "permissions", "enterprise", "security"] },
  "/admin/sessoes": { id: "admin-sessoes", name: "AdminSessoes", page: "admin-sessoes", title: "Gerenciamento de Sessões", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:manager", "role:admin", "role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-session-admin", defaultHash: "#/panel-session-admin", panel: "panel-session-admin", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-session-admin", tab: "active", section: null, entity: "session", mode: "view" }, seo: { title: "Sessões", description: "Visualização e gerenciamento de sessões ativas" }, aliases: ["/admin/sessions", "/session-admin"], tags: ["admin", "sessions", "enterprise", "security"] },
  "/admin/feature-flags": { id: "admin-feature-flags", name: "AdminFeatureFlags", page: "admin-feature-flags", title: "Feature Flags", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:admin", "role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-feature-flags-admin", defaultHash: "#/panel-feature-flags-admin", panel: "panel-feature-flags-admin", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-feature-flags-admin", tab: "list", section: null, entity: "flag", mode: "view" }, seo: { title: "Feature Flags", description: "Gerenciamento de feature flags do sistema" }, aliases: ["/admin/flags", "/feature-flags"], tags: ["admin", "feature-flags", "enterprise", "devops"] },
  "/admin/auditoria": { id: "admin-auditoria", name: "AdminAuditoria", page: "admin-auditoria", title: "Auditoria e Logs", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:manager", "role:admin", "role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-audit-trail", defaultHash: "#/panel-audit-trail", panel: "panel-audit-trail", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-audit-trail", tab: "logs", section: null, entity: "audit", mode: "view" }, seo: { title: "Auditoria", description: "Trail de auditoria e logs do sistema" }, aliases: ["/admin/audit", "/auditoria", "/audit-trail"], tags: ["admin", "audit", "enterprise", "security", "logs"] },
  "/admin/navegacao": { id: "admin-navegacao", name: "AdminNavegacao", page: "admin-navegacao", title: "Administração de Navegação", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: ["role:super_admin"], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-nav-admin", defaultHash: "#/panel-nav-admin", panel: "panel-nav-admin", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-nav-admin", tab: "items", section: null, entity: "nav-item", mode: "view" }, seo: { title: "Administração de Navegação", description: "Gerenciamento de itens e seções da sidebar" }, aliases: ["/admin/navigation", "/nav-admin", "/navegacao"], tags: ["admin", "navigation", "sidebar", "enterprise"] },
  "/preferencias": { id: "preferencias", name: "Preferencias", page: "preferencias", title: "Minhas Preferências", public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: [], featureFlags: [], layout: h.DEFAULT, defaultView: "panel-user-preferences", defaultHash: "#/panel-user-preferences", panel: "panel-user-preferences", mountMain: !0, domain: u.ADMIN, virtualDefaults: { view: "panel-user-preferences", tab: "general", section: null, entity: null, mode: "edit" }, seo: { title: "Preferências", description: "Configurações pessoais e preferências" }, aliases: ["/preferences", "/user-preferences", "/minha-conta"], tags: ["user", "preferences", "profile"] },
  "/admin-users": je("admin-users", "Gestão de Usuários", "panel-user-management", { guardPolicy: c.PERMISSIONS, permissions: ["role:admin"], entity: "user", tab: "list", tags: ["users", "enterprise"] }),
  "/admin-settings": je("admin-settings", "Configurações Admin", "panel-nav-admin", { guardPolicy: c.PERMISSIONS, permissions: ["role:admin"], tags: ["settings", "config"] }),
  "/profile": je("profile", "Meu Perfil", "panel-user-preferences", { guardPolicy: c.PERMISSIONS, permissions: [], tab: "profile", mode: "edit", tags: ["profile", "user"] }),
  "/settings": je("settings", "Configurações", "panel-user-preferences", { guardPolicy: c.PERMISSIONS, permissions: [], tab: "settings", mode: "edit", tags: ["settings", "user"] }),
  "/meu-perfil": Ye("meu-perfil", "Meu Perfil", "panel-user-profile", { permissions: [], tab: "profile", mode: "edit", description: "Editar informações do perfil", aliases: ["/my-profile", "/perfil"], tags: ["profile", "account"] }),
  "/seguranca-conta": Ye("seguranca-conta", "Segurança da Conta", "panel-account-security", { permissions: [], tab: "security", mode: "edit", description: "Configurações de segurança e senha", aliases: ["/account-security", "/seguranca"], tags: ["security", "account", "password"] }),
  "/notificacoes": Ye("notificacoes", "Notificações", "panel-user-notifications", { permissions: [], tab: "notifications", mode: "edit", description: "Preferências de notificações", aliases: ["/notifications", "/alertas"], tags: ["notifications", "account"] }),
  "/sessoes-ativas": Ye("sessoes-ativas", "Sessões Ativas", "panel-user-sessions", { permissions: [], tab: "sessions", mode: "view", description: "Gerenciar sessões ativas", aliases: ["/active-sessions", "/minhas-sessoes"], tags: ["sessions", "account", "security"] })
}), F = (e, t, i, a = {}) => ({ id: `status-${e}`, name: t.replace(/\s+/g, ""), page: `status-${e}`, title: t, public: !1, requiresAuth: !0, guardPolicy: c.PERMISSIONS, permissions: a.permissions || [], featureFlags: [], layout: h.DEFAULT, defaultView: i, defaultHash: `#/status/${e}`, mountMain: !0, domain: a.domain || u.DASHBOARD, virtualDefaults: { view: i, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${t}`, description: a.description || t }, aliases: a.aliases || [], tags: ["status", e, ...a.tags || []] }), Pa = Object.freeze({
  "/login": { id: "login", name: "Login", page: "login", title: "Entrar", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.LOGIN_ONLY, defaultView: "login-modal", defaultHash: "", mountMain: !1, domain: u.SYSTEM, virtualDefaults: { view: "login-modal", tab: null, section: null, entity: null, mode: "view" }, seo: { title: "DshowDash - Login", description: "Acesse o painel enterprise da Dshow." }, aliases: ["/signin", "#/login"], tags: ["auth", "public", "system"] },
  "/logout": { id: "logout", name: "Logout", page: "logout", title: "Logout", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: !1, domain: u.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "Logout", description: "Sair do sistema" }, aliases: ["/signout"], tags: ["auth", "public", "system"] },
  "/404": { id: "not-found", name: "NotFound", page: "not-found", title: "Página Não Encontrada", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: !1, domain: u.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "404", description: "Página não encontrada" }, aliases: ["/not-found"], tags: ["error", "public", "system"] },
  "/forbidden": { id: "forbidden", name: "Forbidden", page: "forbidden", title: "Acesso Negado", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: !1, domain: u.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "403", description: "Acesso não autorizado" }, aliases: ["/403"], tags: ["error", "public", "system"] },
  "/maintenance": { id: "maintenance", name: "Maintenance", page: "maintenance", title: "Manutenção", public: !0, requiresAuth: !1, guardPolicy: c.PUBLIC, permissions: [], featureFlags: [], layout: h.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: !1, domain: u.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "Manutenção", description: "Sistema em manutenção" }, aliases: [], tags: ["system", "public"] },
  "/status/currency-btc": F("currency-btc", "Bitcoin", "panel-status-currency-btc", { tags: ["currency", "crypto", "btc"] }),
  "/status/currency-usd-brl": F("currency-usd-brl", "Dólar/Real", "panel-status-currency-usd-brl", { tags: ["currency", "usd", "brl"] }),
  "/status/currency-usd-cny": F("currency-usd-cny", "Dólar/Yuan", "panel-status-currency-usd-cny", { tags: ["currency", "usd", "cny"] }),
  "/status/email": F("email", "Email Integration", "panel-status-email-integration", { domain: u.INTEGRACOES, tags: ["email", "integration"] }),
  "/status/instagram": F("instagram", "Instagram", "panel-status-instagram-messenger", { domain: u.INTEGRACOES, tags: ["instagram", "social"] }),
  "/status/weather": F("weather", "Clima SP", "panel-status-weather-sp", { tags: ["weather", "clima"] }),
  "/status/wechat": F("wechat", "WeChat", "panel-status-wechat-integration", { domain: u.INTEGRACOES, tags: ["wechat", "social"] }),
  "/status/whatsapp": F("whatsapp", "WhatsApp", "panel-status-whatsapp-integration", { domain: u.INTEGRACOES, tags: ["whatsapp", "social"] }),
  "/status/notifications": F("notifications", "Notificações", "panel-footer-status", { tags: ["notifications", "alerts"] }),
  "/status/app": F("app", "App Status", "panel-footer-status", { tags: ["app", "system"] }),
  "/status/errors": F("errors", "Errors Status", "panel-footer-status", { tags: ["errors", "monitoring"] })
}), Sa = "router.registry.definitions.index";
G({ moduleId: Sa });
const Zt = Object.freeze({ ...Ea, ...ba, ...Aa, ...Ia, ...Pa }), Ra = "router.registry.aliases";
G({ moduleId: Ra });
const wa = /* @__PURE__ */ new Map();
(function() {
  try {
    for (const [t, i] of Object.entries(Zt))
      if (i.aliases && Array.isArray(i.aliases))
        for (const a of i.aliases)
          wa.set(a, t);
  } catch {
  }
})();
let ae = Zt || null;
function Mt() {
  return ae ? typeof ae.getAll == "function" ? ae.getAll() : Array.isArray(ae) ? ae : typeof ae == "object" ? Object.entries(ae).map(([e, t]) => ({ path: e, ...t })) : [] : [];
}
function Oa(e) {
  return Mt().find((i) => i.path === e) || null;
}
function Da(e) {
  return Mt().find((i) => i.id === e) || null;
}
function Ca(e) {
  return Da(e) || Oa(e) || null;
}
function ka() {
  return Mt().find((t) => t.path === "/forbidden" || t.path === "/403" || t.id === "forbidden") || null;
}
const Na = "router.registry.validation";
G({ moduleId: Na });
const ei = "router.core.guards.auth-guard", La = "1.5.0-P17WI", Ma = typeof window < "u", Ta = te({ moduleId: ei });
function _a(e) {
  return Ta.get(e);
}
function Gt(e, t, i) {
  i || (i = {});
  const a = _a("logger");
  !a || typeof a[e] != "function" || (i.component = ei, a[e](t, i));
}
function ht() {
  return Ma && (window.AuthAdapter || window.CoreAuthAdapter) || null;
}
let de = { checks: 0, blocks: 0, skippedByPolicy: 0 };
const j = {
  name: "AuthGuard",
  order: 1,
  version: La,
  metrics: de,
  isAuthenticated() {
    const e = ht();
    return e && e.isAuthenticated ? e.isAuthenticated() : !1;
  },
  isReady() {
    const e = ht();
    return e && e.isReady ? e.isReady() : !1;
  },
  check(e, t) {
    t || (t = {}), de.checks++;
    const i = ht(), a = t.policy, s = t.permissionsMode || "allow-all";
    return e && e.public === !0 || a === c.PUBLIC ? (de.skippedByPolicy++, Gt("debug", "[AuthGuard] Skipped - public route"), Promise.resolve({ passed: !0, reason: "public-route", guard: this.name, skipped: !0, policy: a, permissionsMode: s })) : e && e.requiresAuth === !1 ? Promise.resolve({ passed: !0, reason: "no-auth-required", guard: this.name, policy: a, permissionsMode: s }) : (i && i.isAuthenticated ? i.isAuthenticated() : !1) ? Promise.resolve({ passed: !0, reason: "authenticated", guard: this.name, policy: a, permissionsMode: s }) : (de.blocks++, Gt("debug", "[AuthGuard] Blocked - not authenticated", { policy: a, permissionsMode: s }), Promise.resolve({ passed: !1, reason: "not-authenticated", redirect: "/login", guard: this.name, policy: a, permissionsMode: s }));
  },
  resetMetrics() {
    de = { checks: 0, blocks: 0, skippedByPolicy: 0 }, this.metrics = de;
  }
}, ti = "router.core.guards.permission-guard", Fa = "1.5.0-P17WI", Ua = typeof window < "u", $a = te({ moduleId: ti });
function Ga(e) {
  return $a.get(e);
}
function yt(e, t, i) {
  i || (i = {});
  const a = Ga("logger");
  !a || typeof a[e] != "function" || (i.component = ti, a[e](t, i));
}
function Bt() {
  return Ua && window.Permissions || null;
}
let se = { checks: 0, blocks: 0, skippedByPolicy: 0, bypassedByMode: 0 };
const ee = {
  name: "PermissionGuard",
  order: 2,
  version: Fa,
  metrics: se,
  routeTriggerMap: {},
  isAvailable() {
    const e = Bt();
    return e && typeof e.canTrigger == "function";
  },
  check(e, t) {
    t || (t = {}), se.checks++;
    const i = t.policy, a = t.permissionsMode || "allow-all";
    if (a === "allow-all")
      return se.bypassedByMode++, yt("debug", "[PermissionGuard] Bypassed by allow-all mode"), Promise.resolve({ passed: !0, reason: "bypassed-by-mode", guard: this.name, skipped: !0, policy: i, permissionsMode: a });
    if (i && i !== c.UARPS && i !== c.HYBRID)
      return se.skippedByPolicy++, yt("debug", "[PermissionGuard] Skipped by policy", { policy: i }), Promise.resolve({ passed: !0, reason: "skipped-by-policy", guard: this.name, skipped: !0, policy: i, permissionsMode: a });
    const s = e ? e.uarpsTrigger || e.trigger : null;
    if (!s)
      return Promise.resolve({ passed: !0, reason: "no-uarps-trigger", guard: this.name, policy: i, permissionsMode: a });
    const r = Bt();
    return (r && r.canTrigger ? r.canTrigger(s) : !0) ? Promise.resolve({ passed: !0, reason: "uarps-ok", guard: this.name, policy: i, permissionsMode: a }) : (se.blocks++, yt("debug", "[PermissionGuard] Blocked by UARPS", { triggerId: s, policy: i, permissionsMode: a }), Promise.resolve({ passed: !1, reason: "uarps-denied", redirect: "/forbidden", guard: this.name, details: { triggerId: s }, policy: i, permissionsMode: a }));
  },
  resetMetrics() {
    se = { checks: 0, blocks: 0, skippedByPolicy: 0, bypassedByMode: 0 }, this.metrics = se;
  }
}, st = "router.core.guards.legacy-guard", vt = "1.6.0-P25", Ba = typeof window < "u", ii = te({ moduleId: st });
function xa(e) {
  return ii.get(e);
}
function qe(e, t, i) {
  i || (i = {});
  const a = xa("logger");
  !a || typeof a[e] != "function" || (i.component = st, a[e](t, i));
}
function Et() {
  return Ba && (window.AuthAdapter || window.CoreAuthAdapter) || null;
}
let H = { checks: 0, blocks: 0, minLevelUsage: 0, skippedByPolicy: 0, bypassedByMode: 0 };
const Q = {
  name: "LegacyGuard",
  order: 3,
  deprecated: !0,
  version: vt,
  metrics: H,
  getUserLevel() {
    const e = Et();
    return e && e.getLevel ? e.getLevel() : 0;
  },
  check(e, t) {
    t || (t = {}), H.checks++;
    const i = Et(), a = t.policy, s = t.permissionsMode || "allow-all";
    if (s === "allow-all")
      return H.bypassedByMode++, qe("debug", "[LegacyGuard] Bypassed by allow-all mode"), Promise.resolve({ passed: !0, reason: "bypassed-by-mode", guard: this.name, skipped: !0, policy: a, permissionsMode: s });
    if (a && a !== c.LEGACY && a !== c.HYBRID)
      return H.skippedByPolicy++, qe("debug", "[LegacyGuard] Skipped by policy", { policy: a }), Promise.resolve({ passed: !0, reason: "skipped-by-policy", guard: this.name, skipped: !0, policy: a, permissionsMode: s });
    const r = e ? e.minLevel : null;
    if (typeof r != "number" || r <= 0)
      return Promise.resolve({ passed: !0, reason: "no-min-level", guard: this.name, policy: a, permissionsMode: s });
    H.minLevelUsage++, qe("warn", "[LegacyGuard] minLevel usage detected (deprecated)", { minLevel: r, route: e ? e.path : null });
    const o = i && i.getLevel ? i.getLevel() : 0;
    return o < r ? (H.blocks++, qe("debug", "[LegacyGuard] Blocked by minLevel", { userLevel: o, minLevel: r, policy: a, permissionsMode: s }), Promise.resolve({ passed: !1, reason: "insufficient-level", redirect: "/forbidden", guard: this.name, details: { required: r, current: o }, policy: a, permissionsMode: s })) : Promise.resolve({ passed: !0, reason: "level-ok", guard: this.name, policy: a, permissionsMode: s });
  },
  resetMetrics() {
    H = { checks: 0, blocks: 0, minLevelUsage: 0, skippedByPolicy: 0, bypassedByMode: 0 }, this.metrics = H;
  },
  healthCheck() {
    const e = { portsInitialized: ii.isInitialized(), authAdapterAvailable: !!Et() }, t = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: t >= 1 ? "HEALTHY" : "DEGRADED", moduleId: st, version: vt, score: `${t}/${i}`, checks: e, metrics: H, deprecated: !0, p25Compliant: !0, timestamp: Date.now() };
  },
  info() {
    return { moduleId: st, version: vt, deprecated: !0, metrics: H, p25Compliant: !0 };
  }
}, rt = "router.core.guards.permissions-array-guard", bt = "1.6.0-P25", Ha = typeof window < "u", ai = te({ moduleId: rt });
function Va(e) {
  return ai.get(e);
}
function At(e, t, i) {
  i || (i = {});
  const a = Va("logger");
  !a || typeof a[e] != "function" || (i.component = rt, a[e](t, i));
}
function Je() {
  return Ha && (window.AuthAdapter || window.CoreAuthAdapter) || null;
}
let z = { checks: 0, blocks: 0, legacyMappings: 0, skippedByPolicy: 0, bypassedByMode: 0 };
function za(e) {
  if (!e || typeof e != "string") return null;
  const t = ce && ce.CAPABILITY_PREFIX || "cap:", i = ce && ce.ROLE_PREFIX || "role:", a = ce && ce.LEVEL_PREFIX || "level:";
  return e.indexOf(t) === 0 ? { type: "capability", value: e.slice(t.length) } : e.indexOf(i) === 0 ? { type: "role", value: e.slice(i.length) } : e.indexOf(a) === 0 ? { type: "level", value: parseInt(e.slice(a.length), 10) } : (z.legacyMappings++, e.indexOf(":") !== -1 ? { type: "capability", value: e } : { type: "role", value: e });
}
function ja(e) {
  if (!e) return !1;
  const t = Je();
  return e.type === "role" ? (t && t.getRoles ? t.getRoles() : []).indexOf(e.value) !== -1 : e.type === "capability" ? t && t.can ? t.can(e.value) : (t && t.getCapabilities ? t.getCapabilities() : []).indexOf(e.value) !== -1 : e.type === "level" ? (t && t.getLevel ? t.getLevel() : 0) >= e.value : !1;
}
function xt(e) {
  if (!e || !Array.isArray(e) || e.length === 0)
    return !0;
  for (let t = 0; t < e.length; t++) {
    const i = za(e[t]);
    if (ja(i)) return !0;
  }
  return !1;
}
const Z = {
  name: "PermissionsArrayGuard",
  order: 4,
  version: bt,
  metrics: z,
  getUserRoles() {
    const e = Je();
    return e && e.getRoles ? e.getRoles() : [];
  },
  getUserCapabilities() {
    const e = Je();
    return e && e.getCapabilities ? e.getCapabilities() : [];
  },
  hasPermission: xt,
  check(e, t) {
    t || (t = {}), z.checks++;
    const i = t.policy, a = t.permissionsMode || "allow-all";
    if (a === "allow-all")
      return z.bypassedByMode++, At("debug", "[PermissionsArrayGuard] Bypassed by allow-all mode"), Promise.resolve({ passed: !0, reason: "bypassed-by-mode", guard: this.name, skipped: !0, policy: i, permissionsMode: a });
    if (i && i !== c.PERMISSIONS && i !== c.HYBRID)
      return z.skippedByPolicy++, At("debug", "[PermissionsArrayGuard] Skipped by policy", { policy: i }), Promise.resolve({ passed: !0, reason: "skipped-by-policy", guard: this.name, skipped: !0, policy: i, permissionsMode: a });
    const s = e ? e.permissions : null;
    return !s || !Array.isArray(s) || s.length === 0 ? Promise.resolve({ passed: !0, reason: "no-permissions-required", guard: this.name, policy: i, permissionsMode: a }) : xt(s) ? Promise.resolve({ passed: !0, reason: "permissions-ok", guard: this.name, policy: i, permissionsMode: a }) : (z.blocks++, At("debug", "[PermissionsArrayGuard] Blocked", { permissions: s, policy: i, permissionsMode: a }), Promise.resolve({ passed: !1, reason: "insufficient-permissions", redirect: "/forbidden", guard: this.name, details: { required: s }, policy: i, permissionsMode: a }));
  },
  resetMetrics() {
    z = { checks: 0, blocks: 0, legacyMappings: 0, skippedByPolicy: 0, bypassedByMode: 0 }, this.metrics = z;
  },
  healthCheck() {
    const e = { portsInitialized: ai.isInitialized(), authAdapterAvailable: !!Je() }, t = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: t >= 1 ? "HEALTHY" : "DEGRADED", moduleId: rt, version: bt, score: `${t}/${i}`, checks: e, metrics: z, p25Compliant: !0, timestamp: Date.now() };
  },
  info() {
    return { moduleId: rt, version: bt, metrics: z, p25Compliant: !0 };
  }
}, si = "router.core.guards.pipeline", Ya = te({ moduleId: si });
function qa(e) {
  return Ya.get(e);
}
function It(e, t, i) {
  i || (i = {});
  const a = qa("logger");
  !a || typeof a[e] != "function" || (i.component = si, a[e](t, i));
}
const nt = [j, ee, Q, Z].sort((e, t) => e.order - t.order);
function Wa(e) {
  return e === c.PUBLIC ? { auth: !1, uarps: !1, legacy: !1, permissions: !1 } : e === c.UARPS ? { auth: !0, uarps: !0, legacy: !1, permissions: !1 } : e === c.PERMISSIONS ? { auth: !0, uarps: !1, legacy: !1, permissions: !0 } : e === c.LEGACY ? { auth: !0, uarps: !1, legacy: !0, permissions: !1 } : e === c.HYBRID ? { auth: !0, uarps: !0, legacy: !0, permissions: !0 } : { auth: !0, uarps: !0, legacy: !0, permissions: !0 };
}
function Ka(e) {
  return { AuthGuard: "auth", PermissionGuard: "uarps", LegacyGuard: "legacy", PermissionsArrayGuard: "permissions" }[e] || null;
}
function Xa(e, t) {
  t || (t = {});
  const i = [], a = t.policy || null, s = t.permissionsMode || "allow-all", r = Wa(a);
  It("debug", "[Pipeline] Starting", { policy: a, permissionsMode: s, activeGuards: r });
  let o = 0;
  function n() {
    if (o >= nt.length)
      return Promise.resolve({ allowed: !0, reason: "ok", redirect: null, details: null, pipelineResults: i, policy: a, permissionsMode: s });
    const p = nt[o++], v = Ka(p.name);
    if (!(r[v] !== !1) && a !== null) {
      const A = { passed: !0, reason: "skipped-by-policy", guard: p.name, skipped: !0, policy: a, permissionsMode: s };
      return p.metrics && typeof p.metrics.skippedByPolicy == "number" && p.metrics.skippedByPolicy++, i.push(A), n();
    }
    return Promise.resolve().then(() => p.check(e, Object.assign({}, t, { policy: a, permissionsMode: s }))).then((A) => (A.policy = a, A.permissionsMode = s, A.guard = A.guard || p.name, i.push(A), !A.passed && !A.skipped ? (It("debug", "[Pipeline] Guard blocked", { guard: p.name, reason: A.reason, policy: a, permissionsMode: s }), { allowed: !1, reason: A.reason, redirect: A.redirect, details: A.details, blockedBy: p.name, pipelineResults: i, policy: a, permissionsMode: s }) : n())).catch((A) => {
      It("error", "[Pipeline] Guard error", { guard: p.name, error: A.message });
      const ie = { passed: !1, reason: "guard-error", guard: p.name, details: { error: A.message }, policy: a, permissionsMode: s };
      return i.push(ie), { allowed: !1, reason: "guard-error", redirect: "/forbidden", details: { guard: p.name, error: A.message }, blockedBy: p.name, pipelineResults: i, policy: a, permissionsMode: s };
    });
  }
  return n();
}
function Ja() {
  return nt.map((e) => ({
    name: e.name,
    order: e.order,
    deprecated: e.deprecated || !1,
    version: e.version || "1.0.0"
  }));
}
function Qa() {
  return { auth: Object.assign({}, j.metrics), uarps: Object.assign({}, ee.metrics), legacy: Object.assign({}, Q.metrics), permissions: Object.assign({}, Z.metrics) };
}
function Za() {
  j.resetMetrics(), ee.resetMetrics(), Q.resetMetrics(), Z.resetMetrics();
}
const we = "10.1.0-P18EC", he = "router-guard", ri = typeof window < "u", ye = G({ moduleId: he });
function K(e) {
  return ye.get(e);
}
function es(e) {
  return ye.inject(e);
}
function ts() {
  return ye.snapshot();
}
function Ht(e = !1) {
  const t = {
    authEventsValid: !!E && Object.keys(E).length > 0,
    authIntentsValid: !!Rt && Object.keys(Rt).length > 0,
    permissionsEventsValid: !!at && Object.keys(at).length > 0
  }, i = Object.values(t).filter(Boolean).length, a = Object.keys(t).length, s = i === a;
  if (!s && e) throw new Error("Event contracts validation failed");
  return { valid: s, score: i, maxScore: a, scoreDisplay: `${i}/${a}`, checks: t };
}
function C(e, t, i = {}) {
  const a = K("logger");
  !a || typeof a[e] != "function" || a[e](t, { component: he, ...i });
}
function Tt(e, t = {}) {
  const i = K("eventBus");
  i != null && i.emit && i.emit(e, { ...t, source: he, timestamp: Date.now() });
}
let Qe = null, Pt = null, fe = null, Ze = 0, Oe = 0, b = {
  evaluated: 0,
  enforced: 0,
  enforcedByDomain: 0,
  enforcedByRoute: 0,
  enforcedByGlobal: 0,
  bypassed: 0,
  bypassedByFeatureFlag: 0,
  failOpenUsed: 0,
  blocks: 0,
  alerts: 0
};
const ni = 600, is = 50;
function Le(e, t = {}) {
  b.alerts++;
  const i = {
    type: e,
    path: t.path || Qe,
    policy: t.policy || null,
    permissionsMode: t.permissionsMode || null,
    enforcement: U(),
    metricsSnapshot: { ...b },
    timestamp: Date.now()
  };
  return C("warn", `[SECURITY ALERT] ${e}`, i), Tt(at.ENFORCEMENT_ALERT, i), i;
}
function De() {
  try {
    const e = K("globalState");
    if (e != null && e.get) {
      const t = e.get("flags.featureFlags");
      if (t && typeof t.permissionsEnforcement == "boolean")
        return t.permissionsEnforcement;
    }
  } catch (e) {
    C("warn", "Failed to get feature flag", { error: e.message });
  }
  return !0;
}
function U() {
  try {
    const e = K("globalState");
    if (e != null && e.get) {
      const t = e.get("permissions.enforcement");
      if (t) return t;
    }
  } catch (e) {
    C("warn", "Failed to get enforcement from GlobalState", { error: e.message });
  }
  return { enabled: !1, scope: "global", domains: [], routes: [], failOpen: !0 };
}
function We() {
  const e = K("globalState");
  if (e != null && e.get) {
    const i = e.get("permissions.mode");
    if (i) return i;
  }
  const t = K("permissions");
  return t != null && t.getMode ? t.getMode() : "allow-all";
}
function as(e, t) {
  return !e || !Array.isArray(t) ? !1 : t.some((i) => e === i ? !0 : i.endsWith("*") ? e.startsWith(i.slice(0, -1)) : e.startsWith(`${i}/`));
}
function Vt(e) {
  if (b.evaluated++, !De())
    return b.bypassedByFeatureFlag++, C("debug", "Enforcement bypassed by feature flag"), "allow-all";
  let t;
  try {
    t = U();
  } catch (n) {
    return C("warn", "Enforcement check failed, using fail-open", { error: n.message }), b.failOpenUsed++, Le("fail-open", { path: e == null ? void 0 : e.path }), "allow-all";
  }
  if (!t.enabled)
    return b.bypassed++, "allow-all";
  const i = (e == null ? void 0 : e.path) || "", a = (e == null ? void 0 : e.domain) || null;
  let s = !1, r = "disabled", o = null;
  try {
    switch (t.scope) {
      case "global":
        s = !0, r = "global-scope", o = "global";
        break;
      case "domain":
        a && Array.isArray(t.domains) && t.domains.includes(a) && (s = !0, r = `domain:${a}`, o = "domain");
        break;
      case "route":
        i && Array.isArray(t.routes) && (s = as(i, t.routes), s && (r = `route:${i}`, o = "route"));
        break;
      default:
        s = !1, r = "unknown-scope";
    }
  } catch (n) {
    if (t.failOpen !== !1)
      return C("warn", "Enforcement logic error, using fail-open", { error: n.message, path: i }), b.failOpenUsed++, Le("fail-open", { path: i }), "allow-all";
    throw n;
  }
  return s ? (b.enforced++, o === "global" && b.enforcedByGlobal++, o === "domain" && b.enforcedByDomain++, o === "route" && b.enforcedByRoute++) : b.bypassed++, Tt(at.ENFORCEMENT_DECISION, {
    path: i,
    domain: a,
    policy: (e == null ? void 0 : e.guardPolicy) || null,
    permissionsMode: s ? "enforce" : "allow-all",
    enforced: s,
    reason: r,
    scope: t.scope,
    scopeType: o,
    failOpen: t.failOpen
  }), s ? "enforce" : "allow-all";
}
function zt(e) {
  var s, r, o;
  if (e.public === !0) return c.PUBLIC;
  if (e.guardPolicy && Object.values(c).includes(e.guardPolicy)) return e.guardPolicy;
  const t = ((s = e.permissions) == null ? void 0 : s.length) > 0, i = e.minLevel > 0;
  return ((r = ee.routeTriggerMap) == null ? void 0 : r[e.path]) || ((o = ee.routeTriggerMap) == null ? void 0 : o[e.id]) ? c.UARPS : t && !i ? c.PERMISSIONS : i && !t ? c.LEGACY : t && i || e.requiresAuth ? c.HYBRID : c.PUBLIC;
}
function et() {
  return K("auth") || (ri ? window.AuthAdapter || window.CoreAuthAdapter : null);
}
function tt() {
  var s, r, o, n;
  const e = et();
  if (!((s = e == null ? void 0 : e.isReady) != null && s.call(e))) return !1;
  const t = ((r = e == null ? void 0 : e.getLevel) == null ? void 0 : r.call(e)) ?? 0, i = ((o = e == null ? void 0 : e.getCapabilities) == null ? void 0 : o.call(e)) ?? [], a = ((n = e == null ? void 0 : e.getRoles) == null ? void 0 : n.call(e)) ?? [];
  return t > 0 || i.length > 0 || a.length > 0 && !a.every((p) => p === "guest");
}
async function jt(e = ni, t = "allow-all") {
  if (t === "allow-all")
    return C("debug", "Mode allow-all - skipping sync wait"), !0;
  const i = K("readyFlags");
  if (i != null && i.waitFor && await i.waitFor("permissions", e))
    return C("info", "ReadyFlags.permissions ready"), !0;
  const a = Date.now();
  for (; Date.now() - a < e; ) {
    if (tt())
      return C("info", "Auth sincronizado via Ports", { waitTime: Date.now() - a }), !0;
    await new Promise((s) => setTimeout(s, is));
  }
  return C("warn", "Timeout aguardando permissions sync", { waited: e, mode: t }), !1;
}
const M = {
  injectPorts: es,
  getPorts: ts,
  isAuthenticated() {
    return j.isAuthenticated();
  },
  isPermissionsSynced() {
    return tt();
  },
  async waitForPermissionsSync(e) {
    return jt(e);
  },
  resolveGuardPolicy(e) {
    return zt(e);
  },
  getPermissionsMode() {
    return We();
  },
  getEffectivePermissionsMode(e) {
    return Vt(e);
  },
  getEnforcement() {
    return U();
  },
  isEnforcementFeatureFlagEnabled() {
    return De();
  },
  getUserLevelDirect() {
    return Q.getUserLevel();
  },
  getUserLevel() {
    return Q.getUserLevel();
  },
  hasMinLevel(e) {
    return !e || e === 0 ? !0 : Q.getUserLevel() >= e;
  },
  hasPermission(e) {
    return Z.hasPermission(e);
  },
  getUserRoles() {
    return Z.getUserRoles();
  },
  getUserPermissions() {
    return Z.getUserCapabilities();
  },
  async checkRoute(e) {
    var n, p;
    Ze++, Qe = (e == null ? void 0 : e.path) || null, Pt = Date.now();
    const t = Ht(!1), i = j.isReady();
    let a;
    try {
      a = Vt(e);
    } catch (v) {
      if (U().failOpen !== !1)
        C("error", "Critical enforcement error, using fail-open", { error: v.message }), b.failOpenUsed++, Le("fail-open", { path: e == null ? void 0 : e.path }), a = "allow-all";
      else
        throw v;
    }
    if (!e)
      return fe = "invalid-route", { allowed: !1, reason: "invalid-route", redirect: "/", details: null, authAvailable: i, contractsValid: t.valid, policy: null, permissionsMode: a, enforcement: U(), _pipeline: { policy: null, permissionsMode: a } };
    const s = zt(e);
    if (C("debug", "Route policy resolved", { path: e.path, policy: s, permissionsMode: a }), (e.minLevel > 0 || ((n = e.permissions) == null ? void 0 : n.length) > 0 || e.requiresAuth === !0) && j.isAuthenticated() && !tt() && (C("info", "Auth OK mas não sincronizado, aguardando...", { path: e.path, mode: a }), !await jt(ni, a) && a === "enforce" && (e.minLevel > 0 || ((p = e.permissions) == null ? void 0 : p.length) > 0))) {
      Oe++, b.blocks++, fe = "sync-timeout-blocked", Le("block", { path: e.path, policy: s, permissionsMode: a });
      const B = ka();
      return { allowed: !1, reason: "forbidden", redirect: (B == null ? void 0 : B.path) || "/forbidden", details: { type: "sync-timeout-security-block", mode: a }, authAvailable: i, contractsValid: t.valid, policy: s, permissionsMode: a, enforcement: U(), _pipeline: { policy: s, permissionsMode: a, blockedBy: "sync-timeout" } };
    }
    const o = await Xa(e, { authReady: i, policy: s, permissionsMode: a });
    if (!o.allowed) {
      Oe++, a === "enforce" && (b.blocks++, Le("block", { path: e.path, policy: s, permissionsMode: a, reason: o.reason, blockedBy: o.blockedBy })), fe = o.reason, o.reason === "unauthenticated" && this.emitAuthRequired(e.path, "route-guard");
      try {
        W.trackGuardBlock(e, o.reason);
      } catch {
      }
      return { allowed: !1, reason: o.reason, redirect: o.redirect, details: o.details, authAvailable: i, contractsValid: t.valid, policy: s, permissionsMode: a, enforcement: U(), _pipeline: { blockedBy: o.blockedBy, results: o.pipelineResults, policy: s, permissionsMode: a } };
    }
    return fe = "ok", { allowed: !0, reason: "ok", redirect: null, details: null, authAvailable: i, contractsValid: t.valid, policy: s, permissionsMode: a, enforcement: U(), _pipeline: { results: o.pipelineResults, policy: s, permissionsMode: a } };
  },
  emitAuthRequired(e, t) {
    var i;
    try {
      (i = E) != null && i.LOGIN_REQUIRED && Tt(Rt.LOGIN, { reason: t, attemptedRoute: e });
    } catch (a) {
      C("warn", `Failed to emit auth required: ${a.message}`);
    }
  },
  onAuthChange(e) {
    var a, s, r, o;
    const t = K("eventBus");
    if (!t) return () => {
    };
    const i = [];
    try {
      if ((a = E) != null && a.LOGIN_SUCCESS) {
        const n = (p) => {
          try {
            e(!0, p);
          } catch {
          }
        };
        t.on(E.LOGIN_SUCCESS, n), i.push(() => {
          try {
            t.off(E.LOGIN_SUCCESS, n);
          } catch {
          }
        });
      }
      if ((s = E) != null && s.LOGOUT) {
        const n = (p) => {
          try {
            e(!1, p);
          } catch {
          }
        };
        t.on(E.LOGOUT, n), i.push(() => {
          try {
            t.off(E.LOGOUT, n);
          } catch {
          }
        });
      }
      if ((r = E) != null && r.LOGOUT_SUCCESS) {
        const n = (p) => {
          try {
            e(!1, p);
          } catch {
          }
        };
        t.on(E.LOGOUT_SUCCESS, n), i.push(() => {
          try {
            t.off(E.LOGOUT_SUCCESS, n);
          } catch {
          }
        });
      }
      if ((o = E) != null && o.SESSION_CHECKED) {
        const n = (p) => {
          try {
            e((p == null ? void 0 : p.authenticated) === !0, p);
          } catch {
          }
        };
        t.on(E.SESSION_CHECKED, n), i.push(() => {
          try {
            t.off(E.SESSION_CHECKED, n);
          } catch {
          }
        });
      }
    } catch (n) {
      C("warn", `Failed to setup auth listeners: ${n.message}`);
    }
    return () => {
      i.forEach((n) => {
        try {
          n();
        } catch {
        }
      });
    };
  },
  getGuards() {
    return { AuthGuard: j, PermissionGuard: ee, LegacyGuard: Q, PermissionsArrayGuard: Z };
  },
  getPipelineInfo() {
    return Ja();
  },
  getGuardMetrics() {
    return Qa();
  },
  getEnforcementMetrics() {
    return { ...b };
  },
  GUARD_POLICIES: c,
  getStatus() {
    const e = Ht(!1), t = j.isReady(), i = ee.isAvailable(), a = We(), s = U(), r = et();
    return { version: we, moduleId: he, isAuthenticated: j.isAuthenticated(), userLevel: Q.getUserLevel(), userRoles: Z.getUserRoles(), permissionsSynced: tt(), permissionsMode: a, enforcement: s, featureFlagEnabled: De(), authAvailable: t, uarpsAvailable: i, contractsValid: e.valid, contractsScore: e.scoreDisplay, authSource: "PortsPattern", authPortAvailable: !!r, lastCheck: { path: Qe, time: Pt, reason: fe }, metrics: { checkCount: Ze, blockCount: Oe }, enforcementMetrics: { ...b }, pipeline: this.getPipelineInfo(), guardMetrics: this.getGuardMetrics(), portsStatus: { initialized: ye.isInitialized() } };
  },
  healthCheck() {
    const e = j.isReady(), t = ee.isAvailable(), a = this.getGuardMetrics().legacy.minLevelUsage, s = We(), r = U(), o = et();
    let n = "HEALTHY", p = [];
    return a > 0 && (n = "DEGRADED", p.push(`LEGACY_MINLEVEL: ${a} checks using deprecated minLevel`)), b.failOpenUsed > 0 && p.push(`FAIL_OPEN: ${b.failOpenUsed} times used due to errors`), b.blocks > 0 && p.push(`BLOCKS: ${b.blocks} routes blocked by enforcement`), b.alerts > 0 && p.push(`ALERTS: ${b.alerts} security alerts emitted`), { status: n, moduleId: he, version: we, permissionsMode: s, enforcement: { enabled: r.enabled, scope: r.scope, failOpen: r.failOpen, featureFlagEnabled: De() }, checks: { authGuardReady: e, permissionGuardReady: t, legacyGuardDeprecated: !0, pipelineConfigured: nt.length === 4, modeAwareSync: !0, enforcementConfigured: !0, featureFlagConfigured: !0, portsInitialized: ye.isInitialized(), authPortAvailable: !!o }, warnings: p.length > 0 ? p : null };
  },
  getVersion() {
    return we;
  },
  resetMetrics() {
    Ze = 0, Oe = 0, Qe = null, Pt = null, fe = null, b = { evaluated: 0, enforced: 0, enforcedByDomain: 0, enforcedByRoute: 0, enforcedByGlobal: 0, bypassed: 0, bypassedByFeatureFlag: 0, failOpenUsed: 0, blocks: 0, alerts: 0 }, Za();
  },
  info() {
    const e = et();
    return { moduleId: he, version: we, permissionsMode: We(), enforcement: U(), featureFlagEnabled: De(), enforcementMetrics: { ...b }, pipeline: this.getPipelineInfo(), guardMetrics: this.getGuardMetrics(), guardPolicies: c, authPortAvailable: !!e, portsInitialized: ye.isInitialized() };
  }
};
ri && (window.__dev = window.__dev || {}, window.__dev.router = {
  getStatus: () => M.getStatus(),
  getMetrics: () => ({ check: { count: Ze, blocks: Oe }, enforcement: { ...b }, guards: M.getGuardMetrics() }),
  getGuardStatus: () => M.healthCheck(),
  getEnforcementMetrics: () => M.getEnforcementMetrics(),
  getEnforcement: () => M.getEnforcement(),
  getPermissionsMode: () => M.getPermissionsMode(),
  getPorts: () => M.getPorts(),
  resetMetrics: () => M.resetMetrics(),
  checkRoute: (e) => M.checkRoute(e),
  version: we
}, C("info", "window.__dev.router exposed for DevTools"));
const dt = "components.router.core.parser", ft = "2.2.0-P18EC", Ee = G({ moduleId: dt });
function ss() {
  Ee.init();
}
function oi(e) {
  return Ee.inject(e);
}
function rs() {
  return Ee.snapshot();
}
const pt = { parses: 0, builds: 0, errors: 0 };
function li(e) {
  if (pt.parses++, !e) return { path: "", params: {}, query: {}, fragment: "" };
  let t = e.charAt(0) === "#" ? e.substring(1) : e;
  const i = t.indexOf("#");
  let a = "";
  i >= 0 && (a = t.substring(i + 1), t = t.substring(0, i));
  const s = t.indexOf("?"), r = {};
  if (s >= 0) {
    const o = t.substring(s + 1);
    t = t.substring(0, s);
    const n = o.split("&");
    for (let p = 0; p < n.length; p++) {
      const v = n[p].split("=");
      v[0] && (r[decodeURIComponent(v[0])] = v[1] ? decodeURIComponent(v[1]) : "");
    }
  }
  return { path: t || "/", params: {}, query: r, fragment: a };
}
function ui(e, t) {
  const i = e.split("/").filter(Boolean), a = t.split("/").filter(Boolean);
  if (i.length !== a.length) {
    const r = i[i.length - 1];
    if (!(r && r.charAt(0) === ":" && r.charAt(r.length - 1) === "*")) return null;
  }
  const s = {};
  for (let r = 0; r < i.length; r++) {
    const o = i[r];
    if (o.charAt(0) === ":") {
      let n = o.substring(1);
      if (n.charAt(n.length - 1) === "*") {
        n = n.slice(0, -1), s[n] = a.slice(r).join("/");
        break;
      } else n.charAt(n.length - 1) === "?" ? (n = n.slice(0, -1), s[n] = a[r] || "") : s[n] = a[r];
    } else if (o !== a[r]) return null;
  }
  return s;
}
function ns(e, t) {
  return pt.builds++, t = t || {}, e.replace(/:([^/]+)/g, (a, s) => {
    const r = s.charAt(s.length - 1) === "?", o = s.charAt(s.length - 1) === "*";
    return (r || o) && (s = s.slice(0, -1)), t[s] != null ? encodeURIComponent(t[s]) : "";
  }).replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}
function ci(e) {
  const t = [];
  for (const i in e)
    e.hasOwnProperty(i) && e[i] != null && e[i] !== "" && t.push(`${encodeURIComponent(i)}=${encodeURIComponent(e[i])}`);
  return t.length > 0 ? `?${t.join("&")}` : "";
}
function os(e, t, i) {
  let a = `#${e.charAt(0) === "/" ? e : `/${e}`}`;
  return t && typeof t == "object" ? a += ci(t) : t && typeof t == "string" && (a += (t.charAt(0) === "?" ? "" : "?") + t), i && (a += `#${i}`), a;
}
function ls(e) {
  if (!e) return "/";
  let t = e.replace(/\/+/g, "/");
  return t.length > 1 && t.charAt(t.length - 1) === "/" && (t = t.slice(0, -1)), t.charAt(0) !== "/" && (t = `/${t}`), t;
}
function us(e) {
  return ss(), e && e.ports && oi(e.ports), { ok: !0, version: ft };
}
function cs() {
  return { status: Ee.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: dt, version: ft, checks: { portsInitialized: { ok: Ee.isInitialized(), severity: "info" } }, metrics: pt };
}
function ds() {
  return { moduleId: dt, version: ft, metrics: pt, portsInitialized: Ee.isInitialized() };
}
const mr = {
  MODULE_ID: dt,
  VERSION: ft,
  init: us,
  parseHash: li,
  parseRoute: ui,
  buildPath: ns,
  buildQuery: ci,
  buildHash: os,
  normalize: ls,
  healthCheck: cs,
  info: ds,
  injectPorts: oi,
  getPorts: rs
}, xe = "components.router.core.resolver", Fe = "2.3.0-P18EC", ot = {
  INIT: "router:resolver:init",
  MATCH: "router:resolve:match",
  FALLBACK: "router:resolve:fallback"
}, be = G({ moduleId: xe });
function fs() {
  be.init();
}
function ps(e) {
  return be.get(e);
}
function di(e) {
  return be.inject(e);
}
function gs() {
  return be.snapshot();
}
const R = { initialized: !1, routes: [], fallback: null }, pe = { resolves: 0, matches: 0, fallbacks: 0, errors: 0 };
function Dt(e, t) {
  try {
    const i = ps("telemetry");
    i && i.track && i.track(e, Object.assign({ moduleId: xe }, t || {}));
  } catch {
  }
}
function ms(e, t, i = {}) {
  const a = { pattern: e, handler: t, name: i.name || e, priority: i.priority || 0, meta: i.meta || {} };
  return R.routes.push(a), R.routes.sort((s, r) => r.priority - s.priority), { ok: !0, name: a.name };
}
function hs(e) {
  return R.fallback = e, { ok: !0 };
}
function ys(e) {
  const t = R.routes.findIndex((i) => i.name === e || i.pattern === e);
  return t >= 0 ? (R.routes.splice(t, 1), { ok: !0 }) : { ok: !1, reason: "Not found" };
}
function vs(e) {
  pe.resolves++;
  const t = typeof e == "string" ? li(e) : e, i = t.path || "/";
  for (let a = 0; a < R.routes.length; a++) {
    const s = R.routes[a], r = ui(String(s.pattern), i);
    if (r !== null)
      return pe.matches++, Dt(ot.MATCH, { pattern: s.pattern, path: i }), { ok: !0, route: s, params: r, query: t.query || {}, fragment: t.fragment || "", matched: !0 };
  }
  return R.fallback ? (pe.fallbacks++, Dt(ot.FALLBACK, { path: i }), { ok: !0, route: { pattern: "*", handler: R.fallback, name: "fallback", meta: {} }, params: {}, query: t.query || {}, fragment: t.fragment || "", matched: !1, fallback: !0 }) : (pe.errors++, { ok: !1, error: "No route matched", path: i });
}
function Es() {
  return R.routes.map((e) => ({
    pattern: e.pattern,
    name: e.name,
    priority: e.priority,
    meta: e.meta
  }));
}
function bs(e) {
  return R.routes.some((t) => t.name === e || t.pattern === e);
}
function As(e) {
  return R.initialized ? { ok: !0, alreadyInitialized: !0 } : (fs(), e && e.ports && di(e.ports), R.initialized = !0, Dt(ot.INIT, { version: Fe }), { ok: !0, version: Fe });
}
function Is() {
  return R.routes = [], R.fallback = null, R.initialized = !1, { ok: !0 };
}
function Ps() {
  let e = R.initialized ? 100 : 50;
  return R.routes.length === 0 && (e -= 20), { status: e >= 80 ? "HEALTHY" : e >= 50 ? "DEGRADED" : "UNHEALTHY", score: Math.max(0, e), moduleId: xe, version: Fe, checks: { initialized: { ok: R.initialized, severity: "warn" }, hasRoutes: { ok: R.routes.length > 0, severity: "warn" }, portsInitialized: { ok: be.isInitialized(), severity: "info" } }, metrics: pe };
}
function Ss() {
  return { moduleId: xe, version: Fe, initialized: R.initialized, routesCount: R.routes.length, hasFallback: !!R.fallback, metrics: pe, portsInitialized: be.isInitialized() };
}
const Ke = {
  MODULE_ID: xe,
  VERSION: Fe,
  RESOLVER_TELEMETRY: ot,
  init: As,
  cleanup: Is,
  registerRoute: ms,
  registerFallback: hs,
  unregisterRoute: ys,
  resolve: vs,
  getRoutes: Es,
  hasRoute: bs,
  healthCheck: Ps,
  info: Ss,
  injectPorts: di,
  getPorts: gs
}, He = "components.router.core.history", Ue = "2.3.0-P18EC", Ae = {
  INIT: "router:history:init",
  PUSH: "router:history:push",
  REPLACE: "router:history:replace",
  BACK: "router:history:back",
  FORWARD: "router:history:forward"
}, Ie = G({ moduleId: He });
function Rs() {
  Ie.init();
}
function ws(e) {
  return Ie.get(e);
}
function fi(e) {
  return Ie.inject(e);
}
function Os() {
  return Ie.snapshot();
}
const g = { initialized: !1, entries: [], currentIndex: -1, maxEntries: 50 }, Pe = { pushes: 0, replaces: 0, backs: 0, forwards: 0 };
function Ve(e, t) {
  try {
    const i = ws("telemetry");
    i && i.track && i.track(e, Object.assign({ moduleId: He }, t || {}));
  } catch {
  }
}
function pi(e, t) {
  return Pe.pushes++, g.currentIndex < g.entries.length - 1 && (g.entries = g.entries.slice(0, g.currentIndex + 1)), g.entries.push({ path: e, state: t || {}, timestamp: Date.now() }), g.entries.length > g.maxEntries ? g.entries.shift() : g.currentIndex++, Ve(Ae.PUSH, { path: e }), { ok: !0, index: g.currentIndex };
}
function Ds(e, t) {
  if (Pe.replaces++, g.currentIndex >= 0 && g.currentIndex < g.entries.length) g.entries[g.currentIndex] = { path: e, state: t || {}, timestamp: Date.now() };
  else return pi(e, t);
  return Ve(Ae.REPLACE, { path: e }), { ok: !0, index: g.currentIndex };
}
function Cs() {
  if (g.currentIndex <= 0) return { ok: !1, reason: "At beginning" };
  g.currentIndex--, Pe.backs++;
  const e = g.entries[g.currentIndex];
  return Ve(Ae.BACK, { path: e.path }), { ok: !0, entry: e, index: g.currentIndex };
}
function ks() {
  if (g.currentIndex >= g.entries.length - 1) return { ok: !1, reason: "At end" };
  g.currentIndex++, Pe.forwards++;
  const e = g.entries[g.currentIndex];
  return Ve(Ae.FORWARD, { path: e.path }), { ok: !0, entry: e, index: g.currentIndex };
}
function Ns(e) {
  const t = g.currentIndex + e;
  return t < 0 || t >= g.entries.length ? { ok: !1, reason: "Out of bounds" } : (g.currentIndex = t, { ok: !0, entry: g.entries[t], index: t });
}
function Ls() {
  return g.currentIndex < 0 || g.currentIndex >= g.entries.length ? null : Object.assign({}, g.entries[g.currentIndex]);
}
function Ms() {
  return g.entries.slice();
}
function gi() {
  return g.currentIndex > 0;
}
function mi() {
  return g.currentIndex < g.entries.length - 1;
}
function Ts() {
  return g.entries = [], g.currentIndex = -1, { ok: !0 };
}
function _s(e) {
  return g.initialized ? { ok: !0, alreadyInitialized: !0 } : (Rs(), e && e.ports && fi(e.ports), e && e.maxEntries && (g.maxEntries = e.maxEntries), g.initialized = !0, Ve(Ae.INIT, { version: Ue }), { ok: !0, version: Ue });
}
function Fs() {
  const e = g.initialized ? 100 : 50;
  return { status: e >= 80 ? "HEALTHY" : "DEGRADED", score: e, moduleId: He, version: Ue, checks: { initialized: { ok: g.initialized, severity: "warn" }, portsInitialized: { ok: Ie.isInitialized(), severity: "info" } }, metrics: Pe };
}
function Us() {
  return { moduleId: He, version: Ue, initialized: g.initialized, entriesCount: g.entries.length, currentIndex: g.currentIndex, canGoBack: gi(), canGoForward: mi(), metrics: Pe, portsInitialized: Ie.isInitialized() };
}
const hi = {
  MODULE_ID: He,
  VERSION: Ue,
  HISTORY_TELEMETRY: Ae,
  init: _s,
  push: pi,
  replace: Ds,
  back: Cs,
  forward: ks,
  go: Ns,
  getCurrent: Ls,
  getEntries: Ms,
  canGoBack: gi,
  canGoForward: mi,
  clear: Ts,
  healthCheck: Fs,
  info: Us,
  injectPorts: fi,
  getPorts: Os
}, ze = "components.router.core.transitions", gt = "2.3.0-P18EC", Ct = { START: "router:transition:start", COMPLETE: "router:transition:complete" }, le = G({ moduleId: ze });
function $s() {
  le.init();
}
function Gs(e) {
  return le.get(e);
}
function yi(e) {
  return le.inject(e);
}
function Bs() {
  return le.snapshot();
}
const Y = { enabled: !0, defaultDuration: 300, defaultEasing: "ease-in-out" }, ve = { started: 0, completed: 0, skipped: 0, errors: 0 }, _ = { FADE: "fade", SLIDE_LEFT: "slide-left", SLIDE_RIGHT: "slide-right", SLIDE_UP: "slide-up", SLIDE_DOWN: "slide-down", NONE: "none" };
function Yt(e, t) {
  try {
    const i = Gs("telemetry");
    i && i.track && i.track(e, Object.assign({ moduleId: ze }, t || {}));
  } catch {
  }
}
function vi(e, t, i, a) {
  return !e || t === _.NONE ? (ve.skipped++, Promise.resolve({ ok: !0, skipped: !0 })) : (ve.started++, new Promise((s) => {
    const r = e.style.transition, o = e.style.opacity, n = e.style.transform;
    e.style.transition = `opacity ${a}ms ${Y.defaultEasing}, transform ${a}ms ${Y.defaultEasing}`, i === "out" ? (e.style.opacity = "0", t === _.SLIDE_LEFT ? e.style.transform = "translateX(-20px)" : t === _.SLIDE_RIGHT ? e.style.transform = "translateX(20px)" : t === _.SLIDE_UP ? e.style.transform = "translateY(-20px)" : t === _.SLIDE_DOWN && (e.style.transform = "translateY(20px)")) : (e.style.opacity = "1", e.style.transform = "translateX(0) translateY(0)"), setTimeout(() => {
      e.style.transition = r, i === "in" && (e.style.opacity = o, e.style.transform = n), ve.completed++, s({ ok: !0 });
    }, a);
  }));
}
function Ei(e, t, i = {}) {
  const a = i.duration || Y.defaultDuration;
  return vi(e, t || _.FADE, "out", a);
}
function bi(e, t, i = {}) {
  const a = i.duration || Y.defaultDuration;
  return t !== _.NONE && (e.style.opacity = "0", t === _.SLIDE_LEFT ? e.style.transform = "translateX(20px)" : t === _.SLIDE_RIGHT ? e.style.transform = "translateX(-20px)" : t === _.SLIDE_UP ? e.style.transform = "translateY(20px)" : t === _.SLIDE_DOWN && (e.style.transform = "translateY(-20px)")), vi(e, t || _.FADE, "in", a);
}
function xs(e, t, i, a = {}) {
  return Yt(Ct.START, { type: i }), Ei(e, i, a).then(() => bi(t, i, a)).then(() => (Yt(Ct.COMPLETE, { type: i }), { ok: !0 })).catch((s) => (ve.errors++, { ok: !1, error: s && s.message || "transition_error" }));
}
function Hs(e) {
  Y.enabled = e;
}
function Vs() {
  return Y.enabled;
}
function zs(e) {
  Y.defaultDuration = e;
}
function js(e) {
  return $s(), e && e.ports && yi(e.ports), { ok: !0, version: gt };
}
function Ys() {
  return { status: le.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: ze, version: gt, checks: { enabled: { ok: Y.enabled, severity: "info" }, portsInitialized: { ok: le.isInitialized(), severity: "info" } }, metrics: ve };
}
function qs() {
  return { moduleId: ze, version: gt, enabled: Y.enabled, defaultDuration: Y.defaultDuration, metrics: ve, portsInitialized: le.isInitialized() };
}
const hr = {
  MODULE_ID: ze,
  VERSION: gt,
  TRANSITIONS: _,
  TRANSITIONS_TELEMETRY: Ct,
  init: js,
  transitionOut: Ei,
  transitionIn: bi,
  transition: xs,
  setEnabled: Hs,
  isEnabled: Vs,
  setDefaultDuration: zs,
  healthCheck: Ys,
  info: qs,
  injectPorts: yi,
  getPorts: Bs
}, Ws = "router.hooks.index";
te({ moduleId: Ws });
const Ks = { BEFORE_RESOLVE: "beforeResolve", AFTER_RESOLVE: "afterResolve", BEFORE_GUARD: "beforeGuard", AFTER_GUARD: "afterGuard", BEFORE_NAVIGATE: "beforeNavigate", AFTER_NAVIGATE: "afterNavigate", ON_ERROR: "onError", ON_NOT_FOUND: "onNotFound" };
Object.values(Ks).forEach((e) => {
});
function Xs(e) {
  if (!e || typeof e != "string") return "/";
  let t = e.trim();
  t.charAt(0) === "#" && (t = t.substring(1));
  const i = t.indexOf("?");
  return i !== -1 && (t = t.substring(0, i)), t.charAt(0) !== "/" && (t = `/${t}`), t = t.replace(/\/+/g, "/"), t.length > 1 && t.charAt(t.length - 1) === "/" && (t = t.slice(0, -1)), t || "/";
}
const it = q, St = W, lt = hi, Js = "router-navigation", Qs = G({ moduleId: Js });
function Zs(e) {
  return Qs.get(e);
}
function er(e, t, i) {
  return Promise.resolve().then(() => {
    const a = Xs(t), s = Ke.resolve ? Ke.resolve(a) : { path: a };
    return Promise.resolve(M.checkRoute ? M.checkRoute(s) : { allowed: !0 }).then((r) => {
      if (!r.allowed && r.redirect) {
        r.reason === "unauthenticated" && a !== "/login" && it.setAttemptedRoute(a), lt.replace && lt.replace(r.redirect);
        const o = Ke.resolve ? Ke.resolve(r.redirect) : { path: r.redirect };
        it.setCurrentRoute(o), kt(o);
      } else
        it.setCurrentRoute(s), kt(s);
    });
  }).catch((a) => {
    St.logger && St.logger.error && St.logger.error("handleRouteChange error", { error: a.message });
  });
}
function kt(e) {
  if (e)
    try {
      lt.updateTitle && lt.updateTitle(e.title || "DshowDash");
      const t = Zs("eventBus");
      t && t.emit && t.emit(Me.ROUTE_CHANGED, { route: { path: e.path, page: e.page, title: e.title, params: e.params, query: e.query, hash: e.hash, layout: e.layout }, virtualRoute: it.getVirtualRoute(), timestamp: Date.now() });
      const i = e.layout || "default", a = i === "full-screen" || i === "login-only";
      t && t.emit && t.emit(Me.LAYOUT_CHANGED, { layout: i, route: e.path, hideNav: a, timestamp: Date.now() });
    } catch {
    }
}
const tr = "router-integrations", Ai = 5, Ii = 300;
let ut = [], ge = [], Ce = 0, ke = 0;
const Pi = Ci({ moduleId: tr });
function Si() {
  Pi.init();
}
function me(e) {
  return Pi.get(e);
}
function Ri() {
  if (ut.length > 0) return !0;
  if (Si(), !me("globalState"))
    return Ce < Ai && (Ce++, setTimeout(Ri, Ii * Ce)), !1;
  try {
    const t = (a, s) => {
      const r = me("globalState");
      if (!(!r || !a))
        try {
          if (r.dispatch && r.actions && r.actions.updateNavigation) {
            const o = q.getPreviousRoute(), n = {
              currentRoute: a.path,
              lastNavigationAt: Date.now()
            };
            a.page && typeof a.page == "string" && (n.currentPage = a.page), o && o.path && (n.previousRoute = o.path), s && s.view ? n.activePanel = s.view : a.panel ? n.activePanel = a.panel : a.defaultView && (n.activePanel = a.defaultView), s && (s.view && (n.view = s.view), s.tab && (n.tab = s.tab), s.section && (n.section = s.section), s.entity && (n.entity = s.entity), s.id && (n.entityId = s.id), s.mode && (n.mode = s.mode), s.sort && (n.sort = s.sort), s.filters && (n.filters = s.filters), typeof s.page == "number" && s.page >= 1 && (n.page = s.page)), r.dispatch(r.actions.updateNavigation(n));
          }
        } catch {
        }
    }, i = q.subscribe(() => {
      const a = q.getCurrentRoute(), s = q.getVirtualRoute();
      a && t(a, s);
    });
    return typeof i == "function" && ut.push(i), W.track && W.track("router:globalstate:connected", { retriesNeeded: Ce }), !0;
  } catch {
    return !1;
  }
}
function ir() {
  ut.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), ut = [], Ce = 0;
}
function wi(e) {
  if (ge.length > 0) return !0;
  Si();
  const t = me("eventBus");
  if (!t || typeof t.on != "function")
    return ke < Ai && (ke++, setTimeout(() => {
      wi(e);
    }, Ii * ke)), !1;
  try {
    if (E && E.LOGIN_SUCCESS) {
      const i = (a) => {
        try {
          const s = q.getAttemptedRoute() ? q.getAttemptedRoute().path : a ? a.attemptedRoute : null, r = s && s !== "/login" ? s : "/";
          r && (q.clearAttemptedRoute(), setTimeout(() => {
            try {
              const o = e();
              o && o.isInitialized && o.navigate(r, { replace: !0 });
            } catch {
            }
          }, 100));
        } catch {
        }
      };
      t.on(E.LOGIN_SUCCESS, i), ge.push(() => {
        try {
          const a = me("eventBus");
          a && a.off && a.off(E.LOGIN_SUCCESS, i);
        } catch {
        }
      });
    }
    if (E && E.LOGOUT) {
      const i = () => {
        setTimeout(() => {
          try {
            const a = e();
            a && a.isInitialized && a.navigate("/login", { replace: !0 });
          } catch {
          }
        }, 100);
      };
      t.on(E.LOGOUT, i), ge.push(() => {
        try {
          const a = me("eventBus");
          a && a.off && a.off(E.LOGOUT, i);
        } catch {
        }
      }), E.LOGOUT_SUCCESS && (t.on(E.LOGOUT_SUCCESS, i), ge.push(() => {
        try {
          const a = me("eventBus");
          a && a.off && a.off(E.LOGOUT_SUCCESS, i);
        } catch {
        }
      }));
    }
    return W.track && W.track("router:auth-events:connected", { retriesNeeded: ke }), !0;
  } catch {
    return !1;
  }
}
function ar() {
  ge.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), ge = [], ke = 0;
}
const L = q, qt = hi, J = "4.5.0-P18EC", Xe = "router-global";
function yr() {
  return J;
}
let X = !1, re = null;
const Ne = /* @__PURE__ */ new Set();
function Wt(e) {
  Ne.forEach((t) => {
    try {
      t(e);
    } catch (i) {
      P("error", "Route change listener error", { error: i.message });
    }
  });
}
const V = {
  version: J,
  moduleId: Xe,
  isInitialized: !1,
  isDestroyed: !1,
  injectPorts: Li,
  getPorts: Mi,
  init(e) {
    const t = this;
    return e || (e = {}), X ? (P("warn", "Already initialized"), Promise.resolve(!0)) : Promise.resolve().then(() => {
      P("info", "Initializing Router v4.5.0-P18EC..."), Ni(), L.init && L.init(e), qt.init && qt.init();
      const i = D("runtime");
      i && i.addEventListener && i.addEventListener("popstate", (s) => {
        t._handlePopState(s);
      }), N.reset(), X = !0, t.isInitialized = !0, t.isDestroyed = !1, re = Date.now();
      const a = D("eventBus");
      return a && a.emit && (a.emit(x.INITIALIZED, { version: J }), a.emit(x.READY, { version: J })), Ri(), wi(() => t), P("info", "Router initialized (Circuit Breaker, Retry, AbortController, Integrations enabled)"), !0;
    }).catch((i) => (P("error", "Init failed", { error: i.message }), y.errorCount++, y.lastError = i.message, !1));
  },
  _handlePopState(e) {
    const t = D("runtime"), i = t && t.location && t.location.hash ? t.location.hash.replace("#", "") : "/";
    this.handleRouteChange(i, e.state || {});
  },
  navigate(e, t) {
    if (t || (t = {}), !X)
      return P("warn", "Not initialized"), Promise.resolve(!1);
    if (!N.canNavigate(e, y))
      return y.navigationsBlocked++, Promise.resolve(!1);
    const i = Date.now();
    return y.navigationsTotal++, _i(), Promise.resolve().then(() => {
      const a = t.replace || !1, s = t.source || "api", r = D("eventBus"), o = D("runtime");
      return Promise.resolve(M.checkRoute ? M.checkRoute({ path: e }) : { allowed: !0 }).then((n) => {
        if (!n.allowed)
          return P("warn", "Navigation blocked by guard", { path: e, reason: n.reason }), y.guardBlocks++, r && r.emit && r.emit(x.GUARD_BLOCK, { path: e, reason: n.reason }), n.redirect && o && o.location ? (P("info", "Redirecting to", { redirect: n.redirect }), Re(), o.location.href = n.redirect, !1) : (N.recordFailure(e, y), Re(), !1);
        if (Fi())
          return P("info", "Navigation aborted before execution"), !1;
        r && r.emit && r.emit(x.NAVIGATE_START, { path: e, options: t });
        const p = e.indexOf("#") === 0 ? e : "#" + e;
        o && o.history && (a ? o.history.replaceState({ path: e }, "", p) : o.history.pushState({ path: e }, "", p));
        const v = Ca(e), B = v ? Object.assign({}, v, { path: v.path || e, timestamp: Date.now() }) : { path: e, timestamp: Date.now() }, A = t.virtualRoute ? $t(t.virtualRoute) : v && v.virtualDefaults ? $t(v.virtualDefaults) : null, ie = A ? Object.assign({}, B, A) : B;
        A && L.setVirtualRoute && L.setVirtualRoute(A), L.setCurrentRoute ? L.setCurrentRoute(ie) : L.setState && L.setState({ currentPath: e, lastNavigateAt: Date.now() }), kt(ie), r && r.emit && (r.emit(x.NAVIGATE_END, { path: e, options: t }), Wt(Ut(e, t, ie)));
        const Se = Date.now() - i;
        return y.navigationsSucceeded++, y.lastNavigationTime = Date.now(), y.lastNavigationDuration = Se, Gi(Se), N.recordSuccess(), W && W.track && W.track("navigate", { path: e, source: s, duration: Se }), Re(), !0;
      });
    }).catch((a) => {
      P("error", "Navigate failed", { path: e, error: a.message }), y.navigationsFailed++, y.errorCount++, y.lastError = a.message, N.recordFailure(e, y);
      const s = D("eventBus");
      return s && s.emit && s.emit(x.NAVIGATE_ERROR, { path: e, error: a.message }), Re(), !1;
    });
  },
  handleRouteChange(e, t) {
    const i = this;
    return t || (t = {}), X ? Promise.resolve().then(() => er(i, e)).catch((a) => {
      P("error", "handleRouteChange error", { path: e, error: a.message });
      const s = Object.assign({ path: e, timestamp: Date.now() }, t), r = Ut(e, {}, s), o = D("eventBus");
      o && o.emit && o.emit(x.ROUTE_CHANGED, r), Wt(r);
    }) : Promise.resolve();
  },
  navigateCanvas(e, t) {
    t || (t = {}), Array.isArray(e) || (e = [e]);
    const i = "/canvas?panels=" + e.join(","), a = D("eventBus");
    return a && a.emit && a.emit(x.CANVAS_NAVIGATE, { panelIds: e, options: t }), this.navigate(i, t);
  },
  abortNavigation: $i,
  current() {
    const e = D("runtime");
    if (!e || !e.location) return { path: "/" };
    const t = e.location.hash || "#/", i = t.replace("#", "") || "/";
    return { path: i, hash: t, search: e.location.search, fullPath: i + e.location.search };
  },
  getCurrentRoute() {
    const e = L.getCurrentRoute ? L.getCurrentRoute() : null;
    return e || this.current();
  },
  onRouteChange(e) {
    if (typeof e != "function") return () => {
    };
    Ne.add(e);
    const t = D("eventBus"), i = (a) => {
      try {
        e(a);
      } catch (s) {
        P("error", "onRouteChange handler error", { error: s.message });
      }
    };
    return t && t.on && t.on(x.ROUTE_CHANGED, i), () => {
      Ne.delete(e), t && t.off && t.off(x.ROUTE_CHANGED, i);
    };
  },
  resolveFromUrl() {
    return this.current();
  },
  back() {
    const e = D("runtime");
    e && e.history && e.history.back();
  },
  forward() {
    const e = D("runtime");
    e && e.history && e.history.forward();
  },
  isReady() {
    return X;
  },
  retryLastNavigation() {
    const e = this, t = L.getAttemptedRoute ? L.getAttemptedRoute() : null;
    return t && t.path ? (P("info", "Retrying last navigation", { path: t.path }), e.navigate(t.path, t.options || {})) : Promise.resolve(!1);
  },
  resetCircuitBreaker() {
    N.reset(), P("info", "Circuit breaker reset");
  },
  getCircuitBreakerStatus() {
    return N.getStatus();
  },
  getStatus() {
    return { version: J, moduleId: Xe, initialized: X, initTimestamp: re, currentRoute: this.getCurrentRoute(), uptime: re ? Date.now() - re : 0, listenerCount: Ne.size, circuitBreaker: N.getStatus(), retry: Ft.getStatus(), hasAbortController: Ui(), portsStatus: { initialized: _t() } };
  },
  getMetrics() {
    const e = L.getMetrics ? L.getMetrics() : {};
    return Object.assign({ version: J, moduleId: Xe }, e, xi(), { circuitBreaker: N.getStatus(), retry: Ft.getStatus(), uptime: re ? Date.now() - re : 0, timestamp: Date.now() });
  },
  healthCheck() {
    const e = D("eventBus"), t = D("globalState"), i = { initialized: X, notDestroyed: !this.isDestroyed, portsInitialized: _t(), circuitBreakerClosed: N.state === "CLOSED", lowFailureRate: y.navigationsTotal === 0 || y.navigationsFailed / y.navigationsTotal < 0.3, lowErrorCount: y.errorCount < 10, noLoopsDetected: y.loopsDetected < 5, guardAvailable: !!M.checkRoute, eventBusConnected: !!e, globalStateConnected: !!t };
    let a = 0, s = 0;
    for (const n in i)
      i.hasOwnProperty(n) && (s++, i[n] && a++);
    const r = a < s * 0.5 ? "UNHEALTHY" : a < s ? "DEGRADED" : "HEALTHY", o = [];
    return i.initialized || o.push("not-initialized"), i.portsInitialized || o.push("ports-not-initialized"), i.circuitBreakerClosed || o.push("circuit-breaker-" + N.state), i.lowErrorCount || o.push("high-error-count"), { status: r, score: a + "/" + s, healthy: a >= s - 2, checks: i, issues: o.length > 0 ? o : null, circuitBreaker: N.getStatus(), version: J, moduleId: Xe, timestamp: Date.now() };
  },
  info() {
    return Object.assign({}, this.getStatus(), { metrics: this.getMetrics(), healthCheck: this.healthCheck() });
  },
  resetMetrics() {
    Bi(), N.reset();
  },
  // v4.4.0: Cleanup integrations on destroy
  destroy() {
    X = !1, this.isInitialized = !1, this.isDestroyed = !0, re = null, Ne.clear(), ir(), ar(), N.reset(), Re(), P("info", "Destroyed");
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.routerGlobal = {
  getVersion() {
    return J;
  },
  info() {
    return V.info();
  },
  healthCheck() {
    return V.healthCheck();
  },
  getStatus() {
    return V.getStatus();
  },
  getMetrics() {
    return V.getMetrics();
  },
  getCircuitBreakerStatus() {
    return V.getCircuitBreakerStatus();
  },
  getPorts() {
    return V.getPorts();
  },
  resetCircuitBreaker() {
    return V.resetCircuitBreaker();
  },
  resetMetrics() {
    return V.resetMetrics();
  },
  abortNavigation() {
    return V.abortNavigation();
  },
  retryLastNavigation() {
    return V.retryLastNavigation();
  }
});
export {
  br as AUTH_EVENTS,
  qt as HistoryManager,
  Xe as MODULE_ID,
  Ar as ROUTER_EVENTS,
  M as RouteGuard,
  Ke as RouteResolver,
  hr as RouteTransitions,
  V as RouterGlobal,
  mr as URLParser,
  J as VERSION,
  V as default,
  Mi as getPorts,
  yr as getVersion,
  Li as injectPorts,
  L as routerStore,
  W as routerTelemetry
};
