import { createCorePorts as fe } from "/core/runtime/ports-profiles.js";
import { LOG_EVENTS as re } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { SessionManager as ot } from "/components/session-manager/dist/session-manager.bundle.js";
const ie = "core.auth.contracts", oe = "1.2.0-P2-ENTERPRISE", he = { userId: null, username: null, email: null, roles: [], capabilities: [], level: 0, isAuthenticated: !1, sessionId: null, token: null, expiresAt: null, lastActivity: null, metadata: {} }, Ge = Object.freeze({ IDLE: "IDLE", INITIALIZING: "INITIALIZING", AUTHENTICATED: "AUTHENTICATED", EXPIRED: "EXPIRED", LOGGED_OUT: "LOGGED_OUT", ERROR: "ERROR" }), V = Object.freeze({ SESSION_INIT: "auth:session:init", SESSION_READY: "auth:session:ready", SESSION_LOGIN: "auth:session:login", SESSION_LOGOUT: "auth:session:logout", SESSION_EXPIRED: "auth:session:expired", SESSION_RENEWED: "auth:session:renewed", SESSION_CHANGED: "auth:session:changed", SESSION_ERROR: "auth:session:error", AUTH_INIT: "auth:init", AUTH_READY: "auth:ready", AUTH_GRANTED: "auth:granted", AUTH_DENIED: "auth:denied", AUTH_REFRESH: "auth:refresh", AUTH_ERROR: "auth:error", PERMISSION_CHECK: "auth:permission:check", PERMISSION_GRANTED: "auth:permission:granted", PERMISSION_DENIED: "auth:permission:denied", POLICY_EVALUATE: "auth:policy:evaluate", POLICY_ALLOWED: "auth:policy:allowed", POLICY_DENIED: "auth:policy:denied" }), N = Object.freeze({ SUPER_ADMIN: "super_admin", ADMIN: "admin", MANAGER: "manager", USER: "user", GUEST: "guest" }), y = Object.freeze({ NONE: 0, GUEST: 1, USER: 2, MANAGER: 3, ADMIN: 4, SUPER_ADMIN: 5 }), ze = Object.freeze({ VIEW_PANELS: "panels:view", MANAGE_PANELS: "panels:manage", VIEW_USERS: "users:view", CREATE_USERS: "users:create", EDIT_USERS: "users:edit", DELETE_USERS: "users:delete", ACCESS_ADMIN: "admin:access", MANAGE_PERMISSIONS: "admin:permissions", MANAGE_POLICIES: "admin:policies", VIEW_AUDIT: "admin:audit", SYSTEM_CONFIG: "system:config", SYSTEM_LOGS: "system:logs" }), se = Object.freeze({ ALLOW: "ALLOW", DENY: "DENY", NOT_APPLICABLE: "NOT_APPLICABLE" });
function X() {
  return Object.assign({}, he);
}
function je(s) {
  return !(!s || typeof s != "object" || typeof s.isAuthenticated != "boolean" || !Array.isArray(s.roles) || !Array.isArray(s.capabilities));
}
function $e() {
  return { moduleId: ie, version: oe, timestamp: Date.now() };
}
function Ve() {
  return { status: "HEALTHY", score: 1, maxScore: 1, moduleId: ie, version: oe };
}
const st = { MODULE_ID: ie, VERSION: oe, AUTH_CONTEXT_SCHEMA: he, SESSION_STATES: Ge, ORCHESTRATOR_EVENTS: V, SYSTEM_ROLES: N, ACCESS_LEVELS: y, SYSTEM_CAPABILITIES: ze, POLICY_RESULTS: se, createEmptyAuthContext: X, validateAuthContext: je, info: $e, healthCheck: Ve }, Y = "core.auth.permissions-guard", Z = "1.2.0-P2-ENTERPRISE";
function ue(s) {
  s = s || {};
  const r = s.eventBus;
  let i = !1;
  const t = { checks: 0, granted: 0, denied: 0, errors: 0 }, n = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), m = (o, e, u) => {
    r && r.emit && r.emit(re.ENTRY, { module: Y, level: o, msg: e, data: u || {}, timestamp: Date.now() });
  }, h = (o) => (o = o || [], o.includes(N.SUPER_ADMIN) ? y.SUPER_ADMIN : o.includes(N.ADMIN) ? y.ADMIN : o.includes(N.MANAGER) ? y.MANAGER : o.includes(N.USER) ? y.USER : o.includes(N.GUEST) ? y.GUEST : y.NONE);
  function R(o) {
    o = o || {}, !i && (i = !0, o.routePermissions && Object.keys(o.routePermissions).forEach((e) => {
      n.set(e, o.routePermissions[e]);
    }), o.panelPermissions && Object.keys(o.panelPermissions).forEach((e) => {
      f.set(e, o.panelPermissions[e]);
    }), m("info", "init.complete", { routes: n.size, panels: f.size }));
  }
  function S(o, e) {
    if (e = e || {}, t.checks++, !e.isAuthenticated)
      return t.denied++, !1;
    const u = e.capabilities || [];
    if ((e.roles || []).includes(N.SUPER_ADMIN) || u.includes(o))
      return t.granted++, !0;
    const A = o.split(":")[0];
    return u.includes(`${A}:*`) ? (t.granted++, !0) : (t.denied++, !1);
  }
  function g(o, e) {
    if (e = e || {}, t.checks++, !o)
      return t.denied++, !1;
    const u = ["/login", "/logout", "/forbidden", "/404", "/public"];
    for (let E = 0; E < u.length; E++)
      if (o.indexOf(u[E]) === 0)
        return t.granted++, !0;
    if (!e.isAuthenticated)
      return t.denied++, !1;
    const d = e.roles || [], A = e.level || 0;
    if (d.includes(N.SUPER_ADMIN))
      return t.granted++, !0;
    const c = n.get(o);
    if (c) {
      if (c.minLevel && A < c.minLevel)
        return t.denied++, !1;
      if (c.allowedRoles) {
        let E = !1;
        for (let v = 0; v < c.allowedRoles.length; v++)
          if (d.includes(c.allowedRoles[v])) {
            E = !0;
            break;
          }
        if (!E)
          return t.denied++, !1;
      }
    }
    return o.indexOf("/admin") === 0 && !d.includes(N.ADMIN) && !d.includes(N.SUPER_ADMIN) ? (t.denied++, !1) : (t.granted++, !0);
  }
  function I(o, e) {
    if (e = e || {}, t.checks++, !o || !e.isAuthenticated)
      return t.denied++, !1;
    const u = e.roles || [], d = e.capabilities || [], A = e.level || 0;
    if (u.includes(N.SUPER_ADMIN))
      return t.granted++, !0;
    const c = f.get(o);
    if (c) {
      if (c.minLevel && A < c.minLevel || c.requiredCapability && !d.includes(c.requiredCapability))
        return t.denied++, !1;
      if (c.allowedRoles) {
        let E = !1;
        for (let v = 0; v < c.allowedRoles.length; v++)
          if (u.includes(c.allowedRoles[v])) {
            E = !0;
            break;
          }
        if (!E)
          return t.denied++, !1;
      }
    }
    return o.indexOf("admin") !== -1 && !u.includes(N.ADMIN) && !u.includes(N.SUPER_ADMIN) ? (t.denied++, !1) : (t.granted++, !0);
  }
  function O(o) {
    return o = o || {}, o.isAuthenticated ? o.level || h(o.roles) : y.NONE;
  }
  function P(o) {
    return o = o || {}, o.isAuthenticated ? (o.roles || []).slice() : [];
  }
  function b(o, e) {
    return e = e || {}, e.isAuthenticated ? (e.roles || []).includes(o) : !1;
  }
  function D(o, e) {
    if (o = o || [], e = e || {}, !e.isAuthenticated) return !1;
    const u = e.roles || [];
    for (let d = 0; d < o.length; d++)
      if (u.includes(o[d])) return !0;
    return !1;
  }
  function H(o, e) {
    if (o = o || [], e = e || {}, !e.isAuthenticated) return !1;
    const u = e.roles || [];
    for (let d = 0; d < o.length; d++)
      if (!u.includes(o[d])) return !1;
    return !0;
  }
  function w(o, e) {
    n.set(o, e);
  }
  function L(o, e) {
    f.set(o, e);
  }
  function G() {
    n.clear(), f.clear(), i = !1, t.checks = 0, t.granted = 0, t.denied = 0, t.errors = 0;
  }
  function z() {
    return { moduleId: Y, version: Z, initialized: i, routePermissions: n.size, panelPermissions: f.size, metrics: Object.assign({}, t), timestamp: Date.now() };
  }
  function j() {
    const o = { initialized: i, metricsValid: t.checks >= 0, noExcessiveErrors: t.errors < 100 };
    let e = 0;
    for (const u in o) o[u] && e++;
    return { status: e === 3 ? "HEALTHY" : e >= 2 ? "DEGRADED" : "UNHEALTHY", score: e, maxScore: 3, scoreDisplay: `${e}/3`, checks: o, moduleId: Y, version: Z, timestamp: Date.now() };
  }
  return { init: R, can: S, canAccessRoute: g, canAccessPanel: I, getUserLevel: O, getRoles: P, hasRole: b, hasAnyRole: D, hasAllRoles: H, registerRoutePermission: w, registerPanelPermission: L, reset: G, info: z, healthCheck: j, MODULE_ID: Y, VERSION: Z };
}
const Ye = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Y,
  VERSION: Z,
  createPermissionsGuard: ue,
  default: ue
}, Symbol.toStringTag, { value: "Module" })), W = "core.auth.security-policies", J = "1.2.0-P2-ENTERPRISE";
function ce(s) {
  s = s || {};
  const r = s.eventBus;
  let i = !1, t = !1;
  const n = /* @__PURE__ */ new Map(), f = { evaluations: 0, allowed: 0, denied: 0, errors: 0 }, m = (e, u, d) => {
    r && r.emit && r.emit(re.ENTRY, { module: W, level: e, msg: u, data: d || {}, timestamp: Date.now() });
  };
  function h(e) {
    e = e || {}, !i && (i = !0, e.policies && Array.isArray(e.policies) && e.policies.forEach((u) => {
      g(u);
    }), m("info", "init.complete", { policies: n.size }));
  }
  function R() {
    t = !0, m("info", "policies.locked");
  }
  function S(e) {
    return e === "ADMIN_UNLOCK_TOKEN" ? (t = !1, m("warn", "policies.unlocked"), !0) : !1;
  }
  function g(e) {
    if (t)
      return m("warn", "register.blocked", { reason: "locked", policyId: e ? e.id : null }), !1;
    if (!e || !e.id || !e.resource)
      return m("error", "register.invalid", { policy: e }), !1;
    const u = { id: e.id, resource: e.resource, action: e.action || "*", effect: e.effect || se.ALLOW, conditions: e.conditions || [], priority: e.priority || 0, description: e.description || "", createdAt: Date.now() };
    return n.set(e.id, u), m("debug", "policy.registered", { id: e.id }), !0;
  }
  function I(e, u) {
    return t || !n.has(e) ? !1 : (n.delete(e), g(Object.assign({}, u, { id: e })));
  }
  function O(e) {
    return t ? !1 : n.delete(e);
  }
  function P() {
    return t ? !1 : (n.clear(), !0);
  }
  function b() {
    return Array.from(n.values());
  }
  function D(e) {
    return n.get(e) || null;
  }
  function H(e, u) {
    const d = u.split(".");
    let A = e;
    for (let c = 0; c < d.length; c++) {
      if (A == null) return;
      A = A[d[c]];
    }
    return A;
  }
  function w(e, u) {
    if (e = e || [], u = u || {}, e.length === 0) return !0;
    for (let d = 0; d < e.length; d++) {
      const A = e[d], c = A.field, E = A.operator, v = A.value, _ = H(u, c);
      let a = !1;
      switch (E) {
        case "equals":
          a = _ === v;
          break;
        case "notEquals":
          a = _ !== v;
          break;
        case "in":
          a = Array.isArray(v) && v.includes(_);
          break;
        case "notIn":
          a = Array.isArray(v) && !v.includes(_);
          break;
        case "contains":
          a = Array.isArray(_) && _.includes(v);
          break;
        case "greaterThan":
          a = _ > v;
          break;
        case "lessThan":
          a = _ < v;
          break;
        case "exists":
          a = _ != null;
          break;
        case "notExists":
          a = _ == null;
          break;
        default:
          a = !0;
      }
      if (!a) return !1;
    }
    return !0;
  }
  function L(e, u, d) {
    if (d = d || {}, f.evaluations++, !e)
      return f.errors++, { allowed: !1, reason: "No resource specified", policy: null };
    const A = Array.from(n.values()).filter((c) => !(c.resource !== "*" && c.resource !== e && e.indexOf(c.resource.replace("*", "")) !== 0 || c.action !== "*" && c.action !== u)).sort((c, E) => E.priority - c.priority);
    if (A.length === 0)
      return f.allowed++, { allowed: !0, reason: "No applicable policies", policy: null };
    for (let c = 0; c < A.length; c++) {
      const E = A[c];
      if (w(E.conditions, d)) {
        const _ = E.effect === se.ALLOW;
        return _ ? f.allowed++ : f.denied++, { allowed: _, reason: E.description || `Policy ${E.id} ${E.effect}`, policy: { id: E.id, effect: E.effect, priority: E.priority } };
      }
    }
    return f.denied++, { allowed: !1, reason: "No conditions met", policy: null };
  }
  function G(e, u, d) {
    return L(e, u, d).allowed;
  }
  function z() {
    n.clear(), t = !1, i = !1, f.evaluations = 0, f.allowed = 0, f.denied = 0, f.errors = 0;
  }
  function j() {
    return { moduleId: W, version: J, initialized: i, locked: t, policiesCount: n.size, metrics: Object.assign({}, f), timestamp: Date.now() };
  }
  function o() {
    const e = { initialized: i, policiesValid: n.size >= 0, noExcessiveErrors: f.errors < 100 };
    let u = 0;
    for (const d in e) e[d] && u++;
    return { status: u === 3 ? "HEALTHY" : u >= 2 ? "DEGRADED" : "UNHEALTHY", score: u, maxScore: 3, scoreDisplay: `${u}/3`, checks: e, moduleId: W, version: J, timestamp: Date.now() };
  }
  return { init: h, lock: R, unlock: S, registerPolicy: g, replacePolicy: I, removePolicy: O, clearPolicies: P, getPolicies: b, getPolicy: D, evaluate: L, canAccess: G, reset: z, info: j, healthCheck: o, MODULE_ID: W, VERSION: J };
}
const We = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: W,
  VERSION: J,
  createSecurityPoliciesManager: ce,
  default: ce
}, Symbol.toStringTag, { value: "Module" })), B = "core.auth.auth-orchestrator", x = "1.3.0-P2-ENTERPRISE";
function de(s) {
  s = s || {};
  const r = s.eventBus, i = s.sessionManager, t = s.permissionsGuard, n = s.policiesManager;
  let f = !1, m = !1, h = X();
  const R = [];
  let S = [];
  const g = { initCount: 0, refreshCount: 0, contextBuilds: 0, errors: 0 }, I = (a, p, k) => {
    r && r.emit && r.emit(re.ENTRY, { module: B, level: a, msg: p, data: k || {}, timestamp: Date.now() });
  }, O = () => {
    R.forEach((a) => {
      try {
        a(h);
      } catch {
        g.errors++;
      }
    });
  }, P = () => {
    S.forEach((a) => {
      try {
        a(h);
      } catch {
        g.errors++;
      }
    });
  };
  function b() {
    g.contextBuilds++;
    const a = i && i.getAuthContext ? i.getAuthContext() : X();
    return h = Object.assign({}, a, {
      sessionStatus: i && i.healthCheck ? i.healthCheck().status : "UNKNOWN",
      permissionsStatus: t && t.healthCheck ? t.healthCheck().status : "UNKNOWN",
      policiesStatus: n && n.healthCheck ? n.healthCheck().status : "UNKNOWN",
      contextBuiltAt: Date.now()
    }), h;
  }
  function D(a) {
    if (a = a || {}, f) {
      I("debug", "init.skipped", { reason: "already-initialized" });
      return;
    }
    g.initCount++, I("info", "init.start", { version: x }), i && i.init && i.init(a.session || {}), t && t.init && t.init(a.permissions || {}), n && n.init && n.init(a.policies || {}), b(), i && i.subscribe && i.subscribe(() => {
      b(), P();
    }), n && n.lock && n.lock(), f = !0, m = !0, r && r.emit && (r.emit(V.AUTH_INIT, { timestamp: Date.now() }), r.emit(V.AUTH_READY, h)), O(), I("info", "init.complete", { authenticated: h.isAuthenticated });
  }
  function H() {
    return Object.assign({}, h);
  }
  function w() {
    return m;
  }
  function L() {
    return h.isAuthenticated === !0;
  }
  function G(a) {
    if (typeof a != "function") return () => {
    };
    if (m)
      try {
        a(h);
      } catch {
        g.errors++;
      }
    else
      R.push(a);
    return () => {
      const p = R.indexOf(a);
      p > -1 && R.splice(p, 1);
    };
  }
  function z(a) {
    return typeof a != "function" ? () => {
    } : (S.push(a), () => {
      S = S.filter((p) => p !== a);
    });
  }
  function j() {
    return g.refreshCount++, I("info", "refresh.start"), (i && i.refreshSession ? i.refreshSession() : Promise.resolve()).then(() => (b(), r && r.emit && r.emit(V.AUTH_REFRESH, h), P(), h));
  }
  function o(a) {
    return t && t.can ? t.can(a, h) : !1;
  }
  function e(a) {
    return t && t.canAccessRoute ? t.canAccessRoute(a, h) : !1;
  }
  function u(a) {
    return t && t.canAccessPanel ? t.canAccessPanel(a, h) : !1;
  }
  function d(a, p) {
    return n && n.evaluate ? n.evaluate(a, p, h) : { allowed: !0 };
  }
  function A(a) {
    return (i && i.login ? i.login(a) : Promise.resolve({ success: !1 })).then((k) => (k && k.success && (b(), r && r.emit && r.emit(V.AUTH_GRANTED, h), P()), k));
  }
  function c() {
    return (i && i.logout ? i.logout() : Promise.resolve()).then((p) => (b(), P(), p));
  }
  function E() {
    i && i.reset && i.reset(), t && t.reset && t.reset(), n && n.reset && n.reset(), h = X(), f = !1, m = !1, R.length = 0, S.length = 0;
  }
  function v() {
    return { moduleId: B, version: x, initialized: f, ready: m, isAuthenticated: h.isAuthenticated, userId: h.userId, roles: h.roles, subscriberCount: S.length, metrics: Object.assign({}, g), submodules: { session: i && i.info ? i.info() : null, permissions: t && t.info ? t.info() : null, policies: n && n.info ? n.info() : null }, timestamp: Date.now() };
  }
  function _() {
    const a = i && i.healthCheck ? i.healthCheck() : { status: "UNKNOWN" }, p = t && t.healthCheck ? t.healthCheck() : { status: "UNKNOWN" }, k = n && n.healthCheck ? n.healthCheck() : { status: "UNKNOWN" }, ee = { initialized: f, ready: m, sessionHealthy: a.status === "HEALTHY", permissionsHealthy: p.status === "HEALTHY", policiesHealthy: k.status === "HEALTHY", noExcessiveErrors: g.errors < 100 };
    let $ = 0;
    for (const we in ee) ee[we] && $++;
    const te = 6;
    return { status: $ === te ? "HEALTHY" : $ >= 4 ? "DEGRADED" : "UNHEALTHY", score: $, maxScore: te, scoreDisplay: `${$}/${te}`, checks: ee, submodules: { session: a, permissions: p, policies: k }, moduleId: B, version: x, timestamp: Date.now() };
  }
  return { init: D, getAuthContext: H, isReady: w, isAuthenticated: L, onAuthReady: G, subscribe: z, refresh: j, can: o, canAccessRoute: e, canAccessPanel: u, evaluatePolicy: d, login: A, logout: c, reset: E, info: v, healthCheck: _, MODULE_ID: B, VERSION: x };
}
const Be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: B,
  VERSION: x,
  createAuthOrchestrator: de,
  default: de
}, Symbol.toStringTag, { value: "Module" })), T = "core.auth.auth-adapter", Q = "2.7.0-P2-ENTERPRISE", M = fe({ moduleId: T }), Ee = () => {
  M.init();
}, Ae = (s) => M.get(s), me = (s) => M.inject(s), ve = () => M.snapshot();
let l = null, ge = null, ne = 0;
const Se = () => Ae("logger") || console, Ie = (s) => {
  l = s;
}, C = () => {
  var s;
  return ((s = l == null ? void 0 : l.getAuthContext) == null ? void 0 : s.call(l)) || null;
}, ae = () => {
  var s, r, i;
  const t = Ae("globalState");
  if (t != null && t.getState)
    try {
      const n = t.getState();
      if (((s = n == null ? void 0 : n.auth) == null ? void 0 : s.isAuthenticated) === !0 || (n == null ? void 0 : n.isAuthenticated) === !0) return !0;
    } catch {
    }
  return typeof document < "u" && ((i = (r = document.body) == null ? void 0 : r.dataset) == null ? void 0 : i.state) === "authenticated";
}, K = () => {
  var s, r;
  if (((s = l == null ? void 0 : l.isAuthenticated) == null ? void 0 : s.call(l)) || !1) return !0;
  if (ae()) {
    const n = Se();
    return (r = n.debug) == null || r.call(n, `[${T}] isAuthenticated via fallback (GlobalState/body.dataset)`), !0;
  }
  return !1;
}, _e = () => {
  var s;
  return ((s = l == null ? void 0 : l.isReady) == null ? void 0 : s.call(l)) || !1;
}, pe = () => {
  const s = C();
  return s != null && s.isAuthenticated ? { id: s.userId, username: s.username, email: s.email, roles: (s.roles || []).slice(), level: s.level } : null;
}, Re = () => {
  const s = C();
  return s != null && s.roles ? s.roles.slice() : [];
}, Oe = () => {
  const s = C();
  return s != null && s.capabilities ? s.capabilities.slice() : [];
}, Ne = () => {
  const s = C();
  return (s == null ? void 0 : s.level) || 0;
}, De = () => {
  const s = C();
  return (s == null ? void 0 : s.sessionId) || null;
}, be = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.can) == null ? void 0 : r.call(l, s)) || !1;
}, Pe = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.canAccessRoute) == null ? void 0 : r.call(l, s)) || !1;
}, Ce = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.canAccessPanel) == null ? void 0 : r.call(l, s)) || !1;
}, ke = (s, r) => {
  var i;
  return ((i = l == null ? void 0 : l.evaluatePolicy) == null ? void 0 : i.call(l, s, r)) || { allowed: !0 };
}, ye = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.login) == null ? void 0 : r.call(l, s)) || Promise.resolve({ success: !1, error: "Orchestrator not available" });
}, Te = () => {
  var s;
  return ((s = l == null ? void 0 : l.logout) == null ? void 0 : s.call(l)) || Promise.resolve({ success: !1 });
}, Me = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.onAuthReady) == null ? void 0 : r.call(l, s)) || (() => {
  });
}, Le = (s) => {
  var r;
  return ((r = l == null ? void 0 : l.subscribe) == null ? void 0 : r.call(l, s)) || (() => {
  });
}, Ue = () => {
  var s;
  Ee();
  const r = C(), i = ae();
  return {
    moduleId: T,
    version: Q,
    orchestratorConnected: !!l,
    isAuthenticated: K(),
    isAuthenticatedViaOrchestrator: ((s = l == null ? void 0 : l.isAuthenticated) == null ? void 0 : s.call(l)) || !1,
    isAuthenticatedViaFallback: i,
    userId: (r == null ? void 0 : r.userId) || null,
    username: (r == null ? void 0 : r.username) || null,
    roles: (r == null ? void 0 : r.roles) || [],
    level: (r == null ? void 0 : r.level) || 0,
    healthCheckCount: ne,
    lastHealthCheck: ge,
    portsInitialized: M.isInitialized(),
    timestamp: Date.now()
  };
}, He = () => {
  var s, r, i;
  Ee(), ne++;
  const t = C(), n = ae(), f = {
    hasOrchestrator: !!l,
    hasAuthContext: !!t,
    hasAuthFlag: t ? typeof t.isAuthenticated == "boolean" : !1,
    hasUserWhenAuthenticated: !t || !t.isAuthenticated || !!t.userId,
    hasUsernameWhenAuthenticated: !t || !t.isAuthenticated || !!t.username,
    hasRolesWhenAuthenticated: !t || !t.isAuthenticated || Array.isArray(t.roles) && t.roles.length > 0,
    hasLevelWhenAuthenticated: !t || !t.isAuthenticated || typeof t.level == "number",
    hasSessionIdWhenAuthenticated: !t || !t.isAuthenticated || !!t.sessionId,
    orchestratorReady: ((s = l == null ? void 0 : l.isReady) == null ? void 0 : s.call(l)) || !1,
    fallbackAvailable: n || !K(),
    portsInitialized: M.isInitialized()
  }, m = Object.values(f).filter(Boolean).length, h = Object.keys(f).length, R = m / h, S = R < 1 ? R >= 0.7 ? "DEGRADED" : "UNHEALTHY" : "HEALTHY", g = Object.keys(f).filter((O) => !f[O]), I = {
    moduleId: T,
    version: Q,
    status: S,
    score: m,
    maxScore: h,
    scoreDisplay: `${m}/${h}`,
    ratio: Math.round(R * 100),
    checks: f,
    failures: g,
    authenticated: K(),
    authenticatedViaOrchestrator: ((r = l == null ? void 0 : l.isAuthenticated) == null ? void 0 : r.call(l)) || !1,
    authenticatedViaFallback: n,
    userId: (t == null ? void 0 : t.userId) || null,
    username: (t == null ? void 0 : t.username) || null,
    level: (t == null ? void 0 : t.level) || null,
    roles: (t == null ? void 0 : t.roles) || [],
    checkNumber: ne,
    portsInitialized: M.isInitialized(),
    timestamp: Date.now()
  };
  if (ge = I, S !== "HEALTHY") {
    const O = Se();
    (i = O.warn) == null || i.call(O, `[${T}] healthCheck: ${S}`, { failures: g, score: I.scoreDisplay });
  }
  return I;
}, xe = {
  setOrchestrator: Ie,
  getAuthContext: C,
  isAuthenticated: K,
  isReady: _e,
  getUser: pe,
  getRoles: Re,
  getCapabilities: Oe,
  getLevel: Ne,
  getSessionId: De,
  can: be,
  canAccessRoute: Pe,
  canAccessPanel: Ce,
  evaluatePolicy: ke,
  login: ye,
  logout: Te,
  onAuthReady: Me,
  subscribe: Le,
  info: Ue,
  healthCheck: He,
  injectPorts: me,
  getPorts: ve,
  MODULE_ID: T,
  VERSION: Q
}, Ke = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: T,
  VERSION: Q,
  can: be,
  canAccessPanel: Ce,
  canAccessRoute: Pe,
  default: xe,
  evaluatePolicy: ke,
  getAuthContext: C,
  getCapabilities: Oe,
  getLevel: Ne,
  getPorts: ve,
  getRoles: Re,
  getSessionId: De,
  getUser: pe,
  healthCheck: He,
  info: Ue,
  injectPorts: me,
  isAuthenticated: K,
  isReady: _e,
  login: ye,
  logout: Te,
  onAuthReady: Me,
  setOrchestrator: Ie,
  subscribe: Le
}, Symbol.toStringTag, { value: "Module" })), F = "core.auth", le = "1.6.0-P2-ENTERPRISE", q = fe({ moduleId: F }), Fe = (s) => q.get(s), qe = (s) => q.inject(s), Xe = () => q.snapshot(), U = { createStackCount: 0, createStackErrors: 0, lastCreateAt: null }, Ze = async (s = {}) => {
  const { eventBus: r } = s, i = { sessionManager: null, permissionsGuard: null, policiesManager: null, authOrchestrator: null, AuthAdapter: null };
  try {
    const t = await import("/components/session-manager/dist/session-manager.bundle.js"), { SessionManager: n } = t;
    await n.init();
    const f = {
      isAuthenticated: () => n.isAuthenticated(),
      getUser: () => n.getUser(),
      getRoles: () => n.getRoles(),
      getLevel: () => {
        const D = n.getUser();
        return (D == null ? void 0 : D.level) || 0;
      },
      getAuthContext: () => n.getAuthContext(),
      checkSession: () => n.checkSession(),
      init: (D) => n.init ? n.init(D) : Promise.resolve(),
      subscribe: (D) => n.subscribe ? n.subscribe(D) : () => {
      },
      refreshSession: () => n.refresh ? n.refresh() : Promise.resolve(),
      healthCheck: () => n.healthCheck ? n.healthCheck() : { status: "UNKNOWN" },
      info: () => n.info ? n.info() : { moduleId: "session-manager-adapter" },
      _isSingletonAdapter: !0,
      _version: n.version
    }, h = (await Promise.resolve().then(() => Ye)).default({ eventBus: r }), S = (await Promise.resolve().then(() => We)).default({ eventBus: r }), I = (await Promise.resolve().then(() => Be)).default({
      eventBus: r,
      sessionManager: f,
      permissionsGuard: h,
      policiesManager: S
    });
    I.init && I.init({});
    const O = await Promise.resolve().then(() => Ke), P = O.default, { setOrchestrator: b } = O;
    return b(I), i.sessionManager = n, i.permissionsGuard = h, i.policiesManager = S, i.authOrchestrator = I, i.AuthAdapter = P, U.createStackCount++, U.lastCreateAt = Date.now(), i;
  } catch (t) {
    U.createStackErrors++;
    const n = Fe("logger");
    throw n && n.error && n.error(`[${F}] createAuthStack failed:`, t.message), t;
  }
}, Je = () => ({
  moduleId: F,
  version: le,
  portsInitialized: q.isInitialized(),
  metrics: { ...U },
  timestamp: Date.now()
}), Qe = () => {
  const s = {
    moduleLoaded: !0,
    noRecentErrors: U.createStackErrors === 0
  }, r = Object.values(s).filter(Boolean).length, i = Object.keys(s).length;
  return {
    status: r === i ? "HEALTHY" : "DEGRADED",
    score: r,
    maxScore: i,
    scoreDisplay: `${r}/${i}`,
    checks: s,
    moduleId: F,
    version: le,
    portsInitialized: q.isInitialized(),
    metrics: { ...U },
    timestamp: Date.now()
  };
}, nt = { MODULE_ID: F, VERSION: le, info: Je, healthCheck: Qe, createAuthStack: Ze, injectPorts: qe, getPorts: Xe };
export {
  y as ACCESS_LEVELS,
  he as AUTH_CONTEXT_SCHEMA,
  xe as AuthAdapter,
  st as AuthContracts,
  F as MODULE_ID,
  V as ORCHESTRATOR_EVENTS,
  se as POLICY_RESULTS,
  Ge as SESSION_STATES,
  ze as SYSTEM_CAPABILITIES,
  N as SYSTEM_ROLES,
  ot as SessionManager,
  le as VERSION,
  be as can,
  Ce as canAccessPanel,
  Pe as canAccessRoute,
  de as createAuthOrchestrator,
  Ze as createAuthStack,
  X as createEmptyAuthContext,
  ue as createPermissionsGuard,
  ce as createSecurityPoliciesManager,
  nt as default,
  ke as evaluatePolicy,
  C as getAuthContext,
  Oe as getCapabilities,
  Ne as getLevel,
  ve as getPorts,
  Xe as getPortsSnapshot,
  Re as getRoles,
  De as getSessionId,
  pe as getUser,
  Qe as healthCheck,
  Je as info,
  qe as injectPorts,
  K as isAuthenticated,
  _e as isReady,
  ye as login,
  Te as logout,
  Me as onAuthReady,
  Ie as setOrchestrator,
  Le as subscribe,
  je as validateAuthContext
};
