// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-state
// PURPOSE: Panel Session Admin - Local State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_HIDDEN_COLS, AUTO_REFRESH_SECONDS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   localState — exported value
//   resetLocalState() — exported function
//   getContainer() — exported function
//   setContainer() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   isInitialized() — exported function
//   setInitialized() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEFAULT_HIDDEN_COLS, AUTO_REFRESH_SECONDS } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-session-admin-core-state';

// Shared local state
export const localState: {
  container: HTMLElement | null;
  initialized: boolean;
  config: Record<string, unknown>;
  autoRefreshInterval: ReturnType<typeof setInterval> | null;
  autoRefreshEnabled: boolean;
  countdown: number;
  isFullscreen: boolean;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  hiddenCols: Set<string>;
  showInlineFilters: boolean;
  inlineFilters: Record<string, string>;
  detailsSession: Record<string, unknown> | null;
} = {
  container: null,
  initialized: false,
  config: {},
  autoRefreshInterval: null,
  autoRefreshEnabled: false,
  countdown: AUTO_REFRESH_SECONDS,
  isFullscreen: false,
  selectedIds: new Set(),
  expandedIds: new Set(),
  hiddenCols: new Set(DEFAULT_HIDDEN_COLS),
  showInlineFilters: false,
  inlineFilters: {},
  detailsSession: null
};

export function resetLocalState() {
  localState.container = null;
  localState.initialized = false;
  localState.config = {};
  localState.autoRefreshInterval = null;
  localState.autoRefreshEnabled = false;
  localState.countdown = AUTO_REFRESH_SECONDS;
  localState.isFullscreen = false;
  localState.selectedIds.clear();
  localState.expandedIds.clear();
  localState.hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
  localState.showInlineFilters = false;
  localState.inlineFilters = {};
  localState.detailsSession = null;
}

export function getContainer() { return localState.container; }
export function setContainer(c: HTMLElement | null) { localState.container = c; }
export function getConfig() { return localState.config; }
export function setConfig(c: Record<string, unknown>) { localState.config = c; }
export function isInitialized() { return localState.initialized; }
export function setInitialized(v: boolean) { localState.initialized = v; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: localState.initialized, p25Compliant: true }; }

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true }, p25Compliant: true }; }

export default { localState, resetLocalState, getContainer, setContainer, getConfig, setConfig, isInitialized, setInitialized, info, healthCheck };
