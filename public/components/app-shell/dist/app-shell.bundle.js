import { createCorePorts as et, createUiPorts as ey } from "/core/runtime/ports-profiles.js";
import { isStrict as Ur, recordViolation as _p } from "/core/runtime/enterprise/strict-mode.js";
import { ACCESS_TYPES as Po, recordAccess as ty, ACCESS_SOURCES as ny } from "/core/policies/globalstate-access-policy.js";
import { ROUTER_EVENTS as Lp, SHELL_EVENTS as Gl } from "/core/runtime/dist/runtime.bundle.js";
import { createEarlyLogger as sy } from "/core/runtime/early-boot-logger.js";
import { findRegion as ry, REGION_IDS as iy } from "/platform/shell/layout-regions.js";
import { getSystemPagesInfo as ff } from "/app/pages/system-pages.js";
import { APP_SHELL_EVENT_NAMES as oy } from "/core/runtime/constants/event-names.js";
const ay = "app-shell-ticker-adapter";
et({ moduleId: ay });
const Yl = "1.0.0-P2-ENTERPRISE", ql = "app-shell-circuit-breaker", Qe = Object.freeze({ CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" }), mt = /* @__PURE__ */ new Map(), En = { failureThreshold: 5, successThreshold: 2, timeout: 3e4, resetTimeout: 6e4, monitorInterval: 1e4 }, St = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, circuitsCreated: 0 }, yi = [];
function Br(e, t) {
  this.name = e, this.state = Qe.CLOSED, this.failures = 0, this.successes = 0, this.lastFailure = null, this.lastSuccess = null, this.openedAt = null, this.failureThreshold = t.failureThreshold || En.failureThreshold, this.successThreshold = t.successThreshold || En.successThreshold, this.timeout = t.timeout || En.timeout, this.resetTimeout = t.resetTimeout || En.resetTimeout;
}
Br.prototype.canExecute = function() {
  return this.state === Qe.CLOSED ? !0 : this.state === Qe.OPEN ? Date.now() - this.openedAt >= this.resetTimeout ? (this.state = Qe.HALF_OPEN, !0) : !1 : !0;
};
Br.prototype.recordSuccess = function() {
  this.lastSuccess = Date.now(), this.successes++, this.state === Qe.HALF_OPEN ? this.successes >= this.successThreshold && (this.state = Qe.CLOSED, this.failures = 0, this.successes = 0) : this.failures = 0;
};
Br.prototype.recordFailure = function() {
  this.lastFailure = Date.now(), this.failures++, this.successes = 0, this.state === Qe.HALF_OPEN ? (this.state = Qe.OPEN, this.openedAt = Date.now()) : this.failures >= this.failureThreshold && (this.state = Qe.OPEN, this.openedAt = Date.now());
};
Br.prototype.recordRejection = () => {
  St.rejectedCalls++;
};
Br.prototype.reset = function() {
  this.state = Qe.CLOSED, this.failures = 0, this.successes = 0, this.openedAt = null;
};
function hf(e, t) {
  if (t = t || {}, mt.has(e)) return mt.get(e);
  const n = new Br(e, t);
  return mt.set(e, n), St.circuitsCreated++, n;
}
function la(e, t, n) {
  St.totalCalls++;
  let s = mt.get(e);
  if (s || (s = hf(e, {})), !s.canExecute())
    return s.recordRejection(), n ? Promise.resolve(n()) : Promise.reject(new Error(`Circuit ${e} is OPEN`));
  const r = new Promise((o, a) => {
    setTimeout(() => {
      a(new Error("Circuit timeout"));
    }, s.timeout);
  }), i = Promise.resolve().then(t);
  return Promise.race([i, r]).then((o) => (s.recordSuccess(), St.successfulCalls++, o)).catch((o) => {
    if (s.recordFailure(), St.failedCalls++, n) return n(o);
    throw o;
  });
}
function ly(e, t) {
  return function() {
    const n = arguments, s = this;
    return la(e, () => t.apply(s, n));
  };
}
function cy(e, t, n) {
  return function() {
    const s = arguments, r = this;
    return la(e, () => t.apply(r, s), (i) => n.call(r, i, s));
  };
}
function uy(e) {
  const t = mt.get(e);
  return t ? { name: t.name, state: t.state, failures: t.failures, successes: t.successes, lastFailure: t.lastFailure, lastSuccess: t.lastSuccess, openedAt: t.openedAt } : null;
}
function dy(e) {
  return mt.get(e) ? (mt.delete(e), yy("removed", { name: e }), !0) : !1;
}
function Wl(e) {
  const t = mt.get(e);
  return t ? t.state : null;
}
function py(e) {
  return Wl(e) === Qe.OPEN;
}
function fy(e) {
  return Wl(e) === Qe.CLOSED;
}
function Kl() {
  const e = [];
  return mt.forEach((t, n) => {
    e.push({ name: n, state: t.state, failures: t.failures, successes: t.successes, lastFailure: t.lastFailure, lastSuccess: t.lastSuccess, openedAt: t.openedAt });
  }), e;
}
function No() {
  return Kl().filter((e) => e.state === Qe.OPEN);
}
function hy(e) {
  const t = mt.get(e);
  return t ? (t.reset(), !0) : !1;
}
function gf() {
  mt.forEach((e) => {
    e.reset();
  });
}
function mf(e) {
  e.failureThreshold !== void 0 && (En.failureThreshold = e.failureThreshold), e.successThreshold !== void 0 && (En.successThreshold = e.successThreshold), e.timeout !== void 0 && (En.timeout = e.timeout), e.resetTimeout !== void 0 && (En.resetTimeout = e.resetTimeout);
}
function gy(e) {
  mf(e);
}
function Xl() {
  return Object.assign({}, En);
}
function my() {
  return Xl();
}
function vy(e) {
  return typeof e == "function" && yi.push(e), () => {
    const t = yi.indexOf(e);
    t >= 0 && yi.splice(t, 1);
  };
}
function yy(e, t) {
  yi.forEach((n) => {
    try {
      n(e, t);
    } catch {
    }
  });
}
function Jl() {
  return Object.assign({}, St, { activeCircuits: mt.size, openCircuits: No().length });
}
function by() {
  const e = { noOpenCircuits: No().length === 0, lowFailureRate: St.totalCalls === 0 || St.failedCalls / St.totalCalls < 0.3, lowRejectionRate: St.totalCalls === 0 || St.rejectedCalls / St.totalCalls < 0.1 }, t = Object.values(e).filter(Boolean).length;
  return { status: t === 3 ? "HEALTHY" : t >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${t}/3`, checks: e, openCircuits: No(), metrics: Jl(), version: Yl, moduleId: ql, timestamp: Date.now() };
}
function Ey() {
  return { moduleId: ql, version: Yl, config: Xl(), circuits: Kl(), metrics: Jl(), timestamp: Date.now() };
}
function ky() {
  gf(), mt.clear(), yi.length = 0;
}
const Y = { VERSION: Yl, MODULE_ID: ql, STATES: Qe, create: hf, get: uy, remove: dy, execute: la, wrap: ly, wrapWithFallback: cy, getState: Wl, isOpen: py, isClosed: fy, getAll: Kl, getOpenCircuits: No, reset: hy, resetAll: gf, configure: mf, setDefaultConfig: gy, getConfig: Xl, getDefaultConfig: my, subscribe: vy, getMetrics: Jl, healthCheck: by, info: Ey, destroy: ky }, Ql = "1.3.0-P2-ENTERPRISE", Wn = "app-shell-globalstate-adapter", Ri = 5, Sy = 500, Qi = et({ moduleId: Wn });
function $s(e) {
  return Qi.get(e);
}
function Ty(e) {
  return Qi.inject(e);
}
function wy() {
  return Qi.snapshot();
}
function $o(e, t) {
  try {
    ty({
      type: e,
      source: ny.PORTS,
      key: t,
      caller: Wn,
      moduleId: Wn
    });
  } catch {
  }
}
let Ks = [], ct = 0, Ds = !1;
const ut = {
  connects: 0,
  disconnects: 0,
  syncs: 0,
  errors: 0,
  retries: 0
};
function Cy(e, t) {
  t || (t = {});
  try {
    const n = $s("logger");
    n && n.info && n.info(`[${Wn}] ${e}`, t);
  } catch {
  }
}
function gi(e, t) {
  t || (t = {});
  try {
    const n = $s("telemetry");
    n && n.event && n.event(`${Wn}:${e}`, t);
  } catch {
  }
}
function vf(e) {
  if (e || (e = {}), Ds)
    return Cy("already-connected"), !0;
  const t = $s("globalState");
  if (!t) {
    if (ct < Ri) {
      ct++, ut.retries++;
      const n = Sy * ct;
      return gi("retry-scheduled", { attempt: ct, delay: n }), setTimeout(() => {
        vf(e);
      }, n), !1;
    }
    return ut.errors++, gi("max-retries-reached", { attempts: ct }), !1;
  }
  try {
    if (e.onLoading) {
      $o(Po.SUBSCRIBE, "app.isLoading");
      const n = t.subscribe((s) => {
        ut.syncs++, e.onLoading(s);
      }, "app.isLoading");
      typeof n == "function" && Ks.push(n);
    }
    if (e.onMaintenance) {
      $o(Po.SUBSCRIBE, "app.maintenanceMode");
      const n = t.subscribe((s) => {
        ut.syncs++, e.onMaintenance(s);
      }, "app.maintenanceMode");
      typeof n == "function" && Ks.push(n);
    }
    return Ds = !0, ut.connects++, gi("connected", { subscriptions: Ks.length, retriesNeeded: ct }), !0;
  } catch (n) {
    return ut.errors++, gi("connect-error", { error: n.message }), !1;
  }
}
function Ay() {
  Ks.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), Ks = [], ct = 0, Ds = !1, ut.disconnects++, gi("disconnected");
}
function Iy(e) {
  try {
    const t = $s("globalState");
    if (t && t.dispatch && t.actions && t.actions.setLoading)
      return $o(Po.DISPATCH, "app.isLoading"), t.dispatch(t.actions.setLoading(e)), !0;
  } catch {
    ut.errors++;
  }
  return !1;
}
function Dy(e) {
  try {
    const t = $s("globalState");
    if (t && t.dispatch)
      return $o(Po.DISPATCH, "app.ready"), t.dispatch({
        type: e ? "SET_APP_READY" : "CLEAR_APP_READY",
        payload: e
      }), !0;
  } catch {
    ut.errors++;
  }
  return !1;
}
function Oy() {
  return Ds;
}
function xy() {
  return ct;
}
function Zl() {
  return Object.assign({}, ut);
}
function ec() {
  const e = !!$s("globalState");
  return Ds ? "connected" : !e && ct > 0 && ct < Ri ? "retrying" : !e && ct >= Ri ? "failed" : "pending";
}
function Ry() {
  const e = Qi.snapshot(), t = {
    globalStateExists: !!$s("globalState"),
    connected: Ds,
    noExcessiveRetries: ct < Ri,
    lowErrorRate: ut.connects === 0 || ut.errors / ut.connects < 0.2,
    portsInitialized: e._initialized
  }, n = Object.values(t).filter(Boolean).length;
  return {
    status: n === 5 ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/5`,
    checks: t,
    metrics: Zl(),
    connectionStatus: ec(),
    version: Ql,
    moduleId: Wn,
    portsInitialized: e._initialized,
    timestamp: Date.now()
  };
}
function _y() {
  const e = Qi.snapshot();
  return {
    moduleId: Wn,
    version: Ql,
    connected: Ds,
    status: ec(),
    subscriptions: Ks.length,
    retryCount: ct,
    maxRetries: Ri,
    portsInitialized: e._initialized,
    metrics: Zl(),
    timestamp: Date.now()
  };
}
const Ly = {
  connect: vf,
  disconnect: Ay,
  dispatchLoading: Iy,
  dispatchAppReady: Dy,
  isConnected: Oy,
  getRetryCount: xy,
  getMetrics: Zl,
  getStatus: ec,
  healthCheck: Ry,
  info: _y,
  VERSION: Ql,
  MODULE_ID: Wn,
  injectPorts: Ty,
  getPorts: wy
}, My = "app-shell-auth-adapter";
et({ moduleId: My });
const tc = "1.3.0-P18EC-AAA", Fr = "app-shell-layout-adapter", Zi = et({ moduleId: Fr });
function Sr(e) {
  return Zi.get(e);
}
function Py(e) {
  return Zi.inject(e);
}
function Ny() {
  return Zi.snapshot();
}
const nc = Object.freeze({
  REQUEST: "layout:request",
  FULLSCREEN_REQUEST: "layout:fullscreen:request"
});
let To = null, Tr = !1;
const Xs = {
  connects: 0,
  disconnects: 0,
  layoutChanges: 0,
  requestsEmitted: 0,
  errors: 0
};
function Js(e, t) {
  t || (t = {});
  try {
    const n = Sr("telemetry");
    n && n.event && n.event(`${Fr}:${e}`, t);
  } catch {
  }
}
function dl(e, t) {
  t || (t = {});
  const n = Sr("eventBus");
  return !n || !n.emit ? (Js("emit-failed-no-eventbus", { mode: e }), !1) : (n.emit(nc.REQUEST, Object.assign({
    mode: e,
    source: Fr,
    timestamp: Date.now()
  }, t)), Xs.requestsEmitted++, Js("request-emitted", { mode: e, options: t }), !0);
}
function Za(e) {
  for (let t = 0; t < e.length; t++) {
    const n = document.querySelector(e[t]);
    if (n) return n;
  }
  return null;
}
function $y(e) {
  if (e || (e = {}), Tr) return !0;
  const t = Sr("eventBus");
  if (!t)
    return Js("no-eventbus"), !1;
  try {
    const n = (s) => {
      const r = s && s.hideNav === !0, i = s ? s.route : null, o = Za([
        ".dsd-sidebar",
        ".app-sidebar",
        "#sidebar",
        "#shell-sidebar-region",
        '[data-region="sidebar"]',
        '[data-shell-region="sidebar"]'
      ]), a = Za([
        ".dsd-header",
        ".app-header",
        "#shell-header-region",
        '[data-region="header"]',
        '[data-shell-region="header"]'
      ]), l = Za([
        ".dsd-main",
        ".app-main",
        "#shell-main-region",
        '[data-region="main"]',
        '[data-shell-region="main"]'
      ]);
      Xs.layoutChanges++, r ? (o && o.classList.add("hidden"), a && a.classList.add("hidden"), l && l.classList.add("full-screen-mode"), dl("fullscreen", { route: i, hideNav: !0 }), e.onFullscreen && e.onFullscreen(i, l)) : (o && o.classList.remove("hidden"), a && a.classList.remove("hidden"), l && l.classList.remove("full-screen-mode"), dl("default", { route: i, hideNav: !1 }), e.onDefault && e.onDefault(i, l));
    };
    return t.on(Lp.LAYOUT_CHANGED, n), To = () => {
      t.off(Lp.LAYOUT_CHANGED, n);
    }, Tr = !0, Xs.connects++, Js("connected"), !0;
  } catch (n) {
    return Xs.errors++, Js("connect-error", { error: n.message }), !1;
  }
}
function zy() {
  To && (To(), To = null), Tr = !1, Xs.disconnects++, Js("disconnected");
}
function jy(e, t) {
  return dl(e, t);
}
function Hy() {
  return Tr;
}
function sc() {
  return Object.assign({}, Xs);
}
function Uy() {
  return Object.assign({}, nc);
}
function By() {
  const e = Zi.snapshot(), t = Sr("eventBus"), n = Sr("layoutManager"), s = {
    eventBusExists: !!t,
    connected: Tr,
    layoutManagerExists: !!n,
    portsInitialized: e._initialized
  }, r = Object.values(s).filter(Boolean).length;
  return {
    status: r === 4 ? "HEALTHY" : r >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${r}/4`,
    checks: s,
    metrics: sc(),
    version: tc,
    moduleId: Fr,
    portsInitialized: e._initialized,
    timestamp: Date.now()
  };
}
function Fy() {
  const e = Zi.snapshot(), t = Sr("layoutManager");
  return {
    moduleId: Fr,
    version: tc,
    connected: Tr,
    hasLayoutManager: !!t,
    layoutEvents: nc,
    portsInitialized: e._initialized,
    metrics: sc(),
    timestamp: Date.now()
  };
}
const Vy = {
  connect: $y,
  disconnect: zy,
  requestLayout: jy,
  isConnected: Hy,
  getMetrics: sc,
  getLayoutEvents: Uy,
  healthCheck: By,
  info: Fy,
  VERSION: tc,
  MODULE_ID: Fr,
  injectPorts: Py,
  getPorts: Ny
}, Gy = "app-shell-theme-adapter";
et({ moduleId: Gy });
const Yy = "app-shell-notification-adapter";
et({ moduleId: Yy });
const qy = "app-shell-router-adapter";
et({ moduleId: qy });
const rc = "1.0.0-AAA", ic = "app-shell-responsive-adapter", sn = Object.freeze({
  xs: { min: 0, max: 575, name: "extra-small", device: "mobile-portrait" },
  sm: { min: 576, max: 767, name: "small", device: "mobile-landscape" },
  md: { min: 768, max: 991, name: "medium", device: "tablet" },
  lg: { min: 992, max: 1199, name: "large", device: "desktop" },
  xl: { min: 1200, max: 1399, name: "extra-large", device: "desktop-large" },
  xxl: { min: 1400, max: 1 / 0, name: "extra-extra-large", device: "desktop-wide" }
}), yf = Object.freeze({
  xs: {
    sidebar: { visible: !1, collapsed: !0 },
    navRail: { visible: !1 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !0 }
  },
  sm: {
    sidebar: { visible: !1, collapsed: !0 },
    navRail: { visible: !0 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !0 }
  },
  md: {
    sidebar: { visible: !1, collapsed: !0 },
    navRail: { visible: !0 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !1 }
  },
  lg: {
    sidebar: { visible: !0, collapsed: !1 },
    navRail: { visible: !0 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !1 }
  },
  xl: {
    sidebar: { visible: !0, collapsed: !1 },
    navRail: { visible: !0 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !1 }
  },
  xxl: {
    sidebar: { visible: !0, collapsed: !1 },
    navRail: { visible: !0 },
    footer: { visible: !0 },
    header: { visible: !0, compact: !1 }
  }
}), V = { value: null }, pl = { value: null }, wr = { value: !1 }, Vr = { value: !0 }, ca = { value: !0 }, Qs = { value: null }, Vs = {}, Zs = [], jn = {}, Os = {
  breakpointChanges: 0,
  policyApplications: 0,
  resizeEvents: 0,
  errors: 0,
  lastChangeAt: null
};
function In(e, t) {
  for (let n = 0; n < Zs.length; n++)
    try {
      Zs[n]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      Os.errors++;
    }
}
function ua() {
  return typeof window > "u" ? 1200 : window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}
function bf(e) {
  e === void 0 && (e = ua());
  const t = Object.keys(sn);
  for (let n = 0; n < t.length; n++) {
    const s = t[n], r = sn[s];
    if (e >= r.min && e <= r.max)
      return s;
  }
  return "lg";
}
const oc = "1.0.0-P2-ENTERPRISE", ac = "app-shell-region-visibility", zo = Object.freeze({
  header: { id: "app-shell-header", defaultVisible: !0 },
  sidebar: { id: "app-shell-sidebar", defaultVisible: !0 },
  "nav-rail": { id: "app-shell-nav-rail", defaultVisible: !0 },
  main: { id: "app-shell-main", defaultVisible: !0 },
  footer: { id: "app-shell-footer", defaultVisible: !0 },
  ticker: { id: "app-shell-ticker", defaultVisible: !1 },
  preloader: { id: "app-shell-preloader", defaultVisible: !0 },
  login: { id: "app-shell-login", defaultVisible: !1 },
  toast: { id: "app-shell-toast", defaultVisible: !0 }
}), Ct = Object.freeze({
  HIDDEN: "app-shell-hidden",
  SHOWING: "app-shell-showing",
  HIDING: "app-shell-hiding",
  FULLSCREEN: "app-shell-fullscreen"
}), Mp = Object.freeze({
  animationDuration: 200,
  defaultAnimate: !0
}), we = {
  visibility: {},
  isFullscreen: !1,
  stylesInjected: !1,
  subscribers: []
}, _i = {
  animationDuration: Mp.animationDuration,
  defaultAnimate: Mp.defaultAnimate
}, fl = {
  shows: 0,
  hides: 0,
  toggles: 0,
  errors: 0
};
function lc() {
  return Object.assign({}, fl);
}
function er(e) {
  fl[e] !== void 0 && fl[e]++;
}
function Cr(e, t) {
  for (let n = 0; n < we.subscribers.length; n++)
    try {
      we.subscribers[n](e, t);
    } catch {
    }
}
function Ef() {
  return _i.animationDuration;
}
const kf = "app-shell-dom-regions", Li = !0, Ze = Object.freeze({
  preloader: { id: "shell-preloader-region", legacyId: "preloader-root", ariaLabel: "Loading indicator" },
  login: { id: "shell-login-region", legacyId: "login-container", ariaLabel: "Login form" },
  header: { id: "shell-header-region", legacyId: "header-container", ariaLabel: "Application header" },
  ticker: { id: "shell-ticker-region", legacyId: "ticker-container", ariaLabel: "Information ticker" },
  "nav-rail": { id: "shell-nav-rail-region", legacyId: "nav-rail-container", ariaLabel: "Navigation rail" },
  sidebar: { id: "shell-sidebar-region", legacyId: "sidebar-root", ariaLabel: "Sidebar navigation" },
  main: { id: "shell-main-region", legacyId: "app-container", ariaLabel: "Main content", ariaLive: "polite" },
  footer: { id: "shell-footer-region", legacyId: "footer-root", ariaLabel: "Application footer" },
  toast: { id: "shell-toast-region", legacyId: "toast-container", ariaLabel: "Notifications", ariaLive: "assertive" }
});
function Wy() {
  const e = {}, t = Object.keys(Ze);
  for (let n = 0; n < t.length; n++)
    e[t[n]] = Ze[t[n]].id;
  return Object.freeze(e);
}
Wy();
const Sf = et({ moduleId: kf });
function Ky() {
  Sf.init();
}
function Xy(e) {
  return Sf.get(e);
}
const De = {
  ttlMs: 3e4,
  maxSize: 50,
  autoCleanup: !0,
  cleanupIntervalMs: 6e4
}, At = /* @__PURE__ */ new Map(), tr = { value: null }, Se = { hits: 0, misses: 0, expired: 0, evictions: 0 };
function Jy(e) {
  const t = At.get(e);
  if (!t) return null;
  const n = Date.now();
  return n - t.cachedAt > De.ttlMs ? (At.delete(e), Se.expired++, null) : t.element && !document.contains(t.element) ? (At.delete(e), Se.evictions++, null) : (t.lastAccess = n, t.accessCount++, t);
}
function Qy(e, t) {
  const n = Date.now();
  if (At.size >= De.maxSize) {
    let s = null, r = 1 / 0;
    At.forEach((i, o) => {
      i.lastAccess < r && (r = i.lastAccess, s = o);
    }), s && (At.delete(s), Se.evictions++);
  }
  At.set(e, {
    element: t,
    cachedAt: n,
    lastAccess: n,
    accessCount: 1
  });
}
function Zy() {
  const e = Date.now(), t = [];
  At.forEach((n, s) => {
    (e - n.cachedAt > De.ttlMs || n.element && !document.contains(n.element)) && t.push(s);
  });
  for (let n = 0; n < t.length; n++)
    At.delete(t[n]), Se.expired++;
  return t.length;
}
function hl() {
  tr.value || De.autoCleanup && (tr.value = setInterval(Zy, De.cleanupIntervalMs));
}
function Pp() {
  tr.value && (clearInterval(tr.value), tr.value = null);
}
typeof document < "u" && hl();
function Tf(e) {
  De.ttlMs = Math.max(1e3, Math.min(3e5, e));
}
function eb() {
  return De.ttlMs;
}
function tb(e) {
  e.ttlMs !== void 0 && (De.ttlMs = Math.max(1e3, Math.min(3e5, e.ttlMs))), e.maxSize !== void 0 && (De.maxSize = Math.max(10, Math.min(200, e.maxSize))), e.autoCleanup !== void 0 && (De.autoCleanup = !!e.autoCleanup, De.autoCleanup ? hl() : Pp()), e.cleanupIntervalMs !== void 0 && (De.cleanupIntervalMs = Math.max(1e4, e.cleanupIntervalMs), tr.value && (Pp(), hl()));
}
function wf() {
  return {
    ttlMs: De.ttlMs,
    maxSize: De.maxSize,
    autoCleanup: De.autoCleanup,
    cleanupIntervalMs: De.cleanupIntervalMs
  };
}
function da() {
  return {
    size: At.size,
    maxSize: De.maxSize,
    ttlMs: De.ttlMs,
    hits: Se.hits,
    misses: Se.misses,
    expired: Se.expired,
    evictions: Se.evictions,
    hitRate: Se.hits + Se.misses > 0 ? `${Math.round(Se.hits / (Se.hits + Se.misses) * 100)}%` : "N/A"
  };
}
const lt = {
  legacyHits: 0,
  enterpriseHits: 0,
  misses: 0,
  byRegion: {},
  accessCount: {}
};
function wo(e, t, n) {
  lt.byRegion[e] || (lt.byRegion[e] = { legacy: 0, enterprise: 0, misses: 0 }), lt.accessCount[e] || (lt.accessCount[e] = 0), lt.accessCount[e]++, n ? (lt.enterpriseHits++, lt.byRegion[e].enterprise++) : (lt.misses++, lt.byRegion[e].misses++);
}
function nb(e, t) {
  t || (t = {}), Ky();
  try {
    const n = Xy("telemetry");
    n && n.event && n.event(`${kf}:${e}`, t);
  } catch {
  }
}
function ke(e) {
  const t = Ze[e];
  if (!t)
    return lt.misses++, document.getElementById(e) || null;
  const n = Jy(e);
  if (n)
    return Se.hits++, wo(e, !1, !0), n.element;
  Se.misses++;
  const s = document.getElementById(t.id);
  return s ? (Qy(e, s), wo(e, !1, !0), s) : (wo(e, !1, !1), nb("strict-miss", { region: e, enterpriseId: t.id }), null);
}
function sb(e) {
  const t = Ze[e];
  if (!t) {
    const s = document.getElementById(e);
    return { element: s, id: e, legacyId: null, usingLegacy: !1, exists: !!s, mode: s ? "direct" : "missing" };
  }
  const n = document.getElementById(t.id);
  return n ? (wo(e, !1, !0), { element: n, id: t.id, legacyId: t.legacyId, usingLegacy: !1, exists: !0, mode: "enterprise" }) : { element: null, id: t.id, legacyId: t.legacyId, usingLegacy: !1, exists: !1, mode: "strict-miss" };
}
function rb() {
  const e = {}, t = Object.keys(Ze);
  for (let n = 0; n < t.length; n++)
    e[t[n]] = Ze[t[n]].id;
  return e;
}
function ib() {
  const e = {}, t = Object.keys(Ze);
  for (let n = 0; n < t.length; n++)
    e[t[n]] = ke(t[n]);
  return e;
}
function cc() {
  At.clear(), Se.hits = 0, Se.misses = 0, Se.expired = 0, Se.evictions = 0;
}
function ob(e) {
  return e ? At.delete(e) : (cc(), !0);
}
function pa() {
  const e = {};
  let t = 0, n = 0, s = 0;
  const r = Object.keys(Ze);
  for (let i = 0; i < r.length; i++) {
    const o = r[i], a = Ze[o];
    n++;
    const l = sb(o);
    l.exists && t++, l.usingLegacy && s++;
    let c = !1;
    l.element && (c = l.element.offsetParent !== null || getComputedStyle(l.element).position === "fixed"), e[o] = {
      id: a.id,
      legacyId: a.legacyId,
      exists: l.exists,
      usingLegacy: l.usingLegacy,
      mode: l.mode,
      childrenCount: l.element ? l.element.children.length : 0,
      hasChildren: l.element ? l.element.children.length > 0 : !1,
      isVisible: c,
      accessCount: lt.accessCount[o] || 0
    };
  }
  return e._summary = {
    total: n,
    exists: t,
    missing: n - t,
    usingLegacy: s,
    allPresent: t === n,
    allEnterprise: t === n && s === 0,
    mode: s > 0 ? "mixed" : t === n ? "enterprise" : "incomplete",
    strictMode: Li,
    cacheStats: da()
  }, e;
}
function uc() {
  const e = pa(), t = [], n = [], s = Object.keys(e);
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    if (i === "_summary") continue;
    const o = e[i];
    o.exists ? o.usingLegacy && n.push({ region: i, type: "legacy", message: `Region '${i}' using legacy ID`, action: "Migrate to enterprise ID" }) : t.push({ region: i, type: "missing", message: `Region '${i}' not found (ID: ${o.id})` });
  }
  return {
    valid: t.length === 0,
    enterprise: t.length === 0 && n.length === 0,
    strictMode: Li,
    issues: t,
    warnings: n,
    summary: e._summary,
    usageMetrics: Object.assign({}, lt),
    recommendation: n.length > 0 ? "Migrate legacy IDs to enterprise IDs" : null
  };
}
function Cf() {
  return Object.assign({}, lt.accessCount);
}
function eo(e) {
  const t = ke(e);
  return t ? !t.classList.contains(Ct.HIDDEN) : !1;
}
function to(e, t) {
  t = t || {};
  const n = ke(e);
  return n ? eo(e) ? Promise.resolve(!0) : new Promise((s) => {
    t.animate !== !1 ? (n.classList.add(Ct.SHOWING), n.classList.remove(Ct.HIDDEN), setTimeout(() => {
      n.classList.remove(Ct.SHOWING), we.visibility[e] = !0, er("shows"), Cr("show", { region: e }), s(!0);
    }, Ef())) : (n.classList.remove(Ct.HIDDEN), we.visibility[e] = !0, er("shows"), Cr("show", { region: e }), s(!0));
  }) : (er("errors"), Promise.resolve(!1));
}
function no(e, t) {
  t = t || {};
  const n = ke(e);
  return n ? eo(e) ? new Promise((s) => {
    t.animate !== !1 ? (n.classList.add(Ct.HIDING), setTimeout(() => {
      n.classList.remove(Ct.HIDING), n.classList.add(Ct.HIDDEN), we.visibility[e] = !1, er("hides"), Cr("hide", { region: e }), s(!0);
    }, Ef())) : (n.classList.add(Ct.HIDDEN), we.visibility[e] = !1, er("hides"), Cr("hide", { region: e }), s(!0));
  }) : Promise.resolve(!0) : (er("errors"), Promise.resolve(!1));
}
function ab(e, t) {
  return eo(e) ? no(e, t) : to(e, t);
}
function lb(e, t) {
  const n = [], s = Object.keys(e);
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    e[i] ? n.push(to(i, t)) : n.push(no(i, t));
  }
  return Promise.all(n);
}
function Af() {
  const e = ["header", "sidebar", "nav-rail", "footer", "ticker"];
  for (let t = 0; t < e.length; t++)
    no(e[t], { animate: !1 });
  return we.isFullscreen = !0, Cr("fullscreen-enter", {}), !0;
}
function If() {
  const e = ["header", "sidebar", "nav-rail", "footer"];
  for (let t = 0; t < e.length; t++)
    to(e[t], { animate: !1 });
  return we.isFullscreen = !1, Cr("fullscreen-exit", {}), !0;
}
function cb() {
  return we.isFullscreen ? If() : Af();
}
function ub() {
  return we.isFullscreen;
}
function db() {
  const e = {}, t = Object.keys(zo);
  for (let n = 0; n < t.length; n++)
    e[t[n]] = eo(t[n]);
  return e;
}
function pb() {
  const e = Object.keys(zo);
  for (let t = 0; t < e.length; t++)
    zo[e[t]].defaultVisible !== !1 ? to(e[t], { animate: !1 }) : no(e[t], { animate: !1 });
  return we.isFullscreen = !1, !0;
}
const Np = "app-shell-region-visibility-styles";
function fb() {
  if (we.stylesInjected || typeof document > "u") return;
  if (document.getElementById(Np)) {
    we.stylesInjected = !0;
    return;
  }
  const e = _i.animationDuration, t = `
    .${Ct.HIDDEN} {
      display: none !important;
    }
    
    .${Ct.SHOWING} {
      animation: appShellFadeIn ${e}ms ease-out;
    }
    
    .${Ct.HIDING} {
      animation: appShellFadeOut ${e}ms ease-out;
    }
    
    @keyframes appShellFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes appShellFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `, n = document.createElement("style");
  n.id = Np, n.textContent = t, document.head.appendChild(n), we.stylesInjected = !0;
}
typeof document < "u" && fb();
function hb(e) {
  return eo(e);
}
function gb(e, t) {
  return to(e, t);
}
function mb(e, t) {
  return no(e, t);
}
function vb(e, t) {
  return ab(e, t);
}
function yb(e, t) {
  return lb(e, t);
}
function bb() {
  return Af();
}
function Eb() {
  return If();
}
function kb() {
  return cb();
}
function dc() {
  return ub();
}
function pc() {
  return db();
}
function Sb() {
  return pb();
}
function Tb(e) {
  e.animationDuration !== void 0 && (_i.animationDuration = e.animationDuration), e.defaultAnimate !== void 0 && (_i.defaultAnimate = !!e.defaultAnimate);
}
function Df() {
  return Object.assign({}, _i);
}
function wb(e) {
  return typeof e != "function" ? () => {
  } : (we.subscribers.push(e), () => {
    const t = we.subscribers.indexOf(e);
    t >= 0 && we.subscribers.splice(t, 1);
  });
}
function Cb() {
  const e = lc(), t = {
    stylesInjected: we.stylesInjected,
    lowErrorRate: e.errors < (e.shows + e.hides) * 0.1 || e.errors < 3
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    visibilityState: pc(),
    isFullscreen: dc(),
    metrics: e,
    version: oc,
    moduleId: ac,
    timestamp: Date.now()
  };
}
function Ab() {
  return {
    moduleId: ac,
    version: oc,
    config: Df(),
    regions: Object.keys(zo),
    visibilityState: pc(),
    isFullscreen: dc(),
    metrics: lc(),
    subscriberCount: we.subscribers.length,
    timestamp: Date.now()
  };
}
const ye = {
  VERSION: oc,
  MODULE_ID: ac,
  isVisible: hb,
  show: gb,
  hide: mb,
  toggle: vb,
  setVisibility: yb,
  enterFullscreen: bb,
  exitFullscreen: Eb,
  toggleFullscreen: kb,
  isFullscreenMode: dc,
  getVisibilityState: pc,
  resetVisibility: Sb,
  configure: Tb,
  getConfig: Df,
  subscribe: wb,
  getMetrics: lc,
  healthCheck: Cb,
  info: Ab
}, fc = "1.1.0-AAA", hc = "app-shell-layout-persistence", so = "dsd:app-shell:layout-prefs", qs = 1, Ib = Object.freeze({
  sidebar: {
    collapsed: !1,
    width: 280
  },
  footer: {
    visible: !0,
    height: 48
  },
  header: {
    visible: !0
  },
  navRail: {
    expanded: !1
  },
  theme: {
    mode: "system"
  },
  layout: {
    mode: "normal",
    lastRoute: null
  }
});
function Db() {
  try {
    if (typeof localStorage < "u")
      return localStorage.setItem("__test__", "1"), localStorage.removeItem("__test__"), localStorage;
  } catch {
  }
  return null;
}
const gl = sy("layout-persistence");
let be = null;
const hs = { loads: 0, saves: 0, resets: 0, errors: 0 };
function Gr() {
  try {
    const e = localStorage.getItem(so);
    if (!e)
      return be = { version: qs, preferences: {}, timestamp: Date.now() }, hs.loads++, be;
    const t = JSON.parse(e);
    return t.version !== qs ? (gl.warn("Schema version mismatch, resetting"), be = { version: qs, preferences: {}, timestamp: Date.now() }) : be = t, hs.loads++, be;
  } catch (e) {
    return hs.errors++, gl.error(`Load failed: ${e.message}`), be = { version: qs, preferences: {}, timestamp: Date.now() }, be;
  }
}
function fa() {
  be || Gr();
  try {
    return be.timestamp = Date.now(), localStorage.setItem(so, JSON.stringify(be)), hs.saves++, !0;
  } catch (e) {
    return hs.errors++, gl.error(`Save failed: ${e.message}`), !1;
  }
}
function Ob(e) {
  if (be || Gr(), !e) return be;
  const t = e.split(".");
  let n = be;
  for (let s = 0; s < t.length; s++) {
    if (n == null) return;
    n = n[t[s]];
  }
  return n;
}
function xb(e, t) {
  be || Gr();
  const n = e.split(".");
  let s = be.preferences;
  for (let r = 0; r < n.length; r++) {
    if (s == null) return t;
    s = s[n[r]];
  }
  return s !== void 0 ? s : t;
}
function Of(e, t, n) {
  n = n || {}, be || Gr();
  const s = e.split(".");
  let r = be.preferences;
  for (let i = 0; i < s.length - 1; i++)
    r[s[i]] || (r[s[i]] = {}), r = r[s[i]];
  return r[s[s.length - 1]] = t, n.persist !== !1 && fa(), !0;
}
function Rb(e, t) {
  t = t || {}, be || Gr();
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    Of(n[s], e[n[s]], { persist: !1 });
  return t.persist !== !1 && fa(), !0;
}
function _b() {
  return be = { version: qs, preferences: {}, timestamp: Date.now() }, hs.resets++, fa(), !0;
}
function Lb() {
  try {
    return localStorage.removeItem(so), be = null, !0;
  } catch {
    return hs.errors++, !1;
  }
}
let ml = null, jo = !1;
const nr = [], gc = {
  loads: 0,
  saves: 0,
  resets: 0,
  errors: 0,
  lastSaveAt: null,
  lastLoadAt: null
};
function Mb(e, t) {
  for (let n = 0; n < nr.length; n++)
    try {
      nr[n]({ type: e, data: t, timestamp: Date.now() });
    } catch {
    }
}
const xf = {
  get preferences() {
    return ml;
  },
  set preferences(e) {
    ml = e;
  },
  get initialized() {
    return jo;
  },
  set initialized(e) {
    jo = e;
  },
  get metrics() {
    return gc;
  },
  notify: Mb
};
function Rf() {
  return Gr();
}
function Pb() {
  return fa();
}
function _f() {
  return Ob(xf);
}
function ro(e) {
  return xb(e, xf);
}
function io(e, t, n) {
  return Of(e, t, n);
}
function Nb(e, t) {
  return Rb(e, t);
}
function $b(e) {
  return _b();
}
function zb() {
  return Lb();
}
function jb(e) {
  return typeof e != "function" ? () => {
  } : (nr.push(e), () => {
    const t = nr.indexOf(e);
    t >= 0 && nr.splice(t, 1);
  });
}
function Lf() {
  return ro("sidebar.collapsed") === !0;
}
function Mf(e) {
  return io("sidebar.collapsed", !!e);
}
function Hb() {
  return Mf(!Lf());
}
function Ub() {
  return ro("sidebar.width") || 280;
}
function Bb(e) {
  return io("sidebar.width", Math.max(200, Math.min(500, e)));
}
function Pf() {
  return ro("layout.mode") || "normal";
}
function Fb(e) {
  return ["normal", "fullscreen", "compact"].indexOf(e) === -1 && (e = "normal"), io("layout.mode", e);
}
function Vb() {
  return Pf() === "fullscreen";
}
function Gb() {
  return ro("theme.mode") || "system";
}
function Yb(e) {
  return ["light", "dark", "system"].indexOf(e) === -1 && (e = "system"), io("theme.mode", e);
}
function mc() {
  return Object.assign({}, gc);
}
function qb() {
  const e = Db(), t = {
    initialized: jo,
    storageAvailable: !!e,
    preferencesLoaded: !!ml,
    noErrors: gc.errors === 0
  }, n = Object.keys(t);
  let s = 0;
  for (let i = 0; i < n.length; i++)
    t[n[i]] && s++;
  const r = n.length;
  return {
    status: s === r ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${s}/${r}`,
    checks: t,
    metrics: mc(),
    storageKey: so,
    version: fc,
    moduleId: hc,
    timestamp: Date.now()
  };
}
function Wb() {
  return {
    moduleId: hc,
    version: fc,
    initialized: jo,
    storageKey: so,
    storageVersion: qs,
    defaultPreferences: Ib,
    currentPreferences: _f(),
    listenerCount: nr.length,
    metrics: mc(),
    timestamp: Date.now()
  };
}
Rf();
const W = {
  VERSION: fc,
  MODULE_ID: hc,
  load: Rf,
  save: Pb,
  get: _f,
  getPreference: ro,
  setPreference: io,
  setPreferences: Nb,
  reset: $b,
  clear: zb,
  subscribe: jb,
  isSidebarCollapsed: Lf,
  setSidebarCollapsed: Mf,
  toggleSidebar: Hb,
  getSidebarWidth: Ub,
  setSidebarWidth: Bb,
  getLayoutMode: Pf,
  setLayoutMode: Fb,
  isFullscreen: Vb,
  getThemeMode: Gb,
  setThemeMode: Yb,
  getMetrics: mc,
  healthCheck: qb,
  info: Wb
};
function vc(e, t) {
  if (!ca.value && !(t && t.force)) return !1;
  const n = yf[e];
  if (!n) return !1;
  const s = { animate: t && t.animate !== !1, duration: 200 };
  if (jn.sidebar || n.sidebar && (n.sidebar.visible === !1 ? ye.hide("sidebar", s) : ye.show("sidebar", s), n.sidebar.collapsed !== void 0 && W.setSidebarCollapsed(n.sidebar.collapsed)), !jn.navRail && n.navRail && (n.navRail.visible === !1 ? ye.hide("nav-rail", s) : ye.show("nav-rail", s)), n.header && n.header.compact !== void 0) {
    const r = ry(iy.HEADER);
    r && (n.header.compact ? r.classList.add("dsd-shell__region--compact") : r.classList.remove("dsd-shell__region--compact"));
  }
  if (typeof document < "u" && document.body) {
    const r = Object.keys(sn);
    for (let o = 0; o < r.length; o++)
      document.body.classList.remove(`dsd-bp-${r[o]}`);
    document.body.classList.add(`dsd-bp-${e}`);
    const i = sn[e].device;
    document.body.setAttribute("data-device", i), e === "xs" || e === "sm" ? (document.body.classList.add("dsd-mobile"), document.body.classList.remove("dsd-tablet", "dsd-desktop")) : e === "md" ? (document.body.classList.add("dsd-tablet"), document.body.classList.remove("dsd-mobile", "dsd-desktop")) : (document.body.classList.add("dsd-desktop"), document.body.classList.remove("dsd-mobile", "dsd-tablet"));
  }
  return Os.policyApplications++, !0;
}
function Kb(e, t) {
  return e === V.value ? !1 : (pl.value = V.value, V.value = e, Os.breakpointChanges++, Os.lastChangeAt = Date.now(), vc(e, t), In("breakpoint-change", {
    previous: pl.value,
    current: V.value,
    breakpoint: sn[V.value],
    viewport: ua()
  }), !0);
}
function Xb() {
  return V.value;
}
function yc() {
  return V.value ? Object.assign({}, sn[V.value], { key: V.value }) : null;
}
function Jb() {
  return Object.assign({}, sn);
}
function Nf() {
  return V.value ? Object.assign({}, yf[V.value]) : null;
}
function Qb(e) {
  V.value && vc(V.value, Object.assign({ force: !0 }, e || {}));
}
function Ar() {
  if (!Vr.value) return;
  Os.resizeEvents++;
  const e = bf();
  Kb(e);
}
function $f() {
  Qs.value && clearTimeout(Qs.value), Qs.value = setTimeout(Ar, 100);
}
function vl(e) {
  if (wr.value) return !0;
  if (typeof window > "u") return !1;
  e = e || {}, ca.value = e.autoApply !== !1, V.value = bf(), vc(V.value, { animate: !1 }), window.addEventListener("resize", $f, { passive: !0 });
  const t = Object.keys(sn);
  for (let n = 0; n < t.length; n++) {
    const s = t[n], r = sn[s];
    let i = `(min-width: ${r.min}px)`;
    r.max !== 1 / 0 && (i += ` and (max-width: ${r.max}px)`);
    const o = window.matchMedia(i);
    Vs[s] = o, o.addEventListener ? o.addEventListener("change", Ar) : o.addListener && o.addListener(Ar);
  }
  return wr.value = !0, In("initialized", { breakpoint: V.value }), !0;
}
function Zb() {
  if (!wr.value || typeof window > "u") return !0;
  window.removeEventListener("resize", $f);
  const e = Object.keys(Vs);
  for (let t = 0; t < e.length; t++) {
    const n = Vs[e[t]];
    n.removeEventListener ? n.removeEventListener("change", Ar) : n.removeListener && n.removeListener(Ar);
  }
  for (const t in Vs)
    Vs.hasOwnProperty(t) && delete Vs[t];
  return Qs.value && (clearTimeout(Qs.value), Qs.value = null), wr.value = !1, In("destroyed", null), !0;
}
function e0() {
  Vr.value = !0, Ar(), In("enabled", null);
}
function t0() {
  Vr.value = !1, In("disabled", null);
}
function n0() {
  return Vr.value;
}
function bc() {
  return V.value === "xs" || V.value === "sm";
}
function Ec() {
  return V.value === "md";
}
function kc() {
  return V.value === "lg" || V.value === "xl" || V.value === "xxl";
}
function s0(e, t) {
  jn[e] = !!t, In("user-override", { region: e, override: !!t });
}
function r0(e) {
  delete jn[e], In("user-override-cleared", { region: e });
}
function i0() {
  for (let e in jn)
    jn.hasOwnProperty(e) && delete jn[e];
  In("all-overrides-cleared", null);
}
function zf() {
  return Object.assign({}, jn);
}
function o0(e) {
  ca.value = !!e, In("auto-apply-changed", { enabled: !!e });
}
function a0(e) {
  return typeof e != "function" ? () => {
  } : (Zs.push(e), function() {
    const t = Zs.indexOf(e);
    t >= 0 && Zs.splice(t, 1);
  });
}
function Sc() {
  return Object.assign({}, Os);
}
function l0() {
  const e = {
    initialized: wr.value,
    enabled: Vr.value,
    hasBreakpoint: !!V.value,
    noErrors: Os.errors === 0
  }, t = Object.keys(e);
  let n = 0;
  for (let r = 0; r < t.length; r++)
    e[t[r]] && n++;
  const s = t.length;
  return {
    status: n === s ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/${s}`,
    checks: e,
    currentBreakpoint: V.value,
    breakpointInfo: yc(),
    isMobile: bc(),
    isTablet: Ec(),
    isDesktop: kc(),
    viewport: ua(),
    metrics: Sc(),
    version: rc,
    moduleId: ic,
    timestamp: Date.now()
  };
}
function c0() {
  return {
    moduleId: ic,
    version: rc,
    initialized: wr.value,
    enabled: Vr.value,
    autoApplyPolicies: ca.value,
    currentBreakpoint: V.value,
    previousBreakpoint: pl.value,
    breakpointInfo: yc(),
    currentPolicy: Nf(),
    isMobile: bc(),
    isTablet: Ec(),
    isDesktop: kc(),
    viewport: ua(),
    userOverrides: zf(),
    listenerCount: Zs.length,
    metrics: Sc(),
    breakpoints: sn,
    timestamp: Date.now()
  };
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  vl();
}) : vl());
const ne = {
  VERSION: rc,
  MODULE_ID: ic,
  init: vl,
  destroy: Zb,
  enable: e0,
  disable: t0,
  isEnabled: n0,
  getCurrentBreakpoint: Xb,
  getBreakpointInfo: yc,
  getBreakpoints: Jb,
  getCurrentPolicy: Nf,
  reapplyPolicy: Qb,
  isMobile: bc,
  isTablet: Ec,
  isDesktop: kc,
  setUserOverride: s0,
  clearUserOverride: r0,
  clearAllOverrides: i0,
  getUserOverrides: zf,
  setAutoApply: o0,
  subscribe: a0,
  getMetrics: Sc,
  healthCheck: l0,
  info: c0
}, kn = Object.freeze({
  globalState: { enabled: !0, lazy: !1, instance: null },
  auth: { enabled: !0, lazy: !0, instance: null },
  layout: { enabled: !0, lazy: !1, instance: null },
  theme: { enabled: !0, lazy: !1, instance: null },
  notification: { enabled: !0, lazy: !0, instance: null },
  router: { enabled: !0, lazy: !0, instance: null },
  ticker: { enabled: !0, lazy: !0, instance: null },
  responsive: { enabled: !0, lazy: !1, instance: null }
}), Kn = /* @__PURE__ */ new Map(), Co = { adaptersConnected: 0, errors: 0 };
function cs(e, t) {
  if (Kn.has(e))
    return Promise.resolve({ ok: !0, adapter: e, cached: !0 });
  const n = kn[e];
  return !n || !n.enabled ? Promise.resolve({ ok: !1, error: `Adapter not enabled: ${e}` }) : la(`adapter-${e}`, () => new Promise((s) => {
    try {
      let r;
      t ? r = typeof t.init == "function" ? t.init() : t : r = { name: e, connected: !0 }, Kn.set(e, {
        name: e,
        instance: r,
        connectedAt: Date.now(),
        healthy: !0
      }), Co.adaptersConnected++, s({ ok: !0, adapter: e });
    } catch (r) {
      Co.errors++, s({ ok: !1, error: r.message });
    }
  })).catch((s) => (Co.errors++, { ok: !1, error: s.message }));
}
function u0() {
  const e = [];
  return Kn.forEach((t, n) => {
    try {
      t.instance && typeof t.instance.destroy == "function" && t.instance.destroy(), e.push(n);
    } catch {
      Co.errors++;
    }
  }), Kn.clear(), e;
}
function sr() {
  const e = [];
  return Kn.forEach((t, n) => {
    e.push({
      name: n,
      connectedAt: t.connectedAt,
      healthy: t.healthy
    });
  }), e;
}
function d0() {
  const e = {};
  return Kn.forEach((t, n) => {
    try {
      t.instance && typeof t.instance.healthCheck == "function" ? e[n] = t.instance.healthCheck() : e[n] = { status: "HEALTHY", connected: !0 };
    } catch (s) {
      e[n] = { status: "ERROR", error: s.message };
    }
  }), e;
}
function jf() {
  const e = {};
  return Kn.forEach((t, n) => {
    try {
      t.instance && typeof t.instance.info == "function" ? e[n] = t.instance.info() : e[n] = { name: n, connectedAt: t.connectedAt };
    } catch (s) {
      e[n] = { error: s.message };
    }
  }), e;
}
function p0() {
  const e = {};
  return Kn.forEach((t, n) => {
    e[n] = t.instance || null;
  }), e;
}
const Hf = "app-shell-store", Uf = et({ moduleId: Hf });
function f0() {
  Uf.init();
}
function Bf(e) {
  return Uf.get(e);
}
const Ff = (e, ...t) => {
  const n = Bf("logger");
  if (!n) return;
  const s = n[e] || n.info;
  typeof s == "function" && s(`[${Hf}]`, ...t);
}, qe = Object.freeze({ IDLE: "IDLE", MOUNTING: "MOUNTING", MOUNTED: "MOUNTED", INITIALIZING: "INITIALIZING", READY: "READY", DEGRADED: "DEGRADED", FAILED: "FAILED", UNMOUNTING: "UNMOUNTING", DESTROYED: "DESTROYED" }), Ho = Object.freeze({ DEBOUNCE_MS: 16, MAX_HISTORY: 50, MAX_SUBSCRIBERS: 100 }), h0 = Object.freeze({ phase: qe.IDLE, mounted: !1, ready: !1, error: null, lastTransitionAt: null, transitionHistory: [], meta: {} });
let de = { ...h0, transitionHistory: [] }, mi = [], el = null, tl = !1, So = null, Le = { transitions: 0, subscriptions: 0, unsubscriptions: 0, notifications: 0, debounced: 0, errors: 0, invalidCallbacks: 0, bootTime: null, phaseTimings: {} };
function ns() {
  return Date.now();
}
function g0(e) {
  if (typeof e != "function")
    return Le.invalidCallbacks++, !1;
  const t = e.toString();
  return t.includes("eval(") || t.includes("Function(") ? (Le.invalidCallbacks++, Ff("warn", "Callback rejeitado: contém eval/Function"), !1) : !0;
}
function Vf() {
  if (tl) {
    Le.debounced++;
    return;
  }
  tl = !0, el && clearTimeout(el), el = setTimeout(() => {
    tl = !1, Le.notifications++;
    const e = Dn();
    mi.forEach((t) => {
      try {
        t(e);
      } catch {
        Le.errors++;
      }
    });
  }, Ho.DEBOUNCE_MS);
}
function m0(e, t, n = {}) {
  const s = { from: e, to: t, at: ns(), duration: de.lastTransitionAt ? ns() - de.lastTransitionAt : 0, ...n };
  de.transitionHistory = [...de.transitionHistory.slice(-(Ho.MAX_HISTORY - 1)), s], Le.phaseTimings[t] || (Le.phaseTimings[t] = { count: 0, totalTime: 0 }), Le.phaseTimings[t].count++;
}
function oo(e, t = {}) {
  if (f0(), !Object.values(qe).includes(e))
    return Le.errors++, !1;
  const n = de.phase;
  if (n === e) return !0;
  if (e === qe.MOUNTING && !So && (So = ns()), e === qe.READY && So && (Le.bootTime = ns() - So), de.lastTransitionAt && Le.phaseTimings[n] && (Le.phaseTimings[n].totalTime += ns() - de.lastTransitionAt), m0(n, e, t), de = { ...de, phase: e, lastTransitionAt: ns(), meta: { ...t, prevPhase: n } }, (e === qe.MOUNTED || e === qe.READY || e === qe.DEGRADED) && (de.mounted = !0), e === qe.READY && (de.ready = !0), (e === qe.FAILED || e === qe.DESTROYED || e === qe.IDLE) && (de.mounted = !1, de.ready = !1), e === qe.UNMOUNTING && (de.ready = !1), Le.transitions++, Vf(), e === qe.DEGRADED)
    try {
      const s = Bf("eventBus");
      s != null && s.emit && s.emit(Gl.DEGRADED, { phase: e, meta: t, timestamp: ns() });
    } catch {
    }
  return !0;
}
function Dn() {
  return { ...de, transitionHistory: [...de.transitionHistory] };
}
function v0() {
  return de.phase;
}
function y0() {
  return de.mounted;
}
function ha() {
  return de.ready;
}
function Gf() {
  return [...de.transitionHistory];
}
function b0(e) {
  de.error = null, Vf();
}
function Yf(e) {
  return g0(e) ? mi.length >= Ho.MAX_SUBSCRIBERS ? (Ff("warn", `Max subscribers (${Ho.MAX_SUBSCRIBERS}) reached`), () => {
  }) : (mi.push(e), Le.subscriptions++, () => {
    const t = mi.indexOf(e);
    t >= 0 && (mi.splice(t, 1), Le.unsubscriptions++);
  }) : () => {
  };
}
function ga() {
  return oo(qe.MOUNTED);
}
function Tc() {
  return oo(qe.READY);
}
function ao() {
  return Le.bootTime;
}
function qf() {
  return { ...Le.phaseTimings };
}
const E0 = "5.6.2-EXPORT-FIX", Wf = "app-shell-lifecycle", Kf = et({ moduleId: Wf });
function wc() {
  Kf.init();
}
const Xf = { inits: 0, readyMarks: 0, failMarks: 0, resets: 0 };
function k0() {
  return wc(), ga(), oo("mounted"), !0;
}
function S0() {
  return wc(), oo("unmounting"), !0;
}
function T0() {
  return wc(), Xf.resets++, oo("idle"), ga(), Tc(), b0(), !0;
}
function w0() {
  return Object.assign({}, Xf);
}
function C0() {
  const e = Dn(), t = Kf.snapshot();
  return {
    moduleId: Wf,
    version: E0,
    phase: e.phase,
    mounted: e.mounted,
    ready: e.ready,
    error: e.error,
    metrics: w0(),
    portsStatus: { initialized: t._initialized },
    timestamp: Date.now()
  };
}
function Jf() {
  return C0();
}
const $p = Object.freeze({
  "skip-links": { tag: "nav", role: "navigation", ariaLabel: "Skip links", layoutClass: null },
  preloader: { tag: "div", role: "status", ariaLabel: "Loading", ariaLive: "polite", layoutClass: "dsd-shell__region--preloader" },
  login: { tag: "main", role: "main", ariaLabel: "Login", uarpsRegion: "auth", layoutClass: "dsd-shell__region--login" },
  toast: { tag: "div", role: "status", ariaLabel: "Notifications", ariaLive: "polite", layoutClass: "dsd-shell__region--toast" },
  header: { tag: "header", role: "banner", ariaLabel: "Header", uarpsRegion: "header", layoutClass: "dsd-shell__region--header" },
  ticker: { tag: "div", role: "marquee", ariaLabel: "News ticker", ariaLive: "off", layoutClass: "dsd-shell__region--ticker" },
  "nav-rail": { tag: "nav", role: "navigation", ariaLabel: "Main navigation", uarpsRegion: "navigation", layoutClass: "dsd-shell__region--nav-rail" },
  sidebar: { tag: "aside", role: "complementary", ariaLabel: "Sidebar", uarpsRegion: "sidebar", layoutClass: "dsd-shell__region--sidebar" },
  main: { tag: "main", role: "main", ariaLabel: "Main content", uarpsRegion: "main", layoutClass: "dsd-shell__region--main" },
  footer: { tag: "footer", role: "contentinfo", ariaLabel: "Footer", uarpsRegion: "footer", layoutClass: "dsd-shell__region--footer" }
});
let Ao = null;
function A0() {
  const e = document.createElement("div");
  return e.id = "app-shell", e.setAttribute("role", "application"), e.setAttribute("aria-label", "Application Shell"), e;
}
function I0(e) {
  D0(e);
  const t = Object.keys($p);
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    if (s === "skip-links") continue;
    const r = $p[s], i = document.createElement(r.tag);
    i.id = s, i.setAttribute("data-region", s), r.layoutClass && (i.className = r.layoutClass), r.role && i.setAttribute("role", r.role), r.ariaLabel && i.setAttribute("aria-label", r.ariaLabel), r.ariaLive && i.setAttribute("aria-live", r.ariaLive), r.uarpsRegion && i.setAttribute("data-uarps-region", r.uarpsRegion), e.appendChild(i);
  }
}
function D0(e) {
  const t = document.createElement("nav");
  t.id = "skip-links", t.className = "sr-only", t.setAttribute("role", "navigation"), t.setAttribute("aria-label", "Skip links");
  const n = [
    { href: "#main", text: "Skip to main content" },
    { href: "#nav-rail", text: "Skip to navigation" },
    { href: "#sidebar", text: "Skip to sidebar" }
  ];
  for (let s = 0; s < n.length; s++) {
    const r = document.createElement("a");
    r.href = n[s].href, r.className = "a11y-skip-link", r.textContent = n[s].text, t.appendChild(r);
  }
  e.insertBefore(t, e.firstChild);
}
function O0() {
  Ao = document.activeElement;
}
function x0() {
  if (Ao && typeof Ao.focus == "function")
    try {
      return Ao.focus(), !0;
    } catch {
      return !1;
    }
  return !1;
}
function R0() {
  const e = document.getElementById("main") || document.querySelector('[data-region="main"]');
  return e ? (e.setAttribute("tabindex", "-1"), e.focus(), !0) : !1;
}
function _0(e) {
  const t = document.getElementById(e) || document.querySelector('[data-region="' + e + '"]');
  return t ? (t.setAttribute("tabindex", "-1"), t.focus(), !0) : !1;
}
function L0(e, t) {
  t = t || "polite";
  let n = document.getElementById("app-shell-announcer");
  n || (n = document.createElement("div"), n.id = "app-shell-announcer", n.setAttribute("role", "status"), n.setAttribute("aria-live", t), n.setAttribute("aria-atomic", "true"), n.className = "sr-only", n.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;", document.body.appendChild(n)), n.setAttribute("aria-live", t), n.textContent = "", setTimeout(function() {
    n.textContent = e;
  }, 100);
}
const Be = Object.freeze({
  BOOTING: "app-shell--booting",
  BOOTED: "app-shell--booted",
  READY: "app-shell--ready",
  LOADING: "app-shell--loading",
  ERROR: "app-shell--error",
  REDUCED_MOTION: "app-shell--reduced-motion"
});
let Wt = !1, zp = null;
function M0() {
  if (typeof window > "u" || !window.matchMedia)
    return !1;
  const e = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (Wt = e.matches, !zp) {
    const t = (n) => {
      Wt = n.matches;
      const s = document.getElementById("app-shell");
      s && (Wt ? s.classList.add(Be.REDUCED_MOTION) : s.classList.remove(Be.REDUCED_MOTION));
    };
    e.addEventListener ? e.addEventListener("change", t) : e.addListener && e.addListener(t), zp = t;
  }
  return Wt;
}
function P0() {
  if (typeof document > "u") return;
  M0();
  const e = document.getElementById("app-shell");
  e && (e.classList.add(Be.BOOTING), Wt && e.classList.add(Be.REDUCED_MOTION), e.style.setProperty("will-change", "opacity, transform"), requestAnimationFrame(() => {
    e.classList.remove(Be.BOOTING), e.classList.add(Be.BOOTED), setTimeout(() => {
      e.style.removeProperty("will-change");
    }, 500);
  }));
}
function N0(e) {
  if (typeof document > "u") return;
  const t = document.getElementById("app-shell");
  t && (e ? t.classList.add(Be.LOADING) : t.classList.remove(Be.LOADING));
}
function $0(e) {
  if (typeof document > "u") return;
  const t = document.getElementById("app-shell");
  t && (e ? t.classList.add(Be.ERROR) : t.classList.remove(Be.ERROR));
}
function z0(e) {
  return e = e || 500, new Promise((t) => {
    if (typeof document > "u") {
      t();
      return;
    }
    const n = document.getElementById("preloader") || document.querySelector('[data-region="preloader"]');
    if (!n) {
      t();
      return;
    }
    if (Wt) {
      n.style.display = "none", n.setAttribute("aria-hidden", "true"), t();
      return;
    }
    n.style.transition = `opacity ${e}ms ease-out`, n.style.opacity = "0", setTimeout(() => {
      n.style.display = "none", n.setAttribute("aria-hidden", "true"), t();
    }, e);
  });
}
function j0() {
  if (typeof document > "u") return;
  const e = document.getElementById("app-shell");
  if (!e) return;
  const t = Object.values(Be);
  for (let n = 0; n < t.length; n++)
    e.classList.remove(t[n]);
  e.removeAttribute("data-ready");
}
function H0() {
  return Wt;
}
function Qf() {
  if (typeof document > "u")
    return { classes: [], ready: !1, reducedMotion: Wt };
  const e = document.getElementById("app-shell");
  if (!e)
    return { classes: [], ready: !1, reducedMotion: Wt };
  const t = [], n = Object.keys(Be);
  for (let s = 0; s < n.length; s++) {
    const r = Be[n[s]];
    e.classList.contains(r) && t.push(r);
  }
  return {
    classes: t,
    ready: e.classList.contains(Be.READY),
    loading: e.classList.contains(Be.LOADING),
    error: e.classList.contains(Be.ERROR),
    reducedMotion: Wt
  };
}
const U0 = "app-shell-mount", B0 = et({ moduleId: U0 });
function Cc() {
  B0.init();
}
const xs = { mounts: 0, unmounts: 0, finalizes: 0, errors: 0 };
function F0(e) {
  return Cc(), new Promise((t) => {
    try {
      const n = A0();
      I0(n), document.getElementById("app-shell") || document.body.appendChild(n), P0(), k0(), ga(!0), xs.mounts++, t({ ok: !0, shell: n });
    } catch (n) {
      xs.errors++, t({ ok: !1, error: n.message });
    }
  });
}
function V0() {
  return Cc(), new Promise((e) => {
    try {
      S0(), j0();
      const t = document.getElementById("app-shell");
      t && t.parentNode && t.parentNode.removeChild(t), ga(!1), Tc(!1), T0(), xs.unmounts++, e({ ok: !0 });
    } catch (t) {
      xs.errors++, e({ ok: !1, error: t.message });
    }
  });
}
function G0() {
  Cc();
  try {
    const e = document.getElementById("app-shell");
    return e && (e.classList.add("ready"), e.setAttribute("data-ready", "true")), Tc(!0), xs.finalizes++, { ok: !0 };
  } catch (e) {
    return xs.errors++, { ok: !1, error: e.message };
  }
}
function Zf() {
  const e = Dn(), t = typeof document < "u" && !!document.getElementById("app-shell");
  return {
    mounted: e.mounted || !1,
    ready: e.ready || !1,
    shellExists: t,
    phase: e.phase || "idle",
    metrics: Object.assign({}, xs),
    timestamp: Date.now()
  };
}
const Y0 = "4.3.0-P2-ENTERPRISE", eh = "app-shell-telemetry", Mi = "app-shell", th = et({ moduleId: eh });
function Ac() {
  th.init();
}
function Pi(e) {
  return th.get(e);
}
function q0() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}
let nl = null, W0 = null;
function K0() {
  return nl || (nl = q0()), nl;
}
const nh = Object.freeze({
  MOUNT_START: "shell:mount:start",
  MOUNT_SUCCESS: "shell:mount:success",
  MOUNT_FAILED: "shell:mount:failed",
  UNMOUNT_START: "shell:unmount:start",
  UNMOUNT_SUCCESS: "shell:unmount:success",
  LIFECYCLE_CHANGE: "shell:lifecycle:change",
  READY: "shell:ready",
  ERROR: "shell:error",
  WARNING: "shell:warning",
  HEALTH_CHECK: "shell:health:check",
  HEALTH_DEGRADED: "shell:health:degraded",
  REGION_ACCESS: "shell:region:access",
  ADAPTER_CONNECT: "shell:adapter:connect",
  ADAPTER_DISCONNECT: "shell:adapter:disconnect",
  PERFORMANCE: "shell:performance"
});
function Ic(e, t, n) {
  return n = n || {}, {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: e,
    component: Mi,
    moduleId: eh,
    event: t,
    traceId: K0(),
    correlationId: W0,
    context: n,
    version: Y0
  };
}
function Ir(e, t) {
  Ac();
  const n = Ic("info", e, t);
  try {
    const s = Pi("telemetry"), r = Pi("logger");
    s && s.event ? s.event(`${Mi}:${e}`, n) : r && r.info && r.info(`[${Mi}] ${e}`, n);
  } catch {
  }
  return n;
}
function sh(e, t) {
  Ac(), t = t || {};
  const n = Ic("error", nh.ERROR, {
    error: e.message || String(e),
    stack: e.stack || null,
    code: e.code || "UNKNOWN",
    ...t
  });
  try {
    const s = Pi("logger"), r = Pi("telemetry");
    s && s.error && s.error(`[${Mi}] Error`, n), r && r.error && r.error(`${Mi}:error`, n);
  } catch {
  }
  return n;
}
function X0(e) {
  Ac();
  const t = Ic(
    e.status === "HEALTHY" ? "info" : "warn",
    nh.HEALTH_CHECK,
    { status: e.status, score: e.score, issues: e.issues ? e.issues.length : 0, checks: e.checks }
  );
  try {
    const n = Pi("eventBus");
    e.status !== "HEALTHY" && n && n.emit && n.emit(Gl.HEALTH_REPORT, t);
  } catch {
  }
  return t;
}
const Dc = "1.1.0-P2-ENTERPRISE", Oc = "app-shell-performance-metrics", F = {
  bootTime: null,
  initDuration: null,
  firstPaint: null,
  firstContentfulPaint: null,
  domInteractive: null,
  domComplete: null,
  resourceCount: 0,
  resourceSize: 0,
  jsHeapUsed: null,
  jsHeapTotal: null,
  longTasks: [],
  layoutShifts: [],
  cumulativeLayoutShift: 0
}, bi = [], jp = { maxHistory: 100, sampleInterval: 5e3 };
let Ni = !1, Ei = null, ki = [];
function J0() {
  return Ni ? !0 : typeof performance > "u" ? !1 : (eE(), tE(), xc(), Rc(), nE(), Z0(), Ni = !0, !0);
}
function Q0() {
  Ei && (clearInterval(Ei), Ei = null);
  for (let e = 0; e < ki.length; e++)
    try {
      ki[e].disconnect();
    } catch {
    }
  ki = [], Ni = !1;
}
function Z0() {
  Ei || (Ei = setInterval(function() {
    Rc(), xc(), bi.push({
      timestamp: Date.now(),
      metrics: Object.assign({}, F)
    }), bi.length > jp.maxHistory && bi.shift();
  }, jp.sampleInterval));
}
function eE() {
  if (!performance.timing) return;
  const e = performance.timing;
  F.bootTime = e.responseStart - e.navigationStart, F.domInteractive = e.domInteractive - e.navigationStart, F.domComplete = e.domComplete - e.navigationStart;
}
function tE() {
  const e = performance.getEntriesByType("paint");
  for (let t = 0; t < e.length; t++)
    e[t].name === "first-paint" && (F.firstPaint = Math.round(e[t].startTime)), e[t].name === "first-contentful-paint" && (F.firstContentfulPaint = Math.round(e[t].startTime));
}
function xc() {
  const e = performance.getEntriesByType("resource");
  F.resourceCount = e.length, F.resourceSize = e.reduce((t, n) => t + (n.transferSize || 0), 0);
}
function Rc() {
  performance.memory && (F.jsHeapUsed = performance.memory.usedJSHeapSize, F.jsHeapTotal = performance.memory.totalJSHeapSize);
}
function nE() {
  if (!(typeof PerformanceObserver > "u")) {
    try {
      const e = new PerformanceObserver((t) => {
        const n = t.getEntries();
        for (let s = 0; s < n.length; s++)
          F.longTasks.push({ duration: n[s].duration, startTime: n[s].startTime }), F.longTasks.length > 50 && F.longTasks.shift();
      });
      e.observe({ entryTypes: ["longtask"] }), ki.push(e);
    } catch {
    }
    try {
      const e = new PerformanceObserver((t) => {
        const n = t.getEntries();
        for (let s = 0; s < n.length; s++)
          n[s].hadRecentInput || (F.cumulativeLayoutShift += n[s].value, F.layoutShifts.push({ value: n[s].value, startTime: n[s].startTime }), F.layoutShifts.length > 50 && F.layoutShifts.shift());
      });
      e.observe({ entryTypes: ["layout-shift"] }), ki.push(e);
    } catch {
    }
  }
}
function sE(e) {
  performance.mark && performance.mark(e);
}
function rE(e, t, n) {
  if (performance.measure) try {
    performance.measure(e, t, n);
  } catch {
  }
}
function iE(e) {
  performance.clearMarks && performance.clearMarks(e);
}
function oE(e) {
  performance.clearMeasures && performance.clearMeasures(e);
}
function aE() {
  return performance.getEntriesByType ? performance.getEntriesByType("mark").map(function(e) {
    return { name: e.name, startTime: e.startTime };
  }) : [];
}
function lE() {
  return performance.getEntriesByType ? performance.getEntriesByType("measure").map(function(e) {
    return { name: e.name, startTime: e.startTime, duration: e.duration };
  }) : [];
}
function cE(e) {
  F.initDuration = e;
}
function uE(e) {
  F.bootTime = e;
}
function rh() {
  return Rc(), xc(), Object.assign({}, F);
}
function dE() {
  return bi.slice();
}
function _c() {
  return {
    FCP: F.firstContentfulPaint,
    CLS: Math.round(F.cumulativeLayoutShift * 1e3) / 1e3,
    TTFB: F.bootTime
  };
}
function ih() {
  const e = performance.getEntriesByType("resource"), t = { script: 0, stylesheet: 0, img: 0, font: 0, fetch: 0, other: 0 };
  for (let n = 0; n < e.length; n++) {
    const s = e[n].initiatorType;
    t.hasOwnProperty(s) ? t[s]++ : t.other++;
  }
  return t;
}
function pE(e) {
  return () => {
  };
}
function fE() {
  const e = {
    initialized: Ni,
    fcp: F.firstContentfulPaint !== null,
    noExcessiveCLS: F.cumulativeLayoutShift < 0.25
  }, t = Object.values(e).filter(Boolean).length;
  return {
    status: t === 3 ? "HEALTHY" : "DEGRADED",
    score: `${t}/3`,
    checks: e,
    webVitals: _c(),
    version: Dc,
    moduleId: Oc,
    timestamp: Date.now()
  };
}
function hE() {
  return {
    moduleId: Oc,
    version: Dc,
    initialized: Ni,
    metrics: rh(),
    webVitals: _c(),
    resourceBreakdown: ih(),
    sampleHistorySize: bi.length,
    timestamp: Date.now()
  };
}
const ue = {
  VERSION: Dc,
  MODULE_ID: Oc,
  init: J0,
  destroy: Q0,
  mark: sE,
  measure: rE,
  clearMarks: iE,
  clearMeasures: oE,
  getMetrics: rh,
  getMarks: aE,
  getMeasures: lE,
  getSampleHistory: dE,
  setInitDuration: cE,
  setBootTime: uE,
  getWebVitals: _c,
  getResourceBreakdown: ih,
  subscribe: pE,
  healthCheck: fE,
  info: hE
}, Lc = "1.4.0-P2-ENTERPRISE", Rs = "app-shell-auto-health-check", yl = typeof window < "u", lo = et({ moduleId: Rs });
let bl = !1;
function gE() {
  bl || (lo.init(), bl = !0);
}
function mE() {
  return gE(), lo.get("eventBus");
}
function vE() {
  const e = lo.get("appShell");
  if (e) return e;
  if (yl && window.Core && window.Core.windowAdapter) {
    const t = window.Core.windowAdapter.get("AppShell");
    if (t) return t;
  }
  return yl && window.AppShell ? Ur() ? (_p("WINDOW_ACCESS", {
    target: "window.AppShell",
    module: Rs,
    suggestion: "Use Ports.get('appShell') ou Core.windowAdapter.get('AppShell')"
  }), null) : (_p("WINDOW_FALLBACK", {
    target: "window.AppShell",
    module: Rs,
    suggestion: "Migre para Ports.get('appShell')"
  }), window.AppShell) : null;
}
function yE(e) {
  return lo.inject(e);
}
function bE() {
  return lo.snapshot();
}
let Hn = null, rn = !1, Uo = null, $i = null, oh = 0, Si = [];
const Io = [], A = { enabled: !0, interval: 3e4, emitEvents: !0, logChanges: !0, onDegraded: null, onUnhealthy: null, onRecovered: null }, _t = { totalChecks: 0, healthy: 0, degraded: 0, unhealthy: 0, transitions: 0, errors: 0 };
function Mc(e, t) {
  Io.forEach((n) => {
    try {
      n(e, t);
    } catch {
    }
  });
}
function Pc(e, t) {
  if (!A.emitEvents) return;
  const n = mE();
  n && n.emit && n.emit(oy.HEALTH_PREFIX + e, { ...t, source: Rs, timestamp: Date.now() });
}
function zi() {
  _t.totalChecks++, oh++, Uo = Date.now();
  let e;
  try {
    const n = vE();
    n && n.healthCheck ? e = n.healthCheck() : e = { status: "HEALTHY", score: "1/1", checks: { autoCheck: !0 } };
  } catch (n) {
    _t.errors++, e = { status: "UNHEALTHY", score: "0/1", checks: { error: !1 }, error: n.message };
  }
  const t = $i;
  if ($i = e.status, e.status === "HEALTHY" ? _t.healthy++ : e.status === "DEGRADED" ? _t.degraded++ : _t.unhealthy++, Si.push({ status: e.status, score: e.score, timestamp: Uo }), Si.length > 50 && Si.shift(), t && t !== e.status) {
    if (_t.transitions++, Pc("status-changed", { previous: t, current: e.status, result: e }), Mc("status-changed", { previous: t, current: e.status, result: e }), A.logChanges && console.log(`[AutoHealthCheck] Status changed: ${t} -> ${e.status}`), e.status === "DEGRADED" && A.onDegraded)
      try {
        A.onDegraded(e);
      } catch {
      }
    else if (e.status === "UNHEALTHY" && A.onUnhealthy)
      try {
        A.onUnhealthy(e);
      } catch {
      }
    else if (e.status === "HEALTHY" && t !== "HEALTHY" && A.onRecovered)
      try {
        A.onRecovered(e);
      } catch {
      }
  }
  return e;
}
function EE(e) {
  return rn ? { ok: !1, error: "Already running" } : (e = e || {}, e.interval !== void 0 && (A.interval = Math.max(1e3, Math.min(3e5, e.interval))), e.emitEvents !== void 0 && (A.emitEvents = !!e.emitEvents), e.logChanges !== void 0 && (A.logChanges = !!e.logChanges), e.onDegraded !== void 0 && (A.onDegraded = e.onDegraded), e.onUnhealthy !== void 0 && (A.onUnhealthy = e.onUnhealthy), e.onRecovered !== void 0 && (A.onRecovered = e.onRecovered), zi(), Hn = setInterval(zi, A.interval), rn = !0, Pc("started", { interval: A.interval }), Mc("started", { interval: A.interval }), { ok: !0, interval: A.interval });
}
function kE() {
  return rn ? (Hn && (clearInterval(Hn), Hn = null), rn = !1, Pc("stopped", {}), Mc("stopped", {}), { ok: !0 }) : { ok: !1, error: "Not running" };
}
function SE() {
  return zi();
}
function TE() {
  return rn;
}
function wE(e) {
  e.interval !== void 0 && (A.interval = Math.max(1e3, Math.min(3e5, e.interval))), e.emitEvents !== void 0 && (A.emitEvents = !!e.emitEvents), e.logChanges !== void 0 && (A.logChanges = !!e.logChanges), e.onDegraded !== void 0 && (A.onDegraded = e.onDegraded), e.onUnhealthy !== void 0 && (A.onUnhealthy = e.onUnhealthy), e.onRecovered !== void 0 && (A.onRecovered = e.onRecovered), rn && (clearInterval(Hn), Hn = setInterval(zi, A.interval));
}
function ah() {
  return { enabled: A.enabled, interval: A.interval, emitEvents: A.emitEvents, logChanges: A.logChanges, hasCallbacks: { onDegraded: !!A.onDegraded, onUnhealthy: !!A.onUnhealthy, onRecovered: !!A.onRecovered } };
}
function lh() {
  return { running: rn, lastCheck: Uo, lastStatus: $i, checkCount: oh };
}
function CE() {
  return $i;
}
function AE() {
  return Uo;
}
function ch() {
  return Si.slice();
}
function IE() {
  return ch();
}
function DE(e) {
  typeof e == "number" && e >= 1e3 && (A.interval = e, rn && (clearInterval(Hn), Hn = globalThis.setInterval(zi, A.interval)));
}
function OE(e) {
  return typeof e == "function" && Io.push(e), () => {
    const t = Io.indexOf(e);
    t >= 0 && Io.splice(t, 1);
  };
}
function Nc() {
  return Object.assign({}, _t, { healthyRate: _t.totalChecks > 0 ? Math.round(_t.healthy / _t.totalChecks * 100) : 100 });
}
function xE() {
  const e = { running: rn, noErrors: _t.errors === 0, recentCheckHealthy: $i === "HEALTHY", portsInitialized: bl, strictModeCompliant: !0 }, t = Object.values(e).filter(Boolean).length;
  return { status: t >= 4 ? "HEALTHY" : t >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${t}/5`, checks: e, metrics: Nc(), p0Enterprise: !0, strictMode: Ur(), version: Lc, moduleId: Rs, timestamp: Date.now() };
}
function RE() {
  return { moduleId: Rs, version: Lc, running: rn, config: ah(), status: lh(), metrics: Nc(), historyLength: Si.length, strictMode: Ur(), timestamp: Date.now() };
}
const Ie = {
  VERSION: Lc,
  MODULE_ID: Rs,
  start: EE,
  stop: kE,
  checkNow: SE,
  isRunning: TE,
  configure: wE,
  getConfig: ah,
  getStatus: lh,
  getLastStatus: CE,
  getLastCheckTime: AE,
  getHistory: ch,
  getStatusHistory: IE,
  setInterval: DE,
  subscribe: OE,
  getMetrics: Nc,
  healthCheck: xE,
  info: RE,
  injectPorts: yE,
  getPorts: bE
};
yl && typeof window.__DEVTOOLS__ < "u" && (window.__DEVTOOLS__.AutoHealthCheck = Ie);
const $c = "1.0.0-P2-ENTERPRISE", zc = "app-shell-api-usage-metrics", xe = /* @__PURE__ */ new Map();
let zs = !0, uh = Date.now();
const It = {
  trackAll: !0,
  sampleRate: 1,
  maxEntries: 1e3,
  persistToStorage: !1
};
function _E() {
  return zs ? It.sampleRate < 1 ? Math.random() < It.sampleRate : !0 : !1;
}
function LE(e, t) {
  const n = `${e}.${t}`;
  return xe.has(n) || xe.set(n, {
    namespace: e,
    method: t,
    calls: 0,
    errors: 0,
    firstCall: null,
    lastCall: null,
    totalDuration: 0,
    avgDuration: 0
  }), xe.get(n);
}
function Do(e, t, n, s) {
  if (!_E()) return;
  const r = LE(e, t), i = Date.now();
  if (r.calls++, r.lastCall = i, r.firstCall || (r.firstCall = i), s && r.errors++, typeof n == "number" && n >= 0 && (r.totalDuration += n, r.avgDuration = Math.round(r.totalDuration / r.calls)), xe.size > It.maxEntries) {
    let o = null, a = 1 / 0;
    xe.forEach((l, c) => {
      l.lastCall < a && (a = l.lastCall, o = c);
    }), o && xe.delete(o);
  }
}
function ME(e, t, n) {
  return function() {
    const s = performance.now();
    let r = !1, i;
    try {
      if (i = n.apply(this, arguments), i && typeof i.then == "function")
        return i.then((o) => (Do(e, t, performance.now() - s, !1), o)).catch((o) => {
          throw Do(e, t, performance.now() - s, !0), o;
        });
    } catch (o) {
      throw r = !0, o;
    } finally {
      (!i || typeof i.then != "function") && Do(e, t, performance.now() - s, r);
    }
    return i;
  };
}
function PE(e, t) {
  if (t) {
    const s = `${e}.${t}`;
    return xe.get(s) || null;
  }
  const n = [];
  return xe.forEach((s) => {
    s.namespace === e && n.push(Object.assign({}, s));
  }), n;
}
function dh() {
  const e = [];
  return xe.forEach((t) => {
    e.push(Object.assign({}, t));
  }), e;
}
function ph(e) {
  e = e || 10;
  const t = dh();
  return t.sort((n, s) => s.calls - n.calls), t.slice(0, e);
}
function NE(e) {
  const t = /* @__PURE__ */ new Set();
  xe.forEach((s, r) => {
    t.add(r);
  });
  const n = [];
  for (let s = 0; s < e.length; s++)
    t.has(e[s]) || n.push(e[s]);
  return n;
}
function $E() {
  const e = [];
  return xe.forEach((t) => {
    t.errors > 0 && e.push(Object.assign({}, t, {
      errorRate: `${Math.round(t.errors / t.calls * 100)}%`
    }));
  }), e;
}
function fh() {
  const e = {};
  return xe.forEach((t) => {
    e[t.namespace] || (e[t.namespace] = { calls: 0, errors: 0, methods: 0 }), e[t.namespace].calls += t.calls, e[t.namespace].errors += t.errors, e[t.namespace].methods++;
  }), e;
}
function zE() {
  zs = !0;
}
function jE() {
  zs = !1;
}
function HE() {
  return zs;
}
function UE(e) {
  e.trackAll !== void 0 && (It.trackAll = !!e.trackAll), e.sampleRate !== void 0 && (It.sampleRate = Math.max(0, Math.min(1, e.sampleRate))), e.maxEntries !== void 0 && (It.maxEntries = Math.max(100, e.maxEntries)), e.persistToStorage !== void 0 && (It.persistToStorage = !!e.persistToStorage);
}
function hh() {
  return {
    enabled: zs,
    trackAll: It.trackAll,
    sampleRate: It.sampleRate,
    maxEntries: It.maxEntries,
    persistToStorage: It.persistToStorage
  };
}
function BE() {
  xe.clear(), uh = Date.now();
}
function FE() {
  let e = 0, t = 0;
  xe.forEach((i) => {
    e += i.calls, t += i.errors;
  });
  const n = {
    enabled: zs,
    notOverloaded: xe.size < It.maxEntries * 0.9,
    lowErrorRate: e === 0 || t / e < 0.1
  };
  let s = 0;
  const r = Object.keys(n);
  for (let i = 0; i < r.length; i++)
    n[r[i]] && s++;
  return {
    status: s === r.length ? "HEALTHY" : s >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${s}/${r.length}`,
    checks: n,
    totalAPIs: xe.size,
    totalCalls: e,
    totalErrors: t,
    version: $c,
    moduleId: zc,
    timestamp: Date.now()
  };
}
function VE() {
  let e = 0, t = 0;
  return xe.forEach((n) => {
    e += n.calls, t += n.errors;
  }), {
    moduleId: zc,
    version: $c,
    enabled: zs,
    config: hh(),
    totalAPIs: xe.size,
    totalCalls: e,
    totalErrors: t,
    uptime: Date.now() - uh,
    topAPIs: ph(5),
    summaryByNamespace: fh(),
    timestamp: Date.now()
  };
}
const Z = {
  VERSION: $c,
  MODULE_ID: zc,
  // Core
  trackCall: Do,
  wrapMethod: ME,
  // Queries
  getMetrics: PE,
  getAllMetrics: dh,
  getTopAPIs: ph,
  getUnusedAPIs: NE,
  getAPIsWithErrors: $E,
  getSummaryByNamespace: fh,
  // Config
  enable: zE,
  disable: jE,
  isEnabled: HE,
  configure: UE,
  getConfig: hh,
  reset: BE,
  // Health
  healthCheck: FE,
  info: VE
};
let rr = null, Bo = null, ir = null, Fo = null, Vo = null, Go = null;
function GE() {
  return `leak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function YE(e) {
  rr || (rr = EventTarget.prototype.addEventListener, Bo = EventTarget.prototype.removeEventListener, EventTarget.prototype.addEventListener = function(t, n, s) {
    const r = GE(), i = this;
    return e.set(r, {
      id: r,
      target: i,
      targetName: i.constructor ? i.constructor.name : "Unknown",
      type: t,
      listener: n,
      options: s,
      addedAt: Date.now(),
      stack: new Error().stack
    }), rr.call(this, t, n, s);
  }, EventTarget.prototype.removeEventListener = function(t, n, s) {
    return e.forEach(function(r, i) {
      r.target === this && r.type === t && r.listener === n && e.delete(i);
    }, this), Bo.call(this, t, n, s);
  });
}
function qE() {
  rr && (EventTarget.prototype.addEventListener = rr, EventTarget.prototype.removeEventListener = Bo, rr = null, Bo = null);
}
function WE(e, t) {
  ir || (ir = window.setInterval, Fo = window.clearInterval, Vo = window.setTimeout, Go = window.clearTimeout, window.setInterval = function(n, s) {
    const r = ir.apply(window, arguments);
    return e.set(r, {
      id: r,
      delay: s,
      createdAt: Date.now(),
      stack: new Error().stack
    }), r;
  }, window.clearInterval = (n) => (e.delete(n), Fo.call(window, n)), window.setTimeout = function(n, s) {
    const r = Vo.apply(window, arguments);
    t.set(r, {
      id: r,
      delay: s,
      createdAt: Date.now(),
      stack: new Error().stack
    });
    const i = n;
    return arguments[0] = function() {
      if (t.delete(r), typeof i == "function")
        return i.apply(this, arguments);
    }, r;
  }, window.clearTimeout = (n) => (t.delete(n), Go.call(window, n)));
}
function KE() {
  ir && (window.setInterval = ir, window.clearInterval = Fo, window.setTimeout = Vo, window.clearTimeout = Go, ir = null, Fo = null, Vo = null, Go = null);
}
function jc(e) {
  const t = [], n = Date.now();
  if (e.trackedListeners.forEach((s, r) => {
    const i = s.target;
    i && i.nodeType === 1 && (document.contains(i) || t.push({
      type: "detached-listener",
      id: r,
      targetName: s.targetName,
      eventType: s.type,
      age: n - s.addedAt,
      stack: s.stack
    }));
  }), e.trackedIntervals.forEach((s, r) => {
    const i = n - s.createdAt;
    i > 3e5 && t.push({
      type: "long-interval",
      id: r,
      delay: s.delay,
      age: i,
      stack: s.stack
    });
  }), e.trackedTimeouts.forEach((s, r) => {
    const i = n - s.createdAt, o = s.delay + 1e4;
    i > o && i > 6e4 && t.push({
      type: "orphan-timeout",
      id: r,
      delay: s.delay,
      age: i,
      stack: s.stack
    });
  }), e.metrics.checksPerformed++, e.metrics.lastCheck = n, t.length > 0) {
    e.metrics.leaksDetected += t.length;
    const s = {
      timestamp: n,
      leakCount: t.length,
      leaks: t,
      summary: {
        detachedListeners: t.filter((r) => r.type === "detached-listener").length,
        longIntervals: t.filter((r) => r.type === "long-interval").length,
        orphanTimeouts: t.filter((r) => r.type === "orphan-timeout").length
      }
    };
    for (e.leakReports.push(s); e.leakReports.length > e.config.maxReports; )
      e.leakReports.shift();
    return s;
  }
  return null;
}
const Hc = "1.1.0-P2-ENTERPRISE", Uc = "app-shell-memory-leak-detector", ma = /* @__PURE__ */ new Map(), va = /* @__PURE__ */ new Map(), ya = /* @__PURE__ */ new Map(), gh = /* @__PURE__ */ new WeakMap(), Un = [];
let Xn = !1, yn = null;
const pe = {
  autoCheck: !1,
  checkIntervalMs: 6e4,
  maxReports: 100,
  warnThreshold: 50,
  criticalThreshold: 100
}, us = {
  checksPerformed: 0,
  leaksDetected: 0,
  leaksResolved: 0,
  lastCheck: null
}, Bc = {
  get trackedListeners() {
    return ma;
  },
  get trackedIntervals() {
    return va;
  },
  get trackedTimeouts() {
    return ya;
  },
  get leakReports() {
    return Un;
  },
  get config() {
    return pe;
  },
  get metrics() {
    return us;
  }
};
function XE() {
  return Xn ? !1 : (Xn = !0, YE(ma), WE(va, ya), pe.autoCheck && (yn = setInterval(() => {
    jc(Bc);
  }, pe.checkIntervalMs)), !0);
}
function JE() {
  return Xn ? (Xn = !1, qE(), KE(), yn && (clearInterval(yn), yn = null), !0) : !1;
}
function QE() {
  return Xn;
}
function ZE() {
  return jc(Bc);
}
function ek() {
  const e = [];
  return ma.forEach((t) => {
    e.push({ id: t.id, targetName: t.targetName, type: t.type, age: Date.now() - t.addedAt });
  }), e;
}
function tk() {
  const e = [];
  return va.forEach((t) => {
    e.push({ id: t.id, delay: t.delay, age: Date.now() - t.createdAt });
  }), e;
}
function nk() {
  const e = [];
  return ya.forEach((t) => {
    e.push({ id: t.id, delay: t.delay, age: Date.now() - t.createdAt });
  }), e;
}
function sk(e) {
  return e ? Un.slice(-e) : Un.slice();
}
function mh() {
  return Un.length > 0 ? Un[Un.length - 1] : null;
}
function rk() {
  Un.length = 0;
}
function ik(e, t) {
  !t || typeof t != "object" || gh.set(t, { name: e, trackedAt: Date.now() });
}
function ok(e) {
  gh.delete(e);
}
function ak(e) {
  e.autoCheck !== void 0 && (pe.autoCheck = !!e.autoCheck), e.checkIntervalMs !== void 0 && (pe.checkIntervalMs = Math.max(1e4, e.checkIntervalMs)), e.maxReports !== void 0 && (pe.maxReports = Math.max(10, e.maxReports)), e.warnThreshold !== void 0 && (pe.warnThreshold = e.warnThreshold), e.criticalThreshold !== void 0 && (pe.criticalThreshold = e.criticalThreshold), Xn && pe.autoCheck && !yn ? yn = setInterval(() => {
    jc(Bc);
  }, pe.checkIntervalMs) : yn && !pe.autoCheck && (clearInterval(yn), yn = null);
}
function Fc() {
  return {
    enabled: Xn,
    autoCheck: pe.autoCheck,
    checkIntervalMs: pe.checkIntervalMs,
    maxReports: pe.maxReports,
    warnThreshold: pe.warnThreshold,
    criticalThreshold: pe.criticalThreshold
  };
}
function Vc() {
  return {
    checksPerformed: us.checksPerformed,
    leaksDetected: us.leaksDetected,
    leaksResolved: us.leaksResolved,
    lastCheck: us.lastCheck,
    trackedListeners: ma.size,
    trackedIntervals: va.size,
    trackedTimeouts: ya.size,
    reportCount: Un.length
  };
}
function lk() {
  const e = Vc(), t = {
    notTooManyListeners: e.trackedListeners < pe.criticalThreshold,
    notTooManyIntervals: e.trackedIntervals < 50,
    recentCheck: !pe.autoCheck || !us.lastCheck || Date.now() - us.lastCheck < pe.checkIntervalMs * 2
  };
  let n = 0;
  const s = Object.keys(t);
  for (let i = 0; i < s.length; i++)
    t[s[i]] && n++;
  let r = "HEALTHY";
  return e.trackedListeners >= pe.criticalThreshold || e.trackedIntervals >= 50 ? r = "UNHEALTHY" : (e.trackedListeners >= pe.warnThreshold || n < s.length) && (r = "DEGRADED"), {
    status: r,
    score: `${n}/${s.length}`,
    checks: t,
    metrics: e,
    config: Fc(),
    version: Hc,
    moduleId: Uc,
    timestamp: Date.now()
  };
}
function ck() {
  return {
    moduleId: Uc,
    version: Hc,
    enabled: Xn,
    config: Fc(),
    metrics: Vc(),
    lastReport: mh(),
    timestamp: Date.now()
  };
}
const me = {
  VERSION: Hc,
  MODULE_ID: Uc,
  enable: XE,
  disable: JE,
  isEnabled: QE,
  checkNow: ZE,
  getTrackedListeners: ek,
  getTrackedIntervals: tk,
  getTrackedTimeouts: nk,
  getLeakReports: sk,
  getLastReport: mh,
  clearReports: rk,
  trackReference: ik,
  untrackReference: ok,
  configure: ak,
  getConfig: Fc,
  getMetrics: Vc,
  healthCheck: lk,
  info: ck
}, uk = {
  console: {
    name: "console",
    send(e) {
      console.group(`[Analytics Export] ${e.length} events`);
      for (let t = 0; t < e.length; t++)
        console.log(e[t]);
      return console.groupEnd(), Promise.resolve({ success: !0, count: e.length });
    }
  },
  localStorage: {
    name: "localStorage",
    send(e) {
      try {
        let t = JSON.parse(localStorage.getItem("app-shell-analytics") || "[]").concat(e);
        return t.length > 500 && (t = t.slice(-500)), localStorage.setItem("app-shell-analytics", JSON.stringify(t)), Promise.resolve({ success: !0, count: e.length, stored: t.length });
      } catch (t) {
        return Promise.reject(t);
      }
    }
  },
  beacon: {
    name: "beacon",
    endpoint: null,
    send(e) {
      const t = this.endpoint;
      if (!t) return Promise.reject(new Error("Beacon endpoint not configured"));
      const n = JSON.stringify({ events: e, timestamp: Date.now() });
      return navigator.sendBeacon(t, n) ? Promise.resolve({ success: !0, count: e.length }) : Promise.reject(new Error("Beacon failed"));
    }
  },
  fetch: {
    name: "fetch",
    endpoint: null,
    headers: {},
    send(e) {
      const t = this.endpoint;
      if (!t) return Promise.reject(new Error("Fetch endpoint not configured"));
      const n = Object.assign({ "Content-Type": "application/json" }, this.headers);
      return fetch(t, {
        method: "POST",
        headers: n,
        body: JSON.stringify({ events: e, timestamp: Date.now() })
      }).then((s) => {
        if (!s.ok) throw new Error(`HTTP ${s.status}`);
        return { success: !0, count: e.length };
      });
    }
  }
};
function vh(e, t, n) {
  return !t || typeof t.send != "function" ? !1 : (n.set(e, {
    name: e,
    adapter: t,
    enabled: !0,
    sentCount: 0,
    errorCount: 0,
    lastSent: null,
    lastError: null
  }), !0);
}
function dk(e, t) {
  return t.delete(e);
}
function pk(e, t) {
  const n = t.get(e);
  return n ? (n.enabled = !0, !0) : !1;
}
function fk(e, t) {
  const n = t.get(e);
  return n ? (n.enabled = !1, !0) : !1;
}
function hk(e) {
  const t = [];
  return e.forEach((n) => {
    t.push({
      name: n.name,
      enabled: n.enabled,
      sentCount: n.sentCount,
      errorCount: n.errorCount,
      lastSent: n.lastSent,
      lastError: n.lastError
    });
  }), t;
}
function gk(e, t, n) {
  const s = uk[e];
  if (!s) return !1;
  const r = Object.assign({}, s);
  return t && Object.assign(r, t), vh(e, r, n);
}
function mk() {
  if (typeof sessionStorage < "u") {
    let e = sessionStorage.getItem("app-shell-session-id");
    return e || (e = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, sessionStorage.setItem("app-shell-session-id", e)), e;
  }
  return "unknown";
}
function ba(e, t, n) {
  if (!n.enabled) return !1;
  const s = {
    name: e,
    data: t || {},
    timestamp: Date.now(),
    sessionId: mk()
  };
  for (n.queue.push(s), n.metrics.eventsQueued++; n.queue.length > n.config.maxQueueSize; )
    n.queue.shift();
  return n.queue.length >= n.config.batchSize && Gc(n), !0;
}
function vk(e, t, n, s) {
  return ba("performance", { metric: e, duration: t, metadata: n || {} }, s);
}
function yk(e, t, n) {
  return ba("error", { message: e.message || String(e), stack: e.stack, context: t || {} }, n);
}
function bk(e, t) {
  return ba("health-check", { status: e.status, score: e.score, checks: e.checks }, t);
}
function yh(e, t, n, s, r) {
  return r = r || 1, e.adapter.send(t).then((i) => (e.sentCount += t.length, e.lastSent = Date.now(), s.eventsSent += t.length, s.batchesSent++, i)).catch((i) => {
    if (r < n.retryAttempts)
      return new Promise((o) => {
        setTimeout(o, n.retryDelayMs * r);
      }).then(() => yh(e, t, n, s, r + 1));
    throw e.errorCount++, e.lastError = { message: i.message, timestamp: Date.now() }, s.eventsFailed += t.length, i;
  });
}
function Gc(e) {
  if (e.queue.length === 0) return Promise.resolve({ sent: 0 });
  const t = e.queue.splice(0, e.config.batchSize), n = [];
  return e.adapters.forEach((s) => {
    s.enabled && n.push(yh(s, t, e.config, e.metrics).catch((r) => ({
      error: r.message,
      adapter: s.name
    })));
  }), n.length === 0 ? (e.queue.unshift.apply(e.queue, t), Promise.resolve({ sent: 0, reason: "no-adapters" })) : Promise.all(n).then((s) => ({
    sent: t.length,
    results: s
  }));
}
function Ek(e) {
  const t = [];
  for (; e.queue.length > 0; )
    t.push(Gc(e));
  return Promise.all(t).then((n) => {
    let s = 0;
    for (let r = 0; r < n.length; r++)
      s += n[r].sent || 0;
    return { totalSent: s, batches: n.length };
  });
}
const Yc = "1.1.0-P2-ENTERPRISE", qc = "app-shell-analytics-exporter", On = /* @__PURE__ */ new Map(), _s = [];
let on = !1, Mn = null;
const Ue = {
  batchSize: 10,
  batchIntervalMs: 5e3,
  maxQueueSize: 1e3,
  retryAttempts: 3,
  retryDelayMs: 1e3
}, Pn = {
  eventsQueued: 0,
  eventsSent: 0,
  eventsFailed: 0,
  batchesSent: 0
}, Yr = {
  get enabled() {
    return on;
  },
  get queue() {
    return _s;
  },
  get adapters() {
    return On;
  },
  get config() {
    return Ue;
  },
  get metrics() {
    return Pn;
  }
};
function kk(e, t) {
  return vh(e, t, On);
}
function Sk(e) {
  return dk(e, On);
}
function Tk(e) {
  return pk(e, On);
}
function wk(e) {
  return fk(e, On);
}
function Wc() {
  return hk(On);
}
function Ck(e, t) {
  return gk(e, t, On);
}
function Ak(e, t) {
  return ba(e, t, Yr);
}
function Ik(e, t, n) {
  return vk(e, t, n, Yr);
}
function Dk(e, t) {
  return yk(e, t, Yr);
}
function Ok(e) {
  return bk(e, Yr);
}
function Kc() {
  return Gc(Yr);
}
function xk() {
  return Ek(Yr);
}
function Rk() {
  return on ? !1 : (on = !0, Ue.batchIntervalMs > 0 && (Mn = setInterval(Kc, Ue.batchIntervalMs)), !0);
}
function _k() {
  return on ? (on = !1, Mn && (clearInterval(Mn), Mn = null), !0) : !1;
}
function Lk() {
  return on;
}
function Mk() {
  return _s.length;
}
function Pk() {
  const e = _s.length;
  return _s.length = 0, e;
}
function Nk(e) {
  e.batchSize !== void 0 && (Ue.batchSize = Math.max(1, e.batchSize)), e.batchIntervalMs !== void 0 && (Ue.batchIntervalMs = Math.max(0, e.batchIntervalMs)), e.maxQueueSize !== void 0 && (Ue.maxQueueSize = Math.max(100, e.maxQueueSize)), e.retryAttempts !== void 0 && (Ue.retryAttempts = Math.max(0, e.retryAttempts)), e.retryDelayMs !== void 0 && (Ue.retryDelayMs = Math.max(100, e.retryDelayMs)), on && Mn && (clearInterval(Mn), Ue.batchIntervalMs > 0 ? Mn = setInterval(Kc, Ue.batchIntervalMs) : Mn = null);
}
function bh() {
  return {
    enabled: on,
    batchSize: Ue.batchSize,
    batchIntervalMs: Ue.batchIntervalMs,
    maxQueueSize: Ue.maxQueueSize,
    retryAttempts: Ue.retryAttempts,
    retryDelayMs: Ue.retryDelayMs
  };
}
function Xc() {
  return {
    eventsQueued: Pn.eventsQueued,
    eventsSent: Pn.eventsSent,
    eventsFailed: Pn.eventsFailed,
    batchesSent: Pn.batchesSent,
    currentQueueSize: _s.length,
    adaptersCount: On.size
  };
}
function $k() {
  const e = Xc();
  let t = !1;
  On.forEach((i) => {
    i.enabled && (t = !0);
  });
  const n = {
    enabled: on,
    hasAdapters: t,
    queueNotFull: _s.length < Ue.maxQueueSize * 0.9,
    lowFailRate: Pn.eventsQueued === 0 || Pn.eventsFailed / Pn.eventsQueued < 0.1
  };
  let s = 0;
  const r = Object.keys(n);
  for (let i = 0; i < r.length; i++)
    n[r[i]] && s++;
  return {
    status: s === r.length ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${s}/${r.length}`,
    checks: n,
    metrics: e,
    adapters: Wc(),
    version: Yc,
    moduleId: qc,
    timestamp: Date.now()
  };
}
function zk() {
  return {
    moduleId: qc,
    version: Yc,
    enabled: on,
    config: bh(),
    metrics: Xc(),
    adapters: Wc(),
    queueSize: _s.length,
    timestamp: Date.now()
  };
}
const L = {
  VERSION: Yc,
  MODULE_ID: qc,
  registerAdapter: kk,
  unregisterAdapter: Sk,
  enableAdapter: Tk,
  disableAdapter: wk,
  getAdapters: Wc,
  useBuiltInAdapter: Ck,
  track: Ak,
  trackPerformance: Ik,
  trackError: Dk,
  trackHealthCheck: Ok,
  flush: Kc,
  flushAll: xk,
  enable: Rk,
  disable: _k,
  isEnabled: Lk,
  getQueueSize: Mk,
  clearQueue: Pk,
  configure: Nk,
  getConfig: bh,
  getMetrics: Xc,
  healthCheck: $k,
  info: zk
}, Jc = "1.1.0-P2-ENTERPRISE", Eh = "app-shell-icons", ji = {
  // Navigation & UI
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>',
  keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>',
  // Debug Panel Tabs
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  regions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
  events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  performance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  state: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  snapshots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  metrics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  presets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
  memory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  // Actions
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>',
  chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  columns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
  highlight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  // Status
  checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  xCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  // Command Palette
  command: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  maximize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  // Debug Presets
  volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>',
  volumeX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  volume2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  fileText: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
};
function kh(e, t) {
  const n = ji[e];
  return n ? t ? n.replace("viewBox", `width="${t}" height="${t}" viewBox`) : n : "";
}
function jk(e, t, n) {
  const s = kh(e, t || 16);
  return `<span${n ? ` class="${n}"` : ""}>${s}</span>`;
}
function Hk() {
  return { status: "HEALTHY", iconsCount: Object.keys(ji).length, version: Jc };
}
function Uk() {
  return { moduleId: Eh, version: Jc, iconsCount: Object.keys(ji).length, icons: Object.keys(ji) };
}
const Yt = { VERSION: Jc, MODULE_ID: Eh, ICONS: ji, icon: kh, iconSpan: jk, healthCheck: Hk, info: Uk };
function d(e, t) {
  return Yt.icon(e, t || 16);
}
function Hi(e) {
  if (e === 0) return "0 B";
  const t = 1024, n = ["B", "KB", "MB", "GB"], s = Math.floor(Math.log(e) / Math.log(t));
  return `${parseFloat((e / Math.pow(t, s)).toFixed(2))} ${n[s]}`;
}
function Oo(e) {
  return e < 1e3 ? `${Math.round(e)}ms` : `${(e / 1e3).toFixed(2)}s`;
}
function co(e) {
  return new Date(e).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function g(e) {
  return e ? String(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}
function Dr(e) {
  switch (e) {
    case "HEALTHY":
      return "dsd-ui-status--healthy";
    case "DEGRADED":
      return "dsd-ui-status--degraded";
    case "UNHEALTHY":
      return "dsd-ui-status--unhealthy";
    default:
      return "";
  }
}
function Bk(e) {
  switch (e) {
    case "excellent":
      return "dsd-ui-status--healthy";
    case "good":
      return "dsd-ui-status--healthy";
    case "fair":
      return "dsd-ui-status--degraded";
    case "poor":
      return "dsd-ui-status--unhealthy";
    default:
      return "";
  }
}
function ie() {
  return typeof window < "u" ? window.AppShell : null;
}
function xn() {
  return typeof window < "u" && window.BootstrapV2 ? window.BootstrapV2 : null;
}
let Yo = {};
function Sh(e) {
  Yo = e || {};
}
function Th() {
  return Yo;
}
function Kt(e, t, n, s, r) {
  const i = Yo[e] !== void 0 ? Yo[e] : r || !1, o = i ? "chevronRight" : "chevronDown";
  return `<div class="dsd-ui-section${i ? " collapsed" : ""}" data-section-id="${g(e)}"><div class="dsd-ui-section__title dsd-ui-section__title--collapsible" data-toggle-section="${g(e)}"><span class="dsd-ui-section__chevron">${d(o, 12)}</span> ${d(t)} ${n}</div><div class="dsd-ui-section__body"${i ? ' style="display:none"' : ""}>${s}</div></div>`;
}
let Gt = [];
const Hp = 50;
let sl = null;
const Fk = 1e4;
function Vk(e, t, n) {
  const s = ie(), r = xn();
  let i = "N/A", o = "N/A";
  try {
    s && (i = s.healthCheck().status);
  } catch {
    i = "ERROR";
  }
  try {
    r && r.healthCheck && (o = r.healthCheck().status);
  } catch {
    o = "ERROR";
  }
  const a = `${i}|${o}`, l = Gt.length > 0 ? Gt[Gt.length - 1] : null;
  (!l || l.combined !== a) && (Gt.push({
    timestamp: Date.now(),
    shell: i,
    bootstrap: o,
    combined: a,
    issueCount: Ea(e)
  }), Gt.length > Hp && (Gt = Gt.slice(-Hp)), sl !== null && sl !== a && t && n(i), sl = a, (i !== "HEALTHY" || o !== "HEALTHY") && Gk(i, o, e));
}
function Gk(e, t, n) {
  const s = ie();
  if (!(!s || !s.stateSnapshots))
    try {
      const r = `auto:issue:${e}/${t}`;
      s.stateSnapshots.capture(r);
    } catch (r) {
      n("_autoSnapshotOnIssue", r);
    }
}
function Ea(e) {
  let t = 0;
  const n = ie(), s = xn();
  if (n)
    try {
      const r = n.healthCheck();
      r.status !== "HEALTHY" && t++;
      const i = r.adapters || {};
      if (Object.keys(i).forEach((o) => {
        i[o] !== "HEALTHY" && t++;
      }), n.regionMetrics) {
        const o = n.regionMetrics.getProblematicRegions();
        t += o.length;
      }
      if (n.apiMetrics) {
        const o = n.apiMetrics.getAPIsWithErrors();
        t += o.length;
      }
      if (n.memoryLeaks) {
        const o = n.memoryLeaks.getLastReport();
        o && o.potentialLeaks && (t += o.potentialLeaks.length);
      }
    } catch (r) {
      e("_getIssueCount:shell", r);
    }
  if (s)
    try {
      const r = s.healthCheck ? s.healthCheck() : {};
      r.status && r.status !== "HEALTHY" && t++, s.isBootCancelled && s.isBootCancelled() && t++;
    } catch (r) {
      e("_getIssueCount:bs", r);
    }
  return t;
}
function Yk() {
  const e = ie(), t = xn(), n = {};
  if (e) {
    try {
      const s = e.healthCheck();
      s.status !== "HEALTHY" && (n.overview = !0);
      const r = s.adapters || {};
      Object.keys(r).forEach((i) => {
        r[i] !== "HEALTHY" && (n.overview = !0);
      });
    } catch {
    }
    try {
      e.regionMetrics && e.regionMetrics.getProblematicRegions().length > 0 && (n.regionMetrics = !0);
    } catch {
    }
    try {
      e.apiMetrics && e.apiMetrics.getAPIsWithErrors().length > 0 && (n.apiMetrics = !0);
    } catch {
    }
    try {
      if (e.memoryLeaks) {
        const s = e.memoryLeaks.getLastReport();
        s && s.potentialLeaks && s.potentialLeaks.length > 0 && (n.memory = !0);
      }
    } catch {
    }
  }
  if (t)
    try {
      const s = t.healthCheck ? t.healthCheck() : {};
      s.status && s.status !== "HEALTHY" && (n.bootstrap = !0), t.isBootCancelled && t.isBootCancelled() && (n.bootstrap = !0);
    } catch {
    }
  return n;
}
function wh() {
  return Gt;
}
function qo() {
  return Fk;
}
function qk(e, t) {
  if (!t) return;
  const n = t.querySelector(".dsd-ui-header");
  if (!n) return;
  const s = e === "HEALTHY" ? "dsd-ui-flash--healthy" : e === "DEGRADED" ? "dsd-ui-flash--degraded" : "dsd-ui-flash--unhealthy";
  n.classList.add(s), setTimeout(() => {
    n.classList.remove(s);
  }, 2e3);
}
function Wk() {
  return Gt.length === 0 ? "" : `<div class="dsd-ui-section"><div class="dsd-ui-section__title">Health History (last 10)</div><div class="dsd-ui-log">${Gt.slice(-10).reverse().map((e) => `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${co(e.timestamp)}</span><span class="${Dr(e.shell)}">${e.shell}</span><span class="${Dr(e.bootstrap)}">${e.bootstrap}</span><span>Issues: ${e.issueCount}</span></div>`).join("")}</div></div>`;
}
function Kk(e, t, n) {
  if (!e) return;
  const s = e.querySelector("#dsd-debug-close");
  s && (s.onclick = n.close);
  const r = e.querySelector("#dsd-debug-refresh");
  r && (r.onclick = n.forceRender);
  const i = e.querySelector("#dsd-debug-export");
  i && (i.onclick = n.exportDiagnostic);
  const o = e.querySelector("#dsd-debug-copy");
  o && (o.onclick = n.copyTabData);
  const a = e.querySelector("#dsd-debug-compact");
  a && (a.onclick = n.toggleCompact);
  const l = e.querySelector("#dsd-debug-pin");
  l && (l.onclick = n.togglePinTab);
  const c = e.querySelector("#dsd-debug-theme");
  c && (c.onclick = n.toggleTheme), e.querySelectorAll(".dsd-ui-tab").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-tab");
      m && n.switchTab(m);
    };
  });
  const u = e.querySelector("#dsd-debug-search");
  u && (u.value = t.searchQuery || "", u.oninput = (w) => {
    n.onSearchInput(w.target.value);
  }), e.querySelectorAll(".dsd-ui-section__title--collapsible").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-section");
      m && n.toggleSection(m);
    };
  });
  const h = e.querySelector("#dsd-debug-clear-network");
  h && (h.onclick = n.clearNetwork);
  const E = e.querySelector("#dsd-debug-scan-idb");
  E && (E.onclick = n.scanIdb);
  const v = e.querySelector("#dsd-diff-left"), T = e.querySelector("#dsd-diff-right"), he = e.querySelector("#dsd-diff-run");
  he && v && T && (he.onclick = () => {
    n.runDiff(v.value, T.value);
  });
  const te = e.querySelector("#dsd-otel-export");
  te && n.otelExport && (te.onclick = n.otelExport);
  const hn = e.querySelector("#dsd-validate-manifest");
  hn && n.validateManifest && (hn.onclick = n.validateManifest);
  const oe = e.querySelector("#dsd-cancel-boot");
  oe && n.cancelBoot && (oe.onclick = n.cancelBoot), e.querySelectorAll("[data-snapshot-action]").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-snapshot-action"), J = w.getAttribute("data-snapshot-id");
      n.snapshotAction && n.snapshotAction(m, J);
    };
  }), e.querySelectorAll("[data-metrics-action]").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-metrics-action");
      n.metricsAction && n.metricsAction(m);
    };
  }), e.querySelectorAll(".dsd-ui-preset-btn").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-preset");
      n.applyPreset && n.applyPreset(m);
    };
  }), e.querySelectorAll("[data-api-action]").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-api-action");
      n.apiAction && n.apiAction(m);
    };
  }), e.querySelectorAll("[data-memory-action]").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-memory-action");
      n.memoryAction && n.memoryAction(m);
    };
  }), e.querySelectorAll("[data-doc-example]").forEach((w) => {
    w.onclick = () => {
      const m = w.getAttribute("data-doc-example");
      n.runDocExample && n.runDocExample(m);
    };
  });
}
function Xk() {
  const e = ie();
  if (!e)
    return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const t = e.healthCheck(), n = e.info();
    let s = n.capabilities.slice(0, 20).map((i) => `<span class="dsd-ui-tag">${g(i)}</span>`).join("");
    n.capabilities.length > 20 && (s += `<span class="dsd-ui-tag">+${n.capabilities.length - 20} more</span>`);
    const r = Object.keys(t.adapters || {}).map((i) => {
      const o = t.adapters[i];
      return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(i)}</span><span class="dsd-ui-list-item__value ${Dr(o)}">${g(o)}</span></div>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("activity")} App Shell Status</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Version</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(n.version)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Health</div><div class="dsd-ui-card__value ${Dr(t.status)}">${g(t.status)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Score</div><div class="dsd-ui-card__value">${g(t.score)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Phase</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(n.phase)}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("state")} Capabilities (${n.capabilities.length})</div><div class="dsd-ui-tags">${s}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("api")} Adapters (${n.connectedAdapters.length})</div><div class="dsd-ui-list">${r}</div></div>${Wk()}`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering overview: ${g(t.message)}</div>`;
  }
}
function Jk() {
  const e = xn();
  if (!e)
    return '<div class="dsd-ui-empty">BootstrapV2 not available. Ensure window.BootstrapV2 is accessible.</div>';
  try {
    const t = e.healthCheck ? e.healthCheck() : { status: "UNKNOWN", version: "N/A" }, n = e.getNetworkInfo ? e.getNetworkInfo() : { quality: "unknown", effectiveType: "N/A", rtt: 0, downlink: 0 }, s = e.getLazyStats ? e.getLazyStats() : { total: 0, loaded: 0 }, r = e.isBootCancelled ? { cancelled: e.isBootCancelled() } : { cancelled: !1 };
    let i = "";
    if (e.analyzeErrorPatterns) {
      const o = e.analyzeErrorPatterns();
      o && o.patterns && (i = `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("alertTriangle")} Error Analysis</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Patterns Found</div><div class="dsd-ui-card__value">${o.patterns.length || 0}</div></div></div></div>`);
    }
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("zap")} Bootstrap-v2 Status</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Version</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(e.VERSION || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Health</div><div class="dsd-ui-card__value ${Dr(t.status)}">${g(t.status)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Cancelled</div><div class="dsd-ui-card__value ${r.cancelled ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${r.cancelled ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Enterprise</div><div class="dsd-ui-card__value ${e.ENTERPRISE ? "dsd-ui-status--healthy" : ""}">${e.ENTERPRISE ? "YES" : "NO"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("globe")} Network Info</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Quality</div><div class="dsd-ui-card__value ${Bk(n.quality)}">${g((n.quality || "N/A").toUpperCase())}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Type</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(n.effectiveType || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">RTT</div><div class="dsd-ui-card__value">${n.rtt || 0}ms</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Online</div><div class="dsd-ui-card__value ${e.isOnline && e.isOnline() ? "dsd-ui-status--healthy" : "dsd-ui-status--unhealthy"}">${e.isOnline && e.isOnline() ? "YES" : "NO"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("clock")} Lazy Loading</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Registered</div><div class="dsd-ui-card__value">${s.registered || 0}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Loaded</div><div class="dsd-ui-card__value dsd-ui-status--healthy">${s.loaded || 0}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("cpu")} OpenTelemetry</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Available</div><div class="dsd-ui-card__value ${e.OpenTelemetry ? "dsd-ui-status--healthy" : ""}">${e.OpenTelemetry ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Observability</div><div class="dsd-ui-card__value">${e.OBSERVABILITY ? "YES" : "NO"}</div></div></div><div class="dsd-ui-toolbar" style="margin-top:8px"><button class="dsd-ui-btn" id="btn-export-otel">${d("fileText", 14)} Export Spans</button></div></div>${i}<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("tool")} Actions</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-validate-manifest">${d("checkCircle", 14)} Validate Manifest</button><button class="dsd-ui-btn" id="btn-cancel-boot" ${r.cancelled ? "disabled" : ""}>${d("xCircle", 14)} Cancel Boot</button></div></div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering bootstrap: ${g(t.message)}</div>`;
  }
}
function Qk() {
  const e = ie();
  if (!e) return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const t = e.info().regions, n = Object.keys(t.health || {}).filter((i) => i !== "_summary").map((i) => {
      const o = t.health[i], a = o && o.exists ? "HEALTHY" : "UNHEALTHY";
      return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(i)}</span><span class="dsd-ui-list-item__value ${Dr(a)}">${a}</span></div>`;
    }).join(""), s = Object.keys(t.visibility || {}).map((i) => {
      const o = t.visibility[i];
      return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(i)}</span><span class="dsd-ui-list-item__value ${o ? "dsd-ui-status--healthy" : ""}">${o ? "VISIBLE" : "HIDDEN"}</span></div>`;
    }).join(""), r = Object.keys(t.sizes || {}).map((i) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(i)}</span><span class="dsd-ui-list-item__value">${t.sizes[i]}px</span></div>`).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("checkCircle")} Region Health</div><div class="dsd-ui-list">${n}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("eye")} Visibility</div><div class="dsd-ui-list">${s}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("layout")} Sizes</div><div class="dsd-ui-list">${r}</div></div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering regions: ${g(t.message)}</div>`;
  }
}
function Zk() {
  const e = ie();
  if (!e) return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const t = e.events.info(), n = e.events.getHistory({ limit: 20 }).reverse().map((s) => `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${new Date(s.timestamp).toLocaleTimeString()}</span><span class="dsd-ui-status--accent">${g(s.region)}</span><span>${g(s.type)}</span></div>`).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("events")} Event System</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Emitted</div><div class="dsd-ui-card__value">${t.metrics.eventsEmitted}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Listeners</div><div class="dsd-ui-card__value">${t.metrics.listenersAdded}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("clock")} Recent Events</div><div class="dsd-ui-log">${n}</div></div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering events: ${g(t.message)}</div>`;
  }
}
function eS(e) {
  const t = ie();
  if (!t) return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const n = t.info(), s = n.metrics, r = typeof performance < "u" ? performance : null, i = r && r.memory ? r.memory : null, o = i ? `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("memory")} Memory</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Used</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${Hi(i.usedJSHeapSize)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${Hi(i.totalJSHeapSize)}</div></div></div></div>` : "";
    let a = "";
    const l = Object.keys(e || {});
    if (l.length > 0) {
      const u = l.map((h) => {
        const E = e[h], v = E.avg > 50 ? "dsd-ui-status--unhealthy" : E.avg > 20 ? "dsd-ui-status--degraded" : "dsd-ui-status--healthy";
        return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(h)}</span><span class="dsd-ui-list-item__value ${v}">${E.avg.toFixed(1)}ms (last: ${E.last.toFixed(1)}ms, max: ${E.max.toFixed(1)}ms)</span></div>`;
      }).join("");
      a = `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("performance")} Tab Render Timings</div><div class="dsd-ui-list">${u}</div></div>`;
    }
    const c = Object.keys(n.phaseTimings || {}).map((u) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(u)}</span><span class="dsd-ui-list-item__value">${Oo(n.phaseTimings[u])}</span></div>`).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("zap")} Boot Performance</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Init Duration</div><div class="dsd-ui-card__value">${Oo(s.initDuration || 0)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Boot Time</div><div class="dsd-ui-card__value">${Oo(n.bootTime || 0)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Init Count</div><div class="dsd-ui-card__value">${s.initCount}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Errors</div><div class="dsd-ui-card__value ${s.errors > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${s.errors}</div></div></div></div>${o}${a}<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("clock")} Phase Timings</div><div class="dsd-ui-list">${c}</div></div>`;
  } catch (n) {
    return `<div class="dsd-ui-empty">Error rendering performance: ${g(n.message)}</div>`;
  }
}
function tS() {
  const e = ie();
  if (!e) return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const t = e.debug.store(), n = e.layoutPrefs.get(), s = e.theme.info();
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("state")} Shell State</div><pre class="dsd-ui-json">${g(JSON.stringify(t, null, 2))}</pre></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("sun")} Theme</div><div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">Current</span><span class="dsd-ui-list-item__value">${g(s.currentTheme)}</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">Resolved</span><span class="dsd-ui-list-item__value">${g(s.resolvedTheme)}</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">System</span><span class="dsd-ui-list-item__value">${g(s.systemPreference)}</span></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("layout")} Layout Preferences</div><pre class="dsd-ui-json">${g(JSON.stringify(n, null, 2))}</pre></div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering state: ${g(t.message)}</div>`;
  }
}
function nS() {
  const e = ie();
  if (!e || !e.stateSnapshots)
    return '<div class="dsd-ui-empty">StateSnapshots not available</div>';
  try {
    const t = e.stateSnapshots.getAll(), n = e.stateSnapshots.getMetrics(), s = e.stateSnapshots.isAutoSnapshotRunning(), r = t.length === 0 ? '<div class="dsd-ui-empty">No snapshots captured yet</div>' : t.slice(-10).reverse().map((i) => `<div class="dsd-ui-snapshot-item" data-id="${g(i.id)}"><div class="dsd-ui-snapshot-item__info"><div class="dsd-ui-snapshot-item__label">${g(i.label)}</div><div class="dsd-ui-snapshot-item__time">${co(i.timestamp)}</div></div><div class="dsd-ui-snapshot-item__actions"><button class="dsd-ui-btn" data-action="restore" data-id="${g(i.id)}">${d("undo", 14)}</button><button class="dsd-ui-btn" data-action="delete" data-id="${g(i.id)}">${d("trash", 14)}</button></div></div>`).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("snapshots")} State Snapshots</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-capture-snapshot">${d("snapshots", 14)} Capture</button><button class="dsd-ui-btn ${s ? "active" : ""}" id="btn-toggle-auto">${d(s ? "pause" : "play", 14)} Auto</button><button class="dsd-ui-btn" id="btn-clear-snapshots">${d("trash", 14)} Clear</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value">${t.length}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Captured</div><div class="dsd-ui-card__value">${n.snapshotsTaken}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Restored</div><div class="dsd-ui-card__value">${n.snapshotsRestored}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Auto</div><div class="dsd-ui-card__value ${s ? "dsd-ui-status--healthy" : ""}">${s ? "ON" : "OFF"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("fileText")} List (last 10)</div>${r}</div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering snapshots: ${g(t.message)}</div>`;
  }
}
function sS() {
  const e = ie();
  if (!e || !e.regionMetrics)
    return '<div class="dsd-ui-empty">RegionMetrics not available</div>';
  try {
    const t = e.regionMetrics.getAllMetrics(), n = e.regionMetrics.getPerformanceSummary(), s = e.regionMetrics.getProblematicRegions(), r = e.regionMetrics.isEnabled(), i = Object.keys(t).map((o) => {
      const a = t[o], l = s.some((c) => c.region === o);
      return `<div class="dsd-ui-region-metric ${l ? "has-issue" : ""}"><div class="dsd-ui-region-metric__name">${g(o)}${l ? ` ${d("alertTriangle", 12)}` : ""}</div><div class="dsd-ui-region-metric__stats"><span>Renders: ${a.renderCount}</span><span>Updates: ${a.updateCount}</span><span>Errors: <span class="${a.errorCount > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${a.errorCount}</span></span><span>Avg: ${Oo(a.avgRenderTime || 0)}</span></div></div>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("metrics")} Region Metrics</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${r ? "active" : ""}" id="btn-toggle-metrics">${d(r ? "pause" : "play", 14)} ${r ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-reset-metrics">${d("refresh", 14)} Reset</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Slowest</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(n.slowestRegion || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Active</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(n.mostActiveRegion || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Errors</div><div class="dsd-ui-card__value dsd-ui-card__value--sm ${n.mostErrorsRegion ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${g(n.mostErrorsRegion || "None")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Problematic</div><div class="dsd-ui-card__value">${s.length}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("regions")} Per Region</div>${i}</div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering region metrics: ${g(t.message)}</div>`;
  }
}
function rS() {
  const e = ie();
  if (!e || !e.debugPresets)
    return '<div class="dsd-ui-empty">DebugPresets not available</div>';
  try {
    const t = e.debugPresets.getCurrent(), n = e.debugPresets.listPresets(), s = e.debugPresets.isEnabled(), r = e.debugPresets.getMetrics(), i = {
      minimal: "volumeX",
      standard: "volume",
      verbose: "volume2",
      performance: "zap",
      network: "globe",
      memory: "cpu",
      events: "activity",
      regions: "regions"
    }, o = n.map((a) => {
      const l = t === a;
      return `<button class="dsd-ui-preset-btn ${l ? "active" : ""}" data-preset="${g(a)}"><div class="dsd-ui-preset-btn__icon">${d(i[a] || "presets", 20)}</div><div class="dsd-ui-preset-btn__name">${g(a)}</div>${l ? `<div class="dsd-ui-preset-btn__check">${d("check", 14)}</div>` : ""}</button>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("presets")} Debug Presets</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-disable-preset">${d("stop", 14)} Disable</button><button class="dsd-ui-btn" id="btn-revert-preset">${d("undo", 14)} Revert</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Current</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${g(t || "None")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Enabled</div><div class="dsd-ui-card__value ${s ? "dsd-ui-status--healthy" : ""}">${s ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Applied</div><div class="dsd-ui-card__value">${r.presetsApplied}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Changes</div><div class="dsd-ui-card__value">${r.presetChanges}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("layout")} Available Presets</div><div class="dsd-ui-presets-grid">${o}</div></div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering presets: ${g(t.message)}</div>`;
  }
}
function iS() {
  const e = ie();
  if (!e || !e.apiMetrics)
    return '<div class="dsd-ui-empty">APIUsageMetrics not available</div>';
  try {
    const t = e.apiMetrics.getTopAPIs(10), n = e.apiMetrics.getUnusedAPIs(), s = e.apiMetrics.getAPIsWithErrors(), r = e.apiMetrics.isEnabled(), i = e.apiMetrics.info().metrics, o = t.length === 0 ? '<div class="dsd-ui-empty">No API calls tracked yet</div>' : `<div class="dsd-ui-list">${t.map((l) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${g(`${l.namespace}.${l.method}`)}</span><span class="dsd-ui-list-item__value">${l.calls}</span></div>`).join("")}</div>`, a = s.length === 0 ? '<div class="dsd-ui-empty">No errors</div>' : `<div class="dsd-ui-list">${s.slice(0, 5).map((l) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label dsd-ui-status--unhealthy">${g(`${l.namespace}.${l.method}`)}</span><span class="dsd-ui-list-item__value dsd-ui-status--unhealthy">${l.errors}</span></div>`).join("")}</div>`;
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("api")} API Usage Metrics</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${r ? "active" : ""}" id="btn-toggle-api">${d(r ? "pause" : "play", 14)} ${r ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-reset-api">${d("refresh", 14)} Reset</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total Calls</div><div class="dsd-ui-card__value">${i.totalCalls}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Unique</div><div class="dsd-ui-card__value">${i.uniqueAPIs}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Errors</div><div class="dsd-ui-card__value ${i.totalErrors > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${i.totalErrors}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Unused</div><div class="dsd-ui-card__value">${n.length}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("zap")} Top 10 APIs</div>${o}</div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("xCircle")} APIs with Errors</div>${a}</div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering API metrics: ${g(t.message)}</div>`;
  }
}
function oS() {
  const e = ie();
  if (!e || !e.memoryLeaks)
    return '<div class="dsd-ui-empty">MemoryLeakDetector not available</div>';
  try {
    const t = e.memoryLeaks.info(), n = e.memoryLeaks.getLastReport(), s = e.memoryLeaks.isEnabled(), r = typeof performance < "u" ? performance : null, i = r && r.memory ? r.memory : null, o = i ? `<div class="dsd-ui-memory-bar"><div class="dsd-ui-memory-bar__fill" style="width:${Math.round(i.usedJSHeapSize / i.jsHeapSizeLimit * 100)}%"></div></div><div class="dsd-ui-memory-labels"><span>Used: ${Hi(i.usedJSHeapSize)}</span><span>Limit: ${Hi(i.jsHeapSizeLimit)}</span></div>` : '<div class="dsd-ui-empty">Memory API not available</div>', a = n && n.potentialLeaks && n.potentialLeaks.length > 0 ? `<div class="dsd-ui-list">${n.potentialLeaks.slice(0, 5).map((l) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label dsd-ui-status--degraded">${g(l.type)}</span><span class="dsd-ui-list-item__value">${l.count}</span></div>`).join("")}</div>` : '<div class="dsd-ui-empty">No potential leaks detected</div>';
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("memory")} Memory Analysis</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${s ? "active" : ""}" id="btn-toggle-memory">${d(s ? "pause" : "play", 14)} ${s ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-check-memory">${d("search", 14)} Check</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Listeners</div><div class="dsd-ui-card__value">${t.trackedListeners}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Intervals</div><div class="dsd-ui-card__value">${t.trackedIntervals}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Timeouts</div><div class="dsd-ui-card__value">${t.trackedTimeouts}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Reports</div><div class="dsd-ui-card__value">${t.metrics.checksPerformed}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("metrics")} Memory Usage</div>${o}</div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${d("alertTriangle")} Potential Leaks</div>${a}</div>`;
  } catch (t) {
    return `<div class="dsd-ui-empty">Error rendering memory: ${g(t.message)}</div>`;
  }
}
function aS(e) {
  if (!e) return "";
  try {
    return [
      { id: "overview", title: "Overview", icon: "overview", apis: [
        { name: "AppShell.version", desc: "Current version" },
        { name: "AppShell.info()", desc: "Full module info" },
        { name: "AppShell.healthCheck()", desc: "Health status" }
      ] },
      { id: "regions", title: "Regions", icon: "regions", apis: [
        { name: "region(name)", desc: "Get region by name" },
        { name: "visibility.show(r)", desc: "Show region" },
        { name: "visibility.hide(r)", desc: "Hide region" },
        { name: "resize.setSize(r, px)", desc: "Set size" }
      ] },
      { id: "theme", title: "Theme", icon: "sun", apis: [
        { name: "theme.getTheme()", desc: "Current theme" },
        { name: "theme.setTheme(t)", desc: "Set theme" },
        { name: "theme.toggleTheme()", desc: "Toggle theme" }
      ] },
      { id: "devtools", title: "DevTools", icon: "terminal", apis: [
        { name: "debugPanel.open()", desc: "Open panel" },
        { name: "stateSnapshots.capture(l)", desc: "Capture state" },
        { name: "debugPresets.apply(p)", desc: "Apply preset" },
        { name: "regionMetrics.getAllMetrics()", desc: "All metrics" }
      ] }
    ].map((t) => {
      const n = t.apis.map((s) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label" style="font-family:var(--ui-font-mono)">${g(s.name)}</span><span class="dsd-ui-list-item__value">${g(s.desc)}</span></div>`).join("");
      return Kt(`docs-shell-${t.id}`, t.icon, `AppShell: ${t.title}`, `<div class="dsd-ui-list">${n}</div>`, !0);
    }).join("");
  } catch {
    return "";
  }
}
function lS() {
  const e = ie();
  return Kt(
    "docs-shortcuts",
    "keyboard",
    "Keyboard Shortcuts",
    '<div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Alt+F12</kbd></span><span class="dsd-ui-list-item__value">Toggle Debug Panel</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Escape</kbd></span><span class="dsd-ui-list-item__value">Close panel</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Alt+1</kbd> - <kbd>Alt+0</kbd></span><span class="dsd-ui-list-item__value">Jump to tab 1-10</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>←</kbd> <kbd>→</kbd></span><span class="dsd-ui-list-item__value">Navigate tabs</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>R</kbd></span><span class="dsd-ui-list-item__value">Force refresh data</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>F</kbd></span><span class="dsd-ui-list-item__value">Focus search field</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>C</kbd></span><span class="dsd-ui-list-item__value">Copy tab data to clipboard</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>P</kbd></span><span class="dsd-ui-list-item__value">Pin/unpin current tab</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>T</kbd></span><span class="dsd-ui-list-item__value">Toggle dark/light theme</span></div></div>'
  ) + Kt(
    "docs-api",
    "api",
    "Public API Reference",
    '<div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>init()</code></span><span class="dsd-ui-list-item__value">Initialize panel. Auto-called on DOMContentLoaded.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>open(tab?)</code></span><span class="dsd-ui-list-item__value">Open panel. Respects pinned tab if set.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>close()</code></span><span class="dsd-ui-list-item__value">Close panel, stop auto-refresh.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>toggle()</code></span><span class="dsd-ui-list-item__value">Toggle panel open/closed.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>isOpen()</code></span><span class="dsd-ui-list-item__value">Returns boolean.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>setActiveTab(id)</code></span><span class="dsd-ui-list-item__value">Switch to tab by id.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>refresh()</code></span><span class="dsd-ui-list-item__value">Force re-render bypassing rate limit.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>exportDiagnostic()</code></span><span class="dsd-ui-list-item__value">Export JSON diagnostic file.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>healthCheck()</code></span><span class="dsd-ui-list-item__value">Returns status, score, checks, metrics, history.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>info()</code></span><span class="dsd-ui-list-item__value">Module metadata, features, architecture.</span></div></div>'
  ) + Kt(
    "docs-tabs",
    "overview",
    "Tab Descriptions",
    `<div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("overview", 14)} Overview</span><span class="dsd-ui-list-item__value">Shell health, capabilities, adapters, history.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("zap", 14)} Bootstrap</span><span class="dsd-ui-list-item__value">Bootstrap-v2 status, network, lazy loading, OTel.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("regions", 14)} Regions</span><span class="dsd-ui-list-item__value">Region health, visibility, sizes.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("events", 14)} Events</span><span class="dsd-ui-list-item__value">Event system metrics and history.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("wifi", 14)} Network</span><span class="dsd-ui-list-item__value">Intercepted fetch/XHR requests, status, duration.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("performance", 14)} Performance</span><span class="dsd-ui-list-item__value">Boot timing, memory, render metrics.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("state", 14)} State</span><span class="dsd-ui-list-item__value">Shell state, theme, layout prefs.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("snapshots", 14)} Snapshots</span><span class="dsd-ui-list-item__value">Capture, restore, auto-snapshot.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("metrics", 14)} Metrics</span><span class="dsd-ui-list-item__value">Per-region render metrics.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("presets", 14)} Presets</span><span class="dsd-ui-list-item__value">Debug preset configurations.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("api", 14)} APIs</span><span class="dsd-ui-list-item__value">API usage tracking and errors.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("memory", 14)} Memory</span><span class="dsd-ui-list-item__value">Leak detection, heap analysis.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${d("docs", 14)} Docs</span><span class="dsd-ui-list-item__value">This page. Shortcuts, API, features.</span></div></div>`
  ) + Kt(
    "docs-console",
    "terminal",
    "Console Quick Access",
    '<div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.open()</code></span><span class="dsd-ui-list-item__value">Open panel</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.healthCheck()</code></span><span class="dsd-ui-list-item__value">Health status</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.exportDiagnostic()</code></span><span class="dsd-ui-list-item__value">Export JSON</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.info()</code></span><span class="dsd-ui-list-item__value">Module info</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>AppShell.healthCheck()</code></span><span class="dsd-ui-list-item__value">Shell health</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>BootstrapV2.healthCheck()</code></span><span class="dsd-ui-list-item__value">Bootstrap health</span></div></div>',
    !0
  ) + aS(e);
}
let Xt = [];
const Up = 100;
let Bp = !1, Fp = null, Vp = null, Gp = null;
function cS() {
  if (Bp || typeof window > "u" || (Fp = window.fetch, Vp = XMLHttpRequest.prototype.open, Gp = XMLHttpRequest.prototype.send, window.fetch && window.fetch.__dsdIntercepted)) return;
  Bp = !0;
  const e = Fp;
  window.fetch = function(s, r) {
    const i = typeof s == "string" ? s : s && s.url ? s.url : String(s), o = r && r.method ? r.method.toUpperCase() : "GET", a = { url: i, method: o, status: 0, duration: 0, size: 0, type: "fetch", timestamp: Date.now(), error: null }, l = typeof performance < "u" ? performance.now() : Date.now();
    try {
      return e.apply(this, arguments).then((c) => {
        a.status = c.status, a.duration = Math.round((typeof performance < "u" ? performance.now() : Date.now()) - l);
        try {
          const u = c.headers.get("content-length");
          u && (a.size = parseInt(u, 10));
        } catch {
        }
        return ci(a), c;
      }).catch((c) => {
        throw a.error = c.message || "Network Error", a.duration = Math.round((typeof performance < "u" ? performance.now() : Date.now()) - l), ci(a), c;
      });
    } catch (c) {
      throw a.error = c.message || "Fetch Error", ci(a), c;
    }
  }, window.fetch.__dsdIntercepted = !0;
  const t = Vp, n = Gp;
  XMLHttpRequest.prototype.open = function(s, r) {
    return this._dsdNet = { method: (s || "GET").toUpperCase(), url: r }, t.apply(this, arguments);
  }, XMLHttpRequest.prototype.send = function() {
    const s = this, r = s._dsdNet || {}, i = { url: r.url || "", method: r.method || "GET", status: 0, duration: 0, size: 0, type: "xhr", timestamp: Date.now(), error: null }, o = typeof performance < "u" ? performance.now() : Date.now();
    return s.addEventListener("loadend", () => {
      i.status = s.status, i.duration = Math.round((typeof performance < "u" ? performance.now() : Date.now()) - o);
      try {
        const a = s.getResponseHeader("content-length");
        a && (i.size = parseInt(a, 10));
      } catch {
      }
      ci(i);
    }), s.addEventListener("error", () => {
      i.error = "XHR Error", i.duration = Math.round((typeof performance < "u" ? performance.now() : Date.now()) - o), ci(i);
    }), n.apply(this, arguments);
  };
}
function ci(e) {
  Xt.push(e), Xt.length > Up && (Xt = Xt.slice(-Up));
}
function uS() {
  Xt = [];
}
function ka() {
  const e = Xt.length, t = Xt.filter((r) => r.status >= 400 || r.error).length, n = e > 0 ? Math.round(Xt.reduce((r, i) => r + i.duration, 0) / e) : 0, s = Xt.reduce((r, i) => r + (i.size || 0), 0);
  return { total: e, failed: t, avgDuration: n, totalSize: s };
}
function dS() {
  const e = ka(), t = Xt.slice(-30).reverse(), n = t.length === 0 ? '<div class="dsd-ui-empty">No requests captured yet. Navigate the app to see requests.</div>' : t.map((s) => {
    const r = s.error || s.status >= 400 ? "dsd-ui-status--unhealthy" : s.status >= 300 ? "dsd-ui-status--degraded" : "dsd-ui-status--healthy", i = s.url.length > 60 ? `${s.url.substring(0, 57)}...` : s.url;
    return `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${co(s.timestamp)}</span><span class="dsd-ui-tag">${s.method}</span><span class="${r}">${s.error ? "ERR" : s.status}</span><span>${s.duration}ms</span><span class="dsd-ui-net-url" title="${g(s.url)}">${g(i)}</span></div>`;
  }).join("");
  return Kt(
    "net-summary",
    "wifi",
    "Network Summary",
    `<div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value">${e.total}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Failed</div><div class="dsd-ui-card__value ${e.failed > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${e.failed}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Avg Duration</div><div class="dsd-ui-card__value">${e.avgDuration}ms</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Data Transfer</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${Hi(e.totalSize)}</div></div></div>`
  ) + Kt(
    "net-requests",
    "globe",
    "Requests (last 30)",
    `<div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-clear-network">${d("trash", 14)} Clear</button></div><div class="dsd-ui-log">${n}</div>`
  );
}
let El = null, kl = null;
function pS(e) {
  El = e;
}
function fS(e) {
  kl = e;
}
function Ch(e, t, n) {
  let s = [];
  if (n || (n = ""), e === t) return s;
  if (e == null || t === null || t === void 0 || typeof e != typeof t)
    return s.push({ path: n || "(root)", type: "modified", left: e, right: t }), s;
  if (typeof e != "object")
    return e !== t && s.push({ path: n || "(root)", type: "modified", left: e, right: t }), s;
  if (Array.isArray(e) || Array.isArray(t))
    return JSON.stringify(e) !== JSON.stringify(t) && s.push({ path: n || "(root)", type: "modified", left: e, right: t }), s;
  const r = {};
  return Object.keys(e).forEach((i) => {
    r[i] = !0;
  }), Object.keys(t).forEach((i) => {
    r[i] = !0;
  }), Object.keys(r).forEach((i) => {
    const o = n ? `${n}.${i}` : i;
    if (!(i in e))
      s.push({ path: o, type: "added", left: void 0, right: t[i] });
    else if (!(i in t))
      s.push({ path: o, type: "removed", left: e[i], right: void 0 });
    else {
      const a = Ch(e[i], t[i], o);
      s = s.concat(a);
    }
  }), s;
}
function Yp(e) {
  if (e === void 0) return "<em>undefined</em>";
  if (e === null) return "<em>null</em>";
  if (typeof e == "object") {
    const t = JSON.stringify(e);
    return t.length > 80 ? `${g(t.substring(0, 77))}...` : g(t);
  }
  return g(String(e));
}
function hS() {
  const e = ie();
  if (!e || !e.stateSnapshots) return '<div class="dsd-ui-empty">StateSnapshots not available</div>';
  let t = [];
  try {
    t = e.stateSnapshots.getAll();
  } catch {
    return '<div class="dsd-ui-empty">Error loading snapshots</div>';
  }
  if (t.length < 2) return '<div class="dsd-ui-empty">Need at least 2 snapshots to compare. Capture snapshots in the Snapshots tab.</div>';
  const n = t.slice(-10).reverse().map((i) => `<option value="${g(i.id)}">${g(i.label)} (${co(i.timestamp)})</option>`).join(""), s = `<div class="dsd-ui-diff-selector"><div class="dsd-ui-diff-selector__col"><label>Left (older)</label><select id="diff-select-left" class="dsd-ui-select">${n}</select></div><div class="dsd-ui-diff-selector__arrow">${d("arrowRight", 20)}</div><div class="dsd-ui-diff-selector__col"><label>Right (newer)</label><select id="diff-select-right" class="dsd-ui-select">${n}</select></div><button class="dsd-ui-btn" id="btn-run-diff">${d("search", 14)} Compare</button></div>`;
  let r = "";
  if (El && kl) {
    const i = t.find((a) => a.id === El), o = t.find((a) => a.id === kl);
    if (i && o) {
      let a = Ch(i.state || i, o.state || o, "");
      if (a = a.filter((l) => l.path !== "id" && l.path !== "timestamp" && l.path !== "label"), a.length === 0)
        r = `<div class="dsd-ui-empty">${d("checkCircle", 16)} Snapshots are identical (no differences found)</div>`;
      else {
        const l = a.filter((h) => h.type === "added").length, c = a.filter((h) => h.type === "removed").length, u = a.filter((h) => h.type === "modified").length;
        r = Kt(
          "diff-summary",
          "checkCircle",
          `Summary: ${a.length} differences`,
          `<div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Added</div><div class="dsd-ui-card__value dsd-ui-status--healthy">${l}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Removed</div><div class="dsd-ui-card__value dsd-ui-status--unhealthy">${c}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Modified</div><div class="dsd-ui-card__value dsd-ui-status--degraded">${u}</div></div></div>`
        ) + Kt(
          "diff-details",
          "fileText",
          "Details",
          `<div class="dsd-ui-list">${a.map((h) => {
            const E = h.type === "added" ? "dsd-ui-diff--added" : h.type === "removed" ? "dsd-ui-diff--removed" : "dsd-ui-diff--modified", v = h.type === "added" ? "+" : h.type === "removed" ? "-" : "~";
            return `<div class="dsd-ui-list-item ${E}"><span class="dsd-ui-diff__type">${v}</span><span class="dsd-ui-diff__path">${g(h.path)}</span>${h.type !== "added" ? `<span class="dsd-ui-diff__val dsd-ui-diff__val--old">${Yp(h.left)}</span>` : ""}${h.type !== "removed" ? `<span class="dsd-ui-diff__val dsd-ui-diff__val--new">${Yp(h.right)}</span>` : ""}</div>`;
          }).join("")}</div>`
        );
      }
    } else
      r = '<div class="dsd-ui-empty">Selected snapshots not found. They may have been cleared.</div>';
  }
  return Kt("diff-controls", "columns", "Snapshot Comparison", s) + r;
}
let gs = [], Wo = null;
const gS = ["app-shell-state", "dshowdash-cache", "workbox-precache"];
function mS() {
  return new Promise((e) => {
    if (!indexedDB) {
      e([]);
      return;
    }
    typeof indexedDB.databases == "function" ? indexedDB.databases().then((t) => {
      const n = t.map((s) => Ah(s.name, s.version));
      Promise.all(n).then((s) => {
        gs = s.filter(Boolean), Wo = Date.now(), e(gs);
      });
    }).catch(() => {
      qp().then(e);
    }) : qp().then(e);
  });
}
function qp() {
  const e = gS.map((t) => Ah(t));
  return Promise.all(e).then((t) => (gs = t.filter(Boolean), Wo = Date.now(), gs));
}
function Ah(e, t) {
  return new Promise((n) => {
    try {
      const s = indexedDB.open(e);
      s.onerror = () => {
        n(null);
      }, s.onsuccess = (r) => {
        const i = r.target.result, o = [];
        for (let l = 0; l < i.objectStoreNames.length; l++) {
          const c = i.objectStoreNames[l];
          o.push({
            name: c,
            recordCount: null,
            indexes: []
          });
        }
        const a = o.map((l) => vS(i, l.name).then((c) => (l.recordCount = c, l)));
        Promise.all(a).then((l) => {
          i.close(), n({
            name: e,
            version: i.version,
            stores: l
          });
        });
      };
    } catch {
      n(null);
    }
  });
}
function vS(e, t) {
  return new Promise((n) => {
    try {
      const s = e.transaction(t, "readonly").objectStore(t).count();
      s.onsuccess = () => {
        n(s.result);
      }, s.onerror = () => {
        n(0);
      };
    } catch {
      n(0);
    }
  });
}
function yS() {
  let e = '<div class="dsd-ui-section">';
  if (e += `<div class="dsd-ui-section__title">${d("database", 16)} IndexedDB Explorer</div>`, e += `<button class="dsd-ui-btn dsd-ui-btn--primary" id="dsd-debug-scan-idb">${d("refresh", 14)} Scan Databases</button>`, Wo && (e += `<span class="dsd-ui-text-muted" style="margin-left:8px">Last scan: ${new Date(Wo).toLocaleTimeString()}</span>`), e += "</div>", gs.length === 0)
    return e += '<div class="dsd-ui-empty">No databases found. Click "Scan Databases" to discover IndexedDB databases.</div>', e;
  for (let t = 0; t < gs.length; t++) {
    const n = gs[t];
    if (e += '<div class="dsd-ui-card">', e += `<div class="dsd-ui-card__title">${d("database", 14)} ${g(n.name)} <span class="dsd-ui-badge">v${n.version}</span></div>`, n.stores.length === 0)
      e += '<div class="dsd-ui-text-muted">No object stores</div>';
    else {
      e += '<div class="dsd-ui-list">';
      for (let s = 0; s < n.stores.length; s++) {
        const r = n.stores[s];
        e += '<div class="dsd-ui-list-item">', e += `<span>${d("folder", 12)} ${g(r.name)}</span>`, e += `<span class="dsd-ui-badge">${r.recordCount !== null ? `${r.recordCount} records` : "N/A"}</span>`, e += "</div>";
      }
      e += "</div>";
    }
    e += "</div>";
  }
  return e;
}
const Or = "4.2.1-P2-ENTERPRISE", Qc = "app-shell-debug-panel", bS = "dsd-debug-panel", Ih = "dsd:debug-panel:state", Dh = "dsd:debug-panel:collapsed", st = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "bootstrap", label: "Bootstrap", icon: "zap" },
  { id: "regions", label: "Regions", icon: "regions" },
  { id: "events", label: "Events", icon: "events" },
  { id: "network", label: "Network", icon: "wifi" },
  { id: "performance", label: "Performance", icon: "performance" },
  { id: "state", label: "State", icon: "state" },
  { id: "snapshots", label: "Snapshots", icon: "snapshots" },
  { id: "diff", label: "Diff", icon: "columns" },
  { id: "regionMetrics", label: "Metrics", icon: "metrics" },
  { id: "debugPresets", label: "Presets", icon: "presets" },
  { id: "apiMetrics", label: "APIs", icon: "api" },
  { id: "memory", label: "Memory", icon: "memory" },
  { id: "indexeddb", label: "IDB", icon: "database" },
  { id: "docs", label: "Docs", icon: "docs" }
];
let Bt = !1, ee = "overview", S = null, or = null, Ko = !1, Pt = !1, Nn = "", Nt = { opens: 0, refreshes: 0, errors: 0, exports: 0 }, ar = "", ms = {}, Ti = 0, zt = null, Wp = 0;
const ES = 500;
let vs = !0, Ui = null, rl = !1, Sl = !1;
const kS = {
  overview: Xk,
  bootstrap: Jk,
  regions: Qk,
  events: Zk,
  network: dS,
  performance() {
    return eS(ms);
  },
  state: tS,
  snapshots: nS,
  diff: hS,
  regionMetrics: sS,
  debugPresets: rS,
  apiMetrics: iS,
  memory: oS,
  indexeddb: yS,
  docs: lS
};
function rt(e, t) {
  Nt.errors++, Nt.errors > qo() && (Nt.errors = qo());
  const n = `[DebugPanel][${e}] ${t && t.message ? t.message : String(t)}`;
  typeof console < "u" && console.warn && console.warn(n);
}
function Zc(e) {
  Nt[e] = (Nt[e] || 0) + 1, Nt[e] > qo() && (Nt[e] = qo());
}
function jt() {
  try {
    localStorage.setItem(Ih, JSON.stringify({
      isOpen: Bt,
      activeTab: ee,
      isCompact: Pt,
      searchQuery: Nn,
      pinnedTab: zt,
      isDarkTheme: vs,
      panelHeight: Ui
    }));
  } catch (e) {
    rt("_saveState", e);
  }
}
function SS() {
  try {
    const e = localStorage.getItem(Ih);
    if (e) {
      const t = JSON.parse(e);
      ee = t.activeTab || "overview", Pt = t.isCompact || !1, Nn = t.searchQuery || "", zt = t.pinnedTab || null, vs = t.isDarkTheme !== void 0 ? t.isDarkTheme : !0, Ui = t.panelHeight || null;
    }
  } catch (e) {
    rt("_loadState", e);
  }
  try {
    const e = localStorage.getItem(Dh);
    e && Sh(JSON.parse(e));
  } catch (e) {
    rt("_loadCollapsed", e);
  }
}
function TS() {
  try {
    localStorage.setItem(Dh, JSON.stringify(Th()));
  } catch (e) {
    rt("_saveCollapsed", e);
  }
}
function wS(e) {
  const t = Th();
  t[e] = !t[e], Sh(t), TS(), Re(!0);
}
function Oh() {
  const e = ie();
  e && e.theme && e.theme.toggleTheme && e.theme.toggleTheme(), vs = !vs, S && (vs ? S.classList.remove("dsd-ui-panel--light") : S.classList.add("dsd-ui-panel--light")), jt(), Re(!0);
}
function Kp(e) {
  rl = !0;
  const t = S.offsetHeight;
  S && S.classList.add("dsd-ui-panel--resizing");
  function n(a) {
    if (!rl || !S) return;
    const l = e - a, c = Math.max(200, Math.min(window.innerHeight - 40, t + l));
    S.style.maxHeight = `${c}px`, Ui = c;
  }
  function s() {
    rl = !1, S && S.classList.remove("dsd-ui-panel--resizing"), jt(), document.removeEventListener("mousemove", r), document.removeEventListener("mouseup", o), document.removeEventListener("touchmove", i), document.removeEventListener("touchend", o), document.removeEventListener("touchcancel", o);
  }
  function r(a) {
    n(a.clientY);
  }
  function i(a) {
    a.touches.length > 0 && n(a.touches[0].clientY);
  }
  function o() {
    s();
  }
  document.addEventListener("mousemove", r), document.addEventListener("mouseup", o), document.addEventListener("touchmove", i, { passive: !0 }), document.addEventListener("touchend", o), document.addEventListener("touchcancel", o);
}
function CS() {
  if (!S || Sl) return;
  const e = S.querySelector(".dsd-ui-resize-handle");
  e && (Sl = !0, e.addEventListener("mousedown", (t) => {
    t.preventDefault(), Kp(t.clientY);
  }), e.addEventListener("touchstart", (t) => {
    t.touches.length === 1 && (t.preventDefault(), Kp(t.touches[0].clientY));
  }, { passive: !1 }));
}
function AS() {
  const e = ie(), t = xn(), n = [ee, Pt, Nn];
  if (e)
    try {
      const s = e.healthCheck();
      n.push(s.status, s.score);
    } catch {
      n.push("err");
    }
  if (t)
    try {
      const s = t.healthCheck ? t.healthCheck() : {};
      n.push(s.status || "N/A");
    } catch {
      n.push("err");
    }
  return typeof performance < "u" && performance.memory && n.push(Math.round(performance.memory.usedJSHeapSize / 1048576)), n.join("|");
}
function Xp() {
  if (!S) return;
  const e = S.querySelector(".dsd-ui-content");
  if (!e) return;
  const t = Nn.toLowerCase().trim();
  e.querySelectorAll(".dsd-ui-highlight").forEach((n) => {
    const s = n.parentNode;
    s.replaceChild(document.createTextNode(n.textContent), n), s.normalize();
  }), e.querySelectorAll(".dsd-ui-list-item, .dsd-ui-card, .dsd-ui-log-item, .dsd-ui-snapshot-item, .dsd-ui-region-metric, .dsd-ui-preset-btn").forEach((n) => {
    if (!t) {
      n.style.display = "";
      return;
    }
    n.style.display = n.textContent.toLowerCase().indexOf(t) !== -1 ? "" : "none";
  }), e.querySelectorAll(".dsd-ui-section").forEach((n) => {
    if (!t) {
      n.style.display = "";
      return;
    }
    const s = n.querySelectorAll('.dsd-ui-list-item:not([style*="display: none"]), .dsd-ui-card:not([style*="display: none"]), .dsd-ui-log-item:not([style*="display: none"]), .dsd-ui-snapshot-item:not([style*="display: none"]), .dsd-ui-region-metric:not([style*="display: none"]), .dsd-ui-preset-btn:not([style*="display: none"])'), r = n.querySelector(".dsd-ui-section__title"), i = r && r.textContent.toLowerCase().indexOf(t) !== -1;
    n.style.display = s.length > 0 || i ? "" : "none";
  }), t && IS(e, t);
}
function IS(e, t) {
  const n = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, {
    acceptNode(r) {
      const i = r.parentElement;
      if (!i) return NodeFilter.FILTER_REJECT;
      const o = i.tagName;
      return o === "BUTTON" || o === "INPUT" || o === "TEXTAREA" || o === "SELECT" || i.classList.contains("dsd-ui-section__title") && i.classList.contains("dsd-ui-section__title--collapsible") || i.closest(".dsd-ui-header") || i.closest(".dsd-ui-tabs") || i.closest(".dsd-ui-search") || i.style.display === "none" || i.closest('[style*="display: none"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  }), s = [];
  for (; n.nextNode(); ) s.push(n.currentNode);
  s.forEach((r) => {
    const i = r.textContent, o = i.toLowerCase();
    let a = o.indexOf(t);
    if (a === -1) return;
    const l = document.createDocumentFragment();
    let c = 0;
    for (; a !== -1; ) {
      a > c && l.appendChild(document.createTextNode(i.substring(c, a)));
      const u = document.createElement("span");
      u.className = "dsd-ui-highlight", u.textContent = i.substring(a, a + t.length), l.appendChild(u), c = a + t.length, a = o.indexOf(t, c);
    }
    c < i.length && l.appendChild(document.createTextNode(i.substring(c))), r.parentNode.replaceChild(l, r);
  });
}
function xh() {
  if (!S) return;
  const e = S.querySelector(".dsd-ui-content");
  if (!e) return;
  const t = e.innerText || e.textContent || "";
  try {
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(t).then(() => {
        Jp();
      });
    else {
      const n = document.createElement("textarea");
      n.value = t, n.style.position = "fixed", n.style.left = "-9999px", document.body.appendChild(n), n.select(), document.execCommand("copy"), document.body.removeChild(n), Jp();
    }
  } catch (n) {
    rt("_copyTabData", n);
  }
}
function Jp() {
  const e = S ? S.querySelector("#dsd-debug-copy") : null;
  if (!e) return;
  const t = e.innerHTML;
  e.innerHTML = d("check", 16), e.classList.add("active"), setTimeout(() => {
    e.innerHTML = t, e.classList.remove("active");
  }, 1500);
}
function Rh() {
  const e = ie(), t = xn(), n = ka(), s = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    debugPanel: { version: Or, activeTab: ee, isCompact: Pt, metrics: Nt, issueCount: Ea(rt), renderTimings: ms, healthHistory: wh(), networkStats: n },
    appShell: null,
    bootstrap: null,
    browser: { userAgent: navigator.userAgent, language: navigator.language, online: navigator.onLine, url: window.location.href },
    performance: null
  };
  if (e) {
    s.appShell = {};
    try {
      s.appShell.info = e.info();
    } catch (i) {
      s.appShell.info = { error: i.message }, rt("export:shell.info", i);
    }
    try {
      s.appShell.health = e.healthCheck();
    } catch (i) {
      s.appShell.health = { error: i.message }, rt("export:shell.health", i);
    }
    try {
      s.appShell.regionMetrics = e.regionMetrics ? e.regionMetrics.getAllMetrics() : null;
    } catch (i) {
      s.appShell.regionMetrics = { error: i.message };
    }
    try {
      s.appShell.apiMetrics = e.apiMetrics ? { topAPIs: e.apiMetrics.getTopAPIs(10), errors: e.apiMetrics.getAPIsWithErrors() } : null;
    } catch (i) {
      s.appShell.apiMetrics = { error: i.message };
    }
    try {
      s.appShell.memoryLeaks = e.memoryLeaks ? e.memoryLeaks.info() : null;
    } catch (i) {
      s.appShell.memoryLeaks = { error: i.message };
    }
    try {
      s.appShell.snapshots = e.stateSnapshots ? { count: e.stateSnapshots.getAll().length, metrics: e.stateSnapshots.getMetrics() } : null;
    } catch (i) {
      s.appShell.snapshots = { error: i.message };
    }
  }
  if (t) {
    s.bootstrap = {};
    try {
      s.bootstrap.version = t.VERSION || "N/A";
    } catch {
      s.bootstrap.version = "error";
    }
    try {
      s.bootstrap.health = t.healthCheck ? t.healthCheck() : null;
    } catch (i) {
      s.bootstrap.health = { error: i.message };
    }
    try {
      s.bootstrap.network = t.getNetworkInfo ? t.getNetworkInfo() : null;
    } catch (i) {
      s.bootstrap.network = { error: i.message };
    }
    try {
      s.bootstrap.lazy = t.getLazyStats ? t.getLazyStats() : null;
    } catch (i) {
      s.bootstrap.lazy = { error: i.message };
    }
    try {
      s.bootstrap.cancelled = t.isBootCancelled ? t.isBootCancelled() : !1;
    } catch {
      s.bootstrap.cancelled = "error";
    }
  }
  try {
    const i = typeof performance < "u" ? performance : null;
    i && i.memory && (s.performance = { usedJSHeapSize: i.memory.usedJSHeapSize, totalJSHeapSize: i.memory.totalJSHeapSize, jsHeapSizeLimit: i.memory.jsHeapSizeLimit });
  } catch (i) {
    s.performance = { error: i.message };
  }
  try {
    const i = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }), o = URL.createObjectURL(i), a = document.createElement("a");
    a.href = o, a.download = `dshowdash-diagnostic-${Date.now()}.json`, document.body.appendChild(a), a.click(), document.body.removeChild(a), URL.revokeObjectURL(o), Zc("exports");
  } catch (i) {
    rt("export:download", i);
  }
  const r = S ? S.querySelector("#dsd-debug-export") : null;
  if (r) {
    const i = r.innerHTML;
    r.innerHTML = d("check", 16), r.classList.add("active"), setTimeout(() => {
      r.innerHTML = i, r.classList.remove("active");
    }, 1500);
  }
}
function Qp(e) {
  const t = st.findIndex((s) => s.id === ee), n = e === "next" ? (t + 1) % st.length : (t - 1 + st.length) % st.length;
  ee = st[n].id, jt(), Re();
}
function DS(e) {
  const t = e === 0 ? 9 : e - 1;
  t >= 0 && t < st.length && (ee = st[t].id, jt(), Re());
}
function _h() {
  zt = zt === ee ? null : ee, jt(), Re(!0);
}
function OS(e) {
  if (e.altKey && e.key === "F12") {
    e.preventDefault(), Mh();
    return;
  }
  if (Bt) {
    if (e.key === "Escape") {
      e.preventDefault(), Sa();
      return;
    }
    if (e.altKey && /^[0-9]$/.test(e.key)) {
      e.preventDefault(), DS(parseInt(e.key, 10));
      return;
    }
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") {
      if (e.key === "ArrowLeft") {
        e.preventDefault(), Qp("prev");
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault(), Qp("next");
        return;
      }
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(), Re();
        return;
      }
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const t = S ? S.querySelector("#dsd-debug-search") : null;
        t && t.focus();
        return;
      }
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(), xh();
        return;
      }
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(), _h();
        return;
      }
      if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(), Oh();
        return;
      }
    }
  }
}
function xS() {
  const e = typeof performance < "u" ? performance.now() : 0, t = kS[ee], n = t ? t() : "";
  if (typeof performance < "u") {
    const s = performance.now() - e;
    if (!ms[ee])
      ms[ee] = { last: s, avg: s, max: s, count: 1 };
    else {
      const r = ms[ee];
      r.count++, r.last = s, r.avg = (r.avg * (r.count - 1) + s) / r.count, s > r.max && (r.max = s);
    }
  }
  return n;
}
function Re(e) {
  if (!S) return;
  const t = Date.now();
  if (!e && t - Wp < ES) return;
  if (!e) {
    const u = AS();
    if (u === ar) return;
    ar = u;
  }
  Wp = t, Vk(rt, S, (u) => {
    qk(u, S);
  }), Ti = t;
  const n = Ea(rt), s = n > 0 ? `<span class="dsd-ui-header__badge dsd-ui-status--unhealthy" aria-label="${n} issues">${n}</span>` : "", r = { appShell: !!ie(), bootstrap: !!xn() }, i = `<span class="dsd-ui-header__conn" title="AppShell: ${r.appShell ? "Connected" : "Disconnected"} | Bootstrap: ${r.bootstrap ? "Connected" : "Disconnected"}"><span class="dsd-ui-conn-dot ${r.appShell ? "dsd-ui-conn-dot--on" : "dsd-ui-conn-dot--off"}" title="AppShell"></span><span class="dsd-ui-conn-dot ${r.bootstrap ? "dsd-ui-conn-dot--on" : "dsd-ui-conn-dot--off"}" title="Bootstrap"></span></span>`, o = Yk();
  ka().failed > 0 && (o.network = !0);
  const a = st.map((u, h) => {
    const E = u.id === ee, v = h < 9 ? h + 1 : h === 9 ? "0" : "", T = u.label + (v ? ` (Alt+${v})` : ""), he = o[u.id] ? " has-issue" : "", te = zt === u.id;
    return `<button class="dsd-ui-tab${E ? " active" : ""}${he}${te ? " pinned" : ""}" data-tab="${u.id}" title="${T}" role="tab" aria-selected="${E}" aria-controls="dsd-tabpanel-${u.id}">${d(u.icon, 18)}${o[u.id] ? '<span class="dsd-ui-tab__dot"></span>' : ""}${te ? '<span class="dsd-ui-tab__pin"></span>' : ""}</button>`;
  }).join(""), l = Ti > 0 ? `<span class="dsd-ui-header__ts" title="Last updated">${co(Ti)}</span>` : "", c = vs ? "moon" : "sun";
  S.setAttribute("role", "dialog"), S.setAttribute("aria-label", `Debug Panel v${Or}`), Sl = !1, S.innerHTML = `<div class="dsd-ui-resize-handle" title="Drag to resize"></div><div class="dsd-ui-header"><div class="dsd-ui-header__title">${d("tool", 16)} Debug Panel <span class="dsd-ui-header__version">v${Or}</span>${i}${s}${l}</div><div class="dsd-ui-header__actions"><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-export" title="Export Diagnostic" aria-label="Export diagnostic">${d("fileText", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-copy" title="Copy Tab Data (C)" aria-label="Copy tab data">${d("clipboard", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${zt === ee ? " active" : ""}" id="dsd-debug-pin" title="Pin Tab (P)" aria-label="Pin tab">${d("pin", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-theme" title="Toggle Theme (T)" aria-label="Toggle theme">${d(c, 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${Pt ? " active" : ""}" id="dsd-debug-compact" title="Compact Mode" aria-label="Toggle compact mode">${d("minimize", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-refresh" title="Refresh (R)" aria-label="Refresh">${d("refresh", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-close" title="Close (Esc)" aria-label="Close panel">${d("close", 16)}</button></div></div><div class="dsd-ui-tabs" role="tablist" aria-label="Debug panel tabs">${a}</div><div class="dsd-ui-search"><input type="text" id="dsd-debug-search" class="dsd-ui-search__input" placeholder="Filter content... (F)" spellcheck="false" autocomplete="off" aria-label="Search panel content" /></div><div class="dsd-ui-content" id="dsd-tabpanel-${ee}" role="tabpanel" aria-label="${ee} tab content">${xS()}</div>`, Kk(S, { searchQuery: Nn }, {
    close: Sa,
    render() {
      Re();
    },
    forceRender() {
      ar = "", Re(!0);
    },
    exportDiagnostic: Rh,
    copyTabData: xh,
    toggleCompact() {
      Pt = !Pt, S && (Pt ? S.classList.add("dsd-ui-panel--compact") : S.classList.remove("dsd-ui-panel--compact")), jt(), Re();
    },
    togglePinTab: _h,
    toggleTheme: Oh,
    toggleSection: wS,
    clearNetwork() {
      uS(), Re(!0);
    },
    scanIdb() {
      mS().then(() => {
        Re(!0);
      });
    },
    runDiff(u, h) {
      pS(u), fS(h), ee = "diff", Re(!0);
    },
    onSearchInput(u) {
      Nn = u, jt(), Xp();
    },
    switchTab(u) {
      ee = u, Nn = "", jt(), Re();
    }
  }), CS(), Ui && S && (S.style.maxHeight = `${Ui}px`), Nn && Xp(), Zc("refreshes");
}
function RS() {
  if (typeof document > "u") return;
  const e = "dsd-panel-ui-css";
  if (document.getElementById(e)) return;
  const t = document.createElement("link");
  t.id = e, t.rel = "stylesheet", t.href = "/components/app-shell/styles/_panel-ui.css", t.onerror = () => {
    rt("_injectStyles", new Error("Failed to load _panel-ui.css"));
  }, document.head.appendChild(t);
}
function Tl() {
  if (Ko) return !0;
  if (typeof document > "u") return !1;
  SS(), RS(), document.addEventListener("keydown", OS);
  try {
    cS();
  } catch (e) {
    rt("interceptNetwork", e);
  }
  return Ko = !0, !0;
}
function Lh() {
  return typeof document > "u" ? !1 : (S || (S = document.createElement("div"), S.id = bS, S.className = `dsd-ui-panel dsd-ui-panel--debug${Pt ? " dsd-ui-panel--compact" : ""}${vs ? "" : " dsd-ui-panel--light"}`, document.body.appendChild(S)), Bt = !0, S.style.display = "flex", ar = "", zt && st.some((e) => e.id === zt) && (ee = zt), Re(!0), jt(), Zc("opens"), or && clearInterval(or), or = setInterval(() => {
    Bt && Re();
  }, 2e3), !0);
}
function Sa() {
  return S ? (Bt = !1, S.style.display = "none", jt(), or && (clearInterval(or), or = null), !0) : !1;
}
function Mh() {
  return Bt ? Sa() : Lh();
}
function _S() {
  return Bt;
}
function LS(e) {
  st.some((t) => t.id === e) && (ee = e, ar = "", Bt && Re(!0), jt());
}
function MS() {
  Bt && (ar = "", Re(!0));
}
function PS() {
  Rh();
}
function NS() {
  const e = document.getElementById("dsd-panel-ui-css"), t = !!(e && e.sheet), n = { initialized: Ko, stylesInjected: !!e, stylesLoaded: t, noErrors: Nt.errors === 0 }, s = Object.values(n).filter(Boolean).length, r = { appShell: !!ie(), bootstrap: !!xn() }, i = wh(), o = ka();
  return { status: s === 4 ? "HEALTHY" : "DEGRADED", score: `${s}/4`, checks: n, isOpen: Bt, activeTab: ee, tabs: st.length, issueCount: Ea(rt), isCompact: Pt, pinnedTab: zt, metrics: Nt, renderTimings: ms, healthHistory: { entries: i.length, last: i.length > 0 ? i[i.length - 1] : null }, connections: r, lastUpdate: Ti, networkRequests: o, version: Or, moduleId: Qc, timestamp: Date.now() };
}
function $S() {
  const e = { appShell: !!ie(), bootstrap: !!xn() };
  return { moduleId: Qc, version: Or, architecture: "MODULAR", modules: { helpers: "1.1.0", healthTracker: "1.0.0", eventHandlers: "2.1.0", tabs: st.length }, initialized: Ko, isOpen: Bt, activeTab: ee, isCompact: Pt, pinnedTab: zt, tabs: st.map((t) => t.id), tabCount: st.length, shortcuts: { toggle: "Alt+F12", close: "Escape", tabs: "Alt+1-0", navigate: "Arrow Left/Right", refresh: "R", search: "F", copy: "C", pin: "P", theme: "T" }, features: { issueCounter: !0, compactMode: !0, searchFilter: !0, exportDiagnostic: !0, smartRefresh: !0, xssGuard: !0, errorHandler: !0, connectionIndicator: !0, renderTimings: !0, exportFeedback: !0, ariaAccessibility: !0, tabIssueDots: !0, copyTabData: !0, healthHistory: !0, statusNotifications: !0, autoSnapshotIssues: !0, lazyRender: !0, persistSearch: !0, metricsCap: !0, lastUpdateTimestamp: !0, pinTab: !0, rateLimitRefresh: !0, networkTab: !0, searchHighlight: !0, themeToggle: !0, collapseSections: !0, fullDocs: !0, diffViewer: !0, indexedDB: !0, resizeDrag: !0 }, metrics: Nt, renderTimings: ms, connections: e, lastUpdate: Ti, timestamp: Date.now() };
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  Tl();
}) : Tl());
const ae = { VERSION: Or, MODULE_ID: Qc, init: Tl, open: Lh, close: Sa, toggle: Mh, isOpen: _S, setActiveTab: LS, refresh: MS, exportDiagnostic: PS, healthCheck: NS, info: $S }, eu = "1.2.0-P2-ENTERPRISE", Ta = "app-shell-debug-presets", Me = Object.freeze({
  MINIMAL: "minimal",
  STANDARD: "standard",
  VERBOSE: "verbose",
  PERFORMANCE: "performance",
  NETWORK: "network",
  MEMORY: "memory",
  EVENTS: "events",
  REGIONS: "regions",
  CUSTOM: "custom"
}), Cn = {
  minimal: {
    name: "Minimal",
    description: "Apenas erros críticos",
    logLevel: "error",
    enabledModules: [],
    features: {
      consoleOutput: !0,
      timestamps: !1,
      stackTraces: !1,
      performanceMarks: !1,
      eventTracking: !1,
      memoryTracking: !1,
      networkTracking: !1
    }
  },
  standard: {
    name: "Standard",
    description: "Logs padrão para desenvolvimento",
    logLevel: "info",
    enabledModules: ["app-shell", "bootstrap"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !0,
      performanceMarks: !1,
      eventTracking: !1,
      memoryTracking: !1,
      networkTracking: !1
    }
  },
  verbose: {
    name: "Verbose",
    description: "Todos os logs detalhados",
    logLevel: "debug",
    enabledModules: ["*"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !0,
      performanceMarks: !0,
      eventTracking: !0,
      memoryTracking: !0,
      networkTracking: !0
    }
  },
  performance: {
    name: "Performance",
    description: "Foco em métricas de performance",
    logLevel: "warn",
    enabledModules: ["performance", "app-shell"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !1,
      performanceMarks: !0,
      eventTracking: !1,
      memoryTracking: !0,
      networkTracking: !0
    }
  },
  network: {
    name: "Network",
    description: "Monitoramento de requisições",
    logLevel: "info",
    enabledModules: ["api", "fetch", "xhr"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !1,
      performanceMarks: !1,
      eventTracking: !1,
      memoryTracking: !1,
      networkTracking: !0
    }
  },
  memory: {
    name: "Memory",
    description: "Detecção de memory leaks",
    logLevel: "warn",
    enabledModules: ["memory", "gc"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !0,
      performanceMarks: !1,
      eventTracking: !1,
      memoryTracking: !0,
      networkTracking: !1
    }
  },
  events: {
    name: "Events",
    description: "Rastreamento de eventos",
    logLevel: "debug",
    enabledModules: ["eventbus", "events"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !1,
      performanceMarks: !1,
      eventTracking: !0,
      memoryTracking: !1,
      networkTracking: !1
    }
  },
  regions: {
    name: "Regions",
    description: "Debug de regiões do App Shell",
    logLevel: "debug",
    enabledModules: ["app-shell", "regions", "dom-regions"],
    features: {
      consoleOutput: !0,
      timestamps: !0,
      stackTraces: !1,
      performanceMarks: !0,
      eventTracking: !0,
      memoryTracking: !1,
      networkTracking: !1
    }
  }
}, Zp = { debug: 0, info: 1, warn: 2, error: 3 }, j = {
  current: null,
  previous: null,
  currentConfig: null,
  enabled: !1,
  history: [],
  subscribers: []
}, zS = {
  maxHistorySize: 10
};
function Ph(e) {
  j.history.push({
    preset: e,
    timestamp: Date.now()
  }), j.history.length > zS.maxHistorySize && j.history.shift();
}
function tu(e, t) {
  for (let n = 0; n < j.subscribers.length; n++)
    try {
      j.subscribers[n](e, t);
    } catch {
    }
}
const nu = "app-shell-debug-preset";
function Nh(e, t) {
  try {
    return localStorage.setItem(nu, JSON.stringify({
      preset: e,
      custom: t || null,
      savedAt: Date.now()
    })), !0;
  } catch {
    return !1;
  }
}
function $h() {
  try {
    const e = localStorage.getItem(nu);
    if (e)
      return JSON.parse(e);
  } catch {
  }
  return null;
}
function zh(e) {
  if (!e) return !1;
  try {
    const t = typeof window < "u" ? window.AppShell : null;
    if (t && t.logger && t.logger.setLevel) {
      const n = Zp[e.logLevel] !== void 0 ? Zp[e.logLevel] : 1;
      t.logger.setLevel(n);
    }
    return e.features && (e.features.memoryTracking && t && t.memoryLeaks && typeof t.memoryLeaks.startTracking == "function" && t.memoryLeaks.startTracking(), e.features.performanceMarks && t && t.autoHealthCheck && typeof t.autoHealthCheck.start == "function" && t.autoHealthCheck.start({ interval: 1e4 })), typeof window < "u" && (window.__debugPreset = {
      name: j.current,
      config: e,
      appliedAt: Date.now()
    }), !0;
  } catch {
    return !1;
  }
}
function jS(e) {
  const t = Cn[e];
  return t ? (j.current && (j.previous = j.current), j.current = e, j.currentConfig = Object.assign({}, t), j.enabled = !0, zh(t), Nh(e), Ph(e), tu("preset-applied", { preset: e, config: t }), { ok: !0, preset: e }) : { ok: !1, error: `Unknown preset: ${e}` };
}
function HS(e) {
  if (!e)
    return { ok: !1, error: "No config provided" };
  const t = Object.assign({}, Cn.standard, e);
  return j.current && (j.previous = j.current), j.current = Me.CUSTOM, j.currentConfig = t, j.enabled = !0, zh(t), Nh(Me.CUSTOM, e), Ph(Me.CUSTOM), tu("preset-applied", { preset: Me.CUSTOM, config: t }), { ok: !0, preset: Me.CUSTOM, config: t };
}
function US() {
  if (!j.enabled)
    return { ok: !1, error: "No preset active" };
  j.previous = j.current, j.current = null, j.currentConfig = null, j.enabled = !1;
  try {
    localStorage.removeItem(nu);
  } catch {
  }
  return typeof window < "u" && delete window.__debugPreset, tu("preset-disabled", { previous: j.previous }), { ok: !0, previous: j.previous };
}
const wa = ey({ moduleId: Ta });
function BS(e) {
  return wa.inject(e);
}
function FS() {
  return wa.snapshot();
}
let uo = null, su = null, jh = null;
const xo = [], Hh = [];
let ru = !1;
const ds = {
  maxHistory: 20,
  persistToStorage: !0,
  storageKey: "app-shell-debug-preset",
  autoApplyOnLoad: !0
}, Uh = {
  presetsApplied: 0,
  customConfigsCreated: 0,
  presetChanges: 0
};
function dn(e) {
  return jS(e);
}
function Bh(e) {
  return HS(e);
}
function VS() {
  US();
}
function GS() {
  return !1;
}
function YS() {
  return uo;
}
function Fh() {
  return uo === Me.CUSTOM ? su : null;
}
function qS() {
  return jh;
}
function WS() {
  return ru;
}
function KS(e) {
  return Cn[e] ? Object.assign({}, Cn[e]) : null;
}
function XS() {
  return Object.keys(Cn).map((e) => {
    const t = Cn[e];
    return { id: e, name: t.name, description: t.description, logLevel: t.logLevel, isCurrent: e === uo };
  });
}
function JS() {
  return Hh.slice();
}
function QS(e) {
  e.maxHistory !== void 0 && (ds.maxHistory = e.maxHistory), e.persistToStorage !== void 0 && (ds.persistToStorage = !!e.persistToStorage), e.storageKey !== void 0 && (ds.storageKey = e.storageKey), e.autoApplyOnLoad !== void 0 && (ds.autoApplyOnLoad = !!e.autoApplyOnLoad);
}
function Vh() {
  return Object.assign({}, ds);
}
function ZS(e) {
  return typeof e != "function" ? () => {
  } : (xo.push(e), () => {
    const t = xo.indexOf(e);
    t >= 0 && xo.splice(t, 1);
  });
}
function eT() {
  return dn(Me.MINIMAL);
}
function tT() {
  return dn(Me.STANDARD);
}
function nT() {
  return dn(Me.VERBOSE);
}
function sT() {
  return dn(Me.PERFORMANCE);
}
function rT() {
  return dn(Me.NETWORK);
}
function iT() {
  return dn(Me.MEMORY);
}
function oT() {
  return dn(Me.EVENTS);
}
function aT() {
  return dn(Me.REGIONS);
}
function iu() {
  return Object.assign({}, Uh);
}
function lT() {
  const e = {
    configValid: !!Cn,
    presetsAvailable: Object.keys(Cn).length > 0,
    storageAccessible: ds.persistToStorage ? !!$h : !0,
    noExcessiveChanges: Uh.presetChanges < 100
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    currentPreset: uo,
    enabled: ru,
    portsInitialized: wa.isInitialized(),
    metrics: iu(),
    version: eu,
    moduleId: Ta,
    timestamp: Date.now()
  };
}
function cT() {
  return {
    moduleId: Ta,
    version: eu,
    portsInitialized: wa.isInitialized(),
    currentPreset: uo,
    currentConfig: Fh(),
    previousPreset: jh,
    enabled: ru,
    availablePresets: Object.keys(Cn),
    customConfig: su,
    config: Vh(),
    metrics: iu(),
    historyCount: Hh.length,
    subscriberCount: xo.length,
    timestamp: Date.now()
  };
}
function uT() {
  if (ds.autoApplyOnLoad) {
    const e = $h();
    e && e.currentPreset && e.enabled && (e.currentPreset === Me.CUSTOM && e.customConfig ? (su = e.customConfig, Bh(e.customConfig)) : dn(e.currentPreset));
  }
}
typeof window < "u" && uT();
const _ = {
  VERSION: eu,
  MODULE_ID: Ta,
  PRESETS: Me,
  apply: dn,
  applyCustom: Bh,
  disable: VS,
  revert: GS,
  getCurrent: YS,
  getCurrentConfig: Fh,
  getPrevious: qS,
  isEnabled: WS,
  getPresetConfig: KS,
  listPresets: XS,
  getHistory: JS,
  configure: QS,
  getConfig: Vh,
  subscribe: ZS,
  minimal: eT,
  standard: tT,
  verbose: nT,
  performance: sT,
  network: rT,
  memory: iT,
  events: oT,
  regions: aT,
  getMetrics: iu,
  healthCheck: lT,
  info: cT,
  injectPorts: BS,
  getPorts: FS
}, ou = "1.1.0-AAA", au = "app-shell-region-metrics", nt = Object.freeze({
  RENDER: "render",
  UPDATE: "update",
  VISIBILITY: "visibility",
  RESIZE: "resize",
  INTERACTION: "interaction",
  ERROR: "error",
  LOAD: "load"
}), ef = ["header", "nav-rail", "sidebar", "main", "footer", "overlay"];
function lu() {
  return {
    renders: [],
    updates: [],
    visibility: [],
    interactions: [],
    errors: [],
    loads: [],
    aggregated: {
      renderCount: 0,
      updateCount: 0,
      visibilityChanges: 0,
      interactionCount: 0,
      errorCount: 0,
      loadCount: 0,
      avgRenderTime: 0,
      avgUpdateTime: 0,
      totalRenderTime: 0,
      totalUpdateTime: 0,
      lastActivity: null
    }
  };
}
let ys = {};
const lr = [];
let Gh = !0, cu = null;
const dT = {}, _n = {
  maxSamplesPerRegion: 100,
  trackRenderTime: !0,
  trackUpdates: !0,
  trackVisibility: !0,
  trackInteractions: !0,
  trackErrors: !0,
  aggregationInterval: 6e4
}, wi = {
  totalEvents: 0,
  totalErrors: 0,
  trackingDuration: 0
};
function Yh() {
  for (let e = 0; e < ef.length; e++)
    ys[ef[e]] = lu();
  cu = Date.now();
}
Yh();
function qr() {
  return ys;
}
function pT() {
  return lr;
}
function Ca() {
  return Gh;
}
function qh(e) {
  Gh = !!e;
}
function Aa() {
  return cu;
}
function fT(e) {
  cu = e;
}
function uu() {
  return dT;
}
function du() {
  return _n;
}
function Ia() {
  return wi;
}
function hT(e) {
  for (let t = 0; t < lr.length; t++)
    try {
      lr[t](e);
    } catch {
    }
}
function gT(e, t, n) {
  ys[e] || (ys[e] = lu());
  const s = ys[e], r = s[`${t}s`] || s[t];
  r && (r.push(n), r.length > _n.maxSamplesPerRegion && r.shift()), s.aggregated.lastActivity = Date.now(), wi.totalEvents++;
}
function mT() {
  Yh(), wi.totalEvents = 0, wi.totalErrors = 0, wi.trackingDuration = 0;
}
function vT(e) {
  ys[e] && (ys[e] = lu());
}
function yT(e) {
  e.maxSamplesPerRegion !== void 0 && (_n.maxSamplesPerRegion = e.maxSamplesPerRegion), e.trackRenderTime !== void 0 && (_n.trackRenderTime = !!e.trackRenderTime), e.trackUpdates !== void 0 && (_n.trackUpdates = !!e.trackUpdates), e.trackVisibility !== void 0 && (_n.trackVisibility = !!e.trackVisibility), e.trackInteractions !== void 0 && (_n.trackInteractions = !!e.trackInteractions), e.trackErrors !== void 0 && (_n.trackErrors = !!e.trackErrors);
}
function bT(e) {
  return typeof e != "function" ? () => {
  } : (lr.push(e), () => {
    const t = lr.indexOf(e);
    t >= 0 && lr.splice(t, 1);
  });
}
function ET(e, t, n) {
  const s = qr();
  if (!s[e]) return;
  const r = s[e].aggregated;
  switch (t) {
    case nt.RENDER:
      r.renderCount++, r.totalRenderTime += n || 0, r.avgRenderTime = r.totalRenderTime / r.renderCount;
      break;
    case nt.UPDATE:
      r.updateCount++, r.totalUpdateTime += n || 0, r.avgUpdateTime = r.totalUpdateTime / r.updateCount;
      break;
    case nt.VISIBILITY:
      r.visibilityChanges++;
      break;
    case nt.INTERACTION:
      r.interactionCount++;
      break;
    case nt.ERROR:
      r.errorCount++, Ia().totalErrors++;
      break;
    case nt.LOAD:
      r.loadCount++;
      break;
  }
}
function Wr(e, t, n, s, r) {
  if (!Ca()) return;
  const i = du();
  if (t && !i[t]) return;
  const o = Object.assign({ type: e, timestamp: Date.now() }, s);
  gT(n, e === "visibility" ? "visibility" : e, o), ET(n, e, r), hT({
    type: "metric",
    metricType: e,
    region: n,
    sample: o
  });
}
function Wh(e, t, n) {
  Wr(nt.RENDER, "trackRenderTime", e, { duration: t, context: n || {} }, t);
}
function Kh(e, t, n) {
  Wr(nt.UPDATE, "trackUpdates", e, { duration: t, context: n || {} }, t);
}
function kT(e, t, n) {
  Wr(nt.VISIBILITY, "trackVisibility", e, { visible: t, context: n || {} });
}
function ST(e, t, n) {
  Wr(nt.INTERACTION, "trackInteractions", e, { interactionType: t, context: n || {} });
}
function TT(e, t, n) {
  Wr(nt.ERROR, "trackErrors", e, {
    error: t instanceof Error ? t.message : String(t),
    stack: t instanceof Error ? t.stack : null,
    context: n || {}
  });
}
function Xh(e, t, n) {
  Wr(nt.LOAD, null, e, { duration: t, context: n || {} }, t);
}
function wT(e, t) {
  const n = uu(), s = `${e}:${t}:${Date.now()}`;
  return n[s] = {
    region: e,
    type: t,
    startTime: performance.now()
  }, s;
}
function CT(e, t) {
  const n = uu(), s = n[e];
  if (!s) return 0;
  const r = performance.now() - s.startTime;
  switch (delete n[e], s.type) {
    case "render":
      Wh(s.region, r, t);
      break;
    case "update":
      Kh(s.region, r, t);
      break;
    case "load":
      Xh(s.region, r, t);
      break;
  }
  return r;
}
function Jh(e) {
  const t = qr();
  if (!t[e]) return null;
  const n = t[e];
  return {
    region: e,
    aggregated: Object.assign({}, n.aggregated),
    samples: {
      renders: n.renders.length,
      updates: n.updates.length,
      visibility: n.visibility.length,
      interactions: n.interactions.length,
      errors: n.errors.length,
      loads: n.loads.length
    },
    recentRenders: n.renders.slice(-10),
    recentUpdates: n.updates.slice(-10),
    recentErrors: n.errors.slice(-5)
  };
}
function Qh() {
  const e = qr(), t = {}, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t[n[s]] = Jh(n[s]);
  return t;
}
function pu() {
  const e = qr(), t = {
    regions: {},
    totals: { renders: 0, updates: 0, errors: 0, interactions: 0, avgRenderTime: 0, avgUpdateTime: 0 },
    slowestRegion: null,
    mostActiveRegion: null,
    mostErrorsRegion: null
  };
  let n = 0, s = 0, r = 0, i = 0, o = 0;
  const a = Object.keys(e);
  for (let l = 0; l < a.length; l++) {
    const c = a[l], u = e[c].aggregated;
    t.regions[c] = {
      renders: u.renderCount,
      updates: u.updateCount,
      errors: u.errorCount,
      interactions: u.interactionCount,
      avgRenderTime: Math.round(u.avgRenderTime * 100) / 100,
      avgUpdateTime: Math.round(u.avgUpdateTime * 100) / 100
    }, t.totals.renders += u.renderCount, t.totals.updates += u.updateCount, t.totals.errors += u.errorCount, t.totals.interactions += u.interactionCount, n += u.totalRenderTime, s += u.totalUpdateTime;
    const h = u.renderCount + u.updateCount + u.interactionCount;
    h > r && (r = h, t.mostActiveRegion = c), u.errorCount > i && (i = u.errorCount, t.mostErrorsRegion = c), u.avgRenderTime > o && (o = u.avgRenderTime, t.slowestRegion = c);
  }
  return t.totals.renders > 0 && (t.totals.avgRenderTime = Math.round(n / t.totals.renders * 100) / 100), t.totals.updates > 0 && (t.totals.avgUpdateTime = Math.round(s / t.totals.updates * 100) / 100), t;
}
function Zh(e) {
  e = e || { maxAvgRenderTime: 100, maxErrors: 5 };
  const t = qr(), n = [], s = Object.keys(t);
  for (let r = 0; r < s.length; r++) {
    const i = s[r], o = t[i].aggregated, a = [];
    o.avgRenderTime > e.maxAvgRenderTime && a.push({ type: "slow-render", value: o.avgRenderTime, threshold: e.maxAvgRenderTime }), o.errorCount > e.maxErrors && a.push({ type: "high-errors", value: o.errorCount, threshold: e.maxErrors }), a.length > 0 && n.push({ region: i, issues: a });
  }
  return n;
}
function AT() {
  qh(!0), Aa() || fT(Date.now());
}
function IT() {
  qh(!1);
}
function DT() {
  const e = Ia(), t = Aa();
  return {
    global: Object.assign({}, e, { trackingDuration: t ? Date.now() - t : 0 }),
    byRegion: Qh()
  };
}
function OT() {
  const e = Zh(), t = Ia(), n = {
    enabled: Ca(),
    trackingActive: !!Aa(),
    noProblematicRegions: e.length === 0,
    lowErrorRate: t.totalErrors < 50
  };
  let s = 0;
  const r = Object.keys(n);
  for (let i = 0; i < r.length; i++)
    n[r[i]] && s++;
  return {
    status: s === r.length ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${s}/${r.length}`,
    checks: n,
    problematicRegions: e.length > 0 ? e : null,
    summary: pu(),
    version: ou,
    moduleId: au,
    timestamp: Date.now()
  };
}
function xT() {
  const e = Ia(), t = Aa();
  return {
    moduleId: au,
    version: ou,
    enabled: Ca(),
    trackingStartedAt: t,
    trackingDuration: t ? Date.now() - t : 0,
    trackedRegions: Object.keys(qr()),
    config: Object.assign({}, du()),
    globalMetrics: Object.assign({}, e),
    summary: pu(),
    subscriberCount: pT().length,
    activeTimers: Object.keys(uu()).length,
    timestamp: Date.now()
  };
}
const M = {
  VERSION: ou,
  MODULE_ID: au,
  METRIC_TYPES: nt,
  trackRender: Wh,
  trackUpdate: Kh,
  trackVisibility: kT,
  trackInteraction: ST,
  trackError: TT,
  trackLoad: Xh,
  startTimer: wT,
  endTimer: CT,
  getRegionMetrics: Jh,
  getAllMetrics: Qh,
  getPerformanceSummary: pu,
  getProblematicRegions: Zh,
  enable: AT,
  disable: IT,
  isEnabled: Ca,
  reset: mT,
  resetRegion: vT,
  configure: yT,
  getConfig: du,
  subscribe: bT,
  getMetrics: DT,
  healthCheck: OT,
  info: xT
}, fu = "1.1.0-AAA", hu = "app-shell-state-snapshots";
function eg() {
  return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function RT(e) {
  try {
    return JSON.stringify(e).length;
  } catch {
    return 0;
  }
}
function gu() {
  return typeof window < "u" && window.AppShell ? window.AppShell : null;
}
function _T() {
  var e, t, n, s, r, i, o, a, l, c, u, h, E, v, T, he, te, hn, oe, w;
  const m = gu();
  if (!m) return { error: "AppShell not available" };
  const J = {};
  try {
    if (J.version = m.version, J.initialized = ((e = m.isInitialized) == null ? void 0 : e.call(m)) || !1, J.ready = ((t = m.isReady) == null ? void 0 : t.call(m)) || !1, J.mounted = ((n = m.isMounted) == null ? void 0 : n.call(m)) || !1, J.phase = ((s = m.getPhase) == null ? void 0 : s.call(m)) || null, (r = m.visibility) != null && r.getState && (J.visibility = m.visibility.getState()), (i = m.resize) != null && i.getSizes && (J.regionSizes = m.resize.getSizes()), (o = m.loading) != null && o.getLoadingState && (J.loadingState = m.loading.getLoadingState()), (a = m.layoutPrefs) != null && a.get && (J.layoutPrefs = m.layoutPrefs.get()), (l = m.layoutPresets) != null && l.getCurrent && (J.layoutPreset = m.layoutPresets.getCurrent()), (c = m.theme) != null && c.getTheme && (J.theme = m.theme.getTheme()), (u = m.theme) != null && u.getRegionThemes && (J.regionThemes = m.theme.getRegionThemes()), (h = m.a11y) != null && h.getActivePresets && (J.a11yPresets = m.a11y.getActivePresets()), (E = m.a11y) != null && E.getAllSettings && (J.a11ySettings = m.a11y.getAllSettings()), (v = m.slots) != null && v.info) {
      const Qa = m.slots.info();
      J.slots = Qa.slotsByRegion || {};
    }
    (T = m.maintenance) != null && T.getState && (J.maintenance = m.maintenance.getState()), (he = m.debugPresets) != null && he.getCurrent && (J.debugPreset = m.debugPresets.getCurrent()), (te = m.shortcuts) != null && te.getAll && (J.shortcuts = ((hn = m.shortcuts.getAll()) == null ? void 0 : hn.length) || 0), (oe = m.notify) != null && oe.getAll && (J.notifications = ((w = m.notify.getAll()) == null ? void 0 : w.length) || 0);
  } catch (Qa) {
    J._collectionError = Qa.message;
  }
  return J;
}
function LT(e) {
  var t, n, s;
  if (!e.includePerformance) return null;
  const r = {};
  try {
    const i = gu();
    (t = i == null ? void 0 : i.perf) != null && t.getMetrics && (r.metrics = i.perf.getMetrics()), typeof window < "u" && window.performance && (r.memory = window.performance.memory ? {
      usedJSHeapSize: window.performance.memory.usedJSHeapSize,
      totalJSHeapSize: window.performance.memory.totalJSHeapSize
    } : null, r.timing = {
      navigationStart: (n = window.performance.timing) == null ? void 0 : n.navigationStart,
      loadEventEnd: (s = window.performance.timing) == null ? void 0 : s.loadEventEnd
    });
  } catch (i) {
    r._error = i.message;
  }
  return r;
}
function MT(e) {
  var t, n, s;
  if (!e.includeAdapters) return null;
  const r = gu();
  if (!r) return null;
  const i = {};
  try {
    if ((t = r.responsive) != null && t.info) {
      const o = r.responsive.info();
      i.responsive = { breakpoint: o.currentBreakpoint, enabled: o.enabled };
    }
    (n = r.offline) != null && n.getState && (i.offline = r.offline.getState()), (s = r.serviceWorker) != null && s.getState && (i.serviceWorker = r.serviceWorker.getState());
  } catch (o) {
    i._error = o.message;
  }
  return i;
}
function PT(e) {
  if (!e.includeDOM) return null;
  const t = {};
  try {
    const n = ["header", "nav-rail", "sidebar", "main", "footer"];
    for (let s = 0; s < n.length; s++) {
      const r = n[s], i = document.querySelector(`[data-region="${r}"]`);
      i ? t[r] = {
        exists: !0,
        visible: i.offsetParent !== null,
        classList: Array.from(i.classList),
        childCount: i.children.length
      } : t[r] = { exists: !1 };
    }
  } catch (n) {
    t._error = n.message;
  }
  return t;
}
function NT(e, t, n) {
  const s = {
    id: eg(),
    label: e || `Snapshot ${n.snapshots.length + 1}`,
    timestamp: Date.now(),
    metadata: t || {},
    appShell: _T(),
    performance: LT(n.config),
    adapters: MT(n.config),
    dom: PT(n.config)
  };
  for (s.size = RT(s), n.snapshots.push(s), n.metrics.snapshotsTaken++; n.snapshots.length > n.config.maxSnapshots; )
    n.snapshots.shift();
  return n.notify({
    type: "captured",
    snapshot: { id: s.id, label: s.label, timestamp: s.timestamp },
    total: n.snapshots.length
  }), s;
}
function $T(e, t, n) {
  var s, r, i, o, a, l, c, u;
  const h = n.snapshots.find((v) => v.id === e);
  if (!h) return { success: !1, error: "Snapshot não encontrado" };
  t = t || { layout: !0, theme: !0, a11y: !0, visibility: !0 };
  const E = [];
  try {
    const v = h.appShell, T = typeof window < "u" && window.AppShell ? window.AppShell : null;
    if (!T) return { success: !1, error: "AppShell not available", restored: E };
    if (t.layout && v.layoutPrefs && (s = T.layoutPrefs) != null && s.setPreferences && (T.layoutPrefs.setPreferences(v.layoutPrefs), E.push("layoutPrefs")), t.layout && v.layoutPreset && (r = T.layoutPresets) != null && r.apply && (T.layoutPresets.apply(v.layoutPreset), E.push("layoutPreset")), t.theme && v.theme && (i = T.theme) != null && i.setTheme && (T.theme.setTheme(v.theme), E.push("theme")), t.a11y && v.a11yPresets && (o = T.a11y) != null && o.enableMultiple && ((l = (a = T.a11y).reset) == null || l.call(a), T.a11y.enableMultiple(v.a11yPresets), E.push("a11yPresets")), t.visibility && v.visibility && T.visibility) {
      const he = Object.keys(v.visibility);
      for (let te = 0; te < he.length; te++)
        (u = (c = T.visibility).setVisibility) == null || u.call(c, he[te], v.visibility[he[te]]);
      E.push("visibility");
    }
    return n.metrics.snapshotsRestored++, n.notify({ type: "restored", snapshotId: e, restored: E }), { success: !0, restored: E, snapshotId: e };
  } catch (v) {
    return n.metrics.errors++, { success: !1, error: v.message, restored: E };
  }
}
function zT(e, t, n) {
  var s, r, i, o, a, l;
  const c = n.snapshots.find((v) => v.id === e), u = n.snapshots.find((v) => v.id === t);
  if (!c || !u) return { error: "Um ou ambos snapshots não encontrados" };
  n.metrics.comparisons++;
  const h = {
    snapshot1: { id: c.id, label: c.label, timestamp: c.timestamp },
    snapshot2: { id: u.id, label: u.label, timestamp: u.timestamp },
    timeDiff: u.timestamp - c.timestamp,
    changes: []
  }, E = ["theme", "layoutPreset", "debugPreset", "visibility", "regionSizes"];
  for (let v = 0; v < E.length; v++) {
    const T = E[v], he = JSON.stringify((s = c.appShell) == null ? void 0 : s[T]), te = JSON.stringify((r = u.appShell) == null ? void 0 : r[T]);
    he !== te && h.changes.push({ field: T, before: (i = c.appShell) == null ? void 0 : i[T], after: (o = u.appShell) == null ? void 0 : o[T] });
  }
  if ((a = c.performance) != null && a.memory && (l = u.performance) != null && l.memory) {
    const v = (u.performance.memory.usedJSHeapSize || 0) - (c.performance.memory.usedJSHeapSize || 0);
    v !== 0 && h.changes.push({
      field: "memory.usedJSHeapSize",
      before: c.performance.memory.usedJSHeapSize,
      after: u.performance.memory.usedJSHeapSize,
      delta: v
    });
  }
  return h;
}
function tg(e, t) {
  return t.snapshots.find((n) => n.id === e) || null;
}
function jT(e) {
  return e.snapshots.map((t) => ({
    id: t.id,
    label: t.label,
    timestamp: t.timestamp,
    size: t.size
  }));
}
function HT(e) {
  return e.snapshots.length > 0 ? e.snapshots[e.snapshots.length - 1] : null;
}
function UT(e, t) {
  return t.snapshots.filter((n) => n.label.includes(e));
}
function BT(e) {
  return e.snapshots.length;
}
function FT(e, t) {
  const n = t.snapshots.findIndex((s) => s.id === e);
  return n >= 0 ? (t.snapshots.splice(n, 1), !0) : !1;
}
function VT(e) {
  e.snapshots.length = 0, e.notify({ type: "cleared" });
}
function GT(e, t) {
  const n = tg(e, t);
  return n ? JSON.stringify(n, null, 2) : null;
}
function YT(e) {
  return JSON.stringify(e.snapshots, null, 2);
}
function qT(e, t) {
  try {
    const n = typeof e == "string" ? JSON.parse(e) : e;
    if (!n.id || !n.timestamp) throw new Error("Invalid snapshot format");
    return n.id = eg(), n.imported = !0, t.snapshots.push(n), { success: !0, id: n.id };
  } catch (n) {
    return { success: !1, error: n.message };
  }
}
const Ci = [], cr = [];
let Ai = null;
const pt = {
  maxSnapshots: 50,
  autoSnapshot: !1,
  autoSnapshotInterval: 3e4,
  includeDOM: !1,
  includePerformance: !0,
  includeAdapters: !0,
  compressData: !1,
  persistToStorage: !1,
  storageKey: "app-shell-snapshots"
}, mu = {
  snapshotsTaken: 0,
  snapshotsRestored: 0,
  comparisons: 0,
  errors: 0
};
function WT(e) {
  for (let t = 0; t < cr.length; t++)
    try {
      cr[t](e);
    } catch {
    }
}
const yt = {
  get snapshots() {
    return Ci;
  },
  get config() {
    return pt;
  },
  get metrics() {
    return mu;
  },
  notify: WT
};
function ng(e, t) {
  return NT(e, t, yt);
}
function KT(e, t) {
  return $T(e, t, yt);
}
function XT(e, t) {
  return zT(e, t, yt);
}
function JT(e) {
  return tg(e, yt);
}
function sg() {
  return jT(yt);
}
function QT() {
  return HT(yt);
}
function ZT(e) {
  return UT(e, yt);
}
function e1() {
  return BT(yt);
}
function t1(e) {
  return FT(e, yt);
}
function n1() {
  VT(yt);
}
function s1(e) {
  return GT(e, yt);
}
function r1() {
  return YT(yt);
}
function i1(e) {
  return qT(e, yt);
}
function o1(e) {
  rg(), pt.autoSnapshot = !0, pt.autoSnapshotInterval = e || pt.autoSnapshotInterval, Ai = setInterval(() => {
    ng("Auto Snapshot", { auto: !0 });
  }, pt.autoSnapshotInterval);
}
function rg() {
  Ai && (clearInterval(Ai), Ai = null), pt.autoSnapshot = !1;
}
function vu() {
  return Ai !== null;
}
function a1(e) {
  e.maxSnapshots !== void 0 && (pt.maxSnapshots = e.maxSnapshots), e.includeDOM !== void 0 && (pt.includeDOM = !!e.includeDOM), e.includePerformance !== void 0 && (pt.includePerformance = !!e.includePerformance), e.includeAdapters !== void 0 && (pt.includeAdapters = !!e.includeAdapters), e.autoSnapshotInterval !== void 0 && (pt.autoSnapshotInterval = e.autoSnapshotInterval);
}
function ig() {
  return Object.assign({}, pt);
}
function l1(e) {
  return typeof e != "function" ? () => {
  } : (cr.push(e), () => {
    const t = cr.indexOf(e);
    t >= 0 && cr.splice(t, 1);
  });
}
function yu() {
  return Object.assign({}, mu);
}
function c1() {
  const e = Ci.reduce((r, i) => r + (i.size || 0), 0), t = {
    hasCapacity: Ci.length < pt.maxSnapshots,
    reasonableSize: e < 5e6,
    noExcessiveErrors: mu.errors < 10
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    snapshotCount: Ci.length,
    totalSize: e,
    autoSnapshotRunning: vu(),
    metrics: yu(),
    version: fu,
    moduleId: hu,
    timestamp: Date.now()
  };
}
function u1() {
  return {
    moduleId: hu,
    version: fu,
    snapshotCount: Ci.length,
    snapshots: sg(),
    autoSnapshotRunning: vu(),
    config: ig(),
    metrics: yu(),
    subscriberCount: cr.length,
    timestamp: Date.now()
  };
}
const H = {
  VERSION: fu,
  MODULE_ID: hu,
  capture: ng,
  restore: KT,
  compare: XT,
  get: JT,
  getAll: sg,
  getLatest: QT,
  getByLabel: ZT,
  count: e1,
  remove: t1,
  clear: n1,
  exportSnapshot: s1,
  exportAll: r1,
  importSnapshot: i1,
  startAutoSnapshot: o1,
  stopAutoSnapshot: rg,
  isAutoSnapshotRunning: vu,
  configure: a1,
  getConfig: ig,
  subscribe: l1,
  getMetrics: yu,
  healthCheck: c1,
  info: u1
}, bu = "1.5.0-P2-ENTERPRISE", js = "app-shell-logger", og = typeof window < "u", Ft = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, SILENT: 4 }), $ = { level: Ft.INFO, enabledModules: [], disabledModules: [], showTimestamp: !0, showModule: !0, showLevel: !0, colorize: !0, maxHistory: 500, persistToStorage: !1 }, Tn = [], Ii = [], vn = { debug: 0, info: 0, warn: 0, error: 0, delegated: 0 }, tf = { DEBUG: "#9E9E9E", INFO: "#2196F3", WARN: "#FF9800", ERROR: "#F44336" };
function ag() {
  if (og && window.Core && window.Core.windowAdapter) {
    const e = window.Core.windowAdapter.get("Logger");
    if (e) return e;
  }
  return null;
}
function d1(e, t) {
  return !(e < $.level || $.enabledModules.length > 0 && $.enabledModules.indexOf(t) < 0 && $.enabledModules.indexOf("*") < 0 || $.disabledModules.indexOf(t) >= 0);
}
function p1(e, t, n) {
  const s = [];
  return $.showTimestamp && s.push(`[${(/* @__PURE__ */ new Date()).toISOString().substr(11, 12)}]`), $.showLevel && s.push(`[${e}]`), $.showModule && t && s.push(`[${t}]`), s.push(n), s.join(" ");
}
function f1(e) {
  Tn.push(e), Tn.length > $.maxHistory && Tn.shift(), Ii.forEach((t) => {
    try {
      t(e);
    } catch {
    }
  });
}
function h1(e, t, n, s) {
  const r = ag();
  if (r && r[e.toLowerCase()])
    try {
      return r[e.toLowerCase()](n, s, t), vn.delegated++, !0;
    } catch {
    }
  return !1;
}
function Da(e, t, n, s, r) {
  if (vn[t.toLowerCase()]++, !d1(e, n)) return;
  const i = { level: e, levelName: t, module: n, message: s, data: r, timestamp: Date.now(), formatted: p1(t, n, s) };
  if (f1(i), h1(t, n, s, r)) return;
  const o = i.formatted;
  if ($.colorize && typeof console < "u") {
    const a = tf[t] || tf.INFO;
    r !== void 0 ? console.log(`%c${o}`, `color:${a}`, r) : console.log(`%c${o}`, `color:${a}`);
  } else
    r !== void 0 ? console.log(o, r) : console.log(o);
}
function lg(e, t, n) {
  Da(Ft.DEBUG, "DEBUG", n || js, e, t);
}
function wl(e, t, n) {
  Da(Ft.INFO, "INFO", n || js, e, t);
}
function cg(e, t, n) {
  Da(Ft.WARN, "WARN", n || js, e, t);
}
function ug(e, t, n) {
  Da(Ft.ERROR, "ERROR", n || js, e, t);
}
function g1(e) {
  return {
    debug(t, n) {
      lg(t, n, e);
    },
    info(t, n) {
      wl(t, n, e);
    },
    warn(t, n) {
      cg(t, n, e);
    },
    error(t, n) {
      ug(t, n, e);
    }
  };
}
function dg(e) {
  $.level = typeof e == "number" ? e : Ft[e.toUpperCase()] || Ft.INFO;
}
function m1() {
  return $.level;
}
function v1() {
  const e = Object.keys(Ft);
  for (let t = 0; t < e.length; t++)
    if (Ft[e[t]] === $.level) return e[t];
  return "UNKNOWN";
}
function y1() {
  return fg();
}
function b1(e) {
  e.level !== void 0 && dg(e.level), e.showTimestamp !== void 0 && ($.showTimestamp = !!e.showTimestamp), e.showModule !== void 0 && ($.showModule = !!e.showModule), e.showLevel !== void 0 && ($.showLevel = !!e.showLevel), e.colorize !== void 0 && ($.colorize = !!e.colorize), e.maxHistory !== void 0 && ($.maxHistory = Math.max(0, e.maxHistory));
}
function pg() {
  return Object.assign({}, $);
}
function E1(e) {
  $.enabledModules.indexOf(e) < 0 && $.enabledModules.push(e);
}
function k1(e) {
  $.disabledModules.indexOf(e) < 0 && $.disabledModules.push(e);
}
function S1(e) {
  $.enabledModules = e.slice();
}
function T1() {
  $.enabledModules = ["*"], $.disabledModules = [];
}
function w1(e) {
  return e ? Tn.filter((t) => !(e.level !== void 0 && t.level < e.level || e.module && t.module !== e.module)) : Tn.slice();
}
function C1() {
  Tn.length = 0;
}
function A1(e) {
  return typeof e == "function" && Ii.push(e), () => {
    const t = Ii.indexOf(e);
    t >= 0 && Ii.splice(t, 1);
  };
}
function Eu() {
  return Object.assign({}, vn, { historySize: Tn.length, subscriberCount: Ii.length });
}
function I1() {
  const e = { operational: !0, historyNotFull: Tn.length < $.maxHistory * 0.9, lowErrorRate: vn.info + vn.debug === 0 || vn.error / (vn.info + vn.debug + vn.error) < 0.3, strictModeCompliant: !0 }, t = Object.values(e).filter(Boolean).length;
  return { status: t === 4 ? "HEALTHY" : "DEGRADED", score: `${t}/4`, checks: e, metrics: Eu(), strictMode: Ur(), version: bu, moduleId: js, timestamp: Date.now() };
}
function fg() {
  const e = ag();
  return { moduleId: js, version: bu, config: pg(), metrics: Eu(), historySize: Tn.length, delegatingToGlobal: !!e, strictMode: Ur(), timestamp: Date.now() };
}
const q = {
  VERSION: bu,
  MODULE_ID: js,
  LOG_LEVELS: Ft,
  debug: lg,
  info: wl,
  logInfo: wl,
  warn: cg,
  error: ug,
  createLogger: g1,
  setLevel: dg,
  getLevel: m1,
  getLevelName: v1,
  getInfo: y1,
  configure: b1,
  getConfig: pg,
  enableModule: E1,
  disableModule: k1,
  enableOnlyModules: S1,
  enableAllModules: T1,
  getHistory: w1,
  clearHistory: C1,
  subscribe: A1,
  getMetrics: Eu,
  healthCheck: I1,
  moduleInfo: fg
};
og && typeof window.__DEVTOOLS__ < "u" && (window.__DEVTOOLS__.AppShellLogger = q);
const ku = "1.0.0-P2-ENTERPRISE", Su = "app-shell-config-validator", Dt = { validations: 0, passed: 0, failed: 0, warnings: 0 };
let Cl = null;
const Oa = {
  force: { type: "boolean", default: !1 },
  adapters: {
    type: "object",
    properties: {
      globalState: { type: "boolean", default: !0 },
      auth: { type: "boolean", default: !0 },
      layout: { type: "boolean", default: !0 },
      theme: { type: "boolean", default: !0 },
      notification: { type: "boolean", default: !0 },
      router: { type: "boolean", default: !0 },
      ticker: { type: "boolean", default: !0 },
      responsive: { type: "boolean", default: !0 }
    }
  },
  logger: {
    type: "object",
    properties: {
      level: { type: "string", enum: ["debug", "info", "warn", "error", "silent"], default: "info" },
      colorize: { type: "boolean", default: !0 }
    }
  },
  healthCheck: {
    type: "object",
    properties: {
      autoEnabled: { type: "boolean", default: !0 },
      interval: { type: "number", min: 1e3, max: 3e5, default: 3e4 }
    }
  },
  responsive: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: !0 },
      autoApply: { type: "boolean", default: !0 }
    }
  },
  keyboard: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: !0 }
    }
  },
  theme: {
    type: "object",
    properties: {
      initial: { type: "string", enum: ["light", "dark", "system"], default: "system" }
    }
  },
  debug: { type: "boolean", default: !1 }
};
function hg(e, t, n) {
  const s = [], r = [];
  if (e === void 0)
    return t.required && s.push({ path: n, message: "Required field missing", code: "REQUIRED" }), { valid: s.length === 0, errors: s, warnings: r };
  const i = Array.isArray(e) ? "array" : typeof e;
  if (t.type && i !== t.type)
    return s.push({ path: n, message: `Expected ${t.type}, got ${i}`, code: "TYPE_MISMATCH" }), { valid: !1, errors: s, warnings: r };
  if (t.enum && t.enum.indexOf(e) < 0 && s.push({ path: n, message: `Value must be one of: ${t.enum.join(", ")}`, code: "INVALID_ENUM" }), t.min !== void 0 && e < t.min && s.push({ path: n, message: `Value must be >= ${t.min}`, code: "MIN_VALUE" }), t.max !== void 0 && e > t.max && s.push({ path: n, message: `Value must be <= ${t.max}`, code: "MAX_VALUE" }), t.type === "object" && t.properties) {
    const o = Object.keys(t.properties);
    for (let l = 0; l < o.length; l++) {
      const c = o[l], u = hg(e[c], t.properties[c], `${n}.${c}`);
      s.push.apply(s, u.errors), r.push.apply(r, u.warnings);
    }
    const a = Object.keys(e);
    for (let l = 0; l < a.length; l++)
      t.properties[a[l]] || r.push({ path: `${n}.${a[l]}`, message: "Unknown property", code: "UNKNOWN_PROP" });
  }
  return { valid: s.length === 0, errors: s, warnings: r };
}
function gg(e, t) {
  Dt.validations++;
  const n = hg(e, { type: "object", properties: t }, "options");
  return n.valid ? Dt.passed++ : Dt.failed++, Dt.warnings += n.warnings.length, Cl = { options: e, schema: t, result: n, timestamp: Date.now() }, n;
}
function mg(e, t) {
  e = e || {};
  const n = gg(e, t);
  if (!n.valid) return { valid: !1, errors: n.errors, warnings: n.warnings, normalized: null };
  const s = Al(e, t);
  return { valid: !0, errors: [], warnings: n.warnings, normalized: s };
}
function Al(e, t) {
  const n = {}, s = Object.keys(t);
  for (let r = 0; r < s.length; r++) {
    const i = s[r], o = t[i];
    e[i] !== void 0 ? o.type === "object" && o.properties ? n[i] = Al(e[i], o.properties) : n[i] = e[i] : o.default !== void 0 ? n[i] = o.default : o.type === "object" && o.properties && (n[i] = Al({}, o.properties));
  }
  return n;
}
function D1(e) {
  return mg(e, Oa);
}
function O1(e) {
  return Object.freeze(Object.assign({}, e));
}
function x1() {
  return Cl ? Object.assign({}, Cl) : null;
}
function R1() {
  return Object.assign({}, Oa);
}
function _1(e) {
  return e.map((t) => `[${t.code}] ${t.path}: ${t.message}`).join(`
`);
}
function Tu() {
  return Object.assign({}, Dt, { successRate: Dt.validations > 0 ? Math.round(Dt.passed / Dt.validations * 100) : 100 });
}
function L1() {
  const e = { operational: !0, lowFailureRate: Dt.validations === 0 || Dt.failed / Dt.validations < 0.5, fewWarnings: Dt.warnings < 100 }, t = Object.values(e).filter(Boolean).length;
  return { status: t === 3 ? "HEALTHY" : "DEGRADED", score: `${t}/3`, checks: e, metrics: Tu(), version: ku, moduleId: Su, timestamp: Date.now() };
}
function M1() {
  return { moduleId: Su, version: ku, schemaProperties: Object.keys(Oa), metrics: Tu(), timestamp: Date.now() };
}
const kt = { VERSION: ku, MODULE_ID: Su, validate: gg, validateAndNormalize: mg, validateInitOptions: D1, INIT_OPTIONS_SCHEMA: Oa, createSchema: O1, getLastValidation: x1, getInitSchema: R1, formatErrors: _1, getMetrics: Tu, healthCheck: L1, info: M1 }, wu = "1.0.0-P2-ENTERPRISE", Cu = "app-shell-rate-limiter", xr = Object.freeze({ RESIZE: 150, SCROLL: 100, INPUT: 300, SEARCH: 400, MOUSEMOVE: 50, CLICK: 250 }), Zt = /* @__PURE__ */ new Map(), en = /* @__PURE__ */ new Map(), Bi = { throttleCalls: 0, throttleSkipped: 0, debounceCalls: 0, debounceSkipped: 0 };
function Au(e, t, n) {
  n = n || {};
  const s = n.leading !== !1, r = n.trailing !== !1;
  let i = 0, o = null, a = null;
  function l() {
    Bi.throttleCalls++;
    const c = Date.now(), u = t - (c - i);
    if (o = arguments, u <= 0 || u > t)
      a && (clearTimeout(a), a = null), i = c, e.apply(this, o);
    else if (!a && r) {
      const h = this;
      a = setTimeout(() => {
        i = s ? Date.now() : 0, a = null, e.apply(h, o);
      }, u);
    } else
      Bi.throttleSkipped++;
  }
  return l.cancel = () => {
    a && (clearTimeout(a), a = null);
  }, l.flush = function() {
    a && (clearTimeout(a), a = null, e.apply(this, o));
  }, l;
}
function Iu(e, t, n) {
  n = n || {};
  const s = n.leading || !1, r = n.trailing !== !1, i = n.maxWait;
  let o = null, a = null, l = null, c = 0, u = 0;
  function h(T) {
    u = T, e.apply(l, a), a = l = null;
  }
  function E(T) {
    const he = T - c, te = T - u;
    return c === 0 || he >= t || i !== void 0 && te >= i;
  }
  function v() {
    Bi.debounceCalls++;
    const T = Date.now(), he = E(T);
    if (a = arguments, l = this, c = T, he && s && !o) {
      h(T);
      return;
    }
    o && (clearTimeout(o), Bi.debounceSkipped++), r && (o = setTimeout(() => {
      o = null, h(Date.now());
    }, t));
  }
  return v.cancel = () => {
    o && (clearTimeout(o), o = null), a = l = null, c = 0;
  }, v.flush = () => {
    o && (clearTimeout(o), o = null, h(Date.now()));
  }, v.pending = () => o !== null, v;
}
function P1(e) {
  let t = null, n = null;
  function s() {
    if (n = arguments, t) return;
    const r = this;
    t = requestAnimationFrame(() => {
      t = null, e.apply(r, n);
    });
  }
  return s.cancel = () => {
    t && (cancelAnimationFrame(t), t = null);
  }, s;
}
function N1(e, t, n, s) {
  if (Zt.has(e)) return Zt.get(e);
  const r = Au(t, n, s);
  return Zt.set(e, r), r;
}
function $1(e, t, n, s) {
  if (en.has(e)) return en.get(e);
  const r = Iu(t, n, s);
  return en.set(e, r), r;
}
function z1(e) {
  const t = Zt.get(e);
  return t ? (t.cancel(), Zt.delete(e), !0) : !1;
}
function j1(e) {
  const t = en.get(e);
  return t ? (t.cancel(), en.delete(e), !0) : !1;
}
function H1() {
  Zt.forEach((e) => {
    e.cancel();
  }), en.forEach((e) => {
    e.cancel();
  }), Zt.clear(), en.clear();
}
function U1(e, t, n) {
  const s = xr[t] || xr[t.toUpperCase()] || 100;
  return Au(e, s, n);
}
function B1(e, t, n) {
  const s = xr[t] || xr[t.toUpperCase()] || 300;
  return Iu(e, s, n);
}
function Du() {
  return Object.assign({}, Bi, { managedThrottled: Zt.size, managedDebounced: en.size });
}
function F1() {
  const e = { operational: !0, notOverloaded: Zt.size + en.size < 100 }, t = Object.values(e).filter(Boolean).length;
  return { status: t === 2 ? "HEALTHY" : "DEGRADED", score: `${t}/2`, checks: e, metrics: Du(), version: wu, moduleId: Cu, timestamp: Date.now() };
}
function V1() {
  return { moduleId: Cu, version: wu, presets: xr, managedThrottled: Array.from(Zt.keys()), managedDebounced: Array.from(en.keys()), metrics: Du(), timestamp: Date.now() };
}
const ze = { VERSION: wu, MODULE_ID: Cu, PRESETS: xr, throttle: Au, debounce: Iu, rafThrottle: P1, getThrottled: N1, getDebounced: $1, removeThrottled: z1, removeDebounced: j1, clearAll: H1, throttleWithPreset: U1, debounceWithPreset: B1, getMetrics: Du, healthCheck: F1, info: V1 }, Ou = "1.0.0-AAA", xu = "app-shell-sw-manager", bn = Object.freeze({
  INSTALLING: "installing",
  INSTALLED: "installed",
  ACTIVATING: "activating",
  ACTIVATED: "activated",
  REDUNDANT: "redundant",
  ERROR: "error",
  NOT_SUPPORTED: "not-supported",
  NOT_REGISTERED: "not-registered"
}), xa = Object.freeze({
  IMMEDIATE: "immediate",
  PROMPT: "prompt",
  SILENT: "silent"
}), k = {
  supported: !1,
  registration: null,
  state: bn.NOT_REGISTERED,
  updateAvailable: !1,
  waitingWorker: null,
  error: null
}, vg = {
  swPath: "/sw.js",
  scope: "/",
  updateStrategy: xa.PROMPT,
  checkInterval: 36e5,
  autoRegister: !1
};
function po() {
  return vg;
}
function ui(e, t) {
  vg[e] = t;
}
const ur = [];
let yg = null;
function G1() {
  return yg;
}
function bg(e) {
  yg = e;
}
const ss = {
  registrations: 0,
  updates: 0,
  errors: 0,
  messagesSent: 0,
  messagesReceived: 0
};
function bs(e) {
  ss.hasOwnProperty(e) && ss[e]++;
}
function Ru() {
  return {
    registrations: ss.registrations,
    updates: ss.updates,
    errors: ss.errors,
    messagesSent: ss.messagesSent,
    messagesReceived: ss.messagesReceived
  };
}
function Fi(e) {
  for (let t = 0; t < ur.length; t++)
    try {
      ur[t](e);
    } catch {
    }
}
function Gs(e, t) {
  const n = k.state;
  k.state = e, t && (t.registration !== void 0 && (k.registration = t.registration), t.updateAvailable !== void 0 && (k.updateAvailable = t.updateAvailable), t.waitingWorker !== void 0 && (k.waitingWorker = t.waitingWorker), t.error !== void 0 && (k.error = t.error)), Fi({
    type: "state-changed",
    from: n,
    to: e,
    data: t,
    timestamp: Date.now()
  });
}
function Eg() {
  return k.registration ? k.registration.update().then(() => ({
    ok: !0,
    updateAvailable: k.updateAvailable
  })).catch((e) => ({
    ok: !1,
    error: e.message
  })) : Promise.resolve({ ok: !1, error: "No registration" });
}
function Y1() {
  return k.waitingWorker ? (_u(), { ok: !0 }) : { ok: !1, error: "No waiting worker" };
}
function _u() {
  k.waitingWorker && (k.waitingWorker.postMessage({ type: "SKIP_WAITING" }), bs("messagesSent"));
}
function q1() {
  return k.updateAvailable;
}
function Kr() {
  return k.supported = "serviceWorker" in navigator, k.supported;
}
function kg(e) {
  if (e = e || {}, !Kr())
    return Gs(bn.NOT_SUPPORTED), Promise.resolve({ ok: !1, error: "Service Workers not supported" });
  const t = po(), n = e.swPath || t.swPath, s = e.scope || t.scope;
  return navigator.serviceWorker.register(n, { scope: s }).then((r) => (k.registration = r, bs("registrations"), r.addEventListener("updatefound", () => {
    const i = r.installing;
    i.addEventListener("statechange", () => {
      i.state === "installed" && navigator.serviceWorker.controller && (k.updateAvailable = !0, k.waitingWorker = i, bs("updates"), Fi({
        type: "update-available",
        worker: i,
        timestamp: Date.now()
      }), t.updateStrategy === xa.IMMEDIATE && _u());
    });
  }), r.installing ? Gs(bn.INSTALLING, { registration: r }) : r.waiting ? (k.updateAvailable = !0, k.waitingWorker = r.waiting, Gs(bn.INSTALLED, { registration: r, updateAvailable: !0 })) : r.active && Gs(bn.ACTIVATED, { registration: r }), Fi({
    type: "registered",
    registration: r,
    timestamp: Date.now()
  }), { ok: !0, registration: r })).catch((r) => (bs("errors"), Gs(bn.ERROR, { error: r.message }), { ok: !1, error: r.message }));
}
function W1() {
  return k.registration ? k.registration.unregister().then((e) => (e && (k.registration = null, Gs(bn.NOT_REGISTERED), Fi({
    type: "unregistered",
    timestamp: Date.now()
  })), { ok: e })) : Promise.resolve({ ok: !1, error: "No registration" });
}
function Lu(e) {
  return navigator.serviceWorker.controller ? new Promise((t) => {
    const n = new MessageChannel();
    n.port1.onmessage = (s) => {
      bs("messagesReceived"), t({ ok: !0, response: s.data });
    }, navigator.serviceWorker.controller.postMessage(e, [n.port2]), bs("messagesSent");
  }) : Promise.resolve({ ok: !1, error: "No controller" });
}
function K1(e) {
  if (!Kr()) return () => {
  };
  const t = (n) => {
    bs("messagesReceived"), e(n.data, n);
  };
  return navigator.serviceWorker.addEventListener("message", t), () => {
    navigator.serviceWorker.removeEventListener("message", t);
  };
}
function X1(e) {
  return Lu({
    type: "CLEAR_CACHE",
    cacheName: e || null
  });
}
function J1(e) {
  return Lu({
    type: "PRECACHE",
    urls: e
  });
}
function Q1() {
  return typeof caches > "u" ? Promise.resolve([]) : caches.keys();
}
function Z1() {
  return !navigator.storage || !navigator.storage.estimate ? Promise.resolve({ usage: 0, quota: 0 }) : navigator.storage.estimate().then((e) => ({
    usage: e.usage || 0,
    quota: e.quota || 0,
    usagePercent: e.quota ? Math.round(e.usage / e.quota * 100) : 0
  }));
}
function ew(e) {
  return !k.registration || !k.registration.sync ? Promise.resolve({ ok: !1, error: "Background Sync not supported" }) : k.registration.sync.register(e).then(() => ({
    ok: !0,
    tag: e
  })).catch((t) => ({
    ok: !1,
    error: t.message
  }));
}
function tw() {
  return !k.registration || !k.registration.sync ? Promise.resolve([]) : k.registration.sync.getTags();
}
function nw(e) {
  const t = "=".repeat((4 - e.length % 4) % 4), n = (e + t).replace(/-/g, "+").replace(/_/g, "/"), s = window.atob(n), r = new Uint8Array(s.length);
  for (let i = 0; i < s.length; ++i)
    r[i] = s.charCodeAt(i);
  return r;
}
function sw() {
  return "Notification" in window ? Notification.requestPermission().then((e) => ({
    ok: e === "granted",
    permission: e
  })) : Promise.resolve({ ok: !1, error: "Notifications not supported" });
}
function rw() {
  return !k.registration || !k.registration.pushManager ? Promise.resolve(null) : k.registration.pushManager.getSubscription();
}
function iw(e) {
  if (!k.registration || !k.registration.pushManager)
    return Promise.resolve({ ok: !1, error: "Push not supported" });
  const t = {
    userVisibleOnly: !0,
    applicationServerKey: nw(e)
  };
  return k.registration.pushManager.subscribe(t).then((n) => ({
    ok: !0,
    subscription: n
  })).catch((n) => ({
    ok: !1,
    error: n.message
  }));
}
function ow(e) {
  Sg();
  const t = po();
  return e = e || t.checkInterval, bg(setInterval(() => {
    Eg();
  }, e)), { ok: !0, interval: e };
}
function Sg() {
  const e = G1();
  e && (clearInterval(e), bg(null));
}
function Tg() {
  return !!k.registration;
}
function Mu() {
  return !!navigator.serviceWorker.controller;
}
function wg() {
  return {
    supported: k.supported,
    state: k.state,
    updateAvailable: k.updateAvailable,
    isControlling: Mu(),
    error: k.error
  };
}
function aw() {
  return k.registration;
}
function lw(e) {
  e.swPath !== void 0 && ui("swPath", e.swPath), e.scope !== void 0 && ui("scope", e.scope), e.updateStrategy !== void 0 && ui("updateStrategy", e.updateStrategy), e.checkInterval !== void 0 && ui("checkInterval", Math.max(6e4, e.checkInterval)), e.autoRegister !== void 0 && ui("autoRegister", !!e.autoRegister);
}
function cw(e) {
  return typeof e != "function" ? () => {
  } : (ur.push(e), () => {
    const t = ur.indexOf(e);
    t >= 0 && ur.splice(t, 1);
  });
}
function uw() {
  const e = {
    supported: Kr(),
    registered: Tg(),
    noErrors: !k.error,
    controlling: Mu()
  };
  let t = 0;
  const n = Object.keys(e);
  for (let r = 0; r < n.length; r++)
    e[n[r]] && t++;
  let s = "HEALTHY";
  return e.supported ? t < 3 && (s = "DEGRADED") : s = "DEGRADED", {
    status: s,
    score: `${t}/${n.length}`,
    checks: e,
    state: k.state,
    metrics: Ru(),
    version: Ou,
    moduleId: xu,
    timestamp: Date.now()
  };
}
function dw() {
  return {
    moduleId: xu,
    version: Ou,
    supported: Kr(),
    state: wg(),
    config: po(),
    metrics: Ru(),
    subscriberCount: ur.length,
    timestamp: Date.now()
  };
}
typeof window < "u" && (Kr(), navigator.serviceWorker && navigator.serviceWorker.addEventListener("controllerchange", () => {
  Fi({
    type: "controller-changed",
    timestamp: Date.now()
  });
}), po().autoRegister && kg());
const C = {
  VERSION: Ou,
  MODULE_ID: xu,
  SW_STATES: bn,
  UPDATE_STRATEGIES: xa,
  register: kg,
  unregister: W1,
  checkForUpdates: Eg,
  applyUpdate: Y1,
  skipWaiting: _u,
  hasUpdate: q1,
  postMessage: Lu,
  onMessage: K1,
  clearCache: X1,
  precache: J1,
  getCacheNames: Q1,
  getCacheSize: Z1,
  registerSync: ew,
  getSyncTags: tw,
  requestPushPermission: sw,
  getPushSubscription: rw,
  subscribePush: iw,
  isSupported: Kr,
  isRegistered: Tg,
  isControlling: Mu,
  getState: wg,
  getRegistration: aw,
  startPeriodicCheck: ow,
  stopPeriodicCheck: Sg,
  configure: lw,
  getConfig: po,
  subscribe: cw,
  getMetrics: Ru,
  healthCheck: uw,
  info: dw
}, Pu = "1.0.0-AAA", Nu = "app-shell-offline-manager", wt = Object.freeze({
  ONLINE: "online",
  OFFLINE: "offline",
  SLOW: "slow",
  UNKNOWN: "unknown"
}), ps = Object.freeze({
  IDLE: "idle",
  SYNCING: "syncing",
  COMPLETE: "complete",
  ERROR: "error"
}), f = {
  isOnline: !0,
  connectionStatus: wt.UNKNOWN,
  effectiveType: null,
  downlink: null,
  rtt: null,
  syncStatus: ps.IDLE,
  pendingActions: [],
  lastOnline: null,
  lastOffline: null
}, Oe = {
  showBanner: !0,
  bannerPosition: "bottom",
  autoSync: !0,
  syncOnReconnect: !0,
  queuePersist: !0,
  storageKey: "app-shell-offline-queue",
  maxQueueSize: 100,
  slowThreshold: 500
}, Es = [];
let Cg = null;
function Ag(e) {
  Cg = e;
}
function pw() {
  return Cg;
}
const rs = {
  offlineEvents: 0,
  onlineEvents: 0,
  actionsSynced: 0,
  actionsQueued: 0,
  syncErrors: 0
};
function Vi(e, t) {
  rs.hasOwnProperty(e) && (rs[e] += t || 1);
}
function $u() {
  return {
    offlineEvents: rs.offlineEvents,
    onlineEvents: rs.onlineEvents,
    actionsSynced: rs.actionsSynced,
    actionsQueued: rs.actionsQueued,
    syncErrors: rs.syncErrors,
    pendingActions: f.pendingActions.length
  };
}
function Ls(e) {
  for (let t = 0; t < Es.length; t++)
    try {
      Es[t](e);
    } catch {
    }
}
function fw() {
  if (Oe.queuePersist)
    try {
      const e = localStorage.getItem(Oe.storageKey);
      e && (f.pendingActions = JSON.parse(e));
    } catch {
    }
}
function Ig() {
  if (Oe.queuePersist)
    try {
      localStorage.setItem(Oe.storageKey, JSON.stringify(f.pendingActions));
    } catch {
    }
}
function hw() {
  f.pendingActions = [];
  try {
    localStorage.removeItem(Oe.storageKey);
  } catch {
  }
}
function gw(e) {
  if (!e || !e.type)
    return { ok: !1, error: "Invalid action" };
  if (f.pendingActions.length >= Oe.maxQueueSize)
    return { ok: !1, error: "Queue full" };
  const t = {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: e.type,
    data: e.data || {},
    endpoint: e.endpoint || null,
    method: e.method || "POST",
    createdAt: Date.now(),
    retries: 0
  };
  return f.pendingActions.push(t), Vi("actionsQueued"), Ig(), Ls({
    type: "action-queued",
    action: t,
    queueSize: f.pendingActions.length,
    timestamp: Date.now()
  }), { ok: !0, actionId: t.id };
}
function Dg(e) {
  let t = -1;
  for (let n = 0; n < f.pendingActions.length; n++)
    if (f.pendingActions[n].id === e) {
      t = n;
      break;
    }
  return t >= 0 ? (f.pendingActions.splice(t, 1), Ig(), !0) : !1;
}
function mw() {
  return f.pendingActions.slice();
}
function vw() {
  return f.pendingActions.length;
}
function yw() {
  return hw(), Ls({
    type: "queue-cleared",
    timestamp: Date.now()
  }), { ok: !0 };
}
function bw() {
  return f.syncStatus;
}
function Og(e) {
  if (!f.isOnline)
    return Promise.resolve({ ok: !1, error: "Offline" });
  if (f.pendingActions.length === 0)
    return Promise.resolve({ ok: !0, synced: 0 });
  if (f.syncStatus === ps.SYNCING)
    return Promise.resolve({ ok: !1, error: "Sync in progress" });
  f.syncStatus = ps.SYNCING, Ls({
    type: "sync-started",
    count: f.pendingActions.length,
    timestamp: Date.now()
  });
  const t = f.pendingActions.slice();
  let n = 0;
  const s = [], r = (i) => {
    if (i >= t.length)
      return f.syncStatus = s.length > 0 ? ps.ERROR : ps.COMPLETE, Vi("actionsSynced", n), Vi("syncErrors", s.length), Ls({
        type: "sync-complete",
        synced: n,
        errors: s.length,
        timestamp: Date.now()
      }), Promise.resolve({ ok: !0, synced: n, errors: s });
    const o = t[i];
    let a;
    return e ? a = Promise.resolve(e(o)) : o.endpoint ? a = fetch(o.endpoint, {
      method: o.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(o.data)
    }).then((l) => ({
      ok: l.ok
    })) : a = Promise.resolve({ ok: !0 }), a.then((l) => (l.ok ? (Dg(o.id), n++) : (o.retries++, s.push({ actionId: o.id, error: l.error || "Failed" })), r(i + 1))).catch((l) => (o.retries++, s.push({ actionId: o.id, error: l.message }), r(i + 1)));
  };
  return r(0);
}
function zu() {
  typeof navigator > "u" || (f.isOnline = navigator.onLine, navigator.connection ? (f.effectiveType = navigator.connection.effectiveType, f.downlink = navigator.connection.downlink, f.rtt = navigator.connection.rtt, f.isOnline && f.rtt && f.rtt > Oe.slowThreshold ? f.connectionStatus = wt.SLOW : f.connectionStatus = f.isOnline ? wt.ONLINE : wt.OFFLINE) : f.connectionStatus = f.isOnline ? wt.ONLINE : wt.OFFLINE);
}
function il() {
  const e = pw();
  e && e.parentNode && (e.parentNode.removeChild(e), Ag(null));
}
function ju(e, t) {
  if (!Oe.showBanner || typeof document > "u") return;
  il();
  const n = document.createElement("div");
  n.id = "shell-offline-banner", n.setAttribute("role", "alert"), n.setAttribute("aria-live", "polite");
  const s = t === "offline" ? "#dc3545" : t === "slow" ? "#fd7e14" : "#28a745";
  n.style.cssText = [
    "position: fixed",
    Oe.bannerPosition === "top" ? "top: 0" : "bottom: 0",
    "left: 0",
    "right: 0",
    "padding: 10px 16px",
    `background: ${s}`,
    "color: white",
    "font-size: 14px",
    "text-align: center",
    "z-index: 99998",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "gap: 8px"
  ].join(";");
  const r = t === "offline" ? "📡" : t === "slow" ? "🐢" : "✅";
  if (n.innerHTML = `<span>${r}</span><span>${e}</span>`, t !== "offline") {
    const i = document.createElement("button");
    i.innerHTML = "&times;", i.style.cssText = "background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 12px;", i.onclick = il, n.appendChild(i), setTimeout(il, 5e3);
  }
  document.body.appendChild(n), Ag(n);
}
function xg() {
  f.isOnline = !0, f.lastOnline = Date.now(), Vi("onlineEvents"), zu(), ju("Conexao restaurada", "online"), Ls({
    type: "online",
    connectionStatus: f.connectionStatus,
    timestamp: Date.now()
  }), Oe.syncOnReconnect && f.pendingActions.length > 0 && Og();
}
function Rg() {
  f.isOnline = !1, f.lastOffline = Date.now(), f.connectionStatus = wt.OFFLINE, Vi("offlineEvents"), ju("Voce esta offline. Alteracoes serao sincronizadas ao reconectar.", "offline"), Ls({
    type: "offline",
    timestamp: Date.now()
  });
}
function _g() {
  zu(), f.connectionStatus === wt.SLOW && ju("Conexao lenta detectada", "slow"), Ls({
    type: "connection-change",
    connectionStatus: f.connectionStatus,
    effectiveType: f.effectiveType,
    rtt: f.rtt,
    timestamp: Date.now()
  });
}
function Lg() {
  return f.connectionStatus === wt.ONLINE || f.isOnline;
}
function Ew() {
  return f.connectionStatus === wt.OFFLINE || !f.isOnline;
}
function kw() {
  return f.connectionStatus;
}
function Ra() {
  return {
    status: f.connectionStatus,
    effectiveType: f.effectiveType,
    downlink: f.downlink,
    rtt: f.rtt,
    lastChecked: f.lastOnline || f.lastOffline
  };
}
function Sw() {
  return {
    status: f.connectionStatus,
    connectionInfo: Ra(),
    pendingActions: f.pendingActions ? f.pendingActions.length : 0,
    syncStatus: f.syncStatus
  };
}
function Tw(e) {
  e = e || Oe.pingUrl || "/api/health";
  const t = Date.now(), n = new AbortController(), s = setTimeout(() => n.abort(), 5e3);
  return fetch(e, {
    method: "HEAD",
    mode: "no-cors",
    cache: "no-store",
    signal: n.signal
  }).then(() => {
    clearTimeout(s);
    const r = Date.now() - t;
    return f.lastPingLatency = r, f.lastOnline = Date.now(), { ok: !0, latency: r };
  }).catch((r) => (clearTimeout(s), { ok: !1, error: r.message }));
}
function ww(e) {
  e && (e.pingUrl !== void 0 && (Oe.pingUrl = e.pingUrl), e.pingInterval !== void 0 && (Oe.pingInterval = Math.max(5e3, e.pingInterval)), e.maxQueueSize !== void 0 && (Oe.maxQueueSize = Math.max(10, e.maxQueueSize)), e.syncRetryDelay !== void 0 && (Oe.syncRetryDelay = Math.max(1e3, e.syncRetryDelay)), e.maxRetries !== void 0 && (Oe.maxRetries = Math.max(1, e.maxRetries)));
}
function Mg() {
  return Object.assign({}, Oe);
}
function Cw(e) {
  return typeof e != "function" ? () => {
  } : (Es.push(e), () => {
    const t = Es.indexOf(e);
    t >= 0 && Es.splice(t, 1);
  });
}
function Aw() {
  const e = $u(), t = f.pendingActions ? f.pendingActions.length : 0, n = {
    isOnline: Lg(),
    queueNotFull: t < Oe.maxQueueSize,
    noSyncErrors: e.syncErrors < e.actionsSynced * 0.5 || e.syncErrors < 3,
    connectionGood: f.effectiveType !== "slow-2g" && f.effectiveType !== "2g"
  };
  let s = 0;
  const r = Object.keys(n);
  for (let i = 0; i < r.length; i++)
    n[r[i]] && s++;
  return {
    status: s >= 3 ? "HEALTHY" : s >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${s}/${r.length}`,
    checks: n,
    connectionInfo: Ra(),
    pendingActions: t,
    metrics: e,
    version: Pu,
    moduleId: Nu,
    timestamp: Date.now()
  };
}
function Iw() {
  const e = f.pendingActions ? f.pendingActions.length : 0;
  return {
    moduleId: Nu,
    version: Pu,
    status: f.connectionStatus,
    connectionInfo: Ra(),
    config: Mg(),
    pendingActions: e,
    syncStatus: f.syncStatus,
    metrics: $u(),
    subscriberCount: Es.length,
    timestamp: Date.now()
  };
}
function Dw() {
  typeof window < "u" && (window.removeEventListener("online", xg), window.removeEventListener("offline", Rg), typeof navigator < "u" && navigator.connection && navigator.connection.removeEventListener("change", _g)), f.pendingActions && (f.pendingActions.length = 0), Es.length = 0;
}
typeof window < "u" && (zu(), fw(), window.addEventListener("online", xg), window.addEventListener("offline", Rg), typeof navigator < "u" && navigator.connection && navigator.connection.addEventListener("change", _g));
const B = {
  VERSION: Pu,
  MODULE_ID: Nu,
  CONNECTION_STATUS: wt,
  SYNC_STATUS: ps,
  isOnline: Lg,
  isOffline: Ew,
  getConnectionStatus: kw,
  getConnectionInfo: Ra,
  getState: Sw,
  queueAction: gw,
  removeAction: Dg,
  getPendingActions: mw,
  getPendingCount: vw,
  clearPending: yw,
  syncPending: Og,
  getSyncStatus: bw,
  ping: Tw,
  configure: ww,
  getConfig: Mg,
  subscribe: Cw,
  destroy: Dw,
  getMetrics: $u,
  healthCheck: Aw,
  info: Iw
}, Hu = "1.1.0-AAA", Uu = "app-shell-slot-persistence", Bu = "app-shell-slots-state", Il = 100, Ow = 1e4;
function xw(e) {
  return typeof window > "u" ? null : e === "sessionStorage" ? window.sessionStorage : window.localStorage;
}
const re = {
  slots: {},
  metrics: {
    saves: 0,
    loads: 0,
    restores: 0,
    errors: 0
  }
};
function Gi(e) {
  re.metrics.hasOwnProperty(e) && re.metrics[e]++;
}
function Pg(e, t, n, s) {
  s = s || {}, re.slots[e] || (re.slots[e] = {});
  const r = {
    visible: n.visible !== !1,
    position: n.position || null,
    order: n.order || 0,
    collapsed: n.collapsed || !1,
    customData: n.customData || null,
    updatedAt: Date.now()
  };
  return s.saveContent && n.content && n.content.length < Ow && (r.content = n.content), re.slots[e][t] = r, Gi("saves"), Mw(), !0;
}
function Rw(e, t) {
  return re.slots[e] && re.slots[e][t] || null;
}
function Ng(e, t) {
  return !re.slots[e] || !re.slots[e][t] ? !1 : (delete re.slots[e][t], !0);
}
function _w(e) {
  return re.slots[e] ? Object.assign({}, re.slots[e]) : {};
}
function Lw(e) {
  const t = Object.keys(e);
  for (let n = 0; n < t.length; n++) {
    const s = t[n], r = e[s], i = Object.keys(r);
    for (let o = 0; o < i.length; o++)
      Pg(s, i[o], r[i[o]]);
  }
  return !0;
}
function Mw() {
  let e = 0;
  const t = Object.keys(re.slots);
  for (let n = 0; n < t.length; n++)
    e += Object.keys(re.slots[t[n]]).length;
  if (e > Il) {
    const n = [];
    for (let r = 0; r < t.length; r++) {
      const i = t[r], o = Object.keys(re.slots[i]);
      for (let a = 0; a < o.length; a++)
        n.push({
          region: i,
          slotId: o[a],
          updatedAt: re.slots[i][o[a]].updatedAt || 0
        });
    }
    n.sort((r, i) => r.updatedAt - i.updatedAt);
    const s = n.slice(0, e - Il);
    for (let r = 0; r < s.length; r++)
      Ng(s[r].region, s[r].slotId);
  }
}
function Pw() {
  try {
    return localStorage.setItem(Bu, JSON.stringify({
      slots: re.slots,
      timestamp: Date.now()
    })), !0;
  } catch {
    return Gi("errors"), !1;
  }
}
function Nw() {
  try {
    const e = localStorage.getItem(Bu);
    if (!e) return !1;
    const t = JSON.parse(e);
    return re.slots = t.slots || {}, Gi("loads"), !0;
  } catch {
    return Gi("errors"), !1;
  }
}
function $w(e) {
  if (typeof e != "function") return !1;
  const t = Object.keys(re.slots);
  for (let n = 0; n < t.length; n++) {
    const s = t[n], r = Object.keys(re.slots[s]);
    for (let i = 0; i < r.length; i++) {
      const o = r[i], a = re.slots[s][o];
      e(s, o, a);
    }
  }
  return Gi("restores"), !0;
}
function zw() {
  re.slots = {};
  try {
    return localStorage.removeItem(Bu), !0;
  } catch {
    return !1;
  }
}
let Xo = {}, jw = null;
const Ro = [], Fe = {
  enabled: !0,
  autoSave: !0,
  autoSaveDelay: 1e3,
  persistContent: !1,
  storageType: "localStorage"
}, vi = {
  saves: 0,
  loads: 0,
  restores: 0,
  errors: 0
}, Fu = {};
function Hw(e, t) {
  return Pg(e, t, Fu);
}
function Uw(e) {
  return Rw(e, Fu);
}
function Bw(e) {
  return Ng(e, Fu);
}
function Fw(e) {
  return _w(e);
}
function Vw(e) {
  return Lw(e);
}
function Gw() {
  return Pw();
}
function Vu() {
  return Nw();
}
function Yw(e) {
  return $w(e);
}
function qw() {
  return zw();
}
function Ww(e) {
  e.enabled !== void 0 && (Fe.enabled = !!e.enabled), e.autoSave !== void 0 && (Fe.autoSave = !!e.autoSave), e.autoSaveDelay !== void 0 && (Fe.autoSaveDelay = Math.max(100, e.autoSaveDelay)), e.persistContent !== void 0 && (Fe.persistContent = !!e.persistContent), e.storageType !== void 0 && (e.storageType === "sessionStorage" || e.storageType === "localStorage") && (Fe.storageType = e.storageType);
}
function Gu() {
  return {
    enabled: Fe.enabled,
    autoSave: Fe.autoSave,
    autoSaveDelay: Fe.autoSaveDelay,
    persistContent: Fe.persistContent,
    storageType: Fe.storageType
  };
}
function Kw() {
  Fe.enabled = !0, Vu();
}
function Xw() {
  Fe.enabled = !1;
}
function Jw() {
  return Fe.enabled;
}
function Qw(e) {
  return typeof e != "function" ? () => {
  } : (Ro.push(e), () => {
    const t = Ro.indexOf(e);
    t >= 0 && Ro.splice(t, 1);
  });
}
function Yu() {
  return {
    saves: vi.saves,
    loads: vi.loads,
    restores: vi.restores,
    errors: vi.errors,
    storedSlots: Object.keys(Xo).length,
    lastSaved: jw
  };
}
function Zw() {
  const e = xw(Fe.storageType), t = {
    enabled: Fe.enabled,
    storageAvailable: !!e,
    notTooManySlots: Object.keys(Xo).length <= Il,
    lowErrorRate: vi.saves === 0
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/${s.length}`,
    checks: t,
    metrics: Yu(),
    config: Gu(),
    version: Hu,
    moduleId: Uu,
    timestamp: Date.now()
  };
}
function eC() {
  return {
    moduleId: Uu,
    version: Hu,
    enabled: Fe.enabled,
    config: Gu(),
    metrics: Yu(),
    storedSlots: Object.keys(Xo).length,
    slotIds: Object.keys(Xo),
    subscriberCount: Ro.length,
    timestamp: Date.now()
  };
}
typeof window < "u" && Vu();
const le = {
  VERSION: Hu,
  MODULE_ID: Uu,
  saveSlotState: Hw,
  getSlotState: Uw,
  removeSlotState: Bw,
  getRegionSlots: Fw,
  saveMultiple: Vw,
  persist: Gw,
  load: Vu,
  restore: Yw,
  clear: qw,
  configure: Ww,
  getConfig: Gu,
  enable: Kw,
  disable: Xw,
  isEnabled: Jw,
  subscribe: Qw,
  getMetrics: Yu,
  healthCheck: Zw,
  info: eC
}, qu = "1.0.0-AAA", Wu = "app-shell-animation-api", Rr = Object.freeze({
  FADE_IN: "fade-in",
  FADE_OUT: "fade-out",
  SLIDE_IN_LEFT: "slide-in-left",
  SLIDE_IN_RIGHT: "slide-in-right",
  SLIDE_IN_UP: "slide-in-up",
  SLIDE_IN_DOWN: "slide-in-down",
  SLIDE_OUT_LEFT: "slide-out-left",
  SLIDE_OUT_RIGHT: "slide-out-right",
  SCALE_IN: "scale-in",
  SCALE_OUT: "scale-out",
  BOUNCE: "bounce",
  SHAKE: "shake",
  PULSE: "pulse",
  SPIN: "spin"
}), Ku = Object.freeze({
  LINEAR: "linear",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  EASE_IN_CUBIC: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  EASE_OUT_CUBIC: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  EASE_IN_OUT_CUBIC: "cubic-bezier(0.645, 0.045, 0.355, 1)",
  EASE_IN_BACK: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
  EASE_OUT_BACK: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  SPRING: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
}), vt = /* @__PURE__ */ new Map(), _a = /* @__PURE__ */ new Map(), _o = [], Jt = {
  defaultDuration: 300,
  defaultEasing: Ku.EASE_OUT,
  respectReducedMotion: !0,
  defaultFill: "forwards"
}, Di = {
  animationsStarted: 0,
  animationsCompleted: 0,
  animationsCancelled: 0,
  errors: 0
};
function ol(e, t) {
  Di[e] !== void 0 && (Di[e] += 1);
}
function tC() {
  return typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function Xr(e, t, n) {
  if (n = n || {}, tC() && !n.ignoreReducedMotion)
    return Promise.resolve({ cancelled: !1, reducedMotion: !0 });
  if (!e || !e.animate)
    return Promise.resolve({ cancelled: !1, error: "Invalid element" });
  const s = n.duration || Jt.defaultDuration, r = n.easing || Jt.defaultEasing, i = n.fill || "forwards", o = e.animate(t, {
    duration: s,
    easing: r,
    fill: i,
    delay: n.delay || 0,
    iterations: n.iterations || 1
  }), a = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return vt.set(a, o), ol("animationsStarted"), new Promise((l) => {
    const c = n.timeout || s + 1e3;
    let u = null;
    function h(E) {
      u && clearTimeout(u), vt.delete(a), l(E);
    }
    o.onfinish = () => {
      ol("animationsCompleted"), h({ cancelled: !1, id: a });
    }, o.oncancel = () => {
      ol("animationsCancelled"), h({ cancelled: !0, id: a });
    }, u = setTimeout(() => {
      o.cancel(), h({ cancelled: !0, timeout: !0, id: a });
    }, c);
  });
}
function nC(e, t, n) {
  n = n || {};
  const s = n.stagger || 0;
  Array.isArray(e) || (e = Array.from(e));
  let r = Promise.resolve();
  const i = [];
  for (let o = 0; o < e.length; o++)
    ((a) => {
      r = r.then(() => new Promise((l) => {
        setTimeout(() => {
          Xr(e[a], t, n).then((c) => {
            i.push(c), l();
          });
        }, a > 0 ? s : 0);
      }));
    })(o);
  return r.then(() => i);
}
function sC(e, t, n) {
  Array.isArray(e) || (e = Array.from(e));
  const s = e.map((r) => Xr(r, t, n));
  return Promise.all(s);
}
function rC(e, t, n) {
  n = n || {};
  const s = n.staggerDelay || 50;
  Array.isArray(e) || (e = Array.from(e));
  const r = e.map((i, o) => {
    const a = Object.assign({}, n, {
      delay: (n.delay || 0) + o * s
    });
    return Xr(i, t, a);
  });
  return Promise.all(r);
}
function $g(e, t, n) {
  t = t || Rr.FADE_IN;
  const s = `shell-${e}-region`;
  return Xr(`#${s}`, t, n);
}
function zg(e, t, n) {
  t = t || Rr.FADE_OUT;
  const s = `shell-${e}-region`;
  return Xr(`#${s}`, t, n);
}
function iC(e, t, n) {
  n = n || {};
  const s = n.duration || Jt.defaultDuration;
  return zg(e, Rr.FADE_OUT, { duration: s / 2 }).then(() => (typeof t == "function" && t(), $g(e, Rr.FADE_IN, { duration: s / 2 })));
}
function oC(e) {
  const t = vt.get(e);
  return t ? (t.animation.cancel(), vt.delete(e), !0) : !1;
}
function aC() {
  let e = 0;
  return vt.forEach((t) => {
    t.animation.cancel(), e++;
  }), vt.clear(), e;
}
function lC(e) {
  const t = vt.get(e);
  return t ? (t.animation.pause(), !0) : !1;
}
function cC(e) {
  const t = vt.get(e);
  return t ? (t.animation.play(), !0) : !1;
}
function uC() {
  vt.forEach((e) => {
    e.animation.pause();
  });
}
function dC() {
  vt.forEach((e) => {
    e.animation.play();
  });
}
function jg() {
  const e = [];
  return vt.forEach((t) => {
    e.push({
      id: t.id,
      name: t.name,
      startedAt: t.startedAt,
      playState: t.animation.playState
    });
  }), e;
}
const Hg = {
  "fade-in": [
    { opacity: 0 },
    { opacity: 1 }
  ],
  "fade-out": [
    { opacity: 1 },
    { opacity: 0 }
  ],
  "slide-in-left": [
    { transform: "translateX(-100%)", opacity: 0 },
    { transform: "translateX(0)", opacity: 1 }
  ],
  "slide-in-right": [
    { transform: "translateX(100%)", opacity: 0 },
    { transform: "translateX(0)", opacity: 1 }
  ],
  "slide-in-up": [
    { transform: "translateY(100%)", opacity: 0 },
    { transform: "translateY(0)", opacity: 1 }
  ],
  "slide-in-down": [
    { transform: "translateY(-100%)", opacity: 0 },
    { transform: "translateY(0)", opacity: 1 }
  ],
  "slide-out-left": [
    { transform: "translateX(0)", opacity: 1 },
    { transform: "translateX(-100%)", opacity: 0 }
  ],
  "slide-out-right": [
    { transform: "translateX(0)", opacity: 1 },
    { transform: "translateX(100%)", opacity: 0 }
  ],
  "scale-in": [
    { transform: "scale(0)", opacity: 0 },
    { transform: "scale(1)", opacity: 1 }
  ],
  "scale-out": [
    { transform: "scale(1)", opacity: 1 },
    { transform: "scale(0)", opacity: 0 }
  ],
  bounce: [
    { transform: "translateY(0)" },
    { transform: "translateY(-20px)" },
    { transform: "translateY(0)" },
    { transform: "translateY(-10px)" },
    { transform: "translateY(0)" }
  ],
  shake: [
    { transform: "translateX(0)" },
    { transform: "translateX(-10px)" },
    { transform: "translateX(10px)" },
    { transform: "translateX(-10px)" },
    { transform: "translateX(10px)" },
    { transform: "translateX(0)" }
  ],
  pulse: [
    { transform: "scale(1)" },
    { transform: "scale(1.05)" },
    { transform: "scale(1)" }
  ],
  spin: [
    { transform: "rotate(0deg)" },
    { transform: "rotate(360deg)" }
  ]
};
function pC(e, t) {
  return Hg[e] ? { ok: !1, error: "Cannot override built-in animation" } : (_a.set(e, { keyframes: t }), { ok: !0 });
}
function fC(e) {
  return _a.delete(e);
}
function Ug() {
  const e = Object.keys(Hg).map((t) => ({
    name: t,
    isBuiltIn: !0
  }));
  return _a.forEach((t, n) => {
    e.push({ name: n, isBuiltIn: !1 });
  }), e;
}
function hC(e) {
  e.defaultDuration !== void 0 && (Jt.defaultDuration = Math.max(0, e.defaultDuration)), e.defaultEasing !== void 0 && (Jt.defaultEasing = e.defaultEasing), e.respectReducedMotion !== void 0 && (Jt.respectReducedMotion = !!e.respectReducedMotion), e.defaultFill !== void 0 && (Jt.defaultFill = e.defaultFill);
}
function Bg() {
  return Object.assign({}, Jt);
}
function gC(e) {
  return typeof e != "function" ? () => {
  } : (_o.push(e), function() {
    const t = _o.indexOf(e);
    t >= 0 && _o.splice(t, 1);
  });
}
function Xu() {
  return Jt.respectReducedMotion && typeof window < "u" && window.matchMedia ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches : !0;
}
function Ju() {
  return {
    animationsStarted: Di.animationsStarted,
    animationsCompleted: Di.animationsCompleted,
    animationsCancelled: Di.animationsCancelled,
    activeAnimations: vt.size,
    customAnimations: _a.size,
    reducedMotionActive: !Xu()
  };
}
function mC() {
  const e = {
    webAnimationsSupported: typeof Element < "u" && typeof Element.prototype.animate == "function",
    noExcessiveActive: vt.size < 20,
    configValid: Jt.defaultDuration > 0
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    metrics: Ju(),
    reducedMotion: !Xu(),
    version: qu,
    moduleId: Wu,
    timestamp: Date.now()
  };
}
function vC() {
  return {
    moduleId: Wu,
    version: qu,
    config: Bg(),
    metrics: Ju(),
    activeAnimations: jg(),
    availableAnimations: Ug().length,
    reducedMotion: !Xu(),
    subscriberCount: _o.length,
    timestamp: Date.now()
  };
}
const P = {
  VERSION: qu,
  MODULE_ID: Wu,
  ANIMATIONS: Rr,
  EASINGS: Ku,
  animate: Xr,
  sequence: nC,
  parallel: sC,
  stagger: rC,
  transitionIn: $g,
  transitionOut: zg,
  crossfade: iC,
  cancel: oC,
  cancelAll: aC,
  pause: lC,
  resume: cC,
  pauseAll: uC,
  resumeAll: dC,
  getActive: jg,
  registerAnimation: pC,
  unregisterAnimation: fC,
  listAnimations: Ug,
  configure: hC,
  getConfig: Bg,
  subscribe: gC,
  getMetrics: Ju,
  healthCheck: mC,
  info: vC
};
function bt(e, t, n) {
  if (this._metrics = n, this.container = typeof e == "string" ? document.querySelector(e) : e, !this.container)
    throw new Error("Container not found");
  this.itemHeight = t.itemHeight || 50, this.itemWidth = t.itemWidth || null, this.overscan = t.overscan || 3, this.direction = t.direction || ts.VERTICAL, this.renderItem = t.renderItem, this.getItemKey = t.getItemKey || ((s, r) => r), this.onRangeChange = t.onRangeChange || null, this.items = [], this.scrollTop = 0, this.scrollLeft = 0, this.visibleStart = 0, this.visibleEnd = 0, this.renderedItems = /* @__PURE__ */ new Map(), this.pool = [], this.viewport = null, this.content = null, this.spacerBefore = null, this.spacerAfter = null, this._onScroll = this._onScroll.bind(this), this._onResize = this._onResize.bind(this), this._init(), this._metrics.instancesCreated++;
}
bt.prototype._init = function() {
  this.container.style.position = "relative", this.container.style.overflow = "auto", this.viewport = document.createElement("div"), this.viewport.className = "virtualizer-viewport", this.viewport.style.cssText = "position: relative; width: 100%; height: 100%;", this.content = document.createElement("div"), this.content.className = "virtualizer-content", this.content.style.cssText = "position: relative;", this.spacerBefore = document.createElement("div"), this.spacerBefore.className = "virtualizer-spacer-before", this.spacerBefore.style.cssText = "height: 0; pointer-events: none;", this.spacerAfter = document.createElement("div"), this.spacerAfter.className = "virtualizer-spacer-after", this.spacerAfter.style.cssText = "height: 0; pointer-events: none;", this.viewport.appendChild(this.spacerBefore), this.viewport.appendChild(this.content), this.viewport.appendChild(this.spacerAfter), this.container.appendChild(this.viewport), this.container.addEventListener("scroll", this._onScroll, { passive: !0 }), typeof ResizeObserver < "u" && (this._resizeObserver = new ResizeObserver(this._onResize), this._resizeObserver.observe(this.container));
};
bt.prototype._onScroll = function() {
  this.direction === ts.VERTICAL ? this.scrollTop = this.container.scrollTop : this.scrollLeft = this.container.scrollLeft, this._updateVisibleRange();
};
bt.prototype._onResize = function() {
  this._updateVisibleRange();
};
bt.prototype._updateVisibleRange = function() {
  const e = this.direction === ts.VERTICAL, t = e ? this.container.clientHeight : this.container.clientWidth, n = e ? this.scrollTop : this.scrollLeft, s = e ? this.itemHeight : this.itemWidth, r = this.items.length;
  let i = Math.floor(n / s), o = Math.min(Math.ceil((n + t) / s), r);
  i = Math.max(0, i - this.overscan), o = Math.min(r, o + this.overscan), (i !== this.visibleStart || o !== this.visibleEnd) && (this.visibleStart = i, this.visibleEnd = o, this._render(), this.onRangeChange && this.onRangeChange({ start: i, end: o }));
  const a = i * s, l = Math.max(0, (r - o) * s);
  e ? (this.spacerBefore.style.height = `${a}px`, this.spacerAfter.style.height = `${l}px`) : (this.spacerBefore.style.width = `${a}px`, this.spacerAfter.style.width = `${l}px`);
};
bt.prototype._render = function() {
  if (!this.renderItem) return;
  const e = this.direction === ts.VERTICAL, t = /* @__PURE__ */ new Map(), n = document.createDocumentFragment();
  for (let s = this.visibleStart; s < this.visibleEnd; s++) {
    const r = this.items[s], i = this.getItemKey(r, s);
    let o;
    this.renderedItems.has(i) ? (o = this.renderedItems.get(i), this.renderedItems.delete(i)) : this.pool.length > 0 ? (o = this.pool.pop(), this._metrics.recycledItems++) : (o = document.createElement("div"), o.className = "virtualizer-item", o.style.cssText = e ? `position: absolute; left: 0; right: 0; height: ${this.itemHeight}px;` : `position: absolute; top: 0; bottom: 0; width: ${this.itemWidth}px; display: inline-block;`);
    const a = s * (e ? this.itemHeight : this.itemWidth);
    e ? o.style.top = `${a}px` : o.style.left = `${a}px`;
    const l = this.renderItem(r, s, o);
    l !== void 0 && (typeof l == "string" ? o.innerHTML = l : l instanceof Node && (o.innerHTML = "", o.appendChild(l))), o.setAttribute("data-index", s), o.setAttribute("data-key", i), t.set(i, o), o.parentNode || (n.appendChild(o), this._metrics.itemsRendered++);
  }
  for (this.renderedItems.forEach(function(s) {
    s.parentNode && s.parentNode.removeChild(s), this.pool.push(s);
  }, this); this.pool.length > 50; )
    this.pool.shift();
  this.renderedItems = t, this.content.appendChild(n);
};
bt.prototype.setItems = function(e) {
  this.items = e || [];
  const t = this.direction === ts.VERTICAL, n = t ? this.itemHeight : this.itemWidth, s = this.items.length * n;
  t ? this.content.style.height = `${s}px` : this.content.style.width = `${s}px`, this._updateVisibleRange();
};
bt.prototype.scrollToIndex = function(e, t) {
  t = t || "start";
  const n = this.direction === ts.VERTICAL, s = n ? this.itemHeight : this.itemWidth, r = n ? this.container.clientHeight : this.container.clientWidth;
  let i = e * s;
  t === "center" ? i = i - r / 2 + s / 2 : t === "end" && (i = i - r + s), i = Math.max(0, i), n ? this.container.scrollTop = i : this.container.scrollLeft = i;
};
bt.prototype.scrollToItem = function(e, t) {
  for (let n = 0; n < this.items.length; n++)
    if (e(this.items[n], n))
      return this.scrollToIndex(n, t), !0;
  return !1;
};
bt.prototype.getVisibleRange = function() {
  return { start: this.visibleStart, end: this.visibleEnd };
};
bt.prototype.getVisibleItems = function() {
  return this.items.slice(this.visibleStart, this.visibleEnd);
};
bt.prototype.refresh = function() {
  this._updateVisibleRange();
};
bt.prototype.destroy = function() {
  this.container.removeEventListener("scroll", this._onScroll), this._resizeObserver && this._resizeObserver.disconnect(), this.viewport && this.viewport.parentNode && this.viewport.parentNode.removeChild(this.viewport), this.items = [], this.renderedItems.clear(), this.pool = [];
};
const Qu = "1.1.0-P2-ENTERPRISE", Zu = "app-shell-content-virtualizer", ts = Object.freeze({
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
}), an = /* @__PURE__ */ new Map();
let yC = 0;
const ks = {
  instancesCreated: 0,
  itemsRendered: 0,
  recycledItems: 0
};
function bC(e, t) {
  t = t || {};
  const n = `virt-${++yC}`, s = new bt(e, t, ks);
  return s.id = n, an.set(n, s), s;
}
function EC(e) {
  return an.get(e) || null;
}
function kC(e) {
  const t = an.get(e);
  return t ? (t.destroy(), an.delete(e), !0) : !1;
}
function SC() {
  let e = 0;
  return an.forEach((t) => {
    t.destroy(), e++;
  }), an.clear(), e;
}
function Fg() {
  const e = [];
  return an.forEach((t, n) => {
    e.push({
      id: n,
      itemCount: t.items.length,
      visibleRange: t.getVisibleRange()
    });
  }), e;
}
function ed() {
  return {
    instancesCreated: ks.instancesCreated,
    activeInstances: an.size,
    itemsRendered: ks.itemsRendered,
    recycledItems: ks.recycledItems
  };
}
function TC() {
  const e = {
    noExcessiveInstances: an.size < 10,
    poolEfficiency: ks.itemsRendered === 0 || ks.recycledItems / ks.itemsRendered > 0.1
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    metrics: ed(),
    version: Qu,
    moduleId: Zu,
    timestamp: Date.now()
  };
}
function wC() {
  return {
    moduleId: Zu,
    version: Qu,
    activeInstances: an.size,
    instances: Fg(),
    metrics: ed(),
    timestamp: Date.now()
  };
}
const Rt = {
  VERSION: Qu,
  MODULE_ID: Zu,
  SCROLL_DIRECTION: ts,
  create: bC,
  get: EC,
  destroy: kC,
  destroyAll: SC,
  listInstances: Fg,
  getMetrics: ed,
  healthCheck: TC,
  info: wC
}, td = "1.1.0-FIX-MISSING-EXPORTS", nd = "app-shell-notification-center", Hs = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  LOADING: "loading"
}), Vg = Object.freeze({
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center"
}), Gg = Object.freeze({
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
}), CC = 5e3, AC = 5, Ot = /* @__PURE__ */ new Map(), dr = { value: null }, pr = [], Jn = [], IC = { value: !1 }, _e = {
  position: "top-right",
  maxVisible: 5,
  defaultDuration: 5e3,
  animationDuration: 300,
  pauseOnHover: !0,
  stackSpacing: 12,
  showProgress: !0,
  groupSimilar: !0,
  soundEnabled: !1,
  queueOverflow: !0
}, Ln = {
  shown: 0,
  dismissed: 0,
  clicked: 0,
  expired: 0,
  queued: 0
};
function Jo(e) {
  Ln.hasOwnProperty(e) && Ln[e]++;
}
function sd(e, t) {
  for (let n = 0; n < pr.length; n++)
    try {
      pr[n](e, t);
    } catch {
    }
}
function DC() {
  return Object.assign({}, _e);
}
const nf = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  loading: "⏳"
};
function OC(e) {
  return nf[e] || nf.info;
}
function al(e) {
  return e ? e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
}
function xC(e, t) {
  const n = document.createElement("div");
  n.className = `shell-notification ${e.type}`, n.setAttribute("data-id", e.id), n.setAttribute("role", "alert");
  const s = [
    `<span class="shell-notification-icon">${OC(e.type)}</span>`,
    '<div class="shell-notification-content">'
  ];
  e.title && s.push(`<p class="shell-notification-title">${al(e.title)}</p>`), e.message && s.push(`<p class="shell-notification-message">${al(e.message)}</p>`), e.actions && e.actions.length > 0 && (s.push('<div class="shell-notification-actions">'), e.actions.forEach((i, o) => {
    s.push(`<button class="shell-notification-action${i.primary ? " primary" : ""}" data-action="${o}">${al(i.label)}</button>`);
  }), s.push("</div>")), s.push("</div>"), e.dismissible !== !1 && s.push('<button class="shell-notification-close" aria-label="Fechar">&times;</button>'), _e.showProgress && e.duration && e.type !== "loading" && s.push('<div class="shell-notification-progress" style="width: 100%;"></div>'), n.innerHTML = s.join("");
  const r = n.querySelector(".shell-notification-close");
  return r && r.addEventListener("click", (i) => {
    i.stopPropagation(), t(e.id);
  }), n.querySelectorAll(".shell-notification-action").forEach((i) => {
    i.addEventListener("click", (o) => {
      o.stopPropagation();
      const a = parseInt(i.getAttribute("data-action"), 10), l = e.actions[a];
      l && l.onClick && l.onClick(e), l && l.dismiss !== !1 && t(e.id);
    });
  }), e.onClick && (n.style.cursor = "pointer", n.addEventListener("click", () => {
    Ln.clicked++, e.onClick(e);
  })), _e.pauseOnHover && e.duration && (n.addEventListener("mouseenter", () => {
    e._paused = !0;
  }), n.addEventListener("mouseleave", () => {
    e._paused = !1;
  })), n;
}
const sf = "app-shell-notification-center";
function RC() {
  if (dr.value) return dr.value;
  if (typeof document > "u") return null;
  let e = document.getElementById(sf);
  return e || (e = document.createElement("div"), e.id = sf, e.className = `notification-center notification-center--${_e.position}`, e.setAttribute("role", "region"), e.setAttribute("aria-label", "Notifications"), document.body.appendChild(e)), dr.value = e, e;
}
function _C(e) {
  const t = RC();
  if (!t) return null;
  const n = xC(e, (s) => {
    const r = new CustomEvent("notification-dismiss", { detail: { id: s } });
    t.dispatchEvent(r);
  });
  return n.classList.add("notification--entering"), t.appendChild(n), n.offsetHeight, setTimeout(() => {
    n.classList.remove("notification--entering");
  }, _e.animationDuration || 300), n;
}
function LC(e) {
  e && (e.classList.add("notification--leaving"), setTimeout(() => {
    e.parentNode && e.parentNode.removeChild(e);
  }, _e.animationDuration || 300));
}
function Yg(e, t) {
  if (!e) return;
  const n = e.querySelector(".shell-notification-progress");
  n && (n.style.width = `${Math.max(0, Math.min(100, t))}%`);
}
let MC = 0;
function PC() {
  return `notif-${Date.now()}-${++MC}`;
}
function Jr(e) {
  e = e || {};
  const t = e.id || PC(), n = e.type || Hs.INFO, s = e.duration !== void 0 ? e.duration : CC, r = DC();
  if (Ot.size >= (r.maxVisible || AC)) {
    if (r.queueOverflow)
      return Jn.push({ id: t, options: e }), Jo("queued"), t;
    const a = Ot.keys().next().value;
    a && _r(a);
  }
  const i = {
    id: t,
    type: n,
    title: e.title || "",
    message: e.message || "",
    icon: e.icon || null,
    actions: e.actions || [],
    dismissible: e.dismissible !== !1,
    duration: s,
    progress: e.progress !== !1 && s > 0,
    createdAt: Date.now(),
    paused: !1,
    remaining: s,
    timerId: null,
    progressInterval: null
  }, o = _C(i);
  return i.element = o, Ot.set(t, i), Jo("shown"), s > 0 && NC(i), sd("show", { id: t, notification: i }), t;
}
function NC(e) {
  const t = Date.now(), n = e.remaining;
  e.progress && (e.progressInterval = setInterval(() => {
    if (e.paused) return;
    const s = Date.now() - t, r = Math.max(0, 100 - s / n * 100);
    Yg(e.element, r);
  }, 100)), e.timerId = setTimeout(() => {
    e.progressInterval && clearInterval(e.progressInterval), _r(e.id), Jo("expired");
  }, n);
}
function _r(e) {
  const t = Ot.get(e);
  if (!t) return !1;
  if (t.timerId && clearTimeout(t.timerId), t.progressInterval && clearInterval(t.progressInterval), LC(t.element), Ot.delete(e), Jo("dismissed"), sd("dismiss", { id: e }), Jn.length > 0) {
    const n = Jn.shift();
    Jr(n.options);
  }
  return !0;
}
function $C() {
  const e = Array.from(Ot.keys());
  for (let t = 0; t < e.length; t++)
    _r(e[t]);
  return Jn.length = 0, e.length;
}
function zC(e, t) {
  const n = Ot.get(e);
  if (!n) return !1;
  if (t.title !== void 0) {
    n.title = t.title;
    const s = n.element.querySelector(".notification-title");
    s && (s.textContent = t.title);
  }
  if (t.message !== void 0) {
    n.message = t.message;
    const s = n.element.querySelector(".notification-message");
    s && (s.textContent = t.message);
  }
  return t.type !== void 0 && (n.element.classList.remove(`notification--${n.type}`), n.type = t.type, n.element.classList.add(`notification--${t.type}`)), t.progress !== void 0 && n.progress && Yg(n.element, t.progress), sd("update", { id: e, updates: t }), !0;
}
function qg(e, t) {
  return Jr(Object.assign({ type: Hs.SUCCESS, message: e }, t || {}));
}
function jC(e, t) {
  return Jr(Object.assign({ type: Hs.WARNING, message: e }, t || {}));
}
function Wg(e, t) {
  return Jr(Object.assign({ type: Hs.ERROR, message: e, duration: 0 }, t || {}));
}
function Kg(e, t) {
  return Jr(Object.assign({
    type: Hs.LOADING,
    message: e,
    duration: 0,
    dismissible: !1
  }, t || {}));
}
function HC(e, t) {
  t = t || {};
  const n = Kg(t.loading || "Carregando...");
  return (typeof e == "function" ? e() : e).then((s) => (_r(n), t.success && qg(typeof t.success == "function" ? t.success(s) : t.success), s)).catch((s) => {
    throw _r(n), t.error && Wg(typeof t.error == "function" ? t.error(s) : t.error), s;
  });
}
function UC(e) {
  return Ot.get(e) || null;
}
function Xg() {
  const e = [];
  return Ot.forEach((t) => {
    e.push(t);
  }), e;
}
function BC(e) {
  const t = [];
  return Ot.forEach((n) => {
    n.type === e && t.push(n);
  }), t;
}
function FC() {
  return Jn.length;
}
function Jg() {
  dr.value && (dr.value.className = `shell-notification-container ${_e.position}`);
}
function VC(e) {
  e.position !== void 0 && (_e.position = e.position, Jg()), e.maxVisible !== void 0 && (_e.maxVisible = Math.max(1, e.maxVisible)), e.defaultDuration !== void 0 && (_e.defaultDuration = e.defaultDuration), e.animationDuration !== void 0 && (_e.animationDuration = e.animationDuration), e.pauseOnHover !== void 0 && (_e.pauseOnHover = !!e.pauseOnHover), e.showProgress !== void 0 && (_e.showProgress = !!e.showProgress), e.groupSimilar !== void 0 && (_e.groupSimilar = !!e.groupSimilar);
}
function Qg() {
  return Object.assign({}, _e);
}
function GC(e) {
  _e.position = e, Jg();
}
function YC(e) {
  return typeof e != "function" ? () => {
  } : (pr.push(e), function() {
    const t = pr.indexOf(e);
    t >= 0 && pr.splice(t, 1);
  });
}
function rd() {
  return {
    shown: Ln.shown,
    dismissed: Ln.dismissed,
    clicked: Ln.clicked,
    expired: Ln.expired,
    queued: Ln.queued,
    activeCount: Ot.size,
    queueSize: Jn.length
  };
}
function qC() {
  const e = {
    containerExists: !!dr.value,
    stylesInjected: IC.value,
    notOverloaded: Ot.size <= _e.maxVisible * 2,
    queueReasonable: Jn.length < 20
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    metrics: rd(),
    version: td,
    moduleId: nd,
    timestamp: Date.now()
  };
}
function rf() {
  return {
    moduleId: nd,
    version: td,
    config: Qg(),
    metrics: rd(),
    activeNotifications: Xg().length,
    queueSize: Jn.length,
    subscriberCount: pr.length,
    timestamp: Date.now()
  };
}
const G = {
  VERSION: td,
  MODULE_ID: nd,
  TYPES: Hs,
  POSITIONS: Vg,
  PRIORITIES: Gg,
  show: Jr,
  dismiss: _r,
  dismissAll: $C,
  update: zC,
  info: rf,
  success: qg,
  warning: jC,
  error: Wg,
  loading: Kg,
  promise: HC,
  get: UC,
  getAll: Xg,
  getByType: BC,
  getQueueSize: FC,
  configure: VC,
  getConfig: Qg,
  setPosition: GC,
  subscribe: YC,
  getMetrics: rd,
  healthCheck: qC,
  getInfo: rf
}, id = "1.0.0-AAA", od = "app-shell-keyboard-shortcuts", Zg = Object.freeze({
  CTRL: "ctrl",
  ALT: "alt",
  SHIFT: "shift",
  META: "meta"
}), Qr = Object.freeze({
  GLOBAL: "global",
  REGION: "region",
  MODAL: "modal",
  INPUT: "input"
}), Fs = Object.freeze({
  preventDefault: !0,
  stopPropagation: !0,
  allowInInputs: !1,
  debounceMs: 100,
  showHelp: !0,
  helpKey: "shift+?"
}), x = {
  shortcuts: /* @__PURE__ */ new Map(),
  groups: /* @__PURE__ */ new Map(),
  activeScope: Qr.GLOBAL,
  scopeStack: [],
  enabled: !0,
  subscribers: [],
  lastCombo: null,
  helpPanelOpen: !1,
  config: {
    preventDefault: Fs.preventDefault,
    stopPropagation: Fs.stopPropagation,
    allowInInputs: Fs.allowInInputs,
    debounceMs: Fs.debounceMs,
    showHelp: Fs.showHelp,
    helpKey: Fs.helpKey
  },
  metrics: {
    triggered: 0,
    blocked: 0,
    registered: 0
  }
};
function Et() {
  return x.shortcuts;
}
function Zr() {
  return x.groups;
}
function Ms() {
  return x.activeScope;
}
function Dl(e) {
  x.activeScope = e;
}
function em() {
  return x.scopeStack;
}
function La() {
  return x.enabled;
}
function tm(e) {
  x.enabled = !!e;
}
function Ma() {
  return x.subscribers;
}
function WC() {
  return x.lastCombo;
}
function of(e) {
  x.lastCombo = e;
}
function KC() {
  return x.helpPanelOpen;
}
function nm(e) {
  x.helpPanelOpen = !!e;
}
function Pa() {
  return x.config;
}
function XC(e) {
  e.preventDefault !== void 0 && (x.config.preventDefault = !!e.preventDefault), e.stopPropagation !== void 0 && (x.config.stopPropagation = !!e.stopPropagation), e.allowInInputs !== void 0 && (x.config.allowInInputs = !!e.allowInInputs), e.debounceMs !== void 0 && (x.config.debounceMs = Math.max(0, e.debounceMs)), e.showHelp !== void 0 && (x.config.showHelp = !!e.showHelp), e.helpKey !== void 0 && (x.config.helpKey = e.helpKey);
}
function JC() {
  return x.metrics;
}
function ad(e) {
  x.metrics[e] !== void 0 && x.metrics[e]++;
}
function QC() {
  x.shortcuts.clear(), x.groups.clear(), x.scopeStack.length = 0, x.subscribers.length = 0, x.activeScope = Qr.GLOBAL, x.enabled = !0, x.lastCombo = null, x.helpPanelOpen = !1;
}
const ZC = {
  control: "ctrl",
  command: "meta",
  cmd: "meta",
  option: "alt",
  esc: "escape",
  del: "delete",
  ins: "insert",
  pgup: "pageup",
  pgdn: "pagedown",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  " ": "space",
  spacebar: "space"
};
function sm(e) {
  return e ? (e = e.toLowerCase().trim(), ZC[e] || e) : "";
}
function ei(e) {
  if (!e) return null;
  const t = e.toLowerCase().split("+").map((r) => r.trim()), n = { ctrl: !1, alt: !1, shift: !1, meta: !1 };
  let s = null;
  for (let r = 0; r < t.length; r++) {
    const i = sm(t[r]);
    i === "ctrl" ? n.ctrl = !0 : i === "alt" ? n.alt = !0 : i === "shift" ? n.shift = !0 : i === "meta" ? n.meta = !0 : s = i;
  }
  return { modifiers: n, key: s };
}
function Us(e) {
  if (!e) return "";
  const t = [];
  return e.modifiers.ctrl && t.push("ctrl"), e.modifiers.alt && t.push("alt"), e.modifiers.shift && t.push("shift"), e.modifiers.meta && t.push("meta"), e.key && t.push(e.key), t.join("+");
}
function eA(e) {
  const t = {
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey
  }, n = sm(e.key);
  return ["ctrl", "alt", "shift", "meta", "control"].indexOf(n) >= 0 ? null : { modifiers: t, key: n };
}
function tA(e, t) {
  return !e || !t ? !1 : e.key === t.key && e.modifiers.ctrl === t.modifiers.ctrl && e.modifiers.alt === t.modifiers.alt && e.modifiers.shift === t.modifiers.shift && e.modifiers.meta === t.modifiers.meta;
}
function nA(e) {
  if (!e) return !1;
  const t = e.tagName.toLowerCase();
  return t === "input" || t === "textarea" || t === "select" || e.isContentEditable;
}
function rm(e) {
  if (!e || !e.combo || typeof e.handler != "function")
    return { ok: !1, error: "Invalid options" };
  const t = Et(), n = Zr(), s = ei(e.combo);
  if (!s || !s.key)
    return { ok: !1, error: `Invalid combo: ${e.combo}` };
  const r = Us(s);
  if (t.has(r) && !e.override)
    return { ok: !1, error: `Shortcut already registered: ${r}` };
  const i = {
    id: e.id || r,
    combo: r,
    parsed: s,
    handler: e.handler,
    scope: e.scope || "global",
    group: e.group || null,
    description: e.description || "",
    enabled: e.enabled !== !1,
    preventDefault: e.preventDefault !== !1,
    stopPropagation: e.stopPropagation || !1,
    allowInInput: e.allowInInput || !1,
    registeredAt: Date.now()
  };
  return t.set(r, i), i.group && (n.has(i.group) || n.set(i.group, /* @__PURE__ */ new Set()), n.get(i.group).add(r)), ad("registered"), { ok: !0, shortcut: i };
}
function sA(e) {
  const t = Et(), n = Zr(), s = ei(e), r = Us(s), i = t.get(r);
  return i ? (i.group && n.has(i.group) && n.get(i.group).delete(r), t.delete(r), { ok: !0 }) : { ok: !1, error: `Shortcut not found: ${r}` };
}
function rA(e) {
  const t = Et(), n = Zr(), s = n.get(e);
  if (!s)
    return { ok: !1, error: `Group not found: ${e}` };
  const r = [];
  return s.forEach((i) => {
    t.delete(i), r.push(i);
  }), n.delete(e), { ok: !0, removed: r };
}
function iA(e) {
  const t = [];
  for (let n = 0; n < e.length; n++)
    t.push(rm(e[n]));
  return t;
}
function oA(e) {
  const t = Et(), n = ei(e), s = Us(n);
  return t.get(s) || null;
}
function aA() {
  const e = Et(), t = [];
  return e.forEach((n) => {
    t.push(Object.assign({}, n));
  }), t;
}
function im(e) {
  const t = Et(), n = Zr().get(e);
  if (!n) return [];
  const s = [];
  return n.forEach((r) => {
    const i = t.get(r);
    i && s.push(Object.assign({}, i));
  }), s;
}
function ld() {
  const e = Zr(), t = [];
  return e.forEach((n, s) => {
    t.push({
      name: s,
      count: n.size
    });
  }), t;
}
function lA(e) {
  const t = Et(), n = ei(e), s = Us(n);
  return t.has(s);
}
function cA(e, t) {
  const n = Et(), s = ei(e), r = Us(s), i = n.get(r);
  return i ? (i.enabled = !!t, { ok: !0 }) : { ok: !1, error: `Shortcut not found: ${r}` };
}
function uA(e, t) {
  const n = em(), s = Ms();
  n.push(s), Dl(e), t && t({
    type: "scope-changed",
    scope: e,
    previousScope: s,
    timestamp: Date.now()
  });
}
function dA() {
  const e = em();
  return e.length > 0 ? Dl(e.pop()) : Dl(Qr.GLOBAL), Ms();
}
function pA() {
  return Ms();
}
function fA(e, t) {
  const n = ei(e);
  if (!n) return { ok: !1, error: "Invalid combo" };
  const s = Us(n), r = Et().get(s);
  if (!r) return { ok: !1, error: "Not found" };
  if (!r.enabled) return { ok: !1, error: "Disabled" };
  try {
    return r.handler(t || {}), ad("triggered"), { ok: !0 };
  } catch (i) {
    return { ok: !1, error: i.message };
  }
}
function om(e) {
  if (!La()) return;
  const t = eA(e);
  if (!t) return;
  const n = Us(t), s = Pa();
  if (WC() === n) return;
  of(n), setTimeout(() => {
    of(null);
  }, s.debounceMs);
  const r = nA(e.target), i = Ms(), o = Et();
  let a = null;
  if (o.forEach((l) => {
    l.enabled && tA(t, l.parsed) && (l.scope !== Qr.GLOBAL && l.scope !== i || r && !l.allowInInputs || (a = l));
  }), !!a) {
    a.preventDefault && e.preventDefault(), a.stopPropagation && e.stopPropagation();
    try {
      a.handler({ event: e, combo: n, shortcut: a }), ad("triggered");
      const l = Ma();
      for (let c = 0; c < l.length; c++)
        try {
          l[c]({
            type: "triggered",
            shortcut: a,
            timestamp: Date.now()
          });
        } catch {
        }
    } catch (l) {
      console.debug("%c[ERROR]%c [KeyboardShortcuts] Handler error:", "color:#ef4444;font-weight:bold", "color:inherit", l.message || l);
    }
  }
}
function hA() {
  typeof document < "u" && document.addEventListener("keydown", om);
}
function gA() {
  typeof document < "u" && document.removeEventListener("keydown", om);
}
function ll(e) {
  return e ? e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
}
function mA() {
  if (KC()) {
    Oi();
    return;
  }
  if (typeof document > "u") return;
  const e = document.createElement("div");
  e.id = "shell-shortcuts-help", e.style.cssText = [
    "position: fixed",
    "top: 50%",
    "left: 50%",
    "transform: translate(-50%, -50%)",
    "background: var(--bg-surface, #fff)",
    "border-radius: 12px",
    "box-shadow: 0 8px 32px rgba(0,0,0,0.2)",
    "padding: 24px",
    "z-index: 99999",
    "max-width: 600px",
    "max-height: 80vh",
    "overflow-y: auto",
    "font-family: system-ui, sans-serif"
  ].join(";");
  const t = ['<h2 style="margin: 0 0 16px 0; font-size: 18px;">Atalhos de Teclado</h2>'];
  ld().forEach((s) => {
    const r = im(s.name);
    r.length !== 0 && (t.push('<div style="margin-bottom: 16px;">'), t.push(`<h3 style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: capitalize;">${ll(s.name)}</h3>`), r.forEach((i) => {
      t.push('<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">'), t.push(`<span style="color: #333;">${ll(i.description || i.combo)}</span>`), t.push(`<kbd style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">${ll(i.combo.toUpperCase())}</kbd>`), t.push("</div>");
    }), t.push("</div>"));
  }), t.push('<button id="shell-shortcuts-help-close" style="margin-top: 16px; padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer;">Fechar</button>'), e.innerHTML = t.join("");
  const n = document.createElement("div");
  n.id = "shell-shortcuts-help-backdrop", n.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99998;", n.onclick = Oi, document.body.appendChild(n), document.body.appendChild(e), e.querySelector("#shell-shortcuts-help-close").onclick = Oi, nm(!0);
}
function Oi() {
  if (typeof document > "u") return;
  const e = document.getElementById("shell-shortcuts-help"), t = document.getElementById("shell-shortcuts-help-backdrop");
  e && e.parentNode.removeChild(e), t && t.parentNode.removeChild(t), nm(!1);
}
function cd() {
  const e = JC();
  return {
    triggered: e.triggered,
    blocked: e.blocked,
    registered: e.registered,
    activeShortcuts: Et().size,
    groups: Zr().size
  };
}
function vA() {
  const e = Et(), t = {
    enabled: La(),
    hasShortcuts: e.size > 0,
    noExcessiveShortcuts: e.size < 100,
    scopeValid: !!Ms()
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    activeScope: Ms(),
    metrics: cd(),
    version: id,
    moduleId: od,
    timestamp: Date.now()
  };
}
function yA() {
  return {
    moduleId: od,
    version: id,
    enabled: La(),
    activeScope: Ms(),
    config: Object.assign({}, Pa()),
    metrics: cd(),
    groups: ld(),
    shortcutCount: Et().size,
    subscriberCount: Ma().length,
    timestamp: Date.now()
  };
}
function bA(e) {
  const t = Ma();
  for (let n = 0; n < t.length; n++)
    try {
      t[n](e);
    } catch {
    }
}
function am(e, t, n) {
  return rm(e);
}
function EA(e) {
  return iA(e);
}
function kA(e) {
  return uA(e, bA);
}
function SA() {
  tm(!0);
}
function TA() {
  tm(!1);
}
function wA() {
  return La();
}
function CA(e, t) {
  return cA(e, t);
}
function AA(e) {
  XC(e);
}
function IA() {
  return Object.assign({}, Pa());
}
function DA(e) {
  if (typeof e != "function") return () => {
  };
  const t = Ma();
  return t.push(e), () => {
    const n = t.indexOf(e);
    n >= 0 && t.splice(n, 1);
  };
}
function OA() {
  gA(), Oi(), QC();
}
function xA() {
  return ld();
}
if (typeof document < "u") {
  hA();
  const e = Pa();
  e.showHelp && e.helpKey && am(e.helpKey);
}
const D = {
  VERSION: id,
  MODULE_ID: od,
  MODIFIER_KEYS: Zg,
  SCOPES: Qr,
  // Registration
  register: am,
  unregister: sA,
  unregisterGroup: rA,
  registerMany: EA,
  // Scope
  setScope: kA,
  restoreScope: dA,
  getScope: pA,
  // Enable/Disable
  enable: SA,
  disable: TA,
  isEnabled: wA,
  setEnabled: CA,
  // Queries
  get: oA,
  getAll: aA,
  getByGroup: im,
  getGroups: xA,
  isRegistered: lA,
  // Trigger
  trigger: fA,
  // Help
  showHelp: mA,
  hideHelp: Oi,
  // Config
  configure: AA,
  getConfig: IA,
  // Subscription
  subscribe: DA,
  // Lifecycle
  destroy: OA,
  // Health
  getMetrics: cd,
  healthCheck: vA,
  info: yA
}, ud = "1.0.0-AAA", dd = "app-shell-gesture-handler", N = Object.freeze({
  TAP: "tap",
  DOUBLE_TAP: "doubletap",
  LONG_PRESS: "longpress",
  SWIPE_LEFT: "swipeleft",
  SWIPE_RIGHT: "swiperight",
  SWIPE_UP: "swipeup",
  SWIPE_DOWN: "swipedown",
  PINCH_IN: "pinchin",
  PINCH_OUT: "pinchout",
  ROTATE: "rotate",
  PAN: "pan"
}), Qt = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down"
}), Ht = /* @__PURE__ */ new Map(), Ss = /* @__PURE__ */ new Map();
let lm = !0;
const Ts = [];
function cm(e) {
  lm = e;
}
function ti() {
  return lm;
}
const b = {
  startX: 0,
  startY: 0,
  startTime: 0,
  lastTapTime: 0,
  lastTapX: 0,
  lastTapY: 0,
  isMultiTouch: !1,
  initialDistance: 0,
  initialAngle: 0,
  longPressTimer: null,
  isPanning: !1
}, I = {
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  tapThreshold: 10,
  doubleTapDelay: 300,
  longPressDelay: 500,
  pinchThreshold: 0.1,
  rotateThreshold: 15,
  preventDefaultSwipe: !0,
  passive: !1
}, is = {
  gesturesDetected: 0,
  swipes: 0,
  taps: 0,
  longPresses: 0,
  pinches: 0
};
function Yi(e) {
  is.hasOwnProperty(e) && is[e]++;
}
function pd() {
  return {
    gesturesDetected: is.gesturesDetected,
    swipes: is.swipes,
    taps: is.taps,
    longPresses: is.longPresses,
    pinches: is.pinches,
    activeHandlers: Ht.size,
    elementHandlers: Ss.size
  };
}
function Ge(e, t) {
  return Ht.has(e) || Ht.set(e, /* @__PURE__ */ new Set()), Ht.get(e).add(t), () => {
    fd(e, t);
  };
}
function fd(e, t) {
  const n = Ht.get(e);
  n && n.delete(t);
}
function RA(e, t) {
  const n = (s) => {
    fd(e, n), t(s);
  };
  return Ge(e, n);
}
function _A(e) {
  e ? Ht.delete(e) : Ht.clear();
}
function LA(e, t, n) {
  const s = typeof e == "string" ? document.querySelector(e) : e;
  if (!s) return null;
  const r = s;
  Ss.has(r) || (Ss.set(r, /* @__PURE__ */ new Map()), s.addEventListener("touchstart", (o) => {
  }, { passive: !I.preventDefaultSwipe }), s.addEventListener("touchmove", (o) => {
  }, { passive: !I.preventDefaultSwipe }), s.addEventListener("touchend", (o) => {
  }, { passive: !0 }));
  const i = Ss.get(r);
  return i.has(t) || i.set(t, /* @__PURE__ */ new Set()), i.get(t).add(n), function() {
    um(s, t, n);
  };
}
function um(e, t, n) {
  const s = typeof e == "string" ? document.querySelector(e) : e;
  if (!s) return;
  const r = Ss.get(s);
  if (!r) return;
  const i = r.get(t);
  i && i.delete(n);
}
function MA(e) {
  const t = [
    Ge(N.SWIPE_LEFT, e),
    Ge(N.SWIPE_RIGHT, e),
    Ge(N.SWIPE_UP, e),
    Ge(N.SWIPE_DOWN, e)
  ];
  return function() {
    t.forEach((n) => {
      n();
    });
  };
}
function PA(e) {
  return Ge(N.SWIPE_LEFT, e);
}
function NA(e) {
  return Ge(N.SWIPE_RIGHT, e);
}
function $A(e) {
  return Ge(N.SWIPE_UP, e);
}
function zA(e) {
  return Ge(N.SWIPE_DOWN, e);
}
function jA(e) {
  return Ge(N.TAP, e);
}
function HA(e) {
  return Ge(N.DOUBLE_TAP, e);
}
function UA(e) {
  return Ge(N.LONG_PRESS, e);
}
function BA(e) {
  const t = [
    Ge(N.PINCH_IN, e),
    Ge(N.PINCH_OUT, e)
  ];
  return function() {
    t.forEach((n) => {
      n();
    });
  };
}
function FA(e) {
  return Ge(N.PAN, e);
}
function dm(e, t) {
  const n = t.clientX - e.clientX, s = t.clientY - e.clientY;
  return Math.sqrt(n * n + s * s);
}
function pm(e, t) {
  const n = t.clientX - e.clientX, s = t.clientY - e.clientY;
  return Math.atan2(s, n) * 180 / Math.PI;
}
function VA(e, t) {
  const n = Math.abs(e), s = Math.abs(t);
  return n > s ? e > 0 ? Qt.RIGHT : Qt.LEFT : t > 0 ? Qt.DOWN : Qt.UP;
}
function GA(e) {
  for (let t = 0; t < Ts.length; t++)
    try {
      Ts[t](e);
    } catch {
    }
}
function ws(e, t) {
  const n = Ht.get(e);
  n && (n.forEach((s) => {
    try {
      s(t);
    } catch {
    }
  }), Yi("gesturesDetected"), GA({
    type: "gesture-detected",
    gesture: e,
    data: t,
    timestamp: Date.now()
  }));
}
function fm(e) {
  if (!ti()) return;
  const t = e.touches;
  b.startTime = Date.now(), b.startX = t[0].clientX, b.startY = t[0].clientY, b.isPanning = !1, t.length === 2 ? (b.isMultiTouch = !0, b.initialDistance = dm(t[0], t[1]), b.initialAngle = pm(t[0], t[1])) : b.isMultiTouch = !1, b.longPressTimer = setTimeout(() => {
    const n = Math.abs(t[0].clientX - b.startX), s = Math.abs(t[0].clientY - b.startY);
    n < I.tapThreshold && s < I.tapThreshold && (ws(N.LONG_PRESS, {
      x: b.startX,
      y: b.startY,
      target: e.target,
      originalEvent: e
    }), Yi("longPresses"));
  }, I.longPressDelay);
}
function hm(e) {
  if (!ti()) return;
  const t = e.touches;
  if (b.longPressTimer) {
    const n = Math.abs(t[0].clientX - b.startX), s = Math.abs(t[0].clientY - b.startY);
    (n > I.tapThreshold || s > I.tapThreshold) && (clearTimeout(b.longPressTimer), b.longPressTimer = null);
  }
  if (b.isMultiTouch && t.length === 2) {
    const n = dm(t[0], t[1]), s = pm(t[0], t[1]), r = n / b.initialDistance;
    if (Math.abs(r - 1) > I.pinchThreshold) {
      const o = r > 1 ? N.PINCH_OUT : N.PINCH_IN;
      ws(o, {
        scale: r,
        center: {
          x: (t[0].clientX + t[1].clientX) / 2,
          y: (t[0].clientY + t[1].clientY) / 2
        },
        originalEvent: e
      }), Yi("pinches");
    }
    const i = s - b.initialAngle;
    Math.abs(i) > I.rotateThreshold && ws(N.ROTATE, {
      angle: i,
      center: {
        x: (t[0].clientX + t[1].clientX) / 2,
        y: (t[0].clientY + t[1].clientY) / 2
      },
      originalEvent: e
    }), I.preventDefaultSwipe && e.preventDefault();
  }
  if (t.length === 1 && !b.isMultiTouch) {
    const n = t[0].clientX - b.startX, s = t[0].clientY - b.startY;
    (Math.abs(n) > I.tapThreshold || Math.abs(s) > I.tapThreshold) && (b.isPanning = !0, ws(N.PAN, {
      deltaX: n,
      deltaY: s,
      x: t[0].clientX,
      y: t[0].clientY,
      originalEvent: e
    }));
  }
}
function gm(e) {
  if (!ti()) return;
  b.longPressTimer && (clearTimeout(b.longPressTimer), b.longPressTimer = null);
  const t = e.changedTouches, n = t[0].clientX, s = t[0].clientY, r = Date.now(), i = n - b.startX, o = s - b.startY, a = r - b.startTime, l = Math.abs(i), c = Math.abs(o), u = Math.max(l, c) / a;
  if ((l > I.swipeThreshold || c > I.swipeThreshold) && u > I.swipeVelocity) {
    const h = VA(i, o);
    let E;
    switch (h) {
      case Qt.LEFT:
        E = N.SWIPE_LEFT;
        break;
      case Qt.RIGHT:
        E = N.SWIPE_RIGHT;
        break;
      case Qt.UP:
        E = N.SWIPE_UP;
        break;
      case Qt.DOWN:
        E = N.SWIPE_DOWN;
        break;
    }
    E && (ws(E, {
      direction: h,
      distance: Math.max(l, c),
      velocity: u,
      startX: b.startX,
      startY: b.startY,
      endX: n,
      endY: s,
      duration: a,
      originalEvent: e
    }), Yi("swipes"));
  } else if (l < I.tapThreshold && c < I.tapThreshold && !b.isPanning) {
    const h = Date.now(), E = Math.abs(n - b.lastTapX), v = Math.abs(s - b.lastTapY);
    h - b.lastTapTime < I.doubleTapDelay && E < I.tapThreshold * 2 && v < I.tapThreshold * 2 ? (ws(N.DOUBLE_TAP, {
      x: n,
      y: s,
      target: e.target,
      originalEvent: e
    }), b.lastTapTime = 0) : (b.lastTapTime = h, b.lastTapX = n, b.lastTapY = s, setTimeout(() => {
      b.lastTapTime === h && (ws(N.TAP, {
        x: n,
        y: s,
        target: e.target,
        originalEvent: e
      }), Yi("taps"));
    }, I.doubleTapDelay));
  }
  b.isMultiTouch = !1, b.isPanning = !1;
}
function YA() {
  cm(!0);
}
function qA() {
  cm(!1);
}
function WA(e) {
  e.swipeThreshold !== void 0 && (I.swipeThreshold = e.swipeThreshold), e.swipeVelocity !== void 0 && (I.swipeVelocity = e.swipeVelocity), e.tapThreshold !== void 0 && (I.tapThreshold = e.tapThreshold), e.doubleTapDelay !== void 0 && (I.doubleTapDelay = e.doubleTapDelay), e.longPressDelay !== void 0 && (I.longPressDelay = e.longPressDelay), e.pinchThreshold !== void 0 && (I.pinchThreshold = e.pinchThreshold), e.rotateThreshold !== void 0 && (I.rotateThreshold = e.rotateThreshold), e.preventDefaultSwipe !== void 0 && (I.preventDefaultSwipe = !!e.preventDefaultSwipe);
}
function mm() {
  return Object.assign({}, I);
}
function KA(e) {
  return typeof e != "function" ? () => {
  } : (Ts.push(e), () => {
    const t = Ts.indexOf(e);
    t >= 0 && Ts.splice(t, 1);
  });
}
function XA() {
  const e = typeof window < "u" && ("ontouchstart" in window || navigator.maxTouchPoints > 0), t = {
    enabled: ti(),
    touchSupported: e,
    hasHandlers: Ht.size > 0 || Ss.size > 0,
    configValid: I.swipeThreshold > 0
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    isTouchDevice: e,
    metrics: pd(),
    version: ud,
    moduleId: dd,
    timestamp: Date.now()
  };
}
function JA() {
  const e = typeof window < "u" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return {
    moduleId: dd,
    version: ud,
    enabled: ti(),
    isTouchDevice: e,
    config: mm(),
    metrics: pd(),
    registeredGestures: Array.from(Ht.keys()),
    subscriberCount: Ts.length,
    timestamp: Date.now()
  };
}
function QA() {
  typeof document < "u" && (document.removeEventListener("touchstart", fm), document.removeEventListener("touchmove", hm), document.removeEventListener("touchend", gm)), Ht.clear(), Ss.clear(), Ts.length = 0, b.longPressTimer && clearTimeout(b.longPressTimer);
}
typeof document < "u" && (document.addEventListener("touchstart", fm, { passive: !I.preventDefaultSwipe }), document.addEventListener("touchmove", hm, { passive: !I.preventDefaultSwipe }), document.addEventListener("touchend", gm, { passive: !0 }));
const O = {
  VERSION: ud,
  MODULE_ID: dd,
  GESTURES: N,
  DIRECTIONS: Qt,
  on: Ge,
  off: fd,
  once: RA,
  offAll: _A,
  addToElement: LA,
  removeFromElement: um,
  onSwipe: MA,
  onSwipeLeft: PA,
  onSwipeRight: NA,
  onSwipeUp: $A,
  onSwipeDown: zA,
  onTap: jA,
  onDoubleTap: HA,
  onLongPress: UA,
  onPinch: BA,
  onPan: FA,
  enable: YA,
  disable: qA,
  isEnabled: ti,
  configure: WA,
  getConfig: mm,
  subscribe: KA,
  destroy: QA,
  getMetrics: pd,
  healthCheck: XA,
  info: JA
}, hd = "2.0.0-P2-ENTERPRISE", gd = "app-shell-command-palette", Vt = { ACTION: "action", NAVIGATION: "navigation", SEARCH: "search", SETTING: "setting", DEBUG: "debug" }, ZA = "dsd-command-palette", eI = "dsd-command-overlay", vm = "app-shell-command-palette-recent", ot = /* @__PURE__ */ new Map();
let dt = [], ni = !1, Sn = 0, Ws = "", Cs = [], Tt = null, gn = null, qi = !1, Lo = [], ln = { opens: 0, executions: 0, searches: 0, errors: 0 };
const Xe = { hotkey: "ctrl+k", maxRecent: 10, maxResults: 15, placeholder: "Digite um comando...", showRecent: !0, showIcons: !0, fuzzySearch: !0, groupByType: !0, persistRecent: !0 };
function tI(e, t) {
  return Yt.icon(e, t);
}
function nI(e) {
  return {
    "toggle-theme": "sun",
    "toggle-sidebar": "sidebar",
    "open-debug-panel": "tool",
    "health-check": "activity",
    "export-config": "download",
    "show-info": "info",
    "clear-cache": "trash",
    fullscreen: "maximize"
  }[e.id] || "terminal";
}
function sI() {
  if (Xe.persistRecent)
    try {
      const e = localStorage.getItem(vm);
      e && (dt = JSON.parse(e).slice(0, Xe.maxRecent));
    } catch {
    }
}
function ym() {
  if (Xe.persistRecent)
    try {
      localStorage.setItem(vm, JSON.stringify(dt.slice(0, Xe.maxRecent)));
    } catch {
    }
}
function bm(e) {
  dt = dt.filter((t) => t !== e), dt.unshift(e), dt.length > Xe.maxRecent && (dt = dt.slice(0, Xe.maxRecent)), ym();
}
function Na(e, t) {
  Lo.forEach((n) => {
    try {
      n(e, t);
    } catch {
    }
  });
}
function Em(e) {
  Ws = e.toLowerCase().trim(), ln.searches++, Ws ? Cs = Array.from(ot.values()).filter((t) => {
    if (t.visible === !1) return !1;
    const n = `${t.title} ${t.description || ""} ${(t.keywords || []).join(" ")}`.toLowerCase();
    return Xe.fuzzySearch ? Ws.split("").every((s) => n.includes(s)) : n.includes(Ws);
  }).sort((t, n) => (n.priority || 0) - (t.priority || 0)).slice(0, Xe.maxResults) : Xe.showRecent && dt.length > 0 ? Cs = dt.map((t) => ot.get(t)).filter(Boolean).slice(0, Xe.maxResults) : Cs = Array.from(ot.values()).filter((t) => t.visible !== !1).sort((t, n) => (n.priority || 0) - (t.priority || 0)).slice(0, Xe.maxResults), Sn = 0;
}
function km() {
  const e = Cs[Sn];
  if (e)
    try {
      typeof e.handler == "function" && e.handler(), bm(e.id), ln.executions++, Na("execute", { command: e.id }), si();
    } catch (t) {
      ln.errors++, console.debug("%c[ERROR]%c [CommandPalette] Execute error:", "color:#ef4444;font-weight:bold", "color:inherit", t.message || t);
    }
}
function Sm(e) {
  if (ni)
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault(), Sn = Math.min(Sn + 1, Cs.length - 1), Wi();
        break;
      case "ArrowUp":
        e.preventDefault(), Sn = Math.max(Sn - 1, 0), Wi();
        break;
      case "Enter":
        e.preventDefault(), km();
        break;
      case "Escape":
        e.preventDefault(), si();
        break;
    }
}
function Tm(e) {
  (e.ctrlKey || e.metaKey) && e.key === "k" && (e.preventDefault(), Im());
}
function wm() {
  if (typeof document > "u") return;
  const e = "dsd-panel-ui-css";
  if (document.getElementById(e)) return;
  const t = document.createElement("link");
  t.id = e, t.rel = "stylesheet", t.href = "/components/app-shell/styles/_panel-ui.css", document.head.appendChild(t);
}
function Wi() {
  if (!Tt) return;
  const e = Cs.length === 0 ? '<div class="dsd-ui-empty">Nenhum comando encontrado</div>' : Cs.map((n, s) => {
    const r = s === Sn ? " selected" : "", i = nI(n), o = n.shortcut ? `<div class="dsd-ui-command-item__shortcut"><kbd class="dsd-ui-kbd">${n.shortcut}</kbd></div>` : "";
    return `<div class="dsd-ui-command-item${r}" data-index="${s}"><div class="dsd-ui-command-item__icon">${tI(i, 20)}</div><div class="dsd-ui-command-item__content"><div class="dsd-ui-command-item__title">${n.title}</div>${n.description ? `<div class="dsd-ui-command-item__desc">${n.description}</div>` : ""}</div>${o}</div>`;
  }).join("");
  Tt.innerHTML = `<div class="dsd-ui-header" style="padding:var(--ui-space-sm) var(--ui-space-md)"><input type="text" class="dsd-ui-input" id="dsd-command-input" placeholder="${Xe.placeholder}" value="${Ws}" autocomplete="off" /></div><div class="dsd-ui-command-list">${e}</div><div style="display:flex;justify-content:center;gap:var(--ui-space-md);padding:var(--ui-space-sm);border-top:1px solid var(--ui-border);font-size:10px;color:var(--ui-text-muted)"><span><kbd class="dsd-ui-kbd">↑↓</kbd> navegar</span><span><kbd class="dsd-ui-kbd">Enter</kbd> executar</span><span><kbd class="dsd-ui-kbd">Esc</kbd> fechar</span></div>`;
  const t = Tt.querySelector("#dsd-command-input");
  t && (t.focus(), t.oninput = (n) => {
    Em(n.target.value), Wi();
  }), Tt.querySelectorAll(".dsd-ui-command-item").forEach((n) => {
    n.onclick = () => {
      Sn = parseInt(n.getAttribute("data-index"), 10), km();
    }, n.onmouseenter = () => {
      Sn = parseInt(n.getAttribute("data-index"), 10), Wi();
    };
  });
}
function rI() {
  [
    { id: "toggle-theme", title: "Alternar tema claro/escuro", type: Vt.SETTING, shortcut: "Alt+T", handler() {
      const e = window.AppShell;
      e && e.theme && e.theme.toggleTheme();
    }, priority: 100 },
    { id: "toggle-sidebar", title: "Alternar sidebar", type: Vt.ACTION, handler() {
      const e = window.AppShell;
      e && e.layoutPrefs && e.layoutPrefs.toggleSidebar();
    }, priority: 90 },
    { id: "open-debug-panel", title: "Abrir Debug Panel", type: Vt.DEBUG, shortcut: "Alt+F12", handler() {
      const e = window.AppShell;
      e && e.debugPanel && e.debugPanel.open();
    }, priority: 85 },
    { id: "health-check", title: "Executar Health Check", type: Vt.DEBUG, handler() {
      const e = window.AppShell;
      if (e) {
        const t = e.healthCheck();
        console.log("Health:", t);
      }
    }, priority: 80 },
    { id: "export-config", title: "Exportar configuração", type: Vt.ACTION, handler() {
      const e = window.AppShell;
      e && e.configExporter && e.configExporter.exportToFile();
    }, priority: 70 },
    { id: "show-info", title: "Mostrar informações do sistema", type: Vt.DEBUG, handler() {
      const e = window.AppShell;
      e && console.log("Info:", e.info());
    }, priority: 65 },
    { id: "clear-cache", title: "Limpar cache de regiões", type: Vt.ACTION, handler() {
      const e = window.AppShell;
      e && e.cache && e.cache.clear();
    }, priority: 60 },
    { id: "fullscreen", title: "Entrar em tela cheia", type: Vt.ACTION, handler() {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    }, priority: 50 }
  ].forEach((e) => {
    ot.has(e.id) || ot.set(e.id, e);
  });
}
function Ol() {
  return qi ? !0 : typeof document > "u" ? !1 : (wm(), sI(), rI(), document.addEventListener("keydown", Tm), document.addEventListener("keydown", Sm), qi = !0, !0);
}
function Cm(e) {
  return !e || !e.id || !e.title ? !1 : (ot.set(e.id, e), !0);
}
function iI(e) {
  return e.map(Cm).filter(Boolean).length;
}
function oI(e) {
  return ot.delete(e);
}
function aI(e) {
  const t = ot.get(e);
  if (!t || typeof t.handler != "function") return !1;
  try {
    return t.handler(), bm(e), ln.executions++, Na("execute", { command: e }), !0;
  } catch {
    return ln.errors++, !1;
  }
}
function Am() {
  return typeof document > "u" ? !1 : (wm(), gn || (gn = document.createElement("div"), gn.id = eI, gn.className = "dsd-ui-overlay", gn.onclick = si, document.body.appendChild(gn)), gn.classList.add("visible"), Tt || (Tt = document.createElement("div"), Tt.id = ZA, Tt.className = "dsd-ui-panel dsd-ui-panel--command", document.body.appendChild(Tt)), ni = !0, Ws = "", Em(""), Tt.style.display = "flex", Wi(), ln.opens++, Na("show", {}), !0);
}
function si() {
  return gn && gn.classList.remove("visible"), Tt && (Tt.style.display = "none"), ni = !1, Na("hide", {}), !0;
}
function Im() {
  return ni ? si() : Am();
}
function lI() {
  return ni;
}
function cI(e) {
  return ot.get(e);
}
function Dm() {
  return Array.from(ot.values());
}
function uI(e) {
  return Dm().filter((t) => t.type === e);
}
function dI() {
  return dt.map((e) => ot.get(e)).filter(Boolean);
}
function pI() {
  dt = [], ym();
}
function fI(e) {
  Object.assign(Xe, e);
}
function hI() {
  return { ...Xe };
}
function gI(e) {
  return typeof e == "function" && Lo.push(e), () => {
    Lo = Lo.filter((t) => t !== e);
  };
}
function mI() {
  return { ...ln };
}
function vI() {
  const e = { initialized: qi, commandsRegistered: ot.size > 0, noErrors: ln.errors === 0 }, t = Object.values(e).filter(Boolean).length;
  return { status: t === 3 ? "HEALTHY" : "DEGRADED", score: `${t}/3`, checks: e, commandCount: ot.size, metrics: ln, version: hd, moduleId: gd, timestamp: Date.now() };
}
function yI() {
  return { moduleId: gd, version: hd, initialized: qi, isVisible: ni, commandCount: ot.size, recentCount: dt.length, config: Xe, metrics: ln, timestamp: Date.now() };
}
function bI() {
  typeof document < "u" && (document.removeEventListener("keydown", Tm), document.removeEventListener("keydown", Sm)), si(), qi = !1;
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  Ol();
}) : Ol());
const Q = { VERSION: hd, MODULE_ID: gd, COMMAND_TYPES: Vt, init: Ol, destroy: bI, register: Cm, registerMany: iI, unregister: oI, execute: aI, show: Am, hide: si, toggle: Im, isVisible: lI, getCommand: cI, getAllCommands: Dm, getCommandsByType: uI, getRecentCommands: dI, clearRecent: pI, configure: fI, getConfig: hI, subscribe: gI, getMetrics: mI, healthCheck: vI, info: yI }, md = "1.1.0-P2-ENTERPRISE", vd = "app-shell-layout-presets", $a = Object.freeze({
  DEFAULT: "default",
  COMPACT: "compact",
  EXPANDED: "expanded",
  FOCUS: "focus",
  DASHBOARD: "dashboard",
  PRESENTATION: "presentation",
  MOBILE: "mobile"
}), Bn = {
  default: {
    name: "Default",
    regions: {
      header: { visible: !0, height: "60px" },
      sidebar: { visible: !0, width: "280px", collapsed: !1 },
      "nav-rail": { visible: !0, width: "72px" },
      main: { visible: !0 },
      footer: { visible: !0, height: "40px" },
      ticker: { visible: !1 }
    },
    cssVars: {}
  },
  compact: {
    name: "Compact",
    regions: {
      header: { visible: !0, height: "48px" },
      sidebar: { visible: !0, width: "200px", collapsed: !0 },
      "nav-rail": { visible: !0, width: "56px" },
      main: { visible: !0 },
      footer: { visible: !1 },
      ticker: { visible: !1 }
    },
    cssVars: { "--spacing-base": "8px" }
  },
  expanded: {
    name: "Expanded",
    regions: {
      header: { visible: !0, height: "72px" },
      sidebar: { visible: !0, width: "360px", collapsed: !1 },
      "nav-rail": { visible: !0, width: "80px" },
      main: { visible: !0 },
      footer: { visible: !0, height: "48px" },
      ticker: { visible: !0, height: "32px" }
    },
    cssVars: { "--spacing-base": "16px" }
  },
  focus: {
    name: "Focus Mode",
    regions: {
      header: { visible: !1 },
      sidebar: { visible: !1 },
      "nav-rail": { visible: !1 },
      main: { visible: !0, fullscreen: !0 },
      footer: { visible: !1 },
      ticker: { visible: !1 }
    },
    cssVars: {}
  },
  dashboard: {
    name: "Dashboard",
    regions: {
      header: { visible: !0, height: "56px", fixed: !0 },
      sidebar: { visible: !0, width: "240px", collapsed: !1 },
      "nav-rail": { visible: !1 },
      main: { visible: !0 },
      footer: { visible: !1 },
      ticker: { visible: !0, height: "28px" }
    },
    cssVars: {}
  },
  presentation: {
    name: "Presentation",
    regions: {
      header: { visible: !1 },
      sidebar: { visible: !1 },
      "nav-rail": { visible: !1 },
      main: { visible: !0, fullscreen: !0 },
      footer: { visible: !1 },
      ticker: { visible: !1 }
    },
    cssVars: { "--content-max-width": "100%" }
  },
  mobile: {
    name: "Mobile",
    regions: {
      header: { visible: !0, height: "56px", fixed: !0 },
      sidebar: { visible: !1, overlay: !0 },
      "nav-rail": { visible: !1 },
      main: { visible: !0 },
      footer: { visible: !0, height: "56px", fixed: !0 },
      ticker: { visible: !1 }
    },
    cssVars: { "--spacing-base": "12px" }
  }
};
function EI(e, t) {
  const n = document.getElementById(e) || document.querySelector(`[data-region="${e}"]`);
  return n ? (t.visible !== void 0 && (n.style.display = t.visible ? "" : "none"), t.width && (n.style.width = t.width), t.height && (n.style.height = t.height), t.collapsed ? n.classList.add("collapsed") : n.classList.remove("collapsed"), t.overlay ? n.classList.add("overlay") : n.classList.remove("overlay"), t.fixed ? n.classList.add("fixed") : n.classList.remove("fixed"), t.fullscreen ? n.classList.add("fullscreen") : n.classList.remove("fullscreen"), !0) : !1;
}
function kI(e) {
  const t = document.documentElement, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t.style.setProperty(n[s], e[n[s]]);
}
function SI(e) {
  const t = document.documentElement, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t.style.removeProperty(n[s]);
}
function Ki(e, t) {
  return Bn[e] ? Bn[e] : t.has(e) ? t.get(e) : null;
}
function TI(e, t, n) {
  t = t || {};
  const s = Ki(e, n.customPresets);
  if (!s) return { ok: !1, error: `Unknown preset: ${e}` };
  const r = n.currentPreset, i = Ki(r, n.customPresets);
  i && i.cssVars && SI(i.cssVars), typeof document < "u" && t.animate !== !1 && (document.body.classList.add("shell-layout-transitioning"), document.body.style.setProperty("--shell-transition-duration", `${n.transitionDuration}ms`));
  const o = Object.keys(s.regions);
  for (let a = 0; a < o.length; a++)
    EI(o[a], s.regions[o[a]]);
  if (s.cssVars && kI(s.cssVars), n.previousPreset = r, n.currentPreset = e, n.metrics.presetChanges++, typeof document < "u") {
    document.body.setAttribute("data-layout-preset", e);
    const a = n.transitionDuration;
    setTimeout(() => {
      document.body.classList.remove("shell-layout-transitioning");
    }, a);
  }
  return n.notify({
    type: "preset-changed",
    from: r,
    to: e,
    config: s,
    timestamp: Date.now()
  }), { ok: !0, preset: e, previous: r };
}
function Om(e, t, n) {
  return Bn[e] ? { ok: !1, error: "Cannot override built-in preset" } : t.regions ? (n.customPresets.set(e, {
    name: t.name || e,
    description: t.description || "",
    regions: t.regions,
    cssVars: t.cssVars || {}
  }), n.metrics.customPresetsCreated++, { ok: !0, preset: e }) : { ok: !1, error: "Preset must have regions config" };
}
function wI(e, t, n) {
  return Bn[e] ? { ok: !1, error: "Cannot delete built-in preset" } : (t.currentPreset === e && n($a.DEFAULT), { ok: t.customPresets.delete(e) });
}
function CI(e, t, n, s) {
  const r = Ki(e, s.customPresets);
  if (!r) return { ok: !1, error: "Source preset not found" };
  const i = {
    name: (n == null ? void 0 : n.name) || t,
    description: (n == null ? void 0 : n.description) || r.description,
    regions: Object.assign({}, r.regions, (n == null ? void 0 : n.regions) || {}),
    cssVars: Object.assign({}, r.cssVars, (n == null ? void 0 : n.cssVars) || {})
  };
  return Om(t, i, s);
}
let cn = $a.DEFAULT, Lr = null;
const Mr = /* @__PURE__ */ new Map(), fr = [];
let za = 300;
const xl = {
  presetChanges: 0,
  customPresetsCreated: 0
};
function AI(e) {
  for (let t = 0; t < fr.length; t++)
    try {
      fr[t](e);
    } catch {
    }
}
const ja = {
  get currentPreset() {
    return cn;
  },
  set currentPreset(e) {
    cn = e;
  },
  get previousPreset() {
    return Lr;
  },
  set previousPreset(e) {
    Lr = e;
  },
  get customPresets() {
    return Mr;
  },
  get transitionDuration() {
    return za;
  },
  get metrics() {
    return xl;
  },
  notify: AI
};
function yd(e, t) {
  return TI(e, t, ja);
}
function II() {
  return cn;
}
function DI() {
  return Lr;
}
function OI() {
  return Lr ? yd(Lr) : { ok: !1, error: "No previous preset" };
}
function xI(e) {
  e = e || cn;
  const t = Ki(e, Mr);
  return t ? Object.assign({}, t) : null;
}
function xm() {
  const e = [], t = Object.keys(Bn);
  for (let n = 0; n < t.length; n++)
    e.push({
      name: t[n],
      displayName: Bn[t[n]].name,
      description: Bn[t[n]].description,
      isBuiltIn: !0,
      isCurrent: t[n] === cn
    });
  return Mr.forEach((n, s) => {
    e.push({
      name: s,
      displayName: n.name,
      description: n.description,
      isBuiltIn: !1,
      isCurrent: s === cn
    });
  }), e;
}
function RI(e, t) {
  return Om(e, t, ja);
}
function _I(e) {
  return wI(e, ja, yd);
}
function LI(e, t, n) {
  return CI(e, t, n, ja);
}
function MI(e) {
  za = Math.max(0, Math.min(1e3, e));
}
function PI() {
  return za;
}
function NI(e) {
  return typeof e != "function" ? () => {
  } : (fr.push(e), () => {
    const t = fr.indexOf(e);
    t >= 0 && fr.splice(t, 1);
  });
}
function bd() {
  return {
    presetChanges: xl.presetChanges,
    customPresetsCreated: xl.customPresetsCreated,
    builtInPresets: Object.keys(Bn).length,
    customPresets: Mr.size,
    currentPreset: cn
  };
}
function $I() {
  const e = Ki(cn, Mr), t = {
    hasCurrentPreset: !!e,
    presetValid: e && e.regions && Object.keys(e.regions).length > 0,
    notTooManyCustom: Mr.size <= 20
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    currentPreset: cn,
    metrics: bd(),
    version: md,
    moduleId: vd,
    timestamp: Date.now()
  };
}
function zI() {
  return {
    moduleId: vd,
    version: md,
    currentPreset: cn,
    previousPreset: Lr,
    presets: xm(),
    transitionDuration: za,
    metrics: bd(),
    subscriberCount: fr.length,
    timestamp: Date.now()
  };
}
const Ae = {
  VERSION: md,
  MODULE_ID: vd,
  PRESETS: $a,
  apply: yd,
  getCurrent: II,
  getPrevious: DI,
  revert: OI,
  getConfig: xI,
  listPresets: xm,
  createPreset: RI,
  deletePreset: _I,
  clonePreset: LI,
  setTransitionDuration: MI,
  getTransitionDuration: PI,
  subscribe: NI,
  getMetrics: bd,
  healthCheck: $I,
  info: zI
}, Ed = "1.0.0-AAA", kd = "app-shell-accessibility-presets", qt = Object.freeze({
  DEFAULT: "default",
  HIGH_CONTRAST: "high-contrast",
  LARGE_TEXT: "large-text",
  REDUCED_MOTION: "reduced-motion",
  FOCUS_VISIBLE: "focus-visible",
  DYSLEXIA_FRIENDLY: "dyslexia-friendly",
  LOW_VISION: "low-vision",
  COGNITIVE: "cognitive"
}), Rl = {
  default: {
    name: "Default",
    description: "Configurações padrão",
    cssVars: {},
    bodyClasses: [],
    settings: {}
  },
  "high-contrast": {
    name: "High Contrast",
    description: "Alto contraste para melhor legibilidade",
    cssVars: {
      "--color-background": "#000000",
      "--color-surface": "#1a1a1a",
      "--color-text": "#ffffff",
      "--color-text-muted": "#e0e0e0",
      "--color-primary": "#ffff00",
      "--color-border": "#ffffff"
    },
    bodyClasses: ["a11y-high-contrast"],
    settings: { contrast: "high" }
  },
  "large-text": {
    name: "Large Text",
    description: "Texto ampliado para melhor leitura",
    cssVars: {
      "--font-size-base": "18px",
      "--font-size-sm": "16px",
      "--font-size-lg": "22px",
      "--font-size-xl": "26px",
      "--line-height-base": "1.6"
    },
    bodyClasses: ["a11y-large-text"],
    settings: { fontSize: "large" }
  },
  "reduced-motion": {
    name: "Reduced Motion",
    description: "Remove animações e transições",
    cssVars: {
      "--transition-duration": "0ms",
      "--animation-duration": "0ms"
    },
    bodyClasses: ["a11y-reduced-motion"],
    settings: { reduceMotion: !0 }
  },
  "focus-visible": {
    name: "Enhanced Focus",
    description: "Indicadores de foco mais visíveis",
    cssVars: {
      "--focus-outline-width": "3px",
      "--focus-outline-offset": "2px",
      "--focus-outline-color": "#0066ff"
    },
    bodyClasses: ["a11y-focus-visible"],
    settings: { enhancedFocus: !0 }
  },
  "dyslexia-friendly": {
    name: "Dyslexia Friendly",
    description: "Configurações para dislexia",
    cssVars: {
      "--font-family-base": "OpenDyslexic, Arial, sans-serif",
      "--letter-spacing": "0.05em",
      "--word-spacing": "0.16em",
      "--line-height-base": "1.8"
    },
    bodyClasses: ["a11y-dyslexia-friendly"],
    settings: { dyslexiaMode: !0 }
  },
  "low-vision": {
    name: "Low Vision",
    description: "Otimizado para baixa visão",
    cssVars: {
      "--font-size-base": "20px",
      "--font-weight-base": "500",
      "--color-text": "#000000",
      "--color-background": "#fffef0",
      "--line-height-base": "1.7"
    },
    bodyClasses: ["a11y-low-vision"],
    settings: { lowVision: !0 }
  },
  cognitive: {
    name: "Cognitive",
    description: "Interface simplificada",
    cssVars: {
      "--content-max-width": "600px",
      "--paragraph-spacing": "1.5em"
    },
    bodyClasses: ["a11y-cognitive"],
    settings: { simplifiedUI: !0 }
  }
}, Qo = Rl;
function jI(e) {
  return Rl[e] || Rl.default;
}
const fe = /* @__PURE__ */ new Set(), un = {}, fo = {}, Fn = [], tn = {
  persistPresets: !0,
  autoDetectSystem: !0,
  storageKey: "app-shell-a11y-presets"
}, Zo = {
  presetChanges: 0,
  customizations: 0
};
function Sd(e) {
  Zo.hasOwnProperty(e) && Zo[e]++;
}
function Td() {
  return {
    presetChanges: Zo.presetChanges,
    customizations: Zo.customizations,
    activePresets: fe.size,
    customSettings: Object.keys(un).length,
    appliedCssVars: Object.keys(fo).length
  };
}
function HI() {
  for (let e in un)
    delete un[e];
}
function UI() {
  if (tn.persistPresets)
    try {
      const e = localStorage.getItem(tn.storageKey);
      if (e) {
        const t = JSON.parse(e);
        t.presets && t.presets.forEach((n) => {
          fe.add(n);
        }), t.customSettings && Object.assign(un, t.customSettings);
      }
    } catch {
    }
}
function ho() {
  if (tn.persistPresets)
    try {
      const e = {
        presets: Array.from(fe),
        customSettings: un,
        savedAt: Date.now()
      };
      localStorage.setItem(tn.storageKey, JSON.stringify(e));
    } catch {
    }
}
function BI(e) {
  if (typeof document > "u") return;
  const t = document.documentElement, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t.style.setProperty(n[s], e[n[s]]), fo[n[s]] = e[n[s]];
}
function FI(e) {
  if (typeof document > "u") return;
  const t = document.documentElement, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t.style.removeProperty(n[s]), delete fo[n[s]];
}
function Rm(e, t) {
  if (!(typeof document > "u"))
    for (let n = 0; n < e.length; n++)
      t ? document.body.classList.add(e[n]) : document.body.classList.remove(e[n]);
}
function wd(e) {
  for (let t = 0; t < Fn.length; t++)
    try {
      Fn[t](e);
    } catch {
    }
}
function go() {
  return Array.from(fe);
}
function Pr(e) {
  const t = Qo[e];
  return t ? fe.has(e) ? { ok: !0, alreadyActive: !0 } : (t.cssVars && BI(t.cssVars), t.bodyClasses && Rm(t.bodyClasses, !0), fe.add(e), Sd("presetChanges"), ho(), wd({
    type: "preset-enabled",
    preset: e,
    activePresets: go(),
    timestamp: Date.now()
  }), { ok: !0, preset: e }) : { ok: !1, error: `Unknown preset: ${e}` };
}
function Cd(e) {
  const t = Qo[e];
  return t ? fe.has(e) ? (t.cssVars && FI(t.cssVars), t.bodyClasses && Rm(t.bodyClasses, !1), fe.delete(e), Sd("presetChanges"), ho(), wd({
    type: "preset-disabled",
    preset: e,
    activePresets: go(),
    timestamp: Date.now()
  }), { ok: !0, preset: e }) : { ok: !0, notActive: !0 } : { ok: !1, error: `Unknown preset: ${e}` };
}
function VI(e) {
  return fe.has(e) ? Cd(e) : Pr(e);
}
function GI(e) {
  const t = [];
  for (let n = 0; n < e.length; n++)
    t.push(Pr(e[n]));
  return t;
}
function YI() {
  const e = Array.from(fe);
  for (let t = 0; t < e.length; t++)
    Cd(e[t]);
  return HI(), ho(), wd({
    type: "reset",
    timestamp: Date.now()
  }), { ok: !0 };
}
function qI(e) {
  return fe.has(e);
}
function WI(e) {
  for (let t = 0; t < Fn.length; t++)
    try {
      Fn[t](e);
    } catch {
    }
}
function KI(e, t) {
  return un[e] = t, Sd("customizations"), e.startsWith("--") && (document.documentElement.style.setProperty(e, t), fo[e] = t), ho(), WI({
    type: "setting-changed",
    key: e,
    value: t,
    timestamp: Date.now()
  }), { ok: !0 };
}
function XI(e) {
  return un[e];
}
function _m() {
  return Object.assign({}, un);
}
function JI(e) {
  return e in un ? (delete un[e], e.startsWith("--") && (document.documentElement.style.removeProperty(e), delete fo[e]), ho(), !0) : !1;
}
function Ha() {
  const e = {
    reducedMotion: !1,
    highContrast: !1,
    darkMode: !1
  };
  return typeof window > "u" || window.matchMedia && (e.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches, e.highContrast = window.matchMedia("(prefers-contrast: more)").matches, e.darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches), e;
}
function Lm() {
  const e = Ha(), t = [];
  return e.reducedMotion && !fe.has(qt.REDUCED_MOTION) && (Pr(qt.REDUCED_MOTION), t.push(qt.REDUCED_MOTION)), e.highContrast && !fe.has(qt.HIGH_CONTRAST) && (Pr(qt.HIGH_CONTRAST), t.push(qt.HIGH_CONTRAST)), { ok: !0, applied: t, systemPrefs: e };
}
function Mm() {
  return Object.keys(Qo).map((e) => {
    const t = Qo[e];
    return {
      name: e,
      displayName: t.name,
      description: t.description,
      isActive: fe.has(e)
    };
  });
}
function QI(e) {
  e.persistPresets !== void 0 && (tn.persistPresets = !!e.persistPresets), e.autoDetectSystem !== void 0 && (tn.autoDetectSystem = !!e.autoDetectSystem), e.storageKey !== void 0 && (tn.storageKey = e.storageKey);
}
function Pm() {
  return Object.assign({}, tn);
}
function ZI(e) {
  return typeof e != "function" ? () => {
  } : (Fn.push(e), () => {
    const t = Fn.indexOf(e);
    t >= 0 && Fn.splice(t, 1);
  });
}
function eD() {
  const e = {
    noExcessivePresets: fe.size <= 5,
    noConflicts: !(fe.has(qt.HIGH_CONTRAST) && fe.has(qt.LOW_VISION) && fe.size > 3),
    configValid: typeof tn.persistPresets == "boolean"
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    activePresets: go(),
    systemPrefs: Ha(),
    metrics: Td(),
    version: Ed,
    moduleId: kd,
    timestamp: Date.now()
  };
}
function tD() {
  return {
    moduleId: kd,
    version: Ed,
    config: Pm(),
    activePresets: go(),
    customSettings: _m(),
    availablePresets: Mm(),
    systemPrefs: Ha(),
    metrics: Td(),
    subscriberCount: Fn.length,
    timestamp: Date.now()
  };
}
if (typeof window < "u") {
  UI();
  const e = Array.from(fe);
  fe.clear();
  for (let t = 0; t < e.length; t++)
    Pr(e[t]);
  tn.autoDetectSystem && fe.size === 0 && Lm();
}
const U = {
  VERSION: Ed,
  MODULE_ID: kd,
  PRESETS: qt,
  enable: Pr,
  disable: Cd,
  toggle: VI,
  enableMultiple: GI,
  reset: YI,
  isEnabled: qI,
  getActivePresets: go,
  listPresets: Mm,
  getPresetConfig: jI,
  setSetting: KI,
  getSetting: XI,
  getAllSettings: _m,
  removeSetting: JI,
  detectSystemPreferences: Ha,
  applySystemPreferences: Lm,
  configure: QI,
  getConfig: Pm,
  subscribe: ZI,
  getMetrics: Td,
  healthCheck: eD,
  info: tD
}, Ad = "1.0.0-AAA", Id = "app-shell-skeleton-loader", Nm = Object.freeze({
  TEXT: "text",
  PARAGRAPH: "paragraph",
  AVATAR: "avatar",
  THUMBNAIL: "thumbnail",
  CARD: "card",
  LIST: "list",
  TABLE: "table",
  FORM: "form",
  DASHBOARD: "dashboard",
  ARTICLE: "article"
}), Ut = /* @__PURE__ */ new Map(), mo = /* @__PURE__ */ new Map(), Ve = {
  animationType: "pulse",
  animationDuration: 1500,
  baseColor: "var(--color-skeleton-base, #e0e0e0)",
  highlightColor: "var(--color-skeleton-highlight, #f0f0f0)",
  borderRadius: "4px"
}, Nr = {
  created: 0,
  destroyed: 0,
  activeCount: 0
};
function $m() {
  if (typeof document > "u" || document.getElementById("skeleton-loader-styles")) return;
  const e = `
.skeleton-loader {
  position: relative;
  overflow: hidden;
  background: var(--skeleton-base-color, ${Ve.baseColor});
  border-radius: var(--skeleton-radius, ${Ve.borderRadius});
}
.skeleton-loader.skeleton-pulse {
  animation: skeleton-pulse ${Ve.animationDuration}ms ease-in-out infinite;
}
.skeleton-loader.skeleton-wave::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, var(--skeleton-highlight-color, ${Ve.highlightColor}), transparent);
  animation: skeleton-wave ${Ve.animationDuration}ms ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes skeleton-wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.skeleton-container { display: flex; flex-direction: column; }
.skeleton-row { display: flex; flex-direction: row; align-items: center; }
.skeleton-grid { display: grid; }
.skeleton-circle { border-radius: 50%; }
`, t = document.createElement("style");
  t.id = "skeleton-loader-styles", t.textContent = e, document.head.appendChild(t);
}
function nD() {
  const e = document.getElementById("skeleton-loader-styles");
  e && e.remove();
}
function Vn(e) {
  const t = document.createElement("div");
  return t.className = `skeleton-loader skeleton-${Ve.animationType}`, e.width && (t.style.width = e.width), e.height && (t.style.height = e.height), e.marginTop && (t.style.marginTop = e.marginTop), e.marginBottom && (t.style.marginBottom = e.marginBottom), e.radius && (t.style.borderRadius = e.radius), e.flex && (t.style.flex = e.flex), e.type === "circle" && (t.classList.add("skeleton-circle"), t.style.width = e.size || "40px", t.style.height = e.size || "40px"), t;
}
const vo = {
  text: {
    lines: [{ width: "100%", height: "16px" }]
  },
  paragraph: {
    lines: [
      { width: "100%", height: "16px" },
      { width: "100%", height: "16px" },
      { width: "100%", height: "16px" },
      { width: "75%", height: "16px" }
    ],
    gap: "8px"
  },
  avatar: {
    shapes: [
      { type: "circle", size: "48px" }
    ]
  },
  thumbnail: {
    shapes: [
      { type: "rect", width: "120px", height: "80px", radius: "8px" }
    ]
  },
  card: {
    shapes: [
      { type: "rect", width: "100%", height: "160px", radius: "8px" },
      { type: "rect", width: "60%", height: "20px", marginTop: "12px" },
      { type: "rect", width: "100%", height: "14px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "14px", marginTop: "4px" },
      { type: "rect", width: "40%", height: "14px", marginTop: "4px" }
    ]
  },
  list: {
    repeat: 5,
    item: {
      layout: "row",
      gap: "12px",
      shapes: [
        { type: "circle", size: "40px" },
        { type: "column", flex: 1, shapes: [
          { type: "rect", width: "70%", height: "16px" },
          { type: "rect", width: "50%", height: "12px", marginTop: "4px" }
        ] }
      ]
    },
    gap: "16px"
  },
  table: {
    header: { height: "40px", cols: 4 },
    rows: 5,
    rowHeight: "48px",
    cols: 4
  },
  form: {
    fields: [
      { label: !0, input: { width: "100%", height: "40px" } },
      { label: !0, input: { width: "100%", height: "40px" } },
      { label: !0, input: { width: "100%", height: "100px" } },
      { button: { width: "120px", height: "40px" } }
    ],
    gap: "16px"
  },
  dashboard: {
    layout: "grid",
    cols: 3,
    gap: "16px",
    items: [
      { type: "stat", colspan: 1 },
      { type: "stat", colspan: 1 },
      { type: "stat", colspan: 1 },
      { type: "chart", colspan: 2, height: "200px" },
      { type: "list", colspan: 1, rows: 4 }
    ]
  },
  article: {
    shapes: [
      { type: "rect", width: "80%", height: "32px" },
      { type: "rect", width: "40%", height: "14px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "200px", marginTop: "24px", radius: "8px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "24px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "8px" },
      { type: "rect", width: "60%", height: "16px", marginTop: "8px" }
    ]
  }
};
function Ua(e, t) {
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    if (s.type === "column") {
      const r = document.createElement("div");
      r.className = "skeleton-container", s.flex && (r.style.flex = s.flex), s.shapes && Ua(r, s.shapes), e.appendChild(r);
    } else
      e.appendChild(Vn(s));
  }
}
function sD(e) {
  const t = document.createElement("div");
  return t.className = e.layout === "row" ? "skeleton-row" : "skeleton-container", e.gap && (t.style.gap = e.gap), e.shapes && Ua(t, e.shapes), t;
}
function rD(e, t) {
  const n = document.createElement("div");
  n.className = "skeleton-row", n.style.gap = "8px";
  for (let s = 0; s < t.cols; s++) {
    const r = Vn({ width: "100%", height: t.header.height, flex: 1 });
    n.appendChild(r);
  }
  e.appendChild(n);
  for (let s = 0; s < t.rows; s++) {
    const r = document.createElement("div");
    r.className = "skeleton-row", r.style.gap = "8px", r.style.marginTop = "4px";
    for (let i = 0; i < t.cols; i++) {
      const o = Vn({ width: "100%", height: t.rowHeight, flex: 1 });
      r.appendChild(o);
    }
    e.appendChild(r);
  }
}
function iD(e, t) {
  for (let n = 0; n < t.fields.length; n++) {
    const s = t.fields[n], r = document.createElement("div");
    r.className = "skeleton-container", r.style.gap = "4px", n > 0 && t.gap && (r.style.marginTop = t.gap), s.label && r.appendChild(Vn({ width: "100px", height: "14px" })), s.input && r.appendChild(Vn(s.input)), s.button && r.appendChild(Vn(s.button)), e.appendChild(r);
  }
}
function oD(e) {
  const t = vo[e] || mo.get(e);
  if (!t) return null;
  const n = document.createElement("div");
  if (n.className = "skeleton-container", n.setAttribute("data-skeleton-template", e), t.gap && (n.style.gap = t.gap), t.lines)
    for (let s = 0; s < t.lines.length; s++)
      n.appendChild(Vn(t.lines[s]));
  if (t.shapes && Ua(n, t.shapes), t.repeat && t.item)
    for (let s = 0; s < t.repeat; s++) {
      const r = sD(t.item);
      s > 0 && t.gap && (r.style.marginTop = t.gap), n.appendChild(r);
    }
  return t.header && t.rows && rD(n, t), t.fields && iD(n, t), n;
}
function aD(e, t, n) {
  $m();
  const s = typeof e == "string" ? document.querySelector(e) : e;
  if (!s) return null;
  n = n || {};
  let r;
  if (typeof t == "string" ? r = oD(t) : t && t.shapes ? (r = document.createElement("div"), r.className = "skeleton-container", Ua(r, t.shapes)) : r = Vn(t || { width: "100%", height: "100px" }), !r) return null;
  const i = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  return r.id = i, r.setAttribute("role", "status"), r.setAttribute("aria-busy", "true"), r.setAttribute("aria-label", n.ariaLabel || "Loading..."), n.replace && (s.innerHTML = ""), s.appendChild(r), Ut.set(i, {
    element: r,
    container: s,
    template: typeof t == "string" ? t : "custom",
    createdAt: Date.now()
  }), Nr.created++, Nr.activeCount = Ut.size, i;
}
function Dd(e) {
  const t = Ut.get(e);
  return t ? (t.element && t.element.parentNode && t.element.parentNode.removeChild(t.element), Ut.delete(e), Nr.destroyed++, Nr.activeCount = Ut.size, !0) : !1;
}
function lD(e) {
  const t = typeof e == "string" ? document.querySelector(e) : e;
  if (!t) return 0;
  let n = 0;
  return Ut.forEach((s, r) => {
    s.container === t && (Dd(r), n++);
  }), n;
}
function cD() {
  const e = [];
  Ut.forEach((t, n) => {
    e.push(n);
  });
  for (let t = 0; t < e.length; t++)
    Dd(e[t]);
  return e.length;
}
function uD(e) {
  const t = typeof e == "string" ? document.querySelector(e) : e;
  if (!t) return !1;
  let n = !1;
  return Ut.forEach((s) => {
    s.container === t && (n = !0);
  }), n;
}
function zm() {
  const e = Object.keys(vo).map((t) => ({
    name: t,
    isBuiltIn: !0
  }));
  return mo.forEach((t, n) => {
    e.push({ name: n, isBuiltIn: !1 });
  }), e;
}
function dD(e, t) {
  return vo[e] ? { ok: !1, error: "Cannot override built-in template" } : (mo.set(e, t), { ok: !0 });
}
function pD(e) {
  return mo.delete(e);
}
function fD(e) {
  e.animationType && (Ve.animationType = e.animationType), e.animationDuration && (Ve.animationDuration = e.animationDuration), e.baseColor && (Ve.baseColor = e.baseColor), e.highlightColor && (Ve.highlightColor = e.highlightColor), e.borderRadius && (Ve.borderRadius = e.borderRadius), nD(), $m();
}
function jm() {
  return {
    animationType: Ve.animationType,
    animationDuration: Ve.animationDuration,
    baseColor: Ve.baseColor,
    highlightColor: Ve.highlightColor,
    borderRadius: Ve.borderRadius
  };
}
function Od() {
  return {
    created: Nr.created,
    destroyed: Nr.destroyed,
    activeCount: Ut.size,
    builtInTemplates: Object.keys(vo).length,
    customTemplates: mo.size
  };
}
function hD() {
  const e = {
    stylesInjected: typeof document > "u" || !!document.getElementById("skeleton-loader-styles"),
    notTooManyActive: Ut.size < 50,
    templatesAvailable: Object.keys(vo).length > 0
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    metrics: Od(),
    version: Ad,
    moduleId: Id,
    timestamp: Date.now()
  };
}
function gD() {
  return {
    moduleId: Id,
    version: Ad,
    config: jm(),
    metrics: Od(),
    templates: zm(),
    activeSkeletons: Ut.size,
    timestamp: Date.now()
  };
}
const je = {
  VERSION: Ad,
  MODULE_ID: Id,
  TEMPLATES: Nm,
  create: aD,
  destroy: Dd,
  destroyIn: lD,
  destroyAll: cD,
  hasActive: uD,
  listTemplates: zm,
  registerTemplate: dD,
  unregisterTemplate: pD,
  configure: fD,
  getConfig: jm,
  getMetrics: Od,
  healthCheck: hD,
  info: gD
}, xd = "1.0.0-AAA", Rd = "app-shell-keyboard-navigation", Ps = [
  "header",
  "nav-rail",
  "sidebar",
  "main",
  "footer"
], cl = {
  F6: "F6",
  ESCAPE: "Escape",
  TAB: "Tab"
};
let Hm = !1;
function Ba() {
  return Hm;
}
function Um(e) {
  Hm = e;
}
let Bm = !0;
function Bs() {
  return Bm;
}
function Fm(e) {
  Bm = e;
}
let Vm = null;
function ri() {
  return Vm;
}
function Gm(e) {
  Vm = e;
}
let Ym = null;
function mD() {
  return Ym;
}
function qm(e) {
  Ym = e;
}
const hr = [], fs = {
  f6Navigations: 0,
  escapeActions: 0,
  tabTraps: 0,
  errors: 0
};
function ea(e) {
  fs.hasOwnProperty(e) && fs[e]++;
}
function ta() {
  return {
    f6Navigations: fs.f6Navigations,
    escapeActions: fs.escapeActions,
    tabTraps: fs.tabTraps,
    errors: fs.errors
  };
}
function pn(e, t) {
  for (let n = 0; n < hr.length; n++)
    try {
      hr[n]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      fs.errors++;
    }
}
function Wm() {
  const e = [];
  for (let t = 0; t < Ps.length; t++) {
    const n = Ps[t], s = ke(n);
    s && !s.classList.contains("dsd-region--hidden") && (s.offsetParent !== null || getComputedStyle(s).position === "fixed") && e.push(n);
  }
  return e;
}
function _d() {
  const e = document.activeElement;
  if (!e) return null;
  for (let t = 0; t < Ps.length; t++) {
    const n = Ps[t], s = ke(n);
    if (s && s.contains(e))
      return n;
  }
  return null;
}
function Km(e) {
  if (!e) return [];
  const t = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(", "), n = e.querySelectorAll(t), s = [];
  for (let r = 0; r < n.length; r++) {
    const i = n[r];
    (i.offsetParent !== null || getComputedStyle(i).position === "fixed") && s.push(i);
  }
  return s;
}
function Fa(e) {
  const t = ke(e);
  if (!t) return !1;
  if (t.hasAttribute("tabindex"))
    return t.focus(), !0;
  const n = Km(t);
  return n.length > 0 ? (n[0].focus(), !0) : (t.setAttribute("tabindex", "-1"), t.focus(), !0);
}
function Ld(e, t) {
  if (!Bs()) return;
  e.preventDefault();
  const n = Wm();
  if (n.length === 0) return;
  let s = -1;
  const r = document.activeElement;
  for (let a = 0; a < n.length; a++) {
    const l = ke(n[a]);
    if (l && l.contains(r)) {
      s = a;
      break;
    }
  }
  let i;
  t ? i = s <= 0 ? n.length - 1 : s - 1 : i = s >= n.length - 1 ? 0 : s + 1;
  const o = n[i];
  Fa(o), ea("f6Navigations"), pn("region-navigate", {
    from: s >= 0 ? n[s] : null,
    to: o,
    reverse: t
  });
}
function vD(e) {
  return ke(e) ? (qm(document.activeElement), Gm(e), ea("tabTraps"), Fa(e), pn("tab-trap-set", { region: e }), !0) : !1;
}
function Xm() {
  const e = ri();
  if (!e) return !1;
  const t = e;
  Gm(null);
  const n = mD();
  return n && document.contains(n) && n.focus(), qm(null), pn("tab-trap-released", { region: t }), !0;
}
function Md() {
  return ri() !== null;
}
function Pd() {
  return ri();
}
function yD(e) {
  if (!Bs()) return;
  if (ri()) {
    Xm(), ea("escapeActions"), e.preventDefault();
    return;
  }
  const t = ke("main");
  t && !t.contains(document.activeElement) && (Fa("main"), ea("escapeActions"), pn("escape-to-main", { from: document.activeElement }));
}
function bD(e) {
  const t = ri();
  if (!t || !Bs()) return;
  const n = ke(t);
  if (!n) return;
  const s = Km(n);
  if (s.length === 0) return;
  const r = s[0], i = s[s.length - 1];
  e.shiftKey ? document.activeElement === r && (e.preventDefault(), i.focus()) : document.activeElement === i && (e.preventDefault(), r.focus());
}
function Jm(e) {
  if (Bs())
    switch (e.key) {
      case cl.F6:
        Ld(e, e.shiftKey);
        break;
      case cl.ESCAPE:
        yD(e);
        break;
      case cl.TAB:
        ri() && bD(e);
        break;
    }
}
function Qm(e) {
  const t = Fa(e);
  return t && pn("navigate-to", { region: e }), t;
}
function ED() {
  return Ld({ preventDefault() {
  }, shiftKey: !1, key: "F6" }, !1), !0;
}
function kD() {
  return Ld({ preventDefault() {
  }, shiftKey: !0, key: "F6" }, !0), !0;
}
function SD() {
  return Qm("main");
}
function _l() {
  return Ba() ? !0 : typeof document > "u" ? !1 : (document.addEventListener("keydown", Jm), Um(!0), pn("initialized", null), !0);
}
function TD() {
  return Ba() && (document.removeEventListener("keydown", Jm), Um(!1), pn("destroyed", null)), !0;
}
function wD() {
  Fm(!0), pn("enabled", null);
}
function CD() {
  Fm(!1), pn("disabled", null);
}
function AD() {
  return Bs();
}
function Zm() {
  return Ps.slice();
}
function ID(e) {
  if (Array.isArray(e) && e.length > 0) {
    Ps.length = 0;
    for (let t = 0; t < e.length; t++)
      Ps.push(e[t]);
    pn("navigation-order-changed", { order: e });
  }
}
function DD(e) {
  return typeof e != "function" ? () => {
  } : (hr.push(e), () => {
    const t = hr.indexOf(e);
    t >= 0 && hr.splice(t, 1);
  });
}
function OD() {
  const e = {
    initialized: Ba(),
    enabled: Bs(),
    noErrors: ta().errors === 0
  }, t = Object.keys(e);
  let n = 0;
  for (let r = 0; r < t.length; r++)
    e[t[r]] && n++;
  const s = t.length;
  return {
    status: n === s ? "HEALTHY" : n >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/${s}`,
    checks: e,
    currentRegion: _d(),
    tabTrapActive: Md(),
    tabTrapRegion: Pd(),
    metrics: ta(),
    version: xd,
    moduleId: Rd,
    timestamp: Date.now()
  };
}
function xD() {
  return {
    moduleId: Rd,
    version: xd,
    initialized: Ba(),
    enabled: Bs(),
    currentRegion: _d(),
    navigationOrder: Zm(),
    visibleRegions: Wm(),
    tabTrapActive: Md(),
    tabTrapRegion: Pd(),
    listenerCount: hr.length,
    metrics: ta(),
    shortcuts: {
      F6: "Navigate to next region",
      "Shift+F6": "Navigate to previous region",
      Escape: "Return to main region / release tab trap"
    },
    timestamp: Date.now()
  };
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  _l();
}) : _l());
const ce = {
  VERSION: xd,
  MODULE_ID: Rd,
  init: _l,
  destroy: TD,
  enable: wD,
  disable: CD,
  isEnabled: AD,
  navigateToRegion: Qm,
  navigateNext: ED,
  navigatePrevious: kD,
  navigateToMain: SD,
  getCurrentRegion: _d,
  getNavigationOrder: Zm,
  setNavigationOrder: ID,
  setTabTrap: vD,
  releaseTabTrap: Xm,
  isTabTrapped: Md,
  getTabTrapRegion: Pd,
  subscribe: DD,
  getMetrics: ta,
  healthCheck: OD,
  info: xD
}, Nd = "1.0.0-AAA", $d = "app-shell-maintenance-mode", na = "app-shell-maintenance-state", ft = Object.freeze({
  FULL: "full",
  PARTIAL: "partial",
  SCHEDULED: "scheduled",
  EMERGENCY: "emergency",
  FEATURE: "feature"
}), Qn = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
}), p = {
  active: !1,
  type: null,
  severity: Qn.INFO,
  message: null,
  startTime: null,
  endTime: null,
  affectedRegions: [],
  affectedFeatures: [],
  allowedRoles: [],
  bypassToken: null
}, Je = {
  showBanner: !0,
  bannerPosition: "top",
  blockInteraction: !0,
  allowDismiss: !1,
  persistState: !0
}, gr = [], os = { value: null }, nn = { value: null }, mr = {
  activations: 0,
  deactivations: 0,
  bypasses: 0
};
function RD() {
  if (Je.persistState)
    try {
      const e = localStorage.getItem(na);
      if (e) {
        const t = JSON.parse(e);
        if (t.endTime && Date.now() > t.endTime) {
          localStorage.removeItem(na);
          return;
        }
        Object.assign(p, t);
      }
    } catch {
    }
}
function _D() {
  if (Je.persistState)
    try {
      localStorage.setItem(na, JSON.stringify(p));
    } catch {
    }
}
function LD() {
  try {
    localStorage.removeItem(na);
  } catch {
  }
}
function MD() {
  switch (p.severity) {
    case Qn.CRITICAL:
      return "#dc3545";
    case Qn.WARNING:
      return "#fd7e14";
    default:
      return "#0d6efd";
  }
}
function PD() {
  switch (p.severity) {
    case Qn.CRITICAL:
      return "⚠️";
    case Qn.WARNING:
      return "🔧";
    default:
      return "ℹ️";
  }
}
function ev() {
  switch (p.type) {
    case ft.FULL:
      return "Sistema em manutencao. Voltaremos em breve.";
    case ft.PARTIAL:
      return "Algumas funcionalidades estao temporariamente indisponiveis.";
    case ft.SCHEDULED:
      return "Manutencao programada em andamento.";
    case ft.EMERGENCY:
      return "Manutencao de emergencia. Desculpe o transtorno.";
    case ft.FEATURE:
      return "Recurso temporariamente indisponivel.";
    default:
      return "Sistema em manutencao.";
  }
}
function tv() {
  if (!p.endTime) return;
  const e = document.getElementById("maintenance-time-remaining");
  if (!e) return;
  const t = p.endTime - Date.now();
  if (t <= 0) {
    e.textContent = "(finalizando...)";
    return;
  }
  const n = Math.ceil(t / 6e4);
  if (n > 60) {
    const s = Math.floor(n / 60);
    e.textContent = `(~${s}h restantes)`;
  } else
    e.textContent = `(~${n}min restantes)`;
}
function nv() {
  if (typeof document > "u" || !Je.showBanner || os.value) return;
  const e = document.createElement("div");
  e.id = "shell-maintenance-banner", e.className = `maintenance-banner maintenance-${p.severity}`, e.setAttribute("role", "alert"), e.setAttribute("aria-live", "assertive");
  const t = [
    "position: fixed",
    Je.bannerPosition === "bottom" ? "bottom: 0" : "top: 0",
    "left: 0",
    "right: 0",
    "padding: 12px 16px",
    `background: ${MD()}`,
    "color: white",
    "font-size: 14px",
    "text-align: center",
    "z-index: 99999",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "gap: 12px"
  ];
  e.style.cssText = t.join(";");
  const n = document.createElement("span");
  n.innerHTML = PD(), e.appendChild(n);
  const s = document.createElement("span");
  if (s.textContent = p.message || ev(), e.appendChild(s), p.endTime) {
    const r = document.createElement("span");
    r.id = "maintenance-time-remaining", r.style.cssText = "margin-left: 8px; opacity: 0.9; font-size: 12px", e.appendChild(r), tv();
  }
  if (Je.allowDismiss) {
    const r = document.createElement("button");
    r.innerHTML = "&times;", r.style.cssText = "background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 12px", r.onclick = () => {
      sv();
    }, e.appendChild(r);
  }
  document.body.appendChild(e), os.value = e, document.body.style.paddingTop = Je.bannerPosition === "top" ? "48px" : "", document.body.style.paddingBottom = Je.bannerPosition === "bottom" ? "48px" : "";
}
function sv() {
  os.value && os.value.parentNode && (os.value.parentNode.removeChild(os.value), os.value = null, document.body.style.paddingTop = "", document.body.style.paddingBottom = "");
}
function rv() {
  if (!Je.blockInteraction || p.type !== ft.FULL || typeof document > "u") return;
  const e = document.createElement("div");
  e.id = "shell-maintenance-overlay", e.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "right: 0",
    "bottom: 0",
    "background: rgba(0,0,0,0.5)",
    "z-index: 99998",
    "display: flex",
    "align-items: center",
    "justify-content: center"
  ].join(";");
  const t = document.createElement("div");
  t.style.cssText = "background: white; padding: 32px; border-radius: 8px; text-align: center; max-width: 400px", t.innerHTML = `<h2 style="margin: 0 0 16px">🔧 Manutencao</h2><p>${p.message || ev()}</p>`, e.appendChild(t), document.body.appendChild(e);
}
function ND() {
  const e = document.getElementById("shell-maintenance-overlay");
  e && e.parentNode && e.parentNode.removeChild(e);
}
function iv(e) {
  if (typeof document > "u") return;
  const t = `shell-${e}-region`, n = document.getElementById(t);
  n && (n.setAttribute("data-maintenance", "true"), n.style.pointerEvents = "none", n.style.opacity = "0.5");
}
function $D(e) {
  if (typeof document > "u") return;
  const t = `shell-${e}-region`, n = document.getElementById(t);
  n && (n.removeAttribute("data-maintenance"), n.style.pointerEvents = "", n.style.opacity = "");
}
function Va(e) {
  for (let t = 0; t < gr.length; t++)
    try {
      gr[t](e);
    } catch {
    }
}
function zD(e) {
  return typeof e != "function" ? () => {
  } : (gr.push(e), function() {
    const t = gr.indexOf(e);
    t >= 0 && gr.splice(t, 1);
  });
}
function Ll(e) {
  e = e || {}, p.active = !0, p.type = e.type || ft.PARTIAL, p.severity = e.severity || Qn.INFO, p.message = e.message || null, p.startTime = Date.now(), p.endTime = e.endTime || (e.duration ? Date.now() + e.duration : null), p.affectedRegions = e.regions || [], p.affectedFeatures = e.features || [], p.allowedRoles = e.allowedRoles || [], p.bypassToken = e.bypassToken || null, _D(), nv();
  for (let t = 0; t < p.affectedRegions.length; t++)
    iv(p.affectedRegions[t]);
  if (p.type === ft.FULL && rv(), mr.activations++, Va({
    type: "activated",
    maintenanceType: p.type,
    severity: p.severity,
    timestamp: Date.now()
  }), p.endTime) {
    const t = p.endTime - Date.now();
    t > 0 && (p._autoDeactivateTimer = setTimeout(() => {
      p._autoDeactivateTimer = null, p.active && p.endTime && Date.now() >= p.endTime && ov();
    }, t), p._countdownInterval = setInterval(tv, 6e4));
  }
  return { ok: !0, state: zd() };
}
function ov() {
  if (!p.active) return { ok: !1, error: "Not active" };
  p._autoDeactivateTimer && (clearTimeout(p._autoDeactivateTimer), p._autoDeactivateTimer = null), p._countdownInterval && (clearInterval(p._countdownInterval), p._countdownInterval = null);
  for (let e = 0; e < p.affectedRegions.length; e++)
    $D(p.affectedRegions[e]);
  return sv(), ND(), p.active = !1, p.type = null, p.message = null, p.startTime = null, p.endTime = null, p.affectedRegions = [], p.affectedFeatures = [], LD(), mr.deactivations++, Va({
    type: "deactivated",
    timestamp: Date.now()
  }), { ok: !0 };
}
function jD() {
  return p.active;
}
function zd() {
  return {
    active: p.active,
    type: p.type,
    severity: p.severity,
    message: p.message,
    startTime: p.startTime,
    endTime: p.endTime,
    affectedRegions: p.affectedRegions.slice(),
    affectedFeatures: p.affectedFeatures.slice(),
    duration: p.startTime ? Date.now() - p.startTime : 0
  };
}
function HD(e) {
  return p.active ? p.type === ft.FULL ? !0 : p.affectedRegions.indexOf(e) >= 0 : !1;
}
function UD(e) {
  return p.active ? p.type === ft.FULL ? !0 : p.affectedFeatures.indexOf(e) >= 0 : !1;
}
function BD(e, t) {
  return p.active ? t && p.bypassToken && t === p.bypassToken || e && p.allowedRoles.indexOf(e) >= 0 ? (mr.bypasses++, !0) : !1 : !0;
}
function FD(e) {
  if (!e.startAt)
    return { ok: !1, error: "startAt required" };
  const t = e.startAt - Date.now();
  return t <= 0 ? Ll(e) : (nn.value = {
    options: e,
    scheduledFor: e.startAt,
    timer: setTimeout(() => {
      Ll(e), nn.value = null;
    }, t)
  }, Va({
    type: "scheduled",
    scheduledFor: e.startAt,
    timestamp: Date.now()
  }), { ok: !0, scheduledFor: e.startAt });
}
function VD() {
  return nn.value ? (clearTimeout(nn.value.timer), nn.value = null, Va({
    type: "schedule-cancelled",
    timestamp: Date.now()
  }), { ok: !0 }) : { ok: !1, error: "Nothing scheduled" };
}
function av() {
  return nn.value ? {
    scheduledFor: nn.value.scheduledFor,
    options: nn.value.options
  } : null;
}
function GD(e) {
  e.showBanner !== void 0 && (Je.showBanner = !!e.showBanner), e.bannerPosition !== void 0 && (Je.bannerPosition = e.bannerPosition), e.blockInteraction !== void 0 && (Je.blockInteraction = !!e.blockInteraction), e.allowDismiss !== void 0 && (Je.allowDismiss = !!e.allowDismiss), e.persistState !== void 0 && (Je.persistState = !!e.persistState);
}
function lv() {
  return Object.assign({}, Je);
}
function jd() {
  return {
    activations: mr.activations,
    deactivations: mr.deactivations,
    bypasses: mr.bypasses,
    currentlyActive: p.active
  };
}
function YD() {
  const e = {
    stateConsistent: p.active ? !!p.type : !p.type,
    noStaleSchedule: !nn.value || nn.value.scheduledFor > Date.now(),
    configValid: typeof Je.showBanner == "boolean"
  };
  let t = 0;
  const n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    e[n[s]] && t++;
  return {
    status: t === n.length ? "HEALTHY" : "DEGRADED",
    score: `${t}/${n.length}`,
    checks: e,
    active: p.active,
    type: p.type,
    metrics: jd(),
    version: Nd,
    moduleId: $d,
    timestamp: Date.now()
  };
}
function qD() {
  return {
    moduleId: $d,
    version: Nd,
    state: zd(),
    scheduled: av(),
    config: lv(),
    metrics: jd(),
    subscriberCount: gr.length,
    timestamp: Date.now()
  };
}
if (typeof window < "u" && (RD(), p.active)) {
  nv();
  for (let e = 0; e < p.affectedRegions.length; e++)
    iv(p.affectedRegions[e]);
  p.type === ft.FULL && rv();
}
const ve = {
  VERSION: Nd,
  MODULE_ID: $d,
  MAINTENANCE_TYPES: ft,
  SEVERITY: Qn,
  activate: Ll,
  deactivate: ov,
  isActive: jD,
  getState: zd,
  isRegionAffected: HD,
  isFeatureAffected: UD,
  canBypass: BD,
  schedule: FD,
  cancelScheduled: VD,
  getScheduled: av,
  configure: GD,
  getConfig: lv,
  subscribe: zD,
  getMetrics: jd,
  healthCheck: YD,
  info: qD
}, Hd = "1.0.1-AAA", Ga = "app-shell-region-events", Rn = Object.freeze({
  MOUNTED: "region:mounted",
  UNMOUNTED: "region:unmounted",
  READY: "region:ready",
  SHOW: "region:show",
  HIDE: "region:hide",
  VISIBILITY_CHANGED: "region:visibility-changed",
  CONTENT_LOADED: "region:content-loaded",
  CONTENT_UPDATED: "region:content-updated",
  CONTENT_CLEARED: "region:content-cleared",
  LOADING_START: "region:loading-start",
  LOADING_END: "region:loading-end",
  RESIZE_START: "region:resize-start",
  RESIZE: "region:resize",
  RESIZE_END: "region:resize-end",
  FOCUS_ENTER: "region:focus-enter",
  FOCUS_LEAVE: "region:focus-leave",
  CLICK: "region:click",
  HOVER_ENTER: "region:hover-enter",
  HOVER_LEAVE: "region:hover-leave",
  ERROR: "region:error"
}), Lt = {}, vr = [], Gn = [], Ya = { value: 100 }, $r = { value: !1 }, Xi = { value: !1 }, ht = {
  eventsEmitted: 0,
  listenersAdded: 0,
  listenersRemoved: 0,
  errors: 0
}, af = Object.keys(Ze);
for (let e = 0; e < af.length; e++)
  Lt[af[e]] = {};
function WD(e) {
  Gn.push(e), Gn.length > Ya.value && Gn.shift();
}
function KD(e, t, n) {
  return {
    type: t,
    region: e,
    data: n || null,
    timestamp: Date.now(),
    id: `${Ga}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
  };
}
function Ud(e) {
  return ke(e);
}
function qa(e, t, n) {
  const s = KD(e, t, n);
  WD(s), ht.eventsEmitted++;
  const r = Lt[e];
  if (r) {
    const i = r[t] || [];
    for (let a = 0; a < i.length; a++)
      try {
        i[a](s);
      } catch {
        ht.errors++;
      }
    const o = r["*"] || [];
    for (let a = 0; a < o.length; a++)
      try {
        o[a](s);
      } catch {
        ht.errors++;
      }
  }
  for (let i = 0; i < vr.length; i++)
    try {
      vr[i](s);
    } catch {
      ht.errors++;
    }
  return !0;
}
function Bd(e, t, n) {
  return typeof n != "function" ? () => {
  } : (Lt[e] || (Lt[e] = {}), Lt[e][t] || (Lt[e][t] = []), Lt[e][t].push(n), ht.listenersAdded++, () => {
    cv(e, t, n);
  });
}
function cv(e, t, n) {
  const s = Lt[e];
  if (!s) return;
  const r = s[t];
  if (!r) return;
  const i = r.indexOf(n);
  i >= 0 && (r.splice(i, 1), ht.listenersRemoved++);
}
function XD(e, t) {
  if (typeof t != "function") return () => {
  };
  const n = [], s = Object.keys(Lt);
  for (let r = 0; r < s.length; r++)
    n.push(Bd(s[r], e, t));
  return () => {
    for (let r = 0; r < n.length; r++)
      n[r]();
  };
}
function JD(e) {
  return typeof e != "function" ? () => {
  } : (vr.push(e), ht.listenersAdded++, () => {
    const t = vr.indexOf(e);
    t >= 0 && (vr.splice(t, 1), ht.listenersRemoved++);
  });
}
function uv(e, t, n) {
  if (typeof n != "function") return () => {
  };
  let s;
  return s = Bd(e, t, (r) => {
    s(), n(r);
  }), s;
}
function QD(e, t, n) {
  return n = n || 1e4, new Promise((s, r) => {
    let i;
    const o = uv(e, t, (a) => {
      i && clearTimeout(i), s(a);
    });
    i = setTimeout(() => {
      o(), r(new Error(`Timeout waiting for ${t} on ${e}`));
    }, n);
  });
}
function dv(e) {
  const t = e.target, n = Object.keys(Ze);
  for (let s = 0; s < n.length; s++) {
    const r = n[s], i = Ud(r);
    if (i && i.contains(t)) {
      qa(r, Rn.FOCUS_ENTER, { element: t });
      break;
    }
  }
}
function pv(e) {
  const t = e.target, n = e.relatedTarget, s = Object.keys(Ze);
  for (let r = 0; r < s.length; r++) {
    const i = s[r], o = Ud(i);
    if (o && o.contains(t) && !o.contains(n)) {
      qa(i, Rn.FOCUS_LEAVE, {
        element: t,
        relatedTarget: n
      });
      break;
    }
  }
}
function fv(e) {
  const t = e.target, n = Object.keys(Ze);
  for (let s = 0; s < n.length; s++) {
    const r = n[s], i = Ud(r);
    if (i && i.contains(t)) {
      qa(r, Rn.CLICK, {
        element: t,
        x: e.clientX,
        y: e.clientY
      });
      break;
    }
  }
}
function Ml() {
  return $r.value ? !0 : typeof document > "u" ? !1 : (document.addEventListener("focusin", dv, !0), document.addEventListener("focusout", pv, !0), document.addEventListener("click", fv, !0), Xi.value = !0, $r.value = !0, !0);
}
function ZD() {
  return $r.value && (Xi.value && (document.removeEventListener("focusin", dv, !0), document.removeEventListener("focusout", pv, !0), document.removeEventListener("click", fv, !0), Xi.value = !1), $r.value = !1), !0;
}
function eO(e) {
  e = e || {};
  let t = Gn.slice();
  return e.region && (t = t.filter((n) => n.region === e.region)), e.type && (t = t.filter((n) => n.type === e.type)), e.limit && (t = t.slice(-e.limit)), t;
}
function tO() {
  Gn.length = 0;
}
function nO(e) {
  Ya.value = Math.max(10, Math.min(1e3, e));
}
function Fd() {
  const e = {}, t = Object.keys(Lt);
  for (let n = 0; n < t.length; n++) {
    const s = t[n], r = Lt[s];
    let i = 0;
    const o = Object.keys(r);
    for (let a = 0; a < o.length; a++)
      i += r[o[a]].length;
    e[s] = i;
  }
  return e._global = vr.length, e;
}
function Vd() {
  return {
    eventsEmitted: ht.eventsEmitted,
    listenersAdded: ht.listenersAdded,
    listenersRemoved: ht.listenersRemoved,
    errors: ht.errors,
    historySize: Gn.length
  };
}
function sO() {
  const e = Fd();
  let t = 0;
  const n = Object.keys(e);
  for (let a = 0; a < n.length; a++)
    t += e[n[a]];
  const s = {
    initialized: $r.value,
    domListenersAttached: Xi.value,
    noErrors: ht.errors === 0,
    historyNotFull: Gn.length < Ya.value
  }, r = Object.keys(s);
  let i = 0;
  for (let a = 0; a < r.length; a++)
    s[r[a]] && i++;
  const o = r.length;
  return {
    status: i === o ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${i}/${o}`,
    checks: s,
    totalListeners: t,
    listenerCounts: e,
    metrics: Vd(),
    version: Hd,
    moduleId: Ga,
    timestamp: Date.now()
  };
}
function rO() {
  return {
    moduleId: Ga,
    version: Hd,
    initialized: $r.value,
    domListenersAttached: Xi.value,
    eventTypes: Rn,
    listenerCounts: Fd(),
    historySize: Gn.length,
    historyLimit: Ya.value,
    metrics: Vd(),
    timestamp: Date.now()
  };
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  Ml();
}) : Ml());
const He = {
  VERSION: Hd,
  MODULE_ID: Ga,
  EVENTS: Rn,
  emit: qa,
  on: Bd,
  off: cv,
  onAny: XD,
  onGlobal: JD,
  once: uv,
  waitFor: QD,
  init: Ml,
  destroy: ZD,
  getHistory: eO,
  clearHistory: tO,
  setHistoryLimit: nO,
  getListenerCounts: Fd,
  getMetrics: Vd,
  healthCheck: sO,
  info: rO
}, Gd = "1.3.0-FIX-MISSING-EXPORTS", Yd = "app-shell-theme-integration", X = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system"
}), hv = "app-shell-theme", Pl = {
  light: {
    "--dsd-bg-primary": "#ffffff",
    "--dsd-bg-secondary": "#f8fafc",
    "--dsd-bg-tertiary": "#f1f5f9",
    "--dsd-text-primary": "#1e293b",
    "--dsd-text-secondary": "#64748b",
    "--dsd-text-muted": "#94a3b8",
    "--dsd-border-color": "#e2e8f0",
    "--dsd-shadow-color": "rgba(0, 0, 0, 0.1)",
    "--dsd-primary": "#3b82f6",
    "--dsd-primary-hover": "#2563eb",
    "--dsd-success": "#22c55e",
    "--dsd-warning": "#f59e0b",
    "--dsd-error": "#ef4444"
  },
  dark: {
    "--dsd-bg-primary": "#000000",
    "--dsd-bg-secondary": "#0a0a0a",
    "--dsd-bg-tertiary": "#141414",
    "--dsd-text-primary": "#f8fafc",
    "--dsd-text-secondary": "#cbd5e1",
    "--dsd-text-muted": "#64748b",
    "--dsd-border-color": "#1f1f1f",
    "--dsd-shadow-color": "rgba(0, 0, 0, 0.5)",
    "--dsd-primary": "#60a5fa",
    "--dsd-primary-hover": "#3b82f6",
    "--dsd-success": "#4ade80",
    "--dsd-warning": "#fbbf24",
    "--dsd-error": "#f87171"
  }
}, sa = Pl, K = {
  currentTheme: null,
  resolvedTheme: null,
  systemPreference: null,
  mediaQuery: null,
  initialized: !1,
  listeners: [],
  subscribers: [],
  regionThemes: {},
  metrics: {
    themeChanges: 0,
    systemPreferenceChanges: 0,
    errors: 0
  }
}, iO = {
  defaultTheme: "system",
  storageKey: "app-shell-theme",
  transitionDuration: 200,
  respectSystemPreference: !0
}, Ke = K;
function yo() {
  return K.currentTheme;
}
function oO(e) {
  K.currentTheme = e;
}
function fn() {
  return K.resolvedTheme;
}
function aO(e) {
  K.resolvedTheme = e;
}
function qd() {
  return K.systemPreference;
}
function gv() {
  return K.initialized;
}
function Wd() {
  return K.listeners;
}
function lO(e) {
  K.listeners.push(e);
}
function cO(e) {
  const t = K.listeners.indexOf(e);
  t >= 0 && K.listeners.splice(t, 1);
}
function Wa() {
  return K.regionThemes;
}
function uO(e, t) {
  K.regionThemes[e] = t;
}
function dO(e) {
  delete K.regionThemes[e];
}
function pO(e) {
  return !!K.regionThemes[e];
}
function fO() {
  return {
    themeChanges: K.metrics.themeChanges,
    systemPreferenceChanges: K.metrics.systemPreferenceChanges,
    errors: K.metrics.errors
  };
}
function zr(e) {
  K.metrics[e] !== void 0 && K.metrics[e]++;
}
function hO() {
  return Object.assign({}, iO);
}
function mv(e, t) {
  for (let n = 0; n < K.subscribers.length; n++)
    try {
      K.subscribers[n](e, t);
    } catch {
    }
  for (let n = 0; n < K.listeners.length; n++)
    try {
      K.listeners[n](e, t);
    } catch {
    }
}
function vv() {
  return typeof window > "u" || !window.matchMedia ? X.LIGHT : window.matchMedia("(prefers-color-scheme: dark)").matches ? X.DARK : X.LIGHT;
}
function gO(e) {
  return e === X.SYSTEM || e === "system" ? vv() : e === X.LIGHT || e === "light" ? "light" : e === X.DARK || e === "dark" ? "dark" : "light";
}
function mO(e, t) {
  t = t || {};
  const n = hO();
  if (e === X.SYSTEM ? (e = vv(), Ke.usingSystem = !0) : Ke.usingSystem = !1, !X[e.toUpperCase()] && e !== "light" && e !== "dark")
    return { ok: !1, error: `Invalid theme: ${e}` };
  const s = Ke.currentTheme;
  if (Ke.currentTheme = e, Kd(e), t.persist !== !1 && n.persistTheme)
    try {
      localStorage.setItem(hv, JSON.stringify({
        theme: Ke.usingSystem ? X.SYSTEM : e,
        appliedAt: Date.now()
      }));
    } catch {
    }
  return zr("themeChanges"), mv("theme-change", {
    previous: s,
    current: e,
    usingSystem: Ke.usingSystem
  }), { ok: !0, theme: e };
}
function Kd(e) {
  if (typeof document > "u") return;
  const t = document.documentElement, n = document.body;
  t.classList.remove("theme-light", "theme-dark"), t.classList.add(`theme-${e}`), n && (n.classList.remove("theme-light", "theme-dark"), n.classList.add(`theme-${e}`)), t.setAttribute("data-theme", e);
  const s = sa[e] || sa.light, r = Object.keys(s);
  for (let o = 0; o < r.length; o++)
    t.style.setProperty(r[o], s[r[o]]);
  const i = document.querySelector('meta[name="theme-color"]');
  i && i.setAttribute("content", e === X.DARK ? "#1a1a1a" : "#ffffff");
}
function vO() {
  if (typeof window > "u" || !window.matchMedia)
    return () => {
    };
  const e = window.matchMedia("(prefers-color-scheme: dark)"), t = (n) => {
    if (Ke.usingSystem) {
      const s = n.matches ? X.DARK : X.LIGHT;
      Ke.currentTheme = s, Kd(s), mv("system-theme-change", { theme: s });
    }
  };
  return e.addEventListener ? e.addEventListener("change", t) : e.addListener && e.addListener(t), Ke.systemWatcherActive = !0, () => {
    e.removeEventListener ? e.removeEventListener("change", t) : e.removeListener && e.removeListener(t), Ke.systemWatcherActive = !1;
  };
}
function yO() {
  try {
    const e = localStorage.getItem(hv);
    return e ? JSON.parse(e).theme : null;
  } catch {
    return null;
  }
}
function bO(e) {
  e = e || {};
  const t = yO(), n = e.initial || t || X.SYSTEM;
  return mO(n, { persist: !1 }), e.watchSystem !== !1 && vO(), { ok: !0, theme: Ke.currentTheme };
}
function Nl(e) {
  return bO(e);
}
function EO() {
  Ke.currentTheme = null, Ke.usingSystem = !1, Ke.systemWatcherActive = !1, Ke.initialized = !1;
}
function yv(e, t) {
  if (!e) return;
  e.classList.remove("theme-light", "theme-dark"), e.classList.add(`theme-${t}`), e.setAttribute("data-theme", t);
  const n = sa[t] || sa.light, s = Object.keys(n);
  for (let r = 0; r < s.length; r++)
    e.style.setProperty(s[r], n[s[r]]);
}
function kO(e, t) {
  const n = Wd();
  for (let s = 0; s < n.length; s++)
    try {
      n[s]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      zr("errors");
    }
}
function SO() {
  return yo();
}
function TO() {
  return fn();
}
function Xd(e, t) {
  t = t || {};
  const n = t.persist !== !1;
  if (e !== X.LIGHT && e !== X.DARK && e !== X.SYSTEM)
    return zr("errors"), !1;
  const s = yo(), r = fn();
  oO(e);
  const i = gO(e);
  return aO(i), Kd(i), n && W.setThemeMode(e), zr("themeChanges"), kO("theme-change", {
    oldTheme: s,
    newTheme: e,
    oldResolved: r,
    newResolved: i
  }), !0;
}
function wO() {
  const e = fn() === "light" ? X.DARK : X.LIGHT;
  return Xd(e), e;
}
function CO() {
  return Xd(X.SYSTEM);
}
function AO() {
  return fn() === "dark";
}
function IO() {
  return fn() === "light";
}
function DO() {
  return yo() === X.SYSTEM;
}
function OO() {
  return qd();
}
function bv(e, t) {
  const n = Wd();
  for (let s = 0; s < n.length; s++)
    try {
      n[s]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      zr("errors");
    }
}
function xO(e, t) {
  if (t !== "light" && t !== "dark")
    return zr("errors"), !1;
  const n = ke(e);
  return n ? (uO(e, t), yv(n, t), bv("region-theme-change", { region: e, theme: t }), !0) : !1;
}
function RO(e) {
  if (!pO(e)) return !1;
  dO(e);
  const t = ke(e);
  return t && yv(t, fn()), bv("region-theme-cleared", { region: e }), !0;
}
function _O(e) {
  return Wa()[e] || fn();
}
function LO() {
  const e = Wa(), t = {}, n = Object.keys(e);
  for (let s = 0; s < n.length; s++)
    t[n[s]] = e[n[s]];
  return t;
}
function MO(e) {
  return typeof document > "u" ? null : (e.startsWith("--") || (e = `--${e}`), getComputedStyle(document.documentElement).getPropertyValue(e).trim() || null);
}
function PO(e, t) {
  typeof document > "u" || (e.startsWith("--") || (e = `--${e}`), document.documentElement.style.setProperty(e, t));
}
function Ev() {
  const e = fn();
  return Pl[e] || Pl.dark;
}
function Jd() {
  return fO();
}
function NO() {
  const e = yo(), t = fn(), n = Jd(), s = Wa(), r = {
    initialized: gv(),
    hasTheme: !!e,
    hasResolved: !!t,
    noErrors: n.errors === 0
  }, i = Object.keys(r);
  let o = 0;
  for (let c = 0; c < i.length; c++)
    r[i[c]] && o++;
  const a = i.length;
  let l = "UNHEALTHY";
  return o === a ? l = "HEALTHY" : o >= 2 && (l = "DEGRADED"), {
    status: l,
    score: `${o}/${a}`,
    checks: r,
    currentTheme: e,
    resolvedTheme: t,
    systemPreference: qd(),
    isDarkMode: t === "dark",
    regionOverrides: Object.keys(s).length,
    metrics: n,
    version: Gd,
    moduleId: Yd,
    timestamp: Date.now()
  };
}
function $O() {
  const e = yo(), t = fn();
  return {
    moduleId: Yd,
    version: Gd,
    initialized: gv(),
    currentTheme: e,
    resolvedTheme: t,
    systemPreference: qd(),
    isDarkMode: t === "dark",
    isLightMode: t === "light",
    isSystemTheme: e === X.SYSTEM,
    regionThemes: Wa(),
    availableThemes: X,
    themeVariables: Ev(),
    listenerCount: Wd().length,
    metrics: Jd(),
    timestamp: Date.now()
  };
}
function zO(e) {
  return typeof e != "function" ? () => {
  } : (lO(e), () => {
    cO(e);
  });
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  Nl();
}) : Nl());
const se = {
  VERSION: Gd,
  MODULE_ID: Yd,
  THEMES: X,
  init: Nl,
  destroy: EO,
  getTheme: SO,
  getResolvedTheme: TO,
  setTheme: Xd,
  toggleTheme: wO,
  useSystemTheme: CO,
  isDarkMode: AO,
  isLightMode: IO,
  isSystemTheme: DO,
  getSystemPreference: OO,
  setRegionTheme: xO,
  clearRegionTheme: RO,
  getRegionTheme: _O,
  getRegionThemes: LO,
  getThemeVariable: MO,
  setThemeVariable: PO,
  getThemeVariables: Ev,
  subscribe: zO,
  getMetrics: Jd,
  healthCheck: NO,
  info: $O
};
function jO(e) {
  return (t = {}) => {
    const n = kt.validateInitOptions(t);
    if (!n.valid)
      return e.logger.error("Invalid init options", { errors: n.errors }), Promise.resolve({ ok: !1, error: "Invalid configuration", validationErrors: n.errors });
    n.warnings.length > 0 && e.logger.warn("Init options warnings", { warnings: n.warnings });
    const s = t.force === !0, r = performance.now();
    return ue.mark("app-shell:init:start"), Ir("kernel:init:called", { force: s, alreadyInitialized: e.isInitialized() }), e.logger.debug("Init called", { force: s, alreadyInitialized: e.isInitialized() }), Z.trackCall("AppShell", "init"), e.isInitialized() && !s ? Promise.resolve({ ok: !0, alreadyInitialized: !0, status: e.getStatus() }) : e.isInitialized() && s ? e.shutdown().then(() => e.doInit(r, t)) : e.doInit(r, t);
  };
}
function HO(e) {
  return (t, n = {}) => (Ir("kernel:init:start"), e.logger.debug("Init starting"), F0().then((s) => {
    if (!s) throw new Error("Mount failed");
    return cs("globalState", kn.globalState, {}, e.logger, e.metrics);
  }).then(() => cs("layout", kn.layout, {}, e.logger, e.metrics)).then(() => {
    var s, r, i;
    return e.setInitialized(!0), e.metrics.initCount++, e.metrics.lastInitAt = Date.now(), e.metrics.lastActivity = Date.now(), e.metrics.initDuration = Math.round(performance.now() - t), ue.mark("app-shell:init:end"), ue.measure("app-shell:init", "app-shell:init:start", "app-shell:init:end"), ue.setInitDuration(e.metrics.initDuration), (s = n.healthCheck) != null && s.autoEnabled && Ie.start({
      interval: n.healthCheck.interval || 3e4,
      onDegraded: (o) => e.logger.warn("Health degraded", o),
      onUnhealthy: (o) => e.logger.error("Health unhealthy", o),
      onRecovered: (o) => e.logger.debug("Health recovered", o)
    }), n.logger && q.configure(n.logger), (r = n.cache) != null && r.ttlMs && Tf(n.cache.ttlMs), n.circuitBreaker && Y.setDefaultConfig(n.circuitBreaker), n.layoutPreset && Ae.apply(n.layoutPreset), n.a11yPresets && n.a11yPresets.forEach((o) => U.enable(o)), n.animations && P.configure(n.animations), (i = n.serviceWorker) != null && i.autoRegister && C.register(n.serviceWorker), n.offline && B.configure(n.offline), n.notifications && G.configure(n.notifications), n.shortcuts && n.shortcuts.forEach((o) => D.register(o.combo, o.handler, o)), n.gestures && O.configure(n.gestures), n.debugPreset && _.apply(n.debugPreset), n.regionMetrics && M.configure(n.regionMetrics), n.commands && n.commands.forEach((o) => Q.register(o)), L.trackPerformance("app-shell:init", e.metrics.initDuration, { adapters: sr().length }), Ir("kernel:init:complete", { initCount: e.metrics.initCount, duration: e.metrics.initDuration, adaptersConnected: sr().length }), e.logger.debug("Init complete", { duration: `${e.metrics.initDuration}ms`, adapters: sr().length }), { ok: !0, alreadyInitialized: !1, duration: e.metrics.initDuration, status: e.getStatus() };
  }).catch((s) => (sh(s, { context: "init" }), e.logger.error("Init failed", s), e.metrics.errors++, L.trackError(s, { context: "init" }), { ok: !1, error: s.message, status: e.getStatus() })));
}
function UO(e) {
  return () => (Ir("kernel:shutdown:called"), e.logger.info("Shutdown called"), Z.trackCall("AppShell", "shutdown"), Promise.resolve().then(() => (Ie.stop(), me.disable(), L.flushAll(), le.persist(), P.cancelAll(), Rt.destroyAll(), G.dismissAll(), D.destroy(), O.destroy(), Q.hide(), H.stopAutoSnapshot(), B.destroy(), C.stopPeriodicCheck(), Y.resetAll(), je.destroyAll(), ve.deactivate(), ne.destroy(), ce.destroy(), He.destroy(), se.destroy(), ue.destroy(), ae.close(), _.disable(), M.reset(), ze.clearAll(), u0(), e.setInitialized(!1), e.metrics.shutdownCount++, e.metrics.lastShutdownAt = Date.now(), V0())).then((t) => (Ir("kernel:shutdown:complete"), e.logger.info("Shutdown complete"), { ok: !0, result: t })).catch((t) => (sh(t, { context: "shutdown" }), e.logger.error("Shutdown failed", t), e.metrics.errors++, { ok: !1, error: t.message })));
}
function BO(e) {
  return () => {
    const t = G0();
    return t && (cs("auth", kn.auth, null, e.logger, e.metrics), cs("theme", kn.theme, null, e.logger, e.metrics), cs("notification", kn.notification, null, e.logger, e.metrics), cs("router", kn.router, null, e.logger, e.metrics), ue.setBootTime(ao()), e.logger.debug("Finalized - Phase 2 Complete"), typeof window < "u" && (window.AppShellReady = !0)), t;
  };
}
const FO = "4.2.1-P2-ENTERPRISE", Qd = "app-shell-readiness", Zd = et({ moduleId: Qd });
function VO(e) {
  return Zd.get(e);
}
let Yn = [], $l = 0, zl = null;
const As = {
  callbacksRegistered: 0,
  callbacksExecuted: 0,
  timeouts: 0,
  errors: 0
};
function kv(e, t) {
  t || (t = {}), Zd.init();
  try {
    const n = VO("telemetry");
    n && n.event && n.event(`${Qd}:${e}`, t);
  } catch {
  }
}
function GO(e) {
  if (typeof e != "function") return !1;
  const t = e.toString();
  return !(t.indexOf("eval(") !== -1 || t.indexOf("Function(") !== -1);
}
function Sv(e) {
  const t = Array.prototype.slice.call(arguments, 1);
  try {
    return e.apply(null, t);
  } catch {
    return As.errors++, null;
  }
}
function YO() {
  if (Yn.length === 0) return;
  const e = Dn(), t = Yn.splice(0);
  for (let n = 0; n < t.length; n++)
    Sv(t[n], e), As.callbacksExecuted++;
  $l++, kv("pending-notified", {
    count: t.length,
    notifiedCount: $l,
    bootTime: ao()
  });
}
function qO() {
  zl || (zl = Yf((e) => {
    e.ready && Yn.length > 0 && YO();
  }));
}
function Tv(e) {
  return GO(e) ? (As.callbacksRegistered++, ha() ? (Sv(e, Dn()), As.callbacksExecuted++, () => {
  }) : (Yn.push(e), qO(), function() {
    const t = Yn.indexOf(e);
    t >= 0 && Yn.splice(t, 1);
  })) : (As.errors++, () => {
  });
}
function WO(e) {
  return e === void 0 && (e = 1e4), new Promise((t, n) => {
    if (ha()) {
      t(Dn());
      return;
    }
    let s = !1, r = null;
    const i = Tv((o) => {
      s || (s = !0, r && clearTimeout(r), t(o));
    });
    r = setTimeout(() => {
      s || (s = !0, i(), As.timeouts++, kv("timeout", { timeout: e, pending: Yn.length }), n(new Error(`Shell ready timeout after ${e}ms`)));
    }, e);
  });
}
function wv() {
  const e = Zd.snapshot();
  return {
    moduleId: Qd,
    version: FO,
    isReady: ha(),
    pendingCallbacks: Yn.length,
    notifiedCount: $l,
    hasStoreSubscription: !!zl,
    bootTime: ao(),
    metrics: Object.assign({}, As),
    portsStatus: { initialized: e._initialized },
    note: "Este módulo é DERIVAÇÃO do Store",
    timestamp: Date.now()
  };
}
const ep = "1.0.0-AAA", tp = "app-shell-region-slots", Mt = Object.freeze({
  PREPEND: "prepend",
  APPEND: "append",
  REPLACE: "replace",
  BEFORE: "before",
  AFTER: "after"
}), KO = "data-slot-id", yr = /* @__PURE__ */ new Map(), z = {
  slots: {},
  slotContents: {},
  listeners: [],
  subscribers: [],
  metrics: {
    slotsRegistered: 0,
    slotsUnregistered: 0,
    contentInjections: 0,
    contentClears: 0,
    errors: 0
  }
}, lf = Object.keys(Ze);
for (let e = 0; e < lf.length; e++)
  z.slots[lf[e]] = {};
function ii() {
  return z.slots;
}
function XO(e, t) {
  return z.slots[e] && z.slots[e][t] || null;
}
function JO(e, t, n) {
  z.slots[e] || (z.slots[e] = {}), z.slots[e][t] = n;
}
function QO(e, t) {
  z.slots[e] && delete z.slots[e][t];
}
function ZO() {
  return z.slotContents;
}
function ex(e) {
  return z.slotContents[e] || null;
}
function tx(e) {
  delete z.slotContents[e];
}
function Cv() {
  return z.listeners;
}
function nx(e) {
  z.listeners.push(e);
}
function sx(e) {
  const t = z.listeners.indexOf(e);
  t >= 0 && z.listeners.splice(t, 1);
}
function np(e, t) {
  for (let n = 0; n < z.subscribers.length; n++)
    try {
      z.subscribers[n](e, t);
    } catch {
    }
  for (let n = 0; n < z.listeners.length; n++)
    try {
      z.listeners[n](e, t);
    } catch {
    }
}
function rx() {
  return {
    slotsRegistered: z.metrics.slotsRegistered,
    slotsUnregistered: z.metrics.slotsUnregistered,
    contentInjections: z.metrics.contentInjections,
    contentClears: z.metrics.contentClears,
    errors: z.metrics.errors
  };
}
function jr(e) {
  z.metrics[e] !== void 0 && z.metrics[e]++;
}
function Av(e, t) {
  const n = Cv();
  for (let s = 0; s < n.length; s++)
    try {
      n[s]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      jr("errors");
    }
}
function ix() {
  return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function Iv(e, t, n, s) {
  s = s || {};
  const r = s.position || Mt.APPEND, i = s.priority || 0, o = ke(e);
  if (!o)
    return jr("errors"), { ok: !1, error: `Region not found: ${e}` };
  let a = o.querySelector(`[data-slot-id="${t}"]`);
  if (a || (a = document.createElement("div"), a.setAttribute("data-slot-id", t), a.setAttribute("data-slot-priority", i), a.className = "region-slot"), typeof n == "string" ? a.innerHTML = n : n instanceof HTMLElement && (a.innerHTML = "", a.appendChild(n)), !a.parentNode) {
    const l = o.querySelectorAll("[data-slot-id]");
    let c = !1;
    for (let u = 0; u < l.length; u++) {
      const h = parseInt(l[u].getAttribute("data-slot-priority") || "0", 10);
      if (i > h) {
        o.insertBefore(a, l[u]), c = !0;
        break;
      }
    }
    if (!c)
      switch (r) {
        case Mt.PREPEND:
          o.insertBefore(a, o.firstChild);
          break;
        case Mt.BEFORE:
          if (s.reference) {
            const u = o.querySelector(s.reference);
            u ? o.insertBefore(a, u) : o.appendChild(a);
          } else
            o.appendChild(a);
          break;
        case Mt.AFTER:
          if (s.reference) {
            const u = o.querySelector(s.reference);
            u && u.nextSibling ? o.insertBefore(a, u.nextSibling) : o.appendChild(a);
          } else
            o.appendChild(a);
          break;
        case Mt.REPLACE:
          o.innerHTML = "", o.appendChild(a);
          break;
        default:
          o.appendChild(a);
      }
  }
  return yr.has(e) || yr.set(e, /* @__PURE__ */ new Map()), yr.get(e).set(t, {
    element: a,
    priority: i,
    position: r,
    persistent: s.persistent || !1
  }), jr("contentInjections"), np(Rn.CONTENT_UPDATED, { region: e, slot: t }), { ok: !0, element: a };
}
function sp(e, t) {
  const n = yr.get(e);
  if (!n) return !1;
  const s = n.get(t);
  return s ? (s.element && s.element.parentNode && s.element.parentNode.removeChild(s.element), n.delete(t), jr("contentClears"), np(Rn.CONTENT_CLEARED, { region: e, slot: t }), !0) : !1;
}
function ox(e) {
  const t = yr.get(e);
  if (!t) return 0;
  let n = 0;
  return t.forEach((s, r) => {
    s.persistent || (sp(e, r), n++);
  }), n;
}
function ax(e, t, n) {
  const s = yr.get(e);
  if (!s) return !1;
  const r = s.get(t);
  return !r || !r.element ? !1 : (typeof n == "string" ? r.element.innerHTML = n : n instanceof HTMLElement && (r.element.innerHTML = "", r.element.appendChild(n)), np(Rn.CONTENT_UPDATED, { region: e, slot: t }), !0);
}
function Dv(e, t) {
  t = t || {};
  const n = ii();
  n[e] || (n[e] = {});
  const s = ix(), r = {
    id: s,
    name: t.name || "default",
    position: t.position || Mt.APPEND,
    priority: t.priority || 0,
    persistent: t.persistent === !0,
    createdAt: Date.now()
  };
  return JO(e, s, r), jr("slotsRegistered"), Av("slot-registered", { region: e, slotId: s, config: r }), s;
}
function lx(e, t) {
  const n = ii();
  return !n[e] || !n[e][t] ? !1 : (sp(e, t), QO(e, t), tx(t), jr("slotsUnregistered"), Av("slot-unregistered", { region: e, slotId: t }), !0);
}
function cx(e, t) {
  const n = XO(e, t);
  return n ? Object.assign({}, n) : null;
}
function ux(e) {
  const t = ii()[e];
  if (!t) return [];
  const n = [], s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    n.push(Object.assign({}, t[s[r]]));
  return n.sort((r, i) => i.priority - r.priority);
}
function dx(e) {
  return ex(e);
}
function px(e, t) {
  const n = ke(e);
  return n ? !!n.querySelector(`[${KO}="${t}"]`) : !1;
}
function fx(e, t) {
  const n = ii()[e];
  if (!n) return [];
  const s = [], r = Object.keys(n);
  for (let i = 0; i < r.length; i++) {
    const o = n[r[i]];
    o.name === t && s.push(Object.assign({}, o));
  }
  return s;
}
function Ov(e, t, n) {
  const s = Dv(e, n);
  return s && Iv(e, s, t), s;
}
function hx(e, t, n) {
  return Ov(e, n, {
    name: t,
    position: t === "header" ? Mt.PREPEND : Mt.APPEND,
    priority: t === "header" ? 1e3 : -1e3,
    persistent: !0
  });
}
function rp() {
  return rx();
}
function gx() {
  const e = ii(), t = rp();
  let n = 0;
  const s = Object.keys(e);
  for (let c = 0; c < s.length; c++)
    n += Object.keys(e[s[c]]).length;
  const r = {
    initialized: !0,
    noErrors: t.errors === 0,
    slotsTracked: n >= 0
  }, i = Object.keys(r);
  let o = 0;
  for (let c = 0; c < i.length; c++)
    r[i[c]] && o++;
  const a = i.length;
  let l = "UNHEALTHY";
  return o === a ? l = "HEALTHY" : o >= 1 && (l = "DEGRADED"), {
    status: l,
    score: `${o}/${a}`,
    checks: r,
    totalSlots: n,
    metrics: t,
    version: ep,
    moduleId: tp,
    timestamp: Date.now()
  };
}
function mx() {
  const e = ii(), t = ZO(), n = {}, s = Object.keys(e);
  for (let r = 0; r < s.length; r++)
    n[s[r]] = Object.keys(e[s[r]]).length;
  return {
    moduleId: tp,
    version: ep,
    positions: Mt,
    slotsByRegion: n,
    totalContents: Object.keys(t).length,
    listenerCount: Cv().length,
    metrics: rp(),
    timestamp: Date.now()
  };
}
function vx(e) {
  return typeof e != "function" ? () => {
  } : (nx(e), () => {
    sx(e);
  });
}
const Ce = {
  VERSION: ep,
  MODULE_ID: tp,
  POSITIONS: Mt,
  registerSlot: Dv,
  unregisterSlot: lx,
  injectContent: Iv,
  clearSlot: sp,
  clearRegionSlots: ox,
  updateSlot: ax,
  getSlot: cx,
  getRegionSlots: ux,
  getSlotContent: dx,
  hasContent: px,
  findSlotsByName: fx,
  inject: Ov,
  createPersistentSlot: hx,
  subscribe: vx,
  getMetrics: rp,
  healthCheck: gx,
  info: mx
}, cf = "dsd-region--loading", uf = "dsd-region--skeleton", yx = "dsd-region__spinner", xv = "dsd-region__loading-overlay";
function bx() {
  const e = document.createElement("div");
  return e.className = yx, e.innerHTML = '<div class="dsd-spinner"><div></div><div></div><div></div></div>', e.setAttribute("role", "status"), e.setAttribute("aria-label", "Loading"), e;
}
function Ex(e) {
  const t = document.createElement("div");
  return t.className = xv, e && t.appendChild(bx()), t;
}
function df(e) {
  const t = e.querySelector(`.${xv}`);
  t && t.remove();
}
function kx(e, t) {
  const n = t.loadingState[e];
  return n ? n.loading : !1;
}
function oi(e, t, n, s) {
  n = n || {};
  const r = n.skeleton === !0, i = n.overlay !== !1, o = n.spinner !== !1, a = ke(e);
  if (!a)
    return s.metrics.errors++, !1;
  let l = s.loadingState[e];
  if (l || (l = { loading: !1, skeleton: !1, startedAt: null }, s.loadingState[e] = l), t)
    a.classList.add(cf), a.setAttribute("aria-busy", "true"), r ? (a.classList.add(uf), l.skeleton = !0) : i && (df(a), a.appendChild(Ex(o))), l.loading = !0, l.startedAt = Date.now(), s.metrics.loadingStarts++, s.notify("loading-start", { region: e, skeleton: r });
  else {
    a.classList.remove(cf, uf), a.setAttribute("aria-busy", "false"), df(a);
    const c = l.startedAt ? Date.now() - l.startedAt : 0;
    l.loading = !1, l.skeleton = !1, l.startedAt = null, s.metrics.loadingEnds++, s.notify("loading-end", { region: e, duration: c });
  }
  return !0;
}
function Sx(e, t, n) {
  return oi(e, !0, t, n);
}
function Tx(e, t) {
  return oi(e, !1, null, t);
}
function wx(e, t, n) {
  return oi(e, t, { skeleton: !0, overlay: !1 }, n);
}
function Cx(e, t, n) {
  const s = {}, r = Object.keys(e);
  for (let i = 0; i < r.length; i++)
    s[r[i]] = oi(r[i], e[r[i]], t, n);
  return s;
}
function Ax(e) {
  const t = Object.keys(e.loadingState);
  for (let n = 0; n < t.length; n++)
    e.loadingState[t[n]].loading && oi(t[n], !1, null, e);
  return e.notify("all-loading-ended", null), !0;
}
function Ix(e) {
  const t = {}, n = Object.keys(e.loadingState);
  for (let s = 0; s < n.length; s++) {
    const r = n[s], i = e.loadingState[r];
    t[r] = {
      loading: i.loading,
      skeleton: i.skeleton,
      duration: i.startedAt ? Date.now() - i.startedAt : null
    };
  }
  return t;
}
function Dx(e) {
  const t = [], n = Object.keys(e.loadingState);
  for (let s = 0; s < n.length; s++)
    e.loadingState[n[s]].loading && t.push(n[s]);
  return t;
}
function Ox(e) {
  const t = Object.keys(e.loadingState);
  for (let n = 0; n < t.length; n++)
    if (e.loadingState[t[n]].loading) return !0;
  return !1;
}
const ip = "1.1.0-MODULAR", op = "app-shell-region-loading", Pe = {
  loadingState: {},
  metrics: { loadingStarts: 0, loadingEnds: 0, errors: 0 },
  subscribers: [],
  notify(e, t) {
    for (let n = 0; n < this.subscribers.length; n++)
      try {
        this.subscribers[n](e, t);
      } catch {
      }
  }
}, jl = { defaultTimeout: 3e4, showSpinner: !0 };
function xx(e) {
  return kx(e, Pe);
}
function Rx(e, t, n) {
  return oi(e, t, n, Pe);
}
function _x(e, t) {
  return Sx(e, t, Pe);
}
function Lx(e) {
  return Tx(e, Pe);
}
function Mx(e, t) {
  return wx(e, t, Pe);
}
function Px(e, t) {
  return Cx(e, t, Pe);
}
function Nx() {
  return Ax(Pe);
}
function Rv() {
  return Ix(Pe);
}
function ap() {
  return Dx(Pe);
}
function $x() {
  return Ox(Pe);
}
function zx(e) {
  e.defaultTimeout !== void 0 && (jl.defaultTimeout = e.defaultTimeout), e.showSpinner !== void 0 && (jl.showSpinner = e.showSpinner);
}
function _v() {
  return Object.assign({}, jl);
}
function jx(e) {
  return typeof e != "function" ? () => {
  } : (Pe.subscribers.push(e), () => {
    const t = Pe.subscribers.indexOf(e);
    t >= 0 && Pe.subscribers.splice(t, 1);
  });
}
function lp() {
  return Object.assign({}, Pe.metrics);
}
function Hx() {
  const e = ap(), t = {
    noStuckLoading: e.length < 5,
    lowErrorRate: Pe.metrics.errors < Pe.metrics.loadingStarts * 0.1
  }, n = Object.values(t).filter(Boolean).length;
  return {
    status: n === 2 ? "HEALTHY" : "DEGRADED",
    score: `${n}/2`,
    checks: t,
    currentlyLoading: e,
    metrics: lp(),
    version: ip,
    moduleId: op,
    timestamp: Date.now()
  };
}
function Ux() {
  return {
    moduleId: op,
    version: ip,
    config: _v(),
    loadingState: Rv(),
    currentlyLoading: ap(),
    metrics: lp(),
    subscriberCount: Pe.subscribers.length,
    timestamp: Date.now()
  };
}
const Ye = {
  VERSION: ip,
  MODULE_ID: op,
  isLoading: xx,
  setLoading: Rx,
  startLoading: _x,
  endLoading: Lx,
  setSkeleton: Mx,
  setMultipleLoading: Px,
  endAllLoading: Nx,
  getLoadingState: Rv,
  getLoadingRegions: ap,
  isAnyLoading: $x,
  configure: zx,
  getConfig: _v,
  subscribe: jx,
  getMetrics: lp,
  healthCheck: Hx,
  info: Ux
}, cp = "1.0.0-AAA", up = "app-shell-region-resize", at = {
  sidebar: {
    property: "width",
    min: 200,
    max: 500,
    default: 280,
    unit: "px",
    cssVar: "--dsd-sidebar-width",
    persist: !0,
    persistKey: "sidebar.width"
  },
  footer: {
    property: "height",
    min: 32,
    max: 120,
    default: 48,
    unit: "px",
    cssVar: "--dsd-footer-height",
    persist: !0,
    persistKey: "footer.height"
  },
  "nav-rail": {
    property: "width",
    min: 48,
    max: 280,
    default: 64,
    unit: "px",
    cssVar: "--dsd-navrail-width",
    persist: !1
  },
  header: {
    property: "height",
    min: 48,
    max: 80,
    default: 56,
    unit: "px",
    cssVar: "--dsd-header-height",
    persist: !1
  }
}, xt = {}, dp = { value: null }, br = [], ra = { value: !1 }, wn = {
  resizes: 0,
  dragResizes: 0,
  errors: 0
}, Te = {
  active: !1,
  region: null,
  startPos: 0,
  startSize: 0,
  config: null
}, ul = Object.keys(at);
for (let e = 0; e < ul.length; e++)
  xt[ul[e]] = at[ul[e]].default;
function bo(e, t) {
  for (let n = 0; n < br.length; n++)
    try {
      br[n]({ type: e, data: t, timestamp: Date.now() });
    } catch {
      wn.errors++;
    }
}
function Lv(e, t, n) {
  return Math.min(Math.max(e, t), n);
}
function Bx(e, t, n) {
  typeof document < "u" && document.documentElement && document.documentElement.style.setProperty(e, t + n);
}
function Mv(e, t) {
  const n = at[e];
  if (!n) return !1;
  const s = ke(e);
  return s ? (s.style[n.property] = t + n.unit, n.cssVar && Bx(n.cssVar, t, n.unit), !0) : !1;
}
function Hl() {
  if (ra.value) return !0;
  const e = Object.keys(at);
  for (let t = 0; t < e.length; t++) {
    const n = e[t], s = at[n];
    if (s.persist && s.persistKey) {
      const r = W.getPreference(s.persistKey);
      r != null && (xt[n] = Lv(r, s.min, s.max));
    }
    Mv(n, xt[n]);
  }
  return ra.value = !0, bo("initialized", { sizes: Eo() }), !0;
}
function Fx(e) {
  return xt[e] !== void 0 ? xt[e] : null;
}
function Eo() {
  const e = {}, t = Object.keys(xt);
  for (let n = 0; n < t.length; n++)
    e[t[n]] = xt[t[n]];
  return e;
}
function pp(e, t, n) {
  const s = at[e];
  if (!s)
    return wn.errors++, !1;
  n = n || {};
  const r = n.persist !== !1, i = n.animate === !0, o = xt[e], a = Lv(t, s.min, s.max), l = ke(e);
  return l ? (i && (l.style.transition = `${s.property} 0.2s ease`), Mv(e, a), xt[e] = a, i && setTimeout(() => {
    l.style.transition = "";
  }, 200), r && s.persist && s.persistKey && W.setPreference(s.persistKey, a), wn.resizes++, bo("resize", {
    region: e,
    oldSize: o,
    newSize: a,
    property: s.property
  }), !0) : (wn.errors++, !1);
}
function Pv(e, t) {
  const n = at[e];
  return n ? pp(e, n.default, t) : !1;
}
function Vx(e) {
  const t = Object.keys(at);
  for (let n = 0; n < t.length; n++)
    Pv(t[n], e);
  return bo("reset-all", { sizes: Eo() }), !0;
}
function Gx(e) {
  const t = at[e];
  return t ? Object.assign({}, t) : null;
}
function Yx(e) {
  return at[e] !== void 0;
}
function Nv() {
  return Object.keys(at);
}
function ia(e) {
  var t, n, s, r;
  if (!Te.active) return;
  e.preventDefault();
  const i = (Te.config.property === "width" ? e.clientX || ((n = (t = e.touches) == null ? void 0 : t[0]) == null ? void 0 : n.clientX) || 0 : e.clientY || ((r = (s = e.touches) == null ? void 0 : s[0]) == null ? void 0 : r.clientY) || 0) - Te.startPos, o = Te.startSize + i;
  pp(Te.region, o, { persist: !1, animate: !1 });
}
function oa(e) {
  if (!Te.active) return;
  const t = Te.config, n = Te.region;
  t.persist && t.persistKey && W.setPreference(t.persistKey, xt[n]), wn.dragResizes++, bo("drag-end", { region: n, size: xt[n] }), Te.active = !1, Te.region = null, Te.config = null, dp.value = null, document.body.style.cursor = "", document.body.style.userSelect = "", document.removeEventListener("mousemove", ia), document.removeEventListener("mouseup", oa), document.removeEventListener("touchmove", ia), document.removeEventListener("touchend", oa);
}
function qx(e, t) {
  var n, s, r, i;
  const o = at[e];
  if (!o) return !1;
  t.preventDefault();
  const a = o.property === "width" ? t.clientX || ((s = (n = t.touches) == null ? void 0 : n[0]) == null ? void 0 : s.clientX) || 0 : t.clientY || ((i = (r = t.touches) == null ? void 0 : r[0]) == null ? void 0 : i.clientY) || 0;
  return Te.active = !0, Te.region = e, Te.startPos = a, Te.startSize = xt[e], Te.config = o, dp.value = e, document.body.style.cursor = o.property === "width" ? "col-resize" : "row-resize", document.body.style.userSelect = "none", document.addEventListener("mousemove", ia), document.addEventListener("mouseup", oa), document.addEventListener("touchmove", ia, { passive: !1 }), document.addEventListener("touchend", oa), bo("drag-start", { region: e, startSize: Te.startSize }), !0;
}
function fp() {
  return Te.active;
}
function hp() {
  return dp.value;
}
function Wx(e) {
  return typeof e != "function" ? () => {
  } : (br.push(e), function() {
    const t = br.indexOf(e);
    t >= 0 && br.splice(t, 1);
  });
}
function gp() {
  return {
    resizes: wn.resizes,
    dragResizes: wn.dragResizes,
    errors: wn.errors
  };
}
function Kx() {
  const e = {
    initialized: ra.value,
    hasConfigs: Object.keys(at).length > 0,
    notDragging: !Te.active,
    noErrors: wn.errors === 0
  }, t = Object.keys(e);
  let n = 0;
  for (let r = 0; r < t.length; r++)
    e[t[r]] && n++;
  const s = t.length;
  return {
    status: n === s ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/${s}`,
    checks: e,
    currentSizes: Eo(),
    isDragging: fp(),
    draggingRegion: hp(),
    metrics: gp(),
    version: cp,
    moduleId: up,
    timestamp: Date.now()
  };
}
function Xx() {
  return {
    moduleId: up,
    version: cp,
    initialized: ra.value,
    sizes: Eo(),
    configs: at,
    resizableRegions: Nv(),
    isDragging: fp(),
    draggingRegion: hp(),
    listenerCount: br.length,
    metrics: gp(),
    timestamp: Date.now()
  };
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  Hl();
}) : Hl());
const Ne = {
  VERSION: cp,
  MODULE_ID: up,
  init: Hl,
  getSize: Fx,
  getSizes: Eo,
  setSize: pp,
  resetSize: Pv,
  resetAllSizes: Vx,
  getConfig: Gx,
  isResizable: Yx,
  getResizableRegions: Nv,
  startDragResize: qx,
  isDragging: fp,
  getDraggingRegion: hp,
  subscribe: Wx,
  getMetrics: gp,
  healthCheck: Kx,
  info: Xx
}, mp = "1.0.0-AAA", vp = "app-shell-focus-manager", $v = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(", "), as = Object.freeze({
  FIRST: "first",
  LAST: "last",
  PREVIOUS: "previous",
  SPECIFIC: "specific",
  RESTORE: "restore"
}), $t = [], Ns = /* @__PURE__ */ new Map(), Zn = /* @__PURE__ */ new Map(), Hr = /* @__PURE__ */ new Map(), qn = [], xi = {
  element: null,
  timestamp: null,
  source: null
}, ls = {
  historyLimit: 50,
  announceOnFocus: !0,
  scrollIntoView: !0,
  preventScroll: !1,
  focusDelay: 0
}, Is = {
  focusChanges: 0,
  trapsActivated: 0,
  restores: 0,
  errors: 0
};
function Jx(e) {
  Is[e] !== void 0 && Is[e]++;
}
function Qx(e, t) {
  for (let n = 0; n < qn.length; n++)
    try {
      qn[n](e, t);
    } catch {
    }
}
function We(e, t) {
  if (t = t || {}, !e || typeof e.focus != "function")
    return !1;
  const n = t.delay || 0;
  function s() {
    try {
      return e.focus({ preventScroll: t.preventScroll }), t.scrollIntoView && e.scrollIntoView({ behavior: "smooth", block: "center" }), $t.push(xi.element), $t.length > 50 && $t.shift(), xi.element = e, Jx("focusChanges"), Qx("focus-change", { element: e }), !0;
    } catch {
      return !1;
    }
  }
  return n > 0 ? (setTimeout(s, n), !0) : s();
}
function Zx(e, t) {
  t = t || {};
  const n = t.strategy || as.FIRST, s = document.getElementById(e) || document.querySelector(`[data-region="${e}"]`);
  if (!s) return !1;
  const r = Ka(s);
  if (r.length === 0)
    return s.setAttribute("tabindex", "-1"), We(s, t);
  switch (n) {
    case as.FIRST:
      return We(r[0], t);
    case as.LAST:
      return We(r[r.length - 1], t);
    case as.SPECIFIC:
      if (t.selector) {
        const i = s.querySelector(t.selector);
        if (i) return We(i, t);
      }
      return We(r[0], t);
    case as.RESTORE:
      return xi.saved && s.contains(xi.saved) ? We(xi.saved, t) : We(r[0], t);
    default:
      return We(r[0], t);
  }
}
function eR(e) {
  e = e || document.body;
  const t = Ka(e), n = document.activeElement, s = t.indexOf(n);
  return s === -1 || s === t.length - 1 ? We(t[0]) : We(t[s + 1]);
}
function tR(e) {
  e = e || document.body;
  const t = Ka(e), n = document.activeElement, s = t.indexOf(n);
  return s <= 0 ? We(t[t.length - 1]) : We(t[s - 1]);
}
function nR() {
  return document.activeElement;
}
function sR(e) {
  return document.activeElement === e;
}
function Ka(e) {
  e = e || document.body;
  const t = e.querySelectorAll($v), n = [];
  for (let s = 0; s < t.length; s++) {
    const r = t[s];
    r.offsetParent !== null && !r.disabled && r.tabIndex >= 0 && n.push(r);
  }
  return n;
}
function rR(e) {
  const t = document.activeElement;
  return t && t !== document.body ? (Ns.set(e, t), { ok: !0, element: t }) : { ok: !1, error: "No active element" };
}
function iR(e, t) {
  const n = Ns.get(e);
  return n ? document.contains(n) ? (Is.restores++, We(n, t)) : (Ns.delete(e), { ok: !1, error: "Saved element no longer in DOM" }) : { ok: !1, error: `No saved focus for key: ${e}` };
}
function oR(e) {
  return e ? Ns.delete(e) : (Ns.clear(), !0);
}
function zv() {
  const e = [];
  return Ns.forEach((t, n) => {
    e.push(n);
  }), e;
}
function pf(e) {
  if (!e) return [];
  const t = e.querySelectorAll($v);
  return Array.prototype.filter.call(t, (n) => n.offsetParent !== null && getComputedStyle(n).visibility !== "hidden");
}
function jv(e) {
  for (let t = 0; t < qn.length; t++)
    try {
      qn[t](e);
    } catch {
    }
}
function aR(e, t, n) {
  n = n || {};
  const s = typeof t == "string" ? document.querySelector(t) : t;
  if (!s)
    return { ok: !1, error: "Container not found" };
  if (Zn.has(e))
    return { ok: !1, error: `Trap already exists: ${e}` };
  const r = pf(s);
  if (r.length === 0)
    return { ok: !1, error: "No focusable elements in container" };
  const i = (a) => {
    if (a.key !== "Tab") return;
    const l = pf(s);
    if (l.length === 0) return;
    const c = l[0], u = l[l.length - 1];
    a.shiftKey && document.activeElement === c ? (a.preventDefault(), u.focus()) : !a.shiftKey && document.activeElement === u && (a.preventDefault(), c.focus());
  };
  s.addEventListener("keydown", i);
  const o = {
    id: e,
    container: s,
    handler: i,
    active: !0,
    previousFocus: document.activeElement,
    createdAt: Date.now()
  };
  return Zn.set(e, o), Is.trapsActivated++, n.autoFocus !== !1 && r[0].focus(), jv({
    type: "trap-created",
    id: e,
    container: s,
    timestamp: Date.now()
  }), { ok: !0, trap: e };
}
function lR(e, t) {
  t = t || {};
  const n = Zn.get(e);
  return n ? (n.container.removeEventListener("keydown", n.handler), Zn.delete(e), t.restoreFocus !== !1 && n.previousFocus && document.contains(n.previousFocus) && n.previousFocus.focus(), jv({
    type: "trap-released",
    id: e,
    timestamp: Date.now()
  }), { ok: !0 }) : { ok: !1, error: `Trap not found: ${e}` };
}
function cR(e) {
  return Zn.has(e);
}
function Hv() {
  const e = [];
  return Zn.forEach((t, n) => {
    e.push({ id: n, active: t.active, createdAt: t.createdAt });
  }), e;
}
function uR(e, t) {
  if (Hr.has(e))
    return { ok: !1, error: "Guard already exists" };
  const n = (s) => {
    s.target.matches(t) && (s.preventDefault(), s.target.blur());
  };
  return document.addEventListener("focusin", n, !0), Hr.set(e, {
    id: e,
    selector: t,
    handler: n
  }), { ok: !0 };
}
function dR(e) {
  const t = Hr.get(e);
  return t ? (document.removeEventListener("focusin", t.handler, !0), Hr.delete(e), !0) : !1;
}
function pR(e) {
  return e = e || 10, $t.slice(-e).map((t) => {
    var n, s;
    return {
      tagName: (n = t.element) == null ? void 0 : n.tagName,
      id: (s = t.element) == null ? void 0 : s.id,
      context: t.context,
      timestamp: t.timestamp
    };
  });
}
function fR() {
  if ($t.length < 2)
    return { ok: !1, error: "No previous focus in history" };
  $t.pop();
  const e = $t[$t.length - 1];
  return e && e.element && document.contains(e.element) ? We(e.element, { context: "history-back" }) : { ok: !1, error: "Previous element not in DOM" };
}
function hR() {
  $t.length = 0;
}
function gR(e, t) {
  t = t || "polite";
  let n = document.getElementById("shell-announcer");
  return n || (n = document.createElement("div"), n.id = "shell-announcer", n.setAttribute("role", "status"), n.setAttribute("aria-live", t), n.setAttribute("aria-atomic", "true"), n.style.cssText = "position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;", document.body.appendChild(n)), n.setAttribute("aria-live", t), n.textContent = "", setTimeout(() => {
    n.textContent = e;
  }, 50), { ok: !0 };
}
function mR(e) {
  e.historyLimit !== void 0 && (ls.historyLimit = Math.max(10, e.historyLimit)), e.announceOnFocus !== void 0 && (ls.announceOnFocus = !!e.announceOnFocus), e.scrollIntoView !== void 0 && (ls.scrollIntoView = !!e.scrollIntoView), e.preventScroll !== void 0 && (ls.preventScroll = !!e.preventScroll), e.focusDelay !== void 0 && (ls.focusDelay = Math.max(0, e.focusDelay));
}
function Uv() {
  return Object.assign({}, ls);
}
function vR(e) {
  return typeof e != "function" ? () => {
  } : (qn.push(e), function() {
    const t = qn.indexOf(e);
    t >= 0 && qn.splice(t, 1);
  });
}
function yp() {
  return {
    focusChanges: Is.focusChanges,
    trapsActivated: Is.trapsActivated,
    restores: Is.restores,
    activeTraps: Zn.size,
    activeGuards: Hr.size,
    savedFocusCount: Ns.size,
    historySize: $t.length
  };
}
function yR() {
  var e;
  const t = {
    noExcessiveTraps: Zn.size <= 5,
    noExcessiveGuards: Hr.size <= 10,
    historyNotFull: $t.length < ls.historyLimit
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    metrics: yp(),
    currentFocus: (e = document.activeElement) == null ? void 0 : e.tagName,
    version: mp,
    moduleId: vp,
    timestamp: Date.now()
  };
}
function bR() {
  var e;
  return {
    moduleId: vp,
    version: mp,
    config: Uv(),
    metrics: yp(),
    activeTraps: Hv(),
    savedFocusKeys: zv(),
    currentFocus: (e = document.activeElement) == null ? void 0 : e.tagName,
    subscriberCount: qn.length,
    timestamp: Date.now()
  };
}
const R = {
  VERSION: mp,
  MODULE_ID: vp,
  FOCUS_STRATEGIES: as,
  focusElement: We,
  focusRegion: Zx,
  focusNext: eR,
  focusPrevious: tR,
  saveFocus: rR,
  restoreFocus: iR,
  clearSavedFocus: oR,
  getSavedFocusKeys: zv,
  createTrap: aR,
  releaseTrap: lR,
  hasTrap: cR,
  getActiveTraps: Hv,
  createGuard: uR,
  removeGuard: dR,
  getHistory: pR,
  goBack: fR,
  clearHistory: hR,
  getCurrentFocus: nR,
  isFocused: sR,
  getFocusableIn: Ka,
  announce: gR,
  configure: mR,
  getConfig: Uv,
  subscribe: vR,
  getMetrics: yp,
  healthCheck: yR,
  info: bR
}, bp = "1.0.0-P2-ENTERPRISE", Ep = "app-shell-bundle-analyzer", it = /* @__PURE__ */ new Map(), $n = { trackImports: !0, analyzeOnLoad: !1, warnThreshold: 50 * 1024, criticalThreshold: 100 * 1024 };
let Ul = null;
function ER(e, t) {
  return t = t || {}, it.set(e, {
    name: e,
    size: t.size || 0,
    gzipSize: t.gzipSize || null,
    dependencies: t.dependencies || [],
    loadTime: t.loadTime || null,
    registeredAt: Date.now()
  }), !0;
}
function kR(e, t) {
  const n = it.get(e);
  return n ? (Object.assign(n, t), !0) : !1;
}
function SR(e) {
  return it.delete(e);
}
function Bv() {
  let e = 0, t = 0;
  const n = [], s = [], r = [];
  it.forEach((a) => {
    e += a.size, a.gzipSize && (t += a.gzipSize), a.size >= $n.criticalThreshold ? s.push({ name: a.name, size: a.size }) : a.size >= $n.warnThreshold && n.push({ name: a.name, size: a.size });
  }), s.length > 0 && r.push({ type: "critical", message: `Consider code-splitting for modules over ${Math.round($n.criticalThreshold / 1024)}KB`, modules: s.map((a) => a.name) }), n.length > 0 && r.push({ type: "warning", message: "Consider tree-shaking or optimization for large modules", modules: n.map((a) => a.name) }), e > 500 * 1024 && r.push({ type: "info", message: "Total bundle size exceeds 500KB. Consider lazy loading." });
  const i = kp();
  i.length > 0 && r.push({ type: "error", message: "Circular dependencies detected", cycles: i });
  const o = {
    moduleCount: it.size,
    totalSize: e,
    totalGzipSize: t,
    averageSize: it.size > 0 ? Math.round(e / it.size) : 0,
    largeModules: n,
    criticalModules: s,
    recommendations: r,
    timestamp: Date.now()
  };
  return Ul = o, o;
}
function TR() {
  return Ul ? Object.assign({}, Ul) : null;
}
function kp() {
  const e = [], t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set();
  function s(r, i) {
    if (n.has(r)) {
      e.push(i.slice(i.indexOf(r)).concat(r));
      return;
    }
    if (t.has(r)) return;
    t.add(r), n.add(r);
    const o = it.get(r);
    if (o && o.dependencies)
      for (let a = 0; a < o.dependencies.length; a++)
        s(o.dependencies[a], i.concat(r));
    n.delete(r);
  }
  return it.forEach((r, i) => {
    t.has(i) || s(i, []);
  }), e;
}
function wR(e, t) {
  t = t || 3;
  function n(s, r) {
    if (r > t) return null;
    const i = it.get(s);
    if (!i) return { name: s, notFound: !0 };
    const o = [];
    if (i.dependencies)
      for (let a = 0; a < i.dependencies.length; a++) {
        const l = n(i.dependencies[a], r + 1);
        l && o.push(l);
      }
    return { name: s, size: i.size, children: o.length > 0 ? o : void 0 };
  }
  return n(e, 0);
}
function Fv() {
  if (typeof performance > "u" || !performance.getEntriesByType) return null;
  const e = performance.getEntriesByType("resource"), t = { script: { count: 0, size: 0 }, stylesheet: { count: 0, size: 0 }, other: { count: 0, size: 0 } };
  for (let n = 0; n < e.length; n++) {
    const s = e[n], r = s.transferSize || 0;
    s.initiatorType === "script" ? (t.script.count++, t.script.size += r) : s.initiatorType === "link" || s.initiatorType === "css" ? (t.stylesheet.count++, t.stylesheet.size += r) : (t.other.count++, t.other.size += r);
  }
  return { total: e.length, breakdown: t, timestamp: Date.now() };
}
function CR(e) {
  const t = it.get(e);
  return t ? Object.assign({}, t) : null;
}
function AR() {
  const e = [];
  return it.forEach((t) => {
    e.push(Object.assign({}, t));
  }), e;
}
function IR(e) {
  e.trackImports !== void 0 && ($n.trackImports = !!e.trackImports), e.analyzeOnLoad !== void 0 && ($n.analyzeOnLoad = !!e.analyzeOnLoad), e.warnThreshold !== void 0 && ($n.warnThreshold = e.warnThreshold), e.criticalThreshold !== void 0 && ($n.criticalThreshold = e.criticalThreshold);
}
function Vv() {
  return Object.assign({}, $n);
}
function DR() {
  it.clear();
}
function OR() {
  const e = Bv(), t = { noCircular: kp().length === 0, noCritical: e.criticalModules.length === 0, reasonableSize: e.totalSize < 1024 * 1024 }, n = Object.values(t).filter(Boolean).length;
  return { status: n === 3 ? "HEALTHY" : n >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${n}/3`, checks: t, analysis: e, version: bp, moduleId: Ep, timestamp: Date.now() };
}
function xR() {
  return { moduleId: Ep, version: bp, moduleCount: it.size, config: Vv(), resourceStats: Fv(), timestamp: Date.now() };
}
const tt = { VERSION: bp, MODULE_ID: Ep, registerModule: ER, updateModule: kR, unregisterModule: SR, analyze: Bv, findCircularDependencies: kp, getDependencyTree: wR, getResourceStats: Fv, getModuleInfo: CR, getAllModules: AR, getLastAnalysis: TR, configure: IR, getConfig: Vv, reset: DR, healthCheck: OR, info: xR }, Sp = "1.0.0-AAA", Tp = "app-shell-lazy-loader", gt = Object.freeze({
  PENDING: "PENDING",
  LOADING: "LOADING",
  LOADED: "LOADED",
  ERROR: "ERROR"
}), di = Object.freeze({
  timeout: 3e4,
  retryAttempts: 2,
  retryDelay: 1e3,
  preloadOnIdle: !0,
  cacheModules: !0
}), Ee = {
  modules: /* @__PURE__ */ new Map(),
  loadPromises: /* @__PURE__ */ new Map(),
  subscribers: [],
  config: {
    timeout: di.timeout,
    retryAttempts: di.retryAttempts,
    retryDelay: di.retryDelay,
    preloadOnIdle: di.preloadOnIdle,
    cacheModules: di.cacheModules
  },
  metrics: {
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    cachedHits: 0,
    totalLoadTime: 0
  }
}, pi = Ee.modules, fi = Ee.loadPromises;
function RR(e, t, n) {
  this.name = e, this.loader = t, this.options = n || {}, this.state = gt.PENDING, this.module = null, this.error = null, this.loadTime = null, this.loadedAt = null, this.attempts = 0;
}
function wp() {
  return Ee.modules;
}
function ai(e) {
  return Ee.modules.get(e);
}
function _R(e, t) {
  Ee.modules.set(e, t);
}
function LR(e) {
  Ee.modules.delete(e);
}
function MR(e) {
  return Ee.modules.has(e);
}
function PR(e) {
  Ee.loadPromises.delete(e);
}
function Gv() {
  return Ee.subscribers;
}
function Er() {
  return Ee.config;
}
function NR(e) {
  e.timeout !== void 0 && (Ee.config.timeout = Math.max(1e3, e.timeout)), e.retryAttempts !== void 0 && (Ee.config.retryAttempts = Math.max(0, e.retryAttempts)), e.retryDelay !== void 0 && (Ee.config.retryDelay = Math.max(100, e.retryDelay)), e.preloadOnIdle !== void 0 && (Ee.config.preloadOnIdle = !!e.preloadOnIdle), e.cacheModules !== void 0 && (Ee.config.cacheModules = !!e.cacheModules);
}
function $R() {
  return Ee.metrics;
}
function hi(e, t) {
  Ee.metrics[e] !== void 0 && (Ee.metrics[e] += t || 1);
}
function zR(e) {
  for (let t = 0; t < Ee.subscribers.length; t++)
    try {
      Ee.subscribers[t](e);
    } catch {
    }
}
function jR(e, t) {
  return new Promise((n, s) => {
    let r = null, i = !1;
    function o(a, l) {
      i || (i = !0, r && clearTimeout(r), l ? s(a) : n(a));
    }
    r = setTimeout(() => {
      o(new Error(`Load timeout: ${e}`), !0);
    }, t), import(e).then((a) => {
      o(a, !1);
    }).catch((a) => {
      o(a, !0);
    });
  });
}
function HR(e, t) {
  t = t || {};
  const n = t.retries || Er().retryCount, s = t.retryDelay || Er().retryDelay, r = t.timeout || Er().timeout;
  let i = 0;
  function o() {
    return i++, jR(e, r).catch((a) => {
      if (i < n)
        return new Promise((l) => {
          const c = s * Math.pow(2, i - 1);
          setTimeout(() => {
            l(o());
          }, c);
        });
      throw a;
    });
  }
  return o();
}
function Yv(e, t) {
  t = t || {};
  const n = t.cache !== !1, s = t.force === !0;
  if (n && !s && pi.has(e)) {
    const o = pi.get(e);
    if (o.state === gt.LOADED)
      return hi("cachedHits"), Promise.resolve(o.module);
  }
  if (fi.has(e))
    return fi.get(e);
  const r = Date.now();
  hi("totalLoads"), pi.set(e, { state: gt.LOADING, module: null, error: null });
  const i = HR(e, t).then((o) => {
    const a = Date.now() - r;
    return pi.set(e, {
      state: gt.LOADED,
      module: o,
      error: null,
      loadedAt: Date.now(),
      duration: a
    }), fi.delete(e), hi("successfulLoads"), hi("totalLoadTime", a), o;
  }).catch((o) => {
    throw pi.set(e, {
      state: gt.ERROR,
      module: null,
      error: o.message,
      failedAt: Date.now()
    }), fi.delete(e), hi("failedLoads"), o;
  });
  return fi.set(e, i), i;
}
function UR(e, t, n) {
  if (MR(e))
    return !1;
  const s = new RR(e, t, n);
  return _R(e, s), zR({
    type: "registered",
    module: e,
    timestamp: Date.now()
  }), !0;
}
function BR(e) {
  return ai(e) ? (LR(e), PR(e), !0) : !1;
}
function Mo(e) {
  const t = e.map((n) => Yv(n).then((s) => ({
    name: n,
    module: s,
    success: !0
  })).catch((s) => ({
    name: n,
    error: s.message,
    success: !1
  })));
  return Promise.all(t).then((n) => {
    const s = {}, r = [];
    for (let i = 0; i < n.length; i++)
      n[i].success ? s[n[i].name] = n[i].module : r.push({ name: n[i].name, error: n[i].error });
    return { modules: s, errors: r, allLoaded: r.length === 0 };
  });
}
function FR(e) {
  return Er().preloadOnIdle ? typeof requestIdleCallback == "function" ? new Promise((t) => {
    requestIdleCallback(() => {
      Mo(e).then(t);
    }, { timeout: 5e3 });
  }) : new Promise((t) => {
    setTimeout(() => {
      Mo(e).then(t);
    }, 100);
  }) : Mo(e);
}
function VR(e) {
  const t = ai(e);
  return t ? t.state === gt.LOADED : !1;
}
function GR(e) {
  const t = ai(e);
  return t ? t.state : null;
}
function YR(e) {
  const t = ai(e);
  return t && t.state === gt.LOADED ? t.module : null;
}
function qv(e) {
  const t = ai(e);
  return t ? {
    name: t.name,
    state: t.state,
    loadTime: t.loadTime,
    loadedAt: t.loadedAt,
    attempts: t.attempts,
    error: t.error,
    hasOptions: !!t.options && Object.keys(t.options).length > 0
  } : null;
}
function Cp() {
  const e = [];
  return wp().forEach((t) => {
    e.push(qv(t.name));
  }), e;
}
function qR(e) {
  const t = ai(e);
  return t ? (t.state = gt.PENDING, t.module = null, t.error = null, t.loadTime = null, t.loadedAt = null, !0) : !1;
}
function WR() {
  wp().forEach((e) => {
    e.state = gt.PENDING, e.module = null, e.error = null, e.loadTime = null, e.loadedAt = null;
  });
}
function Ap() {
  const e = $R(), t = wp(), n = e.successfulLoads > 0 ? Math.round(e.totalLoadTime / e.successfulLoads) : 0;
  let s = 0;
  return t.forEach((r) => {
    r.state === gt.LOADED && s++;
  }), {
    totalLoads: e.totalLoads,
    successfulLoads: e.successfulLoads,
    failedLoads: e.failedLoads,
    cachedHits: e.cachedHits,
    avgLoadTime: n,
    registeredModules: t.size,
    loadedModules: s
  };
}
function KR() {
  const e = Ap(), t = Cp().filter((o) => o.state === gt.ERROR), n = {
    noErrorModules: t.length === 0,
    lowFailureRate: e.totalLoads === 0 || e.failedLoads / e.totalLoads < 0.2,
    goodCacheRate: e.totalLoads === 0 || e.cachedHits > 0 || e.totalLoads < 5
  };
  let s = 0;
  const r = Object.keys(n);
  for (let o = 0; o < r.length; o++)
    n[r[o]] && s++;
  let i = "UNHEALTHY";
  return s === r.length ? i = "HEALTHY" : s >= 1 && (i = "DEGRADED"), {
    status: i,
    score: `${s}/${r.length}`,
    checks: n,
    metrics: e,
    errorModules: t.length > 0 ? t : null,
    version: Sp,
    moduleId: Tp,
    timestamp: Date.now()
  };
}
function XR() {
  const e = Er();
  return {
    moduleId: Tp,
    version: Sp,
    config: {
      timeout: e.timeout,
      retryAttempts: e.retryAttempts,
      retryDelay: e.retryDelay,
      preloadOnIdle: e.preloadOnIdle,
      cacheModules: e.cacheModules
    },
    metrics: Ap(),
    modules: Cp(),
    subscriberCount: Gv().length,
    timestamp: Date.now()
  };
}
function JR(e) {
  NR(e);
}
function QR() {
  const e = Er();
  return {
    timeout: e.timeout,
    retryAttempts: e.retryAttempts,
    retryDelay: e.retryDelay,
    preloadOnIdle: e.preloadOnIdle,
    cacheModules: e.cacheModules
  };
}
function ZR(e) {
  if (typeof e != "function") return () => {
  };
  const t = Gv();
  return t.push(e), () => {
    const n = t.indexOf(e);
    n >= 0 && t.splice(n, 1);
  };
}
const ge = {
  VERSION: Sp,
  MODULE_ID: Tp,
  LOAD_STATES: gt,
  register: UR,
  unregister: BR,
  load: Yv,
  loadMany: Mo,
  preload: FR,
  isLoaded: VR,
  getState: GR,
  getModule: YR,
  getModuleInfo: qv,
  listModules: Cp,
  invalidate: qR,
  invalidateAll: WR,
  configure: JR,
  getConfig: QR,
  subscribe: ZR,
  getMetrics: Ap,
  healthCheck: KR,
  info: XR
}, Ip = "1.1.0-AAA", Dp = "app-shell-config-exporter", kr = Object.freeze({
  JSON: "json",
  BASE64: "base64",
  URL: "url"
}), Xa = Object.freeze({
  ALL: "all",
  LAYOUT: "layout",
  THEME: "theme",
  PREFERENCES: "preferences",
  DEBUG: "debug",
  CUSTOM: "custom"
}), es = {
  lastExport: null,
  lastImport: null
}, Ys = {
  includeTimestamp: !0,
  includeVersion: !0,
  compressionEnabled: !1,
  maxUrlLength: 2e3,
  encryptionKey: null
}, Bl = {
  exports: 0,
  imports: 0,
  exportErrors: 0,
  importErrors: 0
};
function Op() {
  return Object.assign({}, Bl);
}
function An(e) {
  Bl[e] !== void 0 && Bl[e]++;
}
function Ja() {
  return typeof window < "u" && window.AppShell ? window.AppShell : null;
}
function Wv() {
  const e = Ja();
  if (!e) return {};
  const t = {};
  return e.layoutPrefs && e.layoutPrefs.get && (t.layoutPrefs = e.layoutPrefs.get()), e.layoutPresets && e.layoutPresets.getCurrent && (t.layoutPreset = e.layoutPresets.getCurrent()), e.visibility && e.visibility.getState && (t.visibility = e.visibility.getState()), e.resize && e.resize.getSizes && (t.regionSizes = e.resize.getSizes()), t;
}
function Kv() {
  const e = Ja();
  if (!e || !e.theme) return {};
  const t = {};
  return e.theme.getTheme && (t.theme = e.theme.getTheme()), e.theme.getRegionThemes && (t.regionThemes = e.theme.getRegionThemes()), e.theme.getThemeVariables && (t.customVariables = e.theme.getThemeVariables()), t;
}
function Xv() {
  const e = Ja();
  if (!e) return {};
  const t = {};
  return e.a11y && e.a11y.getActivePresets && (t.a11yPresets = e.a11y.getActivePresets(), e.a11y.getAllSettings && (t.a11ySettings = e.a11y.getAllSettings())), e.animations && e.animations.getConfig && (t.animationConfig = e.animations.getConfig()), e.shortcuts && e.shortcuts.getConfig && (t.shortcutsConfig = e.shortcuts.getConfig()), e.notify && e.notify.getConfig && (t.notifyConfig = e.notify.getConfig()), t;
}
function Jv() {
  const e = Ja();
  if (!e) return {};
  const t = {};
  return e.logger && e.logger.getConfig && (t.loggerConfig = e.logger.getConfig()), e.debugPresets && e.debugPresets.getCurrent && (t.debugPreset = e.debugPresets.getCurrent(), t.debugConfig = e.debugPresets.getCurrentConfig()), e.autoHealthCheck && e.autoHealthCheck.getConfig && (t.healthCheckConfig = e.autoHealthCheck.getConfig()), t;
}
function e_() {
  return {
    layout: Wv(),
    theme: Kv(),
    preferences: Xv(),
    debug: Jv()
  };
}
function t_(e) {
  switch (e) {
    case "layout":
      return Wv();
    case "theme":
      return Kv();
    case "preferences":
      return Xv();
    case "debug":
      return Jv();
    case "all":
      return e_();
    default:
      return {};
  }
}
function Qv(e) {
  const t = JSON.stringify(e);
  let n = 0;
  for (let s = 0; s < t.length; s++) {
    const r = t.charCodeAt(s);
    n = (n << 5) - n + r, n = n & n;
  }
  return Math.abs(n).toString(16);
}
function n_(e, t) {
  return Qv(e) === t;
}
function xp(e) {
  e = e || {};
  const t = e.format || kr.JSON, n = e.scope || Xa.ALL;
  try {
    const s = t_(n), r = {
      version: "1.0",
      scope: n,
      timestamp: Date.now(),
      checksum: Qv(s),
      data: s
    };
    let i;
    switch (t) {
      case kr.BASE64:
        i = btoa(JSON.stringify(r));
        break;
      case kr.URL:
        const o = new URLSearchParams();
        o.set("config", btoa(JSON.stringify(r))), i = `${window.location.origin + window.location.pathname}?${o.toString()}`;
        break;
      default:
        i = JSON.stringify(r, null, 2);
    }
    return es.lastExport = Date.now(), An("exports"), { ok: !0, data: i, format: t };
  } catch (s) {
    return An("exportErrors"), { ok: !1, error: s.message };
  }
}
function s_(e) {
  e = e || {};
  const t = xp(e);
  if (!t.ok) return t;
  try {
    const n = e.filename || `app-shell-config-${Date.now()}.json`, s = new Blob([t.data], { type: "application/json" }), r = URL.createObjectURL(s), i = document.createElement("a");
    return i.href = r, i.download = n, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r), { ok: !0, filename: n };
  } catch (n) {
    return An("exportErrors"), { ok: !1, error: n.message };
  }
}
function r_(e) {
  const t = xp(e);
  if (!t.ok) return Promise.resolve(t);
  if (navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(t.data).then(() => ({
      ok: !0
    })).catch((n) => (An("exportErrors"), { ok: !1, error: n.message }));
  try {
    const n = document.createElement("textarea");
    return n.value = t.data, n.style.position = "fixed", n.style.left = "-9999px", document.body.appendChild(n), n.select(), document.execCommand("copy"), document.body.removeChild(n), Promise.resolve({ ok: !0 });
  } catch (n) {
    return An("exportErrors"), Promise.resolve({ ok: !1, error: n.message });
  }
}
function Rp(e, t) {
  t = t || {};
  try {
    let n;
    if (typeof e == "string")
      try {
        n = JSON.parse(e);
      } catch {
        try {
          n = JSON.parse(atob(e));
        } catch {
          return { ok: !1, error: "Invalid format" };
        }
      }
    else
      n = e;
    return !n.data || !n.checksum ? { ok: !1, error: "Invalid config structure" } : !t.skipValidation && !n_(n.data, n.checksum) ? { ok: !1, error: "Checksum validation failed" } : (a_(n.data, n.scope), es.lastImport = Date.now(), An("imports"), { ok: !0, scope: n.scope, timestamp: n.timestamp });
  } catch (n) {
    return An("importErrors"), { ok: !1, error: n.message };
  }
}
function i_(e, t) {
  return new Promise((n) => {
    const s = new FileReader();
    s.onload = (r) => {
      const i = Rp(r.target.result, t);
      n(i);
    }, s.onerror = () => {
      An("importErrors"), n({ ok: !1, error: "Failed to read file" });
    }, s.readAsText(e);
  });
}
function o_(e) {
  return navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText().then((t) => Rp(t, e)).catch((t) => (An("importErrors"), { ok: !1, error: t.message })) : Promise.resolve({ ok: !1, error: "Clipboard API not available" });
}
function a_(e, t) {
  const n = typeof window < "u" ? window.AppShell : null;
  if (n) {
    if (e.layoutPrefs && n.layoutPrefs) {
      const s = Object.keys(e.layoutPrefs);
      for (let r = 0; r < s.length; r++)
        typeof n.layoutPrefs.setPreference == "function" && n.layoutPrefs.setPreference(s[r], e.layoutPrefs[s[r]]);
    }
    if (e.layoutPreset && n.layoutPresets && typeof n.layoutPresets.apply == "function" && n.layoutPresets.apply(e.layoutPreset), e.theme && n.theme && typeof n.theme.setTheme == "function" && n.theme.setTheme(e.theme), e.a11yPresets && n.accessibilityPresets) {
      const s = e.a11yPresets;
      for (let r = 0; r < s.length; r++)
        typeof n.accessibilityPresets.apply == "function" && n.accessibilityPresets.apply(s[r]);
    }
    e.debugPreset && n.debugPresets && typeof n.debugPresets.apply == "function" && n.debugPresets.apply(e.debugPreset);
  }
}
const zn = [];
function l_(e) {
  return typeof e == "function" && zn.indexOf(e) === -1 && zn.push(e), function() {
    const t = zn.indexOf(e);
    t > -1 && zn.splice(t, 1);
  };
}
function li(e) {
  for (let t = 0; t < zn.length; t++)
    try {
      zn[t](e);
    } catch {
    }
}
function c_(e) {
  const t = xp(e);
  return li({ type: "export", result: t }), t;
}
function u_(e) {
  const t = s_(e);
  return li({ type: "exportToFile", result: t }), t;
}
function d_(e) {
  const t = r_(e);
  return li({ type: "exportToClipboard", result: t }), t;
}
function p_(e, t) {
  const n = Rp(e, t);
  return li({ type: "import", result: n }), n;
}
function f_(e, t) {
  const n = i_(e, t);
  return li({ type: "importFromFile", result: n }), n;
}
function h_(e) {
  const t = o_(e);
  return li({ type: "importFromClipboard", result: t }), t;
}
function g_() {
  return es.lastExport;
}
function m_() {
  return es.lastImport;
}
function v_(e) {
  e.includeTimestamp !== void 0 && (Ys.includeTimestamp = !!e.includeTimestamp), e.includeVersion !== void 0 && (Ys.includeVersion = !!e.includeVersion), e.compressionEnabled !== void 0 && (Ys.compressionEnabled = !!e.compressionEnabled), e.maxUrlLength !== void 0 && (Ys.maxUrlLength = Math.max(500, e.maxUrlLength)), e.encryptionKey !== void 0 && (Ys.encryptionKey = e.encryptionKey);
}
function Zv() {
  return Object.assign({}, Ys);
}
function y_() {
  const e = Op(), t = {
    lowExportErrors: e.exportErrors < e.exports * 0.1 || e.exportErrors < 3,
    lowImportErrors: e.importErrors < e.imports * 0.1 || e.importErrors < 3,
    recentActivity: e.exports > 0 || e.imports > 0 || !0
  };
  let n = 0;
  const s = Object.keys(t);
  for (let r = 0; r < s.length; r++)
    t[s[r]] && n++;
  return {
    status: n === s.length ? "HEALTHY" : "DEGRADED",
    score: `${n}/${s.length}`,
    checks: t,
    metrics: e,
    lastExport: es.lastExport,
    lastImport: es.lastImport,
    subscriberCount: zn.length,
    version: Ip,
    moduleId: Dp,
    timestamp: Date.now()
  };
}
function b_() {
  return {
    moduleId: Dp,
    version: Ip,
    config: Zv(),
    formats: Object.keys(kr),
    scopes: Object.keys(Xa),
    metrics: Op(),
    lastExport: es.lastExport,
    lastImport: es.lastImport,
    subscriberCount: zn.length,
    timestamp: Date.now()
  };
}
const $e = {
  VERSION: Ip,
  MODULE_ID: Dp,
  EXPORT_FORMATS: kr,
  EXPORT_SCOPES: Xa,
  exportConfig: c_,
  exportToFile: u_,
  exportToClipboard: d_,
  importConfig: p_,
  importFromFile: f_,
  importFromClipboard: h_,
  getLastExport: g_,
  getLastImport: m_,
  subscribe: l_,
  configure: v_,
  getConfig: Zv,
  getMetrics: Op,
  healthCheck: y_,
  info: b_
};
function E_(e) {
  return () => {
    var t, n;
    Z.trackCall("AppShell", "healthCheck");
    const s = Dn(), r = pa(), i = d0(), o = [], a = e.Ports.snapshot(), l = ((t = r._summary) == null ? void 0 : t.allPresent) || !1, c = !Object.values(i).some((oe) => typeof oe == "string" ? oe === "UNHEALTHY" : oe && typeof oe == "object" ? oe.status === "UNHEALTHY" || oe.status === "ERROR" : !1), u = Y.healthCheck(), h = ve.isActive(), E = B.isOnline(), v = {
      initialized: e.isInitialized(),
      mounted: s.mounted,
      ready: s.ready,
      regionsPresent: l,
      enterpriseStrict: Li,
      noErrors: !s.error,
      adaptersHealthy: c,
      lowErrorRate: e.metrics.initCount === 0 || e.metrics.errors / e.metrics.initCount < 0.1,
      portsInitialized: a._initialized,
      circuitsHealthy: u.status !== "UNHEALTHY",
      notInMaintenance: !h,
      isOnline: E
    };
    if (v.initialized || o.push({ type: "not-initialized", severity: "warning" }), v.mounted || o.push({ type: "not-mounted", severity: "error" }), !v.ready && v.mounted && o.push({ type: "not-ready", severity: "warning" }), !v.regionsPresent)
      for (const [oe, w] of Object.entries(r))
        oe !== "_summary" && w && !w.exists && o.push({ type: "region-missing", region: oe, severity: "error" });
    for (const [oe, w] of Object.entries(i))
      w && typeof w == "object" && (w.status === "UNHEALTHY" || w.status === "ERROR") && o.push({ type: "adapter-unhealthy", adapter: oe, status: w.status, severity: "error" });
    s.error && o.push({ type: "has-error", error: s.error, severity: "error" }), h && o.push({ type: "maintenance-active", severity: "info" }), E || o.push({ type: "offline", severity: "warning" });
    const T = Object.values(v).filter(Boolean).length, he = Object.keys(v).length, te = T === he ? "HEALTHY" : T >= 9 ? "DEGRADED" : "UNHEALTHY";
    if (te === "DEGRADED" || te === "UNHEALTHY")
      try {
        const oe = e.getPort("eventBus");
        (n = oe == null ? void 0 : oe.emit) == null || n.call(oe, Gl.DEGRADED, { status: te, issues: o, timestamp: Date.now() });
      } catch {
      }
    const hn = { status: te, score: `${T}/${he}`, checks: v, issues: o.length > 0 ? o : null, adapters: i, circuitBreakers: u.metrics, architecture: "KERNEL-AAA-v7", enterpriseStrict: Li, version: e.VERSION, moduleId: e.MODULE_ID, p18Compliant: !0, phase2Complete: !0, timestamp: Date.now() };
    return X0(hn), L.trackHealthCheck(hn), hn;
  };
}
function k_(e) {
  return () => {
    Z.trackCall("AppShell", "info");
    const t = Dn(), n = e.Ports.snapshot();
    return {
      name: e.MODULE_ID,
      version: e.VERSION,
      architecture: "KERNEL-AAA-v7",
      enterpriseStrict: Li,
      phase2Complete: !0,
      initialized: e.isInitialized(),
      phase: t.phase,
      mounted: t.mounted,
      ready: t.ready,
      error: t.error,
      bootTime: ao(),
      phaseTimings: qf(),
      transitionHistory: Gf(),
      regions: { map: Ze, health: pa(), validation: uc(), accessCounts: Cf(), visibility: ye.getVisibilityState(), sizes: Ne.getSizes(), loading: Ye.getLoadingState(), slots: Ce.info().slotsByRegion, cacheConfig: wf(), cacheStats: da() },
      adapters: jf(),
      connectedAdapters: sr(),
      lifecycle: Jf(),
      readiness: wv(),
      transitions: Qf(),
      systemPages: ff(),
      responsive: ne.info(),
      keyboard: ce.info(),
      theme: se.info(),
      events: He.info(),
      performance: ue.info(),
      autoHealthCheck: Ie.info(),
      logger: q.getInfo(),
      rateLimiter: ze.info(),
      configValidator: kt.info(),
      apiUsageMetrics: Z.info(),
      memoryLeakDetector: me.info(),
      analyticsExporter: L.info(),
      circuitBreaker: Y.info(),
      lazyLoader: ge.info(),
      bundleAnalyzer: tt.info(),
      layoutPresets: Ae.info(),
      slotPersistence: le.info(),
      skeletonLoader: je.info(),
      maintenanceMode: ve.info(),
      focusManager: R.info(),
      accessibilityPresets: U.info(),
      animationAPI: P.info(),
      serviceWorker: C.info(),
      contentVirtualizer: Rt.info(),
      offlineManager: B.info(),
      notificationCenter: G.info(),
      keyboardShortcuts: D.info(),
      gestureHandler: O.info(),
      debugPresets: _.info(),
      configExporter: $e.info(),
      regionMetrics: M.info(),
      commandPalette: Q.info(),
      stateSnapshots: H.info(),
      debugPanel: ae.info(),
      icons: Yt.info(),
      accessibility: { prefersReducedMotion: H0(), skipLinksPresent: !!document.getElementById("shell-skip-links"), keyboardNavEnabled: ce.isEnabled(), activeA11yPresets: U.getActivePresets() },
      metrics: { initCount: e.metrics.initCount, shutdownCount: e.metrics.shutdownCount, errors: e.metrics.errors, adaptersConnected: e.metrics.adaptersConnected, lastInitAt: e.metrics.lastInitAt, lastShutdownAt: e.metrics.lastShutdownAt, lastActivity: e.metrics.lastActivity, initDuration: e.metrics.initDuration },
      portsStatus: { initialized: n._initialized },
      capabilities: ["regions", "adapters", "telemetry", "transitions", "health-check", "system-pages", "focus-management", "aria-live", "skip-links", "reduced-motion", "enterprise-strict", "lazy-adapters", "cache", "layout-persistence", "region-visibility", "responsive-layout", "region-resize", "keyboard-navigation", "region-loading", "theme-integration", "region-events", "region-slots", "debug-panel", "performance-metrics", "auto-health-check", "structured-logger", "rate-limiter", "config-validator", "cache-ttl", "api-usage-metrics", "memory-leak-detector", "analytics-exporter", "circuit-breaker", "lazy-loader", "bundle-analyzer", "layout-presets", "slot-persistence", "skeleton-loader", "maintenance-mode", "focus-manager", "accessibility-presets", "animation-api", "service-worker", "content-virtualizer", "offline-manager", "notification-center", "keyboard-shortcuts", "gesture-handler", "debug-presets", "config-exporter", "region-metrics", "command-palette", "state-snapshots", "unified-ui", "svg-icons"],
      p18Compliant: !0,
      timestamp: Date.now()
    };
  };
}
function S_(e) {
  return {
    focus: Object.freeze({ save: O0, restore: x0, main: R0, region: _0, announce: L0 }),
    theme: Object.freeze({
      getTheme: se.getTheme,
      getResolvedTheme: se.getResolvedTheme,
      setTheme: se.setTheme,
      toggleTheme: se.toggleTheme,
      useSystemTheme: se.useSystemTheme,
      isDarkMode: se.isDarkMode,
      isLightMode: se.isLightMode,
      isSystemTheme: se.isSystemTheme,
      getSystemPreference: se.getSystemPreference,
      setRegionTheme: se.setRegionTheme,
      clearRegionTheme: se.clearRegionTheme,
      getRegionTheme: se.getRegionTheme,
      getRegionThemes: se.getRegionThemes,
      getThemeVariable: se.getThemeVariable,
      setThemeVariable: se.setThemeVariable,
      getThemeVariables: se.getThemeVariables,
      THEMES: X,
      subscribe: se.subscribe,
      healthCheck: se.healthCheck,
      info: se.info
    }),
    events: Object.freeze({
      emit: He.emit,
      on: He.on,
      off: He.off,
      onAny: He.onAny,
      onGlobal: He.onGlobal,
      once: He.once,
      waitFor: He.waitFor,
      getHistory: He.getHistory,
      clearHistory: He.clearHistory,
      setHistoryLimit: He.setHistoryLimit,
      getListenerCounts: He.getListenerCounts,
      EVENTS: Rn,
      healthCheck: He.healthCheck,
      info: He.info
    }),
    slots: Object.freeze({
      registerSlot: Ce.registerSlot,
      unregisterSlot: Ce.unregisterSlot,
      injectContent: Ce.injectContent,
      clearSlot: Ce.clearSlot,
      clearRegionSlots: Ce.clearRegionSlots,
      updateSlot: Ce.updateSlot,
      getSlot: Ce.getSlot,
      getRegionSlots: Ce.getRegionSlots,
      getSlotContent: Ce.getSlotContent,
      hasContent: Ce.hasContent,
      findSlotsByName: Ce.findSlotsByName,
      inject: Ce.inject,
      createPersistentSlot: Ce.createPersistentSlot,
      POSITIONS: Mt,
      subscribe: Ce.subscribe,
      healthCheck: Ce.healthCheck,
      info: Ce.info
    }),
    perf: Object.freeze({
      mark: ue.mark,
      measure: ue.measure,
      clearMarks: ue.clearMarks,
      clearMeasures: ue.clearMeasures,
      getMetrics: ue.getMetrics,
      getMarks: ue.getMarks,
      getMeasures: ue.getMeasures,
      getSampleHistory: ue.getSampleHistory,
      getWebVitals: ue.getWebVitals,
      getResourceBreakdown: ue.getResourceBreakdown,
      subscribe: ue.subscribe,
      healthCheck: ue.healthCheck,
      info: ue.info
    }),
    debugPanel: Object.freeze({ open: ae.open, close: ae.close, toggle: ae.toggle, isOpen: ae.isOpen, setActiveTab: ae.setActiveTab, refresh: ae.refresh, healthCheck: ae.healthCheck, info: ae.info }),
    autoHealthCheck: Object.freeze({ start: Ie.start, stop: Ie.stop, checkNow: Ie.checkNow, isRunning: Ie.isRunning, getLastStatus: Ie.getLastStatus, getLastCheckTime: Ie.getLastCheckTime, getStatusHistory: Ie.getStatusHistory, configure: Ie.configure, getConfig: Ie.getConfig, setInterval: Ie.setInterval, subscribe: Ie.subscribe, healthCheck: Ie.healthCheck, info: Ie.info }),
    logger: Object.freeze({ debug: q.debug, info: q.logInfo, warn: q.warn, error: q.error, createLogger: q.createLogger, setLevel: q.setLevel, getLevel: q.getLevel, getLevelName: q.getLevelName, enableModule: q.enableModule, disableModule: q.disableModule, enableOnlyModules: q.enableOnlyModules, enableAllModules: q.enableAllModules, configure: q.configure, getConfig: q.getConfig, getHistory: q.getHistory, clearHistory: q.clearHistory, subscribe: q.subscribe, LOG_LEVELS: Ft, healthCheck: q.healthCheck, getInfo: q.getInfo }),
    rateLimiter: Object.freeze({ throttle: ze.throttle, debounce: ze.debounce, rafThrottle: ze.rafThrottle, getThrottled: ze.getThrottled, getDebounced: ze.getDebounced, removeThrottled: ze.removeThrottled, removeDebounced: ze.removeDebounced, clearAll: ze.clearAll, throttleWithPreset: ze.throttleWithPreset, debounceWithPreset: ze.debounceWithPreset, PRESETS: ze.PRESETS, healthCheck: ze.healthCheck, info: ze.info }),
    configValidator: Object.freeze({ validate: kt.validate, validateAndNormalize: kt.validateAndNormalize, validateInitOptions: kt.validateInitOptions, createSchema: kt.createSchema, formatErrors: kt.formatErrors, getLastValidation: kt.getLastValidation, getInitSchema: kt.getInitSchema, healthCheck: kt.healthCheck, info: kt.info }),
    cache: Object.freeze({ clear: cc, invalidate: ob, setTTL: Tf, getTTL: eb, setConfig: tb, getConfig: wf, getStats: da }),
    apiMetrics: Object.freeze({ trackCall: Z.trackCall, wrapMethod: Z.wrapMethod, getMetrics: Z.getMetrics, getAllMetrics: Z.getAllMetrics, getTopAPIs: Z.getTopAPIs, getUnusedAPIs: Z.getUnusedAPIs, getAPIsWithErrors: Z.getAPIsWithErrors, getSummaryByNamespace: Z.getSummaryByNamespace, enable: Z.enable, disable: Z.disable, isEnabled: Z.isEnabled, configure: Z.configure, getConfig: Z.getConfig, reset: Z.reset, healthCheck: Z.healthCheck, info: Z.info }),
    memoryLeaks: Object.freeze({ enable: me.enable, disable: me.disable, isEnabled: me.isEnabled, checkNow: me.checkNow, getTrackedListeners: me.getTrackedListeners, getTrackedIntervals: me.getTrackedIntervals, getTrackedTimeouts: me.getTrackedTimeouts, getLeakReports: me.getLeakReports, getLastReport: me.getLastReport, clearReports: me.clearReports, trackReference: me.trackReference, untrackReference: me.untrackReference, configure: me.configure, getConfig: me.getConfig, getMetrics: me.getMetrics, healthCheck: me.healthCheck, info: me.info }),
    analytics: Object.freeze({ track: L.track, trackPerformance: L.trackPerformance, trackError: L.trackError, trackHealthCheck: L.trackHealthCheck, registerAdapter: L.registerAdapter, unregisterAdapter: L.unregisterAdapter, enableAdapter: L.enableAdapter, disableAdapter: L.disableAdapter, getAdapters: L.getAdapters, useBuiltInAdapter: L.useBuiltInAdapter, flush: L.flush, flushAll: L.flushAll, enable: L.enable, disable: L.disable, isEnabled: L.isEnabled, getQueueSize: L.getQueueSize, clearQueue: L.clearQueue, configure: L.configure, getConfig: L.getConfig, getMetrics: L.getMetrics, healthCheck: L.healthCheck, info: L.info }),
    circuitBreaker: Object.freeze({ create: Y.create, get: Y.get, remove: Y.remove, execute: Y.execute, wrap: Y.wrap, wrapWithFallback: Y.wrapWithFallback, getState: Y.getState, isOpen: Y.isOpen, isClosed: Y.isClosed, reset: Y.reset, resetAll: Y.resetAll, getAll: Y.getAll, getOpenCircuits: Y.getOpenCircuits, setDefaultConfig: Y.setDefaultConfig, getDefaultConfig: Y.getDefaultConfig, subscribe: Y.subscribe, STATES: Qe, getMetrics: Y.getMetrics, healthCheck: Y.healthCheck, info: Y.info }),
    lazyLoader: Object.freeze({ register: ge.register, unregister: ge.unregister, load: ge.load, loadMany: ge.loadMany, preload: ge.preload, isLoaded: ge.isLoaded, getState: ge.getState, getModule: ge.getModule, getModuleInfo: ge.getModuleInfo, listModules: ge.listModules, invalidate: ge.invalidate, invalidateAll: ge.invalidateAll, configure: ge.configure, getConfig: ge.getConfig, subscribe: ge.subscribe, LOAD_STATES: gt, getMetrics: ge.getMetrics, healthCheck: ge.healthCheck, info: ge.info }),
    bundleAnalyzer: Object.freeze({ registerModule: tt.registerModule, updateModule: tt.updateModule, unregisterModule: tt.unregisterModule, analyze: tt.analyze, findCircularDependencies: tt.findCircularDependencies, getDependencyTree: tt.getDependencyTree, getResourceStats: tt.getResourceStats, getLastAnalysis: tt.getLastAnalysis, configure: tt.configure, getConfig: tt.getConfig, healthCheck: tt.healthCheck, info: tt.info }),
    layoutPresets: Object.freeze({ apply: Ae.apply, getCurrent: Ae.getCurrent, getPrevious: Ae.getPrevious, revert: Ae.revert, getConfig: Ae.getConfig, listPresets: Ae.listPresets, createPreset: Ae.createPreset, deletePreset: Ae.deletePreset, clonePreset: Ae.clonePreset, setTransitionDuration: Ae.setTransitionDuration, getTransitionDuration: Ae.getTransitionDuration, subscribe: Ae.subscribe, PRESETS: $a, getMetrics: Ae.getMetrics, healthCheck: Ae.healthCheck, info: Ae.info }),
    slotPersistence: Object.freeze({ saveSlotState: le.saveSlotState, getSlotState: le.getSlotState, removeSlotState: le.removeSlotState, getRegionSlots: le.getRegionSlots, saveMultiple: le.saveMultiple, persist: le.persist, load: le.load, restore: le.restore, clear: le.clear, configure: le.configure, getConfig: le.getConfig, enable: le.enable, disable: le.disable, isEnabled: le.isEnabled, subscribe: le.subscribe, getMetrics: le.getMetrics, healthCheck: le.healthCheck, info: le.info }),
    skeleton: Object.freeze({ create: je.create, destroy: je.destroy, destroyIn: je.destroyIn, destroyAll: je.destroyAll, hasActive: je.hasActive, listTemplates: je.listTemplates, registerTemplate: je.registerTemplate, unregisterTemplate: je.unregisterTemplate, configure: je.configure, getConfig: je.getConfig, TEMPLATES: Nm, getMetrics: je.getMetrics, healthCheck: je.healthCheck, info: je.info }),
    maintenance: Object.freeze({ activate: ve.activate, deactivate: ve.deactivate, isActive: ve.isActive, getState: ve.getState, isRegionAffected: ve.isRegionAffected, isFeatureAffected: ve.isFeatureAffected, canBypass: ve.canBypass, schedule: ve.schedule, cancelScheduled: ve.cancelScheduled, getScheduled: ve.getScheduled, configure: ve.configure, getConfig: ve.getConfig, subscribe: ve.subscribe, TYPES: ft, SEVERITY: Qn, getMetrics: ve.getMetrics, healthCheck: ve.healthCheck, info: ve.info }),
    focusManager: Object.freeze({ focusElement: R.focusElement, focusRegion: R.focusRegion, focusNext: R.focusNext, focusPrevious: R.focusPrevious, saveFocus: R.saveFocus, restoreFocus: R.restoreFocus, clearSavedFocus: R.clearSavedFocus, getSavedFocusKeys: R.getSavedFocusKeys, createTrap: R.createTrap, releaseTrap: R.releaseTrap, hasTrap: R.hasTrap, getActiveTraps: R.getActiveTraps, createGuard: R.createGuard, removeGuard: R.removeGuard, getHistory: R.getHistory, goBack: R.goBack, clearHistory: R.clearHistory, getCurrentFocus: R.getCurrentFocus, isFocused: R.isFocused, getFocusableIn: R.getFocusableIn, announce: R.announce, configure: R.configure, getConfig: R.getConfig, subscribe: R.subscribe, STRATEGIES: as, getMetrics: R.getMetrics, healthCheck: R.healthCheck, info: R.info }),
    a11y: Object.freeze({ enable: U.enable, disable: U.disable, toggle: U.toggle, enableMultiple: U.enableMultiple, reset: U.reset, isEnabled: U.isEnabled, getActivePresets: U.getActivePresets, listPresets: U.listPresets, getPresetConfig: U.getPresetConfig, setSetting: U.setSetting, getSetting: U.getSetting, getAllSettings: U.getAllSettings, removeSetting: U.removeSetting, detectSystemPreferences: U.detectSystemPreferences, applySystemPreferences: U.applySystemPreferences, configure: U.configure, getConfig: U.getConfig, subscribe: U.subscribe, PRESETS: qt, getMetrics: U.getMetrics, healthCheck: U.healthCheck, info: U.info }),
    animations: Object.freeze({ animate: P.animate, sequence: P.sequence, parallel: P.parallel, stagger: P.stagger, transitionIn: P.transitionIn, transitionOut: P.transitionOut, crossfade: P.crossfade, cancel: P.cancel, cancelAll: P.cancelAll, pause: P.pause, resume: P.resume, pauseAll: P.pauseAll, resumeAll: P.resumeAll, getActive: P.getActive, registerAnimation: P.registerAnimation, unregisterAnimation: P.unregisterAnimation, listAnimations: P.listAnimations, configure: P.configure, getConfig: P.getConfig, subscribe: P.subscribe, ANIMATIONS: Rr, EASINGS: Ku, getMetrics: P.getMetrics, healthCheck: P.healthCheck, info: P.info }),
    serviceWorker: Object.freeze({ register: C.register, unregister: C.unregister, checkForUpdates: C.checkForUpdates, applyUpdate: C.applyUpdate, skipWaiting: C.skipWaiting, hasUpdate: C.hasUpdate, postMessage: C.postMessage, onMessage: C.onMessage, clearCache: C.clearCache, precache: C.precache, getCacheNames: C.getCacheNames, getCacheSize: C.getCacheSize, registerSync: C.registerSync, getSyncTags: C.getSyncTags, requestPushPermission: C.requestPushPermission, getPushSubscription: C.getPushSubscription, subscribePush: C.subscribePush, isSupported: C.isSupported, isRegistered: C.isRegistered, isControlling: C.isControlling, getState: C.getState, getRegistration: C.getRegistration, startPeriodicCheck: C.startPeriodicCheck, stopPeriodicCheck: C.stopPeriodicCheck, configure: C.configure, getConfig: C.getConfig, subscribe: C.subscribe, SW_STATES: bn, UPDATE_STRATEGIES: xa, getMetrics: C.getMetrics, healthCheck: C.healthCheck, info: C.info }),
    virtualizer: Object.freeze({ create: Rt.create, get: Rt.get, destroy: Rt.destroy, destroyAll: Rt.destroyAll, listInstances: Rt.listInstances, SCROLL_DIRECTION: ts, getMetrics: Rt.getMetrics, healthCheck: Rt.healthCheck, info: Rt.info }),
    offline: Object.freeze({ isOnline: B.isOnline, isOffline: B.isOffline, getConnectionStatus: B.getConnectionStatus, getConnectionInfo: B.getConnectionInfo, getState: B.getState, queueAction: B.queueAction, removeAction: B.removeAction, getPendingActions: B.getPendingActions, getPendingCount: B.getPendingCount, clearPending: B.clearPending, syncPending: B.syncPending, getSyncStatus: B.getSyncStatus, ping: B.ping, configure: B.configure, getConfig: B.getConfig, subscribe: B.subscribe, destroy: B.destroy, CONNECTION_STATUS: wt, SYNC_STATUS: ps, getMetrics: B.getMetrics, healthCheck: B.healthCheck, info: B.info }),
    notify: Object.freeze({
      show: G.show,
      dismiss: G.dismiss,
      dismissAll: G.dismissAll,
      update: G.update,
      info: (t, n) => G.show(Object.assign({ type: "info", message: t }, n || {})),
      success: (t, n) => G.show(Object.assign({ type: "success", message: t }, n || {})),
      warning: (t, n) => G.show(Object.assign({ type: "warning", message: t }, n || {})),
      error: (t, n) => G.show(Object.assign({ type: "error", message: t, duration: 0 }, n || {})),
      loading: (t, n) => G.show(Object.assign({ type: "loading", message: t, duration: 0, dismissible: !1 }, n || {})),
      promise: G.promise,
      get: G.get,
      getAll: G.getAll,
      getByType: G.getByType,
      getQueueSize: G.getQueueSize,
      configure: G.configure,
      getConfig: G.getConfig,
      setPosition: G.setPosition,
      subscribe: G.subscribe,
      TYPES: Hs,
      POSITIONS: Vg,
      PRIORITIES: Gg,
      getMetrics: G.getMetrics,
      healthCheck: G.healthCheck
    }),
    shortcuts: Object.freeze({
      register: D.register,
      unregister: D.unregister,
      unregisterGroup: D.unregisterGroup,
      registerMany: D.registerMany,
      setScope: D.setScope,
      restoreScope: D.restoreScope,
      getScope: D.getScope,
      enable: D.enable,
      disable: D.disable,
      isEnabled: D.isEnabled,
      setEnabled: D.setEnabled,
      get: D.get,
      getAll: D.getAll,
      getByGroup: D.getByGroup,
      getGroups: D.getGroups,
      isRegistered: D.isRegistered,
      trigger: D.trigger,
      showHelp: D.showHelp,
      hideHelp: D.hideHelp,
      configure: D.configure,
      getConfig: D.getConfig,
      subscribe: D.subscribe,
      destroy: D.destroy,
      MODIFIER_KEYS: Zg,
      SCOPES: Qr,
      getMetrics: D.getMetrics,
      healthCheck: D.healthCheck,
      info: D.info
    }),
    gestures: Object.freeze({
      on: O.on,
      off: O.off,
      once: O.once,
      offAll: O.offAll,
      addToElement: O.addToElement,
      removeFromElement: O.removeFromElement,
      onSwipe: O.onSwipe,
      onSwipeLeft: O.onSwipeLeft,
      onSwipeRight: O.onSwipeRight,
      onSwipeUp: O.onSwipeUp,
      onSwipeDown: O.onSwipeDown,
      onTap: O.onTap,
      onDoubleTap: O.onDoubleTap,
      onLongPress: O.onLongPress,
      onPinch: O.onPinch,
      onPan: O.onPan,
      enable: O.enable,
      disable: O.disable,
      isEnabled: O.isEnabled,
      configure: O.configure,
      getConfig: O.getConfig,
      subscribe: O.subscribe,
      destroy: O.destroy,
      GESTURES: N,
      DIRECTIONS: Qt,
      getMetrics: O.getMetrics,
      healthCheck: O.healthCheck,
      info: O.info
    }),
    debugPresets: Object.freeze({
      apply: _.apply,
      applyCustom: _.applyCustom,
      disable: _.disable,
      revert: _.revert,
      getCurrent: _.getCurrent,
      getCurrentConfig: _.getCurrentConfig,
      getPrevious: _.getPrevious,
      isEnabled: _.isEnabled,
      getPresetConfig: _.getPresetConfig,
      listPresets: _.listPresets,
      getHistory: _.getHistory,
      configure: _.configure,
      getConfig: _.getConfig,
      subscribe: _.subscribe,
      minimal: _.minimal,
      standard: _.standard,
      verbose: _.verbose,
      performance: _.performance,
      network: _.network,
      memory: _.memory,
      events: _.events,
      regions: _.regions,
      PRESETS: Me,
      getMetrics: _.getMetrics,
      healthCheck: _.healthCheck,
      info: _.info
    }),
    configExporter: Object.freeze({
      exportConfig: $e.exportConfig,
      exportToFile: $e.exportToFile,
      exportToClipboard: $e.exportToClipboard,
      importConfig: $e.importConfig,
      importFromFile: $e.importFromFile,
      importFromClipboard: $e.importFromClipboard,
      getLastExport: $e.getLastExport,
      getLastImport: $e.getLastImport,
      configure: $e.configure,
      getConfig: $e.getConfig,
      subscribe: $e.subscribe,
      FORMATS: kr,
      SCOPES: Xa,
      getMetrics: $e.getMetrics,
      healthCheck: $e.healthCheck,
      info: $e.info
    }),
    regionMetrics: Object.freeze({
      trackRender: M.trackRender,
      trackUpdate: M.trackUpdate,
      trackVisibility: M.trackVisibility,
      trackInteraction: M.trackInteraction,
      trackError: M.trackError,
      trackLoad: M.trackLoad,
      startTimer: M.startTimer,
      endTimer: M.endTimer,
      getRegionMetrics: M.getRegionMetrics,
      getAllMetrics: M.getAllMetrics,
      getPerformanceSummary: M.getPerformanceSummary,
      getProblematicRegions: M.getProblematicRegions,
      enable: M.enable,
      disable: M.disable,
      isEnabled: M.isEnabled,
      reset: M.reset,
      resetRegion: M.resetRegion,
      configure: M.configure,
      getConfig: M.getConfig,
      subscribe: M.subscribe,
      METRIC_TYPES: nt,
      getMetrics: M.getMetrics,
      healthCheck: M.healthCheck,
      info: M.info
    }),
    commandPalette: Object.freeze({
      show: Q.show,
      hide: Q.hide,
      toggle: Q.toggle,
      isVisible: Q.isVisible,
      register: Q.register,
      registerMany: Q.registerMany,
      unregister: Q.unregister,
      execute: Q.execute,
      getCommand: Q.getCommand,
      getAllCommands: Q.getAllCommands,
      getCommandsByType: Q.getCommandsByType,
      getRecentCommands: Q.getRecentCommands,
      clearRecent: Q.clearRecent,
      configure: Q.configure,
      getConfig: Q.getConfig,
      subscribe: Q.subscribe,
      TYPES: Vt,
      getMetrics: Q.getMetrics,
      healthCheck: Q.healthCheck,
      info: Q.info
    }),
    stateSnapshots: Object.freeze({
      capture: H.capture,
      restore: H.restore,
      compare: H.compare,
      get: H.get,
      getAll: H.getAll,
      getLatest: H.getLatest,
      getByLabel: H.getByLabel,
      count: H.count,
      remove: H.remove,
      clear: H.clear,
      exportSnapshot: H.exportSnapshot,
      exportAll: H.exportAll,
      importSnapshot: H.importSnapshot,
      startAutoSnapshot: H.startAutoSnapshot,
      stopAutoSnapshot: H.stopAutoSnapshot,
      isAutoSnapshotRunning: H.isAutoSnapshotRunning,
      configure: H.configure,
      getConfig: H.getConfig,
      subscribe: H.subscribe,
      getMetrics: H.getMetrics,
      healthCheck: H.healthCheck,
      info: H.info
    }),
    docs: Object.freeze({
      show: () => (ae.open(), ae.setActiveTab("docs"), !0),
      hide: () => (ae.close(), !0),
      toggle: () => (ae.isOpen() ? ae.close() : (ae.open(), ae.setActiveTab("docs")), !0),
      isVisible: () => ae.isOpen(),
      goToSection: (t) => (ae.open(), ae.setActiveTab("docs"), !0),
      getSections: () => ["overview", "regions", "theme", "notifications", "shortcuts", "devtools"],
      configure: () => {
      },
      getConfig: () => ({ integratedInDebugPanel: !0, version: "3.0.0-INTEGRATED" }),
      subscribe: () => () => {
      },
      getMetrics: () => ({ redirectsToDebugPanel: !0 }),
      healthCheck: () => ({ status: "HEALTHY", note: "Integrated into Debug Panel v3.0.0" }),
      info: () => ({ moduleId: "interactive-docs", version: "3.0.0-INTEGRATED", integratedInDebugPanel: !0, debugPanelTab: "docs" })
    }),
    icons: Object.freeze({
      get: Yt.icon,
      getSpan: Yt.iconSpan,
      list: () => Object.keys(Yt.ICONS),
      ICONS: Yt.ICONS,
      healthCheck: Yt.healthCheck,
      info: Yt.info
    }),
    resize: Object.freeze({ getSize: Ne.getSize, getSizes: Ne.getSizes, setSize: Ne.setSize, resetSize: Ne.resetSize, resetAllSizes: Ne.resetAllSizes, getConfig: Ne.getConfig, isResizable: Ne.isResizable, getResizableRegions: Ne.getResizableRegions, startDragResize: Ne.startDragResize, isDragging: Ne.isDragging, getDraggingRegion: Ne.getDraggingRegion, subscribe: Ne.subscribe, healthCheck: Ne.healthCheck, info: Ne.info }),
    keyboard: Object.freeze({ navigateToRegion: ce.navigateToRegion, navigateNext: ce.navigateNext, navigatePrevious: ce.navigatePrevious, navigateToMain: ce.navigateToMain, getCurrentRegion: ce.getCurrentRegion, getNavigationOrder: ce.getNavigationOrder, setNavigationOrder: ce.setNavigationOrder, setTabTrap: ce.setTabTrap, releaseTabTrap: ce.releaseTabTrap, isTabTrapped: ce.isTabTrapped, getTabTrapRegion: ce.getTabTrapRegion, enable: ce.enable, disable: ce.disable, isEnabled: ce.isEnabled, subscribe: ce.subscribe, healthCheck: ce.healthCheck, info: ce.info }),
    loading: Object.freeze({ isLoading: Ye.isLoading, setLoading: Ye.setLoading, startLoading: Ye.startLoading, endLoading: Ye.endLoading, setSkeleton: Ye.setSkeleton, setMultipleLoading: Ye.setMultipleLoading, endAllLoading: Ye.endAllLoading, getLoadingState: Ye.getLoadingState, getLoadingRegions: Ye.getLoadingRegions, isAnyLoading: Ye.isAnyLoading, subscribe: Ye.subscribe, healthCheck: Ye.healthCheck, info: Ye.info }),
    responsive: Object.freeze({ getCurrentBreakpoint: ne.getCurrentBreakpoint, getBreakpointInfo: ne.getBreakpointInfo, getBreakpoints: ne.getBreakpoints, getCurrentPolicy: ne.getCurrentPolicy, isMobile: ne.isMobile, isTablet: ne.isTablet, isDesktop: ne.isDesktop, enable: ne.enable, disable: ne.disable, isEnabled: ne.isEnabled, reapplyPolicy: ne.reapplyPolicy, setAutoApply: ne.setAutoApply, setUserOverride: ne.setUserOverride, clearUserOverride: ne.clearUserOverride, clearAllOverrides: ne.clearAllOverrides, getUserOverrides: ne.getUserOverrides, subscribe: ne.subscribe, healthCheck: ne.healthCheck, info: ne.info }),
    visibility: Object.freeze({ isVisible: ye.isVisible, show: ye.show, hide: ye.hide, toggle: ye.toggle, setVisibility: ye.setVisibility, getState: ye.getVisibilityState, reset: ye.resetVisibility, enterFullscreen: ye.enterFullscreen, exitFullscreen: ye.exitFullscreen, toggleFullscreen: ye.toggleFullscreen, isFullscreen: ye.isFullscreenMode, subscribe: ye.subscribe, healthCheck: ye.healthCheck, info: ye.info }),
    layoutPrefs: Object.freeze({ get: W.get, getPreference: W.getPreference, setPreference: W.setPreference, setPreferences: W.setPreferences, reset: W.reset, subscribe: W.subscribe, isSidebarCollapsed: W.isSidebarCollapsed, setSidebarCollapsed: W.setSidebarCollapsed, toggleSidebar: W.toggleSidebar, getSidebarWidth: W.getSidebarWidth, setSidebarWidth: W.setSidebarWidth, getLayoutMode: W.getLayoutMode, setLayoutMode: W.setLayoutMode, isFullscreen: W.isFullscreen, getThemeMode: W.getThemeMode, setThemeMode: W.setThemeMode, healthCheck: W.healthCheck, info: W.info })
  };
}
function T_(e) {
  return Object.freeze({
    store: Dn,
    lifecycle: Jf,
    readiness: wv,
    regions: pa,
    transitions: Qf,
    systemPages: ff,
    adapters: jf,
    metrics: () => ({ ...e.metrics, connectedAdapters: sr() }),
    validateRegions: uc,
    transitionHistory: Gf,
    phaseTimings: qf,
    accessCounts: Cf,
    layoutPrefs: W.info,
    visibility: ye.info,
    responsive: ne.info,
    keyboard: ce.info,
    resize: Ne.info,
    loading: Ye.info,
    theme: se.info,
    events: He.info,
    slots: Ce.info,
    performance: ue.info,
    debugPanel: ae.info,
    autoHealthCheck: Ie.info,
    logger: q.getInfo,
    rateLimiter: ze.info,
    configValidator: kt.info,
    cacheStats: da,
    apiMetrics: Z.info,
    memoryLeaks: me.info,
    analytics: L.info,
    circuitBreaker: Y.info,
    lazyLoader: ge.info,
    bundleAnalyzer: tt.info,
    layoutPresets: Ae.info,
    slotPersistence: le.info,
    skeleton: je.info,
    maintenance: ve.info,
    focusManager: R.info,
    a11y: U.info,
    animations: P.info,
    serviceWorker: C.info,
    virtualizer: Rt.info,
    offline: B.info,
    notifications: G.info,
    shortcuts: D.info,
    gestures: O.info,
    debugPresets: _.info,
    configExporter: $e.info,
    regionMetrics: M.info,
    commandPalette: Q.info,
    stateSnapshots: H.info,
    icons: Yt.info
  });
}
const aa = "7.5.0-P2-ENTERPRISE", Ji = "app-shell", ko = et({ moduleId: Ji }), w_ = () => ko.init(), C_ = (e) => ko.get(e), A_ = (e) => ko.inject(e), I_ = () => ko.snapshot(), D_ = q.createLogger(Ji);
w_();
const Fl = { initCount: 0, shutdownCount: 0, errors: 0, adaptersConnected: 0, lastInitAt: null, lastShutdownAt: null, lastActivity: null, initDuration: null };
let Vl = !1;
const mn = {
  logger: D_,
  metrics: Fl,
  Ports: ko,
  VERSION: aa,
  MODULE_ID: Ji,
  isInitialized: () => Vl,
  setInitialized: (e) => {
    Vl = e;
  },
  getPort: C_,
  getStatus: () => Zf(),
  // shutdown & doInit set after AppShell creation (circular ref)
  shutdown: null,
  doInit: null
}, O_ = S_(), y = {
  version: aa,
  name: Ji,
  // Core Operations (delegated to core/init-shutdown.js)
  init: jO(mn),
  _doInit: HO(mn),
  shutdown: UO(mn),
  finalize: BO(mn),
  // Health & Info (delegated to core/health-info.js)
  healthCheck: E_(mn),
  info: k_(mn),
  // Direct API methods
  region: (e) => (Fl.lastActivity = Date.now(), Z.trackCall("AppShell", "region"), ke(e)),
  requestLayout: (e, t = {}) => Vy.requestLayout(e, t),
  connectAdapter: (e) => {
    const t = kn[e];
    return t ? cs(e, t).then((n) => ({ ok: n, adapter: e })) : Promise.resolve({ ok: !1, error: "Unknown adapter" });
  },
  ready: (e) => Tv(e),
  waitReady: (e = 1e4) => WO(e),
  getStatus: () => Zf(),
  isInitialized: () => Vl,
  isReady: () => ha(),
  isMounted: () => y0(),
  getPhase: () => v0(),
  subscribe: (e) => Yf(e),
  fadeOutPreloader: (e) => z0(e),
  setLoading: (e) => {
    N0(e), Ly.dispatchLoading(e);
  },
  setError: (e) => $0(e),
  // All 44 frozen namespaces (delegated to api/namespaces.js)
  ...O_,
  // Utility getters
  getVersion: () => aa,
  getModuleId: () => Ji,
  getMetrics: () => ({ ...Fl, connectedAdapters: sr() }),
  getBootTime: () => ao(),
  validateRegions: () => uc(),
  clearRegionCache: () => cc(),
  regions: () => rb(),
  getAllRegions: () => ib(),
  injectPorts: A_,
  getPorts: I_,
  adapters: p0(),
  // Debug namespace (delegated to api/namespaces.js)
  debug: T_(mn)
};
mn.shutdown = y.shutdown;
mn.doInit = y._doInit;
if (typeof window < "u") {
  const e = Ur();
  window.AppShellReady = !1, e || (window.AppShell = y), window.__dev = window.__dev || {}, window.__dev.appShell = { info: () => y.info(), healthCheck: () => y.healthCheck(), status: () => y.getStatus(), debug: y.debug, init: (t) => y.init(t), shutdown: () => y.shutdown(), requestLayout: (t, n) => y.requestLayout(t, n), connectAdapter: (t) => y.connectAdapter(t), layoutPrefs: y.layoutPrefs, visibility: y.visibility, responsive: y.responsive, keyboard: y.keyboard, resize: y.resize, loading: y.loading, theme: y.theme, events: y.events, slots: y.slots, perf: y.perf, debugPanel: y.debugPanel, autoHealthCheck: y.autoHealthCheck, logger: y.logger, rateLimiter: y.rateLimiter, configValidator: y.configValidator, cache: y.cache, apiMetrics: y.apiMetrics, memoryLeaks: y.memoryLeaks, analytics: y.analytics, circuitBreaker: y.circuitBreaker, lazyLoader: y.lazyLoader, bundleAnalyzer: y.bundleAnalyzer, layoutPresets: y.layoutPresets, slotPersistence: y.slotPersistence, skeleton: y.skeleton, maintenance: y.maintenance, focusManager: y.focusManager, a11y: y.a11y, animations: y.animations, serviceWorker: y.serviceWorker, virtualizer: y.virtualizer, offline: y.offline, notify: y.notify, shortcuts: y.shortcuts, gestures: y.gestures, debugPresets: y.debugPresets, configExporter: y.configExporter, regionMetrics: y.regionMetrics, commandPalette: y.commandPalette, stateSnapshots: y.stateSnapshots, docs: y.docs, icons: y.icons }, Ir("kernel:exposed", { version: aa, architecture: "KERNEL-AAA-v7", adapters: Object.keys(kn), phase2Complete: !0, uiUnified: !0, strictMode: e });
}
export {
  qt as A11Y_PRESETS,
  Rr as ANIMATIONS,
  Z as APIUsageMetrics,
  U as AccessibilityPresets,
  L as AnalyticsExporter,
  P as AnimationAPI,
  y as AppShell,
  Ie as AutoHealthCheck,
  tt as BundleAnalyzer,
  Qe as CB_STATES,
  Vt as COMMAND_TYPES,
  wt as CONNECTION_STATUS,
  Y as CircuitBreaker,
  Q as CommandPalette,
  $e as ConfigExporter,
  kt as ConfigValidator,
  Rt as ContentVirtualizer,
  Me as DEBUG_PRESETS,
  ae as DebugPanel,
  _ as DebugPresets,
  Ku as EASINGS,
  Li as ENTERPRISE_STRICT,
  kr as EXPORT_FORMATS,
  Xa as EXPORT_SCOPES,
  as as FOCUS_STRATEGIES,
  R as FocusManager,
  N as GESTURES,
  Qt as GESTURE_DIRECTIONS,
  O as GestureHandler,
  Yt as Icons,
  ce as KeyboardNavigation,
  D as KeyboardShortcuts,
  $a as LAYOUT_PRESETS,
  qe as LIFECYCLE_STATES,
  gt as LOAD_STATES,
  Ft as LOG_LEVELS,
  W as LayoutPersistence,
  Ae as LayoutPresets,
  ge as LazyLoader,
  q as Logger,
  Qn as MAINTENANCE_SEVERITY,
  ft as MAINTENANCE_TYPES,
  nt as METRIC_TYPES,
  Zg as MODIFIER_KEYS,
  Ji as MODULE_ID,
  ve as MaintenanceMode,
  me as MemoryLeakDetector,
  Vg as NOTIFICATION_POSITIONS,
  Gg as NOTIFICATION_PRIORITIES,
  Hs as NOTIFICATION_TYPES,
  G as NotificationCenter,
  B as OfflineManager,
  ue as PerformanceMetrics,
  Rn as REGION_EVENTS,
  Ze as REGION_MAP,
  ze as RateLimiter,
  He as RegionEvents,
  Ye as RegionLoading,
  M as RegionMetrics,
  Ne as RegionResize,
  Ce as RegionSlots,
  ye as RegionVisibility,
  ne as ResponsiveAdapter,
  ts as SCROLL_DIRECTION,
  Qr as SHORTCUT_SCOPES,
  Nm as SKELETON_TEMPLATES,
  Mt as SLOT_POSITIONS,
  bn as SW_STATES,
  ps as SYNC_STATUS,
  C as ServiceWorkerManager,
  je as SkeletonLoader,
  le as SlotPersistence,
  H as StateSnapshots,
  X as THEMES,
  se as ThemeIntegration,
  xa as UPDATE_STRATEGIES,
  aa as VERSION,
  y as default,
  I_ as getPorts,
  A_ as injectPorts
};
