import { isStrict as nt, recordViolation as At } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts as I, createUiPorts as x } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS as M, BOOT_EVENTS as ge, TELEMETRY_INTENTS as Po, PRELOADER_EVENTS as X, COMPONENT_EVENTS as ot, AUTH_INTENTS as Ht, UI_INTENTS as Jt, ORCHESTRATOR_EVENTS as Lo, ROUTER_EVENTS as We } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { AUTH_EVENTS as tn, BOOT_EVENTS as on, COMPONENT_EVENTS as sn, PRELOADER_EVENTS as rn } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { waitForComponentsReady as $o } from "/core/runtime/boot-ready-dom-bridge.js";
import { createEarlyLogger as Bo } from "/core/runtime/early-boot-logger.js";
const pt = "1.2.0-P17WI", Le = "preloader-policy", Ce = I({ moduleId: Le });
function Xt(e) {
  return Ce.get(e);
}
function Se(e, t, o) {
  const s = Xt("logger");
  if (s) {
    if (o = o || {}, o.component = Le, e === "warn") {
      s.warn && s.warn(t, o);
      return;
    }
    if (e === "info") {
      s.info && s.info(t, o);
      return;
    }
    s.debug && s.debug(t, o);
  }
}
const Ze = {
  timeouts: { global: 3e4, auth: 1e4, components: 1e4, video: 5e3, hide: 300 },
  retries: { componentsMax: 3, authMax: 2, backoffMs: 5e3 },
  degraded: { allowDegraded: !0, degradedOnVideoFail: !0, degradedOnAuthTimeout: !0, degradedOnComponentsTimeout: !0, minProgressForDegraded: 50 },
  video: { enabled: !0, required: !1, preload: "metadata", autoplay: !0, loop: !0, muted: !0 },
  progress: { pollInterval: 200, debounceMs: 32, hits100Threshold: 3, smoothing: !0 },
  ui: { showLogo: !0, showProgress: !0, showPercentage: !0, showText: !0, animations: !0, respectReducedMotion: !0 },
  force: { enableOnGlobalTimeout: !0, minProgressForForce: 30 },
  cleanup: { removeFromDOM: !0, disposeResources: !0, clearTimers: !0 }
};
let A = JSON.parse(JSON.stringify(Ze)), le = {}, k = 0;
const ee = Object.freeze({
  STANDARD: "standard",
  FAST: "fast",
  CORPORATE: "corporate",
  KIOSK: "kiosk",
  MINIMAL: "minimal",
  DEBUG: "debug",
  RECOVERY: "recovery"
}), F = {};
F[ee.STANDARD] = {};
F[ee.FAST] = { timeouts: { global: 15e3, auth: 5e3, components: 5e3, video: 2e3 }, video: { enabled: !1 }, progress: { hits100Threshold: 1 } };
F[ee.CORPORATE] = { timeouts: { global: 6e4, auth: 2e4, components: 2e4 }, retries: { componentsMax: 5, authMax: 3 }, degraded: { allowDegraded: !0, minProgressForDegraded: 30 } };
F[ee.KIOSK] = { timeouts: { global: 45e3 }, degraded: { allowDegraded: !0 }, force: { enableOnGlobalTimeout: !0, minProgressForForce: 10 }, ui: { showPercentage: !1 } };
F[ee.MINIMAL] = { video: { enabled: !1 }, ui: { showLogo: !0, showProgress: !0, showPercentage: !1, showText: !1, animations: !1 } };
F[ee.DEBUG] = { timeouts: { global: 12e4, auth: 3e4, components: 3e4, video: 1e4 }, retries: { componentsMax: 5 }, progress: { hits100Threshold: 1 } };
F[ee.RECOVERY] = { timeouts: { global: 2e4, auth: 5e3, components: 5e3 }, video: { enabled: !1 }, degraded: { allowDegraded: !0, minProgressForDegraded: 20 }, force: { enableOnGlobalTimeout: !0, minProgressForForce: 0 } };
function Je(e, t) {
  for (const o in t)
    t.hasOwnProperty(o) && (t[o] && typeof t[o] == "object" && !Array.isArray(t[o]) ? (e[o] || (e[o] = {}), Je(e[o], t[o])) : e[o] = t[o]);
}
const E = {
  get(e) {
    if (!e) return Object.freeze(Object.assign({}, A));
    const t = e.split(".");
    let o = A;
    for (let s = 0; s < t.length; s++)
      if (o && typeof o == "object" && t[s] in o)
        o = o[t[s]];
      else
        return;
    return o;
  },
  set(e, t) {
    const o = e.split(".");
    let s = A;
    for (let i = 0; i < o.length - 1; i++)
      o[i] in s || (s[o[i]] = {}), s = s[o[i]];
    const r = o[o.length - 1], n = s[r];
    return s[r] = t, k++, Se("info", "Policy updated", { path: e, oldValue: n, newValue: t, version: k }), { path: e, oldValue: n, newValue: t };
  },
  applyProfile(e) {
    if (!F[e])
      return Se("warn", "Unknown profile", { profileName: e }), !1;
    A = JSON.parse(JSON.stringify(Ze));
    const t = F[e];
    return Je(A, t), Je(A, le), k++, Se("info", "Profile applied", { profileName: e, version: k }), !0;
  },
  override(e) {
    le = Object.assign({}, le, e), Je(A, e), k++, Se("info", "Policy overridden", { keys: Object.keys(e), version: k });
  },
  reset() {
    A = JSON.parse(JSON.stringify(Ze)), le = {}, k++, Se("info", "Policy reset to default", { version: k });
  },
  allows(e, t = {}) {
    switch (e) {
      case "degraded":
        return A.degraded.allowDegraded;
      case "force":
        return (t.progress || 0) >= A.force.minProgressForForce;
      case "video":
        return A.video.enabled;
      case "retry":
        return (t.retryCount || 0) < A.retries.componentsMax;
      case "degradedOnTimeout":
        return A.degraded.allowDegraded && (t.progress || 0) >= A.degraded.minProgressForDegraded;
      default:
        return !0;
    }
  },
  getTimeout(e) {
    return A.timeouts[e] || A.timeouts.global;
  },
  getVersion() {
    return k;
  },
  getStatus() {
    return { version: pt, moduleId: Le, policyVersion: k, currentPolicies: this.get(), hasOverrides: Object.keys(le).length > 0, overrideKeys: Object.keys(le), portsInitialized: Ce.isInitialized() };
  },
  healthCheck() {
    const e = !!A.timeouts, t = !!A.retries, o = !!A.degraded;
    return { status: e && t && o ? "HEALTHY" : "DEGRADED", moduleId: Le, version: pt, checks: { hasTimeouts: e, hasRetries: t, hasDegraded: o, hasLogger: !!Xt("logger"), portsInitialized: Ce.isInitialized() }, policyVersion: k, portsInitialized: Ce.isInitialized(), timestamp: Date.now() };
  },
  info() {
    return { version: pt, moduleId: Le, profiles: Object.keys(ee), defaultPolicies: Object.keys(Ze), portsInitialized: Ce.isInitialized(), status: this.getStatus(), healthCheck: this.healthCheck() };
  }
};
function No(e) {
  const t = E.get();
  return t.force.enableOnGlobalTimeout && (e.progress || 0) >= t.force.minProgressForForce;
}
function ko(e) {
  const t = E.get();
  return t.degraded.allowDegraded && t.degraded.degradedOnAuthTimeout;
}
function Uo(e) {
  const t = E.get();
  return t.degraded.allowDegraded && t.degraded.degradedOnComponentsTimeout && (e.progress || 0) >= t.degraded.minProgressForDegraded;
}
function zo() {
  return E.get().video.enabled;
}
function Vo() {
  return E.get("retries.backoffMs");
}
const Go = "preloader-config", Ho = I({ moduleId: Go });
function jo(e) {
  return Ho.get(e);
}
const L = {
  timeoutVideo: 5e3,
  timeoutGlobal: 3e4,
  timeoutComponentsReady: 1e4,
  timeoutComponentsReadyBackoff: 5e3,
  timeoutComponentsReadyMax: 3,
  timeoutLogin: 15e3,
  pollInterval: 200,
  hideDelayMs: 300,
  progressDebounceMs: 32,
  maxTraceEntries: 100,
  telemetrySchema: "preloader-v8-aaa",
  useShadowRoot: !1,
  orchestrator: { notifyOnBoot: !0, trackStatus: !0 },
  debug: !1,
  useAAAMode: !0
};
function Fo(e) {
  e || (e = {});
  const t = jo("config") || {};
  e.profile && E.applyProfile(e.profile);
  const o = E.get(), s = o.timeouts || {}, r = o.retries || {}, n = o.progress || {}, i = t.timeouts || {}, a = t.features || {}, h = t.app || {};
  return Object.assign({}, L, {
    timeoutVideo: s.video || i.preloaderVideoMs || L.timeoutVideo,
    timeoutGlobal: s.global || i.bootMaxMs || L.timeoutGlobal,
    timeoutComponentsReady: s.components || i.componentsReadyMs || L.timeoutComponentsReady,
    timeoutComponentsReadyBackoff: r.backoffMs || i.componentsReadyBackoffMs || L.timeoutComponentsReadyBackoff,
    timeoutComponentsReadyMax: r.componentsMax || i.componentsReadyMaxRetries || L.timeoutComponentsReadyMax,
    timeoutLogin: i.loginWaitMs || L.timeoutLogin,
    pollInterval: n.pollInterval || i.mfContainerPollMs || L.pollInterval,
    hideDelayMs: s.hide || L.hideDelayMs,
    progressDebounceMs: n.debounceMs || L.progressDebounceMs,
    useShadowRoot: a.preloaderShadowRoot !== void 0 ? a.preloaderShadowRoot : L.useShadowRoot,
    debug: h.debug !== void 0 ? h.debug : L.debug,
    useAAAMode: e.useAAAMode !== void 0 ? e.useAAAMode : L.useAAAMode
  }, e);
}
const Yo = "1.5.0-P2-ENTERPRISE", Xe = "preloader.core.contracts", Wo = I({ moduleId: Xe }), mt = (e) => Wo.get(e), qo = {
  info: (e, t) => {
    const o = mt("logger");
    o && o.info && o.info(e, Object.assign({ component: Xe }, t || {}));
  },
  warn: (e, t) => {
    const o = mt("logger");
    o && o.warn && o.warn(e, Object.assign({ component: Xe }, t || {}));
  },
  error: (e, t) => {
    const o = mt("logger");
    o && o.error && o.error(e, Object.assign({ component: Xe }, t || {}));
  }
}, C = Object.freeze({ SUCCESS: "success", DEGRADED: "degraded", TIMEOUT: "timeout", FAILED: "failed", CANCELLED: "cancelled" }), G = Object.freeze({ BOOT_COMPLETE: "boot:complete", BOOT_COMPLETE_NO_VIDEO: "boot:complete:no-video", BOOT_COMPLETE_FAST: "boot:complete:fast", BOOT_DEGRADED_AUTH: "boot:degraded:auth-timeout", BOOT_DEGRADED_COMPONENTS: "boot:degraded:components-timeout", BOOT_DEGRADED_VIDEO: "boot:degraded:video-failed", BOOT_DEGRADED_NETWORK: "boot:degraded:network", BOOT_TIMEOUT_GLOBAL: "boot:timeout:global", BOOT_TIMEOUT_AUTH: "boot:timeout:auth", BOOT_TIMEOUT_COMPONENTS: "boot:timeout:components", BOOT_FAILED_AUTH: "boot:failed:auth-rejected", BOOT_FAILED_CRITICAL: "boot:failed:critical-error", BOOT_FAILED_NO_CONTAINER: "boot:failed:no-container", BOOT_CANCELLED_USER: "boot:cancelled:user", BOOT_CANCELLED_NAVIGATION: "boot:cancelled:navigation" }), Ko = Object.freeze({ BOOT_START: "preloader:boot:start", BOOT_PROGRESS: "preloader:boot:progress", BOOT_PHASE_CHANGE: "preloader:boot:phase", BOOT_COMPLETE: "preloader:boot:complete", BOOT_DEGRADED: "preloader:boot:degraded", BOOT_FAILED: "preloader:boot:failed", BOOT_TIMEOUT: "preloader:boot:timeout", BOOT_CANCELLED: "preloader:boot:cancelled", UI_SHOW: "preloader:ui:show", UI_HIDE: "preloader:ui:hide", UI_DESTROY: "preloader:ui:destroy" }), U = Ko, Qt = (e, t, o) => {
  o || (o = {});
  const s = { subsystem: "preloader", version: Yo, result: e, exitCode: t, success: e === C.SUCCESS || e === C.DEGRADED, bootId: o.bootId || null, startTime: o.startTime || null, endTime: Date.now(), duration: o.startTime ? Date.now() - o.startTime : null, phase: o.phase || null, progress: o.progress !== void 0 ? o.progress : 100, auth: { checked: o.authChecked !== void 0 ? o.authChecked : !1, authenticated: o.authenticated !== void 0 ? o.authenticated : null, source: o.authSource || null }, components: { ready: o.componentsReady !== void 0 ? o.componentsReady : !1, count: o.componentCount !== void 0 ? o.componentCount : 0, degraded: o.degradedComponents || [] }, video: { loaded: o.videoLoaded !== void 0 ? o.videoLoaded : !1, error: o.videoError || null }, metadata: { forceMode: o.forceMode !== void 0 ? o.forceMode : !1, retries: o.retries !== void 0 ? o.retries : 0, errors: o.errors || [], trace: o.trace || [] }, timestamp: Date.now(), isoTime: (/* @__PURE__ */ new Date()).toISOString() };
  return qo.info("Boot output created", { result: e, exitCode: t, duration: s.duration }), Object.freeze(s);
}, St = "1.2.0-P17WI", pe = "preloader-modes", me = x({ moduleId: pe });
function Zo() {
  me.init();
}
function Ot(e) {
  return me.get(e);
}
const _e = { info(e, t) {
  const o = Ot("logger");
  o && o.info && o.info(e, Object.assign({ component: pe }, t || {}));
}, debug(e, t) {
  const o = Ot("logger");
  o && o.debug && o.debug(e, Object.assign({ component: pe }, t || {}));
} }, O = Object.freeze({ VIDEO: "video", STATIC: "static", MINIMAL: "minimal", DEGRADED: "degraded", NORMAL: "normal", FAST: "fast", RECOVERY: "recovery", KIOSK: "kiosk", DEBUG: "debug" }), P = Object.freeze({ IDLE: "idle", INITIALIZING: "initializing", LOADING_VIDEO: "loading-video", WAITING_AUTH: "waiting-auth", LOADING_COMPONENTS: "loading-components", FINALIZING: "finalizing", HIDING: "hiding", COMPLETE: "complete", FAILED: "failed", DEGRADED: "degraded" }), ye = {};
ye[O.VIDEO] = { showVideo: !0, showLogo: !0, showProgress: !0, showPercentage: !0, showText: !0, animations: !0 };
ye[O.STATIC] = { showVideo: !1, showLogo: !0, showProgress: !0, showPercentage: !0, showText: !0, animations: !0 };
ye[O.MINIMAL] = { showVideo: !1, showLogo: !0, showProgress: !0, showPercentage: !1, showText: !1, animations: !1 };
ye[O.DEGRADED] = { showVideo: !1, showLogo: !0, showProgress: !0, showPercentage: !0, showText: !0, showDegradedMessage: !0, animations: !1 };
function y() {
  this.visualMode = O.VIDEO, this.functionalMode = O.NORMAL, this.state = P.IDLE, this._history = [], this._maxHistory = 50, this._listeners = /* @__PURE__ */ new Set(), Zo();
}
y.prototype.getVisualMode = function() {
  return this.visualMode;
};
y.prototype.getFunctionalMode = function() {
  return this.functionalMode;
};
y.prototype.getState = function() {
  return this.state;
};
y.prototype.getConfig = function() {
  return ye[this.visualMode] || ye[O.VIDEO];
};
y.prototype.setVisualMode = function(e) {
  if (Object.values(O).indexOf(e) === -1)
    return _e.debug("Invalid visual mode", { mode: e }), !1;
  const o = this.visualMode;
  return this.visualMode = e, this._recordHistory("visualMode", o, e), this._notifyListeners("visualMode", e), _e.info("Visual mode changed", { from: o, to: e }), !0;
};
y.prototype.setFunctionalMode = function(e) {
  if (Object.values(O).indexOf(e) === -1)
    return _e.debug("Invalid functional mode", { mode: e }), !1;
  const o = this.functionalMode;
  return this.functionalMode = e, this._recordHistory("functionalMode", o, e), this._notifyListeners("functionalMode", e), _e.info("Functional mode changed", { from: o, to: e }), !0;
};
y.prototype.setState = function(e) {
  if (Object.values(P).indexOf(e) === -1)
    return _e.debug("Invalid state", { state: e }), !1;
  const o = this.state;
  return this.state = e, this._recordHistory("state", o, e), this._notifyListeners("state", e), _e.debug("State changed", { from: o, to: e }), !0;
};
y.prototype.setDegraded = function() {
  this.setVisualMode(O.DEGRADED), this.setState(P.DEGRADED);
};
y.prototype.setRecovery = function() {
  this.setFunctionalMode(O.RECOVERY), this.setVisualMode(O.MINIMAL);
};
y.prototype.setFailed = function() {
  this.setState(P.FAILED);
};
y.prototype.setComplete = function() {
  this.setState(P.COMPLETE);
};
y.prototype.isDegraded = function() {
  return this.visualMode === O.DEGRADED || this.state === P.DEGRADED;
};
y.prototype.isComplete = function() {
  return this.state === P.COMPLETE;
};
y.prototype.isFailed = function() {
  return this.state === P.FAILED;
};
y.prototype.isRecovery = function() {
  return this.functionalMode === O.RECOVERY;
};
y.prototype.subscribe = function(e) {
  const t = this;
  return this._listeners.add(e), () => {
    t._listeners.delete(e);
  };
};
y.prototype._notifyListeners = function(e, t) {
  this._listeners.forEach((o) => {
    try {
      o({ type: e, value: t, timestamp: Date.now() });
    } catch {
    }
  });
};
y.prototype._recordHistory = function(e, t, o) {
  this._history.push({ type: e, from: t, to: o, timestamp: Date.now() }), this._history.length > this._maxHistory && this._history.shift();
};
y.prototype.getHistory = function() {
  return this._history.slice();
};
y.prototype.reset = function() {
  this.visualMode = O.VIDEO, this.functionalMode = O.NORMAL, this.state = P.IDLE, this._history = [];
};
y.prototype.getStatus = function() {
  return { version: St, moduleId: pe, visualMode: this.visualMode, functionalMode: this.functionalMode, state: this.state, config: this.getConfig(), historyLength: this._history.length, portsInitialized: me.isInitialized() };
};
y.prototype.healthCheck = function() {
  const e = Object.values(O), t = Object.values(P), o = e.indexOf(this.visualMode) !== -1, s = e.indexOf(this.functionalMode) !== -1, r = t.indexOf(this.state) !== -1, n = Ot("logger"), i = { validVisualMode: o, validFunctionalMode: s, validState: r, loggerAvailable: !!n, portsInitialized: me.isInitialized() }, a = Object.values(i).filter(Boolean).length;
  return { status: a === 5 ? "HEALTHY" : a >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${a}/5`, moduleId: pe, version: St, checks: i, currentModes: { visual: this.visualMode, functional: this.functionalMode, state: this.state }, portsInitialized: me.isInitialized(), timestamp: Date.now() };
};
y.prototype.info = function() {
  return { version: St, moduleId: pe, availableModes: Object.values(O), availableStates: Object.values(P), status: this.getStatus(), portsInitialized: me.isInitialized(), healthCheck: this.healthCheck() };
};
function Jo() {
  return new y();
}
const xt = "preloader-destroyer", eo = typeof window < "u", Xo = typeof document < "u", to = I({ moduleId: xt });
function Qo() {
  to.init();
}
function xo(e) {
  return to.get(e);
}
function we(e, t, o) {
  const s = xo("logger");
  if (s) {
    if (o = o || {}, o.component = xt, e === "error") {
      s.error && s.error(t, o);
      return;
    }
    if (e === "warn") {
      s.warn && s.warn(t, o);
      return;
    }
    if (e === "info") {
      s.info && s.info(t, o);
      return;
    }
    s.debug && s.debug(t, o);
  }
}
const f = { timers: /* @__PURE__ */ new Set(), intervals: /* @__PURE__ */ new Set(), observers: /* @__PURE__ */ new Set(), listeners: [], animations: /* @__PURE__ */ new Set(), promises: /* @__PURE__ */ new Set() }, qe = { destroyCalls: 0, resourcesCleaned: 0, errors: 0, lastDestroyAt: null };
function ie(e) {
  return f.timers.add(e), e;
}
function jt(e, t, o, s) {
  return f.listeners.push({ element: e, event: t, handler: o, options: s }), { element: e, event: t, handler: o, options: s };
}
function es() {
  let e = 0;
  return f.timers.forEach((t) => {
    try {
      clearTimeout(t), e++;
    } catch {
    }
  }), f.timers.clear(), e;
}
function ts() {
  let e = 0;
  return f.intervals.forEach((t) => {
    try {
      clearInterval(t), e++;
    } catch {
    }
  }), f.intervals.clear(), e;
}
function os() {
  let e = 0;
  return f.observers.forEach((t) => {
    try {
      t.disconnect(), e++;
    } catch {
    }
  }), f.observers.clear(), e;
}
function ss() {
  let e = 0;
  return f.listeners.forEach((t) => {
    try {
      t.element && t.element.removeEventListener(t.event, t.handler, t.options), e++;
    } catch {
    }
  }), f.listeners = [], e;
}
function rs() {
  let e = 0;
  return f.animations.forEach((t) => {
    try {
      cancelAnimationFrame(t), e++;
    } catch {
    }
  }), f.animations.clear(), e;
}
function ns() {
  let e = 0;
  return f.promises.forEach((t) => {
    try {
      t.abortController && t.abortController.abort(), e++;
    } catch {
    }
  }), f.promises.clear(), e;
}
function is(e) {
  if (!e) return 0;
  try {
    return e.querySelectorAll("video").forEach((s) => {
      s.pause(), s.src = "", s.load();
    }), e.querySelectorAll("img").forEach((s) => {
      s.src = "";
    }), e.parentNode && e.parentNode.removeChild(e), 1;
  } catch (t) {
    return we("warn", "DOM cleanup error", { error: t.message }), 0;
  }
}
function as(e) {
  const t = ["__PRELOADER__", "__PRELOADER_INSTANCE__", "__BOOT_ID__", `__preloader_${e}__`];
  let o = 0;
  return t.forEach((s) => {
    if (eo && window[s])
      try {
        delete window[s], o++;
      } catch {
        window[s] = void 0;
      }
  }), o;
}
function ds(e, t) {
  if (!e) return 0;
  t = t || [];
  let o = 0;
  return t.forEach((s) => {
    try {
      e.off(s.event, s.handler), o++;
    } catch {
    }
  }), o;
}
function oo(e = {}) {
  const t = e.rootElement || null, o = e.instanceId || null, s = e.eventBus || null, r = e.eventBusSubscriptions || [], n = e.onComplete || null, i = e.force || !1;
  qe.destroyCalls++, qe.lastDestroyAt = Date.now(), Qo(), we("info", "Starting preloader destruction", { instanceId: o, force: i });
  const a = { timers: 0, intervals: 0, observers: 0, listeners: 0, animations: 0, promises: 0, dom: 0, globals: 0, eventBus: 0, total: 0, errors: [] };
  try {
    a.timers = es(), a.intervals = ts(), a.observers = os(), a.listeners = ss(), a.animations = rs(), a.promises = ns(), t && (a.dom = is(t)), o && (a.globals = as(o)), s && r.length > 0 && (a.eventBus = ds(s, r)), a.total = a.timers + a.intervals + a.observers + a.listeners + a.animations + a.promises + a.dom + a.globals + a.eventBus, qe.resourcesCleaned += a.total, we("info", "Preloader destroyed successfully", { instanceId: o, resourcesCleaned: a.total });
  } catch (h) {
    qe.errors++, a.errors.push(h.message), we("error", "Error during destruction", { error: h.message });
  }
  if (n)
    try {
      n(a);
    } catch (h) {
      we("warn", "onComplete callback error", { error: h.message });
    }
  return a;
}
function us() {
  const e = [];
  if (f.timers.size > 0 && e.push(`${f.timers.size} timers still registered`), f.intervals.size > 0 && e.push(`${f.intervals.size} intervals still registered`), f.observers.size > 0 && e.push(`${f.observers.size} observers still registered`), f.listeners.length > 0 && e.push(`${f.listeners.length} listeners still registered`), Xo) {
    const t = document.querySelectorAll("[data-preloader-root], #loading-screen");
    t.length > 0 && e.push(`${t.length} preloader elements still in DOM`);
  }
  return eo && (window.__PRELOADER__ && e.push("__PRELOADER__ still exists"), window.__PRELOADER_INSTANCE__ && e.push("__PRELOADER_INSTANCE__ still exists")), { clean: e.length === 0, issues: e };
}
function ls() {
  f.timers.clear(), f.intervals.clear(), f.observers.clear(), f.listeners = [], f.animations.clear(), f.promises.clear();
}
const Mt = "1.5.0-P22", Ae = "preloader-boot-executor", be = I({ moduleId: Ae });
function cs() {
  be.init();
}
function Ct(e) {
  return be.get(e);
}
function Oe(e, t, o) {
  const s = Ct("logger");
  if (s) {
    if (o = o || {}, o.component = Ae, e === "error") {
      s.error && s.error(t, o);
      return;
    }
    if (e === "warn") {
      s.warn && s.warn(t, o);
      return;
    }
    if (e === "info") {
      s.info && s.info(t, o);
      return;
    }
    s.debug && s.debug(t, o);
  }
}
function D(e = {}) {
  this.bootId = `boot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, this.startTime = null, this.endTime = null, this.domManager = e.domManager || null, this.modeManager = e.modeManager || null, this.eventBus = e.eventBus || null, this.telemetry = e.telemetry || null, this._phase = "idle", this._progress = 0, this._authResult = null, this._videoResult = null, this._componentsResult = null, this._errors = [], this._trace = [], this._aborted = !1, this._retryCount = 0, this._eventBusSubscriptions = [], this._metrics = { phaseChanges: 0, progressUpdates: 0, eventsEmitted: 0 }, cs(), Oe("debug", "Boot executor created", { bootId: this.bootId });
}
D.prototype.execute = function() {
  const e = this;
  if (e._aborted)
    return Promise.resolve(e._createOutput(C.CANCELLED, G.BOOT_CANCELLED_USER));
  e.startTime = Date.now(), e._setPhase("initializing"), e._addTrace("boot:start"), e._emit(U.BOOT_START, { bootId: e.bootId });
  const t = E.getTimeout("global"), o = ie(setTimeout(() => {
    e._handleGlobalTimeout();
  }, t));
  let s;
  return zo() ? (e._setPhase("loading-video"), s = e._executeVideoLoad()) : s = Promise.resolve({ loaded: !1, reason: "disabled-by-policy" }), s.then((r) => (e._videoResult = r, e._setPhase("waiting-auth"), e._executeAuthWait())).then((r) => (e._authResult = r, e._setPhase("loading-components"), e._executeComponentsWait())).then((r) => (e._componentsResult = r, e._setPhase("finalizing"), clearTimeout(o), e._finalize())).catch((r) => (e._errors.push({ error: r.message, timestamp: Date.now() }), Oe("error", "Boot execution error", { error: r.message, bootId: e.bootId }), e._createOutput(C.FAILED, G.BOOT_FAILED_CRITICAL)));
};
D.prototype._executeVideoLoad = function() {
  const e = this, t = E.getTimeout("video");
  return e._addTrace("video:start"), new Promise((o) => {
    const s = ie(setTimeout(() => {
      e._addTrace("video:timeout"), o({ loaded: !1, reason: "timeout" });
    }, t));
    if (e.domManager) {
      const r = e.domManager.getVideo();
      if (r) {
        const n = () => {
          clearTimeout(s), e._addTrace("video:loaded"), o({ loaded: !0 });
        }, i = () => {
          clearTimeout(s), e._addTrace("video:error"), o({ loaded: !1, reason: "load-error" });
        };
        jt(r, "canplaythrough", n, { once: !0 }), jt(r, "error", i, { once: !0 }), e.domManager.playVideo().catch(() => {
        });
      } else
        clearTimeout(s), o({ loaded: !1, reason: "no-video-element" });
    } else
      clearTimeout(s), o({ loaded: !1, reason: "no-dom-manager" });
  });
};
D.prototype._executeAuthWait = function() {
  const e = this, t = E.getTimeout("auth");
  return e._addTrace("auth:start"), e._setProgress(20), new Promise((o) => {
    const s = ie(setTimeout(() => {
      e._addTrace("auth:timeout"), ko({ progress: e._progress }) ? o({ authenticated: null, source: "timeout-degraded", timedOut: !0 }) : o({ authenticated: !1, source: "timeout-failed", timedOut: !0 });
    }, t));
    if (e.eventBus) {
      const r = (i) => {
        clearTimeout(s), e._addTrace("auth:received", { authenticated: i ? i.authenticated : null }), o({ authenticated: i ? i.authenticated : !1, source: i && i.source || "event", user: i && i.user || null });
      };
      e.eventBus.once(M.READY, r), e._eventBusSubscriptions.push({ event: M.READY, handler: r });
      const n = Ct("globalState");
      n && n.isAuthenticated && n.isAuthenticated() && (clearTimeout(s), e._addTrace("auth:already-authenticated"), o({ authenticated: !0, source: "GlobalState" }));
    } else
      clearTimeout(s), o({ authenticated: null, source: "no-eventbus" });
  });
};
D.prototype._executeComponentsWait = function() {
  const e = this, t = E.getTimeout("components");
  return e._addTrace("components:start"), e._setProgress(50), new Promise((o) => {
    const s = ie(setTimeout(() => {
      if (e._addTrace("components:timeout"), Uo({ progress: e._progress }))
        o({ ready: !1, reason: "timeout-degraded", count: 0 });
      else {
        if (e._retryCount < E.get("retries.componentsMax")) {
          e._retryCount++, e._addTrace("components:retry", { attempt: e._retryCount }), ie(setTimeout(() => {
            e._executeComponentsWait().then(o);
          }, Vo()));
          return;
        }
        o({ ready: !1, reason: "timeout-failed", count: 0 });
      }
    }, t));
    if (e.eventBus) {
      const r = (n) => {
        clearTimeout(s), e._setProgress(100), e._addTrace("components:ready", { count: n ? n.count : 0 }), o({ ready: !0, count: n && n.count || 0, components: n && n.components || [] });
      };
      e.eventBus.once(ge.COMPONENTS_READY, r), e._eventBusSubscriptions.push({ event: ge.COMPONENTS_READY, handler: r });
    } else
      ie(setTimeout(() => {
        clearTimeout(s), e._setProgress(100), o({ ready: !0, reason: "simulated", count: 0 });
      }, 1e3));
  });
};
D.prototype._finalize = function() {
  const e = this;
  e.endTime = Date.now(), e._addTrace("boot:finalize");
  const t = e._authResult ? e._authResult.authenticated !== !1 : !1, o = e._componentsResult ? e._componentsResult.ready !== !1 : !1, s = e._videoResult ? e._videoResult.loaded !== !1 : !1;
  let r, n;
  t && o ? s ? (r = C.SUCCESS, n = G.BOOT_COMPLETE) : (r = C.SUCCESS, n = G.BOOT_COMPLETE_NO_VIDEO) : e._authResult && e._authResult.timedOut || e._componentsResult && e._componentsResult.reason && e._componentsResult.reason.indexOf("timeout") !== -1 ? (r = C.DEGRADED, n = e._authResult && e._authResult.timedOut ? G.BOOT_DEGRADED_AUTH : G.BOOT_DEGRADED_COMPONENTS) : (r = C.FAILED, n = e._authResult && e._authResult.authenticated === !1 ? G.BOOT_FAILED_AUTH : G.BOOT_FAILED_CRITICAL);
  const i = e._createOutput(r, n), a = {};
  return a[C.SUCCESS] = U.BOOT_COMPLETE, a[C.DEGRADED] = U.BOOT_DEGRADED, a[C.FAILED] = U.BOOT_FAILED, a[C.TIMEOUT] = U.BOOT_TIMEOUT, a[C.CANCELLED] = U.BOOT_CANCELLED, e._emit(a[r] || U.BOOT_COMPLETE, i), Oe("info", "Boot finalized", { result: r, exitCode: n, duration: i.duration, bootId: e.bootId }), i;
};
D.prototype._handleGlobalTimeout = function() {
  const e = this;
  e._addTrace("timeout:global"), No({ progress: e._progress }) && (Oe("warn", "Global timeout - forcing finalization", { progress: e._progress }), e._emit(U.BOOT_TIMEOUT, e._createOutput(C.TIMEOUT, G.BOOT_TIMEOUT_GLOBAL)));
};
D.prototype._setPhase = function(e) {
  const t = this._phase;
  this._phase = e, this._metrics.phaseChanges++, this._emit(U.BOOT_PHASE_CHANGE, { from: t, to: e }), this.modeManager && this.modeManager.setState(e), Oe("debug", "Phase changed", { from: t, to: e, bootId: this.bootId });
};
D.prototype._setProgress = function(e) {
  this._progress = Math.min(100, Math.max(0, e)), this._metrics.progressUpdates++, this._emit(U.BOOT_PROGRESS, { progress: this._progress }), this.domManager && this.domManager.setProgress(this._progress);
};
D.prototype._addTrace = function(e, t) {
  this._trace.push({ action: e, data: t || null, timestamp: Date.now(), elapsed: this.startTime ? Date.now() - this.startTime : 0 });
};
D.prototype._emit = function(e, t) {
  this._metrics.eventsEmitted++;
  const o = Object.assign({}, t, { bootId: this.bootId, source: Ae, timestamp: Date.now() });
  this.eventBus && this.eventBus.emit(e, o);
};
D.prototype._createOutput = function(e, t) {
  return Qt(e, t, { bootId: this.bootId, startTime: this.startTime, phase: this._phase, progress: this._progress, authChecked: !!this._authResult, authenticated: this._authResult ? this._authResult.authenticated : null, authSource: this._authResult ? this._authResult.source : null, componentsReady: this._componentsResult ? this._componentsResult.ready : null, componentCount: this._componentsResult ? this._componentsResult.count : null, videoLoaded: this._videoResult ? this._videoResult.loaded : null, videoError: this._videoResult ? this._videoResult.reason : null, forceMode: !1, retries: this._retryCount, errors: this._errors, trace: this._trace });
};
D.prototype.abort = function() {
  this._aborted = !0, this._addTrace("boot:aborted"), Oe("info", "Boot aborted", { bootId: this.bootId });
};
D.prototype.destroy = function() {
  return oo({ instanceId: this.bootId, eventBus: this.eventBus, eventBusSubscriptions: this._eventBusSubscriptions });
};
D.prototype.getStatus = function() {
  return { version: Mt, moduleId: Ae, bootId: this.bootId, phase: this._phase, progress: this._progress, aborted: this._aborted, retryCount: this._retryCount, traceLength: this._trace.length, errorCount: this._errors.length, portsInitialized: be.isInitialized(), metrics: this._metrics, p22Compliant: !0 };
};
D.prototype.healthCheck = function() {
  const e = { notAborted: !this._aborted, noErrors: this._errors.length === 0, hasDOMManager: !!this.domManager, hasLogger: !!Ct("logger"), portsInitialized: be.isInitialized() }, t = Object.values(e).filter(Boolean).length;
  return { status: t >= 4 ? "HEALTHY" : "DEGRADED", score: `${t}/5`, moduleId: Ae, version: Mt, bootId: this.bootId, checks: e, portsInitialized: be.isInitialized(), p22Compliant: !0, timestamp: Date.now() };
};
D.prototype.info = function() {
  return { version: Mt, moduleId: Ae, bootId: this.bootId, portsInitialized: be.isInitialized(), p22Compliant: !0, status: this.getStatus(), healthCheck: this.healthCheck() };
};
function hs(e) {
  return new D(e);
}
const fs = "preloader-container-resolver", so = I({ moduleId: fs });
function gs() {
  so.init();
}
function ps(e) {
  return so.get(e);
}
function ms(e) {
  gs();
  const t = ps("appShell");
  if (t && t.adapter && typeof t.adapter.getContainer == "function") {
    const s = t.adapter.getContainer("preloader", { createIfMissing: !0 });
    if (s)
      return { containerEl: s, source: "appshell-adapter" };
  }
  const o = document.getElementById("shell-preloader-region");
  return o ? { containerEl: o, source: "shell-region-direct" } : { containerEl: null, source: "body-fallback" };
}
function it() {
  return {
    source: "bootstrap-v2",
    events: ["boot:progress:start", "boot:progress:phase:start", "boot:progress:phase:complete", "boot:progress:complete"],
    legacy: !1
  };
}
const Ft = "preloader-globals";
function _s(e) {
  if (typeof window > "u") return;
  const t = {
    getInstance: e,
    show() {
      const r = e();
      return r ? r.show() : void 0;
    },
    hide(r) {
      const n = e();
      return n ? n.hide(r) : void 0;
    },
    setProgress(r) {
      const n = e();
      return n ? n.setProgress(r) : void 0;
    },
    getStatus() {
      const r = e();
      return r ? r.getStatus() : void 0;
    },
    getVersion() {
      const r = e();
      return r ? r.getVersion() : void 0;
    },
    healthCheck() {
      const r = e();
      return r ? r.healthCheck() : void 0;
    },
    info() {
      const r = e();
      return r ? r.info() : void 0;
    },
    isInitialized() {
      const r = e();
      return r ? r.isInitialized() : void 0;
    },
    reset() {
      const r = e();
      return r ? r.reset() : void 0;
    },
    getTrace() {
      const r = e();
      return r ? r.bootTrace : void 0;
    },
    getBootId() {
      const r = e();
      return r ? r.bootId : void 0;
    },
    getOrchestratorState() {
      const r = e();
      return r ? r.getOrchestratorState() : void 0;
    },
    getMetrics() {
      const r = e();
      return r ? r.getMetrics() : void 0;
    },
    getIntegrationsStatus() {
      const r = e();
      return r ? r.getIntegrationsStatus() : void 0;
    },
    notifyAuthReady() {
      const r = e();
      return r ? r.notifyAuthReady() : void 0;
    }
  }, o = {
    notifyAuthReady() {
      const r = e();
      return r ? r.notifyAuthReady() : void 0;
    },
    getStatus() {
      const r = e();
      return r ? r.getStatus() : void 0;
    },
    getVersion() {
      const r = e();
      return r ? r.getVersion() : void 0;
    },
    healthCheck() {
      const r = e();
      return r ? r.healthCheck() : void 0;
    }
  }, s = {
    getInstance: e,
    mount(r) {
      const n = e();
      return n ? n.mount(r) : void 0;
    },
    show() {
      const r = e();
      return r ? r.show() : void 0;
    },
    hide(r) {
      const n = e();
      return n ? n.hide(r) : void 0;
    },
    setProgress(r) {
      const n = e();
      return n ? n.setProgress(r) : void 0;
    },
    cleanup() {
      const r = e();
      return r ? r.cleanup() : void 0;
    },
    reset() {
      const r = e();
      return r ? r.reset() : void 0;
    },
    getStatus() {
      const r = e();
      return r ? r.getStatus() : void 0;
    },
    getVersion() {
      const r = e();
      return r ? r.getVersion() : void 0;
    },
    healthCheck() {
      const r = e();
      return r ? r.healthCheck() : void 0;
    },
    info() {
      const r = e();
      return r ? r.info() : void 0;
    },
    isInitialized() {
      const r = e();
      return r ? r.isInitialized() : void 0;
    },
    getTrace() {
      const r = e();
      return r ? r.bootTrace : void 0;
    },
    getBootId() {
      const r = e();
      return r ? r.bootId : void 0;
    },
    // v1.5.0: Bootstrap-v2 é a fonte única de progresso
    getProgressSource() {
      return it();
    },
    getOrchestratorState() {
      const r = e();
      return r ? r.getOrchestratorState() : void 0;
    },
    getMetrics() {
      const r = e();
      return r ? r.getMetrics() : void 0;
    },
    getIntegrationsStatus() {
      const r = e();
      return r ? r.getIntegrationsStatus() : void 0;
    },
    forceFinish(r) {
      const n = e();
      return n ? n.finalizar(r || "debug-force", !0) : void 0;
    }
  };
  window.__dev = window.__dev || {}, window.__dev.preloader = s, nt() ? (window.PreloaderController || Object.defineProperty(window, "PreloaderController", {
    get() {
      return At("WINDOW_ACCESS", { module: Ft, property: "PreloaderController", access: "global-access" }), t;
    },
    configurable: !0
  }), Object.defineProperty(window, "Preloader", {
    get() {
      return At("WINDOW_ACCESS", { module: Ft, property: "Preloader", access: "global-access" }), o;
    },
    configurable: !0
  })) : (window.PreloaderController || (window.PreloaderController = t), window.Preloader = o);
}
function ys(e) {
  window.addEventListener("pagehide", () => {
    const t = e();
    t && t.destroy && t.destroy();
  });
}
const bs = "preloader-integrations", ro = I({ moduleId: bs });
function vs() {
  ro.init();
}
function _t(e) {
  return ro.get(e);
}
function Es(e) {
  if (vs(), !_t("globalState"))
    return e.addTrace("globalstate:not-available"), [];
  const o = [];
  try {
    const s = (i) => {
      try {
        const a = _t("globalState");
        a && a.dispatch && a.actions && a.actions.setLoading && a.dispatch(a.actions.setLoading(i));
      } catch {
      }
    };
    s(!0);
    const r = _t("globalState");
    if (typeof (r && r.subscribe) == "function") {
      const i = r.subscribe(() => {
      }, "app.isLoading");
      i && (o.push(i), e._integrationsStatus.globalStateConnected = !0);
    }
    const n = e.hide.bind(e);
    e.hide = (i) => {
      s(!1), n(i);
    }, e.addTrace("globalstate:connected");
  } catch (s) {
    e.addTrace("globalstate:error", { error: s.message }), e._metrics.errorCount++;
  }
  return o;
}
function As(e) {
  const t = [];
  if (!e.eventBus || !e.config.orchestrator.trackStatus)
    return t;
  const o = {};
  o["main:orchestrator:initialized"] = (r) => {
    e.orchestratorState.initialized = !0, e.addTrace("orchestrator:initialized", { preset: r ? r.preset : void 0 });
  }, o[Lo.PRESET_APPLIED] = (r) => {
    e.orchestratorState.preset = r ? r.presetId : void 0, e.addTrace("orchestrator:preset-applied", { preset: r ? r.presetId : void 0 });
  }, o["main:orchestrator:error"] = (r) => {
    e.orchestratorState.initialized = !1, e.addTrace("orchestrator:error", { error: r ? r.error : void 0 });
  };
  const s = Object.keys(o);
  for (let r = 0; r < s.length; r++)
    ((n) => {
      const i = o[n];
      e.eventBus.on(n, i), t.push(() => {
        e.eventBus.off(n, i);
      });
    })(s[r]);
  return e._integrationsStatus.orchestratorConnected = t.length > 0, t;
}
function Os(e) {
  if (!e.eventBus) return null;
  const t = (s) => {
    e.addTrace("router-global:ready", { routerVersion: s ? s.version : void 0 });
  }, o = (s) => {
    e.addTrace("router-global:route-changed", { path: s && s.route ? s.route.path : void 0 });
  };
  return e.eventBus.on(We.READY, t), e.eventBus.on(We.ROUTE_CHANGED, o), e._integrationsStatus.routerGlobalConnected = !0, () => {
    e.eventBus.off(We.READY, t), e.eventBus.off(We.ROUTE_CHANGED, o);
  };
}
function Is(e) {
  if (e.globalStateCleanups.forEach((t) => {
    try {
      t();
    } catch {
    }
  }), e.globalStateCleanups = [], e._integrationsStatus.globalStateConnected = !1, e.orchestratorCleanups.forEach((t) => {
    try {
      t();
    } catch {
    }
  }), e.orchestratorCleanups = [], e._integrationsStatus.orchestratorConnected = !1, e.routerGlobalCleanup) {
    try {
      e.routerGlobalCleanup();
    } catch {
    }
    e.routerGlobalCleanup = null;
  }
  e._integrationsStatus.routerGlobalConnected = !1;
}
const wt = "1.2.0-P17WI", Ie = "preloader-dom-manager", Ts = typeof document < "u", ve = x({ moduleId: Ie });
function Ds() {
  ve.init();
}
function no(e) {
  return ve.get(e);
}
function se(e, t, o) {
  const s = no("logger");
  if (s) {
    if (o = o || {}, o.component = Ie, e === "error") {
      s.error && s.error(t, o);
      return;
    }
    if (e === "warn") {
      s.warn && s.warn(t, o);
      return;
    }
    if (e === "info") {
      s.info && s.info(t, o);
      return;
    }
    s.debug && s.debug(t, o);
  }
}
const z = { ROOT: "[data-preloader-root]", VIDEO: "[data-preloader-video]", LOGO_CONTAINER: "[data-preloader-logo]", LOGO_IMAGE: "[data-preloader-logo] img", TEXT: "[data-preloader-text]", PROGRESS_WRAPPER: "[data-preloader-progress-wrapper]", PROGRESS_BAR: "[data-preloader-progress-bar]", PERCENTAGE: "[data-preloader-percentage]", DEGRADED_MESSAGE: "[data-preloader-degraded]" };
function u(e = {}) {
  this.instanceId = `preloader_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, this.root = null, this.mounted = !1, this.container = e.container || null, this.useShadowDOM = e.useShadowDOM || !1, this.shadowRoot = null, this._elements = {}, this._listeners = [], this._metrics = { mounts: 0, unmounts: 0, updates: 0, queries: 0 }, Ds(), se("debug", "DOM Manager created", { instanceId: this.instanceId });
}
u.prototype.mount = function(e) {
  const t = this;
  t.mounted && (se("warn", "Already mounted, unmounting first"), t.unmount());
  const o = t.container || (Ts ? document.body : null);
  return o ? (t.root = document.createElement("div"), t.root.setAttribute("data-preloader-root", ""), t.root.setAttribute("data-instance-id", t.instanceId), t.root.setAttribute("data-module-id", Ie), t.root.setAttribute("role", "status"), t.root.setAttribute("aria-live", "polite"), t.root.setAttribute("aria-label", "Carregando aplicação"), t.root.setAttribute("aria-busy", "true"), t.root.className = "preloader-root", t.useShadowDOM ? (t.shadowRoot = t.root.attachShadow({ mode: "open" }), t.shadowRoot.innerHTML = e, se("debug", "Mounted with Shadow DOM")) : t.root.innerHTML = e, o.insertBefore(t.root, o.firstChild), t._elements = {}, t.mounted = !0, t._metrics.mounts++, se("info", "Preloader DOM mounted", { instanceId: t.instanceId, useShadowDOM: t.useShadowDOM }), !0) : (se("error", "No container available for mount"), !1);
};
u.prototype.unmount = function() {
  const e = this;
  return !e.mounted || !e.root ? !1 : (e._removeAllListeners(), e.root.parentNode && e.root.parentNode.removeChild(e.root), e.root = null, e.shadowRoot = null, e._elements = {}, e.mounted = !1, e._metrics.unmounts++, se("info", "Preloader DOM unmounted", { instanceId: e.instanceId }), !0);
};
u.prototype.query = function(e, t) {
  const o = this;
  if (o._metrics.queries++, !o.mounted) return null;
  if (t = t !== !1, t && o._elements[e])
    return o._elements[e];
  const s = o.shadowRoot || o.root, r = s ? s.querySelector(e) : null;
  return r && t && (o._elements[e] = r), r;
};
u.prototype.queryAll = function(e) {
  if (!this.mounted) return [];
  const t = this.shadowRoot || this.root;
  return Array.from(t ? t.querySelectorAll(e) : []);
};
u.prototype.getVideo = function() {
  return this.query(z.VIDEO);
};
u.prototype.getLogoContainer = function() {
  return this.query(z.LOGO_CONTAINER);
};
u.prototype.getLogoImage = function() {
  return this.query(z.LOGO_IMAGE);
};
u.prototype.getText = function() {
  return this.query(z.TEXT);
};
u.prototype.getProgressWrapper = function() {
  return this.query(z.PROGRESS_WRAPPER);
};
u.prototype.getProgressBar = function() {
  return this.query(z.PROGRESS_BAR);
};
u.prototype.getPercentage = function() {
  return this.query(z.PERCENTAGE);
};
u.prototype.getDegradedMessage = function() {
  return this.query(z.DEGRADED_MESSAGE);
};
u.prototype.getRoot = function() {
  return this.root;
};
u.prototype.setProgress = function(e) {
  const t = this.getProgressBar(), o = this.getPercentage();
  t && (t.style.width = `${Math.min(100, Math.max(0, e))}%`), o && (o.textContent = `${Math.round(e)}%`), this._metrics.updates++;
};
u.prototype.setText = function(e) {
  const t = this.getText();
  t && (t.textContent = e, this._metrics.updates++);
};
u.prototype.setVisible = function(e) {
  this.root && (e ? (this.root.classList.add("visible"), this.root.classList.remove("hidden"), this.root.setAttribute("aria-hidden", "false")) : (this.root.classList.remove("visible"), this.root.classList.add("hidden"), this.root.setAttribute("aria-hidden", "true")), this._metrics.updates++);
};
u.prototype.addClass = function(e) {
  this.root && this.root.classList.add(e);
};
u.prototype.removeClass = function(e) {
  this.root && this.root.classList.remove(e);
};
u.prototype.setDegradedMessage = function(e) {
  const t = this;
  let o = t.getDegradedMessage();
  !o && t.root && (o = document.createElement("div"), o.setAttribute("data-preloader-degraded", ""), o.className = "preloader-degraded-message", o.setAttribute("role", "alert"), t.root.appendChild(o), t._elements[z.DEGRADED_MESSAGE] = o), o && (o.textContent = e, o.style.display = e ? "block" : "none"), t._metrics.updates++;
};
u.prototype.clearDegradedMessage = function() {
  const e = this.getDegradedMessage();
  e && (e.remove(), delete this._elements[z.DEGRADED_MESSAGE]);
};
u.prototype.playVideo = function() {
  const e = this.getVideo();
  return e ? e.play().then(() => !0).catch((t) => (se("debug", "Video autoplay blocked", { error: t.message }), !1)) : Promise.resolve(!1);
};
u.prototype.pauseVideo = function() {
  const e = this.getVideo();
  e && e.pause();
};
u.prototype.setVideoSource = function(e) {
  const t = this.getVideo();
  if (t) {
    const o = t.querySelector("source");
    o && (o.src = e, t.load());
  }
};
u.prototype.on = function(e, t, o, s) {
  const r = this, n = typeof e == "string" ? r.query(e) : e;
  if (!n) return null;
  s = s || {}, n.addEventListener(t, o, s);
  const i = { element: n, event: t, handler: o, options: s };
  return r._listeners.push(i), () => {
    r._removeListener(i);
  };
};
u.prototype._removeListener = function(e) {
  e.element.removeEventListener(e.event, e.handler, e.options);
  const t = this._listeners.indexOf(e);
  t > -1 && this._listeners.splice(t, 1);
};
u.prototype._removeAllListeners = function() {
  const e = this;
  e._listeners.forEach((t) => {
    try {
      t.element.removeEventListener(t.event, t.handler, t.options);
    } catch {
    }
  }), e._listeners = [];
};
u.prototype.fadeOut = function(e) {
  const t = this;
  return e = e || 300, t.root ? new Promise((o) => {
    t.root.style.transition = `opacity ${e}ms ease-out`, t.root.style.opacity = "0", setTimeout(() => {
      t.setVisible(!1), o();
    }, e);
  }) : Promise.resolve();
};
u.prototype.fadeIn = function(e) {
  const t = this;
  return e = e || 300, t.root ? (t.root.style.opacity = "0", t.setVisible(!0), new Promise((o) => {
    requestAnimationFrame(() => {
      t.root.style.transition = `opacity ${e}ms ease-in`, t.root.style.opacity = "1", setTimeout(o, e);
    });
  })) : Promise.resolve();
};
u.prototype.setAriaLabel = function(e) {
  this.root && this.root.setAttribute("aria-label", e);
};
u.prototype.setAriaBusy = function(e) {
  this.root && this.root.setAttribute("aria-busy", String(e));
};
u.prototype.announce = function(e) {
  const t = this;
  if (!t.root) return;
  let o = t.query("[data-preloader-announcer]");
  o || (o = document.createElement("div"), o.setAttribute("data-preloader-announcer", ""), o.setAttribute("aria-live", "assertive"), o.setAttribute("aria-atomic", "true"), o.className = "sr-only", o.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);", t.root.appendChild(o)), o.textContent = "", setTimeout(() => {
    o.textContent = e;
  }, 100);
};
u.prototype.isMounted = function() {
  return this.mounted && this.root && this.root.parentNode;
};
u.prototype.clearCache = function() {
  this._elements = {};
};
u.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
u.prototype.getStatus = function() {
  return { version: wt, moduleId: Ie, instanceId: this.instanceId, mounted: this.mounted, useShadowDOM: this.useShadowDOM, hasShadowRoot: !!this.shadowRoot, cachedElements: Object.keys(this._elements).length, activeListeners: this._listeners.length, portsInitialized: ve.isInitialized(), metrics: this.getMetrics() };
};
u.prototype.healthCheck = function() {
  const e = this.isMounted(), t = !!this.root, o = this._listeners.length < 50;
  return { status: e && t && o ? "HEALTHY" : "DEGRADED", moduleId: Ie, version: wt, instanceId: this.instanceId, checks: { isMounted: e, hasRoot: t, noLeakedListeners: o, hasLogger: !!no("logger"), portsInitialized: ve.isInitialized() }, portsInitialized: ve.isInitialized(), metrics: this.getMetrics(), timestamp: Date.now() };
};
u.prototype.info = function() {
  return { version: wt, moduleId: Ie, instanceId: this.instanceId, selectors: z, portsInitialized: ve.isInitialized(), status: this.getStatus(), healthCheck: this.healthCheck() };
};
function Ss(e) {
  return new u(e);
}
const Ms = "preloader-template", Cs = x({ moduleId: Ms });
function ws() {
  Cs.init();
}
function Rs() {
  return ws(), '<div id="loading-screen" role="status" aria-live="polite" aria-label="Carregando" aria-busy="true"><video id="loading-video" autoplay loop muted playsinline preload="metadata"><source src="/assets/videos/video_background_site_web.mp4" type="video/mp4">Seu navegador não suporta vídeo HTML5.</video><div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168" decoding="async" fetchpriority="high"></div><div class="loading-text">Carregando</div><div class="loading-progress-wrapper"><div class="loading-progress"><div class="loading-progress-bar" id="loading-progress-bar"></div></div><div class="loading-percentage">0%</div></div></div>';
}
const Ps = "preloader.template-aaa";
x({ moduleId: Ps });
function Ge(e = {}) {
  const { showVideo: t = !0, showLogo: o = !0, showProgress: s = !0, showPercentage: r = !0, showText: n = !0, videoSrc: i = "/assets/videos/video_background_site_web.mp4", logoSrc: a = "/assets/icons/logo-square.png", logoAlt: h = "DshowDash Logo", text: v = "Carregando", customClass: B = "" } = e;
  return `<div class="preloader-container ${B}" data-preloader-container>${t ? `<video data-preloader-video class="preloader-video" autoplay loop muted playsinline preload="metadata"><source src="${i}" type="video/mp4"></video>` : ""}${o ? `<div class="preloader-logo-container" data-preloader-logo><img src="${a}" alt="${h}" class="preloader-logo" width="180" height="168" decoding="async" fetchpriority="high"></div>` : ""}${n ? `<div class="preloader-text" data-preloader-text>${v}</div>` : ""}${s ? `<div class="preloader-progress-wrapper" data-preloader-progress-wrapper><div class="preloader-progress"><div class="preloader-progress-bar" data-preloader-progress-bar></div></div>${r ? '<div class="preloader-percentage" data-preloader-percentage>0%</div>' : ""}</div>` : ""}</div>`;
}
function Ls(e = {}) {
  return Ge({ showVideo: !1, showText: !1, showPercentage: !1, customClass: "preloader--minimal", ...e });
}
function $s(e = {}) {
  return Ge({ showVideo: !1, showLogo: !1, showText: !1, showPercentage: !1, customClass: "preloader--fast", ...e });
}
function Bs(e = {}) {
  return Ge({ customClass: "preloader--corporate", ...e });
}
function Ns(e = {}) {
  return Ge({ showPercentage: !1, text: "Iniciando sistema...", customClass: "preloader--kiosk", ...e });
}
function ks(e = {}) {
  return '<div class="preloader-container preloader--recovery" data-preloader-container><div class="preloader-recovery-icon" data-preloader-logo><svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></div><div class="preloader-text" data-preloader-text>Recuperando sistema...</div><div class="preloader-progress-wrapper" data-preloader-progress-wrapper><div class="preloader-progress"><div class="preloader-progress-bar preloader-progress-bar--indeterminate" data-preloader-progress-bar></div></div></div></div>';
}
function Us(e, t = {}) {
  switch (e) {
    case "minimal":
      return Ls(t);
    case "fast":
      return $s(t);
    case "corporate":
      return Bs(t);
    case "kiosk":
      return Ns(t);
    case "recovery":
      return ks(t);
    default:
      return Ge(t);
  }
}
const Te = "1.5.0-P17WI", te = "preloader-degraded-ui", Rt = typeof window < "u", $e = typeof document < "u", Q = x({ moduleId: te });
function zs() {
  Q.init();
}
function at(e) {
  return Q.get(e);
}
const Vs = () => {
  const e = at("config");
  return Rt && e && e.app && e.app.debug === !0;
}, Gs = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = at("logger");
  o && Vs() && o.debug && o.debug(`[${te}]`, t.join(" "));
}, Be = { instancesCreated: 0, fallbacksInjected: 0, lastFallbackAt: null };
function de() {
  this.$degradedMessage = null, this.currentReason = null, this._metrics = { showCount: 0, cleanupCount: 0, lastShowAt: null }, Be.instancesCreated++, zs();
}
de.prototype.showMessage = function(e, t, o) {
  if (!$e || !t || this.currentReason === e && this.$degradedMessage) return;
  this.currentReason = e, this._metrics.showCount++, this._metrics.lastShowAt = Date.now(), this.$degradedMessage && this.$degradedMessage.remove();
  const s = { "waiting-auth": "Aguardando autenticação...", "waiting-monitor": "Carregando módulos do sistema...", "waiting-components": "Preparando dashboard...", degraded: "Sistema em modo degradado. Tentando reconectar..." }, r = s[e] || s.degraded;
  this.$degradedMessage = document.createElement("div"), this.$degradedMessage.className = "preloader-degraded-message", this.$degradedMessage.setAttribute("role", "status"), this.$degradedMessage.setAttribute("aria-live", "polite"), this.$degradedMessage.setAttribute("data-module-id", te), this.$degradedMessage.textContent = r, t.appendChild(this.$degradedMessage), typeof o == "function" && o("degraded-message:shown", { reason: e, message: r });
};
de.prototype.cleanup = function() {
  this._metrics.cleanupCount++, this.$degradedMessage && (this.$degradedMessage.remove(), this.$degradedMessage = null), this.currentReason = null;
};
de.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
de.prototype.healthCheck = function() {
  const e = { initialized: !0, hasDocument: $e, messageElementValid: this.$degradedMessage === null || this.$degradedMessage instanceof Element, hasLogger: !!at("logger"), portsInitialized: Q.isInitialized() }, t = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
  return { status: t === o ? "HEALTHY" : t >= 3 ? "DEGRADED" : "UNHEALTHY", score: t, maxScore: o, scoreDisplay: `${t}/${o}`, checks: e, currentReason: this.currentReason, hasActiveMessage: !!this.$degradedMessage, metrics: this._metrics, version: Te, moduleId: te, portsInitialized: Q.isInitialized(), timestamp: Date.now() };
};
de.prototype.info = function() {
  return { version: Te, moduleId: te, currentReason: this.currentReason, hasActiveMessage: !!this.$degradedMessage, portsInitialized: Q.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
de.prototype.getVersion = () => Te;
function Hs(e) {
  if (!$e) return null;
  Be.fallbacksInjected++, Be.lastFallbackAt = Date.now();
  const t = document.createElement("div");
  return t.id = "loading-screen", t.setAttribute("role", "status"), t.setAttribute("aria-live", "polite"), t.setAttribute("aria-label", "Carregando"), t.setAttribute("aria-busy", "true"), t.setAttribute("data-injected-by", "preloader"), t.setAttribute("data-module-id", te), t.className = "visible", t.innerHTML = '<div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168"></div><div class="loading-text">Carregando</div><div class="loading-progress-wrapper"><div class="loading-progress"><div class="loading-progress-bar" id="loading-progress-bar"></div></div><div class="loading-percentage">0%</div></div>', document.body.insertBefore(t, document.body.firstChild), typeof e == "function" && e("fallback-screen:injected"), Gs("info", "Fallback screen injetado"), t;
}
function js() {
  return Te;
}
function io() {
  return Object.assign({}, Be);
}
function ao() {
  const e = { hasDocument: $e, hasWindow: Rt, bodyAccessible: $e && !!document.body, hasLogger: !!at("logger"), portsInitialized: Q.isInitialized() }, t = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
  return { status: t === o ? "HEALTHY" : t >= 3 ? "DEGRADED" : "UNHEALTHY", score: t, maxScore: o, scoreDisplay: `${t}/${o}`, checks: e, moduleMetrics: Object.assign({}, Be), version: Te, moduleId: te, portsInitialized: Q.isInitialized(), timestamp: Date.now() };
}
function Fs() {
  return { version: Te, moduleId: te, moduleMetrics: io(), portsInitialized: Q.isInitialized(), healthCheck: ao() };
}
Rt && (window.__dev = window.__dev || {}, window.__dev.preloaderDegradedUI = { getVersion: js, getModuleMetrics: io, healthCheck: ao, info: Fs });
const Pt = "5.4.0-P17WI", ae = "preloader-animation", Lt = typeof window < "u", ce = typeof document < "u", st = x({ moduleId: ae });
function Ee(e) {
  return st.get(e);
}
const Ys = () => {
  const e = Ee("config");
  return Lt && e && e.app && e.app.debug === !0;
}, Qe = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = Ee("logger");
  if (o) {
    if (e === "error") {
      o.error && o.error(...[`[${ae}]`].concat(t));
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(...[`[${ae}]`].concat(t));
      return;
    }
    Ys() && o.debug && o.debug(...[`[${ae}]`].concat(t));
  }
}, $ = { hidePreloaderCount: 0, showDashboardCount: 0, callbacksExecuted: 0, lastHideAt: null, lastShowAt: null };
function uo(e) {
  const t = Ee("layoutManager");
  if (t && t.setPreloaderActive)
    return t.setPreloaderActive(e === "preloader-active"), t.setScrollLocked && t.setScrollLocked(e === "preloader-active"), Qe("info", "LayoutManager.setPreloaderActive called via port:", e === "preloader-active"), !0;
  const o = Ee("eventBus");
  return o && o.emit ? (o.emit(Jt.REQUEST_LAYOUT, { mode: e, source: ae, timestamp: Date.now() }), Qe("info", "Emitted layout:request:", e), !0) : (Qe("warn", "No LayoutManager or EventBus available for layout request"), !1);
}
function Ws(e) {
  if ($.hidePreloaderCount++, $.lastHideAt = Date.now(), !ce) {
    typeof e == "function" && (e(), $.callbacksExecuted++);
    return;
  }
  const t = document.getElementById("loading-screen");
  if (uo("preloader-inactive"), !t) {
    typeof e == "function" && (e(), $.callbacksExecuted++);
    return;
  }
  t.classList.add("loaded"), setTimeout(() => {
    t.style.opacity = "0", t.style.visibility = "hidden", setTimeout(() => {
      t.style.display = "none", t.setAttribute("hidden", "true"), typeof e == "function" && (e(), $.callbacksExecuted++);
    }, 600);
  }, 300);
}
function Yt() {
  if ($.showDashboardCount++, $.lastShowAt = Date.now(), !ce) return;
  Qe("info", "Dashboard visível"), uo("preloader-inactive");
  const e = document.getElementById("app-container");
  e && (e.hidden = !1, e.style.display = "block", e.style.opacity = "0", e.style.visibility = "visible", setTimeout(() => {
    e.style.transition = "opacity 0.6s ease-in-out", e.style.opacity = "1";
  }, 50));
  const t = document.querySelector(".main-content");
  t && (t.style.opacity = "1", t.style.visibility = "visible");
}
function qs() {
  return Pt;
}
function lo() {
  return Object.assign({}, $);
}
function Ks() {
  for (const e in $)
    $.hasOwnProperty(e) && ($[e] = typeof $[e] == "number" ? 0 : null);
}
function co() {
  const e = Ee("layoutManager"), t = { hasDocument: ce, hasWindow: Lt, bodyAccessible: ce && !!document.body, loadingScreenExists: ce && !!document.getElementById("loading-screen"), appContainerExists: ce && !!document.getElementById("app-container"), layoutManagerAvailable: !!e, hasLogger: !!Ee("logger"), portsInitialized: st.isInitialized() };
  let o = 0, s = 0;
  for (const r in t)
    t.hasOwnProperty(r) && (s++, t[r] && o++);
  return { status: o >= 6 ? "HEALTHY" : o >= 4 ? "DEGRADED" : "UNHEALTHY", score: o, maxScore: s, scoreDisplay: `${o}/${s}`, checks: t, metrics: Object.assign({}, $), compliance: "P17WI-AAA", portsInitialized: st.isInitialized(), version: Pt, moduleId: ae, timestamp: Date.now() };
}
function Zs() {
  return { version: Pt, moduleId: ae, compliance: "P17WI-AAA", metrics: lo(), healthCheck: co(), portsInitialized: st.isInitialized() };
}
Lt && (window.__dev = window.__dev || {}, window.__dev.preloaderAnimation = { getVersion: qs, getMetrics: lo, resetMetrics: Ks, healthCheck: co, info: Zs });
const ho = "preloader-layout-integration", Js = typeof window < "u", fo = x({ moduleId: ho });
function Xs() {
  fo.init();
}
function It(e) {
  return fo.get(e);
}
const Qs = { debug(e, t) {
  const o = It("logger");
  o && o.debug && o.debug(e, Object.assign({ component: ho }, t || {}));
} };
function go(e, t) {
  if (t === void 0 && (t = "preloader-system"), !Js) return !1;
  Xs();
  const o = It("layoutManager");
  if (o && o.setPreloaderActive) {
    const r = e === "preloader-active";
    return o.setPreloaderActive(r), o.setScrollLocked && o.setScrollLocked(r), Qs.debug("LayoutManager called via port", { preloaderActive: r }), !0;
  }
  const s = It("eventBus");
  return s && s.emit ? (s.emit(Jt.REQUEST_LAYOUT, { mode: e, source: t, timestamp: Date.now() }), !0) : !1;
}
function po() {
  return go("preloader-active");
}
function xs() {
  return go("preloader-inactive");
}
const er = "preloader.ui.focus-manager";
x({ moduleId: er });
let Re = null;
function tr() {
  typeof document < "u" && (Re = document.activeElement);
}
function mo(e = null) {
  if (Re != null && Re.focus)
    try {
      Re.focus();
    } catch {
      const t = typeof document < "u" ? document.querySelector('main[tabindex="-1"]') : null;
      t && t.focus();
    }
  e && e.removeAttribute("tabindex"), Re = null;
}
const xe = "preloader-lifecycle", or = I({ moduleId: xe });
function yt(e) {
  return or.get(e);
}
const rt = { info(e, t) {
  const o = yt("logger");
  o && o.info && o.info(e, Object.assign({ component: xe }, t || {}));
}, debug(e, t) {
  const o = yt("logger");
  o && o.debug && o.debug(e, Object.assign({ component: xe }, t || {}));
}, warn(e, t) {
  const o = yt("logger");
  o && o.warn && o.warn(e, Object.assign({ component: xe }, t || {}));
} };
function sr(e) {
  return e.mounted || (e.metrics.recordMount(), e.tracer.add("mount:start"), tr(), e.config.useAAAMode ? rr(e) : nr(e), po(), e.globalStateCleanups = Es(e.system), e.orchestratorCleanups = As(e.system), e.routerGlobalCleanup = Os(e.system), e.mounted = !0, e.showing = !0, e.modeManager.setState(P.INITIALIZING), e.tracer.add("mount:complete")), e;
}
function rr(e) {
  const t = E.get("ui.profile") || "standard", o = Us(t, { showVideo: E.get("video.enabled"), showProgress: E.get("ui.showProgress"), showPercentage: E.get("ui.showPercentage"), showText: E.get("ui.showText"), showLogo: E.get("ui.showLogo") });
  e.domManagerAAA = Ss({ useShadowDOM: e.config.useShadowRoot }), e.domManagerAAA.mount(o), e.domManagerAAA.setVisible(!0), e.$screen = e.domManagerAAA.getRoot(), e.$bar = e.domManagerAAA.getProgressBar(), e.mountSource = "aaa-dom-manager", rt.debug("Mounted with AAA DOM Manager");
}
function nr(e) {
  const t = ms(e.config);
  e.containerEl = t.containerEl, e.mountSource = t.source, e.containerEl ? (e.$screen = e.containerEl.querySelector("#loading-screen") || e.containerEl, e.$screen.innerHTML.trim() || (e.$screen.innerHTML = Rs())) : (e.$injectedScreen = Hs(e.tracer.add.bind(e.tracer)), e.$screen = e.$injectedScreen), e.$bar = e.$screen ? e.$screen.querySelector(".loading-progress-bar, #loading-progress-bar") : null, e.$label = e.$screen ? e.$screen.querySelector(".loading-percentage") : null, e.$screen && (e.$screen.classList.add("visible"), e.$screen.classList.remove("hidden"), e.$screen.removeAttribute("hidden"), e.$screen.setAttribute("aria-busy", "true")), rt.debug("Mounted with legacy method", { source: e.mountSource });
}
function ir(e) {
  e.showing || (e.config.useAAAMode && e.domManagerAAA ? e.domManagerAAA.setVisible(!0) : e.$screen && (e.$screen.classList.add("visible"), e.$screen.classList.remove("hidden")), po(), e.showing = !0, e.modeManager.setState(P.INITIALIZING));
}
function ar(e, t) {
  if (!e.showing && !e.mounted) {
    t && t();
    return;
  }
  e.tracer.add("hide:start"), e.metrics.recordHide(), e.finalizing = !0, e.tracer.markStart("hide");
  const o = () => {
    mo(e.$screen), e.showing = !1, e.modeManager.setState(P.COMPLETE), e.tracer.markEnd("hide"), e.tracer.add("hide:complete");
    const s = { bootId: e.bootId, durationMs: e.state.getBootDuration(), success: !0, componentsLoaded: ["preloader"], performanceMarks: e.tracer.getPerformanceMarks(), bootTrace: e.tracer.getTrace(), phase: e.state.fase, orchestratorState: e.orchestratorState, mountSource: e.mountSource, useAAAMode: e.config.useAAAMode, timestamp: Date.now() };
    e.emit(X.HIDE, s), e.emit(U.BOOT_COMPLETE, Qt(C.SUCCESS, G.BOOT_COMPLETE, { bootId: e.bootId, startTime: e.bootStartTs, phase: e.state.fase, progress: 100, authChecked: !0, authenticated: e.state.temSessaoValida })), e.config.orchestrator.notifyOnBoot && e.eventBus && e.eventBus.emit(X.BOOT_READY, { bootId: e.bootId, durationMs: s.durationMs, orchestratorState: e.orchestratorState, timestamp: Date.now() }), t && t(), e.finalizing = !1;
  };
  e.config.useAAAMode && e.domManagerAAA ? e.domManagerAAA.fadeOut(e.config.hideDelayMs).then(o) : Ws(o);
}
function dr(e, t) {
  const o = Math.max(0, Math.min(100, t));
  if (o < e.state.progressoAtual || e.timers.progressDebounce) return;
  const s = setTimeout(() => {
    e.config.useAAAMode && e.domManagerAAA ? e.domManagerAAA.setProgress(o) : (e.$bar && (e.$bar.style.width = `${o}%`), e.$label && (e.$label.textContent = `${Math.round(o)}%`)), e.state.setProgresso(o), e.emit(X.PROGRESS, { bootId: e.bootId, progress: o, phase: e.state.fase, timestamp: Date.now() }), delete e.timers.progressDebounce;
  }, e.config.progressDebounceMs);
  e.timers.progressDebounce = s, ie(s);
}
function _o(e) {
  e.tracer.add("cleanup:start"), e.metrics.recordCleanup(), Object.keys(e.timers).forEach((t) => {
    clearTimeout(e.timers[t]);
  }), e.timers = {}, e.abortController && (e.abortController.abort(), e.abortController = null), Is(e.system), e.cleanupManager.cleanup(), e.degradedUI.cleanup(), e.progressMonitor && (e.progressMonitor.stop(), e.progressMonitor = null), xs(), mo(e.$screen), e.config.useAAAMode && e.domManagerAAA ? (e.domManagerAAA.unmount(), e.domManagerAAA = null) : e.$injectedScreen && e.$injectedScreen.parentNode ? (e.$injectedScreen.parentNode.removeChild(e.$injectedScreen), e.$injectedScreen = null) : e.$screen && (e.$screen.classList.add("hidden"), e.$screen.setAttribute("hidden", ""), e.$screen.setAttribute("aria-busy", "false")), e.bootExecutorAAA && (e.bootExecutorAAA.destroy(), e.bootExecutorAAA = null), e.$screen = null, e.$bar = null, e.$label = null, e.mounted = !1, e.showing = !1, e.finalizing = !1, e.allowFinalize = !0, e.bootManager.reset(), e.modeManager.reset(), e.tracer.add("cleanup:complete");
}
function ur(e) {
  e.tracer.add("destroy"), e.allowFinalize = !1, e.destroyed = !0, _o(e);
  const t = oo({ rootElement: e.$screen, instanceId: e.bootId, eventBus: e.eventBus });
  ls(), e.tracer.clear();
  const o = us();
  return o.clean || rt.warn("Destruction verification failed", { issues: o.issues }), rt.info("PreloaderSystem destroyed", { bootId: e.bootId, cleanupReport: t, verification: o }), t;
}
const $t = "5.6.0-P18EC", he = "preloader-state", lr = typeof window < "u", Ne = I({ moduleId: he });
function Bt(e) {
  return Ne.get(e);
}
const cr = () => {
  const e = Bt("config");
  return lr && e && e.app && e.app.debug === !0;
}, Tt = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = Bt("logger");
  if (o) {
    if (e === "error") {
      o.error && o.error(`[${he}]`, t.join(" "));
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(`[${he}]`, t.join(" "));
      return;
    }
    cr() && o.debug && o.debug(`[${he}]`, t.join(" "));
  }
}, g = { INIT: "inicializacao", WAIT_AUTH: "aguardando-login", LOADING: "carregando-dashboard", FINALIZING: "finalizando", VISIBLE: "dashboard-visivel" }, ue = {};
ue[g.INIT] = [g.WAIT_AUTH, g.LOADING, g.FINALIZING];
ue[g.WAIT_AUTH] = [g.LOADING, g.FINALIZING];
ue[g.LOADING] = [g.FINALIZING];
ue[g.FINALIZING] = [g.VISIBLE];
ue[g.VISIBLE] = [];
function S() {
  this.fase = g.INIT, this.videoCarregado = !1, this.sessaoVerificada = !1, this.temSessaoValida = !1, this.sessaoMeta = null, this.progressoAtual = 0, this.hits100 = 0, this.hits100Threshold = 3, this.bootStartTime = Date.now(), this.eventBus = null, this.forceMode = !1, this._transitionCount = 0, this._lastTransitionAt = null;
}
S.prototype.setEventBus = function(e) {
  this.eventBus = e;
};
S.prototype.setFase = function(e, t) {
  if (this.fase === e) return;
  const o = ue[this.fase] || [];
  if (!t && o.indexOf(e) === -1) {
    Tt("warn", `Transicao invalida: ${this.fase} -> ${e}`);
    return;
  }
  Tt("info", `Fase: ${this.fase} -> ${e}${t ? " (FORCADO)" : ""}`);
  const s = this.fase;
  this.fase = e, this._transitionCount++, this._lastTransitionAt = Date.now(), this.eventBus && this.eventBus.emit(X.PHASE_CHANGE, { from: s, to: e, forced: t, timestamp: Date.now() });
};
S.prototype.enableForceMode = function() {
  this.forceMode = !0, Tt("info", "Force mode ativado");
};
S.prototype.setVideoCarregado = function(e) {
  this.videoCarregado = e;
};
S.prototype.setSessao = function(e, t, o) {
  this.sessaoVerificada = e, this.temSessaoValida = t, this.sessaoMeta = o || null;
};
S.prototype.setProgresso = function(e) {
  const t = Math.max(0, Math.min(100, e));
  t === 100 && this.progressoAtual === 100 ? this.hits100++ : t !== 100 && this.resetHits100(), this.progressoAtual = Math.max(this.progressoAtual, t);
};
S.prototype.incrementHits100 = function() {
  this.hits100++;
};
S.prototype.resetHits100 = function() {
  this.hits100 = 0;
};
S.prototype.shouldFinalize = function() {
  return this.progressoAtual === 100 && this.hits100 >= this.hits100Threshold;
};
S.prototype.resetBootStart = function() {
  this.bootStartTime = Date.now();
};
S.prototype.getBootDuration = function() {
  return Date.now() - this.bootStartTime;
};
S.prototype.resetAll = function() {
  this.fase = g.INIT, this.videoCarregado = !1, this.sessaoVerificada = !1, this.temSessaoValida = !1, this.sessaoMeta = null, this.progressoAtual = 0, this.hits100 = 0, this.bootStartTime = Date.now(), this.forceMode = !1, this._transitionCount = 0, this._lastTransitionAt = null;
};
S.prototype.getStatus = function() {
  return Object.freeze({ fase: this.fase, videoCarregado: this.videoCarregado, sessaoVerificada: this.sessaoVerificada, temSessaoValida: this.temSessaoValida, sessaoMeta: this.sessaoMeta ? Object.assign({}, this.sessaoMeta) : null, progressoAtual: this.progressoAtual, hits100: this.hits100, bootDuration: this.getBootDuration(), forceMode: this.forceMode, portsInitialized: Ne.isInitialized() });
};
S.prototype.healthCheck = function() {
  const e = this, o = Object.keys(g).map((h) => g[h]).indexOf(e.fase) !== -1, s = e.progressoAtual >= 0 && e.progressoAtual <= 100, r = e.getBootDuration() < 12e4, n = { isValidPhase: o, progressInRange: s, noStaleState: r, hasLogger: !!Bt("logger"), portsInitialized: Ne.isInitialized() }, i = Object.values(n).filter(Boolean).length, a = Object.keys(n).length;
  return { status: i === a ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: i, maxScore: a, scoreDisplay: `${i}/${a}`, checks: n, fase: e.fase, progress: e.progressoAtual, bootDuration: e.getBootDuration(), forceMode: e.forceMode, transitionCount: e._transitionCount, version: $t, moduleId: he, portsInitialized: Ne.isInitialized(), timestamp: Date.now() };
};
S.prototype.info = function() {
  return { version: $t, moduleId: he, status: this.getStatus(), healthCheck: this.healthCheck(), phases: Object.keys(g).length, validTransitions: Object.keys(ue).length, transitionCount: this._transitionCount, lastTransitionAt: this._lastTransitionAt, portsInitialized: Ne.isInitialized() };
};
S.prototype.getVersion = () => $t;
const yo = "5.3.0-P17WI", dt = "preloader-cleanup", ke = I({ moduleId: dt });
function hr() {
  ke.init();
}
function fr(e) {
  return ke.get(e);
}
function Wt(e, t, o) {
  const s = fr("logger");
  s && (o = o || {}, o.component = dt, typeof s[e] == "function" && s[e](t, o));
}
function W() {
  this.timers = /* @__PURE__ */ new Set(), this.observers = /* @__PURE__ */ new Set(), this.intervals = /* @__PURE__ */ new Set(), this.callbacks = /* @__PURE__ */ new Set(), this._cleanupCount = 0, this._lastCleanupAt = null, this._errors = [], hr();
}
W.prototype.addTimer = function(e) {
  this.timers.add(e);
};
W.prototype.addObserver = function(e) {
  this.observers.add(e);
};
W.prototype.addInterval = function(e) {
  this.intervals.add(e);
};
W.prototype.add = function(e) {
  typeof e == "function" && this.callbacks.add(e);
};
W.prototype.cleanup = function() {
  const e = this;
  e._cleanupCount++, e._lastCleanupAt = Date.now(), e.timers.forEach((t) => {
    clearTimeout(t);
  }), e.timers.clear(), e.observers.forEach((t) => {
    t.disconnect();
  }), e.observers.clear(), e.intervals.forEach((t) => {
    clearInterval(t);
  }), e.intervals.clear(), e.callbacks.forEach((t) => {
    try {
      t();
    } catch (o) {
      e._errors.push({ error: o.message, timestamp: Date.now() }), Wt("warn", `Erro ao executar callback: ${o.message}`);
    }
  }), e.callbacks.clear(), Wt("info", "Recursos limpos");
};
W.prototype.getResourceCount = function() {
  return { timers: this.timers.size, observers: this.observers.size, intervals: this.intervals.size, callbacks: this.callbacks.size, total: this.timers.size + this.observers.size + this.intervals.size + this.callbacks.size };
};
W.prototype.healthCheck = function() {
  const e = this.getResourceCount(), t = e.total < 100, o = this._errors.length < 10, s = { noLeaks: t, lowErrors: o, portsInitialized: ke.isInitialized() }, r = Object.values(s).filter(Boolean).length;
  return { status: r === 3 ? "HEALTHY" : r >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${r}/3`, checks: s, resources: e, cleanupCount: this._cleanupCount, errorCount: this._errors.length, portsInitialized: ke.isInitialized(), version: yo, moduleId: dt };
};
W.prototype.info = function() {
  return { version: yo, moduleId: dt, healthCheck: this.healthCheck(), resources: this.getResourceCount(), cleanupCount: this._cleanupCount, lastCleanupAt: this._lastCleanupAt, portsInitialized: ke.isInitialized(), errors: this._errors.slice(-5) };
};
const ut = "5.2.0-P2-ENTERPRISE", Z = "preloader-progress", Nt = typeof window < "u", gr = typeof document < "u", Pe = {
  START: "boot:progress:start",
  PHASE_START: "boot:progress:phase:start",
  PHASE_COMPLETE: "boot:progress:phase:complete",
  COMPLETE: "boot:progress:complete"
}, Ue = I({ moduleId: Z });
function pr() {
  Ue.init();
}
function kt(e) {
  return Ue.get(e);
}
function bo() {
  var e, t;
  const o = kt("logger");
  if (o) return o;
  if (Nt && ((t = (e = window.Core) == null ? void 0 : e.windowAdapter) != null && t.get)) {
    const s = window.Core.windowAdapter.get("Logger");
    if (s) return s;
  }
  return null;
}
function vo() {
  var e, t;
  const o = kt("eventBus");
  if (o) return o;
  if (Nt && ((t = (e = window.Core) == null ? void 0 : e.windowAdapter) != null && t.get)) {
    const s = window.Core.windowAdapter.get("EventBus");
    if (s) return s;
  }
  return null;
}
const mr = () => {
  const e = kt("config");
  return Nt && e && e.app && e.app.debug === !0;
}, w = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = bo();
  if (o) {
    if (e === "error") {
      o.error && o.error(...[`[${Z}]`].concat(t));
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(...[`[${Z}]`].concat(t));
      return;
    }
    if (e === "info") {
      o.info && o.info(...[`[${Z}]`].concat(t));
      return;
    }
    mr() && o.debug && o.debug(...[`[${Z}]`].concat(t));
  }
};
function _r(e) {
  try {
    const t = vo();
    t && t.emit ? (t.emit(ge.COMPONENTS_READY, Object.assign({}, e, {
      source: Z,
      version: ut
    })), w("info", "BOOT_EVENTS.COMPONENTS_READY emitted via EventBus")) : w("warn", "EventBus not available via Ports - COMPONENTS_READY not emitted");
  } catch (t) {
    w("warn", "Failed to emit BOOT_EVENTS.COMPONENTS_READY", { error: t.message });
  }
}
function V(e) {
  this.state = e, this.done = !1, this.cachedBar = null, this.cachedPercentage = null, this._startedAt = null, this._stoppedAt = null, this._eventCleanups = [], this._bootstrapConnected = !1, this._metrics = {
    uiUpdateCount: 0,
    lastProgress: 0,
    lastUpdateAt: null,
    eventsReceived: 0,
    lastEventType: null,
    lastPhaseId: null
  }, pr();
}
V.prototype.start = function() {
  const e = this;
  e.done || gr && (w("info", "Iniciando monitoramento Enterprise (Bootstrap-integrated)"), e._startedAt = Date.now(), e.cachedBar = document.getElementById("loading-progress-bar"), e.cachedPercentage = document.querySelector(".loading-percentage"), e._connectToBootstrap());
};
V.prototype._connectToBootstrap = function() {
  const e = this, t = vo();
  if (!t || !t.on) {
    w("warn", "EventBus not available - cannot connect to Bootstrap-v2"), e._setupMinimalFallback();
    return;
  }
  w("info", "Connecting to Bootstrap-v2 progress events");
  const o = t.on(Pe.START, (i) => {
    e._metrics.eventsReceived++, e._metrics.lastEventType = "start", w("debug", "Bootstrap progress START", i), e.updateUI(i.percentage || 0);
  });
  e._eventCleanups.push(o);
  const s = t.on(Pe.PHASE_START, (i) => {
    e._metrics.eventsReceived++, e._metrics.lastEventType = "phase:start", e._metrics.lastPhaseId = i.phase || i.phaseId, w("debug", "Bootstrap phase START", { phase: i.phase, percentage: i.percentage }), e.updateUI(i.percentage || 0);
  });
  e._eventCleanups.push(s);
  const r = t.on(Pe.PHASE_COMPLETE, (i) => {
    e._metrics.eventsReceived++, e._metrics.lastEventType = "phase:complete", e._metrics.lastPhaseId = i.phase || i.phaseId, w("debug", "Bootstrap phase COMPLETE", { phase: i.phase, percentage: i.percentage }), e.updateUI(i.percentage || 0);
  });
  e._eventCleanups.push(r);
  const n = t.on(Pe.COMPLETE, (i) => {
    e._metrics.eventsReceived++, e._metrics.lastEventType = "complete", w("info", "Bootstrap progress COMPLETE", { success: i.success, totalTime: i.totalTime }), e.updateUI(100), setTimeout(() => {
      e.finalize("bootstrap-complete");
    }, 300);
  });
  e._eventCleanups.push(n), e._bootstrapConnected = !0, w("info", "Connected to Bootstrap-v2 progress events (4 listeners)");
};
V.prototype._setupMinimalFallback = function() {
  const e = this;
  w("warn", "Setting up minimal fallback (EventBus unavailable)");
  const t = Date.now(), o = 5e3, s = setInterval(() => {
    const r = Date.now() - t, n = Math.min(100, Math.round(r / o * 100));
    e.updateUI(n), n >= 100 && (clearInterval(s), e.finalize("fallback-timeout"));
  }, 200);
  e._fallbackInterval = s, e._fallbackActive = !0;
};
V.prototype.updateUI = function(e) {
  this.done || (this.state.setProgresso(e), this._metrics.uiUpdateCount++, this._metrics.lastProgress = e, this._metrics.lastUpdateAt = Date.now(), this.cachedBar && (this.cachedBar.style.width = `${e}%`), this.cachedPercentage && (this.cachedPercentage.textContent = `${Math.round(e)}%`));
};
V.prototype.finalize = function(e) {
  if (this.done) return;
  this.done = !0, this.stop(), w("info", `Finalizando (reason: ${e}, eventsReceived: ${this._metrics.eventsReceived})`);
  const t = {
    reason: e,
    bootstrapIntegrated: this._bootstrapConnected,
    eventsReceived: this._metrics.eventsReceived,
    lastPhaseId: this._metrics.lastPhaseId,
    timestamp: Date.now()
  };
  _r(t);
};
V.prototype.stop = function() {
  this._stoppedAt = Date.now();
  for (let e = 0; e < this._eventCleanups.length; e++)
    try {
      typeof this._eventCleanups[e] == "function" && this._eventCleanups[e]();
    } catch (t) {
      w("warn", "Error cleaning up event listener", { error: t.message });
    }
  this._eventCleanups = [], this._fallbackInterval && (clearInterval(this._fallbackInterval), this._fallbackInterval = null), w("debug", "ProgressMonitor stopped");
};
V.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
V.prototype.healthCheck = function() {
  const e = {
    stateAvailable: !!this.state,
    notDone: !this.done,
    bootstrapConnected: this._bootstrapConnected,
    eventsReceived: this._metrics.eventsReceived > 0,
    progressValid: this._metrics.lastProgress >= 0 && this._metrics.lastProgress <= 100,
    portsInitialized: Ue.isInitialized()
  };
  let t = 0;
  const o = Object.keys(e);
  for (let n = 0; n < o.length; n++)
    e[o[n]] && t++;
  const s = o.length, r = bo();
  return {
    status: t === s ? "HEALTHY" : t >= 4 ? "DEGRADED" : "UNHEALTHY",
    score: t,
    maxScore: s,
    scoreDisplay: `${t}/${s}`,
    checks: e,
    bootstrapIntegrated: !0,
    bootstrapConnected: this._bootstrapConnected,
    fallbackActive: !!this._fallbackActive,
    done: this.done,
    portsInitialized: Ue.isInitialized(),
    strictMode: nt(),
    eventUsed: "PROGRESS_EVENTS (Bootstrap-v2)",
    metrics: this._metrics,
    loggerAvailable: !!r,
    version: ut,
    moduleId: Z,
    timestamp: Date.now()
  };
};
V.prototype.info = function() {
  return {
    version: ut,
    moduleId: Z,
    bootstrapIntegrated: !0,
    bootstrapConnected: this._bootstrapConnected,
    fallbackActive: !!this._fallbackActive,
    eventsUsed: Object.keys(Pe),
    done: this.done,
    startedAt: this._startedAt,
    stoppedAt: this._stoppedAt,
    duration: this._startedAt ? (this._stoppedAt || Date.now()) - this._startedAt : null,
    portsInitialized: Ue.isInitialized(),
    strictMode: nt(),
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck()
  };
};
V.prototype.getVersion = () => ut;
const Ut = "4.7.0-P18EC", He = "preloader-video", je = typeof window < "u", et = typeof document < "u", Eo = "video-fallback", Ao = I({ moduleId: He });
function lt(e) {
  return Ao.get(e);
}
const yr = () => {
  var e;
  const t = lt("config");
  return je && ((e = t == null ? void 0 : t.app) == null ? void 0 : e.debug) === !0;
}, Ke = (e, ...t) => {
  var o;
  const s = lt("logger");
  s && yr() && ((o = s.debug) == null || o.call(s, `[${He}]`, ...t));
}, _ = { loadAttempts: 0, successCount: 0, errorCount: 0, timeoutCount: 0, fallbackApplied: 0, lastLoadAt: null, lastResult: null };
function Oo(e = null) {
  var t;
  if (_.loadAttempts++, _.lastLoadAt = Date.now(), !je || !et)
    return _.lastResult = "no_document", Promise.resolve({ loaded: !1, reason: "no_document" });
  const o = lt("config") || {}, s = e ?? ((t = o.timeouts) == null ? void 0 : t.preloaderVideoMs) ?? 5e3;
  return new Promise((r) => {
    const n = document.getElementById("loading-video"), i = document.getElementById("loading-screen");
    if (!n) {
      bt(i, n), vt("video:not_found"), _.errorCount++, _.lastResult = "element_not_found", r({ loaded: !1, reason: "element_not_found" });
      return;
    }
    let a = !1;
    const h = () => {
      a || (a = !0, n.removeEventListener("canplaythrough", v), n.removeEventListener("error", B));
    }, v = () => {
      h(), clearTimeout(N), Ke("info", "✅ Carregado!"), qt(i, n), _.successCount++, _.lastResult = "canplaythrough", r({ loaded: !0, reason: "canplaythrough" });
    }, B = () => {
      h(), clearTimeout(N), Ke("info", "Erro ao carregar - usando fallback"), bt(i, n), vt("video:error"), _.errorCount++, _.lastResult = "error", r({ loaded: !1, reason: "error" });
    }, N = setTimeout(() => {
      h(), Ke("info", "Timeout - usando fallback"), bt(i, n), vt("video:timeout"), _.timeoutCount++, _.lastResult = "timeout", r({ loaded: !1, reason: "timeout" });
    }, s);
    n.addEventListener("canplaythrough", v, { once: !0 }), n.addEventListener("error", B, { once: !0 }), n.readyState >= 3 && (clearTimeout(N), h(), Ke("info", "✅ Já carregado!"), qt(i, n), _.successCount++, _.lastResult = "already_loaded", r({ loaded: !0, reason: "already_loaded" }));
  });
}
function bt(e, t) {
  _.fallbackApplied++, e && e.classList.add(Eo), t && (t.style.display = "none");
}
function qt(e, t) {
  e && e.classList.remove(Eo), t && (t.style.display = "");
}
function vt(e) {
  if (je)
    try {
      const t = lt("eventBus");
      t != null && t.emit && t.emit(Po.TRACK, { category: "preloader", action: e, moduleId: He, timestamp: Date.now() });
    } catch {
    }
}
function br() {
  return Ut;
}
function Io() {
  return { ..._ };
}
function vr() {
  Object.keys(_).forEach((e) => {
    typeof _[e] == "number" ? _[e] = 0 : _[e] = null;
  });
}
function To() {
  const e = Ao.snapshot(), t = et ? document.getElementById("loading-video") : null, o = et ? document.getElementById("loading-screen") : null, s = { hasDocument: et, hasWindow: je, videoElementExists: !!t, screenElementExists: !!o, noRecentErrors: _.errorCount === 0 || _.successCount / (_.successCount + _.errorCount) > 0.5, portsInitialized: e._initialized, p18IntentsAvailable: !0 }, r = Object.values(s).filter(Boolean).length, n = Object.keys(s).length;
  return { status: r === n ? "HEALTHY" : r >= 3 ? "DEGRADED" : "UNHEALTHY", score: r, maxScore: n, scoreDisplay: `${r}/${n}`, checks: s, metrics: { ..._ }, version: Ut, moduleId: He, timestamp: Date.now() };
}
function Er() {
  return { version: Ut, moduleId: He, metrics: Io(), healthCheck: To(), usingP18Intents: !0 };
}
je && (window.__dev = window.__dev || {}, window.__dev.preloaderVideo = { getVersion: br, getMetrics: Io, resetMetrics: vr, healthCheck: To, info: Er, carregarVideo: Oo });
const zt = "1.7.0-P18EC", fe = "preloader-auth-observer", Ar = typeof window < "u", Or = typeof document < "u", ze = I({ moduleId: fe });
function Ir() {
  ze.init();
}
function Vt(e) {
  return ze.get(e);
}
const Tr = () => {
  const e = Vt("config");
  return Ar && e && e.app && e.app.debug === !0;
}, Et = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = Vt("logger");
  if (o) {
    if (e === "error") {
      o.error && o.error(`[${fe}]`, t.join(" "));
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(`[${fe}]`, t.join(" "));
      return;
    }
    Tr() && o.debug && o.debug(`[${fe}]`, t.join(" "));
  }
};
function De(e) {
  this.eventBus = e.eventBus, this.cleanupManager = e.cleanupManager, this.timers = e.timers, this.config = e.config, this.addTrace = e.addTrace, this.transitionPhase = e.transitionPhase, this.iniciarDashboard = e.iniciarDashboard, this._observing = !1, this._resolved = !1, this._startedAt = null, this._resolvedAt = null, this._resolveMethod = null, Ir();
}
De.prototype.observe = function() {
  const e = this;
  if (!Or) return;
  Et("info", "Aguardando autenticacao..."), e._observing = !0, e._startedAt = Date.now(), e.transitionPhase(g.WAIT_AUTH, !0);
  let t = !1;
  e.timers.login = setTimeout(() => {
    t || (Et("warn", `Login timeout (${e.config.timeoutLogin}ms)`), e.addTrace("timeout:login"));
  }, e.config.timeoutLogin), new Promise((s) => {
    const r = (i) => {
      t || (t = !0, e.timers.login && (clearTimeout(e.timers.login), delete e.timers.login), s({ method: "event-bus", data: i }));
    };
    e.eventBus.on(M.LOGIN_SUCCESS, r);
    const n = new MutationObserver((i) => {
      i.forEach((a) => {
        a.type === "attributes" && a.attributeName === "data-auth-ready" && document.body.dataset.authReady === "true" && !t && (t = !0, e.timers.login && (clearTimeout(e.timers.login), delete e.timers.login), n.disconnect(), s({ method: "mutation-observer", data: {} }));
      });
    });
    n.observe(document.body, { attributes: !0, attributeFilter: ["data-auth-ready"] }), e.cleanupManager.addObserver(n);
  }).then((s) => {
    e._resolved = !0, e._resolvedAt = Date.now(), e._resolveMethod = s.method, e._observing = !1, Et("info", `LOGIN BEM-SUCEDIDO (via ${s.method})`), e.addTrace("login:success", { method: s.method, user: s.data ? s.data.user : null }), e.timers.loginDelay = setTimeout(() => {
      e.iniciarDashboard();
    }, 500);
  });
};
De.prototype.getMetrics = function() {
  return { observing: this._observing, resolved: this._resolved, startedAt: this._startedAt, resolvedAt: this._resolvedAt, resolveMethod: this._resolveMethod, duration: this._startedAt ? (this._resolvedAt || Date.now()) - this._startedAt : null };
};
De.prototype.healthCheck = function() {
  const e = { hasEventBus: !!this.eventBus, hasCleanupManager: !!this.cleanupManager, hasConfig: !!this.config, notStale: !this._observing || Date.now() - this._startedAt < 6e4, hasLogger: !!Vt("logger"), portsInitialized: ze.isInitialized() }, t = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
  return { status: t === o ? "HEALTHY" : t >= 4 ? "DEGRADED" : "UNHEALTHY", score: t, maxScore: o, scoreDisplay: `${t}/${o}`, checks: e, observing: this._observing, resolved: this._resolved, resolveMethod: this._resolveMethod, portsInitialized: ze.isInitialized(), version: zt, moduleId: fe, timestamp: Date.now() };
};
De.prototype.info = function() {
  return { version: zt, moduleId: fe, observing: this._observing, resolved: this._resolved, resolveMethod: this._resolveMethod, portsInitialized: ze.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
De.prototype.getVersion = () => zt;
const Do = "preloader-auth-decision", ct = typeof window < "u", Dr = typeof document < "u", So = I({ moduleId: Do });
function Dt() {
  So.init();
}
function Fe(e) {
  return So.get(e);
}
const m = { checkCount: 0, sessionManagerChecks: 0, globalStateChecks: 0, fallbackChecks: 0, successCount: 0, failureCount: 0, eventReceived: null, lastCheckAt: null, pollChecks: 0, resolvedBy: null }, l = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = Fe("logger");
  if (!o) return;
  const s = `[${Do}]`;
  if (e === "error") {
    o.error && o.error(s, t.join(" "));
    return;
  }
  if (e === "warn") {
    o.warn && o.warn(s, t.join(" "));
    return;
  }
  if (e === "info") {
    o.info && o.info(s, t.join(" "));
    return;
  }
  o.debug && o.debug(s, t.join(" "));
}, Sr = ["auth-boot", "auth-boot-restore", "bootstrap-v2", "bootstrap-v2-restore", "bootstrap-v2-recovery", "bootstrap-v2-post-login"];
function Me(e) {
  return Sr.indexOf(e) !== -1;
}
function Mo() {
  if (!ct) return null;
  m.sessionManagerChecks++;
  const e = Fe("sessionManager"), t = e && e.isAuthenticated ? e.isAuthenticated() : void 0, o = e && e.getUser ? e.getUser() : void 0;
  return l("info", `[SESSION-MANAGER] isAuthenticated()=${t}, hasUser=${!!o}`), t === !0 && o ? (l("info", "[SESSION-MANAGER] DECIDIDO: authenticated=true"), { decided: !0, authenticated: !0, source: "SessionManager", user: o }) : null;
}
function Co() {
  if (!ct) return null;
  m.globalStateChecks++;
  const e = Fe("globalState"), t = e && e.isAuthenticated ? e.isAuthenticated() : void 0;
  return l("info", `[GLOBAL-STATE] isAuthenticated()=${t}`), t === !0 ? (l("info", "[GLOBAL-STATE] DECIDIDO: authenticated=true"), { decided: !0, authenticated: !0, source: "GlobalState" }) : null;
}
function Mr() {
  if (!ct) return Promise.resolve(null);
  m.fallbackChecks++, l("info", "[FALLBACK] Chamando SessionManager.checkSession()...");
  const e = Fe("sessionManager");
  return !e || !e.checkSession ? (l("info", "[FALLBACK] SessionManager.checkSession nao disponivel"), Promise.resolve(null)) : e.checkSession().then((t) => (l("info", "[FALLBACK] checkSession() RESULTADO:", { ok: t ? t.ok : null, authenticated: t ? t.authenticated : null, hasUser: !!(t && t.user) }), t && t.ok && t.authenticated && t.user ? (l("info", "[FALLBACK] Backend confirmou autenticacao!"), m.successCount++, { decided: !0, authenticated: !0, user: t.user, source: "fallback-checkSession" }) : (l("info", "[FALLBACK] Backend retornou nao autenticado"), m.failureCount++, { decided: !0, authenticated: !1, source: "fallback-checkSession-negative" }))).catch((t) => (l("error", "[FALLBACK] Erro:", t.message), m.failureCount++, { decided: !0, authenticated: !1, source: "fallback-error", error: t.message }));
}
function Cr() {
  return l("info", "Verificando sinais imediatos (SessionManager/GlobalState)..."), Dt(), Mo() || Co();
}
function wr(e = 1e4) {
  m.checkCount++, m.lastCheckAt = Date.now(), Dt(), l("info", `waitForAuthDecision() iniciado (timeout=${e}ms)`), l("info", `[MONITOR] Aguardando AUTH_EVENTS.READY = ${M.READY}`);
  const t = Cr();
  return t ? (l("info", `DECISAO IMEDIATA: authenticated=${t.authenticated}, source=${t.source}`), t.authenticated ? m.successCount++ : m.failureCount++, m.resolvedBy = "immediate", Promise.resolve(t)) : (l("info", "Nenhum sinal imediato - AGUARDANDO EVENTOS + POLLING do bootstrap-v2..."), !ct || !Dr ? Promise.resolve({ decided: !0, authenticated: !1, source: "no-environment" }) : new Promise((o) => {
    let s = !1;
    const r = Fe("eventBus");
    function n() {
      s || (s = !0, document.removeEventListener(M.READY, h), document.removeEventListener(M.LOGIN_SUCCESS, v), r && r.off && (r.off(M.READY, B), r.off(Ht.LOGIN, q), r.off(M.LOGIN_SUCCESS, N)), clearTimeout(Ro), clearInterval(a));
    }
    function i(d) {
      s || (n(), l("info", `DECISAO FINAL: authenticated=${d.authenticated}, source=${d.source}`), m.eventReceived = d.source, d.authenticated ? m.successCount++ : m.failureCount++, o(d));
    }
    const a = setInterval(() => {
      if (s) return;
      m.pollChecks++, Dt();
      const d = Mo() || Co();
      d && (l("info", `[POLL] Detectado via polling (check #${m.pollChecks}): authenticated=${d.authenticated}`), m.resolvedBy = "poll", i(d));
    }, 500);
    function h(d) {
      l("info", "[DOM] AUTH_READY recebido!", d.detail);
      const K = d.detail ? d.detail.source : null;
      Me(K) ? (l("info", `[DOM] AUTH_READY ACEITO de ${K}`), m.resolvedBy = "dom-event", i({ decided: !0, authenticated: !0, user: d.detail ? d.detail.user : null, source: `dom-${K}` })) : l("info", `[DOM] AUTH_READY IGNORADO - source nao confiavel: ${K}`);
    }
    function v(d) {
      l("info", "[DOM] LOGIN_SUCCESS recebido!", d.detail);
      const K = d.detail ? d.detail.source : null;
      Me(K) && (l("info", `[DOM] LOGIN_SUCCESS ACEITO de ${K}`), m.resolvedBy = "dom-login-event", i({ decided: !0, authenticated: !0, user: d.detail ? d.detail.user : null, source: `dom-login-${K}` }));
    }
    function B(d) {
      if (l("info", `[EVENTBUS] AUTH_READY recebido! source=${d ? d.source : null}`), !Me(d ? d.source : null)) {
        l("info", "[EVENTBUS] AUTH_READY IGNORADO");
        return;
      }
      l("info", `[EVENTBUS] AUTH_READY ACEITO de ${d.source}`), m.resolvedBy = "eventbus", i({ decided: !0, authenticated: !0, user: d ? d.user : null, source: `eventbus-${d.source}` });
    }
    function q(d) {
      if (l("info", `[EVENTBUS] LOGIN_REQUIRED recebido! source=${d ? d.source : null}`), !Me(d ? d.source : null)) {
        l("info", "[EVENTBUS] LOGIN_REQUIRED IGNORADO");
        return;
      }
      l("info", `[EVENTBUS] LOGIN_REQUIRED ACEITO de ${d.source}`), m.resolvedBy = "eventbus-login-required", i({ decided: !0, authenticated: !1, reason: d ? d.reason : null, source: `eventbus-${d.source}` });
    }
    function N(d) {
      if (l("info", `[EVENTBUS] LOGIN_SUCCESS recebido! source=${d ? d.source : null}`), !Me(d ? d.source : null)) {
        l("info", "[EVENTBUS] LOGIN_SUCCESS IGNORADO");
        return;
      }
      l("info", `[EVENTBUS] LOGIN_SUCCESS ACEITO de ${d.source}`), m.resolvedBy = "eventbus-login-success", i({ decided: !0, authenticated: !0, user: d ? d.user : null, source: `eventbus-${d.source}` });
    }
    document.addEventListener(M.READY, h, { once: !0 }), document.addEventListener(M.LOGIN_SUCCESS, v, { once: !0 }), r && r.on ? (l("info", "[MONITOR] Registrando listeners no EventBus..."), r.on(M.READY, B), r.on(Ht.LOGIN, q), r.on(M.LOGIN_SUCCESS, N)) : l("info", "[MONITOR] EventBus nao disponivel - funcionando com POLLING + DOM events");
    const Ro = setTimeout(() => {
      s || (l("info", `[TIMEOUT] ${e}ms esgotado - NENHUM EVENTO/POLL RESOLVEU!`), l("info", "[TIMEOUT] Iniciando FALLBACK SessionManager.checkSession()..."), Mr().then((d) => {
        s || (d && d.authenticated === !0 ? (l("info", "[TIMEOUT->FALLBACK] Backend confirmou autenticacao!"), m.resolvedBy = "timeout-fallback", i(d)) : (l("info", "[TIMEOUT->FALLBACK] Nao autenticado"), m.resolvedBy = "timeout", i(d || { decided: !0, authenticated: !1, reason: "timeout-no-events", source: "timeout" })));
      }));
    }, e);
  }));
}
const ht = "3.9.0-BOOTSTRAP-FORCE-INFO", re = "preloader-boot-manager", ft = typeof window < "u", wo = typeof document < "u", Ve = I({ moduleId: re });
function Rr() {
  Ve.init();
}
function gt(e) {
  return Ve.get(e);
}
const Pr = () => {
  const e = gt("config");
  return ft && e && e.app && e.app.debug === !0;
}, c = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), o = gt("logger");
  if (o) {
    if (e === "error") {
      o.error && o.error(`[${re}]`, t.join(" "));
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(`[${re}]`, t.join(" "));
      return;
    }
    if (e === "info") {
      o.info && o.info(`[${re}]`, t.join(" "));
      return;
    }
    Pr() && o.debug && o.debug(`[${re}]`, t.join(" "));
  }
};
function Lr(e) {
  if (!wo) return;
  const t = gt("globalState");
  if (t && t.dispatch)
    try {
      t.dispatch({ type: "SET_APP_STATE", payload: e }), c("info", "GlobalState.dispatch SET_APP_STATE:", e);
    } catch (o) {
      c("warn", "GlobalState dispatch failed:", o.message);
    }
  document.body && (document.body.dataset.state = e, c("debug", "body.dataset.state legacy sync:", e));
}
const J = Object.freeze({
  AUTH_TIMEOUT: "auth-timeout",
  COMPONENTS_TIMEOUT: "components-timeout",
  MONITOR_INACTIVE: "monitor-inactive",
  MAX_RETRIES: "max-retries",
  FORCED_FINALIZE: "forced-finalize",
  UNKNOWN: "unknown"
}), T = {
  _bootstrapControlled: !1,
  _decisions: {},
  setBootstrapControlled(e) {
    this._bootstrapControlled = e === !0, c("info", `BootstrapBridge: controlled=${this._bootstrapControlled}`);
  },
  isBootstrapControlled() {
    return this._bootstrapControlled;
  },
  setDecision(e, t) {
    this._decisions[e] = { value: t, timestamp: Date.now(), source: "bootstrap" }, c("info", `BootstrapBridge: decision ${e}=${t}`);
  },
  getDecision(e) {
    const t = this._decisions[e];
    return t ? t.value : null;
  },
  hasDecision(e) {
    return this._decisions.hasOwnProperty(e);
  },
  getDecisions() {
    return Object.assign({}, this._decisions);
  },
  reset() {
    this._decisions = {};
  },
  info() {
    return {
      controlled: this._bootstrapControlled,
      decisions: Object.keys(this._decisions),
      decisionCount: Object.keys(this._decisions).length
    };
  }
};
function b(e) {
  this.system = e, this.componentsReadyBuffer = null, this.componentsReadyBufferConsumed = !1, this.componentsReadyReceived = !1, this.componentsReadyProcessed = !1, this.componentsReadyTimeoutRetries = 0, this.finalizeCalled = !1, this.forceMode = !1, this.authDecision = null, this._bootCount = 0, this._lastBootAt = null, this._errors = [], this._degradedMode = !1, this._degradedReason = null, this._degradedAt = null, this._degradedCount = 0, this._decisionsUsed = { bootstrap: 0, default: 0 }, this._authGraceTimer = null, this._authGraceAttempts = 0, Rr();
}
b.prototype._decide = function(e, t, o) {
  const s = T.getDecision(e);
  return s !== null ? (this._decisionsUsed.bootstrap++, c("debug", `Decision ${e}: using Bootstrap value=${s}`), s) : (this._decisionsUsed.default++, c("debug", `Decision ${e}: using default value=${t}`), t);
};
b.prototype._decideShouldLoadVideo = function(e) {
  if (T.hasDecision("shouldLoadVideo"))
    return this._decide("shouldLoadVideo", !0);
  if (!ft || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return !1;
  const t = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return t && t.saveData || t && t.effectiveType && ["slow-2g", "2g"].indexOf(t.effectiveType) !== -1 ? !1 : (this._decisionsUsed.default++, !0);
};
b.prototype._decidePodeShowDashboard = function(e, t, o) {
  if (T.hasDecision("shouldShowDashboard"))
    return this._decide("shouldShowDashboard", !1);
  const s = this.system.progressMonitor !== null, r = this.system.state.progressoAtual >= 100, n = e.temSessaoValida && (o || t === g.LOADING || this.componentsReadyReceived) && (o || s && r || this.componentsReadyReceived);
  return this._decisionsUsed.default++, n;
};
b.prototype._enterDegradedMode = function(e, t) {
  const o = this;
  if (o._degradedMode && o._degradedReason === e) {
    t && o.system.degradedUI.showMessage(t, o.system.$screen, o.system.addTrace.bind(o.system));
    return;
  }
  o._degradedMode = !0, o._degradedReason = e, o._degradedAt = Date.now(), o._degradedCount++, c("warn", `⚠️ ENTERING DEGRADED MODE: ${e}`), o.system.addTrace("degraded:enter", { reason: e, count: o._degradedCount, timestamp: o._degradedAt }), o.system.modeManager && typeof o.system.modeManager.setDegraded == "function" && o.system.modeManager.setDegraded(), o.system.emit(X.DEGRADED || "preloader:degraded", { bootId: o.system.bootId, reason: e, count: o._degradedCount, timestamp: o._degradedAt }), t && o.system.degradedUI.showMessage(t, o.system.$screen, o.system.addTrace.bind(o.system)), o._trackDegradedMode(e);
};
b.prototype._exitDegradedMode = function() {
  const e = this;
  if (!e._degradedMode) return;
  const t = Date.now() - e._degradedAt;
  c("info", `✅ EXITING DEGRADED MODE after ${t}ms`), e.system.addTrace("degraded:exit", { reason: e._degradedReason, duration: t }), e._degradedMode = !1;
};
b.prototype._trackDegradedMode = function(e) {
  if (ft)
    try {
      const t = JSON.parse(localStorage.getItem("boot-degraded-history") || "[]");
      t.push({ bootId: this.system.bootId, reason: e, timestamp: (/* @__PURE__ */ new Date()).toISOString(), retries: this.componentsReadyTimeoutRetries }), localStorage.setItem("boot-degraded-history", JSON.stringify(t.slice(-10)));
    } catch (t) {
      c("warn", "Erro ao salvar histórico de degradação:", t.message);
    }
};
b.prototype.isDegraded = function() {
  return this._degradedMode;
};
b.prototype.getDegradedInfo = function() {
  return { degraded: this._degradedMode, reason: this._degradedReason, since: this._degradedAt, duration: this._degradedAt ? Date.now() - this._degradedAt : null, count: this._degradedCount };
};
b.prototype.startBoot = function() {
  const e = this, t = e.system.config, o = e.system.state, s = e.system.timers;
  e._bootCount++, e._lastBootAt = Date.now(), c("info", `===== BOOT INICIADO ${ht} =====`), c("info", `BootstrapBridge controlled: ${T.isBootstrapControlled()}`), e.system.addTrace("init:start", { bootstrapControlled: T.isBootstrapControlled() }), e.system.show(), e.system.registrarListeners();
  const r = this._decide("timeoutGlobal", t.timeoutGlobal);
  s.global = setTimeout(() => {
    c("warn", `TIMEOUT GLOBAL (${r}ms) - FORCANDO FINALIZACAO`), e.system.addTrace("timeout:global:force"), e.forceMode = !0, o.enableForceMode(), e._enterDegradedMode(J.FORCED_FINALIZE, "degraded"), e.system.finalizar("timeout-global-forced", !0);
  }, r);
  const n = wo ? document.querySelector("#loading-video") : null, i = n && n.dataset.controlledBy, h = !i && e._decideShouldLoadVideo(t) ? Oo(t.timeoutVideo) : Promise.resolve({ loaded: !1, reason: i ? "external-control" : "network-policy" });
  return Promise.all([h, wr(1e4)]).then((v) => {
    const B = v[0], q = v[1];
    e.authDecision = q, o.setVideoCarregado(B.loaded !== !1);
    const N = q.authenticated === !0;
    o.setSessao(!0, N), c("info", `Auth: authenticated=${N}, source=${q.source}`), B.loaded ? e.system.emit(X.VIDEO_LOADED, { bootId: e.system.bootId, timestamp: Date.now() }) : e.system.emit(X.VIDEO_ERROR, { bootId: e.system.bootId, reason: B.reason || "unknown", timestamp: Date.now() }), e.system.addTrace("session:checked", { verified: !0, valid: N, source: q.source }), N && e._authGraceTimer && (clearTimeout(e._authGraceTimer), e._authGraceTimer = null, c("info", "Auth resolvido durante grace period - re-tentando finalizar"), e.finalizar("auth-grace-resolved")), e.decidirProximaFase();
  }).catch((v) => {
    e._errors.push({ error: v.message, timestamp: Date.now() }), c("error", "Erro na inicializacao:", v), e.system.addTrace("init:error", { error: v.message }), e.system.emit(ot.ERROR, { bootId: e.system.bootId, componentName: "preloader", error: v.message, phase: o.fase, timestamp: Date.now() }), e.decidirProximaFase();
  });
};
b.prototype.decidirProximaFase = function() {
  const e = this;
  e.system.config;
  const t = e.system.state, o = e.authDecision || { authenticated: t.getStatus().temSessaoValida }, s = o.authenticated === !0;
  if (c("info", `Decidindo fase: authenticated=${s}, source=${o.source || "state"}`), e.system.addTrace("decide:phase", { authenticated: s, source: o.source }), T.hasDecision("nextPhase")) {
    const r = T.getDecision("nextPhase");
    c("info", `Using Bootstrap decision for nextPhase: ${r}`), r === "dashboard" ? e.iniciarDashboard() : r === "waitAuth" && e._startAuthObserver();
    return;
  }
  s ? (c("info", "Autenticado - iniciando dashboard"), e.system.emit(M.SESSION_CHECKED, { bootId: e.system.bootId, authenticated: !0, phase: t.fase, source: o.source, timestamp: Date.now() }), e.system.addTrace("authenticated"), e.iniciarDashboard()) : (c("info", "Nao autenticado - aguardando login"), e.system.addTrace("login:required:observed"), e._startAuthObserver());
};
b.prototype._startAuthObserver = function() {
  const e = this, t = e.system.config;
  new De({ eventBus: e.system.eventBus, cleanupManager: e.system.cleanupManager, timers: e.system.timers, config: t, addTrace: e.system.addTrace.bind(e.system), transitionPhase: e.system.transitionPhase.bind(e.system), iniciarDashboard() {
    e.iniciarDashboard();
  } }).observe();
};
b.prototype.iniciarDashboard = function() {
  const e = this, t = e.system.config, o = e.system.state, s = e.system.timers;
  c("info", "===== CARREGANDO DASHBOARD ====="), e.system.transitionPhase(g.LOADING, e.forceMode), Lr("loading-dashboard"), e.system.addTrace("dashboard:loading"), e.system.progressMonitor = new V(o), e.system.progressMonitor.start(t.pollInterval), e.componentsReadyBuffer && !e.componentsReadyBufferConsumed && !e.componentsReadyProcessed && (c("info", "Processando components:ready bufferizado"), e.componentsReadyBufferConsumed = !0, e.componentsReadyProcessed = !0, e.system.progressMonitor.updateUI(100), s.finalizeBuffered = setTimeout(() => {
    e.system.finalizar("components-ready-buffered");
  }, t.hideDelayMs), e.componentsReadyBuffer = null);
};
b.prototype.scheduleComponentsReadyTimeout = function(e) {
  const t = this, o = t.system.config, s = t.system.timers, r = t.system.state;
  if (e && (t.componentsReadyTimeoutRetries++, t.componentsReadyTimeoutRetries >= o.timeoutComponentsReadyMax)) {
    c("warn", `Maximo de retries atingido (${o.timeoutComponentsReadyMax})`), t._enterDegradedMode(J.MAX_RETRIES, "waiting-components"), setTimeout(() => {
      t.system.finalizar("max-retries-forced", !0);
    }, 3e3);
    return;
  }
  const n = this._decide("componentsTimeout", o.timeoutComponentsReady), i = e ? o.timeoutComponentsReadyBackoff * t.componentsReadyTimeoutRetries : n;
  s.componentsReady = setTimeout(() => {
    if (t.componentsReadyReceived) return;
    const a = r.getStatus(), h = t.system.progressMonitor !== null;
    if (!a.temSessaoValida) {
      c("warn", "components:ready timeout - nao autenticado"), t._enterDegradedMode(J.AUTH_TIMEOUT, "waiting-auth"), t.scheduleComponentsReadyTimeout(!0);
      return;
    }
    if (!h) {
      c("warn", "components:ready timeout - monitor inativo"), t._enterDegradedMode(J.MONITOR_INACTIVE, "waiting-monitor"), t.scheduleComponentsReadyTimeout(!0);
      return;
    }
    c("warn", `components:ready timeout (${i}ms)`), t._enterDegradedMode(J.COMPONENTS_TIMEOUT, "degraded"), t.system.finalizar("components-ready-timeout");
  }, i);
};
b.prototype.handleComponentsReady = function(e) {
  const t = this, o = t.system.config, s = t.system.timers;
  if (!t.componentsReadyProcessed) {
    if (t.componentsReadyReceived = !0, s.componentsReady && (clearTimeout(s.componentsReady), delete s.componentsReady), c("info", "components:ready recebido!"), t.system.addTrace("components:ready:received", e.detail), t._degradedMode && t._exitDegradedMode(), !t.system.progressMonitor && !t.componentsReadyBufferConsumed) {
      c("info", "Buffering components:ready"), t.componentsReadyBuffer = e.detail;
      return;
    }
    t.componentsReadyProcessed = !0, t.system.progressMonitor && t.system.progressMonitor.updateUI(100), s.finalize = setTimeout(() => {
      t.system.finalizar("components-ready");
    }, o.hideDelayMs);
  }
};
b.prototype.finalizar = function(e, t) {
  const o = this;
  e = e || "normal", o.system.config;
  const s = o.system.state;
  if (o.system.timers, !t && !o.system.allowFinalize) {
    o.system.addTrace("finalize:blocked", { motivo: e });
    return;
  }
  if (!t && o.finalizeCalled || !t && o.system.finalizing || !t && s.fase === g.VISIBLE) return;
  const r = s.fase, n = s.getStatus(), i = o._decidePodeShowDashboard(n, r, t);
  if (!t && !i && e !== "debug-force") {
    if (!n.temSessaoValida && !o._authGraceTimer && o._authGraceAttempts < 2) {
      o._authGraceAttempts++, c("info", `finalizar() - auth pendente, grace period 2s (tentativa ${o._authGraceAttempts})`), o.system.addTrace("finalize:auth-grace", { motivo: e, attempt: o._authGraceAttempts }), o._authGraceTimer = setTimeout(() => {
        o._authGraceTimer = null, c("info", "Grace period expirado - re-tentando finalizar"), o.finalizar(e);
      }, 2e3);
      return;
    }
    c("warn", "finalizar() - condicoes nao satisfeitas"), o.system.addTrace("finalize:deferred", { motivo: e, fase: r, validSession: n.temSessaoValida, progress: s.progressoAtual }), n.temSessaoValida ? o.system.progressMonitor ? o._enterDegradedMode(J.UNKNOWN, "degraded") : o._enterDegradedMode(J.MONITOR_INACTIVE, "waiting-monitor") : o._enterDegradedMode(J.AUTH_TIMEOUT, "waiting-auth");
    return;
  }
  o._authGraceTimer && (clearTimeout(o._authGraceTimer), o._authGraceTimer = null), o.finalizeCalled = !0;
  const a = s.getBootDuration();
  c("info", `===== FINALIZANDO BOOT ${t ? "(FORCADO)" : ""} =====`), c("info", `Tempo: ${a}ms | Motivo: ${e} | Degraded: ${o._degradedMode}`), c("info", `Decisões: Bootstrap=${o._decisionsUsed.bootstrap} Default=${o._decisionsUsed.default}`), o.system.addTrace("finalize:start", { motivo: e, duration: a, fase: r, forced: t, degraded: o._degradedMode, degradedReason: o._degradedReason, decisionsUsed: Object.assign({}, o._decisionsUsed) }), o.system.transitionPhase(g.FINALIZING, t), o.system.progressMonitor && o.system.progressMonitor.stop(), o._saveTelemetry(a, e, t), o.system.hide(() => {
    if (t) {
      if (n.temSessaoValida)
        Yt(), o.system.transitionPhase(g.VISIBLE, !0), o.system.addTrace("dashboard:visible:forced");
      else {
        const h = T.isBootstrapControlled();
        c(h ? "info" : "warn", `Force mode: aguardando autenticacao (bootstrap-managed=${h})`), o.system.addTrace("preloader:hidden:waiting-auth", { bootstrapManaged: h });
      }
      o.system.emit(ot.ALL_READY, { bootId: o.system.bootId, durationMs: a, motivo: e, forced: !0, authenticated: n.temSessaoValida, phase: n.temSessaoValida ? g.VISIBLE : g.WAIT_AUTH, degraded: o._degradedMode, degradedReason: o._degradedReason, decisionsUsed: Object.assign({}, o._decisionsUsed), timestamp: Date.now() });
    } else i ? (Yt(), o.system.transitionPhase(g.VISIBLE, !1), o.system.addTrace("dashboard:visible"), o.system.emit(ot.ALL_READY, { bootId: o.system.bootId, durationMs: a, motivo: e, forced: !1, phase: g.VISIBLE, degraded: o._degradedMode, degradedReason: o._degradedReason, decisionsUsed: Object.assign({}, o._decisionsUsed), timestamp: Date.now() })) : (c("warn", "Dashboard NAO exibido - aguardando condicoes"), o.system.addTrace("dashboard:deferred", { motivo: e, reason: "waiting-conditions" }));
  });
};
b.prototype._saveTelemetry = function(e, t, o) {
  if (!ft) return;
  const s = this;
  try {
    const r = { bootId: s.system.bootId, schema: s.system.config.telemetrySchema, duration: e, motivo: t, forced: o, progressoFinal: s.system.state.progressoAtual, degraded: s._degradedMode, degradedReason: s._degradedReason, degradedCount: s._degradedCount, decisionsUsed: Object.assign({}, s._decisionsUsed), bootstrapControlled: T.isBootstrapControlled(), timestamp: (/* @__PURE__ */ new Date()).toISOString(), bootTrace: s.system.bootTrace.slice(-50), performanceMarks: s.system.getPerformanceMarks() }, n = JSON.parse(localStorage.getItem("boot-telemetry-history") || "[]");
    n.push(r), localStorage.setItem("boot-telemetry-history", JSON.stringify(n.slice(-5))), localStorage.setItem("boot-telemetry", JSON.stringify(r));
  } catch (r) {
    c("warn", "Erro telemetria:", r);
  }
};
b.prototype._shouldLoadVideo = function(e) {
  return this._decideShouldLoadVideo(e);
};
b.prototype.reset = function() {
  this._authGraceTimer && (clearTimeout(this._authGraceTimer), this._authGraceTimer = null), this.componentsReadyBuffer = null, this.componentsReadyBufferConsumed = !1, this.componentsReadyReceived = !1, this.componentsReadyProcessed = !1, this.componentsReadyTimeoutRetries = 0, this.finalizeCalled = !1, this.forceMode = !1, this.authDecision = null, this._degradedMode = !1, this._degradedReason = null, this._degradedAt = null, this._decisionsUsed = { bootstrap: 0, default: 0 }, this._authGraceAttempts = 0, T.reset();
};
b.prototype.healthCheck = function() {
  const e = !!this.system, t = !this.finalizeCalled || this.forceMode, o = this._errors.length < 5, s = !this._degradedMode, r = { systemAvailable: e, notFinalized: t, lowErrors: o, notDegraded: s, hasLogger: !!gt("logger"), portsInitialized: Ve.isInitialized() }, n = Object.values(r).filter(Boolean).length, i = Object.keys(r).length;
  return { status: n === i ? "HEALTHY" : n >= 3 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: i, scoreDisplay: `${n}/${i}`, checks: r, componentsReadyReceived: this.componentsReadyReceived, componentsReadyProcessed: this.componentsReadyProcessed, retries: this.componentsReadyTimeoutRetries, forceMode: this.forceMode, bootCount: this._bootCount, errorCount: this._errors.length, degraded: this._degradedMode, degradedReason: this._degradedReason, degradedCount: this._degradedCount, decisionsUsed: Object.assign({}, this._decisionsUsed), bootstrapBridge: T.info(), version: ht, moduleId: re, portsInitialized: Ve.isInitialized(), timestamp: Date.now() };
};
b.prototype.info = function() {
  return { version: ht, moduleId: re, healthCheck: this.healthCheck(), bootCount: this._bootCount, lastBootAt: this._lastBootAt, componentsReady: { received: this.componentsReadyReceived, processed: this.componentsReadyProcessed, buffered: !!this.componentsReadyBuffer }, retries: this.componentsReadyTimeoutRetries, finalizeCalled: this.finalizeCalled, forceMode: this.forceMode, authDecision: this.authDecision, degradedInfo: this.getDegradedInfo(), decisionsUsed: Object.assign({}, this._decisionsUsed), bootstrapBridge: T.info(), portsInitialized: Ve.isInitialized(), errors: this._errors.slice(-5) };
};
b.prototype.getVersion = () => ht;
b.prototype.getBootstrapBridge = () => T;
const $r = "preloader.telemetry.tracer";
I({ moduleId: $r });
const Br = 100;
class Nr {
  constructor(t, o = Br) {
    this.bootId = t, this.bootStartTs = Date.now(), this.maxEntries = o, this.trace = [];
  }
  add(t, o = null) {
    const s = { action: t, data: o, timestamp: Date.now(), elapsed: Date.now() - this.bootStartTs };
    return this.trace.push(s), this.trace.length > this.maxEntries && this.trace.shift(), s;
  }
  getTrace() {
    return [...this.trace];
  }
  getRecent(t = 10) {
    return this.trace.slice(-t);
  }
  clear() {
    this.trace = [];
  }
  getPerformanceMarks() {
    if (typeof performance > "u") return {};
    const t = {};
    return performance.getEntriesByType("measure").forEach((o) => {
      o.name.startsWith("preloader:") && (t[o.name] = Math.round(o.duration));
    }), t;
  }
  markStart(t) {
    typeof performance < "u" && performance.mark(`preloader:${t}:start`);
  }
  markEnd(t) {
    if (typeof performance < "u") {
      performance.mark(`preloader:${t}:end`);
      try {
        performance.measure(`preloader:${t}`, `preloader:${t}:start`, `preloader:${t}:end`);
      } catch {
      }
    }
  }
  getDuration() {
    return Date.now() - this.bootStartTs;
  }
  getStatus() {
    return { bootId: this.bootId, entries: this.trace.length, maxEntries: this.maxEntries, durationMs: this.getDuration() };
  }
}
function kr(e, t) {
  return new Nr(e, t);
}
const Ur = "preloader.telemetry.metrics";
I({ moduleId: Ur });
class zr {
  constructor() {
    this.reset();
  }
  reset() {
    this._metrics = { initCount: 0, mountCount: 0, hideCount: 0, cleanupCount: 0, lastInitAt: null, lastMountAt: null, lastHideAt: null, lastCleanupAt: null };
  }
  recordInit() {
    this._metrics.initCount++, this._metrics.lastInitAt = Date.now();
  }
  recordMount() {
    this._metrics.mountCount++, this._metrics.lastMountAt = Date.now();
  }
  recordHide() {
    this._metrics.hideCount++, this._metrics.lastHideAt = Date.now();
  }
  recordCleanup() {
    this._metrics.cleanupCount++, this._metrics.lastCleanupAt = Date.now();
  }
  get() {
    return { ...this._metrics };
  }
  getStatus() {
    return { ...this._metrics, uptime: this._metrics.lastInitAt ? Date.now() - this._metrics.lastInitAt : 0 };
  }
}
function Vr() {
  return new zr();
}
const Ye = "9.9.2-P2-ENTERPRISE", H = "preloader-system", tt = Bo(H), Gt = "__PRELOADER_MANAGED_BY_BOOTSTRAP__", Y = () => typeof window < "u" && window[Gt] === !0, Gr = (e = !0) => {
  typeof window < "u" && (window[Gt] = e);
}, Zr = () => ({
  flag: Gt,
  managed: Y(),
  autoInitSkipped: Y(),
  timestamp: Date.now()
}), Hr = (e, t, o, s) => {
  const r = [];
  return X || r.push("PRELOADER_EVENTS not available"), ot || r.push("COMPONENT_EVENTS not available"), M || r.push("AUTH_EVENTS not available"), ge || r.push("BOOT_EVENTS not available"), { valid: r.length === 0, issues: r, timestamp: Date.now() };
}, j = I({ moduleId: H }), jr = () => j.init(), ne = (e) => j.get(e), Jr = (e) => j.inject(e), Xr = () => j.snapshot(), oe = {
  info: (e, t = {}) => {
    var o;
    const s = ne("logger");
    (o = s == null ? void 0 : s.info) == null || o.call(s, e, { component: H, ...t });
  },
  warn: (e, t = {}) => {
    var o;
    const s = ne("logger");
    (o = s == null ? void 0 : s.warn) == null || o.call(s, e, { component: H, ...t });
  },
  error: (e, t = {}) => {
    var o;
    const s = ne("logger");
    (o = s == null ? void 0 : s.error) == null || o.call(s, e, { component: H, ...t });
  },
  debug: (e, t = {}) => {
    var o;
    const s = ne("logger");
    (o = s == null ? void 0 : s.debug) == null || o.call(s, e, { component: H, ...t });
  }
}, p = function(e = {}) {
  if (this.config = Fo(e), this.bootStartTs = Date.now(), this.bootId = `boot_${this.bootStartTs}`, typeof window < "u")
    if (!nt())
      window.__BOOT_ID__ = this.bootId;
    else {
      const t = this.bootId;
      Object.defineProperty(window, "__BOOT_ID__", {
        get() {
          return At("WINDOW_ACCESS", { module: H, property: "__BOOT_ID__", access: "global-access" }), t;
        },
        configurable: !0
      });
    }
  if (this.modeManager = Jo(), this.state = new S(), this.cleanupManager = new W(), this.degradedUI = new de(), this.bootManager = new b(this), this.tracer = kr(this.bootId, this.config.maxTraceEntries), this.metrics = Vr(), this.mounted = !1, this.showing = !1, this.finalizing = !1, this.allowFinalize = !0, this.destroyed = !1, this.$screen = null, this.$bar = null, this.$label = null, this.$injectedScreen = null, this.containerEl = null, this.mountSource = "none", this.domManagerAAA = null, this.bootExecutorAAA = null, this.progressMonitor = null, this._authReadyCleanup = null, jr(), this.eventBus = ne("eventBus"), this.timers = {}, this.abortController = null, this.routerGlobalCleanup = null, this.orchestratorCleanups = [], this.globalStateCleanups = [], this.orchestratorState = { initialized: !1, preset: null }, this._integrationsStatus = { globalStateConnected: !1, orchestratorConnected: !1, routerGlobalConnected: !1 }, this._componentsReadyCleanup = null, this._bridgeUsed = !1, this.contractsValid = !0, this._initSource = Y() ? "bootstrap" : "auto", this.eventBus) {
    const t = Hr(this.eventBus, this.bootId, this.emit.bind(this), this.config.debug);
    this.contractsValid = t.valid;
  }
  this.system = this, oe.info("PreloaderSystem created", { version: Ye, bootId: this.bootId, useAAAMode: this.config.useAAAMode, initSource: this._initSource });
};
p.prototype.mount = function() {
  return sr(this);
};
p.prototype.show = function() {
  return ir(this);
};
p.prototype.hide = function(e) {
  return ar(this, e);
};
p.prototype.setProgress = function(e) {
  return dr(this, e);
};
p.prototype.cleanup = function() {
  if (this._componentsReadyCleanup) {
    try {
      this._componentsReadyCleanup();
    } catch {
    }
    this._componentsReadyCleanup = null;
  }
  if (this._authReadyCleanup) {
    try {
      this._authReadyCleanup();
    } catch {
    }
    this._authReadyCleanup = null;
  }
  return _o(this);
};
p.prototype.destroy = function() {
  if (this._componentsReadyCleanup) {
    try {
      this._componentsReadyCleanup();
    } catch {
    }
    this._componentsReadyCleanup = null;
  }
  if (this._authReadyCleanup) {
    try {
      this._authReadyCleanup();
    } catch {
    }
    this._authReadyCleanup = null;
  }
  return ur(this);
};
p.prototype.shutdown = function() {
  return this.destroy();
};
p.prototype.transitionPhase = function(e, t) {
  this.state && typeof this.state.setFase == "function" && this.state.setFase(e, t);
};
Object.defineProperty(p.prototype, "bootTrace", {
  get() {
    return this.tracer ? this.tracer.getTrace() : [];
  },
  configurable: !0
});
p.prototype.getPerformanceMarks = function() {
  return this.tracer ? this.tracer.getPerformanceMarks() : {};
};
p.prototype.init = function() {
  return this.metrics.recordInit(), this.tracer.add("init:start"), this.config.useAAAMode ? this._initAAA() : this._initLegacy();
};
p.prototype._initAAA = function() {
  const e = this, t = Y();
  if (oe.info("Starting boot with AAA executor", { managedByBootstrap: t }), e.eventBus && e.eventBus.on) {
    const o = e.eventBus.on(M.READY, (s) => {
      const r = s && s.authenticated === !0;
      oe.info("AUTH_EVENTS.READY received in _initAAA", { authenticated: r, source: s && s.source }), e.state.setSessao(!0, r), r && e.bootManager._degradedMode && e.bootManager._degradedReason === "auth-timeout" && (oe.info("Auth arrived post-boot - exiting degraded mode"), e.bootManager._exitDegradedMode());
    });
    e._authReadyCleanup = typeof o == "function" ? o : null;
  }
  return e.bootExecutorAAA = hs({ domManager: e.domManagerAAA, modeManager: e.modeManager, eventBus: e.eventBus, telemetry: null }), e.bootExecutorAAA.execute().then((o) => {
    oe.info("AAA boot complete", { result: o.result, exitCode: o.exitCode, duration: o.duration });
    const s = o.authenticated === !0, r = e.state.getStatus().temSessaoValida;
    return e.state.setSessao(!0, s || r), oe.info("AAA auth state", { fromExecutor: s, fromState: r, final: s || r }), t ? e.finalizar("aaa-boot-bootstrap-managed", !0) : o.success ? e.finalizar("aaa-boot-success") : e.finalizar("aaa-boot-failed", !0), o;
  });
};
p.prototype._initLegacy = function() {
  return oe.info("Starting boot with legacy BootManager"), this.bootManager.startBoot();
};
p.prototype.registrarListeners = function() {
  var e;
  this.abortController = new AbortController(), this.bootManager.scheduleComponentsReadyTimeout(!1);
  let t = !1;
  const o = (s) => {
    t || (t = !0, this.bootManager.handleComponentsReady(s));
  };
  if ((e = this.eventBus) != null && e.on) {
    const s = this.eventBus.on(ge.COMPONENTS_READY, o);
    this._componentsReadyCleanup = typeof s == "function" ? s : () => {
      var r, n;
      (n = (r = this.eventBus) == null ? void 0 : r.off) == null || n.call(r, ge.COMPONENTS_READY, o);
    };
  }
  this._bridgeUsed = !0, $o(1e4).then(() => {
    t || o({ detail: { source: "bridge" } });
  });
};
p.prototype.finalizar = function(e = "normal", t = !1) {
  this.bootManager.finalizar(e, t);
};
p.prototype.emit = function(e, t) {
  var o, s;
  (s = (o = this.eventBus) == null ? void 0 : o.emit) == null || s.call(o, e, t);
};
p.prototype.addTrace = function(e, t = null) {
  return this.tracer.add(e, t);
};
p.prototype.notifyAuthReady = function() {
  this.tracer.add("auth:ready:notified"), this.emit(M.READY, { bootId: this.bootId, timestamp: Date.now() });
};
p.prototype.getStatus = function() {
  var e, t, o, s;
  const r = it();
  return {
    version: Ye,
    moduleId: H,
    bootId: this.bootId,
    mounted: this.mounted,
    showing: this.showing,
    destroyed: this.destroyed,
    useAAAMode: this.config.useAAAMode,
    state: this.state.getStatus(),
    modeManager: this.modeManager.getStatus(),
    domManagerAAA: ((t = (e = this.domManagerAAA) == null ? void 0 : e.getStatus) == null ? void 0 : t.call(e)) || null,
    bootExecutorAAA: ((s = (o = this.bootExecutorAAA) == null ? void 0 : o.getStatus) == null ? void 0 : s.call(o)) || null,
    policy: E.getStatus(),
    integrations: this._integrationsStatus,
    metrics: this.metrics.get(),
    trace: this.tracer.getRecent(10),
    portsInitialized: j.isInitialized(),
    p18EventBusOnly: !0,
    bridgeUsed: this._bridgeUsed,
    managedByBootstrap: Y(),
    initSource: this._initSource,
    progressSource: r,
    degradedInfo: this.bootManager.getDegradedInfo(),
    bootstrapBridge: T.info()
  };
};
p.prototype.healthCheck = function() {
  const e = this.state.healthCheck(), t = this.modeManager.healthCheck(), o = E.healthCheck(), s = this.bootManager.healthCheck(), r = ne("logger"), n = it(), i = {
    stateHealthy: e.status === "HEALTHY",
    modeHealthy: t.status === "HEALTHY",
    policyHealthy: o.status === "HEALTHY",
    bootManagerHealthy: s.status === "HEALTHY" || s.status === "DEGRADED",
    notDestroyed: !this.destroyed,
    contractsValid: this.contractsValid,
    portsInitialized: j.isInitialized(),
    loggerAvailable: !!r,
    bootstrapIntegrated: Y() || this._initSource === "bootstrap",
    progressSourceValid: n.source === "bootstrap-v2",
    notDegraded: !this.bootManager.isDegraded()
  }, a = Object.values(i).filter(Boolean).length, h = Object.keys(i).length;
  let v = "HEALTHY";
  return a < h && (a >= 8 || a >= 5 ? v = "DEGRADED" : v = "UNHEALTHY"), this.bootManager.isDegraded() && v === "HEALTHY" && (v = "DEGRADED"), {
    status: v,
    score: `${a}/${h}`,
    moduleId: H,
    version: Ye,
    bootId: this.bootId,
    checks: i,
    subChecks: {
      state: e,
      mode: t,
      policy: o,
      bootManager: s
    },
    portsInitialized: j.isInitialized(),
    p18EventBusOnly: !0,
    bridgeUsed: this._bridgeUsed,
    managedByBootstrap: Y(),
    initSource: this._initSource,
    progressSource: n,
    degradedInfo: this.bootManager.getDegradedInfo(),
    bootstrapBridge: T.info(),
    timestamp: Date.now()
  };
};
p.prototype.info = function() {
  const e = it();
  return {
    version: Ye,
    moduleId: H,
    bootId: this.bootId,
    features: [
      "orchestrator-pure",
      "aaa-integration",
      "modular-lifecycle",
      "telemetry-tracer",
      "P17WI-ports",
      "P18EC-eventbus",
      "boot-ready-bridge",
      "bootstrap-managed-ready",
      "bootstrap-integrated-progress",
      "explicit-degraded-mode",
      "delegable-decisions",
      "bootstrap-auth-trust",
      "missing-members-fix",
      "bridge-sync",
      "early-boot-logger",
      "non-blocking-start"
    ],
    status: this.getStatus(),
    healthCheck: this.healthCheck(),
    portsInitialized: j.isInitialized(),
    p18EventBusOnly: !0,
    bridgeUsed: this._bridgeUsed,
    managedByBootstrap: Y(),
    initSource: this._initSource,
    progressSource: e,
    bootstrapBridge: T.info()
  };
};
p.prototype.injectPorts = function(e) {
  j.inject(e), this.eventBus = ne("eventBus");
};
p.prototype.getPorts = () => j.snapshot();
let R = null;
const Kt = () => R, Zt = () => Y() ? (tt.info("autoInit SKIPPED - managed by Bootstrap-v2"), Promise.resolve(null)) : R ? Promise.resolve(R) : (R = new p({ useAAAMode: !0 }), R.mount(), R.init().then(() => R)), Qr = (e = {}) => R ? (tt.warn("startPreloader called but instance already exists"), Promise.resolve(R)) : (Gr(!0), T.setBootstrapControlled(!0), R = new p({ useAAAMode: !0, ...e }), R._initSource = "bootstrap", R.mount(), tt.info("startPreloader called by Bootstrap-v2 (non-blocking)", { version: Ye }), R.init().catch((t) => {
  tt.error("Preloader init background error", { error: t.message });
}), Promise.resolve(R));
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Zt) : Zt());
typeof window < "u" && (_s(Kt), ys(Kt));
export {
  tn as AUTH_EVENTS,
  on as BOOT_EVENTS,
  C as BOOT_RESULTS,
  T as BootstrapBridge,
  sn as COMPONENT_EVENTS,
  G as EXIT_CODES,
  O as MODES,
  H as MODULE_ID,
  ee as POLICY_PROFILES,
  U as PRELOADER_BOOT_EVENTS,
  rn as PRELOADER_EVENTS,
  E as PreloaderPolicy,
  p as PreloaderSystem,
  P as STATES,
  Ye as VERSION,
  Zt as autoInit,
  p as default,
  Kt as getInstance,
  Zr as getManagedStatus,
  Xr as getPorts,
  Jr as injectPorts,
  Gr as setManagedByBootstrap,
  Qr as startPreloader
};
