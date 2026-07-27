// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Split View Manager - State
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
//   updateConfig() — exported function
//   _container — exported value
//   getContainer() — exported function
//   setContainer() — exported function
//   _primaryPanel — exported value
//   getPrimaryPanel() — exported function
//   setPrimaryPanel() — exported function
//   _secondaryPanel — exported value
//   getSecondaryPanel() — exported function
//   setSecondaryPanel() — exported function
//   _gutter — exported value
//   getGutter() — exported function
//   setGutter() — exported function
//   _isActive — exported value
//   isActive() — exported function
//   ... and 15 more exports
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
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }
export function updateConfig(updates: Record<string, unknown>) { _config = { ..._config, ...updates }; }

export let _container: HTMLElement | null = null;
export function getContainer() { return _container; }
// @ts-expect-error TS migration - TS2740
export function setContainer(c: unknown | null) { _container = c; }

export let _primaryPanel: unknown | null = null;
export function getPrimaryPanel() { return _primaryPanel; }
export function setPrimaryPanel(p: unknown | null) { _primaryPanel = p; }

export let _secondaryPanel: unknown | null = null;
export function getSecondaryPanel() { return _secondaryPanel; }
export function setSecondaryPanel(p: unknown | null) { _secondaryPanel = p; }

export let _gutter: unknown | null = null;
export function getGutter() { return _gutter; }
export function setGutter(g: unknown | null) { _gutter = g; }

export let _isActive = false;
export function isActive() { return _isActive; }
export function setIsActive(val: boolean) { _isActive = val; }

export let _isResizing = false;
export function isResizing() { return _isResizing; }
export function setIsResizing(val: boolean) { _isResizing = val; }

export let _collapsedPanel: unknown | null = null;
export function getCollapsedPanel() { return _collapsedPanel; }
export function setCollapsedPanel(p: unknown | null) { _collapsedPanel = p; }

export let _currentRatio = 0.5;
export function getCurrentRatio() { return _currentRatio; }
export function setCurrentRatio(r: number) { _currentRatio = r; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export const _metrics = {
  activations: 0,
  resizes: 0,
  collapses: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }

export function resetDOMRefs() {
  _primaryPanel = null;
  _secondaryPanel = null;
  _gutter = null;
}
