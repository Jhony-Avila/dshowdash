import { createUiPorts as a } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS as E } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS as o } from "/core/runtime/events/catalog/component.events.js";
import "/core/runtime/events/catalog/nav.events.js";
import { requestNavigation as da } from "/components/header/core/navigation-adapter.js";
import "/core/runtime/enterprise/strict-mode.js";
import { getAnnouncerRoot as ma, getTooltipRoot as pa } from "/components/header/utils/overlay-root.js";
const Rs = "1.1.0", Ls = "currency-rotator", cn = "header/components/currency-rotator", ln = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, fa = 5e3, ga = 3e4, _a = 280, ba = 40, ya = 12e3, Ca = "cotacao:asset", Ea = "#/panel-cotacao", va = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="#e0e0e0" height="336" rx="40" width="480" x="19.499" y="91.5"/><path d="m259.499 187.5h240v48h-240z" fill="#b73831"/><path d="m307.5 211.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#d4483f"/><path d="m307.5 163.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><path d="m307.5 259.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><g fill="#b73831"><path d="m19.499 283.5h480v48h-480z"/><path d="m19.5 387.5a40 40 0 0 0 40 40h400a40 40 0 0 0 40-40v-8h-480z"/><path d="m459.5 91.5h-200v48h240v-8a40 40 0 0 0 -40-40z"/></g><path d="m259.5 283.5v-192h-200a40 40 0 0 0 -40 40v152z" fill="#2b66ba"/><path d="m43.5 94.877v132.623a32 32 0 0 0 32 32h184v-168h-200a39.781 39.781 0 0 0 -16 3.377z" fill="#3477cc"/><polygon fill="#e0e0e0" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/><polygon fill="#fff" points="74.894,139.3 67.499,123.563 67.499,163.317 82.32,171.5 79.484,154.133 91.499,141.834"/></svg>', Da = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 496"><path fill="#DC3027" d="M496,369.6c0,27.2-21.6,46.4-48,46.4H48c-26.4,0-48-19.2-48-46.4V126.4C0,99.2,21.6,80,48,80h400c26.4,0,48,19.2,48,46.4V369.6z"/><polygon fill="#F8D12E" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/></svg>', ka = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="btc-grad" x1="6.105" x2="25.895" y1="6.105" y2="25.895" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fdc830"/><stop offset="1" stop-color="#f37335"/></linearGradient></defs><path d="m18 15h-5v-4h5a2 2 0 0 1 0 4zm1 2h-6v4h6a2 2 0 0 0 0-4zm11-1a14 14 0 1 1 -14-14 14.016 14.016 0 0 1 14 14zm-7 3a3.988 3.988 0 0 0 -1.965-3.425 3.963 3.963 0 0 0 .965-2.575 4 4 0 0 0 -4-4v-2h-2v2h-1v-2h-2v2h-3v2h1v10h-1v2h3v2h2v-2h1v2h2v-2h1a4 4 0 0 0 4-4z" fill="url(#btc-grad)"/></svg>';
function Nn(t) {
  return t == null ? "--" : Number(t).toFixed(2);
}
function Ia(t) {
  return t == null ? "--" : t >= 1e3 ? `$${(t / 1e3).toFixed(2)}K` : `$${Number(t).toFixed(2)}`;
}
function Sa(t) {
  return t == null || isNaN(t) ? "--" : `${t > 0 ? "+" : ""}${Number(t).toFixed(2)}%`;
}
const G = [
  { key: "usd-brl", title: "Dólar (USD/BRL)", icon: va, endpoint: "/api/currencies/get_usd_brl.php", pickVal: function(t) {
    return t.rate;
  }, pickChg: function(t) {
    return t.percent_change;
  }, fmtVal: Nn },
  { key: "usd-cny", title: "Yuan (USD/CNY)", icon: Da, endpoint: "/api/currencies/get_usd_cny.php", pickVal: function(t) {
    return t.rate;
  }, pickChg: function(t) {
    return t.percent_change;
  }, fmtVal: Nn },
  { key: "btc", title: "Bitcoin (BTC/USD)", icon: ka, endpoint: "/api/currencies/get_btc.php", pickVal: function(t) {
    return t.usd;
  }, pickChg: function(t) {
    return t.usd_24h_change;
  }, fmtVal: Ia }
];
(function() {
  const e = "/components/header/components/currency-rotator/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function l(t) {
  t = t || {}, this.container = t.container, this.VERSION = Rs, this.id = Ls, this.capabilities = ln;
  const e = t.config && Number(t.config.pollingInterval);
  this.pollMs = e && e > 0 ? e : ga, this.element = null, this.track = null, this.isDestroyed = !1, this.rotIndex = 0, this.data = {}, this._rotTimer = null, this._pollTimer = null, this._resetTimer = null, this._hovered = !1, this._focused = !1, this._onEnter = null, this._onLeave = null, this._onFocus = null, this._onBlur = null, this._onClick = null, this._onKey = null, this._onVis = null;
}
l.prototype.mount = function() {
  return this.isDestroyed || (this.render(), this.fetchAll(), this.startPolling(), this.startRotation()), Promise.resolve();
};
l.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "currency-rotator-component", this.element.dataset.status = "loading", this.element.setAttribute("role", "button"), this.element.setAttribute("tabindex", "0"), this.element.setAttribute("aria-label", "Cotações — clique para abrir o painel"), this.element.title = G[0].title;
  const e = document.createElement("div");
  e.className = "cr-viewport", this.track = document.createElement("div"), this.track.className = "cr-track";
  const s = G.concat([G[0]]);
  for (let n = 0; n < s.length; n++) this.track.appendChild(this._buildSlide(s[n]));
  e.appendChild(this.track), this.element.appendChild(e), this._applyIndex(!1), this.container && this.container.appendChild(this.element), this._onClick = function() {
    t._openCurrent();
  }, this._onKey = function(n) {
    (n.key === "Enter" || n.key === " " || n.key === "Spacebar") && (n.preventDefault(), t._openCurrent());
  }, this._onEnter = function() {
    t._hovered = !0, t._syncRotation();
  }, this._onLeave = function() {
    t._hovered = !1, t._syncRotation();
  }, this._onFocus = function() {
    t._focused = !0, t._syncRotation();
  }, this._onBlur = function() {
    t._focused = !1, t._syncRotation();
  }, this._onVis = function() {
    document.hidden || t.fetchAll();
  }, this.element.addEventListener("click", this._onClick), this.element.addEventListener("keydown", this._onKey), this.element.addEventListener("mouseenter", this._onEnter), this.element.addEventListener("mouseleave", this._onLeave), this.element.addEventListener("focus", this._onFocus), this.element.addEventListener("blur", this._onBlur), document.addEventListener("visibilitychange", this._onVis);
};
l.prototype._syncRotation = function() {
  this._hovered || this._focused ? this.stopRotation() : this.startRotation();
};
l.prototype._buildSlide = function(t) {
  const e = document.createElement("div");
  return e.className = "cr-slide", e.dataset.asset = t.key, e.innerHTML = `<div class="currency-icon">${t.icon}</div><div class="currency-data"><span class="currency-value">--</span><span class="currency-trend">--</span></div>`, e;
};
l.prototype.currentAsset = function() {
  return G[this.rotIndex % G.length];
};
l.prototype._applyIndex = function(t) {
  this.track && (this.track.style.transition = t ? "" : "none", this.track.style.transform = `translateY(${-this.rotIndex * ba}px)`, t || (this.track.offsetHeight, this.track.style.transition = ""));
};
l.prototype.advance = function() {
  const t = this;
  if (this.isDestroyed || !this.track) return;
  const e = G.length;
  this.rotIndex += 1, this._applyIndex(!0), this.element && (this.element.title = this.currentAsset().title), this.rotIndex >= e && (this._resetTimer && clearTimeout(this._resetTimer), this._resetTimer = setTimeout(function() {
    t.isDestroyed || (t.rotIndex = 0, t._applyIndex(!1), t.element && (t.element.title = t.currentAsset().title));
  }, _a + 60));
};
l.prototype.startRotation = function() {
  const t = this;
  this.isDestroyed || (this.stopRotation(), this._rotTimer = setInterval(function() {
    t.advance();
  }, fa));
};
l.prototype.stopRotation = function() {
  this._rotTimer && (clearInterval(this._rotTimer), this._rotTimer = null), this._resetTimer && (clearTimeout(this._resetTimer), this._resetTimer = null);
};
l.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this._pollTimer && clearInterval(this._pollTimer), this._pollTimer = setInterval(function() {
    document.hidden || t.fetchAll();
  }, this.pollMs));
};
l.prototype.fetchAll = function() {
  for (let t = 0; t < G.length; t++) this.fetchAsset(G[t]);
};
l.prototype.fetchAsset = function(t) {
  const e = this;
  if (this.isDestroyed) return Promise.resolve();
  const s = new AbortController(), n = setTimeout(function() {
    s.abort();
  }, ya);
  return fetch(t.endpoint, { signal: s.signal, headers: { "Content-Type": "application/json" } }).then(function(i) {
    if (clearTimeout(n), !i.ok) throw new Error("HTTP " + i.status);
    return i.json();
  }).then(function(i) {
    if (e.isDestroyed) return;
    if (!i || !i.ok || !i.data) throw new Error("API_ERROR");
    const r = t.pickVal(i.data), u = t.pickChg(i.data);
    if (r == null) throw new Error("NO_VALUE");
    e.data[t.key] = { value: r, chg: u ?? 0 }, e._renderAsset(t), e.element && (e.element.dataset.status = "ok");
  }).catch(function() {
    clearTimeout(n), !e.isDestroyed && (e.data[t.key] || (e.data[t.key] = null, e._renderAsset(t)));
  });
};
l.prototype._renderAsset = function(t) {
  if (!this.element) return;
  const e = this.data[t.key], s = this.element.querySelectorAll('.cr-slide[data-asset="' + t.key + '"]');
  for (let n = 0; n < s.length; n++) {
    const i = s[n].querySelector(".currency-value"), r = s[n].querySelector(".currency-trend");
    !i || !r || (e ? (i.textContent = t.fmtVal(e.value), r.textContent = Sa(e.chg), r.className = "currency-trend " + (e.chg >= 0 ? "positive" : "negative")) : (i.textContent = "--", r.textContent = "--", r.className = "currency-trend"));
  }
};
l.prototype._openCurrent = function() {
  const t = this.currentAsset();
  try {
    sessionStorage.setItem(Ca, t.key);
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent("cotacao:asset", { detail: t.key }));
  } catch {
  }
  try {
    window.location.hash = Ea;
  } catch {
  }
};
l.prototype.unmount = function() {
  return this.isDestroyed = !0, this.stopRotation(), this._pollTimer && (clearInterval(this._pollTimer), this._pollTimer = null), this.element && (this._onClick && this.element.removeEventListener("click", this._onClick), this._onKey && this.element.removeEventListener("keydown", this._onKey), this._onEnter && this.element.removeEventListener("mouseenter", this._onEnter), this._onLeave && this.element.removeEventListener("mouseleave", this._onLeave), this._onFocus && this.element.removeEventListener("focus", this._onFocus), this._onBlur && this.element.removeEventListener("blur", this._onBlur)), this._onVis && document.removeEventListener("visibilitychange", this._onVis), this.element && (this.element.remove(), this.element = null), this.track = null, Promise.resolve();
};
l.prototype.healthCheck = function() {
  const t = {
    isMounted: !!this.element,
    hasTrack: !!this.track,
    rotationActive: !!this._rotTimer,
    pollingActive: !!this._pollTimer,
    hasData: Object.keys(this.data).length > 0
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e >= 4 ? "HEALTHY" : e >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: e,
    maxScore: 5,
    checks: t,
    version: Rs,
    moduleId: cn,
    id: Ls
  };
};
l.prototype.info = function() {
  return { version: Rs, moduleId: cn, id: Ls, capabilities: ln, mounted: !!this.element, assets: G.map(function(t) {
    return t.key;
  }), rotIndex: this.rotIndex };
};
var wa = l;
const Aa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CurrencyRotatorComponent: l,
  MODULE_ID: cn,
  VERSION: Rs,
  capabilities: ln,
  default: wa,
  id: Ls
}, Symbol.toStringTag, { value: "Module" })), kr = "5.4.0-ES6", Us = "header.errors-status.api.fetch", un = a({ moduleId: Us });
function hn(t) {
  return un.get(t);
}
const $a = () => {
  const t = hn("config");
  return t && t.app && t.app.debug || !1;
}, Oa = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), s = hn("logger");
  if (!s) return;
  $a();
  const n = s[t] || s.info;
  typeof n == "function" && n(`[${Us}]`, e.join(" "));
};
function ne(t) {
  t = t || {}, this.baseUrl = t.baseUrl || "/api/errors", this.timeout = t.timeout || 5e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
ne.prototype.fetchErrors = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout);
  return fetch(t.baseUrl, { method: "GET", headers: { "Content-Type": "application/json" }, signal: e.signal }).then((n) => (clearTimeout(s), n.ok ? (t._metrics.successCount++, n.json()) : (t._metrics.errorCount++, { error_count: 0 }))).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Oa("error", "Failed to fetch errors", n.message), { error_count: 0 }));
};
ne.prototype.healthCheck = function() {
  const t = un.snapshot(), e = { hasBaseUrl: !!this.baseUrl, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, hasLogger: !!hn("logger"), portsInitialized: t._initialized }, s = Object.values(e).filter(Boolean).length;
  return { status: s >= 3 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 4, scoreDisplay: `${s}/4`, checks: e, version: kr, moduleId: Us, portsInitialized: t._initialized, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
ne.prototype.info = function() {
  const t = un.snapshot();
  return { version: kr, moduleId: Us, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: t._initialized, healthCheck: this.healthCheck() };
};
ne.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
ne.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Ma = ne;
const jn = "5.1.0-ENTERPRISE", Bn = "header/components/errors-status/core/lifecycle";
let Ir = !1, Ye = [];
function Ta(t, ...e) {
  !Ir && t === "debug" || (Ye.push({ level: t, args: e, ts: Date.now() }), Ye.length > 50 && Ye.shift());
}
let Pa = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, Ta("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: jn, moduleId: Bn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: jn, moduleId: Bn, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Ir = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ye];
  }
};
const zn = "5.1.0-ENTERPRISE", qn = "header/components/errors-status/state/store";
let Sr = !1, Fe = [];
function Ra(t, ...e) {
  !Sr && t === "debug" || (Fe.push({ level: t, args: e, ts: Date.now() }), Fe.length > 50 && Fe.shift());
}
let La = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        Ra("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: zn, moduleId: qn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: zn, moduleId: qn, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Sr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Fe];
  }
};
const wr = "header.errors-status.telemetry.logger", Ua = "8.4.0-ES6", We = a({ moduleId: wr });
function be(t) {
  return We.get(t);
}
let ie = { logs: 0, warns: 0, errors: 0 };
function dt(t) {
  t || (t = {}), this.prefix = t.prefix || "[errors-status]", this.debug = t.debug || !1;
}
dt.prototype.info = function(...t) {
  if (!this.debug) return;
  ie.logs++;
  const e = be("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
dt.prototype.warn = function(...t) {
  ie.warns++;
  const e = be("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
dt.prototype.error = function(...t) {
  ie.errors++;
  const e = be("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
dt.prototype.debug = function(...t) {
  if (!this.debug) return;
  ie.logs++;
  const e = be("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
dt.prototype.getMetrics = () => Object.assign({}, ie);
dt.prototype.resetMetrics = () => {
  ie = { logs: 0, warns: 0, errors: 0 };
};
dt.prototype.healthCheck = function() {
  return { status: We.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ua, moduleId: wr, checks: { loggerReady: !!be("logger"), portsInitialized: We.isInitialized() }, metrics: this.getMetrics(), portsInitialized: We.isInitialized() };
};
const Vn = "5.1.0-ENTERPRISE", Gn = "header/components/errors-status/telemetry/tracker";
let xa = [], Ha = class {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Vn, moduleId: Gn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Vn, moduleId: Gn, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...xa];
  }
};
const Yn = "5.1.0-ENTERPRISE", Fn = "header/components/errors-status/core/polling";
let Ar = !1, Ke = [];
function Na(t, ...e) {
  !Ar && t === "debug" || (Ke.push({ level: t, args: e, ts: Date.now() }), Ke.length > 50 && Ke.shift());
}
let ja = class {
  constructor(e = {}) {
    this.interval = e.interval || 3e4, this.immediate = e.immediate !== !1, this.timerId = null, this.isRunning = !1, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this.immediate && this._execute(), this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.isRunning && (this.isRunning = !1, this.timerId && (clearInterval(this.timerId), this.timerId = null));
  }
  async _execute() {
    if (!document.hidden && this.callbacks.length !== 0) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      try {
        for (const e of this.callbacks)
          await e();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++, Na("error", "Execution error:", e);
      }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Yn, moduleId: Fn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Yn, moduleId: Fn, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Ar = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ke];
  }
};
const dn = "8.8.0-P1-UARPS", ye = "errors-status", $r = { type: "indicator", reorderable: !1, hideable: !1, critical: !0, rendersUI: !0 }, mt = "header/components/errors-status", vt = a({ moduleId: mt }), Ba = () => {
  vt.init();
}, Dt = (t) => vt.get(t), za = (t) => vt.inject(t), qa = () => vt.snapshot();
(function() {
  const e = "/components/header/components/errors-status/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const Va = (t = {}) => {
  const e = Dt("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:errors-status", source: mt, timestamp: Date.now(), kind: "ui", meta: Object.assign({ label: "Erros do Sistema" }, t) });
}, Ga = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m208.587 54.407-201.17 348.437c-21.073 36.499 5.268 82.122 47.413 82.122h402.34c42.145 0 68.486-45.624 47.413-82.122l-201.17-348.437c-21.072-36.498-73.754-36.498-94.826 0z" fill="#da4a54"/><path d="m54.83 443.76c-6.802 0-10.267-4.242-11.727-6.771s-3.401-7.65 0-13.542l201.17-348.436c3.401-5.891 8.807-6.771 11.727-6.771s8.326.88 11.727 6.771l201.17 348.436c3.401 5.891 1.46 11.013 0 13.541-1.46 2.529-4.925 6.771-11.727 6.771h-402.34z" fill="#f6e266"/><g fill="#544f57"><path d="m256 327.138c-14.379 0-26.036-11.657-26.036-26.036v-119.216c0-14.379 11.657-26.036 26.036-26.036 14.379 0 26.036 11.657 26.036 26.036v119.217c0 14.379-11.657 26.035-26.036 26.035z"/><circle cx="256" cy="381.152" r="26.036"/></g></svg>';
function R(t) {
  t = t || {}, this.container = t.container, this.store = new La({ errorCount: 0, status: "loading" }), this.eventBus = Dt("eventBus"), this.lifecycle = new Pa(this);
  const e = Dt("config");
  this.logger = new dt({ prefix: "[Errors]", debug: e && e.app && e.app.debug }), this.telemetry = new Ha(), this.api = new Ma(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
R.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Ba(), this.lifecycle.mount().then(() => (t.render(), t.fetchErrors())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Dt("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: ye, moduleId: mt, timestamp: Date.now() });
  }));
};
R.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "errors-status-component", this.element.title = "Erros do Sistema", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-errors-status"), this.element.innerHTML = `<div class="errors-icon">${Ga}</div><span class="errors-badge">0</span>`, this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), Va({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().errorCount : 0 });
  }), this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
R.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".errors-badge");
  t.errorCount !== null ? (this.element.dataset.count = String(t.errorCount), this.element.dataset.status = t.errorCount > 0 ? "has-errors" : "ok", e.textContent = t.errorCount > 99 ? "99+" : t.errorCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
R.prototype.fetchErrors = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchErrors().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ errorCount: e.error_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Dt("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: ye, moduleId: mt, data: { errorCount: e.error_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
R.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new ja({ interval: 3e4 }), this.polling.onPoll(() => t.fetchErrors()), this.polling.start());
};
R.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Dt("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: ye, moduleId: mt, timestamp: Date.now() });
  });
};
R.prototype.healthCheck = function() {
  const t = Dt("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: vt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: vt.isInitialized(), version: dn, moduleId: mt };
};
R.prototype.info = function() {
  return { version: dn, moduleId: mt, id: ye, capabilities: $r, portsInitialized: vt.isInitialized(), mounted: !!this.element, errorCount: this.store.getState().errorCount, metrics: this._metrics };
};
var Ya = R;
const Fa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorsStatusComponent: R,
  MODULE_ID: mt,
  VERSION: dn,
  capabilities: $r,
  default: Ya,
  getPorts: qa,
  id: ye,
  injectPorts: za
}, Symbol.toStringTag, { value: "Module" })), Or = "header-components-navigation-helper";
a({ moduleId: Or });
function v(t, e) {
  return t ? da({
    route: t,
    source: e || Or
  }) : !1;
}
const Mr = "6.2.0-ES6", Ce = "header.notifications.api.fetch", As = a({ moduleId: Ce });
function Tr(t) {
  return As.get(t);
}
function Qt(t, ...e) {
  const s = Tr("logger");
  s && s[t] && s[t](...[`[${Ce}]`].concat(e));
}
function Fs(t, e) {
  try {
    const s = Tr("telemetry");
    s && s.track && s.track(`${Ce}:${t}`, e || {});
  } catch {
  }
}
function Wa(t) {
  const e = t.headers.get("content-type") || "", s = e.indexOf("application/json") !== -1, n = e.indexOf("text/html") !== -1;
  return {
    ok: t.ok,
    status: t.status,
    isJson: s,
    isHtml: n,
    contentType: e,
    isContractViolation: !s && t.ok,
    isAuthError: t.status === 401 || t.status === 403
  };
}
function te(t) {
  return { unread_count: 0, _fallback: !0, _reason: t };
}
function Gt(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api/notifications", this.timeout = t.timeout || 1e4, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}
Gt.prototype.get = function(t) {
  const e = this;
  e._metrics.requestCount++, e._metrics.lastRequestAt = Date.now();
  const s = new AbortController(), n = setTimeout(() => {
    s.abort();
  }, e.timeout);
  return fetch(e.baseURL + t, { signal: s.signal, credentials: "include" }).then((i) => {
    if (clearTimeout(n), !i.ok) throw new Error(`HTTP ${i.status}`);
    return e._metrics.successCount++, i.json();
  }).catch((i) => {
    clearTimeout(n), e._metrics.errorCount++;
    const r = i.name === "AbortError" ? "timeout" : "network-error";
    return Qt("warn", "Request failed (non-fatal), using fallback", { endpoint: t, reason: r, error: i.message }), te(r);
  });
};
Gt.prototype.fetchNotifications = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout), n = `${t.baseURL}/?action=count`;
  return fetch(n, {
    signal: e.signal,
    credentials: "include",
    headers: { Accept: "application/json" }
  }).then((i) => {
    clearTimeout(s);
    const r = Wa(i);
    return r.isAuthError ? (t._metrics.authErrors++, Qt("info", "Auth required for notifications", { status: r.status }), Fs("auth-required", { status: r.status }), te("auth-required")) : r.isContractViolation ? (t._metrics.contractViolations++, Qt("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${r.contentType}`, { url: n, status: r.status }), Fs("contract-violation", { contentType: r.contentType, status: r.status, url: n }), te("contract-violation")) : !r.ok && r.isJson ? i.json().then((u) => (Qt("warn", "API returned error", { status: r.status, error: u.error || "unknown" }), te("api-error"))) : r.ok ? (t._metrics.successCount++, i.json()) : (t._metrics.errorCount++, Qt("error", "Request failed with non-JSON response", { status: r.status, contentType: r.contentType }), te("http-error"));
  }).then((i) => i && i._fallback ? i : { unread_count: i.unread_count || i.count || 0 }).catch((i) => {
    clearTimeout(s), t._metrics.errorCount++;
    const r = i.name === "AbortError" ? "timeout" : "network-error";
    return Qt("warn", "Fetch failed, using fallback", { error: i.message, reason: r }), Fs("fetch-error", { error: i.message, reason: r }), te(r);
  });
};
Gt.prototype.healthCheck = function() {
  const t = {
    hasBaseURL: !0,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    lowContractViolations: this._metrics.requestCount === 0 || this._metrics.contractViolations / this._metrics.requestCount < 0.1,
    portsInitialized: As.isInitialized()
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e === 4 ? "HEALTHY" : "DEGRADED",
    score: e,
    maxScore: 4,
    scoreDisplay: `${e}/4`,
    checks: t,
    portsInitialized: As.isInitialized(),
    version: Mr,
    moduleId: Ce,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
Gt.prototype.info = function() {
  return {
    version: Mr,
    moduleId: Ce,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: As.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
Gt.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
Gt.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
};
var Ka = Gt;
const Wn = "5.1.0-ENTERPRISE", Kn = "header/components/notifications/core/lifecycle";
let Pr = !1, Je = [];
function Ja(t, ...e) {
  !Pr && t === "debug" || (Je.push({ level: t, args: e, ts: Date.now() }), Je.length > 50 && Je.shift());
}
let Xa = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async unmount() {
    this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(e) {
    for (const s of this.hooks[e] || [])
      try {
        await s(this.component);
      } catch (n) {
        this._metrics.errorCount++, Ja("error", `Hook ${e} error:`, n);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Wn, moduleId: Kn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Wn, moduleId: Kn, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Pr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Je];
  }
};
const Jn = "5.1.0-ENTERPRISE", Xn = "header/components/notifications/state/store";
let Rr = !1, Xe = [];
function Za(t, ...e) {
  !Rr && t === "debug" || (Xe.push({ level: t, args: e, ts: Date.now() }), Xe.length > 50 && Xe.shift());
}
let Qa = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        Za("error", "Subscriber error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Jn, moduleId: Xn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Jn, moduleId: Xn, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Rr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Xe];
  }
};
const Lr = "header.notifications.telemetry.logger", tc = "8.4.0-ES6", Ze = a({ moduleId: Lr });
function Ee(t) {
  return Ze.get(t);
}
let re = { logs: 0, warns: 0, errors: 0 };
function pt(t) {
  t || (t = {}), this.prefix = t.prefix || "[notifications]", this.debug = t.debug || !1;
}
pt.prototype.info = function(...t) {
  if (!this.debug) return;
  re.logs++;
  const e = Ee("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
pt.prototype.warn = function(...t) {
  re.warns++;
  const e = Ee("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
pt.prototype.error = function(...t) {
  re.errors++;
  const e = Ee("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
pt.prototype.debug = function(...t) {
  if (!this.debug) return;
  re.logs++;
  const e = Ee("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
pt.prototype.getMetrics = () => Object.assign({}, re);
pt.prototype.resetMetrics = () => {
  re = { logs: 0, warns: 0, errors: 0 };
};
pt.prototype.healthCheck = function() {
  return { status: Ze.isInitialized() ? "HEALTHY" : "DEGRADED", version: tc, moduleId: Lr, checks: { loggerReady: !!Ee("logger"), portsInitialized: Ze.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Ze.isInitialized() };
};
const Zn = "5.1.0-ENTERPRISE", Qn = "header/components/notifications/telemetry/tracker";
let ec = [], sc = class {
  constructor(e = {}) {
    this.events = [], this.maxEvents = e.maxEvents || 100, this.enabled = e.enabled !== !1, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  getEvents() {
    return [...this.events];
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Zn, moduleId: Qn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Zn, moduleId: Qn, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ec];
  }
};
const ti = "5.1.0-ENTERPRISE", ei = "header/components/notifications/core/polling";
let Ur = !1, Qe = [];
function nc(t, ...e) {
  !Ur && t === "debug" || (Qe.push({ level: t, args: e, ts: Date.now() }), Qe.length > 50 && Qe.shift());
}
let ic = class {
  constructor(e = {}) {
    this.interval = e.interval || 3e4, this.timerId = null, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.timerId || (this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.timerId && clearInterval(this.timerId), this.timerId = null;
  }
  async _execute() {
    if (!document.hidden) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      for (const e of this.callbacks)
        try {
          await e(), this._metrics.successCount++;
        } catch (s) {
          this._metrics.errorCount++, nc("error", "Poll error:", s);
        }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: !!this.timerId, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ti, moduleId: ei, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ti, moduleId: ei, isRunning: !!this.timerId, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Ur = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Qe];
  }
};
const mn = "10.4.0-FASE-B", ve = "notifications", xr = { type: "indicator", reorderable: !0, hideable: !1, critical: !0, rendersUI: !0 }, L = "header/components/notifications", rc = "#/notificacoes", kt = a({ moduleId: L }), oc = () => {
  kt.init();
}, P = (t) => kt.get(t), ac = (t) => kt.inject(t), cc = () => kt.snapshot();
function lc() {
  const t = P("globalState");
  if (t) {
    if (typeof t.isAuthenticated == "function")
      try {
        return t.isAuthenticated();
      } catch {
      }
    if (typeof t.getState == "function")
      try {
        const e = t.getState();
        if (e && e.auth && e.auth.isAuthenticated) return !0;
      } catch {
      }
  }
  return !1;
}
(function() {
  const e = "/components/header/components/notifications/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const uc = (t = {}) => {
  const e = P("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:notifications", source: L, timestamp: Date.now(), kind: "ui", meta: Object.assign({ label: "Notificações" }, t) });
}, hc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M29.07 26.74 27 20.733V16a9.008 9.008 0 0 0-6-8.475V6a3 3 0 0 0-6 0v1.525A9.008 9.008 0 0 0 9 16v4.574l-2.285 6.285A2.339 2.339 0 0 0 8.914 30h5.228a3.981 3.981 0 0 0 7.716 0h5.06a2.34 2.34 0 0 0 2.152-3.26zM17 7V6a1 1 0 0 1 2 0v1zm1 24a1.993 1.993 0 0 1-1.722-1h3.444A1.993 1.993 0 0 1 18 31zm9.2-3.156a.334.334 0 0 1-.287.156h-18a.34.34 0 0 1-.32-.457L11 20.926V16a7 7 0 0 1 14 0v5.068l2.193 6.363.036.088a.335.335 0 0 1-.024.325z" fill="currentColor"/></svg>';
function U(t) {
  t = t || {}, this.container = t.container, this.store = new Qa({ unreadCount: 0, status: "loading" }), this.eventBus = P("eventBus"), this.lifecycle = new Xa(this);
  const e = P("config");
  this.logger = new pt({ prefix: "[Notifications]", debug: e && e.app && e.app.debug }), this.telemetry = new sc(), this.api = new Ka(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
U.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (oc(), this.lifecycle.mount().then(() => (t.render(), t.fetchNotifications())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = P("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: ve, moduleId: L, timestamp: Date.now() });
  }));
};
U.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "notifications-component", this.element.title = "Notificações", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-notifications"), this.element.innerHTML = `<div class="notifications-icon">${hc}</div><span class="notifications-badge">0</span>`, this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), uc({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 }), v(rc, L);
  }), this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
U.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".notifications-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
U.prototype.fetchNotifications = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchNotifications().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = P("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: ve, moduleId: L, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
U.prototype.startPolling = function() {
  const t = this;
  if (this.isDestroyed) return;
  if (!lc()) {
    const s = P("logger");
    s && s.info && s.info(`[${L}] Polling skipped: not authenticated (expected on login)`);
    return;
  }
  this.polling = new ic({ interval: 3e4 }), this.polling.onPoll(() => t.fetchNotifications()), this.polling.start();
};
U.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = P("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: ve, moduleId: L, timestamp: Date.now() });
  });
};
U.prototype.healthCheck = function() {
  const t = P("eventBus"), e = P("globalState"), s = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: kt.isInitialized(), portsGlobalStateAvailable: !!e }, n = Object.values(s).filter(Boolean).length, i = Object.keys(s).length;
  return { status: n === i ? "HEALTHY" : n >= i - 2 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: i, checks: s, portsInitialized: kt.isInitialized(), version: mn, moduleId: L };
};
U.prototype.info = function() {
  return { version: mn, moduleId: L, id: ve, capabilities: xr, portsInitialized: kt.isInitialized(), mounted: !!this.element, unreadCount: this.store.getState().unreadCount, metrics: this._metrics };
};
var dc = U;
const mc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: L,
  NotificationsComponent: U,
  VERSION: mn,
  capabilities: xr,
  default: dc,
  getPorts: cc,
  id: ve,
  injectPorts: ac
}, Symbol.toStringTag, { value: "Module" })), si = "5.1.0-ENTERPRISE", ni = "header/components/real-time-clock/core/lifecycle";
let Hr = !1, ts = [];
function pc(t, ...e) {
  !Hr && t === "debug" || (ts.push({ level: t, args: e, ts: Date.now() }), ts.length > 50 && ts.shift());
}
let fc = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async unmount() {
    this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(e) {
    for (const s of this.hooks[e] || [])
      try {
        await s(this.component);
      } catch (n) {
        this._metrics.errorCount++, pc("error", `Hook ${e} error:`, n);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: si, moduleId: ni, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: si, moduleId: ni, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Hr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ts];
  }
};
const ii = "5.1.0-ENTERPRISE", ri = "header/components/real-time-clock/state/store";
let Nr = !1, es = [];
function gc(t, ...e) {
  !Nr && t === "debug" || (es.push({ level: t, args: e, ts: Date.now() }), es.length > 50 && es.shift());
}
let _c = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        gc("error", "Subscriber error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ii, moduleId: ri, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ii, moduleId: ri, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Nr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...es];
  }
};
const jr = "header.real-time-clock.telemetry.logger", bc = "8.4.0-ES6", ss = a({ moduleId: jr });
function De(t) {
  return ss.get(t);
}
let ke = { logs: 0, warns: 0, errors: 0 };
function Yt(t) {
  t || (t = {}), this.prefix = t.prefix || "[real-time-clock]", this.debug = t.debug || !1;
}
Yt.prototype.info = function(...t) {
  if (!this.debug) return;
  ke.logs++;
  const e = De("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Yt.prototype.warn = function(...t) {
  ke.warns++;
  const e = De("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Yt.prototype.error = function(...t) {
  ke.errors++;
  const e = De("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Yt.prototype.debug = function(...t) {
  if (!this.debug) return;
  ke.logs++;
  const e = De("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Yt.prototype.getMetrics = () => Object.assign({}, ke);
Yt.prototype.healthCheck = function() {
  return { status: ss.isInitialized() ? "HEALTHY" : "DEGRADED", version: bc, moduleId: jr, checks: { loggerReady: !!De("logger"), portsInitialized: ss.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ss.isInitialized() };
};
const oi = "5.1.0-ENTERPRISE", ai = "header/components/real-time-clock/telemetry/tracker";
let yc = [], Cc = class {
  constructor(e = {}) {
    this.events = [], this.maxEvents = e.maxEvents || 100, this.enabled = e.enabled !== !1, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  getEvents() {
    return [...this.events];
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: oi, moduleId: ai, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: oi, moduleId: ai, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...yc];
  }
};
const pn = "8.6.0-ES6", xs = "real-time-clock", Br = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, oe = "header/components/real-time-clock", It = a({ moduleId: oe });
function Ec() {
  It.init();
}
function _e(t) {
  return It.get(t);
}
function vc(t) {
  return It.inject(t);
}
function Dc() {
  return It.snapshot();
}
(function() {
  const e = "/components/header/components/real-time-clock/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function st(t) {
  t = t || {}, this.container = t.container, this.store = new _c({ time: "" }), this.eventBus = _e("eventBus"), this.lifecycle = new fc(this);
  const e = _e("config");
  this.logger = new Yt({ prefix: "[Clock]", debug: e && e.app && e.app.debug }), this.telemetry = new Cc(), this.element = null, this.isDestroyed = !1, this.intervalId = null, this.unsubscribe = null, this._metrics = { mountCount: 0, tickCount: 0, lastMountAt: null };
}
st.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Ec(), this.lifecycle.mount().then(() => {
    t.render(), t.startClock(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = _e("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: xs, moduleId: oe, timestamp: Date.now() });
  }));
};
st.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "real-time-clock-component", this.element.dataset.status = "ok", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-real-time-clock"), this.element.innerHTML = '<span class="clock-time">--:--</span>', this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
st.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".clock-time");
  e && (e.textContent = t.time);
};
st.prototype.startClock = function() {
  const t = this, e = () => {
    if (t.isDestroyed) return;
    const n = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    t.store.setState({ time: n }), t._metrics.tickCount++;
  };
  e(), this.intervalId = setInterval(e, 1e3);
};
st.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.intervalId && (clearInterval(t.intervalId), t.intervalId = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = _e("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: xs, moduleId: oe, timestamp: Date.now() });
  });
};
st.prototype.healthCheck = function() {
  const t = _e("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, clockRunning: !!this.intervalId, portsInitialized: It.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: It.isInitialized(), version: pn, moduleId: oe };
};
st.prototype.info = function() {
  return { version: pn, moduleId: oe, id: xs, capabilities: Br, portsInitialized: It.isInitialized(), mounted: !!this.element, time: this.store.getState().time, metrics: this._metrics };
};
var kc = st;
const Ic = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: oe,
  RealTimeClockComponent: st,
  VERSION: pn,
  capabilities: Br,
  default: kc,
  getPorts: Dc,
  id: xs,
  injectPorts: vc
}, Symbol.toStringTag, { value: "Module" })), zr = "6.1.0-ES6", Hs = "header.weather-sp.api.fetch", $s = a({ moduleId: Hs });
function Sc(t) {
  return $s.get(t);
}
function ci(t, ...e) {
  const s = Sc("logger");
  s && s[t] && s[t].apply(s, [`[${Hs}]`].concat(e));
}
function li(t) {
  return {
    city: "São Paulo",
    temperature: null,
    condition: "Indisponível",
    humidity: null,
    updated_at: null,
    _fallback: !0,
    _fallback_reason: t
  };
}
function wc(t) {
  if (!t) return !1;
  if (t.name === "AbortError") return !0;
  const e = String(t.message || "").toLowerCase();
  return e.indexOf("aborted") !== -1 || e.indexOf("abort") !== -1;
}
function ae(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api/weather", this.timeout = t.timeout || 12e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
ae.prototype.fetchWeather = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout);
  return fetch(`${t.baseURL}/get_sao_paulo.php`, {
    signal: e.signal,
    headers: { "Content-Type": "application/json" }
  }).then((n) => {
    if (clearTimeout(s), !n.ok) throw new Error(`HTTP ${n.status}`);
    return n.json();
  }).then((n) => {
    if (!n.ok) throw new Error(n.error || "API_ERROR");
    return t._metrics.successCount++, n.data;
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, wc(n) ? (ci("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), li("timeout")) : (ci("warn", "Fetch failed (non-fatal)", { error: n.message }), li("error"))));
};
ae.prototype.healthCheck = function() {
  const t = {
    hasBaseURL: !!this.baseURL,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    portsInitialized: $s.isInitialized()
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e === 3 ? "HEALTHY" : "DEGRADED",
    score: e,
    maxScore: 3,
    scoreDisplay: `${e}/3`,
    checks: t,
    portsInitialized: $s.isInitialized(),
    version: zr,
    moduleId: Hs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
ae.prototype.info = function() {
  return {
    version: zr,
    moduleId: Hs,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: $s.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
ae.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
ae.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Ac = ae;
const ui = "5.1.0-ENTERPRISE", hi = "header/components/weather-sp/core/lifecycle";
let qr = !1, ns = [];
function $c(t, ...e) {
  !qr && t === "debug" || (ns.push({ level: t, args: e, ts: Date.now() }), ns.length > 50 && ns.shift());
}
let Oc = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async unmount() {
    this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(e) {
    for (const s of this.hooks[e] || [])
      try {
        await s(this.component);
      } catch (n) {
        this._metrics.errorCount++, $c("error", `Hook ${e} error:`, n);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ui, moduleId: hi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ui, moduleId: hi, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    qr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ns];
  }
};
const di = "5.1.0-ENTERPRISE", mi = "header/components/weather-sp/state/store";
let Vr = !1, is = [];
function Mc(t, ...e) {
  !Vr && t === "debug" || (is.push({ level: t, args: e, ts: Date.now() }), is.length > 50 && is.shift());
}
let Tc = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  // @ts-expect-error TS migration - TS2349
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        Mc("error", "Subscriber error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: di, moduleId: mi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: di, moduleId: mi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Vr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...is];
  }
};
const Gr = "header.weather-sp.telemetry.logger", Pc = "2.3.0-ES6", rs = a({ moduleId: Gr });
function Ie(t) {
  return rs.get(t);
}
let Se = { logs: 0, warns: 0, errors: 0 };
function Ft(t) {
  t || (t = {}), this.prefix = t.prefix || "[weather-sp]", this.debug = t.debug || !1;
}
Ft.prototype.info = function() {
  if (!this.debug) return;
  Se.logs++;
  const t = Ie("logger");
  t && t.info ? t.info.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments))) : t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.warn = function() {
  Se.warns++;
  const t = Ie("logger");
  t && t.warn && t.warn.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.error = function() {
  Se.errors++;
  const t = Ie("logger");
  t && t.error && t.error.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.debug = function() {
  if (!this.debug) return;
  Se.logs++;
  const t = Ie("logger");
  t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.getMetrics = () => Object.assign({}, Se);
Ft.prototype.healthCheck = function() {
  return { status: rs.isInitialized() ? "HEALTHY" : "DEGRADED", version: Pc, moduleId: Gr, checks: { loggerReady: !!Ie("logger"), portsInitialized: rs.isInitialized() }, metrics: this.getMetrics(), portsInitialized: rs.isInitialized() };
};
const pi = "5.1.0-ENTERPRISE", fi = "header/components/weather-sp/telemetry/tracker";
let Rc = [], Lc = class {
  constructor(e = {}) {
    this.events = [], this.maxEvents = e.maxEvents || 100, this.enabled = e.enabled !== !1, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  getEvents() {
    return [...this.events];
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: pi, moduleId: fi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: pi, moduleId: fi, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Rc];
  }
};
const gi = "5.1.0-ENTERPRISE", _i = "header/components/weather-sp/core/polling";
let Yr = !1, os = [];
function Uc(t, ...e) {
  !Yr && t === "debug" || (os.push({ level: t, args: e, ts: Date.now() }), os.length > 50 && os.shift());
}
let xc = class {
  constructor(e = {}) {
    this.interval = e.interval || 3e5, this.timerId = null, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.timerId || (this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.timerId && clearInterval(this.timerId), this.timerId = null;
  }
  async _execute() {
    if (!document.hidden) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      for (const e of this.callbacks)
        try {
          await e(), this._metrics.successCount++;
        } catch (s) {
          this._metrics.errorCount++, Uc("error", "Poll error:", s);
        }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: !!this.timerId, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: gi, moduleId: _i, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: gi, moduleId: _i, isRunning: !!this.timerId, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Yr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...os];
  }
};
const fn = "9.7.0-P1-UARPS", we = "weather-sp", Fr = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, ft = "header/components/weather-sp", St = a({ moduleId: ft }), Hc = () => {
  St.init();
}, wt = (t) => St.get(t), Nc = (t) => St.inject(t), jc = () => St.snapshot(), Bc = (t = {}) => {
  const e = wt("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:weather-sp", source: ft, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/weather-sp/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const ge = { sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>', cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>', cloudRain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>', moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' }, zc = (t, e = !0) => t === 0 ? e ? ge.sun : ge.moon : t >= 1 && t <= 48 ? ge.cloud : ge.cloudRain;
function x(t) {
  t = t || {}, this.container = t.container, this.store = new Tc({ temp: null, code: 0, isDay: !0, status: "loading" }), this.eventBus = wt("eventBus"), this.lifecycle = new Oc(this);
  const e = wt("config");
  this.logger = new Ft({ prefix: "[Weather]", debug: e && e.app && e.app.debug }), this.telemetry = new Lc(), this.api = new Ac(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
x.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Hc(), this.lifecycle.mount().then(() => (t.render(), t.fetchWeather())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = wt("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: we, moduleId: ft, timestamp: Date.now() });
  }));
};
x.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "weather-sp-component", this.element.title = "Clima São Paulo", this.element.dataset.status = "loading", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-weather-sp"), this.element.innerHTML = `<div class="weather-icon">${ge.sun}</div><span class="weather-temp">--°C</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Bc({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().temp : null });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
x.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".weather-icon"), s = this.element.querySelector(".weather-temp");
  t.temp !== null ? (e.innerHTML = zc(t.code, t.isDay), s.textContent = `${Math.round(t.temp)}°C`, this.element.dataset.status = "ok") : (s.textContent = "--°C", this.element.dataset.status = "offline");
};
x.prototype.fetchWeather = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchWeather().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ temp: e.temperature, code: e.weathercode || 0, isDay: e.is_day !== 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = wt("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: we, moduleId: ft, data: { temp: e.temperature }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
x.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling && (this.polling.stop(), this.polling = null), this.polling = new xc({ interval: 3e5 }), this.polling.onPoll(() => t.fetchWeather()), this.polling.start());
};
x.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = wt("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: we, moduleId: ft, timestamp: Date.now() });
  });
};
x.prototype.healthCheck = function() {
  const t = wt("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: St.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: St.isInitialized(), version: fn, moduleId: ft };
};
x.prototype.info = function() {
  return { version: fn, moduleId: ft, id: we, capabilities: Fr, portsInitialized: St.isInitialized(), mounted: !!this.element, temp: this.store.getState().temp, metrics: this._metrics };
};
var qc = x;
const Vc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ft,
  VERSION: fn,
  WeatherSpComponent: x,
  capabilities: Fr,
  default: qc,
  getPorts: jc,
  id: we,
  injectPorts: Nc
}, Symbol.toStringTag, { value: "Module" })), Gc = "header/components/user-menu.core.ports", Ae = a({ moduleId: Gc });
function Yc() {
  Ae.init();
}
function ht(t) {
  return Ae.get(t);
}
function Fc(t) {
  return Ae.inject(t);
}
function Wc() {
  return Ae.snapshot();
}
function Ws() {
  return Ae.isInitialized();
}
const Kc = {
  redirect(t, e, s) {
    const n = ht("eventBus");
    n && n.emit && n.emit(E.HARD_NAV, {
      action: "redirect",
      url: t,
      reason: e,
      source: s,
      timestamp: Date.now()
    }), window.location.href = t;
  },
  VERSION: "1.0.0-INTERNAL"
};
function gn() {
  return ht("hardNavService") || Kc;
}
function Jc() {
  const t = "/components/header/components/user-menu/component.css";
  if (!document.querySelector(`link[href="${t}"]`)) {
    const e = document.createElement("link");
    e.rel = "stylesheet", e.href = t, document.head.appendChild(e);
  }
}
const _n = "header.user-menu.core.actions", Wr = a({ moduleId: _n });
let bi = !1;
function Kr() {
  bi || (Wr.init(), bi = !0);
}
function Xc(t) {
  return Kr(), Wr.get(t);
}
function Zc() {
  var e, s;
  Kr();
  const t = Xc("eventBus");
  if (t) return t;
  if (typeof window < "u" && ((s = (e = window.Core) == null ? void 0 : e.windowAdapter) != null && s.get)) {
    const n = window.Core.windowAdapter.get("EventBus");
    if (n) return n;
  }
  return null;
}
const ee = { id: "user-menu", label: "Menu do Usuário", icon: "user", kind: "ui" }, Qc = {
  profile: "#/meu-perfil",
  preferences: "#/preferencias",
  security: "#/seguranca-conta",
  notifications: "#/notificacoes",
  sessions: "#/sessoes-ativas"
};
function tl(t, e) {
  return v(t, e);
}
function Ns(t, e) {
  e || (e = {});
  const s = Zc();
  !s || !s.emit || s.emit(E.ACTION, { actionId: `header:${ee.id}:${t}`, source: _n, timestamp: Date.now(), meta: Object.assign({ label: ee.label, icon: ee.icon, kind: ee.kind }, e) });
}
function el(t, e) {
  const s = e.logger, n = e.store, i = e.onLogout;
  if (n.setState({ isOpen: !1 }), Ns(t, { action: t }), s && s.debug && s.debug(`Action: ${t}`), t === "logout" && i) {
    i();
    return;
  }
  const r = Qc[t];
  r && tl(r, _n);
}
function sl(t, ...e) {
}
function nl(t, e) {
  e.preventDefault(), e.stopPropagation(), t.toggleMenu();
}
function il(t, e) {
  t.isDestroyed || !t.element || !t.dropdown || !t.element.contains(e.target) && !t.dropdown.contains(e.target) && t.store.getState().isOpen && (Ns("close-outside", {}), t.store.setState({ isOpen: !1 }), t._announce("Menu fechado"));
}
function rl(t, e) {
  const s = t.dropdown.querySelectorAll(".dropdown-item");
  if (s.length === 0) return;
  let n = -1;
  const i = document.activeElement;
  for (let u = 0; u < s.length; u++)
    if (s[u] === i) {
      n = u;
      break;
    }
  let r = n + e;
  r < 0 && (r = s.length - 1), r >= s.length && (r = 0), s[r].focus(), t._announce(s[r].textContent.trim());
}
function ol(t, e) {
  if (t.isDestroyed) return;
  const s = t.store.getState();
  if (e.key === "Escape" && s.isOpen) {
    e.preventDefault(), t.toggleMenu(), t._announce("Menu fechado"), t._metrics.keyboardNavigationCount++;
    const n = t.element.querySelector(".user-menu-trigger");
    n && n.focus();
    return;
  }
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("user-menu-trigger")) {
    e.preventDefault(), t.toggleMenu(), t._metrics.keyboardNavigationCount++;
    return;
  }
  if (s.isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault(), rl(t, e.key === "ArrowDown" ? 1 : -1), t._metrics.keyboardNavigationCount++;
    return;
  }
  if (e.key === "Tab" && s.isOpen) {
    const n = t.dropdown.querySelector(".dropdown-item:last-of-type"), i = t.dropdown.querySelector(".dropdown-item:first-of-type");
    (!e.shiftKey && e.target === n || e.shiftKey && e.target === i) && (t.toggleMenu(), t._announce("Menu fechado"));
  }
}
function al(t) {
  t.shortcuts.register("Escape", () => {
    t.store.getState().isOpen && (t.toggleMenu(), t._announce("Menu fechado"));
  }), document.addEventListener("keydown", t.boundHandleKeydown);
}
function cl(t) {
  const e = t.dropdown.querySelectorAll(".dropdown-item"), s = {
    profile: "Ver e editar seu perfil",
    preferences: "Configurar suas preferências",
    security: "Gerenciar segurança da conta",
    notifications: "Configurar notificações",
    sessions: "Ver dispositivos conectados",
    logout: "Sair da sua conta"
  };
  e.forEach((n) => {
    const i = n.dataset.action;
    i && s[i] && (n.setAttribute("data-tooltip", s[i]), t.tooltips.attach(n));
  }), sl("debug", `Tooltips configurados para ${e.length} itens`);
}
function ll(t) {
  const e = t.element.querySelector(".user-menu-trigger");
  e && e.addEventListener("click", t.boundHandleTriggerClick), t.dropdown.addEventListener("click", (s) => {
    const n = s.target.closest("[data-action]");
    if (!n) return;
    s.stopPropagation();
    const i = n.dataset.action;
    t._announce(`Ação selecionada: ${n.textContent.trim()}`), el(i, {
      eventBus: t.eventBus,
      logger: t.logger,
      store: t.store,
      api: t.api,
      // @ts-expect-error TS migration - TS2349
      onLogout() {
        return t.handleLogout();
      }
    });
  }), document.addEventListener("click", t.boundHandleClickOutside), window.addEventListener("resize", t.boundUpdateDropdownPosition), window.addEventListener("scroll", t.boundUpdateDropdownPosition, !0);
}
function ul(t) {
  const e = t.element ? t.element.querySelector(".user-menu-trigger") : null;
  e && e.removeEventListener("click", t.boundHandleTriggerClick), document.removeEventListener("click", t.boundHandleClickOutside), document.removeEventListener("keydown", t.boundHandleKeydown), window.removeEventListener("resize", t.boundUpdateDropdownPosition), window.removeEventListener("scroll", t.boundUpdateDropdownPosition, !0);
}
const yi = "5.1.0-ENTERPRISE", Ci = "header/components/user-menu/state/validators";
let hl = [];
class Jr {
  static validateUser(e) {
    if (e !== null && typeof e != "object") throw new Error("Invalid user object");
    return !0;
  }
  static validateState(e) {
    if (!e || typeof e != "object") throw new Error("State must be an object");
    return !0;
  }
  static healthCheck() {
    const e = { ready: !0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 1 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 1, scoreDisplay: `${s}/1`, checks: e, version: yi, moduleId: Ci, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: yi, moduleId: Ci, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...hl];
  }
}
const Ei = "5.1.0-ENTERPRISE", vi = "header/components/user-menu/utils/formatters";
let dl = [];
class ml {
  static formatUserName(e) {
    return !e || !e.name ? "Usuário" : e.name;
  }
  static formatRole(e) {
    return { admin: "Administrador", user: "Usuário", viewer: "Visualizador", superadmin: "Super Admin" }[e] || e || "Usuário";
  }
  static formatLastLogin(e) {
    if (!e) return "Nunca";
    const s = new Date(e);
    return `${s.toLocaleDateString("pt-BR")} ${s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  static healthCheck() {
    const e = { ready: !0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 1 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 1, scoreDisplay: `${s}/1`, checks: e, version: Ei, moduleId: vi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: Ei, moduleId: vi, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...dl];
  }
}
const Ks = "header/components/user-menu";
function Xr(t) {
  return t ? {
    // @ts-expect-error TS migration - TS2339
    id: t.id,
    // @ts-expect-error TS migration - TS2339
    name: t.name || t.full_name || "Usuário",
    // @ts-expect-error TS migration - TS2339
    fullName: t.full_name || t.name,
    // @ts-expect-error TS migration - TS2339
    email: t.email,
    // @ts-expect-error TS migration - TS2339
    avatar: t.avatar_url || t.avatar,
    // @ts-expect-error TS migration - TS2339
    avatar_url: t.avatar_url || t.avatar,
    // @ts-expect-error TS migration - TS2339
    role: t.role || "user",
    // @ts-expect-error TS migration - TS2339
    roleDisplay: ml.formatRole(t.role),
    // @ts-expect-error TS migration - TS2339
    funcao: t.funcao,
    // @ts-expect-error TS migration - TS2339
    departamento: t.departamento
  } : null;
}
function Zr(t) {
  return t.isDestroyed ? Promise.resolve() : (t._metrics.fetchCount++, t.circuitBreaker.execute(() => t.api.fetchCurrentUser()).then((e) => {
    if (!t.isDestroyed)
      if (e) {
        try {
          Jr.validateUser(e);
        } catch (s) {
          t._log("warn", "User validation warning:", s.message);
        }
        t.store.setState({
          user: Xr(e),
          status: "ok"
        }), t._log("debug", "Usuário carregado:", e.name);
      } else
        t.store.setState({ user: null, status: "guest" }), t._log("debug", "Nenhum usuário autenticado");
  }).catch((e) => {
    t.isDestroyed || (t.store.setState({ user: null, status: "error" }), t._log("warn", `Erro no fetch (Circuit Breaker state: ${t.circuitBreaker.getState()}):`, e));
  }));
}
function Qr(t, e) {
  if (!t.isDestroyed)
    if (t._metrics.setUserCount++, t._metrics.lastSetUserAt = Date.now(), e) {
      try {
        Jr.validateUser(e);
      } catch (n) {
        t._log("warn", "User validation warning:", n.message);
      }
      t.store.setState({
        user: Xr(e),
        status: "ok"
      }), t._log("info", "Estado atualizado via setUser:", e.name), t._announce(`Usuário atualizado: ${e.name || "Usuário"}`);
      const s = ht("eventBus");
      s && s.emit && s.emit(o.DATA_UPDATED, {
        // @ts-expect-error TS migration - TS2339
        componentId: t.constructor._exportId || "user-menu",
        moduleId: Ks,
        data: { user: e },
        timestamp: Date.now()
      });
    } else
      t.store.setState({ user: null, status: "guest" }), t._log("info", "Estado atualizado: guest");
}
function to(t) {
  Qr(t, null);
}
function pl(t) {
  if (t.isDestroyed) return Promise.resolve();
  t._announce("Saindo da conta..."), Ns("logout", { confirmed: !0 });
  const e = ht("eventBus");
  return e && e.emit && e.emit(E.ACTION, {
    action: "logout",
    source: Ks,
    timestamp: Date.now()
  }), t.circuitBreaker.execute(() => t.api.logout()).then(() => {
    to(t), gn().redirect("/login", "logout", Ks);
  }).catch((s) => {
    t._log("error", "Erro logout:", s), t._announce("Erro ao sair. Tente novamente.");
  });
}
const eo = "17.3.0-MODULAR", fl = "user-menu", so = "header/components/user-menu";
function gl(t) {
  const e = !!(t.dropdown && t.dropdown.parentElement === document.body), s = gn(), n = {
    initialized: t._initialized,
    mounted: t._mounted,
    hasElement: !!t.element,
    hasDropdown: !!t.dropdown,
    // @ts-expect-error TS migration - TS2339
    hasUser: !!t.store.getState().user,
    hasHardNavService: !!s,
    hasLogger: !!t.logger,
    dropdownInBody: e,
    portsInitialized: Ws(),
    // @ts-expect-error TS migration - TS2339
    shortcutsEnabled: t.shortcuts && t.shortcuts.enabled,
    announcerReady: !!t.announcer,
    // @ts-expect-error TS migration - TS2339
    circuitBreakerHealthy: t.circuitBreaker && t.circuitBreaker.getState() !== "OPEN",
    tooltipsReady: !!t.tooltips
  }, i = Object.values(n).filter(Boolean).length, r = Object.keys(n).length;
  return {
    status: i >= r - 1 ? "HEALTHY" : i >= r - 3 ? "DEGRADED" : "UNHEALTHY",
    score: i,
    maxScore: r,
    scoreDisplay: `${i}/${r}`,
    checks: n,
    portsInitialized: Ws(),
    version: eo,
    moduleId: so,
    adr015Compliant: !0,
    subHealth: {
      // @ts-expect-error TS migration - TS2339
      circuitBreaker: t.circuitBreaker ? t.circuitBreaker.healthCheck() : null,
      // @ts-expect-error TS migration - TS2339
      shortcuts: t.shortcuts ? t.shortcuts.healthCheck() : null,
      // @ts-expect-error TS migration - TS2339
      tooltips: t.tooltips ? t.tooltips.healthCheck() : null
    },
    emits: [E.ACTION, E.HARD_NAV],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function _l(t) {
  return {
    id: fl,
    // @ts-expect-error TS migration - TS2339
    capabilities: t.constructor._exportCapabilities || {
      type: "menu",
      reorderable: !1,
      hideable: !1,
      critical: !0,
      rendersUI: !0,
      accessibility: !0,
      keyboardNavigation: !0,
      circuitBreaker: !0,
      tooltips: !0
    },
    label: ee.label,
    version: eo,
    moduleId: so,
    portsInitialized: Ws(),
    mounted: t._mounted,
    // @ts-expect-error TS migration - TS2339
    user: t.store.getState().user ? t.store.getState().user.name : null,
    emits: [E.ACTION, E.HARD_NAV],
    adr015Compliant: !0,
    p0Compliant: !0,
    integrations: {
      // @ts-expect-error TS migration - TS2339
      shortcuts: t.shortcuts ? t.shortcuts.info() : null,
      // @ts-expect-error TS migration - TS2339
      announcer: t.announcer ? t.announcer.info() : null,
      // @ts-expect-error TS migration - TS2339
      circuitBreaker: t.circuitBreaker ? t.circuitBreaker.info() : null,
      // @ts-expect-error TS migration - TS2339
      tooltips: t.tooltips ? t.tooltips.info() : null,
      hardNavService: { internal: !0, version: gn().VERSION || "1.0.0" }
    },
    metrics: Object.assign({}, t._metrics)
  };
}
const no = "7.7.0-ES6", js = "header.user-menu.api.fetch", Os = a({ moduleId: js });
function bl(t) {
  return Os.get(t);
}
function V(t, ...e) {
  const s = bl("logger");
  s && s[t] && s[t].apply(s, [`[${js}]`].concat(e));
}
function nt(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api", this.timeout = t.timeout || 1e4, this._csrfToken = null, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
nt.prototype.fetchCurrentUser = function() {
  const t = this;
  return t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now(), fetch("/api/auth/check.php", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }).then((e) => {
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return e.json();
  }).then((e) => {
    const s = e.data || e, n = s.session || e.session;
    if (!e.ok || !s.authenticated || !s.user)
      return V("debug", "User not authenticated"), t._metrics.errorCount++, null;
    n && n.csrf_token && (t._csrfToken = n.csrf_token, V("debug", "CSRF token stored"));
    const i = s.user;
    return t._metrics.successCount++, V("debug", "User loaded:", i.name), {
      id: i.id || i.user_id,
      name: i.name || i.full_name || "Usuário",
      fullName: i.full_name || i.name,
      email: i.email,
      avatar: i.avatar_url || i.avatar,
      avatar_url: i.avatar_url || i.avatar,
      role: i.role || i.roles && i.roles[0] || "user",
      level: i.level,
      funcao: i.funcao,
      departamento: i.departamento
    };
  }).catch((e) => (t._metrics.errorCount++, V("warn", "fetchCurrentUser error:", e.message), null));
};
nt.prototype.logout = function() {
  const t = this;
  return t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now(), (t._csrfToken ? Promise.resolve() : fetch("/api/auth/check.php", { method: "GET", credentials: "include" }).then((s) => s.ok ? s.json() : {}).then((s) => {
    s.data && s.data.session && s.data.session.csrf_token ? t._csrfToken = s.data.session.csrf_token : s.session && s.session.csrf_token && (t._csrfToken = s.session.csrf_token);
  })).then(() => {
    const s = { "Content-Type": "application/json" };
    return t._csrfToken && (s["X-CSRF-Token"] = t._csrfToken), fetch("/api/auth/logout.php", { method: "POST", credentials: "include", headers: s });
  }).then((s) => (t._metrics.successCount++, s.ok)).catch((s) => (t._metrics.errorCount++, V("warn", "Logout error:", s.message), !1));
};
nt.prototype.get = function(t) {
  const e = this;
  e._metrics.requestCount++, e._metrics.lastRequestAt = Date.now();
  const s = new AbortController(), n = setTimeout(() => {
    s.abort();
  }, e.timeout);
  return fetch(e.baseURL + t, { signal: s.signal, credentials: "include", headers: { "Content-Type": "application/json" } }).then((i) => {
    if (clearTimeout(n), !i.ok) throw new Error(`HTTP ${i.status}`);
    return e._metrics.successCount++, V("debug", "GET success:", t), i.json();
  }).catch((i) => (clearTimeout(n), e._metrics.errorCount++, V("warn", "GET failed (non-fatal)", { endpoint: t, error: i.message }), null));
};
nt.prototype.post = function(t, e) {
  const s = this;
  e || (e = {}), s._metrics.requestCount++, s._metrics.lastRequestAt = Date.now();
  const n = new AbortController(), i = setTimeout(() => {
    n.abort();
  }, s.timeout);
  return fetch(s.baseURL + t, { method: "POST", signal: n.signal, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) }).then((r) => {
    if (clearTimeout(i), !r.ok) throw new Error(`HTTP ${r.status}`);
    return s._metrics.successCount++, V("debug", "POST success:", t), r.json();
  }).catch((r) => (clearTimeout(i), s._metrics.errorCount++, V("warn", "POST failed (non-fatal)", { endpoint: t, error: r.message }), null));
};
nt.prototype.healthCheck = function() {
  const t = { hasEndpoint: !!this.baseURL, hasCsrf: !!this._csrfToken, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, portsInitialized: Os.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 4, scoreDisplay: `${e}/4`, checks: t, portsInitialized: Os.isInitialized(), version: no, moduleId: js, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
nt.prototype.info = function() {
  return { version: no, moduleId: js, baseURL: this.baseURL, hasCsrf: !!this._csrfToken, metrics: this._metrics, portsInitialized: Os.isInitialized(), healthCheck: this.healthCheck() };
};
nt.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
nt.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var yl = nt;
const Di = "5.1.0-ENTERPRISE", ki = "header/components/user-menu/core/lifecycle";
let io = !1, as = [];
function Cl(t, ...e) {
  !io && t === "debug" || (as.push({ level: t, args: e, ts: Date.now() }), as.length > 50 && as.shift());
}
let El = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, Cl("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Di, moduleId: ki, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Di, moduleId: ki, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    io = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...as];
  }
};
const Ii = "5.1.0-ENTERPRISE", Si = "header/components/user-menu/state/store";
let ro = !1, cs = [];
function vl(t, ...e) {
  !ro && t === "debug" || (cs.push({ level: t, args: e, ts: Date.now() }), cs.length > 50 && cs.shift());
}
let Dl = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        vl("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ii, moduleId: Si, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ii, moduleId: Si, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, ro = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...cs];
  }
};
const oo = "header.user-menu.telemetry.logger", kl = "8.4.0-ES6", ls = a({ moduleId: oo });
function $e(t) {
  return ls.get(t);
}
let Oe = { logs: 0, warns: 0, errors: 0 };
function Wt(t) {
  t || (t = {}), this.prefix = t.prefix || "[user-menu]", this.debug = t.debug || !1;
}
Wt.prototype.info = function() {
  if (!this.debug) return;
  Oe.logs++;
  const t = $e("logger");
  t && t.info ? t.info.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments))) : t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Wt.prototype.warn = function() {
  Oe.warns++;
  const t = $e("logger");
  t && t.warn && t.warn.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Wt.prototype.error = function() {
  Oe.errors++;
  const t = $e("logger");
  t && t.error && t.error.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Wt.prototype.debug = function() {
  if (!this.debug) return;
  Oe.logs++;
  const t = $e("logger");
  t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Wt.prototype.getMetrics = () => Object.assign({}, Oe);
Wt.prototype.healthCheck = function() {
  return { status: ls.isInitialized() ? "HEALTHY" : "DEGRADED", version: kl, moduleId: oo, checks: { loggerReady: !!$e("logger"), portsInitialized: ls.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ls.isInitialized() };
};
const wi = "5.1.0-ENTERPRISE", Ai = "header/components/user-menu/telemetry/tracker";
let Il = [], Sl = class {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: wi, moduleId: Ai, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: wi, moduleId: Ai, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Il];
  }
};
const Et = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
}, $i = ["#4F6D7A", "#5D6B7A", "#6B5D7A", "#5D7A6B", "#7A6B5D", "#5D6A7A", "#6A5D6B", "#5D7A7A"];
function wl(t) {
  return $i[Number(t || 0) % $i.length];
}
function Al(t) {
  if (!t) return "?";
  const e = t.trim().split(" ").filter(Boolean);
  return e.length >= 2 ? (e[0][0] + e[e.length - 1][0]).toUpperCase() : t.substring(0, 2).toUpperCase();
}
function $l() {
  return `<button class="user-menu-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Menu do usuário" data-uarps-trigger="trigger:header:user-menu"><div class="user-avatar"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><span class="user-name">...</span><span class="user-chevron">${Et.chevron}</span></button>`;
}
function Ol() {
  return `<div class="dropdown-header"><div class="user-avatar-large"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><div class="user-info"><span class="user-name-full">Carregando...</span><span class="user-role">---</span></div></div><div class="dropdown-divider"></div><button class="dropdown-item" role="menuitem" data-action="profile" data-uarps-trigger="trigger:header:profile"><span class="item-icon">${Et.user}</span>Meu Perfil</button><button class="dropdown-item" role="menuitem" data-action="preferences" data-uarps-trigger="trigger:header:preferences"><span class="item-icon">${Et.settings}</span>Minhas Preferências</button><button class="dropdown-item" role="menuitem" data-action="security" data-uarps-trigger="trigger:header:security"><span class="item-icon">${Et.shield}</span>Segurança da Conta</button><button class="dropdown-item" role="menuitem" data-action="notifications" data-uarps-trigger="trigger:header:notifications"><span class="item-icon">${Et.bell}</span>Notificações</button><button class="dropdown-item" role="menuitem" data-action="sessions" data-uarps-trigger="trigger:header:sessions"><span class="item-icon">${Et.monitor}</span>Sessões Ativas</button><div class="dropdown-divider"></div><button class="dropdown-item logout" role="menuitem" data-action="logout" data-uarps-trigger="trigger:header:logout"><span class="item-icon">${Et.logout}</span>Sair</button>`;
}
function ao(t, e) {
  if (!t || !e) return;
  const s = t.querySelector(".user-menu-trigger");
  if (!s) return;
  const n = s.getBoundingClientRect();
  e.style.position = "fixed", e.style.top = `${n.bottom + 8}px`, e.style.left = "8px", e.style.right = "auto";
}
function Ml(t, e, s) {
  if (!t || !e) return;
  const n = t.querySelector(".user-avatar"), i = t.querySelector(".avatar-img"), r = t.querySelector(".avatar-initials"), u = e.querySelector(".user-avatar-large"), at = e.querySelector(".avatar-img"), Ct = e.querySelector(".avatar-initials"), ct = t.querySelector(".user-name"), lt = e.querySelector(".user-name-full"), ua = e.querySelector(".user-role"), ha = t.querySelector(".user-menu-trigger");
  if (s.user) {
    const Zt = Al(s.user.name || s.user.fullName), me = s.user.avatar_url || s.user.avatar, Un = me && me.length > 0 && !me.includes("default"), xn = wl(s.user.id);
    Un ? (i.src = me, i.style.display = "block", r.style.display = "none") : (i.style.display = "none", r.style.display = "flex", r.textContent = Zt, n.style.background = xn), Un ? (at.src = me, at.style.display = "block", Ct.style.display = "none") : (at.style.display = "none", Ct.style.display = "flex", Ct.textContent = Zt, u.style.background = xn);
    const Hn = s.user.name || s.user.fullName || "Usuário";
    ct.textContent = Hn, lt.textContent = s.user.fullName || Hn, ua.textContent = s.user.funcao || s.user.role || "user", t.dataset.status = "ok", t.dataset.role = s.user.role || "user";
  } else
    i.style.display = "none", r.style.display = "flex", r.textContent = "?", at.style.display = "none", Ct.style.display = "flex", Ct.textContent = "?", ct.textContent = "Visitante", lt.textContent = "Visitante", t.dataset.status = "guest";
  if (s.isOpen)
    ao(t, e), e.setAttribute("aria-hidden", "false"), e.classList.add("is-open");
  else {
    const Zt = document.activeElement;
    Zt && e.contains(Zt) && Zt.blur(), e.classList.remove("is-open"), e.setAttribute("aria-hidden", "true");
  }
  ha.setAttribute("aria-expanded", String(s.isOpen)), t.classList.toggle("is-open", s.isOpen);
}
const Oi = "5.1.0-ENTERPRISE", Mi = "header/components/user-menu/accessibility/shortcuts";
let Tl = [];
class Pl {
  constructor() {
    this.shortcuts = /* @__PURE__ */ new Map(), this.enabled = !0, this._debug = !1, this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null };
  }
  register(e, s) {
    this.shortcuts.set(e, s), this._metrics.registerCount++;
  }
  unregister(e) {
    this.shortcuts.delete(e);
  }
  trigger(e, s) {
    if (!this.enabled) return;
    const n = this.shortcuts.get(e);
    n && (n(s), this._metrics.triggerCount++, this._metrics.lastTriggerAt = Date.now());
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { hasShortcuts: this.shortcuts.size >= 0, enabled: this.enabled }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Oi, moduleId: Mi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Oi, moduleId: Mi, shortcutCount: this.shortcuts.size, enabled: this.enabled, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Tl];
  }
}
const co = "5.2.0-ES6", bn = "header/components/user-menu/accessibility/announce", Rl = [];
function H() {
  this.announcer = null, this._metrics = { announceCount: 0, lastAnnounceAt: null };
}
H.prototype.init = function() {
  this.announcer || (this.announcer = document.createElement("div"), this.announcer.setAttribute("aria-live", "polite"), this.announcer.setAttribute("data-announcer", bn), this.announcer.className = "sr-only", this.announcer.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;", ma().appendChild(this.announcer));
};
H.prototype.announce = function(t) {
  const e = this;
  e.init(), e.announcer.textContent = "", setTimeout(() => {
    e.announcer.textContent = t;
  }, 100), e._metrics.announceCount++, e._metrics.lastAnnounceAt = Date.now();
};
H.prototype.destroy = function() {
  this.announcer && (this.announcer.remove(), this.announcer = null);
};
H.prototype.healthCheck = () => {
  const t = { ready: !0, noBodyAppend: !0 };
  let e = 0;
  for (const s in t) t[s] && e++;
  return { status: e === 2 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 2, scoreDisplay: `${e}/2`, checks: t, version: co, moduleId: bn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
H.prototype.info = function() {
  return { version: co, moduleId: bn, initialized: !!this.announcer, metrics: this._metrics, healthCheck: this.healthCheck() };
};
H.prototype.setDebug = (t) => {
};
H.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
H.prototype.resetMetrics = function() {
  this._metrics = { announceCount: 0, lastAnnounceAt: null };
};
H.getLogs = () => Rl.slice();
const Ti = "5.1.0-ENTERPRISE", Pi = "header/components/user-menu/core/circuit-breaker";
let Ll = [];
class Ul {
  constructor(e = {}) {
    this.failureThreshold = e.failureThreshold || 5, this.timeout = e.timeout || 6e4, this.resetTimeout = e.resetTimeout || 3e4, this.state = "CLOSED", this.failures = 0, this.nextAttempt = Date.now(), this._metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, lastCallAt: null };
  }
  // @ts-expect-error TS migration - TS2349
  async execute(e, s) {
    if (this._metrics.totalCalls++, this._metrics.lastCallAt = Date.now(), this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        if (this._metrics.rejectedCalls++, s) return s();
        throw new Error("Circuit breaker is OPEN");
      }
      this.state = "HALF_OPEN";
    }
    try {
      const n = await this._executeWithTimeout(e);
      return this._onSuccess(), n;
    } catch (n) {
      if (this._onFailure(), s) return s();
      throw n;
    }
  }
  async _executeWithTimeout(e) {
    return new Promise((s, n) => {
      const i = setTimeout(() => n(new Error("Operation timeout")), this.timeout);
      Promise.resolve(e()).then((r) => {
        clearTimeout(i), s(r);
      }).catch((r) => {
        clearTimeout(i), n(r);
      });
    });
  }
  _onSuccess() {
    this.failures = 0, this._metrics.successfulCalls++, this.state === "HALF_OPEN" && (this.state = "CLOSED");
  }
  _onFailure() {
    this.failures++, this._metrics.failedCalls++, this.failures >= this.failureThreshold && (this.state = "OPEN", this.nextAttempt = Date.now() + this.resetTimeout);
  }
  reset() {
    this.state = "CLOSED", this.failures = 0, this.nextAttempt = Date.now();
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { isClosed: this.state === "CLOSED", belowThreshold: this.failures < this.failureThreshold }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ti, moduleId: Pi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ti, moduleId: Pi, state: this.state, failures: this.failures, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, lastCallAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ll];
  }
  destroy() {
    this.reset();
  }
}
const lo = "5.2.0-ES6", uo = "header/components/user-menu/ui/tooltips", xl = [];
function N(t) {
  t = t || {}, this.delay = t.delay || 300, this.activeTooltip = null, this.timeoutId = null, this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
}
N.prototype.attach = function(t) {
  const e = this;
  if (!t) return;
  const s = t.getAttribute("data-tooltip");
  s && (t.addEventListener("mouseenter", () => {
    e._show(t, s);
  }), t.addEventListener("mouseleave", () => {
    e._hide();
  }));
};
N.prototype._show = function(t, e) {
  const s = this;
  this._hide(), this.timeoutId = setTimeout(() => {
    const n = document.createElement("div");
    n.className = "user-menu-tooltip", n.textContent = e, n.style.position = "fixed", n.style.pointerEvents = "none", pa().appendChild(n);
    const i = t.getBoundingClientRect();
    n.style.left = `${i.left + i.width / 2}px`, n.style.top = `${i.top - 30}px`, n.style.transform = "translateX(-50%)", s.activeTooltip = n, s._metrics.showCount++, s._metrics.lastShowAt = Date.now();
  }, this.delay);
};
N.prototype._hide = function() {
  this.timeoutId && clearTimeout(this.timeoutId), this.activeTooltip && (this.activeTooltip.remove(), this.activeTooltip = null, this._metrics.hideCount++);
};
N.prototype.healthCheck = () => {
  const t = { ready: !0, noBodyAppend: !0 }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 2 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 2, scoreDisplay: `${e}/2`, checks: t, version: lo, moduleId: uo, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
N.prototype.info = function() {
  return { version: lo, moduleId: uo, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, healthCheck: this.healthCheck() };
};
N.prototype.setDebug = (t) => {
};
N.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
N.prototype.resetMetrics = function() {
  this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
};
N.getLogs = () => xl.slice();
const Js = "17.3.0-MODULAR", Bs = "user-menu", yn = {
  type: "menu",
  reorderable: !1,
  hideable: !1,
  critical: !0,
  rendersUI: !0,
  accessibility: !0,
  keyboardNavigation: !0,
  circuitBreaker: !0,
  tooltips: !0
}, zs = "header/components/user-menu";
Jc();
function c(t) {
  t = t || {}, this.container = t.container, this.store = new Dl({ user: null, isOpen: !1, status: "loading" }), this.eventBus = null, this.lifecycle = new El(this), this.logger = null, this.telemetry = new Sl(), this.api = new yl(), this.element = null, this.dropdown = null, this.dropdownRoot = null, this._mounted = !1, this._initialized = !1, this.isDestroyed = !1, this.unsubscribe = null, this.shortcuts = new Pl(), this.announcer = new H(), this.circuitBreaker = new Ul({ failureThreshold: 3, timeout: 1e4, resetTimeout: 3e4 }), this.tooltips = new N({ delay: 400 }), this.boundHandleClickOutside = (e) => il(this, e), this.boundHandleTriggerClick = (e) => nl(this, e), this.boundUpdateDropdownPosition = () => this._updatePosition(), this.boundHandleKeydown = (e) => ol(this, e), this._metrics = {
    mountCount: 0,
    setUserCount: 0,
    fetchCount: 0,
    toggleCount: 0,
    keyboardNavigationCount: 0,
    announcementCount: 0,
    lastMountAt: null,
    lastSetUserAt: null
  };
}
c._exportId = Bs;
c._exportCapabilities = yn;
c.prototype.init = function(t) {
  return t = t || {}, this._initialized ? this : (this._ctx = t, this._initialized = !0, this);
};
c.prototype.mount = function(t) {
  const e = this;
  if (this.isDestroyed || this._mounted) return Promise.resolve(this);
  this._initialized || this.init({}), this.container = t || this.container, Yc(), this.eventBus = ht("eventBus");
  const s = ht("config");
  return this.logger = new Wt({ prefix: "[UserMenu]", debug: s && s.app && s.app.debug }), this.lifecycle.mount().then(() => {
    e.render(), ll(e), al(e), cl(e), e._mounted = !0, e._metrics.mountCount++, e._metrics.lastMountAt = Date.now();
    const n = ht("eventBus");
    return n && n.emit && n.emit(o.MOUNTED, {
      componentId: Bs,
      moduleId: zs,
      version: Js,
      capabilities: yn,
      timestamp: Date.now()
    }), Zr(e);
  }).then(() => (e._log("info", `Mounted v${Js} com integração completa`), e._announce("Menu do usuário carregado"), e));
};
c.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "user-menu-component", this.element.dataset.status = "loading", this.element.setAttribute("data-component-id", ee.id), this.element.innerHTML = $l(), this.dropdown = document.createElement("div"), this.dropdown.className = "user-menu-dropdown-portal", this.dropdown.setAttribute("role", "menu"), this.dropdown.setAttribute("aria-hidden", "true"), this.dropdown.setAttribute("data-dropdown", zs), this.dropdown.innerHTML = Ol(), this.container && this.container.appendChild(this.element), document.body.appendChild(this.dropdown), this._log("debug", "Dropdown montado no body"), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || Ml(t.element, t.dropdown, e);
  });
};
c.prototype._updatePosition = function() {
  ao(this.element, this.dropdown);
};
c.prototype._log = function(t, e, s) {
  this.logger && typeof this.logger[t] == "function" && this.logger[t](e, s);
};
c.prototype._announce = function(t) {
  this.announcer && t && (this.announcer.announce(t), this._metrics.announcementCount++);
};
c.prototype.setUser = function(t) {
  Qr(this, t);
};
c.prototype.clearUser = function() {
  to(this);
};
c.prototype.toggleMenu = function() {
  if (this.isDestroyed) return;
  this._metrics.toggleCount++;
  const e = !this.store.getState().isOpen;
  if (Ns(e ? "open" : "close", { toggleCount: this._metrics.toggleCount }), this.store.setState({ isOpen: e }), e) {
    this._announce("Menu do usuário aberto. Use as setas para navegar.");
    const s = this.dropdown.querySelector(".dropdown-item");
    s && setTimeout(() => {
      s.focus();
    }, 100);
  } else
    this._announce("Menu do usuário fechado");
  this._log("debug", "Toggle menu:", e ? "open" : "close");
};
c.prototype.handleLogout = function() {
  return pl(this);
};
c.prototype.fetchUser = function() {
  return this._log("warn", "fetchUser() é legado - use setUser() para P0 compliance"), Zr(this);
};
c.prototype.unmount = function() {
  const t = this;
  return this._mounted ? (this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    ul(t), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.announcer && t.announcer.destroy(), t.shortcuts && t.shortcuts.disable(), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null), t.dropdown && (t.dropdown.remove(), t.dropdown = null), t._mounted = !1;
    const e = ht("eventBus");
    return e && e.emit && e.emit(o.UNMOUNTED, {
      componentId: Bs,
      moduleId: zs,
      timestamp: Date.now()
    }), t;
  })) : Promise.resolve(this);
};
c.prototype.healthCheck = function() {
  return gl(this);
};
c.prototype.info = function() {
  return _l(this);
};
c.prototype.isMounted = function() {
  return this._mounted;
};
c.prototype.getElement = function() {
  return this.element;
};
c.prototype.getCircuitBreakerState = function() {
  return this.circuitBreaker ? this.circuitBreaker.getState() : null;
};
c.prototype.resetCircuitBreaker = function() {
  this.circuitBreaker && this.circuitBreaker.reset();
};
function Hl(t) {
  return new c(t);
}
var Nl = c;
const jl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: zs,
  UserMenuComponent: c,
  VERSION: Js,
  capabilities: yn,
  createUserMenu: Hl,
  default: Nl,
  getPorts: Wc,
  id: Bs,
  injectPorts: Fc
}, Symbol.toStringTag, { value: "Module" })), Ri = "1.0.0-ENTERPRISE", Li = "header/components/logo/core/lifecycle";
let ho = !1, us = [];
function Bl(t, ...e) {
  !ho && t === "debug" || (us.push({ level: t, args: e, ts: Date.now() }), us.length > 50 && us.shift());
}
let zl = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async unmount() {
    this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(e) {
    for (const s of this.hooks[e] || [])
      try {
        await s(this.component);
      } catch (n) {
        this._metrics.errorCount++, Bl("error", `Hook ${e} error:`, n);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ri, moduleId: Li, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ri, moduleId: Li, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    ho = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...us];
  }
};
const Ui = "1.0.0-ENTERPRISE", xi = "header/components/logo/state/store";
let mo = !1, hs = [];
function ql(t, ...e) {
  !mo && t === "debug" || (hs.push({ level: t, args: e, ts: Date.now() }), hs.length > 50 && hs.shift());
}
let Vl = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  // @ts-expect-error TS migration - TS2349
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        ql("error", "Subscriber error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ui, moduleId: xi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ui, moduleId: xi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, mo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...hs];
  }
};
const po = "header.logo.telemetry.logger", Gl = "1.1.0-ES6", ds = a({ moduleId: po });
function Me(t) {
  return ds.get(t);
}
let Te = { logs: 0, warns: 0, errors: 0 };
function Kt(t) {
  t || (t = {}), this.prefix = t.prefix || "[logo]", this.debug = t.debug || !1;
}
Kt.prototype.info = function(...t) {
  if (!this.debug) return;
  Te.logs++;
  const e = Me("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Kt.prototype.warn = function(...t) {
  Te.warns++;
  const e = Me("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Kt.prototype.error = function(...t) {
  Te.errors++;
  const e = Me("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Kt.prototype.debug = function(...t) {
  if (!this.debug) return;
  Te.logs++;
  const e = Me("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Kt.prototype.getMetrics = () => Object.assign({}, Te);
Kt.prototype.healthCheck = function() {
  return { status: ds.isInitialized() ? "HEALTHY" : "DEGRADED", version: Gl, moduleId: po, checks: { loggerReady: !!Me("logger"), portsInitialized: ds.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ds.isInitialized() };
};
const Hi = "1.0.0-ENTERPRISE", Ni = "header/components/logo/telemetry/tracker";
let Yl = [], Fl = class {
  constructor(e = {}) {
    this.events = [], this.maxEvents = e.maxEvents || 100, this.enabled = e.enabled !== !1, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  getEvents() {
    return [...this.events];
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Hi, moduleId: Ni, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Hi, moduleId: Ni, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Yl];
  }
};
const Cn = "1.1.0-ES6", qs = "logo", fo = { type: "brand", reorderable: !1, hideable: !1, critical: !0, rendersUI: !0 }, ce = "header/components/logo", At = a({ moduleId: ce });
function Wl() {
  At.init();
}
function $t(t) {
  return At.get(t);
}
function Kl(t) {
  return At.inject(t);
}
function Jl() {
  return At.snapshot();
}
(function() {
  const e = "/components/header/components/logo/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function it(t) {
  t = t || {}, this.container = t.container, this.config = t.config || {}, this.store = new Vl({ theme: "light", visible: !0 }), this.eventBus = $t("eventBus"), this.lifecycle = new zl(this);
  const e = $t("config");
  this.logger = new Kt({ prefix: "[Logo]", debug: e && e.app && e.app.debug }), this.telemetry = new Fl(), this.element = null, this.isDestroyed = !1, this.unsubscribe = null, this._metrics = { mountCount: 0, clickCount: 0, lastMountAt: null };
}
it.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Wl(), this.lifecycle.mount().then(() => {
    t.render(), t.bindEvents(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = $t("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: qs, moduleId: ce, timestamp: Date.now() });
  }));
};
it.prototype.render = function() {
  const t = this;
  this.element = document.createElement("a"), this.element.className = "logo-component", this.element.href = "/", this.element.title = "DShow Dashboard - Ir para início", this.element.dataset.status = "ok", this.element.setAttribute("aria-label", "Logo DShow Dashboard - Ir para página inicial"), this.element.innerHTML = '<img src="/assets/images/logo.png" alt="DShow Dashboard" class="logo-image" />', this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
it.prototype.updateUI = function(t) {
  this.element && (this.element.dataset.theme = t.theme, this.element.style.display = t.visible ? "flex" : "none");
};
it.prototype.bindEvents = function() {
  const t = this;
  if (!this.element) return;
  this.element.addEventListener("click", (s) => {
    t._metrics.clickCount++, t.telemetry.track("logo:click", { timestamp: Date.now() });
    const n = $t("eventBus");
    n && n.emit && n.emit("logo:click", { timestamp: Date.now() });
  });
  const e = $t("eventBus");
  e && e.on && e.on("theme:changed", (s) => {
    t.store.setState({ theme: s.theme || "light" });
  });
};
it.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = $t("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: qs, moduleId: ce, timestamp: Date.now() });
  });
};
it.prototype.healthCheck = function() {
  const t = $t("eventBus"), e = {
    isMounted: !!this.element,
    hasStore: !!this.store,
    hasGlobalEventBus: !!t,
    imageLoaded: this.element ? !!this.element.querySelector("img") : !1,
    portsInitialized: At.isInitialized()
  }, s = Object.values(e).filter(Boolean).length;
  return {
    status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: s,
    maxScore: 5,
    checks: e,
    portsInitialized: At.isInitialized(),
    version: Cn,
    moduleId: ce
  };
};
it.prototype.info = function() {
  return {
    version: Cn,
    moduleId: ce,
    id: qs,
    capabilities: fo,
    portsInitialized: At.isInitialized(),
    mounted: !!this.element,
    theme: this.store.getState().theme,
    metrics: this._metrics
  };
};
var Xl = it;
const Zl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LogoComponent: it,
  MODULE_ID: ce,
  VERSION: Cn,
  capabilities: fo,
  default: Xl,
  getPorts: Jl,
  id: qs,
  injectPorts: Kl
}, Symbol.toStringTag, { value: "Module" })), go = "6.1.0-ES6", Pe = "header.email-integration.api.fetch", En = a({ moduleId: Pe });
function _o(t) {
  return En.get(t);
}
const se = function(t, ...e) {
  const s = _o("logger");
  s && s[t] && s[t](...[`[${Pe}]`].concat(e));
};
function bo(t, e) {
  try {
    const s = _o("telemetry");
    s && s.track && s.track(`${Pe}:${t}`, e || {});
  } catch {
  }
}
function yo(t) {
  const e = t.headers.get("content-type") || "", s = e.indexOf("application/json") !== -1, n = e.indexOf("text/html") !== -1;
  return {
    ok: t.ok,
    status: t.status,
    isJson: s,
    isHtml: n,
    contentType: e,
    isContractViolation: !s && t.ok,
    isAuthError: t.status === 401 || t.status === 403
  };
}
function ut(t) {
  return { unread_count: 0, status: "unavailable", _fallback: !0, _reason: t };
}
function rt(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api/email", this.timeout = t.timeout || 1e4, this.headers = t.headers || {}, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}
rt.prototype.get = function(t, e) {
  return this._request("GET", t, null, e || {});
};
rt.prototype.post = function(t, e, s) {
  return this._request("POST", t, e, s || {});
};
rt.prototype._request = function(t, e, s, n) {
  const i = this;
  i._metrics.requestCount++, i._metrics.lastRequestAt = Date.now();
  const r = new AbortController(), u = setTimeout(() => {
    r.abort();
  }, i.timeout), at = {
    method: t,
    headers: Object.assign({ Accept: "application/json" }, i.headers, n.headers || {}),
    signal: r.signal,
    credentials: "include"
  };
  s && (at.body = JSON.stringify(s), at.headers["Content-Type"] = "application/json");
  const Ct = i.baseURL + e;
  return fetch(Ct, at).then((ct) => {
    clearTimeout(u);
    const lt = yo(ct);
    return lt.isAuthError ? (i._metrics.authErrors++, se("info", "Auth required", { status: lt.status }), ut("auth-required")) : lt.isContractViolation ? (i._metrics.contractViolations++, se("error", "API_CONTRACT_VIOLATION", { contentType: lt.contentType }), bo("contract-violation", { contentType: lt.contentType }), ut("contract-violation")) : ct.ok ? (i._metrics.successCount++, ct.json()) : (i._metrics.errorCount++, ut("http-error"));
  }).catch((ct) => (clearTimeout(u), i._metrics.errorCount++, se("error", "Request failed", { method: t, endpoint: e, error: ct.message }), ut("network-error")));
};
rt.prototype.fetchStatus = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout), n = `${t.baseURL}.php?action=status`;
  return fetch(n, {
    signal: e.signal,
    credentials: "include",
    headers: { Accept: "application/json" }
  }).then((i) => {
    clearTimeout(s);
    const r = yo(i);
    return r.isAuthError ? (t._metrics.authErrors++, se("info", "Auth required for email status", { status: r.status }), ut("auth-required")) : r.isContractViolation ? (t._metrics.contractViolations++, se("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${r.contentType}`, { url: n }), bo("contract-violation", { contentType: r.contentType, url: n }), ut("contract-violation")) : i.ok ? (t._metrics.successCount++, i.json()) : (t._metrics.errorCount++, ut("http-error"));
  }).then((i) => i && i._fallback ? i : { unread_count: i.unread_count || i.count || 0, status: "ok" }).catch((i) => {
    clearTimeout(s), t._metrics.errorCount++;
    const r = i.name === "AbortError" ? "timeout" : "network-error";
    return se("warn", "Fetch failed, using fallback", { error: i.message, reason: r }), ut(r);
  });
};
rt.prototype.healthCheck = function() {
  const t = En.snapshot(), e = {
    hasBaseURL: this.baseURL !== void 0,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    lowContractViolations: this._metrics.requestCount === 0 || this._metrics.contractViolations / this._metrics.requestCount < 0.1,
    portsInitialized: t._initialized
  }, s = Object.values(e).filter(Boolean).length;
  return {
    status: s === 4 ? "HEALTHY" : "DEGRADED",
    score: s,
    maxScore: 4,
    scoreDisplay: `${s}/4`,
    checks: e,
    version: go,
    moduleId: Pe,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
rt.prototype.info = function() {
  const t = En.snapshot();
  return {
    version: go,
    moduleId: Pe,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: t._initialized,
    healthCheck: this.healthCheck()
  };
};
rt.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
rt.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
};
var Ql = rt;
const ji = "5.1.0-ENTERPRISE", Bi = "header/components/email-integration/core/lifecycle";
let Co = !1, ms = [];
function tu(t, ...e) {
  !Co && t === "debug" || (ms.push({ level: t, args: e, ts: Date.now() }), ms.length > 50 && ms.shift());
}
let eu = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, tu("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ji, moduleId: Bi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ji, moduleId: Bi, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Co = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ms];
  }
};
const zi = "5.1.0-ENTERPRISE", qi = "header/components/email-integration/state/store";
let Eo = !1, ps = [];
function su(t, ...e) {
  !Eo && t === "debug" || (ps.push({ level: t, args: e, ts: Date.now() }), ps.length > 50 && ps.shift());
}
let nu = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        su("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: zi, moduleId: qi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: zi, moduleId: qi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Eo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ps];
  }
};
const vo = "header.email-integration.telemetry.logger", iu = "2.2.0-P17WI", Do = a({ moduleId: vo });
function pe(t) {
  return Do.get(t);
}
let fe = { logs: 0, warns: 0, errors: 0 }, ru = class {
  // @ts-expect-error TS2322: debug boolean conflicts with index signature method type
  constructor(e = {}) {
    this.prefix = e.prefix || "[email-integration]", this.debug = e.debug || !1;
  }
  info(...e) {
    if (!this.debug) return;
    fe.logs++;
    const s = pe("logger");
    s != null && s.info ? s.info(this.prefix, ...e) : s != null && s.debug && s.debug(this.prefix, ...e);
  }
  warn(...e) {
    fe.warns++;
    const s = pe("logger");
    s != null && s.warn && s.warn(this.prefix, ...e);
  }
  error(...e) {
    fe.errors++;
    const s = pe("logger");
    s != null && s.error && s.error(this.prefix, ...e);
  }
  debug(...e) {
    if (!this.debug) return;
    fe.logs++;
    const s = pe("logger");
    s != null && s.debug && s.debug(this.prefix, ...e);
  }
  getMetrics() {
    return { ...fe };
  }
  healthCheck() {
    const e = Do.snapshot();
    return { status: e._initialized ? "HEALTHY" : "DEGRADED", version: iu, moduleId: vo, checks: { loggerReady: !!pe("logger"), portsInitialized: e._initialized }, metrics: this.getMetrics(), portsInitialized: e._initialized, timestamp: Date.now() };
  }
};
const Vi = "5.1.0-ENTERPRISE", Gi = "header/components/email-integration/telemetry/tracker";
let ou = [], au = class {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Vi, moduleId: Gi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Vi, moduleId: Gi, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ou];
  }
};
const Yi = "5.1.0-ENTERPRISE", Fi = "header/components/email-integration/core/polling";
let ko = !1, fs = [];
function cu(t, ...e) {
  !ko && t === "debug" || (fs.push({ level: t, args: e, ts: Date.now() }), fs.length > 50 && fs.shift());
}
let lu = class {
  constructor(e = {}) {
    this.interval = e.interval || 6e4, this.immediate = e.immediate !== !1, this.timerId = null, this.isRunning = !1, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this.immediate && this._execute(), this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.isRunning && (this.isRunning = !1, this.timerId && (clearInterval(this.timerId), this.timerId = null));
  }
  async _execute() {
    if (!document.hidden && this.callbacks.length !== 0) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      try {
        for (const e of this.callbacks)
          await e();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++, cu("error", "Execution error:", e);
      }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Yi, moduleId: Fi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Yi, moduleId: Fi, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    ko = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...fs];
  }
};
const vn = "10.1.0-ES6", Re = "email-integration", Io = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, ot = "header/components/email-integration", uu = "#/status-mail", Ot = a({ moduleId: ot });
function hu() {
  Ot.init();
}
function Mt(t) {
  return Ot.get(t);
}
function du(t) {
  return Ot.inject(t);
}
function mu() {
  return Ot.snapshot();
}
function pu(t) {
  t = t || {};
  const e = Mt("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:email-integration", source: ot, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
}
(function() {
  const e = "/components/header/components/email-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const fu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
function j(t) {
  t = t || {}, this.container = t.container, this.store = new nu({ unreadCount: 0, status: "loading" }), this.eventBus = Mt("eventBus"), this.lifecycle = new eu(this);
  const e = Mt("config");
  this.logger = new ru({ prefix: "[Email]", debug: e && e.app && e.app.debug }), this.telemetry = new au(), this.api = new Ql(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
j.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (hu(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Mt("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Re, moduleId: ot, timestamp: Date.now() });
  }));
};
j.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "email-integration-component", this.element.title = "E-mail", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-email-integration"), this.element.innerHTML = `<div class="integration-icon">${fu}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), pu({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 }), v(uu, ot);
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
j.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
j.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Mt("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Re, moduleId: ot, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch((e) => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
j.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new lu({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
j.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Mt("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Re, moduleId: ot, timestamp: Date.now() });
  });
};
j.prototype.healthCheck = function() {
  const t = Mt("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Ot.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Ot.isInitialized(), version: vn, moduleId: ot };
};
j.prototype.info = function() {
  return { version: vn, moduleId: ot, id: Re, capabilities: Io, portsInitialized: Ot.isInitialized(), mounted: !!this.element, unreadCount: this.store.getState().unreadCount, metrics: this._metrics };
};
var gu = j;
const _u = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EmailIntegrationComponent: j,
  MODULE_ID: ot,
  VERSION: vn,
  capabilities: Io,
  default: gu,
  getPorts: mu,
  id: Re,
  injectPorts: du
}, Symbol.toStringTag, { value: "Module" })), So = "6.1.0-ES6", Vs = "header.whatsapp-integration.api.fetch", Ms = a({ moduleId: Vs });
function bu(t) {
  return Ms.get(t);
}
function Wi(t, ...e) {
  const s = bu("logger");
  s && s[t] && s[t].apply(s, [`[${Vs}]`].concat(e));
}
function Ki(t) {
  return {
    status: "unavailable",
    configured: !1,
    unread_count: 0,
    message: "Indisponível no momento",
    integration: "whatsapp",
    _fallback: !0,
    _fallback_reason: t
  };
}
function yu(t) {
  if (!t) return !1;
  if (t.name === "AbortError") return !0;
  const e = String(t.message || "").toLowerCase();
  return e.indexOf("aborted") !== -1 || e.indexOf("abort") !== -1;
}
function le(t) {
  this.endpoint = t || "/api/integrations/whatsapp/status.php", this.timeout = 12e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
le.prototype.fetchStatus = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout);
  return fetch(t.endpoint, {
    signal: e.signal,
    headers: { "Content-Type": "application/json" }
  }).then((n) => {
    if (clearTimeout(s), !n.ok) throw new Error(`HTTP ${n.status}`);
    return n.json();
  }).then((n) => {
    if (!n.ok) throw new Error(n.error || "API_ERROR");
    return t._metrics.successCount++, n.data;
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, yu(n) ? (Wi("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), Ki("timeout")) : (Wi("warn", "Fetch failed (non-fatal)", { error: n.message }), Ki("error"))));
};
le.prototype.healthCheck = function() {
  const t = {
    hasEndpoint: !!this.endpoint,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    portsInitialized: Ms.isInitialized()
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e === 3 ? "HEALTHY" : "DEGRADED",
    score: e,
    maxScore: 3,
    scoreDisplay: `${e}/3`,
    checks: t,
    portsInitialized: Ms.isInitialized(),
    version: So,
    moduleId: Vs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
le.prototype.info = function() {
  return {
    version: So,
    moduleId: Vs,
    endpoint: this.endpoint,
    metrics: this._metrics,
    portsInitialized: Ms.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
le.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
le.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Cu = le;
const Ji = "5.1.0-ENTERPRISE", Xi = "header/components/whatsapp-integration/core/lifecycle";
let wo = !1, gs = [];
function Eu(t, ...e) {
  !wo && t === "debug" || (gs.push({ level: t, args: e, ts: Date.now() }), gs.length > 50 && gs.shift());
}
let vu = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, Eu("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ji, moduleId: Xi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ji, moduleId: Xi, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    wo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...gs];
  }
};
const Zi = "5.1.0-ENTERPRISE", Qi = "header/components/whatsapp-integration/state/store";
let Ao = !1, _s = [];
function Du(t, ...e) {
  !Ao && t === "debug" || (_s.push({ level: t, args: e, ts: Date.now() }), _s.length > 50 && _s.shift());
}
let ku = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  // @ts-expect-error TS migration - TS2349
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        Du("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Zi, moduleId: Qi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Zi, moduleId: Qi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Ao = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._s];
  }
};
const $o = "header.whatsapp-integration.telemetry.logger", Iu = "2.3.0-ES6", bs = a({ moduleId: $o });
function Le(t) {
  return bs.get(t);
}
let Ue = { logs: 0, warns: 0, errors: 0 };
function Jt(t) {
  t || (t = {}), this.prefix = t.prefix || "[whatsapp-integration]", this.debug = t.debug || !1;
}
Jt.prototype.info = function() {
  if (!this.debug) return;
  Ue.logs++;
  const t = Le("logger");
  t && t.info ? t.info.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments))) : t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Jt.prototype.warn = function() {
  Ue.warns++;
  const t = Le("logger");
  t && t.warn && t.warn.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Jt.prototype.error = function() {
  Ue.errors++;
  const t = Le("logger");
  t && t.error && t.error.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Jt.prototype.debug = function() {
  if (!this.debug) return;
  Ue.logs++;
  const t = Le("logger");
  t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Jt.prototype.getMetrics = () => Object.assign({}, Ue);
Jt.prototype.healthCheck = function() {
  return { status: bs.isInitialized() ? "HEALTHY" : "DEGRADED", version: Iu, moduleId: $o, checks: { loggerReady: !!Le("logger"), portsInitialized: bs.isInitialized() }, metrics: this.getMetrics(), portsInitialized: bs.isInitialized() };
};
const tr = "5.1.0-ENTERPRISE", er = "header/components/whatsapp-integration/telemetry/tracker";
let Su = [], wu = class {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: tr, moduleId: er, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: tr, moduleId: er, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Su];
  }
};
const sr = "5.1.0-ENTERPRISE", nr = "header/components/whatsapp-integration/core/polling";
let Oo = !1, ys = [];
function Au(t, ...e) {
  !Oo && t === "debug" || (ys.push({ level: t, args: e, ts: Date.now() }), ys.length > 50 && ys.shift());
}
let $u = class {
  constructor(e = {}) {
    this.interval = e.interval || 6e4, this.immediate = e.immediate !== !1, this.timerId = null, this.isRunning = !1, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this.immediate && this._execute(), this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.isRunning && (this.isRunning = !1, this.timerId && (clearInterval(this.timerId), this.timerId = null));
  }
  async _execute() {
    if (!document.hidden && this.callbacks.length !== 0) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      try {
        for (const e of this.callbacks)
          await e();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++, Au("error", "Execution error:", e);
      }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: sr, moduleId: nr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: sr, moduleId: nr, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Oo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ys];
  }
};
const Dn = "9.7.0-P1-UARPS", xe = "whatsapp-integration", Mo = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, gt = "header/components/whatsapp-integration", Tt = a({ moduleId: gt }), Ou = () => {
  Tt.init();
}, He = (t) => Tt.get(t), Mu = (t) => Tt.inject(t), Tu = () => Tt.snapshot(), Pu = (t = {}) => {
  const e = He("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:whatsapp-integration", source: gt, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/whatsapp-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const Ru = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 176"><rect fill="#29a71a" height="176" rx="24" width="176"/><g fill="#fff"><path d="m126.8 49.2a54.57 54.57 0 0 0 -87.42 63.13l-5.79 28.11a2.08 2.08 0 0 0 .33 1.63 2.11 2.11 0 0 0 2.24.87l27.55-6.53a54.56 54.56 0 0 0 63.09-87.21zm-8.59 68.56a42.74 42.74 0 0 1 -49.22 8l-3.84-1.9-16.89 4 .05-.21 3.5-17-1.88-3.71a42.72 42.72 0 0 1 7.86-49.59 42.73 42.73 0 0 1 60.42 0 2.28 2.28 0 0 0 .22.22 42.72 42.72 0 0 1 -.22 60.19z"/><path d="m116.71 105.29c-2.07 3.26-5.34 7.25-9.45 8.24-7.2 1.74-18.25.06-32-12.76l-.17-.15c-12.09-11.21-15.23-20.54-14.47-27.94.42-4.2 3.92-8 6.87-10.48a3.93 3.93 0 0 1 6.15 1.41l4.45 10a3.91 3.91 0 0 1 -.49 4l-2.25 2.92a3.87 3.87 0 0 0 -.35 4.32c1.26 2.21 4.28 5.46 7.63 8.47 3.76 3.4 7.93 6.51 10.57 7.57a3.82 3.82 0 0 0 4.19-.88l2.61-2.63a4 4 0 0 1 3.9-1l10.57 3a4 4 0 0 1 2.24 5.91z"/></g></svg>';
function B(t) {
  t = t || {}, this.container = t.container, this.store = new ku({ unreadCount: 0, status: "loading" }), this.lifecycle = new vu(this), this.logger = new Jt({ prefix: "[WhatsApp]", debug: !1 }), this.telemetry = new wu(), this.api = new Cu(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
B.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Ou(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = He("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: xe, moduleId: gt, timestamp: Date.now() });
  }));
};
B.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "whatsapp-integration-component", this.element.title = "WhatsApp", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-whatsapp-integration"), this.element.innerHTML = `<div class="integration-icon">${Ru}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Pu({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
B.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
B.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = He("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: xe, moduleId: gt, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
B.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new $u({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
B.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = He("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: xe, moduleId: gt, timestamp: Date.now() });
  });
};
B.prototype.healthCheck = function() {
  const t = He("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Tt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Tt.isInitialized(), version: Dn, moduleId: gt };
};
B.prototype.info = function() {
  return { version: Dn, moduleId: gt, id: xe, capabilities: Mo, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Tt.isInitialized(), metrics: this._metrics };
};
var Lu = B;
const Uu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: gt,
  VERSION: Dn,
  WhatsAppIntegrationComponent: B,
  capabilities: Mo,
  default: Lu,
  getPorts: Tu,
  id: xe,
  injectPorts: Mu
}, Symbol.toStringTag, { value: "Module" })), To = "6.1.0-ES6", Gs = "header.instagram-messenger-integration.api.fetch", Ts = a({ moduleId: Gs });
function xu(t) {
  return Ts.get(t);
}
function ir(t, ...e) {
  const s = xu("logger");
  s && s[t] && s[t](...[`[${Gs}]`].concat(e));
}
function rr(t) {
  return {
    status: "unavailable",
    configured: !1,
    unread_count: 0,
    message: "Indisponível no momento",
    integration: "instagram",
    _fallback: !0,
    _fallback_reason: t
  };
}
function Hu(t) {
  if (!t) return !1;
  if (t.name === "AbortError") return !0;
  const e = String(t.message || "").toLowerCase();
  return e.indexOf("aborted") !== -1 || e.indexOf("abort") !== -1;
}
function ue(t) {
  this.endpoint = t || "/api/integrations/instagram/status.php", this.timeout = 12e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
ue.prototype.fetchStatus = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout);
  return fetch(t.endpoint, {
    signal: e.signal,
    headers: { "Content-Type": "application/json" }
  }).then((n) => {
    if (clearTimeout(s), !n.ok) throw new Error(`HTTP ${n.status}`);
    return n.json();
  }).then((n) => {
    if (!n.ok) throw new Error(n.error || "API_ERROR");
    return t._metrics.successCount++, n.data;
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Hu(n) ? (ir("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), rr("timeout")) : (ir("warn", "Fetch failed (non-fatal)", { error: n.message }), rr("error"))));
};
ue.prototype.healthCheck = function() {
  const t = {
    hasEndpoint: !!this.endpoint,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    portsInitialized: Ts.isInitialized()
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e === 3 ? "HEALTHY" : "DEGRADED",
    score: e,
    maxScore: 3,
    scoreDisplay: `${e}/3`,
    checks: t,
    portsInitialized: Ts.isInitialized(),
    version: To,
    moduleId: Gs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
ue.prototype.info = function() {
  return {
    version: To,
    moduleId: Gs,
    endpoint: this.endpoint,
    metrics: this._metrics,
    portsInitialized: Ts.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
ue.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
ue.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Nu = ue;
const or = "5.1.0-ENTERPRISE", ar = "header/components/instagram-messenger-integration/core/lifecycle";
let Po = !1, Cs = [];
function ju(t, ...e) {
  !Po && t === "debug" || (Cs.push({ level: t, args: e, ts: Date.now() }), Cs.length > 50 && Cs.shift());
}
let Bu = class {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, ju("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: or, moduleId: ar, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: or, moduleId: ar, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Po = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Cs];
  }
};
const cr = "5.1.0-ENTERPRISE", lr = "header/components/instagram-messenger-integration/state/store";
let Ro = !1, Es = [];
function zu(t, ...e) {
  !Ro && t === "debug" || (Es.push({ level: t, args: e, ts: Date.now() }), Es.length > 50 && Es.shift());
}
let qu = class {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._debug = !1, this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        zu("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: cr, moduleId: lr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: cr, moduleId: lr, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Ro = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Es];
  }
};
const Lo = "header.instagram-messenger-integration.telemetry.logger", Vu = "8.4.0-ES6", vs = a({ moduleId: Lo });
function Ne(t) {
  return vs.get(t);
}
let he = { logs: 0, warns: 0, errors: 0 };
function _t(t) {
  t || (t = {}), this.prefix = t.prefix || "[instagram-messenger]", this.debug = t.debug || !1;
}
_t.prototype.info = function(...t) {
  if (!this.debug) return;
  he.logs++;
  const e = Ne("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
_t.prototype.warn = function(...t) {
  he.warns++;
  const e = Ne("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
_t.prototype.error = function(...t) {
  he.errors++;
  const e = Ne("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
_t.prototype.debug = function(...t) {
  if (!this.debug) return;
  he.logs++;
  const e = Ne("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
_t.prototype.getMetrics = () => Object.assign({}, he);
_t.prototype.resetMetrics = () => {
  he = { logs: 0, warns: 0, errors: 0 };
};
_t.prototype.healthCheck = function() {
  return { status: vs.isInitialized() ? "HEALTHY" : "DEGRADED", version: Vu, moduleId: Lo, checks: { loggerReady: !!Ne("logger"), portsInitialized: vs.isInitialized() }, metrics: this.getMetrics(), portsInitialized: vs.isInitialized() };
};
const ur = "5.1.0-ENTERPRISE", hr = "header/components/instagram-messenger-integration/telemetry/tracker";
let Gu = [], Yu = class {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ur, moduleId: hr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ur, moduleId: hr, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Gu];
  }
};
const dr = "5.1.0-ENTERPRISE", mr = "header/components/instagram-messenger-integration/core/polling";
let Uo = !1, Ds = [];
function Fu(t, ...e) {
  !Uo && t === "debug" || (Ds.push({ level: t, args: e, ts: Date.now() }), Ds.length > 50 && Ds.shift());
}
let Wu = class {
  constructor(e = {}) {
    this.interval = e.interval || 6e4, this.immediate = e.immediate !== !1, this.timerId = null, this.isRunning = !1, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this.immediate && this._execute(), this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.isRunning && (this.isRunning = !1, this.timerId && (clearInterval(this.timerId), this.timerId = null));
  }
  async _execute() {
    if (!document.hidden && this.callbacks.length !== 0) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      try {
        for (const e of this.callbacks)
          await e();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++, Fu("error", "Execution error:", e);
      }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: dr, moduleId: mr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: dr, moduleId: mr, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Uo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ds];
  }
};
const kn = "9.7.0-P1-UARPS", je = "instagram-messenger-integration", xo = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, bt = "header/components/instagram-messenger-integration", Pt = a({ moduleId: bt }), Ku = () => {
  Pt.init();
}, Be = (t) => Pt.get(t), Ju = (t) => Pt.inject(t), Xu = () => Pt.snapshot(), Zu = (t = {}) => {
  const e = Be("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:instagram-messenger-integration", source: bt, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/instagram-messenger-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const Qu = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad" gradientTransform="matrix(0 -1.982 -1.844 0 -132.522 -51.077)" gradientUnits="userSpaceOnUse" x1="-37.106" x2="-26.555" y1="-72.705" y2="-84.047"><stop offset="0" stop-color="#fd5"/><stop offset=".5" stop-color="#ff543e"/><stop offset="1" stop-color="#c837ab"/></linearGradient></defs><path d="m1.5 1.633c-1.886 1.959-1.5 4.04-1.5 10.362 0 5.25-.916 10.513 3.878 11.752 1.497.385 14.761.385 16.256-.002 1.996-.515 3.62-2.134 3.842-4.957.031-.394.031-13.185-.001-13.587-.236-3.007-2.087-4.74-4.526-5.091-.559-.081-.671-.105-3.539-.11-10.173.005-12.403-.448-14.41 1.633z" fill="url(#ig-grad)"/><path d="m11.998 3.139c-3.631 0-7.079-.323-8.396 3.057-.544 1.396-.465 3.209-.465 5.805 0 2.278-.073 4.419.465 5.804 1.314 3.382 4.79 3.058 8.394 3.058 3.477 0 7.062.362 8.395-3.058.545-1.41.465-3.196.465-5.804 0-3.462.191-5.697-1.488-7.375-1.7-1.7-3.999-1.487-7.374-1.487zm-.794 1.597c7.574-.012 8.538-.854 8.006 10.843-.189 4.137-3.339 3.683-7.211 3.683-7.06 0-7.263-.202-7.263-7.265 0-7.145.56-7.257 6.468-7.263zm5.524 1.471c-.587 0-1.063.476-1.063 1.063s.476 1.063 1.063 1.063 1.063-.476 1.063-1.063-.476-1.063-1.063-1.063zm-4.73 1.243c-2.513 0-4.55 2.038-4.55 4.551s2.037 4.55 4.55 4.55 4.549-2.037 4.549-4.55-2.036-4.551-4.549-4.551zm0 1.597c3.905 0 3.91 5.908 0 5.908-3.904 0-3.91-5.908 0-5.908z" fill="#fff"/></svg>';
function z(t) {
  t = t || {}, this.container = t.container, this.store = new qu({ unreadCount: 0, status: "loading" }), this.lifecycle = new Bu(this), this.logger = new _t({ prefix: "[Instagram]", debug: !1 }), this.telemetry = new Yu(), this.api = new Nu(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
z.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Ku(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Be("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: je, moduleId: bt, timestamp: Date.now() });
  }));
};
z.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "instagram-messenger-integration-component", this.element.title = "Instagram / Messenger", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-instagram-messenger-integration"), this.element.innerHTML = `<div class="integration-icon">${Qu}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Zu({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
z.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
z.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Be("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: je, moduleId: bt, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
z.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new Wu({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
z.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Be("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: je, moduleId: bt, timestamp: Date.now() });
  });
};
z.prototype.healthCheck = function() {
  const t = Be("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Pt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Pt.isInitialized(), version: kn, moduleId: bt };
};
z.prototype.info = function() {
  return { version: kn, moduleId: bt, id: je, capabilities: xo, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Pt.isInitialized(), metrics: this._metrics };
};
var th = z;
const eh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  InstagramMessengerComponent: z,
  MODULE_ID: bt,
  VERSION: kn,
  capabilities: xo,
  default: th,
  getPorts: Xu,
  id: je,
  injectPorts: Ju
}, Symbol.toStringTag, { value: "Module" })), Ho = "6.1.0-ES6", Ys = "header.wechat-integration.api.fetch", Ps = a({ moduleId: Ys });
function sh(t) {
  return Ps.get(t);
}
function pr(t, ...e) {
  const s = sh("logger");
  s && s[t] && s[t](...[`[${Ys}]`].concat(e));
}
function fr(t) {
  return {
    status: "unavailable",
    configured: !1,
    unread_count: 0,
    message: "Indisponível no momento",
    integration: "wechat",
    _fallback: !0,
    _fallback_reason: t
  };
}
function nh(t) {
  if (!t) return !1;
  if (t.name === "AbortError") return !0;
  const e = String(t.message || "").toLowerCase();
  return e.indexOf("aborted") !== -1 || e.indexOf("abort") !== -1;
}
function de(t) {
  this.endpoint = t || "/api/integrations/wechat/status.php", this.timeout = 12e3, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
de.prototype.fetchStatus = function() {
  const t = this;
  t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now();
  const e = new AbortController(), s = setTimeout(() => {
    e.abort();
  }, t.timeout);
  return fetch(t.endpoint, {
    signal: e.signal,
    headers: { "Content-Type": "application/json" }
  }).then((n) => {
    if (clearTimeout(s), !n.ok) throw new Error(`HTTP ${n.status}`);
    return n.json();
  }).then((n) => {
    if (!n.ok) throw new Error(n.error || "API_ERROR");
    return t._metrics.successCount++, n.data;
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, nh(n) ? (pr("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), fr("timeout")) : (pr("warn", "Fetch failed (non-fatal)", { error: n.message }), fr("error"))));
};
de.prototype.healthCheck = function() {
  const t = {
    hasEndpoint: !!this.endpoint,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    portsInitialized: Ps.isInitialized()
  }, e = Object.values(t).filter(Boolean).length;
  return {
    status: e === 3 ? "HEALTHY" : "DEGRADED",
    score: e,
    maxScore: 3,
    scoreDisplay: `${e}/3`,
    checks: t,
    portsInitialized: Ps.isInitialized(),
    version: Ho,
    moduleId: Ys,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
de.prototype.info = function() {
  return {
    version: Ho,
    moduleId: Ys,
    endpoint: this.endpoint,
    metrics: this._metrics,
    portsInitialized: Ps.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
de.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
de.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var ih = de;
const gr = "5.1.0-ENTERPRISE", _r = "header/components/wechat-integration/core/lifecycle";
let No = !1, ks = [];
function rh(t, ...e) {
  !No && t === "debug" || (ks.push({ level: t, args: e, ts: Date.now() }), ks.length > 50 && ks.shift());
}
class oh {
  constructor(e) {
    this.component = e, this.state = "unmounted", this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }, this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting", await this._runHooks("beforeMount"), this.state = "mounted", await this._runHooks("mounted"), this._metrics.mountCount++, this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate"), await this._runHooks("updated"), this._metrics.updateCount++;
  }
  async unmount() {
    this.state !== "unmounted" && (this.state = "unmounting", await this._runHooks("beforeUnmount"), this.state = "unmounted", await this._runHooks("unmounted"), this._metrics.unmountCount++, this._metrics.lastTransitionAt = Date.now());
  }
  async _runHooks(e) {
    const s = this.hooks[e] || [];
    for (const n of s)
      try {
        await n(this.component);
      } catch (i) {
        this._metrics.errorCount++, rh("error", `Error in ${e}:`, i);
      }
  }
  onBeforeMount(e) {
    this.hooks.beforeMount.push(e);
  }
  onMounted(e) {
    this.hooks.mounted.push(e);
  }
  onBeforeUpdate(e) {
    this.hooks.beforeUpdate.push(e);
  }
  onUpdated(e) {
    this.hooks.updated.push(e);
  }
  onBeforeUnmount(e) {
    this.hooks.beforeUnmount.push(e);
  }
  onUnmounted(e) {
    this.hooks.unmounted.push(e);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const e = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: gr, moduleId: _r, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: gr, moduleId: _r, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    No = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ks];
  }
}
const br = "5.1.0-ENTERPRISE", yr = "header/components/wechat-integration/state/store";
let jo = !1, Is = [];
function ah(t, ...e) {
  !jo && t === "debug" || (Is.push({ level: t, args: e, ts: Date.now() }), Is.length > 50 && Is.shift());
}
class ch {
  constructor(e = {}) {
    this.state = { ...e }, this.subscribers = [], this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  // @ts-expect-error TS migration - TS2349
  setState(e) {
    const s = this.getState();
    this.state = { ...this.state, ...e }, this._metrics.updateCount++, this._metrics.lastUpdateAt = Date.now(), this.subscribers.forEach((n) => {
      try {
        n(this.state, s), this._metrics.notifyCount++;
      } catch (i) {
        ah("error", "Store error:", i);
      }
    });
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const s = this.subscribers.indexOf(e);
      s > -1 && this.subscribers.splice(s, 1);
    };
  }
  reset() {
    this.state = {}, this.subscribers = [];
  }
  healthCheck() {
    const e = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: br, moduleId: yr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: br, moduleId: yr, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    jo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Is];
  }
}
const Bo = "header.wechat-integration.telemetry.logger", lh = "2.3.0-ES6", Ss = a({ moduleId: Bo });
function ze(t) {
  return Ss.get(t);
}
let qe = { logs: 0, warns: 0, errors: 0 };
function Xt(t) {
  t || (t = {}), this.prefix = t.prefix || "[wechat-integration]", this.debug = t.debug || !1;
}
Xt.prototype.info = function(...t) {
  if (!this.debug) return;
  qe.logs++;
  const e = ze("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Xt.prototype.warn = function(...t) {
  qe.warns++;
  const e = ze("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Xt.prototype.error = function(...t) {
  qe.errors++;
  const e = ze("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Xt.prototype.debug = function(...t) {
  if (!this.debug) return;
  qe.logs++;
  const e = ze("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Xt.prototype.getMetrics = () => Object.assign({}, qe);
Xt.prototype.healthCheck = function() {
  return { status: Ss.isInitialized() ? "HEALTHY" : "DEGRADED", version: lh, moduleId: Bo, checks: { loggerReady: !!ze("logger"), portsInitialized: Ss.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Ss.isInitialized() };
};
const Cr = "5.1.0-ENTERPRISE", Er = "header/components/wechat-integration/telemetry/tracker";
let uh = [];
class hh {
  constructor(e = {}) {
    this.enabled = e.enabled !== !1, this.events = [], this.maxEvents = e.maxEvents || 100, this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  track(e, s = {}) {
    this.enabled && (this.events.push({ event: e, data: s, timestamp: Date.now() }), this._metrics.trackCount++, this._metrics.lastTrackAt = Date.now(), this.events.length > this.maxEvents && this.events.shift());
  }
  getEvents() {
    return [...this.events];
  }
  flush() {
    const e = [...this.events];
    return this.events = [], this._metrics.flushCount++, e;
  }
  clear() {
    this.events = [];
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
  healthCheck() {
    const e = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Cr, moduleId: Er, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Cr, moduleId: Er, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...uh];
  }
}
const vr = "5.1.0-ENTERPRISE", Dr = "header/components/wechat-integration/core/polling";
let zo = !1, ws = [];
function dh(t, ...e) {
  !zo && t === "debug" || (ws.push({ level: t, args: e, ts: Date.now() }), ws.length > 50 && ws.shift());
}
class mh {
  constructor(e = {}) {
    this.interval = e.interval || 6e4, this.immediate = e.immediate !== !1, this.timerId = null, this.isRunning = !1, this.callbacks = [], this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  start() {
    this.isRunning || (this.isRunning = !0, this.immediate && this._execute(), this.timerId = setInterval(() => this._execute(), this.interval));
  }
  stop() {
    this.isRunning && (this.isRunning = !1, this.timerId && (clearInterval(this.timerId), this.timerId = null));
  }
  async _execute() {
    if (!document.hidden && this.callbacks.length !== 0) {
      this._metrics.pollCount++, this._metrics.lastPollAt = Date.now();
      try {
        for (const e of this.callbacks)
          await e();
        this._metrics.successCount++;
      } catch (e) {
        this._metrics.errorCount++, dh("error", "Execution error:", e);
      }
    }
  }
  onPoll(e) {
    this.callbacks.push(e);
  }
  offPoll(e) {
    const s = this.callbacks.indexOf(e);
    s > -1 && this.callbacks.splice(s, 1);
  }
  healthCheck() {
    const e = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }, s = Object.values(e).filter(Boolean).length;
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: vr, moduleId: Dr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: vr, moduleId: Dr, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    zo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...ws];
  }
}
const In = "9.7.0-P1-UARPS", Ve = "wechat-integration", qo = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, yt = "header/components/wechat-integration", Rt = a({ moduleId: yt }), ph = () => {
  Rt.init();
}, Ge = (t) => Rt.get(t), fh = (t) => Rt.inject(t), gh = () => Rt.snapshot(), _h = (t = {}) => {
  const e = Ge("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:wechat-integration", source: yt, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/wechat-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const bh = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#07C160" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 0 1 .178-.554c1.527-1.124 2.5-2.783 2.5-4.622 0-3.295-3.063-6.12-7.06-6.12zm-2.641 3.125c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/></svg>';
function q(t) {
  t = t || {}, this.container = t.container, this.store = new ch({ unreadCount: 0, status: "loading" }), this.lifecycle = new oh(this), this.logger = new Xt({ prefix: "[WeChat]", debug: !1 }), this.telemetry = new hh(), this.api = new ih(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
q.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (ph(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Ge("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Ve, moduleId: yt, timestamp: Date.now() });
  }));
};
q.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "wechat-integration-component", this.element.title = "WeChat", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-wechat-integration"), this.element.innerHTML = `<div class="integration-icon">${bh}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    _h({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
q.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
q.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Ge("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Ve, moduleId: yt, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
q.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new mh({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
q.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Ge("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Ve, moduleId: yt, timestamp: Date.now() });
  });
};
q.prototype.healthCheck = function() {
  const t = Ge("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Rt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Rt.isInitialized(), version: In, moduleId: yt };
};
q.prototype.info = function() {
  return { version: In, moduleId: yt, id: Ve, capabilities: qo, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Rt.isInitialized(), metrics: this._metrics };
};
var yh = q;
const Ch = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: yt,
  VERSION: In,
  WeChatIntegrationComponent: q,
  capabilities: qo,
  default: yh,
  getPorts: gh,
  id: Ve,
  injectPorts: fh
}, Symbol.toStringTag, { value: "Module" })), Sn = "8.8.0-ES6", Vo = "panel-adwords", Go = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Y = "header/components/panel-adwords", D = { id: "panel-adwords", label: "Google Ads", route: "#/panel-ads", icon: "/assets/icons/system/header/adwords.svg" }, Lt = a({ moduleId: Y });
function Eh() {
  Lt.init();
}
function vh(t) {
  return Lt.get(t);
}
function Dh(t) {
  return Lt.inject(t);
}
function kh() {
  return Lt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-adwords/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function Xs(t, e) {
  e = e || {};
  const s = vh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: Y, timestamp: Date.now() }, e));
}
function h(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
h.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Eh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Xs(o.MOUNTED, { componentId: D.id, moduleId: Y }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Xs(o.ERROR, { componentId: D.id, moduleId: Y, error: e.message }), Promise.reject(e);
  }
};
h.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-adwords-trigger", this.element.title = D.label, this.element.setAttribute("aria-label", `Abrir ${D.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", D.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-adwords"), this.element.innerHTML = `<img src="${D.icon}" alt="${D.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
h.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(D.route, Y);
  }, this.element.addEventListener("click", this._clickHandler));
};
h.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
h.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Xs(o.UNMOUNTED, { componentId: D.id, moduleId: Y }), Promise.resolve(this));
};
h.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
h.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Lt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Lt.isInitialized(), version: Sn, moduleId: Y, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
h.prototype.info = function() {
  return { version: Sn, moduleId: Y, id: Vo, capabilities: Go, config: Object.assign({}, D), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Lt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
h.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
h.prototype.isMounted = function() {
  return this._isMounted;
};
h.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
h.prototype.getElement = function() {
  return this.element;
};
function Ih(t) {
  return new h(t);
}
var Sh = h;
const wh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Y,
  PanelAdwordsComponent: h,
  VERSION: Sn,
  capabilities: Go,
  createComponent: Ih,
  default: Sh,
  getPorts: kh,
  id: Vo,
  injectPorts: Dh
}, Symbol.toStringTag, { value: "Module" })), wn = "8.8.0-ES6", Yo = "panel-asaas", Fo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, F = "header/components/panel-asaas", k = { id: "panel-asaas", label: "Asaas", route: "#/integrations/asaas", icon: "/assets/icons/system/header/asaas.svg" }, Ut = a({ moduleId: F });
function Ah() {
  Ut.init();
}
function $h(t) {
  return Ut.get(t);
}
function Oh(t) {
  return Ut.inject(t);
}
function Mh() {
  return Ut.snapshot();
}
(function() {
  const e = "/components/header/components/panel-asaas/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function Zs(t, e) {
  e = e || {};
  const s = $h("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: F, timestamp: Date.now() }, e));
}
function d(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
d.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Ah(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Zs(o.MOUNTED, { componentId: k.id, moduleId: F }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Zs(o.ERROR, { componentId: k.id, moduleId: F, error: e.message }), Promise.reject(e);
  }
};
d.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-asaas-trigger", this.element.title = k.label, this.element.setAttribute("aria-label", `Abrir ${k.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", k.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-asaas"), this.element.innerHTML = `<img src="${k.icon}" alt="${k.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
d.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(k.route, F);
  }, this.element.addEventListener("click", this._clickHandler));
};
d.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
d.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Zs(o.UNMOUNTED, { componentId: k.id, moduleId: F }), Promise.resolve(this));
};
d.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
d.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ut.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Ut.isInitialized(), version: wn, moduleId: F, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
d.prototype.info = function() {
  return { version: wn, moduleId: F, id: Yo, capabilities: Fo, config: Object.assign({}, k), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ut.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
d.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
d.prototype.isMounted = function() {
  return this._isMounted;
};
d.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
d.prototype.getElement = function() {
  return this.element;
};
function Th(t) {
  return new d(t);
}
var Ph = d;
const Rh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: F,
  PanelAsaasComponent: d,
  VERSION: wn,
  capabilities: Fo,
  createComponent: Th,
  default: Ph,
  getPorts: Mh,
  id: Yo,
  injectPorts: Oh
}, Symbol.toStringTag, { value: "Module" })), An = "8.8.0-ES6", Wo = "panel-bling", Ko = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, W = "header/components/panel-bling", I = { id: "panel-bling", label: "Bling", route: "#/integrations/bling", icon: "/assets/icons/system/header/bling.svg" }, xt = a({ moduleId: W });
function Lh() {
  xt.init();
}
function Uh(t) {
  return xt.get(t);
}
function xh(t) {
  return xt.inject(t);
}
function Hh() {
  return xt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-bling/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function Qs(t, e) {
  e = e || {};
  const s = Uh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: W, timestamp: Date.now() }, e));
}
function m(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
m.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Lh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Qs(o.MOUNTED, { componentId: I.id, moduleId: W }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Qs(o.ERROR, { componentId: I.id, moduleId: W, error: e.message }), Promise.reject(e);
  }
};
m.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-bling-trigger", this.element.title = I.label, this.element.setAttribute("aria-label", `Abrir ${I.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", I.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-bling"), this.element.innerHTML = `<img src="${I.icon}" alt="${I.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
m.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(I.route, W);
  }, this.element.addEventListener("click", this._clickHandler));
};
m.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
m.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Qs(o.UNMOUNTED, { componentId: I.id, moduleId: W }), Promise.resolve(this));
};
m.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
m.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: xt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: xt.isInitialized(), version: An, moduleId: W, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
m.prototype.info = function() {
  return { version: An, moduleId: W, id: Wo, capabilities: Ko, config: Object.assign({}, I), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: xt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
m.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
m.prototype.isMounted = function() {
  return this._isMounted;
};
m.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
m.prototype.getElement = function() {
  return this.element;
};
function Nh(t) {
  return new m(t);
}
var jh = m;
const Bh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: W,
  PanelBlingComponent: m,
  VERSION: An,
  capabilities: Ko,
  createComponent: Nh,
  default: jh,
  getPorts: Hh,
  id: Wo,
  injectPorts: xh
}, Symbol.toStringTag, { value: "Module" })), $n = "8.8.0-ES6", Jo = "panel-calendar", Xo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, K = "header/components/panel-calendar", S = { id: "panel-calendar", label: "Google Calendar", route: "#/panel-google-calendar", icon: "/assets/icons/system/header/calendar.svg" }, Ht = a({ moduleId: K });
function zh() {
  Ht.init();
}
function qh(t) {
  return Ht.get(t);
}
function Vh(t) {
  return Ht.inject(t);
}
function Gh() {
  return Ht.snapshot();
}
(function() {
  const e = "/components/header/components/panel-calendar/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function tn(t, e) {
  e = e || {};
  const s = qh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: K, timestamp: Date.now() }, e));
}
function p(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
p.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (zh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), tn(o.MOUNTED, { componentId: S.id, moduleId: K }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, tn(o.ERROR, { componentId: S.id, moduleId: K, error: e.message }), Promise.reject(e);
  }
};
p.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-calendar-trigger", this.element.title = S.label, this.element.setAttribute("aria-label", `Abrir ${S.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", S.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-calendar"), this.element.innerHTML = `<img src="${S.icon}" alt="${S.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
p.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(S.route, K);
  }, this.element.addEventListener("click", this._clickHandler));
};
p.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
p.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, tn(o.UNMOUNTED, { componentId: S.id, moduleId: K }), Promise.resolve(this));
};
p.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
p.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ht.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Ht.isInitialized(), version: $n, moduleId: K, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
p.prototype.info = function() {
  return { version: $n, moduleId: K, id: Jo, capabilities: Xo, config: Object.assign({}, S), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ht.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
p.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
p.prototype.isMounted = function() {
  return this._isMounted;
};
p.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
p.prototype.getElement = function() {
  return this.element;
};
function Yh(t) {
  return new p(t);
}
var Fh = p;
const Wh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: K,
  PanelCalendarComponent: p,
  VERSION: $n,
  capabilities: Xo,
  createComponent: Yh,
  default: Fh,
  getPorts: Gh,
  id: Jo,
  injectPorts: Vh
}, Symbol.toStringTag, { value: "Module" })), On = "8.8.0-ES6", Zo = "panel-chatgpt", Qo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, J = "header/components/panel-chatgpt", w = { id: "panel-chatgpt", label: "ChatGPT", route: "#/integrations/chatgpt", icon: "/assets/icons/system/header/chatgpt.svg" }, Nt = a({ moduleId: J });
function Kh() {
  Nt.init();
}
function Jh(t) {
  return Nt.get(t);
}
function Xh(t) {
  return Nt.inject(t);
}
function Zh() {
  return Nt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-chatgpt/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function en(t, e) {
  e = e || {};
  const s = Jh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: J, timestamp: Date.now() }, e));
}
function f(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
f.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Kh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), en(o.MOUNTED, { componentId: w.id, moduleId: J }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, en(o.ERROR, { componentId: w.id, moduleId: J, error: e.message }), Promise.reject(e);
  }
};
f.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-chatgpt-trigger", this.element.title = w.label, this.element.setAttribute("aria-label", `Abrir ${w.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", w.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-chatgpt"), this.element.innerHTML = `<img src="${w.icon}" alt="${w.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
f.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(w.route, J);
  }, this.element.addEventListener("click", this._clickHandler));
};
f.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
f.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, en(o.UNMOUNTED, { componentId: w.id, moduleId: J }), Promise.resolve(this));
};
f.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
f.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Nt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Nt.isInitialized(), version: On, moduleId: J, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
f.prototype.info = function() {
  return { version: On, moduleId: J, id: Zo, capabilities: Qo, config: Object.assign({}, w), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Nt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
f.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
f.prototype.isMounted = function() {
  return this._isMounted;
};
f.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
f.prototype.getElement = function() {
  return this.element;
};
function Qh(t) {
  return new f(t);
}
var td = f;
const ed = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: J,
  PanelChatgptComponent: f,
  VERSION: On,
  capabilities: Qo,
  createComponent: Qh,
  default: td,
  getPorts: Zh,
  id: Zo,
  injectPorts: Xh
}, Symbol.toStringTag, { value: "Module" })), Mn = "8.8.0-ES6", ta = "panel-google-drive", ea = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, X = "header/components/panel-google-drive", A = { id: "panel-google-drive", label: "Google Drive", route: "#/integrations/google-drive", icon: "/assets/icons/system/header/google-drive.svg" }, jt = a({ moduleId: X });
function sd() {
  jt.init();
}
function nd(t) {
  return jt.get(t);
}
function id(t) {
  return jt.inject(t);
}
function rd() {
  return jt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-google-drive/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function sn(t, e) {
  e = e || {};
  const s = nd("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: X, timestamp: Date.now() }, e));
}
function g(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
g.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (sd(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), sn(o.MOUNTED, { componentId: A.id, moduleId: X }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, sn(o.ERROR, { componentId: A.id, moduleId: X, error: e.message }), Promise.reject(e);
  }
};
g.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-google-drive-trigger", this.element.title = A.label, this.element.setAttribute("aria-label", `Abrir ${A.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", A.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-google-drive"), this.element.innerHTML = `<img src="${A.icon}" alt="${A.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
g.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(A.route, X);
  }, this.element.addEventListener("click", this._clickHandler));
};
g.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
g.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, sn(o.UNMOUNTED, { componentId: A.id, moduleId: X }), Promise.resolve(this));
};
g.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
g.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: jt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: jt.isInitialized(), version: Mn, moduleId: X, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
g.prototype.info = function() {
  return { version: Mn, moduleId: X, id: ta, capabilities: ea, config: Object.assign({}, A), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: jt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
g.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
g.prototype.isMounted = function() {
  return this._isMounted;
};
g.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
g.prototype.getElement = function() {
  return this.element;
};
function od(t) {
  return new g(t);
}
var ad = g;
const cd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: X,
  PanelGoogleDriveComponent: g,
  VERSION: Mn,
  capabilities: ea,
  createComponent: od,
  default: ad,
  getPorts: rd,
  id: ta,
  injectPorts: id
}, Symbol.toStringTag, { value: "Module" })), Tn = "8.8.0-ES6", sa = "panel-loja-integrada", na = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Z = "header/components/panel-loja-integrada", $ = { id: "panel-loja-integrada", label: "Loja Integrada", route: "#/integrations/loja-integrada", icon: "/assets/icons/system/header/loja-integrada.svg" }, Bt = a({ moduleId: Z });
function ld() {
  Bt.init();
}
function ud(t) {
  return Bt.get(t);
}
function hd(t) {
  return Bt.inject(t);
}
function dd() {
  return Bt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-loja-integrada/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function nn(t, e) {
  e = e || {};
  const s = ud("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: Z, timestamp: Date.now() }, e));
}
function _(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
_.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (ld(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), nn(o.MOUNTED, { componentId: $.id, moduleId: Z }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, nn(o.ERROR, { componentId: $.id, moduleId: Z, error: e.message }), Promise.reject(e);
  }
};
_.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-loja-integrada-trigger", this.element.title = $.label, this.element.setAttribute("aria-label", `Abrir ${$.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", $.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-loja-integrada"), this.element.innerHTML = `<img src="${$.icon}" alt="${$.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
_.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v($.route, Z);
  }, this.element.addEventListener("click", this._clickHandler));
};
_.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
_.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, nn(o.UNMOUNTED, { componentId: $.id, moduleId: Z }), Promise.resolve(this));
};
_.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
_.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Bt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Bt.isInitialized(), version: Tn, moduleId: Z, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
_.prototype.info = function() {
  return { version: Tn, moduleId: Z, id: sa, capabilities: na, config: Object.assign({}, $), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Bt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
_.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
_.prototype.isMounted = function() {
  return this._isMounted;
};
_.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
_.prototype.getElement = function() {
  return this.element;
};
function md(t) {
  return new _(t);
}
var pd = _;
const fd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Z,
  PanelLojaIntegradaComponent: _,
  VERSION: Tn,
  capabilities: na,
  createComponent: md,
  default: pd,
  getPorts: dd,
  id: sa,
  injectPorts: hd
}, Symbol.toStringTag, { value: "Module" })), Pn = "8.8.0-ES6", ia = "panel-maps", ra = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Q = "header/components/panel-maps", O = { id: "panel-maps", label: "Mapas", route: "#/location", icon: "/assets/icons/system/header/maps.svg" }, zt = a({ moduleId: Q });
function gd() {
  zt.init();
}
function _d(t) {
  return zt.get(t);
}
function bd(t) {
  return zt.inject(t);
}
function yd() {
  return zt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-maps/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function rn(t, e) {
  e = e || {};
  const s = _d("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: Q, timestamp: Date.now() }, e));
}
function b(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
b.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (gd(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), rn(o.MOUNTED, { componentId: O.id, moduleId: Q }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, rn(o.ERROR, { componentId: O.id, moduleId: Q, error: e.message }), Promise.reject(e);
  }
};
b.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-maps-trigger", this.element.title = O.label, this.element.setAttribute("aria-label", `Abrir ${O.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", O.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-maps"), this.element.innerHTML = `<img src="${O.icon}" alt="${O.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
b.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(O.route, Q);
  }, this.element.addEventListener("click", this._clickHandler));
};
b.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
b.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, rn(o.UNMOUNTED, { componentId: O.id, moduleId: Q }), Promise.resolve(this));
};
b.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
b.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: zt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: zt.isInitialized(), version: Pn, moduleId: Q, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
b.prototype.info = function() {
  return { version: Pn, moduleId: Q, id: ia, capabilities: ra, config: Object.assign({}, O), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: zt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
b.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
b.prototype.isMounted = function() {
  return this._isMounted;
};
b.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
b.prototype.getElement = function() {
  return this.element;
};
function Cd(t) {
  return new b(t);
}
var Ed = b;
const vd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Q,
  PanelMapsComponent: b,
  VERSION: Pn,
  capabilities: ra,
  createComponent: Cd,
  default: Ed,
  getPorts: yd,
  id: ia,
  injectPorts: bd
}, Symbol.toStringTag, { value: "Module" })), Rn = "8.8.0-ES6", oa = "panel-mercado-livre", aa = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, tt = "header/components/panel-mercado-livre", M = { id: "panel-mercado-livre", label: "Mercado Livre", route: "#/integrations/mercado-livre", icon: "/assets/icons/system/header/mercado-livre.svg" }, qt = a({ moduleId: tt });
function Dd() {
  qt.init();
}
function kd(t) {
  return qt.get(t);
}
function Id(t) {
  return qt.inject(t);
}
function Sd() {
  return qt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-mercado-livre/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function on(t, e) {
  e = e || {};
  const s = kd("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: tt, timestamp: Date.now() }, e));
}
function y(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
y.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Dd(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), on(o.MOUNTED, { componentId: M.id, moduleId: tt }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, on(o.ERROR, { componentId: M.id, moduleId: tt, error: e.message }), Promise.reject(e);
  }
};
y.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-mercado-livre-trigger", this.element.title = M.label, this.element.setAttribute("aria-label", `Abrir ${M.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", M.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-mercado-livre"), this.element.innerHTML = `<img src="${M.icon}" alt="${M.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
y.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(M.route, tt);
  }, this.element.addEventListener("click", this._clickHandler));
};
y.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
y.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, on(o.UNMOUNTED, { componentId: M.id, moduleId: tt }), Promise.resolve(this));
};
y.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
y.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: qt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: qt.isInitialized(), version: Rn, moduleId: tt, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
y.prototype.info = function() {
  return { version: Rn, moduleId: tt, id: oa, capabilities: aa, config: Object.assign({}, M), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: qt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
y.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
y.prototype.isMounted = function() {
  return this._isMounted;
};
y.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
y.prototype.getElement = function() {
  return this.element;
};
function wd(t) {
  return new y(t);
}
var Ad = y;
const $d = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: tt,
  PanelMercadoLivreComponent: y,
  VERSION: Rn,
  capabilities: aa,
  createComponent: wd,
  default: Ad,
  getPorts: Sd,
  id: oa,
  injectPorts: Id
}, Symbol.toStringTag, { value: "Module" })), Ln = "8.8.0-ES6", ca = "panel-pipedrive", la = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, et = "header/components/panel-pipedrive", T = { id: "panel-pipedrive", label: "Pipedrive", route: "#/panel-pipedrive", icon: "/assets/icons/system/header/pipedrive.svg" }, Vt = a({ moduleId: et });
function Od() {
  Vt.init();
}
function Md(t) {
  return Vt.get(t);
}
function Td(t) {
  return Vt.inject(t);
}
function Pd() {
  return Vt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-pipedrive/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function an(t, e) {
  e = e || {};
  const s = Md("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: et, timestamp: Date.now() }, e));
}
function C(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
C.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Od(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), an(o.MOUNTED, { componentId: T.id, moduleId: et }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, an(o.ERROR, { componentId: T.id, moduleId: et, error: e.message }), Promise.reject(e);
  }
};
C.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-pipedrive-trigger", this.element.title = T.label, this.element.setAttribute("aria-label", `Abrir ${T.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", T.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-pipedrive"), this.element.innerHTML = `<img src="${T.icon}" alt="${T.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
C.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), v(T.route, et);
  }, this.element.addEventListener("click", this._clickHandler));
};
C.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
C.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, an(o.UNMOUNTED, { componentId: T.id, moduleId: et }), Promise.resolve(this));
};
C.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
C.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Vt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Vt.isInitialized(), version: Ln, moduleId: et, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
C.prototype.info = function() {
  return { version: Ln, moduleId: et, id: ca, capabilities: la, config: Object.assign({}, T), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Vt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
C.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
C.prototype.isMounted = function() {
  return this._isMounted;
};
C.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
C.prototype.getElement = function() {
  return this.element;
};
function Rd(t) {
  return new C(t);
}
var Ld = C;
const Ud = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: et,
  PanelPipedriveComponent: C,
  VERSION: Ln,
  capabilities: la,
  createComponent: Rd,
  default: Ld,
  getPorts: Pd,
  id: ca,
  injectPorts: Td
}, Symbol.toStringTag, { value: "Module" })), km = {
  "currency-rotator": Aa,
  "errors-status": Fa,
  notifications: mc,
  "real-time-clock": Ic,
  "weather-sp": Vc,
  "user-menu": jl,
  logo: Zl,
  "email-integration": _u,
  "whatsapp-integration": Uu,
  "instagram-messenger-integration": eh,
  "wechat-integration": Ch,
  "panel-adwords": wh,
  "panel-asaas": Rh,
  "panel-bling": Bh,
  "panel-calendar": Wh,
  "panel-chatgpt": ed,
  "panel-google-drive": cd,
  "panel-loja-integrada": fd,
  "panel-maps": vd,
  "panel-mercado-livre": $d,
  "panel-pipedrive": Ud
};
export {
  km as HEADER_COMPONENTS
};
