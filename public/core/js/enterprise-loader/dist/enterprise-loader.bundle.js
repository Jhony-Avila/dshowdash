import { createCorePorts as se } from "/core/runtime/ports-profiles.js";
import { BOOT_EVENTS as ue } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const _ = Object.freeze([
  { name: "ErrorBoundary", path: "/components/error-boundary/index.js", critical: !0, initOptions: { ignoredMessages: ["ResizeObserver loop"], ignoredTypes: [] } },
  { name: "CacheManager", path: "/components/cache-manager/index.js", critical: !0, initOptions: { maxSize: 500, defaultTTL: 3e5, policy: "lru", cleanupInterval: 6e4 } },
  { name: "NetworkMonitor", path: "/components/network-monitor/index.js", critical: !0, initOptions: { healthCheckInterval: 3e4, healthCheckUrl: "/api/health" } },
  { name: "ContextProvider", path: "/components/context-provider/index.js", critical: !1, initOptions: {} },
  { name: "SessionManager", path: "/components/session-manager/dist/session-manager.bundle.js", critical: !1, initOptions: { sessionTimeout: 36e5, renewThreshold: 3e5, persistSession: !0, checkOnInit: !0 } },
  { name: "PermissionsGuard", path: "/components/permissions-guard/index.js", critical: !1, initOptions: { defaultRole: "viewer", cachePermissions: !0 } },
  { name: "ThemeTokensLoader", path: "/assets/js/core/theme-tokens-loader/index.js", critical: !1, initOptions: {} },
  { name: "ThemeManager", path: "/assets/js/core/theme-manager/index.js", critical: !1, initOptions: { defaultTheme: "dark", persistTheme: !0, followSystem: !0 } },
  // LayoutManager REMOVED - Now initialized by phase-3-shell to avoid duplicate initialization
  { name: "AccessibilityManager", path: "/components/accessibility-manager/index.js", critical: !1, initOptions: { followSystem: !0 } },
  { name: "OverlayLayer", path: "/components/overlay-layer/index.js", critical: !1, initOptions: { baseZIndex: 1e3, enableKeyboard: !0 } },
  { name: "ModalManagerGlobal", path: "/components/modal-manager-global/index.js", critical: !1, initOptions: { legacyAdapter: !0 } },
  { name: "NotificationManager", path: "/components/notification-manager/index.js", critical: !1, initOptions: { position: "top-right", maxVisible: 5, enableSound: !1, enableNative: !1 } },
  { name: "AnalyticsManager", path: "/components/analytics-manager/index.js", critical: !1, initOptions: { trackPageViews: !0, trackInitialPageView: !0, flushInterval: 6e4 } },
  { name: "PerformanceMonitor", path: "/components/performance-monitor/index.js", critical: !1, initOptions: { monitorFPS: !0, monitorLongTasks: !0, collectionInterval: 3e4 } },
  { name: "FeatureFlags", path: "/components/feature-flags/index.js", critical: !1, initOptions: { loadFromStorage: !0, flags: { "dark-mode": { enabled: !0 }, "new-dashboard": { enabled: !1, percentage: 50 }, "advanced-analytics": { enabled: !0 } } } },
  { name: "SWController", path: "/components/sw-controller/index.js", critical: !1, initOptions: { autoRegister: !1 } },
  { name: "Carousel", path: "/components/carousel/index.js", critical: !1, initOptions: {} },
  { name: "Charts", path: "/components/charts/index.js", critical: !1, initOptions: {} },
  { name: "Animacoes", path: "/components/animacoes/index.js", critical: !1, initOptions: { preloadLottie: !1 } }
]), me = () => _.filter((i) => i.critical), ge = "5.4.0-P2-ENTERPRISE", ie = "core.js.enterprise-loader.constants", pe = se({ moduleId: ie });
function de(i) {
  return pe.get(i);
}
const fe = () => {
  var i, o;
  return ((o = (i = de("config")) == null ? void 0 : i.app) == null ? void 0 : o.debug) ?? !1;
}, he = (i, ...o) => {
  var s;
  const f = de("logger");
  f && fe() && ((s = f.debug) == null || s.call(f, `[${ie}]`, ...o));
}, ve = {
  INIT: "enterprise-loader:init",
  LOAD_START: "enterprise-loader:load-start",
  LOAD_SUCCESS: "enterprise-loader:load-success",
  LOAD_ERROR: "enterprise-loader:load-error",
  COMPONENT_READY: "enterprise-loader:component-ready",
  STAGE_COMPLETE: "enterprise-loader:stage-complete"
}, Ce = "enterprise-loader-telemetry-helper", ae = se({ moduleId: Ce });
let oe = !1;
function ce() {
  oe || (ae.init(), oe = !0);
}
function ye(i) {
  return ce(), ae.get(i);
}
function re(i) {
  return ae.inject(i);
}
function M(i, o) {
  o = o || {}, ce();
  const s = ve[i] || i;
  try {
    const f = ye("telemetry");
    f && f.track && f.track(s, Object.assign({}, o, {
      component: ie,
      version: ge,
      timestamp: Date.now()
    }));
  } catch {
  }
}
function v(i) {
  var o, s;
  return typeof window > "u" ? null : (s = (o = window.Core) == null ? void 0 : o.windowAdapter) != null && s.get ? window.Core.windowAdapter.get(i) : window[i] || null;
}
const Q = () => {
  var i, o, s, f, j, D, $, N, B, x, l, c, V, C, G, k, y, O, F, Y, H, U, z, P, q, W, Z, L, I, J, R, K, X, a;
  const n = v("Config"), e = v("Preloader") || v("PreloaderController"), r = v("Environment"), p = v("Logger"), d = v("TelemetryCore") || v("Telemetry"), u = v("Telemetry"), E = v("GlobalState"), h = v("GlobalStateManager"), g = v("RouterGlobal"), b = v("AppShell"), A = {
    configLoader: { available: !!n, version: (n == null ? void 0 : n.version) || ((i = n == null ? void 0 : n.getVersion) == null ? void 0 : i.call(n)) || null, ready: !!(((o = n == null ? void 0 : n.isReady) == null ? void 0 : o.call(n)) ?? n), healthCheck: ((s = n == null ? void 0 : n.healthCheck) == null ? void 0 : s.call(n)) || null },
    preloader: { available: !!e, version: ((f = e == null ? void 0 : e.getVersion) == null ? void 0 : f.call(e)) || null, ready: ((D = (j = e == null ? void 0 : e.getStatus) == null ? void 0 : j.call(e)) == null ? void 0 : D.ready) || !1, phase: ((N = ($ = e == null ? void 0 : e.getStatus) == null ? void 0 : $.call(e)) == null ? void 0 : N.phase) || null, healthCheck: ((B = e == null ? void 0 : e.healthCheck) == null ? void 0 : B.call(e)) || null },
    environment: { available: !!r, version: ((x = r == null ? void 0 : r.getVersion) == null ? void 0 : x.call(r)) || null, mode: ((l = r == null ? void 0 : r.get) == null ? void 0 : l.call(r, "mode")) || ((c = r == null ? void 0 : r.getMode) == null ? void 0 : c.call(r)) || null, environment: ((V = r == null ? void 0 : r.get) == null ? void 0 : V.call(r, "environment")) || null, healthCheck: ((C = r == null ? void 0 : r.healthCheck) == null ? void 0 : C.call(r)) || null },
    logger: { available: !!p, version: ((G = p == null ? void 0 : p.getVersion) == null ? void 0 : G.call(p)) || null, ready: ((k = p == null ? void 0 : p.isReady) == null ? void 0 : k.call(p)) ?? !!p, healthCheck: ((y = p == null ? void 0 : p.healthCheck) == null ? void 0 : y.call(p)) || null },
    telemetryCore: { available: !!d, version: ((O = d == null ? void 0 : d.getVersion) == null ? void 0 : O.call(d)) || ((F = u == null ? void 0 : u.getVersion) == null ? void 0 : F.call(u)) || null, ready: ((Y = d == null ? void 0 : d.isReady) == null ? void 0 : Y.call(d)) ?? ((H = u == null ? void 0 : u.isReady) == null ? void 0 : H.call(u)) ?? !!u, healthCheck: ((U = d == null ? void 0 : d.healthCheck) == null ? void 0 : U.call(d)) || ((z = u == null ? void 0 : u.healthCheck) == null ? void 0 : z.call(u)) || null },
    globalState: { available: !!(E || h), version: ((P = h == null ? void 0 : h.getVersion) == null ? void 0 : P.call(h)) || (E == null ? void 0 : E.version) || null, ready: (h == null ? void 0 : h.isInitialized) ?? !!E, healthCheck: ((q = h == null ? void 0 : h.healthCheck) == null ? void 0 : q.call(h)) || ((W = E == null ? void 0 : E.healthCheck) == null ? void 0 : W.call(E)) || null },
    router: { available: !!g, version: ((Z = g == null ? void 0 : g.getVersion) == null ? void 0 : Z.call(g)) || null, ready: ((L = g == null ? void 0 : g.isReady) == null ? void 0 : L.call(g)) ?? !!g, currentRoute: ((J = (I = g == null ? void 0 : g.current) == null ? void 0 : I.call(g)) == null ? void 0 : J.path) || null, healthCheck: ((R = g == null ? void 0 : g.healthCheck) == null ? void 0 : R.call(g)) || null },
    appShell: { available: !!b, version: ((K = b == null ? void 0 : b.getVersion) == null ? void 0 : K.call(b)) || null, ready: ((X = b == null ? void 0 : b.isReady) == null ? void 0 : X.call(b)) ?? !!b, healthCheck: ((a = b == null ? void 0 : b.healthCheck) == null ? void 0 : a.call(b)) || null }
  };
  let ee = 0, te = 0;
  const ne = Object.keys(A).length;
  for (const le of Object.keys(A))
    A[le].available && ee++, A[le].ready && te++;
  return { loaders: A, summary: { total: ne, available: ee, ready: te, availablePercent: Math.round(ee / ne * 100), readyPercent: Math.round(te / ne * 100) }, timestamp: Date.now() };
}, t = { initialized: !1, initTimestamp: null, loadStartTime: null, components: {}, loadedComponents: [], initializedComponents: [], failedComponents: [], stageResults: {} }, m = { loadAttempts: 0, initAttempts: 0, componentLoadErrors: 0, componentInitErrors: 0, totalLoadTime: 0, totalInitTime: 0, lastLoadAt: null, lastInitAt: null }, be = () => {
  t.initialized = !1, t.initTimestamp = null, t.loadStartTime = null, t.components = {}, t.loadedComponents = [], t.initializedComponents = [], t.failedComponents = [], t.stageResults = {};
}, _e = () => {
  m.loadAttempts = 0, m.initAttempts = 0, m.componentLoadErrors = 0, m.componentInitErrors = 0, m.totalLoadTime = 0, m.totalInitTime = 0, m.lastLoadAt = null, m.lastInitAt = null;
}, we = () => {
  be(), _e();
}, Ee = async (i) => {
  try {
    const o = await import(i.path), s = o.default || o[i.name];
    return s ? (t.components[i.name] = s, window[i.name] = s, t.loadedComponents.push(i.name), M("component:loaded", { name: i.name, critical: i.critical }), { success: !0, name: i.name }) : { success: !1, name: i.name, error: "No instance exported" };
  } catch (o) {
    return m.componentLoadErrors++, t.failedComponents.push({ name: i.name, error: o.message, critical: i.critical, stage: "load" }), M("component:load-error", { name: i.name, error: o.message, critical: i.critical }), { success: !1, name: i.name, error: o.message };
  }
}, Te = async (i) => {
  const o = t.components[i.name];
  if (!o) return { success: !1, name: i.name, error: "Not loaded" };
  try {
    return typeof o.init == "function" && await o.init(i.initOptions || {}), t.initializedComponents.push(i.name), M("component:initialized", { name: i.name }), { success: !0, name: i.name };
  } catch (s) {
    return m.componentInitErrors++, t.failedComponents.push({ name: i.name, error: s.message, critical: i.critical, stage: "init" }), M("component:init-error", { name: i.name, error: s.message, critical: i.critical }), { success: !1, name: i.name, error: s.message };
  }
}, S = "6.3.0-P2-ENTERPRISE", T = "core.js.enterprise-loader";
function Se(i = {}) {
  const {
    eventBus: o = null,
    globalState: s = null,
    contextProvider: f = null,
    telemetry: j = null,
    stateManager: D = null,
    cacheManager: $ = null,
    logger: N = null,
    config: B = null
  } = i;
  let x = !1, l = { eventBus: o, globalState: s, contextProvider: f, telemetry: j, stateManager: D, cacheManager: $, logger: N, config: B };
  function c(a, ...n) {
    const e = l.logger;
    if (e) {
      if (a === "error" && e.error) {
        e.error(`[${T}]`, ...n);
        return;
      }
      if (a === "warn" && e.warn) {
        e.warn(`[${T}]`, ...n);
        return;
      }
      if (a === "info" && e.info) {
        e.info(`[${T}]`, ...n);
        return;
      }
      e.debug && e.debug(`[${T}]`, ...n);
    }
  }
  function V(a, n = {}) {
    const e = l.eventBus;
    e && e.emit && e.emit(a, { ...n, source: T, timestamp: Date.now() });
  }
  function C(a, n = {}) {
    M(a, { ...n, version: S });
  }
  function G(a = {}) {
    return a.eventBus && (l.eventBus = a.eventBus), a.globalState && (l.globalState = a.globalState), a.contextProvider && (l.contextProvider = a.contextProvider), a.telemetry && (l.telemetry = a.telemetry), a.stateManager && (l.stateManager = a.stateManager), a.cacheManager && (l.cacheManager = a.cacheManager), a.logger && (l.logger = a.logger), a.config && (l.config = a.config), re({ telemetry: l.telemetry, eventBus: l.eventBus }), x = !0, l;
  }
  function k() {
    return { ...l, _initialized: x };
  }
  function y(a) {
    var n, e;
    return typeof window > "u" ? null : (e = (n = window.Core) == null ? void 0 : n.windowAdapter) != null && e.get ? window.Core.windowAdapter.get(a) : window[a] || null;
  }
  function O() {
    x || typeof window > "u" || (l.eventBus || (l.eventBus = y("EventBus")), l.globalState || (l.globalState = y("GlobalState")), l.contextProvider || (l.contextProvider = y("ContextProvider")), l.telemetry || (l.telemetry = y("Telemetry")), l.stateManager || (l.stateManager = y("StateManager")), l.cacheManager || (l.cacheManager = y("CacheManager")), l.logger || (l.logger = y("LoggerGlobal")), l.config || (l.config = y("APP_CONFIG")), re({ telemetry: l.telemetry, eventBus: l.eventBus }), x = !0);
  }
  function F() {
    return S;
  }
  function Y() {
    return T;
  }
  function H() {
    return t.initialized;
  }
  function U() {
    return Q();
  }
  async function z(a = {}) {
    O(), m.loadAttempts++, t.loadStartTime = performance.now(), C("load:start", { componentsCount: _.length }), c("info", "🏢 Enterprise Components Loader - Starting...");
    for (const e of _) {
      const r = await Ee(e);
      r.success ? c("info", `  ✓ ${e.name} loaded`) : e.critical ? c("error", `  ✗ ${e.name} FAILED (critical):`, r.error) : c("warn", `  ⚠ ${e.name} skipped:`, r.error);
    }
    const n = Math.round(performance.now() - t.loadStartTime);
    return m.totalLoadTime = n, m.lastLoadAt = Date.now(), C("load:complete", {
      loaded: t.loadedComponents.length,
      failed: t.failedComponents.filter((e) => e.stage === "load").length,
      loadTime: n
    }), c("info", `📦 Components loaded: ${t.loadedComponents.length}/${_.length} in ${n}ms`), {
      success: !0,
      loaded: t.loadedComponents,
      failed: t.failedComponents.filter((e) => e.stage === "load"),
      loadTime: n
    };
  }
  async function P(a = {}) {
    if (t.initialized && !a.force)
      return C("init:already-initialized"), c("info", "🏢 Already initialized, returning status"), L();
    O(), m.initAttempts++;
    const n = performance.now();
    C("init:start"), c("info", "🏢 Enterprise Components - Initializing..."), t.loadedComponents.length === 0 && await z(a);
    for (const d of _) {
      if (!t.components[d.name]) continue;
      const u = await Te(d);
      u.success ? c("info", `  ✓ ${d.name} initialized`) : c("error", `  ✗ ${d.name} init failed:`, u.error);
    }
    const e = Math.round(performance.now() - n), r = Math.round(performance.now() - (t.loadStartTime || n));
    m.totalInitTime = e, m.lastInitAt = Date.now(), t.initialized = !0, t.initTimestamp = Date.now(), V(ue.ENTERPRISE_READY, {
      initialized: t.initializedComponents,
      failed: t.failedComponents,
      totalTime: r,
      version: S
    });
    const p = t.failedComponents.length > 0;
    return C(p ? "init:degraded" : "init:complete", {
      initialized: t.initializedComponents.length,
      failed: t.failedComponents.length,
      initTime: e,
      totalTime: r
    }), c("info", `✅ Enterprise Components ready: ${t.initializedComponents.length}/${_.length} in ${r}ms`), L();
  }
  async function q(a = {}) {
    return P(a);
  }
  function W(a) {
    return t.components[a] || null;
  }
  function Z() {
    return { ...t.components };
  }
  function L() {
    O();
    const a = Q();
    return {
      moduleId: T,
      version: S,
      initialized: t.initialized,
      initTimestamp: t.initTimestamp,
      components: {
        total: _.length,
        loaded: t.loadedComponents.length,
        initialized: t.initializedComponents.length,
        failed: t.failedComponents.length,
        list: {
          loaded: [...t.loadedComponents],
          initialized: [...t.initializedComponents],
          failed: t.failedComponents.map((n) => ({ name: n.name, error: n.error, stage: n.stage }))
        }
      },
      externalLoaders: a,
      integrations: {
        eventBus: { available: !!l.eventBus },
        globalState: { available: !!l.globalState },
        contextProvider: { available: !!l.contextProvider },
        telemetry: { available: !!l.telemetry },
        stateManager: { available: !!l.stateManager },
        cacheManager: { available: !!l.cacheManager },
        logger: { available: !!l.logger },
        config: { available: !!l.config }
      },
      metrics: { ...m },
      stageResults: { ...t.stageResults },
      uptime: t.initTimestamp ? Date.now() - t.initTimestamp : 0,
      portsStatus: { initialized: x },
      timestamp: Date.now()
    };
  }
  function I() {
    O();
    const a = L(), n = a.externalLoaders, e = [];
    a.integrations.eventBus.available || e.push("eventbus-missing"), a.integrations.globalState.available || e.push("globalstate-missing"), a.integrations.contextProvider.available || e.push("contextprovider-missing"), a.integrations.telemetry.available || e.push("telemetry-missing"), n.loaders.configLoader.available || e.push("external:config-loader-missing"), n.loaders.preloader.available || e.push("external:preloader-missing"), n.loaders.environment.available || e.push("external:environment-missing"), n.loaders.logger.available || e.push("external:logger-missing"), n.loaders.router.available || e.push("external:router-missing");
    const r = me();
    for (const g of r)
      t.initializedComponents.includes(g.name) || e.push(`critical-component-failed:${g.name}`);
    t.failedComponents.length / _.length > 0.3 && e.push("high-failure-rate"), t.initialized || e.push("not-initialized");
    const d = 9 + r.length + 2, u = e.length, E = d - u;
    let h = "HEALTHY";
    return u > 0 && u <= 4 && (h = "DEGRADED"), u > 4 && (h = "UNHEALTHY"), {
      status: h,
      score: E,
      maxScore: d,
      scoreDisplay: `${E}/${d}`,
      issues: e.length > 0 ? e : null,
      components: {
        initialized: t.initializedComponents.length,
        failed: t.failedComponents.length,
        total: _.length
      },
      externalLoaders: {
        available: n.summary.available,
        ready: n.summary.ready,
        total: n.summary.total
      },
      integrations: a.integrations,
      version: S,
      moduleId: T,
      p24Instrumented: !0,
      timestamp: Date.now()
    };
  }
  function J() {
    const a = Q();
    return {
      ...L(),
      healthCheck: I(),
      registry: _.map((n) => ({
        name: n.name,
        critical: n.critical,
        loaded: t.loadedComponents.includes(n.name),
        initialized: t.initializedComponents.includes(n.name)
      })),
      externalLoadersDetail: a.loaders,
      architecture: "FACTORY-PATTERN-P24",
      p24Instrumented: !0
    };
  }
  function R() {
    C("shutdown:start"), c("info", "🏢 Enterprise Components - Shutting down...");
    const a = [...t.initializedComponents].reverse();
    for (const n of a)
      if (t.components[n] && typeof t.components[n].shutdown == "function")
        try {
          t.components[n].shutdown(), c("info", `  ✓ ${n} shutdown`);
        } catch (e) {
          c("error", `  ✗ ${n} shutdown failed:`, e.message);
        }
    C("shutdown:complete", { shutdownCount: a.length }), c("info", "🏢 Shutdown complete");
  }
  function K() {
    R(), we(), C("reset:complete"), c("info", "🏢 EnterpriseLoader reset");
  }
  return Object.freeze({
    // Identity
    getVersion: F,
    getModuleId: Y,
    VERSION: S,
    MODULE_ID: T,
    // Lifecycle
    load: z,
    init: P,
    loadAll: q,
    shutdown: R,
    reset: K,
    // State
    isInitialized: H,
    getComponent: W,
    getComponents: Z,
    getExternalLoaders: U,
    // Diagnostics
    getStatus: L,
    healthCheck: I,
    info: J,
    // Ports (P24)
    injectPorts: G,
    getPorts: k,
    // Debug
    debug: {
      getRegistry: () => _,
      getComponents: () => ({ ...t.components }),
      getMetrics: () => ({ ...m }),
      getStageResults: () => ({ ...t.stageResults }),
      getFailed: () => [...t.failedComponents],
      getExternalLoaders: () => Q(),
      getPorts: () => k()
    }
  });
}
const w = Se();
typeof window < "u" && (window.EnterpriseLoader = w, window.__dev = window.__dev || {}, window.__dev.enterpriseLoader = {
  getVersion: () => S,
  info: () => w.info(),
  healthCheck: () => w.healthCheck(),
  getStatus: () => w.getStatus(),
  getExternalLoaders: () => w.getExternalLoaders(),
  debug: w.debug,
  reset: () => w.reset(),
  injectPorts: (i) => w.injectPorts(i),
  getPorts: () => w.getPorts()
});
he("info", `🏢 ${S} loaded (Factory Pattern P24)`);
M("loaded", { version: S, architecture: "factory-pattern" });
function Oe(i) {
  return w.injectPorts(i);
}
function Me() {
  return w.getPorts();
}
export {
  T as MODULE_ID,
  S as VERSION,
  Se as createEnterpriseLoader,
  w as default,
  Me as getPorts,
  Oe as injectPorts
};
