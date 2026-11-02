import { isStrict as L, recordViolation as A } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts as k } from "/core/runtime/ports-profiles.js";
var X = "2.2.0-ENTERPRISE", n = Object.freeze({
  LOCAL: "local",
  SANDBOX: "SANDBOX",
  DEV: "DEV",
  TEST: "TEST",
  STAGE: "STAGE",
  PROD: "PROD",
  UNKNOWN: "UNKNOWN"
}), f = Object.freeze({
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production"
}), h = Object.freeze({
  LOCAL: ["localhost", "127.0.0.1", "0.0.0.0", "::1", ".local"],
  SANDBOX: ["localhost", "127.0.0.1", "0.0.0.0", "::1", ".local"],
  DEV: ["dev.", "development.", ".internal"],
  TEST: ["test.", "testing.", "qa.", "homolog.", "homologacao.", "uat."],
  STAGE: ["stg.", "stage.", "staging.", "pre-prod.", "preprod."],
  PROD: ["prod.", "production.", "www.", ".com.br", ".com", ".net", ".org"]
}), $ = Object.freeze({ 3e3: n.DEV, 5173: n.DEV, 8080: n.DEV, 4200: n.DEV, 9e3: n.TEST }), v = {};
v[n.LOCAL] = f.DEVELOPMENT;
v[n.SANDBOX] = f.DEVELOPMENT;
v[n.DEV] = f.DEVELOPMENT;
v[n.TEST] = f.STAGING;
v[n.STAGE] = f.STAGING;
v[n.PROD] = f.PRODUCTION;
v[n.UNKNOWN] = f.DEVELOPMENT;
var H = Object.freeze(v), V = Object.freeze({
  api: { local: "/api", SANDBOX: "/api", DEV: "/api", TEST: "/api", STAGE: "/api", PROD: "/api", UNKNOWN: "/api" },
  telemetry: { local: "/api/telemetry/", SANDBOX: "/api/telemetry/", DEV: "/api/telemetry/", TEST: "/api/telemetry/", STAGE: "/api/telemetry/", PROD: "/api/telemetry/", UNKNOWN: "/api/telemetry/" },
  assets: { local: "/assets", SANDBOX: "/assets", DEV: "/assets", TEST: "/assets", STAGE: "/assets", PROD: "/assets", UNKNOWN: "/assets" },
  config: { local: "/config", SANDBOX: "/config", DEV: "/config", TEST: "/config", STAGE: "/config", PROD: "/config", UNKNOWN: "/config" }
}), w = Object.freeze({
  local: { debug: !0, enableServiceWorker: !1, cacheLevel: "none", logLevel: "debug", showErrors: !0, enableExperimentation: !0, telemetrySampling: 100 },
  SANDBOX: { debug: !0, enableServiceWorker: !1, cacheLevel: "none", logLevel: "debug", showErrors: !0, enableExperimentation: !0, telemetrySampling: 100 },
  DEV: { debug: !0, enableServiceWorker: !1, cacheLevel: "basic", logLevel: "debug", showErrors: !0, enableExperimentation: !0, telemetrySampling: 100 },
  TEST: { debug: !0, enableServiceWorker: !1, cacheLevel: "basic", logLevel: "info", showErrors: !0, enableExperimentation: !0, telemetrySampling: 50 },
  STAGE: { debug: !0, enableServiceWorker: !0, cacheLevel: "basic", logLevel: "warn", showErrors: !1, enableExperimentation: !1, telemetrySampling: 25 },
  PROD: { debug: !1, enableServiceWorker: !0, cacheLevel: "aggressive", logLevel: "error", showErrors: !1, enableExperimentation: !1, telemetrySampling: 10 },
  UNKNOWN: { debug: !1, enableServiceWorker: !1, cacheLevel: "none", logLevel: "warn", showErrors: !1, enableExperimentation: !1, telemetrySampling: 100 }
}), P = Object.freeze({
  local: { name: "Local", color: "#FF9800", icon: "home", description: "Ambiente local de desenvolvimento" },
  SANDBOX: { name: "Sandbox", color: "#FFA500", icon: "wrench", description: "Ambiente sandbox de desenvolvimento" },
  DEV: { name: "Development", color: "#2196F3", icon: "code", description: "Ambiente de desenvolvimento remoto" },
  TEST: { name: "Test/QA", color: "#FFC107", icon: "alert-triangle", description: "Ambiente de testes e QA" },
  STAGE: { name: "Staging", color: "#9C27B0", icon: "layers", description: "Ambiente de pre-producao" },
  PROD: { name: "Production", color: "#4CAF50", icon: "check-circle", description: "Ambiente de producao" },
  UNKNOWN: { name: "Unknown", color: "#9E9E9E", icon: "help-circle", description: "Ambiente nao identificado" }
}), _ = Object.freeze({ apiBaseUrl: "/api", assetsBaseUrl: "/assets", configBaseUrl: "/config", telemetryEndpoint: "/api/telemetry/" }), S = "2.2.0-ENTERPRISE", T = "environment-manager-store";
function l() {
  this._state = null, this._listeners = [], this._initialized = !1, this._destroyed = !1;
}
l.prototype.initialize = function(e) {
  if (this._initialized && this._state) return this._state;
  var t = e.environment || n.UNKNOWN, r = H[t] || f.DEVELOPMENT, c = P[t] || P[n.UNKNOWN], s = e.policies || w[t] || w[n.UNKNOWN];
  return this._state = Object.freeze({
    version: S,
    moduleId: T,
    environment: t,
    mode: r,
    hostname: e.hostname || "",
    protocol: e.protocol || "https:",
    port: e.port || "",
    isSecure: e.protocol === "https:",
    apiBaseUrl: e.apiBaseUrl || _.apiBaseUrl,
    assetsBaseUrl: e.assetsBaseUrl || _.assetsBaseUrl,
    configBaseUrl: e.configBaseUrl || _.configBaseUrl,
    telemetryEndpoint: e.telemetryEndpoint || _.telemetryEndpoint,
    debug: s.debug,
    enableServiceWorker: s.enableServiceWorker,
    cacheLevel: s.cacheLevel,
    logLevel: s.logLevel,
    showErrors: s.showErrors,
    enableExperimentation: s.enableExperimentation,
    telemetrySampling: s.telemetrySampling,
    metadata: c,
    detectionMethod: e.detectionMethod || "unknown",
    resolvedAt: Date.now()
  }), this._initialized = !0, this._destroyed = !1, this._notifyListeners("initialized", this._state), this._state;
};
l.prototype.get = function(e) {
  return this._state ? e === void 0 ? this._state : this._state[e] !== void 0 ? this._state[e] : null : null;
};
l.prototype.isReady = function() {
  return this._initialized && !this._destroyed && this._state !== null;
};
l.prototype.getContext = function() {
  return this._state ? { env: this._state.environment, mode: this._state.mode, hostname: this._state.hostname, isSecure: this._state.isSecure, debug: this._state.debug, enableServiceWorker: this._state.enableServiceWorker, cacheLevel: this._state.cacheLevel, logLevel: this._state.logLevel, telemetrySampling: this._state.telemetrySampling, apiBaseUrl: this._state.apiBaseUrl, telemetryEndpoint: this._state.telemetryEndpoint } : { env: n.UNKNOWN, mode: f.DEVELOPMENT, debug: !1, enableServiceWorker: !1, cacheLevel: "none" };
};
l.prototype.is = function(e) {
  return this._state ? this._state.environment === e : !1;
};
l.prototype.isAny = function() {
  if (!this._state) return !1;
  for (var e = 0; e < arguments.length; e++)
    if (this._state.environment === arguments[e]) return !0;
  return !1;
};
l.prototype.isProd = function() {
  return this.is(n.PROD);
};
l.prototype.isDev = function() {
  return this.isAny(n.SANDBOX, n.DEV, n.LOCAL);
};
l.prototype.isTest = function() {
  return this.isAny(n.TEST, n.STAGE);
};
l.prototype.isLocal = function() {
  return this.isAny(n.LOCAL, n.SANDBOX);
};
l.prototype.isStaging = function() {
  return this.is(n.STAGE);
};
l.prototype.canDebug = function() {
  return this._state && this._state.debug === !0;
};
l.prototype.shouldEnableSW = function() {
  return this._state && this._state.enableServiceWorker === !0;
};
l.prototype.onChange = function(e) {
  if (typeof e != "function") throw new TypeError("Callback deve ser uma função");
  var t = this;
  return this._listeners.push(e), function() {
    var r = t._listeners.indexOf(e);
    r > -1 && t._listeners.splice(r, 1);
  };
};
l.prototype._notifyListeners = function(e, t) {
  this._listeners.forEach(function(r) {
    try {
      r(e, t);
    } catch {
    }
  });
};
l.prototype.getDebugInfo = function() {
  return { version: S, moduleId: T, initialized: this._initialized, destroyed: this._destroyed, state: this._state, listenersCount: this._listeners.length, stateAge: this._state ? Date.now() - this._state.resolvedAt : null };
};
l.prototype.reset = function() {
  this._state = null, this._initialized = !1, this._destroyed = !1, this._notifyListeners("reset", null);
};
l.prototype.destroy = function() {
  this._listeners = [], this._destroyed = !0;
};
l.prototype.info = function() {
  return { moduleId: T, version: S, initialized: this._initialized, environment: this._state ? this._state.environment : null };
};
l.prototype.healthCheck = function() {
  return { status: this._initialized ? "HEALTHY" : "IDLE", moduleId: T, version: S, checks: { initialized: this._initialized, stateReady: !!this._state, notDestroyed: !this._destroyed } };
};
var o = new l(), Y = "2.6.0-ENTERPRISE";
function O() {
}
O.prototype.resolve = function(e) {
  e === void 0 && (e = {});
  var t = typeof window < "u", r = e.hostname || (t ? window.location.hostname : ""), c = e.protocol || (t ? window.location.protocol : "https:"), s = e.port || (t ? window.location.port : ""), u = e.appConfig || null, N = r.toLowerCase(), d = n.UNKNOWN, y = "fallback";
  if (u && u.app && u.app.environment) {
    var R = this._mapConfigEnvironment(u.app.environment);
    R !== n.UNKNOWN && (d = R, y = "app-config");
  } else if (u && u.environment) {
    var B = this._mapConfigEnvironment(u.environment);
    B !== n.UNKNOWN && (d = B, y = "app-config");
  }
  if (d === n.UNKNOWN) {
    var C = this._detectByHostname(N);
    C.environment !== n.UNKNOWN && (d = C.environment, y = C.method);
  }
  if (d === n.UNKNOWN && s) {
    var W = $[s];
    W && (d = W, y = "port-mapping");
  }
  d === n.UNKNOWN && (c === "http:" && N.indexOf("prod") === -1 ? (d = n.DEV, y = "protocol-http") : c === "https:" && (d = n.PROD, y = "protocol-https-fallback"));
  var G = u && u.api && u.api.cardsBaseUrl || u && u.app && u.app.apiUrl || this.resolveBaseURL("api", d), M = u && u.paths && u.paths.assets || this.resolveBaseURL("assets", d), K = this.resolveBaseURL("config", d), F = this.resolveBaseURL("telemetry", d), j = w[d] || w[n.UNKNOWN];
  return { environment: d, hostname: r, protocol: c, port: s, apiBaseUrl: G, assetsBaseUrl: M, configBaseUrl: K, telemetryEndpoint: F, detectionMethod: y, policies: j };
};
O.prototype.resolveBaseURL = function(e, t) {
  var r = V[e];
  return r ? r[t] || r[n.PROD] || _.apiBaseUrl : _[e + "BaseUrl"] || _.apiBaseUrl;
};
O.prototype._mapConfigEnvironment = function(e) {
  if (!e) return n.UNKNOWN;
  var t = String(e).toLowerCase().trim();
  return t === "local" ? n.LOCAL : t.indexOf("sandbox") !== -1 ? n.SANDBOX : t.indexOf("dev") !== -1 || t === "development" ? n.DEV : t.indexOf("test") !== -1 || t === "qa" || t === "homolog" ? n.TEST : t.indexOf("stag") !== -1 || t === "stage" || t === "pre-prod" ? n.STAGE : t.indexOf("prod") !== -1 || t === "production" ? n.PROD : n.UNKNOWN;
};
O.prototype._detectByHostname = function(e) {
  var t, r;
  for (t = 0; t < h.LOCAL.length; t++)
    if (r = h.LOCAL[t], e.indexOf(r.toLowerCase()) !== -1) return { environment: n.LOCAL, method: "pattern-local" };
  for (t = 0; t < h.DEV.length; t++)
    if (r = h.DEV[t], e.indexOf(r.toLowerCase()) !== -1) return { environment: n.DEV, method: "pattern-dev" };
  for (t = 0; t < h.TEST.length; t++)
    if (r = h.TEST[t], e.indexOf(r.toLowerCase()) !== -1) return { environment: n.TEST, method: "pattern-test" };
  for (t = 0; t < h.STAGE.length; t++)
    if (r = h.STAGE[t], e.indexOf(r.toLowerCase()) !== -1) return { environment: n.STAGE, method: "pattern-stage" };
  for (t = 0; t < h.PROD.length; t++)
    if (r = h.PROD[t], e.indexOf(r.toLowerCase()) !== -1) return { environment: n.PROD, method: "pattern-prod" };
  return { environment: n.UNKNOWN, method: "no-match" };
};
O.prototype.normalizeEnvironment = function(e) {
  return this._mapConfigEnvironment(e);
};
var I = new O(), x = "2.4.0-STRICT-MODE", b = "environment-manager-telemetry", q = k({ moduleId: b });
function z(e) {
  return q.get(e);
}
function Q() {
  var e = z("appConfig");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("APP_CONFIG");
    if (t) return t;
  }
  return L() ? null : typeof window < "u" && window.APP_CONFIG ? (A("WINDOW_APP_CONFIG_FALLBACK", { module: b }), window.APP_CONFIG) : null;
}
function J() {
  var e = z("telemetry");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Telemetry");
    if (t) return t;
  }
  return L() ? null : typeof window < "u" && window.Telemetry ? (A("WINDOW_TELEMETRY_FALLBACK", { module: b }), window.Telemetry) : null;
}
var Z = function() {
  var e = Q();
  return !!(e && e.app && e.app.debug);
}, ee = function(e) {
  var t = z("logger"), r = Array.prototype.slice.call(arguments, 1);
  t && Z() && t.debug && t.debug.apply(t, ["[EnvironmentManager:Telemetry]"].concat(r));
};
function p() {
  this._events = [], this._maxEvents = 100, this._eventCount = 0;
}
p.prototype.track = function(e, t) {
  t || (t = {});
  var r = { timestamp: Date.now(), event: e, component: "environment-manager", moduleId: b, index: this._eventCount++ };
  for (var c in t)
    t.hasOwnProperty(c) && (r[c] = t[c]);
  this._events.push(r), this._events.length > this._maxEvents && this._events.shift();
  var s = J();
  if (s && s.track)
    try {
      s.track("env:" + e, { component: "environment-manager" });
    } catch {
    }
  return ee("info", e, t), r;
};
p.prototype.trackError = function(e, t) {
  return t || (t = {}), this.track("error", { errorMessage: e.message || String(e), errorStack: e.stack || null, context: t });
};
p.prototype.trackInit = function(e) {
  return this.track("initialized", { environment: e.environment, mode: e.mode, detectionMethod: e.detectionMethod, hostname: e.hostname, debug: e.debug, enableServiceWorker: e.enableServiceWorker });
};
p.prototype.trackFallback = function(e) {
  return this.track("fallback-applied", { reason: e });
};
p.prototype.trackEnvChange = function(e, t, r) {
  return this.track("environment-changed", { previousEnv: e, newEnv: t, source: r });
};
p.prototype.getEvents = function() {
  return this._events.slice();
};
p.prototype.getLastEvents = function(e) {
  return e || (e = 10), this._events.slice(-e);
};
p.prototype.getEventsByType = function(e) {
  return this._events.filter(function(t) {
    return t.event === e;
  });
};
p.prototype.clear = function() {
  this._events = [], this._eventCount = 0;
};
p.prototype.getSummary = function() {
  var e = this._events.filter(function(r) {
    return r.event === "error";
  }).length, t = this._events.filter(function(r) {
    return r.event === "fallback-applied";
  }).length;
  return { version: x, moduleId: b, totalEvents: this._events.length, totalTracked: this._eventCount, errors: e, fallbacks: t, strictMode: L(), lastEvent: this._events[this._events.length - 1] || null };
};
p.prototype.getStats = function() {
  return this.getSummary();
};
var g = new p(), m = "2.5.1-GOVERNANCE-STRICT-MODE", E = "environment-manager", D = k({ moduleId: E });
function te(e) {
  return D.get(e);
}
function ne(e) {
  return D.inject(e);
}
function re() {
  return D.snapshot();
}
function ae() {
  return m;
}
var ie = function() {
  return !!(window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.debug);
}, U = function(e) {
  var t = Array.prototype.slice.call(arguments, 1), r = te("logger");
  if (r && !(!ie() && e === "debug")) {
    var c = r[e] || r.info;
    typeof c == "function" && c.apply(r, ["[EnvironmentManager]"].concat(t));
  }
};
function i() {
  this._initialized = !1, this._initPromise = null, this._destroyed = !1;
}
i.prototype.init = function(e) {
  var t = this;
  return e = e || {}, t._initialized ? Promise.resolve(o.get()) : (t._initPromise || (t._initPromise = t._performInit(e)), t._initPromise);
};
i.prototype._performInit = function(e) {
  var t = this;
  e = e || {};
  try {
    var r = e.appConfig || null;
    !r && typeof window < "u" && (r = window.APP_CONFIG || window.AppConfig || window.appConfig || null);
    var c = I.resolve({ hostname: e.hostname, protocol: e.protocol, port: e.port, appConfig: r }), s = o.initialize(c);
    return t._initialized = !0, t._destroyed = !1, g.trackInit(s), U("info", "Inicializado:", { environment: s.environment, mode: s.mode, hostname: s.hostname, detectionMethod: s.detectionMethod, debug: s.debug }), t._exposeGlobal(s), Promise.resolve(s);
  } catch (N) {
    g.trackError(N, { phase: "init" }), g.trackFallback("init-error");
    var u = o.initialize({ environment: n.UNKNOWN, hostname: typeof window < "u" ? window.location.hostname : "", protocol: typeof window < "u" ? window.location.protocol : "https:", port: typeof window < "u" ? window.location.port : "", detectionMethod: "fallback-error" });
    return t._initialized = !0, U("error", "Fallback aplicado:", N), Promise.resolve(u);
  }
};
i.prototype._exposeGlobal = function(e) {
  var t = this;
  typeof window > "u" || (window.__dev = window.__dev || {}, window.__dev.environment = { getVersion: function() {
    return m;
  }, healthCheck: function() {
    return t.healthCheck();
  }, info: function() {
    return t.info();
  }, getDiagnostics: function() {
    return t.getDiagnostics();
  }, getContext: function() {
    return t.getContext();
  }, store: o, resolver: I, telemetry: g }, L() ? (A("GLOBAL_EXPOSURE_BLOCKED", { module: E, global: "__ENV_MANAGER__" }), A("GLOBAL_EXPOSURE_BLOCKED", { module: E, global: "Environment" })) : (Object.getOwnPropertyDescriptor(window, "__ENV_MANAGER__") || Object.defineProperty(window, "__ENV_MANAGER__", { value: t, writable: !1, configurable: !1, enumerable: !1 }), Object.getOwnPropertyDescriptor(window, "Environment") || Object.defineProperty(window, "Environment", { value: Object.freeze({ get: function(r) {
    return t.get(r);
  }, getBaseURL: function(r) {
    return t.getBaseURL(r);
  }, getContext: function() {
    return t.getContext();
  }, is: function(r) {
    return t.is(r);
  }, isAny: function() {
    return t.isAny.apply(t, arguments);
  }, isProd: function() {
    return t.isProd();
  }, isDev: function() {
    return t.isDev();
  }, isTest: function() {
    return t.isTest();
  }, isLocal: function() {
    return t.isLocal();
  }, isStaging: function() {
    return t.isStaging();
  }, isReady: function() {
    return t.isReady();
  }, canDebug: function() {
    return t.canDebug();
  }, shouldEnableSW: function() {
    return t.shouldEnableSW();
  }, onChange: function(r) {
    return t.onChange(r);
  }, getVersion: function() {
    return m;
  }, healthCheck: function() {
    return t.healthCheck();
  }, info: function() {
    return t.info();
  }, ENVIRONMENTS: n, MODES: f }), writable: !1, configurable: !1, enumerable: !0 })));
};
i.prototype.get = function(e) {
  return this._ensureInitialized(), o.get(e);
};
i.prototype.getEnv = function() {
  return this._ensureInitialized(), o.get("environment");
};
i.prototype.getBaseURL = function(e) {
  this._ensureInitialized();
  var t = o.get("environment");
  return I.resolveBaseURL(e, t);
};
i.prototype.getContext = function() {
  return this._ensureInitialized(), o.getContext();
};
i.prototype.isReady = function() {
  return this._initialized && !this._destroyed && o.isReady();
};
i.prototype.is = function(e) {
  return this._ensureInitialized(), o.is(e);
};
i.prototype.isAny = function() {
  return this._ensureInitialized(), o.isAny.apply(o, arguments);
};
i.prototype.isProd = function() {
  return this._ensureInitialized(), o.isProd();
};
i.prototype.isDev = function() {
  return this._ensureInitialized(), o.isDev();
};
i.prototype.isTest = function() {
  return this._ensureInitialized(), o.isTest();
};
i.prototype.isLocal = function() {
  return this._ensureInitialized(), o.isLocal();
};
i.prototype.isStaging = function() {
  return this._ensureInitialized(), o.isStaging();
};
i.prototype.canDebug = function() {
  return this._ensureInitialized(), o.canDebug();
};
i.prototype.shouldEnableSW = function() {
  return this._ensureInitialized(), o.shouldEnableSW();
};
i.prototype.onChange = function(e) {
  return o.onChange(e);
};
i.prototype._ensureInitialized = function() {
  this._initialized || (U("warn", "Chamado antes de inicializar. Inicializando automaticamente..."), this.init());
};
i.prototype.healthCheck = function() {
  var e = [];
  this._initialized || e.push("Not initialized"), this._destroyed && e.push("Manager destroyed");
  var t = o.get();
  return t || e.push("No state available"), t && t.environment === n.UNKNOWN && e.push("Environment unknown"), { healthy: e.length === 0, status: e.length === 0 ? "HEALTHY" : "DEGRADED", version: m, moduleId: E, initialized: this._initialized, destroyed: this._destroyed, environment: t ? t.environment : n.UNKNOWN, mode: t ? t.mode : f.DEVELOPMENT, detectionMethod: t ? t.detectionMethod : "none", issues: e.length > 0 ? e : null, portsInitialized: D.isInitialized(), timestamp: Date.now() };
};
i.prototype.info = function() {
  var e = o.get(), t = o.getContext();
  return { name: E, version: m, status: this.healthCheck(), environment: e ? e.environment : null, mode: e ? e.mode : null, context: t, urls: { api: e ? e.apiBaseUrl : null, assets: e ? e.assetsBaseUrl : null, config: e ? e.configBaseUrl : null, telemetry: e ? e.telemetryEndpoint : null }, policies: { debug: e ? e.debug : !1, enableServiceWorker: e ? e.enableServiceWorker : !1, cacheLevel: e ? e.cacheLevel : null, logLevel: e ? e.logLevel : null }, detection: { method: e ? e.detectionMethod : null, hostname: e ? e.hostname : null, isSecure: e ? e.isSecure : !1 }, modules: { config: X, store: S, resolver: Y, telemetry: x }, telemetrySummary: g.getSummary(), portsInitialized: D.isInitialized(), timestamp: Date.now() };
};
i.prototype.getDiagnostics = function() {
  return { version: m, moduleId: E, initialized: this._initialized, destroyed: this._destroyed, store: o.getDebugInfo(), telemetry: g.getSummary(), constants: { ENVIRONMENTS: n, MODES: f }, baseUrls: V, policies: w };
};
i.prototype.getDebugInfo = function() {
  return this.getDiagnostics();
};
i.prototype.getTelemetry = function() {
  return g.getEvents();
};
i.prototype.reset = function() {
  o.reset(), g.clear(), this._initialized = !1, this._initPromise = null, this._destroyed = !1;
};
i.prototype.destroy = function() {
  o.destroy(), this._destroyed = !0;
};
var a = new i(), le = {
  init: function(e) {
    return a.init(e);
  },
  reset: function() {
    return a.reset();
  },
  destroy: function() {
    return a.destroy();
  },
  get: function(e) {
    return a.get(e);
  },
  getEnv: function() {
    return a.getEnv();
  },
  getBaseURL: function(e) {
    return a.getBaseURL(e);
  },
  getContext: function() {
    return a.getContext();
  },
  is: function(e) {
    return a.is(e);
  },
  isAny: function() {
    return a.isAny.apply(a, arguments);
  },
  isProd: function() {
    return a.isProd();
  },
  isDev: function() {
    return a.isDev();
  },
  isTest: function() {
    return a.isTest();
  },
  isLocal: function() {
    return a.isLocal();
  },
  isStaging: function() {
    return a.isStaging();
  },
  isReady: function() {
    return a.isReady();
  },
  canDebug: function() {
    return a.canDebug();
  },
  shouldEnableSW: function() {
    return a.shouldEnableSW();
  },
  onChange: function(e) {
    return a.onChange(e);
  },
  getVersion: function() {
    return m;
  },
  healthCheck: function() {
    return a.healthCheck();
  },
  info: function() {
    return a.info();
  },
  getDiagnostics: function() {
    return a.getDiagnostics();
  },
  getDebugInfo: function() {
    return a.getDebugInfo();
  },
  getTelemetry: function() {
    return a.getTelemetry();
  },
  injectPorts: ne,
  getPorts: re,
  ENVIRONMENTS: n,
  MODES: f,
  METADATA: P,
  VERSION: m,
  MODULE_ID: E
};
export {
  n as ENVIRONMENTS,
  le as Environment,
  P as METADATA,
  f as MODES,
  E as MODULE_ID,
  m as VERSION,
  le as default,
  re as getPorts,
  ae as getVersion,
  ne as injectPorts
};
