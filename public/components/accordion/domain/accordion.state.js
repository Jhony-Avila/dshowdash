import {
  ACCORDION_MODE,
  LOADING_STATE,
  createAccordionState,
  serializeState,
  deserializeState
} from "./accordion.contracts.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.domain.state";
class AccordionStateManager {
  _state;
  _subscribers;
  _history;
  _maxHistory;
  _metrics;
  _initialized;
  _structureRef;
  constructor(options = {}) {
    this._state = createAccordionState({
      mode: options.mode ?? ACCORDION_MODE.MULTI,
      openSections: options.openSections ?? [],
      activeItemId: options.activeItemId ?? null,
      loadingState: LOADING_STATE.IDLE
    });
    this._subscribers = /* @__PURE__ */ new Set();
    this._history = [];
    this._maxHistory = options.maxHistory ?? 50;
    this._metrics = {
      stateChanges: 0,
      toggles: 0,
      expands: 0,
      collapses: 0,
      itemSelections: 0,
      restores: 0,
      errors: 0
    };
    this._initialized = false;
    this._structureRef = null;
  }
  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  init(structure = null) {
    if (this._initialized) {
      return { success: true, message: "Already initialized" };
    }
    this._structureRef = structure;
    if (structure?.sections) {
      const defaultOpen = structure.sections.filter((s) => s.defaultOpen === true).map((s) => s.id);
      if (defaultOpen.length > 0) {
        this._updateState({ openSections: defaultOpen });
      }
    }
    this._updateState({ loadingState: LOADING_STATE.READY });
    this._initialized = true;
    return { success: true, state: this.getState() };
  }
  // ─────────────────────────────────────────────────────────────
  // CORE STATE OPERATIONS
  // ─────────────────────────────────────────────────────────────
  _updateState(changes) {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...changes, lastInteractionAt: Date.now() };
    this._metrics.stateChanges++;
    if (this._history.length >= this._maxHistory) {
      this._history.shift();
    }
    this._history.push({ prev: prevState, next: this._state, timestamp: Date.now() });
    this._notify(prevState, this._state);
    return { success: true, prevState, nextState: this._state };
  }
  _notify(prevState, nextState) {
    const payload = { prevState, nextState, timestamp: Date.now() };
    this._subscribers.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        this._metrics.errors++;
      }
    });
  }
  // ─────────────────────────────────────────────────────────────
  // SECTION OPERATIONS
  // ─────────────────────────────────────────────────────────────
  toggleSection(sectionId) {
    this._metrics.toggles++;
    const isOpen = this._state.openSections.includes(sectionId);
    if (isOpen) {
      return this.collapseSection(sectionId);
    }
    return this.expandSection(sectionId);
  }
  expandSection(sectionId) {
    if (this._state.openSections.includes(sectionId)) {
      return { success: true, changed: false, reason: "already_open" };
    }
    this._metrics.expands++;
    let newOpenSections;
    if (this._state.mode === ACCORDION_MODE.SINGLE) {
      newOpenSections = [sectionId];
    } else {
      newOpenSections = [...this._state.openSections, sectionId];
    }
    this._updateState({ openSections: newOpenSections });
    return { success: true, changed: true, sectionId, expanded: true };
  }
  collapseSection(sectionId) {
    if (!this._state.openSections.includes(sectionId)) {
      return { success: true, changed: false, reason: "already_closed" };
    }
    if (this._structureRef) {
      const section = this._structureRef.sections?.find((s) => s.id === sectionId);
      if (section?.collapsible === false) {
        return { success: false, changed: false, reason: "not_collapsible" };
      }
    }
    this._metrics.collapses++;
    const newOpenSections = this._state.openSections.filter((id) => id !== sectionId);
    this._updateState({ openSections: newOpenSections });
    return { success: true, changed: true, sectionId, expanded: false };
  }
  expandAllSections(sectionIds = null) {
    const ids = sectionIds ?? this._structureRef?.sections?.map((s) => s.id) ?? [];
    if (ids.length === 0) {
      return { success: false, reason: "no_sections" };
    }
    this._updateState({ openSections: [...ids] });
    return { success: true, expanded: ids };
  }
  collapseAllSections() {
    const collapsible = this._structureRef?.sections?.filter((s) => s.collapsible !== false).map((s) => s.id) ?? [];
    const nonCollapsible = this._state.openSections.filter((id) => !collapsible.includes(id));
    this._updateState({ openSections: nonCollapsible });
    return { success: true, remaining: nonCollapsible };
  }
  isSectionOpen(sectionId) {
    return this._state.openSections.includes(sectionId);
  }
  getOpenSections() {
    return [...this._state.openSections];
  }
  // ─────────────────────────────────────────────────────────────
  // ITEM OPERATIONS
  // ─────────────────────────────────────────────────────────────
  setActiveItem(itemId) {
    if (this._state.activeItemId === itemId) {
      return { success: true, changed: false, reason: "already_active" };
    }
    this._metrics.itemSelections++;
    const prevItemId = this._state.activeItemId;
    this._updateState({ activeItemId: itemId });
    if (this._structureRef && itemId) {
      const section = this._findSectionByItemId(itemId);
      if (section && !this._state.openSections.includes(section.id)) {
        this.expandSection(section.id);
      }
    }
    return { success: true, changed: true, prevItemId, itemId };
  }
  clearActiveItem() {
    return this.setActiveItem(null);
  }
  getActiveItemId() {
    return this._state.activeItemId;
  }
  _findSectionByItemId(itemId) {
    if (!this._structureRef?.sections) return null;
    for (const section of this._structureRef.sections) {
      const item = section.items?.find((i) => i.id === itemId);
      if (item) return section;
    }
    return null;
  }
  // ─────────────────────────────────────────────────────────────
  // MODE OPERATIONS
  // ─────────────────────────────────────────────────────────────
  setMode(mode) {
    if (!Object.values(ACCORDION_MODE).includes(mode)) {
      return { success: false, error: `Invalid mode: ${mode}` };
    }
    if (this._state.mode === mode) {
      return { success: true, changed: false };
    }
    const changes = { mode };
    if (mode === ACCORDION_MODE.SINGLE && this._state.openSections.length > 1) {
      changes.openSections = [this._state.openSections[0]];
    }
    this._updateState(changes);
    return { success: true, changed: true, mode };
  }
  getMode() {
    return this._state.mode;
  }
  // ─────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────
  setLoadingState(loadingState) {
    if (!Object.values(LOADING_STATE).includes(loadingState)) {
      return { success: false, error: `Invalid loading state: ${loadingState}` };
    }
    this._updateState({ loadingState });
    return { success: true, loadingState };
  }
  setError(error) {
    this._updateState({ loadingState: LOADING_STATE.ERROR, errorState: error });
    return { success: true };
  }
  clearError() {
    this._updateState({ loadingState: LOADING_STATE.READY, errorState: null });
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // PINNED ITEMS
  // ─────────────────────────────────────────────────────────────
  pinItem(itemId) {
    if (this._state.pinnedItems.includes(itemId)) {
      return { success: true, changed: false };
    }
    const newPinned = [...this._state.pinnedItems, itemId];
    this._updateState({ pinnedItems: newPinned });
    return { success: true, changed: true, itemId };
  }
  unpinItem(itemId) {
    if (!this._state.pinnedItems.includes(itemId)) {
      return { success: true, changed: false };
    }
    const newPinned = this._state.pinnedItems.filter((id) => id !== itemId);
    this._updateState({ pinnedItems: newPinned });
    return { success: true, changed: true, itemId };
  }
  getPinnedItems() {
    return [...this._state.pinnedItems];
  }
  // ─────────────────────────────────────────────────────────────
  // STATE ACCESS
  // ─────────────────────────────────────────────────────────────
  getState() {
    return { ...this._state };
  }
  getSnapshot() {
    return {
      state: this.getState(),
      metrics: this.getMetrics(),
      initialized: this._initialized,
      timestamp: Date.now()
    };
  }
  // ─────────────────────────────────────────────────────────────
  // PERSISTENCE (Serialization)
  // ─────────────────────────────────────────────────────────────
  serialize() {
    return serializeState(this._state);
  }
  restore(serialized) {
    this._metrics.restores++;
    const result = deserializeState(serialized);
    if (!result.success) {
      this._metrics.errors++;
      return result;
    }
    this._updateState({
      // @ts-expect-error strict migration — TS18047
      mode: result.data.mode,
      // @ts-expect-error strict migration — TS18047
      openSections: result.data.openSections,
      // @ts-expect-error strict migration — TS18047
      activeItemId: result.data.activeItemId,
      // @ts-expect-error strict migration — TS18047
      pinnedItems: result.data.pinnedItems,
      loadingState: LOADING_STATE.READY
    });
    return { success: true, state: this.getState() };
  }
  // ─────────────────────────────────────────────────────────────
  // SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────
  subscribe(callback) {
    if (typeof callback !== "function") {
      return () => {
      };
    }
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  unsubscribe(callback) {
    this._subscribers.delete(callback);
  }
  // ─────────────────────────────────────────────────────────────
  // HISTORY
  // ─────────────────────────────────────────────────────────────
  getHistory() {
    return [...this._history];
  }
  undo() {
    if (this._history.length < 2) {
      return { success: false, reason: "no_history" };
    }
    this._history.pop();
    const lastEntry = this._history[this._history.length - 1];
    if (!lastEntry) {
      return { success: false, reason: "no_history" };
    }
    this._state = { ...lastEntry.next };
    this._notify(lastEntry.prev, lastEntry.next);
    return { success: true, state: this.getState() };
  }
  // ─────────────────────────────────────────────────────────────
  // RESET & DESTROY
  // ─────────────────────────────────────────────────────────────
  reset() {
    this._state = createAccordionState();
    this._history = [];
    this._notify(null, this._state);
    return { success: true };
  }
  destroy() {
    this._subscribers.clear();
    this._history = [];
    this._structureRef = null;
    this._initialized = false;
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // HEALTH & METRICS
  // ─────────────────────────────────────────────────────────────
  getMetrics() {
    return {
      ...this._metrics,
      subscriberCount: this._subscribers.size,
      historyLength: this._history.length,
      openSectionsCount: this._state.openSections.length,
      pinnedItemsCount: this._state.pinnedItems.length
    };
  }
  healthCheck() {
    const checks = {
      initialized: this._initialized,
      stateValid: this._state !== null,
      modeValid: Object.values(ACCORDION_MODE).includes(this._state.mode),
      loadingStateValid: Object.values(LOADING_STATE).includes(this._state.loadingState),
      noErrors: this._metrics.errors === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      state: {
        mode: this._state.mode,
        loadingState: this._state.loadingState,
        openSectionsCount: this._state.openSections.length,
        activeItemId: this._state.activeItemId
      },
      metrics: this.getMetrics(),
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      state: this.getState(),
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck()
    };
  }
}
function createAccordionStateManager(options = {}) {
  return new AccordionStateManager(options);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true
  };
}
function healthCheck() {
  const checks = {
    classAvailable: typeof AccordionStateManager === "function",
    factoryAvailable: typeof createAccordionStateManager === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
var accordion_state_default = {
  VERSION,
  MODULE_ID,
  AccordionStateManager,
  createAccordionStateManager,
  info,
  healthCheck
};
export {
  AccordionStateManager,
  MODULE_ID,
  VERSION,
  createAccordionStateManager,
  accordion_state_default as default,
  healthCheck,
  info
};
