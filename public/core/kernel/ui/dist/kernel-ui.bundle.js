import { createCorePorts as H } from "/core/runtime/ports-profiles.js";
const k = "2.2.0-P2-ENTERPRISE", u = "core.kernel.ui.kernel-governance-panel", g = {
  kernel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
}, O = {
  autoRefresh: !0,
  refreshInterval: 3e3
}, t = {
  visible: !1,
  minimized: !1,
  container: null,
  refreshInterval: null,
  lastUpdate: null,
  filter: "all",
  data: null
}, U = {
  autoRefresh: O.autoRefresh,
  refreshInterval: O.refreshInterval
};
function w() {
  return window.Governance || window.Core && window.Core.Governance || null;
}
function M() {
  t.visible = !1, t.minimized = !1, t.container = null, t.refreshInterval = null, t.lastUpdate = null, t.filter = "all", t.data = null;
}
let D = !1;
function B() {
  if (D) return;
  const e = document.createElement("link");
  e.rel = "stylesheet", e.href = "/core/kernel/ui/kernel-governance-panel.css", document.head.appendChild(e), D = !0;
}
function $() {
  const e = {
    timestamp: Date.now(),
    context: null,
    manifest: null,
    health: null,
    telemetry: null,
    definitions: null
  }, a = w();
  if (!a)
    return typeof Logger < "u" ? Logger.warn(`[${u}] Governance not available yet`) : console.warn(`[${u}] Governance not available yet`), t.data = e, t.lastUpdate = Date.now(), e;
  try {
    if (a.getSnapshot && (e.context = a.getSnapshot() || {}), a.info) {
      const n = a.info();
      e.manifest = n.manifest || {}, e.definitions = n.definitions || {}, e.telemetry = n.telemetry || {};
    }
    a.getHealth && (e.health = a.getHealth() || {});
  } catch (n) {
    typeof Logger < "u" ? Logger.warn(`[${u}] Error fetching data: ${n.message || n}`) : console.warn(`[${u}] Error fetching data:`, n);
  }
  return t.data = e, t.lastUpdate = Date.now(), e;
}
function T(e) {
  const a = e.toLowerCase();
  return a === "normal" ? "kgp__status-card--normal" : a === "degraded" ? "kgp__status-card--degraded" : a === "maintenance" ? "kgp__status-card--maintenance" : a === "failed" || a === "recovery" ? "kgp__status-card--failed" : "";
}
function K(e) {
  return e >= 90 ? "kgp__status-card--healthy" : e >= 50 ? "kgp__status-card--degraded" : "kgp__status-card--failed";
}
function P(e) {
  const a = e.toLowerCase();
  return a === "healthy" ? "kgp__category--healthy" : a === "degraded" ? "kgp__category--degraded" : a === "unhealthy" || a === "critical" ? "kgp__category--unhealthy" : "kgp__category--unknown";
}
function y(e) {
  return e >= 1e6 ? `${(e / 1e6).toFixed(1)}M` : e >= 1e3 ? `${(e / 1e3).toFixed(1)}K` : e.toString();
}
function V(e) {
  return e ? new Date(e).toLocaleTimeString() : "Never";
}
let c = null;
function J(e) {
  c = e;
}
function W() {
  t.container && (t.container.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    const n = a.dataset.action;
    if (n === "close" && c)
      c.hide();
    else if (n === "minimize")
      Y();
    else if (n === "refresh" && c)
      c.refresh();
    else if (n === "export" && c)
      c.exportJSON();
    else if (n === "toggle") {
      const s = a.dataset.feature, i = a.dataset.enabled === "true";
      a.dataset.canDisable === "true" && q(s, !i);
    }
  }), t.container.addEventListener("change", (e) => {
    const a = e.target.closest("[data-action]");
    a && a.dataset.action === "filter" && (t.filter = a.value, c && c.render && c.render());
  }));
}
function Y() {
  t.minimized = !t.minimized, t.container && t.container.classList.toggle("kgp--minimized", t.minimized);
}
function q(e, a) {
  const n = w();
  n && n.setFlag && (n.setFlag(e, a, "override", "governance-panel"), c && c.refresh && c.refresh());
}
function Z(e) {
  const a = e.context || {}, n = e.health || {}, s = e.definitions || {}, i = a.mode || "UNKNOWN", d = a.phase || "unknown", r = n.global ? n.global.score : 0, o = n.global ? n.global.status : "UNKNOWN", l = s.totalFeatures || 0, v = s.registered ? "Yes" : "No";
  return `<div class="kgp__status-row"><div class="kgp__status-card ${T(i)}"><div class="kgp__status-label">Mode</div><div class="kgp__status-value">${i}</div><div class="kgp__status-sub">Phase: ${d}</div></div><div class="kgp__status-card ${K(r)}"><div class="kgp__status-label">Health</div><div class="kgp__status-value">${r}%</div><div class="kgp__status-sub">${o}</div></div><div class="kgp__status-card"><div class="kgp__status-label">Features</div><div class="kgp__status-value">${l}</div><div class="kgp__status-sub">Registered: ${v}</div></div></div>`;
}
function Q(e) {
  const n = (e.health || {}).byCategory || {}, s = Object.keys(n);
  if (s.length === 0)
    return '<div class="kgp__empty">No health data yet</div>';
  let i = '<div class="kgp__categories">';
  return s.forEach((d) => {
    const r = n[d], o = r.score || 0, l = r.status || "UNKNOWN", v = P(l);
    i += `<div class="kgp__category ${v}" data-category="${d}"><div class="kgp__category-name">${d.toUpperCase()}</div><div class="kgp__category-score">${o}%</div><div class="kgp__category-indicator"></div></div>`;
  }), i += "</div>", i;
}
function X(e) {
  const n = (e.manifest || {}).features || {};
  let s = Object.keys(n);
  const i = t.filter;
  if (i && i !== "all" && (s = s.filter((o) => n[o].category === i)), s.length === 0)
    return '<div class="kgp__empty">No features registered</div>';
  const d = [];
  Object.keys(n).forEach((o) => {
    const l = n[o].category;
    l && d.indexOf(l) === -1 && d.push(l);
  });
  let r = '<div class="kgp__features-filter"><select class="kgp__filter-select" data-action="filter"><option value="all">All Categories</option>';
  return d.sort().forEach((o) => {
    r += `<option value="${o}"${i === o ? " selected" : ""}>${o.toUpperCase()}</option>`;
  }), r += "</select></div>", r += '<div class="kgp__features-list">', s.sort().forEach((o) => {
    const l = n[o], v = l.enabled !== !1, L = l.critical === !0, F = l.experimental === !0, A = l.deprecated === !0, z = l.canDisable !== !1;
    let h = "kgp__feature";
    h += v ? " kgp__feature--enabled" : " kgp__feature--disabled", L && (h += " kgp__feature--critical");
    let m = "kgp__feature-toggle";
    m += v ? " kgp__feature-toggle--on" : "", z || (m += " kgp__feature-toggle--disabled"), r += `<div class="${h}" data-feature="${o}"><div class="kgp__feature-indicator"></div><div class="kgp__feature-name">${o}</div><div class="kgp__feature-category">${l.category || "N/A"}</div><div class="kgp__feature-badges">`, L && (r += '<span class="kgp__badge kgp__badge--critical">crit</span>'), F && (r += '<span class="kgp__badge kgp__badge--experimental">exp</span>'), A && (r += '<span class="kgp__badge kgp__badge--deprecated">dep</span>'), r += `</div><div class="${m}" data-action="toggle" data-feature="${o}" data-enabled="${v}" data-can-disable="${z}"></div></div>`;
  }), r += "</div>", r;
}
function ee(e) {
  const n = (e.telemetry || {}).metrics || {}, s = n.emitted || 0, i = n.buffered || 0, d = n.errors || 0, r = n.flushed || 0;
  return `<div class="kgp__telemetry"><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${y(s)}</div><div class="kgp__telemetry-label">Emitted</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${y(i)}</div><div class="kgp__telemetry-label">Buffered</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${y(r)}</div><div class="kgp__telemetry-label">Flushed</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${d}</div><div class="kgp__telemetry-label">Errors</div></div></div>`;
}
function _() {
  if (!t.container) return;
  const e = $(), n = !!w();
  let s = `<div class="kgp__header"><div class="kgp__title">${g.kernel} KERNEL GOVERNANCE</div><div class="kgp__controls"><button class="kgp__btn" data-action="refresh" title="Refresh">${g.refresh}</button><button class="kgp__btn" data-action="export" title="Export JSON">${g.export}</button><button class="kgp__btn" data-action="minimize" title="Minimize">${g.minimize}</button><button class="kgp__btn kgp__btn--close" data-action="close" title="Close">${g.close}</button></div></div>`;
  s += '<div class="kgp__body">', n ? (s += Z(e), s += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Health by Category</div></div><div class="kgp__section-content">${Q(e)}</div></div>`, s += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Features</div></div><div class="kgp__section-content">${X(e)}</div></div>`, s += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Telemetry</div></div><div class="kgp__section-content">${ee(e)}</div></div>`) : s += '<div class="kgp__empty" style="padding: 40px; text-align: center;"><div style="margin-bottom: 10px; color: #f59e0b;">&#9888;&#65039; Governance not loaded</div><div style="font-size: 11px; color: #9aa3b2;">Core Enterprise module may still be loading.<br>Click refresh to retry.</div></div>', s += "</div>", s += `<div class="kgp__footer"><div class="kgp__footer-left"><span class="kgp__version">v${k}</span><span class="kgp__updated">Updated: ${V(t.lastUpdate)}</span></div><div class="kgp__footer-right"><span>Ctrl+Shift+G to toggle</span></div></div>`, t.container.innerHTML = s, W();
}
const b = H({ moduleId: u });
let f = !1;
function te() {
  f || (b.init(), f = !0);
}
function ne() {
  return te(), b.getEventBus ? b.getEventBus() : null;
}
function C(e, a) {
  const n = ne();
  n && typeof n.emit == "function" && n.emit(e, { ...a, source: u, timestamp: Date.now() });
}
function x(e) {
  return B(), t.container || (t.container = document.createElement("div"), t.container.className = "kgp", t.container.id = "kernel-governance-panel", document.body.appendChild(t.container)), _(), requestAnimationFrame(() => {
    t.container.classList.add("kgp--visible");
  }), t.visible = !0, t.refreshInterval || (t.refreshInterval = setInterval(() => {
    t.visible && !t.minimized && _();
  }, U.refreshInterval)), C("governance-panel:opened", {}), { ok: !0 };
}
function p() {
  return t.container && t.container.classList.remove("kgp--visible"), t.visible = !1, t.refreshInterval && (clearInterval(t.refreshInterval), t.refreshInterval = null), C("governance-panel:closed", {}), { ok: !0 };
}
function E() {
  return t.visible ? p() : x();
}
function I() {
  return _(), C("governance-panel:refresh", { data: t.data }), { ok: !0, data: t.data };
}
function R() {
  return $();
}
function N() {
  const e = $(), a = JSON.stringify(e, null, 2), n = new Blob([a], { type: "application/json" }), s = URL.createObjectURL(n), i = document.createElement("a");
  return i.href = s, i.download = `kernel-governance-${Date.now()}.json`, i.click(), URL.revokeObjectURL(s), { ok: !0 };
}
function S() {
  return t.visible;
}
function j() {
  return p(), t.container && t.container.parentNode && t.container.parentNode.removeChild(t.container), M(), { ok: !0 };
}
function G() {
  return {
    moduleId: u,
    version: k,
    visible: t.visible,
    minimized: t.minimized,
    lastUpdate: t.lastUpdate,
    filter: t.filter,
    autoRefresh: U.autoRefresh,
    governanceAvailable: !!(window.Governance || window.Core && window.Core.Governance),
    p2Enterprise: !0,
    portsInitialized: f,
    timestamp: Date.now()
  };
}
function ae() {
  const e = {
    portsInitialized: f,
    containerExists: !!t.container,
    governanceAvailable: !!(window.Governance || window.Core && window.Core.Governance)
  }, a = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: f ? "HEALTHY" : "NOT_INITIALIZED",
    score: { passed: a, total: n, percentage: Math.round(a / n * 100) },
    moduleId: u,
    version: k,
    p2Enterprise: !0,
    portsInitialized: f,
    checks: e,
    timestamp: Date.now()
  };
}
J({ hide: p, refresh: I, exportJSON: N, render: _ });
typeof window < "u" && document.addEventListener("keydown", (e) => {
  e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "g" && (e.preventDefault(), E());
});
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.governancePanel = {
  show: x,
  hide: p,
  toggle: E,
  refresh: I,
  getData: R,
  exportJSON: N,
  isVisible: S,
  destroy: j,
  info: G
});
var ie = {
  VERSION: k,
  MODULE_ID: u,
  show: x,
  hide: p,
  toggle: E,
  refresh: I,
  getData: R,
  exportJSON: N,
  isVisible: S,
  destroy: j,
  info: G,
  healthCheck: ae
};
export {
  u as MODULE_ID,
  k as VERSION,
  ie as default,
  j as destroy,
  N as exportJSON,
  R as getData,
  ae as healthCheck,
  p as hide,
  G as info,
  S as isVisible,
  I as refresh,
  x as show,
  E as toggle
};
