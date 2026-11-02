import { createCorePorts as Q } from "/core/runtime/ports-profiles.js";
import { isStrict as W, recordViolation as _e } from "/core/runtime/enterprise/strict-mode.js";
import { Telemetry as h, createLegacyAdapter as Ae } from "/assets/js/core/telemetry-core/index.js";
import { TELEMETRY_ENDPOINT as fe } from "/assets/js/core/api-client/config.js";
import { SYSTEM_EVENTS as re } from "/core/runtime/events/catalog/system.events.js";
var ce = "2.2.0-ENTERPRISE", D = "config-loader-telemetry", g = "config-loader", I = null, R = null, H = !1;
function Pe(e) {
  H || (R = e || "cfg-" + Date.now(), h.isReady() || h.init({ endpoint: fe, component: g, debug: !1, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 }), I = Ae(g), H = !0, I.track("telemetry:init", { sessionId: R, version: ce, moduleId: D }));
}
function s(e, t = {}) {
  if (t || (t = {}), t.moduleId = D, !I) {
    h.event(g + ":" + e, t, { component: g });
    return;
  }
  I.track(e, t);
}
function T(e, t, r = {}) {
  var o = { message: t && t.message ? t.message : String(t), stack: t && t.stack ? t.stack : null, moduleId: D };
  for (var n in r)
    Object.prototype.hasOwnProperty.call(r, n) && (o[n] = r[n]);
  if (!I) {
    h.error(g + ":" + e + ":error", o, { component: g });
    return;
  }
  r.moduleId = D, I.trackError(e, t, r);
}
function O(e, t, r = !0) {
  if (r === void 0 && (r = !0), !I) {
    h.metric(g + ":" + e + ":timing", { duration: t, success: r, unit: "ms", moduleId: D }, { component: g });
    return;
  }
  I.trackTiming(e, t, r);
}
function Y() {
  try {
    for (var e = h.getBufferSnapshot(), t = [], r = 0; r < e.length; r++)
      e[r].component === g && t.push(e[r]);
    return t;
  } catch {
    return [];
  }
}
function Se() {
  if (R) return R;
  try {
    var e = h.getStats ? h.getStats() : null;
    return e && e.sessionId ? e.sessionId : null;
  } catch {
    return null;
  }
}
function oe() {
  return { version: ce, moduleId: D, namespace: g, initialized: H, sessionId: R, telemetryEndpoint: fe, eventCount: Y().length };
}
let E = null;
function Re() {
  if (E) return E;
  try {
    if (typeof window < "u" && window.APIClient?.profiles)
      return E = window.APIClient.profiles, E;
  } catch {
  }
  return E = { auth: { timeout: 5e3, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0 }, default: { timeout: 1e4, retries: 2, retryDelay: 1e3, backoffMultiplier: 2, maxRetryDelay: 8e3 }, longRun: { timeout: 3e4, retries: 1, retryDelay: 2e3, backoffMultiplier: 2, maxRetryDelay: 1e4 }, realtime: { timeout: 3e3, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0 } }, E;
}
function Te(e = "default") {
  const t = Re(), r = t[e] || t.default;
  return { timeout: r.timeout, retries: r.retries, retryDelay: r.retryDelay, backoff: r.backoffMultiplier, maxRetryDelay: r.maxRetryDelay };
}
function Le(e, t, r = void 0) {
  if (!t) return e ?? r;
  if (!e || typeof e != "object") return typeof r < "u" ? r : void 0;
  const o = Array.isArray(t) ? t : String(t).split(".");
  let n = e;
  for (const i of o) {
    if (n == null || typeof n != "object") return typeof r < "u" ? r : void 0;
    if (Object.prototype.hasOwnProperty.call(n, i)) n = n[i];
    else return typeof r < "u" ? r : void 0;
  }
  return n === void 0 ? r : n;
}
function de(e) {
  return e !== null && typeof e == "object" && !Array.isArray(e);
}
function Ne() {
  return `cfg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function ge() {
  try {
    if (typeof localStorage > "u") return {};
    const e = localStorage.getItem("__dshowdash_config_overrides__");
    if (e) {
      const t = JSON.parse(e);
      if (de(t)) return t;
    }
  } catch {
  }
  return {};
}
function yt(e) {
  try {
    if (typeof localStorage > "u") return !1;
    if (de(e))
      return localStorage.setItem("__dshowdash_config_overrides__", JSON.stringify(e)), !0;
  } catch {
  }
  return !1;
}
function me() {
  const e = {};
  try {
    if (typeof window > "u" || !window.location?.search) return {};
    const t = new URLSearchParams(window.location.search);
    for (const [r, o] of t.entries())
      if (r.startsWith("config.")) {
        const n = r.replace("config.", "");
        let i = o;
        o === "true" ? i = !0 : o === "false" ? i = !1 : !isNaN(o) && o !== "" && (i = Number(o)), je(e, n, i);
      }
  } catch {
  }
  return e;
}
function je(e, t, r) {
  if (!e || !t) return e;
  const o = String(t).split(".");
  let n = e;
  for (let i = 0; i < o.length - 1; i++) {
    const l = o[i];
    (!n[l] || typeof n[l] != "object") && (n[l] = {}), n = n[l];
  }
  return n[o[o.length - 1]] = r, e;
}
function ve(e) {
  return e && typeof e == "object" && !Object.isFrozen(e) && (Object.keys(e).forEach((t) => ve(e[t])), Object.freeze(e)), e;
}
function Me() {
  const e = Object.keys(ge()), t = Object.keys(me());
  return { localStorage: e, queryParams: t, total: [.../* @__PURE__ */ new Set([...e, ...t])] };
}
var J = "config-loader-loader";
function Fe() {
  var e = Date.now();
  s("source:static:start", { moduleId: J });
  var t = { app: {}, resilience: {}, features: {}, schemas: {} };
  return new Promise(function(r) {
    try {
      typeof window < "u" && window.APP_CONFIG ? (t.app = window.APP_CONFIG, s("source:static:app", { loaded: !0, keys: Object.keys(t.app).length })) : s("source:static:app", { loaded: !1, reason: "window.APP_CONFIG não disponível" }), typeof window < "u" && window.RESILIENCE_CONFIG ? (t.resilience = window.RESILIENCE_CONFIG, s("source:static:resilience", { loaded: !0 })) : s("source:static:resilience", { loaded: !1 });
      var o = new AbortController(), n = setTimeout(function() {
        o.abort();
      }, 1e4);
      fetch("/config/features/feature-flags.json", { cache: "no-cache", headers: { Accept: "application/json" }, signal: o.signal }).then(function(i) {
        if (i.ok)
          return i.json().then(function(l) {
            t.features = l, s("source:static:features", { loaded: !0, version: l.version || "unknown" });
          });
        s("source:static:features", { loaded: !1, status: i.status });
      }).catch(function(i) {
        T("source:static:features", i);
      }).finally(function() {
        clearTimeout(n), O("loadStaticConfigs", Date.now() - e, !0);
        var i = [];
        for (var l in t)
          Object.keys(t[l]).length > 0 && i.push(l);
        s("source:static:complete", { sources: i }), r(t);
      });
    } catch (i) {
      T("loadStaticConfigs", i), O("loadStaticConfigs", Date.now() - e, !1), r(t);
    }
  });
}
function ze() {
  var e = Date.now();
  return s("source:backend:start", { moduleId: J }), new Promise(function(t) {
    s("source:backend:skip", { reason: "Nenhum endpoint configurado ainda" }), O("loadBackendConfigs", Date.now() - e, !0), t({});
  });
}
function Be() {
  var e = Date.now();
  s("source:overrides:start", { moduleId: J });
  try {
    var t = ge(), r = me(), o = {};
    for (var n in t)
      Object.prototype.hasOwnProperty.call(t, n) && (o[n] = t[n]);
    for (var i in r)
      Object.prototype.hasOwnProperty.call(r, i) && (o[i] = r[i]);
    var l = Object.keys(t), b = Object.keys(r);
    return s("source:overrides:complete", { localStorage: l.length > 0, localKeys: l, queryParams: b.length > 0, queryKeys: b, totalKeys: Object.keys(o).length }), O("loadAllOverrides", Date.now() - e, !0), { values: o, meta: { localKeys: l, queryKeys: b, hasOverrides: Object.keys(o).length > 0 } };
  } catch (S) {
    return T("loadAllOverrides", S), O("loadAllOverrides", Date.now() - e, !1), { values: {}, meta: { localKeys: [], queryKeys: [], hasOverrides: !1 } };
  }
}
function k(e) {
  return e !== null && typeof e == "object" && !Array.isArray(e) && e.constructor === Object;
}
function v(e) {
  if (e == null)
    return e;
  if (Array.isArray(e))
    return e.map((t) => v(t));
  if (k(e)) {
    const t = {};
    for (const r in e)
      Object.prototype.hasOwnProperty.call(e, r) && (t[r] = v(e[r]));
    return t;
  }
  return e;
}
function pe(e, t) {
  if (!k(e) || !k(t))
    return v(t !== void 0 ? t : e);
  const r = v(e);
  for (const o in t)
    if (Object.prototype.hasOwnProperty.call(t, o)) {
      const n = t[o], i = r[o];
      k(n) && k(i) ? r[o] = pe(i, n) : n !== void 0 && (r[o] = v(n));
    }
  return r;
}
function X(...e) {
  if (e.length === 0)
    return {};
  if (e.length === 1)
    return v(e[0]) || {};
  let t = {};
  for (const r of e)
    r && k(r) && (t = pe(t, r));
  return t;
}
var ne = "config-loader-merger", ye = {
  env: "UNKNOWN",
  app: { name: "DshowDash", version: "0.0.0", build: "00000000", assetsVersion: "0", debug: !1, apiUrl: "/api" },
  api: { baseUrl: "/api", timeouts: { global: 5e3, health: 3e3, default: 1e4 } },
  layout: { sidebarInitialState: "expanded", theme: "flat-dark" },
  features: { enableTelemetry: !0, enableBootTracker: !0 },
  refresh: { global: 6e4, cards: 3e4, panels: 45e3 },
  timeouts: { readyTimeoutMs: 12e3, componentTimeoutMs: 1e4, apiDefaultMs: 1e4, configLoadMs: 5e3 }
};
function xe(e) {
  var t = e.defaults || {}, r = e.staticConfig || {}, o = e.backendConfig || {}, n = e.overrides || {};
  s("merger:start", { hasDefaults: Object.keys(t).length > 0, hasStatic: Object.keys(r).length > 0, hasBackend: Object.keys(o).length > 0, hasOverrides: Object.keys(n).length > 0, moduleId: ne });
  var i = X(ye, t, r.app || {}, { resilience: r.resilience || {} }, { featureFlags: r.features || {} }, o, n);
  return s("merger:complete", { finalKeys: Object.keys(i).length, hasApp: !!i.app, hasTimeouts: !!i.timeouts, hasFeatures: !!i.features || !!i.featureFlags, moduleId: ne }), i;
}
function he() {
  return X({}, ye);
}
var $ = "config-loader-validator", K = ["app", "app.name", "app.version", "app.apiUrl"];
function Ve(e) {
  s("validator:start", { moduleId: $ });
  var t = [], r = !0;
  if ((!e || typeof e != "object") && (t.push("Config deve ser um objeto válido"), r = !1), r)
    for (var o = 0; o < K.length; o++) {
      var n = K[o], i = Ge(e, n);
      i == null && (t.push("Campo obrigatório ausente: " + n), r = !1);
    }
  if (r && e.app) {
    var l = e.app;
    l.version && !/^\d+\.\d+\.\d+/.test(l.version) && t.push("app.version deve seguir padrão semântico (X.Y.Z)"), l.apiUrl && l.apiUrl.indexOf("/") !== 0 && t.push("app.apiUrl deve começar com /");
  }
  if (r && e.timeouts)
    for (var b = ["readyTimeoutMs", "componentTimeoutMs", "apiDefaultMs"], S = 0; S < b.length; S++) {
      var V = b[S];
      if (e.timeouts[V] !== void 0) {
        var G = e.timeouts[V];
        (typeof G != "number" || G < 1e3 || G > 12e4) && t.push("timeouts." + V + " deve ser número entre 1000 e 120000");
      }
    }
  if (r && e.refresh) {
    var te = e.refresh;
    if (te.global !== void 0) {
      var U = te.global;
      (typeof U != "number" || U < 1e4 || U > 3e5) && t.push("refresh.global deve ser número entre 10000 e 300000");
    }
  }
  if (r && t.length === 0)
    return s("validator:success", { fieldsValidated: K.length, moduleId: $ }), { ok: !0, config: e, errors: [] };
  s("validator:failure", { errorCount: t.length, errors: t, moduleId: $ });
  var De = X(he(), e || {});
  return T("validator", new Error("Validação falhou: " + t.join(", "))), { ok: !1, config: De, errors: t };
}
function Ge(e, t) {
  for (var r = t.split("."), o = e, n = 0; n < r.length; n++) {
    if (o == null || typeof o != "object") return;
    o = o[r[n]];
  }
  return o;
}
const Z = "2.4.0-STRICT-MODE", q = "config-loader-store";
var L = Q({ moduleId: q });
function Ue(e) {
  return L.get(e);
}
function $e(e) {
  return L.inject(e);
}
function Ke() {
  return L.snapshot();
}
const ie = (e, ...t) => {
  const r = Ue("logger");
  if (r) {
    r.warn?.("[ConfigStore]", ...t);
    return;
  }
};
function He() {
  return Z;
}
let d = {}, A = !1, z = null, P = !1, N = null;
const _ = /* @__PURE__ */ new Set();
function Ye(e, t = null) {
  if (A)
    return ie("warn", "Tentativa de modificar config congelada ignorada"), !1;
  const r = d;
  return d = v(e), z = Date.now(), N = t, P = !1, _.forEach((o) => {
    try {
      o(d, r);
    } catch (n) {
      ie("warn", "Config listener threw", n.message || n);
    }
  }), !0;
}
function Qe() {
  A = !0, ve(d);
}
function Ie(e = void 0, t = void 0) {
  return B() ? e ? Le(d, e, t) : v(d) : t;
}
function We() {
  return v(d);
}
function B() {
  return Object.keys(d).length > 0 && !P;
}
function Je() {
  return A;
}
function Xe(e = "default") {
  const t = Ie(`api.profiles.${e}`);
  return t && typeof t == "object" ? t : Te(e);
}
function Ze() {
  return z;
}
function qe(e) {
  if (typeof e != "function") throw new Error("[ConfigStore] Listener deve ser uma função");
  return _.add(e), () => {
    _.delete(e);
  };
}
function et() {
  return _.size;
}
function we() {
  return N?.hasOverrides === !0;
}
function tt() {
  return N;
}
function Oe() {
  d = {}, A = !1, z = null, N = null, P = !1, _.clear();
}
function rt() {
  Oe(), P = !0;
}
function Ce() {
  var e = { loaded: B(), frozen: A, portsInitialized: L.isInitialized(), notDestroyed: !P }, t = Object.values(e).filter(Boolean).length;
  return {
    status: t >= 3 ? "HEALTHY" : t >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: t,
    maxScore: 4,
    checks: e,
    moduleId: q,
    version: Z,
    portsInitialized: L.isInitialized(),
    strictMode: W(),
    timestamp: Date.now()
  };
}
function ot() {
  return { version: Z, moduleId: q, loaded: B(), frozen: A, destroyed: P, loadedAt: z, keyCount: Object.keys(d).length, listenerCount: _.size, hasOverrides: we(), overridesMeta: N, strictMode: W(), healthCheck: Ce() };
}
const C = { get: Ie, getAll: We, setFinalConfig: Ye, freezeStore: Qe, isLoaded: B, isFrozen: Je, getApiProfile: Xe, getLoadedAt: Ze, subscribe: qe, getListenerCount: et, hasOverrides: we, getOverridesMeta: tt, getStoreInfo: ot, destroy: rt, _reset: Oe, getVersion: He, healthCheck: Ce, injectPorts: $e, getPorts: Ke };
var ee = "2.4.0-P0-ENTERPRISE", a = "config-loader-lifecycle", be = Q({ moduleId: a }), se = !1;
function nt() {
  se || (be.init(), se = !0);
}
function Ee(e) {
  return nt(), be.get(e);
}
var p = !1, c = null, M = null, f = null, x = !1;
function it() {
  try {
    if (typeof window < "u" && window.Environment && window.Environment.get) {
      var e = {
        environment: window.Environment.get("environment"),
        mode: window.Environment.get("mode"),
        hostname: window.Environment.get("hostname")
      };
      if (e.environment && e.environment !== "UNKNOWN")
        return s("resolve:source", { source: "EnvironmentManager", env: e.environment, moduleId: a }), Object.assign({ _source: "EnvironmentManager" }, e);
    }
  } catch (t) {
    s("resolve:env-error", { message: t.message, moduleId: a });
  }
  return typeof window < "u" && window.APP_CONFIG ? (s("resolve:source", { source: "APP_CONFIG", moduleId: a }), Object.assign({ _source: "APP_CONFIG" }, window.APP_CONFIG)) : (s("resolve:source", { source: "empty-fallback", moduleId: a }), { _source: "fallback" });
}
function st(e) {
  try {
    var t = Ee("globalState");
    return t && t.dispatch ? (t.dispatch({
      type: "SET_APP_CONFIG",
      payload: {
        loaded: !0,
        timestamp: Date.now(),
        keys: Object.keys(e)
      }
    }), s("global-state:synced", {
      hasApp: !!e.app,
      hasApi: !!e.api,
      hasTimeouts: !!e.timeouts,
      moduleId: a
    }), !0) : (s("global-state:not-available", { moduleId: a }), !1);
  } catch (r) {
    return s("global-state:sync-error", { message: r.message, moduleId: a }), !1;
  }
}
function ae(e, t) {
  try {
    var r = Ee("eventBus");
    r && r.emit && r.emit(re.CONFIG_LOADED, {
      success: e,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: ee,
      keys: Object.keys(t || {}),
      source: a
    }), typeof window < "u" && window.dispatchEvent(new CustomEvent(re.CONFIG_LOADED, {
      detail: { success: e, timestamp: Date.now() }
    }));
  } catch {
  }
}
function ke(e = !1) {
  return e === void 0 && (e = !1), p && !e ? (s("lifecycle:boot:already-booted", { moduleId: a }), Promise.resolve(f || { ok: !0, config: C.getAll(), errors: [] })) : c && !e ? (s("lifecycle:boot:waiting", { reason: "Boot já em andamento", moduleId: a }), c) : (c = at(), c);
}
function at() {
  var e = Date.now(), t = Ne();
  return Pe(t), s("lifecycle:boot:start", { sessionId: t, version: ee, moduleId: a }), Promise.resolve().then(function() {
    return s("lifecycle:step", { step: 0, name: "resolveBaseConfig", moduleId: a }), it();
  }).then(function(r) {
    return s("lifecycle:step", { step: 1, name: "loadStaticConfigs", moduleId: a }), Fe().then(function(o) {
      return { baseConfig: r, staticConfig: o };
    });
  }).then(function(r) {
    return s("lifecycle:step", { step: 2, name: "loadBackendConfigs", moduleId: a }), ze().then(function(o) {
      return r.backendConfig = o, r;
    });
  }).then(function(r) {
    s("lifecycle:step", { step: 3, name: "loadAllOverrides", moduleId: a });
    var o = Be();
    return r.overridesResult = o, r;
  }).then(function(r) {
    s("lifecycle:step", { step: 4, name: "mergeConfigs", moduleId: a });
    var o = xe({
      defaults: r.baseConfig,
      staticConfig: r.staticConfig,
      backendConfig: r.backendConfig,
      overrides: r.overridesResult.values || r.overridesResult
    });
    return r.mergedConfig = o, r;
  }).then(function(r) {
    s("lifecycle:step", { step: 5, name: "validateConfig", moduleId: a });
    var o = Ve(r.mergedConfig);
    return r.validationResult = o, r;
  }).then(function(r) {
    return s("lifecycle:step", { step: 6, name: "setFinalConfig", moduleId: a }), C.setFinalConfig(r.validationResult.config, r.overridesResult.meta), r;
  }).then(function(r) {
    s("lifecycle:step", { step: 7, name: "syncToGlobalState", moduleId: a });
    var o = r.validationResult, n = r.baseConfig, i = r.overridesResult;
    st(o.config);
    var l = Date.now() - e;
    return p = !0, x = !1, M = Date.now(), o.ok ? s("lifecycle:boot:success", {
      durationMs: l,
      configKeys: Object.keys(o.config).length,
      source: n._source,
      hasOverrides: i.meta && i.meta.hasOverrides || !1,
      moduleId: a
    }) : s("lifecycle:boot:fallback", {
      durationMs: l,
      errors: o.errors,
      reason: "Validação falhou, usando config segura",
      moduleId: a
    }), O("bootConfigLoader", l, o.ok), ae(o.ok, o.config), f = r.validationResult, c = null, r.validationResult;
  }).catch(function(r) {
    var o = Date.now() - e;
    T("lifecycle:boot", r, { durationMs: o, moduleId: a }), O("bootConfigLoader", o, !1);
    var n = he();
    return C.setFinalConfig(n), p = !0, M = Date.now(), s("lifecycle:boot:critical-fallback", {
      error: r.message,
      durationMs: o,
      moduleId: a
    }), ae(!1, n), f = {
      ok: !1,
      config: n,
      errors: [r.message]
    }, c = null, f;
  });
}
function lt() {
  return s("lifecycle:reload:start", { moduleId: a }), C._reset(), p = !1, c = null, f = null, ke(!0);
}
function j() {
  return p && !x;
}
function ut() {
  return M;
}
function le() {
  return f;
}
function ft(e = 1e4) {
  if (e === void 0 && (e = 1e4), p)
    return Promise.resolve(!0);
  if (c)
    return c.then(function() {
      return !0;
    }).catch(function() {
      return !1;
    });
  var t = Date.now();
  return new Promise(function(r) {
    var o = setInterval(function() {
      p ? (clearInterval(o), r(!0)) : Date.now() - t > e && (clearInterval(o), s("lifecycle:waitForBoot:timeout", { timeoutMs: e, moduleId: a }), r(!1));
    }, 100);
  });
}
function ct() {
  C.destroy(), p = !1, c = null, f = null, x = !0;
}
function ue() {
  return {
    version: ee,
    moduleId: a,
    booted: p,
    destroyed: x,
    lastBootTime: M,
    hasBootResult: !!f,
    bootResultOk: f ? f.ok : void 0,
    bootErrors: f ? f.errors : []
  };
}
const y = "2.5.0-STRICT-MODE", w = "config-loader", F = Q({ moduleId: w }), ht = (e) => F.inject(e), It = () => F.snapshot();
function wt() {
  return y;
}
const u = C, m = {
  version: y,
  name: w,
  moduleId: w,
  getVersion() {
    return y;
  },
  // `undefined` explícito quando o default não vem — é assim no bundle.
  get(e, t) {
    return u.get(e, t !== void 0 ? t : void 0);
  },
  getAll() {
    return u.getAll();
  },
  // Já bootado → recarrega; senão → boota. Não é só "boot".
  load() {
    return j() ? lt() : ke();
  },
  onChange(e) {
    return u.subscribe(e);
  },
  isReady() {
    return j() && u.isLoaded();
  },
  waitReady(e) {
    return ft(e || 1e4);
  },
  // ⚠️ é o tempo do último BOOT, apesar do nome.
  getLoadTime() {
    return ut();
  },
  getApiProfile(e) {
    return u.getApiProfile(e || "default");
  },
  timeouts() {
    return u.get("timeouts", {});
  },
  // `featureFlags` primeiro, `features` como alternativa — nessa ordem.
  features() {
    return u.get("featureFlags", u.get("features", {}));
  },
  refresh() {
    return u.get("refresh", {});
  },
  healthCheck() {
    const e = [], t = le();
    j() || e.push("Not booted"), u.isLoaded() || e.push("Config not loaded"), t && !t.ok && e.push("Boot completed with errors");
    const r = u.getAll();
    return (!r || !r.app) && e.push("Missing app config"), {
      healthy: e.length === 0,
      status: e.length === 0 ? "HEALTHY" : "DEGRADED",
      version: y,
      moduleId: w,
      booted: j(),
      loaded: u.isLoaded(),
      bootOk: t ? t.ok : null,
      issues: e.length > 0 ? e : null,
      portsInitialized: F.isInitialized(),
      timestamp: Date.now()
    };
  },
  info() {
    const e = u.getAll(), t = le(), r = Me();
    return {
      name: w,
      version: y,
      loaded: u.isLoaded(),
      frozen: u.isFrozen(),
      loadTime: this.getLoadTime(),
      loadedAt: u.getLoadedAt(),
      hasApp: !!(e && e.app),
      hasApi: !!(e && e.api),
      hasTimeouts: !!(e && e.timeouts),
      hasFeatures: !!(e && e.features) || !!(e && e.featureFlags),
      keys: e ? Object.keys(e) : [],
      keyCount: e ? Object.keys(e).length : 0,
      bootOk: t ? t.ok : null,
      bootErrors: t ? t.errors || [] : [],
      listenerCount: u.getListenerCount(),
      hasOverrides: u.hasOverrides(),
      overrideKeys: r,
      lifecycle: ue(),
      store: u.getStoreInfo(),
      tracker: oe(),
      portsInitialized: F.isInitialized(),
      timestamp: Date.now()
    };
  },
  getDiagnostics() {
    return {
      version: y,
      moduleId: w,
      healthCheck: this.healthCheck(),
      info: this.info(),
      config: u.getAll(),
      overridesMeta: u.getOverridesMeta()
    };
  },
  /** Últimos N eventos, com filtro opcional por campo (raiz ou dentro de `data`). */
  getEvents(e, t) {
    const o = Y().slice(-(e || 50));
    return !t || Object.keys(t).length === 0 ? o : o.filter((n) => Object.entries(t).every(([i, l]) => n[i] === l || n.data && n.data[i] === l));
  },
  getDebugLog() {
    return Y();
  },
  getSessionId() {
    return Se();
  },
  destroy() {
    ct();
  },
  debug: {
    info: () => m.info(),
    events: (e) => m.getEvents(e),
    store: () => u.getStoreInfo(),
    lifecycle: () => ue(),
    tracker: () => oe(),
    healthCheck: () => m.healthCheck(),
    diagnostics: () => m.getDiagnostics()
  }
};
if (typeof window < "u") {
  const e = window;
  W() ? _e(
    "GLOBAL_EXPOSURE_BLOCKED",
    { module: w, property: "window.Config", version: y }
  ) : e.Config || (e.Config = m), e.APP_CONFIG && e.APP_CONFIG.app && e.APP_CONFIG.app.debug && (e.__dev = e.__dev || {}, e.__dev.config = {
    getVersion: () => y,
    healthCheck: () => m.healthCheck(),
    info: () => m.info(),
    getDiagnostics: () => m.getDiagnostics(),
    store: C,
    getAll: () => u.getAll()
  });
}
var Ot = m;
export {
  m as Config,
  C as ConfigStore,
  w as MODULE_ID,
  y as VERSION,
  ke as bootConfigLoader,
  X as deepMerge,
  Ot as default,
  Te as getApiProfileConfig,
  It as getPorts,
  he as getSafeDefaults,
  wt as getVersion,
  ht as injectPorts,
  j as isBooted,
  ge as loadLocalOverrides,
  xe as mergeConfigs,
  yt as persistLocalOverrides,
  lt as reloadConfig,
  Le as safeGet,
  Ve as validateConfig,
  ft as waitForBoot
};
