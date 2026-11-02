import { createUiPorts as p, createCorePorts as h, createTelemetryPorts as g } from "/core/runtime/ports-profiles.js";
import { FOOTER_EVENTS as B, UI_EVENTS as d, FOOTER_INTENTS as Wd, COMPONENT_EVENTS as f, TELEMETRY_EVENTS as a, AUTH_EVENTS as Ep, ROUTER_EVENTS as $c, KERNEL_RUNTIME_EVENTS as aw, PANEL_EVENTS as lw, TELEMETRY_INTENTS as v } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { isStrict as tj, recordViolation as uw } from "/core/runtime/enterprise/strict-mode.js";
import { FOOTER_EVENT_NAMES as F2 } from "/core/runtime/constants/event-names.js";
import LI from "/assets/animacoes/index.js";
import { waitForAppShell as q2, waitForAuth as ej } from "/core/runtime/boot-ready-dom-bridge.js";
import { createLogger as nj } from "/assets/js/core/logger-global/dist/logger-global.bundle.js";
const qE = "5.9.0-P2-ENTERPRISE", hf = "footer.store", Nv = p({ moduleId: hf });
function ij() {
  Nv.init();
}
function cM(t) {
  return Nv.get(t);
}
const oj = () => {
  var t, e;
  return ((e = (t = cM("config")) == null ? void 0 : t.app) == null ? void 0 : e.debug) || !1;
}, ZE = (t, ...e) => {
  var n, i, o, s;
  const r = cM("logger");
  if (!r) return;
  const c = `[${hf}]`;
  if (t === "error") {
    (n = r.error) == null || n.call(r, c, ...e);
    return;
  }
  if (t === "warn") {
    (i = r.warn) == null || i.call(r, c, ...e);
    return;
  }
  if (t === "info") {
    (o = r.info) == null || o.call(r, c, ...e);
    return;
  }
  oj() && ((s = r.debug) == null || s.call(r, c, ...e));
};
let gc = { initCount: 0, onlineChanges: 0, tickCount: 0, errors: 0 };
class sj {
  constructor() {
    this.state = {
      online: typeof navigator < "u" ? navigator.onLine : !0,
      lastUpdate: null,
      version: null,
      environment: null,
      mounted: !1,
      sessionStart: Date.now()
    }, this._listeners = /* @__PURE__ */ new Set(), this._timers = /* @__PURE__ */ new Map(), this._initialized = !1;
  }
  init(e = {}) {
    var n, i;
    if (this._initialized) return;
    ij(), gc.initCount++;
    const o = cM("config");
    this.state.version = e.version || ((n = o == null ? void 0 : o.app) == null ? void 0 : n.version) || "0.0.0", this.state.environment = e.environment || ((i = o == null ? void 0 : o.app) == null ? void 0 : i.env) || "production", this.state.sessionStart = Date.now(), this._initialized = !0, ZE("info", "Store initialized");
  }
  getState() {
    return { ...this.state };
  }
  getStatus() {
    return {
      moduleId: hf,
      version: qE,
      initialized: this._initialized,
      state: this.getState(),
      timerCount: this._timers.size,
      subscriberCount: this._listeners.size,
      metrics: this.getMetrics(),
      timestamp: Date.now()
    };
  }
  setState(e) {
    const n = { ...this.state };
    this.state = { ...this.state, ...e }, this._notify(n, this.state);
  }
  setOnline(e) {
    this.state.online !== e && (gc.onlineChanges++, this.setState({ online: e }));
  }
  setMounted(e) {
    this.setState({ mounted: e });
  }
  setTimer(e, n) {
    this._timers.has(e) && clearInterval(this._timers.get(e)), this._timers.set(e, n);
  }
  clearTimer(e) {
    this._timers.has(e) && (clearInterval(this._timers.get(e)), this._timers.delete(e));
  }
  getSessionElapsed() {
    return Date.now() - (this.state.sessionStart || Date.now());
  }
  tick() {
    gc.tickCount++, this.setState({ lastUpdate: Date.now() });
  }
  subscribe(e) {
    return this._listeners.add(e), () => this._listeners.delete(e);
  }
  _notify(e, n) {
    this._listeners.forEach((i) => {
      try {
        i(n, e);
      } catch (o) {
        gc.errors++, ZE("error", "Subscriber error:", o);
      }
    });
  }
  destroy() {
    this._timers.forEach((e) => clearInterval(e)), this._timers.clear(), this._listeners.clear(), this._initialized = !1, ZE("info", "Store destroyed");
  }
  getMetrics() {
    return { ...gc };
  }
  info() {
    const e = Nv.snapshot();
    return {
      moduleId: hf,
      version: qE,
      state: this.getState(),
      initialized: this._initialized,
      subscriberCount: this._listeners.size,
      timerCount: this._timers.size,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  }
  healthCheck() {
    const e = Nv.snapshot(), n = {
      initialized: this._initialized,
      validState: !!this.state,
      lowErrors: gc.errors < 10,
      sessionActive: !!this.state.sessionStart,
      portsInitialized: e._initialized
    }, i = Object.values(n).filter(Boolean).length, o = Object.keys(n).length;
    return {
      status: i === o ? "HEALTHY" : "DEGRADED",
      score: i,
      maxScore: o,
      scoreDisplay: `${i}/${o}`,
      checks: n,
      metrics: gc,
      version: qE,
      moduleId: hf,
      timestamp: Date.now()
    };
  }
}
const yh = "5.5.1-P18EC", yc = "footer.telemetry", fm = "footer", Uk = p({ moduleId: yc });
function rj() {
  Uk.init();
}
function hm(t) {
  return Uk.get(t);
}
const Xd = {
  info(t, e) {
    e = e || {};
    const n = hm("logger");
    n && n.info && n.info(t, Object.assign({ component: yc }, e));
  },
  warn(t, e) {
    e = e || {};
    const n = hm("logger");
    n && n.warn && n.warn(t, Object.assign({ component: yc }, e));
  },
  error(t, e) {
    e = e || {};
    const n = hm("logger");
    n && n.error && n.error(t, Object.assign({ component: yc }, e));
  },
  debug(t, e) {
    e = e || {};
    const n = hm("logger");
    n && n.debug && n.debug(t, Object.assign({ component: yc }, e));
  }
}, hr = { initCount: 0, eventsTracked: 0, errorsTracked: 0, warningsTracked: 0 };
function T() {
  this._context = { component: fm, version: yh, environment: "production", containerId: null }, this._debugMode = !1, this._initialized = !1, this._telemetryCore = null;
}
T.prototype.init = function(t) {
  if (t = t || {}, this._initialized) {
    Xd.warn("Already initialized");
    return;
  }
  rj(), this._context = { component: this._context.component, version: t.version || this._context.version, environment: t.environment || this._context.environment, containerId: t.containerId || null }, this._debugMode = t.debug || !1, this._initTelemetryCore(), this._initialized = !0, hr.initCount++, Xd.info("Initialized", { context: this._context });
};
T.prototype._initTelemetryCore = function() {
  const t = this;
  try {
    const e = hm("telemetry");
    e && (t._telemetryCore = e, t._telemetryCore.isReady && !t._telemetryCore.isReady() && t._telemetryCore.init && t._telemetryCore.init({ endpoint: "/api/telemetry/", debug: !1, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 }), t._telemetryCore.setContext && t._telemetryCore.setContext({ containerId: t._context.containerId }), Xd.info("Telemetry Core connected"));
  } catch (e) {
    Xd.warn("Telemetry Core not available", { error: e.message });
  }
};
T.prototype.track = function(t, e, n) {
  if (e = e || {}, n = n || "info", t === "tick" && !this._debugMode) return;
  const i = Object.assign({}, e, { containerId: this._context.containerId, environment: this._context.environment });
  if (this._telemetryCore)
    try {
      const o = `${fm}:${t}`;
      n === "error" ? (this._telemetryCore.error && this._telemetryCore.error(o, i, { component: fm, severity: "error" }), hr.errorsTracked++) : n === "warn" ? (this._telemetryCore.event && this._telemetryCore.event(o, i, { component: fm, severity: "warn" }), hr.warningsTracked++) : this._telemetryCore.event && this._telemetryCore.event(o, i, { component: fm, severity: "info" }), hr.eventsTracked++;
    } catch {
    }
  this._debugMode && Xd.debug(t, e);
};
T.prototype.trackFooterEvent = function(t, e) {
  this.track(t, e || {}, "info");
};
T.prototype.trackError = function(t, e) {
  this.track(t, e || {}, "error");
};
T.prototype.trackWarning = function(t, e) {
  this.track(t, e || {}, "warn");
};
T.prototype.info = function(t, e) {
  this.track(t, e, "info");
};
T.prototype.warn = function(t, e) {
  this.track(t, e, "warn");
};
T.prototype.error = function(t, e) {
  this.track(t, e, "error");
};
T.prototype.debug = function(t, e) {
  this._debugMode && this.track(t, e, "debug");
};
T.prototype.destroy = function() {
  this._initialized = !1, Xd.info("Destroyed");
};
T.getVersion = () => yh;
T.getMetrics = () => Object.assign({}, hr);
T.prototype.getVersion = () => yh;
T.prototype.getMetrics = () => Object.assign({}, hr);
T.prototype.healthCheck = function() {
  const t = Uk.snapshot(), e = { initialized: this._initialized, hasContext: !!this._context, telemetryCoreAvailable: !!this._telemetryCore, lowErrors: hr.errorsTracked < 50, portsInitialized: t._initialized }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
  return { status: n >= 4 ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: i, scoreDisplay: `${n}/${i}`, checks: e, metrics: hr, version: yh, moduleId: yc, portsInitialized: t._initialized, timestamp: Date.now() };
};
T.prototype.getInfo = function() {
  const t = Uk.snapshot();
  return { version: yh, moduleId: yc, initialized: this._initialized, context: Object.assign({}, this._context), hasTelemetryCore: !!this._telemetryCore, metrics: this.getMetrics(), portsInitialized: t._initialized, healthCheck: this.healthCheck() };
};
function cj(t) {
  return '<footer class="app-footer dsd-footer" role="contentinfo" aria-label="Rodapé da aplicação" data-uarps-region="region:app:footer"><div class="dsd-footer__top"><div class="dsd-footer__top-inner"><div class="dsd-footer__brand" data-slot="brand"><div class="dsd-footer__brand-content"><img src="/assets/icons/logo-horizontal.png" alt="Logotipo Dshow" class="dsd-footer__brand-logo-img" loading="lazy" width="120" height="28" /></div></div><div class="dsd-footer__icons" data-slot="decorative-icons"></div><div class="dsd-footer__status" data-slot="quick-status"></div></div></div><div class="dsd-footer__bottom"><div class="dsd-footer__bottom-inner"><div class="dsd-footer__copyright" data-slot="copyright"><span class="dsd-footer__copyright-text">© 2025 Display Solutions. Todos os direitos reservados.</span></div><div class="dsd-footer__meta" data-slot="meta"><span class="dsd-footer__meta-item" data-meta="build"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg><span data-value="build">Build: --</span></span><span class="dsd-footer__meta-sep">•</span><span class="dsd-footer__meta-item" data-meta="ip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><span data-value="ip">IP: --</span></span><span class="dsd-footer__meta-sep">•</span><span class="dsd-footer__meta-item" data-meta="location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span data-value="location">Local: --</span></span></div><div class="dsd-footer__actions-bar"><div class="dsd-footer__legal" data-slot="links"><a href="/termos" class="dsd-footer__link" data-uarps-trigger="trigger:footer:termos">Termos de Uso</a><a href="/privacidade" class="dsd-footer__link" data-uarps-trigger="trigger:footer:privacidade">Privacidade</a><a href="/lgpd" class="dsd-footer__link" data-uarps-trigger="trigger:footer:lgpd">LGPD</a></div><div class="dsd-footer__controls"><div class="dsd-footer__session-slot" data-slot="session-timer"></div><button class="dsd-footer__control-btn" data-action="language" data-uarps-trigger="trigger:footer:language" title="Idioma"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>PT</span></button><button class="dsd-footer__control-btn dsd-footer__control-btn--logout" data-action="logout" data-uarps-trigger="trigger:footer:logout" title="Sair"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Sair</span></button></div></div></div></div><div class="dsd-footer__announce" data-slot="announce" aria-live="polite" aria-atomic="true"></div></footer>';
}
const Z2 = "7.1.0-EVENT-CONSTANTS", Hk = "footer.events", aM = { REFRESH: "footer:refresh", ROUTE_CHANGED: "footer:route:changed" }, lM = p({ moduleId: Hk });
function Jd(t) {
  return lM.get(t);
}
const aj = () => {
  const t = Jd("config");
  return !!(t && t.app && t.app.debug);
}, U = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = Jd("logger");
  if (!n) return;
  const i = `[${Hk}]`;
  if (t === "error") {
    n.error && n.error(i, e.join(" "));
    return;
  }
  if (t === "warn") {
    n.warn && n.warn(i, e.join(" "));
    return;
  }
  if (t === "info") {
    n.info && n.info(i, e.join(" "));
    return;
  }
  aj() && n.debug && n.debug(i, e.join(" "));
}, A = {
  initCount: 0,
  attachCount: 0,
  onlineEvents: 0,
  offlineEvents: 0,
  visibilityEvents: 0,
  refreshEvents: 0,
  authEvents: 0,
  intentShow: 0,
  intentHide: 0,
  intentRefresh: 0,
  errors: 0
};
function w() {
  this._abortController = null, this._handlers = /* @__PURE__ */ new Map(), this._initialized = !1, this._attached = !1, this._eventBus = null, this._globalState = null, this._appShell = null, this._cleanupFns = [], this._footerElement = null, this._store = null, this._callbacks = null;
}
w.prototype.init = function(t, e) {
  const n = this;
  if (e = e || {}, this._initialized) return;
  A.initCount++, this._store = t, this._callbacks = e, this._abortController = new AbortController();
  const i = this._abortController.signal;
  window.addEventListener("online", () => {
    A.onlineEvents++, t && t.setOnline && t.setOnline(!0), e.onOnline && e.onOnline();
  }, { signal: i }), window.addEventListener("offline", () => {
    A.offlineEvents++, t && t.setOnline && t.setOnline(!1), e.onOffline && e.onOffline();
  }, { signal: i }), document.addEventListener("visibilitychange", () => {
    A.visibilityEvents++, document.visibilityState === "visible" && e.onVisible && e.onVisible();
  }, { signal: i });
  const o = Jd("eventBus");
  if (o && o.on) {
    const s = o.on(Ep.LOGIN_SUCCESS, () => {
      A.authEvents++, n.emit(Ep.CHANGED, { authenticated: !0 });
    }), r = o.on(Ep.LOGOUT, () => {
      A.authEvents++, n.emit(Ep.CHANGED, { authenticated: !1 });
    });
    typeof s == "function" && this._cleanupFns.push(s), typeof r == "function" && this._cleanupFns.push(r);
  }
  this._initialized = !0, U("info", "Events initialized");
};
w.prototype.attach = function(t) {
  const e = this;
  if (t = t || {}, this._attached) {
    U("warn", "Already attached");
    return;
  }
  A.attachCount++;
  const n = t.eventBus || Jd("eventBus"), i = t.globalState || Jd("globalState"), o = Jd("appShell");
  try {
    if (this._eventBus = n, this._globalState = i, this._appShell = o, this._eventBus && this._eventBus.on) {
      const s = this._eventBus.on($c.ROUTE_CHANGED, (r) => {
        e.emit(aM.ROUTE_CHANGED, r);
      });
      typeof s == "function" && this._cleanupFns.push(s), this._setupIntentsListeners();
    }
    this._attached = !0, U("info", `Events attached hasEventBus=${!!n} hasGlobalState=${!!i} intentsReady=true`);
  } catch (s) {
    A.errors++, U("error", "Attach failed:", s.message);
  }
};
w.prototype._setupIntentsListeners = function() {
  const t = this;
  if (!this._eventBus || !this._eventBus.on) return;
  const e = this._eventBus.on(Wd.SHOW, (o) => {
    A.intentShow++, U("info", "FOOTER_INTENTS.SHOW received", o), t._handleShowIntent(o);
  });
  typeof e == "function" && this._cleanupFns.push(e);
  const n = this._eventBus.on(Wd.HIDE, (o) => {
    A.intentHide++, U("info", "FOOTER_INTENTS.HIDE received", o), t._handleHideIntent(o);
  });
  typeof n == "function" && this._cleanupFns.push(n);
  const i = this._eventBus.on(Wd.REFRESH, (o) => {
    A.intentRefresh++, U("info", "FOOTER_INTENTS.REFRESH received", o), t._handleRefreshIntent(o);
  });
  typeof i == "function" && this._cleanupFns.push(i), U("info", "FOOTER_INTENTS listeners ready");
};
w.prototype._handleShowIntent = function(t) {
  t = t || {};
  const e = this._getFooterElement();
  if (!e) {
    U("warn", "Footer element not found for SHOW intent");
    return;
  }
  e.classList.remove("dsd-footer--hidden"), e.removeAttribute("aria-hidden"), e.style.display = "", this._store && this._store.setState && this._store.setState({ visible: !0 }), this.emit(F2.SHOWN, { reason: t.reason || "intent", timestamp: Date.now() }), U("info", "Footer shown via intent");
};
w.prototype._handleHideIntent = function(t) {
  t = t || {};
  const e = this._getFooterElement();
  if (!e) {
    U("warn", "Footer element not found for HIDE intent");
    return;
  }
  e.classList.add("dsd-footer--hidden"), e.setAttribute("aria-hidden", "true"), this._store && this._store.setState && this._store.setState({ visible: !1 }), this.emit(F2.HIDDEN, { reason: t.reason || "intent", timestamp: Date.now() }), U("info", "Footer hidden via intent");
};
w.prototype._handleRefreshIntent = function(t) {
  t = t || {}, A.refreshEvents++, this.emit(aM.REFRESH, { timestamp: Date.now(), reason: t.reason || "intent" }), this._callbacks && this._callbacks.onRefresh && this._callbacks.onRefresh(t), U("info", "Footer refresh triggered via intent");
};
w.prototype._getFooterElement = function() {
  if (this._footerElement && document.contains(this._footerElement))
    return this._footerElement;
  let t = document.querySelector(".dsd-footer");
  return t || (t = document.querySelector('[data-uarps-region="region:app:footer"]')), t || (t = document.querySelector("#shell-footer-region > footer")), t || (t = document.querySelector("#footer-root > footer")), t && (this._footerElement = t), t;
};
w.prototype.setFooterElement = function(t) {
  this._footerElement = t;
};
w.prototype.on = function(t, e) {
  const n = this;
  return this._handlers.has(t) || this._handlers.set(t, /* @__PURE__ */ new Set()), this._handlers.get(t).add(e), () => {
    n.off(t, e);
  };
};
w.prototype.off = function(t, e) {
  const n = this._handlers.get(t);
  n && n.delete(e);
};
w.prototype.emit = function(t, e) {
  const n = this._handlers.get(t);
  n && n.forEach((i) => {
    try {
      i(e);
    } catch (o) {
      A.errors++, U("error", "Handler error:", o);
    }
  });
};
w.prototype.refresh = function() {
  A.refreshEvents++, this.emit(aM.REFRESH, { timestamp: Date.now() });
};
w.prototype.cleanup = function() {
  for (let t = 0; t < this._cleanupFns.length; t++)
    try {
      this._cleanupFns[t]();
    } catch {
    }
  this._cleanupFns = [], this._abortController && this._abortController.abort(), this._handlers.clear(), this._initialized = !1, this._attached = !1, this._footerElement = null, U("info", "Events cleanup");
};
w.prototype.destroy = function() {
  this.cleanup(), this._eventBus = null, this._globalState = null, this._appShell = null, this._store = null, this._callbacks = null, U("info", "Events destroyed");
};
w.prototype.setDebug = (t) => {
};
w.prototype.getMetrics = () => Object.assign({}, A);
w.prototype.info = function() {
  const t = lM.snapshot();
  return {
    moduleId: Hk,
    version: Z2,
    p0Spec: !0,
    intentsReady: this._attached,
    initialized: this._initialized,
    attached: this._attached,
    handlerCount: this._handlers.size,
    hasFooterElement: !!this._footerElement,
    connections: {
      eventBus: !!this._eventBus,
      globalState: !!this._globalState,
      appShell: !!this._appShell
    },
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck(),
    portsInitialized: t._initialized,
    timestamp: Date.now()
  };
};
w.prototype.healthCheck = function() {
  const t = lM.snapshot(), e = {
    initialized: this._initialized,
    attached: this._attached,
    intentsReady: this._attached && !!this._eventBus,
    lowErrors: A.errors < 10,
    hasHandlers: this._handlers.size >= 0,
    portsInitialized: t._initialized
  }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
  return {
    status: n === i ? "HEALTHY" : n >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: n,
    maxScore: i,
    scoreDisplay: `${n}/${i}`,
    checks: e,
    metrics: A,
    version: Z2,
    moduleId: Hk,
    p0Spec: !0,
    timestamp: Date.now()
  };
};
const tm = "progress-circle", K2 = "1.4.0-P0-SPEC", jk = p({ moduleId: tm });
function lj() {
  jk.init();
}
function uj(t) {
  return jk.get(t);
}
const dj = Object.freeze({ HEALTHY: { max: 60, color: "#22c55e" }, WARNING: { max: 85, color: "#f59e0b" }, CRITICAL: { max: 100, color: "#ef4444" } }), mj = Object.freeze({ size: 30, strokeWidth: 3, thresholds: dj }), om = { mountCount: 0, unmountCount: 0, valueUpdates: 0, clicks: 0 };
function ln(t) {
  t = t || {}, this._config = Object.assign({}, mj, t), this._container = null, this._element = null, this._progressBar = null, this._valueEl = null, this._value = 0, this._mounted = !1, this._styleInjected = !1, this._clickHandler = null;
}
ln.prototype.mount = function(t, e) {
  return this._mounted ? this : t ? (e === void 0 && (e = 0), this._container = t, lj(), this._injectStyles(), this._render(), this.setValue(e), this._mounted = !0, om.mountCount++, this) : this;
};
ln.prototype._injectStyles = function() {
  const t = `${tm}-styles`;
  if (document.getElementById(t)) {
    this._styleInjected = !0;
    return;
  }
  const e = document.createElement("style");
  e.id = t, e.textContent = ".pc-container{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 8px;gap:0;border-radius:6px;background:transparent;transition:background .15s ease;cursor:pointer}.pc-container:hover{background:rgba(139,92,246,.08)}.pc-circle{position:relative;display:flex;align-items:center;justify-content:center}.pc-circle svg{display:block;transform:rotate(-90deg)}.pc-circle .pc-bg{fill:none;stroke:rgba(148,163,184,.15)}.pc-circle .pc-bar{fill:none;stroke-linecap:round;transition:stroke-dashoffset .6s ease,stroke .3s ease}.pc-value{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;font-weight:600;font-variant-numeric:tabular-nums;transition:color .3s ease}", document.head.appendChild(e), this._styleInjected = !0;
};
ln.prototype._render = function() {
  const t = this, e = this._config.size, n = this._config.strokeWidth, i = (e - n) / 2, o = 2 * Math.PI * i, s = e / 2, r = this._config.label || "";
  this._element = document.createElement("div"), this._element.className = "pc-container", this._element.title = r, this._element.dataset.component = tm, this._element.dataset.label = r, this._element.innerHTML = `<div class="pc-circle" style="width:${e}px;height:${e}px;"><svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}"><circle class="pc-bg" cx="${s}" cy="${s}" r="${i}" stroke-width="${n}"/><circle class="pc-bar" cx="${s}" cy="${s}" r="${i}" stroke-width="${n}" stroke-dasharray="${o}" stroke-dashoffset="${o}"/></svg><span class="pc-value">--%</span></div>`, this._progressBar = this._element.querySelector(".pc-bar"), this._valueEl = this._element.querySelector(".pc-value"), this._container.appendChild(this._element), this._clickHandler = () => {
    om.clicks++;
    const c = uj("eventBus");
    if (c && c.emit) {
      const l = `footer:${(t._config.label || "progress").toLowerCase().replace(/\s/g, "-")}`;
      c.emit(d.ACTION, { actionId: l, source: tm, timestamp: Date.now(), kind: "navigation", meta: { label: t._config.label, value: t._value } });
    }
  }, this._element.addEventListener("click", this._clickHandler);
};
ln.prototype._getColor = function(t) {
  const e = this._config.thresholds;
  return t <= e.HEALTHY.max ? e.HEALTHY.color : t <= e.WARNING.max ? e.WARNING.color : e.CRITICAL.color;
};
ln.prototype.setValue = function(t) {
  if (!this._mounted) return this;
  om.valueUpdates++;
  const e = this._config.size, n = this._config.strokeWidth, i = (e - n) / 2, o = 2 * Math.PI * i, s = Math.max(0, Math.min(100, t)), r = o - s / 100 * o, c = this._getColor(s);
  return this._value = s, this._progressBar && (this._progressBar.style.strokeDashoffset = r, this._progressBar.style.stroke = c), this._valueEl && (this._valueEl.textContent = `${Math.round(s)}%`, this._valueEl.style.color = c), this;
};
ln.prototype.getValue = function() {
  return this._value;
};
ln.prototype.unmount = function() {
  this._mounted && (om.unmountCount++, this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._progressBar = null, this._valueEl = null, this._container = null, this._mounted = !1, this._clickHandler = null);
};
ln.prototype.getMetrics = () => Object.assign({}, om);
ln.prototype.info = function() {
  const t = jk.snapshot();
  return {
    moduleId: tm,
    version: K2,
    mounted: this._mounted,
    value: this._value,
    label: this._config.label || null,
    config: { size: this._config.size, strokeWidth: this._config.strokeWidth },
    metrics: this.getMetrics(),
    portsInitialized: t._initialized,
    timestamp: Date.now()
  };
};
ln.prototype.healthCheck = function() {
  const t = jk.snapshot(), e = {
    mounted: this._mounted,
    hasElement: !!this._element,
    hasProgressBar: !!this._progressBar,
    hasValueEl: !!this._valueEl,
    styleInjected: this._styleInjected,
    portsInitialized: t._initialized
  };
  let n = 0;
  const i = Object.keys(e);
  for (let r = 0; r < i.length; r++)
    e[i[r]] && n++;
  const o = i.length;
  let s = "HEALTHY";
  return this._mounted ? n < o && (s = "DEGRADED") : s = "UNMOUNTED", {
    status: s,
    score: n,
    maxScore: o,
    scoreDisplay: `${n}/${o}`,
    checks: e,
    metrics: om,
    version: K2,
    moduleId: tm,
    timestamp: Date.now()
  };
};
function KE(t) {
  return new ln(t);
}
const uM = "connection-status", fj = "1.3.1-P18EC", Bk = p({ moduleId: uM });
function hj() {
  Bk.init();
}
function pj(t) {
  return Bk.get(t);
}
const Qd = {
  size: 30,
  colors: {
    excellent: "#22c55e",
    good: "#84cc16",
    fair: "#f59e0b",
    poor: "#ef4444",
    offline: "#6b7280",
    inactive: "#374151"
  },
  thresholds: {
    excellent: 100,
    good: 300,
    fair: 500,
    poor: 1 / 0
  }
}, gj = `.cs-container {    display: flex;    align-items: center;    justify-content: center;    width: ${Qd.size}px;    height: ${Qd.size}px;    border-radius: 50%;    cursor: pointer;    transition: background-color 0.2s ease, box-shadow 0.3s ease;    position: relative;}.cs-container:hover {    background: rgba(139, 92, 246, 0.08);}.cs-icon {    width: 16px;    height: 16px;    transition: filter 0.3s ease;}.cs-icon path {    transition: fill 0.3s ease, opacity 0.3s ease;}.cs-glow {    position: absolute;    inset: 0;    border-radius: 50%;    opacity: 0;    transition: opacity 0.5s ease;    pointer-events: none;}.cs-container[data-status="excellent"] .cs-glow {    box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);    opacity: 1;}.cs-container[data-status="good"] .cs-glow {    box-shadow: 0 0 10px rgba(132, 204, 22, 0.35);    opacity: 1;}.cs-container[data-status="fair"] .cs-glow {    box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);    opacity: 1;}.cs-container[data-status="poor"] .cs-glow {    box-shadow: 0 0 8px rgba(239, 68, 68, 0.35);    opacity: 1;}.cs-container[data-status="offline"] .cs-glow {    opacity: 0;}.cs-tooltip {    position: absolute;    bottom: calc(100% + 8px);    left: 50%;    transform: translateX(-50%);    background: #1f2937;    color: #f3f4f6;    padding: 6px 10px;    border-radius: 6px;    font-size: 11px;    font-weight: 500;    white-space: nowrap;    opacity: 0;    visibility: hidden;    transition: opacity 0.2s ease, visibility 0.2s ease;    pointer-events: none;    z-index: 1000;    box-shadow: 0 4px 12px rgba(0,0,0,0.3);}.cs-tooltip::after {    content: "";    position: absolute;    top: 100%;    left: 50%;    transform: translateX(-50%);    border: 5px solid transparent;    border-top-color: #1f2937;}.cs-container:hover .cs-tooltip {    opacity: 1;    visibility: visible;}`;
let dw = !1;
function ct(t) {
  this._config = Object.assign({}, Qd, t || {}), this._container = null, this._elements = {}, this._mounted = !1, this._currentStatus = "offline", this._currentLatency = null, this._checkInterval = null, this._instanceId = `cs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}
ct.prototype._injectStyles = () => {
  if (dw) return;
  const t = document.createElement("style");
  t.id = "connection-status-styles", t.textContent = gj, document.head.appendChild(t), dw = !0;
};
ct.prototype.mount = function(t) {
  return this._mounted ? this : (hj(), this._injectStyles(), this._container = t, this._render(), this._mounted = !0, this._startMonitoring(), this);
};
ct.prototype._render = function() {
  const t = this, e = document.createElement("div");
  e.className = "cs-container", e.id = this._instanceId, e.setAttribute("data-status", "offline"), e.setAttribute("role", "status"), e.setAttribute("aria-label", "Status de conexão"), e.innerHTML = `        <div class="cs-glow"></div>        <svg class="cs-icon" viewBox="0 0 510.875 510.875" xmlns="http://www.w3.org/2000/svg">            <path class="cs-arc cs-arc-3" d="M434.975,219.174c-98.952-98.952-259.373-98.952-358.325,0c-17.242,17.242-45.728,17.242-63.719,0c-17.242-17.242-17.242-45.728,0-63.719c134.184-134.184,351.578-134.184,485.013,0c17.242,17.242,17.242,45.728,0,63.719C481.452,236.416,452.966,236.416,434.975,219.174z" fill="${Qd.colors.inactive}"/>            <path class="cs-arc cs-arc-2" d="M334.524,319.625c-43.479-43.479-113.195-43.479-156.674,0c-17.242,17.242-45.728,17.242-63.719,0c-17.242-17.242-17.242-45.728,0-63.719c77.962-77.962,205.4-77.962,283.362,0c17.242,17.242,17.242,45.728,0,63.719C380.252,337.616,351.766,337.616,334.524,319.625z" fill="${Qd.colors.inactive}"/>            <path class="cs-arc cs-arc-1" d="M315.034,396.088c0,32.984-26.987,59.971-59.971,59.971s-59.971-26.987-59.971-59.971s26.987-59.971,59.971-59.971S315.034,363.104,315.034,396.088z" fill="${Qd.colors.inactive}"/>        </svg>        <div class="cs-tooltip">Verificando conexão...</div>    `, this._container.appendChild(e), e.addEventListener("click", () => {
    const n = pj("eventBus");
    n && n.emit && n.emit(d.ACTION, {
      actionId: "footer:wifi",
      source: uM,
      timestamp: Date.now(),
      kind: "navigation",
      meta: { label: "WiFi Status", status: t._currentStatus, latency: t._currentLatency }
    });
  }), this._elements = {
    wrapper: e,
    arc1: e.querySelector(".cs-arc-1"),
    arc2: e.querySelector(".cs-arc-2"),
    arc3: e.querySelector(".cs-arc-3"),
    tooltip: e.querySelector(".cs-tooltip")
  };
};
ct.prototype._startMonitoring = function() {
  const t = this;
  this._checkConnection(), this._checkInterval = setInterval(() => {
    t._checkConnection();
  }, 3e4);
};
ct.prototype._checkConnection = function() {
  const t = this, e = performance.now(), n = new AbortController(), i = setTimeout(() => {
    n.abort();
  }, 5e3);
  fetch("/api/metrics/server.php", {
    method: "HEAD",
    cache: "no-store",
    signal: n.signal
  }).then((o) => {
    if (clearTimeout(i), o.ok) {
      const s = Math.round(performance.now() - e);
      t._updateStatus(s);
    } else
      t._setOffline();
  }).catch((o) => {
    clearTimeout(i), o.name === "AbortError" ? t._updateStatus(5e3) : t._setOffline();
  });
};
ct.prototype._updateStatus = function(t) {
  this._currentLatency = t;
  const e = this._config.thresholds, n = this._config.colors;
  let i, o, s;
  t < e.excellent ? (i = "excellent", o = n.excellent, s = 3) : t < e.good ? (i = "good", o = n.good, s = 2) : t < e.fair ? (i = "fair", o = n.fair, s = 1) : (i = "poor", o = n.poor, s = 1), this._currentStatus = i, this._applyVisualState(o, s, i, t);
};
ct.prototype._applyVisualState = function(t, e, n, i) {
  const o = this._elements, s = this._config.colors;
  o.arc1.setAttribute("fill", t), o.arc2.setAttribute("fill", e >= 2 ? t : s.inactive), o.arc2.style.opacity = e >= 2 ? "1" : "0.3", o.arc3.setAttribute("fill", e >= 3 ? t : s.inactive), o.arc3.style.opacity = e >= 3 ? "1" : "0.3", o.wrapper.setAttribute("data-status", n);
  const r = { excellent: "Excelente", good: "Bom", fair: "Regular", poor: "Ruim" };
  o.tooltip.textContent = `${r[n]} • ${i}ms`;
};
ct.prototype._setOffline = function() {
  this._currentStatus = "offline", this._currentLatency = null;
  const t = this._elements, e = this._config.colors;
  t.arc1.setAttribute("fill", e.offline), t.arc2.setAttribute("fill", e.inactive), t.arc2.style.opacity = "0.3", t.arc3.setAttribute("fill", e.inactive), t.arc3.style.opacity = "0.3", t.wrapper.setAttribute("data-status", "offline"), t.tooltip.textContent = "Sem conexão";
};
ct.prototype.checkNow = function() {
  return this._checkConnection(), this;
};
ct.prototype.unmount = function() {
  this._mounted && (this._checkInterval && (clearInterval(this._checkInterval), this._checkInterval = null), this._elements.wrapper && this._elements.wrapper.remove(), this._mounted = !1, this._elements = {});
};
ct.prototype.info = function() {
  const t = Bk.snapshot();
  return { moduleId: uM, version: fj, instanceId: this._instanceId, mounted: this._mounted, status: this._currentStatus, latency: this._currentLatency, config: this._config, portsInitialized: t._initialized };
};
ct.prototype.healthCheck = function() {
  const t = Bk.snapshot();
  return { healthy: this._mounted && this._elements.wrapper !== null, status: this._currentStatus, latency: this._currentLatency, monitoring: this._checkInterval !== null, portsInitialized: t._initialized };
};
function _j(t) {
  return new ct(t);
}
const vj = "footer-logger", $j = p({ moduleId: vj });
function yj(t) {
  return $j.get(t);
}
let dM = !1;
function Ip(t, e, ...n) {
  var i, o, s;
  const r = yj("logger");
  if (!r) return;
  const c = `[${e}]`;
  if (t === "error") {
    (i = r.error) == null || i.call(r, c, ...n);
    return;
  }
  if (t === "warn") {
    (o = r.warn) == null || o.call(r, c, ...n);
    return;
  }
  dM && ((s = r.debug) == null || s.call(r, c, ...n));
}
function W2(t) {
  dM = !!t;
}
function kj() {
  return dM;
}
function _o(t) {
  return { debug: (...e) => Ip("debug", t, ...e), info: (...e) => Ip("info", t, ...e), warn: (...e) => Ip("warn", t, ...e), error: (...e) => Ip("error", t, ...e) };
}
const bj = "footer-buttons-registry", mw = _o(bj), J2 = {
  dashboard: () => Promise.resolve().then(() => vV),
  analytics: () => Promise.resolve().then(() => OV),
  "pie-chart": () => Promise.resolve().then(() => TV),
  "trending-up": () => Promise.resolve().then(() => HV),
  users: () => Promise.resolve().then(() => FV),
  settings: () => Promise.resolve().then(() => XV),
  database: () => Promise.resolve().then(() => rx),
  server: () => Promise.resolve().then(() => fx),
  cloud: () => Promise.resolve().then(() => yx),
  zap: () => Promise.resolve().then(() => Cx),
  calendar: () => Promise.resolve().then(() => Sx),
  mail: () => Promise.resolve().then(() => Bx),
  bell: () => Promise.resolve().then(() => Zx),
  folder: () => Promise.resolve().then(() => e4),
  "credit-card": () => Promise.resolve().then(() => a4),
  security: () => Promise.resolve().then(() => p4),
  search: () => Promise.resolve().then(() => b4),
  activity: () => Promise.resolve().then(() => R4),
  globe: () => Promise.resolve().then(() => A4),
  lock: () => Promise.resolve().then(() => x4),
  link: () => Promise.resolve().then(() => W4),
  cpu: () => Promise.resolve().then(() => i3),
  "hard-drive": () => Promise.resolve().then(() => u3),
  monitor: () => Promise.resolve().then(() => _3),
  clipboard: () => Promise.resolve().then(() => I3),
  target: () => Promise.resolve().then(() => P3),
  bookmark: () => Promise.resolve().then(() => U3),
  language: () => Promise.resolve().then(() => Y3),
  logout: () => Promise.resolve().then(() => Q3),
  termos: () => Promise.resolve().then(() => s5),
  privacidade: () => Promise.resolve().then(() => m5),
  lgpd: () => Promise.resolve().then(() => $5)
}, WE = /* @__PURE__ */ new Map();
let fw = { loads: 0, mounts: 0, unmounts: 0, errors: 0 };
async function Ej(t) {
  if (WE.has(t)) return WE.get(t);
  const e = J2[t];
  if (!e)
    return mw.warn(`Component not found: ${t}`), null;
  try {
    fw.loads++;
    const n = await e();
    return WE.set(t, n), n;
  } catch (n) {
    return fw.errors++, mw.error(`Failed to load: ${t}`, n), null;
  }
}
function hw() {
  return Object.keys(J2);
}
function Q2() {
  return ["language", "logout"];
}
function X2() {
  return ["termos", "privacidade", "lgpd"];
}
const mM = "1.6.0-P18EC", sm = "footer/components/buttons/mounter", tN = { BUTTONS_MOUNTED: "footer:buttons:mounted" }, fM = p({ moduleId: sm });
function Ij(t) {
  return fM.get(t);
}
const em = _o(sm), ho = /* @__PURE__ */ new Map();
function hM(t, e, n) {
  if (n = n || {}, !e)
    return em.warn(`No host for: ${t}`), Promise.resolve(null);
  if (ho.has(t)) {
    const o = ho.get(t);
    return o.host === e ? Promise.resolve(o.instance) : pM(t).then(() => i());
  }
  return i();
  function i() {
    return Ej(t).then((o) => {
      if (!o) return null;
      let s;
      if (typeof o.getInstance == "function")
        s = o.getInstance();
      else return typeof o.mount == "function" ? (o.init && o.init({}), o.mount(e, n), ho.set(t, { instance: o, host: e }), o) : null;
      return s.init && s.init({}), s.mount(e, n), ho.set(t, { instance: s, host: e }), s;
    }).catch((o) => (em.error(`Mount failed: ${t}`, o), null));
  }
}
function pM(t) {
  const e = ho.get(t);
  if (!e) return Promise.resolve(!1);
  try {
    return e.instance && typeof e.instance.unmount == "function" && e.instance.unmount(), ho.delete(t), Promise.resolve(!0);
  } catch (n) {
    return em.error(`Unmount failed: ${t}`, n), Promise.resolve(!1);
  }
}
function Oj(t) {
  return em.info("mountDecorativeButtons SKIPPED - IconsOrchestrator handles decorative icons"), Promise.resolve({ mounted: [], failed: [], skipped: !0 });
}
function eN(t) {
  const e = t.querySelector(".dsd-footer__controls");
  if (!e)
    return em.warn("Controls slot not found"), Promise.resolve({ mounted: [], failed: [] });
  const n = { mounted: [], failed: [] }, i = Q2();
  let o = Promise.resolve();
  return i.forEach((s) => {
    o = o.then(() => {
      const r = e.querySelector(`[data-action="${s}"]`);
      r && r.remove();
      const c = document.createElement("div");
      return c.className = "footer-btn-host footer-btn-host--control", c.dataset.hostId = s, e.appendChild(c), hM(s, c, s === "language" ? { label: "PT" } : { label: "Sair" }).then((u) => {
        u ? n.mounted.push(s) : n.failed.push(s);
      });
    });
  }), o.then(() => n);
}
function nN(t) {
  const e = t.querySelector('[data-slot="links"]');
  if (!e)
    return em.warn("Links slot not found"), Promise.resolve({ mounted: [], failed: [] });
  e.innerHTML = "";
  const n = X2(), i = { mounted: [], failed: [] };
  let o = Promise.resolve();
  return n.forEach((s) => {
    o = o.then(() => {
      const r = document.createElement("span");
      return r.className = "footer-link-host", r.dataset.hostId = s, e.appendChild(r), hM(s, r, {}).then((c) => {
        c ? i.mounted.push(s) : i.failed.push(s);
      });
    });
  }), o.then(() => i);
}
function Dj(t) {
  return Promise.all([eN(t), nN(t)]).then((e) => {
    const n = e[0], i = e[1], o = { mounted: n.mounted.concat(i.mounted), failed: n.failed.concat(i.failed) }, s = Ij("eventBus");
    return s && s.emit && s.emit(tN.BUTTONS_MOUNTED, { source: sm, mounted: o.mounted, failed: o.failed, decorative: 0, controls: n.mounted.length, links: i.mounted.length, timestamp: Date.now() }), o;
  });
}
function Cj() {
  const t = Array.from(ho.keys());
  let e = Promise.resolve();
  return t.forEach((n) => {
    e = e.then(() => pM(n));
  }), e.then(() => t);
}
function Mj() {
  const t = fM.snapshot(), e = Array.from(ho.keys());
  return { status: e.length > 0 ? "HEALTHY" : "IDLE", mountedCount: e.length, mounted: e, version: mM, moduleId: sm, portsInitialized: t._initialized };
}
function Rj() {
  const t = fM.snapshot();
  return { version: mM, moduleId: sm, availableButtons: hw(), mountedButtons: Array.from(ho.keys()), decorativeCount: 0, controlCount: Q2().length, linkCount: X2().length, totalAvailable: hw().length, note: "Decorative icons now handled by IconsOrchestrator", portsInitialized: t._initialized };
}
const iN = { mountComponent: hM, unmountComponent: pM, mountDecorativeButtons: Oj, mountControlButtons: eN, mountLegalLinks: nN, mountAll: Dj, unmountAll: Cj, healthCheck: Mj, info: Rj, MOUNTER_EVENTS: tN, VERSION: mM, MODULE_ID: sm }, va = "footer-icons-registry", J_ = "2.1.0-P17WI", Q_ = h({ moduleId: va });
function gM(t) {
  return Q_.get(t);
}
const wj = () => {
  const t = gM("config");
  return !!(t && t.app && t.app.debug);
}, _c = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = gM("logger");
  if (n) {
    if (t === "error") {
      n.error && n.error(`[${va}]`, e.join(" "));
      return;
    }
    if (t === "warn") {
      n.warn && n.warn(`[${va}]`, e.join(" "));
      return;
    }
    wj() && n.debug && n.debug(`[${va}]`, e.join(" "));
  }
}, iu = {
  // Original 24 icons (wifi removed)
  clock: function() {
    return Promise.resolve().then(() => R5);
  },
  cpu: function() {
    return Promise.resolve().then(() => V5);
  },
  disk: function() {
    return Promise.resolve().then(() => e8);
  },
  memory: function() {
    return Promise.resolve().then(() => h8);
  },
  activity: function() {
    return Promise.resolve().then(() => C8);
  },
  globe: function() {
    return Promise.resolve().then(() => j8);
  },
  "map-pin": function() {
    return Promise.resolve().then(() => X8);
  },
  settings: function() {
    return Promise.resolve().then(() => m6);
  },
  copyright: function() {
    return Promise.resolve().then(() => O6);
  },
  server: function() {
    return Promise.resolve().then(() => U6);
  },
  file: function() {
    return Promise.resolve().then(() => J6);
  },
  shield: function() {
    return Promise.resolve().then(() => uG);
  },
  check: function() {
    return Promise.resolve().then(() => EG);
  },
  logo: function() {
    return Promise.resolve().then(() => AG);
  },
  docs: function() {
    return Promise.resolve().then(() => KG);
  },
  support: function() {
    return Promise.resolve().then(() => aY);
  },
  status: function() {
    return Promise.resolve().then(() => kY);
  },
  database: function() {
    return Promise.resolve().then(() => SY);
  },
  api: function() {
    return Promise.resolve().then(() => qY);
  },
  pipedrive: function() {
    return Promise.resolve().then(() => r7);
  },
  financial: function() {
    return Promise.resolve().then(() => $7);
  },
  "status-mode": function() {
    return Promise.resolve().then(() => T7);
  },
  "device-mic": function() {
    return Promise.resolve().then(() => Y7);
  },
  "device-webcam": function() {
    return Promise.resolve().then(() => oF);
  },
  // LOTE 1 - 7 icons
  zap: function() {
    return Promise.resolve().then(() => _F);
  },
  users: function() {
    return Promise.resolve().then(() => wF);
  },
  user: function() {
    return Promise.resolve().then(() => xF);
  },
  unlock: function() {
    return Promise.resolve().then(() => n9);
  },
  "trending-up": function() {
    return Promise.resolve().then(() => p9);
  },
  terminal: function() {
    return Promise.resolve().then(() => M9);
  },
  target: function() {
    return Promise.resolve().then(() => B9);
  },
  // LOTE 2 - 7 icons
  sun: function() {
    return Promise.resolve().then(() => tq);
  },
  search: function() {
    return Promise.resolve().then(() => fq);
  },
  "pie-chart": function() {
    return Promise.resolve().then(() => Dq);
  },
  lock: function() {
    return Promise.resolve().then(() => Hq);
  },
  link: function() {
    return Promise.resolve().then(() => Qq);
  },
  layers: function() {
    return Promise.resolve().then(() => dZ);
  },
  inbox: function() {
    return Promise.resolve().then(() => IZ);
  },
  // LOTE 3A - 7 icons
  "at-sign": function() {
    return Promise.resolve().then(() => zZ);
  },
  "bar-chart": function() {
    return Promise.resolve().then(() => WZ);
  },
  box: function() {
    return Promise.resolve().then(() => lK);
  },
  briefcase: function() {
    return Promise.resolve().then(() => bK);
  },
  calendar: function() {
    return Promise.resolve().then(() => LK);
  },
  cloud: function() {
    return Promise.resolve().then(() => ZK);
  },
  copy: function() {
    return Promise.resolve().then(() => cW);
  },
  // LOTE 3B - 6 icons
  "credit-card": function() {
    return Promise.resolve().then(() => yW);
  },
  "dollar-sign": function() {
    return Promise.resolve().then(() => NW);
  },
  eye: function() {
    return Promise.resolve().then(() => FW);
  },
  "file-text": function() {
    return Promise.resolve().then(() => sJ);
  },
  grid: function() {
    return Promise.resolve().then(() => vJ);
  },
  "hard-drive": function() {
    return Promise.resolve().then(() => PJ);
  }
}, JE = 51, vc = /* @__PURE__ */ new Map(), se = { renderCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0 }, mr = {
  getVersion() {
    return J_;
  },
  getModuleId() {
    return va;
  },
  hasIcon(t) {
    return iu.hasOwnProperty(t);
  },
  getAvailableIcons() {
    return Object.keys(iu);
  },
  getIcon(t) {
    return this.hasIcon(t) ? vc.has(t) ? (se.cacheHits++, Promise.resolve(vc.get(t))) : (se.cacheMisses++, iu[t]().then((e) => {
      const n = e.default || e;
      return vc.set(t, n), n;
    }).catch((e) => (se.errors++, _c("error", `Load "${t}" failed:`, e.message), null))) : (_c("warn", `Icon "${t}" not registered`), Promise.resolve(null));
  },
  renderIcon(t, e, n) {
    return e ? this.getIcon(t).then((i) => i ? (se.renderCount++, typeof i.mount == "function" ? (i.mount(e, n || {}), i) : typeof i.render == "function" ? (e.innerHTML = i.render(n || {}), i) : null) : (_c("warn", `renderIcon: "${t}" not found`), null)).catch((i) => (se.errors++, _c("error", `renderIcon "${t}" failed:`, i.message), null)) : (_c("error", "renderIcon: container required"), Promise.resolve(null));
  },
  unmountIcon(t, e) {
    const n = vc.get(t);
    if (n && typeof n.unmount == "function")
      try {
        n.unmount();
      } catch {
        _c("error", `unmountIcon "${t}" failed`);
      }
    e && (e.innerHTML = "");
  },
  clearCache() {
    vc.clear(), _c("info", "Cache cleared");
  },
  getMetrics() {
    return Object.assign({}, se);
  },
  healthCheck() {
    const t = Object.keys(iu).length, e = vc.size, n = { hasRegisteredIcons: t > 0, hasAllIcons: t === JE, lowErrorRate: se.renderCount === 0 || se.errors / se.renderCount < 0.1, hasLogger: !!gM("logger"), portsInitialized: Q_.isInitialized() }, i = Object.values(n).filter(Boolean).length;
    return { status: i >= 4 ? "HEALTHY" : "DEGRADED", score: `${i}/5`, checks: n, registeredIcons: t, expectedIcons: JE, cachedIcons: e, metrics: Object.assign({}, se), portsInitialized: Q_.isInitialized(), version: J_, moduleId: va, timestamp: Date.now() };
  },
  info() {
    return { moduleId: va, version: J_, portsInitialized: Q_.isInitialized(), registeredIcons: Object.keys(iu), totalIcons: Object.keys(iu).length, expectedIcons: JE, cachedIcons: Array.from(vc.keys()), metrics: Object.assign({}, se), healthCheck: this.healthCheck(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.FooterIconsRegistry = mr, window.__dev = window.__dev || {}, window.__dev.footerIconsRegistry = { getVersion() {
  return J_;
}, info() {
  return mr.info();
}, healthCheck() {
  return mr.healthCheck();
}, list() {
  return mr.getAvailableIcons();
} });
const _M = "2.7.0-HARDNAV", vl = "footer-icons-orchestrator", Vk = p({ moduleId: vl });
let pw = !1;
function oN() {
  pw || (Vk.init(), pw = !0);
}
function vM(t) {
  return oN(), Vk.get(t);
}
const F = _o(vl), Z = { mounts: 0, unmounts: 0, clicks: 0, panelRequests: 0, errors: 0, eventBusMissing: 0, skippedSeparators: 0 }, po = /* @__PURE__ */ new Map();
let AI = [];
function Pj(t, e) {
  return t.type === "separator" ? !0 : e ? e === "separator" || typeof e == "string" && e.indexOf("sep") === 0 : !1;
}
function Tj() {
  oN();
  const t = vM("eventBus");
  return t || (Z.eventBusMissing++, F.error("EventBus not available via Ports - DI configuration error")), t;
}
function eo(t, e) {
  const n = Tj();
  return n && n.emit ? (n.emit(t, Object.assign({ source: vl, timestamp: Date.now() }, e || {})), !0) : !1;
}
function Nj(t, e) {
  try {
    const n = vM("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: vl }, e || {}));
  } catch {
    Z.errors++;
  }
}
function Sj(t, e) {
  Z.clicks++, F.info(`Icon clicked: ${t}`, { item: e }), Nj(B.ICON_CLICKED, { iconId: t }), eo(B.ICON_CLICKED, { iconId: t, item: e });
  let n = null;
  if (e && (n = e.panelId || e.panel || null, !n && e.actionData)) {
    let i = e.actionData;
    if (typeof i == "string")
      try {
        i = JSON.parse(i);
      } catch {
        i = {};
      }
    n = i.panelId || i.panel_id || null;
  }
  if (n && (Z.panelRequests++, F.info(`Requesting panel: ${n} from icon: ${t}`), eo(lw.OPEN_REQUEST, { panelId: n, trigger: `footer-icon:${t}` }), eo(lw.OPEN, { panelId: n, source: "footer-icon", iconId: t }), eo("panel.open", { panelId: n, source: "footer-icon", iconId: t }), eo("panel.open.request", { panelId: n, source: "footer-icon", iconId: t })), e && e.action && typeof e.action == "function")
    try {
      e.action();
    } catch (i) {
      Z.errors++, F.error(`Icon action failed: ${t}`, { error: i.message });
    }
  e && e.href && (e.external ? (eo(d.HARD_NAV, { action: "external", url: e.href, reason: "footer-icon-external", iconId: t }), window.open(e.href, "_blank", "noopener,noreferrer")) : (eo(d.HARD_NAV, { action: "redirect", url: e.href, reason: "footer-icon-internal", iconId: t }), window.location.href = e.href));
}
function sN(t, e, n) {
  return n = n || {}, e ? po.has(t) ? Promise.resolve(po.get(t)) : mr.getIcon(t).then((i) => {
    if (!i)
      return F.warn(`Icon not found in registry: ${t}`), null;
    Z.mounts++;
    let o = null;
    if (typeof i.mount == "function" ? o = i.mount(e, n) : typeof i.render == "function" ? (e.innerHTML = i.render(n), o = i) : i.default && typeof i.default.mount == "function" && (o = i.default.mount(e, n)), o) {
      po.set(t, { instance: o, host: e, config: n });
      const s = (r) => {
        r.preventDefault(), r.stopPropagation(), Sj(t, n);
      };
      e.addEventListener("click", s), AI.push(() => {
        e.removeEventListener("click", s);
      }), eo(B.ICON_MOUNTED, { iconId: t });
    }
    return o;
  }).catch((i) => (Z.errors++, F.error(`Failed to mount icon: ${t}`, { error: i.message }), null)) : (F.warn(`No host element for icon: ${t}`), Promise.resolve(null));
}
function rN(t) {
  const e = po.get(t);
  if (!e) return Promise.resolve(!1);
  Z.unmounts++;
  try {
    return e.instance && typeof e.instance.unmount == "function" && e.instance.unmount(), e.host && (e.host.innerHTML = ""), po.delete(t), eo(B.ICON_UNMOUNTED, { iconId: t }), Promise.resolve(!0);
  } catch (n) {
    return Z.errors++, F.error(`Failed to unmount icon: ${t}`, { error: n.message }), Promise.resolve(!1);
  }
}
function Lj(t, e) {
  e = e || [];
  const n = { mounted: [], failed: [], skipped: [] };
  if (!t)
    return F.warn("No container provided for mountAll"), Promise.resolve(n);
  F.info("mountAll called", { iconsCount: e.length });
  const i = t.querySelector('[data-slot="icons"]') || t.querySelector(".dsd-footer__icons") || t;
  let o = Promise.resolve();
  return e.forEach((s) => {
    o = o.then(() => {
      const r = s.icon || s.id;
      if (!r) {
        F.warn("Icon config missing icon/id", s);
        return;
      }
      if (Pj(s, r)) {
        Z.skippedSeparators++, n.skipped.push(r);
        return;
      }
      if (!mr.hasIcon(r)) {
        F.warn(`Icon not in registry: ${r}`), n.failed.push(r);
        return;
      }
      const c = document.createElement("div");
      return c.className = "footer-icon-host", c.dataset.iconId = r, s.tooltip && (c.title = s.tooltip), s.ariaLabel && c.setAttribute("aria-label", s.ariaLabel), c.style.cursor = "pointer", i.appendChild(c), sN(r, c, s).then((l) => {
        l ? n.mounted.push(r) : n.failed.push(r);
      });
    });
  }), o.then(() => (eo(B.ICONS_READY, { mounted: n.mounted.length, failed: n.failed.length, skipped: n.skipped.length }), F.info(`Icons mount complete: ${n.mounted.length} mounted, ${n.failed.length} failed, ${n.skipped.length} skipped`), n));
}
function Aj() {
  const t = Array.from(po.keys());
  AI.forEach((n) => {
    try {
      n();
    } catch {
    }
  }), AI = [];
  let e = Promise.resolve();
  return t.forEach((n) => {
    e = e.then(() => rN(n));
  }), e.then(() => (F.info(`All icons unmounted: ${t.length}`), t));
}
function cN() {
  return Array.from(po.keys());
}
function zj() {
  const t = Vk.snapshot(), n = !!vM("eventBus"), i = Z.eventBusMissing === 0, o = Z.errors < 5;
  return {
    status: n && i && o ? "HEALTHY" : "DEGRADED",
    version: _M,
    moduleId: vl,
    p0Enterprise: !0,
    checks: {
      eventBusAvailable: n,
      noFallbackErrors: i,
      lowErrors: o,
      portsInitialized: t._initialized
    },
    mountedCount: po.size,
    metrics: Object.assign({}, Z)
  };
}
function Uj() {
  const t = Vk.snapshot();
  return {
    version: _M,
    moduleId: vl,
    p0Enterprise: !0,
    noWindowFallback: !0,
    mountedIcons: cN(),
    mountedCount: po.size,
    availableIcons: mr.getAvailableIcons ? mr.getAvailableIcons() : [],
    metrics: Object.assign({}, Z),
    portsInitialized: t._initialized
  };
}
const $M = {
  mountIcon: sN,
  unmountIcon: rN,
  mountAll: Lj,
  unmountAll: Aj,
  getMountedIcons: cN,
  healthCheck: zj,
  info: Uj,
  VERSION: _M,
  MODULE_ID: vl
}, yM = "components.footer.announce-live-region", kM = "2.2.0-P18EC", Sv = h({ moduleId: yM });
function Hj() {
  Sv.init();
}
const S = { initialized: !1, element: null, politeness: "polite" }, bM = { announcements: 0 };
function jj(t, e) {
  return e = e || {}, bM.announcements++, !S.element && typeof document < "u" && (S.element = document.getElementById("live-region") || document.querySelector("[aria-live]")), S.element ? (S.element.setAttribute("aria-live", e.politeness || S.politeness), S.element.textContent = t, setTimeout(() => {
    S.element.textContent = "";
  }, e.clearAfter || 3e3), { ok: !0 }) : { ok: !1, reason: "No live region element" };
}
function Bj(t) {
  return S.element = t, { ok: !0 };
}
function Vj(t) {
  return S.politeness = t, { ok: !0 };
}
function xj(t) {
  return S.initialized ? { ok: !0, alreadyInitialized: !0 } : (Hj(), S.initialized = !0, { ok: !0, version: kM });
}
function Gj() {
  return { status: Sv.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: yM, version: kM, checks: { initialized: { ok: S.initialized, severity: "info" }, hasElement: { ok: !!S.element, severity: "warn" }, portsInitialized: { ok: Sv.isInitialized(), severity: "info" } }, metrics: bM };
}
function Yj() {
  return { moduleId: yM, version: kM, initialized: S.initialized, hasElement: !!S.element, politeness: S.politeness, metrics: bM, portsInitialized: Sv.isInitialized() };
}
function mc(t) {
  this._container = null, this._mounted = !1, this._element = null;
}
mc.prototype.mount = function(t, e, n) {
  return this._mounted || (xj(), this._container = t, this._element = document.createElement("div"), this._element.id = "footer-live-region", this._element.className = "dsd-footer__live-region sr-only", this._element.setAttribute("role", "status"), this._element.setAttribute("aria-live", "polite"), this._element.setAttribute("aria-atomic", "true"), this._container.appendChild(this._element), Bj(this._element), this._mounted = !0), Promise.resolve();
};
mc.prototype.destroy = function() {
  this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, S.element = null, this._mounted = !1;
};
mc.prototype.isLoaded = function() {
  return this._mounted;
};
mc.prototype.announce = (t, e) => jj(t, e);
mc.prototype.setPoliteness = (t) => Vj(t);
mc.prototype.healthCheck = () => Gj();
mc.prototype.info = () => Yj();
const kh = "components.footer.status-lang", EM = "2.3.0-P18EC", Fj = { CHANGED: "footer:lang:changed" }, gh = h({ moduleId: kh });
function qj() {
  gh.init();
}
function aN(t) {
  return gh.get(t);
}
const IM = { "pt-BR": "Português", "en-US": "English", "es-ES": "Español" }, rt = { initialized: !1, currentLang: "pt-BR", availableLangs: Object.keys(IM) }, OM = { changes: 0 };
function Zj(t, e) {
  const n = aN("eventBus");
  n && n.emit && n.emit(t, Object.assign({ source: kh }, e || {}));
}
function Kj(t, e) {
  try {
    const n = aN("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: kh }, e || {}));
  } catch {
  }
}
function lN(t) {
  if (rt.availableLangs.indexOf(t) < 0) return { ok: !1, reason: "Language not available" };
  const e = rt.currentLang;
  return rt.currentLang = t, OM.changes++, Zj(Fj.CHANGED, { from: e, to: t }), Kj("footer:lang:change", { from: e, to: t }), typeof document < "u" && (document.documentElement.lang = t), { ok: !0, lang: t };
}
function uN() {
  return rt.currentLang;
}
function gw() {
  return IM[rt.currentLang] || rt.currentLang;
}
function Wj() {
  return rt.availableLangs.map((t) => ({
    code: t,
    name: IM[t] || t
  }));
}
function Jj(t) {
  return rt.initialized ? { ok: !0, alreadyInitialized: !0 } : (qj(), rt.initialized = !0, { ok: !0, version: EM });
}
function Qj() {
  return { status: gh.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: kh, version: EM, checks: { initialized: { ok: rt.initialized, severity: "info" }, portsInitialized: { ok: gh.isInitialized(), severity: "info" } }, metrics: OM };
}
function Xj() {
  return { moduleId: kh, version: EM, initialized: rt.initialized, currentLang: rt.currentLang, availableLangs: rt.availableLangs, metrics: OM, portsInitialized: gh.isInitialized() };
}
function fc(t) {
  t = t || {}, this._container = t.container || null, this._mounted = !1, this._element = null;
}
fc.prototype.mount = function() {
  if (this._mounted || !this._container) return Promise.resolve();
  Jj();
  const t = this;
  return this._element = document.createElement("div"), this._element.className = "dsd-footer__lang-selector", this._element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span class="dsd-footer__lang-text">${gw()}</span>`, this._container.appendChild(this._element), this._mounted = !0, this._element.addEventListener("click", () => {
    const e = Wj(), i = (e.findIndex((s) => s.code === uN()) + 1) % e.length;
    lN(e[i].code);
    const o = t._element.querySelector(".dsd-footer__lang-text");
    o && (o.textContent = gw());
  }), Promise.resolve();
};
fc.prototype.destroy = function() {
  this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._mounted = !1;
};
fc.prototype.isLoaded = function() {
  return this._mounted;
};
fc.prototype.getLanguage = () => uN();
fc.prototype.setLanguage = (t) => lN(t);
fc.prototype.healthCheck = () => Qj();
fc.prototype.info = () => Xj();
const xk = "components.footer.links-useful", DM = "2.5.0-ICON-LINKS", tB = { CLICKED: "footer:link:clicked" }, _h = h({ moduleId: xk });
function eB() {
  _h.init();
}
function dN(t) {
  return _h.get(t);
}
const oo = { initialized: !1, links: [] }, Gk = { clicks: 0, uiActions: 0 }, _w = {
  docs: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
  support: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
}, nB = [
  { id: "docs", label: "Docs", url: "/docs", icon: "docs", renderAs: "icon" },
  { id: "support", label: "Suporte", url: "/support", icon: "support", renderAs: "icon" },
  { id: "api", label: "API", url: "/api/docs", icon: "code", renderAs: "text" }
];
function iB(t, e) {
  try {
    var n = dN("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: xk }, e || {}));
  } catch {
  }
}
function oB(t, e) {
  Gk.uiActions++;
  const n = dN("eventBus");
  !n || !n.emit || n.emit(d.FOOTER_BUTTON_CLICK, {
    buttonId: t,
    trigger: "trigger:footer:" + t,
    timestamp: Date.now(),
    meta: { source: "footer", type: "link", url: e }
  });
}
function sB(t) {
  return oo.links = t || [], { ok: !0, count: oo.links.length };
}
function mN() {
  return oo.links.slice();
}
function rB(t) {
  return oo.links.push(t), { ok: !0 };
}
function cB(t, e) {
  Gk.clicks++, iB(tB.CLICKED, { linkId: t }), oB(t, e);
}
function aB(t) {
  return oo.initialized ? { ok: !0, alreadyInitialized: !0 } : (eB(), oo.links = nB.slice(), oo.initialized = !0, { ok: !0, version: DM });
}
function lB() {
  return { status: _h.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: xk, version: DM, p2Spec: !0, checks: { initialized: { ok: oo.initialized, severity: "info" }, portsInitialized: { ok: _h.isInitialized(), severity: "info" }, uarpsCompliant: { ok: !0, severity: "info" } }, metrics: Gk };
}
function uB() {
  return { moduleId: xk, version: DM, p2Spec: !0, initialized: oo.initialized, linksCount: oo.links.length, metrics: Gk, portsInitialized: _h.isInitialized() };
}
function ro(t) {
  this._container = null, this._mounted = !1, this._element = null;
}
ro.prototype.mount = function(t, e, n) {
  return this._mounted || (aB(), this._container = t, this._element = document.createElement("nav"), this._element.className = "dsd-footer__links-useful", this._element.setAttribute("aria-label", "Links Úteis"), this._renderLinks(), this._container.appendChild(this._element), this._mounted = !0), Promise.resolve();
};
ro.prototype._renderLinks = function() {
  const t = mN();
  let e = '<ul class="dsd-footer__links-list">';
  for (var n = 0; n < t.length; n++) {
    const s = t[n], r = "trigger:footer:" + s.id;
    s.renderAs === "icon" && _w[s.id] ? e += '<li><a href="' + s.url + '" class="dsd-footer__link dsd-footer__link--icon" data-link-id="' + s.id + '" data-uarps-trigger="' + r + '" title="' + s.label + '" aria-label="' + s.label + '">' + _w[s.id] + "</a></li>" : e += '<li><a href="' + s.url + '" class="dsd-footer__link" data-link-id="' + s.id + '" data-uarps-trigger="' + r + '">' + s.label + "</a></li>";
  }
  e += "</ul>", this._element.innerHTML = e;
  const i = this._element.querySelectorAll(".dsd-footer__link");
  for (var o = 0; o < i.length; o++)
    i[o].addEventListener("click", function(s) {
      const r = this.getAttribute("data-link-id"), c = this.getAttribute("href");
      r && cB(r, c);
    });
};
ro.prototype.destroy = function() {
  this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._mounted = !1;
};
ro.prototype.isLoaded = function() {
  return this._mounted;
};
ro.prototype.getLinks = function() {
  return mN();
};
ro.prototype.setLinks = function(t) {
  sB(t), this._renderLinks();
};
ro.prototype.addLink = function(t) {
  rB(t), this._renderLinks();
};
ro.prototype.healthCheck = function() {
  return lB();
};
ro.prototype.info = function() {
  return uB();
};
const Yk = "7.4.0-P17WI", Fk = "footer.version-env", rm = p({ moduleId: Fk });
function dB() {
  rm.init();
}
function CM(t) {
  return rm.get(t);
}
function mB(t) {
  return rm.inject(t);
}
function fB() {
  return rm.snapshot();
}
const hB = () => {
  const t = CM("config");
  return !!(t && t.app && t.app.debug);
}, fN = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = CM("logger");
  n && hB() && n.debug && n.debug(`[${Fk}]`, e.join(" "));
};
function at() {
  this.mounted = !1, this.container = null, this.props = {};
}
at.prototype.mount = function(t, e, n) {
  this.mounted || (dB(), this.container = t, this.props = e || {}, this.mounted = !0, fN("info", "Mounted (compatibility mode - merged with brand)"));
};
at.prototype.update = function(t) {
  Object.assign(this.props, t || {});
};
at.prototype.destroy = function() {
  this.mounted = !1, fN("info", "Destroyed");
};
at.getVersion = () => Yk;
at.setDebug = (t) => {
};
at.prototype.getVersion = () => Yk;
at.prototype.setDebug = (t) => {
};
at.prototype.getMetrics = function() {
  return { mountCount: this.mounted ? 1 : 0 };
};
at.prototype.healthCheck = function() {
  const t = rm.snapshot();
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", score: 100, checks: { mounted: this.mounted, hasLogger: !!CM("logger"), portsInitialized: t._initialized }, version: Yk, moduleId: Fk, portsInitialized: t._initialized, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
at.prototype.info = function() {
  const t = rm.snapshot();
  return { version: Yk, moduleId: Fk, mounted: this.mounted, note: "Merged with brand component", portsInitialized: t._initialized };
};
at.injectPorts = mB;
at.getPorts = fB;
const cm = "31.0.0-METRICS-API", bh = "footer.registry", pB = p({ moduleId: bh });
function hN(t) {
  return pB.get(t);
}
const mo = { QUICK_STATUS: '[data-slot="quick-status"]', META: '[data-slot="meta"]', SESSION_TIMER: '[data-slot="session-timer"]', ANNOUNCE: '[data-slot="announce"]', BRAND: '[data-slot="brand"]', DECORATIVE_ICONS: '[data-slot="decorative-icons"]', LINKS: '[data-slot="links"]', COPYRIGHT: '[data-slot="copyright"]' }, O = function(t, e, n) {
  var i = hN("logger");
  if (i) {
    var o = "[" + bh + "]";
    t === "error" && i.error ? i.error(o, e, n || "") : t === "warn" && i.warn ? i.warn(o, e, n || "") : t === "info" && i.info ? i.info(o, e, n || "") : i.debug && i.debug(o, e, n || "");
  }
}, gB = "/api/metrics/server.php", vw = 3e4, Y = { ipFetchAttempts: 0, ipFetchSuccess: 0, ipFetchErrors: 0, metricsPolls: 0, metricsPollErrors: 0, metricsSource: null };
function pN(t, e, n) {
  return n = n || 5e3, new Promise(function(i, o) {
    const s = new AbortController(), r = setTimeout(function() {
      s.abort();
    }, n);
    fetch(t, Object.assign({}, e, { signal: s.signal })).then(function(c) {
      clearTimeout(r), i(c);
    }).catch(function(c) {
      clearTimeout(r), o(c);
    });
  });
}
function I() {
  this._mounted = !1, this._mountedAt = null, this._cleanupFns = [], this._intervals = [], this._sessionStart = Date.now(), this._ipData = null, this._connectionStatus = null, this._cpuCircle = null, this._memoryCircle = null, this._diskCircle = null, this._metricsInterval = null, this._brandAnimation = null, this._buttonsMounted = !1, this._iconsMounted = !1, this._announceRegion = null, this._statusLang = null, this._linksUseful = null, this._versionEnv = null, this._metaContainer = null, this._config = null;
}
I.prototype.mountAll = function(t, e, n) {
  let i = this;
  if (e = e || {}, n = n || {}, this._config = e, this._mounted)
    return O("warn", "Registry already mounted, skipping"), Promise.resolve();
  const o = t.querySelector(mo.QUICK_STATUS), s = t.querySelector(mo.META), r = t.querySelector(mo.SESSION_TIMER), c = t.querySelector(mo.BRAND), l = t.querySelector(mo.DECORATIVE_ICONS), u = t.querySelector(mo.ANNOUNCE), m = t.querySelector(mo.LINKS), N = [];
  return c && N.push(this._mountBrandLottie(c)), l && N.push(this._mountDecorativeIcons(l, e)), N.push(this._mountButtons(t)), o && (o.innerHTML = "", this._mountConnectionStatus(o), this._mountProgressCircles(o)), s && (this._metaContainer = s, this._mountMetaInfo(s, e), N.push(this._mountVersionEnv(s, n))), r && this._mountSessionTimer(r), u && N.push(this._mountAnnounceRegion(u, n)), m && N.push(this._mountLinksUseful(m, n)), Promise.all(N).then(function() {
    i._mounted = !0, i._mountedAt = Date.now(), O("info", "Registry mounted v" + cm);
  });
};
I.prototype._mountConnectionStatus = function(t) {
  const e = document.createElement("div");
  e.className = "dsd-footer__status-connection", e.setAttribute("data-component", "connection-status"), t.appendChild(e), this._connectionStatus = _j(), this._connectionStatus.mount(e), O("info", "Connection status mounted");
};
I.prototype._mountProgressCircles = function(t) {
  const e = document.createElement("div");
  e.className = "dsd-footer__status-cpu", e.setAttribute("data-component", "progress-cpu"), t.appendChild(e), this._cpuCircle = KE({ label: "CPU" }), this._cpuCircle.mount(e, 0);
  const n = document.createElement("div");
  n.className = "dsd-footer__status-ram", n.setAttribute("data-component", "progress-ram"), t.appendChild(n), this._memoryCircle = KE({ label: "RAM" }), this._memoryCircle.mount(n, 0);
  const i = document.createElement("div");
  i.className = "dsd-footer__status-disk", i.setAttribute("data-component", "progress-disk"), t.appendChild(i), this._diskCircle = KE({ label: "DISK" }), this._diskCircle.mount(i, 0), this._startMetricsPolling(), O("info", "Progress circles mounted (CPU, RAM, DISK)");
};
I.prototype._startMetricsPolling = function() {
  let t = this;
  const e = function() {
    Y.metricsPolls++, pN(gB, { method: "GET", headers: { Accept: "application/json" } }, 5e3).then(function(n) {
      if (n.ok) return n.json();
      throw new Error("Metrics API response not OK: " + n.status);
    }).then(function(n) {
      const i = n && n.data ? n.data : n;
      i && (i.cpu !== void 0 && t._cpuCircle && t._cpuCircle.setValue(i.cpu), i.memory !== void 0 && t._memoryCircle && t._memoryCircle.setValue(i.memory), i.disk !== void 0 && t._diskCircle && t._diskCircle.setValue(i.disk), Y.metricsSource = "api");
    }).catch(function(n) {
      Y.metricsPollErrors++, O("warn", "Metrics API poll failed", n.message);
    });
  };
  e(), this._metricsInterval = setInterval(function() {
    document.hidden || e();
  }, vw), this._intervals.push(this._metricsInterval), O("info", "Metrics polling started (" + vw / 1e3 + "s interval)");
};
I.prototype._mountDecorativeIcons = function(t, e) {
  let n = this;
  e = e || this._config || {};
  let i = [];
  return e.dock && e.dock.items && Array.isArray(e.dock.items) && (i = e.dock.items.filter(function(o) {
    return o && o.id && o.type !== "separator";
  }).map(function(o) {
    return {
      id: o.icon || o.id,
      icon: o.icon || o.id,
      tooltip: o.tooltip || o.ariaLabel || o.id,
      href: o.href || null,
      panel: o.panel || null,
      ariaLabel: o.ariaLabel || o.tooltip || o.id
    };
  })), O("info", "Mounting decorative icons", { count: i.length, items: i.map(function(o) {
    return o.id;
  }) }), Promise.resolve().then(function() {
    return $M.mountAll(t, i);
  }).then(function(o) {
    n._iconsMounted = !0;
    const s = o && o.mounted ? o.mounted.length : 0, r = o && o.failed ? o.failed.length : 0;
    O("info", "Icons mounted", { mounted: s, failed: r });
  }).catch(function(o) {
    O("error", "Failed to mount icons", o.message);
  });
};
I.prototype._mountButtons = function(t) {
  let e = this;
  return iN.mountAll(t).then(function(n) {
    e._buttonsMounted = !0, O("info", "Buttons mounted", { mounted: n.mounted.length, failed: n.failed.length }), n.failed.length > 0 && O("warn", "Some buttons failed to mount", { failed: n.failed });
  }).catch(function(n) {
    O("error", "Failed to mount buttons", n.message);
  });
};
I.prototype._mountBrandLottie = function(t) {
  let e = this;
  const n = t.querySelector('[data-lottie="cards"]');
  return n ? LI.init({ debug: !1 }).then(function() {
    return LI.loadAnimation("cards", n, { loop: !0, autoplay: !0, renderer: "svg" });
  }).then(function(i) {
    e._brandAnimation = i, O("info", "Brand Lottie loaded");
  }).catch(function(i) {
    O("warn", "Failed to load brand Lottie", i.message);
  }) : (O("debug", "Lottie container not found"), Promise.resolve());
};
I.prototype._mountAnnounceRegion = function(t, e) {
  let n = this;
  return Promise.resolve().then(function() {
    return n._announceRegion = new mc(), n._announceRegion.mount(t, {}, e);
  }).then(function() {
    O("info", "Announce live region mounted");
  }).catch(function(i) {
    O("warn", "Failed to mount announce-live-region", i.message);
  });
};
I.prototype._mountStatusLang = function(t, e) {
  let n = this;
  return Promise.resolve().then(function() {
    const i = document.createElement("div");
    i.className = "dsd-footer__status-lang", i.setAttribute("data-component", "status-lang"), t.appendChild(i), n._statusLang = new fc({ container: i }), n._statusLang.mount && n._statusLang.mount(), O("info", "Status lang mounted");
  }).catch(function(i) {
    O("warn", "Failed to mount status-lang", i.message);
  });
};
I.prototype._mountLinksUseful = function(t, e) {
  let n = this;
  return Promise.resolve().then(function() {
    if (n._linksUseful = new ro(), n._linksUseful.mount) return n._linksUseful.mount(t, {}, e);
  }).then(function() {
    O("info", "Links useful mounted");
  }).catch(function(i) {
    O("warn", "Failed to mount links-useful", i.message);
  });
};
I.prototype._mountVersionEnv = function(t, e) {
  let n = this;
  return Promise.resolve().then(function() {
    const i = document.createElement("div");
    if (i.className = "dsd-footer__version-env", i.setAttribute("data-component", "version-env"), t.appendChild(i), n._versionEnv = new at(), n._versionEnv.mount) return n._versionEnv.mount(i, {}, e);
  }).then(function() {
    O("info", "Version env mounted");
  }).catch(function(i) {
    O("warn", "Failed to mount version-env", i.message);
  });
};
I.prototype._mountSessionTimer = function(t) {
  let e = this;
  const n = document.createElement("div");
  n.className = "dsd-footer__session-chip", n.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__session-icon"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span class="dsd-footer__session-value">00:00:00</span>', t.appendChild(n);
  const i = setInterval(function() {
    const o = Date.now() - e._sessionStart, s = Math.floor(o / 36e5), r = Math.floor(o % 36e5 / 6e4), c = Math.floor(o % 6e4 / 1e3), l = [s, r, c].map(function(m) {
      return String(m).padStart(2, "0");
    }).join(":"), u = n.querySelector(".dsd-footer__session-value");
    u && (u.textContent = l);
  }, 1e3);
  this._intervals.push(i);
};
I.prototype._mountMetaInfo = function(t, e) {
  const n = t.querySelector('[data-value="build"]');
  n && (n.textContent = "Build: " + (e.buildDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0])), this._fetchIpInfo(t);
};
I.prototype._fetchIpInfo = function(t) {
  const e = this;
  Y.ipFetchAttempts++;
  const n = t.querySelector('[data-value="ip"]'), i = t.querySelector('[data-value="location"]'), o = function() {
    n && (n.textContent = "IP: --"), i && (i.textContent = "Local: --");
  };
  pN("https://ipapi.co/json/", { method: "GET", headers: { Accept: "application/json" } }, 5e3).then(function(s) {
    if (s.ok) return s.json();
    throw new Error("Response not OK: " + s.status);
  }).then(function(s) {
    Y.ipFetchSuccess++, e._ipData = s, n && s.ip && (n.textContent = "IP: " + s.ip), i && s.city && s.region && (i.textContent = s.city + ", " + s.region), O("debug", "IP info fetched successfully");
  }).catch(function(s) {
    Y.ipFetchErrors++, O("warn", "Failed to fetch IP info (degraded mode)", s.message), o();
  });
};
I.prototype.destroyAll = function() {
  this._iconsMounted && ($M.unmountAll(), this._iconsMounted = !1), iN.unmountAll(), this._buttonsMounted = !1, this._announceRegion && this._announceRegion.destroy && (this._announceRegion.destroy(), this._announceRegion = null), this._statusLang && this._statusLang.destroy && (this._statusLang.destroy(), this._statusLang = null), this._metricsInterval && (clearInterval(this._metricsInterval), this._metricsInterval = null), this._brandAnimation && (LI.destroyAnimation("cards"), this._brandAnimation = null), this._connectionStatus && (this._connectionStatus.unmount(), this._connectionStatus = null), this._cpuCircle && (this._cpuCircle.unmount(), this._cpuCircle = null), this._memoryCircle && (this._memoryCircle.unmount(), this._memoryCircle = null), this._diskCircle && (this._diskCircle.unmount(), this._diskCircle = null), this._versionEnv && this._versionEnv.destroy && (this._versionEnv.destroy(), this._versionEnv = null), this._linksUseful && this._linksUseful.destroy && (this._linksUseful.destroy(), this._linksUseful = null);
  let t;
  for (t = 0; t < this._intervals.length; t++) clearInterval(this._intervals[t]);
  for (this._intervals = [], t = 0; t < this._cleanupFns.length; t++) this._cleanupFns[t]();
  this._cleanupFns = [], this._mounted = !1, this._mountedAt = null, this._metaContainer = null, this._config = null, O("info", "Registry destroyed");
};
I.prototype.announce = function(t) {
  this._announceRegion && this._announceRegion.announce(t);
};
I.prototype.getComponent = function(t) {
  return {
    "connection-status": this._connectionStatus,
    "cpu-circle": this._cpuCircle,
    "memory-circle": this._memoryCircle,
    "disk-circle": this._diskCircle,
    "announce-region": this._announceRegion,
    "status-lang": this._statusLang,
    "version-env": this._versionEnv,
    "links-useful": this._linksUseful
  }[t] || null;
};
I.prototype.getAllComponents = function() {
  return [
    { name: "connection-status", instance: this._connectionStatus },
    { name: "cpu-circle", instance: this._cpuCircle },
    { name: "memory-circle", instance: this._memoryCircle },
    { name: "disk-circle", instance: this._diskCircle },
    { name: "icons", instance: this._iconsMounted ? $M : null },
    { name: "announce-region", instance: this._announceRegion },
    { name: "status-lang", instance: this._statusLang },
    { name: "version-env", instance: this._versionEnv },
    { name: "links-useful", instance: this._linksUseful }
  ].filter(function(e) {
    return e.instance;
  });
};
I.prototype.getVersion = function() {
  return cm;
};
I.prototype.getMetrics = function() {
  return {
    mounted: this._mounted,
    buttonsMounted: this._buttonsMounted,
    connectionStatusMounted: !!this._connectionStatus,
    cpuCircleMounted: !!this._cpuCircle,
    memoryCircleMounted: !!this._memoryCircle,
    diskCircleMounted: !!this._diskCircle,
    iconsMounted: this._iconsMounted,
    announceRegionMounted: !!this._announceRegion,
    statusLangMounted: !!this._statusLang,
    versionEnvMounted: !!this._versionEnv,
    linksUsefulMounted: !!this._linksUseful,
    metricsPolling: !!this._metricsInterval,
    metricsSource: Y.metricsSource,
    metricsPolls: Y.metricsPolls,
    metricsPollErrors: Y.metricsPollErrors,
    brandAnimation: !!this._brandAnimation,
    ipFetch: { attempts: Y.ipFetchAttempts, success: Y.ipFetchSuccess, errors: Y.ipFetchErrors }
  };
};
I.prototype.getManifest = function() {
  const t = this.getAllComponents();
  return {
    registryId: bh,
    version: cm,
    loadedAt: this._mountedAt,
    itemCount: t.length,
    items: t.map(function(e) {
      return e.name;
    }),
    mounted: this._mounted,
    metrics: this.getMetrics(),
    slots: Object.keys(mo),
    p23Governance: !0,
    diCompliance: "100%",
    timestamp: Date.now()
  };
};
I.prototype.healthCheck = function() {
  const e = Y.metricsSource === "api";
  let i = [
    this._mounted,
    this._buttonsMounted,
    !!this._connectionStatus,
    !!this._cpuCircle,
    !!this._memoryCircle,
    !!this._diskCircle,
    this._iconsMounted,
    !!this._announceRegion,
    !!this._versionEnv,
    !!this._linksUseful,
    !!hN("logger"),
    e
  ].filter(Boolean).length;
  return {
    status: i >= 9 ? "HEALTHY" : i >= 7 ? "DEGRADED" : "UNHEALTHY",
    score: i + "/12",
    checks: this.getMetrics(),
    version: cm,
    moduleId: bh,
    p23Governance: !0,
    diCompliance: e ? "100%" : "partial",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
I.prototype.info = function() {
  return {
    version: cm,
    moduleId: bh,
    mounted: this._mounted,
    components: this.getAllComponents().map(function(t) {
      return t.name;
    }),
    metrics: this.getMetrics(),
    p23Governance: !0,
    diCompliance: Y.metricsSource === "api" ? "100%" : "partial"
  };
};
I.prototype.setDebug = function(t) {
};
I.VERSION = cm;
I.SLOTS = mo;
const gN = "6.9.0-P2-ENTERPRISE", qk = "footer.core.lifecycle", Zk = p({ moduleId: qk });
function _B() {
  Zk.init();
}
function _N(t) {
  return Zk.get(t);
}
const vB = () => {
  const t = _N("config");
  return !!(t && t.app && t.app.debug);
}, Qu = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = _N("logger");
  if (!n) return;
  const i = `[${qk}]`;
  if (t === "error") {
    n.error && n.error(i, e.join(" "));
    return;
  }
  if (t === "warn") {
    n.warn && n.warn(i, e.join(" "));
    return;
  }
  if (t === "info") {
    n.info && n.info(i, e.join(" "));
    return;
  }
  vB() && n.debug && n.debug(i, e.join(" "));
}, io = { mountAttempts: 0, mountSuccess: 0, mountFailures: 0, unmountCount: 0, lastMountAt: null, lastUnmountAt: null };
function oe() {
  this._mounted = !1, this._mounting = !1, this._container = null, this._containerId = null, this._abortController = null, this._cleanupFns = [];
}
oe.prototype.mount = function(t) {
  const e = this;
  return this._mounted || this._mounting ? (Qu("warn", "Já montado ou montando"), Promise.resolve({ success: !1, reason: "already-mounted", container: this._container, containerId: this._containerId, source: "lifecycle" })) : (_B(), io.mountAttempts++, this._mounting = !0, Promise.resolve().then(() => {
    if (e._container = typeof t == "string" ? document.querySelector(t) : t, !e._container) {
      const n = ["#shell-footer-region", "#footer-region", '[data-region="footer"]', "footer"];
      for (let i = 0; i < n.length && (e._container = document.querySelector(n[i]), !e._container); i++)
        ;
    }
    return e._container ? (e._abortController = new AbortController(), e._mounted = !0, e._mounting = !1, e._containerId = e._container.id || "footer-root", io.mountSuccess++, io.lastMountAt = Date.now(), Qu("info", `Footer montado containerId=${e._containerId}`), { success: !0, reason: null, container: e._container, containerId: e._containerId, source: "lifecycle" }) : (Qu("error", "Container não encontrado"), io.mountFailures++, e._mounting = !1, { success: !1, reason: "container-not-found", container: null, containerId: null, source: "lifecycle" });
  }).catch((n) => (Qu("error", "Erro ao montar:", n), io.mountFailures++, e._mounting = !1, { success: !1, reason: n.message || "mount-error", container: null, containerId: null, source: "lifecycle" })));
};
oe.prototype.unmount = function() {
  if (!this._mounted) return Promise.resolve({ success: !1, reason: "not-mounted" });
  try {
    for (let t = 0; t < this._cleanupFns.length; t++)
      try {
        this._cleanupFns[t]();
      } catch {
      }
    return this._cleanupFns = [], this._abortController && (this._abortController.abort(), this._abortController = null), this._mounted = !1, this._container = null, this._containerId = null, io.unmountCount++, io.lastUnmountAt = Date.now(), Qu("info", "Footer desmontado"), Promise.resolve({ success: !0, reason: null });
  } catch (t) {
    return Qu("error", "Erro ao desmontar:", t), Promise.resolve({ success: !1, reason: t.message || "unmount-error" });
  }
};
oe.prototype.registerCleanup = function(t) {
  typeof t == "function" && this._cleanupFns.push(t);
};
oe.prototype.isMounted = function() {
  return this._mounted;
};
oe.prototype.getContainer = function() {
  return this._container;
};
oe.prototype.getSignal = function() {
  return this._abortController ? this._abortController.signal : null;
};
oe.prototype.getMetrics = () => Object.assign({}, io);
oe.prototype.setDebug = (t) => {
};
oe.prototype.getStatus = function() {
  const t = Zk.snapshot();
  return { moduleId: qk, version: gN, mounted: this._mounted, mounting: this._mounting, hasContainer: !!this._container, containerId: this._containerId, metrics: this.getMetrics(), portsInitialized: t._initialized, timestamp: Date.now() };
};
oe.prototype.info = function() {
  return Object.assign({}, this.getStatus(), { healthCheck: this.healthCheck() });
};
oe.prototype.healthCheck = function() {
  const t = Zk.snapshot(), e = { mounted: this._mounted, hasContainer: !!this._container, notMounting: !this._mounting, noFailures: io.mountFailures === 0, portsInitialized: t._initialized }, n = Object.keys(e);
  let i = 0;
  for (let s = 0; s < n.length; s++)
    e[n[s]] && i++;
  const o = n.length;
  return { status: i === o ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: i, maxScore: o, scoreDisplay: `${i}/${o}`, checks: e, metrics: io, version: gN, moduleId: qk, portsInitialized: t._initialized, timestamp: Date.now() };
};
const vN = "7.3.0-P18EC", Kk = "footer.core.integrations", MM = p({ moduleId: Kk });
function am(t) {
  return MM.get(t);
}
const $B = () => {
  const t = am("config");
  return !!(t && t.app && t.app.debug);
}, H = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = am("logger");
  if (!n) return;
  const i = `[${Kk}]`;
  if (t === "error") {
    n.error && n.error(i, e.join(" "));
    return;
  }
  if (t === "warn") {
    n.warn && n.warn(i, e.join(" "));
    return;
  }
  if (t === "info") {
    n.info && n.info(i, e.join(" "));
    return;
  }
  $B() && n.debug && n.debug(i, e.join(" "));
}, P = { eventBusConnections: 0, globalStateConnections: 0, routerConnections: 0, appShellConnections: 0, eventsReceived: 0, routeReads: 0, routeFallbacks: 0, errors: 0 };
function R() {
  this._eventBus = null, this._globalState = null, this._router = null, this._appShell = null, this._cleanupFns = [], this._initialized = !1, this._cachedRoute = null;
}
R.prototype.init = function(t) {
  if (this._initialized) {
    H("debug", "Already initialized");
    return;
  }
  this._connectEventBus(), this._connectGlobalState(), this._connectRouter(), this._connectAppShell(), this._setupRouteListener(), this._initialized = !0, H("info", "Integrations initialized (P18EC compliant)");
};
R.prototype._connectEventBus = function() {
  try {
    this._eventBus = am("eventBus"), this._eventBus && (P.eventBusConnections++, H("debug", "EventBus conectado"));
  } catch (t) {
    P.errors++, H("error", "Erro ao conectar EventBus:", t);
  }
};
R.prototype._connectGlobalState = function() {
  try {
    this._globalState = am("globalState"), this._globalState && (P.globalStateConnections++, H("debug", "GlobalState conectado"));
  } catch (t) {
    P.errors++, H("error", "Erro ao conectar GlobalState:", t);
  }
};
R.prototype._connectRouter = function() {
  try {
    this._router = am("router"), this._router && (P.routerConnections++, H("debug", "RouterGlobal conectado"));
  } catch (t) {
    P.errors++, H("error", "Erro ao conectar Router:", t);
  }
};
R.prototype._connectAppShell = function() {
  try {
    this._appShell = am("appShell"), this._appShell && (P.appShellConnections++, H("debug", "AppShell conectado"));
  } catch (t) {
    P.errors++, H("error", "Erro ao conectar AppShell:", t);
  }
};
R.prototype._setupRouteListener = function() {
  const t = this;
  if (!this._eventBus) return;
  const e = (n) => {
    n && n.path ? t._cachedRoute = n.path : n && n.route && (t._cachedRoute = n.route);
  };
  try {
    this._eventBus.on($c.ROUTE_CHANGED, e), this._eventBus.on($c.NAVIGATED, e), this._cleanupFns.push(() => {
      t._eventBus && t._eventBus.off && (t._eventBus.off($c.ROUTE_CHANGED, e), t._eventBus.off($c.NAVIGATED, e));
    });
  } catch (n) {
    H("debug", "Could not setup route listener:", n);
  }
};
R.prototype.on = function(t, e) {
  if (!this._eventBus)
    return H("info", "EventBus nao disponivel para on() - funcionando standalone"), () => {
    };
  try {
    const n = this._eventBus.on(t, (i) => {
      P.eventsReceived++, e(i);
    });
    return this._cleanupFns.push(n), n;
  } catch (n) {
    return P.errors++, H("error", "Erro ao registrar listener:", n), () => {
    };
  }
};
R.prototype.getCurrentRoute = function() {
  P.routeReads++;
  try {
    if (this._router) {
      if (this._router.getCurrentRoute) {
        const t = this._router.getCurrentRoute();
        if (t && (t.path || t.hash)) return t.path || t.hash;
      }
      if (this._router.current) {
        const t = this._router.current;
        if (typeof t == "string") return t;
        if (t && t.path) return t.path;
      }
    }
    return this._cachedRoute ? this._cachedRoute : (P.routeFallbacks++, typeof window < "u" && window.location && ((window.location.hash ? window.location.hash.replace("#", "") : "") || window.location.pathname) || "/");
  } catch (t) {
    return P.errors++, H("error", "Erro ao obter rota atual:", t), "/";
  }
};
R.prototype.getEventBus = function() {
  return this._eventBus;
};
R.prototype.getGlobalState = function() {
  return this._globalState;
};
R.prototype.getRouter = function() {
  return this._router;
};
R.prototype.getAppShell = function() {
  return this._appShell;
};
R.prototype.registerCleanup = function(t) {
  typeof t == "function" && this._cleanupFns.push(t);
};
R.prototype.cleanup = function() {
  for (let t = 0; t < this._cleanupFns.length; t++)
    try {
      this._cleanupFns[t]();
    } catch {
    }
  this._cleanupFns = [], this._initialized = !1, this._cachedRoute = null, H("debug", "Integrations cleanup");
};
R.prototype.destroy = function() {
  this.cleanup(), this._eventBus = null, this._globalState = null, this._router = null, this._appShell = null, H("debug", "Integrations destroyed");
};
R.prototype.setDebug = (t) => {
};
R.prototype.getMetrics = () => Object.assign({}, P);
R.prototype.info = function() {
  const t = MM.snapshot();
  return { moduleId: Kk, version: vN, initialized: this._initialized, connections: { eventBus: !!this._eventBus, globalState: !!this._globalState, router: !!this._router, appShell: !!this._appShell }, cachedRoute: this._cachedRoute, metrics: this.getMetrics(), healthCheck: this.healthCheck(), portsInitialized: t._initialized, timestamp: Date.now() };
};
R.prototype.healthCheck = function() {
  const t = MM.snapshot(), e = { initialized: this._initialized, hasEventBus: !!this._eventBus, hasRouter: !!this._router, hasGlobalState: !!this._globalState, lowErrors: P.errors < 10, lowFallbacks: P.routeFallbacks < P.routeReads * 0.2, portsInitialized: t._initialized };
  let n = 0;
  for (const o in e)
    e[o] && n++;
  const i = 7;
  return { status: n >= 5 ? "HEALTHY" : n >= 3 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: i, scoreDisplay: `${n}/${i}`, checks: e, metrics: P, version: vN, moduleId: Kk, timestamp: Date.now() };
};
const $N = "6.8.0-P2-ENTERPRISE", Wk = "footer.core.circuit-breaker", RM = p({ moduleId: Wk });
function yN(t) {
  return RM.get(t);
}
const yB = () => {
  const t = yN("config");
  return !!(t && t.app && t.app.debug);
}, nm = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = yN("logger");
  if (!n) return;
  const i = `[${Wk}]`;
  if (t === "error") {
    n.error && n.error(i, e.join(" "));
    return;
  }
  if (t === "warn") {
    n.warn && n.warn(i, e.join(" "));
    return;
  }
  if (t === "info") {
    n.info && n.info(i, e.join(" "));
    return;
  }
  yB() && n.debug && n.debug(i, e.join(" "));
}, cn = { CLOSED: "closed", OPEN: "open", HALF_OPEN: "half-open" }, so = { successCount: 0, failureCount: 0, tripCount: 0, resetCount: 0 };
function K(t) {
  t = t || {}, this._failureThreshold = t.failureThreshold || 3, this._resetTimeout = t.resetTimeout || 3e4, this._state = cn.CLOSED, this._failureCount = 0, this._lastFailureTime = null, this._resetTimer = null;
}
K.prototype.execute = function(t, e) {
  const n = this;
  if (this._state === cn.OPEN)
    if (Date.now() - this._lastFailureTime >= this._resetTimeout)
      this._state = cn.HALF_OPEN, nm("info", "Transição para HALF_OPEN");
    else
      return nm("warn", "Circuit OPEN - rejeitando chamada"), e ? Promise.resolve().then(() => e()) : Promise.reject(new Error("Circuit breaker is OPEN"));
  return Promise.resolve().then(() => t()).then((i) => (n._onSuccess(), i)).catch((i) => {
    if (n._onFailure(i), e) return e();
    throw i;
  });
};
K.prototype._onSuccess = function() {
  so.successCount++, this._state === cn.HALF_OPEN && (this._state = cn.CLOSED, this._failureCount = 0, so.resetCount++, nm("info", "Circuit CLOSED após sucesso"));
};
K.prototype._onFailure = function(t) {
  so.failureCount++, this._failureCount++, this._lastFailureTime = Date.now(), nm("warn", `Falha ${this._failureCount}/${this._failureThreshold}:`, t.message), this._failureCount >= this._failureThreshold && this._state !== cn.OPEN && (this._state = cn.OPEN, so.tripCount++, nm("error", "Circuit OPEN - threshold atingido"));
};
K.prototype.reset = function() {
  this._state = cn.CLOSED, this._failureCount = 0, this._lastFailureTime = null, so.resetCount++, nm("info", "Circuit resetado manualmente");
};
K.prototype.destroy = function() {
  this.reset();
};
K.prototype.getState = function() {
  return this._state;
};
K.prototype.isOpen = function() {
  return this._state === cn.OPEN;
};
K.prototype.isClosed = function() {
  return this._state === cn.CLOSED;
};
K.prototype.getMetrics = function() {
  return Object.assign({}, so, { state: this._state, failureCount: this._failureCount });
};
K.prototype.setDebug = (t) => {
};
K.prototype.info = function() {
  const t = RM.snapshot();
  return { moduleId: Wk, version: $N, state: this._state, failureCount: this._failureCount, threshold: this._failureThreshold, metrics: Object.assign({}, so), healthCheck: this.healthCheck(), portsInitialized: t._initialized, timestamp: Date.now() };
};
K.prototype.healthCheck = function() {
  const t = RM.snapshot(), e = { notOpen: this._state !== cn.OPEN, lowFailures: this._failureCount < this._failureThreshold, recentSuccess: so.successCount > 0 || so.failureCount === 0, portsInitialized: t._initialized }, n = Object.keys(e);
  let i = 0;
  for (let s = 0; s < n.length; s++)
    e[n[s]] && i++;
  const o = n.length;
  return { status: i === o ? "HEALTHY" : i >= 1 ? "DEGRADED" : "UNHEALTHY", score: i, maxScore: o, scoreDisplay: `${i}/${o}`, checks: e, metrics: so, version: $N, moduleId: Wk, timestamp: Date.now() };
};
new K();
const kN = "6.6.0-P17WI", Jk = "footer-a11y-announce", wM = p({ moduleId: Jk });
function PM(t) {
  return wM.get(t);
}
const kB = () => {
  const t = PM("config");
  return !!(t && t.app && t.app.debug);
}, bN = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), n = PM("logger");
  if (!n) return;
  const i = `[${Jk}]`;
  kB() && n.debug && n.debug(i, e.join(" "));
}, X_ = { announceCount: 0, politeCount: 0, assertiveCount: 0 };
function un() {
  this._region = null, this._queue = [], this._processing = !1;
}
un.prototype.init = function(t) {
  const e = t ? t.querySelector("[aria-live]") : null;
  return this._region = e || this._createRegion(t), bN("info", "Announce initialized"), this;
};
un.prototype._createRegion = (t) => {
  const e = document.createElement("div");
  return e.setAttribute("aria-live", "polite"), e.setAttribute("aria-atomic", "true"), e.className = "sr-only", e.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);", t && t.appendChild(e), e;
};
un.prototype.announce = function(t, e) {
  t && (e = e || "polite", X_.announceCount++, e === "assertive" ? X_.assertiveCount++ : X_.politeCount++, this._queue.push({ message: t, priority: e }), this._processQueue());
};
un.prototype._processQueue = function() {
  const t = this;
  if (this._processing || this._queue.length === 0) return;
  this._processing = !0;
  const e = this._queue.shift(), n = e.message, i = e.priority;
  this._region ? (this._region.setAttribute("aria-live", i), this._region.textContent = "", requestAnimationFrame(() => {
    t._region && (t._region.textContent = n), setTimeout(() => {
      t._processing = !1, t._processQueue();
    }, 1e3);
  })) : this._processing = !1;
};
un.prototype.clear = function() {
  this._queue = [], this._region && (this._region.textContent = "");
};
un.prototype.destroy = function() {
  this.clear(), this._region = null, bN("info", "Announce destroyed");
};
un.prototype.setDebug = (t) => {
};
un.prototype.getMetrics = () => Object.assign({}, X_);
un.prototype.info = function() {
  const t = wM.snapshot();
  return { moduleId: Jk, version: kN, hasRegion: !!this._region, queueLength: this._queue.length, metrics: this.getMetrics(), portsInitialized: t._initialized, timestamp: Date.now() };
};
un.prototype.healthCheck = function() {
  const t = wM.snapshot();
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: kN, moduleId: Jk, checks: { hasRegion: !!this._region, hasLogger: !!PM("logger"), portsInitialized: t._initialized }, metrics: this.getMetrics() };
};
const no = { mountCount: 0, unmountCount: 0, routeChanges: 0, configLoads: 0, errors: 0, lastActivity: null };
function $w(t) {
  t in no && typeof no[t] == "number" && no[t]++;
}
function EN() {
  return { ...no };
}
function bB() {
  no.mountCount = 0, no.unmountCount = 0, no.routeChanges = 0, no.configLoads = 0, no.errors = 0, no.lastActivity = null;
}
const TM = "5.5.0-P2-ENTERPRISE", fr = "footer.core.event-bus", IN = p({ moduleId: fr });
function pm(t) {
  return IN.get(t);
}
const V = {
  info(t, e) {
    const n = pm("logger");
    n && n.info && n.info(`[${fr}] ${t}`, e || {});
  },
  warn(t, e) {
    const n = pm("logger");
    n && n.warn && n.warn(`[${fr}] ${t}`, e || {});
  },
  error(t, e) {
    const n = pm("logger");
    n && n.error && n.error(`[${fr}] ${t}`, e || {});
  },
  debug(t, e) {
    const n = pm("logger");
    n && n.debug && n.debug(`[${fr}] ${t}`, e || {});
  }
};
function C(t) {
  this.instanceId = t || "default", this.listeners = /* @__PURE__ */ new Map(), this.eventHistory = [], this.maxHistorySize = 50, this.isDestroyed = !1, this._metrics = { totalEmitted: 0, totalListeners: 0, errors: 0, lastEventTime: null }, this.circuitBreaker = { failures: 0, maxFailures: 5, resetTimeout: 3e4, isOpen: !1, lastFailureTime: null }, this.healthCheckInterval = null, this._initHealthCheck(), V.info("FooterEventBus created (ISOLATED)", { instanceId: this.instanceId });
}
C.prototype._initHealthCheck = function() {
  const t = this;
  this.healthCheckInterval = setInterval(() => {
    if (t.isDestroyed) {
      clearInterval(t.healthCheckInterval);
      return;
    }
    t.circuitBreaker.isOpen && Date.now() - t.circuitBreaker.lastFailureTime > t.circuitBreaker.resetTimeout && (t.circuitBreaker.isOpen = !1, t.circuitBreaker.failures = 0, V.info("Circuit breaker auto-reset"));
  }, 5e3);
};
C.prototype._validateEventName = (t) => {
  if (!t || typeof t != "string") throw new TypeError("Event name must be a non-empty string");
  return !0;
};
C.prototype._validateCallback = (t) => {
  if (typeof t != "function") throw new TypeError("Callback must be a function");
  return !0;
};
C.prototype.on = function(t, e, n) {
  const i = this;
  if (n = n || {}, this.isDestroyed)
    return V.warn("Bus destroyed - on() ignored"), () => {
    };
  this._validateEventName(t), this._validateCallback(e), this.listeners.has(t) || this.listeners.set(t, []);
  const o = this.listeners.get(t);
  let s = null;
  for (let c = 0; c < o.length; c++)
    if (o[c].callback === e) {
      s = o[c];
      break;
    }
  if (s)
    return V.debug(`Duplicate listener ignored: ${t}`), () => {
      i.off(t, e);
    };
  const r = {
    callback: e,
    once: n.once || !1,
    priority: n.priority || 0,
    id: `${t}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    registeredAt: Date.now()
  };
  return this.listeners.get(t).push(r), this.listeners.get(t).sort((c, l) => l.priority - c.priority), this._metrics.totalListeners++, V.debug(`Listener registered: ${t}`), () => {
    i.off(t, e);
  };
};
C.prototype.once = function(t, e, n) {
  return n = n || {}, this.on(t, e, Object.assign({}, n, { once: !0 }));
};
C.prototype.off = function(t, e) {
  if (this.isDestroyed || !this.listeners.has(t)) return !1;
  const n = this.listeners.get(t);
  let i = -1;
  for (let o = 0; o < n.length; o++)
    if (n[o].callback === e) {
      i = o;
      break;
    }
  return i > -1 ? (n.splice(i, 1), n.length === 0 && this.listeners.delete(t), V.debug(`Listener removed: ${t}`), !0) : !1;
};
C.prototype.emit = function(t, e) {
  const n = this;
  if (e = e || {}, this.isDestroyed)
    return V.warn("Bus destroyed - emit() ignored"), 0;
  if (this._validateEventName(t), this.circuitBreaker.isOpen)
    return V.warn(`Circuit breaker open - emit blocked: ${t}`), 0;
  const i = Date.now();
  if (this._metrics.lastEventTime = i, this._metrics.totalEmitted++, this._addToHistory({ eventName: t, data: e, timestamp: i }), !this.listeners.has(t))
    return V.debug(`Event without listeners: ${t}`), 0;
  const o = this.listeners.get(t).slice();
  let s = 0;
  for (let r = 0; r < o.length; r++)
    ((c) => {
      try {
        Promise.resolve().then(() => {
          c.callback(Object.assign({}, e, { _meta: { eventName: t, timestamp: i, instanceId: n.instanceId, listenerId: c.id } }));
        }).catch((l) => {
          n._handleListenerError(l);
        }), s++, c.once && n.off(t, c.callback);
      } catch (l) {
        n._metrics.errors++, n._handleListenerError(l);
      }
    })(o[r]);
  return V.debug(`Event emitted (LOCAL): ${t} (${s} listeners)`), s;
};
C.prototype._handleListenerError = function(t) {
  this.circuitBreaker.failures++, this.circuitBreaker.lastFailureTime = Date.now(), this.circuitBreaker.failures >= this.circuitBreaker.maxFailures && (this.circuitBreaker.isOpen = !0, V.error(`Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`));
};
C.prototype._addToHistory = function(t) {
  this.eventHistory.push(t), this.eventHistory.length > this.maxHistorySize && this.eventHistory.shift();
};
C.prototype.getHistory = function(t) {
  if (t) {
    const e = [];
    for (let n = 0; n < this.eventHistory.length; n++)
      this.eventHistory[n].eventName === t && e.push(this.eventHistory[n]);
    return e;
  }
  return this.eventHistory.slice();
};
C.prototype.clearHistory = function() {
  this.eventHistory = [];
};
C.prototype.clear = function() {
  this.listeners.clear(), this._metrics.totalListeners = 0, V.info("All listeners removed");
};
C.prototype.clearAll = function() {
  this.clear(), this.clearHistory();
};
C.prototype.listenerCount = function(t) {
  const e = this.listeners.get(t);
  return e ? e.length : 0;
};
C.prototype.getRegisteredEvents = function() {
  return Array.from(this.listeners.keys());
};
C.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, {
    activeListeners: this.listeners.size,
    historySize: this.eventHistory.length,
    circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED",
    circuitBreakerFailures: this.circuitBreaker.failures,
    isHealthy: !this.circuitBreaker.isOpen && !this.isDestroyed
  });
};
C.prototype.resetMetrics = function() {
  const t = this, e = Object.keys(this._metrics);
  for (let n = 0; n < e.length; n++) {
    const i = e[n];
    t._metrics[i] = typeof t._metrics[i] == "number" ? 0 : null;
  }
};
C.prototype.healthCheck = function() {
  const t = IN.snapshot(), e = {
    notDestroyed: !this.isDestroyed,
    circuitBreakerClosed: !this.circuitBreaker.isOpen,
    listenersMapReady: this.listeners instanceof Map,
    historyReady: Array.isArray(this.eventHistory),
    noExcessiveErrors: this._metrics.errors < 100,
    portsInitialized: t._initialized
  }, n = Object.keys(e);
  let i = 0;
  for (let r = 0; r < n.length; r++)
    e[n[r]] && i++;
  const o = n.length, s = [];
  for (let r = 0; r < n.length; r++)
    e[n[r]] || s.push(n[r]);
  return {
    status: i === o ? "HEALTHY" : i >= o - 1 ? "DEGRADED" : "UNHEALTHY",
    score: i,
    maxScore: o,
    scoreDisplay: `${i}/${o}`,
    checks: e,
    issues: s,
    version: TM,
    moduleId: fr,
    instanceId: this.instanceId,
    isolation: "FULL",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
C.prototype.info = function() {
  return {
    version: TM,
    moduleId: fr,
    instanceId: this.instanceId,
    isolation: "FULL",
    registeredEvents: this.getRegisteredEvents(),
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck()
  };
};
C.prototype.getVersion = () => TM;
C.prototype.destroy = function() {
  this.isDestroyed || (this.isDestroyed = !0, this.clear(), this.clearHistory(), this.healthCheckInterval && clearInterval(this.healthCheckInterval), V.info("FooterEventBus destroyed"));
};
let QE = null;
function Qk() {
  return QE || (QE = new C("footer-singleton")), QE;
}
function NM(t, e) {
  e = e || {};
  const n = pm("eventBus");
  return !n || !n.emit ? (V.warn("Global EventBus not available for ui:action"), !1) : (n.emit(d.ACTION, { actionId: t, source: fr, timestamp: Date.now(), meta: e }), V.debug(`ui:action emitted to Global: ${t}`), !0);
}
const EB = "footer-http-client", yw = _o(EB), kw = {
  retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 },
  timeout: 1e4
};
let it = null, dm = { requests: 0, retries: 0, errors: 0, aborts: 0 };
function bw(t) {
  return new Promise((e) => setTimeout(e, t));
}
async function Lv(t, e = {}, n = 1) {
  dm.requests++;
  const { maxAttempts: i, baseDelay: o, maxDelay: s } = kw.retry;
  (!it || it.signal.aborted) && (it = new AbortController());
  const r = { ...e, signal: it.signal };
  try {
    const c = setTimeout(() => it.abort(), kw.timeout), l = await fetch(t, r);
    if (clearTimeout(c), !l.ok && n < i) {
      dm.retries++;
      const u = Math.min(o * Math.pow(2, n - 1), s);
      return yw.warn(`Request failed (${l.status}), retry ${n}/${i} in ${u}ms`), await bw(u), Lv(t, e, n + 1);
    }
    return l;
  } catch (c) {
    if (c.name === "AbortError")
      throw dm.aborts++, new Error("REQUEST_TIMEOUT");
    if (n < i) {
      dm.retries++;
      const l = Math.min(o * Math.pow(2, n - 1), s);
      return yw.warn(`Request error, retry ${n}/${i} in ${l}ms:`, c.message), await bw(l), it = new AbortController(), Lv(t, e, n + 1);
    }
    throw dm.errors++, c;
  }
}
function IB() {
  it && (it.abort(), it = null);
}
function OB() {
  return it = new AbortController(), it;
}
function DB() {
  return !!it && !it.signal.aborted;
}
const CB = "10.3.0-P17WI", ON = "footer-config-loader", MB = p({ moduleId: ON });
function RB(t) {
  return MB.get(t);
}
const pf = _o(ON);
let ri = null, fo = null;
const Ew = { id: "footer", version: CB, layout: { type: "two-bar", topBarHeight: "80px", bottomBarHeight: "36px" }, brand: { name: "DshowDash", tagline: "Enterprise Business Intelligence", animation: { enabled: !0, path: "/components/animacoes/Lottie_Graph_Growth.json" } }, dock: { enabled: !0, showTooltips: !0, items: [] }, features: { routerIntegration: !0, globalStateIntegration: !0, eventBusIntegration: !0, lottieEnabled: !0 }, defaults: { locale: "pt-BR", environment: "production" }, i18n: { brandName: "DshowDash", copyright: "Display Solutions. Todos os direitos reservados.", online: "Online", offline: "Offline", connectionRestored: "Conexao restaurada", connectionLost: "Conexao perdida" } };
function wB() {
  return fo ? Promise.resolve(fo) : Lv("/api/modules/footer/api.php?action=items").then((t) => {
    if (t.ok) return t.json();
    throw new Error("API not OK");
  }).then((t) => {
    if (t.ok && t.data && t.data.items)
      return fo = t.data.items, pf.info(`Dynamic items loaded count=${fo.length}`), fo;
    throw new Error("Invalid API response");
  }).catch((t) => (pf.warn(`Dynamic items load failed: ${t.message}`), fo = [], fo));
}
function PB(t, e) {
  const n = Object.assign({}, t);
  return e && e.length > 0 && (n.dock = n.dock || { enabled: !0, showTooltips: !0, items: [] }, n.dock.items = e.map((i) => {
    if (i.type === "separator") return { id: i.id, type: "separator" };
    const o = i.icon || i.icon_name || i.key || i.item_key;
    let s = i.actionData || i.action_data || {}, r = null, c = null, l = null;
    if (typeof s == "string")
      try {
        s = JSON.parse(s);
      } catch {
        s = {};
      }
    return s && (r = s.panelId || s.panel_id || null, c = s.widget || null, l = s.action || null), r = r || i.panelId || i.panel_id || null, {
      id: o,
      dbId: i.id,
      icon: o,
      tooltip: i.tooltip,
      label: i.label,
      actionType: i.actionType || i.action_type,
      panelId: r,
      panel: r,
      actionData: s,
      action: l,
      widget: c,
      href: i.href,
      ariaLabel: i.ariaLabel || i.tooltip,
      group: i.group || i.group_name,
      minAccessLevel: i.minAccessLevel || i.min_access_level,
      visible: i.visible !== !1 && i.is_visible !== !1
    };
  }), n.dock.source = "database", n.dock.itemCount = e.length), n;
}
function TB() {
  if (ri && fo) return Promise.resolve(ri);
  const t = RB("config"), e = t && t.paths && t.paths.components ? t.paths.components : "/components";
  return Promise.all([
    Lv(`${e}/footer/config.json`).then((n) => {
      if (n.ok) return n.json();
      throw new Error("Not OK");
    }).catch(() => (pf.warn("Static config failed, using defaults"), Object.assign({}, Ew))),
    wB()
  ]).then((n) => {
    const i = n[0], o = n[1];
    return ri = PB(i, o), $w("configLoads"), pf.info(`Config loaded version=${ri.version} dockItems=${ri.dock ? ri.dock.items.length : 0}`), ri;
  }).catch((n) => ($w("errors"), pf.warn(`Config load failed completely: ${n.message}`), ri = Object.assign({}, Ew), ri));
}
function NB() {
  ri = null, fo = null;
}
const DN = "footer-css-loader", SB = p({ moduleId: DN });
function LB(t) {
  return SB.get(t);
}
const Iw = _o(DN);
let Ow = !1;
function AB() {
  if (Ow || typeof window > "u" || typeof document > "u") return;
  const t = LB("config"), n = `${t && t.paths && t.paths.cssBase ? t.paths.cssBase : "/components"}/footer/styles/index.css`;
  if (!document.querySelector(`link[href="${n}"]`)) {
    const i = document.createElement("link");
    i.rel = "stylesheet", i.href = n, i.onerror = () => {
      Iw.error(`Failed to load CSS: ${n}`);
    }, document.head.appendChild(i), Iw.info(`CSS loaded: ${n}`);
  }
  Ow = !0;
}
const tv = "footer-auto-init", zB = p({ moduleId: tv });
function go(t) {
  return zB.get(t);
}
const j = {
  debug(t, e) {
    const n = go("logger");
    n && n.debug && n.debug(t, Object.assign({ component: tv }, e || {}));
  },
  info(t, e) {
    const n = go("logger");
    n && n.info && n.info(t, Object.assign({ component: tv }, e || {}));
  },
  error(t, e) {
    const n = go("logger");
    n && n.error && n.error(t, Object.assign({ component: tv }, e || {}));
  }
};
function UB() {
  const t = go("readyFlags");
  return t && t.waitFor ? (j.debug("Using ReadyFlags.waitFor(auth) - exclusive path"), t.waitFor("auth", 8e3).then((e) => e ? !0 : (j.debug("ReadyFlags.waitFor(auth) timeout"), document.body.dataset.authReady === "true"))) : (j.debug("ReadyFlags not available - using boot-ready-dom-bridge"), ej(1e4));
}
function HB() {
  const t = go("readyFlags"), e = go("appShell");
  return t && t.waitFor ? (j.debug("Using ReadyFlags.waitFor(appshell) - exclusive path"), t.waitFor("appshell", 8e3).then((n) => n ? !0 : (j.debug("ReadyFlags.waitFor(appshell) timeout"), e && e.isReady && e.isReady() || document.body.dataset.appReady === "true"))) : e && e.isReady && e.isReady() || typeof document < "u" && document.body && document.body.dataset.appReady === "true" ? Promise.resolve(!0) : (j.debug("ReadyFlags not available - using boot-ready-dom-bridge for appshell"), q2(1e4));
}
function jB(t, e, n) {
  if (typeof window > "u" || typeof document > "u") return;
  function i() {
    j.debug("autoInitFooter CHAMADO", { version: e }), Promise.all([UB(), HB()]).then(() => {
      j.debug("Auth e AppShell OK, chamando mount()"), t().then(() => {
        j.debug("mount() SUCESSO - Layout 2-bar");
      }).catch((c) => {
        j.error("mount() ERRO", { error: c.message });
      });
    });
  }
  const o = go("readyFlags"), s = go("appShell"), r = o && o.isReady && o.isReady("appshell") || s && s.isReady && s.isReady() || document.body.dataset.appReady === "true";
  if (j.debug("isShellReady check", { isShellReady: r }), r) {
    j.debug("AppShell ja ready - iniciando imediatamente"), i();
    return;
  }
  if (o && o.waitFor) {
    j.debug("Usando ReadyFlags.waitFor(appshell) - caminho exclusivo"), o.waitFor("appshell", 8e3).then(() => {
      i();
    });
    return;
  }
  j.debug("ReadyFlags não disponível - usando boot-ready-dom-bridge"), q2(1e4).then(() => {
    j.debug("AppShell ready via bridge"), i();
  });
}
function BB(t, e) {
  if (typeof window > "u") return;
  const n = go("config");
  n && n.app && n.app.debug && (window.__dev = window.__dev || {}, window.__dev.footer = t);
}
const vh = Object.freeze({
  regionId: "region:app:footer",
  shellHost: "#shell-footer-region",
  legacyId: "footer-root",
  moduleId: "components/footer",
  role: "contentinfo",
  ariaLabel: "Rodapé da aplicação"
});
Object.freeze([
  B.READY,
  B.MOUNTED,
  B.UNMOUNTED,
  B.BUTTON_CLICKED,
  B.BUTTON_MOUNTED,
  B.BUTTON_UNMOUNTED,
  d.FOOTER_BUTTON_CLICK,
  d.FOOTER_ACTION
]);
Object.freeze([
  Wd.SHOW,
  Wd.HIDE,
  Wd.REFRESH
]);
const VB = "footer.core.guards", xB = _o(VB), $a = {
  validations: 0,
  violations: 0,
  lastCheck: null
};
function GB(t) {
  t = t || {}, $a.validations++, $a.lastCheck = Date.now();
  const e = [];
  return t.usesHistory && e.push("Direct history API usage detected"), t.mutatesLocation && e.push("Direct location mutation detected"), e.length > 0 ? ($a.violations += e.length, xB.error("Navigation guard violations:", e), { valid: !1, violations: e }) : { valid: !0, violations: [] };
}
function YB(t) {
  if ($a.validations++, !t)
    return { valid: !1, reason: "Element is null" };
  const e = t.hasAttribute("data-uarps-region"), n = t.getAttribute("data-uarps-region");
  return e ? n !== "region:app:footer" ? ($a.violations++, { valid: !1, reason: `Invalid region: ${n}` }) : { valid: !0, region: n } : ($a.violations++, { valid: !1, reason: "Missing data-uarps-region" });
}
function FB(t) {
  if ($a.validations++, !t)
    return { valid: !0, reason: "Container is null - skip validation", coverage: "100%" };
  const n = t.querySelectorAll("[data-uarps-trigger]").length, i = t.querySelectorAll("button"), o = t.querySelectorAll("a[href]");
  return {
    valid: n >= 1,
    triggers: n,
    buttons: i.length,
    links: o.length,
    coverage: n > 0 ? "partial" : "none",
    note: "P1: Informative check. Full UARPS coverage is P2 goal."
  };
}
function qB(t) {
  const e = {
    navigation: GB({}),
    uarps: YB(t),
    triggers: FB(t)
  };
  return {
    valid: e.navigation.valid && e.uarps.valid,
    results: e,
    timestamp: Date.now()
  };
}
const Xk = "footer/runtime-context-handler", CN = "1.5.0-P2-ENTERPRISE", MN = p({ moduleId: Xk });
let zI = !1;
function ZB() {
  zI || (MN.init(), zI = !0);
}
function KB() {
  return ZB(), MN.get("eventBus");
}
const XE = nj(Xk);
function Dw() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const t = window.Core.windowAdapter.get("RuntimeContext");
    if (t) return t;
  }
  return window.RuntimeContext || null;
}
let ot = [], pr = null;
const ya = {
  updatesReceived: 0,
  readyReceived: 0,
  modeChanges: 0,
  errorsCount: 0
};
function q(t, e, n) {
  const i = n ? { data: n } : {};
  t === "error" ? XE.error(e, i) : t === "warn" ? XE.warn(e, i) : XE.debug(e, i);
}
const Cw = [
  ".dsd-footer",
  "footer",
  '[data-component="footer"]',
  "#footer-root"
];
function Eh() {
  for (let t = 0; t < Cw.length; t++) {
    const e = document.querySelector(Cw[t]);
    if (e) return e;
  }
  return null;
}
function RN(t) {
  const e = Eh();
  if (!e) return !1;
  e.setAttribute("data-kernel-mode", t.mode || "UNKNOWN"), e.setAttribute("data-kernel-ready", t.ready ? "true" : "false"), e.setAttribute("data-kernel-authenticated", t.authenticated ? "true" : "false");
  const n = e.className.split(" ");
  for (let i = n.length - 1; i >= 0; i--)
    n[i].indexOf("kernel-mode-") === 0 && e.classList.remove(n[i]);
  return e.classList.add(`kernel-mode-${t.mode || "UNKNOWN"}`), !0;
}
function wN(t) {
  q("warn", "Sistema em MAINTENANCE");
  const e = Eh();
  if (!e) return;
  e.classList.add("footer-maintenance");
  const n = e.querySelector(".footer-status-indicator, .dsd-footer__status");
  n && (n.setAttribute("data-status", "maintenance"), n.textContent = "Sistema em manutencao");
}
function PN(t) {
  q("error", "Sistema em FAILED");
  const e = Eh();
  if (!e) return;
  e.classList.add("footer-failed");
  const n = e.querySelector(".footer-status-indicator, .dsd-footer__status");
  n && (n.setAttribute("data-status", "failed"), n.textContent = "Erro no sistema");
}
function TN(t) {
  q("warn", "Sistema em DEGRADED");
  const e = Eh();
  if (!e) return;
  e.classList.add("footer-degraded");
  const n = e.querySelector(".footer-status-indicator, .dsd-footer__status");
  n && n.setAttribute("data-status", "degraded");
}
function WB(t) {
  const e = Eh();
  if (!e) return;
  e.classList.remove("footer-maintenance", "footer-failed", "footer-degraded");
  const n = e.querySelector(".footer-status-indicator, .dsd-footer__status");
  n && (n.setAttribute("data-status", "normal"), n.textContent = "");
}
function Mw(t) {
  try {
    const e = t && t.snapshot ? t.snapshot : null, n = t && t.trigger ? t.trigger : "unknown";
    if (!e) {
      q("warn", "RuntimeContext update sem snapshot");
      return;
    }
    ya.updatesReceived++;
    const i = pr;
    pr = e, q("info", "RuntimeContext updated", {
      trigger: n,
      mode: e.mode
    }), RN(e);
    const o = i ? i.mode : null;
    if (e.mode !== o)
      switch (ya.modeChanges++, e.mode) {
        case "MAINTENANCE":
          wN(e);
          break;
        case "FAILED":
          PN(e);
          break;
        case "DEGRADED":
          TN(e);
          break;
        case "NORMAL":
          WB(e);
          break;
      }
  } catch (e) {
    ya.errorsCount++, q("error", "handleRuntimeContextUpdated error", e.message);
  }
}
function Rw(t) {
  try {
    const e = t && t.snapshot ? t.snapshot : null;
    ya.readyReceived++, pr = e, q("info", "RuntimeContext ready", {
      mode: e ? e.mode : "N/A"
    }), e && (RN(e), e.mode === "MAINTENANCE" ? wN(e) : e.mode === "FAILED" ? PN(e) : e.mode === "DEGRADED" && TN(e));
  } catch (e) {
    ya.errorsCount++, q("error", "handleRuntimeContextReady error", e.message);
  }
}
function JB() {
  const t = KB();
  if (!t || !t.on) {
    q("warn", "EventBus nao disponivel via Ports - tentando RuntimeContext.subscribeWithReplay");
    const o = Dw();
    if (o && o.subscribeWithReplay) {
      const s = o.subscribeWithReplay((r, c) => {
        Mw({ snapshot: r, trigger: c ? c.trigger : "subscription" });
      }, { replayReady: !0 });
      return s && ot.push(s), q("info", "Usando RuntimeContext.subscribeWithReplay"), { ok: !0, method: "subscribeWithReplay" };
    }
    return { ok: !1, error: "EventBus not available" };
  }
  const e = t.on(aw.RUNTIME_CONTEXT_UPDATED, Mw), n = t.on(aw.RUNTIME_CONTEXT_READY, Rw);
  e && ot.push(e), n && ot.push(n), q("info", `RuntimeContext handlers configurados (${ot.length} listeners)`);
  const i = Dw();
  if (i && i.hasEmittedReady && i.hasEmittedReady()) {
    const o = i.getSnapshot();
    Rw({ snapshot: o }), q("info", "Replay do estado inicial executado");
  }
  return { ok: !0, listeners: ot.length };
}
function QB() {
  for (let t = 0; t < ot.length; t++)
    try {
      typeof ot[t] == "function" && ot[t]();
    } catch (e) {
      q("error", "Cleanup error", e.message);
    }
  ot = [], pr = null, q("info", "RuntimeContext handlers removidos");
}
function XB() {
  return {
    status: ot.length > 0 ? "HEALTHY" : "NOT_CONFIGURED",
    moduleId: Xk,
    version: CN,
    p0Enterprise: !0,
    portsInitialized: zI,
    listenersCount: ot.length,
    lastSnapshot: pr,
    metrics: Object.assign({}, ya),
    timestamp: Date.now()
  };
}
function NN() {
  return {
    moduleId: Xk,
    version: CN,
    configured: ot.length > 0,
    listenersCount: ot.length,
    metrics: Object.assign({}, ya),
    lastSnapshot: pr ? {
      mode: pr.mode,
      authenticated: pr.authenticated
    } : null
  };
}
const z = "14.1.0-P2-ENTERPRISE", an = "footer", $h = { MOUNTED: "mounted", ERROR: "error", UNMOUNTED: "unmounted", READY: "ready" }, SM = p({ moduleId: an }), ie = (t) => SM.get(t), tV = (t) => SM.inject(t), eV = () => SM.snapshot(), st = _o(an), D = { mountCount: 0, unmountCount: 0, routeChanges: 0, errors: 0, lastMountAt: null, lastActivity: null, configLoads: 0, readyEmitted: 0, runtimeContextSetup: !1 }, L = { eventBusConnected: !1, globalStateConnected: !1, orchestratorConnected: !1, routerGlobalConnected: !1, telemetryConnected: !1, lottieLoaded: !1, footerEventBusIsolated: !0, runtimeContextConnected: !1 }, Ih = () => {
  L.eventBusConnected = !!ie("eventBus"), L.globalStateConnected = !!ie("globalState"), L.orchestratorConnected = !!ie("orchestrator"), L.routerGlobalConnected = !!ie("router"), L.telemetryConnected = !!ie("telemetry"), L.footerEventBusIsolated = !0, L.runtimeContextConnected = D.runtimeContextSetup;
}, mm = (t) => t ? String(t).toUpperCase() === "HEALTHY" : !1, nV = (t) => t ? String(t).toUpperCase() !== "UNHEALTHY" : !0;
AB();
const Av = (t, e = {}) => {
  var n;
  D.lastActivity = Date.now();
  const i = ie("telemetry");
  (n = i == null ? void 0 : i.track) == null || n.call(i, `${an}:${t}`, { ...e, timestamp: Date.now() });
};
function M() {
  this._version = z, this._sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this._mounted = !1, this._destroyed = !1, this._ready = !1, this._config = null, this._lifecycle = new oe(), this._integrations = new R(), this._circuitBreaker = new K({ failureThreshold: 3, resetTimeout: 3e4 }), this._store = new sj(), this._telemetry = new T(), this._events = new w(), this._registry = new I(), this._announce = new un(), this._routerCleanup = null, this._currentRoute = null, this._footerEventBus = Qk(), this._guardsResult = null;
}
M.prototype.mount = function(t = "#footer-root") {
  var e, n;
  return this._mounted ? (st.warn("Already mounted"), (n = (e = this._telemetry) == null ? void 0 : e.warn) == null || n.call(e, "already-mounted", { containerSelector: t }), Promise.resolve()) : (OB(), Ih(), TB().then((i) => {
    var o;
    this._config = i, D.configLoads++;
    const s = this._buildConfig();
    return this._store.init(s), this._telemetry.init({ version: s.version, environment: s.environment, containerId: typeof t == "string" ? t : "element", debug: s.debug || !1 }), this._events.init(this._store, s), this._integrations.init(((o = this._config) == null ? void 0 : o.features) || {}), this._lifecycle.mount(t);
  }).then((i) => {
    if (!i.success) throw new Error(i.reason || "Mount failed");
    const o = i.container;
    st.info(`Container resolved source=${i.source} id=${i.containerId}`);
    const s = this._buildConfig();
    return this._circuitBreaker.execute(
      () => (o.innerHTML = cj(), Promise.resolve()),
      () => {
        o.innerHTML = '<footer class="dsd-footer dsd-footer--error">Footer unavailable</footer>';
      }
    ).then(() => {
      var r, c;
      this._events.attach(), (c = (r = this._announce) == null ? void 0 : r.init) == null || c.call(r, o);
      const l = o.querySelector(".dsd-footer");
      return this._events.setFooterElement(l), this._registry.mountAll(l, s, { store: this._store, telemetry: this._telemetry, eventBus: this._footerEventBus, globalEventBus: ie("eventBus"), globalState: ie("globalState"), orchestrator: ie("orchestrator"), router: ie("router") });
    }).then(() => {
      var r;
      const c = this._registry.getComponent("lottie-animation");
      L.lottieLoaded = ((r = c == null ? void 0 : c.isLoaded) == null ? void 0 : r.call(c)) || !1, this._setupRouterIntegration(), this._mounted = !0, D.mountCount++, D.lastMountAt = Date.now(), D.lastActivity = Date.now(), st.info(`Footer ${z} mounted successfully (2-bar layout, ISOLATED EventBus)`), Av("mounted", { containerId: i.containerId, source: i.source, layout: "two-bar" }), this._footerEventBus.emit($h.MOUNTED, { version: z, containerId: i.containerId, layout: "two-bar" }), this._telemetry.info("mounted", { containerId: i.containerId, source: i.source, config: { version: s.version, environment: s.environment, layout: "two-bar" } }), this._emitReady(i);
    });
  }).catch((i) => {
    throw D.errors++, st.error("Mount failed:", i.message), Av("error", { action: "mount", error: i.message }), this._footerEventBus.emit($h.ERROR, { action: "mount", error: i.message }), this._telemetry.error("mount-failed", { error: i.message, stack: i.stack }), i;
  }));
};
M.prototype._emitReady = function(t) {
  var e, n, i, o, s, r;
  const c = document.querySelector(".dsd-footer");
  this._guardsResult = qB(c), this._guardsResult.valid || st.warn("Guards validation failed:", this._guardsResult), this._ready = !0, D.readyEmitted++, this._footerEventBus.emit($h.READY, {
    version: z,
    containerId: t == null ? void 0 : t.containerId,
    layout: "two-bar",
    guards: this._guardsResult,
    timestamp: Date.now()
  });
  const l = ie("eventBus");
  l != null && l.emit && (l.emit(B.READY, {
    source: an,
    moduleId: vh.moduleId,
    regionId: vh.regionId,
    version: z,
    guards: ((e = this._guardsResult) == null ? void 0 : e.valid) || !1,
    timestamp: Date.now()
  }), st.info("FOOTER_EVENTS.READY emitted to global EventBus")), this._telemetry.info("ready", {
    online: this._store.state.online,
    sessionStart: this._store.state.sessionStart,
    lottieEnabled: (o = (i = (n = this._config) == null ? void 0 : n.brand) == null ? void 0 : i.animation) == null ? void 0 : o.enabled,
    guardsValid: (s = this._guardsResult) == null ? void 0 : s.valid
  }), Av("ready", { guards: (r = this._guardsResult) == null ? void 0 : r.valid });
  const u = JB();
  D.runtimeContextSetup = u.ok, L.runtimeContextConnected = u.ok, u.ok ? st.info("RuntimeContext handler configured") : st.warn("RuntimeContext handler failed:", u.error || "unknown");
};
M.prototype._setupSessionTimer = function() {
  var t;
  const e = document.getElementById("footer-session-value");
  if (!e) return;
  const n = ((t = this._store.state) == null ? void 0 : t.sessionStart) || Date.now(), i = () => {
    const s = Date.now() - n, r = Math.floor(s / 36e5), c = Math.floor(s % 36e5 / 6e4), l = Math.floor(s % 6e4 / 1e3);
    e.textContent = `${String(r).padStart(2, "0")}:${String(c).padStart(2, "0")}:${String(l).padStart(2, "0")}`;
  };
  i();
  const o = setInterval(i, 1e3);
  this._store.setTimer("session", o);
};
M.prototype._setupRouterIntegration = function() {
  const t = this._integrations.on($c.ROUTE_CHANGED, (n) => {
    n != null && n.route && (this._currentRoute = n.route, this._updateRouteDisplay(n.route), D.routeChanges++);
  });
  this._routerCleanup = t;
  const e = this._integrations.getCurrentRoute();
  e && (this._currentRoute = e, this._updateRouteDisplay(e)), st.info("Router integration setup");
};
M.prototype._updateRouteDisplay = (t) => {
  const e = document.getElementById("footer-current-route");
  if (e && t) {
    const n = t.title || t.path || "/";
    e.textContent = n, e.setAttribute("title", `Pagina atual: ${n}`);
  }
};
M.prototype._buildConfig = function() {
  var t, e, n, i, o, s, r, c;
  const l = ie("config") || {}, u = this._config || {};
  return {
    version: ((t = l.app) == null ? void 0 : t.version) || u.version || z,
    environment: ((e = l.app) == null ? void 0 : e.environment) || ((n = u.defaults) == null ? void 0 : n.environment) || "production",
    locale: ((i = l.app) == null ? void 0 : i.locale) || ((o = u.defaults) == null ? void 0 : o.locale) || "pt-BR",
    debug: ((s = l.app) == null ? void 0 : s.debug) || ((r = u.defaults) == null ? void 0 : r.debug) || !1,
    i18n: { ...u.i18n, ...(c = l.i18n) == null ? void 0 : c.footer },
    components: u.components || {},
    features: u.features || {},
    brand: u.brand || {},
    dock: u.dock || {},
    quickStatus: u.quickStatus || {},
    bottomBar: u.bottomBar || {},
    layout: u.layout || { type: "two-bar" }
  };
};
M.prototype.getCurrentRoute = function() {
  return this._currentRoute;
};
M.prototype.getOrchestratorState = function() {
  const t = this._registry.getComponent("status-orchestrator");
  return t != null && t.getState ? t.getState() : { preset: "default", status: "unknown" };
};
M.prototype.getStatus = function() {
  var t, e, n;
  const i = this._lifecycle.getStatus();
  return { ...this._store.getStatus(), version: this._version, sessionId: this._sessionId, mounted: this._mounted, ready: this._ready, layout: "two-bar", containerId: i.containerId, currentRoute: this._currentRoute, orchestratorState: this.getOrchestratorState(), lottieEnabled: (n = (e = (t = this._config) == null ? void 0 : t.brand) == null ? void 0 : e.animation) == null ? void 0 : n.enabled, guards: this._guardsResult, metrics: { ...D }, integrations: { ...L }, eventBusIsolation: "FULL", timestamp: Date.now() };
};
M.prototype.announce = function(t, e = "polite") {
  var n, i;
  (i = (n = this._announce) == null ? void 0 : n.announce) == null || i.call(n, t, e);
};
M.prototype.unmount = function() {
  var t, e, n, i;
  this._destroyed || (D.runtimeContextSetup && (QB(), D.runtimeContextSetup = !1, L.runtimeContextConnected = !1), this._routerCleanup && (this._routerCleanup(), this._routerCleanup = null), IB(), this._registry.destroyAll(), this._events.destroy(), this._store.destroy(), this._telemetry.destroy(), this._integrations.destroy(), (e = (t = this._circuitBreaker) == null ? void 0 : t.destroy) == null || e.call(t), (i = (n = this._announce) == null ? void 0 : n.destroy) == null || i.call(n), this._lifecycle.unmount(), this._mounted = !1, this._ready = !1, this._destroyed = !0, this._currentRoute = null, this._guardsResult = null, D.unmountCount++, Av("unmounted"), this._footerEventBus.emit($h.UNMOUNTED, { version: z }), st.info("Footer unmounted"));
};
M.prototype.getVersion = () => z;
M.prototype.getMetrics = () => ({
  ...D,
  ...EN()
});
M.prototype.getIntegrationsStatus = () => (Ih(), { ...L });
M.prototype.emitAction = (t, e = {}) => NM(t, e);
M.prototype.isReady = function() {
  return this._ready;
};
M.prototype.getGuardsResult = function() {
  return this._guardsResult;
};
M.prototype.setDebug = function(t) {
  var e, n, i, o, s, r, c, l, u, m, N, dn, co, ao, lo, uo;
  W2(t), (n = (e = this._store) == null ? void 0 : e.setDebug) == null || n.call(e, t), (o = (i = this._telemetry) == null ? void 0 : i.setDebug) == null || o.call(i, t), (r = (s = this._events) == null ? void 0 : s.setDebug) == null || r.call(s, t), (l = (c = this._registry) == null ? void 0 : c.setDebug) == null || l.call(c, t), (m = (u = this._lifecycle) == null ? void 0 : u.setDebug) == null || m.call(u, t), (dn = (N = this._integrations) == null ? void 0 : N.setDebug) == null || dn.call(N, t), (ao = (co = this._circuitBreaker) == null ? void 0 : co.setDebug) == null || ao.call(co, t), (uo = (lo = this._announce) == null ? void 0 : lo.setDebug) == null || uo.call(lo, t);
};
M.prototype.healthCheck = function() {
  var t, e, n, i, o, s, r, c, l, u, m, N, dn, co, ao, lo;
  Ih();
  const uo = ((e = (t = this._store) == null ? void 0 : t.healthCheck) == null ? void 0 : e.call(t)) || { status: "unknown" }, lm = ((i = (n = this._registry) == null ? void 0 : n.healthCheck) == null ? void 0 : i.call(n)) || { status: "unknown" }, Jl = ((s = (o = this._lifecycle) == null ? void 0 : o.healthCheck) == null ? void 0 : s.call(o)) || { status: "unknown" }, um = ((c = (r = this._integrations) == null ? void 0 : r.healthCheck) == null ? void 0 : c.call(r)) || { status: "unknown" }, Ql = ((u = (l = this._circuitBreaker) == null ? void 0 : l.healthCheck) == null ? void 0 : u.call(l)) || { status: "unknown" }, Xl = ((N = (m = this._footerEventBus) == null ? void 0 : m.healthCheck) == null ? void 0 : N.call(m)) || { status: "unknown" }, tu = ((co = (dn = this._events) == null ? void 0 : dn.healthCheck) == null ? void 0 : co.call(dn)) || { status: "unknown" }, bp = D.runtimeContextSetup ? XB() : { status: "NOT_CONFIGURED" }, hc = {
    mounted: this._mounted,
    ready: this._ready,
    notDestroyed: !this._destroyed,
    guardsValid: ((ao = this._guardsResult) == null ? void 0 : ao.valid) || !1,
    storeHealthy: mm(uo.status),
    registryHealthy: mm(lm.status),
    lifecycleHealthy: mm(Jl.status),
    integrationsHealthy: nV(um.status),
    circuitBreakerHealthy: mm(Ql.status),
    footerEventBusHealthy: mm(Xl.status),
    footerEventBusIsolated: Xl.isolation === "FULL",
    eventsIntentsReady: ((lo = tu.checks) == null ? void 0 : lo.intentsReady) || !1,
    abortControllerActive: DB(),
    eventBusConnected: L.eventBusConnected,
    runtimeContextConnected: L.runtimeContextConnected,
    online: typeof navigator < "u" ? navigator.onLine : !0,
    lowErrorRate: D.errors < D.mountCount * 0.1 || D.mountCount === 0
  }, eu = Object.values(hc).filter(Boolean).length, pc = Object.keys(hc).length;
  let nu = "HEALTHY";
  return eu < pc * 0.5 ? nu = "UNHEALTHY" : eu < pc && (nu = "DEGRADED"), { status: nu, score: `${eu}/${pc}`, checks: hc, integrations: L, guards: this._guardsResult, subsystems: { store: uo, registry: lm, lifecycle: Jl, integrations: um, circuitBreaker: Ql, footerEventBus: Xl, events: tu, runtimeContext: bp }, version: z, moduleId: an, layout: "two-bar", eventBusIsolation: "FULL", p1Spec: !0, timestamp: Date.now() };
};
M.prototype.info = function() {
  var t, e, n, i, o, s, r, c, l, u, m, N, dn, co, ao, lo, uo, lm, Jl, um, Ql, Xl, tu, bp, hc, eu, pc, nu;
  Ih();
  const XH = ((e = (t = this._lifecycle) == null ? void 0 : t.getStatus) == null ? void 0 : e.call(t)) || {};
  return {
    version: z,
    moduleId: an,
    debug: kj(),
    sessionId: this._sessionId,
    mounted: this._mounted,
    ready: this._ready,
    layout: "two-bar",
    eventBusIsolation: "FULL",
    p1Spec: !0,
    containerId: XH.containerId,
    currentRoute: this._currentRoute,
    orchestratorState: this.getOrchestratorState(),
    lottieEnabled: (o = (i = (n = this._config) == null ? void 0 : n.brand) == null ? void 0 : i.animation) == null ? void 0 : o.enabled,
    guards: this._guardsResult,
    identity: vh,
    config: { features: (s = this._config) == null ? void 0 : s.features, components: (r = this._config) != null && r.components ? Object.keys(this._config.components) : [], dock: ((u = (l = (c = this._config) == null ? void 0 : c.dock) == null ? void 0 : l.items) == null ? void 0 : u.length) || 0 },
    metrics: this.getMetrics(),
    integrations: L,
    healthCheck: this.healthCheck(),
    subsystems: { store: ((N = (m = this._store) == null ? void 0 : m.info) == null ? void 0 : N.call(m)) || null, telemetry: ((co = (dn = this._telemetry) == null ? void 0 : dn.info) == null ? void 0 : co.call(dn)) || null, events: ((lo = (ao = this._events) == null ? void 0 : ao.info) == null ? void 0 : lo.call(ao)) || null, registry: ((lm = (uo = this._registry) == null ? void 0 : uo.info) == null ? void 0 : lm.call(uo)) || null, lifecycle: ((um = (Jl = this._lifecycle) == null ? void 0 : Jl.info) == null ? void 0 : um.call(Jl)) || null, integrations: ((Xl = (Ql = this._integrations) == null ? void 0 : Ql.info) == null ? void 0 : Xl.call(Ql)) || null, circuitBreaker: ((bp = (tu = this._circuitBreaker) == null ? void 0 : tu.info) == null ? void 0 : bp.call(tu)) || null, announce: ((eu = (hc = this._announce) == null ? void 0 : hc.info) == null ? void 0 : eu.call(hc)) || null, footerEventBus: ((nu = (pc = this._footerEventBus) == null ? void 0 : pc.info) == null ? void 0 : nu.call(pc)) || null, runtimeContext: D.runtimeContextSetup ? NN() : null }
  };
};
let E = null;
const SN = (t = "#footer-root") => E != null && E._mounted ? (st.warn("Already mounted"), Promise.resolve()) : (E = new M(), E.mount(t)), LN = () => (E == null || E.unmount(), E = null, Promise.resolve()), AN = () => {
  var t;
  LN();
  const e = Qk();
  (t = e == null ? void 0 : e.clearAll) == null || t.call(e), NB(), st.info("Footer destroyed");
}, iV = () => {
  AN(), bB();
  for (const t of Object.keys(D))
    D[t] = typeof D[t] == "number" ? 0 : null;
  st.info("Footer reset complete");
}, oV = () => E, sV = () => z, zN = (t) => {
  var e;
  W2(t), (e = E == null ? void 0 : E.setDebug) == null || e.call(E, t);
}, UN = () => {
  var t;
  return ((t = E == null ? void 0 : E.getMetrics) == null ? void 0 : t.call(E)) || { ...D, ...EN() };
}, HN = () => (Ih(), { ...L }), jN = () => {
  var t;
  return ((t = E == null ? void 0 : E.healthCheck) == null ? void 0 : t.call(E)) || { status: "UNHEALTHY", version: z, moduleId: an, checks: { mounted: !1, ready: !1 } };
}, BN = () => {
  var t;
  return ((t = E == null ? void 0 : E.info) == null ? void 0 : t.call(E)) || { version: z, moduleId: an, mounted: !1, ready: !1, layout: "two-bar", eventBusIsolation: "FULL", p1Spec: !0, identity: vh, metrics: { ...D } };
}, VN = () => {
  var t;
  return ((t = E == null ? void 0 : E.isReady) == null ? void 0 : t.call(E)) || !1;
}, xN = () => {
  var t;
  return ((t = E == null ? void 0 : E.getGuardsResult) == null ? void 0 : t.call(E)) || null;
}, GN = Qk(), rV = (t, e, n) => GN.on(t, e, n), cV = (t, e) => GN.off(t, e), HJ = z, aV = { mount: SN, unmount: LN, destroy: AN, reset: iV, getFooterInstance: oV, getVersion: sV, setDebug: zN, getMetrics: UN, getIntegrationsStatus: HN, healthCheck: jN, info: BN, isReady: VN, getGuardsResult: xN, on: rV, off: cV, emitGlobalAction: NM, FOOTER_LOCAL_EVENTS: $h, VERSION: z, MODULE_ID: an, injectPorts: tV, getPorts: eV, FOOTER_IDENTITY: vh };
tj() ? (uw("GLOBAL_EXPOSURE_BLOCKED", { module: an, target: "setupAutoInit", context: "module-init" }), uw("GLOBAL_EXPOSURE_BLOCKED", { module: an, target: "setupDevTools", context: "module-init" })) : (jB(SN, z), BB(aV));
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footer = {
  getInstance: () => E,
  getVersion: () => z,
  info: () => BN(),
  healthCheck: () => jN(),
  getMetrics: () => UN(),
  getIntegrationsStatus: () => HN(),
  isReady: () => VN(),
  getGuardsResult: () => xN(),
  setDebug: (t) => zN(t),
  getEventBus: () => Qk(),
  emitAction: (t, e) => NM(t, e),
  runtimeContext: () => NN()
});
const ev = { id: "dashboard", area: "footer", label: "dashboard", icon: "dashboard", kind: "navigation" };
d.ACTION;
const UI = { actionId: "footer:dashboard", meta: {} }, ww = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  "pie-chart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>',
  "trending-up": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  "credit-card": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>',
  "hard-drive": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
  termos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  privacidade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  lgpd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
  language: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>'
};
function $(t) {
  return ww[t] || ww.default;
}
function lV(t = {}) {
  const { id: e = "dashboard", label: n = "Dashboard", icon: i = "dashboard", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const LM = "footer-buttons-shared-events", YN = p({ moduleId: LM });
let Pw = !1;
function FN() {
  Pw || (YN.init(), Pw = !0);
}
function uV(t) {
  return FN(), YN.get(t);
}
const im = _o(LM);
function AM() {
  FN();
  const t = uV("eventBus");
  if (t) return t;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const e = window.Core.windowAdapter.get("EventBus");
    if (e) return e;
  }
  return im.error("EventBus not available via Ports or Core.windowAdapter"), null;
}
function dV(t, e, n) {
  n === void 0 && (n = {});
  let i = AM();
  if (!i || !i.emit)
    return im.error("Cannot emit FOOTER_BUTTON_CLICK - EventBus unavailable"), !1;
  let o = {
    buttonId: t,
    trigger: e || "trigger:footer:" + t,
    timestamp: Date.now(),
    meta: Object.assign({ source: "footer" }, n)
  };
  return i.emit(d.FOOTER_BUTTON_CLICK, o), im.debug("FOOTER_BUTTON_CLICK emitted: " + t), !0;
}
function mV(t, e) {
  let n = AM();
  if (n && n.emit && n.emit($c.NAVIGATE, {
    path: t,
    options: { replace: !1 },
    source: e || LM,
    meta: { origin: "footer", reason: "footer-action" },
    timestamp: Date.now()
  }), typeof window < "u" && t) {
    const i = t.charAt(0) === "#" ? t : "#" + t;
    window.location.hash !== i && (window.location.hash = i, im.debug("Navigation fallback applied: " + i));
  }
  return !0;
}
function Tw(t) {
  if (!t || t.indexOf("footer:") !== 0) return null;
  let e = t.replace("footer:", "");
  return e === "logout" ? null : e === "settings" ? "#/configuracoes" : e === "dashboard" ? "#/home" : e === "search" ? "#/busca" : e === "bell" ? "#/notificacoes" : e === "users" ? "#/rh-pessoas" : e === "analytics" ? "#/relatorios" : e === "lgpd" || e === "privacidade" || e === "termos" ? null : e === "language" ? "#/status-language" : e === "trending-up" ? "#/status-trending" : "#/status-" + e;
}
function y(t, e, n) {
  n === void 0 && (n = {});
  let i = AM();
  if (!i || !i.emit) {
    im.error("Cannot emit ui:action - EventBus unavailable");
    const c = Tw(t);
    if (c && typeof window < "u") {
      const l = c.charAt(0) === "#" ? c : "#" + c;
      return window.location.hash = l, im.debug("Direct navigation fallback (no EventBus): " + l), !0;
    }
    return !1;
  }
  const o = t.indexOf("footer:") === 0 ? t.replace("footer:", "") : t;
  dV(o, "trigger:footer:" + o, n);
  const s = Tw(t);
  if (s)
    return mV(s, e), !0;
  const r = { actionId: t, source: e, timestamp: Date.now(), meta: n };
  return i.emit(d.ACTION, r), !0;
}
B.BUTTON_MOUNTED, B.BUTTON_CLICKED, B.BUTTON_UNMOUNTED;
function _(t, e, n, i = []) {
  if (!t || !e || !n) return null;
  t.addEventListener(e, n);
  const o = () => {
    t.removeEventListener(e, n);
  };
  return i.push(o), o;
}
function k(t, e, n = []) {
  return !t || !e ? null : _(t, "keydown", (o) => {
    (o.key === "Enter" || o.key === " ") && (o.preventDefault(), e(o));
  }, n);
}
function b(t) {
  Array.isArray(t) && (t.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), t.length = 0);
}
const fV = "footer-button-dashboard-events";
function hV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      UI.actionId,
      fV,
      {
        label: ev.label,
        icon: ev.icon,
        kind: ev.kind,
        ...UI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const qN = "footer-button-dashboard-tracker", pV = p({ moduleId: qN });
function gV(t) {
  return pV.get(t);
}
function Op(t, e) {
  e === void 0 && (e = {});
  const n = gV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: qN, event: t, data: e, timestamp: Date.now() });
}
const zv = "1.0.1-P18EC", Uv = "footer/components/buttons/dashboard";
class zM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...ev };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Op("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = lV({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, hV(this._element, this._cleanups, () => {
      Op("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Op("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Op("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: zv, moduleId: Uv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: zv, moduleId: Uv, emits: [d.ACTION], actionPayload: UI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let tI = null;
function $l() {
  return tI || (tI = new zM()), tI;
}
function ZN() {
  return new zM();
}
const KN = (t) => $l().init(t), WN = (t, e) => $l().mount(t, e), JN = () => $l().unmount(), QN = () => $l().healthCheck(), XN = () => $l().info(), _V = { DashboardButton: zM, getInstance: $l, createDashboardButton: ZN, init: KN, mount: WN, unmount: JN, healthCheck: QN, info: XN, VERSION: zv, MODULE_ID: Uv }, vV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Uv,
  VERSION: zv,
  createDashboardButton: ZN,
  default: _V,
  getInstance: $l,
  healthCheck: QN,
  info: XN,
  init: KN,
  mount: WN,
  unmount: JN
}, Symbol.toStringTag, { value: "Module" })), nv = { id: "analytics", area: "footer", label: "analytics", icon: "analytics", kind: "navigation" };
d.ACTION;
const HI = { actionId: "footer:analytics", meta: {} };
function $V(t = {}) {
  const { id: e = "analytics", label: n = "Analytics", icon: i = "analytics", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const yV = "footer-button-analytics-events";
function kV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      HI.actionId,
      yV,
      {
        label: nv.label,
        icon: nv.icon,
        kind: nv.kind,
        ...HI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const tS = "footer-button-analytics-tracker", bV = p({ moduleId: tS });
function EV(t) {
  return bV.get(t);
}
function Dp(t, e) {
  e === void 0 && (e = {});
  const n = EV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: tS, event: t, data: e, timestamp: Date.now() });
}
const Hv = "1.0.1-P18EC", jv = "footer/components/buttons/analytics";
class UM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...nv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Dp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = $V({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, kV(this._element, this._cleanups, () => {
      Dp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Dp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Dp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Hv, moduleId: jv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Hv, moduleId: jv, emits: [d.ACTION], actionPayload: HI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let eI = null;
function yl() {
  return eI || (eI = new UM()), eI;
}
function eS() {
  return new UM();
}
const nS = (t) => yl().init(t), iS = (t, e) => yl().mount(t, e), oS = () => yl().unmount(), sS = () => yl().healthCheck(), rS = () => yl().info(), IV = { AnalyticsButton: UM, getInstance: yl, createAnalyticsButton: eS, init: nS, mount: iS, unmount: oS, healthCheck: sS, info: rS, VERSION: Hv, MODULE_ID: jv }, OV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: jv,
  VERSION: Hv,
  createAnalyticsButton: eS,
  default: IV,
  getInstance: yl,
  healthCheck: sS,
  info: rS,
  init: nS,
  mount: iS,
  unmount: oS
}, Symbol.toStringTag, { value: "Module" })), iv = { id: "pie-chart", area: "footer", label: "pie-chart", icon: "pie-chart", kind: "navigation" };
d.ACTION;
const jI = { actionId: "footer:pie-chart", meta: {} };
function DV(t = {}) {
  const { id: e = "pie-chart", label: n = "Gráfico", icon: i = "pie-chart", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const CV = "footer-button-pie-chart-events";
function MV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      jI.actionId,
      CV,
      {
        label: iv.label,
        icon: iv.icon,
        kind: iv.kind,
        ...jI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const cS = "footer-button-pie-chart-tracker", RV = p({ moduleId: cS });
function wV(t) {
  return RV.get(t);
}
function Cp(t, e) {
  e === void 0 && (e = {});
  const n = wV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: cS, event: t, data: e, timestamp: Date.now() });
}
const Bv = "1.0.1-P18EC", Vv = "footer/components/buttons/pie-chart";
class HM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...iv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Cp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = DV({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, MV(this._element, this._cleanups, () => {
      Cp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Cp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Cp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Bv, moduleId: Vv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Bv, moduleId: Vv, emits: [d.ACTION], actionPayload: jI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let nI = null;
function kl() {
  return nI || (nI = new HM()), nI;
}
function aS() {
  return new HM();
}
const lS = (t) => kl().init(t), uS = (t, e) => kl().mount(t, e), dS = () => kl().unmount(), mS = () => kl().healthCheck(), fS = () => kl().info(), PV = { PieChartButton: HM, getInstance: kl, createPieChartButton: aS, init: lS, mount: uS, unmount: dS, healthCheck: mS, info: fS, VERSION: Bv, MODULE_ID: Vv }, TV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Vv,
  VERSION: Bv,
  createPieChartButton: aS,
  default: PV,
  getInstance: kl,
  healthCheck: mS,
  info: fS,
  init: lS,
  mount: uS,
  unmount: dS
}, Symbol.toStringTag, { value: "Module" })), ov = { id: "trending-up", area: "footer", label: "trending-up", icon: "trending-up", kind: "navigation" };
d.ACTION;
const BI = { actionId: "footer:trending-up", meta: {} };
function NV(t = {}) {
  const { id: e = "trending-up", label: n = "Tendências", icon: i = "trending-up", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const SV = "footer-button-trending-up-events";
function LV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      BI.actionId,
      SV,
      {
        label: ov.label,
        icon: ov.icon,
        kind: ov.kind,
        ...BI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const hS = "footer-button-trending-up-tracker", AV = p({ moduleId: hS });
function zV(t) {
  return AV.get(t);
}
function Mp(t, e) {
  e === void 0 && (e = {});
  const n = zV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: hS, event: t, data: e, timestamp: Date.now() });
}
const xv = "1.0.1-P18EC", Gv = "footer/components/buttons/trending-up";
class jM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...ov };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Mp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = NV({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, LV(this._element, this._cleanups, () => {
      Mp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Mp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Mp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: xv, moduleId: Gv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: xv, moduleId: Gv, emits: [d.ACTION], actionPayload: BI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let iI = null;
function bl() {
  return iI || (iI = new jM()), iI;
}
function pS() {
  return new jM();
}
const gS = (t) => bl().init(t), _S = (t, e) => bl().mount(t, e), vS = () => bl().unmount(), $S = () => bl().healthCheck(), yS = () => bl().info(), UV = { TrendingUpButton: jM, getInstance: bl, createTrendingUpButton: pS, init: gS, mount: _S, unmount: vS, healthCheck: $S, info: yS, VERSION: xv, MODULE_ID: Gv }, HV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Gv,
  VERSION: xv,
  createTrendingUpButton: pS,
  default: UV,
  getInstance: bl,
  healthCheck: $S,
  info: yS,
  init: gS,
  mount: _S,
  unmount: vS
}, Symbol.toStringTag, { value: "Module" })), sv = { id: "users", area: "footer", label: "users", icon: "users", kind: "navigation" };
d.ACTION;
const VI = { actionId: "footer:users", meta: {} };
function jV(t = {}) {
  const { id: e = "users", label: n = "Usuários", icon: i = "users", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const BV = "footer-button-users-events";
function VV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      VI.actionId,
      BV,
      {
        label: sv.label,
        icon: sv.icon,
        kind: sv.kind,
        ...VI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const kS = "footer-button-users-tracker", xV = p({ moduleId: kS });
function GV(t) {
  return xV.get(t);
}
function Rp(t, e) {
  e === void 0 && (e = {});
  const n = GV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: kS, event: t, data: e, timestamp: Date.now() });
}
const Yv = "1.0.1-P18EC", Fv = "footer/components/buttons/users";
class BM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...sv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Rp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = jV({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, VV(this._element, this._cleanups, () => {
      Rp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Rp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Rp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Yv, moduleId: Fv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Yv, moduleId: Fv, emits: [d.ACTION], actionPayload: VI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let oI = null;
function El() {
  return oI || (oI = new BM()), oI;
}
function bS() {
  return new BM();
}
const ES = (t) => El().init(t), IS = (t, e) => El().mount(t, e), OS = () => El().unmount(), DS = () => El().healthCheck(), CS = () => El().info(), YV = { UsersButton: BM, getInstance: El, createUsersButton: bS, init: ES, mount: IS, unmount: OS, healthCheck: DS, info: CS, VERSION: Yv, MODULE_ID: Fv }, FV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Fv,
  VERSION: Yv,
  createUsersButton: bS,
  default: YV,
  getInstance: El,
  healthCheck: DS,
  info: CS,
  init: ES,
  mount: IS,
  unmount: OS
}, Symbol.toStringTag, { value: "Module" })), rv = { id: "settings", area: "footer", label: "settings", icon: "settings", kind: "navigation" };
d.ACTION;
const xI = { actionId: "footer:settings", meta: {} };
function qV(t = {}) {
  const { id: e = "settings", label: n = "Configurações", icon: i = "settings", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const ZV = "footer-button-settings-events";
function KV(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      xI.actionId,
      ZV,
      {
        label: rv.label,
        icon: rv.icon,
        kind: rv.kind,
        ...xI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const MS = "footer-button-settings-tracker", WV = p({ moduleId: MS });
function JV(t) {
  return WV.get(t);
}
function wp(t, e) {
  e === void 0 && (e = {});
  const n = JV("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: MS, event: t, data: e, timestamp: Date.now() });
}
const qv = "1.0.1-P18EC", Zv = "footer/components/buttons/settings";
class VM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...rv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return wp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = qV({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, KV(this._element, this._cleanups, () => {
      wp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, wp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, wp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: qv, moduleId: Zv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: qv, moduleId: Zv, emits: [d.ACTION], actionPayload: xI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let sI = null;
function Il() {
  return sI || (sI = new VM()), sI;
}
function RS() {
  return new VM();
}
const wS = (t) => Il().init(t), PS = (t, e) => Il().mount(t, e), TS = () => Il().unmount(), NS = () => Il().healthCheck(), SS = () => Il().info(), QV = { SettingsButton: VM, getInstance: Il, createSettingsButton: RS, init: wS, mount: PS, unmount: TS, healthCheck: NS, info: SS, VERSION: qv, MODULE_ID: Zv }, XV = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Zv,
  VERSION: qv,
  createSettingsButton: RS,
  default: QV,
  getInstance: Il,
  healthCheck: NS,
  info: SS,
  init: wS,
  mount: PS,
  unmount: TS
}, Symbol.toStringTag, { value: "Module" })), cv = { id: "database", area: "footer", label: "database", icon: "database", kind: "navigation" };
d.ACTION;
const GI = { actionId: "footer:database", meta: {} };
function tx(t = {}) {
  const { id: e = "database", label: n = "Database", icon: i = "database", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const ex = "footer-button-database-events";
function nx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      GI.actionId,
      ex,
      {
        label: cv.label,
        icon: cv.icon,
        kind: cv.kind,
        ...GI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const LS = "footer-button-database-tracker", ix = p({ moduleId: LS });
function ox(t) {
  return ix.get(t);
}
function Pp(t, e) {
  e === void 0 && (e = {});
  const n = ox("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: LS, event: t, data: e, timestamp: Date.now() });
}
const Kv = "1.0.1-P18EC", Wv = "footer/components/buttons/database";
class xM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...cv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Pp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = tx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, nx(this._element, this._cleanups, () => {
      Pp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Pp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Pp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Kv, moduleId: Wv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Kv, moduleId: Wv, emits: [d.ACTION], actionPayload: GI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let rI = null;
function Ol() {
  return rI || (rI = new xM()), rI;
}
function AS() {
  return new xM();
}
const zS = (t) => Ol().init(t), US = (t, e) => Ol().mount(t, e), HS = () => Ol().unmount(), jS = () => Ol().healthCheck(), BS = () => Ol().info(), sx = { DatabaseButton: xM, getInstance: Ol, createDatabaseButton: AS, init: zS, mount: US, unmount: HS, healthCheck: jS, info: BS, VERSION: Kv, MODULE_ID: Wv }, rx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Wv,
  VERSION: Kv,
  createDatabaseButton: AS,
  default: sx,
  getInstance: Ol,
  healthCheck: jS,
  info: BS,
  init: zS,
  mount: US,
  unmount: HS
}, Symbol.toStringTag, { value: "Module" })), av = { id: "server", area: "footer", label: "server", icon: "server", kind: "navigation" };
d.ACTION;
const YI = { actionId: "footer:server", meta: {} };
function cx(t = {}) {
  const { id: e = "server", label: n = "Servidor", icon: i = "server", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const ax = "footer-button-server-events";
function lx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      YI.actionId,
      ax,
      {
        label: av.label,
        icon: av.icon,
        kind: av.kind,
        ...YI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const VS = "footer-button-server-tracker", ux = p({ moduleId: VS });
function dx(t) {
  return ux.get(t);
}
function Tp(t, e) {
  e === void 0 && (e = {});
  const n = dx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: VS, event: t, data: e, timestamp: Date.now() });
}
const Jv = "1.0.1-P18EC", Qv = "footer/components/buttons/server";
class GM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...av };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Tp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = cx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, lx(this._element, this._cleanups, () => {
      Tp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Tp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Tp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Jv, moduleId: Qv };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Jv, moduleId: Qv, emits: [d.ACTION], actionPayload: YI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let cI = null;
function Dl() {
  return cI || (cI = new GM()), cI;
}
function xS() {
  return new GM();
}
const GS = (t) => Dl().init(t), YS = (t, e) => Dl().mount(t, e), FS = () => Dl().unmount(), qS = () => Dl().healthCheck(), ZS = () => Dl().info(), mx = { ServerButton: GM, getInstance: Dl, createServerButton: xS, init: GS, mount: YS, unmount: FS, healthCheck: qS, info: ZS, VERSION: Jv, MODULE_ID: Qv }, fx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Qv,
  VERSION: Jv,
  createServerButton: xS,
  default: mx,
  getInstance: Dl,
  healthCheck: qS,
  info: ZS,
  init: GS,
  mount: YS,
  unmount: FS
}, Symbol.toStringTag, { value: "Module" })), lv = { id: "cloud", area: "footer", label: "cloud", icon: "cloud", kind: "navigation" };
d.ACTION;
const FI = { actionId: "footer:cloud", meta: {} };
function hx(t = {}) {
  const { id: e = "cloud", label: n = "Cloud", icon: i = "cloud", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const px = "footer-button-cloud-events";
function gx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      FI.actionId,
      px,
      {
        label: lv.label,
        icon: lv.icon,
        kind: lv.kind,
        ...FI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const KS = "footer-button-cloud-tracker", _x = p({ moduleId: KS });
function vx(t) {
  return _x.get(t);
}
function Np(t, e) {
  e === void 0 && (e = {});
  const n = vx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: KS, event: t, data: e, timestamp: Date.now() });
}
const Xv = "1.0.1-P18EC", t$ = "footer/components/buttons/cloud";
class YM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...lv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Np("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = hx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, gx(this._element, this._cleanups, () => {
      Np("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Np("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Np("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Xv, moduleId: t$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Xv, moduleId: t$, emits: [d.ACTION], actionPayload: FI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let aI = null;
function Cl() {
  return aI || (aI = new YM()), aI;
}
function WS() {
  return new YM();
}
const JS = (t) => Cl().init(t), QS = (t, e) => Cl().mount(t, e), XS = () => Cl().unmount(), tL = () => Cl().healthCheck(), eL = () => Cl().info(), $x = { CloudButton: YM, getInstance: Cl, createCloudButton: WS, init: JS, mount: QS, unmount: XS, healthCheck: tL, info: eL, VERSION: Xv, MODULE_ID: t$ }, yx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: t$,
  VERSION: Xv,
  createCloudButton: WS,
  default: $x,
  getInstance: Cl,
  healthCheck: tL,
  info: eL,
  init: JS,
  mount: QS,
  unmount: XS
}, Symbol.toStringTag, { value: "Module" })), uv = { id: "zap", area: "footer", label: "zap", icon: "zap", kind: "navigation" };
d.ACTION;
const qI = { actionId: "footer:zap", meta: {} };
function kx(t = {}) {
  const { id: e = "zap", label: n = "Zap", icon: i = "zap", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const bx = "footer-button-zap-events";
function Ex(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      qI.actionId,
      bx,
      {
        label: uv.label,
        icon: uv.icon,
        kind: uv.kind,
        ...qI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const nL = "footer-button-zap-tracker", Ix = p({ moduleId: nL });
function Ox(t) {
  return Ix.get(t);
}
function Sp(t, e) {
  e === void 0 && (e = {});
  const n = Ox("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: nL, event: t, data: e, timestamp: Date.now() });
}
const e$ = "1.0.1-P18EC", n$ = "footer/components/buttons/zap";
class FM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...uv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Sp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = kx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, Ex(this._element, this._cleanups, () => {
      Sp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Sp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Sp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: e$, moduleId: n$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: e$, moduleId: n$, emits: [d.ACTION], actionPayload: qI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let lI = null;
function Ml() {
  return lI || (lI = new FM()), lI;
}
function iL() {
  return new FM();
}
const oL = (t) => Ml().init(t), sL = (t, e) => Ml().mount(t, e), rL = () => Ml().unmount(), cL = () => Ml().healthCheck(), aL = () => Ml().info(), Dx = { ZapButton: FM, getInstance: Ml, createZapButton: iL, init: oL, mount: sL, unmount: rL, healthCheck: cL, info: aL, VERSION: e$, MODULE_ID: n$ }, Cx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: n$,
  VERSION: e$,
  createZapButton: iL,
  default: Dx,
  getInstance: Ml,
  healthCheck: cL,
  info: aL,
  init: oL,
  mount: sL,
  unmount: rL
}, Symbol.toStringTag, { value: "Module" })), dv = { id: "calendar", area: "footer", label: "calendar", icon: "calendar", kind: "navigation" };
d.ACTION;
const ZI = { actionId: "footer:calendar", meta: {} };
function Mx(t = {}) {
  const { id: e = "calendar", label: n = "Calendário", icon: i = "calendar", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const Rx = "footer-button-calendar-events";
function wx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      ZI.actionId,
      Rx,
      {
        label: dv.label,
        icon: dv.icon,
        kind: dv.kind,
        ...ZI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const lL = "footer-button-calendar-tracker", Px = p({ moduleId: lL });
function Tx(t) {
  return Px.get(t);
}
function Lp(t, e) {
  e === void 0 && (e = {});
  const n = Tx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: lL, event: t, data: e, timestamp: Date.now() });
}
const i$ = "1.0.1-P18EC", o$ = "footer/components/buttons/calendar";
class qM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...dv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Lp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = Mx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, wx(this._element, this._cleanups, () => {
      Lp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Lp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Lp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: i$, moduleId: o$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: i$, moduleId: o$, emits: [d.ACTION], actionPayload: ZI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let uI = null;
function Rl() {
  return uI || (uI = new qM()), uI;
}
function uL() {
  return new qM();
}
const dL = (t) => Rl().init(t), mL = (t, e) => Rl().mount(t, e), fL = () => Rl().unmount(), hL = () => Rl().healthCheck(), pL = () => Rl().info(), Nx = { CalendarButton: qM, getInstance: Rl, createCalendarButton: uL, init: dL, mount: mL, unmount: fL, healthCheck: hL, info: pL, VERSION: i$, MODULE_ID: o$ }, Sx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: o$,
  VERSION: i$,
  createCalendarButton: uL,
  default: Nx,
  getInstance: Rl,
  healthCheck: hL,
  info: pL,
  init: dL,
  mount: mL,
  unmount: fL
}, Symbol.toStringTag, { value: "Module" })), mv = { id: "mail", area: "footer", label: "mail", icon: "mail", kind: "navigation" };
d.ACTION;
const KI = { actionId: "footer:mail", meta: {} };
function Lx(t = {}) {
  const { id: e = "mail", label: n = "Email", icon: i = "mail", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const Ax = "footer-button-mail-events";
function zx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      KI.actionId,
      Ax,
      {
        label: mv.label,
        icon: mv.icon,
        kind: mv.kind,
        ...KI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const gL = "footer-button-mail-tracker", Ux = p({ moduleId: gL });
function Hx(t) {
  return Ux.get(t);
}
function Ap(t, e) {
  e === void 0 && (e = {});
  const n = Hx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: gL, event: t, data: e, timestamp: Date.now() });
}
const s$ = "1.0.1-P18EC", r$ = "footer/components/buttons/mail";
class ZM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...mv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Ap("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = Lx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, zx(this._element, this._cleanups, () => {
      Ap("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Ap("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Ap("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: s$, moduleId: r$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: s$, moduleId: r$, emits: [d.ACTION], actionPayload: KI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let dI = null;
function wl() {
  return dI || (dI = new ZM()), dI;
}
function _L() {
  return new ZM();
}
const vL = (t) => wl().init(t), $L = (t, e) => wl().mount(t, e), yL = () => wl().unmount(), kL = () => wl().healthCheck(), bL = () => wl().info(), jx = { MailButton: ZM, getInstance: wl, createMailButton: _L, init: vL, mount: $L, unmount: yL, healthCheck: kL, info: bL, VERSION: s$, MODULE_ID: r$ }, Bx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: r$,
  VERSION: s$,
  createMailButton: _L,
  default: jx,
  getInstance: wl,
  healthCheck: kL,
  info: bL,
  init: vL,
  mount: $L,
  unmount: yL
}, Symbol.toStringTag, { value: "Module" })), fv = {
  id: "bell",
  area: "footer",
  label: "bell",
  icon: "bell",
  kind: "navigation"
};
d.ACTION;
const WI = {
  actionId: "footer:bell",
  meta: {}
};
function Vx(t = {}) {
  const { id: e = "bell", label: n = "Notificações", icon: i = "bell", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const xx = "footer-button-bell-events";
function Gx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      WI.actionId,
      xx,
      {
        label: fv.label,
        icon: fv.icon,
        kind: fv.kind,
        ...WI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const EL = "footer-button-bell-tracker", Yx = p({ moduleId: EL });
function Fx(t) {
  return Yx.get(t);
}
function zp(t, e) {
  e === void 0 && (e = {});
  const n = Fx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: EL, event: t, data: e, timestamp: Date.now() });
}
const c$ = "1.0.1-P18EC", a$ = "footer/components/buttons/bell";
class KM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...fv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return zp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = Vx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, Gx(this._element, this._cleanups, () => {
      zp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, zp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, zp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: c$, moduleId: a$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: c$, moduleId: a$, emits: [d.ACTION], actionPayload: WI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let mI = null;
function Pl() {
  return mI || (mI = new KM()), mI;
}
function IL() {
  return new KM();
}
const OL = (t) => Pl().init(t), DL = (t, e) => Pl().mount(t, e), CL = () => Pl().unmount(), ML = () => Pl().healthCheck(), RL = () => Pl().info(), qx = { BellButton: KM, getInstance: Pl, createBellButton: IL, init: OL, mount: DL, unmount: CL, healthCheck: ML, info: RL, VERSION: c$, MODULE_ID: a$ }, Zx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: a$,
  VERSION: c$,
  createBellButton: IL,
  default: qx,
  getInstance: Pl,
  healthCheck: ML,
  info: RL,
  init: OL,
  mount: DL,
  unmount: CL
}, Symbol.toStringTag, { value: "Module" })), hv = { id: "folder", area: "footer", label: "folder", icon: "folder", kind: "navigation" };
d.ACTION;
const JI = { actionId: "footer:folder", meta: {} };
function Kx(t = {}) {
  const { id: e = "folder", label: n = "Pasta", icon: i = "folder", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const Wx = "footer-button-folder-events";
function Jx(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      JI.actionId,
      Wx,
      {
        label: hv.label,
        icon: hv.icon,
        kind: hv.kind,
        ...JI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const wL = "footer-button-folder-tracker", Qx = p({ moduleId: wL });
function Xx(t) {
  return Qx.get(t);
}
function Up(t, e) {
  e === void 0 && (e = {});
  const n = Xx("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: wL, event: t, data: e, timestamp: Date.now() });
}
const l$ = "1.0.1-P18EC", u$ = "footer/components/buttons/folder";
class WM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...hv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Up("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = Kx({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, Jx(this._element, this._cleanups, () => {
      Up("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Up("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Up("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: l$, moduleId: u$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: l$, moduleId: u$, emits: [d.ACTION], actionPayload: JI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let fI = null;
function Tl() {
  return fI || (fI = new WM()), fI;
}
function PL() {
  return new WM();
}
const TL = (t) => Tl().init(t), NL = (t, e) => Tl().mount(t, e), SL = () => Tl().unmount(), LL = () => Tl().healthCheck(), AL = () => Tl().info(), t4 = { FolderButton: WM, getInstance: Tl, createFolderButton: PL, init: TL, mount: NL, unmount: SL, healthCheck: LL, info: AL, VERSION: l$, MODULE_ID: u$ }, e4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: u$,
  VERSION: l$,
  createFolderButton: PL,
  default: t4,
  getInstance: Tl,
  healthCheck: LL,
  info: AL,
  init: TL,
  mount: NL,
  unmount: SL
}, Symbol.toStringTag, { value: "Module" })), pv = { id: "credit-card", area: "footer", label: "credit-card", icon: "credit-card", kind: "navigation" };
d.ACTION;
const QI = { actionId: "footer:credit-card", meta: {} };
function n4(t = {}) {
  const { id: e = "credit-card", label: n = "Cartão", icon: i = "credit-card", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const i4 = "footer-button-credit-card-events";
function o4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      QI.actionId,
      i4,
      {
        label: pv.label,
        icon: pv.icon,
        kind: pv.kind,
        ...QI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const zL = "footer-button-credit-card-tracker", s4 = p({ moduleId: zL });
function r4(t) {
  return s4.get(t);
}
function Hp(t, e) {
  e === void 0 && (e = {});
  const n = r4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: zL, event: t, data: e, timestamp: Date.now() });
}
const d$ = "1.0.1-P18EC", m$ = "footer/components/buttons/credit-card";
class JM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...pv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Hp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = n4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, o4(this._element, this._cleanups, () => {
      Hp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Hp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Hp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: d$, moduleId: m$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: d$, moduleId: m$, emits: [d.ACTION], actionPayload: QI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let hI = null;
function Nl() {
  return hI || (hI = new JM()), hI;
}
function UL() {
  return new JM();
}
const HL = (t) => Nl().init(t), jL = (t, e) => Nl().mount(t, e), BL = () => Nl().unmount(), VL = () => Nl().healthCheck(), xL = () => Nl().info(), c4 = { CreditCardButton: JM, getInstance: Nl, createCreditCardButton: UL, init: HL, mount: jL, unmount: BL, healthCheck: VL, info: xL, VERSION: d$, MODULE_ID: m$ }, a4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: m$,
  VERSION: d$,
  createCreditCardButton: UL,
  default: c4,
  getInstance: Nl,
  healthCheck: VL,
  info: xL,
  init: HL,
  mount: jL,
  unmount: BL
}, Symbol.toStringTag, { value: "Module" })), gv = { id: "security", area: "footer", label: "security", icon: "security", kind: "navigation" };
d.ACTION;
const XI = { actionId: "footer:security", meta: {} };
function l4(t = {}) {
  const { id: e = "security", label: n = "Segurança", icon: i = "security", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const u4 = "footer-button-security-events";
function d4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      XI.actionId,
      u4,
      {
        label: gv.label,
        icon: gv.icon,
        kind: gv.kind,
        ...XI.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const GL = "footer-button-security-tracker", m4 = p({ moduleId: GL });
function f4(t) {
  return m4.get(t);
}
function jp(t, e) {
  e === void 0 && (e = {});
  const n = f4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: GL, event: t, data: e, timestamp: Date.now() });
}
const f$ = "1.0.1-P18EC", h$ = "footer/components/buttons/security";
class QM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...gv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return jp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = l4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, d4(this._element, this._cleanups, () => {
      jp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, jp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, jp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: f$, moduleId: h$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: f$, moduleId: h$, emits: [d.ACTION], actionPayload: XI };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let pI = null;
function Sl() {
  return pI || (pI = new QM()), pI;
}
function YL() {
  return new QM();
}
const FL = (t) => Sl().init(t), qL = (t, e) => Sl().mount(t, e), ZL = () => Sl().unmount(), KL = () => Sl().healthCheck(), WL = () => Sl().info(), h4 = { SecurityButton: QM, getInstance: Sl, createSecurityButton: YL, init: FL, mount: qL, unmount: ZL, healthCheck: KL, info: WL, VERSION: f$, MODULE_ID: h$ }, p4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: h$,
  VERSION: f$,
  createSecurityButton: YL,
  default: h4,
  getInstance: Sl,
  healthCheck: KL,
  info: WL,
  init: FL,
  mount: qL,
  unmount: ZL
}, Symbol.toStringTag, { value: "Module" })), _v = { id: "search", area: "footer", label: "search", icon: "search", kind: "navigation" };
d.ACTION;
const tO = { actionId: "footer:search", meta: {} };
function g4(t = {}) {
  const { id: e = "search", label: n = "Buscar", icon: i = "search", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const _4 = "footer-button-search-events";
function v4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      tO.actionId,
      _4,
      {
        label: _v.label,
        icon: _v.icon,
        kind: _v.kind,
        ...tO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const JL = "footer-button-search-tracker", $4 = p({ moduleId: JL });
function y4(t) {
  return $4.get(t);
}
function Bp(t, e) {
  e === void 0 && (e = {});
  const n = y4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: JL, event: t, data: e, timestamp: Date.now() });
}
const p$ = "1.0.1-P18EC", g$ = "footer/components/buttons/search";
class XM {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ..._v };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Bp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = g4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, v4(this._element, this._cleanups, () => {
      Bp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Bp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Bp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: p$, moduleId: g$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: p$, moduleId: g$, emits: [d.ACTION], actionPayload: tO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let gI = null;
function Ll() {
  return gI || (gI = new XM()), gI;
}
function QL() {
  return new XM();
}
const XL = (t) => Ll().init(t), tA = (t, e) => Ll().mount(t, e), eA = () => Ll().unmount(), nA = () => Ll().healthCheck(), iA = () => Ll().info(), k4 = { SearchButton: XM, getInstance: Ll, createSearchButton: QL, init: XL, mount: tA, unmount: eA, healthCheck: nA, info: iA, VERSION: p$, MODULE_ID: g$ }, b4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: g$,
  VERSION: p$,
  createSearchButton: QL,
  default: k4,
  getInstance: Ll,
  healthCheck: nA,
  info: iA,
  init: XL,
  mount: tA,
  unmount: eA
}, Symbol.toStringTag, { value: "Module" })), vv = { id: "activity", area: "footer", label: "activity", icon: "activity", kind: "navigation" };
d.ACTION;
const eO = { actionId: "footer:activity", meta: {} };
function E4(t = {}) {
  const { id: e = "activity", label: n = "Atividade", icon: i = "activity", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const I4 = "footer-button-activity-events";
function O4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      eO.actionId,
      I4,
      {
        label: vv.label,
        icon: vv.icon,
        kind: vv.kind,
        ...eO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const oA = "footer-button-activity-tracker", D4 = p({ moduleId: oA });
function C4(t) {
  return D4.get(t);
}
function Vp(t, e) {
  e === void 0 && (e = {});
  const n = C4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: oA, event: t, data: e, timestamp: Date.now() });
}
const _$ = "1.0.1-P18EC", v$ = "footer/components/buttons/activity";
class t0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...vv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Vp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = E4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, O4(this._element, this._cleanups, () => {
      Vp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Vp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Vp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: _$, moduleId: v$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: _$, moduleId: v$, emits: [d.ACTION], actionPayload: eO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let _I = null;
function Al() {
  return _I || (_I = new t0()), _I;
}
function sA() {
  return new t0();
}
const rA = (t) => Al().init(t), cA = (t, e) => Al().mount(t, e), aA = () => Al().unmount(), lA = () => Al().healthCheck(), uA = () => Al().info(), M4 = { ActivityButton: t0, getInstance: Al, createActivityButton: sA, init: rA, mount: cA, unmount: aA, healthCheck: lA, info: uA, VERSION: _$, MODULE_ID: v$ }, R4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: v$,
  VERSION: _$,
  createActivityButton: sA,
  default: M4,
  getInstance: Al,
  healthCheck: lA,
  info: uA,
  init: rA,
  mount: cA,
  unmount: aA
}, Symbol.toStringTag, { value: "Module" })), $v = { id: "globe", area: "footer", label: "globe", icon: "globe", kind: "navigation" };
d.ACTION;
const nO = { actionId: "footer:globe", meta: {} };
function w4(t = {}) {
  const { id: e = "globe", label: n = "Global", icon: i = "globe", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const P4 = "footer-button-globe-events";
function T4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      nO.actionId,
      P4,
      {
        label: $v.label,
        icon: $v.icon,
        kind: $v.kind,
        ...nO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const dA = "footer-button-globe-tracker", N4 = p({ moduleId: dA });
function S4(t) {
  return N4.get(t);
}
function xp(t, e) {
  e === void 0 && (e = {});
  const n = S4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: dA, event: t, data: e, timestamp: Date.now() });
}
const $$ = "1.0.1-P18EC", y$ = "footer/components/buttons/globe";
class e0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...$v };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return xp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = w4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, T4(this._element, this._cleanups, () => {
      xp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, xp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, xp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: $$, moduleId: y$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: $$, moduleId: y$, emits: [d.ACTION], actionPayload: nO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let vI = null;
function zl() {
  return vI || (vI = new e0()), vI;
}
function mA() {
  return new e0();
}
const fA = (t) => zl().init(t), hA = (t, e) => zl().mount(t, e), pA = () => zl().unmount(), gA = () => zl().healthCheck(), _A = () => zl().info(), L4 = { GlobeButton: e0, getInstance: zl, createGlobeButton: mA, init: fA, mount: hA, unmount: pA, healthCheck: gA, info: _A, VERSION: $$, MODULE_ID: y$ }, A4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: y$,
  VERSION: $$,
  createGlobeButton: mA,
  default: L4,
  getInstance: zl,
  healthCheck: gA,
  info: _A,
  init: fA,
  mount: hA,
  unmount: pA
}, Symbol.toStringTag, { value: "Module" })), yv = { id: "lock", area: "footer", label: "lock", icon: "lock", kind: "navigation" };
d.ACTION;
const iO = { actionId: "footer:lock", meta: {} };
function z4(t = {}) {
  const { id: e = "lock", label: n = "Bloqueio", icon: i = "lock", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const U4 = "footer-button-lock-events";
function H4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      iO.actionId,
      U4,
      {
        label: yv.label,
        icon: yv.icon,
        kind: yv.kind,
        ...iO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const vA = "footer-button-lock-tracker", j4 = p({ moduleId: vA });
function B4(t) {
  return j4.get(t);
}
function Gp(t, e) {
  e === void 0 && (e = {});
  const n = B4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: vA, event: t, data: e, timestamp: Date.now() });
}
const k$ = "1.0.1-P18EC", b$ = "footer/components/buttons/lock";
class n0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...yv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Gp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = z4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, H4(this._element, this._cleanups, () => {
      Gp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Gp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Gp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: k$, moduleId: b$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: k$, moduleId: b$, emits: [d.ACTION], actionPayload: iO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let $I = null;
function Ul() {
  return $I || ($I = new n0()), $I;
}
function $A() {
  return new n0();
}
const yA = (t) => Ul().init(t), kA = (t, e) => Ul().mount(t, e), bA = () => Ul().unmount(), EA = () => Ul().healthCheck(), IA = () => Ul().info(), V4 = { LockButton: n0, getInstance: Ul, createLockButton: $A, init: yA, mount: kA, unmount: bA, healthCheck: EA, info: IA, VERSION: k$, MODULE_ID: b$ }, x4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: b$,
  VERSION: k$,
  createLockButton: $A,
  default: V4,
  getInstance: Ul,
  healthCheck: EA,
  info: IA,
  init: yA,
  mount: kA,
  unmount: bA
}, Symbol.toStringTag, { value: "Module" })), kv = { id: "link", area: "footer", label: "link", icon: "link", kind: "navigation" };
d.ACTION;
const oO = { actionId: "footer:link", meta: {} };
function G4(t = {}) {
  const { id: e = "link", label: n = "Link", icon: i = "link", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const Y4 = "footer-button-link-events";
function F4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      oO.actionId,
      Y4,
      {
        label: kv.label,
        icon: kv.icon,
        kind: kv.kind,
        ...oO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const OA = "footer-button-link-tracker", q4 = p({ moduleId: OA });
function Z4(t) {
  return q4.get(t);
}
function Yp(t, e) {
  e === void 0 && (e = {});
  const n = Z4("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: OA, event: t, data: e, timestamp: Date.now() });
}
const E$ = "1.0.1-P18EC", I$ = "footer/components/buttons/link";
class i0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...kv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Yp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = G4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, F4(this._element, this._cleanups, () => {
      Yp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Yp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Yp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: E$, moduleId: I$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: E$, moduleId: I$, emits: [d.ACTION], actionPayload: oO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let yI = null;
function Hl() {
  return yI || (yI = new i0()), yI;
}
function DA() {
  return new i0();
}
const CA = (t) => Hl().init(t), MA = (t, e) => Hl().mount(t, e), RA = () => Hl().unmount(), wA = () => Hl().healthCheck(), PA = () => Hl().info(), K4 = { LinkButton: i0, getInstance: Hl, createLinkButton: DA, init: CA, mount: MA, unmount: RA, healthCheck: wA, info: PA, VERSION: E$, MODULE_ID: I$ }, W4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: I$,
  VERSION: E$,
  createLinkButton: DA,
  default: K4,
  getInstance: Hl,
  healthCheck: wA,
  info: PA,
  init: CA,
  mount: MA,
  unmount: RA
}, Symbol.toStringTag, { value: "Module" })), bv = { id: "cpu", area: "footer", label: "cpu", icon: "cpu", kind: "navigation" };
d.ACTION;
const sO = { actionId: "footer:cpu", meta: {} };
function J4(t = {}) {
  const { id: e = "cpu", label: n = "CPU", icon: i = "cpu", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const Q4 = "footer-button-cpu-events";
function X4(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      sO.actionId,
      Q4,
      {
        label: bv.label,
        icon: bv.icon,
        kind: bv.kind,
        ...sO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const TA = "footer-button-cpu-tracker", t3 = p({ moduleId: TA });
function e3(t) {
  return t3.get(t);
}
function Fp(t, e) {
  e === void 0 && (e = {});
  const n = e3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: TA, event: t, data: e, timestamp: Date.now() });
}
const O$ = "1.0.1-P18EC", D$ = "footer/components/buttons/cpu";
class o0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...bv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Fp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = J4({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, X4(this._element, this._cleanups, () => {
      Fp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Fp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Fp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: O$, moduleId: D$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: O$, moduleId: D$, emits: [d.ACTION], actionPayload: sO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let kI = null;
function jl() {
  return kI || (kI = new o0()), kI;
}
function NA() {
  return new o0();
}
const SA = (t) => jl().init(t), LA = (t, e) => jl().mount(t, e), AA = () => jl().unmount(), zA = () => jl().healthCheck(), UA = () => jl().info(), n3 = { CpuButton: o0, getInstance: jl, createCpuButton: NA, init: SA, mount: LA, unmount: AA, healthCheck: zA, info: UA, VERSION: O$, MODULE_ID: D$ }, i3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: D$,
  VERSION: O$,
  createCpuButton: NA,
  default: n3,
  getInstance: jl,
  healthCheck: zA,
  info: UA,
  init: SA,
  mount: LA,
  unmount: AA
}, Symbol.toStringTag, { value: "Module" })), Ev = { id: "hard-drive", area: "footer", label: "hard-drive", icon: "hard-drive", kind: "navigation" };
d.ACTION;
const rO = { actionId: "footer:hard-drive", meta: {} };
function o3(t = {}) {
  const { id: e = "hard-drive", label: n = "Disco", icon: i = "hard-drive", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const s3 = "footer-button-hard-drive-events";
function r3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      rO.actionId,
      s3,
      {
        label: Ev.label,
        icon: Ev.icon,
        kind: Ev.kind,
        ...rO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const HA = "footer-button-hard-drive-tracker", c3 = p({ moduleId: HA });
function a3(t) {
  return c3.get(t);
}
function qp(t, e) {
  e === void 0 && (e = {});
  const n = a3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: HA, event: t, data: e, timestamp: Date.now() });
}
const C$ = "1.0.1-P18EC", M$ = "footer/components/buttons/hard-drive";
class s0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Ev };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return qp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = o3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, r3(this._element, this._cleanups, () => {
      qp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, qp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, qp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: C$, moduleId: M$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: C$, moduleId: M$, emits: [d.ACTION], actionPayload: rO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let bI = null;
function Bl() {
  return bI || (bI = new s0()), bI;
}
function jA() {
  return new s0();
}
const BA = (t) => Bl().init(t), VA = (t, e) => Bl().mount(t, e), xA = () => Bl().unmount(), GA = () => Bl().healthCheck(), YA = () => Bl().info(), l3 = { HardDriveButton: s0, getInstance: Bl, createHardDriveButton: jA, init: BA, mount: VA, unmount: xA, healthCheck: GA, info: YA, VERSION: C$, MODULE_ID: M$ }, u3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: M$,
  VERSION: C$,
  createHardDriveButton: jA,
  default: l3,
  getInstance: Bl,
  healthCheck: GA,
  info: YA,
  init: BA,
  mount: VA,
  unmount: xA
}, Symbol.toStringTag, { value: "Module" })), Iv = { id: "monitor", area: "footer", label: "monitor", icon: "monitor", kind: "navigation" };
d.ACTION;
const cO = { actionId: "footer:monitor", meta: {} };
function d3(t = {}) {
  const { id: e = "monitor", label: n = "Monitor", icon: i = "monitor", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const m3 = "footer-button-monitor-events";
function f3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      cO.actionId,
      m3,
      {
        label: Iv.label,
        icon: Iv.icon,
        kind: Iv.kind,
        ...cO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const FA = "footer-button-monitor-tracker", h3 = p({ moduleId: FA });
function p3(t) {
  return h3.get(t);
}
function Zp(t, e) {
  e === void 0 && (e = {});
  const n = p3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: FA, event: t, data: e, timestamp: Date.now() });
}
const R$ = "1.0.1-P18EC", w$ = "footer/components/buttons/monitor";
class r0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Iv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Zp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = d3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, f3(this._element, this._cleanups, () => {
      Zp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Zp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Zp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: R$, moduleId: w$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: R$, moduleId: w$, emits: [d.ACTION], actionPayload: cO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let EI = null;
function Vl() {
  return EI || (EI = new r0()), EI;
}
function qA() {
  return new r0();
}
const ZA = (t) => Vl().init(t), KA = (t, e) => Vl().mount(t, e), WA = () => Vl().unmount(), JA = () => Vl().healthCheck(), QA = () => Vl().info(), g3 = { MonitorButton: r0, getInstance: Vl, createMonitorButton: qA, init: ZA, mount: KA, unmount: WA, healthCheck: JA, info: QA, VERSION: R$, MODULE_ID: w$ }, _3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: w$,
  VERSION: R$,
  createMonitorButton: qA,
  default: g3,
  getInstance: Vl,
  healthCheck: JA,
  info: QA,
  init: ZA,
  mount: KA,
  unmount: WA
}, Symbol.toStringTag, { value: "Module" })), Ov = { id: "clipboard", area: "footer", label: "clipboard", icon: "clipboard", kind: "navigation" };
d.ACTION;
const aO = { actionId: "footer:clipboard", meta: {} };
function v3(t = {}) {
  const { id: e = "clipboard", label: n = "Clipboard", icon: i = "clipboard", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const $3 = "footer-button-clipboard-events";
function y3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      aO.actionId,
      $3,
      {
        label: Ov.label,
        icon: Ov.icon,
        kind: Ov.kind,
        ...aO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const XA = "footer-button-clipboard-tracker", k3 = p({ moduleId: XA });
function b3(t) {
  return k3.get(t);
}
function Kp(t, e) {
  e === void 0 && (e = {});
  const n = b3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: XA, event: t, data: e, timestamp: Date.now() });
}
const P$ = "1.0.1-P18EC", T$ = "footer/components/buttons/clipboard";
class c0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Ov };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Kp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = v3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, y3(this._element, this._cleanups, () => {
      Kp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Kp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Kp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: P$, moduleId: T$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: P$, moduleId: T$, emits: [d.ACTION], actionPayload: aO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let II = null;
function xl() {
  return II || (II = new c0()), II;
}
function tz() {
  return new c0();
}
const ez = (t) => xl().init(t), nz = (t, e) => xl().mount(t, e), iz = () => xl().unmount(), oz = () => xl().healthCheck(), sz = () => xl().info(), E3 = { ClipboardButton: c0, getInstance: xl, createClipboardButton: tz, init: ez, mount: nz, unmount: iz, healthCheck: oz, info: sz, VERSION: P$, MODULE_ID: T$ }, I3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: T$,
  VERSION: P$,
  createClipboardButton: tz,
  default: E3,
  getInstance: xl,
  healthCheck: oz,
  info: sz,
  init: ez,
  mount: nz,
  unmount: iz
}, Symbol.toStringTag, { value: "Module" })), Dv = { id: "target", area: "footer", label: "target", icon: "target", kind: "navigation" };
d.ACTION;
const lO = { actionId: "footer:target", meta: {} };
function O3(t = {}) {
  const { id: e = "target", label: n = "Metas", icon: i = "target", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const D3 = "footer-button-target-events";
function C3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      lO.actionId,
      D3,
      {
        label: Dv.label,
        icon: Dv.icon,
        kind: Dv.kind,
        ...lO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const rz = "footer-button-target-tracker", M3 = p({ moduleId: rz });
function R3(t) {
  return M3.get(t);
}
function Wp(t, e) {
  e === void 0 && (e = {});
  const n = R3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: rz, event: t, data: e, timestamp: Date.now() });
}
const N$ = "1.0.1-P18EC", S$ = "footer/components/buttons/target";
class a0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Dv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Wp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = O3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, C3(this._element, this._cleanups, () => {
      Wp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Wp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Wp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: N$, moduleId: S$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: N$, moduleId: S$, emits: [d.ACTION], actionPayload: lO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let OI = null;
function Gl() {
  return OI || (OI = new a0()), OI;
}
function cz() {
  return new a0();
}
const az = (t) => Gl().init(t), lz = (t, e) => Gl().mount(t, e), uz = () => Gl().unmount(), dz = () => Gl().healthCheck(), mz = () => Gl().info(), w3 = { TargetButton: a0, getInstance: Gl, createTargetButton: cz, init: az, mount: lz, unmount: uz, healthCheck: dz, info: mz, VERSION: N$, MODULE_ID: S$ }, P3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: S$,
  VERSION: N$,
  createTargetButton: cz,
  default: w3,
  getInstance: Gl,
  healthCheck: dz,
  info: mz,
  init: az,
  mount: lz,
  unmount: uz
}, Symbol.toStringTag, { value: "Module" })), Cv = { id: "bookmark", area: "footer", label: "bookmark", icon: "bookmark", kind: "navigation" };
d.ACTION;
const uO = { actionId: "footer:bookmark", meta: {} };
function T3(t = {}) {
  const { id: e = "bookmark", label: n = "Favoritos", icon: i = "bookmark", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const N3 = "footer-button-bookmark-events";
function S3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      uO.actionId,
      N3,
      {
        label: Cv.label,
        icon: Cv.icon,
        kind: Cv.kind,
        ...uO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const fz = "footer-button-bookmark-tracker", L3 = p({ moduleId: fz });
function A3(t) {
  return L3.get(t);
}
function Jp(t, e) {
  e === void 0 && (e = {});
  const n = A3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: fz, event: t, data: e, timestamp: Date.now() });
}
const L$ = "1.0.1-P18EC", A$ = "footer/components/buttons/bookmark";
class l0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Cv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Jp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = T3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, S3(this._element, this._cleanups, () => {
      Jp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Jp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Jp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: L$, moduleId: A$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: L$, moduleId: A$, emits: [d.ACTION], actionPayload: uO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let DI = null;
function Yl() {
  return DI || (DI = new l0()), DI;
}
function hz() {
  return new l0();
}
const pz = (t) => Yl().init(t), gz = (t, e) => Yl().mount(t, e), _z = () => Yl().unmount(), vz = () => Yl().healthCheck(), $z = () => Yl().info(), z3 = { BookmarkButton: l0, getInstance: Yl, createBookmarkButton: hz, init: pz, mount: gz, unmount: _z, healthCheck: vz, info: $z, VERSION: L$, MODULE_ID: A$ }, U3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: A$,
  VERSION: L$,
  createBookmarkButton: hz,
  default: z3,
  getInstance: Yl,
  healthCheck: vz,
  info: $z,
  init: pz,
  mount: gz,
  unmount: _z
}, Symbol.toStringTag, { value: "Module" })), Mv = { id: "language", area: "footer", label: "language", icon: "language", kind: "navigation" };
d.ACTION;
const dO = { actionId: "footer:language", meta: {} };
function H3(t = {}) {
  const { id: e = "language", label: n = "Idioma", icon: i = "language", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const j3 = "footer-button-language-events";
function B3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      dO.actionId,
      j3,
      {
        label: Mv.label,
        icon: Mv.icon,
        kind: Mv.kind,
        ...dO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const yz = "footer-button-language-tracker", V3 = p({ moduleId: yz });
function x3(t) {
  return V3.get(t);
}
function Qp(t, e) {
  e === void 0 && (e = {});
  const n = x3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: yz, event: t, data: e, timestamp: Date.now() });
}
const z$ = "1.0.1-P18EC", U$ = "footer/components/buttons/language";
class u0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Mv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Qp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = H3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, B3(this._element, this._cleanups, () => {
      Qp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Qp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Qp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: z$, moduleId: U$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: z$, moduleId: U$, emits: [d.ACTION], actionPayload: dO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let CI = null;
function Fl() {
  return CI || (CI = new u0()), CI;
}
function kz() {
  return new u0();
}
const bz = (t) => Fl().init(t), Ez = (t, e) => Fl().mount(t, e), Iz = () => Fl().unmount(), Oz = () => Fl().healthCheck(), Dz = () => Fl().info(), G3 = { LanguageButton: u0, getInstance: Fl, createLanguageButton: kz, init: bz, mount: Ez, unmount: Iz, healthCheck: Oz, info: Dz, VERSION: z$, MODULE_ID: U$ }, Y3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: U$,
  VERSION: z$,
  createLanguageButton: kz,
  default: G3,
  getInstance: Fl,
  healthCheck: Oz,
  info: Dz,
  init: bz,
  mount: Ez,
  unmount: Iz
}, Symbol.toStringTag, { value: "Module" })), Rv = { id: "logout", area: "footer", label: "logout", icon: "logout", kind: "navigation" };
d.ACTION;
const mO = { actionId: "footer:logout", meta: {} };
function F3(t = {}) {
  const { id: e = "logout", label: n = "Sair", icon: i = "logout", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const q3 = "footer-button-logout-events";
function Z3(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      mO.actionId,
      q3,
      {
        label: Rv.label,
        icon: Rv.icon,
        kind: Rv.kind,
        ...mO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const Cz = "footer-button-logout-tracker", K3 = p({ moduleId: Cz });
function W3(t) {
  return K3.get(t);
}
function Xp(t, e) {
  e === void 0 && (e = {});
  const n = W3("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: Cz, event: t, data: e, timestamp: Date.now() });
}
const H$ = "1.0.1-P18EC", j$ = "footer/components/buttons/logout";
class d0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Rv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return Xp("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = F3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, Z3(this._element, this._cleanups, () => {
      Xp("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, Xp("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, Xp("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: H$, moduleId: j$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: H$, moduleId: j$, emits: [d.ACTION], actionPayload: mO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let MI = null;
function ql() {
  return MI || (MI = new d0()), MI;
}
function Mz() {
  return new d0();
}
const Rz = (t) => ql().init(t), wz = (t, e) => ql().mount(t, e), Pz = () => ql().unmount(), Tz = () => ql().healthCheck(), Nz = () => ql().info(), J3 = { LogoutButton: d0, getInstance: ql, createLogoutButton: Mz, init: Rz, mount: wz, unmount: Pz, healthCheck: Tz, info: Nz, VERSION: H$, MODULE_ID: j$ }, Q3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: j$,
  VERSION: H$,
  createLogoutButton: Mz,
  default: J3,
  getInstance: ql,
  healthCheck: Tz,
  info: Nz,
  init: Rz,
  mount: wz,
  unmount: Pz
}, Symbol.toStringTag, { value: "Module" })), wv = { id: "termos", area: "footer", label: "termos", icon: "termos", kind: "navigation" };
d.ACTION;
const fO = { actionId: "footer:termos", meta: {} };
function X3(t = {}) {
  const { id: e = "termos", label: n = "Termos", icon: i = "termos", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const t5 = "footer-button-termos-events";
function e5(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      fO.actionId,
      t5,
      {
        label: wv.label,
        icon: wv.icon,
        kind: wv.kind,
        ...fO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const Sz = "footer-button-termos-tracker", n5 = p({ moduleId: Sz });
function i5(t) {
  return n5.get(t);
}
function tg(t, e) {
  e === void 0 && (e = {});
  const n = i5("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: Sz, event: t, data: e, timestamp: Date.now() });
}
const B$ = "1.0.1-P18EC", V$ = "footer/components/buttons/termos";
class m0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...wv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return tg("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = X3({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, e5(this._element, this._cleanups, () => {
      tg("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, tg("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, tg("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: B$, moduleId: V$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, href: this._config.href, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: B$, moduleId: V$, emits: [d.ACTION], actionPayload: fO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let RI = null;
function Zl() {
  return RI || (RI = new m0()), RI;
}
function Lz() {
  return new m0();
}
const Az = (t) => Zl().init(t), zz = (t, e) => Zl().mount(t, e), Uz = () => Zl().unmount(), Hz = () => Zl().healthCheck(), jz = () => Zl().info(), o5 = { TermosLink: m0, getInstance: Zl, createTermosLink: Lz, init: Az, mount: zz, unmount: Uz, healthCheck: Hz, info: jz, VERSION: B$, MODULE_ID: V$ }, s5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: V$,
  VERSION: B$,
  createTermosLink: Lz,
  default: o5,
  getInstance: Zl,
  healthCheck: Hz,
  info: jz,
  init: Az,
  mount: zz,
  unmount: Uz
}, Symbol.toStringTag, { value: "Module" })), Pv = { id: "privacidade", area: "footer", label: "privacidade", icon: "privacidade", kind: "navigation" };
d.ACTION;
const hO = { actionId: "footer:privacidade", meta: {} };
function r5(t = {}) {
  const { id: e = "privacidade", label: n = "Privacidade", icon: i = "privacidade", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const c5 = "footer-button-privacidade-events";
function a5(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      hO.actionId,
      c5,
      {
        label: Pv.label,
        icon: Pv.icon,
        kind: Pv.kind,
        ...hO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const Bz = "footer-button-privacidade-tracker", l5 = p({ moduleId: Bz });
function u5(t) {
  return l5.get(t);
}
function eg(t, e) {
  e === void 0 && (e = {});
  const n = u5("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: Bz, event: t, data: e, timestamp: Date.now() });
}
const x$ = "1.0.1-P18EC", G$ = "footer/components/buttons/privacidade";
class f0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Pv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return eg("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = r5({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, a5(this._element, this._cleanups, () => {
      eg("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, eg("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, eg("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: x$, moduleId: G$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, href: this._config.href, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: x$, moduleId: G$, emits: [d.ACTION], actionPayload: hO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let wI = null;
function Kl() {
  return wI || (wI = new f0()), wI;
}
function Vz() {
  return new f0();
}
const xz = (t) => Kl().init(t), Gz = (t, e) => Kl().mount(t, e), Yz = () => Kl().unmount(), Fz = () => Kl().healthCheck(), qz = () => Kl().info(), d5 = { PrivacidadeLink: f0, getInstance: Kl, createPrivacidadeLink: Vz, init: xz, mount: Gz, unmount: Yz, healthCheck: Fz, info: qz, VERSION: x$, MODULE_ID: G$ }, m5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: G$,
  VERSION: x$,
  createPrivacidadeLink: Vz,
  default: d5,
  getInstance: Kl,
  healthCheck: Fz,
  info: qz,
  init: xz,
  mount: Gz,
  unmount: Yz
}, Symbol.toStringTag, { value: "Module" })), Tv = { id: "lgpd", area: "footer", label: "lgpd", icon: "lgpd", kind: "navigation" };
d.ACTION;
const pO = { actionId: "footer:lgpd", meta: {} };
function f5(t = {}) {
  const { id: e = "lgpd", label: n = "LGPD", icon: i = "lgpd", kind: o = "decorative" } = t, s = $(i), r = `trigger:footer:${e}`, c = o === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${e}` : `dsd-footer__icon-btn footer-btn footer-btn--${e}`;
  return o === "control" ? `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}<span>${n}</span></button>` : `<button type="button" class="${c}" aria-label="${n}" data-button-id="${e}" data-uarps-trigger="${r}" data-icon="${i}" tabindex="0" title="${n}">${s}</button>`;
}
const h5 = "footer-button-lgpd-events";
function p5(t, e = [], n = null) {
  if (!t) return;
  const i = (o) => {
    var s;
    (s = o == null ? void 0 : o.preventDefault) == null || s.call(o), y(
      pO.actionId,
      h5,
      {
        label: Tv.label,
        icon: Tv.icon,
        kind: Tv.kind,
        ...pO.meta
      }
    ), typeof n == "function" && n(o);
  };
  return _(t, "click", i, e), k(t, i, e), e;
}
const Zz = "footer-button-lgpd-tracker", g5 = p({ moduleId: Zz });
function _5(t) {
  return g5.get(t);
}
function ng(t, e) {
  e === void 0 && (e = {});
  const n = _5("eventBus");
  n && n.emit && n.emit(v.TRACK, { source: Zz, event: t, data: e, timestamp: Date.now() });
}
const Y$ = "1.0.1-P18EC", F$ = "footer/components/buttons/lgpd";
class h0 {
  constructor() {
    this._element = null, this._hostEl = null, this._mounted = !1, this._initialized = !1, this._cleanups = [], this._config = { ...Tv };
  }
  init(e = {}) {
    return this._initialized ? this : (this._ctx = e, this._initialized = !0, this);
  }
  mount(e, n = {}) {
    if (!e)
      return ng("error", { message: "hostEl required" }), this;
    if (this._mounted && this._hostEl === e) return this;
    this._mounted && this.unmount();
    const i = f5({ ...this._config, ...n }), o = document.createElement("div");
    return o.innerHTML = i, this._element = o.firstElementChild, p5(this._element, this._cleanups, () => {
      ng("clicked");
    }), e.appendChild(this._element), this._hostEl = e, this._mounted = !0, ng("mounted"), this;
  }
  unmount() {
    var e;
    return this._mounted ? (b(this._cleanups), (e = this._element) != null && e.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._hostEl = null, this._mounted = !1, ng("unmounted"), this) : this;
  }
  healthCheck() {
    const e = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl }, n = Object.values(e).filter(Boolean).length, i = Object.keys(e).length;
    return { status: n === i ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${i}`, checks: e, version: Y$, moduleId: F$ };
  }
  info() {
    return { id: this._config.id, label: this._config.label, href: this._config.href, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: Y$, moduleId: F$, emits: [d.ACTION], actionPayload: pO };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let PI = null;
function Wl() {
  return PI || (PI = new h0()), PI;
}
function Kz() {
  return new h0();
}
const Wz = (t) => Wl().init(t), Jz = (t, e) => Wl().mount(t, e), Qz = () => Wl().unmount(), Xz = () => Wl().healthCheck(), tU = () => Wl().info(), v5 = { LgpdLink: h0, getInstance: Wl, createLgpdLink: Kz, init: Wz, mount: Jz, unmount: Qz, healthCheck: Xz, info: tU, VERSION: Y$, MODULE_ID: F$ }, $5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: F$,
  VERSION: Y$,
  createLgpdLink: Kz,
  default: v5,
  getInstance: Wl,
  healthCheck: Xz,
  info: tU,
  init: Wz,
  mount: Jz,
  unmount: Qz
}, Symbol.toStringTag, { value: "Module" })), gO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "clock" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, y5 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(gO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let re = "idle", ig = null, Nw = 0;
const lt = {
  getPhase() {
    return re;
  },
  isReady() {
    return re === "ready" || re === "mounted";
  },
  isMounted() {
    return re === "mounted";
  },
  setInitializing() {
    re = "initializing";
  },
  setReady() {
    re = "ready";
  },
  setMounted(t) {
    re = "mounted", ig = t, Nw++;
  },
  setUnmounting() {
    re = "unmounting";
  },
  setDestroyed() {
    re = "destroyed", ig = null;
  },
  reset() {
    re = "idle", ig = null;
  },
  getContainer() {
    return ig;
  },
  info() {
    return { phase: re, isMounted: this.isMounted(), mountCount: Nw };
  }
};
({ ...lt });
const ka = "footer-icon-clock-events", p0 = "1.5.0-P18EC", _O = "footer:clock", tb = h({ moduleId: ka });
function k5() {
  tb.init();
}
function q$(t) {
  return tb.get(t);
}
const Xu = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function Sw(t) {
  t === void 0 && (t = {}), Xu.uiActions++;
  const e = q$("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: _O, source: ka, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Clock" }, t) });
}
const ps = { _clickHandler: null, _element: null, init() {
  k5();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Xu.clicks++, e && e(), Sw({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Xu.clicks++, Sw({ clicked: !0, props: t });
}, emitMounted(t) {
  Xu.mounts++;
  const e = q$("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: _O, moduleId: ka, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Xu.unmounts++;
  const t = q$("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: _O, moduleId: ka, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function g0() {
  return Object.assign({}, Xu);
}
function b5() {
  const t = tb.snapshot();
  return { moduleId: ka, version: p0, metrics: g0(), portsInitialized: t._initialized };
}
function E5() {
  const t = tb.snapshot(), e = q$("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: p0, moduleId: ka, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: g0() };
}
Object.assign({}, ps, { getMetrics: g0, info: b5, healthCheck: E5, MODULE_ID: ka, VERSION: p0 });
const gm = {
  async init() {
    return lt.isReady() ? { success: !0, alreadyInitialized: !0 } : (lt.setInitializing(), ps.init(), lt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = y5(e), { Template: i } = await Promise.resolve().then(() => I5);
    if (t.innerHTML = i.render(n.props), lt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--clock");
      o && ps.bindClick(o, () => ps.emitClicked(n.props));
    }
    return ps.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    lt.setUnmounting(), ps.cleanup();
    const t = lt.getContainer();
    return t && (t.innerHTML = ""), ps.emitUnmounted(), lt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ps.destroy(), lt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return lt.info();
  }
};
({ ...gm });
const mn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, ou = {
  getState() {
    return { ...mn };
  },
  setProps(t) {
    mn.props = t;
  },
  getProps() {
    return mn.props;
  },
  setVisible(t) {
    mn.isVisible = !!t;
  },
  setHovered(t) {
    mn.isHovered = !!t;
  },
  markRender() {
    mn.lastRender = Date.now();
  },
  reset() {
    mn.props = null, mn.isVisible = !0, mn.isHovered = !1, mn.lastRender = null;
  }
}, Lw = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", _0 = {
  render(t = {}) {
    const e = gO.SIZES[t.size] || gO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "Clock", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--clock", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="clock"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${Lw}"/></svg></span>`;
  },
  getSvgPath() {
    return Lw;
  }
};
({ ..._0 });
const I5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: _0
}, Symbol.toStringTag, { value: "Module" })), Oh = "footer-icon-clock-tracker", v0 = "2.0.0-P18EC", $0 = g({ moduleId: Oh });
function eU(t) {
  return $0.get(t);
}
const vo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, ci = {
  trackRender(t) {
    vo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    vo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    vo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    vo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    vo.errors++, this._emit(a.ERROR, { message: t.message || String(t) });
  },
  _emit(t, e) {
    const n = eU("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Oh }, e));
  },
  getMetrics() {
    return Object.assign({}, vo);
  },
  reset() {
    const t = Object.keys(vo);
    for (let e = 0; e < t.length; e++) vo[t[e]] = 0;
  }
};
function nU() {
  return ci.getMetrics();
}
function O5() {
  const t = $0.snapshot();
  return { moduleId: Oh, version: v0, metrics: nU(), portsInitialized: t._initialized };
}
function D5() {
  const t = $0.snapshot(), e = !!eU("telemetry");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: v0, moduleId: Oh, checks: { telemetryAvailable: e, portsInitialized: t._initialized }, metrics: nU() };
}
Object.assign({}, ci, { info: O5, healthCheck: D5, MODULE_ID: Oh, VERSION: v0 });
const iU = "footer-icon-clock-logger", C5 = g({ moduleId: iU });
function M5(t) {
  return C5.get(t);
}
function og(t, e) {
  const n = M5("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: iU });
}
const kc = { info(...t) {
  og("info", Array.prototype.slice.call(t));
}, warn(...t) {
  og("warn", Array.prototype.slice.call(t));
}, error(...t) {
  og("error", Array.prototype.slice.call(t));
}, debug(...t) {
  og("debug", Array.prototype.slice.call(t));
} };
kc.info, kc.warn, kc.error, kc.debug;
const vO = "footer-icon-clock", gf = "1.0.1-ENTERPRISE";
function Aw(t, ...e) {
  kc && typeof kc[t] == "function" && kc[t]("[CLOCK]", ...e);
}
const Z$ = {
  getVersion() {
    return gf;
  },
  getModuleId() {
    return vO;
  },
  async init(t = {}) {
    return Aw("info", "Init"), await gm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await gm.mount(t, e);
      return ou.setProps(n.props), ou.markRender(), ci.trackMount(), ci.trackRender(n.props), n;
    } catch (n) {
      throw ci.trackError(n), Aw("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return ou.setProps(t), ou.markRender(), ci.trackRender(t), _0.render(t);
  },
  async unmount() {
    ci.trackUnmount();
    const t = await gm.unmount();
    return ou.reset(), t;
  },
  async destroy() {
    const t = await gm.destroy();
    return ou.reset(), ci.reset(), t;
  },
  healthCheck() {
    const t = lt.info(), e = ci.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: gf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: vO, version: gf, lifecycle: lt.info(), metrics: ci.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconClock = { getVersion: () => gf, info: () => Z$.info(), healthCheck: () => Z$.healthCheck() });
const R5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ClockIcon: Z$,
  MODULE_ID: vO,
  VERSION: gf,
  default: Z$
}, Symbol.toStringTag, { value: "Module" })), $O = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "cpu" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, w5 = (t = {}) => {
  const e = [], n = {};
  return Object.entries($O.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ce = "idle", sg = null, zw = 0;
const ut = {
  getPhase() {
    return ce;
  },
  isReady() {
    return ce === "ready" || ce === "mounted";
  },
  isMounted() {
    return ce === "mounted";
  },
  setInitializing() {
    ce = "initializing";
  },
  setReady() {
    ce = "ready";
  },
  setMounted(t) {
    ce = "mounted", sg = t, zw++;
  },
  setUnmounting() {
    ce = "unmounting";
  },
  setDestroyed() {
    ce = "destroyed", sg = null;
  },
  reset() {
    ce = "idle", sg = null;
  },
  getContainer() {
    return sg;
  },
  info() {
    return { phase: ce, isMounted: this.isMounted(), mountCount: zw };
  }
};
({ ...ut });
const ba = "footer-icon-cpu-events", y0 = "1.5.0-P18EC", yO = "footer:cpu", eb = p({ moduleId: ba });
function P5() {
  eb.init();
}
function K$(t) {
  return eb.get(t);
}
const td = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function Uw(t) {
  t === void 0 && (t = {}), td.uiActions++;
  const e = K$("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: yO, source: ba, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "CPU Status" }, t) });
}
const gs = { _clickHandler: null, _element: null, init() {
  P5();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    td.clicks++, e && e(), Uw({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  td.clicks++, Uw({ clicked: !0, props: t });
}, emitMounted(t) {
  td.mounts++;
  const e = K$("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: yO, moduleId: ba, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  td.unmounts++;
  const t = K$("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: yO, moduleId: ba, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function k0() {
  return Object.assign({}, td);
}
function T5() {
  const t = eb.snapshot();
  return { moduleId: ba, version: y0, metrics: k0(), portsInitialized: t._initialized };
}
function N5() {
  const t = eb.snapshot(), e = K$("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: y0, moduleId: ba, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: k0() };
}
Object.assign({}, gs, { getMetrics: k0, info: T5, healthCheck: N5, MODULE_ID: ba, VERSION: y0 });
const _m = {
  async init() {
    return ut.isReady() ? { success: !0, alreadyInitialized: !0 } : (ut.setInitializing(), gs.init(), ut.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = w5(e), { Template: i } = await Promise.resolve().then(() => S5);
    if (t.innerHTML = i.render(n.props), ut.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--cpu");
      o && gs.bindClick(o, () => gs.emitClicked(n.props));
    }
    return gs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    ut.setUnmounting(), gs.cleanup();
    const t = ut.getContainer();
    return t && (t.innerHTML = ""), gs.emitUnmounted(), ut.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), gs.destroy(), ut.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return ut.info();
  }
};
({ ..._m });
const fn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, su = {
  getState() {
    return { ...fn };
  },
  setProps(t) {
    fn.props = t;
  },
  getProps() {
    return fn.props;
  },
  setVisible(t) {
    fn.isVisible = !!t;
  },
  setHovered(t) {
    fn.isHovered = !!t;
  },
  markRender() {
    fn.lastRender = Date.now();
  },
  reset() {
    fn.props = null, fn.isVisible = !0, fn.isHovered = !1, fn.lastRender = null;
  }
}, Hw = "M4 4h16v16H4zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3", b0 = {
  render(t = {}) {
    const e = $O.SIZES[t.size] || $O.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "cpu", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--cpu", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="cpu"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${Hw}"/></svg></span>`;
  },
  getSvgPath() {
    return Hw;
  }
};
({ ...b0 });
const S5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: b0
}, Symbol.toStringTag, { value: "Module" })), Dh = "footer.icon.cpu.tracker", nb = "2.2.0-P18EC", gr = h({ moduleId: Dh });
function L5(t) {
  return gr.inject(t);
}
function A5() {
  return gr.snapshot();
}
const $o = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, ai = {
  trackRender(t) {
    $o.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    $o.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    $o.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    $o.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    $o.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = gr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Dh }, e));
  },
  getMetrics() {
    return Object.assign({}, $o);
  },
  reset() {
    for (const t in $o) $o[t] = 0;
  }
};
function oU() {
  return ai.getMetrics();
}
function z5(t) {
  return gr.init(), t && t.ports && gr.inject(t.ports), { ok: !0, version: nb };
}
function U5() {
  return { status: gr.isInitialized() ? "HEALTHY" : "DEGRADED", version: nb, moduleId: Dh, portsInitialized: gr.isInitialized(), metrics: oU() };
}
function H5() {
  return { moduleId: Dh, version: nb, metrics: oU(), portsInitialized: gr.isInitialized() };
}
Object.assign({}, ai, { init: z5, info: H5, healthCheck: U5, MODULE_ID: Dh, VERSION: nb, injectPorts: L5, getPorts: A5 });
const sU = "footer-icon-cpu-logger", j5 = p({ moduleId: sU });
function B5(t) {
  return j5.get(t);
}
function rg(t, e) {
  const n = B5("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: sU });
}
const bc = { info(...t) {
  rg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  rg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  rg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  rg("debug", Array.prototype.slice.call(t));
} };
bc.info, bc.warn, bc.error, bc.debug;
const kO = "footer-icon-cpu", _f = "1.0.1-ENTERPRISE";
function jw(t, ...e) {
  bc && typeof bc[t] == "function" && bc[t]("[CPU]", ...e);
}
const W$ = {
  getVersion() {
    return _f;
  },
  getModuleId() {
    return kO;
  },
  async init(t = {}) {
    return jw("info", "Init"), await _m.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await _m.mount(t, e);
      return su.setProps(n.props), su.markRender(), ai.trackMount(), ai.trackRender(n.props), n;
    } catch (n) {
      throw ai.trackError(n), jw("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return su.setProps(t), su.markRender(), ai.trackRender(t), b0.render(t);
  },
  async unmount() {
    ai.trackUnmount();
    const t = await _m.unmount();
    return su.reset(), t;
  },
  async destroy() {
    const t = await _m.destroy();
    return su.reset(), ai.reset(), t;
  },
  healthCheck() {
    const t = ut.info(), e = ai.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: _f, timestamp: Date.now() };
  },
  info() {
    return { moduleId: kO, version: _f, lifecycle: ut.info(), metrics: ai.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCpu = { getVersion: () => _f, info: () => W$.info(), healthCheck: () => W$.healthCheck() });
const V5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CpuIcon: W$,
  MODULE_ID: kO,
  VERSION: _f,
  default: W$
}, Symbol.toStringTag, { value: "Module" })), bO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "disk" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, x5 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(bO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ae = "idle", cg = null, Bw = 0;
const dt = {
  getPhase() {
    return ae;
  },
  isReady() {
    return ae === "ready" || ae === "mounted";
  },
  isMounted() {
    return ae === "mounted";
  },
  setInitializing() {
    ae = "initializing";
  },
  setReady() {
    ae = "ready";
  },
  setMounted(t) {
    ae = "mounted", cg = t, Bw++;
  },
  setUnmounting() {
    ae = "unmounting";
  },
  setDestroyed() {
    ae = "destroyed", cg = null;
  },
  reset() {
    ae = "idle", cg = null;
  },
  getContainer() {
    return cg;
  },
  info() {
    return { phase: ae, isMounted: this.isMounted(), mountCount: Bw };
  }
};
({ ...dt });
const Ea = "footer-icon-disk-events", E0 = "1.5.0-P18EC", EO = "footer:disk", ib = h({ moduleId: Ea });
function G5() {
  ib.init();
}
function J$(t) {
  return ib.get(t);
}
const ed = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function Vw(t) {
  t === void 0 && (t = {}), ed.uiActions++;
  const e = J$("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: EO, source: Ea, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Disk Status" }, t) });
}
const _s = { _clickHandler: null, _element: null, init() {
  G5();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    ed.clicks++, e && e(), Vw({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  ed.clicks++, Vw({ clicked: !0, props: t });
}, emitMounted(t) {
  ed.mounts++;
  const e = J$("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: EO, moduleId: Ea, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  ed.unmounts++;
  const t = J$("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: EO, moduleId: Ea, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function I0() {
  return Object.assign({}, ed);
}
function Y5() {
  const t = ib.snapshot();
  return { moduleId: Ea, version: E0, metrics: I0(), portsInitialized: t._initialized };
}
function F5() {
  const t = ib.snapshot(), e = J$("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: E0, moduleId: Ea, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: I0() };
}
Object.assign({}, _s, { getMetrics: I0, info: Y5, healthCheck: F5, MODULE_ID: Ea, VERSION: E0 });
const vm = {
  async init() {
    return dt.isReady() ? { success: !0, alreadyInitialized: !0 } : (dt.setInitializing(), _s.init(), dt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = x5(e), { Template: i } = await Promise.resolve().then(() => q5);
    if (t.innerHTML = i.render(n.props), dt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--disk");
      o && _s.bindClick(o, () => _s.emitClicked(n.props));
    }
    return _s.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    dt.setUnmounting(), _s.cleanup();
    const t = dt.getContainer();
    return t && (t.innerHTML = ""), _s.emitUnmounted(), dt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), _s.destroy(), dt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return dt.info();
  }
};
({ ...vm });
const hn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, ru = {
  getState() {
    return { ...hn };
  },
  setProps(t) {
    hn.props = t;
  },
  getProps() {
    return hn.props;
  },
  setVisible(t) {
    hn.isVisible = !!t;
  },
  setHovered(t) {
    hn.isHovered = !!t;
  },
  markRender() {
    hn.lastRender = Date.now();
  },
  reset() {
    hn.props = null, hn.isVisible = !0, hn.isHovered = !1, hn.lastRender = null;
  }
}, xw = "M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0", O0 = {
  render(t = {}) {
    const e = bO.SIZES[t.size] || bO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "disk", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--disk", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="disk"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${xw}"/></svg></span>`;
  },
  getSvgPath() {
    return xw;
  }
};
({ ...O0 });
const q5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: O0
}, Symbol.toStringTag, { value: "Module" })), Ch = "footer.icon.disk.tracker", ob = "2.2.0-P18EC", _r = h({ moduleId: Ch });
function Z5(t) {
  return _r.inject(t);
}
function K5() {
  return _r.snapshot();
}
const yo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, li = {
  trackRender(t) {
    yo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    yo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    yo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    yo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    yo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = _r.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Ch }, e));
  },
  getMetrics() {
    return Object.assign({}, yo);
  },
  reset() {
    for (const t in yo) yo[t] = 0;
  }
};
function rU() {
  return li.getMetrics();
}
function W5(t) {
  return _r.init(), t && t.ports && _r.inject(t.ports), { ok: !0, version: ob };
}
function J5() {
  return { status: _r.isInitialized() ? "HEALTHY" : "DEGRADED", version: ob, moduleId: Ch, portsInitialized: _r.isInitialized(), metrics: rU() };
}
function Q5() {
  return { moduleId: Ch, version: ob, metrics: rU(), portsInitialized: _r.isInitialized() };
}
Object.assign({}, li, { init: W5, info: Q5, healthCheck: J5, MODULE_ID: Ch, VERSION: ob, injectPorts: Z5, getPorts: K5 });
const cU = "footer-icon-disk-logger", X5 = g({ moduleId: cU });
function t8(t) {
  return X5.get(t);
}
function ag(t, e) {
  const n = t8("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: cU });
}
const Ec = { info(...t) {
  ag("info", Array.prototype.slice.call(t));
}, warn(...t) {
  ag("warn", Array.prototype.slice.call(t));
}, error(...t) {
  ag("error", Array.prototype.slice.call(t));
}, debug(...t) {
  ag("debug", Array.prototype.slice.call(t));
} };
Ec.info, Ec.warn, Ec.error, Ec.debug;
const IO = "footer-icon-disk", vf = "1.0.1-ENTERPRISE";
function Gw(t, ...e) {
  Ec && typeof Ec[t] == "function" && Ec[t]("[DISK]", ...e);
}
const Q$ = {
  getVersion() {
    return vf;
  },
  getModuleId() {
    return IO;
  },
  async init(t = {}) {
    return Gw("info", "Init"), await vm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await vm.mount(t, e);
      return ru.setProps(n.props), ru.markRender(), li.trackMount(), li.trackRender(n.props), n;
    } catch (n) {
      throw li.trackError(n), Gw("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return ru.setProps(t), ru.markRender(), li.trackRender(t), O0.render(t);
  },
  async unmount() {
    li.trackUnmount();
    const t = await vm.unmount();
    return ru.reset(), t;
  },
  async destroy() {
    const t = await vm.destroy();
    return ru.reset(), li.reset(), t;
  },
  healthCheck() {
    const t = dt.info(), e = li.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: vf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: IO, version: vf, lifecycle: dt.info(), metrics: li.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDisk = { getVersion: () => vf, info: () => Q$.info(), healthCheck: () => Q$.healthCheck() });
const e8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiskIcon: Q$,
  MODULE_ID: IO,
  VERSION: vf,
  default: Q$
}, Symbol.toStringTag, { value: "Module" })), OO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "memory" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, n8 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(OO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let le = "idle", lg = null, Yw = 0;
const mt = {
  getPhase() {
    return le;
  },
  isReady() {
    return le === "ready" || le === "mounted";
  },
  isMounted() {
    return le === "mounted";
  },
  setInitializing() {
    le = "initializing";
  },
  setReady() {
    le = "ready";
  },
  setMounted(t) {
    le = "mounted", lg = t, Yw++;
  },
  setUnmounting() {
    le = "unmounting";
  },
  setDestroyed() {
    le = "destroyed", lg = null;
  },
  reset() {
    le = "idle", lg = null;
  },
  getContainer() {
    return lg;
  },
  info() {
    return { phase: le, isMounted: this.isMounted(), mountCount: Yw };
  }
};
({ ...mt });
const Ia = "footer-icon-memory-events", D0 = "1.5.0-P18EC", DO = "footer:memory", sb = h({ moduleId: Ia });
function i8() {
  sb.init();
}
function X$(t) {
  return sb.get(t);
}
const nd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function Fw(t) {
  t === void 0 && (t = {}), nd.uiActions++;
  const e = X$("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: DO, source: Ia, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Memory Status" }, t) });
}
const vs = { _clickHandler: null, _element: null, init() {
  i8();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    nd.clicks++, e && e(), Fw({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  nd.clicks++, Fw({ clicked: !0, props: t });
}, emitMounted(t) {
  nd.mounts++;
  const e = X$("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: DO, moduleId: Ia, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  nd.unmounts++;
  const t = X$("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: DO, moduleId: Ia, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function C0() {
  return Object.assign({}, nd);
}
function o8() {
  const t = sb.snapshot();
  return { moduleId: Ia, version: D0, metrics: C0(), portsInitialized: t._initialized };
}
function s8() {
  const t = sb.snapshot(), e = X$("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: D0, moduleId: Ia, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: C0() };
}
Object.assign({}, vs, { getMetrics: C0, info: o8, healthCheck: s8, MODULE_ID: Ia, VERSION: D0 });
const $m = {
  async init() {
    return mt.isReady() ? { success: !0, alreadyInitialized: !0 } : (mt.setInitializing(), vs.init(), mt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = n8(e), { Template: i } = await Promise.resolve().then(() => r8);
    if (t.innerHTML = i.render(n.props), mt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--memory");
      o && vs.bindClick(o, () => vs.emitClicked(n.props));
    }
    return vs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    mt.setUnmounting(), vs.cleanup();
    const t = mt.getContainer();
    return t && (t.innerHTML = ""), vs.emitUnmounted(), mt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), vs.destroy(), mt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return mt.info();
  }
};
({ ...$m });
const pn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, cu = {
  getState() {
    return { ...pn };
  },
  setProps(t) {
    pn.props = t;
  },
  getProps() {
    return pn.props;
  },
  setVisible(t) {
    pn.isVisible = !!t;
  },
  setHovered(t) {
    pn.isHovered = !!t;
  },
  markRender() {
    pn.lastRender = Date.now();
  },
  reset() {
    pn.props = null, pn.isVisible = !0, pn.isHovered = !1, pn.lastRender = null;
  }
}, qw = "M6 19v-8a6 6 0 1 1 12 0v8M6 13h12", M0 = {
  render(t = {}) {
    const e = OO.SIZES[t.size] || OO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "memory", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--memory", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="memory"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${qw}"/></svg></span>`;
  },
  getSvgPath() {
    return qw;
  }
};
({ ...M0 });
const r8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: M0
}, Symbol.toStringTag, { value: "Module" })), Mh = "footer.icon.memory.tracker", rb = "2.2.0-P18EC", vr = h({ moduleId: Mh });
function c8(t) {
  return vr.inject(t);
}
function a8() {
  return vr.snapshot();
}
const ko = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, ui = {
  trackRender(t) {
    ko.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    ko.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    ko.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    ko.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    ko.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = vr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Mh }, e));
  },
  getMetrics() {
    return Object.assign({}, ko);
  },
  reset() {
    for (const t in ko) ko[t] = 0;
  }
};
function aU() {
  return ui.getMetrics();
}
function l8(t) {
  return vr.init(), t && t.ports && vr.inject(t.ports), { ok: !0, version: rb };
}
function u8() {
  return { status: vr.isInitialized() ? "HEALTHY" : "DEGRADED", version: rb, moduleId: Mh, portsInitialized: vr.isInitialized(), metrics: aU() };
}
function d8() {
  return { moduleId: Mh, version: rb, metrics: aU(), portsInitialized: vr.isInitialized() };
}
Object.assign({}, ui, { init: l8, info: d8, healthCheck: u8, MODULE_ID: Mh, VERSION: rb, injectPorts: c8, getPorts: a8 });
const lU = "footer-icon-memory-logger", m8 = g({ moduleId: lU });
function f8(t) {
  return m8.get(t);
}
function ug(t, e) {
  const n = f8("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: lU });
}
const Ic = { info(...t) {
  ug("info", Array.prototype.slice.call(t));
}, warn(...t) {
  ug("warn", Array.prototype.slice.call(t));
}, error(...t) {
  ug("error", Array.prototype.slice.call(t));
}, debug(...t) {
  ug("debug", Array.prototype.slice.call(t));
} };
Ic.info, Ic.warn, Ic.error, Ic.debug;
const CO = "footer-icon-memory", $f = "1.0.1-ENTERPRISE";
function Zw(t, ...e) {
  Ic && typeof Ic[t] == "function" && Ic[t]("[MEMORY]", ...e);
}
const ty = {
  getVersion() {
    return $f;
  },
  getModuleId() {
    return CO;
  },
  async init(t = {}) {
    return Zw("info", "Init"), await $m.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await $m.mount(t, e);
      return cu.setProps(n.props), cu.markRender(), ui.trackMount(), ui.trackRender(n.props), n;
    } catch (n) {
      throw ui.trackError(n), Zw("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return cu.setProps(t), cu.markRender(), ui.trackRender(t), M0.render(t);
  },
  async unmount() {
    ui.trackUnmount();
    const t = await $m.unmount();
    return cu.reset(), t;
  },
  async destroy() {
    const t = await $m.destroy();
    return cu.reset(), ui.reset(), t;
  },
  healthCheck() {
    const t = mt.info(), e = ui.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: $f, timestamp: Date.now() };
  },
  info() {
    return { moduleId: CO, version: $f, lifecycle: mt.info(), metrics: ui.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconMemory = { getVersion: () => $f, info: () => ty.info(), healthCheck: () => ty.healthCheck() });
const h8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: CO,
  MemoryIcon: ty,
  VERSION: $f,
  default: ty
}, Symbol.toStringTag, { value: "Module" })), MO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "activity" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, p8 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(MO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ue = "idle", dg = null, Kw = 0;
const ft = {
  getPhase() {
    return ue;
  },
  isReady() {
    return ue === "ready" || ue === "mounted";
  },
  isMounted() {
    return ue === "mounted";
  },
  setInitializing() {
    ue = "initializing";
  },
  setReady() {
    ue = "ready";
  },
  setMounted(t) {
    ue = "mounted", dg = t, Kw++;
  },
  setUnmounting() {
    ue = "unmounting";
  },
  setDestroyed() {
    ue = "destroyed", dg = null;
  },
  reset() {
    ue = "idle", dg = null;
  },
  getContainer() {
    return dg;
  },
  info() {
    return { phase: ue, isMounted: this.isMounted(), mountCount: Kw };
  }
};
({ ...ft });
const Oa = "footer-icon-activity-events", R0 = "1.5.0-P18EC", RO = "footer:activity", cb = h({ moduleId: Oa });
function g8() {
  cb.init();
}
function ey(t) {
  return cb.get(t);
}
const id = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function Ww(t) {
  t === void 0 && (t = {}), id.uiActions++;
  const e = ey("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: RO, source: Oa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Activity" }, t) });
}
const $s = { _clickHandler: null, _element: null, init() {
  g8();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    id.clicks++, e && e(), Ww({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  id.clicks++, Ww({ clicked: !0, props: t });
}, emitMounted(t) {
  id.mounts++;
  const e = ey("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: RO, moduleId: Oa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  id.unmounts++;
  const t = ey("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: RO, moduleId: Oa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function w0() {
  return Object.assign({}, id);
}
function _8() {
  const t = cb.snapshot();
  return { moduleId: Oa, version: R0, metrics: w0(), portsInitialized: t._initialized };
}
function v8() {
  const t = cb.snapshot(), e = ey("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: R0, moduleId: Oa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: w0() };
}
Object.assign({}, $s, { getMetrics: w0, info: _8, healthCheck: v8, MODULE_ID: Oa, VERSION: R0 });
const ym = {
  async init() {
    return ft.isReady() ? { success: !0, alreadyInitialized: !0 } : (ft.setInitializing(), $s.init(), ft.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = p8(e), { Template: i } = await Promise.resolve().then(() => $8);
    if (t.innerHTML = i.render(n.props), ft.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--activity");
      o && $s.bindClick(o, () => $s.emitClicked(n.props));
    }
    return $s.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    ft.setUnmounting(), $s.cleanup();
    const t = ft.getContainer();
    return t && (t.innerHTML = ""), $s.emitUnmounted(), ft.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), $s.destroy(), ft.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return ft.info();
  }
};
({ ...ym });
const gn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, au = {
  getState() {
    return { ...gn };
  },
  setProps(t) {
    gn.props = t;
  },
  getProps() {
    return gn.props;
  },
  setVisible(t) {
    gn.isVisible = !!t;
  },
  setHovered(t) {
    gn.isHovered = !!t;
  },
  markRender() {
    gn.lastRender = Date.now();
  },
  reset() {
    gn.props = null, gn.isVisible = !0, gn.isHovered = !1, gn.lastRender = null;
  }
}, Jw = "M22 12h-4l-3 9L9 3l-3 9H2", P0 = {
  render(t = {}) {
    const e = MO.SIZES[t.size] || MO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "activity", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--activity", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="activity"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${Jw}"/></svg></span>`;
  },
  getSvgPath() {
    return Jw;
  }
};
({ ...P0 });
const $8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: P0
}, Symbol.toStringTag, { value: "Module" })), Rh = "footer.icon.activity.tracker", ab = "2.2.0-P18EC", $r = h({ moduleId: Rh });
function y8(t) {
  return $r.inject(t);
}
function k8() {
  return $r.snapshot();
}
const bo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, di = {
  trackRender(t) {
    bo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    bo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    bo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    bo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    bo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = $r.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Rh }, e));
  },
  getMetrics() {
    return Object.assign({}, bo);
  },
  reset() {
    for (const t in bo) bo[t] = 0;
  }
};
function uU() {
  return di.getMetrics();
}
function b8(t) {
  return $r.init(), t && t.ports && $r.inject(t.ports), { ok: !0, version: ab };
}
function E8() {
  return { status: $r.isInitialized() ? "HEALTHY" : "DEGRADED", version: ab, moduleId: Rh, portsInitialized: $r.isInitialized(), metrics: uU() };
}
function I8() {
  return { moduleId: Rh, version: ab, metrics: uU(), portsInitialized: $r.isInitialized() };
}
Object.assign({}, di, { init: b8, info: I8, healthCheck: E8, MODULE_ID: Rh, VERSION: ab, injectPorts: y8, getPorts: k8 });
const dU = "footer-icon-activity-logger", O8 = g({ moduleId: dU });
function D8(t) {
  return O8.get(t);
}
function mg(t, e) {
  const n = D8("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: dU });
}
const Oc = { info(...t) {
  mg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  mg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  mg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  mg("debug", Array.prototype.slice.call(t));
} };
Oc.info, Oc.warn, Oc.error, Oc.debug;
const wO = "footer-icon-activity", yf = "1.0.1-ENTERPRISE";
function Qw(t, ...e) {
  Oc && typeof Oc[t] == "function" && Oc[t]("[ACTIVITY]", ...e);
}
const ny = {
  getVersion() {
    return yf;
  },
  getModuleId() {
    return wO;
  },
  async init(t = {}) {
    return Qw("info", "Init"), await ym.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await ym.mount(t, e);
      return au.setProps(n.props), au.markRender(), di.trackMount(), di.trackRender(n.props), n;
    } catch (n) {
      throw di.trackError(n), Qw("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return au.setProps(t), au.markRender(), di.trackRender(t), P0.render(t);
  },
  async unmount() {
    di.trackUnmount();
    const t = await ym.unmount();
    return au.reset(), t;
  },
  async destroy() {
    const t = await ym.destroy();
    return au.reset(), di.reset(), t;
  },
  healthCheck() {
    const t = ft.info(), e = di.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: yf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: wO, version: yf, lifecycle: ft.info(), metrics: di.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconActivity = { getVersion: () => yf, info: () => ny.info(), healthCheck: () => ny.healthCheck() });
const C8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ActivityIcon: ny,
  MODULE_ID: wO,
  VERSION: yf,
  default: ny
}, Symbol.toStringTag, { value: "Module" })), PO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "globe" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, M8 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(PO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let de = "idle", fg = null, Xw = 0;
const ht = {
  getPhase() {
    return de;
  },
  isReady() {
    return de === "ready" || de === "mounted";
  },
  isMounted() {
    return de === "mounted";
  },
  setInitializing() {
    de = "initializing";
  },
  setReady() {
    de = "ready";
  },
  setMounted(t) {
    de = "mounted", fg = t, Xw++;
  },
  setUnmounting() {
    de = "unmounting";
  },
  setDestroyed() {
    de = "destroyed", fg = null;
  },
  reset() {
    de = "idle", fg = null;
  },
  getContainer() {
    return fg;
  },
  info() {
    return { phase: de, isMounted: this.isMounted(), mountCount: Xw };
  }
};
({ ...ht });
const Da = "footer-icon-globe-events", T0 = "1.5.0-P18EC", TO = "footer:globe", lb = h({ moduleId: Da });
function R8() {
  lb.init();
}
function iy(t) {
  return lb.get(t);
}
const od = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function tP(t) {
  t === void 0 && (t = {}), od.uiActions++;
  const e = iy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: TO, source: Da, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Globe" }, t) });
}
const ys = { _clickHandler: null, _element: null, init() {
  R8();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    od.clicks++, e && e(), tP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  od.clicks++, tP({ clicked: !0, props: t });
}, emitMounted(t) {
  od.mounts++;
  const e = iy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: TO, moduleId: Da, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  od.unmounts++;
  const t = iy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: TO, moduleId: Da, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function N0() {
  return Object.assign({}, od);
}
function w8() {
  const t = lb.snapshot();
  return { moduleId: Da, version: T0, metrics: N0(), portsInitialized: t._initialized };
}
function P8() {
  const t = lb.snapshot(), e = iy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: T0, moduleId: Da, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: N0() };
}
Object.assign({}, ys, { getMetrics: N0, info: w8, healthCheck: P8, MODULE_ID: Da, VERSION: T0 });
const km = {
  async init() {
    return ht.isReady() ? { success: !0, alreadyInitialized: !0 } : (ht.setInitializing(), ys.init(), ht.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = M8(e), { Template: i } = await Promise.resolve().then(() => T8);
    if (t.innerHTML = i.render(n.props), ht.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--globe");
      o && ys.bindClick(o, () => ys.emitClicked(n.props));
    }
    return ys.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    ht.setUnmounting(), ys.cleanup();
    const t = ht.getContainer();
    return t && (t.innerHTML = ""), ys.emitUnmounted(), ht.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ys.destroy(), ht.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return ht.info();
  }
};
({ ...km });
const _n = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, lu = {
  getState() {
    return { ..._n };
  },
  setProps(t) {
    _n.props = t;
  },
  getProps() {
    return _n.props;
  },
  setVisible(t) {
    _n.isVisible = !!t;
  },
  setHovered(t) {
    _n.isHovered = !!t;
  },
  markRender() {
    _n.lastRender = Date.now();
  },
  reset() {
    _n.props = null, _n.isVisible = !0, _n.isHovered = !1, _n.lastRender = null;
  }
}, eP = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z", S0 = {
  render(t = {}) {
    const e = PO.SIZES[t.size] || PO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "globe", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--globe", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="globe"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${eP}"/></svg></span>`;
  },
  getSvgPath() {
    return eP;
  }
};
({ ...S0 });
const T8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: S0
}, Symbol.toStringTag, { value: "Module" })), wh = "footer.icon.globe.tracker", ub = "2.2.0-P18EC", yr = h({ moduleId: wh });
function N8(t) {
  return yr.inject(t);
}
function S8() {
  return yr.snapshot();
}
const Eo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, mi = {
  trackRender(t) {
    Eo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Eo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Eo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Eo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Eo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = yr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: wh }, e));
  },
  getMetrics() {
    return Object.assign({}, Eo);
  },
  reset() {
    for (const t in Eo) Eo[t] = 0;
  }
};
function mU() {
  return mi.getMetrics();
}
function L8(t) {
  return yr.init(), t && t.ports && yr.inject(t.ports), { ok: !0, version: ub };
}
function A8() {
  return { status: yr.isInitialized() ? "HEALTHY" : "DEGRADED", version: ub, moduleId: wh, portsInitialized: yr.isInitialized(), metrics: mU() };
}
function z8() {
  return { moduleId: wh, version: ub, metrics: mU(), portsInitialized: yr.isInitialized() };
}
Object.assign({}, mi, { init: L8, info: z8, healthCheck: A8, MODULE_ID: wh, VERSION: ub, injectPorts: N8, getPorts: S8 });
const fU = "footer-icon-globe-logger", U8 = g({ moduleId: fU });
function H8(t) {
  return U8.get(t);
}
function hg(t, e) {
  const n = H8("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: fU });
}
const Dc = { info(...t) {
  hg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  hg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  hg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  hg("debug", Array.prototype.slice.call(t));
} };
Dc.info, Dc.warn, Dc.error, Dc.debug;
const NO = "footer-icon-globe", kf = "1.0.1-ENTERPRISE";
function nP(t, ...e) {
  Dc && typeof Dc[t] == "function" && Dc[t]("[GLOBE]", ...e);
}
const oy = {
  getVersion() {
    return kf;
  },
  getModuleId() {
    return NO;
  },
  async init(t = {}) {
    return nP("info", "Init"), await km.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await km.mount(t, e);
      return lu.setProps(n.props), lu.markRender(), mi.trackMount(), mi.trackRender(n.props), n;
    } catch (n) {
      throw mi.trackError(n), nP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return lu.setProps(t), lu.markRender(), mi.trackRender(t), S0.render(t);
  },
  async unmount() {
    mi.trackUnmount();
    const t = await km.unmount();
    return lu.reset(), t;
  },
  async destroy() {
    const t = await km.destroy();
    return lu.reset(), mi.reset(), t;
  },
  healthCheck() {
    const t = ht.info(), e = mi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: kf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: NO, version: kf, lifecycle: ht.info(), metrics: mi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconGlobe = { getVersion: () => kf, info: () => oy.info(), healthCheck: () => oy.healthCheck() });
const j8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GlobeIcon: oy,
  MODULE_ID: NO,
  VERSION: kf,
  default: oy
}, Symbol.toStringTag, { value: "Module" })), SO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "map-pin" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, B8 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(SO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let me = "idle", pg = null, iP = 0;
const pt = {
  getPhase() {
    return me;
  },
  isReady() {
    return me === "ready" || me === "mounted";
  },
  isMounted() {
    return me === "mounted";
  },
  setInitializing() {
    me = "initializing";
  },
  setReady() {
    me = "ready";
  },
  setMounted(t) {
    me = "mounted", pg = t, iP++;
  },
  setUnmounting() {
    me = "unmounting";
  },
  setDestroyed() {
    me = "destroyed", pg = null;
  },
  reset() {
    me = "idle", pg = null;
  },
  getContainer() {
    return pg;
  },
  info() {
    return { phase: me, isMounted: this.isMounted(), mountCount: iP };
  }
};
({ ...pt });
const Ca = "footer-icon-map-pin-events", L0 = "1.5.0-P18EC", LO = "footer:map-pin", db = h({ moduleId: Ca });
function V8() {
  db.init();
}
function sy(t) {
  return db.get(t);
}
const sd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function oP(t) {
  t === void 0 && (t = {}), sd.uiActions++;
  const e = sy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: LO, source: Ca, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "MapPin" }, t) });
}
const ks = { _clickHandler: null, _element: null, init() {
  V8();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    sd.clicks++, e && e(), oP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  sd.clicks++, oP({ clicked: !0, props: t });
}, emitMounted(t) {
  sd.mounts++;
  const e = sy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: LO, moduleId: Ca, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  sd.unmounts++;
  const t = sy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: LO, moduleId: Ca, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function A0() {
  return Object.assign({}, sd);
}
function x8() {
  const t = db.snapshot();
  return { moduleId: Ca, version: L0, metrics: A0(), portsInitialized: t._initialized };
}
function G8() {
  const t = db.snapshot(), e = sy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: L0, moduleId: Ca, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: A0() };
}
Object.assign({}, ks, { getMetrics: A0, info: x8, healthCheck: G8, MODULE_ID: Ca, VERSION: L0 });
const bm = {
  async init() {
    return pt.isReady() ? { success: !0, alreadyInitialized: !0 } : (pt.setInitializing(), ks.init(), pt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = B8(e), { Template: i } = await Promise.resolve().then(() => Y8);
    if (t.innerHTML = i.render(n.props), pt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--map-pin");
      o && ks.bindClick(o, () => ks.emitClicked(n.props));
    }
    return ks.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    pt.setUnmounting(), ks.cleanup();
    const t = pt.getContainer();
    return t && (t.innerHTML = ""), ks.emitUnmounted(), pt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ks.destroy(), pt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return pt.info();
  }
};
({ ...bm });
const vn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, uu = {
  getState() {
    return { ...vn };
  },
  setProps(t) {
    vn.props = t;
  },
  getProps() {
    return vn.props;
  },
  setVisible(t) {
    vn.isVisible = !!t;
  },
  setHovered(t) {
    vn.isHovered = !!t;
  },
  markRender() {
    vn.lastRender = Date.now();
  },
  reset() {
    vn.props = null, vn.isVisible = !0, vn.isHovered = !1, vn.lastRender = null;
  }
}, sP = "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", z0 = {
  render(t = {}) {
    const e = SO.SIZES[t.size] || SO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "map-pin", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--map-pin", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="map-pin"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${sP}"/></svg></span>`;
  },
  getSvgPath() {
    return sP;
  }
};
({ ...z0 });
const Y8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: z0
}, Symbol.toStringTag, { value: "Module" })), Ph = "footer.icon.map-pin.tracker", mb = "2.2.0-P18EC", kr = h({ moduleId: Ph });
function F8(t) {
  return kr.inject(t);
}
function q8() {
  return kr.snapshot();
}
const Io = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, fi = {
  trackRender(t) {
    Io.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Io.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Io.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Io.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Io.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = kr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Ph }, e));
  },
  getMetrics() {
    return Object.assign({}, Io);
  },
  reset() {
    for (const t in Io) Io[t] = 0;
  }
};
function hU() {
  return fi.getMetrics();
}
function Z8(t) {
  return kr.init(), t && t.ports && kr.inject(t.ports), { ok: !0, version: mb };
}
function K8() {
  return { status: kr.isInitialized() ? "HEALTHY" : "DEGRADED", version: mb, moduleId: Ph, portsInitialized: kr.isInitialized(), metrics: hU() };
}
function W8() {
  return { moduleId: Ph, version: mb, metrics: hU(), portsInitialized: kr.isInitialized() };
}
Object.assign({}, fi, { init: Z8, info: W8, healthCheck: K8, MODULE_ID: Ph, VERSION: mb, injectPorts: F8, getPorts: q8 });
const pU = "footer-icon-map-pin-logger", J8 = g({ moduleId: pU });
function Q8(t) {
  return J8.get(t);
}
function gg(t, e) {
  const n = Q8("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: pU });
}
const Cc = { info(...t) {
  gg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  gg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  gg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  gg("debug", Array.prototype.slice.call(t));
} };
Cc.info, Cc.warn, Cc.error, Cc.debug;
const AO = "footer-icon-map-pin", bf = "1.0.1-ENTERPRISE";
function rP(t, ...e) {
  Cc && typeof Cc[t] == "function" && Cc[t]("[MAP-PIN]", ...e);
}
const ry = {
  getVersion() {
    return bf;
  },
  getModuleId() {
    return AO;
  },
  async init(t = {}) {
    return rP("info", "Init"), await bm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await bm.mount(t, e);
      return uu.setProps(n.props), uu.markRender(), fi.trackMount(), fi.trackRender(n.props), n;
    } catch (n) {
      throw fi.trackError(n), rP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return uu.setProps(t), uu.markRender(), fi.trackRender(t), z0.render(t);
  },
  async unmount() {
    fi.trackUnmount();
    const t = await bm.unmount();
    return uu.reset(), t;
  },
  async destroy() {
    const t = await bm.destroy();
    return uu.reset(), fi.reset(), t;
  },
  healthCheck() {
    const t = pt.info(), e = fi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: bf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: AO, version: bf, lifecycle: pt.info(), metrics: fi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconMapPin = { getVersion: () => bf, info: () => ry.info(), healthCheck: () => ry.healthCheck() });
const X8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: AO,
  MapPinIcon: ry,
  VERSION: bf,
  default: ry
}, Symbol.toStringTag, { value: "Module" })), zO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "settings" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, t6 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(zO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let fe = "idle", _g = null, cP = 0;
const gt = {
  getPhase() {
    return fe;
  },
  isReady() {
    return fe === "ready" || fe === "mounted";
  },
  isMounted() {
    return fe === "mounted";
  },
  setInitializing() {
    fe = "initializing";
  },
  setReady() {
    fe = "ready";
  },
  setMounted(t) {
    fe = "mounted", _g = t, cP++;
  },
  setUnmounting() {
    fe = "unmounting";
  },
  setDestroyed() {
    fe = "destroyed", _g = null;
  },
  reset() {
    fe = "idle", _g = null;
  },
  getContainer() {
    return _g;
  },
  info() {
    return { phase: fe, isMounted: this.isMounted(), mountCount: cP };
  }
};
({ ...gt });
const Ma = "footer-icon-settings-events", U0 = "1.5.0-P18EC", UO = "footer:settings", fb = h({ moduleId: Ma });
function e6() {
  fb.init();
}
function cy(t) {
  return fb.get(t);
}
const rd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function aP(t) {
  t === void 0 && (t = {}), rd.uiActions++;
  const e = cy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: UO, source: Ma, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Settings" }, t) });
}
const bs = { _clickHandler: null, _element: null, init() {
  e6();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    rd.clicks++, e && e(), aP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  rd.clicks++, aP({ clicked: !0, props: t });
}, emitMounted(t) {
  rd.mounts++;
  const e = cy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: UO, moduleId: Ma, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  rd.unmounts++;
  const t = cy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: UO, moduleId: Ma, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function H0() {
  return Object.assign({}, rd);
}
function n6() {
  const t = fb.snapshot();
  return { moduleId: Ma, version: U0, metrics: H0(), portsInitialized: t._initialized };
}
function i6() {
  const t = fb.snapshot(), e = cy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: U0, moduleId: Ma, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: H0() };
}
Object.assign({}, bs, { getMetrics: H0, info: n6, healthCheck: i6, MODULE_ID: Ma, VERSION: U0 });
const Em = {
  async init() {
    return gt.isReady() ? { success: !0, alreadyInitialized: !0 } : (gt.setInitializing(), bs.init(), gt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = t6(e), { Template: i } = await Promise.resolve().then(() => o6);
    if (t.innerHTML = i.render(n.props), gt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--settings");
      o && bs.bindClick(o, () => bs.emitClicked(n.props));
    }
    return bs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    gt.setUnmounting(), bs.cleanup();
    const t = gt.getContainer();
    return t && (t.innerHTML = ""), bs.emitUnmounted(), gt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), bs.destroy(), gt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return gt.info();
  }
};
({ ...Em });
const $n = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, du = {
  getState() {
    return { ...$n };
  },
  setProps(t) {
    $n.props = t;
  },
  getProps() {
    return $n.props;
  },
  setVisible(t) {
    $n.isVisible = !!t;
  },
  setHovered(t) {
    $n.isHovered = !!t;
  },
  markRender() {
    $n.lastRender = Date.now();
  },
  reset() {
    $n.props = null, $n.isVisible = !0, $n.isHovered = !1, $n.lastRender = null;
  }
}, lP = "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z", j0 = {
  render(t = {}) {
    const e = zO.SIZES[t.size] || zO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "settings", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--settings", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="settings"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${lP}"/></svg></span>`;
  },
  getSvgPath() {
    return lP;
  }
};
({ ...j0 });
const o6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: j0
}, Symbol.toStringTag, { value: "Module" })), Th = "footer.icon.settings.tracker", hb = "2.2.0-P18EC", br = h({ moduleId: Th });
function s6(t) {
  return br.inject(t);
}
function r6() {
  return br.snapshot();
}
const Oo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, hi = {
  trackRender(t) {
    Oo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Oo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Oo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Oo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Oo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = br.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Th }, e));
  },
  getMetrics() {
    return Object.assign({}, Oo);
  },
  reset() {
    for (const t in Oo) Oo[t] = 0;
  }
};
function gU() {
  return hi.getMetrics();
}
function c6(t) {
  return br.init(), t && t.ports && br.inject(t.ports), { ok: !0, version: hb };
}
function a6() {
  return { status: br.isInitialized() ? "HEALTHY" : "DEGRADED", version: hb, moduleId: Th, portsInitialized: br.isInitialized(), metrics: gU() };
}
function l6() {
  return { moduleId: Th, version: hb, metrics: gU(), portsInitialized: br.isInitialized() };
}
Object.assign({}, hi, { init: c6, info: l6, healthCheck: a6, MODULE_ID: Th, VERSION: hb, injectPorts: s6, getPorts: r6 });
const _U = "footer-icon-settings-logger", u6 = g({ moduleId: _U });
function d6(t) {
  return u6.get(t);
}
function vg(t, e) {
  const n = d6("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: _U });
}
const Mc = { info(...t) {
  vg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  vg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  vg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  vg("debug", Array.prototype.slice.call(t));
} };
Mc.info, Mc.warn, Mc.error, Mc.debug;
const HO = "footer-icon-settings", Ef = "1.0.1-ENTERPRISE";
function uP(t, ...e) {
  Mc && typeof Mc[t] == "function" && Mc[t]("[SETTINGS]", ...e);
}
const ay = {
  getVersion() {
    return Ef;
  },
  getModuleId() {
    return HO;
  },
  async init(t = {}) {
    return uP("info", "Init"), await Em.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Em.mount(t, e);
      return du.setProps(n.props), du.markRender(), hi.trackMount(), hi.trackRender(n.props), n;
    } catch (n) {
      throw hi.trackError(n), uP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return du.setProps(t), du.markRender(), hi.trackRender(t), j0.render(t);
  },
  async unmount() {
    hi.trackUnmount();
    const t = await Em.unmount();
    return du.reset(), t;
  },
  async destroy() {
    const t = await Em.destroy();
    return du.reset(), hi.reset(), t;
  },
  healthCheck() {
    const t = gt.info(), e = hi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Ef, timestamp: Date.now() };
  },
  info() {
    return { moduleId: HO, version: Ef, lifecycle: gt.info(), metrics: hi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconSettings = { getVersion: () => Ef, info: () => ay.info(), healthCheck: () => ay.healthCheck() });
const m6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: HO,
  SettingsIcon: ay,
  VERSION: Ef,
  default: ay
}, Symbol.toStringTag, { value: "Module" })), jO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "copyright" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, f6 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(jO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let he = "idle", $g = null, dP = 0;
const _t = {
  getPhase() {
    return he;
  },
  isReady() {
    return he === "ready" || he === "mounted";
  },
  isMounted() {
    return he === "mounted";
  },
  setInitializing() {
    he = "initializing";
  },
  setReady() {
    he = "ready";
  },
  setMounted(t) {
    he = "mounted", $g = t, dP++;
  },
  setUnmounting() {
    he = "unmounting";
  },
  setDestroyed() {
    he = "destroyed", $g = null;
  },
  reset() {
    he = "idle", $g = null;
  },
  getContainer() {
    return $g;
  },
  info() {
    return { phase: he, isMounted: this.isMounted(), mountCount: dP };
  }
};
({ ..._t });
const Ra = "footer-icon-copyright-events", B0 = "1.5.0-P18EC", BO = "footer:copyright", pb = h({ moduleId: Ra });
function h6() {
  pb.init();
}
function ly(t) {
  return pb.get(t);
}
const cd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function mP(t) {
  t === void 0 && (t = {}), cd.uiActions++;
  const e = ly("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: BO, source: Ra, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Copyright" }, t) });
}
const Es = { _clickHandler: null, _element: null, init() {
  h6();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    cd.clicks++, e && e(), mP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  cd.clicks++, mP({ clicked: !0, props: t });
}, emitMounted(t) {
  cd.mounts++;
  const e = ly("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: BO, moduleId: Ra, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  cd.unmounts++;
  const t = ly("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: BO, moduleId: Ra, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function V0() {
  return Object.assign({}, cd);
}
function p6() {
  const t = pb.snapshot();
  return { moduleId: Ra, version: B0, metrics: V0(), portsInitialized: t._initialized };
}
function g6() {
  const t = pb.snapshot(), e = ly("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: B0, moduleId: Ra, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: V0() };
}
Object.assign({}, Es, { getMetrics: V0, info: p6, healthCheck: g6, MODULE_ID: Ra, VERSION: B0 });
const Im = {
  async init() {
    return _t.isReady() ? { success: !0, alreadyInitialized: !0 } : (_t.setInitializing(), Es.init(), _t.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = f6(e), { Template: i } = await Promise.resolve().then(() => _6);
    if (t.innerHTML = i.render(n.props), _t.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--copyright");
      o && Es.bindClick(o, () => Es.emitClicked(n.props));
    }
    return Es.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    _t.setUnmounting(), Es.cleanup();
    const t = _t.getContainer();
    return t && (t.innerHTML = ""), Es.emitUnmounted(), _t.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Es.destroy(), _t.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return _t.info();
  }
};
({ ...Im });
const yn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, mu = {
  getState() {
    return { ...yn };
  },
  setProps(t) {
    yn.props = t;
  },
  getProps() {
    return yn.props;
  },
  setVisible(t) {
    yn.isVisible = !!t;
  },
  setHovered(t) {
    yn.isHovered = !!t;
  },
  markRender() {
    yn.lastRender = Date.now();
  },
  reset() {
    yn.props = null, yn.isVisible = !0, yn.isHovered = !1, yn.lastRender = null;
  }
}, fP = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM14.5 9.5a3 3 0 1 0 0 5 3 3 0 0 0 0-5z", x0 = {
  render(t = {}) {
    const e = jO.SIZES[t.size] || jO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "copyright", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--copyright", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="copyright"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${fP}"/></svg></span>`;
  },
  getSvgPath() {
    return fP;
  }
};
({ ...x0 });
const _6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: x0
}, Symbol.toStringTag, { value: "Module" })), Nh = "footer.icon.copyright.tracker", gb = "2.2.0-P18EC", Er = h({ moduleId: Nh });
function v6(t) {
  return Er.inject(t);
}
function $6() {
  return Er.snapshot();
}
const Do = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, pi = {
  trackRender(t) {
    Do.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Do.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Do.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Do.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Do.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Er.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Nh }, e));
  },
  getMetrics() {
    return Object.assign({}, Do);
  },
  reset() {
    for (const t in Do) Do[t] = 0;
  }
};
function vU() {
  return pi.getMetrics();
}
function y6(t) {
  return Er.init(), t && t.ports && Er.inject(t.ports), { ok: !0, version: gb };
}
function k6() {
  return { status: Er.isInitialized() ? "HEALTHY" : "DEGRADED", version: gb, moduleId: Nh, portsInitialized: Er.isInitialized(), metrics: vU() };
}
function b6() {
  return { moduleId: Nh, version: gb, metrics: vU(), portsInitialized: Er.isInitialized() };
}
Object.assign({}, pi, { init: y6, info: b6, healthCheck: k6, MODULE_ID: Nh, VERSION: gb, injectPorts: v6, getPorts: $6 });
const $U = "footer-icon-copyright-logger", E6 = g({ moduleId: $U });
function I6(t) {
  return E6.get(t);
}
function yg(t, e) {
  const n = I6("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: $U });
}
const Rc = { info(...t) {
  yg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  yg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  yg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  yg("debug", Array.prototype.slice.call(t));
} };
Rc.info, Rc.warn, Rc.error, Rc.debug;
const VO = "footer-icon-copyright", If = "1.0.1-ENTERPRISE";
function hP(t, ...e) {
  Rc && typeof Rc[t] == "function" && Rc[t]("[COPYRIGHT]", ...e);
}
const uy = {
  getVersion() {
    return If;
  },
  getModuleId() {
    return VO;
  },
  async init(t = {}) {
    return hP("info", "Init"), await Im.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Im.mount(t, e);
      return mu.setProps(n.props), mu.markRender(), pi.trackMount(), pi.trackRender(n.props), n;
    } catch (n) {
      throw pi.trackError(n), hP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return mu.setProps(t), mu.markRender(), pi.trackRender(t), x0.render(t);
  },
  async unmount() {
    pi.trackUnmount();
    const t = await Im.unmount();
    return mu.reset(), t;
  },
  async destroy() {
    const t = await Im.destroy();
    return mu.reset(), pi.reset(), t;
  },
  healthCheck() {
    const t = _t.info(), e = pi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: If, timestamp: Date.now() };
  },
  info() {
    return { moduleId: VO, version: If, lifecycle: _t.info(), metrics: pi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCopyright = { getVersion: () => If, info: () => uy.info(), healthCheck: () => uy.healthCheck() });
const O6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CopyrightIcon: uy,
  MODULE_ID: VO,
  VERSION: If,
  default: uy
}, Symbol.toStringTag, { value: "Module" })), xO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "server" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, D6 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(xO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let pe = "idle", kg = null, pP = 0;
const vt = {
  getPhase() {
    return pe;
  },
  isReady() {
    return pe === "ready" || pe === "mounted";
  },
  isMounted() {
    return pe === "mounted";
  },
  setInitializing() {
    pe = "initializing";
  },
  setReady() {
    pe = "ready";
  },
  setMounted(t) {
    pe = "mounted", kg = t, pP++;
  },
  setUnmounting() {
    pe = "unmounting";
  },
  setDestroyed() {
    pe = "destroyed", kg = null;
  },
  reset() {
    pe = "idle", kg = null;
  },
  getContainer() {
    return kg;
  },
  info() {
    return { phase: pe, isMounted: this.isMounted(), mountCount: pP };
  }
};
({ ...vt });
const wa = "footer-icon-server-events", G0 = "1.5.0-P18EC", GO = "footer:server", _b = h({ moduleId: wa });
function C6() {
  _b.init();
}
function dy(t) {
  return _b.get(t);
}
const ad = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function gP(t) {
  t === void 0 && (t = {}), ad.uiActions++;
  const e = dy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: GO, source: wa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Server" }, t) });
}
const Is = { _clickHandler: null, _element: null, init() {
  C6();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    ad.clicks++, e && e(), gP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  ad.clicks++, gP({ clicked: !0, props: t });
}, emitMounted(t) {
  ad.mounts++;
  const e = dy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: GO, moduleId: wa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  ad.unmounts++;
  const t = dy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: GO, moduleId: wa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function Y0() {
  return Object.assign({}, ad);
}
function M6() {
  const t = _b.snapshot();
  return { moduleId: wa, version: G0, metrics: Y0(), portsInitialized: t._initialized };
}
function R6() {
  const t = _b.snapshot(), e = dy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: G0, moduleId: wa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: Y0() };
}
Object.assign({}, Is, { getMetrics: Y0, info: M6, healthCheck: R6, MODULE_ID: wa, VERSION: G0 });
const Om = {
  async init() {
    return vt.isReady() ? { success: !0, alreadyInitialized: !0 } : (vt.setInitializing(), Is.init(), vt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = D6(e), { Template: i } = await Promise.resolve().then(() => w6);
    if (t.innerHTML = i.render(n.props), vt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--server");
      o && Is.bindClick(o, () => Is.emitClicked(n.props));
    }
    return Is.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    vt.setUnmounting(), Is.cleanup();
    const t = vt.getContainer();
    return t && (t.innerHTML = ""), Is.emitUnmounted(), vt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Is.destroy(), vt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return vt.info();
  }
};
({ ...Om });
const kn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, fu = {
  getState() {
    return { ...kn };
  },
  setProps(t) {
    kn.props = t;
  },
  getProps() {
    return kn.props;
  },
  setVisible(t) {
    kn.isVisible = !!t;
  },
  setHovered(t) {
    kn.isHovered = !!t;
  },
  markRender() {
    kn.lastRender = Date.now();
  },
  reset() {
    kn.props = null, kn.isVisible = !0, kn.isHovered = !1, kn.lastRender = null;
  }
}, _P = "M2 9h20M2 15h20M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM6 12h.01", F0 = {
  render(t = {}) {
    const e = xO.SIZES[t.size] || xO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "server", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--server", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="server"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${_P}"/></svg></span>`;
  },
  getSvgPath() {
    return _P;
  }
};
({ ...F0 });
const w6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: F0
}, Symbol.toStringTag, { value: "Module" })), Sh = "footer.icon.server.tracker", vb = "2.2.0-P18EC", Ir = h({ moduleId: Sh });
function P6(t) {
  return Ir.inject(t);
}
function T6() {
  return Ir.snapshot();
}
const Co = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, gi = {
  trackRender(t) {
    Co.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Co.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Co.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Co.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Co.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Ir.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Sh }, e));
  },
  getMetrics() {
    return Object.assign({}, Co);
  },
  reset() {
    for (const t in Co) Co[t] = 0;
  }
};
function yU() {
  return gi.getMetrics();
}
function N6(t) {
  return Ir.init(), t && t.ports && Ir.inject(t.ports), { ok: !0, version: vb };
}
function S6() {
  return { status: Ir.isInitialized() ? "HEALTHY" : "DEGRADED", version: vb, moduleId: Sh, portsInitialized: Ir.isInitialized(), metrics: yU() };
}
function L6() {
  return { moduleId: Sh, version: vb, metrics: yU(), portsInitialized: Ir.isInitialized() };
}
Object.assign({}, gi, { init: N6, info: L6, healthCheck: S6, MODULE_ID: Sh, VERSION: vb, injectPorts: P6, getPorts: T6 });
const kU = "footer-icon-server-logger", A6 = g({ moduleId: kU });
function z6(t) {
  return A6.get(t);
}
function bg(t, e) {
  const n = z6("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: kU });
}
const wc = { info(...t) {
  bg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  bg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  bg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  bg("debug", Array.prototype.slice.call(t));
} };
wc.info, wc.warn, wc.error, wc.debug;
const YO = "footer-icon-server", Of = "1.0.1-ENTERPRISE";
function vP(t, ...e) {
  wc && typeof wc[t] == "function" && wc[t]("[SERVER]", ...e);
}
const my = {
  getVersion() {
    return Of;
  },
  getModuleId() {
    return YO;
  },
  async init(t = {}) {
    return vP("info", "Init"), await Om.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Om.mount(t, e);
      return fu.setProps(n.props), fu.markRender(), gi.trackMount(), gi.trackRender(n.props), n;
    } catch (n) {
      throw gi.trackError(n), vP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return fu.setProps(t), fu.markRender(), gi.trackRender(t), F0.render(t);
  },
  async unmount() {
    gi.trackUnmount();
    const t = await Om.unmount();
    return fu.reset(), t;
  },
  async destroy() {
    const t = await Om.destroy();
    return fu.reset(), gi.reset(), t;
  },
  healthCheck() {
    const t = vt.info(), e = gi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Of, timestamp: Date.now() };
  },
  info() {
    return { moduleId: YO, version: Of, lifecycle: vt.info(), metrics: gi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconServer = { getVersion: () => Of, info: () => my.info(), healthCheck: () => my.healthCheck() });
const U6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: YO,
  ServerIcon: my,
  VERSION: Of,
  default: my
}, Symbol.toStringTag, { value: "Module" })), FO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "file" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, H6 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(FO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ge = "idle", Eg = null, $P = 0;
const $t = {
  getPhase() {
    return ge;
  },
  isReady() {
    return ge === "ready" || ge === "mounted";
  },
  isMounted() {
    return ge === "mounted";
  },
  setInitializing() {
    ge = "initializing";
  },
  setReady() {
    ge = "ready";
  },
  setMounted(t) {
    ge = "mounted", Eg = t, $P++;
  },
  setUnmounting() {
    ge = "unmounting";
  },
  setDestroyed() {
    ge = "destroyed", Eg = null;
  },
  reset() {
    ge = "idle", Eg = null;
  },
  getContainer() {
    return Eg;
  },
  info() {
    return { phase: ge, isMounted: this.isMounted(), mountCount: $P };
  }
};
({ ...$t });
const Pa = "footer-icon-file-events", q0 = "1.5.0-P18EC", qO = "footer:file", $b = p({ moduleId: Pa });
function j6() {
  $b.init();
}
function fy(t) {
  return $b.get(t);
}
const ld = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function yP(t) {
  t === void 0 && (t = {}), ld.uiActions++;
  const e = fy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: qO, source: Pa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "File" }, t) });
}
const Os = { _clickHandler: null, _element: null, init() {
  j6();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    ld.clicks++, e && e(), yP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  ld.clicks++, yP({ clicked: !0, props: t });
}, emitMounted(t) {
  ld.mounts++;
  const e = fy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: qO, moduleId: Pa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  ld.unmounts++;
  const t = fy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: qO, moduleId: Pa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function Z0() {
  return Object.assign({}, ld);
}
function B6() {
  const t = $b.snapshot();
  return { moduleId: Pa, version: q0, metrics: Z0(), portsInitialized: t._initialized };
}
function V6() {
  const t = $b.snapshot(), e = fy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: q0, moduleId: Pa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: Z0() };
}
Object.assign({}, Os, { getMetrics: Z0, info: B6, healthCheck: V6, MODULE_ID: Pa, VERSION: q0 });
const Dm = {
  async init() {
    return $t.isReady() ? { success: !0, alreadyInitialized: !0 } : ($t.setInitializing(), Os.init(), $t.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = H6(e), { Template: i } = await Promise.resolve().then(() => x6);
    if (t.innerHTML = i.render(n.props), $t.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--file");
      o && Os.bindClick(o, () => Os.emitClicked(n.props));
    }
    return Os.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    $t.setUnmounting(), Os.cleanup();
    const t = $t.getContainer();
    return t && (t.innerHTML = ""), Os.emitUnmounted(), $t.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Os.destroy(), $t.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return $t.info();
  }
};
({ ...Dm });
const bn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, hu = {
  getState() {
    return { ...bn };
  },
  setProps(t) {
    bn.props = t;
  },
  getProps() {
    return bn.props;
  },
  setVisible(t) {
    bn.isVisible = !!t;
  },
  setHovered(t) {
    bn.isHovered = !!t;
  },
  markRender() {
    bn.lastRender = Date.now();
  },
  reset() {
    bn.props = null, bn.isVisible = !0, bn.isHovered = !1, bn.lastRender = null;
  }
}, kP = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6", K0 = {
  render(t = {}) {
    const e = FO.SIZES[t.size] || FO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "file", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--file", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="file"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${kP}"/></svg></span>`;
  },
  getSvgPath() {
    return kP;
  }
};
({ ...K0 });
const x6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: K0
}, Symbol.toStringTag, { value: "Module" })), Lh = "footer.icon.file.tracker", yb = "2.2.0-P18EC", Or = h({ moduleId: Lh });
function G6(t) {
  return Or.inject(t);
}
function Y6() {
  return Or.snapshot();
}
const Mo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, _i = {
  trackRender(t) {
    Mo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Mo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Mo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Mo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Mo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Or.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Lh }, e));
  },
  getMetrics() {
    return Object.assign({}, Mo);
  },
  reset() {
    for (const t in Mo) Mo[t] = 0;
  }
};
function bU() {
  return _i.getMetrics();
}
function F6(t) {
  return Or.init(), t && t.ports && Or.inject(t.ports), { ok: !0, version: yb };
}
function q6() {
  return { status: Or.isInitialized() ? "HEALTHY" : "DEGRADED", version: yb, moduleId: Lh, portsInitialized: Or.isInitialized(), metrics: bU() };
}
function Z6() {
  return { moduleId: Lh, version: yb, metrics: bU(), portsInitialized: Or.isInitialized() };
}
Object.assign({}, _i, { init: F6, info: Z6, healthCheck: q6, MODULE_ID: Lh, VERSION: yb, injectPorts: G6, getPorts: Y6 });
const EU = "footer-icon-file-logger", K6 = p({ moduleId: EU });
function W6(t) {
  return K6.get(t);
}
function Ig(t, e) {
  const n = W6("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: EU });
}
const Pc = { info(...t) {
  Ig("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Ig("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Ig("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Ig("debug", Array.prototype.slice.call(t));
} };
Pc.info, Pc.warn, Pc.error, Pc.debug;
const ZO = "footer-icon-file", Df = "1.0.1-ENTERPRISE";
function bP(t, ...e) {
  Pc && typeof Pc[t] == "function" && Pc[t]("[FILE]", ...e);
}
const hy = {
  getVersion() {
    return Df;
  },
  getModuleId() {
    return ZO;
  },
  async init(t = {}) {
    return bP("info", "Init"), await Dm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Dm.mount(t, e);
      return hu.setProps(n.props), hu.markRender(), _i.trackMount(), _i.trackRender(n.props), n;
    } catch (n) {
      throw _i.trackError(n), bP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return hu.setProps(t), hu.markRender(), _i.trackRender(t), K0.render(t);
  },
  async unmount() {
    _i.trackUnmount();
    const t = await Dm.unmount();
    return hu.reset(), t;
  },
  async destroy() {
    const t = await Dm.destroy();
    return hu.reset(), _i.reset(), t;
  },
  healthCheck() {
    const t = $t.info(), e = _i.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Df, timestamp: Date.now() };
  },
  info() {
    return { moduleId: ZO, version: Df, lifecycle: $t.info(), metrics: _i.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconFile = { getVersion: () => Df, info: () => hy.info(), healthCheck: () => hy.healthCheck() });
const J6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FileIcon: hy,
  MODULE_ID: ZO,
  VERSION: Df,
  default: hy
}, Symbol.toStringTag, { value: "Module" })), KO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "shield" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, Q6 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(KO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let _e = "idle", Og = null, EP = 0;
const yt = {
  getPhase() {
    return _e;
  },
  isReady() {
    return _e === "ready" || _e === "mounted";
  },
  isMounted() {
    return _e === "mounted";
  },
  setInitializing() {
    _e = "initializing";
  },
  setReady() {
    _e = "ready";
  },
  setMounted(t) {
    _e = "mounted", Og = t, EP++;
  },
  setUnmounting() {
    _e = "unmounting";
  },
  setDestroyed() {
    _e = "destroyed", Og = null;
  },
  reset() {
    _e = "idle", Og = null;
  },
  getContainer() {
    return Og;
  },
  info() {
    return { phase: _e, isMounted: this.isMounted(), mountCount: EP };
  }
};
({ ...yt });
const Ta = "footer-icon-shield-events", W0 = "1.5.0-P18EC", WO = "footer:shield", kb = p({ moduleId: Ta });
function X6() {
  kb.init();
}
function py(t) {
  return kb.get(t);
}
const ud = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function IP(t) {
  t === void 0 && (t = {}), ud.uiActions++;
  const e = py("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: WO, source: Ta, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Shield" }, t) });
}
const Ds = { _clickHandler: null, _element: null, init() {
  X6();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    ud.clicks++, e && e(), IP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  ud.clicks++, IP({ clicked: !0, props: t });
}, emitMounted(t) {
  ud.mounts++;
  const e = py("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: WO, moduleId: Ta, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  ud.unmounts++;
  const t = py("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: WO, moduleId: Ta, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function J0() {
  return Object.assign({}, ud);
}
function tG() {
  const t = kb.snapshot();
  return { moduleId: Ta, version: W0, metrics: J0(), portsInitialized: t._initialized };
}
function eG() {
  const t = kb.snapshot(), e = py("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: W0, moduleId: Ta, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: J0() };
}
Object.assign({}, Ds, { getMetrics: J0, info: tG, healthCheck: eG, MODULE_ID: Ta, VERSION: W0 });
const Cm = {
  async init() {
    return yt.isReady() ? { success: !0, alreadyInitialized: !0 } : (yt.setInitializing(), Ds.init(), yt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = Q6(e), { Template: i } = await Promise.resolve().then(() => nG);
    if (t.innerHTML = i.render(n.props), yt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--shield");
      o && Ds.bindClick(o, () => Ds.emitClicked(n.props));
    }
    return Ds.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    yt.setUnmounting(), Ds.cleanup();
    const t = yt.getContainer();
    return t && (t.innerHTML = ""), Ds.emitUnmounted(), yt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ds.destroy(), yt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return yt.info();
  }
};
({ ...Cm });
const En = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, pu = {
  getState() {
    return { ...En };
  },
  setProps(t) {
    En.props = t;
  },
  getProps() {
    return En.props;
  },
  setVisible(t) {
    En.isVisible = !!t;
  },
  setHovered(t) {
    En.isHovered = !!t;
  },
  markRender() {
    En.lastRender = Date.now();
  },
  reset() {
    En.props = null, En.isVisible = !0, En.isHovered = !1, En.lastRender = null;
  }
}, OP = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", Q0 = {
  render(t = {}) {
    const e = KO.SIZES[t.size] || KO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "shield", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--shield", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="shield"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${OP}"/></svg></span>`;
  },
  getSvgPath() {
    return OP;
  }
};
({ ...Q0 });
const nG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: Q0
}, Symbol.toStringTag, { value: "Module" })), Ah = "footer.icon.shield.tracker", bb = "2.2.0-P18EC", Dr = h({ moduleId: Ah });
function iG(t) {
  return Dr.inject(t);
}
function oG() {
  return Dr.snapshot();
}
const Ro = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, vi = {
  trackRender(t) {
    Ro.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Ro.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Ro.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Ro.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Ro.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Dr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Ah }, e));
  },
  getMetrics() {
    return Object.assign({}, Ro);
  },
  reset() {
    for (const t in Ro) Ro[t] = 0;
  }
};
function IU() {
  return vi.getMetrics();
}
function sG(t) {
  return Dr.init(), t && t.ports && Dr.inject(t.ports), { ok: !0, version: bb };
}
function rG() {
  return { status: Dr.isInitialized() ? "HEALTHY" : "DEGRADED", version: bb, moduleId: Ah, portsInitialized: Dr.isInitialized(), metrics: IU() };
}
function cG() {
  return { moduleId: Ah, version: bb, metrics: IU(), portsInitialized: Dr.isInitialized() };
}
Object.assign({}, vi, { init: sG, info: cG, healthCheck: rG, MODULE_ID: Ah, VERSION: bb, injectPorts: iG, getPorts: oG });
const OU = "footer-icon-shield-logger", aG = p({ moduleId: OU });
function lG(t) {
  return aG.get(t);
}
function Dg(t, e) {
  const n = lG("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: OU });
}
const Tc = { info(...t) {
  Dg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Dg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Dg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Dg("debug", Array.prototype.slice.call(t));
} };
Tc.info, Tc.warn, Tc.error, Tc.debug;
const JO = "footer-icon-shield", Cf = "1.0.1-ENTERPRISE";
function DP(t, ...e) {
  Tc && typeof Tc[t] == "function" && Tc[t]("[SHIELD]", ...e);
}
const gy = {
  getVersion() {
    return Cf;
  },
  getModuleId() {
    return JO;
  },
  async init(t = {}) {
    return DP("info", "Init"), await Cm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Cm.mount(t, e);
      return pu.setProps(n.props), pu.markRender(), vi.trackMount(), vi.trackRender(n.props), n;
    } catch (n) {
      throw vi.trackError(n), DP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return pu.setProps(t), pu.markRender(), vi.trackRender(t), Q0.render(t);
  },
  async unmount() {
    vi.trackUnmount();
    const t = await Cm.unmount();
    return pu.reset(), t;
  },
  async destroy() {
    const t = await Cm.destroy();
    return pu.reset(), vi.reset(), t;
  },
  healthCheck() {
    const t = yt.info(), e = vi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Cf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: JO, version: Cf, lifecycle: yt.info(), metrics: vi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconShield = { getVersion: () => Cf, info: () => gy.info(), healthCheck: () => gy.healthCheck() });
const uG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: JO,
  ShieldIcon: gy,
  VERSION: Cf,
  default: gy
}, Symbol.toStringTag, { value: "Module" })), QO = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "check" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, dG = (t = {}) => {
  const e = [], n = {};
  return Object.entries(QO.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ve = "idle", Cg = null, CP = 0;
const kt = {
  getPhase() {
    return ve;
  },
  isReady() {
    return ve === "ready" || ve === "mounted";
  },
  isMounted() {
    return ve === "mounted";
  },
  setInitializing() {
    ve = "initializing";
  },
  setReady() {
    ve = "ready";
  },
  setMounted(t) {
    ve = "mounted", Cg = t, CP++;
  },
  setUnmounting() {
    ve = "unmounting";
  },
  setDestroyed() {
    ve = "destroyed", Cg = null;
  },
  reset() {
    ve = "idle", Cg = null;
  },
  getContainer() {
    return Cg;
  },
  info() {
    return { phase: ve, isMounted: this.isMounted(), mountCount: CP };
  }
};
({ ...kt });
const Na = "footer-icon-check-events", X0 = "1.5.0-P18EC", XO = "footer:check", Eb = h({ moduleId: Na });
function mG() {
  Eb.init();
}
function _y(t) {
  return Eb.get(t);
}
const dd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function MP(t) {
  t === void 0 && (t = {}), dd.uiActions++;
  const e = _y("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: XO, source: Na, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Check" }, t) });
}
const Cs = { _clickHandler: null, _element: null, init() {
  mG();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    dd.clicks++, e && e(), MP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  dd.clicks++, MP({ clicked: !0, props: t });
}, emitMounted(t) {
  dd.mounts++;
  const e = _y("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: XO, moduleId: Na, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  dd.unmounts++;
  const t = _y("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: XO, moduleId: Na, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function t1() {
  return Object.assign({}, dd);
}
function fG() {
  const t = Eb.snapshot();
  return { moduleId: Na, version: X0, metrics: t1(), portsInitialized: t._initialized };
}
function hG() {
  const t = Eb.snapshot(), e = _y("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: X0, moduleId: Na, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: t1() };
}
Object.assign({}, Cs, { getMetrics: t1, info: fG, healthCheck: hG, MODULE_ID: Na, VERSION: X0 });
const Mm = {
  async init() {
    return kt.isReady() ? { success: !0, alreadyInitialized: !0 } : (kt.setInitializing(), Cs.init(), kt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = dG(e), { Template: i } = await Promise.resolve().then(() => pG);
    if (t.innerHTML = i.render(n.props), kt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--check");
      o && Cs.bindClick(o, () => Cs.emitClicked(n.props));
    }
    return Cs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    kt.setUnmounting(), Cs.cleanup();
    const t = kt.getContainer();
    return t && (t.innerHTML = ""), Cs.emitUnmounted(), kt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Cs.destroy(), kt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return kt.info();
  }
};
({ ...Mm });
const In = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, gu = {
  getState() {
    return { ...In };
  },
  setProps(t) {
    In.props = t;
  },
  getProps() {
    return In.props;
  },
  setVisible(t) {
    In.isVisible = !!t;
  },
  setHovered(t) {
    In.isHovered = !!t;
  },
  markRender() {
    In.lastRender = Date.now();
  },
  reset() {
    In.props = null, In.isVisible = !0, In.isHovered = !1, In.lastRender = null;
  }
}, RP = "M20 6L9 17l-5-5", e1 = {
  render(t = {}) {
    const e = QO.SIZES[t.size] || QO.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "check", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--check", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="check"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${RP}"/></svg></span>`;
  },
  getSvgPath() {
    return RP;
  }
};
({ ...e1 });
const pG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: e1
}, Symbol.toStringTag, { value: "Module" })), zh = "footer.icon.check.tracker", Ib = "2.2.0-P18EC", Cr = h({ moduleId: zh });
function gG(t) {
  return Cr.inject(t);
}
function _G() {
  return Cr.snapshot();
}
const wo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, $i = {
  trackRender(t) {
    wo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    wo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    wo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    wo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    wo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Cr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: zh }, e));
  },
  getMetrics() {
    return Object.assign({}, wo);
  },
  reset() {
    for (const t in wo) wo[t] = 0;
  }
};
function DU() {
  return $i.getMetrics();
}
function vG(t) {
  return Cr.init(), t && t.ports && Cr.inject(t.ports), { ok: !0, version: Ib };
}
function $G() {
  return { status: Cr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ib, moduleId: zh, portsInitialized: Cr.isInitialized(), metrics: DU() };
}
function yG() {
  return { moduleId: zh, version: Ib, metrics: DU(), portsInitialized: Cr.isInitialized() };
}
Object.assign({}, $i, { init: vG, info: yG, healthCheck: $G, MODULE_ID: zh, VERSION: Ib, injectPorts: gG, getPorts: _G });
const CU = "footer-icon-check-logger", kG = g({ moduleId: CU });
function bG(t) {
  return kG.get(t);
}
function Mg(t, e) {
  const n = bG("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: CU });
}
const Nc = { info(...t) {
  Mg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Mg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Mg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Mg("debug", Array.prototype.slice.call(t));
} };
Nc.info, Nc.warn, Nc.error, Nc.debug;
const tD = "footer-icon-check", Mf = "1.0.1-ENTERPRISE";
function wP(t, ...e) {
  Nc && typeof Nc[t] == "function" && Nc[t]("[CHECK]", ...e);
}
const vy = {
  getVersion() {
    return Mf;
  },
  getModuleId() {
    return tD;
  },
  async init(t = {}) {
    return wP("info", "Init"), await Mm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Mm.mount(t, e);
      return gu.setProps(n.props), gu.markRender(), $i.trackMount(), $i.trackRender(n.props), n;
    } catch (n) {
      throw $i.trackError(n), wP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return gu.setProps(t), gu.markRender(), $i.trackRender(t), e1.render(t);
  },
  async unmount() {
    $i.trackUnmount();
    const t = await Mm.unmount();
    return gu.reset(), t;
  },
  async destroy() {
    const t = await Mm.destroy();
    return gu.reset(), $i.reset(), t;
  },
  healthCheck() {
    const t = kt.info(), e = $i.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Mf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: tD, version: Mf, lifecycle: kt.info(), metrics: $i.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCheck = { getVersion: () => Mf, info: () => vy.info(), healthCheck: () => vy.healthCheck() });
const EG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CheckIcon: vy,
  MODULE_ID: tD,
  VERSION: Mf,
  default: vy
}, Symbol.toStringTag, { value: "Module" })), eD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "logo" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, IG = (t = {}) => {
  const e = [], n = {};
  return Object.entries(eD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let $e = "idle", Rg = null, PP = 0;
const bt = {
  getPhase() {
    return $e;
  },
  isReady() {
    return $e === "ready" || $e === "mounted";
  },
  isMounted() {
    return $e === "mounted";
  },
  setInitializing() {
    $e = "initializing";
  },
  setReady() {
    $e = "ready";
  },
  setMounted(t) {
    $e = "mounted", Rg = t, PP++;
  },
  setUnmounting() {
    $e = "unmounting";
  },
  setDestroyed() {
    $e = "destroyed", Rg = null;
  },
  reset() {
    $e = "idle", Rg = null;
  },
  getContainer() {
    return Rg;
  },
  info() {
    return { phase: $e, isMounted: this.isMounted(), mountCount: PP };
  }
};
({ ...bt });
const Sa = "footer-icon-logo-events", n1 = "1.5.0-P18EC", nD = "footer:logo", Ob = h({ moduleId: Sa });
function OG() {
  Ob.init();
}
function $y(t) {
  return Ob.get(t);
}
const md = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function TP(t) {
  t === void 0 && (t = {}), md.uiActions++;
  const e = $y("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: nD, source: Sa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Logo" }, t) });
}
const Ms = { _clickHandler: null, _element: null, init() {
  OG();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    md.clicks++, e && e(), TP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  md.clicks++, TP({ clicked: !0, props: t });
}, emitMounted(t) {
  md.mounts++;
  const e = $y("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: nD, moduleId: Sa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  md.unmounts++;
  const t = $y("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: nD, moduleId: Sa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function i1() {
  return Object.assign({}, md);
}
function DG() {
  const t = Ob.snapshot();
  return { moduleId: Sa, version: n1, metrics: i1(), portsInitialized: t._initialized };
}
function CG() {
  const t = Ob.snapshot(), e = $y("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: n1, moduleId: Sa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: i1() };
}
Object.assign({}, Ms, { getMetrics: i1, info: DG, healthCheck: CG, MODULE_ID: Sa, VERSION: n1 });
const Rm = {
  async init() {
    return bt.isReady() ? { success: !0, alreadyInitialized: !0 } : (bt.setInitializing(), Ms.init(), bt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = IG(e), { Template: i } = await Promise.resolve().then(() => MG);
    if (t.innerHTML = i.render(n.props), bt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--logo");
      o && Ms.bindClick(o, () => Ms.emitClicked(n.props));
    }
    return Ms.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    bt.setUnmounting(), Ms.cleanup();
    const t = bt.getContainer();
    return t && (t.innerHTML = ""), Ms.emitUnmounted(), bt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ms.destroy(), bt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return bt.info();
  }
};
({ ...Rm });
const On = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, _u = {
  getState() {
    return { ...On };
  },
  setProps(t) {
    On.props = t;
  },
  getProps() {
    return On.props;
  },
  setVisible(t) {
    On.isVisible = !!t;
  },
  setHovered(t) {
    On.isHovered = !!t;
  },
  markRender() {
    On.lastRender = Date.now();
  },
  reset() {
    On.props = null, On.isVisible = !0, On.isHovered = !1, On.lastRender = null;
  }
}, NP = "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", o1 = {
  render(t = {}) {
    const e = eD.SIZES[t.size] || eD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "logo", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--logo", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="logo"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${NP}"/></svg></span>`;
  },
  getSvgPath() {
    return NP;
  }
};
({ ...o1 });
const MG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: o1
}, Symbol.toStringTag, { value: "Module" })), Uh = "footer.icon.logo.tracker", Db = "2.2.0-P18EC", Mr = h({ moduleId: Uh });
function RG(t) {
  return Mr.inject(t);
}
function wG() {
  return Mr.snapshot();
}
const Po = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, yi = {
  trackRender(t) {
    Po.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Po.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Po.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Po.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Po.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Mr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Uh }, e));
  },
  getMetrics() {
    return Object.assign({}, Po);
  },
  reset() {
    for (const t in Po) Po[t] = 0;
  }
};
function MU() {
  return yi.getMetrics();
}
function PG(t) {
  return Mr.init(), t && t.ports && Mr.inject(t.ports), { ok: !0, version: Db };
}
function TG() {
  return { status: Mr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Db, moduleId: Uh, portsInitialized: Mr.isInitialized(), metrics: MU() };
}
function NG() {
  return { moduleId: Uh, version: Db, metrics: MU(), portsInitialized: Mr.isInitialized() };
}
Object.assign({}, yi, { init: PG, info: NG, healthCheck: TG, MODULE_ID: Uh, VERSION: Db, injectPorts: RG, getPorts: wG });
const RU = "footer-icon-logo-logger", SG = g({ moduleId: RU });
function LG(t) {
  return SG.get(t);
}
function wg(t, e) {
  const n = LG("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: RU });
}
const Sc = { info(...t) {
  wg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  wg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  wg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  wg("debug", Array.prototype.slice.call(t));
} };
Sc.info, Sc.warn, Sc.error, Sc.debug;
const iD = "footer-icon-logo", Rf = "1.0.1-ENTERPRISE";
function SP(t, ...e) {
  Sc && typeof Sc[t] == "function" && Sc[t]("[LOGO]", ...e);
}
const yy = {
  getVersion() {
    return Rf;
  },
  getModuleId() {
    return iD;
  },
  async init(t = {}) {
    return SP("info", "Init"), await Rm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Rm.mount(t, e);
      return _u.setProps(n.props), _u.markRender(), yi.trackMount(), yi.trackRender(n.props), n;
    } catch (n) {
      throw yi.trackError(n), SP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return _u.setProps(t), _u.markRender(), yi.trackRender(t), o1.render(t);
  },
  async unmount() {
    yi.trackUnmount();
    const t = await Rm.unmount();
    return _u.reset(), t;
  },
  async destroy() {
    const t = await Rm.destroy();
    return _u.reset(), yi.reset(), t;
  },
  healthCheck() {
    const t = bt.info(), e = yi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Rf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: iD, version: Rf, lifecycle: bt.info(), metrics: yi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconLogo = { getVersion: () => Rf, info: () => yy.info(), healthCheck: () => yy.healthCheck() });
const AG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LogoIcon: yy,
  MODULE_ID: iD,
  VERSION: Rf,
  default: yy
}, Symbol.toStringTag, { value: "Module" })), oD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "docs" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, zG = (t = {}) => {
  const e = [], n = {};
  return Object.entries(oD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ye = "idle", Pg = null, LP = 0;
const Et = {
  getPhase() {
    return ye;
  },
  isReady() {
    return ye === "ready" || ye === "mounted";
  },
  isMounted() {
    return ye === "mounted";
  },
  setInitializing() {
    ye = "initializing";
  },
  setReady() {
    ye = "ready";
  },
  setMounted(t) {
    ye = "mounted", Pg = t, LP++;
  },
  setUnmounting() {
    ye = "unmounting";
  },
  setDestroyed() {
    ye = "destroyed", Pg = null;
  },
  reset() {
    ye = "idle", Pg = null;
  },
  getContainer() {
    return Pg;
  },
  info() {
    return { phase: ye, isMounted: this.isMounted(), mountCount: LP };
  }
};
({ ...Et });
const La = "footer-icon-docs-events", s1 = "1.5.0-P18EC", sD = "footer:docs", Cb = h({ moduleId: La });
function UG() {
  Cb.init();
}
function ky(t) {
  return Cb.get(t);
}
const fd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function AP(t) {
  t === void 0 && (t = {}), fd.uiActions++;
  const e = ky("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: sD, source: La, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Docs" }, t) });
}
const Rs = { _clickHandler: null, _element: null, init() {
  UG();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    fd.clicks++, e && e(), AP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  fd.clicks++, AP({ clicked: !0, props: t });
}, emitMounted(t) {
  fd.mounts++;
  const e = ky("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: sD, moduleId: La, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  fd.unmounts++;
  const t = ky("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: sD, moduleId: La, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function r1() {
  return Object.assign({}, fd);
}
function HG() {
  const t = Cb.snapshot();
  return { moduleId: La, version: s1, metrics: r1(), portsInitialized: t._initialized };
}
function jG() {
  const t = Cb.snapshot(), e = ky("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: s1, moduleId: La, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: r1() };
}
Object.assign({}, Rs, { getMetrics: r1, info: HG, healthCheck: jG, MODULE_ID: La, VERSION: s1 });
const wm = {
  async init() {
    return Et.isReady() ? { success: !0, alreadyInitialized: !0 } : (Et.setInitializing(), Rs.init(), Et.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = zG(e), { Template: i } = await Promise.resolve().then(() => BG);
    if (t.innerHTML = i.render(n.props), Et.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--docs");
      o && Rs.bindClick(o, () => Rs.emitClicked(n.props));
    }
    return Rs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Et.setUnmounting(), Rs.cleanup();
    const t = Et.getContainer();
    return t && (t.innerHTML = ""), Rs.emitUnmounted(), Et.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Rs.destroy(), Et.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Et.info();
  }
};
({ ...wm });
const Dn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, vu = {
  getState() {
    return { ...Dn };
  },
  setProps(t) {
    Dn.props = t;
  },
  getProps() {
    return Dn.props;
  },
  setVisible(t) {
    Dn.isVisible = !!t;
  },
  setHovered(t) {
    Dn.isHovered = !!t;
  },
  markRender() {
    Dn.lastRender = Date.now();
  },
  reset() {
    Dn.props = null, Dn.isVisible = !0, Dn.isHovered = !1, Dn.lastRender = null;
  }
}, zP = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", c1 = {
  render(t = {}) {
    const e = oD.SIZES[t.size] || oD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "docs", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--docs", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="docs"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${zP}"/></svg></span>`;
  },
  getSvgPath() {
    return zP;
  }
};
({ ...c1 });
const BG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: c1
}, Symbol.toStringTag, { value: "Module" })), Hh = "footer.icon.docs.tracker", Mb = "2.2.0-P18EC", Rr = h({ moduleId: Hh });
function VG(t) {
  return Rr.inject(t);
}
function xG() {
  return Rr.snapshot();
}
const To = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, ki = {
  trackRender(t) {
    To.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    To.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    To.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    To.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    To.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Rr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Hh }, e));
  },
  getMetrics() {
    return Object.assign({}, To);
  },
  reset() {
    for (const t in To) To[t] = 0;
  }
};
function wU() {
  return ki.getMetrics();
}
function GG(t) {
  return Rr.init(), t && t.ports && Rr.inject(t.ports), { ok: !0, version: Mb };
}
function YG() {
  return { status: Rr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Mb, moduleId: Hh, portsInitialized: Rr.isInitialized(), metrics: wU() };
}
function FG() {
  return { moduleId: Hh, version: Mb, metrics: wU(), portsInitialized: Rr.isInitialized() };
}
Object.assign({}, ki, { init: GG, info: FG, healthCheck: YG, MODULE_ID: Hh, VERSION: Mb, injectPorts: VG, getPorts: xG });
const PU = "footer-icon-docs-logger", qG = g({ moduleId: PU });
function ZG(t) {
  return qG.get(t);
}
function Tg(t, e) {
  const n = ZG("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: PU });
}
const Lc = { info(...t) {
  Tg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Tg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Tg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Tg("debug", Array.prototype.slice.call(t));
} };
Lc.info, Lc.warn, Lc.error, Lc.debug;
const rD = "footer-icon-docs", wf = "1.0.1-ENTERPRISE";
function UP(t, ...e) {
  Lc && typeof Lc[t] == "function" && Lc[t]("[DOCS]", ...e);
}
const by = {
  getVersion() {
    return wf;
  },
  getModuleId() {
    return rD;
  },
  async init(t = {}) {
    return UP("info", "Init"), await wm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await wm.mount(t, e);
      return vu.setProps(n.props), vu.markRender(), ki.trackMount(), ki.trackRender(n.props), n;
    } catch (n) {
      throw ki.trackError(n), UP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return vu.setProps(t), vu.markRender(), ki.trackRender(t), c1.render(t);
  },
  async unmount() {
    ki.trackUnmount();
    const t = await wm.unmount();
    return vu.reset(), t;
  },
  async destroy() {
    const t = await wm.destroy();
    return vu.reset(), ki.reset(), t;
  },
  healthCheck() {
    const t = Et.info(), e = ki.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: wf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: rD, version: wf, lifecycle: Et.info(), metrics: ki.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDocs = { getVersion: () => wf, info: () => by.info(), healthCheck: () => by.healthCheck() });
const KG = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DocsIcon: by,
  MODULE_ID: rD,
  VERSION: wf,
  default: by
}, Symbol.toStringTag, { value: "Module" })), cD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "support" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, WG = (t = {}) => {
  const e = [], n = {};
  return Object.entries(cD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ke = "idle", Ng = null, HP = 0;
const It = {
  getPhase() {
    return ke;
  },
  isReady() {
    return ke === "ready" || ke === "mounted";
  },
  isMounted() {
    return ke === "mounted";
  },
  setInitializing() {
    ke = "initializing";
  },
  setReady() {
    ke = "ready";
  },
  setMounted(t) {
    ke = "mounted", Ng = t, HP++;
  },
  setUnmounting() {
    ke = "unmounting";
  },
  setDestroyed() {
    ke = "destroyed", Ng = null;
  },
  reset() {
    ke = "idle", Ng = null;
  },
  getContainer() {
    return Ng;
  },
  info() {
    return { phase: ke, isMounted: this.isMounted(), mountCount: HP };
  }
};
({ ...It });
const Aa = "footer-icon-support-events", a1 = "1.5.0-P18EC", aD = "footer:support", Rb = h({ moduleId: Aa });
function JG() {
  Rb.init();
}
function Ey(t) {
  return Rb.get(t);
}
const hd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function jP(t) {
  t === void 0 && (t = {}), hd.uiActions++;
  const e = Ey("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: aD, source: Aa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Support" }, t) });
}
const ws = { _clickHandler: null, _element: null, init() {
  JG();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    hd.clicks++, e && e(), jP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  hd.clicks++, jP({ clicked: !0, props: t });
}, emitMounted(t) {
  hd.mounts++;
  const e = Ey("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: aD, moduleId: Aa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  hd.unmounts++;
  const t = Ey("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: aD, moduleId: Aa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function l1() {
  return Object.assign({}, hd);
}
function QG() {
  const t = Rb.snapshot();
  return { moduleId: Aa, version: a1, metrics: l1(), portsInitialized: t._initialized };
}
function XG() {
  const t = Rb.snapshot(), e = Ey("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: a1, moduleId: Aa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: l1() };
}
Object.assign({}, ws, { getMetrics: l1, info: QG, healthCheck: XG, MODULE_ID: Aa, VERSION: a1 });
const Pm = {
  async init() {
    return It.isReady() ? { success: !0, alreadyInitialized: !0 } : (It.setInitializing(), ws.init(), It.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = WG(e), { Template: i } = await Promise.resolve().then(() => tY);
    if (t.innerHTML = i.render(n.props), It.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--support");
      o && ws.bindClick(o, () => ws.emitClicked(n.props));
    }
    return ws.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    It.setUnmounting(), ws.cleanup();
    const t = It.getContainer();
    return t && (t.innerHTML = ""), ws.emitUnmounted(), It.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ws.destroy(), It.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return It.info();
  }
};
({ ...Pm });
const Cn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, $u = {
  getState() {
    return { ...Cn };
  },
  setProps(t) {
    Cn.props = t;
  },
  getProps() {
    return Cn.props;
  },
  setVisible(t) {
    Cn.isVisible = !!t;
  },
  setHovered(t) {
    Cn.isHovered = !!t;
  },
  markRender() {
    Cn.lastRender = Date.now();
  },
  reset() {
    Cn.props = null, Cn.isVisible = !0, Cn.isHovered = !1, Cn.lastRender = null;
  }
}, BP = "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z", u1 = {
  render(t = {}) {
    const e = cD.SIZES[t.size] || cD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "support", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--support", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="support"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${BP}"/></svg></span>`;
  },
  getSvgPath() {
    return BP;
  }
};
({ ...u1 });
const tY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: u1
}, Symbol.toStringTag, { value: "Module" })), jh = "footer.icon.support.tracker", wb = "2.2.0-P18EC", wr = h({ moduleId: jh });
function eY(t) {
  return wr.inject(t);
}
function nY() {
  return wr.snapshot();
}
const No = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, bi = {
  trackRender(t) {
    No.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    No.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    No.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    No.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    No.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = wr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: jh }, e));
  },
  getMetrics() {
    return Object.assign({}, No);
  },
  reset() {
    for (const t in No) No[t] = 0;
  }
};
function TU() {
  return bi.getMetrics();
}
function iY(t) {
  return wr.init(), t && t.ports && wr.inject(t.ports), { ok: !0, version: wb };
}
function oY() {
  return { status: wr.isInitialized() ? "HEALTHY" : "DEGRADED", version: wb, moduleId: jh, portsInitialized: wr.isInitialized(), metrics: TU() };
}
function sY() {
  return { moduleId: jh, version: wb, metrics: TU(), portsInitialized: wr.isInitialized() };
}
Object.assign({}, bi, { init: iY, info: sY, healthCheck: oY, MODULE_ID: jh, VERSION: wb, injectPorts: eY, getPorts: nY });
const NU = "footer-icon-support-logger", rY = g({ moduleId: NU });
function cY(t) {
  return rY.get(t);
}
function Sg(t, e) {
  const n = cY("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: NU });
}
const Ac = { info(...t) {
  Sg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Sg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Sg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Sg("debug", Array.prototype.slice.call(t));
} };
Ac.info, Ac.warn, Ac.error, Ac.debug;
const lD = "footer-icon-support", Pf = "1.0.1-ENTERPRISE";
function VP(t, ...e) {
  Ac && typeof Ac[t] == "function" && Ac[t]("[SUPPORT]", ...e);
}
const Iy = {
  getVersion() {
    return Pf;
  },
  getModuleId() {
    return lD;
  },
  async init(t = {}) {
    return VP("info", "Init"), await Pm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Pm.mount(t, e);
      return $u.setProps(n.props), $u.markRender(), bi.trackMount(), bi.trackRender(n.props), n;
    } catch (n) {
      throw bi.trackError(n), VP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return $u.setProps(t), $u.markRender(), bi.trackRender(t), u1.render(t);
  },
  async unmount() {
    bi.trackUnmount();
    const t = await Pm.unmount();
    return $u.reset(), t;
  },
  async destroy() {
    const t = await Pm.destroy();
    return $u.reset(), bi.reset(), t;
  },
  healthCheck() {
    const t = It.info(), e = bi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Pf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: lD, version: Pf, lifecycle: It.info(), metrics: bi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconSupport = { getVersion: () => Pf, info: () => Iy.info(), healthCheck: () => Iy.healthCheck() });
const aY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: lD,
  SupportIcon: Iy,
  VERSION: Pf,
  default: Iy
}, Symbol.toStringTag, { value: "Module" })), uD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "status" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, lY = (t = {}) => {
  const e = [], n = {};
  return Object.entries(uD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let be = "idle", Lg = null, xP = 0;
const Ot = {
  getPhase() {
    return be;
  },
  isReady() {
    return be === "ready" || be === "mounted";
  },
  isMounted() {
    return be === "mounted";
  },
  setInitializing() {
    be = "initializing";
  },
  setReady() {
    be = "ready";
  },
  setMounted(t) {
    be = "mounted", Lg = t, xP++;
  },
  setUnmounting() {
    be = "unmounting";
  },
  setDestroyed() {
    be = "destroyed", Lg = null;
  },
  reset() {
    be = "idle", Lg = null;
  },
  getContainer() {
    return Lg;
  },
  info() {
    return { phase: be, isMounted: this.isMounted(), mountCount: xP };
  }
};
({ ...Ot });
const za = "footer-icon-status-events", d1 = "1.5.0-P18EC", dD = "footer:status", Pb = h({ moduleId: za });
function uY() {
  Pb.init();
}
function Oy(t) {
  return Pb.get(t);
}
const pd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function GP(t) {
  t === void 0 && (t = {}), pd.uiActions++;
  const e = Oy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: dD, source: za, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Status" }, t) });
}
const Ps = { _clickHandler: null, _element: null, init() {
  uY();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    pd.clicks++, e && e(), GP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  pd.clicks++, GP({ clicked: !0, props: t });
}, emitMounted(t) {
  pd.mounts++;
  const e = Oy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: dD, moduleId: za, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  pd.unmounts++;
  const t = Oy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: dD, moduleId: za, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function m1() {
  return Object.assign({}, pd);
}
function dY() {
  const t = Pb.snapshot();
  return { moduleId: za, version: d1, metrics: m1(), portsInitialized: t._initialized };
}
function mY() {
  const t = Pb.snapshot(), e = Oy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: d1, moduleId: za, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: m1() };
}
Object.assign({}, Ps, { getMetrics: m1, info: dY, healthCheck: mY, MODULE_ID: za, VERSION: d1 });
const Tm = {
  async init() {
    return Ot.isReady() ? { success: !0, alreadyInitialized: !0 } : (Ot.setInitializing(), Ps.init(), Ot.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = lY(e), { Template: i } = await Promise.resolve().then(() => fY);
    if (t.innerHTML = i.render(n.props), Ot.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--status");
      o && Ps.bindClick(o, () => Ps.emitClicked(n.props));
    }
    return Ps.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Ot.setUnmounting(), Ps.cleanup();
    const t = Ot.getContainer();
    return t && (t.innerHTML = ""), Ps.emitUnmounted(), Ot.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ps.destroy(), Ot.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Ot.info();
  }
};
({ ...Tm });
const Mn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, yu = {
  getState() {
    return { ...Mn };
  },
  setProps(t) {
    Mn.props = t;
  },
  getProps() {
    return Mn.props;
  },
  setVisible(t) {
    Mn.isVisible = !!t;
  },
  setHovered(t) {
    Mn.isHovered = !!t;
  },
  markRender() {
    Mn.lastRender = Date.now();
  },
  reset() {
    Mn.props = null, Mn.isVisible = !0, Mn.isHovered = !1, Mn.lastRender = null;
  }
}, YP = "M22 12h-4l-3 9L9 3l-3 9H2", f1 = {
  render(t = {}) {
    const e = uD.SIZES[t.size] || uD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "status", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--status", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="status"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${YP}"/></svg></span>`;
  },
  getSvgPath() {
    return YP;
  }
};
({ ...f1 });
const fY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: f1
}, Symbol.toStringTag, { value: "Module" })), Bh = "footer.icon.status.tracker", Tb = "2.2.0-P18EC", Pr = h({ moduleId: Bh });
function hY(t) {
  return Pr.inject(t);
}
function pY() {
  return Pr.snapshot();
}
const So = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ei = {
  trackRender(t) {
    So.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    So.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    So.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    So.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    So.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Pr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Bh }, e));
  },
  getMetrics() {
    return Object.assign({}, So);
  },
  reset() {
    for (const t in So) So[t] = 0;
  }
};
function SU() {
  return Ei.getMetrics();
}
function gY(t) {
  return Pr.init(), t && t.ports && Pr.inject(t.ports), { ok: !0, version: Tb };
}
function _Y() {
  return { status: Pr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Tb, moduleId: Bh, portsInitialized: Pr.isInitialized(), metrics: SU() };
}
function vY() {
  return { moduleId: Bh, version: Tb, metrics: SU(), portsInitialized: Pr.isInitialized() };
}
Object.assign({}, Ei, { init: gY, info: vY, healthCheck: _Y, MODULE_ID: Bh, VERSION: Tb, injectPorts: hY, getPorts: pY });
const LU = "footer-icon-status-logger", $Y = g({ moduleId: LU });
function yY(t) {
  return $Y.get(t);
}
function Ag(t, e) {
  const n = yY("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: LU });
}
const zc = { info(...t) {
  Ag("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Ag("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Ag("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Ag("debug", Array.prototype.slice.call(t));
} };
zc.info, zc.warn, zc.error, zc.debug;
const mD = "footer-icon-status", Tf = "1.0.1-ENTERPRISE";
function FP(t, ...e) {
  zc && typeof zc[t] == "function" && zc[t]("[STATUS]", ...e);
}
const Dy = {
  getVersion() {
    return Tf;
  },
  getModuleId() {
    return mD;
  },
  async init(t = {}) {
    return FP("info", "Init"), await Tm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Tm.mount(t, e);
      return yu.setProps(n.props), yu.markRender(), Ei.trackMount(), Ei.trackRender(n.props), n;
    } catch (n) {
      throw Ei.trackError(n), FP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return yu.setProps(t), yu.markRender(), Ei.trackRender(t), f1.render(t);
  },
  async unmount() {
    Ei.trackUnmount();
    const t = await Tm.unmount();
    return yu.reset(), t;
  },
  async destroy() {
    const t = await Tm.destroy();
    return yu.reset(), Ei.reset(), t;
  },
  healthCheck() {
    const t = Ot.info(), e = Ei.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Tf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: mD, version: Tf, lifecycle: Ot.info(), metrics: Ei.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconStatus = { getVersion: () => Tf, info: () => Dy.info(), healthCheck: () => Dy.healthCheck() });
const kY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: mD,
  StatusIcon: Dy,
  VERSION: Tf,
  default: Dy
}, Symbol.toStringTag, { value: "Module" })), fD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "database" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, bY = (t = {}) => {
  const e = [], n = {};
  return Object.entries(fD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ee = "idle", zg = null, qP = 0;
const Dt = {
  getPhase() {
    return Ee;
  },
  isReady() {
    return Ee === "ready" || Ee === "mounted";
  },
  isMounted() {
    return Ee === "mounted";
  },
  setInitializing() {
    Ee = "initializing";
  },
  setReady() {
    Ee = "ready";
  },
  setMounted(t) {
    Ee = "mounted", zg = t, qP++;
  },
  setUnmounting() {
    Ee = "unmounting";
  },
  setDestroyed() {
    Ee = "destroyed", zg = null;
  },
  reset() {
    Ee = "idle", zg = null;
  },
  getContainer() {
    return zg;
  },
  info() {
    return { phase: Ee, isMounted: this.isMounted(), mountCount: qP };
  }
};
({ ...Dt });
const Ua = "footer-icon-database-events", h1 = "1.5.0-P18EC", hD = "footer:database", Nb = h({ moduleId: Ua });
function EY() {
  Nb.init();
}
function Cy(t) {
  return Nb.get(t);
}
const gd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function ZP(t) {
  t === void 0 && (t = {}), gd.uiActions++;
  const e = Cy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: hD, source: Ua, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Database" }, t) });
}
const Ts = { _clickHandler: null, _element: null, init() {
  EY();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    gd.clicks++, e && e(), ZP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  gd.clicks++, ZP({ clicked: !0, props: t });
}, emitMounted(t) {
  gd.mounts++;
  const e = Cy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: hD, moduleId: Ua, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  gd.unmounts++;
  const t = Cy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: hD, moduleId: Ua, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function p1() {
  return Object.assign({}, gd);
}
function IY() {
  const t = Nb.snapshot();
  return { moduleId: Ua, version: h1, metrics: p1(), portsInitialized: t._initialized };
}
function OY() {
  const t = Nb.snapshot(), e = Cy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: h1, moduleId: Ua, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: p1() };
}
Object.assign({}, Ts, { getMetrics: p1, info: IY, healthCheck: OY, MODULE_ID: Ua, VERSION: h1 });
const Nm = {
  async init() {
    return Dt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Dt.setInitializing(), Ts.init(), Dt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = bY(e), { Template: i } = await Promise.resolve().then(() => DY);
    if (t.innerHTML = i.render(n.props), Dt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--database");
      o && Ts.bindClick(o, () => Ts.emitClicked(n.props));
    }
    return Ts.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Dt.setUnmounting(), Ts.cleanup();
    const t = Dt.getContainer();
    return t && (t.innerHTML = ""), Ts.emitUnmounted(), Dt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ts.destroy(), Dt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Dt.info();
  }
};
({ ...Nm });
const Rn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, ku = {
  getState() {
    return { ...Rn };
  },
  setProps(t) {
    Rn.props = t;
  },
  getProps() {
    return Rn.props;
  },
  setVisible(t) {
    Rn.isVisible = !!t;
  },
  setHovered(t) {
    Rn.isHovered = !!t;
  },
  markRender() {
    Rn.lastRender = Date.now();
  },
  reset() {
    Rn.props = null, Rn.isVisible = !0, Rn.isHovered = !1, Rn.lastRender = null;
  }
}, KP = "M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zM2 11.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5M2 6.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5", g1 = {
  render(t = {}) {
    const e = fD.SIZES[t.size] || fD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "database", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--database", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="database"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${KP}"/></svg></span>`;
  },
  getSvgPath() {
    return KP;
  }
};
({ ...g1 });
const DY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: g1
}, Symbol.toStringTag, { value: "Module" })), Vh = "footer.icon.database.tracker", Sb = "2.2.0-P18EC", Tr = h({ moduleId: Vh });
function CY(t) {
  return Tr.inject(t);
}
function MY() {
  return Tr.snapshot();
}
const Lo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ii = {
  trackRender(t) {
    Lo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Lo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Lo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Lo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Lo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Tr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Vh }, e));
  },
  getMetrics() {
    return Object.assign({}, Lo);
  },
  reset() {
    for (const t in Lo) Lo[t] = 0;
  }
};
function AU() {
  return Ii.getMetrics();
}
function RY(t) {
  return Tr.init(), t && t.ports && Tr.inject(t.ports), { ok: !0, version: Sb };
}
function wY() {
  return { status: Tr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Sb, moduleId: Vh, portsInitialized: Tr.isInitialized(), metrics: AU() };
}
function PY() {
  return { moduleId: Vh, version: Sb, metrics: AU(), portsInitialized: Tr.isInitialized() };
}
Object.assign({}, Ii, { init: RY, info: PY, healthCheck: wY, MODULE_ID: Vh, VERSION: Sb, injectPorts: CY, getPorts: MY });
const zU = "footer-icon-database-logger", TY = g({ moduleId: zU });
function NY(t) {
  return TY.get(t);
}
function Ug(t, e) {
  const n = NY("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: zU });
}
const Uc = { info(...t) {
  Ug("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Ug("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Ug("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Ug("debug", Array.prototype.slice.call(t));
} };
Uc.info, Uc.warn, Uc.error, Uc.debug;
const pD = "footer-icon-database", Nf = "1.0.1-ENTERPRISE";
function WP(t, ...e) {
  Uc && typeof Uc[t] == "function" && Uc[t]("[DATABASE]", ...e);
}
const My = {
  getVersion() {
    return Nf;
  },
  getModuleId() {
    return pD;
  },
  async init(t = {}) {
    return WP("info", "Init"), await Nm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Nm.mount(t, e);
      return ku.setProps(n.props), ku.markRender(), Ii.trackMount(), Ii.trackRender(n.props), n;
    } catch (n) {
      throw Ii.trackError(n), WP("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return ku.setProps(t), ku.markRender(), Ii.trackRender(t), g1.render(t);
  },
  async unmount() {
    Ii.trackUnmount();
    const t = await Nm.unmount();
    return ku.reset(), t;
  },
  async destroy() {
    const t = await Nm.destroy();
    return ku.reset(), Ii.reset(), t;
  },
  healthCheck() {
    const t = Dt.info(), e = Ii.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Nf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: pD, version: Nf, lifecycle: Dt.info(), metrics: Ii.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDatabase = { getVersion: () => Nf, info: () => My.info(), healthCheck: () => My.healthCheck() });
const SY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DatabaseIcon: My,
  MODULE_ID: pD,
  VERSION: Nf,
  default: My
}, Symbol.toStringTag, { value: "Module" })), gD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "api" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, LY = (t = {}) => {
  const e = [], n = {};
  return Object.entries(gD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ie = "idle", Hg = null, JP = 0;
const Ct = {
  getPhase() {
    return Ie;
  },
  isReady() {
    return Ie === "ready" || Ie === "mounted";
  },
  isMounted() {
    return Ie === "mounted";
  },
  setInitializing() {
    Ie = "initializing";
  },
  setReady() {
    Ie = "ready";
  },
  setMounted(t) {
    Ie = "mounted", Hg = t, JP++;
  },
  setUnmounting() {
    Ie = "unmounting";
  },
  setDestroyed() {
    Ie = "destroyed", Hg = null;
  },
  reset() {
    Ie = "idle", Hg = null;
  },
  getContainer() {
    return Hg;
  },
  info() {
    return { phase: Ie, isMounted: this.isMounted(), mountCount: JP };
  }
};
({ ...Ct });
const Ha = "footer-icon-api-events", _1 = "1.5.0-P18EC", _D = "footer:api", Lb = p({ moduleId: Ha });
function AY() {
  Lb.init();
}
function Ry(t) {
  return Lb.get(t);
}
const _d = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function QP(t) {
  t === void 0 && (t = {}), _d.uiActions++;
  const e = Ry("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: _D, source: Ha, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Api" }, t) });
}
const Ns = { _clickHandler: null, _element: null, init() {
  AY();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    _d.clicks++, e && e(), QP({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  _d.clicks++, QP({ clicked: !0, props: t });
}, emitMounted(t) {
  _d.mounts++;
  const e = Ry("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: _D, moduleId: Ha, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  _d.unmounts++;
  const t = Ry("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: _D, moduleId: Ha, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function v1() {
  return Object.assign({}, _d);
}
function zY() {
  const t = Lb.snapshot();
  return { moduleId: Ha, version: _1, metrics: v1(), portsInitialized: t._initialized };
}
function UY() {
  const t = Lb.snapshot(), e = Ry("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: _1, moduleId: Ha, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: v1() };
}
Object.assign({}, Ns, { getMetrics: v1, info: zY, healthCheck: UY, MODULE_ID: Ha, VERSION: _1 });
const Sm = {
  async init() {
    return Ct.isReady() ? { success: !0, alreadyInitialized: !0 } : (Ct.setInitializing(), Ns.init(), Ct.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = LY(e), { Template: i } = await Promise.resolve().then(() => HY);
    if (t.innerHTML = i.render(n.props), Ct.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--api");
      o && Ns.bindClick(o, () => Ns.emitClicked(n.props));
    }
    return Ns.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Ct.setUnmounting(), Ns.cleanup();
    const t = Ct.getContainer();
    return t && (t.innerHTML = ""), Ns.emitUnmounted(), Ct.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ns.destroy(), Ct.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Ct.info();
  }
};
({ ...Sm });
const wn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, bu = {
  getState() {
    return { ...wn };
  },
  setProps(t) {
    wn.props = t;
  },
  getProps() {
    return wn.props;
  },
  setVisible(t) {
    wn.isVisible = !!t;
  },
  setHovered(t) {
    wn.isHovered = !!t;
  },
  markRender() {
    wn.lastRender = Date.now();
  },
  reset() {
    wn.props = null, wn.isVisible = !0, wn.isHovered = !1, wn.lastRender = null;
  }
}, XP = "M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34M18 2l4 4-4 4M22 6H12", $1 = {
  render(t = {}) {
    const e = gD.SIZES[t.size] || gD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "api", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--api", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="api"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${XP}"/></svg></span>`;
  },
  getSvgPath() {
    return XP;
  }
};
({ ...$1 });
const HY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: $1
}, Symbol.toStringTag, { value: "Module" })), xh = "footer.icon.api.tracker", Ab = "2.2.0-P18EC", Nr = h({ moduleId: xh });
function jY(t) {
  return Nr.inject(t);
}
function BY() {
  return Nr.snapshot();
}
const Ao = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Oi = {
  trackRender(t) {
    Ao.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Ao.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Ao.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Ao.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Ao.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Nr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: xh }, e));
  },
  getMetrics() {
    return Object.assign({}, Ao);
  },
  reset() {
    for (const t in Ao) Ao[t] = 0;
  }
};
function UU() {
  return Oi.getMetrics();
}
function VY(t) {
  return Nr.init(), t && t.ports && Nr.inject(t.ports), { ok: !0, version: Ab };
}
function xY() {
  return { status: Nr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ab, moduleId: xh, portsInitialized: Nr.isInitialized(), metrics: UU() };
}
function GY() {
  return { moduleId: xh, version: Ab, metrics: UU(), portsInitialized: Nr.isInitialized() };
}
Object.assign({}, Oi, { init: VY, info: GY, healthCheck: xY, MODULE_ID: xh, VERSION: Ab, injectPorts: jY, getPorts: BY });
const HU = "footer-icon-api-logger", YY = p({ moduleId: HU });
function FY(t) {
  return YY.get(t);
}
function jg(t, e) {
  const n = FY("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: HU });
}
const Hc = { info(...t) {
  jg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  jg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  jg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  jg("debug", Array.prototype.slice.call(t));
} };
Hc.info, Hc.warn, Hc.error, Hc.debug;
const vD = "footer-icon-api", Sf = "1.0.1-ENTERPRISE";
function tT(t, ...e) {
  Hc && typeof Hc[t] == "function" && Hc[t]("[API]", ...e);
}
const wy = {
  getVersion() {
    return Sf;
  },
  getModuleId() {
    return vD;
  },
  async init(t = {}) {
    return tT("info", "Init"), await Sm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Sm.mount(t, e);
      return bu.setProps(n.props), bu.markRender(), Oi.trackMount(), Oi.trackRender(n.props), n;
    } catch (n) {
      throw Oi.trackError(n), tT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return bu.setProps(t), bu.markRender(), Oi.trackRender(t), $1.render(t);
  },
  async unmount() {
    Oi.trackUnmount();
    const t = await Sm.unmount();
    return bu.reset(), t;
  },
  async destroy() {
    const t = await Sm.destroy();
    return bu.reset(), Oi.reset(), t;
  },
  healthCheck() {
    const t = Ct.info(), e = Oi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Sf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: vD, version: Sf, lifecycle: Ct.info(), metrics: Oi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconApi = { getVersion: () => Sf, info: () => wy.info(), healthCheck: () => wy.healthCheck() });
const qY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ApiIcon: wy,
  MODULE_ID: vD,
  VERSION: Sf,
  default: wy
}, Symbol.toStringTag, { value: "Module" })), $D = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "pipedrive" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, ZY = (t = {}) => {
  const e = [], n = {};
  return Object.entries($D.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Oe = "idle", Bg = null, eT = 0;
const Mt = {
  getPhase() {
    return Oe;
  },
  isReady() {
    return Oe === "ready" || Oe === "mounted";
  },
  isMounted() {
    return Oe === "mounted";
  },
  setInitializing() {
    Oe = "initializing";
  },
  setReady() {
    Oe = "ready";
  },
  setMounted(t) {
    Oe = "mounted", Bg = t, eT++;
  },
  setUnmounting() {
    Oe = "unmounting";
  },
  setDestroyed() {
    Oe = "destroyed", Bg = null;
  },
  reset() {
    Oe = "idle", Bg = null;
  },
  getContainer() {
    return Bg;
  },
  info() {
    return { phase: Oe, isMounted: this.isMounted(), mountCount: eT };
  }
};
({ ...Mt });
const ja = "footer-icon-pipedrive-events", y1 = "1.5.0-P18EC", yD = "footer:pipedrive", zb = h({ moduleId: ja });
function KY() {
  zb.init();
}
function Py(t) {
  return zb.get(t);
}
const vd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function nT(t) {
  t === void 0 && (t = {}), vd.uiActions++;
  const e = Py("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: yD, source: ja, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Pipedrive" }, t) });
}
const Ss = { _clickHandler: null, _element: null, init() {
  KY();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    vd.clicks++, e && e(), nT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  vd.clicks++, nT({ clicked: !0, props: t });
}, emitMounted(t) {
  vd.mounts++;
  const e = Py("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: yD, moduleId: ja, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  vd.unmounts++;
  const t = Py("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: yD, moduleId: ja, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function k1() {
  return Object.assign({}, vd);
}
function WY() {
  const t = zb.snapshot();
  return { moduleId: ja, version: y1, metrics: k1(), portsInitialized: t._initialized };
}
function JY() {
  const t = zb.snapshot(), e = Py("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: y1, moduleId: ja, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: k1() };
}
Object.assign({}, Ss, { getMetrics: k1, info: WY, healthCheck: JY, MODULE_ID: ja, VERSION: y1 });
const Lm = {
  async init() {
    return Mt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Mt.setInitializing(), Ss.init(), Mt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = ZY(e), { Template: i } = await Promise.resolve().then(() => QY);
    if (t.innerHTML = i.render(n.props), Mt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--pipedrive");
      o && Ss.bindClick(o, () => Ss.emitClicked(n.props));
    }
    return Ss.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Mt.setUnmounting(), Ss.cleanup();
    const t = Mt.getContainer();
    return t && (t.innerHTML = ""), Ss.emitUnmounted(), Mt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ss.destroy(), Mt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Mt.info();
  }
};
({ ...Lm });
const Pn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Eu = {
  getState() {
    return { ...Pn };
  },
  setProps(t) {
    Pn.props = t;
  },
  getProps() {
    return Pn.props;
  },
  setVisible(t) {
    Pn.isVisible = !!t;
  },
  setHovered(t) {
    Pn.isHovered = !!t;
  },
  markRender() {
    Pn.lastRender = Date.now();
  },
  reset() {
    Pn.props = null, Pn.isVisible = !0, Pn.isHovered = !1, Pn.lastRender = null;
  }
}, iT = "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", b1 = {
  render(t = {}) {
    const e = $D.SIZES[t.size] || $D.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "pipedrive", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--pipedrive", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="pipedrive"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${iT}"/></svg></span>`;
  },
  getSvgPath() {
    return iT;
  }
};
({ ...b1 });
const QY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: b1
}, Symbol.toStringTag, { value: "Module" })), Gh = "footer.icon.pipedrive.tracker", Ub = "2.2.0-P18EC", Sr = h({ moduleId: Gh });
function XY(t) {
  return Sr.inject(t);
}
function t7() {
  return Sr.snapshot();
}
const zo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Di = {
  trackRender(t) {
    zo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    zo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    zo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    zo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    zo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Sr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Gh }, e));
  },
  getMetrics() {
    return Object.assign({}, zo);
  },
  reset() {
    for (const t in zo) zo[t] = 0;
  }
};
function jU() {
  return Di.getMetrics();
}
function e7(t) {
  return Sr.init(), t && t.ports && Sr.inject(t.ports), { ok: !0, version: Ub };
}
function n7() {
  return { status: Sr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ub, moduleId: Gh, portsInitialized: Sr.isInitialized(), metrics: jU() };
}
function i7() {
  return { moduleId: Gh, version: Ub, metrics: jU(), portsInitialized: Sr.isInitialized() };
}
Object.assign({}, Di, { init: e7, info: i7, healthCheck: n7, MODULE_ID: Gh, VERSION: Ub, injectPorts: XY, getPorts: t7 });
const BU = "footer-icon-pipedrive-logger", o7 = g({ moduleId: BU });
function s7(t) {
  return o7.get(t);
}
function Vg(t, e) {
  const n = s7("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: BU });
}
const jc = { info(...t) {
  Vg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Vg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Vg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Vg("debug", Array.prototype.slice.call(t));
} };
jc.info, jc.warn, jc.error, jc.debug;
const kD = "footer-icon-pipedrive", Lf = "1.0.1-ENTERPRISE";
function oT(t, ...e) {
  jc && typeof jc[t] == "function" && jc[t]("[PIPEDRIVE]", ...e);
}
const Ty = {
  getVersion() {
    return Lf;
  },
  getModuleId() {
    return kD;
  },
  async init(t = {}) {
    return oT("info", "Init"), await Lm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Lm.mount(t, e);
      return Eu.setProps(n.props), Eu.markRender(), Di.trackMount(), Di.trackRender(n.props), n;
    } catch (n) {
      throw Di.trackError(n), oT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Eu.setProps(t), Eu.markRender(), Di.trackRender(t), b1.render(t);
  },
  async unmount() {
    Di.trackUnmount();
    const t = await Lm.unmount();
    return Eu.reset(), t;
  },
  async destroy() {
    const t = await Lm.destroy();
    return Eu.reset(), Di.reset(), t;
  },
  healthCheck() {
    const t = Mt.info(), e = Di.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Lf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: kD, version: Lf, lifecycle: Mt.info(), metrics: Di.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconPipedrive = { getVersion: () => Lf, info: () => Ty.info(), healthCheck: () => Ty.healthCheck() });
const r7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: kD,
  PipedriveIcon: Ty,
  VERSION: Lf,
  default: Ty
}, Symbol.toStringTag, { value: "Module" })), bD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "financial" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, c7 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(bD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let De = "idle", xg = null, sT = 0;
const Rt = {
  getPhase() {
    return De;
  },
  isReady() {
    return De === "ready" || De === "mounted";
  },
  isMounted() {
    return De === "mounted";
  },
  setInitializing() {
    De = "initializing";
  },
  setReady() {
    De = "ready";
  },
  setMounted(t) {
    De = "mounted", xg = t, sT++;
  },
  setUnmounting() {
    De = "unmounting";
  },
  setDestroyed() {
    De = "destroyed", xg = null;
  },
  reset() {
    De = "idle", xg = null;
  },
  getContainer() {
    return xg;
  },
  info() {
    return { phase: De, isMounted: this.isMounted(), mountCount: sT };
  }
};
({ ...Rt });
const Ba = "footer-icon-financial-events", E1 = "1.5.0-P18EC", ED = "footer:financial", Hb = p({ moduleId: Ba });
function a7() {
  Hb.init();
}
function Ny(t) {
  return Hb.get(t);
}
const $d = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function rT(t) {
  t === void 0 && (t = {}), $d.uiActions++;
  const e = Ny("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: ED, source: Ba, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Financial" }, t) });
}
const Ls = { _clickHandler: null, _element: null, init() {
  a7();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    $d.clicks++, e && e(), rT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  $d.clicks++, rT({ clicked: !0, props: t });
}, emitMounted(t) {
  $d.mounts++;
  const e = Ny("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: ED, moduleId: Ba, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  $d.unmounts++;
  const t = Ny("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: ED, moduleId: Ba, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function I1() {
  return Object.assign({}, $d);
}
function l7() {
  const t = Hb.snapshot();
  return { moduleId: Ba, version: E1, metrics: I1(), portsInitialized: t._initialized };
}
function u7() {
  const t = Hb.snapshot(), e = Ny("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: E1, moduleId: Ba, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: I1() };
}
Object.assign({}, Ls, { getMetrics: I1, info: l7, healthCheck: u7, MODULE_ID: Ba, VERSION: E1 });
const Am = {
  async init() {
    return Rt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Rt.setInitializing(), Ls.init(), Rt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = c7(e), { Template: i } = await Promise.resolve().then(() => d7);
    if (t.innerHTML = i.render(n.props), Rt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--financial");
      o && Ls.bindClick(o, () => Ls.emitClicked(n.props));
    }
    return Ls.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Rt.setUnmounting(), Ls.cleanup();
    const t = Rt.getContainer();
    return t && (t.innerHTML = ""), Ls.emitUnmounted(), Rt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ls.destroy(), Rt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Rt.info();
  }
};
({ ...Am });
const Tn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Iu = {
  getState() {
    return { ...Tn };
  },
  setProps(t) {
    Tn.props = t;
  },
  getProps() {
    return Tn.props;
  },
  setVisible(t) {
    Tn.isVisible = !!t;
  },
  setHovered(t) {
    Tn.isHovered = !!t;
  },
  markRender() {
    Tn.lastRender = Date.now();
  },
  reset() {
    Tn.props = null, Tn.isVisible = !0, Tn.isHovered = !1, Tn.lastRender = null;
  }
}, cT = "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", O1 = {
  render(t = {}) {
    const e = bD.SIZES[t.size] || bD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "financial", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--financial", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="financial"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${cT}"/></svg></span>`;
  },
  getSvgPath() {
    return cT;
  }
};
({ ...O1 });
const d7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: O1
}, Symbol.toStringTag, { value: "Module" })), Yh = "footer.icon.financial.tracker", jb = "2.2.0-P18EC", Lr = h({ moduleId: Yh });
function m7(t) {
  return Lr.inject(t);
}
function f7() {
  return Lr.snapshot();
}
const Uo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ci = {
  trackRender(t) {
    Uo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Uo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Uo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Uo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Uo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Lr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Yh }, e));
  },
  getMetrics() {
    return Object.assign({}, Uo);
  },
  reset() {
    for (const t in Uo) Uo[t] = 0;
  }
};
function VU() {
  return Ci.getMetrics();
}
function h7(t) {
  return Lr.init(), t && t.ports && Lr.inject(t.ports), { ok: !0, version: jb };
}
function p7() {
  return { status: Lr.isInitialized() ? "HEALTHY" : "DEGRADED", version: jb, moduleId: Yh, portsInitialized: Lr.isInitialized(), metrics: VU() };
}
function g7() {
  return { moduleId: Yh, version: jb, metrics: VU(), portsInitialized: Lr.isInitialized() };
}
Object.assign({}, Ci, { init: h7, info: g7, healthCheck: p7, MODULE_ID: Yh, VERSION: jb, injectPorts: m7, getPorts: f7 });
const xU = "footer-icon-financial-logger", _7 = p({ moduleId: xU });
function v7(t) {
  return _7.get(t);
}
function Gg(t, e) {
  const n = v7("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: xU });
}
const Bc = { info(...t) {
  Gg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Gg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Gg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Gg("debug", Array.prototype.slice.call(t));
} };
Bc.info, Bc.warn, Bc.error, Bc.debug;
const ID = "footer-icon-financial", Af = "1.0.1-ENTERPRISE";
function aT(t, ...e) {
  Bc && typeof Bc[t] == "function" && Bc[t]("[FINANCIAL]", ...e);
}
const Sy = {
  getVersion() {
    return Af;
  },
  getModuleId() {
    return ID;
  },
  async init(t = {}) {
    return aT("info", "Init"), await Am.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Am.mount(t, e);
      return Iu.setProps(n.props), Iu.markRender(), Ci.trackMount(), Ci.trackRender(n.props), n;
    } catch (n) {
      throw Ci.trackError(n), aT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Iu.setProps(t), Iu.markRender(), Ci.trackRender(t), O1.render(t);
  },
  async unmount() {
    Ci.trackUnmount();
    const t = await Am.unmount();
    return Iu.reset(), t;
  },
  async destroy() {
    const t = await Am.destroy();
    return Iu.reset(), Ci.reset(), t;
  },
  healthCheck() {
    const t = Rt.info(), e = Ci.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Af, timestamp: Date.now() };
  },
  info() {
    return { moduleId: ID, version: Af, lifecycle: Rt.info(), metrics: Ci.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconFinancial = { getVersion: () => Af, info: () => Sy.info(), healthCheck: () => Sy.healthCheck() });
const $7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FinancialIcon: Sy,
  MODULE_ID: ID,
  VERSION: Af,
  default: Sy
}, Symbol.toStringTag, { value: "Module" })), OD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "status-mode" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, y7 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(OD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ce = "idle", Yg = null, lT = 0;
const tt = {
  getPhase() {
    return Ce;
  },
  isReady() {
    return Ce === "ready" || Ce === "mounted";
  },
  isMounted() {
    return Ce === "mounted";
  },
  setInitializing() {
    Ce = "initializing";
  },
  setReady() {
    Ce = "ready";
  },
  setMounted(t) {
    Ce = "mounted", Yg = t, lT++;
  },
  setUnmounting() {
    Ce = "unmounting";
  },
  setDestroyed() {
    Ce = "destroyed", Yg = null;
  },
  reset() {
    Ce = "idle", Yg = null;
  },
  getContainer() {
    return Yg;
  },
  info() {
    return { phase: Ce, isMounted: this.isMounted(), mountCount: lT };
  }
};
({ ...tt });
const Va = "footer-icon-status-mode-events", D1 = "1.5.0-P18EC", DD = "footer:status-mode", Bb = h({ moduleId: Va });
function k7() {
  Bb.init();
}
function Ly(t) {
  return Bb.get(t);
}
const yd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function uT(t) {
  t === void 0 && (t = {}), yd.uiActions++;
  const e = Ly("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: DD, source: Va, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "StatusMode" }, t) });
}
const As = { _clickHandler: null, _element: null, init() {
  k7();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    yd.clicks++, e && e(), uT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  yd.clicks++, uT({ clicked: !0, props: t });
}, emitMounted(t) {
  yd.mounts++;
  const e = Ly("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: DD, moduleId: Va, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  yd.unmounts++;
  const t = Ly("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: DD, moduleId: Va, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function C1() {
  return Object.assign({}, yd);
}
function b7() {
  const t = Bb.snapshot();
  return { moduleId: Va, version: D1, metrics: C1(), portsInitialized: t._initialized };
}
function E7() {
  const t = Bb.snapshot(), e = Ly("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: D1, moduleId: Va, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: C1() };
}
Object.assign({}, As, { getMetrics: C1, info: b7, healthCheck: E7, MODULE_ID: Va, VERSION: D1 });
const zm = {
  async init() {
    return tt.isReady() ? { success: !0, alreadyInitialized: !0 } : (tt.setInitializing(), As.init(), tt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = y7(e), { Template: i } = await Promise.resolve().then(() => I7);
    if (t.innerHTML = i.render(n.props), tt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--status-mode");
      o && As.bindClick(o, () => As.emitClicked(n.props));
    }
    return As.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    tt.setUnmounting(), As.cleanup();
    const t = tt.getContainer();
    return t && (t.innerHTML = ""), As.emitUnmounted(), tt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), As.destroy(), tt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return tt.info();
  }
};
({ ...zm });
const W = { props: null, isVisible: !0, isHovered: !1, lastRender: null, mode: "on" }, J = {
  getState() {
    return { ...W };
  },
  setProps(t) {
    W.props = t;
  },
  getProps() {
    return W.props;
  },
  setVisible(t) {
    W.isVisible = !!t;
  },
  setHovered(t) {
    W.isHovered = !!t;
  },
  setMode(t) {
    W.mode = t;
  },
  getMode() {
    return W.mode;
  },
  markRender() {
    W.lastRender = Date.now();
  },
  reset() {
    W.props = null, W.isVisible = !0, W.isHovered = !1, W.lastRender = null, W.mode = "on";
  }
}, dT = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", M1 = {
  render(t = {}) {
    const e = OD.SIZES[t.size] || OD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "status-mode", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--status-mode", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="status-mode"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${dT}"/></svg></span>`;
  },
  getSvgPath() {
    return dT;
  }
};
({ ...M1 });
const I7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: M1
}, Symbol.toStringTag, { value: "Module" })), GU = {
  applyState(t, e) {
    t && (t.classList.remove("dsd-icon--state-default", "dsd-icon--state-active", "dsd-icon--state-disabled", "dsd-icon--state-loading"), t.classList.add(`dsd-icon--state-${e}`));
  },
  applyVariant(t, e) {
    t && (["primary", "secondary", "brand", "success", "warning", "danger", "muted"].forEach((n) => t.classList.remove(`dsd-icon--${n}`)), t.classList.add(`dsd-icon--${e}`));
  }
};
({ ...GU });
const Fh = "footer.icon.status-mode.tracker", Vb = "2.2.0-P18EC", Ar = h({ moduleId: Fh });
function O7(t) {
  return Ar.inject(t);
}
function D7() {
  return Ar.snapshot();
}
const Ho = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, on = {
  trackRender(t) {
    Ho.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Ho.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Ho.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Ho.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Ho.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Ar.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Fh }, e));
  },
  getMetrics() {
    return Object.assign({}, Ho);
  },
  reset() {
    for (const t in Ho) Ho[t] = 0;
  }
};
function YU() {
  return on.getMetrics();
}
function C7(t) {
  return Ar.init(), t && t.ports && Ar.inject(t.ports), { ok: !0, version: Vb };
}
function M7() {
  return { status: Ar.isInitialized() ? "HEALTHY" : "DEGRADED", version: Vb, moduleId: Fh, portsInitialized: Ar.isInitialized(), metrics: YU() };
}
function R7() {
  return { moduleId: Fh, version: Vb, metrics: YU(), portsInitialized: Ar.isInitialized() };
}
Object.assign({}, on, { init: C7, info: R7, healthCheck: M7, MODULE_ID: Fh, VERSION: Vb, injectPorts: O7, getPorts: D7 });
const FU = "footer-icon-status-mode-logger", w7 = g({ moduleId: FU });
function P7(t) {
  return w7.get(t);
}
function Fg(t, e) {
  const n = P7("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: FU });
}
const Vc = { info(...t) {
  Fg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Fg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Fg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Fg("debug", Array.prototype.slice.call(t));
} };
Vc.info, Vc.warn, Vc.error, Vc.debug;
const CD = "footer-icon-status-mode", zf = "1.0.1-ENTERPRISE";
function TI(t, ...e) {
  Vc && typeof Vc[t] == "function" && Vc[t]("[STATUS-MODE]", ...e);
}
const Uf = {
  getVersion() {
    return zf;
  },
  getModuleId() {
    return CD;
  },
  async init(t = {}) {
    return TI("info", "Init"), await zm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await zm.mount(t, e);
      return J.setProps(n.props), J.setMode(n.props.mode || "normal"), J.markRender(), on.trackMount(), on.trackRender(n.props), n;
    } catch (n) {
      throw on.trackError(n), TI("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return J.setProps(t), J.setMode(t.mode || "normal"), J.markRender(), on.trackRender(t), M1.render(t);
  },
  setMode(t) {
    var e;
    const n = (e = tt.getContainer()) == null ? void 0 : e.querySelector(".dsd-icon--status-mode");
    if (n) {
      const i = J.getMode();
      GU.applyMode(n, t), J.setMode(t), on.trackModeChange(), TI("info", "Mode changed:", i, "->", t);
    }
  },
  getMode() {
    return J.getMode();
  },
  async unmount() {
    on.trackUnmount();
    const t = await zm.unmount();
    return J.reset(), t;
  },
  async destroy() {
    const t = await zm.destroy();
    return J.reset(), on.reset(), t;
  },
  healthCheck() {
    const t = tt.info(), e = on.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, currentMode: J.getMode(), version: zf, timestamp: Date.now() };
  },
  info() {
    return {
      moduleId: CD,
      version: zf,
      lifecycle: tt.info(),
      currentMode: J.getMode(),
      metrics: on.getMetrics(),
      availableModes: ["normal", "maintenance", "p0", "incident", "degraded"],
      timestamp: Date.now()
    };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconStatusMode = { getVersion: () => zf, info: () => Uf.info(), healthCheck: () => Uf.healthCheck(), setMode: (t) => Uf.setMode(t) });
const T7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: CD,
  StatusModeIcon: Uf,
  VERSION: zf,
  default: Uf
}, Symbol.toStringTag, { value: "Module" })), MD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "device-mic" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, N7 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(MD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Me = "idle", qg = null, mT = 0;
const et = {
  getPhase() {
    return Me;
  },
  isReady() {
    return Me === "ready" || Me === "mounted";
  },
  isMounted() {
    return Me === "mounted";
  },
  setInitializing() {
    Me = "initializing";
  },
  setReady() {
    Me = "ready";
  },
  setMounted(t) {
    Me = "mounted", qg = t, mT++;
  },
  setUnmounting() {
    Me = "unmounting";
  },
  setDestroyed() {
    Me = "destroyed", qg = null;
  },
  reset() {
    Me = "idle", qg = null;
  },
  getContainer() {
    return qg;
  },
  info() {
    return { phase: Me, isMounted: this.isMounted(), mountCount: mT };
  }
};
({ ...et });
const xa = "footer-icon-device-mic-events", R1 = "1.5.0-P18EC", RD = "footer:device-mic", xb = h({ moduleId: xa });
function S7() {
  xb.init();
}
function Ay(t) {
  return xb.get(t);
}
const kd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function fT(t) {
  t === void 0 && (t = {}), kd.uiActions++;
  const e = Ay("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: RD, source: xa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "DeviceMic" }, t) });
}
const zs = { _clickHandler: null, _element: null, init() {
  S7();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    kd.clicks++, e && e(), fT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  kd.clicks++, fT({ clicked: !0, props: t });
}, emitMounted(t) {
  kd.mounts++;
  const e = Ay("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: RD, moduleId: xa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  kd.unmounts++;
  const t = Ay("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: RD, moduleId: xa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function w1() {
  return Object.assign({}, kd);
}
function L7() {
  const t = xb.snapshot();
  return { moduleId: xa, version: R1, metrics: w1(), portsInitialized: t._initialized };
}
function A7() {
  const t = xb.snapshot(), e = Ay("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: R1, moduleId: xa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: w1() };
}
Object.assign({}, zs, { getMetrics: w1, info: L7, healthCheck: A7, MODULE_ID: xa, VERSION: R1 });
const Um = {
  async init() {
    return et.isReady() ? { success: !0, alreadyInitialized: !0 } : (et.setInitializing(), zs.init(), et.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = N7(e), { Template: i } = await Promise.resolve().then(() => z7);
    if (t.innerHTML = i.render(n.props), et.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--device-mic");
      o && zs.bindClick(o, () => zs.emitClicked(n.props));
    }
    return zs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    et.setUnmounting(), zs.cleanup();
    const t = et.getContainer();
    return t && (t.innerHTML = ""), zs.emitUnmounted(), et.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), zs.destroy(), et.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return et.info();
  }
};
({ ...Um });
const Q = { props: null, isVisible: !0, isHovered: !1, lastRender: null, mode: "on" }, x = {
  getState() {
    return { ...Q };
  },
  setProps(t) {
    Q.props = t;
  },
  getProps() {
    return Q.props;
  },
  setVisible(t) {
    Q.isVisible = !!t;
  },
  setHovered(t) {
    Q.isHovered = !!t;
  },
  setMode(t) {
    Q.mode = t;
  },
  getMode() {
    return Q.mode;
  },
  markRender() {
    Q.lastRender = Date.now();
  },
  reset() {
    Q.props = null, Q.isVisible = !0, Q.isHovered = !1, Q.lastRender = null, Q.mode = "on";
  }
}, hT = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", P1 = {
  render(t = {}) {
    const e = MD.SIZES[t.size] || MD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "device-mic", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--device-mic", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="device-mic"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${hT}"/></svg></span>`;
  },
  getSvgPath() {
    return hT;
  }
};
({ ...P1 });
const z7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: P1
}, Symbol.toStringTag, { value: "Module" })), qU = {
  applyState(t, e) {
    t && (t.classList.remove("dsd-icon--state-default", "dsd-icon--state-active", "dsd-icon--state-disabled", "dsd-icon--state-loading"), t.classList.add(`dsd-icon--state-${e}`));
  },
  applyVariant(t, e) {
    t && (["primary", "secondary", "brand", "success", "warning", "danger", "muted"].forEach((n) => t.classList.remove(`dsd-icon--${n}`)), t.classList.add(`dsd-icon--${e}`));
  }
};
({ ...qU });
const qh = "footer.icon.device-mic.tracker", Gb = "2.2.0-P18EC", zr = h({ moduleId: qh });
function U7(t) {
  return zr.inject(t);
}
function H7() {
  return zr.snapshot();
}
const jo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, sn = {
  trackRender(t) {
    jo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    jo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    jo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    jo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    jo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = zr.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: qh }, e));
  },
  getMetrics() {
    return Object.assign({}, jo);
  },
  reset() {
    for (const t in jo) jo[t] = 0;
  }
};
function ZU() {
  return sn.getMetrics();
}
function j7(t) {
  return zr.init(), t && t.ports && zr.inject(t.ports), { ok: !0, version: Gb };
}
function B7() {
  return { status: zr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Gb, moduleId: qh, portsInitialized: zr.isInitialized(), metrics: ZU() };
}
function V7() {
  return { moduleId: qh, version: Gb, metrics: ZU(), portsInitialized: zr.isInitialized() };
}
Object.assign({}, sn, { init: j7, info: V7, healthCheck: B7, MODULE_ID: qh, VERSION: Gb, injectPorts: U7, getPorts: H7 });
const KU = "footer-icon-device-mic-logger", x7 = g({ moduleId: KU });
function G7(t) {
  return x7.get(t);
}
function Zg(t, e) {
  const n = G7("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: KU });
}
const xc = { info(...t) {
  Zg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Zg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Zg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Zg("debug", Array.prototype.slice.call(t));
} };
xc.info, xc.warn, xc.error, xc.debug;
const wD = "footer-icon-device-mic", Hf = "1.0.1-ENTERPRISE";
function NI(t, ...e) {
  xc && typeof xc[t] == "function" && xc[t]("[DEVICE-MIC]", ...e);
}
const jf = {
  getVersion() {
    return Hf;
  },
  getModuleId() {
    return wD;
  },
  async init(t = {}) {
    return NI("info", "Init"), await Um.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Um.mount(t, e);
      return x.setProps(n.props), x.setMode(n.props.mode || "on"), x.markRender(), sn.trackMount(), sn.trackRender(n.props), n;
    } catch (n) {
      throw sn.trackError(n), NI("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return x.setProps(t), x.setMode(t.mode || "on"), x.markRender(), sn.trackRender(t), P1.render(t);
  },
  setMode(t) {
    var e;
    const n = (e = et.getContainer()) == null ? void 0 : e.querySelector(".dsd-icon--device-mic");
    if (n) {
      const i = x.getMode();
      qU.applyMode(n, t), x.setMode(t), sn.trackModeChange(), NI("info", "Mode changed:", i, "->", t);
    }
  },
  toggle() {
    const t = x.getMode();
    this.setMode(t === "on" ? "off" : "on");
  },
  isOn() {
    return x.getMode() === "on";
  },
  async unmount() {
    sn.trackUnmount();
    const t = await Um.unmount();
    return x.reset(), t;
  },
  async destroy() {
    const t = await Um.destroy();
    return x.reset(), sn.reset(), t;
  },
  healthCheck() {
    const t = et.info(), e = sn.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, currentMode: x.getMode(), version: Hf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: wD, version: Hf, lifecycle: et.info(), currentMode: x.getMode(), isOn: this.isOn(), metrics: sn.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDeviceMic = { getVersion: () => Hf, info: () => jf.info(), healthCheck: () => jf.healthCheck(), toggle: () => jf.toggle() });
const Y7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DeviceMicIcon: jf,
  MODULE_ID: wD,
  VERSION: Hf,
  default: jf
}, Symbol.toStringTag, { value: "Module" })), PD = {
  PROPS: {
    size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" },
    state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" },
    decorative: { type: "boolean", default: !1 },
    ariaLabel: { type: "string", default: "device-webcam" },
    clickable: { type: "boolean", default: !1 }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, F7 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(PD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Re = "idle", Kg = null, pT = 0;
const nt = {
  getPhase() {
    return Re;
  },
  isReady() {
    return Re === "ready" || Re === "mounted";
  },
  isMounted() {
    return Re === "mounted";
  },
  setInitializing() {
    Re = "initializing";
  },
  setReady() {
    Re = "ready";
  },
  setMounted(t) {
    Re = "mounted", Kg = t, pT++;
  },
  setUnmounting() {
    Re = "unmounting";
  },
  setDestroyed() {
    Re = "destroyed", Kg = null;
  },
  reset() {
    Re = "idle", Kg = null;
  },
  getContainer() {
    return Kg;
  },
  info() {
    return { phase: Re, isMounted: this.isMounted(), mountCount: pT };
  }
};
({ ...nt });
const Ga = "footer-icon-device-webcam-events", T1 = "1.5.0-P18EC", TD = "footer:device-webcam", Yb = h({ moduleId: Ga });
function q7() {
  Yb.init();
}
function zy(t) {
  return Yb.get(t);
}
const bd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function gT(t) {
  t === void 0 && (t = {}), bd.uiActions++;
  const e = zy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: TD, source: Ga, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "DeviceWebcam" }, t) });
}
const Us = { _clickHandler: null, _element: null, init() {
  q7();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    bd.clicks++, e && e(), gT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  bd.clicks++, gT({ clicked: !0, props: t });
}, emitMounted(t) {
  bd.mounts++;
  const e = zy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: TD, moduleId: Ga, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  bd.unmounts++;
  const t = zy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: TD, moduleId: Ga, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function N1() {
  return Object.assign({}, bd);
}
function Z7() {
  const t = Yb.snapshot();
  return { moduleId: Ga, version: T1, metrics: N1(), portsInitialized: t._initialized };
}
function K7() {
  const t = Yb.snapshot(), e = zy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: T1, moduleId: Ga, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: N1() };
}
Object.assign({}, Us, { getMetrics: N1, info: Z7, healthCheck: K7, MODULE_ID: Ga, VERSION: T1 });
const Hm = {
  async init() {
    return nt.isReady() ? { success: !0, alreadyInitialized: !0 } : (nt.setInitializing(), Us.init(), nt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = F7(e), { Template: i } = await Promise.resolve().then(() => W7);
    if (t.innerHTML = i.render(n.props), nt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--device-webcam");
      o && Us.bindClick(o, () => Us.emitClicked(n.props));
    }
    return Us.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    nt.setUnmounting(), Us.cleanup();
    const t = nt.getContainer();
    return t && (t.innerHTML = ""), Us.emitUnmounted(), nt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Us.destroy(), nt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return nt.info();
  }
};
({ ...Hm });
const X = { props: null, isVisible: !0, isHovered: !1, lastRender: null, mode: "on" }, G = {
  getState() {
    return { ...X };
  },
  setProps(t) {
    X.props = t;
  },
  getProps() {
    return X.props;
  },
  setVisible(t) {
    X.isVisible = !!t;
  },
  setHovered(t) {
    X.isHovered = !!t;
  },
  setMode(t) {
    X.mode = t;
  },
  getMode() {
    return X.mode;
  },
  markRender() {
    X.lastRender = Date.now();
  },
  reset() {
    X.props = null, X.isVisible = !0, X.isHovered = !1, X.lastRender = null, X.mode = "on";
  }
}, _T = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", S1 = {
  render(t = {}) {
    const e = PD.SIZES[t.size] || PD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "device-webcam", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--device-webcam", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="device-webcam"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="${_T}"/></svg></span>`;
  },
  getSvgPath() {
    return _T;
  }
};
({ ...S1 });
const W7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: S1
}, Symbol.toStringTag, { value: "Module" })), WU = {
  applyState(t, e) {
    t && (t.classList.remove("dsd-icon--state-default", "dsd-icon--state-active", "dsd-icon--state-disabled", "dsd-icon--state-loading"), t.classList.add(`dsd-icon--state-${e}`));
  },
  applyVariant(t, e) {
    t && (["primary", "secondary", "brand", "success", "warning", "danger", "muted"].forEach((n) => t.classList.remove(`dsd-icon--${n}`)), t.classList.add(`dsd-icon--${e}`));
  }
};
({ ...WU });
const Zh = "footer.icon.device-webcam.tracker", Fb = "2.2.0-P18EC", Ur = h({ moduleId: Zh });
function J7(t) {
  return Ur.inject(t);
}
function Q7() {
  return Ur.snapshot();
}
const Bo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, rn = {
  trackRender(t) {
    Bo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
  },
  trackClick(t) {
    Bo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
  },
  trackMount() {
    Bo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    Bo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
  },
  trackError(t) {
    Bo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
  },
  _emit(t, e) {
    const n = Ur.get("telemetry");
    n && n.track && n.track(t, Object.assign({ moduleId: Zh }, e));
  },
  getMetrics() {
    return Object.assign({}, Bo);
  },
  reset() {
    for (const t in Bo) Bo[t] = 0;
  }
};
function JU() {
  return rn.getMetrics();
}
function X7(t) {
  return Ur.init(), t && t.ports && Ur.inject(t.ports), { ok: !0, version: Fb };
}
function tF() {
  return { status: Ur.isInitialized() ? "HEALTHY" : "DEGRADED", version: Fb, moduleId: Zh, portsInitialized: Ur.isInitialized(), metrics: JU() };
}
function eF() {
  return { moduleId: Zh, version: Fb, metrics: JU(), portsInitialized: Ur.isInitialized() };
}
Object.assign({}, rn, { init: X7, info: eF, healthCheck: tF, MODULE_ID: Zh, VERSION: Fb, injectPorts: J7, getPorts: Q7 });
const QU = "footer-icon-device-webcam-logger", nF = g({ moduleId: QU });
function iF(t) {
  return nF.get(t);
}
function Wg(t, e) {
  const n = iF("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: QU });
}
const Gc = { info(...t) {
  Wg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Wg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Wg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Wg("debug", Array.prototype.slice.call(t));
} };
Gc.info, Gc.warn, Gc.error, Gc.debug;
const ND = "footer-icon-device-webcam", Bf = "1.0.1-ENTERPRISE";
function SI(t, ...e) {
  Gc && typeof Gc[t] == "function" && Gc[t]("[DEVICE-WEBCAM]", ...e);
}
const Vf = {
  getVersion() {
    return Bf;
  },
  getModuleId() {
    return ND;
  },
  async init(t = {}) {
    return SI("info", "Init"), await Hm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Hm.mount(t, e);
      return G.setProps(n.props), G.setMode(n.props.mode || "on"), G.markRender(), rn.trackMount(), rn.trackRender(n.props), n;
    } catch (n) {
      throw rn.trackError(n), SI("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return G.setProps(t), G.setMode(t.mode || "on"), G.markRender(), rn.trackRender(t), S1.render(t);
  },
  setMode(t) {
    var e;
    const n = (e = nt.getContainer()) == null ? void 0 : e.querySelector(".dsd-icon--device-webcam");
    if (n) {
      const i = G.getMode();
      WU.applyMode(n, t), G.setMode(t), rn.trackModeChange(), SI("info", "Mode changed:", i, "->", t);
    }
  },
  toggle() {
    const t = G.getMode();
    this.setMode(t === "on" ? "off" : "on");
  },
  isOn() {
    return G.getMode() === "on";
  },
  async unmount() {
    rn.trackUnmount();
    const t = await Hm.unmount();
    return G.reset(), t;
  },
  async destroy() {
    const t = await Hm.destroy();
    return G.reset(), rn.reset(), t;
  },
  healthCheck() {
    const t = nt.info(), e = rn.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, currentMode: G.getMode(), version: Bf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: ND, version: Bf, lifecycle: nt.info(), currentMode: G.getMode(), isOn: this.isOn(), metrics: rn.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDeviceWebcam = { getVersion: () => Bf, info: () => Vf.info(), healthCheck: () => Vf.healthCheck(), toggle: () => Vf.toggle() });
const oF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DeviceWebcamIcon: Vf,
  MODULE_ID: ND,
  VERSION: Bf,
  default: Vf
}, Symbol.toStringTag, { value: "Module" })), SD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "zap" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, sF = (t = {}) => {
  const e = [], n = {};
  return Object.entries(SD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let we = "idle", Jg = null, vT = 0;
const wt = { getPhase() {
  return we;
}, isReady() {
  return we === "ready" || we === "mounted";
}, isMounted() {
  return we === "mounted";
}, setInitializing() {
  we = "initializing";
}, setReady() {
  we = "ready";
}, setMounted(t) {
  we = "mounted", Jg = t, vT++;
}, setUnmounting() {
  we = "unmounting";
}, setDestroyed() {
  we = "destroyed", Jg = null;
}, reset() {
  we = "idle", Jg = null;
}, getContainer() {
  return Jg;
}, info() {
  return { phase: we, isMounted: this.isMounted(), mountCount: vT };
} };
({ ...wt });
const Ya = "footer-icon-zap-events", L1 = "1.5.0-P18EC", LD = "footer:zap", qb = h({ moduleId: Ya });
function rF() {
  qb.init();
}
function Uy(t) {
  return qb.get(t);
}
const Ed = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function $T(t) {
  t === void 0 && (t = {}), Ed.uiActions++;
  const e = Uy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: LD, source: Ya, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Zap" }, t) });
}
const Hs = { _clickHandler: null, _element: null, init() {
  rF();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Ed.clicks++, e && e(), $T({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Ed.clicks++, $T({ clicked: !0, props: t });
}, emitMounted(t) {
  Ed.mounts++;
  const e = Uy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: LD, moduleId: Ya, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Ed.unmounts++;
  const t = Uy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: LD, moduleId: Ya, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function A1() {
  return Object.assign({}, Ed);
}
function cF() {
  const t = qb.snapshot();
  return { moduleId: Ya, version: L1, metrics: A1(), portsInitialized: t._initialized };
}
function aF() {
  const t = qb.snapshot(), e = Uy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: L1, moduleId: Ya, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: A1() };
}
Object.assign({}, Hs, { getMetrics: A1, info: cF, healthCheck: aF, MODULE_ID: Ya, VERSION: L1 });
const jm = {
  async init() {
    return wt.isReady() ? { success: !0, alreadyInitialized: !0 } : (wt.setInitializing(), Hs.init(), wt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = sF(e), { Template: i } = await Promise.resolve().then(() => lF);
    if (t.innerHTML = i.render(n.props), wt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--zap");
      o && Hs.bindClick(o, () => Hs.emitClicked(n.props));
    }
    return Hs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    wt.setUnmounting(), Hs.cleanup();
    const t = wt.getContainer();
    return t && (t.innerHTML = ""), Hs.emitUnmounted(), wt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Hs.destroy(), wt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return wt.info();
  }
};
({ ...jm });
const Nn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Ou = { getState() {
  return { ...Nn };
}, setProps(t) {
  Nn.props = t;
}, getProps() {
  return Nn.props;
}, setVisible(t) {
  Nn.isVisible = !!t;
}, setHovered(t) {
  Nn.isHovered = !!t;
}, markRender() {
  Nn.lastRender = Date.now();
}, reset() {
  Nn.props = null, Nn.isVisible = !0, Nn.isHovered = !1, Nn.lastRender = null;
} }, yT = "13 2 3 14 12 14 11 22 21 10 12 10 13 2", z1 = {
  render(t = {}) {
    const e = SD.SIZES[t.size] || SD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "zap", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--zap", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="zap"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<polygon points="${yT}"/></svg></span>`;
  },
  getSvgPath() {
    return yT;
  }
};
({ ...z1 });
const lF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: z1
}, Symbol.toStringTag, { value: "Module" })), Kh = "footer.icon.zap.tracker", Zb = "2.2.0-P18EC", Hr = h({ moduleId: Kh });
function uF(t) {
  return Hr.inject(t);
}
function dF() {
  return Hr.snapshot();
}
const Vo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Mi = { trackRender(t) {
  Vo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Vo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Vo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Vo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Vo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Hr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: Kh }, e));
}, getMetrics() {
  return Object.assign({}, Vo);
}, reset() {
  for (const t in Vo) Vo[t] = 0;
} };
function XU() {
  return Mi.getMetrics();
}
function mF(t) {
  return Hr.init(), t && t.ports && Hr.inject(t.ports), { ok: !0, version: Zb };
}
function fF() {
  return { status: Hr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Zb, moduleId: Kh, portsInitialized: Hr.isInitialized(), metrics: XU() };
}
function hF() {
  return { moduleId: Kh, version: Zb, metrics: XU(), portsInitialized: Hr.isInitialized() };
}
Object.assign({}, Mi, { init: mF, info: hF, healthCheck: fF, MODULE_ID: Kh, VERSION: Zb, injectPorts: uF, getPorts: dF });
const tH = "footer-icon-zap-logger", pF = g({ moduleId: tH });
function gF(t) {
  return pF.get(t);
}
function Qg(t, e) {
  const n = gF("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: tH });
}
const Yc = { info(...t) {
  Qg("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Qg("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Qg("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Qg("debug", Array.prototype.slice.call(t));
} };
Yc.info, Yc.warn, Yc.error, Yc.debug;
const AD = "footer-icon-zap", xf = "1.0.1-ENTERPRISE";
function kT(t, ...e) {
  Yc && typeof Yc[t] == "function" && Yc[t]("[ZAP]", ...e);
}
const Hy = {
  getVersion() {
    return xf;
  },
  getModuleId() {
    return AD;
  },
  async init(t = {}) {
    return kT("info", "Init"), await jm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await jm.mount(t, e);
      return Ou.setProps(n.props), Ou.markRender(), Mi.trackMount(), Mi.trackRender(n.props), n;
    } catch (n) {
      throw Mi.trackError(n), kT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Ou.setProps(t), Ou.markRender(), Mi.trackRender(t), z1.render(t);
  },
  async unmount() {
    Mi.trackUnmount();
    const t = await jm.unmount();
    return Ou.reset(), t;
  },
  async destroy() {
    const t = await jm.destroy();
    return Ou.reset(), Mi.reset(), t;
  },
  healthCheck() {
    const t = wt.info(), e = Mi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: xf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: AD, version: xf, lifecycle: wt.info(), metrics: Mi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconZap = { getVersion: () => xf, info: () => Hy.info(), healthCheck: () => Hy.healthCheck() });
const _F = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: AD,
  VERSION: xf,
  ZapIcon: Hy,
  default: Hy
}, Symbol.toStringTag, { value: "Module" })), zD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "users" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, vF = (t = {}) => {
  const e = [], n = {};
  return Object.entries(zD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Pe = "idle", Xg = null, bT = 0;
const Pt = { getPhase() {
  return Pe;
}, isReady() {
  return Pe === "ready" || Pe === "mounted";
}, isMounted() {
  return Pe === "mounted";
}, setInitializing() {
  Pe = "initializing";
}, setReady() {
  Pe = "ready";
}, setMounted(t) {
  Pe = "mounted", Xg = t, bT++;
}, setUnmounting() {
  Pe = "unmounting";
}, setDestroyed() {
  Pe = "destroyed", Xg = null;
}, reset() {
  Pe = "idle", Xg = null;
}, getContainer() {
  return Xg;
}, info() {
  return { phase: Pe, isMounted: this.isMounted(), mountCount: bT };
} };
({ ...Pt });
const Fa = "footer-icon-users-events", U1 = "1.5.0-P18EC", UD = "footer:users", Kb = h({ moduleId: Fa });
function $F() {
  Kb.init();
}
function jy(t) {
  return Kb.get(t);
}
const Id = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function ET(t) {
  t === void 0 && (t = {}), Id.uiActions++;
  const e = jy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: UD, source: Fa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Users" }, t) });
}
const js = { _clickHandler: null, _element: null, init() {
  $F();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Id.clicks++, e && e(), ET({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Id.clicks++, ET({ clicked: !0, props: t });
}, emitMounted(t) {
  Id.mounts++;
  const e = jy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: UD, moduleId: Fa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Id.unmounts++;
  const t = jy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: UD, moduleId: Fa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function H1() {
  return Object.assign({}, Id);
}
function yF() {
  const t = Kb.snapshot();
  return { moduleId: Fa, version: U1, metrics: H1(), portsInitialized: t._initialized };
}
function kF() {
  const t = Kb.snapshot(), e = jy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: U1, moduleId: Fa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: H1() };
}
Object.assign({}, js, { getMetrics: H1, info: yF, healthCheck: kF, MODULE_ID: Fa, VERSION: U1 });
const Bm = {
  async init() {
    return Pt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Pt.setInitializing(), js.init(), Pt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = vF(e), { Template: i } = await Promise.resolve().then(() => bF);
    if (t.innerHTML = i.render(n.props), Pt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--users");
      o && js.bindClick(o, () => js.emitClicked(n.props));
    }
    return js.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Pt.setUnmounting(), js.cleanup();
    const t = Pt.getContainer();
    return t && (t.innerHTML = ""), js.emitUnmounted(), Pt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), js.destroy(), Pt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Pt.info();
  }
};
({ ...Bm });
const Sn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Du = { getState() {
  return { ...Sn };
}, setProps(t) {
  Sn.props = t;
}, getProps() {
  return Sn.props;
}, setVisible(t) {
  Sn.isVisible = !!t;
}, setHovered(t) {
  Sn.isHovered = !!t;
}, markRender() {
  Sn.lastRender = Date.now();
}, reset() {
  Sn.props = null, Sn.isVisible = !0, Sn.isHovered = !1, Sn.lastRender = null;
} }, j1 = {
  render(t = {}) {
    const e = zD.SIZES[t.size] || zD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "users", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--users", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="users"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>`;
  },
  getSvgPath() {
    return "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2";
  }
};
({ ...j1 });
const bF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: j1
}, Symbol.toStringTag, { value: "Module" })), Wh = "footer.icon.users.tracker", Wb = "2.2.0-P18EC", jr = h({ moduleId: Wh });
function EF(t) {
  return jr.inject(t);
}
function IF() {
  return jr.snapshot();
}
const xo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ri = { trackRender(t) {
  xo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  xo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  xo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  xo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  xo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = jr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: Wh }, e));
}, getMetrics() {
  return Object.assign({}, xo);
}, reset() {
  for (const t in xo) xo[t] = 0;
} };
function eH() {
  return Ri.getMetrics();
}
function OF(t) {
  return jr.init(), t && t.ports && jr.inject(t.ports), { ok: !0, version: Wb };
}
function DF() {
  return { status: jr.isInitialized() ? "HEALTHY" : "DEGRADED", version: Wb, moduleId: Wh, portsInitialized: jr.isInitialized(), metrics: eH() };
}
function CF() {
  return { moduleId: Wh, version: Wb, metrics: eH(), portsInitialized: jr.isInitialized() };
}
Object.assign({}, Ri, { init: OF, info: CF, healthCheck: DF, MODULE_ID: Wh, VERSION: Wb, injectPorts: EF, getPorts: IF });
const nH = "footer-icon-users-logger", MF = g({ moduleId: nH });
function RF(t) {
  return MF.get(t);
}
function t_(t, e) {
  const n = RF("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: nH });
}
const Fc = { info(...t) {
  t_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  t_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  t_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  t_("debug", Array.prototype.slice.call(t));
} };
Fc.info, Fc.warn, Fc.error, Fc.debug;
const HD = "footer-icon-users", Gf = "1.0.1-ENTERPRISE";
function IT(t, ...e) {
  Fc && typeof Fc[t] == "function" && Fc[t]("[USERS]", ...e);
}
const By = {
  getVersion() {
    return Gf;
  },
  getModuleId() {
    return HD;
  },
  async init(t = {}) {
    return IT("info", "Init"), await Bm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Bm.mount(t, e);
      return Du.setProps(n.props), Du.markRender(), Ri.trackMount(), Ri.trackRender(n.props), n;
    } catch (n) {
      throw Ri.trackError(n), IT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Du.setProps(t), Du.markRender(), Ri.trackRender(t), j1.render(t);
  },
  async unmount() {
    Ri.trackUnmount();
    const t = await Bm.unmount();
    return Du.reset(), t;
  },
  async destroy() {
    const t = await Bm.destroy();
    return Du.reset(), Ri.reset(), t;
  },
  healthCheck() {
    const t = Pt.info(), e = Ri.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Gf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: HD, version: Gf, lifecycle: Pt.info(), metrics: Ri.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconUsers = { getVersion: () => Gf, info: () => By.info(), healthCheck: () => By.healthCheck() });
const wF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: HD,
  UsersIcon: By,
  VERSION: Gf,
  default: By
}, Symbol.toStringTag, { value: "Module" })), jD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "user" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, PF = (t = {}) => {
  const e = [], n = {};
  return Object.entries(jD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Te = "idle", e_ = null, OT = 0;
const Tt = { getPhase() {
  return Te;
}, isReady() {
  return Te === "ready" || Te === "mounted";
}, isMounted() {
  return Te === "mounted";
}, setInitializing() {
  Te = "initializing";
}, setReady() {
  Te = "ready";
}, setMounted(t) {
  Te = "mounted", e_ = t, OT++;
}, setUnmounting() {
  Te = "unmounting";
}, setDestroyed() {
  Te = "destroyed", e_ = null;
}, reset() {
  Te = "idle", e_ = null;
}, getContainer() {
  return e_;
}, info() {
  return { phase: Te, isMounted: this.isMounted(), mountCount: OT };
} };
({ ...Tt });
const qa = "footer-icon-user-events", B1 = "1.5.0-P18EC", BD = "footer:user", Jb = h({ moduleId: qa });
function TF() {
  Jb.init();
}
function Vy(t) {
  return Jb.get(t);
}
const Od = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function DT(t) {
  t === void 0 && (t = {}), Od.uiActions++;
  const e = Vy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: BD, source: qa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "User" }, t) });
}
const Bs = { _clickHandler: null, _element: null, init() {
  TF();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Od.clicks++, e && e(), DT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Od.clicks++, DT({ clicked: !0, props: t });
}, emitMounted(t) {
  Od.mounts++;
  const e = Vy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: BD, moduleId: qa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Od.unmounts++;
  const t = Vy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: BD, moduleId: qa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function V1() {
  return Object.assign({}, Od);
}
function NF() {
  const t = Jb.snapshot();
  return { moduleId: qa, version: B1, metrics: V1(), portsInitialized: t._initialized };
}
function SF() {
  const t = Jb.snapshot(), e = Vy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: B1, moduleId: qa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: V1() };
}
Object.assign({}, Bs, { getMetrics: V1, info: NF, healthCheck: SF, MODULE_ID: qa, VERSION: B1 });
const Vm = {
  async init() {
    return Tt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Tt.setInitializing(), Bs.init(), Tt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = PF(e), { Template: i } = await Promise.resolve().then(() => LF);
    if (t.innerHTML = i.render(n.props), Tt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--user");
      o && Bs.bindClick(o, () => Bs.emitClicked(n.props));
    }
    return Bs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Tt.setUnmounting(), Bs.cleanup();
    const t = Tt.getContainer();
    return t && (t.innerHTML = ""), Bs.emitUnmounted(), Tt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Bs.destroy(), Tt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Tt.info();
  }
};
({ ...Vm });
const Ln = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Cu = { getState() {
  return { ...Ln };
}, setProps(t) {
  Ln.props = t;
}, getProps() {
  return Ln.props;
}, setVisible(t) {
  Ln.isVisible = !!t;
}, setHovered(t) {
  Ln.isHovered = !!t;
}, markRender() {
  Ln.lastRender = Date.now();
}, reset() {
  Ln.props = null, Ln.isVisible = !0, Ln.isHovered = !1, Ln.lastRender = null;
} }, x1 = {
  render(t = {}) {
    const e = jD.SIZES[t.size] || jD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "user", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--user", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="user"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>`;
  },
  getSvgPath() {
    return "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2";
  }
};
({ ...x1 });
const LF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: x1
}, Symbol.toStringTag, { value: "Module" })), Jh = "footer.icon.user.tracker", Qb = "2.2.0-P18EC", Br = h({ moduleId: Jh });
function AF(t) {
  return Br.inject(t);
}
function zF() {
  return Br.snapshot();
}
const Go = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, wi = { trackRender(t) {
  Go.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Go.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Go.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Go.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Go.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Br.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: Jh }, e));
}, getMetrics() {
  return Object.assign({}, Go);
}, reset() {
  for (const t in Go) Go[t] = 0;
} };
function iH() {
  return wi.getMetrics();
}
function UF(t) {
  return Br.init(), t && t.ports && Br.inject(t.ports), { ok: !0, version: Qb };
}
function HF() {
  return { status: Br.isInitialized() ? "HEALTHY" : "DEGRADED", version: Qb, moduleId: Jh, portsInitialized: Br.isInitialized(), metrics: iH() };
}
function jF() {
  return { moduleId: Jh, version: Qb, metrics: iH(), portsInitialized: Br.isInitialized() };
}
Object.assign({}, wi, { init: UF, info: jF, healthCheck: HF, MODULE_ID: Jh, VERSION: Qb, injectPorts: AF, getPorts: zF });
const oH = "footer-icon-user-logger", BF = g({ moduleId: oH });
function VF(t) {
  return BF.get(t);
}
function n_(t, e) {
  const n = VF("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: oH });
}
const qc = { info(...t) {
  n_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  n_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  n_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  n_("debug", Array.prototype.slice.call(t));
} };
qc.info, qc.warn, qc.error, qc.debug;
const VD = "footer-icon-user", Yf = "1.0.1-ENTERPRISE";
function CT(t, ...e) {
  qc && typeof qc[t] == "function" && qc[t]("[USER]", ...e);
}
const xy = {
  getVersion() {
    return Yf;
  },
  getModuleId() {
    return VD;
  },
  async init(t = {}) {
    return CT("info", "Init"), await Vm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Vm.mount(t, e);
      return Cu.setProps(n.props), Cu.markRender(), wi.trackMount(), wi.trackRender(n.props), n;
    } catch (n) {
      throw wi.trackError(n), CT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Cu.setProps(t), Cu.markRender(), wi.trackRender(t), x1.render(t);
  },
  async unmount() {
    wi.trackUnmount();
    const t = await Vm.unmount();
    return Cu.reset(), t;
  },
  async destroy() {
    const t = await Vm.destroy();
    return Cu.reset(), wi.reset(), t;
  },
  healthCheck() {
    const t = Tt.info(), e = wi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Yf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: VD, version: Yf, lifecycle: Tt.info(), metrics: wi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconUser = { getVersion: () => Yf, info: () => xy.info(), healthCheck: () => xy.healthCheck() });
const xF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: VD,
  UserIcon: xy,
  VERSION: Yf,
  default: xy
}, Symbol.toStringTag, { value: "Module" })), xD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "unlock" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, GF = (t = {}) => {
  const e = [], n = {};
  return Object.entries(xD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ne = "idle", i_ = null, MT = 0;
const Nt = { getPhase() {
  return Ne;
}, isReady() {
  return Ne === "ready" || Ne === "mounted";
}, isMounted() {
  return Ne === "mounted";
}, setInitializing() {
  Ne = "initializing";
}, setReady() {
  Ne = "ready";
}, setMounted(t) {
  Ne = "mounted", i_ = t, MT++;
}, setUnmounting() {
  Ne = "unmounting";
}, setDestroyed() {
  Ne = "destroyed", i_ = null;
}, reset() {
  Ne = "idle", i_ = null;
}, getContainer() {
  return i_;
}, info() {
  return { phase: Ne, isMounted: this.isMounted(), mountCount: MT };
} };
({ ...Nt });
const Za = "footer-icon-unlock-events", G1 = "1.5.0-P18EC", GD = "footer:unlock", Xb = h({ moduleId: Za });
function YF() {
  Xb.init();
}
function Gy(t) {
  return Xb.get(t);
}
const Dd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function RT(t) {
  t === void 0 && (t = {}), Dd.uiActions++;
  const e = Gy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: GD, source: Za, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Unlock" }, t) });
}
const Vs = { _clickHandler: null, _element: null, init() {
  YF();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Dd.clicks++, e && e(), RT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Dd.clicks++, RT({ clicked: !0, props: t });
}, emitMounted(t) {
  Dd.mounts++;
  const e = Gy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: GD, moduleId: Za, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Dd.unmounts++;
  const t = Gy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: GD, moduleId: Za, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function Y1() {
  return Object.assign({}, Dd);
}
function FF() {
  const t = Xb.snapshot();
  return { moduleId: Za, version: G1, metrics: Y1(), portsInitialized: t._initialized };
}
function qF() {
  const t = Xb.snapshot(), e = Gy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: G1, moduleId: Za, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: Y1() };
}
Object.assign({}, Vs, { getMetrics: Y1, info: FF, healthCheck: qF, MODULE_ID: Za, VERSION: G1 });
const xm = {
  async init() {
    return Nt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Nt.setInitializing(), Vs.init(), Nt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = GF(e), { Template: i } = await Promise.resolve().then(() => ZF);
    if (t.innerHTML = i.render(n.props), Nt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--unlock");
      o && Vs.bindClick(o, () => Vs.emitClicked(n.props));
    }
    return Vs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Nt.setUnmounting(), Vs.cleanup();
    const t = Nt.getContainer();
    return t && (t.innerHTML = ""), Vs.emitUnmounted(), Nt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Vs.destroy(), Nt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Nt.info();
  }
};
({ ...xm });
const An = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Mu = { getState() {
  return { ...An };
}, setProps(t) {
  An.props = t;
}, getProps() {
  return An.props;
}, setVisible(t) {
  An.isVisible = !!t;
}, setHovered(t) {
  An.isHovered = !!t;
}, markRender() {
  An.lastRender = Date.now();
}, reset() {
  An.props = null, An.isVisible = !0, An.isHovered = !1, An.lastRender = null;
} }, F1 = {
  render(t = {}) {
    const e = xD.SIZES[t.size] || xD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "unlock", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--unlock", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="unlock"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></span>`;
  },
  getSvgPath() {
    return "M7 11V7a5 5 0 0 1 9.9-1";
  }
};
({ ...F1 });
const ZF = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: F1
}, Symbol.toStringTag, { value: "Module" })), Qh = "footer.icon.unlock.tracker", tE = "2.2.0-P18EC", Vr = h({ moduleId: Qh });
function KF(t) {
  return Vr.inject(t);
}
function WF() {
  return Vr.snapshot();
}
const Yo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Pi = { trackRender(t) {
  Yo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Yo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Yo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Yo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Yo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Vr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: Qh }, e));
}, getMetrics() {
  return Object.assign({}, Yo);
}, reset() {
  for (const t in Yo) Yo[t] = 0;
} };
function sH() {
  return Pi.getMetrics();
}
function JF(t) {
  return Vr.init(), t && t.ports && Vr.inject(t.ports), { ok: !0, version: tE };
}
function QF() {
  return { status: Vr.isInitialized() ? "HEALTHY" : "DEGRADED", version: tE, moduleId: Qh, portsInitialized: Vr.isInitialized(), metrics: sH() };
}
function XF() {
  return { moduleId: Qh, version: tE, metrics: sH(), portsInitialized: Vr.isInitialized() };
}
Object.assign({}, Pi, { init: JF, info: XF, healthCheck: QF, MODULE_ID: Qh, VERSION: tE, injectPorts: KF, getPorts: WF });
const rH = "footer-icon-unlock-logger", t9 = g({ moduleId: rH });
function e9(t) {
  return t9.get(t);
}
function o_(t, e) {
  const n = e9("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: rH });
}
const Zc = { info(...t) {
  o_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  o_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  o_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  o_("debug", Array.prototype.slice.call(t));
} };
Zc.info, Zc.warn, Zc.error, Zc.debug;
const YD = "footer-icon-unlock", Ff = "1.0.1-ENTERPRISE";
function wT(t, ...e) {
  Zc && typeof Zc[t] == "function" && Zc[t]("[UNLOCK]", ...e);
}
const Yy = {
  getVersion() {
    return Ff;
  },
  getModuleId() {
    return YD;
  },
  async init(t = {}) {
    return wT("info", "Init"), await xm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await xm.mount(t, e);
      return Mu.setProps(n.props), Mu.markRender(), Pi.trackMount(), Pi.trackRender(n.props), n;
    } catch (n) {
      throw Pi.trackError(n), wT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Mu.setProps(t), Mu.markRender(), Pi.trackRender(t), F1.render(t);
  },
  async unmount() {
    Pi.trackUnmount();
    const t = await xm.unmount();
    return Mu.reset(), t;
  },
  async destroy() {
    const t = await xm.destroy();
    return Mu.reset(), Pi.reset(), t;
  },
  healthCheck() {
    const t = Nt.info(), e = Pi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Ff, timestamp: Date.now() };
  },
  info() {
    return { moduleId: YD, version: Ff, lifecycle: Nt.info(), metrics: Pi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconUnlock = { getVersion: () => Ff, info: () => Yy.info(), healthCheck: () => Yy.healthCheck() });
const n9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: YD,
  UnlockIcon: Yy,
  VERSION: Ff,
  default: Yy
}, Symbol.toStringTag, { value: "Module" })), FD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "trending-up" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, i9 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(FD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Se = "idle", s_ = null, PT = 0;
const St = { getPhase() {
  return Se;
}, isReady() {
  return Se === "ready" || Se === "mounted";
}, isMounted() {
  return Se === "mounted";
}, setInitializing() {
  Se = "initializing";
}, setReady() {
  Se = "ready";
}, setMounted(t) {
  Se = "mounted", s_ = t, PT++;
}, setUnmounting() {
  Se = "unmounting";
}, setDestroyed() {
  Se = "destroyed", s_ = null;
}, reset() {
  Se = "idle", s_ = null;
}, getContainer() {
  return s_;
}, info() {
  return { phase: Se, isMounted: this.isMounted(), mountCount: PT };
} };
({ ...St });
const Ka = "footer-icon-trending-up-events", q1 = "1.5.0-P18EC", qD = "footer:trending-up", eE = h({ moduleId: Ka });
function o9() {
  eE.init();
}
function Fy(t) {
  return eE.get(t);
}
const Cd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function TT(t) {
  t === void 0 && (t = {}), Cd.uiActions++;
  const e = Fy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: qD, source: Ka, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Trending Up" }, t) });
}
const xs = { _clickHandler: null, _element: null, init() {
  o9();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Cd.clicks++, e && e(), TT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Cd.clicks++, TT({ clicked: !0, props: t });
}, emitMounted(t) {
  Cd.mounts++;
  const e = Fy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: qD, moduleId: Ka, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Cd.unmounts++;
  const t = Fy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: qD, moduleId: Ka, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function Z1() {
  return Object.assign({}, Cd);
}
function s9() {
  const t = eE.snapshot();
  return { moduleId: Ka, version: q1, metrics: Z1(), portsInitialized: t._initialized };
}
function r9() {
  const t = eE.snapshot(), e = Fy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: q1, moduleId: Ka, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: Z1() };
}
Object.assign({}, xs, { getMetrics: Z1, info: s9, healthCheck: r9, MODULE_ID: Ka, VERSION: q1 });
const Gm = {
  async init() {
    return St.isReady() ? { success: !0, alreadyInitialized: !0 } : (St.setInitializing(), xs.init(), St.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = i9(e), { Template: i } = await Promise.resolve().then(() => c9);
    if (t.innerHTML = i.render(n.props), St.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--trending-up");
      o && xs.bindClick(o, () => xs.emitClicked(n.props));
    }
    return xs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    St.setUnmounting(), xs.cleanup();
    const t = St.getContainer();
    return t && (t.innerHTML = ""), xs.emitUnmounted(), St.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), xs.destroy(), St.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return St.info();
  }
};
({ ...Gm });
const zn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Ru = { getState() {
  return { ...zn };
}, setProps(t) {
  zn.props = t;
}, getProps() {
  return zn.props;
}, setVisible(t) {
  zn.isVisible = !!t;
}, setHovered(t) {
  zn.isHovered = !!t;
}, markRender() {
  zn.lastRender = Date.now();
}, reset() {
  zn.props = null, zn.isVisible = !0, zn.isHovered = !1, zn.lastRender = null;
} }, K1 = {
  render(t = {}) {
    const e = FD.SIZES[t.size] || FD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "trending up", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--trending-up", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="trending-up"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></span>`;
  },
  getSvgPath() {
    return "23 6 13.5 15.5 8.5 10.5 1 18";
  }
};
({ ...K1 });
const c9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: K1
}, Symbol.toStringTag, { value: "Module" })), Xh = "footer.icon.trending-up.tracker", nE = "2.2.0-P18EC", xr = h({ moduleId: Xh });
function a9(t) {
  return xr.inject(t);
}
function l9() {
  return xr.snapshot();
}
const Fo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ti = { trackRender(t) {
  Fo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Fo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Fo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Fo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Fo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = xr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: Xh }, e));
}, getMetrics() {
  return Object.assign({}, Fo);
}, reset() {
  for (const t in Fo) Fo[t] = 0;
} };
function cH() {
  return Ti.getMetrics();
}
function u9(t) {
  return xr.init(), t && t.ports && xr.inject(t.ports), { ok: !0, version: nE };
}
function d9() {
  return { status: xr.isInitialized() ? "HEALTHY" : "DEGRADED", version: nE, moduleId: Xh, portsInitialized: xr.isInitialized(), metrics: cH() };
}
function m9() {
  return { moduleId: Xh, version: nE, metrics: cH(), portsInitialized: xr.isInitialized() };
}
Object.assign({}, Ti, { init: u9, info: m9, healthCheck: d9, MODULE_ID: Xh, VERSION: nE, injectPorts: a9, getPorts: l9 });
const aH = "footer-icon-trending-up-logger", f9 = g({ moduleId: aH });
function h9(t) {
  return f9.get(t);
}
function r_(t, e) {
  const n = h9("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: aH });
}
const Kc = { info(...t) {
  r_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  r_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  r_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  r_("debug", Array.prototype.slice.call(t));
} };
Kc.info, Kc.warn, Kc.error, Kc.debug;
const ZD = "footer-icon-trending-up", qf = "1.0.1-ENTERPRISE";
function NT(t, ...e) {
  Kc && typeof Kc[t] == "function" && Kc[t]("[TRENDING-UP]", ...e);
}
const qy = {
  getVersion() {
    return qf;
  },
  getModuleId() {
    return ZD;
  },
  async init(t = {}) {
    return NT("info", "Init"), await Gm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Gm.mount(t, e);
      return Ru.setProps(n.props), Ru.markRender(), Ti.trackMount(), Ti.trackRender(n.props), n;
    } catch (n) {
      throw Ti.trackError(n), NT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Ru.setProps(t), Ru.markRender(), Ti.trackRender(t), K1.render(t);
  },
  async unmount() {
    Ti.trackUnmount();
    const t = await Gm.unmount();
    return Ru.reset(), t;
  },
  async destroy() {
    const t = await Gm.destroy();
    return Ru.reset(), Ti.reset(), t;
  },
  healthCheck() {
    const t = St.info(), e = Ti.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: qf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: ZD, version: qf, lifecycle: St.info(), metrics: Ti.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconTrendingUp = { getVersion: () => qf, info: () => qy.info(), healthCheck: () => qy.healthCheck() });
const p9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ZD,
  TrendingUpIcon: qy,
  VERSION: qf,
  default: qy
}, Symbol.toStringTag, { value: "Module" })), KD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "terminal" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, g9 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(KD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Le = "idle", c_ = null, ST = 0;
const Lt = { getPhase() {
  return Le;
}, isReady() {
  return Le === "ready" || Le === "mounted";
}, isMounted() {
  return Le === "mounted";
}, setInitializing() {
  Le = "initializing";
}, setReady() {
  Le = "ready";
}, setMounted(t) {
  Le = "mounted", c_ = t, ST++;
}, setUnmounting() {
  Le = "unmounting";
}, setDestroyed() {
  Le = "destroyed", c_ = null;
}, reset() {
  Le = "idle", c_ = null;
}, getContainer() {
  return c_;
}, info() {
  return { phase: Le, isMounted: this.isMounted(), mountCount: ST };
} };
({ ...Lt });
const Wa = "footer-icon-terminal-events", W1 = "1.5.0-P18EC", WD = "footer:terminal", iE = h({ moduleId: Wa });
function _9() {
  iE.init();
}
function Zy(t) {
  return iE.get(t);
}
const Md = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function LT(t) {
  t === void 0 && (t = {}), Md.uiActions++;
  const e = Zy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: WD, source: Wa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Terminal" }, t) });
}
const Gs = { _clickHandler: null, _element: null, init() {
  _9();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Md.clicks++, e && e(), LT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Md.clicks++, LT({ clicked: !0, props: t });
}, emitMounted(t) {
  Md.mounts++;
  const e = Zy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: WD, moduleId: Wa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Md.unmounts++;
  const t = Zy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: WD, moduleId: Wa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function J1() {
  return Object.assign({}, Md);
}
function v9() {
  const t = iE.snapshot();
  return { moduleId: Wa, version: W1, metrics: J1(), portsInitialized: t._initialized };
}
function $9() {
  const t = iE.snapshot(), e = Zy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: W1, moduleId: Wa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: J1() };
}
Object.assign({}, Gs, { getMetrics: J1, info: v9, healthCheck: $9, MODULE_ID: Wa, VERSION: W1 });
const Ym = {
  async init() {
    return Lt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Lt.setInitializing(), Gs.init(), Lt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = g9(e), { Template: i } = await Promise.resolve().then(() => y9);
    if (t.innerHTML = i.render(n.props), Lt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--terminal");
      o && Gs.bindClick(o, () => Gs.emitClicked(n.props));
    }
    return Gs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Lt.setUnmounting(), Gs.cleanup();
    const t = Lt.getContainer();
    return t && (t.innerHTML = ""), Gs.emitUnmounted(), Lt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Gs.destroy(), Lt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Lt.info();
  }
};
({ ...Ym });
const Un = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, wu = { getState() {
  return { ...Un };
}, setProps(t) {
  Un.props = t;
}, getProps() {
  return Un.props;
}, setVisible(t) {
  Un.isVisible = !!t;
}, setHovered(t) {
  Un.isHovered = !!t;
}, markRender() {
  Un.lastRender = Date.now();
}, reset() {
  Un.props = null, Un.isVisible = !0, Un.isHovered = !1, Un.lastRender = null;
} }, Q1 = {
  render(t = {}) {
    const e = KD.SIZES[t.size] || KD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "terminal", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--terminal", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="terminal"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></span>`;
  },
  getSvgPath() {
    return "4 17 10 11 4 5";
  }
};
({ ...Q1 });
const y9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: Q1
}, Symbol.toStringTag, { value: "Module" })), tp = "footer.icon.terminal.tracker", oE = "2.2.0-P18EC", Gr = h({ moduleId: tp });
function k9(t) {
  return Gr.inject(t);
}
function b9() {
  return Gr.snapshot();
}
const qo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ni = { trackRender(t) {
  qo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  qo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  qo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  qo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  qo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Gr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: tp }, e));
}, getMetrics() {
  return Object.assign({}, qo);
}, reset() {
  for (const t in qo) qo[t] = 0;
} };
function lH() {
  return Ni.getMetrics();
}
function E9(t) {
  return Gr.init(), t && t.ports && Gr.inject(t.ports), { ok: !0, version: oE };
}
function I9() {
  return { status: Gr.isInitialized() ? "HEALTHY" : "DEGRADED", version: oE, moduleId: tp, portsInitialized: Gr.isInitialized(), metrics: lH() };
}
function O9() {
  return { moduleId: tp, version: oE, metrics: lH(), portsInitialized: Gr.isInitialized() };
}
Object.assign({}, Ni, { init: E9, info: O9, healthCheck: I9, MODULE_ID: tp, VERSION: oE, injectPorts: k9, getPorts: b9 });
const uH = "footer-icon-terminal-logger", D9 = g({ moduleId: uH });
function C9(t) {
  return D9.get(t);
}
function a_(t, e) {
  const n = C9("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: uH });
}
const Wc = { info(...t) {
  a_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  a_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  a_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  a_("debug", Array.prototype.slice.call(t));
} };
Wc.info, Wc.warn, Wc.error, Wc.debug;
const JD = "footer-icon-terminal", Zf = "1.0.1-ENTERPRISE";
function AT(t, ...e) {
  Wc && typeof Wc[t] == "function" && Wc[t]("[TERMINAL]", ...e);
}
const Ky = {
  getVersion() {
    return Zf;
  },
  getModuleId() {
    return JD;
  },
  async init(t = {}) {
    return AT("info", "Init"), await Ym.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Ym.mount(t, e);
      return wu.setProps(n.props), wu.markRender(), Ni.trackMount(), Ni.trackRender(n.props), n;
    } catch (n) {
      throw Ni.trackError(n), AT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return wu.setProps(t), wu.markRender(), Ni.trackRender(t), Q1.render(t);
  },
  async unmount() {
    Ni.trackUnmount();
    const t = await Ym.unmount();
    return wu.reset(), t;
  },
  async destroy() {
    const t = await Ym.destroy();
    return wu.reset(), Ni.reset(), t;
  },
  healthCheck() {
    const t = Lt.info(), e = Ni.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Zf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: JD, version: Zf, lifecycle: Lt.info(), metrics: Ni.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconTerminal = { getVersion: () => Zf, info: () => Ky.info(), healthCheck: () => Ky.healthCheck() });
const M9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: JD,
  TerminalIcon: Ky,
  VERSION: Zf,
  default: Ky
}, Symbol.toStringTag, { value: "Module" })), QD = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "target" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, R9 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(QD.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ae = "idle", l_ = null, zT = 0;
const At = { getPhase() {
  return Ae;
}, isReady() {
  return Ae === "ready" || Ae === "mounted";
}, isMounted() {
  return Ae === "mounted";
}, setInitializing() {
  Ae = "initializing";
}, setReady() {
  Ae = "ready";
}, setMounted(t) {
  Ae = "mounted", l_ = t, zT++;
}, setUnmounting() {
  Ae = "unmounting";
}, setDestroyed() {
  Ae = "destroyed", l_ = null;
}, reset() {
  Ae = "idle", l_ = null;
}, getContainer() {
  return l_;
}, info() {
  return { phase: Ae, isMounted: this.isMounted(), mountCount: zT };
} };
({ ...At });
const Ja = "footer-icon-target-events", X1 = "1.5.0-P18EC", XD = "footer:target", sE = h({ moduleId: Ja });
function w9() {
  sE.init();
}
function Wy(t) {
  return sE.get(t);
}
const Rd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function UT(t) {
  t === void 0 && (t = {}), Rd.uiActions++;
  const e = Wy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: XD, source: Ja, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Target" }, t) });
}
const Ys = { _clickHandler: null, _element: null, init() {
  w9();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Rd.clicks++, e && e(), UT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Rd.clicks++, UT({ clicked: !0, props: t });
}, emitMounted(t) {
  Rd.mounts++;
  const e = Wy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: XD, moduleId: Ja, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Rd.unmounts++;
  const t = Wy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: XD, moduleId: Ja, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function tR() {
  return Object.assign({}, Rd);
}
function P9() {
  const t = sE.snapshot();
  return { moduleId: Ja, version: X1, metrics: tR(), portsInitialized: t._initialized };
}
function T9() {
  const t = sE.snapshot(), e = Wy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: X1, moduleId: Ja, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: tR() };
}
Object.assign({}, Ys, { getMetrics: tR, info: P9, healthCheck: T9, MODULE_ID: Ja, VERSION: X1 });
const Fm = {
  async init() {
    return At.isReady() ? { success: !0, alreadyInitialized: !0 } : (At.setInitializing(), Ys.init(), At.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = R9(e), { Template: i } = await Promise.resolve().then(() => N9);
    if (t.innerHTML = i.render(n.props), At.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--target");
      o && Ys.bindClick(o, () => Ys.emitClicked(n.props));
    }
    return Ys.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    At.setUnmounting(), Ys.cleanup();
    const t = At.getContainer();
    return t && (t.innerHTML = ""), Ys.emitUnmounted(), At.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ys.destroy(), At.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return At.info();
  }
};
({ ...Fm });
const Hn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Pu = { getState() {
  return { ...Hn };
}, setProps(t) {
  Hn.props = t;
}, getProps() {
  return Hn.props;
}, setVisible(t) {
  Hn.isVisible = !!t;
}, setHovered(t) {
  Hn.isHovered = !!t;
}, markRender() {
  Hn.lastRender = Date.now();
}, reset() {
  Hn.props = null, Hn.isVisible = !0, Hn.isHovered = !1, Hn.lastRender = null;
} }, eR = {
  render(t = {}) {
    const e = QD.SIZES[t.size] || QD.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "target", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--target", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="target"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>`;
  },
  getSvgPath() {
    return 'circle cx="12" cy="12" r="10"';
  }
};
({ ...eR });
const N9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: eR
}, Symbol.toStringTag, { value: "Module" })), ep = "footer.icon.target.tracker", rE = "2.2.0-P18EC", Yr = h({ moduleId: ep });
function S9(t) {
  return Yr.inject(t);
}
function L9() {
  return Yr.snapshot();
}
const Zo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Si = { trackRender(t) {
  Zo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Zo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Zo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Zo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Zo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Yr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: ep }, e));
}, getMetrics() {
  return Object.assign({}, Zo);
}, reset() {
  for (const t in Zo) Zo[t] = 0;
} };
function dH() {
  return Si.getMetrics();
}
function A9(t) {
  return Yr.init(), t && t.ports && Yr.inject(t.ports), { ok: !0, version: rE };
}
function z9() {
  return { status: Yr.isInitialized() ? "HEALTHY" : "DEGRADED", version: rE, moduleId: ep, portsInitialized: Yr.isInitialized(), metrics: dH() };
}
function U9() {
  return { moduleId: ep, version: rE, metrics: dH(), portsInitialized: Yr.isInitialized() };
}
Object.assign({}, Si, { init: A9, info: U9, healthCheck: z9, MODULE_ID: ep, VERSION: rE, injectPorts: S9, getPorts: L9 });
const mH = "footer-icon-target-logger", H9 = g({ moduleId: mH });
function j9(t) {
  return H9.get(t);
}
function u_(t, e) {
  const n = j9("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: mH });
}
const Jc = { info(...t) {
  u_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  u_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  u_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  u_("debug", Array.prototype.slice.call(t));
} };
Jc.info, Jc.warn, Jc.error, Jc.debug;
const tC = "footer-icon-target", Kf = "1.0.1-ENTERPRISE";
function HT(t, ...e) {
  Jc && typeof Jc[t] == "function" && Jc[t]("[TARGET]", ...e);
}
const Jy = {
  getVersion() {
    return Kf;
  },
  getModuleId() {
    return tC;
  },
  async init(t = {}) {
    return HT("info", "Init"), await Fm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Fm.mount(t, e);
      return Pu.setProps(n.props), Pu.markRender(), Si.trackMount(), Si.trackRender(n.props), n;
    } catch (n) {
      throw Si.trackError(n), HT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Pu.setProps(t), Pu.markRender(), Si.trackRender(t), eR.render(t);
  },
  async unmount() {
    Si.trackUnmount();
    const t = await Fm.unmount();
    return Pu.reset(), t;
  },
  async destroy() {
    const t = await Fm.destroy();
    return Pu.reset(), Si.reset(), t;
  },
  healthCheck() {
    const t = At.info(), e = Si.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Kf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: tC, version: Kf, lifecycle: At.info(), metrics: Si.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconTarget = { getVersion: () => Kf, info: () => Jy.info(), healthCheck: () => Jy.healthCheck() });
const B9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: tC,
  TargetIcon: Jy,
  VERSION: Kf,
  default: Jy
}, Symbol.toStringTag, { value: "Module" })), eC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "sun" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, V9 = (t = {}) => {
  const e = [], n = {};
  return Object.entries(eC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let ze = "idle", d_ = null, jT = 0;
const zt = { getPhase() {
  return ze;
}, isReady() {
  return ze === "ready" || ze === "mounted";
}, isMounted() {
  return ze === "mounted";
}, setInitializing() {
  ze = "initializing";
}, setReady() {
  ze = "ready";
}, setMounted(t) {
  ze = "mounted", d_ = t, jT++;
}, setUnmounting() {
  ze = "unmounting";
}, setDestroyed() {
  ze = "destroyed", d_ = null;
}, reset() {
  ze = "idle", d_ = null;
}, getContainer() {
  return d_;
}, info() {
  return { phase: ze, isMounted: this.isMounted(), mountCount: jT };
} };
({ ...zt });
const Qa = "footer-icon-sun-events", nR = "1.5.0-P18EC", nC = "footer:sun", cE = h({ moduleId: Qa });
function x9() {
  cE.init();
}
function Qy(t) {
  return cE.get(t);
}
const wd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function BT(t) {
  t === void 0 && (t = {}), wd.uiActions++;
  const e = Qy("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: nC, source: Qa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Sun" }, t) });
}
const Fs = { _clickHandler: null, _element: null, init() {
  x9();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    wd.clicks++, e && e(), BT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  wd.clicks++, BT({ clicked: !0, props: t });
}, emitMounted(t) {
  wd.mounts++;
  const e = Qy("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: nC, moduleId: Qa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  wd.unmounts++;
  const t = Qy("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: nC, moduleId: Qa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function iR() {
  return Object.assign({}, wd);
}
function G9() {
  const t = cE.snapshot();
  return { moduleId: Qa, version: nR, metrics: iR(), portsInitialized: t._initialized };
}
function Y9() {
  const t = cE.snapshot(), e = Qy("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: nR, moduleId: Qa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: iR() };
}
Object.assign({}, Fs, { getMetrics: iR, info: G9, healthCheck: Y9, MODULE_ID: Qa, VERSION: nR });
const qm = {
  async init() {
    return zt.isReady() ? { success: !0, alreadyInitialized: !0 } : (zt.setInitializing(), Fs.init(), zt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = V9(e), { Template: i } = await Promise.resolve().then(() => F9);
    if (t.innerHTML = i.render(n.props), zt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--sun");
      o && Fs.bindClick(o, () => Fs.emitClicked(n.props));
    }
    return Fs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    zt.setUnmounting(), Fs.cleanup();
    const t = zt.getContainer();
    return t && (t.innerHTML = ""), Fs.emitUnmounted(), zt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Fs.destroy(), zt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return zt.info();
  }
};
({ ...qm });
const jn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Tu = { getState() {
  return { ...jn };
}, setProps(t) {
  jn.props = t;
}, getProps() {
  return jn.props;
}, setVisible(t) {
  jn.isVisible = !!t;
}, setHovered(t) {
  jn.isHovered = !!t;
}, markRender() {
  jn.lastRender = Date.now();
}, reset() {
  jn.props = null, jn.isVisible = !0, jn.isHovered = !1, jn.lastRender = null;
} }, oR = {
  render(t = {}) {
    const e = eC.SIZES[t.size] || eC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "sun", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--sun", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="sun"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></span>`;
  },
  getSvgPath() {
    return 'circle cx="12" cy="12" r="5"';
  }
};
({ ...oR });
const F9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: oR
}, Symbol.toStringTag, { value: "Module" })), np = "footer.icon.sun.tracker", aE = "2.2.0-P18EC", Fr = h({ moduleId: np });
function q9(t) {
  return Fr.inject(t);
}
function Z9() {
  return Fr.snapshot();
}
const Ko = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Li = { trackRender(t) {
  Ko.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Ko.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Ko.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Ko.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Ko.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Fr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: np }, e));
}, getMetrics() {
  return Object.assign({}, Ko);
}, reset() {
  for (const t in Ko) Ko[t] = 0;
} };
function fH() {
  return Li.getMetrics();
}
function K9(t) {
  return Fr.init(), t && t.ports && Fr.inject(t.ports), { ok: !0, version: aE };
}
function W9() {
  return { status: Fr.isInitialized() ? "HEALTHY" : "DEGRADED", version: aE, moduleId: np, portsInitialized: Fr.isInitialized(), metrics: fH() };
}
function J9() {
  return { moduleId: np, version: aE, metrics: fH(), portsInitialized: Fr.isInitialized() };
}
Object.assign({}, Li, { init: K9, info: J9, healthCheck: W9, MODULE_ID: np, VERSION: aE, injectPorts: q9, getPorts: Z9 });
const hH = "footer-icon-sun-logger", Q9 = g({ moduleId: hH });
function X9(t) {
  return Q9.get(t);
}
function m_(t, e) {
  const n = X9("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: hH });
}
const Qc = { info(...t) {
  m_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  m_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  m_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  m_("debug", Array.prototype.slice.call(t));
} };
Qc.info, Qc.warn, Qc.error, Qc.debug;
const iC = "footer-icon-sun", Wf = "1.0.1-ENTERPRISE";
function VT(t, ...e) {
  Qc && typeof Qc[t] == "function" && Qc[t]("[SUN]", ...e);
}
const Xy = {
  getVersion() {
    return Wf;
  },
  getModuleId() {
    return iC;
  },
  async init(t = {}) {
    return VT("info", "Init"), await qm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await qm.mount(t, e);
      return Tu.setProps(n.props), Tu.markRender(), Li.trackMount(), Li.trackRender(n.props), n;
    } catch (n) {
      throw Li.trackError(n), VT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Tu.setProps(t), Tu.markRender(), Li.trackRender(t), oR.render(t);
  },
  async unmount() {
    Li.trackUnmount();
    const t = await qm.unmount();
    return Tu.reset(), t;
  },
  async destroy() {
    const t = await qm.destroy();
    return Tu.reset(), Li.reset(), t;
  },
  healthCheck() {
    const t = zt.info(), e = Li.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Wf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: iC, version: Wf, lifecycle: zt.info(), metrics: Li.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconSun = { getVersion: () => Wf, info: () => Xy.info(), healthCheck: () => Xy.healthCheck() });
const tq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: iC,
  SunIcon: Xy,
  VERSION: Wf,
  default: Xy
}, Symbol.toStringTag, { value: "Module" })), oC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "search" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, eq = (t = {}) => {
  const e = [], n = {};
  return Object.entries(oC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ue = "idle", f_ = null, xT = 0;
const Ut = { getPhase() {
  return Ue;
}, isReady() {
  return Ue === "ready" || Ue === "mounted";
}, isMounted() {
  return Ue === "mounted";
}, setInitializing() {
  Ue = "initializing";
}, setReady() {
  Ue = "ready";
}, setMounted(t) {
  Ue = "mounted", f_ = t, xT++;
}, setUnmounting() {
  Ue = "unmounting";
}, setDestroyed() {
  Ue = "destroyed", f_ = null;
}, reset() {
  Ue = "idle", f_ = null;
}, getContainer() {
  return f_;
}, info() {
  return { phase: Ue, isMounted: this.isMounted(), mountCount: xT };
} };
({ ...Ut });
const Xa = "footer-icon-search-events", sR = "1.5.0-P18EC", sC = "footer:search", lE = h({ moduleId: Xa });
function nq() {
  lE.init();
}
function tk(t) {
  return lE.get(t);
}
const Pd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function GT(t) {
  t === void 0 && (t = {}), Pd.uiActions++;
  const e = tk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: sC, source: Xa, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Search" }, t) });
}
const qs = { _clickHandler: null, _element: null, init() {
  nq();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Pd.clicks++, e && e(), GT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Pd.clicks++, GT({ clicked: !0, props: t });
}, emitMounted(t) {
  Pd.mounts++;
  const e = tk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: sC, moduleId: Xa, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Pd.unmounts++;
  const t = tk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: sC, moduleId: Xa, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function rR() {
  return Object.assign({}, Pd);
}
function iq() {
  const t = lE.snapshot();
  return { moduleId: Xa, version: sR, metrics: rR(), portsInitialized: t._initialized };
}
function oq() {
  const t = lE.snapshot(), e = tk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: sR, moduleId: Xa, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: rR() };
}
Object.assign({}, qs, { getMetrics: rR, info: iq, healthCheck: oq, MODULE_ID: Xa, VERSION: sR });
const Zm = {
  async init() {
    return Ut.isReady() ? { success: !0, alreadyInitialized: !0 } : (Ut.setInitializing(), qs.init(), Ut.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = eq(e), { Template: i } = await Promise.resolve().then(() => sq);
    if (t.innerHTML = i.render(n.props), Ut.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--search");
      o && qs.bindClick(o, () => qs.emitClicked(n.props));
    }
    return qs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Ut.setUnmounting(), qs.cleanup();
    const t = Ut.getContainer();
    return t && (t.innerHTML = ""), qs.emitUnmounted(), Ut.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), qs.destroy(), Ut.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Ut.info();
  }
};
({ ...Zm });
const Bn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Nu = { getState() {
  return { ...Bn };
}, setProps(t) {
  Bn.props = t;
}, getProps() {
  return Bn.props;
}, setVisible(t) {
  Bn.isVisible = !!t;
}, setHovered(t) {
  Bn.isHovered = !!t;
}, markRender() {
  Bn.lastRender = Date.now();
}, reset() {
  Bn.props = null, Bn.isVisible = !0, Bn.isHovered = !1, Bn.lastRender = null;
} }, cR = {
  render(t = {}) {
    const e = oC.SIZES[t.size] || oC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "search", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--search", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="search"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>`;
  },
  getSvgPath() {
    return 'circle cx="11" cy="11" r="8"';
  }
};
({ ...cR });
const sq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: cR
}, Symbol.toStringTag, { value: "Module" })), ip = "footer.icon.search.tracker", uE = "2.2.0-P18EC", qr = h({ moduleId: ip });
function rq(t) {
  return qr.inject(t);
}
function cq() {
  return qr.snapshot();
}
const Wo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ai = { trackRender(t) {
  Wo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Wo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Wo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Wo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Wo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = qr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: ip }, e));
}, getMetrics() {
  return Object.assign({}, Wo);
}, reset() {
  for (const t in Wo) Wo[t] = 0;
} };
function pH() {
  return Ai.getMetrics();
}
function aq(t) {
  return qr.init(), t && t.ports && qr.inject(t.ports), { ok: !0, version: uE };
}
function lq() {
  return { status: qr.isInitialized() ? "HEALTHY" : "DEGRADED", version: uE, moduleId: ip, portsInitialized: qr.isInitialized(), metrics: pH() };
}
function uq() {
  return { moduleId: ip, version: uE, metrics: pH(), portsInitialized: qr.isInitialized() };
}
Object.assign({}, Ai, { init: aq, info: uq, healthCheck: lq, MODULE_ID: ip, VERSION: uE, injectPorts: rq, getPorts: cq });
const gH = "footer-icon-search-logger", dq = g({ moduleId: gH });
function mq(t) {
  return dq.get(t);
}
function h_(t, e) {
  const n = mq("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: gH });
}
const Xc = { info(...t) {
  h_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  h_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  h_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  h_("debug", Array.prototype.slice.call(t));
} };
Xc.info, Xc.warn, Xc.error, Xc.debug;
const rC = "footer-icon-search", Jf = "1.0.1-ENTERPRISE";
function YT(t, ...e) {
  Xc && typeof Xc[t] == "function" && Xc[t]("[SEARCH]", ...e);
}
const ek = {
  getVersion() {
    return Jf;
  },
  getModuleId() {
    return rC;
  },
  async init(t = {}) {
    return YT("info", "Init"), await Zm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Zm.mount(t, e);
      return Nu.setProps(n.props), Nu.markRender(), Ai.trackMount(), Ai.trackRender(n.props), n;
    } catch (n) {
      throw Ai.trackError(n), YT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Nu.setProps(t), Nu.markRender(), Ai.trackRender(t), cR.render(t);
  },
  async unmount() {
    Ai.trackUnmount();
    const t = await Zm.unmount();
    return Nu.reset(), t;
  },
  async destroy() {
    const t = await Zm.destroy();
    return Nu.reset(), Ai.reset(), t;
  },
  healthCheck() {
    const t = Ut.info(), e = Ai.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Jf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: rC, version: Jf, lifecycle: Ut.info(), metrics: Ai.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconSearch = { getVersion: () => Jf, info: () => ek.info(), healthCheck: () => ek.healthCheck() });
const fq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: rC,
  SearchIcon: ek,
  VERSION: Jf,
  default: ek
}, Symbol.toStringTag, { value: "Module" })), cC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "pie-chart" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, hq = (t = {}) => {
  const e = [], n = {};
  return Object.entries(cC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let He = "idle", p_ = null, FT = 0;
const Ht = { getPhase() {
  return He;
}, isReady() {
  return He === "ready" || He === "mounted";
}, isMounted() {
  return He === "mounted";
}, setInitializing() {
  He = "initializing";
}, setReady() {
  He = "ready";
}, setMounted(t) {
  He = "mounted", p_ = t, FT++;
}, setUnmounting() {
  He = "unmounting";
}, setDestroyed() {
  He = "destroyed", p_ = null;
}, reset() {
  He = "idle", p_ = null;
}, getContainer() {
  return p_;
}, info() {
  return { phase: He, isMounted: this.isMounted(), mountCount: FT };
} };
({ ...Ht });
const tl = "footer-icon-pie-chart-events", aR = "1.5.0-P18EC", aC = "footer:pie-chart", dE = h({ moduleId: tl });
function pq() {
  dE.init();
}
function nk(t) {
  return dE.get(t);
}
const Td = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function qT(t) {
  t === void 0 && (t = {}), Td.uiActions++;
  const e = nk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: aC, source: tl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Pie Chart" }, t) });
}
const Zs = { _clickHandler: null, _element: null, init() {
  pq();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Td.clicks++, e && e(), qT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Td.clicks++, qT({ clicked: !0, props: t });
}, emitMounted(t) {
  Td.mounts++;
  const e = nk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: aC, moduleId: tl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Td.unmounts++;
  const t = nk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: aC, moduleId: tl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function lR() {
  return Object.assign({}, Td);
}
function gq() {
  const t = dE.snapshot();
  return { moduleId: tl, version: aR, metrics: lR(), portsInitialized: t._initialized };
}
function _q() {
  const t = dE.snapshot(), e = nk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: aR, moduleId: tl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: lR() };
}
Object.assign({}, Zs, { getMetrics: lR, info: gq, healthCheck: _q, MODULE_ID: tl, VERSION: aR });
const Km = {
  async init() {
    return Ht.isReady() ? { success: !0, alreadyInitialized: !0 } : (Ht.setInitializing(), Zs.init(), Ht.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = hq(e), { Template: i } = await Promise.resolve().then(() => vq);
    if (t.innerHTML = i.render(n.props), Ht.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--pie-chart");
      o && Zs.bindClick(o, () => Zs.emitClicked(n.props));
    }
    return Zs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Ht.setUnmounting(), Zs.cleanup();
    const t = Ht.getContainer();
    return t && (t.innerHTML = ""), Zs.emitUnmounted(), Ht.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Zs.destroy(), Ht.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Ht.info();
  }
};
({ ...Km });
const Vn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Su = { getState() {
  return { ...Vn };
}, setProps(t) {
  Vn.props = t;
}, getProps() {
  return Vn.props;
}, setVisible(t) {
  Vn.isVisible = !!t;
}, setHovered(t) {
  Vn.isHovered = !!t;
}, markRender() {
  Vn.lastRender = Date.now();
}, reset() {
  Vn.props = null, Vn.isVisible = !0, Vn.isHovered = !1, Vn.lastRender = null;
} }, uR = {
  render(t = {}) {
    const e = cC.SIZES[t.size] || cC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "pie chart", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--pie-chart", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="pie-chart"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></span>`;
  },
  getSvgPath() {
    return "M21.21 15.89A10 10 0 1 1 8 2.83";
  }
};
({ ...uR });
const vq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: uR
}, Symbol.toStringTag, { value: "Module" })), op = "footer.icon.pie-chart.tracker", mE = "2.2.0-P18EC", Zr = h({ moduleId: op });
function $q(t) {
  return Zr.inject(t);
}
function yq() {
  return Zr.snapshot();
}
const Jo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, zi = { trackRender(t) {
  Jo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Jo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Jo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Jo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Jo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Zr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: op }, e));
}, getMetrics() {
  return Object.assign({}, Jo);
}, reset() {
  for (const t in Jo) Jo[t] = 0;
} };
function _H() {
  return zi.getMetrics();
}
function kq(t) {
  return Zr.init(), t && t.ports && Zr.inject(t.ports), { ok: !0, version: mE };
}
function bq() {
  return { status: Zr.isInitialized() ? "HEALTHY" : "DEGRADED", version: mE, moduleId: op, portsInitialized: Zr.isInitialized(), metrics: _H() };
}
function Eq() {
  return { moduleId: op, version: mE, metrics: _H(), portsInitialized: Zr.isInitialized() };
}
Object.assign({}, zi, { init: kq, info: Eq, healthCheck: bq, MODULE_ID: op, VERSION: mE, injectPorts: $q, getPorts: yq });
const vH = "footer-icon-pie-chart-logger", Iq = g({ moduleId: vH });
function Oq(t) {
  return Iq.get(t);
}
function g_(t, e) {
  const n = Oq("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: vH });
}
const ta = { info(...t) {
  g_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  g_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  g_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  g_("debug", Array.prototype.slice.call(t));
} };
ta.info, ta.warn, ta.error, ta.debug;
const lC = "footer-icon-pie-chart", Qf = "1.0.1-ENTERPRISE";
function ZT(t, ...e) {
  ta && typeof ta[t] == "function" && ta[t]("[PIE-CHART]", ...e);
}
const ik = {
  getVersion() {
    return Qf;
  },
  getModuleId() {
    return lC;
  },
  async init(t = {}) {
    return ZT("info", "Init"), await Km.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Km.mount(t, e);
      return Su.setProps(n.props), Su.markRender(), zi.trackMount(), zi.trackRender(n.props), n;
    } catch (n) {
      throw zi.trackError(n), ZT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Su.setProps(t), Su.markRender(), zi.trackRender(t), uR.render(t);
  },
  async unmount() {
    zi.trackUnmount();
    const t = await Km.unmount();
    return Su.reset(), t;
  },
  async destroy() {
    const t = await Km.destroy();
    return Su.reset(), zi.reset(), t;
  },
  healthCheck() {
    const t = Ht.info(), e = zi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Qf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: lC, version: Qf, lifecycle: Ht.info(), metrics: zi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconPieChart = { getVersion: () => Qf, info: () => ik.info(), healthCheck: () => ik.healthCheck() });
const Dq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: lC,
  PieChartIcon: ik,
  VERSION: Qf,
  default: ik
}, Symbol.toStringTag, { value: "Module" })), uC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "lock" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, Cq = (t = {}) => {
  const e = [], n = {};
  return Object.entries(uC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let je = "idle", __ = null, KT = 0;
const jt = { getPhase() {
  return je;
}, isReady() {
  return je === "ready" || je === "mounted";
}, isMounted() {
  return je === "mounted";
}, setInitializing() {
  je = "initializing";
}, setReady() {
  je = "ready";
}, setMounted(t) {
  je = "mounted", __ = t, KT++;
}, setUnmounting() {
  je = "unmounting";
}, setDestroyed() {
  je = "destroyed", __ = null;
}, reset() {
  je = "idle", __ = null;
}, getContainer() {
  return __;
}, info() {
  return { phase: je, isMounted: this.isMounted(), mountCount: KT };
} };
({ ...jt });
const el = "footer-icon-lock-events", dR = "1.5.0-P18EC", dC = "footer:lock", fE = h({ moduleId: el });
function Mq() {
  fE.init();
}
function ok(t) {
  return fE.get(t);
}
const Nd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function WT(t) {
  t === void 0 && (t = {}), Nd.uiActions++;
  const e = ok("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: dC, source: el, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Lock" }, t) });
}
const Ks = { _clickHandler: null, _element: null, init() {
  Mq();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Nd.clicks++, e && e(), WT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Nd.clicks++, WT({ clicked: !0, props: t });
}, emitMounted(t) {
  Nd.mounts++;
  const e = ok("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: dC, moduleId: el, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Nd.unmounts++;
  const t = ok("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: dC, moduleId: el, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function mR() {
  return Object.assign({}, Nd);
}
function Rq() {
  const t = fE.snapshot();
  return { moduleId: el, version: dR, metrics: mR(), portsInitialized: t._initialized };
}
function wq() {
  const t = fE.snapshot(), e = ok("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: dR, moduleId: el, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: mR() };
}
Object.assign({}, Ks, { getMetrics: mR, info: Rq, healthCheck: wq, MODULE_ID: el, VERSION: dR });
const Wm = {
  async init() {
    return jt.isReady() ? { success: !0, alreadyInitialized: !0 } : (jt.setInitializing(), Ks.init(), jt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = Cq(e), { Template: i } = await Promise.resolve().then(() => Pq);
    if (t.innerHTML = i.render(n.props), jt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--lock");
      o && Ks.bindClick(o, () => Ks.emitClicked(n.props));
    }
    return Ks.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    jt.setUnmounting(), Ks.cleanup();
    const t = jt.getContainer();
    return t && (t.innerHTML = ""), Ks.emitUnmounted(), jt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ks.destroy(), jt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return jt.info();
  }
};
({ ...Wm });
const xn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Lu = { getState() {
  return { ...xn };
}, setProps(t) {
  xn.props = t;
}, getProps() {
  return xn.props;
}, setVisible(t) {
  xn.isVisible = !!t;
}, setHovered(t) {
  xn.isHovered = !!t;
}, markRender() {
  xn.lastRender = Date.now();
}, reset() {
  xn.props = null, xn.isVisible = !0, xn.isHovered = !1, xn.lastRender = null;
} }, fR = {
  render(t = {}) {
    const e = uC.SIZES[t.size] || uC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "lock", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--lock", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="lock"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>`;
  },
  getSvgPath() {
    return "M7 11V7a5 5 0 0 1 10 0v4";
  }
};
({ ...fR });
const Pq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: fR
}, Symbol.toStringTag, { value: "Module" })), sp = "footer.icon.lock.tracker", hE = "2.2.0-P18EC", Kr = h({ moduleId: sp });
function Tq(t) {
  return Kr.inject(t);
}
function Nq() {
  return Kr.snapshot();
}
const Qo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ui = { trackRender(t) {
  Qo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Qo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Qo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Qo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Qo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Kr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: sp }, e));
}, getMetrics() {
  return Object.assign({}, Qo);
}, reset() {
  for (const t in Qo) Qo[t] = 0;
} };
function $H() {
  return Ui.getMetrics();
}
function Sq(t) {
  return Kr.init(), t && t.ports && Kr.inject(t.ports), { ok: !0, version: hE };
}
function Lq() {
  return { status: Kr.isInitialized() ? "HEALTHY" : "DEGRADED", version: hE, moduleId: sp, portsInitialized: Kr.isInitialized(), metrics: $H() };
}
function Aq() {
  return { moduleId: sp, version: hE, metrics: $H(), portsInitialized: Kr.isInitialized() };
}
Object.assign({}, Ui, { init: Sq, info: Aq, healthCheck: Lq, MODULE_ID: sp, VERSION: hE, injectPorts: Tq, getPorts: Nq });
const yH = "footer-icon-lock-logger", zq = g({ moduleId: yH });
function Uq(t) {
  return zq.get(t);
}
function v_(t, e) {
  const n = Uq("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: yH });
}
const ea = { info(...t) {
  v_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  v_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  v_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  v_("debug", Array.prototype.slice.call(t));
} };
ea.info, ea.warn, ea.error, ea.debug;
const mC = "footer-icon-lock", Xf = "1.0.1-ENTERPRISE";
function JT(t, ...e) {
  ea && typeof ea[t] == "function" && ea[t]("[LOCK]", ...e);
}
const sk = {
  getVersion() {
    return Xf;
  },
  getModuleId() {
    return mC;
  },
  async init(t = {}) {
    return JT("info", "Init"), await Wm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Wm.mount(t, e);
      return Lu.setProps(n.props), Lu.markRender(), Ui.trackMount(), Ui.trackRender(n.props), n;
    } catch (n) {
      throw Ui.trackError(n), JT("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Lu.setProps(t), Lu.markRender(), Ui.trackRender(t), fR.render(t);
  },
  async unmount() {
    Ui.trackUnmount();
    const t = await Wm.unmount();
    return Lu.reset(), t;
  },
  async destroy() {
    const t = await Wm.destroy();
    return Lu.reset(), Ui.reset(), t;
  },
  healthCheck() {
    const t = jt.info(), e = Ui.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: Xf, timestamp: Date.now() };
  },
  info() {
    return { moduleId: mC, version: Xf, lifecycle: jt.info(), metrics: Ui.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconLock = { getVersion: () => Xf, info: () => sk.info(), healthCheck: () => sk.healthCheck() });
const Hq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LockIcon: sk,
  MODULE_ID: mC,
  VERSION: Xf,
  default: sk
}, Symbol.toStringTag, { value: "Module" })), fC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "link" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, jq = (t = {}) => {
  const e = [], n = {};
  return Object.entries(fC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Be = "idle", $_ = null, QT = 0;
const Bt = { getPhase() {
  return Be;
}, isReady() {
  return Be === "ready" || Be === "mounted";
}, isMounted() {
  return Be === "mounted";
}, setInitializing() {
  Be = "initializing";
}, setReady() {
  Be = "ready";
}, setMounted(t) {
  Be = "mounted", $_ = t, QT++;
}, setUnmounting() {
  Be = "unmounting";
}, setDestroyed() {
  Be = "destroyed", $_ = null;
}, reset() {
  Be = "idle", $_ = null;
}, getContainer() {
  return $_;
}, info() {
  return { phase: Be, isMounted: this.isMounted(), mountCount: QT };
} };
({ ...Bt });
const nl = "footer-icon-link-events", hR = "1.5.0-P18EC", hC = "footer:link", pE = h({ moduleId: nl });
function Bq() {
  pE.init();
}
function rk(t) {
  return pE.get(t);
}
const Sd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function XT(t) {
  t === void 0 && (t = {}), Sd.uiActions++;
  const e = rk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: hC, source: nl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Link" }, t) });
}
const Ws = { _clickHandler: null, _element: null, init() {
  Bq();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Sd.clicks++, e && e(), XT({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Sd.clicks++, XT({ clicked: !0, props: t });
}, emitMounted(t) {
  Sd.mounts++;
  const e = rk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: hC, moduleId: nl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Sd.unmounts++;
  const t = rk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: hC, moduleId: nl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function pR() {
  return Object.assign({}, Sd);
}
function Vq() {
  const t = pE.snapshot();
  return { moduleId: nl, version: hR, metrics: pR(), portsInitialized: t._initialized };
}
function xq() {
  const t = pE.snapshot(), e = rk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: hR, moduleId: nl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: pR() };
}
Object.assign({}, Ws, { getMetrics: pR, info: Vq, healthCheck: xq, MODULE_ID: nl, VERSION: hR });
const Jm = {
  async init() {
    return Bt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Bt.setInitializing(), Ws.init(), Bt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = jq(e), { Template: i } = await Promise.resolve().then(() => Gq);
    if (t.innerHTML = i.render(n.props), Bt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--link");
      o && Ws.bindClick(o, () => Ws.emitClicked(n.props));
    }
    return Ws.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Bt.setUnmounting(), Ws.cleanup();
    const t = Bt.getContainer();
    return t && (t.innerHTML = ""), Ws.emitUnmounted(), Bt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Ws.destroy(), Bt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Bt.info();
  }
};
({ ...Jm });
const Gn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Au = { getState() {
  return { ...Gn };
}, setProps(t) {
  Gn.props = t;
}, getProps() {
  return Gn.props;
}, setVisible(t) {
  Gn.isVisible = !!t;
}, setHovered(t) {
  Gn.isHovered = !!t;
}, markRender() {
  Gn.lastRender = Date.now();
}, reset() {
  Gn.props = null, Gn.isVisible = !0, Gn.isHovered = !1, Gn.lastRender = null;
} }, gR = {
  render(t = {}) {
    const e = fC.SIZES[t.size] || fC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "link", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--link", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="link"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>`;
  },
  getSvgPath() {
    return "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71";
  }
};
({ ...gR });
const Gq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: gR
}, Symbol.toStringTag, { value: "Module" })), rp = "footer.icon.link.tracker", gE = "2.2.0-P18EC", Wr = h({ moduleId: rp });
function Yq(t) {
  return Wr.inject(t);
}
function Fq() {
  return Wr.snapshot();
}
const Xo = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Hi = { trackRender(t) {
  Xo.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  Xo.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  Xo.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  Xo.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  Xo.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Wr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: rp }, e));
}, getMetrics() {
  return Object.assign({}, Xo);
}, reset() {
  for (const t in Xo) Xo[t] = 0;
} };
function kH() {
  return Hi.getMetrics();
}
function qq(t) {
  return Wr.init(), t && t.ports && Wr.inject(t.ports), { ok: !0, version: gE };
}
function Zq() {
  return { status: Wr.isInitialized() ? "HEALTHY" : "DEGRADED", version: gE, moduleId: rp, portsInitialized: Wr.isInitialized(), metrics: kH() };
}
function Kq() {
  return { moduleId: rp, version: gE, metrics: kH(), portsInitialized: Wr.isInitialized() };
}
Object.assign({}, Hi, { init: qq, info: Kq, healthCheck: Zq, MODULE_ID: rp, VERSION: gE, injectPorts: Yq, getPorts: Fq });
const bH = "footer-icon-link-logger", Wq = g({ moduleId: bH });
function Jq(t) {
  return Wq.get(t);
}
function y_(t, e) {
  const n = Jq("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: bH });
}
const na = { info(...t) {
  y_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  y_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  y_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  y_("debug", Array.prototype.slice.call(t));
} };
na.info, na.warn, na.error, na.debug;
const pC = "footer-icon-link", th = "1.0.1-ENTERPRISE";
function t2(t, ...e) {
  na && typeof na[t] == "function" && na[t]("[LINK]", ...e);
}
const ck = {
  getVersion() {
    return th;
  },
  getModuleId() {
    return pC;
  },
  async init(t = {}) {
    return t2("info", "Init"), await Jm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Jm.mount(t, e);
      return Au.setProps(n.props), Au.markRender(), Hi.trackMount(), Hi.trackRender(n.props), n;
    } catch (n) {
      throw Hi.trackError(n), t2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Au.setProps(t), Au.markRender(), Hi.trackRender(t), gR.render(t);
  },
  async unmount() {
    Hi.trackUnmount();
    const t = await Jm.unmount();
    return Au.reset(), t;
  },
  async destroy() {
    const t = await Jm.destroy();
    return Au.reset(), Hi.reset(), t;
  },
  healthCheck() {
    const t = Bt.info(), e = Hi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: th, timestamp: Date.now() };
  },
  info() {
    return { moduleId: pC, version: th, lifecycle: Bt.info(), metrics: Hi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconLink = { getVersion: () => th, info: () => ck.info(), healthCheck: () => ck.healthCheck() });
const Qq = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LinkIcon: ck,
  MODULE_ID: pC,
  VERSION: th,
  default: ck
}, Symbol.toStringTag, { value: "Module" })), gC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "layers" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, Xq = (t = {}) => {
  const e = [], n = {};
  return Object.entries(gC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ve = "idle", k_ = null, e2 = 0;
const Vt = { getPhase() {
  return Ve;
}, isReady() {
  return Ve === "ready" || Ve === "mounted";
}, isMounted() {
  return Ve === "mounted";
}, setInitializing() {
  Ve = "initializing";
}, setReady() {
  Ve = "ready";
}, setMounted(t) {
  Ve = "mounted", k_ = t, e2++;
}, setUnmounting() {
  Ve = "unmounting";
}, setDestroyed() {
  Ve = "destroyed", k_ = null;
}, reset() {
  Ve = "idle", k_ = null;
}, getContainer() {
  return k_;
}, info() {
  return { phase: Ve, isMounted: this.isMounted(), mountCount: e2 };
} };
({ ...Vt });
const il = "footer-icon-layers-events", _R = "1.5.0-P18EC", _C = "footer:layers", _E = h({ moduleId: il });
function tZ() {
  _E.init();
}
function ak(t) {
  return _E.get(t);
}
const Ld = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function n2(t) {
  t === void 0 && (t = {}), Ld.uiActions++;
  const e = ak("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: _C, source: il, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Layers" }, t) });
}
const Js = { _clickHandler: null, _element: null, init() {
  tZ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Ld.clicks++, e && e(), n2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Ld.clicks++, n2({ clicked: !0, props: t });
}, emitMounted(t) {
  Ld.mounts++;
  const e = ak("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: _C, moduleId: il, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Ld.unmounts++;
  const t = ak("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: _C, moduleId: il, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function vR() {
  return Object.assign({}, Ld);
}
function eZ() {
  const t = _E.snapshot();
  return { moduleId: il, version: _R, metrics: vR(), portsInitialized: t._initialized };
}
function nZ() {
  const t = _E.snapshot(), e = ak("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: _R, moduleId: il, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: vR() };
}
Object.assign({}, Js, { getMetrics: vR, info: eZ, healthCheck: nZ, MODULE_ID: il, VERSION: _R });
const Qm = {
  async init() {
    return Vt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Vt.setInitializing(), Js.init(), Vt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = Xq(e), { Template: i } = await Promise.resolve().then(() => iZ);
    if (t.innerHTML = i.render(n.props), Vt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--layers");
      o && Js.bindClick(o, () => Js.emitClicked(n.props));
    }
    return Js.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Vt.setUnmounting(), Js.cleanup();
    const t = Vt.getContainer();
    return t && (t.innerHTML = ""), Js.emitUnmounted(), Vt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Js.destroy(), Vt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Vt.info();
  }
};
({ ...Qm });
const Yn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, zu = { getState() {
  return { ...Yn };
}, setProps(t) {
  Yn.props = t;
}, getProps() {
  return Yn.props;
}, setVisible(t) {
  Yn.isVisible = !!t;
}, setHovered(t) {
  Yn.isHovered = !!t;
}, markRender() {
  Yn.lastRender = Date.now();
}, reset() {
  Yn.props = null, Yn.isVisible = !0, Yn.isHovered = !1, Yn.lastRender = null;
} }, $R = {
  render(t = {}) {
    const e = gC.SIZES[t.size] || gC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "layers", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--layers", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="layers"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></span>`;
  },
  getSvgPath() {
    return "12 2 2 7 12 12 22 7 12 2";
  }
};
({ ...$R });
const iZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: $R
}, Symbol.toStringTag, { value: "Module" })), cp = "footer.icon.layers.tracker", vE = "2.2.0-P18EC", Jr = h({ moduleId: cp });
function oZ(t) {
  return Jr.inject(t);
}
function sZ() {
  return Jr.snapshot();
}
const ts = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, ji = { trackRender(t) {
  ts.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ts.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ts.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ts.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ts.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Jr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: cp }, e));
}, getMetrics() {
  return Object.assign({}, ts);
}, reset() {
  for (const t in ts) ts[t] = 0;
} };
function EH() {
  return ji.getMetrics();
}
function rZ(t) {
  return Jr.init(), t && t.ports && Jr.inject(t.ports), { ok: !0, version: vE };
}
function cZ() {
  return { status: Jr.isInitialized() ? "HEALTHY" : "DEGRADED", version: vE, moduleId: cp, portsInitialized: Jr.isInitialized(), metrics: EH() };
}
function aZ() {
  return { moduleId: cp, version: vE, metrics: EH(), portsInitialized: Jr.isInitialized() };
}
Object.assign({}, ji, { init: rZ, info: aZ, healthCheck: cZ, MODULE_ID: cp, VERSION: vE, injectPorts: oZ, getPorts: sZ });
const IH = "footer-icon-layers-logger", lZ = g({ moduleId: IH });
function uZ(t) {
  return lZ.get(t);
}
function b_(t, e) {
  const n = uZ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: IH });
}
const ia = { info(...t) {
  b_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  b_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  b_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  b_("debug", Array.prototype.slice.call(t));
} };
ia.info, ia.warn, ia.error, ia.debug;
const vC = "footer-icon-layers", eh = "1.0.1-ENTERPRISE";
function i2(t, ...e) {
  ia && typeof ia[t] == "function" && ia[t]("[LAYERS]", ...e);
}
const lk = {
  getVersion() {
    return eh;
  },
  getModuleId() {
    return vC;
  },
  async init(t = {}) {
    return i2("info", "Init"), await Qm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Qm.mount(t, e);
      return zu.setProps(n.props), zu.markRender(), ji.trackMount(), ji.trackRender(n.props), n;
    } catch (n) {
      throw ji.trackError(n), i2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return zu.setProps(t), zu.markRender(), ji.trackRender(t), $R.render(t);
  },
  async unmount() {
    ji.trackUnmount();
    const t = await Qm.unmount();
    return zu.reset(), t;
  },
  async destroy() {
    const t = await Qm.destroy();
    return zu.reset(), ji.reset(), t;
  },
  healthCheck() {
    const t = Vt.info(), e = ji.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: eh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: vC, version: eh, lifecycle: Vt.info(), metrics: ji.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconLayers = { getVersion: () => eh, info: () => lk.info(), healthCheck: () => lk.healthCheck() });
const dZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LayersIcon: lk,
  MODULE_ID: vC,
  VERSION: eh,
  default: lk
}, Symbol.toStringTag, { value: "Module" })), $C = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "inbox" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, mZ = (t = {}) => {
  const e = [], n = {};
  return Object.entries($C.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let xe = "idle", E_ = null, o2 = 0;
const xt = { getPhase() {
  return xe;
}, isReady() {
  return xe === "ready" || xe === "mounted";
}, isMounted() {
  return xe === "mounted";
}, setInitializing() {
  xe = "initializing";
}, setReady() {
  xe = "ready";
}, setMounted(t) {
  xe = "mounted", E_ = t, o2++;
}, setUnmounting() {
  xe = "unmounting";
}, setDestroyed() {
  xe = "destroyed", E_ = null;
}, reset() {
  xe = "idle", E_ = null;
}, getContainer() {
  return E_;
}, info() {
  return { phase: xe, isMounted: this.isMounted(), mountCount: o2 };
} };
({ ...xt });
const ol = "footer-icon-inbox-events", yR = "1.5.0-P18EC", yC = "footer:inbox", $E = h({ moduleId: ol });
function fZ() {
  $E.init();
}
function uk(t) {
  return $E.get(t);
}
const Ad = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function s2(t) {
  t === void 0 && (t = {}), Ad.uiActions++;
  const e = uk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: yC, source: ol, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Inbox" }, t) });
}
const Qs = { _clickHandler: null, _element: null, init() {
  fZ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Ad.clicks++, e && e(), s2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Ad.clicks++, s2({ clicked: !0, props: t });
}, emitMounted(t) {
  Ad.mounts++;
  const e = uk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: yC, moduleId: ol, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Ad.unmounts++;
  const t = uk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: yC, moduleId: ol, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function kR() {
  return Object.assign({}, Ad);
}
function hZ() {
  const t = $E.snapshot();
  return { moduleId: ol, version: yR, metrics: kR(), portsInitialized: t._initialized };
}
function pZ() {
  const t = $E.snapshot(), e = uk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: yR, moduleId: ol, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: kR() };
}
Object.assign({}, Qs, { getMetrics: kR, info: hZ, healthCheck: pZ, MODULE_ID: ol, VERSION: yR });
const Xm = {
  async init() {
    return xt.isReady() ? { success: !0, alreadyInitialized: !0 } : (xt.setInitializing(), Qs.init(), xt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = mZ(e), { Template: i } = await Promise.resolve().then(() => gZ);
    if (t.innerHTML = i.render(n.props), xt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--inbox");
      o && Qs.bindClick(o, () => Qs.emitClicked(n.props));
    }
    return Qs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    xt.setUnmounting(), Qs.cleanup();
    const t = xt.getContainer();
    return t && (t.innerHTML = ""), Qs.emitUnmounted(), xt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Qs.destroy(), xt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return xt.info();
  }
};
({ ...Xm });
const Fn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Uu = { getState() {
  return { ...Fn };
}, setProps(t) {
  Fn.props = t;
}, getProps() {
  return Fn.props;
}, setVisible(t) {
  Fn.isVisible = !!t;
}, setHovered(t) {
  Fn.isHovered = !!t;
}, markRender() {
  Fn.lastRender = Date.now();
}, reset() {
  Fn.props = null, Fn.isVisible = !0, Fn.isHovered = !1, Fn.lastRender = null;
} }, bR = {
  render(t = {}) {
    const e = $C.SIZES[t.size] || $C.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "inbox", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--inbox", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="inbox"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></span>`;
  },
  getSvgPath() {
    return "22 12 16 12 14 15 10 15 8 12 2 12";
  }
};
({ ...bR });
const gZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: bR
}, Symbol.toStringTag, { value: "Module" })), ap = "footer.icon.inbox.tracker", yE = "2.2.0-P18EC", Qr = h({ moduleId: ap });
function _Z(t) {
  return Qr.inject(t);
}
function vZ() {
  return Qr.snapshot();
}
const es = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Bi = { trackRender(t) {
  es.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  es.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  es.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  es.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  es.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Qr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: ap }, e));
}, getMetrics() {
  return Object.assign({}, es);
}, reset() {
  for (const t in es) es[t] = 0;
} };
function OH() {
  return Bi.getMetrics();
}
function $Z(t) {
  return Qr.init(), t && t.ports && Qr.inject(t.ports), { ok: !0, version: yE };
}
function yZ() {
  return { status: Qr.isInitialized() ? "HEALTHY" : "DEGRADED", version: yE, moduleId: ap, portsInitialized: Qr.isInitialized(), metrics: OH() };
}
function kZ() {
  return { moduleId: ap, version: yE, metrics: OH(), portsInitialized: Qr.isInitialized() };
}
Object.assign({}, Bi, { init: $Z, info: kZ, healthCheck: yZ, MODULE_ID: ap, VERSION: yE, injectPorts: _Z, getPorts: vZ });
const DH = "footer-icon-inbox-logger", bZ = g({ moduleId: DH });
function EZ(t) {
  return bZ.get(t);
}
function I_(t, e) {
  const n = EZ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: DH });
}
const oa = { info(...t) {
  I_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  I_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  I_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  I_("debug", Array.prototype.slice.call(t));
} };
oa.info, oa.warn, oa.error, oa.debug;
const kC = "footer-icon-inbox", nh = "1.0.1-ENTERPRISE";
function r2(t, ...e) {
  oa && typeof oa[t] == "function" && oa[t]("[INBOX]", ...e);
}
const dk = {
  getVersion() {
    return nh;
  },
  getModuleId() {
    return kC;
  },
  async init(t = {}) {
    return r2("info", "Init"), await Xm.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await Xm.mount(t, e);
      return Uu.setProps(n.props), Uu.markRender(), Bi.trackMount(), Bi.trackRender(n.props), n;
    } catch (n) {
      throw Bi.trackError(n), r2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Uu.setProps(t), Uu.markRender(), Bi.trackRender(t), bR.render(t);
  },
  async unmount() {
    Bi.trackUnmount();
    const t = await Xm.unmount();
    return Uu.reset(), t;
  },
  async destroy() {
    const t = await Xm.destroy();
    return Uu.reset(), Bi.reset(), t;
  },
  healthCheck() {
    const t = xt.info(), e = Bi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: nh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: kC, version: nh, lifecycle: xt.info(), metrics: Bi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconInbox = { getVersion: () => nh, info: () => dk.info(), healthCheck: () => dk.healthCheck() });
const IZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  InboxIcon: dk,
  MODULE_ID: kC,
  VERSION: nh,
  default: dk
}, Symbol.toStringTag, { value: "Module" })), bC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "at sign" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, OZ = (t = {}) => {
  const e = [], n = {};
  return Object.entries(bC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ge = "idle", O_ = null, c2 = 0;
const Gt = { getPhase() {
  return Ge;
}, isReady() {
  return Ge === "ready" || Ge === "mounted";
}, isMounted() {
  return Ge === "mounted";
}, setInitializing() {
  Ge = "initializing";
}, setReady() {
  Ge = "ready";
}, setMounted(t) {
  Ge = "mounted", O_ = t, c2++;
}, setUnmounting() {
  Ge = "unmounting";
}, setDestroyed() {
  Ge = "destroyed", O_ = null;
}, reset() {
  Ge = "idle", O_ = null;
}, getContainer() {
  return O_;
}, info() {
  return { phase: Ge, isMounted: this.isMounted(), mountCount: c2 };
} };
({ ...Gt });
const sl = "footer-icon-at-sign-events", ER = "1.5.0-P18EC", EC = "footer:at-sign", kE = h({ moduleId: sl });
function DZ() {
  kE.init();
}
function mk(t) {
  return kE.get(t);
}
const zd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function a2(t) {
  t === void 0 && (t = {}), zd.uiActions++;
  const e = mk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: EC, source: sl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "At Sign" }, t) });
}
const Xs = { _clickHandler: null, _element: null, init() {
  DZ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    zd.clicks++, e && e(), a2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  zd.clicks++, a2({ clicked: !0, props: t });
}, emitMounted(t) {
  zd.mounts++;
  const e = mk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: EC, moduleId: sl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  zd.unmounts++;
  const t = mk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: EC, moduleId: sl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function IR() {
  return Object.assign({}, zd);
}
function CZ() {
  const t = kE.snapshot();
  return { moduleId: sl, version: ER, metrics: IR(), portsInitialized: t._initialized };
}
function MZ() {
  const t = kE.snapshot(), e = mk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: ER, moduleId: sl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: IR() };
}
Object.assign({}, Xs, { getMetrics: IR, info: CZ, healthCheck: MZ, MODULE_ID: sl, VERSION: ER });
const tf = {
  async init() {
    return Gt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Gt.setInitializing(), Xs.init(), Gt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = OZ(e), { Template: i } = await Promise.resolve().then(() => RZ);
    if (t.innerHTML = i.render(n.props), Gt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--at-sign");
      o && Xs.bindClick(o, () => Xs.emitClicked(n.props));
    }
    return Xs.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Gt.setUnmounting(), Xs.cleanup();
    const t = Gt.getContainer();
    return t && (t.innerHTML = ""), Xs.emitUnmounted(), Gt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), Xs.destroy(), Gt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Gt.info();
  }
};
({ ...tf });
const qn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Hu = { getState() {
  return { ...qn };
}, setProps(t) {
  qn.props = t;
}, getProps() {
  return qn.props;
}, setVisible(t) {
  qn.isVisible = !!t;
}, setHovered(t) {
  qn.isHovered = !!t;
}, markRender() {
  qn.lastRender = Date.now();
}, reset() {
  qn.props = null, qn.isVisible = !0, qn.isHovered = !1, qn.lastRender = null;
} }, OR = {
  render(t = {}) {
    const e = bC.SIZES[t.size] || bC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "at sign", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--at-sign", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="at-sign"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg></span>`;
  },
  getSvgPath() {
    return 'circle cx="12" cy="12" r="4"';
  }
};
({ ...OR });
const RZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: OR
}, Symbol.toStringTag, { value: "Module" })), lp = "footer.icon.at-sign.tracker", bE = "2.2.0-P18EC", Xr = h({ moduleId: lp });
function wZ(t) {
  return Xr.inject(t);
}
function PZ() {
  return Xr.snapshot();
}
const ns = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Vi = { trackRender(t) {
  ns.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ns.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ns.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ns.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ns.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = Xr.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: lp }, e));
}, getMetrics() {
  return Object.assign({}, ns);
}, reset() {
  for (const t in ns) ns[t] = 0;
} };
function CH() {
  return Vi.getMetrics();
}
function TZ(t) {
  return Xr.init(), t && t.ports && Xr.inject(t.ports), { ok: !0, version: bE };
}
function NZ() {
  return { status: Xr.isInitialized() ? "HEALTHY" : "DEGRADED", version: bE, moduleId: lp, portsInitialized: Xr.isInitialized(), metrics: CH() };
}
function SZ() {
  return { moduleId: lp, version: bE, metrics: CH(), portsInitialized: Xr.isInitialized() };
}
Object.assign({}, Vi, { init: TZ, info: SZ, healthCheck: NZ, MODULE_ID: lp, VERSION: bE, injectPorts: wZ, getPorts: PZ });
const MH = "footer-icon-at-sign-logger", LZ = g({ moduleId: MH });
function AZ(t) {
  return LZ.get(t);
}
function D_(t, e) {
  const n = AZ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: MH });
}
const sa = { info(...t) {
  D_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  D_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  D_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  D_("debug", Array.prototype.slice.call(t));
} };
sa.info, sa.warn, sa.error, sa.debug;
const IC = "footer-icon-at-sign", ih = "1.0.1-ENTERPRISE";
function l2(t, ...e) {
  sa && typeof sa[t] == "function" && sa[t]("[AT-SIGN]", ...e);
}
const fk = {
  getVersion() {
    return ih;
  },
  getModuleId() {
    return IC;
  },
  async init(t = {}) {
    return l2("info", "Init"), await tf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await tf.mount(t, e);
      return Hu.setProps(n.props), Hu.markRender(), Vi.trackMount(), Vi.trackRender(n.props), n;
    } catch (n) {
      throw Vi.trackError(n), l2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Hu.setProps(t), Hu.markRender(), Vi.trackRender(t), OR.render(t);
  },
  async unmount() {
    Vi.trackUnmount();
    const t = await tf.unmount();
    return Hu.reset(), t;
  },
  async destroy() {
    const t = await tf.destroy();
    return Hu.reset(), Vi.reset(), t;
  },
  healthCheck() {
    const t = Gt.info(), e = Vi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: ih, timestamp: Date.now() };
  },
  info() {
    return { moduleId: IC, version: ih, lifecycle: Gt.info(), metrics: Vi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconAtSign = { getVersion: () => ih, info: () => fk.info(), healthCheck: () => fk.healthCheck() });
const zZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AtSignIcon: fk,
  MODULE_ID: IC,
  VERSION: ih,
  default: fk
}, Symbol.toStringTag, { value: "Module" })), OC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "bar chart" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, UZ = (t = {}) => {
  const e = [], n = {};
  return Object.entries(OC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ye = "idle", C_ = null, u2 = 0;
const Yt = { getPhase() {
  return Ye;
}, isReady() {
  return Ye === "ready" || Ye === "mounted";
}, isMounted() {
  return Ye === "mounted";
}, setInitializing() {
  Ye = "initializing";
}, setReady() {
  Ye = "ready";
}, setMounted(t) {
  Ye = "mounted", C_ = t, u2++;
}, setUnmounting() {
  Ye = "unmounting";
}, setDestroyed() {
  Ye = "destroyed", C_ = null;
}, reset() {
  Ye = "idle", C_ = null;
}, getContainer() {
  return C_;
}, info() {
  return { phase: Ye, isMounted: this.isMounted(), mountCount: u2 };
} };
({ ...Yt });
const rl = "footer-icon-bar-chart-events", DR = "1.5.0-P18EC", DC = "footer:bar-chart", EE = h({ moduleId: rl });
function HZ() {
  EE.init();
}
function hk(t) {
  return EE.get(t);
}
const Ud = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function d2(t) {
  t === void 0 && (t = {}), Ud.uiActions++;
  const e = hk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: DC, source: rl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Bar Chart" }, t) });
}
const tr = { _clickHandler: null, _element: null, init() {
  HZ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Ud.clicks++, e && e(), d2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Ud.clicks++, d2({ clicked: !0, props: t });
}, emitMounted(t) {
  Ud.mounts++;
  const e = hk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: DC, moduleId: rl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Ud.unmounts++;
  const t = hk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: DC, moduleId: rl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function CR() {
  return Object.assign({}, Ud);
}
function jZ() {
  const t = EE.snapshot();
  return { moduleId: rl, version: DR, metrics: CR(), portsInitialized: t._initialized };
}
function BZ() {
  const t = EE.snapshot(), e = hk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: DR, moduleId: rl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: CR() };
}
Object.assign({}, tr, { getMetrics: CR, info: jZ, healthCheck: BZ, MODULE_ID: rl, VERSION: DR });
const ef = {
  async init() {
    return Yt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Yt.setInitializing(), tr.init(), Yt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = UZ(e), { Template: i } = await Promise.resolve().then(() => VZ);
    if (t.innerHTML = i.render(n.props), Yt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--bar-chart");
      o && tr.bindClick(o, () => tr.emitClicked(n.props));
    }
    return tr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Yt.setUnmounting(), tr.cleanup();
    const t = Yt.getContainer();
    return t && (t.innerHTML = ""), tr.emitUnmounted(), Yt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), tr.destroy(), Yt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Yt.info();
  }
};
({ ...ef });
const Zn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, ju = { getState() {
  return { ...Zn };
}, setProps(t) {
  Zn.props = t;
}, getProps() {
  return Zn.props;
}, setVisible(t) {
  Zn.isVisible = !!t;
}, setHovered(t) {
  Zn.isHovered = !!t;
}, markRender() {
  Zn.lastRender = Date.now();
}, reset() {
  Zn.props = null, Zn.isVisible = !0, Zn.isHovered = !1, Zn.lastRender = null;
} }, MR = {
  render(t = {}) {
    const e = OC.SIZES[t.size] || OC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "bar chart", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--bar-chart", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="bar-chart"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></span>`;
  },
  getSvgPath() {
    return 'line x1="12" y1="20" x2="12" y2="10"';
  }
};
({ ...MR });
const VZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: MR
}, Symbol.toStringTag, { value: "Module" })), up = "footer.icon.bar-chart.tracker", IE = "2.2.0-P18EC", tc = h({ moduleId: up });
function xZ(t) {
  return tc.inject(t);
}
function GZ() {
  return tc.snapshot();
}
const is = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, xi = { trackRender(t) {
  is.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  is.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  is.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  is.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  is.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = tc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: up }, e));
}, getMetrics() {
  return Object.assign({}, is);
}, reset() {
  for (const t in is) is[t] = 0;
} };
function RH() {
  return xi.getMetrics();
}
function YZ(t) {
  return tc.init(), t && t.ports && tc.inject(t.ports), { ok: !0, version: IE };
}
function FZ() {
  return { status: tc.isInitialized() ? "HEALTHY" : "DEGRADED", version: IE, moduleId: up, portsInitialized: tc.isInitialized(), metrics: RH() };
}
function qZ() {
  return { moduleId: up, version: IE, metrics: RH(), portsInitialized: tc.isInitialized() };
}
Object.assign({}, xi, { init: YZ, info: qZ, healthCheck: FZ, MODULE_ID: up, VERSION: IE, injectPorts: xZ, getPorts: GZ });
const wH = "footer-icon-bar-chart-logger", ZZ = g({ moduleId: wH });
function KZ(t) {
  return ZZ.get(t);
}
function M_(t, e) {
  const n = KZ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: wH });
}
const ra = { info(...t) {
  M_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  M_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  M_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  M_("debug", Array.prototype.slice.call(t));
} };
ra.info, ra.warn, ra.error, ra.debug;
const CC = "footer-icon-bar-chart", oh = "1.0.1-ENTERPRISE";
function m2(t, ...e) {
  ra && typeof ra[t] == "function" && ra[t]("[BAR-CHART]", ...e);
}
const pk = {
  getVersion() {
    return oh;
  },
  getModuleId() {
    return CC;
  },
  async init(t = {}) {
    return m2("info", "Init"), await ef.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await ef.mount(t, e);
      return ju.setProps(n.props), ju.markRender(), xi.trackMount(), xi.trackRender(n.props), n;
    } catch (n) {
      throw xi.trackError(n), m2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return ju.setProps(t), ju.markRender(), xi.trackRender(t), MR.render(t);
  },
  async unmount() {
    xi.trackUnmount();
    const t = await ef.unmount();
    return ju.reset(), t;
  },
  async destroy() {
    const t = await ef.destroy();
    return ju.reset(), xi.reset(), t;
  },
  healthCheck() {
    const t = Yt.info(), e = xi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: oh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: CC, version: oh, lifecycle: Yt.info(), metrics: xi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconBarChart = { getVersion: () => oh, info: () => pk.info(), healthCheck: () => pk.healthCheck() });
const WZ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BarChartIcon: pk,
  MODULE_ID: CC,
  VERSION: oh,
  default: pk
}, Symbol.toStringTag, { value: "Module" })), MC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "box" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, JZ = (t = {}) => {
  const e = [], n = {};
  return Object.entries(MC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Fe = "idle", R_ = null, f2 = 0;
const Ft = { getPhase() {
  return Fe;
}, isReady() {
  return Fe === "ready" || Fe === "mounted";
}, isMounted() {
  return Fe === "mounted";
}, setInitializing() {
  Fe = "initializing";
}, setReady() {
  Fe = "ready";
}, setMounted(t) {
  Fe = "mounted", R_ = t, f2++;
}, setUnmounting() {
  Fe = "unmounting";
}, setDestroyed() {
  Fe = "destroyed", R_ = null;
}, reset() {
  Fe = "idle", R_ = null;
}, getContainer() {
  return R_;
}, info() {
  return { phase: Fe, isMounted: this.isMounted(), mountCount: f2 };
} };
({ ...Ft });
const cl = "footer-icon-box-events", RR = "1.5.0-P18EC", RC = "footer:box", OE = h({ moduleId: cl });
function QZ() {
  OE.init();
}
function gk(t) {
  return OE.get(t);
}
const Hd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function h2(t) {
  t === void 0 && (t = {}), Hd.uiActions++;
  const e = gk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: RC, source: cl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Box" }, t) });
}
const er = { _clickHandler: null, _element: null, init() {
  QZ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Hd.clicks++, e && e(), h2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Hd.clicks++, h2({ clicked: !0, props: t });
}, emitMounted(t) {
  Hd.mounts++;
  const e = gk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: RC, moduleId: cl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Hd.unmounts++;
  const t = gk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: RC, moduleId: cl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function wR() {
  return Object.assign({}, Hd);
}
function XZ() {
  const t = OE.snapshot();
  return { moduleId: cl, version: RR, metrics: wR(), portsInitialized: t._initialized };
}
function tK() {
  const t = OE.snapshot(), e = gk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: RR, moduleId: cl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: wR() };
}
Object.assign({}, er, { getMetrics: wR, info: XZ, healthCheck: tK, MODULE_ID: cl, VERSION: RR });
const nf = {
  async init() {
    return Ft.isReady() ? { success: !0, alreadyInitialized: !0 } : (Ft.setInitializing(), er.init(), Ft.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = JZ(e), { Template: i } = await Promise.resolve().then(() => eK);
    if (t.innerHTML = i.render(n.props), Ft.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--box");
      o && er.bindClick(o, () => er.emitClicked(n.props));
    }
    return er.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Ft.setUnmounting(), er.cleanup();
    const t = Ft.getContainer();
    return t && (t.innerHTML = ""), er.emitUnmounted(), Ft.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), er.destroy(), Ft.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Ft.info();
  }
};
({ ...nf });
const Kn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Bu = { getState() {
  return { ...Kn };
}, setProps(t) {
  Kn.props = t;
}, getProps() {
  return Kn.props;
}, setVisible(t) {
  Kn.isVisible = !!t;
}, setHovered(t) {
  Kn.isHovered = !!t;
}, markRender() {
  Kn.lastRender = Date.now();
}, reset() {
  Kn.props = null, Kn.isVisible = !0, Kn.isHovered = !1, Kn.lastRender = null;
} }, PR = {
  render(t = {}) {
    const e = MC.SIZES[t.size] || MC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "box", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--box", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="box"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>`;
  },
  getSvgPath() {
    return "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z";
  }
};
({ ...PR });
const eK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: PR
}, Symbol.toStringTag, { value: "Module" })), dp = "footer.icon.box.tracker", DE = "2.2.0-P18EC", ec = h({ moduleId: dp });
function nK(t) {
  return ec.inject(t);
}
function iK() {
  return ec.snapshot();
}
const os = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Gi = { trackRender(t) {
  os.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  os.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  os.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  os.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  os.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = ec.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: dp }, e));
}, getMetrics() {
  return Object.assign({}, os);
}, reset() {
  for (const t in os) os[t] = 0;
} };
function PH() {
  return Gi.getMetrics();
}
function oK(t) {
  return ec.init(), t && t.ports && ec.inject(t.ports), { ok: !0, version: DE };
}
function sK() {
  return { status: ec.isInitialized() ? "HEALTHY" : "DEGRADED", version: DE, moduleId: dp, portsInitialized: ec.isInitialized(), metrics: PH() };
}
function rK() {
  return { moduleId: dp, version: DE, metrics: PH(), portsInitialized: ec.isInitialized() };
}
Object.assign({}, Gi, { init: oK, info: rK, healthCheck: sK, MODULE_ID: dp, VERSION: DE, injectPorts: nK, getPorts: iK });
const TH = "footer-icon-box-logger", cK = g({ moduleId: TH });
function aK(t) {
  return cK.get(t);
}
function w_(t, e) {
  const n = aK("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: TH });
}
const ca = { info(...t) {
  w_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  w_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  w_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  w_("debug", Array.prototype.slice.call(t));
} };
ca.info, ca.warn, ca.error, ca.debug;
const wC = "footer-icon-box", sh = "1.0.1-ENTERPRISE";
function p2(t, ...e) {
  ca && typeof ca[t] == "function" && ca[t]("[BOX]", ...e);
}
const _k = {
  getVersion() {
    return sh;
  },
  getModuleId() {
    return wC;
  },
  async init(t = {}) {
    return p2("info", "Init"), await nf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await nf.mount(t, e);
      return Bu.setProps(n.props), Bu.markRender(), Gi.trackMount(), Gi.trackRender(n.props), n;
    } catch (n) {
      throw Gi.trackError(n), p2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Bu.setProps(t), Bu.markRender(), Gi.trackRender(t), PR.render(t);
  },
  async unmount() {
    Gi.trackUnmount();
    const t = await nf.unmount();
    return Bu.reset(), t;
  },
  async destroy() {
    const t = await nf.destroy();
    return Bu.reset(), Gi.reset(), t;
  },
  healthCheck() {
    const t = Ft.info(), e = Gi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: sh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: wC, version: sh, lifecycle: Ft.info(), metrics: Gi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconBox = { getVersion: () => sh, info: () => _k.info(), healthCheck: () => _k.healthCheck() });
const lK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BoxIcon: _k,
  MODULE_ID: wC,
  VERSION: sh,
  default: _k
}, Symbol.toStringTag, { value: "Module" })), PC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "briefcase" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, uK = (t = {}) => {
  const e = [], n = {};
  return Object.entries(PC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let qe = "idle", P_ = null, g2 = 0;
const qt = { getPhase() {
  return qe;
}, isReady() {
  return qe === "ready" || qe === "mounted";
}, isMounted() {
  return qe === "mounted";
}, setInitializing() {
  qe = "initializing";
}, setReady() {
  qe = "ready";
}, setMounted(t) {
  qe = "mounted", P_ = t, g2++;
}, setUnmounting() {
  qe = "unmounting";
}, setDestroyed() {
  qe = "destroyed", P_ = null;
}, reset() {
  qe = "idle", P_ = null;
}, getContainer() {
  return P_;
}, info() {
  return { phase: qe, isMounted: this.isMounted(), mountCount: g2 };
} };
({ ...qt });
const al = "footer-icon-briefcase-events", TR = "1.5.0-P18EC", TC = "footer:briefcase", CE = h({ moduleId: al });
function dK() {
  CE.init();
}
function vk(t) {
  return CE.get(t);
}
const jd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function _2(t) {
  t === void 0 && (t = {}), jd.uiActions++;
  const e = vk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: TC, source: al, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Briefcase" }, t) });
}
const nr = { _clickHandler: null, _element: null, init() {
  dK();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    jd.clicks++, e && e(), _2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  jd.clicks++, _2({ clicked: !0, props: t });
}, emitMounted(t) {
  jd.mounts++;
  const e = vk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: TC, moduleId: al, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  jd.unmounts++;
  const t = vk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: TC, moduleId: al, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function NR() {
  return Object.assign({}, jd);
}
function mK() {
  const t = CE.snapshot();
  return { moduleId: al, version: TR, metrics: NR(), portsInitialized: t._initialized };
}
function fK() {
  const t = CE.snapshot(), e = vk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: TR, moduleId: al, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: NR() };
}
Object.assign({}, nr, { getMetrics: NR, info: mK, healthCheck: fK, MODULE_ID: al, VERSION: TR });
const of = {
  async init() {
    return qt.isReady() ? { success: !0, alreadyInitialized: !0 } : (qt.setInitializing(), nr.init(), qt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = uK(e), { Template: i } = await Promise.resolve().then(() => hK);
    if (t.innerHTML = i.render(n.props), qt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--briefcase");
      o && nr.bindClick(o, () => nr.emitClicked(n.props));
    }
    return nr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    qt.setUnmounting(), nr.cleanup();
    const t = qt.getContainer();
    return t && (t.innerHTML = ""), nr.emitUnmounted(), qt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), nr.destroy(), qt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return qt.info();
  }
};
({ ...of });
const Wn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Vu = { getState() {
  return { ...Wn };
}, setProps(t) {
  Wn.props = t;
}, getProps() {
  return Wn.props;
}, setVisible(t) {
  Wn.isVisible = !!t;
}, setHovered(t) {
  Wn.isHovered = !!t;
}, markRender() {
  Wn.lastRender = Date.now();
}, reset() {
  Wn.props = null, Wn.isVisible = !0, Wn.isHovered = !1, Wn.lastRender = null;
} }, SR = {
  render(t = {}) {
    const e = PC.SIZES[t.size] || PC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "briefcase", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--briefcase", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="briefcase"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>`;
  },
  getSvgPath() {
    return 'rect x="2" y="7" width="20" height="14" rx="2" ry="2"';
  }
};
({ ...SR });
const hK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: SR
}, Symbol.toStringTag, { value: "Module" })), mp = "footer.icon.briefcase.tracker", ME = "2.2.0-P18EC", nc = h({ moduleId: mp });
function pK(t) {
  return nc.inject(t);
}
function gK() {
  return nc.snapshot();
}
const ss = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Yi = { trackRender(t) {
  ss.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ss.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ss.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ss.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ss.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = nc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: mp }, e));
}, getMetrics() {
  return Object.assign({}, ss);
}, reset() {
  for (const t in ss) ss[t] = 0;
} };
function NH() {
  return Yi.getMetrics();
}
function _K(t) {
  return nc.init(), t && t.ports && nc.inject(t.ports), { ok: !0, version: ME };
}
function vK() {
  return { status: nc.isInitialized() ? "HEALTHY" : "DEGRADED", version: ME, moduleId: mp, portsInitialized: nc.isInitialized(), metrics: NH() };
}
function $K() {
  return { moduleId: mp, version: ME, metrics: NH(), portsInitialized: nc.isInitialized() };
}
Object.assign({}, Yi, { init: _K, info: $K, healthCheck: vK, MODULE_ID: mp, VERSION: ME, injectPorts: pK, getPorts: gK });
const SH = "footer-icon-briefcase-logger", yK = g({ moduleId: SH });
function kK(t) {
  return yK.get(t);
}
function T_(t, e) {
  const n = kK("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: SH });
}
const aa = { info(...t) {
  T_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  T_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  T_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  T_("debug", Array.prototype.slice.call(t));
} };
aa.info, aa.warn, aa.error, aa.debug;
const NC = "footer-icon-briefcase", rh = "1.0.1-ENTERPRISE";
function v2(t, ...e) {
  aa && typeof aa[t] == "function" && aa[t]("[BRIEFCASE]", ...e);
}
const $k = {
  getVersion() {
    return rh;
  },
  getModuleId() {
    return NC;
  },
  async init(t = {}) {
    return v2("info", "Init"), await of.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await of.mount(t, e);
      return Vu.setProps(n.props), Vu.markRender(), Yi.trackMount(), Yi.trackRender(n.props), n;
    } catch (n) {
      throw Yi.trackError(n), v2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Vu.setProps(t), Vu.markRender(), Yi.trackRender(t), SR.render(t);
  },
  async unmount() {
    Yi.trackUnmount();
    const t = await of.unmount();
    return Vu.reset(), t;
  },
  async destroy() {
    const t = await of.destroy();
    return Vu.reset(), Yi.reset(), t;
  },
  healthCheck() {
    const t = qt.info(), e = Yi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: rh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: NC, version: rh, lifecycle: qt.info(), metrics: Yi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconBriefcase = { getVersion: () => rh, info: () => $k.info(), healthCheck: () => $k.healthCheck() });
const bK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BriefcaseIcon: $k,
  MODULE_ID: NC,
  VERSION: rh,
  default: $k
}, Symbol.toStringTag, { value: "Module" })), SC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "calendar" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, EK = (t = {}) => {
  const e = [], n = {};
  return Object.entries(SC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ze = "idle", N_ = null, $2 = 0;
const Zt = { getPhase() {
  return Ze;
}, isReady() {
  return Ze === "ready" || Ze === "mounted";
}, isMounted() {
  return Ze === "mounted";
}, setInitializing() {
  Ze = "initializing";
}, setReady() {
  Ze = "ready";
}, setMounted(t) {
  Ze = "mounted", N_ = t, $2++;
}, setUnmounting() {
  Ze = "unmounting";
}, setDestroyed() {
  Ze = "destroyed", N_ = null;
}, reset() {
  Ze = "idle", N_ = null;
}, getContainer() {
  return N_;
}, info() {
  return { phase: Ze, isMounted: this.isMounted(), mountCount: $2 };
} };
({ ...Zt });
const ll = "footer-icon-calendar-events", LR = "1.5.0-P18EC", LC = "footer:calendar", RE = h({ moduleId: ll });
function IK() {
  RE.init();
}
function yk(t) {
  return RE.get(t);
}
const Bd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function y2(t) {
  t === void 0 && (t = {}), Bd.uiActions++;
  const e = yk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: LC, source: ll, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Calendar" }, t) });
}
const ir = { _clickHandler: null, _element: null, init() {
  IK();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Bd.clicks++, e && e(), y2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Bd.clicks++, y2({ clicked: !0, props: t });
}, emitMounted(t) {
  Bd.mounts++;
  const e = yk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: LC, moduleId: ll, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Bd.unmounts++;
  const t = yk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: LC, moduleId: ll, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function AR() {
  return Object.assign({}, Bd);
}
function OK() {
  const t = RE.snapshot();
  return { moduleId: ll, version: LR, metrics: AR(), portsInitialized: t._initialized };
}
function DK() {
  const t = RE.snapshot(), e = yk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: LR, moduleId: ll, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: AR() };
}
Object.assign({}, ir, { getMetrics: AR, info: OK, healthCheck: DK, MODULE_ID: ll, VERSION: LR });
const sf = {
  async init() {
    return Zt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Zt.setInitializing(), ir.init(), Zt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = EK(e), { Template: i } = await Promise.resolve().then(() => CK);
    if (t.innerHTML = i.render(n.props), Zt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--calendar");
      o && ir.bindClick(o, () => ir.emitClicked(n.props));
    }
    return ir.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Zt.setUnmounting(), ir.cleanup();
    const t = Zt.getContainer();
    return t && (t.innerHTML = ""), ir.emitUnmounted(), Zt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ir.destroy(), Zt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Zt.info();
  }
};
({ ...sf });
const Jn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, xu = { getState() {
  return { ...Jn };
}, setProps(t) {
  Jn.props = t;
}, getProps() {
  return Jn.props;
}, setVisible(t) {
  Jn.isVisible = !!t;
}, setHovered(t) {
  Jn.isHovered = !!t;
}, markRender() {
  Jn.lastRender = Date.now();
}, reset() {
  Jn.props = null, Jn.isVisible = !0, Jn.isHovered = !1, Jn.lastRender = null;
} }, zR = {
  render(t = {}) {
    const e = SC.SIZES[t.size] || SC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "calendar", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--calendar", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="calendar"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>`;
  },
  getSvgPath() {
    return 'rect x="3" y="4" width="18" height="18" rx="2" ry="2"';
  }
};
({ ...zR });
const CK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: zR
}, Symbol.toStringTag, { value: "Module" })), fp = "footer.icon.calendar.tracker", wE = "2.2.0-P18EC", ic = h({ moduleId: fp });
function MK(t) {
  return ic.inject(t);
}
function RK() {
  return ic.snapshot();
}
const rs = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Fi = { trackRender(t) {
  rs.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  rs.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  rs.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  rs.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  rs.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = ic.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: fp }, e));
}, getMetrics() {
  return Object.assign({}, rs);
}, reset() {
  for (const t in rs) rs[t] = 0;
} };
function LH() {
  return Fi.getMetrics();
}
function wK(t) {
  return ic.init(), t && t.ports && ic.inject(t.ports), { ok: !0, version: wE };
}
function PK() {
  return { status: ic.isInitialized() ? "HEALTHY" : "DEGRADED", version: wE, moduleId: fp, portsInitialized: ic.isInitialized(), metrics: LH() };
}
function TK() {
  return { moduleId: fp, version: wE, metrics: LH(), portsInitialized: ic.isInitialized() };
}
Object.assign({}, Fi, { init: wK, info: TK, healthCheck: PK, MODULE_ID: fp, VERSION: wE, injectPorts: MK, getPorts: RK });
const AH = "footer-icon-calendar-logger", NK = g({ moduleId: AH });
function SK(t) {
  return NK.get(t);
}
function S_(t, e) {
  const n = SK("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: AH });
}
const la = { info(...t) {
  S_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  S_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  S_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  S_("debug", Array.prototype.slice.call(t));
} };
la.info, la.warn, la.error, la.debug;
const AC = "footer-icon-calendar", ch = "1.0.1-ENTERPRISE";
function k2(t, ...e) {
  la && typeof la[t] == "function" && la[t]("[CALENDAR]", ...e);
}
const kk = {
  getVersion() {
    return ch;
  },
  getModuleId() {
    return AC;
  },
  async init(t = {}) {
    return k2("info", "Init"), await sf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await sf.mount(t, e);
      return xu.setProps(n.props), xu.markRender(), Fi.trackMount(), Fi.trackRender(n.props), n;
    } catch (n) {
      throw Fi.trackError(n), k2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return xu.setProps(t), xu.markRender(), Fi.trackRender(t), zR.render(t);
  },
  async unmount() {
    Fi.trackUnmount();
    const t = await sf.unmount();
    return xu.reset(), t;
  },
  async destroy() {
    const t = await sf.destroy();
    return xu.reset(), Fi.reset(), t;
  },
  healthCheck() {
    const t = Zt.info(), e = Fi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: ch, timestamp: Date.now() };
  },
  info() {
    return { moduleId: AC, version: ch, lifecycle: Zt.info(), metrics: Fi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCalendar = { getVersion: () => ch, info: () => kk.info(), healthCheck: () => kk.healthCheck() });
const LK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CalendarIcon: kk,
  MODULE_ID: AC,
  VERSION: ch,
  default: kk
}, Symbol.toStringTag, { value: "Module" })), zC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "cloud" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, AK = (t = {}) => {
  const e = [], n = {};
  return Object.entries(zC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Ke = "idle", L_ = null, b2 = 0;
const Kt = { getPhase() {
  return Ke;
}, isReady() {
  return Ke === "ready" || Ke === "mounted";
}, isMounted() {
  return Ke === "mounted";
}, setInitializing() {
  Ke = "initializing";
}, setReady() {
  Ke = "ready";
}, setMounted(t) {
  Ke = "mounted", L_ = t, b2++;
}, setUnmounting() {
  Ke = "unmounting";
}, setDestroyed() {
  Ke = "destroyed", L_ = null;
}, reset() {
  Ke = "idle", L_ = null;
}, getContainer() {
  return L_;
}, info() {
  return { phase: Ke, isMounted: this.isMounted(), mountCount: b2 };
} };
({ ...Kt });
const ul = "footer-icon-cloud-events", UR = "1.5.0-P18EC", UC = "footer:cloud", PE = h({ moduleId: ul });
function zK() {
  PE.init();
}
function bk(t) {
  return PE.get(t);
}
const Vd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function E2(t) {
  t === void 0 && (t = {}), Vd.uiActions++;
  const e = bk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: UC, source: ul, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Cloud" }, t) });
}
const or = { _clickHandler: null, _element: null, init() {
  zK();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Vd.clicks++, e && e(), E2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Vd.clicks++, E2({ clicked: !0, props: t });
}, emitMounted(t) {
  Vd.mounts++;
  const e = bk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: UC, moduleId: ul, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Vd.unmounts++;
  const t = bk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: UC, moduleId: ul, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function HR() {
  return Object.assign({}, Vd);
}
function UK() {
  const t = PE.snapshot();
  return { moduleId: ul, version: UR, metrics: HR(), portsInitialized: t._initialized };
}
function HK() {
  const t = PE.snapshot(), e = bk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: UR, moduleId: ul, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: HR() };
}
Object.assign({}, or, { getMetrics: HR, info: UK, healthCheck: HK, MODULE_ID: ul, VERSION: UR });
const rf = {
  async init() {
    return Kt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Kt.setInitializing(), or.init(), Kt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = AK(e), { Template: i } = await Promise.resolve().then(() => jK);
    if (t.innerHTML = i.render(n.props), Kt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--cloud");
      o && or.bindClick(o, () => or.emitClicked(n.props));
    }
    return or.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Kt.setUnmounting(), or.cleanup();
    const t = Kt.getContainer();
    return t && (t.innerHTML = ""), or.emitUnmounted(), Kt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), or.destroy(), Kt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Kt.info();
  }
};
({ ...rf });
const Qn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Gu = { getState() {
  return { ...Qn };
}, setProps(t) {
  Qn.props = t;
}, getProps() {
  return Qn.props;
}, setVisible(t) {
  Qn.isVisible = !!t;
}, setHovered(t) {
  Qn.isHovered = !!t;
}, markRender() {
  Qn.lastRender = Date.now();
}, reset() {
  Qn.props = null, Qn.isVisible = !0, Qn.isHovered = !1, Qn.lastRender = null;
} }, jR = {
  render(t = {}) {
    const e = zC.SIZES[t.size] || zC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "cloud", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--cloud", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="cloud"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></span>`;
  },
  getSvgPath() {
    return "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";
  }
};
({ ...jR });
const jK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: jR
}, Symbol.toStringTag, { value: "Module" })), hp = "footer.icon.cloud.tracker", TE = "2.2.0-P18EC", oc = h({ moduleId: hp });
function BK(t) {
  return oc.inject(t);
}
function VK() {
  return oc.snapshot();
}
const cs = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, qi = { trackRender(t) {
  cs.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  cs.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  cs.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  cs.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  cs.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = oc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: hp }, e));
}, getMetrics() {
  return Object.assign({}, cs);
}, reset() {
  for (const t in cs) cs[t] = 0;
} };
function zH() {
  return qi.getMetrics();
}
function xK(t) {
  return oc.init(), t && t.ports && oc.inject(t.ports), { ok: !0, version: TE };
}
function GK() {
  return { status: oc.isInitialized() ? "HEALTHY" : "DEGRADED", version: TE, moduleId: hp, portsInitialized: oc.isInitialized(), metrics: zH() };
}
function YK() {
  return { moduleId: hp, version: TE, metrics: zH(), portsInitialized: oc.isInitialized() };
}
Object.assign({}, qi, { init: xK, info: YK, healthCheck: GK, MODULE_ID: hp, VERSION: TE, injectPorts: BK, getPorts: VK });
const UH = "footer-icon-cloud-logger", FK = g({ moduleId: UH });
function qK(t) {
  return FK.get(t);
}
function A_(t, e) {
  const n = qK("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: UH });
}
const ua = { info(...t) {
  A_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  A_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  A_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  A_("debug", Array.prototype.slice.call(t));
} };
ua.info, ua.warn, ua.error, ua.debug;
const HC = "footer-icon-cloud", ah = "1.0.1-ENTERPRISE";
function I2(t, ...e) {
  ua && typeof ua[t] == "function" && ua[t]("[CLOUD]", ...e);
}
const Ek = {
  getVersion() {
    return ah;
  },
  getModuleId() {
    return HC;
  },
  async init(t = {}) {
    return I2("info", "Init"), await rf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await rf.mount(t, e);
      return Gu.setProps(n.props), Gu.markRender(), qi.trackMount(), qi.trackRender(n.props), n;
    } catch (n) {
      throw qi.trackError(n), I2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Gu.setProps(t), Gu.markRender(), qi.trackRender(t), jR.render(t);
  },
  async unmount() {
    qi.trackUnmount();
    const t = await rf.unmount();
    return Gu.reset(), t;
  },
  async destroy() {
    const t = await rf.destroy();
    return Gu.reset(), qi.reset(), t;
  },
  healthCheck() {
    const t = Kt.info(), e = qi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: ah, timestamp: Date.now() };
  },
  info() {
    return { moduleId: HC, version: ah, lifecycle: Kt.info(), metrics: qi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCloud = { getVersion: () => ah, info: () => Ek.info(), healthCheck: () => Ek.healthCheck() });
const ZK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CloudIcon: Ek,
  MODULE_ID: HC,
  VERSION: ah,
  default: Ek
}, Symbol.toStringTag, { value: "Module" })), jC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "copy" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, KK = (t = {}) => {
  const e = [], n = {};
  return Object.entries(jC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let We = "idle", z_ = null, O2 = 0;
const Wt = { getPhase() {
  return We;
}, isReady() {
  return We === "ready" || We === "mounted";
}, isMounted() {
  return We === "mounted";
}, setInitializing() {
  We = "initializing";
}, setReady() {
  We = "ready";
}, setMounted(t) {
  We = "mounted", z_ = t, O2++;
}, setUnmounting() {
  We = "unmounting";
}, setDestroyed() {
  We = "destroyed", z_ = null;
}, reset() {
  We = "idle", z_ = null;
}, getContainer() {
  return z_;
}, info() {
  return { phase: We, isMounted: this.isMounted(), mountCount: O2 };
} };
({ ...Wt });
const dl = "footer-icon-copy-events", BR = "1.5.0-P18EC", BC = "footer:copy", NE = h({ moduleId: dl });
function WK() {
  NE.init();
}
function Ik(t) {
  return NE.get(t);
}
const xd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function D2(t) {
  t === void 0 && (t = {}), xd.uiActions++;
  const e = Ik("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: BC, source: dl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Copy" }, t) });
}
const sr = { _clickHandler: null, _element: null, init() {
  WK();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    xd.clicks++, e && e(), D2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  xd.clicks++, D2({ clicked: !0, props: t });
}, emitMounted(t) {
  xd.mounts++;
  const e = Ik("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: BC, moduleId: dl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  xd.unmounts++;
  const t = Ik("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: BC, moduleId: dl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function VR() {
  return Object.assign({}, xd);
}
function JK() {
  const t = NE.snapshot();
  return { moduleId: dl, version: BR, metrics: VR(), portsInitialized: t._initialized };
}
function QK() {
  const t = NE.snapshot(), e = Ik("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: BR, moduleId: dl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: VR() };
}
Object.assign({}, sr, { getMetrics: VR, info: JK, healthCheck: QK, MODULE_ID: dl, VERSION: BR });
const cf = {
  async init() {
    return Wt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Wt.setInitializing(), sr.init(), Wt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = KK(e), { Template: i } = await Promise.resolve().then(() => XK);
    if (t.innerHTML = i.render(n.props), Wt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--copy");
      o && sr.bindClick(o, () => sr.emitClicked(n.props));
    }
    return sr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Wt.setUnmounting(), sr.cleanup();
    const t = Wt.getContainer();
    return t && (t.innerHTML = ""), sr.emitUnmounted(), Wt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), sr.destroy(), Wt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Wt.info();
  }
};
({ ...cf });
const Xn = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Yu = { getState() {
  return { ...Xn };
}, setProps(t) {
  Xn.props = t;
}, getProps() {
  return Xn.props;
}, setVisible(t) {
  Xn.isVisible = !!t;
}, setHovered(t) {
  Xn.isHovered = !!t;
}, markRender() {
  Xn.lastRender = Date.now();
}, reset() {
  Xn.props = null, Xn.isVisible = !0, Xn.isHovered = !1, Xn.lastRender = null;
} }, xR = {
  render(t = {}) {
    const e = jC.SIZES[t.size] || jC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "copy", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--copy", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="copy"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>`;
  },
  getSvgPath() {
    return 'rect x="9" y="9" width="13" height="13" rx="2" ry="2"';
  }
};
({ ...xR });
const XK = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: xR
}, Symbol.toStringTag, { value: "Module" })), pp = "footer.icon.copy.tracker", SE = "2.2.0-P18EC", sc = h({ moduleId: pp });
function tW(t) {
  return sc.inject(t);
}
function eW() {
  return sc.snapshot();
}
const as = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Zi = { trackRender(t) {
  as.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  as.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  as.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  as.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  as.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = sc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: pp }, e));
}, getMetrics() {
  return Object.assign({}, as);
}, reset() {
  for (const t in as) as[t] = 0;
} };
function HH() {
  return Zi.getMetrics();
}
function nW(t) {
  return sc.init(), t && t.ports && sc.inject(t.ports), { ok: !0, version: SE };
}
function iW() {
  return { status: sc.isInitialized() ? "HEALTHY" : "DEGRADED", version: SE, moduleId: pp, portsInitialized: sc.isInitialized(), metrics: HH() };
}
function oW() {
  return { moduleId: pp, version: SE, metrics: HH(), portsInitialized: sc.isInitialized() };
}
Object.assign({}, Zi, { init: nW, info: oW, healthCheck: iW, MODULE_ID: pp, VERSION: SE, injectPorts: tW, getPorts: eW });
const jH = "footer-icon-copy-logger", sW = g({ moduleId: jH });
function rW(t) {
  return sW.get(t);
}
function U_(t, e) {
  const n = rW("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: jH });
}
const da = { info(...t) {
  U_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  U_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  U_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  U_("debug", Array.prototype.slice.call(t));
} };
da.info, da.warn, da.error, da.debug;
const VC = "footer-icon-copy", lh = "1.0.1-ENTERPRISE";
function C2(t, ...e) {
  da && typeof da[t] == "function" && da[t]("[COPY]", ...e);
}
const Ok = {
  getVersion() {
    return lh;
  },
  getModuleId() {
    return VC;
  },
  async init(t = {}) {
    return C2("info", "Init"), await cf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await cf.mount(t, e);
      return Yu.setProps(n.props), Yu.markRender(), Zi.trackMount(), Zi.trackRender(n.props), n;
    } catch (n) {
      throw Zi.trackError(n), C2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Yu.setProps(t), Yu.markRender(), Zi.trackRender(t), xR.render(t);
  },
  async unmount() {
    Zi.trackUnmount();
    const t = await cf.unmount();
    return Yu.reset(), t;
  },
  async destroy() {
    const t = await cf.destroy();
    return Yu.reset(), Zi.reset(), t;
  },
  healthCheck() {
    const t = Wt.info(), e = Zi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: lh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: VC, version: lh, lifecycle: Wt.info(), metrics: Zi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCopy = { getVersion: () => lh, info: () => Ok.info(), healthCheck: () => Ok.healthCheck() });
const cW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CopyIcon: Ok,
  MODULE_ID: VC,
  VERSION: lh,
  default: Ok
}, Symbol.toStringTag, { value: "Module" })), xC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "credit card" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, aW = (t = {}) => {
  const e = [], n = {};
  return Object.entries(xC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Je = "idle", H_ = null, M2 = 0;
const Jt = { getPhase() {
  return Je;
}, isReady() {
  return Je === "ready" || Je === "mounted";
}, isMounted() {
  return Je === "mounted";
}, setInitializing() {
  Je = "initializing";
}, setReady() {
  Je = "ready";
}, setMounted(t) {
  Je = "mounted", H_ = t, M2++;
}, setUnmounting() {
  Je = "unmounting";
}, setDestroyed() {
  Je = "destroyed", H_ = null;
}, reset() {
  Je = "idle", H_ = null;
}, getContainer() {
  return H_;
}, info() {
  return { phase: Je, isMounted: this.isMounted(), mountCount: M2 };
} };
({ ...Jt });
const ml = "footer-icon-credit-card-events", GR = "1.5.0-P18EC", GC = "footer:credit-card", LE = h({ moduleId: ml });
function lW() {
  LE.init();
}
function Dk(t) {
  return LE.get(t);
}
const Gd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function R2(t) {
  t === void 0 && (t = {}), Gd.uiActions++;
  const e = Dk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: GC, source: ml, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Credit Card" }, t) });
}
const rr = { _clickHandler: null, _element: null, init() {
  lW();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Gd.clicks++, e && e(), R2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Gd.clicks++, R2({ clicked: !0, props: t });
}, emitMounted(t) {
  Gd.mounts++;
  const e = Dk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: GC, moduleId: ml, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Gd.unmounts++;
  const t = Dk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: GC, moduleId: ml, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function YR() {
  return Object.assign({}, Gd);
}
function uW() {
  const t = LE.snapshot();
  return { moduleId: ml, version: GR, metrics: YR(), portsInitialized: t._initialized };
}
function dW() {
  const t = LE.snapshot(), e = Dk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: GR, moduleId: ml, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: YR() };
}
Object.assign({}, rr, { getMetrics: YR, info: uW, healthCheck: dW, MODULE_ID: ml, VERSION: GR });
const af = {
  async init() {
    return Jt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Jt.setInitializing(), rr.init(), Jt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = aW(e), { Template: i } = await Promise.resolve().then(() => mW);
    if (t.innerHTML = i.render(n.props), Jt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--credit-card");
      o && rr.bindClick(o, () => rr.emitClicked(n.props));
    }
    return rr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Jt.setUnmounting(), rr.cleanup();
    const t = Jt.getContainer();
    return t && (t.innerHTML = ""), rr.emitUnmounted(), Jt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), rr.destroy(), Jt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Jt.info();
  }
};
({ ...af });
const ti = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Fu = { getState() {
  return { ...ti };
}, setProps(t) {
  ti.props = t;
}, getProps() {
  return ti.props;
}, setVisible(t) {
  ti.isVisible = !!t;
}, setHovered(t) {
  ti.isHovered = !!t;
}, markRender() {
  ti.lastRender = Date.now();
}, reset() {
  ti.props = null, ti.isVisible = !0, ti.isHovered = !1, ti.lastRender = null;
} }, FR = {
  render(t = {}) {
    const e = xC.SIZES[t.size] || xC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "credit card", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--credit-card", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="credit-card"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>`;
  },
  getSvgPath() {
    return 'rect x="1" y="4" width="22" height="16" rx="2" ry="2"';
  }
};
({ ...FR });
const mW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: FR
}, Symbol.toStringTag, { value: "Module" })), gp = "footer.icon.credit-card.tracker", AE = "2.2.0-P18EC", rc = h({ moduleId: gp });
function fW(t) {
  return rc.inject(t);
}
function hW() {
  return rc.snapshot();
}
const ls = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ki = { trackRender(t) {
  ls.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ls.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ls.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ls.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ls.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = rc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: gp }, e));
}, getMetrics() {
  return Object.assign({}, ls);
}, reset() {
  for (const t in ls) ls[t] = 0;
} };
function BH() {
  return Ki.getMetrics();
}
function pW(t) {
  return rc.init(), t && t.ports && rc.inject(t.ports), { ok: !0, version: AE };
}
function gW() {
  return { status: rc.isInitialized() ? "HEALTHY" : "DEGRADED", version: AE, moduleId: gp, portsInitialized: rc.isInitialized(), metrics: BH() };
}
function _W() {
  return { moduleId: gp, version: AE, metrics: BH(), portsInitialized: rc.isInitialized() };
}
Object.assign({}, Ki, { init: pW, info: _W, healthCheck: gW, MODULE_ID: gp, VERSION: AE, injectPorts: fW, getPorts: hW });
const VH = "footer-icon-credit-card-logger", vW = g({ moduleId: VH });
function $W(t) {
  return vW.get(t);
}
function j_(t, e) {
  const n = $W("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: VH });
}
const ma = { info(...t) {
  j_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  j_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  j_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  j_("debug", Array.prototype.slice.call(t));
} };
ma.info, ma.warn, ma.error, ma.debug;
const YC = "footer-icon-credit-card", uh = "1.0.1-ENTERPRISE";
function w2(t, ...e) {
  ma && typeof ma[t] == "function" && ma[t]("[CREDIT-CARD]", ...e);
}
const Ck = {
  getVersion() {
    return uh;
  },
  getModuleId() {
    return YC;
  },
  async init(t = {}) {
    return w2("info", "Init"), await af.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await af.mount(t, e);
      return Fu.setProps(n.props), Fu.markRender(), Ki.trackMount(), Ki.trackRender(n.props), n;
    } catch (n) {
      throw Ki.trackError(n), w2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Fu.setProps(t), Fu.markRender(), Ki.trackRender(t), FR.render(t);
  },
  async unmount() {
    Ki.trackUnmount();
    const t = await af.unmount();
    return Fu.reset(), t;
  },
  async destroy() {
    const t = await af.destroy();
    return Fu.reset(), Ki.reset(), t;
  },
  healthCheck() {
    const t = Jt.info(), e = Ki.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: uh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: YC, version: uh, lifecycle: Jt.info(), metrics: Ki.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconCreditCard = { getVersion: () => uh, info: () => Ck.info(), healthCheck: () => Ck.healthCheck() });
const yW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CreditCardIcon: Ck,
  MODULE_ID: YC,
  VERSION: uh,
  default: Ck
}, Symbol.toStringTag, { value: "Module" })), FC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "dollar sign" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, kW = (t = {}) => {
  const e = [], n = {};
  return Object.entries(FC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Qe = "idle", B_ = null, P2 = 0;
const Qt = { getPhase() {
  return Qe;
}, isReady() {
  return Qe === "ready" || Qe === "mounted";
}, isMounted() {
  return Qe === "mounted";
}, setInitializing() {
  Qe = "initializing";
}, setReady() {
  Qe = "ready";
}, setMounted(t) {
  Qe = "mounted", B_ = t, P2++;
}, setUnmounting() {
  Qe = "unmounting";
}, setDestroyed() {
  Qe = "destroyed", B_ = null;
}, reset() {
  Qe = "idle", B_ = null;
}, getContainer() {
  return B_;
}, info() {
  return { phase: Qe, isMounted: this.isMounted(), mountCount: P2 };
} };
({ ...Qt });
const fl = "footer-icon-dollar-sign-events", qR = "1.5.0-P18EC", qC = "footer:dollar-sign", zE = h({ moduleId: fl });
function bW() {
  zE.init();
}
function Mk(t) {
  return zE.get(t);
}
const Yd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function T2(t) {
  t === void 0 && (t = {}), Yd.uiActions++;
  const e = Mk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: qC, source: fl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Dollar Sign" }, t) });
}
const cr = { _clickHandler: null, _element: null, init() {
  bW();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Yd.clicks++, e && e(), T2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Yd.clicks++, T2({ clicked: !0, props: t });
}, emitMounted(t) {
  Yd.mounts++;
  const e = Mk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: qC, moduleId: fl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Yd.unmounts++;
  const t = Mk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: qC, moduleId: fl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function ZR() {
  return Object.assign({}, Yd);
}
function EW() {
  const t = zE.snapshot();
  return { moduleId: fl, version: qR, metrics: ZR(), portsInitialized: t._initialized };
}
function IW() {
  const t = zE.snapshot(), e = Mk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: qR, moduleId: fl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: ZR() };
}
Object.assign({}, cr, { getMetrics: ZR, info: EW, healthCheck: IW, MODULE_ID: fl, VERSION: qR });
const lf = {
  async init() {
    return Qt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Qt.setInitializing(), cr.init(), Qt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = kW(e), { Template: i } = await Promise.resolve().then(() => OW);
    if (t.innerHTML = i.render(n.props), Qt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--dollar-sign");
      o && cr.bindClick(o, () => cr.emitClicked(n.props));
    }
    return cr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Qt.setUnmounting(), cr.cleanup();
    const t = Qt.getContainer();
    return t && (t.innerHTML = ""), cr.emitUnmounted(), Qt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), cr.destroy(), Qt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Qt.info();
  }
};
({ ...lf });
const ei = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, qu = { getState() {
  return { ...ei };
}, setProps(t) {
  ei.props = t;
}, getProps() {
  return ei.props;
}, setVisible(t) {
  ei.isVisible = !!t;
}, setHovered(t) {
  ei.isHovered = !!t;
}, markRender() {
  ei.lastRender = Date.now();
}, reset() {
  ei.props = null, ei.isVisible = !0, ei.isHovered = !1, ei.lastRender = null;
} }, KR = {
  render(t = {}) {
    const e = FC.SIZES[t.size] || FC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "dollar sign", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--dollar-sign", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="dollar-sign"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>`;
  },
  getSvgPath() {
    return 'line x1="12" y1="1" x2="12" y2="23"';
  }
};
({ ...KR });
const OW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: KR
}, Symbol.toStringTag, { value: "Module" })), _p = "footer.icon.dollar-sign.tracker", UE = "2.2.0-P18EC", cc = h({ moduleId: _p });
function DW(t) {
  return cc.inject(t);
}
function CW() {
  return cc.snapshot();
}
const us = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Wi = { trackRender(t) {
  us.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  us.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  us.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  us.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  us.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = cc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: _p }, e));
}, getMetrics() {
  return Object.assign({}, us);
}, reset() {
  for (const t in us) us[t] = 0;
} };
function xH() {
  return Wi.getMetrics();
}
function MW(t) {
  return cc.init(), t && t.ports && cc.inject(t.ports), { ok: !0, version: UE };
}
function RW() {
  return { status: cc.isInitialized() ? "HEALTHY" : "DEGRADED", version: UE, moduleId: _p, portsInitialized: cc.isInitialized(), metrics: xH() };
}
function wW() {
  return { moduleId: _p, version: UE, metrics: xH(), portsInitialized: cc.isInitialized() };
}
Object.assign({}, Wi, { init: MW, info: wW, healthCheck: RW, MODULE_ID: _p, VERSION: UE, injectPorts: DW, getPorts: CW });
const GH = "footer-icon-dollar-sign-logger", PW = g({ moduleId: GH });
function TW(t) {
  return PW.get(t);
}
function V_(t, e) {
  const n = TW("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: GH });
}
const fa = { info(...t) {
  V_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  V_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  V_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  V_("debug", Array.prototype.slice.call(t));
} };
fa.info, fa.warn, fa.error, fa.debug;
const ZC = "footer-icon-dollar-sign", dh = "1.0.1-ENTERPRISE";
function N2(t, ...e) {
  fa && typeof fa[t] == "function" && fa[t]("[DOLLAR-SIGN]", ...e);
}
const Rk = {
  getVersion() {
    return dh;
  },
  getModuleId() {
    return ZC;
  },
  async init(t = {}) {
    return N2("info", "Init"), await lf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await lf.mount(t, e);
      return qu.setProps(n.props), qu.markRender(), Wi.trackMount(), Wi.trackRender(n.props), n;
    } catch (n) {
      throw Wi.trackError(n), N2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return qu.setProps(t), qu.markRender(), Wi.trackRender(t), KR.render(t);
  },
  async unmount() {
    Wi.trackUnmount();
    const t = await lf.unmount();
    return qu.reset(), t;
  },
  async destroy() {
    const t = await lf.destroy();
    return qu.reset(), Wi.reset(), t;
  },
  healthCheck() {
    const t = Qt.info(), e = Wi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: dh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: ZC, version: dh, lifecycle: Qt.info(), metrics: Wi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconDollarSign = { getVersion: () => dh, info: () => Rk.info(), healthCheck: () => Rk.healthCheck() });
const NW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DollarSignIcon: Rk,
  MODULE_ID: ZC,
  VERSION: dh,
  default: Rk
}, Symbol.toStringTag, { value: "Module" })), KC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "eye" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, SW = (t = {}) => {
  const e = [], n = {};
  return Object.entries(KC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let Xe = "idle", x_ = null, S2 = 0;
const Xt = { getPhase() {
  return Xe;
}, isReady() {
  return Xe === "ready" || Xe === "mounted";
}, isMounted() {
  return Xe === "mounted";
}, setInitializing() {
  Xe = "initializing";
}, setReady() {
  Xe = "ready";
}, setMounted(t) {
  Xe = "mounted", x_ = t, S2++;
}, setUnmounting() {
  Xe = "unmounting";
}, setDestroyed() {
  Xe = "destroyed", x_ = null;
}, reset() {
  Xe = "idle", x_ = null;
}, getContainer() {
  return x_;
}, info() {
  return { phase: Xe, isMounted: this.isMounted(), mountCount: S2 };
} };
({ ...Xt });
const hl = "footer-icon-eye-events", WR = "1.5.0-P18EC", WC = "footer:eye", HE = h({ moduleId: hl });
function LW() {
  HE.init();
}
function wk(t) {
  return HE.get(t);
}
const Fd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function L2(t) {
  t === void 0 && (t = {}), Fd.uiActions++;
  const e = wk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: WC, source: hl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Eye" }, t) });
}
const ar = { _clickHandler: null, _element: null, init() {
  LW();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Fd.clicks++, e && e(), L2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Fd.clicks++, L2({ clicked: !0, props: t });
}, emitMounted(t) {
  Fd.mounts++;
  const e = wk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: WC, moduleId: hl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Fd.unmounts++;
  const t = wk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: WC, moduleId: hl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function JR() {
  return Object.assign({}, Fd);
}
function AW() {
  const t = HE.snapshot();
  return { moduleId: hl, version: WR, metrics: JR(), portsInitialized: t._initialized };
}
function zW() {
  const t = HE.snapshot(), e = wk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: WR, moduleId: hl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: JR() };
}
Object.assign({}, ar, { getMetrics: JR, info: AW, healthCheck: zW, MODULE_ID: hl, VERSION: WR });
const uf = {
  async init() {
    return Xt.isReady() ? { success: !0, alreadyInitialized: !0 } : (Xt.setInitializing(), ar.init(), Xt.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = SW(e), { Template: i } = await Promise.resolve().then(() => UW);
    if (t.innerHTML = i.render(n.props), Xt.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--eye");
      o && ar.bindClick(o, () => ar.emitClicked(n.props));
    }
    return ar.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    Xt.setUnmounting(), ar.cleanup();
    const t = Xt.getContainer();
    return t && (t.innerHTML = ""), ar.emitUnmounted(), Xt.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ar.destroy(), Xt.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return Xt.info();
  }
};
({ ...uf });
const ni = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Zu = { getState() {
  return { ...ni };
}, setProps(t) {
  ni.props = t;
}, getProps() {
  return ni.props;
}, setVisible(t) {
  ni.isVisible = !!t;
}, setHovered(t) {
  ni.isHovered = !!t;
}, markRender() {
  ni.lastRender = Date.now();
}, reset() {
  ni.props = null, ni.isVisible = !0, ni.isHovered = !1, ni.lastRender = null;
} }, QR = {
  render(t = {}) {
    const e = KC.SIZES[t.size] || KC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "eye", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--eye", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="eye"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>`;
  },
  getSvgPath() {
    return "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z";
  }
};
({ ...QR });
const UW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: QR
}, Symbol.toStringTag, { value: "Module" })), vp = "footer.icon.eye.tracker", jE = "2.2.0-P18EC", ac = h({ moduleId: vp });
function HW(t) {
  return ac.inject(t);
}
function jW() {
  return ac.snapshot();
}
const ds = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Ji = { trackRender(t) {
  ds.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ds.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ds.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ds.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ds.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = ac.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: vp }, e));
}, getMetrics() {
  return Object.assign({}, ds);
}, reset() {
  for (const t in ds) ds[t] = 0;
} };
function YH() {
  return Ji.getMetrics();
}
function BW(t) {
  return ac.init(), t && t.ports && ac.inject(t.ports), { ok: !0, version: jE };
}
function VW() {
  return { status: ac.isInitialized() ? "HEALTHY" : "DEGRADED", version: jE, moduleId: vp, portsInitialized: ac.isInitialized(), metrics: YH() };
}
function xW() {
  return { moduleId: vp, version: jE, metrics: YH(), portsInitialized: ac.isInitialized() };
}
Object.assign({}, Ji, { init: BW, info: xW, healthCheck: VW, MODULE_ID: vp, VERSION: jE, injectPorts: HW, getPorts: jW });
const FH = "footer-icon-eye-logger", GW = g({ moduleId: FH });
function YW(t) {
  return GW.get(t);
}
function G_(t, e) {
  const n = YW("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: FH });
}
const ha = { info(...t) {
  G_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  G_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  G_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  G_("debug", Array.prototype.slice.call(t));
} };
ha.info, ha.warn, ha.error, ha.debug;
const JC = "footer-icon-eye", mh = "1.0.1-ENTERPRISE";
function A2(t, ...e) {
  ha && typeof ha[t] == "function" && ha[t]("[EYE]", ...e);
}
const Pk = {
  getVersion() {
    return mh;
  },
  getModuleId() {
    return JC;
  },
  async init(t = {}) {
    return A2("info", "Init"), await uf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await uf.mount(t, e);
      return Zu.setProps(n.props), Zu.markRender(), Ji.trackMount(), Ji.trackRender(n.props), n;
    } catch (n) {
      throw Ji.trackError(n), A2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Zu.setProps(t), Zu.markRender(), Ji.trackRender(t), QR.render(t);
  },
  async unmount() {
    Ji.trackUnmount();
    const t = await uf.unmount();
    return Zu.reset(), t;
  },
  async destroy() {
    const t = await uf.destroy();
    return Zu.reset(), Ji.reset(), t;
  },
  healthCheck() {
    const t = Xt.info(), e = Ji.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: mh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: JC, version: mh, lifecycle: Xt.info(), metrics: Ji.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconEye = { getVersion: () => mh, info: () => Pk.info(), healthCheck: () => Pk.healthCheck() });
const FW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EyeIcon: Pk,
  MODULE_ID: JC,
  VERSION: mh,
  default: Pk
}, Symbol.toStringTag, { value: "Module" })), QC = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "file text" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, qW = (t = {}) => {
  const e = [], n = {};
  return Object.entries(QC.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let tn = "idle", Y_ = null, z2 = 0;
const te = { getPhase() {
  return tn;
}, isReady() {
  return tn === "ready" || tn === "mounted";
}, isMounted() {
  return tn === "mounted";
}, setInitializing() {
  tn = "initializing";
}, setReady() {
  tn = "ready";
}, setMounted(t) {
  tn = "mounted", Y_ = t, z2++;
}, setUnmounting() {
  tn = "unmounting";
}, setDestroyed() {
  tn = "destroyed", Y_ = null;
}, reset() {
  tn = "idle", Y_ = null;
}, getContainer() {
  return Y_;
}, info() {
  return { phase: tn, isMounted: this.isMounted(), mountCount: z2 };
} };
({ ...te });
const pl = "footer-icon-file-text-events", XR = "1.5.0-P18EC", XC = "footer:file-text", BE = h({ moduleId: pl });
function ZW() {
  BE.init();
}
function Tk(t) {
  return BE.get(t);
}
const qd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function U2(t) {
  t === void 0 && (t = {}), qd.uiActions++;
  const e = Tk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: XC, source: pl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "File Text" }, t) });
}
const lr = { _clickHandler: null, _element: null, init() {
  ZW();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    qd.clicks++, e && e(), U2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  qd.clicks++, U2({ clicked: !0, props: t });
}, emitMounted(t) {
  qd.mounts++;
  const e = Tk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: XC, moduleId: pl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  qd.unmounts++;
  const t = Tk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: XC, moduleId: pl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function tw() {
  return Object.assign({}, qd);
}
function KW() {
  const t = BE.snapshot();
  return { moduleId: pl, version: XR, metrics: tw(), portsInitialized: t._initialized };
}
function WW() {
  const t = BE.snapshot(), e = Tk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: XR, moduleId: pl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: tw() };
}
Object.assign({}, lr, { getMetrics: tw, info: KW, healthCheck: WW, MODULE_ID: pl, VERSION: XR });
const df = {
  async init() {
    return te.isReady() ? { success: !0, alreadyInitialized: !0 } : (te.setInitializing(), lr.init(), te.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = qW(e), { Template: i } = await Promise.resolve().then(() => JW);
    if (t.innerHTML = i.render(n.props), te.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--file-text");
      o && lr.bindClick(o, () => lr.emitClicked(n.props));
    }
    return lr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    te.setUnmounting(), lr.cleanup();
    const t = te.getContainer();
    return t && (t.innerHTML = ""), lr.emitUnmounted(), te.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), lr.destroy(), te.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return te.info();
  }
};
({ ...df });
const ii = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Ku = { getState() {
  return { ...ii };
}, setProps(t) {
  ii.props = t;
}, getProps() {
  return ii.props;
}, setVisible(t) {
  ii.isVisible = !!t;
}, setHovered(t) {
  ii.isHovered = !!t;
}, markRender() {
  ii.lastRender = Date.now();
}, reset() {
  ii.props = null, ii.isVisible = !0, ii.isHovered = !1, ii.lastRender = null;
} }, ew = {
  render(t = {}) {
    const e = QC.SIZES[t.size] || QC.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "file text", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--file-text", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="file-text"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>`;
  },
  getSvgPath() {
    return "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z";
  }
};
({ ...ew });
const JW = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: ew
}, Symbol.toStringTag, { value: "Module" })), $p = "footer.icon.file-text.tracker", VE = "2.2.0-P18EC", lc = h({ moduleId: $p });
function QW(t) {
  return lc.inject(t);
}
function XW() {
  return lc.snapshot();
}
const ms = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Qi = { trackRender(t) {
  ms.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  ms.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  ms.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  ms.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  ms.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = lc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: $p }, e));
}, getMetrics() {
  return Object.assign({}, ms);
}, reset() {
  for (const t in ms) ms[t] = 0;
} };
function qH() {
  return Qi.getMetrics();
}
function tJ(t) {
  return lc.init(), t && t.ports && lc.inject(t.ports), { ok: !0, version: VE };
}
function eJ() {
  return { status: lc.isInitialized() ? "HEALTHY" : "DEGRADED", version: VE, moduleId: $p, portsInitialized: lc.isInitialized(), metrics: qH() };
}
function nJ() {
  return { moduleId: $p, version: VE, metrics: qH(), portsInitialized: lc.isInitialized() };
}
Object.assign({}, Qi, { init: tJ, info: nJ, healthCheck: eJ, MODULE_ID: $p, VERSION: VE, injectPorts: QW, getPorts: XW });
const ZH = "footer-icon-file-text-logger", iJ = g({ moduleId: ZH });
function oJ(t) {
  return iJ.get(t);
}
function F_(t, e) {
  const n = oJ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: ZH });
}
const pa = { info(...t) {
  F_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  F_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  F_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  F_("debug", Array.prototype.slice.call(t));
} };
pa.info, pa.warn, pa.error, pa.debug;
const tM = "footer-icon-file-text", fh = "1.0.1-ENTERPRISE";
function H2(t, ...e) {
  pa && typeof pa[t] == "function" && pa[t]("[FILE-TEXT]", ...e);
}
const Nk = {
  getVersion() {
    return fh;
  },
  getModuleId() {
    return tM;
  },
  async init(t = {}) {
    return H2("info", "Init"), await df.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await df.mount(t, e);
      return Ku.setProps(n.props), Ku.markRender(), Qi.trackMount(), Qi.trackRender(n.props), n;
    } catch (n) {
      throw Qi.trackError(n), H2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Ku.setProps(t), Ku.markRender(), Qi.trackRender(t), ew.render(t);
  },
  async unmount() {
    Qi.trackUnmount();
    const t = await df.unmount();
    return Ku.reset(), t;
  },
  async destroy() {
    const t = await df.destroy();
    return Ku.reset(), Qi.reset(), t;
  },
  healthCheck() {
    const t = te.info(), e = Qi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: fh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: tM, version: fh, lifecycle: te.info(), metrics: Qi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconFileText = { getVersion: () => fh, info: () => Nk.info(), healthCheck: () => Nk.healthCheck() });
const sJ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FileTextIcon: Nk,
  MODULE_ID: tM,
  VERSION: fh,
  default: Nk
}, Symbol.toStringTag, { value: "Module" })), eM = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "grid" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, rJ = (t = {}) => {
  const e = [], n = {};
  return Object.entries(eM.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let en = "idle", q_ = null, j2 = 0;
const ee = { getPhase() {
  return en;
}, isReady() {
  return en === "ready" || en === "mounted";
}, isMounted() {
  return en === "mounted";
}, setInitializing() {
  en = "initializing";
}, setReady() {
  en = "ready";
}, setMounted(t) {
  en = "mounted", q_ = t, j2++;
}, setUnmounting() {
  en = "unmounting";
}, setDestroyed() {
  en = "destroyed", q_ = null;
}, reset() {
  en = "idle", q_ = null;
}, getContainer() {
  return q_;
}, info() {
  return { phase: en, isMounted: this.isMounted(), mountCount: j2 };
} };
({ ...ee });
const gl = "footer-icon-grid-events", nw = "1.5.0-P18EC", nM = "footer:grid", xE = h({ moduleId: gl });
function cJ() {
  xE.init();
}
function Sk(t) {
  return xE.get(t);
}
const Zd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function B2(t) {
  t === void 0 && (t = {}), Zd.uiActions++;
  const e = Sk("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: nM, source: gl, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Grid" }, t) });
}
const ur = { _clickHandler: null, _element: null, init() {
  cJ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Zd.clicks++, e && e(), B2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Zd.clicks++, B2({ clicked: !0, props: t });
}, emitMounted(t) {
  Zd.mounts++;
  const e = Sk("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: nM, moduleId: gl, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Zd.unmounts++;
  const t = Sk("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: nM, moduleId: gl, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function iw() {
  return Object.assign({}, Zd);
}
function aJ() {
  const t = xE.snapshot();
  return { moduleId: gl, version: nw, metrics: iw(), portsInitialized: t._initialized };
}
function lJ() {
  const t = xE.snapshot(), e = Sk("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: nw, moduleId: gl, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: iw() };
}
Object.assign({}, ur, { getMetrics: iw, info: aJ, healthCheck: lJ, MODULE_ID: gl, VERSION: nw });
const mf = {
  async init() {
    return ee.isReady() ? { success: !0, alreadyInitialized: !0 } : (ee.setInitializing(), ur.init(), ee.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = rJ(e), { Template: i } = await Promise.resolve().then(() => uJ);
    if (t.innerHTML = i.render(n.props), ee.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--grid");
      o && ur.bindClick(o, () => ur.emitClicked(n.props));
    }
    return ur.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    ee.setUnmounting(), ur.cleanup();
    const t = ee.getContainer();
    return t && (t.innerHTML = ""), ur.emitUnmounted(), ee.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), ur.destroy(), ee.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return ee.info();
  }
};
({ ...mf });
const oi = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Wu = { getState() {
  return { ...oi };
}, setProps(t) {
  oi.props = t;
}, getProps() {
  return oi.props;
}, setVisible(t) {
  oi.isVisible = !!t;
}, setHovered(t) {
  oi.isHovered = !!t;
}, markRender() {
  oi.lastRender = Date.now();
}, reset() {
  oi.props = null, oi.isVisible = !0, oi.isHovered = !1, oi.lastRender = null;
} }, ow = {
  render(t = {}) {
    const e = eM.SIZES[t.size] || eM.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "grid", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--grid", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="grid"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>`;
  },
  getSvgPath() {
    return 'rect x="3" y="3" width="7" height="7"';
  }
};
({ ...ow });
const uJ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: ow
}, Symbol.toStringTag, { value: "Module" })), yp = "footer.icon.grid.tracker", GE = "2.2.0-P18EC", uc = h({ moduleId: yp });
function dJ(t) {
  return uc.inject(t);
}
function mJ() {
  return uc.snapshot();
}
const fs = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, Xi = { trackRender(t) {
  fs.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  fs.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  fs.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  fs.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  fs.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = uc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: yp }, e));
}, getMetrics() {
  return Object.assign({}, fs);
}, reset() {
  for (const t in fs) fs[t] = 0;
} };
function KH() {
  return Xi.getMetrics();
}
function fJ(t) {
  return uc.init(), t && t.ports && uc.inject(t.ports), { ok: !0, version: GE };
}
function hJ() {
  return { status: uc.isInitialized() ? "HEALTHY" : "DEGRADED", version: GE, moduleId: yp, portsInitialized: uc.isInitialized(), metrics: KH() };
}
function pJ() {
  return { moduleId: yp, version: GE, metrics: KH(), portsInitialized: uc.isInitialized() };
}
Object.assign({}, Xi, { init: fJ, info: pJ, healthCheck: hJ, MODULE_ID: yp, VERSION: GE, injectPorts: dJ, getPorts: mJ });
const WH = "footer-icon-grid-logger", gJ = g({ moduleId: WH });
function _J(t) {
  return gJ.get(t);
}
function Z_(t, e) {
  const n = _J("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: WH });
}
const ga = { info(...t) {
  Z_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  Z_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  Z_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  Z_("debug", Array.prototype.slice.call(t));
} };
ga.info, ga.warn, ga.error, ga.debug;
const iM = "footer-icon-grid", hh = "1.0.1-ENTERPRISE";
function V2(t, ...e) {
  ga && typeof ga[t] == "function" && ga[t]("[GRID]", ...e);
}
const Lk = {
  getVersion() {
    return hh;
  },
  getModuleId() {
    return iM;
  },
  async init(t = {}) {
    return V2("info", "Init"), await mf.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await mf.mount(t, e);
      return Wu.setProps(n.props), Wu.markRender(), Xi.trackMount(), Xi.trackRender(n.props), n;
    } catch (n) {
      throw Xi.trackError(n), V2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Wu.setProps(t), Wu.markRender(), Xi.trackRender(t), ow.render(t);
  },
  async unmount() {
    Xi.trackUnmount();
    const t = await mf.unmount();
    return Wu.reset(), t;
  },
  async destroy() {
    const t = await mf.destroy();
    return Wu.reset(), Xi.reset(), t;
  },
  healthCheck() {
    const t = ee.info(), e = Xi.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: hh, timestamp: Date.now() };
  },
  info() {
    return { moduleId: iM, version: hh, lifecycle: ee.info(), metrics: Xi.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconGrid = { getVersion: () => hh, info: () => Lk.info(), healthCheck: () => Lk.healthCheck() });
const vJ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GridIcon: Lk,
  MODULE_ID: iM,
  VERSION: hh,
  default: Lk
}, Symbol.toStringTag, { value: "Module" })), oM = {
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: !1 }, ariaLabel: { type: "string", default: "hard drive" }, clickable: { type: "boolean", default: !1 } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
}, $J = (t = {}) => {
  const e = [], n = {};
  return Object.entries(oM.PROPS).forEach(([i, o]) => {
    const s = t[i] ?? o.default;
    o.values && !o.values.includes(s) ? (e.push(`Invalid ${i}: "${s}"`), n[i] = o.default) : n[i] = s;
  }), { valid: e.length === 0, errors: e, props: n };
};
let nn = "idle", K_ = null, x2 = 0;
const ne = { getPhase() {
  return nn;
}, isReady() {
  return nn === "ready" || nn === "mounted";
}, isMounted() {
  return nn === "mounted";
}, setInitializing() {
  nn = "initializing";
}, setReady() {
  nn = "ready";
}, setMounted(t) {
  nn = "mounted", K_ = t, x2++;
}, setUnmounting() {
  nn = "unmounting";
}, setDestroyed() {
  nn = "destroyed", K_ = null;
}, reset() {
  nn = "idle", K_ = null;
}, getContainer() {
  return K_;
}, info() {
  return { phase: nn, isMounted: this.isMounted(), mountCount: x2 };
} };
({ ...ne });
const _l = "footer-icon-hard-drive-events", sw = "1.5.0-P18EC", sM = "footer:hard-drive", YE = h({ moduleId: _l });
function yJ() {
  YE.init();
}
function Ak(t) {
  return YE.get(t);
}
const Kd = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function G2(t) {
  t === void 0 && (t = {}), Kd.uiActions++;
  const e = Ak("eventBus");
  !e || !e.emit || e.emit(d.ACTION, { actionId: sM, source: _l, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "Hard Drive" }, t) });
}
const dr = { _clickHandler: null, _element: null, init() {
  yJ();
}, bindClick(t, e) {
  this._element = t, this._clickHandler = () => {
    Kd.clicks++, e && e(), G2({ clicked: !0 });
  }, t && t.addEventListener("click", this._clickHandler);
}, emitClicked(t) {
  Kd.clicks++, G2({ clicked: !0, props: t });
}, emitMounted(t) {
  Kd.mounts++;
  const e = Ak("eventBus");
  e && e.emit && e.emit(f.MOUNTED, { componentId: sM, moduleId: _l, props: t, timestamp: Date.now() });
}, emitUnmounted() {
  Kd.unmounts++;
  const t = Ak("eventBus");
  t && t.emit && t.emit(f.UNMOUNTED, { componentId: sM, moduleId: _l, timestamp: Date.now() });
}, cleanup() {
  this._element && this._clickHandler && this._element.removeEventListener("click", this._clickHandler), this._element = null, this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function rw() {
  return Object.assign({}, Kd);
}
function kJ() {
  const t = YE.snapshot();
  return { moduleId: _l, version: sw, metrics: rw(), portsInitialized: t._initialized };
}
function bJ() {
  const t = YE.snapshot(), e = Ak("eventBus");
  return { status: t._initialized ? "HEALTHY" : "DEGRADED", version: sw, moduleId: _l, checks: { eventBusAvailable: !!e, portsInitialized: t._initialized }, metrics: rw() };
}
Object.assign({}, dr, { getMetrics: rw, info: kJ, healthCheck: bJ, MODULE_ID: _l, VERSION: sw });
const ff = {
  async init() {
    return ne.isReady() ? { success: !0, alreadyInitialized: !0 } : (ne.setInitializing(), dr.init(), ne.setReady(), { success: !0 });
  },
  async mount(t, e = {}) {
    if (!t)
      throw new Error("Container required");
    const n = $J(e), { Template: i } = await Promise.resolve().then(() => EJ);
    if (t.innerHTML = i.render(n.props), ne.setMounted(t), n.props.clickable) {
      const o = t.querySelector(".dsd-icon--hard-drive");
      o && dr.bindClick(o, () => dr.emitClicked(n.props));
    }
    return dr.emitMounted(n.props), { success: !0, props: n.props };
  },
  async unmount() {
    ne.setUnmounting(), dr.cleanup();
    const t = ne.getContainer();
    return t && (t.innerHTML = ""), dr.emitUnmounted(), ne.reset(), { success: !0 };
  },
  async destroy() {
    return await this.unmount(), dr.destroy(), ne.setDestroyed(), { success: !0 };
  },
  getLifecycle() {
    return ne.info();
  }
};
({ ...ff });
const si = { props: null, isVisible: !0, isHovered: !1, lastRender: null }, Ju = { getState() {
  return { ...si };
}, setProps(t) {
  si.props = t;
}, getProps() {
  return si.props;
}, setVisible(t) {
  si.isVisible = !!t;
}, setHovered(t) {
  si.isHovered = !!t;
}, markRender() {
  si.lastRender = Date.now();
}, reset() {
  si.props = null, si.isVisible = !0, si.isHovered = !1, si.lastRender = null;
} }, cw = {
  render(t = {}) {
    const e = oM.SIZES[t.size] || oM.SIZES.md, n = t.variant || "primary", i = t.decorative ?? !1, o = t.ariaLabel || "hard drive", s = t.title || "", r = t.clickable ?? !1, c = t.state || "default", l = ["dsd-icon", "dsd-icon--hard-drive", `dsd-icon--${n}`, `dsd-icon--size-${t.size || "md"}`, `dsd-icon--state-${c}`, r ? "dsd-icon--clickable" : ""].filter(Boolean).join(" "), u = i ? 'aria-hidden="true" role="presentation"' : `aria-label="${o}" role="img"`, m = s ? `<title>${s}</title>` : "";
    return `<span class="${l}" data-icon-id="hard-drive"><svg class="dsd-icon__svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${u}>${m}<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg></span>`;
  },
  getSvgPath() {
    return 'line x1="22" y1="12" x2="2" y2="12"';
  }
};
({ ...cw });
const EJ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Template: cw
}, Symbol.toStringTag, { value: "Module" })), kp = "footer.icon.hard-drive.tracker", FE = "2.2.0-P18EC", dc = h({ moduleId: kp });
function IJ(t) {
  return dc.inject(t);
}
function OJ() {
  return dc.snapshot();
}
const hs = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 }, to = { trackRender(t) {
  hs.renders++, this._emit(a.COMPONENT_RENDER, { props: t });
}, trackClick(t) {
  hs.clicks++, this._emit(a.COMPONENT_INTERACTION, { props: t, action: "click" });
}, trackMount() {
  hs.mounts++, this._emit(a.COMPONENT_MOUNT, {});
}, trackUnmount() {
  hs.unmounts++, this._emit(a.COMPONENT_UNMOUNT, {});
}, trackError(t) {
  hs.errors++, this._emit(a.ERROR, { message: t && t.message ? t.message : String(t) });
}, _emit(t, e) {
  const n = dc.get("telemetry");
  n && n.track && n.track(t, Object.assign({ moduleId: kp }, e));
}, getMetrics() {
  return Object.assign({}, hs);
}, reset() {
  for (const t in hs) hs[t] = 0;
} };
function JH() {
  return to.getMetrics();
}
function DJ(t) {
  return dc.init(), t && t.ports && dc.inject(t.ports), { ok: !0, version: FE };
}
function CJ() {
  return { status: dc.isInitialized() ? "HEALTHY" : "DEGRADED", version: FE, moduleId: kp, portsInitialized: dc.isInitialized(), metrics: JH() };
}
function MJ() {
  return { moduleId: kp, version: FE, metrics: JH(), portsInitialized: dc.isInitialized() };
}
Object.assign({}, to, { init: DJ, info: MJ, healthCheck: CJ, MODULE_ID: kp, VERSION: FE, injectPorts: IJ, getPorts: OJ });
const QH = "footer-icon-hard-drive-logger", RJ = g({ moduleId: QH });
function wJ(t) {
  return RJ.get(t);
}
function W_(t, e) {
  const n = wJ("logger");
  n && typeof n[t] == "function" && n[t](e.join(" "), { component: QH });
}
const _a = { info(...t) {
  W_("info", Array.prototype.slice.call(t));
}, warn(...t) {
  W_("warn", Array.prototype.slice.call(t));
}, error(...t) {
  W_("error", Array.prototype.slice.call(t));
}, debug(...t) {
  W_("debug", Array.prototype.slice.call(t));
} };
_a.info, _a.warn, _a.error, _a.debug;
const rM = "footer-icon-hard-drive", ph = "1.0.1-ENTERPRISE";
function Y2(t, ...e) {
  _a && typeof _a[t] == "function" && _a[t]("[HARD-DRIVE]", ...e);
}
const zk = {
  getVersion() {
    return ph;
  },
  getModuleId() {
    return rM;
  },
  async init(t = {}) {
    return Y2("info", "Init"), await ff.init(t);
  },
  async mount(t, e = {}) {
    try {
      const n = await ff.mount(t, e);
      return Ju.setProps(n.props), Ju.markRender(), to.trackMount(), to.trackRender(n.props), n;
    } catch (n) {
      throw to.trackError(n), Y2("error", "Mount failed:", n.message), n;
    }
  },
  render(t = {}) {
    return Ju.setProps(t), Ju.markRender(), to.trackRender(t), cw.render(t);
  },
  async unmount() {
    to.trackUnmount();
    const t = await ff.unmount();
    return Ju.reset(), t;
  },
  async destroy() {
    const t = await ff.destroy();
    return Ju.reset(), to.reset(), t;
  },
  healthCheck() {
    const t = ne.info(), e = to.getMetrics(), n = { isReady: t.isReady || t.phase === "idle", noErrors: e.errors === 0 }, i = Object.values(n).filter(Boolean).length;
    return { status: i === 2 ? "HEALTHY" : "DEGRADED", score: `${i}/2`, checks: n, version: ph, timestamp: Date.now() };
  },
  info() {
    return { moduleId: rM, version: ph, lifecycle: ne.info(), metrics: to.getMetrics(), timestamp: Date.now() };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.footerIconHardDrive = { getVersion: () => ph, info: () => zk.info(), healthCheck: () => zk.healthCheck() });
const PJ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HardDriveIcon: zk,
  MODULE_ID: rM,
  VERSION: ph,
  default: zk
}, Symbol.toStringTag, { value: "Module" }));
export {
  $h as FOOTER_LOCAL_EVENTS,
  HJ as FOOTER_VERSION,
  an as MODULE_ID,
  z as VERSION,
  aV as default,
  AN as destroy,
  NM as emitGlobalAction,
  oV as getFooterInstance,
  xN as getGuardsResult,
  HN as getIntegrationsStatus,
  UN as getMetrics,
  eV as getPorts,
  sV as getVersion,
  jN as healthCheck,
  BN as info,
  tV as injectPorts,
  VN as isReady,
  SN as mount,
  cV as off,
  rV as on,
  iV as reset,
  zN as setDebug,
  LN as unmount
};
