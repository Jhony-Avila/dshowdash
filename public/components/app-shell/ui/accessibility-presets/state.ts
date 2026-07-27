/**
 * @file Accessibility Presets - State
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/accessibility-presets/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone state module)
 * @provides activePresets, customSettings, appliedCssVars, subscribers, config, metrics
 * @provides incrementMetric, getMetrics, resetCustomSettings
 * 
 * @description
 * Centralized state for accessibility presets module.
 * Tracks active presets, custom settings, applied CSS variables, and metrics.
 * 
 * @example
 * import { activePresets, config, getMetrics } from './state.js';
 * activePresets.add('high-contrast');
 * console.log(getMetrics());
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.state';

export const activePresets = new Set();
export const customSettings = {};
export const appliedCssVars = {};
export const subscribers: DynObj[] = [];

export const config = {
  persistPresets: true,
  autoDetectSystem: true,
  storageKey: 'app-shell-a11y-presets'
};

export const metrics = {
  presetChanges: 0,
  customizations: 0
};

export function incrementMetric(key: string) {
  if (metrics.hasOwnProperty(key)) (metrics as DynObj)[key]++;
}

export function getMetrics() {
  return {
    presetChanges: metrics.presetChanges,
    customizations: metrics.customizations,
    activePresets: activePresets.size,
    customSettings: Object.keys(customSettings).length,
    appliedCssVars: Object.keys(appliedCssVars).length
  };
}

export function resetCustomSettings() {
  for (let key in customSettings) {
    delete (customSettings as DynObj)[key];
  }
}
