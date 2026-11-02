import { SHELL_EVENTS as r } from "/core/runtime/events/catalog/shell.events.js";
const V = "3.2.0-P2-ENTERPRISE", p = "platform-layout-regions", t = {
  HEADER: "header-region",
  SIDEBAR: "sidebar-region",
  MAIN: "main-region",
  SUBMAIN: "submain-region",
  FOOTER: "footer-region",
  CANVAS: "canvas-region",
  MODAL: "modal-region",
  OVERLAY: "overlay-region",
  NAV_RAIL: "nav-rail-region"
}, o = {};
o[t.HEADER] = '[data-region="header"], #shell-header-region, #header, .shell-header';
o[t.SIDEBAR] = '[data-region="sidebar"], #shell-sidebar-region, #sidebar, .shell-sidebar';
o[t.MAIN] = '[data-region="main"], #shell-main-region, #main, .shell-main, .main-content';
o[t.SUBMAIN] = '[data-region="submain"], #shell-submain-region, #submain';
o[t.FOOTER] = '[data-region="footer"], #shell-footer-region, #footer, .shell-footer';
o[t.CANVAS] = '[data-region="canvas"], #shell-canvas-region, #canvas';
o[t.MODAL] = '[data-region="modal"], #shell-modal-region, #modal, .modal-container';
o[t.OVERLAY] = '[data-region="overlay"], #shell-overlay-region, #overlay';
o[t.NAV_RAIL] = '[data-region="nav-rail"], #shell-nav-rail-region, #nav-rail, .nav-rail';
function D(e, n) {
  n || (n = document);
  const u = o[e];
  if (!u) return null;
  const i = u.split(", ");
  for (let l = 0; l < i.length; l++) {
    const T = n.querySelector(i[l]);
    if (T) return T;
  }
  return null;
}
function y(e) {
  e || (e = document);
  const n = {}, u = Object.keys(t);
  for (let i = 0; i < u.length; i++) {
    const l = t[u[i]];
    n[l] = D(l, e);
  }
  return n;
}
function P(e) {
  const n = document.createElement("div");
  return n.id = e, n.setAttribute("data-region", e.replace("-region", "")), n.className = "platform-region " + e, n;
}
var x = { VERSION: V, MODULE_ID: p, REGION_IDS: t, REGION_SELECTORS: o, findRegion: D, findAllRegions: y, createRegionPlaceholder: P };
const B = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: p,
  REGION_IDS: t,
  REGION_SELECTORS: o,
  VERSION: V,
  createRegionPlaceholder: P,
  default: x,
  findAllRegions: y,
  findRegion: D
}, Symbol.toStringTag, { value: "Module" })), g = "3.2.0-P2-ENTERPRISE", d = "platform-header-shell";
let a = !1, E = null;
function N(e) {
  return e || (e = {}), E = e.eventBus || null, { version: g, moduleId: d };
}
function j(e) {
  return a || (a = !0, F(r.HEADER_MOUNTED)), !0;
}
function H() {
  return a = !1, F(r.HEADER_UNMOUNTED), !0;
}
function z() {
  return a;
}
function F(e, n) {
  n || (n = {}), E && E.emit && E.emit(e, Object.assign({}, n, { source: d, timestamp: Date.now() }));
}
function h() {
  return { version: g, moduleId: d, mounted: a };
}
var ee = { VERSION: g, MODULE_ID: d, init: N, mount: j, unmount: H, isMounted: z, info: h };
const G = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: d,
  VERSION: g,
  default: ee,
  info: h,
  init: N,
  isMounted: z,
  mount: j,
  unmount: H
}, Symbol.toStringTag, { value: "Module" })), S = "3.2.0-P2-ENTERPRISE", c = "platform-sidebar-shell";
let s = !1, O = null;
function v(e) {
  return e || (e = {}), O = e.eventBus || null, { version: S, moduleId: c };
}
function w(e) {
  return s || (s = !0, M(r.SIDEBAR_MOUNTED)), !0;
}
function C() {
  return s = !1, M(r.SIDEBAR_UNMOUNTED), !0;
}
function k() {
  M(r.SIDEBAR_TOGGLE);
}
function Y() {
  return s;
}
function M(e, n) {
  n || (n = {}), O && O.emit && O.emit(e, Object.assign({}, n, { source: c, timestamp: Date.now() }));
}
function b() {
  return { version: S, moduleId: c, mounted: s };
}
var ne = { VERSION: S, MODULE_ID: c, init: v, mount: w, unmount: C, toggle: k, isMounted: Y, info: b };
const q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: c,
  VERSION: S,
  default: ne,
  info: b,
  init: v,
  isMounted: Y,
  mount: w,
  toggle: k,
  unmount: C
}, Symbol.toStringTag, { value: "Module" })), I = "3.2.0-P2-ENTERPRISE", m = "platform-footer-shell";
let f = !1, _ = null;
function A(e) {
  return e || (e = {}), _ = e.eventBus || null, { version: I, moduleId: m };
}
function J(e) {
  return f || (f = !0, W(r.FOOTER_MOUNTED)), !0;
}
function K() {
  return f = !1, W(r.FOOTER_UNMOUNTED), !0;
}
function Q() {
  return f;
}
function W(e, n) {
  n || (n = {}), _ && _.emit && _.emit(e, Object.assign({}, n, { source: m, timestamp: Date.now() }));
}
function L() {
  return { version: I, moduleId: m, mounted: f };
}
var te = { VERSION: I, MODULE_ID: m, init: A, mount: J, unmount: K, isMounted: Q, info: L };
const X = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: m,
  VERSION: I,
  default: te,
  info: L,
  init: A,
  isMounted: Q,
  mount: J,
  unmount: K
}, Symbol.toStringTag, { value: "Module" })), $ = "3.1.0-P2-ENTERPRISE", U = "platform-shell", le = B, ue = G, ae = q, se = X;
let R = !1;
function oe(e = {}) {
  return R || (N(e), v(e), A(e), R = !0), Z();
}
function Z() {
  return {
    version: $,
    moduleId: U,
    regions: B,
    header: G,
    sidebar: q,
    footer: X
  };
}
function re() {
  return {
    version: $,
    moduleId: U,
    initialized: R,
    header: h(),
    sidebar: b(),
    footer: L()
  };
}
var fe = { VERSION: $, MODULE_ID: U, init: oe, getShell: Z, info: re };
export {
  se as FooterShell,
  ue as HeaderShell,
  le as LayoutRegions,
  U as MODULE_ID,
  ae as SidebarShell,
  $ as VERSION,
  fe as default,
  Z as getShell,
  re as info,
  oe as init
};
