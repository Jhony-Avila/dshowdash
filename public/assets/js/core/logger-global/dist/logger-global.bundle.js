import { isStrict as Gt, recordViolation as Nt } from "/core/runtime/enterprise/strict-mode.js";
import "/core/runtime/dist/runtime.bundle.js";
import { createCorePorts as Wt } from "/core/runtime/ports-profiles.js";
var ue = null;
function jt() {
  var e = Date.now().toString(36), t = Math.random().toString(36).substring(2, 10);
  return "cid-" + e + "-" + t;
}
function ut(e) {
  return ue = e || jt(), typeof window < "u" && (window.__CORRELATION_ID__ = ue), ue;
}
function P() {
  return ue || (typeof window < "u" && window.__CORRELATION_ID__ ? window.__CORRELATION_ID__ : null);
}
function qe() {
  return P() ? P() : ut();
}
var X = null, Y = null;
function $t(e, t) {
  return X = e ? ct(e) : null, Y = t || null, typeof window < "u" && (window.__USER_ID__ = X, window.__USER_ROLE__ = Y), { userId: X, userRole: Y };
}
function oe() {
  return X || (typeof window < "u" && window.__USER_ID__ ? window.__USER_ID__ : null);
}
function ye() {
  return Y || (typeof window < "u" && window.__USER_ROLE__ ? window.__USER_ROLE__ : null);
}
function dt() {
  X = null, Y = null, typeof window < "u" && (delete window.__USER_ID__, delete window.__USER_ROLE__);
}
var de = null;
function Vt(e) {
  return de = e || null, typeof window < "u" && (window.__SESSION_ID__ = de), de;
}
function Se() {
  if (de) return de;
  try {
    if (typeof window < "u") {
      if (window.__SESSION_ID__) return window.__SESSION_ID__;
      if (window.APP_CONFIG && window.APP_CONFIG.sessionId) return window.APP_CONFIG.sessionId;
    }
    if (typeof sessionStorage < "u") {
      var e = sessionStorage.getItem("sessionId");
      if (e) return e;
    }
    return null;
  } catch {
    return null;
  }
}
var Ye = ["password", "senha", "pwd", "pass", "token", "accessToken", "refreshToken", "authToken", "csrfToken", "csrf", "secret", "apiKey", "api_key", "privateKey", "private_key", "credit_card", "creditCard", "cardNumber", "cvv", "cvc", "ssn", "cpf", "rg", "cnpj", "authorization", "auth", "bearer", "cookie", "session", "sessionToken"], Ht = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, qt = /(\+?55\s?)?(\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g, Zt = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, Jt = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, Kt = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;
function Ce(e, t) {
  if (t === void 0 && (t = 0), t > 10) return "[Max Depth]";
  if (e == null) return e;
  if (typeof e == "string") return Xt(e);
  if (Array.isArray(e)) {
    for (var n = [], r = 0; r < e.length; r++)
      n.push(Ce(e[r], t + 1));
    return n;
  }
  if (typeof e == "object") {
    var i = {};
    for (var o in e)
      if (Object.prototype.hasOwnProperty.call(e, o)) {
        for (var s = o.toLowerCase(), l = !1, d = 0; d < Ye.length; d++)
          if (s.indexOf(Ye[d].toLowerCase()) > -1) {
            l = !0;
            break;
          }
        l ? i[o] = "[REDACTED]" : i[o] = Ce(e[o], t + 1);
      }
    return i;
  }
  return e;
}
function Xt(e) {
  if (typeof e != "string") return e;
  var t = e;
  return t = t.replace(Ht, function(n) {
    var r = n.split("@");
    if (!r[1]) return "[EMAIL]";
    var i = r[1].split(".");
    return r[0][0] + "***@" + i[0][0] + "***." + i[1];
  }), t = t.replace(qt, "[PHONE]"), t = t.replace(Zt, "***.***.***-**"), t = t.replace(Jt, "**.***.***/****.--"), t = t.replace(Kt, "[JWT_TOKEN]"), t;
}
function ct(e) {
  if (!e) return null;
  var t = String(e);
  return t.length <= 4 ? "****" : t.substring(0, 2) + "****" + t.substring(t.length - 2);
}
function Yt(e) {
  if (!e || typeof e != "string") return "[EMAIL]";
  var t = e.split("@");
  return t[1] ? t[0][0] + "***@" + t[1] : "[EMAIL]";
}
function Qt(e) {
  if (e === void 0 && (e = Date.now()), typeof window < "u" && window.Telemetry && window.Telemetry.buildTimestamp) {
    var t = window.Telemetry.buildTimestamp(e);
    return t.localTimeFormatted || t.localTime;
  }
  var n = new Date(e), r = window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.timeZone || "America/Sao_Paulo", i = window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.locale || "pt-BR";
  try {
    return new Intl.DateTimeFormat(i, { timeZone: r, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hour12: !1 }).format(n);
  } catch {
    return n.toLocaleTimeString(i);
  }
}
function ft(e, t) {
  if (t === void 0 && (t = 5), e === null) return "null";
  if (e === void 0) return "undefined";
  if (typeof e == "string") return e;
  if (typeof e == "number" || typeof e == "boolean") return String(e);
  var n = [];
  function r(o, s) {
    if (s > t) return "[Max Depth]";
    if (o === null) return null;
    if (o !== void 0) {
      if (typeof o == "object") {
        if (n.indexOf(o) > -1) return "[Circular]";
        if (n.push(o), o instanceof Error) return { name: o.name, message: o.message, stack: o.stack ? o.stack.split(`
`).slice(0, 5).join(`
`) : "" };
        if (Array.isArray(o)) {
          for (var l = [], d = 0; d < Math.min(o.length, 100); d++)
            l.push(r(o[d], s + 1));
          return l;
        }
        if (o instanceof Date) return o.toISOString();
        for (var I = {}, Z = Object.keys(o).slice(0, 50), ne = 0; ne < Z.length; ne++)
          try {
            I[Z[ne]] = r(o[Z[ne]], s + 1);
          } catch {
            I[Z[ne]] = "[Unserializable]";
          }
        return I;
      }
      return typeof o == "function" ? "[Function: " + (o.name || "anonymous") + "]" : o;
    }
  }
  try {
    var i = r(e, 0);
    return JSON.stringify(i, null, 0);
  } catch {
    return "[Stringify Error]";
  }
}
function en(e) {
  return e ? typeof e == "string" ? e : e.component ? e.component : e.componentName ? e.componentName : e.name ? e.name : e.id ? e.id : "app" : "app";
}
function tn() {
  return Date.now();
}
function nn() {
  try {
    return !!(typeof window < "u" && window.APP_CONFIG && (window.APP_CONFIG.app && window.APP_CONFIG.app.debug === !0 || window.APP_CONFIG.app && window.APP_CONFIG.app.environment === "development") || typeof localStorage < "u" && localStorage.getItem("LOGGER_DEBUG") === "true");
  } catch {
    return !1;
  }
}
function rn() {
  try {
    if (typeof window < "u") {
      if (window.APP_CONFIG && window.APP_CONFIG.bootId) return window.APP_CONFIG.bootId;
      if (window.__BOOT_ID__) return window.__BOOT_ID__;
    }
    return null;
  } catch {
    return null;
  }
}
function on() {
  try {
    if (typeof window < "u") {
      if (window.Environment && window.Environment.get) return window.Environment.get("environment");
      if (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.environment) return window.APP_CONFIG.app.environment;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}
function an() {
  try {
    return typeof window < "u" ? window.__CURRENT_ROUTE__ ? window.__CURRENT_ROUTE__ : window.location && window.location.pathname || "/" : "/";
  } catch {
    return "/";
  }
}
function sn(e) {
  if (e && e.traceId) return e.traceId;
  if (e && e.trace_id) return e.trace_id;
  try {
    return typeof window < "u" && window.__CURRENT_TRACE_ID__ ? window.__CURRENT_TRACE_ID__ : null;
  } catch {
    return null;
  }
}
function ln(e) {
  return typeof e == "string" ? e : e instanceof Error ? e.message : typeof e == "object" ? ft(e) : String(e);
}
function R() {
  for (var e = {}, t = 0; t < arguments.length; t++) {
    var n = arguments[t];
    if (n && typeof n == "object" && !Array.isArray(n))
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
  }
  return e;
}
var un = Object.freeze({ trace: 10, debug: 20, info: 30, warn: 40, error: 50, critical: 60 }), dn = Object.freeze({ trace: "#9E9E9E", debug: "#2196F3", info: "#4CAF50", warn: "#FF9800", error: "#F44336", critical: "#9C27B0" }), cn = Object.freeze({ trace: "🔍", debug: "🐛", info: "ℹ️", warn: "⚠️", error: "❌", critical: "🔥" });
function Te(e) {
  return e in un;
}
function fn(e, t, n) {
  n || (n = {});
  var r = { timestamp: tn(), level: Te(e) ? e : "info", component: en(n), message: ln(t), context: pn(n), source: "browser", environment: on(), route: an() }, i = P();
  i && (r.correlationId = i);
  var o = oe();
  o && (r.userId = o);
  var s = ye();
  s && (r.userRole = s);
  var l = Se();
  l && (r.sessionId = l);
  var d = sn(n);
  d && (r.traceId = d);
  var I = rn();
  return I && (r.bootId = I), r;
}
function pn(e) {
  if (!e || typeof e != "object") return {};
  var t = ["component", "componentName", "name", "id", "traceId", "trace_id", "sessionId", "session_id", "bootId", "boot_id", "correlationId", "correlation_id", "userId", "user_id", "userRole", "user_role"], n = {};
  for (var r in e)
    if (Object.prototype.hasOwnProperty.call(e, r)) {
      for (var i = !1, o = 0; o < t.length; o++)
        if (t[o] === r) {
          i = !0;
          break;
        }
      if (!i)
        try {
          var s = e[r];
          s instanceof Error ? n[r] = { name: s.name, message: s.message, stack: s.stack ? s.stack.split(`
`).slice(0, 10).join(`
`) : "" } : typeof s == "function" ? n[r] = "[Function: " + (s.name || "anonymous") + "]" : typeof s == "object" && s !== null ? n[r] = JSON.parse(ft(s)) : n[r] = s;
        } catch {
          n[r] = "[Unserializable]";
        }
    }
  return Ce(n);
}
function gn(e) {
  for (var t = Qt(e.timestamp), n = e.level.toUpperCase(); n.length < 8; ) n += " ";
  for (var r = "[" + e.component + "]"; r.length < 20; ) r += " ";
  var i = t + " " + n + " " + r;
  e.correlationId && (i += " [" + e.correlationId.slice(0, 12) + "]");
  var o = !1;
  for (var s in e.context)
    if (Object.prototype.hasOwnProperty.call(e.context, s)) {
      o = !0;
      break;
    }
  return { prefix: i, message: e.message, context: o ? e.context : null };
}
function vn(e) {
  var t = { message: e.message, environment: e.environment, route: e.route, correlationId: e.correlationId, userId: e.userId };
  for (var n in e.context)
    Object.prototype.hasOwnProperty.call(e.context, n) && (t[n] = e.context[n]);
  return { name: e.component + ":" + e.level, data: t, options: { component: e.component, severity: e.level, timestamp: e.timestamp, sessionId: e.sessionId, traceId: e.traceId, bootId: e.bootId, correlationId: e.correlationId, userId: e.userId, userRole: e.userRole } };
}
function mn(e) {
  return e && typeof e == "object" && typeof e.timestamp == "number" && typeof e.level == "string" && typeof e.component == "string" && typeof e.message == "string";
}
function wn(e) {
  return { event: "logger:" + e.level, payload: { level: e.level, component: e.component, message: e.message, correlationId: e.correlationId, userId: e.userId, timestamp: e.timestamp, context: e.context } };
}
var hn = "3.1.0-ENTERPRISE", bn = "logger-global-forwarder", T = null, Ze = !0, c = { forwarded: 0, failed: 0, lastForward: null, lastError: null, initAttempts: 0, initSuccess: !1 };
function pt() {
  return c.initAttempts++, new Promise(function(e) {
    try {
      if (typeof window < "u" && window.Telemetry && typeof window.Telemetry.isReady == "function" && window.Telemetry.isReady()) {
        T = window.Telemetry, c.initSuccess = !0, e({ ok: !0, available: !0, source: "window" });
        return;
      }
      import("/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js").then(function(t) {
        if (T = t.Telemetry, T && typeof T.isReady == "function") {
          var n = T.isReady();
          c.initSuccess = n, e({ ok: !0, available: n, source: "import" });
        } else
          c.initSuccess = !1, e({ ok: !0, available: !1 });
      }).catch(function() {
        c.initSuccess = !1, e({ ok: !0, available: !1 });
      });
    } catch (t) {
      T = null, c.lastError = t && t.message ? t.message : "Unknown error", c.initSuccess = !1, e({ ok: !1, available: !1, error: t });
    }
  });
}
function yn(e) {
  if (!Ze) return { ok: !1, reason: "forwarding-disabled" };
  var t = T || (typeof window < "u" ? window.Telemetry : null);
  if (!t) return { ok: !1, reason: "telemetry-not-loaded" };
  if (typeof t.track != "function") return { ok: !1, reason: "telemetry-track-not-available" };
  try {
    var n = vn(e), r = "log:" + e.level, i = { component: e.component || "unknown", message: e.message || "", level: e.level, timestamp: e.timestamp };
    for (var o in n.data)
      Object.prototype.hasOwnProperty.call(n.data, o) && (i[o] = n.data[o]);
    return t.track(r, i), c.forwarded++, c.lastForward = Date.now(), { ok: !0 };
  } catch (s) {
    return c.failed++, c.lastError = s && s.message ? s.message : "Forward error", { ok: !1, error: s };
  }
}
function Me(e) {
  Ze = !!e;
}
function Sn() {
  return !!(T && typeof T.track == "function" || typeof window < "u" && window.Telemetry && typeof window.Telemetry.track == "function");
}
function Re() {
  return { version: hn, moduleId: bn, enabled: Ze, available: Sn(), forwarded: c.forwarded, failed: c.failed, totalForwarded: c.forwarded, totalErrors: c.failed, lastForward: c.lastForward, lastError: c.lastError, initAttempts: c.initAttempts, initSuccess: c.initSuccess };
}
const Je = "4.0.0-ENTERPRISE", gt = "logger-global-buffer";
function En() {
  return Je;
}
var g = 500, D = new Array(g), V = 0, G = 0, v = 0, Qe = 0, b = {
  totalAdded: 0,
  totalDiscarded: 0,
  overwrites: 0,
  lastFlush: null,
  lastPush: null
};
function Ke(e) {
  if (!mn(e)) return !1;
  try {
    var t = {
      ...e,
      bufferedAt: Date.now(),
      bufferIndex: Qe
    };
    return v >= g ? (b.overwrites++, b.totalDiscarded++, G = (G + 1) % g) : v++, D[V] = t, V = (V + 1) % g, b.totalAdded++, b.lastPush = Date.now(), Qe++, !0;
  } catch {
    return !1;
  }
}
function F() {
  if (v === 0) return [];
  for (var e = [], t = G, n = 0; n < v; n++)
    D[t] && e.push(D[t]), t = (t + 1) % g;
  return e;
}
function _n(e) {
  return F().filter(function(t) {
    return t.level === e;
  });
}
function In(e) {
  return F().filter(function(t) {
    return t.component === e;
  });
}
function Oe() {
  var e = v;
  return D = new Array(g), V = 0, G = 0, v = 0, b.lastFlush = Date.now(), e;
}
function vt() {
  var e = F();
  return Oe(), e;
}
function mt(e) {
  e = e || 10;
  var t = F();
  return t.slice(-e);
}
function Cn(e) {
  e = e || 10;
  var t = F();
  return t.slice(0, e);
}
function Ln(e) {
  return F().filter(e);
}
function ie() {
  return {
    currentSize: v,
    maxSize: g,
    utilizationPercent: Math.round(v / g * 100),
    totalAdded: b.totalAdded,
    totalDiscarded: b.totalDiscarded,
    overwrites: b.overwrites,
    dropped: b.totalDiscarded,
    lastFlush: b.lastFlush,
    lastPush: b.lastPush,
    headPosition: V,
    tailPosition: G,
    isCircular: !0
  };
}
function kn() {
  return v >= g;
}
function An() {
  return v;
}
function Tn() {
  return g;
}
function Mn(e) {
  if (e < 10 || e > 1e4)
    return { ok: !1, reason: "Size must be between 10 and 10000" };
  var t = F();
  g = e, D = new Array(g), V = 0, G = 0, v = 0;
  var n = t.slice(-e);
  return n.forEach(function(r) {
    Ke(r);
  }), { ok: !0, newSize: e, restored: n.length };
}
function* On() {
  for (var e = G, t = 0; t < v; t++)
    D[e] && (yield D[e]), e = (e + 1) % g;
}
function Bn() {
  if (v === 0) return null;
  var e = (V - 1 + g) % g;
  return D[e];
}
function Dn() {
  return v === 0 ? null : D[G];
}
function Fn() {
  var e = Math.round(v / g * 100);
  return {
    status: e > 90 ? "WARNING" : "HEALTHY",
    version: Je,
    moduleId: gt,
    size: v,
    capacity: g,
    utilization: e + "%",
    isCircular: !0,
    overwrites: b.overwrites
  };
}
const wt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: gt,
  VERSION: Je,
  clearBuffer: Oe,
  flushBuffer: vt,
  getBuffer: F,
  getBufferByComponent: In,
  getBufferByLevel: _n,
  getBufferCapacity: Tn,
  getBufferSize: An,
  getBufferStats: ie,
  getOldestLogs: Cn,
  getRecentLogs: mt,
  getVersion: En,
  healthCheck: Fn,
  isBufferFull: kn,
  iterate: On,
  peekLatest: Bn,
  peekOldest: Dn,
  pushToBuffer: Ke,
  searchBuffer: Ln,
  setMaxBufferSize: Mn
}, Symbol.toStringTag, { value: "Module" }));
var Le = Object.freeze(["off", "soft", "hard"]), et = Object.freeze(["error", "critical", "security", "audit", "panic"]), ht = Object.freeze({ off: [], soft: ["trace", "debug", "info"], hard: ["trace", "debug", "info", "warn", "error", "critical"] }), a = { minLevel: "info", enabledLevels: null, enabledComponents: null, disabledComponents: null, consoleOutput: !0, telemetryForwarding: !0, bufferEnabled: !0, eventBusEnabled: !0, debugMode: !1, silentMode: "off", silentAllowLevels: null, silentSuppressedCount: 0 };
function Rn() {
  if (a.enabledLevels || (a.enabledLevels = { info: !0, warn: !0, error: !0, critical: !0 }), a.enabledComponents || (a.enabledComponents = {}), a.disabledComponents || (a.disabledComponents = {}), !a.silentAllowLevels) {
    a.silentAllowLevels = {};
    for (var e = 0; e < et.length; e++) a.silentAllowLevels[et[e]] = !0;
  }
}
Rn();
var ce = !1, ae = null;
function bt(e) {
  return e || (e = {}), ae || (ae = new Promise(function(t) {
    try {
      if (a.debugMode = nn(), a.debugMode && (a.minLevel = "debug", a.enabledLevels = { trace: !0, debug: !0, info: !0, warn: !0, error: !0, critical: !0 }), e.minLevel && Te(e.minLevel) && (a.minLevel = e.minLevel), e.consoleOutput !== void 0 && (a.consoleOutput = !!e.consoleOutput), e.telemetryForwarding !== void 0 && (a.telemetryForwarding = !!e.telemetryForwarding), e.bufferEnabled !== void 0 && (a.bufferEnabled = !!e.bufferEnabled), e.eventBusEnabled !== void 0 && (a.eventBusEnabled = !!e.eventBusEnabled), e.silentMode && Le.indexOf(e.silentMode) > -1 && (a.silentMode = e.silentMode), Array.isArray(e.silentAllowLevels))
        for (var n = 0; n < e.silentAllowLevels.length; n++) a.silentAllowLevels[e.silentAllowLevels[n]] = !0;
      if (!e.silentMode && typeof window < "u") {
        var r = window.location && window.location.hostname || "", i = r.indexOf("dshowdash.com.br") > -1 && r.indexOf("test") === -1;
        i && !a.debugMode && (a.silentMode = "soft");
      }
      qe(), a.telemetryForwarding ? pt().then(function(o) {
        Me(o.ok && o.available), ce = !0, t({ ok: !0, config: j() });
      }) : (ce = !0, t({ ok: !0, config: j() }));
    } catch (o) {
      ce = !0, t({ ok: !1, error: o });
    }
  }), ae);
}
function Pn() {
  var e = Oe();
  return Me(!1), a.enabledComponents = {}, a.disabledComponents = {}, dt(), ce = !1, ae = null, { ok: !0, flushedLogs: e };
}
function J() {
  return ce;
}
function xn(e) {
  return Te(e) ? (a.enabledLevels[e] = !0, yt(), !0) : !1;
}
function Un(e) {
  return !Te(e) || e === "error" || e === "critical" ? !1 : (delete a.enabledLevels[e], yt(), !0);
}
function yt() {
  for (var e = ["trace", "debug", "info", "warn", "error", "critical"], t = 0; t < e.length; t++)
    if (a.enabledLevels[e[t]]) {
      a.minLevel = e[t];
      return;
    }
}
function zn(e) {
  return e ? (a.enabledComponents[e] = !0, delete a.disabledComponents[e], !0) : !1;
}
function Gn(e) {
  return e ? (a.disabledComponents[e] = !0, delete a.enabledComponents[e], !0) : !1;
}
function Nn(e, t) {
  return !a.enabledLevels[e] || a.disabledComponents[t] ? !1 : e === "debug" || e === "trace" ? a.debugMode || a.enabledComponents[t] : !0;
}
function he(e) {
  if (Le.indexOf(e) === -1) return { ok: !1, reason: "Invalid mode: " + e + ". Use: " + Le.join(", ") };
  var t = a.silentMode;
  return a.silentMode = e, { ok: !0, previous: t, current: e };
}
function Wn() {
  return a.silentMode;
}
function jn() {
  return a.silentMode !== "off";
}
function tt(e) {
  if (a.silentMode === "off" || a.silentAllowLevels[e]) return !1;
  var t = ht[a.silentMode] || [];
  return t.indexOf(e) > -1;
}
function $n() {
  a.silentSuppressedCount++;
}
function be() {
  var e = [];
  for (var t in a.silentAllowLevels)
    a.silentAllowLevels[t] && e.push(t);
  return { mode: a.silentMode, isSilent: a.silentMode !== "off", suppressedCount: a.silentSuppressedCount, allowLevels: e, suppressedLevels: ht[a.silentMode] || [] };
}
function nt() {
  a.silentSuppressedCount = 0;
}
function j() {
  var e = [];
  for (var t in a.enabledLevels)
    a.enabledLevels[t] && e.push(t);
  var n = [];
  for (var r in a.enabledComponents)
    a.enabledComponents[r] && n.push(r);
  var i = [];
  for (var o in a.disabledComponents)
    a.disabledComponents[o] && i.push(o);
  var s = [];
  for (var l in a.silentAllowLevels)
    a.silentAllowLevels[l] && s.push(l);
  return { minLevel: a.minLevel, enabledLevels: e, enabledComponents: n, disabledComponents: i, consoleOutput: a.consoleOutput, telemetryForwarding: a.telemetryForwarding, bufferEnabled: a.bufferEnabled, eventBusEnabled: a.eventBusEnabled, debugMode: a.debugMode, silentMode: a.silentMode, silentAllowLevels: s, silentSuppressedCount: a.silentSuppressedCount };
}
function Vn(e) {
  return e || (e = {}), e.consoleOutput !== void 0 && (a.consoleOutput = !!e.consoleOutput), e.telemetryForwarding !== void 0 && (a.telemetryForwarding = !!e.telemetryForwarding, Me(e.telemetryForwarding)), e.bufferEnabled !== void 0 && (a.bufferEnabled = !!e.bufferEnabled), e.eventBusEnabled !== void 0 && (a.eventBusEnabled = !!e.eventBusEnabled), e.silentMode !== void 0 && Le.indexOf(e.silentMode) > -1 && (a.silentMode = e.silentMode), j();
}
function Hn() {
  return a.consoleOutput;
}
function qn() {
  return a.telemetryForwarding;
}
function Zn() {
  return a.bufferEnabled;
}
function Jn() {
  return a.eventBusEnabled;
}
var m = { total: 0, byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, critical: 0 }, consoleWrites: 0, consoleSuppressed: 0, telemetryForwards: 0, bufferPushes: 0, eventBusEmits: 0, errors: 0 };
function Kn() {
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var e = window.Core.windowAdapter.get("EventBus");
    if (e) return e;
  }
  return null;
}
function N(e, t, n) {
  n || (n = {});
  try {
    if (!Nn(e, n.component || "app"))
      return { ok: !0, skipped: !0 };
    var r = fn(e, t, n);
    if (m.total++, m.byLevel[e] = (m.byLevel[e] || 0) + 1, Hn())
      if (tt(e))
        m.consoleSuppressed++, $n();
      else
        try {
          Xn(r), m.consoleWrites++;
        } catch (o) {
          se("Console write failed", o);
        }
    if (qn())
      try {
        var i = yn(r);
        i.ok && m.telemetryForwards++;
      } catch (o) {
        se("Telemetry forward failed", o);
      }
    if (Zn())
      try {
        Ke(r), m.bufferPushes++;
      } catch (o) {
        se("Buffer push failed", o);
      }
    if (Jn())
      try {
        Yn(r), m.eventBusEmits++;
      } catch {
      }
    return { ok: !0, entry: r, suppressed: tt(e) };
  } catch (o) {
    return m.errors++, se("Logger write failed", o), { ok: !1, error: o };
  }
}
function Xn(e) {
  try {
    var t = gn(e), n = dn[e.level] || "#666", r = cn[e.level] || "", i = "color: " + n + "; font-weight: bold;", o = "color: inherit; font-weight: normal;", s = "%c" + r + " " + t.prefix + "%c", l = t.context ? [s, i, o, t.message, t.context] : [s, i, o, t.message];
    switch (e.level) {
      case "critical":
      case "error":
        console.error.apply(console, l);
        break;
      case "warn":
        console.warn.apply(console, l);
        break;
      case "debug":
      case "trace":
        console.debug.apply(console, l);
        break;
      default:
        console.info.apply(console, l);
    }
  } catch (d) {
    se("Console write failed", d);
  }
}
function Yn(e) {
  for (var t = ["warn", "error", "critical"], n = !1, r = 0; r < t.length; r++)
    if (t[r] === e.level) {
      n = !0;
      break;
    }
  if (n) {
    var i = Kn();
    if (!(!i || typeof i.emit != "function"))
      try {
        var o = wn(e);
        i.emitSync(o.event, o.payload, { sourceModule: "logger-global", priority: 3 });
      } catch {
      }
  }
}
function se(e, t) {
  try {
    console.error("[Logger Internal] " + e + ":", t);
  } catch {
  }
}
function Pe() {
  var e = {};
  for (var t in m)
    if (t === "byLevel") {
      e.byLevel = {};
      for (var n in m.byLevel) e.byLevel[n] = m.byLevel[n];
    } else e[t] = m[t];
  return e;
}
function Qn() {
  m = { total: 0, byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, critical: 0 }, consoleWrites: 0, consoleSuppressed: 0, telemetryForwards: 0, bufferPushes: 0, eventBusEmits: 0, errors: 0 };
}
const St = 10, Et = 500, er = 50;
let y = {
  enabled: !0,
  batchSize: St,
  flushIntervalMs: Et,
  destinations: []
  // callbacks para flush
}, fe = [], Q = null, le = {
  batchesCreated: 0,
  batchesFlushed: 0,
  logsQueued: 0,
  logsFlushed: 0,
  flushErrors: 0,
  lastFlushAt: null
};
function tr(e = {}) {
  return y.enabled = e.enabled !== !1, y.batchSize = Math.min(e.batchSize || St, er), y.flushIntervalMs = e.flushIntervalMs || Et, y.enabled && _t(), { ok: !0, config: Ct() };
}
function Be() {
  if (fe.length === 0)
    return { ok: !0, flushed: 0 };
  const e = [...fe];
  fe = [], le.batchesFlushed++, le.lastFlushAt = Date.now();
  const t = {};
  e.forEach((s) => {
    t[s.destination] || (t[s.destination] = []), t[s.destination].push(s.entry);
  });
  let n = 0, r = 0;
  for (var i in t) {
    var o = t[i];
    try {
      y.destinations.forEach(function(s) {
        try {
          s(o, i);
        } catch {
          r++;
        }
      }), n += o.length;
    } catch {
      r++, le.flushErrors++;
    }
  }
  return le.logsFlushed += n, { ok: r === 0, flushed: n, errors: r };
}
function _t() {
  Q && clearInterval(Q), Q = setInterval(function() {
    fe.length > 0 && Be();
  }, y.flushIntervalMs);
}
function It() {
  Q && (clearInterval(Q), Q = null);
}
function nr(e) {
  y.enabled = e, e ? _t() : (It(), Be());
}
function Ct() {
  return {
    enabled: y.enabled,
    batchSize: y.batchSize,
    flushIntervalMs: y.flushIntervalMs,
    destinationCount: y.destinations.length
  };
}
function rt() {
  return {
    ...le,
    currentQueueSize: fe.length,
    config: Ct()
  };
}
function rr() {
  It();
  var e = Be();
  return y.destinations = [], e;
}
var or = 10, ir = 1e3, ar = 5e3, O = {
  enabled: !0,
  maxPerSecond: or,
  windowMs: ir,
  cooldownMs: ar,
  bypassLevels: ["error", "critical", "security", "audit", "panic"]
}, te = {}, De = /* @__PURE__ */ new Set(), xe = {
  totalThrottled: 0,
  byComponent: {},
  lastThrottleAt: null
};
function sr(e) {
  return e = e || {}, e.enabled !== void 0 && (O.enabled = e.enabled), e.maxPerSecond && (O.maxPerSecond = e.maxPerSecond), e.windowMs && (O.windowMs = e.windowMs), e.cooldownMs && (O.cooldownMs = e.cooldownMs), Array.isArray(e.bypassLevels) && (O.bypassLevels = e.bypassLevels), { ok: !0, config: ur() };
}
function lr(e) {
  O.enabled = e, e || (te = {}, De.clear());
}
function ur() {
  return { ...O, bypassLevels: [...O.bypassLevels] };
}
function ot() {
  var e = [];
  return De.forEach(function(t) {
    e.push(t);
  }), {
    enabled: O.enabled,
    totalThrottled: xe.totalThrottled,
    currentlyThrottled: e,
    byComponent: { ...xe.byComponent },
    lastThrottleAt: xe.lastThrottleAt,
    activeComponents: Object.keys(te).length
  };
}
function dr(e) {
  return te[e] ? (te[e].throttledUntil = 0, De.delete(e), !0) : !1;
}
function cr() {
  var e = Object.keys(te).length;
  return te = {}, De.clear(), e;
}
var k = /* @__PURE__ */ new Map(), pe = [], fr = 100, _ = {
  spansStarted: 0,
  spansCompleted: 0,
  spansFailed: 0,
  totalDurationMs: 0
};
function pr() {
  return "span-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 6);
}
function Lt(e, t) {
  t = t || {};
  var n = pr(), r = t.parentSpanId || gr(), i = {
    id: n,
    name: e,
    parentId: r,
    startTime: Date.now(),
    endTime: null,
    duration: null,
    status: "active",
    context: t,
    events: [],
    attributes: {}
  };
  return k.set(n, i), _.spansStarted++, {
    id: n,
    // Adiciona evento ao span
    addEvent: function(o, s) {
      var l = k.get(n);
      return l && l.events.push({
        name: o,
        timestamp: Date.now(),
        data: s || {}
      }), this;
    },
    // Define atributo
    setAttribute: function(o, s) {
      var l = k.get(n);
      return l && (l.attributes[o] = s), this;
    },
    // Define múltiplos atributos
    setAttributes: function(o) {
      var s = k.get(n);
      if (s && o)
        for (var l in o)
          o.hasOwnProperty(l) && (s.attributes[l] = o[l]);
      return this;
    },
    // Finaliza com sucesso
    end: function(o) {
      return je(n, "success", o);
    },
    // Finaliza com erro
    fail: function(o) {
      return je(n, "error", { error: o });
    },
    // Obtém duração parcial
    elapsed: function() {
      var o = k.get(n);
      return o ? Date.now() - o.startTime : 0;
    }
  };
}
function je(e, t, n) {
  var r = k.get(e);
  if (!r)
    return { ok: !1, reason: "span-not-found" };
  if (r.endTime = Date.now(), r.duration = r.endTime - r.startTime, r.status = t || "success", n)
    for (var i in n)
      n.hasOwnProperty(i) && (r.context[i] = n[i]);
  for (k.delete(e), pe.push(r); pe.length > fr; )
    pe.shift();
  return t === "error" ? _.spansFailed++ : _.spansCompleted++, _.totalDurationMs += r.duration, {
    ok: !0,
    span: {
      id: r.id,
      name: r.name,
      duration: r.duration,
      status: r.status
    }
  };
}
function gr() {
  var e = null;
  return k.forEach(function(t, n) {
    e = n;
  }), e;
}
function vr() {
  var e = [];
  return k.forEach(function(t) {
    e.push({
      id: t.id,
      name: t.name,
      elapsed: Date.now() - t.startTime,
      status: t.status
    });
  }), e;
}
function mr(e) {
  return e = e || 10, pe.slice(-e).map(function(t) {
    return {
      id: t.id,
      name: t.name,
      duration: t.duration,
      status: t.status,
      startTime: t.startTime,
      endTime: t.endTime
    };
  });
}
function wr(e, t, n) {
  var r = Lt(e, n);
  try {
    var i = t();
    return i && typeof i.then == "function" ? i.then(function(o) {
      return r.end({ result: "success" }), o;
    }).catch(function(o) {
      throw r.fail(o), o;
    }) : (r.end({ result: "success" }), i);
  } catch (o) {
    throw r.fail(o), o;
  }
}
function it() {
  var e = _.spansCompleted > 0 ? Math.round(_.totalDurationMs / _.spansCompleted) : 0;
  return {
    activeSpans: k.size,
    completedSpans: pe.length,
    spansStarted: _.spansStarted,
    spansCompleted: _.spansCompleted,
    spansFailed: _.spansFailed,
    avgDurationMs: e,
    totalDurationMs: _.totalDurationMs
  };
}
var B = {
  enabled: !0,
  maxFrames: 10,
  captureForLevels: ["error", "critical", "panic"],
  filterInternalFrames: !0,
  internalPatterns: [
    "logger-global",
    "node_modules",
    "webpack",
    "<anonymous>"
  ]
};
function hr(e) {
  return e = e || {}, e.enabled !== void 0 && (B.enabled = e.enabled), e.maxFrames && (B.maxFrames = e.maxFrames), Array.isArray(e.captureForLevels) && (B.captureForLevels = e.captureForLevels), e.filterInternalFrames !== void 0 && (B.filterInternalFrames = e.filterInternalFrames), Array.isArray(e.internalPatterns) && (B.internalPatterns = e.internalPatterns), { ok: !0, config: br() };
}
function br() {
  return {
    enabled: B.enabled,
    maxFrames: B.maxFrames,
    captureForLevels: [...B.captureForLevels],
    filterInternalFrames: B.filterInternalFrames
  };
}
var A = {
  enabled: !0,
  windowMs: 6e4,
  // 1 minuto
  maxEntries: 100,
  levelsToDedup: ["error", "critical", "warn"]
}, Fe = /* @__PURE__ */ new Map(), Ue = {
  totalDeduplicated: 0,
  uniqueErrors: 0,
  byMessage: {}
};
function kt() {
  var e = [];
  return Fe.forEach(function(t) {
    t.count > 1 && e.push({
      hash: t.hash,
      message: t.message.substring(0, 100),
      component: t.component,
      level: t.level,
      count: t.count,
      firstSeen: t.firstSeen,
      lastSeen: t.lastSeen
    });
  }), e.sort(function(t, n) {
    return n.count - t.count;
  }), e;
}
function yr() {
  var e = kt();
  return Fe.clear(), e;
}
function Sr(e) {
  return e = e || {}, e.enabled !== void 0 && (A.enabled = e.enabled), e.windowMs && (A.windowMs = e.windowMs), e.maxEntries && (A.maxEntries = e.maxEntries), Array.isArray(e.levelsToDedup) && (A.levelsToDedup = e.levelsToDedup), { ok: !0, config: _r() };
}
function Er(e) {
  A.enabled = e, e || Fe.clear();
}
function _r() {
  return {
    enabled: A.enabled,
    windowMs: A.windowMs,
    maxEntries: A.maxEntries,
    levelsToDedup: [...A.levelsToDedup]
  };
}
function at() {
  return {
    enabled: A.enabled,
    cacheSize: Fe.size,
    totalDeduplicated: Ue.totalDeduplicated,
    uniqueErrors: Ue.uniqueErrors,
    topMessages: Object.values(Ue.byMessage).sort(function(e, t) {
      return t.count - e.count;
    }).slice(0, 10)
  };
}
var w = {
  enabled: !0,
  autoGroupByComponent: !0,
  autoGroupByCorrelationId: !0,
  collapseByDefault: !0,
  maxOpenGroups: 5,
  autoCloseAfterMs: 5e3
}, x = /* @__PURE__ */ new Map(), $e = /* @__PURE__ */ new Map(), ge = {
  groupsOpened: 0,
  groupsClosed: 0,
  logsGrouped: 0
};
function At(e, t, n) {
  if (!w.enabled || typeof console.group != "function") return !1;
  for (; x.size >= w.maxOpenGroups; ) {
    var r = x.keys().next().value;
    ve(r);
  }
  try {
    if (n || w.collapseByDefault ? console.groupCollapsed(t || e) : console.group(t || e), x.set(e, {
      label: t,
      openedAt: Date.now(),
      logCount: 0
    }), ge.groupsOpened++, w.autoCloseAfterMs > 0) {
      var i = setTimeout(function() {
        ve(e);
      }, w.autoCloseAfterMs);
      $e.set(e, i);
    }
    return !0;
  } catch {
    return !1;
  }
}
function ve(e) {
  if (!x.has(e)) return !1;
  try {
    console.groupEnd();
    var t = x.get(e);
    x.delete(e), ge.groupsClosed++;
    var n = $e.get(e);
    return n && (clearTimeout(n), $e.delete(e)), !0;
  } catch {
    return !1;
  }
}
function Tt() {
  var e = 0;
  return x.forEach(function(t, n) {
    ve(n) && e++;
  }), e;
}
function Ir(e) {
  var t = "manual:" + Date.now();
  return At(t, e, !1), {
    id: t,
    end: function() {
      ve(t);
    }
  };
}
function Cr(e) {
  var t = "manual:" + Date.now();
  return At(t, e, !0), {
    id: t,
    end: function() {
      ve(t);
    }
  };
}
function Lr(e) {
  return e = e || {}, e.enabled !== void 0 && (w.enabled = e.enabled), e.autoGroupByComponent !== void 0 && (w.autoGroupByComponent = e.autoGroupByComponent), e.autoGroupByCorrelationId !== void 0 && (w.autoGroupByCorrelationId = e.autoGroupByCorrelationId), e.collapseByDefault !== void 0 && (w.collapseByDefault = e.collapseByDefault), e.maxOpenGroups && (w.maxOpenGroups = e.maxOpenGroups), e.autoCloseAfterMs !== void 0 && (w.autoCloseAfterMs = e.autoCloseAfterMs), { ok: !0, config: Ar() };
}
function kr(e) {
  w.enabled = e, e || Tt();
}
function Ar() {
  return { ...w };
}
function Tr() {
  var e = [];
  return x.forEach(function(t, n) {
    e.push({ id: n, label: t.label, logCount: t.logCount });
  }), {
    enabled: w.enabled,
    activeGroups: e,
    groupsOpened: ge.groupsOpened,
    groupsClosed: ge.groupsClosed,
    logsGrouped: ge.logsGrouped
  };
}
var U = null;
function Mr(e) {
  U = e;
}
function we(e) {
  if (e = e || {}, !U || typeof U.getBuffer != "function")
    return console.warn("[Logger Replay] Buffer não disponível"), { ok: !1, reason: "buffer-not-available" };
  var t = U.getBuffer(), n = Mt(t, e);
  return n.length === 0 ? (console.info("[Logger Replay] Nenhum log encontrado com os filtros aplicados"), { ok: !0, replayed: 0 }) : (console.group("📜 Logger Replay (" + n.length + " logs)"), n.forEach(function(r, i) {
    Ot(r);
  }), console.groupEnd(), { ok: !0, replayed: n.length, total: t.length });
}
function Mt(e, t) {
  return e.filter(function(n) {
    if (t.level) {
      if (Array.isArray(t.level)) {
        if (t.level.indexOf(n.level) === -1) return !1;
      } else if (n.level !== t.level) return !1;
    }
    if (t.component && n.component.indexOf(t.component) === -1)
      return !1;
    if (t.message) {
      if (t.message instanceof RegExp) {
        if (!t.message.test(n.message)) return !1;
      } else if (n.message.indexOf(t.message) === -1) return !1;
    }
    if (t.since) {
      var r = typeof t.since == "number" ? t.since : Date.now() - t.since;
      if (n.timestamp < r) return !1;
    }
    return !(t.correlationId && n.correlationId !== t.correlationId || t.limit && e.indexOf(n) >= t.limit);
  });
}
function Ot(e, t) {
  var n = new Date(e.timestamp).toLocaleTimeString(), r = "[" + n + "] [" + e.level.toUpperCase() + "] [" + e.component + "]", i = [r, e.message];
  switch (e.context && Object.keys(e.context).length > 0 && i.push(e.context), e.level) {
    case "error":
    case "critical":
      console.error.apply(console, i);
      break;
    case "warn":
      console.warn.apply(console, i);
      break;
    case "debug":
    case "trace":
      console.debug.apply(console, i);
      break;
    default:
      console.log.apply(console, i);
  }
}
function Or(e) {
  if (e = e || 20, !U)
    return console.warn("[Logger Replay] Buffer não disponível"), { ok: !1 };
  var t = U.getRecentLogs(e);
  return console.group("📜 Últimos " + t.length + " logs"), t.forEach(function(n, r) {
    Ot(n);
  }), console.groupEnd(), { ok: !0, replayed: t.length };
}
function Br() {
  return we({ level: ["error", "critical"] });
}
function Dr(e) {
  return we({ component: e });
}
function Fr(e) {
  return we({ correlationId: e });
}
function Rr(e) {
  var t;
  return typeof e == "number" && e < 1e12 ? t = Date.now() - e : t = e, we({ since: t });
}
function Pr(e) {
  if (!U)
    return [];
  var t = U.getBuffer();
  return Mt(t, e);
}
var Ee = null;
function Bt(e) {
  Ee = e;
}
function f(e, t, n) {
  return Ee && typeof Ee[e] == "function" ? Ee[e](t, n) : { ok: !1, reason: "logger-not-available" };
}
function xr(e, t, n, r, i) {
  i = i || {};
  var o = n >= 500 ? "error" : n >= 400 ? "warn" : "info", s = e.toUpperCase() + " " + t + " → " + n + " (" + r + "ms)";
  return f(o, s, {
    type: "api",
    method: e.toUpperCase(),
    url: t,
    status: n,
    duration: r,
    ...i
  });
}
function Ur(e, t, n) {
  return f("debug", "API Request: " + e.toUpperCase() + " " + t, {
    type: "api-start",
    method: e.toUpperCase(),
    url: t,
    ...n
  });
}
function zr(e, t, n, r) {
  var i = "API Error: " + e.toUpperCase() + " " + t + " - " + (n.message || n);
  return f("error", i, {
    type: "api-error",
    method: e.toUpperCase(),
    url: t,
    error: n.message || String(n),
    ...r
  });
}
function Gr(e, t) {
  return f("info", "Component mounted: " + e, {
    type: "component-lifecycle",
    action: "mount",
    component: e,
    ...t
  });
}
function Nr(e, t) {
  return f("info", "Component unmounted: " + e, {
    type: "component-lifecycle",
    action: "unmount",
    component: e,
    ...t
  });
}
function Wr(e, t, n) {
  return f("error", "Component error: " + e + " - " + (t.message || t), {
    type: "component-error",
    component: e,
    error: t.message || String(t),
    stack: t.stack,
    ...n
  });
}
function Dt(e, t, n) {
  return f("info", "User action: " + e + " on " + t, {
    type: "user-action",
    action: e,
    target: t,
    ...n
  });
}
function jr(e, t) {
  return Dt("click", e, t);
}
function $r(e, t, n) {
  return f("info", "Navigation: " + e + " → " + t, {
    type: "navigation",
    from: e,
    to: t,
    ...n
  });
}
function Ft(e, t, n) {
  var r = t > 3e3 ? "warn" : t > 1e3 ? "info" : "debug", i = "Perf: " + e + " completed in " + t + "ms";
  return f(r, i, {
    type: "performance",
    operation: e,
    duration: t,
    slow: t > 1e3,
    ...n
  });
}
function Vr(e) {
  return {
    operation: e,
    startTime: Date.now(),
    end: function(t) {
      var n = Date.now() - this.startTime;
      return Ft(e, n, t);
    }
  };
}
function Hr(e, t) {
  return f("info", "User logged in: " + e, {
    type: "auth",
    action: "login",
    userId: e,
    ...t
  });
}
function qr(e, t) {
  return f("info", "User logged out: " + e, {
    type: "auth",
    action: "logout",
    userId: e,
    ...t
  });
}
function Zr(e, t, n) {
  return f("error", "Auth error during " + e + ": " + (t.message || t), {
    type: "auth-error",
    action: e,
    error: t.message || String(t),
    ...n
  });
}
function Jr(e, t, n) {
  return f("info", "Fetched " + t + " " + e, {
    type: "data-fetch",
    resource: e,
    count: t,
    ...n
  });
}
function Kr(e, t, n) {
  return f("info", "Saved " + e + ": " + t, {
    type: "data-save",
    resource: e,
    id: t,
    ...n
  });
}
function Xr(e, t, n) {
  return f("info", "Deleted " + e + ": " + t, {
    type: "data-delete",
    resource: e,
    id: t,
    ...n
  });
}
function Yr(e, t, n) {
  return f("info", "System started: " + e + " v" + t, {
    type: "system",
    action: "start",
    module: e,
    version: t,
    ...n
  });
}
function Qr(e, t) {
  return f("info", "System ready: " + e, {
    type: "system",
    action: "ready",
    module: e,
    ...t
  });
}
function eo(e, t, n) {
  return f("error", "System error: " + e + " - " + (t.message || t), {
    type: "system-error",
    module: e,
    error: t.message || String(t),
    ...n
  });
}
const to = "logger-global-anomaly";
Wt({ moduleId: to });
var S = {
  enabled: !0,
  windowMs: 6e4,
  thresholds: {
    error: { count: 50, action: "alert" },
    critical: { count: 10, action: "alert" },
    warn: { count: 100, action: "log" }
  },
  cooldownMs: 3e5
}, Ve = {}, no = [], ze = {
  anomaliesDetected: 0,
  alertsTriggered: 0,
  byLevel: {}
}, Ge = [];
function ro(e) {
  return typeof e == "function" && Ge.push(e), function() {
    Ge = Ge.filter(function(t) {
      return t !== e;
    });
  };
}
function Rt(e) {
  return e = e || 10, no.slice(-e);
}
function oo() {
  var e = {}, t = Date.now();
  for (var n in Ve) {
    var r = Ve[n], i = S.thresholds[n];
    e[n] = {
      count: r.count,
      threshold: i ? i.count : null,
      percentage: i ? Math.round(r.count / i.count * 100) : 0,
      windowRemaining: Math.max(0, S.windowMs - (t - r.windowStart))
    };
  }
  return e;
}
function io(e) {
  if (e = e || {}, e.enabled !== void 0 && (S.enabled = e.enabled), e.windowMs && (S.windowMs = e.windowMs), e.cooldownMs && (S.cooldownMs = e.cooldownMs), e.thresholds)
    for (var t in e.thresholds)
      S.thresholds[t] = e.thresholds[t];
  return { ok: !0, config: so() };
}
function ao(e) {
  S.enabled = e, e || (Ve = {});
}
function so() {
  return {
    enabled: S.enabled,
    windowMs: S.windowMs,
    cooldownMs: S.cooldownMs,
    thresholds: { ...S.thresholds }
  };
}
function Ne() {
  return {
    enabled: S.enabled,
    anomaliesDetected: ze.anomaliesDetected,
    alertsTriggered: ze.alertsTriggered,
    byLevel: { ...ze.byLevel },
    currentStatus: oo(),
    recentAnomalies: Rt(5)
  };
}
async function lo(e, t = {}) {
  const {
    retries: n = 3,
    baseDelayMs: r = 500,
    maxDelayMs: i = 5e3,
    backoffMultiplier: o = 2,
    shouldRetry: s = () => !0
  } = t;
  let l = null;
  for (let d = 0; d <= n; d++)
    try {
      return { ok: !0, result: await e(d), attempts: d + 1 };
    } catch (I) {
      if (l = I, d < n && s(I, d)) {
        const Z = Math.min(r * Math.pow(o, d), i);
        await uo(Z);
      }
    }
  return { ok: !1, error: l, attempts: n + 1 };
}
function uo(e) {
  return new Promise((t) => setTimeout(t, e));
}
async function co(e) {
  return lo(e, {
    retries: 2,
    baseDelayMs: 200,
    maxDelayMs: 1e3,
    shouldRetry: (t) => !((t == null ? void 0 : t.name) === "AbortError" || (t == null ? void 0 : t.status) === 401 || (t == null ? void 0 : t.status) === 403)
  });
}
async function fo(e, t = "/api/logs") {
  if (!e || !Array.isArray(e) || e.length === 0)
    return { ok: !0, sent: 0 };
  try {
    const n = JSON.stringify({ logs: e, timestamp: Date.now() });
    if (navigator.sendBeacon && n.length < 65536)
      return { ok: navigator.sendBeacon(t, new Blob([n], { type: "application/json" })), sent: e.length, method: "beacon" };
    const r = await co(async () => {
      const i = new AbortController(), o = setTimeout(() => i.abort(), 1e4);
      try {
        const s = await fetch(t, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: n,
          keepalive: !0,
          signal: i.signal
        });
        if (clearTimeout(o), !s.ok) throw new Error(`HTTP ${s.status}`);
        return s;
      } catch (s) {
        throw clearTimeout(o), s;
      }
    });
    return r.ok ? { ok: !0, sent: e.length, method: "fetch", attempts: r.attempts } : { ok: !1, error: r.error, sent: 0, method: "fetch" };
  } catch (n) {
    return { ok: !1, error: n, sent: 0 };
  }
}
var p = {
  enabled: !1,
  endpoint: "/api/logs",
  syncIntervalMs: 3e4,
  // 30 segundos
  batchSize: 50,
  maxRetries: 3,
  sendOnUnload: !0
}, h = [], ee = null, E = {
  syncsAttempted: 0,
  syncsSucceeded: 0,
  syncsFailed: 0,
  logsSent: 0,
  logsDropped: 0,
  lastSyncAt: null,
  lastError: null
};
function po(e) {
  return e = e || {}, e.enabled !== void 0 && (p.enabled = e.enabled), e.endpoint && (p.endpoint = e.endpoint), e.syncIntervalMs && (p.syncIntervalMs = e.syncIntervalMs), e.batchSize && (p.batchSize = e.batchSize), e.maxRetries && (p.maxRetries = e.maxRetries), e.sendOnUnload !== void 0 && (p.sendOnUnload = e.sendOnUnload), p.enabled && (Pt(), go()), { ok: !0, config: mo() };
}
async function Xe() {
  if (h.length === 0)
    return { ok: !0, sent: 0 };
  var e = h.splice(0, p.batchSize);
  E.syncsAttempted++;
  try {
    var t = await fo(e, p.endpoint);
    return t.ok ? (E.syncsSucceeded++, E.logsSent += e.length, E.lastSyncAt = Date.now(), { ok: !0, sent: e.length }) : (h.length < p.batchSize * 3 ? h = e.concat(h) : E.logsDropped += e.length, E.syncsFailed++, E.lastError = t.error ? t.error.message : "Unknown error", { ok: !1, error: t.error });
  } catch (n) {
    return E.syncsFailed++, E.lastError = n.message, E.logsDropped += e.length, { ok: !1, error: n };
  }
}
function Pt() {
  ee && clearInterval(ee), ee = setInterval(function() {
    h.length > 0 && Xe();
  }, p.syncIntervalMs);
}
function xt() {
  ee && (clearInterval(ee), ee = null);
}
function go() {
  if (!(typeof window > "u")) {
    var e = function() {
      if (h.length > 0 && p.sendOnUnload)
        try {
          var t = JSON.stringify({ logs: h, timestamp: Date.now() });
          navigator.sendBeacon(p.endpoint, new Blob([t], { type: "application/json" }));
        } catch {
        }
    };
    window.addEventListener("beforeunload", e), window.addEventListener("unload", e), window.addEventListener("pagehide", e);
  }
}
function vo(e) {
  p.enabled = e, e ? Pt() : xt();
}
function mo() {
  return { ...p };
}
function st() {
  return {
    enabled: p.enabled,
    bufferSize: h.length,
    ...E
  };
}
async function wo() {
  for (var e = []; h.length > 0; ) {
    var t = await Xe();
    if (e.push(t), !t.ok) break;
  }
  return {
    ok: e.every(function(n) {
      return n.ok;
    }),
    batches: e.length,
    totalSent: e.reduce(function(n, r) {
      return n + (r.sent || 0);
    }, 0)
  };
}
function ho() {
  if (xt(), h.length > 0 && typeof navigator < "u" && navigator.sendBeacon)
    try {
      var e = JSON.stringify({ logs: h, timestamp: Date.now() });
      navigator.sendBeacon(p.endpoint, new Blob([e], { type: "application/json" }));
    } catch {
    }
  var t = h.length;
  return h = [], { ok: !0, pendingFlushed: t };
}
var re = {
  clipboard: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
}, z = null, me = !1, L = null, M = { level: "all", component: "", search: "" }, _e = null, bo = '.logger-inspector{position:fixed;bottom:0;right:0;width:500px;height:400px;background:#1a1a2e;color:#eee;font-family:"Consolas","Monaco",monospace;font-size:12px;border:1px solid #333;border-radius:8px 0 0 0;box-shadow:-2px -2px 10px rgba(0,0,0,0.3);z-index:99999;display:flex;flex-direction:column;overflow:hidden}.logger-inspector-header{background:#16213e;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #333}.logger-inspector-title{font-weight:bold;color:#4CAF50;display:flex;align-items:center;gap:6px}.logger-inspector-controls{display:flex;gap:8px}.logger-inspector-btn{background:#333;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:4px}.logger-inspector-btn:hover{background:#444}.logger-inspector-filters{background:#1f1f3d;padding:8px;display:flex;gap:8px;border-bottom:1px solid #333}.logger-inspector-filters select,.logger-inspector-filters input{background:#333;color:#fff;border:1px solid #444;padding:4px 8px;border-radius:4px;font-size:11px}.logger-inspector-logs{flex:1;overflow-y:auto;padding:8px}.logger-inspector-log{padding:4px 8px;border-bottom:1px solid #222;cursor:pointer}.logger-inspector-log:hover{background:#2a2a4e}.logger-inspector-log.level-error{border-left:3px solid #F44336}.logger-inspector-log.level-warn{border-left:3px solid #FF9800}.logger-inspector-log.level-info{border-left:3px solid #4CAF50}.logger-inspector-log.level-debug{border-left:3px solid #2196F3}.logger-inspector-log.level-critical{border-left:3px solid #9C27B0}.logger-inspector-time{color:#888;margin-right:8px}.logger-inspector-level{font-weight:bold;margin-right:8px}.logger-inspector-component{color:#64B5F6;margin-right:8px}.logger-inspector-message{color:#ddd}.logger-inspector-footer{background:#16213e;padding:6px 12px;font-size:10px;color:#888;border-top:1px solid #333}';
function yo() {
  if (!document.getElementById("logger-inspector-styles")) {
    var e = document.createElement("style");
    e.id = "logger-inspector-styles", e.textContent = bo, document.head.appendChild(e);
  }
}
function So() {
  return L || (yo(), L = document.createElement("div"), L.className = "logger-inspector", L.innerHTML = '<div class="logger-inspector-header"><span class="logger-inspector-title">' + re.clipboard + ' Logger Inspector</span><div class="logger-inspector-controls"><button class="logger-inspector-btn" id="li-refresh">' + re.refresh + ' Refresh</button><button class="logger-inspector-btn" id="li-clear">' + re.trash + ' Clear</button><button class="logger-inspector-btn" id="li-export">' + re.download + ' Export</button><button class="logger-inspector-btn" id="li-close">' + re.x + '</button></div></div><div class="logger-inspector-filters"><select id="li-level"><option value="all">All Levels</option><option value="critical">Critical</option><option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option><option value="debug">Debug</option><option value="trace">Trace</option></select><input type="text" id="li-component" placeholder="Component..." /><input type="text" id="li-search" placeholder="Search..." style="flex:1" /></div><div class="logger-inspector-logs" id="li-logs"></div><div class="logger-inspector-footer" id="li-footer">Ready</div>', document.body.appendChild(L), Eo(), L);
}
function Eo() {
  document.getElementById("li-close").onclick = ke, document.getElementById("li-refresh").onclick = $, document.getElementById("li-clear").onclick = Lo, document.getElementById("li-export").onclick = ko, document.getElementById("li-level").onchange = function(e) {
    M.level = e.target.value, $();
  }, document.getElementById("li-component").oninput = function(e) {
    M.component = e.target.value, $();
  }, document.getElementById("li-search").oninput = function(e) {
    M.search = e.target.value, $();
  };
}
function _o(e) {
  var t = document.getElementById("li-logs");
  if (t) {
    t.innerHTML = "", e.forEach(function(r) {
      var i = document.createElement("div");
      i.className = "logger-inspector-log level-" + r.level;
      var o = new Date(r.timestamp).toLocaleTimeString();
      i.innerHTML = '<span class="logger-inspector-time">' + o + '</span><span class="logger-inspector-level">' + r.level.toUpperCase() + '</span><span class="logger-inspector-component">[' + r.component + ']</span><span class="logger-inspector-message">' + Io(r.message.substring(0, 100)) + "</span>", i.onclick = function() {
        console.log("Log Details:", r);
      }, t.appendChild(i);
    }), t.scrollTop = t.scrollHeight;
    var n = document.getElementById("li-footer");
    n && (n.textContent = "Showing " + e.length + " logs | Last update: " + (/* @__PURE__ */ new Date()).toLocaleTimeString());
  }
}
function Io(e) {
  var t = document.createElement("div");
  return t.textContent = e, t.innerHTML;
}
function Co(e) {
  return e.filter(function(t) {
    return !(M.level !== "all" && t.level !== M.level || M.component && t.component.indexOf(M.component) === -1 || M.search && t.message.indexOf(M.search) === -1);
  });
}
function $() {
  if (z) {
    var e = z.getBuffer(), t = Co(e);
    _o(t);
  }
}
function Lo() {
  z && z.clearBuffer && z.clearBuffer(), $();
}
function ko() {
  if (z) {
    var e = z.getBuffer(), t = JSON.stringify(e, null, 2), n = new Blob([t], { type: "application/json" }), r = URL.createObjectURL(n), i = document.createElement("a");
    i.href = r, i.download = "logs-" + Date.now() + ".json", i.click(), URL.revokeObjectURL(r);
  }
}
function Ao(e) {
  z = e;
}
function Ut() {
  me || (So(), L.style.display = "flex", me = !0, $(), _e = setInterval($, 2e3));
}
function ke() {
  me && (L && (L.style.display = "none"), _e && (clearInterval(_e), _e = null), me = !1);
}
function zt() {
  me ? ke() : Ut();
}
typeof window < "u" && window.addEventListener("keydown", function(e) {
  e.ctrlKey && e.shiftKey && e.key === "L" && (e.preventDefault(), zt());
});
var H = null, q = /* @__PURE__ */ new Map(), C = {
  enabled: !0,
  workerPath: "/assets/js/core/logger-global/workers/serializer.worker.js",
  timeout: 5e3,
  fallbackToSync: !0
}, Ae = {
  requestsSent: 0,
  requestsCompleted: 0,
  requestsFailed: 0,
  requestsTimedOut: 0,
  fallbacksUsed: 0
};
function To(e) {
  if (e = e || {}, e.enabled !== void 0 && (C.enabled = e.enabled), e.workerPath && (C.workerPath = e.workerPath), e.timeout && (C.timeout = e.timeout), e.fallbackToSync !== void 0 && (C.fallbackToSync = e.fallbackToSync), !C.enabled)
    return { ok: !0, status: "disabled" };
  if (typeof Worker > "u")
    return C.enabled = !1, { ok: !1, reason: "workers-not-supported" };
  try {
    return H = new Worker(C.workerPath), H.onmessage = function(t) {
      Mo(t.data);
    }, H.onerror = function(t) {
      Oo(t);
    }, { ok: !0, status: "initialized" };
  } catch (t) {
    return C.enabled = !1, { ok: !1, error: t.message };
  }
}
function Mo(e) {
  var t = q.get(e.id);
  t && (clearTimeout(t.timer), q.delete(e.id), e.ok ? (Ae.requestsCompleted++, t.resolve({ ok: !0, result: e.result })) : (Ae.requestsFailed++, t.reject(new Error(e.error))));
}
function Oo(e) {
  console.error("[Worker Manager] Worker error:", e), q.forEach(function(t) {
    clearTimeout(t.timer), Ae.requestsFailed++, t.reject(e);
  }), q.clear();
}
function He() {
  return C.enabled && H !== null;
}
function Bo() {
  return H && (H.terminate(), H = null), q.forEach(function(e) {
    clearTimeout(e.timer);
  }), q.clear(), { ok: !0 };
}
function lt() {
  return {
    enabled: C.enabled,
    available: He(),
    pendingRequests: q.size,
    ...Ae
  };
}
const K = "4.2.0-STRICT", Ie = "logger-global";
function Uo() {
  return K;
}
let We = null;
function W() {
  return J() ? Promise.resolve() : (We || (We = bt().catch(function() {
  })), We);
}
Mr(wt);
Ao(wt);
const u = {
  // ═══════════════════════════════════════════════════════════════
  // LOG METHODS (níveis)
  // ═══════════════════════════════════════════════════════════════
  trace: function(e, t) {
    return t = t || {}, W(), N("trace", e, t);
  },
  debug: function(e, t) {
    return t = t || {}, W(), N("debug", e, t);
  },
  info: function(e, t) {
    return t = t || {}, W(), N("info", e, t);
  },
  warn: function(e, t) {
    return t = t || {}, W(), N("warn", e, t);
  },
  error: function(e, t) {
    return t = t || {}, W(), N("error", e, t);
  },
  critical: function(e, t) {
    return t = t || {}, W(), N("critical", e, t);
  },
  log: function(e, t, n) {
    return n = n || {}, W(), N(e, t, n);
  },
  // ═══════════════════════════════════════════════════════════════
  // CORRELATION ID
  // ═══════════════════════════════════════════════════════════════
  setCorrelationId: function(e) {
    return ut(e);
  },
  getCorrelationId: function() {
    return P();
  },
  ensureCorrelationId: function() {
    return qe();
  },
  // ═══════════════════════════════════════════════════════════════
  // USER
  // ═══════════════════════════════════════════════════════════════
  setUser: function(e, t) {
    return $t(e, t);
  },
  getUser: function() {
    return { userId: oe(), userRole: ye() };
  },
  clearUser: function() {
    return dt();
  },
  // ═══════════════════════════════════════════════════════════════
  // SESSION
  // ═══════════════════════════════════════════════════════════════
  setSession: function(e) {
    return Vt(e);
  },
  getSession: function() {
    return Se();
  },
  // ═══════════════════════════════════════════════════════════════
  // SANITIZAÇÃO LGPD
  // ═══════════════════════════════════════════════════════════════
  sanitize: function(e) {
    return Ce(e);
  },
  anonymizeId: function(e) {
    return ct(e);
  },
  maskEmail: function(e) {
    return Yt(e);
  },
  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  init: async function(e) {
    e = e || {};
    var t = await bt(e);
    return tr(e.batch), sr(e.throttle), hr(e.stackTrace), Sr(e.deduplication), Lr(e.grouping), io(e.anomaly), po(e.backendSync), To(e.worker), Bt(u), t;
  },
  shutdown: function() {
    return rr(), ho(), Bo(), ke(), Pn();
  },
  isReady: function() {
    return J();
  },
  getVersion: function() {
    return K;
  },
  // ═══════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════
  enableLevel: function(e) {
    return xn(e);
  },
  disableLevel: function(e) {
    return Un(e);
  },
  enableComponentDebug: function(e) {
    return zn(e);
  },
  disableComponent: function(e) {
    return Gn(e);
  },
  getConfig: function() {
    return j();
  },
  updateConfig: function(e) {
    return Vn(e);
  },
  // ═══════════════════════════════════════════════════════════════
  // SILENT MODE
  // ═══════════════════════════════════════════════════════════════
  setSilentMode: function(e) {
    return he(e);
  },
  getSilentMode: function() {
    return Wn();
  },
  isSilent: function() {
    return jn();
  },
  getSilentStats: function() {
    return be();
  },
  resetSilentStats: function() {
    return nt();
  },
  silent: function() {
    return he("soft");
  },
  verbose: function() {
    return he("off");
  },
  mute: function() {
    return he("hard");
  },
  // ═══════════════════════════════════════════════════════════════
  // BUFFER
  // ═══════════════════════════════════════════════════════════════
  getBuffer: function() {
    return F();
  },
  clearBuffer: function() {
    return Oe();
  },
  flushBuffer: function() {
    return vt();
  },
  getRecentLogs: function(e) {
    return mt(e);
  },
  getBufferStats: function() {
    return ie();
  },
  // ═══════════════════════════════════════════════════════════════
  // TRACE SPANS (APM)
  // ═══════════════════════════════════════════════════════════════
  startSpan: function(e, t) {
    return Lt(e, t);
  },
  endSpan: function(e, t, n) {
    return je(e, t, n);
  },
  withSpan: function(e, t, n) {
    return wr(e, t, n);
  },
  getActiveSpans: function() {
    return vr();
  },
  getCompletedSpans: function(e) {
    return mr(e);
  },
  getSpanStats: function() {
    return it();
  },
  // ═══════════════════════════════════════════════════════════════
  // THROTTLE
  // ═══════════════════════════════════════════════════════════════
  setThrottleEnabled: function(e) {
    return lr(e);
  },
  getThrottleStats: function() {
    return ot();
  },
  releaseThrottle: function(e) {
    return dr(e);
  },
  releaseAllThrottles: function() {
    return cr();
  },
  // ═══════════════════════════════════════════════════════════════
  // DEDUPLICATION
  // ═══════════════════════════════════════════════════════════════
  setDedupEnabled: function(e) {
    return Er(e);
  },
  getDedupStats: function() {
    return at();
  },
  getDedupSummary: function() {
    return kt();
  },
  flushDuplicates: function() {
    return yr();
  },
  // ═══════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════════
  setAnomalyEnabled: function(e) {
    return ao(e);
  },
  getAnomalyStats: function() {
    return Ne();
  },
  getRecentAnomalies: function(e) {
    return Rt(e);
  },
  onAnomaly: function(e) {
    return ro(e);
  },
  // ═══════════════════════════════════════════════════════════════
  // CONSOLE GROUPING
  // ═══════════════════════════════════════════════════════════════
  group: function(e) {
    return Ir(e);
  },
  groupCollapsed: function(e) {
    return Cr(e);
  },
  groupEnd: function() {
    return Tt();
  },
  setGroupingEnabled: function(e) {
    return kr(e);
  },
  getGroupingStats: function() {
    return Tr();
  },
  // ═══════════════════════════════════════════════════════════════
  // REPLAY
  // ═══════════════════════════════════════════════════════════════
  replay: function(e) {
    return we(e);
  },
  replayLast: function(e) {
    return Or(e);
  },
  replayErrors: function() {
    return Br();
  },
  replayComponent: function(e) {
    return Dr(e);
  },
  replayCorrelation: function(e) {
    return Fr(e);
  },
  replaySince: function(e) {
    return Rr(e);
  },
  search: function(e) {
    return Pr(e);
  },
  // ═══════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════
  api: function(e, t, n, r, i) {
    return xr(e, t, n, r, i);
  },
  apiStart: function(e, t, n) {
    return Ur(e, t, n);
  },
  apiError: function(e, t, n, r) {
    return zr(e, t, n, r);
  },
  componentMount: function(e, t) {
    return Gr(e, t);
  },
  componentUnmount: function(e, t) {
    return Nr(e, t);
  },
  componentError: function(e, t, n) {
    return Wr(e, t, n);
  },
  userAction: function(e, t, n) {
    return Dt(e, t, n);
  },
  userClick: function(e, t) {
    return jr(e, t);
  },
  userNavigation: function(e, t, n) {
    return $r(e, t, n);
  },
  perf: function(e, t, n) {
    return Ft(e, t, n);
  },
  perfStart: function(e) {
    return Vr(e);
  },
  authLogin: function(e, t) {
    return Hr(e, t);
  },
  authLogout: function(e, t) {
    return qr(e, t);
  },
  authError: function(e, t, n) {
    return Zr(e, t, n);
  },
  dataFetch: function(e, t, n) {
    return Jr(e, t, n);
  },
  dataSave: function(e, t, n) {
    return Kr(e, t, n);
  },
  dataDelete: function(e, t, n) {
    return Xr(e, t, n);
  },
  systemStart: function(e, t, n) {
    return Yr(e, t, n);
  },
  systemReady: function(e, t) {
    return Qr(e, t);
  },
  systemError: function(e, t, n) {
    return eo(e, t, n);
  },
  // ═══════════════════════════════════════════════════════════════
  // BACKEND SYNC
  // ═══════════════════════════════════════════════════════════════
  setBackendSyncEnabled: function(e) {
    return vo(e);
  },
  syncNow: function() {
    return Xe();
  },
  flushSync: function() {
    return wo();
  },
  getBackendSyncStats: function() {
    return st();
  },
  // ═══════════════════════════════════════════════════════════════
  // BATCH WRITING
  // ═══════════════════════════════════════════════════════════════
  setBatchEnabled: function(e) {
    return nr(e);
  },
  flushBatch: function() {
    return Be();
  },
  getBatchStats: function() {
    return rt();
  },
  // ═══════════════════════════════════════════════════════════════
  // INSPECTOR UI
  // ═══════════════════════════════════════════════════════════════
  openInspector: function() {
    return Ut();
  },
  closeInspector: function() {
    return ke();
  },
  toggleInspector: function() {
    return zt();
  },
  // ═══════════════════════════════════════════════════════════════
  // WORKER
  // ═══════════════════════════════════════════════════════════════
  isWorkerAvailable: function() {
    return He();
  },
  getWorkerStats: function() {
    return lt();
  },
  // ═══════════════════════════════════════════════════════════════
  // STATS & HEALTH
  // ═══════════════════════════════════════════════════════════════
  getStats: function() {
    return {
      write: Pe(),
      buffer: ie(),
      forwarding: Re(),
      silent: be(),
      throttle: ot(),
      dedup: at(),
      anomaly: Ne(),
      spans: it(),
      batch: rt(),
      backendSync: st(),
      worker: lt(),
      config: j(),
      correlationId: P(),
      user: { userId: oe(), userRole: ye() },
      sessionId: Se()
    };
  },
  resetStats: function() {
    Qn(), nt();
  },
  healthCheck: function() {
    var e = j(), t = Pe(), n = ie(), r = Re(), i = be(), o = Ne(), s = [];
    return J() || s.push("Not initialized"), t.errors > 0 && s.push("Write errors: " + t.errors), n.utilizationPercent > 90 && s.push("Buffer near capacity"), e.telemetryForwarding && !r.available && s.push("Telemetry unavailable"), P() || s.push("No correlationId set"), o.anomaliesDetected > 0 && s.push("Anomalies detected: " + o.anomaliesDetected), {
      healthy: s.length === 0,
      status: s.length === 0 ? "HEALTHY" : s.length < 3 ? "DEGRADED" : "UNHEALTHY",
      version: K,
      moduleId: Ie,
      initialized: J(),
      debugMode: e.debugMode,
      silentMode: i.mode,
      silentSuppressed: i.suppressedCount,
      telemetryAvailable: r.available,
      eventBusEnabled: e.eventBusEnabled,
      bufferUtilization: n.utilizationPercent,
      bufferCircular: n.isCircular,
      totalLogs: t.total,
      totalErrors: t.errors,
      consoleSuppressed: t.consoleSuppressed,
      eventBusEmits: t.eventBusEmits,
      workerAvailable: He(),
      correlationId: P(),
      userId: oe(),
      issues: s.length > 0 ? s : null,
      p24Instrumented: !0,
      timestamp: Date.now()
    };
  },
  getInfo: function() {
    return {
      moduleId: Ie,
      version: K,
      isReady: J(),
      healthCheck: this.healthCheck(),
      diagnostics: this.getDiagnostics(),
      features: [
        "Silent Mode",
        "Batch Writing",
        "Throttle",
        "Trace Spans",
        "Stack Trace Auto",
        "Deduplication",
        "Console Grouping",
        "Replay",
        "Templates",
        "Anomaly Detection",
        "Backend Sync",
        "Interactive Inspector",
        "Web Worker",
        "Circular Buffer"
      ],
      p24Instrumented: !0,
      timestamp: Date.now()
    };
  },
  getDiagnostics: function() {
    var e = Pe(), t = ie(), n = Re(), r = be(), i = j();
    return {
      moduleId: Ie,
      version: K,
      isReady: J(),
      debugMode: i.debugMode,
      minLevel: i.minLevel,
      consoleEnabled: i.consoleOutput,
      telemetryEnabled: i.telemetryForwarding,
      bufferEnabled: i.bufferEnabled,
      eventBusEnabled: i.eventBusEnabled,
      silentMode: r.mode,
      silentSuppressedCount: r.suppressedCount,
      correlationId: P(),
      userId: oe(),
      userRole: ye(),
      sessionId: Se(),
      stats: {
        totalLogs: e.total,
        errors: e.errors,
        consoleWrites: e.consoleWrites,
        consoleSuppressed: e.consoleSuppressed,
        telemetryForwards: e.telemetryForwards,
        eventBusEmits: e.eventBusEmits,
        bufferSize: t.currentSize,
        bufferMax: t.maxSize,
        forwardingAvailable: n.available
      },
      enabledLevels: i.enabledLevels,
      enabledComponents: i.enabledComponents.length,
      disabledComponents: i.disabledComponents.length
    };
  },
  async reconnectTelemetry() {
    try {
      var e = await pt();
      return e.ok && e.available ? (Me(!0), { ok: !0, message: "Telemetry forwarding reconectado" }) : { ok: !1, reason: "Telemetry nao disponivel", result: e };
    } catch (t) {
      return { ok: !1, error: t };
    }
  }
};
function Do(e) {
  var t = { component: e };
  return {
    trace: function(n, r) {
      return u.trace(n, R(t, r || {}));
    },
    debug: function(n, r) {
      return u.debug(n, R(t, r || {}));
    },
    info: function(n, r) {
      return u.info(n, R(t, r || {}));
    },
    warn: function(n, r) {
      return u.warn(n, R(t, r || {}));
    },
    error: function(n, r) {
      return u.error(n, R(t, r || {}));
    },
    critical: function(n, r) {
      return u.critical(n, R(t, r || {}));
    },
    log: function(n, r, i) {
      return u.log(n, r, R(t, i || {}));
    },
    startSpan: function(n, r) {
      return u.startSpan(n, R(t, r || {}));
    },
    setCorrelationId: function(n) {
      return u.setCorrelationId(n);
    },
    setUser: function(n, r) {
      return u.setUser(n, r);
    },
    setSession: function(n) {
      return u.setSession(n);
    }
  };
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.logger = {
  getVersion: () => K,
  info: () => u.getInfo(),
  healthCheck: () => u.healthCheck(),
  getStats: () => u.getStats(),
  getDiagnostics: () => u.getDiagnostics(),
  getBuffer: () => u.getBuffer(),
  replay: (e) => u.replay(e),
  replayLast: (e) => u.replayLast(e),
  replayErrors: () => u.replayErrors(),
  openInspector: () => u.openInspector(),
  closeInspector: () => u.closeInspector()
}, Gt() ? Nt("GLOBAL_EXPOSURE_BLOCKED", {
  moduleId: Ie,
  globals: ["Logger", "createLogger"],
  reason: "Strict mode active - use ES modules import"
}) : (window.Logger = u, window.createLogger = Do), qe(), Bt(u));
export {
  u as Logger,
  Ie as MODULE_ID,
  K as VERSION,
  Do as createLogger,
  u as default,
  Uo as getVersion
};
