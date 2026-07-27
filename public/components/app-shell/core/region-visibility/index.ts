// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Region Visibility — Modular Index
 * @version 1.1.0-MODULAR
 * @module app-shell/core/region-visibility
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (VERSION, MODULE_ID, REGION_MAP)
 * @requires ./core.js (all visibility operations)
 * @requires ./state.js (_state, _config, getMetrics)
 * @requires ./styles.js (injectStyles)
 * 
 * @provides VERSION, MODULE_ID
 * @provides isVisible, show, hide, toggle, setVisibility
 * @provides enterFullscreen, exitFullscreen, toggleFullscreen, isFullscreenMode
 * @provides getVisibilityState, resetVisibility
 * @provides configure, getConfig, subscribe, getMetrics, healthCheck, info
 * 
 * @browserAPI classList, CSS transitions
 * 
 * @description
 * Region visibility management orchestrator. Controls show/hide with
 * animations and fullscreen mode support.
 * 
 * @example
 * import RegionVisibility from './index.js';
 * RegionVisibility.hide('sidebar', { animate: true });
 * RegionVisibility.enterFullscreen();
 * ============================================================================
 */
'use strict';

import { VERSION, MODULE_ID, REGION_MAP } from './constants.js';
import {
  isVisible as _isVisible,
  show as _show,
  hide as _hide,
  toggle as _toggle,
  setVisibility as _setVisibility,
  enterFullscreen as _enterFullscreen,
  exitFullscreen as _exitFullscreen,
  toggleFullscreen as _toggleFullscreen,
  isFullscreenMode as _isFullscreenMode,
  getVisibilityState as _getVisibilityState,
  resetVisibility as _resetVisibility
} from './core.js';
import { _state, _config, getMetrics } from './state.js';
import { injectStyles } from './styles.js';

export { VERSION, MODULE_ID };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// Auto-inject CSS
if (typeof document !== 'undefined') {
  injectStyles();
}

export function isVisible(regionName: string) { return _isVisible(regionName); }
export function show(regionName: string, options: DynObj) { return _show(regionName, options); }
export function hide(regionName: string, options: DynObj) { return _hide(regionName, options); }
export function toggle(regionName: string, options: DynObj) { return _toggle(regionName, options); }
export function setVisibility(visibilityMap: DynObj, options: DynObj) { return _setVisibility(visibilityMap, options); }
export function enterFullscreen() { return _enterFullscreen(); }
export function exitFullscreen() { return _exitFullscreen(); }
export function toggleFullscreen() { return _toggleFullscreen(); }
export function isFullscreenMode() { return _isFullscreenMode(); }
export function getVisibilityState() { return _getVisibilityState(); }
export function resetVisibility() { return _resetVisibility(); }

export function configure(options: DynObj) {
  if (options.animationDuration !== undefined) _config.animationDuration = options.animationDuration;
  if (options.defaultAnimate !== undefined) (_config as any).defaultAnimate = !!options.defaultAnimate;
}

export function getConfig() { return Object.assign({}, _config); }

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _state.subscribers.push(callback);
  return () => {
    const idx = _state.subscribers.indexOf(callback);
    if (idx >= 0) _state.subscribers.splice(idx, 1);
  };
}

export { getMetrics };


export function healthCheck() {
  const metrics = getMetrics();
  
  const checks = {
    stylesInjected: _state.stylesInjected,
    lowErrorRate: metrics.errors < (metrics.shows + metrics.hides) * 0.1 || metrics.errors < 3
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    visibilityState: getVisibilityState(),
    isFullscreen: isFullscreenMode(),
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    regions: Object.keys(REGION_MAP),
    visibilityState: getVisibilityState(),
    isFullscreen: isFullscreenMode(),
    metrics: getMetrics(),
    subscriberCount: _state.subscribers.length,
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  isVisible,
  show,
  hide,
  toggle,
  setVisibility,
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  isFullscreenMode,
  getVisibilityState,
  resetVisibility,
  configure,
  getConfig,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
