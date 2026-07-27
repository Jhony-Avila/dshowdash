// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.domain.state
// PURPOSE: State management for accordion component
// ───────────────────────────────────────────────────────────────
// @contract AccordionStateManager - State machine class
// @contract INIT - init(structure) initializes state with structure
// @contract TOGGLE_SECTION - toggleSection(sectionId) toggles section
// @contract EXPAND_SECTION - expandSection(sectionId) expands section
// @contract COLLAPSE_SECTION - collapseSection(sectionId) collapses section
// @contract EXPAND_ALL - expandAllSections(sectionIds?) expands all/specified
// @contract COLLAPSE_ALL - collapseAllSections() collapses all collapsible
// @contract IS_SECTION_OPEN - isSectionOpen(sectionId) checks if open
// @contract GET_OPEN_SECTIONS - getOpenSections() returns open section ids
// @contract SET_ACTIVE_ITEM - setActiveItem(itemId) sets active item
// @contract CLEAR_ACTIVE_ITEM - clearActiveItem() clears active item
// @contract GET_ACTIVE_ITEM - getActiveItemId() returns active item id
// @contract SET_MODE - setMode(mode) sets accordion mode
// @contract GET_MODE - getMode() returns current mode
// @contract SET_LOADING_STATE - setLoadingState(state) sets loading state
// @contract SET_ERROR - setError(error) sets error state
// @contract CLEAR_ERROR - clearError() clears error state
// @contract PIN_ITEM - pinItem(itemId) pins an item
// @contract UNPIN_ITEM - unpinItem(itemId) unpins an item
// @contract GET_PINNED_ITEMS - getPinnedItems() returns pinned item ids
// @contract GET_STATE - getState() returns current state snapshot
// @contract GET_SNAPSHOT - getSnapshot() returns full snapshot with metrics
// @contract SERIALIZE - serialize() serializes state to JSON
// @contract RESTORE - restore(serialized) restores state from JSON
// @contract SUBSCRIBE - subscribe(callback) subscribes to state changes
// @contract UNSUBSCRIBE - unsubscribe(callback) unsubscribes from changes
// @contract GET_HISTORY - getHistory() returns state change history
// @contract UNDO - undo() reverts to previous state
// @contract RESET - reset() resets to initial state
// @contract DESTROY - destroy() cleans up resources
// @contract GET_METRICS - getMetrics() returns state metrics
// @contract HEALTH_CHECK - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract FACTORY - createAccordionStateManager(options) factory function
// @contract MODULE_HEALTH - healthCheck() module-level health check
// @contract MODULE_INFO - info() module-level information
// ───────────────────────────────────────────────────────────────
// IMPORTS: ./accordion.contracts.js
// PROVIDES: AccordionStateManager, createAccordionStateManager,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise state management
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  ACCORDION_MODE,
  LOADING_STATE,
  createAccordionState,
  serializeState,
  deserializeState
} from './accordion.contracts.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.domain.state';

// ═══════════════════════════════════════════════════════════════
// STATE MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

export class AccordionStateManager {
  _state: Record<string, any>;
  _subscribers: Set<Function>;
  _history: Array<{ prev: Record<string, unknown>; next: Record<string, unknown>; timestamp: number }>;
  _maxHistory: number;
  _metrics: { stateChanges: number; toggles: number; expands: number; collapses: number; itemSelections: number; restores: number; errors: number };
  _initialized: boolean;
  _structureRef: Record<string, any> | null;

