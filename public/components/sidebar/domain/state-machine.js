import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
const VERSION = "5.6.0-P18EC";
const MODULE_ID = "sidebar-state-machine";
const LIFECYCLE_STATES = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  MOUNTING: "mounting",
  MOUNTED: "mounted",
  READY: "ready",
  DEGRADED: "degraded",
  ERROR: "error",
  DESTROYING: "destroying",
  DESTROYED: "destroyed"
});
const COLLAPSE_STATES = Object.freeze({
  EXPANDED: "expanded",
  COLLAPSED: "collapsed",
  MINI: "mini"
});
const LIFECYCLE_TRANSITIONS = {
  [LIFECYCLE_STATES.IDLE]: [LIFECYCLE_STATES.INITIALIZING],
  [LIFECYCLE_STATES.INITIALIZING]: [LIFECYCLE_STATES.MOUNTING, LIFECYCLE_STATES.ERROR],
  [LIFECYCLE_STATES.MOUNTING]: [LIFECYCLE_STATES.MOUNTED, LIFECYCLE_STATES.ERROR],
  [LIFECYCLE_STATES.MOUNTED]: [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR],
  [LIFECYCLE_STATES.READY]: [LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.DEGRADED]: [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.ERROR]: [LIFECYCLE_STATES.DESTROYING, LIFECYCLE_STATES.INITIALIZING],
  [LIFECYCLE_STATES.DESTROYING]: [LIFECYCLE_STATES.DESTROYED],
  [LIFECYCLE_STATES.DESTROYED]: [LIFECYCLE_STATES.IDLE]
};
const ACCORDION_CONFIG = { persistState: true, storageKey: "dsd:sidebar:sections", allowMultipleOpen: true, animationDuration: 250 };
class SidebarStateMachine {
  constructor(options = {}) {
    this._lifecycle = LIFECYCLE_STATES.IDLE;
    this._collapsed = options.collapsed ?? false;
    this._mobileOpen = false;
    this._isMobile = false;
    this._activeItemId = null;
    this._hoveredItemId = null;
    this._subscribers = /* @__PURE__ */ new Set();
    this._history = [];
    this._maxHistory = 50;
    this._expandedSections = /* @__PURE__ */ new Set();
    this._accordionConfig = { ...ACCORDION_CONFIG, ...options.accordion };
    this._metrics = { transitions: 0, toggles: 0, sectionExpands: 0, sectionCollapses: 0, notifications: 0, resets: 0 };
    this._restoreExpandedSections();
  }
  get expandedSections() {
    return new Set(this._expandedSections);
  }
  get expandedSectionsArray() {
    return Array.from(this._expandedSections);
  }
  isSectionExpanded(sectionId) {
    return this._expandedSections.has(sectionId);
  }
  toggleSection(sectionId) {
    if (this._expandedSections.has(sectionId)) return this.collapseSection(sectionId);
    return this.expandSection(sectionId);
  }
  expandSection(sectionId) {
    if (this._expandedSections.has(sectionId)) return { success: true, changed: false, sectionId, expanded: true };
    this._metrics.sectionExpands++;
    if (!this._accordionConfig.allowMultipleOpen && this._expandedSections.size > 0) {
      const previouslyExpanded = Array.from(this._expandedSections);
      this._expandedSections.clear();
      previouslyExpanded.forEach((id) => this._notify("sectionCollapsed", { sectionId: id }));
    }
    this._expandedSections.add(sectionId);
    this._recordHistory("sectionExpanded", null, sectionId);
    this._persistExpandedSections();
    this._notify("sectionExpanded", { sectionId, expanded: true });
    return { success: true, changed: true, sectionId, expanded: true };
  }
  collapseSection(sectionId) {
    if (!this._expandedSections.has(sectionId)) return { success: true, changed: false, sectionId, expanded: false };
    this._metrics.sectionCollapses++;
    this._expandedSections.delete(sectionId);
    this._recordHistory("sectionCollapsed", sectionId, null);
    this._persistExpandedSections();
    this._notify("sectionCollapsed", { sectionId, expanded: false });
    return { success: true, changed: true, sectionId, expanded: false };
  }
  expandAllSections(sectionIds) {
    if (!Array.isArray(sectionIds)) return { success: false, error: "sectionIds must be array" };
    const changed = [];
    sectionIds.forEach((id) => {
      if (!this._expandedSections.has(id)) {
        this._expandedSections.add(id);
        changed.push(id);
      }
    });
    if (changed.length > 0) {
      this._persistExpandedSections();
      this._notify("sectionsExpandedBulk", { sectionIds: changed });
    }
    return { success: true, changed: changed.length > 0, expandedCount: changed.length };
  }
  collapseAllSections() {
    if (this._expandedSections.size === 0) return { success: true, changed: false };
    const collapsed = Array.from(this._expandedSections);
    this._expandedSections.clear();
    this._persistExpandedSections();
    this._notify("sectionsCollapsedAll", { sectionIds: collapsed });
    return { success: true, changed: true, collapsedCount: collapsed.length };
  }
  setAccordionMode(allowMultiple) {
    this._accordionConfig.allowMultipleOpen = !!allowMultiple;
    if (!allowMultiple && this._expandedSections.size > 1) {
      const first = this._expandedSections.values().next().value;
      this._expandedSections.clear();
      this._expandedSections.add(first);
      this._persistExpandedSections();
    }
    this._notify("accordionModeChanged", { allowMultiple });
    return { success: true, allowMultiple };
  }
  _persistExpandedSections() {
    if (!this._accordionConfig.persistState) return;
    try {
      localStorage.setItem(this._accordionConfig.storageKey, JSON.stringify(Array.from(this._expandedSections)));
    } catch {
    }
  }
  _restoreExpandedSections() {
    if (!this._accordionConfig.persistState) return;
    try {
      const stored = localStorage.getItem(this._accordionConfig.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) data.forEach((id) => this._expandedSections.add(id));
      }
    } catch {
    }
  }
  get lifecycle() {
    return this._lifecycle;
  }
  canTransitionTo(newState) {
    const allowed = LIFECYCLE_TRANSITIONS[this._lifecycle] || [];
    return allowed.includes(newState);
  }
  transitionTo(newState) {
    if (!this.canTransitionTo(newState)) return { success: false, error: `Invalid transition: ${this._lifecycle} -> ${newState}` };
    this._metrics.transitions++;
    const oldState = this._lifecycle;
    this._lifecycle = newState;
    this._recordHistory("lifecycle", oldState, newState);
    this._notify("lifecycle", { old: oldState, new: newState });
    return { success: true, old: oldState, new: newState };
  }
  get collapsed() {
    return this._collapsed;
  }
  get expanded() {
    return !this._collapsed;
  }
  setCollapsed(value) {
    if (this._collapsed === value) return { success: true, changed: false };
    const old = this._collapsed;
    this._collapsed = value;
    this._recordHistory("collapsed", old, value);
    this._notify("collapsed", { old, new: value });
    return { success: true, changed: true, old, new: value };
  }
  toggle() {
    this._metrics.toggles++;
    return this.setCollapsed(!this._collapsed);
  }
  collapse() {
    return this.setCollapsed(true);
  }
  expand() {
    return this.setCollapsed(false);
  }
  get mobileOpen() {
    return this._mobileOpen;
  }
  get isMobile() {
    return this._isMobile;
  }
  setMobile(value) {
    if (this._isMobile === value) return { success: true, changed: false };
    const old = this._isMobile;
    this._isMobile = value;
    if (!value) this._mobileOpen = false;
    this._recordHistory("isMobile", old, value);
    this._notify("isMobile", { old, new: value });
    return { success: true, changed: true };
  }
  setMobileOpen(value) {
    if (!this._isMobile) return { success: false, error: "Not in mobile mode" };
    if (this._mobileOpen === value) return { success: true, changed: false };
    const old = this._mobileOpen;
    this._mobileOpen = value;
    this._recordHistory("mobileOpen", old, value);
    this._notify("mobileOpen", { old, new: value });
    return { success: true, changed: true };
  }
  toggleMobile() {
    return this.setMobileOpen(!this._mobileOpen);
  }
  openMobile() {
    return this.setMobileOpen(true);
  }
  closeMobile() {
    return this.setMobileOpen(false);
  }
  get activeItemId() {
    return this._activeItemId;
  }
  setActiveItem(itemId) {
    if (this._activeItemId === itemId) return { success: true, changed: false };
    const old = this._activeItemId;
    this._activeItemId = itemId;
    this._recordHistory("activeItemId", old, itemId);
    this._notify("activeItemId", { old, new: itemId });
    return { success: true, changed: true };
  }
  get hoveredItemId() {
    return this._hoveredItemId;
  }
  setHoveredItem(itemId) {
    if (this._hoveredItemId === itemId) return { success: true, changed: false };
    const old = this._hoveredItemId;
    this._hoveredItemId = itemId;
    this._notify("hoveredItemId", { old, new: itemId });
    return { success: true, changed: true };
  }
  subscribe(callback) {
    if (typeof callback !== "function") return () => {
    };
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  _notify(key, value) {
    this._metrics.notifications++;
    const state = this.getState();
    this._subscribers.forEach((fn) => {
      try {
        fn(key, value, state);
      } catch {
      }
    });
  }
  _recordHistory(key, oldValue, newValue) {
    this._history.push({ timestamp: Date.now(), key, old: oldValue, new: newValue });
    if (this._history.length > this._maxHistory) this._history.shift();
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
    this._metrics.resets++;
    this._lifecycle = LIFECYCLE_STATES.IDLE;
    this._collapsed = false;
    this._mobileOpen = false;
    this._isMobile = false;
    this._activeItemId = null;
    this._hoveredItemId = null;
    this._expandedSections.clear();
    this._history = [];
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
    const checks = {
      lifecycleValid: Object.values(LIFECYCLE_STATES).includes(this._lifecycle),
      notInError: this._lifecycle !== LIFECYCLE_STATES.ERROR,
      subscribersOk: this._subscribers.size < 100,
      historyOk: this._history.length <= this._maxHistory,
      accordionStateValid: this._expandedSections instanceof Set
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      lifecycle: this._lifecycle,
      subscribersCount: this._subscribers.size,
      historyCount: this._history.length,
      expandedSectionsCount: this._expandedSections.size,
      accordionConfig: this._accordionConfig,
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
function createStateMachine(options) {
  return new SidebarStateMachine(options);
}
var state_machine_default = SidebarStateMachine;
export {
  COLLAPSE_STATES,
  LIFECYCLE_STATES,
  MODULE_ID,
  SIDEBAR_EVENTS,
  SidebarStateMachine,
  VERSION,
  createStateMachine,
  state_machine_default as default
};
