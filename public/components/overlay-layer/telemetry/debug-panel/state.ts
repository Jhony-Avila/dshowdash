// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Debug Panel - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   getConfig() — exported function
//   setConfig() — exported function
//   resetConfig() — exported function
//   getPanelElement() — exported function
//   setPanelElement() — exported function
//   getRefreshIntervalId() — exported function
//   setRefreshIntervalId() — exported function
//   clearRefreshInterval() — exported function
//   isVisible() — exported function
//   setVisible() — exported function
//   getEventLog() — exported function
//   addEvent() — exported function
//   clearEventLog() — exported function
//   getOverlayLayer() — exported function
//   setOverlayLayer() — exported function
//   resetState() — exported function
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
export const MODULE_ID = 'overlay-layer.telemetry.debug-panel.state';

// ============================================================================
// STATE STORE
// ============================================================================

const state = {
  config: Object.assign({}, DEFAULT_CONFIG),
  panelElement: null as DynObj,
  refreshIntervalId: null as DynObj,
  eventLog: [] as DynObj,
  isVisible: false,
  overlayLayer: null as DynObj
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

export function resetConfig() {
  state.config = Object.assign({}, DEFAULT_CONFIG);
}

// ============================================================================
// PANEL ACCESSORS
// ============================================================================

export function getPanelElement() {
  return state.panelElement;
}

export function setPanelElement(el: HTMLElement) {
  state.panelElement = el;
}

export function getRefreshIntervalId() {
  return state.refreshIntervalId;
}

export function setRefreshIntervalId(id: DynObj) {
  state.refreshIntervalId = id;
}

export function clearRefreshInterval() {
  if (state.refreshIntervalId) {
    clearInterval(state.refreshIntervalId);
    state.refreshIntervalId = null;
  }
}

// ============================================================================
// VISIBILITY ACCESSORS
// ============================================================================

export function isVisible() {
  return state.isVisible;
}

export function setVisible(val: DynObj) {
  state.isVisible = !!val;
}

// ============================================================================
// EVENT LOG ACCESSORS
// ============================================================================

export function getEventLog() {
  return state.eventLog;
}

export function addEvent(event: DynObj) {
  state.eventLog.push(event);
  
  // Limitar tamanho
  const maxEvents = state.config.maxEvents;
  while (state.eventLog.length > maxEvents) {
    state.eventLog.shift();
  }
}

export function clearEventLog() {
  state.eventLog = [];
}

// ============================================================================
// OVERLAY LAYER REFERENCE
// ============================================================================

export function getOverlayLayer() {
  return state.overlayLayer;
}

export function setOverlayLayer(ref: DynObj) {
  state.overlayLayer = ref;
}

// ============================================================================
// RESET
// ============================================================================

export function resetState() {
  clearRefreshInterval();
  state.panelElement = null;
  state.eventLog = [];
  state.isVisible = false;
}

export default state;
