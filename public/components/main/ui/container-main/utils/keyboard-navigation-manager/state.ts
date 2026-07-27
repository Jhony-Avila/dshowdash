// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Keyboard Navigation Manager - State
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
//   _isInitialized — exported value
//   isInitialized() — exported function
//   setIsInitialized() — exported function
//   _navigationGroups — exported value
//   getNavigationGroups() — exported function
//   _activeGroup — exported value
//   getActiveGroup() — exported function
//   setActiveGroup() — exported function
//   _typeaheadBuffer — exported value
//   getTypeaheadBuffer() — exported function
//   setTypeaheadBuffer() — exported function
//   appendTypeaheadBuffer() — exported function
//   _typeaheadTimer — exported value
//   getTypeaheadTimer() — exported function
//   setTypeaheadTimer() — exported function
//   ... and 6 more exports
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
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }

export let _isInitialized = false;
export function isInitialized() { return _isInitialized; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

export const _navigationGroups = new Map();
export function getNavigationGroups() { return _navigationGroups; }

export let _activeGroup: unknown | null = null;
export function getActiveGroup() { return _activeGroup; }
export function setActiveGroup(g: unknown | null) { _activeGroup = g; }

export let _typeaheadBuffer = '';
export function getTypeaheadBuffer() { return _typeaheadBuffer; }
export function setTypeaheadBuffer(b: unknown) { _typeaheadBuffer = (b) as string; }
export function appendTypeaheadBuffer(char: string) { _typeaheadBuffer += char; }

export let _typeaheadTimer: unknown | null = null;
export function getTypeaheadTimer() { return _typeaheadTimer; }
export function setTypeaheadTimer(t: unknown | null) { _typeaheadTimer = t; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export const _globalShortcuts = new Map();
export function getGlobalShortcuts() { return _globalShortcuts; }

export const _metrics = {
  keyPresses: 0,
  navigationEvents: 0,
  typeaheadMatches: 0,
  shortcutsTriggered: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }
