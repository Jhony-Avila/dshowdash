// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Keyboard Navigation Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP, DEFAULT_CONFIG f...
//   _instance, setInstance, getConfig, setConfig, isInitialized, setIsInitialized...
//   _log, _emit from ./helpers/logger.js
//   focusFirst, focusLast, focusNext, focusPrevious, focusByIndex from ./navigati...
//   registerGroup, unregisterGroup, setActiveGroup from ./groups/manager.js
//   _handleGlobalKeyDown, registerShortcut, unregisterShortcut, getShortcuts, ena...
//
// PROVIDES:
//   createKeyboardNavigationManager() — exported function
//   getKeyboardNavigationManager() — exported function
//   init() — exported function
//   destroy() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   registerGroup — exported value
//   unregisterGroup — exported value
//   setActiveGroup — exported value
//   focusFirst — exported value
//   focusLast — exported value
//   focusNext — exported value
//   focusPrevious — exported value
//   focusByIndex — exported value
//   registerShortcut — exported value
//   unregisterShortcut — exported value
//   getShortcuts — exported value
//   enableShortcut — exported value
//   disableShortcut — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP, DEFAULT_CONFIG } from './constants.js';
import {
  _instance, setInstance, getConfig, setConfig,
  isInitialized, setIsInitialized,
  getNavigationGroups, getActiveGroup as getActiveGroupState,
  getGlobalShortcuts, _listeners, getMetrics
} from './state.js';
import { _log, _emit } from './helpers/logger.js';
import { focusFirst, focusLast, focusNext, focusPrevious, focusByIndex } from './navigation/focus.js';
import { registerGroup, unregisterGroup, setActiveGroup } from './groups/manager.js';
import { _handleGlobalKeyDown, registerShortcut, unregisterShortcut, getShortcuts, enableShortcut, disableShortcut } from './shortcuts/manager.js';

export function createKeyboardNavigationManager(options: Record<string, unknown> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  
  _log('info', 'Keyboard Navigation Manager created');
  
  return {
    init,
    destroy,
    registerGroup,
    unregisterGroup,
    setActiveGroup,
    getActiveGroup: getActiveGroupState,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusByIndex,
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    enableShortcut,
    disableShortcut,
    subscribe,
    healthCheck,
    info
  };
}

export function getKeyboardNavigationManager(options: Record<string, unknown> = {}) {
  if (!_instance) {
    setInstance(createKeyboardNavigationManager(options));
  }
  return _instance;
}

export function init() {
  if (isInitialized()) return true;
  
  document.addEventListener('keydown', _handleGlobalKeyDown);
  
  setIsInitialized(true);
  _emit('initialized', {});
  _log('info', 'Initialized');
  
  return true;
}

export function destroy() {
  if (!isInitialized()) return true;
  
  document.removeEventListener('keydown', _handleGlobalKeyDown);
  getNavigationGroups().clear();
  getGlobalShortcuts().clear();
  
  setIsInitialized(false);
  _log('info', 'Destroyed');
  
  return true;
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    initialized: isInitialized(),
    hasGroups: getNavigationGroups().size > 0,
    noErrors: metrics.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    groupCount: getNavigationGroups().size,
    shortcutCount: getGlobalShortcuts().size,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    keyCodes: Object.keys(KEY_CODES),
    navigationModes: Object.values(NAVIGATION_MODES),
    focusWrapModes: Object.values(FOCUS_WRAP),
    config: {
      mode: config.mode,
      orientation: config.orientation,
      wrapBehavior: config.wrapBehavior,
      enableTypeahead: config.enableTypeahead
    },
    isInitialized: isInitialized(),
    registeredGroups: Array.from(getNavigationGroups().keys()),
    registeredShortcuts: getShortcuts()
  };
}

// Re-exports
export { registerGroup, unregisterGroup, setActiveGroup };
export { focusFirst, focusLast, focusNext, focusPrevious, focusByIndex };
export { registerShortcut, unregisterShortcut, getShortcuts, enableShortcut, disableShortcut };
