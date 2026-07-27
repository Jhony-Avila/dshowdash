// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Panel Tabs Manager - State Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   setInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   _tabs — exported value
//   getTabs() — exported function
//   setTabs() — exported function
//   _activeTabId — exported value
//   getActiveTabId() — exported function
//   setActiveTabId() — exported function
//   _tabsContainer — exported value
//   _contentContainer — exported value
//   getTabsContainer() — exported function
//   setTabsContainer() — exported function
//   getContentContainer() — exported function
//   setContentContainer() — exported function
//   _isInitialized — exported value
//   isInitialized() — exported function
//   setIsInitialized() — exported function
//   ... and 7 more exports
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

import { DEFAULT_CONFIG } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.state';

// Singleton instance
export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

// Configuration
export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
export function setConfig(cfg: Record<string, unknown>) { _config = { ...DEFAULT_CONFIG, ...cfg }; }

// Tabs storage
export let _tabs: Record<string, unknown>[] = [];
export function getTabs() { return _tabs; }
export function setTabs(tabs: Record<string, unknown>[]) { _tabs = tabs; }

// Active tab
export let _activeTabId: string | null = null;
export function getActiveTabId() { return _activeTabId; }
export function setActiveTabId(id: string) { _activeTabId = id; }

// DOM references
export let _tabsContainer: HTMLElement | null = null;
export let _contentContainer: HTMLElement | null = null;
export function getTabsContainer() { return _tabsContainer; }
export function setTabsContainer(el: HTMLElement) { _tabsContainer = el; }
export function getContentContainer() { return _contentContainer; }
export function setContentContainer(el: HTMLElement) { _contentContainer = el; }

// Initialization flag
export let _isInitialized = false;
export function isInitialized() { return _isInitialized; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

// Listeners
export const _listeners: Array<(...args: unknown[]) => void> = [];

// Drag state
export let _dragState: Record<string, unknown> | null = null;
export function getDragState() { return _dragState; }
export function setDragState(state: Record<string, unknown>) { _dragState = state; }

// Metrics
export const _metrics = {
  tabsOpened: 0,
  tabsClosed: 0,
  tabsSwitched: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() {
  return { ..._metrics };
}
