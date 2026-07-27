/**
 * @file Service Worker Manager - Public API
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/service-worker-manager/api
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (VERSION, MODULE_ID)
 * @requires ./state.js (_state, _subscribers, getConfig, setConfigValue, getMetrics)
 * @requires ./registration/manager.js (isSupported)
 * 
 * @provides isRegistered, isControlling, getState, getRegistration
 * @provides configure, subscribe, healthCheck, info, getConfig
 * 
 * @browserAPI navigator.serviceWorker.controller
 * 
 * @description
 * Public API for service worker manager. Provides state queries,
 * configuration, subscription, and health check functionality.
 * 
 * @example
 * import { isRegistered, configure, healthCheck } from './api.js';
 * configure({ updateStrategy: 'prompt' });
 * if (isRegistered()) console.log(healthCheck());
 * ============================================================================
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { _state, _subscribers, getConfig, setConfigValue, getMetrics } from './state.js';
import { isSupported } from './registration/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function isRegistered() {
  return !!_state.registration;
}

export function isControlling() {
  return !!navigator.serviceWorker.controller;
}

export function getState() {
  return {
    supported: _state.supported,
    state: _state.state,
    updateAvailable: _state.updateAvailable,
    isControlling: isControlling(),
    error: _state.error
  };
}

export function getRegistration() {
  return _state.registration;
}

export function configure(options: DynObj) {
  if (options.swPath !== undefined) setConfigValue('swPath', options.swPath);
  if (options.scope !== undefined) setConfigValue('scope', options.scope);
  if (options.updateStrategy !== undefined) setConfigValue('updateStrategy', options.updateStrategy);
  if (options.checkInterval !== undefined) setConfigValue('checkInterval', Math.max(60000, options.checkInterval));
  if (options.autoRegister !== undefined) setConfigValue('autoRegister', !!options.autoRegister);
}

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  
  _subscribers.push(callback);
  
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

export function healthCheck() {
  const checks = {
    supported: isSupported(),
    registered: isRegistered(),
    noErrors: !_state.error,
    controlling: isControlling()
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  let status = 'HEALTHY';
  if (!checks.supported) status = 'DEGRADED';
  else if (passed < 3) status = 'DEGRADED';
  
  return {
    status,
    score: `${passed}/${keys.length}`,
    checks,
    state: _state.state,
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
    supported: isSupported(),
    state: getState(),
    config: getConfig(),
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}

// Re-export getConfig
export { getConfig };

