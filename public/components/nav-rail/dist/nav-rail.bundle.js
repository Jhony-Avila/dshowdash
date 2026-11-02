import { isStrict as Wn, recordViolation as Qn } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts as $e, createUiPorts as de } from "/core/runtime/ports-profiles.js";
import { findRegion as Kn, REGION_IDS as Zn } from "/platform/shell/layout-regions.js";
import { UI_EVENTS as ae, NAVRAIL_INTENTS as H, NAV_EVENTS as Ge, ROUTER_EVENTS as Jn } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import * as Xn from "/core/runtime/constants/navrail-handler.js";
const xe = "nav-rail", Ne = (e) => (t, ...n) => {
  const o = e("logger");
  if (!o) return;
  const i = o[t] || o.info;
  typeof i == "function" && i(`[${xe}]`, ...n);
};
let un = () => {
};
function eo(e) {
  un = e;
}
const ne = {
  _failures: {},
  _thresholds: { maxFailures: 3, resetTimeout: 3e4 },
  isOpen(e) {
    const t = this._failures[e];
    return t && t.failures >= this._thresholds.maxFailures ? Date.now() - t.lastFailure > this._thresholds.resetTimeout ? (this.reset(e), !1) : !0 : !1;
  },
  recordFailure(e, t) {
    this._failures[e] || (this._failures[e] = { failures: 0, lastFailure: 0, errors: [] }), this._failures[e].failures++, this._failures[e].lastFailure = Date.now(), this._failures[e].errors.push({ message: (t == null ? void 0 : t.message) || String(t), time: Date.now() }), this._failures[e].errors.length > 5 && this._failures[e].errors.shift(), un("warn", `Circuit breaker: ${e} failure #${this._failures[e].failures}`, { error: t == null ? void 0 : t.message });
  },
  recordSuccess(e) {
    this._failures[e] && (this._failures[e].failures = Math.max(0, this._failures[e].failures - 1));
  },
  reset(e) {
    e ? delete this._failures[e] : this._failures = {};
  },
  async execute(e, t, n) {
    if (this.isOpen(e)) {
      if (n) return n();
      throw new Error("Circuit breaker is open for: " + e);
    }
    try {
      const o = await t();
      return this.recordSuccess(e), o;
    } catch (o) {
      if (this.recordFailure(e, o), n) return n();
      throw o;
    }
  },
  getMetrics() {
    let e = 0, t = 0;
    for (const [n, o] of Object.entries(this._failures))
      e += o.failures, this.isOpen(n) && t++;
    return { trackedServices: Object.keys(this._failures).length, openCircuits: t, totalFailures: e };
  },
  healthCheck() {
    const e = this.getMetrics();
    return {
      status: e.openCircuits === 0 ? "HEALTHY" : e.openCircuits < 3 ? "DEGRADED" : "UNHEALTHY",
      moduleId: "navrail-core-circuit-breaker",
      checks: e,
      timestamp: Date.now()
    };
  },
  info() {
    return { moduleId: "navrail-core-circuit-breaker", metrics: this.getMetrics(), status: this.getStatus() };
  },
  getStatus() {
    const e = {};
    for (const [t, n] of Object.entries(this._failures))
      e[t] = {
        isOpen: this.isOpen(t),
        failures: n.failures,
        lastFailure: n.lastFailure,
        recentErrors: n.errors.slice(-3)
      };
    return e;
  },
  destroy() {
    for (const e of Object.keys(this._failures)) this.reset(e);
  }
};
let It = () => {
};
function to(e) {
  It = e;
}
const tt = {
  async execute(e, t = {}) {
    const { maxAttempts: n = 3, baseDelay: o = 1e3, maxDelay: i = 1e4, serviceName: r = "unknown" } = t;
    if (ne.isOpen(r))
      throw It("warn", `Circuit open for ${r}, using fallback`), new Error(`Circuit breaker open for ${r}`);
    let a;
    for (let s = 1; s <= n; s++)
      try {
        const c = await e();
        return ne.recordSuccess(r), c;
      } catch (c) {
        if (a = c, ne.recordFailure(r, c), s < n) {
          const q = Math.min(o * Math.pow(2, s - 1), i);
          It("warn", `${r} attempt ${s}/${n} failed, retrying in ${q}ms`, { error: c.message }), await new Promise((d) => setTimeout(d, q));
        }
      }
    throw a;
  }
}, Ye = "navrail-telemetry", Ht = "5.1.0-ES6", no = typeof window < "u", pt = $e({ moduleId: Ye });
function ze(e) {
  return pt.get(e);
}
const Ce = function(e) {
  const t = ze("logger");
  if (!t) return;
  const n = Array.prototype.slice.call(arguments, 1), o = t[e] || t.info;
  typeof o == "function" && o.apply(t, [`[${Ye}]`].concat(n));
}, x = { _namespace: "navrail", _startTime: null, _events: [], _maxEvents: 100, _initialized: !1, _metrics: { totalEvents: 0, renders: 0, clicks: 0, modeChanges: 0, errors: 0 }, init() {
  return this._initialized ? this : (this._startTime = Date.now(), this._events = [], this._initialized = !0, this.track("init"), Ce("debug", "Tracker initialized"), this);
}, track(e, t) {
  t || (t = {}), this._initialized || this.init();
  const n = Object.assign({ event: `${this._namespace}:${e}`, timestamp: Date.now() }, t);
  this._events.push(n), this._events.length > this._maxEvents && this._events.shift(), this._metrics.totalEvents++, this._updateMetricsByEvent(e);
  const o = ze("telemetry");
  o && o.track && o.track(n.event, t), Ce("debug", `Event: ${e}`, t);
}, _updateMetricsByEvent(e) {
  e.indexOf("render") !== -1 ? this._metrics.renders++ : e.indexOf("click") !== -1 ? this._metrics.clicks++ : e.indexOf("mode") !== -1 ? this._metrics.modeChanges++ : e.indexOf("error") !== -1 && this._metrics.errors++;
}, rendered() {
  this.track("render:complete", { duration: Date.now() - this._startTime });
}, ready() {
  this.track("ready", { bootTime: Date.now() - this._startTime });
}, modeChange(e) {
  this.track(`mode:${e}`, { mode: e });
}, buttonClick(e, t) {
  t || (t = {}), this.track("button:click", Object.assign({ buttonId: e }, t));
}, error(e, t) {
  t || (t = {}), this.track("error", Object.assign({ message: e && e.message ? e.message : String(e) }, t)), Ce("error", "Tracked error", Object.assign({ error: e && e.message ? e.message : e }, t));
}, getEvents() {
  return this._events.slice();
}, getRecentEvents(e) {
  return e || (e = 10), this._events.slice(-e);
}, getMetrics() {
  return Object.assign({}, this._metrics, { startTime: this._startTime, uptime: this._startTime ? Date.now() - this._startTime : 0, eventCount: this._events.length, bufferUsage: `${this._events.length}/${this._maxEvents}` });
}, clearEvents() {
  return this._events = [], Ce("debug", "Events cleared"), this;
}, destroy() {
  return this.track("destroyed"), this._events = [], this._initialized = !1, this._startTime = null, Ce("debug", "Tracker destroyed"), this;
}, healthCheck() {
  const e = pt.snapshot(), t = ze("logger"), n = ze("telemetry"), o = { initialized: this._initialized, hasStartTime: !!this._startTime, bufferHealthy: this._events.length < this._maxEvents * 0.9, lowErrorRate: this._metrics.totalEvents === 0 || this._metrics.errors / this._metrics.totalEvents < 0.1, loggerAvailable: !!t, telemetryAvailable: !!n, portsInitialized: e._initialized }, i = Object.values(o).filter(Boolean).length, r = Object.keys(o).length;
  return { status: i === r ? "HEALTHY" : i >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${i}/${r}`, checks: o, metrics: this.getMetrics(), version: Ht, moduleId: Ye, portsInitialized: e._initialized, timestamp: Date.now() };
}, info() {
  const e = pt.snapshot();
  return { moduleId: Ye, version: Ht, initialized: this._initialized, namespace: this._namespace, maxEvents: this._maxEvents, currentEvents: this._events.length, metrics: this.getMetrics(), recentEvents: this.getRecentEvents(5).map((t) => t.event), portsInitialized: e._initialized, timestamp: Date.now() };
} };
no && (window.NavRailTracker = x);
let Oe = () => {
};
function oo(e) {
  Oe = e;
}
const ve = {
  _recoveryAttempts: 0,
  _maxRecoveryAttempts: 3,
  _recoveryDelay: 5e3,
  _isRecovering: !1,
  _lastRecoveryTime: 0,
  async attemptRecovery(e) {
    if (this._isRecovering)
      return Oe("debug", "Recovery already in progress"), !1;
    if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
      if (Date.now() - this._lastRecoveryTime < 6e4)
        return Oe("error", "Max recovery attempts reached, waiting cooldown"), !1;
      this._recoveryAttempts = 0;
    }
    this._isRecovering = !0, this._recoveryAttempts++, this._lastRecoveryTime = Date.now(), Oe("info", `Starting recovery attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`), x.track("recovery:start", { attempt: this._recoveryAttempts });
    try {
      await e.destroy(), await new Promise((n) => setTimeout(n, this._recoveryDelay));
      const t = Kn(Zn.NAV_RAIL);
      if (t)
        return await e.init(t), Oe("info", "Recovery successful"), x.track("recovery:success", { attempt: this._recoveryAttempts }), this._recoveryAttempts = 0, this._isRecovering = !1, !0;
      throw new Error("Root element not found for recovery");
    } catch (t) {
      return Oe("error", "Recovery failed", { error: t.message, attempt: this._recoveryAttempts }), x.track("recovery:failed", { attempt: this._recoveryAttempts, error: t.message }), this._isRecovering = !1, !1;
    }
  },
  getStatus() {
    return {
      isRecovering: this._isRecovering,
      attempts: this._recoveryAttempts,
      maxAttempts: this._maxRecoveryAttempts,
      lastRecoveryTime: this._lastRecoveryTime
    };
  },
  reset() {
    this._recoveryAttempts = 0, this._isRecovering = !1, this._lastRecoveryTime = 0;
  }
}, io = "navrail-registry-cache", ro = "4.2.0-ES6";
let ke = null;
function so(e) {
  ke = e;
}
const W = function(e) {
  if (!ke) return;
  const t = Array.prototype.slice.call(arguments, 1), n = ke[e] || ke.info;
  typeof n == "function" && n.apply(ke, [`[${io}]`].concat(t));
}, J = {
  DB_NAME: "NavRailDB",
  STORE_NAME: "registry",
  DB_VERSION: 1,
  _db: null,
  _initialized: !1,
  init() {
    const e = this;
    return this._initialized ? Promise.resolve(this._db) : typeof indexedDB > "u" ? (W("warn", "IndexedDB not available"), Promise.resolve(null)) : new Promise((t, n) => {
      const o = indexedDB.open(e.DB_NAME, e.DB_VERSION);
      o.onerror = () => {
        W("error", "IndexedDB open failed", { error: o.error }), t(null);
      }, o.onsuccess = () => {
        e._db = o.result, e._initialized = !0, W("debug", "IndexedDB initialized"), t(e._db);
      }, o.onupgradeneeded = (i) => {
        const r = i.target.result;
        r.objectStoreNames.contains(e.STORE_NAME) || (r.createObjectStore(e.STORE_NAME, { keyPath: "id" }), W("info", "IndexedDB store created"));
      };
    });
  },
  save(e, t) {
    const n = this;
    return this._db ? this._doSave(e, t) : this.init().then(() => n._doSave(e, t));
  },
  _doSave(e, t) {
    const n = this;
    return this._db ? new Promise((o) => {
      try {
        const r = n._db.transaction(n.STORE_NAME, "readwrite").objectStore(n.STORE_NAME), a = {
          id: "navrail-registry",
          data: e,
          timestamp: Date.now(),
          version: t || ro
        }, s = r.put(a);
        s.onsuccess = () => {
          W("debug", "Registry saved to IndexedDB"), o(!0);
        }, s.onerror = () => {
          W("warn", "IndexedDB save failed", { error: s.error }), o(!1);
        };
      } catch (i) {
        W("warn", "IndexedDB save exception", { error: i.message }), o(!1);
      }
    }) : Promise.resolve(!1);
  },
  load() {
    const e = this;
    return this._db ? this._doLoad() : this.init().then(() => e._doLoad());
  },
  _doLoad() {
    const e = this;
    return this._db ? new Promise((t) => {
      try {
        const i = e._db.transaction(e.STORE_NAME, "readonly").objectStore(e.STORE_NAME).get("navrail-registry");
        i.onsuccess = () => {
          const r = i.result;
          r && r.data ? (W("debug", "Registry loaded from IndexedDB", { age: `${Date.now() - r.timestamp}ms` }), t(r)) : t(null);
        }, i.onerror = () => {
          W("warn", "IndexedDB load failed", { error: i.error }), t(null);
        };
      } catch (n) {
        W("warn", "IndexedDB load exception", { error: n.message }), t(null);
      }
    }) : Promise.resolve(null);
  },
  clear() {
    const e = this;
    return this._db ? new Promise((t) => {
      try {
        const i = e._db.transaction(e.STORE_NAME, "readwrite").objectStore(e.STORE_NAME).delete("navrail-registry");
        i.onsuccess = () => {
          t(!0);
        }, i.onerror = () => {
          t(!1);
        };
      } catch {
        t(!1);
      }
    }) : Promise.resolve(!1);
  },
  getStatus() {
    return {
      initialized: this._initialized,
      hasDB: !!this._db,
      dbName: this.DB_NAME,
      storeName: this.STORE_NAME
    };
  }
}, dn = "navrail-registry-state", ao = de({ moduleId: dn });
function lo(e) {
  return ao.get(e);
}
const co = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), n = `[${dn}]`, o = lo("logger");
  o && typeof o[e] == "function" ? o[e].apply(o, [n].concat(t)) : console.debug.apply(console, [n].concat(t));
};
let G = [], z = [], he = [], ye = {}, nt = 0, ot = !1, hn = !1, it = 0, rt = null;
const qe = /* @__PURE__ */ new Set();
let Le = [], At = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: !1 };
const fn = 5 * 60 * 1e3, uo = 24 * 60 * 60 * 1e3;
function jt(e) {
  G = e;
}
function Gt(e) {
  z = e;
}
function Yt(e) {
  he = e;
}
function qt(e) {
  ye = e;
}
function Wt(e) {
  nt = e;
}
function Qt(e) {
  ot = e;
}
function ge(e) {
  hn = e;
}
function ft(e) {
  it = e;
}
function Kt(e) {
  rt = e;
}
function Se(e) {
  Object.assign(At, e);
}
function ho(e) {
  Le.push(e), Le.length > 10 && Le.shift();
}
function fo() {
  return G.slice().sort((e, t) => (e.order || 0) - (t.order || 0));
}
function go() {
  return z.slice();
}
function mo(e) {
  return z.filter((t) => t.group === e && !t.hidden).sort((t, n) => (t.order || 0) - (n.order || 0));
}
function _o(e) {
  return z.find((t) => t.id === e) || null;
}
function Io() {
  return he.map((e) => z.find((t) => t.id === e)).filter(Boolean);
}
function gn() {
  return he.slice();
}
function mn(e) {
  return e ? ye[e] : Object.assign({}, ye);
}
function _n() {
  return nt;
}
function Q() {
  return ot;
}
function po() {
  return hn;
}
function In() {
  return it;
}
function Eo() {
  return rt;
}
function K() {
  return Object.assign({}, At);
}
function Oo() {
  return Le.slice(-10);
}
function me() {
  return G;
}
function _e() {
  return z;
}
function pn() {
  return he;
}
function vo(e) {
  return typeof e == "function" && qe.add(e), () => {
    qe.delete(e);
  };
}
function yo(e) {
  qe.delete(e);
}
function we() {
  qe.forEach((e) => {
    try {
      e({ groups: G, items: z, mobileItems: he });
    } catch (t) {
      co("error", "Subscriber error", t);
    }
  });
}
function Do(e) {
  if (!e || !e.id) return !1;
  const t = z.findIndex((n) => n.id === e.id);
  return t >= 0 ? z[t] = Object.assign({}, z[t], e) : z.push(e), we(), !0;
}
function To(e) {
  if (!e || !e.id) return !1;
  const t = G.findIndex((n) => n.id === e.id);
  return t >= 0 ? G[t] = Object.assign({}, G[t], e) : G.push(e), we(), !0;
}
function En() {
  G = [], z = [], he = [], ye = {}, ot = !1, it = 0, rt = null;
}
function bo() {
  En(), At = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: !1 }, Le = [];
}
function $o() {
  return { groups: G, items: z, mobileItems: he, config: ye, userLevel: nt };
}
function No(e) {
  e && (G = e.groups || [], z = e.items || [], he = e.mobileItems || [], ye = e.config || {}, nt = e.userLevel || 0, ot = !0, it = Date.now(), rt = Date.now());
}
const Mo = [
  { id: "operations", label: "Operações", order: 1 },
  { id: "analytics", label: "Analytics", order: 2 },
  { id: "data", label: "Dados", order: 3 },
  { id: "integrations", label: "Integrações", order: 4 },
  { id: "admin", label: "Admin", order: 5 },
  { id: "system", label: "Sistema", order: 99 }
], Ao = "nav-rail.registry.items";
de({ moduleId: Ao });
const st = [
  { id: "home", icon: "home", label: "Home", group: "operations", intentId: "navrail.open.home", route: "#/home", panelId: "panel-dashboard", order: 0, eager: !0, componentPath: "home" },
  { id: "dashboard", icon: "grid", label: "Dashboard", group: "operations", intentId: "navrail.open.dashboard", route: "#/dashboard", panelId: "panel-dashboard", order: 1, eager: !0, componentPath: "dashboard" },
  { id: "financeiro", icon: "dollar-sign", label: "Financeiro", group: "operations", intentId: "navrail.open.financeiro", route: "#/financeiro", panelId: "panel-09", order: 2, eager: !0, componentPath: "financeiro" },
  { id: "comercial", icon: "briefcase", label: "Comercial", group: "operations", intentId: "navrail.open.comercial", route: "#/comercial", panelId: "panel-04", order: 3, eager: !0, componentPath: "comercial" },
  { id: "clientes", icon: "users", label: "Clientes", group: "operations", intentId: "navrail.open.clientes", route: "#/clientes", panelId: "panel-03", order: 4, eager: !0, componentPath: "clientes" },
  { id: "analytics", icon: "bar-chart-2", label: "Analytics", group: "analytics", intentId: "navrail.open.analytics", route: "#/analytics", panelId: "panel-analytics", order: 1, eager: !0, componentPath: "analytics" },
  { id: "relatorios", icon: "file-text", label: "Relatórios", group: "analytics", intentId: "navrail.open.relatorios", route: "#/relatorios", panelId: "panel-19", order: 2, eager: !1, componentPath: "relatorios" },
  { id: "charts", icon: "trending-up", label: "Gráficos", group: "analytics", intentId: "navrail.open.charts", route: "#/charts", panelId: "panel-charts", order: 3, eager: !1, componentPath: "charts" },
  { id: "database", icon: "database", label: "Banco de Dados", group: "data", intentId: "navrail.open.database", route: "#/database", panelId: "panel-datahub", order: 1, eager: !1, componentPath: "database" },
  { id: "folder", icon: "folder", label: "Arquivos", group: "data", intentId: "navrail.open.folder", route: "#/folder", panelId: "panel-files", order: 2, eager: !1, componentPath: "folder" },
  { id: "docs", icon: "book-open", label: "Documentos", group: "data", intentId: "navrail.open.docs", route: "#/docs", panelId: "panel-dashboard", order: 3, eager: !1, componentPath: "docs" },
  { id: "api", icon: "zap", label: "API", group: "integrations", intentId: "navrail.open.api", route: "#/api", panelId: "panel-observability", order: 1, eager: !1, componentPath: "api" },
  { id: "pipedrive", icon: "target", label: "Pipedrive", group: "integrations", intentId: "navrail.open.pipedrive", route: "#/pipedrive", panelId: "panel-18", order: 2, eager: !1, componentPath: "pipedrive" },
  { id: "location", icon: "map-pin", label: "Localizações", group: "integrations", intentId: "navrail.open.location", route: "#/location", panelId: "panel-location", order: 3, eager: !1, componentPath: "location" },
  { id: "admin-users", icon: "user-cog", label: "Usuários", group: "admin", intentId: "navrail.open.admin-users", route: "#/admin-users", panelId: "panel-user-management", order: 1, eager: !1, componentPath: "admin-users" },
  { id: "admin-settings", icon: "settings", label: "Configurações", group: "admin", intentId: "navrail.open.admin-settings", route: "#/admin-settings", panelId: "panel-footer-settings", order: 2, eager: !1, componentPath: "admin-settings" },
  { id: "code", icon: "code", label: "Código", group: "admin", intentId: "navrail.open.code", route: "#/code", panelId: "panel-code", order: 3, eager: !1, componentPath: "code" },
  { id: "header-admin", icon: "layout", label: "Header Admin", group: "admin", intentId: "navrail.open.header-admin", route: "#/header-admin", panelId: "panel-header-admin", order: 4, eager: !1, componentPath: "header-admin" },
  { id: "navrail-admin", icon: "navigation", label: "NavRail Admin", group: "admin", intentId: "navrail.open.navrail-admin", route: "#/navrail-admin", panelId: "panel-navrail-admin", order: 5, eager: !1, componentPath: "navrail-admin" },
  { id: "uarps-monitor", icon: "shield", label: "UARPS Monitor", group: "admin", intentId: "navrail.open.uarps-monitor", route: "#/uarps-monitor", panelId: "panel-uarps-monitor", order: 6, eager: !1, componentPath: "uarps-monitor" },
  { id: "bell", icon: "bell", label: "Notificações", group: "system", intentId: "navrail.open.bell", route: "#/bell", panelId: "panel-user-notifications", order: 1, eager: !1, componentPath: "bell" },
  { id: "help", icon: "help-circle", label: "Ajuda", group: "system", intentId: "navrail.open.help", route: "#/help", panelId: "panel-dashboard", order: 2, eager: !1, componentPath: "help" },
  { id: "toggle-sidebar", icon: "sidebar", label: "Sidebar", group: "system", intentId: "navrail.toggle.sidebar", route: null, panelId: null, actionType: "toggleSidebar", action: "sidebar.toggle", order: 99, eager: !1, componentPath: "toggle-sidebar" }
], Co = ["home", "dashboard", "financeiro", "analytics", "bell", "toggle-sidebar"];
function On(e) {
  return st.find((t) => t.id === e) || null;
}
function So() {
  return st.filter((e) => e.eager === !0).map((e) => e.id);
}
function ko(e) {
  const t = On(e);
  return t ? t.componentPath : null;
}
function Lo(e) {
  const t = On(e);
  return t ? t.eager === !0 : !1;
}
function wo(e) {
  return e.groups && e.items ? Ro(e) : e.navigation && Array.isArray(e.navigation) ? Bo(e) : { groups: [], items: [], mobileItems: [], config: e.config || {}, userLevel: e.userLevel || 0 };
}
function Ro(e) {
  const t = (e.groups || []).map((o) => ({
    id: o.id,
    label: o.label,
    description: o.description,
    icon: o.icon,
    order: o.order || 0,
    position: o.position || "top",
    isCollapsible: o.isCollapsible || !1,
    minLevel: o.minLevel || 0,
    _raw: o
  })), n = (e.items || []).map((o) => {
    const i = o.action || {}, r = o.panelId || i.panelId || null, a = o.route || i.route || null, s = o.intentId || `navrail.open.${o.id}`;
    return {
      id: o.id,
      icon: o.icon,
      label: o.label,
      tooltip: o.tooltip || o.label,
      group: o.group,
      intentId: s,
      route: a,
      panelId: r,
      action: { type: i.type || "openPanel", panelId: r, route: a },
      order: o.order || 0,
      hidden: !1,
      showOnMobile: o.showOnMobile !== !1,
      showOnTablet: o.showOnTablet !== !1,
      showOnDesktop: o.showOnDesktop !== !1,
      minLevel: o.minLevel || 0,
      badge: o.badge ? { type: o.badge.type, source: o.badge.source } : null,
      config: o.config || null,
      _raw: o
    };
  });
  return { groups: t, items: n, mobileItems: e.mobileItems || [], config: e.config || {}, userLevel: e.userLevel || 0, preferences: e.preferences || {} };
}
function Bo(e) {
  const t = e.navigation || [], n = e.preferences || {}, o = {}, i = [];
  t.forEach((s) => {
    if (s.is_active === !1) return;
    let c = "main";
    s.sort_order >= 99 ? c = "bottom" : s.sort_order >= 10 && (c = "tools"), o[c] || (o[c] = { id: c, label: c === "main" ? "Principal" : c === "tools" ? "Ferramentas" : "Ações", order: c === "main" ? 0 : c === "tools" ? 50 : 99, position: c === "bottom" ? "bottom" : "top" });
    const q = {
      id: s.nav_key || `item-${s.id}`,
      icon: s.icon || "circle",
      label: s.label || s.nav_key || "Item",
      tooltip: s.label || s.nav_key,
      group: c,
      intentId: `navrail.open.${s.nav_key || s.id}`,
      route: s.route ? `#/${s.nav_key}` : null,
      panelId: s.route || null,
      action: s.route ? { type: "openPanel", panelId: s.route } : null,
      order: s.sort_order || 0,
      hidden: !1,
      showOnMobile: !0,
      showOnTablet: !0,
      showOnDesktop: !0,
      minLevel: s.min_level || 0,
      badge: s.badge_type !== "none" ? { type: s.badge_type, endpoint: s.badge_endpoint } : null,
      _raw: s
    };
    i.push(q), s.children && s.children.length > 0 && s.children.forEach((d) => {
      if (d.is_active === !1) return;
      const qn = {
        id: d.nav_key || `item-${d.id}`,
        icon: d.icon || "circle",
        label: d.label || d.nav_key || "Item",
        tooltip: d.label || d.nav_key,
        group: c,
        parentId: s.nav_key,
        intentId: `navrail.open.${d.nav_key || d.id}`,
        route: d.route ? `#/${d.nav_key}` : null,
        panelId: d.route || null,
        action: d.route ? { type: "openPanel", panelId: d.route } : null,
        order: d.sort_order || 0,
        hidden: !1,
        showOnMobile: !0,
        showOnTablet: !0,
        showOnDesktop: !0,
        minLevel: d.min_level || 0,
        badge: d.badge_type !== "none" ? { type: d.badge_type, endpoint: d.badge_endpoint } : null,
        _raw: d
      };
      i.push(qn);
    });
  });
  const r = Object.values(o).sort((s, c) => s.order - c.order);
  i.sort((s, c) => s.order - c.order);
  const a = i.filter((s) => s.showOnMobile).slice(0, 5).map((s) => s.id);
  return { groups: r, items: i, mobileItems: a, config: e.config || {}, userLevel: e.userLevel || 0, preferences: n };
}
function xo() {
  const e = Mo.map((n) => ({
    id: n.id,
    label: n.label,
    order: n.order,
    position: n.order >= 99 ? "bottom" : "top"
  })), t = st.map((n) => ({
    id: n.id,
    icon: n.icon,
    label: n.label,
    tooltip: n.label,
    group: n.group,
    intentId: n.intentId,
    route: n.route,
    panelId: n.panelId,
    action: n.action || { type: "openPanel", panelId: n.panelId },
    order: n.order || 0,
    hidden: n.hidden || !1,
    showOnMobile: !0,
    showOnTablet: !0,
    showOnDesktop: !0
  }));
  return { groups: e, items: t, mobileItems: Co, config: {}, userLevel: 0 };
}
const Me = "/api/ui/navrail/";
function Po() {
  return fetch(`${Me}?action=manifest`, {
    credentials: "include",
    headers: { Accept: "application/json" }
  });
}
function Uo(e) {
  return fetch(`${Me}?action=item`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e)
  }).then((t) => t.json());
}
function Fo(e, t) {
  return fetch(`${Me}?action=item&id=${e}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t)
  }).then((n) => n.json());
}
function zo(e) {
  return fetch(`${Me}?action=item&id=${e}`, {
    method: "DELETE",
    credentials: "include"
  }).then((t) => t.json());
}
function Vo(e) {
  return fetch(`${Me}?action=toggle&id=${e}`, {
    method: "POST",
    credentials: "include"
  }).then((t) => t.json());
}
function Ho(e) {
  return fetch(`${Me}?action=reorder`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: e })
  }).then((t) => t.json());
}
const Ct = "4.2.0-ES6";
let Ie = null, We = !1;
function jo(e, t) {
  Ie = e, We = t;
}
function Go() {
  const e = K();
  return {
    registryId: "navrail-registry",
    version: Ct,
    loadedAt: Eo(),
    itemCount: me().length + _e().length,
    items: _e().map((t) => t.id),
    groups: me().map((t) => t.id),
    mobileItems: gn(),
    errors: Oo(),
    metrics: e,
    source: e.source,
    offlineMode: e.offlineMode,
    indexedDB: J.getStatus(),
    p23Governance: !0,
    timestamp: Date.now()
  };
}
function vn() {
  const e = K(), t = {
    loaded: Q(),
    hasGroups: me().length > 0,
    hasItems: _e().length > 0,
    hasMobileItems: pn().length > 0,
    apiHealthy: e.apiFails < 3,
    cacheValid: Date.now() - In() < fn,
    loggerAvailable: !0,
    portsInitialized: We,
    indexedDBReady: J._initialized
  }, n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
  let i = [];
  return Ie && (i = Object.keys(Ie).filter((r) => Ie[r] !== null)), {
    status: n === o ? "HEALTHY" : n >= o - 2 ? "DEGRADED" : "UNHEALTHY",
    score: n,
    maxScore: o,
    checks: t,
    portsInitialized: We,
    source: e.source,
    offlineMode: e.offlineMode,
    indexedDB: J.getStatus(),
    ports: i,
    version: Ct,
    p23Governance: !0
  };
}
function Yo() {
  const e = K();
  let t = [];
  return Ie && (t = Object.keys(Ie).filter((n) => Ie[n] !== null)), {
    version: Ct,
    moduleId: "navrail-registry",
    portsInitialized: We,
    loaded: Q(),
    source: e.source,
    offlineMode: e.offlineMode,
    groups: me().length,
    items: _e().length,
    mobileItems: pn().length,
    userLevel: _n(),
    config: mn(),
    metrics: e,
    indexedDB: J.getStatus(),
    ports: t,
    healthCheck: vn(),
    p23Governance: !0,
    features: ["api-load", "indexeddb-cache", "offline-support", "memory-cache", "fallback"]
  };
}
const St = "navrail-registry", Zt = "4.3.1-IMPORT-FIX", Qe = $e({ moduleId: St });
function qo() {
  Qe.init();
}
function kt(e) {
  return Qe.get(e);
}
const j = function(e) {
  const t = kt("logger");
  if (!t) return;
  const n = Array.prototype.slice.call(arguments, 1), o = t[e] || t.info;
  typeof o == "function" && o.apply(t, [`[${St}]`].concat(n));
}, gt = (e, t) => {
  t || (t = {});
  const n = kt("eventBus");
  n && n.emit && n.emit(e, Object.assign({}, t, { timestamp: Date.now() })), document.dispatchEvent(new CustomEvent(e, { detail: t, bubbles: !0 }));
};
function Wo() {
  return typeof window < "u" && window.PermissionResolver && typeof window.PermissionResolver.getLevel == "function" ? window.PermissionResolver.getLevel() : _n();
}
const B = {
  VERSION: Zt,
  MODULE_ID: St,
  load(e) {
    const t = this;
    e || (e = {});
    const n = e.force || !1, o = Date.now(), i = K();
    if (!n && Q() && o - In() < fn)
      return Se({ cacheHits: i.cacheHits + 1 }), j("debug", "Using memory cache"), Promise.resolve({ success: !0, source: "cache" });
    if (po())
      return j("debug", "Load already in progress"), Promise.resolve({ success: !0, source: "pending" });
    ge(!0), qo(), so(kt("logger"));
    const r = typeof performance < "u" ? performance.now() : Date.now();
    return this._loadFromAPI(r).catch((a) => {
      j("warn", "API failed, trying IndexedDB", { error: a.message });
      const s = K();
      return Se({ apiFails: s.apiFails + 1 }), ho({ type: "API_FAIL", message: a.message, timestamp: Date.now() }), t._loadFromIndexedDB(r);
    }).catch((a) => (j("warn", "IndexedDB failed, using fallback", { error: a.message }), t._loadFallback(), ge(!1), { success: !0, source: "fallback", error: a.message })).then((a) => (ge(!1), jo(Qe.snapshot(), Qe.isInitialized()), a));
  },
  _loadFromAPI(e) {
    const t = this;
    return Po().then((n) => {
      if (n.status === 401 || n.status === 403)
        return j("info", "API auth required (expected on login), using fallback"), t._loadFallback(), ge(!1), { success: !0, source: "auth-required", authRequired: !0 };
      if (!n.ok) throw new Error(`HTTP ${n.status}`);
      return n.json();
    }).then((n) => {
      if (n && n.authRequired) return n;
      if (!n.ok) throw new Error(n.error || "API error");
      const o = wo(n.data);
      jt(o.groups), Gt(o.items), Yt(o.mobileItems), qt(o.config), Wt(o.userLevel), Qt(!0), ft(Date.now()), Kt(Date.now());
      const i = (typeof performance < "u" ? performance.now() : Date.now()) - e, r = K();
      Se({
        source: "api",
        apiCalls: r.apiCalls + 1,
        lastLoadTime: (/* @__PURE__ */ new Date()).toISOString(),
        loadDuration: i,
        offlineMode: !1
      });
      const a = me(), s = _e();
      return j("info", "Loaded from API", { groups: a.length, items: s.length, duration: `${i.toFixed(0)}ms` }), gt("navrail:registry:loaded", { source: "api", groups: a.length, items: s.length }), we(), J.save($o(), Zt), ge(!1), { success: !0, source: "api" };
    });
  },
  _loadFromIndexedDB(e) {
    const t = this;
    return J.load().then((n) => {
      if (!n || !n.data)
        return j("info", "No IndexedDB cache available, using fallback"), t._loadFallback(), ge(!1), { success: !0, source: "fallback", offline: !0, cache: "missing" };
      const o = Date.now() - n.timestamp;
      o > uo && j("warn", "IndexedDB cache too old", { age: o }), No(n.data);
      const i = (typeof performance < "u" ? performance.now() : Date.now()) - e, r = K();
      Se({
        source: "indexedDB",
        indexedDBHits: r.indexedDBHits + 1,
        lastLoadTime: (/* @__PURE__ */ new Date()).toISOString(),
        loadDuration: i,
        offlineMode: !0
      });
      const a = me(), s = _e();
      return j("info", "Loaded from IndexedDB (offline)", { groups: a.length, items: s.length, cacheAge: o }), gt("navrail:registry:loaded", { source: "indexedDB", groups: a.length, items: s.length, offline: !0 }), we(), ge(!1), { success: !0, source: "indexedDB", offline: !0, cacheAge: o };
    });
  },
  _loadFallback() {
    const e = xo();
    jt(e.groups), Gt(e.items), Yt(e.mobileItems), qt(e.config), Wt(e.userLevel), Qt(!0), ft(Date.now()), Kt(Date.now()), Se({ source: "fallback" });
    const t = me(), n = _e();
    j("info", "Fallback loaded", { groups: t.length, items: n.length }), gt("navrail:registry:loaded", { source: "fallback" }), we();
  },
  invalidateCache() {
    ft(0), j("debug", "Memory cache invalidated");
  },
  clearOfflineCache() {
    return J.clear().then((e) => (j("info", "IndexedDB cache cleared", { success: e }), e));
  },
  getGroups() {
    return Q() || this._loadFallback(), fo();
  },
  getItems() {
    return Q() || this._loadFallback(), go();
  },
  getItemsByGroup(e) {
    return Q() || this._loadFallback(), mo(e);
  },
  getItem(e) {
    return Q() || this._loadFallback(), _o(e);
  },
  getMobileItems() {
    return Q() || this._loadFallback(), Io();
  },
  getMobileItemIds() {
    return Q() || this._loadFallback(), gn();
  },
  getConfig(e) {
    return mn(e);
  },
  getUserLevel() {
    return Wo();
  },
  registerItem(e) {
    return Do(e);
  },
  registerGroup(e) {
    return To(e);
  },
  subscribe(e) {
    return vo(e);
  },
  unsubscribe(e) {
    return yo(e);
  },
  createItem(e) {
    const t = this;
    return Uo(e).then((n) => (n.ok && t.invalidateCache(), n));
  },
  updateItem(e, t) {
    const n = this;
    return Fo(e, t).then((o) => (o.ok && n.invalidateCache(), o));
  },
  deleteItem(e) {
    const t = this;
    return zo(e).then((n) => (n.ok && t.invalidateCache(), n));
  },
  toggleItem(e) {
    const t = this;
    return Vo(e).then((n) => (n.ok && t.invalidateCache(), n));
  },
  reorderItems(e) {
    const t = this;
    return Ho(e).then((n) => (n.ok && t.invalidateCache(), n));
  },
  isLoaded() {
    return Q();
  },
  getSource() {
    return K().source;
  },
  isOfflineMode() {
    return K().offlineMode;
  },
  getMetrics() {
    return K();
  },
  getManifest() {
    return Go();
  },
  healthCheck() {
    return vn();
  },
  info() {
    return Yo();
  },
  clear() {
    En();
  },
  reset() {
    bo(), J.clear();
  },
  _indexedDBCache: J
};
typeof window < "u" && (window.NavRailRegistry = B);
const Jt = "5.1.0-ES6", Et = "navrail/ui/template", Xt = $e({ moduleId: Et }), yn = {
  renderItemSlot(e) {
    return `<div class="nav-rail__item-host" data-host-id="${e.id}" data-group="${e.group}" data-order="${e.order || 0}"></div>`;
  },
  renderGroup(e, t) {
    const n = this, o = t.filter((r) => r.group === e.id && !r.hidden).sort((r, a) => (r.order || 0) - (a.order || 0));
    if (o.length === 0) return "";
    const i = o.map((r) => n.renderItemSlot(r)).join("");
    return `<div class="nav-rail__group" data-group-id="${e.id}">${i}</div>`;
  },
  render(e) {
    const t = e.groups || [], n = e.items || [], o = e.mode || "desktop", i = e.mobileItems || [];
    return o === "mobile" ? this.renderMobile(n, i) : this.renderDesktop(t, n);
  },
  renderDesktop(e, t) {
    const n = this, o = e.slice().sort((c, q) => c.order - q.order), i = o.filter((c) => c.id !== "system"), r = o.find((c) => c.id === "system"), a = i.map((c) => n.renderGroup(c, t)).join(""), s = r ? `<div class="nav-rail__footer">${this.renderGroup(r, t)}</div>` : "";
    return `<nav class="nav-rail nav-rail--desktop" role="navigation" aria-label="Navegação principal" data-uarps-region="region:app:navrail"><div class="nav-rail__main">${a}</div>${s}</nav>`;
  },
  renderMobile(e, t) {
    const n = this;
    return `<nav class="nav-rail nav-rail--mobile" role="navigation" aria-label="Navegação mobile" data-uarps-region="region:app:navrail"><div class="nav-rail__mobile-items">${t.map((r) => e.find((a) => a.id === r)).filter(Boolean).map((r) => n.renderItemSlot(r)).join("")}</div></nav>`;
  },
  getHosts(e) {
    return e ? Array.from(e.querySelectorAll("[data-host-id]")) : [];
  },
  getHost(e, t) {
    return e ? e.querySelector(`[data-host-id="${t}"]`) : null;
  },
  info() {
    return {
      moduleId: Et,
      version: Jt,
      portsInitialized: Xt.isInitialized(),
      capabilities: ["renderItemSlot", "renderGroup", "render", "renderDesktop", "renderMobile", "getHosts", "getHost"]
    };
  },
  healthCheck() {
    const e = {
      renderItemSlotWorks: typeof this.renderItemSlot == "function",
      renderGroupWorks: typeof this.renderGroup == "function",
      renderWorks: typeof this.render == "function",
      portsInitialized: Xt.isInitialized()
    }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
    return {
      status: t === n ? "HEALTHY" : "DEGRADED",
      score: `${t}/${n}`,
      checks: e,
      version: Jt,
      moduleId: Et
    };
  }
}, Lt = "3.1.0-ES6", pe = "navrail/core/component-mounter", De = {
  COMPONENTS_MOUNTED: "navrail:components:mounted",
  COMPONENT_ERROR: "navrail:component:error",
  COMPONENT_RETRY: "navrail:component:retry",
  LAZY_LOAD_START: "navrail:lazy:start",
  LAZY_LOAD_COMPLETE: "navrail:lazy:complete"
}, Re = /* @__PURE__ */ new Map(), ee = /* @__PURE__ */ new Map(), u = {
  mounted: /* @__PURE__ */ new Set(),
  failed: /* @__PURE__ */ new Map(),
  pending: /* @__PURE__ */ new Set(),
  loading: /* @__PURE__ */ new Set()
}, le = {
  totalMounts: 0,
  totalFails: 0,
  totalRetries: 0,
  lazyLoaded: 0,
  eagerLoaded: 0
}, Qo = (e, t, n) => {
  const o = e[t];
  return o ? typeof o == "function" ? o() : Promise.resolve(o) : new Promise((i, r) => {
    (typeof queueMicrotask == "function" ? queueMicrotask : setTimeout)(
      r.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + t + (t.split("/").length !== n ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
let Dn = () => {
};
function Ko(e) {
  Dn = e;
}
function Zo(e) {
  return () => Qo(/* @__PURE__ */ Object.assign({ "../../components/admin-settings/index.js": () => Promise.resolve().then(() => Or), "../../components/admin-users/index.js": () => Promise.resolve().then(() => xr), "../../components/analytics/index.js": () => Promise.resolve().then(() => es), "../../components/api/index.js": () => Promise.resolve().then(() => Is), "../../components/bell/index.js": () => Promise.resolve().then(() => ws), "../../components/charts/index.js": () => Promise.resolve().then(() => Zs), "../../components/clientes/index.js": () => Promise.resolve().then(() => ga), "../../components/code/index.js": () => Promise.resolve().then(() => Sa), "../../components/comercial/index.js": () => Promise.resolve().then(() => Wa), "../../components/dashboard/index.js": () => Promise.resolve().then(() => dl), "../../components/database/index.js": () => Promise.resolve().then(() => Ml), "../../components/docs/index.js": () => Promise.resolve().then(() => Gl), "../../components/financeiro/index.js": () => Promise.resolve().then(() => lc), "../../components/folder/index.js": () => Promise.resolve().then(() => bc), "../../components/header-admin/index.js": () => Promise.resolve().then(() => Vc), "../../components/help/index.js": () => Promise.resolve().then(() => ru), "../../components/home/index.js": () => Promise.resolve().then(() => yu), "../../components/location/index.js": () => Promise.resolve().then(() => Uu), "../../components/navrail-admin/index.js": () => Promise.resolve().then(() => nd), "../../components/pipedrive/index.js": () => Promise.resolve().then(() => Ed), "../../components/relatorios/index.js": () => Promise.resolve().then(() => Bd), "../../components/toggle-sidebar/index.js": () => Promise.resolve().then(() => Xd), "../../components/uarps-monitor/index.js": () => Promise.resolve().then(() => _h) }), `../../components/${e}/index.js`, 5);
}
function Jo(e) {
  const t = ko(e);
  return t ? Zo(t) : (Dn("warn", `No componentPath in registry for: ${e}`), null);
}
function Xo() {
  return st.map((e) => e.id);
}
function Tn(e) {
  if (Re.has(e)) return Promise.resolve(Re.get(e));
  const t = Jo(e);
  return t ? t().then((n) => (Re.set(e, n), n)) : Promise.reject(new Error(`No loader for: ${e} (missing componentPath in registry)`));
}
let Ot = () => {
}, bn = () => null, vt = null;
function ei(e, t, n) {
  Ot = e, bn = t, vt = n;
}
const F = {
  _observer: null,
  _pendingHosts: /* @__PURE__ */ new Map(),
  _initialized: !1,
  _loadQueue: [],
  _isProcessing: !1,
  init() {
    if (this._initialized || typeof IntersectionObserver > "u") return this;
    const e = this;
    return this._observer = new IntersectionObserver(
      (t) => {
        e._handleIntersection(t);
      },
      { rootMargin: "50px", threshold: 0 }
    ), this._initialized = !0, Ot("info", "LazyLoader initialized"), this;
  },
  observe(e, t, n) {
    if (!e) return;
    if (this._pendingHosts.set(e, { id: t, props: n }), this._showSkeleton(e, t), !this._observer) {
      this._queueLoad(e, t, n);
      return;
    }
    this._observer.observe(e);
    const o = this;
    requestAnimationFrame(() => {
      o._isElementVisible(e) && o._triggerLoad(e);
    });
  },
  _isElementVisible(e) {
    if (!e) return !1;
    const t = e.getBoundingClientRect(), n = window.innerHeight || document.documentElement.clientHeight, o = window.innerWidth || document.documentElement.clientWidth, i = t.top <= n + 50 && t.top + t.height >= -50, r = t.left <= o + 50 && t.left + t.width >= -50;
    return i && r;
  },
  _showSkeleton(e, t) {
    e.innerHTML = `<div class="navrail-skeleton" data-skeleton-for="${t}" title="Loading ${t}..."><div class="navrail-skeleton__icon"></div></div>`;
  },
  _handleIntersection(e) {
    const t = this;
    e.forEach((n) => {
      n.isIntersecting && t._triggerLoad(n.target);
    });
  },
  _triggerLoad(e) {
    const t = this._pendingHosts.get(e);
    t && (u.mounted.has(t.id) || u.loading.has(t.id) || (this._observer && this._observer.unobserve(e), this._pendingHosts.delete(e), this._queueLoad(e, t.id, t.props)));
  },
  _queueLoad(e, t, n) {
    this._loadQueue.push({ host: e, id: t, props: n }), this._processQueue();
  },
  _processQueue() {
    if (this._isProcessing || this._loadQueue.length === 0) return;
    this._isProcessing = !0;
    const e = this, t = this._loadQueue.shift();
    if (u.mounted.has(t.id) || u.loading.has(t.id)) {
      this._isProcessing = !1, this._processQueue();
      return;
    }
    u.loading.add(t.id), le.lazyLoaded++, Ot("debug", "Lazy loading component", { id: t.id });
    const n = bn("eventBus");
    n && n.emit && n.emit(De.LAZY_LOAD_START, { id: t.id }), vt && vt(t.id, t.host, t.props).then((o) => {
      u.loading.delete(t.id), n && n.emit && n.emit(De.LAZY_LOAD_COMPLETE, { id: t.id, success: !!o }), e._isProcessing = !1, setTimeout(() => {
        e._processQueue();
      }, 10);
    }).catch(() => {
      u.loading.delete(t.id), e._isProcessing = !1, setTimeout(() => {
        e._processQueue();
      }, 10);
    });
  },
  loadAllPending() {
    const e = this;
    Array.from(this._pendingHosts.keys()).forEach((n) => {
      e._triggerLoad(n);
    });
  },
  disconnect() {
    this._observer && this._observer.disconnect(), this._pendingHosts.clear(), this._loadQueue = [], this._isProcessing = !1;
  },
  destroy() {
    this.disconnect(), this._observer = null, this._initialized = !1;
  }
};
let $n = () => null, yt = null;
function ti(e, t) {
  $n = e, yt = t;
}
function ni(e, t, n) {
  const o = t.replace(/['"]/g, ""), i = (n || "Unknown error").replace(/['"<>]/g, "").substring(0, 100);
  e.innerHTML = `<button class="navrail-btn navrail-btn--error" data-component-id="${o}" data-error="true" title="Error loading ${o}: ${i}. Click to retry." aria-label="Retry loading ${o}"><span class="navrail-btn__icon navrail-btn__icon--error">⚠️</span></button>`;
  const r = e.querySelector(".navrail-btn--error");
  r && yt && r.addEventListener("click", (a) => {
    a.preventDefault(), a.stopPropagation(), yt(o);
  });
}
function Ve(e, t) {
  const n = $n("eventBus");
  n && n.emit && n.emit(e, Object.assign({ source: pe, timestamp: Date.now() }, t)), typeof window < "u" && window.NavRailTracker && window.NavRailTracker.track && window.NavRailTracker.track(e, t);
}
let se = () => {
}, Dt = null;
function oi(e, t) {
  se = e, Dt = t;
}
function wt(e) {
  let t = u.failed.get(e);
  if (!t) {
    se("warn", "Component not in failed list", { id: e });
    const n = document.querySelector(`[data-host-id="${e}"]`);
    if (!n)
      return se("error", "Host not found for retry", { id: e }), Promise.resolve(!1);
    t = { host: n, props: {}, attempts: 0 };
  }
  return t.attempts++, le.totalRetries++, se("info", "Retrying component", { id: e, attempt: t.attempts }), Ve(De.COMPONENT_RETRY, { id: e, attempt: t.attempts }), t.host && (t.host.innerHTML = `<div class="navrail-loading" data-loading-for="${e}"><div class="navrail-loading__spinner"></div></div>`), Dt ? Dt(e, t.host, t.props || {}).then((n) => n ? (se("info", "Retry successful", { id: e }), !0) : !1) : Promise.resolve(!1);
}
function ii() {
  const e = Array.from(u.failed.keys());
  if (e.length === 0)
    return se("info", "No failed components to retry"), Promise.resolve({ success: 0, failed: 0, total: 0 });
  se("info", "Retrying all failed components", { count: e.length });
  const t = e.map((n) => wt(n).then((o) => ({
    id: n,
    success: o
  })));
  return Promise.all(t).then((n) => {
    const o = n.filter((r) => r.success).length, i = n.length - o;
    return se("info", "Retry all complete", { success: o, failed: i }), { success: o, failed: i, total: n.length };
  });
}
function Nn() {
  return Array.from(u.failed.entries()).map((e) => ({
    id: e[0],
    error: e[1].error,
    attempts: e[1].attempts,
    lastAttempt: e[1].lastAttempt
  }));
}
let Rt = () => !1;
function ri(e) {
  Rt = e;
}
function si() {
  const e = Array.from(ee.keys()), t = Array.from(Re.keys()), n = Array.from(u.failed.keys()), o = F._pendingHosts ? F._pendingHosts.size : 0;
  let i = "HEALTHY";
  return n.length > 0 && e.length === 0 ? i = "UNHEALTHY" : n.length > 0 ? i = "DEGRADED" : e.length === 0 && (i = "IDLE"), {
    status: i,
    mountedCount: e.length,
    loadedCount: t.length,
    failedCount: n.length,
    pendingLazy: o,
    mounted: e,
    loaded: t,
    failed: n,
    metrics: Object.assign({}, le),
    lazyLoaderActive: F._initialized,
    queueLength: F._loadQueue ? F._loadQueue.length : 0,
    portsInitialized: Rt(),
    version: Lt,
    moduleId: pe
  };
}
function ai() {
  const e = So(), t = Xo();
  return {
    version: Lt,
    moduleId: pe,
    availableComponents: t,
    eagerComponents: e,
    lazyComponents: t.filter((n) => e.indexOf(n) === -1),
    mountedComponents: Array.from(ee.keys()),
    loadedModules: Array.from(Re.keys()),
    failedComponents: Array.from(u.failed.keys()),
    componentState: {
      mounted: u.mounted.size,
      failed: u.failed.size,
      pending: u.pending.size,
      loading: u.loading.size
    },
    metrics: Object.assign({}, le),
    lazyLoader: {
      initialized: F._initialized,
      pendingCount: F._pendingHosts ? F._pendingHosts.size : 0,
      queueLength: F._loadQueue ? F._loadQueue.length : 0
    },
    portsInitialized: Rt(),
    source: "registry-ssot",
    features: ["lazy-loading", "error-boundary", "retry-individual", "retry-all", "visibility-check", "host-clear", "dynamic-loaders", "registry-ssot"]
  };
}
function li() {
  return {
    mounted: Array.from(u.mounted),
    failed: Nn(),
    pending: Array.from(u.pending),
    loading: Array.from(u.loading)
  };
}
const at = de({ moduleId: pe });
function lt(e) {
  return at.get(e);
}
function ci(e) {
  return at.inject(e);
}
function ui() {
  return at.snapshot();
}
const ce = (e, t, n) => {
  const o = lt("logger");
  if (!o) return;
  const i = o[e] || o.info;
  typeof i == "function" && i(`[${pe}]`, t, n || "");
};
Ko(ce);
ti(lt, wt);
ri(() => at.isInitialized());
function ct(e, t, n) {
  if (n || (n = {}), !t) return Promise.resolve(null);
  const o = typeof performance < "u" ? performance.now() : Date.now();
  return new Promise((i) => {
    if (ee.has(e)) {
      const r = ee.get(e);
      if (r.host === t && r.instance && typeof r.instance.isMounted == "function" && r.instance.isMounted()) {
        i(r.instance);
        return;
      }
    }
    Tn(e).then((r) => {
      if (!r) throw new Error(`Module not found: ${e}`);
      t.innerHTML = "";
      let a;
      if (r.default && r.default.prototype && typeof r.default.prototype.mount == "function")
        a = new r.default();
      else if (typeof r.getInstance == "function")
        a = r.getInstance();
      else if (typeof r.mount == "function") {
        r.init && r.init({}), r.mount(t, n), ee.set(e, { instance: r, host: t }), u.mounted.add(e), u.failed.delete(e), le.totalMounts++;
        const c = (typeof performance < "u" ? performance.now() : Date.now()) - o;
        Ve("component:mounted", { id: e, duration: Math.round(c) }), ce("debug", "Component mounted", { id: e, duration: `${c.toFixed(0)}ms` }), i(r);
        return;
      } else
        throw new Error(`Invalid module structure: ${e}`);
      a.init && a.init({}), a.mount(t, n), ee.set(e, { instance: a, host: t }), u.mounted.add(e), u.failed.delete(e), le.totalMounts++;
      const s = (typeof performance < "u" ? performance.now() : Date.now()) - o;
      Ve("component:mounted", { id: e, duration: Math.round(s) }), ce("debug", "Component mounted", { id: e, duration: `${s.toFixed(0)}ms` }), i(a);
    }).catch((r) => {
      var a;
      le.totalFails++, u.failed.set(e, {
        error: r.message || String(r),
        attempts: (((a = u.failed.get(e)) == null ? void 0 : a.attempts) || 0) + 1,
        lastAttempt: Date.now(),
        host: t,
        props: n
      }), ni(t, e, r.message), Ve(De.COMPONENT_ERROR, { id: e, error: r.message }), ce("error", "Component mount failed", { id: e, error: r.message }), i(null);
    });
  });
}
ei(ce, lt, ct);
oi(ce, ct);
function Mn(e) {
  const t = ee.get(e);
  if (!t) return Promise.resolve(!1);
  try {
    return t.instance && typeof t.instance.unmount == "function" && t.instance.unmount(), ee.delete(e), u.mounted.delete(e), Promise.resolve(!0);
  } catch (n) {
    return ce("warn", "Unmount error", { id: e, error: n.message }), Promise.resolve(!1);
  }
}
function di(e, t) {
  t || (t = []);
  const n = yn.getHosts(e), o = { mounted: [], failed: [], lazy: [] }, i = [];
  return F.init(), n.forEach((r) => {
    const a = r.dataset.hostId;
    if (!a) return;
    const s = t.find((q) => q.id === a), c = s ? {
      label: s.label,
      icon: s.icon,
      group: s.group,
      panelId: s.panelId || (s.intentId ? s.intentId.split(".").pop() : void 0),
      route: s.route || `#/${a}`
    } : {};
    if (Lo(a)) {
      le.eagerLoaded++;
      const q = ct(a, r, c).then((d) => {
        d ? o.mounted.push(a) : o.failed.push(a);
      });
      i.push(q);
    } else
      F.observe(r, a, c), o.lazy.push(a);
  }), Promise.all(i).then(() => {
    const r = lt("eventBus");
    return r && r.emit && r.emit(De.COMPONENTS_MOUNTED, {
      source: pe,
      mounted: o.mounted,
      failed: o.failed,
      lazy: o.lazy,
      timestamp: Date.now()
    }), ce("info", "Initial mount complete", {
      eager: o.mounted.length,
      failed: o.failed.length,
      lazy: o.lazy.length
    }), o;
  });
}
function hi() {
  F.disconnect();
  const e = Array.from(ee.keys()), t = e.map((n) => Mn(n));
  return Promise.all(t).then(() => (u.mounted.clear(), u.failed.clear(), u.pending.clear(), u.loading.clear(), e));
}
const Z = {
  loadModule: Tn,
  mountComponent: ct,
  unmountComponent: Mn,
  mountAll: di,
  unmountAll: hi,
  retryComponent: wt,
  retryFailed: ii,
  getFailedComponents: Nn,
  getComponentState: li,
  healthCheck: si,
  info: ai,
  MOUNTER_EVENTS: De,
  LazyLoader: F,
  VERSION: Lt,
  MODULE_ID: pe,
  injectPorts: ci,
  getPorts: ui
}, re = {
  READY: "navrail:ready",
  DESTROYED: "navrail:destroyed",
  ERROR: "navrail:error",
  ITEM_CLICK: "navrail:item:click",
  GROUP_RENDER: "navrail:group:render",
  TOGGLE_SIDEBAR: "navrail:toggle-sidebar",
  OPEN_PANEL: "navrail:open-panel",
  MODE_DESKTOP: "navrail:mode:desktop",
  MODE_MOBILE: "navrail:mode:mobile"
}, fi = {
  mobileBreakpoint: 500,
  tabletBreakpoint: 1024,
  railWidth: 72,
  itemSize: 48,
  bottomNavHeight: 64
};
function Bt(e = {}) {
  return { ...fi, ...e };
}
function gi(e, t = {}) {
  return { type: e, timestamp: Date.now(), source: "navrail", ...t };
}
const en = "5.1.0-ES6", Tt = "navrail/core/events", bt = de({ moduleId: Tt });
function Ee(e) {
  return bt.get(e);
}
const Te = {
  _root: null,
  _uiActionHandler: null,
  _intentHandlers: {},
  _initialized: !1,
  init(e) {
    return this._initialized ? this : (this._root = e, this._bindUIActionListener(), this._bindIntentListeners(), this._initialized = !0, this);
  },
  _bindUIActionListener() {
    const e = this, t = Ee("eventBus");
    !t || !t.on || (this._uiActionHandler = (n) => {
      const o = n && n.actionId ? n.actionId : null, i = n && n.meta ? n.meta : {};
      if (!o || o.indexOf("navrail:") !== 0) return;
      const r = o.replace("navrail:", ""), a = i.panelId, s = i.route, c = i.group;
      if (r === "toggle-sidebar") {
        e._emit(re.TOGGLE_SIDEBAR, { itemId: r }), e._emitNavIntent("ui.action", { action: "sidebar.toggle", source: "navrail" });
        return;
      }
      e._emitNavIntent(Ge.NAVIGATE_PATH, {
        itemId: r,
        path: s || `#/${r}`,
        panelId: a || `panel-${r}`,
        source: "navrail"
      }), e._emit(re.ITEM_CLICK, { itemId: r, panelId: a, group: c, route: s });
    }, t.on(ae.ACTION, this._uiActionHandler));
  },
  _bindIntentListeners() {
    const e = this, t = Ee("eventBus");
    !t || !t.on || (this._intentHandlers.show = (n) => {
      e._root && (e._root.classList.remove("nav-rail--hidden"), e._root.setAttribute("aria-hidden", "false")), e._emit(re.READY, { action: "show", source: n && n.source });
    }, t.on(H.SHOW, this._intentHandlers.show), this._intentHandlers.hide = (n) => {
      e._root && (e._root.classList.add("nav-rail--hidden"), e._root.setAttribute("aria-hidden", "true")), e._emit(re.READY, { action: "hide", source: n && n.source });
    }, t.on(H.HIDE, this._intentHandlers.hide), this._intentHandlers.toggle = (n) => {
      e._root && (e._root.classList.contains("nav-rail--hidden") ? (e._root.classList.remove("nav-rail--hidden"), e._root.setAttribute("aria-hidden", "false")) : (e._root.classList.add("nav-rail--hidden"), e._root.setAttribute("aria-hidden", "true"))), e._emit(re.READY, { action: "toggle", source: n && n.source });
    }, t.on(H.TOGGLE, this._intentHandlers.toggle), this._intentHandlers.reorder = (n) => {
      const o = n && n.order ? n.order : [];
      e._emit(re.READY, { action: "reorder", order: o, source: n && n.source });
    }, t.on(H.REORDER, this._intentHandlers.reorder));
  },
  _emitNavIntent(e, t) {
    const n = Ee("eventBus");
    if (!n || !n.emit) return;
    const o = {
      type: e,
      timestamp: Date.now(),
      source: "navrail",
      data: t
    };
    n.emit(e, o);
  },
  _emit(e, t) {
    t || (t = {});
    const n = gi(e, t), o = Ee("eventBus");
    o && o.emit && o.emit(e, n), this._root && this._root.dispatchEvent(new CustomEvent(e, { detail: n, bubbles: !0 })), typeof window < "u" && window.NavRailTracker && window.NavRailTracker.track && window.NavRailTracker.track(e, t);
  },
  emit(e, t) {
    this._emit(e, t);
  },
  destroy() {
    const e = Ee("eventBus");
    e && e.off && (this._uiActionHandler && e.off(ae.ACTION, this._uiActionHandler), this._intentHandlers.show && e.off(H.SHOW, this._intentHandlers.show), this._intentHandlers.hide && e.off(H.HIDE, this._intentHandlers.hide), this._intentHandlers.toggle && e.off(H.TOGGLE, this._intentHandlers.toggle), this._intentHandlers.reorder && e.off(H.REORDER, this._intentHandlers.reorder)), this._root = null, this._uiActionHandler = null, this._intentHandlers = {}, this._initialized = !1;
  },
  healthCheck() {
    return {
      status: this._initialized ? "HEALTHY" : "NOT_INITIALIZED",
      hasEventBus: !!Ee("eventBus"),
      hasRoot: !!this._root,
      intentListenersActive: Object.keys(this._intentHandlers).length,
      portsInitialized: bt.isInitialized(),
      version: en,
      moduleId: Tt
    };
  },
  info() {
    return {
      version: en,
      moduleId: Tt,
      initialized: this._initialized,
      listeningTo: [ae.ACTION, H.SHOW, H.HIDE, H.TOGGLE, H.REORDER],
      emits: [].concat(Object.values(re), [Ge.NAVIGATE_PATH]),
      portsInitialized: bt.isInitialized()
    };
  }
}, Ke = "navrail-ui-behaviors", tn = "5.1.0-ES6", $t = $e({ moduleId: Ke });
function An(e) {
  return $t.get(e);
}
const Fe = function(e) {
  const t = An("logger");
  if (!t) return;
  const n = Array.prototype.slice.call(arguments, 1), o = t[e] || t.info;
  typeof o == "function" && o.apply(t, [`[${Ke}]`].concat(n));
};
function mi(e, t) {
  let n = null;
  return function() {
    const o = this, i = arguments;
    n && clearTimeout(n), n = setTimeout(() => {
      e.apply(o, i), n = null;
    }, t);
  };
}
const Pe = {
  _root: null,
  _resizeHandler: null,
  _resizeHandlerRaw: null,
  _keyboardHandler: null,
  _config: null,
  _onModeChange: null,
  _initialized: !1,
  _currentMode: "desktop",
  _metrics: { resizeEvents: 0, resizeExecutions: 0, keyboardEvents: 0, modeChanges: 0 },
  init(e, t, n) {
    return this._initialized ? (Fe("warn", "Already initialized"), this) : (this._root = e, this._config = t, this._onModeChange = n, this._bindResponsive(), this._bindKeyboard(), this._initialized = !0, Fe("info", "Behaviors initialized with debounced resize"), this);
  },
  _bindResponsive() {
    const e = this, t = this._config && this._config.resizeDebounce ? this._config.resizeDebounce : 150;
    this._resizeHandlerRaw = () => {
      e._metrics.resizeExecutions++;
      const o = window.innerWidth, i = e._config && e._config.mobileBreakpoint ? e._config.mobileBreakpoint : 500, r = o < i ? "mobile" : "desktop";
      r !== e._currentMode && (e._currentMode = r, e._metrics.modeChanges++, e._onModeChange && e._onModeChange(r), Fe("info", "Mode changed", { mode: r, width: o }));
    }, this._resizeHandler = mi(() => {
      e._resizeHandlerRaw();
    }, t);
    const n = () => {
      e._metrics.resizeEvents++, e._resizeHandler();
    };
    window.addEventListener("resize", n), this._resizeHandler._wrapped = n, this._resizeHandlerRaw();
  },
  _bindKeyboard() {
    const e = this;
    this._keyboardHandler = (t) => {
      const n = Array.from(e._root ? e._root.querySelectorAll(".navrail-btn, .nav-rail__item") : []), o = n.indexOf(document.activeElement);
      if (o === -1) return;
      e._metrics.keyboardEvents++;
      let i = o;
      t.key === "ArrowDown" || t.key === "ArrowRight" ? (t.preventDefault(), i = (o + 1) % n.length) : t.key === "ArrowUp" || t.key === "ArrowLeft" ? (t.preventDefault(), i = (o - 1 + n.length) % n.length) : t.key === "Home" ? (t.preventDefault(), i = 0) : t.key === "End" && (t.preventDefault(), i = n.length - 1), i !== o && n[i] && n[i].focus();
    }, this._root && this._root.addEventListener("keydown", this._keyboardHandler);
  },
  getCurrentMode() {
    return this._currentMode;
  },
  getConfig() {
    return this._config ? Object.assign({}, this._config) : null;
  },
  destroy() {
    return this._resizeHandler && this._resizeHandler._wrapped && (window.removeEventListener("resize", this._resizeHandler._wrapped), this._resizeHandler = null, this._resizeHandlerRaw = null), this._keyboardHandler && this._root && (this._root.removeEventListener("keydown", this._keyboardHandler), this._keyboardHandler = null), this._root = null, this._config = null, this._onModeChange = null, this._initialized = !1, this._currentMode = "desktop", Fe("info", "Behaviors destroyed"), this;
  },
  healthCheck() {
    const e = $t.snapshot(), t = An("logger"), n = {
      initialized: this._initialized,
      hasRoot: !!this._root,
      hasConfig: !!this._config,
      hasResizeHandler: !!this._resizeHandler,
      hasKeyboardHandler: !!this._keyboardHandler,
      hasModeCallback: typeof this._onModeChange == "function",
      loggerAvailable: !!t,
      portsInitialized: e._initialized
    }, o = Object.values(n).filter(Boolean).length, i = Object.keys(n).length;
    return {
      status: o === i ? "HEALTHY" : o >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: `${o}/${i}`,
      checks: n,
      currentMode: this._currentMode,
      breakpoint: this._config && this._config.mobileBreakpoint ? this._config.mobileBreakpoint : 500,
      debounceDelay: this._config && this._config.resizeDebounce ? this._config.resizeDebounce : 150,
      metrics: Object.assign({}, this._metrics),
      efficiency: this._metrics.resizeEvents > 0 ? `${Math.round((1 - this._metrics.resizeExecutions / this._metrics.resizeEvents) * 100)}%` : "N/A",
      version: tn,
      moduleId: Ke,
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const e = $t.snapshot();
    return {
      moduleId: Ke,
      version: tn,
      initialized: this._initialized,
      currentMode: this._currentMode,
      hasRoot: !!this._root,
      config: this._config ? { mobileBreakpoint: this._config.mobileBreakpoint, resizeDebounce: this._config.resizeDebounce || 150 } : null,
      metrics: Object.assign({}, this._metrics),
      features: ["responsive", "keyboard-navigation", "home-end-keys", "debounced-resize"],
      portsInitialized: e._initialized,
      timestamp: Date.now()
    };
  }
}, Ae = "navrail/core/feature-loader", xt = "5.1.0", Ue = $e({ moduleId: Ae }), ut = (e) => Ue.get(e), _i = (e) => Ue.inject(e), Ii = () => Ue.snapshot(), P = (e, ...t) => {
  const n = ut("logger");
  if (!n) return;
  const o = n[e] || n.info;
  typeof o == "function" && o(`[${Ae}]`, ...t);
}, Be = {
  FEATURE_LOADED: "navrail:feature:loaded",
  FEATURE_FAILED: "navrail:feature:failed",
  FEATURE_READY: "navrail:feature:ready",
  FEATURE_DESTROYED: "navrail:feature:destroyed",
  ALL_FEATURES_LOADED: "navrail:features:all-loaded"
}, l = {
  initialized: !1,
  features: /* @__PURE__ */ new Map(),
  // featureId -> { module, instance, status }
  failed: /* @__PURE__ */ new Map(),
  // featureId -> { error, attempts }
  registry: [],
  // Lista de features registradas
  dependencies: null,
  // { container, eventBus, registry, config }
  metrics: {
    loaded: 0,
    failed: 0,
    totalLoadTime: 0
  }
};
function Cn(e) {
  return !e || !e.id ? (P("warn", "Invalid feature config", e), !1) : l.registry.find((n) => n.id === e.id) ? (P("warn", "Feature already registered", { id: e.id }), !1) : (l.registry.push({
    id: e.id,
    path: e.path || `./features/${e.id}/index.js`,
    eager: e.eager || !1,
    enabled: e.enabled !== !1,
    priority: e.priority || 0
  }), P("debug", "Feature registered", { id: e.id }), !0);
}
function pi(e) {
  return Array.isArray(e) ? e.filter((t) => Cn(t)).length : 0;
}
function Ei(e) {
  const t = l.registry.findIndex((n) => n.id === e);
  return t === -1 ? !1 : (l.registry.splice(t, 1), !0);
}
async function Oi(e) {
  const t = performance.now(), { id: n, path: o } = e;
  try {
    const i = o.startsWith("./") ? `/components/nav-rail/${o.slice(2)}` : o;
    P("debug", "Loading feature module", { id: n, path: i });
    const r = await import(i), a = performance.now() - t;
    return l.metrics.totalLoadTime += a, P("debug", "Feature module loaded", { id: n, duration: `${a.toFixed(0)}ms` }), r;
  } catch (i) {
    throw P("error", "Failed to load feature module", { id: n, path: o, error: i.message }), i;
  }
}
async function vi(e, t) {
  const n = l.dependencies;
  if (!n)
    throw new Error("Feature loader not initialized with dependencies");
  const o = t.init || t.default && t.default.init;
  return typeof o != "function" ? (P("warn", "Feature has no init function", { id: e }), t) : (await o({
    container: n.container,
    eventBus: n.eventBus,
    registry: n.registry,
    config: n.config
  }), t);
}
async function Pt(e) {
  if (l.features.has(e)) {
    const n = l.features.get(e);
    if (n.status === "ready")
      return P("debug", "Feature already loaded", { id: e }), n.module;
  }
  const t = l.registry.find((n) => n.id === e);
  if (!t)
    return P("warn", "Feature not registered", { id: e }), null;
  if (!t.enabled)
    return P("debug", "Feature disabled", { id: e }), null;
  try {
    l.features.set(e, { module: null, instance: null, status: "loading" });
    const n = await Oi(t);
    return await vi(e, n), l.features.set(e, { module: n, instance: n.default || n, status: "ready" }), l.metrics.loaded++, l.failed.delete(e), Ze(Be.FEATURE_LOADED, { featureId: e }), P("info", "Feature loaded and initialized", { id: e }), n;
  } catch (n) {
    const o = l.failed.get(e) || { attempts: 0 };
    return l.failed.set(e, {
      error: n.message,
      attempts: o.attempts + 1,
      lastAttempt: Date.now()
    }), l.features.set(e, { module: null, instance: null, status: "failed" }), l.metrics.failed++, Ze(Be.FEATURE_FAILED, { featureId: e, error: n.message }), P("error", "Feature load failed", { id: e, error: n.message }), null;
  }
}
async function yi() {
  const e = l.registry.filter((n) => n.eager && n.enabled).sort((n, o) => o.priority - n.priority);
  if (e.length === 0)
    return P("debug", "No eager features to load"), { loaded: [], failed: [] };
  P("info", "Loading eager features", { count: e.length });
  const t = { loaded: [], failed: [] };
  for (const n of e)
    await Pt(n.id) ? t.loaded.push(n.id) : t.failed.push(n.id);
  return Ze(Be.ALL_FEATURES_LOADED, t), P("info", "Eager features loaded", t), t;
}
async function Di(e) {
  return Pt(e);
}
function Ti(e) {
  if (l.initialized) {
    P("warn", "Feature loader already initialized");
    return;
  }
  l.dependencies = {
    container: e.container || null,
    eventBus: e.eventBus || ut("eventBus"),
    registry: e.registry || null,
    config: e.config || {}
  }, l.initialized = !0, P("info", "Feature loader initialized");
}
async function bi() {
  var e, t, n;
  for (const [o, i] of l.features)
    if (i.status === "ready")
      try {
        const r = ((e = i.instance) == null ? void 0 : e.destroy) || ((t = i.module) == null ? void 0 : t.destroy) || ((n = i.module) == null ? void 0 : n.default) && i.module.default.destroy;
        typeof r == "function" && (await r(), P("debug", "Feature destroyed", { id: o })), Ze(Be.FEATURE_DESTROYED, { featureId: o });
      } catch (r) {
        P("warn", "Error destroying feature", { id: o, error: r.message });
      }
  l.features.clear(), l.failed.clear(), l.dependencies = null, l.initialized = !1, l.metrics = { loaded: 0, failed: 0, totalLoadTime: 0 }, P("info", "Feature loader destroyed");
}
function Ze(e, t = {}) {
  var n;
  const o = ((n = l.dependencies) == null ? void 0 : n.eventBus) || ut("eventBus");
  !o || !o.emit || o.emit(e, {
    type: e,
    timestamp: Date.now(),
    source: Ae,
    ...t
  });
}
function $i(e) {
  return l.features.get(e) || null;
}
function Sn() {
  return Array.from(l.features.entries()).filter(([e, t]) => t.status === "ready").map(([e, t]) => ({ id: e, ...t }));
}
function kn() {
  return Array.from(l.failed.entries()).map(([e, t]) => ({ id: e, ...t }));
}
function Ni() {
  return [...l.registry];
}
function Mi(e) {
  const t = l.features.get(e);
  return (t == null ? void 0 : t.status) === "ready";
}
function Ai() {
  var e;
  const t = Array.from(l.features.values()).filter((s) => s.status === "ready").length, n = l.failed.size, o = {
    initialized: l.initialized,
    hasDependencies: !!l.dependencies,
    hasEventBus: !!((e = l.dependencies) != null && e.eventBus || ut("eventBus")),
    noFailedFeatures: n === 0,
    registryNotEmpty: l.registry.length > 0 || !0,
    // OK se vazio também
    portsInitialized: Ue.isInitialized()
  }, i = Object.values(o).filter(Boolean).length, r = Object.keys(o).length;
  let a = "HEALTHY";
  return l.initialized ? (n > 0 || i < r) && (a = "DEGRADED") : a = "NOT_INITIALIZED", {
    status: a,
    score: `${i}/${r}`,
    checks: o,
    metrics: { ...l.metrics },
    registeredCount: l.registry.length,
    loadedCount: t,
    failedCount: n,
    version: xt,
    moduleId: Ae,
    timestamp: Date.now()
  };
}
function Ci() {
  return {
    moduleId: Ae,
    version: xt,
    initialized: l.initialized,
    registeredFeatures: l.registry.map((e) => e.id),
    loadedFeatures: Sn().map((e) => e.id),
    failedFeatures: kn().map((e) => e.id),
    metrics: { ...l.metrics },
    portsInitialized: Ue.isInitialized(),
    timestamp: Date.now()
  };
}
const U = {
  // Lifecycle
  init: Ti,
  destroy: bi,
  // Registration
  registerFeature: Cn,
  registerFeatures: pi,
  unregisterFeature: Ei,
  // Loading
  loadFeature: Pt,
  loadEagerFeatures: yi,
  loadFeatureOnDemand: Di,
  // Queries
  getFeature: $i,
  getLoadedFeatures: Sn,
  getFailedFeatures: kn,
  getRegisteredFeatures: Ni,
  isFeatureLoaded: Mi,
  // Health
  healthCheck: Ai,
  info: Ci,
  // Events
  FEATURE_EVENTS: Be,
  // Ports
  injectPorts: _i,
  getPorts: Ii,
  // Meta
  VERSION: xt,
  MODULE_ID: Ae
}, Je = "nav-rail.core.lifecycle", nn = "5.1.0-ES6", He = de({ moduleId: Je });
function Ln(e) {
  return He.get(e);
}
const Si = (e, t, n) => {
  const o = Ln("logger");
  if (!o) return;
  const i = o[e] || o.info;
  typeof i == "function" && i.call(o, `[${Je}]`, t, n || "");
}, ki = typeof window < "u", X = {
  _state: "idle",
  _mountedAt: null,
  STATES: { IDLE: "idle", INITIALIZING: "initializing", MOUNTED: "mounted", READY: "ready", DESTROYED: "destroyed", ERROR: "error" },
  setState(e) {
    const t = this._state;
    this._state = e, ki && window.NavRailTracker && window.NavRailTracker.track && window.NavRailTracker.track("lifecycle:change", { from: t, to: e });
  },
  getState() {
    return this._state;
  },
  isReady() {
    return this._state === this.STATES.READY;
  },
  markMounted() {
    this._mountedAt = Date.now(), this.setState(this.STATES.MOUNTED);
  },
  markReady() {
    this.setState(this.STATES.READY);
  },
  markDestroyed() {
    this.setState(this.STATES.DESTROYED), this._mountedAt = null;
  },
  markError(e) {
    this.setState(this.STATES.ERROR), Si("error", "Lifecycle error", { error: e && e.message ? e.message : e });
  },
  getUptime() {
    return this._mountedAt ? Date.now() - this._mountedAt : 0;
  },
  info() {
    return { state: this._state, mountedAt: this._mountedAt, uptime: this.getUptime(), version: nn, moduleId: Je, portsInitialized: He.isInitialized() };
  },
  healthCheck() {
    const e = Ln("logger");
    return { status: He.isInitialized() ? "HEALTHY" : "DEGRADED", version: nn, moduleId: Je, portsInitialized: He.isInitialized(), checks: { loggerAvailable: !!e } };
  }
}, dt = de({ moduleId: xe }), fe = (e) => dt.get(e), vh = (e) => dt.inject(e), yh = () => dt.snapshot(), wn = () => dt.isInitialized(), Xe = "nav-rail-render", on = "5.1.0-ES6", Nt = $e({ moduleId: Xe });
function Rn(e) {
  return Nt.get(e);
}
const mt = function(e) {
  const t = Rn("logger");
  if (!t) return;
  const n = Array.prototype.slice.call(arguments, 1), o = t[e] || t.info;
  typeof o == "function" && o.apply(t, [`[${Xe}]`].concat(n));
}, ue = { _root: null, _currentMode: "desktop", _initialized: !1, _metrics: { renders: 0, modeChanges: 0, activeItemChanges: 0 }, init(e) {
  return this._initialized && this._root === e ? this : (this._root = e, this._initialized = !0, mt("info", "Render initialized"), this);
}, apply(e) {
  return this._root ? (this._root.innerHTML = e, this._metrics.renders++, this) : (mt("error", "Root element not found"), this);
}, getDesktopNav() {
  return this._root ? this._root.querySelector(".nav-rail--desktop") : null;
}, getMobileNav() {
  return this._root ? this._root.querySelector(".nav-rail--mobile") : null;
}, activateDesktop() {
  const e = this.getDesktopNav(), t = this.getMobileNav();
  return e && (e.style.display = "flex"), t && (t.style.display = "none"), this._currentMode !== "desktop" && (this._currentMode = "desktop", this._metrics.modeChanges++), this._root && (this._root.classList.remove("nav-rail-wrapper--mobile"), this._root.classList.add("nav-rail-wrapper--desktop")), this;
}, activateMobile() {
  const e = this.getDesktopNav(), t = this.getMobileNav();
  return e && (e.style.display = "none"), t && (t.style.display = "flex"), this._currentMode !== "mobile" && (this._currentMode = "mobile", this._metrics.modeChanges++), this._root && (this._root.classList.remove("nav-rail-wrapper--desktop"), this._root.classList.add("nav-rail-wrapper--mobile")), this;
}, getCurrentMode() {
  return this._currentMode;
}, setActiveItem(e) {
  if (this._root && (this._root.querySelectorAll(".nav-rail__item").forEach((t) => {
    t.classList.remove("nav-rail__item--active"), t.removeAttribute("aria-current");
  }), this._root.querySelectorAll(".navrail-btn").forEach((t) => {
    t.classList.remove("is-active"), t.removeAttribute("aria-current");
  })), e && this._root) {
    const t = this._root.querySelector(`[data-item-id="${e}"]`), n = this._root.querySelector(`[data-button-id="${e}"]`);
    t && (t.classList.add("nav-rail__item--active"), t.setAttribute("aria-current", "page")), n && (n.classList.add("is-active"), n.setAttribute("aria-current", "page")), this._metrics.activeItemChanges++;
  }
  return this;
}, getActiveItem() {
  if (!this._root) return null;
  const e = this._root.querySelector(".nav-rail__item--active"), t = this._root.querySelector(".navrail-btn.is-active");
  return e && e.dataset && e.dataset.itemId || t && t.dataset && t.dataset.buttonId || null;
}, destroy() {
  return this._root && (this._root.innerHTML = ""), this._root = null, this._initialized = !1, this._currentMode = "desktop", mt("info", "Render destroyed"), this;
}, healthCheck() {
  const e = Nt.snapshot(), t = Rn("logger"), n = { initialized: this._initialized, hasRoot: !!this._root, hasDesktopNav: !!this.getDesktopNav(), hasMobileNav: !!this.getMobileNav(), validMode: ["desktop", "mobile"].indexOf(this._currentMode) !== -1, loggerAvailable: !!t, portsInitialized: e._initialized }, o = Object.values(n).filter(Boolean).length, i = Object.keys(n).length;
  return { status: o === i ? "HEALTHY" : o >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${o}/${i}`, checks: n, currentMode: this._currentMode, metrics: Object.assign({}, this._metrics), version: on, moduleId: Xe, portsInitialized: e._initialized, timestamp: Date.now() };
}, info() {
  const e = Nt.snapshot();
  return { moduleId: Xe, version: on, initialized: this._initialized, currentMode: this._currentMode, hasRoot: !!this._root, activeItem: this.getActiveItem(), metrics: Object.assign({}, this._metrics), portsInitialized: e._initialized, timestamp: Date.now() };
} }, je = Ne(fe);
async function Li() {
  const e = "/components/nav-rail/styles/index.css";
  if (!document.querySelector(`link[href="${e}"]`))
    return tt.execute(() => new Promise((t, n) => {
      const o = document.createElement("link");
      o.rel = "stylesheet", o.href = e, o.onload = t, o.onerror = () => n(new Error("Failed to load NavRail CSS")), document.head.appendChild(o);
    }), { maxAttempts: 2, baseDelay: 500, serviceName: "css-loader" });
}
async function Bn() {
  try {
    return await tt.execute(
      () => B.load(),
      { maxAttempts: 3, baseDelay: 1e3, serviceName: "registry-api" }
    );
  } catch (e) {
    return je("warn", "Registry load failed, using fallback", { error: e.message }), B._loadFallback(), { success: !0, source: "fallback" };
  }
}
async function ht(e) {
  try {
    e._componentsMounted && await Z.unmountAll();
    const t = B.getItems(), n = await Z.mountAll(e._root, t);
    return e._componentsMounted = !0, je("info", "Components mounted", {
      eager: n.mounted.length,
      failed: n.failed.length,
      lazy: n.lazy ? n.lazy.length : 0
    }), n.failed.length > 0 && je("warn", "Some components failed to mount", { failed: n.failed }), n;
  } catch (t) {
    return je("error", "Component mounting failed", { error: t.message }), x.error(t, { phase: "mount-components" }), e._componentsMounted = !1, { mounted: [], failed: [], lazy: [], error: t.message };
  }
}
const rn = Ne(fe);
async function wi(e) {
  try {
    U.init({
      container: e._root,
      eventBus: fe("eventBus"),
      registry: B,
      config: e._config
    }), e._config.features && Array.isArray(e._config.features) && U.registerFeatures(e._config.features);
    const t = await U.loadEagerFeatures();
    return e._featuresMounted = !0, rn("info", "Features loaded", {
      loaded: t.loaded.length,
      failed: t.failed.length
    }), t;
  } catch (t) {
    return rn("warn", "Feature loader init failed (non-critical)", { error: t.message }), e._featuresMounted = !1, { loaded: [], failed: [] };
  }
}
async function Ri(e) {
  return U.loadFeatureOnDemand(e);
}
function Bi(e) {
  return U.registerFeature(e);
}
function xi(e) {
  return U.registerFeatures(e);
}
function Pi() {
  return U.getLoadedFeatures();
}
function Ui() {
  return U.getFailedFeatures();
}
function Fi(e) {
  return U.isFeatureLoaded(e);
}
const Y = Ne(fe);
function be(e) {
  try {
    const t = B.getGroups(), n = B.getItems(), o = B.getMobileItems(), i = yn.render({ groups: t, items: n, mobileItems: o, config: e._config });
    return ue.apply(i), x.rendered(), e;
  } catch (t) {
    return Y("error", "Render failed", { error: t.message }), x.error(t, { phase: "render" }), e._root && (e._root.innerHTML = '<nav class="nav-rail nav-rail--error" role="navigation"><div class="nav-rail__error">NavRail Error</div></nav>'), e;
  }
}
function zi(e, t) {
  try {
    ue.setActiveItem(t);
  } catch (n) {
    Y("error", "setActiveItem failed", { error: n.message });
  }
  return e;
}
function Vi(e) {
  var t, n, o, i, r, a;
  try {
    return ((o = (n = (t = e._root) == null ? void 0 : t.querySelector(".nav-rail__item--active")) == null ? void 0 : n.dataset) == null ? void 0 : o.itemId) || ((a = (r = (i = e._root) == null ? void 0 : i.querySelector(".navrail-btn.is-active")) == null ? void 0 : r.dataset) == null ? void 0 : a.buttonId) || null;
  } catch (s) {
    return Y("error", "getActiveItem failed", { error: s.message }), null;
  }
}
function Hi(e, t = {}) {
  try {
    e._config = Bt({ ...e._config, ...t }), be(e), ht(e);
  } catch (n) {
    Y("error", "Update failed", { error: n.message });
  }
  return e;
}
async function xn(e) {
  try {
    B.invalidateCache();
    const t = await Bn();
    return e._registrySource = t.source, be(e), await ht(e), Y("info", "NavRail refreshed", { source: e._registrySource }), e;
  } catch (t) {
    return Y("error", "Refresh failed", { error: t.message }), e;
  }
}
async function ji(e, t, n = {}) {
  Y("info", "Performing reinit"), x.track("reinit:start", {});
  try {
    await Pn(e), e._initialized = !1, e._degradedMode = !1, e._errorState = null;
    const o = await Un(e, t || e._root, n || e._config);
    return x.track("reinit:success", {}), o;
  } catch (o) {
    throw Y("error", "Reinit failed", { error: o.message }), x.track("reinit:failed", { error: o.message }), o;
  }
}
async function Pn(e) {
  try {
    await U.destroy();
  } catch (t) {
    Y("warn", "Feature loader destroy failed", { error: t.message });
  }
  try {
    await Z.unmountAll();
  } catch (t) {
    Y("warn", "Component unmount failed during destroy", { error: t.message });
  }
  try {
    Te.destroy();
  } catch {
  }
  try {
    Pe.destroy();
  } catch {
  }
  try {
    ue.destroy();
  } catch {
  }
  X.markDestroyed(), x.destroy(), e._componentsMounted = !1, e._featuresMounted = !1, e._root = null, e._config = null, e._initialized = !1, e._registrySource = null, e._degradedMode = !1, e._errorState = null, Y("info", "Destroyed");
}
const te = Ne(fe);
async function Un(e, t, n) {
  try {
    if (X.setState(X.STATES.INITIALIZING), x.init(), e._root = typeof t == "string" ? document.querySelector(t) : t, !e._root)
      throw new Error("NavRail: root element not found");
    e._config = Bt(n), e._errorState = null, e._degradedMode = !1, await Li();
    const o = await Bn();
    e._registrySource = o.source, ue.init(e._root), Te.init(e._root), be(e), await ht(e), await wi(e), Pe.init(e._root, e._config, (i) => Yi(e, i)), X.markMounted(), X.markReady(), x.ready(), e._initialized = !0;
    try {
      const i = Xn.setup();
      e._runtimeContextSetup = i.ok;
    } catch {
      e._runtimeContextSetup = !1;
    }
    return window.addEventListener("navigation:icons:updated", () => {
      try {
        be(e);
      } catch (i) {
        te("warn", "Icon update re-render failed", i);
      }
    }), window.addEventListener("navigation:items:changed", () => {
      xn(e).catch((i) => {
        te("warn", "Items changed refresh failed", i);
      });
    }), Te.emit(re.READY, {
      version: "5.2.0",
      config: e._config,
      registrySource: e._registrySource,
      degradedMode: e._degradedMode,
      offlineMode: B.isOfflineMode(),
      featuresLoaded: U.getLoadedFeatures().map((i) => i.id),
      runtimeContextSetup: e._runtimeContextSetup
    }), te("info", `v5.2.0 initialized (registry: ${e._registrySource}, degraded: ${e._degradedMode}, offline: ${B.isOfflineMode()}, rc: ${e._runtimeContextSetup})`), e;
  } catch (o) {
    if (e._errorState = { message: o.message, time: Date.now() }, X.markError(o), x.error(o, { phase: "init" }), te("error", "Init failed", { error: o.message }), !e._degradedMode)
      return Gi(e, t, n);
    throw o;
  }
}
async function Gi(e, t, n) {
  te("warn", "Entering degraded mode"), e._degradedMode = !0, x.track("degraded:enter", {});
  try {
    if (e._root = typeof t == "string" ? document.querySelector(t) : t, !e._root) throw new Error("Root not found for degraded mode");
    return e._config = Bt(n), B._loadFallback(), e._registrySource = "fallback-degraded", ue.init(e._root), be(e), e._componentsMounted = !1, e._featuresMounted = !1, X.markMounted(), e._initialized = !0, te("info", "Degraded mode initialized"), x.track("degraded:ready", {}), e;
  } catch (o) {
    throw te("error", "Degraded mode failed", { error: o.message }), x.error(o, { phase: "degraded-init" }), o;
  }
}
function Yi(e, t) {
  try {
    t === "mobile" ? ue.activateMobile() : ue.activateDesktop(), ht(e).catch((n) => {
      te("error", "Failed to remount on mode change", { error: n.message });
    }), x.modeChange(t);
  } catch (n) {
    te("error", "Mode change failed", { error: n.message }), x.error(n, { phase: "mode-change" });
  }
}
const Fn = "5.1.0";
function qi(e) {
  const t = fe("logger"), n = Z.getComponentState(), o = U.healthCheck(), i = {
    initialized: e._initialized,
    componentsMounted: e._componentsMounted,
    featuresMounted: e._featuresMounted,
    hasRoot: !!e._root,
    hasConfig: !!e._config,
    registryLoaded: B.isLoaded(),
    loggerAvailable: !!t,
    notInDegradedMode: !e._degradedMode,
    noErrorState: !e._errorState,
    circuitsClosed: Object.keys(ne._failures).every((c) => !ne.isOpen(c)),
    notRecovering: !ve._isRecovering,
    noFailedComponents: n.failed.length === 0,
    featuresHealthy: o.status !== "UNHEALTHY"
  }, r = Object.values(i).filter(Boolean).length, a = Object.keys(i).length;
  let s = "HEALTHY";
  return e._degradedMode ? s = "DEGRADED" : e._errorState ? s = "ERROR" : n.failed.length > 0 ? s = "DEGRADED" : r < a && (s = r >= a - 2 ? "DEGRADED" : "UNHEALTHY"), {
    status: s,
    score: `${r}/${a}`,
    checks: i,
    degradedMode: e._degradedMode,
    errorState: e._errorState,
    registrySource: e._registrySource,
    offlineMode: B.isOfflineMode(),
    lifecycle: X.info(),
    registry: B.healthCheck(),
    events: Te.healthCheck(),
    components: Z.healthCheck(),
    features: o,
    failedComponents: n.failed,
    metrics: x.getMetrics(),
    mode: ue.getCurrentMode(),
    behaviors: Pe.healthCheck(),
    circuitBreaker: ne.getStatus(),
    recovery: ve.getStatus(),
    version: Fn,
    moduleId: xe,
    portsInitialized: wn(),
    timestamp: Date.now()
  };
}
function Wi(e) {
  var t;
  return {
    moduleId: xe,
    version: Fn,
    initialized: e._initialized,
    componentsMounted: e._componentsMounted,
    featuresMounted: e._featuresMounted,
    registrySource: e._registrySource,
    degradedMode: e._degradedMode,
    offlineMode: B.isOfflineMode(),
    errorState: e._errorState,
    config: e._config,
    root: ((t = e._root) == null ? void 0 : t.tagName) || null,
    events: Te.info(),
    components: Z.info(),
    features: U.info(),
    registry: B.info(),
    behaviors: Pe.info(),
    circuitBreaker: ne.getStatus(),
    recovery: ve.getStatus(),
    capabilities: [
      "init",
      "reinit",
      "refresh",
      "recover",
      "destroy",
      "degradedMode",
      "retryComponent",
      "retryFailed",
      "offlineMode",
      "lazyLoading",
      "loadFeature",
      "registerFeature",
      "registerFeatures"
    ],
    portsInitialized: wn()
  };
}
const sn = Ne(fe);
class zn {
  constructor() {
    this._root = null, this._config = null, this._initialized = !1, this._componentsMounted = !1, this._featuresMounted = !1, this._registrySource = null, this._degradedMode = !1, this._initPromise = null, this._errorState = null;
  }
  init(t, n = {}) {
    return this._initPromise ? (sn("debug", "Init already in progress, returning existing promise"), this._initPromise) : this._initialized ? (sn("info", "Already initialized, performing safe reinit"), this.reinit(t, n)) : (this._initPromise = Un(this, t, n).finally(() => {
      this._initPromise = null;
    }), this._initPromise);
  }
  async loadFeature(t) {
    return Ri(t);
  }
  registerFeature(t) {
    return Bi(t);
  }
  registerFeatures(t) {
    return xi(t);
  }
  getLoadedFeatures() {
    return Pi();
  }
  getFailedFeatures() {
    return Ui();
  }
  isFeatureLoaded(t) {
    return Fi(t);
  }
  render() {
    return be(this);
  }
  setActiveItem(t) {
    return zi(this, t);
  }
  getActiveItem() {
    return Vi(this);
  }
  update(t = {}) {
    return Hi(this, t);
  }
  async refresh() {
    return xn(this);
  }
  async reinit(t, n = {}) {
    return ji(this, t, n);
  }
  async destroy() {
    return Pn(this);
  }
  async retryComponent(t) {
    return Z.retryComponent(t);
  }
  async retryFailed() {
    return Z.retryFailed();
  }
  getFailedComponents() {
    return Z.getFailedComponents();
  }
  async recover() {
    return ve.attemptRecovery(this);
  }
  healthCheck() {
    return qi(this);
  }
  info() {
    return Wi(this);
  }
  get _circuitBreaker() {
    return ne;
  }
  get _recoveryManager() {
    return ve;
  }
  get _retryManager() {
    return tt;
  }
  get _featureLoader() {
    return U;
  }
}
const Dh = "5.3.0-P2-ENTERPRISE", Ut = Ne(fe);
eo(Ut);
to(Ut);
oo(Ut);
const oe = new zn(), Qi = () => new zn();
typeof window < "u" && (Wn() ? Qn("GLOBAL_EXPOSURE_BLOCKED", { module: xe, target: "window.NavRail, window.createNavRail" }) : (window.NavRail = oe, window.createNavRail = Qi), window.__dev = window.__dev || {}, window.__dev.navrail = {
  instance: oe,
  registry: B,
  tracker: x,
  events: Te,
  lifecycle: X,
  componentMounter: Z,
  behaviors: Pe,
  circuitBreaker: ne,
  recoveryManager: ve,
  retryManager: tt,
  featureLoader: U,
  retryComponent: (t) => oe.retryComponent(t),
  retryFailed: () => oe.retryFailed(),
  getFailedComponents: () => oe.getFailedComponents(),
  loadFeature: (t) => oe.loadFeature(t),
  registerFeature: (t) => oe.registerFeature(t),
  getLoadedFeatures: () => oe.getLoadedFeatures()
});
const Mt = "navrail-shared-events", Ki = de({ moduleId: Mt });
function Ft(e) {
  return Ki.get(e);
}
function zt(e) {
  if (!e) return null;
  const t = B.getItem(e);
  return t && t.panelId ? t.panelId : `panel-${e}`;
}
function Vn(e) {
  if (!e) return null;
  const t = B.getItem(e);
  return t ? t.route || null : `#/${e}`;
}
function Zi(e, t, n, o) {
  const i = Ft("eventBus");
  if (!i || !i.emit) return !1;
  const r = n || zt(e), a = t || Vn(e), s = {
    type: Ge.NAVIGATE_PATH,
    itemId: e,
    path: a,
    panelId: r,
    source: o || "navrail",
    timestamp: Date.now()
  };
  return i.emit(Ge.NAVIGATE_PATH, s), !0;
}
function an(e, t, n, o) {
  if (!e) return !1;
  const i = Ft("eventBus"), r = o || zt(n);
  return n && Zi(n, e, r, t), i && i.emit ? (i.emit(Jn.NAVIGATE, {
    path: e,
    options: {
      itemId: n || null,
      panelId: r,
      source: t || Mt
    },
    source: t || Mt,
    timestamp: Date.now()
  }), !0) : typeof window < "u" && window.location ? (window.location.hash = e.indexOf("#") === 0 ? e : `#${e}`, !0) : !1;
}
function Ji(e, t, n) {
  n || (n = {});
  const o = Ft("eventBus");
  let i = null;
  e && e.indexOf("navrail:") === 0 && (i = e.replace("navrail:", ""));
  const r = n.panelId || zt(i), a = n.route || Vn(i);
  if (a || n.route)
    return o && o.emit && o.emit(ae.ACTION, {
      actionId: e,
      source: t,
      timestamp: Date.now(),
      meta: Object.assign({}, n, { panelId: r })
    }), an(a, t, i, r);
  if (i && i !== "toggle-sidebar")
    return o && o.emit && o.emit(ae.ACTION, {
      actionId: e,
      source: t,
      timestamp: Date.now(),
      meta: Object.assign({}, n, { panelId: r, route: a })
    }), an(a, t, i, r);
  if (!o || !o.emit) return !1;
  const s = { actionId: e, source: t, timestamp: Date.now(), meta: n };
  return o.emit(ae.ACTION, s), !0;
}
function Hn(e, t, n, o = []) {
  if (!e || !t || !n) return null;
  e.addEventListener(t, n);
  const i = () => {
    e.removeEventListener(t, n);
  };
  return o.push(i), i;
}
function Xi(e, t, n = []) {
  return !e || !t ? null : Hn(e, "keydown", (i) => {
    (i.key === "Enter" || i.key === " ") && (i.preventDefault(), t(i));
  }, n);
}
function er(e) {
  Array.isArray(e) && (e.forEach((t) => {
    try {
      typeof t == "function" && t();
    } catch {
    }
  }), e.length = 0);
}
const ln = {
  // Navigation
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  navigation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  // Layout
  layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  "layout-dashboard": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
  // Finance
  "dollar-sign": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  // People
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  "user-cog": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="17" cy="17" r="3"/><path d="M17 14v-1m0 8v-1m3-2h1m-8 0h1m.5-2.5l.7-.7m4.6 4.6l.7-.7m-4.6 0l-.7-.7m6-.1l-.7.7"/></svg>',
  // Analytics
  "bar-chart-2": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  "trending-up": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  "pie-chart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  // Documents
  "file-text": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  "book-open": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  // Data
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  // Integrations
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "map-pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  "git-merge": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
  // System
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  "help-circle": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  // Default
  default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
};
function tr(e) {
  return ln[e] || ln.default;
}
const jn = "1.7.0-ES6", nr = "navrail-button-base", Vt = { MOUNTED: "navrail:button:mounted", CLICKED: "navrail:button:clicked", UNMOUNTED: "navrail:button:unmounted" }, et = de({ moduleId: nr });
function or(e) {
  return et.get(e);
}
function V(e) {
  e || (e = {}), this._id = e.id || "unknown", this._label = e.label || "", this._icon = e.icon || "", this._area = "navrail", this._meta = e.meta || {}, this._element = null, this._mounted = !1, this._cleanups = [], this._metrics = { mountCount: 0, clickCount: 0, lastClickAt: null }, this._initialized = !1, this._ctx = null;
}
V.prototype.init = function(e) {
  return this._initialized ? this : (this._ctx = e || {}, this._initialized = !0, this);
};
V.prototype.mount = function(e, t) {
  return t || (t = {}), this._mounted && this._element && this._element.parentNode === e ? this : (this._mounted && this.unmount(), this._element = this._createButton(t), this._attachEvents(), e && e.appendChild(this._element), this._mounted = !0, this._metrics.mountCount++, this._emitTelemetry(Vt.MOUNTED), this);
};
V.prototype._createButton = function(e) {
  e || (e = {});
  const t = document.createElement("button");
  t.type = "button", t.className = `navrail-btn navrail-btn--${this._id}`, t.setAttribute("aria-label", e.label || this._label), t.setAttribute("data-button-id", this._id), t.setAttribute("data-uarps-trigger", `trigger:navrail:${this._id}`), t.setAttribute("tabindex", "0"), t.setAttribute("title", e.label || this._label);
  const n = tr(e.icon || this._icon);
  return t.innerHTML = `<span class="navrail-btn__icon" aria-hidden="true">${n}</span><span class="navrail-btn__label">${e.label || this._label}</span>`, t;
};
V.prototype._attachEvents = function() {
  const e = this;
  this._element && (Hn(this._element, "click", (t) => {
    e._handleClick(t);
  }, this._cleanups), Xi(this._element, (t) => {
    e._handleClick(t);
  }, this._cleanups));
};
V.prototype._handleClick = function(e) {
  e && e.preventDefault && e.preventDefault(), this._metrics.clickCount++, this._metrics.lastClickAt = Date.now();
  const t = `${this._area}:${this._id}`;
  Ji(t, this.getModuleId(), Object.assign({ label: this._label, icon: this._icon }, this._meta)), this._emitTelemetry(Vt.CLICKED);
};
V.prototype._emitTelemetry = function(e) {
  const t = or("eventBus");
  t && t.emit && t.emit(e, { buttonId: this._id, source: this.getModuleId(), timestamp: Date.now() });
};
V.prototype.unmount = function() {
  return this._mounted ? (er(this._cleanups), this._element && this._element.parentNode && this._element.parentNode.removeChild(this._element), this._element = null, this._mounted = !1, this._emitTelemetry(Vt.UNMOUNTED), this) : this;
};
V.prototype.healthCheck = function() {
  const e = { initialized: !!this._initialized, mounted: this._mounted, hasElement: !!this._element, hasId: !!this._id, portsInitialized: et.isInitialized() }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return { status: t === n ? "HEALTHY" : t >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${t}/${n}`, checks: e, portsInitialized: et.isInitialized(), version: jn, moduleId: this.getModuleId() };
};
V.prototype.info = function() {
  return { id: this._id, area: this._area, label: this._label, icon: this._icon, mounted: this._mounted, metrics: Object.assign({}, this._metrics), portsInitialized: et.isInitialized(), version: jn, moduleId: this.getModuleId() };
};
V.prototype.getModuleId = function() {
  return `navrail/components/${this._id}`;
};
V.prototype.getId = function() {
  return this._id;
};
V.prototype.getElement = function() {
  return this._element;
};
V.prototype.isMounted = function() {
  return this._mounted;
};
const _t = /* @__PURE__ */ new Map();
function Gn(e) {
  const t = B.getItem(e);
  return t ? {
    id: t.id,
    label: t.label,
    icon: t.icon,
    area: "navrail",
    group: t.group,
    meta: {
      route: t.route,
      panelId: t.panelId,
      intentId: t.intentId,
      order: t.order
    }
  } : { id: e, label: e, icon: "default", area: "navrail", group: "unknown", meta: {} };
}
function cn(e) {
  const t = B.getItem(e);
  return t ? {
    actionId: `navrail:${t.id}`,
    meta: {
      route: t.route || `#/${t.id}`,
      panelId: t.panelId || `panel-${t.id}`,
      intentId: t.intentId
    }
  } : { actionId: `navrail:${e}`, meta: { route: `#/${e}`, panelId: `panel-${e}` } };
}
function Yn(e) {
  const t = Gn(e);
  return new V(t);
}
function ie(e) {
  return _t.has(e) || _t.set(e, Yn(e)), _t.get(e);
}
function R(e) {
  return {
    VERSION: "3.1.0-ES6",
    MODULE_ID: `navrail/components/${e}`,
    getInstance() {
      return ie(e);
    },
    createButton() {
      return Yn(e);
    },
    init(o) {
      return ie(e).init(o);
    },
    mount(o, i) {
      return ie(e).mount(o, i);
    },
    unmount() {
      return ie(e).unmount();
    },
    healthCheck() {
      return ie(e).healthCheck();
    },
    info() {
      const o = ie(e).info();
      return Object.assign({}, o, {
        actionPayload: cn(e),
        emits: [ae.ACTION],
        factoryGenerated: !0
      });
    },
    getElement() {
      return ie(e).getElement();
    },
    isMounted() {
      return ie(e).isMounted();
    },
    getId() {
      return e;
    },
    BUTTON_CONFIG: Gn(e),
    ACTION_PAYLOAD: cn(e),
    EMITTED_EVENTS: [ae.ACTION]
  };
}
const h = R("admin-settings"), ir = h.VERSION, rr = h.MODULE_ID, sr = h.getInstance, ar = h.createButton, lr = h.init, cr = h.mount, ur = h.unmount, dr = h.healthCheck, hr = h.info, fr = h.getElement, gr = h.isMounted, mr = h.getId, _r = h.BUTTON_CONFIG, Ir = h.ACTION_PAYLOAD, pr = h.EMITTED_EVENTS, Er = {
  AdminSettingsButton: h.getInstance,
  getInstance: h.getInstance,
  createAdminSettingsButton: h.createButton,
  init: h.init,
  mount: h.mount,
  unmount: h.unmount,
  healthCheck: h.healthCheck,
  info: h.info,
  VERSION: h.VERSION,
  MODULE_ID: h.MODULE_ID
}, Or = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ir,
  BUTTON_CONFIG: _r,
  EMITTED_EVENTS: pr,
  MODULE_ID: rr,
  VERSION: ir,
  createAdminSettingsButton: ar,
  default: Er,
  getElement: fr,
  getId: mr,
  getInstance: sr,
  healthCheck: dr,
  info: hr,
  init: lr,
  isMounted: gr,
  mount: cr,
  unmount: ur
}, Symbol.toStringTag, { value: "Module" })), f = R("admin-users"), vr = f.VERSION, yr = f.MODULE_ID, Dr = f.getInstance, Tr = f.createButton, br = f.init, $r = f.mount, Nr = f.unmount, Mr = f.healthCheck, Ar = f.info, Cr = f.getElement, Sr = f.isMounted, kr = f.getId, Lr = f.BUTTON_CONFIG, wr = f.ACTION_PAYLOAD, Rr = f.EMITTED_EVENTS, Br = {
  AdminUsersButton: f.getInstance,
  getInstance: f.getInstance,
  createAdminUsersButton: f.createButton,
  init: f.init,
  mount: f.mount,
  unmount: f.unmount,
  healthCheck: f.healthCheck,
  info: f.info,
  VERSION: f.VERSION,
  MODULE_ID: f.MODULE_ID
}, xr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: wr,
  BUTTON_CONFIG: Lr,
  EMITTED_EVENTS: Rr,
  MODULE_ID: yr,
  VERSION: vr,
  createAdminUsersButton: Tr,
  default: Br,
  getElement: Cr,
  getId: kr,
  getInstance: Dr,
  healthCheck: Mr,
  info: Ar,
  init: br,
  isMounted: Sr,
  mount: $r,
  unmount: Nr
}, Symbol.toStringTag, { value: "Module" })), g = R("analytics"), Pr = g.VERSION, Ur = g.MODULE_ID, Fr = g.getInstance, zr = g.createButton, Vr = g.init, Hr = g.mount, jr = g.unmount, Gr = g.healthCheck, Yr = g.info, qr = g.getElement, Wr = g.isMounted, Qr = g.getId, Kr = g.BUTTON_CONFIG, Zr = g.ACTION_PAYLOAD, Jr = g.EMITTED_EVENTS, Xr = {
  AnalyticsButton: g.getInstance,
  getInstance: g.getInstance,
  createAnalyticsButton: g.createButton,
  init: g.init,
  mount: g.mount,
  unmount: g.unmount,
  healthCheck: g.healthCheck,
  info: g.info,
  VERSION: g.VERSION,
  MODULE_ID: g.MODULE_ID
}, es = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Zr,
  BUTTON_CONFIG: Kr,
  EMITTED_EVENTS: Jr,
  MODULE_ID: Ur,
  VERSION: Pr,
  createAnalyticsButton: zr,
  default: Xr,
  getElement: qr,
  getId: Qr,
  getInstance: Fr,
  healthCheck: Gr,
  info: Yr,
  init: Vr,
  isMounted: Wr,
  mount: Hr,
  unmount: jr
}, Symbol.toStringTag, { value: "Module" })), m = R("api"), ts = m.VERSION, ns = m.MODULE_ID, os = m.getInstance, is = m.createButton, rs = m.init, ss = m.mount, as = m.unmount, ls = m.healthCheck, cs = m.info, us = m.getElement, ds = m.isMounted, hs = m.getId, fs = m.BUTTON_CONFIG, gs = m.ACTION_PAYLOAD, ms = m.EMITTED_EVENTS, _s = {
  ApiButton: m.getInstance,
  getInstance: m.getInstance,
  createApiButton: m.createButton,
  init: m.init,
  mount: m.mount,
  unmount: m.unmount,
  healthCheck: m.healthCheck,
  info: m.info,
  VERSION: m.VERSION,
  MODULE_ID: m.MODULE_ID
}, Is = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: gs,
  BUTTON_CONFIG: fs,
  EMITTED_EVENTS: ms,
  MODULE_ID: ns,
  VERSION: ts,
  createApiButton: is,
  default: _s,
  getElement: us,
  getId: hs,
  getInstance: os,
  healthCheck: ls,
  info: cs,
  init: rs,
  isMounted: ds,
  mount: ss,
  unmount: as
}, Symbol.toStringTag, { value: "Module" })), _ = R("bell"), ps = _.VERSION, Es = _.MODULE_ID, Os = _.getInstance, vs = _.createButton, ys = _.init, Ds = _.mount, Ts = _.unmount, bs = _.healthCheck, $s = _.info, Ns = _.getElement, Ms = _.isMounted, As = _.getId, Cs = _.BUTTON_CONFIG, Ss = _.ACTION_PAYLOAD, ks = _.EMITTED_EVENTS, Ls = {
  BellButton: _.getInstance,
  getInstance: _.getInstance,
  createBellButton: _.createButton,
  init: _.init,
  mount: _.mount,
  unmount: _.unmount,
  healthCheck: _.healthCheck,
  info: _.info,
  VERSION: _.VERSION,
  MODULE_ID: _.MODULE_ID
}, ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ss,
  BUTTON_CONFIG: Cs,
  EMITTED_EVENTS: ks,
  MODULE_ID: Es,
  VERSION: ps,
  createBellButton: vs,
  default: Ls,
  getElement: Ns,
  getId: As,
  getInstance: Os,
  healthCheck: bs,
  info: $s,
  init: ys,
  isMounted: Ms,
  mount: Ds,
  unmount: Ts
}, Symbol.toStringTag, { value: "Module" })), I = R("charts"), Rs = I.VERSION, Bs = I.MODULE_ID, xs = I.getInstance, Ps = I.createButton, Us = I.init, Fs = I.mount, zs = I.unmount, Vs = I.healthCheck, Hs = I.info, js = I.getElement, Gs = I.isMounted, Ys = I.getId, qs = I.BUTTON_CONFIG, Ws = I.ACTION_PAYLOAD, Qs = I.EMITTED_EVENTS, Ks = {
  ChartsButton: I.getInstance,
  getInstance: I.getInstance,
  createChartsButton: I.createButton,
  init: I.init,
  mount: I.mount,
  unmount: I.unmount,
  healthCheck: I.healthCheck,
  info: I.info,
  VERSION: I.VERSION,
  MODULE_ID: I.MODULE_ID
}, Zs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ws,
  BUTTON_CONFIG: qs,
  EMITTED_EVENTS: Qs,
  MODULE_ID: Bs,
  VERSION: Rs,
  createChartsButton: Ps,
  default: Ks,
  getElement: js,
  getId: Ys,
  getInstance: xs,
  healthCheck: Vs,
  info: Hs,
  init: Us,
  isMounted: Gs,
  mount: Fs,
  unmount: zs
}, Symbol.toStringTag, { value: "Module" })), p = R("clientes"), Js = p.VERSION, Xs = p.MODULE_ID, ea = p.getInstance, ta = p.createButton, na = p.init, oa = p.mount, ia = p.unmount, ra = p.healthCheck, sa = p.info, aa = p.getElement, la = p.isMounted, ca = p.getId, ua = p.BUTTON_CONFIG, da = p.ACTION_PAYLOAD, ha = p.EMITTED_EVENTS, fa = {
  ClientesButton: p.getInstance,
  getInstance: p.getInstance,
  createClientesButton: p.createButton,
  init: p.init,
  mount: p.mount,
  unmount: p.unmount,
  healthCheck: p.healthCheck,
  info: p.info,
  VERSION: p.VERSION,
  MODULE_ID: p.MODULE_ID
}, ga = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: da,
  BUTTON_CONFIG: ua,
  EMITTED_EVENTS: ha,
  MODULE_ID: Xs,
  VERSION: Js,
  createClientesButton: ta,
  default: fa,
  getElement: aa,
  getId: ca,
  getInstance: ea,
  healthCheck: ra,
  info: sa,
  init: na,
  isMounted: la,
  mount: oa,
  unmount: ia
}, Symbol.toStringTag, { value: "Module" })), E = R("code"), ma = E.VERSION, _a = E.MODULE_ID, Ia = E.getInstance, pa = E.createButton, Ea = E.init, Oa = E.mount, va = E.unmount, ya = E.healthCheck, Da = E.info, Ta = E.getElement, ba = E.isMounted, $a = E.getId, Na = E.BUTTON_CONFIG, Ma = E.ACTION_PAYLOAD, Aa = E.EMITTED_EVENTS, Ca = {
  CodeButton: E.getInstance,
  getInstance: E.getInstance,
  createCodeButton: E.createButton,
  init: E.init,
  mount: E.mount,
  unmount: E.unmount,
  healthCheck: E.healthCheck,
  info: E.info,
  VERSION: E.VERSION,
  MODULE_ID: E.MODULE_ID
}, Sa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ma,
  BUTTON_CONFIG: Na,
  EMITTED_EVENTS: Aa,
  MODULE_ID: _a,
  VERSION: ma,
  createCodeButton: pa,
  default: Ca,
  getElement: Ta,
  getId: $a,
  getInstance: Ia,
  healthCheck: ya,
  info: Da,
  init: Ea,
  isMounted: ba,
  mount: Oa,
  unmount: va
}, Symbol.toStringTag, { value: "Module" })), O = R("comercial"), ka = O.VERSION, La = O.MODULE_ID, wa = O.getInstance, Ra = O.createButton, Ba = O.init, xa = O.mount, Pa = O.unmount, Ua = O.healthCheck, Fa = O.info, za = O.getElement, Va = O.isMounted, Ha = O.getId, ja = O.BUTTON_CONFIG, Ga = O.ACTION_PAYLOAD, Ya = O.EMITTED_EVENTS, qa = {
  ComercialButton: O.getInstance,
  getInstance: O.getInstance,
  createComercialButton: O.createButton,
  init: O.init,
  mount: O.mount,
  unmount: O.unmount,
  healthCheck: O.healthCheck,
  info: O.info,
  VERSION: O.VERSION,
  MODULE_ID: O.MODULE_ID
}, Wa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ga,
  BUTTON_CONFIG: ja,
  EMITTED_EVENTS: Ya,
  MODULE_ID: La,
  VERSION: ka,
  createComercialButton: Ra,
  default: qa,
  getElement: za,
  getId: Ha,
  getInstance: wa,
  healthCheck: Ua,
  info: Fa,
  init: Ba,
  isMounted: Va,
  mount: xa,
  unmount: Pa
}, Symbol.toStringTag, { value: "Module" })), v = R("dashboard"), Qa = v.VERSION, Ka = v.MODULE_ID, Za = v.getInstance, Ja = v.createButton, Xa = v.init, el = v.mount, tl = v.unmount, nl = v.healthCheck, ol = v.info, il = v.getElement, rl = v.isMounted, sl = v.getId, al = v.BUTTON_CONFIG, ll = v.ACTION_PAYLOAD, cl = v.EMITTED_EVENTS, ul = {
  DashboardButton: v.getInstance,
  getInstance: v.getInstance,
  createDashboardButton: v.createButton,
  init: v.init,
  mount: v.mount,
  unmount: v.unmount,
  healthCheck: v.healthCheck,
  info: v.info,
  VERSION: v.VERSION,
  MODULE_ID: v.MODULE_ID
}, dl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: ll,
  BUTTON_CONFIG: al,
  EMITTED_EVENTS: cl,
  MODULE_ID: Ka,
  VERSION: Qa,
  createDashboardButton: Ja,
  default: ul,
  getElement: il,
  getId: sl,
  getInstance: Za,
  healthCheck: nl,
  info: ol,
  init: Xa,
  isMounted: rl,
  mount: el,
  unmount: tl
}, Symbol.toStringTag, { value: "Module" })), y = R("database"), hl = y.VERSION, fl = y.MODULE_ID, gl = y.getInstance, ml = y.createButton, _l = y.init, Il = y.mount, pl = y.unmount, El = y.healthCheck, Ol = y.info, vl = y.getElement, yl = y.isMounted, Dl = y.getId, Tl = y.BUTTON_CONFIG, bl = y.ACTION_PAYLOAD, $l = y.EMITTED_EVENTS, Nl = {
  DatabaseButton: y.getInstance,
  getInstance: y.getInstance,
  createDatabaseButton: y.createButton,
  init: y.init,
  mount: y.mount,
  unmount: y.unmount,
  healthCheck: y.healthCheck,
  info: y.info,
  VERSION: y.VERSION,
  MODULE_ID: y.MODULE_ID
}, Ml = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: bl,
  BUTTON_CONFIG: Tl,
  EMITTED_EVENTS: $l,
  MODULE_ID: fl,
  VERSION: hl,
  createDatabaseButton: ml,
  default: Nl,
  getElement: vl,
  getId: Dl,
  getInstance: gl,
  healthCheck: El,
  info: Ol,
  init: _l,
  isMounted: yl,
  mount: Il,
  unmount: pl
}, Symbol.toStringTag, { value: "Module" })), D = R("docs"), Al = D.VERSION, Cl = D.MODULE_ID, Sl = D.getInstance, kl = D.createButton, Ll = D.init, wl = D.mount, Rl = D.unmount, Bl = D.healthCheck, xl = D.info, Pl = D.getElement, Ul = D.isMounted, Fl = D.getId, zl = D.BUTTON_CONFIG, Vl = D.ACTION_PAYLOAD, Hl = D.EMITTED_EVENTS, jl = {
  DocsButton: D.getInstance,
  getInstance: D.getInstance,
  createDocsButton: D.createButton,
  init: D.init,
  mount: D.mount,
  unmount: D.unmount,
  healthCheck: D.healthCheck,
  info: D.info,
  VERSION: D.VERSION,
  MODULE_ID: D.MODULE_ID
}, Gl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Vl,
  BUTTON_CONFIG: zl,
  EMITTED_EVENTS: Hl,
  MODULE_ID: Cl,
  VERSION: Al,
  createDocsButton: kl,
  default: jl,
  getElement: Pl,
  getId: Fl,
  getInstance: Sl,
  healthCheck: Bl,
  info: xl,
  init: Ll,
  isMounted: Ul,
  mount: wl,
  unmount: Rl
}, Symbol.toStringTag, { value: "Module" })), T = R("financeiro"), Yl = T.VERSION, ql = T.MODULE_ID, Wl = T.getInstance, Ql = T.createButton, Kl = T.init, Zl = T.mount, Jl = T.unmount, Xl = T.healthCheck, ec = T.info, tc = T.getElement, nc = T.isMounted, oc = T.getId, ic = T.BUTTON_CONFIG, rc = T.ACTION_PAYLOAD, sc = T.EMITTED_EVENTS, ac = {
  FinanceiroButton: T.getInstance,
  getInstance: T.getInstance,
  createFinanceiroButton: T.createButton,
  init: T.init,
  mount: T.mount,
  unmount: T.unmount,
  healthCheck: T.healthCheck,
  info: T.info,
  VERSION: T.VERSION,
  MODULE_ID: T.MODULE_ID
}, lc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: rc,
  BUTTON_CONFIG: ic,
  EMITTED_EVENTS: sc,
  MODULE_ID: ql,
  VERSION: Yl,
  createFinanceiroButton: Ql,
  default: ac,
  getElement: tc,
  getId: oc,
  getInstance: Wl,
  healthCheck: Xl,
  info: ec,
  init: Kl,
  isMounted: nc,
  mount: Zl,
  unmount: Jl
}, Symbol.toStringTag, { value: "Module" })), b = R("folder"), cc = b.VERSION, uc = b.MODULE_ID, dc = b.getInstance, hc = b.createButton, fc = b.init, gc = b.mount, mc = b.unmount, _c = b.healthCheck, Ic = b.info, pc = b.getElement, Ec = b.isMounted, Oc = b.getId, vc = b.BUTTON_CONFIG, yc = b.ACTION_PAYLOAD, Dc = b.EMITTED_EVENTS, Tc = {
  FolderButton: b.getInstance,
  getInstance: b.getInstance,
  createFolderButton: b.createButton,
  init: b.init,
  mount: b.mount,
  unmount: b.unmount,
  healthCheck: b.healthCheck,
  info: b.info,
  VERSION: b.VERSION,
  MODULE_ID: b.MODULE_ID
}, bc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: yc,
  BUTTON_CONFIG: vc,
  EMITTED_EVENTS: Dc,
  MODULE_ID: uc,
  VERSION: cc,
  createFolderButton: hc,
  default: Tc,
  getElement: pc,
  getId: Oc,
  getInstance: dc,
  healthCheck: _c,
  info: Ic,
  init: fc,
  isMounted: Ec,
  mount: gc,
  unmount: mc
}, Symbol.toStringTag, { value: "Module" })), $ = R("header-admin"), $c = $.VERSION, Nc = $.MODULE_ID, Mc = $.getInstance, Ac = $.createButton, Cc = $.init, Sc = $.mount, kc = $.unmount, Lc = $.healthCheck, wc = $.info, Rc = $.getElement, Bc = $.isMounted, xc = $.getId, Pc = $.BUTTON_CONFIG, Uc = $.ACTION_PAYLOAD, Fc = $.EMITTED_EVENTS, zc = {
  HeaderAdminButton: $.getInstance,
  getInstance: $.getInstance,
  createHeaderAdminButton: $.createButton,
  init: $.init,
  mount: $.mount,
  unmount: $.unmount,
  healthCheck: $.healthCheck,
  info: $.info,
  VERSION: $.VERSION,
  MODULE_ID: $.MODULE_ID
}, Vc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Uc,
  BUTTON_CONFIG: Pc,
  EMITTED_EVENTS: Fc,
  MODULE_ID: Nc,
  VERSION: $c,
  createHeaderAdminButton: Ac,
  default: zc,
  getElement: Rc,
  getId: xc,
  getInstance: Mc,
  healthCheck: Lc,
  info: wc,
  init: Cc,
  isMounted: Bc,
  mount: Sc,
  unmount: kc
}, Symbol.toStringTag, { value: "Module" })), N = R("help"), Hc = N.VERSION, jc = N.MODULE_ID, Gc = N.getInstance, Yc = N.createButton, qc = N.init, Wc = N.mount, Qc = N.unmount, Kc = N.healthCheck, Zc = N.info, Jc = N.getElement, Xc = N.isMounted, eu = N.getId, tu = N.BUTTON_CONFIG, nu = N.ACTION_PAYLOAD, ou = N.EMITTED_EVENTS, iu = {
  HelpButton: N.getInstance,
  getInstance: N.getInstance,
  createHelpButton: N.createButton,
  init: N.init,
  mount: N.mount,
  unmount: N.unmount,
  healthCheck: N.healthCheck,
  info: N.info,
  VERSION: N.VERSION,
  MODULE_ID: N.MODULE_ID
}, ru = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: nu,
  BUTTON_CONFIG: tu,
  EMITTED_EVENTS: ou,
  MODULE_ID: jc,
  VERSION: Hc,
  createHelpButton: Yc,
  default: iu,
  getElement: Jc,
  getId: eu,
  getInstance: Gc,
  healthCheck: Kc,
  info: Zc,
  init: qc,
  isMounted: Xc,
  mount: Wc,
  unmount: Qc
}, Symbol.toStringTag, { value: "Module" })), M = R("home"), su = M.VERSION, au = M.MODULE_ID, lu = M.getInstance, cu = M.createButton, uu = M.init, du = M.mount, hu = M.unmount, fu = M.healthCheck, gu = M.info, mu = M.getElement, _u = M.isMounted, Iu = M.getId, pu = M.BUTTON_CONFIG, Eu = M.ACTION_PAYLOAD, Ou = M.EMITTED_EVENTS, vu = {
  HomeButton: M.getInstance,
  getInstance: M.getInstance,
  createHomeButton: M.createButton,
  init: M.init,
  mount: M.mount,
  unmount: M.unmount,
  healthCheck: M.healthCheck,
  info: M.info,
  VERSION: M.VERSION,
  MODULE_ID: M.MODULE_ID
}, yu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Eu,
  BUTTON_CONFIG: pu,
  EMITTED_EVENTS: Ou,
  MODULE_ID: au,
  VERSION: su,
  createHomeButton: cu,
  default: vu,
  getElement: mu,
  getId: Iu,
  getInstance: lu,
  healthCheck: fu,
  info: gu,
  init: uu,
  isMounted: _u,
  mount: du,
  unmount: hu
}, Symbol.toStringTag, { value: "Module" })), A = R("location"), Du = A.VERSION, Tu = A.MODULE_ID, bu = A.getInstance, $u = A.createButton, Nu = A.init, Mu = A.mount, Au = A.unmount, Cu = A.healthCheck, Su = A.info, ku = A.getElement, Lu = A.isMounted, wu = A.getId, Ru = A.BUTTON_CONFIG, Bu = A.ACTION_PAYLOAD, xu = A.EMITTED_EVENTS, Pu = {
  LocationButton: A.getInstance,
  getInstance: A.getInstance,
  createLocationButton: A.createButton,
  init: A.init,
  mount: A.mount,
  unmount: A.unmount,
  healthCheck: A.healthCheck,
  info: A.info,
  VERSION: A.VERSION,
  MODULE_ID: A.MODULE_ID
}, Uu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Bu,
  BUTTON_CONFIG: Ru,
  EMITTED_EVENTS: xu,
  MODULE_ID: Tu,
  VERSION: Du,
  createLocationButton: $u,
  default: Pu,
  getElement: ku,
  getId: wu,
  getInstance: bu,
  healthCheck: Cu,
  info: Su,
  init: Nu,
  isMounted: Lu,
  mount: Mu,
  unmount: Au
}, Symbol.toStringTag, { value: "Module" })), C = R("navrail-admin"), Fu = C.VERSION, zu = C.MODULE_ID, Vu = C.getInstance, Hu = C.createButton, ju = C.init, Gu = C.mount, Yu = C.unmount, qu = C.healthCheck, Wu = C.info, Qu = C.getElement, Ku = C.isMounted, Zu = C.getId, Ju = C.BUTTON_CONFIG, Xu = C.ACTION_PAYLOAD, ed = C.EMITTED_EVENTS, td = {
  NavrailAdminButton: C.getInstance,
  getInstance: C.getInstance,
  createNavrailAdminButton: C.createButton,
  init: C.init,
  mount: C.mount,
  unmount: C.unmount,
  healthCheck: C.healthCheck,
  info: C.info,
  VERSION: C.VERSION,
  MODULE_ID: C.MODULE_ID
}, nd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Xu,
  BUTTON_CONFIG: Ju,
  EMITTED_EVENTS: ed,
  MODULE_ID: zu,
  VERSION: Fu,
  createNavrailAdminButton: Hu,
  default: td,
  getElement: Qu,
  getId: Zu,
  getInstance: Vu,
  healthCheck: qu,
  info: Wu,
  init: ju,
  isMounted: Ku,
  mount: Gu,
  unmount: Yu
}, Symbol.toStringTag, { value: "Module" })), S = R("pipedrive"), od = S.VERSION, id = S.MODULE_ID, rd = S.getInstance, sd = S.createButton, ad = S.init, ld = S.mount, cd = S.unmount, ud = S.healthCheck, dd = S.info, hd = S.getElement, fd = S.isMounted, gd = S.getId, md = S.BUTTON_CONFIG, _d = S.ACTION_PAYLOAD, Id = S.EMITTED_EVENTS, pd = {
  PipedriveButton: S.getInstance,
  getInstance: S.getInstance,
  createPipedriveButton: S.createButton,
  init: S.init,
  mount: S.mount,
  unmount: S.unmount,
  healthCheck: S.healthCheck,
  info: S.info,
  VERSION: S.VERSION,
  MODULE_ID: S.MODULE_ID
}, Ed = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: _d,
  BUTTON_CONFIG: md,
  EMITTED_EVENTS: Id,
  MODULE_ID: id,
  VERSION: od,
  createPipedriveButton: sd,
  default: pd,
  getElement: hd,
  getId: gd,
  getInstance: rd,
  healthCheck: ud,
  info: dd,
  init: ad,
  isMounted: fd,
  mount: ld,
  unmount: cd
}, Symbol.toStringTag, { value: "Module" })), k = R("relatorios"), Od = k.VERSION, vd = k.MODULE_ID, yd = k.getInstance, Dd = k.createButton, Td = k.init, bd = k.mount, $d = k.unmount, Nd = k.healthCheck, Md = k.info, Ad = k.getElement, Cd = k.isMounted, Sd = k.getId, kd = k.BUTTON_CONFIG, Ld = k.ACTION_PAYLOAD, wd = k.EMITTED_EVENTS, Rd = {
  RelatoriosButton: k.getInstance,
  getInstance: k.getInstance,
  createRelatoriosButton: k.createButton,
  init: k.init,
  mount: k.mount,
  unmount: k.unmount,
  healthCheck: k.healthCheck,
  info: k.info,
  VERSION: k.VERSION,
  MODULE_ID: k.MODULE_ID
}, Bd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Ld,
  BUTTON_CONFIG: kd,
  EMITTED_EVENTS: wd,
  MODULE_ID: vd,
  VERSION: Od,
  createRelatoriosButton: Dd,
  default: Rd,
  getElement: Ad,
  getId: Sd,
  getInstance: yd,
  healthCheck: Nd,
  info: Md,
  init: Td,
  isMounted: Cd,
  mount: bd,
  unmount: $d
}, Symbol.toStringTag, { value: "Module" })), L = R("toggle-sidebar"), xd = L.VERSION, Pd = L.MODULE_ID, Ud = L.getInstance, Fd = L.createButton, zd = L.init, Vd = L.mount, Hd = L.unmount, jd = L.healthCheck, Gd = L.info, Yd = L.getElement, qd = L.isMounted, Wd = L.getId, Qd = L.BUTTON_CONFIG, Kd = L.ACTION_PAYLOAD, Zd = L.EMITTED_EVENTS, Jd = {
  ToggleSidebarButton: L.getInstance,
  getInstance: L.getInstance,
  createToggleSidebarButton: L.createButton,
  init: L.init,
  mount: L.mount,
  unmount: L.unmount,
  healthCheck: L.healthCheck,
  info: L.info,
  VERSION: L.VERSION,
  MODULE_ID: L.MODULE_ID
}, Xd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: Kd,
  BUTTON_CONFIG: Qd,
  EMITTED_EVENTS: Zd,
  MODULE_ID: Pd,
  VERSION: xd,
  createToggleSidebarButton: Fd,
  default: Jd,
  getElement: Yd,
  getId: Wd,
  getInstance: Ud,
  healthCheck: jd,
  info: Gd,
  init: zd,
  isMounted: qd,
  mount: Vd,
  unmount: Hd
}, Symbol.toStringTag, { value: "Module" })), w = R("uarps-monitor"), eh = w.VERSION, th = w.MODULE_ID, nh = w.getInstance, oh = w.createButton, ih = w.init, rh = w.mount, sh = w.unmount, ah = w.healthCheck, lh = w.info, ch = w.getElement, uh = w.isMounted, dh = w.getId, hh = w.BUTTON_CONFIG, fh = w.ACTION_PAYLOAD, gh = w.EMITTED_EVENTS, mh = {
  UarpsMonitorButton: w.getInstance,
  getInstance: w.getInstance,
  createUarpsMonitorButton: w.createButton,
  init: w.init,
  mount: w.mount,
  unmount: w.unmount,
  healthCheck: w.healthCheck,
  info: w.info,
  VERSION: w.VERSION,
  MODULE_ID: w.MODULE_ID
}, _h = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ACTION_PAYLOAD: fh,
  BUTTON_CONFIG: hh,
  EMITTED_EVENTS: gh,
  MODULE_ID: th,
  VERSION: eh,
  createUarpsMonitorButton: oh,
  default: mh,
  getElement: ch,
  getId: dh,
  getInstance: nh,
  healthCheck: ah,
  info: lh,
  init: ih,
  isMounted: uh,
  mount: rh,
  unmount: sh
}, Symbol.toStringTag, { value: "Module" }));
export {
  ne as CircuitBreaker,
  Be as FEATURE_EVENTS,
  xe as MODULE_ID,
  Dh as NAVRAIL_VERSION,
  oe as NavRail,
  Pe as NavRailBehaviors,
  Z as NavRailComponentMounter,
  Te as NavRailEvents,
  U as NavRailFeatureLoader,
  B as NavRailRegistry,
  x as NavRailTracker,
  ve as RecoveryManager,
  tt as RetryManager,
  Dh as VERSION,
  Qi as createNavRail,
  oe as default,
  yh as getPorts,
  vh as injectPorts
};
