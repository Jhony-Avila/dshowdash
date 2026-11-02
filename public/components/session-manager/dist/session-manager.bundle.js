import { createCorePorts as B } from "/core/runtime/ports-profiles.js";
import { isStrict as pt, recordViolation as Pr } from "/core/runtime/enterprise/strict-mode.js";
import { SESSION_EVENTS as pe, AUTH_STATES as ft, AUTH_EVENTS as m } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { AUTH_EVENTS as Vo, AUTH_STATES as Fo, SESSION_EVENTS as Go } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const be = "session-manager.ports", Mr = B({ moduleId: be });
function j(e) {
  return Mr.get(e);
}
const k = { info(e, t) {
  t || (t = {});
  const r = j("logger");
  r && r.info && r.info(e, Object.assign({ component: be }, t));
}, warn(e, t) {
  t || (t = {});
  const r = j("logger");
  r && r.warn && r.warn(e, Object.assign({ component: be }, t));
}, error(e, t) {
  t || (t = {});
  const r = j("logger");
  r && r.error && r.error(e, Object.assign({ component: be }, t));
}, debug(e, t) {
  t || (t = {});
  const r = j("logger");
  r && r.debug && r.debug(e, Object.assign({ component: be }, t));
} };
function kt(e) {
  if (e === null || typeof e != "object") return e;
  try {
    return JSON.parse(JSON.stringify(e));
  } catch {
    return e;
  }
}
function qt() {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function Et(e) {
  return e === void 0 && (e = 604800), Date.now() + e * 1e3;
}
function Vr(e, t) {
  return t === void 0 && (t = 18e5), e ? Date.now() - e > t : !0;
}
function Wt(e, t) {
  return t === void 0 && (t = 3e5), e ? e - Date.now() < t : !1;
}
function ze(e) {
  return e ? Date.now() >= e : !0;
}
function Jt(e) {
  if (!e || typeof e != "string") return null;
  try {
    const t = e.split(".");
    return t.length !== 3 ? null : JSON.parse(atob(t[1]));
  } catch {
    return null;
  }
}
function vt(e) {
  const t = Jt(e);
  return !t || !t.exp ? null : t.exp * 1e3;
}
function Kt(e) {
  if (!e) return null;
  const t = Object.assign({}, e);
  return delete t.password, delete t.senha, delete t.hash, delete t.secret, t;
}
const St = "6.0.0-P18EC", Be = "session-manager.state.store", Me = Object.freeze({ authenticated: !1, user: null, userId: null, roles: [], token: null, csrf: null, sessionId: null, expiresAt: null, lastActivity: null, loginAt: null, timeout: 18e5 }), He = B({ moduleId: Be });
function Fr(e) {
  return He.get(e);
}
function Gr(e) {
  return He.inject(e);
}
function Br() {
  return He.snapshot();
}
function X(e, t, r = {}) {
  const n = Fr("logger");
  !n || typeof n[e] != "function" || n[e](t, { component: Be, ...r });
}
const S = Object.freeze({ USER: "user", SYSTEM: "system", API: "api", SYNC: "sync", INTERNAL: "internal" });
let c = Object.freeze({ ...Me }), U = 0, O = null;
const F = [], Zt = 10, ke = /* @__PURE__ */ new Set(), A = { updates: 0, sets: 0, clears: 0, resets: 0, commits: 0, rollbacks: 0, notifications: 0, listenerErrors: 0, lastUpdateAt: null, lastSource: null };
function Xt() {
  return { state: kt(c), version: U, timestamp: Date.now() };
}
function Yr(e, t, r) {
  F.push({ ...e, action: t, source: r }), F.length > Zt && F.shift();
}
function _(e, t, r = null, n = null, s = null) {
  const o = { action: e, source: t, key: r, newValue: n, oldValue: s, state: ue(), version: U, timestamp: Date.now() };
  ke.forEach((u) => {
    try {
      u(o), A.notifications++;
    } catch (g) {
      A.listenerErrors++, X("error", "Listener error", { error: g.message });
    }
  }), A.updates++, A.lastUpdateAt = Date.now(), A.lastSource = t;
}
function L(e, t = S.INTERNAL) {
  const r = Xt();
  return Yr(r, "change", t), c = Object.freeze({ ...c, ...e }), U++, r;
}
function Qt(e = S.INTERNAL) {
  return O && (X("warn", "Transaction already in progress, committing previous"), er()), O = { snapshot: Xt(), source: e, changes: {}, startedAt: Date.now() }, !0;
}
function qr(e) {
  return O || (X("warn", "No transaction in progress, starting one"), Qt(S.INTERNAL)), Object.assign(O.changes, e), !0;
}
function er() {
  if (!O)
    return X("warn", "No transaction to commit"), !1;
  const { changes: e, source: t } = O;
  return L(e, t), A.commits++, _("commit", t, null, e, O.snapshot.state), O = null, !0;
}
function Wr() {
  return O ? (A.rollbacks++, X("info", "Transaction rolled back", { source: O.source }), O = null, !0) : (X("warn", "No transaction to rollback"), !1);
}
function Jr(e) {
  const t = F.find((r) => r.version === e);
  return t ? (A.rollbacks++, c = Object.freeze({ ...t.state }), U++, _("rollback-to-version", S.SYSTEM, null, c, null), X("info", "Rolled back to version", { targetVersion: e, newVersion: U }), !0) : (X("warn", "Version not found in history", { targetVersion: e }), !1);
}
function ue() {
  return kt(c);
}
function Kr(e) {
  return e ? c[e] : ue();
}
function Zr(e, t, r = S.INTERNAL) {
  A.sets++;
  const n = c[e];
  return L({ [e]: t }, r), _("set", r, e, t, n), !0;
}
function Xr(e, t = S.INTERNAL) {
  const r = ue();
  return L(e, t), _("update", t, null, e, r), !0;
}
function Qr(e = S.INTERNAL) {
  A.clears++;
  const t = ue();
  return L({ ...Me }, e), c = Object.freeze({ ...Me }), _("clear", e, null, null, t), !0;
}
function en(e = S.SYSTEM) {
  A.resets++;
  const t = ue();
  return c = Object.freeze({ ...Me }), U++, F.length = 0, O = null, _("reset", e, null, null, t), !0;
}
function tn() {
  return c.authenticated === !0;
}
function rn() {
  return c.user ? kt(c.user) : null;
}
function nn() {
  var e;
  return c.userId || ((e = c.user) == null ? void 0 : e.id) || null;
}
function sn() {
  var e;
  return [...c.roles || ((e = c.user) == null ? void 0 : e.roles) || []];
}
function on() {
  return c.token;
}
function an() {
  return c.csrf;
}
function cn() {
  return c.sessionId;
}
function ln() {
  return c.expiresAt;
}
function un() {
  return c.lastActivity;
}
function fn() {
  return c.loginAt;
}
function dn() {
  return c.timeout || 18e5;
}
function gn() {
  return c.loginAt ? Date.now() - c.loginAt : 0;
}
function hn() {
  return St;
}
function mn() {
  return U;
}
function pn(e, t = S.API) {
  const r = c.user;
  return L({ user: e, userId: (e == null ? void 0 : e.id) || null, roles: (e == null ? void 0 : e.roles) || [], authenticated: e !== null, lastActivity: Date.now() }, t), _("user-set", t, "user", e, r), !0;
}
function kn(e = S.API) {
  const t = c.user;
  return L({ user: null, userId: null, roles: [], authenticated: !1 }, e), _("user-cleared", e, "user", null, t), !0;
}
function En(e, t = S.API) {
  const r = c.token;
  return L({ token: e }, t), _("token-set", t, "token", e ? "[SET]" : null, r ? "[WAS_SET]" : null), !0;
}
function vn(e = S.API) {
  const t = c.token;
  return L({ token: null }, e), _("token-cleared", e, "token", null, t ? "[WAS_SET]" : null), !0;
}
function Sn(e, t = S.API) {
  const r = c.csrf;
  return L({ csrf: e }, t), _("csrf-set", t, "csrf", e ? "[SET]" : null, r ? "[WAS_SET]" : null), !0;
}
function An(e = S.API) {
  return L({ csrf: null }, e), _("csrf-cleared", e, "csrf", null, null), !0;
}
function In(e, t = S.SYSTEM) {
  const r = e || qt();
  return L({ sessionId: r }, t), _("session-started", t, "sessionId", r, null), r;
}
function yn(e = S.USER) {
  return L({ lastActivity: Date.now() }, e), _("activity", e, "lastActivity", c.lastActivity, null), !0;
}
function Tn(e, t = S.SYSTEM) {
  return L({ timeout: e }, t), !0;
}
function wn(e) {
  return typeof e == "function" ? (ke.add(e), () => ke.delete(e)) : () => {
  };
}
function bn() {
  ke.clear();
}
function Dn() {
  return { ...ue(), token: c.token ? "[REDACTED]" : null, csrf: c.csrf ? "[REDACTED]" : null };
}
function Cn() {
  return { updates: A.updates, lastUpdateAt: A.lastUpdateAt, lastSource: A.lastSource, listenerCount: ke.size, stateVersion: U, historyLength: F.length, hasPendingTransaction: !!O };
}
function $n() {
  return F.map((e) => ({ version: e.version, action: e.action, source: e.source, timestamp: e.timestamp }));
}
function On() {
  var e;
  return { moduleId: Be, version: St, stateVersion: U, authenticated: c.authenticated, userId: c.userId, sessionId: c.sessionId, hasToken: !!c.token, hasCsrf: !!c.csrf, rolesCount: ((e = c.roles) == null ? void 0 : e.length) || 0, listenerCount: ke.size, historyLength: F.length, hasPendingTransaction: !!O, portsInitialized: He.isInitialized(), metrics: { ...A }, timestamp: Date.now() };
}
function _n() {
  const e = { stateImmutable: Object.isFrozen(c), stateInitialized: c !== null, shapeValid: typeof c.authenticated == "boolean", versionTracked: U >= 0, listenersHealthy: A.listenerErrors === 0 || A.listenerErrors / Math.max(A.notifications, 1) < 0.1, lowErrorRate: A.listenerErrors < 10, historyManaged: F.length <= Zt, portsInitialized: He.isInitialized() }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  return { status: t === r ? "HEALTHY" : "DEGRADED", score: `${t}/${r}`, healthy: t === r, checks: e, stateVersion: U, authenticated: c.authenticated, version: St, moduleId: Be, timestamp: Date.now() };
}
const i = { getState: ue, get: Kr, set: Zr, update: Xr, clear: Qr, reset: en, beginTransaction: Qt, addToTransaction: qr, commit: er, rollback: Wr, rollbackToVersion: Jr, MUTATION_SOURCES: S, isAuthenticated: tn, getUser: rn, getUserId: nn, getRoles: sn, getToken: on, getCsrf: an, getSessionId: cn, getExpiresAt: ln, getLastActivity: un, getLoginAt: fn, getTimeout: dn, getDuration: gn, getVersion: hn, getStateVersion: mn, setUser: pn, clearUser: kn, setToken: En, clearToken: vn, setCsrf: Sn, clearCsrf: An, setSessionId: In, updateActivity: yn, setTimeout: Tn, subscribe: wn, clearListeners: bn, toJSON: Dn, getStats: Cn, getHistory: $n, info: On, healthCheck: _n, injectPorts: Gr, getPorts: Br }, At = "5.0.0-BULLETPROOF", tr = "session-runtime-port", h = { eventListeners: 0, eventRemovals: 0, timersCreated: 0, timersCleared: 0, errors: 0 }, J = /* @__PURE__ */ new Map(), z = /* @__PURE__ */ new Set();
function Ye() {
  return typeof window < "u";
}
function Rn() {
  return typeof document < "u";
}
const rr = {
  addEventListener(e, t, r, n = {}) {
    h.eventListeners++;
    try {
      const s = e === "document" ? document : e === "window" ? window : e;
      if (!(s != null && s.addEventListener)) return null;
      s.addEventListener(t, r, n);
      const o = `${e}-${t}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return J.set(o, { target: s, event: t, handler: r, options: n }), o;
    } catch {
      return h.errors++, null;
    }
  },
  removeEventListener(e) {
    h.eventRemovals++;
    try {
      const t = J.get(e);
      return t ? (t.target.removeEventListener(t.event, t.handler), J.delete(e), !0) : !1;
    } catch {
      return h.errors++, !1;
    }
  },
  setInterval(e, t) {
    h.timersCreated++;
    try {
      const r = or(e, t);
      return z.add(r), r;
    } catch {
      return h.errors++, null;
    }
  },
  clearInterval(e) {
    h.timersCleared++;
    try {
      return It(e), z.delete(e), !0;
    } catch {
      return h.errors++, !1;
    }
  },
  setTimeout(e, t) {
    h.timersCreated++;
    try {
      const r = ir(() => {
        z.delete(r), e();
      }, t);
      return z.add(r), r;
    } catch {
      return h.errors++, null;
    }
  },
  clearTimeout(e) {
    h.timersCleared++;
    try {
      return yt(e), z.delete(e), !0;
    } catch {
      return h.errors++, !1;
    }
  },
  getWindow() {
    return window;
  },
  getDocument() {
    return document;
  },
  isOnline() {
    return (navigator == null ? void 0 : navigator.onLine) ?? !0;
  },
  getLocation() {
    return (window == null ? void 0 : window.location) ?? null;
  },
  getUserAgent() {
    return (navigator == null ? void 0 : navigator.userAgent) ?? null;
  }
}, ct = /* @__PURE__ */ new Map();
let lt = 0;
const fe = /* @__PURE__ */ new Map(), nr = {
  addEventListener(e, t, r, n = {}) {
    h.eventListeners++;
    const s = `mem-${e}-${t}-${++lt}`;
    return ct.set(s, { target: e, event: t, handler: r, options: n }), s;
  },
  removeEventListener(e) {
    return h.eventRemovals++, ct.delete(e);
  },
  setInterval(e, t) {
    h.timersCreated++;
    const r = ++lt;
    return fe.set(r, { callback: e, ms: t, type: "interval" }), r;
  },
  clearInterval(e) {
    return h.timersCleared++, fe.delete(e);
  },
  setTimeout(e, t) {
    h.timersCreated++;
    const r = ++lt;
    return fe.set(r, { callback: e, ms: t, type: "timeout" }), r;
  },
  clearTimeout(e) {
    return h.timersCleared++, fe.delete(e);
  },
  getWindow() {
    return null;
  },
  getDocument() {
    return null;
  },
  isOnline() {
    return !0;
  },
  getLocation() {
    return { href: "http://localhost", pathname: "/", hostname: "localhost" };
  },
  getUserAgent() {
    return "SSR/Test";
  },
  triggerEvent(e, t, r = {}) {
    ct.forEach((n) => {
      if (n.target === e && n.event === t)
        try {
          n.handler(r);
        } catch {
        }
    });
  },
  triggerTimer(e) {
    const t = fe.get(e);
    if (t) {
      try {
        t.callback();
      } catch {
      }
      t.type === "timeout" && fe.delete(e);
    }
  }
};
let R = Ye() ? rr : nr, Se = Ye() ? "browser" : "memory";
function Ln(e, t, r, n) {
  return R.addEventListener(e, t, r, n);
}
function sr(e) {
  return R.removeEventListener(e);
}
function or(e, t) {
  return R.setInterval(e, t);
}
function It(e) {
  return R.clearInterval(e);
}
function ir(e, t) {
  return R.setTimeout(e, t);
}
function yt(e) {
  return R.clearTimeout(e);
}
function jn() {
  return R.getWindow();
}
function Nn() {
  return R.getDocument();
}
function ar() {
  return R.isOnline();
}
function Un() {
  return R.getLocation();
}
function zn() {
  return R.getUserAgent();
}
function cr() {
  J.forEach((e, t) => sr(t)), z.forEach((e) => {
    It(e), yt(e);
  }), J.clear(), z.clear();
}
function Hn() {
  cr(), R = nr, Se = "memory";
}
function xn() {
  return Ye() ? (R = rr, Se = "browser", !0) : !1;
}
function Pn() {
  return Se;
}
function Mn() {
  return At;
}
function lr() {
  return { ...h, adapterType: Se, activeListeners: J.size, activeTimers: z.size };
}
function Vn() {
  return { moduleId: tr, version: At, adapterType: Se, windowAvailable: Ye(), documentAvailable: Rn(), activeListeners: J.size, activeTimers: z.size, isOnline: ar(), metrics: lr(), timestamp: Date.now() };
}
function Fn() {
  const e = { adapterActive: !!R, noLeakedListeners: J.size < 100, noLeakedTimers: z.size < 50, lowErrorRate: h.eventListeners + h.timersCreated === 0 || h.errors / (h.eventListeners + h.timersCreated) < 0.1 }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  return { status: t === r ? "HEALTHY" : "DEGRADED", score: `${t}/${r}`, checks: e, adapterType: Se, version: At, moduleId: tr, timestamp: Date.now() };
}
const P = { addEventListener: Ln, removeEventListener: sr, setInterval: or, clearInterval: It, setTimeout: ir, clearTimeout: yt, getWindow: jn, getDocument: Nn, isOnline: ar, getLocation: Un, getUserAgent: zn, cleanup: cr, useMemoryAdapter: Hn, useBrowserAdapter: xn, getAdapterType: Pn, getVersion: Mn, getMetrics: lr, info: Vn, healthCheck: Fn }, Tt = "5.0.0-BULLETPROOF", ur = "session-storage-port", I = { gets: 0, sets: 0, removes: 0, clears: 0, errors: 0 };
function qe() {
  if (typeof localStorage > "u") return !1;
  try {
    const e = "__storage_test__";
    return localStorage.setItem(e, e), localStorage.removeItem(e), !0;
  } catch {
    return !1;
  }
}
const de = /* @__PURE__ */ new Map(), fr = {
  get(e) {
    I.gets++;
    try {
      const t = localStorage.getItem(e);
      return t ? JSON.parse(t) : null;
    } catch {
      return I.errors++, null;
    }
  },
  set(e, t) {
    I.sets++;
    try {
      return localStorage.setItem(e, JSON.stringify(t)), !0;
    } catch {
      return I.errors++, !1;
    }
  },
  remove(e) {
    I.removes++;
    try {
      return localStorage.removeItem(e), !0;
    } catch {
      return I.errors++, !1;
    }
  },
  clear() {
    I.clears++;
    try {
      return localStorage.clear(), !0;
    } catch {
      return I.errors++, !1;
    }
  },
  has(e) {
    try {
      return localStorage.getItem(e) !== null;
    } catch {
      return !1;
    }
  }
}, dr = {
  get(e) {
    return I.gets++, de.get(e) ?? null;
  },
  set(e, t) {
    return I.sets++, de.set(e, t), !0;
  },
  remove(e) {
    return I.removes++, de.delete(e), !0;
  },
  clear() {
    return I.clears++, de.clear(), !0;
  },
  has(e) {
    return de.has(e);
  }
};
let ee = qe() ? fr : dr, Ae = qe() ? "localStorage" : "memory";
function Gn(e) {
  return ee.get(e);
}
function Bn(e, t) {
  return ee.set(e, t);
}
function Yn(e) {
  return ee.remove(e);
}
function qn() {
  return ee.clear();
}
function Wn(e) {
  return ee.has(e);
}
function Jn() {
  ee = dr, Ae = "memory";
}
function Kn() {
  return qe() ? (ee = fr, Ae = "localStorage", !0) : !1;
}
function Zn() {
  return Ae;
}
function Xn() {
  return Tt;
}
function gr() {
  return { ...I, adapterType: Ae };
}
function Qn() {
  return { moduleId: ur, version: Tt, adapterType: Ae, storageAvailable: qe(), memoryStorageSize: de.size, metrics: gr(), timestamp: Date.now() };
}
function es() {
  const e = { adapterActive: !!ee, lowErrorRate: I.gets + I.sets === 0 || I.errors / (I.gets + I.sets) < 0.1 }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  return { status: t === r ? "HEALTHY" : "DEGRADED", score: `${t}/${r}`, checks: e, adapterType: Ae, version: Tt, moduleId: ur, timestamp: Date.now() };
}
const D = { get: Gn, set: Bn, remove: Yn, clear: qn, has: Wn, useMemoryAdapter: Jn, useLocalStorageAdapter: Kn, getAdapterType: Zn, getVersion: Xn, getMetrics: gr, info: Qn, healthCheck: es }, wt = "5.1.0-P17WI", hr = "session-token", Le = "dshowdash.session.token", w = { tokensSet: 0, tokensCleared: 0, csrfSet: 0, csrfCleared: 0, persistSuccess: 0, persistFailed: 0, restoreSuccess: 0, restoreFailed: 0 }, d = { jwt: null, jwtExp: null };
function mr(e) {
  try {
    if (e) {
      const t = vt(e);
      if (D.set(Le, { token: e, exp: t, savedAt: Date.now() }))
        return w.persistSuccess++, !0;
    } else
      return D.remove(Le), w.persistSuccess++, !0;
    return w.persistFailed++, !1;
  } catch (t) {
    return w.persistFailed++, k.warn("Failed to persist token", { error: t.message }), !1;
  }
}
function pr() {
  try {
    const e = D.get(Le);
    return !e || !e.token ? null : e.exp && ze(e.exp) ? (k.info("Restored token is expired, clearing"), D.remove(Le), null) : (w.restoreSuccess++, k.info("Token restored from storage"), e);
  } catch (e) {
    return w.restoreFailed++, k.warn("Failed to restore token", { error: e.message }), null;
  }
}
function kr() {
  const e = pr();
  return e && e.token ? (d.jwt = e.token, d.jwtExp = e.exp || vt(e.token), !0) : !1;
}
kr();
function Ie() {
  return typeof window < "u" && window.SecurityCSRF ? window.SecurityCSRF : null;
}
function ts(e) {
  return w.tokensSet++, d.jwt = e, d.jwtExp = e ? vt(e) : null, mr(e), !0;
}
function rs() {
  return d.jwt;
}
function Er() {
  return w.tokensCleared++, d.jwt = null, d.jwtExp = null, mr(null), !0;
}
function ns() {
  return d.jwt ? d.jwtExp ? !ze(d.jwtExp) : !0 : !1;
}
function ss() {
  return d.jwt ? { hasToken: !0, payload: Jt(d.jwt), expiresAt: d.jwtExp, isExpired: ze(d.jwtExp), isExpiringSoon: Wt(d.jwtExp) } : { hasToken: !1, payload: null, expiresAt: null, isExpired: !0 };
}
function os(e) {
  w.csrfSet++;
  const t = Ie();
  if (t && t.setToken)
    try {
      return t.setToken(e);
    } catch (r) {
      return k.warn("SecurityCSRF.setToken failed", { error: r.message }), !1;
    }
  return k.debug("SecurityCSRF not ready yet (expected during boot)"), !1;
}
function bt() {
  const e = Ie();
  if (e && e.getToken)
    try {
      return e.getToken();
    } catch (t) {
      return k.warn("SecurityCSRF.getToken failed", { error: t.message }), null;
    }
  return null;
}
function vr() {
  w.csrfCleared++;
  const e = Ie();
  if (e && e.clearToken)
    try {
      return e.clearToken(), !0;
    } catch (t) {
      return k.warn("SecurityCSRF.clearToken failed", { error: t.message }), !1;
    }
  return !1;
}
function is() {
  return Er(), vr(), !0;
}
function as() {
  const e = Ie();
  if (e && e.getAuthHeaders)
    try {
      const n = e.getAuthHeaders();
      return d.jwt && !n.Authorization && (n.Authorization = `Bearer ${d.jwt}`), n;
    } catch (n) {
      k.warn("SecurityCSRF.getAuthHeaders failed", { error: n.message });
    }
  const t = {};
  d.jwt && (t.Authorization = `Bearer ${d.jwt}`);
  const r = bt();
  return r && (t["X-CSRF-Token"] = r), t;
}
function cs() {
  return wt;
}
function ls() {
  const e = Ie(), t = bt();
  return { moduleId: hr, version: wt, hasJwtToken: !!d.jwt, jwtExp: d.jwtExp, jwtExpired: d.jwtExp ? ze(d.jwtExp) : null, jwtExpiringSoon: d.jwtExp ? Wt(d.jwtExp) : null, hasCsrf: !!t, csrfSource: "SecurityCSRF", storageAdapter: D.getAdapterType(), persistenceKey: Le, metrics: Object.assign({}, w), securityCsrf: e ? { available: !0, initialized: e.isInitialized ? e.isInitialized() : !1, version: e.version || "unknown" } : { available: !1 }, timestamp: Date.now() };
}
function us() {
  const e = D.healthCheck(), t = { jwtStateValid: d !== null, tokenNotExpired: !d.jwt || !d.jwtExp || !ze(d.jwtExp), securityCSRFAvailable: !!Ie(), storagePortHealthy: e.status === "HEALTHY" || e.status === "DEGRADED", lowPersistFailRate: w.persistSuccess + w.persistFailed === 0 || w.persistFailed / (w.persistSuccess + w.persistFailed) < 0.2 }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length;
  return { status: r === n ? "HEALTHY" : r >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${r}/${n}`, healthy: r >= 4, checks: t, hasToken: !!d.jwt, storageAdapter: D.getAdapterType(), version: wt, moduleId: hr, timestamp: Date.now() };
}
const E = { setToken: ts, getToken: rs, clearToken: Er, isTokenValid: ns, getTokenInfo: ss, setCsrf: os, getCsrf: bt, clearCsrf: vr, clearAll: is, getAuthHeaders: as, info: ls, healthCheck: us, getVersion: cs, initFromStorage: kr, restoreToken: pr }, Dt = "5.3.0-P17WI", Ct = "session-persistence", xe = "dshowdash.session.meta", We = B({ moduleId: Ct });
function fs() {
  We.init();
}
function ds(e) {
  return We.get(e);
}
const v = { saves: 0, savesSuccess: 0, savesFailed: 0, restores: 0, restoresSuccess: 0, restoresFailed: 0, clears: 0 };
function Ee() {
  fs();
  const e = ds("sessionManager");
  return e && e.debug && e.debug.tracker ? e.debug.tracker : { track() {
  } };
}
function gs(e, t) {
  v.saves++;
  try {
    if (D.set(xe, { sessionId: e, lastActivity: t, savedAt: Date.now() })) {
      v.savesSuccess++;
      const n = Ee();
      return n.track && n.track("session:persistence:saved"), !0;
    }
    return v.savesFailed++, !1;
  } catch (r) {
    v.savesFailed++;
    const n = Ee();
    return n.track && n.track("session:persistence:save-error", { error: r.message }), !1;
  }
}
function hs() {
  v.restores++;
  try {
    const e = D.get(xe);
    if (!e) return null;
    v.restoresSuccess++;
    const t = Ee();
    return t.track && t.track("session:persistence:restored"), e;
  } catch (e) {
    v.restoresFailed++;
    const t = Ee();
    return t.track && t.track("session:persistence:restore-error", { error: e.message }), null;
  }
}
function ms() {
  v.clears++;
  try {
    D.remove(xe);
    const e = Ee();
    return e.track && e.track("session:persistence:cleared"), !0;
  } catch (e) {
    const t = Ee();
    return t.track && t.track("session:persistence:clear-error", { error: e.message }), !1;
  }
}
function $t() {
  return D.has(xe);
}
function ps() {
  return Dt;
}
function ks() {
  const e = We.snapshot();
  return { moduleId: Ct, version: Dt, storageKey: xe, hasPersisted: $t(), storageAdapter: D.getAdapterType(), portsInitialized: e._initialized, metrics: Object.assign({}, v), saveSuccessRate: v.saves > 0 ? `${(v.savesSuccess / v.saves * 100).toFixed(1)}%` : "N/A", restoreSuccessRate: v.restores > 0 ? `${(v.restoresSuccess / v.restores * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function Es() {
  const e = We.snapshot(), r = { storagePortHealthy: D.healthCheck().status === "HEALTHY", lowSaveFailRate: v.saves === 0 || v.savesFailed / v.saves < 0.2, lowRestoreFailRate: v.restores === 0 || v.restoresFailed / v.restores < 0.2, portsInitialized: e._initialized }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length;
  return { status: n >= 3 ? "HEALTHY" : "DEGRADED", score: `${n}/${s}`, healthy: n >= 3, checks: r, hasPersisted: $t(), storageAdapter: D.getAdapterType(), version: Dt, moduleId: Ct, portsInitialized: e._initialized, timestamp: Date.now() };
}
const je = { save: gs, restore: hs, clear: ms, hasPersisted: $t, getVersion: ps, info: ks, healthCheck: Es }, Ot = "5.4.0-FIX", _t = "session-api-client", ye = B({ moduleId: _t });
function vs() {
  ye.init();
}
function Ss(e) {
  return ye.get(e);
}
function As(e) {
  return ye.inject(e);
}
function Is() {
  return ye.snapshot();
}
const N = { endpoints: { check: "/api/auth/check.php", login: "/api/auth/login.php", logout: "/api/auth/logout.php", refresh: "/api/auth/refresh.php" }, timeout: 1e4 }, f = { requests: 0, checkRequests: 0, loginRequests: 0, logoutRequests: 0, refreshRequests: 0, successfulRequests: 0, failedRequests: 0, timeouts: 0, errors: 0 };
function Je() {
  vs();
  const e = Ss("sessionManager");
  return e && e.debug && e.debug.tracker ? e.debug.tracker : { track() {
  } };
}
function ys(e) {
  e || (e = {}), e.endpoints && Object.assign(N.endpoints, e.endpoints), e.timeout && (N.timeout = e.timeout);
}
function Ke(e, t, r) {
  f.requests++;
  const n = new AbortController(), s = r || N.timeout, o = setTimeout(() => {
    n.abort();
  }, s);
  return fetch(e, Object.assign({}, t, { signal: n.signal, credentials: "include" })).then((u) => (clearTimeout(o), u)).catch((u) => {
    throw clearTimeout(o), u.name === "AbortError" ? (f.timeouts++, new Error("Timeout")) : (f.errors++, u);
  });
}
function Rt(e) {
  return e && e.ok === !0 && e.data && typeof e.data == "object" ? e.data : e;
}
function Ts(e) {
  e || (e = {}), f.checkRequests++;
  const t = Je();
  return t.track && t.track("session:api:check:start"), Ke(N.endpoints.check, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }, e.timeout).then((r) => r.status === 401 ? (f.successfulRequests++, t.track && t.track("session:api:check:unauthorized"), { ok: !0, authenticated: !1, user: null }) : r.ok ? r.json().then((n) => {
    const s = Rt(n), o = s.authenticated === !0;
    return f.successfulRequests++, t.track && t.track("session:api:check:complete", { authenticated: o }), {
      ok: !0,
      authenticated: o,
      user: s.user || null,
      csrf: s.session && s.session.csrf_token || s.csrf || s.csrfToken || null,
      token: s.session && s.session.token || s.token || null,
      expiresIn: s.session && s.session.expires_in || s.expires_in || s.expiresIn || null
    };
  }) : (f.failedRequests++, t.track && t.track("session:api:check:error", { status: r.status }), { ok: !1, error: `HTTP ${r.status}` })).catch((r) => (f.failedRequests++, t.track && t.track("session:api:check:error", { error: r.message }), { ok: !1, error: r.message }));
}
function ws(e, t, r) {
  r || (r = {}), f.loginRequests++;
  const n = Je();
  n.track && n.track("session:api:login:start");
  const s = { username: e, password: t };
  return r.extra && Object.assign(s, r.extra), Ke(N.endpoints.login, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(s) }, r.timeout).then((o) => o.ok ? o.json().then((u) => {
    const g = Rt(u);
    return u.ok === !1 || g.success === !1 ? (f.failedRequests++, n.track && n.track("session:api:login:failed", { error: g.error || u.error }), { ok: !1, error: g.error || u.error || g.message || "Login failed" }) : (f.successfulRequests++, n.track && n.track("session:api:login:success"), {
      ok: !0,
      user: g.user || null,
      token: g.session && g.session.token || g.token || null,
      csrf: g.session && g.session.csrf_token || g.csrf || g.csrfToken || null,
      expiresIn: g.session && g.session.expires_in || g.expires_in || g.expiresIn || 604800
    });
  }) : (f.failedRequests++, o.json().catch(() => ({})).then((u) => (n.track && n.track("session:api:login:failed", { status: o.status }), { ok: !1, error: u.error || u.message || `HTTP ${o.status}` })))).catch((o) => (f.failedRequests++, n.track && n.track("session:api:login:error", { error: o.message }), { ok: !1, error: o.message }));
}
function bs(e) {
  e || (e = {}), f.logoutRequests++;
  const t = Je();
  return t.track && t.track("session:api:logout:start"), Ke(N.endpoints.logout, { method: "POST", headers: { Accept: "application/json" } }, e.timeout).then(() => (f.successfulRequests++, t.track && t.track("session:api:logout:complete"), { ok: !0 })).catch((r) => (f.failedRequests++, t.track && t.track("session:api:logout:error", { error: r.message }), { ok: !0, serverError: r.message }));
}
function Ds(e) {
  e || (e = {}), f.refreshRequests++;
  const t = Je();
  return t.track && t.track("session:api:refresh:start"), Ke(N.endpoints.refresh, { method: "POST", headers: { Accept: "application/json" } }, e.timeout).then((r) => r.ok ? r.json().then((n) => {
    const s = Rt(n);
    return f.successfulRequests++, t.track && t.track("session:api:refresh:success"), {
      ok: !0,
      token: s.session && s.session.token || s.token || null,
      csrf: s.session && s.session.csrf_token || s.csrf || null,
      expiresIn: s.session && s.session.expires_in || s.expires_in || s.expiresIn || null
    };
  }) : (f.failedRequests++, t.track && t.track("session:api:refresh:failed", { status: r.status }), { ok: !1, error: `HTTP ${r.status}` })).catch((r) => (f.failedRequests++, t.track && t.track("session:api:refresh:error", { error: r.message }), { ok: !1, error: r.message }));
}
function Cs() {
  return Ot;
}
function $s() {
  const e = ye.snapshot();
  return { moduleId: _t, version: Ot, portsInitialized: e._initialized, config: { endpoints: Object.assign({}, N.endpoints), timeout: N.timeout }, metrics: Object.assign({}, f), successRate: f.requests > 0 ? `${(f.successfulRequests / f.requests * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function Os() {
  const e = ye.snapshot(), t = { endpointsDefined: Object.keys(N.endpoints).length >= 4, timeoutValid: N.timeout > 0 && N.timeout <= 6e4, lowTimeoutRate: f.requests === 0 || f.timeouts / f.requests < 0.1, lowErrorRate: f.requests === 0 || f.errors / f.requests < 0.2, portsInitialized: e._initialized }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length;
  return { status: r === n ? "HEALTHY" : "DEGRADED", score: `${r}/${n}`, healthy: r === n, checks: t, portsInitialized: e._initialized, totalRequests: f.requests, version: Ot, moduleId: _t, timestamp: Date.now() };
}
const ce = { configure: ys, checkSession: Ts, login: ws, logout: bs, refresh: Ds, getVersion: Cs, info: $s, healthCheck: Os, injectPorts: As, getPorts: Is }, _s = "session-manager.core.ports", Lt = B({ moduleId: _s });
function Sr() {
  Lt.init();
}
function Pe(e) {
  return Lt.get(e);
}
function dt() {
  return Lt.isInitialized();
}
function p() {
  const e = Pe("sessionManager");
  return e && e.debug && e.debug.tracker ? e.debug.tracker : { track() {
  } };
}
const Rs = "session-lifecycle:state-machine";
function Ls() {
  if (typeof window > "u") return { track() {
  } };
  const e = pt();
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const t = window.Core.windowAdapter.get("SessionManager");
    if (t && t.debug && t.debug.tracker)
      return t.debug.tracker;
  }
  return e ? { track() {
  } } : window.SessionManager && window.SessionManager.debug && window.SessionManager.debug.tracker ? (Pr("WINDOW_SESSIONMANAGER_FALLBACK", { module: Rs, method: "getTracker" }), window.SessionManager.debug.tracker) : { track() {
  } };
}
const l = Object.freeze({
  IDLE: "IDLE",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  DEGRADED: "DEGRADED",
  FAILED: "FAILED",
  RECOVERING: "RECOVERING",
  SHUTDOWN: "SHUTDOWN"
}), a = {
  state: l.IDLE,
  previousState: null,
  initCount: 0,
  lastInitAt: null,
  lastError: null,
  lastStateChange: null,
  config: null,
  degradedReasons: [],
  failedReason: null
}, Ar = { stateTransitions: 0 };
function H(e, t) {
  const r = a.state;
  if (r === e) return !1;
  a.previousState = r, a.state = e, a.lastStateChange = Date.now(), Ar.stateTransitions++, e === l.DEGRADED && t && a.degradedReasons.indexOf(t) === -1 && a.degradedReasons.push(t), e === l.FAILED && (a.failedReason = t), e === l.READY && (a.degradedReasons = [], a.failedReason = null), k.info("Lifecycle state transition", { from: r, to: e, reason: t });
  const n = Ls();
  n.track && n.track("session:lifecycle:state-change", { from: r, to: e, reason: t });
  const s = j("eventBus");
  return s && s.emit && s.emit(pe.LIFECYCLE_STATE_CHANGED, { oldState: r, newState: e, reason: t, timestamp: Date.now() }), !0;
}
function js(e) {
  return a.state === l.FAILED ? !1 : (H(l.DEGRADED, e), !0);
}
function Ns(e) {
  return H(l.FAILED, e), !0;
}
function Us() {
  return a.degradedReasons = [], a.failedReason = null, H(l.READY), !0;
}
function zs() {
  return a.state === l.READY || a.state === l.DEGRADED;
}
function Hs() {
  return a.state;
}
function Ir() {
  return { state: a.state, previousState: a.previousState, initialized: zs(), initCount: a.initCount, lastInitAt: a.lastInitAt, lastError: a.lastError, lastStateChange: a.lastStateChange, config: a.config, degradedReasons: a.degradedReasons.slice(), failedReason: a.failedReason, authEventsIntegrated: !0 };
}
function xs() {
  a.degradedReasons = [], a.failedReason = null, H(l.IDLE);
}
const jt = "5.0.0-BULLETPROOF", yr = "session-cookie-port", $ = { gets: 0, sets: 0, removes: 0, errors: 0 }, ge = /* @__PURE__ */ new Map();
function Ze() {
  if (typeof document > "u") return !1;
  try {
    document.cookie = "__cookie_test__=1";
    const e = document.cookie.includes("__cookie_test__");
    return document.cookie = "__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC", e;
  } catch {
    return !1;
  }
}
function Yt(e) {
  const t = {};
  return e && e.split(";").forEach((r) => {
    const [n, ...s] = r.trim().split("=");
    n && (t[n] = s.join("="));
  }), t;
}
const Tr = {
  get(e) {
    $.gets++;
    try {
      return Yt(document.cookie)[e] ?? null;
    } catch {
      return $.errors++, null;
    }
  },
  set(e, t, r = {}) {
    $.sets++;
    try {
      const { path: n = "/", domain: s, expires: o, maxAge: u, secure: g, sameSite: Y = "Lax" } = r;
      let T = `${e}=${encodeURIComponent(t)}`;
      return T += `; path=${n}`, s && (T += `; domain=${s}`), o && (T += `; expires=${o instanceof Date ? o.toUTCString() : o}`), u && (T += `; max-age=${u}`), g && (T += "; secure"), T += `; samesite=${Y}`, document.cookie = T, !0;
    } catch {
      return $.errors++, !1;
    }
  },
  remove(e, t = {}) {
    $.removes++;
    try {
      const { path: r = "/", domain: n } = t;
      let s = `${e}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${r}`;
      return n && (s += `; domain=${n}`), document.cookie = s, n || (document.cookie = `${e}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${r}; domain=dshowdash.com.br`, document.cookie = `${e}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${r}; domain=.dshowdash.com.br`), !0;
    } catch {
      return $.errors++, !1;
    }
  },
  has(e) {
    try {
      return document.cookie.split(";").some((t) => t.trim().startsWith(`${e}=`));
    } catch {
      return !1;
    }
  },
  getAll() {
    try {
      return Yt(document.cookie);
    } catch {
      return {};
    }
  }
}, wr = {
  get(e) {
    return $.gets++, ge.get(e) ?? null;
  },
  set(e, t, r = {}) {
    return $.sets++, ge.set(e, t), !0;
  },
  remove(e, t = {}) {
    return $.removes++, ge.delete(e), !0;
  },
  has(e) {
    return ge.has(e);
  },
  getAll() {
    return Object.fromEntries(ge);
  }
};
let te = Ze() ? Tr : wr, Te = Ze() ? "document" : "memory";
function Ps(e) {
  return te.get(e);
}
function Ms(e, t, r = {}) {
  return te.set(e, t, r);
}
function Vs(e, t = {}) {
  return te.remove(e, t);
}
function Fs(e) {
  return te.has(e);
}
function Gs() {
  return te.getAll();
}
function Bs() {
  te = wr, Te = "memory";
}
function Ys() {
  return Ze() ? (te = Tr, Te = "document", !0) : !1;
}
function qs() {
  return Te;
}
function Ws() {
  return jt;
}
function br() {
  return { ...$, adapterType: Te };
}
function Js() {
  return { moduleId: yr, version: jt, adapterType: Te, cookieAvailable: Ze(), memoryCookiesSize: ge.size, metrics: br(), timestamp: Date.now() };
}
function Ks() {
  const e = { adapterActive: !!te, lowErrorRate: $.gets + $.sets === 0 || $.errors / ($.gets + $.sets) < 0.1 }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  return { status: t === r ? "HEALTHY" : "DEGRADED", score: `${t}/${r}`, checks: e, adapterType: Te, version: jt, moduleId: yr, timestamp: Date.now() };
}
const G = { get: Ps, set: Ms, remove: Vs, has: Fs, getAll: Gs, useMemoryAdapter: Bs, useDocumentAdapter: Ys, getAdapterType: qs, getVersion: Ws, getMetrics: br, info: Js, healthCheck: Ks }, Nt = "5.3.0-P18EC", Ut = "session-auth", Xe = B({ moduleId: Ut });
function Dr() {
  Xe.init(), j();
}
function Cr(e) {
  const t = Xe.get(e);
  return t || getPort(e);
}
const De = "DSHOWSESS", b = { loginAttempts: 0, loginSuccess: 0, loginFailures: 0, logouts: 0, sessionChecks: 0, refreshes: 0, eventsEmitted: 0, errors: 0, invalidCookiesCleared: 0 };
function ve() {
  return G.has(De);
}
function zt() {
  return ve() ? (G.remove(De, { path: "/" }), G.remove(De, { path: "/", domain: "dshowdash.com.br" }), G.remove(De, { path: "/", domain: ".dshowdash.com.br" }), b.invalidCookiesCleared++, k.info("Cookie de sessão inválido removido", { cookie: De }), !ve()) : !1;
}
function K(e, t) {
  t || (t = {}), b.eventsEmitted++, Dr();
  const r = Cr("eventBus");
  if (r && r.emit)
    try {
      r.emit(e, Object.assign({}, t, { source: "session-manager", timestamp: Date.now() }));
    } catch (n) {
      b.errors++, k.warn(`Failed to emit event: ${e} - ${n.message}`);
    }
}
function Zs(e, t, r) {
  return r || (r = {}), b.loginAttempts++, K(m.LOGIN_ATTEMPT, { username: e }), ce.login(e, t, r).then((n) => {
    if (!n.ok)
      return b.loginFailures++, K(m.LOGIN_FAILURE, { error: n.error }), { ok: !1, error: n.error };
    b.loginSuccess++;
    const s = Kt(n.user), o = Et(n.expiresIn || 604800), u = qt();
    return i.update({ authenticated: !0, user: s, userId: s ? s.id : null, roles: s ? s.roles : [], level: s ? s.level : null, sessionId: u, expiresAt: o, loginAt: Date.now(), lastActivity: Date.now() }), n.token && (E.setToken(n.token), i.setToken(n.token)), n.csrf && E.setCsrf(n.csrf), K(m.LOGIN_SUCCESS, { user: s, sessionId: u }), { ok: !0, user: s, sessionId: u };
  });
}
function Xs(e) {
  e || (e = {}), b.logouts++;
  const t = i.isAuthenticated(), r = i.getSessionId();
  return ce.logout(e).then(() => (i.clear(), E.clearAll(), zt(), t && K(m.LOGOUT_SUCCESS, { sessionId: r }), { ok: !0 }));
}
function Qs(e) {
  return e || (e = {}), b.sessionChecks++, ce.checkSession(e).then((t) => {
    if (!t.ok)
      return K(m.SESSION_CHECKED, { authenticated: !1, error: t.error }), { ok: !1, error: t.error };
    if (t.authenticated && t.user) {
      const r = Kt(t.user), n = Et(t.expiresIn || 604800);
      return i.update({ authenticated: !0, user: r, userId: r ? r.id : null, roles: r ? r.roles : [], level: r ? r.level : null, expiresAt: n, lastActivity: Date.now() }), t.token && (E.setToken(t.token), i.setToken(t.token)), t.csrf && E.setCsrf(t.csrf), K(m.SESSION_CHECKED, { authenticated: !0, user: r }), { ok: !0, authenticated: !0, user: r };
    } else
      return i.clear(), E.clearAll(), ve() && (k.warn("Sessão inválida detectada - cookie existe mas servidor retornou não autenticado"), zt()), K(m.SESSION_CHECKED, { authenticated: !1 }), { ok: !0, authenticated: !1, user: null };
  });
}
function eo(e) {
  return e || (e = {}), b.refreshes++, ce.refresh(e).then((t) => t.ok ? (t.token && (E.setToken(t.token), i.setToken(t.token)), t.csrf && E.setCsrf(t.csrf), t.expiresIn && i.update({ expiresAt: Et(t.expiresIn) }), i.updateActivity(), K(m.SESSION_REFRESH, {}), { ok: !0 }) : { ok: !1, error: t.error });
}
function to() {
  return i.isAuthenticated();
}
function ro() {
  return i.getUser();
}
function no() {
  const e = i.getState();
  return { isAuthenticated: e.authenticated, userId: e.userId, user: e.user, roles: e.roles || [], level: e.level, sessionId: e.sessionId, lastActivity: e.lastActivity };
}
function so() {
  return Nt;
}
function oo() {
  const e = Xe.snapshot();
  return { moduleId: Ut, version: Nt, authenticated: i.isAuthenticated(), userId: i.getUserId(), hasUser: !!i.getUser(), hasSessionCookie: ve(), cookieAdapter: G.getAdapterType(), portsInitialized: e._initialized, metrics: Object.assign({}, b), successRate: b.loginAttempts > 0 ? `${(b.loginSuccess / b.loginAttempts * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function io() {
  const e = Xe.snapshot(), t = G.healthCheck();
  Dr();
  const r = Cr("eventBus"), n = { storeAvailable: !!i, apiClientAvailable: !!ce, tokenManagerAvailable: !!E, cookiePortHealthy: t.status === "HEALTHY" || t.status === "DEGRADED", eventBusAvailable: !!r, lowErrorRate: b.eventsEmitted === 0 || b.errors / b.eventsEmitted < 0.1, portsInitialized: e._initialized }, s = Object.values(n).filter(Boolean).length, o = Object.keys(n).length;
  return { status: s >= 6 ? "HEALTHY" : "DEGRADED", score: `${s}/${o}`, healthy: s >= 6, checks: n, authenticated: i.isAuthenticated(), hasSessionCookie: ve(), cookieAdapter: G.getAdapterType(), version: Nt, moduleId: Ut, portsInitialized: e._initialized, timestamp: Date.now() };
}
const se = { login: Zs, logout: Xs, checkSession: Qs, refresh: eo, isAuthenticated: to, getUser: ro, getAuthContext: no, getVersion: so, info: oo, healthCheck: io, hasSessionCookie: ve, clearInvalidSessionCookie: zt }, gt = { globalStateSyncs: 0, errors: 0, recoveryAttempts: 0 };
let Oe = null;
function ht(e) {
  H(l.DEGRADED, e);
}
function he(e, t) {
  Sr();
  const r = Pe("globalState");
  if (!r) {
    ht("globalstate-unavailable");
    return;
  }
  try {
    gt.globalStateSyncs++, e && t ? r.dispatch(r.actions.setSession({
      user: t,
      userId: t.id,
      roles: t.roles || [],
      lastActivity: Date.now()
    })) : r.dispatch(r.actions.clearSession()), p().track && p().track("session:global-state:synced");
  } catch (n) {
    gt.errors++, ht("globalstate-sync-error"), p().track && p().track("session:global-state:sync-error", { error: n.message });
  }
}
function ao(e) {
  e === void 0 && (e = 3e5), Oe = P.setInterval(() => {
    const t = i.getExpiresAt();
    if (!t) return;
    const r = t - Date.now(), n = Pe("eventBus");
    r <= 0 ? (p().track && p().track("session:expiration:expired"), n && (n.emit(pe.EXPIRED, { timestamp: Date.now() }), n.emit(m.SESSION_EXPIRED, { source: "session-manager", timestamp: Date.now() }))) : r <= e && (p().track && p().track("session:expiration:soon", { remaining: r }), n && n.emit(pe.EXPIRING_SOON, { remaining: r, timestamp: Date.now() }));
  }, 6e4);
}
function co() {
  Oe && (P.clearInterval(Oe), Oe = null);
}
function lo() {
  return !!Oe;
}
function uo() {
  return !1;
}
function fo() {
  return Object.assign({}, gt);
}
let Ve = [], Ne = [];
function go() {
  const e = Pe("eventBus");
  if (!e) {
    ht("eventbus-unavailable");
    return;
  }
  const t = (o) => {
    o && o.source === "session-manager" || (p().track && p().track("session:lifecycle:auth-event:login-success", { source: o ? o.source : null }), o && o.user && i.update({
      authenticated: !0,
      user: o.user,
      userId: o.user.id,
      roles: o.user.roles || [],
      loginAt: Date.now(),
      lastActivity: Date.now()
    }), o && o.csrf && E.setCsrf(o.csrf), he(!0, o ? o.user : null));
  }, r = (o) => {
    o && o.source === "session-manager" || (p().track && p().track("session:lifecycle:auth-event:logout", { source: o ? o.source : null }), i.clear(), E.clearAll(), je.clear(), he(!1, null));
  }, n = (o) => {
    o && o.source === "session-manager" || (p().track && p().track("session:lifecycle:auth-event:session-checked", { authenticated: o ? o.authenticated : null }), o && o.authenticated && o.user ? he(!0, o.user) : o && o.authenticated === !1 && he(!1, null));
  }, s = () => {
    p().track && p().track("session:lifecycle:auth-event:session-expired"), i.clear(), E.clearAll(), je.clear(), he(!1, null);
  };
  e.on(m.LOGIN_SUCCESS, t), e.on(m.LOGOUT, r), e.on(m.LOGOUT_SUCCESS, r), e.on(m.SESSION_CHECKED, n), e.on(m.SESSION_EXPIRED, s), Ve.push(
    () => {
      e.off(m.LOGIN_SUCCESS, t);
    },
    () => {
      e.off(m.LOGOUT, r);
    },
    () => {
      e.off(m.LOGOUT_SUCCESS, r);
    },
    () => {
      e.off(m.SESSION_CHECKED, n);
    },
    () => {
      e.off(m.SESSION_EXPIRED, s);
    }
  ), p().track && p().track("session:lifecycle:auth-listeners:setup", { events: Object.keys(m).length });
}
function ho() {
  let e = 0;
  const t = () => {
    const s = Date.now();
    s - e > 6e4 && (e = s, i.isAuthenticated() && i.updateActivity());
  }, r = P.addEventListener("document", "click", t, { passive: !0 }), n = P.addEventListener("document", "keydown", t, { passive: !0 });
  r && Ne.push(r), n && Ne.push(n);
}
function mo() {
  Ve.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), Ve = [], Ne.forEach((e) => {
    P.removeEventListener(e);
  }), Ne = [];
}
function $r() {
  return Ve.length;
}
function po() {
  return Ne.length;
}
const Ht = "6.2.2-SYNTAX-FIX", xt = "session-lifecycle", Qe = B({ moduleId: xt });
function Or() {
  Qe.init(), Sr();
}
function ko(e) {
  const t = Qe.get(e);
  return t || Pe(e);
}
const Z = { inits: 0, shutdowns: 0, resets: 0, errors: 0 };
function Eo(e) {
  if (e === void 0 && (e = {}), a.state === l.READY && !e.force)
    return Promise.resolve({ ok: !0, alreadyInitialized: !0, initCount: a.initCount });
  if (a.state === l.INITIALIZING)
    return Promise.resolve({ ok: !1, error: "Already initializing" });
  Z.inits++, H(l.INITIALIZING), a.config = e, Or();
  const t = p();
  return t && t.track && t.track("session:lifecycle:init:start", { mode: "orchestrator" }), Promise.resolve().then(() => {
    e.endpoints && ce.configure({ endpoints: e.endpoints }), e.timeout && ce.configure({ timeout: e.timeout });
    const r = je.restore();
    return r && r.sessionId && i.update({ sessionId: r.sessionId, lastActivity: r.lastActivity }), go(), e.trackActivity !== !1 && ho(), e.autoRefresh !== !1 && ao(e.refreshThreshold || 3e5), e.checkOnInit === !0 ? require("./auth.js").AuthManager.checkSession() : Promise.resolve();
  }).then(() => {
    a.initCount++, a.lastInitAt = Date.now(), a.lastError = null, a.degradedReasons.length > 0 ? H(l.DEGRADED) : H(l.READY);
    const r = p();
    return r && r.track && r.track("session:lifecycle:init:complete", {
      initCount: a.initCount,
      state: a.state,
      authEventsIntegrated: !0
    }), { ok: !0, alreadyInitialized: !1, initCount: a.initCount, state: a.state };
  }).catch((r) => {
    Z.errors++, a.lastError = r.message, H(l.FAILED, r.message);
    const n = p();
    return n && n.track && n.track("session:lifecycle:init:error", { error: r.message }), { ok: !1, error: r.message, state: a.state };
  });
}
function _r() {
  Z.shutdowns++;
  const e = p();
  return e && e.track && e.track("session:lifecycle:shutdown:start"), mo(), co(), H(l.SHUTDOWN), e && e.track && e.track("session:lifecycle:shutdown:complete"), { ok: !0, state: a.state };
}
function vo() {
  return _r();
}
function So() {
  Z.resets++;
  const e = p();
  return e && e.track && e.track("session:lifecycle:reset:start"), i.reset(), E.clearAll(), je.clear(), xs(), e && e.track && e.track("session:lifecycle:reset:complete"), { ok: !0, state: a.state };
}
function Ao() {
  return Ht;
}
function Io() {
  const e = Qe.snapshot(), t = fo();
  return {
    moduleId: xt,
    version: Ht,
    state: a.state,
    previousState: a.previousState,
    lifecycleInfo: Ir(),
    runtimeAdapter: P.getAdapterType(),
    portsInitialized: e._initialized,
    metrics: Object.assign({}, Z, t, Ar),
    cleanupCount: $r(),
    activityListeners: po(),
    hasExpirationMonitor: lo(),
    hasRecoveryMonitor: uo(),
    timestamp: Date.now()
  };
}
function yo() {
  const e = Qe.snapshot(), t = P.healthCheck();
  a.state, l.READY;
  const r = a.state === l.DEGRADED, n = a.state === l.FAILED;
  Or();
  const s = ko("eventBus"), o = {
    stateValid: Object.values(l).indexOf(a.state) !== -1,
    initialized: dt(),
    notFailed: !n,
    noRecentErrors: !a.lastError,
    runtimePortHealthy: t.status === "HEALTHY" || t.status === "DEGRADED",
    eventBusAvailable: !!s,
    cleanupsDefined: $r() > 0 || !dt(),
    lowErrorRate: Z.inits === 0 || Z.errors / Z.inits < 0.2,
    portsInitialized: e._initialized
  }, u = Object.values(o).filter(Boolean).length, g = Object.keys(o).length;
  let Y = "HEALTHY";
  return n ? Y = "UNHEALTHY" : (r || u < g) && (Y = "DEGRADED"), {
    status: Y,
    score: `${u}/${g}`,
    healthy: u >= 7,
    checks: o,
    state: a.state,
    degradedReasons: a.degradedReasons,
    failedReason: a.failedReason,
    runtimeAdapter: P.getAdapterType(),
    lastError: a.lastError,
    version: Ht,
    moduleId: xt,
    portsInitialized: e._initialized,
    timestamp: Date.now()
  };
}
const C = {
  init: Eo,
  shutdown: _r,
  destroy: vo,
  reset: So,
  getState: Hs,
  isInitialized: dt,
  getLifecycleInfo: Ir,
  LIFECYCLE_STATES: l,
  markDegraded: js,
  markFailed: Ns,
  markReady: Us,
  syncToGlobalState: he,
  getVersion: Ao,
  info: Io,
  healthCheck: yo
}, et = "5.2.0-P17WI", tt = "session-manager.telemetry.tracker", Fe = "session", Ue = 100, le = B({ moduleId: tt });
function rt(e) {
  return le.get(e);
}
function Rr(e) {
  return le.inject(e);
}
function Lr() {
  return le.snapshot();
}
let x = [];
const y = { totalEvents: 0, lifecycleEvents: 0, apiEvents: 0, authEvents: 0, errorEvents: 0, globalStateEvents: 0, lastEventAt: null, lastEventLocalTime: null };
function Pt() {
  const e = rt("telemetry");
  if (e && e.buildTimestamp) return e.buildTimestamp();
  const t = Date.now();
  return { timestampUtc: t, isoUtc: new Date(t).toISOString(), localTime: new Date(t).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
function Mt() {
  return rt("telemetry");
}
function jr() {
  return rt("eventBus");
}
function To(e, t) {
  t === void 0 && (t = {});
  const r = Pt(), n = { id: `${Fe}-${r.timestampUtc}-${Math.random().toString(36).slice(2, 6)}`, namespace: Fe, type: e, data: t, timestampUtc: r.timestampUtc, localTime: r.localTime, timeZone: r.timeZone };
  return x.push(n), x.length > Ue && (x = x.slice(-Ue)), y.totalEvents++, y.lastEventAt = r.timestampUtc, y.lastEventLocalTime = r.localTime, n;
}
function Q(e, t) {
  t === void 0 && (t = {});
  const r = To(e, t);
  e.indexOf("lifecycle") >= 0 && y.lifecycleEvents++, e.indexOf("api") >= 0 && y.apiEvents++, e.indexOf("auth") >= 0 && y.authEvents++, e.indexOf("error") >= 0 && y.errorEvents++, e.indexOf("global-state") >= 0 && y.globalStateEvents++;
  const n = Mt();
  if (n && n.track)
    try {
      n.track(`${Fe}:${e}`, Object.assign({ timestampUtc: r.timestampUtc, localTime: r.localTime }, t));
    } catch {
    }
  return r;
}
function Vt(e) {
  return e === void 0 && (e = 50), x.slice(-e);
}
function Ft(e) {
  return e === void 0 && (e = 10), x.slice(-e);
}
function Nr() {
  return Object.assign({}, y);
}
function Gt() {
  return Object.assign({}, y, { bufferSize: x.length, maxBufferSize: Ue, telemetryCoreAvailable: !!Mt(), eventBusAvailable: !!jr(), portsInitialized: le.isInitialized() });
}
function Ur() {
  x = [], Object.keys(y).forEach((e) => {
    y[e] = e === "lastEventAt" || e === "lastEventLocalTime" ? null : 0;
  });
}
function zr() {
  return et;
}
function Hr() {
  const e = Pt();
  return { moduleId: tt, version: et, namespace: Fe, bufferSize: x.length, maxBufferSize: Ue, metrics: Object.assign({}, y), integrations: { telemetryCore: !!Mt(), eventBus: !!jr() }, timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone, portsInitialized: le.isInitialized() };
}
function xr() {
  const e = Pt(), t = rt("telemetry"), r = !!(t && t.buildTimestamp), n = { bufferNotOverflowing: x.length <= Ue, eventsTracking: y.totalEvents >= 0, lowErrorEventRate: y.totalEvents === 0 || y.errorEvents / y.totalEvents < 0.3, buildTimestampAvailable: r, portsInitialized: le.isInitialized() }, s = Object.values(n).filter(Boolean).length, o = Object.keys(n).length;
  return { status: s === o ? "HEALTHY" : "DEGRADED", score: `${s}/${o}`, healthy: s === o, checks: n, totalEvents: y.totalEvents, version: et, moduleId: tt, timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone, portsInitialized: le.isInitialized() };
}
const wo = { track: Q, trackSessionEvent: Q, getEventLog: Vt, getRecentEvents: Ft, getMetrics: Nr, getStats: Gt, clear: Ur, getVersion: zr, info: Hr, healthCheck: xr, injectPorts: Rr, getPorts: Lr }, bo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: tt,
  VERSION: et,
  clear: Ur,
  default: wo,
  getEventLog: Vt,
  getMetrics: Nr,
  getPorts: Lr,
  getRecentEvents: Ft,
  getStats: Gt,
  getVersion: zr,
  healthCheck: xr,
  info: Hr,
  injectPorts: Rr,
  trackSessionEvent: Q
}, Symbol.toStringTag, { value: "Module" })), _e = "session-manager";
let me = !1, Bt = !1, Ge = [];
const Re = { globalStateSyncs: 0, ownerLockAttempts: 0, ownerLockSuccess: 0, errors: 0 }, Ce = { globalStateConnected: !1, eventBusAvailable: !1, telemetryCoreAvailable: !1, ownerLockAcquired: !1 };
function nt() {
  typeof window > "u" || (Ce.globalStateConnected = Ge.length > 0, Ce.eventBusAvailable = !!j("eventBus"), Ce.telemetryCoreAvailable = !!j("telemetryCore"), Ce.ownerLockAcquired = Bt);
}
function Do() {
  const e = j("globalState");
  if (!e) return !1;
  Re.ownerLockAttempts++;
  try {
    const t = e._sessionOwner;
    return t && t !== _e ? (k.debug("GlobalState session already has owner", { currentOwner: t }), !1) : (e._sessionOwner = _e, me = !0, Bt = !0, Re.ownerLockSuccess++, k.info("GlobalState owner lock acquired", { owner: _e }), Q("session:globalstate:owner-lock-acquired"), !0);
  } catch (t) {
    return Re.errors++, k.error("Failed to acquire owner lock", { error: t.message }), !1;
  }
}
function Co() {
  const e = j("globalState");
  if (!e) return !1;
  try {
    return e._sessionOwner === _e ? (delete e._sessionOwner, me = !1, Bt = !1, k.info("GlobalState owner lock released"), Q("session:globalstate:owner-lock-released"), !0) : !1;
  } catch (t) {
    return k.error("Failed to release owner lock", { error: t.message }), !1;
  }
}
function $o() {
  const e = j("globalState");
  if (!e) return !1;
  const t = e._sessionOwner;
  return !t || t === _e;
}
function Oo() {
  const e = j("globalState");
  if (!e) {
    k.info("GlobalState nao disponivel - funcionando standalone"), C.markDegraded("globalstate-unavailable");
    return;
  }
  Do() || (k.debug("Failed to acquire GlobalState owner lock - another owner exists"), C.markDegraded("globalstate-owner-conflict"));
  const t = (r) => {
    if (r && r._source !== "session-manager" && me && r.isAuthenticated && r.user) {
      const n = i.getUser();
      JSON.stringify(n) !== JSON.stringify(r.user) && (i.update({ authenticated: !0, user: r.user, userId: r.user ? r.user.id : null, roles: r.user && r.user.roles ? r.user.roles : [], lastActivity: r.lastActivity || Date.now() }, S.SYNC), Q("session:global-state:synced-from", { userId: r.user ? r.user.id : null }));
    }
  };
  try {
    const r = e.subscribe(t, "session");
    Ge.push(r);
    const n = e.getState();
    n && n.session && t(n.session), Q("session:global-state:connected", { isOwner: me }), k.info("GlobalState integration configurada", { isOwner: me }), nt();
  } catch (r) {
    Re.errors++, k.error("GlobalState integration error", { error: r.message }), C.markDegraded("globalstate-integration-error");
  }
}
function _o() {
  Ge.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), Ge = [], Co(), nt();
}
function W() {
  return me;
}
function $e() {
  return Object.assign({}, Ce);
}
function ut() {
  return Object.assign({}, Re);
}
const ie = "6.5.0-P2-ENTERPRISE", V = "session-manager", we = () => {
  const e = [];
  return m || e.push("AUTH_EVENTS not available"), ft || e.push("AUTH_STATES not available"), pe || e.push("SESSION_EVENTS not available"), { valid: e.length === 0, issues: e, timestamp: Date.now() };
}, M = B({ moduleId: V }), Ro = () => M.init(), ae = (e) => M.get(e), Lo = (e) => M.inject(e), mt = () => M.snapshot(), jo = () => {
  var e, t;
  return (t = (e = ae("config")) == null ? void 0 : e.app) == null ? void 0 : t.debug;
}, No = {
  info: (...e) => {
    var t;
    const r = ae("logger");
    (t = r == null ? void 0 : r.info) == null || t.call(r, `[${V}]`, ...e);
  },
  warn: (...e) => {
    var t;
    const r = ae("logger");
    (t = r == null ? void 0 : r.warn) == null || t.call(r, `[${V}]`, ...e);
  },
  error: (...e) => {
    var t;
    const r = ae("logger");
    (t = r == null ? void 0 : r.error) == null || t.call(r, `[${V}]`, ...e);
  },
  debug: (...e) => {
    var t;
    const r = ae("logger");
    jo() && ((t = r == null ? void 0 : r.debug) == null || t.call(r, `[${V}]`, ...e));
  }
}, q = { logins: 0, logouts: 0, sessionChecks: 0, refreshes: 0, errors: 0, lastActivityAt: null }, oe = {
  version: ie,
  name: V,
  moduleId: V,
  AUTH_EVENTS: m,
  AUTH_STATES: ft,
  SESSION_EVENTS: pe,
  MUTATION_SOURCES: S,
  LIFECYCLE_STATES: l,
  validateContracts: we,
  injectPorts: Lo,
  getPorts: mt,
  init: (e = {}) => {
    Ro();
    const t = we();
    return t.valid || No.debug("Contract validation issues", { issues: t.issues }), C.init(e).then((r) => (r.ok && !r.alreadyInitialized && Oo(), nt(), r));
  },
  shutdown: () => (_o(), C.shutdown()),
  destroy: () => oe.shutdown(),
  reset: () => C.reset(),
  isInitialized: () => C.isInitialized(),
  getLifecycleState: () => C.getState(),
  login: (e, t, r = {}) => (q.logins++, q.lastActivityAt = Date.now(), se.login(e, t, r)),
  logout: (e = {}) => (q.logouts++, je.clear(), se.logout(e)),
  checkSession: (e = {}) => (q.sessionChecks++, se.checkSession(e)),
  refresh: (e = {}) => (q.refreshes++, se.refresh(e)),
  isAuthenticated: () => i.isAuthenticated(),
  getUser: () => i.getUser(),
  getUserId: () => i.getUserId(),
  getRoles: () => i.getRoles(),
  getSessionId: () => i.getSessionId(),
  getLastActivity: () => i.getLastActivity(),
  getTimeout: () => i.getTimeout(),
  setTimeout: (e) => i.setTimeout(e),
  isExpired: () => Vr(i.getLastActivity(), i.getTimeout()),
  getAuthContext: () => se.getAuthContext(),
  getToken: () => E.getToken(),
  getCsrf: () => E.getCsrf(),
  getAuthHeaders: () => E.getAuthHeaders(),
  subscribe: (e) => i.subscribe(e),
  getVersion: () => ie,
  getStateVersion: () => i.getStateVersion(),
  beginTransaction: (e) => i.beginTransaction(e),
  commit: () => i.commit(),
  rollback: () => i.rollback(),
  rollbackToVersion: (e) => i.rollbackToVersion(e),
  getHistory: () => i.getHistory(),
  isGlobalStateOwner: W,
  canWriteToGlobalState: $o,
  status: () => {
    const e = C.getLifecycleInfo();
    return { lifecycleState: e.state, initialized: e.initialized, authenticated: i.isAuthenticated(), hasUser: !!i.getUser(), hasToken: !!E.getToken(), hasCsrf: !!E.getCsrf(), sessionId: i.getSessionId(), stateVersion: i.getStateVersion(), isGlobalStateOwner: W(), degradedReasons: e.degradedReasons, authEventsIntegrated: !0, portsStatus: { initialized: M.isInitialized() } };
  },
  info: () => {
    const e = C.getLifecycleInfo(), t = we(), r = ut(), n = { ...q, ...r }, s = pt();
    return { moduleId: V, version: ie, lifecycleState: e.state, status: e.initialized ? "READY" : "NOT_INITIALIZED", initialized: e.initialized, authEventsIntegrated: !0, contractsValid: t.valid, isGlobalStateOwner: W(), strictMode: s, metrics: n, session: { authenticated: i.isAuthenticated(), userId: i.getUserId(), sessionId: i.getSessionId(), stateVersion: i.getStateVersion(), duration: i.getDuration() }, integrations: $e(), portsStatus: { initialized: M.isInitialized(), hasEventBus: !!ae("eventBus"), hasGlobalState: !!ae("globalState") }, portsInitialized: M.isInitialized(), timestamp: Date.now() };
  },
  healthCheck: () => {
    var e, t, r, n;
    let s, o, u, g;
    try {
      s = ((e = i.healthCheck) == null ? void 0 : e.call(i)) || { status: "UNKNOWN" };
    } catch (ne) {
      s = { status: "ERROR", error: ne.message };
    }
    try {
      o = ((t = se.healthCheck) == null ? void 0 : t.call(se)) || { status: "UNKNOWN" };
    } catch (ne) {
      o = { status: "ERROR", error: ne.message };
    }
    try {
      u = ((r = E.healthCheck) == null ? void 0 : r.call(E)) || { status: "UNKNOWN" };
    } catch (ne) {
      u = { status: "ERROR", error: ne.message };
    }
    try {
      g = ((n = C.healthCheck) == null ? void 0 : n.call(C)) || { status: "UNKNOWN" };
    } catch (ne) {
      g = { status: "ERROR", error: ne.message };
    }
    const Y = we(), T = C.getLifecycleInfo(), st = $e(), ot = { lifecycleReady: T.state === l.READY || T.state === l.DEGRADED, lifecycleNotFailed: T.state !== l.FAILED, noRecentErrors: !T.lastError, contractsValid: Y.valid, globalStateConnected: st.globalStateConnected, globalStateOwner: W(), portsInitialized: M.isInitialized(), storeHealthy: s.status === "HEALTHY", authHealthy: o.status === "HEALTHY", tokenHealthy: u.status === "HEALTHY" || u.status === "DEGRADED", lifecycleHealthy: g.status === "HEALTHY" || g.status === "DEGRADED" }, it = Object.values(ot).filter(Boolean).length, at = Object.keys(ot).length, re = [];
    return T.state === l.FAILED && re.push("lifecycle-failed"), T.state === l.DEGRADED && re.push("lifecycle-degraded"), Y.valid || re.push("contracts-invalid"), st.globalStateConnected || re.push("globalstate-not-connected"), W() || re.push("globalstate-not-owner"), { status: T.state === l.FAILED || it < at * 0.5 ? "UNHEALTHY" : T.state === l.DEGRADED || it < at ? "DEGRADED" : "HEALTHY", score: `${it}/${at}`, checks: ot, issues: re.length > 0 ? re : null, lifecycleState: T.state, modules: { store: s, auth: o, token: u, lifecycle: g }, integrations: st, portsInitialized: M.isInitialized(), version: ie, moduleId: V, authenticated: i.isAuthenticated(), stateVersion: i.getStateVersion(), isGlobalStateOwner: W(), timestamp: Date.now() };
  },
  getMetrics: () => ({ ...q, ...ut() }),
  getIntegrationsStatus: $e,
  ports: { storage: D, cookie: G, runtime: P },
  debug: {
    getStore: () => i.toJSON(),
    getStoreStats: () => i.getStats(),
    getStoreHistory: () => i.getHistory(),
    getTokenInfo: () => E.info(),
    getAuthEvents: () => m,
    getAuthStates: () => ft,
    getSessionEvents: () => pe,
    getLifecycleStates: () => l,
    getMutationSources: () => S,
    getEventLog: (e) => Vt(e),
    getRecentEvents: (e) => Ft(e),
    getTrackerStats: () => Gt(),
    getLifecycleInfo: () => C.getLifecycleInfo(),
    getMetrics: () => ({ ...q, ...ut() }),
    getIntegrationsStatus: $e,
    getPorts: mt,
    isGlobalStateOwner: W,
    validateContracts: we,
    tracker: bo,
    ports: { storage: D, cookie: G, runtime: P }
  }
};
if (typeof window < "u") {
  const e = pt();
  e || (window.SessionManager = oe, window.SessionManagerVersion = ie), window.__dev = window.__dev || {}, window.__dev.sessionManager = {
    getVersion: () => ie,
    info: () => oe.info(),
    healthCheck: () => oe.healthCheck(),
    status: () => oe.status(),
    getMetrics: () => oe.getMetrics(),
    getIntegrationsStatus: $e,
    getStoreHistory: () => i.getHistory(),
    getLifecycleState: () => C.getState(),
    isGlobalStateOwner: W,
    getPorts: mt,
    debug: oe.debug
  }, nt(), Q("session:global:exposed", { version: ie, strictMode: e, authEventsIntegrated: !0, portsEnabled: !0, ownerLockEnabled: !0 });
}
export {
  Vo as AUTH_EVENTS,
  Fo as AUTH_STATES,
  l as LIFECYCLE_STATES,
  V as MODULE_ID,
  S as MUTATION_SOURCES,
  Go as SESSION_EVENTS,
  oe as SessionManager,
  ie as VERSION,
  oe as default,
  mt as getPorts,
  Lo as injectPorts
};
