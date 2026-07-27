// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Panel Search Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   setInstance() — exported function
//   getInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   _isOpen — exported value
//   isOpen() — exported function
//   setIsOpen() — exported function
//   _isInitialized — exported value
//   isInitialized() — exported function
//   setIsInitialized() — exported function
//   _searchContainer — exported value
//   getSearchContainer() — exported function
//   setSearchContainer() — exported function
//   _currentQuery — exported value
//   getCurrentQuery() — exported function
//   setCurrentQuery() — exported function
//   _matches — exported value
//   getMatches() — exported function
//   ... and 13 more exports
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
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }
export function getInstance() { return _instance; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }

export let _isOpen = false;
export function isOpen() { return _isOpen; }
export function setIsOpen(val: boolean) { _isOpen = val; }

export let _isInitialized = false;
export function isInitialized() { return _isInitialized; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

export let _searchContainer: HTMLElement | null = null;
export function getSearchContainer() { return _searchContainer; }
export function setSearchContainer(el: HTMLElement) { _searchContainer = el; }

export let _currentQuery = '';
export function getCurrentQuery() { return _currentQuery; }
export function setCurrentQuery(q: unknown) { _currentQuery = (q) as string; }

export let _matches: Record<string, unknown>[] = [];
export function getMatches() { return _matches; }
// @ts-expect-error TS migration - TS2322
export function setMatches(m: unknown[]) { _matches = m; }

export let _currentMatchIndex = -1;
export function getCurrentMatchIndex() { return _currentMatchIndex; }
export function setCurrentMatchIndex(idx: number) { _currentMatchIndex = idx; }

export let _highlightedElements: unknown[] = [];
export function getHighlightedElements() { return _highlightedElements; }
export function setHighlightedElements(els: unknown[]) { _highlightedElements = els; }

export const _originalContents = new Map();
export function getOriginalContents() { return _originalContents; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export const _metrics = {
  searches: 0,
  matchesFound: 0,
  navigations: 0,
  errors: 0
};

export function incrementMetric(key: string, amount = 1) {
  // @ts-expect-error TS migration - TS2365
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key] += amount;
}

export function getMetrics() { return { ..._metrics }; }
