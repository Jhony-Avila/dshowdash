// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Panel Bookmarks Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   getInstance() — exported function
//   setInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   updateConfig() — exported function
//   _bookmarks — exported value
//   getBookmarks() — exported function
//   setBookmarks() — exported function
//   _recentPanels — exported value
//   getRecentPanels() — exported function
//   setRecentPanels() — exported function
//   _panelFrequency — exported value
//   getPanelFrequency() — exported function
//   setPanelFrequency() — exported function
//   _listeners — exported value
//   _hotkeyHandler — exported value
//   getHotkeyHandler() — exported function
//   setHotkeyHandler() — exported function
//   ... and 3 more exports
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
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function getInstance() { return _instance; }
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }
export function updateConfig(updates: Record<string, unknown>) { _config = { ..._config, ...updates }; }

export let _bookmarks: Record<string, unknown>[] = [];
export function getBookmarks() { return _bookmarks; }
// @ts-expect-error TS migration - TS2322
export function setBookmarks(b: unknown[]) { _bookmarks = b; }

export let _recentPanels: unknown[] = [];
export function getRecentPanels() { return _recentPanels; }
export function setRecentPanels(r: unknown[]) { _recentPanels = r; }

export let _panelFrequency = {};
export function getPanelFrequency() { return _panelFrequency; }
export function setPanelFrequency(f: Record<string, number>) { _panelFrequency = f; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export let _hotkeyHandler: unknown | null = null;
export function getHotkeyHandler() { return _hotkeyHandler; }
export function setHotkeyHandler(h: unknown | null) { _hotkeyHandler = h; }

export const _metrics = {
  bookmarksAdded: 0,
  bookmarksRemoved: 0,
  bookmarksAccessed: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }
