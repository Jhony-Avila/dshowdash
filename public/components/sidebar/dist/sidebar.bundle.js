import { createUiPorts as v, createCorePorts as Qb } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS as f, ACCORDION_INTENTS as Va } from "/core/runtime/events/catalog/sidebar.events.js";
import { SIDEBAR_EVENTS as mA } from "/core/runtime/events/catalog/sidebar.events.js";
import { isStrict as It, recordViolation as jn } from "/core/runtime/enterprise/strict-mode.js";
import { ROUTER_EVENTS as pe } from "/core/runtime/events/catalog/router.events.js";
import { UI_INTENTS as oi, UI_EVENTS as bl } from "/core/runtime/events/catalog/ui.events.js";
import { NAV_INTENTS as e_ } from "/core/runtime/events/catalog/nav.events.js";
import { get as Md, listNamespaces as t_ } from "/components/icon-registry/index.js";
import { LAYOUT_EVENTS as Qs } from "/core/runtime/events/catalog/layout.events.js";
const mr = "5.5.0-ENTERPRISE-FULL", le = "sidebar-constants", Od = Object.freeze({
  canNavigate: !0,
  canCollapse: !0,
  canSearch: !0,
  canCollapseSections: !0,
  supportsAccordion: !0,
  supportsKeyboardNav: !0,
  supportsTooltips: !0,
  supportsMobile: !0,
  supportsBadges: !0,
  supportsBadgePulse: !0,
  supportsPermissions: !0,
  hasErrorBoundary: !0,
  hasTimeout: !0,
  hasRetry: !0,
  hasFallback: !0,
  hasBidirectionalSync: !0,
  hasDebounce: !0,
  hasAutoCorrection: !0,
  hasUnifiedPersistence: !0,
  hasServiceWorkerCache: !0,
  hasIntersectionObserver: !0,
  hasMemoryOptimization: !0,
  hasBundleSplitting: !0,
  hasPreloadCriticalCSS: !0,
  // v5.4.0: Integrated features
  hasSubmenuHandler: !0,
  hasFuzzySearch: !0,
  hasSearchFilters: !0,
  hasSearchSuggestions: !0,
  hasContextMenu: !0,
  hasResizeHandler: !0,
  hasThemeHandler: !0,
  hasAutoTheme: !0,
  hasCompactMode: !0,
  hasMiniMode: !0,
  hasDragDrop: !0,
  hasProgressHandler: !0,
  hasQuickActions: !0,
  hasScreenReader: !0,
  hasRealtimeNotifications: !0,
  hasConfigManager: !0,
  // v5.5.0: Visual features
  hasConfetti: !0,
  hasParallax: !0,
  hasGlassmorphism: !0,
  hasCustomCursors: !0,
  compliance: "AAA-BULLETPROOF-FULL",
  totalFeatures: 57
}), qa = Object.freeze({ cssTimeout: 5e3, configTimeout: 3e3, adapterTimeout: 2e3, maxRetries: 3, retryDelay: 1e3 }), r_ = Object.freeze({ enabled: !0, wrapAround: !0, focusDelay: 50 }), wu = "/components/sidebar/styles/sidebar.bundle.css?v=20260720", Nu = "5.6.0-P18EC", Ru = "sidebar-state-machine", L = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  MOUNTING: "mounting",
  MOUNTED: "mounted",
  READY: "ready",
  DEGRADED: "degraded",
  ERROR: "error",
  DESTROYING: "destroying",
  DESTROYED: "destroyed"
}), n_ = {
  [L.IDLE]: [L.INITIALIZING],
  [L.INITIALIZING]: [L.MOUNTING, L.ERROR],
  [L.MOUNTING]: [L.MOUNTED, L.ERROR],
  [L.MOUNTED]: [L.READY, L.DEGRADED, L.ERROR],
  [L.READY]: [L.DEGRADED, L.DESTROYING],
  [L.DEGRADED]: [L.READY, L.ERROR, L.DESTROYING],
  [L.ERROR]: [L.DESTROYING, L.INITIALIZING],
  [L.DESTROYING]: [L.DESTROYED],
  [L.DESTROYED]: [L.IDLE]
}, s_ = { persistState: !0, storageKey: "dsd:sidebar:sections", allowMultipleOpen: !0, animationDuration: 250 };
class i_ {
  constructor(t = {}) {
    this._lifecycle = L.IDLE, this._collapsed = t.collapsed ?? !1, this._mobileOpen = !1, this._isMobile = !1, this._activeItemId = null, this._hoveredItemId = null, this._subscribers = /* @__PURE__ */ new Set(), this._history = [], this._maxHistory = 50, this._expandedSections = /* @__PURE__ */ new Set(), this._accordionConfig = { ...s_, ...t.accordion }, this._metrics = { transitions: 0, toggles: 0, sectionExpands: 0, sectionCollapses: 0, notifications: 0, resets: 0 }, this._restoreExpandedSections();
  }
  get expandedSections() {
    return new Set(this._expandedSections);
  }
  get expandedSectionsArray() {
    return Array.from(this._expandedSections);
  }
  isSectionExpanded(t) {
    return this._expandedSections.has(t);
  }
  toggleSection(t) {
    return this._expandedSections.has(t) ? this.collapseSection(t) : this.expandSection(t);
  }
  expandSection(t) {
    if (this._expandedSections.has(t)) return { success: !0, changed: !1, sectionId: t, expanded: !0 };
    if (this._metrics.sectionExpands++, !this._accordionConfig.allowMultipleOpen && this._expandedSections.size > 0) {
      const r = Array.from(this._expandedSections);
      this._expandedSections.clear(), r.forEach((n) => this._notify("sectionCollapsed", { sectionId: n }));
    }
    return this._expandedSections.add(t), this._recordHistory("sectionExpanded", null, t), this._persistExpandedSections(), this._notify("sectionExpanded", { sectionId: t, expanded: !0 }), { success: !0, changed: !0, sectionId: t, expanded: !0 };
  }
  collapseSection(t) {
    return this._expandedSections.has(t) ? (this._metrics.sectionCollapses++, this._expandedSections.delete(t), this._recordHistory("sectionCollapsed", t, null), this._persistExpandedSections(), this._notify("sectionCollapsed", { sectionId: t, expanded: !1 }), { success: !0, changed: !0, sectionId: t, expanded: !1 }) : { success: !0, changed: !1, sectionId: t, expanded: !1 };
  }
  expandAllSections(t) {
    if (!Array.isArray(t)) return { success: !1, error: "sectionIds must be array" };
    const r = [];
    return t.forEach((n) => {
      this._expandedSections.has(n) || (this._expandedSections.add(n), r.push(n));
    }), r.length > 0 && (this._persistExpandedSections(), this._notify("sectionsExpandedBulk", { sectionIds: r })), { success: !0, changed: r.length > 0, expandedCount: r.length };
  }
  collapseAllSections() {
    if (this._expandedSections.size === 0) return { success: !0, changed: !1 };
    const t = Array.from(this._expandedSections);
    return this._expandedSections.clear(), this._persistExpandedSections(), this._notify("sectionsCollapsedAll", { sectionIds: t }), { success: !0, changed: !0, collapsedCount: t.length };
  }
  setAccordionMode(t) {
    if (this._accordionConfig.allowMultipleOpen = !!t, !t && this._expandedSections.size > 1) {
      const r = this._expandedSections.values().next().value;
      this._expandedSections.clear(), this._expandedSections.add(r), this._persistExpandedSections();
    }
    return this._notify("accordionModeChanged", { allowMultiple: t }), { success: !0, allowMultiple: t };
  }
  _persistExpandedSections() {
    if (this._accordionConfig.persistState)
      try {
        localStorage.setItem(this._accordionConfig.storageKey, JSON.stringify(Array.from(this._expandedSections)));
      } catch {
      }
  }
  _restoreExpandedSections() {
    if (this._accordionConfig.persistState)
      try {
        const t = localStorage.getItem(this._accordionConfig.storageKey);
        if (t) {
          const r = JSON.parse(t);
          Array.isArray(r) && r.forEach((n) => this._expandedSections.add(n));
        }
      } catch {
      }
  }
  get lifecycle() {
    return this._lifecycle;
  }
  canTransitionTo(t) {
    return (n_[this._lifecycle] || []).includes(t);
  }
  transitionTo(t) {
    if (!this.canTransitionTo(t)) return { success: !1, error: `Invalid transition: ${this._lifecycle} -> ${t}` };
    this._metrics.transitions++;
    const r = this._lifecycle;
    return this._lifecycle = t, this._recordHistory("lifecycle", r, t), this._notify("lifecycle", { old: r, new: t }), { success: !0, old: r, new: t };
  }
  get collapsed() {
    return this._collapsed;
  }
  get expanded() {
    return !this._collapsed;
  }
  setCollapsed(t) {
    if (this._collapsed === t) return { success: !0, changed: !1 };
    const r = this._collapsed;
    return this._collapsed = t, this._recordHistory("collapsed", r, t), this._notify("collapsed", { old: r, new: t }), { success: !0, changed: !0, old: r, new: t };
  }
  toggle() {
    return this._metrics.toggles++, this.setCollapsed(!this._collapsed);
  }
  collapse() {
    return this.setCollapsed(!0);
  }
  expand() {
    return this.setCollapsed(!1);
  }
  get mobileOpen() {
    return this._mobileOpen;
  }
  get isMobile() {
    return this._isMobile;
  }
  setMobile(t) {
    if (this._isMobile === t) return { success: !0, changed: !1 };
    const r = this._isMobile;
    return this._isMobile = t, t || (this._mobileOpen = !1), this._recordHistory("isMobile", r, t), this._notify("isMobile", { old: r, new: t }), { success: !0, changed: !0 };
  }
  setMobileOpen(t) {
    if (!this._isMobile) return { success: !1, error: "Not in mobile mode" };
    if (this._mobileOpen === t) return { success: !0, changed: !1 };
    const r = this._mobileOpen;
    return this._mobileOpen = t, this._recordHistory("mobileOpen", r, t), this._notify("mobileOpen", { old: r, new: t }), { success: !0, changed: !0 };
  }
  toggleMobile() {
    return this.setMobileOpen(!this._mobileOpen);
  }
  openMobile() {
    return this.setMobileOpen(!0);
  }
  closeMobile() {
    return this.setMobileOpen(!1);
  }
  get activeItemId() {
    return this._activeItemId;
  }
  setActiveItem(t) {
    if (this._activeItemId === t) return { success: !0, changed: !1 };
    const r = this._activeItemId;
    return this._activeItemId = t, this._recordHistory("activeItemId", r, t), this._notify("activeItemId", { old: r, new: t }), { success: !0, changed: !0 };
  }
  get hoveredItemId() {
    return this._hoveredItemId;
  }
  setHoveredItem(t) {
    if (this._hoveredItemId === t) return { success: !0, changed: !1 };
    const r = this._hoveredItemId;
    return this._hoveredItemId = t, this._notify("hoveredItemId", { old: r, new: t }), { success: !0, changed: !0 };
  }
  subscribe(t) {
    return typeof t != "function" ? () => {
    } : (this._subscribers.add(t), () => this._subscribers.delete(t));
  }
  _notify(t, r) {
    this._metrics.notifications++;
    const n = this.getState();
    this._subscribers.forEach((s) => {
      try {
        s(t, r, n);
      } catch {
      }
    });
  }
  _recordHistory(t, r, n) {
    this._history.push({ timestamp: Date.now(), key: t, old: r, new: n }), this._history.length > this._maxHistory && this._history.shift();
  }
  getState() {
    return {
      lifecycle: this._lifecycle,
      collapsed: this._collapsed,
      mobileOpen: this._mobileOpen,
      isMobile: this._isMobile,
      activeItemId: this._activeItemId,
      hoveredItemId: this._hoveredItemId,
      expandedSections: Array.from(this._expandedSections),
      accordionConfig: { ...this._accordionConfig }
    };
  }
  getHistory() {
    return [...this._history];
  }
  reset() {
    this._metrics.resets++, this._lifecycle = L.IDLE, this._collapsed = !1, this._mobileOpen = !1, this._isMobile = !1, this._activeItemId = null, this._hoveredItemId = null, this._expandedSections.clear(), this._history = [];
    try {
      localStorage.removeItem(this._accordionConfig.storageKey);
    } catch {
    }
  }
  getMetrics() {
    return {
      ...this._metrics,
      subscribersCount: this._subscribers.size,
      historyCount: this._history.length,
      expandedSectionsCount: this._expandedSections.size,
      lifecycle: this._lifecycle
    };
  }
  healthCheck() {
    const t = {
      lifecycleValid: Object.values(L).includes(this._lifecycle),
      notInError: this._lifecycle !== L.ERROR,
      subscribersOk: this._subscribers.size < 100,
      historyOk: this._history.length <= this._maxHistory,
      accordionStateValid: this._expandedSections instanceof Set
    }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length;
    return {
      status: r === n ? "HEALTHY" : r >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: r,
      maxScore: n,
      scoreDisplay: `${r}/${n}`,
      checks: t,
      lifecycle: this._lifecycle,
      subscribersCount: this._subscribers.size,
      historyCount: this._history.length,
      expandedSectionsCount: this._expandedSections.size,
      accordionConfig: this._accordionConfig,
      version: Nu,
      moduleId: Ru,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    };
  }
  info() {
    return { version: Nu, moduleId: Ru, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
}
const _l = "5.10.0-UARPS-ONLY", as = "sidebar-registry", vn = v({ moduleId: as });
function o_() {
  vn.init();
}
function a_(e) {
  return vn.get(e);
}
function l_(e) {
  return vn.inject(e);
}
function c_() {
  return vn.snapshot();
}
const kt = {
  source: "api",
  apiEndpoint: "/api/ui/navigation.php?action=manifest",
  fallbackToManifest: !0,
  cacheEnabled: !0,
  cacheTTL: 5 * 60 * 1e3
}, tt = {
  main: "dashboard",
  principal: "dashboard",
  operacional: "settings",
  admin: "shield",
  administracao: "shield",
  config: "cog",
  default: "grid"
}, J = /* @__PURE__ */ new Map(), be = /* @__PURE__ */ new Map(), hn = /* @__PURE__ */ new Map(), In = /* @__PURE__ */ new Map(), Jn = /* @__PURE__ */ new Set();
let Ot = { data: null, timestamp: 0 }, yl = 0;
const H = {
  source: null,
  sectionsLoaded: 0,
  itemsLoaded: 0,
  badgesSet: 0,
  filtersApplied: 0,
  apiCalls: 0,
  apiFails: 0,
  cacheHits: 0,
  keyLookups: 0,
  lastLoad: null,
  lastUpdate: null,
  errors: 0
};
function Pt(e, t) {
  const r = {
    sections: $i(),
    items: ls(),
    badges: Sl(),
    event: e,
    data: t,
    timestamp: Date.now()
  };
  Jn.forEach((s) => {
    try {
      s(r);
    } catch {
      H.errors++;
    }
  });
  const n = a_("eventBus");
  n != null && n.emit && n.emit(e, { source: as, ...r });
}
function u_(e) {
  return {
    ...e,
    key: e.item_key || null,
    route: e.route_path || null,
    panelId: e.panel_id || null,
    order: e.order_index ?? 100,
    permissions: e.required_permissions ? e.required_permissions.split(",").map((t) => t.trim()) : [],
    sectionId: e.parent_key || null,
    visible: e.is_visible !== 0 && e.is_active !== 0,
    disabled: e.is_disabled === 1
  };
}
async function Td(e = kt.apiEndpoint) {
  if (Ot.data && Date.now() - Ot.timestamp < kt.cacheTTL)
    return H.cacheHits++, Ya(Ot.data), { success: !0, source: "cache", sectionsCount: J.size, itemsCount: be.size };
  H.apiCalls++;
  try {
    const t = await fetch(e, {
      headers: { Accept: "application/json" },
      credentials: "include"
    });
    if (!t.ok) throw new Error(`API error: ${t.status}`);
    const r = await t.json();
    if (!r.ok && !r.success) throw new Error(r.error || "API returned error");
    const n = r.data;
    return yl = n.userLevel ?? 0, kt.cacheEnabled && (Ot = { data: n, timestamp: Date.now() }), Ya(n), H.source = "api", Pt(f.REGISTRY_LOADED, {
      source: "api",
      sectionsCount: J.size,
      itemsCount: be.size
    }), { success: !0, source: "api", sectionsCount: J.size, itemsCount: be.size };
  } catch {
    return H.apiFails++, H.errors++, vl();
  }
}
function Ya(e) {
  J.clear(), be.clear(), hn.clear();
  let t = e.items || [];
  if (Array.isArray(t) || (t = Object.values(t)), e.sections && Array.isArray(e.sections) && e.sections.length > 0)
    e.sections.forEach((r) => {
      const n = r.icon || tt[r.id] || tt[r.key] || tt.default;
      J.set(r.id, {
        ...r,
        icon: n,
        visible: !0,
        collapsible: r.collapsible !== !1
      });
    });
  else {
    const r = /* @__PURE__ */ new Set();
    t.forEach((n) => {
      if (n.item_type === "group" || n.item_type === "header" || n.item_type === "section") {
        const s = n.item_key || n.id, i = n.icon || tt[s] || tt.default;
        J.set(s, {
          id: s,
          key: n.item_key || null,
          label: n.label || n.title || s,
          icon: i,
          order: n.order_index ?? 100,
          visible: !0,
          collapsible: n.collapsible !== !1
        }), r.add(s);
      }
    }), t.forEach((n) => {
      if (n.parent_key && !r.has(n.parent_key) && !J.has(n.parent_key)) {
        const s = tt[n.parent_key] || tt.default;
        J.set(n.parent_key, {
          id: n.parent_key,
          key: n.parent_key,
          label: n.parent_key,
          icon: s,
          order: 100,
          visible: !0,
          collapsible: !0
        }), r.add(n.parent_key);
      }
    });
  }
  H.sectionsLoaded = J.size, t.forEach((r) => {
    if (r.item_type === "group" || r.item_type === "header" || r.item_type === "section") return;
    const n = u_(r);
    be.set(n.id, n), n.item_key && hn.set(n.item_key, n);
  }), H.itemsLoaded = be.size, H.lastLoad = Date.now();
}
async function vl() {
  try {
    const { getManifest: e } = await Promise.resolve().then(() => rA), t = e();
    return Ya(t), H.source = "manifest", Pt(f.REGISTRY_LOADED, {
      source: "manifest",
      sectionsCount: J.size,
      itemsCount: be.size
    }), { success: !0, source: "manifest", sectionsCount: J.size, itemsCount: be.size };
  } catch (e) {
    return H.errors++, Pt(f.REGISTRY_ERROR, { error: e.message }), { success: !1, error: e.message };
  }
}
async function d_() {
  return o_(), kt.source === "api" ? Td() : vl();
}
function $i() {
  return Array.from(J.values()).filter((e) => e.visible !== !1).sort((e, t) => (e.order || e.priority || 100) - (t.order || t.priority || 100));
}
function h_(e) {
  return J.get(e) || null;
}
function f_(e) {
  const t = J.get(e);
  return (t == null ? void 0 : t.icon) || tt[e] || tt.default;
}
function g_(e, t) {
  const r = J.get(e);
  return r ? (Object.assign(r, t), H.lastUpdate = Date.now(), Pt(f.REGISTRY_UPDATED, { type: "section", id: e, updates: t }), { success: !0 }) : { success: !1, error: "Section not found" };
}
function ls(e = null) {
  let t = Array.from(be.values()).filter((r) => r.visible !== !1);
  return e && (t = t.filter((r) => r.sectionId === e || r.parent_key === e)), t.sort((r, n) => (r.order || r.priority || 100) - (n.order || n.priority || 100));
}
function Dd(e) {
  const t = be.get(e);
  return t || (typeof e == "string" ? (H.keyLookups++, hn.get(e) || null) : null);
}
function Ld(e) {
  return ls(e);
}
function Il(e, t) {
  const r = Dd(e);
  return r ? (Object.assign(r, t), H.lastUpdate = Date.now(), Pt(f.REGISTRY_UPDATED, { type: "item", id: e, updates: t }), { success: !0 }) : { success: !1, error: "Item not found" };
}
function m_(e, t) {
  return Il(e, { visible: t });
}
function p_(e, t) {
  return Il(e, { disabled: t });
}
function E_(e, t) {
  return In.set(e, {
    itemId: e,
    value: t.value ?? null,
    type: t.type || "info",
    visible: t.visible ?? !0,
    pulse: t.pulse ?? !1
  }), H.badgesSet++, Pt(f.REGISTRY_UPDATED, { type: "badge", itemId: e, badge: t }), { success: !0 };
}
function b_(e) {
  return In.get(e) || null;
}
function Sl() {
  return Array.from(In.values()).filter((e) => e.visible !== !1);
}
function __(e) {
  return In.delete(e), Pt(f.REGISTRY_UPDATED, { type: "badge-removed", itemId: e }), { success: !0 };
}
function y_(e = null, t = []) {
  return H.filtersApplied++, be.forEach((r, n) => {
    let s = !0;
    const i = r.permissions || [];
    i.length > 0 && (s = i.some((o) => t.includes(o))), r.visible = s;
  }), J.forEach((r, n) => {
    const s = Ld(n).filter((i) => i.visible);
    r.visible = s.length > 0;
  }), Pt(f.REGISTRY_UPDATED, { type: "permission-filter", strategy: "uarps-only" }), {
    success: !0,
    visibleSections: $i().length,
    visibleItems: ls().length
  };
}
function v_() {
  return yl;
}
function I_() {
  return Ot = { data: null, timestamp: 0 }, { success: !0 };
}
function S_(e) {
  return e === "api" || e === "manifest" ? (kt.source = e, { success: !0, source: e }) : { success: !1, error: "Invalid source" };
}
function C_(e) {
  return typeof e != "function" ? () => {
  } : (Jn.add(e), () => Jn.delete(e));
}
function A_(e) {
  Jn.delete(e);
}
function $d() {
  J.clear(), be.clear(), hn.clear(), In.clear(), Ot = { data: null, timestamp: 0 }, yl = 0;
}
function M_() {
  $d(), Object.keys(H).forEach((e) => {
    typeof H[e] == "number" ? H[e] = 0 : H[e] !== null && (H[e] = null);
  });
}
function kd() {
  const e = be.size > 0, t = J.size > 0, r = Ot.data && Date.now() - Ot.timestamp < kt.cacheTTL, n = H.errors === 0, s = H.apiFails === 0 || H.apiCalls > H.apiFails, i = vn.isInitialized(), o = hn.size > 0, a = { hasItems: e, hasSections: t, hasDualIndex: o, cacheValid: r, noErrors: n, apiWorking: s, portsInitialized: i }, l = Object.values(a).filter(Boolean).length, u = Object.keys(a).length;
  let d = "HEALTHY";
  return !e || !t ? d = "UNHEALTHY" : (H.errors > 0 || !s) && (d = "DEGRADED"), {
    status: d,
    score: l,
    maxScore: u,
    scoreDisplay: `${l}/${u}`,
    checks: a,
    source: H.source,
    sectionsCount: J.size,
    itemsCount: be.size,
    itemsByKeyCount: hn.size,
    badgesCount: In.size,
    subscribersCount: Jn.size,
    metrics: { ...H },
    config: { ...kt },
    version: _l,
    moduleId: as,
    timestamp: Date.now()
  };
}
function O_() {
  return {
    version: _l,
    moduleId: as,
    source: H.source,
    sections: $i(),
    items: ls(),
    badges: Sl(),
    metrics: { ...H },
    config: { ...kt },
    portsInitialized: vn.isInitialized(),
    healthCheck: kd()
  };
}
function T_() {
  return { ...H };
}
const wd = {
  VERSION: _l,
  MODULE_ID: as,
  load: d_,
  loadFromManifest: vl,
  loadFromAPI: Td,
  getSections: $i,
  getSectionById: h_,
  getSectionIcon: f_,
  updateSection: g_,
  getItems: ls,
  getItemById: Dd,
  getItemsBySection: Ld,
  updateItem: Il,
  setItemVisible: m_,
  setItemDisabled: p_,
  setBadge: E_,
  getBadge: b_,
  getBadges: Sl,
  removeBadge: __,
  applyPermissionFilter: y_,
  getUserLevel: v_,
  invalidateCache: I_,
  setSource: S_,
  subscribe: C_,
  unsubscribe: A_,
  clear: $d,
  reset: M_,
  healthCheck: kd,
  info: O_,
  getMetrics: T_,
  injectPorts: l_,
  getPorts: c_
};
typeof window < "u" && (window.SidebarRegistry = wd);
var w = wd;
const Ka = "dshowdash-layout-sidebarCollapsed", Wa = "dsd-sidebar-collapsed";
let Xa = { saves: 0, loads: 0, errors: 0, migrations: 0 };
function D_() {
  try {
    const e = localStorage.getItem(Ka), t = localStorage.getItem(Wa), r = e !== null ? JSON.parse(e) : null, n = t !== null ? JSON.parse(t) : null;
    return { synced: r === n, unified: r, legacy: n };
  } catch (e) {
    return Xa.errors++, { synced: !1, error: e.message };
  }
}
function L_() {
  try {
    const e = localStorage.getItem(Ka);
    if (e !== null) localStorage.setItem(Wa, e);
    else {
      const t = localStorage.getItem(Wa);
      t !== null && (localStorage.setItem(Ka, t), Xa.migrations++);
    }
    return { success: !0 };
  } catch (e) {
    return Xa.errors++, { success: !1, error: e.message };
  }
}
const $_ = "sidebar-error-emitter", k_ = v({ moduleId: $_ });
function wa(e) {
  return k_.get(e);
}
let Vn = [], Cl = null, cs = "idle", Be = null, Ue = null;
function w_(e, t) {
  Be = e, Ue = t;
}
function Nd() {
  const e = wa("eventBus") || wa("eventBusGlobal");
  return e && wa("eventBus"), e;
}
function _e(e, t) {
  var r, n;
  try {
    Vn.includes(e) || Vn.push(e), cs = "degraded", Cl = t;
    const s = Nd();
    s != null && s.emit && s.emit(f.DEGRADED, {
      source: le,
      component: e,
      error: t,
      degradedComponents: Vn,
      timestamp: Date.now()
    }), (r = Be == null ? void 0 : Be.warn) == null || r.call(Be, `Component degraded: ${e}`, { error: t }), (n = Ue == null ? void 0 : Ue.trackError) == null || n.call(Ue, t, { component: e, phase: "degraded" });
  } catch {
  }
}
function ei(e, t = {}) {
  var r, n;
  try {
    cs = "error", Cl = e;
    const s = Nd();
    s != null && s.emit && s.emit(f.ERROR, {
      source: le,
      error: (e == null ? void 0 : e.message) || e,
      context: t,
      timestamp: Date.now()
    }), (r = Be == null ? void 0 : Be.error) == null || r.call(Be, "Sidebar error:", { error: e, context: t }), (n = Ue == null ? void 0 : Ue.trackError) == null || n.call(Ue, e, t);
  } catch {
  }
}
function Za() {
  return cs;
}
function Al(e) {
  cs = e;
}
function Rd() {
  return [...Vn];
}
function N_() {
  Vn = [], Cl = null, cs = "idle";
}
const xd = "6.0.0-NCS", Ml = "sidebar-ui-constants", Pd = Object.freeze({ accordion: !0, badges: !0, search: !0, keyboard: !0, mobile: !0, persistence: !0, tooltips: !0, skeleton: !0, ripple: !0 }), pi = Object.freeze({ main: "dashboard", operacional: "cog", analytics: "chart", management: "settings", admin: "shield", financeiro: "money", comercial: "chart", default: "nav" }), p = "dsd-sidebar", c = Object.freeze({
  // Root
  ROOT: p,
  // Root modifiers
  MOD_ANIMATE_IN: `${p}--animate-in`,
  MOD_COLLAPSED: `${p}--collapsed`,
  MOD_COMPACT: `${p}--compact`,
  MOD_DARK: `${p}--dark`,
  MOD_FALLBACK: `${p}--fallback`,
  MOD_HIGH_CONTRAST: `${p}--high-contrast`,
  MOD_LARGE_TEXT: `${p}--large-text`,
  MOD_LIGHT: `${p}--light`,
  MOD_LOADING: `${p}--loading`,
  MOD_LOADING_SKELETON: `${p}--loading-skeleton`,
  MOD_MINI: `${p}--mini`,
  MOD_MINI_HOVER: `${p}--mini-hover`,
  MOD_MOBILE: `${p}--mobile`,
  MOD_MOBILE_OPEN: `${p}--mobile-open`,
  MOD_PARALLAX: `${p}--parallax`,
  MOD_RESIZING: `${p}--resizing`,
  MOD_SEARCHING: `${p}--searching`,
  // Header
  HEADER: `${p}__header`,
  HEADER_WITH_SEARCH: `${p}__header--with-search`,
  BRAND_TEXT: `${p}__brand-text`,
  LOGO: `${p}__logo`,
  TOGGLE: `${p}__toggle`,
  // Navigation
  NAV: `${p}__nav`,
  NAV_CONTENT: `${p}__nav-content`,
  NAV_SECTION: `${p}__nav-section`,
  // Sections
  SECTION: `${p}__section`,
  SECTION_COLLAPSIBLE: `${p}__section--collapsible`,
  SECTION_EXPANDED: `${p}__section--expanded`,
  SECTION_CONTENT: `${p}__section-content`,
  SECTION_HEADER: `${p}__section-header`,
  SECTION_ITEMS: `${p}__section-items`,
  SECTION_TITLE: `${p}__section-title`,
  SECTION_TOGGLE: `${p}__section-toggle`,
  // Groups
  GROUP_BUTTON: `${p}__group-button`,
  GROUP_BUTTON_COLLAPSIBLE: `${p}__group-button--collapsible`,
  GROUP_CHEVRON: `${p}__group-chevron`,
  GROUP_ICON: `${p}__group-icon`,
  GROUP_ITEMS: `${p}__group-items`,
  GROUP_TITLE: `${p}__group-title`,
  // Items
  ITEM: `${p}__item`,
  ITEM_ACTIVE: `${p}__item--active`,
  ITEM_DISABLED: `${p}__item--disabled`,
  ITEM_EXPANDED: `${p}__item--expanded`,
  ITEM_FAVORITE: `${p}__item--favorite`,
  ITEM_HAS_SUBMENU: `${p}__item--has-submenu`,
  ITEM_HIDDEN: `${p}__item--hidden`,
  ITEM_MATCH: `${p}__item--match`,
  ITEM_PLACEHOLDER: `${p}__item--placeholder`,
  ITEM_SUBMENU_OPEN: `${p}__item--submenu-open`,
  ITEM_ICON: `${p}__item-icon`,
  ITEM_LABEL: `${p}__item-label`,
  ITEM_TEXT: `${p}__item-text`,
  ITEM_PLACEHOLDER_EL: `${p}__item-placeholder`,
  ITEM_PLACEHOLDER_ICON: `${p}__item-placeholder-icon`,
  ITEM_PLACEHOLDER_TEXT: `${p}__item-placeholder-text`,
  LINK: `${p}__link`,
  CHILDREN: `${p}__children`,
  // Accordion
  ACCORDION_CONTAINER: `${p}__accordion-container`,
  // Badges
  BADGE: `${p}__badge`,
  BADGE_PULSE: `${p}__badge--pulse`,
  // Search
  SEARCH: `${p}__search`,
  SEARCH_WRAPPER: `${p}__search-wrapper`,
  SEARCH_INPUT: `${p}__search-input`,
  SEARCH_ICON: `${p}__search-icon`,
  SEARCH_CLEAR: `${p}__search-clear`,
  SEARCH_EMPTY: `${p}__search-empty`,
  SEARCH_EMPTY_ICON: `${p}__search-empty-icon`,
  SEARCH_EMPTY_TEXT: `${p}__search-empty-text`,
  // Favorites
  FAVORITE_BTN: `${p}__favorite-btn`,
  FAVORITE_BTN_ACTIVE: `${p}__favorite-btn--active`,
  // Context menu
  CONTEXT_MENU: `${p}__context-menu`,
  CONTEXT_MENU_VISIBLE: `${p}__context-menu--visible`,
  CONTEXT_MENU_ITEM: `${p}__context-menu-item`,
  CONTEXT_MENU_ICON: `${p}__context-menu-icon`,
  CONTEXT_MENU_LABEL: `${p}__context-menu-label`,
  CONTEXT_MENU_SEPARATOR: `${p}__context-menu-separator`,
  // Submenu
  SUBMENU: `${p}__submenu`,
  SUBMENU_ITEM: `${p}__submenu-item`,
  SUBMENU_LINK: `${p}__submenu-link`,
  // Resize
  RESIZE_HANDLE: `${p}__resize-handle`,
  RESIZE_HANDLE_ACTIVE: `${p}__resize-handle--active`,
  // Skeleton
  SKELETON: `${p}__skeleton`,
  SKELETON_GROUP: `${p}__skeleton-group`,
  SKELETON_ICON: `${p}__skeleton-icon`,
  SKELETON_ITEM: `${p}__skeleton-item`,
  SKELETON_TEXT: `${p}__skeleton-text`,
  SKELETON_TEXT_SHORT: `${p}__skeleton-text--short`,
  // Accessibility
  ANNOUNCE: `${p}__announce`,
  SKIP_LINK: `${p}__skip-link`,
  KEYBOARD_HINTS: `${p}__keyboard-hints`,
  // Overlay
  OVERLAY: `${p}-overlay`,
  OVERLAY_VISIBLE: `${p}-overlay--visible`,
  // Visual
  RIPPLE: `${p}__ripple`,
  FOOTER: `${p}__footer`,
  // Empty state
  EMPTY: `${p}__empty`,
  EMPTY_ICON: `${p}__empty-icon`,
  EMPTY_TEXT: `${p}__empty-text`
}), Ja = `<div class="${c.EMPTY}"><span class="${c.EMPTY_ICON}">📋</span><span class="${c.EMPTY_TEXT}">Nenhum item disponível</span></div>`, R_ = `<aside class="${c.ROOT} ${c.MOD_FALLBACK}" id="sidebar" role="navigation"><div class="${c.HEADER}"><span class="${c.BRAND_TEXT}">Menu</span></div><nav class="${c.NAV}"><div class="${c.NAV_CONTENT}">${Ja}</div></nav></aside>`, ki = "7.1.0-ES6", Nr = "sidebar-event-setup", Rr = v({ moduleId: Nr });
function x_() {
  Rr.init();
}
function Hd(e) {
  return Rr.get(e);
}
function zd(e) {
  return Rr.inject(e);
}
function Bd() {
  return Rr.snapshot();
}
let Ze = [], qn = null, He = null, ne = {
  toggleClicks: 0,
  itemClicks: 0,
  searches: 0,
  sectionToggles: 0,
  registryHits: 0,
  domFallbacks: 0,
  panelIdFromDom: 0,
  navigationEmits: 0,
  errors: 0
};
function Pe(e, t, r) {
  qn && qn[e] && qn[e](`[${Nr}] ${t}`, r || {});
}
function xu(e, t) {
  try {
    const r = Hd("eventBus");
    if (r && r.emit)
      return r.emit(e, Object.assign({ source: Nr, timestamp: Date.now() }, t || {})), ne.navigationEmits++, !0;
  } catch {
    ne.errors++;
  }
  return !1;
}
function Ud(e) {
  e && Rr.inject({ eventBus: e }), x_();
  const t = Hd("eventBus");
  t && t.emit && t.emit(f.EVENT_SETUP_INITIALIZED);
}
function Ol(e, t) {
  qn = e, He = t;
}
function Tl(e, t) {
  if (!e) return () => {
  };
  const r = e.querySelector(`.${c.TOGGLE}`);
  if (!r) return () => {
  };
  const n = () => {
    ne.toggleClicks++, t && t();
  };
  r.addEventListener("click", n);
  const s = () => {
    r.removeEventListener("click", n);
  };
  return Ze.push(s), s;
}
function Dl(e, t) {
  if (!e) return () => {
  };
  const r = t.registry, n = t.routerAdapter, s = t.onSetActiveItem, i = (a) => {
    try {
      const l = a.target.closest(`.${c.LINK}`);
      if (!l) return;
      const u = l.closest(`.${c.ITEM}`), d = u ? u.dataset.itemId : null;
      if (!d) {
        Pe("debug", "Click on link without itemId", { link: l.href });
        return;
      }
      const h = u ? u.dataset.panelId : null;
      let g = null, m = null, y = null;
      if (r && typeof r.getItemById == "function" && (g = r.getItemById(d), g && (ne.registryHits++, m = g.route, y = g.panelId || null, g.disabled))) {
        Pe("debug", "Item disabled, ignoring click", { itemId: d }), a.preventDefault();
        return;
      }
      if (!y && h && (y = h, ne.panelIdFromDom++, Pe("debug", "Using DOM data-panel-id", { itemId: d, panelId: y })), !m) {
        const S = l.getAttribute("href");
        S && (m = S, ne.domFallbacks++, Pe("debug", "Using DOM fallback for route", { itemId: d, route: m }));
      }
      if (!m) {
        const S = l.getAttribute("data-panel");
        S && (m = `#/${S}`, ne.domFallbacks++, Pe("debug", "Using data-panel fallback for route", { itemId: d, panel: S, route: m }));
      }
      if (m) {
        a.preventDefault(), ne.itemClicks++;
        const S = g ? Object.assign({}, g, { panelId: y || g.panelId }) : {
          id: d,
          route: m,
          panelId: y,
          label: l.textContent ? l.textContent.trim() : d
        };
        xu(f.ITEM_CLICK, {
          itemId: d,
          item: S,
          panelId: y
        }), xu(f.NAVIGATE, {
          itemId: d,
          item: S,
          route: m,
          panelId: y
        }), n && typeof n.navigate == "function" ? (n.navigate(m), Pe("debug", "Navigated via routerAdapter", { itemId: d, route: m, panelId: y })) : (Pe("warn", "No routerAdapter available, using hash fallback", { itemId: d, route: m }), typeof window < "u" && window.location && (window.location.hash = m.charAt(0) === "#" ? m : `#${m}`)), s && s(d), He && He.trackNavigation && He.trackNavigation(d, m);
      } else
        Pe("warn", "No route found for item", { itemId: d });
    } catch (l) {
      ne.errors++, Pe("error", "Click handler error", { error: l.message, stack: l.stack });
    }
  };
  e.addEventListener("click", i);
  const o = () => {
    e.removeEventListener("click", i);
  };
  return Ze.push(o), o;
}
function Ll(e, t) {
  if (!e) return () => {
  };
  const r = t.renderer, n = e.querySelector(`.${c.SEARCH_INPUT}`), s = e.querySelector(`.${c.SEARCH_CLEAR}`);
  if (!n) return () => {
  };
  let i = null;
  const o = (d) => {
    clearTimeout(i), i = setTimeout(() => {
      try {
        const h = d.target.value, g = r && r.filterItems ? r.filterItems(h) : { visible: 0, hidden: 0 };
        ne.searches++, He && He.trackSearch && He.trackSearch(h, g.visible), s && (s.style.opacity = h ? "1" : "0", s.style.pointerEvents = h ? "auto" : "none");
      } catch (h) {
        ne.errors++, Pe("error", "Search error", { error: h.message });
      }
    }, 200);
  }, a = (d) => {
    d.preventDefault();
    try {
      n.value = "", r && r.clearSearch && r.clearSearch(), s && (s.style.opacity = "0", s.style.pointerEvents = "none"), n.focus(), He && He.trackSearch && He.trackSearch("", 0);
    } catch (h) {
      ne.errors++, Pe("error", "Clear search error", { error: h.message });
    }
  }, l = (d) => {
    d.key === "Escape" && n.value && a(d);
  };
  n.addEventListener("input", o), n.addEventListener("keydown", l), s && (s.addEventListener("click", a), s.style.opacity = "0", s.style.pointerEvents = "none");
  const u = () => {
    clearTimeout(i), n.removeEventListener("input", o), n.removeEventListener("keydown", l), s && s.removeEventListener("click", a);
  };
  return Ze.push(u), u;
}
function $l(e, t) {
  if (!e) return () => {
  };
  const r = (s) => {
    const i = s.target.closest(`.${c.GROUP_BUTTON}, .${c.SECTION_HEADER}`);
    if (!i) return;
    const o = i.closest(`.${c.SECTION}`), a = o ? o.dataset.sectionId : null;
    a && o.dataset.collapsible !== "false" && (s.preventDefault(), ne.sectionToggles++, t && t(a));
  };
  e.addEventListener("click", r);
  const n = () => {
    e.removeEventListener("click", r);
  };
  return Ze.push(n), n;
}
function kl(e, t) {
  Ze.length > 0 && Qn();
  const r = t.registry, n = t.routerAdapter, s = t.renderer, i = t.onToggle, o = t.onSetActiveItem, a = t.onToggleSection;
  return Tl(e, i), Dl(e, { registry: r, routerAdapter: n, onSetActiveItem: o }), Ll(e, { renderer: s }), $l(e, a), () => {
    Qn();
  };
}
function Qn() {
  Ze.forEach((e) => {
    try {
      e();
    } catch {
      ne.errors++;
    }
  }), Ze = [];
}
function jd() {
  return Ze.slice();
}
function wi() {
  return Object.assign({}, ne);
}
function Fd() {
  return {
    moduleId: Nr,
    version: ki,
    portsInitialized: Rr.isInitialized(),
    listenersActive: Ze.length,
    hasLogger: !!qn,
    hasTracker: !!He,
    metrics: wi()
  };
}
function Gd() {
  return {
    status: ne.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: ki,
    moduleId: Nr,
    portsInitialized: Rr.isInitialized(),
    checks: {
      noErrors: ne.errors === 0,
      listenersActive: Ze.length > 0
    },
    metrics: wi()
  };
}
var P_ = {
  VERSION: ki,
  MODULE_ID: Nr,
  init: Ud,
  setDependencies: Ol,
  setupToggleClick: Tl,
  setupItemClicks: Dl,
  setupSearch: Ll,
  setupSectionToggle: $l,
  setupAllEvents: kl,
  destroy: Qn,
  injectPorts: zd,
  getPorts: Bd,
  getCleanups: jd,
  getMetrics: wi,
  info: Fd,
  healthCheck: Gd
};
const H_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Nr,
  VERSION: ki,
  default: P_,
  destroy: Qn,
  getCleanups: jd,
  getMetrics: wi,
  getPorts: Bd,
  healthCheck: Gd,
  info: Fd,
  init: Ud,
  injectPorts: zd,
  setDependencies: Ol,
  setupAllEvents: kl,
  setupItemClicks: Dl,
  setupSearch: Ll,
  setupSectionToggle: $l,
  setupToggleClick: Tl
}, Symbol.toStringTag, { value: "Module" }));
let Na = !1, ur = { timeoutCalls: 0, retryCalls: 0, cssLoadAttempts: 0, cssLoadSuccess: 0, cssLoadFailed: 0 };
function z_(e, t, r = "Timeout") {
  return ur.timeoutCalls++, Promise.race([e, new Promise((n, s) => setTimeout(() => s(new Error(r)), t))]);
}
async function B_(e, t = 3, r = 1e3) {
  ur.retryCalls++;
  let n;
  for (let s = 0; s < t; s++)
    try {
      return await e();
    } catch (i) {
      n = i, s < t - 1 && await new Promise((o) => setTimeout(o, r * Math.pow(2, s)));
    }
  throw n;
}
async function U_() {
  if (ur.cssLoadAttempts++, Na) return !0;
  if (document.querySelector(`link[href="${wu}"]`))
    return Na = !0, ur.cssLoadSuccess++, !0;
  try {
    return await z_(
      new Promise((r) => {
        const n = document.createElement("link");
        n.rel = "stylesheet", n.href = wu, n.onload = () => {
          Na = !0, ur.cssLoadSuccess++, r(!0);
        }, n.onerror = () => {
          ur.cssLoadFailed++, r(!1);
        }, document.head.appendChild(n);
      }),
      qa.cssTimeout,
      "CSS load timeout"
    );
  } catch {
    return ur.cssLoadFailed++, !1;
  }
}
function Pu(e) {
  return e ? e.replace(/^[#/]+/, "").toLowerCase() : "";
}
const Sn = "sidebar-router-sync", Mr = "7.1.0-ES6", N = { initialized: !1, ctx: null, syncs: 0, reloads: 0, errors: 0, cleanups: [] }, mt = v({ moduleId: Sn });
function Vd() {
  mt.init();
}
function Cn(e) {
  return mt.get(e);
}
function j_(e) {
  return mt.inject(e);
}
function F_() {
  return mt.snapshot();
}
function qd() {
  const e = Cn("routerGlobal");
  if (e && e.getCurrentRoute)
    try {
      const t = e.getCurrentRoute();
      if (t && (t.hash || t.path)) return t.hash || t.path;
    } catch {
    }
  return typeof window < "u" && window.location && window.location.hash || "#/";
}
function pr(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: Sn, version: Mr, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
function ai(e) {
  return e.key || e.item_key || e.id;
}
function Ni(e, t) {
  const r = Pu(t);
  for (let n = 0; n < e.length; n++)
    if (Pu(e[n].route) === r) return e[n];
  return null;
}
function Yd(e) {
  const t = e.routerAdapter, r = e.registry, n = e.onSetActiveItem;
  try {
    const s = t && t.getCurrentRoute ? t.getCurrentRoute() : null, i = s && (s.path || s.hash) || qd(), o = r && r.getItems ? r.getItems() : [], a = Ni(o, i);
    if (a && n) {
      const u = ai(a);
      n(u), N.syncs++;
    }
    const l = Cn("eventBus");
    return l && l.emit && l.emit(f.ROUTER_SYNCED, {
      path: i,
      itemId: a ? ai(a) : null,
      itemKey: a && (a.key || a.item_key) || null,
      numericId: a ? a.id : null
    }), pr(!0, {
      synced: !0,
      path: i,
      itemId: a ? ai(a) : null,
      itemKey: a && (a.key || a.item_key) || null
    });
  } catch (s) {
    return N.errors++, pr(!1, null, [{ code: "SYNC_ERROR", message: s.message }]);
  }
}
function wl(e) {
  e.routerAdapter;
  const t = e.registry, r = e.onSetActiveItem, n = e.onReloadNavigation, s = e.eventBus;
  s && mt.inject({ eventBus: s }), Vd(), Yd(e);
  const i = Cn("eventBus");
  if (i && i.on) {
    const o = (u) => {
      N.syncs++;
      const d = t && t.getItems ? t.getItems() : [], h = u && u.path ? u.path : qd(), g = Ni(d, h);
      if (g && r) {
        const m = ai(g);
        r(m);
      }
    }, a = i.on(pe.NAVIGATED, o);
    N.cleanups.push(
      typeof a == "function" ? a : () => {
        i.off && i.off(pe.NAVIGATED, o);
      }
    );
    const l = i.on(pe.ROUTE_CHANGED, o);
    N.cleanups.push(
      typeof l == "function" ? l : () => {
        i.off && i.off(pe.ROUTE_CHANGED, o);
      }
    );
  }
  if (i && i.on && n) {
    const o = () => {
      N.reloads++, n();
    }, a = i.on(f.RELOAD_NAVIGATION, o);
    N.cleanups.push(
      typeof a == "function" ? a : () => {
        i.off && i.off(f.RELOAD_NAVIGATION, o);
      }
    );
  }
  return () => {
    Ri();
  };
}
function Nl(e, t) {
  const r = Cn("eventBus");
  r && r.emit && r.emit(f.NAVIGATION_RELOADED, { sectionsCount: e, itemsCount: t, timestamp: Date.now() });
}
function Kd(e) {
  if (N.initialized) return pr(!0, { alreadyInitialized: !0 });
  try {
    N.ctx = e, e && e.ports && mt.inject(e.ports), Vd(), N.initialized = !0;
    const t = Cn("eventBus");
    return t && t.emit && t.emit(f.ROUTER_SYNC_INITIALIZED, { version: Mr }), pr(!0, { initialized: !0, version: Mr });
  } catch (t) {
    return N.errors++, pr(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Ri() {
  for (let e = 0; e < N.cleanups.length; e++)
    try {
      N.cleanups[e]();
    } catch {
    }
  return N.cleanups = [], N.initialized = !1, N.ctx = null, pr(!0, { cleanedUp: !0 });
}
function Rl() {
  return Ri();
}
function Wd() {
  const e = {
    initialized: N.initialized,
    hasEventBus: !!Cn("eventBus"),
    portsInitialized: mt.isInitialized(),
    lowErrorRate: N.syncs === 0 || N.errors < N.syncs * 0.2,
    noOrphanListeners: !0
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return N.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: Sn,
    version: Mr,
    checks: e,
    metrics: { syncs: N.syncs, reloads: N.reloads, errors: N.errors, cleanups: N.cleanups.length },
    portsInitialized: mt.isInitialized(),
    p24Compliant: !0,
    timestamp: Date.now()
  };
}
function Xd() {
  return pr(!0, {
    moduleId: Sn,
    version: Mr,
    initialized: N.initialized,
    syncs: N.syncs,
    reloads: N.reloads,
    errors: N.errors,
    cleanups: N.cleanups.length,
    portsInitialized: mt.isInitialized(),
    p24Compliant: !0
  });
}
function Zd() {
  return { syncs: N.syncs, reloads: N.reloads, errors: N.errors, cleanups: N.cleanups.length };
}
const Jd = { singleton: !0, critical: !0, rendersUI: !1, category: "navigation", priority: "high" };
function G_(e) {
}
var V_ = { id: Sn, version: Mr, capabilities: Jd, init: Kd, cleanup: Ri, destroy: Rl, healthCheck: Wd, info: Xd, getMetrics: Zd, setupRouterSync: wl, emitReloaded: Nl };
const q_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Sn,
  VERSION: Mr,
  capabilities: Jd,
  cleanup: Ri,
  default: V_,
  destroy: Rl,
  emitReloaded: Nl,
  findItemByRoute: Ni,
  getMetrics: Zd,
  getPorts: F_,
  healthCheck: Wd,
  info: Xd,
  init: Kd,
  injectPorts: j_,
  setLogger: G_,
  setupRouterSync: wl,
  syncWithRouter: Yd
}, Symbol.toStringTag, { value: "Module" })), ue = "navigation-model-loader", xl = "2.3.0-FIX", se = {
  CACHE_KEY: "dshow_nav_model_v3",
  SESSION_KEY: "dshow_nav_session_v3",
  CACHE_TTL: 5 * 60 * 1e3,
  SESSION_TTL: 30 * 60 * 1e3,
  API_TIMEOUT: 8e3,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1e3
}, Hu = {
  NAVIGATION_MODEL: "/api/ui/navigation.php?action=manifest"
}, sr = {
  LOAD_START: `${ue}:load:start`,
  LOAD_SUCCESS: `${ue}:load:success`,
  LOAD_ERROR: `${ue}:load:error`,
  LOAD_FALLBACK: `${ue}:load:fallback`,
  CACHE_HIT: `${ue}:cache:hit`,
  CACHE_MISS: `${ue}:cache:miss`,
  CACHE_INVALIDATE: `${ue}:cache:invalidate`,
  MODEL_READY: `${ue}:model:ready`
}, De = {
  IDLE: "idle",
  LOADING: "loading",
  LOADED: "loaded",
  ERROR: "error",
  FALLBACK: "fallback"
}, ti = {
  NETWORK: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  PARSE: "PARSE_ERROR",
  AUTH: "AUTH_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
}, oe = {
  status: De.IDLE,
  model: null,
  lastLoad: null,
  lastError: null,
  source: null,
  loadCount: 0
}, Qd = () => ({ ...oe }), Y_ = () => oe.status, Or = () => oe.model, cr = (e) => {
  oe.status = e;
}, li = (e, t = "unknown") => {
  oe.model = e, oe.source = t, oe.lastLoad = Date.now(), oe.loadCount++;
}, K_ = (e) => {
  oe.lastError = {
    message: e == null ? void 0 : e.message,
    timestamp: Date.now()
  };
}, xi = () => {
  oe.status = De.IDLE, oe.model = null, oe.lastLoad = null, oe.lastError = null, oe.source = null;
}, eh = () => oe.status === De.LOADED, W_ = () => oe.status === De.LOADING, X_ = () => {
  var e;
  return ((e = window.DShow) == null ? void 0 : e.telemetry) || window.telemetry || null;
}, z = (e, t = {}) => {
  var s;
  const r = X_(), n = {
    module: ue,
    version: xl,
    event: `${ue}:${e}`,
    timestamp: Date.now(),
    ...t
  };
  if (r != null && r.track)
    try {
      r.track(n.event, n);
    } catch {
    }
  ((s = window.DShow) != null && s.debug || window.DEBUG_NAV_LOADER) && console.debug(`[${ue}]`, e, t);
}, Ra = (e, t, r = !0) => {
  z("load:complete", {
    source: e,
    duration: t,
    success: r
  });
}, th = (e) => {
  try {
    const t = window[e], r = "__storage_test__";
    return t.setItem(r, r), t.removeItem(r), !0;
  } catch {
    return !1;
  }
}, Pl = th("localStorage"), Hl = th("sessionStorage"), rh = (e, t) => !!t && e && e.owner === t, Z_ = (e = null) => {
  if (!Hl) return null;
  try {
    const t = sessionStorage.getItem(se.SESSION_KEY);
    if (!t) return null;
    const r = JSON.parse(t);
    return !(r != null && r.data) || !(r != null && r.timestamp) ? null : rh(r, e) ? Date.now() - r.timestamp > se.SESSION_TTL ? (sessionStorage.removeItem(se.SESSION_KEY), null) : r.data : (sessionStorage.removeItem(se.SESSION_KEY), z("cache:session:owner-mismatch"), null);
  } catch (t) {
    return z("cache:session:error", { error: t.message }), null;
  }
}, J_ = (e, t = null) => {
  if (!Hl || !e || !t) return !1;
  try {
    const r = {
      data: e,
      owner: t,
      timestamp: Date.now(),
      version: se.SESSION_KEY
    };
    return sessionStorage.setItem(se.SESSION_KEY, JSON.stringify(r)), !0;
  } catch (r) {
    return z("cache:session:save-error", { error: r.message }), !1;
  }
}, Q_ = (e = null) => {
  if (!Pl) return null;
  try {
    const t = localStorage.getItem(se.CACHE_KEY);
    if (!t) return null;
    const r = JSON.parse(t);
    return !(r != null && r.data) || !(r != null && r.timestamp) ? null : rh(r, e) ? Date.now() - r.timestamp > se.CACHE_TTL ? (localStorage.removeItem(se.CACHE_KEY), null) : r.data : (localStorage.removeItem(se.CACHE_KEY), z("cache:local:owner-mismatch"), null);
  } catch (t) {
    return z("cache:local:error", { error: t.message }), null;
  }
}, ey = (e, t = null) => {
  if (!Pl || !e || !t) return !1;
  try {
    const r = {
      data: e,
      owner: t,
      timestamp: Date.now(),
      version: se.CACHE_KEY
    };
    return localStorage.setItem(se.CACHE_KEY, JSON.stringify(r)), !0;
  } catch (r) {
    return z("cache:local:save-error", { error: r.message }), !1;
  }
}, zl = () => {
  try {
    return Hl && sessionStorage.removeItem(se.SESSION_KEY), Pl && localStorage.removeItem(se.CACHE_KEY), z("cache:invalidate:all"), !0;
  } catch {
    return !1;
  }
}, ty = (e = null) => {
  const t = Z_(e);
  if (t) return { data: t, source: "session" };
  const r = Q_(e);
  return r ? { data: r, source: "local" } : null;
}, nh = (e, t = null) => {
  J_(e, t), ey(e, t);
}, ry = (e) => new Promise((t) => setTimeout(t, e)), sh = async (e = {}) => {
  const {
    timeout: t = se.API_TIMEOUT,
    retries: r = se.RETRY_ATTEMPTS,
    signal: n = null
  } = e;
  let s = null, i = 0;
  for (; i <= r; ) {
    i++;
    const o = new AbortController(), a = setTimeout(() => o.abort(), t);
    try {
      z("api:attempt", { attempt: i, endpoint: Hu.NAVIGATION_MODEL });
      const l = await fetch(Hu.NAVIGATION_MODEL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "same-origin",
        signal: n || o.signal
      });
      if (clearTimeout(a), l.status === 401 || l.status === 403)
        return z("api:auth-required", { status: l.status }), {
          success: !1,
          error: ti.AUTH,
          status: l.status,
          authRequired: !0
        };
      if (!l.ok)
        throw new Error(`HTTP ${l.status}`);
      const u = await l.json();
      if (!u || typeof u != "object")
        throw new Error("Invalid response format");
      if (u.ok === !1)
        throw new Error(u.error || "API returned error");
      const d = u.data || u;
      return z("api:success", { attempt: i, hasItems: !!d.items, hasTree: !!d.tree }), {
        success: !0,
        data: d,
        // INTEGRADO-01 · item 8 (ROXO 27/11): a identidade do menu publicada pelo servidor (meta.menu: revisão/geração/checksum), quando existir
        meta: u && typeof u.meta == "object" ? u.meta : null,
        source: "api",
        attempt: i
      };
    } catch (l) {
      clearTimeout(a), s = l;
      const d = l.name === "AbortError" || l.message && l.message.includes("timeout");
      if (z("api:error", {
        attempt: i,
        error: l.message,
        isTimeout: d,
        willRetry: i <= r
      }), n && n.aborted)
        return {
          success: !1,
          error: ti.TIMEOUT,
          aborted: !0
        };
      i <= r && await ry(se.RETRY_DELAY * i);
    }
  }
  return {
    success: !1,
    error: s && s.message && s.message.includes("timeout") ? ti.TIMEOUT : ti.NETWORK,
    message: s ? s.message : "Unknown error",
    attempts: i
  };
}, zu = {
  version: "fallback-1.0",
  generated: null,
  sections: [
    {
      id: "main",
      label: "Principal",
      icon: "home",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "dashboard",
          path: "/dashboard",
          permission: null
        }
      ]
    },
    {
      id: "admin",
      label: "Administração",
      icon: "settings",
      items: [
        {
          id: "settings",
          label: "Configurações",
          icon: "settings",
          path: "/settings",
          permission: "admin"
        }
      ]
    }
  ],
  metadata: {
    isFallback: !0,
    reason: "api-unavailable"
  }
}, ny = (e = "unknown") => (z("fallback:used", { reason: e }), {
  ...zu,
  generated: Date.now(),
  metadata: {
    ...zu.metadata,
    reason: e,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
}), Ei = (e) => {
  var t;
  return ((t = e == null ? void 0 : e.metadata) == null ? void 0 : t.isFallback) === !0;
}, Bl = v({ moduleId: ue });
function sy() {
  Bl.init();
}
function iy(e) {
  return Bl.get(e);
}
function ih() {
  return Bl.snapshot();
}
const oh = () => (sy(), iy("eventBus")), ir = (e, t) => {
  t || (t = {});
  const r = oh();
  if (!r || !r.emit) return !1;
  try {
    return r.emit(e, Object.assign({
      source: ue,
      timestamp: Date.now()
    }, t)), !0;
  } catch {
    return !1;
  }
}, oy = (e, t) => {
  const r = oh();
  if (!r || !r.on) return () => {
  };
  try {
    return r.on(e, t), () => {
      r.off && r.off(e, t);
    };
  } catch {
    return () => {
    };
  }
}, ay = () => ir(sr.LOAD_START), Qa = (e, t) => ir(sr.LOAD_SUCCESS, { model: e, source: t }), ah = (e) => ir(sr.LOAD_ERROR, { error: e }), ly = (e) => ir(sr.LOAD_FALLBACK, { reason: e }), ci = (e) => ir(sr.MODEL_READY, { model: e }), cy = (e) => ir(sr.CACHE_HIT, { source: e }), uy = () => ir(sr.CACHE_MISS), dy = () => ir(sr.CACHE_INVALIDATE), el = (e) => !e || typeof e != "object" ? !1 : !!(Array.isArray(e.items) && e.items.length > 0 || Array.isArray(e.tree) && e.tree.length > 0 || Array.isArray(e.sections) && e.sections.length > 0), hy = (e) => {
  if (!e) return [];
  if (Array.isArray(e.sections) && e.sections.length > 0)
    return e.sections;
  if (Array.isArray(e.items) && e.items.length > 0)
    return fy(e.items);
  if (Array.isArray(e.tree) && e.tree.length > 0) {
    const t = gy(e.tree);
    if (t.length > 0) return t;
  }
  return [];
};
function fy(e) {
  const t = {};
  return e.forEach((r) => {
    r.item_type === "group" && r.is_active === 1 && r.is_visible === 1 && (t[r.item_key] = {
      id: r.item_key || `sec-${r.id}`,
      label: r.label || r.item_key || "Section",
      icon: r.icon || "folder",
      order: r.order_index || 0,
      accordion: {
        default_open: r.is_expanded === 1,
        collapsible: !0
      },
      visible: !0,
      items: []
    });
  }), e.forEach((r) => {
    r.item_type === "navigation" && r.parent_key && t[r.parent_key] && r.is_active === 1 && r.is_visible === 1 && t[r.parent_key].items.push({
      id: r.item_key || `item-${r.id}`,
      label: r.label || r.item_key || "Item",
      displayTitle: r.display_title || null,
      icon: r.icon || "file",
      order: r.order_index || 0,
      route: r.route_path || null,
      panelId: r.panel_id || null,
      navigation: {
        mode: r.intent_id ? "action" : "route",
        action: r.intent_id ? `panel:${r.intent_id}` : null
      },
      state: {
        disabled: r.is_disabled === 1
      },
      badge: r.badge_key || null
    });
  }), Object.values(t).forEach((r) => {
    r.items.sort((n, s) => n.order - s.order);
  }), Object.values(t).filter((r) => r.items.length > 0).sort((r, n) => r.order - n.order);
}
function gy(e) {
  return e.filter((t) => t.item_type === "group" && t.is_active === 1 && t.is_visible === 1).filter((t) => t.children && t.children.length > 0).map((t) => ({
    id: t.item_key || t.id,
    label: t.label || t.item_key || "Section",
    icon: t.icon || "folder",
    order: t.order_index || 0,
    accordion: {
      default_open: t.is_expanded === 1,
      collapsible: !0
    },
    visible: !0,
    items: (t.children || []).filter((r) => r.item_type === "navigation" && r.is_active === 1 && r.is_visible === 1).map((r) => ({
      id: r.item_key || r.id,
      label: r.label || r.item_key || "Item",
      displayTitle: r.display_title || null,
      icon: r.icon || "file",
      order: r.order_index || 0,
      route: r.route_path || null,
      panelId: r.panel_id || null,
      navigation: {
        mode: r.intent_id ? "action" : "route",
        action: r.intent_id ? `panel:${r.intent_id}` : null
      },
      state: {
        disabled: r.is_disabled === 1
      },
      badge: r.badge_key || null
    })).sort((r, n) => r.order - n.order)
  })).filter((t) => t.items.length > 0).sort((t, r) => t.order - r.order);
}
const tl = (e) => {
  if (!e) return null;
  const t = hy(e);
  return {
    version: e.version || "api",
    generated: e.generated || Date.now(),
    source: e.source || "api",
    sections: t,
    metadata: e.metadata || {}
  };
};
let ut = null, sn = 0;
const bi = () => {
  var e, t, r;
  try {
    const n = (e = ih()) == null ? void 0 : e.auth, s = ((t = n == null ? void 0 : n.getUser) == null ? void 0 : t.call(n)) ?? ((r = n == null ? void 0 : n.getCurrentUser) == null ? void 0 : r.call(n)) ?? null, i = (s == null ? void 0 : s.id) ?? (s == null ? void 0 : s.user_id) ?? (s == null ? void 0 : s.userId) ?? null;
    return i != null && String(i) !== "" ? String(i) : null;
  } catch {
    return null;
  }
};
let Bu = !1;
const my = async () => {
  try {
    const e = globalThis.caches;
    if (!e || !e.keys) return 0;
    let t = 0;
    for (const r of await e.keys()) {
      const n = await e.open(r);
      for (const s of await n.keys())
        try {
          new URL(s.url).pathname.startsWith("/api/") && (await n.delete(s), t++);
        } catch {
        }
    }
    return z("cache:sw-api-clear", { n: t }), t;
  } catch {
    return 0;
  }
}, Ul = () => {
  sn++;
  try {
    ut && ut.abort();
  } catch {
  }
  ut = null, zl(), my(), xi(), on(null, "sessao-encerrada"), z("cache:auth-clear");
}, py = ["auth.logout", "auth.logout.success", "auth.logout.completed", "auth.logout.detected", "auth:logout", "header.logout.requested", "auth.login.success"], Ey = () => {
  var e, t;
  if (!Bu)
    try {
      if (!((t = (e = ih()) == null ? void 0 : e.eventBus) != null && t.on)) return;
      for (const r of py) oy(r, Ul);
      Bu = !0;
    } catch {
    }
}, lh = (e) => {
  const t = e && typeof e == "object" ? e.menu ?? null : null;
  if (!t || t.generation === void 0 || t.generation === null) return null;
  const r = Number(t.generation);
  return Number.isFinite(r) ? { revision: String(t.revision ?? ""), generation: r, checksum: String(t.checksum ?? "") } : null;
}, rl = (e) => e && e.metadata && e.metadata.menuConsumido || null, on = (e, t) => {
  try {
    const r = globalThis;
    r.__dshowMenuConsumido = e ? { ...e, source: t, at: Date.now() } : { revision: null, generation: null, checksum: null, source: t, at: Date.now() };
    const n = typeof document < "u" ? document.documentElement : null;
    if (!n) return;
    e ? (n.setAttribute("data-menu-revision", e.revision), n.setAttribute("data-menu-generation", String(e.generation)), n.setAttribute("data-menu-checksum", e.checksum)) : (n.removeAttribute("data-menu-revision"), n.removeAttribute("data-menu-generation"), n.removeAttribute("data-menu-checksum")), n.setAttribute("data-menu-source", t);
  } catch {
  }
}, ch = async (e = {}) => {
  const { force: t = !1, skipCache: r = !1 } = e, n = Date.now();
  if (W_())
    return z("load:already-loading"), { success: !1, reason: "already-loading" };
  if (!t && eh()) {
    const l = Or();
    if (l && !Ei(l))
      return z("load:already-loaded"), { success: !0, model: l, source: "memory" };
  }
  cr(De.LOADING), ay(), Ey();
  const s = bi();
  if (!r && !t) {
    const l = ty(s);
    if (l && el(l.data)) {
      const u = tl(l.data);
      return u && l.data && l.data.metadata && l.data.metadata.menuConsumido && (u.metadata = { ...u.metadata || {}, menuConsumido: l.data.metadata.menuConsumido }), li(u, l.source), on(rl(u), String(l.source || "cache")), cr(De.LOADED), cy(l.source), Qa(u, l.source), ci(u), Ra(l.source, Date.now() - n), yy(s), { success: !0, model: u, source: l.source };
    }
    uy();
  }
  const i = ++sn;
  ut = new AbortController();
  const o = await sh({ signal: ut.signal });
  if (i !== sn)
    return z("load:superseded", { meuPedido: i, atual: sn }), { success: !1, reason: "superseded" };
  if (bi() !== s)
    return xi(), z("load:owner-changed", { inicio: s }), { success: !1, reason: "owner-changed" };
  if (ut = null, o.success && el(o.data)) {
    const l = lh(o.meta), u = Or(), d = rl(u);
    if (l && d && l.generation < d.generation && u && !Ei(u))
      return cr(De.LOADED), z("load:stale-rejected", { recebida: l.generation, consumida: d.generation }), on(d, "api-stale-rejected"), { success: !0, model: u, source: "memory", staleRejected: !0, rejected: l };
    const h = tl(o.data);
    return h && (h.metadata = { ...h.metadata || {}, menuConsumido: l, dono: s }), li(h, "api"), on(l, "api"), cr(De.LOADED), nh(h, s), Qa(h, "api"), ci(h), Ra("api", Date.now() - n), { success: !0, model: h, source: "api" };
  }
  if (o.authRequired)
    return cr(De.ERROR), K_({ message: "Auth required" }), ah({ type: "auth", status: o.status }), z("load:auth-required"), { success: !1, authRequired: !0, status: o.status };
  z("load:using-fallback", { reason: o.error });
  const a = ny(o.error || "api-error");
  return li(a, "fallback"), cr(De.FALLBACK), ly(o.error), ci(a), Ra("fallback", Date.now() - n, !1), { success: !0, model: a, source: "fallback", degraded: !0 };
}, uh = (e) => {
  const t = Or();
  if (!t) return;
  const r = bi(), n = t && t.metadata ? t.metadata.dono ?? null : null;
  (!r || r !== n) && (Ul(), z("cache:owner-check-clear", { motivo: e, trocou: !!r }), dh());
}, by = (e) => {
  e && e.persisted && uh("bfcache");
}, _y = () => {
  try {
    typeof document < "u" && document.visibilityState === "visible" && uh("visivel");
  } catch {
  }
};
try {
  typeof window < "u" && window.addEventListener && window.addEventListener("pageshow", by), typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", _y), typeof document < "u" && document.addEventListener && document.addEventListener("click", (e) => {
    try {
      const t = e && e.target;
      t && t.closest && t.closest('[data-action="logout"], [data-intent$=".logout"], .logout[data-action]') && (Ul(), z("cache:logout-click-clear"));
    } catch {
    }
  }, !0);
} catch {
}
const yy = async (e) => {
  const t = ++sn;
  let r;
  try {
    r = await sh({});
  } catch {
    return;
  }
  if (t !== sn) return;
  if (bi() !== e) {
    z("revalidate:owner-changed", { inicio: e });
    return;
  }
  if (r && r.authRequired) {
    zl(), xi(), on(null, "auth-required"), ah({ type: "auth", status: r.status }), z("revalidate:auth-cleared", { status: r.status });
    return;
  }
  if (!r || !r.success || !el(r.data)) return;
  const n = lh(r.meta), s = Or(), i = rl(s);
  if (i && n && n.generation < i.generation) {
    z("revalidate:older-rejected", { nova: n.generation, vigente: i.generation });
    return;
  }
  const o = tl(r.data);
  o && (o.metadata = { ...o.metadata || {}, menuConsumido: n, dono: e }, li(o, "api"), cr(De.LOADED), nh(o, e), on(n, "api-revalidate"), Qa(o, "api"), ci(o), z("revalidate:updated", { de: i && i.generation, para: n && n.generation }));
}, dh = async (e) => (zl(), dy(), xi(), ch({ force: !0, skipCache: !0 })), vy = () => {
  ut && (ut.abort(), ut = null, z("load:aborted"));
}, Iy = () => Or(), Sy = () => Y_(), Cy = () => eh(), Ay = () => ({
  moduleId: ue,
  version: xl,
  state: Qd(),
  hasModel: !!Or(),
  isFallback: Ei(Or())
}), My = () => {
  const e = Qd();
  return {
    healthy: e.status === De.LOADED && !!e.model,
    status: e.status,
    lastLoad: e.lastLoad,
    source: e.source,
    isFallback: Ei(e.model)
  };
};
var k = {
  load: ch,
  reload: dh,
  abort: vy,
  getModel: Iy,
  getStatus: Sy,
  isReady: Cy,
  info: Ay,
  healthCheck: My,
  MODULE_ID: ue,
  VERSION: xl
};
async function Oy(e) {
  var u, d, h;
  const { engine: t, renderer: r, registry: n, adapters: s, logger: i, metrics: o, modelLoaderInitialized: a, getCurrentHash: l } = e;
  try {
    if (i.info("Reloading navigation..."), a)
      try {
        const x = await k.reload(!0);
        o && o.modelLoaderCalls++, i.info("P24: NavigationModel reloaded", { source: x.source, success: x.success });
      } catch (x) {
        i.warn("P24: NavigationModel reload failed", { error: x.message });
      }
    (u = n.invalidateCache) == null || u.call(n);
    const g = await n.loadFromAPI();
    if (!g.success)
      return i.warn("Failed to reload navigation:", g.error), { success: !1, error: g.error };
    n.applyPermissionFilter(), t.loadSections(n.getSections()), t.loadItems(n.getItems()), r.renderNavigation();
    const m = (h = (d = s.router) == null ? void 0 : d.getCurrentRoute) == null ? void 0 : h.call(d), y = (m == null ? void 0 : m.path) || (m == null ? void 0 : m.hash) || l(), S = Ni(n.getItems(), y);
    return S && (t.setActiveItem(S.id), r.setActiveItem(S.id)), i.info("Navigation reloaded successfully"), Nl(n.getSections().length, n.getItems().length), { success: !0, sections: n.getSections().length, items: n.getItems().length };
  } catch (g) {
    return i.error("Reload navigation error:", g), { success: !1, error: g.message };
  }
}
const ri = "5.7.0-DUAL-LOOKUP", Uu = "sidebar-engine";
class Ty {
  constructor(t = {}) {
    this._options = t, this._stateMachine = new i_({
      collapsed: t.defaultCollapsed ?? !1,
      accordion: t.accordion ?? {}
    }), this._items = [], this._sections = [], this._badges = /* @__PURE__ */ new Map(), this._eventHandlers = /* @__PURE__ */ new Map(), this._ports = null, this._metrics = {
      inits: 0,
      mounts: 0,
      readys: 0,
      destroys: 0,
      toggles: 0,
      collapses: 0,
      expands: 0,
      sectionToggles: 0,
      navigations: 0,
      badgeUpdates: 0,
      eventsEmitted: 0,
      keyLookups: 0
    };
  }
  setPorts(t) {
    this._ports = t;
  }
  // LIFECYCLE
  async init() {
    this._metrics.inits++;
    const t = this._stateMachine.transitionTo(L.INITIALIZING);
    return t.success ? (this._emit(f.INITIALIZED, { version: ri }), { success: !0, state: this._stateMachine.lifecycle }) : t;
  }
  async mount() {
    this._metrics.mounts++;
    const t = this._stateMachine.transitionTo(L.MOUNTING);
    return t.success ? (this._emit(f.TOGGLE, { action: "mounting" }), { success: !0, state: this._stateMachine.lifecycle }) : t;
  }
  async ready() {
    this._metrics.readys++, this._stateMachine.lifecycle === L.MOUNTING && this._stateMachine.transitionTo(L.MOUNTED);
    const t = this._stateMachine.transitionTo(L.READY);
    return t.success ? (this._autoExpandNonCollapsibleSections(), this._emit(f.READY, { version: ri }), { success: !0, state: this._stateMachine.lifecycle }) : t;
  }
  async destroy() {
    this._metrics.destroys++;
    const t = this._stateMachine.transitionTo(L.DESTROYING);
    return t.success ? (this._emit(f.TOGGLE, { action: "destroying" }), this._items = [], this._sections = [], this._badges.clear(), this._eventHandlers.clear(), this._stateMachine.transitionTo(L.DESTROYED), this._emit(f.DESTROYED, {}), { success: !0 }) : t;
  }
  // REGISTRY DATA LOADING
  loadItems(t) {
    return Array.isArray(t) ? (this._items = t, this._emit(f.ITEMS_LOADED, { itemsCount: t.length }), { success: !0, count: t.length }) : { success: !1, error: "Items must be array" };
  }
  loadSections(t) {
    return Array.isArray(t) ? (this._sections = t, this._autoExpandNonCollapsibleSections(), { success: !0, count: t.length }) : { success: !1, error: "Sections must be array" };
  }
  _autoExpandNonCollapsibleSections() {
    const t = this._sections.filter((r) => r.collapsible === !1).map((r) => r.id);
    t.length > 0 && this._stateMachine.expandAllSections(t);
  }
  getItems() {
    return [...this._items];
  }
  getSections() {
    return [...this._sections];
  }
  // v5.7.0: Dual-lookup — resolves both numeric id and item_key string
  // DOM uses item_key ("sidebar.financeiro") as data-item-id, router-sync passes item_key
  getItemById(t) {
    const r = this._items.find((n) => n.id === t);
    return r || (typeof t == "string" ? (this._metrics.keyLookups++, this._items.find((n) => n.key === t || n.item_key === t) || null) : null);
  }
  getSectionById(t) {
    return this._sections.find((r) => r.id === t) || null;
  }
  getItemsBySection(t) {
    return this._items.filter((r) => r.sectionId === t);
  }
  // ACCORDION / SECTION COLLAPSE
  isSectionExpanded(t) {
    const r = this.getSectionById(t);
    return r && r.collapsible === !1 ? !0 : this._stateMachine.isSectionExpanded(t);
  }
  toggleSection(t) {
    const r = this.getSectionById(t);
    if (!r) return { success: !1, error: "Section not found" };
    if (r.collapsible === !1) return { success: !1, error: "Section is not collapsible" };
    this._metrics.sectionToggles++;
    const n = this._stateMachine.toggleSection(t);
    if (n.changed) {
      const s = n.expanded ? f.SUBMENU_TOGGLED : f.SUBMENU_TOGGLED;
      this._emit(s, { sectionId: t, section: r, expanded: n.expanded });
    }
    return n;
  }
  expandSection(t) {
    const r = this.getSectionById(t);
    if (!r) return { success: !1, error: "Section not found" };
    const n = this._stateMachine.expandSection(t);
    return n.changed && this._emit(f.SUBMENU_TOGGLED, { sectionId: t, section: r, expanded: !0 }), n;
  }
  collapseSection(t) {
    const r = this.getSectionById(t);
    if (!r) return { success: !1, error: "Section not found" };
    if (r.collapsible === !1) return { success: !1, error: "Section is not collapsible" };
    const n = this._stateMachine.collapseSection(t);
    return n.changed && this._emit(f.SUBMENU_TOGGLED, { sectionId: t, section: r, expanded: !1 }), n;
  }
  expandAllSections() {
    const t = this._sections.filter((r) => r.collapsible !== !1).map((r) => r.id);
    return this._stateMachine.expandAllSections(t);
  }
  collapseAllSections() {
    return this._stateMachine.collapseAllSections();
  }
  getExpandedSections() {
    return this._stateMachine.expandedSectionsArray;
  }
  setAccordionMode(t) {
    return this._stateMachine.setAccordionMode(t);
  }
  // BADGE MANAGEMENT
  setBadge(t, r) {
    return this._metrics.badgeUpdates++, this._badges.set(t, r), this._emit(f.BADGE_UPDATED, { type: "badge", itemId: t, badge: r }), { success: !0 };
  }
  getBadge(t) {
    return this._badges.get(t) || null;
  }
  removeBadge(t) {
    return this._badges.delete(t), { success: !0 };
  }
  // STATE PROXIES
  get collapsed() {
    return this._stateMachine.collapsed;
  }
  get expanded() {
    return this._stateMachine.expanded;
  }
  get mobileOpen() {
    return this._stateMachine.mobileOpen;
  }
  get isMobile() {
    return this._stateMachine.isMobile;
  }
  get activeItemId() {
    return this._stateMachine.activeItemId;
  }
  get lifecycle() {
    return this._stateMachine.lifecycle;
  }
  get expandedSections() {
    return this._stateMachine.expandedSections;
  }
  // SIDEBAR COLLAPSE/EXPAND (Global)
  toggle() {
    this._metrics.toggles++;
    const t = this._stateMachine.toggle();
    return t.changed && this._emit(f.TOGGLE, { collapsed: this._stateMachine.collapsed }), t;
  }
  collapse() {
    this._metrics.collapses++;
    const t = this._stateMachine.collapse();
    return t.changed && this._emit(f.TOGGLE, { collapsed: !0 }), t;
  }
  expand() {
    this._metrics.expands++;
    const t = this._stateMachine.expand();
    return t.changed && this._emit(f.TOGGLE, { collapsed: !1 }), t;
  }
  // MOBILE STATE
  setMobile(t) {
    return this._stateMachine.setMobile(t);
  }
  openMobile() {
    const t = this._stateMachine.openMobile();
    return t.changed && this._emit(f.MOBILE_OPENED, {}), t;
  }
  closeMobile() {
    const t = this._stateMachine.closeMobile();
    return t.changed && this._emit(f.MOBILE_CLOSED, {}), t;
  }
  toggleMobile() {
    const t = this._stateMachine.toggleMobile();
    if (t.changed) {
      const r = this._stateMachine.mobileOpen ? f.MOBILE_OPENED : f.MOBILE_CLOSED;
      this._emit(r, {});
    }
    return t;
  }
  // NAVIGATION
  setActiveItem(t) {
    const r = this._stateMachine.setActiveItem(t);
    if (r.changed) {
      const n = this.getItemById(t);
      n != null && n.sectionId && this.expandSection(n.sectionId), this._emit(f.ITEM_CLICK, { itemId: t, item: n });
    }
    return r;
  }
  navigate(t) {
    this._metrics.navigations++;
    const r = this.getItemById(t);
    return r ? (this._emit(f.NAVIGATE, { itemId: t, item: r }), this._emit(f.ITEM_CLICK, { itemId: t, item: r }), this._stateMachine.mobileOpen && this.closeMobile(), { success: !0, item: r }) : { success: !1, error: "Item not found" };
  }
  // EVENTS
  on(t, r) {
    return this._eventHandlers.has(t) || this._eventHandlers.set(t, /* @__PURE__ */ new Set()), this._eventHandlers.get(t).add(r), () => {
      var n;
      return (n = this._eventHandlers.get(t)) == null ? void 0 : n.delete(r);
    };
  }
  off(t, r) {
    var n;
    r ? (n = this._eventHandlers.get(t)) == null || n.delete(r) : this._eventHandlers.delete(t);
  }
  _emit(t, r) {
    var s, i;
    this._metrics.eventsEmitted++;
    const n = this._eventHandlers.get(t);
    n && n.forEach((o) => {
      try {
        o({ event: t, data: r, timestamp: Date.now() });
      } catch {
      }
    }), (i = (s = this._ports) == null ? void 0 : s.events) != null && i.emit && this._ports.events.emit(t, r);
  }
  // STATE SUBSCRIPTION
  subscribe(t) {
    return this._stateMachine.subscribe(t);
  }
  // HEALTH, INFO & METRICS
  getState() {
    return {
      ...this._stateMachine.getState(),
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      collapsibleSectionsCount: this._sections.filter((t) => t.collapsible !== !1).length
    };
  }
  getMetrics() {
    var t, r;
    return {
      ...this._metrics,
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      expandedSectionsCount: this._stateMachine.expandedSections.size,
      handlersCount: this._eventHandlers.size,
      stateMachineMetrics: ((r = (t = this._stateMachine).getMetrics) == null ? void 0 : r.call(t)) || null
    };
  }
  healthCheck() {
    var i, o;
    const t = this._stateMachine.healthCheck(), r = {
      stateMachineHealthy: t.status === "HEALTHY",
      lifecycleValid: ((i = t.checks) == null ? void 0 : i.lifecycleValid) ?? !1,
      itemsLoaded: this._items.length > 0,
      sectionsLoaded: this._sections.length > 0,
      portsConnected: this._ports !== null,
      accordionStateValid: ((o = t.checks) == null ? void 0 : o.accordionStateValid) ?? !1
    }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length;
    return {
      status: n === s ? "HEALTHY" : n >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: n,
      maxScore: s,
      scoreDisplay: `${n}/${s}`,
      checks: r,
      lifecycle: this._stateMachine.lifecycle,
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      expandedSectionsCount: this._stateMachine.expandedSections.size,
      portsConnected: this._ports !== null,
      stateMachineHealth: t,
      version: ri,
      moduleId: Uu,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    };
  }
  info() {
    return { version: ri, moduleId: Uu, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
}
function Dy(e) {
  return new Ty(e);
}
const hh = "5.8.0-ES6", jl = "sidebar-logger", Ly = "[sidebar]", es = v({ moduleId: jl });
function $y() {
  es.init();
}
function ky(e) {
  return es.get(e);
}
function xe(e = {}) {
  this._debug = e.debug !== void 0 ? e.debug : !1, this._prefix = e.prefix || Ly, this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 }, $y();
}
xe.prototype._getLogger = () => ky("logger");
xe.prototype.setDebug = function(e) {
  this._debug = e;
};
xe.prototype.debug = function(...e) {
  if (!this._debug) return;
  const t = this._getLogger();
  t && t.debug && t.debug(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.debug++, this._metrics.total++;
};
xe.prototype.info = function(...e) {
  const t = this._getLogger();
  t && t.info && t.info(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.info++, this._metrics.total++;
};
xe.prototype.warn = function(...e) {
  const t = this._getLogger();
  t && t.warn && t.warn(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.warn++, this._metrics.total++;
};
xe.prototype.error = function(...e) {
  const t = this._getLogger();
  t && t.error && t.error(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.error++, this._metrics.total++;
};
xe.prototype.log = function(...e) {
  const t = this._getLogger();
  t && t.info && t.info(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.total++;
};
xe.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
xe.prototype.reset = function() {
  this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 };
};
xe.prototype.healthCheck = function() {
  const t = { hasLogger: !!this._getLogger(), debugModeSet: typeof this._debug == "boolean", prefixSet: !!this._prefix, metricsTracking: this._metrics.total >= 0, portsInitialized: es.isInitialized() };
  let r = 0;
  for (const s in t)
    t[s] && r++;
  const n = Object.keys(t).length;
  return { status: r >= 4 ? "HEALTHY" : "DEGRADED", score: r, maxScore: n, scoreDisplay: `${r}/${n}`, checks: t, debugEnabled: this._debug, metrics: this._metrics, version: hh, moduleId: jl, portsInitialized: es.isInitialized(), timestamp: Date.now() };
};
xe.prototype.getInfo = function() {
  return { moduleId: jl, version: hh, debugEnabled: this._debug, prefix: this._prefix, portsInitialized: es.isInitialized(), metrics: this.getMetrics() };
};
function wy(e) {
  return new xe(e);
}
const ju = "5.6.2-P22", ui = "sidebar.telemetry.tracker", _i = v({ moduleId: ui });
function Ny() {
  _i.init();
}
function Fu(e) {
  return _i.get(e);
}
class Ry {
  constructor(t = {}) {
    this._enabled = t.enabled ?? !0, this._prefix = t.prefix ?? "sidebar:", this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }
  _getTelemetry() {
    return Fu("telemetryCore") || Fu("telemetry");
  }
  track(t, r = {}) {
    if (!this._enabled) return;
    Ny();
    const n = this._getTelemetry(), s = t.startsWith(this._prefix) ? t : `${this._prefix}${t}`, i = { source: ui, timestamp: Date.now(), ...r };
    n != null && n.track && n.track(s, i), this._metrics.tracks++, this._metrics.lastTrack = { event: s, timestamp: Date.now() };
  }
  trackNavigation(t, r) {
    this.track("navigate", { itemId: t, route: r }), this._metrics.navigations++;
  }
  trackToggle(t) {
    this.track("toggle", { collapsed: t }), this._metrics.toggles++;
  }
  trackSectionToggle(t, r) {
    this.track("section:toggle", { sectionId: t, expanded: r }), this._metrics.sectionToggles++;
  }
  trackSearch(t, r) {
    this.track("search", { query: t, resultsCount: r }), this._metrics.searches++;
  }
  trackError(t, r = {}) {
    this.track("error", { error: (t == null ? void 0 : t.message) || t, ...r }), this._metrics.errors++;
  }
  // @ts-expect-error strict migration — TS2322
  trackKeyboardNav(t, r = null) {
    this.track("keyboard:nav", { action: t, itemId: r });
  }
  setEnabled(t) {
    this._enabled = !!t;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  reset() {
    this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }
  healthCheck() {
    const t = !!this._getTelemetry(), r = { enabled: this._enabled, hasTelemetry: t, noErrors: this._metrics.errors === 0, trackingWorks: this._metrics.tracks >= 0, portsInitialized: _i.isInitialized() }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length;
    return { status: n >= 4 ? "HEALTHY" : "DEGRADED", score: n, maxScore: s, scoreDisplay: `${n}/${s}`, checks: r, metrics: this._metrics, version: ju, moduleId: ui, timestamp: Date.now() };
  }
  getInfo() {
    return { moduleId: ui, version: ju, enabled: this._enabled, prefix: this._prefix, portsInitialized: _i.isInitialized(), metrics: this.getMetrics() };
  }
}
function xy(e) {
  return new Ry(e);
}
const Py = "sidebar-api-ports", Hy = v({ moduleId: Py });
function At(e) {
  return Hy.get(e);
}
const Er = {
  toggleAttempts: 0,
  toggleSuccess: 0,
  toggleBlocked: 0,
  syncFailures: 0,
  fallbackUsed: 0,
  atomicTransitions: 0,
  lastToggleAt: null
};
function hr(e) {
  e in Er && typeof Er[e] == "number" && Er[e]++;
}
function zy(e, t) {
  e in Er && (Er[e] = t);
}
function By(e) {
  return Er[e];
}
function fh() {
  return { ...Er };
}
let an = null;
const Uy = 150;
function ni(e, t) {
  var l, u, d, h;
  const { engine: r, renderer: n, logger: s } = t, i = performance.now(), o = e, a = {
    engine: !1,
    renderer: !1,
    sidebarDOM: !1,
    toggleButton: !1,
    body: !1,
    localStorage: !1
  };
  try {
    o ? r.collapse() : r.expand(), a.engine = !0, n.setCollapsed(o), a.renderer = !0;
    const g = ((l = n.getSidebar) == null ? void 0 : l.call(n)) || document.querySelector(`.${c.ROOT}`);
    if (g) {
      g.classList.toggle(c.MOD_COLLAPSED, o), a.sidebarDOM = !0;
      const x = g.querySelector(`.${c.TOGGLE}`);
      x && (x.setAttribute("aria-expanded", String(!o)), x.setAttribute("aria-label", o ? "Expandir menu" : "Recolher menu"), a.toggleButton = !0);
    }
    const m = At("layoutManager"), y = At("eventBus");
    m != null && m.setSidebarCollapsed ? (m.setSidebarCollapsed(o), a.body = !0) : y != null && y.emit ? (y.emit(oi.REQUEST_LAYOUT, {
      mode: o ? "sidebar-collapsed" : "sidebar-expanded",
      source: "sidebar-toggle"
    }), a.body = !0) : (document.body.classList.toggle("sidebar-collapsed", o), a.body = !0, hr("fallbackUsed"));
    try {
      localStorage.setItem("dshowdash-layout-sidebarCollapsed", JSON.stringify(o)), localStorage.setItem("dsd-sidebar-collapsed", JSON.stringify(o)), a.localStorage = !0;
    } catch (x) {
      (u = s == null ? void 0 : s.warn) == null || u.call(s, "Failed to persist collapsed state:", x.message);
    }
    hr("atomicTransitions");
    const S = performance.now() - i;
    return (d = s == null ? void 0 : s.debug) == null || d.call(s, "P24 Atomic transition complete", {
      targetState: o,
      results: a,
      durationMs: S.toFixed(2)
    }), {
      success: !0,
      collapsed: o,
      results: a,
      durationMs: S
    };
  } catch (g) {
    return (h = s == null ? void 0 : s.error) == null || h.call(s, "P24 Atomic transition failed:", g), hr("syncFailures"), {
      success: !1,
      error: g.message,
      results: a
    };
  }
}
function jy(e) {
  const { engine: t, renderer: r, tracker: n, logger: s } = e;
  return {
    toggle() {
      var i, o, a, l, u;
      if (hr("toggleAttempts"), an) {
        hr("toggleBlocked"), (i = s == null ? void 0 : s.debug) == null || i.call(s, "Toggle blocked by debounce");
        return;
      }
      an = setTimeout(() => {
        an = null;
      }, Uy);
      try {
        const h = !t.collapsed, g = ni(h, { engine: t, renderer: r, logger: s });
        g.success ? (hr("toggleSuccess"), zy("lastToggleAt", Date.now()), (o = n == null ? void 0 : n.trackToggle) == null || o.call(n, h), (a = s == null ? void 0 : s.info) == null || a.call(s, "P24 Toggle complete (atomic)", {
          collapsed: h,
          atomicTransitions: By("atomicTransitions")
        })) : (l = s == null ? void 0 : s.error) == null || l.call(s, "P24 Toggle atomic failed", { error: g.error });
      } catch (d) {
        (u = s == null ? void 0 : s.error) == null || u.call(s, "Toggle error:", d), hr("syncFailures");
      }
    },
    collapse() {
      var i, o;
      try {
        const a = ni(!0, { engine: t, renderer: r, logger: s });
        a.success || (i = s == null ? void 0 : s.error) == null || i.call(s, "Collapse atomic failed:", a.error);
      } catch (a) {
        (o = s == null ? void 0 : s.error) == null || o.call(s, "Collapse error:", a);
      }
    },
    expand() {
      var i, o;
      try {
        const a = ni(!1, { engine: t, renderer: r, logger: s });
        a.success || (i = s == null ? void 0 : s.error) == null || i.call(s, "Expand atomic failed:", a.error);
      } catch (a) {
        (o = s == null ? void 0 : s.error) == null || o.call(s, "Expand error:", a);
      }
    },
    forceSync() {
      var i;
      try {
        const o = t.collapsed, a = ni(o, { engine: t, renderer: r, logger: s });
        return { success: a.success, collapsed: o, atomicResult: a };
      } catch (o) {
        return (i = s == null ? void 0 : s.error) == null || i.call(s, "Force sync error:", o), { success: !1, error: o.message };
      }
    },
    getToggleMetrics() {
      return fh();
    }
  };
}
function Fy() {
  an && (clearTimeout(an), an = null);
}
function Gy(e) {
  const { engine: t, renderer: r, logger: n } = e;
  return {
    toggleSection(s) {
      var i;
      try {
        const o = t.toggleSection(s);
        return o.success && o.changed && r.toggleSectionUI(s), o;
      } catch (o) {
        return (i = n == null ? void 0 : n.error) == null || i.call(n, "toggleSection error:", o), { success: !1, error: o.message };
      }
    },
    expandSection(s) {
      var i;
      try {
        const o = t.expandSection(s);
        return o.success && o.changed && r.expandSectionUI(s), o;
      } catch (o) {
        return (i = n == null ? void 0 : n.error) == null || i.call(n, "expandSection error:", o), { success: !1, error: o.message };
      }
    },
    collapseSection(s) {
      var i;
      try {
        const o = t.collapseSection(s);
        return o.success && o.changed && r.collapseSectionUI(s), o;
      } catch (o) {
        return (i = n == null ? void 0 : n.error) == null || i.call(n, "collapseSection error:", o), { success: !1, error: o.message };
      }
    },
    expandAllSections() {
      var s;
      try {
        const i = t.expandAllSections(), o = t.getExpandedSections();
        return r.syncExpandedSections(o), i;
      } catch (i) {
        return (s = n == null ? void 0 : n.error) == null || s.call(n, "expandAllSections error:", i), { success: !1, error: i.message };
      }
    },
    collapseAllSections() {
      var s;
      try {
        const i = t.collapseAllSections();
        return r.syncExpandedSections([]), i;
      } catch (i) {
        return (s = n == null ? void 0 : n.error) == null || s.call(n, "collapseAllSections error:", i), { success: !1, error: i.message };
      }
    },
    isSectionExpanded(s) {
      return (t == null ? void 0 : t.isSectionExpanded(s)) ?? !1;
    },
    getExpandedSections() {
      return (t == null ? void 0 : t.getExpandedSections()) ?? [];
    },
    setAccordionMode(s) {
      var i;
      try {
        return t.setAccordionMode(s);
      } catch (o) {
        return (i = n == null ? void 0 : n.error) == null || i.call(n, "setAccordionMode error:", o), { success: !1, error: o.message };
      }
    }
  };
}
function Vy(e) {
  const { engine: t, renderer: r, logger: n } = e;
  return {
    openMobile() {
      var s;
      try {
        t.openMobile(), r.setMobileOpen(!0);
        const i = At("layoutManager"), o = At("eventBus");
        i != null && i.setSidebarMobileOpen ? i.setSidebarMobileOpen(!0) : o != null && o.emit && o.emit(oi.REQUEST_LAYOUT, { mode: "sidebar-mobile-open", source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "OpenMobile error:", i);
      }
    },
    closeMobile() {
      var s;
      try {
        t.closeMobile(), r.setMobileOpen(!1);
        const i = At("layoutManager"), o = At("eventBus");
        i != null && i.setSidebarMobileOpen ? i.setSidebarMobileOpen(!1) : o != null && o.emit && o.emit(oi.REQUEST_LAYOUT, { mode: "sidebar-mobile-closed", source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "CloseMobile error:", i);
      }
    },
    toggleMobile() {
      var s;
      try {
        t.toggleMobile(), r.setMobileOpen(t.mobileOpen);
        const i = t.mobileOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed", o = At("layoutManager"), a = At("eventBus");
        o != null && o.setSidebarMobileOpen ? o.setSidebarMobileOpen(t.mobileOpen) : a != null && a.emit && a.emit(oi.REQUEST_LAYOUT, { mode: i, source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "ToggleMobile error:", i);
      }
    }
  };
}
function qy(e) {
  const { engine: t, renderer: r, registry: n, routerAdapter: s, logger: i } = e;
  return {
    navigate(o) {
      var a;
      try {
        const l = n.getItemById(o);
        l != null && l.route && (s.navigate(l.route), t.navigate(o), r.setActiveItem(o));
      } catch (l) {
        (a = i == null ? void 0 : i.error) == null || a.call(i, "Navigate error:", l);
      }
    },
    setBadge(o, a) {
      var l;
      try {
        n.setBadge(o, a), r.renderNavigation();
      } catch (u) {
        (l = i == null ? void 0 : i.error) == null || l.call(i, "SetBadge error:", u);
      }
    },
    refresh() {
      var o;
      try {
        n.applyPermissionFilter(), r.renderNavigation();
      } catch (a) {
        (o = i == null ? void 0 : i.error) == null || o.call(i, "Refresh error:", a);
      }
    },
    setActiveItem(o) {
      var a;
      try {
        t.setActiveItem(o), r.setActiveItem(o);
      } catch (l) {
        (a = i == null ? void 0 : i.error) == null || a.call(i, "setActiveItem error:", l);
      }
    }
  };
}
const gh = fh;
function Yy(e) {
  return {
    ...jy(e),
    ...Gy(e),
    ...Vy(e),
    ...qy(e)
  };
}
let Tt = null, nl = { loads: 0, merges: 0, errors: 0 };
const Gu = {
  collapsed: !1,
  mobileBreakpoint: 1024,
  animationDuration: 200,
  persistState: !0,
  containerSelector: "#sidebar-container",
  settings: { defaultCollapsed: !1 },
  accordion: { allowMultipleOpen: !0, persistState: !0 },
  header: { title: "DshowDash" }
};
function Fl(e = {}) {
  try {
    return Tt = { ...Gu, ...e }, nl.loads++, Tt;
  } catch {
    return nl.errors++, Tt = { ...Gu }, Tt;
  }
}
function mh() {
  return Tt || Fl(), { ...Tt };
}
function Ky(e = {}) {
  return nl.merges++, Tt || Fl(), { ...Tt, ...e };
}
function Wy(e) {
  return function() {
    return (e == null ? void 0 : e.getState()) || null;
  };
}
const Vu = "7.1.0-P2-HARDNAV", en = "sidebar-router-adapter", yi = v({ moduleId: en });
function Xy() {
  yi.init();
}
function rt(e) {
  return yi.get(e);
}
function Pn() {
  return rt("eventBus") || rt("eventBusGlobal");
}
function Zy() {
  Xy();
  let e = [], t = {
    navigations: 0,
    routeChanges: 0,
    hardNavs: 0,
    errors: 0,
    lastNavigation: null,
    lastRouteChange: null,
    busSource: null
  };
  function r(s, i, o) {
    const a = Pn();
    a && a.emit && (t.busSource = rt("eventBus") ? "eventBus" : "eventBusGlobal", a.emit(pe.NAVIGATE, {
      path: s,
      options: { source: i, ...o },
      source: i,
      timestamp: Date.now()
    }));
  }
  function n(s, i) {
    const o = Pn();
    o && o.emit && o.emit(bl.HARD_NAV, {
      path: s,
      reason: i,
      source: en,
      timestamp: Date.now()
    }), t.hardNavs++;
  }
  return {
    navigate(s, i = {}) {
      try {
        const o = rt("routerGlobal");
        if (o && o.navigate)
          return o.navigate(s, { source: en, ...i }), t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "router-global" };
        const a = Pn();
        return a && a.emit ? (r(s, en, i), t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "event-bus-navigate" }) : s && typeof window < "u" && window.location ? (n(s, "No RouterGlobal or EventBus available"), window.location.hash = s.startsWith("#") ? s : `#${s}`, t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "hash-fallback" }) : (t.errors++, { success: !1, error: "no-route" });
      } catch (o) {
        return t.errors++, { success: !1, error: o.message };
      }
    },
    getCurrentRoute() {
      try {
        const s = rt("routerGlobal");
        return s != null && s.getCurrentRoute ? s.getCurrentRoute() : typeof window < "u" && window.location ? {
          path: window.location.hash || "#/",
          hash: window.location.hash,
          pathname: window.location.pathname
        } : { path: "#/", hash: "#/" };
      } catch (s) {
        return { path: "#/", hash: "#/", error: s.message };
      }
    },
    onRouteChange(s) {
      if (typeof s != "function") return () => {
      };
      try {
        const i = Pn();
        if (i && i.on) {
          const u = (h) => {
            t.routeChanges++, t.lastRouteChange = Date.now(), s(h);
          }, d = i.on(pe.ROUTE_CHANGED, u);
          if (typeof d == "function")
            return e.push(d), d;
          {
            const h = () => {
              i.off && i.off(pe.ROUTE_CHANGED, u);
            };
            return e.push(h), h;
          }
        }
        const o = rt("routerGlobal");
        if (o != null && o.on) {
          const u = (h) => {
            t.routeChanges++, t.lastRouteChange = Date.now(), s(h);
          };
          o.on(pe.ROUTE_CHANGED, u);
          const d = () => {
            var h;
            (h = o.off) == null || h.call(o, pe.ROUTE_CHANGED, u);
          };
          return e.push(d), d;
        }
        const a = () => {
          t.routeChanges++, t.lastRouteChange = Date.now(), s({
            path: window.location.hash || "#/",
            hash: window.location.hash
          });
        };
        window.addEventListener("hashchange", a);
        const l = () => {
          window.removeEventListener("hashchange", a);
        };
        return e.push(l), l;
      } catch {
        return t.errors++, () => {
        };
      }
    },
    getMetrics() {
      return { ...t };
    },
    reset() {
      t = {
        navigations: 0,
        routeChanges: 0,
        hardNavs: 0,
        errors: 0,
        lastNavigation: null,
        lastRouteChange: null,
        busSource: null
      };
    },
    destroy() {
      e.forEach((s) => {
        try {
          s();
        } catch {
        }
      }), e = [];
    },
    info() {
      return {
        moduleId: en,
        version: Vu,
        p0Compliant: !0,
        p2Compliant: !0,
        portsInitialized: yi.isInitialized(),
        currentRoute: this.getCurrentRoute(),
        cleanupCount: e.length,
        metrics: this.getMetrics(),
        busSource: t.busSource
      };
    },
    healthCheck() {
      const i = !!Pn(), o = !!rt("routerGlobal"), a = this.getCurrentRoute(), l = a && !a.error, u = {
        hasEventBus: i,
        hasRouterGlobal: o,
        hasValidRoute: l,
        noErrors: t.errors === 0,
        cleanupSetup: e.length >= 0,
        p0Compliant: !0,
        p2Compliant: !0
      }, d = Object.values(u).filter(Boolean).length, h = Object.keys(u).length;
      let g = "HEALTHY";
      return !i && !o && (g = "DEGRADED"), t.errors > 5 && (g = "DEGRADED"), {
        status: g,
        score: d,
        maxScore: h,
        scoreDisplay: `${d}/${h}`,
        checks: u,
        currentRoute: a,
        metrics: t,
        cleanupCount: e.length,
        version: Vu,
        moduleId: en,
        portsInitialized: yi.isInitialized(),
        busSource: rt("eventBus") ? "eventBus" : rt("eventBusGlobal") ? "eventBusGlobal" : "none",
        timestamp: Date.now()
      };
    }
  };
}
const qu = "6.0.0-ES6", di = "sidebar-telemetry-adapter", Jy = "[sidebar]", sl = v({ moduleId: di });
function Hn(e) {
  return sl.get(e);
}
function Qy() {
  let e = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null };
  const t = () => Hn("logger"), r = () => Hn("telemetryCore") || Hn("telemetry");
  return {
    log(n, s, i = {}) {
      try {
        const o = t(), a = `${Jy} ${s}`, l = Object.assign({ timestamp: Date.now() }, i);
        if (!o) return;
        switch (n) {
          case "debug":
            o.debug && o.debug(a, l), e.logs.debug++;
            break;
          case "info":
            o.info && o.info(a, l), e.logs.info++;
            break;
          case "warn":
            o.warn && o.warn(a, l), e.logs.warn++;
            break;
          case "error":
            o.error && o.error(a, l), e.logs.error++;
            break;
          default:
            o.info && o.info(a, l);
        }
        e.lastLog = { level: n, message: s, timestamp: Date.now() };
      } catch {
        e.errors++;
      }
    },
    track(n, s = {}) {
      try {
        const i = r(), o = Object.assign({ source: di, timestamp: Date.now() }, s);
        i && i.track && i.track(n, o), e.tracks++, e.lastTrack = { event: n, timestamp: Date.now() };
      } catch {
        e.errors++;
      }
    },
    error(n, s) {
      this.log("error", n, { error: s && s.message }), this.track("sidebar:error", { message: n, error: s ? s.message : null });
    },
    info(n, s) {
      this.log("info", n, s);
    },
    debug(n, s) {
      this.log("debug", n, s);
    },
    warn(n, s) {
      this.log("warn", n, s);
    },
    trackNavigation(n, s) {
      this.track("sidebar:navigation", { itemId: n, route: s });
    },
    trackToggle(n) {
      this.track("sidebar:toggle", { collapsed: n });
    },
    trackSectionToggle(n, s) {
      this.track("sidebar:section:toggle", { sectionId: n, expanded: s });
    },
    trackSearch(n, s) {
      this.track("sidebar:search", { query: n, resultsCount: s });
    },
    trackError(n, s) {
      this.track("sidebar:error", Object.assign({ error: n && n.message }, s || {}));
    },
    getMetrics() {
      return Object.assign({}, e);
    },
    reset() {
      e = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null };
    },
    getInfo() {
      return { moduleId: di, version: qu, portsInitialized: sl.isInitialized(), hasLogger: !!t(), hasTelemetry: !!r(), metrics: this.getMetrics() };
    },
    healthCheck() {
      const n = !!t(), s = !!Hn("telemetryCore"), i = !!Hn("eventBus"), o = e.logs.debug + e.logs.info + e.logs.warn + e.logs.error, a = { hasLogger: n, hasTelemetry: s, hasEventBus: i, noErrors: e.errors === 0, logsWorking: o > 0 || e.errors === 0 }, l = Object.values(a).filter(Boolean).length, u = Object.keys(a).length;
      return { status: l >= 3 ? "HEALTHY" : "DEGRADED", score: l, maxScore: u, scoreDisplay: `${l}/${u}`, checks: a, metrics: e, version: qu, moduleId: di, portsInitialized: sl.isInitialized(), timestamp: Date.now() };
    }
  };
}
const Yu = "5.9.0-ES6", il = "sidebar-permissions-adapter", Yn = v({ moduleId: il });
function Zr() {
  Yn.init();
}
function ev(e) {
  return Yn.get(e);
}
function Jr() {
  const e = ev("auth");
  return e || typeof window < "u" && (window.AuthAdapter || window.CoreAuthAdapter) || null;
}
function tv() {
  let e = {
    levelChecks: 0,
    permissionChecks: 0,
    filterOperations: 0,
    cacheHits: 0,
    errors: 0,
    lastCheck: null
  }, t = { level: null, permissions: null, timestamp: 0, ttl: 5e3 };
  const r = () => t.timestamp && Date.now() - t.timestamp < t.ttl, n = () => {
    t = { level: null, permissions: null, timestamp: 0, ttl: 5e3 };
  };
  return {
    getUserLevel() {
      var s;
      Zr();
      try {
        if (r() && t.level !== null)
          return e.cacheHits++, t.level;
        const i = Jr(), o = ((s = i == null ? void 0 : i.getLevel) == null ? void 0 : s.call(i)) ?? 0;
        return t.level = o, t.timestamp = Date.now(), e.levelChecks++, e.lastCheck = Date.now(), o;
      } catch {
        return e.errors++, 0;
      }
    },
    getUserPermissions() {
      var s, i;
      Zr();
      try {
        if (r() && t.permissions !== null)
          return e.cacheHits++, t.permissions;
        const o = Jr(), a = ((s = o == null ? void 0 : o.getRoles) == null ? void 0 : s.call(o)) ?? [], l = ((i = o == null ? void 0 : o.getCapabilities) == null ? void 0 : i.call(o)) ?? [], u = [...a, ...l];
        return t.permissions = u, t.timestamp = Date.now(), e.permissionChecks++, u;
      } catch {
        return e.errors++, [];
      }
    },
    canAccess(s) {
      var i;
      Zr();
      try {
        const o = Jr();
        return (i = o == null ? void 0 : o.isReady) != null && i.call(o) ? o.can ? o.can(s) === !0 : this.getUserPermissions().includes(s) : !1;
      } catch {
        return e.errors++, !1;
      }
    },
    filterItems(s) {
      try {
        if (!Array.isArray(s)) return [];
        const i = this.getUserPermissions(), o = s.filter((a) => !(a.permissions && a.permissions.length > 0 && !a.permissions.some(
          (u) => i.includes(u) || this.canAccess(u)
        )));
        return e.filterOperations++, o;
      } catch {
        return e.errors++, s;
      }
    },
    isAuthenticated() {
      var s;
      Zr();
      try {
        const i = Jr();
        return ((s = i == null ? void 0 : i.isAuthenticated) == null ? void 0 : s.call(i)) ?? !1;
      } catch {
        return e.errors++, !1;
      }
    },
    getUser() {
      var s;
      Zr();
      try {
        const i = Jr();
        return ((s = i == null ? void 0 : i.getUser) == null ? void 0 : s.call(i)) ?? null;
      } catch {
        return e.errors++, null;
      }
    },
    invalidateCache: n,
    getMetrics() {
      return { ...e };
    },
    reset() {
      n(), e = {
        levelChecks: 0,
        permissionChecks: 0,
        filterOperations: 0,
        cacheHits: 0,
        errors: 0,
        lastCheck: null
      };
    },
    info() {
      return {
        moduleId: il,
        version: Yu,
        portsInitialized: Yn.isInitialized(),
        isAuthenticated: this.isAuthenticated(),
        cacheValid: r(),
        metrics: this.getMetrics()
      };
    },
    healthCheck() {
      var m, y;
      Zr();
      const s = Jr(), i = ((m = s == null ? void 0 : s.isReady) == null ? void 0 : m.call(s)) ?? !1, o = ((y = s == null ? void 0 : s.healthCheck) == null ? void 0 : y.call(s)) ?? { status: "UNKNOWN" }, a = this.getUser(), l = this.isAuthenticated(), u = {
        authReady: i,
        hasUser: !!a,
        isAuthenticated: l,
        authHealthy: o.status === "HEALTHY",
        noErrors: e.errors === 0,
        portsInitialized: Yn.isInitialized()
      }, d = Object.values(u).filter(Boolean).length, h = Object.keys(u).length;
      let g = "HEALTHY";
      return i ? (!l || e.errors > 0) && (g = "DEGRADED") : g = "UNHEALTHY", {
        status: g,
        score: d,
        maxScore: h,
        scoreDisplay: `${d}/${h}`,
        checks: u,
        isAuthenticated: l,
        authSource: "ports:auth",
        authHealth: o.status,
        metrics: e,
        cacheValid: r(),
        version: Yu,
        moduleId: il,
        portsInitialized: Yn.isInitialized(),
        timestamp: Date.now()
      };
    }
  };
}
const Ku = "5.5.0-ENTERPRISE-FULL", Wu = "sidebar-ui-adapter";
function rv(e = {}) {
  const t = [e.containerSelector, '[data-shell-region="sidebar"]', '[data-region="sidebar"]', "#shell-sidebar-region", "#sidebar-root", ".dsd-sidebar", ".app-sidebar", "#sidebar"].filter(Boolean);
  let r = null, n = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null };
  function s() {
    if (n.containerLookups++, r && document.contains(r)) return r;
    for (const _ of t)
      try {
        const A = document.querySelector(_);
        if (A)
          return r = A, A;
      } catch {
        n.errors++;
      }
    return null;
  }
  function i(_) {
    try {
      const A = s();
      return A ? (A.innerHTML = _, n.renders++, n.lastOperation = { type: "render", timestamp: Date.now() }, !0) : (n.errors++, !1);
    } catch {
      return n.errors++, !1;
    }
  }
  function o(_, A) {
    try {
      const ce = s();
      if (!ce) return !1;
      const Xr = ce.querySelector(_);
      return Xr ? (Xr.innerHTML = A, n.updates++, n.lastOperation = { type: "update", selector: _, timestamp: Date.now() }, !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function a(_) {
    try {
      const A = s();
      return A ? (A.classList.add(_), n.classOperations++, !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function l(_) {
    try {
      const A = s();
      return A ? (A.classList.remove(_), n.classOperations++, !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function u(_, A) {
    try {
      const ce = s();
      return ce ? (ce.classList.toggle(_, A), n.classOperations++, !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function d(_, A) {
    try {
      const ce = s();
      return ce ? (ce.setAttribute(_, A), !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function h(_) {
    try {
      const A = s();
      return A ? A.getAttribute(_) : null;
    } catch {
      return n.errors++, null;
    }
  }
  function g(_) {
    try {
      const A = s();
      return A ? A.querySelector(_) : null;
    } catch {
      return n.errors++, null;
    }
  }
  function m(_) {
    try {
      const A = s();
      return A ? Array.from(A.querySelectorAll(_)) : [];
    } catch {
      return n.errors++, [];
    }
  }
  function y() {
    r = null;
  }
  function S() {
    return { ...n };
  }
  function x() {
    r = null, n = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null };
  }
  function Ae() {
    const _ = s();
    return { moduleId: Wu, version: Ku, hasContainer: !!_, containerId: (_ == null ? void 0 : _.id) || null, metrics: S() };
  }
  function Me() {
    const _ = s(), A = _ && document.contains(_), ce = (_ == null ? void 0 : _.querySelector(".dsd-sidebar")) !== null || (_ == null ? void 0 : _.classList.contains("dsd-sidebar")), Xr = { containerFound: !!_, containerInDOM: A, hasSidebarElement: ce, noErrors: n.errors === 0, cacheValid: r !== null }, $u = Object.values(Xr).filter(Boolean).length, ku = Object.keys(Xr).length;
    let ka = "HEALTHY";
    return _ ? (!A || n.errors > 0) && (ka = "DEGRADED") : ka = "UNHEALTHY", { status: ka, score: $u, maxScore: ku, scoreDisplay: `${$u}/${ku}`, checks: Xr, containerId: (_ == null ? void 0 : _.id) || null, containerSelector: _ ? t.find((Jb) => {
      try {
        return document.querySelector(Jb) === _;
      } catch {
        return !1;
      }
    }) : null, metrics: n, version: Ku, moduleId: Wu, timestamp: Date.now() };
  }
  return { getContainer: s, render: i, update: o, addClass: a, removeClass: l, toggleClass: u, setAttribute: d, getAttribute: h, querySelector: g, querySelectorAll: m, invalidateCache: y, getMetrics: S, reset: x, info: Ae, healthCheck: Me };
}
const nv = "sidebar-adapters-factory", sv = v({ moduleId: nv });
function fr(e) {
  return sv.get(e);
}
function iv() {
  return {
    navigate(e) {
      const t = fr("router"), r = fr("eventBus");
      if (t && t.navigate) {
        t.navigate(e, { source: "sidebar-fallback" });
        return;
      }
      if (r && r.emit) {
        r.emit(e_.NAVIGATE, {
          intentId: "NAVIGATE",
          target: { type: "route", value: e },
          meta: { source: "sidebar-fallback", reason: "fallback-navigation", timestamp: Date.now() },
          options: { replace: !1 }
        });
        return;
      }
      typeof window < "u" && window.location && (r && r.emit && r.emit(bl.HARD_NAV, {
        path: e,
        reason: "No RouterGlobal or EventBus pipeline",
        source: "sidebar-fallback",
        timestamp: Date.now()
      }), window.location.hash = e);
    },
    getCurrentRoute() {
      const e = fr("router");
      if (e && e.getCurrentRoute) return e.getCurrentRoute();
      if (e && e.current) return e.current;
      if (typeof window < "u" && window.location) {
        const t = window.location.hash || "#/";
        return { path: t, hash: t };
      }
      return { path: "#/", hash: "#/" };
    },
    onRouteChange(e) {
      const t = fr("eventBus");
      if (t && t.on) {
        const r = (o) => {
          const a = o && o.path ? o.path : typeof window < "u" && window.location ? window.location.hash : "#/";
          e(o || { path: a, hash: a });
        }, n = t.on(pe.ROUTE_CHANGED, r), s = t.on(pe.NAVIGATED, r);
        return () => {
          typeof n == "function" ? n() : t.off && t.off(pe.ROUTE_CHANGED, r), typeof s == "function" ? s() : t.off && t.off(pe.NAVIGATED, r);
        };
      }
      if (typeof window < "u") {
        const r = () => {
          const s = window.location.hash || "#/";
          e({ path: s, hash: s });
        };
        return window.addEventListener("hashchange", r), () => {
          window.removeEventListener("hashchange", r);
        };
      }
      return () => {
      };
    },
    healthCheck() {
      return { status: "DEGRADED", score: 1, maxScore: 3, scoreDisplay: "1/3", fallback: !0, intentBased: !0 };
    }
  };
}
function ov() {
  return {
    getContainer() {
      return document.querySelector('[data-shell-region="sidebar"]') || document.getElementById("sidebar");
    },
    healthCheck() {
      return { status: "DEGRADED", score: 1, maxScore: 3, scoreDisplay: "1/3", fallback: !0 };
    }
  };
}
function av() {
  return {
    log() {
    },
    track() {
    },
    error() {
    },
    healthCheck() {
      return { status: "DEGRADED", fallback: !0 };
    }
  };
}
function lv() {
  return {
    getUserLevel() {
      return 0;
    },
    getUserPermissions() {
      return [];
    },
    canAccess() {
      return !1;
    },
    filterItems(e) {
      return Array.isArray(e) ? e : [];
    },
    isAuthenticated() {
      return !1;
    },
    healthCheck() {
      return { status: "DEGRADED", fallback: !0 };
    }
  };
}
function cv(e = {}) {
  const t = {};
  try {
    t.router = Zy();
  } catch (r) {
    _e("router-adapter", r.message), t.router = iv();
  }
  try {
    t.telemetry = Qy();
  } catch (r) {
    _e("telemetry-adapter", r.message), t.telemetry = av();
  }
  try {
    t.permissions = tv();
  } catch (r) {
    _e("permissions-adapter", r.message), t.permissions = lv();
  }
  try {
    t.ui = rv({ containerSelector: e.containerSelector || '[data-shell-region="sidebar"]' });
  } catch (r) {
    _e("ui-adapter", r.message), t.ui = ov();
  }
  return t;
}
function uv(e) {
  return {
    navigation: e.router,
    telemetry: e.telemetry,
    permissions: e.permissions,
    ui: e.ui,
    events: dv()
  };
}
function dv() {
  return {
    emit(e, t) {
      try {
        const r = fr("eventBus");
        r && r.emit && r.emit(e, Object.assign({ source: "sidebar", timestamp: Date.now() }, t || {}));
      } catch {
      }
    },
    on(e, t) {
      try {
        const r = fr("eventBus");
        if (r && r.on) {
          const n = r.on(e, t);
          return typeof n == "function" ? n : () => {
            r.off && r.off(e, t);
          };
        }
      } catch {
      }
      return () => {
      };
    },
    off(e, t) {
      try {
        const r = fr("eventBus");
        r && r.off && r.off(e, t);
      } catch {
      }
    }
  };
}
const xa = { dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', team: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', people: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', "users-cog": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 8v1"/><path d="M19 13v1"/><path d="M16.5 9.5l.7.7"/><path d="M20.8 13.8l.7.7"/><path d="M16.5 12.5l.7-.7"/><path d="M20.8 8.2l.7-.7"/><path d="M16 11h1"/><path d="M21 11h1"/></svg>', shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', "shield-check": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>', key: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', "clipboard-list": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/></svg>', settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', cog: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', money: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', package: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', document: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', nav: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', server: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>', automation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>', cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', supplier: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>', ads: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>', instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>', drive: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', pipeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', calculator: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>', folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' };
function ph(e) {
  if (xa[e]) return xa[e];
  if (e.includes(":")) {
    const r = hv(e);
    if (r) return r;
  }
  const t = fv(e);
  return t || xa.default;
}
function hv(e) {
  try {
    return Md(e);
  } catch {
    return null;
  }
}
function fv(e) {
  try {
    const t = t_();
    for (const r of t) {
      const n = Md(r + ":" + e);
      if (n) return n;
    }
  } catch {
  }
  return null;
}
function Oe(e, t = {}) {
  const r = document.createElement(e);
  return t.className && (r.className = t.className), t.id && (r.id = t.id), t.attributes && Object.keys(t.attributes).forEach((n) => {
    r.setAttribute(n, t.attributes[n]);
  }), t.textContent && (r.textContent = t.textContent), r;
}
function gv(e = {}) {
  return '<aside class="dsd-sidebar" id="sidebar" role="navigation" aria-label="Menu principal"><div class="dsd-sidebar__header dsd-sidebar__header--with-search"><div class="dsd-sidebar__search" role="search"><div class="dsd-sidebar__search-wrapper"><span class="dsd-sidebar__search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span><input type="text" class="dsd-sidebar__search-input" placeholder="Buscar..." aria-label="Buscar página"/><span class="dsd-sidebar__search-clear" role="button" aria-label="Limpar busca" tabindex="0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></div></div><button class="dsd-sidebar__toggle" type="button" aria-label="Recolher menu" aria-expanded="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button></div><nav class="dsd-sidebar__nav"><div class="dsd-sidebar__nav-content" data-slot="nav-items"></div></nav><div class="dsd-sidebar__keyboard-hints sr-only">Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar.</div><div class="dsd-sidebar__announce sr-only" role="status" aria-live="polite" aria-atomic="true"></div></aside>';
}
function Xu(e = {}) {
  const t = Oe("aside", { className: "dsd-sidebar", id: "sidebar", attributes: { role: "navigation", "aria-label": "Menu principal" } }), r = Oe("div", { className: "dsd-sidebar__header dsd-sidebar__header--with-search" }), n = Oe("div", { className: "dsd-sidebar__search", attributes: { role: "search" } }), s = Oe("div", { className: "dsd-sidebar__search-wrapper" }), i = Oe("span", { className: "dsd-sidebar__search-icon" });
  i.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
  const o = Oe("input", { className: "dsd-sidebar__search-input", attributes: { type: "text", placeholder: "Buscar...", "aria-label": "Buscar página" } }), a = Oe("span", { className: "dsd-sidebar__search-clear", attributes: { role: "button", "aria-label": "Limpar busca", tabindex: "0" } });
  a.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', s.appendChild(i), s.appendChild(o), s.appendChild(a), n.appendChild(s);
  const l = Oe("button", { className: "dsd-sidebar__toggle", attributes: { type: "button", "aria-label": "Recolher menu", "aria-expanded": "true" } });
  l.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>', r.appendChild(n), r.appendChild(l);
  const u = Oe("nav", { className: "dsd-sidebar__nav" }), d = Oe("div", { className: "dsd-sidebar__nav-content", attributes: { "data-slot": "nav-items" } });
  u.appendChild(d);
  const h = Oe("div", { className: "dsd-sidebar__keyboard-hints sr-only", textContent: "Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar." }), g = Oe("div", { className: "dsd-sidebar__announce sr-only", attributes: { role: "status", "aria-live": "polite", "aria-atomic": "true" } });
  return t.appendChild(r), t.appendChild(u), t.appendChild(h), t.appendChild(g), t;
}
let Ct = null, Te = null, ts = { shows: 0, hides: 0, errors: 0 };
function Eh(e, t = {}) {
  const r = document.createElement(e);
  return t.id && (r.id = t.id), t.className && (r.className = t.className), t.attributes && Object.entries(t.attributes).forEach(([n, s]) => r.setAttribute(n, s)), t.style && (r.style.cssText = t.style), r;
}
function bh(e) {
  return document.querySelector(e);
}
function Zu(e) {
  return document.getElementById(e);
}
function mv() {
  try {
    return Ct && document.contains(Ct) || (Ct = Zu("app-overlay-root"), Ct || (Ct = Eh("div", { id: "app-overlay-root", attributes: { "data-overlay-root": "true" }, style: "position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;" }), (Zu("app-shell") || document.documentElement).appendChild(Ct))), Ct;
  } catch {
    return ts.errors++, null;
  }
}
function pv() {
  try {
    if ((!Te || !document.contains(Te)) && (Te = bh(".dsd-sidebar-overlay")), !Te) {
      Te = Eh("div", { className: "dsd-sidebar-overlay", attributes: { "aria-hidden": "true" }, style: "pointer-events:auto;" });
      const e = mv();
      e && e.appendChild(Te);
    }
    return Te.classList.add("dsd-sidebar-overlay--visible"), ts.shows++, { success: !0 };
  } catch (e) {
    return ts.errors++, { success: !1, error: e.message };
  }
}
function Ev() {
  try {
    return Te || (Te = bh(".dsd-sidebar-overlay")), Te == null || Te.classList.remove("dsd-sidebar-overlay--visible"), ts.hides++, { success: !0 };
  } catch (e) {
    return ts.errors++, { success: !1, error: e.message };
  }
}
const _h = v({ moduleId: Ml });
function bv() {
  _h.init();
}
function _v(e) {
  return _h.get(e);
}
let br = { renders: 0, fallbacks: 0, errors: 0, modelLoaderRenders: 0, registryFallbacks: 0 };
function yh(e) {
  return `trigger:navigation:item-${e}`;
}
function yv(e) {
  return `trigger:navigation:section-${e}`;
}
function Tr(e, t, r) {
  try {
    r.includes(e) || r.push(e);
    const n = _v("eventBus");
    n != null && n.emit && n.emit(f.DEGRADED, { source: Ml, component: e, error: t, degradedComponents: r, timestamp: Date.now() });
  } catch {
  }
}
function ye(e, t = {}) {
  const r = document.createElement(e);
  return t.className && (r.className = t.className), t.id && (r.id = t.id), t.attributes && Object.entries(t.attributes).forEach(([n, s]) => {
    s != null && r.setAttribute(n, s);
  }), t.style && (r.style.cssText = t.style), t.textContent && (r.textContent = t.textContent), r;
}
function vv(e) {
  const t = ye("span", { className: c.GROUP_ICON });
  return t.innerHTML = ph(e), t;
}
function Iv() {
  const e = ye("span", { className: c.GROUP_CHEVRON });
  return e.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>', e;
}
function vh(e, t, r, n) {
  const s = e.id.replace(/^sec-/, ""), i = yv(s), o = ye("button", {
    className: c.GROUP_BUTTON + (t ? ` ${c.GROUP_BUTTON_COLLAPSIBLE}` : ""),
    attributes: {
      type: "button",
      "data-section-toggle": s,
      "data-uarps-trigger": i,
      ...t && { "aria-expanded": String(r) },
      ...t && { "aria-controls": `section-items-${s}` }
    }
  });
  o.appendChild(vv(n));
  const a = ye("span", { className: c.GROUP_TITLE, textContent: e.label || e.title || e.id });
  return o.appendChild(a), t && o.appendChild(Iv()), o;
}
function Ih(e, t, r) {
  var d, h, g;
  const n = e.label || e.title || e.id, s = ((d = e.uarps) == null ? void 0 : d.trigger_id) || yh(e.id), i = e.route || `#${e.id}`, o = ye("li", {
    className: c.ITEM + (t ? ` ${c.ITEM_ACTIVE}` : "") + ((h = e.state) != null && h.disabled ? ` ${c.ITEM_DISABLED}` : ""),
    attributes: {
      "data-item-id": e.id,
      "data-panel-id": e.panelId || null,
      "data-label": n,
      "data-display-title": e.displayTitle || null,
      "data-uarps-trigger": s,
      role: "listitem"
    }
  }), a = ye("a", {
    className: c.LINK,
    attributes: {
      href: i,
      "data-panel": e.panelId || e.id,
      "data-tooltip": n,
      "aria-current": t ? "page" : "false",
      ...((g = e.state) == null ? void 0 : g.disabled) && { "aria-disabled": "true", tabindex: "-1" }
    }
  }), l = ye("span", { className: c.ITEM_ICON });
  l.innerHTML = ph(e.icon || "file"), a.appendChild(l);
  const u = ye("span", { className: c.ITEM_TEXT, textContent: n });
  if (a.appendChild(u), r) {
    const m = r.type || "count", y = r.value ?? r.text ?? r.count ?? "", S = r.pulse === !0, x = ye("span", {
      className: `${c.BADGE} ${c.BADGE}--${m}${S ? ` ${c.BADGE_PULSE}` : ""}`,
      attributes: {
        "aria-label": `${y} ${m === "alert" ? "alertas" : "notificações"}`,
        ...S && { "data-pulse": "true" }
      },
      textContent: m !== "dot" ? String(y) : ""
    });
    a.appendChild(x);
  }
  return o.appendChild(a), o;
}
function Sv(e, t, r, n) {
  var h, g;
  const s = e.id.replace(/^sec-/, ""), i = ((h = e.accordion) == null ? void 0 : h.collapsible) !== !1, o = !i || t.has(s) || ((g = e.accordion) == null ? void 0 : g.default_open) === !0, a = e.icon || pi[s] || pi.default, l = ye("div", {
    className: c.SECTION + (i ? ` ${c.SECTION_COLLAPSIBLE}` : "") + (o ? ` ${c.SECTION_EXPANDED}` : ""),
    attributes: {
      "data-section-id": s,
      "data-collapsible": String(i),
      "data-source": "navigation-model-v1"
    }
  });
  e.label && l.appendChild(vh(e, i, o, a));
  const u = ye("ul", {
    className: c.SECTION_ITEMS,
    id: `section-items-${s}`,
    attributes: { role: "list" },
    style: o ? "" : "height:0;overflow:hidden;"
  });
  return (e.items || []).forEach((m) => {
    var y;
    try {
      if ((y = m.state) != null && y.hidden) return;
      const S = m.id === r;
      u.appendChild(Ih(m, S, m.badge));
    } catch (S) {
      Tr(`item:${m.id}`, S.message, n);
    }
  }), l.appendChild(u), l;
}
function Cv(e, t, r, n, s) {
  const i = e.collapsible !== !1, o = !i || r.has(e.id), a = e.icon || pi[e.id] || pi.default, l = ye("div", {
    className: c.SECTION + (i ? ` ${c.SECTION_COLLAPSIBLE}` : "") + (o ? ` ${c.SECTION_EXPANDED}` : ""),
    attributes: {
      "data-section-id": e.id,
      "data-collapsible": String(i),
      "data-source": "sidebar-registry"
    }
  });
  (e.label || e.title) && l.appendChild(vh(e, i, o, a));
  const d = ye("ul", {
    className: c.SECTION_ITEMS,
    id: `section-items-${e.id}`,
    attributes: { role: "list" },
    style: o ? "" : "height:0;overflow:hidden;"
  });
  return t.forEach((h) => {
    try {
      const g = w.getBadge(h.id), m = h.id === n, y = {
        id: h.id,
        label: h.label || h.title || h.id,
        icon: h.icon || "file",
        route: h.route,
        panelId: h.panelId || null,
        state: { disabled: h.disabled || !1 },
        uarps: { trigger_id: yh(h.id) }
      };
      d.appendChild(Ih(y, m, g));
    } catch (g) {
      Tr(`item:${h.id}`, g.message, s);
    }
  }), l.appendChild(d), l;
}
function Av(e, t, r, n) {
  const s = k.getModel();
  if (!s || !s.sections || s.sections.length === 0)
    return null;
  e.textContent = "";
  let i = 0;
  return s.sections.forEach((o) => {
    try {
      if (o.visible === !1) return;
      const l = (o.items || []).filter((d) => {
        var h;
        return ((h = d.state) == null ? void 0 : h.hidden) !== !0;
      });
      if (l.length === 0) return;
      const u = Sv(o, t, r, n);
      e.appendChild(u), i += l.length;
    } catch (a) {
      Tr(`section:${o.id}`, a.message, n);
    }
  }), i === 0 ? null : (br.modelLoaderRenders++, { success: !0, itemsRendered: i, source: "navigation-model-v1" });
}
function Mv(e, t, r, n) {
  let s = [];
  try {
    s = w.getSections();
  } catch (o) {
    return Tr("registry", o.message, n), null;
  }
  if (!s || s.length === 0)
    return null;
  e.textContent = "";
  let i = 0;
  return s.forEach((o) => {
    try {
      const a = w.getItemsBySection(o.id);
      if (a.length === 0) return;
      const l = Cv(o, a, t, r, n);
      e.appendChild(l), i += a.length;
    } catch (a) {
      Tr(`section:${o.id}`, a.message, n);
    }
  }), i === 0 ? null : (br.registryFallbacks++, { success: !0, itemsRendered: i, source: "sidebar-registry" });
}
function Ov(e, t, r, n) {
  bv();
  try {
    const s = e == null ? void 0 : e.querySelector('[data-slot="nav-items"]');
    if (!s)
      return Tr("nav-slot", "Nav slot not found", n), { success: !1, error: "Nav slot not found" };
    let i = Av(s, t, r, n);
    return i || (console.info(`[${Ml}] Model not available, falling back to Registry`), i = Mv(s, t, r, n)), i ? (br.renders++, {
      success: !0,
      itemsRendered: i.itemsRendered,
      source: i.source,
      triggerPattern: "trigger:navigation:item-{id}"
    }) : (br.fallbacks++, s.innerHTML = Ja, { success: !0, empty: !0, fallback: !0 });
  } catch (s) {
    br.errors++, Tr("renderNavigation", s.message, n);
    const i = e == null ? void 0 : e.querySelector('[data-slot="nav-items"]');
    return i && (i.innerHTML = Ja), { success: !1, error: s.message, fallback: !0 };
  }
}
function Tv(e) {
  try {
    return e ? (br.fallbacks++, e.innerHTML = R_, e.querySelector(`.${c.ROOT}`)) : null;
  } catch {
    return br.errors++, null;
  }
}
let Ye = { updates: 0, errors: 0 };
function Dv(e, t, r) {
  var n;
  try {
    if (!e) return !1;
    e.querySelectorAll(`.${c.ITEM_ACTIVE}`).forEach((i) => {
      var o;
      i.classList.remove(c.ITEM_ACTIVE), (o = i.querySelector("a")) == null || o.removeAttribute("aria-current");
    });
    const s = e.querySelector(`[data-item-id="${t}"]`);
    if (s) {
      s.classList.add(c.ITEM_ACTIVE), (n = s.querySelector("a")) == null || n.setAttribute("aria-current", "page");
      const i = s.closest("[data-section-id]");
      if (i) {
        const o = i.getAttribute("data-section-id");
        r == null || r.add(o), i.classList.add(c.SECTION_EXPANDED);
        const a = i.querySelector(`.${c.SECTION_ITEMS}`);
        a && (a.style.height = "");
      }
    }
    return Ye.updates++, !0;
  } catch {
    return Ye.errors++, !1;
  }
}
function Lv(e, t) {
  try {
    if (!e) return !1;
    e.classList.toggle(c.MOD_COLLAPSED, t);
    const r = e.querySelector(`.${c.TOGGLE}`);
    return r == null || r.setAttribute("aria-expanded", String(!t)), r == null || r.setAttribute("aria-label", t ? "Expandir menu" : "Recolher menu"), Ye.updates++, !0;
  } catch {
    return Ye.errors++, !1;
  }
}
function $v(e, t) {
  try {
    return e ? (e.classList.toggle(c.MOD_MOBILE_OPEN, t), Ye.updates++, !0) : !1;
  } catch {
    return Ye.errors++, !1;
  }
}
function kv(e, t) {
  try {
    const r = e == null ? void 0 : e.querySelector(`.${c.ANNOUNCE}`);
    return r && (r.textContent = t), !0;
  } catch {
    return Ye.errors++, !1;
  }
}
function wv(e, t) {
  if (!t) return e;
  const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return e.replace(r, '<mark class="highlight">$1</mark>');
}
function Sh(e) {
  e.querySelectorAll(`.${c.ITEM_TEXT} mark`).forEach((t) => {
    const r = t.parentNode;
    r.replaceChild(document.createTextNode(t.textContent), t), r.normalize();
  });
}
function Nv(e, t, r) {
  var n;
  try {
    if (!e) return { visible: 0, hidden: 0 };
    const s = t.toLowerCase().trim();
    let i = 0, o = 0;
    Sh(e), e.classList.toggle(c.MOD_SEARCHING, !!s), e.querySelectorAll(`.${c.ITEM}`).forEach((l) => {
      const u = l.querySelector(`.${c.ITEM_TEXT}`), d = (u == null ? void 0 : u.textContent) || "", h = d.toLowerCase(), g = !s || h.includes(s);
      l.style.display = g ? "" : "none", l.classList.toggle(c.ITEM_MATCH, g && !!s), g && s && u && (u.innerHTML = wv(d, s)), g ? i++ : o++;
    }), s && e.querySelectorAll("[data-section-id]").forEach((l) => {
      const u = l.getAttribute("data-section-id");
      r == null || r.add(u), l.classList.add(c.SECTION_EXPANDED);
      const d = l.querySelector(`.${c.SECTION_ITEMS}`);
      d && (d.style.height = "");
    });
    let a = e.querySelector(`.${c.SEARCH_EMPTY}`);
    return s && i === 0 ? (a || (a = document.createElement("div"), a.className = c.SEARCH_EMPTY, a.innerHTML = `<span class="${c.SEARCH_EMPTY_ICON}">🔍</span><span class="${c.SEARCH_EMPTY_TEXT}">Nenhum resultado encontrado</span>`, (n = e.querySelector(`.${c.NAV_CONTENT}`)) == null || n.appendChild(a)), a.style.display = "") : a && (a.style.display = "none"), Ye.updates++, { visible: i, hidden: o };
  } catch {
    return Ye.errors++, { visible: 0, hidden: 0 };
  }
}
function Rv(e, t) {
  try {
    if (!e) return !1;
    Sh(e), e.classList.remove(c.MOD_SEARCHING), e.querySelectorAll(`.${c.ITEM}`).forEach((s) => {
      s.style.display = "", s.classList.remove(c.ITEM_MATCH);
    });
    const r = e.querySelector(`.${c.SEARCH_EMPTY}`);
    r && (r.style.display = "none");
    const n = e.querySelector(`.${c.SEARCH_INPUT}`);
    return n && (n.value = ""), Ye.updates++, !0;
  } catch {
    return Ye.errors++, !1;
  }
}
const Ch = "5.5.0-ENTERPRISE-FULL", Ah = "sidebar-ui-health";
function xv(e) {
  return function() {
    const { container: r, sidebar: n, initialized: s, activeItemId: i, mobileOpen: o, expandedSections: a, degradedComponents: l, lastError: u, sectionClickHandler: d } = e(), h = !!r, g = !!n, m = h && document.contains(r), y = g && document.contains(n), S = (n == null ? void 0 : n.querySelector("[data-fallback]")) !== null, x = !!d, Ae = { hasContainer: h, hasSidebar: g, containerInDOM: m, sidebarInDOM: y, noFallback: !S, noDegradedComponents: l.length === 0, accordionHandlersSet: x }, Me = Object.values(Ae).filter(Boolean).length, _ = Object.keys(Ae).length;
    let A = "HEALTHY";
    return !h || !g ? A = "UNHEALTHY" : (!m || !y || l.length > 0 || S) && (A = "DEGRADED"), { status: A, score: Me, maxScore: _, scoreDisplay: `${Me}/${_}`, checks: Ae, initialized: s, activeItemId: i, mobileOpen: o, expandedSectionsCount: a.size, expandedSections: Array.from(a), degradedComponents: l, lastError: u, capabilities: Pd, compliance: "AAA", noBodyAppend: !0, version: Ch, moduleId: Ah, timestamp: Date.now() };
  };
}
function Pv(e, t) {
  return function() {
    const { activeItemId: n, mobileOpen: s, expandedSections: i, degradedComponents: o, status: a } = e();
    return { version: Ch, moduleId: Ah, status: a, activeItemId: n, mobileOpen: s, expandedSections: Array.from(i), degradedComponents: o, capabilities: Pd, healthCheck: t() };
  };
}
let Ht = { skeletonShows: 0, skeletonHides: 0, rippleSetups: 0, loadingChanges: 0, errors: 0 };
function Ju(e = !1) {
  const t = document.createElement("div");
  return t.className = c.SKELETON_ITEM, t.innerHTML = `<div class="${c.SKELETON_ICON}"></div><div class="${c.SKELETON_TEXT}${e ? ` ${c.SKELETON_TEXT_SHORT}` : ""}"></div>`, t;
}
function Qu() {
  const e = document.createElement("div");
  return e.className = c.SKELETON_GROUP, e.innerHTML = `<div class="${c.SKELETON_ICON}"></div><div class="${c.SKELETON_TEXT}"></div>`, e;
}
function Hv(e, t = 8) {
  try {
    if (!e) return !1;
    const r = e.querySelector(`.${c.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!r) return !1;
    r.dataset.originalContent = r.innerHTML;
    const n = document.createElement("div");
    n.className = c.SKELETON, n.setAttribute("aria-hidden", "true"), n.setAttribute("role", "presentation"), n.appendChild(Qu());
    for (let s = 0; s < 3; s++) n.appendChild(Ju(s === 2));
    n.appendChild(Qu());
    for (let s = 0; s < Math.min(t - 3, 5); s++) n.appendChild(Ju(s === 4));
    return r.innerHTML = "", r.appendChild(n), e.classList.add(c.MOD_LOADING_SKELETON), Ht.skeletonShows++, !0;
  } catch {
    return Ht.errors++, !1;
  }
}
function zv(e) {
  try {
    if (!e) return !1;
    const t = e.querySelector(`.${c.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!t) return !1;
    t.dataset.originalContent && (t.innerHTML = t.dataset.originalContent, delete t.dataset.originalContent);
    const r = t.querySelector(`.${c.SKELETON}`);
    return r && r.remove(), e.classList.remove(c.MOD_LOADING_SKELETON), Ht.skeletonHides++, !0;
  } catch {
    return Ht.errors++, !1;
  }
}
function ed(e) {
  const t = e.currentTarget;
  t.querySelectorAll(`.${c.RIPPLE}`).forEach((a) => a.remove());
  const r = document.createElement("span");
  r.className = c.RIPPLE;
  const n = t.getBoundingClientRect(), s = Math.max(n.width, n.height), i = e.clientX - n.left - s / 2, o = e.clientY - n.top - s / 2;
  r.style.width = r.style.height = `${s}px`, r.style.left = `${i}px`, r.style.top = `${o}px`, t.appendChild(r), r.addEventListener("animationend", () => r.remove());
}
function Bv(e) {
  try {
    if (!e) return null;
    const t = e.querySelectorAll(`.${c.LINK}`);
    return t.forEach((r) => r.addEventListener("click", ed)), Ht.rippleSetups++, () => {
      t.forEach((r) => r.removeEventListener("click", ed));
    };
  } catch {
    return Ht.errors++, null;
  }
}
function Uv(e, t) {
  try {
    return e ? (e.classList.toggle(c.MOD_LOADING, t), Ht.loadingChanges++, !0) : !1;
  } catch {
    return Ht.errors++, !1;
  }
}
const vi = v({ moduleId: xd });
let Pa = { instancesCreated: 0, activeInstances: 0 }, ol = null;
function jv() {
  vi.init();
}
function Fv(e) {
  return vi.get(e);
}
function Gl(e, t, r) {
  try {
    const n = e == null ? void 0 : e.querySelector(`[data-section-id="${t}"]`);
    if (!n) return !1;
    n.classList.add(c.SECTION_EXPANDED);
    const s = n.querySelector(`.${c.SECTION_ITEMS}`);
    s && (s.style.height = "");
    const i = n.querySelector("[data-section-toggle]");
    return i && i.setAttribute("aria-expanded", "true"), r == null || r.add(t), !0;
  } catch {
    return !1;
  }
}
function Mh(e, t, r) {
  try {
    const n = e == null ? void 0 : e.querySelector(`[data-section-id="${t}"]`);
    if (!n) return !1;
    n.classList.remove(c.SECTION_EXPANDED);
    const s = n.querySelector(`.${c.SECTION_ITEMS}`);
    s && (s.style.height = "0");
    const i = n.querySelector("[data-section-toggle]");
    return i && i.setAttribute("aria-expanded", "false"), r == null || r.delete(t), !0;
  } catch {
    return !1;
  }
}
function Gv(e, t, r) {
  return r != null && r.has(t) ? Mh(e, t, r) : Gl(e, t, r);
}
function Vv(e, t, r) {
  try {
    return r == null || r.clear(), t == null || t.forEach((n) => {
      Gl(e, n, r);
    }), !0;
  } catch {
    return !1;
  }
}
function qv(e, t) {
  try {
    return t == null || t.clear(), Array.isArray(e) && e.forEach((r) => {
      t == null || t.add(r);
    }), !0;
  } catch {
    return !1;
  }
}
function Yv(e, t, r) {
  if (!e) return null;
  const n = (s) => {
    const i = s.target.closest("[data-section-toggle]");
    if (i) {
      const o = i.getAttribute("data-section-toggle");
      r && r(o);
    }
  };
  return e.addEventListener("click", n), n;
}
function td(e, t) {
  e && t && e.removeEventListener("click", t);
}
class Kv {
  constructor(t = {}) {
    this._container = null, this._sidebar = null, this._options = t, this._activeItemId = null, this._mobileOpen = !1, this._status = "healthy", this._lastError = null, this._degradedComponents = [], this._initialized = !1, this._metrics = { renders: 0, errors: 0 }, this._expandedSections = /* @__PURE__ */ new Set(), this._sectionClickHandler = null, this._rippleCleanup = null, this._itemsChangedCallback = null, Pa.instancesCreated++, Pa.activeInstances++;
  }
  get status() {
    return this._status;
  }
  init() {
    try {
      return jv(), this._initialized = !0, this._status = "healthy", this._navIconsHandler = () => {
        this.renderNavigation();
      }, window.addEventListener("navigation:icons:updated", this._navIconsHandler), this._navItemsChangedHandler = () => {
        this._itemsChangedCallback ? this._itemsChangedCallback() : this.renderNavigation();
      }, window.addEventListener("navigation:items:changed", this._navItemsChangedHandler), { success: !0 };
    } catch (t) {
      return this._status = "error", this._lastError = t.message, { success: !1, error: t.message };
    }
  }
  _emitDegraded(t, r) {
    try {
      this._degradedComponents.includes(t) || this._degradedComponents.push(t), this._status = "degraded", this._lastError = r;
      const n = Fv("eventBus");
      n != null && n.emit && n.emit(f.DEGRADED, {
        source: xd,
        component: t,
        error: r,
        degradedComponents: this._degradedComponents,
        timestamp: Date.now()
      });
    } catch {
    }
  }
  setItemsChangedCallback(t) {
    this._itemsChangedCallback = t;
  }
  setContainer(t) {
    this._container = t;
  }
  render() {
    try {
      if (!this._container)
        return this._emitDegraded("container", "No container provided"), { success: !1, error: "No container" };
      if (typeof Xu == "function") {
        const t = Xu({ title: this._options.title || "DshowDash" });
        this._container.textContent = "", this._container.appendChild(t), this._sidebar = t;
      } else {
        const t = gv({ title: this._options.title || "DshowDash" });
        this._container.innerHTML = t, this._sidebar = this._container.querySelector(`.${c.ROOT}`);
      }
      return this._sidebar ? (this.renderNavigation(), this._setupRipple(), this._metrics.renders++, this._status = this._degradedComponents.length > 0 ? "degraded" : "healthy", { success: !0 }) : (this._emitDegraded("sidebar", "Sidebar element not created"), { success: !1, error: "Sidebar element not created" });
    } catch (t) {
      return this._metrics.errors++, this._emitDegraded("render", t.message), this._renderFallback(), { success: !1, error: t.message, fallback: !0 };
    }
  }
  renderNavigation() {
    const t = Ov(this._sidebar, this._expandedSections, this._activeItemId, this._degradedComponents);
    return (t.success || t.fallback) && this._setupRipple(), t;
  }
  _renderFallback() {
    this._sidebar = Tv(this._container);
  }
  _setupAccordionHandlers() {
    const t = this;
    this._sectionClickHandler && td(this._sidebar, this._sectionClickHandler), this._sectionClickHandler = Yv(this._sidebar, this._expandedSections, (r) => t.toggleSectionUI(r));
  }
  toggleSectionUI(t) {
    return Gv(this._sidebar, t, this._expandedSections);
  }
  expandSectionUI(t) {
    return Gl(this._sidebar, t, this._expandedSections);
  }
  collapseSectionUI(t) {
    return Mh(this._sidebar, t, this._expandedSections);
  }
  syncExpandedSections(t) {
    return Vv(this._sidebar, t, this._expandedSections);
  }
  preloadExpandedSections(t) {
    return qv(t, this._expandedSections);
  }
  setActiveItem(t) {
    return this._activeItemId = t, Dv(this._sidebar, t, this._expandedSections);
  }
  setCollapsed(t) {
    return Lv(this._sidebar, t);
  }
  setMobileOpen(t) {
    return this._mobileOpen = t, $v(this._sidebar, t);
  }
  announce(t) {
    return kv(this._sidebar, t);
  }
  filterItems(t) {
    const r = Nv(this._sidebar, t, this._expandedSections);
    return this._setupRipple(), r;
  }
  clearSearch() {
    return Rv(this._sidebar, this._expandedSections);
  }
  showSkeleton(t = 8) {
    return Hv(this._sidebar, t);
  }
  hideSkeleton() {
    const t = zv(this._sidebar);
    return t && this.renderNavigation(), t;
  }
  setLoading(t) {
    return Uv(this._sidebar, t);
  }
  _setupRipple() {
    this._rippleCleanup && this._rippleCleanup(), this._rippleCleanup = Bv(this._sidebar);
  }
  showOverlay() {
    return pv();
  }
  hideOverlay() {
    return Ev();
  }
  getSidebar() {
    return this._sidebar;
  }
  getContainer() {
    return this._container;
  }
  getExpandedSections() {
    return Array.from(this._expandedSections);
  }
  getMetrics() {
    return Object.assign({}, this._metrics);
  }
  reset() {
    this._activeItemId = null, this._mobileOpen = !1, this._status = "healthy", this._lastError = null, this._degradedComponents = [], this._expandedSections.clear();
  }
  destroy() {
    try {
      return this._sectionClickHandler && (td(this._sidebar, this._sectionClickHandler), this._sectionClickHandler = null), this._rippleCleanup && (this._rippleCleanup(), this._rippleCleanup = null), this._navIconsHandler && (window.removeEventListener("navigation:icons:updated", this._navIconsHandler), this._navIconsHandler = null), this._navItemsChangedHandler && (window.removeEventListener("navigation:items:changed", this._navItemsChangedHandler), this._navItemsChangedHandler = null), this._container && (this._container.textContent = ""), this._sidebar = null, this._container = null, this._initialized = !1, this.reset(), Pa.activeInstances--, ol === this && (ol = null), { success: !0 };
    } catch (t) {
      return { success: !1, error: t.message };
    }
  }
  healthCheck() {
    const t = this;
    return xv(() => ({
      container: t._container,
      sidebar: t._sidebar,
      initialized: t._initialized,
      activeItemId: t._activeItemId,
      mobileOpen: t._mobileOpen,
      expandedSections: t._expandedSections,
      degradedComponents: t._degradedComponents,
      lastError: t._lastError,
      sectionClickHandler: t._sectionClickHandler,
      rippleCleanup: !!t._rippleCleanup,
      status: t._status,
      metrics: t._metrics,
      portsInitialized: vi.isInitialized()
    }))();
  }
  info() {
    const t = this;
    return Pv(() => ({
      activeItemId: t._activeItemId,
      mobileOpen: t._mobileOpen,
      expandedSections: t._expandedSections,
      degradedComponents: t._degradedComponents,
      status: t._status,
      metrics: t._metrics,
      portsInitialized: vi.isInitialized(),
      features: { skeleton: !0, ripple: !!t._rippleCleanup, loading: !0 }
    }), () => t.healthCheck())();
  }
}
function Wv(e) {
  const t = new Kv(e);
  return t.init(), ol = t, t;
}
function Xv(e) {
  e === void 0 && (e = {});
  const t = e.logger;
  e.tracker;
  const r = e.metricsManager;
  return {
    async execute(n, s) {
      var i, o, a, l, u, d;
      n === void 0 && (n = {}), r.incrementInits(), Al("initializing");
      try {
        t.info("Initializing Sidebar V6.9 ES6..."), await U_() || _e("css", "CSS failed to load");
        try {
          await Fl();
        } catch (m) {
          _e("config", m.message);
        }
        const g = Ky(n);
        s.config = g, s.safeMode = g.safeMode === !0 || n.safeMode === !0, s.safeMode && (r.incrementSafeModeBoots(), t.info("SafeMode ACTIVE - minimal boot")), s.adapters = cv({ containerSelector: g.containerSelector }), s.ports = uv(s.adapters);
        try {
          s.engine = Dy({
            defaultCollapsed: ((i = g.settings) == null ? void 0 : i.defaultCollapsed) ?? !1,
            accordion: g.accordion ?? { allowMultipleOpen: !0, persistState: !0 }
          }), s.engine.setPorts(s.ports), await s.engine.init();
        } catch (m) {
          return r.incrementErrors(), ei(m, { phase: "engine-init" }), { success: !1, error: m.message };
        }
        if (!s.safeMode)
          try {
            t.info("P24: Loading NavigationModel...");
            const m = await k.load();
            s.modelLoaderInitialized = !0, r.incrementModelLoaderCalls(), m.success ? t.info(`P24: NavigationModel loaded from ${m.source}`, {
              sectionsCount: ((a = (o = m.model) == null ? void 0 : o.sections) == null ? void 0 : a.length) || 0,
              source: m.source
            }) : t.warn("P24: NavigationModel load failed, will fallback to Registry", {
              reason: m.reason || m.error
            });
          } catch (m) {
            _e("navigation-model-loader", m.message), t.warn("P24: NavigationModelLoader failed, continuing with Registry fallback", {
              error: m.message
            });
          }
        try {
          await B_(
            () => w.loadFromAPI(),
            qa.maxRetries,
            qa.retryDelay
          );
        } catch (m) {
          _e("registry", m.message);
        }
        try {
          w.applyPermissionFilter();
        } catch (m) {
          _e("permissions-filter", m.message);
        }
        try {
          s.engine.loadSections(w.getSections()), s.engine.loadItems(w.getItems());
        } catch (m) {
          _e("engine-load", m.message);
        }
        try {
          await s.engine.mount();
        } catch (m) {
          _e("engine-mount", m.message);
        }
        try {
          s.renderer = Wv({ title: (l = g.header) == null ? void 0 : l.title });
        } catch (m) {
          return r.incrementErrors(), ei(m, { phase: "renderer-create" }), { success: !1, error: m.message };
        }
        try {
          const m = (d = (u = s.adapters.ui).getContainer) == null ? void 0 : d.call(u);
          if (!m) throw new Error("Container not found");
          s.renderer.setContainer(m);
          const y = s.engine.getExpandedSections();
          y && y.length > 0 && (s.renderer.preloadExpandedSections(y), t.info(`Accordion state preloaded from engine: ${y.length} sections`, {
            sectionIds: y
          })), s.renderer.render();
        } catch (m) {
          return r.incrementErrors(), ei(m, { phase: "render" }), { success: !1, error: m.message };
        }
        return { success: !0, config: g };
      } catch (h) {
        return r.incrementErrors(), ei(h, { phase: "init" }), t.error("Init failed:", h), { success: !1, error: h.message };
      }
    }
  };
}
function Zv(e) {
  const { engine: t, renderer: r, logger: n, getPort: s } = e, i = s("layoutManager");
  let o = !1, a = "default";
  i && typeof i.isSidebarCollapsed == "function" ? (o = i.isSidebarCollapsed(), a = "LayoutManager", n.info("Collapsed state from LayoutManager", { collapsed: o })) : (o = document.body.classList.contains("sidebar-collapsed"), a = "body-class", n.warn("LayoutManager not available, using body class as fallback", { collapsed: o })), o ? t.collapse() : t.expand(), r.setCollapsed(o);
  const l = r.getSidebar();
  if (l) {
    l.classList.toggle(c.MOD_COLLAPSED, o);
    const d = l.querySelector(`.${c.TOGGLE}`);
    d && (d.setAttribute("aria-expanded", String(!o)), d.setAttribute("aria-label", o ? "Expandir menu" : "Recolher menu"));
  }
  const u = document.body.classList.contains("sidebar-collapsed");
  return u !== o && i && typeof i.setSidebarCollapsed == "function" && (n.warn("Body class mismatch, requesting LayoutManager sync", {
    bodyHasClass: u,
    shouldBeCollapsed: o
  }), i.setSidebarCollapsed(o)), n.info("Initial state synced (LayoutManager-Driven)", {
    shouldBeCollapsed: o,
    source: a,
    bodyClassMatch: document.body.classList.contains("sidebar-collapsed") === o
  }), { shouldBeCollapsed: o, source: a };
}
let zn = null, Ha = 0;
function Jv(e) {
  const { engine: t, renderer: r, tracker: n, logger: s, getPort: i } = e, o = i("eventBus");
  if (!o)
    return s.warn("EventBus not available for layout listener"), null;
  zn && (zn(), zn = null), Ha = 0;
  const a = (h) => {
    if (t.collapsed === h) return;
    Ha++, s.info("External collapse change received", { collapsed: h }), h ? t.collapse() : t.expand(), r.setCollapsed(h);
    const g = r.getSidebar();
    if (g) {
      g.classList.toggle(c.MOD_COLLAPSED, h);
      const m = g.querySelector(`.${c.TOGGLE}`);
      m && (m.setAttribute("aria-expanded", String(!h)), m.setAttribute("aria-label", h ? "Expandir menu" : "Recolher menu"));
    }
    n.track("external-collapse", { collapsed: h });
  }, l = (h) => {
    if (!h || h.source === "sidebar" || h.source === "sidebar-toggle") return;
    const g = h.mode;
    g === "sidebar-collapsed" ? a(!0) : g === "sidebar-expanded" && a(!1);
  }, u = o.on(Qs.REQUEST, l), d = o.on(Qs.SIDEBAR_CHANGED, l);
  return s.info("Layout listener connected (bidirectional sync)"), zn = () => {
    typeof u == "function" ? u() : o.off && o.off(Qs.REQUEST, l), typeof d == "function" ? d() : o.off && o.off(Qs.SIDEBAR_CHANGED, l);
  }, {
    cleanup: zn,
    getExternalCollapseCount: () => Ha
  };
}
const Pi = "6.1.0-ES6", us = "sidebar-keyboard-navigation";
let Dr = { keystrokes: 0, shortcuts: 0, navigations: 0, errors: 0 }, fn = [], ds = -1;
const pt = v({ moduleId: us });
function Oh() {
  pt.init();
}
function al(e) {
  return pt.get(e);
}
function Th(e) {
  return pt.inject(e);
}
function Dh() {
  return pt.snapshot();
}
function Qv(e) {
  return Array.from(e.querySelectorAll(`.${c.LINK}:not([aria-disabled="true"])`));
}
function Qr(e, t) {
  t < 0 || t >= e.length || (e[t] && e[t].focus(), ds = t, Dr.navigations++);
}
function Lh(e) {
  e && pt.inject({ eventBus: e }), Oh();
  const t = al("eventBus");
  t && t.emit && t.emit(f.KEYBOARD_INITIALIZED);
}
function Vl(e) {
  const { container: t, eventBus: r, onNavigate: n, onToggleSection: s } = e || {};
  if (!t) return () => {
  };
  r && pt.inject({ eventBus: r }), Oh();
  const i = (a) => {
    Dr.keystrokes++;
    try {
      const l = Qv(t), u = document.activeElement;
      let d = l.indexOf(u);
      switch (d === -1 && (d = ds), a.key) {
        case "ArrowDown":
          a.preventDefault(), Qr(l, Math.min(d + 1, l.length - 1));
          break;
        case "ArrowUp":
          a.preventDefault(), Qr(l, Math.max(d - 1, 0));
          break;
        case "Home":
          a.preventDefault(), Qr(l, 0);
          break;
        case "End":
          a.preventDefault(), Qr(l, l.length - 1);
          break;
        case "PageDown":
          a.preventDefault(), Qr(l, Math.min(d + 5, l.length - 1));
          break;
        case "PageUp":
          a.preventDefault(), Qr(l, Math.max(d - 5, 0));
          break;
        case "Enter":
        case " ":
          if (u && u.classList.contains(c.LINK)) {
            const h = u.closest(`.${c.ITEM}`), g = h ? h.dataset.itemId : null;
            g && (a.preventDefault(), n && n(g), u.click());
          } else if (u && u.classList.contains(c.GROUP_BUTTON)) {
            const h = u.closest(`.${c.SECTION}`), g = h ? h.dataset.sectionId : null;
            g && (a.preventDefault(), s && s(g));
          }
          break;
        case "ArrowRight":
          if (u) {
            const h = u.closest(`.${c.SECTION}`);
            if (h && h.classList.contains(c.SECTION_COLLAPSIBLE) && !h.classList.contains(c.SECTION_EXPANDED)) {
              a.preventDefault();
              const g = h.dataset.sectionId;
              s && s(g);
            }
          }
          break;
        case "ArrowLeft":
          if (u) {
            const h = u.closest(`.${c.SECTION}`);
            if (h && h.classList.contains(c.SECTION_EXPANDED)) {
              a.preventDefault();
              const g = h.dataset.sectionId;
              s && s(g);
            }
          }
          break;
        case "/":
          if (!a.ctrlKey && !a.metaKey && !a.altKey) {
            const h = t.querySelector(`.${c.SEARCH_INPUT}`);
            h && document.activeElement !== h && (a.preventDefault(), h.focus());
          }
          break;
      }
    } catch {
      Dr.errors++;
    }
  };
  t.addEventListener("keydown", i), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1");
  const o = () => t.removeEventListener("keydown", i);
  return fn.push(o), o;
}
function ql(e) {
  const { eventBus: t, shortcut: r = "b", modifier: n = "ctrl", onToggle: s } = e || {}, i = (a) => {
    if ((n === "ctrl" ? a.ctrlKey : n === "alt" ? a.altKey : n === "meta" ? a.metaKey : n === "shift" ? a.shiftKey : !1) && a.key.toLowerCase() === r.toLowerCase())
      if (a.preventDefault(), Dr.shortcuts++, s)
        s();
      else {
        const u = al("sidebar");
        if (u && u.toggle)
          u.toggle();
        else {
          const d = al("eventBus");
          d && d.emit && d.emit(f.TOGGLE, { source: "keyboard-shortcut" });
        }
      }
  };
  document.addEventListener("keydown", i);
  const o = () => document.removeEventListener("keydown", i);
  return fn.push(o), o;
}
function Yl() {
  fn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), fn = [], ds = -1;
}
function Hi() {
  return { ...Dr };
}
function $h() {
  return { moduleId: us, version: Pi, focusedIndex: ds, cleanupCount: fn.length, metrics: Hi(), portsInitialized: pt.isInitialized() };
}
function kh() {
  return { status: Dr.errors === 0 ? "HEALTHY" : "DEGRADED", version: Pi, moduleId: us, checks: { noErrors: Dr.errors === 0, cleanupCount: fn.length, focusedIndex: ds, portsInitialized: pt.isInitialized() }, portsInitialized: pt.isInitialized(), metrics: Hi() };
}
var eI = { init: Lh, setupKeyboardNavigation: Vl, setupGlobalShortcut: ql, destroy: Yl, injectPorts: Th, getPorts: Dh, getMetrics: Hi, info: $h, healthCheck: kh, VERSION: Pi, MODULE_ID: us };
const tI = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: us,
  VERSION: Pi,
  default: eI,
  destroy: Yl,
  getMetrics: Hi,
  getPorts: Dh,
  healthCheck: kh,
  info: $h,
  init: Lh,
  injectPorts: Th,
  setupGlobalShortcut: ql,
  setupKeyboardNavigation: Vl
}, Symbol.toStringTag, { value: "Module" })), zi = "6.1.0-ES6", hs = "sidebar-mobile-handler";
let nt = !1, ve = !1, ot = [], or = { toggles: 0, detects: 0, overlayClicks: 0, swipes: 0, errors: 0 };
const rI = 50, nI = 0.3, Et = v({ moduleId: hs });
function wh() {
  Et.init();
}
function Bi(e) {
  return Et.get(e);
}
function Nh(e) {
  return Et.inject(e);
}
function Rh() {
  return Et.snapshot();
}
function xh(e, t) {
  e && Et.inject({ eventBus: e }), wh();
  const r = Bi("eventBus");
  r && r.emit && r.emit(f.MOBILE_HANDLER_INITIALIZED);
}
function Kl(e) {
  const { container: t, eventBus: r, breakpoint: n = 768 } = e || {};
  r && Et.inject({ eventBus: r }), wh();
  const s = () => {
    const i = nt;
    if (nt = window.innerWidth < n, or.detects++, i !== nt) {
      const o = Bi("eventBus");
      o && o.emit && o.emit(f.MOBILE_CHANGED, { isMobile: nt }), nt ? (t && t.classList.add(c.MOD_MOBILE), document.body.classList.add("has-mobile-sidebar")) : (t && t.classList.remove(c.MOD_MOBILE, c.MOD_MOBILE_OPEN), document.body.classList.remove("has-mobile-sidebar", "sidebar-mobile-open"), ve = !1);
    }
  };
  return s(), window.addEventListener("resize", s), ot.push(() => window.removeEventListener("resize", s)), () => fs();
}
function Wl(e) {
  return Kl(e);
}
function Ph(e) {
  const { container: t, eventBus: r, onOpen: n, onClose: s } = e || {};
  if (!t) return () => {
  };
  let i = 0, o = 0, a = 0, l = !1;
  const u = (y) => {
    i = y.touches[0].clientX, o = y.touches[0].clientY, a = Date.now(), l = !1;
  }, d = (y) => {
    if (!i) return;
    const S = y.touches[0].clientX - i, x = y.touches[0].clientY - o;
    Math.abs(S) > Math.abs(x) && Math.abs(S) > 10 && (l = !0);
  }, h = (y) => {
    if (!l) return;
    const x = y.changedTouches[0].clientX - i, Ae = Date.now() - a, Me = Math.abs(x) / Ae;
    (Math.abs(x) > rI || Me > nI) && (or.swipes++, x > 0 && !ve ? sI(t, n) : x < 0 && ve && Hh(t, s)), i = 0, o = 0, l = !1;
  }, g = 20, m = (y) => {
    y.touches[0].clientX < g && !ve && u(y);
  };
  return document.addEventListener("touchstart", m, { passive: !0 }), t.addEventListener("touchstart", u, { passive: !0 }), t.addEventListener("touchmove", d, { passive: !0 }), t.addEventListener("touchend", h, { passive: !0 }), ot.push(() => document.removeEventListener("touchstart", m)), ot.push(() => t.removeEventListener("touchstart", u)), ot.push(() => t.removeEventListener("touchmove", d)), ot.push(() => t.removeEventListener("touchend", h)), () => fs();
}
function Xl(e) {
  const { container: t, eventBus: r, onClose: n } = e || {};
  let s = document.querySelector(".dsd-sidebar-overlay");
  s || (s = document.createElement("div"), s.className = "dsd-sidebar-overlay", s.setAttribute("aria-hidden", "true"), document.body.appendChild(s));
  const i = () => {
    or.overlayClicks++, Hh(t, n);
  };
  return s.addEventListener("click", i), ot.push(() => s.removeEventListener("click", i)), {
    show: () => {
      s.classList.add("dsd-sidebar-overlay--visible"), document.body.classList.add("sidebar-mobile-open");
    },
    hide: () => {
      s.classList.remove("dsd-sidebar-overlay--visible"), document.body.classList.remove("sidebar-mobile-open");
    },
    destroy: () => s.remove()
  };
}
function sI(e, t) {
  ve = !0, or.toggles++, e && e.classList.add(c.MOD_MOBILE_OPEN), document.body.classList.add("sidebar-mobile-open");
  const r = document.querySelector(".dsd-sidebar-overlay");
  r && r.classList.add("dsd-sidebar-overlay--visible");
  const n = Bi("eventBus");
  n && n.emit && n.emit(f.MOBILE_OPENED, { source: "swipe" }), t && t();
}
function Hh(e, t) {
  ve = !1, or.toggles++, e && e.classList.remove(c.MOD_MOBILE_OPEN), document.body.classList.remove("sidebar-mobile-open");
  const r = document.querySelector(".dsd-sidebar-overlay");
  r && r.classList.remove("dsd-sidebar-overlay--visible");
  const n = Bi("eventBus");
  n && n.emit && n.emit(f.MOBILE_CLOSED, { source: "swipe" }), t && t();
}
function zh(e) {
  return ve = e ?? !ve, or.toggles++, ve;
}
function Bh() {
  return nt;
}
function Uh() {
  return ve;
}
function Ui() {
  return { ...or };
}
function fs() {
  ot.forEach((t) => {
    try {
      t();
    } catch {
    }
  }), ot = [], nt = !1, ve = !1;
  const e = document.querySelector(".dsd-sidebar-overlay");
  e && e.remove();
}
function jh() {
  return { moduleId: hs, version: zi, isMobile: nt, isOpen: ve, cleanups: ot.length, metrics: Ui(), portsInitialized: Et.isInitialized() };
}
function Fh() {
  return { status: "HEALTHY", version: zi, moduleId: hs, checks: { isMobile: nt, isOpen: ve, noErrors: or.errors === 0, noOrphanListeners: !0, portsInitialized: Et.isInitialized() }, portsInitialized: Et.isInitialized(), metrics: Ui() };
}
var iI = { init: xh, setupMobileHandler: Kl, setupMobileDetect: Wl, setupSwipeGestures: Ph, setupOverlayClick: Xl, toggleMobile: zh, isMobile: Bh, isOpen: Uh, destroy: fs, injectPorts: Nh, getPorts: Rh, getMetrics: Ui, info: jh, healthCheck: Fh, VERSION: zi, MODULE_ID: hs };
const oI = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: hs,
  VERSION: zi,
  default: iI,
  destroy: fs,
  getMetrics: Ui,
  getPorts: Rh,
  healthCheck: Fh,
  info: jh,
  init: xh,
  injectPorts: Nh,
  isMobile: Bh,
  isOpen: Uh,
  setupMobileDetect: Wl,
  setupMobileHandler: Kl,
  setupOverlayClick: Xl,
  setupSwipeGestures: Ph,
  toggleMobile: zh
}, Symbol.toStringTag, { value: "Module" }));
function aI(e) {
  e === void 0 && (e = {});
  const t = e.logger, r = e.tracker, n = e.getPort, s = e.emitDegraded;
  let i = null, o = [];
  return {
    setupCore(a) {
      const l = a.engine, u = a.renderer, d = a.registry, h = a.adapters, g = a.onToggle, m = a.onSetActiveItem, y = a.onToggleSection;
      try {
        Zv({
          engine: l,
          renderer: u,
          logger: t,
          getPort: n
        });
      } catch (S) {
        s("restore-state", S.message);
      }
      try {
        i = Jv({
          engine: l,
          renderer: u,
          tracker: r,
          logger: t,
          getPort: n
        }), i && i.cleanup && o.push(i.cleanup);
      } catch (S) {
        s("layout-listener", S.message);
      }
      try {
        const S = u.getSidebar();
        S && kl(S, {
          registry: d,
          routerAdapter: h.router,
          engine: l,
          renderer: u,
          onToggle: g,
          onSetActiveItem: m,
          onToggleSection: y
        });
      } catch (S) {
        s("setup-events", S.message);
      }
    },
    setupPostReady(a) {
      const l = a.engine, u = a.renderer, d = a.registry, h = a.adapters, g = a.onToggle, m = a.onSetActiveItem, y = a.onExpandSection, S = a.onCollapseSection, x = a.onCloseMobile, Ae = a.onReloadNavigation, Me = u.getSidebar();
      try {
        if (Me) {
          const _ = Vl(Me, {
            onExpandSection: y,
            onCollapseSection: S
          });
          o.push(_);
          const A = ql(g);
          o.push(A);
        }
      } catch (_) {
        s("keyboard-nav", _.message);
      }
      try {
        const _ = Wl({
          onMobileChange(ce) {
            l.setMobile(ce);
          },
          onCloseMobile: x
        });
        o.push(_);
        const A = Xl(x);
        o.push(A);
      } catch (_) {
        s("mobile-detect", _.message);
      }
      try {
        const _ = wl({
          routerAdapter: h.router,
          registry: d,
          onSetActiveItem: m,
          onReloadNavigation: Ae
        });
        o.push(_);
      } catch (_) {
        s("sync-router", _.message);
      }
    },
    getLayoutListener() {
      return i;
    },
    getCleanups() {
      return o.slice();
    },
    addCleanup(a) {
      o.push(a);
    },
    cleanup() {
      i && i.cleanup && (i.cleanup(), i = null), o.forEach((a) => {
        try {
          a();
        } catch {
        }
      }), o = [];
    }
  };
}
function lI(e) {
  e === void 0 && (e = {});
  const t = e.logger;
  return {
    execute(r, n) {
      try {
        return n && n.cleanup(), Yl(), fs(), Rl(), Qn(), r.engine && (r.engine.destroy(), r.engine = null), r.renderer && (r.renderer.destroy(), r.renderer = null), r.adapters && r.adapters.router && r.adapters.router.destroy && r.adapters.router.destroy(), k.abort && k.abort(), N_(), r.initialized = !1, r.initAt = null, r.safeMode = !1, r.modelLoaderInitialized = !1, Al("destroyed"), t.info("Sidebar destroyed"), { success: !0 };
      } catch (s) {
        return t.error("Destroy error:", s), { success: !1, error: s.message };
      }
    }
  };
}
function cI() {
  const e = {
    inits: 0,
    toggles: 0,
    navigations: 0,
    errors: 0,
    externalCollapses: 0,
    modelLoaderCalls: 0,
    safeModeBoots: 0
  };
  return {
    increment(t) {
      e.hasOwnProperty(t) && e[t]++;
    },
    get(t) {
      return e[t];
    },
    getAll() {
      return Object.assign({}, e);
    },
    set(t, r) {
      e.hasOwnProperty(t) && (e[t] = r);
    },
    reset() {
      e.inits = 0, e.toggles = 0, e.navigations = 0, e.errors = 0, e.externalCollapses = 0, e.modelLoaderCalls = 0, e.safeModeBoots = 0;
    },
    incrementInits() {
      e.inits++;
    },
    incrementToggles() {
      e.toggles++;
    },
    incrementNavigations() {
      e.navigations++;
    },
    incrementErrors() {
      e.errors++;
    },
    incrementExternalCollapses() {
      e.externalCollapses++;
    },
    incrementModelLoaderCalls() {
      e.modelLoaderCalls++;
    },
    incrementSafeModeBoots() {
      e.safeModeBoots++;
    }
  };
}
function uI(e = {}) {
  const t = e.getContext, r = e.metricsManager, n = e.setupCoordinator, s = e.portsManager;
  return {
    healthCheck() {
      var d, h;
      const i = t(), o = {
        initialized: i.initialized,
        engineReady: !!i.engine,
        rendererReady: !!i.renderer,
        registryLoaded: ((d = w.getItems()) == null ? void 0 : d.length) > 0,
        portsInitialized: s.isInitialized(),
        layoutListenerConnected: !!n.getLayoutListener(),
        modelLoaderInitialized: i.modelLoaderInitialized
      }, a = Object.values(o).filter(Boolean).length, l = Object.keys(o).length;
      let u = "HEALTHY";
      return a < l && a >= Math.floor(l * 0.6) && (u = "DEGRADED"), a < Math.floor(l * 0.6) && (u = "UNHEALTHY"), {
        status: u,
        score: { passed: a, total: l, percentage: Math.round(a / l * 100) },
        checks: o,
        issues: Rd().map((g) => ({
          code: g,
          severity: "warn",
          message: `Component degraded: ${g}`
        })),
        moduleId: le,
        version: mr,
        safeMode: i.safeMode,
        metrics: this.getMetrics(),
        ports: { initialized: s.isInitialized(), missing: [] },
        modelLoaderHealth: ((h = k.healthCheck) == null ? void 0 : h.call(k)) ?? { healthy: !1 },
        timestamp: Date.now()
      };
    },
    info() {
      var a, l, u, d;
      const i = t(), o = ((a = k.info) == null ? void 0 : a.call(k)) ?? {};
      return {
        moduleId: le,
        version: mr,
        initialized: i.initialized,
        status: Za(),
        safeMode: i.safeMode,
        collapsed: ((l = i.engine) == null ? void 0 : l.collapsed) || !1,
        expandedSections: ((d = (u = i.engine) == null ? void 0 : u.getExpandedSections) == null ? void 0 : d.call(u)) ?? [],
        keyboardNavEnabled: i.keyboardNavEnabled,
        metrics: this.getMetrics(),
        portsInitialized: s.isInitialized(),
        p24ModelFirst: !0,
        modelLoaderInitialized: i.modelLoaderInitialized,
        modelLoaderInfo: o,
        health: this.healthCheck()
      };
    },
    getManifest() {
      var u, d, h, g;
      const i = t(), o = ((u = w.getSections) == null ? void 0 : u.call(w)) || [], a = ((d = w.getItems) == null ? void 0 : d.call(w)) || [], l = ((h = k.info) == null ? void 0 : h.call(k)) ?? {};
      return {
        registryId: le,
        version: mr,
        loadedAt: i.initAt,
        itemCount: o.length + a.length,
        sections: o.map((m) => m.id),
        items: a.map((m) => m.id),
        initialized: i.initialized,
        safeMode: i.safeMode,
        collapsed: ((g = i.engine) == null ? void 0 : g.collapsed) || !1,
        metrics: this.getMetrics(),
        p24ModelFirst: !0,
        // @ts-expect-error strict migration — TS2339
        modelLoaderSource: l.source || "none",
        modelLoaderHasModel: l.hasModel || !1,
        timestamp: Date.now()
      };
    },
    getMetrics() {
      var d, h, g, m, y, S, x, Ae, Me, _;
      const i = t(), o = n.getLayoutListener(), a = ((d = o == null ? void 0 : o.getExternalCollapseCount) == null ? void 0 : d.call(o)) || r.get("externalCollapses"), l = ((h = k.info) == null ? void 0 : h.call(k)) ?? {}, u = r.getAll();
      return Object.assign({}, u, {
        externalCollapses: a,
        status: Za(),
        initialized: i.initialized,
        safeMode: i.safeMode,
        sectionsCount: ((m = (g = w.getSections) == null ? void 0 : g.call(w)) == null ? void 0 : m.length) || 0,
        itemsCount: ((S = (y = w.getItems) == null ? void 0 : y.call(w)) == null ? void 0 : S.length) || 0,
        expandedSections: ((Me = (Ae = (x = i.engine) == null ? void 0 : x.getExpandedSections) == null ? void 0 : Ae.call(x)) == null ? void 0 : Me.length) || 0,
        collapsed: ((_ = i.engine) == null ? void 0 : _.collapsed) || !1,
        toggleMetrics: gh(),
        portsInitialized: s.isInitialized(),
        modelLoaderInitialized: i.modelLoaderInitialized,
        // @ts-expect-error strict migration — TS2339
        modelLoaderSource: l.source || "none"
      });
    }
  };
}
const si = "6.5.1-IMPORT-FIX", Zl = v({ moduleId: le });
function dI() {
  Zl.init();
}
function Ii(e) {
  return Zl.get(e);
}
function hI() {
  return Ii("eventBus") || Ii("eventBusGlobal");
}
function fI() {
  const e = Ii("routerGlobal");
  if (e && e.getCurrentRoute)
    try {
      const t = e.getCurrentRoute();
      if (t && (t.hash || t.path)) return t.hash || t.path;
    } catch {
    }
  return typeof window < "u" && window.location && window.location.hash || "#/";
}
class gI {
  constructor() {
    this._logger = wy({ debug: !1 }), this._tracker = xy({ enabled: !0 }), this._keyboardNavEnabled = r_.enabled, this._context = {
      engine: null,
      renderer: null,
      adapters: {},
      ports: null,
      config: null,
      initialized: !1,
      initAt: null,
      safeMode: !1,
      modelLoaderInitialized: !1,
      keyboardNavEnabled: this._keyboardNavEnabled
    }, this._metricsManager = cI(), this._setupCoordinator = aI({
      logger: this._logger,
      tracker: this._tracker,
      getPort: Ii,
      emitDegraded: _e
    }), this._initializer = Xv({
      logger: this._logger,
      tracker: this._tracker,
      metricsManager: this._metricsManager
    }), this._destroyer = lI({
      logger: this._logger
    }), this._healthReporter = uI({
      getContext: () => this._context,
      metricsManager: this._metricsManager,
      setupCoordinator: this._setupCoordinator,
      portsManager: Zl
    }), w_(this._logger, this._tracker), Ol(this._logger, this._tracker), this._logger, dI();
  }
  get status() {
    return Za();
  }
  async init(t) {
    var s;
    if (t === void 0 && (t = {}), this._context.initialized)
      return this._logger.warn("Already initialized"), { success: !0, message: "Already initialized" };
    const r = await this._initializer.execute(t, this._context);
    if (!r.success)
      return r;
    this._setupCoordinator.setupCore({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: w,
      adapters: this._context.adapters,
      onToggle: () => this.toggle(),
      onSetActiveItem: (i) => this._setActiveItem(i),
      onToggleSection: (i) => this.toggleSection(i)
    }), this._context.safeMode ? this._logger.info("SafeMode: Skipping POST_READY features") : this._setupCoordinator.setupPostReady({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: w,
      adapters: this._context.adapters,
      onToggle: () => this.toggle(),
      onSetActiveItem: (i) => this._setActiveItem(i),
      onExpandSection: (i) => this.expandSection(i),
      onCollapseSection: (i) => this.collapseSection(i),
      onCloseMobile: () => this.closeMobile(),
      onReloadNavigation: () => this._reloadNavigation()
    });
    try {
      await this._context.engine.ready();
    } catch (i) {
      _e("engine-ready", i.message);
    }
    (s = this._context.renderer) != null && s.setItemsChangedCallback && this._context.renderer.setItemsChangedCallback(() => this._reloadNavigation()), this._bindPublicMethods(), this._context.initialized = !0, this._context.initAt = Date.now();
    const n = Rd();
    return Al(n.length > 0 ? "degraded" : "healthy"), this._emitReadyEvent(), this._logger.info(`Sidebar V6.5 ES6 initialized (${this.status})`, {
      version: si,
      safeMode: this._context.safeMode,
      degradedComponents: n,
      modelLoaderInitialized: this._context.modelLoaderInitialized
    }), this._tracker.track("initialized", {
      version: si,
      status: this.status,
      safeMode: this._context.safeMode
    }), { success: !0, version: si, status: this.status, safeMode: this._context.safeMode };
  }
  _emitReadyEvent() {
    const t = hI();
    t && t.emit && (t.emit(f.READY, {
      version: si,
      status: this.status,
      safeMode: this._context.safeMode,
      timestamp: Date.now()
    }), this._logger.info("SIDEBAR_EVENTS.READY emitted"));
  }
  _setActiveItem(t) {
    try {
      this._metricsManager.incrementNavigations(), this._context.engine.setActiveItem(t), this._context.renderer.setActiveItem(t);
    } catch (r) {
      this._logger.error("setActiveItem error:", r);
    }
  }
  async _reloadNavigation() {
    return Oy({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: w,
      adapters: this._context.adapters,
      logger: this._logger,
      metrics: this._metricsManager.getAll(),
      modelLoaderInitialized: this._context.modelLoaderInitialized,
      getCurrentHash: fI
    });
  }
  _bindPublicMethods() {
    var s, i;
    const t = this, r = {
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: w,
      routerAdapter: this._context.adapters.router,
      permissionsAdapter: this._context.adapters.permissions,
      tracker: this._tracker,
      logger: this._logger
    }, n = Yy(r);
    this.toggle = () => (t._metricsManager.incrementToggles(), n.toggle.call(t)), this.collapse = n.collapse.bind(this), this.expand = n.expand.bind(this), this.forceSync = (s = n.forceSync) == null ? void 0 : s.bind(this), this.getToggleMetrics = (i = n.getToggleMetrics) == null ? void 0 : i.bind(this), this.toggleSection = n.toggleSection.bind(this), this.expandSection = n.expandSection.bind(this), this.collapseSection = n.collapseSection.bind(this), this.expandAllSections = n.expandAllSections.bind(this), this.collapseAllSections = n.collapseAllSections.bind(this), this.isSectionExpanded = n.isSectionExpanded.bind(this), this.getExpandedSections = n.getExpandedSections.bind(this), this.setAccordionMode = n.setAccordionMode.bind(this), this.openMobile = n.openMobile.bind(this), this.closeMobile = n.closeMobile.bind(this), this.toggleMobile = n.toggleMobile.bind(this), this.navigate = (o) => (t._metricsManager.incrementNavigations(), n.navigate.call(t, o)), this.setBadge = n.setBadge.bind(this), this.refresh = n.refresh.bind(this), this.getState = Wy(this._context.engine), this.healthCheck = () => t._healthReporter.healthCheck(), this.info = () => t._healthReporter.info(), this.getManifest = () => t._healthReporter.getManifest(), this.getMetrics = () => t._healthReporter.getMetrics();
  }
  destroy() {
    this._destroyer.execute(this._context, this._setupCoordinator), this._metricsManager.reset();
  }
}
const et = "sidebar-kernel", je = "3.1.0-ES6", Ee = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  DEGRADED: "degraded",
  SHUTDOWN: "shutdown",
  ERROR: "error"
}), Y = Object.freeze({
  REGISTERED: "registered",
  ENABLED: "enabled",
  DISABLED: "disabled",
  DEGRADED: "degraded",
  ERROR: "error"
}), Ge = Object.freeze({
  READY: "sidebar-kernel:ready",
  SHUTDOWN: "sidebar-kernel:shutdown",
  FEATURE_REGISTERED: "sidebar-kernel:feature:registered",
  FEATURE_ENABLED: "sidebar-kernel:feature:enabled",
  FEATURE_DISABLED: "sidebar-kernel:feature:disabled",
  FEATURE_ERROR: "sidebar-kernel:feature:error",
  HEALTH_DEGRADED: "sidebar-kernel:health:degraded"
}), bt = Qb({ moduleId: et });
function mI() {
  bt.init();
}
function Jl(e) {
  return bt.get(e);
}
function Gh(e) {
  return bt.inject(e);
}
function Vh() {
  return bt.snapshot();
}
const b = {
  status: Ee.IDLE,
  features: /* @__PURE__ */ new Map(),
  initTime: null,
  shutdownTime: null,
  errors: [],
  metrics: {
    inits: 0,
    shutdowns: 0,
    featureRegistrations: 0,
    featureEnables: 0,
    featureDisables: 0,
    featureErrors: 0,
    dependencyChecks: 0,
    cascadeDisables: 0,
    totalInitTimeMs: 0
  }
};
function R(e, t, r) {
  return {
    ok: e,
    data: t || null,
    meta: {
      moduleId: et,
      version: je,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: b.status
    },
    errors: r || []
  };
}
function gs(e, t) {
  try {
    const r = Jl("telemetry");
    r && r.track && r.track(e, Object.assign({ moduleId: et }, t || {}));
  } catch {
  }
}
function ke(e, t) {
  try {
    const r = Jl("eventBus");
    r && r.emit && r.emit(e, Object.assign({ source: et, timestamp: Date.now() }, t || {}));
  } catch {
  }
}
function qh(e) {
  const t = [];
  return b.features.forEach((r, n) => {
    r.dependencies && r.dependencies.indexOf(e) > -1 && t.push(n);
  }), t;
}
function Ql(e, t) {
  if (t || (t = /* @__PURE__ */ new Set()), t.has(e)) return { ok: !0, missing: [] };
  t.add(e);
  const r = b.features.get(e);
  if (!r) return { ok: !1, missing: [e] };
  let n = [];
  const s = r.dependencies || [];
  for (let i = 0; i < s.length; i++) {
    const o = s[i], a = b.features.get(o);
    if (!a)
      n.push(`${o} (not registered)`);
    else if (a.status !== Y.ENABLED)
      n.push(`${o} (not enabled)`);
    else {
      const l = Ql(o, t);
      l.ok || (n = n.concat(l.missing));
    }
  }
  return b.metrics.dependencyChecks++, { ok: n.length === 0, missing: n };
}
function ec(e, t) {
  if (t || (t = /* @__PURE__ */ new Set()), t.has(e)) return [];
  t.add(e);
  let r = [];
  const n = qh(e);
  for (let s = 0; s < n.length; s++) {
    const i = n[s], o = b.features.get(i);
    if (o && o.status === Y.ENABLED) {
      r.push(i);
      const a = ec(i, t);
      r = r.concat(a);
    }
  }
  return r;
}
function tc(e) {
  if (b.status === Ee.READY) return R(!0, { alreadyInitialized: !0 });
  if (b.status === Ee.INITIALIZING) return R(!1, null, [{ code: "INIT_IN_PROGRESS", message: "Initialization in progress" }]);
  b.status = Ee.INITIALIZING;
  try {
    mI(), e && e.ports && bt.inject(e.ports), b.initTime = Date.now(), b.shutdownTime = null, b.metrics.inits++;
    const t = Jl("telemetry");
    return t && t.register && t.register({ id: et, version: je, healthCheck: ar, info: Gi }), b.status = Ee.READY, gs("kernel:init", { version: je }), ke(Ge.READY, { version: je, featuresCount: b.features.size }), ke(f.KERNEL_READY, { version: je, featuresCount: b.features.size }), typeof window < "u" && (window.SidebarKernel = Xh), R(!0, { initialized: !0, version: je, status: b.status });
  } catch (t) {
    return b.status = Ee.ERROR, b.errors.push({ code: "INIT_ERROR", message: t.message, timestamp: Date.now() }), R(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function ji(e) {
  if (b.status === Ee.SHUTDOWN) return R(!0, { alreadyShutdown: !0 });
  try {
    return b.features.forEach((t, r) => {
      if (t.status === Y.ENABLED)
        try {
          An(r, "kernel_shutdown");
        } catch {
        }
    }), b.shutdownTime = Date.now(), b.metrics.shutdowns++, b.status = Ee.SHUTDOWN, gs("kernel:shutdown", { reason: e || "manual", uptime: b.shutdownTime - b.initTime }), ke(Ge.SHUTDOWN, { reason: e || "manual" }), ke(f.KERNEL_SHUTDOWN, { reason: e }), typeof window < "u" && window.SidebarKernel && delete window.SidebarKernel, R(!0, { shutdown: !0, reason: e || "manual", uptime: b.shutdownTime - b.initTime });
  } catch (t) {
    return b.errors.push({ code: "SHUTDOWN_ERROR", message: t.message, timestamp: Date.now() }), R(!1, null, [{ code: "SHUTDOWN_ERROR", message: t.message }]);
  }
}
function Yh() {
  return ji("cleanup");
}
function rc(e) {
  if (!e || !e.id) return R(!1, null, [{ code: "INVALID_FEATURE", message: "Feature must have id" }]);
  const t = e.id, r = b.features.get(t), n = {
    id: t,
    version: e.version || "0.0.0",
    category: e.category || "general",
    priority: e.priority !== void 0 ? e.priority : 2,
    dependencies: e.dependencies || [],
    capabilities: e.capabilities || {},
    instance: e,
    status: Y.REGISTERED,
    registeredAt: r ? r.registeredAt : Date.now(),
    enabledAt: null,
    disabledAt: null,
    initDurationMs: null,
    lastError: null,
    errorCount: 0,
    initCount: 0
  };
  return b.features.set(t, n), b.metrics.featureRegistrations++, gs("feature:registered", { featureId: t, version: n.version }), ke(Ge.FEATURE_REGISTERED, { featureId: t, version: n.version }), R(!0, { featureId: t, registered: !0, status: n.status });
}
function ms(e, t) {
  const r = b.features.get(e);
  if (!r) return R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
  if (r.status === Y.ENABLED) return R(!0, { featureId: e, alreadyEnabled: !0 });
  const n = Ql(e);
  if (!n.ok)
    return R(!1, null, [{
      code: "DEPENDENCY_NOT_MET",
      message: `Dependencies not satisfied: ${n.missing.join(", ")}`
    }]);
  try {
    const s = Date.now(), i = Object.assign({ ports: bt.snapshot() }, t || {});
    if (r.instance && typeof r.instance.init == "function") {
      const o = r.instance.init(i);
      if (o && !o.ok)
        return r.status = Y.ERROR, r.lastError = o.errors && o.errors[0] || { code: "INIT_FAILED", message: "Unknown error" }, r.errorCount++, b.metrics.featureErrors++, ke(Ge.FEATURE_ERROR, { featureId: e, error: r.lastError }), o;
    }
    return r.status = Y.ENABLED, r.enabledAt = Date.now(), r.initDurationMs = Date.now() - s, r.initCount++, b.metrics.featureEnables++, b.metrics.totalInitTimeMs += r.initDurationMs, gs("feature:enabled", { featureId: e, initDurationMs: r.initDurationMs }), ke(Ge.FEATURE_ENABLED, { featureId: e, initDurationMs: r.initDurationMs }), R(!0, { featureId: e, enabled: !0, initDurationMs: r.initDurationMs });
  } catch (s) {
    return r.status = Y.ERROR, r.lastError = { code: "ENABLE_ERROR", message: s.message }, r.errorCount++, b.metrics.featureErrors++, b.status = Ee.DEGRADED, ke(Ge.FEATURE_ERROR, { featureId: e, error: s.message }), R(!1, null, [{ code: "ENABLE_ERROR", message: s.message }]);
  }
}
function An(e, t, r) {
  const n = b.features.get(e);
  if (!n) return R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
  if (n.status === Y.DISABLED) return R(!0, { featureId: e, alreadyDisabled: !0 });
  const s = r || {}, i = [], o = ec(e);
  if (o.length > 0)
    if (s.cascade)
      for (let a = o.length - 1; a >= 0; a--) {
        const l = o[a], u = b.features.get(l);
        if (u && u.status === Y.ENABLED)
          try {
            u.instance && typeof u.instance.cleanup == "function" && u.instance.cleanup(), u.status = Y.DISABLED, u.disabledAt = Date.now(), i.push(l), b.metrics.cascadeDisables++, ke(Ge.FEATURE_DISABLED, { featureId: l, reason: `cascade:${e}` });
          } catch {
          }
      }
    else
      return R(!1, null, [{
        code: "HAS_DEPENDENTS",
        message: `Features depend on this: ${o.join(", ")}`,
        dependents: o
      }]);
  try {
    return n.instance && typeof n.instance.cleanup == "function" && n.instance.cleanup(), n.status = Y.DISABLED, n.disabledAt = Date.now(), b.metrics.featureDisables++, gs("feature:disabled", { featureId: e, reason: t }), ke(Ge.FEATURE_DISABLED, { featureId: e, reason: t || "manual" }), R(!0, { featureId: e, disabled: !0, reason: t, cascadeDisabled: i });
  } catch (a) {
    return n.lastError = { code: "DISABLE_ERROR", message: a.message }, R(!1, null, [{ code: "DISABLE_ERROR", message: a.message }]);
  }
}
function Kh(e) {
  const t = b.features.get(e);
  return t ? (t.status === Y.ENABLED && An(e, "unregister", { cascade: !0 }), b.features.delete(e), ke(f.KERNEL_FEATURE_UNREGISTERED, { featureId: e }), R(!0, { featureId: e, unregistered: !0 })) : R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
}
function nc(e) {
  if (!b.features.get(e)) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = ec(e);
  return R(!0, { featureId: e, canDisable: r.length === 0, dependents: r });
}
function sc(e) {
  if (!b.features.get(e)) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = qh(e), n = r.filter((s) => {
    const i = b.features.get(s);
    return i && i.status === Y.ENABLED;
  });
  return R(!0, { featureId: e, dependents: r, enabledDependents: n });
}
function Wh(e) {
  const t = b.features.get(e);
  if (!t) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = Ql(e);
  return R(!0, { featureId: e, valid: r.ok, missing: r.missing, dependencies: t.dependencies });
}
function Fi() {
  const e = [];
  return b.features.forEach((t) => {
    e.push({
      id: t.id,
      version: t.version,
      category: t.category,
      priority: t.priority,
      status: t.status,
      errorCount: t.errorCount,
      enabledAt: t.enabledAt,
      initDurationMs: t.initDurationMs
    });
  }), R(!0, { features: e, count: e.length });
}
function ic(e) {
  const t = [];
  return b.features.forEach((r) => {
    r.status === e && t.push({
      id: r.id,
      version: r.version,
      category: r.category,
      enabledAt: r.enabledAt,
      initDurationMs: r.initDurationMs
    });
  }), R(!0, { status: e, features: t, count: t.length });
}
function ps(e) {
  const t = b.features.get(e);
  if (!t) return R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
  let r = null;
  if (t.instance && typeof t.instance.healthCheck == "function")
    try {
      r = t.instance.healthCheck();
    } catch (n) {
      r = { status: "error", error: n.message };
    }
  return R(!0, {
    id: t.id,
    version: t.version,
    status: t.status,
    category: t.category,
    priority: t.priority,
    dependencies: t.dependencies,
    errorCount: t.errorCount,
    lastError: t.lastError,
    enabledAt: t.enabledAt,
    disabledAt: t.disabledAt,
    initDurationMs: t.initDurationMs,
    health: r
  });
}
function oc(e) {
  return ps(e);
}
function ac() {
  const e = {}, t = { registered: 0, enabled: 0, disabled: 0, error: 0 };
  return b.features.forEach((r, n) => {
    if (r.status === Y.REGISTERED ? t.registered++ : r.status === Y.ENABLED ? t.enabled++ : r.status === Y.DISABLED ? t.disabled++ : r.status === Y.ERROR && t.error++, r.instance && typeof r.instance.getMetrics == "function")
      try {
        e[n] = r.instance.getMetrics();
      } catch (s) {
        e[n] = { error: s.message };
      }
    else
      e[n] = { initDurationMs: r.initDurationMs };
  }), R(!0, { kernel: Object.assign({}, b.metrics), features: e, totals: t });
}
function Mn() {
  let e = 0, t = 0, r = 0;
  return b.features.forEach((n) => {
    n.status === Y.ENABLED ? e++ : n.status === Y.DISABLED ? t++ : n.status === Y.ERROR && r++;
  }), R(!0, {
    kernelStatus: b.status,
    uptime: b.initTime ? Date.now() - b.initTime : 0,
    featuresTotal: b.features.size,
    featuresEnabled: e,
    featuresDisabled: t,
    featuresError: r,
    counters: b.metrics,
    errorsRecorded: b.errors.length
  });
}
function ar() {
  const e = Mn().data, t = {
    initialized: b.status === Ee.READY,
    notInError: b.status !== Ee.ERROR,
    hasFeatures: b.features.size > 0,
    portsInitialized: bt.isInitialized()
  }, r = {};
  let n = 0;
  b.features.forEach((l, u) => {
    if (l.instance && typeof l.instance.healthCheck == "function")
      try {
        r[u] = l.instance.healthCheck(), r[u].status === "DEGRADED" && n++;
      } catch (d) {
        r[u] = { status: "ERROR", error: d.message }, n++;
      }
    else
      r[u] = { status: l.status === Y.ERROR ? "UNHEALTHY" : "UNKNOWN" };
  });
  const s = Object.values(t).filter(Boolean).length, i = Object.keys(t).length, o = Math.round(s / i * 100);
  let a = "HEALTHY";
  return b.status === Ee.ERROR ? a = "UNHEALTHY" : (s < i || n > 0 || e.featuresError > 0) && (a = "DEGRADED", ke(Ge.HEALTH_DEGRADED, { degradedFeatures: n })), {
    status: a,
    score: o,
    moduleId: et,
    version: je,
    checks: t,
    features: r,
    uptime: b.initTime ? Date.now() - b.initTime : 0,
    portsInitialized: bt.isInitialized(),
    issues: e.featuresError > 0 ? [{ code: "FEATURES_ERROR", message: `${e.featuresError} features in error state` }] : [],
    timestamp: Date.now()
  };
}
function Gi() {
  return R(!0, {
    moduleId: et,
    version: je,
    status: b.status,
    portsInitialized: bt.isInitialized(),
    capabilities: {
      supportsFeatures: !0,
      supportsAdapters: !1,
      supportsDegradedMode: !0,
      supportsHotReload: !0,
      supportsDependencyCascade: !0,
      supportsCircuitBreaker: !0
    },
    featuresCount: b.features.size,
    uptime: b.initTime ? Date.now() - b.initTime : 0
  });
}
function lc() {
  const e = {};
  return b.features.forEach((t, r) => {
    let n = null, s = null;
    if (t.instance && typeof t.instance.healthCheck == "function")
      try {
        n = t.instance.healthCheck();
      } catch (i) {
        n = { error: i.message };
      }
    if (t.instance && typeof t.instance.getMetrics == "function")
      try {
        s = t.instance.getMetrics();
      } catch (i) {
        s = { error: i.message };
      }
    e[r] = {
      id: t.id,
      version: t.version,
      status: t.status,
      category: t.category,
      priority: t.priority,
      dependencies: t.dependencies,
      registeredAt: t.registeredAt,
      enabledAt: t.enabledAt,
      disabledAt: t.disabledAt,
      initDurationMs: t.initDurationMs,
      errorCount: t.errorCount,
      lastError: t.lastError,
      healthCheck: n,
      metrics: s
    };
  }), {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    kernel: {
      moduleId: et,
      version: je,
      status: b.status,
      initTime: b.initTime ? new Date(b.initTime).toISOString() : null,
      uptime: b.initTime ? Date.now() - b.initTime : 0,
      metrics: Object.assign({}, b.metrics),
      errors: b.errors.slice()
    },
    features: e,
    healthCheck: ar()
  };
}
const Xh = {
  MODULE_ID: et,
  VERSION: je,
  STATUS: Ee,
  FEATURE_STATUS: Y,
  KERNEL_EVENTS: Ge,
  init: tc,
  shutdown: ji,
  cleanup: Yh,
  registerFeature: rc,
  unregisterFeature: Kh,
  enableFeature: ms,
  disableFeature: An,
  canDisable: nc,
  getDependents: sc,
  validateDependencies: Wh,
  listFeatures: Fi,
  getFeaturesByStatus: ic,
  getFeatureStatus: ps,
  getFeature: oc,
  getFeatureMetrics: ac,
  metrics: Mn,
  healthCheck: ar,
  info: Gi,
  exportDiagnostics: lc,
  injectPorts: Gh,
  getPorts: Vh
};
var pI = Xh;
const ll = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FEATURE_STATUS: Y,
  KERNEL_EVENTS: Ge,
  MODULE_ID: et,
  STATUS: Ee,
  VERSION: je,
  canDisable: nc,
  cleanup: Yh,
  default: pI,
  disableFeature: An,
  enableFeature: ms,
  exportDiagnostics: lc,
  getDependents: sc,
  getFeature: oc,
  getFeatureMetrics: ac,
  getFeatureStatus: ps,
  getFeaturesByStatus: ic,
  getPorts: Vh,
  healthCheck: ar,
  info: Gi,
  init: tc,
  injectPorts: Gh,
  listFeatures: Fi,
  metrics: Mn,
  registerFeature: rc,
  shutdown: ji,
  unregisterFeature: Kh,
  validateDependencies: Wh
}, Symbol.toStringTag, { value: "Module" })), Lr = "1.1.0-P2-ENTERPRISE", xr = "sidebar-metrics-hub", zt = v({ moduleId: xr });
function EI() {
  zt.init();
}
function bI(e) {
  return zt.get(e);
}
function Zh(e) {
  return zt.inject(e);
}
function Jh() {
  return zt.snapshot();
}
const Vi = Object.freeze({
  CORE: "core",
  FEATURE: "feature",
  UI: "ui",
  PERFORMANCE: "performance",
  ERROR: "error",
  USER: "user"
}), I = {
  initialized: !1,
  initAt: null,
  sources: /* @__PURE__ */ new Map(),
  snapshots: [],
  maxSnapshots: 100,
  subscribers: /* @__PURE__ */ new Set(),
  aggregationInterval: null,
  lastAggregation: null
}, re = {
  hubInits: 0,
  registrations: 0,
  unregistrations: 0,
  aggregations: 0,
  snapshotsTaken: 0,
  errors: 0,
  lastError: null
};
function Z(e, t, r) {
  return {
    ok: e,
    data: t || null,
    meta: { moduleId: xr, version: Lr, timestamp: Date.now() },
    errors: r || []
  };
}
function _I(e, t) {
  try {
    const r = bI("eventBus");
    r != null && r.emit && r.emit(e, { source: xr, timestamp: Date.now(), ...t });
  } catch (r) {
    re.errors++, re.lastError = { event: e, message: r.message, timestamp: Date.now() };
  }
}
function Qh(e, t) {
  const r = { action: e, data: t, timestamp: Date.now() };
  I.subscribers.forEach((n) => {
    try {
      n(r);
    } catch {
      re.errors++;
    }
  });
}
function cc(e = {}) {
  if (I.initialized)
    return Z(!0, { alreadyInitialized: !0 });
  try {
    return EI(), e.ports && zt.inject(e.ports), I.initialized = !0, I.initAt = Date.now(), re.hubInits++, e.aggregationInterval && e.aggregationInterval > 0 && (I.aggregationInterval = setInterval(() => {
      Je();
    }, e.aggregationInterval)), _I(f.MEMORY_INITIALIZED, { version: Lr }), Z(!0, {
      initialized: !0,
      version: Lr,
      sourcesCount: I.sources.size
    });
  } catch (t) {
    return re.errors++, re.lastError = { phase: "init", message: t.message, timestamp: Date.now() }, Z(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function qi(e, t = {}) {
  if (!e)
    return Z(!1, null, [{ code: "INVALID_SOURCE", message: "sourceId is required" }]);
  const r = {
    id: e,
    category: t.category || Vi.FEATURE,
    version: t.version || "0.0.0",
    getMetrics: t.getMetrics || null,
    healthCheck: t.healthCheck || null,
    registeredAt: Date.now(),
    lastUpdate: null,
    updateCount: 0,
    errors: 0
  };
  return I.sources.set(e, r), re.registrations++, Qh("source:registered", { sourceId: e, category: r.category }), Z(!0, { sourceId: e, registered: !0 });
}
function ef(e) {
  return I.sources.has(e) ? (I.sources.delete(e), re.unregistrations++, Qh("source:unregistered", { sourceId: e }), Z(!0, { sourceId: e, unregistered: !0 })) : Z(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
}
function tf(e, t) {
  const r = I.sources.get(e);
  return r ? (r.lastMetrics = t, r.lastUpdate = Date.now(), r.updateCount++, Z(!0, { sourceId: e, updated: !0 })) : Z(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
}
function Je() {
  re.aggregations++, I.lastAggregation = Date.now();
  const e = {
    timestamp: Date.now(),
    hub: { ...re },
    sources: {},
    byCategory: {},
    summary: {
      totalSources: I.sources.size,
      activeSources: 0,
      errorSources: 0,
      categories: {}
    }
  };
  return I.sources.forEach((t, r) => {
    try {
      let n = t.lastMetrics;
      !n && typeof t.getMetrics == "function" && (n = t.getMetrics(), t.lastMetrics = n, t.lastUpdate = Date.now()), n && (e.sources[r] = {
        category: t.category,
        version: t.version,
        metrics: n,
        lastUpdate: t.lastUpdate,
        updateCount: t.updateCount
      }, e.summary.activeSources++, e.byCategory[t.category] || (e.byCategory[t.category] = {}), e.byCategory[t.category][r] = n, e.summary.categories[t.category] = (e.summary.categories[t.category] || 0) + 1);
    } catch {
      t.errors++, e.summary.errorSources++, re.errors++;
    }
  }), Z(!0, e);
}
function Yi(e) {
  const t = I.sources.get(e);
  if (!t)
    return Z(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
  let r = t.lastMetrics;
  if (!r && typeof t.getMetrics == "function")
    try {
      r = t.getMetrics(), t.lastMetrics = r, t.lastUpdate = Date.now();
    } catch (n) {
      return t.errors++, Z(!1, null, [{ code: "FETCH_ERROR", message: n.message }]);
    }
  return Z(!0, {
    sourceId: e,
    category: t.category,
    version: t.version,
    metrics: r,
    lastUpdate: t.lastUpdate
  });
}
function uc(e) {
  const t = {};
  return I.sources.forEach((r, n) => {
    if (r.category === e) {
      let s = r.lastMetrics;
      if (!s && typeof r.getMetrics == "function")
        try {
          s = r.getMetrics();
        } catch {
        }
      s && (t[n] = s);
    }
  }), Z(!0, { category: e, sources: t, count: Object.keys(t).length });
}
function Ki(e = "") {
  const t = {
    id: `snap_${Date.now()}`,
    label: e,
    timestamp: Date.now(),
    data: Je().data
  };
  for (I.snapshots.push(t), re.snapshotsTaken++; I.snapshots.length > I.maxSnapshots; )
    I.snapshots.shift();
  return Z(!0, { snapshotId: t.id, label: e });
}
function Wi(e = 10) {
  const t = I.snapshots.slice(-e);
  return Z(!0, { snapshots: t, total: I.snapshots.length });
}
function dc(e, t) {
  const r = I.snapshots.find((o) => o.id === e), n = I.snapshots.find((o) => o.id === t);
  if (!r || !n)
    return Z(!1, null, [{ code: "NOT_FOUND", message: "One or both snapshots not found" }]);
  const s = {
    timeDelta: n.timestamp - r.timestamp,
    sourcesDelta: n.data.summary.totalSources - r.data.summary.totalSources,
    changes: {}
  };
  return (/* @__PURE__ */ new Set([
    ...Object.keys(r.data.sources || {}),
    ...Object.keys(n.data.sources || {})
  ])).forEach((o) => {
    var u, d, h, g;
    const a = (d = (u = r.data.sources) == null ? void 0 : u[o]) == null ? void 0 : d.metrics, l = (g = (h = n.data.sources) == null ? void 0 : h[o]) == null ? void 0 : g.metrics;
    !a && l ? s.changes[o] = { status: "added" } : a && !l ? s.changes[o] = { status: "removed" } : a && l && JSON.stringify(a) !== JSON.stringify(l) && (s.changes[o] = { status: "changed", before: a, after: l });
  }), Z(!0, s);
}
function rf(e) {
  return typeof e != "function" ? () => {
  } : (I.subscribers.add(e), () => I.subscribers.delete(e));
}
function Xi() {
  const e = [];
  return I.sources.forEach((t, r) => {
    e.push({
      id: r,
      category: t.category,
      version: t.version,
      registeredAt: t.registeredAt,
      lastUpdate: t.lastUpdate,
      updateCount: t.updateCount,
      errors: t.errors
    });
  }), Z(!0, { sources: e, count: e.length });
}
function hc() {
  return I.aggregationInterval && (clearInterval(I.aggregationInterval), I.aggregationInterval = null), I.sources.clear(), I.snapshots = [], I.subscribers.clear(), I.initialized = !1, Z(!0, { cleanedUp: !0 });
}
function fc() {
  const e = {
    initialized: { ok: I.initialized, severity: "crit" },
    hasSources: { ok: I.sources.size > 0, severity: "warn" },
    noErrors: { ok: re.errors === 0, severity: "warn" },
    portsInitialized: { ok: zt.isInitialized(), severity: "warn" },
    recentAggregation: {
      ok: I.lastAggregation && Date.now() - I.lastAggregation < 6e4,
      severity: "info"
    }
  }, t = [];
  let r = 100;
  return I.initialized || (t.push({ code: "NOT_INIT", severity: "crit", message: "Hub not initialized" }), r -= 50), I.sources.size === 0 && (t.push({ code: "NO_SOURCES", severity: "warn", message: "No metric sources registered" }), r -= 10), re.errors > 0 && (t.push({ code: "HAS_ERRORS", severity: "warn", message: `${re.errors} errors recorded` }), r -= 5 * Math.min(re.errors, 10)), {
    status: r >= 80 ? "HEALTHY" : r >= 50 ? "DEGRADED" : "UNHEALTHY",
    score: r,
    moduleId: xr,
    version: Lr,
    checks: e,
    issues: t,
    metrics: { ...re },
    sourcesCount: I.sources.size,
    snapshotsCount: I.snapshots.length,
    subscribersCount: I.subscribers.size,
    portsInitialized: zt.isInitialized(),
    timestamp: Date.now()
  };
}
function Zi() {
  return Z(!0, {
    moduleId: xr,
    version: Lr,
    initialized: I.initialized,
    initAt: I.initAt,
    portsInitialized: zt.isInitialized(),
    sourcesCount: I.sources.size,
    snapshotsCount: I.snapshots.length,
    subscribersCount: I.subscribers.size,
    categories: Object.values(Vi),
    metrics: { ...re },
    lastAggregation: I.lastAggregation
  });
}
function nf() {
  return Je().data;
}
var yI = {
  VERSION: Lr,
  MODULE_ID: xr,
  METRIC_CATEGORIES: Vi,
  init: cc,
  cleanup: hc,
  registerSource: qi,
  unregisterSource: ef,
  updateMetrics: tf,
  aggregate: Je,
  getMetrics: nf,
  getSourceMetrics: Yi,
  getMetricsByCategory: uc,
  takeSnapshot: Ki,
  getSnapshots: Wi,
  compareSnapshots: dc,
  subscribe: rf,
  listSources: Xi,
  healthCheck: fc,
  info: Zi,
  injectPorts: Zh,
  getPorts: Jh
};
const vI = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  METRIC_CATEGORIES: Vi,
  MODULE_ID: xr,
  VERSION: Lr,
  aggregate: Je,
  cleanup: hc,
  compareSnapshots: dc,
  default: yI,
  getMetrics: nf,
  getMetricsByCategory: uc,
  getPorts: Jh,
  getSnapshots: Wi,
  getSourceMetrics: Yi,
  healthCheck: fc,
  info: Zi,
  init: cc,
  injectPorts: Zh,
  listSources: Xi,
  registerSource: qi,
  subscribe: rf,
  takeSnapshot: Ki,
  unregisterSource: ef,
  updateMetrics: tf
}, Symbol.toStringTag, { value: "Module" })), Q = Object.freeze({
  CORE: "core",
  UI: "ui",
  SEARCH: "search",
  NAVIGATION: "navigation",
  DATA: "data",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  PERFORMANCE: "performance",
  DEBUG: "debug"
}), II = {
  favorites: {
    module: "favorites-handler",
    version: "5.8.0",
    category: Q.CORE,
    methods: {
      add: { original: "addFavorite", args: ["itemId"], returns: "boolean" },
      remove: { original: "removeFavorite", args: ["itemId"], returns: "boolean" },
      toggle: { original: "toggleFavorite", args: ["itemId"], returns: "boolean|null" },
      has: { original: "isFavorite", args: ["itemId"], returns: "boolean" },
      list: { original: "getFavorites", args: [], returns: "array" },
      clear: { original: "clearFavorites", args: [], returns: "void" },
      mark: { original: "markFavoriteItems", args: ["container?"], returns: "void", requiresEl: !0 }
    },
    legacyMethods: {
      addFavorite: "add",
      removeFavorite: "remove",
      toggleFavorite: "toggle",
      isFavorite: "has",
      getFavorites: "list",
      clearFavorites: "clear",
      markFavoriteItems: "mark"
    }
  },
  config: {
    module: "config-manager",
    version: "5.0.0",
    category: Q.CORE,
    methods: {
      export: { original: "exportConfig", args: [], returns: "object" },
      import: { original: "importConfig", args: ["config"], returns: "boolean" },
      reset: { original: "resetConfig", args: [], returns: "void" },
      summary: { original: "getConfigSummary", args: [], returns: "object" }
    },
    legacyMethods: {
      exportConfig: "export",
      importConfig: "import",
      resetConfig: "reset",
      getConfigSummary: "summary"
    }
  },
  flags: {
    module: "feature-flags",
    version: "5.0.0",
    category: Q.CORE,
    methods: {
      isEnabled: { original: "isEnabled", args: ["key"], returns: "boolean" },
      enable: { original: "enable", args: ["key"], returns: "void" },
      disable: { original: "disable", args: ["key"], returns: "void" },
      toggle: { original: "toggle", args: ["key"], returns: "boolean" },
      list: { original: "getAll", args: [], returns: "object" },
      reset: { original: "reset", args: [], returns: "void" }
    },
    legacyMethods: {
      isFeatureEnabled: "isEnabled",
      enableFeature: "enable",
      disableFeature: "disable",
      toggleFeature: "toggle",
      getAllFeatures: "list",
      resetFeatures: "reset"
    }
  }
}, SI = {
  theme: {
    module: "theme-handler",
    version: "5.0.0",
    category: Q.UI,
    methods: {
      set: { original: "setTheme", args: ["theme", "container?"], returns: "void", requiresEl: !0 },
      get: { original: "getTheme", args: [], returns: "string" },
      toggle: { original: "toggleTheme", args: ["container?"], returns: "string", requiresEl: !0 },
      list: { original: "getAvailableThemes", args: [], returns: "array" },
      auto: { original: "enable", altModule: "auto-theme", args: ["container?"], returns: "void", requiresEl: !0 },
      disableAuto: { original: "disable", altModule: "auto-theme", args: [], returns: "void" }
    },
    legacyMethods: {
      setTheme: "set",
      getTheme: "get",
      toggleTheme: "toggle",
      getAvailableThemes: "list",
      enableAutoTheme: "auto",
      disableAutoTheme: "disableAuto"
    }
  },
  layout: {
    module: "compact-mode",
    version: "5.0.0",
    category: Q.UI,
    methods: {
      compact: { original: "enable", args: ["container?"], returns: "void", requiresEl: !0 },
      disableCompact: { original: "disable", args: ["container?"], returns: "void", requiresEl: !0 },
      toggleCompact: { original: "toggle", args: ["container?"], returns: "boolean", requiresEl: !0 },
      mini: { original: "enable", altModule: "mini-mode", args: ["container?"], returns: "void", requiresEl: !0 },
      disableMini: { original: "disable", altModule: "mini-mode", args: ["container?"], returns: "void", requiresEl: !0 },
      toggleMini: { original: "toggle", altModule: "mini-mode", args: ["container?"], returns: "boolean", requiresEl: !0 }
    },
    legacyMethods: {
      enableCompactMode: "compact",
      disableCompactMode: "disableCompact",
      toggleCompactMode: "toggleCompact",
      enableMiniMode: "mini",
      disableMiniMode: "disableMini",
      toggleMiniMode: "toggleMini"
    }
  },
  resize: {
    module: "resize-handler",
    version: "5.0.0",
    category: Q.UI,
    methods: {
      setWidth: { original: "setWidth", args: ["container", "width"], returns: "void", requiresEl: !0 },
      resetWidth: { original: "resetWidth", args: ["container?"], returns: "void", requiresEl: !0 },
      getWidth: { original: "getWidth", args: ["container?"], returns: "number", requiresEl: !0 }
    },
    legacyMethods: { setWidth: "setWidth", resetWidth: "resetWidth", getWidth: "getWidth" }
  },
  context: {
    module: "context-menu",
    version: "5.0.0",
    category: Q.UI,
    methods: {
      show: { original: "showMenu", args: ["x", "y", "itemId", "actions?"], returns: "void" },
      hide: { original: "hideMenu", args: [], returns: "void" }
    },
    legacyMethods: { showContextMenu: "show", hideContextMenu: "hide" }
  },
  submenu: {
    module: "submenu-handler",
    version: "5.0.0",
    category: Q.UI,
    methods: {
      toggle: { original: "toggleSubmenu", args: ["element"], returns: "void" },
      closeAll: { original: "closeAllSubmenus", args: ["container?"], returns: "void", requiresEl: !0 }
    },
    legacyMethods: { toggleSubmenu: "toggle", closeAllSubmenus: "closeAll" }
  }
}, CI = {
  search: {
    module: "fuzzy-search",
    version: "5.0.0",
    category: Q.SEARCH,
    methods: {
      fuzzy: { original: "applyFuzzySearch", args: ["container", "query"], returns: "array", requiresEl: !0 },
      highlight: { original: "highlightMatches", altModule: "highlight-matches", args: ["query"], returns: "number" },
      clearHighlights: { original: "clearHighlights", altModule: "highlight-matches", args: [], returns: "void" },
      navigate: { original: "navigateToMatch", altModule: "highlight-matches", args: ["direction"], returns: "void" },
      matchCount: { original: "getMatchCount", altModule: "highlight-matches", args: [], returns: "number" }
    },
    legacyMethods: {
      fuzzySearch: "fuzzy",
      highlightMatches: "highlight",
      clearHighlights: "clearHighlights",
      navigateToMatch: "navigate",
      getMatchCount: "matchCount"
    }
  },
  commands: {
    module: "command-palette",
    version: "5.0.0",
    category: Q.SEARCH,
    methods: {
      show: { original: "show", args: [], returns: "void" },
      hide: { original: "hide", args: [], returns: "void" },
      toggle: { original: "toggle", args: [], returns: "void" },
      register: { original: "registerCommand", args: ["command"], returns: "object" }
    },
    legacyMethods: {
      showCommandPalette: "show",
      hideCommandPalette: "hide",
      toggleCommandPalette: "toggle",
      registerCommand: "register"
    }
  }
}, AI = {}, MI = {
  badges: {
    module: "dynamic-badges",
    version: "5.0.0",
    category: Q.DATA,
    methods: {
      set: { original: "setBadge", args: ["itemId", "options"], returns: "void" },
      get: { original: "getBadge", args: ["itemId"], returns: "object" },
      remove: { original: "removeBadge", args: ["itemId"], returns: "void" },
      increment: { original: "incrementBadge", args: ["itemId", "amount?"], returns: "void" },
      decrement: { original: "decrementBadge", args: ["itemId", "amount?"], returns: "void" },
      live: { original: "setLiveBadge", args: ["itemId", "fetchFn", "interval?"], returns: "void" },
      countdown: { original: "setCountdownBadge", args: ["itemId", "seconds", "onComplete?"], returns: "void" },
      listAll: { original: "getAllBadges", args: [], returns: "object" },
      clearAll: { original: "clearAllBadges", args: [], returns: "void" }
    },
    legacyMethods: {
      setDynamicBadge: "set",
      getDynamicBadge: "get",
      removeDynamicBadge: "remove",
      incrementBadge: "increment",
      decrementBadge: "decrement",
      setLiveBadge: "live",
      setCountdownBadge: "countdown",
      getAllBadges: "listAll",
      clearAllBadges: "clearAll"
    }
  },
  notifications: {
    module: "notification-dots",
    version: "5.0.0",
    category: Q.DATA,
    methods: {
      show: { original: "showDot", args: ["itemId", "variant?", "count?"], returns: "void" },
      hide: { original: "hideDot", args: ["itemId"], returns: "void" },
      update: { original: "updateCount", args: ["itemId", "count"], returns: "void" },
      increment: { original: "incrementCount", args: ["itemId"], returns: "void" },
      clearAll: { original: "clearAll", args: [], returns: "void" }
    },
    legacyMethods: {
      showNotificationDot: "show",
      hideNotificationDot: "hide",
      updateNotificationCount: "update",
      incrementNotification: "increment",
      clearAllNotifications: "clearAll"
    }
  }
}, OI = {
  a11y: {
    module: "screen-reader",
    version: "5.0.0",
    category: Q.ACCESSIBILITY,
    methods: {
      announce: { original: "announce", args: ["message", "priority?"], returns: "void" },
      enhance: { original: "enhance", args: ["container?"], returns: "void", requiresEl: !0 },
      highContrast: { original: "enableHighContrast", args: ["container?"], returns: "void", requiresEl: !0 },
      disableHighContrast: { original: "disableHighContrast", args: ["container?"], returns: "void", requiresEl: !0 },
      largeText: { original: "enableLargeText", args: ["container?"], returns: "void", requiresEl: !0 },
      disableLargeText: { original: "disableLargeText", args: ["container?"], returns: "void", requiresEl: !0 }
    },
    legacyMethods: {
      announce: "announce",
      enhanceAccessibility: "enhance",
      enableHighContrast: "highContrast",
      disableHighContrast: "disableHighContrast",
      enableLargeText: "largeText",
      disableLargeText: "disableLargeText"
    }
  },
  landmarks: {
    module: "accessibility-landmarks",
    version: "5.0.0",
    category: Q.ACCESSIBILITY,
    methods: {
      apply: { original: "applyLandmarks", args: ["container?"], returns: "void", requiresEl: !0 },
      updateActive: { original: "updateActiveItem", args: ["itemId"], returns: "void" },
      setLoading: { original: "setLoadingState", args: ["isLoading", "message?"], returns: "void" }
    },
    legacyMethods: {
      applyLandmarks: "apply",
      updateActiveItemAria: "updateActive",
      setLoadingAria: "setLoading"
    }
  },
  shortcuts: {
    module: "keyboard-shortcuts-extended",
    version: "5.0.0",
    category: Q.ACCESSIBILITY,
    methods: {
      register: { original: "register", args: ["id", "shortcut"], returns: "void" },
      unregister: { original: "unregister", args: ["id"], returns: "void" },
      enable: { original: "enable", args: [], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" },
      list: { original: "getAll", args: [], returns: "object" },
      showHelp: { original: "showHelp", args: [], returns: "void" }
    },
    legacyMethods: {
      registerShortcut: "register",
      unregisterShortcut: "unregister",
      enableShortcuts: "enable",
      disableShortcuts: "disable",
      getAllShortcuts: "list",
      showShortcutsHelp: "showHelp"
    }
  }
}, TI = {
  effects: {
    module: "parallax",
    version: "5.0.0",
    category: Q.VISUAL,
    methods: {
      parallax: { original: "enable", args: ["container?"], returns: "void", requiresEl: !0 },
      disableParallax: { original: "disable", args: [], returns: "void" }
    },
    legacyMethods: {
      enableParallax: "parallax",
      disableParallax: "disableParallax"
    }
  },
  transitions: {
    module: "animated-transitions",
    version: "5.0.0",
    category: Q.VISUAL,
    methods: {
      animate: { original: "animateElement", args: ["element", "direction", "type?"], returns: "void" },
      expand: { original: "animateSectionExpand", args: ["sectionEl"], returns: "void" },
      collapse: { original: "animateSectionCollapse", args: ["sectionEl"], returns: "void" },
      enable: { original: "enable", args: [], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" }
    },
    legacyMethods: {
      animateElement: "animate",
      animateSectionExpand: "expand",
      animateSectionCollapse: "collapse",
      enableAnimations: "enable",
      disableAnimations: "disable"
    }
  }
}, DI = {
  virtual: {
    module: "virtual-list",
    version: "5.0.0",
    category: Q.PERFORMANCE,
    methods: {
      enable: { original: "enable", args: ["items"], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" },
      isEnabled: { original: "isEnabled", args: [], returns: "boolean" },
      state: { original: "getState", args: [], returns: "object" },
      scrollTo: { original: "scrollToItem", args: ["itemId"], returns: "void" }
    },
    legacyMethods: {
      enableVirtualList: "enable",
      disableVirtualList: "disable",
      isVirtualListEnabled: "isEnabled",
      getVirtualListState: "state",
      scrollToVirtualItem: "scrollTo"
    }
  }
}, LI = {
  debug: {
    module: "debug-panel",
    version: "5.0.0",
    category: Q.DEBUG,
    methods: {
      open: { original: "open", args: [], returns: "void" },
      close: { original: "close", args: [], returns: "void" },
      toggle: { original: "toggle", args: [], returns: "void" }
    },
    legacyMethods: { openDebugPanel: "open", closeDebugPanel: "close", toggleDebugPanel: "toggle" }
  }
}, rs = Object.freeze(Object.assign(
  {},
  II,
  SI,
  CI,
  AI,
  MI,
  OI,
  TI,
  DI,
  LI
)), Ji = "sidebar:feature-proxy", $I = "1.4.0-P2-ENTERPRISE", sf = v({ moduleId: Ji }), kI = (e) => sf.get(e);
function wI() {
  var t, r;
  const e = kI("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const ln = (e, ...t) => {
  const r = `[${Ji}]`, n = wI();
  n != null && n[e] ? n[e](r, ...t) : !It() && (e === "error" || e === "warn") && console.debug(r, ...t);
}, tn = /* @__PURE__ */ new Map(), Kn = /* @__PURE__ */ new Map(), ze = { calls: /* @__PURE__ */ new Map(), errors: /* @__PURE__ */ new Map(), loadTimes: /* @__PURE__ */ new Map() };
class rd {
  constructor(t, r, n) {
    this._featureName = t, this._contract = r, this._resolver = n, this._module = null, this._loaded = !1, this._loading = null, this._createMethods();
  }
  _createMethods() {
    if (!this._contract || !this._contract.methods) return;
    const t = this._contract.methods;
    Array.isArray(t) ? t.forEach((r) => {
      typeof r == "string" && !this[r] && (this[r] = (...n) => this._invoke(r, n));
    }) : typeof t == "object" && Object.keys(t).forEach((r) => {
      this[r] || (this[r] = (...n) => this._invoke(r, n));
    });
  }
  async _invoke(t, r = []) {
    const n = performance.now(), s = `${this._featureName}.${t}`;
    try {
      ze.calls.set(s, (ze.calls.get(s) || 0) + 1), this._loaded || await this._load();
      const i = this._resolveMethodName(t);
      if (!this._module || typeof this._module[i] != "function") {
        const a = this._tryFallback(t, r);
        if (a !== void 0) return a;
        ln("warn", `Método não encontrado: ${s}`);
        return;
      }
      const o = await Promise.resolve(this._module[i](...r));
      return ze.loadTimes.set(s, performance.now() - n), o;
    } catch (i) {
      ze.errors.set(s, (ze.errors.get(s) || 0) + 1), ln("error", `Erro ao invocar ${s}:`, i.message);
      return;
    }
  }
  async _load() {
    return this._loading ? this._loading : this._loaded && this._module ? this._module : (this._loading = (async () => {
      try {
        const t = performance.now();
        return Kn.has(this._featureName) ? (this._module = Kn.get(this._featureName), this._loaded = !0, this._module) : (this._resolver && typeof this._resolver == "function" && (this._module = await Promise.resolve(this._resolver(this._featureName, this._contract)), this._module && (Kn.set(this._featureName, this._module), this._loaded = !0, ze.loadTimes.set(`${this._featureName}:load`, performance.now() - t))), this._module);
      } catch (t) {
        return ln("error", `Erro ao carregar feature ${this._featureName}:`, t.message), this._module = null, this._loaded = !1, null;
      } finally {
        this._loading = null;
      }
    })(), this._loading);
  }
  _resolveMethodName(t) {
    if (!this._contract || !this._contract.methods) return t;
    const r = this._contract.methods;
    if (typeof r == "object" && !Array.isArray(r)) {
      const n = r[t];
      if (n && n.original) return n.original;
    }
    return t;
  }
  _tryFallback(t, r) {
    if (!It())
      try {
        if (typeof window < "u" && window.SidebarKernel) {
          jn("WINDOW_SIDEBARKERNEL_FALLBACK", { module: Ji, method: t });
          const n = window.SidebarKernel;
          if (typeof n._invokeFeature == "function") return n._invokeFeature(this._featureName, t, ...r);
        }
      } catch {
      }
  }
  isLoaded() {
    return this._loaded;
  }
  getContract() {
    return this._contract;
  }
  getName() {
    return this._featureName;
  }
  getMethods() {
    if (!this._contract || !this._contract.methods) return [];
    const t = this._contract.methods;
    return Array.isArray(t) ? [...t] : typeof t == "object" ? Object.keys(t) : [];
  }
  info() {
    return { feature: this._featureName, loaded: this._loaded, methods: this.getMethods(), contract: this._contract ? { module: this._contract.module, version: this._contract.version, category: this._contract.category } : null };
  }
}
function of(e, t, r) {
  if (!e || typeof e != "string")
    return ln("warn", "Nome de feature inválido:", e), null;
  const n = e.toLowerCase();
  if (tn.has(n)) return tn.get(n);
  const s = t ? t[n] || t[e] : null;
  if (!s) {
    ln("warn", `Contrato não encontrado para feature: ${e}`);
    const o = new rd(e, { methods: [] }, r);
    return tn.set(n, o), o;
  }
  const i = new rd(e, s, r);
  return tn.set(n, i), i;
}
function Qi() {
  return { calls: Object.fromEntries(ze.calls), errors: Object.fromEntries(ze.errors), loadTimes: Object.fromEntries(ze.loadTimes), cachedProxies: tn.size, cachedModules: Kn.size };
}
async function NI(e, t, r) {
  if (!Array.isArray(e)) return;
  const n = e.map(async (s) => {
    try {
      const i = of(s, t, r);
      i && await i._load();
    } catch (i) {
      ln("warn", `Falha no preload de ${s}:`, i.message);
    }
  });
  await Promise.allSettled(n);
}
function RI() {
  Qi();
  const e = Array.from(ze.errors.values()).reduce((n, s) => n + s, 0), t = Array.from(ze.calls.values()).reduce((n, s) => n + s, 0), r = t > 0 ? e / t * 100 : 0;
  return {
    status: r < 5 ? "HEALTHY" : r < 20 ? "DEGRADED" : "UNHEALTHY",
    module: Ji,
    version: $I,
    portsInitialized: sf.isInitialized(),
    strictMode: It(),
    metrics: { cachedProxies: tn.size, cachedModules: Kn.size, totalCalls: t, totalErrors: e, errorRate: `${r.toFixed(2)}%` }
  };
}
const af = "sidebar:legacy-bridge", xI = v({ moduleId: af }), PI = (e) => xI.get(e);
function HI() {
  var t, r;
  const e = PI("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const Si = (e, ...t) => {
  const r = `[${af}]`, n = HI();
  n != null && n[e] ? n[e](r, ...t) : !It() && (e === "error" || e === "warn" || e === "info") && console.debug(r, ...t);
}, cl = /* @__PURE__ */ new Map(), ul = {
  setBadge: { feature: "badges", method: "set", removeIn: "v6.0.0" },
  getBadge: { feature: "badges", method: "get", removeIn: "v6.0.0" },
  removeBadge: { feature: "badges", method: "remove", removeIn: "v6.0.0" }
};
function zI(e, t) {
  const r = `Sidebar.feature('${t.feature}').${t.method}()`, n = `DEPRECATED: ${e}() → Use: ${r} (removing in ${t.removeIn})`;
  Si("warn", n);
  {
    const s = cl.get(e) || 0;
    cl.set(e, s + 1);
  }
}
function BI(e, t, r) {
  return (...n) => {
    zI(e, t);
    const s = r(t.feature);
    if (!s) {
      Si("error", `Feature not found: ${t.feature}`);
      return;
    }
    const i = t.args ? [...t.args, ...n] : n, o = s[t.method];
    if (typeof o == "function")
      return o.apply(s, i);
    Si("warn", `Method not found: ${t.feature}.${t.method}`);
  };
}
function UI(e, t) {
  return Si("info", "Legacy bridge DISABLED - use Sidebar.feature('x').method() API"), e;
}
function za() {
  const e = Array.from(cl.entries()).map(([t, r]) => ({ method: t, count: r, mapping: ul[t] })).sort((t, r) => r.count - t.count);
  return { totalCalls: e.reduce((t, r) => t + r.count, 0), uniqueMethods: e.length, methods: e };
}
const eo = "6.1.0-ES6", Es = "sidebar-accessibility-landmarks", Pr = v({ moduleId: Es });
function jI() {
  Pr.init();
}
function FI(e) {
  return Pr.get(e);
}
function lf(e) {
  return Pr.inject(e);
}
function cf() {
  return Pr.snapshot();
}
let O = null, to = { applies: 0, updates: 0, errors: 0 };
const nd = { sidebar: "navigation", search: "search" };
function uf(e, t) {
  e && Pr.inject({ eventBus: e }), jI(), O = t, t && gc(t);
  const r = FI("eventBus");
  r && r.emit && r.emit(f.A11Y_INITIALIZED);
}
function gc(e) {
  if (!e) return;
  to.applies++, e.setAttribute("role", nd.sidebar), e.setAttribute("aria-label", "Menu de navegação principal");
  const t = e.querySelector(`.${c.HEADER}`);
  t && (t.setAttribute("role", "banner"), t.setAttribute("aria-label", "Cabeçalho do menu"));
  const r = e.querySelector(`.${c.LOGO}`);
  r && (r.setAttribute("role", "img"), r.setAttribute("aria-label", "Logo da aplicação"));
  const n = e.querySelector(`.${c.SEARCH}`);
  if (n) {
    n.setAttribute("role", nd.search), n.setAttribute("aria-label", "Buscar no menu");
    const o = n.querySelector("input");
    if (o && (o.setAttribute("aria-label", "Campo de busca"), o.setAttribute("aria-describedby", "search-hint"), !n.querySelector("#search-hint"))) {
      const a = document.createElement("span");
      a.id = "search-hint", a.className = "sr-only", a.textContent = "Digite para filtrar os itens do menu. Use setas para navegar.", n.appendChild(a);
    }
  }
  const s = e.querySelector(`.${c.NAV}, .${c.NAV_CONTENT}`);
  s && (s.setAttribute("role", "tree"), s.setAttribute("aria-label", "Itens do menu"), s.setAttribute("aria-multiselectable", "false")), GI(e), VI(e);
  const i = e.querySelector(`.${c.FOOTER}`);
  return i && (i.setAttribute("role", "contentinfo"), i.setAttribute("aria-label", "Rodapé do menu")), e;
}
function GI(e) {
  e.querySelectorAll(`.${c.SECTION}`).forEach((t, r) => {
    var l;
    const n = t.dataset.sectionId || `section-${r}`, s = t.querySelector(`.${c.GROUP_TITLE}, .${c.SECTION_TITLE}`), i = ((l = s == null ? void 0 : s.textContent) == null ? void 0 : l.trim()) || `Seção ${r + 1}`;
    t.setAttribute("role", "group"), t.setAttribute("aria-labelledby", `${n}-title`), s && (s.id = `${n}-title`);
    const o = t.querySelector(`.${c.GROUP_BUTTON}, .${c.SECTION_TOGGLE}`);
    if (o) {
      const u = t.classList.contains(c.SECTION_EXPANDED);
      o.setAttribute("role", "button"), o.setAttribute("aria-expanded", String(u)), o.setAttribute("aria-controls", `${n}-content`), o.setAttribute("aria-label", `${u ? "Colapsar" : "Expandir"} ${i}`);
    }
    const a = t.querySelector(`.${c.SECTION_CONTENT}, .${c.GROUP_ITEMS}`);
    a && (a.id = `${n}-content`, a.setAttribute("role", "group"));
  });
}
function VI(e) {
  e.querySelectorAll(`.${c.ITEM}`).forEach((t) => {
    var h, g;
    const r = t.querySelector(`.${c.LINK}`), n = t.querySelector(`.${c.ITEM_LABEL}, .${c.ITEM_TEXT}`), s = ((h = n == null ? void 0 : n.textContent) == null ? void 0 : h.trim()) || "", i = t.querySelector(`.${c.BADGE}, .dsd-badge`), o = (g = i == null ? void 0 : i.textContent) == null ? void 0 : g.trim(), a = t.querySelector(`.${c.SUBMENU}, .${c.CHILDREN}`), l = t.classList.contains(c.ITEM_ACTIVE), u = t.classList.contains(c.ITEM_DISABLED);
    if (t.setAttribute("role", "treeitem"), t.setAttribute("aria-selected", String(l)), u && t.setAttribute("aria-disabled", "true"), a) {
      const m = t.classList.contains(c.ITEM_EXPANDED);
      t.setAttribute("aria-expanded", String(m));
    }
    if (r) {
      r.setAttribute("tabindex", l ? "0" : "-1");
      let m = s;
      o && (m += `, ${o} notificações`), l && (m += ", página atual"), u && (m += ", desabilitado"), r.setAttribute("aria-label", m), l ? r.setAttribute("aria-current", "page") : r.removeAttribute("aria-current");
    }
    const d = t.querySelector(`.${c.ITEM_ICON}`);
    d && d.setAttribute("aria-hidden", "true"), i && (i.setAttribute("role", "status"), i.setAttribute("aria-label", `${o} notificações`));
  });
}
function df(e, t) {
  var s;
  to.updates++;
  const r = O == null ? void 0 : O.querySelector(`[data-section-id="${e}"]`);
  if (!r) return;
  const n = r.querySelector(`.${c.GROUP_BUTTON}, .${c.SECTION_TOGGLE}`);
  if (n) {
    n.setAttribute("aria-expanded", String(t));
    const i = ((s = r.querySelector(`.${c.GROUP_TITLE}`)) == null ? void 0 : s.textContent) || "Seção";
    n.setAttribute("aria-label", `${t ? "Colapsar" : "Expandir"} ${i}`);
  }
}
function hf(e) {
  if (to.updates++, !O) return;
  O.querySelectorAll('[aria-current="page"]').forEach((r) => {
    var n;
    r.removeAttribute("aria-current"), r.setAttribute("tabindex", "-1"), (n = r.closest(`.${c.ITEM}`)) == null || n.setAttribute("aria-selected", "false");
  });
  const t = O.querySelector(`[data-item-id="${e}"]`);
  if (t) {
    const r = t.querySelector(`.${c.LINK}`);
    r && (r.setAttribute("aria-current", "page"), r.setAttribute("tabindex", "0")), t.setAttribute("aria-selected", "true");
  }
}
function ff(e, t, r) {
  var i;
  if (!O) return;
  const n = O.querySelector(`#${e}, [data-item-id="${e}"]`);
  if (!n) return;
  let s = O.querySelector(`#${t}`);
  s || (s = document.createElement("span"), s.id = t, s.className = "sr-only", (i = n.parentNode) == null || i.insertBefore(s, n.nextSibling)), s.textContent = r, n.setAttribute("aria-describedby", t);
}
function gf(e, t) {
  var r;
  if (O)
    if (t = t || "Carregando menu...", O.setAttribute("aria-busy", String(e)), e) {
      O.setAttribute("aria-describedby", "sidebar-loading-msg");
      let n = O.querySelector("#sidebar-loading-msg");
      n || (n = document.createElement("div"), n.id = "sidebar-loading-msg", n.className = "sr-only", n.setAttribute("role", "status"), n.setAttribute("aria-live", "polite"), O.appendChild(n)), n.textContent = t;
    } else
      O.removeAttribute("aria-describedby"), (r = O.querySelector("#sidebar-loading-msg")) == null || r.remove();
}
function mf() {
  var e, t;
  (e = O == null ? void 0 : O.querySelector("#search-hint")) == null || e.remove(), (t = O == null ? void 0 : O.querySelector("#sidebar-loading-msg")) == null || t.remove(), O = null;
}
function ro() {
  return { ...to };
}
function pf() {
  return { moduleId: Es, version: eo, portsInitialized: Pr.isInitialized(), hasContainer: !!O, sectionsCount: (O == null ? void 0 : O.querySelectorAll('[role="group"]').length) || 0, itemsCount: (O == null ? void 0 : O.querySelectorAll('[role="treeitem"]').length) || 0, metrics: ro() };
}
function Ef() {
  const e = O == null ? void 0 : O.hasAttribute("role"), t = O == null ? void 0 : O.hasAttribute("aria-label");
  return { status: e && t ? "HEALTHY" : O ? "DEGRADED" : "NOT_INITIALIZED", version: eo, moduleId: Es, portsInitialized: Pr.isInitialized(), checks: { hasContainer: !!O, hasRole: e, hasLabel: t }, metrics: ro() };
}
var qI = { init: uf, applyLandmarks: gc, updateExpansionState: df, updateActiveItem: hf, addDescribedBy: ff, setLoadingState: gf, destroy: mf, injectPorts: lf, getPorts: cf, getMetrics: ro, info: pf, healthCheck: Ef, VERSION: eo, MODULE_ID: Es };
const bf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Es,
  VERSION: eo,
  addDescribedBy: ff,
  applyLandmarks: gc,
  default: qI,
  destroy: mf,
  getMetrics: ro,
  getPorts: cf,
  healthCheck: Ef,
  info: pf,
  init: uf,
  injectPorts: lf,
  setLoadingState: gf,
  updateActiveItem: hf,
  updateExpansionState: df
}, Symbol.toStringTag, { value: "Module" })), no = "3.4.0-ES6", so = "sidebar-feature-accordion-ncs", _f = "sidebar.accordion.ncs.enabled", dt = "sidebar-accordion-root", _r = "region:app:accordion-ncs", bs = v({ moduleId: so });
function yf() {
  bs.init();
}
function YI(e) {
  return bs.get(e);
}
function mc(e) {
  return bs.inject(e);
}
function vf() {
  return bs.snapshot();
}
function If() {
  return bs.isInitialized();
}
function V(e, t, r) {
  const n = YI("logger");
  n && n[e] && n[e](`[${so}] ${t}`, r || "");
}
const $ = {
  initialized: !1,
  enabled: !1,
  accordion: null,
  container: null,
  eventBus: null,
  modelLoaderReady: !1,
  cleanups: []
};
function Sf() {
  try {
    const e = localStorage.getItem("dshowdash:featureFlags");
    return e ? JSON.parse(e) : {};
  } catch {
    return {};
  }
}
function Cf(e, t) {
  try {
    const r = Sf();
    return r[e] = t, localStorage.setItem("dshowdash:featureFlags", JSON.stringify(r)), !0;
  } catch {
    return !1;
  }
}
function ht() {
  return Sf()[_f] === !0;
}
function Af() {
  if (document.getElementById(dt))
    return document.getElementById(dt);
  const e = document.querySelector(`.${c.NAV_CONTENT}`);
  if (!e)
    return null;
  const t = document.createElement("div");
  return t.id = dt, t.className = c.ACCORDION_CONTAINER, t.setAttribute("data-accordion-ncs-active", "true"), t.setAttribute("data-uarps-region", _r), e.insertBefore(t, e.firstChild), $.container = t, t;
}
function Mf() {
  const e = document.getElementById(dt);
  e && e.remove(), $.container = null;
}
async function Of(e = 10, t = 100) {
  for (let r = 0; r < e; r++) {
    if (document.querySelector(`.${c.NAV_CONTENT}`)) return !0;
    await new Promise((s) => {
      setTimeout(s, t);
    });
  }
  return !1;
}
function Tf() {
  const e = document.querySelector(`.${c.NAV_CONTENT}`);
  if (!e) return;
  const t = e.children;
  let r = 0;
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    s.id !== dt && (s.hasAttribute("data-accordion-ncs-active") || (s.classList.contains(c.SECTION) || s.classList.contains(c.NAV_SECTION)) && (s.style.display = "none", s.setAttribute("data-ncs-hidden", "true"), r++));
  }
  V("info", `Legacy navigation hidden (${r} elements)`);
}
function KI() {
  document.querySelectorAll('[data-ncs-hidden="true"]').forEach((t) => {
    t.style.display = "", t.removeAttribute("data-ncs-hidden");
  }), V("info", "Legacy navigation restored");
}
function Df() {
  return document.querySelectorAll('[data-ncs-hidden="true"]').length;
}
function WI(e) {
  var t, r;
  return !e || !e.sections ? null : {
    version: e.version || "1.0.0",
    source: e.source || "navigation-model",
    generatedAt: e.generated_at || (/* @__PURE__ */ new Date()).toISOString(),
    sections: e.sections.map((n) => {
      var s, i;
      return {
        id: `sec-${n.id}`,
        label: n.label,
        icon: n.icon || "folder",
        order: n.order || 0,
        defaultOpen: ((s = n.accordion) == null ? void 0 : s.default_open) !== !1,
        collapsible: ((i = n.accordion) == null ? void 0 : i.collapsible) !== !1,
        visible: n.visible !== !1,
        uarps: n.uarps || {
          trigger_id: `trigger:navigation:section-${n.id}`,
          region_id: _r
        },
        items: (n.items || []).map((o) => {
          var a, l, u, d;
          return {
            id: o.id,
            label: o.label,
            icon: o.icon || "file",
            order: o.order || 0,
            type: ((a = o.navigation) == null ? void 0 : a.mode) === "action" ? "panel" : "route",
            target: {
              panelId: ((u = (l = o.navigation) == null ? void 0 : l.action) == null ? void 0 : u.replace("panel:", "")) || null,
              route: o.route || null,
              path: o.route || null
            },
            disabled: ((d = o.state) == null ? void 0 : d.disabled) || !1,
            badge: o.badge || null,
            uarps: o.uarps || {
              trigger_id: `trigger:navigation:item-${o.id}`,
              region_id: _r
            }
          };
        })
      };
    }),
    defaults: e.defaults || {
      mode: "multi",
      persist: { enabled: !0, scope: "user" }
    },
    meta: {
      triggerPattern: ((t = e.meta) == null ? void 0 : t.trigger_pattern) || "trigger:navigation:item-{id}",
      region: _r,
      phase: ((r = e.meta) == null ? void 0 : r.phase) || "P0",
      loaderSource: e.source
    }
  };
}
const Fn = "accordion-ncs-navigation-handler", Lf = v({ moduleId: Fn });
function XI() {
  Lf.init();
}
function Ba(e) {
  return Lf.get(e);
}
function $f(e) {
  var s;
  XI();
  const t = ((s = e == null ? void 0 : e.view) == null ? void 0 : s._eventBus) || $.eventBus || Ba("eventBus");
  if (!t) {
    V("warn", "No eventBus available for navigation handler");
    return;
  }
  const r = (i) => {
    const o = i.item;
    if (!o || !o.target) {
      V("warn", "Item selected without target:", i);
      return;
    }
    const a = o.target;
    if (a.route || a.path) {
      const l = a.route || a.path, u = Ba("routerGlobal");
      if (u && u.navigate) {
        u.navigate(l, { source: Fn }), V("info", `Navigating via Ports router: ${l}`);
        return;
      }
      const d = Ba("eventBus") || t;
      if (d && d.emit) {
        d.emit(pe.NAVIGATE, {
          path: l,
          options: { source: Fn },
          source: Fn,
          timestamp: Date.now()
        }), V("info", `Navigating via EventBus NAVIGATE: ${l}`);
        return;
      }
      t && t.emit && t.emit(bl.HARD_NAV, {
        path: l,
        reason: "No router or EventBus via Ports",
        source: Fn,
        timestamp: Date.now()
      }), window.location.hash = l, V("info", `Fallback navigation to: ${l}`);
    }
  }, n = Va.SELECT_ITEM;
  t.on(n, r), V("info", `Navigation handler listening to: ${n}`), $.cleanups.push(() => {
    t.off(n, r);
  });
}
async function ZI(e = 20, t = 150) {
  for (let r = 0; r < e; r++) {
    const n = k.getModel();
    if (n && n.sections && n.sections.length > 0)
      return { success: !0, model: n, source: "memory" };
    if (k.isReady && k.isReady()) {
      const s = k.getModel();
      if (s) return { success: !0, model: s, source: "ready" };
    }
    await new Promise((s) => {
      setTimeout(s, t);
    });
  }
  return { success: !1, reason: "timeout" };
}
async function Bn() {
  try {
    if (V("warn", "Using mock fallback"), !await Of(15, 100))
      return V("warn", "Nav content still not available, skipping accordion"), { success: !1, error: "Nav content not available" };
    const t = await import("/components/accordion/index.js");
    if (!Af())
      return V("warn", "Container creation failed, skipping accordion"), { success: !1, error: "Container creation failed" };
    const n = await t.mountAccordionWithMock(`#${dt}`);
    if (n.success)
      return $.accordion = n, $.accordion.source = "mock", $.enabled = !0, Tf(), $f(n), V("info", "Accordion NCS loaded with MOCK fallback"), { success: !0, source: "mock", accordion: n };
    throw new Error(n.error || "Mock mount failed");
  } catch (e) {
    return V("error", `Fallback also failed: ${e.message}`), Mf(), { success: !1, error: e.message };
  }
}
async function pc() {
  yf();
  try {
    const e = await k.load();
    let t = null, r = "unknown";
    if (!e.success && e.reason === "already-loading") {
      V("info", "Model already loading, waiting for it...");
      const l = await ZI(20, 150);
      if (l.success)
        t = l.model, r = l.source, V("info", "Model obtained after waiting");
      else
        return V("warn", "Timeout waiting for model, using fallback"), Bn();
    } else if (e.success)
      t = e.model || k.getModel(), r = e.source;
    else
      return V("warn", `Model load failed: ${e.reason || e.error}`), Bn();
    if ($.modelLoaderReady = !0, !t || !t.sections || t.sections.length === 0)
      return V("warn", "Model empty, using fallback"), Bn();
    const n = WI(t);
    if (!await Of(15, 100))
      return V("warn", "Nav content not available, using fallback"), Bn();
    const i = await import("/components/accordion/index.js");
    if (!Af())
      throw new Error("Container creation failed");
    const a = await i.mountAccordion(`#${dt}`, {
      structure: n,
      persistence: !0,
      telemetry: !0
    });
    if (a.success)
      return $.accordion = a, $.accordion.source = r, $.accordion.modelVersion = t.version, $.enabled = !0, Tf(), $f(a), V("info", "Accordion NCS loaded via NavigationModelLoader"), V("info", `Source: ${r}, Sections: ${n.sections.length}`), {
        success: !0,
        source: r,
        accordion: a,
        sectionsCount: n.sections.length,
        modelVersion: t.version
      };
    throw new Error(a.error || "Mount failed");
  } catch (e) {
    return V("error", `Failed to load Accordion NCS: ${e.message}`), Bn();
  }
}
function Ec() {
  if ($.cleanups.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), $.cleanups = [], $.accordion && $.accordion.instance)
    try {
      $.accordion.instance.destroy();
    } catch {
    }
  Mf(), KI(), $.accordion = null, $.enabled = !1, V("info", "Accordion NCS unloaded");
}
function bc() {
  let e = null;
  try {
    e = k.healthCheck ? k.healthCheck() : { healthy: !1 };
  } catch (o) {
    e = { healthy: !1, error: o.message };
  }
  const t = {
    initialized: $.initialized,
    featureFlagEnabled: ht(),
    modelLoaderReady: $.modelLoaderReady || e && (e.healthy || e.status === "HEALTHY"),
    portsInitialized: If()
  }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length, s = {
    accordionLoaded: $.accordion !== null,
    containerExists: typeof document < "u" && document.getElementById(dt) !== null,
    legacyHidden: Df() > 0,
    uarpsRegionSet: typeof document < "u" && document.querySelector(`[data-uarps-region="${_r}"]`) !== null
  };
  let i = "HEALTHY";
  return $.initialized ? r < n && (i = "DEGRADED") : i = "NOT_INITIALIZED", {
    status: i,
    score: { passed: r, total: n, percentage: Math.round(r / n * 100) },
    checks: t,
    domInfo: s,
    modelLoader: e,
    moduleId: so,
    version: no,
    triggerPattern: "trigger:navigation:item-{id}",
    region: _r,
    timestamp: Date.now()
  };
}
function _c() {
  let e = null;
  try {
    e = k.info ? k.info() : {};
  } catch (t) {
    e = { error: t.message };
  }
  return {
    moduleId: so,
    version: no,
    initialized: $.initialized,
    enabled: $.enabled,
    featureFlagKey: _f,
    containerId: dt,
    accordionLoaded: $.accordion !== null,
    dataSource: e && e.source || "none",
    modelVersion: e && e.version || null,
    hasModel: e && e.hasModel || !1,
    isFallback: e && e.isFallback || !1,
    legacyHiddenCount: Df(),
    navigationEventName: Va && Va.SELECT_ITEM || "unknown",
    triggerPattern: "trigger:navigation:item-{id}",
    sectionTriggerPattern: "trigger:navigation:section-{id}",
    region: _r,
    phase: "P0 - Compatibility (3-segment compliant)",
    portsInitialized: If(),
    modelLoader: e
  };
}
const yc = "3.4.0-KERNEL-CTX";
function kf(e) {
  if ($.initialized)
    return { ok: !0, message: "Already initialized" };
  const t = (e == null ? void 0 : e.eventBus) || e, r = e == null ? void 0 : e.ports;
  return $.eventBus = t, $.initialized = !0, r && mc(r), yf(), ht() && setTimeout(() => {
    pc();
  }, 500), V("info", `Initialized (enabled: ${ht()})`), { ok: !0, enabled: ht() };
}
function io() {
  return Cf("sidebar.accordion.ncs.enabled", !0), $.initialized && !$.enabled && pc(), { ok: !0, message: "Accordion NCS enabled. Reload for full effect." };
}
function oo() {
  return Cf("sidebar.accordion.ncs.enabled", !1), $.enabled && Ec(), { ok: !0, message: "Accordion NCS disabled." };
}
function vc() {
  return ht() ? oo() : io();
}
function Ic() {
  return $.accordion;
}
async function Sc(e = !1) {
  return $.enabled && Ec(), e && k.reload && await k.reload(), ht() ? pc() : Promise.resolve({ ok: !1, message: "Feature flag not enabled" });
}
function Cc() {
  Ec(), k.abort && k.abort(), $.initialized = !1, $.eventBus = null, $.modelLoaderReady = !1;
}
function wf() {
  Cc();
}
function Ac() {
  return k.getModel();
}
function Mc() {
  return k.info ? k.info() : null;
}
function Oc() {
  return k.reload ? k.reload() : null;
}
typeof window < "u" && (window.AccordionNCS = {
  VERSION: yc,
  enable: io,
  disable: oo,
  toggle: vc,
  isEnabled: ht,
  reload: Sc,
  getAccordion: Ic,
  getNavigationModel: Ac,
  getNavigationSnapshot: Mc,
  invalidateNavigationCache: Oc,
  healthCheck: bc,
  info: _c
});
var JI = {
  VERSION: yc,
  MODULE_ID: no,
  init: kf,
  cleanup: Cc,
  enable: io,
  disable: oo,
  toggle: vc,
  isEnabled: ht,
  reload: Sc,
  getAccordion: Ic,
  getNavigationModel: Ac,
  getNavigationSnapshot: Mc,
  invalidateNavigationCache: Oc,
  destroy: wf,
  healthCheck: bc,
  info: _c,
  injectPorts: mc,
  getPorts: vf
};
const Nf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: no,
  VERSION: yc,
  cleanup: Cc,
  default: JI,
  destroy: wf,
  disable: oo,
  enable: io,
  getAccordion: Ic,
  getNavigationModel: Ac,
  getNavigationSnapshot: Mc,
  getPorts: vf,
  healthCheck: bc,
  info: _c,
  init: kf,
  injectPorts: mc,
  invalidateNavigationCache: Oc,
  isEnabled: ht,
  reload: Sc,
  toggle: vc
}, Symbol.toStringTag, { value: "Module" })), ao = "7.1.0-ES6", _s = "sidebar-animated-transitions", Bt = v({ moduleId: _s });
function QI() {
  Bt.init();
}
function eS(e) {
  return Bt.get(e);
}
function Rf(e) {
  return Bt.inject(e);
}
function xf() {
  return Bt.snapshot();
}
let Ie = null, Ce = !0, Ke = null, wt = [], gn = [], Hr = { animations: 0, groups: 0, sections: 0, timersCreated: 0, timersCleared: 0 };
const ii = {
  fadeIn: "dsd-anim--fade-in",
  fadeOut: "dsd-anim--fade-out",
  slideIn: "dsd-anim--slide-in",
  slideOut: "dsd-anim--slide-out",
  scaleIn: "dsd-anim--scale-in",
  scaleOut: "dsd-anim--scale-out",
  bounceIn: "dsd-anim--bounce-in"
}, Pf = { duration: 300, easing: "ease-out", stagger: 50, type: "slideIn" };
let Fe = { ...Pf };
function zr(e, t) {
  Hr.timersCreated++;
  const r = setTimeout(() => {
    wt = wt.filter((n) => n !== r), e();
  }, t);
  return wt.push(r), r;
}
function tS() {
  wt.forEach((e) => {
    clearTimeout(e), Hr.timersCleared++;
  }), wt = [];
}
function sd(e) {
  if (!Ce) return;
  ((e == null ? void 0 : e.items) || []).forEach((r, n) => {
    const s = Ie == null ? void 0 : Ie.querySelector(`[data-item-id="${r.id}"]`);
    s && zr(() => {
      St(s, "in");
    }, n * Fe.stagger);
  });
}
function id() {
  if (!Ce || !Ie) return;
  Ie.querySelectorAll(`.${C.ITEM}:not(.${C.ITEM_HIDDEN})`).forEach((t, r) => {
    t.classList.add("dsd-anim--searching"), zr(() => {
      t.classList.remove("dsd-anim--searching"), St(t, "in", "scaleIn");
    }, r * 30);
  });
}
function Hf(e, t, r) {
  e && Bt.inject({ eventBus: e }), QI(), Ie = t, Fe = { ...Pf, ...r || {} }, Ie && (rS(), nS());
  const n = eS("eventBus");
  if (n && n.on) {
    const s = n.on(f.ITEMS_LOADED, sd), i = n.on(f.SEARCH_RESULTS, id);
    gn.push(
      typeof s == "function" ? s : () => {
        n.off && n.off(f.ITEMS_LOADED, sd);
      }
    ), gn.push(
      typeof i == "function" ? i : () => {
        n.off && n.off(f.SEARCH_RESULTS, id);
      }
    );
  }
  n && n.emit && n.emit(f.ANIMATED_TRANSITIONS_INITIALIZED);
}
function rS() {
  Ke && Ke.disconnect(), Ke = new MutationObserver((t) => {
    Ce && t.forEach((r) => {
      r.addedNodes.forEach((n) => {
        var s;
        n.nodeType === 1 && ((s = n.classList) != null && s.contains(C.ITEM)) && St(n, "in");
      });
    });
  });
  const e = Ie == null ? void 0 : Ie.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  e && Ke.observe(e, { childList: !0, subtree: !0 });
}
function nS() {
  if (!Ce || !Ie) return;
  Ie.querySelectorAll(`.${C.ITEM}`).forEach((t, r) => {
    t.style.opacity = "0", t.style.transform = "translateX(-10px)", zr(() => {
      St(t, "in");
    }, r * Fe.stagger);
  });
}
function St(e, t, r) {
  if (!e || !Ce) return Promise.resolve();
  Hr.animations++, t = t || "in";
  const n = r || Fe.type, s = t === "in" ? ii[n] || ii.slideIn : ii[n.replace("In", "Out")] || ii.slideOut;
  return new Promise((i) => {
    e.style.animationDuration = `${Fe.duration}ms`, e.style.animationTimingFunction = Fe.easing, e.classList.add(s);
    let o = !1;
    const a = () => {
      o || (o = !0, e.classList.remove(s), e.style.opacity = t === "in" ? "1" : "0", e.style.transform = "", i());
    }, l = () => {
      e.removeEventListener("animationend", l), a();
    };
    e.addEventListener("animationend", l), zr(a, Fe.duration + 50);
  });
}
function zf(e, t, r) {
  Hr.groups++;
  const n = Array.from(e);
  return Promise.all(n.map((s, i) => new Promise((o) => {
    zr(() => {
      St(s, t, r).then(o).catch(() => {
        o();
      });
    }, i * Fe.stagger);
  })));
}
function Bf(e) {
  if (!Ce || !e) return;
  Hr.sections++, e.querySelectorAll(`.${C.ITEM}`).forEach((r, n) => {
    r.style.opacity = "0", zr(() => {
      St(r, "in", "slideIn");
    }, n * 40);
  });
}
function Uf(e) {
  if (!Ce || !e) return Promise.resolve();
  Hr.sections++;
  const t = Array.from(e.querySelectorAll(`.${C.ITEM}`)).reverse();
  return Promise.all(t.map((r, n) => new Promise((s) => {
    zr(() => {
      St(r, "out", "slideOut").then(s).catch(() => {
        s();
      });
    }, n * 20);
  })));
}
function jf(e) {
  Fe = { ...Fe, ...e };
}
function Ff() {
  Ce = !0;
}
function Gf() {
  Ce = !1;
}
function Vf() {
  return Ce;
}
function qf() {
  gn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), gn = [], tS(), Ke == null || Ke.disconnect(), Ke = null, Ce = !1, Ie = null;
}
function lo() {
  return { ...Hr, activeTimers: wt.length, cleanups: gn.length };
}
function Yf() {
  return {
    moduleId: _s,
    version: ao,
    portsInitialized: Bt.isInitialized(),
    enabled: Ce,
    hasObserver: !!Ke,
    activeTimers: wt.length,
    cleanups: gn.length,
    config: { ...Fe },
    metrics: lo(),
    p24Compliant: !0
  };
}
function Kf() {
  return {
    status: Bt.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: ao,
    moduleId: _s,
    portsInitialized: Bt.isInitialized(),
    checks: { enabled: Ce, hasObserver: !!Ke, noOrphanTimers: wt.length < 50, noOrphanListeners: !0 },
    metrics: lo(),
    p24Compliant: !0
  };
}
var sS = { init: Hf, animateElement: St, animateGroup: zf, animateSectionExpand: Bf, animateSectionCollapse: Uf, configure: jf, enable: Ff, disable: Gf, isEnabled: Vf, destroy: qf, injectPorts: Rf, getPorts: xf, getMetrics: lo, info: Yf, healthCheck: Kf, VERSION: ao, MODULE_ID: _s };
const Wf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: _s,
  VERSION: ao,
  animateElement: St,
  animateGroup: zf,
  animateSectionCollapse: Uf,
  animateSectionExpand: Bf,
  configure: jf,
  default: sS,
  destroy: qf,
  disable: Gf,
  enable: Ff,
  getMetrics: lo,
  getPorts: xf,
  healthCheck: Kf,
  info: Yf,
  init: Hf,
  injectPorts: Rf,
  isEnabled: Vf
}, Symbol.toStringTag, { value: "Module" })), co = "6.1.0-ES6", ys = "sidebar-auto-theme", Ut = v({ moduleId: ys });
function iS() {
  Ut.init();
}
function od(e) {
  return Ut.get(e);
}
function Xf(e) {
  return Ut.inject(e);
}
function Zf() {
  return Ut.snapshot();
}
const Jf = "dsd-sidebar-auto-theme", ad = { dark: c.MOD_DARK, light: c.MOD_LIGHT, "high-contrast": c.MOD_HIGH_CONTRAST };
let Ci = null, Qe = !0, Ua = null, hi = null, Ai = [], uo = "dark", ho = { themeChanges: 0, toggles: 0, errors: 0 };
function fo() {
  var e, t;
  return (e = window.matchMedia) != null && e.call(window, "(prefers-color-scheme: light)").matches ? "light" : ((t = window.matchMedia) != null && t.call(window, "(prefers-color-scheme: dark)").matches, "dark");
}
function oS() {
  try {
    Qe = localStorage.getItem(Jf) !== "false";
  } catch {
    Qe = !0;
  }
}
function Qf() {
  try {
    localStorage.setItem(Jf, String(Qe));
  } catch {
  }
}
function dl(e, t) {
  if (e) {
    if (Object.values(ad).forEach((r) => {
      r && e.classList.remove(r);
    }), t !== "dark") {
      const r = ad[t];
      r && e.classList.add(r);
    }
    uo = t, ho.themeChanges++;
  }
}
function Tc(e, t) {
  if (e && Ut.inject({ eventBus: e }), iS(), Ci = t, oS(), !Qe) return;
  const r = fo();
  dl(t, r), Ua = window.matchMedia("(prefers-color-scheme: dark)"), hi = (s) => {
    if (Qe) {
      const i = s.matches ? "dark" : "light";
      dl(Ci, i);
      const o = od("eventBus");
      o && o.emit && o.emit(f.THEME_CHANGED, { theme: i, auto: !0 });
    }
  }, Ua.addEventListener("change", hi), Ai.push(() => {
    Ua.removeEventListener("change", hi);
  });
  const n = od("eventBus");
  n && n.emit && n.emit(f.AUTO_THEME_INITIALIZED);
}
function eg(e, t) {
  return Tc(t, e), () => {
    Dc();
  };
}
function tg(e) {
  Qe = !0, ho.toggles++, Qf();
  const t = fo();
  return dl(e || Ci, t), t;
}
function rg() {
  Qe = !1, ho.toggles++, Qf();
}
function ng() {
  return Qe;
}
function sg() {
  return uo;
}
function ig() {
  return fo();
}
function Dc() {
  Ai.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), Ai = [], hi = null, Ci = null;
}
function go() {
  return { ...ho };
}
function og() {
  return { moduleId: ys, version: co, portsInitialized: Ut.isInitialized(), autoEnabled: Qe, currentTheme: uo, systemTheme: fo(), cleanups: Ai.length, metrics: go() };
}
function ag() {
  return { status: Ut.isInitialized() ? "HEALTHY" : "DEGRADED", version: co, moduleId: ys, portsInitialized: Ut.isInitialized(), checks: { autoEnabled: Qe, currentTheme: uo }, metrics: go() };
}
var aS = { init: Tc, setupAutoTheme: eg, enable: tg, disable: rg, isEnabled: ng, getCurrentTheme: sg, getSystemPreference: ig, destroy: Dc, injectPorts: Xf, getPorts: Zf, getMetrics: go, info: og, healthCheck: ag, VERSION: co, MODULE_ID: ys };
const lg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ys,
  VERSION: co,
  default: aS,
  destroy: Dc,
  disable: rg,
  enable: tg,
  getCurrentTheme: sg,
  getMetrics: go,
  getPorts: Zf,
  getSystemPreference: ig,
  healthCheck: ag,
  info: og,
  init: Tc,
  injectPorts: Xf,
  isEnabled: ng,
  setupAutoTheme: eg
}, Symbol.toStringTag, { value: "Module" })), On = "sidebar-command-palette", Tn = "6.6.0-ES6", Br = v({ moduleId: On });
function lS() {
  Br.init();
}
function st(e) {
  return Br.get(e);
}
function cS(e) {
  return Br.inject(e);
}
function uS() {
  return Br.snapshot();
}
const dr = {
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M22 10H2"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.62 1.97"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
}, E = { initialized: !1, ctx: null, modal: null, input: null, results: null, commands: [], registered: [], filtered: [], selectedIndex: 0, opens: 0, executions: 0, errors: 0, cleanups: [] };
function yr(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: On, version: Tn, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
const cg = [
  { id: "toggle-sidebar", label: "Alternar Barra Lateral", shortcut: "Ctrl+B", icon: dr.chevronLeft, keywords: ["toggle", "sidebar", "barra", "lateral", "menu", "recolher"], action() {
    const e = st("sidebar");
    e && e.toggle && e.toggle();
  } },
  { id: "collapse-all", label: "Recolher Todas as Seções", icon: dr.folder, keywords: ["collapse", "recolher", "fechar", "secoes", "grupos"], action() {
    const e = st("sidebar");
    e && e.collapseAllSections && e.collapseAllSections();
  } },
  { id: "expand-all", label: "Expandir Todas as Seções", icon: dr.folderOpen, keywords: ["expand", "expandir", "abrir", "secoes", "grupos"], action() {
    const e = st("sidebar");
    e && e.expandAllSections && e.expandAllSections();
  } },
  { id: "toggle-theme", label: "Alternar Tema", icon: dr.palette, keywords: ["theme", "tema", "claro", "escuro", "dark", "light", "modo"], action() {
    const e = st("sidebar");
    e && e.toggleTheme && e.toggleTheme();
  } },
  { id: "mini-mode", label: "Alternar Modo Compacto", icon: dr.pin, keywords: ["mini", "compacto", "colapsar", "estreito"], action() {
    const e = st("sidebar");
    e && e.toggleMiniMode && e.toggleMiniMode();
  } }
];
function dS() {
  const e = [], t = {};
  try {
    document.querySelectorAll(".dsd-sidebar__link").forEach((n) => {
      var l;
      const s = (n.getAttribute("href") || "").trim(), i = (((l = n.querySelector(".dsd-sidebar__item-text")) == null ? void 0 : l.textContent) || "").trim();
      if (!i || !s || s === "#" || s.indexOf("#/") !== 0) return;
      const o = "nav:" + s;
      if (t[o]) return;
      t[o] = 1;
      const a = n;
      e.push({
        id: o,
        label: i,
        icon: dr.play,
        shortcut: "",
        keywords: ["ir", "abrir", "navegar", "painel", "pagina", s.replace("#/", "")],
        action() {
          if (a && a.isConnected && a.click) {
            a.click();
            return;
          }
          const u = document.querySelector('.dsd-sidebar__link[href="' + s + '"]');
          u && u.click ? u.click() : window.location.href = s;
        }
      });
    });
  } catch {
  }
  return e;
}
function ld(e) {
  (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), $c());
}
function Lc() {
  E.opens++, hS(), E.modal && (E.modal.classList.add("dsd-command-palette--visible"), E.input && (E.input.value = "", E.input.focus()), E.commands = cg.concat(E.registered, dS()), E.selectedIndex = 0, dg(E.commands));
  const e = st("eventBus");
  e && e.emit && e.emit(f.COMMAND_PALETTE_OPENED);
}
function mn() {
  E.modal && E.modal.classList.remove("dsd-command-palette--visible");
  const e = st("eventBus");
  e && e.emit && e.emit(f.COMMAND_PALETTE_CLOSED);
}
function $c() {
  E.modal && E.modal.classList.contains("dsd-command-palette--visible") ? mn() : Lc();
}
function hS() {
  if (E.modal) return;
  E.modal = document.createElement("div"), E.modal.className = "dsd-command-palette", E.modal.innerHTML = '<div class="dsd-command-palette__backdrop"></div><div class="dsd-command-palette__container"><input type="text" class="dsd-command-palette__input" placeholder="Buscar comando ou painel..." /><div class="dsd-command-palette__results"></div></div>', document.body.appendChild(E.modal), E.input = E.modal.querySelector(".dsd-command-palette__input"), E.results = E.modal.querySelector(".dsd-command-palette__results");
  const e = E.modal.querySelector(".dsd-command-palette__backdrop"), t = () => {
    mn();
  };
  e.addEventListener("click", t), E.cleanups.push(() => {
    e.removeEventListener("click", t);
  });
  const r = () => {
    ug(E.input.value);
  };
  E.input.addEventListener("input", r), E.cleanups.push(() => {
    E.input.removeEventListener("input", r);
  });
  const n = (s) => {
    const i = E.results.querySelectorAll(".dsd-command-palette__item");
    s.key === "ArrowDown" ? (s.preventDefault(), E.selectedIndex = Math.min(E.selectedIndex + 1, i.length - 1), cd(i)) : s.key === "ArrowUp" ? (s.preventDefault(), E.selectedIndex = Math.max(E.selectedIndex - 1, 0), cd(i)) : s.key === "Enter" ? (s.preventDefault(), hg(E.selectedIndex)) : s.key === "Escape" && (s.preventDefault(), mn());
  };
  E.input.addEventListener("keydown", n), E.cleanups.push(() => {
    E.input.removeEventListener("keydown", n);
  });
}
function ug(e) {
  const t = e.toLowerCase(), r = E.commands.filter((n) => n.label.toLowerCase().indexOf(t) !== -1 || n.id.toLowerCase().indexOf(t) !== -1 || n.keywords && n.keywords.some((s) => (s || "").toLowerCase().indexOf(t) !== -1));
  E.selectedIndex = 0, dg(r);
}
function dg(e) {
  if (!E.results) return;
  E.filtered = e, E.results.innerHTML = e.map((r, n) => `<div class="dsd-command-palette__item${n === E.selectedIndex ? " dsd-command-palette__item--selected" : ""}" data-index="${n}"><span class="dsd-command-palette__icon">${r.icon || dr.play}</span><span class="dsd-command-palette__label">${r.label}</span>${r.shortcut ? `<kbd class="dsd-command-palette__shortcut">${r.shortcut}</kbd>` : ""}</div>`).join(""), E.results.querySelectorAll(".dsd-command-palette__item").forEach((r, n) => {
    r.addEventListener("click", () => {
      hg(n);
    });
  });
}
function cd(e) {
  e.forEach((t, r) => {
    r === E.selectedIndex ? t.classList.add("dsd-command-palette__item--selected") : t.classList.remove("dsd-command-palette__item--selected");
  });
}
function hg(e) {
  const t = E.filtered && E.filtered.length ? E.filtered : E.commands;
  if (e >= 0 && e < t.length) {
    const r = t[e];
    E.executions++, mn(), r.action && r.action();
    const n = st("eventBus");
    n && n.emit && n.emit(f.COMMAND_PALETTE_EXECUTED, { commandId: r.id });
  }
}
function fg(e) {
  if (!e || !e.id) return yr(!1, null, [{ code: "INVALID", message: "Command must have id" }]);
  const t = E.registered.findIndex((r) => r.id === e.id);
  return t >= 0 ? E.registered[t] = e : E.registered.push(e), yr(!0, { commandId: e.id });
}
function gg(e) {
  if (E.initialized) return yr(!0, { alreadyInitialized: !0 });
  try {
    E.ctx = e, e && e.ports && Br.inject(e.ports), lS(), E.commands = cg.slice(), document.addEventListener("keydown", ld), E.cleanups.push(() => {
      document.removeEventListener("keydown", ld);
    }), E.initialized = !0;
    const t = st("eventBus");
    return t && t.emit && t.emit(f.COMMAND_PALETTE_INITIALIZED, { version: Tn }), yr(!0, { initialized: !0 });
  } catch (t) {
    return E.errors++, yr(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function mg() {
  for (let e = 0; e < E.cleanups.length; e++)
    try {
      E.cleanups[e]();
    } catch {
    }
  return E.cleanups = [], E.modal && E.modal.parentNode && E.modal.parentNode.removeChild(E.modal), E.modal = null, E.input = null, E.results = null, E.initialized = !1, yr(!0, { cleanedUp: !0 });
}
function pg() {
  const e = {
    initialized: E.initialized,
    commandsRegistered: E.commands.length > 0,
    noErrors: E.errors === 0
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return E.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: On,
    version: Tn,
    portsInitialized: Br.isInitialized(),
    checks: e,
    metrics: { opens: E.opens, executions: E.executions, commandsCount: E.commands.length, errors: E.errors },
    timestamp: Date.now()
  };
}
function Eg() {
  return yr(!0, {
    moduleId: On,
    version: Tn,
    portsInitialized: Br.isInitialized(),
    initialized: E.initialized,
    commandsCount: E.commands.length,
    opens: E.opens,
    executions: E.executions
  });
}
function bg() {
  return { opens: E.opens, executions: E.executions, commandsCount: E.commands.length, errors: E.errors };
}
const _g = { singleton: !0, critical: !1, rendersUI: !0, category: "search", priority: "high" };
var fS = { id: On, version: Tn, capabilities: _g, init: gg, cleanup: mg, healthCheck: pg, info: Eg, getMetrics: bg, show: Lc, hide: mn, toggle: $c, registerCommand: fg };
const yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: On,
  VERSION: Tn,
  capabilities: _g,
  cleanup: mg,
  default: fS,
  getMetrics: bg,
  getPorts: uS,
  healthCheck: pg,
  hide: mn,
  info: Eg,
  init: gg,
  injectPorts: cS,
  registerCommand: fg,
  search: ug,
  show: Lc,
  toggle: $c
}, Symbol.toStringTag, { value: "Module" })), mo = "5.9.0-ES6", vs = "sidebar-compact-mode", jt = v({ moduleId: vs });
function gS() {
  jt.init();
}
function kc(e) {
  return jt.get(e);
}
function vg(e) {
  return jt.inject(e);
}
function Ig() {
  return jt.snapshot();
}
const Sg = "dsd-sidebar-compact", wc = "dsd-sidebar--compact";
let Ur = !1, W = null, po = { enables: 0, disables: 0, toggles: 0 };
function mS() {
  try {
    return localStorage.getItem(Sg) === "true";
  } catch {
    return !1;
  }
}
function Cg(e) {
  try {
    localStorage.setItem(Sg, String(e));
  } catch {
  }
}
function Ag(e, t) {
  e && jt.inject({ eventBus: e }), gS(), W = t;
  const r = mS();
  r && t && Eo(t);
  const n = kc("eventBus");
  return n && n.emit && n.emit(f.COMPACT_INITIALIZED), r;
}
function Eo(e) {
  if (W = e || W, !W) return !1;
  W.classList.add(wc), W.setAttribute("data-compact", "true"), Ur = !0, po.enables++, Cg(!0);
  const t = kc("eventBus");
  return t && t.emit && t.emit(f.COMPACT_ENABLED), !0;
}
function Nc(e) {
  if (W = e || W, !W) return !1;
  W.classList.remove(wc), W.removeAttribute("data-compact"), Ur = !1, po.disables++, Cg(!1);
  const t = kc("eventBus");
  return t && t.emit && t.emit(f.COMPACT_DISABLED), !0;
}
function Mg(e) {
  return W = e || W, po.toggles++, Ur ? (Nc(W), !1) : (Eo(W), !0);
}
function Og() {
  return Ur;
}
function Tg() {
  return W;
}
function Dg() {
  W && (W.classList.remove(wc), W.removeAttribute("data-compact")), W = null, Ur = !1;
}
function bo() {
  return { ...po };
}
function Lg() {
  return { moduleId: vs, version: mo, portsInitialized: jt.isInitialized(), enabled: Ur, hasContainer: !!W, metrics: bo() };
}
function $g() {
  return { status: jt.isInitialized() ? "HEALTHY" : "DEGRADED", version: mo, moduleId: vs, portsInitialized: jt.isInitialized(), checks: { enabled: Ur, hasContainer: !!W }, metrics: bo() };
}
var pS = { init: Ag, enable: Eo, disable: Nc, toggle: Mg, isEnabled: Og, getContainer: Tg, destroy: Dg, injectPorts: vg, getPorts: Ig, getMetrics: bo, info: Lg, healthCheck: $g, VERSION: mo, MODULE_ID: vs };
const kg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: vs,
  VERSION: mo,
  default: pS,
  destroy: Dg,
  disable: Nc,
  enable: Eo,
  getContainer: Tg,
  getMetrics: bo,
  getPorts: Ig,
  healthCheck: $g,
  info: Lg,
  init: Ag,
  injectPorts: vg,
  isEnabled: Og,
  toggle: Mg
}, Symbol.toStringTag, { value: "Module" })), Is = "5.9.0-ES6", Ss = "sidebar-config-manager", jr = v({ moduleId: Ss });
function ES() {
  jr.init();
}
function bS(e) {
  return jr.get(e);
}
function wg(e) {
  return jr.inject(e);
}
function Ng() {
  return jr.snapshot();
}
let we = { exports: 0, imports: 0, resets: 0, errors: 0 };
const Fr = ["dsd-sidebar-collapsed", "dsd-sidebar-width", "dsd-sidebar-theme", "dsd-sidebar-auto-theme", "dsd-sidebar-favorites", "dsd-sidebar-recent", "dsd-sidebar-order", "dsd-sidebar-expanded-sections"];
function Rg(e) {
  e && jr.inject({ eventBus: e }), ES();
  const t = bS("eventBus");
  t && t.emit && t.emit(f.CONFIG_INITIALIZED);
}
function Rc() {
  const e = { version: Is, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), settings: {} };
  return Fr.forEach((t) => {
    try {
      const r = localStorage.getItem(t);
      r !== null && (e.settings[t] = r);
    } catch {
      we.errors++;
    }
  }), we.exports++, e;
}
function xc() {
  return JSON.stringify(Rc(), null, 2);
}
function xg(e = "sidebar-config.json") {
  const t = xc(), r = new Blob([t], { type: "application/json" }), n = URL.createObjectURL(r), s = document.createElement("a");
  s.href = n, s.download = e, s.click(), URL.revokeObjectURL(n);
}
function Pc(e) {
  if (!(e != null && e.settings))
    throw we.errors++, new Error("Invalid config format");
  const t = [], r = [];
  return Object.entries(e.settings).forEach((n) => {
    const s = n[0], i = n[1];
    try {
      Fr.includes(s) && (localStorage.setItem(s, i), t.push(s));
    } catch {
      r.push(s), we.errors++;
    }
  }), we.imports++, { imported: t, failed: r, total: Object.keys(e.settings).length };
}
function Hc(e) {
  const t = JSON.parse(e);
  return Pc(t);
}
function Pg(e) {
  return new Promise((t, r) => {
    const n = new FileReader();
    n.onload = (s) => {
      try {
        const i = Hc(s.target.result);
        t(i);
      } catch (i) {
        we.errors++, r(i);
      }
    }, n.onerror = () => {
      we.errors++, r(new Error("Failed to read file"));
    }, n.readAsText(e);
  });
}
function Hg() {
  Fr.forEach((e) => {
    try {
      localStorage.removeItem(e);
    } catch {
      we.errors++;
    }
  }), we.resets++;
}
function zc() {
  const e = {};
  return Fr.forEach((t) => {
    try {
      const r = localStorage.getItem(t);
      e[t] = r !== null;
    } catch {
      e[t] = !1;
    }
  }), e;
}
function zg() {
}
function _o() {
  return { ...we };
}
function Bg() {
  return { moduleId: Ss, version: Is, portsInitialized: jr.isInitialized(), configKeys: Fr.length, summary: zc(), metrics: _o() };
}
function Ug() {
  return { status: we.errors === 0 ? "HEALTHY" : "DEGRADED", version: Is, moduleId: Ss, portsInitialized: jr.isInitialized(), checks: { configKeys: Fr.length, noErrors: we.errors === 0 }, metrics: _o() };
}
var _S = { init: Rg, exportConfig: Rc, exportConfigAsJSON: xc, downloadConfig: xg, importConfig: Pc, importConfigFromJSON: Hc, importConfigFromFile: Pg, resetConfig: Hg, getConfigSummary: zc, destroy: zg, injectPorts: wg, getPorts: Ng, getMetrics: _o, info: Bg, healthCheck: Ug, VERSION: Is, MODULE_ID: Ss, CONFIG_KEYS: Fr };
const jg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ss,
  VERSION: Is,
  default: _S,
  destroy: zg,
  downloadConfig: xg,
  exportConfig: Rc,
  exportConfigAsJSON: xc,
  getConfigSummary: zc,
  getMetrics: _o,
  getPorts: Ng,
  healthCheck: Ug,
  importConfig: Pc,
  importConfigFromFile: Pg,
  importConfigFromJSON: Hc,
  info: Bg,
  init: Rg,
  injectPorts: wg,
  resetConfig: Hg
}, Symbol.toStringTag, { value: "Module" })), yo = "6.1.0-ES6", Cs = "sidebar-context-menu", Gr = v({ moduleId: Cs });
function yS() {
  Gr.init();
}
function vS(e) {
  return Gr.get(e);
}
function Fg(e) {
  return Gr.inject(e);
}
function Gg() {
  return Gr.snapshot();
}
const Un = {
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  externalLink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  eyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};
let U = null, vo = null, pn = {}, vr = [], Mi = [], gr = { opens: 0, closes: 0, actions: 0, errors: 0 };
const Vg = [
  { id: "favorite", label: "Adicionar aos favoritos", icon: Un.star },
  { id: "open-new", label: "Abrir em nova aba", icon: Un.externalLink },
  { id: "copy-link", label: "Copiar link", icon: Un.link },
  { id: "separator", type: "separator" },
  { id: "hide", label: "Ocultar item", icon: Un.eyeOff },
  { id: "info", label: "Informações", icon: Un.info }
];
function IS() {
  if (U) return U;
  U = document.createElement("div"), U.className = c.CONTEXT_MENU, U.setAttribute("role", "menu"), U.setAttribute("aria-hidden", "true"), document.body.appendChild(U);
  const e = (n) => {
    U.contains(n.target) || cn();
  };
  document.addEventListener("click", e), vr.push(() => {
    document.removeEventListener("click", e);
  });
  const t = (n) => {
    U.contains(n.target) || cn();
  };
  document.addEventListener("contextmenu", t), vr.push(() => {
    document.removeEventListener("contextmenu", t);
  });
  const r = (n) => {
    n.key === "Escape" && cn();
  };
  return document.addEventListener("keydown", r), vr.push(() => {
    document.removeEventListener("keydown", r);
  }), U;
}
function qg() {
  Mi.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), Mi = [];
}
function SS(e) {
  qg(), U.innerHTML = "", e.forEach((t) => {
    if (t.type === "separator") {
      const s = document.createElement("div");
      s.className = c.CONTEXT_MENU_SEPARATOR, U.appendChild(s);
      return;
    }
    const r = document.createElement("button");
    r.className = c.CONTEXT_MENU_ITEM, r.setAttribute("type", "button"), r.setAttribute("role", "menuitem"), r.setAttribute("data-action", t.id), r.innerHTML = `<span class="${c.CONTEXT_MENU_ICON}">${t.icon || ""}</span><span class="${c.CONTEXT_MENU_LABEL}">${t.label}</span>`;
    const n = () => {
      gr.actions++, pn[t.id] && pn[t.id](vo, t), cn();
    };
    r.addEventListener("click", n), Mi.push(() => {
      r.removeEventListener("click", n);
    }), U.appendChild(r);
  });
}
function Yg(e) {
  e && Gr.inject({ eventBus: e }), yS();
  const t = vS("eventBus");
  t && t.emit && t.emit(f.CONTEXT_INITIALIZED);
}
function Bc(e, t, r, n) {
  IS(), vo = r, gr.opens++, SS(n || Vg), U.style.left = `${e}px`, U.style.top = `${t}px`, U.classList.add(c.CONTEXT_MENU_VISIBLE), U.setAttribute("aria-hidden", "false"), requestAnimationFrame(() => {
    const i = U.getBoundingClientRect();
    i.right > window.innerWidth && (U.style.left = `${window.innerWidth - i.width - 10}px`), i.bottom > window.innerHeight && (U.style.top = `${window.innerHeight - i.height - 10}px`);
  });
}
function cn() {
  U && (U.classList.remove(c.CONTEXT_MENU_VISIBLE), U.setAttribute("aria-hidden", "true"), gr.closes++), vo = null;
}
function Kg(e, t) {
  pn[e] = t;
}
function Wg(e, t) {
  if (!e) return () => {
  };
  const r = (n) => {
    const s = n.target.closest(`.${c.ITEM}`);
    if (!s) return;
    n.preventDefault();
    const i = s.dataset.itemId;
    Bc(n.clientX, n.clientY, i, t);
  };
  return e.addEventListener("contextmenu", r), vr.push(() => {
    e.removeEventListener("contextmenu", r);
  }), () => {
    Uc();
  };
}
function Uc() {
  qg(), vr.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), vr = [], U && (U.remove(), U = null), pn = {};
}
function Io() {
  return { opens: gr.opens, closes: gr.closes, actions: gr.actions, errors: gr.errors };
}
function Xg() {
  return { moduleId: Cs, version: yo, portsInitialized: Gr.isInitialized(), menuCreated: !!U, handlersCount: Object.keys(pn).length, currentItemId: vo, cleanups: vr.length, itemCleanups: Mi.length, metrics: Io() };
}
function Zg() {
  return { status: "HEALTHY", version: yo, moduleId: Cs, portsInitialized: Gr.isInitialized(), checks: { menuCreated: !!U, handlersCount: Object.keys(pn).length }, metrics: Io() };
}
var CS = { init: Yg, showMenu: Bc, hideMenu: cn, onAction: Kg, setupContextMenu: Wg, destroy: Uc, injectPorts: Fg, getPorts: Gg, getMetrics: Io, info: Xg, healthCheck: Zg, VERSION: yo, MODULE_ID: Cs, DEFAULT_ACTIONS: Vg };
const Jg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Cs,
  VERSION: yo,
  default: CS,
  destroy: Uc,
  getMetrics: Io,
  getPorts: Gg,
  healthCheck: Zg,
  hideMenu: cn,
  info: Xg,
  init: Yg,
  injectPorts: Fg,
  onAction: Kg,
  setupContextMenu: Wg,
  showMenu: Bc
}, Symbol.toStringTag, { value: "Module" })), So = "5.9.0-ES6", As = "sidebar-debug-panel", Ft = v({ moduleId: As });
function AS() {
  Ft.init();
}
function ud(e) {
  return Ft.get(e);
}
function Qg(e) {
  return Ft.inject(e);
}
function em() {
  return Ft.snapshot();
}
const tm = {
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};
let Mt = null, Nt = null, Gt = !1, We = [];
const dd = 100;
let un = { opens: 0, closes: 0, logsAdded: 0 }, En = [];
const MS = '.dsd-debug-panel{position:fixed;bottom:20px;right:20px;width:400px;max-height:500px;background:#1e1e2e;border:1px solid #3a3a5a;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:99999;font-family:"SF Mono","Fira Code",monospace;font-size:12px;color:#e0e0e0;display:flex;flex-direction:column;overflow:hidden;animation:debugPanelSlideIn 0.3s ease}@keyframes debugPanelSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.dsd-debug-panel__header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#2a2a4a;border-bottom:1px solid #3a3a5a;cursor:move}.dsd-debug-panel__title{font-weight:600;color:#a855f7}.dsd-debug-panel__actions{display:flex;gap:8px}.dsd-debug-panel__btn{background:transparent;border:1px solid #3a3a5a;color:#a0a0a0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center}.dsd-debug-panel__btn:hover{background:#3a3a5a;color:white}.dsd-debug-panel__tabs{display:flex;border-bottom:1px solid #3a3a5a}.dsd-debug-panel__tab{flex:1;padding:8px;background:transparent;border:none;color:#808080;cursor:pointer;font-size:11px;transition:all 0.15s ease}.dsd-debug-panel__tab--active{color:#a855f7;background:rgba(168,85,247,0.1);border-bottom:2px solid #a855f7}.dsd-debug-panel__content{flex:1;overflow-y:auto;padding:12px;max-height:350px}.dsd-debug-panel__section{margin-bottom:12px}.dsd-debug-panel__section-title{font-size:10px;text-transform:uppercase;color:#808080;margin-bottom:8px;letter-spacing:0.5px}.dsd-debug-panel__state-item{display:flex;justify-content:space-between;padding:4px 8px;background:#2a2a3a;border-radius:4px;margin-bottom:4px}.dsd-debug-panel__state-key{color:#7dd3fc}.dsd-debug-panel__state-value{color:#fbbf24;display:flex;align-items:center}.dsd-debug-panel__log{padding:6px 8px;border-left:3px solid #3a3a5a;margin-bottom:4px;font-size:11px}.dsd-debug-panel__log--info{border-color:#3b82f6}.dsd-debug-panel__log--warn{border-color:#f59e0b}.dsd-debug-panel__log--error{border-color:#ef4444}.dsd-debug-panel__log--event{border-color:#a855f7}.dsd-debug-panel__log-time{color:#808080;margin-right:8px}';
function hd(e) {
  e.ctrlKey && e.shiftKey && e.key === "D" && (e.preventDefault(), Fc());
}
function rm(e, t) {
  var n, s;
  Mt = e, e && Ft.inject({ eventBus: e }), AS(), OS(), TS(), document.addEventListener("keydown", hd), En.push(() => {
    document.removeEventListener("keydown", hd);
  }), (s = (n = ud("logger")) == null ? void 0 : n.info) == null || s.call(n, "[DebugPanel] Initialized. Press Ctrl+Shift+D to open.");
  const r = ud("eventBus");
  r && r.emit && r.emit(f.DEBUG_PANEL_INITIALIZED);
}
function OS() {
  if (document.getElementById("dsd-debug-panel-styles")) return;
  const e = document.createElement("style");
  e.id = "dsd-debug-panel-styles", e.textContent = MS, document.head.appendChild(e);
}
function TS() {
  if (!Mt || !Mt.on) return;
  const e = Mt.emit ? Mt.emit.bind(Mt) : null;
  e && (Mt.emit = (t, r) => (Gc("event", t, r), e(t, r)));
}
function fd(e) {
  const t = e.target.dataset.action, r = e.target.dataset.tab;
  t === "close" && Ms(), t === "refresh" && ns(), t === "clear" && NS(), r && (Nt.querySelectorAll(".dsd-debug-panel__tab").forEach((n) => {
    n.classList.toggle("dsd-debug-panel__tab--active", n.dataset.tab === r);
  }), ns(r));
}
function jc() {
  Gt || (Nt = DS(), document.body.appendChild(Nt), Gt = !0, un.opens++, ns("state"));
}
function Ms() {
  !Gt || !Nt || (Nt.remove(), Nt = null, Gt = !1, un.closes++);
}
function Fc() {
  Gt ? Ms() : jc();
}
function DS() {
  const e = document.createElement("div");
  return e.className = "dsd-debug-panel", e.innerHTML = `<div class="dsd-debug-panel__header"><span class="dsd-debug-panel__title">🔧 Sidebar Debug</span><div class="dsd-debug-panel__actions"><button class="dsd-debug-panel__btn" data-action="refresh">↻</button><button class="dsd-debug-panel__btn" data-action="clear">Clear</button><button class="dsd-debug-panel__btn" data-action="close">${tm.close}</button></div></div><div class="dsd-debug-panel__tabs"><button class="dsd-debug-panel__tab dsd-debug-panel__tab--active" data-tab="state">State</button><button class="dsd-debug-panel__tab" data-tab="events">Events</button><button class="dsd-debug-panel__tab" data-tab="perf">Perf</button><button class="dsd-debug-panel__tab" data-tab="features">Features</button></div><div class="dsd-debug-panel__content"></div>`, e.addEventListener("click", fd), En.push(() => {
    e.removeEventListener("click", fd);
  }), RS(e), e;
}
function ns(e) {
  const t = e || "state", r = Nt ? Nt.querySelector(".dsd-debug-panel__content") : null;
  r && (t === "state" ? r.innerHTML = LS() : t === "events" ? r.innerHTML = $S() : t === "perf" ? r.innerHTML = kS() : t === "features" && (r.innerHTML = wS()));
}
function LS() {
  const e = window.Sidebar && window.Sidebar.getState ? window.Sidebar.getState() : {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Current State</div>${Object.keys(e).map((t) => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${t}</span><span class="dsd-debug-panel__state-value">${JSON.stringify(e[t])}</span></div>`).join("")}</div>`;
}
function $S() {
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Recent Events (${We.length})</div>${We.slice(-50).reverse().map((e) => `<div class="dsd-debug-panel__log dsd-debug-panel__log--${e.type}"><span class="dsd-debug-panel__log-time">${e.time}</span>${e.message}</div>`).join("")}</div>`;
}
function kS() {
  const e = window.Sidebar && window.Sidebar.getMetrics ? window.Sidebar.getMetrics() : {}, t = performance.memory || {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Performance</div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">Render Count</span><span class="dsd-debug-panel__state-value">${e.renderCount || 0}</span></div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">JS Heap</span><span class="dsd-debug-panel__state-value">${xS(t.usedJSHeapSize || 0)}</span></div></div>`;
}
function wS() {
  const e = window.__dev && window.__dev.sidebar && window.__dev.sidebar.features ? window.__dev.sidebar.features : {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Loaded Features</div>${Object.keys(e).map((t) => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${t}</span><span class="dsd-debug-panel__state-value">${tm.check}</span></div>`).join("")}</div>`;
}
function Gc(e, t, r) {
  We.push({ type: e, message: t, data: r || null, time: (/* @__PURE__ */ new Date()).toLocaleTimeString() }), un.logsAdded++, We.length > dd && (We = We.slice(-dd)), Gt && ns("events");
}
function NS() {
  We = [], ns("events");
}
function RS(e) {
  const t = e.querySelector(".dsd-debug-panel__header");
  let r = !1, n, s, i, o;
  const a = (d) => {
    r = !0, n = d.clientX, s = d.clientY;
    const h = e.getBoundingClientRect();
    i = h.left, o = h.top;
  }, l = (d) => {
    r && (e.style.left = `${i + d.clientX - n}px`, e.style.top = `${o + d.clientY - s}px`, e.style.right = "auto", e.style.bottom = "auto");
  }, u = () => {
    r = !1;
  };
  t.addEventListener("mousedown", a), document.addEventListener("mousemove", l), document.addEventListener("mouseup", u), En.push(() => {
    t.removeEventListener("mousedown", a), document.removeEventListener("mousemove", l), document.removeEventListener("mouseup", u);
  });
}
function xS(e) {
  if (e === 0) return "0 B";
  const t = 1024, r = ["B", "KB", "MB", "GB"], n = Math.floor(Math.log(e) / Math.log(t));
  return `${parseFloat((e / Math.pow(t, n)).toFixed(2))} ${r[n]}`;
}
function nm() {
  Ms(), En.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), En = [], Mt = null;
}
function Co() {
  return { opens: un.opens, closes: un.closes, logsAdded: un.logsAdded, logCount: We.length };
}
function sm() {
  return { moduleId: As, version: So, portsInitialized: Ft.isInitialized(), isOpen: Gt, logCount: We.length, cleanups: En.length, metrics: Co() };
}
function im() {
  return { status: Ft.isInitialized() ? "HEALTHY" : "DEGRADED", version: So, moduleId: As, portsInitialized: Ft.isInitialized(), checks: { isOpen: Gt, logCount: We.length, noOrphanListeners: !0 }, metrics: Co() };
}
var PS = { init: rm, open: jc, close: Ms, toggle: Fc, log: Gc, destroy: nm, injectPorts: Qg, getPorts: em, getMetrics: Co, info: sm, healthCheck: im, VERSION: So, MODULE_ID: As };
const om = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: As,
  VERSION: So,
  close: Ms,
  default: PS,
  destroy: nm,
  getMetrics: Co,
  getPorts: em,
  healthCheck: im,
  info: sm,
  init: rm,
  injectPorts: Qg,
  log: Gc,
  open: jc,
  toggle: Fc
}, Symbol.toStringTag, { value: "Module" })), Ao = "6.1.0-ES6", Os = "sidebar-dynamic-badges", Vt = v({ moduleId: Os });
function HS() {
  Vt.init();
}
function Mo(e) {
  return Vt.get(e);
}
function am(e) {
  return Vt.inject(e);
}
function lm() {
  return Vt.snapshot();
}
let Ne = /* @__PURE__ */ new Map(), Se = /* @__PURE__ */ new Map(), rn = null, Ts = { sets: 0, removes: 0, increments: 0, decrements: 0 };
const gd = {
  count: { class: "dsd-badge--count", format: (e) => e > 99 ? "99+" : String(e) },
  dot: { class: "dsd-badge--dot", format: () => "" },
  new: { class: "dsd-badge--new", format: () => "NEW" },
  hot: { class: "dsd-badge--hot", format: () => "HOT" },
  live: { class: "dsd-badge--live", format: () => "●" },
  status: { class: "dsd-badge--status", format: (e) => e },
  percent: { class: "dsd-badge--percent", format: (e) => `${e}%` },
  time: { class: "dsd-badge--time", format: (e) => e }
};
function cm(e, t) {
  e && Vt.inject({ eventBus: e }), HS(), rn = t;
  const r = Mo("eventBus");
  r && r.emit && r.emit(f.BADGES_INITIALIZED);
}
function bn(e, t = {}) {
  const { value: r = 0, type: n = "count", variant: s = "default", pulse: i = !1, animate: o = !0, tooltip: a = null, onClick: l = null } = t;
  Ne.set(e, { value: r, type: n, variant: s, pulse: i, animate: o, tooltip: a, onClick: l, updatedAt: Date.now() }), Ts.sets++, Vc(e);
  const u = Mo("eventBus");
  return u && u.emit && u.emit(f.BADGE_UPDATED, { itemId: e, value: r, type: n }), !0;
}
function um(e) {
  return Ne.get(e) || null;
}
function Oo(e) {
  Ne.delete(e), clearInterval(Se.get(e)), Se.delete(e), Ts.removes++;
  const t = qc(e);
  if (t) {
    const n = t.querySelector(".dsd-badge");
    n && n.remove();
  }
  const r = Mo("eventBus");
  return r && r.emit && r.emit(f.BADGE_REMOVED, { itemId: e }), !0;
}
function dm(e, t = 1) {
  Ts.increments++;
  const r = Ne.get(e);
  if (!r) return bn(e, { value: t });
  r.value = (r.value || 0) + t, r.updatedAt = Date.now(), Vc(e);
  const n = Mo("eventBus");
  return n && n.emit && n.emit(f.BADGE_INCREMENTED, { itemId: e, value: r.value, amount: t }), r.value;
}
function hm(e, t = 1) {
  Ts.decrements++;
  const r = Ne.get(e);
  return r ? (r.value = Math.max(0, (r.value || 0) - t), r.updatedAt = Date.now(), r.value === 0 && r.type === "count" ? (Oo(e), 0) : (Vc(e), r.value)) : 0;
}
function fm(e, t, r = 3e4) {
  clearInterval(Se.get(e));
  const n = async () => {
    try {
      const i = await t();
      bn(e, { value: i, type: "count", pulse: !0 });
    } catch {
    }
  };
  n();
  const s = setInterval(n, r);
  return Se.set(e, s), () => {
    clearInterval(s), Se.delete(e);
  };
}
function gm(e, t, r = null) {
  let n = t;
  const s = (o) => {
    if (o >= 3600) {
      const a = Math.floor(o / 3600), l = Math.floor(o % 3600 / 60);
      return `${a}h${l}m`;
    } else if (o >= 60) {
      const a = Math.floor(o / 60), l = o % 60;
      return `${a}:${String(l).padStart(2, "0")}`;
    }
    return `${o}s`;
  };
  bn(e, { value: s(n), type: "time", pulse: !0 });
  const i = setInterval(() => {
    if (n--, n <= 0) {
      clearInterval(i), Se.delete(e), Oo(e), r && r();
      return;
    }
    bn(e, { value: s(n), type: "time", pulse: n <= 10 });
  }, 1e3);
  return Se.set(e, i), () => {
    clearInterval(i), Se.delete(e);
  };
}
function Vc(e) {
  const t = qc(e);
  if (!t) return;
  const r = Ne.get(e);
  if (!r) return;
  const { value: n, type: s, variant: i, pulse: o, animate: a, tooltip: l, onClick: u } = r, d = gd[s] || gd.count;
  let h = t.querySelector(".dsd-badge");
  if (!h) {
    h = document.createElement("span"), h.className = "dsd-badge";
    const g = t.querySelector(`.${c.ITEM_LABEL}`);
    g ? g.after(h) : t.appendChild(h);
  }
  h.className = `dsd-badge ${d.class}`, i && i !== "default" && h.classList.add(`dsd-badge--${i}`), o && h.classList.add("dsd-badge--pulse"), a && h.classList.add("dsd-badge--animate"), h.textContent = d.format(n), l && (h.title = l), u && (h.style.cursor = "pointer", h.onclick = (g) => {
    g.stopPropagation(), u(e, n);
  });
}
function qc(e) {
  return rn || (rn = document.querySelector(`.${c.ROOT}`)), rn ? rn.querySelector(`[data-item-id="${e}"], [data-panel-id="${e}"]`) : null;
}
function mm() {
  const e = {};
  return Ne.forEach((t, r) => {
    e[r] = { ...t };
  }), e;
}
function Yc() {
  Se.forEach((e) => clearInterval(e)), Se.clear(), Ne.forEach((e, t) => {
    const r = qc(t);
    if (r) {
      const n = r.querySelector(".dsd-badge");
      n && n.remove();
    }
  }), Ne.clear();
}
function pm() {
  Yc(), rn = null;
}
function To() {
  return { ...Ts, badgeCount: Ne.size, liveUpdates: Se.size };
}
function Em() {
  return { moduleId: Os, version: Ao, portsInitialized: Vt.isInitialized(), badgeCount: Ne.size, liveUpdates: Se.size, metrics: To() };
}
function bm() {
  return { status: Vt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ao, moduleId: Os, portsInitialized: Vt.isInitialized(), checks: { badgeCount: Ne.size, liveUpdates: Se.size }, metrics: To() };
}
var zS = { init: cm, setBadge: bn, getBadge: um, removeBadge: Oo, incrementBadge: dm, decrementBadge: hm, setLiveBadge: fm, setCountdownBadge: gm, getAllBadges: mm, clearAllBadges: Yc, destroy: pm, injectPorts: am, getPorts: lm, getMetrics: To, info: Em, healthCheck: bm, VERSION: Ao, MODULE_ID: Os };
const _m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Os,
  VERSION: Ao,
  clearAllBadges: Yc,
  decrementBadge: hm,
  default: zS,
  destroy: pm,
  getAllBadges: mm,
  getBadge: um,
  getMetrics: To,
  getPorts: lm,
  healthCheck: bm,
  incrementBadge: dm,
  info: Em,
  init: cm,
  injectPorts: am,
  removeBadge: Oo,
  setBadge: bn,
  setCountdownBadge: gm,
  setLiveBadge: fm
}, Symbol.toStringTag, { value: "Module" })), Do = "6.1.0-ES6", Ds = "sidebar-favorites", qt = v({ moduleId: Ds });
function BS() {
  qt.init();
}
function Lo(e) {
  return qt.get(e);
}
function ym(e) {
  return qt.inject(e);
}
function vm() {
  return qt.snapshot();
}
const Im = "dsd-sidebar-favorites";
let me = /* @__PURE__ */ new Set(), Oi = [], Ls = { adds: 0, removes: 0, toggles: 0, clears: 0 };
function US() {
  try {
    const e = localStorage.getItem(Im);
    me = new Set(e ? JSON.parse(e) : []);
  } catch {
    me = /* @__PURE__ */ new Set();
  }
}
function Kc() {
  try {
    localStorage.setItem(Im, JSON.stringify([...me]));
  } catch {
  }
}
function Sm(e) {
  e && qt.inject({ eventBus: e }), BS(), US();
  const t = Lo("eventBus");
  t && t.emit && t.emit(f.FAVORITES_INITIALIZED);
}
function Wc(e) {
  if (!e) return !1;
  me.add(e), Ls.adds++, Kc();
  const t = Lo("eventBus");
  return t && t.emit && t.emit(f.FAVORITE_ADDED, { itemId: e }), !0;
}
function Xc(e) {
  const t = me.delete(e);
  if (t) {
    Ls.removes++, Kc();
    const r = Lo("eventBus");
    r && r.emit && r.emit(f.FAVORITE_REMOVED, { itemId: e });
  }
  return t;
}
function Zc(e) {
  return Ls.toggles++, me.has(e) ? Xc(e) ? !1 : null : Wc(e) ? !0 : null;
}
function Cm(e) {
  return me.has(e);
}
function Jc() {
  return [...me];
}
function Am() {
  me.clear(), Ls.clears++, Kc();
  const e = Lo("eventBus");
  e && e.emit && e.emit(f.FAVORITES_CLEARED);
}
function Mm(e) {
  e && (e.querySelectorAll(`.${c.ITEM_FAVORITE}`).forEach((t) => {
    t.classList.remove(c.ITEM_FAVORITE);
  }), me.forEach((t) => {
    const r = e.querySelector(`[data-item-id="${t}"]`);
    r && r.classList.add(c.ITEM_FAVORITE);
  }));
}
function Om(e) {
  const t = document.createElement("button");
  t.className = c.FAVORITE_BTN, t.setAttribute("type", "button"), t.setAttribute("aria-label", "Adicionar aos favoritos"), t.setAttribute("data-item-id", e), t.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', me.has(e) && t.classList.add(c.FAVORITE_BTN_ACTIVE);
  const r = (n) => {
    n.preventDefault(), n.stopPropagation();
    const s = Zc(e);
    t.classList.toggle(c.FAVORITE_BTN_ACTIVE, s);
  };
  return t.addEventListener("click", r), Oi.push(() => t.removeEventListener("click", r)), t;
}
function Tm() {
  Oi.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), Oi = [], me.clear();
}
function $o() {
  return { ...Ls, favoritesCount: me.size };
}
function Dm() {
  return { moduleId: Ds, version: Do, portsInitialized: qt.isInitialized(), favoritesCount: me.size, favorites: Jc(), cleanups: Oi.length, metrics: $o() };
}
function Lm() {
  return { status: qt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Do, moduleId: Ds, portsInitialized: qt.isInitialized(), checks: { favoritesCount: me.size, noOrphanListeners: !0 }, metrics: $o() };
}
var jS = { init: Sm, addFavorite: Wc, removeFavorite: Xc, toggleFavorite: Zc, isFavorite: Cm, getFavorites: Jc, clearFavorites: Am, markFavoriteItems: Mm, createFavoriteButton: Om, destroy: Tm, injectPorts: ym, getPorts: vm, getMetrics: $o, info: Dm, healthCheck: Lm, VERSION: Do, MODULE_ID: Ds };
const $m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ds,
  VERSION: Do,
  addFavorite: Wc,
  clearFavorites: Am,
  createFavoriteButton: Om,
  default: jS,
  destroy: Tm,
  getFavorites: Jc,
  getMetrics: $o,
  getPorts: vm,
  healthCheck: Lm,
  info: Dm,
  init: Sm,
  injectPorts: ym,
  isFavorite: Cm,
  markFavoriteItems: Mm,
  removeFavorite: Xc,
  toggleFavorite: Zc
}, Symbol.toStringTag, { value: "Module" })), ko = "6.0.0-ES6", $s = "sidebar-feature-flags", Yt = v({ moduleId: $s });
function FS() {
  Yt.init();
}
function Dn(e) {
  return Yt.get(e);
}
function km(e) {
  return Yt.inject(e);
}
function wm() {
  return Yt.snapshot();
}
const Nm = "dsd-sidebar-feature-flags";
let ks = { enables: 0, disables: 0, toggles: 0, resets: 0 };
const Ti = {
  parallax: { enabled: !0, label: "Parallax Scroll", category: "visual" },
  customCursors: { enabled: !1, label: "Custom Cursors", category: "visual" },
  compactMode: { enabled: !0, label: "Compact Mode", category: "layout" },
  miniMode: { enabled: !0, label: "Mini Mode", category: "layout" },
  dragDrop: { enabled: !1, label: "Drag & Drop Reorder", category: "interaction" },
  fuzzySearch: { enabled: !0, label: "Fuzzy Search", category: "search" },
  commandPalette: { enabled: !0, label: "Command Palette (Ctrl+K)", category: "productivity" },
  favorites: { enabled: !0, label: "Favorites", category: "organization" },
  timeTracking: { enabled: !1, label: "Time Tracking", category: "analytics" },
  autoTheme: { enabled: !0, label: "Auto Theme Detection", category: "theme" },
  debugPanel: { enabled: !0, label: "Debug Panel", category: "debug" }
};
let G = {};
function GS() {
  try {
    const e = localStorage.getItem(Nm), t = e ? JSON.parse(e) : {};
    G = {}, Object.entries(Ti).forEach(([r, n]) => {
      var s;
      G[r] = { ...n, enabled: ((s = t[r]) == null ? void 0 : s.enabled) ?? n.enabled };
    });
  } catch {
    G = { ...Ti };
  }
}
function ws() {
  try {
    localStorage.setItem(Nm, JSON.stringify(G));
  } catch {
  }
}
function Rm(e) {
  e && Yt.inject({ eventBus: e }), FS(), GS();
  const t = Dn("eventBus");
  t && t.emit && t.emit(f.FLAGS_INITIALIZED);
}
function xm(e) {
  var t;
  return ((t = G[e]) == null ? void 0 : t.enabled) ?? !1;
}
function Pm(e) {
  if (!G[e]) return !1;
  G[e].enabled = !0, ks.enables++, ws();
  const t = Dn("eventBus");
  return t && t.emit && t.emit(f.FEATURE_ENABLED, { feature: e }), !0;
}
function Hm(e) {
  if (!G[e]) return !1;
  G[e].enabled = !1, ks.disables++, ws();
  const t = Dn("eventBus");
  return t && t.emit && t.emit(f.FEATURE_DISABLED, { feature: e }), !0;
}
function zm(e) {
  if (!G[e]) return null;
  ks.toggles++;
  const t = !G[e].enabled;
  G[e].enabled = t, ws();
  const r = Dn("eventBus");
  return r && r.emit && r.emit(f.FEATURE_TOGGLED, { feature: e, enabled: t }), t;
}
function Bm() {
  return { ...G };
}
function Um(e) {
  return Object.entries(G).filter(([t, r]) => r.category === e).map(([t, r]) => ({ key: t, ...r }));
}
function Qc() {
  return [...new Set(Object.values(G).map((t) => t.category))];
}
function jm() {
  G = { ...Ti }, ks.resets++, ws();
  const e = Dn("eventBus");
  e && e.emit && e.emit(f.FEATURES_RESET);
}
function Fm(e) {
  Object.entries(e).forEach(([r, n]) => {
    G[r] && (G[r].enabled = n);
  }), ws();
  const t = Dn("eventBus");
  t && t.emit && t.emit(f.FEATURES_BULK_UPDATED, { updates: e });
}
function Gm() {
  G = {};
}
function wo() {
  const e = Object.values(G).filter((t) => t.enabled).length;
  return { ...ks, totalFeatures: Object.keys(G).length, enabledFeatures: e };
}
function Vm() {
  return { moduleId: $s, version: ko, portsInitialized: Yt.isInitialized(), totalFeatures: Object.keys(G).length, enabledFeatures: Object.values(G).filter((e) => e.enabled).length, categories: Qc(), metrics: wo() };
}
function qm() {
  const e = Object.values(G).filter((t) => t.enabled).length;
  return { status: Yt.isInitialized() ? "HEALTHY" : "DEGRADED", version: ko, moduleId: $s, portsInitialized: Yt.isInitialized(), checks: { totalFeatures: Object.keys(G).length, enabledFeatures: e }, metrics: wo() };
}
var VS = { init: Rm, isEnabled: xm, enable: Pm, disable: Hm, toggle: zm, getAll: Bm, getByCategory: Um, getCategories: Qc, reset: jm, bulkUpdate: Fm, destroy: Gm, injectPorts: km, getPorts: wm, getMetrics: wo, info: Vm, healthCheck: qm, VERSION: ko, MODULE_ID: $s, DEFAULT_FLAGS: Ti };
const Ym = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: $s,
  VERSION: ko,
  bulkUpdate: Fm,
  default: VS,
  destroy: Gm,
  disable: Hm,
  enable: Pm,
  getAll: Bm,
  getByCategory: Um,
  getCategories: Qc,
  getMetrics: wo,
  getPorts: wm,
  healthCheck: qm,
  info: Vm,
  init: Rm,
  injectPorts: km,
  isEnabled: xm,
  reset: jm,
  toggle: zm
}, Symbol.toStringTag, { value: "Module" })), No = "6.1.0-ES6", Ns = "sidebar-fuzzy-search", Kt = v({ moduleId: Ns });
function qS() {
  Kt.init();
}
function YS(e) {
  return Kt.get(e);
}
function Km(e) {
  return Kt.inject(e);
}
function Wm() {
  return Kt.snapshot();
}
let Wn = { searches: 0, matches: 0, misses: 0 };
function KS(e, t) {
  const r = [];
  for (let n = 0; n <= t.length; n++) r[n] = [n];
  for (let n = 0; n <= e.length; n++) r[0][n] = n;
  for (let n = 1; n <= t.length; n++)
    for (let s = 1; s <= e.length; s++)
      t.charAt(n - 1) === e.charAt(s - 1) ? r[n][s] = r[n - 1][s - 1] : r[n][s] = Math.min(r[n - 1][s - 1] + 1, r[n][s - 1] + 1, r[n - 1][s] + 1);
  return r[t.length][e.length];
}
function eu(e, t) {
  const r = e.toLowerCase(), n = t.toLowerCase();
  if (n === r) return 100;
  if (n.startsWith(r)) return 90;
  if (n.includes(r)) return 80;
  if (n.split(/[\s-_]/).map((l) => l[0]).join("").includes(r)) return 70;
  const i = KS(r, n.slice(0, r.length + 2));
  if (i <= 2) return 60 - i * 10;
  let o = 0, a = -1;
  for (let l = 0; l < r.length; l++) {
    const u = r[l], d = n.indexOf(u, a + 1);
    d > a && (o += 5, a = d);
  }
  return o >= r.length * 3 ? 40 + o : 0;
}
function Xm(e) {
  e && Kt.inject({ eventBus: e }), qS();
  const t = YS("eventBus");
  t && t.emit && t.emit(f.FUZZY_INITIALIZED);
}
function tu(e, t, r = {}) {
  const n = r.labelKey || "label", s = r.threshold || 30, i = r.maxResults || 10;
  if (Wn.searches++, !t || !(e != null && e.length)) return (e == null ? void 0 : e.slice(0, i)) || [];
  const a = e.map((l) => {
    const u = typeof l == "string" ? l : l[n] || l.title || l.id || "", d = eu(t, u);
    return { item: l, score: d, text: u };
  }).filter((l) => l.score >= s).sort((l, u) => u.score - l.score).slice(0, i).map((l) => Object.assign({}, l.item, { _fuzzyScore: l.score, _fuzzyMatch: l.text }));
  return Wn.matches += a.length, a.length === 0 && Wn.misses++, a;
}
function Zm(e, t, r) {
  if (!e) return { visible: 0, hidden: 0 };
  r = r || {};
  const n = Array.from(e.querySelectorAll(`.${c.ITEM}`)), s = n.map((u) => {
    var d;
    return {
      element: u,
      label: ((d = u.textContent) == null ? void 0 : d.trim()) || "",
      id: u.dataset.itemId
    };
  }), i = tu(s, t, Object.assign({}, r, { maxResults: 100 })), o = new Set(i.map((u) => u.id));
  let a = 0, l = 0;
  return n.forEach((u) => {
    const d = u.dataset.itemId, h = !t || o.has(d);
    u.style.display = h ? "" : "none";
    const g = i.find((m) => m.id === d);
    g && (u.style.order = String(100 - (g._fuzzyScore || 0))), h ? a++ : l++;
  }), { visible: a, hidden: l, results: i };
}
function Jm(e, t) {
  if (!t) return e;
  const r = new RegExp(`(${t.split("").join(".*?")})`, "gi");
  return e.replace(r, '<mark class="fuzzy-match">$1</mark>');
}
function Qm() {
}
function Ro() {
  return { ...Wn };
}
function ep() {
  return { moduleId: Ns, version: No, portsInitialized: Kt.isInitialized(), metrics: Ro() };
}
function tp() {
  return { status: Kt.isInitialized() ? "HEALTHY" : "DEGRADED", version: No, moduleId: Ns, portsInitialized: Kt.isInitialized(), checks: { searchesPerformed: Wn.searches }, metrics: Ro() };
}
var WS = { init: Xm, search: tu, applyFuzzySearch: Zm, highlightMatch: Jm, calculateScore: eu, destroy: Qm, injectPorts: Km, getPorts: Wm, getMetrics: Ro, info: ep, healthCheck: tp, VERSION: No, MODULE_ID: Ns };
const rp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ns,
  VERSION: No,
  applyFuzzySearch: Zm,
  calculateScore: eu,
  default: WS,
  destroy: Qm,
  getMetrics: Ro,
  getPorts: Wm,
  healthCheck: tp,
  highlightMatch: Jm,
  info: ep,
  init: Xm,
  injectPorts: Km,
  search: tu
}, Symbol.toStringTag, { value: "Module" })), xo = "7.1.0-ES6", Rs = "sidebar-highlight-matches", Wt = v({ moduleId: Rs });
function XS() {
  Wt.init();
}
function np(e) {
  return Wt.get(e);
}
function sp(e) {
  return Wt.inject(e);
}
function ip() {
  return Wt.snapshot();
}
let he = null, Ln = "", Rt = [], Po = { highlights: 0, clears: 0, navigations: 0 }, $r = [];
const Dt = { highlightClass: "dsd-highlight", highlightActiveClass: "dsd-highlight--active", minQueryLength: 2 };
function op(e, t) {
  e && Wt.inject({ eventBus: e }), XS(), he = t;
  const r = np("eventBus");
  if (r && r.on) {
    const n = r.on(f.SEARCH, ZS);
    typeof n == "function" && $r.push(n);
    const s = r.on(f.SEARCH_CLEAR, $n);
    typeof s == "function" && $r.push(s);
  }
  r && r.emit && r.emit(f.HIGHLIGHT_INITIALIZED);
}
function ZS(e) {
  const t = (e == null ? void 0 : e.query) || "";
  if (t.length < Dt.minQueryLength) {
    $n();
    return;
  }
  Ln = t, ru(t);
}
function ru(e, t) {
  const r = t || he;
  if (!r || !e) return;
  $n(), Ln = e;
  const n = JS(e);
  r.querySelectorAll(`.${c.ITEM_TEXT}, .${c.ITEM_LABEL}, .${c.GROUP_TITLE}`).forEach((o) => {
    const a = o.textContent, l = a.match(n);
    if (l && l.length > 0) {
      const u = a.replace(n, (d) => `<mark class="${Dt.highlightClass}">${QS(d)}</mark>`);
      o.dataset.originalText = a, o.innerHTML = u, Rt.push(o);
    }
  }), Po.highlights++;
  const i = np("eventBus");
  return i && i.emit && i.emit(f.HIGHLIGHTS_APPLIED, { query: e, count: Rt.length }), Rt.length;
}
function JS(e) {
  const t = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), r = "gi";
  return new RegExp(`(${t})`, r);
}
function QS(e) {
  const t = document.createElement("div");
  return t.textContent = e, t.innerHTML;
}
function $n() {
  Rt.forEach((e) => {
    e.dataset.originalText && (e.textContent = e.dataset.originalText, delete e.dataset.originalText);
  }), Rt = [], Ln = "", Po.clears++, he == null || he.querySelectorAll(`.${Dt.highlightClass}`).forEach((e) => {
    const t = e.parentNode;
    t.replaceChild(document.createTextNode(e.textContent), e), t.normalize();
  });
}
function ap(e = "next") {
  const t = he == null ? void 0 : he.querySelectorAll(`.${Dt.highlightClass}`);
  if (!t || t.length === 0) return null;
  Po.navigations++;
  let r = he == null ? void 0 : he.querySelector(`.${Dt.highlightActiveClass}`), n = r ? Array.from(t).indexOf(r) : -1;
  r == null || r.classList.remove(Dt.highlightActiveClass), e === "next" ? n = (n + 1) % t.length : n = n <= 0 ? t.length - 1 : n - 1;
  const s = t[n];
  return s.classList.add(Dt.highlightActiveClass), s.scrollIntoView({ behavior: "smooth", block: "center" }), { current: n + 1, total: t.length };
}
function lp() {
  return (he == null ? void 0 : he.querySelectorAll(`.${Dt.highlightClass}`).length) || 0;
}
function cp() {
  return Ln;
}
function up() {
  $r.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), $r = [], $n(), he = null;
}
function Ho() {
  return { ...Po, currentHighlights: Rt.length, cleanups: $r.length };
}
function dp() {
  return { moduleId: Rs, version: xo, portsInitialized: Wt.isInitialized(), currentQuery: Ln, highlightCount: Rt.length, cleanups: $r.length, metrics: Ho(), p25Compliant: !0 };
}
function hp() {
  return { status: Wt.isInitialized() ? "HEALTHY" : "DEGRADED", version: xo, moduleId: Rs, portsInitialized: Wt.isInitialized(), cleanups: $r.length, checks: { highlightCount: Rt.length, currentQuery: Ln }, metrics: Ho(), p25Compliant: !0 };
}
var e0 = { init: op, highlightMatches: ru, clearHighlights: $n, navigateToMatch: ap, getMatchCount: lp, getCurrentQuery: cp, destroy: up, injectPorts: sp, getPorts: ip, getMetrics: Ho, info: dp, healthCheck: hp, VERSION: xo, MODULE_ID: Rs };
const fp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Rs,
  VERSION: xo,
  clearHighlights: $n,
  default: e0,
  destroy: up,
  getCurrentQuery: cp,
  getMatchCount: lp,
  getMetrics: Ho,
  getPorts: ip,
  healthCheck: hp,
  highlightMatches: ru,
  info: dp,
  init: op,
  injectPorts: sp,
  navigateToMatch: ap
}, Symbol.toStringTag, { value: "Module" })), zo = "6.0.0-NCS", xs = "sidebar.features.intersection-observer", Vr = v({ moduleId: xs });
function md() {
  Vr.init();
}
function ja(e) {
  return Vr.get(e);
}
function gp(e) {
  return Vr.inject(e);
}
function mp() {
  return Vr.snapshot();
}
let Le = null, te = null, at = null, Ir = /* @__PURE__ */ new Set(), lt = [], Fa = !1, Lt = null, Bo = { observes: 0, renders: 0, unrenders: 0 };
const _n = {
  rootMargin: "100px 0px",
  threshold: 0.1,
  batchSize: 10,
  batchDelay: 16
};
function pp(e, t, r = {}) {
  var n, s, i, o, a, l;
  if (e && typeof e == "object" && !e.emit) {
    const u = e, d = u.ports, h = u.eventBus, g = u.sidebarEl;
    d && Vr.inject(d), md(), te = h || ja("eventBus"), Le = g, u.config && Object.assign(_n, u.config);
  } else
    te = e, Le = t, r && Object.assign(_n, r), md();
  return "IntersectionObserver" in window ? Le ? (t0(), Di(), (a = te == null ? void 0 : te.on) == null || a.call(te, "sidebar:items-updated", Di), (l = te == null ? void 0 : te.emit) == null || l.call(te, "sidebar:intersection-observer:initialized"), { ok: !0, supported: !0 }) : ((o = (i = ja("logger")) == null ? void 0 : i.info) == null || o.call(i, "[IntersectionObserver] No container, will observe when available"), { ok: !0, deferred: !0 }) : ((s = (n = ja("logger")) == null ? void 0 : n.warn) == null || s.call(n, "[IntersectionObserver] Not supported, rendering all items"), { ok: !0, supported: !1 });
}
function t0() {
  Le && (at = new IntersectionObserver((e) => {
    e.forEach((t) => {
      t.isIntersecting ? n0(t.target) : s0(t.target);
    });
  }, {
    root: Le == null ? void 0 : Le.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`),
    rootMargin: _n.rootMargin,
    threshold: _n.threshold
  }));
}
function Di() {
  if (!at || !Le) return;
  Ir.forEach((t) => {
    Le.contains(t) || (at.unobserve(t), Ir.delete(t));
  }), Le.querySelectorAll(`.${c.ITEM}:not([data-observed])`).forEach((t) => {
    t.dataset.observed = "true", t.dataset.rendered = "false", t.classList.contains(c.ITEM_PLACEHOLDER) || r0(t), at.observe(t), Ir.add(t), Bo.observes++;
  });
}
function r0(e) {
  const t = e.offsetHeight || 40;
  e.dataset.originalContent = e.innerHTML, e.dataset.originalHeight = t, e.innerHTML = `<div class="dsd-sidebar__item-placeholder" style="height: ${t}px"><div class="dsd-sidebar__item-placeholder-icon"></div><div class="dsd-sidebar__item-placeholder-text"></div></div>`, e.classList.add(c.ITEM_PLACEHOLDER);
}
function Ep(e) {
  e.dataset.originalContent && (e.innerHTML = e.dataset.originalContent, e.classList.remove(c.ITEM_PLACEHOLDER), e.dataset.rendered = "true", delete e.dataset.originalContent);
}
function n0(e) {
  e.dataset.rendered !== "true" && (lt.includes(e) || lt.push(e), bp());
}
function s0(e) {
  Bo.unrenders++;
}
function bp() {
  Fa || lt.length === 0 || (Fa = !0, requestAnimationFrame(() => {
    var t;
    const e = lt.splice(0, _n.batchSize);
    e.forEach((r) => {
      Ep(r), Bo.renders++, r.style.opacity = "0", r.style.transform = "translateX(-10px)", requestAnimationFrame(() => {
        r.style.transition = "opacity 0.2s ease, transform 0.2s ease", r.style.opacity = "1", r.style.transform = "translateX(0)";
      });
    }), Fa = !1, lt.length > 0 && (Lt && clearTimeout(Lt), Lt = setTimeout(() => {
      Lt = null, bp();
    }, _n.batchDelay)), (t = te == null ? void 0 : te.emit) == null || t.call(te, "sidebar:lazy-render", {
      rendered: e.length,
      pending: lt.length
    });
  }));
}
function _p() {
  Ir.forEach((e) => {
    e.dataset.rendered !== "true" && Ep(e);
  }), lt = [];
}
function Uo() {
  let e = 0, t = 0;
  return Ir.forEach((r) => {
    r.dataset.rendered === "true" ? e++ : t++;
  }), { total: Ir.size, rendered: e, placeholder: t, pending: lt.length };
}
function nu() {
  Lt && (clearTimeout(Lt), Lt = null), at == null || at.disconnect(), at = null, Ir.clear(), lt = [], te = null, Le = null;
}
function yp() {
  nu();
}
function jo() {
  return { ...Bo, ...Uo() };
}
function vp() {
  return {
    moduleId: xs,
    version: zo,
    stats: Uo(),
    metrics: jo(),
    portsInitialized: Vr.isInitialized()
  };
}
function Ip() {
  const e = "IntersectionObserver" in window;
  return {
    status: e ? "HEALTHY" : "DEGRADED",
    version: zo,
    moduleId: xs,
    checks: {
      supported: e,
      hasContainer: !!Le,
      hasObserver: !!at,
      noOrphanTimers: !Lt,
      portsInitialized: Vr.isInitialized()
    },
    metrics: jo()
  };
}
var i0 = {
  init: pp,
  cleanup: nu,
  observeItems: Di,
  renderAll: _p,
  getStats: Uo,
  destroy: yp,
  getMetrics: jo,
  info: vp,
  healthCheck: Ip,
  injectPorts: gp,
  getPorts: mp,
  VERSION: zo,
  MODULE_ID: xs
};
const Sp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: xs,
  VERSION: zo,
  cleanup: nu,
  default: i0,
  destroy: yp,
  getMetrics: jo,
  getPorts: mp,
  getStats: Uo,
  healthCheck: Ip,
  info: vp,
  init: pp,
  injectPorts: gp,
  observeItems: Di,
  renderAll: _p
}, Symbol.toStringTag, { value: "Module" })), kn = "sidebar-keyboard-shortcuts-extended", wn = "7.1.0-ES6", qr = v({ moduleId: kn });
function o0() {
  qr.init();
}
function nn(e) {
  return qr.get(e);
}
function a0(e) {
  return qr.inject(e);
}
function l0() {
  return qr.snapshot();
}
const P = { initialized: !1, ctx: null, shortcuts: /* @__PURE__ */ new Map(), enabled: !0, triggered: 0, errors: 0, cleanups: [] };
function Sr(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: kn, version: wn, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
const c0 = [
  { keys: "Alt+1", action: "gotoSection1", description: "Ir para seção 1" },
  { keys: "Alt+2", action: "gotoSection2", description: "Ir para seção 2" },
  { keys: "Alt+M", action: "toggleMiniMode", description: "Alternar modo mini" },
  { keys: "Alt+B", action: "toggleSidebar", description: "Alternar sidebar" },
  { keys: "Alt+T", action: "toggleTheme", description: "Alternar tema" },
  { keys: "Shift+?", action: "showHelp", description: "Mostrar atalhos" },
  { keys: "Escape", action: "closeOverlays", description: "Fechar overlays" }
];
function pd(e) {
  const t = document.querySelectorAll(`.${c.SECTION}`);
  if (t[e]) {
    const r = t[e].querySelector(`.${c.LINK}`);
    r && r.focus();
  }
}
const Ed = {
  gotoSection1() {
    pd(0);
  },
  gotoSection2() {
    pd(1);
  },
  toggleMiniMode() {
    const e = nn("sidebar");
    e && e.toggleMiniMode && e.toggleMiniMode();
  },
  toggleSidebar() {
    const e = nn("sidebar");
    e && e.toggle && e.toggle();
  },
  toggleTheme() {
    const e = nn("sidebar");
    e && e.toggleTheme && e.toggleTheme();
  },
  showHelp() {
    Cp();
  },
  closeOverlays() {
    const e = nn("sidebar");
    e && (e.hideCommandPalette && e.hideCommandPalette(), e.hideQuickSwitcher && e.hideQuickSwitcher());
  }
};
function u0(e) {
  const t = e.split("+");
  return {
    ctrl: t.indexOf("Ctrl") >= 0,
    alt: t.indexOf("Alt") >= 0,
    shift: t.indexOf("Shift") >= 0,
    meta: t.indexOf("Meta") >= 0,
    key: t[t.length - 1].toLowerCase()
  };
}
function d0(e, t) {
  return e.ctrlKey === t.ctrl && e.altKey === t.alt && e.shiftKey === t.shift && e.metaKey === t.meta && e.key.toLowerCase() === t.key;
}
function bd(e) {
  P.enabled && P.shortcuts.forEach((t) => {
    if (d0(e, t.parsed)) {
      e.preventDefault(), P.triggered++, Ed[t.action] && Ed[t.action]();
      const r = nn("eventBus");
      r && r.emit && r.emit(f.SHORTCUT_TRIGGERED, { action: t.action, keys: t.keys });
    }
  });
}
function Cp() {
  let e = document.querySelector(".dsd-shortcuts-modal");
  if (e) {
    e.classList.toggle("dsd-shortcuts-modal--visible");
    return;
  }
  e = document.createElement("div"), e.className = "dsd-shortcuts-modal dsd-shortcuts-modal--visible";
  let t = '<div class="dsd-shortcuts-modal__overlay" data-close></div><div class="dsd-shortcuts-modal__content"><h2>Atalhos de Teclado</h2><dl>';
  P.shortcuts.forEach((r) => {
    t += `<div><dt><kbd>${r.keys}</kbd></dt><dd>${r.description}</dd></div>`;
  }), t += '</dl><button class="dsd-shortcuts-modal__close" data-close>Fechar</button></div>', e.innerHTML = t, document.body.appendChild(e), e.querySelectorAll("[data-close]").forEach((r) => {
    r.addEventListener("click", () => {
      e.classList.remove("dsd-shortcuts-modal--visible");
    });
  });
}
function su(e) {
  if (!e || !e.keys || !e.action) return Sr(!1, null, [{ code: "INVALID", message: "Shortcut must have keys and action" }]);
  const t = u0(e.keys);
  return P.shortcuts.set(e.keys, { keys: e.keys, action: e.action, description: e.description || "", parsed: t }), Sr(!0, { keys: e.keys });
}
function Ap(e) {
  if (P.initialized) return Sr(!0, { alreadyInitialized: !0 });
  try {
    P.ctx = e, e && e.ports && qr.inject(e.ports), o0(), c0.forEach((r) => {
      su(r);
    }), document.addEventListener("keydown", bd), P.cleanups.push(() => {
      document.removeEventListener("keydown", bd);
    }), P.initialized = !0;
    const t = nn("eventBus");
    return t && t.emit && t.emit(f.SHORTCUTS_INITIALIZED, { version: wn }), Sr(!0, { initialized: !0 });
  } catch (t) {
    return P.errors++, Sr(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Mp() {
  for (let e = 0; e < P.cleanups.length; e++)
    try {
      P.cleanups[e]();
    } catch {
    }
  return P.cleanups = [], P.shortcuts.clear(), P.initialized = !1, Sr(!0, { cleanedUp: !0 });
}
function Op() {
  const e = {
    initialized: P.initialized,
    shortcutsRegistered: P.shortcuts.size > 0,
    enabled: P.enabled,
    noErrors: P.errors === 0
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return P.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: kn,
    version: wn,
    portsInitialized: qr.isInitialized(),
    checks: e,
    metrics: { triggered: P.triggered, shortcutsCount: P.shortcuts.size, errors: P.errors },
    timestamp: Date.now()
  };
}
function Tp() {
  return Sr(!0, {
    moduleId: kn,
    version: wn,
    portsInitialized: qr.isInitialized(),
    initialized: P.initialized,
    shortcutsCount: P.shortcuts.size,
    triggered: P.triggered
  });
}
const Dp = { singleton: !0, critical: !1, rendersUI: !1, category: "accessibility", priority: "normal" };
function Lp() {
  return { triggered: P.triggered, shortcutsCount: P.shortcuts.size, errors: P.errors };
}
function h0() {
  P.enabled = !0;
}
function f0() {
  P.enabled = !1;
}
var g0 = { id: kn, version: wn, capabilities: Dp, init: Ap, cleanup: Mp, healthCheck: Op, info: Tp, getMetrics: Lp, registerShortcut: su };
const $p = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: kn,
  VERSION: wn,
  capabilities: Dp,
  cleanup: Mp,
  default: g0,
  disable: f0,
  enable: h0,
  getMetrics: Lp,
  getPorts: l0,
  healthCheck: Op,
  info: Tp,
  init: Ap,
  injectPorts: a0,
  registerShortcut: su,
  showShortcutsHelp: Cp
}, Symbol.toStringTag, { value: "Module" })), Fo = "6.1.0-ES6", Ps = "sidebar-mini-mode", Xt = v({ moduleId: Ps });
function m0() {
  Xt.init();
}
function iu(e) {
  return Xt.get(e);
}
function kp(e) {
  return Xt.inject(e);
}
function wp() {
  return Xt.snapshot();
}
const Np = "dsd-sidebar-mini";
let Yr = !1, K = null, ss = [], Go = { enables: 0, disables: 0, toggles: 0 };
function p0() {
  try {
    return localStorage.getItem(Np) === "true";
  } catch {
    return !1;
  }
}
function Rp(e) {
  try {
    localStorage.setItem(Np, String(e));
  } catch {
  }
}
function E0(e) {
  const t = () => {
    Yr && e.classList.add(c.MOD_MINI_HOVER);
  }, r = () => {
    e.classList.remove(c.MOD_MINI_HOVER);
  };
  e.addEventListener("mouseenter", t), e.addEventListener("mouseleave", r), ss.push(() => {
    e.removeEventListener("mouseenter", t);
  }), ss.push(() => {
    e.removeEventListener("mouseleave", r);
  });
}
function xp(e, t) {
  e && Xt.inject({ eventBus: e }), m0(), K = t, t && E0(t);
  const r = p0();
  r && t && Vo(t);
  const n = iu("eventBus");
  return n && n.emit && n.emit(f.MINI_INITIALIZED), r;
}
function Vo(e) {
  if (K = e || K, !K) return !1;
  K.classList.add(c.MOD_MINI), K.setAttribute("data-mini", "true"), Yr = !0, Go.enables++, Rp(!0), K.querySelectorAll(`.${c.ITEM}`).forEach((r) => {
    const n = r.querySelector(`.${c.ITEM_LABEL}`);
    n && r.setAttribute("title", n.textContent || "");
  });
  const t = iu("eventBus");
  return t && t.emit && t.emit(f.MINI_ENABLED), !0;
}
function qo(e) {
  if (K = e || K, !K) return !1;
  K.classList.remove(c.MOD_MINI), K.classList.remove(c.MOD_MINI_HOVER), K.removeAttribute("data-mini"), Yr = !1, Go.disables++, Rp(!1), K.querySelectorAll(`.${c.ITEM}[title]`).forEach((r) => {
    r.removeAttribute("title");
  });
  const t = iu("eventBus");
  return t && t.emit && t.emit(f.MINI_DISABLED), !0;
}
function Pp(e) {
  return K = e || K, Go.toggles++, Yr ? (qo(K), !1) : (Vo(K), !0);
}
function Hp() {
  return Yr;
}
function zp() {
  return K;
}
function Bp() {
  ss.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), ss = [], qo(K);
}
function Yo() {
  return { ...Go };
}
function Up() {
  return { moduleId: Ps, version: Fo, portsInitialized: Xt.isInitialized(), enabled: Yr, hasContainer: !!K, cleanups: ss.length, metrics: Yo() };
}
function jp() {
  return { status: Xt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Fo, moduleId: Ps, portsInitialized: Xt.isInitialized(), checks: { enabled: Yr, hasContainer: !!K }, metrics: Yo() };
}
var b0 = { init: xp, enable: Vo, disable: qo, toggle: Pp, isEnabled: Hp, getContainer: zp, destroy: Bp, injectPorts: kp, getPorts: wp, getMetrics: Yo, info: Up, healthCheck: jp, VERSION: Fo, MODULE_ID: Ps };
const Fp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ps,
  VERSION: Fo,
  default: b0,
  destroy: Bp,
  disable: qo,
  enable: Vo,
  getContainer: zp,
  getMetrics: Yo,
  getPorts: wp,
  healthCheck: jp,
  info: Up,
  init: xp,
  injectPorts: kp,
  isEnabled: Hp,
  toggle: Pp
}, Symbol.toStringTag, { value: "Module" })), Ko = "7.1.0-ES6", Hs = "sidebar-notification-dots", Zt = v({ moduleId: Hs });
function _0() {
  Zt.init();
}
function ou(e) {
  return Zt.get(e);
}
function Gp(e) {
  return Zt.inject(e);
}
function Vp() {
  return Zt.snapshot();
}
let Xn = null, Re = /* @__PURE__ */ new Map(), yn = [], Wo = { shows: 0, hides: 0, updates: 0 };
const _d = {
  default: { color: "#ef4444", size: 8 },
  success: { color: "#10b981", size: 8 },
  warning: { color: "#f59e0b", size: 8 },
  info: { color: "#3b82f6", size: 8 },
  urgent: { color: "#ef4444", size: 10, pulse: !0 }
};
function yd(e) {
  e != null && e.itemId && Xo(e.itemId, e.variant || "default", e.count);
}
function vd(e) {
  e != null && e.itemId && Kr(e.itemId);
}
function qp(e, t) {
  e && Zt.inject({ eventBus: e }), _0(), Xn = t;
  const r = ou("eventBus");
  if (r && r.on) {
    const n = r.on(f.NOTIFICATION, yd), s = r.on(f.NOTIFICATION_CLEAR, vd);
    yn.push(
      typeof n == "function" ? n : () => {
        r.off && r.off(f.NOTIFICATION, yd);
      }
    ), yn.push(
      typeof s == "function" ? s : () => {
        r.off && r.off(f.NOTIFICATION_CLEAR, vd);
      }
    );
  }
  r && r.emit && r.emit(f.DOTS_INITIALIZED);
}
function Xo(e, t = "default", r = null) {
  const n = Xn == null ? void 0 : Xn.querySelector(`[data-item-id="${e}"]`);
  if (!n) return !1;
  Kr(e);
  const s = _d[t] || _d.default, i = y0(s, r), o = n.querySelector(`.${C.LINK}`);
  o ? (o.style.position = "relative", o.appendChild(i)) : (n.style.position = "relative", n.appendChild(i)), Re.set(e, { element: i, variant: t, count: r }), Wo.shows++;
  const a = ou("eventBus");
  return a && a.emit && a.emit(f.DOT_SHOWN, { itemId: e, variant: t, count: r }), !0;
}
function y0(e, t) {
  const r = document.createElement("span");
  return r.className = "dsd-notification-dot", e.pulse && r.classList.add("dsd-notification-dot--pulse"), r.style.cssText = `position:absolute;top:8px;right:8px;width:${e.size}px;height:${e.size}px;background:${e.color};border-radius:50%;border:2px solid var(--surface-base,#1a1a2e);z-index:10;pointer-events:none;`, t !== null && t > 0 && (r.classList.add("dsd-notification-dot--count"), r.textContent = t > 99 ? "99+" : t, r.style.width = "auto", r.style.minWidth = "16px", r.style.height = "16px", r.style.padding = "0 4px", r.style.fontSize = "10px", r.style.fontWeight = "600", r.style.color = "white", r.style.display = "flex", r.style.alignItems = "center", r.style.justifyContent = "center"), r.style.animation = "dotAppear 0.3s ease-out", r;
}
function Kr(e) {
  const t = Re.get(e);
  if (!t) return !1;
  const r = t.element;
  r.style.animation = "dotDisappear 0.2s ease-out forwards", Wo.hides++, setTimeout(() => {
    r.remove(), Re.delete(e);
  }, 200);
  const n = ou("eventBus");
  return n && n.emit && n.emit(f.DOT_HIDDEN, { itemId: e }), !0;
}
function Zo(e, t) {
  Wo.updates++;
  const r = Re.get(e);
  if (!r) return !1;
  if (t <= 0) return Kr(e);
  const n = r.element;
  return n.classList.contains("dsd-notification-dot--count") && (n.textContent = t > 99 ? "99+" : t, n.style.animation = "dotPulse 0.3s ease-out"), r.count = t, !0;
}
function Yp(e, t = 1) {
  const r = Re.get(e);
  if (!r)
    return Xo(e, "default", t), t;
  const n = (r.count || 0) + t;
  return Zo(e, n), n;
}
function Kp(e, t = 1) {
  const r = Re.get(e);
  if (!r) return 0;
  const n = Math.max(0, (r.count || 0) - t);
  return n === 0 ? Kr(e) : Zo(e, n), n;
}
function au() {
  Re.forEach((e, t) => {
    Kr(t);
  });
}
function lu() {
  const e = {};
  return Re.forEach((t, r) => {
    e[r] = { variant: t.variant, count: t.count };
  }), e;
}
function Wp(e) {
  return Re.has(e);
}
function Xp() {
  yn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), yn = [], au(), Xn = null;
}
function Jo() {
  return { ...Wo, activeDots: Re.size, cleanups: yn.length };
}
function Zp() {
  return {
    moduleId: Hs,
    version: Ko,
    portsInitialized: Zt.isInitialized(),
    activeDots: Re.size,
    dots: lu(),
    cleanups: yn.length,
    metrics: Jo(),
    p24Compliant: !0
  };
}
function Jp() {
  return {
    status: Zt.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: Ko,
    moduleId: Hs,
    portsInitialized: Zt.isInitialized(),
    checks: { activeDots: Re.size, noOrphanListeners: !0 },
    metrics: Jo(),
    p24Compliant: !0
  };
}
var v0 = { init: qp, showDot: Xo, hideDot: Kr, updateCount: Zo, incrementCount: Yp, decrementCount: Kp, clearAll: au, getAll: lu, hasDot: Wp, destroy: Xp, injectPorts: Gp, getPorts: Vp, getMetrics: Jo, info: Zp, healthCheck: Jp, VERSION: Ko, MODULE_ID: Hs };
const Qp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Hs,
  VERSION: Ko,
  clearAll: au,
  decrementCount: Kp,
  default: v0,
  destroy: Xp,
  getAll: lu,
  getMetrics: Jo,
  getPorts: Vp,
  hasDot: Wp,
  healthCheck: Jp,
  hideDot: Kr,
  incrementCount: Yp,
  info: Zp,
  init: qp,
  injectPorts: Gp,
  showDot: Xo,
  updateCount: Zo
}, Symbol.toStringTag, { value: "Module" })), Qo = "6.1.0-ES6", zs = "sidebar-parallax", Jt = v({ moduleId: zs });
function I0() {
  Jt.init();
}
function S0(e) {
  return Jt.get(e);
}
function eE(e) {
  return Jt.inject(e);
}
function tE() {
  return Jt.snapshot();
}
let kr = !1, fi = null, Li = { enables: 0, disables: 0, scrollEvents: 0 };
function rE(e) {
  e && Jt.inject({ eventBus: e }), I0();
  const t = S0("eventBus");
  t && t.emit && t.emit(f.PARALLAX_INITIALIZED);
}
function cu(e) {
  if (!e || kr) return !1;
  e.classList.add(c.MOD_PARALLAX);
  const t = e.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!t) return !1;
  const r = () => {
    Li.scrollEvents++;
    const s = t.scrollTop * -0.3;
    e.style.setProperty("--parallax-offset", `${s}px`);
  };
  return t.addEventListener("scroll", r, { passive: !0 }), fi = () => {
    t.removeEventListener("scroll", r), e.classList.remove(c.MOD_PARALLAX), e.style.removeProperty("--parallax-offset");
  }, kr = !0, Li.enables++, !0;
}
function ea() {
  fi && (fi(), fi = null), kr = !1, Li.disables++;
}
function nE(e) {
  return kr ? (ea(), !1) : cu(e);
}
function sE() {
  return kr;
}
function iE() {
  ea();
}
function ta() {
  return { ...Li };
}
function oE() {
  return { moduleId: zs, version: Qo, portsInitialized: Jt.isInitialized(), enabled: kr, metrics: ta() };
}
function aE() {
  return { status: Jt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Qo, moduleId: zs, portsInitialized: Jt.isInitialized(), checks: { enabled: kr }, metrics: ta() };
}
var C0 = { init: rE, enable: cu, disable: ea, toggle: nE, isEnabled: sE, destroy: iE, injectPorts: eE, getPorts: tE, getMetrics: ta, info: oE, healthCheck: aE, VERSION: Qo, MODULE_ID: zs };
const lE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: zs,
  VERSION: Qo,
  default: C0,
  destroy: iE,
  disable: ea,
  enable: cu,
  getMetrics: ta,
  getPorts: tE,
  healthCheck: aE,
  info: oE,
  init: rE,
  injectPorts: eE,
  isEnabled: sE,
  toggle: nE
}, Symbol.toStringTag, { value: "Module" })), ra = "6.2.0-REGION-AWARE", Bs = "sidebar-preload-critical-css", Qt = v({ moduleId: Bs });
function A0() {
  Qt.init();
}
function M0(e) {
  return Qt.get(e);
}
function cE(e) {
  return Qt.inject(e);
}
function uE() {
  return Qt.snapshot();
}
let _t = [], na = { injects: 0, customAdds: 0, removes: 0 };
const dE = ".dsd-sidebar{position:relative;width:100%;height:100%;background:var(--sidebar-bg,#0E0E12);z-index:1;display:flex;flex-direction:column;transition:width var(--sidebar-transition-slow,300ms)}.dsd-sidebar.dsd-sidebar--collapsed{width:var(--sidebar-width-collapsed,72px);min-width:var(--sidebar-width-collapsed,72px)}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-text,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__section-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__search,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__badge,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-chevron{display:none}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__link{justify-content:center;padding:12px}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-icon{margin:0}.dsd-sidebar__header{flex-shrink:0;padding:1rem;border-bottom:1px solid var(--sidebar-border,rgba(255,255,255,0.06))}.dsd-sidebar__nav{flex:1;overflow-y:auto;overflow-x:hidden}.dsd-sidebar__link{display:flex;align-items:center;padding:0.625rem 1rem;color:var(--sidebar-text-secondary,rgba(229,231,235,1));text-decoration:none;transition:background var(--sidebar-transition-fast,150ms),color var(--sidebar-transition-fast,150ms)}.dsd-sidebar__item-icon{width:var(--sidebar-icon-size,20px);height:var(--sidebar-icon-size,20px);margin-right:0.75rem;flex-shrink:0}.dsd-sidebar__item-text{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:768px){.dsd-sidebar{transform:translateX(-100%);transition:transform 0.3s ease,width 0.3s ease}.dsd-sidebar--mobile-open{transform:translateX(0)}}";
function hE(e) {
  e && Qt.inject({ eventBus: e }), A0(), O0();
  const t = M0("eventBus");
  t && t.emit && (t.emit(f.CRITICAL_CSS_INJECTED), t.emit(f.PRELOAD_CSS_INITIALIZED));
}
function O0() {
  if (document.getElementById("dsd-sidebar-critical-css")) return;
  const e = document.createElement("style");
  e.id = "dsd-sidebar-critical-css", e.textContent = dE, document.head.insertBefore(e, document.head.firstChild), _t.push(e), na.injects++;
}
function fE(e, t) {
  const r = t || "dsd-sidebar-custom-" + Date.now();
  if (t) {
    const s = document.getElementById(r);
    s && s.remove();
  }
  const n = document.createElement("style");
  return n.id = r, n.textContent = e, document.head.appendChild(n), _t.push(n), na.customAdds++, r;
}
function gE(e) {
  const t = document.getElementById(e);
  return t ? (t.remove(), _t = _t.filter(function(r) {
    return r.id !== e;
  }), na.removes++, !0) : !1;
}
function mE() {
  return dE;
}
function uu() {
  _t.forEach(function(e) {
    e.remove();
  }), _t = [];
}
function pE() {
  uu();
}
function sa() {
  return Object.assign({}, na, { injectedStyles: _t.length });
}
function EE() {
  return { moduleId: Bs, version: ra, portsInitialized: Qt.isInitialized(), injectedStyles: _t.length, criticalCSSPresent: !!document.getElementById("dsd-sidebar-critical-css"), metrics: sa() };
}
function bE() {
  return { status: Qt.isInitialized() ? "HEALTHY" : "DEGRADED", version: ra, moduleId: Bs, portsInitialized: Qt.isInitialized(), checks: { injectedStyles: _t.length, criticalCSSPresent: !!document.getElementById("dsd-sidebar-critical-css") }, metrics: sa() };
}
var T0 = { init: hE, addCustomCSS: fE, removeCustomCSS: gE, getCriticalCSS: mE, cleanup: uu, destroy: pE, injectPorts: cE, getPorts: uE, getMetrics: sa, info: EE, healthCheck: bE, VERSION: ra, MODULE_ID: Bs };
const _E = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Bs,
  VERSION: ra,
  addCustomCSS: fE,
  cleanup: uu,
  default: T0,
  destroy: pE,
  getCriticalCSS: mE,
  getMetrics: sa,
  getPorts: uE,
  healthCheck: bE,
  info: EE,
  init: hE,
  injectPorts: cE,
  removeCustomCSS: gE
}, Symbol.toStringTag, { value: "Module" })), Nn = "sidebar-resize-handler", Rn = "7.1.0-ES6", lr = v({ moduleId: Nn });
function D0() {
  lr.init();
}
function is(e) {
  return lr.get(e);
}
function L0(e) {
  return lr.inject(e);
}
function $0() {
  return lr.snapshot();
}
const D = { initialized: !1, ctx: null, container: null, isResizing: !1, startX: 0, startWidth: 0, resizes: 0, errors: 0, cleanups: [] }, $e = { minWidth: 200, maxWidth: 400, defaultWidth: 260, storageKey: "dsd-sidebar-width" };
function Zn(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: Nn, version: Rn, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
function du() {
  try {
    const e = localStorage.getItem($e.storageKey);
    return e ? parseInt(e, 10) : $e.defaultWidth;
  } catch {
    return $e.defaultWidth;
  }
}
function ia(e) {
  try {
    localStorage.setItem($e.storageKey, String(e));
  } catch {
  }
}
function oa() {
  return D.container ? D.container.offsetWidth : du();
}
function yE(e) {
  const t = Math.max($e.minWidth, Math.min($e.maxWidth, e));
  D.container && (D.container.style.width = `${t}px`), ia(t);
  const r = is("eventBus");
  return r && r.emit && r.emit(f.RESIZE, { width: t }), t;
}
function vE() {
  D.container && (D.container.style.width = `${$e.defaultWidth}px`), ia($e.defaultWidth);
  const e = is("eventBus");
  return e && e.emit && e.emit(f.RESIZE_RESET, { width: $e.defaultWidth }), $e.defaultWidth;
}
function IE(e) {
  const t = e.container, r = e.eventBus;
  if (!t) return () => {
  };
  r && lr.inject({ eventBus: r }), D.container = t;
  let n = t.querySelector(`.${c.RESIZE_HANDLE}`);
  n || (n = document.createElement("div"), n.className = c.RESIZE_HANDLE, n.setAttribute("role", "separator"), n.setAttribute("aria-label", "Redimensionar sidebar"), n.setAttribute("tabindex", "0"), t.appendChild(n)), t.style.width = `${du()}px`;
  let s = null, i = null;
  const o = (a) => {
    a.preventDefault(), D.isResizing = !0, D.startX = a.clientX, D.startWidth = t.offsetWidth, t.classList.add(c.MOD_RESIZING), n.classList.add(c.RESIZE_HANDLE_ACTIVE), document.body.style.cursor = "col-resize", document.body.style.userSelect = "none", s = (l) => {
      if (!D.isResizing) return;
      const u = l.clientX - D.startX, d = Math.max($e.minWidth, Math.min($e.maxWidth, D.startWidth + u));
      t.style.width = `${d}px`;
      const h = is("eventBus");
      h && h.emit && h.emit(f.RESIZE, { width: d });
    }, i = () => {
      if (!D.isResizing) return;
      D.isResizing = !1, D.resizes++;
      const l = t.offsetWidth;
      ia(l), t.classList.remove(c.MOD_RESIZING), n.classList.remove(c.RESIZE_HANDLE_ACTIVE), document.body.style.cursor = "", document.body.style.userSelect = "", document.removeEventListener("mousemove", s), document.removeEventListener("mouseup", i);
      const u = is("eventBus");
      u && u.emit && u.emit(f.RESIZE_END, { width: l });
    }, document.addEventListener("mousemove", s), document.addEventListener("mouseup", i);
  };
  return n.addEventListener("mousedown", o), D.cleanups.push(() => {
    n.removeEventListener("mousedown", o);
  }), () => {
    aa();
  };
}
function SE(e) {
  if (D.initialized) return Zn(!0, { alreadyInitialized: !0 });
  try {
    D.ctx = e, e && e.ports && lr.inject(e.ports), D0(), D.initialized = !0;
    const t = is("eventBus");
    return t && t.emit && t.emit(f.RESIZE_INITIALIZED, { version: Rn }), Zn(!0, { initialized: !0 });
  } catch (t) {
    return D.errors++, Zn(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function aa() {
  for (let e = 0; e < D.cleanups.length; e++)
    try {
      D.cleanups[e]();
    } catch {
    }
  return D.cleanups = [], D.initialized = !1, D.container = null, Zn(!0, { cleanedUp: !0 });
}
function CE() {
  return aa();
}
function AE() {
  const e = {
    initialized: D.initialized,
    notResizing: !D.isResizing,
    lowErrorRate: D.resizes === 0 || D.errors < D.resizes * 0.2
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return D.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: Nn,
    version: Rn,
    portsInitialized: lr.isInitialized(),
    checks: e,
    metrics: { resizes: D.resizes, errors: D.errors, currentWidth: oa() },
    timestamp: Date.now()
  };
}
function ME() {
  return Zn(!0, {
    moduleId: Nn,
    version: Rn,
    portsInitialized: lr.isInitialized(),
    initialized: D.initialized,
    resizes: D.resizes,
    currentWidth: oa()
  });
}
const OE = { singleton: !0, critical: !1, rendersUI: !0, category: "layout", priority: "normal" };
function TE() {
  return { resizes: D.resizes, errors: D.errors };
}
var k0 = { id: Nn, version: Rn, capabilities: OE, init: SE, cleanup: aa, destroy: CE, healthCheck: AE, info: ME, getMetrics: TE, setupResizeHandle: IE, getWidth: oa, setWidth: yE, resetWidth: vE };
const DE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Nn,
  VERSION: Rn,
  capabilities: OE,
  cleanup: aa,
  default: k0,
  destroy: CE,
  getMetrics: TE,
  getPorts: $0,
  getSavedWidth: du,
  getWidth: oa,
  healthCheck: AE,
  info: ME,
  init: SE,
  injectPorts: L0,
  resetWidth: vE,
  saveWidth: ia,
  setWidth: yE,
  setupResizeHandle: IE
}, Symbol.toStringTag, { value: "Module" })), la = "6.1.0-ES6", Us = "sidebar-screen-reader", er = v({ moduleId: Us });
function w0() {
  er.init();
}
function N0(e) {
  return er.get(e);
}
function LE(e) {
  return er.inject(e);
}
function $E() {
  return er.snapshot();
}
let ie = null, ee = null, $t = null, os = [], hu = { announcements: 0, enhancements: 0 };
function R0() {
  return ie || (ie = document.createElement("div"), ie.setAttribute("role", "status"), ie.setAttribute("aria-live", "polite"), ie.setAttribute("aria-atomic", "true"), ie.className = "sr-only", ie.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;", document.body.appendChild(ie), ie);
}
function kE(e) {
  e && er.inject({ eventBus: e }), w0();
  const t = N0("eventBus");
  t && t.emit && t.emit(f.SCREEN_READER_INITIALIZED);
}
function Ve(e, t = "polite") {
  const r = R0();
  r.setAttribute("aria-live", t), r.textContent = "", hu.announcements++, $t && clearTimeout($t), $t = setTimeout(() => {
    r.textContent = e, $t = null;
  }, 100);
}
function wE(e) {
  e && (hu.enhancements++, e.setAttribute("role", "navigation"), e.setAttribute("aria-label", "Menu principal"), e.querySelectorAll(`.${c.SECTION}`).forEach((t, r) => {
    t.setAttribute("role", "region");
    const n = t.querySelector(`.${c.GROUP_TITLE}`), s = (n == null ? void 0 : n.textContent) || `Seção ${r + 1}`;
    t.setAttribute("aria-label", s);
  }), e.querySelectorAll(`.${c.ITEM}`).forEach((t) => {
    const r = t.querySelector(`.${c.LINK}`);
    if (r) {
      const n = t.querySelector(`.${c.ITEM_TEXT}`), s = (n == null ? void 0 : n.textContent) || "", i = t.querySelector(`.${c.BADGE}`), o = (i == null ? void 0 : i.textContent) || "";
      o && r.setAttribute("aria-label", `${s} (${o} notificações)`);
    }
  }), e.querySelectorAll(`.${c.GROUP_BUTTON}`).forEach((t) => {
    var n;
    const r = (n = t.closest(`.${c.SECTION}`)) == null ? void 0 : n.classList.contains(c.SECTION_EXPANDED);
    t.setAttribute("aria-expanded", String(r));
  }), x0(e));
}
function x0(e) {
  if (ee) return;
  ee = document.createElement("a"), ee.className = `${c.SKIP_LINK} sr-only-focusable`, ee.href = "#main-content", ee.textContent = "Pular para conteúdo principal", ee.style.cssText = "position:absolute;top:-40px;left:0;padding:8px 16px;background:var(--sidebar-accent-primary,#7B6EF6);color:white;z-index:10000;transition:top 0.2s;";
  const t = () => {
    ee.style.top = "0";
  }, r = () => {
    ee.style.top = "-40px";
  };
  ee.addEventListener("focus", t), ee.addEventListener("blur", r), os.push(() => {
    ee.removeEventListener("focus", t);
  }), os.push(() => {
    ee.removeEventListener("blur", r);
  }), e.insertBefore(ee, e.firstChild);
}
function NE(e) {
  Ve(`Navegando para ${e}`);
}
function RE(e, t) {
  Ve(`${e} ${t ? "expandido" : "colapsado"}`);
}
function xE(e) {
  Ve(e === 0 ? "Nenhum resultado encontrado" : e === 1 ? "1 resultado encontrado" : `${e} resultados encontrados`);
}
function PE(e) {
  e == null || e.classList.add(c.MOD_HIGH_CONTRAST), Ve("Modo de alto contraste ativado");
}
function HE(e) {
  e == null || e.classList.remove(c.MOD_HIGH_CONTRAST), Ve("Modo de alto contraste desativado");
}
function zE(e) {
  e == null || e.classList.add(c.MOD_LARGE_TEXT), Ve("Texto grande ativado");
}
function BE(e) {
  e == null || e.classList.remove(c.MOD_LARGE_TEXT), Ve("Texto grande desativado");
}
function UE() {
  $t && (clearTimeout($t), $t = null), os.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), os = [], ie == null || ie.remove(), ie = null, ee == null || ee.remove(), ee = null;
}
function ca() {
  return { ...hu };
}
function jE() {
  return { moduleId: Us, version: la, portsInitialized: er.isInitialized(), hasLiveRegion: !!ie, hasSkipLink: !!ee, cleanups: os.length, metrics: ca() };
}
function FE() {
  return { status: er.isInitialized() ? "HEALTHY" : "DEGRADED", version: la, moduleId: Us, portsInitialized: er.isInitialized(), checks: { liveRegionReady: !!ie || !0, noOrphanTimers: !$t }, metrics: ca() };
}
var P0 = { init: kE, announce: Ve, enhance: wE, announceNavigation: NE, announceExpansion: RE, announceSearchResults: xE, enableHighContrast: PE, disableHighContrast: HE, enableLargeText: zE, disableLargeText: BE, destroy: UE, injectPorts: LE, getPorts: $E, getMetrics: ca, info: jE, healthCheck: FE, VERSION: la, MODULE_ID: Us };
const GE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Us,
  VERSION: la,
  announce: Ve,
  announceExpansion: RE,
  announceNavigation: NE,
  announceSearchResults: xE,
  default: P0,
  destroy: UE,
  disableHighContrast: HE,
  disableLargeText: BE,
  enableHighContrast: PE,
  enableLargeText: zE,
  enhance: wE,
  getMetrics: ca,
  getPorts: $E,
  healthCheck: FE,
  info: jE,
  init: kE,
  injectPorts: LE
}, Symbol.toStringTag, { value: "Module" })), ua = "6.1.0-ES6", js = "sidebar-submenu", tr = v({ moduleId: js });
function H0() {
  tr.init();
}
function VE(e) {
  return tr.get(e);
}
function qE(e) {
  return tr.inject(e);
}
function YE() {
  return tr.snapshot();
}
let hl = [], Fs = { creates: 0, toggles: 0, opens: 0, closes: 0 };
function KE(e) {
  e && tr.inject({ eventBus: e }), H0();
  const t = VE("eventBus");
  t && t.emit && t.emit(f.SUBMENU_INITIALIZED);
}
function fu(e) {
  Fs.creates++;
  const t = document.createElement("ul");
  return t.className = c.SUBMENU, t.setAttribute("role", "menu"), e.forEach((r) => {
    const n = document.createElement("li");
    n.className = c.SUBMENU_ITEM, n.setAttribute("role", "none");
    const s = document.createElement("a");
    s.className = c.SUBMENU_LINK, s.href = r.route || `#${r.id}`, s.setAttribute("role", "menuitem"), s.setAttribute("data-submenu-item", r.id), s.textContent = r.label || r.title || r.id, n.appendChild(s), t.appendChild(n);
  }), t;
}
function WE(e, t) {
  if (!e || !(t != null && t.length)) return null;
  e.classList.add(c.ITEM_HAS_SUBMENU);
  const r = fu(t);
  return e.appendChild(r), r;
}
function gu(e) {
  if (!(e != null && e.classList.contains(c.ITEM_HAS_SUBMENU))) return !1;
  Fs.toggles++;
  const t = e.classList.toggle(c.ITEM_SUBMENU_OPEN), r = VE("eventBus");
  return r && r.emit && r.emit(f.SUBMENU_TOGGLED, { itemId: e.dataset.itemId, isOpen: t }), t;
}
function XE(e) {
  return e != null && e.classList.contains(c.ITEM_HAS_SUBMENU) ? (Fs.opens++, e.classList.add(c.ITEM_SUBMENU_OPEN), !0) : !1;
}
function ZE(e) {
  return e != null && e.classList.contains(c.ITEM_HAS_SUBMENU) ? (Fs.closes++, e.classList.remove(c.ITEM_SUBMENU_OPEN), !0) : !1;
}
function JE(e) {
  e && e.querySelectorAll(`.${c.ITEM_SUBMENU_OPEN}`).forEach((t) => {
    t.classList.remove(c.ITEM_SUBMENU_OPEN);
  });
}
function QE(e) {
  if (!e) return () => {
  };
  const t = (n) => {
    const s = n.target.closest(`.${c.ITEM_HAS_SUBMENU}`);
    if (!s) return;
    n.target.closest(`.${c.LINK}`) && (n.preventDefault(), gu(s));
  };
  e.addEventListener("click", t);
  const r = () => {
    e.removeEventListener("click", t);
  };
  return hl.push(r), r;
}
function eb() {
  hl.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), hl = [];
}
function da() {
  return { ...Fs };
}
function tb() {
  return { moduleId: js, version: ua, portsInitialized: tr.isInitialized(), metrics: da() };
}
function rb() {
  return { status: tr.isInitialized() ? "HEALTHY" : "DEGRADED", version: ua, moduleId: js, portsInitialized: tr.isInitialized(), checks: {}, metrics: da() };
}
var z0 = { init: KE, createSubmenu: fu, addSubmenuToItem: WE, toggleSubmenu: gu, openSubmenu: XE, closeSubmenu: ZE, closeAllSubmenus: JE, setupSubmenuHandlers: QE, destroy: eb, injectPorts: qE, getPorts: YE, getMetrics: da, info: tb, healthCheck: rb, VERSION: ua, MODULE_ID: js };
const nb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: js,
  VERSION: ua,
  addSubmenuToItem: WE,
  closeAllSubmenus: JE,
  closeSubmenu: ZE,
  createSubmenu: fu,
  default: z0,
  destroy: eb,
  getMetrics: da,
  getPorts: YE,
  healthCheck: rb,
  info: tb,
  init: KE,
  injectPorts: qE,
  openSubmenu: XE,
  setupSubmenuHandlers: QE,
  toggleSubmenu: gu
}, Symbol.toStringTag, { value: "Module" })), ha = "6.1.0-ES6", Gs = "sidebar-theme-handler", rr = v({ moduleId: Gs });
function B0() {
  rr.init();
}
function U0(e) {
  return rr.get(e);
}
function sb(e) {
  return rr.inject(e);
}
function ib() {
  return rr.snapshot();
}
const ob = "dsd-sidebar-theme", qe = ["dark", "light", "high-contrast"], fl = { dark: c.MOD_DARK, light: c.MOD_LIGHT, "high-contrast": c.MOD_HIGH_CONTRAST };
let Wr = "dark", dn = null, mu = { sets: 0, toggles: 0 };
function ab() {
  try {
    const e = localStorage.getItem(ob);
    return qe.includes(e) ? e : "dark";
  } catch {
    return "dark";
  }
}
function j0(e) {
  try {
    localStorage.setItem(ob, e);
  } catch {
  }
}
function lb(e, t) {
  e && rr.inject({ eventBus: e }), B0(), dn = t;
  const r = ab();
  Vs(t, r);
  const n = U0("eventBus");
  n && n.emit && n.emit(f.THEME_HANDLER_INITIALIZED);
}
function Vs(e, t) {
  if (!e || !qe.includes(t)) return !1;
  if (dn = e, mu.sets++, qe.forEach((r) => {
    const n = fl[r];
    n && e.classList.remove(n);
  }), t !== "dark") {
    const r = fl[t];
    r && e.classList.add(r);
  }
  return Wr = t, j0(t), !0;
}
function cb() {
  return Wr;
}
function ub(e) {
  mu.toggles++;
  const r = (qe.indexOf(Wr) + 1) % qe.length;
  return Vs(e, qe[r]);
}
function db(e) {
  dn = e;
  const t = ab();
  return Vs(e, t);
}
function hb() {
  return [].concat(qe);
}
function fb() {
  dn && qe.forEach((e) => {
    const t = fl[e];
    t && dn.classList.remove(t);
  }), dn = null, Wr = "dark";
}
function fa() {
  return { ...mu, currentTheme: Wr };
}
function gb() {
  return { moduleId: Gs, version: ha, portsInitialized: rr.isInitialized(), currentTheme: Wr, availableThemes: qe, metrics: fa() };
}
function mb() {
  return { status: rr.isInitialized() ? "HEALTHY" : "DEGRADED", version: ha, moduleId: Gs, portsInitialized: rr.isInitialized(), checks: { currentTheme: Wr, availableThemes: qe.length }, metrics: fa() };
}
var F0 = { init: lb, setTheme: Vs, getTheme: cb, toggleTheme: ub, initTheme: db, getAvailableThemes: hb, destroy: fb, injectPorts: sb, getPorts: ib, getMetrics: fa, info: gb, healthCheck: mb, VERSION: ha, MODULE_ID: Gs, THEMES: qe };
const pb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Gs,
  VERSION: ha,
  default: F0,
  destroy: fb,
  getAvailableThemes: hb,
  getMetrics: fa,
  getPorts: ib,
  getTheme: cb,
  healthCheck: mb,
  info: gb,
  init: lb,
  initTheme: db,
  injectPorts: sb,
  setTheme: Vs,
  toggleTheme: ub
}, Symbol.toStringTag, { value: "Module" })), ga = "6.1.0-ES6", qs = "sidebar-virtual-list", nr = v({ moduleId: qs });
function G0() {
  nr.init();
}
function ma(e) {
  return nr.get(e);
}
function Eb(e) {
  return nr.inject(e);
}
function bb() {
  return nr.snapshot();
}
let q = null, ae = { itemHeight: 40, bufferSize: 5, threshold: 50 }, M = { items: [], visibleItems: [], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: !1 }, Gn = null, pa = { enables: 0, disables: 0, renders: 0 };
function _b(e, t, r) {
  e && nr.inject({ eventBus: e }), G0(), q = t, ae = Object.assign({}, ae, r || {});
  const n = ma("eventBus");
  n && n.emit && n.emit(f.VIRTUAL_INITIALIZED);
}
function pu(e) {
  if (!q || e.length < ae.threshold) return !1;
  pa.enables++, M.items = e, M.enabled = !0, M.totalHeight = e.length * ae.itemHeight;
  const t = V0(), r = q.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!r) return !1;
  const n = r.innerHTML;
  r.innerHTML = "", r.appendChild(t);
  const s = () => {
    q0(r, t);
  };
  r.addEventListener("scroll", s, { passive: !0 }), ba(r, t), Gn = () => {
    r.removeEventListener("scroll", s), r.innerHTML = n, M.enabled = !1;
  };
  const i = ma("eventBus");
  return i && i.emit && i.emit(f.VIRTUAL_ENABLED, { itemCount: e.length }), !0;
}
function Ea() {
  pa.disables++, Gn == null || Gn(), Gn = null, M.enabled = !1;
  const e = ma("eventBus");
  e && e.emit && e.emit(f.VIRTUAL_DISABLED);
}
function V0() {
  const e = document.createElement("div");
  e.className = "dsd-virtual-list", e.style.cssText = `position:relative;height:${M.totalHeight}px;overflow:hidden;`;
  const t = document.createElement("div");
  return t.className = "dsd-virtual-list__content", t.style.cssText = "position:absolute;left:0;right:0;will-change:transform;", e.appendChild(t), e;
}
function q0(e, t) {
  M.enabled && requestAnimationFrame(() => {
    ba(e, t);
  });
}
function ba(e, t) {
  pa.renders++;
  const r = e.scrollTop, n = e.clientHeight, s = Math.max(0, Math.floor(r / ae.itemHeight) - ae.bufferSize), i = Math.min(M.items.length, Math.ceil((r + n) / ae.itemHeight) + ae.bufferSize);
  if (s === M.startIndex && i === M.endIndex) return;
  M.startIndex = s, M.endIndex = i, M.scrollTop = r;
  const o = t.querySelector(".dsd-virtual-list__content");
  if (!o) return;
  const a = document.createDocumentFragment();
  for (let u = s; u < i; u++) {
    const d = M.items[u];
    if (!d) continue;
    const h = Y0(d, u);
    a.appendChild(h);
  }
  o.innerHTML = "", o.appendChild(a), o.style.transform = `translateY(${s * ae.itemHeight}px)`, M.visibleItems = M.items.slice(s, i);
  const l = ma("eventBus");
  l && l.emit && l.emit(f.VIRTUAL_UPDATED, { startIndex: s, endIndex: i, visibleCount: i - s });
}
function Y0(e, t) {
  const r = document.createElement("div");
  r.className = `${c.ITEM} dsd-virtual-list__item`, r.style.height = `${ae.itemHeight}px`, r.dataset.itemId = e.id, r.dataset.virtualIndex = t;
  const n = e.active || e.id === K0();
  return n && r.classList.add(c.ITEM_ACTIVE), r.innerHTML = `<a class="${c.LINK}" href="${e.route || "#"}" tabindex="${n ? 0 : -1}">${e.icon ? `<span class="${c.ITEM_ICON}" aria-hidden="true">${e.icon}</span>` : ""}<span class="${c.ITEM_TEXT}">${e.label}</span>${e.badge ? `<span class="${c.BADGE}">${e.badge}</span>` : ""}</a>`, r;
}
function K0() {
  var e, t;
  return (t = (e = q == null ? void 0 : q.querySelector(`.${c.ITEM_ACTIVE}`)) == null ? void 0 : e.dataset) == null ? void 0 : t.itemId;
}
function yb(e) {
  const t = M.items.findIndex((s) => s.id === e);
  if (t === -1) return !1;
  const r = q == null ? void 0 : q.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!r) return !1;
  const n = t * ae.itemHeight;
  return r.scrollTo({ top: n, behavior: "smooth" }), !0;
}
function vb(e, t) {
  const r = M.items.findIndex((n) => n.id === e);
  if (r === -1) return !1;
  if (M.items[r] = Object.assign({}, M.items[r], t), r >= M.startIndex && r < M.endIndex) {
    const n = q == null ? void 0 : q.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`), s = q == null ? void 0 : q.querySelector(".dsd-virtual-list");
    n && s && ba(n, s);
  }
  return !0;
}
function Ib(e, t) {
  t === void 0 || t === -1 ? M.items.push(e) : M.items.splice(t, 0, e), M.totalHeight = M.items.length * ae.itemHeight;
  const r = q == null ? void 0 : q.querySelector(".dsd-virtual-list");
  return r && (r.style.height = `${M.totalHeight}px`), !0;
}
function Sb(e) {
  const t = M.items.findIndex((s) => s.id === e);
  if (t === -1) return !1;
  M.items.splice(t, 1), M.totalHeight = M.items.length * ae.itemHeight;
  const r = q == null ? void 0 : q.querySelector(".dsd-virtual-list");
  r && (r.style.height = `${M.totalHeight}px`);
  const n = q == null ? void 0 : q.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  return n && r && ba(n, r), !0;
}
function _a() {
  return { enabled: M.enabled, totalItems: M.items.length, visibleItems: M.visibleItems.length, startIndex: M.startIndex, endIndex: M.endIndex, totalHeight: M.totalHeight, itemHeight: ae.itemHeight };
}
function Cb() {
  return M.enabled;
}
function Ab() {
  return [].concat(M.items);
}
function Mb(e) {
  const t = M.enabled;
  t && Ea(), t && e.length >= ae.threshold ? pu(e) : M.items = e;
}
function Ob() {
  Ea(), M = { items: [], visibleItems: [], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: !1 };
}
function ya() {
  return { ...pa, ..._a() };
}
function Tb() {
  return { moduleId: qs, version: ga, portsInitialized: nr.isInitialized(), state: _a(), metrics: ya() };
}
function Db() {
  return { status: nr.isInitialized() ? "HEALTHY" : "DEGRADED", version: ga, moduleId: qs, portsInitialized: nr.isInitialized(), checks: { enabled: M.enabled, itemCount: M.items.length, visibleCount: M.visibleItems.length, threshold: ae.threshold }, metrics: ya() };
}
var W0 = { init: _b, enable: pu, disable: Ea, scrollToItem: yb, updateItem: vb, addItem: Ib, removeItem: Sb, getState: _a, isEnabled: Cb, getItems: Ab, setItems: Mb, healthCheck: Db, destroy: Ob, injectPorts: Eb, getPorts: bb, getMetrics: ya, info: Tb, VERSION: ga, MODULE_ID: qs };
const Lb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: qs,
  VERSION: ga,
  addItem: Ib,
  default: W0,
  destroy: Ob,
  disable: Ea,
  enable: pu,
  getItems: Ab,
  getMetrics: ya,
  getPorts: bb,
  getState: _a,
  healthCheck: Db,
  info: Tb,
  init: _b,
  injectPorts: Eb,
  isEnabled: Cb,
  removeItem: Sb,
  scrollToItem: yb,
  setItems: Mb,
  updateItem: vb
}, Symbol.toStringTag, { value: "Module" })), Eu = {
  "accessibility-landmarks": bf,
  "accordion-ncs": Nf,
  "animated-transitions": Wf,
  "auto-theme": lg,
  "command-palette": yg,
  "compact-mode": kg,
  "config-manager": jg,
  "context-menu": Jg,
  "debug-panel": om,
  "dynamic-badges": _m,
  "event-setup": H_,
  "favorites-handler": $m,
  "feature-flags": Ym,
  "fuzzy-search": rp,
  "highlight-matches": fp,
  "intersection-observer": Sp,
  "keyboard-navigation": tI,
  "keyboard-shortcuts-extended": $p,
  "mini-mode": Fp,
  "mobile-handler": oI,
  "notification-dots": Qp,
  parallax: lE,
  "preload-critical-css": _E,
  "resize-handler": DE,
  "router-sync": q_,
  "screen-reader": GE,
  "submenu-handler": nb,
  "theme-handler": pb,
  "virtual-list": Lb
}, bu = "5.3.0-P2-ENTERPRISE", _u = "sidebar-window-api", $b = 30, va = v({ moduleId: _u });
function X0() {
  va.init();
}
function gl(e) {
  return va.get(e);
}
function Z0() {
  var t, r;
  const e = gl("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const yt = (e, ...t) => {
  const r = "[WindowAPI]", n = Z0();
  n != null && n[e] ? n[e](r, ...t) : !It() && (e === "error" || e === "warn" || e === "info") && console.debug(r, ...t);
};
function J0() {
  var t, r;
  const e = gl("eventBus") || gl("eventBusGlobal");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("EventBus");
    if (n) return n;
  }
  return null;
}
const B = {
  initialized: !1,
  setupAt: null,
  getInstance: null,
  getSidebarEl: null,
  featureCache: /* @__PURE__ */ new Map(),
  legacyBridgeApplied: !1,
  featuresPreloaded: !1,
  readyListenerCleanup: null
}, X = {
  apiCalls: 0,
  setupCalls: 0,
  featureLoads: 0,
  errors: 0,
  lastCallAt: null,
  mostUsedMethods: {},
  preloadStartedAt: null,
  preloadCompletedAt: null
};
function T(e) {
  X.apiCalls++, X.lastCallAt = Date.now(), X.mostUsedMethods[e] = (X.mostUsedMethods[e] || 0) + 1;
}
async function kb(e, t) {
  if (!t || !t.module) return null;
  try {
    const r = t.module.endsWith(".js") ? t.module.slice(0, -3) : t.module, n = Eu[r];
    return n ? (X.featureLoads++, n) : (X.errors++, yt("warn", `Feature not found in barrel: ${r}`), null);
  } catch (r) {
    return X.errors++, yt("warn", `Failed to load feature: ${e}`, r.message), null;
  }
}
function Id(e) {
  return of(e, rs, kb);
}
async function Q0(e) {
  if (B.featureCache.has(e)) return B.featureCache.get(e);
  try {
    const t = Eu[e];
    return t ? (B.featureCache.set(e, t), X.featureLoads++, t) : (X.errors++, yt("warn", `Feature not found in barrel: ${e}`), null);
  } catch (t) {
    return X.errors++, yt("warn", `Failed to load feature: ${e}`, t.message), null;
  }
}
async function Ga() {
  if (B.featuresPreloaded) return;
  X.preloadStartedAt = Date.now();
  const e = ["favorites", "theme", "search", "commands", "context", "submenu", "resize"];
  try {
    await NI(e, rs, kb);
    const t = ["theme-handler", "resize-handler", "favorites-handler", "command-palette", "fuzzy-search", "context-menu", "submenu-handler"];
    await Promise.all(t.map((r) => Q0(r))), B.featuresPreloaded = !0, X.preloadCompletedAt = Date.now(), yt("info", "Features preloaded post-READY", { duration: X.preloadCompletedAt - X.preloadStartedAt, featuresCount: e.length + t.length });
  } catch (t) {
    X.errors++, yt("warn", "Preload failed:", t.message);
  }
}
function eC() {
  const e = J0();
  if (!e || !e.on) {
    yt("warn", "No EventBus, preloading immediately"), Ga();
    return;
  }
  const t = () => {
    Ga(), B.readyListenerCleanup && (B.readyListenerCleanup(), B.readyListenerCleanup = null);
  }, r = e.on(f.READY, t);
  typeof r == "function" ? B.readyListenerCleanup = r : B.readyListenerCleanup = () => {
    e.off && e.off(f.READY, t);
  }, setTimeout(() => {
    B.featuresPreloaded || (yt("warn", "READY timeout, preloading now"), Ga());
  }, 5e3);
}
function tC(e, t, r, n) {
  if (!(typeof window > "u")) {
    if (X.setupCalls++, B.initialized = !0, B.setupAt = Date.now(), B.getInstance = e, B.getSidebarEl = t, X0(), eC(), It()) {
      yt("info", "Strict mode: window.Sidebar not exposed");
      return;
    }
    window.Sidebar = {
      createSidebar: () => (T("createSidebar"), r()),
      getSidebar: () => (T("getSidebar"), e()),
      destroySidebar: () => (T("destroySidebar"), n()),
      toggle: () => {
        var s, i;
        return T("toggle"), (i = (s = e()) == null ? void 0 : s.toggle) == null ? void 0 : i.call(s);
      },
      collapse: () => {
        var s, i;
        return T("collapse"), (i = (s = e()) == null ? void 0 : s.collapse) == null ? void 0 : i.call(s);
      },
      expand: () => {
        var s, i;
        return T("expand"), (i = (s = e()) == null ? void 0 : s.expand) == null ? void 0 : i.call(s);
      },
      getState: () => {
        var s, i;
        return T("getState"), (i = (s = e()) == null ? void 0 : s.getState) == null ? void 0 : i.call(s);
      },
      getMetrics: () => (T("getMetrics"), Je().data),
      healthCheck: () => {
        var s, i;
        return T("healthCheck"), (i = (s = e()) == null ? void 0 : s.healthCheck) == null ? void 0 : i.call(s);
      },
      info: () => {
        var s, i;
        return T("info"), (i = (s = e()) == null ? void 0 : s.info) == null ? void 0 : i.call(s);
      },
      refresh: () => {
        var s, i;
        return T("refresh"), (i = (s = e()) == null ? void 0 : s.refresh) == null ? void 0 : i.call(s);
      },
      navigate: (s) => {
        var i, o;
        return T("navigate"), (o = (i = e()) == null ? void 0 : i.navigate) == null ? void 0 : o.call(i, s);
      },
      setActiveItem: (s) => {
        var i, o;
        return T("setActiveItem"), (o = (i = e()) == null ? void 0 : i.setActiveItem) == null ? void 0 : o.call(i, s);
      },
      toggleSection: (s) => {
        var i, o;
        return T("toggleSection"), (o = (i = e()) == null ? void 0 : i.toggleSection) == null ? void 0 : o.call(i, s);
      },
      expandSection: (s) => {
        var i, o;
        return T("expandSection"), (o = (i = e()) == null ? void 0 : i.expandSection) == null ? void 0 : o.call(i, s);
      },
      collapseSection: (s) => {
        var i, o;
        return T("collapseSection"), (o = (i = e()) == null ? void 0 : i.collapseSection) == null ? void 0 : o.call(i, s);
      },
      expandAllSections: () => {
        var s, i;
        return T("expandAllSections"), (i = (s = e()) == null ? void 0 : s.expandAllSections) == null ? void 0 : i.call(s);
      },
      collapseAllSections: () => {
        var s, i;
        return T("collapseAllSections"), (i = (s = e()) == null ? void 0 : s.collapseAllSections) == null ? void 0 : i.call(s);
      },
      getExpandedSections: () => {
        var s, i;
        return T("getExpandedSections"), (i = (s = e()) == null ? void 0 : s.getExpandedSections) == null ? void 0 : i.call(s);
      },
      openMobile: () => {
        var s, i;
        return T("openMobile"), (i = (s = e()) == null ? void 0 : s.openMobile) == null ? void 0 : i.call(s);
      },
      closeMobile: () => {
        var s, i;
        return T("closeMobile"), (i = (s = e()) == null ? void 0 : s.closeMobile) == null ? void 0 : i.call(s);
      },
      toggleMobile: () => {
        var s, i;
        return T("toggleMobile"), (i = (s = e()) == null ? void 0 : s.toggleMobile) == null ? void 0 : i.call(s);
      },
      forceSync: () => {
        var s, i;
        return T("forceSync"), (i = (s = e()) == null ? void 0 : s.forceSync) == null ? void 0 : i.call(s);
      },
      checkPersistenceSync: () => (T("checkPersistenceSync"), D_()),
      forcePersistenceSync: () => (T("forcePersistenceSync"), L_()),
      feature: (s) => (T(`feature:${s}`), Id(s)),
      kernel: {
        listFeatures: () => Fi(),
        getFeatureStatus: (s) => ps(s),
        enableFeature: (s, i) => ms(s, i),
        disableFeature: (s, i) => An(s, i),
        metrics: () => Mn(),
        healthCheck: () => ar()
      },
      metrics: {
        aggregate: () => Je(),
        getSourceMetrics: (s) => Yi(s),
        listSources: () => Xi(),
        takeSnapshot: (s) => Ki(s),
        getSnapshots: (s) => Wi(s)
      },
      registry: {
        setBadge: (s, i) => w.setBadge(s, i),
        getBadge: (s) => w.getBadge(s),
        removeBadge: (s) => w.removeBadge(s),
        getItem: (s) => {
          var i;
          return (i = w.getItem) == null ? void 0 : i.call(w, s);
        },
        getItems: () => {
          var s;
          return (s = w.getItems) == null ? void 0 : s.call(w);
        }
      },
      showSkeleton: (s) => {
        var i, o, a;
        return T("showSkeleton"), (a = (o = (i = e()) == null ? void 0 : i._renderer) == null ? void 0 : o.showSkeleton) == null ? void 0 : a.call(o, s);
      },
      hideSkeleton: () => {
        var s, i, o;
        return T("hideSkeleton"), (o = (i = (s = e()) == null ? void 0 : s._renderer) == null ? void 0 : i.hideSkeleton) == null ? void 0 : o.call(i);
      },
      setLoading: (s) => {
        var i, o, a;
        return T("setLoading"), (a = (o = (i = e()) == null ? void 0 : i._renderer) == null ? void 0 : o.setLoading) == null ? void 0 : a.call(o, s);
      },
      animateIn: () => {
        var s;
        return T("animateIn"), (s = t()) == null ? void 0 : s.classList.add(c.MOD_ANIMATE_IN);
      },
      enableMiniMode: () => {
        var s;
        return T("enableMiniMode"), (s = t()) == null ? void 0 : s.classList.add(c.MOD_MINI);
      },
      disableMiniMode: () => {
        var s;
        return T("disableMiniMode"), (s = t()) == null ? void 0 : s.classList.remove(c.MOD_MINI);
      },
      toggleMiniMode: () => {
        var s;
        return T("toggleMiniMode"), (s = t()) == null ? void 0 : s.classList.toggle(c.MOD_MINI);
      },
      enableCompactMode: () => {
        var s;
        return T("enableCompactMode"), (s = t()) == null ? void 0 : s.classList.add(c.MOD_COMPACT);
      },
      disableCompactMode: () => {
        var s;
        return T("disableCompactMode"), (s = t()) == null ? void 0 : s.classList.remove(c.MOD_COMPACT);
      },
      toggleCompactMode: () => {
        var s;
        return T("toggleCompactMode"), (s = t()) == null ? void 0 : s.classList.toggle(c.MOD_COMPACT);
      },
      search: (s) => {
        var i, o, a;
        return T("search"), (a = (o = (i = e()) == null ? void 0 : i._renderer) == null ? void 0 : o.filterItems) == null ? void 0 : a.call(o, s);
      },
      clearSearch: () => {
        var s, i, o;
        return T("clearSearch"), (o = (i = (s = e()) == null ? void 0 : s._renderer) == null ? void 0 : i.clearSearch) == null ? void 0 : o.call(i);
      },
      config: {
        legacyWarnings: !0,
        setLegacyWarnings: (s) => {
          window.Sidebar.config.legacyWarnings = s, za();
        },
        getDeprecationReport: () => za(),
        getFeatureContracts: () => ({ ...rs }),
        listFeatures: () => Object.keys(rs)
      },
      VERSION: mr,
      MODULE_ID: le,
      CAPABILITIES: Od,
      TOTAL_FEATURES: $b,
      API_VERSION: bu,
      getAPIMetrics: () => sC(),
      getAPIInfo: () => nC(),
      getAPIHealthCheck: () => rC(),
      getProxyMetrics: () => Qi()
    }, UI(window.Sidebar, Id), B.legacyBridgeApplied = !0, za({ showWarnings: window.Sidebar.config.legacyWarnings });
  }
}
function rC() {
  const t = B.getInstance && typeof B.getInstance == "function" && B.getInstance() !== null, r = typeof window < "u" && window.Sidebar !== void 0, n = va.isInitialized(), s = ar(), i = RI(), o = {
    initialized: B.initialized,
    instanceExists: t,
    windowAPIExists: r,
    portsInitialized: n,
    kernelReady: s.status === "HEALTHY",
    legacyBridgeApplied: B.legacyBridgeApplied,
    proxyHealthy: i.status === "HEALTHY",
    featuresPreloaded: B.featuresPreloaded,
    noErrors: X.errors === 0
  }, a = Object.values(o).filter(Boolean).length, l = Object.keys(o).length;
  let u = "HEALTHY";
  return a < l && a >= Math.floor(l * 0.6) && (u = "DEGRADED"), a < Math.floor(l * 0.6) && (u = "UNHEALTHY"), {
    status: u,
    score: { passed: a, total: l, percentage: Math.round(a / l * 100) },
    checks: o,
    issues: Object.entries(o).filter(([, d]) => !d).map(([d]) => ({ code: d, severity: "warn", message: `Check failed: ${d}` })),
    moduleId: _u,
    version: bu,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    ports: { initialized: n, missing: [] },
    strictMode: It(),
    timestamp: Date.now()
  };
}
function nC() {
  const e = Object.entries(X.mostUsedMethods).sort((t, r) => r[1] - t[1]).slice(0, 10).map(([t, r]) => ({ method: t, count: r }));
  return {
    moduleId: _u,
    version: bu,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    initialized: B.initialized,
    setupAt: B.setupAt,
    totalFeatures: $b,
    featuresCached: B.featureCache.size,
    featuresPreloaded: B.featuresPreloaded,
    legacyBridgeApplied: B.legacyBridgeApplied,
    availableFeatures: Object.keys(rs).length,
    portsInitialized: va.isInitialized(),
    strictMode: It(),
    metrics: { ...X },
    proxyMetrics: Qi(),
    topMethods: e,
    timestamp: Date.now()
  };
}
function sC() {
  return { ...X, featuresCached: B.featureCache.size, featuresPreloaded: B.featuresPreloaded, proxyMetrics: Qi(), topMethods: Object.entries(X.mostUsedMethods).sort((e, t) => t[1] - e[1]).slice(0, 20) };
}
const wb = "6.1.0-P2-ENTERPRISE";
function iC(e) {
  var n;
  const t = Je().data || {};
  return {
    sidebar: ((n = e == null ? void 0 : e.getMetrics) == null ? void 0 : n.call(e)) || {},
    hub: t.hub || {},
    sources: t.sources || {},
    byCategory: t.byCategory || {},
    summary: t.summary || { totalSources: 0, activeSources: 0 },
    version: mr,
    aggregatorVersion: wb,
    timestamp: Date.now()
  };
}
function oC(e) {
  var r;
  const t = Zi().data || {};
  return {
    moduleId: le,
    version: mr,
    aggregatorVersion: wb,
    architecture: "MetricsHub-Delegated",
    initialized: !!e,
    status: (e == null ? void 0 : e.status) || "not-initialized",
    sidebar: ((r = e == null ? void 0 : e.info) == null ? void 0 : r.call(e)) || null,
    metricsHub: t,
    sourcesCount: t.sourcesCount || 0,
    timestamp: Date.now()
  };
}
function aC(e) {
  typeof window > "u" || (window.__dev = window.__dev || {}, window.__dev.sidebar = {
    getInstance: () => e(),
    getRenderer: () => {
      var t;
      return (t = e()) == null ? void 0 : t._renderer;
    },
    getVersion: () => mr,
    info: () => oC(e()),
    getMetrics: () => iC(e()),
    healthCheck: () => {
      var t, r;
      return (r = (t = e()) == null ? void 0 : t.healthCheck) == null ? void 0 : r.call(t);
    },
    getState: () => {
      var t, r;
      return (r = (t = e()) == null ? void 0 : t.getState) == null ? void 0 : r.call(t);
    },
    getToggleMetrics: () => gh(),
    resetDebounce: () => Fy(),
    registry: w,
    features: {
      favorites: $m,
      contextMenu: Jg,
      autoTheme: lg,
      submenu: nb,
      configManager: jg,
      parallax: lE,
      commandPalette: yg,
      fuzzySearch: rp,
      featureFlags: Ym,
      screenReader: GE,
      compactMode: kg,
      miniMode: Fp,
      dynamicBadges: _m,
      accessibilityLandmarks: bf,
      keyboardShortcutsExtended: $p,
      virtualList: Lb,
      animatedTransitions: Wf,
      notificationDots: Qp,
      highlightMatches: fp,
      debugPanel: om,
      intersectionObserver: Sp,
      preloadCriticalCSS: _E,
      themeHandler: pb,
      resizeHandler: DE,
      accordionNcs: Nf
    }
  });
}
const yu = "sidebar-kernel-circuit-breaker", vu = "1.1.0-ES6", fe = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
}), Nb = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  halfOpenMaxAttempts: 3
}, Cr = /* @__PURE__ */ new Map();
let ft = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};
function xn(e) {
  return Cr.has(e) || Cr.set(e, {
    state: fe.CLOSED,
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    openedAt: null,
    halfOpenAttempts: 0,
    config: Object.assign({}, Nb)
  }), Cr.get(e);
}
function Iu(e, t) {
  const r = xn(e);
  return r.config = Object.assign({}, Nb, t || {}), { ok: !0, featureId: e };
}
function Ys(e) {
  const t = xn(e);
  if (t.state === fe.CLOSED)
    return { allowed: !0, state: t.state };
  if (t.state === fe.OPEN) {
    const r = Date.now() - t.openedAt;
    return r >= t.config.timeout ? (t.state = fe.HALF_OPEN, t.halfOpenAttempts = 0, { allowed: !0, state: t.state, reason: "timeout-expired" }) : (ft.blockedCalls++, { allowed: !1, state: t.state, reason: "circuit-open", retryAfter: t.config.timeout - r });
  }
  return t.state === fe.HALF_OPEN ? t.halfOpenAttempts < t.config.halfOpenMaxAttempts ? (t.halfOpenAttempts++, { allowed: !0, state: t.state, attempt: t.halfOpenAttempts }) : (ft.blockedCalls++, { allowed: !1, state: t.state, reason: "half-open-limit" }) : { allowed: !0, state: t.state };
}
function Ks(e) {
  const t = xn(e);
  return t.successes++, t.lastSuccess = Date.now(), ft.totalSuccesses++, t.state === fe.HALF_OPEN ? t.successes >= t.config.successThreshold && (t.state = fe.CLOSED, t.failures = 0, t.successes = 0, ft.circuitsClosed++) : t.state === fe.CLOSED && (t.failures = 0), { ok: !0, state: t.state };
}
function xt(e, t) {
  const r = xn(e);
  return r.failures++, r.lastFailure = Date.now(), r.lastError = t, ft.totalFailures++, (r.state === fe.HALF_OPEN || r.state === fe.CLOSED && r.failures >= r.config.failureThreshold) && (r.state = fe.OPEN, r.openedAt = Date.now(), ft.circuitsOpened++), { ok: !0, state: r.state };
}
function Ia(e) {
  const t = xn(e);
  return t.state = fe.CLOSED, t.failures = 0, t.successes = 0, t.halfOpenAttempts = 0, { ok: !0 };
}
function Su(e) {
  const t = xn(e);
  return {
    featureId: e,
    state: t.state,
    failures: t.failures,
    successes: t.successes,
    lastFailure: t.lastFailure,
    lastSuccess: t.lastSuccess,
    config: t.config
  };
}
function Cu() {
  const e = {};
  return Cr.forEach((t, r) => {
    e[r] = {
      state: t.state,
      failures: t.failures,
      successes: t.successes
    };
  }), e;
}
function Au() {
  return Object.assign({}, ft, { circuitsCount: Cr.size });
}
function Sa() {
  let e = 0;
  return Cr.forEach((t) => {
    t.state === fe.OPEN && e++;
  }), {
    status: e === 0 ? "HEALTHY" : e < 3 ? "DEGRADED" : "UNHEALTHY",
    moduleId: yu,
    version: vu,
    openCircuits: e,
    totalCircuits: Cr.size,
    metrics: ft,
    timestamp: Date.now()
  };
}
async function Rb(e, t, r) {
  if (!Ys(e).allowed) {
    if (r) return r();
    throw new Error("Circuit breaker is open for: " + e);
  }
  try {
    const s = await t();
    return Ks(e), s;
  } catch (s) {
    if (xt(e, s), r) return r();
    throw s;
  }
}
var lC = {
  MODULE_ID: yu,
  VERSION: vu,
  STATES: fe,
  configure: Iu,
  canExecute: Ys,
  execute: Rb,
  recordSuccess: Ks,
  recordFailure: xt,
  reset: Ia,
  getStatus: Su,
  getAllStatus: Cu,
  getMetrics: Au,
  healthCheck: Sa
};
const cC = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: yu,
  VERSION: vu,
  canExecute: Ys,
  configure: Iu,
  default: lC,
  execute: Rb,
  getAllStatus: Cu,
  getMetrics: Au,
  getStatus: Su,
  healthCheck: Sa,
  recordFailure: xt,
  recordSuccess: Ks,
  reset: Ia
}, Symbol.toStringTag, { value: "Module" })), Ca = "sidebar-kernel-health-monitor", Aa = "1.1.0-ES6", xb = {
  intervalMs: 3e4,
  degradedThreshold: 80,
  unhealthyThreshold: 50,
  autoRecover: !0,
  maxRecoveryAttempts: 3,
  onDegraded: null,
  onUnhealthy: null,
  onRecovered: null
};
let wr = null, de = Object.assign({}, xb), gi = null, vt = !1, mi = /* @__PURE__ */ new Map(), it = {
  checksPerformed: 0,
  degradedEvents: 0,
  unhealthyEvents: 0,
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  lastCheckTime: null,
  lastStatus: null
}, Ar = [];
const uC = 100;
function dC(e) {
  Ar.unshift({
    timestamp: Date.now(),
    status: e.status,
    score: e.score,
    featuresHealthy: 0
  }), Ar.length > uC && Ar.pop();
}
function ml() {
  if (!wr) return;
  const e = wr.healthCheck();
  if (it.checksPerformed++, it.lastCheckTime = Date.now(), it.lastStatus = e.status, dC(e), e.score < de.unhealthyThreshold) {
    if (it.unhealthyEvents++, typeof de.onUnhealthy == "function")
      try {
        de.onUnhealthy(e);
      } catch {
      }
  } else if (e.score < de.degradedThreshold && (it.degradedEvents++, typeof de.onDegraded == "function"))
    try {
      de.onDegraded(e);
    } catch {
    }
  return de.autoRecover && hC(e), e;
}
function hC(e) {
  if (e.issues) {
    for (let t = 0; t < e.issues.length; t++)
      if (e.issues[t].code === "FEATURES_ERROR") {
        const n = wr.listFeatures();
        if (n.ok && n.data && n.data.features)
          for (let s = 0; s < n.data.features.length; s++) {
            const i = n.data.features[s];
            if (i.status === "error") {
              const o = mi.get(i.id) || 0;
              if (o < de.maxRecoveryAttempts) {
                it.recoveryAttempts++, mi.set(i.id, o + 1);
                try {
                  if (wr.enableFeature(i.id).ok && (it.recoverySuccesses++, mi.delete(i.id), typeof de.onRecovered == "function"))
                    try {
                      de.onRecovered(i.id);
                    } catch {
                    }
                } catch {
                }
              }
            }
          }
      }
  }
}
function Mu(e, t) {
  return vt ? { ok: !0, alreadyRunning: !0 } : (wr = e, de = Object.assign({}, xb, t || {}), { ok: !0, config: Object.assign({}, de) });
}
function Ma() {
  return vt ? { ok: !0, alreadyRunning: !0 } : wr ? (vt = !0, ml(), gi = setInterval(ml, de.intervalMs), { ok: !0, intervalMs: de.intervalMs }) : { ok: !1, error: "Not initialized" };
}
function Oa() {
  return vt ? (gi && (clearInterval(gi), gi = null), vt = !1, { ok: !0 }) : { ok: !0, alreadyStopped: !0 };
}
function Ou() {
  return ml();
}
function Tu(e) {
  return e ? Ar.slice(0, e) : Ar.slice();
}
function Ta() {
  return Object.assign({}, it, { running: vt, historySize: Ar.length });
}
function Pb() {
  return { moduleId: Ca, version: Aa, running: vt, intervalMs: de.intervalMs, metrics: Ta() };
}
function Da() {
  return {
    status: vt ? "HEALTHY" : "NOT_RUNNING",
    moduleId: Ca,
    version: Aa,
    running: vt,
    metrics: it,
    timestamp: Date.now()
  };
}
function Du() {
  return Oa(), wr = null, Ar = [], mi.clear(), { ok: !0 };
}
var fC = {
  MODULE_ID: Ca,
  VERSION: Aa,
  init: Mu,
  start: Ma,
  stop: Oa,
  checkNow: Ou,
  getHistory: Tu,
  getMetrics: Ta,
  info: Pb,
  healthCheck: Da,
  destroy: Du
};
const gC = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ca,
  VERSION: Aa,
  checkNow: Ou,
  default: fC,
  destroy: Du,
  getHistory: Tu,
  getMetrics: Ta,
  healthCheck: Da,
  info: Pb,
  init: Mu,
  start: Ma,
  stop: Oa
}, Symbol.toStringTag, { value: "Module" })), mC = "sidebar-factory";
v({ moduleId: mC });
let ge = null, pl = !1;
function pC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.info();
  console.log("%cSidebarKernel Status", "font-weight:bold;color:#8B5CF6"), console.log("Version:", e.data.version), console.log("Status:", e.data.status);
  const t = ge.healthCheck();
  return console.log("Health:", t.status, `(${t.score}%)`), console.log("Features:", e.data.featuresCount), console.log("Uptime:", `${Math.round(e.data.uptime / 1e3)}s`), t;
}
function EC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.listFeatures();
  return e.ok && (console.log("%cFeatures", "font-weight:bold;color:#8B5CF6"), console.table(e.data.features)), e.data.features;
}
function bC(e) {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const t = ge.enableFeature(e);
  return console.log(t.ok ? `✓ Enabled: ${e}` : `✗ Failed: ${e}`, t), t;
}
function _C(e) {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const t = ge.disableFeature(e, "manual");
  return console.log(t.ok ? `✓ Disabled: ${e}` : `✗ Failed: ${e}`, t), t;
}
function yC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.healthCheck();
  return console.log("%cHealth Check", "font-weight:bold;color:#8B5CF6"), console.log("Status:", e.status), console.log("Score:", `${e.score}%`), e.issues && e.issues.length > 0 && (console.log("Issues:"), e.issues.forEach((t) => {
    console.log("  -", `${t.code}:`, t.message);
  })), e;
}
function vC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.metrics();
  return console.log("%cMetrics", "font-weight:bold;color:#8B5CF6"), console.table(e.data), e.data;
}
function IC() {
  console.log("%cSidebarKernel Console Commands", "font-weight:bold;color:#8B5CF6"), console.log(""), console.log("  sk.status()        - Show kernel status"), console.log("  sk.list()          - List all features"), console.log("  sk.enable(id)      - Enable a feature"), console.log("  sk.disable(id)     - Disable a feature"), console.log("  sk.health()        - Run health check"), console.log("  sk.metrics()       - Show metrics"), console.log("  sk.help()          - Show this help"), console.log("");
}
function SC(e) {
  return pl ? { ok: !0, alreadyRegistered: !0 } : (ge = e, typeof window < "u" && (window.sk = {
    status: pC,
    list: EC,
    enable: bC,
    disable: _C,
    health: yC,
    metrics: vC,
    help: IC
  }, pl = !0), { ok: !0 });
}
function CC() {
  return typeof window < "u" && window.sk && delete window.sk, ge = null, pl = !1, { ok: !0 };
}
const j = Object.freeze({
  PERFORMANCE: "performance",
  CORE: "core",
  SEARCH: "search",
  NAVIGATION: "navigation",
  UI: "ui",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  DEBUG: "debug"
}), F = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
}), AC = [
  { id: "preload-critical-css", path: "./features/preload-critical-css.js", category: j.PERFORMANCE, priority: F.CRITICAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Pré-carregamento de CSS crítico" },
  { id: "favorites-handler", path: "./features/favorites-handler.js", category: j.CORE, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de favoritos" },
  { id: "command-palette", path: "./features/command-palette.js", category: j.SEARCH, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Paleta de comandos (Ctrl+K)" },
  { id: "feature-flags", path: "./features/feature-flags.js", category: j.CORE, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Sistema de feature flags" },
  { id: "submenu-handler", path: "./features/submenu-handler.js", category: j.NAVIGATION, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de submenus" },
  { id: "fuzzy-search", path: "./features/fuzzy-search.js", category: j.SEARCH, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Busca fuzzy" },
  { id: "theme-handler", path: "./features/theme-handler.js", category: j.UI, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Gerenciador de temas" },
  { id: "accessibility-landmarks", path: "./features/accessibility-landmarks.js", category: j.ACCESSIBILITY, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Landmarks de acessibilidade" },
  { id: "screen-reader", path: "./features/screen-reader.js", category: j.ACCESSIBILITY, priority: F.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Suporte a leitores de tela" },
  { id: "dynamic-badges", path: "./features/dynamic-badges.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Badges dinâmicos" },
  { id: "keyboard-shortcuts-extended", path: "./features/keyboard-shortcuts-extended.js", category: j.ACCESSIBILITY, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Atalhos de teclado estendidos" },
  { id: "notification-dots", path: "./features/notification-dots.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Indicadores de notificação" },
  { id: "highlight-matches", path: "./features/highlight-matches.js", category: j.SEARCH, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Destaque de matches na busca" },
  { id: "context-menu", path: "./features/context-menu.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Menu de contexto" },
  { id: "resize-handler", path: "./features/resize-handler.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Gerenciador de redimensionamento" },
  { id: "auto-theme", path: "./features/auto-theme.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: ["theme-handler"], requiresEl: !0, description: "Tema automático" },
  { id: "compact-mode", path: "./features/compact-mode.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Modo compacto" },
  { id: "mini-mode", path: "./features/mini-mode.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Modo mini" },
  { id: "config-manager", path: "./features/config-manager.js", category: j.CORE, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de configuração" },
  { id: "accordion-ncs", path: "./features/accordion-ncs.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Accordion NCS" },
  { id: "animated-transitions", path: "./features/animated-transitions.js", category: j.UI, priority: F.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Transições animadas" },
  { id: "parallax", path: "./features/parallax.js", category: j.VISUAL, priority: F.LOW, enabled: !0, dependencies: [], requiresEl: !1, description: "Efeito parallax" },
  { id: "debug-panel", path: "./features/debug-panel.js", category: j.DEBUG, priority: F.LOW, enabled: !0, dependencies: [], requiresEl: !0, description: "Painel de debug" },
  { id: "virtual-list", path: "./features/virtual-list.js", category: j.PERFORMANCE, priority: F.LOW, enabled: !1, dependencies: [], requiresEl: !0, description: "Lista virtualizada" },
  { id: "intersection-observer", path: "./features/intersection-observer.js", category: j.PERFORMANCE, priority: F.LOW, enabled: !1, dependencies: [], requiresEl: !0, description: "Intersection Observer para lazy load" }
];
function Hb() {
  return AC.slice().sort((e, t) => e.priority - t.priority);
}
async function MC(e, t) {
  if (t.featureModules.has(e.id)) return t.featureModules.get(e.id);
  try {
    const r = Eu[e.id];
    return r ? (t.featureModules.set(e.id, r), r) : (t.moduleMetrics.featureErrors++, t.log("warn", `Feature not found in barrel: ${e.id}`), null);
  } catch (r) {
    return t.moduleMetrics.featureErrors++, t.moduleMetrics.lastError = { featureId: e.id, message: r.message, timestamp: Date.now() }, t.log("warn", `Failed to load feature: ${e.id}`, r.message), null;
  }
}
function OC(e) {
  try {
    const t = mh(), r = t && t.featureTiers || {};
    return r.CORE && r.CORE.indexOf(e) > -1 ? "CORE" : r.POST_READY && r.POST_READY.indexOf(e) > -1 ? "POST_READY" : r.OPT_IN && r.OPT_IN.indexOf(e) > -1 ? "OPT_IN" : "CORE";
  } catch {
    return "CORE";
  }
}
function zb(e, t) {
  return e.enabled === !1 ? !1 : t.safeMode ? OC(e.id) === "CORE" : !0;
}
function TC(e, t) {
  return !(e.enabled === !1 || e.priority > t.config.autoEnableMaxPriority);
}
async function DC(e) {
  if (e.featuresLoaded) return;
  const t = Hb();
  if (e.config.enableCircuitBreaker)
    for (let r = 0; r < t.length; r++)
      Iu(t[r].id, {
        failureThreshold: e.config.circuitBreakerFailureThreshold,
        timeout: e.config.circuitBreakerTimeout
      });
  for (let r = 0; r < t.length; r++) {
    const n = t[r];
    if (!zb(n, e)) {
      e.log("debug", `Feature skipped (disabled): ${n.id}`), e.moduleMetrics.featuresSkipped++;
      continue;
    }
    if (e.config.enableCircuitBreaker) {
      const s = Ys(n.id);
      if (!s.allowed) {
        e.log("warn", `Feature blocked by circuit breaker: ${n.id}`, s.reason), e.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }
    try {
      const s = await MC(n, e);
      if (!s) {
        e.config.enableCircuitBreaker && xt(n.id, "Load failed");
        continue;
      }
      rc({
        id: n.id,
        version: s.VERSION || s.default && s.default.VERSION || "0.0.0",
        category: n.category,
        priority: n.priority,
        dependencies: n.dependencies || [],
        capabilities: { requiresEl: n.requiresEl },
        init: s.init || s.default && s.default.init,
        cleanup: s.cleanup || s.destroy || s.default && (s.default.cleanup || s.default.destroy),
        getMetrics: s.getMetrics || s.default && s.default.getMetrics,
        healthCheck: s.healthCheck || s.default && s.default.healthCheck,
        info: s.info || s.default && s.default.info
      }).ok ? (e.moduleMetrics.featuresRegistered++, e.config.enableCircuitBreaker && Ks(n.id), (s.getMetrics || s.default && s.default.getMetrics) && qi(n.id, {
        category: n.category,
        version: s.VERSION || s.default && s.default.VERSION || "0.0.0",
        getMetrics: s.getMetrics || s.default && s.default.getMetrics,
        healthCheck: s.healthCheck || s.default && s.default.healthCheck
      })) : e.config.enableCircuitBreaker && xt(n.id, "Registration failed");
    } catch (s) {
      e.moduleMetrics.featureErrors++, e.config.enableCircuitBreaker && xt(n.id, s.message), e.log("warn", `Failed to register feature: ${n.id}`, s.message);
    }
  }
  e.setFeaturesLoaded(!0);
}
async function LC(e, t, r) {
  const n = Hb();
  for (let s = 0; s < n.length; s++) {
    const i = n[s];
    if (zb(i, r) && TC(i, r)) {
      if (r.config.enableCircuitBreaker && !Ys(i.id).allowed) {
        r.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
      try {
        if (i.requiresEl && !t) continue;
        const o = {
          eventBus: e,
          sidebarEl: i.requiresEl ? t : void 0
        }, a = ms(i.id, o);
        a.ok && !(a.data && a.data.alreadyEnabled) ? (r.moduleMetrics.featuresEnabled++, r.config.enableCircuitBreaker && Ks(i.id), r.log("debug", `Feature enabled: ${i.id} (priority=${i.priority})`)) : a.ok || (r.moduleMetrics.featureErrors++, r.config.enableCircuitBreaker && xt(i.id, "Enable failed"));
      } catch (o) {
        r.moduleMetrics.featureErrors++, r.config.enableCircuitBreaker && xt(i.id, o.message), r.log("warn", `Failed to enable feature: ${i.id}`, o.message);
      }
    }
  }
}
function $C(e) {
  return (t = {}) => {
    if (e.getInstance()) return e.getInstance();
    const r = Date.now();
    e.initPorts();
    try {
      const o = mh();
      e.setSafeMode(o && o.safeMode === !0 || t.safeMode === !0), o && o.kernel && e.setConfig(Object.assign({}, e.DEFAULT_CONFIG, o.kernel, t)), e.getSafeMode() && (e.moduleMetrics.safeModeBoots++, e.log("info", "SafeMode ACTIVE - minimal boot"));
    } catch {
      e.setSafeMode(t.safeMode === !0);
    }
    if (tc({ ports: e.Ports.snapshot() }), cc({ ports: e.Ports.snapshot() }), qi("sidebar-orchestrator", {
      category: "core",
      version: e.VERSION,
      getMetrics() {
        return Object.assign({}, e.moduleMetrics, { kernel: Mn().data });
      }
    }), e.getConfig().enableConsoleCommands)
      try {
        SC(ll), e.log("debug", "Console commands registered (sk.*)");
      } catch (o) {
        e.log("warn", "Failed to register console commands:", o.message);
      }
    const n = new gI();
    e.setInstance(n), e.moduleMetrics.instancesCreated++;
    const s = e.getEventBus(), i = {
      log: e.log,
      config: e.getConfig(),
      moduleMetrics: e.moduleMetrics,
      safeMode: e.getSafeMode(),
      featuresLoaded: e.getFeaturesLoaded(),
      setFeaturesLoaded: e.setFeaturesLoaded,
      featureModules: e.featureModules
    };
    return (async () => {
      try {
        if (await DC(i), await LC(s, e.getSidebarEl(), i), e.getConfig().enableHealthMonitor)
          try {
            Mu(ll, {
              intervalMs: e.getConfig().healthMonitorIntervalMs,
              autoRecover: e.getConfig().healthMonitorAutoRecover,
              onDegraded(o) {
                e.log("warn", "Kernel health degraded:", `${o.status} ${o.score}%`);
              },
              onRecovered(o) {
                e.log("info", "Feature recovered:", o), e.getConfig().enableCircuitBreaker && Ia(o);
              }
            }), Ma(), e.log("debug", "HealthMonitor started");
          } catch (o) {
            e.log("warn", "Failed to start HealthMonitor:", o.message);
          }
        e.moduleMetrics.initTime = Date.now() - r, s && s.emit && s.emit(f.KERNEL_READY, {
          version: e.VERSION,
          safeMode: e.getSafeMode(),
          featuresRegistered: e.moduleMetrics.featuresRegistered,
          featuresEnabled: e.moduleMetrics.featuresEnabled,
          featuresSkipped: e.moduleMetrics.featuresSkipped,
          initTime: e.moduleMetrics.initTime
        }), e.log("info", `✅ Initialized in ${e.moduleMetrics.initTime}ms - Features: ${e.moduleMetrics.featuresEnabled}/${e.moduleMetrics.featuresRegistered} enabled`);
      } catch (o) {
        e.moduleMetrics.featureErrors++, e.moduleMetrics.lastError = { phase: "feature-init", message: o.message, timestamp: Date.now() }, e.log("error", "Feature initialization error:", o);
      }
    })(), n;
  };
}
function kC(e) {
  return () => {
    if (!e.getInstance()) throw new Error("Sidebar not initialized");
    return e.getInstance();
  };
}
function wC(e) {
  return () => {
    if (e.getConfig().enableHealthMonitor)
      try {
        Du();
      } catch {
      }
    if (e.getConfig().enableConsoleCommands)
      try {
        CC();
      } catch {
      }
    ji("destroySidebar"), hc();
    const t = e.getInstance();
    t && t.destroy && t.destroy(), e.setInstance(null), e.setFeaturesLoaded(!1), e.featureModules.clear(), e.setSafeMode(!1);
  };
}
function NC(e) {
  return () => {
    const t = !!e.getInstance(), r = !!e.getSidebarEl(), n = e.Ports.isInitialized(), s = ar(), i = fc(), o = e.getConfig().enableCircuitBreaker ? Sa() : null, a = e.getConfig().enableHealthMonitor ? Da() : null, l = {
      hasInstance: t,
      hasSidebarElement: r,
      portsInitialized: n,
      kernelReady: s.status === "HEALTHY",
      metricsHubReady: i.status === "HEALTHY"
    }, u = Object.values(l).filter(Boolean).length, d = Object.keys(l).length;
    let h = "HEALTHY";
    return u < d && u >= Math.floor(d * 0.6) && (h = "DEGRADED"), u < Math.floor(d * 0.6) && (h = "UNHEALTHY"), {
      status: h,
      score: { passed: u, total: d, percentage: Math.round(u / d * 100) },
      checks: l,
      issues: s.issues || [],
      moduleId: le,
      version: e.VERSION,
      safeMode: e.getSafeMode(),
      kernel: s,
      metricsHub: i,
      circuitBreaker: o,
      healthMonitor: a,
      moduleMetrics: Object.assign({}, e.moduleMetrics),
      ports: { initialized: e.Ports.isInitialized(), missing: [] },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  };
}
function RC(e) {
  return () => ({
    moduleId: le,
    version: e.VERSION,
    architecture: "Kernel-Orchestrated",
    safeMode: e.getSafeMode(),
    portsInitialized: e.Ports.isInitialized(),
    initialized: !!e.getInstance(),
    config: Object.assign({}, e.getConfig()),
    kernel: Gi().data,
    metricsHub: Zi().data,
    circuitBreakerEnabled: e.getConfig().enableCircuitBreaker,
    healthMonitorEnabled: e.getConfig().enableHealthMonitor,
    moduleMetrics: Object.assign({}, e.moduleMetrics),
    featuresLoaded: e.getFeaturesLoaded(),
    featureModulesCount: e.featureModules.size,
    timestamp: Date.now()
  });
}
function xC() {
  return () => Je().data;
}
const PC = {
  listFeatures: Fi,
  getFeatureStatus: ps,
  getFeature: oc,
  enableFeature: ms,
  disableFeature: An,
  canDisable: nc,
  getDependents: sc,
  getFeaturesByStatus: ic,
  getFeatureMetrics: ac,
  metrics: Mn,
  healthCheck: ar,
  exportDiagnostics: lc
}, HC = {
  aggregate: Je,
  getSourceMetrics: Yi,
  getMetricsByCategory: uc,
  takeSnapshot: Ki,
  getSnapshots: Wi,
  compareSnapshots: dc,
  listSources: Xi
}, zC = {
  getStatus: Su,
  getAllStatus: Cu,
  reset: Ia,
  getMetrics: Au,
  healthCheck: Sa
}, BC = {
  start: Ma,
  stop: Oa,
  checkNow: Ou,
  getHistory: Tu,
  getMetrics: Ta,
  healthCheck: Da
}, Bb = "7.4.0-P2-ENTERPRISE", Ws = v({ moduleId: le }), UC = () => {
  Ws.init();
}, El = (e) => Ws.get(e);
function jC(e) {
  return Ws.inject(e);
}
function FC() {
  return Ws.snapshot();
}
const GC = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), r = "[Sidebar]", n = El("logger");
  n && n[e] ? n[e](...[r].concat(t)) : (e === "error" || e === "warn" || e === "info") && console.debug.apply(console, [r].concat(t));
};
function VC() {
  return El("eventBus") || El("eventBusGlobal");
}
let ct = null, Sd = !1;
const qC = /* @__PURE__ */ new Map();
let Cd = !1;
const Ub = {
  enableConsoleCommands: !0,
  enableHealthMonitor: !0,
  enableCircuitBreaker: !0,
  healthMonitorIntervalMs: 3e4,
  healthMonitorAutoRecover: !0,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerTimeout: 3e4,
  autoEnableMaxPriority: 1,
  featureEnableTimeoutMs: 5e3,
  logLevel: "info"
};
let Ad = Object.assign({}, Ub), YC = {
  instancesCreated: 0,
  featuresRegistered: 0,
  featuresEnabled: 0,
  featuresSkipped: 0,
  featureErrors: 0,
  circuitBreakerBlocks: 0,
  initTime: null,
  lastError: null,
  safeModeBoots: 0
};
const jb = () => !ct || !ct._renderer || !ct._renderer.getSidebar ? null : ct._renderer.getSidebar(), Xs = {
  Ports: Ws,
  VERSION: Bb,
  DEFAULT_CONFIG: Ub,
  log: GC,
  initPorts: UC,
  getEventBus: VC,
  getSidebarEl: jb,
  moduleMetrics: YC,
  featureModules: qC,
  getInstance: () => ct,
  setInstance: (e) => {
    ct = e;
  },
  getConfig: () => Ad,
  setConfig: (e) => {
    Ad = e;
  },
  getSafeMode: () => Cd,
  setSafeMode: (e) => {
    Cd = e;
  },
  getFeaturesLoaded: () => Sd,
  setFeaturesLoaded: (e) => {
    Sd = e;
  }
}, Fb = $C(Xs), dA = kC(Xs), Gb = wC(Xs), KC = NC(Xs), WC = RC(Xs), XC = xC(), ZC = PC, JC = HC, QC = zC, eA = BC;
typeof window < "u" && (aC(() => ct), It() ? (jn("GLOBAL_EXPOSURE_BLOCKED", { module: le, target: "(window as any).SidebarKernel" }), jn("GLOBAL_EXPOSURE_BLOCKED", { module: le, target: "(window as any).SidebarMetricsHub" }), jn("GLOBAL_EXPOSURE_BLOCKED", { module: le, target: "(window as any).SidebarCircuitBreaker" }), jn("GLOBAL_EXPOSURE_BLOCKED", { module: le, target: "(window as any).SidebarHealthMonitor" })) : (tC(() => ct, jb, Fb, Gb), window.SidebarKernel = ll, window.SidebarMetricsHub = vI, window.SidebarCircuitBreaker = cC, window.SidebarHealthMonitor = gC));
const hA = {
  VERSION: Bb,
  MODULE_ID: le,
  CAPABILITIES: Od,
  createSidebar: Fb,
  getSidebar() {
    return ct;
  },
  destroySidebar: Gb,
  getMetrics: XC,
  info: WC,
  healthCheck: KC,
  injectPorts: jC,
  getPorts: FC,
  kernel: ZC,
  metricsHub: JC,
  circuitBreaker: QC,
  healthMonitor: eA
}, Zs = "5.6.0-UARPS-ONLY", La = "sidebar-items-manifest";
let Js = { lookups: 0, filters: 0 };
const gt = [
  { id: "main", title: null, icon: "dashboard", priority: 1, collapsible: !1 },
  { id: "operacional", title: null, icon: "settings", priority: 2, collapsible: !1 },
  { id: "admin", title: "Administração", icon: "shield", priority: 3, collapsible: !0 }
], Xe = [
  { id: "principal", sectionId: "main", title: "Principal", route: "#/", icon: "dashboard", priority: 1 },
  { id: "geral", sectionId: "main", title: "Geral", route: "#/geral", icon: "grid", priority: 2 },
  { id: "automacoes", sectionId: "operacional", title: "Automações", route: "#/automacoes", icon: "automation", priority: 1 },
  { id: "bling", sectionId: "operacional", title: "Bling", route: "#/bling", icon: "box", priority: 2 },
  { id: "clientes", sectionId: "operacional", title: "Clientes", route: "#/clientes", icon: "users", priority: 3 },
  { id: "colaboradores", sectionId: "operacional", title: "Colaboradores", route: "#/colaboradores", icon: "team", priority: 4 },
  { id: "comercial", sectionId: "operacional", title: "Comercial", route: "#/comercial", icon: "chart", priority: 5 },
  { id: "compras", sectionId: "operacional", title: "Compras", route: "#/compras", icon: "cart", priority: 6 },
  { id: "contratos", sectionId: "operacional", title: "Contratos", route: "#/contratos", icon: "document", priority: 7 },
  { id: "financeiro", sectionId: "operacional", title: "Financeiro", route: "#/financeiro", icon: "money", priority: 8 },
  { id: "fornecedores", sectionId: "operacional", title: "Fornecedores", route: "#/fornecedores", icon: "supplier", priority: 9 },
  { id: "google-ads", sectionId: "operacional", title: "Google Ads", route: "#/google-ads", icon: "ads", priority: 10 },
  { id: "google-drive", sectionId: "operacional", title: "Google Drive", route: "#/google-drive", icon: "drive", priority: 11 },
  { id: "importacao", sectionId: "operacional", title: "Importação", route: "#/importacao", icon: "globe", priority: 12 },
  { id: "instagram", sectionId: "operacional", title: "Instagram", route: "#/instagram", icon: "instagram", priority: 13 },
  { id: "operacional", sectionId: "operacional", title: "Operacional", route: "#/operacional", icon: "cog", priority: 14 },
  { id: "orcamento-clientes", sectionId: "operacional", title: "Orçamento Clientes", route: "#/orcamento-clientes", icon: "calculator", priority: 15 },
  { id: "pipedrive", sectionId: "operacional", title: "Pipedrive", route: "#/pipedrive", icon: "pipeline", priority: 16 },
  { id: "produtos", sectionId: "operacional", title: "Produtos", route: "#/produtos", icon: "package", priority: 17 },
  { id: "rh-pessoas", sectionId: "operacional", title: "RH Pessoas", route: "#/rh-pessoas", icon: "people", priority: 18 },
  { id: "servidores", sectionId: "operacional", title: "Servidores", route: "#/servidores", icon: "server", priority: 19 },
  { id: "user-management", sectionId: "admin", title: "Gestão de Usuários", route: "#/admin/usuarios", icon: "users-cog", priority: 1 },
  { id: "permissions-admin", sectionId: "admin", title: "Permissões", route: "#/admin/permissoes", icon: "shield", priority: 2 },
  { id: "session-admin", sectionId: "admin", title: "Sessões", route: "#/admin/sessoes", icon: "key", priority: 3 },
  { id: "audit-trail", sectionId: "admin", title: "Auditoria", route: "#/admin/auditoria", icon: "clipboard", priority: 4 },
  { id: "nav-admin", sectionId: "admin", title: "Navegação", route: "#/admin/navegacao", icon: "nav", priority: 5 },
  { id: "user-preferences", sectionId: "admin", title: "Minhas Preferências", route: "#/preferencias", icon: "settings", priority: 6 }
];
function Vb(e) {
  return Js.lookups++, Xe.find((t) => t.id === e) || null;
}
function qb(e) {
  return Js.lookups++, Xe.filter((t) => t.sectionId === e).sort((t, r) => (t.priority || 100) - (r.priority || 100));
}
function Lu(e) {
  return Js.lookups++, gt.find((t) => t.id === e) || null;
}
function Yb(e) {
  const t = Lu(e);
  return (t == null ? void 0 : t.icon) || "grid";
}
function Kb(e, t = 0) {
  return Js.filters++, [...e];
}
function Wb() {
  return { version: Zs, sections: [...gt], items: [...Xe], timestamp: Date.now() };
}
function $a() {
  return { ...Js, sectionsCount: gt.length, itemsCount: Xe.length };
}
function Xb() {
  return { moduleId: La, version: Zs, sectionsCount: gt.length, itemsCount: Xe.length, metrics: $a() };
}
function Zb() {
  const e = gt.length > 0, t = Xe.length > 0, r = gt.every((a) => !!a.icon), n = Xe.every((a) => !!a.route), s = { hasSections: e, hasItems: t, allSectionsHaveIcons: r, allItemsHaveRoutes: n, validStructure: !0 }, i = Object.values(s).filter(Boolean).length, o = Object.keys(s).length;
  return {
    status: i === o ? "HEALTHY" : "DEGRADED",
    score: i,
    maxScore: o,
    scoreDisplay: `${i}/${o}`,
    checks: s,
    sectionsCount: gt.length,
    itemsCount: Xe.length,
    version: Zs,
    moduleId: La,
    timestamp: Date.now(),
    metrics: $a()
  };
}
var tA = { VERSION: Zs, MODULE_ID: La, SECTIONS: gt, ITEMS: Xe, getManifest: Wb, getItemById: Vb, getItemsBySection: qb, getSectionById: Lu, getSectionIcon: Yb, filterByLevel: Kb, info: Xb, getMetrics: $a, healthCheck: Zb };
const rA = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ITEMS: Xe,
  MODULE_ID: La,
  SECTIONS: gt,
  VERSION: Zs,
  default: tA,
  filterByLevel: Kb,
  getItemById: Vb,
  getItemsBySection: qb,
  getManifest: Wb,
  getMetrics: $a,
  getSectionById: Lu,
  getSectionIcon: Yb,
  healthCheck: Zb,
  info: Xb
}, Symbol.toStringTag, { value: "Module" }));
export {
  Od as CAPABILITIES,
  mr as CORE_VERSION,
  L as LIFECYCLE_STATES,
  le as MODULE_ID,
  mA as SIDEBAR_EVENTS,
  gI as Sidebar,
  w as SidebarRegistry,
  Bb as VERSION,
  QC as circuitBreaker,
  Fb as createSidebar,
  hA as default,
  Gb as destroySidebar,
  XC as getMetrics,
  FC as getPorts,
  dA as getSidebar,
  KC as healthCheck,
  eA as healthMonitor,
  WC as info,
  jC as injectPorts,
  ZC as kernel,
  JC as metricsHub
};
