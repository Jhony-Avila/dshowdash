// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Theme Integration — State Management
 * @version 1.3.0-FIX-MISSING-EXPORTS
 * @module app-shell/adapters/theme-integration/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides _state, _config, _subscribers (aliases for internal access)
 * @provides getCurrentTheme, setCurrentTheme, getResolvedTheme, setResolvedTheme
 * @provides getSystemPreference, setSystemPreference, getMediaQuery, setMediaQuery
 * @provides isInitialized, setInitialized, getListeners, addListener, removeListener
 * @provides getRegionThemes, setRegionTheme, deleteRegionTheme, hasRegionTheme
 * @provides getMetrics, incrementMetric, notifySubscribers, getConfig
 * 
 * @description
 * Centralized state for theme integration.
 * v1.3.0: Added _state, _config, notifySubscribers, getConfig for theme-engine.js compatibility.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.theme-integration.state';

const state: Record<string, any> = {
  currentTheme: null,
  resolvedTheme: null,
  systemPreference: null,
  mediaQuery: null,
  initialized: false,
  listeners: [],
  subscribers: [],
  regionThemes: {},
  metrics: {
    themeChanges: 0,
    systemPreferenceChanges: 0,
    errors: 0
  }
};

const config: Record<string, any> = {
  defaultTheme: 'system',
  storageKey: 'app-shell-theme',
  transitionDuration: 200,
  respectSystemPreference: true
};

// Export aliases for direct access
export const _state = state;
export const _config = config;
export const _subscribers = state.subscribers;

// Theme state accessors
export function getCurrentTheme() {
  return state.currentTheme;
}

export function setCurrentTheme(theme: DynObj) {
  state.currentTheme = theme;
}

export function getResolvedTheme() {
  return state.resolvedTheme;
}

export function setResolvedTheme(theme: DynObj) {
  state.resolvedTheme = theme;
}

export function getSystemPreference() {
  return state.systemPreference;
}

export function setSystemPreference(pref: DynObj) {
  state.systemPreference = pref;
}

export function getMediaQuery() {
  return state.mediaQuery;
}

export function setMediaQuery(mq: DynObj) {
  state.mediaQuery = mq;
}

export function isInitialized() {
  return state.initialized;
}

export function setInitialized(val: DynObj) {
  state.initialized = !!val;
}

// Listeners
export function getListeners() {
  return state.listeners;
}

export function addListener(listener: DynObj) {
  state.listeners.push(listener);
}

export function removeListener(listener: DynObj) {
  const idx = state.listeners.indexOf(listener);
  if (idx >= 0) state.listeners.splice(idx, 1);
}

// Region themes
export function getRegionThemes() {
  return state.regionThemes;
}

export function setRegionTheme(regionName: string, theme: DynObj) {
  state.regionThemes[regionName] = theme;
}

export function deleteRegionTheme(regionName: string) {
  delete state.regionThemes[regionName];
}

export function hasRegionTheme(regionName: string) {
  return !!state.regionThemes[regionName];
}

// Metrics
export function getMetrics() {
  return {
    themeChanges: state.metrics.themeChanges,
    systemPreferenceChanges: state.metrics.systemPreferenceChanges,
    errors: state.metrics.errors
  };
}

export function incrementMetric(name: string) {
  if (state.metrics[name] !== undefined) {
    state.metrics[name]++;
  }
}

// Config accessors
export function getConfig() {
  return Object.assign({}, config);
}

export function setConfigValue(key: string, value: DynObj) {
  if (config.hasOwnProperty(key)) {
    config[key] = value;
  }
}

// Subscribers
export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < state.subscribers.length; i++) {
    try {
      state.subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
  // Also notify listeners
  for (let j = 0; j < state.listeners.length; j++) {
    try {
      state.listeners[j](event, data);
    } catch (e) {
      // Ignore listener errors
    }
  }
}

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  state.subscribers.push(callback);
  return () => {
    const idx = state.subscribers.indexOf(callback);
    if (idx >= 0) state.subscribers.splice(idx, 1);
  };
}

export default state;
