// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Accessibility Manager - State
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
//   updateConfig() — exported function
//   _isInitialized — exported value
//   isInitialized() — exported function
//   setIsInitialized() — exported function
//   _liveRegion — exported value
//   getLiveRegion() — exported function
//   setLiveRegion() — exported function
//   _skipLinksContainer — exported value
//   getSkipLinksContainer() — exported function
//   setSkipLinksContainer() — exported function
//   _listeners — exported value
//   _mediaQueries — exported value
//   getMediaQueries() — exported function
//   _userPreferences — exported value
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
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown>) { _instance = inst; }
export function getInstance() { return _instance; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
export function setConfig(cfg: Record<string, unknown>) { _config = cfg as typeof _config; }
export function updateConfig(updates: Record<string, unknown>) { _config = { ..._config, ...updates } as typeof _config; }

export let _isInitialized = false;
export function isInitialized() { return _isInitialized; }
export function setIsInitialized(val: boolean) { _isInitialized = val; }

export let _liveRegion: HTMLElement | null = null;
export function getLiveRegion() { return _liveRegion; }
export function setLiveRegion(el: HTMLElement | null) { _liveRegion = el; }

export let _skipLinksContainer: HTMLElement | null = null;
export function getSkipLinksContainer() { return _skipLinksContainer; }
export function setSkipLinksContainer(el: HTMLElement | null) { _skipLinksContainer = el; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export const _mediaQueries: Record<string, unknown> = {};
export function getMediaQueries() { return _mediaQueries; }

export let _userPreferences: Record<string, unknown> = {};
export function getUserPreferences() { return _userPreferences; }
export function setUserPreferences(prefs: Record<string, unknown>) { _userPreferences = prefs; }
export function updateUserPreferences(updates: Record<string, unknown>) { _userPreferences = { ..._userPreferences, ...updates }; }

export const _metrics = {
  announcements: 0,
  focusChanges: 0,
  preferencesChanged: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  if (Object.prototype.hasOwnProperty.call(_metrics, key)) (_metrics as Record<string, number>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }
