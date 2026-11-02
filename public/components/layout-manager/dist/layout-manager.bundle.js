import { createCorePorts as x, createUiPorts as at } from "/core/runtime/ports-profiles.js";
import { isStrict as on, recordViolation as Bn } from "/core/runtime/enterprise/strict-mode.js";
import { TELEMETRY_EVENTS as xn, LAYOUT_EVENTS as ye, ORCHESTRATOR_EVENTS as At } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const Ne = "4.3.0-P17WI", Se = "layout-store", de = x({ moduleId: Se });
function st(e) {
  return de.get(e);
}
function zn(e) {
  return de.inject(e);
}
function Nn() {
  return de.snapshot();
}
let $e = !1;
const an = () => {
  const e = st("config");
  return !!($e || e && e.app && e.app.debug);
}, A = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), n = st("logger");
  if (!n) return;
  const o = `[${Se}]`;
  if (e === "error") {
    n.error && n.error(...[o].concat(t));
    return;
  }
  if (e === "warn") {
    n.warn && n.warn(...[o].concat(t));
    return;
  }
  an() && n.debug && n.debug(...[o].concat(t));
}, i = { layoutState: "default", breakpoint: "desktop", width: 0, height: 0, orientation: "landscape", mode: "default", compact: !1, sidebarCollapsed: !1, sidebarMobileOpen: !1, fullscreen: !1, globalLoading: !1, scrollLocked: !1, preloaderActive: !1, modalOpen: !1, gridColumns: 12, lastChange: null }, X = /* @__PURE__ */ new Set();
let O = { setCount: 0, updateCount: 0, breakpointChangeCount: 0, compactChangeCount: 0, sidebarChangeCount: 0, mobileOpenChangeCount: 0, fullscreenChangeCount: 0, globalLoadingChangeCount: 0, layoutStateChangeCount: 0, listenerErrorCount: 0, lastSetAt: null };
const a = { setDebug(e) {
  $e = !!e, A("info", "Debug mode:", $e);
}, get(e) {
  return e ? i[e] : Object.assign({}, i);
}, set(e, t) {
  const n = i[e];
  return n === t ? !1 : (i[e] = t, i.lastChange = Date.now(), O.setCount++, O.lastSetAt = Date.now(), this._notify("set", e, t, n), A("info", "Set:", e, "=", t), !0);
}, update(e) {
  const t = Object.assign({}, i);
  let n = !1;
  const o = Object.keys(e);
  for (let s = 0; s < o.length; s++) {
    const r = o[s];
    i[r] !== e[r] && (i[r] = e[r], n = !0);
  }
  return n ? (i.lastChange = Date.now(), O.updateCount++, O.lastSetAt = Date.now(), this._notify("update", null, e, t), A("info", "Update:", o.join(", ")), !0) : !1;
}, getLayoutState() {
  return i.layoutState;
}, setLayoutState(e) {
  const t = i.layoutState;
  return t === e ? !1 : (i.layoutState = e, i.lastChange = Date.now(), O.layoutStateChangeCount++, this._notify("layout-state-change", "layoutState", e, t), A("info", "Layout State:", t, "->", e), !0);
}, getBreakpoint() {
  return i.breakpoint;
}, setBreakpoint(e) {
  const t = i.breakpoint;
  return t === e ? !1 : (i.breakpoint = e, i.lastChange = Date.now(), O.breakpointChangeCount++, O.lastSetAt = Date.now(), this._notify("breakpoint-change", "breakpoint", e, t), A("info", "Breakpoint changed:", t, "->", e), !0);
}, getDimensions() {
  return { width: i.width, height: i.height };
}, setDimensions(e, t) {
  return i.width === e && i.height === t ? !1 : (i.width = e, i.height = t, i.lastChange = Date.now(), this._notify("dimensions-change", "dimensions", { width: e, height: t }, null), !0);
}, isCompact() {
  return i.compact;
}, setCompact(e) {
  const t = i.compact;
  return t === e ? !1 : (i.compact = e, i.lastChange = Date.now(), O.compactChangeCount++, this._notify("compact-change", "compact", e, t), A("info", "Compact:", e), !0);
}, isSidebarCollapsed() {
  return i.sidebarCollapsed;
}, setSidebarCollapsed(e) {
  const t = i.sidebarCollapsed;
  return t === e ? !1 : (i.sidebarCollapsed = e, i.lastChange = Date.now(), O.sidebarChangeCount++, this._notify("sidebar-change", "sidebarCollapsed", e, t), A("info", "Sidebar collapsed:", e), !0);
}, isSidebarMobileOpen() {
  return i.sidebarMobileOpen;
}, setSidebarMobileOpen(e) {
  const t = i.sidebarMobileOpen;
  return t === e ? !1 : (i.sidebarMobileOpen = e, i.lastChange = Date.now(), O.mobileOpenChangeCount++, this._notify("sidebar-mobile-change", "sidebarMobileOpen", e, t), A("info", "Sidebar mobile open:", e), !0);
}, isFullscreen() {
  return i.fullscreen;
}, setFullscreen(e) {
  const t = i.fullscreen;
  return t === e ? !1 : (i.fullscreen = e, i.lastChange = Date.now(), O.fullscreenChangeCount++, this._notify("fullscreen-change", "fullscreen", e, t), A("info", "Fullscreen:", e), !0);
}, isGlobalLoading() {
  return i.globalLoading;
}, setGlobalLoading(e) {
  const t = i.globalLoading;
  return t === e ? !1 : (i.globalLoading = e, i.lastChange = Date.now(), O.globalLoadingChangeCount++, this._notify("global-loading-change", "globalLoading", e, t), A("info", "Global loading:", e), !0);
}, isScrollLocked() {
  return i.scrollLocked;
}, setScrollLocked(e) {
  const t = i.scrollLocked;
  return t === e ? !1 : (i.scrollLocked = e, i.lastChange = Date.now(), this._notify("scroll-locked-change", "scrollLocked", e, t), A("info", "Scroll locked:", e), !0);
}, isPreloaderActive() {
  return i.preloaderActive;
}, setPreloaderActive(e) {
  const t = i.preloaderActive;
  return t === e ? !1 : (i.preloaderActive = e, i.lastChange = Date.now(), this._notify("preloader-change", "preloaderActive", e, t), A("info", "Preloader active:", e), !0);
}, isModalOpen() {
  return i.modalOpen;
}, setModalOpen(e) {
  const t = i.modalOpen;
  return t === e ? !1 : (i.modalOpen = e, i.lastChange = Date.now(), this._notify("modal-change", "modalOpen", e, t), A("info", "Modal open:", e), !0);
}, subscribe(e) {
  return typeof e != "function" ? (A("error", "Listener must be a function"), () => {
  }) : (X.add(e), A("info", "Listener added, total:", X.size), () => {
    X.delete(e), A("info", "Listener removed, total:", X.size);
  });
}, _notify(e, t, n, o) {
  const s = this;
  X.forEach((r) => {
    try {
      r({ action: e, key: t, newValue: n, oldValue: o, state: s.get() });
    } catch (u) {
      O.listenerErrorCount++, A("error", "Listener error:", u.message);
    }
  });
}, validateState() {
  const e = [];
  return i.fullscreen && i.sidebarMobileOpen && e.push("fullscreen-with-sidebar-mobile-open"), i.layoutState === "kiosk" && i.modalOpen && e.push("kiosk-with-modal-open"), { valid: e.length === 0, issues: e };
}, healthCheck() {
  const e = de.snapshot(), t = this.validateState(), n = st("logger"), o = { hasBreakpoint: !!i.breakpoint, hasDimensions: i.width > 0 && i.height > 0, hasLayoutState: !!i.layoutState, stateConsistent: t.valid, noListenerErrors: O.listenerErrorCount === 0, validOrientation: i.orientation === "landscape" || i.orientation === "portrait", portsInitialized: e._initialized, loggerAvailable: !!n }, s = Object.values(o).filter(Boolean).length, r = Object.keys(o).length;
  return { status: s === r ? "HEALTHY" : s >= r * 0.5 ? "DEGRADED" : "UNHEALTHY", score: `${s}/${r}`, checks: o, validation: t, compliance: "ENTERPRISE-AAA", version: Ne, moduleId: Se, portsInitialized: e._initialized, timestamp: Date.now() };
}, info() {
  const e = de.snapshot();
  return { version: Ne, moduleId: Se, debug: an(), compliance: "ENTERPRISE-AAA", state: Object.assign({}, i), listenerCount: X.size, metrics: Object.assign({}, O), validation: this.validateState(), portsInitialized: e._initialized, healthCheck: this.healthCheck() };
}, resetMetrics() {
  O = { setCount: 0, updateCount: 0, breakpointChangeCount: 0, compactChangeCount: 0, sidebarChangeCount: 0, mobileOpenChangeCount: 0, fullscreenChangeCount: 0, globalLoadingChangeCount: 0, layoutStateChangeCount: 0, listenerErrorCount: 0, lastSetAt: null };
}, toJSON() {
  return Object.assign({}, i);
}, getVersion() {
  return Ne;
}, injectPorts: zn, getPorts: Nn }, je = "2.4.0-P17WI", Te = "layout-manager.core.breakpoints", Ge = x({ moduleId: Te });
function sn(e) {
  return Ge.get(e);
}
const Fe = { xs: { min: 0, max: 575, name: "xs", label: "Extra Small" }, sm: { min: 576, max: 767, name: "sm", label: "Small" }, md: { min: 768, max: 991, name: "md", label: "Medium" }, lg: { min: 992, max: 1199, name: "lg", label: "Large" }, xl: { min: 1200, max: 1399, name: "xl", label: "Extra Large" }, xxl: { min: 1400, max: 1 / 0, name: "xxl", label: "Extra Extra Large" } }, R = ["xs", "sm", "md", "lg", "xl", "xxl"], Ot = ["xs", "sm"], vt = ["md"], St = ["lg", "xl", "xxl"];
let Ye = !1, ie = { detectCount: 0, configureCount: 0, resetCount: 0 };
const Tt = (e, t) => {
  const n = sn("logger");
  n && Ye && n.debug && n.debug(`[${Te}]`, t);
}, d = {
  breakpoints: Object.assign({}, Fe),
  setDebug(e) {
    Ye = e;
  },
  configure(e) {
    this.breakpoints = Object.assign({}, Fe, e), ie.configureCount++, Tt("info", "Breakpoints configured");
  },
  reset() {
    this.breakpoints = Object.assign({}, Fe), ie.resetCount++, Tt("info", "Breakpoints reset to defaults");
  },
  get(e) {
    return this.breakpoints[e] || null;
  },
  list() {
    return Object.keys(this.breakpoints);
  },
  getAll() {
    return Object.assign({}, this.breakpoints);
  },
  detect(e) {
    ie.detectCount++;
    for (let t = 0; t < R.length; t++) {
      const n = R[t], o = this.breakpoints[n];
      if (o && e >= o.min && e <= o.max) return n;
    }
    return "xl";
  },
  isMobile(e) {
    return Ot.indexOf(e) !== -1;
  },
  isTablet(e) {
    return vt.indexOf(e) !== -1;
  },
  isDesktop(e) {
    return St.indexOf(e) !== -1;
  },
  isAtLeast(e, t) {
    const n = R.indexOf(e), o = R.indexOf(t);
    return n >= o;
  },
  isAtMost(e, t) {
    const n = R.indexOf(e), o = R.indexOf(t);
    return n <= o;
  },
  getMediaQuery(e) {
    const t = this.breakpoints[e];
    return t ? t.max === 1 / 0 ? `(min-width: ${t.min}px)` : `(min-width: ${t.min}px) and (max-width: ${t.max}px)` : "";
  },
  healthCheck() {
    const e = sn("logger"), t = { hasBreakpoints: Object.keys(this.breakpoints).length > 0, hasAllDefaults: R.every(function(o) {
      return !!this.breakpoints[o];
    }, this), validOrder: R.length === 6, loggerAvailable: !!e, portsInitialized: Ge.isInitialized() };
    let n = 0;
    for (const o in t)
      t[o] && n++;
    return { status: n === Object.keys(t).length ? "HEALTHY" : "DEGRADED", score: `${n}/${Object.keys(t).length}`, checks: t, version: je, moduleId: Te, timestamp: Date.now() };
  },
  info() {
    return { version: je, moduleId: Te, debug: Ye, portsInitialized: Ge.isInitialized(), breakpointCount: Object.keys(this.breakpoints).length, breakpointOrder: R, breakpoints: Object.assign({}, this.breakpoints), ranges: { mobile: Ot, tablet: vt, desktop: St }, metrics: Object.assign({}, ie), healthCheck: this.healthCheck() };
  },
  resetMetrics() {
    ie = { detectCount: 0, configureCount: 0, resetCount: 0 };
  },
  getVersion() {
    return je;
  }
}, rn = "2.6.0-P17WI", Re = "layout-manager.telemetry.tracker", rt = x({ moduleId: Re });
function B(e) {
  return rt.get(e);
}
const Lt = "layout-manager", qe = "layout:", U = [], it = 500;
let lt = !1, M = { totalEvents: 0, eventsByType: {}, telemetryCoreForwards: 0, eventBusForwards: 0, lastEventAt: null, lastEventLocalTime: null };
const jn = (e, t, n) => {
  const o = B("logger");
  o && lt && o.debug && o.debug(`[${Re}]`, t, n || "");
};
function ct() {
  const e = B("telemetry");
  if (e && e.buildTimestamp) return e.buildTimestamp();
  const t = Date.now();
  return { timestampUtc: t, isoUtc: new Date(t).toISOString(), localTime: new Date(t).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
function kt(e) {
  lt = e;
}
function Fn(e) {
  return e.indexOf(qe) === 0 ? e : qe + e;
}
function c(e, t) {
  t || (t = {});
  const n = ct(), o = Fn(e), s = { timestampUtc: n.timestampUtc, localTime: n.localTime, timeZone: n.timeZone, component: Lt, event: o, data: t };
  U.push(s), U.length > it && U.shift(), M.totalEvents++, M.eventsByType[o] = (M.eventsByType[o] || 0) + 1, M.lastEventAt = n.timestampUtc, M.lastEventLocalTime = n.localTime;
  const r = B("telemetry");
  if (r)
    try {
      r.track(o, Object.assign({ component: Lt, timestampUtc: n.timestampUtc, localTime: n.localTime }, t)), M.telemetryCoreForwards++;
    } catch {
    }
  const u = B("eventBus");
  if (u)
    try {
      u.emit(xn.EVENT, s), M.eventBusForwards++;
    } catch {
    }
  return jn("info", `[${n.localTime}] Event:`, o), s;
}
function Un() {
  return U.slice();
}
function Hn(e) {
  return e || (e = 10), U.slice(-e);
}
function Ke() {
  const e = ct(), t = B("telemetry"), n = B("logger"), o = !!(t && t.buildTimestamp), s = { logInitialized: Array.isArray(U), logNotOverflowing: U.length < it, hasTrackedEvents: M.totalEvents > 0, buildTimestampAvailable: o, portsInitialized: rt.isInitialized(), loggerAvailable: !!n };
  let r = 0;
  for (const u in s)
    s[u] && r++;
  return { status: r === Object.keys(s).length ? "HEALTHY" : "DEGRADED", score: r, maxScore: Object.keys(s).length, scoreDisplay: `${r}/${Object.keys(s).length}`, checks: s, version: rn, moduleId: Re, timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone };
}
function wt() {
  const e = ct(), t = B("telemetry"), n = B("eventBus"), o = B("logger");
  return { version: rn, moduleId: Re, debug: lt, portsInitialized: rt.isInitialized(), eventLogSize: U.length, maxLogSize: it, eventPrefix: qe, metrics: Object.assign({}, M), healthCheck: Ke(), integrations: { telemetryCoreAvailable: !!t, eventBusAvailable: !!n, loggerAvailable: !!o }, timestampUtc: e.timestampUtc, localTime: e.localTime, timeZone: e.timeZone };
}
function Et() {
  M = { totalEvents: 0, eventsByType: {}, telemetryCoreForwards: 0, eventBusForwards: 0, lastEventAt: null, lastEventLocalTime: null };
}
const ln = "2.4.0-P17WI", pe = "layout-helpers", ge = at({ moduleId: pe });
function cn() {
  ge.init();
}
function un(e) {
  return ge.get(e);
}
let ut = !1, V = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 };
const fe = { xs: { max: 575, columns: 4 }, sm: { max: 767, columns: 6 }, md: { max: 991, columns: 8 }, lg: { max: 1199, columns: 10 }, xl: { max: 1 / 0, columns: 12 } }, Ce = function(e) {
  const t = Array.prototype.slice.call(arguments, 1);
  cn();
  const n = un("logger");
  if (n) {
    if (e === "error") {
      n.error && n.error(...[`[${pe}]`].concat(t));
      return;
    }
    ut && n.debug && n.debug(...[`[${pe}]`].concat(t));
  }
};
function Dt(e) {
  ut = e;
}
function Ve() {
  return V.viewportCalls++, typeof window > "u" ? { width: 1920, height: 1080 } : { width: window.innerWidth || document.documentElement.clientWidth, height: window.innerHeight || document.documentElement.clientHeight };
}
function It() {
  const e = Ve();
  return e.width >= e.height ? "landscape" : "portrait";
}
function $n(e, t) {
  t = t || 100, V.debouncesCreated++;
  let n;
  return function() {
    const o = arguments, s = this;
    clearTimeout(n), n = setTimeout(() => {
      e.apply(s, o);
    }, t);
  };
}
function Mt(e, t) {
  if (typeof localStorage > "u") return !1;
  const n = `dshowdash-layout-${e}`;
  try {
    const o = JSON.stringify(t);
    return localStorage.getItem(n) === o ? (V.preferenceSkipped++, Ce("info", "Preference unchanged, skipped:", e), !0) : (localStorage.setItem(n, o), V.preferenceSaves++, Ce("info", "Preference saved:", e), !0);
  } catch (o) {
    return Ce("error", "Save preference error:", o.message), !1;
  }
}
function _t(e) {
  if (typeof localStorage > "u") return null;
  try {
    const t = localStorage.getItem(`dshowdash-layout-${e}`);
    return V.preferenceLoads++, t ? JSON.parse(t) : null;
  } catch (t) {
    return Ce("error", "Load preference error:", t.message), null;
  }
}
function Rt(e) {
  const t = Object.keys(fe);
  for (let n = 0; n < t.length; n++) {
    const o = t[n], s = fe[o];
    if (e <= s.max) return s.columns;
  }
  return 12;
}
function Gn() {
  return Object.assign({}, fe);
}
function dn() {
  return typeof window > "u" ? !1 : "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
function pn() {
  return typeof window > "u" ? 1 : window.devicePixelRatio || 1;
}
function Qe() {
  cn();
  const e = un("logger"), t = { windowAvailable: typeof window < "u", localStorageAvailable: typeof localStorage < "u", gridMapValid: Object.keys(fe).length >= 4, loggerAvailable: !!e, portsInitialized: ge.isInitialized() }, n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
  return { status: n === o ? "HEALTHY" : "DEGRADED", score: `${n}/${o}`, checks: t, version: ln, moduleId: pe, portsInitialized: ge.isInitialized(), timestamp: Date.now() };
}
function Pt() {
  return { version: ln, moduleId: pe, debug: ut, portsInitialized: ge.isInitialized(), metrics: Object.assign({}, V), gridColumnsMap: Object.assign({}, fe), healthCheck: Qe(), environment: { windowAvailable: typeof window < "u", localStorageAvailable: typeof localStorage < "u", isTouch: dn(), pixelRatio: pn() } };
}
function Bt() {
  V = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 };
}
const Ue = "2.4.0-P17WI", Le = "layout-manager.core.detector", We = x({ moduleId: Le });
function gn(e) {
  return We.get(e);
}
let z = null, P = null, Ze = !1, D = { detectCount: 0, resizeEventCount: 0, breakpointChangeCount: 0, orientationChangeCount: 0, lastDetectAt: null, lastBreakpointChangeAt: null, lastOrientationChangeAt: null };
const H = (e, t, n) => {
  const o = gn("logger");
  o && Ze && o.debug && o.debug(`[${Le}]`, t, n || "");
}, g = {
  setDebug(e) {
    Ze = e;
  },
  detectCurrent() {
    const e = Ve(), t = e.width, n = e.height, o = d.detect(t), s = It(), r = Rt(t);
    return a.update({ width: t, height: n, breakpoint: o, orientation: s, gridColumns: r }), D.detectCount++, D.lastDetectAt = Date.now(), c("layout:detected", { width: t, height: n, breakpoint: o, orientation: s }), H("info", "Detected:", `${o} ${t}x${n}`), { width: t, height: n, breakpoint: o, orientation: s, gridColumns: r };
  },
  startResizeListener(e) {
    if (e || (e = {}), typeof window > "u") return;
    z && this.stopResizeListener();
    const t = e.debounceDelay || 150, n = $n(() => {
      D.resizeEventCount++;
      const o = a.getBreakpoint(), s = Ve(), r = s.width, u = s.height, h = d.detect(r), b = It(), k = Rt(r);
      a.setDimensions(r, u), a.set("orientation", b), a.set("gridColumns", k), h !== o && (a.setBreakpoint(h), D.breakpointChangeCount++, D.lastBreakpointChangeAt = Date.now(), c("layout:breakpoint:changed", { from: o, to: h, width: r, height: u }), H("info", "Breakpoint:", `${o} -> ${h}`));
    }, t);
    window.addEventListener("resize", n, { passive: !0 }), z = n, c("layout:resize:listener:started"), H("info", "Resize listener started");
  },
  stopResizeListener() {
    !z || typeof window > "u" || (window.removeEventListener("resize", z), z = null, c("layout:resize:listener:stopped"), H("info", "Resize listener stopped"));
  },
  startOrientationListener() {
    if (typeof window > "u" || !window.matchMedia) return;
    P && this.stopOrientationListener();
    const e = window.matchMedia("(orientation: portrait)"), t = (n) => {
      const o = n.matches ? "portrait" : "landscape", s = a.get("orientation");
      o !== s && (a.set("orientation", o), D.orientationChangeCount++, D.lastOrientationChangeAt = Date.now(), c("layout:orientation:changed", { from: s, to: o }), H("info", "Orientation:", `${s} -> ${o}`));
    };
    e.addEventListener ? e.addEventListener("change", t) : e.addListener && e.addListener(t), P = { mediaQuery: e, handler: t }, c("layout:orientation:listener:started"), H("info", "Orientation listener started");
  },
  stopOrientationListener() {
    if (!P) return;
    const e = P.mediaQuery, t = P.handler;
    e.removeEventListener ? e.removeEventListener("change", t) : e.removeListener && e.removeListener(t), P = null, c("layout:orientation:listener:stopped"), H("info", "Orientation listener stopped");
  },
  hasResizeListener() {
    return z !== null;
  },
  hasOrientationListener() {
    return P !== null;
  },
  healthCheck() {
    const e = gn("logger"), t = { resizeListenerActive: z !== null, orientationListenerActive: P !== null, hasDetected: D.detectCount > 0, windowAvailable: typeof window < "u", loggerAvailable: !!e, portsInitialized: We.isInitialized() };
    let n = 0;
    for (const o in t)
      t[o] && n++;
    return { status: n === Object.keys(t).length ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${n}/${Object.keys(t).length}`, checks: t, version: Ue, moduleId: Le, timestamp: Date.now() };
  },
  info() {
    return { version: Ue, moduleId: Le, debug: Ze, portsInitialized: We.isInitialized(), listeners: { resize: z !== null, orientation: P !== null }, metrics: Object.assign({}, D), healthCheck: this.healthCheck() };
  },
  resetMetrics() {
    D = { detectCount: 0, resizeEventCount: 0, breakpointChangeCount: 0, orientationChangeCount: 0, lastDetectAt: null, lastBreakpointChangeAt: null, lastOrientationChangeAt: null };
  },
  getVersion() {
    return Ue;
  }
}, le = "4.3.0-INIT-SAFE", ne = "layout-lifecycle", fn = x({ moduleId: ne });
function mn(e) {
  return fn.get(e);
}
let $ = !1, Je = !1, E = { initCount: 0, shutdownCount: 0, resetCount: 0, modeChanges: 0, fullscreenToggles: 0, bodyClassUpdates: 0, lastInitAt: null, lastShutdownAt: null };
const I = (e, ...t) => {
  var n, o, s;
  const r = mn("logger");
  if (r) {
    if (e === "error") {
      (n = r.error) == null || n.call(r, `[${ne}]`, ...t);
      return;
    }
    if (e === "warn") {
      (o = r.warn) == null || o.call(r, `[${ne}]`, ...t);
      return;
    }
    Je && ((s = r.debug) == null || s.call(r, `[${ne}]`, ...t));
  }
}, He = ["default", "dashboard", "monitor", "admin", "compact", "kiosk", "fullscreen"], ee = {
  BREAKPOINTS: ["bp-xs", "bp-sm", "bp-md", "bp-lg", "bp-xl", "bp-xxl"],
  LAYOUT: ["layout-compact", "layout-full-screen", "sidebar-collapsed", "sidebar-mobile-open"],
  MODES: ["mode-default", "mode-dashboard", "mode-monitor", "mode-admin", "mode-compact", "mode-kiosk", "mode-fullscreen"],
  STATE: ["global-loading", "scroll-locked", "preloader-active", "modal-open"]
}, l = {
  setDebug(e) {
    var t, n, o;
    Je = e, (t = a.setDebug) == null || t.call(a, e), (n = d.setDebug) == null || n.call(d, e), (o = g.setDebug) == null || o.call(g, e);
  },
  async init(e = {}) {
    if ($)
      return I("warn", "Already initialized"), { ok: !0, alreadyInitialized: !0, version: le };
    c("layout:lifecycle:init:start"), I("info", "Initializing (P1A AAA BODY OWNER)..."), e.breakpoints && d.configure(e.breakpoints), g.detectCurrent();
    const t = _t("compact");
    t !== null && a.setCompact(t);
    const n = _t("sidebarCollapsed");
    if (n !== null && a.setSidebarCollapsed(n), e.mode) {
      const o = He.includes(e.mode) ? e.mode : "default";
      a.set("mode", o), E.modeChanges++;
    }
    return g.startResizeListener({ debounceDelay: e.resizeDebounce || 150 }), e.detectOrientation !== !1 && g.startOrientationListener(), this._applyBodyClasses(), $ = !0, E.initCount++, E.lastInitAt = Date.now(), c("layout:lifecycle:init:complete", {
      breakpoint: a.getBreakpoint(),
      compliance: "P1A-AAA"
    }), I("info", "Initialized, breakpoint:", a.getBreakpoint()), { ok: !0, alreadyInitialized: !1, version: le };
  },
  shutdown() {
    return c("layout:lifecycle:shutdown:start"), I("info", "Shutting down..."), g.stopResizeListener(), g.stopOrientationListener(), $ = !1, E.shutdownCount++, E.lastShutdownAt = Date.now(), c("layout:lifecycle:shutdown:complete"), I("info", "Shutdown complete"), { ok: !0 };
  },
  reset() {
    return c("layout:lifecycle:reset"), I("info", "Resetting..."), d.reset(), a.setCompact(!1), a.setSidebarCollapsed(!1), a.setSidebarMobileOpen(!1), a.setFullscreen(!1), a.setGlobalLoading(!1), a.setScrollLocked(!1), a.setPreloaderActive(!1), a.setModalOpen(!1), a.set("mode", "default"), g.detectCurrent(), this._applyBodyClasses(), E.resetCount++, I("info", "Reset complete"), { ok: !0 };
  },
  setMode(e) {
    const t = He.includes(e) ? e : "default";
    return a.set("mode", t), E.modeChanges++, this._applyBodyClasses(), c("layout:mode:changed", { mode: t }), I("info", "Mode set:", t), t;
  },
  setFullscreen(e) {
    return a.setFullscreen(!!e) && (E.fullscreenToggles++, this._applyBodyClasses(), c("layout:fullscreen:changed", { fullscreen: e }), I("info", "Fullscreen set:", e)), a.isFullscreen();
  },
  isFullscreen() {
    return a.isFullscreen();
  },
  toggleFullscreen() {
    return this.setFullscreen(!a.isFullscreen());
  },
  setSidebarMobileOpen(e) {
    return a.setSidebarMobileOpen(!!e) && (this._applyBodyClasses(), c("layout:sidebar-mobile:changed", { mobileOpen: e })), a.isSidebarMobileOpen();
  },
  isSidebarMobileOpen() {
    return a.isSidebarMobileOpen();
  },
  setGlobalLoading(e) {
    return a.setGlobalLoading(!!e) && (this._applyBodyClasses(), c("layout:global-loading:changed", { loading: e })), a.isGlobalLoading();
  },
  isGlobalLoading() {
    return a.isGlobalLoading();
  },
  setScrollLocked(e) {
    return a.setScrollLocked(!!e) && (this._applyBodyClasses(), c("layout:scroll-locked:changed", { locked: e })), a.isScrollLocked();
  },
  isScrollLocked() {
    return a.isScrollLocked();
  },
  setPreloaderActive(e) {
    return a.setPreloaderActive(!!e) && (this._applyBodyClasses(), c("layout:preloader:changed", { active: e })), a.isPreloaderActive();
  },
  isPreloaderActive() {
    return a.isPreloaderActive();
  },
  setModalOpen(e) {
    return a.setModalOpen(!!e) && (this._applyBodyClasses(), c("layout:modal:changed", { open: e })), a.isModalOpen();
  },
  isModalOpen() {
    return a.isModalOpen();
  },
  isInitialized() {
    return $;
  },
  getStatus() {
    return {
      initialized: $,
      breakpoint: a.getBreakpoint(),
      dimensions: a.getDimensions(),
      orientation: a.get("orientation"),
      mode: a.get("mode"),
      compact: a.isCompact(),
      sidebarCollapsed: a.isSidebarCollapsed(),
      sidebarMobileOpen: a.isSidebarMobileOpen(),
      fullscreen: a.isFullscreen(),
      globalLoading: a.isGlobalLoading(),
      scrollLocked: a.isScrollLocked(),
      preloaderActive: a.isPreloaderActive(),
      modalOpen: a.isModalOpen(),
      gridColumns: a.get("gridColumns"),
      lastChange: a.get("lastChange"),
      compliance: "P1A-AAA"
    };
  },
  healthCheck() {
    var e, t, n, o, s;
    const r = fn.snapshot(), u = ((e = g.healthCheck) == null ? void 0 : e.call(g)) || {}, h = ((t = a.healthCheck) == null ? void 0 : t.call(a)) || {}, b = a.getBreakpoint(), k = mn("logger"), T = {
      initialized: $,
      detectorHealthy: u.status === "HEALTHY",
      storeHealthy: h.status === "HEALTHY",
      hasBreakpoint: !!b,
      bodyClassesApplied: typeof document < "u" && ((n = document.body) == null ? void 0 : n.classList.contains(`bp-${b}`)),
      fullscreenConsistent: typeof document < "u" && ((o = document.body) == null ? void 0 : o.classList.contains("layout-full-screen")) === a.isFullscreen(),
      sidebarMobileConsistent: typeof document < "u" && ((s = document.body) == null ? void 0 : s.classList.contains("sidebar-mobile-open")) === a.isSidebarMobileOpen(),
      loggerAvailable: !!k,
      portsInitialized: r._initialized
    }, y = Object.values(T).filter(Boolean).length, J = Object.keys(T).length;
    return {
      status: y === J ? "HEALTHY" : y >= 5 ? "DEGRADED" : "UNHEALTHY",
      score: `${y}/${J}`,
      checks: T,
      submodules: { detector: u, store: h },
      version: le,
      moduleId: ne,
      compliance: "P1A-AAA",
      portsInitialized: r._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    return {
      version: le,
      moduleId: ne,
      debug: Je,
      initialized: $,
      validModes: He,
      bodyClasses: ee,
      compliance: "P1A-AAA",
      status: this.getStatus(),
      metrics: { ...E },
      healthCheck: this.healthCheck()
    };
  },
  resetMetrics() {
    E = {
      initCount: 0,
      shutdownCount: 0,
      resetCount: 0,
      modeChanges: 0,
      fullscreenToggles: 0,
      bodyClassUpdates: 0,
      lastInitAt: null,
      lastShutdownAt: null
    };
  },
  _applyBodyClasses() {
    if (typeof document > "u") return;
    const e = document.body, t = a.getBreakpoint(), n = a.isCompact(), o = a.isSidebarCollapsed(), s = a.isSidebarMobileOpen(), r = a.isFullscreen(), u = a.isGlobalLoading(), h = a.isScrollLocked(), b = a.isPreloaderActive(), k = a.isModalOpen(), T = a.get("mode") || "default";
    ee.BREAKPOINTS.forEach((y) => e.classList.remove(y)), e.classList.add(`bp-${t}`), e.classList.toggle("layout-compact", n), e.classList.toggle("sidebar-collapsed", o), e.classList.toggle("sidebar-mobile-open", s), e.classList.toggle("layout-full-screen", r), e.classList.toggle("global-loading", u), e.classList.toggle("scroll-locked", h), e.classList.toggle("preloader-active", b), e.classList.toggle("modal-open", k), h || k ? e.style.overflow = "hidden" : e.style.overflow = "", ee.MODES.forEach((y) => e.classList.remove(y)), e.classList.add(`mode-${T}`), e.setAttribute("data-breakpoint", t), e.setAttribute("data-layout-mode", T), r ? e.setAttribute("data-fullscreen", "true") : e.removeAttribute("data-fullscreen"), E.bodyClassUpdates++, I("info", "Body classes applied (P1A AAA OWNER):", {
      bp: t,
      compact: n,
      sidebarCollapsed: o,
      sidebarMobileOpen: s,
      fullscreen: r,
      globalLoading: u,
      scrollLocked: h,
      preloaderActive: b,
      modalOpen: k,
      mode: T
    });
  },
  getVersion() {
    return le;
  },
  getBodyClasses() {
    return ee;
  }
}, dt = "2.4.0-P18EC", he = "layout-manager.core.state-machine", re = x({ moduleId: he });
function Yn() {
  re.init();
}
function pt(e) {
  return re.get(e);
}
function qn(e) {
  return re.inject(e);
}
function Kn() {
  return re.snapshot();
}
const xt = (e, t, n) => {
  const o = pt("logger");
  if (!o) return;
  const s = o[e] || o.info;
  typeof s == "function" && s.call(o, `[${he}]`, t, n || "");
}, C = Object.freeze({ DEFAULT: "default", COMPACT: "compact", FULLSCREEN: "fullscreen", ADMIN: "admin", DASHBOARD: "dashboard", MONITOR: "monitor", KIOSK: "kiosk" }), f = Object.freeze({ TO_DEFAULT: "TO_DEFAULT", TO_COMPACT: "TO_COMPACT", TO_FULLSCREEN: "TO_FULLSCREEN", TO_ADMIN: "TO_ADMIN", TO_DASHBOARD: "TO_DASHBOARD", TO_MONITOR: "TO_MONITOR", TO_KIOSK: "TO_KIOSK" }), Pe = Object.freeze({ default: { on: { TO_COMPACT: "compact", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_DASHBOARD: "dashboard", TO_MONITOR: "monitor", TO_KIOSK: "kiosk" } }, compact: { on: { TO_DEFAULT: "default", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_DASHBOARD: "dashboard" } }, fullscreen: { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_DASHBOARD: "dashboard", TO_MONITOR: "monitor" } }, admin: { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_DASHBOARD: "dashboard" } }, dashboard: { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_MONITOR: "monitor" } }, monitor: { on: { TO_DEFAULT: "default", TO_DASHBOARD: "dashboard", TO_FULLSCREEN: "fullscreen", TO_KIOSK: "kiosk" } }, kiosk: { on: { TO_DEFAULT: "default" } } }), ke = { default: function() {
  a.setCompact(!1), a.setFullscreen(!1), a.setSidebarCollapsed(!1), a.set("mode", "default"), l._applyBodyClasses && l._applyBodyClasses();
}, compact: function() {
  a.setCompact(!0), a.setFullscreen(!1), a.set("mode", "compact"), l._applyBodyClasses && l._applyBodyClasses();
}, fullscreen: function() {
  a.setFullscreen(!0), a.setSidebarCollapsed(!0), a.set("mode", "fullscreen"), l._applyBodyClasses && l._applyBodyClasses();
}, admin: function() {
  a.setCompact(!1), a.setFullscreen(!1), a.setSidebarCollapsed(!1), a.set("mode", "admin"), l._applyBodyClasses && l._applyBodyClasses();
}, dashboard: function() {
  a.setCompact(!1), a.setFullscreen(!1), a.set("mode", "dashboard"), l._applyBodyClasses && l._applyBodyClasses();
}, monitor: function() {
  a.setCompact(!0), a.setFullscreen(!0), a.setSidebarCollapsed(!0), a.set("mode", "monitor"), l._applyBodyClasses && l._applyBodyClasses();
}, kiosk: function() {
  a.setCompact(!0), a.setFullscreen(!0), a.setSidebarCollapsed(!0), a.setModalOpen(!1), a.set("mode", "kiosk"), l._applyBodyClasses && l._applyBodyClasses();
} }, we = { default: function() {
}, compact: function() {
  a.setCompact(!1);
}, fullscreen: function() {
  a.setFullscreen(!1);
}, admin: function() {
}, dashboard: function() {
}, monitor: function() {
  a.setFullscreen(!1);
}, kiosk: function() {
  a.setFullscreen(!1);
} };
let m = C.DEFAULT, j = [], S = { transitionsAttempted: 0, transitionsAccepted: 0, transitionsRejected: 0, lastTransition: null };
function hn(e) {
  const t = Pe[m];
  return !t || !t.on ? !1 : e in t.on;
}
function Vn(e) {
  const t = Pe[m];
  return !t || !t.on ? null : t.on[e] || null;
}
function oe(e, t) {
  t || (t = {}), S.transitionsAttempted++;
  const n = t.source || "unknown", o = m;
  c("layout:transition:requested", { from: o, action: e, source: n });
  const s = pt("eventBus");
  if (s && s.emit && s.emit(ye.TRANSITION_REQUESTED, { from: o, action: e, source: n, timestamp: Date.now() }), !hn(e)) {
    S.transitionsRejected++;
    const b = Pe[o], k = b && b.on ? Object.keys(b.on) : [], T = { accepted: !1, from: o, to: null, action: e, reason: "transition-not-allowed", allowedActions: k };
    return c("layout:transition:rejected", T), s && s.emit && s.emit(ye.TRANSITION_REJECTED, Object.assign({}, T, { timestamp: Date.now() })), T;
  }
  const r = Vn(e);
  try {
    we[o] && we[o]();
  } catch (b) {
    xt("error", "onExit error:", b);
  }
  m = r, a.set("layoutState", r);
  try {
    ke[r] && ke[r]();
  } catch (b) {
    xt("error", "onEnter error:", b);
  }
  const u = { from: o, to: r, action: e, source: n, timestamp: Date.now() };
  j.push(u), j.length > 50 && (j = j.slice(-50)), S.transitionsAccepted++, S.lastTransition = u;
  const h = { accepted: !0, from: o, to: r, action: e, source: n, reason: null };
  return c("layout:transition:accepted", h), s && s.emit && s.emit(ye.TRANSITION_ACCEPTED, Object.assign({}, h, { timestamp: Date.now() })), h;
}
function bn(e) {
  return { default: f.TO_DEFAULT, compact: f.TO_COMPACT, expanded: f.TO_DEFAULT, fullscreen: f.TO_FULLSCREEN, admin: f.TO_ADMIN, dashboard: f.TO_DASHBOARD, monitor: f.TO_MONITOR, kiosk: f.TO_KIOSK }[e] || null;
}
function Be(e, t) {
  t || (t = {});
  const n = bn(e);
  return n ? oe(n, t) : { accepted: !1, from: m, to: null, reason: "unknown-mode", mode: e };
}
function Ee() {
  return m;
}
function Qn(e) {
  return m === e;
}
function me() {
  const e = Pe[m];
  return e && e.on ? Object.keys(e.on) : [];
}
function gt(e) {
  return e || (e = 10), j.slice(-e);
}
function Xe(e) {
  e || (e = {});
  const t = m;
  c("layout:force-reset", { from: t, source: e.source || "emergency" });
  try {
    we[t] && we[t]();
  } catch {
  }
  m = C.DEFAULT, a.set("layoutState", C.DEFAULT);
  try {
    ke[C.DEFAULT] && ke[C.DEFAULT]();
  } catch {
  }
  return { accepted: !0, from: t, to: C.DEFAULT, action: "FORCE_RESET", reason: "emergency-reset" };
}
function ft() {
  return { transitionsAttempted: S.transitionsAttempted, transitionsAccepted: S.transitionsAccepted, transitionsRejected: S.transitionsRejected, lastTransition: S.lastTransition, currentState: m, historySize: j.length, acceptanceRate: S.transitionsAttempted > 0 ? S.transitionsAccepted / S.transitionsAttempted : 1 };
}
function et() {
  S = { transitionsAttempted: 0, transitionsAccepted: 0, transitionsRejected: 0, lastTransition: null }, j = [];
}
function De() {
  return { moduleId: he, version: dt, portsInitialized: re.isInitialized(), currentState: m, allowedTransitions: me(), states: Object.keys(C).map((e) => C[e]), actions: Object.keys(f).map((e) => f[e]), metrics: ft(), recentHistory: gt(5), timestamp: Date.now() };
}
function tt() {
  const e = Object.keys(C).map((s) => C[s]), t = pt("logger"), n = { validState: e.indexOf(m) !== -1, stateMatchesStore: a.get("layoutState") === m || !a.get("layoutState"), lowRejectionRate: S.transitionsAttempted === 0 || S.transitionsRejected / S.transitionsAttempted < 0.3, historyNotOverflowing: j.length < 50, loggerReady: !!t, portsInitialized: re.isInitialized() };
  let o = 0;
  for (const s in n)
    n[s] && o++;
  return { status: o === Object.keys(n).length ? "HEALTHY" : o >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${o}/${Object.keys(n).length}`, checks: n, currentState: m, metrics: ft(), version: dt, moduleId: he, timestamp: Date.now() };
}
function yn() {
  Yn();
  const e = a.get("layoutState"), t = Object.keys(C).map((n) => C[n]);
  return e && t.indexOf(e) !== -1 ? m = e : (m = C.DEFAULT, a.set("layoutState", C.DEFAULT)), c("layout:state-machine:initialized", { initialState: m }), { ok: !0, initialState: m };
}
const So = { transition: oe, handleLegacyRequest: Be, getCurrentState: Ee, isInState: Qn, getAllowedTransitions: me, getTransitionHistory: gt, forceReset: Xe, canTransition: hn, modeToAction: bn, init: yn, getMetrics: ft, resetMetrics: et, info: De, healthCheck: tt, injectPorts: qn, getPorts: Kn, LAYOUT_STATES: C, LAYOUT_ACTIONS: f, VERSION: dt, MODULE_ID: he }, Cn = "layout-manager.handlers.request-handlers", An = x({ moduleId: Cn });
function Wn() {
  An.init();
}
function Ae(e) {
  return An.get(e);
}
const Y = { REQUEST: "layout:request", TRANSITION: "layout:transition", FULLSCREEN_REQUEST: "layout:fullscreen:request", SCROLL_LOCK: "layout:scroll:lock", PRELOADER: "layout:preloader", MODAL: "layout:modal", GLOBAL_LOADING: "layout:global-loading" };
let On = !1, ae = null, ue = null, se = { layoutRequestsReceived: 0, transitionRequests: 0, lastActivity: null };
const q = (e, t, n) => {
  const o = Ae("logger");
  if (!o) return;
  const s = `[${Cn}]`;
  if (e === "error") {
    o.error && o.error(s, t, n || "");
    return;
  }
  if (e === "warn") {
    o.warn && o.warn(s, t, n || "");
    return;
  }
  On && o.debug && o.debug(s, t, n || "");
};
function zt(e) {
  On = e;
}
function Zn() {
  return Object.assign({}, se);
}
function Nt() {
  se = { layoutRequestsReceived: 0, transitionRequests: 0, lastActivity: null };
}
function Jn(e, t) {
  if (!e || !e.mode) {
    q("warn", "layout:request received without mode");
    return;
  }
  se.layoutRequestsReceived++, se.lastActivity = Date.now();
  const n = e.mode, o = e.source;
  if (q("info", `layout:request from ${o || "unknown"}:`, n), c("layout:request:received", { mode: n, source: o }), ["default", "compact", "expanded", "fullscreen", "admin", "dashboard", "monitor", "kiosk"].indexOf(n) !== -1) {
    const s = Be(n, { source: o });
    return q("info", "State Machine result:", s), t && t(), s;
  }
  switch (n) {
    case "sidebar-collapsed":
      a.setSidebarCollapsed(!0), l._applyBodyClasses && l._applyBodyClasses();
      break;
    case "sidebar-expanded":
      a.setSidebarCollapsed(!1), l._applyBodyClasses && l._applyBodyClasses();
      break;
    case "sidebar-mobile-open":
      l.setSidebarMobileOpen(!0);
      break;
    case "sidebar-mobile-closed":
      l.setSidebarMobileOpen(!1);
      break;
    case "global-loading-on":
      l.setGlobalLoading(!0);
      break;
    case "global-loading-off":
      l.setGlobalLoading(!1);
      break;
    case "preloader-active":
      l.setPreloaderActive(!0);
      break;
    case "preloader-inactive":
      l.setPreloaderActive(!1);
      break;
    case "modal-open":
      l.setModalOpen(!0);
      break;
    case "modal-closed":
      l.setModalOpen(!1);
      break;
    case "scroll-lock":
      l.setScrollLocked(!0);
      break;
    case "scroll-unlock":
      l.setScrollLocked(!1);
      break;
    default:
      q("warn", "Unknown mode:", n);
  }
  t && t(), c("layout:request:applied", { mode: n, source: o });
}
function Xn(e, t) {
  if (!e || !e.action)
    return q("warn", "layout:transition received without action"), { accepted: !1, reason: "no-action" };
  se.transitionRequests++, se.lastActivity = Date.now();
  const n = e.action, o = e.source, s = oe(n, { source: o });
  return s.accepted && t && t(), s;
}
function eo(e) {
  Wn();
  const t = Ae("eventBus");
  if (!t)
    return q("warn", "EventBus not available for layout:request listener"), !1;
  if (ae) return !0;
  const n = (s) => {
    Jn(s, e);
  }, o = (s) => {
    Xn(s, e);
  };
  return t.on(Y.REQUEST, n), ae = () => {
    const s = Ae("eventBus");
    s && s.off && s.off(Y.REQUEST, n);
  }, t.on(Y.TRANSITION, o), ue = () => {
    const s = Ae("eventBus");
    s && s.off && s.off(Y.TRANSITION, o);
  }, c("layout:listeners:connected"), q("info", "Layout listeners connected (State Machine AAA)"), !0;
}
function to() {
  ae && (ae(), ae = null), ue && (ue(), ue = null);
}
function jt() {
  return !!ae;
}
function Ft() {
  return !!ue;
}
const vn = "layout-manager-globalstate", Ut = 5, no = 300, Sn = at({ moduleId: vn });
function oo() {
  Sn.init();
}
function Tn(e) {
  return Sn.get(e);
}
let Ln = !1, Ie = [], Q = { attempts: 0, connected: !1 }, Me = { syncs: 0 };
const be = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), n = Tn("logger");
  if (!n) return;
  const o = `[${vn}]`;
  if (e === "error") {
    n.error && n.error(...[o].concat(t));
    return;
  }
  if (e === "warn") {
    n.warn && n.warn(...[o].concat(t));
    return;
  }
  Ln && n.debug && n.debug(...[o].concat(t));
};
function Ht(e) {
  Ln = e;
}
function ao() {
  return Object.assign({}, Q);
}
function $t() {
  return Q.connected;
}
function so() {
  return Object.assign({}, Me);
}
function Gt() {
  Me = { syncs: 0 }, Q = { attempts: 0, connected: !1 };
}
function mt(e) {
  e === void 0 && (e = 1), Q.attempts = e, oo();
  const t = Tn("globalState");
  if (!t) {
    if (e < Ut) {
      const n = no * e;
      return be("warn", `GlobalState not available, retry ${e}/${Ut} in ${n}ms`), new Promise((o) => {
        setTimeout(() => {
          o(mt(e + 1));
        }, n);
      });
    }
    return be("error", "GlobalState not available after max retries"), c("layout:global-state:retry-exhausted", { attempts: e }), Promise.resolve(!1);
  }
  try {
    const n = t.subscribe((s) => {
      if (s !== a.isCompact()) {
        const r = s ? f.TO_COMPACT : f.TO_DEFAULT;
        smTransition(r, { source: "GlobalState" }), Me.syncs++, c("layout:global-state:compact-synced", { compact: s });
      }
    }, "preferences.compactMode");
    Ie.push(n);
    const o = t.subscribe((s) => {
      l.setGlobalLoading(s), Me.syncs++, c("layout:global-state:loading-synced", { loading: s });
    }, "app.isLoading");
    return Ie.push(o), Q.connected = !0, c("layout:global-state:connected", { attempts: e }), be("info", `✅ GlobalState connected (attempt ${e})`), Promise.resolve(!0);
  } catch (n) {
    return be("error", "GlobalState integration error:", n.message), Promise.resolve(!1);
  }
}
function kn() {
  Ie.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), Ie = [], Q.connected = !1;
}
function Yt() {
  return kn(), Q.attempts = 0, mt(1);
}
const wn = "layout-manager-orchestrator", qt = 5, ro = 300, En = x({ moduleId: wn });
function io() {
  En.init();
}
function Oe(e) {
  return En.get(e);
}
let Dn = !1, _e = [], W = { attempts: 0, connected: !1 }, ht = { presets: 0 };
const ce = function(e) {
  const t = Oe("logger");
  if (!t) return;
  const n = Array.prototype.slice.call(arguments, 1), o = `[${wn}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(n));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(n));
    return;
  }
  Dn && t.debug && t.debug(...[o].concat(n));
};
function Kt(e) {
  Dn = e;
}
function lo() {
  return Object.assign({}, W);
}
function Vt() {
  return W.connected;
}
function co() {
  return Object.assign({}, ht);
}
function Qt() {
  ht = { presets: 0 }, W = { attempts: 0, connected: !1 };
}
function bt(e, t) {
  t === void 0 && (t = 1), W.attempts = t, io();
  const n = Oe("eventBus");
  if (!n) {
    if (t < qt) {
      const o = ro * t;
      return ce("warn", `EventBus not available, retry ${t}/${qt} in ${o}ms`), new Promise((s) => {
        setTimeout(() => {
          s(bt(e, t + 1));
        }, o);
      });
    }
    return ce("error", "EventBus not available after max retries"), c("layout.orchestrator.retry-exhausted", { attempts: t }), Promise.resolve(!1);
  }
  try {
    const o = (r) => {
      if (r && r.layout) {
        if (r.layout.mode) {
          const u = Be(r.layout.mode, { source: "Orchestrator" });
          ce("info", "Orchestrator preset via SM:", u);
        }
        r.layout.sidebarCollapsed !== void 0 && a.setSidebarCollapsed(r.layout.sidebarCollapsed), l._applyBodyClasses && l._applyBodyClasses(), ht.presets++, c("layout.orchestrator.preset-applied", { layout: r.layout }), e && e();
      }
    };
    n.on(At.PRESET_APPLIED, o), _e.push(() => {
      const r = Oe("eventBus");
      r && r.off && r.off(At.PRESET_APPLIED, o);
    });
    const s = a.subscribe((r) => {
      if (r.action === "breakpoint-change") {
        const u = Oe("eventBus");
        u && u.emit && u.emit(ye.BREAKPOINT_CHANGED, { breakpoint: a.getBreakpoint(), dimensions: a.getDimensions() }), e && e();
      }
    });
    return _e.push(s), W.connected = !0, c("layout.orchestrator.connected", { attempts: t }), ce("info", `✅ Orchestrator/EventBus connected (attempt ${t})`), Promise.resolve(!0);
  } catch (o) {
    return ce("error", "Orchestrator integration error:", o.message), Promise.resolve(!1);
  }
}
function In() {
  _e.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), _e = [], W.connected = !1;
}
function Wt(e) {
  return In(), W.attempts = 0, bt(e, 1);
}
const ve = "layout-manager.integrations.context-provider", Zt = 5, uo = 300, po = typeof window < "u";
function Mn() {
  if (!po) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    let e = window.Core.windowAdapter.get("ContextProvider");
    if (e) return e;
  }
  return null;
}
const go = at({ moduleId: ve });
function fo(e) {
  return go.get(e);
}
let _n = !1, Jt = [], Z = { attempts: 0, connected: !1 }, yt = { syncs: 0 };
function te(e, t, n) {
  n || (n = {});
  const o = fo("logger");
  if (o) {
    if (e === "error") {
      o.error && o.error(`[${ve}] ${t}`, n);
      return;
    }
    if (e === "warn") {
      o.warn && o.warn(`[${ve}] ${t}`, n);
      return;
    }
    _n && o.debug && o.debug(`[${ve}] ${t}`, n);
  }
}
function Xt(e) {
  _n = e;
}
function mo() {
  return Object.assign({}, Z);
}
function en() {
  return Z.connected;
}
function ho() {
  return Object.assign({}, yt);
}
function tn() {
  yt = { syncs: 0 }, Z = { attempts: 0, connected: !1 };
}
function Rn() {
  let e = Mn();
  if (!(!e || !e.set))
    try {
      const t = { layoutState: Ee(), breakpoint: a.getBreakpoint(), dimensions: a.getDimensions(), orientation: a.get("orientation"), compact: a.isCompact(), sidebarCollapsed: a.isSidebarCollapsed(), sidebarMobileOpen: a.isSidebarMobileOpen(), fullscreen: a.isFullscreen(), globalLoading: a.isGlobalLoading(), scrollLocked: a.isScrollLocked(), preloaderActive: a.isPreloaderActive(), modalOpen: a.isModalOpen(), mode: a.get("mode"), gridColumns: a.get("gridColumns"), lastChange: a.get("lastChange"), allowedTransitions: me(), compliance: "ENTERPRISE-AAA" };
      e.set("layout", t, { owner: "LayoutManager", silent: !0 }), yt.syncs++, te("info", "ContextProvider synced");
    } catch (t) {
      te("error", `ContextProvider sync error: ${t.message}`);
    }
}
function Ct(e) {
  e || (e = 1), Z.attempts = e;
  const t = Mn();
  if (!t || !t.set) {
    if (e < Zt) {
      const n = uo * e;
      return te("warn", `ContextProvider not available, retry ${e}/${Zt} in ${n}ms`), new Promise((o) => {
        setTimeout(o, n);
      }).then(() => Ct(e + 1));
    }
    return te("error", "ContextProvider not available after max retries"), c("layout:context-provider:retry-exhausted", { attempts: e, strictMode: on() }), Promise.resolve(!1);
  }
  try {
    return Rn(), Z.connected = !0, c("layout:context-provider:connected", { attempts: e }), te("info", `ContextProvider connected (attempt ${e})`), Promise.resolve(!0);
  } catch (n) {
    return te("error", `ContextProvider integration error: ${n.message}`), Promise.resolve(!1);
  }
}
function Pn() {
  Jt.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), Jt = [], Z.connected = !1;
}
function nn() {
  return Pn(), Z.attempts = 0, Ct(1);
}
const N = "5.9.0-P2-ENTERPRISE", K = "layout-manager", F = x({ moduleId: K }), bo = () => F.init(), nt = (e) => F.get(e), yo = (e) => F.inject(e), Co = () => F.snapshot();
let ot = !1, G = !1, w = { initCount: 0, shutdownCount: 0, compactToggles: 0, sidebarToggles: 0, fullscreenToggles: 0, lastInitAt: null, lastActivity: null };
const L = (e, ...t) => {
  var n, o, s;
  const r = nt("logger");
  if (!r) return;
  const u = `[${K}]`;
  if (e === "error") {
    (n = r.error) == null || n.call(r, u, ...t);
    return;
  }
  if (e === "warn") {
    (o = r.warn) == null || o.call(r, u, ...t);
    return;
  }
  ot && ((s = r.debug) == null || s.call(r, u, ...t));
}, v = () => {
  try {
    Rn();
  } catch (e) {
    L("warn", "ContextProvider sync error:", e.message);
  }
}, p = {
  version: N,
  name: K,
  moduleId: K,
  compliance: "ENTERPRISE-AAA",
  setDebug: (e) => {
    var t, n, o, s;
    ot = e, (t = l.setDebug) == null || t.call(l, e), (n = a.setDebug) == null || n.call(a, e), (o = d.setDebug) == null || o.call(d, e), (s = g.setDebug) == null || s.call(g, e), kt == null || kt(e), Dt == null || Dt(e), zt == null || zt(e), Ht == null || Ht(e), Kt == null || Kt(e), Xt == null || Xt(e);
  },
  init: (e = {}) => {
    if (G)
      return L("warn", "LayoutManager already initialized"), Promise.resolve({ ok: !0, alreadyInitialized: !0, version: N });
    c("layout:api:init:called"), L("info", "Initializing LayoutManager (State Machine AAA Modular)..."), e.debug && p.setDebug(!0);
    try {
      bo(), yn();
    } catch (t) {
      L("warn", "Ports/StateMachine init warning:", t.message);
    }
    return l.init(e).then((t) => {
      try {
        eo(v);
      } catch (o) {
        L("warn", "Layout request listener setup warning:", o.message);
      }
      const n = [
        mt().catch((o) => (L("warn", "GlobalState setup warning:", o.message), !1)),
        bt(v).catch((o) => (L("warn", "Orchestrator setup warning:", o.message), !1)),
        Ct().catch((o) => (L("warn", "ContextProvider setup warning:", o.message), !1))
      ];
      return Promise.all(n).then(() => (G = !0, w.initCount++, w.lastInitAt = Date.now(), w.lastActivity = Date.now(), L("info", "LayoutManager initialized (State Machine AAA Modular)", {
        alreadyInitialized: t == null ? void 0 : t.alreadyInitialized
      }), {
        ok: !0,
        alreadyInitialized: (t == null ? void 0 : t.alreadyInitialized) || !1,
        version: N
      }));
    }).catch((t) => (L("error", "LayoutManager init error:", t.message), G = !0, {
      ok: !0,
      alreadyInitialized: !1,
      degraded: !0,
      error: t.message,
      version: N
    }));
  },
  shutdown: () => (c("layout:api:shutdown:called"), L("info", "Shutting down LayoutManager..."), to(), kn(), In(), Pn(), w.shutdownCount++, G = !1, l.shutdown()),
  reset: () => (c("layout:api:reset:called"), L("info", "Resetting LayoutManager..."), Xe({ source: "API" }), l.reset()),
  injectPorts: yo,
  getPorts: Co,
  transition: (e, t = {}) => {
    const n = oe(e, t);
    return n.accepted && v(), n;
  },
  getLayoutState: () => Ee(),
  getAllowedTransitions: () => me(),
  getTransitionHistory: (e) => gt(e),
  forceReset: (e) => {
    const t = Xe(e);
    return v(), t;
  },
  retryGlobalState: () => Yt(),
  retryOrchestrator: () => Wt(v),
  retryContextProvider: () => nn(),
  retryAllIntegrations: () => Promise.all([
    Yt(),
    Wt(v),
    nn()
  ]).then((e) => ({
    globalState: e[0],
    orchestrator: e[1],
    contextProvider: e[2]
  })),
  getBreakpoint: () => a.getBreakpoint(),
  getDimensions: () => a.getDimensions(),
  getOrientation: () => a.get("orientation"),
  getGridColumns: () => a.get("gridColumns"),
  isMobile: () => d.isMobile(a.getBreakpoint()),
  isTablet: () => d.isTablet(a.getBreakpoint()),
  isDesktop: () => d.isDesktop(a.getBreakpoint()),
  isAtLeast: (e) => d.isAtLeast(a.getBreakpoint(), e),
  isAtMost: (e) => d.isAtMost(a.getBreakpoint(), e),
  isCompact: () => a.isCompact(),
  setCompact: (e) => {
    var t;
    const n = e ? f.TO_COMPACT : f.TO_DEFAULT, o = oe(n, { source: "API" });
    if (o.accepted) {
      Mt("compact", e);
      const s = nt("globalState");
      if (s != null && s.dispatch && (t = s == null ? void 0 : s.actions) != null && t.updatePreferences)
        try {
          s.dispatch(s.actions.updatePreferences({ compactMode: e }));
        } catch {
        }
      v();
    }
    return w.lastActivity = Date.now(), o;
  },
  toggleCompact: () => {
    const e = !a.isCompact(), t = p.setCompact(e);
    return t.accepted && w.compactToggles++, t;
  },
  isSidebarCollapsed: () => a.isSidebarCollapsed(),
  setSidebarCollapsed: (e) => {
    a.setSidebarCollapsed(e), Mt("sidebarCollapsed", e), l._applyBodyClasses(), v(), c("layout:sidebar:set", { collapsed: e }), w.lastActivity = Date.now(), L("info", "Sidebar collapsed:", e);
  },
  toggleSidebar: () => {
    const e = !a.isSidebarCollapsed();
    return p.setSidebarCollapsed(e), w.sidebarToggles++, e;
  },
  isSidebarMobileOpen: () => l.isSidebarMobileOpen(),
  setSidebarMobileOpen: (e) => {
    const t = l.setSidebarMobileOpen(e);
    return v(), t;
  },
  isFullscreen: () => l.isFullscreen(),
  setFullscreen: (e) => {
    const t = e ? f.TO_FULLSCREEN : f.TO_DEFAULT, n = oe(t, { source: "API" });
    return n.accepted && (v(), w.fullscreenToggles++), w.lastActivity = Date.now(), n;
  },
  toggleFullscreen: () => {
    const e = !a.isFullscreen();
    return p.setFullscreen(e);
  },
  isGlobalLoading: () => l.isGlobalLoading(),
  setGlobalLoading: (e) => {
    const t = l.setGlobalLoading(e);
    return v(), t;
  },
  isScrollLocked: () => l.isScrollLocked(),
  setScrollLocked: (e) => {
    const t = l.setScrollLocked(e);
    return v(), t;
  },
  isPreloaderActive: () => l.isPreloaderActive(),
  setPreloaderActive: (e) => {
    const t = l.setPreloaderActive(e);
    return v(), t;
  },
  isModalOpen: () => l.isModalOpen(),
  setModalOpen: (e) => {
    const t = l.setModalOpen(e);
    return v(), t;
  },
  setMode: (e) => {
    const t = Be(e, { source: "API" });
    return t.accepted && v(), t;
  },
  getMode: () => a.get("mode"),
  subscribe: (e) => a.subscribe(e),
  status: () => l.getStatus(),
  isInitialized: () => G && l.isInitialized(),
  getVersion: () => N,
  getStatus: () => {
    var e, t, n, o;
    return {
      stateMachine: De(),
      lifecycle: ((e = l.getStatus) == null ? void 0 : e.call(l)) || null,
      store: ((t = a.info) == null ? void 0 : t.call(a)) || null,
      detector: ((n = g.info) == null ? void 0 : n.call(g)) || null,
      breakpoints: ((o = d.info) == null ? void 0 : o.call(d)) || null,
      tracker: (wt == null ? void 0 : wt()) || null,
      helpers: (Pt == null ? void 0 : Pt()) || null,
      integrations: {
        globalState: $t(),
        orchestrator: Vt(),
        contextProvider: en(),
        layoutRequestListener: jt(),
        transitionListener: Ft()
      },
      retryState: {
        globalState: ao(),
        orchestrator: lo(),
        contextProvider: mo()
      },
      metrics: {
        ...w,
        handlers: Zn(),
        globalState: so(),
        orchestrator: co(),
        contextProvider: ho()
      },
      compliance: "ENTERPRISE-AAA",
      layoutEvents: Y,
      layoutStates: C,
      layoutActions: f,
      portsInitialized: F.isInitialized()
    };
  },
  healthCheck: () => {
    var e, t, n, o;
    const s = ((e = l.healthCheck) == null ? void 0 : e.call(l)) || {}, r = ((t = g.healthCheck) == null ? void 0 : t.call(g)) || {}, u = ((n = a.healthCheck) == null ? void 0 : n.call(a)) || {}, h = (Ke == null ? void 0 : Ke()) || {}, b = (Qe == null ? void 0 : Qe()) || {}, k = (tt == null ? void 0 : tt()) || {}, T = nt("logger"), y = {
      initialized: G && l.isInitialized(),
      stateMachineHealthy: k.status === "HEALTHY",
      lifecycleHealthy: s.status === "HEALTHY",
      detectorHealthy: r.status === "HEALTHY",
      storeHealthy: u.status === "HEALTHY",
      trackerHealthy: h.status === "HEALTHY",
      helpersHealthy: b.status === "HEALTHY",
      hasBreakpoint: !!a.getBreakpoint(),
      resizeListenerActive: ((o = g.hasResizeListener) == null ? void 0 : o.call(g)) || !1,
      layoutRequestListenerActive: jt(),
      transitionListenerActive: Ft(),
      globalStateConnected: $t(),
      orchestratorConnected: Vt(),
      contextProviderConnected: en(),
      portsInitialized: F.isInitialized(),
      loggerAvailable: !!T
    }, J = Object.values(y).filter(Boolean).length, xe = Object.keys(y).length;
    let ze = "HEALTHY";
    J < xe * 0.5 ? ze = "UNHEALTHY" : J < xe && (ze = "DEGRADED");
    const _ = [];
    return y.initialized || _.push("not-initialized"), y.stateMachineHealthy || _.push("state-machine-unhealthy"), y.hasBreakpoint || _.push("no-breakpoint"), y.layoutRequestListenerActive || _.push("layout-request-listener-inactive"), y.globalStateConnected || _.push("globalstate-not-connected"), y.orchestratorConnected || _.push("orchestrator-not-connected"), y.contextProviderConnected || _.push("contextprovider-not-connected"), {
      status: ze,
      score: `${J}/${xe}`,
      checks: y,
      issues: _.length > 0 ? _ : null,
      submodules: {
        stateMachine: k,
        lifecycle: s,
        detector: r,
        store: u,
        tracker: h,
        helpers: b
      },
      compliance: "ENTERPRISE-AAA",
      version: N,
      moduleId: K,
      portsInitialized: F.isInitialized(),
      timestamp: Date.now()
    };
  },
  info: () => ({
    name: K,
    version: N,
    debug: ot,
    initialized: G,
    compliance: "ENTERPRISE-AAA",
    bodyClasses: ee,
    layoutEvents: Y,
    layoutStates: C,
    layoutActions: f,
    currentState: Ee(),
    allowedTransitions: me(),
    portsInitialized: F.isInitialized(),
    status: p.getStatus(),
    healthCheck: p.healthCheck()
  }),
  resetMetrics: () => {
    var e, t, n, o;
    w = {
      initCount: 0,
      shutdownCount: 0,
      compactToggles: 0,
      sidebarToggles: 0,
      fullscreenToggles: 0,
      lastInitAt: null,
      lastActivity: null
    }, (e = l.resetMetrics) == null || e.call(l), (t = g.resetMetrics) == null || t.call(g), (n = a.resetMetrics) == null || n.call(a), (o = d.resetMetrics) == null || o.call(d), Et == null || Et(), Bt == null || Bt(), et == null || et(), Nt == null || Nt(), Gt == null || Gt(), Qt == null || Qt(), tn == null || tn();
  },
  device: {
    isTouch: dn,
    getPixelRatio: pn
  },
  breakpoints: {
    get: (e) => d.get(e),
    list: () => d.list(),
    getMediaQuery: (e) => d.getMediaQuery(e),
    getAll: () => d.getAll(),
    getRanges: () => d.info().ranges
  },
  grid: {
    getColumnsMap: Gn,
    getColumns: () => a.get("gridColumns")
  },
  debug: {
    getEventLog: Un,
    getRecentEvents: Hn,
    getStore: () => a.toJSON(),
    getBodyClasses: () => ee,
    getLayoutEvents: () => Y,
    getStateMachine: () => De()
  },
  _applyBodyClasses: () => l._applyBodyClasses(),
  LAYOUT_STATES: C,
  LAYOUT_ACTIONS: f
};
typeof window < "u" && (on() ? (Bn("GLOBAL_EXPOSURE_BLOCKED", { module: K, target: "window.LayoutManager" }), c("layout:global:strict-mode-blocked", { compliance: "ENTERPRISE-AAA", modular: !0 })) : (window.LayoutManager = p, c("layout:global:exposed", { compliance: "ENTERPRISE-AAA", modular: !0 })), window.__dev = window.__dev || {}, window.__dev.layoutManager = {
  healthCheck: () => p.healthCheck(),
  info: () => p.info(),
  status: () => p.status(),
  getStatus: () => p.getStatus(),
  getStateMachine: () => De(),
  transition: (e, t) => p.transition(e, t),
  getLayoutState: () => p.getLayoutState(),
  getAllowedTransitions: () => p.getAllowedTransitions(),
  getTransitionHistory: (e) => p.getTransitionHistory(e),
  forceReset: (e) => p.forceReset(e),
  retryGlobalState: () => p.retryGlobalState(),
  retryOrchestrator: () => p.retryOrchestrator(),
  retryContextProvider: () => p.retryContextProvider(),
  retryAll: () => p.retryAllIntegrations(),
  setDebug: (e) => p.setDebug(e),
  resetMetrics: () => p.resetMetrics(),
  version: N,
  compliance: "ENTERPRISE-AAA"
});
export {
  ee as BODY_CLASSES,
  d as BreakpointManager,
  f as LAYOUT_ACTIONS,
  Y as LAYOUT_EVENTS,
  C as LAYOUT_STATES,
  g as LayoutDetector,
  l as LayoutLifecycle,
  p as LayoutManager,
  K as MODULE_ID,
  So as StateMachine,
  N as VERSION,
  p as default,
  Co as getPorts,
  yo as injectPorts,
  a as layoutStore
};
