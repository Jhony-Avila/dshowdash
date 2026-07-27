// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Command Palette - State Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG, PALETTE_MODES from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   setInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   _isOpen — exported value
//   _isInitialized — exported value
//   setIsOpen() — exported function
//   setIsInitialized() — exported function
//   _commands — exported value
//   _recentCommands — exported value
//   getRecentCommands() — exported function
//   setRecentCommands() — exported function
//   _currentMode — exported value
//   getCurrentMode() — exported function
//   setCurrentMode() — exported function
//   _selectedIndex — exported value
//   getSelectedIndex() — exported function
//   setSelectedIndex() — exported function
//   _filteredResults — exported value
//   ... and 18 more exports
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

import { DEFAULT_CONFIG, PALETTE_MODES } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.state';

// Singleton instance
export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

// Configuration
export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
export function setConfig(cfg: Record<string, unknown>) { _config = { ...DEFAULT_CONFIG, ...cfg }; }

// State flags
export let _isOpen = false;
export let _isInitialized = false;
export function setIsOpen(val: boolean) { _isOpen = val; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

// Commands storage
export const _commands = new Map();

// Recent commands
export let _recentCommands: unknown[] = [];
export function getRecentCommands() { return _recentCommands; }
export function setRecentCommands(arr: unknown[]) { _recentCommands = arr; }

// Current mode
export let _currentMode = PALETTE_MODES.COMMANDS;
export function getCurrentMode() { return _currentMode; }
// @ts-expect-error TS migration - TS2322
export function setCurrentMode(mode: string) { _currentMode = mode; }

// Selection
export let _selectedIndex = 0;
export function getSelectedIndex() { return _selectedIndex; }
export function setSelectedIndex(idx: number) { _selectedIndex = idx; }

// Filtered results
export let _filteredResults: unknown[] = [];
export function getFilteredResults() { return _filteredResults; }
export function setFilteredResults(arr: unknown[]) { _filteredResults = arr; }

// DOM references
export let _paletteElement: HTMLElement | null = null;
export let _inputElement: HTMLElement | null = null;
export let _resultsElement: HTMLElement | null = null;
export function setPaletteElement(el: HTMLElement) { _paletteElement = el; }
export function setInputElement(el: HTMLElement) { _inputElement = el; }
export function setResultsElement(el: HTMLElement) { _resultsElement = el; }
export function getPaletteElement() { return _paletteElement; }
export function getInputElement() { return _inputElement; }
export function getResultsElement() { return _resultsElement; }

// Listeners
export const _listeners: Array<(...args: unknown[]) => void> = [];

// Debounce timer
export let _debounceTimer: unknown | null = null;
export function getDebounceTimer() { return _debounceTimer; }
export function setDebounceTimer(timer: unknown | null) { _debounceTimer = timer; }

// Metrics
export const _metrics = {
  opens: 0,
  commandsExecuted: 0,
  searches: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() {
  return { ..._metrics };
}