  constructor(options: { mode?: string; openSections?: string[]; activeItemId?: string | null; maxHistory?: number } = {}) {
    this._state = createAccordionState({
      mode: options.mode ?? ACCORDION_MODE.MULTI,
      openSections: options.openSections ?? [],
      activeItemId: options.activeItemId ?? null,
      loadingState: LOADING_STATE.IDLE
    });
    this._subscribers = new Set();
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

  init(structure: Record<string, unknown> | null = null) {
    if (this._initialized) {
      return { success: true, message: 'Already initialized' };
    }
    this._structureRef = structure;
    if (structure?.sections) {
      const defaultOpen = (structure.sections as any[])
        .filter(s => s.defaultOpen === true)
        .map(s => s.id);
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

  _updateState(changes: Record<string, unknown>) {
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

  _notify(prevState: Record<string, unknown> | null, nextState: Record<string, unknown>) {
    const payload = { prevState, nextState, timestamp: Date.now() };
    this._subscribers.forEach(fn => {
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

  toggleSection(sectionId: string) {
    this._metrics.toggles++;
    const isOpen = this._state.openSections.includes(sectionId);
    if (isOpen) {
      return this.collapseSection(sectionId);
    }
    return this.expandSection(sectionId);
  }

  expandSection(sectionId: string) {
    if (this._state.openSections.includes(sectionId)) {
      return { success: true, changed: false, reason: 'already_open' };
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

  collapseSection(sectionId: string) {
    if (!this._state.openSections.includes(sectionId)) {
      return { success: true, changed: false, reason: 'already_closed' };
    }
    if (this._structureRef) {
      const section = this._structureRef.sections?.find((s: Record<string, any>) => s.id === sectionId);
      if (section?.collapsible === false) {
        return { success: false, changed: false, reason: 'not_collapsible' };
      }
    }
    this._metrics.collapses++;
    const newOpenSections = this._state.openSections.filter((id: string) => id !== sectionId);
    this._updateState({ openSections: newOpenSections });
    return { success: true, changed: true, sectionId, expanded: false };
  }

  expandAllSections(sectionIds: string[] | null = null) {
    const ids = sectionIds ?? this._structureRef?.sections?.map((s: Record<string, any>) => s.id) ?? [];
    if (ids.length === 0) {
      return { success: false, reason: 'no_sections' };
    }
    this._updateState({ openSections: [...ids] });
    return { success: true, expanded: ids };
  }

  collapseAllSections() {
    const collapsible = this._structureRef?.sections
      ?.filter((s: Record<string, any>) => s.collapsible !== false)
      .map((s: Record<string, any>) => s.id) ?? [];
    const nonCollapsible = this._state.openSections.filter((id: string) => !collapsible.includes(id));
    this._updateState({ openSections: nonCollapsible });
    return { success: true, remaining: nonCollapsible };
  }

  isSectionOpen(sectionId: string) {
    return this._state.openSections.includes(sectionId);
  }

  getOpenSections() {
    return [...this._state.openSections];
  }

  // ─────────────────────────────────────────────────────────────
  // ITEM OPERATIONS
  // ─────────────────────────────────────────────────────────────

  setActiveItem(itemId: string | null) {
    if (this._state.activeItemId === itemId) {
      return { success: true, changed: false, reason: 'already_active' };
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

  _findSectionByItemId(itemId: string) {
    if (!this._structureRef?.sections) return null;
    for (const section of this._structureRef.sections) {
      const item = section.items?.find((i: Record<string, any>) => i.id === itemId);
      if (item) return section;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // MODE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  setMode(mode: string) {
    if (!Object.values(ACCORDION_MODE).includes(mode as "single" | "multi")) {
      return { success: false, error: `Invalid mode: ${mode}` };
    }
    if (this._state.mode === mode) {
      return { success: true, changed: false };
    }
    const changes: Record<string, unknown> = { mode };
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

  setLoadingState(loadingState: string) {
    if (!Object.values(LOADING_STATE).includes(loadingState as "error" | "idle" | "loading" | "ready" | "restoring")) {
      return { success: false, error: `Invalid loading state: ${loadingState}` };
    }
    this._updateState({ loadingState });
    return { success: true, loadingState };
  }

  setError(error: any) {
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

  pinItem(itemId: string) {
    if (this._state.pinnedItems.includes(itemId)) {
      return { success: true, changed: false };
    }
    const newPinned = [...this._state.pinnedItems, itemId];
    this._updateState({ pinnedItems: newPinned });
    return { success: true, changed: true, itemId };
  }

  unpinItem(itemId: string) {
    if (!this._state.pinnedItems.includes(itemId)) {
      return { success: true, changed: false };
    }
    const newPinned = this._state.pinnedItems.filter((id: string) => id !== itemId);
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

  restore(serialized: string) {
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

  subscribe(callback: Function) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  unsubscribe(callback: Function) {
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
      return { success: false, reason: 'no_history' };
    }
    this._history.pop();
    const lastEntry = this._history[this._history.length - 1];
    if (!lastEntry) {
      return { success: false, reason: 'no_history' };
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
      status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
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

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

export function createAccordionStateManager(options: { mode?: string; openSections?: string[]; activeItemId?: string | null; maxHistory?: number } = {}) {
  return new AccordionStateManager(options);
}

// ═══════════════════════════════════════════════════════════════
// MODULE LEVEL HEALTH & INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true
  };
}

export function healthCheck() {
  const checks = {
    classAvailable: typeof AccordionStateManager === 'function',
    factoryAvailable: typeof createAccordionStateManager === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  AccordionStateManager,
  createAccordionStateManager,
  info,
  healthCheck
};
