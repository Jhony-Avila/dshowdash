import { createUiPorts as v, createCorePorts as xb } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS as f, ACCORDION_INTENTS as Ba } from "/core/runtime/events/catalog/sidebar.events.js";
import { SIDEBAR_EVENTS as JC } from "/core/runtime/events/catalog/sidebar.events.js";
import { isStrict as vt, recordViolation as zn } from "/core/runtime/enterprise/strict-mode.js";
import { ROUTER_EVENTS as pe } from "/core/runtime/events/catalog/router.events.js";
import { UI_INTENTS as ni, UI_EVENTS as cl } from "/core/runtime/events/catalog/ui.events.js";
import { NAV_INTENTS as Pb } from "/core/runtime/events/catalog/nav.events.js";
import { get as Eu, listNamespaces as Hb } from "/components/icon-registry/index.js";
import { LAYOUT_EVENTS as Xs } from "/core/runtime/events/catalog/layout.events.js";
const fr = "5.5.0-ENTERPRISE-FULL", oe = "sidebar-constants", bu = Object.freeze({
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
}), Ua = Object.freeze({ cssTimeout: 5e3, configTimeout: 3e3, adapterTimeout: 2e3, maxRetries: 3, retryDelay: 1e3 }), zb = Object.freeze({ enabled: !0, wrapAround: !0, focusDelay: 50 }), Id = "/components/sidebar/styles/sidebar.bundle.css?v=20260720", Sd = "5.6.0-P18EC", Cd = "sidebar-state-machine", L = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  MOUNTING: "mounting",
  MOUNTED: "mounted",
  READY: "ready",
  DEGRADED: "degraded",
  ERROR: "error",
  DESTROYING: "destroying",
  DESTROYED: "destroyed"
}), Bb = {
  [L.IDLE]: [L.INITIALIZING],
  [L.INITIALIZING]: [L.MOUNTING, L.ERROR],
  [L.MOUNTING]: [L.MOUNTED, L.ERROR],
  [L.MOUNTED]: [L.READY, L.DEGRADED, L.ERROR],
  [L.READY]: [L.DEGRADED, L.DESTROYING],
  [L.DEGRADED]: [L.READY, L.ERROR, L.DESTROYING],
  [L.ERROR]: [L.DESTROYING, L.INITIALIZING],
  [L.DESTROYING]: [L.DESTROYED],
  [L.DESTROYED]: [L.IDLE]
}, Ub = { persistState: !0, storageKey: "dsd:sidebar:sections", allowMultipleOpen: !0, animationDuration: 250 };
class jb {
  constructor(t = {}) {
    this._lifecycle = L.IDLE, this._collapsed = t.collapsed ?? !1, this._mobileOpen = !1, this._isMobile = !1, this._activeItemId = null, this._hoveredItemId = null, this._subscribers = /* @__PURE__ */ new Set(), this._history = [], this._maxHistory = 50, this._expandedSections = /* @__PURE__ */ new Set(), this._accordionConfig = { ...Ub, ...t.accordion }, this._metrics = { transitions: 0, toggles: 0, sectionExpands: 0, sectionCollapses: 0, notifications: 0, resets: 0 }, this._restoreExpandedSections();
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
    return (Bb[this._lifecycle] || []).includes(t);
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
      version: Sd,
      moduleId: Cd,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    };
  }
  info() {
    return { version: Sd, moduleId: Cd, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
}
const dl = "5.10.0-UARPS-ONLY", ss = "sidebar-registry", En = v({ moduleId: ss });
function Fb() {
  En.init();
}
function Gb(e) {
  return En.get(e);
}
function Vb(e) {
  return En.inject(e);
}
function qb() {
  return En.snapshot();
}
const $t = {
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
}, Z = /* @__PURE__ */ new Map(), be = /* @__PURE__ */ new Map(), ln = /* @__PURE__ */ new Map(), bn = /* @__PURE__ */ new Map(), Wn = /* @__PURE__ */ new Set();
let Mt = { data: null, timestamp: 0 }, ul = 0;
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
function xt(e, t) {
  const r = {
    sections: Ai(),
    items: is(),
    badges: gl(),
    event: e,
    data: t,
    timestamp: Date.now()
  };
  Wn.forEach((s) => {
    try {
      s(r);
    } catch {
      H.errors++;
    }
  });
  const n = Gb("eventBus");
  n != null && n.emit && n.emit(e, { source: ss, ...r });
}
function Yb(e) {
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
async function _u(e = $t.apiEndpoint) {
  if (Mt.data && Date.now() - Mt.timestamp < $t.cacheTTL)
    return H.cacheHits++, ja(Mt.data), { success: !0, source: "cache", sectionsCount: Z.size, itemsCount: be.size };
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
    return ul = n.userLevel ?? 0, $t.cacheEnabled && (Mt = { data: n, timestamp: Date.now() }), ja(n), H.source = "api", xt(f.REGISTRY_LOADED, {
      source: "api",
      sectionsCount: Z.size,
      itemsCount: be.size
    }), { success: !0, source: "api", sectionsCount: Z.size, itemsCount: be.size };
  } catch {
    return H.apiFails++, H.errors++, hl();
  }
}
function ja(e) {
  Z.clear(), be.clear(), ln.clear();
  let t = e.items || [];
  if (Array.isArray(t) || (t = Object.values(t)), e.sections && Array.isArray(e.sections) && e.sections.length > 0)
    e.sections.forEach((r) => {
      const n = r.icon || tt[r.id] || tt[r.key] || tt.default;
      Z.set(r.id, {
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
        Z.set(s, {
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
      if (n.parent_key && !r.has(n.parent_key) && !Z.has(n.parent_key)) {
        const s = tt[n.parent_key] || tt.default;
        Z.set(n.parent_key, {
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
  H.sectionsLoaded = Z.size, t.forEach((r) => {
    if (r.item_type === "group" || r.item_type === "header" || r.item_type === "section") return;
    const n = Yb(r);
    be.set(n.id, n), n.item_key && ln.set(n.item_key, n);
  }), H.itemsLoaded = be.size, H.lastLoad = Date.now();
}
async function hl() {
  try {
    const { getManifest: e } = await Promise.resolve().then(() => zC), t = e();
    return ja(t), H.source = "manifest", xt(f.REGISTRY_LOADED, {
      source: "manifest",
      sectionsCount: Z.size,
      itemsCount: be.size
    }), { success: !0, source: "manifest", sectionsCount: Z.size, itemsCount: be.size };
  } catch (e) {
    return H.errors++, xt(f.REGISTRY_ERROR, { error: e.message }), { success: !1, error: e.message };
  }
}
async function Kb() {
  return Fb(), $t.source === "api" ? _u() : hl();
}
function Ai() {
  return Array.from(Z.values()).filter((e) => e.visible !== !1).sort((e, t) => (e.order || e.priority || 100) - (t.order || t.priority || 100));
}
function Wb(e) {
  return Z.get(e) || null;
}
function Xb(e) {
  const t = Z.get(e);
  return (t == null ? void 0 : t.icon) || tt[e] || tt.default;
}
function Zb(e, t) {
  const r = Z.get(e);
  return r ? (Object.assign(r, t), H.lastUpdate = Date.now(), xt(f.REGISTRY_UPDATED, { type: "section", id: e, updates: t }), { success: !0 }) : { success: !1, error: "Section not found" };
}
function is(e = null) {
  let t = Array.from(be.values()).filter((r) => r.visible !== !1);
  return e && (t = t.filter((r) => r.sectionId === e || r.parent_key === e)), t.sort((r, n) => (r.order || r.priority || 100) - (n.order || n.priority || 100));
}
function yu(e) {
  const t = be.get(e);
  return t || (typeof e == "string" ? (H.keyLookups++, ln.get(e) || null) : null);
}
function vu(e) {
  return is(e);
}
function fl(e, t) {
  const r = yu(e);
  return r ? (Object.assign(r, t), H.lastUpdate = Date.now(), xt(f.REGISTRY_UPDATED, { type: "item", id: e, updates: t }), { success: !0 }) : { success: !1, error: "Item not found" };
}
function Jb(e, t) {
  return fl(e, { visible: t });
}
function Qb(e, t) {
  return fl(e, { disabled: t });
}
function e_(e, t) {
  return bn.set(e, {
    itemId: e,
    value: t.value ?? null,
    type: t.type || "info",
    visible: t.visible ?? !0,
    pulse: t.pulse ?? !1
  }), H.badgesSet++, xt(f.REGISTRY_UPDATED, { type: "badge", itemId: e, badge: t }), { success: !0 };
}
function t_(e) {
  return bn.get(e) || null;
}
function gl() {
  return Array.from(bn.values()).filter((e) => e.visible !== !1);
}
function r_(e) {
  return bn.delete(e), xt(f.REGISTRY_UPDATED, { type: "badge-removed", itemId: e }), { success: !0 };
}
function n_(e = null, t = []) {
  return H.filtersApplied++, be.forEach((r, n) => {
    let s = !0;
    const i = r.permissions || [];
    i.length > 0 && (s = i.some((o) => t.includes(o))), r.visible = s;
  }), Z.forEach((r, n) => {
    const s = vu(n).filter((i) => i.visible);
    r.visible = s.length > 0;
  }), xt(f.REGISTRY_UPDATED, { type: "permission-filter", strategy: "uarps-only" }), {
    success: !0,
    visibleSections: Ai().length,
    visibleItems: is().length
  };
}
function s_() {
  return ul;
}
function i_() {
  return Mt = { data: null, timestamp: 0 }, { success: !0 };
}
function o_(e) {
  return e === "api" || e === "manifest" ? ($t.source = e, { success: !0, source: e }) : { success: !1, error: "Invalid source" };
}
function a_(e) {
  return typeof e != "function" ? () => {
  } : (Wn.add(e), () => Wn.delete(e));
}
function l_(e) {
  Wn.delete(e);
}
function Iu() {
  Z.clear(), be.clear(), ln.clear(), bn.clear(), Mt = { data: null, timestamp: 0 }, ul = 0;
}
function c_() {
  Iu(), Object.keys(H).forEach((e) => {
    typeof H[e] == "number" ? H[e] = 0 : H[e] !== null && (H[e] = null);
  });
}
function Su() {
  const e = be.size > 0, t = Z.size > 0, r = Mt.data && Date.now() - Mt.timestamp < $t.cacheTTL, n = H.errors === 0, s = H.apiFails === 0 || H.apiCalls > H.apiFails, i = En.isInitialized(), o = ln.size > 0, a = { hasItems: e, hasSections: t, hasDualIndex: o, cacheValid: r, noErrors: n, apiWorking: s, portsInitialized: i }, l = Object.values(a).filter(Boolean).length, d = Object.keys(a).length;
  let u = "HEALTHY";
  return !e || !t ? u = "UNHEALTHY" : (H.errors > 0 || !s) && (u = "DEGRADED"), {
    status: u,
    score: l,
    maxScore: d,
    scoreDisplay: `${l}/${d}`,
    checks: a,
    source: H.source,
    sectionsCount: Z.size,
    itemsCount: be.size,
    itemsByKeyCount: ln.size,
    badgesCount: bn.size,
    subscribersCount: Wn.size,
    metrics: { ...H },
    config: { ...$t },
    version: dl,
    moduleId: ss,
    timestamp: Date.now()
  };
}
function d_() {
  return {
    version: dl,
    moduleId: ss,
    source: H.source,
    sections: Ai(),
    items: is(),
    badges: gl(),
    metrics: { ...H },
    config: { ...$t },
    portsInitialized: En.isInitialized(),
    healthCheck: Su()
  };
}
function u_() {
  return { ...H };
}
const Cu = {
  VERSION: dl,
  MODULE_ID: ss,
  load: Kb,
  loadFromManifest: hl,
  loadFromAPI: _u,
  getSections: Ai,
  getSectionById: Wb,
  getSectionIcon: Xb,
  updateSection: Zb,
  getItems: is,
  getItemById: yu,
  getItemsBySection: vu,
  updateItem: fl,
  setItemVisible: Jb,
  setItemDisabled: Qb,
  setBadge: e_,
  getBadge: t_,
  getBadges: gl,
  removeBadge: r_,
  applyPermissionFilter: n_,
  getUserLevel: s_,
  invalidateCache: i_,
  setSource: o_,
  subscribe: a_,
  unsubscribe: l_,
  clear: Iu,
  reset: c_,
  healthCheck: Su,
  info: d_,
  getMetrics: u_,
  injectPorts: Vb,
  getPorts: qb
};
typeof window < "u" && (window.SidebarRegistry = Cu);
var w = Cu;
const Fa = "dshowdash-layout-sidebarCollapsed", Ga = "dsd-sidebar-collapsed";
let Va = { saves: 0, loads: 0, errors: 0, migrations: 0 };
function h_() {
  try {
    const e = localStorage.getItem(Fa), t = localStorage.getItem(Ga), r = e !== null ? JSON.parse(e) : null, n = t !== null ? JSON.parse(t) : null;
    return { synced: r === n, unified: r, legacy: n };
  } catch (e) {
    return Va.errors++, { synced: !1, error: e.message };
  }
}
function f_() {
  try {
    const e = localStorage.getItem(Fa);
    if (e !== null) localStorage.setItem(Ga, e);
    else {
      const t = localStorage.getItem(Ga);
      t !== null && (localStorage.setItem(Fa, t), Va.migrations++);
    }
    return { success: !0 };
  } catch (e) {
    return Va.errors++, { success: !1, error: e.message };
  }
}
const g_ = "sidebar-error-emitter", m_ = v({ moduleId: g_ });
function Ma(e) {
  return m_.get(e);
}
let jn = [], ml = null, os = "idle", ze = null, Be = null;
function p_(e, t) {
  ze = e, Be = t;
}
function Au() {
  const e = Ma("eventBus") || Ma("eventBusGlobal");
  return e && Ma("eventBus"), e;
}
function _e(e, t) {
  var r, n;
  try {
    jn.includes(e) || jn.push(e), os = "degraded", ml = t;
    const s = Au();
    s != null && s.emit && s.emit(f.DEGRADED, {
      source: oe,
      component: e,
      error: t,
      degradedComponents: jn,
      timestamp: Date.now()
    }), (r = ze == null ? void 0 : ze.warn) == null || r.call(ze, `Component degraded: ${e}`, { error: t }), (n = Be == null ? void 0 : Be.trackError) == null || n.call(Be, t, { component: e, phase: "degraded" });
  } catch {
  }
}
function Zs(e, t = {}) {
  var r, n;
  try {
    os = "error", ml = e;
    const s = Au();
    s != null && s.emit && s.emit(f.ERROR, {
      source: oe,
      error: (e == null ? void 0 : e.message) || e,
      context: t,
      timestamp: Date.now()
    }), (r = ze == null ? void 0 : ze.error) == null || r.call(ze, "Sidebar error:", { error: e, context: t }), (n = Be == null ? void 0 : Be.trackError) == null || n.call(Be, e, t);
  } catch {
  }
}
function qa() {
  return os;
}
function pl(e) {
  os = e;
}
function Mu() {
  return [...jn];
}
function E_() {
  jn = [], ml = null, os = "idle";
}
const Ou = "6.0.0-NCS", El = "sidebar-ui-constants", Tu = Object.freeze({ accordion: !0, badges: !0, search: !0, keyboard: !0, mobile: !0, persistence: !0, tooltips: !0, skeleton: !0, ripple: !0 }), ui = Object.freeze({ main: "dashboard", operacional: "cog", analytics: "chart", management: "settings", admin: "shield", financeiro: "money", comercial: "chart", default: "nav" }), p = "dsd-sidebar", c = Object.freeze({
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
}), Ya = `<div class="${c.EMPTY}"><span class="${c.EMPTY_ICON}">📋</span><span class="${c.EMPTY_TEXT}">Nenhum item disponível</span></div>`, b_ = `<aside class="${c.ROOT} ${c.MOD_FALLBACK}" id="sidebar" role="navigation"><div class="${c.HEADER}"><span class="${c.BRAND_TEXT}">Menu</span></div><nav class="${c.NAV}"><div class="${c.NAV_CONTENT}">${Ya}</div></nav></aside>`, Mi = "7.1.0-ES6", $r = "sidebar-event-setup", kr = v({ moduleId: $r });
function __() {
  kr.init();
}
function Du(e) {
  return kr.get(e);
}
function Lu(e) {
  return kr.inject(e);
}
function $u() {
  return kr.snapshot();
}
let Ze = [], Fn = null, Pe = null, re = {
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
function xe(e, t, r) {
  Fn && Fn[e] && Fn[e](`[${$r}] ${t}`, r || {});
}
function Ad(e, t) {
  try {
    const r = Du("eventBus");
    if (r && r.emit)
      return r.emit(e, Object.assign({ source: $r, timestamp: Date.now() }, t || {})), re.navigationEmits++, !0;
  } catch {
    re.errors++;
  }
  return !1;
}
function ku(e) {
  e && kr.inject({ eventBus: e }), __();
  const t = Du("eventBus");
  t && t.emit && t.emit(f.EVENT_SETUP_INITIALIZED);
}
function bl(e, t) {
  Fn = e, Pe = t;
}
function _l(e, t) {
  if (!e) return () => {
  };
  const r = e.querySelector(`.${c.TOGGLE}`);
  if (!r) return () => {
  };
  const n = () => {
    re.toggleClicks++, t && t();
  };
  r.addEventListener("click", n);
  const s = () => {
    r.removeEventListener("click", n);
  };
  return Ze.push(s), s;
}
function yl(e, t) {
  if (!e) return () => {
  };
  const r = t.registry, n = t.routerAdapter, s = t.onSetActiveItem, i = (a) => {
    try {
      const l = a.target.closest(`.${c.LINK}`);
      if (!l) return;
      const d = l.closest(`.${c.ITEM}`), u = d ? d.dataset.itemId : null;
      if (!u) {
        xe("debug", "Click on link without itemId", { link: l.href });
        return;
      }
      const h = d ? d.dataset.panelId : null;
      let g = null, m = null, y = null;
      if (r && typeof r.getItemById == "function" && (g = r.getItemById(u), g && (re.registryHits++, m = g.route, y = g.panelId || null, g.disabled))) {
        xe("debug", "Item disabled, ignoring click", { itemId: u }), a.preventDefault();
        return;
      }
      if (!y && h && (y = h, re.panelIdFromDom++, xe("debug", "Using DOM data-panel-id", { itemId: u, panelId: y })), !m) {
        const S = l.getAttribute("href");
        S && (m = S, re.domFallbacks++, xe("debug", "Using DOM fallback for route", { itemId: u, route: m }));
      }
      if (!m) {
        const S = l.getAttribute("data-panel");
        S && (m = `#/${S}`, re.domFallbacks++, xe("debug", "Using data-panel fallback for route", { itemId: u, panel: S, route: m }));
      }
      if (m) {
        a.preventDefault(), re.itemClicks++;
        const S = g ? Object.assign({}, g, { panelId: y || g.panelId }) : {
          id: u,
          route: m,
          panelId: y,
          label: l.textContent ? l.textContent.trim() : u
        };
        Ad(f.ITEM_CLICK, {
          itemId: u,
          item: S,
          panelId: y
        }), Ad(f.NAVIGATE, {
          itemId: u,
          item: S,
          route: m,
          panelId: y
        }), n && typeof n.navigate == "function" ? (n.navigate(m), xe("debug", "Navigated via routerAdapter", { itemId: u, route: m, panelId: y })) : (xe("warn", "No routerAdapter available, using hash fallback", { itemId: u, route: m }), typeof window < "u" && window.location && (window.location.hash = m.charAt(0) === "#" ? m : `#${m}`)), s && s(u), Pe && Pe.trackNavigation && Pe.trackNavigation(u, m);
      } else
        xe("warn", "No route found for item", { itemId: u });
    } catch (l) {
      re.errors++, xe("error", "Click handler error", { error: l.message, stack: l.stack });
    }
  };
  e.addEventListener("click", i);
  const o = () => {
    e.removeEventListener("click", i);
  };
  return Ze.push(o), o;
}
function vl(e, t) {
  if (!e) return () => {
  };
  const r = t.renderer, n = e.querySelector(`.${c.SEARCH_INPUT}`), s = e.querySelector(`.${c.SEARCH_CLEAR}`);
  if (!n) return () => {
  };
  let i = null;
  const o = (u) => {
    clearTimeout(i), i = setTimeout(() => {
      try {
        const h = u.target.value, g = r && r.filterItems ? r.filterItems(h) : { visible: 0, hidden: 0 };
        re.searches++, Pe && Pe.trackSearch && Pe.trackSearch(h, g.visible), s && (s.style.opacity = h ? "1" : "0", s.style.pointerEvents = h ? "auto" : "none");
      } catch (h) {
        re.errors++, xe("error", "Search error", { error: h.message });
      }
    }, 200);
  }, a = (u) => {
    u.preventDefault();
    try {
      n.value = "", r && r.clearSearch && r.clearSearch(), s && (s.style.opacity = "0", s.style.pointerEvents = "none"), n.focus(), Pe && Pe.trackSearch && Pe.trackSearch("", 0);
    } catch (h) {
      re.errors++, xe("error", "Clear search error", { error: h.message });
    }
  }, l = (u) => {
    u.key === "Escape" && n.value && a(u);
  };
  n.addEventListener("input", o), n.addEventListener("keydown", l), s && (s.addEventListener("click", a), s.style.opacity = "0", s.style.pointerEvents = "none");
  const d = () => {
    clearTimeout(i), n.removeEventListener("input", o), n.removeEventListener("keydown", l), s && s.removeEventListener("click", a);
  };
  return Ze.push(d), d;
}
function Il(e, t) {
  if (!e) return () => {
  };
  const r = (s) => {
    const i = s.target.closest(`.${c.GROUP_BUTTON}, .${c.SECTION_HEADER}`);
    if (!i) return;
    const o = i.closest(`.${c.SECTION}`), a = o ? o.dataset.sectionId : null;
    a && o.dataset.collapsible !== "false" && (s.preventDefault(), re.sectionToggles++, t && t(a));
  };
  e.addEventListener("click", r);
  const n = () => {
    e.removeEventListener("click", r);
  };
  return Ze.push(n), n;
}
function Sl(e, t) {
  Ze.length > 0 && Xn();
  const r = t.registry, n = t.routerAdapter, s = t.renderer, i = t.onToggle, o = t.onSetActiveItem, a = t.onToggleSection;
  return _l(e, i), yl(e, { registry: r, routerAdapter: n, onSetActiveItem: o }), vl(e, { renderer: s }), Il(e, a), () => {
    Xn();
  };
}
function Xn() {
  Ze.forEach((e) => {
    try {
      e();
    } catch {
      re.errors++;
    }
  }), Ze = [];
}
function wu() {
  return Ze.slice();
}
function Oi() {
  return Object.assign({}, re);
}
function Nu() {
  return {
    moduleId: $r,
    version: Mi,
    portsInitialized: kr.isInitialized(),
    listenersActive: Ze.length,
    hasLogger: !!Fn,
    hasTracker: !!Pe,
    metrics: Oi()
  };
}
function Ru() {
  return {
    status: re.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: Mi,
    moduleId: $r,
    portsInitialized: kr.isInitialized(),
    checks: {
      noErrors: re.errors === 0,
      listenersActive: Ze.length > 0
    },
    metrics: Oi()
  };
}
var y_ = {
  VERSION: Mi,
  MODULE_ID: $r,
  init: ku,
  setDependencies: bl,
  setupToggleClick: _l,
  setupItemClicks: yl,
  setupSearch: vl,
  setupSectionToggle: Il,
  setupAllEvents: Sl,
  destroy: Xn,
  injectPorts: Lu,
  getPorts: $u,
  getCleanups: wu,
  getMetrics: Oi,
  info: Nu,
  healthCheck: Ru
};
const v_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: $r,
  VERSION: Mi,
  default: y_,
  destroy: Xn,
  getCleanups: wu,
  getMetrics: Oi,
  getPorts: $u,
  healthCheck: Ru,
  info: Nu,
  init: ku,
  injectPorts: Lu,
  setDependencies: bl,
  setupAllEvents: Sl,
  setupItemClicks: yl,
  setupSearch: vl,
  setupSectionToggle: Il,
  setupToggleClick: _l
}, Symbol.toStringTag, { value: "Module" }));
let Oa = !1, lr = { timeoutCalls: 0, retryCalls: 0, cssLoadAttempts: 0, cssLoadSuccess: 0, cssLoadFailed: 0 };
function I_(e, t, r = "Timeout") {
  return lr.timeoutCalls++, Promise.race([e, new Promise((n, s) => setTimeout(() => s(new Error(r)), t))]);
}
async function S_(e, t = 3, r = 1e3) {
  lr.retryCalls++;
  let n;
  for (let s = 0; s < t; s++)
    try {
      return await e();
    } catch (i) {
      n = i, s < t - 1 && await new Promise((o) => setTimeout(o, r * Math.pow(2, s)));
    }
  throw n;
}
async function C_() {
  if (lr.cssLoadAttempts++, Oa) return !0;
  if (document.querySelector(`link[href="${Id}"]`))
    return Oa = !0, lr.cssLoadSuccess++, !0;
  try {
    return await I_(
      new Promise((r) => {
        const n = document.createElement("link");
        n.rel = "stylesheet", n.href = Id, n.onload = () => {
          Oa = !0, lr.cssLoadSuccess++, r(!0);
        }, n.onerror = () => {
          lr.cssLoadFailed++, r(!1);
        }, document.head.appendChild(n);
      }),
      Ua.cssTimeout,
      "CSS load timeout"
    );
  } catch {
    return lr.cssLoadFailed++, !1;
  }
}
function Md(e) {
  return e ? e.replace(/^[#/]+/, "").toLowerCase() : "";
}
const _n = "sidebar-router-sync", Cr = "7.1.0-ES6", N = { initialized: !1, ctx: null, syncs: 0, reloads: 0, errors: 0, cleanups: [] }, gt = v({ moduleId: _n });
function xu() {
  gt.init();
}
function yn(e) {
  return gt.get(e);
}
function A_(e) {
  return gt.inject(e);
}
function M_() {
  return gt.snapshot();
}
function Pu() {
  const e = yn("routerGlobal");
  if (e && e.getCurrentRoute)
    try {
      const t = e.getCurrentRoute();
      if (t && (t.hash || t.path)) return t.hash || t.path;
    } catch {
    }
  return typeof window < "u" && window.location && window.location.hash || "#/";
}
function gr(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: _n, version: Cr, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
function si(e) {
  return e.key || e.item_key || e.id;
}
function Ti(e, t) {
  const r = Md(t);
  for (let n = 0; n < e.length; n++)
    if (Md(e[n].route) === r) return e[n];
  return null;
}
function Hu(e) {
  const t = e.routerAdapter, r = e.registry, n = e.onSetActiveItem;
  try {
    const s = t && t.getCurrentRoute ? t.getCurrentRoute() : null, i = s && (s.path || s.hash) || Pu(), o = r && r.getItems ? r.getItems() : [], a = Ti(o, i);
    if (a && n) {
      const d = si(a);
      n(d), N.syncs++;
    }
    const l = yn("eventBus");
    return l && l.emit && l.emit(f.ROUTER_SYNCED, {
      path: i,
      itemId: a ? si(a) : null,
      itemKey: a && (a.key || a.item_key) || null,
      numericId: a ? a.id : null
    }), gr(!0, {
      synced: !0,
      path: i,
      itemId: a ? si(a) : null,
      itemKey: a && (a.key || a.item_key) || null
    });
  } catch (s) {
    return N.errors++, gr(!1, null, [{ code: "SYNC_ERROR", message: s.message }]);
  }
}
function Cl(e) {
  e.routerAdapter;
  const t = e.registry, r = e.onSetActiveItem, n = e.onReloadNavigation, s = e.eventBus;
  s && gt.inject({ eventBus: s }), xu(), Hu(e);
  const i = yn("eventBus");
  if (i && i.on) {
    const o = (d) => {
      N.syncs++;
      const u = t && t.getItems ? t.getItems() : [], h = d && d.path ? d.path : Pu(), g = Ti(u, h);
      if (g && r) {
        const m = si(g);
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
    Di();
  };
}
function Al(e, t) {
  const r = yn("eventBus");
  r && r.emit && r.emit(f.NAVIGATION_RELOADED, { sectionsCount: e, itemsCount: t, timestamp: Date.now() });
}
function zu(e) {
  if (N.initialized) return gr(!0, { alreadyInitialized: !0 });
  try {
    N.ctx = e, e && e.ports && gt.inject(e.ports), xu(), N.initialized = !0;
    const t = yn("eventBus");
    return t && t.emit && t.emit(f.ROUTER_SYNC_INITIALIZED, { version: Cr }), gr(!0, { initialized: !0, version: Cr });
  } catch (t) {
    return N.errors++, gr(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Di() {
  for (let e = 0; e < N.cleanups.length; e++)
    try {
      N.cleanups[e]();
    } catch {
    }
  return N.cleanups = [], N.initialized = !1, N.ctx = null, gr(!0, { cleanedUp: !0 });
}
function Ml() {
  return Di();
}
function Bu() {
  const e = {
    initialized: N.initialized,
    hasEventBus: !!yn("eventBus"),
    portsInitialized: gt.isInitialized(),
    lowErrorRate: N.syncs === 0 || N.errors < N.syncs * 0.2,
    noOrphanListeners: !0
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return N.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: _n,
    version: Cr,
    checks: e,
    metrics: { syncs: N.syncs, reloads: N.reloads, errors: N.errors, cleanups: N.cleanups.length },
    portsInitialized: gt.isInitialized(),
    p24Compliant: !0,
    timestamp: Date.now()
  };
}
function Uu() {
  return gr(!0, {
    moduleId: _n,
    version: Cr,
    initialized: N.initialized,
    syncs: N.syncs,
    reloads: N.reloads,
    errors: N.errors,
    cleanups: N.cleanups.length,
    portsInitialized: gt.isInitialized(),
    p24Compliant: !0
  });
}
function ju() {
  return { syncs: N.syncs, reloads: N.reloads, errors: N.errors, cleanups: N.cleanups.length };
}
const Fu = { singleton: !0, critical: !0, rendersUI: !1, category: "navigation", priority: "high" };
function O_(e) {
}
var T_ = { id: _n, version: Cr, capabilities: Fu, init: zu, cleanup: Di, destroy: Ml, healthCheck: Bu, info: Uu, getMetrics: ju, setupRouterSync: Cl, emitReloaded: Al };
const D_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: _n,
  VERSION: Cr,
  capabilities: Fu,
  cleanup: Di,
  default: T_,
  destroy: Ml,
  emitReloaded: Al,
  findItemByRoute: Ti,
  getMetrics: ju,
  getPorts: M_,
  healthCheck: Bu,
  info: Uu,
  init: zu,
  injectPorts: A_,
  setLogger: O_,
  setupRouterSync: Cl,
  syncWithRouter: Hu
}, Symbol.toStringTag, { value: "Module" })), ce = "navigation-model-loader", Ol = "2.3.0-FIX", fe = {
  CACHE_KEY: "dshow_nav_model_v3",
  SESSION_KEY: "dshow_nav_session_v3",
  CACHE_TTL: 5 * 60 * 1e3,
  SESSION_TTL: 30 * 60 * 1e3,
  API_TIMEOUT: 8e3,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1e3
}, Od = {
  NAVIGATION_MODEL: "/api/ui/navigation.php?action=manifest"
}, nr = {
  LOAD_START: `${ce}:load:start`,
  LOAD_SUCCESS: `${ce}:load:success`,
  LOAD_ERROR: `${ce}:load:error`,
  LOAD_FALLBACK: `${ce}:load:fallback`,
  CACHE_HIT: `${ce}:cache:hit`,
  CACHE_MISS: `${ce}:cache:miss`,
  CACHE_INVALIDATE: `${ce}:cache:invalidate`,
  MODEL_READY: `${ce}:model:ready`
}, Ye = {
  IDLE: "idle",
  LOADING: "loading",
  LOADED: "loaded",
  ERROR: "error",
  FALLBACK: "fallback"
}, Js = {
  NETWORK: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  PARSE: "PARSE_ERROR",
  AUTH: "AUTH_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
}, se = {
  status: Ye.IDLE,
  model: null,
  lastLoad: null,
  lastError: null,
  source: null,
  loadCount: 0
}, Gu = () => ({ ...se }), L_ = () => se.status, hi = () => se.model, wn = (e) => {
  se.status = e;
}, Ta = (e, t = "unknown") => {
  se.model = e, se.source = t, se.lastLoad = Date.now(), se.loadCount++;
}, $_ = (e) => {
  se.lastError = {
    message: e == null ? void 0 : e.message,
    timestamp: Date.now()
  };
}, k_ = () => {
  se.status = Ye.IDLE, se.model = null, se.lastLoad = null, se.lastError = null, se.source = null;
}, Vu = () => se.status === Ye.LOADED, w_ = () => se.status === Ye.LOADING, N_ = () => {
  var e;
  return ((e = window.DShow) == null ? void 0 : e.telemetry) || window.telemetry || null;
}, ae = (e, t = {}) => {
  var s;
  const r = N_(), n = {
    module: ce,
    version: Ol,
    event: `${ce}:${e}`,
    timestamp: Date.now(),
    ...t
  };
  if (r != null && r.track)
    try {
      r.track(n.event, n);
    } catch {
    }
  ((s = window.DShow) != null && s.debug || window.DEBUG_NAV_LOADER) && console.debug(`[${ce}]`, e, t);
}, Da = (e, t, r = !0) => {
  ae("load:complete", {
    source: e,
    duration: t,
    success: r
  });
}, qu = (e) => {
  try {
    const t = window[e], r = "__storage_test__";
    return t.setItem(r, r), t.removeItem(r), !0;
  } catch {
    return !1;
  }
}, Tl = qu("localStorage"), Dl = qu("sessionStorage"), R_ = () => {
  if (!Dl) return null;
  try {
    const e = sessionStorage.getItem(fe.SESSION_KEY);
    if (!e) return null;
    const t = JSON.parse(e);
    return !(t != null && t.data) || !(t != null && t.timestamp) ? null : Date.now() - t.timestamp > fe.SESSION_TTL ? (sessionStorage.removeItem(fe.SESSION_KEY), null) : t.data;
  } catch (e) {
    return ae("cache:session:error", { error: e.message }), null;
  }
}, x_ = (e) => {
  if (!Dl || !e) return !1;
  try {
    const t = {
      data: e,
      timestamp: Date.now(),
      version: fe.SESSION_KEY
    };
    return sessionStorage.setItem(fe.SESSION_KEY, JSON.stringify(t)), !0;
  } catch (t) {
    return ae("cache:session:save-error", { error: t.message }), !1;
  }
}, P_ = () => {
  if (!Tl) return null;
  try {
    const e = localStorage.getItem(fe.CACHE_KEY);
    if (!e) return null;
    const t = JSON.parse(e);
    return !(t != null && t.data) || !(t != null && t.timestamp) ? null : Date.now() - t.timestamp > fe.CACHE_TTL ? (localStorage.removeItem(fe.CACHE_KEY), null) : t.data;
  } catch (e) {
    return ae("cache:local:error", { error: e.message }), null;
  }
}, H_ = (e) => {
  if (!Tl || !e) return !1;
  try {
    const t = {
      data: e,
      timestamp: Date.now(),
      version: fe.CACHE_KEY
    };
    return localStorage.setItem(fe.CACHE_KEY, JSON.stringify(t)), !0;
  } catch (t) {
    return ae("cache:local:save-error", { error: t.message }), !1;
  }
}, z_ = () => {
  try {
    return Dl && sessionStorage.removeItem(fe.SESSION_KEY), Tl && localStorage.removeItem(fe.CACHE_KEY), ae("cache:invalidate:all"), !0;
  } catch {
    return !1;
  }
}, B_ = () => {
  const e = R_();
  if (e) return { data: e, source: "session" };
  const t = P_();
  return t ? { data: t, source: "local" } : null;
}, U_ = (e) => {
  x_(e), H_(e);
}, j_ = (e) => new Promise((t) => setTimeout(t, e)), F_ = async (e = {}) => {
  const {
    timeout: t = fe.API_TIMEOUT,
    retries: r = fe.RETRY_ATTEMPTS,
    signal: n = null
  } = e;
  let s = null, i = 0;
  for (; i <= r; ) {
    i++;
    const o = new AbortController(), a = setTimeout(() => o.abort(), t);
    try {
      ae("api:attempt", { attempt: i, endpoint: Od.NAVIGATION_MODEL });
      const l = await fetch(Od.NAVIGATION_MODEL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "same-origin",
        signal: n || o.signal
      });
      if (clearTimeout(a), l.status === 401 || l.status === 403)
        return ae("api:auth-required", { status: l.status }), {
          success: !1,
          error: Js.AUTH,
          status: l.status,
          authRequired: !0
        };
      if (!l.ok)
        throw new Error(`HTTP ${l.status}`);
      const d = await l.json();
      if (!d || typeof d != "object")
        throw new Error("Invalid response format");
      if (d.ok === !1)
        throw new Error(d.error || "API returned error");
      const u = d.data || d;
      return ae("api:success", { attempt: i, hasItems: !!u.items, hasTree: !!u.tree }), {
        success: !0,
        data: u,
        source: "api",
        attempt: i
      };
    } catch (l) {
      clearTimeout(a), s = l;
      const u = l.name === "AbortError" || l.message && l.message.includes("timeout");
      if (ae("api:error", {
        attempt: i,
        error: l.message,
        isTimeout: u,
        willRetry: i <= r
      }), n && n.aborted)
        return {
          success: !1,
          error: Js.TIMEOUT,
          aborted: !0
        };
      i <= r && await j_(fe.RETRY_DELAY * i);
    }
  }
  return {
    success: !1,
    error: s && s.message && s.message.includes("timeout") ? Js.TIMEOUT : Js.NETWORK,
    message: s ? s.message : "Unknown error",
    attempts: i
  };
}, Td = {
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
}, G_ = (e = "unknown") => (ae("fallback:used", { reason: e }), {
  ...Td,
  generated: Date.now(),
  metadata: {
    ...Td.metadata,
    reason: e,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
}), Ll = (e) => {
  var t;
  return ((t = e == null ? void 0 : e.metadata) == null ? void 0 : t.isFallback) === !0;
}, Yu = v({ moduleId: ce });
function V_() {
  Yu.init();
}
function q_(e) {
  return Yu.get(e);
}
const Y_ = () => (V_(), q_("eventBus")), sr = (e, t) => {
  t || (t = {});
  const r = Y_();
  if (!r || !r.emit) return !1;
  try {
    return r.emit(e, Object.assign({
      source: ce,
      timestamp: Date.now()
    }, t)), !0;
  } catch {
    return !1;
  }
}, K_ = () => sr(nr.LOAD_START), Dd = (e, t) => sr(nr.LOAD_SUCCESS, { model: e, source: t }), W_ = (e) => sr(nr.LOAD_ERROR, { error: e }), X_ = (e) => sr(nr.LOAD_FALLBACK, { reason: e }), La = (e) => sr(nr.MODEL_READY, { model: e }), Z_ = (e) => sr(nr.CACHE_HIT, { source: e }), J_ = () => sr(nr.CACHE_MISS), Q_ = () => sr(nr.CACHE_INVALIDATE), Ld = (e) => !e || typeof e != "object" ? !1 : !!(Array.isArray(e.items) && e.items.length > 0 || Array.isArray(e.tree) && e.tree.length > 0 || Array.isArray(e.sections) && e.sections.length > 0), ey = (e) => {
  if (!e) return [];
  if (Array.isArray(e.sections) && e.sections.length > 0)
    return e.sections;
  if (Array.isArray(e.items) && e.items.length > 0)
    return ty(e.items);
  if (Array.isArray(e.tree) && e.tree.length > 0) {
    const t = ry(e.tree);
    if (t.length > 0) return t;
  }
  return [];
};
function ty(e) {
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
function ry(e) {
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
const $d = (e) => {
  if (!e) return null;
  const t = ey(e);
  return {
    version: e.version || "api",
    generated: e.generated || Date.now(),
    source: e.source || "api",
    sections: t,
    metadata: e.metadata || {}
  };
};
let tn = null;
const Ku = async (e = {}) => {
  const { force: t = !1, skipCache: r = !1 } = e, n = Date.now();
  if (w_())
    return ae("load:already-loading"), { success: !1, reason: "already-loading" };
  if (!t && Vu()) {
    const o = hi();
    if (o && !Ll(o))
      return ae("load:already-loaded"), { success: !0, model: o, source: "memory" };
  }
  if (wn(Ye.LOADING), K_(), !r && !t) {
    const o = B_();
    if (o && Ld(o.data)) {
      const a = $d(o.data);
      return Ta(a, o.source), wn(Ye.LOADED), Z_(o.source), Dd(a, o.source), La(a), Da(o.source, Date.now() - n), { success: !0, model: a, source: o.source };
    }
    J_();
  }
  tn = new AbortController();
  const s = await F_({ signal: tn.signal });
  if (tn = null, s.success && Ld(s.data)) {
    const o = $d(s.data);
    return Ta(o, "api"), wn(Ye.LOADED), U_(o), Dd(o, "api"), La(o), Da("api", Date.now() - n), { success: !0, model: o, source: "api" };
  }
  if (s.authRequired)
    return wn(Ye.ERROR), $_({ message: "Auth required" }), W_({ type: "auth", status: s.status }), ae("load:auth-required"), { success: !1, authRequired: !0, status: s.status };
  ae("load:using-fallback", { reason: s.error });
  const i = G_(s.error || "api-error");
  return Ta(i, "fallback"), wn(Ye.FALLBACK), X_(s.error), La(i), Da("fallback", Date.now() - n, !1), { success: !0, model: i, source: "fallback", degraded: !0 };
}, ny = async (e) => (z_(), Q_(), k_(), Ku({ force: !0, skipCache: !0 })), sy = () => {
  tn && (tn.abort(), tn = null, ae("load:aborted"));
}, iy = () => hi(), oy = () => L_(), ay = () => Vu(), ly = () => ({
  moduleId: ce,
  version: Ol,
  state: Gu(),
  hasModel: !!hi(),
  isFallback: Ll(hi())
}), cy = () => {
  const e = Gu();
  return {
    healthy: e.status === Ye.LOADED && !!e.model,
    status: e.status,
    lastLoad: e.lastLoad,
    source: e.source,
    isFallback: Ll(e.model)
  };
};
var k = {
  load: Ku,
  reload: ny,
  abort: sy,
  getModel: iy,
  getStatus: oy,
  isReady: ay,
  info: ly,
  healthCheck: cy,
  MODULE_ID: ce,
  VERSION: Ol
};
async function dy(e) {
  var d, u, h;
  const { engine: t, renderer: r, registry: n, adapters: s, logger: i, metrics: o, modelLoaderInitialized: a, getCurrentHash: l } = e;
  try {
    if (i.info("Reloading navigation..."), a)
      try {
        const x = await k.reload(!0);
        o && o.modelLoaderCalls++, i.info("P24: NavigationModel reloaded", { source: x.source, success: x.success });
      } catch (x) {
        i.warn("P24: NavigationModel reload failed", { error: x.message });
      }
    (d = n.invalidateCache) == null || d.call(n);
    const g = await n.loadFromAPI();
    if (!g.success)
      return i.warn("Failed to reload navigation:", g.error), { success: !1, error: g.error };
    n.applyPermissionFilter(), t.loadSections(n.getSections()), t.loadItems(n.getItems()), r.renderNavigation();
    const m = (h = (u = s.router) == null ? void 0 : u.getCurrentRoute) == null ? void 0 : h.call(u), y = (m == null ? void 0 : m.path) || (m == null ? void 0 : m.hash) || l(), S = Ti(n.getItems(), y);
    return S && (t.setActiveItem(S.id), r.setActiveItem(S.id)), i.info("Navigation reloaded successfully"), Al(n.getSections().length, n.getItems().length), { success: !0, sections: n.getSections().length, items: n.getItems().length };
  } catch (g) {
    return i.error("Reload navigation error:", g), { success: !1, error: g.message };
  }
}
const Qs = "5.7.0-DUAL-LOOKUP", kd = "sidebar-engine";
class uy {
  constructor(t = {}) {
    this._options = t, this._stateMachine = new jb({
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
    return t.success ? (this._emit(f.INITIALIZED, { version: Qs }), { success: !0, state: this._stateMachine.lifecycle }) : t;
  }
  async mount() {
    this._metrics.mounts++;
    const t = this._stateMachine.transitionTo(L.MOUNTING);
    return t.success ? (this._emit(f.TOGGLE, { action: "mounting" }), { success: !0, state: this._stateMachine.lifecycle }) : t;
  }
  async ready() {
    this._metrics.readys++, this._stateMachine.lifecycle === L.MOUNTING && this._stateMachine.transitionTo(L.MOUNTED);
    const t = this._stateMachine.transitionTo(L.READY);
    return t.success ? (this._autoExpandNonCollapsibleSections(), this._emit(f.READY, { version: Qs }), { success: !0, state: this._stateMachine.lifecycle }) : t;
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
      version: Qs,
      moduleId: kd,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    };
  }
  info() {
    return { version: Qs, moduleId: kd, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
}
function hy(e) {
  return new uy(e);
}
const Wu = "5.8.0-ES6", $l = "sidebar-logger", fy = "[sidebar]", Zn = v({ moduleId: $l });
function gy() {
  Zn.init();
}
function my(e) {
  return Zn.get(e);
}
function Re(e = {}) {
  this._debug = e.debug !== void 0 ? e.debug : !1, this._prefix = e.prefix || fy, this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 }, gy();
}
Re.prototype._getLogger = () => my("logger");
Re.prototype.setDebug = function(e) {
  this._debug = e;
};
Re.prototype.debug = function(...e) {
  if (!this._debug) return;
  const t = this._getLogger();
  t && t.debug && t.debug(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.debug++, this._metrics.total++;
};
Re.prototype.info = function(...e) {
  const t = this._getLogger();
  t && t.info && t.info(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.info++, this._metrics.total++;
};
Re.prototype.warn = function(...e) {
  const t = this._getLogger();
  t && t.warn && t.warn(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.warn++, this._metrics.total++;
};
Re.prototype.error = function(...e) {
  const t = this._getLogger();
  t && t.error && t.error(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.error++, this._metrics.total++;
};
Re.prototype.log = function(...e) {
  const t = this._getLogger();
  t && t.info && t.info(...[this._prefix].concat(Array.prototype.slice.call(e))), this._metrics.total++;
};
Re.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
Re.prototype.reset = function() {
  this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 };
};
Re.prototype.healthCheck = function() {
  const t = { hasLogger: !!this._getLogger(), debugModeSet: typeof this._debug == "boolean", prefixSet: !!this._prefix, metricsTracking: this._metrics.total >= 0, portsInitialized: Zn.isInitialized() };
  let r = 0;
  for (const s in t)
    t[s] && r++;
  const n = Object.keys(t).length;
  return { status: r >= 4 ? "HEALTHY" : "DEGRADED", score: r, maxScore: n, scoreDisplay: `${r}/${n}`, checks: t, debugEnabled: this._debug, metrics: this._metrics, version: Wu, moduleId: $l, portsInitialized: Zn.isInitialized(), timestamp: Date.now() };
};
Re.prototype.getInfo = function() {
  return { moduleId: $l, version: Wu, debugEnabled: this._debug, prefix: this._prefix, portsInitialized: Zn.isInitialized(), metrics: this.getMetrics() };
};
function py(e) {
  return new Re(e);
}
const wd = "5.6.2-P22", ii = "sidebar.telemetry.tracker", fi = v({ moduleId: ii });
function Ey() {
  fi.init();
}
function Nd(e) {
  return fi.get(e);
}
class by {
  constructor(t = {}) {
    this._enabled = t.enabled ?? !0, this._prefix = t.prefix ?? "sidebar:", this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }
  _getTelemetry() {
    return Nd("telemetryCore") || Nd("telemetry");
  }
  track(t, r = {}) {
    if (!this._enabled) return;
    Ey();
    const n = this._getTelemetry(), s = t.startsWith(this._prefix) ? t : `${this._prefix}${t}`, i = { source: ii, timestamp: Date.now(), ...r };
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
    const t = !!this._getTelemetry(), r = { enabled: this._enabled, hasTelemetry: t, noErrors: this._metrics.errors === 0, trackingWorks: this._metrics.tracks >= 0, portsInitialized: fi.isInitialized() }, n = Object.values(r).filter(Boolean).length, s = Object.keys(r).length;
    return { status: n >= 4 ? "HEALTHY" : "DEGRADED", score: n, maxScore: s, scoreDisplay: `${n}/${s}`, checks: r, metrics: this._metrics, version: wd, moduleId: ii, timestamp: Date.now() };
  }
  getInfo() {
    return { moduleId: ii, version: wd, enabled: this._enabled, prefix: this._prefix, portsInitialized: fi.isInitialized(), metrics: this.getMetrics() };
  }
}
function _y(e) {
  return new by(e);
}
const yy = "sidebar-api-ports", vy = v({ moduleId: yy });
function Ct(e) {
  return vy.get(e);
}
const mr = {
  toggleAttempts: 0,
  toggleSuccess: 0,
  toggleBlocked: 0,
  syncFailures: 0,
  fallbackUsed: 0,
  atomicTransitions: 0,
  lastToggleAt: null
};
function dr(e) {
  e in mr && typeof mr[e] == "number" && mr[e]++;
}
function Iy(e, t) {
  e in mr && (mr[e] = t);
}
function Sy(e) {
  return mr[e];
}
function Xu() {
  return { ...mr };
}
let rn = null;
const Cy = 150;
function ei(e, t) {
  var l, d, u, h;
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
    const m = Ct("layoutManager"), y = Ct("eventBus");
    m != null && m.setSidebarCollapsed ? (m.setSidebarCollapsed(o), a.body = !0) : y != null && y.emit ? (y.emit(ni.REQUEST_LAYOUT, {
      mode: o ? "sidebar-collapsed" : "sidebar-expanded",
      source: "sidebar-toggle"
    }), a.body = !0) : (document.body.classList.toggle("sidebar-collapsed", o), a.body = !0, dr("fallbackUsed"));
    try {
      localStorage.setItem("dshowdash-layout-sidebarCollapsed", JSON.stringify(o)), localStorage.setItem("dsd-sidebar-collapsed", JSON.stringify(o)), a.localStorage = !0;
    } catch (x) {
      (d = s == null ? void 0 : s.warn) == null || d.call(s, "Failed to persist collapsed state:", x.message);
    }
    dr("atomicTransitions");
    const S = performance.now() - i;
    return (u = s == null ? void 0 : s.debug) == null || u.call(s, "P24 Atomic transition complete", {
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
    return (h = s == null ? void 0 : s.error) == null || h.call(s, "P24 Atomic transition failed:", g), dr("syncFailures"), {
      success: !1,
      error: g.message,
      results: a
    };
  }
}
function Ay(e) {
  const { engine: t, renderer: r, tracker: n, logger: s } = e;
  return {
    toggle() {
      var i, o, a, l, d;
      if (dr("toggleAttempts"), rn) {
        dr("toggleBlocked"), (i = s == null ? void 0 : s.debug) == null || i.call(s, "Toggle blocked by debounce");
        return;
      }
      rn = setTimeout(() => {
        rn = null;
      }, Cy);
      try {
        const h = !t.collapsed, g = ei(h, { engine: t, renderer: r, logger: s });
        g.success ? (dr("toggleSuccess"), Iy("lastToggleAt", Date.now()), (o = n == null ? void 0 : n.trackToggle) == null || o.call(n, h), (a = s == null ? void 0 : s.info) == null || a.call(s, "P24 Toggle complete (atomic)", {
          collapsed: h,
          atomicTransitions: Sy("atomicTransitions")
        })) : (l = s == null ? void 0 : s.error) == null || l.call(s, "P24 Toggle atomic failed", { error: g.error });
      } catch (u) {
        (d = s == null ? void 0 : s.error) == null || d.call(s, "Toggle error:", u), dr("syncFailures");
      }
    },
    collapse() {
      var i, o;
      try {
        const a = ei(!0, { engine: t, renderer: r, logger: s });
        a.success || (i = s == null ? void 0 : s.error) == null || i.call(s, "Collapse atomic failed:", a.error);
      } catch (a) {
        (o = s == null ? void 0 : s.error) == null || o.call(s, "Collapse error:", a);
      }
    },
    expand() {
      var i, o;
      try {
        const a = ei(!1, { engine: t, renderer: r, logger: s });
        a.success || (i = s == null ? void 0 : s.error) == null || i.call(s, "Expand atomic failed:", a.error);
      } catch (a) {
        (o = s == null ? void 0 : s.error) == null || o.call(s, "Expand error:", a);
      }
    },
    forceSync() {
      var i;
      try {
        const o = t.collapsed, a = ei(o, { engine: t, renderer: r, logger: s });
        return { success: a.success, collapsed: o, atomicResult: a };
      } catch (o) {
        return (i = s == null ? void 0 : s.error) == null || i.call(s, "Force sync error:", o), { success: !1, error: o.message };
      }
    },
    getToggleMetrics() {
      return Xu();
    }
  };
}
function My() {
  rn && (clearTimeout(rn), rn = null);
}
function Oy(e) {
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
function Ty(e) {
  const { engine: t, renderer: r, logger: n } = e;
  return {
    openMobile() {
      var s;
      try {
        t.openMobile(), r.setMobileOpen(!0);
        const i = Ct("layoutManager"), o = Ct("eventBus");
        i != null && i.setSidebarMobileOpen ? i.setSidebarMobileOpen(!0) : o != null && o.emit && o.emit(ni.REQUEST_LAYOUT, { mode: "sidebar-mobile-open", source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "OpenMobile error:", i);
      }
    },
    closeMobile() {
      var s;
      try {
        t.closeMobile(), r.setMobileOpen(!1);
        const i = Ct("layoutManager"), o = Ct("eventBus");
        i != null && i.setSidebarMobileOpen ? i.setSidebarMobileOpen(!1) : o != null && o.emit && o.emit(ni.REQUEST_LAYOUT, { mode: "sidebar-mobile-closed", source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "CloseMobile error:", i);
      }
    },
    toggleMobile() {
      var s;
      try {
        t.toggleMobile(), r.setMobileOpen(t.mobileOpen);
        const i = t.mobileOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed", o = Ct("layoutManager"), a = Ct("eventBus");
        o != null && o.setSidebarMobileOpen ? o.setSidebarMobileOpen(t.mobileOpen) : a != null && a.emit && a.emit(ni.REQUEST_LAYOUT, { mode: i, source: "sidebar" });
      } catch (i) {
        (s = n == null ? void 0 : n.error) == null || s.call(n, "ToggleMobile error:", i);
      }
    }
  };
}
function Dy(e) {
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
      } catch (d) {
        (l = i == null ? void 0 : i.error) == null || l.call(i, "SetBadge error:", d);
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
const Zu = Xu;
function Ly(e) {
  return {
    ...Ay(e),
    ...Oy(e),
    ...Ty(e),
    ...Dy(e)
  };
}
let Ot = null, Ka = { loads: 0, merges: 0, errors: 0 };
const Rd = {
  collapsed: !1,
  mobileBreakpoint: 1024,
  animationDuration: 200,
  persistState: !0,
  containerSelector: "#sidebar-container",
  settings: { defaultCollapsed: !1 },
  accordion: { allowMultipleOpen: !0, persistState: !0 },
  header: { title: "DshowDash" }
};
function kl(e = {}) {
  try {
    return Ot = { ...Rd, ...e }, Ka.loads++, Ot;
  } catch {
    return Ka.errors++, Ot = { ...Rd }, Ot;
  }
}
function Ju() {
  return Ot || kl(), { ...Ot };
}
function $y(e = {}) {
  return Ka.merges++, Ot || kl(), { ...Ot, ...e };
}
function ky(e) {
  return function() {
    return (e == null ? void 0 : e.getState()) || null;
  };
}
const xd = "7.1.0-P2-HARDNAV", Zr = "sidebar-router-adapter", gi = v({ moduleId: Zr });
function wy() {
  gi.init();
}
function rt(e) {
  return gi.get(e);
}
function Nn() {
  return rt("eventBus") || rt("eventBusGlobal");
}
function Ny() {
  wy();
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
    const a = Nn();
    a && a.emit && (t.busSource = rt("eventBus") ? "eventBus" : "eventBusGlobal", a.emit(pe.NAVIGATE, {
      path: s,
      options: { source: i, ...o },
      source: i,
      timestamp: Date.now()
    }));
  }
  function n(s, i) {
    const o = Nn();
    o && o.emit && o.emit(cl.HARD_NAV, {
      path: s,
      reason: i,
      source: Zr,
      timestamp: Date.now()
    }), t.hardNavs++;
  }
  return {
    navigate(s, i = {}) {
      try {
        const o = rt("routerGlobal");
        if (o && o.navigate)
          return o.navigate(s, { source: Zr, ...i }), t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "router-global" };
        const a = Nn();
        return a && a.emit ? (r(s, Zr, i), t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "event-bus-navigate" }) : s && typeof window < "u" && window.location ? (n(s, "No RouterGlobal or EventBus available"), window.location.hash = s.startsWith("#") ? s : `#${s}`, t.navigations++, t.lastNavigation = { route: s, timestamp: Date.now() }, { success: !0, method: "hash-fallback" }) : (t.errors++, { success: !1, error: "no-route" });
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
        const i = Nn();
        if (i && i.on) {
          const d = (h) => {
            t.routeChanges++, t.lastRouteChange = Date.now(), s(h);
          }, u = i.on(pe.ROUTE_CHANGED, d);
          if (typeof u == "function")
            return e.push(u), u;
          {
            const h = () => {
              i.off && i.off(pe.ROUTE_CHANGED, d);
            };
            return e.push(h), h;
          }
        }
        const o = rt("routerGlobal");
        if (o != null && o.on) {
          const d = (h) => {
            t.routeChanges++, t.lastRouteChange = Date.now(), s(h);
          };
          o.on(pe.ROUTE_CHANGED, d);
          const u = () => {
            var h;
            (h = o.off) == null || h.call(o, pe.ROUTE_CHANGED, d);
          };
          return e.push(u), u;
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
        moduleId: Zr,
        version: xd,
        p0Compliant: !0,
        p2Compliant: !0,
        portsInitialized: gi.isInitialized(),
        currentRoute: this.getCurrentRoute(),
        cleanupCount: e.length,
        metrics: this.getMetrics(),
        busSource: t.busSource
      };
    },
    healthCheck() {
      const i = !!Nn(), o = !!rt("routerGlobal"), a = this.getCurrentRoute(), l = a && !a.error, d = {
        hasEventBus: i,
        hasRouterGlobal: o,
        hasValidRoute: l,
        noErrors: t.errors === 0,
        cleanupSetup: e.length >= 0,
        p0Compliant: !0,
        p2Compliant: !0
      }, u = Object.values(d).filter(Boolean).length, h = Object.keys(d).length;
      let g = "HEALTHY";
      return !i && !o && (g = "DEGRADED"), t.errors > 5 && (g = "DEGRADED"), {
        status: g,
        score: u,
        maxScore: h,
        scoreDisplay: `${u}/${h}`,
        checks: d,
        currentRoute: a,
        metrics: t,
        cleanupCount: e.length,
        version: xd,
        moduleId: Zr,
        portsInitialized: gi.isInitialized(),
        busSource: rt("eventBus") ? "eventBus" : rt("eventBusGlobal") ? "eventBusGlobal" : "none",
        timestamp: Date.now()
      };
    }
  };
}
const Pd = "6.0.0-ES6", oi = "sidebar-telemetry-adapter", Ry = "[sidebar]", Wa = v({ moduleId: oi });
function Rn(e) {
  return Wa.get(e);
}
function xy() {
  let e = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null };
  const t = () => Rn("logger"), r = () => Rn("telemetryCore") || Rn("telemetry");
  return {
    log(n, s, i = {}) {
      try {
        const o = t(), a = `${Ry} ${s}`, l = Object.assign({ timestamp: Date.now() }, i);
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
        const i = r(), o = Object.assign({ source: oi, timestamp: Date.now() }, s);
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
      return { moduleId: oi, version: Pd, portsInitialized: Wa.isInitialized(), hasLogger: !!t(), hasTelemetry: !!r(), metrics: this.getMetrics() };
    },
    healthCheck() {
      const n = !!t(), s = !!Rn("telemetryCore"), i = !!Rn("eventBus"), o = e.logs.debug + e.logs.info + e.logs.warn + e.logs.error, a = { hasLogger: n, hasTelemetry: s, hasEventBus: i, noErrors: e.errors === 0, logsWorking: o > 0 || e.errors === 0 }, l = Object.values(a).filter(Boolean).length, d = Object.keys(a).length;
      return { status: l >= 3 ? "HEALTHY" : "DEGRADED", score: l, maxScore: d, scoreDisplay: `${l}/${d}`, checks: a, metrics: e, version: Pd, moduleId: oi, portsInitialized: Wa.isInitialized(), timestamp: Date.now() };
    }
  };
}
const Hd = "5.9.0-ES6", Xa = "sidebar-permissions-adapter", Gn = v({ moduleId: Xa });
function Kr() {
  Gn.init();
}
function Py(e) {
  return Gn.get(e);
}
function Wr() {
  const e = Py("auth");
  return e || typeof window < "u" && (window.AuthAdapter || window.CoreAuthAdapter) || null;
}
function Hy() {
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
      Kr();
      try {
        if (r() && t.level !== null)
          return e.cacheHits++, t.level;
        const i = Wr(), o = ((s = i == null ? void 0 : i.getLevel) == null ? void 0 : s.call(i)) ?? 0;
        return t.level = o, t.timestamp = Date.now(), e.levelChecks++, e.lastCheck = Date.now(), o;
      } catch {
        return e.errors++, 0;
      }
    },
    getUserPermissions() {
      var s, i;
      Kr();
      try {
        if (r() && t.permissions !== null)
          return e.cacheHits++, t.permissions;
        const o = Wr(), a = ((s = o == null ? void 0 : o.getRoles) == null ? void 0 : s.call(o)) ?? [], l = ((i = o == null ? void 0 : o.getCapabilities) == null ? void 0 : i.call(o)) ?? [], d = [...a, ...l];
        return t.permissions = d, t.timestamp = Date.now(), e.permissionChecks++, d;
      } catch {
        return e.errors++, [];
      }
    },
    canAccess(s) {
      var i;
      Kr();
      try {
        const o = Wr();
        return (i = o == null ? void 0 : o.isReady) != null && i.call(o) ? o.can ? o.can(s) === !0 : this.getUserPermissions().includes(s) : !1;
      } catch {
        return e.errors++, !1;
      }
    },
    filterItems(s) {
      try {
        if (!Array.isArray(s)) return [];
        const i = this.getUserPermissions(), o = s.filter((a) => !(a.permissions && a.permissions.length > 0 && !a.permissions.some(
          (d) => i.includes(d) || this.canAccess(d)
        )));
        return e.filterOperations++, o;
      } catch {
        return e.errors++, s;
      }
    },
    isAuthenticated() {
      var s;
      Kr();
      try {
        const i = Wr();
        return ((s = i == null ? void 0 : i.isAuthenticated) == null ? void 0 : s.call(i)) ?? !1;
      } catch {
        return e.errors++, !1;
      }
    },
    getUser() {
      var s;
      Kr();
      try {
        const i = Wr();
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
        moduleId: Xa,
        version: Hd,
        portsInitialized: Gn.isInitialized(),
        isAuthenticated: this.isAuthenticated(),
        cacheValid: r(),
        metrics: this.getMetrics()
      };
    },
    healthCheck() {
      var m, y;
      Kr();
      const s = Wr(), i = ((m = s == null ? void 0 : s.isReady) == null ? void 0 : m.call(s)) ?? !1, o = ((y = s == null ? void 0 : s.healthCheck) == null ? void 0 : y.call(s)) ?? { status: "UNKNOWN" }, a = this.getUser(), l = this.isAuthenticated(), d = {
        authReady: i,
        hasUser: !!a,
        isAuthenticated: l,
        authHealthy: o.status === "HEALTHY",
        noErrors: e.errors === 0,
        portsInitialized: Gn.isInitialized()
      }, u = Object.values(d).filter(Boolean).length, h = Object.keys(d).length;
      let g = "HEALTHY";
      return i ? (!l || e.errors > 0) && (g = "DEGRADED") : g = "UNHEALTHY", {
        status: g,
        score: u,
        maxScore: h,
        scoreDisplay: `${u}/${h}`,
        checks: d,
        isAuthenticated: l,
        authSource: "ports:auth",
        authHealth: o.status,
        metrics: e,
        cacheValid: r(),
        version: Hd,
        moduleId: Xa,
        portsInitialized: Gn.isInitialized(),
        timestamp: Date.now()
      };
    }
  };
}
const zd = "5.5.0-ENTERPRISE-FULL", Bd = "sidebar-ui-adapter";
function zy(e = {}) {
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
      const le = s();
      if (!le) return !1;
      const Yr = le.querySelector(_);
      return Yr ? (Yr.innerHTML = A, n.updates++, n.lastOperation = { type: "update", selector: _, timestamp: Date.now() }, !0) : !1;
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
  function d(_, A) {
    try {
      const le = s();
      return le ? (le.classList.toggle(_, A), n.classOperations++, !0) : !1;
    } catch {
      return n.errors++, !1;
    }
  }
  function u(_, A) {
    try {
      const le = s();
      return le ? (le.setAttribute(_, A), !0) : !1;
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
    return { moduleId: Bd, version: zd, hasContainer: !!_, containerId: (_ == null ? void 0 : _.id) || null, metrics: S() };
  }
  function Me() {
    const _ = s(), A = _ && document.contains(_), le = (_ == null ? void 0 : _.querySelector(".dsd-sidebar")) !== null || (_ == null ? void 0 : _.classList.contains("dsd-sidebar")), Yr = { containerFound: !!_, containerInDOM: A, hasSidebarElement: le, noErrors: n.errors === 0, cacheValid: r !== null }, yd = Object.values(Yr).filter(Boolean).length, vd = Object.keys(Yr).length;
    let Aa = "HEALTHY";
    return _ ? (!A || n.errors > 0) && (Aa = "DEGRADED") : Aa = "UNHEALTHY", { status: Aa, score: yd, maxScore: vd, scoreDisplay: `${yd}/${vd}`, checks: Yr, containerId: (_ == null ? void 0 : _.id) || null, containerSelector: _ ? t.find((Rb) => {
      try {
        return document.querySelector(Rb) === _;
      } catch {
        return !1;
      }
    }) : null, metrics: n, version: zd, moduleId: Bd, timestamp: Date.now() };
  }
  return { getContainer: s, render: i, update: o, addClass: a, removeClass: l, toggleClass: d, setAttribute: u, getAttribute: h, querySelector: g, querySelectorAll: m, invalidateCache: y, getMetrics: S, reset: x, info: Ae, healthCheck: Me };
}
const By = "sidebar-adapters-factory", Uy = v({ moduleId: By });
function ur(e) {
  return Uy.get(e);
}
function jy() {
  return {
    navigate(e) {
      const t = ur("router"), r = ur("eventBus");
      if (t && t.navigate) {
        t.navigate(e, { source: "sidebar-fallback" });
        return;
      }
      if (r && r.emit) {
        r.emit(Pb.NAVIGATE, {
          intentId: "NAVIGATE",
          target: { type: "route", value: e },
          meta: { source: "sidebar-fallback", reason: "fallback-navigation", timestamp: Date.now() },
          options: { replace: !1 }
        });
        return;
      }
      typeof window < "u" && window.location && (r && r.emit && r.emit(cl.HARD_NAV, {
        path: e,
        reason: "No RouterGlobal or EventBus pipeline",
        source: "sidebar-fallback",
        timestamp: Date.now()
      }), window.location.hash = e);
    },
    getCurrentRoute() {
      const e = ur("router");
      if (e && e.getCurrentRoute) return e.getCurrentRoute();
      if (e && e.current) return e.current;
      if (typeof window < "u" && window.location) {
        const t = window.location.hash || "#/";
        return { path: t, hash: t };
      }
      return { path: "#/", hash: "#/" };
    },
    onRouteChange(e) {
      const t = ur("eventBus");
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
function Fy() {
  return {
    getContainer() {
      return document.querySelector('[data-shell-region="sidebar"]') || document.getElementById("sidebar");
    },
    healthCheck() {
      return { status: "DEGRADED", score: 1, maxScore: 3, scoreDisplay: "1/3", fallback: !0 };
    }
  };
}
function Gy() {
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
function Vy() {
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
function qy(e = {}) {
  const t = {};
  try {
    t.router = Ny();
  } catch (r) {
    _e("router-adapter", r.message), t.router = jy();
  }
  try {
    t.telemetry = xy();
  } catch (r) {
    _e("telemetry-adapter", r.message), t.telemetry = Gy();
  }
  try {
    t.permissions = Hy();
  } catch (r) {
    _e("permissions-adapter", r.message), t.permissions = Vy();
  }
  try {
    t.ui = zy({ containerSelector: e.containerSelector || '[data-shell-region="sidebar"]' });
  } catch (r) {
    _e("ui-adapter", r.message), t.ui = Fy();
  }
  return t;
}
function Yy(e) {
  return {
    navigation: e.router,
    telemetry: e.telemetry,
    permissions: e.permissions,
    ui: e.ui,
    events: Ky()
  };
}
function Ky() {
  return {
    emit(e, t) {
      try {
        const r = ur("eventBus");
        r && r.emit && r.emit(e, Object.assign({ source: "sidebar", timestamp: Date.now() }, t || {}));
      } catch {
      }
    },
    on(e, t) {
      try {
        const r = ur("eventBus");
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
        const r = ur("eventBus");
        r && r.off && r.off(e, t);
      } catch {
      }
    }
  };
}
const $a = { dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', team: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', people: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', "users-cog": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 8v1"/><path d="M19 13v1"/><path d="M16.5 9.5l.7.7"/><path d="M20.8 13.8l.7.7"/><path d="M16.5 12.5l.7-.7"/><path d="M20.8 8.2l.7-.7"/><path d="M16 11h1"/><path d="M21 11h1"/></svg>', shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', "shield-check": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>', key: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', "clipboard-list": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/></svg>', settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', cog: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', money: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', package: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', document: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', nav: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', server: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>', automation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>', cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', supplier: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>', ads: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>', instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>', drive: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', pipeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', calculator: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>', folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' };
function Qu(e) {
  if ($a[e]) return $a[e];
  if (e.includes(":")) {
    const r = Wy(e);
    if (r) return r;
  }
  const t = Xy(e);
  return t || $a.default;
}
function Wy(e) {
  try {
    return Eu(e);
  } catch {
    return null;
  }
}
function Xy(e) {
  try {
    const t = Hb();
    for (const r of t) {
      const n = Eu(r + ":" + e);
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
function Zy(e = {}) {
  return '<aside class="dsd-sidebar" id="sidebar" role="navigation" aria-label="Menu principal"><div class="dsd-sidebar__header dsd-sidebar__header--with-search"><div class="dsd-sidebar__search" role="search"><div class="dsd-sidebar__search-wrapper"><span class="dsd-sidebar__search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span><input type="text" class="dsd-sidebar__search-input" placeholder="Buscar..." aria-label="Buscar página"/><span class="dsd-sidebar__search-clear" role="button" aria-label="Limpar busca" tabindex="0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></div></div><button class="dsd-sidebar__toggle" type="button" aria-label="Recolher menu" aria-expanded="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button></div><nav class="dsd-sidebar__nav"><div class="dsd-sidebar__nav-content" data-slot="nav-items"></div></nav><div class="dsd-sidebar__keyboard-hints sr-only">Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar.</div><div class="dsd-sidebar__announce sr-only" role="status" aria-live="polite" aria-atomic="true"></div></aside>';
}
function Ud(e = {}) {
  const t = Oe("aside", { className: "dsd-sidebar", id: "sidebar", attributes: { role: "navigation", "aria-label": "Menu principal" } }), r = Oe("div", { className: "dsd-sidebar__header dsd-sidebar__header--with-search" }), n = Oe("div", { className: "dsd-sidebar__search", attributes: { role: "search" } }), s = Oe("div", { className: "dsd-sidebar__search-wrapper" }), i = Oe("span", { className: "dsd-sidebar__search-icon" });
  i.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
  const o = Oe("input", { className: "dsd-sidebar__search-input", attributes: { type: "text", placeholder: "Buscar...", "aria-label": "Buscar página" } }), a = Oe("span", { className: "dsd-sidebar__search-clear", attributes: { role: "button", "aria-label": "Limpar busca", tabindex: "0" } });
  a.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', s.appendChild(i), s.appendChild(o), s.appendChild(a), n.appendChild(s);
  const l = Oe("button", { className: "dsd-sidebar__toggle", attributes: { type: "button", "aria-label": "Recolher menu", "aria-expanded": "true" } });
  l.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>', r.appendChild(n), r.appendChild(l);
  const d = Oe("nav", { className: "dsd-sidebar__nav" }), u = Oe("div", { className: "dsd-sidebar__nav-content", attributes: { "data-slot": "nav-items" } });
  d.appendChild(u);
  const h = Oe("div", { className: "dsd-sidebar__keyboard-hints sr-only", textContent: "Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar." }), g = Oe("div", { className: "dsd-sidebar__announce sr-only", attributes: { role: "status", "aria-live": "polite", "aria-atomic": "true" } });
  return t.appendChild(r), t.appendChild(d), t.appendChild(h), t.appendChild(g), t;
}
let St = null, Te = null, Jn = { shows: 0, hides: 0, errors: 0 };
function eh(e, t = {}) {
  const r = document.createElement(e);
  return t.id && (r.id = t.id), t.className && (r.className = t.className), t.attributes && Object.entries(t.attributes).forEach(([n, s]) => r.setAttribute(n, s)), t.style && (r.style.cssText = t.style), r;
}
function th(e) {
  return document.querySelector(e);
}
function jd(e) {
  return document.getElementById(e);
}
function Jy() {
  try {
    return St && document.contains(St) || (St = jd("app-overlay-root"), St || (St = eh("div", { id: "app-overlay-root", attributes: { "data-overlay-root": "true" }, style: "position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;" }), (jd("app-shell") || document.documentElement).appendChild(St))), St;
  } catch {
    return Jn.errors++, null;
  }
}
function Qy() {
  try {
    if ((!Te || !document.contains(Te)) && (Te = th(".dsd-sidebar-overlay")), !Te) {
      Te = eh("div", { className: "dsd-sidebar-overlay", attributes: { "aria-hidden": "true" }, style: "pointer-events:auto;" });
      const e = Jy();
      e && e.appendChild(Te);
    }
    return Te.classList.add("dsd-sidebar-overlay--visible"), Jn.shows++, { success: !0 };
  } catch (e) {
    return Jn.errors++, { success: !1, error: e.message };
  }
}
function ev() {
  try {
    return Te || (Te = th(".dsd-sidebar-overlay")), Te == null || Te.classList.remove("dsd-sidebar-overlay--visible"), Jn.hides++, { success: !0 };
  } catch (e) {
    return Jn.errors++, { success: !1, error: e.message };
  }
}
const rh = v({ moduleId: El });
function tv() {
  rh.init();
}
function rv(e) {
  return rh.get(e);
}
let pr = { renders: 0, fallbacks: 0, errors: 0, modelLoaderRenders: 0, registryFallbacks: 0 };
function nh(e) {
  return `trigger:navigation:item-${e}`;
}
function nv(e) {
  return `trigger:navigation:section-${e}`;
}
function Ar(e, t, r) {
  try {
    r.includes(e) || r.push(e);
    const n = rv("eventBus");
    n != null && n.emit && n.emit(f.DEGRADED, { source: El, component: e, error: t, degradedComponents: r, timestamp: Date.now() });
  } catch {
  }
}
function ye(e, t = {}) {
  const r = document.createElement(e);
  return t.className && (r.className = t.className), t.id && (r.id = t.id), t.attributes && Object.entries(t.attributes).forEach(([n, s]) => {
    s != null && r.setAttribute(n, s);
  }), t.style && (r.style.cssText = t.style), t.textContent && (r.textContent = t.textContent), r;
}
function sv(e) {
  const t = ye("span", { className: c.GROUP_ICON });
  return t.innerHTML = Qu(e), t;
}
function iv() {
  const e = ye("span", { className: c.GROUP_CHEVRON });
  return e.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>', e;
}
function sh(e, t, r, n) {
  const s = e.id.replace(/^sec-/, ""), i = nv(s), o = ye("button", {
    className: c.GROUP_BUTTON + (t ? ` ${c.GROUP_BUTTON_COLLAPSIBLE}` : ""),
    attributes: {
      type: "button",
      "data-section-toggle": s,
      "data-uarps-trigger": i,
      ...t && { "aria-expanded": String(r) },
      ...t && { "aria-controls": `section-items-${s}` }
    }
  });
  o.appendChild(sv(n));
  const a = ye("span", { className: c.GROUP_TITLE, textContent: e.label || e.title || e.id });
  return o.appendChild(a), t && o.appendChild(iv()), o;
}
function ih(e, t, r) {
  var u, h, g;
  const n = e.label || e.title || e.id, s = ((u = e.uarps) == null ? void 0 : u.trigger_id) || nh(e.id), i = e.route || `#${e.id}`, o = ye("li", {
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
  l.innerHTML = Qu(e.icon || "file"), a.appendChild(l);
  const d = ye("span", { className: c.ITEM_TEXT, textContent: n });
  if (a.appendChild(d), r) {
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
function ov(e, t, r, n) {
  var h, g;
  const s = e.id.replace(/^sec-/, ""), i = ((h = e.accordion) == null ? void 0 : h.collapsible) !== !1, o = !i || t.has(s) || ((g = e.accordion) == null ? void 0 : g.default_open) === !0, a = e.icon || ui[s] || ui.default, l = ye("div", {
    className: c.SECTION + (i ? ` ${c.SECTION_COLLAPSIBLE}` : "") + (o ? ` ${c.SECTION_EXPANDED}` : ""),
    attributes: {
      "data-section-id": s,
      "data-collapsible": String(i),
      "data-source": "navigation-model-v1"
    }
  });
  e.label && l.appendChild(sh(e, i, o, a));
  const d = ye("ul", {
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
      d.appendChild(ih(m, S, m.badge));
    } catch (S) {
      Ar(`item:${m.id}`, S.message, n);
    }
  }), l.appendChild(d), l;
}
function av(e, t, r, n, s) {
  const i = e.collapsible !== !1, o = !i || r.has(e.id), a = e.icon || ui[e.id] || ui.default, l = ye("div", {
    className: c.SECTION + (i ? ` ${c.SECTION_COLLAPSIBLE}` : "") + (o ? ` ${c.SECTION_EXPANDED}` : ""),
    attributes: {
      "data-section-id": e.id,
      "data-collapsible": String(i),
      "data-source": "sidebar-registry"
    }
  });
  (e.label || e.title) && l.appendChild(sh(e, i, o, a));
  const u = ye("ul", {
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
        uarps: { trigger_id: nh(h.id) }
      };
      u.appendChild(ih(y, m, g));
    } catch (g) {
      Ar(`item:${h.id}`, g.message, s);
    }
  }), l.appendChild(u), l;
}
function lv(e, t, r, n) {
  const s = k.getModel();
  if (!s || !s.sections || s.sections.length === 0)
    return null;
  e.textContent = "";
  let i = 0;
  return s.sections.forEach((o) => {
    try {
      if (o.visible === !1) return;
      const l = (o.items || []).filter((u) => {
        var h;
        return ((h = u.state) == null ? void 0 : h.hidden) !== !0;
      });
      if (l.length === 0) return;
      const d = ov(o, t, r, n);
      e.appendChild(d), i += l.length;
    } catch (a) {
      Ar(`section:${o.id}`, a.message, n);
    }
  }), i === 0 ? null : (pr.modelLoaderRenders++, { success: !0, itemsRendered: i, source: "navigation-model-v1" });
}
function cv(e, t, r, n) {
  let s = [];
  try {
    s = w.getSections();
  } catch (o) {
    return Ar("registry", o.message, n), null;
  }
  if (!s || s.length === 0)
    return null;
  e.textContent = "";
  let i = 0;
  return s.forEach((o) => {
    try {
      const a = w.getItemsBySection(o.id);
      if (a.length === 0) return;
      const l = av(o, a, t, r, n);
      e.appendChild(l), i += a.length;
    } catch (a) {
      Ar(`section:${o.id}`, a.message, n);
    }
  }), i === 0 ? null : (pr.registryFallbacks++, { success: !0, itemsRendered: i, source: "sidebar-registry" });
}
function dv(e, t, r, n) {
  tv();
  try {
    const s = e == null ? void 0 : e.querySelector('[data-slot="nav-items"]');
    if (!s)
      return Ar("nav-slot", "Nav slot not found", n), { success: !1, error: "Nav slot not found" };
    let i = lv(s, t, r, n);
    return i || (console.info(`[${El}] Model not available, falling back to Registry`), i = cv(s, t, r, n)), i ? (pr.renders++, {
      success: !0,
      itemsRendered: i.itemsRendered,
      source: i.source,
      triggerPattern: "trigger:navigation:item-{id}"
    }) : (pr.fallbacks++, s.innerHTML = Ya, { success: !0, empty: !0, fallback: !0 });
  } catch (s) {
    pr.errors++, Ar("renderNavigation", s.message, n);
    const i = e == null ? void 0 : e.querySelector('[data-slot="nav-items"]');
    return i && (i.innerHTML = Ya), { success: !1, error: s.message, fallback: !0 };
  }
}
function uv(e) {
  try {
    return e ? (pr.fallbacks++, e.innerHTML = b_, e.querySelector(`.${c.ROOT}`)) : null;
  } catch {
    return pr.errors++, null;
  }
}
let qe = { updates: 0, errors: 0 };
function hv(e, t, r) {
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
    return qe.updates++, !0;
  } catch {
    return qe.errors++, !1;
  }
}
function fv(e, t) {
  try {
    if (!e) return !1;
    e.classList.toggle(c.MOD_COLLAPSED, t);
    const r = e.querySelector(`.${c.TOGGLE}`);
    return r == null || r.setAttribute("aria-expanded", String(!t)), r == null || r.setAttribute("aria-label", t ? "Expandir menu" : "Recolher menu"), qe.updates++, !0;
  } catch {
    return qe.errors++, !1;
  }
}
function gv(e, t) {
  try {
    return e ? (e.classList.toggle(c.MOD_MOBILE_OPEN, t), qe.updates++, !0) : !1;
  } catch {
    return qe.errors++, !1;
  }
}
function mv(e, t) {
  try {
    const r = e == null ? void 0 : e.querySelector(`.${c.ANNOUNCE}`);
    return r && (r.textContent = t), !0;
  } catch {
    return qe.errors++, !1;
  }
}
function pv(e, t) {
  if (!t) return e;
  const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return e.replace(r, '<mark class="highlight">$1</mark>');
}
function oh(e) {
  e.querySelectorAll(`.${c.ITEM_TEXT} mark`).forEach((t) => {
    const r = t.parentNode;
    r.replaceChild(document.createTextNode(t.textContent), t), r.normalize();
  });
}
function Ev(e, t, r) {
  var n;
  try {
    if (!e) return { visible: 0, hidden: 0 };
    const s = t.toLowerCase().trim();
    let i = 0, o = 0;
    oh(e), e.classList.toggle(c.MOD_SEARCHING, !!s), e.querySelectorAll(`.${c.ITEM}`).forEach((l) => {
      const d = l.querySelector(`.${c.ITEM_TEXT}`), u = (d == null ? void 0 : d.textContent) || "", h = u.toLowerCase(), g = !s || h.includes(s);
      l.style.display = g ? "" : "none", l.classList.toggle(c.ITEM_MATCH, g && !!s), g && s && d && (d.innerHTML = pv(u, s)), g ? i++ : o++;
    }), s && e.querySelectorAll("[data-section-id]").forEach((l) => {
      const d = l.getAttribute("data-section-id");
      r == null || r.add(d), l.classList.add(c.SECTION_EXPANDED);
      const u = l.querySelector(`.${c.SECTION_ITEMS}`);
      u && (u.style.height = "");
    });
    let a = e.querySelector(`.${c.SEARCH_EMPTY}`);
    return s && i === 0 ? (a || (a = document.createElement("div"), a.className = c.SEARCH_EMPTY, a.innerHTML = `<span class="${c.SEARCH_EMPTY_ICON}">🔍</span><span class="${c.SEARCH_EMPTY_TEXT}">Nenhum resultado encontrado</span>`, (n = e.querySelector(`.${c.NAV_CONTENT}`)) == null || n.appendChild(a)), a.style.display = "") : a && (a.style.display = "none"), qe.updates++, { visible: i, hidden: o };
  } catch {
    return qe.errors++, { visible: 0, hidden: 0 };
  }
}
function bv(e, t) {
  try {
    if (!e) return !1;
    oh(e), e.classList.remove(c.MOD_SEARCHING), e.querySelectorAll(`.${c.ITEM}`).forEach((s) => {
      s.style.display = "", s.classList.remove(c.ITEM_MATCH);
    });
    const r = e.querySelector(`.${c.SEARCH_EMPTY}`);
    r && (r.style.display = "none");
    const n = e.querySelector(`.${c.SEARCH_INPUT}`);
    return n && (n.value = ""), qe.updates++, !0;
  } catch {
    return qe.errors++, !1;
  }
}
const ah = "5.5.0-ENTERPRISE-FULL", lh = "sidebar-ui-health";
function _v(e) {
  return function() {
    const { container: r, sidebar: n, initialized: s, activeItemId: i, mobileOpen: o, expandedSections: a, degradedComponents: l, lastError: d, sectionClickHandler: u } = e(), h = !!r, g = !!n, m = h && document.contains(r), y = g && document.contains(n), S = (n == null ? void 0 : n.querySelector("[data-fallback]")) !== null, x = !!u, Ae = { hasContainer: h, hasSidebar: g, containerInDOM: m, sidebarInDOM: y, noFallback: !S, noDegradedComponents: l.length === 0, accordionHandlersSet: x }, Me = Object.values(Ae).filter(Boolean).length, _ = Object.keys(Ae).length;
    let A = "HEALTHY";
    return !h || !g ? A = "UNHEALTHY" : (!m || !y || l.length > 0 || S) && (A = "DEGRADED"), { status: A, score: Me, maxScore: _, scoreDisplay: `${Me}/${_}`, checks: Ae, initialized: s, activeItemId: i, mobileOpen: o, expandedSectionsCount: a.size, expandedSections: Array.from(a), degradedComponents: l, lastError: d, capabilities: Tu, compliance: "AAA", noBodyAppend: !0, version: ah, moduleId: lh, timestamp: Date.now() };
  };
}
function yv(e, t) {
  return function() {
    const { activeItemId: n, mobileOpen: s, expandedSections: i, degradedComponents: o, status: a } = e();
    return { version: ah, moduleId: lh, status: a, activeItemId: n, mobileOpen: s, expandedSections: Array.from(i), degradedComponents: o, capabilities: Tu, healthCheck: t() };
  };
}
let Pt = { skeletonShows: 0, skeletonHides: 0, rippleSetups: 0, loadingChanges: 0, errors: 0 };
function Fd(e = !1) {
  const t = document.createElement("div");
  return t.className = c.SKELETON_ITEM, t.innerHTML = `<div class="${c.SKELETON_ICON}"></div><div class="${c.SKELETON_TEXT}${e ? ` ${c.SKELETON_TEXT_SHORT}` : ""}"></div>`, t;
}
function Gd() {
  const e = document.createElement("div");
  return e.className = c.SKELETON_GROUP, e.innerHTML = `<div class="${c.SKELETON_ICON}"></div><div class="${c.SKELETON_TEXT}"></div>`, e;
}
function vv(e, t = 8) {
  try {
    if (!e) return !1;
    const r = e.querySelector(`.${c.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!r) return !1;
    r.dataset.originalContent = r.innerHTML;
    const n = document.createElement("div");
    n.className = c.SKELETON, n.setAttribute("aria-hidden", "true"), n.setAttribute("role", "presentation"), n.appendChild(Gd());
    for (let s = 0; s < 3; s++) n.appendChild(Fd(s === 2));
    n.appendChild(Gd());
    for (let s = 0; s < Math.min(t - 3, 5); s++) n.appendChild(Fd(s === 4));
    return r.innerHTML = "", r.appendChild(n), e.classList.add(c.MOD_LOADING_SKELETON), Pt.skeletonShows++, !0;
  } catch {
    return Pt.errors++, !1;
  }
}
function Iv(e) {
  try {
    if (!e) return !1;
    const t = e.querySelector(`.${c.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!t) return !1;
    t.dataset.originalContent && (t.innerHTML = t.dataset.originalContent, delete t.dataset.originalContent);
    const r = t.querySelector(`.${c.SKELETON}`);
    return r && r.remove(), e.classList.remove(c.MOD_LOADING_SKELETON), Pt.skeletonHides++, !0;
  } catch {
    return Pt.errors++, !1;
  }
}
function Vd(e) {
  const t = e.currentTarget;
  t.querySelectorAll(`.${c.RIPPLE}`).forEach((a) => a.remove());
  const r = document.createElement("span");
  r.className = c.RIPPLE;
  const n = t.getBoundingClientRect(), s = Math.max(n.width, n.height), i = e.clientX - n.left - s / 2, o = e.clientY - n.top - s / 2;
  r.style.width = r.style.height = `${s}px`, r.style.left = `${i}px`, r.style.top = `${o}px`, t.appendChild(r), r.addEventListener("animationend", () => r.remove());
}
function Sv(e) {
  try {
    if (!e) return null;
    const t = e.querySelectorAll(`.${c.LINK}`);
    return t.forEach((r) => r.addEventListener("click", Vd)), Pt.rippleSetups++, () => {
      t.forEach((r) => r.removeEventListener("click", Vd));
    };
  } catch {
    return Pt.errors++, null;
  }
}
function Cv(e, t) {
  try {
    return e ? (e.classList.toggle(c.MOD_LOADING, t), Pt.loadingChanges++, !0) : !1;
  } catch {
    return Pt.errors++, !1;
  }
}
const mi = v({ moduleId: Ou });
let ka = { instancesCreated: 0, activeInstances: 0 }, Za = null;
function Av() {
  mi.init();
}
function Mv(e) {
  return mi.get(e);
}
function wl(e, t, r) {
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
function ch(e, t, r) {
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
function Ov(e, t, r) {
  return r != null && r.has(t) ? ch(e, t, r) : wl(e, t, r);
}
function Tv(e, t, r) {
  try {
    return r == null || r.clear(), t == null || t.forEach((n) => {
      wl(e, n, r);
    }), !0;
  } catch {
    return !1;
  }
}
function Dv(e, t) {
  try {
    return t == null || t.clear(), Array.isArray(e) && e.forEach((r) => {
      t == null || t.add(r);
    }), !0;
  } catch {
    return !1;
  }
}
function Lv(e, t, r) {
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
function qd(e, t) {
  e && t && e.removeEventListener("click", t);
}
class $v {
  constructor(t = {}) {
    this._container = null, this._sidebar = null, this._options = t, this._activeItemId = null, this._mobileOpen = !1, this._status = "healthy", this._lastError = null, this._degradedComponents = [], this._initialized = !1, this._metrics = { renders: 0, errors: 0 }, this._expandedSections = /* @__PURE__ */ new Set(), this._sectionClickHandler = null, this._rippleCleanup = null, this._itemsChangedCallback = null, ka.instancesCreated++, ka.activeInstances++;
  }
  get status() {
    return this._status;
  }
  init() {
    try {
      return Av(), this._initialized = !0, this._status = "healthy", this._navIconsHandler = () => {
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
      const n = Mv("eventBus");
      n != null && n.emit && n.emit(f.DEGRADED, {
        source: Ou,
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
      if (typeof Ud == "function") {
        const t = Ud({ title: this._options.title || "DshowDash" });
        this._container.textContent = "", this._container.appendChild(t), this._sidebar = t;
      } else {
        const t = Zy({ title: this._options.title || "DshowDash" });
        this._container.innerHTML = t, this._sidebar = this._container.querySelector(`.${c.ROOT}`);
      }
      return this._sidebar ? (this.renderNavigation(), this._setupRipple(), this._metrics.renders++, this._status = this._degradedComponents.length > 0 ? "degraded" : "healthy", { success: !0 }) : (this._emitDegraded("sidebar", "Sidebar element not created"), { success: !1, error: "Sidebar element not created" });
    } catch (t) {
      return this._metrics.errors++, this._emitDegraded("render", t.message), this._renderFallback(), { success: !1, error: t.message, fallback: !0 };
    }
  }
  renderNavigation() {
    const t = dv(this._sidebar, this._expandedSections, this._activeItemId, this._degradedComponents);
    return (t.success || t.fallback) && this._setupRipple(), t;
  }
  _renderFallback() {
    this._sidebar = uv(this._container);
  }
  _setupAccordionHandlers() {
    const t = this;
    this._sectionClickHandler && qd(this._sidebar, this._sectionClickHandler), this._sectionClickHandler = Lv(this._sidebar, this._expandedSections, (r) => t.toggleSectionUI(r));
  }
  toggleSectionUI(t) {
    return Ov(this._sidebar, t, this._expandedSections);
  }
  expandSectionUI(t) {
    return wl(this._sidebar, t, this._expandedSections);
  }
  collapseSectionUI(t) {
    return ch(this._sidebar, t, this._expandedSections);
  }
  syncExpandedSections(t) {
    return Tv(this._sidebar, t, this._expandedSections);
  }
  preloadExpandedSections(t) {
    return Dv(t, this._expandedSections);
  }
  setActiveItem(t) {
    return this._activeItemId = t, hv(this._sidebar, t, this._expandedSections);
  }
  setCollapsed(t) {
    return fv(this._sidebar, t);
  }
  setMobileOpen(t) {
    return this._mobileOpen = t, gv(this._sidebar, t);
  }
  announce(t) {
    return mv(this._sidebar, t);
  }
  filterItems(t) {
    const r = Ev(this._sidebar, t, this._expandedSections);
    return this._setupRipple(), r;
  }
  clearSearch() {
    return bv(this._sidebar, this._expandedSections);
  }
  showSkeleton(t = 8) {
    return vv(this._sidebar, t);
  }
  hideSkeleton() {
    const t = Iv(this._sidebar);
    return t && this.renderNavigation(), t;
  }
  setLoading(t) {
    return Cv(this._sidebar, t);
  }
  _setupRipple() {
    this._rippleCleanup && this._rippleCleanup(), this._rippleCleanup = Sv(this._sidebar);
  }
  showOverlay() {
    return Qy();
  }
  hideOverlay() {
    return ev();
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
      return this._sectionClickHandler && (qd(this._sidebar, this._sectionClickHandler), this._sectionClickHandler = null), this._rippleCleanup && (this._rippleCleanup(), this._rippleCleanup = null), this._navIconsHandler && (window.removeEventListener("navigation:icons:updated", this._navIconsHandler), this._navIconsHandler = null), this._navItemsChangedHandler && (window.removeEventListener("navigation:items:changed", this._navItemsChangedHandler), this._navItemsChangedHandler = null), this._container && (this._container.textContent = ""), this._sidebar = null, this._container = null, this._initialized = !1, this.reset(), ka.activeInstances--, Za === this && (Za = null), { success: !0 };
    } catch (t) {
      return { success: !1, error: t.message };
    }
  }
  healthCheck() {
    const t = this;
    return _v(() => ({
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
      portsInitialized: mi.isInitialized()
    }))();
  }
  info() {
    const t = this;
    return yv(() => ({
      activeItemId: t._activeItemId,
      mobileOpen: t._mobileOpen,
      expandedSections: t._expandedSections,
      degradedComponents: t._degradedComponents,
      status: t._status,
      metrics: t._metrics,
      portsInitialized: mi.isInitialized(),
      features: { skeleton: !0, ripple: !!t._rippleCleanup, loading: !0 }
    }), () => t.healthCheck())();
  }
}
function kv(e) {
  const t = new $v(e);
  return t.init(), Za = t, t;
}
function wv(e) {
  e === void 0 && (e = {});
  const t = e.logger;
  e.tracker;
  const r = e.metricsManager;
  return {
    async execute(n, s) {
      var i, o, a, l, d, u;
      n === void 0 && (n = {}), r.incrementInits(), pl("initializing");
      try {
        t.info("Initializing Sidebar V6.9 ES6..."), await C_() || _e("css", "CSS failed to load");
        try {
          await kl();
        } catch (m) {
          _e("config", m.message);
        }
        const g = $y(n);
        s.config = g, s.safeMode = g.safeMode === !0 || n.safeMode === !0, s.safeMode && (r.incrementSafeModeBoots(), t.info("SafeMode ACTIVE - minimal boot")), s.adapters = qy({ containerSelector: g.containerSelector }), s.ports = Yy(s.adapters);
        try {
          s.engine = hy({
            defaultCollapsed: ((i = g.settings) == null ? void 0 : i.defaultCollapsed) ?? !1,
            accordion: g.accordion ?? { allowMultipleOpen: !0, persistState: !0 }
          }), s.engine.setPorts(s.ports), await s.engine.init();
        } catch (m) {
          return r.incrementErrors(), Zs(m, { phase: "engine-init" }), { success: !1, error: m.message };
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
          await S_(
            () => w.loadFromAPI(),
            Ua.maxRetries,
            Ua.retryDelay
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
          s.renderer = kv({ title: (l = g.header) == null ? void 0 : l.title });
        } catch (m) {
          return r.incrementErrors(), Zs(m, { phase: "renderer-create" }), { success: !1, error: m.message };
        }
        try {
          const m = (u = (d = s.adapters.ui).getContainer) == null ? void 0 : u.call(d);
          if (!m) throw new Error("Container not found");
          s.renderer.setContainer(m);
          const y = s.engine.getExpandedSections();
          y && y.length > 0 && (s.renderer.preloadExpandedSections(y), t.info(`Accordion state preloaded from engine: ${y.length} sections`, {
            sectionIds: y
          })), s.renderer.render();
        } catch (m) {
          return r.incrementErrors(), Zs(m, { phase: "render" }), { success: !1, error: m.message };
        }
        return { success: !0, config: g };
      } catch (h) {
        return r.incrementErrors(), Zs(h, { phase: "init" }), t.error("Init failed:", h), { success: !1, error: h.message };
      }
    }
  };
}
function Nv(e) {
  const { engine: t, renderer: r, logger: n, getPort: s } = e, i = s("layoutManager");
  let o = !1, a = "default";
  i && typeof i.isSidebarCollapsed == "function" ? (o = i.isSidebarCollapsed(), a = "LayoutManager", n.info("Collapsed state from LayoutManager", { collapsed: o })) : (o = document.body.classList.contains("sidebar-collapsed"), a = "body-class", n.warn("LayoutManager not available, using body class as fallback", { collapsed: o })), o ? t.collapse() : t.expand(), r.setCollapsed(o);
  const l = r.getSidebar();
  if (l) {
    l.classList.toggle(c.MOD_COLLAPSED, o);
    const u = l.querySelector(`.${c.TOGGLE}`);
    u && (u.setAttribute("aria-expanded", String(!o)), u.setAttribute("aria-label", o ? "Expandir menu" : "Recolher menu"));
  }
  const d = document.body.classList.contains("sidebar-collapsed");
  return d !== o && i && typeof i.setSidebarCollapsed == "function" && (n.warn("Body class mismatch, requesting LayoutManager sync", {
    bodyHasClass: d,
    shouldBeCollapsed: o
  }), i.setSidebarCollapsed(o)), n.info("Initial state synced (LayoutManager-Driven)", {
    shouldBeCollapsed: o,
    source: a,
    bodyClassMatch: document.body.classList.contains("sidebar-collapsed") === o
  }), { shouldBeCollapsed: o, source: a };
}
let xn = null, wa = 0;
function Rv(e) {
  const { engine: t, renderer: r, tracker: n, logger: s, getPort: i } = e, o = i("eventBus");
  if (!o)
    return s.warn("EventBus not available for layout listener"), null;
  xn && (xn(), xn = null), wa = 0;
  const a = (h) => {
    if (t.collapsed === h) return;
    wa++, s.info("External collapse change received", { collapsed: h }), h ? t.collapse() : t.expand(), r.setCollapsed(h);
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
  }, d = o.on(Xs.REQUEST, l), u = o.on(Xs.SIDEBAR_CHANGED, l);
  return s.info("Layout listener connected (bidirectional sync)"), xn = () => {
    typeof d == "function" ? d() : o.off && o.off(Xs.REQUEST, l), typeof u == "function" ? u() : o.off && o.off(Xs.SIDEBAR_CHANGED, l);
  }, {
    cleanup: xn,
    getExternalCollapseCount: () => wa
  };
}
const Li = "6.1.0-ES6", as = "sidebar-keyboard-navigation";
let Mr = { keystrokes: 0, shortcuts: 0, navigations: 0, errors: 0 }, cn = [], ls = -1;
const mt = v({ moduleId: as });
function dh() {
  mt.init();
}
function Ja(e) {
  return mt.get(e);
}
function uh(e) {
  return mt.inject(e);
}
function hh() {
  return mt.snapshot();
}
function xv(e) {
  return Array.from(e.querySelectorAll(`.${c.LINK}:not([aria-disabled="true"])`));
}
function Xr(e, t) {
  t < 0 || t >= e.length || (e[t] && e[t].focus(), ls = t, Mr.navigations++);
}
function fh(e) {
  e && mt.inject({ eventBus: e }), dh();
  const t = Ja("eventBus");
  t && t.emit && t.emit(f.KEYBOARD_INITIALIZED);
}
function Nl(e) {
  const { container: t, eventBus: r, onNavigate: n, onToggleSection: s } = e || {};
  if (!t) return () => {
  };
  r && mt.inject({ eventBus: r }), dh();
  const i = (a) => {
    Mr.keystrokes++;
    try {
      const l = xv(t), d = document.activeElement;
      let u = l.indexOf(d);
      switch (u === -1 && (u = ls), a.key) {
        case "ArrowDown":
          a.preventDefault(), Xr(l, Math.min(u + 1, l.length - 1));
          break;
        case "ArrowUp":
          a.preventDefault(), Xr(l, Math.max(u - 1, 0));
          break;
        case "Home":
          a.preventDefault(), Xr(l, 0);
          break;
        case "End":
          a.preventDefault(), Xr(l, l.length - 1);
          break;
        case "PageDown":
          a.preventDefault(), Xr(l, Math.min(u + 5, l.length - 1));
          break;
        case "PageUp":
          a.preventDefault(), Xr(l, Math.max(u - 5, 0));
          break;
        case "Enter":
        case " ":
          if (d && d.classList.contains(c.LINK)) {
            const h = d.closest(`.${c.ITEM}`), g = h ? h.dataset.itemId : null;
            g && (a.preventDefault(), n && n(g), d.click());
          } else if (d && d.classList.contains(c.GROUP_BUTTON)) {
            const h = d.closest(`.${c.SECTION}`), g = h ? h.dataset.sectionId : null;
            g && (a.preventDefault(), s && s(g));
          }
          break;
        case "ArrowRight":
          if (d) {
            const h = d.closest(`.${c.SECTION}`);
            if (h && h.classList.contains(c.SECTION_COLLAPSIBLE) && !h.classList.contains(c.SECTION_EXPANDED)) {
              a.preventDefault();
              const g = h.dataset.sectionId;
              s && s(g);
            }
          }
          break;
        case "ArrowLeft":
          if (d) {
            const h = d.closest(`.${c.SECTION}`);
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
      Mr.errors++;
    }
  };
  t.addEventListener("keydown", i), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1");
  const o = () => t.removeEventListener("keydown", i);
  return cn.push(o), o;
}
function Rl(e) {
  const { eventBus: t, shortcut: r = "b", modifier: n = "ctrl", onToggle: s } = e || {}, i = (a) => {
    if ((n === "ctrl" ? a.ctrlKey : n === "alt" ? a.altKey : n === "meta" ? a.metaKey : n === "shift" ? a.shiftKey : !1) && a.key.toLowerCase() === r.toLowerCase())
      if (a.preventDefault(), Mr.shortcuts++, s)
        s();
      else {
        const d = Ja("sidebar");
        if (d && d.toggle)
          d.toggle();
        else {
          const u = Ja("eventBus");
          u && u.emit && u.emit(f.TOGGLE, { source: "keyboard-shortcut" });
        }
      }
  };
  document.addEventListener("keydown", i);
  const o = () => document.removeEventListener("keydown", i);
  return cn.push(o), o;
}
function xl() {
  cn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), cn = [], ls = -1;
}
function $i() {
  return { ...Mr };
}
function gh() {
  return { moduleId: as, version: Li, focusedIndex: ls, cleanupCount: cn.length, metrics: $i(), portsInitialized: mt.isInitialized() };
}
function mh() {
  return { status: Mr.errors === 0 ? "HEALTHY" : "DEGRADED", version: Li, moduleId: as, checks: { noErrors: Mr.errors === 0, cleanupCount: cn.length, focusedIndex: ls, portsInitialized: mt.isInitialized() }, portsInitialized: mt.isInitialized(), metrics: $i() };
}
var Pv = { init: fh, setupKeyboardNavigation: Nl, setupGlobalShortcut: Rl, destroy: xl, injectPorts: uh, getPorts: hh, getMetrics: $i, info: gh, healthCheck: mh, VERSION: Li, MODULE_ID: as };
const Hv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: as,
  VERSION: Li,
  default: Pv,
  destroy: xl,
  getMetrics: $i,
  getPorts: hh,
  healthCheck: mh,
  info: gh,
  init: fh,
  injectPorts: uh,
  setupGlobalShortcut: Rl,
  setupKeyboardNavigation: Nl
}, Symbol.toStringTag, { value: "Module" })), ki = "6.1.0-ES6", cs = "sidebar-mobile-handler";
let nt = !1, ve = !1, ot = [], ir = { toggles: 0, detects: 0, overlayClicks: 0, swipes: 0, errors: 0 };
const zv = 50, Bv = 0.3, pt = v({ moduleId: cs });
function ph() {
  pt.init();
}
function wi(e) {
  return pt.get(e);
}
function Eh(e) {
  return pt.inject(e);
}
function bh() {
  return pt.snapshot();
}
function _h(e, t) {
  e && pt.inject({ eventBus: e }), ph();
  const r = wi("eventBus");
  r && r.emit && r.emit(f.MOBILE_HANDLER_INITIALIZED);
}
function Pl(e) {
  const { container: t, eventBus: r, breakpoint: n = 768 } = e || {};
  r && pt.inject({ eventBus: r }), ph();
  const s = () => {
    const i = nt;
    if (nt = window.innerWidth < n, ir.detects++, i !== nt) {
      const o = wi("eventBus");
      o && o.emit && o.emit(f.MOBILE_CHANGED, { isMobile: nt }), nt ? (t && t.classList.add(c.MOD_MOBILE), document.body.classList.add("has-mobile-sidebar")) : (t && t.classList.remove(c.MOD_MOBILE, c.MOD_MOBILE_OPEN), document.body.classList.remove("has-mobile-sidebar", "sidebar-mobile-open"), ve = !1);
    }
  };
  return s(), window.addEventListener("resize", s), ot.push(() => window.removeEventListener("resize", s)), () => ds();
}
function Hl(e) {
  return Pl(e);
}
function yh(e) {
  const { container: t, eventBus: r, onOpen: n, onClose: s } = e || {};
  if (!t) return () => {
  };
  let i = 0, o = 0, a = 0, l = !1;
  const d = (y) => {
    i = y.touches[0].clientX, o = y.touches[0].clientY, a = Date.now(), l = !1;
  }, u = (y) => {
    if (!i) return;
    const S = y.touches[0].clientX - i, x = y.touches[0].clientY - o;
    Math.abs(S) > Math.abs(x) && Math.abs(S) > 10 && (l = !0);
  }, h = (y) => {
    if (!l) return;
    const x = y.changedTouches[0].clientX - i, Ae = Date.now() - a, Me = Math.abs(x) / Ae;
    (Math.abs(x) > zv || Me > Bv) && (ir.swipes++, x > 0 && !ve ? Uv(t, n) : x < 0 && ve && vh(t, s)), i = 0, o = 0, l = !1;
  }, g = 20, m = (y) => {
    y.touches[0].clientX < g && !ve && d(y);
  };
  return document.addEventListener("touchstart", m, { passive: !0 }), t.addEventListener("touchstart", d, { passive: !0 }), t.addEventListener("touchmove", u, { passive: !0 }), t.addEventListener("touchend", h, { passive: !0 }), ot.push(() => document.removeEventListener("touchstart", m)), ot.push(() => t.removeEventListener("touchstart", d)), ot.push(() => t.removeEventListener("touchmove", u)), ot.push(() => t.removeEventListener("touchend", h)), () => ds();
}
function zl(e) {
  const { container: t, eventBus: r, onClose: n } = e || {};
  let s = document.querySelector(".dsd-sidebar-overlay");
  s || (s = document.createElement("div"), s.className = "dsd-sidebar-overlay", s.setAttribute("aria-hidden", "true"), document.body.appendChild(s));
  const i = () => {
    ir.overlayClicks++, vh(t, n);
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
function Uv(e, t) {
  ve = !0, ir.toggles++, e && e.classList.add(c.MOD_MOBILE_OPEN), document.body.classList.add("sidebar-mobile-open");
  const r = document.querySelector(".dsd-sidebar-overlay");
  r && r.classList.add("dsd-sidebar-overlay--visible");
  const n = wi("eventBus");
  n && n.emit && n.emit(f.MOBILE_OPENED, { source: "swipe" }), t && t();
}
function vh(e, t) {
  ve = !1, ir.toggles++, e && e.classList.remove(c.MOD_MOBILE_OPEN), document.body.classList.remove("sidebar-mobile-open");
  const r = document.querySelector(".dsd-sidebar-overlay");
  r && r.classList.remove("dsd-sidebar-overlay--visible");
  const n = wi("eventBus");
  n && n.emit && n.emit(f.MOBILE_CLOSED, { source: "swipe" }), t && t();
}
function Ih(e) {
  return ve = e ?? !ve, ir.toggles++, ve;
}
function Sh() {
  return nt;
}
function Ch() {
  return ve;
}
function Ni() {
  return { ...ir };
}
function ds() {
  ot.forEach((t) => {
    try {
      t();
    } catch {
    }
  }), ot = [], nt = !1, ve = !1;
  const e = document.querySelector(".dsd-sidebar-overlay");
  e && e.remove();
}
function Ah() {
  return { moduleId: cs, version: ki, isMobile: nt, isOpen: ve, cleanups: ot.length, metrics: Ni(), portsInitialized: pt.isInitialized() };
}
function Mh() {
  return { status: "HEALTHY", version: ki, moduleId: cs, checks: { isMobile: nt, isOpen: ve, noErrors: ir.errors === 0, noOrphanListeners: !0, portsInitialized: pt.isInitialized() }, portsInitialized: pt.isInitialized(), metrics: Ni() };
}
var jv = { init: _h, setupMobileHandler: Pl, setupMobileDetect: Hl, setupSwipeGestures: yh, setupOverlayClick: zl, toggleMobile: Ih, isMobile: Sh, isOpen: Ch, destroy: ds, injectPorts: Eh, getPorts: bh, getMetrics: Ni, info: Ah, healthCheck: Mh, VERSION: ki, MODULE_ID: cs };
const Fv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: cs,
  VERSION: ki,
  default: jv,
  destroy: ds,
  getMetrics: Ni,
  getPorts: bh,
  healthCheck: Mh,
  info: Ah,
  init: _h,
  injectPorts: Eh,
  isMobile: Sh,
  isOpen: Ch,
  setupMobileDetect: Hl,
  setupMobileHandler: Pl,
  setupOverlayClick: zl,
  setupSwipeGestures: yh,
  toggleMobile: Ih
}, Symbol.toStringTag, { value: "Module" }));
function Gv(e) {
  e === void 0 && (e = {});
  const t = e.logger, r = e.tracker, n = e.getPort, s = e.emitDegraded;
  let i = null, o = [];
  return {
    setupCore(a) {
      const l = a.engine, d = a.renderer, u = a.registry, h = a.adapters, g = a.onToggle, m = a.onSetActiveItem, y = a.onToggleSection;
      try {
        Nv({
          engine: l,
          renderer: d,
          logger: t,
          getPort: n
        });
      } catch (S) {
        s("restore-state", S.message);
      }
      try {
        i = Rv({
          engine: l,
          renderer: d,
          tracker: r,
          logger: t,
          getPort: n
        }), i && i.cleanup && o.push(i.cleanup);
      } catch (S) {
        s("layout-listener", S.message);
      }
      try {
        const S = d.getSidebar();
        S && Sl(S, {
          registry: u,
          routerAdapter: h.router,
          engine: l,
          renderer: d,
          onToggle: g,
          onSetActiveItem: m,
          onToggleSection: y
        });
      } catch (S) {
        s("setup-events", S.message);
      }
    },
    setupPostReady(a) {
      const l = a.engine, d = a.renderer, u = a.registry, h = a.adapters, g = a.onToggle, m = a.onSetActiveItem, y = a.onExpandSection, S = a.onCollapseSection, x = a.onCloseMobile, Ae = a.onReloadNavigation, Me = d.getSidebar();
      try {
        if (Me) {
          const _ = Nl(Me, {
            onExpandSection: y,
            onCollapseSection: S
          });
          o.push(_);
          const A = Rl(g);
          o.push(A);
        }
      } catch (_) {
        s("keyboard-nav", _.message);
      }
      try {
        const _ = Hl({
          onMobileChange(le) {
            l.setMobile(le);
          },
          onCloseMobile: x
        });
        o.push(_);
        const A = zl(x);
        o.push(A);
      } catch (_) {
        s("mobile-detect", _.message);
      }
      try {
        const _ = Cl({
          routerAdapter: h.router,
          registry: u,
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
function Vv(e) {
  e === void 0 && (e = {});
  const t = e.logger;
  return {
    execute(r, n) {
      try {
        return n && n.cleanup(), xl(), ds(), Ml(), Xn(), r.engine && (r.engine.destroy(), r.engine = null), r.renderer && (r.renderer.destroy(), r.renderer = null), r.adapters && r.adapters.router && r.adapters.router.destroy && r.adapters.router.destroy(), k.abort && k.abort(), E_(), r.initialized = !1, r.initAt = null, r.safeMode = !1, r.modelLoaderInitialized = !1, pl("destroyed"), t.info("Sidebar destroyed"), { success: !0 };
      } catch (s) {
        return t.error("Destroy error:", s), { success: !1, error: s.message };
      }
    }
  };
}
function qv() {
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
function Yv(e = {}) {
  const t = e.getContext, r = e.metricsManager, n = e.setupCoordinator, s = e.portsManager;
  return {
    healthCheck() {
      var u, h;
      const i = t(), o = {
        initialized: i.initialized,
        engineReady: !!i.engine,
        rendererReady: !!i.renderer,
        registryLoaded: ((u = w.getItems()) == null ? void 0 : u.length) > 0,
        portsInitialized: s.isInitialized(),
        layoutListenerConnected: !!n.getLayoutListener(),
        modelLoaderInitialized: i.modelLoaderInitialized
      }, a = Object.values(o).filter(Boolean).length, l = Object.keys(o).length;
      let d = "HEALTHY";
      return a < l && a >= Math.floor(l * 0.6) && (d = "DEGRADED"), a < Math.floor(l * 0.6) && (d = "UNHEALTHY"), {
        status: d,
        score: { passed: a, total: l, percentage: Math.round(a / l * 100) },
        checks: o,
        issues: Mu().map((g) => ({
          code: g,
          severity: "warn",
          message: `Component degraded: ${g}`
        })),
        moduleId: oe,
        version: fr,
        safeMode: i.safeMode,
        metrics: this.getMetrics(),
        ports: { initialized: s.isInitialized(), missing: [] },
        modelLoaderHealth: ((h = k.healthCheck) == null ? void 0 : h.call(k)) ?? { healthy: !1 },
        timestamp: Date.now()
      };
    },
    info() {
      var a, l, d, u;
      const i = t(), o = ((a = k.info) == null ? void 0 : a.call(k)) ?? {};
      return {
        moduleId: oe,
        version: fr,
        initialized: i.initialized,
        status: qa(),
        safeMode: i.safeMode,
        collapsed: ((l = i.engine) == null ? void 0 : l.collapsed) || !1,
        expandedSections: ((u = (d = i.engine) == null ? void 0 : d.getExpandedSections) == null ? void 0 : u.call(d)) ?? [],
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
      var d, u, h, g;
      const i = t(), o = ((d = w.getSections) == null ? void 0 : d.call(w)) || [], a = ((u = w.getItems) == null ? void 0 : u.call(w)) || [], l = ((h = k.info) == null ? void 0 : h.call(k)) ?? {};
      return {
        registryId: oe,
        version: fr,
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
      var u, h, g, m, y, S, x, Ae, Me, _;
      const i = t(), o = n.getLayoutListener(), a = ((u = o == null ? void 0 : o.getExternalCollapseCount) == null ? void 0 : u.call(o)) || r.get("externalCollapses"), l = ((h = k.info) == null ? void 0 : h.call(k)) ?? {}, d = r.getAll();
      return Object.assign({}, d, {
        externalCollapses: a,
        status: qa(),
        initialized: i.initialized,
        safeMode: i.safeMode,
        sectionsCount: ((m = (g = w.getSections) == null ? void 0 : g.call(w)) == null ? void 0 : m.length) || 0,
        itemsCount: ((S = (y = w.getItems) == null ? void 0 : y.call(w)) == null ? void 0 : S.length) || 0,
        expandedSections: ((Me = (Ae = (x = i.engine) == null ? void 0 : x.getExpandedSections) == null ? void 0 : Ae.call(x)) == null ? void 0 : Me.length) || 0,
        collapsed: ((_ = i.engine) == null ? void 0 : _.collapsed) || !1,
        toggleMetrics: Zu(),
        portsInitialized: s.isInitialized(),
        modelLoaderInitialized: i.modelLoaderInitialized,
        // @ts-expect-error strict migration — TS2339
        modelLoaderSource: l.source || "none"
      });
    }
  };
}
const ti = "6.5.1-IMPORT-FIX", Bl = v({ moduleId: oe });
function Kv() {
  Bl.init();
}
function pi(e) {
  return Bl.get(e);
}
function Wv() {
  return pi("eventBus") || pi("eventBusGlobal");
}
function Xv() {
  const e = pi("routerGlobal");
  if (e && e.getCurrentRoute)
    try {
      const t = e.getCurrentRoute();
      if (t && (t.hash || t.path)) return t.hash || t.path;
    } catch {
    }
  return typeof window < "u" && window.location && window.location.hash || "#/";
}
class Zv {
  constructor() {
    this._logger = py({ debug: !1 }), this._tracker = _y({ enabled: !0 }), this._keyboardNavEnabled = zb.enabled, this._context = {
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
    }, this._metricsManager = qv(), this._setupCoordinator = Gv({
      logger: this._logger,
      tracker: this._tracker,
      getPort: pi,
      emitDegraded: _e
    }), this._initializer = wv({
      logger: this._logger,
      tracker: this._tracker,
      metricsManager: this._metricsManager
    }), this._destroyer = Vv({
      logger: this._logger
    }), this._healthReporter = Yv({
      getContext: () => this._context,
      metricsManager: this._metricsManager,
      setupCoordinator: this._setupCoordinator,
      portsManager: Bl
    }), p_(this._logger, this._tracker), bl(this._logger, this._tracker), this._logger, Kv();
  }
  get status() {
    return qa();
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
    const n = Mu();
    return pl(n.length > 0 ? "degraded" : "healthy"), this._emitReadyEvent(), this._logger.info(`Sidebar V6.5 ES6 initialized (${this.status})`, {
      version: ti,
      safeMode: this._context.safeMode,
      degradedComponents: n,
      modelLoaderInitialized: this._context.modelLoaderInitialized
    }), this._tracker.track("initialized", {
      version: ti,
      status: this.status,
      safeMode: this._context.safeMode
    }), { success: !0, version: ti, status: this.status, safeMode: this._context.safeMode };
  }
  _emitReadyEvent() {
    const t = Wv();
    t && t.emit && (t.emit(f.READY, {
      version: ti,
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
    return dy({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: w,
      adapters: this._context.adapters,
      logger: this._logger,
      metrics: this._metricsManager.getAll(),
      modelLoaderInitialized: this._context.modelLoaderInitialized,
      getCurrentHash: Xv
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
    }, n = Ly(r);
    this.toggle = () => (t._metricsManager.incrementToggles(), n.toggle.call(t)), this.collapse = n.collapse.bind(this), this.expand = n.expand.bind(this), this.forceSync = (s = n.forceSync) == null ? void 0 : s.bind(this), this.getToggleMetrics = (i = n.getToggleMetrics) == null ? void 0 : i.bind(this), this.toggleSection = n.toggleSection.bind(this), this.expandSection = n.expandSection.bind(this), this.collapseSection = n.collapseSection.bind(this), this.expandAllSections = n.expandAllSections.bind(this), this.collapseAllSections = n.collapseAllSections.bind(this), this.isSectionExpanded = n.isSectionExpanded.bind(this), this.getExpandedSections = n.getExpandedSections.bind(this), this.setAccordionMode = n.setAccordionMode.bind(this), this.openMobile = n.openMobile.bind(this), this.closeMobile = n.closeMobile.bind(this), this.toggleMobile = n.toggleMobile.bind(this), this.navigate = (o) => (t._metricsManager.incrementNavigations(), n.navigate.call(t, o)), this.setBadge = n.setBadge.bind(this), this.refresh = n.refresh.bind(this), this.getState = ky(this._context.engine), this.healthCheck = () => t._healthReporter.healthCheck(), this.info = () => t._healthReporter.info(), this.getManifest = () => t._healthReporter.getManifest(), this.getMetrics = () => t._healthReporter.getMetrics();
  }
  destroy() {
    this._destroyer.execute(this._context, this._setupCoordinator), this._metricsManager.reset();
  }
}
const et = "sidebar-kernel", Ue = "3.1.0-ES6", Ee = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  DEGRADED: "degraded",
  SHUTDOWN: "shutdown",
  ERROR: "error"
}), q = Object.freeze({
  REGISTERED: "registered",
  ENABLED: "enabled",
  DISABLED: "disabled",
  DEGRADED: "degraded",
  ERROR: "error"
}), Fe = Object.freeze({
  READY: "sidebar-kernel:ready",
  SHUTDOWN: "sidebar-kernel:shutdown",
  FEATURE_REGISTERED: "sidebar-kernel:feature:registered",
  FEATURE_ENABLED: "sidebar-kernel:feature:enabled",
  FEATURE_DISABLED: "sidebar-kernel:feature:disabled",
  FEATURE_ERROR: "sidebar-kernel:feature:error",
  HEALTH_DEGRADED: "sidebar-kernel:health:degraded"
}), Et = xb({ moduleId: et });
function Jv() {
  Et.init();
}
function Ul(e) {
  return Et.get(e);
}
function Oh(e) {
  return Et.inject(e);
}
function Th() {
  return Et.snapshot();
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
      version: Ue,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: b.status
    },
    errors: r || []
  };
}
function us(e, t) {
  try {
    const r = Ul("telemetry");
    r && r.track && r.track(e, Object.assign({ moduleId: et }, t || {}));
  } catch {
  }
}
function $e(e, t) {
  try {
    const r = Ul("eventBus");
    r && r.emit && r.emit(e, Object.assign({ source: et, timestamp: Date.now() }, t || {}));
  } catch {
  }
}
function Dh(e) {
  const t = [];
  return b.features.forEach((r, n) => {
    r.dependencies && r.dependencies.indexOf(e) > -1 && t.push(n);
  }), t;
}
function jl(e, t) {
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
    else if (a.status !== q.ENABLED)
      n.push(`${o} (not enabled)`);
    else {
      const l = jl(o, t);
      l.ok || (n = n.concat(l.missing));
    }
  }
  return b.metrics.dependencyChecks++, { ok: n.length === 0, missing: n };
}
function Fl(e, t) {
  if (t || (t = /* @__PURE__ */ new Set()), t.has(e)) return [];
  t.add(e);
  let r = [];
  const n = Dh(e);
  for (let s = 0; s < n.length; s++) {
    const i = n[s], o = b.features.get(i);
    if (o && o.status === q.ENABLED) {
      r.push(i);
      const a = Fl(i, t);
      r = r.concat(a);
    }
  }
  return r;
}
function Gl(e) {
  if (b.status === Ee.READY) return R(!0, { alreadyInitialized: !0 });
  if (b.status === Ee.INITIALIZING) return R(!1, null, [{ code: "INIT_IN_PROGRESS", message: "Initialization in progress" }]);
  b.status = Ee.INITIALIZING;
  try {
    Jv(), e && e.ports && Et.inject(e.ports), b.initTime = Date.now(), b.shutdownTime = null, b.metrics.inits++;
    const t = Ul("telemetry");
    return t && t.register && t.register({ id: et, version: Ue, healthCheck: or, info: Pi }), b.status = Ee.READY, us("kernel:init", { version: Ue }), $e(Fe.READY, { version: Ue, featuresCount: b.features.size }), $e(f.KERNEL_READY, { version: Ue, featuresCount: b.features.size }), typeof window < "u" && (window.SidebarKernel = wh), R(!0, { initialized: !0, version: Ue, status: b.status });
  } catch (t) {
    return b.status = Ee.ERROR, b.errors.push({ code: "INIT_ERROR", message: t.message, timestamp: Date.now() }), R(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Ri(e) {
  if (b.status === Ee.SHUTDOWN) return R(!0, { alreadyShutdown: !0 });
  try {
    return b.features.forEach((t, r) => {
      if (t.status === q.ENABLED)
        try {
          vn(r, "kernel_shutdown");
        } catch {
        }
    }), b.shutdownTime = Date.now(), b.metrics.shutdowns++, b.status = Ee.SHUTDOWN, us("kernel:shutdown", { reason: e || "manual", uptime: b.shutdownTime - b.initTime }), $e(Fe.SHUTDOWN, { reason: e || "manual" }), $e(f.KERNEL_SHUTDOWN, { reason: e }), typeof window < "u" && window.SidebarKernel && delete window.SidebarKernel, R(!0, { shutdown: !0, reason: e || "manual", uptime: b.shutdownTime - b.initTime });
  } catch (t) {
    return b.errors.push({ code: "SHUTDOWN_ERROR", message: t.message, timestamp: Date.now() }), R(!1, null, [{ code: "SHUTDOWN_ERROR", message: t.message }]);
  }
}
function Lh() {
  return Ri("cleanup");
}
function Vl(e) {
  if (!e || !e.id) return R(!1, null, [{ code: "INVALID_FEATURE", message: "Feature must have id" }]);
  const t = e.id, r = b.features.get(t), n = {
    id: t,
    version: e.version || "0.0.0",
    category: e.category || "general",
    priority: e.priority !== void 0 ? e.priority : 2,
    dependencies: e.dependencies || [],
    capabilities: e.capabilities || {},
    instance: e,
    status: q.REGISTERED,
    registeredAt: r ? r.registeredAt : Date.now(),
    enabledAt: null,
    disabledAt: null,
    initDurationMs: null,
    lastError: null,
    errorCount: 0,
    initCount: 0
  };
  return b.features.set(t, n), b.metrics.featureRegistrations++, us("feature:registered", { featureId: t, version: n.version }), $e(Fe.FEATURE_REGISTERED, { featureId: t, version: n.version }), R(!0, { featureId: t, registered: !0, status: n.status });
}
function hs(e, t) {
  const r = b.features.get(e);
  if (!r) return R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
  if (r.status === q.ENABLED) return R(!0, { featureId: e, alreadyEnabled: !0 });
  const n = jl(e);
  if (!n.ok)
    return R(!1, null, [{
      code: "DEPENDENCY_NOT_MET",
      message: `Dependencies not satisfied: ${n.missing.join(", ")}`
    }]);
  try {
    const s = Date.now(), i = Object.assign({ ports: Et.snapshot() }, t || {});
    if (r.instance && typeof r.instance.init == "function") {
      const o = r.instance.init(i);
      if (o && !o.ok)
        return r.status = q.ERROR, r.lastError = o.errors && o.errors[0] || { code: "INIT_FAILED", message: "Unknown error" }, r.errorCount++, b.metrics.featureErrors++, $e(Fe.FEATURE_ERROR, { featureId: e, error: r.lastError }), o;
    }
    return r.status = q.ENABLED, r.enabledAt = Date.now(), r.initDurationMs = Date.now() - s, r.initCount++, b.metrics.featureEnables++, b.metrics.totalInitTimeMs += r.initDurationMs, us("feature:enabled", { featureId: e, initDurationMs: r.initDurationMs }), $e(Fe.FEATURE_ENABLED, { featureId: e, initDurationMs: r.initDurationMs }), R(!0, { featureId: e, enabled: !0, initDurationMs: r.initDurationMs });
  } catch (s) {
    return r.status = q.ERROR, r.lastError = { code: "ENABLE_ERROR", message: s.message }, r.errorCount++, b.metrics.featureErrors++, b.status = Ee.DEGRADED, $e(Fe.FEATURE_ERROR, { featureId: e, error: s.message }), R(!1, null, [{ code: "ENABLE_ERROR", message: s.message }]);
  }
}
function vn(e, t, r) {
  const n = b.features.get(e);
  if (!n) return R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
  if (n.status === q.DISABLED) return R(!0, { featureId: e, alreadyDisabled: !0 });
  const s = r || {}, i = [], o = Fl(e);
  if (o.length > 0)
    if (s.cascade)
      for (let a = o.length - 1; a >= 0; a--) {
        const l = o[a], d = b.features.get(l);
        if (d && d.status === q.ENABLED)
          try {
            d.instance && typeof d.instance.cleanup == "function" && d.instance.cleanup(), d.status = q.DISABLED, d.disabledAt = Date.now(), i.push(l), b.metrics.cascadeDisables++, $e(Fe.FEATURE_DISABLED, { featureId: l, reason: `cascade:${e}` });
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
    return n.instance && typeof n.instance.cleanup == "function" && n.instance.cleanup(), n.status = q.DISABLED, n.disabledAt = Date.now(), b.metrics.featureDisables++, us("feature:disabled", { featureId: e, reason: t }), $e(Fe.FEATURE_DISABLED, { featureId: e, reason: t || "manual" }), R(!0, { featureId: e, disabled: !0, reason: t, cascadeDisabled: i });
  } catch (a) {
    return n.lastError = { code: "DISABLE_ERROR", message: a.message }, R(!1, null, [{ code: "DISABLE_ERROR", message: a.message }]);
  }
}
function $h(e) {
  const t = b.features.get(e);
  return t ? (t.status === q.ENABLED && vn(e, "unregister", { cascade: !0 }), b.features.delete(e), $e(f.KERNEL_FEATURE_UNREGISTERED, { featureId: e }), R(!0, { featureId: e, unregistered: !0 })) : R(!1, null, [{ code: "NOT_FOUND", message: `Feature not found: ${e}` }]);
}
function ql(e) {
  if (!b.features.get(e)) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = Fl(e);
  return R(!0, { featureId: e, canDisable: r.length === 0, dependents: r });
}
function Yl(e) {
  if (!b.features.get(e)) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = Dh(e), n = r.filter((s) => {
    const i = b.features.get(s);
    return i && i.status === q.ENABLED;
  });
  return R(!0, { featureId: e, dependents: r, enabledDependents: n });
}
function kh(e) {
  const t = b.features.get(e);
  if (!t) return R(!1, null, [{ code: "NOT_FOUND" }]);
  const r = jl(e);
  return R(!0, { featureId: e, valid: r.ok, missing: r.missing, dependencies: t.dependencies });
}
function xi() {
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
function Kl(e) {
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
function fs(e) {
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
function Wl(e) {
  return fs(e);
}
function Xl() {
  const e = {}, t = { registered: 0, enabled: 0, disabled: 0, error: 0 };
  return b.features.forEach((r, n) => {
    if (r.status === q.REGISTERED ? t.registered++ : r.status === q.ENABLED ? t.enabled++ : r.status === q.DISABLED ? t.disabled++ : r.status === q.ERROR && t.error++, r.instance && typeof r.instance.getMetrics == "function")
      try {
        e[n] = r.instance.getMetrics();
      } catch (s) {
        e[n] = { error: s.message };
      }
    else
      e[n] = { initDurationMs: r.initDurationMs };
  }), R(!0, { kernel: Object.assign({}, b.metrics), features: e, totals: t });
}
function In() {
  let e = 0, t = 0, r = 0;
  return b.features.forEach((n) => {
    n.status === q.ENABLED ? e++ : n.status === q.DISABLED ? t++ : n.status === q.ERROR && r++;
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
function or() {
  const e = In().data, t = {
    initialized: b.status === Ee.READY,
    notInError: b.status !== Ee.ERROR,
    hasFeatures: b.features.size > 0,
    portsInitialized: Et.isInitialized()
  }, r = {};
  let n = 0;
  b.features.forEach((l, d) => {
    if (l.instance && typeof l.instance.healthCheck == "function")
      try {
        r[d] = l.instance.healthCheck(), r[d].status === "DEGRADED" && n++;
      } catch (u) {
        r[d] = { status: "ERROR", error: u.message }, n++;
      }
    else
      r[d] = { status: l.status === q.ERROR ? "UNHEALTHY" : "UNKNOWN" };
  });
  const s = Object.values(t).filter(Boolean).length, i = Object.keys(t).length, o = Math.round(s / i * 100);
  let a = "HEALTHY";
  return b.status === Ee.ERROR ? a = "UNHEALTHY" : (s < i || n > 0 || e.featuresError > 0) && (a = "DEGRADED", $e(Fe.HEALTH_DEGRADED, { degradedFeatures: n })), {
    status: a,
    score: o,
    moduleId: et,
    version: Ue,
    checks: t,
    features: r,
    uptime: b.initTime ? Date.now() - b.initTime : 0,
    portsInitialized: Et.isInitialized(),
    issues: e.featuresError > 0 ? [{ code: "FEATURES_ERROR", message: `${e.featuresError} features in error state` }] : [],
    timestamp: Date.now()
  };
}
function Pi() {
  return R(!0, {
    moduleId: et,
    version: Ue,
    status: b.status,
    portsInitialized: Et.isInitialized(),
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
function Zl() {
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
      version: Ue,
      status: b.status,
      initTime: b.initTime ? new Date(b.initTime).toISOString() : null,
      uptime: b.initTime ? Date.now() - b.initTime : 0,
      metrics: Object.assign({}, b.metrics),
      errors: b.errors.slice()
    },
    features: e,
    healthCheck: or()
  };
}
const wh = {
  MODULE_ID: et,
  VERSION: Ue,
  STATUS: Ee,
  FEATURE_STATUS: q,
  KERNEL_EVENTS: Fe,
  init: Gl,
  shutdown: Ri,
  cleanup: Lh,
  registerFeature: Vl,
  unregisterFeature: $h,
  enableFeature: hs,
  disableFeature: vn,
  canDisable: ql,
  getDependents: Yl,
  validateDependencies: kh,
  listFeatures: xi,
  getFeaturesByStatus: Kl,
  getFeatureStatus: fs,
  getFeature: Wl,
  getFeatureMetrics: Xl,
  metrics: In,
  healthCheck: or,
  info: Pi,
  exportDiagnostics: Zl,
  injectPorts: Oh,
  getPorts: Th
};
var Qv = wh;
const Qa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FEATURE_STATUS: q,
  KERNEL_EVENTS: Fe,
  MODULE_ID: et,
  STATUS: Ee,
  VERSION: Ue,
  canDisable: ql,
  cleanup: Lh,
  default: Qv,
  disableFeature: vn,
  enableFeature: hs,
  exportDiagnostics: Zl,
  getDependents: Yl,
  getFeature: Wl,
  getFeatureMetrics: Xl,
  getFeatureStatus: fs,
  getFeaturesByStatus: Kl,
  getPorts: Th,
  healthCheck: or,
  info: Pi,
  init: Gl,
  injectPorts: Oh,
  listFeatures: xi,
  metrics: In,
  registerFeature: Vl,
  shutdown: Ri,
  unregisterFeature: $h,
  validateDependencies: kh
}, Symbol.toStringTag, { value: "Module" })), Or = "1.1.0-P2-ENTERPRISE", wr = "sidebar-metrics-hub", Ht = v({ moduleId: wr });
function eI() {
  Ht.init();
}
function tI(e) {
  return Ht.get(e);
}
function Nh(e) {
  return Ht.inject(e);
}
function Rh() {
  return Ht.snapshot();
}
const Hi = Object.freeze({
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
}, te = {
  hubInits: 0,
  registrations: 0,
  unregistrations: 0,
  aggregations: 0,
  snapshotsTaken: 0,
  errors: 0,
  lastError: null
};
function X(e, t, r) {
  return {
    ok: e,
    data: t || null,
    meta: { moduleId: wr, version: Or, timestamp: Date.now() },
    errors: r || []
  };
}
function rI(e, t) {
  try {
    const r = tI("eventBus");
    r != null && r.emit && r.emit(e, { source: wr, timestamp: Date.now(), ...t });
  } catch (r) {
    te.errors++, te.lastError = { event: e, message: r.message, timestamp: Date.now() };
  }
}
function xh(e, t) {
  const r = { action: e, data: t, timestamp: Date.now() };
  I.subscribers.forEach((n) => {
    try {
      n(r);
    } catch {
      te.errors++;
    }
  });
}
function Jl(e = {}) {
  if (I.initialized)
    return X(!0, { alreadyInitialized: !0 });
  try {
    return eI(), e.ports && Ht.inject(e.ports), I.initialized = !0, I.initAt = Date.now(), te.hubInits++, e.aggregationInterval && e.aggregationInterval > 0 && (I.aggregationInterval = setInterval(() => {
      Je();
    }, e.aggregationInterval)), rI(f.MEMORY_INITIALIZED, { version: Or }), X(!0, {
      initialized: !0,
      version: Or,
      sourcesCount: I.sources.size
    });
  } catch (t) {
    return te.errors++, te.lastError = { phase: "init", message: t.message, timestamp: Date.now() }, X(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function zi(e, t = {}) {
  if (!e)
    return X(!1, null, [{ code: "INVALID_SOURCE", message: "sourceId is required" }]);
  const r = {
    id: e,
    category: t.category || Hi.FEATURE,
    version: t.version || "0.0.0",
    getMetrics: t.getMetrics || null,
    healthCheck: t.healthCheck || null,
    registeredAt: Date.now(),
    lastUpdate: null,
    updateCount: 0,
    errors: 0
  };
  return I.sources.set(e, r), te.registrations++, xh("source:registered", { sourceId: e, category: r.category }), X(!0, { sourceId: e, registered: !0 });
}
function Ph(e) {
  return I.sources.has(e) ? (I.sources.delete(e), te.unregistrations++, xh("source:unregistered", { sourceId: e }), X(!0, { sourceId: e, unregistered: !0 })) : X(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
}
function Hh(e, t) {
  const r = I.sources.get(e);
  return r ? (r.lastMetrics = t, r.lastUpdate = Date.now(), r.updateCount++, X(!0, { sourceId: e, updated: !0 })) : X(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
}
function Je() {
  te.aggregations++, I.lastAggregation = Date.now();
  const e = {
    timestamp: Date.now(),
    hub: { ...te },
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
      t.errors++, e.summary.errorSources++, te.errors++;
    }
  }), X(!0, e);
}
function Bi(e) {
  const t = I.sources.get(e);
  if (!t)
    return X(!1, null, [{ code: "NOT_FOUND", message: `Source not found: ${e}` }]);
  let r = t.lastMetrics;
  if (!r && typeof t.getMetrics == "function")
    try {
      r = t.getMetrics(), t.lastMetrics = r, t.lastUpdate = Date.now();
    } catch (n) {
      return t.errors++, X(!1, null, [{ code: "FETCH_ERROR", message: n.message }]);
    }
  return X(!0, {
    sourceId: e,
    category: t.category,
    version: t.version,
    metrics: r,
    lastUpdate: t.lastUpdate
  });
}
function Ql(e) {
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
  }), X(!0, { category: e, sources: t, count: Object.keys(t).length });
}
function Ui(e = "") {
  const t = {
    id: `snap_${Date.now()}`,
    label: e,
    timestamp: Date.now(),
    data: Je().data
  };
  for (I.snapshots.push(t), te.snapshotsTaken++; I.snapshots.length > I.maxSnapshots; )
    I.snapshots.shift();
  return X(!0, { snapshotId: t.id, label: e });
}
function ji(e = 10) {
  const t = I.snapshots.slice(-e);
  return X(!0, { snapshots: t, total: I.snapshots.length });
}
function ec(e, t) {
  const r = I.snapshots.find((o) => o.id === e), n = I.snapshots.find((o) => o.id === t);
  if (!r || !n)
    return X(!1, null, [{ code: "NOT_FOUND", message: "One or both snapshots not found" }]);
  const s = {
    timeDelta: n.timestamp - r.timestamp,
    sourcesDelta: n.data.summary.totalSources - r.data.summary.totalSources,
    changes: {}
  };
  return (/* @__PURE__ */ new Set([
    ...Object.keys(r.data.sources || {}),
    ...Object.keys(n.data.sources || {})
  ])).forEach((o) => {
    var d, u, h, g;
    const a = (u = (d = r.data.sources) == null ? void 0 : d[o]) == null ? void 0 : u.metrics, l = (g = (h = n.data.sources) == null ? void 0 : h[o]) == null ? void 0 : g.metrics;
    !a && l ? s.changes[o] = { status: "added" } : a && !l ? s.changes[o] = { status: "removed" } : a && l && JSON.stringify(a) !== JSON.stringify(l) && (s.changes[o] = { status: "changed", before: a, after: l });
  }), X(!0, s);
}
function zh(e) {
  return typeof e != "function" ? () => {
  } : (I.subscribers.add(e), () => I.subscribers.delete(e));
}
function Fi() {
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
  }), X(!0, { sources: e, count: e.length });
}
function tc() {
  return I.aggregationInterval && (clearInterval(I.aggregationInterval), I.aggregationInterval = null), I.sources.clear(), I.snapshots = [], I.subscribers.clear(), I.initialized = !1, X(!0, { cleanedUp: !0 });
}
function rc() {
  const e = {
    initialized: { ok: I.initialized, severity: "crit" },
    hasSources: { ok: I.sources.size > 0, severity: "warn" },
    noErrors: { ok: te.errors === 0, severity: "warn" },
    portsInitialized: { ok: Ht.isInitialized(), severity: "warn" },
    recentAggregation: {
      ok: I.lastAggregation && Date.now() - I.lastAggregation < 6e4,
      severity: "info"
    }
  }, t = [];
  let r = 100;
  return I.initialized || (t.push({ code: "NOT_INIT", severity: "crit", message: "Hub not initialized" }), r -= 50), I.sources.size === 0 && (t.push({ code: "NO_SOURCES", severity: "warn", message: "No metric sources registered" }), r -= 10), te.errors > 0 && (t.push({ code: "HAS_ERRORS", severity: "warn", message: `${te.errors} errors recorded` }), r -= 5 * Math.min(te.errors, 10)), {
    status: r >= 80 ? "HEALTHY" : r >= 50 ? "DEGRADED" : "UNHEALTHY",
    score: r,
    moduleId: wr,
    version: Or,
    checks: e,
    issues: t,
    metrics: { ...te },
    sourcesCount: I.sources.size,
    snapshotsCount: I.snapshots.length,
    subscribersCount: I.subscribers.size,
    portsInitialized: Ht.isInitialized(),
    timestamp: Date.now()
  };
}
function Gi() {
  return X(!0, {
    moduleId: wr,
    version: Or,
    initialized: I.initialized,
    initAt: I.initAt,
    portsInitialized: Ht.isInitialized(),
    sourcesCount: I.sources.size,
    snapshotsCount: I.snapshots.length,
    subscribersCount: I.subscribers.size,
    categories: Object.values(Hi),
    metrics: { ...te },
    lastAggregation: I.lastAggregation
  });
}
function Bh() {
  return Je().data;
}
var nI = {
  VERSION: Or,
  MODULE_ID: wr,
  METRIC_CATEGORIES: Hi,
  init: Jl,
  cleanup: tc,
  registerSource: zi,
  unregisterSource: Ph,
  updateMetrics: Hh,
  aggregate: Je,
  getMetrics: Bh,
  getSourceMetrics: Bi,
  getMetricsByCategory: Ql,
  takeSnapshot: Ui,
  getSnapshots: ji,
  compareSnapshots: ec,
  subscribe: zh,
  listSources: Fi,
  healthCheck: rc,
  info: Gi,
  injectPorts: Nh,
  getPorts: Rh
};
const sI = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  METRIC_CATEGORIES: Hi,
  MODULE_ID: wr,
  VERSION: Or,
  aggregate: Je,
  cleanup: tc,
  compareSnapshots: ec,
  default: nI,
  getMetrics: Bh,
  getMetricsByCategory: Ql,
  getPorts: Rh,
  getSnapshots: ji,
  getSourceMetrics: Bi,
  healthCheck: rc,
  info: Gi,
  init: Jl,
  injectPorts: Nh,
  listSources: Fi,
  registerSource: zi,
  subscribe: zh,
  takeSnapshot: Ui,
  unregisterSource: Ph,
  updateMetrics: Hh
}, Symbol.toStringTag, { value: "Module" })), J = Object.freeze({
  CORE: "core",
  UI: "ui",
  SEARCH: "search",
  NAVIGATION: "navigation",
  DATA: "data",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  PERFORMANCE: "performance",
  DEBUG: "debug"
}), iI = {
  favorites: {
    module: "favorites-handler",
    version: "5.8.0",
    category: J.CORE,
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
    category: J.CORE,
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
    category: J.CORE,
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
}, oI = {
  theme: {
    module: "theme-handler",
    version: "5.0.0",
    category: J.UI,
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
    category: J.UI,
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
    category: J.UI,
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
    category: J.UI,
    methods: {
      show: { original: "showMenu", args: ["x", "y", "itemId", "actions?"], returns: "void" },
      hide: { original: "hideMenu", args: [], returns: "void" }
    },
    legacyMethods: { showContextMenu: "show", hideContextMenu: "hide" }
  },
  submenu: {
    module: "submenu-handler",
    version: "5.0.0",
    category: J.UI,
    methods: {
      toggle: { original: "toggleSubmenu", args: ["element"], returns: "void" },
      closeAll: { original: "closeAllSubmenus", args: ["container?"], returns: "void", requiresEl: !0 }
    },
    legacyMethods: { toggleSubmenu: "toggle", closeAllSubmenus: "closeAll" }
  }
}, aI = {
  search: {
    module: "fuzzy-search",
    version: "5.0.0",
    category: J.SEARCH,
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
    category: J.SEARCH,
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
}, lI = {}, cI = {
  badges: {
    module: "dynamic-badges",
    version: "5.0.0",
    category: J.DATA,
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
    category: J.DATA,
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
}, dI = {
  a11y: {
    module: "screen-reader",
    version: "5.0.0",
    category: J.ACCESSIBILITY,
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
    category: J.ACCESSIBILITY,
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
    category: J.ACCESSIBILITY,
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
}, uI = {
  effects: {
    module: "parallax",
    version: "5.0.0",
    category: J.VISUAL,
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
    category: J.VISUAL,
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
}, hI = {
  virtual: {
    module: "virtual-list",
    version: "5.0.0",
    category: J.PERFORMANCE,
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
}, fI = {
  debug: {
    module: "debug-panel",
    version: "5.0.0",
    category: J.DEBUG,
    methods: {
      open: { original: "open", args: [], returns: "void" },
      close: { original: "close", args: [], returns: "void" },
      toggle: { original: "toggle", args: [], returns: "void" }
    },
    legacyMethods: { openDebugPanel: "open", closeDebugPanel: "close", toggleDebugPanel: "toggle" }
  }
}, Qn = Object.freeze(Object.assign(
  {},
  iI,
  oI,
  aI,
  lI,
  cI,
  dI,
  uI,
  hI,
  fI
)), Vi = "sidebar:feature-proxy", gI = "1.4.0-P2-ENTERPRISE", Uh = v({ moduleId: Vi }), mI = (e) => Uh.get(e);
function pI() {
  var t, r;
  const e = mI("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const nn = (e, ...t) => {
  const r = `[${Vi}]`, n = pI();
  n != null && n[e] ? n[e](r, ...t) : !vt() && (e === "error" || e === "warn") && console.debug(r, ...t);
}, Jr = /* @__PURE__ */ new Map(), Vn = /* @__PURE__ */ new Map(), He = { calls: /* @__PURE__ */ new Map(), errors: /* @__PURE__ */ new Map(), loadTimes: /* @__PURE__ */ new Map() };
class Yd {
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
      He.calls.set(s, (He.calls.get(s) || 0) + 1), this._loaded || await this._load();
      const i = this._resolveMethodName(t);
      if (!this._module || typeof this._module[i] != "function") {
        const a = this._tryFallback(t, r);
        if (a !== void 0) return a;
        nn("warn", `Método não encontrado: ${s}`);
        return;
      }
      const o = await Promise.resolve(this._module[i](...r));
      return He.loadTimes.set(s, performance.now() - n), o;
    } catch (i) {
      He.errors.set(s, (He.errors.get(s) || 0) + 1), nn("error", `Erro ao invocar ${s}:`, i.message);
      return;
    }
  }
  async _load() {
    return this._loading ? this._loading : this._loaded && this._module ? this._module : (this._loading = (async () => {
      try {
        const t = performance.now();
        return Vn.has(this._featureName) ? (this._module = Vn.get(this._featureName), this._loaded = !0, this._module) : (this._resolver && typeof this._resolver == "function" && (this._module = await Promise.resolve(this._resolver(this._featureName, this._contract)), this._module && (Vn.set(this._featureName, this._module), this._loaded = !0, He.loadTimes.set(`${this._featureName}:load`, performance.now() - t))), this._module);
      } catch (t) {
        return nn("error", `Erro ao carregar feature ${this._featureName}:`, t.message), this._module = null, this._loaded = !1, null;
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
    if (!vt())
      try {
        if (typeof window < "u" && window.SidebarKernel) {
          zn("WINDOW_SIDEBARKERNEL_FALLBACK", { module: Vi, method: t });
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
function jh(e, t, r) {
  if (!e || typeof e != "string")
    return nn("warn", "Nome de feature inválido:", e), null;
  const n = e.toLowerCase();
  if (Jr.has(n)) return Jr.get(n);
  const s = t ? t[n] || t[e] : null;
  if (!s) {
    nn("warn", `Contrato não encontrado para feature: ${e}`);
    const o = new Yd(e, { methods: [] }, r);
    return Jr.set(n, o), o;
  }
  const i = new Yd(e, s, r);
  return Jr.set(n, i), i;
}
function qi() {
  return { calls: Object.fromEntries(He.calls), errors: Object.fromEntries(He.errors), loadTimes: Object.fromEntries(He.loadTimes), cachedProxies: Jr.size, cachedModules: Vn.size };
}
async function EI(e, t, r) {
  if (!Array.isArray(e)) return;
  const n = e.map(async (s) => {
    try {
      const i = jh(s, t, r);
      i && await i._load();
    } catch (i) {
      nn("warn", `Falha no preload de ${s}:`, i.message);
    }
  });
  await Promise.allSettled(n);
}
function bI() {
  qi();
  const e = Array.from(He.errors.values()).reduce((n, s) => n + s, 0), t = Array.from(He.calls.values()).reduce((n, s) => n + s, 0), r = t > 0 ? e / t * 100 : 0;
  return {
    status: r < 5 ? "HEALTHY" : r < 20 ? "DEGRADED" : "UNHEALTHY",
    module: Vi,
    version: gI,
    portsInitialized: Uh.isInitialized(),
    strictMode: vt(),
    metrics: { cachedProxies: Jr.size, cachedModules: Vn.size, totalCalls: t, totalErrors: e, errorRate: `${r.toFixed(2)}%` }
  };
}
const Fh = "sidebar:legacy-bridge", _I = v({ moduleId: Fh }), yI = (e) => _I.get(e);
function vI() {
  var t, r;
  const e = yI("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const Ei = (e, ...t) => {
  const r = `[${Fh}]`, n = vI();
  n != null && n[e] ? n[e](r, ...t) : !vt() && (e === "error" || e === "warn" || e === "info") && console.debug(r, ...t);
}, el = /* @__PURE__ */ new Map(), tl = {
  setBadge: { feature: "badges", method: "set", removeIn: "v6.0.0" },
  getBadge: { feature: "badges", method: "get", removeIn: "v6.0.0" },
  removeBadge: { feature: "badges", method: "remove", removeIn: "v6.0.0" }
};
function II(e, t) {
  const r = `Sidebar.feature('${t.feature}').${t.method}()`, n = `DEPRECATED: ${e}() → Use: ${r} (removing in ${t.removeIn})`;
  Ei("warn", n);
  {
    const s = el.get(e) || 0;
    el.set(e, s + 1);
  }
}
function SI(e, t, r) {
  return (...n) => {
    II(e, t);
    const s = r(t.feature);
    if (!s) {
      Ei("error", `Feature not found: ${t.feature}`);
      return;
    }
    const i = t.args ? [...t.args, ...n] : n, o = s[t.method];
    if (typeof o == "function")
      return o.apply(s, i);
    Ei("warn", `Method not found: ${t.feature}.${t.method}`);
  };
}
function CI(e, t) {
  return Ei("info", "Legacy bridge DISABLED - use Sidebar.feature('x').method() API"), e;
}
function Na() {
  const e = Array.from(el.entries()).map(([t, r]) => ({ method: t, count: r, mapping: tl[t] })).sort((t, r) => r.count - t.count);
  return { totalCalls: e.reduce((t, r) => t + r.count, 0), uniqueMethods: e.length, methods: e };
}
const Yi = "6.1.0-ES6", gs = "sidebar-accessibility-landmarks", Nr = v({ moduleId: gs });
function AI() {
  Nr.init();
}
function MI(e) {
  return Nr.get(e);
}
function Gh(e) {
  return Nr.inject(e);
}
function Vh() {
  return Nr.snapshot();
}
let O = null, Ki = { applies: 0, updates: 0, errors: 0 };
const Kd = { sidebar: "navigation", search: "search" };
function qh(e, t) {
  e && Nr.inject({ eventBus: e }), AI(), O = t, t && nc(t);
  const r = MI("eventBus");
  r && r.emit && r.emit(f.A11Y_INITIALIZED);
}
function nc(e) {
  if (!e) return;
  Ki.applies++, e.setAttribute("role", Kd.sidebar), e.setAttribute("aria-label", "Menu de navegação principal");
  const t = e.querySelector(`.${c.HEADER}`);
  t && (t.setAttribute("role", "banner"), t.setAttribute("aria-label", "Cabeçalho do menu"));
  const r = e.querySelector(`.${c.LOGO}`);
  r && (r.setAttribute("role", "img"), r.setAttribute("aria-label", "Logo da aplicação"));
  const n = e.querySelector(`.${c.SEARCH}`);
  if (n) {
    n.setAttribute("role", Kd.search), n.setAttribute("aria-label", "Buscar no menu");
    const o = n.querySelector("input");
    if (o && (o.setAttribute("aria-label", "Campo de busca"), o.setAttribute("aria-describedby", "search-hint"), !n.querySelector("#search-hint"))) {
      const a = document.createElement("span");
      a.id = "search-hint", a.className = "sr-only", a.textContent = "Digite para filtrar os itens do menu. Use setas para navegar.", n.appendChild(a);
    }
  }
  const s = e.querySelector(`.${c.NAV}, .${c.NAV_CONTENT}`);
  s && (s.setAttribute("role", "tree"), s.setAttribute("aria-label", "Itens do menu"), s.setAttribute("aria-multiselectable", "false")), OI(e), TI(e);
  const i = e.querySelector(`.${c.FOOTER}`);
  return i && (i.setAttribute("role", "contentinfo"), i.setAttribute("aria-label", "Rodapé do menu")), e;
}
function OI(e) {
  e.querySelectorAll(`.${c.SECTION}`).forEach((t, r) => {
    var l;
    const n = t.dataset.sectionId || `section-${r}`, s = t.querySelector(`.${c.GROUP_TITLE}, .${c.SECTION_TITLE}`), i = ((l = s == null ? void 0 : s.textContent) == null ? void 0 : l.trim()) || `Seção ${r + 1}`;
    t.setAttribute("role", "group"), t.setAttribute("aria-labelledby", `${n}-title`), s && (s.id = `${n}-title`);
    const o = t.querySelector(`.${c.GROUP_BUTTON}, .${c.SECTION_TOGGLE}`);
    if (o) {
      const d = t.classList.contains(c.SECTION_EXPANDED);
      o.setAttribute("role", "button"), o.setAttribute("aria-expanded", String(d)), o.setAttribute("aria-controls", `${n}-content`), o.setAttribute("aria-label", `${d ? "Colapsar" : "Expandir"} ${i}`);
    }
    const a = t.querySelector(`.${c.SECTION_CONTENT}, .${c.GROUP_ITEMS}`);
    a && (a.id = `${n}-content`, a.setAttribute("role", "group"));
  });
}
function TI(e) {
  e.querySelectorAll(`.${c.ITEM}`).forEach((t) => {
    var h, g;
    const r = t.querySelector(`.${c.LINK}`), n = t.querySelector(`.${c.ITEM_LABEL}, .${c.ITEM_TEXT}`), s = ((h = n == null ? void 0 : n.textContent) == null ? void 0 : h.trim()) || "", i = t.querySelector(`.${c.BADGE}, .dsd-badge`), o = (g = i == null ? void 0 : i.textContent) == null ? void 0 : g.trim(), a = t.querySelector(`.${c.SUBMENU}, .${c.CHILDREN}`), l = t.classList.contains(c.ITEM_ACTIVE), d = t.classList.contains(c.ITEM_DISABLED);
    if (t.setAttribute("role", "treeitem"), t.setAttribute("aria-selected", String(l)), d && t.setAttribute("aria-disabled", "true"), a) {
      const m = t.classList.contains(c.ITEM_EXPANDED);
      t.setAttribute("aria-expanded", String(m));
    }
    if (r) {
      r.setAttribute("tabindex", l ? "0" : "-1");
      let m = s;
      o && (m += `, ${o} notificações`), l && (m += ", página atual"), d && (m += ", desabilitado"), r.setAttribute("aria-label", m), l ? r.setAttribute("aria-current", "page") : r.removeAttribute("aria-current");
    }
    const u = t.querySelector(`.${c.ITEM_ICON}`);
    u && u.setAttribute("aria-hidden", "true"), i && (i.setAttribute("role", "status"), i.setAttribute("aria-label", `${o} notificações`));
  });
}
function Yh(e, t) {
  var s;
  Ki.updates++;
  const r = O == null ? void 0 : O.querySelector(`[data-section-id="${e}"]`);
  if (!r) return;
  const n = r.querySelector(`.${c.GROUP_BUTTON}, .${c.SECTION_TOGGLE}`);
  if (n) {
    n.setAttribute("aria-expanded", String(t));
    const i = ((s = r.querySelector(`.${c.GROUP_TITLE}`)) == null ? void 0 : s.textContent) || "Seção";
    n.setAttribute("aria-label", `${t ? "Colapsar" : "Expandir"} ${i}`);
  }
}
function Kh(e) {
  if (Ki.updates++, !O) return;
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
function Wh(e, t, r) {
  var i;
  if (!O) return;
  const n = O.querySelector(`#${e}, [data-item-id="${e}"]`);
  if (!n) return;
  let s = O.querySelector(`#${t}`);
  s || (s = document.createElement("span"), s.id = t, s.className = "sr-only", (i = n.parentNode) == null || i.insertBefore(s, n.nextSibling)), s.textContent = r, n.setAttribute("aria-describedby", t);
}
function Xh(e, t) {
  var r;
  if (O)
    if (t = t || "Carregando menu...", O.setAttribute("aria-busy", String(e)), e) {
      O.setAttribute("aria-describedby", "sidebar-loading-msg");
      let n = O.querySelector("#sidebar-loading-msg");
      n || (n = document.createElement("div"), n.id = "sidebar-loading-msg", n.className = "sr-only", n.setAttribute("role", "status"), n.setAttribute("aria-live", "polite"), O.appendChild(n)), n.textContent = t;
    } else
      O.removeAttribute("aria-describedby"), (r = O.querySelector("#sidebar-loading-msg")) == null || r.remove();
}
function Zh() {
  var e, t;
  (e = O == null ? void 0 : O.querySelector("#search-hint")) == null || e.remove(), (t = O == null ? void 0 : O.querySelector("#sidebar-loading-msg")) == null || t.remove(), O = null;
}
function Wi() {
  return { ...Ki };
}
function Jh() {
  return { moduleId: gs, version: Yi, portsInitialized: Nr.isInitialized(), hasContainer: !!O, sectionsCount: (O == null ? void 0 : O.querySelectorAll('[role="group"]').length) || 0, itemsCount: (O == null ? void 0 : O.querySelectorAll('[role="treeitem"]').length) || 0, metrics: Wi() };
}
function Qh() {
  const e = O == null ? void 0 : O.hasAttribute("role"), t = O == null ? void 0 : O.hasAttribute("aria-label");
  return { status: e && t ? "HEALTHY" : O ? "DEGRADED" : "NOT_INITIALIZED", version: Yi, moduleId: gs, portsInitialized: Nr.isInitialized(), checks: { hasContainer: !!O, hasRole: e, hasLabel: t }, metrics: Wi() };
}
var DI = { init: qh, applyLandmarks: nc, updateExpansionState: Yh, updateActiveItem: Kh, addDescribedBy: Wh, setLoadingState: Xh, destroy: Zh, injectPorts: Gh, getPorts: Vh, getMetrics: Wi, info: Jh, healthCheck: Qh, VERSION: Yi, MODULE_ID: gs };
const ef = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: gs,
  VERSION: Yi,
  addDescribedBy: Wh,
  applyLandmarks: nc,
  default: DI,
  destroy: Zh,
  getMetrics: Wi,
  getPorts: Vh,
  healthCheck: Qh,
  info: Jh,
  init: qh,
  injectPorts: Gh,
  setLoadingState: Xh,
  updateActiveItem: Kh,
  updateExpansionState: Yh
}, Symbol.toStringTag, { value: "Module" })), Xi = "3.4.0-ES6", Zi = "sidebar-feature-accordion-ncs", tf = "sidebar.accordion.ncs.enabled", dt = "sidebar-accordion-root", Er = "region:app:accordion-ncs", ms = v({ moduleId: Zi });
function rf() {
  ms.init();
}
function LI(e) {
  return ms.get(e);
}
function sc(e) {
  return ms.inject(e);
}
function nf() {
  return ms.snapshot();
}
function sf() {
  return ms.isInitialized();
}
function G(e, t, r) {
  const n = LI("logger");
  n && n[e] && n[e](`[${Zi}] ${t}`, r || "");
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
function of() {
  try {
    const e = localStorage.getItem("dshowdash:featureFlags");
    return e ? JSON.parse(e) : {};
  } catch {
    return {};
  }
}
function af(e, t) {
  try {
    const r = of();
    return r[e] = t, localStorage.setItem("dshowdash:featureFlags", JSON.stringify(r)), !0;
  } catch {
    return !1;
  }
}
function ut() {
  return of()[tf] === !0;
}
function lf() {
  if (document.getElementById(dt))
    return document.getElementById(dt);
  const e = document.querySelector(`.${c.NAV_CONTENT}`);
  if (!e)
    return null;
  const t = document.createElement("div");
  return t.id = dt, t.className = c.ACCORDION_CONTAINER, t.setAttribute("data-accordion-ncs-active", "true"), t.setAttribute("data-uarps-region", Er), e.insertBefore(t, e.firstChild), $.container = t, t;
}
function cf() {
  const e = document.getElementById(dt);
  e && e.remove(), $.container = null;
}
async function df(e = 10, t = 100) {
  for (let r = 0; r < e; r++) {
    if (document.querySelector(`.${c.NAV_CONTENT}`)) return !0;
    await new Promise((s) => {
      setTimeout(s, t);
    });
  }
  return !1;
}
function uf() {
  const e = document.querySelector(`.${c.NAV_CONTENT}`);
  if (!e) return;
  const t = e.children;
  let r = 0;
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    s.id !== dt && (s.hasAttribute("data-accordion-ncs-active") || (s.classList.contains(c.SECTION) || s.classList.contains(c.NAV_SECTION)) && (s.style.display = "none", s.setAttribute("data-ncs-hidden", "true"), r++));
  }
  G("info", `Legacy navigation hidden (${r} elements)`);
}
function $I() {
  document.querySelectorAll('[data-ncs-hidden="true"]').forEach((t) => {
    t.style.display = "", t.removeAttribute("data-ncs-hidden");
  }), G("info", "Legacy navigation restored");
}
function hf() {
  return document.querySelectorAll('[data-ncs-hidden="true"]').length;
}
function kI(e) {
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
          region_id: Er
        },
        items: (n.items || []).map((o) => {
          var a, l, d, u;
          return {
            id: o.id,
            label: o.label,
            icon: o.icon || "file",
            order: o.order || 0,
            type: ((a = o.navigation) == null ? void 0 : a.mode) === "action" ? "panel" : "route",
            target: {
              panelId: ((d = (l = o.navigation) == null ? void 0 : l.action) == null ? void 0 : d.replace("panel:", "")) || null,
              route: o.route || null,
              path: o.route || null
            },
            disabled: ((u = o.state) == null ? void 0 : u.disabled) || !1,
            badge: o.badge || null,
            uarps: o.uarps || {
              trigger_id: `trigger:navigation:item-${o.id}`,
              region_id: Er
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
      region: Er,
      phase: ((r = e.meta) == null ? void 0 : r.phase) || "P0",
      loaderSource: e.source
    }
  };
}
const Bn = "accordion-ncs-navigation-handler", ff = v({ moduleId: Bn });
function wI() {
  ff.init();
}
function Ra(e) {
  return ff.get(e);
}
function gf(e) {
  var s;
  wI();
  const t = ((s = e == null ? void 0 : e.view) == null ? void 0 : s._eventBus) || $.eventBus || Ra("eventBus");
  if (!t) {
    G("warn", "No eventBus available for navigation handler");
    return;
  }
  const r = (i) => {
    const o = i.item;
    if (!o || !o.target) {
      G("warn", "Item selected without target:", i);
      return;
    }
    const a = o.target;
    if (a.route || a.path) {
      const l = a.route || a.path, d = Ra("routerGlobal");
      if (d && d.navigate) {
        d.navigate(l, { source: Bn }), G("info", `Navigating via Ports router: ${l}`);
        return;
      }
      const u = Ra("eventBus") || t;
      if (u && u.emit) {
        u.emit(pe.NAVIGATE, {
          path: l,
          options: { source: Bn },
          source: Bn,
          timestamp: Date.now()
        }), G("info", `Navigating via EventBus NAVIGATE: ${l}`);
        return;
      }
      t && t.emit && t.emit(cl.HARD_NAV, {
        path: l,
        reason: "No router or EventBus via Ports",
        source: Bn,
        timestamp: Date.now()
      }), window.location.hash = l, G("info", `Fallback navigation to: ${l}`);
    }
  }, n = Ba.SELECT_ITEM;
  t.on(n, r), G("info", `Navigation handler listening to: ${n}`), $.cleanups.push(() => {
    t.off(n, r);
  });
}
async function NI(e = 20, t = 150) {
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
async function Pn() {
  try {
    if (G("warn", "Using mock fallback"), !await df(15, 100))
      return G("warn", "Nav content still not available, skipping accordion"), { success: !1, error: "Nav content not available" };
    const t = await import("/components/accordion/index.js");
    if (!lf())
      return G("warn", "Container creation failed, skipping accordion"), { success: !1, error: "Container creation failed" };
    const n = await t.mountAccordionWithMock(`#${dt}`);
    if (n.success)
      return $.accordion = n, $.accordion.source = "mock", $.enabled = !0, uf(), gf(n), G("info", "Accordion NCS loaded with MOCK fallback"), { success: !0, source: "mock", accordion: n };
    throw new Error(n.error || "Mock mount failed");
  } catch (e) {
    return G("error", `Fallback also failed: ${e.message}`), cf(), { success: !1, error: e.message };
  }
}
async function ic() {
  rf();
  try {
    const e = await k.load();
    let t = null, r = "unknown";
    if (!e.success && e.reason === "already-loading") {
      G("info", "Model already loading, waiting for it...");
      const l = await NI(20, 150);
      if (l.success)
        t = l.model, r = l.source, G("info", "Model obtained after waiting");
      else
        return G("warn", "Timeout waiting for model, using fallback"), Pn();
    } else if (e.success)
      t = e.model || k.getModel(), r = e.source;
    else
      return G("warn", `Model load failed: ${e.reason || e.error}`), Pn();
    if ($.modelLoaderReady = !0, !t || !t.sections || t.sections.length === 0)
      return G("warn", "Model empty, using fallback"), Pn();
    const n = kI(t);
    if (!await df(15, 100))
      return G("warn", "Nav content not available, using fallback"), Pn();
    const i = await import("/components/accordion/index.js");
    if (!lf())
      throw new Error("Container creation failed");
    const a = await i.mountAccordion(`#${dt}`, {
      structure: n,
      persistence: !0,
      telemetry: !0
    });
    if (a.success)
      return $.accordion = a, $.accordion.source = r, $.accordion.modelVersion = t.version, $.enabled = !0, uf(), gf(a), G("info", "Accordion NCS loaded via NavigationModelLoader"), G("info", `Source: ${r}, Sections: ${n.sections.length}`), {
        success: !0,
        source: r,
        accordion: a,
        sectionsCount: n.sections.length,
        modelVersion: t.version
      };
    throw new Error(a.error || "Mount failed");
  } catch (e) {
    return G("error", `Failed to load Accordion NCS: ${e.message}`), Pn();
  }
}
function oc() {
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
  cf(), $I(), $.accordion = null, $.enabled = !1, G("info", "Accordion NCS unloaded");
}
function ac() {
  let e = null;
  try {
    e = k.healthCheck ? k.healthCheck() : { healthy: !1 };
  } catch (o) {
    e = { healthy: !1, error: o.message };
  }
  const t = {
    initialized: $.initialized,
    featureFlagEnabled: ut(),
    modelLoaderReady: $.modelLoaderReady || e && (e.healthy || e.status === "HEALTHY"),
    portsInitialized: sf()
  }, r = Object.values(t).filter(Boolean).length, n = Object.keys(t).length, s = {
    accordionLoaded: $.accordion !== null,
    containerExists: typeof document < "u" && document.getElementById(dt) !== null,
    legacyHidden: hf() > 0,
    uarpsRegionSet: typeof document < "u" && document.querySelector(`[data-uarps-region="${Er}"]`) !== null
  };
  let i = "HEALTHY";
  return $.initialized ? r < n && (i = "DEGRADED") : i = "NOT_INITIALIZED", {
    status: i,
    score: { passed: r, total: n, percentage: Math.round(r / n * 100) },
    checks: t,
    domInfo: s,
    modelLoader: e,
    moduleId: Zi,
    version: Xi,
    triggerPattern: "trigger:navigation:item-{id}",
    region: Er,
    timestamp: Date.now()
  };
}
function lc() {
  let e = null;
  try {
    e = k.info ? k.info() : {};
  } catch (t) {
    e = { error: t.message };
  }
  return {
    moduleId: Zi,
    version: Xi,
    initialized: $.initialized,
    enabled: $.enabled,
    featureFlagKey: tf,
    containerId: dt,
    accordionLoaded: $.accordion !== null,
    dataSource: e && e.source || "none",
    modelVersion: e && e.version || null,
    hasModel: e && e.hasModel || !1,
    isFallback: e && e.isFallback || !1,
    legacyHiddenCount: hf(),
    navigationEventName: Ba && Ba.SELECT_ITEM || "unknown",
    triggerPattern: "trigger:navigation:item-{id}",
    sectionTriggerPattern: "trigger:navigation:section-{id}",
    region: Er,
    phase: "P0 - Compatibility (3-segment compliant)",
    portsInitialized: sf(),
    modelLoader: e
  };
}
const cc = "3.4.0-KERNEL-CTX";
function mf(e) {
  if ($.initialized)
    return { ok: !0, message: "Already initialized" };
  const t = (e == null ? void 0 : e.eventBus) || e, r = e == null ? void 0 : e.ports;
  return $.eventBus = t, $.initialized = !0, r && sc(r), rf(), ut() && setTimeout(() => {
    ic();
  }, 500), G("info", `Initialized (enabled: ${ut()})`), { ok: !0, enabled: ut() };
}
function Ji() {
  return af("sidebar.accordion.ncs.enabled", !0), $.initialized && !$.enabled && ic(), { ok: !0, message: "Accordion NCS enabled. Reload for full effect." };
}
function Qi() {
  return af("sidebar.accordion.ncs.enabled", !1), $.enabled && oc(), { ok: !0, message: "Accordion NCS disabled." };
}
function dc() {
  return ut() ? Qi() : Ji();
}
function uc() {
  return $.accordion;
}
async function hc(e = !1) {
  return $.enabled && oc(), e && k.reload && await k.reload(), ut() ? ic() : Promise.resolve({ ok: !1, message: "Feature flag not enabled" });
}
function fc() {
  oc(), k.abort && k.abort(), $.initialized = !1, $.eventBus = null, $.modelLoaderReady = !1;
}
function pf() {
  fc();
}
function gc() {
  return k.getModel();
}
function mc() {
  return k.info ? k.info() : null;
}
function pc() {
  return k.reload ? k.reload() : null;
}
typeof window < "u" && (window.AccordionNCS = {
  VERSION: cc,
  enable: Ji,
  disable: Qi,
  toggle: dc,
  isEnabled: ut,
  reload: hc,
  getAccordion: uc,
  getNavigationModel: gc,
  getNavigationSnapshot: mc,
  invalidateNavigationCache: pc,
  healthCheck: ac,
  info: lc
});
var RI = {
  VERSION: cc,
  MODULE_ID: Xi,
  init: mf,
  cleanup: fc,
  enable: Ji,
  disable: Qi,
  toggle: dc,
  isEnabled: ut,
  reload: hc,
  getAccordion: uc,
  getNavigationModel: gc,
  getNavigationSnapshot: mc,
  invalidateNavigationCache: pc,
  destroy: pf,
  healthCheck: ac,
  info: lc,
  injectPorts: sc,
  getPorts: nf
};
const Ef = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Xi,
  VERSION: cc,
  cleanup: fc,
  default: RI,
  destroy: pf,
  disable: Qi,
  enable: Ji,
  getAccordion: uc,
  getNavigationModel: gc,
  getNavigationSnapshot: mc,
  getPorts: nf,
  healthCheck: ac,
  info: lc,
  init: mf,
  injectPorts: sc,
  invalidateNavigationCache: pc,
  isEnabled: ut,
  reload: hc,
  toggle: dc
}, Symbol.toStringTag, { value: "Module" })), eo = "7.1.0-ES6", ps = "sidebar-animated-transitions", zt = v({ moduleId: ps });
function xI() {
  zt.init();
}
function PI(e) {
  return zt.get(e);
}
function bf(e) {
  return zt.inject(e);
}
function _f() {
  return zt.snapshot();
}
let Ie = null, Ce = !0, Ke = null, kt = [], dn = [], Rr = { animations: 0, groups: 0, sections: 0, timersCreated: 0, timersCleared: 0 };
const ri = {
  fadeIn: "dsd-anim--fade-in",
  fadeOut: "dsd-anim--fade-out",
  slideIn: "dsd-anim--slide-in",
  slideOut: "dsd-anim--slide-out",
  scaleIn: "dsd-anim--scale-in",
  scaleOut: "dsd-anim--scale-out",
  bounceIn: "dsd-anim--bounce-in"
}, yf = { duration: 300, easing: "ease-out", stagger: 50, type: "slideIn" };
let je = { ...yf };
function xr(e, t) {
  Rr.timersCreated++;
  const r = setTimeout(() => {
    kt = kt.filter((n) => n !== r), e();
  }, t);
  return kt.push(r), r;
}
function HI() {
  kt.forEach((e) => {
    clearTimeout(e), Rr.timersCleared++;
  }), kt = [];
}
function Wd(e) {
  if (!Ce) return;
  ((e == null ? void 0 : e.items) || []).forEach((r, n) => {
    const s = Ie == null ? void 0 : Ie.querySelector(`[data-item-id="${r.id}"]`);
    s && xr(() => {
      It(s, "in");
    }, n * je.stagger);
  });
}
function Xd() {
  if (!Ce || !Ie) return;
  Ie.querySelectorAll(`.${C.ITEM}:not(.${C.ITEM_HIDDEN})`).forEach((t, r) => {
    t.classList.add("dsd-anim--searching"), xr(() => {
      t.classList.remove("dsd-anim--searching"), It(t, "in", "scaleIn");
    }, r * 30);
  });
}
function vf(e, t, r) {
  e && zt.inject({ eventBus: e }), xI(), Ie = t, je = { ...yf, ...r || {} }, Ie && (zI(), BI());
  const n = PI("eventBus");
  if (n && n.on) {
    const s = n.on(f.ITEMS_LOADED, Wd), i = n.on(f.SEARCH_RESULTS, Xd);
    dn.push(
      typeof s == "function" ? s : () => {
        n.off && n.off(f.ITEMS_LOADED, Wd);
      }
    ), dn.push(
      typeof i == "function" ? i : () => {
        n.off && n.off(f.SEARCH_RESULTS, Xd);
      }
    );
  }
  n && n.emit && n.emit(f.ANIMATED_TRANSITIONS_INITIALIZED);
}
function zI() {
  Ke && Ke.disconnect(), Ke = new MutationObserver((t) => {
    Ce && t.forEach((r) => {
      r.addedNodes.forEach((n) => {
        var s;
        n.nodeType === 1 && ((s = n.classList) != null && s.contains(C.ITEM)) && It(n, "in");
      });
    });
  });
  const e = Ie == null ? void 0 : Ie.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  e && Ke.observe(e, { childList: !0, subtree: !0 });
}
function BI() {
  if (!Ce || !Ie) return;
  Ie.querySelectorAll(`.${C.ITEM}`).forEach((t, r) => {
    t.style.opacity = "0", t.style.transform = "translateX(-10px)", xr(() => {
      It(t, "in");
    }, r * je.stagger);
  });
}
function It(e, t, r) {
  if (!e || !Ce) return Promise.resolve();
  Rr.animations++, t = t || "in";
  const n = r || je.type, s = t === "in" ? ri[n] || ri.slideIn : ri[n.replace("In", "Out")] || ri.slideOut;
  return new Promise((i) => {
    e.style.animationDuration = `${je.duration}ms`, e.style.animationTimingFunction = je.easing, e.classList.add(s);
    let o = !1;
    const a = () => {
      o || (o = !0, e.classList.remove(s), e.style.opacity = t === "in" ? "1" : "0", e.style.transform = "", i());
    }, l = () => {
      e.removeEventListener("animationend", l), a();
    };
    e.addEventListener("animationend", l), xr(a, je.duration + 50);
  });
}
function If(e, t, r) {
  Rr.groups++;
  const n = Array.from(e);
  return Promise.all(n.map((s, i) => new Promise((o) => {
    xr(() => {
      It(s, t, r).then(o).catch(() => {
        o();
      });
    }, i * je.stagger);
  })));
}
function Sf(e) {
  if (!Ce || !e) return;
  Rr.sections++, e.querySelectorAll(`.${C.ITEM}`).forEach((r, n) => {
    r.style.opacity = "0", xr(() => {
      It(r, "in", "slideIn");
    }, n * 40);
  });
}
function Cf(e) {
  if (!Ce || !e) return Promise.resolve();
  Rr.sections++;
  const t = Array.from(e.querySelectorAll(`.${C.ITEM}`)).reverse();
  return Promise.all(t.map((r, n) => new Promise((s) => {
    xr(() => {
      It(r, "out", "slideOut").then(s).catch(() => {
        s();
      });
    }, n * 20);
  })));
}
function Af(e) {
  je = { ...je, ...e };
}
function Mf() {
  Ce = !0;
}
function Of() {
  Ce = !1;
}
function Tf() {
  return Ce;
}
function Df() {
  dn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), dn = [], HI(), Ke == null || Ke.disconnect(), Ke = null, Ce = !1, Ie = null;
}
function to() {
  return { ...Rr, activeTimers: kt.length, cleanups: dn.length };
}
function Lf() {
  return {
    moduleId: ps,
    version: eo,
    portsInitialized: zt.isInitialized(),
    enabled: Ce,
    hasObserver: !!Ke,
    activeTimers: kt.length,
    cleanups: dn.length,
    config: { ...je },
    metrics: to(),
    p24Compliant: !0
  };
}
function $f() {
  return {
    status: zt.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: eo,
    moduleId: ps,
    portsInitialized: zt.isInitialized(),
    checks: { enabled: Ce, hasObserver: !!Ke, noOrphanTimers: kt.length < 50, noOrphanListeners: !0 },
    metrics: to(),
    p24Compliant: !0
  };
}
var UI = { init: vf, animateElement: It, animateGroup: If, animateSectionExpand: Sf, animateSectionCollapse: Cf, configure: Af, enable: Mf, disable: Of, isEnabled: Tf, destroy: Df, injectPorts: bf, getPorts: _f, getMetrics: to, info: Lf, healthCheck: $f, VERSION: eo, MODULE_ID: ps };
const kf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ps,
  VERSION: eo,
  animateElement: It,
  animateGroup: If,
  animateSectionCollapse: Cf,
  animateSectionExpand: Sf,
  configure: Af,
  default: UI,
  destroy: Df,
  disable: Of,
  enable: Mf,
  getMetrics: to,
  getPorts: _f,
  healthCheck: $f,
  info: Lf,
  init: vf,
  injectPorts: bf,
  isEnabled: Tf
}, Symbol.toStringTag, { value: "Module" })), ro = "6.1.0-ES6", Es = "sidebar-auto-theme", Bt = v({ moduleId: Es });
function jI() {
  Bt.init();
}
function Zd(e) {
  return Bt.get(e);
}
function wf(e) {
  return Bt.inject(e);
}
function Nf() {
  return Bt.snapshot();
}
const Rf = "dsd-sidebar-auto-theme", Jd = { dark: c.MOD_DARK, light: c.MOD_LIGHT, "high-contrast": c.MOD_HIGH_CONTRAST };
let bi = null, Qe = !0, xa = null, ai = null, _i = [], no = "dark", so = { themeChanges: 0, toggles: 0, errors: 0 };
function io() {
  var e, t;
  return (e = window.matchMedia) != null && e.call(window, "(prefers-color-scheme: light)").matches ? "light" : ((t = window.matchMedia) != null && t.call(window, "(prefers-color-scheme: dark)").matches, "dark");
}
function FI() {
  try {
    Qe = localStorage.getItem(Rf) !== "false";
  } catch {
    Qe = !0;
  }
}
function xf() {
  try {
    localStorage.setItem(Rf, String(Qe));
  } catch {
  }
}
function rl(e, t) {
  if (e) {
    if (Object.values(Jd).forEach((r) => {
      r && e.classList.remove(r);
    }), t !== "dark") {
      const r = Jd[t];
      r && e.classList.add(r);
    }
    no = t, so.themeChanges++;
  }
}
function Ec(e, t) {
  if (e && Bt.inject({ eventBus: e }), jI(), bi = t, FI(), !Qe) return;
  const r = io();
  rl(t, r), xa = window.matchMedia("(prefers-color-scheme: dark)"), ai = (s) => {
    if (Qe) {
      const i = s.matches ? "dark" : "light";
      rl(bi, i);
      const o = Zd("eventBus");
      o && o.emit && o.emit(f.THEME_CHANGED, { theme: i, auto: !0 });
    }
  }, xa.addEventListener("change", ai), _i.push(() => {
    xa.removeEventListener("change", ai);
  });
  const n = Zd("eventBus");
  n && n.emit && n.emit(f.AUTO_THEME_INITIALIZED);
}
function Pf(e, t) {
  return Ec(t, e), () => {
    bc();
  };
}
function Hf(e) {
  Qe = !0, so.toggles++, xf();
  const t = io();
  return rl(e || bi, t), t;
}
function zf() {
  Qe = !1, so.toggles++, xf();
}
function Bf() {
  return Qe;
}
function Uf() {
  return no;
}
function jf() {
  return io();
}
function bc() {
  _i.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), _i = [], ai = null, bi = null;
}
function oo() {
  return { ...so };
}
function Ff() {
  return { moduleId: Es, version: ro, portsInitialized: Bt.isInitialized(), autoEnabled: Qe, currentTheme: no, systemTheme: io(), cleanups: _i.length, metrics: oo() };
}
function Gf() {
  return { status: Bt.isInitialized() ? "HEALTHY" : "DEGRADED", version: ro, moduleId: Es, portsInitialized: Bt.isInitialized(), checks: { autoEnabled: Qe, currentTheme: no }, metrics: oo() };
}
var GI = { init: Ec, setupAutoTheme: Pf, enable: Hf, disable: zf, isEnabled: Bf, getCurrentTheme: Uf, getSystemPreference: jf, destroy: bc, injectPorts: wf, getPorts: Nf, getMetrics: oo, info: Ff, healthCheck: Gf, VERSION: ro, MODULE_ID: Es };
const Vf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Es,
  VERSION: ro,
  default: GI,
  destroy: bc,
  disable: zf,
  enable: Hf,
  getCurrentTheme: Uf,
  getMetrics: oo,
  getPorts: Nf,
  getSystemPreference: jf,
  healthCheck: Gf,
  info: Ff,
  init: Ec,
  injectPorts: wf,
  isEnabled: Bf,
  setupAutoTheme: Pf
}, Symbol.toStringTag, { value: "Module" })), Sn = "sidebar-command-palette", Cn = "6.6.0-ES6", Pr = v({ moduleId: Sn });
function VI() {
  Pr.init();
}
function st(e) {
  return Pr.get(e);
}
function qI(e) {
  return Pr.inject(e);
}
function YI() {
  return Pr.snapshot();
}
const cr = {
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M22 10H2"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.62 1.97"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
}, E = { initialized: !1, ctx: null, modal: null, input: null, results: null, commands: [], registered: [], filtered: [], selectedIndex: 0, opens: 0, executions: 0, errors: 0, cleanups: [] };
function br(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: Sn, version: Cn, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
const qf = [
  { id: "toggle-sidebar", label: "Alternar Barra Lateral", shortcut: "Ctrl+B", icon: cr.chevronLeft, keywords: ["toggle", "sidebar", "barra", "lateral", "menu", "recolher"], action() {
    const e = st("sidebar");
    e && e.toggle && e.toggle();
  } },
  { id: "collapse-all", label: "Recolher Todas as Seções", icon: cr.folder, keywords: ["collapse", "recolher", "fechar", "secoes", "grupos"], action() {
    const e = st("sidebar");
    e && e.collapseAllSections && e.collapseAllSections();
  } },
  { id: "expand-all", label: "Expandir Todas as Seções", icon: cr.folderOpen, keywords: ["expand", "expandir", "abrir", "secoes", "grupos"], action() {
    const e = st("sidebar");
    e && e.expandAllSections && e.expandAllSections();
  } },
  { id: "toggle-theme", label: "Alternar Tema", icon: cr.palette, keywords: ["theme", "tema", "claro", "escuro", "dark", "light", "modo"], action() {
    const e = st("sidebar");
    e && e.toggleTheme && e.toggleTheme();
  } },
  { id: "mini-mode", label: "Alternar Modo Compacto", icon: cr.pin, keywords: ["mini", "compacto", "colapsar", "estreito"], action() {
    const e = st("sidebar");
    e && e.toggleMiniMode && e.toggleMiniMode();
  } }
];
function KI() {
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
        icon: cr.play,
        shortcut: "",
        keywords: ["ir", "abrir", "navegar", "painel", "pagina", s.replace("#/", "")],
        action() {
          if (a && a.isConnected && a.click) {
            a.click();
            return;
          }
          const d = document.querySelector('.dsd-sidebar__link[href="' + s + '"]');
          d && d.click ? d.click() : window.location.href = s;
        }
      });
    });
  } catch {
  }
  return e;
}
function Qd(e) {
  (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), yc());
}
function _c() {
  E.opens++, WI(), E.modal && (E.modal.classList.add("dsd-command-palette--visible"), E.input && (E.input.value = "", E.input.focus()), E.commands = qf.concat(E.registered, KI()), E.selectedIndex = 0, Kf(E.commands));
  const e = st("eventBus");
  e && e.emit && e.emit(f.COMMAND_PALETTE_OPENED);
}
function un() {
  E.modal && E.modal.classList.remove("dsd-command-palette--visible");
  const e = st("eventBus");
  e && e.emit && e.emit(f.COMMAND_PALETTE_CLOSED);
}
function yc() {
  E.modal && E.modal.classList.contains("dsd-command-palette--visible") ? un() : _c();
}
function WI() {
  if (E.modal) return;
  E.modal = document.createElement("div"), E.modal.className = "dsd-command-palette", E.modal.innerHTML = '<div class="dsd-command-palette__backdrop"></div><div class="dsd-command-palette__container"><input type="text" class="dsd-command-palette__input" placeholder="Buscar comando ou painel..." /><div class="dsd-command-palette__results"></div></div>', document.body.appendChild(E.modal), E.input = E.modal.querySelector(".dsd-command-palette__input"), E.results = E.modal.querySelector(".dsd-command-palette__results");
  const e = E.modal.querySelector(".dsd-command-palette__backdrop"), t = () => {
    un();
  };
  e.addEventListener("click", t), E.cleanups.push(() => {
    e.removeEventListener("click", t);
  });
  const r = () => {
    Yf(E.input.value);
  };
  E.input.addEventListener("input", r), E.cleanups.push(() => {
    E.input.removeEventListener("input", r);
  });
  const n = (s) => {
    const i = E.results.querySelectorAll(".dsd-command-palette__item");
    s.key === "ArrowDown" ? (s.preventDefault(), E.selectedIndex = Math.min(E.selectedIndex + 1, i.length - 1), eu(i)) : s.key === "ArrowUp" ? (s.preventDefault(), E.selectedIndex = Math.max(E.selectedIndex - 1, 0), eu(i)) : s.key === "Enter" ? (s.preventDefault(), Wf(E.selectedIndex)) : s.key === "Escape" && (s.preventDefault(), un());
  };
  E.input.addEventListener("keydown", n), E.cleanups.push(() => {
    E.input.removeEventListener("keydown", n);
  });
}
function Yf(e) {
  const t = e.toLowerCase(), r = E.commands.filter((n) => n.label.toLowerCase().indexOf(t) !== -1 || n.id.toLowerCase().indexOf(t) !== -1 || n.keywords && n.keywords.some((s) => (s || "").toLowerCase().indexOf(t) !== -1));
  E.selectedIndex = 0, Kf(r);
}
function Kf(e) {
  if (!E.results) return;
  E.filtered = e, E.results.innerHTML = e.map((r, n) => `<div class="dsd-command-palette__item${n === E.selectedIndex ? " dsd-command-palette__item--selected" : ""}" data-index="${n}"><span class="dsd-command-palette__icon">${r.icon || cr.play}</span><span class="dsd-command-palette__label">${r.label}</span>${r.shortcut ? `<kbd class="dsd-command-palette__shortcut">${r.shortcut}</kbd>` : ""}</div>`).join(""), E.results.querySelectorAll(".dsd-command-palette__item").forEach((r, n) => {
    r.addEventListener("click", () => {
      Wf(n);
    });
  });
}
function eu(e) {
  e.forEach((t, r) => {
    r === E.selectedIndex ? t.classList.add("dsd-command-palette__item--selected") : t.classList.remove("dsd-command-palette__item--selected");
  });
}
function Wf(e) {
  const t = E.filtered && E.filtered.length ? E.filtered : E.commands;
  if (e >= 0 && e < t.length) {
    const r = t[e];
    E.executions++, un(), r.action && r.action();
    const n = st("eventBus");
    n && n.emit && n.emit(f.COMMAND_PALETTE_EXECUTED, { commandId: r.id });
  }
}
function Xf(e) {
  if (!e || !e.id) return br(!1, null, [{ code: "INVALID", message: "Command must have id" }]);
  const t = E.registered.findIndex((r) => r.id === e.id);
  return t >= 0 ? E.registered[t] = e : E.registered.push(e), br(!0, { commandId: e.id });
}
function Zf(e) {
  if (E.initialized) return br(!0, { alreadyInitialized: !0 });
  try {
    E.ctx = e, e && e.ports && Pr.inject(e.ports), VI(), E.commands = qf.slice(), document.addEventListener("keydown", Qd), E.cleanups.push(() => {
      document.removeEventListener("keydown", Qd);
    }), E.initialized = !0;
    const t = st("eventBus");
    return t && t.emit && t.emit(f.COMMAND_PALETTE_INITIALIZED, { version: Cn }), br(!0, { initialized: !0 });
  } catch (t) {
    return E.errors++, br(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Jf() {
  for (let e = 0; e < E.cleanups.length; e++)
    try {
      E.cleanups[e]();
    } catch {
    }
  return E.cleanups = [], E.modal && E.modal.parentNode && E.modal.parentNode.removeChild(E.modal), E.modal = null, E.input = null, E.results = null, E.initialized = !1, br(!0, { cleanedUp: !0 });
}
function Qf() {
  const e = {
    initialized: E.initialized,
    commandsRegistered: E.commands.length > 0,
    noErrors: E.errors === 0
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return E.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: Sn,
    version: Cn,
    portsInitialized: Pr.isInitialized(),
    checks: e,
    metrics: { opens: E.opens, executions: E.executions, commandsCount: E.commands.length, errors: E.errors },
    timestamp: Date.now()
  };
}
function eg() {
  return br(!0, {
    moduleId: Sn,
    version: Cn,
    portsInitialized: Pr.isInitialized(),
    initialized: E.initialized,
    commandsCount: E.commands.length,
    opens: E.opens,
    executions: E.executions
  });
}
function tg() {
  return { opens: E.opens, executions: E.executions, commandsCount: E.commands.length, errors: E.errors };
}
const rg = { singleton: !0, critical: !1, rendersUI: !0, category: "search", priority: "high" };
var XI = { id: Sn, version: Cn, capabilities: rg, init: Zf, cleanup: Jf, healthCheck: Qf, info: eg, getMetrics: tg, show: _c, hide: un, toggle: yc, registerCommand: Xf };
const ng = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Sn,
  VERSION: Cn,
  capabilities: rg,
  cleanup: Jf,
  default: XI,
  getMetrics: tg,
  getPorts: YI,
  healthCheck: Qf,
  hide: un,
  info: eg,
  init: Zf,
  injectPorts: qI,
  registerCommand: Xf,
  search: Yf,
  show: _c,
  toggle: yc
}, Symbol.toStringTag, { value: "Module" })), ao = "5.9.0-ES6", bs = "sidebar-compact-mode", Ut = v({ moduleId: bs });
function ZI() {
  Ut.init();
}
function vc(e) {
  return Ut.get(e);
}
function sg(e) {
  return Ut.inject(e);
}
function ig() {
  return Ut.snapshot();
}
const og = "dsd-sidebar-compact", Ic = "dsd-sidebar--compact";
let Hr = !1, K = null, lo = { enables: 0, disables: 0, toggles: 0 };
function JI() {
  try {
    return localStorage.getItem(og) === "true";
  } catch {
    return !1;
  }
}
function ag(e) {
  try {
    localStorage.setItem(og, String(e));
  } catch {
  }
}
function lg(e, t) {
  e && Ut.inject({ eventBus: e }), ZI(), K = t;
  const r = JI();
  r && t && co(t);
  const n = vc("eventBus");
  return n && n.emit && n.emit(f.COMPACT_INITIALIZED), r;
}
function co(e) {
  if (K = e || K, !K) return !1;
  K.classList.add(Ic), K.setAttribute("data-compact", "true"), Hr = !0, lo.enables++, ag(!0);
  const t = vc("eventBus");
  return t && t.emit && t.emit(f.COMPACT_ENABLED), !0;
}
function Sc(e) {
  if (K = e || K, !K) return !1;
  K.classList.remove(Ic), K.removeAttribute("data-compact"), Hr = !1, lo.disables++, ag(!1);
  const t = vc("eventBus");
  return t && t.emit && t.emit(f.COMPACT_DISABLED), !0;
}
function cg(e) {
  return K = e || K, lo.toggles++, Hr ? (Sc(K), !1) : (co(K), !0);
}
function dg() {
  return Hr;
}
function ug() {
  return K;
}
function hg() {
  K && (K.classList.remove(Ic), K.removeAttribute("data-compact")), K = null, Hr = !1;
}
function uo() {
  return { ...lo };
}
function fg() {
  return { moduleId: bs, version: ao, portsInitialized: Ut.isInitialized(), enabled: Hr, hasContainer: !!K, metrics: uo() };
}
function gg() {
  return { status: Ut.isInitialized() ? "HEALTHY" : "DEGRADED", version: ao, moduleId: bs, portsInitialized: Ut.isInitialized(), checks: { enabled: Hr, hasContainer: !!K }, metrics: uo() };
}
var QI = { init: lg, enable: co, disable: Sc, toggle: cg, isEnabled: dg, getContainer: ug, destroy: hg, injectPorts: sg, getPorts: ig, getMetrics: uo, info: fg, healthCheck: gg, VERSION: ao, MODULE_ID: bs };
const mg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: bs,
  VERSION: ao,
  default: QI,
  destroy: hg,
  disable: Sc,
  enable: co,
  getContainer: ug,
  getMetrics: uo,
  getPorts: ig,
  healthCheck: gg,
  info: fg,
  init: lg,
  injectPorts: sg,
  isEnabled: dg,
  toggle: cg
}, Symbol.toStringTag, { value: "Module" })), _s = "5.9.0-ES6", ys = "sidebar-config-manager", zr = v({ moduleId: ys });
function eS() {
  zr.init();
}
function tS(e) {
  return zr.get(e);
}
function pg(e) {
  return zr.inject(e);
}
function Eg() {
  return zr.snapshot();
}
let ke = { exports: 0, imports: 0, resets: 0, errors: 0 };
const Br = ["dsd-sidebar-collapsed", "dsd-sidebar-width", "dsd-sidebar-theme", "dsd-sidebar-auto-theme", "dsd-sidebar-favorites", "dsd-sidebar-recent", "dsd-sidebar-order", "dsd-sidebar-expanded-sections"];
function bg(e) {
  e && zr.inject({ eventBus: e }), eS();
  const t = tS("eventBus");
  t && t.emit && t.emit(f.CONFIG_INITIALIZED);
}
function Cc() {
  const e = { version: _s, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), settings: {} };
  return Br.forEach((t) => {
    try {
      const r = localStorage.getItem(t);
      r !== null && (e.settings[t] = r);
    } catch {
      ke.errors++;
    }
  }), ke.exports++, e;
}
function Ac() {
  return JSON.stringify(Cc(), null, 2);
}
function _g(e = "sidebar-config.json") {
  const t = Ac(), r = new Blob([t], { type: "application/json" }), n = URL.createObjectURL(r), s = document.createElement("a");
  s.href = n, s.download = e, s.click(), URL.revokeObjectURL(n);
}
function Mc(e) {
  if (!(e != null && e.settings))
    throw ke.errors++, new Error("Invalid config format");
  const t = [], r = [];
  return Object.entries(e.settings).forEach((n) => {
    const s = n[0], i = n[1];
    try {
      Br.includes(s) && (localStorage.setItem(s, i), t.push(s));
    } catch {
      r.push(s), ke.errors++;
    }
  }), ke.imports++, { imported: t, failed: r, total: Object.keys(e.settings).length };
}
function Oc(e) {
  const t = JSON.parse(e);
  return Mc(t);
}
function yg(e) {
  return new Promise((t, r) => {
    const n = new FileReader();
    n.onload = (s) => {
      try {
        const i = Oc(s.target.result);
        t(i);
      } catch (i) {
        ke.errors++, r(i);
      }
    }, n.onerror = () => {
      ke.errors++, r(new Error("Failed to read file"));
    }, n.readAsText(e);
  });
}
function vg() {
  Br.forEach((e) => {
    try {
      localStorage.removeItem(e);
    } catch {
      ke.errors++;
    }
  }), ke.resets++;
}
function Tc() {
  const e = {};
  return Br.forEach((t) => {
    try {
      const r = localStorage.getItem(t);
      e[t] = r !== null;
    } catch {
      e[t] = !1;
    }
  }), e;
}
function Ig() {
}
function ho() {
  return { ...ke };
}
function Sg() {
  return { moduleId: ys, version: _s, portsInitialized: zr.isInitialized(), configKeys: Br.length, summary: Tc(), metrics: ho() };
}
function Cg() {
  return { status: ke.errors === 0 ? "HEALTHY" : "DEGRADED", version: _s, moduleId: ys, portsInitialized: zr.isInitialized(), checks: { configKeys: Br.length, noErrors: ke.errors === 0 }, metrics: ho() };
}
var rS = { init: bg, exportConfig: Cc, exportConfigAsJSON: Ac, downloadConfig: _g, importConfig: Mc, importConfigFromJSON: Oc, importConfigFromFile: yg, resetConfig: vg, getConfigSummary: Tc, destroy: Ig, injectPorts: pg, getPorts: Eg, getMetrics: ho, info: Sg, healthCheck: Cg, VERSION: _s, MODULE_ID: ys, CONFIG_KEYS: Br };
const Ag = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ys,
  VERSION: _s,
  default: rS,
  destroy: Ig,
  downloadConfig: _g,
  exportConfig: Cc,
  exportConfigAsJSON: Ac,
  getConfigSummary: Tc,
  getMetrics: ho,
  getPorts: Eg,
  healthCheck: Cg,
  importConfig: Mc,
  importConfigFromFile: yg,
  importConfigFromJSON: Oc,
  info: Sg,
  init: bg,
  injectPorts: pg,
  resetConfig: vg
}, Symbol.toStringTag, { value: "Module" })), fo = "6.1.0-ES6", vs = "sidebar-context-menu", Ur = v({ moduleId: vs });
function nS() {
  Ur.init();
}
function sS(e) {
  return Ur.get(e);
}
function Mg(e) {
  return Ur.inject(e);
}
function Og() {
  return Ur.snapshot();
}
const Hn = {
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  externalLink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  eyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};
let B = null, go = null, hn = {}, _r = [], yi = [], hr = { opens: 0, closes: 0, actions: 0, errors: 0 };
const Tg = [
  { id: "favorite", label: "Adicionar aos favoritos", icon: Hn.star },
  { id: "open-new", label: "Abrir em nova aba", icon: Hn.externalLink },
  { id: "copy-link", label: "Copiar link", icon: Hn.link },
  { id: "separator", type: "separator" },
  { id: "hide", label: "Ocultar item", icon: Hn.eyeOff },
  { id: "info", label: "Informações", icon: Hn.info }
];
function iS() {
  if (B) return B;
  B = document.createElement("div"), B.className = c.CONTEXT_MENU, B.setAttribute("role", "menu"), B.setAttribute("aria-hidden", "true"), document.body.appendChild(B);
  const e = (n) => {
    B.contains(n.target) || sn();
  };
  document.addEventListener("click", e), _r.push(() => {
    document.removeEventListener("click", e);
  });
  const t = (n) => {
    B.contains(n.target) || sn();
  };
  document.addEventListener("contextmenu", t), _r.push(() => {
    document.removeEventListener("contextmenu", t);
  });
  const r = (n) => {
    n.key === "Escape" && sn();
  };
  return document.addEventListener("keydown", r), _r.push(() => {
    document.removeEventListener("keydown", r);
  }), B;
}
function Dg() {
  yi.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), yi = [];
}
function oS(e) {
  Dg(), B.innerHTML = "", e.forEach((t) => {
    if (t.type === "separator") {
      const s = document.createElement("div");
      s.className = c.CONTEXT_MENU_SEPARATOR, B.appendChild(s);
      return;
    }
    const r = document.createElement("button");
    r.className = c.CONTEXT_MENU_ITEM, r.setAttribute("type", "button"), r.setAttribute("role", "menuitem"), r.setAttribute("data-action", t.id), r.innerHTML = `<span class="${c.CONTEXT_MENU_ICON}">${t.icon || ""}</span><span class="${c.CONTEXT_MENU_LABEL}">${t.label}</span>`;
    const n = () => {
      hr.actions++, hn[t.id] && hn[t.id](go, t), sn();
    };
    r.addEventListener("click", n), yi.push(() => {
      r.removeEventListener("click", n);
    }), B.appendChild(r);
  });
}
function Lg(e) {
  e && Ur.inject({ eventBus: e }), nS();
  const t = sS("eventBus");
  t && t.emit && t.emit(f.CONTEXT_INITIALIZED);
}
function Dc(e, t, r, n) {
  iS(), go = r, hr.opens++, oS(n || Tg), B.style.left = `${e}px`, B.style.top = `${t}px`, B.classList.add(c.CONTEXT_MENU_VISIBLE), B.setAttribute("aria-hidden", "false"), requestAnimationFrame(() => {
    const i = B.getBoundingClientRect();
    i.right > window.innerWidth && (B.style.left = `${window.innerWidth - i.width - 10}px`), i.bottom > window.innerHeight && (B.style.top = `${window.innerHeight - i.height - 10}px`);
  });
}
function sn() {
  B && (B.classList.remove(c.CONTEXT_MENU_VISIBLE), B.setAttribute("aria-hidden", "true"), hr.closes++), go = null;
}
function $g(e, t) {
  hn[e] = t;
}
function kg(e, t) {
  if (!e) return () => {
  };
  const r = (n) => {
    const s = n.target.closest(`.${c.ITEM}`);
    if (!s) return;
    n.preventDefault();
    const i = s.dataset.itemId;
    Dc(n.clientX, n.clientY, i, t);
  };
  return e.addEventListener("contextmenu", r), _r.push(() => {
    e.removeEventListener("contextmenu", r);
  }), () => {
    Lc();
  };
}
function Lc() {
  Dg(), _r.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), _r = [], B && (B.remove(), B = null), hn = {};
}
function mo() {
  return { opens: hr.opens, closes: hr.closes, actions: hr.actions, errors: hr.errors };
}
function wg() {
  return { moduleId: vs, version: fo, portsInitialized: Ur.isInitialized(), menuCreated: !!B, handlersCount: Object.keys(hn).length, currentItemId: go, cleanups: _r.length, itemCleanups: yi.length, metrics: mo() };
}
function Ng() {
  return { status: "HEALTHY", version: fo, moduleId: vs, portsInitialized: Ur.isInitialized(), checks: { menuCreated: !!B, handlersCount: Object.keys(hn).length }, metrics: mo() };
}
var aS = { init: Lg, showMenu: Dc, hideMenu: sn, onAction: $g, setupContextMenu: kg, destroy: Lc, injectPorts: Mg, getPorts: Og, getMetrics: mo, info: wg, healthCheck: Ng, VERSION: fo, MODULE_ID: vs, DEFAULT_ACTIONS: Tg };
const Rg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: vs,
  VERSION: fo,
  default: aS,
  destroy: Lc,
  getMetrics: mo,
  getPorts: Og,
  healthCheck: Ng,
  hideMenu: sn,
  info: wg,
  init: Lg,
  injectPorts: Mg,
  onAction: $g,
  setupContextMenu: kg,
  showMenu: Dc
}, Symbol.toStringTag, { value: "Module" })), po = "5.9.0-ES6", Is = "sidebar-debug-panel", jt = v({ moduleId: Is });
function lS() {
  jt.init();
}
function tu(e) {
  return jt.get(e);
}
function xg(e) {
  return jt.inject(e);
}
function Pg() {
  return jt.snapshot();
}
const Hg = {
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};
let At = null, wt = null, Ft = !1, We = [];
const ru = 100;
let on = { opens: 0, closes: 0, logsAdded: 0 }, fn = [];
const cS = '.dsd-debug-panel{position:fixed;bottom:20px;right:20px;width:400px;max-height:500px;background:#1e1e2e;border:1px solid #3a3a5a;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:99999;font-family:"SF Mono","Fira Code",monospace;font-size:12px;color:#e0e0e0;display:flex;flex-direction:column;overflow:hidden;animation:debugPanelSlideIn 0.3s ease}@keyframes debugPanelSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.dsd-debug-panel__header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#2a2a4a;border-bottom:1px solid #3a3a5a;cursor:move}.dsd-debug-panel__title{font-weight:600;color:#a855f7}.dsd-debug-panel__actions{display:flex;gap:8px}.dsd-debug-panel__btn{background:transparent;border:1px solid #3a3a5a;color:#a0a0a0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center}.dsd-debug-panel__btn:hover{background:#3a3a5a;color:white}.dsd-debug-panel__tabs{display:flex;border-bottom:1px solid #3a3a5a}.dsd-debug-panel__tab{flex:1;padding:8px;background:transparent;border:none;color:#808080;cursor:pointer;font-size:11px;transition:all 0.15s ease}.dsd-debug-panel__tab--active{color:#a855f7;background:rgba(168,85,247,0.1);border-bottom:2px solid #a855f7}.dsd-debug-panel__content{flex:1;overflow-y:auto;padding:12px;max-height:350px}.dsd-debug-panel__section{margin-bottom:12px}.dsd-debug-panel__section-title{font-size:10px;text-transform:uppercase;color:#808080;margin-bottom:8px;letter-spacing:0.5px}.dsd-debug-panel__state-item{display:flex;justify-content:space-between;padding:4px 8px;background:#2a2a3a;border-radius:4px;margin-bottom:4px}.dsd-debug-panel__state-key{color:#7dd3fc}.dsd-debug-panel__state-value{color:#fbbf24;display:flex;align-items:center}.dsd-debug-panel__log{padding:6px 8px;border-left:3px solid #3a3a5a;margin-bottom:4px;font-size:11px}.dsd-debug-panel__log--info{border-color:#3b82f6}.dsd-debug-panel__log--warn{border-color:#f59e0b}.dsd-debug-panel__log--error{border-color:#ef4444}.dsd-debug-panel__log--event{border-color:#a855f7}.dsd-debug-panel__log-time{color:#808080;margin-right:8px}';
function nu(e) {
  e.ctrlKey && e.shiftKey && e.key === "D" && (e.preventDefault(), kc());
}
function zg(e, t) {
  var n, s;
  At = e, e && jt.inject({ eventBus: e }), lS(), dS(), uS(), document.addEventListener("keydown", nu), fn.push(() => {
    document.removeEventListener("keydown", nu);
  }), (s = (n = tu("logger")) == null ? void 0 : n.info) == null || s.call(n, "[DebugPanel] Initialized. Press Ctrl+Shift+D to open.");
  const r = tu("eventBus");
  r && r.emit && r.emit(f.DEBUG_PANEL_INITIALIZED);
}
function dS() {
  if (document.getElementById("dsd-debug-panel-styles")) return;
  const e = document.createElement("style");
  e.id = "dsd-debug-panel-styles", e.textContent = cS, document.head.appendChild(e);
}
function uS() {
  if (!At || !At.on) return;
  const e = At.emit ? At.emit.bind(At) : null;
  e && (At.emit = (t, r) => (wc("event", t, r), e(t, r)));
}
function su(e) {
  const t = e.target.dataset.action, r = e.target.dataset.tab;
  t === "close" && Ss(), t === "refresh" && es(), t === "clear" && ES(), r && (wt.querySelectorAll(".dsd-debug-panel__tab").forEach((n) => {
    n.classList.toggle("dsd-debug-panel__tab--active", n.dataset.tab === r);
  }), es(r));
}
function $c() {
  Ft || (wt = hS(), document.body.appendChild(wt), Ft = !0, on.opens++, es("state"));
}
function Ss() {
  !Ft || !wt || (wt.remove(), wt = null, Ft = !1, on.closes++);
}
function kc() {
  Ft ? Ss() : $c();
}
function hS() {
  const e = document.createElement("div");
  return e.className = "dsd-debug-panel", e.innerHTML = `<div class="dsd-debug-panel__header"><span class="dsd-debug-panel__title">🔧 Sidebar Debug</span><div class="dsd-debug-panel__actions"><button class="dsd-debug-panel__btn" data-action="refresh">↻</button><button class="dsd-debug-panel__btn" data-action="clear">Clear</button><button class="dsd-debug-panel__btn" data-action="close">${Hg.close}</button></div></div><div class="dsd-debug-panel__tabs"><button class="dsd-debug-panel__tab dsd-debug-panel__tab--active" data-tab="state">State</button><button class="dsd-debug-panel__tab" data-tab="events">Events</button><button class="dsd-debug-panel__tab" data-tab="perf">Perf</button><button class="dsd-debug-panel__tab" data-tab="features">Features</button></div><div class="dsd-debug-panel__content"></div>`, e.addEventListener("click", su), fn.push(() => {
    e.removeEventListener("click", su);
  }), bS(e), e;
}
function es(e) {
  const t = e || "state", r = wt ? wt.querySelector(".dsd-debug-panel__content") : null;
  r && (t === "state" ? r.innerHTML = fS() : t === "events" ? r.innerHTML = gS() : t === "perf" ? r.innerHTML = mS() : t === "features" && (r.innerHTML = pS()));
}
function fS() {
  const e = window.Sidebar && window.Sidebar.getState ? window.Sidebar.getState() : {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Current State</div>${Object.keys(e).map((t) => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${t}</span><span class="dsd-debug-panel__state-value">${JSON.stringify(e[t])}</span></div>`).join("")}</div>`;
}
function gS() {
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Recent Events (${We.length})</div>${We.slice(-50).reverse().map((e) => `<div class="dsd-debug-panel__log dsd-debug-panel__log--${e.type}"><span class="dsd-debug-panel__log-time">${e.time}</span>${e.message}</div>`).join("")}</div>`;
}
function mS() {
  const e = window.Sidebar && window.Sidebar.getMetrics ? window.Sidebar.getMetrics() : {}, t = performance.memory || {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Performance</div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">Render Count</span><span class="dsd-debug-panel__state-value">${e.renderCount || 0}</span></div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">JS Heap</span><span class="dsd-debug-panel__state-value">${_S(t.usedJSHeapSize || 0)}</span></div></div>`;
}
function pS() {
  const e = window.__dev && window.__dev.sidebar && window.__dev.sidebar.features ? window.__dev.sidebar.features : {};
  return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Loaded Features</div>${Object.keys(e).map((t) => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${t}</span><span class="dsd-debug-panel__state-value">${Hg.check}</span></div>`).join("")}</div>`;
}
function wc(e, t, r) {
  We.push({ type: e, message: t, data: r || null, time: (/* @__PURE__ */ new Date()).toLocaleTimeString() }), on.logsAdded++, We.length > ru && (We = We.slice(-ru)), Ft && es("events");
}
function ES() {
  We = [], es("events");
}
function bS(e) {
  const t = e.querySelector(".dsd-debug-panel__header");
  let r = !1, n, s, i, o;
  const a = (u) => {
    r = !0, n = u.clientX, s = u.clientY;
    const h = e.getBoundingClientRect();
    i = h.left, o = h.top;
  }, l = (u) => {
    r && (e.style.left = `${i + u.clientX - n}px`, e.style.top = `${o + u.clientY - s}px`, e.style.right = "auto", e.style.bottom = "auto");
  }, d = () => {
    r = !1;
  };
  t.addEventListener("mousedown", a), document.addEventListener("mousemove", l), document.addEventListener("mouseup", d), fn.push(() => {
    t.removeEventListener("mousedown", a), document.removeEventListener("mousemove", l), document.removeEventListener("mouseup", d);
  });
}
function _S(e) {
  if (e === 0) return "0 B";
  const t = 1024, r = ["B", "KB", "MB", "GB"], n = Math.floor(Math.log(e) / Math.log(t));
  return `${parseFloat((e / Math.pow(t, n)).toFixed(2))} ${r[n]}`;
}
function Bg() {
  Ss(), fn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), fn = [], At = null;
}
function Eo() {
  return { opens: on.opens, closes: on.closes, logsAdded: on.logsAdded, logCount: We.length };
}
function Ug() {
  return { moduleId: Is, version: po, portsInitialized: jt.isInitialized(), isOpen: Ft, logCount: We.length, cleanups: fn.length, metrics: Eo() };
}
function jg() {
  return { status: jt.isInitialized() ? "HEALTHY" : "DEGRADED", version: po, moduleId: Is, portsInitialized: jt.isInitialized(), checks: { isOpen: Ft, logCount: We.length, noOrphanListeners: !0 }, metrics: Eo() };
}
var yS = { init: zg, open: $c, close: Ss, toggle: kc, log: wc, destroy: Bg, injectPorts: xg, getPorts: Pg, getMetrics: Eo, info: Ug, healthCheck: jg, VERSION: po, MODULE_ID: Is };
const Fg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Is,
  VERSION: po,
  close: Ss,
  default: yS,
  destroy: Bg,
  getMetrics: Eo,
  getPorts: Pg,
  healthCheck: jg,
  info: Ug,
  init: zg,
  injectPorts: xg,
  log: wc,
  open: $c,
  toggle: kc
}, Symbol.toStringTag, { value: "Module" })), bo = "6.1.0-ES6", Cs = "sidebar-dynamic-badges", Gt = v({ moduleId: Cs });
function vS() {
  Gt.init();
}
function _o(e) {
  return Gt.get(e);
}
function Gg(e) {
  return Gt.inject(e);
}
function Vg() {
  return Gt.snapshot();
}
let we = /* @__PURE__ */ new Map(), Se = /* @__PURE__ */ new Map(), Qr = null, As = { sets: 0, removes: 0, increments: 0, decrements: 0 };
const iu = {
  count: { class: "dsd-badge--count", format: (e) => e > 99 ? "99+" : String(e) },
  dot: { class: "dsd-badge--dot", format: () => "" },
  new: { class: "dsd-badge--new", format: () => "NEW" },
  hot: { class: "dsd-badge--hot", format: () => "HOT" },
  live: { class: "dsd-badge--live", format: () => "●" },
  status: { class: "dsd-badge--status", format: (e) => e },
  percent: { class: "dsd-badge--percent", format: (e) => `${e}%` },
  time: { class: "dsd-badge--time", format: (e) => e }
};
function qg(e, t) {
  e && Gt.inject({ eventBus: e }), vS(), Qr = t;
  const r = _o("eventBus");
  r && r.emit && r.emit(f.BADGES_INITIALIZED);
}
function gn(e, t = {}) {
  const { value: r = 0, type: n = "count", variant: s = "default", pulse: i = !1, animate: o = !0, tooltip: a = null, onClick: l = null } = t;
  we.set(e, { value: r, type: n, variant: s, pulse: i, animate: o, tooltip: a, onClick: l, updatedAt: Date.now() }), As.sets++, Nc(e);
  const d = _o("eventBus");
  return d && d.emit && d.emit(f.BADGE_UPDATED, { itemId: e, value: r, type: n }), !0;
}
function Yg(e) {
  return we.get(e) || null;
}
function yo(e) {
  we.delete(e), clearInterval(Se.get(e)), Se.delete(e), As.removes++;
  const t = Rc(e);
  if (t) {
    const n = t.querySelector(".dsd-badge");
    n && n.remove();
  }
  const r = _o("eventBus");
  return r && r.emit && r.emit(f.BADGE_REMOVED, { itemId: e }), !0;
}
function Kg(e, t = 1) {
  As.increments++;
  const r = we.get(e);
  if (!r) return gn(e, { value: t });
  r.value = (r.value || 0) + t, r.updatedAt = Date.now(), Nc(e);
  const n = _o("eventBus");
  return n && n.emit && n.emit(f.BADGE_INCREMENTED, { itemId: e, value: r.value, amount: t }), r.value;
}
function Wg(e, t = 1) {
  As.decrements++;
  const r = we.get(e);
  return r ? (r.value = Math.max(0, (r.value || 0) - t), r.updatedAt = Date.now(), r.value === 0 && r.type === "count" ? (yo(e), 0) : (Nc(e), r.value)) : 0;
}
function Xg(e, t, r = 3e4) {
  clearInterval(Se.get(e));
  const n = async () => {
    try {
      const i = await t();
      gn(e, { value: i, type: "count", pulse: !0 });
    } catch {
    }
  };
  n();
  const s = setInterval(n, r);
  return Se.set(e, s), () => {
    clearInterval(s), Se.delete(e);
  };
}
function Zg(e, t, r = null) {
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
  gn(e, { value: s(n), type: "time", pulse: !0 });
  const i = setInterval(() => {
    if (n--, n <= 0) {
      clearInterval(i), Se.delete(e), yo(e), r && r();
      return;
    }
    gn(e, { value: s(n), type: "time", pulse: n <= 10 });
  }, 1e3);
  return Se.set(e, i), () => {
    clearInterval(i), Se.delete(e);
  };
}
function Nc(e) {
  const t = Rc(e);
  if (!t) return;
  const r = we.get(e);
  if (!r) return;
  const { value: n, type: s, variant: i, pulse: o, animate: a, tooltip: l, onClick: d } = r, u = iu[s] || iu.count;
  let h = t.querySelector(".dsd-badge");
  if (!h) {
    h = document.createElement("span"), h.className = "dsd-badge";
    const g = t.querySelector(`.${c.ITEM_LABEL}`);
    g ? g.after(h) : t.appendChild(h);
  }
  h.className = `dsd-badge ${u.class}`, i && i !== "default" && h.classList.add(`dsd-badge--${i}`), o && h.classList.add("dsd-badge--pulse"), a && h.classList.add("dsd-badge--animate"), h.textContent = u.format(n), l && (h.title = l), d && (h.style.cursor = "pointer", h.onclick = (g) => {
    g.stopPropagation(), d(e, n);
  });
}
function Rc(e) {
  return Qr || (Qr = document.querySelector(`.${c.ROOT}`)), Qr ? Qr.querySelector(`[data-item-id="${e}"], [data-panel-id="${e}"]`) : null;
}
function Jg() {
  const e = {};
  return we.forEach((t, r) => {
    e[r] = { ...t };
  }), e;
}
function xc() {
  Se.forEach((e) => clearInterval(e)), Se.clear(), we.forEach((e, t) => {
    const r = Rc(t);
    if (r) {
      const n = r.querySelector(".dsd-badge");
      n && n.remove();
    }
  }), we.clear();
}
function Qg() {
  xc(), Qr = null;
}
function vo() {
  return { ...As, badgeCount: we.size, liveUpdates: Se.size };
}
function em() {
  return { moduleId: Cs, version: bo, portsInitialized: Gt.isInitialized(), badgeCount: we.size, liveUpdates: Se.size, metrics: vo() };
}
function tm() {
  return { status: Gt.isInitialized() ? "HEALTHY" : "DEGRADED", version: bo, moduleId: Cs, portsInitialized: Gt.isInitialized(), checks: { badgeCount: we.size, liveUpdates: Se.size }, metrics: vo() };
}
var IS = { init: qg, setBadge: gn, getBadge: Yg, removeBadge: yo, incrementBadge: Kg, decrementBadge: Wg, setLiveBadge: Xg, setCountdownBadge: Zg, getAllBadges: Jg, clearAllBadges: xc, destroy: Qg, injectPorts: Gg, getPorts: Vg, getMetrics: vo, info: em, healthCheck: tm, VERSION: bo, MODULE_ID: Cs };
const rm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Cs,
  VERSION: bo,
  clearAllBadges: xc,
  decrementBadge: Wg,
  default: IS,
  destroy: Qg,
  getAllBadges: Jg,
  getBadge: Yg,
  getMetrics: vo,
  getPorts: Vg,
  healthCheck: tm,
  incrementBadge: Kg,
  info: em,
  init: qg,
  injectPorts: Gg,
  removeBadge: yo,
  setBadge: gn,
  setCountdownBadge: Zg,
  setLiveBadge: Xg
}, Symbol.toStringTag, { value: "Module" })), Io = "6.1.0-ES6", Ms = "sidebar-favorites", Vt = v({ moduleId: Ms });
function SS() {
  Vt.init();
}
function So(e) {
  return Vt.get(e);
}
function nm(e) {
  return Vt.inject(e);
}
function sm() {
  return Vt.snapshot();
}
const im = "dsd-sidebar-favorites";
let me = /* @__PURE__ */ new Set(), vi = [], Os = { adds: 0, removes: 0, toggles: 0, clears: 0 };
function CS() {
  try {
    const e = localStorage.getItem(im);
    me = new Set(e ? JSON.parse(e) : []);
  } catch {
    me = /* @__PURE__ */ new Set();
  }
}
function Pc() {
  try {
    localStorage.setItem(im, JSON.stringify([...me]));
  } catch {
  }
}
function om(e) {
  e && Vt.inject({ eventBus: e }), SS(), CS();
  const t = So("eventBus");
  t && t.emit && t.emit(f.FAVORITES_INITIALIZED);
}
function Hc(e) {
  if (!e) return !1;
  me.add(e), Os.adds++, Pc();
  const t = So("eventBus");
  return t && t.emit && t.emit(f.FAVORITE_ADDED, { itemId: e }), !0;
}
function zc(e) {
  const t = me.delete(e);
  if (t) {
    Os.removes++, Pc();
    const r = So("eventBus");
    r && r.emit && r.emit(f.FAVORITE_REMOVED, { itemId: e });
  }
  return t;
}
function Bc(e) {
  return Os.toggles++, me.has(e) ? zc(e) ? !1 : null : Hc(e) ? !0 : null;
}
function am(e) {
  return me.has(e);
}
function Uc() {
  return [...me];
}
function lm() {
  me.clear(), Os.clears++, Pc();
  const e = So("eventBus");
  e && e.emit && e.emit(f.FAVORITES_CLEARED);
}
function cm(e) {
  e && (e.querySelectorAll(`.${c.ITEM_FAVORITE}`).forEach((t) => {
    t.classList.remove(c.ITEM_FAVORITE);
  }), me.forEach((t) => {
    const r = e.querySelector(`[data-item-id="${t}"]`);
    r && r.classList.add(c.ITEM_FAVORITE);
  }));
}
function dm(e) {
  const t = document.createElement("button");
  t.className = c.FAVORITE_BTN, t.setAttribute("type", "button"), t.setAttribute("aria-label", "Adicionar aos favoritos"), t.setAttribute("data-item-id", e), t.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', me.has(e) && t.classList.add(c.FAVORITE_BTN_ACTIVE);
  const r = (n) => {
    n.preventDefault(), n.stopPropagation();
    const s = Bc(e);
    t.classList.toggle(c.FAVORITE_BTN_ACTIVE, s);
  };
  return t.addEventListener("click", r), vi.push(() => t.removeEventListener("click", r)), t;
}
function um() {
  vi.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), vi = [], me.clear();
}
function Co() {
  return { ...Os, favoritesCount: me.size };
}
function hm() {
  return { moduleId: Ms, version: Io, portsInitialized: Vt.isInitialized(), favoritesCount: me.size, favorites: Uc(), cleanups: vi.length, metrics: Co() };
}
function fm() {
  return { status: Vt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Io, moduleId: Ms, portsInitialized: Vt.isInitialized(), checks: { favoritesCount: me.size, noOrphanListeners: !0 }, metrics: Co() };
}
var AS = { init: om, addFavorite: Hc, removeFavorite: zc, toggleFavorite: Bc, isFavorite: am, getFavorites: Uc, clearFavorites: lm, markFavoriteItems: cm, createFavoriteButton: dm, destroy: um, injectPorts: nm, getPorts: sm, getMetrics: Co, info: hm, healthCheck: fm, VERSION: Io, MODULE_ID: Ms };
const gm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ms,
  VERSION: Io,
  addFavorite: Hc,
  clearFavorites: lm,
  createFavoriteButton: dm,
  default: AS,
  destroy: um,
  getFavorites: Uc,
  getMetrics: Co,
  getPorts: sm,
  healthCheck: fm,
  info: hm,
  init: om,
  injectPorts: nm,
  isFavorite: am,
  markFavoriteItems: cm,
  removeFavorite: zc,
  toggleFavorite: Bc
}, Symbol.toStringTag, { value: "Module" })), Ao = "6.0.0-ES6", Ts = "sidebar-feature-flags", qt = v({ moduleId: Ts });
function MS() {
  qt.init();
}
function An(e) {
  return qt.get(e);
}
function mm(e) {
  return qt.inject(e);
}
function pm() {
  return qt.snapshot();
}
const Em = "dsd-sidebar-feature-flags";
let Ds = { enables: 0, disables: 0, toggles: 0, resets: 0 };
const Ii = {
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
let F = {};
function OS() {
  try {
    const e = localStorage.getItem(Em), t = e ? JSON.parse(e) : {};
    F = {}, Object.entries(Ii).forEach(([r, n]) => {
      var s;
      F[r] = { ...n, enabled: ((s = t[r]) == null ? void 0 : s.enabled) ?? n.enabled };
    });
  } catch {
    F = { ...Ii };
  }
}
function Ls() {
  try {
    localStorage.setItem(Em, JSON.stringify(F));
  } catch {
  }
}
function bm(e) {
  e && qt.inject({ eventBus: e }), MS(), OS();
  const t = An("eventBus");
  t && t.emit && t.emit(f.FLAGS_INITIALIZED);
}
function _m(e) {
  var t;
  return ((t = F[e]) == null ? void 0 : t.enabled) ?? !1;
}
function ym(e) {
  if (!F[e]) return !1;
  F[e].enabled = !0, Ds.enables++, Ls();
  const t = An("eventBus");
  return t && t.emit && t.emit(f.FEATURE_ENABLED, { feature: e }), !0;
}
function vm(e) {
  if (!F[e]) return !1;
  F[e].enabled = !1, Ds.disables++, Ls();
  const t = An("eventBus");
  return t && t.emit && t.emit(f.FEATURE_DISABLED, { feature: e }), !0;
}
function Im(e) {
  if (!F[e]) return null;
  Ds.toggles++;
  const t = !F[e].enabled;
  F[e].enabled = t, Ls();
  const r = An("eventBus");
  return r && r.emit && r.emit(f.FEATURE_TOGGLED, { feature: e, enabled: t }), t;
}
function Sm() {
  return { ...F };
}
function Cm(e) {
  return Object.entries(F).filter(([t, r]) => r.category === e).map(([t, r]) => ({ key: t, ...r }));
}
function jc() {
  return [...new Set(Object.values(F).map((t) => t.category))];
}
function Am() {
  F = { ...Ii }, Ds.resets++, Ls();
  const e = An("eventBus");
  e && e.emit && e.emit(f.FEATURES_RESET);
}
function Mm(e) {
  Object.entries(e).forEach(([r, n]) => {
    F[r] && (F[r].enabled = n);
  }), Ls();
  const t = An("eventBus");
  t && t.emit && t.emit(f.FEATURES_BULK_UPDATED, { updates: e });
}
function Om() {
  F = {};
}
function Mo() {
  const e = Object.values(F).filter((t) => t.enabled).length;
  return { ...Ds, totalFeatures: Object.keys(F).length, enabledFeatures: e };
}
function Tm() {
  return { moduleId: Ts, version: Ao, portsInitialized: qt.isInitialized(), totalFeatures: Object.keys(F).length, enabledFeatures: Object.values(F).filter((e) => e.enabled).length, categories: jc(), metrics: Mo() };
}
function Dm() {
  const e = Object.values(F).filter((t) => t.enabled).length;
  return { status: qt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Ao, moduleId: Ts, portsInitialized: qt.isInitialized(), checks: { totalFeatures: Object.keys(F).length, enabledFeatures: e }, metrics: Mo() };
}
var TS = { init: bm, isEnabled: _m, enable: ym, disable: vm, toggle: Im, getAll: Sm, getByCategory: Cm, getCategories: jc, reset: Am, bulkUpdate: Mm, destroy: Om, injectPorts: mm, getPorts: pm, getMetrics: Mo, info: Tm, healthCheck: Dm, VERSION: Ao, MODULE_ID: Ts, DEFAULT_FLAGS: Ii };
const Lm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ts,
  VERSION: Ao,
  bulkUpdate: Mm,
  default: TS,
  destroy: Om,
  disable: vm,
  enable: ym,
  getAll: Sm,
  getByCategory: Cm,
  getCategories: jc,
  getMetrics: Mo,
  getPorts: pm,
  healthCheck: Dm,
  info: Tm,
  init: bm,
  injectPorts: mm,
  isEnabled: _m,
  reset: Am,
  toggle: Im
}, Symbol.toStringTag, { value: "Module" })), Oo = "6.1.0-ES6", $s = "sidebar-fuzzy-search", Yt = v({ moduleId: $s });
function DS() {
  Yt.init();
}
function LS(e) {
  return Yt.get(e);
}
function $m(e) {
  return Yt.inject(e);
}
function km() {
  return Yt.snapshot();
}
let qn = { searches: 0, matches: 0, misses: 0 };
function $S(e, t) {
  const r = [];
  for (let n = 0; n <= t.length; n++) r[n] = [n];
  for (let n = 0; n <= e.length; n++) r[0][n] = n;
  for (let n = 1; n <= t.length; n++)
    for (let s = 1; s <= e.length; s++)
      t.charAt(n - 1) === e.charAt(s - 1) ? r[n][s] = r[n - 1][s - 1] : r[n][s] = Math.min(r[n - 1][s - 1] + 1, r[n][s - 1] + 1, r[n - 1][s] + 1);
  return r[t.length][e.length];
}
function Fc(e, t) {
  const r = e.toLowerCase(), n = t.toLowerCase();
  if (n === r) return 100;
  if (n.startsWith(r)) return 90;
  if (n.includes(r)) return 80;
  if (n.split(/[\s-_]/).map((l) => l[0]).join("").includes(r)) return 70;
  const i = $S(r, n.slice(0, r.length + 2));
  if (i <= 2) return 60 - i * 10;
  let o = 0, a = -1;
  for (let l = 0; l < r.length; l++) {
    const d = r[l], u = n.indexOf(d, a + 1);
    u > a && (o += 5, a = u);
  }
  return o >= r.length * 3 ? 40 + o : 0;
}
function wm(e) {
  e && Yt.inject({ eventBus: e }), DS();
  const t = LS("eventBus");
  t && t.emit && t.emit(f.FUZZY_INITIALIZED);
}
function Gc(e, t, r = {}) {
  const n = r.labelKey || "label", s = r.threshold || 30, i = r.maxResults || 10;
  if (qn.searches++, !t || !(e != null && e.length)) return (e == null ? void 0 : e.slice(0, i)) || [];
  const a = e.map((l) => {
    const d = typeof l == "string" ? l : l[n] || l.title || l.id || "", u = Fc(t, d);
    return { item: l, score: u, text: d };
  }).filter((l) => l.score >= s).sort((l, d) => d.score - l.score).slice(0, i).map((l) => Object.assign({}, l.item, { _fuzzyScore: l.score, _fuzzyMatch: l.text }));
  return qn.matches += a.length, a.length === 0 && qn.misses++, a;
}
function Nm(e, t, r) {
  if (!e) return { visible: 0, hidden: 0 };
  r = r || {};
  const n = Array.from(e.querySelectorAll(`.${c.ITEM}`)), s = n.map((d) => {
    var u;
    return {
      element: d,
      label: ((u = d.textContent) == null ? void 0 : u.trim()) || "",
      id: d.dataset.itemId
    };
  }), i = Gc(s, t, Object.assign({}, r, { maxResults: 100 })), o = new Set(i.map((d) => d.id));
  let a = 0, l = 0;
  return n.forEach((d) => {
    const u = d.dataset.itemId, h = !t || o.has(u);
    d.style.display = h ? "" : "none";
    const g = i.find((m) => m.id === u);
    g && (d.style.order = String(100 - (g._fuzzyScore || 0))), h ? a++ : l++;
  }), { visible: a, hidden: l, results: i };
}
function Rm(e, t) {
  if (!t) return e;
  const r = new RegExp(`(${t.split("").join(".*?")})`, "gi");
  return e.replace(r, '<mark class="fuzzy-match">$1</mark>');
}
function xm() {
}
function To() {
  return { ...qn };
}
function Pm() {
  return { moduleId: $s, version: Oo, portsInitialized: Yt.isInitialized(), metrics: To() };
}
function Hm() {
  return { status: Yt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Oo, moduleId: $s, portsInitialized: Yt.isInitialized(), checks: { searchesPerformed: qn.searches }, metrics: To() };
}
var kS = { init: wm, search: Gc, applyFuzzySearch: Nm, highlightMatch: Rm, calculateScore: Fc, destroy: xm, injectPorts: $m, getPorts: km, getMetrics: To, info: Pm, healthCheck: Hm, VERSION: Oo, MODULE_ID: $s };
const zm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: $s,
  VERSION: Oo,
  applyFuzzySearch: Nm,
  calculateScore: Fc,
  default: kS,
  destroy: xm,
  getMetrics: To,
  getPorts: km,
  healthCheck: Hm,
  highlightMatch: Rm,
  info: Pm,
  init: wm,
  injectPorts: $m,
  search: Gc
}, Symbol.toStringTag, { value: "Module" })), Do = "7.1.0-ES6", ks = "sidebar-highlight-matches", Kt = v({ moduleId: ks });
function wS() {
  Kt.init();
}
function Bm(e) {
  return Kt.get(e);
}
function Um(e) {
  return Kt.inject(e);
}
function jm() {
  return Kt.snapshot();
}
let ue = null, Mn = "", Nt = [], Lo = { highlights: 0, clears: 0, navigations: 0 }, Tr = [];
const Tt = { highlightClass: "dsd-highlight", highlightActiveClass: "dsd-highlight--active", minQueryLength: 2 };
function Fm(e, t) {
  e && Kt.inject({ eventBus: e }), wS(), ue = t;
  const r = Bm("eventBus");
  if (r && r.on) {
    const n = r.on(f.SEARCH, NS);
    typeof n == "function" && Tr.push(n);
    const s = r.on(f.SEARCH_CLEAR, On);
    typeof s == "function" && Tr.push(s);
  }
  r && r.emit && r.emit(f.HIGHLIGHT_INITIALIZED);
}
function NS(e) {
  const t = (e == null ? void 0 : e.query) || "";
  if (t.length < Tt.minQueryLength) {
    On();
    return;
  }
  Mn = t, Vc(t);
}
function Vc(e, t) {
  const r = t || ue;
  if (!r || !e) return;
  On(), Mn = e;
  const n = RS(e);
  r.querySelectorAll(`.${c.ITEM_TEXT}, .${c.ITEM_LABEL}, .${c.GROUP_TITLE}`).forEach((o) => {
    const a = o.textContent, l = a.match(n);
    if (l && l.length > 0) {
      const d = a.replace(n, (u) => `<mark class="${Tt.highlightClass}">${xS(u)}</mark>`);
      o.dataset.originalText = a, o.innerHTML = d, Nt.push(o);
    }
  }), Lo.highlights++;
  const i = Bm("eventBus");
  return i && i.emit && i.emit(f.HIGHLIGHTS_APPLIED, { query: e, count: Nt.length }), Nt.length;
}
function RS(e) {
  const t = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), r = "gi";
  return new RegExp(`(${t})`, r);
}
function xS(e) {
  const t = document.createElement("div");
  return t.textContent = e, t.innerHTML;
}
function On() {
  Nt.forEach((e) => {
    e.dataset.originalText && (e.textContent = e.dataset.originalText, delete e.dataset.originalText);
  }), Nt = [], Mn = "", Lo.clears++, ue == null || ue.querySelectorAll(`.${Tt.highlightClass}`).forEach((e) => {
    const t = e.parentNode;
    t.replaceChild(document.createTextNode(e.textContent), e), t.normalize();
  });
}
function Gm(e = "next") {
  const t = ue == null ? void 0 : ue.querySelectorAll(`.${Tt.highlightClass}`);
  if (!t || t.length === 0) return null;
  Lo.navigations++;
  let r = ue == null ? void 0 : ue.querySelector(`.${Tt.highlightActiveClass}`), n = r ? Array.from(t).indexOf(r) : -1;
  r == null || r.classList.remove(Tt.highlightActiveClass), e === "next" ? n = (n + 1) % t.length : n = n <= 0 ? t.length - 1 : n - 1;
  const s = t[n];
  return s.classList.add(Tt.highlightActiveClass), s.scrollIntoView({ behavior: "smooth", block: "center" }), { current: n + 1, total: t.length };
}
function Vm() {
  return (ue == null ? void 0 : ue.querySelectorAll(`.${Tt.highlightClass}`).length) || 0;
}
function qm() {
  return Mn;
}
function Ym() {
  Tr.forEach((e) => {
    try {
      typeof e == "function" && e();
    } catch {
    }
  }), Tr = [], On(), ue = null;
}
function $o() {
  return { ...Lo, currentHighlights: Nt.length, cleanups: Tr.length };
}
function Km() {
  return { moduleId: ks, version: Do, portsInitialized: Kt.isInitialized(), currentQuery: Mn, highlightCount: Nt.length, cleanups: Tr.length, metrics: $o(), p25Compliant: !0 };
}
function Wm() {
  return { status: Kt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Do, moduleId: ks, portsInitialized: Kt.isInitialized(), cleanups: Tr.length, checks: { highlightCount: Nt.length, currentQuery: Mn }, metrics: $o(), p25Compliant: !0 };
}
var PS = { init: Fm, highlightMatches: Vc, clearHighlights: On, navigateToMatch: Gm, getMatchCount: Vm, getCurrentQuery: qm, destroy: Ym, injectPorts: Um, getPorts: jm, getMetrics: $o, info: Km, healthCheck: Wm, VERSION: Do, MODULE_ID: ks };
const Xm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ks,
  VERSION: Do,
  clearHighlights: On,
  default: PS,
  destroy: Ym,
  getCurrentQuery: qm,
  getMatchCount: Vm,
  getMetrics: $o,
  getPorts: jm,
  healthCheck: Wm,
  highlightMatches: Vc,
  info: Km,
  init: Fm,
  injectPorts: Um,
  navigateToMatch: Gm
}, Symbol.toStringTag, { value: "Module" })), ko = "6.0.0-NCS", ws = "sidebar.features.intersection-observer", jr = v({ moduleId: ws });
function ou() {
  jr.init();
}
function Pa(e) {
  return jr.get(e);
}
function Zm(e) {
  return jr.inject(e);
}
function Jm() {
  return jr.snapshot();
}
let De = null, ee = null, at = null, yr = /* @__PURE__ */ new Set(), lt = [], Ha = !1, Dt = null, wo = { observes: 0, renders: 0, unrenders: 0 };
const mn = {
  rootMargin: "100px 0px",
  threshold: 0.1,
  batchSize: 10,
  batchDelay: 16
};
function Qm(e, t, r = {}) {
  var n, s, i, o, a, l;
  if (e && typeof e == "object" && !e.emit) {
    const d = e, u = d.ports, h = d.eventBus, g = d.sidebarEl;
    u && jr.inject(u), ou(), ee = h || Pa("eventBus"), De = g, d.config && Object.assign(mn, d.config);
  } else
    ee = e, De = t, r && Object.assign(mn, r), ou();
  return "IntersectionObserver" in window ? De ? (HS(), Si(), (a = ee == null ? void 0 : ee.on) == null || a.call(ee, "sidebar:items-updated", Si), (l = ee == null ? void 0 : ee.emit) == null || l.call(ee, "sidebar:intersection-observer:initialized"), { ok: !0, supported: !0 }) : ((o = (i = Pa("logger")) == null ? void 0 : i.info) == null || o.call(i, "[IntersectionObserver] No container, will observe when available"), { ok: !0, deferred: !0 }) : ((s = (n = Pa("logger")) == null ? void 0 : n.warn) == null || s.call(n, "[IntersectionObserver] Not supported, rendering all items"), { ok: !0, supported: !1 });
}
function HS() {
  De && (at = new IntersectionObserver((e) => {
    e.forEach((t) => {
      t.isIntersecting ? BS(t.target) : US(t.target);
    });
  }, {
    root: De == null ? void 0 : De.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`),
    rootMargin: mn.rootMargin,
    threshold: mn.threshold
  }));
}
function Si() {
  if (!at || !De) return;
  yr.forEach((t) => {
    De.contains(t) || (at.unobserve(t), yr.delete(t));
  }), De.querySelectorAll(`.${c.ITEM}:not([data-observed])`).forEach((t) => {
    t.dataset.observed = "true", t.dataset.rendered = "false", t.classList.contains(c.ITEM_PLACEHOLDER) || zS(t), at.observe(t), yr.add(t), wo.observes++;
  });
}
function zS(e) {
  const t = e.offsetHeight || 40;
  e.dataset.originalContent = e.innerHTML, e.dataset.originalHeight = t, e.innerHTML = `<div class="dsd-sidebar__item-placeholder" style="height: ${t}px"><div class="dsd-sidebar__item-placeholder-icon"></div><div class="dsd-sidebar__item-placeholder-text"></div></div>`, e.classList.add(c.ITEM_PLACEHOLDER);
}
function ep(e) {
  e.dataset.originalContent && (e.innerHTML = e.dataset.originalContent, e.classList.remove(c.ITEM_PLACEHOLDER), e.dataset.rendered = "true", delete e.dataset.originalContent);
}
function BS(e) {
  e.dataset.rendered !== "true" && (lt.includes(e) || lt.push(e), tp());
}
function US(e) {
  wo.unrenders++;
}
function tp() {
  Ha || lt.length === 0 || (Ha = !0, requestAnimationFrame(() => {
    var t;
    const e = lt.splice(0, mn.batchSize);
    e.forEach((r) => {
      ep(r), wo.renders++, r.style.opacity = "0", r.style.transform = "translateX(-10px)", requestAnimationFrame(() => {
        r.style.transition = "opacity 0.2s ease, transform 0.2s ease", r.style.opacity = "1", r.style.transform = "translateX(0)";
      });
    }), Ha = !1, lt.length > 0 && (Dt && clearTimeout(Dt), Dt = setTimeout(() => {
      Dt = null, tp();
    }, mn.batchDelay)), (t = ee == null ? void 0 : ee.emit) == null || t.call(ee, "sidebar:lazy-render", {
      rendered: e.length,
      pending: lt.length
    });
  }));
}
function rp() {
  yr.forEach((e) => {
    e.dataset.rendered !== "true" && ep(e);
  }), lt = [];
}
function No() {
  let e = 0, t = 0;
  return yr.forEach((r) => {
    r.dataset.rendered === "true" ? e++ : t++;
  }), { total: yr.size, rendered: e, placeholder: t, pending: lt.length };
}
function qc() {
  Dt && (clearTimeout(Dt), Dt = null), at == null || at.disconnect(), at = null, yr.clear(), lt = [], ee = null, De = null;
}
function np() {
  qc();
}
function Ro() {
  return { ...wo, ...No() };
}
function sp() {
  return {
    moduleId: ws,
    version: ko,
    stats: No(),
    metrics: Ro(),
    portsInitialized: jr.isInitialized()
  };
}
function ip() {
  const e = "IntersectionObserver" in window;
  return {
    status: e ? "HEALTHY" : "DEGRADED",
    version: ko,
    moduleId: ws,
    checks: {
      supported: e,
      hasContainer: !!De,
      hasObserver: !!at,
      noOrphanTimers: !Dt,
      portsInitialized: jr.isInitialized()
    },
    metrics: Ro()
  };
}
var jS = {
  init: Qm,
  cleanup: qc,
  observeItems: Si,
  renderAll: rp,
  getStats: No,
  destroy: np,
  getMetrics: Ro,
  info: sp,
  healthCheck: ip,
  injectPorts: Zm,
  getPorts: Jm,
  VERSION: ko,
  MODULE_ID: ws
};
const op = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ws,
  VERSION: ko,
  cleanup: qc,
  default: jS,
  destroy: np,
  getMetrics: Ro,
  getPorts: Jm,
  getStats: No,
  healthCheck: ip,
  info: sp,
  init: Qm,
  injectPorts: Zm,
  observeItems: Si,
  renderAll: rp
}, Symbol.toStringTag, { value: "Module" })), Tn = "sidebar-keyboard-shortcuts-extended", Dn = "7.1.0-ES6", Fr = v({ moduleId: Tn });
function FS() {
  Fr.init();
}
function en(e) {
  return Fr.get(e);
}
function GS(e) {
  return Fr.inject(e);
}
function VS() {
  return Fr.snapshot();
}
const P = { initialized: !1, ctx: null, shortcuts: /* @__PURE__ */ new Map(), enabled: !0, triggered: 0, errors: 0, cleanups: [] };
function vr(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: Tn, version: Dn, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
const qS = [
  { keys: "Alt+1", action: "gotoSection1", description: "Ir para seção 1" },
  { keys: "Alt+2", action: "gotoSection2", description: "Ir para seção 2" },
  { keys: "Alt+M", action: "toggleMiniMode", description: "Alternar modo mini" },
  { keys: "Alt+B", action: "toggleSidebar", description: "Alternar sidebar" },
  { keys: "Alt+T", action: "toggleTheme", description: "Alternar tema" },
  { keys: "Shift+?", action: "showHelp", description: "Mostrar atalhos" },
  { keys: "Escape", action: "closeOverlays", description: "Fechar overlays" }
];
function au(e) {
  const t = document.querySelectorAll(`.${c.SECTION}`);
  if (t[e]) {
    const r = t[e].querySelector(`.${c.LINK}`);
    r && r.focus();
  }
}
const lu = {
  gotoSection1() {
    au(0);
  },
  gotoSection2() {
    au(1);
  },
  toggleMiniMode() {
    const e = en("sidebar");
    e && e.toggleMiniMode && e.toggleMiniMode();
  },
  toggleSidebar() {
    const e = en("sidebar");
    e && e.toggle && e.toggle();
  },
  toggleTheme() {
    const e = en("sidebar");
    e && e.toggleTheme && e.toggleTheme();
  },
  showHelp() {
    ap();
  },
  closeOverlays() {
    const e = en("sidebar");
    e && (e.hideCommandPalette && e.hideCommandPalette(), e.hideQuickSwitcher && e.hideQuickSwitcher());
  }
};
function YS(e) {
  const t = e.split("+");
  return {
    ctrl: t.indexOf("Ctrl") >= 0,
    alt: t.indexOf("Alt") >= 0,
    shift: t.indexOf("Shift") >= 0,
    meta: t.indexOf("Meta") >= 0,
    key: t[t.length - 1].toLowerCase()
  };
}
function KS(e, t) {
  return e.ctrlKey === t.ctrl && e.altKey === t.alt && e.shiftKey === t.shift && e.metaKey === t.meta && e.key.toLowerCase() === t.key;
}
function cu(e) {
  P.enabled && P.shortcuts.forEach((t) => {
    if (KS(e, t.parsed)) {
      e.preventDefault(), P.triggered++, lu[t.action] && lu[t.action]();
      const r = en("eventBus");
      r && r.emit && r.emit(f.SHORTCUT_TRIGGERED, { action: t.action, keys: t.keys });
    }
  });
}
function ap() {
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
function Yc(e) {
  if (!e || !e.keys || !e.action) return vr(!1, null, [{ code: "INVALID", message: "Shortcut must have keys and action" }]);
  const t = YS(e.keys);
  return P.shortcuts.set(e.keys, { keys: e.keys, action: e.action, description: e.description || "", parsed: t }), vr(!0, { keys: e.keys });
}
function lp(e) {
  if (P.initialized) return vr(!0, { alreadyInitialized: !0 });
  try {
    P.ctx = e, e && e.ports && Fr.inject(e.ports), FS(), qS.forEach((r) => {
      Yc(r);
    }), document.addEventListener("keydown", cu), P.cleanups.push(() => {
      document.removeEventListener("keydown", cu);
    }), P.initialized = !0;
    const t = en("eventBus");
    return t && t.emit && t.emit(f.SHORTCUTS_INITIALIZED, { version: Dn }), vr(!0, { initialized: !0 });
  } catch (t) {
    return P.errors++, vr(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function cp() {
  for (let e = 0; e < P.cleanups.length; e++)
    try {
      P.cleanups[e]();
    } catch {
    }
  return P.cleanups = [], P.shortcuts.clear(), P.initialized = !1, vr(!0, { cleanedUp: !0 });
}
function dp() {
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
    moduleId: Tn,
    version: Dn,
    portsInitialized: Fr.isInitialized(),
    checks: e,
    metrics: { triggered: P.triggered, shortcutsCount: P.shortcuts.size, errors: P.errors },
    timestamp: Date.now()
  };
}
function up() {
  return vr(!0, {
    moduleId: Tn,
    version: Dn,
    portsInitialized: Fr.isInitialized(),
    initialized: P.initialized,
    shortcutsCount: P.shortcuts.size,
    triggered: P.triggered
  });
}
const hp = { singleton: !0, critical: !1, rendersUI: !1, category: "accessibility", priority: "normal" };
function fp() {
  return { triggered: P.triggered, shortcutsCount: P.shortcuts.size, errors: P.errors };
}
function WS() {
  P.enabled = !0;
}
function XS() {
  P.enabled = !1;
}
var ZS = { id: Tn, version: Dn, capabilities: hp, init: lp, cleanup: cp, healthCheck: dp, info: up, getMetrics: fp, registerShortcut: Yc };
const gp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Tn,
  VERSION: Dn,
  capabilities: hp,
  cleanup: cp,
  default: ZS,
  disable: XS,
  enable: WS,
  getMetrics: fp,
  getPorts: VS,
  healthCheck: dp,
  info: up,
  init: lp,
  injectPorts: GS,
  registerShortcut: Yc,
  showShortcutsHelp: ap
}, Symbol.toStringTag, { value: "Module" })), xo = "6.1.0-ES6", Ns = "sidebar-mini-mode", Wt = v({ moduleId: Ns });
function JS() {
  Wt.init();
}
function Kc(e) {
  return Wt.get(e);
}
function mp(e) {
  return Wt.inject(e);
}
function pp() {
  return Wt.snapshot();
}
const Ep = "dsd-sidebar-mini";
let Gr = !1, Y = null, ts = [], Po = { enables: 0, disables: 0, toggles: 0 };
function QS() {
  try {
    return localStorage.getItem(Ep) === "true";
  } catch {
    return !1;
  }
}
function bp(e) {
  try {
    localStorage.setItem(Ep, String(e));
  } catch {
  }
}
function e0(e) {
  const t = () => {
    Gr && e.classList.add(c.MOD_MINI_HOVER);
  }, r = () => {
    e.classList.remove(c.MOD_MINI_HOVER);
  };
  e.addEventListener("mouseenter", t), e.addEventListener("mouseleave", r), ts.push(() => {
    e.removeEventListener("mouseenter", t);
  }), ts.push(() => {
    e.removeEventListener("mouseleave", r);
  });
}
function _p(e, t) {
  e && Wt.inject({ eventBus: e }), JS(), Y = t, t && e0(t);
  const r = QS();
  r && t && Ho(t);
  const n = Kc("eventBus");
  return n && n.emit && n.emit(f.MINI_INITIALIZED), r;
}
function Ho(e) {
  if (Y = e || Y, !Y) return !1;
  Y.classList.add(c.MOD_MINI), Y.setAttribute("data-mini", "true"), Gr = !0, Po.enables++, bp(!0), Y.querySelectorAll(`.${c.ITEM}`).forEach((r) => {
    const n = r.querySelector(`.${c.ITEM_LABEL}`);
    n && r.setAttribute("title", n.textContent || "");
  });
  const t = Kc("eventBus");
  return t && t.emit && t.emit(f.MINI_ENABLED), !0;
}
function zo(e) {
  if (Y = e || Y, !Y) return !1;
  Y.classList.remove(c.MOD_MINI), Y.classList.remove(c.MOD_MINI_HOVER), Y.removeAttribute("data-mini"), Gr = !1, Po.disables++, bp(!1), Y.querySelectorAll(`.${c.ITEM}[title]`).forEach((r) => {
    r.removeAttribute("title");
  });
  const t = Kc("eventBus");
  return t && t.emit && t.emit(f.MINI_DISABLED), !0;
}
function yp(e) {
  return Y = e || Y, Po.toggles++, Gr ? (zo(Y), !1) : (Ho(Y), !0);
}
function vp() {
  return Gr;
}
function Ip() {
  return Y;
}
function Sp() {
  ts.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), ts = [], zo(Y);
}
function Bo() {
  return { ...Po };
}
function Cp() {
  return { moduleId: Ns, version: xo, portsInitialized: Wt.isInitialized(), enabled: Gr, hasContainer: !!Y, cleanups: ts.length, metrics: Bo() };
}
function Ap() {
  return { status: Wt.isInitialized() ? "HEALTHY" : "DEGRADED", version: xo, moduleId: Ns, portsInitialized: Wt.isInitialized(), checks: { enabled: Gr, hasContainer: !!Y }, metrics: Bo() };
}
var t0 = { init: _p, enable: Ho, disable: zo, toggle: yp, isEnabled: vp, getContainer: Ip, destroy: Sp, injectPorts: mp, getPorts: pp, getMetrics: Bo, info: Cp, healthCheck: Ap, VERSION: xo, MODULE_ID: Ns };
const Mp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ns,
  VERSION: xo,
  default: t0,
  destroy: Sp,
  disable: zo,
  enable: Ho,
  getContainer: Ip,
  getMetrics: Bo,
  getPorts: pp,
  healthCheck: Ap,
  info: Cp,
  init: _p,
  injectPorts: mp,
  isEnabled: vp,
  toggle: yp
}, Symbol.toStringTag, { value: "Module" })), Uo = "7.1.0-ES6", Rs = "sidebar-notification-dots", Xt = v({ moduleId: Rs });
function r0() {
  Xt.init();
}
function Wc(e) {
  return Xt.get(e);
}
function Op(e) {
  return Xt.inject(e);
}
function Tp() {
  return Xt.snapshot();
}
let Yn = null, Ne = /* @__PURE__ */ new Map(), pn = [], jo = { shows: 0, hides: 0, updates: 0 };
const du = {
  default: { color: "#ef4444", size: 8 },
  success: { color: "#10b981", size: 8 },
  warning: { color: "#f59e0b", size: 8 },
  info: { color: "#3b82f6", size: 8 },
  urgent: { color: "#ef4444", size: 10, pulse: !0 }
};
function uu(e) {
  e != null && e.itemId && Fo(e.itemId, e.variant || "default", e.count);
}
function hu(e) {
  e != null && e.itemId && Vr(e.itemId);
}
function Dp(e, t) {
  e && Xt.inject({ eventBus: e }), r0(), Yn = t;
  const r = Wc("eventBus");
  if (r && r.on) {
    const n = r.on(f.NOTIFICATION, uu), s = r.on(f.NOTIFICATION_CLEAR, hu);
    pn.push(
      typeof n == "function" ? n : () => {
        r.off && r.off(f.NOTIFICATION, uu);
      }
    ), pn.push(
      typeof s == "function" ? s : () => {
        r.off && r.off(f.NOTIFICATION_CLEAR, hu);
      }
    );
  }
  r && r.emit && r.emit(f.DOTS_INITIALIZED);
}
function Fo(e, t = "default", r = null) {
  const n = Yn == null ? void 0 : Yn.querySelector(`[data-item-id="${e}"]`);
  if (!n) return !1;
  Vr(e);
  const s = du[t] || du.default, i = n0(s, r), o = n.querySelector(`.${C.LINK}`);
  o ? (o.style.position = "relative", o.appendChild(i)) : (n.style.position = "relative", n.appendChild(i)), Ne.set(e, { element: i, variant: t, count: r }), jo.shows++;
  const a = Wc("eventBus");
  return a && a.emit && a.emit(f.DOT_SHOWN, { itemId: e, variant: t, count: r }), !0;
}
function n0(e, t) {
  const r = document.createElement("span");
  return r.className = "dsd-notification-dot", e.pulse && r.classList.add("dsd-notification-dot--pulse"), r.style.cssText = `position:absolute;top:8px;right:8px;width:${e.size}px;height:${e.size}px;background:${e.color};border-radius:50%;border:2px solid var(--surface-base,#1a1a2e);z-index:10;pointer-events:none;`, t !== null && t > 0 && (r.classList.add("dsd-notification-dot--count"), r.textContent = t > 99 ? "99+" : t, r.style.width = "auto", r.style.minWidth = "16px", r.style.height = "16px", r.style.padding = "0 4px", r.style.fontSize = "10px", r.style.fontWeight = "600", r.style.color = "white", r.style.display = "flex", r.style.alignItems = "center", r.style.justifyContent = "center"), r.style.animation = "dotAppear 0.3s ease-out", r;
}
function Vr(e) {
  const t = Ne.get(e);
  if (!t) return !1;
  const r = t.element;
  r.style.animation = "dotDisappear 0.2s ease-out forwards", jo.hides++, setTimeout(() => {
    r.remove(), Ne.delete(e);
  }, 200);
  const n = Wc("eventBus");
  return n && n.emit && n.emit(f.DOT_HIDDEN, { itemId: e }), !0;
}
function Go(e, t) {
  jo.updates++;
  const r = Ne.get(e);
  if (!r) return !1;
  if (t <= 0) return Vr(e);
  const n = r.element;
  return n.classList.contains("dsd-notification-dot--count") && (n.textContent = t > 99 ? "99+" : t, n.style.animation = "dotPulse 0.3s ease-out"), r.count = t, !0;
}
function Lp(e, t = 1) {
  const r = Ne.get(e);
  if (!r)
    return Fo(e, "default", t), t;
  const n = (r.count || 0) + t;
  return Go(e, n), n;
}
function $p(e, t = 1) {
  const r = Ne.get(e);
  if (!r) return 0;
  const n = Math.max(0, (r.count || 0) - t);
  return n === 0 ? Vr(e) : Go(e, n), n;
}
function Xc() {
  Ne.forEach((e, t) => {
    Vr(t);
  });
}
function Zc() {
  const e = {};
  return Ne.forEach((t, r) => {
    e[r] = { variant: t.variant, count: t.count };
  }), e;
}
function kp(e) {
  return Ne.has(e);
}
function wp() {
  pn.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), pn = [], Xc(), Yn = null;
}
function Vo() {
  return { ...jo, activeDots: Ne.size, cleanups: pn.length };
}
function Np() {
  return {
    moduleId: Rs,
    version: Uo,
    portsInitialized: Xt.isInitialized(),
    activeDots: Ne.size,
    dots: Zc(),
    cleanups: pn.length,
    metrics: Vo(),
    p24Compliant: !0
  };
}
function Rp() {
  return {
    status: Xt.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: Uo,
    moduleId: Rs,
    portsInitialized: Xt.isInitialized(),
    checks: { activeDots: Ne.size, noOrphanListeners: !0 },
    metrics: Vo(),
    p24Compliant: !0
  };
}
var s0 = { init: Dp, showDot: Fo, hideDot: Vr, updateCount: Go, incrementCount: Lp, decrementCount: $p, clearAll: Xc, getAll: Zc, hasDot: kp, destroy: wp, injectPorts: Op, getPorts: Tp, getMetrics: Vo, info: Np, healthCheck: Rp, VERSION: Uo, MODULE_ID: Rs };
const xp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Rs,
  VERSION: Uo,
  clearAll: Xc,
  decrementCount: $p,
  default: s0,
  destroy: wp,
  getAll: Zc,
  getMetrics: Vo,
  getPorts: Tp,
  hasDot: kp,
  healthCheck: Rp,
  hideDot: Vr,
  incrementCount: Lp,
  info: Np,
  init: Dp,
  injectPorts: Op,
  showDot: Fo,
  updateCount: Go
}, Symbol.toStringTag, { value: "Module" })), qo = "6.1.0-ES6", xs = "sidebar-parallax", Zt = v({ moduleId: xs });
function i0() {
  Zt.init();
}
function o0(e) {
  return Zt.get(e);
}
function Pp(e) {
  return Zt.inject(e);
}
function Hp() {
  return Zt.snapshot();
}
let Dr = !1, li = null, Ci = { enables: 0, disables: 0, scrollEvents: 0 };
function zp(e) {
  e && Zt.inject({ eventBus: e }), i0();
  const t = o0("eventBus");
  t && t.emit && t.emit(f.PARALLAX_INITIALIZED);
}
function Jc(e) {
  if (!e || Dr) return !1;
  e.classList.add(c.MOD_PARALLAX);
  const t = e.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!t) return !1;
  const r = () => {
    Ci.scrollEvents++;
    const s = t.scrollTop * -0.3;
    e.style.setProperty("--parallax-offset", `${s}px`);
  };
  return t.addEventListener("scroll", r, { passive: !0 }), li = () => {
    t.removeEventListener("scroll", r), e.classList.remove(c.MOD_PARALLAX), e.style.removeProperty("--parallax-offset");
  }, Dr = !0, Ci.enables++, !0;
}
function Yo() {
  li && (li(), li = null), Dr = !1, Ci.disables++;
}
function Bp(e) {
  return Dr ? (Yo(), !1) : Jc(e);
}
function Up() {
  return Dr;
}
function jp() {
  Yo();
}
function Ko() {
  return { ...Ci };
}
function Fp() {
  return { moduleId: xs, version: qo, portsInitialized: Zt.isInitialized(), enabled: Dr, metrics: Ko() };
}
function Gp() {
  return { status: Zt.isInitialized() ? "HEALTHY" : "DEGRADED", version: qo, moduleId: xs, portsInitialized: Zt.isInitialized(), checks: { enabled: Dr }, metrics: Ko() };
}
var a0 = { init: zp, enable: Jc, disable: Yo, toggle: Bp, isEnabled: Up, destroy: jp, injectPorts: Pp, getPorts: Hp, getMetrics: Ko, info: Fp, healthCheck: Gp, VERSION: qo, MODULE_ID: xs };
const Vp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: xs,
  VERSION: qo,
  default: a0,
  destroy: jp,
  disable: Yo,
  enable: Jc,
  getMetrics: Ko,
  getPorts: Hp,
  healthCheck: Gp,
  info: Fp,
  init: zp,
  injectPorts: Pp,
  isEnabled: Up,
  toggle: Bp
}, Symbol.toStringTag, { value: "Module" })), Wo = "6.2.0-REGION-AWARE", Ps = "sidebar-preload-critical-css", Jt = v({ moduleId: Ps });
function l0() {
  Jt.init();
}
function c0(e) {
  return Jt.get(e);
}
function qp(e) {
  return Jt.inject(e);
}
function Yp() {
  return Jt.snapshot();
}
let bt = [], Xo = { injects: 0, customAdds: 0, removes: 0 };
const Kp = ".dsd-sidebar{position:relative;width:100%;height:100%;background:var(--sidebar-bg,#0E0E12);z-index:1;display:flex;flex-direction:column;transition:width var(--sidebar-transition-slow,300ms)}.dsd-sidebar.dsd-sidebar--collapsed{width:var(--sidebar-width-collapsed,72px);min-width:var(--sidebar-width-collapsed,72px)}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-text,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__section-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__search,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__badge,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-chevron{display:none}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__link{justify-content:center;padding:12px}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-icon{margin:0}.dsd-sidebar__header{flex-shrink:0;padding:1rem;border-bottom:1px solid var(--sidebar-border,rgba(255,255,255,0.06))}.dsd-sidebar__nav{flex:1;overflow-y:auto;overflow-x:hidden}.dsd-sidebar__link{display:flex;align-items:center;padding:0.625rem 1rem;color:var(--sidebar-text-secondary,rgba(229,231,235,1));text-decoration:none;transition:background var(--sidebar-transition-fast,150ms),color var(--sidebar-transition-fast,150ms)}.dsd-sidebar__item-icon{width:var(--sidebar-icon-size,20px);height:var(--sidebar-icon-size,20px);margin-right:0.75rem;flex-shrink:0}.dsd-sidebar__item-text{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:768px){.dsd-sidebar{transform:translateX(-100%);transition:transform 0.3s ease,width 0.3s ease}.dsd-sidebar--mobile-open{transform:translateX(0)}}";
function Wp(e) {
  e && Jt.inject({ eventBus: e }), l0(), d0();
  const t = c0("eventBus");
  t && t.emit && (t.emit(f.CRITICAL_CSS_INJECTED), t.emit(f.PRELOAD_CSS_INITIALIZED));
}
function d0() {
  if (document.getElementById("dsd-sidebar-critical-css")) return;
  const e = document.createElement("style");
  e.id = "dsd-sidebar-critical-css", e.textContent = Kp, document.head.insertBefore(e, document.head.firstChild), bt.push(e), Xo.injects++;
}
function Xp(e, t) {
  const r = t || "dsd-sidebar-custom-" + Date.now();
  if (t) {
    const s = document.getElementById(r);
    s && s.remove();
  }
  const n = document.createElement("style");
  return n.id = r, n.textContent = e, document.head.appendChild(n), bt.push(n), Xo.customAdds++, r;
}
function Zp(e) {
  const t = document.getElementById(e);
  return t ? (t.remove(), bt = bt.filter(function(r) {
    return r.id !== e;
  }), Xo.removes++, !0) : !1;
}
function Jp() {
  return Kp;
}
function Qc() {
  bt.forEach(function(e) {
    e.remove();
  }), bt = [];
}
function Qp() {
  Qc();
}
function Zo() {
  return Object.assign({}, Xo, { injectedStyles: bt.length });
}
function eE() {
  return { moduleId: Ps, version: Wo, portsInitialized: Jt.isInitialized(), injectedStyles: bt.length, criticalCSSPresent: !!document.getElementById("dsd-sidebar-critical-css"), metrics: Zo() };
}
function tE() {
  return { status: Jt.isInitialized() ? "HEALTHY" : "DEGRADED", version: Wo, moduleId: Ps, portsInitialized: Jt.isInitialized(), checks: { injectedStyles: bt.length, criticalCSSPresent: !!document.getElementById("dsd-sidebar-critical-css") }, metrics: Zo() };
}
var u0 = { init: Wp, addCustomCSS: Xp, removeCustomCSS: Zp, getCriticalCSS: Jp, cleanup: Qc, destroy: Qp, injectPorts: qp, getPorts: Yp, getMetrics: Zo, info: eE, healthCheck: tE, VERSION: Wo, MODULE_ID: Ps };
const rE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ps,
  VERSION: Wo,
  addCustomCSS: Xp,
  cleanup: Qc,
  default: u0,
  destroy: Qp,
  getCriticalCSS: Jp,
  getMetrics: Zo,
  getPorts: Yp,
  healthCheck: tE,
  info: eE,
  init: Wp,
  injectPorts: qp,
  removeCustomCSS: Zp
}, Symbol.toStringTag, { value: "Module" })), Ln = "sidebar-resize-handler", $n = "7.1.0-ES6", ar = v({ moduleId: Ln });
function h0() {
  ar.init();
}
function rs(e) {
  return ar.get(e);
}
function f0(e) {
  return ar.inject(e);
}
function g0() {
  return ar.snapshot();
}
const D = { initialized: !1, ctx: null, container: null, isResizing: !1, startX: 0, startWidth: 0, resizes: 0, errors: 0, cleanups: [] }, Le = { minWidth: 200, maxWidth: 400, defaultWidth: 260, storageKey: "dsd-sidebar-width" };
function Kn(e, t, r) {
  return { ok: e, data: t || null, meta: { moduleId: Ln, version: $n, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: r || [] };
}
function ed() {
  try {
    const e = localStorage.getItem(Le.storageKey);
    return e ? parseInt(e, 10) : Le.defaultWidth;
  } catch {
    return Le.defaultWidth;
  }
}
function Jo(e) {
  try {
    localStorage.setItem(Le.storageKey, String(e));
  } catch {
  }
}
function Qo() {
  return D.container ? D.container.offsetWidth : ed();
}
function nE(e) {
  const t = Math.max(Le.minWidth, Math.min(Le.maxWidth, e));
  D.container && (D.container.style.width = `${t}px`), Jo(t);
  const r = rs("eventBus");
  return r && r.emit && r.emit(f.RESIZE, { width: t }), t;
}
function sE() {
  D.container && (D.container.style.width = `${Le.defaultWidth}px`), Jo(Le.defaultWidth);
  const e = rs("eventBus");
  return e && e.emit && e.emit(f.RESIZE_RESET, { width: Le.defaultWidth }), Le.defaultWidth;
}
function iE(e) {
  const t = e.container, r = e.eventBus;
  if (!t) return () => {
  };
  r && ar.inject({ eventBus: r }), D.container = t;
  let n = t.querySelector(`.${c.RESIZE_HANDLE}`);
  n || (n = document.createElement("div"), n.className = c.RESIZE_HANDLE, n.setAttribute("role", "separator"), n.setAttribute("aria-label", "Redimensionar sidebar"), n.setAttribute("tabindex", "0"), t.appendChild(n)), t.style.width = `${ed()}px`;
  let s = null, i = null;
  const o = (a) => {
    a.preventDefault(), D.isResizing = !0, D.startX = a.clientX, D.startWidth = t.offsetWidth, t.classList.add(c.MOD_RESIZING), n.classList.add(c.RESIZE_HANDLE_ACTIVE), document.body.style.cursor = "col-resize", document.body.style.userSelect = "none", s = (l) => {
      if (!D.isResizing) return;
      const d = l.clientX - D.startX, u = Math.max(Le.minWidth, Math.min(Le.maxWidth, D.startWidth + d));
      t.style.width = `${u}px`;
      const h = rs("eventBus");
      h && h.emit && h.emit(f.RESIZE, { width: u });
    }, i = () => {
      if (!D.isResizing) return;
      D.isResizing = !1, D.resizes++;
      const l = t.offsetWidth;
      Jo(l), t.classList.remove(c.MOD_RESIZING), n.classList.remove(c.RESIZE_HANDLE_ACTIVE), document.body.style.cursor = "", document.body.style.userSelect = "", document.removeEventListener("mousemove", s), document.removeEventListener("mouseup", i);
      const d = rs("eventBus");
      d && d.emit && d.emit(f.RESIZE_END, { width: l });
    }, document.addEventListener("mousemove", s), document.addEventListener("mouseup", i);
  };
  return n.addEventListener("mousedown", o), D.cleanups.push(() => {
    n.removeEventListener("mousedown", o);
  }), () => {
    ea();
  };
}
function oE(e) {
  if (D.initialized) return Kn(!0, { alreadyInitialized: !0 });
  try {
    D.ctx = e, e && e.ports && ar.inject(e.ports), h0(), D.initialized = !0;
    const t = rs("eventBus");
    return t && t.emit && t.emit(f.RESIZE_INITIALIZED, { version: $n }), Kn(!0, { initialized: !0 });
  } catch (t) {
    return D.errors++, Kn(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function ea() {
  for (let e = 0; e < D.cleanups.length; e++)
    try {
      D.cleanups[e]();
    } catch {
    }
  return D.cleanups = [], D.initialized = !1, D.container = null, Kn(!0, { cleanedUp: !0 });
}
function aE() {
  return ea();
}
function lE() {
  const e = {
    initialized: D.initialized,
    notResizing: !D.isResizing,
    lowErrorRate: D.resizes === 0 || D.errors < D.resizes * 0.2
  }, t = Object.values(e).filter(Boolean).length, r = Object.keys(e).length;
  let n = "HEALTHY";
  return D.initialized ? t < r && (n = "DEGRADED") : n = "NOT_INITIALIZED", {
    status: n,
    score: { passed: t, total: r, percentage: Math.round(t / r * 100) },
    moduleId: Ln,
    version: $n,
    portsInitialized: ar.isInitialized(),
    checks: e,
    metrics: { resizes: D.resizes, errors: D.errors, currentWidth: Qo() },
    timestamp: Date.now()
  };
}
function cE() {
  return Kn(!0, {
    moduleId: Ln,
    version: $n,
    portsInitialized: ar.isInitialized(),
    initialized: D.initialized,
    resizes: D.resizes,
    currentWidth: Qo()
  });
}
const dE = { singleton: !0, critical: !1, rendersUI: !0, category: "layout", priority: "normal" };
function uE() {
  return { resizes: D.resizes, errors: D.errors };
}
var m0 = { id: Ln, version: $n, capabilities: dE, init: oE, cleanup: ea, destroy: aE, healthCheck: lE, info: cE, getMetrics: uE, setupResizeHandle: iE, getWidth: Qo, setWidth: nE, resetWidth: sE };
const hE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ln,
  VERSION: $n,
  capabilities: dE,
  cleanup: ea,
  default: m0,
  destroy: aE,
  getMetrics: uE,
  getPorts: g0,
  getSavedWidth: ed,
  getWidth: Qo,
  healthCheck: lE,
  info: cE,
  init: oE,
  injectPorts: f0,
  resetWidth: sE,
  saveWidth: Jo,
  setWidth: nE,
  setupResizeHandle: iE
}, Symbol.toStringTag, { value: "Module" })), ta = "6.1.0-ES6", Hs = "sidebar-screen-reader", Qt = v({ moduleId: Hs });
function p0() {
  Qt.init();
}
function E0(e) {
  return Qt.get(e);
}
function fE(e) {
  return Qt.inject(e);
}
function gE() {
  return Qt.snapshot();
}
let ne = null, Q = null, Lt = null, ns = [], td = { announcements: 0, enhancements: 0 };
function b0() {
  return ne || (ne = document.createElement("div"), ne.setAttribute("role", "status"), ne.setAttribute("aria-live", "polite"), ne.setAttribute("aria-atomic", "true"), ne.className = "sr-only", ne.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;", document.body.appendChild(ne), ne);
}
function mE(e) {
  e && Qt.inject({ eventBus: e }), p0();
  const t = E0("eventBus");
  t && t.emit && t.emit(f.SCREEN_READER_INITIALIZED);
}
function Ge(e, t = "polite") {
  const r = b0();
  r.setAttribute("aria-live", t), r.textContent = "", td.announcements++, Lt && clearTimeout(Lt), Lt = setTimeout(() => {
    r.textContent = e, Lt = null;
  }, 100);
}
function pE(e) {
  e && (td.enhancements++, e.setAttribute("role", "navigation"), e.setAttribute("aria-label", "Menu principal"), e.querySelectorAll(`.${c.SECTION}`).forEach((t, r) => {
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
  }), _0(e));
}
function _0(e) {
  if (Q) return;
  Q = document.createElement("a"), Q.className = `${c.SKIP_LINK} sr-only-focusable`, Q.href = "#main-content", Q.textContent = "Pular para conteúdo principal", Q.style.cssText = "position:absolute;top:-40px;left:0;padding:8px 16px;background:var(--sidebar-accent-primary,#7B6EF6);color:white;z-index:10000;transition:top 0.2s;";
  const t = () => {
    Q.style.top = "0";
  }, r = () => {
    Q.style.top = "-40px";
  };
  Q.addEventListener("focus", t), Q.addEventListener("blur", r), ns.push(() => {
    Q.removeEventListener("focus", t);
  }), ns.push(() => {
    Q.removeEventListener("blur", r);
  }), e.insertBefore(Q, e.firstChild);
}
function EE(e) {
  Ge(`Navegando para ${e}`);
}
function bE(e, t) {
  Ge(`${e} ${t ? "expandido" : "colapsado"}`);
}
function _E(e) {
  Ge(e === 0 ? "Nenhum resultado encontrado" : e === 1 ? "1 resultado encontrado" : `${e} resultados encontrados`);
}
function yE(e) {
  e == null || e.classList.add(c.MOD_HIGH_CONTRAST), Ge("Modo de alto contraste ativado");
}
function vE(e) {
  e == null || e.classList.remove(c.MOD_HIGH_CONTRAST), Ge("Modo de alto contraste desativado");
}
function IE(e) {
  e == null || e.classList.add(c.MOD_LARGE_TEXT), Ge("Texto grande ativado");
}
function SE(e) {
  e == null || e.classList.remove(c.MOD_LARGE_TEXT), Ge("Texto grande desativado");
}
function CE() {
  Lt && (clearTimeout(Lt), Lt = null), ns.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), ns = [], ne == null || ne.remove(), ne = null, Q == null || Q.remove(), Q = null;
}
function ra() {
  return { ...td };
}
function AE() {
  return { moduleId: Hs, version: ta, portsInitialized: Qt.isInitialized(), hasLiveRegion: !!ne, hasSkipLink: !!Q, cleanups: ns.length, metrics: ra() };
}
function ME() {
  return { status: Qt.isInitialized() ? "HEALTHY" : "DEGRADED", version: ta, moduleId: Hs, portsInitialized: Qt.isInitialized(), checks: { liveRegionReady: !!ne || !0, noOrphanTimers: !Lt }, metrics: ra() };
}
var y0 = { init: mE, announce: Ge, enhance: pE, announceNavigation: EE, announceExpansion: bE, announceSearchResults: _E, enableHighContrast: yE, disableHighContrast: vE, enableLargeText: IE, disableLargeText: SE, destroy: CE, injectPorts: fE, getPorts: gE, getMetrics: ra, info: AE, healthCheck: ME, VERSION: ta, MODULE_ID: Hs };
const OE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Hs,
  VERSION: ta,
  announce: Ge,
  announceExpansion: bE,
  announceNavigation: EE,
  announceSearchResults: _E,
  default: y0,
  destroy: CE,
  disableHighContrast: vE,
  disableLargeText: SE,
  enableHighContrast: yE,
  enableLargeText: IE,
  enhance: pE,
  getMetrics: ra,
  getPorts: gE,
  healthCheck: ME,
  info: AE,
  init: mE,
  injectPorts: fE
}, Symbol.toStringTag, { value: "Module" })), na = "6.1.0-ES6", zs = "sidebar-submenu", er = v({ moduleId: zs });
function v0() {
  er.init();
}
function TE(e) {
  return er.get(e);
}
function DE(e) {
  return er.inject(e);
}
function LE() {
  return er.snapshot();
}
let nl = [], Bs = { creates: 0, toggles: 0, opens: 0, closes: 0 };
function $E(e) {
  e && er.inject({ eventBus: e }), v0();
  const t = TE("eventBus");
  t && t.emit && t.emit(f.SUBMENU_INITIALIZED);
}
function rd(e) {
  Bs.creates++;
  const t = document.createElement("ul");
  return t.className = c.SUBMENU, t.setAttribute("role", "menu"), e.forEach((r) => {
    const n = document.createElement("li");
    n.className = c.SUBMENU_ITEM, n.setAttribute("role", "none");
    const s = document.createElement("a");
    s.className = c.SUBMENU_LINK, s.href = r.route || `#${r.id}`, s.setAttribute("role", "menuitem"), s.setAttribute("data-submenu-item", r.id), s.textContent = r.label || r.title || r.id, n.appendChild(s), t.appendChild(n);
  }), t;
}
function kE(e, t) {
  if (!e || !(t != null && t.length)) return null;
  e.classList.add(c.ITEM_HAS_SUBMENU);
  const r = rd(t);
  return e.appendChild(r), r;
}
function nd(e) {
  if (!(e != null && e.classList.contains(c.ITEM_HAS_SUBMENU))) return !1;
  Bs.toggles++;
  const t = e.classList.toggle(c.ITEM_SUBMENU_OPEN), r = TE("eventBus");
  return r && r.emit && r.emit(f.SUBMENU_TOGGLED, { itemId: e.dataset.itemId, isOpen: t }), t;
}
function wE(e) {
  return e != null && e.classList.contains(c.ITEM_HAS_SUBMENU) ? (Bs.opens++, e.classList.add(c.ITEM_SUBMENU_OPEN), !0) : !1;
}
function NE(e) {
  return e != null && e.classList.contains(c.ITEM_HAS_SUBMENU) ? (Bs.closes++, e.classList.remove(c.ITEM_SUBMENU_OPEN), !0) : !1;
}
function RE(e) {
  e && e.querySelectorAll(`.${c.ITEM_SUBMENU_OPEN}`).forEach((t) => {
    t.classList.remove(c.ITEM_SUBMENU_OPEN);
  });
}
function xE(e) {
  if (!e) return () => {
  };
  const t = (n) => {
    const s = n.target.closest(`.${c.ITEM_HAS_SUBMENU}`);
    if (!s) return;
    n.target.closest(`.${c.LINK}`) && (n.preventDefault(), nd(s));
  };
  e.addEventListener("click", t);
  const r = () => {
    e.removeEventListener("click", t);
  };
  return nl.push(r), r;
}
function PE() {
  nl.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), nl = [];
}
function sa() {
  return { ...Bs };
}
function HE() {
  return { moduleId: zs, version: na, portsInitialized: er.isInitialized(), metrics: sa() };
}
function zE() {
  return { status: er.isInitialized() ? "HEALTHY" : "DEGRADED", version: na, moduleId: zs, portsInitialized: er.isInitialized(), checks: {}, metrics: sa() };
}
var I0 = { init: $E, createSubmenu: rd, addSubmenuToItem: kE, toggleSubmenu: nd, openSubmenu: wE, closeSubmenu: NE, closeAllSubmenus: RE, setupSubmenuHandlers: xE, destroy: PE, injectPorts: DE, getPorts: LE, getMetrics: sa, info: HE, healthCheck: zE, VERSION: na, MODULE_ID: zs };
const BE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: zs,
  VERSION: na,
  addSubmenuToItem: kE,
  closeAllSubmenus: RE,
  closeSubmenu: NE,
  createSubmenu: rd,
  default: I0,
  destroy: PE,
  getMetrics: sa,
  getPorts: LE,
  healthCheck: zE,
  info: HE,
  init: $E,
  injectPorts: DE,
  openSubmenu: wE,
  setupSubmenuHandlers: xE,
  toggleSubmenu: nd
}, Symbol.toStringTag, { value: "Module" })), ia = "6.1.0-ES6", Us = "sidebar-theme-handler", tr = v({ moduleId: Us });
function S0() {
  tr.init();
}
function C0(e) {
  return tr.get(e);
}
function UE(e) {
  return tr.inject(e);
}
function jE() {
  return tr.snapshot();
}
const FE = "dsd-sidebar-theme", Ve = ["dark", "light", "high-contrast"], sl = { dark: c.MOD_DARK, light: c.MOD_LIGHT, "high-contrast": c.MOD_HIGH_CONTRAST };
let qr = "dark", an = null, sd = { sets: 0, toggles: 0 };
function GE() {
  try {
    const e = localStorage.getItem(FE);
    return Ve.includes(e) ? e : "dark";
  } catch {
    return "dark";
  }
}
function A0(e) {
  try {
    localStorage.setItem(FE, e);
  } catch {
  }
}
function VE(e, t) {
  e && tr.inject({ eventBus: e }), S0(), an = t;
  const r = GE();
  js(t, r);
  const n = C0("eventBus");
  n && n.emit && n.emit(f.THEME_HANDLER_INITIALIZED);
}
function js(e, t) {
  if (!e || !Ve.includes(t)) return !1;
  if (an = e, sd.sets++, Ve.forEach((r) => {
    const n = sl[r];
    n && e.classList.remove(n);
  }), t !== "dark") {
    const r = sl[t];
    r && e.classList.add(r);
  }
  return qr = t, A0(t), !0;
}
function qE() {
  return qr;
}
function YE(e) {
  sd.toggles++;
  const r = (Ve.indexOf(qr) + 1) % Ve.length;
  return js(e, Ve[r]);
}
function KE(e) {
  an = e;
  const t = GE();
  return js(e, t);
}
function WE() {
  return [].concat(Ve);
}
function XE() {
  an && Ve.forEach((e) => {
    const t = sl[e];
    t && an.classList.remove(t);
  }), an = null, qr = "dark";
}
function oa() {
  return { ...sd, currentTheme: qr };
}
function ZE() {
  return { moduleId: Us, version: ia, portsInitialized: tr.isInitialized(), currentTheme: qr, availableThemes: Ve, metrics: oa() };
}
function JE() {
  return { status: tr.isInitialized() ? "HEALTHY" : "DEGRADED", version: ia, moduleId: Us, portsInitialized: tr.isInitialized(), checks: { currentTheme: qr, availableThemes: Ve.length }, metrics: oa() };
}
var M0 = { init: VE, setTheme: js, getTheme: qE, toggleTheme: YE, initTheme: KE, getAvailableThemes: WE, destroy: XE, injectPorts: UE, getPorts: jE, getMetrics: oa, info: ZE, healthCheck: JE, VERSION: ia, MODULE_ID: Us, THEMES: Ve };
const QE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Us,
  VERSION: ia,
  default: M0,
  destroy: XE,
  getAvailableThemes: WE,
  getMetrics: oa,
  getPorts: jE,
  getTheme: qE,
  healthCheck: JE,
  info: ZE,
  init: VE,
  initTheme: KE,
  injectPorts: UE,
  setTheme: js,
  toggleTheme: YE
}, Symbol.toStringTag, { value: "Module" })), aa = "6.1.0-ES6", Fs = "sidebar-virtual-list", rr = v({ moduleId: Fs });
function O0() {
  rr.init();
}
function la(e) {
  return rr.get(e);
}
function eb(e) {
  return rr.inject(e);
}
function tb() {
  return rr.snapshot();
}
let V = null, ie = { itemHeight: 40, bufferSize: 5, threshold: 50 }, M = { items: [], visibleItems: [], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: !1 }, Un = null, ca = { enables: 0, disables: 0, renders: 0 };
function rb(e, t, r) {
  e && rr.inject({ eventBus: e }), O0(), V = t, ie = Object.assign({}, ie, r || {});
  const n = la("eventBus");
  n && n.emit && n.emit(f.VIRTUAL_INITIALIZED);
}
function id(e) {
  if (!V || e.length < ie.threshold) return !1;
  ca.enables++, M.items = e, M.enabled = !0, M.totalHeight = e.length * ie.itemHeight;
  const t = T0(), r = V.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!r) return !1;
  const n = r.innerHTML;
  r.innerHTML = "", r.appendChild(t);
  const s = () => {
    D0(r, t);
  };
  r.addEventListener("scroll", s, { passive: !0 }), ua(r, t), Un = () => {
    r.removeEventListener("scroll", s), r.innerHTML = n, M.enabled = !1;
  };
  const i = la("eventBus");
  return i && i.emit && i.emit(f.VIRTUAL_ENABLED, { itemCount: e.length }), !0;
}
function da() {
  ca.disables++, Un == null || Un(), Un = null, M.enabled = !1;
  const e = la("eventBus");
  e && e.emit && e.emit(f.VIRTUAL_DISABLED);
}
function T0() {
  const e = document.createElement("div");
  e.className = "dsd-virtual-list", e.style.cssText = `position:relative;height:${M.totalHeight}px;overflow:hidden;`;
  const t = document.createElement("div");
  return t.className = "dsd-virtual-list__content", t.style.cssText = "position:absolute;left:0;right:0;will-change:transform;", e.appendChild(t), e;
}
function D0(e, t) {
  M.enabled && requestAnimationFrame(() => {
    ua(e, t);
  });
}
function ua(e, t) {
  ca.renders++;
  const r = e.scrollTop, n = e.clientHeight, s = Math.max(0, Math.floor(r / ie.itemHeight) - ie.bufferSize), i = Math.min(M.items.length, Math.ceil((r + n) / ie.itemHeight) + ie.bufferSize);
  if (s === M.startIndex && i === M.endIndex) return;
  M.startIndex = s, M.endIndex = i, M.scrollTop = r;
  const o = t.querySelector(".dsd-virtual-list__content");
  if (!o) return;
  const a = document.createDocumentFragment();
  for (let d = s; d < i; d++) {
    const u = M.items[d];
    if (!u) continue;
    const h = L0(u, d);
    a.appendChild(h);
  }
  o.innerHTML = "", o.appendChild(a), o.style.transform = `translateY(${s * ie.itemHeight}px)`, M.visibleItems = M.items.slice(s, i);
  const l = la("eventBus");
  l && l.emit && l.emit(f.VIRTUAL_UPDATED, { startIndex: s, endIndex: i, visibleCount: i - s });
}
function L0(e, t) {
  const r = document.createElement("div");
  r.className = `${c.ITEM} dsd-virtual-list__item`, r.style.height = `${ie.itemHeight}px`, r.dataset.itemId = e.id, r.dataset.virtualIndex = t;
  const n = e.active || e.id === $0();
  return n && r.classList.add(c.ITEM_ACTIVE), r.innerHTML = `<a class="${c.LINK}" href="${e.route || "#"}" tabindex="${n ? 0 : -1}">${e.icon ? `<span class="${c.ITEM_ICON}" aria-hidden="true">${e.icon}</span>` : ""}<span class="${c.ITEM_TEXT}">${e.label}</span>${e.badge ? `<span class="${c.BADGE}">${e.badge}</span>` : ""}</a>`, r;
}
function $0() {
  var e, t;
  return (t = (e = V == null ? void 0 : V.querySelector(`.${c.ITEM_ACTIVE}`)) == null ? void 0 : e.dataset) == null ? void 0 : t.itemId;
}
function nb(e) {
  const t = M.items.findIndex((s) => s.id === e);
  if (t === -1) return !1;
  const r = V == null ? void 0 : V.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  if (!r) return !1;
  const n = t * ie.itemHeight;
  return r.scrollTo({ top: n, behavior: "smooth" }), !0;
}
function sb(e, t) {
  const r = M.items.findIndex((n) => n.id === e);
  if (r === -1) return !1;
  if (M.items[r] = Object.assign({}, M.items[r], t), r >= M.startIndex && r < M.endIndex) {
    const n = V == null ? void 0 : V.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`), s = V == null ? void 0 : V.querySelector(".dsd-virtual-list");
    n && s && ua(n, s);
  }
  return !0;
}
function ib(e, t) {
  t === void 0 || t === -1 ? M.items.push(e) : M.items.splice(t, 0, e), M.totalHeight = M.items.length * ie.itemHeight;
  const r = V == null ? void 0 : V.querySelector(".dsd-virtual-list");
  return r && (r.style.height = `${M.totalHeight}px`), !0;
}
function ob(e) {
  const t = M.items.findIndex((s) => s.id === e);
  if (t === -1) return !1;
  M.items.splice(t, 1), M.totalHeight = M.items.length * ie.itemHeight;
  const r = V == null ? void 0 : V.querySelector(".dsd-virtual-list");
  r && (r.style.height = `${M.totalHeight}px`);
  const n = V == null ? void 0 : V.querySelector(`.${c.NAV_CONTENT}, .${c.NAV}`);
  return n && r && ua(n, r), !0;
}
function ha() {
  return { enabled: M.enabled, totalItems: M.items.length, visibleItems: M.visibleItems.length, startIndex: M.startIndex, endIndex: M.endIndex, totalHeight: M.totalHeight, itemHeight: ie.itemHeight };
}
function ab() {
  return M.enabled;
}
function lb() {
  return [].concat(M.items);
}
function cb(e) {
  const t = M.enabled;
  t && da(), t && e.length >= ie.threshold ? id(e) : M.items = e;
}
function db() {
  da(), M = { items: [], visibleItems: [], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: !1 };
}
function fa() {
  return { ...ca, ...ha() };
}
function ub() {
  return { moduleId: Fs, version: aa, portsInitialized: rr.isInitialized(), state: ha(), metrics: fa() };
}
function hb() {
  return { status: rr.isInitialized() ? "HEALTHY" : "DEGRADED", version: aa, moduleId: Fs, portsInitialized: rr.isInitialized(), checks: { enabled: M.enabled, itemCount: M.items.length, visibleCount: M.visibleItems.length, threshold: ie.threshold }, metrics: fa() };
}
var k0 = { init: rb, enable: id, disable: da, scrollToItem: nb, updateItem: sb, addItem: ib, removeItem: ob, getState: ha, isEnabled: ab, getItems: lb, setItems: cb, healthCheck: hb, destroy: db, injectPorts: eb, getPorts: tb, getMetrics: fa, info: ub, VERSION: aa, MODULE_ID: Fs };
const fb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Fs,
  VERSION: aa,
  addItem: ib,
  default: k0,
  destroy: db,
  disable: da,
  enable: id,
  getItems: lb,
  getMetrics: fa,
  getPorts: tb,
  getState: ha,
  healthCheck: hb,
  info: ub,
  init: rb,
  injectPorts: eb,
  isEnabled: ab,
  removeItem: ob,
  scrollToItem: nb,
  setItems: cb,
  updateItem: sb
}, Symbol.toStringTag, { value: "Module" })), od = {
  "accessibility-landmarks": ef,
  "accordion-ncs": Ef,
  "animated-transitions": kf,
  "auto-theme": Vf,
  "command-palette": ng,
  "compact-mode": mg,
  "config-manager": Ag,
  "context-menu": Rg,
  "debug-panel": Fg,
  "dynamic-badges": rm,
  "event-setup": v_,
  "favorites-handler": gm,
  "feature-flags": Lm,
  "fuzzy-search": zm,
  "highlight-matches": Xm,
  "intersection-observer": op,
  "keyboard-navigation": Hv,
  "keyboard-shortcuts-extended": gp,
  "mini-mode": Mp,
  "mobile-handler": Fv,
  "notification-dots": xp,
  parallax: Vp,
  "preload-critical-css": rE,
  "resize-handler": hE,
  "router-sync": D_,
  "screen-reader": OE,
  "submenu-handler": BE,
  "theme-handler": QE,
  "virtual-list": fb
}, ad = "5.3.0-P2-ENTERPRISE", ld = "sidebar-window-api", gb = 30, ga = v({ moduleId: ld });
function w0() {
  ga.init();
}
function il(e) {
  return ga.get(e);
}
function N0() {
  var t, r;
  const e = il("logger");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("Logger");
    if (n) return n;
  }
  return null;
}
const _t = (e, ...t) => {
  const r = "[WindowAPI]", n = N0();
  n != null && n[e] ? n[e](r, ...t) : !vt() && (e === "error" || e === "warn" || e === "info") && console.debug(r, ...t);
};
function R0() {
  var t, r;
  const e = il("eventBus") || il("eventBusGlobal");
  if (e) return e;
  if (typeof window < "u" && ((r = (t = window.Core) == null ? void 0 : t.windowAdapter) != null && r.get)) {
    const n = window.Core.windowAdapter.get("EventBus");
    if (n) return n;
  }
  return null;
}
const z = {
  initialized: !1,
  setupAt: null,
  getInstance: null,
  getSidebarEl: null,
  featureCache: /* @__PURE__ */ new Map(),
  legacyBridgeApplied: !1,
  featuresPreloaded: !1,
  readyListenerCleanup: null
}, W = {
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
  W.apiCalls++, W.lastCallAt = Date.now(), W.mostUsedMethods[e] = (W.mostUsedMethods[e] || 0) + 1;
}
async function mb(e, t) {
  if (!t || !t.module) return null;
  try {
    const r = t.module.endsWith(".js") ? t.module.slice(0, -3) : t.module, n = od[r];
    return n ? (W.featureLoads++, n) : (W.errors++, _t("warn", `Feature not found in barrel: ${r}`), null);
  } catch (r) {
    return W.errors++, _t("warn", `Failed to load feature: ${e}`, r.message), null;
  }
}
function fu(e) {
  return jh(e, Qn, mb);
}
async function x0(e) {
  if (z.featureCache.has(e)) return z.featureCache.get(e);
  try {
    const t = od[e];
    return t ? (z.featureCache.set(e, t), W.featureLoads++, t) : (W.errors++, _t("warn", `Feature not found in barrel: ${e}`), null);
  } catch (t) {
    return W.errors++, _t("warn", `Failed to load feature: ${e}`, t.message), null;
  }
}
async function za() {
  if (z.featuresPreloaded) return;
  W.preloadStartedAt = Date.now();
  const e = ["favorites", "theme", "search", "commands", "context", "submenu", "resize"];
  try {
    await EI(e, Qn, mb);
    const t = ["theme-handler", "resize-handler", "favorites-handler", "command-palette", "fuzzy-search", "context-menu", "submenu-handler"];
    await Promise.all(t.map((r) => x0(r))), z.featuresPreloaded = !0, W.preloadCompletedAt = Date.now(), _t("info", "Features preloaded post-READY", { duration: W.preloadCompletedAt - W.preloadStartedAt, featuresCount: e.length + t.length });
  } catch (t) {
    W.errors++, _t("warn", "Preload failed:", t.message);
  }
}
function P0() {
  const e = R0();
  if (!e || !e.on) {
    _t("warn", "No EventBus, preloading immediately"), za();
    return;
  }
  const t = () => {
    za(), z.readyListenerCleanup && (z.readyListenerCleanup(), z.readyListenerCleanup = null);
  }, r = e.on(f.READY, t);
  typeof r == "function" ? z.readyListenerCleanup = r : z.readyListenerCleanup = () => {
    e.off && e.off(f.READY, t);
  }, setTimeout(() => {
    z.featuresPreloaded || (_t("warn", "READY timeout, preloading now"), za());
  }, 5e3);
}
function H0(e, t, r, n) {
  if (!(typeof window > "u")) {
    if (W.setupCalls++, z.initialized = !0, z.setupAt = Date.now(), z.getInstance = e, z.getSidebarEl = t, w0(), P0(), vt()) {
      _t("info", "Strict mode: window.Sidebar not exposed");
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
      checkPersistenceSync: () => (T("checkPersistenceSync"), h_()),
      forcePersistenceSync: () => (T("forcePersistenceSync"), f_()),
      feature: (s) => (T(`feature:${s}`), fu(s)),
      kernel: {
        listFeatures: () => xi(),
        getFeatureStatus: (s) => fs(s),
        enableFeature: (s, i) => hs(s, i),
        disableFeature: (s, i) => vn(s, i),
        metrics: () => In(),
        healthCheck: () => or()
      },
      metrics: {
        aggregate: () => Je(),
        getSourceMetrics: (s) => Bi(s),
        listSources: () => Fi(),
        takeSnapshot: (s) => Ui(s),
        getSnapshots: (s) => ji(s)
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
          window.Sidebar.config.legacyWarnings = s, Na();
        },
        getDeprecationReport: () => Na(),
        getFeatureContracts: () => ({ ...Qn }),
        listFeatures: () => Object.keys(Qn)
      },
      VERSION: fr,
      MODULE_ID: oe,
      CAPABILITIES: bu,
      TOTAL_FEATURES: gb,
      API_VERSION: ad,
      getAPIMetrics: () => U0(),
      getAPIInfo: () => B0(),
      getAPIHealthCheck: () => z0(),
      getProxyMetrics: () => qi()
    }, CI(window.Sidebar, fu), z.legacyBridgeApplied = !0, Na({ showWarnings: window.Sidebar.config.legacyWarnings });
  }
}
function z0() {
  const t = z.getInstance && typeof z.getInstance == "function" && z.getInstance() !== null, r = typeof window < "u" && window.Sidebar !== void 0, n = ga.isInitialized(), s = or(), i = bI(), o = {
    initialized: z.initialized,
    instanceExists: t,
    windowAPIExists: r,
    portsInitialized: n,
    kernelReady: s.status === "HEALTHY",
    legacyBridgeApplied: z.legacyBridgeApplied,
    proxyHealthy: i.status === "HEALTHY",
    featuresPreloaded: z.featuresPreloaded,
    noErrors: W.errors === 0
  }, a = Object.values(o).filter(Boolean).length, l = Object.keys(o).length;
  let d = "HEALTHY";
  return a < l && a >= Math.floor(l * 0.6) && (d = "DEGRADED"), a < Math.floor(l * 0.6) && (d = "UNHEALTHY"), {
    status: d,
    score: { passed: a, total: l, percentage: Math.round(a / l * 100) },
    checks: o,
    issues: Object.entries(o).filter(([, u]) => !u).map(([u]) => ({ code: u, severity: "warn", message: `Check failed: ${u}` })),
    moduleId: ld,
    version: ad,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    ports: { initialized: n, missing: [] },
    strictMode: vt(),
    timestamp: Date.now()
  };
}
function B0() {
  const e = Object.entries(W.mostUsedMethods).sort((t, r) => r[1] - t[1]).slice(0, 10).map(([t, r]) => ({ method: t, count: r }));
  return {
    moduleId: ld,
    version: ad,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    initialized: z.initialized,
    setupAt: z.setupAt,
    totalFeatures: gb,
    featuresCached: z.featureCache.size,
    featuresPreloaded: z.featuresPreloaded,
    legacyBridgeApplied: z.legacyBridgeApplied,
    availableFeatures: Object.keys(Qn).length,
    portsInitialized: ga.isInitialized(),
    strictMode: vt(),
    metrics: { ...W },
    proxyMetrics: qi(),
    topMethods: e,
    timestamp: Date.now()
  };
}
function U0() {
  return { ...W, featuresCached: z.featureCache.size, featuresPreloaded: z.featuresPreloaded, proxyMetrics: qi(), topMethods: Object.entries(W.mostUsedMethods).sort((e, t) => t[1] - e[1]).slice(0, 20) };
}
const pb = "6.1.0-P2-ENTERPRISE";
function j0(e) {
  var n;
  const t = Je().data || {};
  return {
    sidebar: ((n = e == null ? void 0 : e.getMetrics) == null ? void 0 : n.call(e)) || {},
    hub: t.hub || {},
    sources: t.sources || {},
    byCategory: t.byCategory || {},
    summary: t.summary || { totalSources: 0, activeSources: 0 },
    version: fr,
    aggregatorVersion: pb,
    timestamp: Date.now()
  };
}
function F0(e) {
  var r;
  const t = Gi().data || {};
  return {
    moduleId: oe,
    version: fr,
    aggregatorVersion: pb,
    architecture: "MetricsHub-Delegated",
    initialized: !!e,
    status: (e == null ? void 0 : e.status) || "not-initialized",
    sidebar: ((r = e == null ? void 0 : e.info) == null ? void 0 : r.call(e)) || null,
    metricsHub: t,
    sourcesCount: t.sourcesCount || 0,
    timestamp: Date.now()
  };
}
function G0(e) {
  typeof window > "u" || (window.__dev = window.__dev || {}, window.__dev.sidebar = {
    getInstance: () => e(),
    getRenderer: () => {
      var t;
      return (t = e()) == null ? void 0 : t._renderer;
    },
    getVersion: () => fr,
    info: () => F0(e()),
    getMetrics: () => j0(e()),
    healthCheck: () => {
      var t, r;
      return (r = (t = e()) == null ? void 0 : t.healthCheck) == null ? void 0 : r.call(t);
    },
    getState: () => {
      var t, r;
      return (r = (t = e()) == null ? void 0 : t.getState) == null ? void 0 : r.call(t);
    },
    getToggleMetrics: () => Zu(),
    resetDebounce: () => My(),
    registry: w,
    features: {
      favorites: gm,
      contextMenu: Rg,
      autoTheme: Vf,
      submenu: BE,
      configManager: Ag,
      parallax: Vp,
      commandPalette: ng,
      fuzzySearch: zm,
      featureFlags: Lm,
      screenReader: OE,
      compactMode: mg,
      miniMode: Mp,
      dynamicBadges: rm,
      accessibilityLandmarks: ef,
      keyboardShortcutsExtended: gp,
      virtualList: fb,
      animatedTransitions: kf,
      notificationDots: xp,
      highlightMatches: Xm,
      debugPanel: Fg,
      intersectionObserver: op,
      preloadCriticalCSS: rE,
      themeHandler: QE,
      resizeHandler: hE,
      accordionNcs: Ef
    }
  });
}
const cd = "sidebar-kernel-circuit-breaker", dd = "1.1.0-ES6", he = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
}), Eb = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  halfOpenMaxAttempts: 3
}, Ir = /* @__PURE__ */ new Map();
let ht = {
  totalFailures: 0,
  totalSuccesses: 0,
  circuitsOpened: 0,
  circuitsClosed: 0,
  blockedCalls: 0
};
function kn(e) {
  return Ir.has(e) || Ir.set(e, {
    state: he.CLOSED,
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    openedAt: null,
    halfOpenAttempts: 0,
    config: Object.assign({}, Eb)
  }), Ir.get(e);
}
function ud(e, t) {
  const r = kn(e);
  return r.config = Object.assign({}, Eb, t || {}), { ok: !0, featureId: e };
}
function Gs(e) {
  const t = kn(e);
  if (t.state === he.CLOSED)
    return { allowed: !0, state: t.state };
  if (t.state === he.OPEN) {
    const r = Date.now() - t.openedAt;
    return r >= t.config.timeout ? (t.state = he.HALF_OPEN, t.halfOpenAttempts = 0, { allowed: !0, state: t.state, reason: "timeout-expired" }) : (ht.blockedCalls++, { allowed: !1, state: t.state, reason: "circuit-open", retryAfter: t.config.timeout - r });
  }
  return t.state === he.HALF_OPEN ? t.halfOpenAttempts < t.config.halfOpenMaxAttempts ? (t.halfOpenAttempts++, { allowed: !0, state: t.state, attempt: t.halfOpenAttempts }) : (ht.blockedCalls++, { allowed: !1, state: t.state, reason: "half-open-limit" }) : { allowed: !0, state: t.state };
}
function Vs(e) {
  const t = kn(e);
  return t.successes++, t.lastSuccess = Date.now(), ht.totalSuccesses++, t.state === he.HALF_OPEN ? t.successes >= t.config.successThreshold && (t.state = he.CLOSED, t.failures = 0, t.successes = 0, ht.circuitsClosed++) : t.state === he.CLOSED && (t.failures = 0), { ok: !0, state: t.state };
}
function Rt(e, t) {
  const r = kn(e);
  return r.failures++, r.lastFailure = Date.now(), r.lastError = t, ht.totalFailures++, (r.state === he.HALF_OPEN || r.state === he.CLOSED && r.failures >= r.config.failureThreshold) && (r.state = he.OPEN, r.openedAt = Date.now(), ht.circuitsOpened++), { ok: !0, state: r.state };
}
function ma(e) {
  const t = kn(e);
  return t.state = he.CLOSED, t.failures = 0, t.successes = 0, t.halfOpenAttempts = 0, { ok: !0 };
}
function hd(e) {
  const t = kn(e);
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
function fd() {
  const e = {};
  return Ir.forEach((t, r) => {
    e[r] = {
      state: t.state,
      failures: t.failures,
      successes: t.successes
    };
  }), e;
}
function gd() {
  return Object.assign({}, ht, { circuitsCount: Ir.size });
}
function pa() {
  let e = 0;
  return Ir.forEach((t) => {
    t.state === he.OPEN && e++;
  }), {
    status: e === 0 ? "HEALTHY" : e < 3 ? "DEGRADED" : "UNHEALTHY",
    moduleId: cd,
    version: dd,
    openCircuits: e,
    totalCircuits: Ir.size,
    metrics: ht,
    timestamp: Date.now()
  };
}
async function bb(e, t, r) {
  if (!Gs(e).allowed) {
    if (r) return r();
    throw new Error("Circuit breaker is open for: " + e);
  }
  try {
    const s = await t();
    return Vs(e), s;
  } catch (s) {
    if (Rt(e, s), r) return r();
    throw s;
  }
}
var V0 = {
  MODULE_ID: cd,
  VERSION: dd,
  STATES: he,
  configure: ud,
  canExecute: Gs,
  execute: bb,
  recordSuccess: Vs,
  recordFailure: Rt,
  reset: ma,
  getStatus: hd,
  getAllStatus: fd,
  getMetrics: gd,
  healthCheck: pa
};
const q0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: cd,
  VERSION: dd,
  canExecute: Gs,
  configure: ud,
  default: V0,
  execute: bb,
  getAllStatus: fd,
  getMetrics: gd,
  getStatus: hd,
  healthCheck: pa,
  recordFailure: Rt,
  recordSuccess: Vs,
  reset: ma
}, Symbol.toStringTag, { value: "Module" })), Ea = "sidebar-kernel-health-monitor", ba = "1.1.0-ES6", _b = {
  intervalMs: 3e4,
  degradedThreshold: 80,
  unhealthyThreshold: 50,
  autoRecover: !0,
  maxRecoveryAttempts: 3,
  onDegraded: null,
  onUnhealthy: null,
  onRecovered: null
};
let Lr = null, de = Object.assign({}, _b), ci = null, yt = !1, di = /* @__PURE__ */ new Map(), it = {
  checksPerformed: 0,
  degradedEvents: 0,
  unhealthyEvents: 0,
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  lastCheckTime: null,
  lastStatus: null
}, Sr = [];
const Y0 = 100;
function K0(e) {
  Sr.unshift({
    timestamp: Date.now(),
    status: e.status,
    score: e.score,
    featuresHealthy: 0
  }), Sr.length > Y0 && Sr.pop();
}
function ol() {
  if (!Lr) return;
  const e = Lr.healthCheck();
  if (it.checksPerformed++, it.lastCheckTime = Date.now(), it.lastStatus = e.status, K0(e), e.score < de.unhealthyThreshold) {
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
  return de.autoRecover && W0(e), e;
}
function W0(e) {
  if (e.issues) {
    for (let t = 0; t < e.issues.length; t++)
      if (e.issues[t].code === "FEATURES_ERROR") {
        const n = Lr.listFeatures();
        if (n.ok && n.data && n.data.features)
          for (let s = 0; s < n.data.features.length; s++) {
            const i = n.data.features[s];
            if (i.status === "error") {
              const o = di.get(i.id) || 0;
              if (o < de.maxRecoveryAttempts) {
                it.recoveryAttempts++, di.set(i.id, o + 1);
                try {
                  if (Lr.enableFeature(i.id).ok && (it.recoverySuccesses++, di.delete(i.id), typeof de.onRecovered == "function"))
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
function md(e, t) {
  return yt ? { ok: !0, alreadyRunning: !0 } : (Lr = e, de = Object.assign({}, _b, t || {}), { ok: !0, config: Object.assign({}, de) });
}
function _a() {
  return yt ? { ok: !0, alreadyRunning: !0 } : Lr ? (yt = !0, ol(), ci = setInterval(ol, de.intervalMs), { ok: !0, intervalMs: de.intervalMs }) : { ok: !1, error: "Not initialized" };
}
function ya() {
  return yt ? (ci && (clearInterval(ci), ci = null), yt = !1, { ok: !0 }) : { ok: !0, alreadyStopped: !0 };
}
function pd() {
  return ol();
}
function Ed(e) {
  return e ? Sr.slice(0, e) : Sr.slice();
}
function va() {
  return Object.assign({}, it, { running: yt, historySize: Sr.length });
}
function yb() {
  return { moduleId: Ea, version: ba, running: yt, intervalMs: de.intervalMs, metrics: va() };
}
function Ia() {
  return {
    status: yt ? "HEALTHY" : "NOT_RUNNING",
    moduleId: Ea,
    version: ba,
    running: yt,
    metrics: it,
    timestamp: Date.now()
  };
}
function bd() {
  return ya(), Lr = null, Sr = [], di.clear(), { ok: !0 };
}
var X0 = {
  MODULE_ID: Ea,
  VERSION: ba,
  init: md,
  start: _a,
  stop: ya,
  checkNow: pd,
  getHistory: Ed,
  getMetrics: va,
  info: yb,
  healthCheck: Ia,
  destroy: bd
};
const Z0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Ea,
  VERSION: ba,
  checkNow: pd,
  default: X0,
  destroy: bd,
  getHistory: Ed,
  getMetrics: va,
  healthCheck: Ia,
  info: yb,
  init: md,
  start: _a,
  stop: ya
}, Symbol.toStringTag, { value: "Module" })), J0 = "sidebar-factory";
v({ moduleId: J0 });
let ge = null, al = !1;
function Q0() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.info();
  console.log("%cSidebarKernel Status", "font-weight:bold;color:#8B5CF6"), console.log("Version:", e.data.version), console.log("Status:", e.data.status);
  const t = ge.healthCheck();
  return console.log("Health:", t.status, `(${t.score}%)`), console.log("Features:", e.data.featuresCount), console.log("Uptime:", `${Math.round(e.data.uptime / 1e3)}s`), t;
}
function eC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.listFeatures();
  return e.ok && (console.log("%cFeatures", "font-weight:bold;color:#8B5CF6"), console.table(e.data.features)), e.data.features;
}
function tC(e) {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const t = ge.enableFeature(e);
  return console.log(t.ok ? `✓ Enabled: ${e}` : `✗ Failed: ${e}`, t), t;
}
function rC(e) {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const t = ge.disableFeature(e, "manual");
  return console.log(t.ok ? `✓ Disabled: ${e}` : `✗ Failed: ${e}`, t), t;
}
function nC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.healthCheck();
  return console.log("%cHealth Check", "font-weight:bold;color:#8B5CF6"), console.log("Status:", e.status), console.log("Score:", `${e.score}%`), e.issues && e.issues.length > 0 && (console.log("Issues:"), e.issues.forEach((t) => {
    console.log("  -", `${t.code}:`, t.message);
  })), e;
}
function sC() {
  if (!ge) return console.warn("[sk] Kernel not connected");
  const e = ge.metrics();
  return console.log("%cMetrics", "font-weight:bold;color:#8B5CF6"), console.table(e.data), e.data;
}
function iC() {
  console.log("%cSidebarKernel Console Commands", "font-weight:bold;color:#8B5CF6"), console.log(""), console.log("  sk.status()        - Show kernel status"), console.log("  sk.list()          - List all features"), console.log("  sk.enable(id)      - Enable a feature"), console.log("  sk.disable(id)     - Disable a feature"), console.log("  sk.health()        - Run health check"), console.log("  sk.metrics()       - Show metrics"), console.log("  sk.help()          - Show this help"), console.log("");
}
function oC(e) {
  return al ? { ok: !0, alreadyRegistered: !0 } : (ge = e, typeof window < "u" && (window.sk = {
    status: Q0,
    list: eC,
    enable: tC,
    disable: rC,
    health: nC,
    metrics: sC,
    help: iC
  }, al = !0), { ok: !0 });
}
function aC() {
  return typeof window < "u" && window.sk && delete window.sk, ge = null, al = !1, { ok: !0 };
}
const U = Object.freeze({
  PERFORMANCE: "performance",
  CORE: "core",
  SEARCH: "search",
  NAVIGATION: "navigation",
  UI: "ui",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  DEBUG: "debug"
}), j = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
}), lC = [
  { id: "preload-critical-css", path: "./features/preload-critical-css.js", category: U.PERFORMANCE, priority: j.CRITICAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Pré-carregamento de CSS crítico" },
  { id: "favorites-handler", path: "./features/favorites-handler.js", category: U.CORE, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de favoritos" },
  { id: "command-palette", path: "./features/command-palette.js", category: U.SEARCH, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Paleta de comandos (Ctrl+K)" },
  { id: "feature-flags", path: "./features/feature-flags.js", category: U.CORE, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Sistema de feature flags" },
  { id: "submenu-handler", path: "./features/submenu-handler.js", category: U.NAVIGATION, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de submenus" },
  { id: "fuzzy-search", path: "./features/fuzzy-search.js", category: U.SEARCH, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !1, description: "Busca fuzzy" },
  { id: "theme-handler", path: "./features/theme-handler.js", category: U.UI, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Gerenciador de temas" },
  { id: "accessibility-landmarks", path: "./features/accessibility-landmarks.js", category: U.ACCESSIBILITY, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Landmarks de acessibilidade" },
  { id: "screen-reader", path: "./features/screen-reader.js", category: U.ACCESSIBILITY, priority: j.HIGH, enabled: !0, dependencies: [], requiresEl: !0, description: "Suporte a leitores de tela" },
  { id: "dynamic-badges", path: "./features/dynamic-badges.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Badges dinâmicos" },
  { id: "keyboard-shortcuts-extended", path: "./features/keyboard-shortcuts-extended.js", category: U.ACCESSIBILITY, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Atalhos de teclado estendidos" },
  { id: "notification-dots", path: "./features/notification-dots.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Indicadores de notificação" },
  { id: "highlight-matches", path: "./features/highlight-matches.js", category: U.SEARCH, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Destaque de matches na busca" },
  { id: "context-menu", path: "./features/context-menu.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Menu de contexto" },
  { id: "resize-handler", path: "./features/resize-handler.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Gerenciador de redimensionamento" },
  { id: "auto-theme", path: "./features/auto-theme.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: ["theme-handler"], requiresEl: !0, description: "Tema automático" },
  { id: "compact-mode", path: "./features/compact-mode.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Modo compacto" },
  { id: "mini-mode", path: "./features/mini-mode.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Modo mini" },
  { id: "config-manager", path: "./features/config-manager.js", category: U.CORE, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Gerenciador de configuração" },
  { id: "accordion-ncs", path: "./features/accordion-ncs.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !1, description: "Accordion NCS" },
  { id: "animated-transitions", path: "./features/animated-transitions.js", category: U.UI, priority: j.NORMAL, enabled: !0, dependencies: [], requiresEl: !0, description: "Transições animadas" },
  { id: "parallax", path: "./features/parallax.js", category: U.VISUAL, priority: j.LOW, enabled: !0, dependencies: [], requiresEl: !1, description: "Efeito parallax" },
  { id: "debug-panel", path: "./features/debug-panel.js", category: U.DEBUG, priority: j.LOW, enabled: !0, dependencies: [], requiresEl: !0, description: "Painel de debug" },
  { id: "virtual-list", path: "./features/virtual-list.js", category: U.PERFORMANCE, priority: j.LOW, enabled: !1, dependencies: [], requiresEl: !0, description: "Lista virtualizada" },
  { id: "intersection-observer", path: "./features/intersection-observer.js", category: U.PERFORMANCE, priority: j.LOW, enabled: !1, dependencies: [], requiresEl: !0, description: "Intersection Observer para lazy load" }
];
function vb() {
  return lC.slice().sort((e, t) => e.priority - t.priority);
}
async function cC(e, t) {
  if (t.featureModules.has(e.id)) return t.featureModules.get(e.id);
  try {
    const r = od[e.id];
    return r ? (t.featureModules.set(e.id, r), r) : (t.moduleMetrics.featureErrors++, t.log("warn", `Feature not found in barrel: ${e.id}`), null);
  } catch (r) {
    return t.moduleMetrics.featureErrors++, t.moduleMetrics.lastError = { featureId: e.id, message: r.message, timestamp: Date.now() }, t.log("warn", `Failed to load feature: ${e.id}`, r.message), null;
  }
}
function dC(e) {
  try {
    const t = Ju(), r = t && t.featureTiers || {};
    return r.CORE && r.CORE.indexOf(e) > -1 ? "CORE" : r.POST_READY && r.POST_READY.indexOf(e) > -1 ? "POST_READY" : r.OPT_IN && r.OPT_IN.indexOf(e) > -1 ? "OPT_IN" : "CORE";
  } catch {
    return "CORE";
  }
}
function Ib(e, t) {
  return e.enabled === !1 ? !1 : t.safeMode ? dC(e.id) === "CORE" : !0;
}
function uC(e, t) {
  return !(e.enabled === !1 || e.priority > t.config.autoEnableMaxPriority);
}
async function hC(e) {
  if (e.featuresLoaded) return;
  const t = vb();
  if (e.config.enableCircuitBreaker)
    for (let r = 0; r < t.length; r++)
      ud(t[r].id, {
        failureThreshold: e.config.circuitBreakerFailureThreshold,
        timeout: e.config.circuitBreakerTimeout
      });
  for (let r = 0; r < t.length; r++) {
    const n = t[r];
    if (!Ib(n, e)) {
      e.log("debug", `Feature skipped (disabled): ${n.id}`), e.moduleMetrics.featuresSkipped++;
      continue;
    }
    if (e.config.enableCircuitBreaker) {
      const s = Gs(n.id);
      if (!s.allowed) {
        e.log("warn", `Feature blocked by circuit breaker: ${n.id}`, s.reason), e.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }
    try {
      const s = await cC(n, e);
      if (!s) {
        e.config.enableCircuitBreaker && Rt(n.id, "Load failed");
        continue;
      }
      Vl({
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
      }).ok ? (e.moduleMetrics.featuresRegistered++, e.config.enableCircuitBreaker && Vs(n.id), (s.getMetrics || s.default && s.default.getMetrics) && zi(n.id, {
        category: n.category,
        version: s.VERSION || s.default && s.default.VERSION || "0.0.0",
        getMetrics: s.getMetrics || s.default && s.default.getMetrics,
        healthCheck: s.healthCheck || s.default && s.default.healthCheck
      })) : e.config.enableCircuitBreaker && Rt(n.id, "Registration failed");
    } catch (s) {
      e.moduleMetrics.featureErrors++, e.config.enableCircuitBreaker && Rt(n.id, s.message), e.log("warn", `Failed to register feature: ${n.id}`, s.message);
    }
  }
  e.setFeaturesLoaded(!0);
}
async function fC(e, t, r) {
  const n = vb();
  for (let s = 0; s < n.length; s++) {
    const i = n[s];
    if (Ib(i, r) && uC(i, r)) {
      if (r.config.enableCircuitBreaker && !Gs(i.id).allowed) {
        r.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
      try {
        if (i.requiresEl && !t) continue;
        const o = {
          eventBus: e,
          sidebarEl: i.requiresEl ? t : void 0
        }, a = hs(i.id, o);
        a.ok && !(a.data && a.data.alreadyEnabled) ? (r.moduleMetrics.featuresEnabled++, r.config.enableCircuitBreaker && Vs(i.id), r.log("debug", `Feature enabled: ${i.id} (priority=${i.priority})`)) : a.ok || (r.moduleMetrics.featureErrors++, r.config.enableCircuitBreaker && Rt(i.id, "Enable failed"));
      } catch (o) {
        r.moduleMetrics.featureErrors++, r.config.enableCircuitBreaker && Rt(i.id, o.message), r.log("warn", `Failed to enable feature: ${i.id}`, o.message);
      }
    }
  }
}
function gC(e) {
  return (t = {}) => {
    if (e.getInstance()) return e.getInstance();
    const r = Date.now();
    e.initPorts();
    try {
      const o = Ju();
      e.setSafeMode(o && o.safeMode === !0 || t.safeMode === !0), o && o.kernel && e.setConfig(Object.assign({}, e.DEFAULT_CONFIG, o.kernel, t)), e.getSafeMode() && (e.moduleMetrics.safeModeBoots++, e.log("info", "SafeMode ACTIVE - minimal boot"));
    } catch {
      e.setSafeMode(t.safeMode === !0);
    }
    if (Gl({ ports: e.Ports.snapshot() }), Jl({ ports: e.Ports.snapshot() }), zi("sidebar-orchestrator", {
      category: "core",
      version: e.VERSION,
      getMetrics() {
        return Object.assign({}, e.moduleMetrics, { kernel: In().data });
      }
    }), e.getConfig().enableConsoleCommands)
      try {
        oC(Qa), e.log("debug", "Console commands registered (sk.*)");
      } catch (o) {
        e.log("warn", "Failed to register console commands:", o.message);
      }
    const n = new Zv();
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
        if (await hC(i), await fC(s, e.getSidebarEl(), i), e.getConfig().enableHealthMonitor)
          try {
            md(Qa, {
              intervalMs: e.getConfig().healthMonitorIntervalMs,
              autoRecover: e.getConfig().healthMonitorAutoRecover,
              onDegraded(o) {
                e.log("warn", "Kernel health degraded:", `${o.status} ${o.score}%`);
              },
              onRecovered(o) {
                e.log("info", "Feature recovered:", o), e.getConfig().enableCircuitBreaker && ma(o);
              }
            }), _a(), e.log("debug", "HealthMonitor started");
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
function mC(e) {
  return () => {
    if (!e.getInstance()) throw new Error("Sidebar not initialized");
    return e.getInstance();
  };
}
function pC(e) {
  return () => {
    if (e.getConfig().enableHealthMonitor)
      try {
        bd();
      } catch {
      }
    if (e.getConfig().enableConsoleCommands)
      try {
        aC();
      } catch {
      }
    Ri("destroySidebar"), tc();
    const t = e.getInstance();
    t && t.destroy && t.destroy(), e.setInstance(null), e.setFeaturesLoaded(!1), e.featureModules.clear(), e.setSafeMode(!1);
  };
}
function EC(e) {
  return () => {
    const t = !!e.getInstance(), r = !!e.getSidebarEl(), n = e.Ports.isInitialized(), s = or(), i = rc(), o = e.getConfig().enableCircuitBreaker ? pa() : null, a = e.getConfig().enableHealthMonitor ? Ia() : null, l = {
      hasInstance: t,
      hasSidebarElement: r,
      portsInitialized: n,
      kernelReady: s.status === "HEALTHY",
      metricsHubReady: i.status === "HEALTHY"
    }, d = Object.values(l).filter(Boolean).length, u = Object.keys(l).length;
    let h = "HEALTHY";
    return d < u && d >= Math.floor(u * 0.6) && (h = "DEGRADED"), d < Math.floor(u * 0.6) && (h = "UNHEALTHY"), {
      status: h,
      score: { passed: d, total: u, percentage: Math.round(d / u * 100) },
      checks: l,
      issues: s.issues || [],
      moduleId: oe,
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
function bC(e) {
  return () => ({
    moduleId: oe,
    version: e.VERSION,
    architecture: "Kernel-Orchestrated",
    safeMode: e.getSafeMode(),
    portsInitialized: e.Ports.isInitialized(),
    initialized: !!e.getInstance(),
    config: Object.assign({}, e.getConfig()),
    kernel: Pi().data,
    metricsHub: Gi().data,
    circuitBreakerEnabled: e.getConfig().enableCircuitBreaker,
    healthMonitorEnabled: e.getConfig().enableHealthMonitor,
    moduleMetrics: Object.assign({}, e.moduleMetrics),
    featuresLoaded: e.getFeaturesLoaded(),
    featureModulesCount: e.featureModules.size,
    timestamp: Date.now()
  });
}
function _C() {
  return () => Je().data;
}
const yC = {
  listFeatures: xi,
  getFeatureStatus: fs,
  getFeature: Wl,
  enableFeature: hs,
  disableFeature: vn,
  canDisable: ql,
  getDependents: Yl,
  getFeaturesByStatus: Kl,
  getFeatureMetrics: Xl,
  metrics: In,
  healthCheck: or,
  exportDiagnostics: Zl
}, vC = {
  aggregate: Je,
  getSourceMetrics: Bi,
  getMetricsByCategory: Ql,
  takeSnapshot: Ui,
  getSnapshots: ji,
  compareSnapshots: ec,
  listSources: Fi
}, IC = {
  getStatus: hd,
  getAllStatus: fd,
  reset: ma,
  getMetrics: gd,
  healthCheck: pa
}, SC = {
  start: _a,
  stop: ya,
  checkNow: pd,
  getHistory: Ed,
  getMetrics: va,
  healthCheck: Ia
}, Sb = "7.4.0-P2-ENTERPRISE", qs = v({ moduleId: oe }), CC = () => {
  qs.init();
}, ll = (e) => qs.get(e);
function AC(e) {
  return qs.inject(e);
}
function MC() {
  return qs.snapshot();
}
const OC = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), r = "[Sidebar]", n = ll("logger");
  n && n[e] ? n[e](...[r].concat(t)) : (e === "error" || e === "warn" || e === "info") && console.debug.apply(console, [r].concat(t));
};
function TC() {
  return ll("eventBus") || ll("eventBusGlobal");
}
let ct = null, gu = !1;
const DC = /* @__PURE__ */ new Map();
let mu = !1;
const Cb = {
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
let pu = Object.assign({}, Cb), LC = {
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
const Ab = () => !ct || !ct._renderer || !ct._renderer.getSidebar ? null : ct._renderer.getSidebar(), Ys = {
  Ports: qs,
  VERSION: Sb,
  DEFAULT_CONFIG: Cb,
  log: OC,
  initPorts: CC,
  getEventBus: TC,
  getSidebarEl: Ab,
  moduleMetrics: LC,
  featureModules: DC,
  getInstance: () => ct,
  setInstance: (e) => {
    ct = e;
  },
  getConfig: () => pu,
  setConfig: (e) => {
    pu = e;
  },
  getSafeMode: () => mu,
  setSafeMode: (e) => {
    mu = e;
  },
  getFeaturesLoaded: () => gu,
  setFeaturesLoaded: (e) => {
    gu = e;
  }
}, Mb = gC(Ys), KC = mC(Ys), Ob = pC(Ys), $C = EC(Ys), kC = bC(Ys), wC = _C(), NC = yC, RC = vC, xC = IC, PC = SC;
typeof window < "u" && (G0(() => ct), vt() ? (zn("GLOBAL_EXPOSURE_BLOCKED", { module: oe, target: "(window as any).SidebarKernel" }), zn("GLOBAL_EXPOSURE_BLOCKED", { module: oe, target: "(window as any).SidebarMetricsHub" }), zn("GLOBAL_EXPOSURE_BLOCKED", { module: oe, target: "(window as any).SidebarCircuitBreaker" }), zn("GLOBAL_EXPOSURE_BLOCKED", { module: oe, target: "(window as any).SidebarHealthMonitor" })) : (H0(() => ct, Ab, Mb, Ob), window.SidebarKernel = Qa, window.SidebarMetricsHub = sI, window.SidebarCircuitBreaker = q0, window.SidebarHealthMonitor = Z0));
const WC = {
  VERSION: Sb,
  MODULE_ID: oe,
  CAPABILITIES: bu,
  createSidebar: Mb,
  getSidebar() {
    return ct;
  },
  destroySidebar: Ob,
  getMetrics: wC,
  info: kC,
  healthCheck: $C,
  injectPorts: AC,
  getPorts: MC,
  kernel: NC,
  metricsHub: RC,
  circuitBreaker: xC,
  healthMonitor: PC
}, Ks = "5.6.0-UARPS-ONLY", Sa = "sidebar-items-manifest";
let Ws = { lookups: 0, filters: 0 };
const ft = [
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
function Tb(e) {
  return Ws.lookups++, Xe.find((t) => t.id === e) || null;
}
function Db(e) {
  return Ws.lookups++, Xe.filter((t) => t.sectionId === e).sort((t, r) => (t.priority || 100) - (r.priority || 100));
}
function _d(e) {
  return Ws.lookups++, ft.find((t) => t.id === e) || null;
}
function Lb(e) {
  const t = _d(e);
  return (t == null ? void 0 : t.icon) || "grid";
}
function $b(e, t = 0) {
  return Ws.filters++, [...e];
}
function kb() {
  return { version: Ks, sections: [...ft], items: [...Xe], timestamp: Date.now() };
}
function Ca() {
  return { ...Ws, sectionsCount: ft.length, itemsCount: Xe.length };
}
function wb() {
  return { moduleId: Sa, version: Ks, sectionsCount: ft.length, itemsCount: Xe.length, metrics: Ca() };
}
function Nb() {
  const e = ft.length > 0, t = Xe.length > 0, r = ft.every((a) => !!a.icon), n = Xe.every((a) => !!a.route), s = { hasSections: e, hasItems: t, allSectionsHaveIcons: r, allItemsHaveRoutes: n, validStructure: !0 }, i = Object.values(s).filter(Boolean).length, o = Object.keys(s).length;
  return {
    status: i === o ? "HEALTHY" : "DEGRADED",
    score: i,
    maxScore: o,
    scoreDisplay: `${i}/${o}`,
    checks: s,
    sectionsCount: ft.length,
    itemsCount: Xe.length,
    version: Ks,
    moduleId: Sa,
    timestamp: Date.now(),
    metrics: Ca()
  };
}
var HC = { VERSION: Ks, MODULE_ID: Sa, SECTIONS: ft, ITEMS: Xe, getManifest: kb, getItemById: Tb, getItemsBySection: Db, getSectionById: _d, getSectionIcon: Lb, filterByLevel: $b, info: wb, getMetrics: Ca, healthCheck: Nb };
const zC = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ITEMS: Xe,
  MODULE_ID: Sa,
  SECTIONS: ft,
  VERSION: Ks,
  default: HC,
  filterByLevel: $b,
  getItemById: Tb,
  getItemsBySection: Db,
  getManifest: kb,
  getMetrics: Ca,
  getSectionById: _d,
  getSectionIcon: Lb,
  healthCheck: Nb,
  info: wb
}, Symbol.toStringTag, { value: "Module" }));
export {
  bu as CAPABILITIES,
  fr as CORE_VERSION,
  L as LIFECYCLE_STATES,
  oe as MODULE_ID,
  JC as SIDEBAR_EVENTS,
  Zv as Sidebar,
  w as SidebarRegistry,
  Sb as VERSION,
  xC as circuitBreaker,
  Mb as createSidebar,
  WC as default,
  Ob as destroySidebar,
  wC as getMetrics,
  MC as getPorts,
  KC as getSidebar,
  $C as healthCheck,
  PC as healthMonitor,
  kC as info,
  AC as injectPorts,
  NC as kernel,
  RC as metricsHub
};
