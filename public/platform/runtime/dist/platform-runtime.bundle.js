import { createCorePorts as Ie } from "/core/runtime/ports-profiles.js";
import { ERROR_BOUNDARY_EVENTS as _e } from "/core/runtime/events/catalog/error-boundary.events.js";
import { PERFORMANCE_EVENTS as B } from "/core/runtime/events/catalog/performance.events.js";
import { STATE_EVENTS as F } from "/core/runtime/events/catalog/state.events.js";
const j = "3.2.0-P2-ENTERPRISE", H = "platform-error-boundary", c = [], Ye = 100;
let T = null, te = null;
function ze(e) {
  return e || (e = {}), T = e.eventBus || null, te = e.onError || null, Oe(_e.INIT, { version: j }), { version: j, moduleId: H };
}
function G(e, n) {
  n || (n = {});
  const t = {
    id: c.length + 1,
    message: String(e && e.message || e),
    stack: e && e.stack ? e.stack.substring(0, 500) : null,
    context: n,
    timestamp: Date.now(),
    source: n.source || "unknown"
  };
  if (c.push(t), c.length > Ye && c.shift(), Oe(_e.CAPTURED, { error: t.message, source: t.source }), te)
    try {
      te(t);
    } catch {
    }
  return t;
}
function qe(e, n) {
  return n || (n = {}), e.catch((t) => {
    throw G(t, n), t;
  });
}
function Xe(e, n) {
  return n || (n = {}), function(...t) {
    try {
      return e.apply(this, t);
    } catch (r) {
      throw G(r, n), r;
    }
  };
}
function Ze(e, n) {
  return n || (n = {}), function() {
    const t = arguments, r = this;
    return Promise.resolve().then(() => e.apply(r, t)).catch((i) => {
      throw G(i, n), i;
    });
  };
}
function Je(e) {
  return e || (e = 10), c.slice(-e);
}
function re() {
  return c[c.length - 1] || null;
}
function Ke() {
  c.length = 0;
}
function Qe() {
  return c.length;
}
function Oe(e, n) {
  n || (n = {}), T && T.emit && T.emit(e, Object.assign({}, n, { source: H, timestamp: Date.now() }));
}
function We() {
  return { version: j, moduleId: H, errorCount: c.length, lastError: re() ? re().message : null };
}
var oe = { VERSION: j, MODULE_ID: H, init: ze, capture: G, captureAsync: qe, wrapFunction: Xe, wrapAsync: Ze, getErrors: Je, getLastError: re, clearErrors: Ke, getErrorCount: Qe, info: We };
const Y = "3.1.0-P2-ENTERPRISE", A = "platform-event-domains", d = {
  PLATFORM: "platform",
  SHELL: "shell",
  ROUTER: "router",
  LAYOUT: "layout",
  CANVAS: "canvas",
  AUTH: "auth",
  STATE: "state",
  MF: "mf"
}, xe = {
  INIT: "platform:init",
  READY: "platform:ready",
  ERROR: "platform:error",
  NAVIGATION_START: "platform:navigation:start",
  NAVIGATION_END: "platform:navigation:end",
  APP_LOADING: "platform:app:loading",
  APP_LOADED: "platform:app:loaded",
  APP_MOUNTED: "platform:app:mounted",
  APP_UNMOUNTED: "platform:app:unmounted",
  APP_ERROR: "platform:app:error"
}, en = {
  HEADER_READY: "shell:header:ready",
  SIDEBAR_READY: "shell:sidebar:ready",
  SIDEBAR_TOGGLE: "shell:sidebar:toggle",
  FOOTER_READY: "shell:footer:ready",
  LAYOUT_CHANGE: "shell:layout:change"
}, nn = {
  INIT(e) {
    return `mf:${e}:init`;
  },
  READY(e) {
    return `mf:${e}:ready`;
  },
  ERROR(e) {
    return `mf:${e}:error`;
  },
  STATE_CHANGE(e) {
    return `mf:${e}:state:change`;
  },
  ACTION(e, n) {
    return `mf:${e}:action:${n}`;
  }
};
let s = null;
const he = /* @__PURE__ */ new Map();
let R = [];
function tn(e) {
  return e || (e = {}), s = e.eventBus || null, Object.keys(d).forEach((n) => {
    he.set(d[n], /* @__PURE__ */ new Set());
  }), { version: Y, moduleId: A };
}
function Re(e, n, t) {
  t || (t = {});
  const r = n.indexOf(`${e}:`) === 0 ? n : `${e}:${n}`;
  s && s.emit && s.emit(r, Object.assign({}, t, { domain: e, source: A, timestamp: Date.now() }));
}
function ve(e, n, t) {
  if (typeof t != "function") return () => {
  };
  const r = n.indexOf(`${e}:`) === 0 ? n : `${e}:${n}`;
  if (s && s.on) {
    s.on(r, t);
    const i = () => {
      s && s.off && s.off(r, t);
    };
    return R.push({ event: r, domain: e, registeredAt: Date.now(), cleanup: i }), i;
  }
  return () => {
  };
}
function rn(e, n, t) {
  t || (t = {}), Re(d.MF, `${e}:${n}`, Object.assign({ appId: e }, t));
}
function on(e, n, t) {
  return ve(d.MF, `${e}:${n}`, t);
}
function sn() {
  return Object.assign({}, d);
}
function an() {
  R.forEach((e) => {
    if (e.cleanup) try {
      e.cleanup();
    } catch {
    }
  }), R = [], he.clear(), s = null;
}
function ln() {
  return {
    status: s ? "HEALTHY" : "NOT_INITIALIZED",
    version: Y,
    moduleId: A,
    longLived: !0,
    listeners: R.length,
    domains: Object.keys(d).length,
    hasEventBus: !!s,
    p21Compliant: !0,
    timestamp: Date.now()
  };
}
function un() {
  return {
    version: Y,
    moduleId: A,
    domains: Object.keys(d),
    longLived: !0,
    listeners: R.length,
    hasEventBus: !!s,
    p21Compliant: !0
  };
}
var se = { VERSION: Y, MODULE_ID: A, DOMAINS: d, PLATFORM_EVENTS: xe, SHELL_EVENTS: en, MF_EVENTS: nn, init: tn, emit: Re, on: ve, emitMf: rn, onMf: on, getDomains: sn, destroy: an, healthCheck: ln, info: un };
const cn = "3.1.0-P2-ENTERPRISE", fn = "platform-federation-loader";
let m = {}, I = {};
function ae(e) {
  const n = e && e.id;
  if (!n) return Promise.reject(new Error("App config must have id"));
  if (m[n]) return Promise.resolve(m[n]);
  if (I[n]) return I[n];
  const t = Promise.resolve().then(() => {
    const r = e.entry;
    if (!r) throw new Error(`No entry point for app ${n}`);
    return import(r);
  }).then((r) => {
    const i = { id: n, module: r, config: e, loadedAt: Date.now(), status: "loaded" };
    return m[n] = i, delete I[n], i;
  }).catch((r) => (delete I[n], { id: n, module: null, config: e, error: r.message, status: "failed", fallback: e.panelFallback }));
  return I[n] = t, t;
}
function pn(e) {
  const n = m[e];
  return n ? Promise.resolve().then(() => {
    if (n.module && n.module.destroy) return n.module.destroy();
  }).then(() => (delete m[e], !0)) : Promise.resolve(!1);
}
function mn(e) {
  return ae(e);
}
function dn(e) {
  return m[e] || null;
}
function gn() {
  return Object.keys(m);
}
function En(e) {
  return !!m[e];
}
function yn() {
  m = {}, I = {};
}
var De = { VERSION: cn, MODULE_ID: fn, loadMicroapp: ae, unloadMicroapp: pn, preloadMicroapp: mn, getMicroappInfo: dn, getLoadedApps: gn, isLoaded: En, clearCache: yn };
const Ae = "3.3.0-P2-ENTERPRISE", be = "manifest-v3", u = Object.freeze([
  { id: "login", type: "page", entry: "/platform/pages/login-mfe/entry.js", routes: ["/login"], permissions: [], layout: "minimal", region: "main", priority: 1 },
  { id: "logout", type: "page", entry: "/platform/pages/logout-mfe/entry.js", routes: ["/logout"], permissions: [], layout: "minimal", region: "main", priority: 1 },
  { id: "forbidden", type: "page", entry: "/platform/pages/forbidden-mfe/entry.js", routes: ["/forbidden", "/403"], permissions: [], layout: "minimal", region: "main", priority: 1 },
  { id: "notfound", type: "page", entry: "/platform/pages/notfound-mfe/entry.js", routes: ["/404", "/notfound"], permissions: [], layout: "minimal", region: "main", priority: 1 },
  { id: "maintenance", type: "page", entry: "/platform/pages/maintenance-mfe/entry.js", routes: ["/maintenance"], permissions: [], layout: "minimal", region: "main", priority: 1 },
  { id: "dashboard", type: "domain", entry: "/platform/domains/dashboard-mfe/entry.js", routes: ["/", "/geral", "/dashboard", "/home", "/principal"], permissions: ["view-dashboard"], layout: "default", region: "main", priority: 1, preload: !0, panelFallback: "panel-01" },
  { id: "rh", type: "domain", entry: "/platform/domains/rh-mfe/entry.js", routes: ["/rh-pessoas", "/rh", "/colaboradores"], permissions: ["view-rh"], layout: "full", region: "main", priority: 2, panelFallback: "panel-06" },
  { id: "financeiro", type: "domain", entry: "/platform/domains/financeiro-mfe/entry.js", routes: ["/financeiro"], permissions: ["view-financeiro"], layout: "default", region: "main", priority: 3, panelFallback: "panel-10" },
  { id: "clientes", type: "domain", entry: "/platform/domains/clientes-mfe/entry.js", routes: ["/clientes"], permissions: ["view-clientes"], layout: "default", region: "main", priority: 4, panelFallback: "panel-05" },
  { id: "operacional", type: "domain", entry: "/platform/domains/operacional-mfe/entry.js", routes: ["/operacional", "/servidores"], permissions: ["view-operacional"], layout: "default", region: "main", priority: 5, panelFallback: "panel-03" },
  { id: "comercial", type: "domain", entry: "/platform/domains/comercial-mfe/entry.js", routes: ["/comercial", "/orcamento-clientes"], permissions: ["view-comercial"], layout: "default", region: "main", priority: 6, panelFallback: "panel-07" },
  { id: "compras", type: "domain", entry: "/platform/domains/compras-mfe/entry.js", routes: ["/compras", "/fornecedores"], permissions: ["view-compras"], layout: "default", region: "main", priority: 7, panelFallback: "panel-08" },
  { id: "produtos", type: "domain", entry: "/platform/domains/produtos-mfe/entry.js", routes: ["/produtos", "/bling"], permissions: ["view-produtos"], layout: "default", region: "main", priority: 8, panelFallback: "panel-04" },
  { id: "integracoes", type: "domain", entry: "/platform/domains/integracoes-mfe/entry.js", routes: ["/google-drive", "/pipedrive"], permissions: ["view-integracoes"], layout: "default", region: "main", priority: 9, panelFallback: "panel-12" },
  { id: "marketing", type: "domain", entry: "/platform/domains/marketing-mfe/entry.js", routes: ["/instagram", "/google-ads"], permissions: ["view-marketing"], layout: "default", region: "main", priority: 10, panelFallback: "panel-12" },
  { id: "automacoes", type: "domain", entry: "/platform/domains/automacoes-mfe/entry.js", routes: ["/automacoes"], permissions: ["view-automacoes"], layout: "default", region: "main", priority: 11, panelFallback: "panel-03" },
  { id: "juridico", type: "domain", entry: "/platform/domains/juridico-mfe/entry.js", routes: ["/contratos"], permissions: ["view-juridico"], layout: "default", region: "main", priority: 12, panelFallback: "panel-01" },
  { id: "panel-01", type: "panel", entry: "/platform/panels/panel-01/entry.js", name: "Dashboard Principal" },
  { id: "panel-03", type: "panel", entry: "/platform/panels/panel-03/entry.js", name: "Operacional" },
  { id: "panel-04", type: "panel", entry: "/platform/panels/panel-04/entry.js", name: "Produtos/Bling" },
  { id: "panel-05", type: "panel", entry: "/platform/panels/panel-05/entry.js", name: "Clientes" },
  { id: "panel-06", type: "panel", entry: "/platform/panels/panel-06/entry.js", name: "RH" },
  { id: "panel-07", type: "panel", entry: "/platform/panels/panel-07/entry.js", name: "Comercial" },
  { id: "panel-08", type: "panel", entry: "/platform/panels/panel-08/entry.js", name: "Compras" },
  { id: "panel-10", type: "panel", entry: "/platform/panels/panel-10/entry.js", name: "Financeiro" },
  { id: "panel-12", type: "panel", entry: "/platform/panels/panel-12/entry.js", name: "Integrações" }
]), g = {};
function In() {
  Object.keys(g).length > 0 || u.forEach((e) => {
    e.routes && e.routes.forEach((n) => {
      const t = n.replace(/^\/+/, "").toLowerCase() || "/";
      g[t] = e, g[`/${t}`] = e;
    });
  });
}
function _n() {
  return u.slice();
}
function Me(e) {
  for (let n = 0; n < u.length; n++)
    if (u[n].id === e) return u[n];
  return null;
}
function z(e) {
  return u.filter((n) => n.type === e);
}
function Se() {
  return z("page");
}
function Te() {
  return z("domain");
}
function Ne() {
  return z("panel");
}
function Pe(e) {
  In();
  const n = (e || "/").replace(/^\/+/, "").toLowerCase() || "/";
  if (g[n]) return g[n];
  if (g[`/${n}`]) return g[`/${n}`];
  for (let t = 0; t < u.length; t++) {
    const r = u[t];
    if (r.routes)
      for (let i = 0; i < r.routes.length; i++) {
        const o = r.routes[i];
        if (o.indexOf("*") !== -1 && n.indexOf(o.replace("*", "")) === 0) return r;
      }
  }
  return Me("notfound");
}
function On() {
  return u.filter((e) => e.preload === !0);
}
function hn(e) {
  return u.filter((n) => n.region === e);
}
function Rn() {
  return { version: Ae, moduleId: be, totalApps: u.length, pages: Se().length, domains: Te().length, panels: Ne().length };
}
var le = { getApps: _n, getAppById: Me, getAppsByType: z, getPages: Se, getDomains: Te, getPanels: Ne, resolveAppByRoute: Pe, getPreloadApps: On, getAppsByRegion: hn, info: Rn, VERSION: Ae, MODULE_ID: be };
const vn = "3.1.0-P2-ENTERPRISE", Dn = "platform-microapp-registry";
let O = {}, q = {};
function $e(e, n) {
  return O[e] = Object.assign({}, n, { registeredAt: Date.now() }), !0;
}
function An(e) {
  return delete O[e], delete q[e], !0;
}
function bn(e) {
  return q[e] || null;
}
function je(e, n) {
  q[e] = n;
}
function Mn(e) {
  return O[e] || null;
}
function Sn() {
  return Object.keys(O);
}
function Tn(e) {
  return !!O[e];
}
function Nn() {
  O = {}, q = {};
}
var Le = { VERSION: vn, MODULE_ID: Dn, register: $e, unregister: An, getInstance: bn, setInstance: je, getRegistered: Mn, getAllRegistered: Sn, hasApp: Tn, clear: Nn };
const L = "3.2.0-P2-ENTERPRISE", X = "platform-performance-budget", p = {
  CPU_LIMIT: 80,
  MEMORY_LIMIT_MB: 500,
  RENDER_TIME_MS: 100,
  LOAD_TIME_MS: 3e3,
  INTERACTION_TIME_MS: 50
}, Z = {}, v = [];
let N = null, D = !1;
function Pn(e) {
  return e || (e = {}), N = e.eventBus || null, J(B.INIT, { version: L, budgets: p }), { version: L, moduleId: X };
}
function we(e, n, t) {
  t || (t = "ms");
  const r = { name: e, value: n, unit: t, timestamp: Date.now() };
  return Z[e] = r, jn(e, n), r;
}
function $n(e) {
  const n = performance.now();
  return () => {
    const t = performance.now() - n;
    return we(e, t, "ms"), t;
  };
}
function jn(e, n) {
  let t = !1, r = null;
  if (e.indexOf("render") !== -1 && n > p.RENDER_TIME_MS ? (t = !0, r = p.RENDER_TIME_MS) : e.indexOf("load") !== -1 && n > p.LOAD_TIME_MS ? (t = !0, r = p.LOAD_TIME_MS) : e.indexOf("interaction") !== -1 && n > p.INTERACTION_TIME_MS && (t = !0, r = p.INTERACTION_TIME_MS), t) {
    const i = { metric: e, value: n, budget: r, timestamp: Date.now() };
    v.push(i), J(B.VIOLATION, i), v.length > 5 && ke();
  }
}
function ke() {
  D || (D = !0, J(B.DEGRADE_MODE, { enabled: !0 }));
}
function Ln() {
  D = !1, v.length = 0, J(B.DEGRADE_MODE, { enabled: !1 });
}
function wn() {
  return D;
}
function kn(e) {
  return Z[e] || null;
}
function Vn() {
  return Object.assign({}, Z);
}
function Cn() {
  return v.slice();
}
function Un() {
  return Object.assign({}, p);
}
function J(e, n) {
  n || (n = {}), N && N.emit && N.emit(e, Object.assign({}, n, { source: X, timestamp: Date.now() }));
}
function Bn() {
  return { version: L, moduleId: X, degradeMode: D, metricsCount: Object.keys(Z).length, violationsCount: v.length, budgets: p };
}
var ue = { VERSION: L, MODULE_ID: X, init: Pn, recordMetric: we, startTiming: $n, enableDegradeMode: ke, disableDegradeMode: Ln, isDegradeMode: wn, getMetric: kn, getAllMetrics: Vn, getViolations: Cn, getBudgets: Un, info: Bn };
const Fn = "3.1.0-P2-ENTERPRISE", Hn = "platform-region-manager", w = {
  HEADER: "header-region",
  SIDEBAR: "sidebar-region",
  MAIN: "main-region",
  SUBMAIN: "submain-region",
  FOOTER: "footer-region",
  CANVAS: "canvas-region",
  MODAL: "modal-region",
  OVERLAY: "overlay-region"
}, b = {}, ce = {};
function Gn(e) {
  const n = Object.keys(w);
  for (let t = 0; t < n.length; t++) {
    const r = w[n[t]], i = e && e.querySelector(`[data-region="${r}"]`) || e && e.getElementById(r);
    i && (b[r] = i);
  }
  return Ve();
}
function ie(e) {
  return b[e] || null;
}
function Ve() {
  return Object.keys(b);
}
function Yn(e, n) {
  const t = b[e];
  return t ? (typeof n == "string" ? t.innerHTML = n : n instanceof HTMLElement ? (t.innerHTML = "", t.appendChild(n)) : n && n.render && (t.innerHTML = "", n.render(t)), ce[e] = n, !0) : !1;
}
function Ce(e) {
  const n = b[e];
  return n ? (n.innerHTML = "", delete ce[e], !0) : !1;
}
function zn(e) {
  return ce[e] || null;
}
var fe = { VERSION: Fn, MODULE_ID: Hn, REGIONS: w, initRegions: Gn, getRegion: ie, getAvailableRegions: Ve, mountToRegion: Yn, clearRegion: Ce, getRegionContent: zn };
const k = "3.3.0-P2-ENTERPRISE", _ = "platform-orchestrator", K = Ie({ moduleId: _ });
function qn(e) {
  return K.get(e);
}
function Xn(e) {
  return K.inject(e);
}
function Zn() {
  return K.snapshot();
}
function ne(e, n, t) {
  const r = qn("logger");
  r && r[e] && r[e](`[${_}] ${n}`, t);
}
let a = null, E = null, y = null, l = !1, V = !1;
const ye = ["layout:changed", "state:update", "canvas:event", "mf:navigate", "mf:route-change", "mf:route-change-requested", "timeline:record", "telemetry:track"];
function Jn(e) {
  return e || (e = {}), V ? { version: k, moduleId: _ } : (e.eventBus, e.mainEngine, V = !0, { version: k, moduleId: _ });
}
function Kn(e) {
  if (l)
    return ne("warn", "Navigation already in progress"), Promise.resolve(!1);
  const n = Pe(e);
  return E === (n && n.id) && y === e ? Promise.resolve(!0) : (l = !0, Promise.resolve().then(() => n ? E === n.id && a && a.module && a.module.update ? a.module.update({ route: e }).then(() => (y = e, l = !1, !0)) : (a ? Qn() : Promise.resolve()).then(() => ae(n)).then((r) => {
    if (r.status === "failed")
      return l = !1, !1;
    $e(n.id, r);
    const i = ie(n.region || w.MAIN) || ie("main-region");
    if (!i)
      return l = !1, !1;
    const o = r.module, Ge = {
      route: e,
      app: n,
      platform: {
        emit(S, Ee) {
          if (S === "mf:route-change-requested") {
            ne("info", "MFE requested route change:", Ee && Ee.route);
            return;
          }
        }
      }
    };
    return (o && o.init ? o.init(Ge) : Promise.resolve()).then(() => o && o.mount ? o.mount(i, { route: e, app: n }) : null).then((S) => (S && je(n.id, S), o && o.hydrate ? o.hydrate({}) : null)).then(() => (a = r, E = n.id, y = e, l = !1, !0));
  }) : (l = !1, !1)).catch((t) => (ne("error", "Navigation error:", t.message), l = !1, !1)));
}
function Qn() {
  if (!a) return Promise.resolve();
  const e = a.module;
  return Promise.resolve().then(() => {
    if (e && e.unmount) return e.unmount();
  }).then(() => {
    if (e && e.destroy) return e.destroy();
  }).then(() => {
    const n = a && a.config && a.config.region || "main-region";
    Ce(n), a = null, E = null, y = null;
  });
}
function Wn(e) {
  for (let n = 0; n < ye.length; n++)
    if (e.indexOf(ye[n]) !== -1) return !0;
  return !1;
}
function xn() {
  return a;
}
function et() {
  return E;
}
function nt() {
  return y;
}
function tt() {
  return l;
}
function rt() {
  return { version: k, moduleId: _, portsInitialized: K.isInitialized(), activeAppId: E, activeRoute: y, navigating: l, initialized: V };
}
function it() {
  a = null, E = null, y = null, l = !1, V = !1;
}
var pe = { VERSION: k, MODULE_ID: _, init: Jn, navigate: Kn, getActiveApp: xn, getActiveAppId: et, getActiveRoute: nt, isNavigating: tt, shouldIgnoreEvent: Wn, info: rt, reset: it, injectPorts: Xn, getPorts: Zn };
const C = "3.2.0-P2-ENTERPRISE", Q = "platform-state-engine-v3";
let f = {}, M = {}, h = [], P = null;
function ot(e) {
  return e || (e = {}), P = e.eventBus || null, W(F.ENGINE_INIT, { version: C }), { version: C, moduleId: Q };
}
function st(e, n, t) {
  if (n || (n = {}), t || (t = {}), f[e]) return Be(e);
  const r = { name: e, state: Object.assign({}, n), reducers: t, createdAt: Date.now() };
  return f[e] = r, M[e] = [], W(F.SLICE_CREATED, { name: e }), {
    getState() {
      return Object.assign({}, r.state);
    },
    dispatch(i) {
      return me(e, i);
    },
    subscribe(i) {
      return Ue(e, i);
    },
    destroy() {
      return de(e);
    }
  };
}
function me(e, n) {
  const t = f[e];
  if (!t) return null;
  const r = t.reducers[n.type];
  if (!r) return t.state;
  const i = Object.assign({}, t.state);
  return t.state = r(t.state, n), at(e, t.state, i), W(F.DISPATCH, { slice: e, action: n.type }), t.state;
}
function Ue(e, n) {
  const t = M[e];
  return !t || typeof n != "function" ? () => {
  } : (t.push(n), () => {
    const r = t.indexOf(n);
    r !== -1 && t.splice(r, 1);
  });
}
function at(e, n, t) {
  const r = M[e];
  r && r.forEach((i) => {
    try {
      i(n, t);
    } catch {
    }
  }), h.forEach((i) => {
    try {
      i(e, n, t);
    } catch {
    }
  });
}
function lt(e) {
  if (typeof e != "function") return null;
  const n = {};
  return Object.keys(f).forEach((t) => {
    n[t] = Object.assign({}, f[t].state);
  }), e(n);
}
function ut(e) {
  return !e || !e.slice ? null : me(e.slice, e);
}
function de(e) {
  return delete f[e], delete M[e], W(F.SLICE_DESTROYED, { name: e }), !0;
}
function Be(e) {
  const n = f[e];
  return n ? {
    getState() {
      return Object.assign({}, n.state);
    },
    dispatch(t) {
      return me(e, t);
    },
    subscribe(t) {
      return Ue(e, t);
    },
    destroy() {
      return de(e);
    }
  } : null;
}
function ct(e) {
  return typeof e != "function" ? () => {
  } : (h.push(e), () => {
    const n = h.indexOf(e);
    n !== -1 && h.splice(n, 1);
  });
}
function Fe() {
  return Object.keys(f);
}
function ft() {
  f = {}, M = {}, h = [];
}
function W(e, n) {
  n || (n = {}), P && P.emit && P.emit(e, Object.assign({}, n, { source: Q, timestamp: Date.now() }));
}
function pt() {
  return { version: C, moduleId: Q, sliceCount: Object.keys(f).length, slices: Fe() };
}
var ge = { VERSION: C, MODULE_ID: Q, init: ot, createSlice: st, select: lt, dispatch: ut, destroySlice: de, getSlice: Be, subscribeGlobal: ct, getAllSlices: Fe, clear: ft, info: pt };
const He = "3.2.0-P2-ENTERPRISE", x = "platform-runtime", At = oe, bt = se, Mt = De, St = le, Tt = Le, Nt = ue, Pt = pe, $t = fe, jt = ge, ee = Ie({ moduleId: x }), mt = (e) => ee.get(e), dt = (e) => ee.inject(e), gt = () => ee.snapshot();
function Et(e, n, t) {
  const r = mt("logger");
  r && r[e] && r[e](`[${x}] ${n}`, t);
}
let U = !1;
function yt(e = {}) {
  return U ? Promise.resolve($()) : Promise.resolve().then(() => (se.init(e), oe.init(e), ue.init(e), ge.init(e), fe.initRegions(e.document || document), pe.init(e), U = !0, $())).catch((n) => (Et("error", "Init error:", n), $()));
}
function $() {
  return {
    manifest: le,
    loader: De,
    registry: Le,
    regions: fe,
    orchestrator: pe,
    state: ge,
    errors: oe,
    performance: ue,
    events: se
  };
}
function It() {
  return U;
}
function _t() {
  return {
    version: He,
    moduleId: x,
    portsInitialized: ee.isInitialized(),
    initialized: U,
    manifest: le.info()
  };
}
var Lt = {
  init: yt,
  getRuntime: $,
  isInitialized: It,
  info: _t,
  VERSION: He,
  MODULE_ID: x,
  injectPorts: dt,
  getPorts: gt
};
export {
  At as ErrorBoundary,
  bt as EventDomains,
  Mt as FederationLoader,
  x as MODULE_ID,
  St as ManifestV3,
  Tt as MicroappRegistry,
  Nt as PerformanceBudget,
  Pt as PlatformOrchestrator,
  $t as RegionManager,
  jt as StateEngineV3,
  He as VERSION,
  Lt as default,
  gt as getPortsSnapshot,
  $ as getRuntime,
  _t as info,
  yt as init,
  dt as injectPorts,
  It as isInitialized
};
