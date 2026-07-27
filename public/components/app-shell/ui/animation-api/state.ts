// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Animation API — State Management
 * @version 1.1.0-FIX-EXPORTS
 * @module app-shell/ui/animation-api/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (EASINGS)
 * 
 * @provides activeAnimations, customAnimations, subscribers, animationId
 * @provides config, metrics, incrementMetric, getMetrics, notifySubscribers
 * 
 * @description
 * Centralized state for Animation API.
 * v1.1.0: Added incrementMetric, getMetrics, notifySubscribers for core.js compatibility.
 * ============================================================================
 */
'use strict';

import { EASINGS } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.state';

export const activeAnimations = new Map();
export const customAnimations = new Map();
export const subscribers: DynObj[] = [];
export const animationId = { value: 0 };

export const config = {
  defaultDuration: 300,
  defaultEasing: EASINGS.EASE_OUT,
  respectReducedMotion: true,
  defaultFill: 'forwards'
};

export const metrics = {
  animationsStarted: 0,
  animationsCompleted: 0,
  animationsCancelled: 0,
  errors: 0
};

export function incrementMetric(name: string, value?: DynObj) {
  if ((metrics as DynObj)[name] !== undefined) {
    (metrics as DynObj)[name] += (value || 1);
  }
}

export function getMetrics() {
  return Object.assign({}, metrics);
}

export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
}

export function resetMetrics() {
  metrics.animationsStarted = 0;
  metrics.animationsCompleted = 0;
  metrics.animationsCancelled = 0;
  metrics.errors = 0;
}
