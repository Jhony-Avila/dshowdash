import { createUiPorts as d } from "/core/runtime/ports-profiles.js";
import { TICKER_EVENTS as v, AUTH_INTENTS as Ve, AUTH_EVENTS as w } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const ft = "7.3.0-P17WI", ke = "ticker.api.fetch", X = d({ moduleId: ke });
function at(s) {
  return X.get(s);
}
const hi = () => {
  var s;
  const e = at("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, Ke = (s, ...e) => {
  const t = at("logger");
  if (!t || !hi() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${ke}]`, ...e);
};
class ui {
  constructor(e = {}) {
    this.baseURL = e.baseURL || "/api/news", this.timeout = e.timeout || 8e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, lastRequestAt: null };
  }
  async fetchNews(e = null) {
    this._metrics.requestCount++, this._metrics.lastRequestAt = Date.now();
    const t = new AbortController(), i = setTimeout(() => t.abort(), this.timeout), n = e ? this._combineSignals(e, t.signal) : t.signal;
    try {
      const r = `${this.baseURL}/get_ticker_data.php`, o = await fetch(r, { signal: n, headers: { "Content-Type": "application/json" } });
      if (clearTimeout(i), !o.ok) throw new Error(`HTTP ${o.status}`);
      const a = await o.json();
      if (!a.ok || !Array.isArray(a.data)) throw new Error("Invalid response format");
      return this._metrics.successCount++, Ke("debug", `Fetched ${a.data.length} items`), a.data;
    } catch (r) {
      if (clearTimeout(i), r.name === "AbortError")
        throw this._metrics.abortCount++, Ke("debug", "Fetch aborted"), r;
      this._metrics.errorCount++, Ke("error", "Fetch error:", r.message);
      try {
        return await this.fetchNewsOnly(e);
      } catch {
        throw r;
      }
    }
  }
  async fetchNewsOnly(e = null) {
    const t = new AbortController(), i = setTimeout(() => t.abort(), this.timeout), n = e ? this._combineSignals(e, t.signal) : t.signal;
    try {
      const r = `${this.baseURL}/get_news.php`, o = await fetch(r, { signal: n, headers: { "Content-Type": "application/json" } });
      if (clearTimeout(i), !o.ok) throw new Error(`HTTP ${o.status}`);
      const a = await o.json();
      if (!a.ok || !Array.isArray(a.data)) throw new Error("Invalid response format");
      return a.data.map((c) => ({ ...c, type: "news" }));
    } catch (r) {
      throw clearTimeout(i), r;
    }
  }
  _combineSignals(e, t) {
    const i = new AbortController(), n = () => i.abort();
    return e.aborted || t.aborted ? (i.abort(), i.signal) : (e.addEventListener("abort", n, { once: !0 }), t.addEventListener("abort", n, { once: !0 }), i.signal);
  }
  healthCheck() {
    const e = at("logger"), t = { hasEndpoint: !!this.baseURL, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, loggerReady: !!e, portsInitialized: X.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, checks: t, version: ft, moduleId: ke, portsInitialized: X.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ft, moduleId: ke, baseURL: this.baseURL, endpoint: "/get_ticker_data.php", metrics: this._metrics, portsInitialized: X.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, lastRequestAt: null };
  }
  destroy() {
    var e;
    (e = this.resetMetrics) == null || e.call(this);
  }
}
const mt = "5.4.0-P17WI", Ie = "ticker.core.event-bus", Q = d({ moduleId: Ie });
function lt(s) {
  return Q.get(s);
}
const di = () => {
  var s;
  const e = lt("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, M = (s, ...e) => {
  const t = lt("logger");
  if (!t || !di() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${Ie}]`, ...e);
};
class gi {
  constructor() {
    this.events = /* @__PURE__ */ new Map(), this._metrics = { emitCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, lastEmitAt: null };
  }
  on(e, t) {
    this.events.has(e) || this.events.set(e, []), this.events.get(e).push(t), this._metrics.listenerAddCount++, M("debug", `Listener added: ${e}`);
  }
  off(e, t) {
    if (!this.events.has(e)) return;
    const i = this.events.get(e).filter((n) => n !== t);
    this.events.set(e, i), this._metrics.listenerRemoveCount++, M("debug", `Listener removed: ${e}`);
  }
  emit(e, t) {
    this.events.has(e) && (this.events.get(e).forEach((i) => {
      try {
        i(t);
      } catch (n) {
        M("error", `Error in handler for "${e}":`, n);
      }
    }), this._metrics.emitCount++, this._metrics.lastEmitAt = Date.now(), M("debug", `Event emitted: ${e}`));
  }
  destroy() {
    this.events.clear(), M("debug", "EventBus destroyed");
  }
  healthCheck() {
    const e = lt("logger"), t = { eventsMapReady: this.events instanceof Map, loggerReady: !!e, portsInitialized: Q.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 3 ? "HEALTHY" : "DEGRADED", score: `${i}/3`, checks: t, version: mt, moduleId: Ie, portsInitialized: Q.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: mt, moduleId: Ie, eventCount: this.events.size, metrics: this._metrics, portsInitialized: Q.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { emitCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, lastEmitAt: null };
  }
}
const Wt = "6.5.0-P2-ENTERPRISE", qe = "ticker/core/lifecycle", Y = d({ moduleId: qe });
function _i() {
  Y.init();
}
function ct(s) {
  return Y.get(s);
}
const m = Object.freeze({ UNMOUNTED: "unmounted", MOUNTING: "mounting", MOUNTED: "mounted", READY: "ready", PAUSED: "paused", UNMOUNTING: "unmounting" }), fi = () => {
  const s = ct("config");
  return !!(s && s.app && s.app.debug);
}, A = function(s) {
  const e = Array.prototype.slice.call(arguments, 1), t = ct("logger");
  if (!t || !fi() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i.apply(t, [`[${qe}]`].concat(e));
};
function b(s) {
  this.ticker = s, this.state = m.UNMOUNTED, this._metrics = { mountCount: 0, unmountCount: 0, pauseCount: 0, resumeCount: 0, lastTransitionAt: null }, _i();
}
b.prototype.mount = function() {
  return this.state !== m.UNMOUNTED ? (A("warn", `Cannot mount from state: ${this.state}`), Promise.resolve(!1)) : (this._transition(m.MOUNTING), this._transition(m.MOUNTED), this._metrics.mountCount++, Promise.resolve(!0));
};
b.prototype.ready = function() {
  return this.state !== m.MOUNTED ? (A("warn", `Cannot ready from state: ${this.state}`), Promise.resolve(!1)) : (this._transition(m.READY), this.ticker && this.ticker.polling && (this.ticker.polling.start(), A("debug", "Polling started by lifecycle")), Promise.resolve(!0));
};
b.prototype.pause = function() {
  return this.state !== m.READY ? (A("warn", `Cannot pause from state: ${this.state}`), Promise.resolve(!1)) : (this._transition(m.PAUSED), this.ticker && this.ticker.polling && (this.ticker.polling.stop(), A("debug", "Polling stopped by lifecycle (pause)")), this._metrics.pauseCount++, Promise.resolve(!0));
};
b.prototype.resume = function() {
  return this.state !== m.PAUSED ? (A("warn", `Cannot resume from state: ${this.state}`), Promise.resolve(!1)) : (this._transition(m.READY), this.ticker && this.ticker.polling && (this.ticker.polling.start(), A("debug", "Polling restarted by lifecycle (resume)")), this._metrics.resumeCount++, Promise.resolve(!0));
};
b.prototype.unmount = function() {
  return this.state === m.UNMOUNTED ? Promise.resolve(!1) : (this._transition(m.UNMOUNTING), this.ticker && this.ticker.polling && (this.ticker.polling.stop(), this.ticker.polling.abort(), A("debug", "Polling stopped and aborted by lifecycle (unmount)")), this._transition(m.UNMOUNTED), this._metrics.unmountCount++, Promise.resolve(!0));
};
b.prototype._transition = function(s) {
  const e = this.state;
  this.state = s, this._metrics.lastTransitionAt = Date.now(), A("debug", `State: ${e} -> ${s}`);
};
b.prototype.getState = function() {
  return this.state;
};
b.prototype.isReady = function() {
  return this.state === m.READY;
};
b.prototype.isMounted = function() {
  return this.state === m.MOUNTED || this.state === m.READY || this.state === m.PAUSED;
};
b.prototype.canFetch = function() {
  return this.state === m.READY;
};
b.prototype.healthCheck = function() {
  const s = ct("logger"), e = Object.keys(m), t = [];
  for (let o = 0; o < e.length; o++)
    t.push(m[e[o]]);
  const i = {
    validState: t.indexOf(this.state) !== -1,
    hasComponent: !!this.ticker,
    loggerReady: !!s,
    portsInitialized: Y.isInitialized()
  }, n = Object.keys(i);
  let r = 0;
  for (let o = 0; o < n.length; o++)
    i[n[o]] && r++;
  return { status: r === 4 ? "HEALTHY" : "DEGRADED", score: r, maxScore: 4, scoreDisplay: `${r}/4`, checks: i, state: this.state, version: Wt, moduleId: qe, portsInitialized: Y.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
b.prototype.info = function() {
  return { version: Wt, moduleId: qe, state: this.state, states: m, metrics: this._metrics, portsInitialized: Y.isInitialized(), healthCheck: this.healthCheck() };
};
b.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
b.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, unmountCount: 0, pauseCount: 0, resumeCount: 0, lastTransitionAt: null };
};
const pt = "6.4.0-P17WI", Ee = "ticker.core.polling", Z = d({ moduleId: Ee });
function ht(s) {
  return Z.get(s);
}
const mi = () => {
  var s;
  const e = ht("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, We = (s, ...e) => {
  const t = ht("logger");
  if (!t || !mi() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${Ee}]`, ...e);
};
class pi {
  constructor(e = {}) {
    this.interval = e.interval || 3e5, this.callback = e.callback || (() => {
    }), this.timerId = null, this.isRunning = !1, this.abortController = null, this._metrics = { startCount: 0, stopCount: 0, pollCount: 0, abortCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this._poll(), this.timerId = setInterval(() => this._poll(), this.interval), this._metrics.startCount++, We("debug", `Polling started (interval: ${this.interval}ms)`));
  }
  _poll() {
    this.isRunning && (typeof document < "u" && document.hidden || (this.abortController && (this.abortController.abort(), this._metrics.abortCount++, We("debug", "Previous fetch aborted")), this.abortController = new AbortController(), this.callback(this.abortController.signal), this._metrics.pollCount++, this._metrics.lastPollAt = Date.now()));
  }
  stop() {
    this.isRunning && (this.abortController && (this.abortController.abort(), this.abortController = null), clearInterval(this.timerId), this.isRunning = !1, this.timerId = null, this._metrics.stopCount++, We("debug", "Polling stopped"));
  }
  restart() {
    this.stop(), this.start();
  }
  abort() {
    this.abortController && (this.abortController.abort(), this.abortController = null, this._metrics.abortCount++);
  }
  getSignal() {
    var e;
    return ((e = this.abortController) == null ? void 0 : e.signal) || null;
  }
  healthCheck() {
    const e = ht("logger"), t = { hasCallback: typeof this.callback == "function", validInterval: this.interval > 0, loggerReady: !!e, portsInitialized: Z.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, checks: t, version: pt, moduleId: Ee, portsInitialized: Z.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: pt, moduleId: Ee, isRunning: this.isRunning, interval: this.interval, metrics: this._metrics, portsInitialized: Z.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { startCount: 0, stopCount: 0, pollCount: 0, abortCount: 0, lastPollAt: null };
  }
}
const vt = "6.4.0-P17WI", Ce = "ticker/state/store", G = d({ moduleId: Ce });
function vi() {
  G.init();
}
function ut(s) {
  return G.get(s);
}
const bi = () => {
  var s;
  const e = ut("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, T = (s, ...e) => {
  const t = ut("logger");
  if (!t || !bi() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${Ce}]`, ...e);
}, bt = Object.freeze({ news: [], status: "loading", lastUpdate: null }), yt = ["loading", "ok", "offline", "error"];
class yi {
  constructor(e = {}) {
    this._state = this._freeze({ ...bt, ...e }), this.listeners = [], this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null }, vi();
  }
  _freeze(e) {
    return Array.isArray(e) ? Object.freeze(e.map((t) => typeof t == "object" ? this._freeze(t) : t)) : e && typeof e == "object" ? (Object.keys(e).forEach((t) => {
      typeof e[t] == "object" && (e[t] = this._freeze(e[t]));
    }), Object.freeze(e)) : e;
  }
  _validateUpdate(e) {
    return e.status && !yt.includes(e.status) ? (T("warn", `Status inválido rejeitado: ${e.status}`), this._metrics.rejectCount++, !1) : e.news && !Array.isArray(e.news) ? (T("warn", "news deve ser array"), this._metrics.rejectCount++, !1) : !0;
  }
  getState() {
    return this._state;
  }
  setState(e) {
    if (!this._validateUpdate(e)) return !1;
    const t = { ...this._state, ...e };
    return this._state = this._freeze(t), this._notify(), this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), T("debug", "State updated:", e), !0;
  }
  subscribe(e) {
    return typeof e != "function" ? (T("warn", "Listener deve ser função"), () => {
    }) : (this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((t) => t !== e);
    });
  }
  _notify() {
    this.listeners.forEach((e) => {
      try {
        e(this._state), this._metrics.notifyCount++;
      } catch (t) {
        T("error", "Erro em listener:", t);
      }
    });
  }
  reset() {
    this._state = this._freeze({ ...bt }), this.listeners = [], T("debug", "State reset");
  }
  select(e) {
    try {
      return e(this._state);
    } catch (t) {
      return T("error", "Erro em selector:", t), null;
    }
  }
  healthCheck() {
    const e = ut("logger"), t = { hasState: !!this._state, isFrozen: Object.isFrozen(this._state), validStatus: yt.includes(this._state.status), subscribersReady: Array.isArray(this.listeners), loggerReady: !!e, portsInitialized: G.isInitialized() }, i = Object.values(t).filter(Boolean).length, n = Object.keys(t).length;
    return { status: i === n ? "HEALTHY" : "DEGRADED", score: i, maxScore: n, scoreDisplay: `${i}/${n}`, checks: t, version: vt, moduleId: Ce, portsInitialized: G.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: vt, moduleId: Ce, newsCount: this._state.news.length, status: this._state.status, subscriberCount: this.listeners.length, isFrozen: Object.isFrozen(this._state), metrics: this._metrics, portsInitialized: G.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null };
  }
}
const kt = "6.4.0-P17WI", Se = "ticker.config.store", I = 2, ee = d({ moduleId: Se });
function dt(s) {
  return ee.get(s);
}
const ki = () => {
  var s;
  const e = dt("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, H = (s, ...e) => {
  const t = dt("logger");
  if (!t || !ki() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${Se}]`, ...e);
};
class Ii {
  constructor() {
    this.storageKey = "dshowdash_ticker_config", this.listeners = [], this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null }, this.config = this._loadConfig();
  }
  _getDefaultConfig() {
    return { _version: I, behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: !0 }, content: { sources: ["g1", "uol", "folha"], categories: ["politica", "economia", "tecnologia", "geral"], maxItems: 20, autoRefreshMinutes: 5 }, visual: { height: "default", fontSize: "medium", showTag: !0, showIcon: !0, showTime: !0, separatorStyle: "bullet" }, theme: { background: "darkA", accent: "purple", text: "light", tagStyle: "category", shadow: "soft" }, accessibility: { respectReducedMotion: !0, highContrast: !1 }, preset: "enterprise-default" };
  }
  _migrate(e) {
    const t = e._version || 1;
    if (t === I) return e;
    H("info", `Migrando config v${t} -> v${I}`), this._metrics.migrateCount++;
    let i = { ...e };
    return t < 2 && (i.visual = i.visual || {}, i.visual.separatorStyle = i.visual.separatorStyle || "bullet", i.accessibility = i.accessibility || { respectReducedMotion: !0, highContrast: !1 }), i._version = I, i;
  }
  _loadConfig() {
    this._metrics.loadCount++;
    try {
      const e = localStorage.getItem(this.storageKey);
      if (e) {
        let t = JSON.parse(e);
        t = this._migrate(t);
        const i = this._mergeDeep(this._getDefaultConfig(), t);
        return t._version !== I && this._save(i), i;
      }
    } catch (e) {
      H("warn", "Erro ao carregar storage:", e);
    }
    return this._getDefaultConfig();
  }
  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }
  getDefaultConfig() {
    return this._getDefaultConfig();
  }
  getConfigVersion() {
    return I;
  }
  update(e) {
    delete e._version, this.config = this._mergeDeep(this.config, e), this.config._version = I, this._save(this.config), this._notify(), this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now();
  }
  _save(e) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(e)), this._metrics.saveCount++;
    } catch (t) {
      H("error", "Erro ao salvar:", t);
    }
  }
  reset() {
    this.config = this._getDefaultConfig(), this._save(this.config), this._notify(), this._metrics.resetCount++;
  }
  applyPreset(e) {
    const i = { "enterprise-default": this._getDefaultConfig(), "reading-comfort": { behavior: { mode: "ticker", direction: "left", speed: "slow", pauseOnHover: !0 }, visual: { height: "tall", fontSize: "large", showTag: !0, showIcon: !1, showTime: !0, separatorStyle: "bar" }, theme: { background: "darkA", accent: "blue", text: "light", tagStyle: "mono", shadow: "soft" }, accessibility: { respectReducedMotion: !0, highContrast: !1 } }, "colorful-soft": { behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: !0 }, visual: { height: "default", fontSize: "medium", showTag: !0, showIcon: !0, showTime: !0, separatorStyle: "chevron" }, theme: { background: "darkB", accent: "purple", text: "light", tagStyle: "category", shadow: "medium" }, accessibility: { respectReducedMotion: !0, highContrast: !1 } } }[e];
    i && (this.config = this._mergeDeep(this._getDefaultConfig(), i), this.config.preset = e, this.config._version = I, this._save(this.config), this._notify());
  }
  subscribe(e) {
    return this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((t) => t !== e);
    };
  }
  _notify() {
    this.listeners.forEach((e) => {
      try {
        e(this.config);
      } catch (t) {
        H("error", "Erro em listener:", t);
      }
    });
  }
  _mergeDeep(e, t) {
    const i = { ...e };
    return this._isObject(e) && this._isObject(t) && Object.keys(t).forEach((n) => {
      this._isObject(t[n]) ? i[n] = n in e ? this._mergeDeep(e[n], t[n]) : t[n] : i[n] = t[n];
    }), i;
  }
  _isObject(e) {
    return e && typeof e == "object" && !Array.isArray(e);
  }
  validate(e) {
    return e.behavior && ["ticker", "static"].includes(e.behavior.mode) && e.content && Array.isArray(e.content.sources) && e.visual && e.visual.height && e.theme && e.theme.background;
  }
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }
  importConfig(e) {
    try {
      const t = JSON.parse(e);
      return this.validate(t) ? (t._version = I, this.config = this._mergeDeep(this._getDefaultConfig(), t), this._save(this.config), this._notify(), !0) : !1;
    } catch (t) {
      return H("error", "Erro ao importar:", t), !1;
    }
  }
  healthCheck() {
    const e = dt("logger"), t = { hasConfig: !!this.config, validConfig: this.validate(this.config), correctVersion: this.config._version === I, storageAccessible: !0, loggerReady: !!e, portsInitialized: ee.isInitialized() };
    try {
      localStorage.getItem(this.storageKey);
    } catch {
      t.storageAccessible = !1;
    }
    const i = Object.values(t).filter(Boolean).length;
    return { status: i === 6 ? "HEALTHY" : "DEGRADED", score: `${i}/6`, checks: t, configVersion: I, version: kt, moduleId: Se, portsInitialized: ee.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: kt, moduleId: Se, configVersion: I, preset: this.config.preset, listenerCount: this.listeners.length, metrics: this._metrics, portsInitialized: ee.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null };
  }
}
const Ei = "ticker.ui.template-enterprise";
d({ moduleId: Ei });
function Ci() {
  return '<div class="ticker-wrapper ticker-wrapper--full"><div class="ticker-content-container"><div class="ticker-track" role="marquee" aria-live="polite"></div></div></div>';
}
const Si = "ticker.config.design-tokens";
d({ moduleId: Si });
const It = { speed: { slow: 45, medium: 30, fast: 20 } };
function wi(s) {
  return It.speed[s] || It.speed.medium;
}
const Et = "8.4.0-P17WI", we = "ticker.ui.render-enterprise", D = typeof document < "u", te = d({ moduleId: we });
function gt(s) {
  return te.get(s);
}
const Di = () => {
  var s;
  const e = gt("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, Je = (s, ...e) => {
  const t = gt("logger");
  if (!t || !Di() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${we}]`, ...e);
}, Xe = { fx: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M6 12h12"/></svg>', stock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>', stockDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>' }, Ct = { g1: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><text x="2" y="17" font-size="14" font-weight="bold" font-family="Arial">G1</text></svg>', uol: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3"/></svg>', folha: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2"/><line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="1.5"/></svg>', estadao: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><text x="4" y="16" font-size="12" font-weight="bold" font-family="serif">E</text></svg>', valor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4l8 16 8-16" fill="none" stroke="currentColor" stroke-width="2"/></svg>', default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' };
class Ai {
  constructor(e, t, i) {
    this.container = e, this.store = t, this.configStore = i, this.track = null, this.unsubscribe = null, this._metrics = { renderCount: 0, configApplyCount: 0, lastRenderAt: null };
  }
  init() {
    this.track = this.container.querySelector(".ticker-track"), this.configStore && (this.unsubscribe = this.configStore.subscribe((e) => {
      this.applyConfig(e);
    })), Je("debug", "Renderer initialized");
  }
  render() {
    if (!this.track) return;
    const { news: e, status: t } = this.store.getState(), i = this.configStore ? this.configStore.getConfig() : this._getDefaultConfig();
    t === "loading" ? this._renderLoading() : t === "offline" ? this._renderOffline() : e && e.length > 0 && this._renderItems(e, i), this._metrics.renderCount++, this._metrics.lastRenderAt = Date.now();
  }
  _renderLoading() {
    if (this._clearTrack(), !D) return;
    const e = document.createElement("span");
    e.className = "ticker-loading";
    const t = this._createSVG("spinner");
    e.appendChild(t), e.appendChild(document.createTextNode("Carregando dados...")), this.track.appendChild(e);
  }
  _renderOffline() {
    if (this._clearTrack(), !D) return;
    const e = document.createElement("span");
    e.className = "ticker-offline";
    const t = this._createSVG("alert");
    e.appendChild(t), e.appendChild(document.createTextNode("Sem conexao")), this.track.appendChild(e);
  }
  _renderItems(e, t) {
    if (this._clearTrack(), !D) return;
    const i = Array.isArray(e) ? [...e] : [], n = 6, r = [];
    for (; r.length < n && i.length > 0; )
      r.push(...i);
    if (r.length === 0) {
      this._renderEmpty();
      return;
    }
    const o = document.createDocumentFragment();
    r.forEach((c, l) => {
      var u;
      const _ = this._createItemNode(c, t, l);
      o.appendChild(_), o.appendChild(this._createSeparator(((u = t.visual) == null ? void 0 : u.separatorStyle) || "minimal"));
    });
    const a = o.cloneNode(!0);
    this.track.appendChild(o), this.track.appendChild(a);
  }
  _renderEmpty() {
    if (this._clearTrack(), !D) return;
    const e = document.createElement("span");
    e.className = "ticker-offline", e.textContent = "Nenhum dado disponivel", this.track.appendChild(e);
  }
  _createItemNode(e, t, i) {
    const n = e.type || "news", r = i % 3 + 1;
    switch (n) {
      case "fx":
        return this._createFXNode(e, t, r);
      case "stock":
        return this._createStockNode(e, t, r);
      default:
        return this._createNewsNode(e, t, r);
    }
  }
  _createNewsNode(e, t, i) {
    var n;
    if (!D) return null;
    const r = this._detectCategory(e.title || ""), o = r === "breaking", a = this._formatTime(e.published_at || e.pubDate), c = e.source || "default", l = document.createElement("div");
    l.className = ["ticker-item", "ticker-item--news", `ticker-item--variant-${i}`, `ticker-item--categoria-${r}`, o ? "ticker-item--breaking" : ""].filter(Boolean).join(" ");
    const u = document.createElement("span");
    u.className = "ticker-source-icon", u.title = c, u.innerHTML = Ct[c] || Ct.default, l.appendChild(u);
    const _ = document.createElement("span");
    _.className = "ticker-time", _.textContent = a, l.appendChild(_);
    const f = document.createElement("a");
    if (f.href = e.url || "#", f.target = "_blank", f.rel = "noopener noreferrer", f.className = "ticker-title", f.textContent = e.title || "", l.appendChild(f), ((n = t.visual) == null ? void 0 : n.showTag) !== !1) {
      const k = document.createElement("span");
      k.className = "ticker-tag", k.textContent = this._getCategoryLabel(r), l.appendChild(k);
    }
    return l;
  }
  _createFXNode(e, t, i) {
    if (!D) return null;
    const n = e.change_pct || 0, r = n === 0 ? "neutral" : n > 0 ? "positive" : "negative", o = n > 0 ? "+" : "", a = this._formatPrice(e.price, 2), c = document.createElement("div");
    c.className = ["ticker-item", "ticker-item--fx", `ticker-item--variant-${i}`, `ticker-item--${r}`].join(" ");
    const l = document.createElement("span");
    l.className = "ticker-market-icon", l.innerHTML = Xe.fx, c.appendChild(l);
    const u = document.createElement("span");
    u.className = "ticker-symbol", u.textContent = e.symbol || "FX", c.appendChild(u);
    const _ = document.createElement("span");
    _.className = "ticker-price", _.textContent = a, c.appendChild(_);
    const f = document.createElement("span");
    return f.className = `ticker-change ticker-change--${r}`, f.textContent = `${o}${n.toFixed(2)}%`, c.appendChild(f), c;
  }
  _createStockNode(e, t, i) {
    if (!D) return null;
    const n = e.change_pct || 0, r = n > 0, o = n === 0 ? "neutral" : r ? "positive" : "negative", a = r ? "+" : "", c = this._formatPrice(e.price, 2), l = document.createElement("div");
    l.className = ["ticker-item", "ticker-item--stock", `ticker-item--variant-${i}`, `ticker-item--${o}`].join(" ");
    const u = document.createElement("span");
    u.className = "ticker-market-icon", u.innerHTML = r ? Xe.stock : Xe.stockDown, l.appendChild(u);
    const _ = document.createElement("span");
    _.className = "ticker-symbol", _.textContent = e.symbol || "STOCK", l.appendChild(_);
    const f = document.createElement("span");
    f.className = "ticker-price", f.textContent = `R$ ${c}`, l.appendChild(f);
    const k = document.createElement("span");
    return k.className = `ticker-change ticker-change--${o}`, k.textContent = `${a}${n.toFixed(2)}%`, l.appendChild(k), l;
  }
  _createSeparator(e) {
    if (!D) return null;
    const t = document.createElement("span"), i = { bullet: ["ticker-separator", "ticker-separator--bullet"], bar: ["ticker-separator", "ticker-separator--bar"], chevron: ["ticker-separator", "ticker-separator--chevron"], minimal: ["ticker-separator", "ticker-separator--minimal"] };
    return t.className = (i[e] || i.minimal).join(" "), e === "bullet" && (t.textContent = "•"), e === "chevron" && (t.textContent = "›"), t;
  }
  _createSVG(e) {
    if (!D) return null;
    const t = document.createElement("span");
    return e === "spinner" ? t.innerHTML = '<svg class="ticker-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>' : e === "alert" && (t.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'), t.firstChild;
  }
  _clearTrack() {
    this.track && this.track.replaceChildren();
  }
  _formatTime(e) {
    if (!e) return "--:--";
    try {
      return new Date(e).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  }
  _formatPrice(e, t = 2) {
    return e == null ? "--" : Number(e).toLocaleString("pt-BR", { minimumFractionDigits: t, maximumFractionDigits: t });
  }
  _getCategoryLabel(e) {
    return { breaking: "URGENTE", economia: "ECON", politica: "POL", tecnologia: "TECH", geral: "GERAL" }[e] || "GERAL";
  }
  _detectCategory(e) {
    const t = e.toLowerCase();
    return t.includes("urgente") || t.includes("breaking") || t.includes("ultima hora") || t.includes("alerta") ? "breaking" : t.includes("economia") || t.includes("mercado") || t.includes("dolar") || t.includes("bolsa") || t.includes("ibovespa") || t.includes("inflacao") || t.includes("pib") || t.includes("selic") ? "economia" : t.includes("politica") || t.includes("eleicao") || t.includes("governo") || t.includes("congresso") || t.includes("senado") || t.includes("lula") || t.includes("ministro") ? "politica" : t.includes("tecnologia") || t.includes("tech") || t.includes("ia") || t.includes("inteligencia artificial") || t.includes("startup") || t.includes("apple") || t.includes("google") ? "tecnologia" : "geral";
  }
  _getDefaultConfig() {
    return { visual: { height: "default", fontSize: "medium", showTag: !0, separatorStyle: "minimal" }, theme: { background: "darkA" }, behavior: { speed: "medium", direction: "left" }, accessibility: { highContrast: !1, respectReducedMotion: !0 } };
  }
  applyConfig(e) {
    var t, i, n, r, o, a;
    if (this.container) {
      if (this.container.classList.remove("ticker--height-compact", "ticker--height-default", "ticker--height-tall"), this.container.classList.add(`ticker--height-${((t = e.visual) == null ? void 0 : t.height) || "default"}`), this.container.classList.remove("ticker--font-small", "ticker--font-medium", "ticker--font-large"), this.container.classList.add(`ticker--font-${((i = e.visual) == null ? void 0 : i.fontSize) || "medium"}`), this.container.dataset.theme = ((n = e.theme) == null ? void 0 : n.background) || "darkA", this.container.dataset.highContrast = (r = e.accessibility) != null && r.highContrast ? "true" : "false", this.track) {
        const c = wi(((o = e.behavior) == null ? void 0 : o.speed) || "medium");
        this.track.style.animationDuration = `${c}s`, this.track.style.animationDirection = ((a = e.behavior) == null ? void 0 : a.direction) === "right" ? "reverse" : "normal";
      }
      this.render(), this._metrics.configApplyCount++, Je("debug", "Config applied");
    }
  }
  destroy() {
    this.unsubscribe && (this.unsubscribe(), this.unsubscribe = null), this.track = null, this.container = null, this.store = null, this.configStore = null, Je("debug", "Renderer destroyed");
  }
  healthCheck() {
    const e = gt("logger"), t = { hasTrack: !!this.track, hasStore: !!this.store, hasConfigStore: !!this.configStore, loggerReady: !!e, portsInitialized: te.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 5 ? "HEALTHY" : "DEGRADED", score: `${i}/5`, checks: t, version: Et, moduleId: we, portsInitialized: te.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Et, moduleId: we, metrics: this._metrics, portsInitialized: te.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { renderCount: 0, configApplyCount: 0, lastRenderAt: null };
  }
}
const St = "5.4.0-P17WI", De = "ticker.accessibility.announce", ie = d({ moduleId: De });
function _t(s) {
  return ie.get(s);
}
const Ti = () => {
  var s;
  const e = _t("config");
  return ((s = e == null ? void 0 : e.app) == null ? void 0 : s.debug) ?? !1;
}, Qe = (s, ...e) => {
  const t = _t("logger");
  if (!t || !Ti() && s === "debug") return;
  const i = t[s] || t.info;
  typeof i == "function" && i(`[${De}]`, ...e);
};
class Li {
  constructor() {
    this.liveRegion = null, this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null };
  }
  mount(e) {
    this.liveRegion = e.querySelector("[aria-live]"), this._metrics.mountCount++, Qe("debug", "AnnounceManager mounted");
  }
  announce(e) {
    this.liveRegion && (this.liveRegion.setAttribute("aria-label", e), this._metrics.announceCount++, this._metrics.lastAnnounceAt = Date.now(), Qe("debug", "Announced:", e));
  }
  unmount() {
    this.liveRegion = null, Qe("debug", "AnnounceManager unmounted");
  }
  healthCheck() {
    const t = { ready: !0, loggerReady: !!_t("logger"), portsInitialized: ie.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 3 ? "HEALTHY" : "DEGRADED", score: `${i}/3`, checks: t, version: St, moduleId: De, portsInitialized: ie.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: St, moduleId: De, hasLiveRegion: !!this.liveRegion, metrics: this._metrics, portsInitialized: ie.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null };
  }
}
const wt = "6.3.0-P17WI", Ae = "ticker.telemetry.tracker", se = d({ moduleId: Ae });
function rt(s) {
  return se.get(s);
}
let Jt = !1;
function Dt(s, ...e) {
  var t;
  const i = rt("logger");
  i && Jt && ((t = i.debug) == null || t.call(i, `[${Ae}]`, ...e));
}
class Oi {
  constructor(e = {}) {
    this._debug = !1, this._enabled = !0, this._rateLimit = e.rateLimit || 10, this._dedupeWindowMs = e.dedupeWindowMs || 1e3, this._recentHashes = /* @__PURE__ */ new Map(), this._eventCounts = /* @__PURE__ */ new Map(), this._lastReset = Date.now(), this._metrics = { trackCount: 0, droppedByRate: 0, droppedByDedupe: 0, lastTrackAt: null };
  }
  _hash(e, t) {
    const i = e + JSON.stringify(t || {});
    let n = 0;
    for (let r = 0; r < i.length; r++)
      n = (n << 5) - n + i.charCodeAt(r), n |= 0;
    return n.toString(36);
  }
  _checkRateLimit(e) {
    const t = Date.now();
    t - this._lastReset > 1e3 && (this._eventCounts.clear(), this._lastReset = t);
    const i = this._eventCounts.get(e) || 0;
    return i >= this._rateLimit ? (this._metrics.droppedByRate++, !1) : (this._eventCounts.set(e, i + 1), !0);
  }
  _checkDedupe(e) {
    const t = Date.now(), i = this._recentHashes.get(e);
    if (i && t - i < this._dedupeWindowMs)
      return this._metrics.droppedByDedupe++, !1;
    if (this._recentHashes.set(e, t), this._recentHashes.size > 100) {
      const n = t - this._dedupeWindowMs;
      for (const [r, o] of this._recentHashes)
        o < n && this._recentHashes.delete(r);
    }
    return !0;
  }
  track(e, t = null) {
    var i, n;
    if (!this._enabled) return !1;
    if (!this._checkRateLimit(e))
      return Dt("debug", `Rate limited: ${e}`), !1;
    const r = this._hash(e, t);
    if (!this._checkDedupe(r))
      return Dt("debug", `Dedupe: ${e}`), !1;
    const o = rt("config"), a = rt("logger");
    return (i = o == null ? void 0 : o.app) != null && i.debug && a && ((n = a.debug) == null || n.call(a, "[Ticker:Telemetry]", e, t)), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), !0;
  }
  enable() {
    this._enabled = !0;
  }
  disable() {
    this._enabled = !1;
  }
  isEnabled() {
    return this._enabled;
  }
  setRateLimit(e) {
    this._rateLimit = e;
  }
  setDedupeWindow(e) {
    this._dedupeWindowMs = e;
  }
  healthCheck() {
    const e = { enabled: this._enabled, hasRateLimit: this._rateLimit > 0, portsInitialized: se.isInitialized() }, t = Object.values(e).filter(Boolean).length;
    return { status: t === 3 ? "HEALTHY" : "DEGRADED", score: `${t}/3`, checks: e, version: wt, moduleId: Ae, portsInitialized: se.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: wt, moduleId: Ae, enabled: this._enabled, rateLimit: this._rateLimit, dedupeWindowMs: this._dedupeWindowMs, metrics: this._metrics, portsInitialized: se.isInitialized(), healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Jt = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, droppedByRate: 0, droppedByDedupe: 0, lastTrackAt: null };
  }
}
const xi = "ticker.utils.helpers";
d({ moduleId: xi });
function Xt() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
const At = "1.2.0-P17WI", Te = "ticker.core.circuit-breaker", ne = d({ moduleId: Te });
function Qt(s) {
  return ne.get(s);
}
const $ = (s, ...e) => {
  const t = Qt("logger");
  t != null && t[s] && t[s](`[${Te}]`, ...e);
}, y = Object.freeze({ CLOSED: "closed", OPEN: "open", HALF_OPEN: "half-open" });
class Ri {
  constructor(e = {}) {
    this.failureThreshold = e.failureThreshold || 3, this.resetTimeout = e.resetTimeout || 3e4, this.halfOpenMaxAttempts = e.halfOpenMaxAttempts || 1, this._state = y.CLOSED, this._failureCount = 0, this._successCount = 0, this._lastFailureTime = null, this._halfOpenAttempts = 0, this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0, stateChanges: 0 }, this._subscribers = /* @__PURE__ */ new Set();
  }
  get state() {
    return this._state;
  }
  get isOpen() {
    return this._state === y.OPEN;
  }
  get isClosed() {
    return this._state === y.CLOSED;
  }
  get isHalfOpen() {
    return this._state === y.HALF_OPEN;
  }
  async execute(e, t) {
    if (this._metrics.totalCalls++, this._state === y.OPEN)
      if (this._shouldAttemptReset())
        this._transitionTo(y.HALF_OPEN);
      else {
        if (this._metrics.rejectedCalls++, $("warn", "Circuit OPEN - request rejected"), t) return t();
        throw new Error("Circuit breaker is OPEN");
      }
    try {
      const i = await e();
      return this._onSuccess(), i;
    } catch (i) {
      if (this._onFailure(i), t) return t();
      throw i;
    }
  }
  _onSuccess() {
    this._metrics.successCalls++, this._failureCount = 0, this._successCount++, this._state === y.HALF_OPEN && (this._transitionTo(y.CLOSED), $("info", "Circuit CLOSED - recovered"));
  }
  _onFailure(e) {
    this._metrics.failedCalls++, this._failureCount++, this._lastFailureTime = Date.now(), $("warn", `Failure ${this._failureCount}/${this.failureThreshold}`, { error: e.message }), this._state === y.HALF_OPEN ? (this._halfOpenAttempts++, this._halfOpenAttempts >= this.halfOpenMaxAttempts && this._transitionTo(y.OPEN)) : this._failureCount >= this.failureThreshold && (this._transitionTo(y.OPEN), $("error", "Circuit OPEN - threshold reached"));
  }
  _shouldAttemptReset() {
    return this._lastFailureTime && Date.now() - this._lastFailureTime >= this.resetTimeout;
  }
  _transitionTo(e) {
    const t = this._state;
    this._state = e, this._metrics.stateChanges++, e === y.HALF_OPEN && (this._halfOpenAttempts = 0), e === y.CLOSED && (this._failureCount = 0, this._successCount = 0), this._notifySubscribers({ oldState: t, newState: e, timestamp: Date.now() }), $("info", `State: ${t} -> ${e}`);
  }
  reset() {
    this._transitionTo(y.CLOSED), this._failureCount = 0, this._lastFailureTime = null, $("info", "Circuit manually reset");
  }
  subscribe(e) {
    return this._subscribers.add(e), () => this._subscribers.delete(e);
  }
  _notifySubscribers(e) {
    this._subscribers.forEach((t) => {
      try {
        t(e);
      } catch {
      }
    });
  }
  healthCheck() {
    const e = Qt("logger"), t = { isClosed: this.isClosed, lowFailureCount: this._failureCount < this.failureThreshold, loggerReady: !!e, portsInitialized: ne.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${i}/4`, state: this._state, failureCount: this._failureCount, checks: t, metrics: { ...this._metrics }, version: At, moduleId: Te, portsInitialized: ne.isInitialized() };
  }
  info() {
    return { version: At, moduleId: Te, state: this._state, failureCount: this._failureCount, threshold: this.failureThreshold, resetTimeout: this.resetTimeout, metrics: { ...this._metrics }, portsInitialized: ne.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  destroy() {
    this.reset();
  }
}
const Tt = "1.2.0-P17WI", Le = "ticker.core.request-cache", re = d({ moduleId: Le });
function Zt(s) {
  return re.get(s);
}
const V = (s, ...e) => {
  const t = Zt("logger");
  t != null && t[s] && t[s](`[${Le}]`, ...e);
};
class $i {
  constructor(e = {}) {
    this.ttl = e.ttl || 5e3, this.maxSize = e.maxSize || 50, this._cache = /* @__PURE__ */ new Map(), this._pending = /* @__PURE__ */ new Map(), this._metrics = { hits: 0, misses: 0, deduped: 0, evictions: 0 };
  }
  async dedupe(e, t) {
    const i = this._getFromCache(e);
    if (i !== null)
      return this._metrics.hits++, V("debug", `Cache HIT: ${e}`), i;
    if (this._pending.has(e))
      return this._metrics.deduped++, V("debug", `Request DEDUPED: ${e}`), this._pending.get(e);
    this._metrics.misses++;
    const n = this._fetchAndCache(e, t);
    this._pending.set(e, n);
    try {
      return await n;
    } finally {
      this._pending.delete(e);
    }
  }
  async _fetchAndCache(e, t) {
    try {
      const i = await t();
      return this._setCache(e, i), i;
    } catch (i) {
      throw i;
    }
  }
  _getFromCache(e) {
    const t = this._cache.get(e);
    return t ? Date.now() > t.expiresAt ? (this._cache.delete(e), null) : t.data : null;
  }
  _setCache(e, t) {
    if (this._cache.size >= this.maxSize) {
      const i = this._cache.keys().next().value;
      this._cache.delete(i), this._metrics.evictions++;
    }
    this._cache.set(e, { data: t, expiresAt: Date.now() + this.ttl, createdAt: Date.now() });
  }
  invalidate(e) {
    e ? this._cache.delete(e) : this._cache.clear(), V("debug", e ? `Invalidated: ${e}` : "Cache cleared");
  }
  has(e) {
    return this._getFromCache(e) !== null;
  }
  get size() {
    return this._cache.size;
  }
  get pendingCount() {
    return this._pending.size;
  }
  cleanup() {
    const e = Date.now();
    let t = 0;
    for (const [i, n] of this._cache)
      e > n.expiresAt && (this._cache.delete(i), t++);
    return t > 0 && V("debug", `Cleaned ${t} expired entries`), t;
  }
  healthCheck() {
    const e = Zt("logger"), t = this._metrics.hits + this._metrics.misses > 0 ? this._metrics.hits / (this._metrics.hits + this._metrics.misses) : 0, i = { hasCapacity: this._cache.size < this.maxSize, goodHitRate: t > 0.3 || this._metrics.hits + this._metrics.misses < 10, loggerReady: !!e, portsInitialized: re.isInitialized() }, n = Object.values(i).filter(Boolean).length;
    return { status: n === 4 ? "HEALTHY" : "DEGRADED", score: `${n}/4`, hitRate: `${(t * 100).toFixed(1)}%`, size: this._cache.size, checks: i, metrics: { ...this._metrics }, version: Tt, moduleId: Le, portsInitialized: re.isInitialized() };
  }
  info() {
    return { version: Tt, moduleId: Le, ttl: this.ttl, maxSize: this.maxSize, currentSize: this._cache.size, pendingRequests: this._pending.size, metrics: { ...this._metrics }, portsInitialized: re.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { hits: 0, misses: 0, deduped: 0, evictions: 0 };
  }
}
const Lt = "1.2.0-P17WI", Oe = "ticker.core.dom-recycler", oe = d({ moduleId: Oe });
function ei(s) {
  return oe.get(s);
}
const Ze = (s, ...e) => {
  const t = ei("logger");
  t != null && t[s] && t[s](`[${Oe}]`, ...e);
};
class zi {
  constructor(e = {}) {
    this.maxPoolSize = e.maxPoolSize || 100, this._pools = /* @__PURE__ */ new Map(), this._activeElements = /* @__PURE__ */ new WeakSet(), this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 };
  }
  acquire(e, t) {
    let i = this._pools.get(e);
    i || (i = [], this._pools.set(e, i));
    let n;
    return i.length > 0 ? (n = i.pop(), this._metrics.poolHits++, this._metrics.recycled++, Ze("debug", `Recycled: ${e}`)) : (n = t(), this._metrics.poolMisses++, this._metrics.created++), this._activeElements.add(n), n;
  }
  release(e, t) {
    if (!t || !this._activeElements.has(t)) return !1;
    let i = this._pools.get(e);
    return i || (i = [], this._pools.set(e, i)), i.length >= this.maxPoolSize ? (t.remove(), !1) : (this._resetElement(t), i.push(t), this._activeElements.delete(t), this._metrics.returned++, !0);
  }
  releaseAll(e, t) {
    Array.isArray(t) && t.forEach((i) => this.release(e, i));
  }
  _resetElement(e) {
    e.className = "", e.removeAttribute("style"), e.removeAttribute("data-index"), e.textContent = "", [...e.attributes].forEach((i) => {
      i.name !== "class" && e.removeAttribute(i.name);
    });
  }
  getPoolSize(e) {
    const t = this._pools.get(e);
    return t ? t.length : 0;
  }
  getTotalPoolSize() {
    let e = 0;
    for (const t of this._pools.values())
      e += t.length;
    return e;
  }
  clearPool(e) {
    if (e) {
      const t = this._pools.get(e);
      t && (t.forEach((i) => {
        var n;
        return (n = i.remove) == null ? void 0 : n.call(i);
      }), t.length = 0);
    } else {
      for (const t of this._pools.values())
        t.forEach((i) => {
          var n;
          return (n = i.remove) == null ? void 0 : n.call(i);
        }), t.length = 0;
      this._pools.clear();
    }
    Ze("debug", e ? `Pool cleared: ${e}` : "All pools cleared");
  }
  warmPool(e, t, i) {
    let n = this._pools.get(e);
    n || (n = [], this._pools.set(e, n));
    const r = Math.min(t, this.maxPoolSize - n.length);
    for (let o = 0; o < r; o++) {
      const a = i();
      n.push(a), this._metrics.created++;
    }
    Ze("debug", `Pool warmed: ${e} (+${r})`);
  }
  healthCheck() {
    const e = ei("logger"), t = this._metrics.poolHits + this._metrics.poolMisses > 0 ? this._metrics.poolHits / (this._metrics.poolHits + this._metrics.poolMisses) : 0, i = { hasCapacity: this.getTotalPoolSize() < this.maxPoolSize * this._pools.size, goodHitRate: t > 0.5 || this._metrics.poolHits + this._metrics.poolMisses < 10, loggerReady: !!e, portsInitialized: oe.isInitialized() }, n = Object.values(i).filter(Boolean).length;
    return { status: n === 4 ? "HEALTHY" : "DEGRADED", score: `${n}/4`, hitRate: `${(t * 100).toFixed(1)}%`, totalPoolSize: this.getTotalPoolSize(), poolTypes: this._pools.size, checks: i, metrics: { ...this._metrics }, version: Lt, moduleId: Oe, portsInitialized: oe.isInitialized() };
  }
  info() {
    return { version: Lt, moduleId: Oe, maxPoolSize: this.maxPoolSize, totalPoolSize: this.getTotalPoolSize(), poolTypes: [...this._pools.keys()], metrics: { ...this._metrics }, portsInitialized: oe.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 };
  }
}
const Ot = "1.2.0-P17WI", xe = "ticker.ui.skeleton", K = typeof document < "u", ae = d({ moduleId: xe });
function ti(s) {
  return ae.get(s);
}
const et = (s, ...e) => {
  const t = ti("logger");
  t != null && t[s] && t[s](`[${xe}]`, ...e);
}, Ni = ".ticker-skeleton { display: flex; gap: 16px; padding: 8px 16px; overflow: hidden; } .ticker-skeleton-item { display: flex; align-items: center; gap: 8px; flex-shrink: 0; } .ticker-skeleton-icon { width: 16px; height: 16px; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } .ticker-skeleton-text { height: 12px; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } .ticker-skeleton-text--short { width: 60px; } .ticker-skeleton-text--medium { width: 120px; } .ticker-skeleton-text--long { width: 200px; } .ticker-skeleton-text--xl { width: 280px; } .ticker-skeleton-tag { width: 40px; height: 16px; border-radius: 8px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } @keyframes ticker-skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .ticker-skeleton--paused .ticker-skeleton-icon, .ticker-skeleton--paused .ticker-skeleton-text, .ticker-skeleton--paused .ticker-skeleton-tag { animation-play-state: paused; }";
class Pi {
  constructor(e = {}) {
    this.container = e.container || null, this.itemCount = e.itemCount || 5, this.showTags = e.showTags ?? !0, this._element = null, this._styleElement = null, this._visible = !1, this._metrics = { shows: 0, hides: 0, totalVisibleTime: 0 }, this._showTime = null;
  }
  init(e) {
    return this.container = e || this.container, this._injectStyles(), et("debug", "SkeletonLoader initialized"), this;
  }
  _injectStyles() {
    !K || document.getElementById("ticker-skeleton-styles") || (this._styleElement = document.createElement("style"), this._styleElement.id = "ticker-skeleton-styles", this._styleElement.textContent = Ni, document.head.appendChild(this._styleElement));
  }
  show() {
    this._visible || !this.container || !K || (this._element = this._createSkeleton(), this.container.innerHTML = "", this.container.appendChild(this._element), this._visible = !0, this._showTime = Date.now(), this._metrics.shows++, et("debug", "Skeleton shown"));
  }
  hide() {
    this._visible && (this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._visible = !1, this._showTime && (this._metrics.totalVisibleTime += Date.now() - this._showTime, this._showTime = null), this._metrics.hides++, et("debug", "Skeleton hidden"));
  }
  _createSkeleton() {
    if (!K) return null;
    const e = document.createElement("div");
    e.className = "ticker-skeleton", e.setAttribute("role", "status"), e.setAttribute("aria-label", "Carregando...");
    for (let t = 0; t < this.itemCount; t++)
      e.appendChild(this._createSkeletonItem(t));
    return e;
  }
  _createSkeletonItem(e) {
    if (!K) return null;
    const t = document.createElement("div");
    t.className = "ticker-skeleton-item";
    const i = document.createElement("div");
    i.className = "ticker-skeleton-icon", i.style.animationDelay = `${e * 0.1}s`, t.appendChild(i);
    const n = document.createElement("div");
    n.className = "ticker-skeleton-text ticker-skeleton-text--short", n.style.animationDelay = `${e * 0.1 + 0.05}s`, t.appendChild(n);
    const r = ["long", "xl", "medium", "long", "xl"], o = document.createElement("div");
    if (o.className = `ticker-skeleton-text ticker-skeleton-text--${r[e % r.length]}`, o.style.animationDelay = `${e * 0.1 + 0.1}s`, t.appendChild(o), this.showTags) {
      const a = document.createElement("div");
      a.className = "ticker-skeleton-tag", a.style.animationDelay = `${e * 0.1 + 0.15}s`, t.appendChild(a);
    }
    return t;
  }
  pause() {
    this._element && this._element.classList.add("ticker-skeleton--paused");
  }
  resume() {
    this._element && this._element.classList.remove("ticker-skeleton--paused");
  }
  isVisible() {
    return this._visible;
  }
  destroy() {
    this.hide(), this._styleElement && this._styleElement.parentNode && this._styleElement.parentNode.removeChild(this._styleElement), this._styleElement = null, this.container = null;
  }
  healthCheck() {
    const e = ti("logger"), t = { hasContainer: !!this.container, stylesInjected: !!document.getElementById("ticker-skeleton-styles"), loggerReady: !!e, portsInitialized: ae.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, visible: this._visible, checks: t, metrics: { ...this._metrics }, version: Ot, moduleId: xe, portsInitialized: ae.isInitialized() };
  }
  info() {
    return { version: Ot, moduleId: xe, visible: this._visible, itemCount: this.itemCount, metrics: { ...this._metrics }, portsInitialized: ae.isInitialized() };
  }
}
const xt = "1.2.0-P17WI", Re = "ticker.ui.lazy-images", le = d({ moduleId: Re });
function ii(s) {
  return le.get(s);
}
const L = (s, ...e) => {
  const t = ii("logger");
  t != null && t[s] && t[s](`[${Re}]`, ...e);
};
class Mi {
  constructor(e = {}) {
    this.rootMargin = e.rootMargin || "50px", this.threshold = e.threshold || 0.1, this.placeholderSrc = e.placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23333" width="40" height="40"/%3E%3C/svg%3E', this._observer = null, this._loadedImages = /* @__PURE__ */ new Set(), this._pendingImages = /* @__PURE__ */ new Set(), this._metrics = { observed: 0, loaded: 0, errors: 0, cached: 0 };
  }
  init() {
    return typeof IntersectionObserver > "u" ? (L("warn", "IntersectionObserver not supported, loading all images immediately"), this) : (this._observer = new IntersectionObserver(this._onIntersection.bind(this), { rootMargin: this.rootMargin, threshold: this.threshold }), L("debug", "LazyImageLoader initialized"), this);
  }
  observe(e) {
    if (!e || !this._observer) return;
    const t = e.dataset.src || e.dataset.lazySrc;
    if (t) {
      if (this._loadedImages.has(t)) {
        this._applyImage(e, t), this._metrics.cached++;
        return;
      }
      e.src = this.placeholderSrc, e.classList.add("ticker-lazy-image", "ticker-lazy-image--pending"), this._observer.observe(e), this._pendingImages.add(e), this._metrics.observed++;
    }
  }
  observeAll(e, t = "[data-lazy-src], [data-src]") {
    if (!e) return;
    const i = e.querySelectorAll(t);
    i.forEach((n) => this.observe(n)), L("debug", `Observing ${i.length} images`);
  }
  _onIntersection(e) {
    e.forEach((t) => {
      t.isIntersecting && (this._loadImage(t.target), this._observer.unobserve(t.target), this._pendingImages.delete(t.target));
    });
  }
  _loadImage(e) {
    const t = e.dataset.src || e.dataset.lazySrc;
    if (!t) return;
    e.classList.remove("ticker-lazy-image--pending"), e.classList.add("ticker-lazy-image--loading");
    const i = new Image();
    i.onload = () => {
      this._applyImage(e, t), e.classList.remove("ticker-lazy-image--loading"), e.classList.add("ticker-lazy-image--loaded"), this._loadedImages.add(t), this._metrics.loaded++, L("debug", `Image loaded: ${t.substring(0, 50)}...`);
    }, i.onerror = () => {
      e.classList.remove("ticker-lazy-image--loading"), e.classList.add("ticker-lazy-image--error"), this._metrics.errors++, L("warn", `Image failed: ${t.substring(0, 50)}...`);
    }, i.src = t;
  }
  _applyImage(e, t) {
    e.tagName === "IMG" ? e.src = t : e.style.backgroundImage = `url(${t})`;
  }
  unobserve(e) {
    this._observer && e && (this._observer.unobserve(e), this._pendingImages.delete(e));
  }
  preload(e) {
    Array.isArray(e) && (e.forEach((t) => {
      if (this._loadedImages.has(t)) return;
      const i = new Image();
      i.onload = () => {
        this._loadedImages.add(t), this._metrics.loaded++;
      }, i.onerror = () => {
        this._metrics.errors++;
      }, i.src = t;
    }), L("debug", `Preloading ${e.length} images`));
  }
  clearCache() {
    this._loadedImages.clear(), L("debug", "Image cache cleared");
  }
  destroy() {
    this._observer && (this._observer.disconnect(), this._observer = null), this._pendingImages.clear(), this._loadedImages.clear();
  }
  healthCheck() {
    const e = ii("logger"), t = { observerActive: !!this._observer, hasCapacity: this._pendingImages.size < 100, loggerReady: !!e, portsInitialized: le.isInitialized() }, i = Object.values(t).filter(Boolean).length, n = this._metrics.observed > 0 ? this._metrics.loaded / this._metrics.observed : 1;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, loadRate: `${(n * 100).toFixed(1)}%`, pendingCount: this._pendingImages.size, cachedCount: this._loadedImages.size, checks: t, metrics: { ...this._metrics }, version: xt, moduleId: Re, portsInitialized: le.isInitialized() };
  }
  info() {
    return { version: xt, moduleId: Re, pendingCount: this._pendingImages.size, cachedCount: this._loadedImages.size, metrics: { ...this._metrics }, portsInitialized: le.isInitialized() };
  }
}
const Rt = "1.4.0-P17WI", $e = "ticker.ui.modal", Hi = typeof window < "u", F = typeof document < "u", ce = d({ moduleId: $e });
function si(s) {
  return ce.get(s);
}
const W = (s, ...e) => {
  const t = si("logger");
  t != null && t[s] && t[s](`[${$e}]`, ...e);
}, Fi = ".ticker-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity 0.2s,visibility 0.2s}.ticker-modal-overlay--visible{opacity:1;visibility:visible}.ticker-modal{background:var(--surface-card,#1a1a2e);border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow:hidden;transform:translateY(20px) scale(0.95);transition:transform 0.2s;box-shadow:0 20px 60px rgba(0,0,0,0.5)}.ticker-modal-overlay--visible .ticker-modal{transform:translateY(0) scale(1)}.ticker-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1)}.ticker-modal-source{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.6)}.ticker-modal-source svg{width:16px;height:16px}.ticker-modal-close{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:8px;border-radius:8px;transition:background 0.2s,color 0.2s}.ticker-modal-close:hover{background:rgba(255,255,255,0.1);color:#fff}.ticker-modal-body{padding:20px;overflow-y:auto;max-height:calc(80vh - 140px)}.ticker-modal-category{display:inline-block;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:12px;background:var(--accent-color,#4a9eff);color:#fff}.ticker-modal-title{font-size:20px;font-weight:600;line-height:1.4;color:#fff;margin:0 0 12px 0}.ticker-modal-meta{display:flex;gap:16px;font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:16px}.ticker-modal-summary{font-size:15px;line-height:1.6;color:rgba(255,255,255,0.8)}.ticker-modal-footer{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1)}.ticker-modal-link{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent-color,#4a9eff);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;transition:opacity 0.2s}.ticker-modal-link:hover{opacity:0.9}.ticker-modal-share{display:flex;gap:8px}.ticker-modal-share-btn{background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.7);padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;transition:background 0.2s}.ticker-modal-share-btn:hover{background:rgba(255,255,255,0.2)}";
class Ui {
  constructor(e = {}) {
    this.onClose = e.onClose || null, this.onShare = e.onShare || null, this._overlay = null, this._modal = null, this._currentItem = null, this._isOpen = !1, this._focusTrap = null, this._previousFocus = null, this._metrics = { opens: 0, closes: 0, shares: 0, linkClicks: 0 }, this._boundKeyHandler = this._onKeyDown.bind(this), this._boundClickHandler = this._onOverlayClick.bind(this);
  }
  init() {
    return this._injectStyles(), this._createModal(), W("debug", "NewsModal initialized"), this;
  }
  _injectStyles() {
    if (!F || document.getElementById("ticker-modal-styles")) return;
    const e = document.createElement("style");
    e.id = "ticker-modal-styles", e.textContent = Fi, document.head.appendChild(e);
  }
  _createModal() {
    F && (this._overlay = document.createElement("div"), this._overlay.className = "ticker-modal-overlay", this._overlay.setAttribute("role", "dialog"), this._overlay.setAttribute("aria-modal", "true"), this._overlay.setAttribute("aria-hidden", "true"), this._modal = document.createElement("div"), this._modal.className = "ticker-modal", this._overlay.appendChild(this._modal), document.body.appendChild(this._overlay), this._overlay.addEventListener("click", this._boundClickHandler));
  }
  open(e) {
    var t;
    !e || this._isOpen || !F || (this._currentItem = e, this._previousFocus = document.activeElement, this._renderContent(e), this._overlay.classList.add("ticker-modal-overlay--visible"), this._overlay.setAttribute("aria-hidden", "false"), this._isOpen = !0, this._metrics.opens++, document.addEventListener("keydown", this._boundKeyHandler), document.body.style.overflow = "hidden", setTimeout(() => {
      const i = this._modal.querySelector(".ticker-modal-close");
      i && i.focus();
    }, 100), W("debug", "Modal opened", { title: (t = e.title) == null ? void 0 : t.substring(0, 30) }));
  }
  close() {
    !this._isOpen || !F || (this._overlay.classList.remove("ticker-modal-overlay--visible"), this._overlay.setAttribute("aria-hidden", "true"), this._isOpen = !1, this._currentItem = null, this._metrics.closes++, document.removeEventListener("keydown", this._boundKeyHandler), document.body.style.overflow = "", this._previousFocus && (this._previousFocus.focus(), this._previousFocus = null), this.onClose && this.onClose(), W("debug", "Modal closed"));
  }
  _renderContent(e) {
    const t = e.category || "geral", i = this._formatTime(e.published_at), n = e.source || "Fonte";
    this._modal.innerHTML = `<div class="ticker-modal-header"><div class="ticker-modal-source"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span>${this._escapeHtml(n)}</span></div><button class="ticker-modal-close" aria-label="Fechar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><div class="ticker-modal-body"><span class="ticker-modal-category">${this._escapeHtml(t)}</span><h2 class="ticker-modal-title">${this._escapeHtml(e.title || "")}</h2><div class="ticker-modal-meta"><span>${i}</span></div>${e.summary ? `<p class="ticker-modal-summary">${this._escapeHtml(e.summary)}</p>` : ""}</div><div class="ticker-modal-footer"><a href="${e.url || "#"}" target="_blank" rel="noopener noreferrer" class="ticker-modal-link">Ler materia completa<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a><div class="ticker-modal-share"><button class="ticker-modal-share-btn" data-share="copy">Copiar link</button><button class="ticker-modal-share-btn" data-share="native">Compartilhar</button></div></div>`, this._modal.querySelector(".ticker-modal-close").addEventListener("click", () => this.close()), this._modal.querySelector(".ticker-modal-link").addEventListener("click", () => {
      this._metrics.linkClicks++;
    }), this._modal.querySelectorAll(".ticker-modal-share-btn").forEach((r) => {
      r.addEventListener("click", () => this._handleShare(r.dataset.share, e));
    });
  }
  _handleShare(e, t) {
    var i;
    if (this._metrics.shares++, e === "copy") {
      const n = t.url || (Hi && window.location ? window.location.href : "");
      (i = navigator.clipboard) == null || i.writeText(n).then(() => {
        W("debug", "Link copied");
      });
    } else e === "native" && navigator.share && navigator.share({ title: t.title, url: t.url }).catch(() => {
    });
    this.onShare && this.onShare(e, t);
  }
  _onKeyDown(e) {
    e.key === "Escape" && this.close();
  }
  _onOverlayClick(e) {
    e.target === this._overlay && this.close();
  }
  _formatTime(e) {
    if (!e) return "";
    try {
      return new Date(e).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }
  _escapeHtml(e) {
    if (!e || !F) return "";
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML;
  }
  isOpen() {
    return this._isOpen;
  }
  getCurrentItem() {
    return this._currentItem;
  }
  destroy() {
    this.close(), this._overlay && this._overlay.parentNode && this._overlay.parentNode.removeChild(this._overlay), this._overlay = null, this._modal = null;
  }
  healthCheck() {
    const e = si("logger"), t = { hasOverlay: !!this._overlay, hasModal: !!this._modal, loggerReady: !!e, portsInitialized: ce.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, isOpen: this._isOpen, checks: t, metrics: { ...this._metrics }, version: Rt, moduleId: $e, portsInitialized: ce.isInitialized() };
  }
  info() {
    return { version: Rt, moduleId: $e, isOpen: this._isOpen, metrics: { ...this._metrics }, portsInitialized: ce.isInitialized() };
  }
}
const $t = "1.2.0-P17WI", ze = "ticker.ui.notification-badge", zt = typeof document < "u", he = d({ moduleId: ze });
function ni(s) {
  return he.get(s);
}
const z = (s, ...e) => {
  const t = ni("logger");
  t != null && t[s] && t[s](`[${ze}]`, ...e);
}, Bi = ".ticker-badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 600; border-radius: 9px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.5); transition: opacity 0.2s, transform 0.2s; pointer-events: none; z-index: 10; } .ticker-badge--visible { opacity: 1; transform: scale(1); } .ticker-badge--pulse { animation: ticker-badge-pulse 1s ease-in-out infinite; } @keyframes ticker-badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } } .ticker-badge-container { position: relative; display: inline-flex; }";
class ji {
  constructor(e = {}) {
    this.maxCount = e.maxCount || 99, this.pulseOnUpdate = e.pulseOnUpdate ?? !0, this.storageKey = e.storageKey || "ticker_last_seen", this._badge = null, this._container = null, this._count = 0, this._lastSeenIds = /* @__PURE__ */ new Set(), this._metrics = { updates: 0, clears: 0, totalNewItems: 0 };
  }
  init(e) {
    return this._injectStyles(), this._container = e, this._loadLastSeen(), z("debug", "NotificationBadge initialized"), this;
  }
  _injectStyles() {
    if (!zt || document.getElementById("ticker-badge-styles")) return;
    const e = document.createElement("style");
    e.id = "ticker-badge-styles", e.textContent = Bi, document.head.appendChild(e);
  }
  attachTo(e) {
    if (!e || !zt) return null;
    const t = document.createElement("div");
    return t.className = "ticker-badge-container", e.parentNode.insertBefore(t, e), t.appendChild(e), this._badge = document.createElement("span"), this._badge.className = "ticker-badge", this._badge.setAttribute("aria-live", "polite"), this._badge.setAttribute("role", "status"), t.appendChild(this._badge), this._container = t, t;
  }
  update(e) {
    if (!Array.isArray(e)) return 0;
    const t = e.filter((i) => {
      const n = i.id || this._generateId(i);
      return !this._lastSeenIds.has(n);
    });
    if (this._count = t.length, this._metrics.updates++, this._metrics.totalNewItems += t.length, this._badge)
      if (this._count > 0) {
        const i = this._count > this.maxCount ? `${this.maxCount}+` : this._count;
        this._badge.textContent = i, this._badge.classList.add("ticker-badge--visible"), this.pulseOnUpdate && (this._badge.classList.add("ticker-badge--pulse"), setTimeout(() => {
          var n;
          return (n = this._badge) == null ? void 0 : n.classList.remove("ticker-badge--pulse");
        }, 3e3)), this._badge.setAttribute("aria-label", `${this._count} nova(s) noticia(s)`);
      } else
        this._badge.classList.remove("ticker-badge--visible", "ticker-badge--pulse");
    return z("debug", `Badge updated: ${this._count} new items`), this._count;
  }
  markAllSeen(e) {
    Array.isArray(e) && (e.forEach((t) => {
      const i = t.id || this._generateId(t);
      this._lastSeenIds.add(i);
    }), this._count = 0, this._badge && this._badge.classList.remove("ticker-badge--visible", "ticker-badge--pulse"), this._saveLastSeen(), this._metrics.clears++, z("debug", "All items marked as seen"));
  }
  clear() {
    this._count = 0, this._badge && this._badge.classList.remove("ticker-badge--visible", "ticker-badge--pulse"), z("debug", "Badge cleared");
  }
  _generateId(e) {
    const t = e.title || "";
    return `${e.source || ""}-${t.substring(0, 50)}`.toLowerCase().replace(/\s+/g, "-");
  }
  _loadLastSeen() {
    try {
      const e = localStorage.getItem(this.storageKey);
      if (e) {
        const t = JSON.parse(e);
        this._lastSeenIds = new Set(t.ids || []);
      }
    } catch (e) {
      z("warn", "Failed to load last seen", { error: e.message });
    }
  }
  _saveLastSeen() {
    try {
      const e = [...this._lastSeenIds].slice(-500);
      localStorage.setItem(this.storageKey, JSON.stringify({ ids: e, timestamp: Date.now() }));
    } catch (e) {
      z("warn", "Failed to save last seen", { error: e.message });
    }
  }
  getCount() {
    return this._count;
  }
  destroy() {
    this._badge && this._badge.parentNode && this._badge.parentNode.removeChild(this._badge), this._badge = null, this._container = null;
  }
  healthCheck() {
    const e = ni("logger"), t = { hasBadge: !!this._badge, hasStorage: typeof localStorage < "u", loggerReady: !!e, portsInitialized: he.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, count: this._count, seenCount: this._lastSeenIds.size, checks: t, metrics: { ...this._metrics }, version: $t, moduleId: ze, portsInitialized: he.isInitialized() };
  }
  info() {
    return { version: $t, moduleId: ze, count: this._count, seenCount: this._lastSeenIds.size, metrics: { ...this._metrics }, portsInitialized: he.isInitialized() };
  }
}
const Nt = "1.3.0-P17WI", Ne = "ticker.gestures.pull-refresh", Gi = typeof window < "u", ue = d({ moduleId: Ne });
function Yi(s) {
  return ue.get(s);
}
function J(s, ...e) {
  const t = Yi("logger");
  t != null && t[s] && t[s](`[${Ne}]`, ...e);
}
function qi() {
  return Gi ? "ontouchstart" in window || navigator.maxTouchPoints > 0 : !1;
}
class Vi {
  constructor(e = {}) {
    this.threshold = e.threshold || 60, this.resistance = e.resistance || 2.5, this.onRefresh = e.onRefresh || null, this._container = null, this._indicator = null, this._startY = 0, this._currentY = 0, this._pulling = !1, this._refreshing = !1, this._enabled = !0, this._isTouchDevice = qi(), this._metrics = { pulls: 0, refreshes: 0, cancels: 0 }, this._boundTouchStart = this._onTouchStart.bind(this), this._boundTouchMove = this._onTouchMove.bind(this), this._boundTouchEnd = this._onTouchEnd.bind(this);
  }
  init(e) {
    return e ? (this._container = e, this._isTouchDevice ? (this._createIndicator(), this._attachEvents(), J("debug", "PullToRefresh initialized (touch device)")) : J("debug", "PullToRefresh skipped (non-touch device)"), this) : this;
  }
  _createIndicator() {
    this._indicator = document.createElement("div"), this._indicator.className = "ticker-pull-indicator", this._indicator.setAttribute("aria-hidden", "true"), this._indicator.innerHTML = '<svg class="ticker-pull-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span class="ticker-pull-text">Puxe para atualizar</span>', this._container.style.position = "relative", this._container.appendChild(this._indicator);
  }
  _attachEvents() {
    this._container.addEventListener("touchstart", this._boundTouchStart, { passive: !0 }), this._container.addEventListener("touchmove", this._boundTouchMove, { passive: !1 }), this._container.addEventListener("touchend", this._boundTouchEnd, { passive: !0 });
  }
  _onTouchStart(e) {
    !this._enabled || this._refreshing || this._container.scrollLeft > 0 || (this._startY = e.touches[0].clientY, this._pulling = !0, this._metrics.pulls++);
  }
  _onTouchMove(e) {
    if (!this._pulling || this._refreshing || !this._indicator) return;
    this._currentY = e.touches[0].clientY;
    const t = (this._currentY - this._startY) / this.resistance;
    if (t > 0) {
      e.preventDefault(), this._indicator.classList.contains("ticker-pull-indicator--active") || this._indicator.classList.add("ticker-pull-indicator--active");
      const i = Math.min(t / this.threshold, 1);
      this._updateIndicator(t, i);
    }
  }
  _onTouchEnd() {
    if (!this._pulling) return;
    (this._currentY - this._startY) / this.resistance >= this.threshold && !this._refreshing ? this._triggerRefresh() : (this._resetIndicator(), this._metrics.cancels++), this._pulling = !1, this._startY = 0, this._currentY = 0;
  }
  _updateIndicator(e, t) {
    if (!this._indicator) return;
    this._indicator.style.transform = `translateX(-50%) translateY(${Math.min(e, this.threshold)}px)`;
    const i = this._indicator.querySelector(".ticker-pull-text");
    i && (i.textContent = t >= 1 ? "Solte para atualizar" : "Puxe para atualizar");
  }
  _resetIndicator() {
    this._indicator && (this._indicator.style.transform = "", this._indicator.classList.remove("ticker-pull-indicator--active", "ticker-pull-indicator--visible", "ticker-pull-indicator--refreshing"));
  }
  async _triggerRefresh() {
    if (this._refreshing = !0, this._metrics.refreshes++, this._indicator) {
      this._indicator.classList.add("ticker-pull-indicator--active", "ticker-pull-indicator--visible", "ticker-pull-indicator--refreshing");
      const e = this._indicator.querySelector(".ticker-pull-text");
      e && (e.textContent = "Atualizando...");
    }
    J("debug", "Refresh triggered");
    try {
      this.onRefresh && await this.onRefresh();
    } catch (e) {
      J("warn", "Refresh failed", { error: e.message });
    } finally {
      setTimeout(() => {
        this._resetIndicator(), this._refreshing = !1;
      }, 500);
    }
  }
  enable() {
    this._enabled = !0;
  }
  disable() {
    this._enabled = !1;
  }
  isRefreshing() {
    return this._refreshing;
  }
  isTouchDevice() {
    return this._isTouchDevice;
  }
  destroy() {
    this._container && (this._container.removeEventListener("touchstart", this._boundTouchStart), this._container.removeEventListener("touchmove", this._boundTouchMove), this._container.removeEventListener("touchend", this._boundTouchEnd)), this._indicator && this._indicator.parentNode && this._indicator.parentNode.removeChild(this._indicator), this._container = null, this._indicator = null;
  }
  healthCheck() {
    const e = { hasContainer: !!this._container, hasIndicator: !!this._indicator || !this._isTouchDevice, enabled: this._enabled, portsInitialized: ue.isInitialized() }, t = Object.values(e).filter(Boolean).length;
    return { status: t === 4 ? "HEALTHY" : "DEGRADED", score: `${t}/4`, refreshing: this._refreshing, isTouchDevice: this._isTouchDevice, checks: e, metrics: { ...this._metrics }, version: Nt, moduleId: Ne, portsInitialized: ue.isInitialized() };
  }
  info() {
    return { version: Nt, moduleId: Ne, enabled: this._enabled, refreshing: this._refreshing, isTouchDevice: this._isTouchDevice, threshold: this.threshold, metrics: { ...this._metrics }, portsInitialized: ue.isInitialized() };
  }
}
const Pt = "1.2.0-P17WI", Pe = "ticker.gestures.swipe-nav", de = d({ moduleId: Pe });
function Ki(s) {
  return de.get(s);
}
function U(s, ...e) {
  const t = Ki("logger");
  t != null && t[s] && t[s](`[${Pe}]`, ...e);
}
class Wi {
  constructor(e = {}) {
    this.threshold = e.threshold || 50, this.velocityThreshold = e.velocityThreshold || 0.3, this.onSwipeLeft = e.onSwipeLeft || null, this.onSwipeRight = e.onSwipeRight || null, this.onSwipeUp = e.onSwipeUp || null, this.onSwipeDown = e.onSwipeDown || null, this._container = null, this._startX = 0, this._startY = 0, this._startTime = 0, this._tracking = !1, this._enabled = !0, this._metrics = { swipes: 0, left: 0, right: 0, up: 0, down: 0 }, this._boundTouchStart = this._onTouchStart.bind(this), this._boundTouchMove = this._onTouchMove.bind(this), this._boundTouchEnd = this._onTouchEnd.bind(this);
  }
  init(e) {
    return e ? (this._container = e, this._attachEvents(), U("debug", "SwipeNavigator initialized"), this) : this;
  }
  _attachEvents() {
    this._container.addEventListener("touchstart", this._boundTouchStart, { passive: !0 }), this._container.addEventListener("touchmove", this._boundTouchMove, { passive: !0 }), this._container.addEventListener("touchend", this._boundTouchEnd, { passive: !0 });
  }
  _onTouchStart(e) {
    !this._enabled || e.touches.length !== 1 || (this._startX = e.touches[0].clientX, this._startY = e.touches[0].clientY, this._startTime = Date.now(), this._tracking = !0);
  }
  _onTouchMove(e) {
    this._tracking;
  }
  _onTouchEnd(e) {
    if (!this._tracking) return;
    this._tracking = !1;
    const t = e.changedTouches[0], i = t.clientX - this._startX, n = t.clientY - this._startY, r = Date.now() - this._startTime, o = Math.abs(i) / r, a = Math.abs(n) / r, c = Math.abs(i), l = Math.abs(n);
    c < this.threshold && l < this.threshold || o < this.velocityThreshold && a < this.velocityThreshold || (this._metrics.swipes++, c > l ? i > 0 ? (this._metrics.right++, this.onSwipeRight && this.onSwipeRight({ deltaX: i, deltaY: n, velocity: o }), U("debug", "Swipe right detected")) : (this._metrics.left++, this.onSwipeLeft && this.onSwipeLeft({ deltaX: i, deltaY: n, velocity: o }), U("debug", "Swipe left detected")) : n > 0 ? (this._metrics.down++, this.onSwipeDown && this.onSwipeDown({ deltaX: i, deltaY: n, velocity: a }), U("debug", "Swipe down detected")) : (this._metrics.up++, this.onSwipeUp && this.onSwipeUp({ deltaX: i, deltaY: n, velocity: a }), U("debug", "Swipe up detected")));
  }
  enable() {
    this._enabled = !0;
  }
  disable() {
    this._enabled = !1;
  }
  destroy() {
    this._container && (this._container.removeEventListener("touchstart", this._boundTouchStart), this._container.removeEventListener("touchmove", this._boundTouchMove), this._container.removeEventListener("touchend", this._boundTouchEnd)), this._container = null;
  }
  healthCheck() {
    const e = { hasContainer: !!this._container, enabled: this._enabled, portsInitialized: de.isInitialized() }, t = Object.values(e).filter(Boolean).length;
    return { status: t === 3 ? "HEALTHY" : "DEGRADED", score: `${t}/3`, checks: e, metrics: { ...this._metrics }, version: Pt, moduleId: Pe, portsInitialized: de.isInitialized() };
  }
  info() {
    return { version: Pt, moduleId: Pe, enabled: this._enabled, threshold: this.threshold, metrics: { ...this._metrics }, portsInitialized: de.isInitialized() };
  }
}
const Mt = "1.2.0-P17WI", Me = "ticker.gestures.scroll-snap", ge = d({ moduleId: Me });
function Ji(s) {
  return ge.get(s);
}
function tt(s, ...e) {
  const t = Ji("logger");
  t != null && t[s] && t[s](`[${Me}]`, ...e);
}
const Xi = ".ticker-scroll-snap { scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; } .ticker-scroll-snap-item { scroll-snap-align: start; scroll-snap-stop: normal; } .ticker-scroll-snap--center .ticker-scroll-snap-item { scroll-snap-align: center; } .ticker-scroll-snap--end .ticker-scroll-snap-item { scroll-snap-align: end; }";
class Qi {
  constructor(e = {}) {
    this.alignment = e.alignment || "start", this.itemSelector = e.itemSelector || ".ticker-item", this.debounceMs = e.debounceMs || 100, this._container = null, this._currentIndex = 0, this._items = [], this._enabled = !0, this._scrollTimeout = null, this._metrics = { snaps: 0, scrolls: 0 }, this._boundScrollHandler = this._onScroll.bind(this), this._subscribers = /* @__PURE__ */ new Set();
  }
  init(e) {
    return e ? (this._container = e, this._injectStyles(), this._applyClasses(), this._attachEvents(), this.refresh(), tt("debug", "ScrollSnap initialized"), this) : this;
  }
  _injectStyles() {
    if (document.getElementById("ticker-scroll-snap-styles")) return;
    const e = document.createElement("style");
    e.id = "ticker-scroll-snap-styles", e.textContent = Xi, document.head.appendChild(e);
  }
  _applyClasses() {
    this._container.classList.add("ticker-scroll-snap"), this.alignment !== "start" && this._container.classList.add(`ticker-scroll-snap--${this.alignment}`);
  }
  _attachEvents() {
    this._container.addEventListener("scroll", this._boundScrollHandler, { passive: !0 });
  }
  _onScroll() {
    this._metrics.scrolls++, this._scrollTimeout && clearTimeout(this._scrollTimeout), this._scrollTimeout = setTimeout(() => {
      this._detectCurrentItem();
    }, this.debounceMs);
  }
  _detectCurrentItem() {
    if (!this._items.length) return;
    const e = this._container.getBoundingClientRect(), t = e.left + e.width / 2;
    let i = 0, n = 1 / 0;
    if (this._items.forEach((r, o) => {
      const a = r.getBoundingClientRect(), c = a.left + a.width / 2, l = Math.abs(t - c);
      l < n && (n = l, i = o);
    }), i !== this._currentIndex) {
      const r = this._currentIndex;
      this._currentIndex = i, this._metrics.snaps++, this._notifySubscribers({ oldIndex: r, newIndex: i, item: this._items[i] }), tt("debug", `Snapped to item ${i}`);
    }
  }
  refresh() {
    this._items = Array.from(this._container.querySelectorAll(this.itemSelector)), this._items.forEach((e) => e.classList.add("ticker-scroll-snap-item")), tt("debug", `Refreshed: ${this._items.length} items`);
  }
  scrollToIndex(e, t = "smooth") {
    if (e < 0 || e >= this._items.length) return;
    const i = this._items[e];
    i && (i.scrollIntoView({ behavior: t, block: "nearest", inline: this.alignment }), this._currentIndex = e);
  }
  next() {
    const e = Math.min(this._currentIndex + 1, this._items.length - 1);
    this.scrollToIndex(e);
  }
  previous() {
    const e = Math.max(this._currentIndex - 1, 0);
    this.scrollToIndex(e);
  }
  first() {
    this.scrollToIndex(0);
  }
  last() {
    this.scrollToIndex(this._items.length - 1);
  }
  getCurrentIndex() {
    return this._currentIndex;
  }
  getCurrentItem() {
    return this._items[this._currentIndex] || null;
  }
  getItemCount() {
    return this._items.length;
  }
  subscribe(e) {
    return this._subscribers.add(e), () => this._subscribers.delete(e);
  }
  _notifySubscribers(e) {
    this._subscribers.forEach((t) => {
      try {
        t(e);
      } catch {
      }
    });
  }
  enable() {
    var e;
    this._enabled = !0, (e = this._container) == null || e.classList.add("ticker-scroll-snap");
  }
  disable() {
    var e;
    this._enabled = !1, (e = this._container) == null || e.classList.remove("ticker-scroll-snap");
  }
  destroy() {
    this._scrollTimeout && clearTimeout(this._scrollTimeout), this._container && (this._container.removeEventListener("scroll", this._boundScrollHandler), this._container.classList.remove("ticker-scroll-snap", `ticker-scroll-snap--${this.alignment}`)), this._items.forEach((e) => e.classList.remove("ticker-scroll-snap-item")), this._container = null, this._items = [], this._subscribers.clear();
  }
  healthCheck() {
    const e = { hasContainer: !!this._container, hasItems: this._items.length > 0, enabled: this._enabled, portsInitialized: ge.isInitialized() }, t = Object.values(e).filter(Boolean).length;
    return { status: t === 4 ? "HEALTHY" : "DEGRADED", score: `${t}/4`, itemCount: this._items.length, currentIndex: this._currentIndex, checks: e, metrics: { ...this._metrics }, version: Mt, moduleId: Me, portsInitialized: ge.isInitialized() };
  }
  info() {
    return { version: Mt, moduleId: Me, enabled: this._enabled, itemCount: this._items.length, currentIndex: this._currentIndex, alignment: this.alignment, metrics: { ...this._metrics }, portsInitialized: ge.isInitialized() };
  }
}
const Ht = "1.3.0-P17WI", He = "ticker.accessibility.keyboard-nav", _e = d({ moduleId: He });
function ri(s) {
  return _e.get(s);
}
const B = (s, ...e) => {
  const t = ri("logger");
  t != null && t[s] && t[s](`[${He}]`, ...e);
};
class Zi {
  constructor(e = {}) {
    this.itemSelector = e.itemSelector || ".ticker-item", this.loop = e.loop ?? !0, this.onNavigate = e.onNavigate || null, this.onSelect = e.onSelect || null, this.onEscape = e.onEscape || null, this._container = null, this._items = [], this._currentIndex = -1, this._enabled = !0, this._focused = !1, this._keyboardActive = !1, this._metrics = { navigations: 0, selections: 0, escapes: 0 }, this._boundKeyHandler = this._onKeyDown.bind(this), this._boundFocusIn = this._onFocusIn.bind(this), this._boundFocusOut = this._onFocusOut.bind(this);
  }
  init(e) {
    return e ? (this._container = e, this._container.setAttribute("role", "list"), this._container.setAttribute("tabindex", "0"), this._container.setAttribute("aria-label", "Ticker de noticias - Use as setas para navegar"), this._attachEvents(), this.refresh(), B("debug", "KeyboardNavigator initialized"), this) : this;
  }
  _attachEvents() {
    this._container.addEventListener("keydown", this._boundKeyHandler), this._container.addEventListener("focusin", this._boundFocusIn), this._container.addEventListener("focusout", this._boundFocusOut);
  }
  _onKeyDown(e) {
    if (!this._enabled || !this._items.length) return;
    switch (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End", "Enter", " ", "Escape"].includes(e.key) && (this._keyboardActive = !0), e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault(), this._navigatePrevious();
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault(), this._navigateNext();
        break;
      case "Home":
        e.preventDefault(), this._navigateFirst();
        break;
      case "End":
        e.preventDefault(), this._navigateLast();
        break;
      case "Enter":
      case " ":
        e.preventDefault(), this._selectCurrent();
        break;
      case "Escape":
        this._onEscapePressed();
        break;
    }
  }
  _onFocusIn() {
    var e;
    this._focused = !0, this._currentIndex === -1 && this._items.length > 0 && (this._currentIndex = 0, (e = this._items[0]) == null || e.setAttribute("tabindex", "0"));
  }
  _onFocusOut(e) {
    this._container.contains(e.relatedTarget) || (this._focused = !1, this._keyboardActive = !1, this._clearAllHighlights());
  }
  _clearAllHighlights() {
    this._items.forEach((e) => {
      e.classList.remove("ticker-item--focused"), e.setAttribute("aria-selected", "false");
    });
  }
  _navigateNext() {
    this._currentIndex >= this._items.length - 1 ? this.loop && this._setCurrentIndex(0) : this._setCurrentIndex(this._currentIndex + 1), this._metrics.navigations++;
  }
  _navigatePrevious() {
    this._currentIndex <= 0 ? this.loop && this._setCurrentIndex(this._items.length - 1) : this._setCurrentIndex(this._currentIndex - 1), this._metrics.navigations++;
  }
  _navigateFirst() {
    this._setCurrentIndex(0), this._metrics.navigations++;
  }
  _navigateLast() {
    this._setCurrentIndex(this._items.length - 1), this._metrics.navigations++;
  }
  _setCurrentIndex(e) {
    if (e < 0 || e >= this._items.length) return;
    this._items.forEach((n, r) => {
      n.setAttribute("tabindex", r === e ? "0" : "-1");
      const o = this._keyboardActive && r === e;
      n.classList.toggle("ticker-item--focused", o), n.setAttribute("aria-selected", r === e ? "true" : "false");
    });
    const t = this._currentIndex;
    this._currentIndex = e;
    const i = this._items[e];
    i && this._keyboardActive && (i.focus(), i.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })), this.onNavigate && this.onNavigate({ oldIndex: t, newIndex: e, item: i }), B("debug", `Navigated to item ${e}`, { keyboardActive: this._keyboardActive });
  }
  _selectCurrent() {
    if (this._currentIndex < 0) return;
    const e = this._items[this._currentIndex];
    if (!e) return;
    this._metrics.selections++;
    const t = e.querySelector("a");
    t ? t.click() : this.onSelect && this.onSelect({ index: this._currentIndex, item: e }), B("debug", `Selected item ${this._currentIndex}`);
  }
  _onEscapePressed() {
    this._metrics.escapes++, this._keyboardActive = !1, this._clearAllHighlights(), this._container.blur(), this.onEscape && this.onEscape(), B("debug", "Escape pressed");
  }
  refresh() {
    this._items = Array.from(this._container.querySelectorAll(this.itemSelector)), this._items.forEach((e, t) => {
      e.setAttribute("role", "listitem"), e.setAttribute("tabindex", t === this._currentIndex ? "0" : "-1"), e.setAttribute("aria-selected", "false"), e.classList.remove("ticker-item--focused");
    }), B("debug", `Refreshed: ${this._items.length} items`);
  }
  getCurrentIndex() {
    return this._currentIndex;
  }
  getCurrentItem() {
    return this._items[this._currentIndex] || null;
  }
  getItemCount() {
    return this._items.length;
  }
  isFocused() {
    return this._focused;
  }
  isKeyboardActive() {
    return this._keyboardActive;
  }
  enable() {
    this._enabled = !0;
  }
  disable() {
    this._enabled = !1;
  }
  destroy() {
    this._container && (this._container.removeEventListener("keydown", this._boundKeyHandler), this._container.removeEventListener("focusin", this._boundFocusIn), this._container.removeEventListener("focusout", this._boundFocusOut), this._container.removeAttribute("tabindex"), this._container.removeAttribute("role"), this._container.removeAttribute("aria-label")), this._items.forEach((e) => {
      e.removeAttribute("tabindex"), e.removeAttribute("role"), e.removeAttribute("aria-selected"), e.classList.remove("ticker-item--focused");
    }), this._container = null, this._items = [], this._keyboardActive = !1;
  }
  healthCheck() {
    const e = ri("logger"), t = { hasContainer: !!this._container, hasItems: this._items.length > 0, enabled: this._enabled, loggerReady: !!e, portsInitialized: _e.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 5 ? "HEALTHY" : "DEGRADED", score: `${i}/5`, itemCount: this._items.length, currentIndex: this._currentIndex, focused: this._focused, keyboardActive: this._keyboardActive, checks: t, metrics: { ...this._metrics }, version: Ht, moduleId: He, portsInitialized: _e.isInitialized() };
  }
  info() {
    return { version: Ht, moduleId: He, enabled: this._enabled, itemCount: this._items.length, currentIndex: this._currentIndex, focused: this._focused, keyboardActive: this._keyboardActive, loop: this.loop, metrics: { ...this._metrics }, portsInitialized: _e.isInitialized() };
  }
}
const Ft = "1.2.0-P17WI", Fe = "ticker.accessibility.focus-trap", Ut = typeof document < "u", fe = d({ moduleId: Fe });
function oi(s) {
  return fe.get(s);
}
const it = (s, ...e) => {
  const t = oi("logger");
  t != null && t[s] && t[s](`[${Fe}]`, ...e);
}, es = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
class ts {
  constructor(e = {}) {
    this.returnFocusOnDeactivate = e.returnFocusOnDeactivate ?? !0, this.escapeDeactivates = e.escapeDeactivates ?? !0, this.onActivate = e.onActivate || null, this.onDeactivate = e.onDeactivate || null, this._container = null, this._active = !1, this._previousFocus = null, this._firstFocusable = null, this._lastFocusable = null, this._metrics = { activations: 0, deactivations: 0, wraps: 0 }, this._boundKeyHandler = this._onKeyDown.bind(this), this._boundFocusHandler = this._onFocus.bind(this);
  }
  init(e) {
    return e ? (this._container = e, it("debug", "FocusTrap initialized"), this) : this;
  }
  activate() {
    this._active || !Ut || (this._previousFocus = document.activeElement, this._updateFocusableElements(), document.addEventListener("keydown", this._boundKeyHandler), document.addEventListener("focus", this._boundFocusHandler, !0), this._active = !0, this._metrics.activations++, this._firstFocusable ? this._firstFocusable.focus() : this._container.focus(), this.onActivate && this.onActivate(), it("debug", "Focus trap activated"));
  }
  deactivate() {
    !this._active || !Ut || (document.removeEventListener("keydown", this._boundKeyHandler), document.removeEventListener("focus", this._boundFocusHandler, !0), this._active = !1, this._metrics.deactivations++, this.returnFocusOnDeactivate && this._previousFocus && this._previousFocus.focus(), this._previousFocus = null, this.onDeactivate && this.onDeactivate(), it("debug", "Focus trap deactivated"));
  }
  _updateFocusableElements() {
    const e = Array.from(this._container.querySelectorAll(es)).filter((t) => t.offsetParent !== null);
    this._firstFocusable = e[0] || null, this._lastFocusable = e[e.length - 1] || null;
  }
  _onKeyDown(e) {
    if (e.key === "Tab") {
      if (this._updateFocusableElements(), !this._firstFocusable || !this._lastFocusable) {
        e.preventDefault();
        return;
      }
      e.shiftKey ? document.activeElement === this._firstFocusable && (e.preventDefault(), this._lastFocusable.focus(), this._metrics.wraps++) : document.activeElement === this._lastFocusable && (e.preventDefault(), this._firstFocusable.focus(), this._metrics.wraps++);
    } else e.key === "Escape" && this.escapeDeactivates && this.deactivate();
  }
  _onFocus(e) {
    var t;
    this._container.contains(e.target) || (e.stopPropagation(), (t = this._firstFocusable) == null || t.focus());
  }
  isActive() {
    return this._active;
  }
  destroy() {
    this.deactivate(), this._container = null, this._firstFocusable = null, this._lastFocusable = null;
  }
  healthCheck() {
    const e = oi("logger"), t = { hasContainer: !!this._container, hasFocusables: !!this._firstFocusable, loggerReady: !!e, portsInitialized: fe.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i === 4 ? "HEALTHY" : "DEGRADED", score: `${i}/4`, active: this._active, checks: t, metrics: { ...this._metrics }, version: Ft, moduleId: Fe, portsInitialized: fe.isInitialized() };
  }
  info() {
    return { version: Ft, moduleId: Fe, active: this._active, returnFocusOnDeactivate: this.returnFocusOnDeactivate, escapeDeactivates: this.escapeDeactivates, metrics: { ...this._metrics }, portsInitialized: fe.isInitialized() };
  }
}
const Bt = "1.2.0-P17WI", Ue = "ticker.accessibility.screen-reader", jt = typeof document < "u", me = d({ moduleId: Ue });
function ai(s) {
  return me.get(s);
}
const Gt = (s, ...e) => {
  const t = ai("logger");
  t != null && t[s] && t[s](`[${Ue}]`, ...e);
}, is = ".ticker-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; } .ticker-live-region { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }";
class ss {
  constructor(e = {}) {
    this.politeness = e.politeness || "polite", this.debounceMs = e.debounceMs || 500, this.maxQueueSize = e.maxQueueSize || 5, this._liveRegion = null, this._queue = [], this._processing = !1, this._debounceTimer = null, this._metrics = { announcements: 0, queued: 0, dropped: 0 };
  }
  init() {
    return this._injectStyles(), this._createLiveRegion(), Gt("debug", "ScreenReaderAnnouncer initialized"), this;
  }
  _injectStyles() {
    if (!jt || document.getElementById("ticker-sr-styles")) return;
    const e = document.createElement("style");
    e.id = "ticker-sr-styles", e.textContent = is, document.head.appendChild(e);
  }
  _createLiveRegion() {
    jt && (this._liveRegion = document.createElement("div"), this._liveRegion.className = "ticker-live-region", this._liveRegion.setAttribute("role", "status"), this._liveRegion.setAttribute("aria-live", this.politeness), this._liveRegion.setAttribute("aria-atomic", "true"), document.body.appendChild(this._liveRegion));
  }
  announce(e, t = {}) {
    if (!e) return;
    const i = t.priority || "normal", n = t.immediate || !1;
    if (this._queue.length >= this.maxQueueSize)
      if (i === "high")
        this._queue.shift(), this._metrics.dropped++;
      else {
        this._metrics.dropped++;
        return;
      }
    this._queue.push({ message: e, priority: i, timestamp: Date.now() }), this._metrics.queued++, n ? this._processQueue() : this._scheduleProcess();
  }
  announceNewItems(e) {
    if (e <= 0) return;
    const t = e === 1 ? "Uma nova noticia disponivel" : `${e} novas noticias disponiveis`;
    this.announce(t, { priority: "normal" });
  }
  announceStatus(e) {
    const i = { loading: "Carregando noticias", loaded: "Noticias carregadas", offline: "Sem conexao. Mostrando noticias em cache.", error: "Erro ao carregar noticias", paused: "Ticker pausado", playing: "Ticker em reproducao" }[e];
    i && this.announce(i);
  }
  announceNavigation(e, t, i) {
    const n = `Noticia ${e + 1} de ${t}: ${i}`;
    this.announce(n, { immediate: !0 });
  }
  _scheduleProcess() {
    this._debounceTimer && clearTimeout(this._debounceTimer), this._debounceTimer = setTimeout(() => this._processQueue(), this.debounceMs);
  }
  _processQueue() {
    if (this._processing || this._queue.length === 0) return;
    this._processing = !0;
    const e = this._queue.filter((i) => i.priority === "high"), t = e.length > 0 ? e.shift() : this._queue.shift();
    this._queue = this._queue.filter((i) => i !== t), this._liveRegion && t && (this._liveRegion.textContent = "", requestAnimationFrame(() => {
      this._liveRegion.textContent = t.message, this._metrics.announcements++, Gt("debug", `Announced: ${t.message}`);
    })), setTimeout(() => {
      this._processing = !1, this._queue.length > 0 && this._processQueue();
    }, 1e3);
  }
  clear() {
    this._queue = [], this._liveRegion && (this._liveRegion.textContent = ""), this._debounceTimer && clearTimeout(this._debounceTimer);
  }
  setPoliteness(e) {
    this.politeness = e, this._liveRegion && this._liveRegion.setAttribute("aria-live", e);
  }
  destroy() {
    this.clear(), this._liveRegion && this._liveRegion.parentNode && this._liveRegion.parentNode.removeChild(this._liveRegion), this._liveRegion = null;
  }
  healthCheck() {
    var e;
    const t = ai("logger"), i = { hasLiveRegion: !!this._liveRegion, regionInDOM: !!((e = this._liveRegion) != null && e.parentNode), loggerReady: !!t, portsInitialized: me.isInitialized() }, n = Object.values(i).filter(Boolean).length;
    return { status: n === 4 ? "HEALTHY" : "DEGRADED", score: `${n}/4`, queueSize: this._queue.length, checks: i, metrics: { ...this._metrics }, version: Bt, moduleId: Ue, portsInitialized: me.isInitialized() };
  }
  info() {
    return { version: Bt, moduleId: Ue, politeness: this.politeness, queueSize: this._queue.length, metrics: { ...this._metrics }, portsInitialized: me.isInitialized() };
  }
}
const st = "1.2.0-P17WI", Be = "ticker.offline.cache-manager", Yt = typeof window < "u", pe = d({ moduleId: Be });
function ns(s) {
  return pe.get(s);
}
function E(s, ...e) {
  const t = ns("logger");
  t != null && t[s] && t[s](`[${Be}]`, ...e);
}
const rs = "ticker_offline_data", os = 100, as = 24 * 60 * 60 * 1e3;
class ls {
  constructor(e = {}) {
    this.maxItems = e.maxItems || os, this.maxAgeMs = e.maxAgeMs || as, this.storageKey = e.storageKey || rs, this._isOnline = typeof navigator < "u" ? navigator.onLine : !0, this._subscribers = /* @__PURE__ */ new Set(), this._metrics = { saves: 0, loads: 0, hits: 0, misses: 0, cleanups: 0 }, this._boundOnlineHandler = this._onOnline.bind(this), this._boundOfflineHandler = this._onOffline.bind(this);
  }
  init() {
    return Yt && (window.addEventListener("online", this._boundOnlineHandler), window.addEventListener("offline", this._boundOfflineHandler)), E("debug", "OfflineCacheManager initialized", { isOnline: this._isOnline }), this;
  }
  async save(e) {
    if (!Array.isArray(e) || e.length === 0) return !1;
    try {
      const t = e.slice(0, this.maxItems), i = { items: t, timestamp: Date.now(), version: st };
      return localStorage.setItem(this.storageKey, JSON.stringify(i)), this._metrics.saves++, E("debug", `Saved ${t.length} items to offline cache`), !0;
    } catch (t) {
      return E("warn", "Failed to save to offline cache", { error: t.message }), !1;
    }
  }
  async load() {
    this._metrics.loads++;
    try {
      const e = localStorage.getItem(this.storageKey);
      if (!e)
        return this._metrics.misses++, null;
      const t = JSON.parse(e);
      return Date.now() - t.timestamp > this.maxAgeMs ? (E("debug", "Cached data expired"), this._metrics.misses++, null) : (this._metrics.hits++, E("debug", `Loaded ${t.items.length} items from offline cache`), t.items);
    } catch (e) {
      return E("warn", "Failed to load from offline cache", { error: e.message }), this._metrics.misses++, null;
    }
  }
  async getWithFallback(e) {
    if (this._isOnline)
      try {
        const i = await e();
        return await this.save(i), { data: i, source: "network", cached: !1 };
      } catch (i) {
        E("warn", "Network fetch failed, trying cache", { error: i.message });
      }
    const t = await this.load();
    if (t)
      return { data: t, source: "cache", cached: !0 };
    throw new Error("No data available (network and cache failed)");
  }
  clear() {
    try {
      return localStorage.removeItem(this.storageKey), E("debug", "Offline cache cleared"), !0;
    } catch {
      return !1;
    }
  }
  cleanup() {
    try {
      const e = localStorage.getItem(this.storageKey);
      if (!e) return 0;
      const t = JSON.parse(e), i = Date.now(), n = t.items.filter((r) => i - new Date(r.published_at || r.timestamp || 0).getTime() < this.maxAgeMs);
      if (n.length !== t.items.length) {
        t.items = n.slice(0, this.maxItems), t.timestamp = Date.now(), localStorage.setItem(this.storageKey, JSON.stringify(t)), this._metrics.cleanups++;
        const r = t.items.length - n.length;
        return E("debug", `Cleanup: removed ${r} expired items`), r;
      }
      return 0;
    } catch {
      return 0;
    }
  }
  getCacheInfo() {
    try {
      const e = localStorage.getItem(this.storageKey);
      if (!e) return null;
      const t = JSON.parse(e);
      return { itemCount: t.items.length, timestamp: t.timestamp, age: Date.now() - t.timestamp, version: t.version, sizeBytes: e.length };
    } catch {
      return null;
    }
  }
  isOnline() {
    return this._isOnline;
  }
  _onOnline() {
    this._isOnline = !0, this._notifySubscribers({ online: !0 }), E("debug", "Network: online");
  }
  _onOffline() {
    this._isOnline = !1, this._notifySubscribers({ online: !1 }), E("debug", "Network: offline");
  }
  subscribe(e) {
    return this._subscribers.add(e), () => this._subscribers.delete(e);
  }
  _notifySubscribers(e) {
    this._subscribers.forEach((t) => {
      try {
        t(e);
      } catch {
      }
    });
  }
  destroy() {
    Yt && (window.removeEventListener("online", this._boundOnlineHandler), window.removeEventListener("offline", this._boundOfflineHandler)), this._subscribers.clear();
  }
  healthCheck() {
    const e = this.getCacheInfo(), t = { isOnline: this._isOnline, hasCache: !!e, cacheValid: e ? Date.now() - e.timestamp < this.maxAgeMs : !1, portsInitialized: pe.isInitialized() }, i = Object.values(t).filter(Boolean).length;
    return { status: i >= 3 ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${i}/4`, isOnline: this._isOnline, cacheInfo: e, checks: t, metrics: { ...this._metrics }, version: st, moduleId: Be, portsInitialized: pe.isInitialized() };
  }
  info() {
    return { version: st, moduleId: Be, isOnline: this._isOnline, cacheInfo: this.getCacheInfo(), maxItems: this.maxItems, maxAgeMs: this.maxAgeMs, metrics: { ...this._metrics }, portsInitialized: pe.isInitialized() };
  }
}
const qt = "1.2.0-P17WI", je = "ticker.api.fallback-sources", ve = d({ moduleId: je });
function li(s) {
  return ve.get(s);
}
const cs = (s, ...e) => {
  const t = li("logger");
  t != null && t[s] && t[s](`[${je}]`, ...e);
}, hs = [{ id: "primary", name: "DShowDash API", url: "/api/news/get_ticker_data.php", priority: 1, timeout: 8e3, enabled: !0 }, { id: "news-only", name: "News Only API", url: "/api/news/get_news.php", priority: 2, timeout: 6e3, enabled: !0 }, { id: "cached", name: "Cached Data", url: "/api/news/cached.json", priority: 3, timeout: 3e3, enabled: !0 }, { id: "static", name: "Static Fallback", url: "/components/ticker/data/fallback.json", priority: 4, timeout: 2e3, enabled: !0 }];
class us {
  constructor(e = {}) {
    this.sources = e.sources || [...hs], this.maxRetries = e.maxRetries || 2, this.retryDelay = e.retryDelay || 1e3, this._lastSuccessfulSource = null, this._sourceHealth = /* @__PURE__ */ new Map(), this._metrics = { attempts: 0, successes: 0, failures: 0, fallbacks: 0 }, this.sources.forEach((t) => this._sourceHealth.set(t.id, { failures: 0, lastSuccess: null, lastFailure: null }));
  }
  async fetch(e = null) {
    this._metrics.attempts++;
    const t = this._getSortedSources();
    for (const i of t)
      if (i.enabled)
        try {
          const n = await this._fetchFromSource(i, e);
          return this._onSourceSuccess(i), this._metrics.successes++, i.priority > 1 && this._metrics.fallbacks++, { data: n, source: i.id, isFallback: i.priority > 1 };
        } catch (n) {
          if (this._onSourceFailure(i, n), cs("warn", `Source failed: ${i.name}`, { error: n.message }), e != null && e.aborted) throw n;
          continue;
        }
    throw this._metrics.failures++, new Error("All sources failed");
  }
  async _fetchFromSource(e, t) {
    const i = new AbortController(), n = setTimeout(() => i.abort(), e.timeout), r = t ? this._combineSignals(t, i.signal) : i.signal;
    try {
      const o = await fetch(e.url, { signal: r, headers: { "Content-Type": "application/json" } });
      if (clearTimeout(n), !o.ok) throw new Error(`HTTP ${o.status}`);
      const a = await o.json();
      if (a.ok === !1) throw new Error(a.error || "Invalid response");
      return Array.isArray(a) ? a : a.data || a.items || [];
    } catch (o) {
      throw clearTimeout(n), o;
    }
  }
  _combineSignals(e, t) {
    const i = new AbortController(), n = () => i.abort();
    return e.aborted || t.aborted ? (i.abort(), i.signal) : (e.addEventListener("abort", n, { once: !0 }), t.addEventListener("abort", n, { once: !0 }), i.signal);
  }
  _getSortedSources() {
    return [...this.sources].sort((e, t) => {
      const i = this._sourceHealth.get(e.id), n = this._sourceHealth.get(t.id);
      return e.id === this._lastSuccessfulSource ? -1 : t.id === this._lastSuccessfulSource ? 1 : i.failures !== n.failures ? i.failures - n.failures : e.priority - t.priority;
    });
  }
  _onSourceSuccess(e) {
    const t = this._sourceHealth.get(e.id);
    t.failures = 0, t.lastSuccess = Date.now(), this._lastSuccessfulSource = e.id;
  }
  _onSourceFailure(e, t) {
    const i = this._sourceHealth.get(e.id);
    i.failures++, i.lastFailure = Date.now(), i.lastError = t.message;
  }
  enableSource(e) {
    const t = this.sources.find((i) => i.id === e);
    t && (t.enabled = !0);
  }
  disableSource(e) {
    const t = this.sources.find((i) => i.id === e);
    t && (t.enabled = !1);
  }
  resetSourceHealth(e) {
    if (e) {
      const t = this._sourceHealth.get(e);
      t && (t.failures = 0, t.lastSuccess = null, t.lastFailure = null);
    } else
      this._sourceHealth.forEach((t) => {
        t.failures = 0, t.lastSuccess = null, t.lastFailure = null;
      });
  }
  getSourceStatus() {
    return this.sources.map((e) => ({ ...e, health: this._sourceHealth.get(e.id), isLastSuccessful: e.id === this._lastSuccessfulSource }));
  }
  healthCheck() {
    const e = li("logger"), t = this.sources.filter((o) => o.enabled), i = t.filter((o) => {
      var a;
      return (((a = this._sourceHealth.get(o.id)) == null ? void 0 : a.failures) || 0) < 3;
    }), n = { hasEnabledSources: t.length > 0, hasHealthySources: i.length > 0, loggerReady: !!e, portsInitialized: ve.isInitialized() }, r = Object.values(n).filter(Boolean).length;
    return { status: r === 4 ? "HEALTHY" : r >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${r}/4`, enabledSources: t.length, healthySources: i.length, lastSuccessfulSource: this._lastSuccessfulSource, checks: n, metrics: { ...this._metrics }, version: qt, moduleId: je, portsInitialized: ve.isInitialized() };
  }
  info() {
    return { version: qt, moduleId: je, sources: this.getSourceStatus(), metrics: { ...this._metrics }, portsInitialized: ve.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
const Vt = "1.3.0-P17WI", Ge = "ticker.i18n", be = d({ moduleId: Ge });
function ds(s) {
  return be.get(s);
}
function nt(s, ...e) {
  const t = ds("logger");
  t != null && t[s] && t[s](`[${Ge}]`, ...e);
}
const ye = { "pt-BR": { loading: "Carregando dados...", offline: "Sem conexão", noData: "Nenhum dado disponível", error: "Erro ao carregar", retry: "Tentar novamente", refresh: "Atualizar", pause: "Pausar", play: "Reproduzir", settings: "Configurações", close: "Fechar", newItems: "{count} nova(s) notícia(s)", lastUpdate: "Última atualização: {time}", categories: { breaking: "URGENTE", economia: "ECONOMIA", politica: "POLÍTICA", tecnologia: "TECNOLOGIA", esportes: "ESPORTES", saude: "SAÚDE", geral: "GERAL" }, accessibility: { tickerLabel: "Ticker de notícias", newNews: "Nova notícia disponível", pausedAnnounce: "Ticker pausado", resumedAnnounce: "Ticker em execução", navigationHint: "Use as setas para navegar entre notícias" }, time: { justNow: "agora", minutesAgo: "há {n} min", hoursAgo: "há {n}h", yesterday: "ontem", daysAgo: "há {n} dias" } }, "en-US": { loading: "Loading data...", offline: "No connection", noData: "No data available", error: "Error loading", retry: "Retry", refresh: "Refresh", pause: "Pause", play: "Play", settings: "Settings", close: "Close", newItems: "{count} new item(s)", lastUpdate: "Last update: {time}", categories: { breaking: "BREAKING", economia: "ECONOMY", politica: "POLITICS", tecnologia: "TECH", esportes: "SPORTS", saude: "HEALTH", geral: "GENERAL" }, accessibility: { tickerLabel: "News ticker", newNews: "New news available", pausedAnnounce: "Ticker paused", resumedAnnounce: "Ticker playing", navigationHint: "Use arrow keys to navigate between news" }, time: { justNow: "just now", minutesAgo: "{n} min ago", hoursAgo: "{n}h ago", yesterday: "yesterday", daysAgo: "{n} days ago" } }, "es-ES": { loading: "Cargando datos...", offline: "Sin conexión", noData: "No hay datos disponibles", error: "Error al cargar", retry: "Reintentar", refresh: "Actualizar", pause: "Pausar", play: "Reproducir", settings: "Configuración", close: "Cerrar", newItems: "{count} noticia(s) nueva(s)", lastUpdate: "Última actualización: {time}", categories: { breaking: "URGENTE", economia: "ECONOMÍA", politica: "POLÍTICA", tecnologia: "TECNOLOGÍA", esportes: "DEPORTES", saude: "SALUD", geral: "GENERAL" }, accessibility: { tickerLabel: "Ticker de noticias", newNews: "Nueva noticia disponible", pausedAnnounce: "Ticker pausado", resumedAnnounce: "Ticker en reproducción", navigationHint: "Use las flechas para navegar entre noticias" }, time: { justNow: "ahora", minutesAgo: "hace {n} min", hoursAgo: "hace {n}h", yesterday: "ayer", daysAgo: "hace {n} días" } } }, j = "pt-BR", O = Object.keys(ye);
class gs {
  constructor() {
    this._locale = j, this._fallbackLocale = j, this._subscribers = /* @__PURE__ */ new Set(), this._customTranslations = {};
  }
  get locale() {
    return this._locale;
  }
  get supportedLocales() {
    return O;
  }
  setLocale(e) {
    const t = this._normalizeLocale(e);
    if (!O.includes(t))
      return nt("warn", `Unsupported locale: ${e}, using ${this._fallbackLocale}`), !1;
    if (this._locale !== t) {
      const i = this._locale;
      this._locale = t, this._notifySubscribers({ oldLocale: i, newLocale: t }), nt("info", `Locale changed: ${i} -> ${t}`);
    }
    return !0;
  }
  _normalizeLocale(e) {
    if (!e) return j;
    if (O.includes(e)) return e;
    const t = e.split("-")[0].toLowerCase();
    return O.find((n) => n.toLowerCase().startsWith(t)) || j;
  }
  t(e, t = {}) {
    const i = e.split(".");
    let n = this._customTranslations[this._locale];
    n || (n = ye[this._locale]);
    for (const r of i)
      if (n = n == null ? void 0 : n[r], n === void 0) break;
    if (n === void 0) {
      let r = ye[this._fallbackLocale];
      for (const o of i)
        if (r = r == null ? void 0 : r[o], r === void 0) break;
      n = r ?? e;
    }
    return typeof n == "string" ? n.replace(/\{(\w+)\}/g, (r, o) => t[o] ?? `{${o}}`) : n;
  }
  addTranslations(e, t) {
    this._customTranslations[e] || (this._customTranslations[e] = {}), Object.assign(this._customTranslations[e], t), nt("debug", `Added custom translations for ${e}`);
  }
  formatRelativeTime(e) {
    const t = /* @__PURE__ */ new Date(), i = new Date(e), n = t - i, r = Math.floor(n / 6e4), o = Math.floor(n / 36e5), a = Math.floor(n / 864e5);
    return r < 1 ? this.t("time.justNow") : r < 60 ? this.t("time.minutesAgo", { n: r }) : o < 24 ? this.t("time.hoursAgo", { n: o }) : a === 1 ? this.t("time.yesterday") : this.t("time.daysAgo", { n: a });
  }
  detectBrowserLocale() {
    if (typeof navigator > "u") return j;
    const e = navigator.language || navigator.userLanguage;
    return this._normalizeLocale(e);
  }
  subscribe(e) {
    return this._subscribers.add(e), () => this._subscribers.delete(e);
  }
  _notifySubscribers(e) {
    this._subscribers.forEach((t) => {
      try {
        t(e);
      } catch {
      }
    });
  }
  healthCheck() {
    const e = { hasTranslations: Object.keys(ye).length > 0, validLocale: O.includes(this._locale), portsInitialized: be.isInitialized() }, t = Object.values(e).filter(Boolean).length;
    return { status: t === 3 ? "HEALTHY" : "DEGRADED", score: `${t}/3`, locale: this._locale, supportedLocales: O, checks: e, version: Vt, moduleId: Ge, portsInitialized: be.isInitialized() };
  }
  info() {
    return { version: Vt, moduleId: Ge, locale: this._locale, supportedLocales: O, hasCustomTranslations: Object.keys(this._customTranslations).length > 0, portsInitialized: be.isInitialized() };
  }
}
const x = new gs(), _s = (s, e) => x.t(s, e), Kt = "1.3.0-P2-ENTERPRISE", Ye = "ticker.core.features", ot = d({ moduleId: Ye });
function fs(s) {
  return ot.get(s);
}
const N = (s, ...e) => {
  const t = fs("logger");
  t != null && t[s] && t[s](`[${Ye}]`, ...e);
};
class ms {
  constructor(e, t = {}) {
    this.ticker = e, this.options = t, this._features = {}, this._initialized = !1, this._metrics = { featuresEnabled: 0, errors: 0 };
  }
  async init(e, t) {
    if (this._initialized) return this;
    N("debug", "Initializing ticker features...");
    try {
      this._features.circuitBreaker = new Ri({ failureThreshold: this.options.circuitBreakerThreshold || 3, resetTimeout: this.options.circuitBreakerTimeout || 3e4 }), this._features.requestCache = new $i({ ttl: this.options.cacheTTL || 5e3, maxSize: this.options.cacheMaxSize || 50 }), this._features.domRecycler = new zi({ maxPoolSize: this.options.poolSize || 100 }), this._features.skeleton = new Pi({ itemCount: this.options.skeletonItems || 5 }).init(t), this._features.lazyImages = new Mi({ rootMargin: "100px" }).init(), this._features.modal = new Ui({ onClose: () => {
        var n, r;
        return (r = (n = this.ticker) == null ? void 0 : n.resume) == null ? void 0 : r.call(n);
      }, onShare: (n, r) => N("debug", `Shared via ${n}`, { title: r.title }) }).init(), this._features.badge = new ji({ pulseOnUpdate: !0 }).init(e), this._features.pullRefresh = new Vi({ threshold: 60, onRefresh: () => {
        var n, r;
        return (r = (n = this.ticker) == null ? void 0 : n.fetchNews) == null ? void 0 : r.call(n);
      } }).init(e), this._features.swipeNav = new Wi({ onSwipeLeft: () => {
        var n, r;
        return (r = (n = this._features.scrollSnap) == null ? void 0 : n.next) == null ? void 0 : r.call(n);
      }, onSwipeRight: () => {
        var n, r;
        return (r = (n = this._features.scrollSnap) == null ? void 0 : n.previous) == null ? void 0 : r.call(n);
      } }).init(t), this._features.scrollSnap = new Qi({ alignment: "start", itemSelector: ".ticker-item" }).init(t), this._features.keyboardNav = new Zi({ loop: !0, onSelect: ({ item: n }) => this._onItemSelect(n), onNavigate: ({ newIndex: n, item: r }) => this._onNavigate(n, r) }).init(t), this._features.focusTrap = new ts({ escapeDeactivates: !0 }).init(e), this._features.screenReader = new ss({ politeness: "polite" }).init(), this._features.offlineCache = new ls({ maxItems: 100, maxAgeMs: 24 * 60 * 60 * 1e3 }).init(), this._features.fallbackSources = new us();
      const i = x.detectBrowserLocale();
      x.setLocale(this.options.locale || i), this._metrics.featuresEnabled = Object.keys(this._features).length, this._initialized = !0, N("debug", `Features initialized: ${this._metrics.featuresEnabled} modules`);
    } catch (i) {
      this._metrics.errors++, N("error", "Failed to initialize features", { error: i.message });
    }
    return this;
  }
  async fetchWithFeatures(e) {
    var t, i, n, r, o;
    const { circuitBreaker: a, requestCache: c, offlineCache: l, fallbackSources: u } = this._features;
    (t = this._features.skeleton) == null || t.show();
    try {
      const _ = await a.execute(async () => await c.dedupe("ticker-news", async () => (await u.fetch()).data));
      await l.save(_);
      const f = ((i = this._features.badge) == null ? void 0 : i.update(_)) || 0;
      return f > 0 && ((n = this._features.screenReader) == null || n.announceNewItems(f)), _;
    } catch (_) {
      N("warn", "Primary fetch failed, trying offline cache");
      const f = await l.load();
      if (f)
        return (r = this._features.screenReader) == null || r.announceStatus("offline"), f;
      throw _;
    } finally {
      (o = this._features.skeleton) == null || o.hide();
    }
  }
  _onItemSelect(e) {
    var t, i;
    if (!e) return;
    const n = this._extractItemData(e);
    n && ((t = this._features.modal) == null || t.open(n), (i = this._features.focusTrap) == null || i.activate());
  }
  _onNavigate(e, t) {
    var i, n;
    const r = this._extractItemData(t);
    if (r && this._features.screenReader) {
      const o = ((n = (i = this._features.keyboardNav) == null ? void 0 : i.getItemCount) == null ? void 0 : n.call(i)) || 0;
      this._features.screenReader.announceNavigation(e, o, r.title);
    }
  }
  _extractItemData(e) {
    var t, i, n;
    if (!e) return null;
    const r = e.querySelector("a"), o = (r == null ? void 0 : r.textContent) || ((t = e.querySelector(".ticker-title")) == null ? void 0 : t.textContent), a = (r == null ? void 0 : r.href) || "#", c = ((i = e.querySelector(".ticker-source-icon")) == null ? void 0 : i.title) || "", l = ((n = e.className.match(/ticker-item--categoria-(\w+)/)) == null ? void 0 : n[1]) || "geral";
    return { title: o, url: a, source: c, category: l };
  }
  showSkeleton() {
    var e;
    (e = this._features.skeleton) == null || e.show();
  }
  hideSkeleton() {
    var e;
    (e = this._features.skeleton) == null || e.hide();
  }
  openModal(e) {
    var t;
    (t = this._features.modal) == null || t.open(e);
  }
  closeModal() {
    var e;
    (e = this._features.modal) == null || e.close();
  }
  updateBadge(e) {
    var t;
    return (t = this._features.badge) == null ? void 0 : t.update(e);
  }
  markAllSeen(e) {
    var t;
    (t = this._features.badge) == null || t.markAllSeen(e);
  }
  announceStatus(e) {
    var t;
    (t = this._features.screenReader) == null || t.announceStatus(e);
  }
  setLocale(e) {
    x.setLocale(e);
  }
  getLocale() {
    return x.locale;
  }
  translate(e, t) {
    return _s(e, t);
  }
  isOnline() {
    var e;
    return ((e = this._features.offlineCache) == null ? void 0 : e.isOnline()) ?? !0;
  }
  get circuitBreaker() {
    return this._features.circuitBreaker;
  }
  get requestCache() {
    return this._features.requestCache;
  }
  get offlineCache() {
    return this._features.offlineCache;
  }
  get modal() {
    return this._features.modal;
  }
  get badge() {
    return this._features.badge;
  }
  get keyboardNav() {
    return this._features.keyboardNav;
  }
  get i18n() {
    return x;
  }
  pauseGestures() {
    var e, t, i;
    (e = this._features.pullRefresh) == null || e.disable(), (t = this._features.swipeNav) == null || t.disable(), (i = this._features.scrollSnap) == null || i.disable();
  }
  resumeGestures() {
    var e, t, i;
    (e = this._features.pullRefresh) == null || e.enable(), (t = this._features.swipeNav) == null || t.enable(), (i = this._features.scrollSnap) == null || i.enable();
  }
  refresh() {
    var e, t, i, n;
    (e = this._features.scrollSnap) == null || e.refresh(), (t = this._features.keyboardNav) == null || t.refresh(), (n = this._features.lazyImages) == null || n.observeAll((i = this.ticker) == null ? void 0 : i.element);
  }
  destroy() {
    Object.values(this._features).forEach((e) => {
      var t;
      try {
        (t = e == null ? void 0 : e.destroy) == null || t.call(e);
      } catch {
      }
    }), this._features = {}, this._initialized = !1, N("debug", "Features destroyed");
  }
  healthCheck() {
    const e = {};
    Object.entries(this._features).forEach(([n, r]) => {
      var o;
      try {
        const a = (o = r == null ? void 0 : r.healthCheck) == null ? void 0 : o.call(r);
        e[n] = (a == null ? void 0 : a.status) || "UNKNOWN";
      } catch {
        e[n] = "ERROR";
      }
    });
    const t = Object.values(e).filter((n) => n === "HEALTHY").length, i = Object.keys(e).length;
    return { status: t === i ? "HEALTHY" : t >= i * 0.7 ? "DEGRADED" : "UNHEALTHY", score: `${t}/${i}`, features: e, metrics: { ...this._metrics }, version: Kt, moduleId: Ye, portsInitialized: ot.isInitialized(), timestamp: Date.now() };
  }
  info() {
    return { version: Kt, moduleId: Ye, initialized: this._initialized, featuresEnabled: Object.keys(this._features).length, featureList: Object.keys(this._features), locale: x.locale, isOnline: this.isOnline(), metrics: { ...this._metrics }, portsInitialized: ot.isInitialized() };
  }
}
const P = "8.11.0-P2-ENTERPRISE", R = "ticker", ci = typeof window < "u", q = typeof document < "u", C = d({ moduleId: R }), ps = () => C.init(), S = (s) => C.get(s), ks = (s) => C.inject(s), Is = () => C.snapshot(), vs = () => {
  var s, e;
  return ci && ((e = (s = S("config")) == null ? void 0 : s.app) == null ? void 0 : e.debug);
}, g = (s, ...e) => {
  const t = S("logger");
  if (!t || !vs() && s === "debug") return;
  const i = t[s] || t.info;
  i == null || i(`[${R}]`, ...e);
}, p = {
  REQUEST_CONFIG: "ticker:settings:request-config",
  CONFIG_DATA: "ticker:config:data",
  SAVE_CONFIG: "ticker:config:save",
  APPLY_SESSION: "ticker:config:apply-session",
  RESET_CONFIG: "ticker:config:reset",
  APPLY_PRESET: "ticker:config:preset:apply",
  REFRESH_NOW: "ticker:refresh:manual",
  CONFIG_APPLIED: "ticker:config:applied"
};
(() => {
  if (!(typeof document > "u")) {
    var s = "ticker-enterprise-css";
    if (!document.getElementById(s)) {
      var e = "/components/ticker/component-enterprise.css", t = document.querySelector('link[href="' + e + '"]');
      if (!t) {
        var i = document.createElement("link");
        i.id = s, i.rel = "stylesheet", i.href = e, document.head.appendChild(i);
      }
    }
  }
})();
function h(s = {}) {
  ps(), this.container = s.container, this.store = new yi(), this.configStore = new Ii(), this.eventBus = new gi(), this.globalEventBus = S("eventBus"), this.lifecycle = new b(this), this.telemetry = new Oi(), this.api = new ui(), this.renderer = null, this.announcer = new Li(), this.polling = null, this.element = null, this.isPaused = !1, this.isDestroyed = !1, this.unsubscribeStore = null, this.unsubscribeConfig = null, this.sessionConfig = null, this.features = new ms(this, { locale: s.locale || "pt-BR", cacheTTL: s.cacheTTL || 5e3, circuitBreakerThreshold: s.circuitBreakerThreshold || 3 }), this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null, authPauses: 0, visibilityPauses: 0 }, this._globalEventCleanups = [], this._authEventCleanups = [], this._onMouseEnter = () => this.pause(), this._onMouseLeave = () => this.resume(), this._onFocusIn = () => this.pause(), this._onFocusOut = () => this.resume(), this._pauseReasons = { hover: !1, auth: !1, visibility: !1 }, this._onVisibilityChange = this._handleVisibilityChange.bind(this);
}
h.prototype.mount = function() {
  return q ? this.isDestroyed ? (g("error", "Tentativa de mount em componente destruído"), Promise.resolve()) : this.lifecycle.mount().then(() => {
    var s;
    this.render(), this.setupEvents(), this.setupGlobalEvents(), this.setupAuthEvents(), this.setupVisibilityAPI(), this.setupConfigIntegration(), this.setupPolling();
    const e = (s = this.element) == null ? void 0 : s.querySelector(".ticker-track");
    return this.features.init(this.element, e);
  }).then(() => this.fetchNews()).then(() => this.lifecycle.ready()).then(() => {
    this.telemetry.track(v.MOUNTED, { timestamp: Date.now(), featuresEnabled: this.features.info().featuresEnabled }), this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), g("info", "Ticker mounted with 19 advanced features");
  }) : Promise.resolve();
};
h.prototype.render = function() {
  if (!q || !this.container) {
    g("error", "Container não encontrado para ticker");
    return;
  }
  this.element = this.container, this.element.classList.add("news-ticker-component"), this.element.dataset.status = "loading", this.element.innerHTML = Ci(), Xt() && this.element.classList.add("reduced-motion");
  const s = this.configStore.getConfig();
  this.applyTheme(s), this.renderer = new Ai(this.element, this.store, this.configStore), this.renderer.init(), this.announcer.mount(this.element), this.unsubscribeStore = this.store.subscribe((e) => {
    var t;
    !this.element || this.isDestroyed || (this.element.dataset.status = e.status, (t = this.renderer) == null || t.render(), this.features.refresh());
  });
};
h.prototype.setupPolling = function() {
  const s = this.configStore.getConfig(), e = s.content.autoRefreshMinutes * 6e4;
  e > 0 && (this.polling = new pi({ interval: e, callback: (t) => this.fetchNews(t) }), g("debug", `Polling configurado: ${s.content.autoRefreshMinutes} min`));
};
h.prototype.setupEvents = function() {
  this.element && (this.element.addEventListener("mouseenter", this._onMouseEnter), this.element.addEventListener("mouseleave", this._onMouseLeave), this.element.addEventListener("focusin", this._onFocusIn), this.element.addEventListener("focusout", this._onFocusOut), this.element.addEventListener("click", (s) => {
    const e = s.target.closest(".ticker-item");
    e && !s.target.closest("a") && (s.preventDefault(), this._openItemModal(e));
  }));
};
h.prototype._openItemModal = function(s) {
  if (!s) return;
  const e = s.querySelector("a"), t = s.querySelector(".ticker-title"), i = (e == null ? void 0 : e.textContent) || (t == null ? void 0 : t.textContent) || "", n = (e == null ? void 0 : e.href) || "#", r = s.querySelector(".ticker-source-icon"), o = (r == null ? void 0 : r.title) || "", a = s.className.match(/ticker-item--categoria-(\w+)/), c = a ? a[1] : "geral";
  this.features.openModal({ title: i, url: n, source: o, category: c, published_at: (/* @__PURE__ */ new Date()).toISOString(), summary: "" }), this.pause();
};
h.prototype.setupAuthEvents = function() {
  var s, e, t, i;
  const n = S("eventBus");
  if (!n) {
    g("warn", "GlobalEventBus não disponível para AUTH_EVENTS");
    return;
  }
  const r = (l) => {
    g("info", "AUTH: Login required - pausando ticker", { source: l == null ? void 0 : l.source }), this._pauseReasons.auth = !0, this._updatePauseState(), this._metrics.authPauses++, this.features.announceStatus("paused"), this.telemetry.track(v.AUTH_PAUSED, { reason: "login_required", timestamp: Date.now() });
  }, o = (l) => {
    g("info", "AUTH: Login success - resumindo ticker", { source: l == null ? void 0 : l.source }), this._pauseReasons.auth = !1, this._updatePauseState(), this.features.announceStatus("playing"), this.telemetry.track(v.AUTH_RESUMED, { reason: "login_success", timestamp: Date.now() });
  }, a = (l) => {
    l != null && l.authenticated && (g("debug", "AUTH: Auth ready (authenticated) - garantindo ticker ativo"), this._pauseReasons.auth = !1, this._updatePauseState());
  }, c = (l) => {
    g("info", "AUTH: Logout - pausando ticker", { source: l == null ? void 0 : l.source }), this._pauseReasons.auth = !0, this._updatePauseState(), this._metrics.authPauses++, this.telemetry.track(v.AUTH_PAUSED, { reason: "logout", timestamp: Date.now() });
  };
  (s = Ve) != null && s.LOGIN && (n.on(Ve.LOGIN, r), this._authEventCleanups.push(() => n.off(Ve.LOGIN, r))), (e = w) != null && e.LOGIN_SUCCESS && (n.on(w.LOGIN_SUCCESS, o), this._authEventCleanups.push(() => n.off(w.LOGIN_SUCCESS, o))), (t = w) != null && t.READY && (n.on(w.READY, a), this._authEventCleanups.push(() => n.off(w.READY, a))), (i = w) != null && i.LOGOUT && (n.on(w.LOGOUT, c), this._authEventCleanups.push(() => n.off(w.LOGOUT, c))), g("debug", "AUTH_EVENTS integration setup complete");
};
h.prototype.setupVisibilityAPI = function() {
  q && (document.addEventListener("visibilitychange", this._onVisibilityChange), g("debug", "Visibility API setup complete"));
};
h.prototype._handleVisibilityChange = function() {
  this.isDestroyed || (document.hidden ? (g("debug", "Tab hidden - pausando ticker"), this._pauseReasons.visibility = !0, this._updatePauseState(), this._metrics.visibilityPauses++, this.features.pauseGestures(), this.telemetry.track(v.VISIBILITY_PAUSED, { timestamp: Date.now() })) : (g("debug", "Tab visible - resumindo ticker"), this._pauseReasons.visibility = !1, this._updatePauseState(), this.features.resumeGestures(), this.telemetry.track(v.VISIBILITY_RESUMED, { timestamp: Date.now() })));
};
h.prototype._updatePauseState = function() {
  var s, e, t;
  const i = this._pauseReasons.hover || this._pauseReasons.auth || this._pauseReasons.visibility;
  i && !this.isPaused ? (this.isPaused = !0, (s = this.element) == null || s.classList.add("paused"), (e = this.polling) == null || e.stop(), g("debug", "Ticker PAUSED", { reasons: { ...this._pauseReasons } })) : !i && this.isPaused && (this.isPaused = !1, (t = this.element) == null || t.classList.remove("paused"), this.polling && this.lifecycle.isReady() && this.polling.start(), g("debug", "Ticker RESUMED"));
};
h.prototype.setupGlobalEvents = function() {
  const s = S("eventBus");
  if (!s) {
    g("warn", "GlobalEventBus não disponível");
    return;
  }
  const e = () => {
    g("info", "Config solicitada pela NavRail");
    const a = this.sessionConfig || this.configStore.getConfig();
    s.emit(p.CONFIG_DATA, { config: a, source: R, timestamp: Date.now() });
  };
  s.on(p.REQUEST_CONFIG, e), this._globalEventCleanups.push(() => s.off(p.REQUEST_CONFIG, e));
  const t = (a) => {
    this.sessionConfig = null, this.configStore.update(a.config), this.emitGranularEvents(a.config), s.emit(p.CONFIG_APPLIED, { success: !0, persist: !0, timestamp: Date.now() }), this.telemetry.track(v.CONFIG_SAVED, { timestamp: Date.now() }), g("info", "Configuração salva");
  };
  s.on(p.SAVE_CONFIG, t), this._globalEventCleanups.push(() => s.off(p.SAVE_CONFIG, t));
  const i = (a) => {
    var c;
    this.sessionConfig = a.config, this.applyTheme(a.config), this.applyAccessibilitySettings(a.config), (c = this.renderer) == null || c.applyConfig(a.config), this.emitGranularEvents(a.config), s.emit(p.CONFIG_APPLIED, { success: !0, persist: !1, timestamp: Date.now() }), this.telemetry.track(v.CONFIG_APPLIED_SESSION, { timestamp: Date.now() });
  };
  s.on(p.APPLY_SESSION, i), this._globalEventCleanups.push(() => s.off(p.APPLY_SESSION, i));
  const n = () => {
    this.sessionConfig = null, this.configStore.reset(), s.emit(p.CONFIG_APPLIED, { success: !0, reset: !0, timestamp: Date.now() }), this.telemetry.track(v.CONFIG_RESET, { timestamp: Date.now() });
  };
  s.on(p.RESET_CONFIG, n), this._globalEventCleanups.push(() => s.off(p.RESET_CONFIG, n));
  const r = (a) => {
    this.sessionConfig = null, this.configStore.applyPreset(a.preset), s.emit(p.CONFIG_APPLIED, { success: !0, preset: a.preset, timestamp: Date.now() }), this.telemetry.track(v.CONFIG_PRESET_APPLIED, { preset: a.preset, timestamp: Date.now() });
  };
  s.on(p.APPLY_PRESET, r), this._globalEventCleanups.push(() => s.off(p.APPLY_PRESET, r));
  const o = () => {
    this.fetchNews(), this.telemetry.track(v.REFRESH_MANUAL, { timestamp: Date.now() });
  };
  s.on(p.REFRESH_NOW, o), this._globalEventCleanups.push(() => s.off(p.REFRESH_NOW, o)), g("debug", "Global events setup complete");
};
h.prototype.emitGranularEvents = (s) => {
  const e = S("eventBus");
  e && (e.emit(v.BEHAVIOR_UPDATED, { behavior: s.behavior, timestamp: Date.now() }), e.emit(v.CONTENT_UPDATED, { content: s.content, timestamp: Date.now() }), e.emit(v.VISUAL_UPDATED, { visual: s.visual, theme: s.theme, timestamp: Date.now() }));
};
h.prototype.setupConfigIntegration = function() {
  this.unsubscribeConfig = this.configStore.subscribe((s) => {
    this.isDestroyed || (this.applyTheme(s), this.applyAccessibilitySettings(s));
  });
};
h.prototype.applyTheme = function(s) {
  this.element && (this.element.dataset.theme = s.theme.background, this.element.dataset.highContrast = s.accessibility.highContrast, s.accessibility.respectReducedMotion && Xt() ? this.element.classList.add("reduced-motion") : this.element.classList.remove("reduced-motion"));
};
h.prototype.applyAccessibilitySettings = function(s) {
  this.element && s.accessibility.highContrast && this.element.setAttribute("aria-label", "Ticker de notícias em modo de alto contraste");
};
h.prototype.removeEvents = function() {
  this.element && (this.element.removeEventListener("mouseenter", this._onMouseEnter), this.element.removeEventListener("mouseleave", this._onMouseLeave), this.element.removeEventListener("focusin", this._onFocusIn), this.element.removeEventListener("focusout", this._onFocusOut));
};
h.prototype.pause = function() {
  this.isDestroyed || !(this.sessionConfig || this.configStore.getConfig()).behavior.pauseOnHover || (this._pauseReasons.hover = !0, this._updatePauseState());
};
h.prototype.resume = function() {
  this.isDestroyed || (this._pauseReasons.hover = !1, this._updatePauseState());
};
h.prototype.forcePause = function(s = "external") {
  this.isDestroyed || (this._pauseReasons[s] = !0, this._updatePauseState(), g("debug", `Force pause: ${s}`));
};
h.prototype.forceResume = function(s = "external") {
  this.isDestroyed || (this._pauseReasons[s] = !1, this._updatePauseState(), g("debug", `Force resume: ${s}`));
};
h.prototype.getPauseReasons = function() {
  return { ...this._pauseReasons };
};
h.prototype.normalizeItems = (s) => Array.isArray(s) ? s.map((e) => {
  const t = e.type || "news";
  if (t === "news") {
    const i = e.source || e.portal || e.provider || e.origin || "default", n = e.published_at || e.pubDate || e.date || e.publishedAt || (/* @__PURE__ */ new Date()).toISOString();
    return { ...e, type: t, source: i.toLowerCase(), published_at: n };
  }
  return { ...e, type: t, published_at: e.published_at || (/* @__PURE__ */ new Date()).toISOString() };
}) : [];
h.prototype.fetchNews = function(s = null) {
  if (this.isDestroyed) return Promise.resolve();
  const e = this.lifecycle.getState();
  return e !== "ready" && e !== "mounted" ? (g("debug", `fetchNews bloqueado - lifecycle state: ${e}`), Promise.resolve()) : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.features.showSkeleton(), this.store.setState({ status: "loading" }), Promise.resolve().then(() => this.features.fetchWithFeatures(() => this.api.fetchNews(s))).catch((t) => (g("warn", "Features fetch failed, trying direct API", { error: t.message }), this.api.fetchNews(s))).then((t) => {
    var i, n;
    if (this.isDestroyed) return;
    const r = this.normalizeItems(t);
    this.store.setState({ news: r, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const o = this.features.updateBadge(r);
    o > 0 && this.features.announceStatus("loaded"), (n = (i = this.features.offlineCache) == null ? void 0 : i.save) == null || n.call(i, r);
    const a = r.filter((u) => u.type === "news").length, c = r.filter((u) => u.type === "fx").length, l = r.filter((u) => u.type === "stock").length;
    g("debug", `Dados: ${r.length} itens (news: ${a}, fx: ${c}, stock: ${l})`), this.telemetry.track(v.NEWS_LOADED, { count: r.length, newItems: o });
  }).catch((t) => {
    var i, n;
    if (!this.isDestroyed) {
      if (t.name === "AbortError") {
        g("debug", "Fetch abortado");
        return;
      }
      return g("error", "Erro ao carregar dados:", t.message), (((n = (i = this.features.offlineCache) == null ? void 0 : i.load) == null ? void 0 : n.call(i)) || Promise.resolve(null)).then((r) => {
        if ((r == null ? void 0 : r.length) > 0) {
          const o = this.normalizeItems(r);
          this.store.setState({ news: o, status: "offline", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() }), this.features.announceStatus("offline"), g("info", `Usando ${o.length} itens do cache offline`);
        } else
          this.store.setState({ status: "offline" }), this.features.announceStatus("error");
        this.telemetry.track(v.NEWS_ERROR, { error: t.message });
      });
    }
  }).then(() => this.features.hideSkeleton()));
};
h.prototype.openModal = function(s) {
  this.features.openModal(s);
};
h.prototype.closeModal = function() {
  this.features.closeModal();
};
h.prototype.setLocale = function(s) {
  this.features.setLocale(s);
};
h.prototype.getLocale = function() {
  return this.features.getLocale();
};
h.prototype.translate = function(s, e) {
  return this.features.translate(s, e);
};
h.prototype.isOnline = function() {
  return this.features.isOnline();
};
h.prototype.markAllSeen = function() {
  var s, e;
  const t = ((e = (s = this.store) == null ? void 0 : s.getState()) == null ? void 0 : e.news) || [];
  this.features.markAllSeen(t);
};
h.prototype.unmount = function() {
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    var s, e, t, i, n;
    this.polling = null, this.unsubscribeStore && (this.unsubscribeStore(), this.unsubscribeStore = null), this.unsubscribeConfig && (this.unsubscribeConfig(), this.unsubscribeConfig = null), this._globalEventCleanups.forEach((r) => r()), this._globalEventCleanups = [], this._authEventCleanups.forEach((r) => r()), this._authEventCleanups = [], q && document.removeEventListener("visibilitychange", this._onVisibilityChange), this.removeEvents(), (s = this.announcer) == null || s.unmount(), (e = this.renderer) == null || e.destroy(), this.renderer = null, (t = this.eventBus) == null || t.destroy(), (i = this.store) == null || i.reset(), (n = this.features) == null || n.destroy(), this.element && (this.element.classList.remove("news-ticker-component", "paused", "reduced-motion"), this.element.innerHTML = "", delete this.element.dataset.status, delete this.element.dataset.theme, delete this.element.dataset.highContrast, this.element = null), g("info", "Ticker Enterprise unmounted"), this.telemetry.track(v.UNMOUNTED, { timestamp: Date.now() });
  });
};
h.prototype.healthCheck = function() {
  var s, e, t, i;
  const n = S("eventBus"), r = S("logger"), o = (e = (s = this.features) == null ? void 0 : s.healthCheck) == null ? void 0 : e.call(s), a = ((i = (t = this.lifecycle) == null ? void 0 : t.isReady) == null ? void 0 : i.call(t)) || !1, c = { hasWindow: ci, hasDocument: q, isMounted: !!this.element, hasStore: !!this.store, hasConfigStore: !!this.configStore, hasEventBus: !!this.eventBus, hasGlobalEventBus: !!n, hasRenderer: !!this.renderer, hasFeatures: !!this.features, lifecycleReady: a, loggerReady: !!r, authEventsReady: this._authEventCleanups.length > 0, visibilityAPIReady: !0, featuresHealthy: (o == null ? void 0 : o.status) === "HEALTHY", portsInitialized: C.isInitialized() }, l = [];
  let u = 0;
  for (const [f, k] of Object.entries(c))
    k ? u++ : l.push(f);
  const _ = Object.keys(c).length;
  return { status: u === _ ? "HEALTHY" : u >= 10 ? "DEGRADED" : "UNHEALTHY", score: u, maxScore: _, scoreDisplay: `${u}/${_}`, checks: c, issues: l, pauseReasons: { ...this._pauseReasons }, featuresHealth: o, metrics: { ...this._metrics }, version: P, moduleId: R, portsInitialized: C.isInitialized(), timestamp: Date.now() };
};
h.prototype.info = function() {
  var s, e, t, i, n, r, o, a, c, l;
  const u = ((e = (s = this.store) == null ? void 0 : s.getState) == null ? void 0 : e.call(s)) || {}, _ = ((n = (i = (t = this.configStore) == null ? void 0 : t.getConfig) == null ? void 0 : i.call(t)) == null ? void 0 : n.preset) || "default", f = (o = (r = this.lifecycle) == null ? void 0 : r.getState) == null ? void 0 : o.call(r), k = (c = (a = this.features) == null ? void 0 : a.info) == null ? void 0 : c.call(a);
  return { version: P, moduleId: R, mounted: !!this.element, lifecycleState: f, newsCount: ((l = u.news) == null ? void 0 : l.length) || 0, preset: _, isPaused: this.isPaused, pauseReasons: { ...this._pauseReasons }, isOnline: this.isOnline(), locale: this.getLocale(), integrations: { authEvents: this._authEventCleanups.length > 0, visibilityAPI: !0, globalEventBus: !!S("eventBus"), features: k }, portsInitialized: C.isInitialized(), metrics: this._metrics, healthCheck: this.healthCheck() };
};
h.prototype.getMetrics = function() {
  return { ...this._metrics };
};
h.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null, authPauses: 0, visibilityPauses: 0 };
};
h.prototype.getVersion = () => P;
h.prototype.getFeatures = function() {
  return this.features;
};
const Es = () => P, Cs = () => ({ status: C.isInitialized() ? "HEALTHY" : "DEGRADED", version: P, moduleId: R, loggerReady: !!S("logger"), portsInitialized: C.isInitialized(), timestamp: Date.now() }), Ss = () => ({ version: P, moduleId: R, portsInitialized: C.isInitialized() });
export {
  R as MODULE_ID,
  h as TickerComponentEnterprise,
  P as VERSION,
  h as default,
  Is as getPorts,
  Es as getVersion,
  Cs as healthCheck,
  Ss as info,
  ks as injectPorts
};
