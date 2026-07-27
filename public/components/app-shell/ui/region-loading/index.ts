// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Region Loading — Modular Index
 * @version 1.1.0-MODULAR
 * @module app-shell/ui/region-loading
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./core.js (all loading operations)
 * @requires ./dom-helpers.js (DOM utilities)
 * 
 * @provides VERSION, MODULE_ID
 * @provides isLoading, setLoading, startLoading, endLoading, setSkeleton
 * @provides setMultipleLoading, endAllLoading
 * @provides getLoadingState, getLoadingRegions, isAnyLoading
 * @provides configure, getConfig, subscribe, getMetrics, healthCheck, info
 * 
 * @description
 * Region loading state management orchestrator.
 * Manages skeleton loaders, overlays, and loading indicators for regions.
 * 
 * @example
 * import RegionLoading from './index.js';
 * RegionLoading.setLoading('main', true, { skeleton: true });
 * if (RegionLoading.isAnyLoading()) console.log('Loading...');
 * ============================================================================
 */
'use strict';

import {

  isLoading as _isLoading,
  setLoading as _setLoading,
  startLoading as _startLoading,
  endLoading as _endLoading,
  setSkeleton as _setSkeleton,
  setMultipleLoading as _setMultipleLoading,
  endAllLoading as _endAllLoading,
  getLoadingState as _getLoadingState,
  getLoadingRegions as _getLoadingRegions,
  isAnyLoading as _isAnyLoading
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-MODULAR';
export const MODULE_ID = 'app-shell-region-loading';

const _state = {
  loadingState: {},
  metrics: { loadingStarts: 0, loadingEnds: 0, errors: 0 },
  subscribers: [] as DynObj,
  notify(event: string, data: DynObj) {
    for (let i = 0; i < this.subscribers.length; i++) {
      try { this.subscribers[i](event, data); } catch (e) {}
    }
  }
};

const _config = { defaultTimeout: 30000, showSpinner: true };

export function isLoading(regionName: string) { return _isLoading(regionName, _state); }
export function setLoading(regionName: string, loading: boolean, options: DynObj) { return _setLoading(regionName, loading, options, _state); }
export function startLoading(regionName: string, options: DynObj) { return _startLoading(regionName, options, _state); }
export function endLoading(regionName: string) { return _endLoading(regionName, _state); }
export function setSkeleton(regionName: string, loading: boolean) { return _setSkeleton(regionName, loading, _state); }
export function setMultipleLoading(loadingMap: DynObj, options: DynObj) { return _setMultipleLoading(loadingMap, options, _state); }
export function endAllLoading() { return _endAllLoading(_state); }
export function getLoadingState() { return _getLoadingState(_state); }
export function getLoadingRegions() { return _getLoadingRegions(_state); }
export function isAnyLoading() { return _isAnyLoading(_state); }

export function configure(options: DynObj) {
  if (options.defaultTimeout !== undefined) _config.defaultTimeout = options.defaultTimeout;
  if (options.showSpinner !== undefined) _config.showSpinner = options.showSpinner;
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

export function getMetrics() { return Object.assign({}, _state.metrics); }

export function healthCheck() {
  const loadingRegions = getLoadingRegions();
  const checks = {
    noStuckLoading: loadingRegions.length < 5,
    lowErrorRate: _state.metrics.errors < _state.metrics.loadingStarts * 0.1
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/2`,
    checks,
    currentlyLoading: loadingRegions,
    metrics: getMetrics(),
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
    loadingState: getLoadingState(),
    currentlyLoading: getLoadingRegions(),
    metrics: getMetrics(),
    subscriberCount: _state.subscribers.length,
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  isLoading,
  setLoading,
  startLoading,
  endLoading,
  setSkeleton,
  setMultipleLoading,
  endAllLoading,
  getLoadingState,
  getLoadingRegions,
  isAnyLoading,
  configure,
  getConfig,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
