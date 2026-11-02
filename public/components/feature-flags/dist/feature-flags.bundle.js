import { createCorePorts as de, createUiPorts as Te } from "/core/runtime/ports-profiles.js";
import { isStrict as $e, recordViolation as ke } from "/core/runtime/enterprise/strict-mode.js";
import { FEATURE_FLAGS_EVENTS as j, ORCHESTRATOR_EVENTS as ue, TELEMETRY_INTENTS as Fe } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const je = "components.feature-flags.ports", Pe = de({ moduleId: je });
function p(e) {
  return Pe.get(e);
}
function W(e, ...t) {
  var n;
  const r = p("logger");
  if (!r) return;
  const i = "[feature-flags]";
  {
    (n = r.warn) == null || n.call(r, `${i}`, ...t);
    return;
  }
}
const Q = "2.3.0-P2-ENTERPRISE", X = "components.feature-flags.core.registry", c = /* @__PURE__ */ new Map();
function M(e, t) {
  const n = {
    enabled: (t == null ? void 0 : t.enabled) ?? !1,
    percentage: (t == null ? void 0 : t.percentage) ?? 100,
    variant: (t == null ? void 0 : t.variant) ?? null,
    value: (t == null ? void 0 : t.value) ?? null,
    metadata: (t == null ? void 0 : t.metadata) ?? {},
    registeredAt: Date.now(),
    updatedAt: Date.now()
  };
  return c.set(e, n), !0;
}
function Ne(e) {
  return c.delete(e);
}
function Le(e) {
  return c.get(e);
}
function Me(e) {
  return c.has(e);
}
function ge() {
  return Array.from(c.keys());
}
function ze() {
  const e = {};
  return c.forEach((t, n) => {
    e[n] = { ...t };
  }), e;
}
function Ve() {
  c.clear();
}
function xe(e) {
  const t = c.get(e);
  return t ? (t.enabled = !0, t.updatedAt = Date.now(), c.set(e, t), !0) : (M(e, { enabled: !0 }), !0);
}
function Ue(e) {
  const t = c.get(e);
  return t ? (t.enabled = !1, t.updatedAt = Date.now(), c.set(e, t), !0) : (M(e, { enabled: !1 }), !0);
}
function Ge(e, t) {
  const n = c.get(e);
  if (!n)
    return M(e, t);
  const r = {
    ...n,
    ...t,
    updatedAt: Date.now()
  };
  return c.set(e, r), !0;
}
function He(e, t) {
  const n = c.get(e), r = Math.max(0, Math.min(100, t));
  return n ? (n.percentage = r, n.updatedAt = Date.now(), c.set(e, n), !0) : (M(e, { enabled: !0, percentage: r }), !0);
}
function he() {
  const e = {
    registryExists: !0,
    hasFlagsMap: c instanceof Map
  }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : "DEGRADED",
    score: t,
    maxScore: n,
    scoreDisplay: `${t}/${n}`,
    checks: e,
    flagCount: c.size,
    version: Q,
    moduleId: X,
    timestamp: Date.now()
  };
}
function Be() {
  return {
    moduleId: X,
    version: Q,
    flagCount: c.size,
    flags: ge(),
    healthCheck: he(),
    timestamp: Date.now()
  };
}
const u = {
  register: M,
  unregister: Ne,
  get: Le,
  has: Me,
  list: ge,
  getAll: ze,
  clear: Ve,
  enable: xe,
  disable: Ue,
  update: Ge,
  setPercentage: He,
  healthCheck: he,
  info: Be,
  VERSION: Q,
  MODULE_ID: X
}, ve = "components.feature-flags.telemetry.tracker", Ye = Te({ moduleId: ve }), Ze = (e) => Ye.get(e);
function We(e, t = {}) {
  e.includes("error"), e.includes("eval");
  const n = Ze("eventBus");
  n != null && n.emit && n.emit(Fe.TRACK, {
    source: ve,
    event: e,
    data: t,
    timestamp: Date.now()
  });
}
const v = We;
function Je() {
  return [];
}
function qe() {
  return [];
}
const z = {
  endpoints: {
    list: "/api/feature-flags/?action=list",
    check: "/api/feature-flags/?action=check&flag="
  },
  retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 },
  timeout: 1e4
};
let K = {}, ee = 0, E = null;
function _() {
  return { ...K };
}
function V() {
  return ee;
}
function J() {
  return E;
}
function be(e) {
  E = e;
}
function me() {
  K = {}, ee = 0;
}
function ce(e) {
  return new Promise((t) => setTimeout(t, e));
}
function x(e, t = {}, n = 1) {
  const { maxAttempts: r, baseDelay: i, maxDelay: a } = z.retry;
  (!E || E.signal.aborted) && (E = new AbortController());
  const l = {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    ...t,
    signal: E.signal
  };
  return new Promise((d, m) => {
    const S = setTimeout(() => {
      E.abort();
    }, z.timeout);
    fetch(e, l).then((w) => {
      if (clearTimeout(S), !w.ok && n < r) {
        const Z = Math.min(i * Math.pow(2, n - 1), a);
        return W("warn", `Request failed (${w.status}), retry ${n}/${r}`), ce(Z).then(() => x(e, t, n + 1)).then(d).catch(m);
      }
      d(w);
    }).catch((w) => {
      if (clearTimeout(S), w.name === "AbortError") {
        m(new Error("REQUEST_TIMEOUT"));
        return;
      }
      if (n < r) {
        const Z = Math.min(i * Math.pow(2, n - 1), a);
        W("warn", `Request error, retry ${n}/${r}`), ce(Z).then(() => (E = new AbortController(), x(e, t, n + 1))).then(d).catch(m);
        return;
      }
      m(w);
    });
  });
}
function Qe(e = "production", t, n, r) {
  return new Promise((i) => {
    const a = `${z.endpoints.list}&env=${e}`;
    x(a).then((l) => {
      if (!l.ok) throw new Error(`HTTP ${l.status}`);
      return l.json();
    }).then((l) => {
      if (l.ok && l.flags) {
        K = l.flags, ee = Date.now(), t.fetchCount++;
        for (const [m, S] of Object.entries(l.flags))
          S.enabled ? u.enable(m) : u.disable(m), S.payload && u.update(m, { payload: S.payload });
        v("flags:server:fetched", {
          count: Object.keys(l.flags).length,
          environment: l.environment
        }), r("fetched", {
          count: Object.keys(l.flags).length,
          environment: e
        });
        const d = p("eventBus");
        d != null && d.emit && d.emit(j.SERVER_UPDATED, {
          flags: l.flags,
          timestamp: Date.now()
        });
      }
      i(l);
    }).catch((l) => {
      t.errorCount++, v("flags:server:fetch-error", { error: l.message }), r("error", { action: "fetch", error: l.message });
      const d = p("eventBus");
      d != null && d.emit && d.emit(j.ERROR, {
        action: "fetch",
        error: l.message
      }), W("warn", "Server fetch error:", l.message), i({ ok: !1, error: l.message });
    });
  });
}
function Xe(e, t, n, r) {
  return new Promise((i) => {
    x(z.endpoints.check + encodeURIComponent(e)).then((a) => {
      if (!a.ok) throw new Error(`HTTP ${a.status}`);
      return a.json();
    }).then((a) => {
      a.ok && (t.checkCount++, a.enabled ? u.enable(e) : u.disable(e), v("flags:server:checked", {
        flag: e,
        enabled: a.enabled,
        source: a.source
      }), r("checked", {
        flag: e,
        enabled: a.enabled
      })), i(a);
    }).catch((a) => {
      t.errorCount++, r("error", {
        action: "check",
        flag: e,
        error: a.message
      });
      const l = p("eventBus");
      l != null && l.emit && l.emit(j.ERROR, {
        action: "check",
        flag: e,
        error: a.message
      }), i({ ok: !1, error: a.message });
    });
  });
}
const H = "2.2.0-P2-ENTERPRISE", B = "components.feature-flags.state.store";
let o = { flags: {}, defaults: {}, overrides: {} }, R = [];
function Ke() {
  return { ...o };
}
function Ee() {
  return {
    ...o.defaults,
    ...o.flags,
    ...o.overrides
  };
}
function et(e) {
  return o.overrides[e] !== void 0 ? o.overrides[e] : o.flags[e] !== void 0 ? o.flags[e] : o.defaults[e] ?? !1;
}
function tt(e, t) {
  return o.flags[e] = t, T({ action: "flag-changed", flag: e, value: t }), !0;
}
function nt(e) {
  return o.flags = { ...o.flags, ...e }, T({ action: "flags-changed", flags: Object.keys(e) }), !0;
}
function rt(e, t) {
  return o.overrides[e] = t, T({ action: "override-set", flag: e, value: t }), !0;
}
function st(e) {
  return o.overrides[e] !== void 0 ? (delete o.overrides[e], T({ action: "override-removed", flag: e }), !0) : !1;
}
function ot() {
  const e = Object.keys(o.overrides).length;
  return o.overrides = {}, T({ action: "overrides-cleared", count: e }), !0;
}
function at(e) {
  return o.defaults = { ...o.defaults, ...e }, !0;
}
function it() {
  return o = { flags: {}, defaults: {}, overrides: {} }, T({ action: "reset" }), !0;
}
function lt(e) {
  return typeof e == "function" && R.push(e), () => {
    R = R.filter((t) => t !== e);
  };
}
function T(e) {
  R.forEach((t) => {
    try {
      t(e);
    } catch {
    }
  });
}
function ut() {
  return {
    version: H,
    moduleId: B,
    exportedAt: Date.now(),
    state: {
      flags: { ...o.flags },
      defaults: { ...o.defaults },
      overrides: { ...o.overrides }
    },
    computed: {
      allFlags: Ee(),
      flagCount: Object.keys(o.flags).length,
      overrideCount: Object.keys(o.overrides).length,
      defaultCount: Object.keys(o.defaults).length
    }
  };
}
function De() {
  const e = {
    hasState: o !== null && typeof o == "object",
    hasFlags: typeof o.flags == "object",
    hasOverrides: typeof o.overrides == "object",
    hasDefaults: typeof o.defaults == "object"
  }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : "DEGRADED",
    score: t,
    maxScore: n,
    scoreDisplay: `${t}/${n}`,
    checks: e,
    flagCount: Object.keys(o.flags).length,
    overrideCount: Object.keys(o.overrides).length,
    subscriberCount: R.length,
    version: H,
    moduleId: B,
    timestamp: Date.now()
  };
}
function ct() {
  return {
    moduleId: B,
    version: H,
    flagCount: Object.keys(o.flags).length,
    overrideCount: Object.keys(o.overrides).length,
    subscriberCount: R.length,
    flags: Object.keys(o.flags),
    overrides: Object.keys(o.overrides),
    healthCheck: De(),
    timestamp: Date.now()
  };
}
const A = {
  getState: Ke,
  getFlags: Ee,
  getFlag: et,
  setFlag: tt,
  setFlags: nt,
  setOverride: rt,
  removeOverride: st,
  clearOverrides: ot,
  setDefaults: at,
  reset: it,
  subscribe: lt,
  toJSON: ut,
  healthCheck: De,
  info: ct,
  VERSION: H,
  MODULE_ID: B
};
let P = [], N = [], F = null;
function te() {
  return P;
}
function ne() {
  return N;
}
function ft(e) {
  const t = p("globalState");
  if (!t) return;
  const n = t.subscribe((i) => {
    if (i && typeof i == "object") {
      for (const [a, l] of Object.entries(i))
        l ? u.enable(a) : u.disable(a);
      v("flags.global-state.synced", {
        count: Object.keys(i).length
      });
    }
  }, "flags.featureFlags");
  N.push(n);
  const r = t.subscribe((i) => {
    i != null && i.isAuthenticated && e();
  }, "session");
  N.push(r), v("flags.global-state.connected");
}
function dt() {
  N.forEach((e) => {
    typeof e == "function" && e();
  }), N = [];
}
function gt() {
  const e = p("eventBus");
  if (!e) return;
  F = (n) => {
    if (n != null && n.flags) {
      for (const [r, i] of Object.entries(n.flags))
        i ? u.enable(r) : u.disable(r);
      v("flags.orchestrator.preset-applied", { flags: n.flags });
    }
  }, e.on(ue.PRESET_APPLIED, F), P.push(() => {
    const n = p("eventBus");
    n != null && n.off && F && n.off(ue.PRESET_APPLIED, F);
  });
  const t = A.subscribe((n) => {
    const { action: r, flag: i } = n, a = p("eventBus");
    r === "flag-changed" && (a != null && a.emit) && a.emit(j.FLAG_CHANGED, {
      flag: i,
      timestamp: Date.now()
    });
  });
  P.push(t), v("flags.orchestrator.connected");
}
function ht() {
  P.forEach((e) => {
    typeof e == "function" && e();
  }), P = [], F = null;
}
const re = "2.3.0-P2-ENTERPRISE", se = "components.feature-flags.core.evaluator";
let O = {}, $ = {
  evaluations: 0,
  isEnabledCalls: 0,
  getVariantCalls: 0,
  getValueCalls: 0
};
function vt(e) {
  O = { ...O, ...e };
}
function bt() {
  return { ...O };
}
function pe(e, t = null) {
  $.evaluations++;
  const n = t || O;
  return typeof e == "boolean" ? e : typeof e == "function" ? !!e(n) : !!e;
}
function mt(e, t = null) {
  const n = t || O;
  return Object.fromEntries(
    Object.entries(e).map(([r, i]) => [r, pe(i, n)])
  );
}
function Et(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    t = (t << 5) - t + r, t = t & t;
  }
  return Math.abs(t);
}
function Dt(e) {
  $.isEnabledCalls++;
  const t = u.get(e);
  return !t || !t.enabled ? !1 : t.percentage !== void 0 && t.percentage < 100 ? Et(e + JSON.stringify(O)) % 100 < t.percentage : !0;
}
function pt(e) {
  $.getVariantCalls++;
  const t = u.get(e);
  return t ? t.variant ?? null : null;
}
function It(e, t = null) {
  $.getValueCalls++;
  const n = u.get(e);
  return n ? n.value !== void 0 && n.value !== null ? n.value : n.enabled ?? t : t;
}
function oe() {
  return { ...$ };
}
function Ot() {
  $ = {
    evaluations: 0,
    isEnabledCalls: 0,
    getVariantCalls: 0,
    getValueCalls: 0
  };
}
function Ie() {
  const e = {
    available: !0,
    registryConnected: typeof u.get == "function"
  }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : "DEGRADED",
    score: t,
    maxScore: n,
    scoreDisplay: `${t}/${n}`,
    checks: e,
    metrics: oe(),
    contextKeys: Object.keys(O),
    version: re,
    moduleId: se,
    timestamp: Date.now()
  };
}
function At() {
  return {
    moduleId: se,
    version: re,
    metrics: oe(),
    contextKeys: Object.keys(O),
    healthCheck: Ie(),
    timestamp: Date.now()
  };
}
const D = {
  evaluate: pe,
  evaluateAll: mt,
  isEnabled: Dt,
  getVariant: pt,
  getValue: It,
  setContext: vt,
  getContext: bt,
  getMetrics: oe,
  resetMetrics: Ot,
  healthCheck: Ie,
  info: At,
  VERSION: re,
  MODULE_ID: se
}, ae = "2.3.0-FORMAL-STATES", ie = "components.feature-flags.core.lifecycle", y = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  DEGRADED: "DEGRADED",
  SHUTTING_DOWN: "SHUTTING_DOWN"
}, s = {
  initialized: !1,
  mounted: !1,
  ready: !1,
  degraded: !1,
  shuttingDown: !1,
  lastInitAt: null,
  lastShutdownAt: null,
  lastResetAt: null
};
function Oe() {
  return s.shuttingDown ? y.SHUTTING_DOWN : s.degraded ? y.DEGRADED : s.ready ? y.READY : s.initialized ? y.INITIALIZING : y.NOT_INITIALIZED;
}
function Ct(e = {}) {
  return s.initialized = !0, s.shuttingDown = !1, s.lastInitAt = Date.now(), Promise.resolve(!0);
}
function St() {
  return s.mounted = !0, !0;
}
function wt() {
  return s.mounted = !1, !0;
}
function yt(e) {
  s.ready = e;
}
function Rt() {
  return s.initialized;
}
function _t() {
  return s.mounted;
}
function Tt() {
  return s.ready;
}
function $t() {
  return s.shuttingDown;
}
function kt(e) {
  s.degraded = e;
}
function Ae() {
  return { ...s };
}
function Ce() {
  return {
    phase: Oe(),
    initialized: s.initialized,
    mounted: s.mounted,
    ready: s.ready,
    shuttingDown: s.shuttingDown,
    lastInitAt: s.lastInitAt,
    lastShutdownAt: s.lastShutdownAt,
    lastResetAt: s.lastResetAt,
    uptime: s.lastInitAt ? Date.now() - s.lastInitAt : 0
  };
}
function Ft() {
  return s.shuttingDown = !0, s.ready = !1, s.mounted = !1, s.lastShutdownAt = Date.now(), Promise.resolve(!0);
}
function jt() {
  return s.initialized = !1, s.mounted = !1, s.ready = !1, s.degraded = !1, s.shuttingDown = !1, s.lastResetAt = Date.now(), Promise.resolve(!0);
}
function Se() {
  const e = {
    initialized: s.initialized,
    notShuttingDown: !s.shuttingDown,
    notDegraded: !s.degraded,
    stateConsistent: !(s.ready && !s.initialized)
  }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : t >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: t,
    maxScore: n,
    scoreDisplay: `${t}/${n}`,
    checks: e,
    phase: Oe(),
    version: ae,
    moduleId: ie,
    timestamp: Date.now()
  };
}
function Pt() {
  return {
    moduleId: ie,
    version: ae,
    state: Ae(),
    status: Ce(),
    healthCheck: Se(),
    timestamp: Date.now()
  };
}
const C = {
  init: Ct,
  mount: St,
  unmount: wt,
  setReady: yt,
  setDegraded: kt,
  isInitialized: Rt,
  isMounted: _t,
  isReady: Tt,
  isShuttingDown: $t,
  getState: Ae,
  getStatus: Ce,
  shutdown: Ft,
  reset: jt,
  healthCheck: Se,
  info: Pt,
  STATES: y,
  VERSION: ae,
  MODULE_ID: ie
}, g = "3.6.0-P2-ENTERPRISE", h = "components.feature-flags", we = Object.freeze({
  READY: "feature-flags:ready",
  ERROR: "feature-flags:error",
  SERVER_UPDATED: "feature-flags:server:updated"
}), k = de({ moduleId: h }), Nt = () => k.init(), Y = (e) => k.get(e), Lt = (e) => k.inject(e), Mt = () => k.snapshot(), ye = () => {
  var e, t;
  return (t = (e = Y("config")) == null ? void 0 : e.app) == null ? void 0 : t.debug;
}, L = (e, ...t) => {
  var n, r, i;
  const a = Y("logger");
  a && (e === "error" ? (n = a.error) == null || n.call(a, `[${h}]`, ...t) : e === "warn" ? (r = a.warn) == null || r.call(a, `[${h}]`, ...t) : ye() && ((i = a.debug) == null || i.call(a, `[${h}]`, ...t)));
};
let I = !1;
const f = { fetchCount: 0, checkCount: 0, errorCount: 0, lastActivity: null }, b = /* @__PURE__ */ new Map(), U = (e, t) => {
  b.has(e) && b.get(e).forEach((r) => {
    try {
      r(t);
    } catch (i) {
      L("error", "Listener error:", i);
    }
  });
  const n = Y("eventBus");
  if (n != null && n.emit) {
    const r = we[e.toUpperCase()] || `${j.PREFIX}${e}`;
    n.emit(r, t);
  }
}, zt = (e, t) => (b.has(e) || b.set(e, /* @__PURE__ */ new Set()), b.get(e).add(t), () => b.get(e).delete(t)), Vt = (e, t) => {
  b.has(e) && (t ? b.get(e).delete(t) : b.delete(e));
}, G = (e, t = {}) => {
  var n;
  f.lastActivity = Date.now();
  const r = Y("telemetry");
  (n = r == null ? void 0 : r.track) == null || n.call(r, `${h}:${e}`, { ...t, timestamp: Date.now() });
}, q = (e) => Qe(e, f, U, G), xt = (e) => Xe(e, f, U, G), Ut = (e, t = !1) => {
  const n = D.isEnabled(e);
  if (n != null) return n;
  const r = _();
  return r[e] ? r[e].enabled : t;
}, Gt = (e = {}) => I ? Promise.resolve({ success: !0, version: g }) : (be(new AbortController()), v("flags:api:init:called"), Nt(), C.init(e).then((t) => (ft(q), gt(), e.fetchFromServer !== !1 ? q(e.environment || "production").then(() => (I = !0, G("ready", { version: g }), U("ready", { initialized: !0 }), L("info", `${g} initialized`), t)) : (I = !0, G("ready", { version: g }), U("ready", { initialized: !0 }), L("info", `${g} initialized`), t)))), Re = () => {
  v("flags:api:shutdown:called"), dt(), ht();
  const e = J();
  return e && (e.abort(), be(null)), me(), I = !1, C.shutdown();
}, Ht = () => {
  Re(), b.clear(), L("info", "Destroyed");
}, Bt = () => (v("flags:api:reset:called"), me(), f.fetchCount = 0, f.checkCount = 0, f.errorCount = 0, f.lastActivity = null, L("info", "Reset complete"), C.reset());
function le() {
  const e = k.snapshot(), t = _(), n = {
    initialized: I && C.isInitialized(),
    storeAvailable: !!A,
    registryAvailable: !!u,
    evaluatorAvailable: !!D,
    lifecycleAvailable: !!C,
    abortControllerActive: !!J() && !J().signal.aborted,
    globalStateConnected: ne().length > 0,
    orchestratorConnected: te().length > 0,
    serverFlagsLoaded: Object.keys(t).length > 0,
    lowErrorRate: f.errorCount < (f.fetchCount + f.checkCount) * 0.1 || f.fetchCount === 0,
    portsInitialized: e._initialized
  }, r = Object.values(n).filter(Boolean).length, i = Object.keys(n).length;
  return {
    status: r < i * 0.5 ? "UNHEALTHY" : r < i ? "DEGRADED" : "HEALTHY",
    score: r,
    maxScore: i,
    scoreDisplay: `${r}/${i}`,
    checks: n,
    version: g,
    moduleId: h,
    serverFlagsCount: Object.keys(t).length,
    portsInitialized: e._initialized,
    timestamp: Date.now()
  };
}
const Yt = () => ({
  name: h,
  version: g,
  initialized: I,
  serverFlagsCount: Object.keys(_()).length,
  lastFetchTime: V(),
  orchestratorConnected: te().length > 0,
  globalStateConnected: ne().length > 0,
  metrics: { ...f },
  healthCheck: le()
}), _e = () => ({ ...f });
function Zt() {
  const e = k.snapshot();
  return {
    name: h,
    version: g,
    initialized: I,
    status: C.getStatus(),
    serverFlagsCount: Object.keys(_()).length,
    lastFetchTime: V(),
    orchestratorConnected: te().length > 0,
    globalStateConnected: ne().length > 0,
    metrics: _e(),
    healthCheck: le(),
    portsInitialized: e._initialized,
    timestamp: Date.now()
  };
}
const fe = {
  version: g,
  name: h,
  VERSION: g,
  MODULE_ID: h,
  LOCAL_EVENTS: we,
  init: Gt,
  shutdown: Re,
  destroy: Ht,
  reset: Bt,
  injectPorts: Lt,
  getPorts: Mt,
  fetchFromServer: q,
  checkOnServer: xt,
  getServerFlags: _,
  isEnabledWithServer: Ut,
  getLastFetchTime: V,
  isEnabled: (e) => D.isEnabled(e),
  getVariant: (e) => D.getVariant(e),
  getValue: (e, t) => D.getValue(e, t),
  register: (e, t) => u.register(e, t),
  unregister: (e) => u.unregister(e),
  update: (e, t) => u.update(e, t),
  enable: (e) => u.enable(e),
  disable: (e) => u.disable(e),
  setPercentage: (e, t) => u.setPercentage(e, t),
  setOverride: (e, t) => A.setOverride(e, t),
  removeOverride: (e) => A.removeOverride(e),
  clearOverrides: () => A.clearOverrides(),
  setContext: (e) => D.setContext(e),
  getContext: () => D.getContext(),
  list: () => u.list(),
  getAll: () => u.getAll(),
  evaluateAll: () => D.evaluateAll(),
  on: zt,
  off: Vt,
  subscribe: (e) => A.subscribe(e),
  healthCheck: le,
  getStatus: Yt,
  getMetrics: _e,
  info: Zt,
  status: () => C.getStatus(),
  isInitialized: () => I,
  getVersion: () => g,
  debug: {
    getEventLog: Je,
    getRecentEvents: qe,
    getStore: () => A.toJSON(),
    getServerFlags: _,
    getLastFetchTime: V
  }
};
typeof window < "u" && ($e() ? ke("FEATURE_FLAGS_STRICT_MODE_BLOCK", {
  module: h,
  action: "window.FeatureFlags exposure blocked"
}) : (window.FeatureFlags = fe, v("flags:global:exposed")), ye() && (window.__dev = window.__dev || {}, window.__dev.featureFlags = fe));
export {
  fe as FeatureFlags,
  C as FeatureFlagsLifecycle,
  D as FlagEvaluator,
  u as FlagRegistry,
  we as LOCAL_EVENTS,
  h as MODULE_ID,
  g as VERSION,
  fe as default,
  A as featureFlagsStore,
  Mt as getPorts,
  le as healthCheck,
  Zt as info,
  Lt as injectPorts
};
