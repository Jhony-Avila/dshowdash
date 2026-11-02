import { createCorePorts as v } from "/core/runtime/ports-profiles.js";
import { ASSET_EVENTS as y } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const p = "1.6.0-P2-ENTERPRISE", _ = "asset-loader", g = v({ moduleId: _ }), w = () => {
  g.init();
}, S = (o) => g.get(o), D = (o) => g.inject(o), $ = () => g.snapshot(), L = () => {
  var o, e;
  return ((e = (o = S("config")) == null ? void 0 : o.app) == null ? void 0 : e.debug) || !1;
}, h = (o, ...e) => {
  var i, s, t;
  const r = S("logger");
  if (r) {
    if (o === "error") {
      (i = r.error) == null || i.call(r, `[${_}]`, ...e);
      return;
    }
    if (o === "warn") {
      (s = r.warn) == null || s.call(r, `[${_}]`, ...e);
      return;
    }
    L() && ((t = r.debug) == null || t.call(r, `[${_}]`, ...e));
  }
};
class E {
  constructor() {
    this._registry = /* @__PURE__ */ new Map(), this._pending = /* @__PURE__ */ new Map(), this._config = { assetsBase: "", version: null, timeout: 1e4, retryAttempts: 2, retryDelay: 1e3 }, this._metrics = { cssLoaded: 0, cssFailures: 0, jsLoaded: 0, jsFailures: 0, totalLoadTime: 0, cacheHits: 0 }, this._initialized = !1, this._initTimestamp = null;
  }
  init(e) {
    var i, s;
    if (this._initialized)
      return h("warn", "Already initialized"), this;
    w(), e && (this._config = { ...this._config, ...e });
    const t = S("config");
    return !this._config.version && ((i = t == null ? void 0 : t.app) != null && i.version) && (this._config.version = t.app.version), !this._config.assetsBase && ((s = t == null ? void 0 : t.paths) != null && s.assets) && (this._config.assetsBase = t.paths.assets), this._initialized = !0, this._initTimestamp = Date.now(), h("info", `${p} initialized`, { config: this._config }), this._emit(y.LOADER_INITIALIZED, { version: p }), this;
  }
  loadCSS(e, i = {}) {
    const s = this._normalizePath(e), t = this._buildUrl(s, "css");
    if (this._registry.has(t))
      return this._metrics.cacheHits++, Promise.resolve({ success: !0, cached: !0, url: t });
    if (this._pending.has(t))
      return this._pending.get(t);
    if (this._existsInDOM(t, "css"))
      return this._registry.set(t, { type: "css", loadedAt: Date.now(), external: !0 }), this._metrics.cacheHits++, Promise.resolve({ success: !0, cached: !0, external: !0, url: t });
    const r = this._loadCSSInternal(t, s, i);
    return this._pending.set(t, r), r.then((n) => (this._pending.delete(t), n)).catch((n) => {
      throw this._pending.delete(t), n;
    });
  }
  _loadCSSInternal(e, i, s) {
    const t = performance.now(), r = s.priority || "normal", n = s.media || "all", m = s.retryAttempts ?? this._config.retryAttempts;
    let c = 0;
    const l = () => this._createCSSElement(e, { priority: r, media: n }).then(() => {
      var d;
      const a = performance.now() - t;
      return this._metrics.cssLoaded++, this._metrics.totalLoadTime += a, this._registry.set(e, { type: "css", path: i, loadedAt: Date.now(), loadTime: a, attempts: c + 1 }), h("info", `CSS loaded: ${i} (${a.toFixed(0)}ms)`), this._emit(y.CSS_LOADED, { path: i, url: e, loadTime: a }), (d = s.onLoad) == null || d.call(s, { url: e, loadTime: a }), { success: !0, url: e, loadTime: a, attempts: c + 1 };
    }).catch((d) => {
      var a;
      return c++, c <= m ? (h("warn", `CSS retry (${c}/${m}): ${i}`), this._delay(this._config.retryDelay * c).then(l)) : (this._metrics.cssFailures++, h("error", `CSS failed: ${i}`, d), this._emit(y.CSS_FAILED, { path: i, url: e, error: d.message }), (a = s.onError) == null || a.call(s, { url: e, error: d }), { success: !1, url: e, error: d.message, attempts: c });
    });
    return l();
  }
  _createCSSElement(e, i) {
    return new Promise((s, t) => {
      const r = document.createElement("link");
      r.rel = "stylesheet", r.href = e, r.media = i.media || "all", r.dataset.assetLoader = "true", i.priority === "high" && r.setAttribute("importance", "high");
      const n = setTimeout(() => {
        t(new Error(`CSS timeout: ${e}`));
      }, this._config.timeout);
      r.onload = () => {
        clearTimeout(n), s();
      }, r.onerror = () => {
        clearTimeout(n), t(new Error(`CSS error: ${e}`));
      };
      const m = document.head.querySelector('link[rel="stylesheet"]');
      m && i.priority !== "high" ? document.head.insertBefore(r, m.nextSibling) : document.head.appendChild(r);
    });
  }
  loadScript(e, i = {}) {
    const s = this._normalizePath(e), t = this._buildUrl(s, "js");
    if (this._registry.has(t))
      return this._metrics.cacheHits++, Promise.resolve({ success: !0, cached: !0, url: t });
    if (this._pending.has(t))
      return this._pending.get(t);
    if (this._existsInDOM(t, "js"))
      return this._registry.set(t, { type: "js", loadedAt: Date.now(), external: !0 }), this._metrics.cacheHits++, Promise.resolve({ success: !0, cached: !0, external: !0, url: t });
    const r = this._loadScriptInternal(t, s, i);
    return this._pending.set(t, r), r.then((n) => (this._pending.delete(t), n)).catch((n) => {
      throw this._pending.delete(t), n;
    });
  }
  _loadScriptInternal(e, i, s) {
    const t = performance.now(), r = s.async !== !1, n = s.defer === !0, m = s.type || "text/javascript", c = s.retryAttempts ?? this._config.retryAttempts;
    let l = 0;
    const d = () => this._createScriptElement(e, { async: r, defer: n, type: m }).then(() => {
      var a;
      const u = performance.now() - t;
      return this._metrics.jsLoaded++, this._metrics.totalLoadTime += u, this._registry.set(e, { type: "js", path: i, loadedAt: Date.now(), loadTime: u, attempts: l + 1 }), h("info", `Script loaded: ${i} (${u.toFixed(0)}ms)`), this._emit(y.JS_LOADED, { path: i, url: e, loadTime: u }), (a = s.onLoad) == null || a.call(s, { url: e, loadTime: u }), { success: !0, url: e, loadTime: u, attempts: l + 1 };
    }).catch((a) => {
      var u;
      return l++, l <= c ? (h("warn", `Script retry (${l}/${c}): ${i}`), this._delay(this._config.retryDelay * l).then(d)) : (this._metrics.jsFailures++, h("error", `Script failed: ${i}`, a), this._emit(y.JS_FAILED, { path: i, url: e, error: a.message }), (u = s.onError) == null || u.call(s, { url: e, error: a }), { success: !1, url: e, error: a.message, attempts: l });
    });
    return d();
  }
  _createScriptElement(e, i) {
    return new Promise((s, t) => {
      const r = document.createElement("script");
      r.src = e, r.type = i.type || "text/javascript", r.async = i.async !== !1, r.defer = i.defer === !0, r.dataset.assetLoader = "true";
      const n = setTimeout(() => {
        t(new Error(`Script timeout: ${e}`));
      }, this._config.timeout);
      r.onload = () => {
        clearTimeout(n), s();
      }, r.onerror = () => {
        clearTimeout(n), t(new Error(`Script error: ${e}`));
      }, document.head.appendChild(r);
    });
  }
  preload(e, i = "style") {
    const s = this._normalizePath(e), t = this._buildUrl(s, i === "script" ? "js" : "css");
    if (document.querySelector(`link[rel="preload"][href="${t}"]`)) return;
    const r = document.createElement("link");
    r.rel = "preload", r.href = t, r.as = i, r.dataset.assetLoader = "preload", document.head.appendChild(r), h("info", `Preloaded: ${s}`);
  }
  _normalizePath(e) {
    return e ? e.startsWith("/") && this._config.assetsBase.endsWith("/") ? e.substring(1) : e : "";
  }
  _buildUrl(e, i) {
    if (e.startsWith("/")) return e;
    let s = e;
    return !s.startsWith("http://") && !s.startsWith("https://") && !s.startsWith("//") && (s = this._config.assetsBase + (s.startsWith("/") ? "" : "/") + s), s;
  }
  _existsInDOM(e, i) {
    return i === "css" ? !!document.querySelector(`link[href="${e}"], link[href^="${e}?"]`) : !!document.querySelector(`script[src="${e}"], script[src^="${e}?"]`);
  }
  _delay(e) {
    return new Promise((i) => setTimeout(i, e));
  }
  _emit(e, i) {
    var s;
    try {
      const t = S("eventBus");
      (s = t == null ? void 0 : t.emit) == null || s.call(t, e, { moduleId: _, timestamp: Date.now(), ...i });
    } catch {
    }
  }
  hasLoaded(e) {
    const i = this._normalizePath(e), s = this._buildUrl(i, "css"), t = this._buildUrl(i, "js");
    return this._registry.has(s) || this._registry.has(t);
  }
  getRegistry() {
    const e = {};
    for (const [i, s] of this._registry)
      e[i] = { ...s };
    return e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  getConfig() {
    return { ...this._config };
  }
  getVersion() {
    return p;
  }
  info() {
    return { moduleId: _, version: p, initialized: this._initialized, initTimestamp: this._initTimestamp, config: this.getConfig(), metrics: this.getMetrics(), registrySize: this._registry.size, pendingSize: this._pending.size, portsInitialized: g.isInitialized(), timestamp: Date.now() };
  }
  healthCheck() {
    const e = { initialized: this._initialized, configValid: !!this._config, registryAccessible: this._registry instanceof Map, lowFailureRate: this._metrics.cssFailures + this._metrics.jsFailures < 5, hasLoadedAssets: this._metrics.cssLoaded + this._metrics.jsLoaded > 0 || this._registry.size === 0, portsInitialized: g.isInitialized() }, i = Object.values(e).filter(Boolean).length, s = Object.keys(e).length, t = Object.keys(e).filter((n) => !e[n]);
    return { status: i < s * 0.6 ? "UNHEALTHY" : i < s ? "DEGRADED" : "HEALTHY", score: i, maxScore: s, scoreDisplay: `${i}/${s}`, checks: e, issues: t.length > 0 ? t : null, metrics: this.getMetrics(), version: p, moduleId: _, portsInitialized: g.isInitialized(), timestamp: Date.now(), p24Instrumented: !0 };
  }
  reset() {
    this._registry.clear(), this._pending.clear(), this._metrics = { cssLoaded: 0, cssFailures: 0, jsLoaded: 0, jsFailures: 0, totalLoadTime: 0, cacheHits: 0 }, h("info", "Reset complete");
  }
}
const f = new E();
typeof window < "u" && (window.AssetLoader = f, window.__dev = window.__dev || {}, window.__dev.assetLoader = { getVersion: () => p, info: () => f.info(), healthCheck: () => f.healthCheck(), getRegistry: () => f.getRegistry(), getMetrics: () => f.getMetrics(), reset: () => f.reset() });
export {
  f as AssetLoader,
  _ as MODULE_ID,
  p as VERSION,
  f as default,
  $ as getPorts,
  D as injectPorts
};
