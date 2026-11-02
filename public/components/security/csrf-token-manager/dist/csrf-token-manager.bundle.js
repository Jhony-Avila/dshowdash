import { createCorePorts as D } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS as Ne, AUTH_INTENTS as Fe, SECURITY_EVENTS as He, TELEMETRY_INTENTS as Le } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { AUTH_EVENTS as Lt } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const B = "2.1.0-ENTERPRISE-FIX", P = "csrf-token-manager-store";
let i = { token: null, expiresAt: null, refreshing: !1, lastRefresh: null, initialized: !1 }, V = {}, j = {}, T = [], d = {}, G = { refreshCount: 0, errorCount: 0, lastError: null };
function ze(e = {}, t = {}) {
  V = { ...e }, j = { ...t }, i.initialized = !0;
}
function xe() {
  return i.initialized;
}
function ae() {
  return { ...i };
}
function Ue() {
  return i.token;
}
function Me() {
  return { ...V };
}
function Be() {
  return { ...j };
}
function Pe() {
  return { ...G, state: ae() };
}
function Ve(e, t = null) {
  i.token = e, i.expiresAt = t, i.lastRefresh = Date.now(), G.refreshCount++, X();
}
function je(e) {
  i.refreshing = e, X();
}
function Ge() {
  i.token = null, i.expiresAt = null, X();
}
function q() {
  return i.token && (!i.expiresAt || i.expiresAt > Date.now());
}
function qe(e) {
  return typeof e == "function" && T.push(e), () => {
    T = T.filter((t) => t !== e);
  };
}
function X() {
  T.forEach((e) => {
    try {
      e(i);
    } catch {
    }
  });
}
function Xe(e, t) {
  d[e] || (d[e] = []), typeof t == "function" && d[e].push(t);
}
function Ke(e, t) {
  d[e] && (d[e] = d[e].filter((n) => n !== t));
}
function We(e) {
  return d[e] || [];
}
function Ye() {
  i = { token: null, expiresAt: null, refreshing: !1, lastRefresh: null, initialized: !1 }, V = {}, j = {}, T = [], d = {}, G = { refreshCount: 0, errorCount: 0, lastError: null };
}
function Je() {
  const e = { hasState: !0, initialized: i.initialized, hasToken: !!i.token, tokenValid: q() }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return { status: t === n ? "HEALTHY" : t >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${t}/${n}`, checks: e, refreshing: i.refreshing, version: B, moduleId: P, timestamp: Date.now() };
}
function Qe() {
  return { moduleId: P, version: B, initialized: i.initialized, hasToken: !!i.token, isValid: q(), refreshing: i.refreshing, timestamp: Date.now() };
}
const u = {
  init: ze,
  isInitialized: xe,
  getState: ae,
  getToken: Ue,
  getConfig: Me,
  getDeps: Be,
  getStats: Pe,
  setToken: Ve,
  setRefreshing: je,
  clearToken: Ge,
  isValid: q,
  subscribe: qe,
  addHandler: Xe,
  removeHandler: Ke,
  getHandlers: We,
  reset: Ye,
  healthCheck: Je,
  info: Qe,
  VERSION: B,
  MODULE_ID: P
};
let f = null, l = null, g = null;
const Ze = 36e5;
let K = Ze;
function ce() {
  return f;
}
function le(e, t = null) {
  f = e, g = Date.now(), l = t || g + K, typeof window < "u" && (window.CSRF_TOKEN = e);
}
function et(e = null) {
  return e ? (le(e), !0) : f ? (g = Date.now(), l = g + K, !0) : !1;
}
function tt() {
  f = null, l = null, g = null, typeof window < "u" && (window.CSRF_TOKEN = null);
}
function W() {
  return f ? l ? Date.now() < l : !0 : !1;
}
function nt() {
  return f ? l ? l - Date.now() < K * 0.1 : !1 : !0;
}
function h() {
  const e = Date.now(), t = g ? e - g : null;
  return {
    hasToken: !!f,
    tokenPreview: f ? `${f.substring(0, 8)}...` : null,
    isFresh: W(),
    isStale: nt(),
    expiresAt: l,
    lastRefresh: g,
    age: t,
    ageFormatted: t ? `${Math.round(t / 1e3)}s` : "N/A",
    remainingMs: l ? Math.max(0, l - e) : null
  };
}
let rt = null;
function it() {
  return rt;
}
function fe() {
  if (typeof window < "u" && window.CSRF_TOKEN)
    return window.CSRF_TOKEN;
  if (typeof document < "u") {
    const e = document.querySelector('meta[name="csrf-token"]');
    if (e) return e.getAttribute("content");
  }
  return null;
}
function Y() {
  const e = fe();
  return e ? {
    "X-CSRF-TOKEN": e,
    "X-Requested-With": "XMLHttpRequest"
  } : {};
}
function J() {
  return Y();
}
function de() {
  const e = J();
  return !!e["X-CSRF-TOKEN"] || !!e.Authorization;
}
function C() {
  const e = fe(), t = it();
  return {
    hasCsrfToken: !!e,
    hasBearerToken: !1,
    csrfTokenPreview: e ? `${e.substring(0, 8)}...` : null,
    bearerTokenPreview: t ? `${t.substring(0, 8)}...` : null,
    headersAvailable: de()
  };
}
const st = "security.csrf-token-manager.core.events", ot = D({ moduleId: st });
function ut(e) {
  return ot.get(e);
}
function ge(e, t) {
  const n = ut("eventBus");
  n && n.emit && n.emit(e, t);
}
function at(e, t) {
  ge(e, t);
}
function ct(e = "unknown", t = {}) {
  ge(Fe.LOGIN, Object.assign({ reason: e, timestamp: Date.now() }, t));
}
const he = "security.csrf-token-manager.telemetry.tracker", lt = D({ moduleId: he });
function ft(e) {
  return lt.get(e);
}
const R = Object.freeze({ CSRF_REFRESHED: "security:csrf:refreshed", CSRF_ENSURE_FRESH: "security:csrf:ensure-fresh", CSRF_ERROR: "security:csrf:error", AUTH_CHANGED: "security:auth:changed", SESSION_EXPIRED: "security:session:expired", MODULE_INIT: "security:module:init", MODULE_SHUTDOWN: "security:module:shutdown", MODULE_RESET: "security:module:reset", TOKEN_REFRESH: "security:token:refresh", TOKEN_INVALID: "security:token:invalid" }), $ = { initialized: !1, config: null }, a = { events: 0, tokenRefreshes: 0, errors: 0, lastEventAt: null }, k = [], dt = 100;
function ie(e) {
  $.initialized || ($.initialized = !0, $.config = e || {});
}
function H(e, t = {}) {
  a.events++, a.lastEventAt = Date.now(), e.indexOf("error") > -1 && a.errors++, e.indexOf("refresh") > -1 && a.tokenRefreshes++;
  const n = { type: e, data: t, timestamp: Date.now() };
  k.unshift(n), k.length > dt && k.pop();
  const r = ft("eventBus");
  r && r.emit && r.emit(Le.TRACK, { source: he, event: e, data: t, timestamp: Date.now() });
}
function Ee(e) {
  return k.slice(0, e || 10);
}
function Se() {
  k.length = 0, gt();
}
function Q() {
  return { initialized: $.initialized, totalEvents: a.events, recentEventsCount: k.length, errors: a.errors, tokenRefreshes: a.tokenRefreshes, lastEventAt: a.lastEventAt };
}
function gt() {
  a.events = 0, a.tokenRefreshes = 0, a.errors = 0, a.lastEventAt = null;
}
function Z() {
  return typeof window < "u" && typeof document < "u";
}
function ee() {
  return Date.now();
}
function ht(e, t = 8) {
  return !e || typeof e != "string" ? null : e.length <= t ? "***" : `${e.substring(0, t)}...`;
}
const Et = "security.csrf-token-manager.utils.logger", St = D({ moduleId: Et });
function me(e) {
  return St.get(e);
}
let L = { debug: !1, namespace: "CSRF" };
function mt() {
  if (L.debug) return !0;
  const e = me("config");
  return !!(e && e.app && e.app.debug);
}
function ke(e, t, n, r) {
  const o = me("logger");
  if (!o) return;
  const m = o[e] || o.info;
  typeof m == "function" && (r != null ? m(t, n, r) : m(t, n));
}
function kt(e = {}) {
  const t = e.security || {};
  L = { debug: e.debug !== void 0 ? e.debug : t.csrfDebug !== void 0 ? t.csrfDebug : !1, namespace: e.namespace || "CSRF" };
}
function w(e, t, n) {
  if (mt()) {
    const r = `[${L.namespace}:${e}]`;
    ke("info", r, t, n);
  }
}
function A(e, t, n) {
  const r = `[${L.namespace}:${e}]`;
  ke("error", r, t, n);
}
const pt = "2.4.0-P18EC", pe = "security.csrf-token-manager.infra.event-bridge", z = D({ moduleId: pe });
function p(e) {
  return z.get(e);
}
let U = [], y = !1, _ = !1, N = [];
function It(e, t) {
  const n = p("eventBus");
  n && n.emit && n.emit(e, t);
}
function Tt(e) {
  return y ? !0 : (e && z.inject({ eventBus: e }), p("eventBus") ? (y = !0, !0) : !1);
}
function Ie() {
  if (!y) return !0;
  const e = p("eventBus");
  return U.forEach((t) => {
    e && e.off && e.off(t.event, t.handler);
  }), U = [], y = !1, !0;
}
function bt(e) {
  if (_) return !0;
  e && z.inject({ globalState: e });
  const t = p("globalState");
  if (t) {
    if (_ = !0, typeof t.subscribe == "function") {
      const n = t.subscribe((r) => {
        r && r.session && It(He.SESSION_CHANGED, { session: r.session });
      });
      N.push(n);
    }
    return !0;
  }
  return !1;
}
function Te() {
  return _ && (N.forEach((e) => {
    typeof e == "function" && e();
  }), N = [], _ = !1), !0;
}
function Rt() {
  Ie(), Te();
}
function te() {
  return { moduleId: pe, version: pt, portsInitialized: z.isInitialized(), eventBusConnected: y, globalStateConnected: _, hasEventBus: !!p("eventBus"), hasGlobalState: !!p("globalState"), listenerCount: U.length, subscriptionCount: N.length, timestamp: Date.now() };
}
const v = "csrf-token-manager", c = "1.2.0-ENTERPRISE", s = { initialized: !1, initCount: 0, lastInit: null, shutdownCount: 0 };
function wt(e = {}, t = {}) {
  try {
    return kt(e), s.initialized ? (u.init(e, t), ie(e), w("Lifecycle", `SecurityCSRF reused (init #${s.initCount})`), !0) : (u.init(e, t), ie(e), s.initialized = !0, s.initCount++, s.lastInit = ee(), H(R.MODULE_INIT, { version: c, initCount: s.initCount, hasTokenStore: !!t.tokenStore, hasEventBus: !!t.eventBus, authEventsIntegrated: !0 }), w("Lifecycle", `SecurityCSRF ${c} initialized (AUTH_EVENTS integrated)`, { initCount: s.initCount }), !0);
  } catch (n) {
    return A("Lifecycle", "init failed", n), !1;
  }
}
function ne() {
  return s.initialized && u.isInitialized();
}
function be() {
  return ne() && Z();
}
function yt() {
  try {
    return s.initialized ? (H(R.MODULE_SHUTDOWN, { version: c, uptime: s.lastInit ? ee() - s.lastInit : 0 }), u.reset(), s.initialized = !1, s.shutdownCount++, w("Lifecycle", "SecurityCSRF shutdown complete"), !0) : (w("Lifecycle", "SecurityCSRF already shutdown"), !0);
  } catch (e) {
    return A("Lifecycle", "shutdown failed", e), !1;
  }
}
function _t() {
  try {
    return u.clearToken(), H(R.MODULE_RESET, { version: c }), w("Lifecycle", "SecurityCSRF reset complete"), !0;
  } catch (e) {
    return A("Lifecycle", "reset failed", e), !1;
  }
}
function Re() {
  return { initialized: s.initialized, initCount: s.initCount, lastInit: s.lastInit, shutdownCount: s.shutdownCount, uptime: s.lastInit ? ee() - s.lastInit : 0 };
}
function we() {
  try {
    const e = h(), t = C(), n = u.getStats(), r = Q(), o = u.getConfig(), m = te(), re = u.getDeps();
    return { moduleId: v, version: c, lifecycle: Re(), csrf: e, headers: t, config: { namespace: o.namespace, context: o.context, maxAge: o.maxAge, debug: o.debug, autoRenew: o.autoRenew }, stats: n, telemetry: r, integrations: { eventBus: !!re.eventBus, globalState: m.hasGlobalState, tokenStore: !!re.tokenStore, authEventsIntegrated: !0 }, bridge: m, isBrowser: Z() };
  } catch (e) {
    return A("Lifecycle", "info failed", e), { moduleId: v, version: c, error: e.message };
  }
}
function ye() {
  return { moduleId: v, version: c, isReady: be(), isInitialized: ne(), hasCsrfToken: h().hasToken, isFresh: W(), authEventsIntegrated: !0 };
}
function x() {
  const e = { moduleInitialized: !1, storeReady: !1, hasToken: !1, tokenFresh: !1, configValid: !1, browserEnv: !1, authEventsAvailable: !1 };
  try {
    e.moduleInitialized = s.initialized, e.storeReady = u.isInitialized(), e.browserEnv = Z();
    const r = h();
    e.hasToken = r.hasToken, e.tokenFresh = r.hasToken && !r.isStale;
    const o = u.getConfig();
    e.configValid = !!(o.namespace && o.maxAge > 0), e.authEventsAvailable = typeof window < "u";
  } catch (r) {
    A("Lifecycle", "healthCheck failed", r);
  }
  const t = Object.values(e).filter((r) => r === !0).length, n = Object.keys(e).length;
  return { status: t === n ? "HEALTHY" : t >= 5 ? "DEGRADED" : "UNHEALTHY", score: `${t}/${n}`, checks: e, version: c, timestamp: Date.now() };
}
const vt = "2.1.0-ENTERPRISE-FIX", Dt = "csrf-token-manager-axios-interceptor";
let E = null, F = null, b = null, M = { requestsIntercepted: 0, tokensAttached: 0 };
function Ct(e = null, t = null) {
  const n = e || (typeof window < "u" ? window.axios : null);
  return !n || !n.interceptors ? !1 : (E !== null || (F = n, b = t, E = n.interceptors.request.use((r) => {
    M.requestsIntercepted++;
    const o = (b == null ? void 0 : b()) || (typeof window < "u" ? window.CSRF_TOKEN : null);
    return o && (r.headers = r.headers || {}, r.headers["X-CSRF-TOKEN"] = o, r.headers["X-Requested-With"] = "XMLHttpRequest", M.tokensAttached++), r;
  }, (r) => Promise.reject(r))), !0);
}
function se(e = null) {
  const t = e || F;
  return !t || E === null ? !1 : (t.interceptors.request.eject(E), E = null, F = null, b = null, !0);
}
function _e() {
  return E !== null;
}
function ve() {
  return {
    moduleId: Dt,
    version: vt,
    attached: _e(),
    interceptorId: E,
    hasAxiosInstance: !!F,
    hasGetTokenFn: !!b,
    stats: { ...M },
    timestamp: Date.now()
  };
}
const I = "security.csrf-token-manager.diagnostics.csrf-diagnostics", De = typeof window < "u", At = D({ moduleId: I });
function O(e) {
  return At.get(e);
}
const S = { info(e, t) {
  const n = O("logger");
  n && n.info && n.info(e, Object.assign({ component: I }, t || {}));
}, warn(e, t) {
  const n = O("logger");
  n && n.warn && n.warn(e, Object.assign({ component: I }, t || {}));
}, error(e, t) {
  const n = O("logger");
  n && n.error && n.error(e, Object.assign({ component: I }, t || {}));
}, debug(e, t) {
  const n = O("logger");
  n && n.debug && n.debug(e, Object.assign({ component: I }, t || {}));
} };
function Ce() {
  try {
    const e = { module: ye(), csrfStatus: h(), headersInfo: C(), config: u.getConfig(), stats: u.getStats(), integrations: { axios: ve(), bridge: te() }, telemetry: Q(), health: x() };
    return S.debug("dumpStatus executed", { sections: Object.keys(e) }), e;
  } catch (e) {
    return S.error("dumpStatus failed", { error: e.message }), null;
  }
}
function Ae() {
  const e = h(), t = Re(), n = x();
  return { version: c, ready: t.initialized, health: n.status, hasToken: e.hasToken, isStale: e.isStale, age: e.age ? `${Math.round(e.age / 1e3)}s` : "N/A", preview: e.tokenPreview };
}
function Oe() {
  const e = { csrf: Y(), auth: J(), info: C() };
  return S.debug("testHeaders executed", { hasCSRF: !!e.csrf, hasAuth: !!e.auth }), e;
}
function $e(e) {
  e || (e = 10);
  const t = Ee(e);
  return S.debug("showRecentEvents", { limit: e, count: t.length }), t;
}
function oe() {
  if (!De) return !1;
  try {
    return window.CSRF_DEBUG = { dump: Ce, quick: Ae, status: h, headers: Oe, headersInfo: C, events: $e, health: x, info: we, clearEvents: Se, getToken() {
      return ht(ce());
    }, version: c, moduleId: v }, S.info("Debug hooks registered", { version: c }), !0;
  } catch (e) {
    return S.error("registerWindowDebugHook failed", { error: e.message }), !1;
  }
}
function ue() {
  if (De)
    try {
      delete window.CSRF_DEBUG, S.debug("Debug hooks unregistered");
    } catch {
    }
}
const Nt = {
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  // Inicializa o módulo
  init(e = {}, t = {}) {
    var n, r;
    const o = wt(e, t);
    return ((n = e.security) != null && n.csrfDebug || (r = e.debug) != null && r.enabled) && oe(), o;
  },
  // Verifica se está inicializado
  isInitialized: ne,
  // Verifica se está pronto
  isReady: be,
  // Shutdown completo
  shutdown() {
    return Rt(), se(), ue(), yt();
  },
  // Reset (limpa token mas mantém config)
  reset: _t,
  // ═══════════════════════════════════════════════════════════
  // TOKEN OPERATIONS
  // ═══════════════════════════════════════════════════════════
  // Obtém token atual
  getToken: ce,
  // Define novo token
  setToken: le,
  // Renova token existente
  renewToken: et,
  // Limpa token
  clearToken: tt,
  // Status completo do CSRF
  getStatus: h,
  // Verifica se token está fresco
  isFresh: W,
  // ═══════════════════════════════════════════════════════════
  // HEADERS
  // ═══════════════════════════════════════════════════════════
  // Headers apenas com CSRF
  getHeaders: Y,
  // Headers com CSRF + Authorization Bearer
  getAuthHeaders: J,
  // Verifica se tem headers válidos
  hasValidAuthHeaders: de,
  // Info sobre headers disponíveis
  getHeadersInfo: C,
  // ═══════════════════════════════════════════════════════════
  // ASYNC OPERATIONS
  // ═══════════════════════════════════════════════════════════
  // Garante token fresco (preparado para refresh futuro)
  async ensureFreshToken(e = {}) {
    const t = h();
    return (e.force || t.isStale) && H(R.CSRF_ENSURE_FRESH, {
      isStale: t.isStale,
      forced: e.force
    }), t;
  },
  // ═══════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════
  // Registra handler de evento
  on(e, t) {
    u.addHandler(e, t);
  },
  // Remove handler de evento
  off(e, t) {
    u.removeHandler(e, t);
  },
  // Emite evento genérico
  emitEvent: at,
  // Emite login required (usa AUTH_INTENTS.LOGIN)
  emitLoginRequired: ct,
  // Constantes de eventos internos
  EVENTS: R,
  // AUTH_EVENTS - fonte única (para consumidores externos)
  AUTH_EVENTS: Ne,
  // ═══════════════════════════════════════════════════════════
  // INTEGRATIONS
  // ═══════════════════════════════════════════════════════════
  // Anexa interceptors ao Axios
  attachAxios: Ct,
  // Remove interceptors do Axios
  detachAxios: se,
  // Verifica se Axios está anexado
  isAxiosAttached: _e,
  // Conecta ao EventBus
  connectEventBus: Tt,
  // Desconecta do EventBus
  disconnectEventBus: Ie,
  // Conecta ao GlobalState
  connectGlobalState: bt,
  // Desconecta do GlobalState
  disconnectGlobalState: Te,
  // ═══════════════════════════════════════════════════════════
  // INFO & DIAGNOSTICS (v1.2.0 - AUTH_EVENTS integrado)
  // ═══════════════════════════════════════════════════════════
  // Informações completas do módulo
  info: we,
  // Diagnóstico rápido
  getDiagnostics: ye,
  // Health check consolidado
  healthCheck: x,
  // Versão do módulo
  version: c,
  moduleId: v,
  // Objeto debug com helpers avançados
  debug: {
    dump: Ce,
    quick: Ae,
    headers: Oe,
    events: $e,
    recentEvents: Ee,
    clearEvents: Se,
    stats: () => u.getStats(),
    config: () => u.getConfig(),
    telemetry: Q,
    interceptors: ve,
    bridge: te,
    registerHooks: oe,
    unregisterHooks: ue
  }
};
export {
  Lt as AUTH_EVENTS,
  v as MODULE_ID,
  R as SECURITY_EVENTS,
  Nt as SecurityCSRF,
  c as VERSION,
  Nt as default
};
