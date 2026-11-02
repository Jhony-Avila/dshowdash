import { isStrict as Ve, recordViolation as $e } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts as Ze } from "/core/runtime/ports-profiles.js";
var X = "1.1.0-ENTERPRISE", qe = "telemetry-core/contracts", d = Object.freeze({ DEBUG: "debug", INFO: "info", WARN: "warn", ERROR: "error", CRITICAL: "critical" }), g = Object.freeze({ EVENT: "event", METRIC: "metric", ERROR: "error" }), b = Object.freeze({ required: ["timestamp", "timestampISO", "type", "event", "component", "severity", "traceId", "sessionId", "bootId"], optional: ["context", "data"] }), de = Object.freeze({ required: b.required.concat(["metric"]), metricFields: ["name", "value", "unit"] }), me = Object.freeze({ required: b.required.concat(["error"]), errorFields: ["message", "code"], optionalErrorFields: ["stack"] }), O = Object.freeze({
  TELEMETRY: "telemetry-core",
  EVENTBUS: "eventbus-global",
  ROUTER: "router-global",
  GLOBALSTATE: "global-state",
  MAIN: "main",
  HEADER: "header",
  SIDEBAR: "sidebar",
  FOOTER: "footer",
  PRELOADER: "preloader",
  LOGIN_MODAL: "login-modal",
  PANEL: "panel",
  CARD: "card",
  ORCHESTRATOR: "core-orchestrator",
  AUTH: "auth",
  SESSION: "session",
  PERMISSIONS: "permissions"
}), Ye = Object.freeze({
  INIT: ":init",
  READY: ":ready",
  MOUNT: ":mount",
  UNMOUNT: ":unmount",
  DESTROY: ":destroy",
  UPDATE: ":update",
  REFRESH: ":refresh",
  RESET: ":reset",
  ERROR: ":error",
  WARN: ":warn",
  TIMING: ":timing",
  METRIC: ":metric",
  NAVIGATE: ":navigate",
  ROUTE_CHANGE: ":route-change"
});
function J(e) {
  for (var t = [], r = 0; r < b.required.length; r++) {
    var n = b.required[r];
    (e[n] === void 0 || e[n] === null) && t.push("Missing required field: " + n);
  }
  var o = [g.EVENT, g.METRIC, g.ERROR];
  if (e.type) {
    for (var s = !1, u = 0; u < o.length; u++)
      o[u] === e.type && (s = !0);
    s || t.push("Invalid event type: " + e.type);
  }
  var f = [d.DEBUG, d.INFO, d.WARN, d.ERROR, d.CRITICAL];
  if (e.severity) {
    for (var c = !1, p = 0; p < f.length; p++)
      f[p] === e.severity && (c = !0);
    c || t.push("Invalid severity: " + e.severity);
  }
  if (e.type === g.METRIC) {
    var j = e.metric;
    j ? j.value === void 0 && t.push("Metric must have value") : t.push("Metric events must have metric field");
  }
  if (e.type === g.ERROR) {
    var oe = e.error;
    oe ? oe.message || t.push("Error must have message") : t.push("Error events must have error field");
  }
  return { valid: t.length === 0, errors: t.length > 0 ? t : null };
}
function ge(e, t) {
  if (!e || !t) return null;
  var r = e.toLowerCase().replace(/[^a-z0-9-]/g, "-"), n = t.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return r + ":" + n;
}
function he(e) {
  if (!e || typeof e != "string") return { component: "unknown", action: "unknown" };
  var t = e.split(":");
  return t.length < 2 ? { component: e, action: "event" } : { component: t[0], action: t.slice(1).join(":") };
}
function Ke(e) {
  var t = [];
  for (var r in O)
    Object.prototype.hasOwnProperty.call(O, r) && t.push(O[r]);
  for (var n = 0; n < t.length; n++)
    if (t[n] === e) return !0;
  return e.indexOf("panel") === 0 || e.indexOf("card") === 0 || e.indexOf("p") === 0 || e.indexOf("c") === 0;
}
function k() {
  return { version: X, moduleId: qe, schemas: { base: b, metric: de, error: me }, severities: [d.DEBUG, d.INFO, d.WARN, d.ERROR, d.CRITICAL], eventTypes: [g.EVENT, g.METRIC, g.ERROR], registeredComponents: Object.keys(O).length, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function We() {
  return { status: "HEALTHY", moduleId: qe, version: X, checks: { validateEventReady: typeof J == "function", schemasReady: !!b } };
}
var mt = { VERSION: X, SEVERITIES: d, EVENT_TYPES: g, BASE_SCHEMA: b, METRIC_SCHEMA: de, ERROR_SCHEMA: me, COMPONENT_NAMESPACES: O, STANDARD_EVENTS: Ye, validateEvent: J, createEventName: ge, parseEventName: he, isRegisteredComponent: Ke, info: k, healthCheck: We };
const Q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BASE_SCHEMA: b,
  COMPONENT_NAMESPACES: O,
  ERROR_SCHEMA: me,
  EVENT_TYPES: g,
  METRIC_SCHEMA: de,
  SEVERITIES: d,
  STANDARD_EVENTS: Ye,
  VERSION: X,
  createEventName: ge,
  default: mt,
  healthCheck: We,
  info: k,
  isRegisteredComponent: Ke,
  parseEventName: he,
  validateEvent: J
}, Symbol.toStringTag, { value: "Module" }));
function U() {
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}
function gt() {
  return `ses-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}
function ht() {
  return `boot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}
