import { createCorePorts as ae } from "/core/runtime/ports-profiles.js";
import { isStrict as F } from "/core/runtime/enterprise/strict-mode.js";
const v = "core.js.event-bus", le = ae({ moduleId: v });
function j(t) {
  return le.get(t);
}
const k = Object.freeze({
  SYSTEM: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
}), de = Object.freeze({
  debug: !1,
  maxHistorySize: 100,
  maxListenersPerEvent: 50,
  defaultTimeout: 5e3,
  telemetryEnabled: !0,
  maxLogSize: 500
}), ue = () => {
  var t, e;
  return ((e = (t = j("config")) == null ? void 0 : t.app) == null ? void 0 : e.debug) ?? !1;
}, _ = (t, ...e) => {
  var r, s, i;
  const n = j("logger");
  if (n) {
    if (t === "error") {
      (r = n.error) == null || r.call(n, `[${v}]`, ...e);
      return;
    }
    if (t === "warn") {
      (s = n.warn) == null || s.call(n, `[${v}]`, ...e);
      return;
    }
    ue() && ((i = n.debug) == null || i.call(n, `[${v}]`, ...e));
  }
};
class he {
  constructor() {
    this._registry = /* @__PURE__ */ new Map(), this._stats = { prevented: 0 };
  }
  generateKey(e, r, s) {
    const i = r.toString().slice(0, 200);
    return `${e}|${i}|${s}`;
  }
  isDuplicate(e, r, s) {
    const i = this.generateKey(e, r, s);
    return this._registry.has(i);
  }
  register(e, r, s, i) {
    const n = this.generateKey(e, r, s);
    this._registry.set(n, i);
  }
  unregister(e, r, s) {
    const i = this.generateKey(e, r, s);
    this._registry.delete(i);
  }
  preventDuplicate() {
    this._stats.prevented++;
  }
  clear() {
    this._registry.clear();
  }
  get size() {
    return this._registry.size;
  }
  get preventedCount() {
    return this._stats.prevented;
  }
  getStats() {
    return { registrySize: this._registry.size, prevented: this._stats.prevented };
  }
}
class ge {
  constructor() {
    this._stats = { matches: 0 };
  }
  matches(e, r) {
    return e === "*" ? !0 : e.indexOf("*") === -1 ? e === r : new RegExp(`^${e.replace(/\*/g, ".*")}$`).test(r);
  }
  getMatchingListeners(e, r, s) {
    const i = [];
    for (const n of [r, s])
      for (const [o, c] of n)
        if (o !== e && this.matches(o, e))
          for (const d of c)
            i.push({ ...d, matchedPattern: o }), this._stats.matches++;
    return i;
  }
  get matchCount() {
    return this._stats.matches;
  }
  resetStats() {
    this._stats.matches = 0;
  }
}
const D = "6.1.0-P2-ENTERPRISE", z = "core.js.event-bus.metrics-tracker";
function _e(t = {}) {
  const {
    maxLogSize: e = 500,
    maxHistorySize: r = 100,
    telemetryEnabled: s = !0,
    // Injected ports
    telemetryCore: i = null,
    telemetry: n = null
  } = t;
  let o = {
    telemetryCore: i,
    telemetry: n,
    _initialized: !!(i || n)
  };
  const c = {
    emitted: 0,
    handled: 0,
    errors: 0,
    skipped: 0,
    subscribes: 0,
    unsubscribes: 0,
    dedupePrevented: 0,
    timeouts: 0,
    wildcardMatches: 0,
    replays: 0,
    startTime: Date.now()
  }, d = /* @__PURE__ */ new Map();
  let h = [], m = [], a = e, p = r, y = s;
  function L() {
    o._initialized || (typeof window < "u" && (o.telemetryCore || (o.telemetryCore = window.TelemetryCore || null), o.telemetry || (o.telemetry = window.Telemetry || null)), o._initialized = !0);
  }
  function U(l = {}) {
    return l.telemetryCore && (o.telemetryCore = l.telemetryCore), l.telemetry && (o.telemetry = l.telemetry), o._initialized = !0, o;
  }
  function V() {
    return { ...o };
  }
  function G(l, u = 1) {
    c.hasOwnProperty(l) && (c[l] += u);
  }
  function W() {
    return { ...c };
  }
  function I() {
    Object.keys(c).forEach((l) => {
      l === "startTime" ? c[l] = Date.now() : c[l] = 0;
    });
  }
  function K(l, u, g = null) {
    d.has(l) || d.set(l, {
      emits: 0,
      handled: 0,
      errors: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: 1 / 0
    });
    const f = d.get(l);
    u === "emits" && f.emits++, u === "handled" && f.handled++, u === "errors" && f.errors++, g !== null && (f.totalDuration += g, f.maxDuration = Math.max(f.maxDuration, g), f.minDuration = Math.min(f.minDuration, g));
  }
  function q(l = null) {
    return l ? d.get(l) ?? null : P();
  }
  function P() {
    const l = {};
    return d.forEach((u, g) => {
      l[g] = {
        ...u,
        avgDuration: u.handled > 0 ? (u.totalDuration / u.handled).toFixed(2) : 0,
        errorRate: u.emits > 0 ? `${(u.errors / u.emits * 100).toFixed(2)}%` : "0%"
      };
    }), l;
  }
  function b() {
    d.clear();
  }
  function J(l, u, g = {}) {
    h.push({
      action: l,
      event: u,
      data: g,
      timestamp: Date.now()
    }), h.length > a && h.shift();
  }
  function Q() {
    return [...h];
  }
  function X(l = 20) {
    return h.slice(-l);
  }
  function O() {
    h = [];
  }
  function Z(l = 10) {
    const u = {};
    return h.forEach((g) => {
      g.action === "emit" && (u[g.event] = (u[g.event] || 0) + 1);
    }), Object.entries(u).sort((g, f) => f[1] - g[1]).slice(0, l).map(([g, f]) => ({ event: g, count: f }));
  }
  function N(l) {
    m.push(l), m.length > p && m.shift();
  }
  function ee() {
    return [...m];
  }
  function te(l) {
    return m.filter((u) => u.name === l);
  }
  function B() {
    m = [];
  }
  function re() {
    return m.length;
  }
  function se(l, u) {
    var g, f;
    if (y) {
      if (L(), (g = o.telemetryCore) != null && g.track)
        try {
          o.telemetryCore.track(l, u);
        } catch {
        }
      if ((f = o.telemetry) != null && f.track)
        try {
          o.telemetry.track(l, u);
        } catch {
        }
    }
  }
  function ie(l) {
    y = !!l;
  }
  function ne(l = 0, u = 0, g = !1) {
    L();
    const f = l > 500, M = c.emitted > 100 && c.errors / c.emitted > 0.05, A = c.handled > 100 && c.timeouts / c.handled > 0.1, $ = {
      notDestroyed: !g,
      noLeaks: !f,
      lowErrorRate: !M,
      lowTimeoutRate: !A,
      cacheHealthy: u < 1e3,
      dedupeWorking: c.dedupePrevented >= 0,
      portsInitialized: o._initialized
    }, S = Object.values($).filter(Boolean).length, R = Object.keys($).length, T = [];
    return g && T.push("EventBus is destroyed"), f && T.push(`High listener count: ${l}`), M && T.push(`High error rate: ${(c.errors / c.emitted * 100).toFixed(2)}%`), A && T.push(`High timeout rate: ${(c.timeouts / c.handled * 100).toFixed(2)}%`), {
      status: S === R ? "HEALTHY" : S >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: `${S}/${R}`,
      healthy: S === R,
      checks: $,
      issues: T.length > 0 ? T : null,
      version: D,
      moduleId: z,
      listenerCount: l,
      stats: { ...c },
      architecture: "FACTORY-PATTERN-P24",
      p24Instrumented: !0,
      timestamp: Date.now()
    };
  }
  function oe() {
    return L(), {
      moduleId: z,
      version: D,
      architecture: "FACTORY-PATTERN-P24",
      telemetryEnabled: y,
      portsInitialized: o._initialized,
      hasTelemetryCore: !!o.telemetryCore,
      hasTelemetry: !!o.telemetry,
      eventMetricsCount: d.size,
      eventLogSize: h.length,
      historySize: m.length,
      stats: { ...c },
      p24Instrumented: !0,
      timestamp: Date.now()
    };
  }
  function ce() {
    I(), b(), O(), B();
  }
  return {
    // Stats
    increment: G,
    getStats: W,
    resetStats: I,
    // Event Metrics
    updateEventMetrics: K,
    getEventMetrics: q,
    getEventMetricsSummary: P,
    clearEventMetrics: b,
    // Event Log
    addToLog: J,
    getEventLog: Q,
    getRecentEvents: X,
    clearEventLog: O,
    getTopEvents: Z,
    // History
    addToHistory: N,
    getHistory: ee,
    getHistoryByEvent: te,
    clearHistory: B,
    get historySize() {
      return re();
    },
    // Telemetry
    trackTelemetry: se,
    setTelemetryEnabled: ie,
    // Diagnostics
    healthCheck: ne,
    info: oe,
    // Lifecycle
    reset: ce,
    // Ports (P24)
    injectPorts: U,
    getPorts: V,
    // Identity
    VERSION: D,
    MODULE_ID: z
  };
}
class fe {
  constructor(e = {}) {
    this._tracker = _e(e), this.increment = this._tracker.increment, this.getStats = this._tracker.getStats, this.resetStats = this._tracker.resetStats, this.updateEventMetrics = this._tracker.updateEventMetrics, this.getEventMetrics = this._tracker.getEventMetrics, this.getEventMetricsSummary = this._tracker.getEventMetricsSummary, this.clearEventMetrics = this._tracker.clearEventMetrics, this.addToLog = this._tracker.addToLog, this.getEventLog = this._tracker.getEventLog, this.getRecentEvents = this._tracker.getRecentEvents, this.clearEventLog = this._tracker.clearEventLog, this.getTopEvents = this._tracker.getTopEvents, this.addToHistory = this._tracker.addToHistory, this.getHistory = this._tracker.getHistory, this.getHistoryByEvent = this._tracker.getHistoryByEvent, this.clearHistory = this._tracker.clearHistory, this.trackTelemetry = this._tracker.trackTelemetry, this.setTelemetryEnabled = this._tracker.setTelemetryEnabled, this.healthCheck = this._tracker.healthCheck, this.info = this._tracker.info, this.reset = this._tracker.reset, this.injectPorts = this._tracker.injectPorts, this.getPorts = this._tracker.getPorts;
  }
  get historySize() {
    return this._tracker.historySize;
  }
  get VERSION() {
    return D;
  }
  get MODULE_ID() {
    return z;
  }
}
class me {
  constructor(e, r, s) {
    this._listeners = e, this._onceListeners = r, this._registry = s;
  }
  updateMaps(e, r) {
    this._listeners = e, this._onceListeners = r;
  }
  listAll() {
    var e;
    const r = {};
    for (const [s, i] of this._listeners)
      r[s] = { persistent: i.size, once: ((e = this._onceListeners.get(s)) == null ? void 0 : e.size) || 0 };
    for (const [s, i] of this._onceListeners)
      r[s] || (r[s] = { persistent: 0, once: i.size });
    return r;
  }
  detectLeaks(e = 10) {
    const r = [], s = this.listAll();
    for (const [i, n] of Object.entries(s)) {
      const o = n.persistent + n.once;
      o >= e && r.push({ eventName: i, persistent: n.persistent, once: n.once, total: o });
    }
    return r.sort((i, n) => n.total - i.total);
  }
  getDedupeStats() {
    var e, r;
    return { prevented: ((e = this._registry) == null ? void 0 : e.preventedCount) || 0, registrySize: ((r = this._registry) == null ? void 0 : r.size) || 0 };
  }
  getListenersByEvent(e) {
    const r = [], s = [];
    if (this._listeners.has(e))
      for (const i of this._listeners.get(e))
        r.push({ id: i.id, priority: i.priority, sourceModule: i.sourceModule, addedAt: i.addedAt });
    if (this._onceListeners.has(e))
      for (const i of this._onceListeners.get(e))
        s.push({ id: i.id, priority: i.priority, sourceModule: i.sourceModule, addedAt: i.addedAt });
    return { eventName: e, persistent: r, once: s, total: r.length + s.length };
  }
  getTotalListenerCount() {
    let e = 0;
    for (const r of this._listeners.values())
      e += r.size;
    for (const r of this._onceListeners.values())
      e += r.size;
    return e;
  }
  getEventNames() {
    const e = /* @__PURE__ */ new Set();
    for (const r of this._listeners.keys())
      e.add(r);
    for (const r of this._onceListeners.keys())
      e.add(r);
    return Array.from(e);
  }
  hasListeners(e, r) {
    if (this._listeners.has(e) || this._onceListeners.has(e)) return !0;
    for (const s of this._listeners.keys())
      if (r.matches(s, e)) return !0;
    for (const s of this._onceListeners.keys())
      if (r.matches(s, e)) return !0;
    return !1;
  }
  getListenerCount(e, r) {
    var s, i;
    let n = (((s = this._listeners.get(e)) == null ? void 0 : s.size) || 0) + (((i = this._onceListeners.get(e)) == null ? void 0 : i.size) || 0);
    for (const [o, c] of this._listeners)
      o !== e && r.matches(o, e) && (n += c.size);
    return n;
  }
}
const H = (t, e, r, s = {}) => {
  var i, n;
  if (t._isDestroyed)
    return _("warn", "Cannot subscribe - EventBus is destroyed"), () => {
    };
  if (typeof e != "string" || !e) throw new Error("EventBus.on: eventName must be a non-empty string");
  if (typeof r != "function") throw new Error("EventBus.on: handler must be a function");
  const o = s.priority !== void 0 ? s.priority : k.NORMAL, c = s.timeout !== void 0 ? s.timeout : null, d = s.sourceModule || s.source || "unknown";
  if (!s.allowDuplicate && t._registry.isDuplicate(e, r, o))
    return t._registry.preventDuplicate(), t._metrics.increment("dedupePrevented"), _("info", `Dedupe prevented duplicate for "${e}"`), () => {
    };
  const h = s.once ? t._onceListeners : t._listeners;
  h.has(e) || h.set(e, /* @__PURE__ */ new Set());
  const m = (((i = t._listeners.get(e)) == null ? void 0 : i.size) || 0) + (((n = t._onceListeners.get(e)) == null ? void 0 : n.size) || 0);
  m >= t.maxListenersPerEvent && (_("warn", `Max listeners (${t.maxListenersPerEvent}) reached for "${e}"`), t._metrics.trackTelemetry("eventbus:max-listeners", { eventName: e, count: m }));
  const a = `${e}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, p = { handler: r, priority: o, context: s.context || null, once: s.once || !1, timeout: c, sourceModule: d, addedAt: Date.now(), id: a };
  return h.get(e).add(p), t._registry.register(e, r, o, a), t._invalidateCache(e), t._metrics.increment("subscribes"), t._metrics.addToLog("subscribe", e, { once: s.once || !1, priority: o, sourceModule: d }), _("info", `Subscribed to "${e}" (priority: ${o}, source: ${d})`), () => {
    Y(t, e, p, h), t._registry.unregister(e, r, o), t._metrics.increment("unsubscribes");
  };
}, ye = (t, e, r, s) => ({ unsubscribe: H(t, e, r, s), eventName: e, handler: r }), pe = (t, e, r, s) => {
  if (!Array.isArray(e)) throw new Error("subscribeMultiple: eventNames must be an array");
  const i = e.map((n) => H(t, n, r, s));
  return { unsubscribe: () => {
    for (const n of i)
      n();
  }, eventNames: e, count: e.length };
}, Ee = (t, e, r, s = {}) => (s.once = !0, H(t, e, r, s)), C = (t, e, r) => {
  if (!r) {
    for (const s of [t._listeners, t._onceListeners])
      if (s.has(e)) {
        for (const i of s.get(e))
          t._registry.unregister(e, i.handler, i.priority);
        s.delete(e);
      }
    t._invalidateCache(e), t._metrics.addToLog("unsubscribe-all", e);
    return;
  }
  for (const s of [t._listeners, t._onceListeners])
    if (s.has(e)) {
      const i = s.get(e);
      for (const n of i)
        n.handler === r && (i.delete(n), t._registry.unregister(e, n.handler, n.priority), t._metrics.increment("unsubscribes"));
      i.size === 0 && s.delete(e);
    }
  t._invalidateCache(e), t._metrics.addToLog("unsubscribe", e);
}, Le = (t, e) => {
  if (e)
    C(t, e);
  else {
    for (const r of t._listeners.keys())
      C(t, r);
    for (const r of t._onceListeners.keys())
      C(t, r);
    t._registry.clear();
  }
  _("info", e ? `Removed all listeners for "${e}"` : "Removed ALL listeners");
}, Y = (t, e, r, s) => {
  s.has(e) && (s.get(e).delete(r), s.get(e).size === 0 && s.delete(e), t._invalidateCache(e));
}, ve = async (t, e, r, s, i) => i ? new Promise((n, o) => {
  const c = setTimeout(() => {
    t._metrics.increment("timeouts"), o(new Error(`Timeout after ${i}ms`));
  }, i);
  Promise.resolve(e.handler.call(e.context, r, s)).then((d) => {
    clearTimeout(c), n(d);
  }).catch((d) => {
    clearTimeout(c), o(d);
  });
}) : await e.handler.call(e.context, r, s), we = async (t, e, r = null, s = {}) => {
  if (t._isDestroyed)
    return _("warn", "Cannot emit - EventBus is destroyed"), [];
  t._metrics.increment("emitted"), t._metrics.updateEventMetrics(e, "emits");
  const i = { name: e, data: r, timestamp: Date.now(), options: s };
  t._metrics.addToHistory(i), t._metrics.addToLog("emit", e, r);
  const n = x(t, e), o = t._wildcardMatcher.getMatchingListeners(e, t._listeners, t._onceListeners), c = n.concat(o);
  if (c.length === 0)
    return t._metrics.increment("skipped"), _("info", `No listeners for "${e}", skipping`), [];
  _("info", `Emitting "${e}" to ${c.length} listeners`, r);
  const d = c.sort((a, p) => a.priority - p.priority), h = [], m = [];
  for (const a of d) {
    const p = Date.now();
    try {
      const y = a.timeout !== void 0 ? a.timeout : t.defaultTimeout, L = await ve(t, a, r, i, y);
      h.push(L), t._metrics.increment("handled"), t._metrics.updateEventMetrics(e, "handled", Date.now() - p), a.once && m.push({ eventName: a.matchedPattern || e, listener: a });
    } catch (y) {
      const L = { eventName: e, handlerId: a.id, sourceModule: a.sourceModule, error: y.message, timestamp: Date.now() };
      _("error", `Handler error for "${e}":`, L), t._metrics.increment("errors"), t._metrics.updateEventMetrics(e, "errors"), t._metrics.addToLog("error", e, L), t._metrics.trackTelemetry("eventbus:handler-error", L), h.push({ error: y.message, handlerId: a.id });
    }
  }
  for (const a of m)
    t._onceListeners.has(a.eventName) && (t._onceListeners.get(a.eventName).delete(a.listener), t._registry.unregister(a.eventName, a.listener.handler, a.listener.priority), t._invalidateCache(a.eventName));
  return h;
}, Te = (t, e, r = null, s = {}) => {
  if (t._isDestroyed)
    return _("warn", "Cannot emit - EventBus is destroyed"), [];
  t._metrics.increment("emitted"), t._metrics.updateEventMetrics(e, "emits");
  const i = { name: e, data: r, timestamp: Date.now(), options: s };
  t._metrics.addToHistory(i);
  const n = x(t, e), o = t._wildcardMatcher.getMatchingListeners(e, t._listeners, t._onceListeners), c = n.concat(o);
  if (c.length === 0)
    return t._metrics.increment("skipped"), [];
  _("info", `Emitting sync "${e}"`, r);
  const d = c.sort((a, p) => a.priority - p.priority), h = [], m = [];
  for (const a of d) {
    const p = Date.now();
    try {
      const y = a.handler.call(a.context, r, i);
      h.push(y), t._metrics.increment("handled"), t._metrics.updateEventMetrics(e, "handled", Date.now() - p), a.once && m.push({ eventName: a.matchedPattern || e, listener: a });
    } catch (y) {
      _("error", `Handler error for "${e}":`, { error: y.message }), t._metrics.increment("errors"), t._metrics.updateEventMetrics(e, "errors"), h.push({ error: y.message });
    }
  }
  for (const a of m)
    t._onceListeners.has(a.eventName) && (t._onceListeners.get(a.eventName).delete(a.listener), t._registry.unregister(a.eventName, a.listener.handler, a.listener.priority), t._invalidateCache(a.eventName));
  return h;
}, x = (t, e) => {
  const r = [], s = [t._listeners, t._onceListeners];
  for (const i of s)
    if (i.has(e))
      for (const n of i.get(e))
        r.push(n);
  return r;
}, ke = (t, e, r, s = {}) => {
  t._metrics.increment("replays");
  const i = t._metrics.getHistoryByEvent(e);
  if (i.length === 0)
    return _("info", `No history to replay for "${e}"`), { replayed: 0, events: [] };
  const n = s.limit !== void 0 ? s.limit : i.length, o = i.slice(-n);
  _("info", `Replaying ${o.length} events for "${e}"`);
  const c = [];
  for (const d of o)
    try {
      const h = r(d.data, d);
      c.push({ success: !0, result: h, event: d });
    } catch (h) {
      c.push({ success: !1, error: h.message, event: d });
    }
  return { replayed: c.length, events: c };
}, Me = (t, e, r = 0) => new Promise((s, i) => {
  let n = null;
  const o = t.once(e, (c) => {
    n && clearTimeout(n), s(c);
  });
  r > 0 && (n = setTimeout(() => {
    o(), i(new Error(`Timeout waiting for event "${e}"`));
  }, r));
}), Se = (t, e) => {
  t._sortedCache.delete(e);
  for (const [r] of t._sortedCache)
    (t._wildcardMatcher.matches(r, e) || t._wildcardMatcher.matches(e, r)) && t._sortedCache.delete(r);
}, De = (t) => {
  const e = t._metrics.getStats();
  return { totalEvents: e.totalEvents, emitted: e.emitted, handled: e.handled, errors: e.errors, listeners: t._debugHelpers.getTotalListenerCount(), historySize: t._metrics.historySize, cacheSize: t._sortedCache.size, registrySize: t._registry.size, uptime: Date.now() - e.startTime };
}, w = "5.2.0-STRICT-MODE";
class ze {
  constructor(e = {}) {
    const r = { ...de, ...e };
    this.debug = r.debug, this.maxHistorySize = r.maxHistorySize, this.maxListenersPerEvent = r.maxListenersPerEvent, this.defaultTimeout = r.defaultTimeout, this._listeners = /* @__PURE__ */ new Map(), this._onceListeners = /* @__PURE__ */ new Map(), this._sortedCache = /* @__PURE__ */ new Map(), this._isDestroyed = !1, this._registry = new he(), this._wildcardMatcher = new ge(), this._metrics = new fe({
      maxLogSize: r.maxLogSize,
      maxHistorySize: r.maxHistorySize,
      telemetryEnabled: r.telemetryEnabled
    }), this._debugHelpers = new me(this._listeners, this._onceListeners, this._registry), _("info", `${w} initialized (modular)${this.debug ? " [debug]" : ""}`);
  }
  get version() {
    return w;
  }
  get name() {
    return v;
  }
  get moduleId() {
    return v;
  }
  static get PRIORITY() {
    return k;
  }
  get PRIORITY() {
    return k;
  }
  getVersion() {
    return w;
  }
  // Subscribe methods
  on(e, r, s = {}) {
    return H(this, e, r, s);
  }
  once(e, r, s = {}) {
    return Ee(this, e, r, s);
  }
  off(e, r = null) {
    return C(this, e, r);
  }
  subscribe(e, r, s = {}) {
    return ye(this, e, r, s);
  }
  subscribeMultiple(e, r, s = {}) {
    return pe(this, e, r, s);
  }
  removeAllListeners(e = null) {
    return Le(this, e);
  }
  // Emit methods
  async emit(e, r = null, s = {}) {
    return we(this, e, r, s);
  }
  emitSync(e, r = null, s = {}) {
    return Te(this, e, r, s);
  }
  // Helpers
  replay(e, r, s = {}) {
    return ke(this, e, r, s);
  }
  waitFor(e, r = 0) {
    return Me(this, e, r);
  }
  _invalidateCache(e) {
    return Se(this, e);
  }
  _getMatchingListeners(e) {
    return x(this, e);
  }
  _removeListener(e, r, s) {
    return Y(this, e, r, s);
  }
  // Status & Health
  getStatus() {
    return {
      version: w,
      moduleId: v,
      initialized: !this._isDestroyed,
      destroyed: this._isDestroyed,
      debug: this.debug,
      stats: this.getStats(),
      listenerCount: this._debugHelpers.getTotalListenerCount(),
      eventNames: this._debugHelpers.getEventNames(),
      historySize: this._metrics.historySize,
      cacheSize: this._sortedCache.size,
      uptime: Date.now() - this._metrics.getStats().startTime
    };
  }
  healthCheck() {
    return this._metrics.healthCheck(this._debugHelpers.getTotalListenerCount(), this._sortedCache.size, this._isDestroyed);
  }
  info() {
    return {
      moduleId: v,
      version: w,
      destroyed: this._isDestroyed,
      features: ["dedupe", "wildcard", "namespaces", "replay", "timeout", "priority-granular", "modular"],
      priorities: k,
      status: this.getStatus(),
      healthCheck: this.healthCheck(),
      topEvents: this._metrics.getTopEvents(10),
      eventMetrics: this._metrics.getEventMetricsSummary(),
      timestamp: Date.now()
    };
  }
  // Public helpers
  getStats() {
    return De(this);
  }
  getEventNames() {
    return this._debugHelpers.getEventNames();
  }
  hasListeners(e) {
    return this._debugHelpers.hasListeners(e, this._wildcardMatcher);
  }
  getListenerCount(e) {
    return this._debugHelpers.getListenerCount(e, this._wildcardMatcher);
  }
  getListenersByEvent(e) {
    return this._debugHelpers.getListenersByEvent(e);
  }
  getEventMetrics(e) {
    return this._metrics.getEventMetrics(e);
  }
  getEventLog() {
    return this._metrics.getEventLog();
  }
  getRecentEvents(e) {
    return this._metrics.getRecentEvents(e);
  }
  clearEventLog() {
    this._metrics.clearEventLog();
  }
  getHistory() {
    return this._metrics.getHistory();
  }
  getHistoryByEvent(e) {
    return this._metrics.getHistoryByEvent(e);
  }
  // Debug methods
  debug_listAll() {
    return this._debugHelpers.listAll();
  }
  debug_detectLeaks(e) {
    return this._debugHelpers.detectLeaks(e);
  }
  debug_getDedupeStats() {
    return this._debugHelpers.getDedupeStats();
  }
  // Settings
  setDebug(e) {
    this.debug = !!e, _("info", `Debug mode: ${this.debug ? "ON" : "OFF"}`);
  }
  setTelemetry(e) {
    this._metrics.setTelemetryEnabled(e);
  }
  // Lifecycle
  clear() {
    this._listeners.clear(), this._onceListeners.clear(), this._sortedCache.clear(), this._registry.clear(), this._metrics.addToLog("clear", "*"), _("info", "Cleared all listeners");
  }
  reset() {
    this.clear(), this._metrics.reset(), _("info", "Reset complete");
  }
  destroy() {
    this._isDestroyed || (this.clear(), this._metrics.reset(), this._isDestroyed = !0, _("info", "EventBus destroyed"));
  }
  shutdown() {
    return this.destroy();
  }
}
const Ce = typeof window < "u" && window.__DSHOW_DEBUG_EVENTBUS === !0, E = new ze({ debug: Ce });
if (typeof window < "u") {
  const t = F();
  t || (window.EventBus = E, window.EventBusPRIORITY = k, window.getGlobalEventBus = () => window.EventBus), window.__dev = window.__dev || {}, window.__dev.eventBus = {
    getVersion: () => w,
    healthCheck: () => E.healthCheck(),
    info: () => E.info(),
    getStats: () => E.getStats(),
    getEventMetrics: (e) => E.getEventMetrics(e),
    debug_listAll: () => E.debug_listAll(),
    debug_detectLeaks: (e) => E.debug_detectLeaks(e),
    debug_getDedupeStats: () => E.debug_getDedupeStats(),
    getListenersByEvent: (e) => E.getListenersByEvent(e),
    getTopEvents: (e) => E._metrics.getTopEvents(e),
    PRIORITY: k,
    strictMode: t
  };
}
_("info", `${w} loaded as global singleton (modular, strictMode: ${typeof window < "u" && F()})`);
export {
  ze as EventBus,
  v as MODULE_ID,
  k as PRIORITY,
  w as VERSION,
  E as default
};
