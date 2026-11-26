import { createUiPorts as a } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS as E } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS as o } from "/core/runtime/events/catalog/component.events.js";
import "/core/runtime/events/catalog/nav.events.js";
import { requestNavigation as pa } from "/components/header/core/navigation-adapter.js";
import "/core/runtime/enterprise/strict-mode.js";
import { encerrarSessao as fa } from "/core/auth/logout-client.js";
import { getAnnouncerRoot as ga, getTooltipRoot as _a } from "/components/header/utils/overlay-root.js";
const Rs = "1.1.0", Ls = "currency-rotator", cn = "header/components/currency-rotator", ln = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, ba = 5e3, ya = 3e4, Ca = 280, va = 40, Ea = 12e3, Da = "cotacao:asset", ka = "#/panel-cotacao", Ia = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="#e0e0e0" height="336" rx="40" width="480" x="19.499" y="91.5"/><path d="m259.499 187.5h240v48h-240z" fill="#b73831"/><path d="m307.5 211.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#d4483f"/><path d="m307.5 163.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><path d="m307.5 259.5h192v-24h-216a24 24 0 0 0 24 24z" fill="#f5f5f5"/><g fill="#b73831"><path d="m19.499 283.5h480v48h-480z"/><path d="m19.5 387.5a40 40 0 0 0 40 40h400a40 40 0 0 0 40-40v-8h-480z"/><path d="m459.5 91.5h-200v48h240v-8a40 40 0 0 0 -40-40z"/></g><path d="m259.5 283.5v-192h-200a40 40 0 0 0 -40 40v152z" fill="#2b66ba"/><path d="m43.5 94.877v132.623a32 32 0 0 0 32 32h184v-168h-200a39.781 39.781 0 0 0 -16 3.377z" fill="#3477cc"/><polygon fill="#e0e0e0" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/><polygon fill="#fff" points="74.894,139.3 67.499,123.563 67.499,163.317 82.32,171.5 79.484,154.133 91.499,141.834"/></svg>', wa = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 496"><path fill="#DC3027" d="M496,369.6c0,27.2-21.6,46.4-48,46.4H48c-26.4,0-48-19.2-48-46.4V126.4C0,99.2,21.6,80,48,80h400c26.4,0,48,19.2,48,46.4V369.6z"/><polygon fill="#F8D12E" points="86.4,130.4 98.4,168 137.6,168 106.4,190.4 118.4,227.2 86.4,204 55.2,226.4 67.2,190.4 35.2,168 74.4,168"/></svg>', Sa = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="btc-grad" x1="6.105" x2="25.895" y1="6.105" y2="25.895" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fdc830"/><stop offset="1" stop-color="#f37335"/></linearGradient></defs><path d="m18 15h-5v-4h5a2 2 0 0 1 0 4zm1 2h-6v4h6a2 2 0 0 0 0-4zm11-1a14 14 0 1 1 -14-14 14.016 14.016 0 0 1 14 14zm-7 3a3.988 3.988 0 0 0 -1.965-3.425 3.963 3.963 0 0 0 .965-2.575 4 4 0 0 0 -4-4v-2h-2v2h-1v-2h-2v2h-3v2h1v10h-1v2h3v2h2v-2h1v2h2v-2h1a4 4 0 0 0 4-4z" fill="url(#btc-grad)"/></svg>';
function Nn(t) {
  return t == null ? "--" : Number(t).toFixed(2);
}
function Aa(t) {
  return t == null ? "--" : t >= 1e3 ? `$${(t / 1e3).toFixed(2)}K` : `$${Number(t).toFixed(2)}`;
}
function $a(t) {
  return t == null || isNaN(t) ? "--" : `${t > 0 ? "+" : ""}${Number(t).toFixed(2)}%`;
}
const F = [
  { key: "usd-brl", title: "Dólar (USD/BRL)", icon: Ia, endpoint: "/api/currencies/get_usd_brl.php", pickVal: function(t) {
    return t.rate;
  }, pickChg: function(t) {
    return t.percent_change;
  }, fmtVal: Nn },
  { key: "usd-cny", title: "Yuan (USD/CNY)", icon: wa, endpoint: "/api/currencies/get_usd_cny.php", pickVal: function(t) {
    return t.rate;
  }, pickChg: function(t) {
    return t.percent_change;
  }, fmtVal: Nn },
  { key: "btc", title: "Bitcoin (BTC/USD)", icon: Sa, endpoint: "/api/currencies/get_btc.php", pickVal: function(t) {
    return t.usd;
  }, pickChg: function(t) {
    return t.usd_24h_change;
  }, fmtVal: Aa }
];
(function() {
  const e = "/components/header/components/currency-rotator/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function u(t) {
  t = t || {}, this.container = t.container, this.VERSION = Rs, this.id = Ls, this.capabilities = ln;
  const e = t.config && Number(t.config.pollingInterval);
  this.pollMs = e && e > 0 ? e : ya, this.element = null, this.track = null, this.isDestroyed = !1, this.rotIndex = 0, this.data = {}, this._rotTimer = null, this._pollTimer = null, this._resetTimer = null, this._hovered = !1, this._focused = !1, this._onEnter = null, this._onLeave = null, this._onFocus = null, this._onBlur = null, this._onClick = null, this._onKey = null, this._onVis = null;
}
u.prototype.mount = function() {
  return this.isDestroyed || (this.render(), this.fetchAll(), this.startPolling(), this.startRotation()), Promise.resolve();
};
u.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "currency-rotator-component", this.element.dataset.status = "loading", this.element.setAttribute("role", "button"), this.element.setAttribute("tabindex", "0"), this.element.setAttribute("aria-label", "Cotações — clique para abrir o painel"), this.element.title = F[0].title;
  const e = document.createElement("div");
  e.className = "cr-viewport", this.track = document.createElement("div"), this.track.className = "cr-track";
  const s = F.concat([F[0]]);
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
u.prototype._syncRotation = function() {
  this._hovered || this._focused ? this.stopRotation() : this.startRotation();
};
u.prototype._buildSlide = function(t) {
  const e = document.createElement("div");
  return e.className = "cr-slide", e.dataset.asset = t.key, e.innerHTML = `<div class="currency-icon">${t.icon}</div><div class="currency-data"><span class="currency-value">--</span><span class="currency-trend">--</span></div>`, e;
};
u.prototype.currentAsset = function() {
  return F[this.rotIndex % F.length];
};
u.prototype._applyIndex = function(t) {
  this.track && (this.track.style.transition = t ? "" : "none", this.track.style.transform = `translateY(${-this.rotIndex * va}px)`, t || (this.track.offsetHeight, this.track.style.transition = ""));
};
u.prototype.advance = function() {
  const t = this;
  if (this.isDestroyed || !this.track) return;
  const e = F.length;
  this.rotIndex += 1, this._applyIndex(!0), this.element && (this.element.title = this.currentAsset().title), this.rotIndex >= e && (this._resetTimer && clearTimeout(this._resetTimer), this._resetTimer = setTimeout(function() {
    t.isDestroyed || (t.rotIndex = 0, t._applyIndex(!1), t.element && (t.element.title = t.currentAsset().title));
  }, Ca + 60));
};
u.prototype.startRotation = function() {
  const t = this;
  this.isDestroyed || (this.stopRotation(), this._rotTimer = setInterval(function() {
    t.advance();
  }, ba));
};
u.prototype.stopRotation = function() {
  this._rotTimer && (clearInterval(this._rotTimer), this._rotTimer = null), this._resetTimer && (clearTimeout(this._resetTimer), this._resetTimer = null);
};
u.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this._pollTimer && clearInterval(this._pollTimer), this._pollTimer = setInterval(function() {
    document.hidden || t.fetchAll();
  }, this.pollMs));
};
u.prototype.fetchAll = function() {
  for (let t = 0; t < F.length; t++) this.fetchAsset(F[t]);
};
u.prototype.fetchAsset = function(t) {
  const e = this;
  if (this.isDestroyed) return Promise.resolve();
  const s = new AbortController(), n = setTimeout(function() {
    s.abort();
  }, Ea);
  return fetch(t.endpoint, { signal: s.signal, headers: { "Content-Type": "application/json" } }).then(function(i) {
    if (clearTimeout(n), !i.ok) throw new Error("HTTP " + i.status);
    return i.json();
  }).then(function(i) {
    if (e.isDestroyed) return;
    if (!i || !i.ok || !i.data) throw new Error("API_ERROR");
    const r = t.pickVal(i.data), h = t.pickChg(i.data);
    if (r == null) throw new Error("NO_VALUE");
    e.data[t.key] = { value: r, chg: h ?? 0 }, e._renderAsset(t), e.element && (e.element.dataset.status = "ok");
  }).catch(function() {
    clearTimeout(n), !e.isDestroyed && (e.data[t.key] || (e.data[t.key] = null, e._renderAsset(t)));
  });
};
u.prototype._renderAsset = function(t) {
  if (!this.element) return;
  const e = this.data[t.key], s = this.element.querySelectorAll('.cr-slide[data-asset="' + t.key + '"]');
  for (let n = 0; n < s.length; n++) {
    const i = s[n].querySelector(".currency-value"), r = s[n].querySelector(".currency-trend");
    !i || !r || (e ? (i.textContent = t.fmtVal(e.value), r.textContent = $a(e.chg), r.className = "currency-trend " + (e.chg >= 0 ? "positive" : "negative")) : (i.textContent = "--", r.textContent = "--", r.className = "currency-trend"));
  }
};
u.prototype._openCurrent = function() {
  const t = this.currentAsset();
  try {
    sessionStorage.setItem(Da, t.key);
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent("cotacao:asset", { detail: t.key }));
  } catch {
  }
  try {
    window.location.hash = ka;
  } catch {
  }
};
u.prototype.unmount = function() {
  return this.isDestroyed = !0, this.stopRotation(), this._pollTimer && (clearInterval(this._pollTimer), this._pollTimer = null), this.element && (this._onClick && this.element.removeEventListener("click", this._onClick), this._onKey && this.element.removeEventListener("keydown", this._onKey), this._onEnter && this.element.removeEventListener("mouseenter", this._onEnter), this._onLeave && this.element.removeEventListener("mouseleave", this._onLeave), this._onFocus && this.element.removeEventListener("focus", this._onFocus), this._onBlur && this.element.removeEventListener("blur", this._onBlur)), this._onVis && document.removeEventListener("visibilitychange", this._onVis), this.element && (this.element.remove(), this.element = null), this.track = null, Promise.resolve();
};
u.prototype.healthCheck = function() {
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
u.prototype.info = function() {
  return { version: Rs, moduleId: cn, id: Ls, capabilities: ln, mounted: !!this.element, assets: F.map(function(t) {
    return t.key;
  }), rotIndex: this.rotIndex };
};
var Oa = u;
const Ma = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CurrencyRotatorComponent: u,
  MODULE_ID: cn,
  VERSION: Rs,
  capabilities: ln,
  default: Oa,
  id: Ls
}, Symbol.toStringTag, { value: "Module" })), Ir = "5.4.0-ES6", Us = "header.errors-status.api.fetch", un = a({ moduleId: Us });
function hn(t) {
  return un.get(t);
}
const Ta = () => {
  const t = hn("config");
  return t && t.app && t.app.debug || !1;
}, Pa = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), s = hn("logger");
  if (!s) return;
  Ta();
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
  return fetch(t.baseUrl, { method: "GET", headers: { "Content-Type": "application/json" }, signal: e.signal }).then((n) => (clearTimeout(s), n.ok ? (t._metrics.successCount++, n.json()) : (t._metrics.errorCount++, { error_count: 0 }))).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Pa("error", "Failed to fetch errors", n.message), { error_count: 0 }));
};
ne.prototype.healthCheck = function() {
  const t = un.snapshot(), e = { hasBaseUrl: !!this.baseUrl, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, hasLogger: !!hn("logger"), portsInitialized: t._initialized }, s = Object.values(e).filter(Boolean).length;
  return { status: s >= 3 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 4, scoreDisplay: `${s}/4`, checks: e, version: Ir, moduleId: Us, portsInitialized: t._initialized, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
ne.prototype.info = function() {
  const t = un.snapshot();
  return { version: Ir, moduleId: Us, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: t._initialized, healthCheck: this.healthCheck() };
};
ne.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
ne.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Ra = ne;
const jn = "5.1.0-ENTERPRISE", Bn = "header/components/errors-status/core/lifecycle";
let wr = !1, Ye = [];
function La(t, ...e) {
  !wr && t === "debug" || (Ye.push({ level: t, args: e, ts: Date.now() }), Ye.length > 50 && Ye.shift());
}
let Ua = class {
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
        this._metrics.errorCount++, La("error", `Error in ${e}:`, i);
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
    wr = !!e;
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
function xa(t, ...e) {
  !Sr && t === "debug" || (Fe.push({ level: t, args: e, ts: Date.now() }), Fe.length > 50 && Fe.shift());
}
let Ha = class {
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
        xa("error", "Store error:", i);
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
const Ar = "header.errors-status.telemetry.logger", Na = "8.4.0-ES6", We = a({ moduleId: Ar });
function be(t) {
  return We.get(t);
}
let ie = { logs: 0, warns: 0, errors: 0 };
function mt(t) {
  t || (t = {}), this.prefix = t.prefix || "[errors-status]", this.debug = t.debug || !1;
}
mt.prototype.info = function(...t) {
  if (!this.debug) return;
  ie.logs++;
  const e = be("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
mt.prototype.warn = function(...t) {
  ie.warns++;
  const e = be("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
mt.prototype.error = function(...t) {
  ie.errors++;
  const e = be("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
mt.prototype.debug = function(...t) {
  if (!this.debug) return;
  ie.logs++;
  const e = be("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
mt.prototype.getMetrics = () => Object.assign({}, ie);
mt.prototype.resetMetrics = () => {
  ie = { logs: 0, warns: 0, errors: 0 };
};
mt.prototype.healthCheck = function() {
  return { status: We.isInitialized() ? "HEALTHY" : "DEGRADED", version: Na, moduleId: Ar, checks: { loggerReady: !!be("logger"), portsInitialized: We.isInitialized() }, metrics: this.getMetrics(), portsInitialized: We.isInitialized() };
};
const Vn = "5.1.0-ENTERPRISE", Gn = "header/components/errors-status/telemetry/tracker";
let ja = [], Ba = class {
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
    return [...ja];
  }
};
const Yn = "5.1.0-ENTERPRISE", Fn = "header/components/errors-status/core/polling";
let $r = !1, Ke = [];
function za(t, ...e) {
  !$r && t === "debug" || (Ke.push({ level: t, args: e, ts: Date.now() }), Ke.length > 50 && Ke.shift());
}
let qa = class {
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
        this._metrics.errorCount++, za("error", "Execution error:", e);
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
    $r = !!e;
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
const dn = "8.8.0-P1-UARPS", ye = "errors-status", Or = { type: "indicator", reorderable: !1, hideable: !1, critical: !0, rendersUI: !0 }, pt = "header/components/errors-status", Et = a({ moduleId: pt }), Va = () => {
  Et.init();
}, Dt = (t) => Et.get(t), Ga = (t) => Et.inject(t), Ya = () => Et.snapshot();
(function() {
  const e = "/components/header/components/errors-status/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const Fa = (t = {}) => {
  const e = Dt("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:errors-status", source: pt, timestamp: Date.now(), kind: "ui", meta: Object.assign({ label: "Erros do Sistema" }, t) });
}, Wa = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m208.587 54.407-201.17 348.437c-21.073 36.499 5.268 82.122 47.413 82.122h402.34c42.145 0 68.486-45.624 47.413-82.122l-201.17-348.437c-21.072-36.498-73.754-36.498-94.826 0z" fill="#da4a54"/><path d="m54.83 443.76c-6.802 0-10.267-4.242-11.727-6.771s-3.401-7.65 0-13.542l201.17-348.436c3.401-5.891 8.807-6.771 11.727-6.771s8.326.88 11.727 6.771l201.17 348.436c3.401 5.891 1.46 11.013 0 13.541-1.46 2.529-4.925 6.771-11.727 6.771h-402.34z" fill="#f6e266"/><g fill="#544f57"><path d="m256 327.138c-14.379 0-26.036-11.657-26.036-26.036v-119.216c0-14.379 11.657-26.036 26.036-26.036 14.379 0 26.036 11.657 26.036 26.036v119.217c0 14.379-11.657 26.035-26.036 26.035z"/><circle cx="256" cy="381.152" r="26.036"/></g></svg>';
function U(t) {
  t = t || {}, this.container = t.container, this.store = new Ha({ errorCount: 0, status: "loading" }), this.eventBus = Dt("eventBus"), this.lifecycle = new Ua(this);
  const e = Dt("config");
  this.logger = new mt({ prefix: "[Errors]", debug: e && e.app && e.app.debug }), this.telemetry = new Ba(), this.api = new Ra(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
U.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Va(), this.lifecycle.mount().then(() => (t.render(), t.fetchErrors())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Dt("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: ye, moduleId: pt, timestamp: Date.now() });
  }));
};
U.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "errors-status-component", this.element.title = "Erros do Sistema", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-errors-status"), this.element.innerHTML = `<div class="errors-icon">${Wa}</div><span class="errors-badge">0</span>`, this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), Fa({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().errorCount : 0 });
  }), this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
U.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".errors-badge");
  t.errorCount !== null ? (this.element.dataset.count = String(t.errorCount), this.element.dataset.status = t.errorCount > 0 ? "has-errors" : "ok", e.textContent = t.errorCount > 99 ? "99+" : t.errorCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
U.prototype.fetchErrors = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchErrors().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ errorCount: e.error_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Dt("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: ye, moduleId: pt, data: { errorCount: e.error_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
U.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new qa({ interval: 3e4 }), this.polling.onPoll(() => t.fetchErrors()), this.polling.start());
};
U.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Dt("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: ye, moduleId: pt, timestamp: Date.now() });
  });
};
U.prototype.healthCheck = function() {
  const t = Dt("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Et.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Et.isInitialized(), version: dn, moduleId: pt };
};
U.prototype.info = function() {
  return { version: dn, moduleId: pt, id: ye, capabilities: Or, portsInitialized: Et.isInitialized(), mounted: !!this.element, errorCount: this.store.getState().errorCount, metrics: this._metrics };
};
var Ka = U;
const Ja = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorsStatusComponent: U,
  MODULE_ID: pt,
  VERSION: dn,
  capabilities: Or,
  default: Ka,
  getPorts: Ya,
  id: ye,
  injectPorts: Ga
}, Symbol.toStringTag, { value: "Module" })), Mr = "header-components-navigation-helper";
a({ moduleId: Mr });
function D(t, e) {
  return t ? pa({
    route: t,
    source: e || Mr
  }) : !1;
}
const Tr = "6.2.0-ES6", Ce = "header.notifications.api.fetch", As = a({ moduleId: Ce });
function Pr(t) {
  return As.get(t);
}
function Qt(t, ...e) {
  const s = Pr("logger");
  s && s[t] && s[t](...[`[${Ce}]`].concat(e));
}
function Fs(t, e) {
  try {
    const s = Pr("telemetry");
    s && s.track && s.track(`${Ce}:${t}`, e || {});
  } catch {
  }
}
function Za(t) {
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
    const r = Za(i);
    return r.isAuthError ? (t._metrics.authErrors++, Qt("info", "Auth required for notifications", { status: r.status }), Fs("auth-required", { status: r.status }), te("auth-required")) : r.isContractViolation ? (t._metrics.contractViolations++, Qt("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${r.contentType}`, { url: n, status: r.status }), Fs("contract-violation", { contentType: r.contentType, status: r.status, url: n }), te("contract-violation")) : !r.ok && r.isJson ? i.json().then((h) => (Qt("warn", "API returned error", { status: r.status, error: h.error || "unknown" }), te("api-error"))) : r.ok ? (t._metrics.successCount++, i.json()) : (t._metrics.errorCount++, Qt("error", "Request failed with non-JSON response", { status: r.status, contentType: r.contentType }), te("http-error"));
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
    version: Tr,
    moduleId: Ce,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
Gt.prototype.info = function() {
  return {
    version: Tr,
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
var Xa = Gt;
const Wn = "5.1.0-ENTERPRISE", Kn = "header/components/notifications/core/lifecycle";
let Rr = !1, Je = [];
function Qa(t, ...e) {
  !Rr && t === "debug" || (Je.push({ level: t, args: e, ts: Date.now() }), Je.length > 50 && Je.shift());
}
let tc = class {
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
        this._metrics.errorCount++, Qa("error", `Hook ${e} error:`, n);
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
    Rr = !!e;
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
const Jn = "5.1.0-ENTERPRISE", Zn = "header/components/notifications/state/store";
let Lr = !1, Ze = [];
function ec(t, ...e) {
  !Lr && t === "debug" || (Ze.push({ level: t, args: e, ts: Date.now() }), Ze.length > 50 && Ze.shift());
}
let sc = class {
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
        ec("error", "Subscriber error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Jn, moduleId: Zn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Jn, moduleId: Zn, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Lr = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ze];
  }
};
const Ur = "header.notifications.telemetry.logger", nc = "8.4.0-ES6", Xe = a({ moduleId: Ur });
function ve(t) {
  return Xe.get(t);
}
let re = { logs: 0, warns: 0, errors: 0 };
function ft(t) {
  t || (t = {}), this.prefix = t.prefix || "[notifications]", this.debug = t.debug || !1;
}
ft.prototype.info = function(...t) {
  if (!this.debug) return;
  re.logs++;
  const e = ve("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
ft.prototype.warn = function(...t) {
  re.warns++;
  const e = ve("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
ft.prototype.error = function(...t) {
  re.errors++;
  const e = ve("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
ft.prototype.debug = function(...t) {
  if (!this.debug) return;
  re.logs++;
  const e = ve("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
ft.prototype.getMetrics = () => Object.assign({}, re);
ft.prototype.resetMetrics = () => {
  re = { logs: 0, warns: 0, errors: 0 };
};
ft.prototype.healthCheck = function() {
  return { status: Xe.isInitialized() ? "HEALTHY" : "DEGRADED", version: nc, moduleId: Ur, checks: { loggerReady: !!ve("logger"), portsInitialized: Xe.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Xe.isInitialized() };
};
const Xn = "5.1.0-ENTERPRISE", Qn = "header/components/notifications/telemetry/tracker";
let ic = [], rc = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Xn, moduleId: Qn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Xn, moduleId: Qn, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...ic];
  }
};
const ti = "5.1.0-ENTERPRISE", ei = "header/components/notifications/core/polling";
let xr = !1, Qe = [];
function oc(t, ...e) {
  !xr && t === "debug" || (Qe.push({ level: t, args: e, ts: Date.now() }), Qe.length > 50 && Qe.shift());
}
let ac = class {
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
          this._metrics.errorCount++, oc("error", "Poll error:", s);
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
    xr = !!e;
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
const mn = "10.4.0-FASE-B", Ee = "notifications", Hr = { type: "indicator", reorderable: !0, hideable: !1, critical: !0, rendersUI: !0 }, x = "header/components/notifications", cc = "#/notificacoes", kt = a({ moduleId: x }), lc = () => {
  kt.init();
}, L = (t) => kt.get(t), uc = (t) => kt.inject(t), hc = () => kt.snapshot();
function dc() {
  const t = L("globalState");
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
const mc = (t = {}) => {
  const e = L("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:notifications", source: x, timestamp: Date.now(), kind: "ui", meta: Object.assign({ label: "Notificações" }, t) });
}, pc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M29.07 26.74 27 20.733V16a9.008 9.008 0 0 0-6-8.475V6a3 3 0 0 0-6 0v1.525A9.008 9.008 0 0 0 9 16v4.574l-2.285 6.285A2.339 2.339 0 0 0 8.914 30h5.228a3.981 3.981 0 0 0 7.716 0h5.06a2.34 2.34 0 0 0 2.152-3.26zM17 7V6a1 1 0 0 1 2 0v1zm1 24a1.993 1.993 0 0 1-1.722-1h3.444A1.993 1.993 0 0 1 18 31zm9.2-3.156a.334.334 0 0 1-.287.156h-18a.34.34 0 0 1-.32-.457L11 20.926V16a7 7 0 0 1 14 0v5.068l2.193 6.363.036.088a.335.335 0 0 1-.024.325z" fill="currentColor"/></svg>';
function H(t) {
  t = t || {}, this.container = t.container, this.store = new sc({ unreadCount: 0, status: "loading" }), this.eventBus = L("eventBus"), this.lifecycle = new tc(this);
  const e = L("config");
  this.logger = new ft({ prefix: "[Notifications]", debug: e && e.app && e.app.debug }), this.telemetry = new rc(), this.api = new Xa(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
H.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (lc(), this.lifecycle.mount().then(() => (t.render(), t.fetchNotifications())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = L("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Ee, moduleId: x, timestamp: Date.now() });
  }));
};
H.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "notifications-component", this.element.title = "Notificações", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-notifications"), this.element.innerHTML = `<div class="notifications-icon">${pc}</div><span class="notifications-badge">0</span>`, this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), mc({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 }), D(cc, x);
  }), this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
H.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".notifications-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
H.prototype.fetchNotifications = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchNotifications().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = L("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Ee, moduleId: x, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
H.prototype.startPolling = function() {
  const t = this;
  if (this.isDestroyed) return;
  if (!dc()) {
    const s = L("logger");
    s && s.info && s.info(`[${x}] Polling skipped: not authenticated (expected on login)`);
    return;
  }
  this.polling = new ac({ interval: 3e4 }), this.polling.onPoll(() => t.fetchNotifications()), this.polling.start();
};
H.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = L("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Ee, moduleId: x, timestamp: Date.now() });
  });
};
H.prototype.healthCheck = function() {
  const t = L("eventBus"), e = L("globalState"), s = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: kt.isInitialized(), portsGlobalStateAvailable: !!e }, n = Object.values(s).filter(Boolean).length, i = Object.keys(s).length;
  return { status: n === i ? "HEALTHY" : n >= i - 2 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: i, checks: s, portsInitialized: kt.isInitialized(), version: mn, moduleId: x };
};
H.prototype.info = function() {
  return { version: mn, moduleId: x, id: Ee, capabilities: Hr, portsInitialized: kt.isInitialized(), mounted: !!this.element, unreadCount: this.store.getState().unreadCount, metrics: this._metrics };
};
var fc = H;
const gc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: x,
  NotificationsComponent: H,
  VERSION: mn,
  capabilities: Hr,
  default: fc,
  getPorts: hc,
  id: Ee,
  injectPorts: uc
}, Symbol.toStringTag, { value: "Module" })), si = "5.1.0-ENTERPRISE", ni = "header/components/real-time-clock/core/lifecycle";
let Nr = !1, ts = [];
function _c(t, ...e) {
  !Nr && t === "debug" || (ts.push({ level: t, args: e, ts: Date.now() }), ts.length > 50 && ts.shift());
}
let bc = class {
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
        this._metrics.errorCount++, _c("error", `Hook ${e} error:`, n);
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
    Nr = !!e;
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
let jr = !1, es = [];
function yc(t, ...e) {
  !jr && t === "debug" || (es.push({ level: t, args: e, ts: Date.now() }), es.length > 50 && es.shift());
}
let Cc = class {
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
        yc("error", "Subscriber error:", i);
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
    this._debug = !!e, jr = !!e;
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
const Br = "header.real-time-clock.telemetry.logger", vc = "8.4.0-ES6", ss = a({ moduleId: Br });
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
  return { status: ss.isInitialized() ? "HEALTHY" : "DEGRADED", version: vc, moduleId: Br, checks: { loggerReady: !!De("logger"), portsInitialized: ss.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ss.isInitialized() };
};
const oi = "5.1.0-ENTERPRISE", ai = "header/components/real-time-clock/telemetry/tracker";
let Ec = [], Dc = class {
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
    return [...Ec];
  }
};
const pn = "8.6.0-ES6", xs = "real-time-clock", zr = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, oe = "header/components/real-time-clock", It = a({ moduleId: oe });
function kc() {
  It.init();
}
function _e(t) {
  return It.get(t);
}
function Ic(t) {
  return It.inject(t);
}
function wc() {
  return It.snapshot();
}
(function() {
  const e = "/components/header/components/real-time-clock/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function it(t) {
  t = t || {}, this.container = t.container, this.store = new Cc({ time: "" }), this.eventBus = _e("eventBus"), this.lifecycle = new bc(this);
  const e = _e("config");
  this.logger = new Yt({ prefix: "[Clock]", debug: e && e.app && e.app.debug }), this.telemetry = new Dc(), this.element = null, this.isDestroyed = !1, this.intervalId = null, this.unsubscribe = null, this._metrics = { mountCount: 0, tickCount: 0, lastMountAt: null };
}
it.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (kc(), this.lifecycle.mount().then(() => {
    t.render(), t.startClock(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = _e("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: xs, moduleId: oe, timestamp: Date.now() });
  }));
};
it.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "real-time-clock-component", this.element.dataset.status = "ok", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-real-time-clock"), this.element.innerHTML = '<span class="clock-time">--:--</span>', this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
it.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".clock-time");
  e && (e.textContent = t.time);
};
it.prototype.startClock = function() {
  const t = this, e = () => {
    if (t.isDestroyed) return;
    const n = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    t.store.setState({ time: n }), t._metrics.tickCount++;
  };
  e(), this.intervalId = setInterval(e, 1e3);
};
it.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.intervalId && (clearInterval(t.intervalId), t.intervalId = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = _e("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: xs, moduleId: oe, timestamp: Date.now() });
  });
};
it.prototype.healthCheck = function() {
  const t = _e("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, clockRunning: !!this.intervalId, portsInitialized: It.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: It.isInitialized(), version: pn, moduleId: oe };
};
it.prototype.info = function() {
  return { version: pn, moduleId: oe, id: xs, capabilities: zr, portsInitialized: It.isInitialized(), mounted: !!this.element, time: this.store.getState().time, metrics: this._metrics };
};
var Sc = it;
const Ac = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: oe,
  RealTimeClockComponent: it,
  VERSION: pn,
  capabilities: zr,
  default: Sc,
  getPorts: wc,
  id: xs,
  injectPorts: Ic
}, Symbol.toStringTag, { value: "Module" })), qr = "6.2.0-NONFATAL-WARN", Hs = "header.weather-sp.api.fetch", $s = a({ moduleId: Hs });
function $c(t) {
  return $s.get(t);
}
function ci(t, ...e) {
  const s = $c("logger");
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
function Oc(t) {
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
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Oc(n) ? (ci("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), li("timeout")) : (ci("warn", "Fetch failed (non-fatal)", { error: n.message }), li("error"))));
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
    version: qr,
    moduleId: Hs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
ae.prototype.info = function() {
  return {
    version: qr,
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
var Mc = ae;
const ui = "5.1.0-ENTERPRISE", hi = "header/components/weather-sp/core/lifecycle";
let Vr = !1, ns = [];
function Tc(t, ...e) {
  !Vr && t === "debug" || (ns.push({ level: t, args: e, ts: Date.now() }), ns.length > 50 && ns.shift());
}
let Pc = class {
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
        this._metrics.errorCount++, Tc("error", `Hook ${e} error:`, n);
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
    Vr = !!e;
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
let Gr = !1, is = [];
function Rc(t, ...e) {
  !Gr && t === "debug" || (is.push({ level: t, args: e, ts: Date.now() }), is.length > 50 && is.shift());
}
let Lc = class {
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
        Rc("error", "Subscriber error:", i);
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
    Gr = !!e;
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
const Yr = "header.weather-sp.telemetry.logger", Uc = "2.3.0-ES6", rs = a({ moduleId: Yr });
function Ie(t) {
  return rs.get(t);
}
let we = { logs: 0, warns: 0, errors: 0 };
function Ft(t) {
  t || (t = {}), this.prefix = t.prefix || "[weather-sp]", this.debug = t.debug || !1;
}
Ft.prototype.info = function() {
  if (!this.debug) return;
  we.logs++;
  const t = Ie("logger");
  t && t.info ? t.info.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments))) : t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.warn = function() {
  we.warns++;
  const t = Ie("logger");
  t && t.warn && t.warn.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.error = function() {
  we.errors++;
  const t = Ie("logger");
  t && t.error && t.error.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.debug = function() {
  if (!this.debug) return;
  we.logs++;
  const t = Ie("logger");
  t && t.debug && t.debug.apply(t, [this.prefix].concat(Array.prototype.slice.call(arguments)));
};
Ft.prototype.getMetrics = () => Object.assign({}, we);
Ft.prototype.healthCheck = function() {
  return { status: rs.isInitialized() ? "HEALTHY" : "DEGRADED", version: Uc, moduleId: Yr, checks: { loggerReady: !!Ie("logger"), portsInitialized: rs.isInitialized() }, metrics: this.getMetrics(), portsInitialized: rs.isInitialized() };
};
const pi = "5.1.0-ENTERPRISE", fi = "header/components/weather-sp/telemetry/tracker";
let xc = [], Hc = class {
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
    return [...xc];
  }
};
const gi = "5.1.0-ENTERPRISE", _i = "header/components/weather-sp/core/polling";
let Fr = !1, os = [];
function Nc(t, ...e) {
  !Fr && t === "debug" || (os.push({ level: t, args: e, ts: Date.now() }), os.length > 50 && os.shift());
}
let jc = class {
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
          this._metrics.errorCount++, Nc("error", "Poll error:", s);
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
    Fr = !!e;
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
const fn = "9.7.0-P1-UARPS", Se = "weather-sp", Wr = { type: "indicator", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, gt = "header/components/weather-sp", wt = a({ moduleId: gt }), Bc = () => {
  wt.init();
}, St = (t) => wt.get(t), zc = (t) => wt.inject(t), qc = () => wt.snapshot(), Vc = (t = {}) => {
  const e = St("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:weather-sp", source: gt, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/weather-sp/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const ge = { sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>', cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>', cloudRain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>', moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' }, Gc = (t, e = !0) => t === 0 ? e ? ge.sun : ge.moon : t >= 1 && t <= 48 ? ge.cloud : ge.cloudRain;
function N(t) {
  t = t || {}, this.container = t.container, this.store = new Lc({ temp: null, code: 0, isDay: !0, status: "loading" }), this.eventBus = St("eventBus"), this.lifecycle = new Pc(this);
  const e = St("config");
  this.logger = new Ft({ prefix: "[Weather]", debug: e && e.app && e.app.debug }), this.telemetry = new Hc(), this.api = new Mc(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
N.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Bc(), this.lifecycle.mount().then(() => (t.render(), t.fetchWeather())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = St("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Se, moduleId: gt, timestamp: Date.now() });
  }));
};
N.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "weather-sp-component", this.element.title = "Clima São Paulo", this.element.dataset.status = "loading", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-weather-sp"), this.element.innerHTML = `<div class="weather-icon">${ge.sun}</div><span class="weather-temp">--°C</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Vc({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().temp : null });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
N.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".weather-icon"), s = this.element.querySelector(".weather-temp");
  t.temp !== null ? (e.innerHTML = Gc(t.code, t.isDay), s.textContent = `${Math.round(t.temp)}°C`, this.element.dataset.status = "ok") : (s.textContent = "--°C", this.element.dataset.status = "offline");
};
N.prototype.fetchWeather = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchWeather().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ temp: e.temperature, code: e.weathercode || 0, isDay: e.is_day !== 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = St("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Se, moduleId: gt, data: { temp: e.temperature }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
N.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling && (this.polling.stop(), this.polling = null), this.polling = new jc({ interval: 3e5 }), this.polling.onPoll(() => t.fetchWeather()), this.polling.start());
};
N.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = St("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Se, moduleId: gt, timestamp: Date.now() });
  });
};
N.prototype.healthCheck = function() {
  const t = St("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: wt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: wt.isInitialized(), version: fn, moduleId: gt };
};
N.prototype.info = function() {
  return { version: fn, moduleId: gt, id: Se, capabilities: Wr, portsInitialized: wt.isInitialized(), mounted: !!this.element, temp: this.store.getState().temp, metrics: this._metrics };
};
var Yc = N;
const Fc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: gt,
  VERSION: fn,
  WeatherSpComponent: N,
  capabilities: Wr,
  default: Yc,
  getPorts: qc,
  id: Se,
  injectPorts: zc
}, Symbol.toStringTag, { value: "Module" })), Wc = "header/components/user-menu.core.ports", Ae = a({ moduleId: Wc });
function Kc() {
  Ae.init();
}
function dt(t) {
  return Ae.get(t);
}
function Jc(t) {
  return Ae.inject(t);
}
function Zc() {
  return Ae.snapshot();
}
function Ws() {
  return Ae.isInitialized();
}
const Xc = {
  redirect(t, e, s) {
    const n = dt("eventBus");
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
  return dt("hardNavService") || Xc;
}
function Qc() {
  const t = "/components/header/components/user-menu/component.css";
  if (!document.querySelector(`link[href="${t}"]`)) {
    const e = document.createElement("link");
    e.rel = "stylesheet", e.href = t, document.head.appendChild(e);
  }
}
const _n = "header.user-menu.core.actions", Kr = a({ moduleId: _n });
let bi = !1;
function Jr() {
  bi || (Kr.init(), bi = !0);
}
function tl(t) {
  return Jr(), Kr.get(t);
}
function el() {
  var e, s;
  Jr();
  const t = tl("eventBus");
  if (t) return t;
  if (typeof window < "u" && ((s = (e = window.Core) == null ? void 0 : e.windowAdapter) != null && s.get)) {
    const n = window.Core.windowAdapter.get("EventBus");
    if (n) return n;
  }
  return null;
}
const ee = { id: "user-menu", label: "Menu do Usuário", icon: "user", kind: "ui" }, sl = {
  profile: "#/meu-perfil",
  preferences: "#/preferencias",
  security: "#/seguranca-conta",
  notifications: "#/notificacoes",
  sessions: "#/sessoes-ativas"
};
function nl(t, e) {
  return D(t, e);
}
function Ns(t, e) {
  e || (e = {});
  const s = el();
  !s || !s.emit || s.emit(E.ACTION, { actionId: `header:${ee.id}:${t}`, source: _n, timestamp: Date.now(), meta: Object.assign({ label: ee.label, icon: ee.icon, kind: ee.kind }, e) });
}
function il(t, e) {
  const s = e.logger, n = e.store, i = e.onLogout;
  if (n.setState({ isOpen: !1 }), s && s.debug && s.debug(`Action: ${t}`), t === "logout" && i) {
    i();
    return;
  }
  Ns(t, { action: t });
  const r = sl[t];
  r && nl(r, _n);
}
function rl(t, ...e) {
}
function ol(t, e) {
  e.preventDefault(), e.stopPropagation(), t.toggleMenu();
}
function al(t, e) {
  t.isDestroyed || !t.element || !t.dropdown || !t.element.contains(e.target) && !t.dropdown.contains(e.target) && t.store.getState().isOpen && (Ns("close-outside", {}), t.store.setState({ isOpen: !1 }), t._announce("Menu fechado"));
}
function cl(t, e) {
  const s = t.dropdown.querySelectorAll(".dropdown-item");
  if (s.length === 0) return;
  let n = -1;
  const i = document.activeElement;
  for (let h = 0; h < s.length; h++)
    if (s[h] === i) {
      n = h;
      break;
    }
  let r = n + e;
  r < 0 && (r = s.length - 1), r >= s.length && (r = 0), s[r].focus(), t._announce(s[r].textContent.trim());
}
function ll(t, e) {
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
    e.preventDefault(), cl(t, e.key === "ArrowDown" ? 1 : -1), t._metrics.keyboardNavigationCount++;
    return;
  }
  if (e.key === "Tab" && s.isOpen) {
    const n = t.dropdown.querySelector(".dropdown-item:last-of-type"), i = t.dropdown.querySelector(".dropdown-item:first-of-type");
    (!e.shiftKey && e.target === n || e.shiftKey && e.target === i) && (t.toggleMenu(), t._announce("Menu fechado"));
  }
}
function ul(t) {
  t.shortcuts.register("Escape", () => {
    t.store.getState().isOpen && (t.toggleMenu(), t._announce("Menu fechado"));
  }), document.addEventListener("keydown", t.boundHandleKeydown);
}
function hl(t) {
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
  }), rl("debug", `Tooltips configurados para ${e.length} itens`);
}
function dl(t) {
  const e = t.element.querySelector(".user-menu-trigger");
  e && e.addEventListener("click", t.boundHandleTriggerClick), t.dropdown.addEventListener("click", (s) => {
    const n = s.target.closest("[data-action]");
    if (!n) return;
    s.stopPropagation();
    const i = n.dataset.action;
    t._announce(`Ação selecionada: ${n.textContent.trim()}`), il(i, {
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
function ml(t) {
  const e = t.element ? t.element.querySelector(".user-menu-trigger") : null;
  e && e.removeEventListener("click", t.boundHandleTriggerClick), document.removeEventListener("click", t.boundHandleClickOutside), document.removeEventListener("keydown", t.boundHandleKeydown), window.removeEventListener("resize", t.boundUpdateDropdownPosition), window.removeEventListener("scroll", t.boundUpdateDropdownPosition, !0);
}
const yi = "5.1.0-ENTERPRISE", Ci = "header/components/user-menu/state/validators";
let pl = [];
class Zr {
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
    return [...pl];
  }
}
const vi = "5.1.0-ENTERPRISE", Ei = "header/components/user-menu/utils/formatters";
let fl = [];
class gl {
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
    return { status: s === 1 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 1, scoreDisplay: `${s}/1`, checks: e, version: vi, moduleId: Ei, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: vi, moduleId: Ei, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...fl];
  }
}
const _l = '[data-aviso-erro="user-menu"]', bl = 1e4;
function Xr(t) {
  !t || typeof t.querySelectorAll != "function" || t.querySelectorAll(_l).forEach((e) => e.remove());
}
function yl(t, e, s = bl) {
  if (!t || !e || !t.ownerDocument) return null;
  Xr(t);
  const n = t.ownerDocument, i = n.defaultView, h = (t.querySelector(".user-menu-trigger") || t).getBoundingClientRect(), I = i ? i.innerWidth : 0, l = n.createElement("div");
  return l.className = "user-menu-aviso-erro", l.setAttribute("data-aviso-erro", "user-menu"), l.setAttribute("aria-hidden", "true"), l.setAttribute("title", "Fechar"), l.textContent = e, l.style.cssText = [
    "position:fixed",
    `top:${Math.round(h.bottom + 8)}px`,
    `right:${Math.max(8, Math.round(I - h.right))}px`,
    "z-index:100000",
    "max-width:320px",
    "padding:10px 14px",
    "border-radius:10px",
    "border:1px solid rgba(255,95,95,0.55)",
    "background:#2a1416",
    "color:#ffd6d6",
    "font-size:13px",
    "font-weight:500",
    "line-height:1.4",
    "box-shadow:0 8px 24px rgba(0,0,0,0.35)",
    "cursor:pointer",
    "white-space:normal"
  ].join(";"), l.addEventListener("click", () => l.remove()), t.appendChild(l), s > 0 && setTimeout(() => l.remove(), s), l;
}
const Ks = "header/components/user-menu";
function Qr(t) {
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
    roleDisplay: gl.formatRole(t.role),
    // @ts-expect-error TS migration - TS2339
    funcao: t.funcao,
    // @ts-expect-error TS migration - TS2339
    departamento: t.departamento
  } : null;
}
function to(t) {
  return t.isDestroyed ? Promise.resolve() : (t._metrics.fetchCount++, t.circuitBreaker.execute(() => t.api.fetchCurrentUser()).then((e) => {
    if (!t.isDestroyed)
      if (e) {
        try {
          Zr.validateUser(e);
        } catch (s) {
          t._log("warn", "User validation warning:", s.message);
        }
        t.store.setState({
          user: Qr(e),
          status: "ok"
        }), t._log("debug", "Usuário carregado:", e.name);
      } else
        t.store.setState({ user: null, status: "guest" }), t._log("debug", "Nenhum usuário autenticado");
  }).catch((e) => {
    t.isDestroyed || (t.store.setState({ user: null, status: "error" }), t._log("warn", `Erro no fetch (Circuit Breaker state: ${t.circuitBreaker.getState()}):`, e));
  }));
}
function eo(t, e) {
  if (!t.isDestroyed)
    if (t._metrics.setUserCount++, t._metrics.lastSetUserAt = Date.now(), e) {
      try {
        Zr.validateUser(e);
      } catch (n) {
        t._log("warn", "User validation warning:", n.message);
      }
      t.store.setState({
        user: Qr(e),
        status: "ok"
      }), t._log("info", "Estado atualizado via setUser:", e.name), t._announce(`Usuário atualizado: ${e.name || "Usuário"}`);
      const s = dt("eventBus");
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
function so(t) {
  eo(t, null);
}
const Di = "Erro ao sair. Tente novamente.";
function Cl(t) {
  return t.isDestroyed ? Promise.resolve() : (t._announce("Saindo da conta..."), Xr(t.element), t.circuitBreaker.execute(() => t.api.logout()).then((e) => {
    if (!e) throw new Error("logout não confirmado pelo servidor");
    Ns("logout", { confirmed: !0 });
    const s = dt("eventBus");
    s && s.emit && s.emit(E.ACTION, {
      action: "logout",
      source: Ks,
      timestamp: Date.now()
    }), so(t), gn().redirect("/login", "logout", Ks);
  }).catch((e) => {
    t._log("error", "Erro logout:", e), t._announce(Di), yl(t.element, Di);
  }));
}
const no = "17.3.0-MODULAR", vl = "user-menu", io = "header/components/user-menu";
function El(t) {
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
    version: no,
    moduleId: io,
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
function Dl(t) {
  return {
    id: vl,
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
    version: no,
    moduleId: io,
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
const ro = "7.8.0-NONFATAL-WARN", js = "header.user-menu.api.fetch", Os = a({ moduleId: js });
function kl(t) {
  return Os.get(t);
}
function Y(t, ...e) {
  const s = kl("logger");
  s && s[t] && s[t].apply(s, [`[${js}]`].concat(e));
}
function rt(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api", this.timeout = t.timeout || 1e4, this._csrfToken = null, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
rt.prototype.fetchCurrentUser = function() {
  const t = this;
  return t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now(), fetch("/api/auth/check.php", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }).then((e) => {
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return e.json();
  }).then((e) => {
    const s = e.data || e, n = s.session || e.session;
    if (!e.ok || !s.authenticated || !s.user)
      return Y("debug", "User not authenticated"), t._metrics.errorCount++, null;
    n && n.csrf_token && (t._csrfToken = n.csrf_token, Y("debug", "CSRF token stored"));
    const i = s.user;
    return t._metrics.successCount++, Y("debug", "User loaded:", i.name), {
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
  }).catch((e) => (t._metrics.errorCount++, Y("warn", "fetchCurrentUser error:", e.message), null));
};
rt.prototype.logout = function() {
  const t = this;
  return t._metrics.requestCount++, t._metrics.lastRequestAt = Date.now(), fa().then((e) => (e.ok ? t._metrics.successCount++ : (t._metrics.errorCount++, Y("warn", "Logout não confirmado pelo servidor:", e.motivo)), e.ok));
};
rt.prototype.get = function(t) {
  const e = this;
  e._metrics.requestCount++, e._metrics.lastRequestAt = Date.now();
  const s = new AbortController(), n = setTimeout(() => {
    s.abort();
  }, e.timeout);
  return fetch(e.baseURL + t, { signal: s.signal, credentials: "include", headers: { "Content-Type": "application/json" } }).then((i) => {
    if (clearTimeout(n), !i.ok) throw new Error(`HTTP ${i.status}`);
    return e._metrics.successCount++, Y("debug", "GET success:", t), i.json();
  }).catch((i) => (clearTimeout(n), e._metrics.errorCount++, Y("warn", "GET failed (non-fatal)", { endpoint: t, error: i.message }), null));
};
rt.prototype.post = function(t, e) {
  const s = this;
  e || (e = {}), s._metrics.requestCount++, s._metrics.lastRequestAt = Date.now();
  const n = new AbortController(), i = setTimeout(() => {
    n.abort();
  }, s.timeout);
  return fetch(s.baseURL + t, { method: "POST", signal: n.signal, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) }).then((r) => {
    if (clearTimeout(i), !r.ok) throw new Error(`HTTP ${r.status}`);
    return s._metrics.successCount++, Y("debug", "POST success:", t), r.json();
  }).catch((r) => (clearTimeout(i), s._metrics.errorCount++, Y("warn", "POST failed (non-fatal)", { endpoint: t, error: r.message }), null));
};
rt.prototype.healthCheck = function() {
  const t = { hasEndpoint: !!this.baseURL, hasCsrf: !!this._csrfToken, goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5, portsInitialized: Os.isInitialized() }, e = Object.values(t).filter(Boolean).length;
  return { status: e >= 3 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 4, scoreDisplay: `${e}/4`, checks: t, portsInitialized: Os.isInitialized(), version: ro, moduleId: js, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
rt.prototype.info = function() {
  return { version: ro, moduleId: js, baseURL: this.baseURL, hasCsrf: !!this._csrfToken, metrics: this._metrics, portsInitialized: Os.isInitialized(), healthCheck: this.healthCheck() };
};
rt.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
rt.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
var Il = rt;
const ki = "5.1.0-ENTERPRISE", Ii = "header/components/user-menu/core/lifecycle";
let oo = !1, as = [];
function wl(t, ...e) {
  !oo && t === "debug" || (as.push({ level: t, args: e, ts: Date.now() }), as.length > 50 && as.shift());
}
let Sl = class {
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
        this._metrics.errorCount++, wl("error", `Error in ${e}:`, i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ki, moduleId: Ii, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ki, moduleId: Ii, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    oo = !!e;
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
const wi = "5.1.0-ENTERPRISE", Si = "header/components/user-menu/state/store";
let ao = !1, cs = [];
function Al(t, ...e) {
  !ao && t === "debug" || (cs.push({ level: t, args: e, ts: Date.now() }), cs.length > 50 && cs.shift());
}
let $l = class {
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
        Al("error", "Store error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: wi, moduleId: Si, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: wi, moduleId: Si, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, ao = !!e;
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
const co = "header.user-menu.telemetry.logger", Ol = "8.4.0-ES6", ls = a({ moduleId: co });
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
  return { status: ls.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ol, moduleId: co, checks: { loggerReady: !!$e("logger"), portsInitialized: ls.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ls.isInitialized() };
};
const Ai = "5.1.0-ENTERPRISE", $i = "header/components/user-menu/telemetry/tracker";
let Ml = [], Tl = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ai, moduleId: $i, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ai, moduleId: $i, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Ml];
  }
};
const vt = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
}, Oi = ["#4F6D7A", "#5D6B7A", "#6B5D7A", "#5D7A6B", "#7A6B5D", "#5D6A7A", "#6A5D6B", "#5D7A7A"];
function Pl(t) {
  return Oi[Number(t || 0) % Oi.length];
}
function Rl(t) {
  if (!t) return "?";
  const e = t.trim().split(" ").filter(Boolean);
  return e.length >= 2 ? (e[0][0] + e[e.length - 1][0]).toUpperCase() : t.substring(0, 2).toUpperCase();
}
function Ll() {
  return `<button class="user-menu-trigger" aria-haspopup="true" aria-expanded="false" data-uarps-trigger="trigger:header:user-menu"><div class="user-avatar" aria-hidden="true"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><span class="user-name">...</span><span class="user-chevron">${vt.chevron}</span></button>`;
}
function Ul() {
  return `<div class="dropdown-header"><div class="user-avatar-large"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><div class="user-info"><span class="user-name-full">Carregando...</span><span class="user-role">---</span></div></div><div class="dropdown-divider"></div><button class="dropdown-item" role="menuitem" data-action="profile" data-uarps-trigger="trigger:header:profile"><span class="item-icon">${vt.user}</span>Meu Perfil</button><button class="dropdown-item" role="menuitem" data-action="preferences" data-uarps-trigger="trigger:header:preferences"><span class="item-icon">${vt.settings}</span>Minhas Preferências</button><button class="dropdown-item" role="menuitem" data-action="security" data-uarps-trigger="trigger:header:security"><span class="item-icon">${vt.shield}</span>Segurança da Conta</button><button class="dropdown-item" role="menuitem" data-action="notifications" data-uarps-trigger="trigger:header:notifications"><span class="item-icon">${vt.bell}</span>Notificações</button><button class="dropdown-item" role="menuitem" data-action="sessions" data-uarps-trigger="trigger:header:sessions"><span class="item-icon">${vt.monitor}</span>Sessões Ativas</button><div class="dropdown-divider"></div><button class="dropdown-item logout" role="menuitem" data-action="logout" data-uarps-trigger="trigger:header:logout"><span class="item-icon">${vt.logout}</span>Sair</button>`;
}
function lo(t, e) {
  if (!t || !e) return;
  const s = t.querySelector(".user-menu-trigger");
  if (!s) return;
  const n = s.getBoundingClientRect();
  e.style.position = "fixed", e.style.top = `${n.bottom + 8}px`, e.style.left = "8px", e.style.right = "auto";
}
function xl(t, e, s) {
  if (!t || !e) return;
  const n = t.querySelector(".user-avatar"), i = t.querySelector(".avatar-img"), r = t.querySelector(".avatar-initials"), h = e.querySelector(".user-avatar-large"), I = e.querySelector(".avatar-img"), l = e.querySelector(".avatar-initials"), lt = t.querySelector(".user-name"), ut = e.querySelector(".user-name-full"), da = e.querySelector(".user-role"), ma = t.querySelector(".user-menu-trigger");
  if (s.user) {
    const Xt = Rl(s.user.name || s.user.fullName), me = s.user.avatar_url || s.user.avatar, Un = me && me.length > 0 && !me.includes("default"), xn = Pl(s.user.id);
    Un ? (i.src = me, i.style.display = "block", r.style.display = "none") : (i.style.display = "none", r.style.display = "flex", r.textContent = Xt, n.style.background = xn), Un ? (I.src = me, I.style.display = "block", l.style.display = "none") : (I.style.display = "none", l.style.display = "flex", l.textContent = Xt, h.style.background = xn);
    const Hn = s.user.name || s.user.fullName || "Usuário";
    lt.textContent = Hn, ut.textContent = s.user.fullName || Hn, da.textContent = s.user.funcao || s.user.role || "user", t.dataset.status = "ok", t.dataset.role = s.user.role || "user";
  } else
    i.style.display = "none", r.style.display = "flex", r.textContent = "?", I.style.display = "none", l.style.display = "flex", l.textContent = "?", lt.textContent = "Visitante", ut.textContent = "Visitante", t.dataset.status = "guest";
  if (s.isOpen)
    lo(t, e), e.setAttribute("aria-hidden", "false"), e.classList.add("is-open");
  else {
    const Xt = document.activeElement;
    Xt && e.contains(Xt) && Xt.blur(), e.classList.remove("is-open"), e.setAttribute("aria-hidden", "true");
  }
  ma.setAttribute("aria-expanded", String(s.isOpen)), t.classList.toggle("is-open", s.isOpen);
}
const Mi = "5.1.0-ENTERPRISE", Ti = "header/components/user-menu/accessibility/shortcuts";
let Hl = [];
class Nl {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Mi, moduleId: Ti, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Mi, moduleId: Ti, shortcutCount: this.shortcuts.size, enabled: this.enabled, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Hl];
  }
}
const uo = "5.2.0-ES6", bn = "header/components/user-menu/accessibility/announce", jl = [];
function j() {
  this.announcer = null, this._metrics = { announceCount: 0, lastAnnounceAt: null };
}
j.prototype.init = function() {
  this.announcer || (this.announcer = document.createElement("div"), this.announcer.setAttribute("aria-live", "polite"), this.announcer.setAttribute("data-announcer", bn), this.announcer.className = "sr-only", this.announcer.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;", ga().appendChild(this.announcer));
};
j.prototype.announce = function(t) {
  const e = this;
  e.init(), e.announcer.textContent = "", setTimeout(() => {
    e.announcer.textContent = t;
  }, 100), e._metrics.announceCount++, e._metrics.lastAnnounceAt = Date.now();
};
j.prototype.destroy = function() {
  this.announcer && (this.announcer.remove(), this.announcer = null);
};
j.prototype.healthCheck = () => {
  const t = { ready: !0, noBodyAppend: !0 };
  let e = 0;
  for (const s in t) t[s] && e++;
  return { status: e === 2 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 2, scoreDisplay: `${e}/2`, checks: t, version: uo, moduleId: bn, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
j.prototype.info = function() {
  return { version: uo, moduleId: bn, initialized: !!this.announcer, metrics: this._metrics, healthCheck: this.healthCheck() };
};
j.prototype.setDebug = (t) => {
};
j.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
j.prototype.resetMetrics = function() {
  this._metrics = { announceCount: 0, lastAnnounceAt: null };
};
j.getLogs = () => jl.slice();
const Pi = "5.1.0-ENTERPRISE", Ri = "header/components/user-menu/core/circuit-breaker";
let Bl = [];
class zl {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Pi, moduleId: Ri, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Pi, moduleId: Ri, state: this.state, failures: this.failures, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Bl];
  }
  destroy() {
    this.reset();
  }
}
const ho = "5.2.0-ES6", mo = "header/components/user-menu/ui/tooltips", ql = [];
function B(t) {
  t = t || {}, this.delay = t.delay || 300, this.activeTooltip = null, this.timeoutId = null, this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
}
B.prototype.attach = function(t) {
  const e = this;
  if (!t) return;
  const s = t.getAttribute("data-tooltip");
  s && (t.addEventListener("mouseenter", () => {
    e._show(t, s);
  }), t.addEventListener("mouseleave", () => {
    e._hide();
  }));
};
B.prototype._show = function(t, e) {
  const s = this;
  this._hide(), this.timeoutId = setTimeout(() => {
    const n = document.createElement("div");
    n.className = "user-menu-tooltip", n.textContent = e, n.style.position = "fixed", n.style.pointerEvents = "none", _a().appendChild(n);
    const i = t.getBoundingClientRect();
    n.style.left = `${i.left + i.width / 2}px`, n.style.top = `${i.top - 30}px`, n.style.transform = "translateX(-50%)", s.activeTooltip = n, s._metrics.showCount++, s._metrics.lastShowAt = Date.now();
  }, this.delay);
};
B.prototype._hide = function() {
  this.timeoutId && clearTimeout(this.timeoutId), this.activeTooltip && (this.activeTooltip.remove(), this.activeTooltip = null, this._metrics.hideCount++);
};
B.prototype.healthCheck = () => {
  const t = { ready: !0, noBodyAppend: !0 }, e = Object.values(t).filter(Boolean).length;
  return { status: e === 2 ? "HEALTHY" : "DEGRADED", score: e, maxScore: 2, scoreDisplay: `${e}/2`, checks: t, version: ho, moduleId: mo, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
B.prototype.info = function() {
  return { version: ho, moduleId: mo, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, healthCheck: this.healthCheck() };
};
B.prototype.setDebug = (t) => {
};
B.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
B.prototype.resetMetrics = function() {
  this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
};
B.getLogs = () => ql.slice();
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
Qc();
function c(t) {
  t = t || {}, this.container = t.container, this.store = new $l({ user: null, isOpen: !1, status: "loading" }), this.eventBus = null, this.lifecycle = new Sl(this), this.logger = null, this.telemetry = new Tl(), this.api = new Il(), this.element = null, this.dropdown = null, this.dropdownRoot = null, this._mounted = !1, this._initialized = !1, this.isDestroyed = !1, this.unsubscribe = null, this.shortcuts = new Nl(), this.announcer = new j(), this.circuitBreaker = new zl({ failureThreshold: 3, timeout: 1e4, resetTimeout: 3e4 }), this.tooltips = new B({ delay: 400 }), this.boundHandleClickOutside = (e) => al(this, e), this.boundHandleTriggerClick = (e) => ol(this, e), this.boundUpdateDropdownPosition = () => this._updatePosition(), this.boundHandleKeydown = (e) => ll(this, e), this._metrics = {
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
  this._initialized || this.init({}), this.container = t || this.container, Kc(), this.eventBus = dt("eventBus");
  const s = dt("config");
  return this.logger = new Wt({ prefix: "[UserMenu]", debug: s && s.app && s.app.debug }), this.lifecycle.mount().then(() => {
    e.render(), dl(e), ul(e), hl(e), e._mounted = !0, e._metrics.mountCount++, e._metrics.lastMountAt = Date.now();
    const n = dt("eventBus");
    return n && n.emit && n.emit(o.MOUNTED, {
      componentId: Bs,
      moduleId: zs,
      version: Js,
      capabilities: yn,
      timestamp: Date.now()
    }), to(e);
  }).then(() => (e._log("info", `Mounted v${Js} com integração completa`), e._announce("Menu do usuário carregado"), e));
};
c.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "user-menu-component", this.element.dataset.status = "loading", this.element.setAttribute("data-component-id", ee.id), this.element.innerHTML = Ll(), this.dropdown = document.createElement("div"), this.dropdown.className = "user-menu-dropdown-portal", this.dropdown.setAttribute("role", "menu"), this.dropdown.setAttribute("aria-hidden", "true"), this.dropdown.setAttribute("data-dropdown", zs), this.dropdown.innerHTML = Ul(), this.container && this.container.appendChild(this.element), document.body.appendChild(this.dropdown), this._log("debug", "Dropdown montado no body"), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || xl(t.element, t.dropdown, e);
  });
};
c.prototype._updatePosition = function() {
  lo(this.element, this.dropdown);
};
c.prototype._log = function(t, e, s) {
  this.logger && typeof this.logger[t] == "function" && this.logger[t](e, s);
};
c.prototype._announce = function(t) {
  this.announcer && t && (this.announcer.announce(t), this._metrics.announcementCount++);
};
c.prototype.setUser = function(t) {
  eo(this, t);
};
c.prototype.clearUser = function() {
  so(this);
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
  return Cl(this);
};
c.prototype.fetchUser = function() {
  return this._log("warn", "fetchUser() é legado - use setUser() para P0 compliance"), to(this);
};
c.prototype.unmount = function() {
  const t = this;
  return this._mounted ? (this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    ml(t), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.announcer && t.announcer.destroy(), t.shortcuts && t.shortcuts.disable(), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null), t.dropdown && (t.dropdown.remove(), t.dropdown = null), t._mounted = !1;
    const e = dt("eventBus");
    return e && e.emit && e.emit(o.UNMOUNTED, {
      componentId: Bs,
      moduleId: zs,
      timestamp: Date.now()
    }), t;
  })) : Promise.resolve(this);
};
c.prototype.healthCheck = function() {
  return El(this);
};
c.prototype.info = function() {
  return Dl(this);
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
function Vl(t) {
  return new c(t);
}
var Gl = c;
const Yl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: zs,
  UserMenuComponent: c,
  VERSION: Js,
  capabilities: yn,
  createUserMenu: Vl,
  default: Gl,
  getPorts: Zc,
  id: Bs,
  injectPorts: Jc
}, Symbol.toStringTag, { value: "Module" })), Li = "1.0.0-ENTERPRISE", Ui = "header/components/logo/core/lifecycle";
let po = !1, us = [];
function Fl(t, ...e) {
  !po && t === "debug" || (us.push({ level: t, args: e, ts: Date.now() }), us.length > 50 && us.shift());
}
let Wl = class {
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
        this._metrics.errorCount++, Fl("error", `Hook ${e} error:`, n);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Li, moduleId: Ui, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Li, moduleId: Ui, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    po = !!e;
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
const xi = "1.0.0-ENTERPRISE", Hi = "header/components/logo/state/store";
let fo = !1, hs = [];
function Kl(t, ...e) {
  !fo && t === "debug" || (hs.push({ level: t, args: e, ts: Date.now() }), hs.length > 50 && hs.shift());
}
let Jl = class {
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
        Kl("error", "Subscriber error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: xi, moduleId: Hi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: xi, moduleId: Hi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, fo = !!e;
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
const go = "header.logo.telemetry.logger", Zl = "1.1.0-ES6", ds = a({ moduleId: go });
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
  return { status: ds.isInitialized() ? "HEALTHY" : "DEGRADED", version: Zl, moduleId: go, checks: { loggerReady: !!Me("logger"), portsInitialized: ds.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ds.isInitialized() };
};
const Ni = "1.0.0-ENTERPRISE", ji = "header/components/logo/telemetry/tracker";
let Xl = [], Ql = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Ni, moduleId: ji, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Ni, moduleId: ji, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Xl];
  }
};
const Cn = "1.1.0-ES6", qs = "logo", _o = { type: "brand", reorderable: !1, hideable: !1, critical: !0, rendersUI: !0 }, ce = "header/components/logo", At = a({ moduleId: ce });
function tu() {
  At.init();
}
function $t(t) {
  return At.get(t);
}
function eu(t) {
  return At.inject(t);
}
function su() {
  return At.snapshot();
}
(function() {
  const e = "/components/header/components/logo/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function ot(t) {
  t = t || {}, this.container = t.container, this.config = t.config || {}, this.store = new Jl({ theme: "light", visible: !0 }), this.eventBus = $t("eventBus"), this.lifecycle = new Wl(this);
  const e = $t("config");
  this.logger = new Kt({ prefix: "[Logo]", debug: e && e.app && e.app.debug }), this.telemetry = new Ql(), this.element = null, this.isDestroyed = !1, this.unsubscribe = null, this._metrics = { mountCount: 0, clickCount: 0, lastMountAt: null };
}
ot.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (tu(), this.lifecycle.mount().then(() => {
    t.render(), t.bindEvents(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = $t("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: qs, moduleId: ce, timestamp: Date.now() });
  }));
};
ot.prototype.render = function() {
  const t = this;
  this.element = document.createElement("a"), this.element.className = "logo-component", this.element.href = "/", this.element.title = "DShow Dashboard - Ir para início", this.element.dataset.status = "ok", this.element.setAttribute("aria-label", "DShow — ir para a página inicial"), this.element.innerHTML = '<img src="/assets/brand/dshow-logo.svg" alt="DShow" class="logo-image dsd-marca-logo dsd-marca--claro" width="94" height="32" /><img src="/assets/brand/dshow-logo-branco.svg" alt="DShow" class="logo-image dsd-marca-logo dsd-marca--escuro" width="94" height="32" />', this.container && this.container.appendChild(this.element), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
ot.prototype.updateUI = function(t) {
  this.element && (this.element.dataset.theme = t.theme, this.element.style.display = t.visible ? "flex" : "none");
};
ot.prototype.bindEvents = function() {
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
ot.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = $t("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: qs, moduleId: ce, timestamp: Date.now() });
  });
};
ot.prototype.healthCheck = function() {
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
ot.prototype.info = function() {
  return {
    version: Cn,
    moduleId: ce,
    id: qs,
    capabilities: _o,
    portsInitialized: At.isInitialized(),
    mounted: !!this.element,
    theme: this.store.getState().theme,
    metrics: this._metrics
  };
};
var nu = ot;
const iu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LogoComponent: ot,
  MODULE_ID: ce,
  VERSION: Cn,
  capabilities: _o,
  default: nu,
  getPorts: su,
  id: qs,
  injectPorts: eu
}, Symbol.toStringTag, { value: "Module" })), bo = "6.1.0-ES6", Pe = "header.email-integration.api.fetch", vn = a({ moduleId: Pe });
function yo(t) {
  return vn.get(t);
}
const se = function(t, ...e) {
  const s = yo("logger");
  s && s[t] && s[t](...[`[${Pe}]`].concat(e));
};
function Co(t, e) {
  try {
    const s = yo("telemetry");
    s && s.track && s.track(`${Pe}:${t}`, e || {});
  } catch {
  }
}
function vo(t) {
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
function ht(t) {
  return { unread_count: 0, status: "unavailable", _fallback: !0, _reason: t };
}
function at(t) {
  t || (t = {}), this.baseURL = t.baseURL || "/api/email", this.timeout = t.timeout || 1e4, this.headers = t.headers || {}, this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}
at.prototype.get = function(t, e) {
  return this._request("GET", t, null, e || {});
};
at.prototype.post = function(t, e, s) {
  return this._request("POST", t, e, s || {});
};
at.prototype._request = function(t, e, s, n) {
  const i = this;
  i._metrics.requestCount++, i._metrics.lastRequestAt = Date.now();
  const r = new AbortController(), h = setTimeout(() => {
    r.abort();
  }, i.timeout), I = {
    method: t,
    headers: Object.assign({ Accept: "application/json" }, i.headers, n.headers || {}),
    signal: r.signal,
    credentials: "include"
  };
  s && (I.body = JSON.stringify(s), I.headers["Content-Type"] = "application/json");
  const l = i.baseURL + e;
  return fetch(l, I).then((lt) => {
    clearTimeout(h);
    const ut = vo(lt);
    return ut.isAuthError ? (i._metrics.authErrors++, se("info", "Auth required", { status: ut.status }), ht("auth-required")) : ut.isContractViolation ? (i._metrics.contractViolations++, se("error", "API_CONTRACT_VIOLATION", { contentType: ut.contentType }), Co("contract-violation", { contentType: ut.contentType }), ht("contract-violation")) : lt.ok ? (i._metrics.successCount++, lt.json()) : (i._metrics.errorCount++, ht("http-error"));
  }).catch((lt) => (clearTimeout(h), i._metrics.errorCount++, se("error", "Request failed", { method: t, endpoint: e, error: lt.message }), ht("network-error")));
};
at.prototype.fetchStatus = function() {
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
    const r = vo(i);
    return r.isAuthError ? (t._metrics.authErrors++, se("info", "Auth required for email status", { status: r.status }), ht("auth-required")) : r.isContractViolation ? (t._metrics.contractViolations++, se("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${r.contentType}`, { url: n }), Co("contract-violation", { contentType: r.contentType, url: n }), ht("contract-violation")) : i.ok ? (t._metrics.successCount++, i.json()) : (t._metrics.errorCount++, ht("http-error"));
  }).then((i) => i && i._fallback ? i : { unread_count: i.unread_count || i.count || 0, status: "ok" }).catch((i) => {
    clearTimeout(s), t._metrics.errorCount++;
    const r = i.name === "AbortError" ? "timeout" : "network-error";
    return se("warn", "Fetch failed, using fallback", { error: i.message, reason: r }), ht(r);
  });
};
at.prototype.healthCheck = function() {
  const t = vn.snapshot(), e = {
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
    version: bo,
    moduleId: Pe,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
at.prototype.info = function() {
  const t = vn.snapshot();
  return {
    version: bo,
    moduleId: Pe,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: t._initialized,
    healthCheck: this.healthCheck()
  };
};
at.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
at.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
};
var ru = at;
const Bi = "5.1.0-ENTERPRISE", zi = "header/components/email-integration/core/lifecycle";
let Eo = !1, ms = [];
function ou(t, ...e) {
  !Eo && t === "debug" || (ms.push({ level: t, args: e, ts: Date.now() }), ms.length > 50 && ms.shift());
}
let au = class {
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
        this._metrics.errorCount++, ou("error", `Error in ${e}:`, i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Bi, moduleId: zi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Bi, moduleId: zi, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Eo = !!e;
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
const qi = "5.1.0-ENTERPRISE", Vi = "header/components/email-integration/state/store";
let Do = !1, ps = [];
function cu(t, ...e) {
  !Do && t === "debug" || (ps.push({ level: t, args: e, ts: Date.now() }), ps.length > 50 && ps.shift());
}
let lu = class {
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
        cu("error", "Store error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: qi, moduleId: Vi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: qi, moduleId: Vi, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Do = !!e;
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
const ko = "header.email-integration.telemetry.logger", uu = "2.2.0-P17WI", Io = a({ moduleId: ko });
function pe(t) {
  return Io.get(t);
}
let fe = { logs: 0, warns: 0, errors: 0 }, hu = class {
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
    const e = Io.snapshot();
    return { status: e._initialized ? "HEALTHY" : "DEGRADED", version: uu, moduleId: ko, checks: { loggerReady: !!pe("logger"), portsInitialized: e._initialized }, metrics: this.getMetrics(), portsInitialized: e._initialized, timestamp: Date.now() };
  }
};
const Gi = "5.1.0-ENTERPRISE", Yi = "header/components/email-integration/telemetry/tracker";
let du = [], mu = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Gi, moduleId: Yi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Gi, moduleId: Yi, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...du];
  }
};
const Fi = "5.1.0-ENTERPRISE", Wi = "header/components/email-integration/core/polling";
let wo = !1, fs = [];
function pu(t, ...e) {
  !wo && t === "debug" || (fs.push({ level: t, args: e, ts: Date.now() }), fs.length > 50 && fs.shift());
}
let fu = class {
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
        this._metrics.errorCount++, pu("error", "Execution error:", e);
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
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Fi, moduleId: Wi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Fi, moduleId: Wi, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    wo = !!e;
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
const En = "10.1.0-ES6", Re = "email-integration", So = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, ct = "header/components/email-integration", gu = "#/status-mail", Ot = a({ moduleId: ct });
function _u() {
  Ot.init();
}
function Mt(t) {
  return Ot.get(t);
}
function bu(t) {
  return Ot.inject(t);
}
function yu() {
  return Ot.snapshot();
}
function Cu(t) {
  t = t || {};
  const e = Mt("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:email-integration", source: ct, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
}
(function() {
  const e = "/components/header/components/email-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const vu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
function z(t) {
  t = t || {}, this.container = t.container, this.store = new lu({ unreadCount: 0, status: "loading" }), this.eventBus = Mt("eventBus"), this.lifecycle = new au(this);
  const e = Mt("config");
  this.logger = new hu({ prefix: "[Email]", debug: e && e.app && e.app.debug }), this.telemetry = new mu(), this.api = new ru(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
z.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (_u(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Mt("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Re, moduleId: ct, timestamp: Date.now() });
  }));
};
z.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "email-integration-component", this.element.title = "E-mail", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-email-integration"), this.element.innerHTML = `<div class="integration-icon">${vu}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), Cu({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 }), D(gu, ct);
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
    const s = Mt("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Re, moduleId: ct, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch((e) => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
z.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new fu({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
z.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Mt("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Re, moduleId: ct, timestamp: Date.now() });
  });
};
z.prototype.healthCheck = function() {
  const t = Mt("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Ot.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Ot.isInitialized(), version: En, moduleId: ct };
};
z.prototype.info = function() {
  return { version: En, moduleId: ct, id: Re, capabilities: So, portsInitialized: Ot.isInitialized(), mounted: !!this.element, unreadCount: this.store.getState().unreadCount, metrics: this._metrics };
};
var Eu = z;
const Du = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EmailIntegrationComponent: z,
  MODULE_ID: ct,
  VERSION: En,
  capabilities: So,
  default: Eu,
  getPorts: yu,
  id: Re,
  injectPorts: bu
}, Symbol.toStringTag, { value: "Module" })), Ao = "6.2.0-NONFATAL-WARN", Vs = "header.whatsapp-integration.api.fetch", Ms = a({ moduleId: Vs });
function ku(t) {
  return Ms.get(t);
}
function Ki(t, ...e) {
  const s = ku("logger");
  s && s[t] && s[t].apply(s, [`[${Vs}]`].concat(e));
}
function Ji(t) {
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
function Iu(t) {
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
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Iu(n) ? (Ki("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), Ji("timeout")) : (Ki("warn", "Fetch failed (non-fatal)", { error: n.message }), Ji("error"))));
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
    version: Ao,
    moduleId: Vs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
le.prototype.info = function() {
  return {
    version: Ao,
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
var wu = le;
const Zi = "5.1.0-ENTERPRISE", Xi = "header/components/whatsapp-integration/core/lifecycle";
let $o = !1, gs = [];
function Su(t, ...e) {
  !$o && t === "debug" || (gs.push({ level: t, args: e, ts: Date.now() }), gs.length > 50 && gs.shift());
}
let Au = class {
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
        this._metrics.errorCount++, Su("error", `Error in ${e}:`, i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Zi, moduleId: Xi, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Zi, moduleId: Xi, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    $o = !!e;
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
const Qi = "5.1.0-ENTERPRISE", tr = "header/components/whatsapp-integration/state/store";
let Oo = !1, _s = [];
function $u(t, ...e) {
  !Oo && t === "debug" || (_s.push({ level: t, args: e, ts: Date.now() }), _s.length > 50 && _s.shift());
}
let Ou = class {
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
        $u("error", "Store error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Qi, moduleId: tr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Qi, moduleId: tr, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Oo = !!e;
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
const Mo = "header.whatsapp-integration.telemetry.logger", Mu = "2.3.0-ES6", bs = a({ moduleId: Mo });
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
  return { status: bs.isInitialized() ? "HEALTHY" : "DEGRADED", version: Mu, moduleId: Mo, checks: { loggerReady: !!Le("logger"), portsInitialized: bs.isInitialized() }, metrics: this.getMetrics(), portsInitialized: bs.isInitialized() };
};
const er = "5.1.0-ENTERPRISE", sr = "header/components/whatsapp-integration/telemetry/tracker";
let Tu = [], Pu = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: er, moduleId: sr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: er, moduleId: sr, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Tu];
  }
};
const nr = "5.1.0-ENTERPRISE", ir = "header/components/whatsapp-integration/core/polling";
let To = !1, ys = [];
function Ru(t, ...e) {
  !To && t === "debug" || (ys.push({ level: t, args: e, ts: Date.now() }), ys.length > 50 && ys.shift());
}
let Lu = class {
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
        this._metrics.errorCount++, Ru("error", "Execution error:", e);
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
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: nr, moduleId: ir, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: nr, moduleId: ir, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    To = !!e;
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
const Dn = "9.7.0-P1-UARPS", xe = "whatsapp-integration", Po = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, _t = "header/components/whatsapp-integration", Tt = a({ moduleId: _t }), Uu = () => {
  Tt.init();
}, He = (t) => Tt.get(t), xu = (t) => Tt.inject(t), Hu = () => Tt.snapshot(), Nu = (t = {}) => {
  const e = He("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:whatsapp-integration", source: _t, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/whatsapp-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const ju = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 176"><rect fill="#29a71a" height="176" rx="24" width="176"/><g fill="#fff"><path d="m126.8 49.2a54.57 54.57 0 0 0 -87.42 63.13l-5.79 28.11a2.08 2.08 0 0 0 .33 1.63 2.11 2.11 0 0 0 2.24.87l27.55-6.53a54.56 54.56 0 0 0 63.09-87.21zm-8.59 68.56a42.74 42.74 0 0 1 -49.22 8l-3.84-1.9-16.89 4 .05-.21 3.5-17-1.88-3.71a42.72 42.72 0 0 1 7.86-49.59 42.73 42.73 0 0 1 60.42 0 2.28 2.28 0 0 0 .22.22 42.72 42.72 0 0 1 -.22 60.19z"/><path d="m116.71 105.29c-2.07 3.26-5.34 7.25-9.45 8.24-7.2 1.74-18.25.06-32-12.76l-.17-.15c-12.09-11.21-15.23-20.54-14.47-27.94.42-4.2 3.92-8 6.87-10.48a3.93 3.93 0 0 1 6.15 1.41l4.45 10a3.91 3.91 0 0 1 -.49 4l-2.25 2.92a3.87 3.87 0 0 0 -.35 4.32c1.26 2.21 4.28 5.46 7.63 8.47 3.76 3.4 7.93 6.51 10.57 7.57a3.82 3.82 0 0 0 4.19-.88l2.61-2.63a4 4 0 0 1 3.9-1l10.57 3a4 4 0 0 1 2.24 5.91z"/></g></svg>';
function q(t) {
  t = t || {}, this.container = t.container, this.store = new Ou({ unreadCount: 0, status: "loading" }), this.lifecycle = new Au(this), this.logger = new Jt({ prefix: "[WhatsApp]", debug: !1 }), this.telemetry = new Pu(), this.api = new wu(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
q.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Uu(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = He("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: xe, moduleId: _t, timestamp: Date.now() });
  }));
};
q.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "whatsapp-integration-component", this.element.title = "WhatsApp", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-whatsapp-integration"), this.element.innerHTML = `<div class="integration-icon">${ju}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Nu({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
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
    const s = He("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: xe, moduleId: _t, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
q.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new Lu({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
q.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = He("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: xe, moduleId: _t, timestamp: Date.now() });
  });
};
q.prototype.healthCheck = function() {
  const t = He("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Tt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Tt.isInitialized(), version: Dn, moduleId: _t };
};
q.prototype.info = function() {
  return { version: Dn, moduleId: _t, id: xe, capabilities: Po, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Tt.isInitialized(), metrics: this._metrics };
};
var Bu = q;
const zu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: _t,
  VERSION: Dn,
  WhatsAppIntegrationComponent: q,
  capabilities: Po,
  default: Bu,
  getPorts: Hu,
  id: xe,
  injectPorts: xu
}, Symbol.toStringTag, { value: "Module" })), Ro = "6.2.0-NONFATAL-WARN", Gs = "header.instagram-messenger-integration.api.fetch", Ts = a({ moduleId: Gs });
function qu(t) {
  return Ts.get(t);
}
function rr(t, ...e) {
  const s = qu("logger");
  s && s[t] && s[t](...[`[${Gs}]`].concat(e));
}
function or(t) {
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
function Vu(t) {
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
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, Vu(n) ? (rr("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), or("timeout")) : (rr("warn", "Fetch failed (non-fatal)", { error: n.message }), or("error"))));
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
    version: Ro,
    moduleId: Gs,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
ue.prototype.info = function() {
  return {
    version: Ro,
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
var Gu = ue;
const ar = "5.1.0-ENTERPRISE", cr = "header/components/instagram-messenger-integration/core/lifecycle";
let Lo = !1, Cs = [];
function Yu(t, ...e) {
  !Lo && t === "debug" || (Cs.push({ level: t, args: e, ts: Date.now() }), Cs.length > 50 && Cs.shift());
}
let Fu = class {
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
        this._metrics.errorCount++, Yu("error", `Error in ${e}:`, i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: ar, moduleId: cr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: ar, moduleId: cr, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Lo = !!e;
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
const lr = "5.1.0-ENTERPRISE", ur = "header/components/instagram-messenger-integration/state/store";
let Uo = !1, vs = [];
function Wu(t, ...e) {
  !Uo && t === "debug" || (vs.push({ level: t, args: e, ts: Date.now() }), vs.length > 50 && vs.shift());
}
let Ku = class {
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
        Wu("error", "Store error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: lr, moduleId: ur, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: lr, moduleId: ur, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    this._debug = !!e, Uo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...vs];
  }
};
const xo = "header.instagram-messenger-integration.telemetry.logger", Ju = "8.4.0-ES6", Es = a({ moduleId: xo });
function Ne(t) {
  return Es.get(t);
}
let he = { logs: 0, warns: 0, errors: 0 };
function bt(t) {
  t || (t = {}), this.prefix = t.prefix || "[instagram-messenger]", this.debug = t.debug || !1;
}
bt.prototype.info = function(...t) {
  if (!this.debug) return;
  he.logs++;
  const e = Ne("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
bt.prototype.warn = function(...t) {
  he.warns++;
  const e = Ne("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
bt.prototype.error = function(...t) {
  he.errors++;
  const e = Ne("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
bt.prototype.debug = function(...t) {
  if (!this.debug) return;
  he.logs++;
  const e = Ne("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
bt.prototype.getMetrics = () => Object.assign({}, he);
bt.prototype.resetMetrics = () => {
  he = { logs: 0, warns: 0, errors: 0 };
};
bt.prototype.healthCheck = function() {
  return { status: Es.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ju, moduleId: xo, checks: { loggerReady: !!Ne("logger"), portsInitialized: Es.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Es.isInitialized() };
};
const hr = "5.1.0-ENTERPRISE", dr = "header/components/instagram-messenger-integration/telemetry/tracker";
let Zu = [], Xu = class {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: hr, moduleId: dr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: hr, moduleId: dr, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...Zu];
  }
};
const mr = "5.1.0-ENTERPRISE", pr = "header/components/instagram-messenger-integration/core/polling";
let Ho = !1, Ds = [];
function Qu(t, ...e) {
  !Ho && t === "debug" || (Ds.push({ level: t, args: e, ts: Date.now() }), Ds.length > 50 && Ds.shift());
}
let th = class {
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
        this._metrics.errorCount++, Qu("error", "Execution error:", e);
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
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: mr, moduleId: pr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: mr, moduleId: pr, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Ho = !!e;
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
const kn = "9.7.0-P1-UARPS", je = "instagram-messenger-integration", No = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, yt = "header/components/instagram-messenger-integration", Pt = a({ moduleId: yt }), eh = () => {
  Pt.init();
}, Be = (t) => Pt.get(t), sh = (t) => Pt.inject(t), nh = () => Pt.snapshot(), ih = (t = {}) => {
  const e = Be("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:instagram-messenger-integration", source: yt, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/instagram-messenger-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const rh = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad" gradientTransform="matrix(0 -1.982 -1.844 0 -132.522 -51.077)" gradientUnits="userSpaceOnUse" x1="-37.106" x2="-26.555" y1="-72.705" y2="-84.047"><stop offset="0" stop-color="#fd5"/><stop offset=".5" stop-color="#ff543e"/><stop offset="1" stop-color="#c837ab"/></linearGradient></defs><path d="m1.5 1.633c-1.886 1.959-1.5 4.04-1.5 10.362 0 5.25-.916 10.513 3.878 11.752 1.497.385 14.761.385 16.256-.002 1.996-.515 3.62-2.134 3.842-4.957.031-.394.031-13.185-.001-13.587-.236-3.007-2.087-4.74-4.526-5.091-.559-.081-.671-.105-3.539-.11-10.173.005-12.403-.448-14.41 1.633z" fill="url(#ig-grad)"/><path d="m11.998 3.139c-3.631 0-7.079-.323-8.396 3.057-.544 1.396-.465 3.209-.465 5.805 0 2.278-.073 4.419.465 5.804 1.314 3.382 4.79 3.058 8.394 3.058 3.477 0 7.062.362 8.395-3.058.545-1.41.465-3.196.465-5.804 0-3.462.191-5.697-1.488-7.375-1.7-1.7-3.999-1.487-7.374-1.487zm-.794 1.597c7.574-.012 8.538-.854 8.006 10.843-.189 4.137-3.339 3.683-7.211 3.683-7.06 0-7.263-.202-7.263-7.265 0-7.145.56-7.257 6.468-7.263zm5.524 1.471c-.587 0-1.063.476-1.063 1.063s.476 1.063 1.063 1.063 1.063-.476 1.063-1.063-.476-1.063-1.063-1.063zm-4.73 1.243c-2.513 0-4.55 2.038-4.55 4.551s2.037 4.55 4.55 4.55 4.549-2.037 4.549-4.55-2.036-4.551-4.549-4.551zm0 1.597c3.905 0 3.91 5.908 0 5.908-3.904 0-3.91-5.908 0-5.908z" fill="#fff"/></svg>';
function V(t) {
  t = t || {}, this.container = t.container, this.store = new Ku({ unreadCount: 0, status: "loading" }), this.lifecycle = new Fu(this), this.logger = new bt({ prefix: "[Instagram]", debug: !1 }), this.telemetry = new Xu(), this.api = new Gu(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
V.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (eh(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Be("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: je, moduleId: yt, timestamp: Date.now() });
  }));
};
V.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "instagram-messenger-integration-component", this.element.title = "Instagram / Messenger", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-instagram-messenger-integration"), this.element.innerHTML = `<div class="integration-icon">${rh}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    ih({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
V.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
V.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Be("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: je, moduleId: yt, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
V.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new th({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
V.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Be("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: je, moduleId: yt, timestamp: Date.now() });
  });
};
V.prototype.healthCheck = function() {
  const t = Be("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Pt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Pt.isInitialized(), version: kn, moduleId: yt };
};
V.prototype.info = function() {
  return { version: kn, moduleId: yt, id: je, capabilities: No, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Pt.isInitialized(), metrics: this._metrics };
};
var oh = V;
const ah = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  InstagramMessengerComponent: V,
  MODULE_ID: yt,
  VERSION: kn,
  capabilities: No,
  default: oh,
  getPorts: nh,
  id: je,
  injectPorts: sh
}, Symbol.toStringTag, { value: "Module" })), jo = "6.2.0-NONFATAL-WARN", Ys = "header.wechat-integration.api.fetch", Ps = a({ moduleId: Ys });
function ch(t) {
  return Ps.get(t);
}
function fr(t, ...e) {
  const s = ch("logger");
  s && s[t] && s[t](...[`[${Ys}]`].concat(e));
}
function gr(t) {
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
function lh(t) {
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
  }).catch((n) => (clearTimeout(s), t._metrics.errorCount++, lh(n) ? (fr("warn", "Fetch aborted (non-fatal)", { timeout: t.timeout }), gr("timeout")) : (fr("warn", "Fetch failed (non-fatal)", { error: n.message }), gr("error"))));
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
    version: jo,
    moduleId: Ys,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
de.prototype.info = function() {
  return {
    version: jo,
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
var uh = de;
const _r = "5.1.0-ENTERPRISE", br = "header/components/wechat-integration/core/lifecycle";
let Bo = !1, ks = [];
function hh(t, ...e) {
  !Bo && t === "debug" || (ks.push({ level: t, args: e, ts: Date.now() }), ks.length > 50 && ks.shift());
}
class dh {
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
        this._metrics.errorCount++, hh("error", `Error in ${e}:`, i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: _r, moduleId: br, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: _r, moduleId: br, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Bo = !!e;
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
const yr = "5.1.0-ENTERPRISE", Cr = "header/components/wechat-integration/state/store";
let zo = !1, Is = [];
function mh(t, ...e) {
  !zo && t === "debug" || (Is.push({ level: t, args: e, ts: Date.now() }), Is.length > 50 && Is.shift());
}
class ph {
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
        mh("error", "Store error:", i);
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: yr, moduleId: Cr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: yr, moduleId: Cr, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    zo = !!e;
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
const qo = "header.wechat-integration.telemetry.logger", fh = "2.3.0-ES6", ws = a({ moduleId: qo });
function ze(t) {
  return ws.get(t);
}
let qe = { logs: 0, warns: 0, errors: 0 };
function Zt(t) {
  t || (t = {}), this.prefix = t.prefix || "[wechat-integration]", this.debug = t.debug || !1;
}
Zt.prototype.info = function(...t) {
  if (!this.debug) return;
  qe.logs++;
  const e = ze("logger");
  e && e.info ? e.info(...[this.prefix].concat(Array.prototype.slice.call(t))) : e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Zt.prototype.warn = function(...t) {
  qe.warns++;
  const e = ze("logger");
  e && e.warn && e.warn(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Zt.prototype.error = function(...t) {
  qe.errors++;
  const e = ze("logger");
  e && e.error && e.error(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Zt.prototype.debug = function(...t) {
  if (!this.debug) return;
  qe.logs++;
  const e = ze("logger");
  e && e.debug && e.debug(...[this.prefix].concat(Array.prototype.slice.call(t)));
};
Zt.prototype.getMetrics = () => Object.assign({}, qe);
Zt.prototype.healthCheck = function() {
  return { status: ws.isInitialized() ? "HEALTHY" : "DEGRADED", version: fh, moduleId: qo, checks: { loggerReady: !!ze("logger"), portsInitialized: ws.isInitialized() }, metrics: this.getMetrics(), portsInitialized: ws.isInitialized() };
};
const vr = "5.1.0-ENTERPRISE", Er = "header/components/wechat-integration/telemetry/tracker";
let gh = [];
class _h {
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
    return { status: s === 2 ? "HEALTHY" : "DEGRADED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: vr, moduleId: Er, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: vr, moduleId: Er, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() };
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
    return [...gh];
  }
}
const Dr = "5.1.0-ENTERPRISE", kr = "header/components/wechat-integration/core/polling";
let Vo = !1, Ss = [];
function bh(t, ...e) {
  !Vo && t === "debug" || (Ss.push({ level: t, args: e, ts: Date.now() }), Ss.length > 50 && Ss.shift());
}
class yh {
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
        this._metrics.errorCount++, bh("error", "Execution error:", e);
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
    return { status: s === 2 ? "HEALTHY" : s === 1 ? "DEGRADED" : "STOPPED", score: s, maxScore: 2, scoreDisplay: `${s}/2`, checks: e, version: Dr, moduleId: kr, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: Dr, moduleId: kr, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(e) {
    Vo = !!e;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [...Ss];
  }
}
const In = "9.7.0-P1-UARPS", Ve = "wechat-integration", Go = { type: "integration", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Ct = "header/components/wechat-integration", Rt = a({ moduleId: Ct }), Ch = () => {
  Rt.init();
}, Ge = (t) => Rt.get(t), vh = (t) => Rt.inject(t), Eh = () => Rt.snapshot(), Dh = (t = {}) => {
  const e = Ge("eventBus");
  !e || !e.emit || e.emit(E.ACTION, { actionId: "header:wechat-integration", source: Ct, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, t) });
};
(function() {
  const e = "/components/header/components/wechat-integration/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
const kh = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#07C160" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 0 1 .178-.554c1.527-1.124 2.5-2.783 2.5-4.622 0-3.295-3.063-6.12-7.06-6.12zm-2.641 3.125c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/></svg>';
function G(t) {
  t = t || {}, this.container = t.container, this.store = new ph({ unreadCount: 0, status: "loading" }), this.lifecycle = new dh(this), this.logger = new Zt({ prefix: "[WeChat]", debug: !1 }), this.telemetry = new _h(), this.api = new uh(), this.element = null, this.isDestroyed = !1, this.polling = null, this.unsubscribe = null, this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
G.prototype.mount = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (Ch(), this.lifecycle.mount().then(() => (t.render(), t.fetchStatus())).then(() => {
    t.startPolling(), t._metrics.mountCount++, t._metrics.lastMountAt = Date.now();
    const e = Ge("eventBus");
    e && e.emit && e.emit(o.MOUNTED, { componentId: Ve, moduleId: Ct, timestamp: Date.now() });
  }));
};
G.prototype.render = function() {
  const t = this;
  this.element = document.createElement("div"), this.element.className = "wechat-integration-component", this.element.title = "WeChat", this.element.dataset.status = "loading", this.element.dataset.count = "0", this.element.setAttribute("data-uarps-trigger", "trigger:header:open-wechat-integration"), this.element.innerHTML = `<div class="integration-icon">${kh}</div><span class="integration-badge">0</span>`, this.container && this.container.appendChild(this.element), this.element.style.cursor = "pointer", this.element.addEventListener("click", () => {
    Dh({ clicked: !0, value: t.store && t.store.getState ? t.store.getState().unreadCount : 0 });
  }), this.unsubscribe = this.store.subscribe((e) => {
    !t.element || t.isDestroyed || t.updateUI(e);
  });
};
G.prototype.updateUI = function(t) {
  const e = this.element.querySelector(".integration-badge");
  t.unreadCount !== null ? (this.element.dataset.count = String(t.unreadCount), this.element.dataset.status = t.unreadCount > 0 ? "has-unread" : "ok", e.textContent = t.unreadCount > 99 ? "99+" : t.unreadCount) : (this.element.dataset.count = "0", this.element.dataset.status = "offline");
};
G.prototype.fetchStatus = function() {
  const t = this;
  return this.isDestroyed ? Promise.resolve() : (this._metrics.fetchCount++, this._metrics.lastFetchAt = Date.now(), this.api.fetchStatus().then((e) => {
    if (t.isDestroyed) return;
    t.store.setState({ unreadCount: e.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const s = Ge("eventBus");
    s && s.emit && s.emit(o.DATA_UPDATED, { componentId: Ve, moduleId: Ct, data: { unreadCount: e.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    t.isDestroyed || t.store.setState({ status: "offline" });
  }));
};
G.prototype.startPolling = function() {
  const t = this;
  this.isDestroyed || (this.polling = new yh({ interval: 6e4 }), this.polling.onPoll(() => t.fetchStatus()), this.polling.start());
};
G.prototype.unmount = function() {
  const t = this;
  return this.isDestroyed = !0, this.lifecycle.unmount().then(() => {
    t.polling && (t.polling.stop(), t.polling = null), t.unsubscribe && (t.unsubscribe(), t.unsubscribe = null), t.store && t.store.reset(), t.element && (t.element.remove(), t.element = null);
    const e = Ge("eventBus");
    e && e.emit && e.emit(o.UNMOUNTED, { componentId: Ve, moduleId: Ct, timestamp: Date.now() });
  });
};
G.prototype.healthCheck = function() {
  const t = Ge("eventBus"), e = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!t, pollingActive: !!this.polling, portsInitialized: Rt.isInitialized() }, s = Object.values(e).filter(Boolean).length;
  return { status: s === 5 ? "HEALTHY" : s >= 3 ? "DEGRADED" : "UNHEALTHY", score: s, maxScore: 5, checks: e, portsInitialized: Rt.isInitialized(), version: In, moduleId: Ct };
};
G.prototype.info = function() {
  return { version: In, moduleId: Ct, id: Ve, capabilities: Go, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Rt.isInitialized(), metrics: this._metrics };
};
var Ih = G;
const wh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ct,
  VERSION: In,
  WeChatIntegrationComponent: G,
  capabilities: Go,
  default: Ih,
  getPorts: Eh,
  id: Ve,
  injectPorts: vh
}, Symbol.toStringTag, { value: "Module" })), wn = "8.8.0-ES6", Yo = "panel-adwords", Fo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, W = "header/components/panel-adwords", w = { id: "panel-adwords", label: "Google Ads", route: "#/panel-ads", icon: "/assets/icons/system/header/adwords.svg" }, Lt = a({ moduleId: W });
function Sh() {
  Lt.init();
}
function Ah(t) {
  return Lt.get(t);
}
function $h(t) {
  return Lt.inject(t);
}
function Oh() {
  return Lt.snapshot();
}
(function() {
  const e = "/components/header/components/panel-adwords/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function Zs(t, e) {
  e = e || {};
  const s = Ah("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: W, timestamp: Date.now() }, e));
}
function d(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
d.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Sh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Zs(o.MOUNTED, { componentId: w.id, moduleId: W }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Zs(o.ERROR, { componentId: w.id, moduleId: W, error: e.message }), Promise.reject(e);
  }
};
d.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-adwords-trigger", this.element.title = w.label, this.element.setAttribute("aria-label", `Abrir ${w.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", w.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-adwords"), this.element.innerHTML = `<img src="${w.icon}" alt="${w.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
d.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(w.route, W);
  }, this.element.addEventListener("click", this._clickHandler));
};
d.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
d.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Zs(o.UNMOUNTED, { componentId: w.id, moduleId: W }), Promise.resolve(this));
};
d.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
d.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Lt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Lt.isInitialized(), version: wn, moduleId: W, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
d.prototype.info = function() {
  return { version: wn, moduleId: W, id: Yo, capabilities: Fo, config: Object.assign({}, w), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Lt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function Mh(t) {
  return new d(t);
}
var Th = d;
const Ph = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: W,
  PanelAdwordsComponent: d,
  VERSION: wn,
  capabilities: Fo,
  createComponent: Mh,
  default: Th,
  getPorts: Oh,
  id: Yo,
  injectPorts: $h
}, Symbol.toStringTag, { value: "Module" })), Sn = "8.8.0-ES6", Wo = "panel-asaas", Ko = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, K = "header/components/panel-asaas", S = { id: "panel-asaas", label: "Asaas", route: "#/integrations/asaas", icon: "/assets/icons/system/header/asaas.svg" }, Ut = a({ moduleId: K });
function Rh() {
  Ut.init();
}
function Lh(t) {
  return Ut.get(t);
}
function Uh(t) {
  return Ut.inject(t);
}
function xh() {
  return Ut.snapshot();
}
(function() {
  const e = "/components/header/components/panel-asaas/component.css";
  if (!document.querySelector(`link[href="${e}"]`)) {
    const s = document.createElement("link");
    s.rel = "stylesheet", s.href = e, document.head.appendChild(s);
  }
})();
function Xs(t, e) {
  e = e || {};
  const s = Lh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: K, timestamp: Date.now() }, e));
}
function m(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
m.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Rh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Xs(o.MOUNTED, { componentId: S.id, moduleId: K }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Xs(o.ERROR, { componentId: S.id, moduleId: K, error: e.message }), Promise.reject(e);
  }
};
m.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-asaas-trigger", this.element.title = S.label, this.element.setAttribute("aria-label", `Abrir ${S.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", S.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-asaas"), this.element.innerHTML = `<img src="${S.icon}" alt="${S.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
m.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(S.route, K);
  }, this.element.addEventListener("click", this._clickHandler));
};
m.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
m.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Xs(o.UNMOUNTED, { componentId: S.id, moduleId: K }), Promise.resolve(this));
};
m.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
m.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ut.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Ut.isInitialized(), version: Sn, moduleId: K, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
m.prototype.info = function() {
  return { version: Sn, moduleId: K, id: Wo, capabilities: Ko, config: Object.assign({}, S), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ut.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function Hh(t) {
  return new m(t);
}
var Nh = m;
const jh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: K,
  PanelAsaasComponent: m,
  VERSION: Sn,
  capabilities: Ko,
  createComponent: Hh,
  default: Nh,
  getPorts: xh,
  id: Wo,
  injectPorts: Uh
}, Symbol.toStringTag, { value: "Module" })), An = "8.8.0-ES6", Jo = "panel-bling", Zo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, J = "header/components/panel-bling", k = { id: "panel-bling", label: "Bling", route: "#/integrations/bling", icon: "/assets/icons/system/header/bling.svg" }, xt = a({ moduleId: J });
function Bh() {
  xt.init();
}
function zh(t) {
  return xt.get(t);
}
function qh(t) {
  return xt.inject(t);
}
function Vh() {
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
  const s = zh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: J, timestamp: Date.now() }, e));
}
function p(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
p.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Bh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), Qs(o.MOUNTED, { componentId: k.id, moduleId: J }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, Qs(o.ERROR, { componentId: k.id, moduleId: J, error: e.message }), Promise.reject(e);
  }
};
p.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-bling-trigger", this.element.title = k.label, this.element.setAttribute("aria-label", `Abrir ${k.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", k.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-bling"), this.element.innerHTML = `<img src="${k.icon}" alt="${k.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
p.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now();
    const s = window.location.hash;
    D(k.route, J), window.setTimeout(() => {
      window.location.hash === s && (window.location.hash = k.route);
    }, 140);
  }, this.element.addEventListener("click", this._clickHandler));
};
p.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
p.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, Qs(o.UNMOUNTED, { componentId: k.id, moduleId: J }), Promise.resolve(this));
};
p.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
p.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: xt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: xt.isInitialized(), version: An, moduleId: J, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
p.prototype.info = function() {
  return { version: An, moduleId: J, id: Jo, capabilities: Zo, config: Object.assign({}, k), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: xt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function Gh(t) {
  return new p(t);
}
var Yh = p;
const Fh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: J,
  PanelBlingComponent: p,
  VERSION: An,
  capabilities: Zo,
  createComponent: Gh,
  default: Yh,
  getPorts: Vh,
  id: Jo,
  injectPorts: qh
}, Symbol.toStringTag, { value: "Module" })), $n = "8.8.0-ES6", Xo = "panel-calendar", Qo = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Z = "header/components/panel-calendar", A = { id: "panel-calendar", label: "Google Calendar", route: "#/panel-google-calendar", icon: "/assets/icons/system/header/calendar.svg" }, Ht = a({ moduleId: Z });
function Wh() {
  Ht.init();
}
function Kh(t) {
  return Ht.get(t);
}
function Jh(t) {
  return Ht.inject(t);
}
function Zh() {
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
  const s = Kh("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: Z, timestamp: Date.now() }, e));
}
function f(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
f.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Wh(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), tn(o.MOUNTED, { componentId: A.id, moduleId: Z }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, tn(o.ERROR, { componentId: A.id, moduleId: Z, error: e.message }), Promise.reject(e);
  }
};
f.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-calendar-trigger", this.element.title = A.label, this.element.setAttribute("aria-label", `Abrir ${A.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", A.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-calendar"), this.element.innerHTML = `<img src="${A.icon}" alt="${A.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
f.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(A.route, Z);
  }, this.element.addEventListener("click", this._clickHandler));
};
f.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
f.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, tn(o.UNMOUNTED, { componentId: A.id, moduleId: Z }), Promise.resolve(this));
};
f.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
f.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ht.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Ht.isInitialized(), version: $n, moduleId: Z, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
f.prototype.info = function() {
  return { version: $n, moduleId: Z, id: Xo, capabilities: Qo, config: Object.assign({}, A), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ht.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function Xh(t) {
  return new f(t);
}
var Qh = f;
const td = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Z,
  PanelCalendarComponent: f,
  VERSION: $n,
  capabilities: Qo,
  createComponent: Xh,
  default: Qh,
  getPorts: Zh,
  id: Xo,
  injectPorts: Jh
}, Symbol.toStringTag, { value: "Module" })), On = "8.8.0-ES6", ta = "panel-chatgpt", ea = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, X = "header/components/panel-chatgpt", $ = { id: "panel-chatgpt", label: "ChatGPT", route: "#/integrations/chatgpt", icon: "/assets/icons/system/header/chatgpt.svg" }, Nt = a({ moduleId: X });
function ed() {
  Nt.init();
}
function sd(t) {
  return Nt.get(t);
}
function nd(t) {
  return Nt.inject(t);
}
function id() {
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
  const s = sd("eventBus");
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
    if (ed(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), en(o.MOUNTED, { componentId: $.id, moduleId: X }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, en(o.ERROR, { componentId: $.id, moduleId: X, error: e.message }), Promise.reject(e);
  }
};
g.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-chatgpt-trigger", this.element.title = $.label, this.element.setAttribute("aria-label", `Abrir ${$.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", $.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-chatgpt"), this.element.innerHTML = `<img src="${$.icon}" alt="${$.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
g.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D($.route, X);
  }, this.element.addEventListener("click", this._clickHandler));
};
g.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
g.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, en(o.UNMOUNTED, { componentId: $.id, moduleId: X }), Promise.resolve(this));
};
g.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
g.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Nt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Nt.isInitialized(), version: On, moduleId: X, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
g.prototype.info = function() {
  return { version: On, moduleId: X, id: ta, capabilities: ea, config: Object.assign({}, $), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Nt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function rd(t) {
  return new g(t);
}
var od = g;
const ad = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: X,
  PanelChatgptComponent: g,
  VERSION: On,
  capabilities: ea,
  createComponent: rd,
  default: od,
  getPorts: id,
  id: ta,
  injectPorts: nd
}, Symbol.toStringTag, { value: "Module" })), Mn = "8.8.0-ES6", sa = "panel-google-drive", na = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, Q = "header/components/panel-google-drive", O = { id: "panel-google-drive", label: "Google Drive", route: "#/integrations/google-drive", icon: "/assets/icons/system/header/google-drive.svg" }, jt = a({ moduleId: Q });
function cd() {
  jt.init();
}
function ld(t) {
  return jt.get(t);
}
function ud(t) {
  return jt.inject(t);
}
function hd() {
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
  const s = ld("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: Q, timestamp: Date.now() }, e));
}
function _(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
_.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (cd(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), sn(o.MOUNTED, { componentId: O.id, moduleId: Q }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, sn(o.ERROR, { componentId: O.id, moduleId: Q, error: e.message }), Promise.reject(e);
  }
};
_.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-google-drive-trigger", this.element.title = O.label, this.element.setAttribute("aria-label", `Abrir ${O.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", O.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-google-drive"), this.element.innerHTML = `<img src="${O.icon}" alt="${O.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
_.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(O.route, Q);
  }, this.element.addEventListener("click", this._clickHandler));
};
_.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
_.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, sn(o.UNMOUNTED, { componentId: O.id, moduleId: Q }), Promise.resolve(this));
};
_.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
_.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: jt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: jt.isInitialized(), version: Mn, moduleId: Q, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
_.prototype.info = function() {
  return { version: Mn, moduleId: Q, id: sa, capabilities: na, config: Object.assign({}, O), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: jt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function dd(t) {
  return new _(t);
}
var md = _;
const pd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Q,
  PanelGoogleDriveComponent: _,
  VERSION: Mn,
  capabilities: na,
  createComponent: dd,
  default: md,
  getPorts: hd,
  id: sa,
  injectPorts: ud
}, Symbol.toStringTag, { value: "Module" })), Tn = "8.8.0-ES6", ia = "panel-loja-integrada", ra = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, tt = "header/components/panel-loja-integrada", M = { id: "panel-loja-integrada", label: "Loja Integrada", route: "#/integrations/loja-integrada", icon: "/assets/icons/system/header/loja-integrada.svg" }, Bt = a({ moduleId: tt });
function fd() {
  Bt.init();
}
function gd(t) {
  return Bt.get(t);
}
function _d(t) {
  return Bt.inject(t);
}
function bd() {
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
  const s = gd("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: tt, timestamp: Date.now() }, e));
}
function b(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
b.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (fd(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), nn(o.MOUNTED, { componentId: M.id, moduleId: tt }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, nn(o.ERROR, { componentId: M.id, moduleId: tt, error: e.message }), Promise.reject(e);
  }
};
b.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-loja-integrada-trigger", this.element.title = M.label, this.element.setAttribute("aria-label", `Abrir ${M.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", M.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-loja-integrada"), this.element.innerHTML = `<img src="${M.icon}" alt="${M.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
b.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(M.route, tt);
  }, this.element.addEventListener("click", this._clickHandler));
};
b.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
b.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, nn(o.UNMOUNTED, { componentId: M.id, moduleId: tt }), Promise.resolve(this));
};
b.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
b.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Bt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Bt.isInitialized(), version: Tn, moduleId: tt, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
b.prototype.info = function() {
  return { version: Tn, moduleId: tt, id: ia, capabilities: ra, config: Object.assign({}, M), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Bt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function yd(t) {
  return new b(t);
}
var Cd = b;
const vd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: tt,
  PanelLojaIntegradaComponent: b,
  VERSION: Tn,
  capabilities: ra,
  createComponent: yd,
  default: Cd,
  getPorts: bd,
  id: ia,
  injectPorts: _d
}, Symbol.toStringTag, { value: "Module" })), Pn = "8.8.0-ES6", oa = "panel-maps", aa = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, et = "header/components/panel-maps", T = { id: "panel-maps", label: "Mapas", route: "#/location", icon: "/assets/icons/system/header/maps.svg" }, zt = a({ moduleId: et });
function Ed() {
  zt.init();
}
function Dd(t) {
  return zt.get(t);
}
function kd(t) {
  return zt.inject(t);
}
function Id() {
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
  const s = Dd("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: et, timestamp: Date.now() }, e));
}
function y(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
y.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Ed(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), rn(o.MOUNTED, { componentId: T.id, moduleId: et }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, rn(o.ERROR, { componentId: T.id, moduleId: et, error: e.message }), Promise.reject(e);
  }
};
y.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-maps-trigger", this.element.title = T.label, this.element.setAttribute("aria-label", `Abrir ${T.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", T.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-maps"), this.element.innerHTML = `<img src="${T.icon}" alt="${T.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
y.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(T.route, et);
  }, this.element.addEventListener("click", this._clickHandler));
};
y.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
y.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, rn(o.UNMOUNTED, { componentId: T.id, moduleId: et }), Promise.resolve(this));
};
y.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
y.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: zt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: zt.isInitialized(), version: Pn, moduleId: et, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
y.prototype.info = function() {
  return { version: Pn, moduleId: et, id: oa, capabilities: aa, config: Object.assign({}, T), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: zt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
var Sd = y;
const Ad = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: et,
  PanelMapsComponent: y,
  VERSION: Pn,
  capabilities: aa,
  createComponent: wd,
  default: Sd,
  getPorts: Id,
  id: oa,
  injectPorts: kd
}, Symbol.toStringTag, { value: "Module" })), Rn = "8.8.0-ES6", ca = "panel-mercado-livre", la = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, st = "header/components/panel-mercado-livre", P = { id: "panel-mercado-livre", label: "Mercado Livre", route: "#/panel-mercadolivre", icon: "/assets/icons/system/header/mercado-livre.svg" }, qt = a({ moduleId: st });
function $d() {
  qt.init();
}
function Od(t) {
  return qt.get(t);
}
function Md(t) {
  return qt.inject(t);
}
function Td() {
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
  const s = Od("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: st, timestamp: Date.now() }, e));
}
function C(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
C.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if ($d(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), on(o.MOUNTED, { componentId: P.id, moduleId: st }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, on(o.ERROR, { componentId: P.id, moduleId: st, error: e.message }), Promise.reject(e);
  }
};
C.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-mercado-livre-trigger", this.element.title = P.label, this.element.setAttribute("aria-label", `Abrir ${P.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", P.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-mercado-livre"), this.element.innerHTML = `<img src="${P.icon}" alt="${P.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
C.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(P.route, st);
  }, this.element.addEventListener("click", this._clickHandler));
};
C.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
C.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, on(o.UNMOUNTED, { componentId: P.id, moduleId: st }), Promise.resolve(this));
};
C.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
C.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: qt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: qt.isInitialized(), version: Rn, moduleId: st, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
C.prototype.info = function() {
  return { version: Rn, moduleId: st, id: ca, capabilities: la, config: Object.assign({}, P), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: qt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
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
function Pd(t) {
  return new C(t);
}
var Rd = C;
const Ld = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: st,
  PanelMercadoLivreComponent: C,
  VERSION: Rn,
  capabilities: la,
  createComponent: Pd,
  default: Rd,
  getPorts: Td,
  id: ca,
  injectPorts: Md
}, Symbol.toStringTag, { value: "Module" })), Ln = "8.8.0-ES6", ua = "panel-pipedrive", ha = { type: "panel", reorderable: !0, hideable: !0, critical: !1, rendersUI: !0 }, nt = "header/components/panel-pipedrive", R = { id: "panel-pipedrive", label: "Pipedrive", route: "#/panel-pipedrive", icon: "/assets/icons/system/header/pipedrive.svg" }, Vt = a({ moduleId: nt });
function Ud() {
  Vt.init();
}
function xd(t) {
  return Vt.get(t);
}
function Hd(t) {
  return Vt.inject(t);
}
function Nd() {
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
  const s = xd("eventBus");
  s && s.emit && s.emit(t, Object.assign({ source: nt, timestamp: Date.now() }, e));
}
function v(t) {
  t = t || {}, this.container = t.container || null, this.element = null, this._isMounted = !1, this._isDestroyed = !1, this._clickHandler = null, this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
v.prototype.mount = function(t) {
  if (this._isDestroyed)
    return this._metrics.errorCount++, Promise.resolve(this);
  if (this._isMounted) return Promise.resolve(this);
  try {
    if (Ud(), this.container = t || this.container, !this.container) throw new Error("Container required");
    return this._render(), this._attachEvents(), this._isMounted = !0, this._metrics.mountCount++, this._metrics.lastMountAt = Date.now(), an(o.MOUNTED, { componentId: R.id, moduleId: nt }), Promise.resolve(this);
  } catch (e) {
    return this._metrics.errorCount++, an(o.ERROR, { componentId: R.id, moduleId: nt, error: e.message }), Promise.reject(e);
  }
};
v.prototype._render = function() {
  this.element = document.createElement("button"), this.element.type = "button", this.element.className = "header-panel-trigger panel-pipedrive-trigger", this.element.title = R.label, this.element.setAttribute("aria-label", `Abrir ${R.label}`), this.element.setAttribute("aria-haspopup", "dialog"), this.element.setAttribute("data-panel-trigger", R.id), this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-pipedrive"), this.element.innerHTML = `<img src="${R.icon}" alt="${R.label}" class="trigger-icon" loading="lazy" />`, this.container.appendChild(this.element);
};
v.prototype._attachEvents = function() {
  const t = this;
  this.element && (this._clickHandler = (e) => {
    e.preventDefault(), t._metrics.clickCount++, t._metrics.lastClickAt = Date.now(), D(R.route, nt);
  }, this.element.addEventListener("click", this._clickHandler));
};
v.prototype._detachEvents = function() {
  this.element && this._clickHandler && (this.element.removeEventListener("click", this._clickHandler), this._clickHandler = null);
};
v.prototype.unmount = function() {
  return !this._isMounted || this._isDestroyed ? Promise.resolve(this) : (this._detachEvents(), this.element && (this.element.remove(), this.element = null), this._isMounted = !1, this._metrics.unmountCount++, an(o.UNMOUNTED, { componentId: R.id, moduleId: nt }), Promise.resolve(this));
};
v.prototype.destroy = function() {
  this._isDestroyed || (this.unmount(), this._isDestroyed = !0, this.container = null);
};
v.prototype.healthCheck = function() {
  const t = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Vt.isInitialized() }, e = Object.values(t).filter(Boolean).length, s = Object.keys(t).length;
  return { status: e === s ? "HEALTHY" : e >= 4 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: s, scoreDisplay: `${e}/${s}`, checks: t, portsInitialized: Vt.isInitialized(), version: Ln, moduleId: nt, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
v.prototype.info = function() {
  return { version: Ln, moduleId: nt, id: ua, capabilities: ha, config: Object.assign({}, R), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Vt.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
v.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
v.prototype.isMounted = function() {
  return this._isMounted;
};
v.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
v.prototype.getElement = function() {
  return this.element;
};
function jd(t) {
  return new v(t);
}
var Bd = v;
const zd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: nt,
  PanelPipedriveComponent: v,
  VERSION: Ln,
  capabilities: ha,
  createComponent: jd,
  default: Bd,
  getPorts: Nd,
  id: ua,
  injectPorts: Hd
}, Symbol.toStringTag, { value: "Module" })), Mm = {
  "currency-rotator": Ma,
  "errors-status": Ja,
  notifications: gc,
  "real-time-clock": Ac,
  "weather-sp": Fc,
  "user-menu": Yl,
  logo: iu,
  "email-integration": Du,
  "whatsapp-integration": zu,
  "instagram-messenger-integration": ah,
  "wechat-integration": wh,
  "panel-adwords": Ph,
  "panel-asaas": jh,
  "panel-bling": Fh,
  "panel-calendar": td,
  "panel-chatgpt": ad,
  "panel-google-drive": pd,
  "panel-loja-integrada": vd,
  "panel-maps": Ad,
  "panel-mercado-livre": Ld,
  "panel-pipedrive": zd
};
export {
  Mm as HEADER_COMPONENTS
};
