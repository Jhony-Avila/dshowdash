import { PERMISSIONS_EVENTS as ce, validateEventContracts as Ne, GLOBAL_STATE_EVENTS as k, APP_EVENTS as ge, AUTH_EVENTS as v, TELEMETRY_EVENTS as K, STATE_EVENTS as M } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { AUTH_EVENTS as ut, GLOBAL_STATE_EVENTS as dt } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { createCorePorts as ue } from "/core/runtime/ports-profiles.js";
import "/core/version.js";
const de = "global-state-contracts", fe = "6.1.0-ENTERPRISE", ve = "global-state", S = Object.freeze({
  STATE_CHANGED: "global-state:changed",
  STATE_RESET: "global-state:reset",
  STATE_HYDRATED: "global-state:hydrated",
  READY: "global-state:ready",
  DESTROYED: "global-state:destroyed",
  INIT_START: "global-state:init:start",
  INIT_COMPLETE: "global-state:init:complete",
  SUBSCRIBER_ADDED: "global-state:subscriber:added",
  SUBSCRIBER_REMOVED: "global-state:subscriber:removed",
  SESSION_SYNCED: "global-state:session:synced",
  SESSION_CLEARED: "global-state:session:cleared",
  PERMISSIONS_MODE_CHANGED: "global-state:permissions:mode:changed",
  PERMISSIONS_ENFORCEMENT_CHANGED: "global-state:permissions:enforcement:changed",
  PERMISSIONS_ENFORCEMENT_DECISION: ce.ENFORCEMENT_DECISION,
  ERROR: "global-state:error",
  VALIDATION_FAILED: "global-state:validation:failed"
}), he = Object.freeze({ enabled: !1, scope: "global", domains: [], routes: [], failOpen: !0 }), V = Object.freeze({
  session: Object.freeze({ isAuthenticated: !1, token: null, userId: null, user: null, lastActivity: null, expiresAt: null, roles: [], permissions: [] }),
  preferences: Object.freeze({ theme: "light", language: "pt-BR", compactMode: !1, animations: !0 }),
  app: Object.freeze({ isLoading: !1, isOnline: !0, maintenanceMode: !1, version: "3.0.0" }),
  navigation: Object.freeze({ currentRoute: "/", previousRoute: null, sidebarOpen: !0, activePanel: null, currentPage: null, lastNavigationAt: null, view: null, tab: null, section: null, entity: null, entityId: null, mode: "view", page: 1, sort: null, filters: null, extras: {} }),
  flags: Object.freeze({ debugMode: !1, telemetryEnabled: !0, featureFlags: {} }),
  permissions: Object.freeze({ mode: "allow-all", lastModeChange: null, apiConnected: !1, enforcement: Object.freeze({ enabled: !1, scope: "global", domains: [], routes: [], failOpen: !0, lastChange: null }) })
}), h = Object.freeze({
  SET_SESSION: "SET_SESSION",
  CLEAR_SESSION: "CLEAR_SESSION",
  UPDATE_PREFERENCES: "UPDATE_PREFERENCES",
  SET_LOADING: "SET_LOADING",
  SET_ONLINE_STATUS: "SET_ONLINE_STATUS",
  SET_MAINTENANCE_MODE: "SET_MAINTENANCE_MODE",
  UPDATE_NAVIGATION: "UPDATE_NAVIGATION",
  SET_FLAG: "SET_FLAG",
  RESET_STATE: "RESET_STATE",
  HYDRATE_STATE: "HYDRATE_STATE",
  SET_PERMISSIONS_MODE: "SET_PERMISSIONS_MODE",
  SET_PERMISSIONS_ENFORCEMENT: "SET_PERMISSIONS_ENFORCEMENT"
}), j = Object.freeze({
  session: Object.freeze(["isAuthenticated", "token", "userId", "user", "lastActivity", "expiresAt", "refreshToken", "roles", "permissions"]),
  preferences: Object.freeze(["theme", "language", "compactMode", "animations", "fontSize", "timezone"]),
  navigation: Object.freeze(["currentRoute", "previousRoute", "sidebarOpen", "activePanel", "breadcrumbs", "currentPage", "lastNavigationAt", "view", "tab", "section", "entity", "entityId", "mode", "page", "sort", "filters", "extras"]),
  app: Object.freeze(["isLoading", "isOnline", "maintenanceMode", "version"]),
  flags: Object.freeze(["debugMode", "telemetryEnabled", "featureFlags"]),
  permissions: Object.freeze(["mode", "lastModeChange", "apiConnected", "enforcement"]),
  enforcement: Object.freeze(["enabled", "scope", "domains", "routes", "failOpen", "lastChange"])
}), C = Object.freeze({
  themes: Object.freeze(["light", "dark", "auto"]),
  languages: Object.freeze(["pt-BR", "en-US", "es-ES"]),
  navigationModes: Object.freeze(["view", "edit", "create", "list", "detail"]),
  permissionsModes: Object.freeze(["allow-all", "enforce"]),
  enforcementScopes: Object.freeze(["global", "domain", "route"])
}), J = Object.freeze(["password", "password_hash", "secret", "api_key", "token", "refreshToken"]);
function ke(e, t) {
  const n = j[e];
  return n ? n.indexOf(t) !== -1 : !1;
}
function W(e, t) {
  if (!t || typeof t != "object") return [];
  const n = j[e];
  if (!n) return Object.keys(t);
  const s = [], i = Object.keys(t);
  for (let a = 0; a < i.length; a++)
    n.indexOf(i[a]) === -1 && s.push(i[a]);
  return s;
}
function Se(e) {
  return C.themes.indexOf(e) !== -1;
}
function be(e) {
  return C.languages.indexOf(e) !== -1;
}
function Oe(e) {
  return C.navigationModes.indexOf(e) !== -1;
}
function Me(e) {
  return C.permissionsModes.indexOf(e) !== -1;
}
function Ie(e) {
  return C.enforcementScopes.indexOf(e) !== -1;
}
function Te(e) {
  return !(!e || typeof e != "object" || typeof e.enabled != "boolean" || e.scope && !Ie(e.scope) || e.domains && !Array.isArray(e.domains) || e.routes && !Array.isArray(e.routes) || e.failOpen !== void 0 && typeof e.failOpen != "boolean");
}
function Pe() {
  return { moduleId: de, version: fe, namespace: ve, actionsCount: Object.keys(h).length, eventsCount: Object.keys(S).length, allowedFieldsSections: Object.keys(j), hasEnforcement: !0, timestamp: Date.now() };
}
function je() {
  const e = V.permissions, t = { hasActions: Object.keys(h).length > 0, hasEvents: Object.keys(S).length > 0, hasInitialState: !!V, hasAllowedFields: Object.keys(j).length > 0, hasPermissionsState: !!e, hasEnforcementState: !!(e && e.enforcement), hasEnforcementAction: !!h.SET_PERMISSIONS_ENFORCEMENT, allFrozen: Object.isFrozen(h) && Object.isFrozen(S) && Object.isFrozen(j) };
  let n = 0, s = 0;
  const i = Object.keys(t);
  for (let a = 0; a < i.length; a++)
    s++, t[i[a]] && n++;
  return { status: n === s ? "HEALTHY" : "DEGRADED", score: `${n}/${s}`, healthy: n === s, checks: t, moduleId: de, version: fe, timestamp: Date.now() };
}
const Y = { MODULE_ID: de, VERSION: fe, NAMESPACE: ve, EVENTS: S, INITIAL_STATE: V, ACTIONS: h, ALLOWED_FIELDS: j, VALID_VALUES: C, SENSITIVE_FIELDS: J, ENFORCEMENT_DEFAULTS: he, isAllowedField: ke, getUnknownFields: W, isValidTheme: Se, isValidLanguage: be, isValidNavigationMode: Oe, isValidPermissionsMode: Me, isValidEnforcementScope: Ie, isValidEnforcement: Te, info: Pe, healthCheck: je };
Object.freeze(Y);
const Q = "global-state-validators", ee = "4.1.0-ENTERPRISE", l = { validationsRun: 0, validationsPassed: 0, validationsFailed: 0, sanitizationsRun: 0 }, R = {
  MODULE_ID: Q,
  VERSION: ee,
  validateUserId(e) {
    if (l.validationsRun++, e == null)
      return l.validationsPassed++, { valid: !0, error: null };
    if (typeof e != "string" && typeof e != "number")
      return l.validationsFailed++, { valid: !1, error: "userId must be string or number" };
    if (typeof e == "string") {
      if (e.trim() === "")
        return l.validationsFailed++, { valid: !1, error: "userId cannot be empty string" };
      if (e.length > 100)
        return l.validationsFailed++, { valid: !1, error: "userId max length is 100 chars" };
      if (/[<>"'&]/.test(e))
        return l.validationsFailed++, { valid: !1, error: "userId contains invalid characters" };
    }
    return l.validationsPassed++, { valid: !0, error: null };
  },
  validateSession(e) {
    if (l.validationsRun++, !e || typeof e != "object")
      return l.validationsFailed++, { valid: !1, error: "Session must be an object" };
    if (e.isAuthenticated !== void 0 && typeof e.isAuthenticated != "boolean")
      return l.validationsFailed++, { valid: !1, error: "isAuthenticated must be boolean" };
    if (e.userId !== void 0) {
      const n = this.validateUserId(e.userId);
      if (!n.valid) return n;
    }
    if (e.user !== void 0 && e.user !== null) {
      if (typeof e.user != "object")
        return l.validationsFailed++, { valid: !1, error: "user must be object or null" };
      if (e.user.id !== void 0 && e.userId !== void 0 && String(e.userId) !== String(e.user.id))
        return l.validationsFailed++, { valid: !1, error: "userId and user.id must match" };
    }
    if (e.token !== void 0 && e.token !== null && typeof e.token != "string")
      return l.validationsFailed++, { valid: !1, error: "token must be string or null" };
    const t = W("session", e);
    return t.length > 0 ? (l.validationsFailed++, { valid: !1, error: `Unknown session fields: ${t.join(", ")}` }) : (l.validationsPassed++, { valid: !0, error: null });
  },
  validatePreferences(e) {
    if (l.validationsRun++, !e || typeof e != "object")
      return l.validationsFailed++, { valid: !1, error: "Preferences must be an object" };
    const t = W("preferences", e);
    return t.length > 0 ? (l.validationsFailed++, { valid: !1, error: `Unknown preference fields: ${t.join(", ")}` }) : e.theme !== void 0 && !Se(e.theme) ? (l.validationsFailed++, { valid: !1, error: `Invalid theme: ${e.theme}. Valid: ${C.themes.join(", ")}` }) : e.language !== void 0 && !be(e.language) ? (l.validationsFailed++, { valid: !1, error: `Invalid language: ${e.language}. Valid: ${C.languages.join(", ")}` }) : e.compactMode !== void 0 && typeof e.compactMode != "boolean" ? (l.validationsFailed++, { valid: !1, error: "compactMode must be boolean" }) : e.animations !== void 0 && typeof e.animations != "boolean" ? (l.validationsFailed++, { valid: !1, error: "animations must be boolean" }) : (l.validationsPassed++, { valid: !0, error: null });
  },
  validateNavigation(e) {
    if (l.validationsRun++, !e || typeof e != "object")
      return l.validationsFailed++, { valid: !1, error: "Navigation must be an object" };
    const t = W("navigation", e);
    if (t.length > 0)
      return l.validationsFailed++, { valid: !1, error: `Unknown navigation fields: ${t.join(", ")}` };
    if (e.currentRoute !== void 0) {
      if (typeof e.currentRoute != "string")
        return l.validationsFailed++, { valid: !1, error: "currentRoute must be string" };
      if (e.currentRoute.indexOf("/") !== 0)
        return l.validationsFailed++, { valid: !1, error: "currentRoute must start with /" };
    }
    return e.previousRoute !== void 0 && e.previousRoute !== null && typeof e.previousRoute != "string" ? (l.validationsFailed++, { valid: !1, error: "previousRoute must be string or null" }) : e.sidebarOpen !== void 0 && typeof e.sidebarOpen != "boolean" ? (l.validationsFailed++, { valid: !1, error: "sidebarOpen must be boolean" }) : e.activePanel !== void 0 && e.activePanel !== null && typeof e.activePanel != "string" ? (l.validationsFailed++, { valid: !1, error: "activePanel must be string or null" }) : e.mode !== void 0 && !Oe(e.mode) ? (l.validationsFailed++, { valid: !1, error: `Invalid navigation mode: ${e.mode}. Valid: ${C.navigationModes.join(", ")}` }) : e.page !== void 0 && (typeof e.page != "number" || e.page < 1) ? (l.validationsFailed++, { valid: !1, error: "page must be a positive number" }) : (l.validationsPassed++, { valid: !0, error: null });
  },
  validateState(e) {
    if (l.validationsRun++, !e || typeof e != "object")
      return l.validationsFailed++, { valid: !1, error: "State must be an object" };
    const t = ["session", "preferences", "app", "navigation", "flags"], n = [];
    for (let r = 0; r < t.length; r++)
      t[r] in e || n.push(t[r]);
    if (n.length > 0)
      return l.validationsFailed++, { valid: !1, error: `Missing keys: ${n.join(", ")}` };
    const s = this.validateSession(e.session);
    if (!s.valid) return { valid: !1, error: `session: ${s.error}` };
    const i = this.validatePreferences(e.preferences);
    if (!i.valid) return { valid: !1, error: `preferences: ${i.error}` };
    const a = this.validateNavigation(e.navigation);
    return a.valid ? (l.validationsPassed++, { valid: !0, error: null }) : { valid: !1, error: `navigation: ${a.error}` };
  },
  validateAction(e) {
    return l.validationsRun++, !e || typeof e != "object" ? (l.validationsFailed++, { valid: !1, error: "Action must be an object" }) : !e.type || typeof e.type != "string" ? (l.validationsFailed++, { valid: !1, error: "Action must have a type string" }) : (l.validationsPassed++, { valid: !0, error: null });
  },
  validatePartialUpdate(e, t) {
    return l.validationsRun++, !e || typeof e != "string" ? (l.validationsFailed++, { valid: !1, error: "Path must be a string" }) : t === void 0 ? (l.validationsFailed++, { valid: !1, error: "Value cannot be undefined" }) : (l.validationsPassed++, { valid: !0, error: null });
  },
  sanitizeUser(e) {
    if (l.sanitizationsRun++, !e || typeof e != "object") return null;
    const t = Object.assign({}, e);
    for (let n = 0; n < J.length; n++)
      delete t[J[n]];
    return t;
  },
  filterAllowedFields(e, t) {
    if (!e || typeof e != "object") return {};
    const n = j[t];
    if (!n) return {};
    const s = {}, i = Object.keys(e);
    for (let a = 0; a < i.length; a++) {
      const r = i[a];
      n.indexOf(r) !== -1 && (s[r] = e[r]);
    }
    return s;
  },
  info() {
    return { moduleId: Q, version: ee, metrics: Object.assign({}, l), successRate: l.validationsRun > 0 ? `${(l.validationsPassed / l.validationsRun * 100).toFixed(2)}%` : "N/A", contractsSource: "api/contracts.js", timestamp: Date.now() };
  },
  healthCheck() {
    const e = { contractsImported: !!Y, hasAllowedFields: Object.keys(j).length > 0, hasValidValues: Object.keys(C).length > 0, hasSensitiveFields: J.length > 0, lowFailureRate: l.validationsRun === 0 || l.validationsFailed / l.validationsRun < 0.5 };
    let t = 0, n = 0;
    const s = Object.keys(e);
    for (let i = 0; i < s.length; i++)
      n++, e[s[i]] && t++;
    return { status: t === n ? "HEALTHY" : "DEGRADED", score: `${t}/${n}`, healthy: t === n, checks: e, metrics: Object.assign({}, l), moduleId: Q, version: ee, timestamp: Date.now() };
  },
  resetMetrics() {
    l.validationsRun = 0, l.validationsPassed = 0, l.validationsFailed = 0, l.sanitizationsRun = 0;
  }
}, x = "global-state", _ = "4.4.0-PORTSFACTORY", Le = ue({ moduleId: `${x}:logger` });
function Fe(e) {
  return Le.get(e);
}
const Ue = () => !!(typeof window < "u" && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.debug), A = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), n = Fe("logger");
  if (!n) return;
  const s = `[${x}]`;
  if (e === "error") {
    n.error && n.error(...[s].concat(t));
    return;
  }
  if (e === "warn") {
    n.warn && n.warn(...[s].concat(t));
    return;
  }
  Ue() && n.debug && n.debug(...[s].concat(t));
}, te = "global-state-middleware", ne = "4.2.0-P17WI", y = {
  executionsRun: 0,
  executionsPassed: 0,
  executionsBlocked: 0,
  middlewaresAdded: 0,
  middlewaresRemoved: 0,
  errors: 0
}, D = /* @__PURE__ */ new Map();
let Ve = 0;
const N = {
  MODULE_ID: te,
  VERSION: ne,
  get middlewares() {
    return Array.from(D.values());
  },
  use(e) {
    if (typeof e != "function")
      throw new Error("Middleware must be a function");
    const t = ++Ve;
    return D.set(t, e), y.middlewaresAdded++, t;
  },
  remove(e) {
    if (typeof e == "number") {
      const s = D.delete(e);
      return s && y.middlewaresRemoved++, s;
    }
    const t = D.entries();
    let n = t.next();
    for (; !n.done; ) {
      if (n.value[1] === e)
        return D.delete(n.value[0]), y.middlewaresRemoved++, !0;
      n = t.next();
    }
    return !1;
  },
  execute(e, t, n) {
    const s = this;
    y.executionsRun++;
    let i = e;
    const a = s.middlewares;
    return new Promise((r) => {
      let c = 0;
      function E() {
        if (c >= a.length) {
          y.executionsPassed++, r({ blocked: !1, action: i });
          return;
        }
        const O = a[c++];
        try {
          Promise.resolve(O(i, t, n)).then((p) => {
            if (p === !1) {
              y.executionsBlocked++, r({ blocked: !0, action: i });
              return;
            }
            p && typeof p == "object" && p.type && (i = p), E();
          }).catch((p) => {
            y.errors++, A("error", "Middleware error:", p), r({ blocked: !0, error: p });
          });
        } catch (p) {
          y.errors++, A("error", "Middleware sync error:", p), r({ blocked: !0, error: p });
        }
      }
      E();
    });
  },
  clear() {
    return D.clear(), this;
  },
  loggerMiddleware(e, t) {
    return A("info", "Action:", e.type, e.payload || ""), e;
  },
  timestampMiddleware(e) {
    return Object.assign({}, e, {
      meta: Object.assign({}, e.meta, { timestamp: Date.now() })
    });
  },
  validationMiddleware(e) {
    return e.type ? e : (A("warn", "Action without type blocked"), !1);
  },
  info() {
    return {
      moduleId: te,
      version: ne,
      middlewareCount: D.size,
      metrics: Object.assign({}, y),
      builtInMiddlewares: ["loggerMiddleware", "timestampMiddleware", "validationMiddleware"],
      timestamp: Date.now()
    };
  },
  healthCheck() {
    const e = {
      noErrors: y.errors === 0,
      lowBlockRate: y.executionsRun === 0 || y.executionsBlocked / y.executionsRun < 0.5,
      middlewaresHealthy: D.size < 50
    }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
    return {
      status: t === n ? "HEALTHY" : "DEGRADED",
      score: `${t}/${n}`,
      healthy: t === n,
      checks: e,
      metrics: Object.assign({}, y),
      middlewareCount: D.size,
      moduleId: te,
      version: ne,
      timestamp: Date.now()
    };
  },
  resetMetrics() {
    y.executionsRun = 0, y.executionsPassed = 0, y.executionsBlocked = 0, y.middlewaresAdded = 0, y.middlewaresRemoved = 0, y.errors = 0;
  }
}, se = "global-state-telemetry", ie = "4.3.0-ENTERPRISE";
function B() {
  if (typeof window < "u" && window.Telemetry && window.Telemetry.buildTimestamp) return window.Telemetry.buildTimestamp();
  const e = Date.now();
  return { timestampUtc: e, isoUtc: new Date(e).toISOString(), localTime: new Date(e).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
const g = { trackedEvents: 0, stateChanges: 0, errors: 0, performanceEntries: 0, emitsToGlobal: 0, lastEventAt: null, lastEventLocalTime: null }, Ee = {
  MODULE_ID: se,
  VERSION: ie,
  enabled: !0,
  history: [],
  maxHistory: 100,
  _sessionId: null,
  init(e = {}) {
    this.enabled = e.enabled !== !1, this.maxHistory = e.maxHistory || 100, this.history = [], this._sessionId = null, this.track(K.INITIALIZED, { maxHistory: this.maxHistory });
  },
  track(e, t) {
    if (!this.enabled) return;
    t = t || {};
    const n = B();
    g.trackedEvents++, g.lastEventAt = n.timestampUtc, g.lastEventLocalTime = n.localTime;
    const s = { timestampUtc: n.timestampUtc, localTime: n.localTime, timeZone: n.timeZone, isoUtc: n.isoUtc, event: e, data: t, sessionId: this.getSessionId() };
    this.history.push(s), this.history.length > this.maxHistory && this.history.shift(), this.emitToGlobal(s);
  },
  trackStateChange(e, t, n) {
    g.stateChanges++, this.track(M.CHANGED, { action: e.type, payload: e.payload, changes: this.diffStates(t, n) });
  },
  trackError(e, t = {}) {
    g.errors++, this.track(M.ERROR, { message: e.message || String(e), stack: e.stack, context: t });
  },
  trackPerformance(e, t) {
    g.performanceEntries++;
    const n = B();
    this.track(M.PERFORMANCE, { operation: e, duration: t, timestampUtc: n.timestampUtc, localTime: n.localTime });
  },
  diffStates(e, t) {
    const n = [], s = {}, i = e ? Object.keys(e) : [], a = t ? Object.keys(t) : [];
    for (let c = 0; c < i.length; c++)
      s[i[c]] = !0;
    for (let c = 0; c < a.length; c++)
      s[a[c]] = !0;
    const r = Object.keys(s);
    for (let c = 0; c < r.length; c++) {
      const E = r[c], O = e ? e[E] : void 0, p = t ? t[E] : void 0;
      O !== p && n.push(E);
    }
    return n;
  },
  getSessionId() {
    return this._sessionId || (this._sessionId = `gstate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`), this._sessionId;
  },
  emitToGlobal(e) {
    try {
      const t = typeof window < "u" && (window.TelemetryCore || window.Telemetry);
      t && typeof t.track == "function" && (t.track(`global-state:${e.event}`, Object.assign({ timestampUtc: e.timestampUtc, localTime: e.localTime }, e.data)), g.emitsToGlobal++);
    } catch {
    }
  },
  getHistory() {
    return this.history.slice();
  },
  getEventLog() {
    return this.history.slice();
  },
  getRecentEvents(e = 10) {
    const t = Math.min(Math.max(1, e), this.history.length);
    return this.history.slice(-t);
  },
  clearHistory() {
    const e = this.history.length;
    this.history = [], this.track(K.CLEARED, { previousCount: e });
  },
  clearEventLog() {
    return this.history = [], !0;
  },
  export() {
    const e = B();
    return { sessionId: this.getSessionId(), totalEvents: this.history.length, history: this.getHistory(), metrics: Object.assign({}, g), exportedAt: e.isoUtc, exportedAtLocal: e.localTime };
  },
  getTrackerStats() {
    return { totalEvents: this.history.length, maxSize: this.maxHistory, enabled: this.enabled, sessionId: this.getSessionId(), oldestEvent: this.history[0] ? this.history[0].localTime : null, newestEvent: this.history[this.history.length - 1] ? this.history[this.history.length - 1].localTime : null, metrics: Object.assign({}, g) };
  },
  disable() {
    this.enabled = !1, this.track(K.DISABLED, {});
  },
  enable() {
    this.enabled = !0, this.track(K.ENABLED, {});
  },
  destroy() {
    this.history = [], this.enabled = !1, this._sessionId = null;
  },
  info() {
    const e = B();
    return { moduleId: se, version: ie, enabled: this.enabled, historySize: this.history.length, maxHistory: this.maxHistory, sessionId: this.getSessionId(), metrics: Object.assign({}, g), timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone };
  },
  healthCheck() {
    const e = B(), t = typeof window < "u" && window.Telemetry && typeof window.Telemetry.buildTimestamp == "function", n = { enabled: this.enabled, historyNotOverflowing: this.history.length <= this.maxHistory, hasSessionId: !!this._sessionId || this.history.length === 0, lowErrorRate: g.trackedEvents === 0 || g.errors / g.trackedEvents < 0.1, buildTimestampAvailable: t };
    let s = 0, i = 0;
    const a = Object.keys(n);
    for (let r = 0; r < a.length; r++)
      i++, n[a[r]] && s++;
    return { status: s === i ? "HEALTHY" : "DEGRADED", score: s, maxScore: i, scoreDisplay: `${s}/${i}`, healthy: s === i, checks: n, metrics: Object.assign({}, g), moduleId: se, version: ie, timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone };
  },
  resetMetrics() {
    g.trackedEvents = 0, g.stateChanges = 0, g.errors = 0, g.performanceEntries = 0, g.emitsToGlobal = 0, g.lastEventAt = null, g.lastEventLocalTime = null;
  }
}, I = {
  dispatches: 0,
  dispatchesSucceeded: 0,
  dispatchesFailed: 0,
  notificationsSent: 0,
  notificationsSkipped: 0,
  deepCompares: 0
};
function T(e) {
  const t = Array.prototype.slice.call(arguments, 1);
  A(...[e].concat(t));
}
function U(e) {
  return JSON.parse(JSON.stringify(e));
}
function G(e, t) {
  const n = t.split(".");
  let s = e;
  for (let i = 0; i < n.length; i++) {
    if (s == null) return;
    s = s[n[i]];
  }
  return s;
}
function ze(e, t, n) {
  const s = n.telemetry, i = n.emit, a = n.eventBus;
  switch (t.type) {
    case h.SET_SESSION: {
      const r = R.validateSession(t.payload);
      if (!r.valid)
        return s.trackError(new Error(r.error), { action: t }), T("error", "SET_SESSION blocked:", r.error), e;
      const c = Object.assign({}, t.payload);
      return c.user && (c.user = R.sanitizeUser(c.user)), !c.userId && c.user && c.user.id && (c.userId = c.user.id), c.isAuthenticated === void 0 && (c.isAuthenticated = !!(c.user || c.userId)), Object.assign({}, e, { session: Object.assign({}, e.session, c, { lastActivity: Date.now() }) });
    }
    case h.CLEAR_SESSION:
      return Object.assign({}, e, { session: U(V.session) });
    case h.UPDATE_PREFERENCES: {
      const r = R.validatePreferences(t.payload);
      return r.valid ? Object.assign({}, e, { preferences: Object.assign({}, e.preferences, t.payload) }) : (s.trackError(new Error(r.error), { action: t }), T("error", "UPDATE_PREFERENCES blocked:", r.error), e);
    }
    case h.SET_LOADING:
      return Object.assign({}, e, { app: Object.assign({}, e.app, { isLoading: !!t.payload.isLoading }) });
    case h.SET_ONLINE_STATUS:
      return Object.assign({}, e, { app: Object.assign({}, e.app, { isOnline: !!t.payload.isOnline }) });
    case h.SET_MAINTENANCE_MODE:
      return Object.assign({}, e, { app: Object.assign({}, e.app, { maintenanceMode: !!t.payload.maintenanceMode }) });
    case h.UPDATE_NAVIGATION: {
      const r = R.validateNavigation(t.payload);
      return r.valid ? Object.assign({}, e, { navigation: Object.assign({}, e.navigation, t.payload) }) : (s.trackError(new Error(r.error), { action: t }), T("error", "UPDATE_NAVIGATION blocked:", r.error), e);
    }
    case h.SET_FLAG: {
      const r = t.payload.key, c = t.payload.value;
      if (r === "featureFlags") return Object.assign({}, e, { flags: Object.assign({}, e.flags, { featureFlags: Object.assign({}, e.flags.featureFlags, c) }) });
      const E = Object.assign({}, e.flags);
      return E[r] = c, Object.assign({}, e, { flags: E });
    }
    case h.SET_PERMISSIONS_MODE: {
      const r = t.payload.mode, c = t.payload.apiConnected, E = t.payload.lastModeChange, O = t.payload.source;
      if (["allow-all", "enforce"].indexOf(r) === -1)
        return T("error", "SET_PERMISSIONS_MODE blocked: invalid mode", { mode: r }), e;
      const w = Object.assign({}, e.permissions, { mode: r, apiConnected: c !== void 0 ? c : e.permissions ? e.permissions.apiConnected : !1, lastModeChange: E || Date.now() });
      return i(S.PERMISSIONS_MODE_CHANGED, { mode: r, apiConnected: w.apiConnected, source: O, timestamp: Date.now() }), a && a.emit && a.emit(ce.MODE_CHANGED, { mode: r, apiConnected: w.apiConnected, source: O, timestamp: Date.now() }), Object.assign({}, e, { permissions: w });
    }
    case h.SET_PERMISSIONS_ENFORCEMENT: {
      const r = t.payload;
      if (!Te(r))
        return T("error", "SET_PERMISSIONS_ENFORCEMENT blocked: invalid structure", { payload: r }), e;
      const c = Object.assign({}, he, e.permissions ? e.permissions.enforcement : {}, r, { lastChange: r.lastChange || Date.now() }), E = Object.assign({}, e.permissions, { enforcement: c });
      return i(S.PERMISSIONS_ENFORCEMENT_CHANGED, { enforcement: c, previousEnforcement: e.permissions ? e.permissions.enforcement : null, timestamp: Date.now() }), a && a.emit && a.emit(ce.ENFORCEMENT_CHANGED, { enforcement: c, timestamp: Date.now() }), T("info", "Enforcement updated", { enabled: c.enabled, scope: c.scope, failOpen: c.failOpen }), Object.assign({}, e, { permissions: E });
    }
    case h.RESET_STATE:
      return U(V);
    case h.HYDRATE_STATE: {
      const r = R.validateState(t.payload);
      return r.valid ? U(t.payload) : (s.trackError(new Error(r.error), { action: "HYDRATE_STATE" }), T("error", "HYDRATE_STATE ignored - invalid payload:", r.error), e);
    }
    default:
      return e;
  }
}
function Ae(e, t, n, s, i) {
  e.forEach((a, r) => {
    const c = a.callback, E = a.selector, O = a.deepCompare;
    try {
      if (E) {
        const p = typeof E == "function" ? E(t) : G(t, E), w = typeof E == "function" ? E(n) : G(n, E);
        let f;
        O ? (I.deepCompares++, f = JSON.stringify(p) !== JSON.stringify(w)) : f = !Object.is(p, w), f ? (I.notificationsSent++, c(w, p, s)) : I.notificationsSkipped++;
      } else
        I.notificationsSent++, c(n, t, s);
    } catch (p) {
      i && i.trackError(p, { subscriberId: r, action: s });
    }
  });
}
function xe(e, t, n, s, i) {
  if (typeof n != "function") throw new Error("Callback must be a function");
  const a = t.value++, r = i && i.deepCompare === !0;
  return e.set(a, { callback: n, selector: s, deepCompare: r }), a;
}
function Be(e, t) {
  e.delete(t);
}
const X = "global-state-store", Re = "7.2.0-P0-ENTERPRISE", z = { total: 0, byEvent: {}, lastEmitAt: null };
function Ce(e) {
  z.total++, z.byEvent[e] = (z.byEvent[e] || 0) + 1, z.lastEmitAt = Date.now();
}
const me = ue({ moduleId: X }), b = { eventBus: null, _initialized: !1 };
function _e() {
  b._initialized || (me.init(), b.eventBus = me.get("eventBus"), b._initialized = !0);
}
function He(e) {
  return b._initialized || _e(), b[e] || null;
}
function m() {
  this.state = U(V), this.subscribers = /* @__PURE__ */ new Map(), this.subscriberCounter = { value: 0 }, this.isDestroyed = !1, this.isInitialized = !1, this.eventBus = null, this.telemetry = Ee;
}
m.prototype.injectPorts = function(e) {
  if (e)
    for (const t in e)
      e.hasOwnProperty(t) && (b[t] = e[t]);
  b._initialized = !0, e && e.eventBus && (this.eventBus = e.eventBus);
};
m.prototype.getPorts = () => Object.assign({}, b);
m.prototype.init = function(e) {
  if (e || (e = {}), typeof window > "u" || typeof document > "u")
    return T("warn", "No window/document - running in no-op mode"), this;
  if (this.isDestroyed) throw new Error("[GlobalState] Store is destroyed. Create new instance.");
  return this.isInitialized ? (T("warn", "Store already initialized"), this) : (_e(), this.telemetry.init({ enabled: e.telemetryEnabled !== !1, maxHistory: e.maxHistory || 100 }), N.clear(), e.useDefaultMiddlewares !== !1 && (N.use(N.validationMiddleware), N.use(N.timestampMiddleware)), this.connectEventBus(), e.initialState && this.hydrate(e.initialState), this.isInitialized = !0, this.telemetry.track(M.STORE_INITIALIZED, { options: e, portsInitialized: b._initialized }), Ce(S.READY), this.emit(S.READY, { state: this.getState() }), this);
};
m.prototype.connectEventBus = function() {
  try {
    const e = He("eventBus");
    e && (this.eventBus = e, b.eventBus = e);
  } catch (e) {
    T("warn", "EventBus connection failed:", e);
  }
};
m.prototype.emit = function(e, t) {
  if (t || (t = {}), Ce(e), this.eventBus && typeof this.eventBus.emit == "function")
    try {
      this.eventBus.emit(e, Object.assign({}, t, { source: X, timestamp: Date.now() }));
    } catch (n) {
      T("warn", "EventBus emit failed:", n);
    }
  try {
    window.dispatchEvent(new CustomEvent(e, { detail: t }));
  } catch {
  }
};
m.prototype.getState = function() {
  return U(this.state);
};
m.prototype.get = function(e) {
  return !e || typeof e != "string" ? this.getState() : G(this.state, e);
};
m.prototype.has = function(e) {
  return !e || typeof e != "string" ? !1 : G(this.state, e) !== void 0;
};
m.prototype.select = function(e) {
  return typeof e == "function" ? e(this.getState()) : typeof e == "string" ? G(this.state, e) : null;
};
m.prototype.dispatch = function(e) {
  const t = this;
  if (this.isDestroyed) throw new Error("[GlobalState] Store is destroyed. Cannot dispatch.");
  if (!this.isInitialized)
    return T("warn", "Store not initialized. Call init() first."), Promise.resolve(!1);
  I.dispatches++;
  const n = performance.now(), s = R.validateAction(e);
  return s.valid ? N.execute(e, this.state, this.dispatch.bind(this)).then((i) => {
    if (i.blocked)
      return I.dispatchesFailed++, t.telemetry.track(M.ACTION_BLOCKED, { action: e.type, reason: i.error }), !1;
    const a = i.action, r = t.getState();
    try {
      t.state = ze(t.state, a, { telemetry: t.telemetry, emit: t.emit.bind(t), eventBus: t.eventBus });
    } catch (O) {
      throw I.dispatchesFailed++, t.telemetry.trackError(O, { action: a }), t.emit(S.ERROR, { error: O, action: a }), O;
    }
    const c = t.getState();
    Ae(t.subscribers, r, c, a, t.telemetry);
    const E = performance.now() - n;
    return I.dispatchesSucceeded++, t.telemetry.trackStateChange(a, r, c), t.telemetry.trackPerformance("dispatch", E), t.emit(S.STATE_CHANGED, { action: a, prevState: r, nextState: c, duration: E }), !0;
  }) : (I.dispatchesFailed++, this.telemetry.trackError(new Error(s.error), { action: e }), this.emit(S.VALIDATION_FAILED, { action: e, error: s.error }), Promise.reject(new Error(s.error)));
};
m.prototype.subscribe = function(e, t, n) {
  n || (n = {});
  const s = xe(this.subscribers, this.subscriberCounter, e, t, n);
  this.telemetry.track(M.SUBSCRIBER_ADDED, { id: s, hasSelector: !!t, deepCompare: n.deepCompare }), this.emit(S.SUBSCRIBER_ADDED, { id: s });
  const i = this;
  return () => {
    Be(i.subscribers, s), i.telemetry.track(M.SUBSCRIBER_REMOVED, { id: s }), i.emit(S.SUBSCRIBER_REMOVED, { id: s });
  };
};
m.prototype.onChange = function(e, t, n) {
  if (typeof e != "string" || typeof t != "function") throw new Error("onChange requires path string and callback function");
  return this.subscribe(t, e, n);
};
m.prototype.hydrate = function(e) {
  const t = R.validateState(e);
  return t.valid ? (this.state = U(e), this.telemetry.track(M.HYDRATED, {}), this.emit(S.STATE_HYDRATED, { state: this.getState() }), !0) : (this.telemetry.trackError(new Error(t.error), { action: "hydrate" }), T("error", "Hydrate failed:", t.error), !1);
};
m.prototype.reset = function() {
  const e = this.getState();
  this.state = U(V), Ae(this.subscribers, e, this.getState(), { type: h.RESET_STATE }, this.telemetry), this.telemetry.track(M.RESET, {}), this.emit(S.STATE_RESET, { state: this.getState() });
};
m.prototype.destroy = function() {
  this.isDestroyed || (this.subscribers.clear(), N.clear(), this.telemetry.destroy(), this.isDestroyed = !0, this.isInitialized = !1, this.eventBus = null, b.eventBus = null, b._initialized = !1, this.emit(S.DESTROYED, {}));
};
m.prototype.getSubscriberCount = function() {
  return this.subscribers.size;
};
m.prototype.getTelemetryHistory = function() {
  return this.telemetry.getHistory();
};
m.prototype.healthCheck = function() {
  const e = this.getState(), t = { initialized: this.isInitialized, notDestroyed: !this.isDestroyed, hasEventBus: !!this.eventBus, subscribersHealthy: this.subscribers.size < 100, sessionValid: R.validateSession(e.session).valid, stateValid: R.validateState(e).valid, hasPermissionsState: !!e.permissions, hasEnforcementState: !!(e.permissions && e.permissions.enforcement), lowFailureRate: I.dispatches === 0 || I.dispatchesFailed / I.dispatches < 0.2, portsInitialized: b._initialized };
  let n = 0, s = 0;
  for (const i in t)
    t.hasOwnProperty(i) && (s++, t[i] && n++);
  return { status: n === s ? "HEALTHY" : n >= 7 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${s}`, healthy: n >= 8, checks: t, subscriberCount: this.subscribers.size, metrics: Object.assign({}, I), emitMetrics: Object.assign({}, z), moduleId: X, version: Re, portsInitialized: b._initialized, p0Enterprise: !0, p24Instrumented: !0, timestamp: Date.now() };
};
m.prototype.info = function() {
  return { moduleId: X, version: Re, isInitialized: this.isInitialized, isDestroyed: this.isDestroyed, subscriberCount: this.subscribers.size, hasEventBus: !!this.eventBus, portsInitialized: b._initialized, metrics: Object.assign({}, I), emitMetrics: Object.assign({}, z), telemetryStats: this.telemetry.getTrackerStats(), stateKeys: Object.keys(this.state), permissionsMode: this.state && this.state.permissions ? this.state.permissions.mode : "unknown", enforcementEnabled: this.state && this.state.permissions && this.state.permissions.enforcement ? this.state.permissions.enforcement.enabled : !1, timestamp: Date.now() };
};
m.prototype.exportState = function() {
  return { state: this.getState(), subscriberCount: this.getSubscriberCount(), telemetry: this.telemetry.export(), healthCheck: this.healthCheck(), info: this.info(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
const Ge = new m(), re = "global-state-actions", oe = "5.1.0-ENTERPRISE", P = {
  MODULE_ID: re,
  VERSION: oe,
  setSession(e) {
    return { type: h.SET_SESSION, payload: e };
  },
  clearSession() {
    return { type: h.CLEAR_SESSION, payload: null };
  },
  updatePreferences(e) {
    return { type: h.UPDATE_PREFERENCES, payload: e };
  },
  setLoading(e) {
    return { type: h.SET_LOADING, payload: { isLoading: e } };
  },
  setOnlineStatus(e) {
    return { type: h.SET_ONLINE_STATUS, payload: { isOnline: e } };
  },
  setMaintenanceMode(e) {
    return { type: h.SET_MAINTENANCE_MODE, payload: { maintenanceMode: e } };
  },
  updateNavigation(e) {
    return { type: h.UPDATE_NAVIGATION, payload: e };
  },
  setFlag(e, t) {
    return { type: h.SET_FLAG, payload: { key: e, value: t } };
  },
  resetState() {
    return { type: h.RESET_STATE, payload: null };
  },
  hydrateState(e) {
    return { type: h.HYDRATE_STATE, payload: e };
  },
  setPermissionsMode(e, t = {}) {
    return { type: h.SET_PERMISSIONS_MODE, payload: { mode: e, apiConnected: t.apiConnected !== void 0 ? t.apiConnected : !1, lastModeChange: Date.now(), source: t.source || "unknown" } };
  },
  setPermissionsEnforcement(e) {
    const t = Object.assign({}, he, e, { lastChange: Date.now() });
    return { type: h.SET_PERMISSIONS_ENFORCEMENT, payload: t };
  },
  enableEnforcement(e = "global", t = {}) {
    return P.setPermissionsEnforcement({ enabled: !0, scope: e, domains: t.domains || [], routes: t.routes || [], failOpen: t.failOpen !== !1 });
  },
  disableEnforcement() {
    return P.setPermissionsEnforcement({ enabled: !1 });
  },
  info() {
    return { moduleId: re, version: oe, availableActions: Object.keys(h), actionsCount: Object.keys(h).length, contractsSource: "api/contracts.js", hasEnforcementActions: !0, timestamp: Date.now() };
  },
  healthCheck() {
    const e = ["setSession", "clearSession", "updatePreferences", "setLoading", "setOnlineStatus", "setMaintenanceMode", "updateNavigation", "setFlag", "resetState", "hydrateState", "setPermissionsMode", "setPermissionsEnforcement", "enableEnforcement", "disableEnforcement"];
    let t = !0;
    for (let r = 0; r < e.length; r++)
      if (typeof P[e[r]] != "function") {
        t = !1;
        break;
      }
    const n = { hasActions: Object.keys(h).length > 0, allMethodsExist: t, contractsImported: !!Y, hasPermissionsAction: typeof P.setPermissionsMode == "function", hasEnforcementAction: typeof P.setPermissionsEnforcement == "function", hasEnforcementHelpers: typeof P.enableEnforcement == "function" };
    let s = 0, i = 0;
    const a = Object.keys(n);
    for (let r = 0; r < a.length; r++)
      i++, n[a[r]] && s++;
    return { status: s === i ? "HEALTHY" : "DEGRADED", score: `${s}/${i}`, healthy: s === i, checks: n, moduleId: re, version: oe, timestamp: Date.now() };
  }
}, ae = "global-state-selectors", le = "5.1.0-ENTERPRISE", d = {
  MODULE_ID: ae,
  VERSION: le,
  getSession(e) {
    return e && e.session ? e.session : {};
  },
  isAuthenticated(e) {
    return !!(e && e.session && e.session.isAuthenticated);
  },
  getToken(e) {
    return e && e.session && e.session.token ? e.session.token : null;
  },
  getUserId(e) {
    return e && e.session && e.session.user && e.session.user.id ? e.session.user.id : e && e.session && e.session.userId ? e.session.userId : null;
  },
  getUser(e) {
    return e && e.session && e.session.user ? e.session.user : null;
  },
  getLastActivity(e) {
    return e && e.session && e.session.lastActivity ? e.session.lastActivity : null;
  },
  getExpiresAt(e) {
    return e && e.session && e.session.expiresAt ? e.session.expiresAt : null;
  },
  getPreferences(e) {
    return e && e.preferences ? e.preferences : {};
  },
  getTheme(e) {
    return e && e.preferences && e.preferences.theme ? e.preferences.theme : "light";
  },
  getLanguage(e) {
    return e && e.preferences && e.preferences.language ? e.preferences.language : "pt-BR";
  },
  isCompactMode(e) {
    return !!(e && e.preferences && e.preferences.compactMode);
  },
  hasAnimations(e) {
    return e && e.preferences && e.preferences.animations !== !1;
  },
  getAppState(e) {
    return e && e.app ? e.app : {};
  },
  isLoading(e) {
    return !!(e && e.app && e.app.isLoading);
  },
  isOnline(e) {
    return e && e.app && e.app.isOnline !== !1;
  },
  isMaintenanceMode(e) {
    return !!(e && e.app && e.app.maintenanceMode);
  },
  getAppVersion(e) {
    return e && e.app && e.app.version ? e.app.version : "0.0.0";
  },
  getNavigation(e) {
    return e && e.navigation ? e.navigation : {};
  },
  getCurrentRoute(e) {
    return e && e.navigation && e.navigation.currentRoute ? e.navigation.currentRoute : "/";
  },
  getPreviousRoute(e) {
    return e && e.navigation && e.navigation.previousRoute ? e.navigation.previousRoute : null;
  },
  isSidebarOpen(e) {
    return e && e.navigation && e.navigation.sidebarOpen !== !1;
  },
  getActivePanel(e) {
    return e && e.navigation && e.navigation.activePanel ? e.navigation.activePanel : null;
  },
  getView(e) {
    return e && e.navigation && e.navigation.view ? e.navigation.view : null;
  },
  getTab(e) {
    return e && e.navigation && e.navigation.tab ? e.navigation.tab : null;
  },
  getSection(e) {
    return e && e.navigation && e.navigation.section ? e.navigation.section : null;
  },
  getEntity(e) {
    return e && e.navigation && e.navigation.entity ? e.navigation.entity : null;
  },
  getEntityId(e) {
    return e && e.navigation && e.navigation.entityId ? e.navigation.entityId : null;
  },
  getNavigationMode(e) {
    return e && e.navigation && e.navigation.mode ? e.navigation.mode : "view";
  },
  getPage(e) {
    return e && e.navigation && e.navigation.page ? e.navigation.page : 1;
  },
  getSort(e) {
    return e && e.navigation && e.navigation.sort ? e.navigation.sort : null;
  },
  getFilters(e) {
    return e && e.navigation && e.navigation.filters ? e.navigation.filters : null;
  },
  getExtras(e) {
    return e && e.navigation && e.navigation.extras ? e.navigation.extras : {};
  },
  getFlags(e) {
    return e && e.flags ? e.flags : {};
  },
  isDebugMode(e) {
    return !!(e && e.flags && e.flags.debugMode);
  },
  isTelemetryEnabled(e) {
    return e && e.flags && e.flags.telemetryEnabled !== !1;
  },
  getFeatureFlag(e, t) {
    return e && e.flags && e.flags.featureFlags && e.flags.featureFlags[t] ? e.flags.featureFlags[t] : !1;
  },
  getPermissionsState(e) {
    return e && e.permissions ? e.permissions : { mode: "allow-all", apiConnected: !1, lastModeChange: null, enforcement: { enabled: !1, scope: "global", domains: [], routes: [], failOpen: !0 } };
  },
  getPermissionsMode(e) {
    return e && e.permissions && e.permissions.mode ? e.permissions.mode : "allow-all";
  },
  isPermissionsEnforced(e) {
    return e && e.permissions && e.permissions.mode === "enforce";
  },
  isPermissionsApiConnected(e) {
    return !!(e && e.permissions && e.permissions.apiConnected);
  },
  getPermissionsEnforcement(e) {
    return e && e.permissions && e.permissions.enforcement ? e.permissions.enforcement : { enabled: !1, scope: "global", domains: [], routes: [], failOpen: !0, lastChange: null };
  },
  isEnforcementEnabled(e) {
    return e && e.permissions && e.permissions.enforcement && e.permissions.enforcement.enabled === !0;
  },
  getEnforcementScope(e) {
    return e && e.permissions && e.permissions.enforcement && e.permissions.enforcement.scope ? e.permissions.enforcement.scope : "global";
  },
  getEnforcementDomains(e) {
    return e && e.permissions && e.permissions.enforcement && e.permissions.enforcement.domains ? e.permissions.enforcement.domains : [];
  },
  getEnforcementRoutes(e) {
    return e && e.permissions && e.permissions.enforcement && e.permissions.enforcement.routes ? e.permissions.enforcement.routes : [];
  },
  isFailOpenEnabled(e) {
    return e && e.permissions && e.permissions.enforcement && e.permissions.enforcement.failOpen !== !1;
  },
  isEnforcedForDomain(e, t) {
    const n = d.getPermissionsEnforcement(e);
    return n.enabled ? n.scope === "global" ? !0 : n.scope === "domain" ? n.domains.indexOf(t) !== -1 : !1 : !1;
  },
  isEnforcedForRoute(e, t) {
    const n = d.getPermissionsEnforcement(e);
    if (!n.enabled) return !1;
    if (n.scope === "global") return !0;
    if (n.scope === "route")
      for (let s = 0; s < n.routes.length; s++) {
        const i = n.routes[s];
        if (t === i || t.indexOf(`${i}/`) === 0) return !0;
      }
    return !1;
  },
  getEffectivePermissionsMode(e, t) {
    const n = d.getPermissionsEnforcement(e);
    if (!n.enabled) return "allow-all";
    const s = t && t.path ? t.path : t, i = t && t.domain ? t.domain : null;
    if (n.scope === "global" || n.scope === "domain" && i && n.domains.indexOf(i) !== -1) return "enforce";
    if (n.scope === "route" && s)
      for (let a = 0; a < n.routes.length; a++) {
        const r = n.routes[a];
        if (s === r || s.indexOf(`${r}/`) === 0) return "enforce";
      }
    return "allow-all";
  },
  getAuthContext(e) {
    const t = e && e.session ? e.session : {};
    return { isAuthenticated: t.isAuthenticated || !1, userId: t.user && t.user.id ? t.user.id : t.userId || null, user: t.user || null, token: t.token || null, lastActivity: t.lastActivity || null, expiresAt: t.expiresAt || null, roles: t.roles || [], permissions: t.permissions || [] };
  },
  getFullContext(e) {
    return { isAuthenticated: d.isAuthenticated(e), userId: d.getUserId(e), user: d.getUser(e), theme: d.getTheme(e), language: d.getLanguage(e), isOnline: d.isOnline(e), isLoading: d.isLoading(e), currentRoute: d.getCurrentRoute(e), activePanel: d.getActivePanel(e), view: d.getView(e), mode: d.getNavigationMode(e), permissionsMode: d.getPermissionsMode(e), enforcementEnabled: d.isEnforcementEnabled(e) };
  },
  getVirtualRoute(e) {
    return { view: d.getView(e), tab: d.getTab(e), section: d.getSection(e), entity: d.getEntity(e), entityId: d.getEntityId(e), mode: d.getNavigationMode(e), page: d.getPage(e), sort: d.getSort(e), filters: d.getFilters(e), extras: d.getExtras(e) };
  },
  getUserRoles(e) {
    return e && e.session && e.session.roles ? e.session.roles : e && e.session && e.session.user && e.session.user.roles ? e.session.user.roles : [];
  },
  getUserCapabilities(e) {
    return e && e.session && e.session.user && e.session.user.capabilities ? e.session.user.capabilities : [];
  },
  getUserLevel(e) {
    return e && e.session && e.session.user && e.session.user.level ? e.session.user.level : 0;
  },
  info() {
    const e = [], t = Object.keys(d);
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      typeof d[s] == "function" && s !== "info" && s !== "healthCheck" && e.push(s);
    }
    return { moduleId: ae, version: le, selectorsCount: e.length, selectors: e, categories: ["session", "preferences", "app", "navigation", "flags", "permissions", "enforcement", "composed"], hasEnforcementSelectors: !0, timestamp: Date.now() };
  },
  healthCheck() {
    const e = ["getSession", "isAuthenticated", "getUserId", "getUser", "getAuthContext", "getNavigation", "getCurrentRoute", "getPermissionsMode", "getPermissionsState", "getPermissionsEnforcement", "isEnforcementEnabled", "isEnforcedForDomain", "isEnforcedForRoute", "getEffectivePermissionsMode"];
    let t = !0;
    for (let r = 0; r < e.length; r++)
      if (typeof d[e[r]] != "function") {
        t = !1;
        break;
      }
    const n = { allCriticalSelectorsExist: t, selectorsReturnCorrectTypes: !0, hasComposedSelectors: typeof d.getFullContext == "function" && typeof d.getVirtualRoute == "function", hasPermissionsSelectors: typeof d.getPermissionsMode == "function", hasEnforcementSelectors: typeof d.getPermissionsEnforcement == "function" && typeof d.isEnforcedForDomain == "function" && typeof d.isEnforcedForRoute == "function" };
    let s = 0, i = 0;
    const a = Object.keys(n);
    for (let r = 0; r < a.length; r++)
      i++, n[a[r]] && s++;
    return { status: s === i ? "HEALTHY" : "DEGRADED", score: `${s}/${i}`, healthy: s === i, checks: n, moduleId: ae, version: le, timestamp: Date.now() };
  }
}, $e = "global-state-auth-integration", Z = 5, ye = 300, q = ue({ moduleId: $e, allowWindowFallback: !0 });
let H = [];
const L = { listenersRegistered: 0, portResolutions: 0 };
function we() {
  q.isInitialized() || q.init();
  const e = q.getEventBus();
  return e && typeof e.on == "function" ? (L.portResolutions++, e) : null;
}
function $(e) {
  const t = we();
  if (!t) {
    if (e.eventBusRetryCount < Z) {
      e.eventBusRetryCount++;
      const s = ye * e.eventBusRetryCount;
      e.telemetry.track(v.INTEGRATION_RETRY_SCHEDULED, { attempt: e.eventBusRetryCount, maxRetries: Z, delayMs: s }), e._retryTimeoutId = setTimeout(() => {
        $(e);
      }, s);
    } else
      A("warn", `EventBus not available after ${Z} retries`), e.telemetry.track(v.INTEGRATION_MAX_RETRIES, { attempts: e.eventBusRetryCount });
    return;
  }
  if (e.authEventsConnected) {
    e.telemetry.track(v.INTEGRATION_ALREADY_CONNECTED, {});
    return;
  }
  const n = e.abortController.signal;
  try {
    const s = (f) => {
      var pe;
      if (n.aborted) return;
      e.telemetry.track(v.LOGIN_RECEIVED, { source: f == null ? void 0 : f.source });
      const De = { isAuthenticated: !0, userId: ((pe = f == null ? void 0 : f.user) == null ? void 0 : pe.id) || (f == null ? void 0 : f.userId), user: (f == null ? void 0 : f.user) || null, token: (f == null ? void 0 : f.token) || null, lastActivity: Date.now() };
      e.setSession(De), F(e, k.SESSION_SYNCED, { source: "login-success" });
    }, i = t.on(v.LOGIN_SUCCESS, s);
    H.push({ event: "AUTH_EVENTS.LOGIN_SUCCESS", handler: "loginHandler", registeredAt: Date.now(), cleanup: i }), L.listenersRegistered++;
    const a = (f) => {
      n.aborted || (e.telemetry.track(v.LOGOUT_RECEIVED, { source: f == null ? void 0 : f.source }), e.clearSession(), F(e, k.SESSION_CLEARED, { source: "logout" }));
    }, r = t.on(v.LOGOUT, a);
    H.push({ event: "AUTH_EVENTS.LOGOUT", handler: "handleLogout", registeredAt: Date.now(), cleanup: r }), L.listenersRegistered++;
    const c = t.on(v.LOGOUT_SUCCESS, a);
    H.push({ event: "AUTH_EVENTS.LOGOUT_SUCCESS", handler: "handleLogout", registeredAt: Date.now(), cleanup: c }), L.listenersRegistered++;
    const E = (f) => {
      n.aborted || (e.telemetry.track(v.SESSION_CHECKED_RECEIVED, { authenticated: f == null ? void 0 : f.authenticated }), f != null && f.authenticated && (f != null && f.user) ? (e.setSession({ isAuthenticated: !0, userId: f.user.id || f.userId, user: f.user, token: f.token || null, lastActivity: Date.now() }), F(e, k.SESSION_SYNCED, { source: "session-checked" })) : f != null && f.authenticated || (e.clearSession(), F(e, k.SESSION_CLEARED, { source: "session-checked-unauthenticated" })));
    }, O = t.on(v.SESSION_CHECKED, E);
    H.push({ event: "AUTH_EVENTS.SESSION_CHECKED", handler: "sessionCheckedHandler", registeredAt: Date.now(), cleanup: O }), L.listenersRegistered++;
    const p = (f) => {
      n.aborted || e.telemetry.track(v.STATE_CHANGE_RECEIVED, { state: f == null ? void 0 : f.state });
    }, w = t.on(v.STATE_CHANGED, p);
    H.push({ event: "AUTH_EVENTS.STATE_CHANGED", handler: "stateChangedHandler", registeredAt: Date.now(), cleanup: w }), L.listenersRegistered++, e.authEventsConnected = !0, e.telemetry.track(v.INTEGRATION_CONNECTED, { retriesNeeded: e.eventBusRetryCount, portsInitialized: q.isInitialized(), listenersRegistered: L.listenersRegistered });
  } catch (s) {
    if (A("error", "Auth integration error:", s), e.telemetry.track(v.INTEGRATION_ERROR, { error: s.message }), e.eventBusRetryCount < Z) {
      e.eventBusRetryCount++;
      const i = ye * e.eventBusRetryCount;
      e._retryTimeoutId = setTimeout(() => {
        $(e);
      }, i);
    }
  }
}
function Ye(e) {
  e.authEventsConnected = !1, e.eventBusRetryCount = 0, e._retryTimeoutId && (clearTimeout(e._retryTimeoutId), e._retryTimeoutId = null), $(e);
}
function F(e, t, n) {
  n || (n = {});
  const s = we();
  if (s && typeof s.emit == "function")
    try {
      s.emit(t, Object.assign({}, n, { source: e.moduleId }));
    } catch (i) {
      A("warn", "EventBus emit failed:", i);
    }
  try {
    window.dispatchEvent(new CustomEvent(t, { detail: n }));
  } catch {
  }
}
function Ke(e) {
  const t = e.abortController.signal;
  window.addEventListener("online", () => {
    e.store.dispatch(e.actions.setOnlineStatus(!0));
  }, { signal: t }), window.addEventListener("offline", () => {
    e.store.dispatch(e.actions.setOnlineStatus(!1));
  }, { signal: t }), document.addEventListener("visibilitychange", () => {
    document.visibilityState === "visible" ? e.telemetry.track(ge.VISIBLE, {}) : e.telemetry.track(ge.HIDDEN, {});
  }, { signal: t });
}
function Ze(e) {
  const t = "global-state-styles";
  if (document.getElementById(t)) return;
  const n = document.createElement("link");
  n.id = t, n.rel = "stylesheet", n.href = "/modules/global-state/styles.css", document.head.appendChild(n), e._styleElement = n;
}
let o = null;
function Je(e) {
  o = e, window.__dev = window.__dev || {}, window.__dev.globalState = {
    getVersion() {
      return _;
    },
    info() {
      return e.info();
    },
    healthCheck() {
      return e.healthCheck();
    },
    getState() {
      return e.store.getState();
    },
    getSession() {
      return e.store.select(e.selectors.getSession);
    },
    getAuthContext() {
      return e.store.select(e.selectors.getAuthContext);
    },
    getSubscriberCount() {
      return e.store.getSubscriberCount();
    },
    getEventLog() {
      return e.telemetry.getEventLog();
    },
    getRecentEvents(t) {
      return e.telemetry.getRecentEvents(t);
    },
    getTrackerStats() {
      return e.telemetry.getTrackerStats();
    },
    retryAuthIntegration() {
      return e.retryAuthIntegration();
    },
    exportState() {
      return e.store.exportState();
    },
    debug: e.debug
  };
}
const We = {
  getState() {
    return o ? o.store.getState() : null;
  },
  dispatch(e) {
    return o ? o.store.dispatch(e) : null;
  },
  subscribe(e, t, n) {
    return o ? o.store.subscribe(e, t, n) : null;
  },
  select(e) {
    return o ? o.store.select(e) : null;
  },
  get(e) {
    return o ? o.store.get(e) : null;
  },
  has(e) {
    return o ? o.store.has(e) : !1;
  },
  onChange(e, t, n) {
    return o ? o.store.onChange(e, t, n) : null;
  },
  get actions() {
    return o ? o.actions : null;
  },
  get selectors() {
    return o ? o.selectors : null;
  },
  getSession() {
    return o ? o.store.select(o.selectors.getSession) : null;
  },
  getUser() {
    return o ? o.store.select(o.selectors.getUser) : null;
  },
  getUserId() {
    return o ? o.store.select(o.selectors.getUserId) : null;
  },
  getAuthContext() {
    return o ? o.store.select(o.selectors.getAuthContext) : null;
  },
  isAuthenticated() {
    return o ? o.store.select(o.selectors.isAuthenticated) : !1;
  },
  getNavigation() {
    return o ? o.store.select(o.selectors.getNavigation) : null;
  },
  getCurrentRoute() {
    return o ? o.store.select(o.selectors.getCurrentRoute) : null;
  },
  getActivePanel() {
    return o ? o.store.select(o.selectors.getActivePanel) : null;
  },
  getVirtualRoute() {
    return o ? o.store.select(o.selectors.getVirtualRoute) : null;
  },
  getPreferences() {
    return o ? o.store.select(o.selectors.getPreferences) : null;
  },
  getTheme() {
    return o ? o.store.select(o.selectors.getTheme) : null;
  },
  isLoading() {
    return o ? o.store.select(o.selectors.isLoading) : !1;
  },
  isOnline() {
    return o ? o.store.select(o.selectors.isOnline) : !1;
  },
  version: _,
  info() {
    return o ? o.info() : null;
  },
  healthCheck() {
    return o ? o.healthCheck() : null;
  }
};
function qe() {
  o = null, window.__dev && delete window.__dev.globalState;
}
function Xe(e) {
  const t = { initialized: e.isInitialized, authEventsConnected: e.authEventsConnected, eventBusRetryCount: e.eventBusRetryCount, version: _ }, n = e.store.healthCheck();
  return Object.assign({}, t, n);
}
function Qe(e) {
  const t = e.store.healthCheck(), n = e.store.getSubscriberCount(), s = {
    initialized: e.isInitialized,
    storeHealthy: t.healthy,
    authEventsConnected: e.authEventsConnected,
    eventBusAvailable: t.checks && t.checks.hasEventBus ? t.checks.hasEventBus : !1,
    subscribersHealthy: n < 50,
    sessionValid: t.checks && t.checks.sessionValid ? t.checks.sessionValid : !1
  };
  let i = 0, a = 0;
  const r = Object.keys(s);
  for (let E = 0; E < r.length; E++)
    a++, s[r[E]] && i++;
  return { status: i === a ? "HEALTHY" : i >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${a}`, healthy: i >= 5, checks: s, storeHealth: t, version: _, moduleId: x, subscriberCount: n, p24Instrumented: !0, timestamp: Date.now() };
}
function et(e) {
  const n = e.getState().session || {};
  return {
    moduleId: x,
    version: _,
    isInitialized: e.isInitialized,
    authEventsConnected: e.authEventsConnected,
    eventBusRetryCount: e.eventBusRetryCount,
    authEventsSource: "/core/runtime/events/index.js",
    contractsSource: "./api/contracts.js",
    subscriberCount: e.store.getSubscriberCount(),
    session: { isAuthenticated: n.isAuthenticated || !1, hasUser: !!n.user, hasUserId: !!n.userId },
    eventBusConnected: !!e.store.eventBus,
    storeInfo: e.store.info(),
    telemetryStats: e.telemetry.getTrackerStats(),
    subModules: { contracts: Y.VERSION, store: "GlobalStateStore", actions: P.VERSION, selectors: d.VERSION, validators: R.VERSION, middleware: N.VERSION, telemetry: Ee.VERSION },
    p24Instrumented: !0,
    timestamp: Date.now()
  };
}
function tt(e) {
  return {
    getAuthEvents() {
      return v;
    },
    getGlobalStateEvents() {
      return k;
    },
    getState() {
      return e.getState();
    },
    getSession() {
      return e.select(e.selectors.getSession);
    },
    getAuthContext() {
      return e.select(e.selectors.getAuthContext);
    },
    getEventLog() {
      return e.telemetry.getEventLog();
    },
    getRecentEvents(t) {
      return e.telemetry.getRecentEvents(t);
    },
    retryAuthIntegration() {
      return e.retryAuthIntegration();
    }
  };
}
function u() {
  this.store = Ge, this.actions = P, this.selectors = d, this.validators = R, this.middleware = N, this.telemetry = Ee, this.contracts = Y, this.isInitialized = !1, this.abortController = null, this.authEventsConnected = !1, this.eventBusRetryCount = 0, this._retryTimeoutId = null, this._styleElement = null;
}
Object.defineProperty(u.prototype, "version", { get() {
  return _;
} });
Object.defineProperty(u.prototype, "name", { get() {
  return x;
} });
Object.defineProperty(u.prototype, "moduleId", { get() {
  return x;
} });
Object.defineProperty(u.prototype, "AUTH_EVENTS", { get() {
  return v;
} });
Object.defineProperty(u.prototype, "GLOBAL_STATE_EVENTS", { get() {
  return k;
} });
u.prototype.getVersion = () => _;
u.prototype.init = function(e) {
  if (e = e || {}, typeof window > "u" || typeof document > "u")
    return A("warn", "No window/document - running in no-op mode"), this;
  if (this.isInitialized)
    return A("warn", "Already initialized"), this;
  const t = Ne();
  return t.valid || A("error", "Event contracts validation failed:", t.missing), this.abortController = new AbortController(), this.store.init({ debug: e.debug || !1, telemetryEnabled: e.telemetry !== !1, useDefaultMiddlewares: !0, initialState: e.initialState || null }), Ze(this), Je(this), Ke(this), $(this), this.debug = tt(this), this.isInitialized = !0, this.telemetry.track(k.INIT_COMPLETE, { options: e, version: _, authEventsConnected: this.authEventsConnected }), F(this, k.INIT_COMPLETE, { version: _, authEventsConnected: this.authEventsConnected }), A("info", `Manager v${_} initialized`), this;
};
u.prototype.getState = function() {
  return this.store.getState();
};
u.prototype.dispatch = function(e) {
  return this.store.dispatch(e);
};
u.prototype.subscribe = function(e, t, n = {}) {
  return this.store.subscribe(e, t, n);
};
u.prototype.select = function(e) {
  return this.store.select(e);
};
u.prototype.get = function(e) {
  return this.store.get(e);
};
u.prototype.has = function(e) {
  return this.store.has(e);
};
u.prototype.onChange = function(e, t, n = {}) {
  return this.store.onChange(e, t, n);
};
u.prototype.setSession = function(e) {
  return this.dispatch(this.actions.setSession(e));
};
u.prototype.clearSession = function() {
  return this.dispatch(this.actions.clearSession());
};
u.prototype.updatePreferences = function(e) {
  return this.dispatch(this.actions.updatePreferences(e));
};
u.prototype.setLoading = function(e) {
  return this.dispatch(this.actions.setLoading(e));
};
u.prototype.setMaintenanceMode = function(e) {
  return this.dispatch(this.actions.setMaintenanceMode(e));
};
u.prototype.updateNavigation = function(e) {
  return this.dispatch(this.actions.updateNavigation(e));
};
u.prototype.setFlag = function(e, t) {
  return this.dispatch(this.actions.setFlag(e, t));
};
u.prototype.reset = function() {
  return this.store.reset();
};
u.prototype.clear = function() {
  return this.store.reset();
};
u.prototype.useMiddleware = function(e) {
  return this.middleware.use(e), this;
};
u.prototype.setupAuthEventIntegration = function() {
  return $(this);
};
u.prototype.retryAuthIntegration = function() {
  return Ye(this);
};
u.prototype.emit = function(e, t = {}) {
  return F(this, e, t);
};
u.prototype.getStatus = function() {
  return Xe(this);
};
u.prototype.healthCheck = function() {
  return Qe(this);
};
u.prototype.info = function() {
  return et(this);
};
u.prototype.getEventLog = function() {
  return this.telemetry.getEventLog();
};
u.prototype.getRecentEvents = function(e) {
  return this.telemetry.getRecentEvents(e);
};
u.prototype.clearEventLog = function() {
  return this.telemetry.clearEventLog();
};
u.prototype.getTrackerStats = function() {
  return this.telemetry.getTrackerStats();
};
u.prototype.exportState = function() {
  return this.store.exportState();
};
u.prototype.getTelemetry = function() {
  return this.telemetry.export();
};
u.prototype.destroy = function() {
  this.isInitialized && (this._retryTimeoutId && (clearTimeout(this._retryTimeoutId), this._retryTimeoutId = null), this.abortController && (this.abortController.abort(), this.abortController = null), this.store.destroy(), this._styleElement && this._styleElement.parentNode && (this._styleElement.parentNode.removeChild(this._styleElement), this._styleElement = null), this.isInitialized = !1, this.authEventsConnected = !1, this.eventBusRetryCount = 0, qe(), F(this, k.DESTROYED, {}), A("info", "Manager destroyed"));
};
u.prototype.shutdown = function() {
  return this.destroy();
};
function ot() {
  return We;
}
function at() {
  return nt;
}
const nt = new u();
export {
  ut as AUTH_EVENTS,
  dt as GLOBAL_STATE_EVENTS,
  Y as GlobalStateContracts,
  We as GlobalStateFacade,
  u as GlobalStateManager,
  Ee as GlobalStateTelemetry,
  x as MODULE_ID,
  P as StateActions,
  N as StateMiddleware,
  d as StateSelectors,
  R as StateValidators,
  _ as VERSION,
  nt as default,
  ot as getGlobalState,
  at as getGlobalStateManager
};