function ae() {
  return Date.now();
}
function M(e = Date.now()) {
  var u, f, c, p;
  const t = new Date(e), r = ((f = (u = window.APP_CONFIG) == null ? void 0 : u.app) == null ? void 0 : f.timeZone) || "America/Sao_Paulo", n = ((p = (c = window.APP_CONFIG) == null ? void 0 : c.app) == null ? void 0 : p.locale) || "pt-BR";
  let o = null, s = null;
  try {
    o = new Intl.DateTimeFormat(n, { timeZone: r, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !1 }).format(t), s = new Intl.DateTimeFormat(n, { timeZone: r, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !1, timeZoneName: "shortOffset" }).format(t);
  } catch {
    o = t.toLocaleString(n), s = o;
  }
  return { timestampUtc: e, isoUtc: t.toISOString(), localTime: o, localTimeFormatted: s, timeZone: r, locale: n };
}
function z() {
  return Date.now();
}
function pe(e, t) {
  if (!t || typeof t != "object") return e;
  if (!e || typeof e != "object") return t;
  const r = { ...e }, n = t;
  for (const o in n)
    Object.prototype.hasOwnProperty.call(n, o) && n[o] !== void 0 && n[o] !== null && (r[o] = n[o]);
  return r;
}
function Xe(e, t = "{}") {
  try {
    return JSON.stringify(e);
  } catch {
    return t;
  }
}
function ue(e, t = 500) {
  return typeof e != "string" || e.length <= t ? e : e.substring(0, t) + "...[truncated]";
}
function Be(e) {
  return typeof e != "string" ? e : e.split(`
`).slice(0, 10).map((t) => t.trim()).join(`
`);
}
function pt() {
  return typeof navigator > "u" ? { userAgent: "unknown", platform: "unknown", language: "unknown", online: !0 } : { userAgent: navigator.userAgent || "unknown", platform: navigator.platform || "unknown", language: navigator.language || "unknown", online: navigator.onLine !== void 0 ? navigator.onLine : !0 };
}
function ye() {
  return typeof window > "u" || !window.location ? { path: "/", hash: "", search: "" } : { path: window.location.pathname || "/", hash: window.location.hash || "", search: window.location.search || "" };
}
function yt(e) {
  return typeof e == "string" && ["debug", "info", "warn", "error", "critical"].includes(e);
}
function Ee(e) {
  return yt(e) ? e : "info";
}
const Je = "5.1.0-ENTERPRISE", Qe = "telemetry-core/state/store", i = { sessionId: null, bootId: null, isReady: !1, isEnabled: !0, isSending: !1, lastFlushAt: 0, droppedEvents: 0, totalEvents: 0, context: {}, buffer: [], config: { maxBufferSize: 500, batchSize: 20, flushIntervalMs: 3e4, endpoint: "/api/telemetry/", enabled: !0, debug: !1, sampleRates: { debug: 0.1, info: 0.5, warn: 1, error: 1, critical: 1 } } }, ee = { initCount: 0, resetCount: 0, addToBufferCount: 0, clearBufferCount: 0 };
function Et(e = {}) {
  ee.initCount++, i.sessionId = gt(), i.bootId = ht(), i.isReady = !0, i.lastFlushAt = z(), i.droppedEvents = 0, i.totalEvents = 0, i.buffer = [], e && Object.assign(i.config, e), i.isEnabled = i.config.enabled !== !1;
}
function ve() {
  return i.sessionId;
}
function Se() {
  return i.bootId;
}
function te() {
  return i.isReady;
}
function T() {
  return i.isEnabled;
}
function S() {
  return { ...i.config };
}
function re() {
  return { ...i.context };
}
function be() {
  return i.buffer;
}
function vt() {
  return i.buffer.length;
}
function Z() {
  return { sessionId: i.sessionId, bootId: i.bootId, isReady: i.isReady, isEnabled: i.isEnabled, isSending: i.isSending, bufferSize: i.buffer.length, maxBufferSize: i.config.maxBufferSize, droppedEvents: i.droppedEvents, totalEvents: i.totalEvents, lastFlushAt: i.lastFlushAt };
}
function St(e) {
  i.context = { ...i.context, ...e };
}
function F(e) {
  i.isSending = !!e;
}
function et(e) {
  i.lastFlushAt = e;
}
function tt(e) {
  Object.assign(i.config, e), e.enabled !== void 0 && (i.isEnabled = !!e.enabled);
}
function bt(e) {
  ee.addToBufferCount++, i.totalEvents++, i.buffer.length >= i.config.maxBufferSize && (i.buffer.shift(), i.droppedEvents++), i.buffer.push(e);
}
function Ct(e) {
  return i.buffer.splice(0, e);
}
function It() {
  ee.resetCount++, i.sessionId = null, i.bootId = null, i.isReady = !1, i.isSending = !1, i.lastFlushAt = 0, i.droppedEvents = 0, i.totalEvents = 0, i.context = {}, i.buffer = [];
}
function wt() {
  const e = { isReady: i.isReady, isEnabled: i.isEnabled, bufferNotFull: i.buffer.length < i.config.maxBufferSize, hasSessionId: !!i.sessionId }, t = Object.values(e).filter(Boolean).length, r = [];
  return i.isReady || r.push("Store not ready"), i.isEnabled || r.push("Telemetry disabled"), i.buffer.length >= i.config.maxBufferSize && r.push("Buffer full"), { status: t === 4 ? "HEALTHY" : t >= 2 ? "DEGRADED" : "CRITICAL", score: t, maxScore: 4, scoreDisplay: `${t}/4`, checks: e, issues: r.length > 0 ? r : null, version: Je, moduleId: Qe, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function Tt() {
  return { version: Je, moduleId: Qe, ...Z(), metrics: { ...ee }, healthCheck: wt(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function Rt() {
  return Tt();
}
const Ot = "5.1.0-ENTERPRISE", At = "telemetry-core/core/sampler", A = /* @__PURE__ */ new Map(), Ce = 6e4, y = { sampledCount: 0, droppedCount: 0, cacheHitCount: 0, cacheMissCount: 0 };
function Dt(e) {
  var o;
  if (!e || !e.severity) return !0;
  const t = S(), r = e.severity, n = (o = t.sampleRates) == null ? void 0 : o[r];
  return n === void 0 || n >= 1 ? !0 : n <= 0 ? !1 : Math.random() < n;
}
function kt(e) {
  if (!e) return !1;
  if (e.severity === "critical" || e.severity === "error" || e.type === "metric" && e.metric)
    return y.sampledCount++, !0;
  const t = `${e.component}:${e.event}`, r = A.get(t);
  if (r && Date.now() - r.timestamp < Ce)
    return y.cacheHitCount++, r.decision ? y.sampledCount++ : y.droppedCount++, r.decision;
  y.cacheMissCount++;
  const n = Dt(e);
  return A.set(t, { decision: n, timestamp: Date.now() }), A.size > 1e3 && _t(), n ? y.sampledCount++ : y.droppedCount++, n;
}
function _t() {
  const e = Date.now();
  for (const [t, r] of A.entries())
    e - r.timestamp > Ce && A.delete(t);
}
function Nt(e) {
  if (!e || typeof e != "object") return;
  const t = S();
  tt({ sampleRates: { ...t.sampleRates, ...e } }), A.clear();
}
function xe() {
  return { version: Ot, moduleId: At, cacheSize: A.size, cacheTTL: Ce, currentRates: S().sampleRates || {}, metrics: { ...y } };
}
const Mt = "5.1.0-ENTERPRISE", Lt = "telemetry-core/core/aggregator", q = { aggregateCount: 0, droppedBySampling: 0, batchCount: 0 };
function Ie(e) {
  return e ? kt(e) ? (q.aggregateCount++, bt(e), !0) : (q.droppedBySampling++, !1) : !1;
}
function rt() {
  q.batchCount++;
  const t = S().batchSize || 20, r = vt();
  return r === 0 ? [] : Ct(Math.min(t, r));
}
function Pe() {
  return [...be()];
}
function ze() {
  const e = Z();
  return { version: Mt, moduleId: Lt, bufferSize: e.bufferSize, maxBufferSize: e.maxBufferSize, droppedEvents: e.droppedEvents, totalEvents: e.totalEvents, fillRate: (e.bufferSize / e.maxBufferSize * 100).toFixed(2) + "%", metrics: { ...q } };
}
const l = { attempts: /* @__PURE__ */ new Map(), maxRetries: 3, baseDelay: 1e3, maxDelay: 3e4, backoffMultiplier: 2 }, L = { retryCount: 0, successCount: 0, failCount: 0, lastRetryAt: null };
function $t(e) {
  const t = l.baseDelay * Math.pow(l.backoffMultiplier, e - 1), r = Math.random() * 0.3 * t;
  return Math.floor(Math.min(t + r, l.maxDelay));
}
function Bt(e, t) {
  if ((l.attempts.get(e) || 0) >= l.maxRetries)
    return l.attempts.delete(e), L.failCount++, !1;
  const n = t;
  return n && typeof n.status == "number" && n.status >= 400 && n.status < 500 && n.status !== 429 ? (l.attempts.delete(e), L.failCount++, !1) : !0;
}
function xt(e) {
  L.retryCount++, L.lastRetryAt = (/* @__PURE__ */ new Date()).toISOString();
  const t = l.attempts.get(e) || 0;
  return l.attempts.set(e, t + 1), t + 1;
}
function Ue(e) {
  L.successCount++, l.attempts.delete(e);
}
function Pt() {
  l.attempts.size > 100 && Array.from(l.attempts.entries()).slice(0, 50).forEach(([t]) => l.attempts.delete(t));
}
function ce() {
  return { pendingRetries: l.attempts.size, maxRetries: l.maxRetries, baseDelay: l.baseDelay, maxDelay: l.maxDelay, metrics: { ...L } };
}
const zt = "5.4.0-NO-TOKEN-NO-SEND", Ut = "telemetry-core/transport/send", we = "/api/telemetry/";
function G(e, ...t) {
}
let _ = null;
const E = { sendCount: 0, beaconCount: 0, flushCount: 0, errorCount: 0, lastSendAt: null, droppedNoAuth: 0, droppedNoCsrf: 0, skippedNoCsrf: 0 };
let R = null;
function jt() {
  if (typeof document > "u" || !document.cookie) return "";
  const e = document.cookie.split("; ").find((t) => t.startsWith("csrf_token="));
  return e ? decodeURIComponent(e.slice(11)) : "";
}
function nt() {
  return R || jt();
}
function ot(e = !1) {
  e && (R = null), Y();
}
async function Y() {
  var t, r;
  const e = nt();
  if (e)
    return R = e, e;
  try {
    const o = await (await fetch("/api/auth/check.php", { method: "GET", headers: { Accept: "application/json" }, credentials: "same-origin", cache: "no-store" })).json();
    R = ((r = (t = o == null ? void 0 : o.data) == null ? void 0 : t.session) == null ? void 0 : r.csrf_token) || null;
  } catch {
    R = null;
  }
  return R || "";
}
async function Te(e, t = {}) {
  if (!e || e.length === 0) return { success: !0, sent: 0 };
  const r = S(), n = t.endpoint || r.endpoint || we, o = U();
  F(!0), E.sendCount++;
  const s = new AbortController(), u = setTimeout(() => s.abort(), 15e3);
  try {
    const f = { batchId: o, timestamp: z(), events: e, count: e.length }, c = await fetch(n, { method: "POST", headers: { "Content-Type": "application/json", "X-Telemetry-Batch": o, "X-CSRF-Token": await Y() }, body: Xe(f), keepalive: !0, credentials: "same-origin", signal: s.signal });
    if (clearTimeout(u), c.status === 401 || c.status === 403)
      return Ue(o), F(!1), c.status === 403 ? (R = null, Y(), E.droppedNoCsrf++, G("error", `Telemetry 403: CSRF recusado, lote de ${e.length} evento(s) descartado`)) : (E.droppedNoAuth++, G("info", "Telemetry 401: sem sessão (esperado na tela de login), descartando lote")), { success: !0, sent: 0, dropped: !0, reason: c.status === 403 ? "csrf-rejected" : "auth-required" };
    if (!c.ok) throw { status: c.status, message: `HTTP ${c.status}` };
    return Ue(o), et(z()), F(!1), E.lastSendAt = (/* @__PURE__ */ new Date()).toISOString(), G("info", `Batch sent: ${e.length} events`), { success: !0, sent: e.length, batchId: o };
  } catch (f) {
    if (clearTimeout(u), F(!1), E.errorCount++, Bt(o, f)) {
      const c = xt(o), p = $t(c);
      return setTimeout(() => Te(e, t), p), { success: !1, retry: !0, attempt: c, delay: p };
    }
    return Pt(), { success: !1, error: f.message || "Unknown error" };
  }
}
function Re(e) {
  if (!e || e.length === 0) return !1;
  E.beaconCount++;
  const r = S().endpoint || we, n = { batchId: U(), timestamp: z(), events: e, count: e.length, beacon: !0 }, o = Xe(n), s = nt();
  if (!s)
    return E.skippedNoCsrf++, G("info", `Beacon sem token CSRF: ${e.length} evento(s) retidos (sem sessão ou token ainda não aquecido)`), !1;
  if (typeof fetch == "function")
    try {
      return fetch(r, { method: "POST", headers: { "Content-Type": "application/json", "X-Telemetry-Batch": n.batchId, "X-CSRF-Token": s }, body: o, keepalive: !0, credentials: "same-origin" }).catch(() => {
      }), et(z()), !0;
    } catch {
    }
  return !1;
}
async function Ft(e = "manual") {
  E.flushCount++;
  const t = rt();
  if (t.length === 0) return { success: !0, sent: 0, reason: e };
  if (["unload", "visibilitychange", "pagehide"].includes(e)) {
    const n = Re(t);
    return { success: n, sent: n ? t.length : 0, reason: e, method: "beacon" };
  }
  return { ...await Te(t), reason: e, method: "fetch" };
}
function Oe() {
  if (_) return;
  const t = S().flushIntervalMs || 3e4;
  Y(), _ = setInterval(async () => {
    const r = rt();
    r.length > 0 && await Te(r);
  }, t);
}
function it() {
  _ && (clearInterval(_), _ = null);
}
function H() {
  return _ !== null;
}
function Gt() {
  return { version: zt, moduleId: Ut, flushTimerActive: H(), retry: ce(), defaultEndpoint: we, metrics: { ...E } };
}
function Ht(e, t = {}, r = {}) {
  const n = re(), o = ye(), s = M();
  return { timestamp: s.timestampUtc, timestampISO: s.isoUtc, localTime: s.localTime, timeZone: s.timeZone, type: "event", event: e, component: r.component || t.component || "unknown", severity: Ee(r.severity || "info"), traceId: r.traceId || U(), sessionId: ve(), bootId: Se(), context: pe(n, { route: o.path, hash: o.hash, ...r.context }), data: Ae(t) };
}
function Vt(e, t = {}, r = {}) {
  const n = re(), o = ye(), s = M(), u = typeof t.value == "number" ? t.value : typeof t.duration == "number" ? t.duration : 0;
  return { timestamp: s.timestampUtc, timestampISO: s.isoUtc, localTime: s.localTime, timeZone: s.timeZone, type: "metric", event: e, component: r.component || t.component || t.panel || "unknown", severity: Ee(r.severity || "info"), traceId: r.traceId || U(), sessionId: ve(), bootId: Se(), context: pe(n, { route: o.path, ...r.context }), metric: { name: e, value: u, unit: t.unit || r.unit || "ms" }, data: Ae(t) };
}
function Zt(e, t = {}, r = {}) {
  const n = re(), o = ye(), s = pt(), u = M();
  let f = "", c = "";
  return t instanceof Error ? (f = t.message, c = Be(t.stack), t = { originalError: t.name }) : t.error instanceof Error ? (f = t.error.message, c = Be(t.error.stack)) : (f = t.message || t.error || String(t), c = t.stack || ""), { timestamp: u.timestampUtc, timestampISO: u.isoUtc, localTime: u.localTime, timeZone: u.timeZone, type: "error", event: e, component: r.component || t.component || "unknown", severity: Ee(r.severity || "error"), traceId: r.traceId || U(), sessionId: ve(), bootId: Se(), context: pe(n, { route: o.path, userAgent: s.userAgent, online: s.online, ...r.context }), error: { message: ue(f, 1e3), stack: ue(c, 2e3), code: t.code || r.code || "UNKNOWN" }, data: Ae(t) };
}
function Ae(e) {
  if (!e || typeof e != "object") return {};
  const t = {}, r = ["password", "token", "secret", "apiKey", "authorization"];
  for (const n in e) {
    if (!Object.prototype.hasOwnProperty.call(e, n) || r.some((s) => n.toLowerCase().includes(s)) || n === "error" && e[n] instanceof Error) continue;
    const o = e[n];
    typeof o == "string" ? t[n] = ue(o, 500) : typeof o == "number" || typeof o == "boolean" || o === null || o === void 0 ? t[n] = o : Array.isArray(o) ? t[n] = o.slice(0, 20) : typeof o == "object" && (t[n] = "[object]");
  }
  return t;
}
var le = "telemetry-core/core/emitter", st = Ze({ moduleId: le });
function at(e) {
  return st.get(e);
}
function qt(e) {
  return st.inject(e);
}
var ut = function(e, ...t) {
  var r = Array.prototype.slice.call(arguments, 1), n = at("logger");
  if (n) {
    if (e === "error") {
      n.error && n.error.apply(n, ["[" + le + "]"].concat(r));
      return;
    }
    if (e === "warn") {
      n.warn && n.warn.apply(n, ["[" + le + "]"].concat(r));
      return;
    }
  }
}, C = { eventEmitCount: 0, metricEmitCount: 0, errorEmitCount: 0, globalBusEmitCount: 0, globalBusErrorCount: 0, failedEmitCount: 0 };
function B(e, t, r) {
  if (t || (t = {}), r || (r = {}), !T() || !te()) return null;
  try {
    C.eventEmitCount++;
    var n = Ht(e, t, r), o = Ie(n);
    return De("event", n), ke("telemetry:event", n), o ? n : null;
  } catch (s) {
    return C.failedEmitCount++, _e("emitEvent", s), null;
  }
}
function je(e, t, r) {
  if (t || (t = {}), r || (r = {}), !T() || !te()) return null;
  try {
    C.metricEmitCount++;
    var n = Vt(e, t, r), o = Ie(n);
    return De("metric", n), ke("telemetry:metric", n), o ? n : null;
  } catch (s) {
    return C.failedEmitCount++, _e("emitMetric", s), null;
  }
}
function Fe(e, t, r) {
  if (t || (t = {}), r || (r = {}), !T() || !te()) return null;
  try {
    C.errorEmitCount++;
    var n = Zt(e, t, r), o = Ie(n);
    return De("error", n), ke("telemetry:error", n), o ? n : null;
  } catch (s) {
    return C.failedEmitCount++, _e("emitError", s), null;
  }
}
function De(e, t) {
  var r = S();
  r.debug && ut("info", "[" + e + "]", t.event, t.data || t.metric || t.error);
}
function ke(e, t) {
  var r = at("eventBus");
  !r || !r.emit || queueMicrotask(function() {
    try {
      C.globalBusEmitCount++, r.emit(e, t);
    } catch {
      C.globalBusErrorCount++;
    }
  });
}
function _e(e, t) {
  ut("error", "InternalError:" + e, t);
}
var V = "5.6.0-NO-SESSION-NO-SEND", N = "telemetry-core/core/lifecycle", Yt = typeof window < "u", ie = typeof document < "u", Ne = Ze({ moduleId: N });
function ne(e) {
  return Ne.get(e);
}
function Kt(e) {
  return Ne.inject(e);
}
function Wt() {
  return Ne.snapshot();
}
var h = function(e, ...t) {
  var r = Array.prototype.slice.call(arguments, 1), n = ne("logger");
  if (n) {
    if (e === "error") {
      n.error && n.error.apply(n, ["[" + N + "]"].concat(r));
      return;
    }
    if (e === "warn") {
      n.warn && n.warn.apply(n, ["[" + N + "]"].concat(r));
      return;
    }
    if (e === "info") {
      n.info && n.info.apply(n, ["[" + N + "]"].concat(r));
      return;
    }
  }
}, v = !1, K = [], D = { initCount: 0, shutdownCount: 0, flushOnUnloadCount: 0, flushOnUnloadSkippedAnon: 0, lastInitAt: null, lastShutdownAt: null };
function Me() {
  Ve();
  var e = ne("globalState");
  if (e) {
    if (typeof e.isAuthenticated == "function")
      try {
        return e.isAuthenticated();
      } catch {
      }
    if (typeof e.getState == "function")
      try {
        var t = e.getState();
        if (t && t.auth && t.auth.isAuthenticated) return !0;
      } catch {
      }
  }
  return !1;
}
function x() {
  var e = ne("globalState");
  return e ? "Ports.globalState" : "none";
}
function Xt(e) {
  if (e || (e = {}), v)
    return h("info", "Already initialized - skipping"), { success: !0, message: "Already initialized" };
  try {
    D.initCount++, D.lastInitAt = (/* @__PURE__ */ new Date()).toISOString(), Et(e), Jt(), ot();
    var t = Me();
    return t ? (Oe(), h("info", "Flush timer started (authenticated via " + x() + ")")) : h("info", "Flush timer deferred: not authenticated (expected on login)"), v = !0, B("telemetry:core:init", { config: e, timestamp: Date.now(), version: V, flushTimerStarted: t, authResolution: x() }, { component: N, severity: "info" }), h("info", "Initialized " + V), { success: !0, message: "Telemetry Core initialized", version: V, flushTimerStarted: t, authResolution: x() };
  } catch (r) {
    return h("error", "Init failed:", r), { success: !1, error: r.message };
  }
}
function Jt() {
  if (Yt) {
    var e = function() {
      se();
    }, t = function() {
      ie && document.visibilityState === "hidden" && se();
    }, r = function() {
      se();
    };
    window.addEventListener("beforeunload", e), ie && document.addEventListener("visibilitychange", t), window.addEventListener("pagehide", r), K = [
      { target: window, event: "beforeunload", handler: e },
      { target: ie ? document : null, event: "visibilitychange", handler: t },
      { target: window, event: "pagehide", handler: r }
    ];
  }
}
function ct() {
  var e = ne("globalState");
  return e ? Me() : !0;
}
function se(e) {
  D.flushOnUnloadCount++;
  var t = be();
  if (t.length !== 0) {
    if (!ct()) {
      D.flushOnUnloadSkippedAnon++;
      return;
    }
    Re(t);
  }
}
function Qt() {
  if (v)
    try {
      D.shutdownCount++, D.lastShutdownAt = (/* @__PURE__ */ new Date()).toISOString(), it();
      var e = be();
      e.length > 0 && ct() && Re(e), K.forEach(function(t) {
        t.target && t.target.removeEventListener(t.event, t.handler);
      }), K = [], It(), v = !1, h("info", "Shutdown complete");
    } catch (t) {
      h("error", "Shutdown error:", t);
    }
}
function $() {
  return v && te();
}
function er(e) {
  return v ? (tt(e), e.flushIntervalMs && (it(), Oe()), !0) : !1;
}
function Le() {
  if (!v)
    return h("warn", "Cannot start flush timer: not initialized"), !1;
  var e = Me();
  return e ? (ot(!0), Oe(), h("info", "Flush timer started after authentication (via " + x() + ")"), !0) : (h("info", "Flush timer not started: still not authenticated"), !1);
}
function tr(e) {
  return v ? Ft(e || "manual") : Promise.resolve({ success: !1, error: "Not initialized" });
}
function rr() {
  return {
    version: V,
    moduleId: N,
    initialized: v,
    handlersCount: K.length,
    metrics: Object.assign({}, D),
    authResolution: x()
  };
}
const I = "5.2.0-LATE-GLOBALSTATE", w = "telemetry-core";
let fe = !1, P = [];
function Ge(e, ...t) {
  !fe && e !== "error" || (P.push({ level: e, args: t, ts: Date.now() }), P.length > 50 && P.shift());
}
const m = { trackCount: 0, infoCount: 0, warnCount: 0, debugCount: 0, errorTrackCount: 0, timingCount: 0 };
function sr() {
  return I;
}
function ar() {
  return [...P];
}
const ur = Q, cr = Q;
function lt(e) {
  return Kt(e), qt(e), !0;
}
function He() {
  var e;
  try {
    return ((e = Wt()) == null ? void 0 : e.globalState) || null;
  } catch {
    return null;
  }
}
function W(e) {
  var r, n;
  if (typeof window > "u") return null;
  const t = window;
  if ((n = (r = t.Core) == null ? void 0 : r.windowAdapter) != null && n.get)
    try {
      return t.Core.windowAdapter.get(e) || null;
    } catch {
    }
  return t[e] || null;
}
function ft(e) {
  const r = e && e.globalState || W("GlobalState") || W("GlobalStateManager");
  return r ? (lt({ globalState: r }), !0) : !1;
}
function dt() {
  const e = W("GlobalState") || W("GlobalStateManager");
  if (!e) return;
  let t = !1;
  const r = () => {
    t || Le() && (t = !0, typeof n == "function" && n());
  };
  let n = null;
  try {
    typeof e.subscribe == "function" ? n = e.subscribe(r) : typeof e.onChange == "function" && (n = e.onChange(r));
  } catch {
  }
}
function nr(e, t) {
  if (typeof window > "u") return;
  let r = !1, n = 0, o = null;
  const s = () => {
    if (r) return !0;
    if (!ft(e)) return !1;
    r = !0, o && clearInterval(o);
    try {
      window.removeEventListener("load", s);
    } catch {
    }
    return t || Le() || dt(), !0;
  };
  try {
    window.addEventListener("load", s, { once: !0 });
  } catch {
  }
  o = setInterval(() => {
    n++, (s() || n >= 120) && clearInterval(o);
  }, 250);
}
const a = {
  version: I,
  name: w,
  moduleId: w,
  buildTimestamp: M,
  nowUtcMs: ae,
  Contracts: Q,
  SEVERITIES: d,
  EVENT_TYPES: g,
  COMPONENT_NAMESPACES: O,
  /**
   * ORDEM IMPORTA: injetar o port ANTES de `initTelemetry`.
   *
   * O gate P0 que decide ligar o flush timer roda DENTRO do init. Injetar
   * depois deixaria o timer desligado até o próximo login — que numa sessão já
   * autenticada nunca vem.
   */
  init(e = {}) {
    const t = ft(e.ports), r = Xt(e);
    return r != null && r.flushTimerStarted || dt(), t || nr(e.ports, (r == null ? void 0 : r.flushTimerStarted) === !0), r;
  },
  injectPorts(e) {
    return lt(e);
  },
  startFlushTimerIfAuthenticated() {
    return Le();
  },
  shutdown() {
    return Qt();
  },
  isReady() {
    return $();
  },
  isEnabled() {
    return T();
  },
  getVersion() {
    return I;
  },
  event(e, t = {}, r = {}) {
    return B(e, t, r);
  },
  metric(e, t = {}, r = {}) {
    return je(e, t, r);
  },
  error(e, t = {}, r = {}) {
    return Fe(e, t, r);
  },
  info(e, t, r = {}) {
    return m.infoCount++, B(`${e}:info`, { message: t, ...r }, { component: e, severity: "info" });
  },
  warn(e, t, r = {}) {
    return m.warnCount++, B(`${e}:warn`, { message: t, ...r }, { component: e, severity: "warn" });
  },
  // ⚠️ NÃO existe aqui um método `debug(component, message, data)`. O objeto original declarava
  // a chave `debug` DUAS vezes — como método de log e como objeto de atalhos — e em um object
  // literal a última vence. Portanto o método de log sempre foi inacessível (e `debugCount`
  // nunca incrementou). Mantido idêntico de propósito: isto é migração de fonte, não
  // refatoração; corrigir aqui mudaria comportamento sem ninguém ter pedido. Ver `debug` abaixo.
  track(e, t = {}, r = {}) {
    return m.trackCount++, B(e, t, r);
  },
  trackError(e, t, r = {}) {
    return m.errorTrackCount++, Fe(`${e}:error`, { error: t, ...r }, { component: e, severity: "error" });
  },
  trackTiming(e, t, r = !0) {
    return m.timingCount++, je(`${e}:timing`, { duration: t, success: r, unit: "ms" }, { component: e });
  },
  setContext(e) {
    St(e);
  },
  getContext() {
    return re();
  },
  updateConfig(e) {
    return er(e);
  },
  setSampleRate(e) {
    Nt(e);
  },
  async flush(e = "manual") {
    return tr(e);
  },
  getBufferSnapshot() {
    return Pe();
  },
  getStats() {
    return Z();
  },
  getMetrics() {
    const e = ze(), t = ce(), r = Gt(), n = xe();
    return { ...m, ...e, transport: { flushTimerActive: r.flushTimerActive, defaultEndpoint: r.defaultEndpoint, retry: t }, sampling: n };
  },
  resetMetrics() {
    m.trackCount = 0, m.infoCount = 0, m.warnCount = 0, m.debugCount = 0, m.errorTrackCount = 0, m.timingCount = 0, Ge("info", "Metrics reset");
  },
  setDebug(e) {
    fe = !!e, Ge("info", `Debug: ${fe}`);
  },
  getLogs() {
    return [...P];
  },
  getTransportStats() {
    return { aggregator: ze(), retry: ce(), flushTimerActive: H(), sampling: xe() };
  },
  validateEvent(e) {
    return J(e);
  },
  createEventName(e, t) {
    return ge(e, t);
  },
  parseEventName(e) {
    return he(e);
  },
  healthCheck() {
    var s, u;
    const e = ((u = (s = window.APP_CONFIG) == null ? void 0 : s.app) == null ? void 0 : u.timeZone) || "America/Sao_Paulo", t = { initialized: $(), enabled: T(), flushTimerActive: H(), timeZoneConfigured: !0 }, r = [];
    $() || r.push("Not initialized"), T() || r.push("Telemetry disabled"), !H() && $() && r.push("Flush timer not active");
    const n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
    return { status: n === o ? "HEALTHY" : n >= 3 ? "DEGRADED" : "UNHEALTHY", score: n, maxScore: o, scoreDisplay: `${n}/${o}`, checks: t, issues: r.length > 0 ? r : null, version: I, moduleId: w, timeZone: e, timestamp: Date.now() };
  },
  getInfo() {
    var n, o, s, u;
    const e = S(), t = ((o = (n = window.APP_CONFIG) == null ? void 0 : n.app) == null ? void 0 : o.timeZone) || "America/Sao_Paulo", r = ((u = (s = window.APP_CONFIG) == null ? void 0 : s.app) == null ? void 0 : u.locale) || "pt-BR";
    return { moduleId: w, version: I, isReady: $(), isEnabled: T(), endpoint: e.endpoint, timeZone: t, locale: r, stats: Z(), metrics: this.getMetrics(), lifecycle: rr(), store: Rt(), contracts: k(), healthCheck: this.healthCheck(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  },
  getDiagnostics() {
    return { version: I, moduleId: w, healthCheck: this.healthCheck(), info: this.getInfo(), buffer: Pe(), contracts: k() };
  },
  // `debug` é um OBJETO de atalhos de diagnóstico (não um método) — ver a nota acima.
  debug: {
    info: () => a.getInfo(),
    healthCheck: () => a.healthCheck(),
    stats: () => a.getStats(),
    metrics: () => a.getMetrics(),
    buffer: () => a.getBufferSnapshot(),
    diagnostics: () => a.getDiagnostics(),
    contracts: () => k(),
    buildTimestamp: (e) => M(e),
    nowUtcMs: () => ae(),
    getLogs: () => a.getLogs()
  }
};
function lr(e = "unknown") {
  return {
    track(t, r = {}) {
      return a.event(`${e}:${t}`, r, { component: e });
    },
    trackError(t, r, n = {}) {
      return a.error(`${e}:${t}:error`, { error: r, ...n }, { component: e });
    },
    trackTiming(t, r, n = !0) {
      return a.metric(`${e}:${t}:timing`, { duration: r, success: n }, { component: e });
    },
    info(t, r = {}) {
      return a.info(e, t, r);
    },
    error(t, r = {}) {
      return a.error(`${e}:error`, { message: t, ...r }, { component: e });
    },
    warn(t, r = {}) {
      return a.warn(e, t, r);
    },
    // ⚠️ Idêntico ao original — e o original é defeituoso: `Telemetry.debug` é um OBJETO,
    // então chamá-lo lança TypeError. Ninguém reclamou em produção, o que indica que este
    // ramo nunca é exercitado. Mantido fiel para não mascarar o defeito numa migração de
    // fonte; corrigir é decisão separada, com teste próprio.
    debug(t, r = {}) {
      return a.debug(e, t, r);
    }
  };
}
function fr(e = "unknown") {
  return function(t, r = {}) {
    return a.event(`${e}:${t}`, r, { component: e });
  };
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.telemetry = {
  getVersion: () => I,
  healthCheck: () => a.healthCheck(),
  info: () => a.getInfo(),
  getDiagnostics: () => a.getDiagnostics(),
  setDebug: (e) => a.setDebug(e),
  getMetrics: () => a.getMetrics(),
  resetMetrics: () => a.resetMetrics(),
  getLogs: () => a.getLogs(),
  contracts: () => k(),
  buildTimestamp: (e) => M(e),
  nowUtcMs: () => ae(),
  // Diagnóstico do port: sem isto, "flush timer desligado" não distingue
  // "não autenticado" de "port nunca injetado" — que foi o que escondeu
  // esse defeito por semanas.
  ports: () => ({
    globalStateInjetado: !!He(),
    autenticado: (() => {
      var t;
      const e = He();
      try {
        return ((t = e == null ? void 0 : e.isAuthenticated) == null ? void 0 : t.call(e)) ?? null;
      } catch {
        return "erro";
      }
    })()
  }),
  religarFlush: () => a.startFlushTimerIfAuthenticated()
}, Ve() ? ($e("GLOBAL_EXPOSURE_BLOCKED", { module: w, global: "Telemetry" }), $e("GLOBAL_EXPOSURE_BLOCKED", { module: w, global: "TelemetryContracts" })) : (window.Telemetry = a, window.TelemetryContracts = Q));
var dr = a;
export {
  cr as Contracts,
  a as Telemetry,
  ur as TelemetryContracts,
  I as VERSION,
  M as buildTimestamp,
  fr as createCallbackAdapter,
  lr as createLegacyAdapter,
  dr as default,
  ar as getLogs,
  sr as getVersion,
  lt as injectPorts,
  ae as nowUtcMs
};
