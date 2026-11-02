// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-global-api
// PURPOSE: Global State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./logger.js
//   from /core/version.js
//
// PROVIDES:
//   MODULE_ID
//   VERSION
//   registerGlobal
//   GlobalStateFacade
//   unregisterGlobal
//   getManager
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as LOGGER_VERSION } from './logger.js';

export const MODULE_ID = 'global-state-global-api';
import { VERSION } from '/core/version.js'; export { VERSION };

// Cache interno do manager para acesso via facade
let _manager: Record<string, unknown> | null = null;

export function registerGlobal(manager: Record<string, unknown>) {
  _manager = manager;

  // DevTools - exposição legítima para debugging
  window.__dev = window.__dev || {};
  window.__dev.globalState = {
    getVersion() { return LOGGER_VERSION; },
    info() { return (manager as any).info(); },
    healthCheck() { return (manager as any).healthCheck(); },
    getState() { return (manager as any).store.getState(); },
    getSession() { return (manager as any).store.select((manager as any).selectors.getSession); },
    getAuthContext() { return (manager as any).store.select((manager as any).selectors.getAuthContext); },
    getSubscriberCount() { return (manager as any).store.getSubscriberCount(); },
    getEventLog() { return (manager as any).telemetry.getEventLog(); },
    getRecentEvents(n: number) { return (manager as any).telemetry.getRecentEvents(n); },
    getTrackerStats() { return (manager as any).telemetry.getTrackerStats(); },
    retryAuthIntegration() { return (manager as any).retryAuthIntegration(); },
    exportState() { return (manager as any).store.exportState(); },
    debug: (manager as any).debug
  };
}

// Facade pública - será exposta pelo bootstrap via windowAdapter.expose('GlobalState', GlobalStateFacade)
export const GlobalStateFacade = {
  getState() { return _manager ? (_manager as any).store.getState() : null; },
  dispatch(action: unknown) { return _manager ? (_manager as any).store.dispatch(action) : null; },
  subscribe(cb: (...args: unknown[]) => void, sel: unknown, opts: unknown) { return _manager ? (_manager as any).store.subscribe(cb, sel, opts) : null; },
  select(sel: unknown) { return _manager ? (_manager as any).store.select(sel) : null; },
  get(path: string) { return _manager ? (_manager as any).store.get(path) : null; },
  has(path: string) { return _manager ? (_manager as any).store.has(path) : false; },
  onChange(path: string, cb: (...args: unknown[]) => void, opts: unknown) { return _manager ? (_manager as any).store.onChange(path, cb, opts) : null; },
  get actions() { return _manager ? (_manager as any).actions : null; },
  get selectors() { return _manager ? (_manager as any).selectors : null; },
  getSession() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getSession) : null; },
  getUser() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getUser) : null; },
  getUserId() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getUserId) : null; },
  getAuthContext() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getAuthContext) : null; },
  isAuthenticated() { return _manager ? (_manager as any).store.select((_manager as any).selectors.isAuthenticated) : false; },
  getNavigation() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getNavigation) : null; },
  getCurrentRoute() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getCurrentRoute) : null; },
  getActivePanel() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getActivePanel) : null; },
  getVirtualRoute() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getVirtualRoute) : null; },
  getPreferences() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getPreferences) : null; },
  getTheme() { return _manager ? (_manager as any).store.select((_manager as any).selectors.getTheme) : null; },
  isLoading() { return _manager ? (_manager as any).store.select((_manager as any).selectors.isLoading) : false; },
  isOnline() { return _manager ? (_manager as any).store.select((_manager as any).selectors.isOnline) : false; },
  version: LOGGER_VERSION,
  info() { return _manager ? (_manager as any).info() : null; },
  healthCheck() { return _manager ? (_manager as any).healthCheck() : null; }
};

export function unregisterGlobal() {
  _manager = null;
  if (window.__dev) delete window.__dev.globalState;
}

export function getManager() { return _manager; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, registerGlobal, unregisterGlobal, GlobalStateFacade, getManager, info, healthCheck };
