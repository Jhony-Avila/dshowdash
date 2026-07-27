// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   getConfig() — exported function
//   setConfig() — exported function
//   isTrapped() — exported function
//   setTrapped() — exported function
//   getTrapElement() — exported function
//   setTrapElement() — exported function
//   getTrapHandler() — exported function
//   setTrapHandler() — exported function
//   incrementTotalTraps() — exported function
//   getTotalTraps() — exported function
//   getSavedFocus() — exported function
//   setSavedFocus() — exported function
//   incrementTotalRestores() — exported function
//   getTotalRestores() — exported function
//   getFocusHistory() — exported function
//   addToFocusHistory() — exported function
//   clearFocusHistory() — exported function
//   getMetricsData() — exported function
//   getStateSnapshot() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.focus-manager.state';

// ============================================================================
// STATE STORE
// ============================================================================

const state = {
  config: Object.assign({}, DEFAULT_CONFIG),
  trapped: false,
  trapElement: null as DynObj,
  trapHandler: null as DynObj,
  savedFocus: null as DynObj,
  focusHistory: [] as DynObj,
  totalTraps: 0,
  totalRestores: 0
};

// ============================================================================
// CONFIG ACCESSORS
// ============================================================================

export function getConfig() {
  return state.config;
}

export function setConfig(newConfig: DynObj) {
  state.config = Object.assign({}, state.config, newConfig);
}

// ============================================================================
// TRAP STATE ACCESSORS
// ============================================================================

export function isTrapped() {
  return state.trapped;
}

export function setTrapped(val: DynObj) {
  state.trapped = !!val;
}

export function getTrapElement() {
  return state.trapElement;
}

export function setTrapElement(el: HTMLElement) {
  state.trapElement = el;
}

export function getTrapHandler() {
  return state.trapHandler;
}

export function setTrapHandler(handler: DynObj) {
  state.trapHandler = handler;
}

export function incrementTotalTraps() {
  state.totalTraps++;
}

export function getTotalTraps() {
  return state.totalTraps;
}

// ============================================================================
// SAVED FOCUS ACCESSORS
// ============================================================================

export function getSavedFocus() {
  return state.savedFocus;
}

export function setSavedFocus(el: HTMLElement) {
  state.savedFocus = el;
}

export function incrementTotalRestores() {
  state.totalRestores++;
}

export function getTotalRestores() {
  return state.totalRestores;
}

// ============================================================================
// FOCUS HISTORY ACCESSORS
// ============================================================================

export function getFocusHistory() {
  return state.focusHistory;
}

export function addToFocusHistory(entry: DynObj) {
  state.focusHistory.push(entry);
  
  // Limitar histórico
  const limit = state.config.historyLimit;
  while (state.focusHistory.length > limit) {
    state.focusHistory.shift();
  }
}

export function clearFocusHistory() {
  state.focusHistory = [];
}

// ============================================================================
// METRICS
// ============================================================================

export function getMetricsData() {
  return {
    enabled: state.config.enabled,
    trapped: state.trapped,
    totalTraps: state.totalTraps,
    totalRestores: state.totalRestores,
    historyLength: state.focusHistory.length
  };
}

// ============================================================================
// STATE SNAPSHOT
// ============================================================================

export function getStateSnapshot() {
  return {
    trapped: state.trapped,
    trapElement: state.trapElement ? state.trapElement.tagName : null,
    hasSavedFocus: !!state.savedFocus,
    savedFocusElement: state.savedFocus ? state.savedFocus.tagName : null,
    historyLength: state.focusHistory.length
  };
}

export default state;
