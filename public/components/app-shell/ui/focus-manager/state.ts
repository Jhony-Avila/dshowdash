// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Focus Manager — State Management
 * @version 1.1.0-FIX-EXPORTS
 * @module app-shell/ui/focus-manager/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides focusHistory, savedFocus, focusTraps, focusGuards, subscribers
 * @provides currentFocus, config, metrics
 * @provides incrementMetric, notifySubscribers, resetMetrics
 * 
 * @description
 * Centralized state for Focus Manager.
 * v1.1.0: Added currentFocus, incrementMetric, notifySubscribers for core.js compatibility.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.state';

export const focusHistory: DynObj[] = [];
export const savedFocus = new Map();
export const focusTraps = new Map();
export const focusGuards = new Map();
export const subscribers: DynObj[] = [];

export const currentFocus: any = {
  element: null,
  timestamp: null,
  source: null
};

export const config = {
  historyLimit: 50,
  announceOnFocus: true,
  scrollIntoView: true,
  preventScroll: false,
  focusDelay: 0
};

export const metrics = {
  focusChanges: 0,
  trapsActivated: 0,
  restores: 0,
  errors: 0
};

export function incrementMetric(name: string) {
  if ((metrics as DynObj)[name] !== undefined) {
    (metrics as DynObj)[name]++;
  }
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
  metrics.focusChanges = 0;
  metrics.trapsActivated = 0;
  metrics.restores = 0;
  metrics.errors = 0;
}

export function getMetrics() {
  return Object.assign({}, metrics);
}
