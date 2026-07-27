/**
 * @file Region Visibility — State Management
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/core/region-visibility/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (DEFAULT_CONFIG)
 * 
 * @provides _state, _config, getMetrics, incrementMetric, notifySubscribers, getDuration
 * 
 * @description
 * State management for region visibility including metrics tracking
 * and subscriber notifications.
 * ============================================================================
 */
'use strict';

import { DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-visibility.state';

export const _state = {
  visibility: {},
  isFullscreen: false,
  stylesInjected: false,
  subscribers: [] as DynObj
};

export const _config = {
  animationDuration: DEFAULT_CONFIG.animationDuration,
  defaultAnimate: DEFAULT_CONFIG.defaultAnimate
};

const _metrics = {
  shows: 0,
  hides: 0,
  toggles: 0,
  errors: 0
};

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function incrementMetric(name: string) {
  if ((_metrics as DynObj)[name] !== undefined) {
    (_metrics as DynObj)[name]++;
  }
}

export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < _state.subscribers.length; i++) {
    try {
      _state.subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
}

export function getDuration() {
  return _config.animationDuration;
}
