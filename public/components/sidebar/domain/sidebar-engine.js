import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { SidebarStateMachine, LIFECYCLE_STATES } from "./state-machine.js";
const VERSION = "5.7.0-DUAL-LOOKUP";
const MODULE_ID = "sidebar-engine";
class SidebarEngine {
  constructor(options = {}) {
    this._options = options;
    this._stateMachine = new SidebarStateMachine({
      collapsed: options.defaultCollapsed ?? false,
      accordion: options.accordion ?? {}
    });
    this._items = [];
    this._sections = [];
    this._badges = /* @__PURE__ */ new Map();
    this._eventHandlers = /* @__PURE__ */ new Map();
    this._ports = null;
    this._metrics = {
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
  setPorts(ports) {
    this._ports = ports;
  }
  // LIFECYCLE
  async init() {
    this._metrics.inits++;
    const result = this._stateMachine.transitionTo(LIFECYCLE_STATES.INITIALIZING);
    if (!result.success) return result;
    this._emit(SIDEBAR_EVENTS.INITIALIZED, { version: VERSION });
    return { success: true, state: this._stateMachine.lifecycle };
  }
  async mount() {
    this._metrics.mounts++;
    const result = this._stateMachine.transitionTo(LIFECYCLE_STATES.MOUNTING);
    if (!result.success) return result;
    this._emit(SIDEBAR_EVENTS.TOGGLE, { action: "mounting" });
    return { success: true, state: this._stateMachine.lifecycle };
  }
  async ready() {
    this._metrics.readys++;
    if (this._stateMachine.lifecycle === LIFECYCLE_STATES.MOUNTING) {
      this._stateMachine.transitionTo(LIFECYCLE_STATES.MOUNTED);
    }
    const result = this._stateMachine.transitionTo(LIFECYCLE_STATES.READY);
    if (!result.success) return result;
    this._autoExpandNonCollapsibleSections();
    this._emit(SIDEBAR_EVENTS.READY, { version: VERSION });
    return { success: true, state: this._stateMachine.lifecycle };
  }
  async destroy() {
    this._metrics.destroys++;
    const result = this._stateMachine.transitionTo(LIFECYCLE_STATES.DESTROYING);
    if (!result.success) return result;
    this._emit(SIDEBAR_EVENTS.TOGGLE, { action: "destroying" });
    this._items = [];
    this._sections = [];
    this._badges.clear();
    this._eventHandlers.clear();
    this._stateMachine.transitionTo(LIFECYCLE_STATES.DESTROYED);
    this._emit(SIDEBAR_EVENTS.DESTROYED, {});
    return { success: true };
  }
  // REGISTRY DATA LOADING
  loadItems(items) {
    if (!Array.isArray(items)) return { success: false, error: "Items must be array" };
    this._items = items;
    this._emit(SIDEBAR_EVENTS.ITEMS_LOADED, { itemsCount: items.length });
    return { success: true, count: items.length };
  }
  loadSections(sections) {
    if (!Array.isArray(sections)) return { success: false, error: "Sections must be array" };
    this._sections = sections;
    this._autoExpandNonCollapsibleSections();
    return { success: true, count: sections.length };
  }
  _autoExpandNonCollapsibleSections() {
    const nonCollapsible = this._sections.filter((s) => s.collapsible === false).map((s) => s.id);
    if (nonCollapsible.length > 0) this._stateMachine.expandAllSections(nonCollapsible);
  }
  getItems() {
    return [...this._items];
  }
  getSections() {
    return [...this._sections];
  }
  // v5.7.0: Dual-lookup — resolves both numeric id and item_key string
  // DOM uses item_key ("sidebar.financeiro") as data-item-id, router-sync passes item_key
  getItemById(id) {
    const byId = this._items.find((item) => item.id === id);
    if (byId) return byId;
    if (typeof id === "string") {
      this._metrics.keyLookups++;
      return this._items.find((item) => item.key === id || item.item_key === id) || null;
    }
    return null;
  }
  getSectionById(id) {
    return this._sections.find((section) => section.id === id) || null;
  }
  getItemsBySection(sectionId) {
    return this._items.filter((item) => item.sectionId === sectionId);
  }
  // ACCORDION / SECTION COLLAPSE
  isSectionExpanded(sectionId) {
    const section = this.getSectionById(sectionId);
    if (section && section.collapsible === false) return true;
    return this._stateMachine.isSectionExpanded(sectionId);
  }
  toggleSection(sectionId) {
    const section = this.getSectionById(sectionId);
    if (!section) return { success: false, error: "Section not found" };
    if (section.collapsible === false) return { success: false, error: "Section is not collapsible" };
    this._metrics.sectionToggles++;
    const result = this._stateMachine.toggleSection(sectionId);
    if (result.changed) {
      const event = result.expanded ? SIDEBAR_EVENTS.SUBMENU_TOGGLED : SIDEBAR_EVENTS.SUBMENU_TOGGLED;
      this._emit(event, { sectionId, section, expanded: result.expanded });
    }
    return result;
  }
  expandSection(sectionId) {
    const section = this.getSectionById(sectionId);
    if (!section) return { success: false, error: "Section not found" };
    const result = this._stateMachine.expandSection(sectionId);
    if (result.changed) this._emit(SIDEBAR_EVENTS.SUBMENU_TOGGLED, { sectionId, section, expanded: true });
    return result;
  }
  collapseSection(sectionId) {
    const section = this.getSectionById(sectionId);
    if (!section) return { success: false, error: "Section not found" };
    if (section.collapsible === false) return { success: false, error: "Section is not collapsible" };
    const result = this._stateMachine.collapseSection(sectionId);
    if (result.changed) this._emit(SIDEBAR_EVENTS.SUBMENU_TOGGLED, { sectionId, section, expanded: false });
    return result;
  }
  expandAllSections() {
    const collapsibleIds = this._sections.filter((s) => s.collapsible !== false).map((s) => s.id);
    return this._stateMachine.expandAllSections(collapsibleIds);
  }
  collapseAllSections() {
    return this._stateMachine.collapseAllSections();
  }
  getExpandedSections() {
    return this._stateMachine.expandedSectionsArray;
  }
  setAccordionMode(allowMultiple) {
    return this._stateMachine.setAccordionMode(allowMultiple);
  }
  // BADGE MANAGEMENT
  setBadge(itemId, badge) {
    this._metrics.badgeUpdates++;
    this._badges.set(itemId, badge);
    this._emit(SIDEBAR_EVENTS.BADGE_UPDATED, { type: "badge", itemId, badge });
    return { success: true };
  }
  getBadge(itemId) {
    return this._badges.get(itemId) || null;
  }
  removeBadge(itemId) {
    this._badges.delete(itemId);
    return { success: true };
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
    const result = this._stateMachine.toggle();
    if (result.changed) {
      this._emit(SIDEBAR_EVENTS.TOGGLE, { collapsed: this._stateMachine.collapsed });
    }
    return result;
  }
  collapse() {
    this._metrics.collapses++;
    const result = this._stateMachine.collapse();
    if (result.changed) this._emit(SIDEBAR_EVENTS.TOGGLE, { collapsed: true });
    return result;
  }
  expand() {
    this._metrics.expands++;
    const result = this._stateMachine.expand();
    if (result.changed) this._emit(SIDEBAR_EVENTS.TOGGLE, { collapsed: false });
    return result;
  }
  // MOBILE STATE
  setMobile(isMobile) {
    return this._stateMachine.setMobile(isMobile);
  }
  openMobile() {
    const result = this._stateMachine.openMobile();
    if (result.changed) this._emit(SIDEBAR_EVENTS.MOBILE_OPENED, {});
    return result;
  }
  closeMobile() {
    const result = this._stateMachine.closeMobile();
    if (result.changed) this._emit(SIDEBAR_EVENTS.MOBILE_CLOSED, {});
    return result;
  }
  toggleMobile() {
    const result = this._stateMachine.toggleMobile();
    if (result.changed) {
      const event = this._stateMachine.mobileOpen ? SIDEBAR_EVENTS.MOBILE_OPENED : SIDEBAR_EVENTS.MOBILE_CLOSED;
      this._emit(event, {});
    }
    return result;
  }
  // NAVIGATION
  setActiveItem(itemId) {
    const result = this._stateMachine.setActiveItem(itemId);
    if (result.changed) {
      const item = this.getItemById(itemId);
      if (item?.sectionId) this.expandSection(item.sectionId);
      this._emit(SIDEBAR_EVENTS.ITEM_CLICK, { itemId, item });
    }
    return result;
  }
  navigate(itemId) {
    this._metrics.navigations++;
    const item = this.getItemById(itemId);
    if (!item) return { success: false, error: "Item not found" };
    this._emit(SIDEBAR_EVENTS.NAVIGATE, { itemId, item });
    this._emit(SIDEBAR_EVENTS.ITEM_CLICK, { itemId, item });
    if (this._stateMachine.mobileOpen) this.closeMobile();
    return { success: true, item };
  }
  // EVENTS
  on(event, handler) {
    if (!this._eventHandlers.has(event)) this._eventHandlers.set(event, /* @__PURE__ */ new Set());
    this._eventHandlers.get(event).add(handler);
    return () => this._eventHandlers.get(event)?.delete(handler);
  }
  off(event, handler) {
    if (handler) this._eventHandlers.get(event)?.delete(handler);
    else this._eventHandlers.delete(event);
  }
  _emit(event, data) {
    this._metrics.eventsEmitted++;
    const handlers = this._eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn({ event, data, timestamp: Date.now() });
        } catch {
        }
      });
    }
    if (this._ports?.events?.emit) this._ports.events.emit(event, data);
  }
  // STATE SUBSCRIPTION
  subscribe(callback) {
    return this._stateMachine.subscribe(callback);
  }
  // HEALTH, INFO & METRICS
  getState() {
    return {
      ...this._stateMachine.getState(),
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      collapsibleSectionsCount: this._sections.filter((s) => s.collapsible !== false).length
    };
  }
  getMetrics() {
    return {
      ...this._metrics,
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      expandedSectionsCount: this._stateMachine.expandedSections.size,
      handlersCount: this._eventHandlers.size,
      stateMachineMetrics: this._stateMachine.getMetrics?.() || null
    };
  }
  healthCheck() {
    const smHealth = this._stateMachine.healthCheck();
    const checks = {
      stateMachineHealthy: smHealth.status === "HEALTHY",
      lifecycleValid: smHealth.checks?.lifecycleValid ?? false,
      itemsLoaded: this._items.length > 0,
      sectionsLoaded: this._sections.length > 0,
      portsConnected: this._ports !== null,
      accordionStateValid: smHealth.checks?.accordionStateValid ?? false
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      lifecycle: this._stateMachine.lifecycle,
      itemsCount: this._items.length,
      sectionsCount: this._sections.length,
      badgesCount: this._badges.size,
      expandedSectionsCount: this._stateMachine.expandedSections.size,
      portsConnected: this._ports !== null,
      stateMachineHealth: smHealth,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
}
function createEngine(options) {
  return new SidebarEngine(options);
}
var sidebar_engine_default = SidebarEngine;
export {
  LIFECYCLE_STATES,
  MODULE_ID,
  SIDEBAR_EVENTS,
  SidebarEngine,
  VERSION,
  createEngine,
  sidebar_engine_default as default
};
